"""Claude Code JSON hook adapter. Unknown tools and shell syntax fail closed."""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import json
import os
import re
import shlex

from core import GateError, Repo, canonical, gate, identifier, read_records
from control import (ack_path, begin, checkpoint, finish, load_json)
import gate as gate_cli
import handoff as handoff_cli

READ_TOOLS = {"Read", "Glob", "Grep", "WebFetch", "WebSearch", "TodoWrite",
              "TaskOutput", "AskUserQuestion", "ExitPlanMode", "EnterPlanMode"}
EDIT_TOOLS = {"Edit": "file_path", "Write": "file_path", "NotebookEdit": "notebook_path"}


def shell_read_or_helper(repo, session, command, cwd=None):
    cwd = Path(cwd or repo.root).resolve()
    if not isinstance(command, str) or re.search(r'[;&|<>`$()\r\n]', command):
        raise GateError("shell operators/expansion are not supported; use file tools")
    try:
        tokens = shlex.split(command, posix=True)
    except ValueError:
        raise GateError("unparseable shell command") from None
    if tokens in (["pwd"], ["git", "--version"]):
        return
    if len(tokens) < 3 or tokens[0] not in ("py", "py.exe", "python", "python.exe") or tokens[1] != "-I":
        raise GateError("shell command not in read-only/helper allowlist; use Read/Glob/Grep or Edit/Write")
    script = Path(tokens[2])
    if not script.is_absolute():
        script = cwd / script
    if script.resolve() not in (repo.root / "tools/handoff/gate.py", repo.root / "tools/handoff/handoff.py"):
        raise GateError("only this worktree's handoff entrypoints are allowed")
    if script.name == "gate.py":
        args = gate_cli.parser().parse_args(tokens[3:])
    else:
        args = handoff_cli.parser().parse_args(tokens[3:])
        if args.command not in ("ack", "write", "export"):
            raise GateError("recovery requires a separate operator shell after inspecting the writer")
        if args.session != session:
            raise GateError("helper session must match the actual Claude session_id")
    target = Path(args.repo)
    if not target.is_absolute():
        target = cwd / target
    if identifier(Repo(target).root) != repo.worktree:
        raise GateError("helper cannot target another worktree")


def tool_paths(repo, tool, data):
    name = data.get(EDIT_TOOLS[tool])
    if not isinstance(name, str):
        raise GateError("tool path required")
    path = Path(name)
    if not path.is_absolute():
        raise GateError("file tools must provide an absolute path")
    try:
        name = path.relative_to(repo.root).as_posix()
    except ValueError:
        raise GateError("tool target must be inside the current worktree") from None
    return [repo.path(name, regular=True).relative_to(repo.root).as_posix()]


def context(message, event):
    return {"hookSpecificOutput": {"hookEventName": event, "additionalContext": message}}


def handle(payload):
    repo = Repo(payload["cwd"])
    # Hooks must run the copy belonging to the opened checkout, not another
    # worktree whose state happens to share a Git common directory.
    if Path(__file__).resolve() != repo.root / "tools/handoff/hook.py":
        raise GateError("hook entrypoint does not belong to current worktree")
    session = payload["session_id"]
    if not isinstance(session, str) or not session:
        raise GateError("session_id required")
    event = payload["hook_event_name"]
    task = "session:" + session
    ap = ack_path(repo, session)
    if ap.exists():
        task = load_json(ap)["task_id"]
    if event == "SessionStart":
        try:
            checkpoint(repo, session, task, phase="session_start")
        except GateError as e:
            return context("Handoff start requires recovery: " + str(e), event)
        _, report = gate(repo, task=task, session=session)
        return context("Handoff gate: " + canonical(report) +
                       "\nSession=" + session + " Task=" + task +
                       "\nRun gate with exact --touch paths and --session/--task, then handoff.py ack with its token and all --accept warning codes. Shell writes are blocked; use Edit/Write after ack.", event)
    if event == "PreToolUse":
        tool, data = payload["tool_name"], payload["tool_input"]
        if tool in READ_TOOLS:
            return {}
        if tool in ("Bash", "PowerShell"):
            if data.get("run_in_background"):
                raise GateError("background shell commands are unsupported")
            shell_read_or_helper(repo, session, data.get("command"), payload["cwd"])
            return {}
        if tool not in EDIT_TOOLS:
            raise GateError("tool has no verified write adapter: " + tool)
        begin(repo, session, payload.get("tool_use_id"), tool, data, tool_paths(repo, tool, data))
        # Do not bypass the user's ordinary permission policy. An empty result
        # means the transaction is prepared, then normal permissions still apply.
        return {}
    if event in ("PostToolUse", "PostToolUseFailure"):
        tool = payload["tool_name"]
        if tool in EDIT_TOOLS:
            result = finish(repo, session, payload.get("tool_use_id"), tool, payload["tool_input"],
                            failed=event == "PostToolUseFailure")
            return context("Handoff checkpoint saved; next ack ready: " + result["state_hash"], event)
        return {}
    if event in ("Stop", "StopFailure", "SessionEnd"):
        records, _ = read_records(repo)
        own = [r for r in records if r["session_id"] == session and r["worktree"] == repo.worktree]
        if own and own[-1]["terminal"]:
            return {}
        checkpoint(repo, session, task, phase=event, terminal=event == "SessionEnd",
                   status="blocked" if event == "StopFailure" else "partial")
        return {}
    raise GateError("unsupported hook event")


def main():
    payload = {}
    try:
        payload = json.load(sys.stdin)
        result = handle(payload)
        print(canonical(result))
        return 0
    except (Exception, SystemExit) as e:
        message = "Handoff gate: " + str(e)
        if payload.get("hook_event_name") == "PreToolUse":
            print(message, file=sys.stderr)
            return 2
        # A failed post-hook cannot undo the tool. Its pending reservation is
        # intentionally retained so the next write is blocked.
        print(message, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
