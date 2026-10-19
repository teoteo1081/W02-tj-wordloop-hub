"""Explicit metadata writers and one-use tool transactions; gate.py never calls these."""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
import stat
import uuid

from core import (VERSION, GateError, canonical, claims_for, digest, evaluate, gate,
                  git, identifier, read_records, scope_paths, snapshot,
                  validate_claim, validate_record)


def durable_json(path, value, exclusive=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    if exclusive:
        # A crash may leave a partial file. The reader requires a valid hash and
        # complete schema, so such a record cannot masquerade as a checkpoint.
        with path.open("x", encoding="utf-8", newline="\n") as f:
            f.write(canonical(value) + "\n")
            f.flush()
            os.fsync(f.fileno())
        path.chmod(stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
    else:
        temporary = path.with_name(path.name + "." + uuid.uuid4().hex + ".tmp")
        try:
            with temporary.open("x", encoding="utf-8", newline="\n") as f:
                f.write(canonical(value) + "\n")
                f.flush()
                os.fsync(f.fileno())
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)


def load_json(path):
    try:
        return json.loads(path.read_text("utf-8"))
    except (OSError, ValueError) as e:
        raise GateError(f"missing/invalid control state: {path.name}") from e


def ack_path(repo, session):
    if not session or len(session) > 200:
        raise GateError("session identifier required (max 200 characters)")
    return repo.control / digest(session) / "ack.json"


def acquire(repo, owner):
    repo.control.mkdir(parents=True, exist_ok=True)
    lock = repo.control / "transaction.lock"
    try:
        with lock.open("x", encoding="utf-8") as f:
            f.write(canonical(owner))
            f.flush()
            os.fsync(f.fileno())
    except FileExistsError:
        raise GateError("another transaction is active or interrupted; inspect pending state") from None


def release(repo):
    (repo.control / "transaction.lock").unlink(missing_ok=True)


def warning_codes(report):
    return sorted({r["code"] for r in report["reasons"] if r["severity"] == "warning"})


def record(repo, session, task, *, status="partial", phase="checkpoint", terminal=False,
           next_steps=(), task_text="", new_claims=(), state=None, report=None):
    if not session or not task:
        raise GateError("session and task are required")
    if state is None:
        saved = load_json(ack_path(repo, session)) if ack_path(repo, session).exists() else {}
        if saved.get("task_id") != task or saved.get("worktree") != repo.worktree:
            saved = {}
        state = snapshot(repo, saved.get("scope", []), saved.get("as_of"))
    report = report or evaluate(repo, state, task, session, _locked=True)
    records, _ = read_records(repo)
    own = [r for r in records if r["session_id"] == session and r["repo_id"] == repo.id
           and r["worktree"] == repo.worktree]
    prior = max(own, key=lambda r: r["sequence"]) if own else None
    claims = {c["claim_id"]: c for c in claims_for(records, repo, task)}
    for claim in new_claims:
        validate_claim(claim)
        if (claim["repo_id"], claim["worktree"], claim["task_id"]) != (repo.id, repo.worktree, task):
            raise GateError("claim must belong to the current repo/worktree/task")
        if claim["claim_id"] in claims and claims[claim["claim_id"]] != claim:
            raise GateError("claims are append-only; conflicting redefinition denied")
        claims[claim["claim_id"]] = claim
    if new_claims:
        report = evaluate(repo, state, task, session, _locked=True, _claims=[claims[k] for k in sorted(claims)])
    local = state["worktrees"][repo.worktree]
    base = prior["base_sha"] if prior else local["head"]
    commits = git(repo.root, "rev-list", "--reverse", f"{base}..{local['head']}").decode("ascii").splitlines() if base and local["head"] else []
    value = {"schema_version": VERSION, "record_id": uuid.uuid4().hex,
             "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
             "session_id": session, "sequence": prior["sequence"] + 1 if prior else 1,
             "repo_id": repo.id, "worktree": repo.worktree, "task_id": task,
             "task": task_text or (prior["task"] if prior and prior["task_id"] == task else task),
             "status": status, "phase": phase, "terminal": terminal,
             "base_sha": base, "head_sha": local["head"], "branch": local["branch"],
             "state_hash": report["state_hash"], "dirty": local["dirty"],
             "operations": local["operations"],
             "stash": git(repo.root, "rev-parse", "--verify", "refs/stash", optional=True).decode("ascii").strip(),
             "commits": commits, "next_steps": list(next_steps),
             "claims": [claims[k] for k in sorted(claims)],
             "claim_results": report["claim_results"],
             "supersedes": prior["record_id"] if prior else None}
    value["record_hash"] = digest(value)
    validate_record(value)
    name = (value["created_at"].replace(":", "-") + "-" + digest(session)[:16]
            + f"-{value['sequence']:06d}-{value['record_id']}.json")
    durable_json(repo.records / name, value, exclusive=True)
    return value


def acknowledge(repo, session, task, token, touch, accepts=(), as_of=None):
    if not isinstance(session, str) or not session or not isinstance(task, str) or not task:
        raise GateError("nonempty session and task are required")
    owner = {"session_id": session, "worktree": repo.worktree, "operation": "ack"}
    acquire(repo, owner)
    try:
        if (repo.control / "pending.json").exists():
            raise GateError("pending operation requires explicit recovery")
        state, report = gate(repo, touch, task, session, as_of, _locked=True)
        if report["exit_code"] == 20:
            raise GateError("gate blocks acknowledgement")
        if report["state_hash"] != token:
            raise GateError("stale token or different task/scope")
        if set(accepts) != set(warning_codes(report)):
            raise GateError("ack requires exactly the current warning codes")
        # Do not write a checkpoint here: it could change gate reasons and hence
        # invalidate the token that has just been acknowledged.
        ack = {"schema_version": VERSION, "repo_id": repo.id, "worktree": repo.worktree,
               "session_id": session, "task_id": task, "scope": state["scope"],
               "as_of": as_of, "token": token, "warnings": warning_codes(report),
               "ready": True, "state": state}
        durable_json(ack_path(repo, session), ack)
        return {k: v for k, v in ack.items() if k != "state"}
    finally:
        release(repo)


def begin(repo, session, tool_id, tool_name, tool_input, paths):
    if not isinstance(tool_id, str) or not tool_id:
        raise GateError("tool_use_id required")
    owner = {"session_id": session, "worktree": repo.worktree, "tool_use_id": tool_id}
    acquire(repo, owner)
    reserved = False
    try:
        if (repo.control / "pending.json").exists():
            raise GateError("pending operation requires explicit recovery")
        ack = load_json(ack_path(repo, session))
        if not ack.get("ready") or (ack.get("repo_id"), ack.get("worktree"), ack.get("session_id")) != (repo.id, repo.worktree, session):
            raise GateError("ack missing, consumed, or belongs to another worktree")
        paths = scope_paths(repo, paths)
        for path in paths:
            repo.path(path, regular=True)
        if not set(paths).issubset(set(ack["scope"])):
            raise GateError("tool path is outside acknowledged scope")
        state, report = gate(repo, ack["scope"], ack["task_id"], session, ack["as_of"], _locked=True)
        if report["exit_code"] == 20 or report["state_hash"] != ack["token"]:
            raise GateError("gate blocked or state changed since acknowledgement")
        pending = {**owner, "task_id": ack["task_id"], "scope": ack["scope"],
                   "paths": paths, "as_of": ack["as_of"], "before": state,
                   "warnings": warning_codes(report),
                   "fingerprint": digest({"tool": tool_name, "input": tool_input})}
        used = repo.control / "used" / digest(session) / (digest(tool_id) + ".json")
        if used.exists():
            raise GateError("tool_use_id has already been consumed; replay denied")
        durable_json(used, {**owner, "fingerprint": pending["fingerprint"]}, exclusive=True)
        # Reserve durably before any writer runs. If a later write fails, keep
        # the reservation and lock: a half-prepared transaction is not reusable.
        durable_json(repo.control / "pending.json", pending)
        reserved = True
        ack["ready"] = False
        durable_json(ack_path(repo, session), ack)
        record(repo, session, ack["task_id"], phase="before_tool", state=state, report=report)
        return pending
    finally:
        if not reserved:
            release(repo)


def outside_scope(state, current, paths):
    copy = json.loads(canonical(state))
    wr = copy["worktrees"][current]
    allowed = {os.path.normcase(p) for p in paths}
    wr["files"] = {p: v for p, v in wr["files"].items() if os.path.normcase(p) not in allowed}
    wr["dirty"] = [p for p in wr["dirty"] if os.path.normcase(p) not in allowed]
    wr.pop("status")
    return copy


def finish(repo, session, tool_id, tool_name, tool_input, *, failed=False):
    path = repo.control / "pending.json"
    pending = load_json(path)
    lock = load_json(repo.control / "transaction.lock")
    identity = (session, repo.worktree, tool_id)
    if identity != (pending.get("session_id"), pending.get("worktree"), pending.get("tool_use_id")) or any(lock.get(k) != pending.get(k) for k in ("session_id", "worktree", "tool_use_id")):
        raise GateError("post-tool event does not own pending operation")
    if pending["fingerprint"] != digest({"tool": tool_name, "input": tool_input}):
        raise GateError("post-tool input differs from reserved tool call")
    ack = load_json(ack_path(repo, session))
    state = snapshot(repo, pending["scope"], pending["as_of"])
    for name in pending["paths"]:
        repo.path(name, regular=True)
    valid = outside_scope(state, repo.worktree, pending["paths"]) == outside_scope(pending["before"], repo.worktree, pending["paths"])
    # Leave pending intact on partial failure, unexpected changes, or any
    # checkpoint/evaluation error. Nothing silently rolls back tool side effects.
    record(repo, session, pending["task_id"], status="blocked" if failed or not valid else "partial",
           phase="tool_failed" if failed else "after_tool", state=state)
    if failed or not valid:
        raise GateError("tool failed or state changed outside scope; inspect and recover pending operation")
    path.unlink()
    try:
        state, report = gate(repo, pending["scope"], pending["task_id"], session, pending["as_of"], _locked=True)
        if report["exit_code"] == 20 or not set(warning_codes(report)).issubset(pending["warnings"]):
            raise GateError("post-tool gate blocked or introduced new warnings; review required")
        ack.update(token=report["state_hash"], warnings=warning_codes(report), state=state, ready=True)
        durable_json(ack_path(repo, session), ack)
    except BaseException:
        durable_json(path, pending)
        raise
    release(repo)
    return {"state_hash": ack["token"], "ready": True}


def checkpoint(repo, session, task, **kwargs):
    acquire(repo, {"session_id": session, "worktree": repo.worktree, "operation": "checkpoint"})
    try:
        if (repo.control / "pending.json").exists():
            raise GateError("cannot finish session while an operation is pending")
        return record(repo, session, task, **kwargs)
    finally:
        release(repo)


def recover(repo, session, *, reviewed=False):
    """Explicit operator recovery; deliberately NOT allowed through the shell hook."""
    if not reviewed:
        raise GateError("recovery requires --reviewed after inspecting the stopped writer")
    pending_path = repo.control / "pending.json"
    lock_path = repo.control / "transaction.lock"
    if not pending_path.exists() and not lock_path.exists():
        raise GateError("no interrupted operation to recover")
    if pending_path.exists():
        pending = load_json(pending_path)
    else:
        try:
            pending = load_json(lock_path)
        except GateError:
            # A partially written lock has no usable owner. Explicit --reviewed
            # means an operator established there is no live writer in this repo.
            pending = {"worktree": repo.worktree, "session_id": session}
    if pending.get("worktree") != repo.worktree:
        raise GateError("recover from the owning worktree")
    # The operator must establish no tool process is running. Do not use an age
    # threshold or a hook PID (a hook exits while the real writer is still live).
    state = snapshot(repo, pending.get("scope", []), pending.get("as_of"))
    record(repo, session, pending.get("task_id") or "recovery", status="blocked", phase="operator_recovery",
           state=state, next_steps=["Run gate and acknowledge a fresh token before writing."])
    ack = ack_path(repo, pending["session_id"])
    if ack.exists():
        value = load_json(ack)
        value["ready"] = False
        durable_json(ack, value)
    pending_path.unlink(missing_ok=True)
    release(repo)
    return {"recovered": True, "ack_required": True}
