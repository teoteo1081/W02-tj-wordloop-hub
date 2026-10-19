"""Read-only Git evidence and deterministic handoff gate (Python stdlib only)."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess

VERSION = 1
POLICY = "handoff-gate-v1"
OPERATIONS = ("MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "REBASE_HEAD",
              "rebase-merge", "rebase-apply", "sequencer", "BISECT_LOG")


class GateError(Exception):
    pass


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(",", ":"))


def digest(value):
    return hashlib.sha256(canonical(value).encode("ascii")).hexdigest()


def git(root, *args, optional=False):
    # Do not inherit another session's repository, index or injected git config.
    env = {k: v for k, v in os.environ.items() if not k.upper().startswith("GIT_")}
    env.update(GIT_OPTIONAL_LOCKS="0", GIT_TERMINAL_PROMPT="0",
               GIT_NO_REPLACE_OBJECTS="1", GIT_PAGER="cat")
    command = [shutil.which("git") or "git", "-c", "core.fsmonitor=false",
               "-c", "core.untrackedCache=false", "-C", str(root), *args]
    if args and args[0] == "status":
        prefix = command[:-len(args)]
        config = subprocess.run(prefix + ["config", "--null", "--get-regexp",
                                r"^filter\..*\.(clean|process)$"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=30)
        if config.returncode not in (0, 1):
            raise GateError("cannot inspect Git filters before status")
        drivers = set()
        for entry in config.stdout.split(b"\x00"):
            key, _, value = entry.partition(b"\n")
            if value.strip():
                drivers.add(decode(key.rsplit(b".", 1)[0])[len("filter."):])
        if drivers:
            listed = subprocess.run(prefix + ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=30)
            attrs = subprocess.run(prefix + ["check-attr", "-z", "--stdin", "filter"], input=listed.stdout,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=30)
            if listed.returncode or attrs.returncode:
                raise GateError("cannot inspect active Git filter attributes")
            fields = attrs.stdout.split(b"\x00")
            if any(decode(value) in drivers for value in fields[2::3]):
                raise GateError("external Git clean/process filters are unsupported; status was not run")
            # Inactive globally installed drivers (e.g. LFS) are harmless. Still
            # disable them in this status invocation if attributes change between
            # the check and collection. Concurrent config changes are outside the
            # cooperative-writer contract. Persistent config changes are also
            # included in the final snapshot comparison via config_hash.
            overrides = []
            for driver in sorted(drivers):
                for name, value in (("clean", ""), ("process", ""), ("required", "false")):
                    overrides.extend(["-c", f"filter.{driver}.{name}={value}"])
            command = prefix + overrides + list(args)
    p = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       env=env, timeout=30)
    if p.returncode:
        if optional and p.returncode in (1, 128):
            return b""
        raise GateError(f"git {args[0]} failed ({p.returncode})")
    return p.stdout


def decode(raw):
    return os.fsdecode(raw)


def identifier(path):
    return os.path.normcase(str(Path(path).resolve()))


def path_key(name):
    return os.path.normcase(name.replace("\\", "/")).replace("\\", "/")


def reparse_point(path):
    if os.name != "nt":
        return False
    try:
        return bool(path.lstat().st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)
    except FileNotFoundError:
        return False


class Repo:
    def __init__(self, path="."):
        self.root = Path(decode(git(path, "rev-parse", "--show-toplevel")).strip()).resolve()
        self.common = Path(decode(git(self.root, "rev-parse", "--path-format=absolute",
                                      "--git-common-dir")).strip()).resolve()
        self.gitdir = Path(decode(git(self.root, "rev-parse", "--path-format=absolute", "--git-dir")).strip()).resolve()
        self.id = digest(identifier(self.common))
        self.worktree = identifier(self.root)
        self.records = self.common / "handoff"
        self.control = self.common / "handoff-control"

    def path(self, name, *, regular=False):
        """Accept only exact repo-relative paths; never traverse a symlink/junction."""
        if not isinstance(name, str) or not name or "\x00" in name:
            raise GateError("invalid path")
        name = name.replace("\\", "/")
        p = Path(name)
        if p.is_absolute() or p.drive or ":" in name or any(x in ("", ".", "..") for x in name.split("/")):
            raise GateError("path must be repo-relative without traversal")
        for part in p.parts:
            if part.endswith((".", " ")) or re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)', part, re.I):
                raise GateError("ambiguous/reserved Windows path component")
        if any(x.casefold() == ".git" for x in p.parts):
            raise GateError("Git metadata is outside touch scope")
        target = self.root / p
        for parent in list(target.parents):
            if parent == self.root:
                break
            if parent.is_symlink() or reparse_point(parent):
                raise GateError("symlink/junction parent is unsupported")
        if reparse_point(target):
            raise GateError("Windows reparse points are unsupported")
        if regular and (target.is_symlink() or getattr(target, "is_junction", lambda: False)()):
            raise GateError("operation requires a regular file")
        if regular and target.exists() and not target.is_file():
            raise GateError("operation requires a regular file")
        if regular and target.exists() and target.stat().st_nlink > 1:
            raise GateError("write/read verifier does not support hardlinked files")
        resolved = target.parent.resolve() / target.name if target.is_symlink() else target.resolve()
        try:
            relative = resolved.relative_to(self.root)
        except ValueError:
            raise GateError("resolved path escapes current worktree") from None
        if any(part.casefold() == ".git" for part in relative.parts):
            raise GateError("resolved path targets Git metadata")
        if any(resolved == metadata or resolved.is_relative_to(metadata) for metadata in (self.common, self.gitdir)):
            raise GateError("resolved path targets Git metadata")
        return target


def scope_paths(repo, names):
    out = []
    for name in names:
        path = repo.path(name)
        if path.is_dir() and not path.is_symlink():
            raise GateError("touch scope requires exact file paths, not directories")
        out.append(path_key(path.relative_to(repo.root).as_posix()))
    # Case aliases on Windows must not create two differently scoped paths.
    return sorted(set(out))


def file_state(path):
    try:
        before = path.lstat()
    except FileNotFoundError:
        return {"kind": "missing"}
    if getattr(path, "is_junction", lambda: False)():
        raise GateError("junction is unsupported")
    if os.name == "nt" and before.st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT:
        raise GateError("Windows reparse points are unsupported")
    if stat.S_ISLNK(before.st_mode):
        return {"kind": "symlink", "target": os.readlink(path), "mode": stat.S_IMODE(before.st_mode)}
    if not stat.S_ISREG(before.st_mode):
        raise GateError("non-regular file/submodule is unsupported")
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    after = path.lstat()
    if (before.st_ino, before.st_size, before.st_mtime_ns, before.st_mode) != (
            after.st_ino, after.st_size, after.st_mtime_ns, after.st_mode):
        raise GateError("file changed during snapshot")
    return {"kind": "file", "mode": stat.S_IMODE(after.st_mode), "sha256": h.hexdigest()}


def dirty_paths(raw):
    chunks, out, i = raw.split(b"\x00"), [], 0
    while i < len(chunks):
        item = chunks[i]
        if item.startswith(b"1 "):
            out.append(decode(item.split(b" ", 8)[8]))
        elif item.startswith(b"2 "):
            out.append(decode(item.split(b" ", 9)[9]))
            i += 1
            out.append(decode(chunks[i]))
        elif item.startswith(b"u "):
            out.append(decode(item.split(b" ", 10)[10]))
        elif item.startswith(b"? "):
            out.append(decode(item[2:]))
        i += 1
    return sorted({path_key(p) for p in out})


def worktrees(repo):
    entries = []
    for block in git(repo.root, "worktree", "list", "--porcelain", "-z").split(b"\x00\x00"):
        if not block:
            continue
        fields = {}
        for line in block.split(b"\x00"):
            key, _, value = line.partition(b" ")
            fields[decode(key)] = decode(value)
        if "worktree" in fields:
            if "bare" in fields or "prunable" in fields:
                raise GateError("bare/prunable worktree requires operator review")
            entries.append(fields["worktree"])
    return sorted(entries, key=identifier)


def snapshot_once(repo, touch, as_of):
    refs = decode(git(repo.root, "for-each-ref", "--sort=refname",
                      "--format=%(refname)%00%(objectname)%00%(upstream)"))
    result = {"schema_version": VERSION, "policy": POLICY, "repo_id": repo.id,
              "current": repo.worktree, "scope": touch, "as_of": as_of, "refs": refs,
              "worktrees": {}}
    for root in worktrees(repo):
        wr = Repo(root)
        gd = wr.gitdir
        head = decode(git(root, "rev-parse", "--verify", "HEAD", optional=True)).strip()
        branch = decode(git(root, "symbolic-ref", "--quiet", "--short", "HEAD", optional=True)).strip()
        index = git(root, "ls-files", "--stage", "-z")
        names = set()
        for entry in index.split(b"\x00"):
            if entry:
                meta, name = entry.split(b"\t", 1)
                if meta.startswith(b"160000 "):
                    raise GateError("submodule snapshots are not supported")
                names.add(decode(name))
        names.update(decode(x) for x in git(root, "ls-files", "--others", "--exclude-standard", "-z").split(b"\x00") if x)
        normalised = {path_key(name) for name in names}
        if len(normalised) != len(names):
            raise GateError("case-colliding paths are unsupported")
        names = normalised
        if wr.worktree == repo.worktree:
            names.update(touch)
        files = {name: file_state(wr.path(name)) for name in sorted(names)}
        operations = {}
        for op in OPERATIONS:
            path = gd / op
            if path.is_dir():
                operations[op] = {p.relative_to(path).as_posix(): file_state(p)
                                  for p in sorted(path.rglob("*")) if not p.is_dir()}
            elif path.exists():
                operations[op] = file_state(path)
        status = git(root, "status", "--porcelain=v2", "-z", "--untracked-files=all")
        result["worktrees"][wr.worktree] = {
            "head": head, "branch": branch, "index": decode(index), "files": files,
            "status": decode(status), "dirty": dirty_paths(status), "operations": operations,
            "config_hash": hashlib.sha256(git(root, "config", "--null", "--list", "--includes")).hexdigest(),
            "index_locked": (gd / "index.lock").exists()}
    fetch = repo.common / "FETCH_HEAD"
    result["fetch"] = {"content": file_state(fetch), "mtime_ns": fetch.stat().st_mtime_ns if as_of and fetch.exists() else None}
    return result


def snapshot(repo, touch=(), as_of=None):
    touch = scope_paths(repo, touch)
    if as_of:
        parse_time(as_of)
    # Detect a concurrent change rather than issuing a token from mixed evidence.
    for _ in range(2):
        first = snapshot_once(repo, touch, as_of)
        second = snapshot_once(repo, touch, as_of)
        if first == second:
            return second
    raise GateError("repository changed during snapshot; retry after writers stop")


def parse_time(value):
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.utcoffset() is None:
            raise ValueError()
        return parsed
    except (ValueError, AttributeError):
        raise GateError("as-of requires ISO-8601 UTC/offset") from None


def read_records(repo):
    records, invalid = [], []
    if repo.records.exists():
        for path in sorted(repo.records.glob("*.json")):
            try:
                value = json.loads(path.read_text("utf-8"))
                validate_record(value)
                records.append(value)
            except (ValueError, OSError, KeyError, TypeError, GateError):
                invalid.append(path.name)
    records.sort(key=lambda r: (r["created_at"], r["session_id"], r["sequence"], r["record_id"]))
    return records, invalid


def validate_claim(claim):
    fields = {"claim_id", "kind", "repo_id", "worktree", "task_id", "baseline_head",
              "applies_head", "verifier", "args", "expected"}
    if not isinstance(claim, dict) or set(claim) != fields:
        raise GateError("invalid claim fields")
    if claim["kind"] not in ("historical_evidence", "required_invariant"):
        raise GateError("invalid claim kind")
    if claim["verifier"] not in ("head_equals", "versions_equal"):
        raise GateError("unknown verifier; executable claims are forbidden")
    if any(not isinstance(claim[x], str) for x in fields - {"args", "expected", "applies_head"}):
        raise GateError("invalid claim types")
    if not claim["claim_id"] or not claim["task_id"]:
        raise GateError("empty claim identifier")
    if claim["applies_head"] is not None and not isinstance(claim["applies_head"], str):
        raise GateError("invalid claim expiry")
    args = claim["args"]
    if claim["verifier"] == "head_equals":
        if args != {} or not isinstance(claim["expected"], str):
            raise GateError("invalid head verifier")
    else:
        if not isinstance(args, dict) or set(args) != {"left", "right", "key"} or any(not isinstance(x, str) for x in args.values()) or claim["expected"] is not True:
            raise GateError("invalid version verifier")


def validate_record(value):
    required = {"schema_version", "record_id", "record_hash", "created_at", "session_id",
                "sequence", "repo_id", "worktree", "task_id", "task", "status", "phase",
                "terminal", "base_sha", "head_sha", "branch", "state_hash", "dirty",
                "operations", "stash", "commits", "next_steps", "claims", "claim_results", "supersedes"}
    if not isinstance(value, dict) or set(value) != required or type(value["schema_version"]) is not int or value["schema_version"] != VERSION:
        raise GateError("invalid checkpoint schema")
    if value["status"] not in ("done", "partial", "blocked", "abandoned"):
        raise GateError("invalid checkpoint status")
    if type(value["sequence"]) is not int or value["sequence"] < 1 or type(value["terminal"]) is not bool:
        raise GateError("invalid checkpoint sequence/terminal")
    for field in ("record_id", "record_hash", "created_at", "session_id", "repo_id", "worktree",
                  "task_id", "task", "phase", "base_sha", "head_sha", "branch", "state_hash"):
        if not isinstance(value[field], str):
            raise GateError("invalid checkpoint field type")
    for field in ("dirty", "commits", "next_steps", "claims", "claim_results"):
        if not isinstance(value[field], list):
            raise GateError("invalid checkpoint list")
        if field not in ("claims", "claim_results") and any(not isinstance(item, str) for item in value[field]):
            raise GateError("invalid checkpoint list item")
    if not value["session_id"] or not value["task_id"]:
        raise GateError("empty checkpoint identity")
    if not isinstance(value["operations"], dict) or not isinstance(value["stash"], str):
        raise GateError("invalid checkpoint Git evidence")
    if value["supersedes"] is not None and not isinstance(value["supersedes"], str):
        raise GateError("invalid supersedes")
    parse_time(value["created_at"])
    for claim in value["claims"]:
        validate_claim(claim)
    for result in value["claim_results"]:
        if not isinstance(result, dict) or set(result) != {"claim_id", "state", "expected", "actual", "passed"}:
            raise GateError("invalid claim result")
        if not isinstance(result["claim_id"], str) or result["state"] not in ("historical", "expired", "checked"):
            raise GateError("invalid claim result identity/state")
        if result["passed"] is not None and type(result["passed"]) is not bool:
            raise GateError("invalid claim result verdict")
    body = {k: v for k, v in value.items() if k != "record_hash"}
    if digest(body) != value["record_hash"]:
        raise GateError("incomplete or altered checkpoint")


def claims_for(records, repo, task):
    claims = {}
    for record in records:
        for claim in record["claims"]:
            if (claim["repo_id"], claim["worktree"], claim["task_id"]) != (repo.id, repo.worktree, task):
                continue
            key = claim["claim_id"]
            if key in claims and claims[key] != claim:
                raise GateError("conflicting claim definitions; operator review required")
            claims[key] = claim
    return [claims[k] for k in sorted(claims)]


def versions(repo):
    reasons = []
    a, b = repo.root / "data/starter.json", repo.root / "data/starter.version.json"
    if a.exists() and b.exists():
        left = json.loads(repo.path("data/starter.json", regular=True).read_text("utf-8-sig"))
        right = json.loads(repo.path("data/starter.version.json", regular=True).read_text("utf-8-sig"))
        if left.get("version") != right.get("version"):
            reasons.append("starter")
    if (repo.root / "game-version.json").exists() and (repo.root / "game.html").exists():
        version = json.loads(repo.path("game-version.json", regular=True).read_text("utf-8-sig"))["v"]
        html = repo.path("game.html", regular=True).read_text("utf-8-sig")
        match = re.search(r'js/game\.js\?v=(\d+)', html)
        if not match or str(version) != match[1]:
            reasons.append("game-script")
        js = repo.root / "js/game.js"
        if js.exists():
            literal = re.search(r'\b(?:var|let|const)\s+GAME_VER\s*=\s*(\d+)', repo.path("js/game.js", regular=True).read_text("utf-8-sig"))
            if literal and literal[1] != str(version):
                reasons.append("GAME_VER")
    return reasons


def evaluate(repo, state, task="", session="", *, _locked=False, _claims=None):
    records, invalid = read_records(repo)
    reasons = []

    def add(code, severity="warning", worktree=None, detail=""):
        reasons.append({"code": code, "severity": severity,
                        "worktree": worktree or repo.worktree, "detail": detail})

    if invalid:
        add("INVALID_CHECKPOINT", detail=",".join(invalid))
    local = state["worktrees"][repo.worktree]
    for name, wr in state["worktrees"].items():
        if wr["index_locked"]:
            add("INDEX_LOCKED", "block", name)
        if wr["operations"]:
            add("OPERATION_IN_PROGRESS", "block" if name == repo.worktree else "warning", name,
                ",".join(sorted(wr["operations"])))
        if any(item and item.partition("\t")[0].split(" ")[-1] != "0" for item in wr["index"].split("\x00")):
            add("UNMERGED_INDEX", "block" if name == repo.worktree else "warning", name)
        if name != repo.worktree:
            overlap = sorted(set(state["scope"]) & set(wr["dirty"]))
            if overlap:
                add("TOUCH_OVERLAP", "block", name, canonical(overlap))
        relevant = [r for r in records if r["repo_id"] == repo.id and r["worktree"] == name]
        # Opening a new session must not erase drift/unrecorded-work evidence
        # before the agent has acknowledged what it inherited.
        meaningful = [r for r in relevant if r["phase"] != "session_start"]
        if meaningful and meaningful[-1]["head_sha"] != wr["head"]:
            add("HEAD_DRIFT", worktree=name)
        if not meaningful:
            local_commits = git(name, "rev-list", "--count", "HEAD", "--not", "--remotes", optional=True) if wr["head"] else b"0"
            if wr["dirty"] or int(local_commits.strip() or b"0"):
                add("UNRECORDED_WORK", worktree=name)
        sessions = {}
        for record in relevant:
            sessions[record["session_id"]] = record
        for sid, record in sorted(sessions.items()):
            if sid != session and not record["terminal"]:
                add("UNCLOSED_SESSION", worktree=name, detail=sid)
    if (repo.control / "pending.json").exists():
        add("PENDING_OPERATION", "block")
    elif (repo.control / "transaction.lock").exists() and not _locked:
        add("ORPHAN_OR_ACTIVE_LOCK", "block")
    main = git(repo.root, "rev-parse", "--verify", "refs/heads/main", optional=True).strip()
    remote = git(repo.root, "rev-parse", "--verify", "refs/remotes/origin/main", optional=True).strip()
    if main and remote and main != remote:
        add("LOCAL_MAIN_DIFFERS")
    for row in state["refs"].splitlines():
        fields = row.split("\x00")
        if len(fields) == 3 and fields[0].startswith("refs/heads/"):
            branch, sha = fields[0][11:], fields[1]
            other = git(repo.root, "rev-parse", "--verify", f"refs/remotes/origin/{branch}", optional=True).strip()
            if other and decode(other) != sha:
                add("BRANCH_NAME_DIVERGENCE", detail=branch)
    if state["as_of"]:
        stamp = state["fetch"]["mtime_ns"]
        if stamp is None or parse_time(state["as_of"]).timestamp() - stamp / 1e9 > 86400:
            add("FETCH_STALE")
    for mismatch in versions(repo):
        add("VERSION_MISMATCH", detail=mismatch)
    claims = claims_for(records, repo, task) if _claims is None else _claims
    claim_results = []
    for claim in claims:
        if claim["kind"] != "required_invariant" or claim["applies_head"] not in (None, local["head"]):
            claim_results.append({"claim_id": claim["claim_id"], "state": "historical" if claim["kind"] == "historical_evidence" else "expired",
                                  "expected": claim["expected"], "actual": None, "passed": None})
            continue
        if claim["verifier"] == "head_equals":
            actual = local["head"]
        else:
            args = claim["args"]
            values = []
            for key in ("left", "right"):
                path = repo.path(args[key], regular=True)
                name = path_key(path.relative_to(repo.root).as_posix())
                if name not in local["files"]:
                    raise GateError("ignored claim input must be included in touch scope")
                value = json.loads(path.read_text("utf-8-sig"))
                if args["key"] not in value:
                    raise GateError("claim JSON key missing")
                values.append(value[args["key"]])
            actual = values[0] == values[1]
        passed = actual == claim["expected"]
        claim_results.append({"claim_id": claim["claim_id"], "state": "checked", "expected": claim["expected"], "actual": actual, "passed": passed})
        if not passed:
            add("CLAIM_FAILED", "block", detail=claim["claim_id"])
    reasons.sort(key=canonical)
    code = 20 if any(r["severity"] == "block" for r in reasons) else 10 if reasons else 0
    token = digest({"state": state, "claims": claims, "claim_results": claim_results, "reasons": reasons, "task_id": task})
    return {"schema_version": VERSION, "repo_id": repo.id, "exit_code": code, "state_hash": token,
            "task_id": task, "scope": state["scope"], "ignored_outside_scope": True,
            "reasons": reasons, "claim_results": claim_results, "worktrees": {k: {f: v[f] for f in ("head", "branch", "dirty", "operations")}
                                               for k, v in state["worktrees"].items()}}


def gate(repo, touch=(), task="", session="", as_of=None, *, _locked=False):
    state = snapshot(repo, touch, as_of)
    report = evaluate(repo, state, task, session, _locked=_locked)
    # Claims and handoff metadata are read after the tree snapshot; fail if either
    # tree or report changed while evaluating them.
    if snapshot_once(repo, state["scope"], as_of) != state or evaluate(repo, state, task, session, _locked=_locked) != report:
        raise GateError("evidence changed during evaluation")
    return state, report
