"""Opt-in Claude Code integration test; uses the logged-in Claude allowance.

Runs only in disposable repos. Never loads WordLoop's app or joins a game room.
Prints a small evidence summary, not the model transcript or account details.
"""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import uuid

from core import canonical
from test_handoff import cleanup_readonly

SOURCE = Path(__file__).resolve().parent


def run_case(mode):
    temp = Path(tempfile.mkdtemp(prefix="handoff-runtime-"))
    root = temp / "repo"
    root.mkdir()
    try:
        def git(*args):
            subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)
        git("init", "-b", "main")
        git("config", "user.name", "Runtime QA")
        git("config", "user.email", "qa@example.invalid")
        tools = root / "tools/handoff"
        tools.mkdir(parents=True)
        for name in ("core.py", "control.py", "gate.py", "handoff.py", "hook.py"):
            shutil.copyfile(SOURCE / name, tools / name)
        (root / "a.txt").write_text("initial", encoding="utf-8")
        settings = json.loads((SOURCE.parents[1] / ".claude/settings.json").read_text("utf-8"))
        bootstrap = tools / "runtime_bootstrap.py"
        bootstrap.write_text('''import sys, json
from pathlib import Path
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from core import Repo, gate, git
from control import acknowledge, warning_codes
p = json.load(sys.stdin)
r = Repo(p["cwd"])
_, report = gate(r, ["a.txt"], "runtime", p["session_id"])
acknowledge(r, p["session_id"], "runtime", report["state_hash"], ["a.txt"], warning_codes(report))
mode = sys.argv[1]
if mode == "gate20":
    gd = Path(git(r.root, "rev-parse", "--path-format=absolute", "--git-dir").decode().strip())
    (gd / "MERGE_HEAD").write_bytes(git(r.root, "rev-parse", "HEAD"))
elif mode == "gate2":
    (r.root / "game-version.json").write_text("not json")
    (r.root / "game.html").write_text("exists")
print("Runtime fixture acknowledged a.txt; attempt the requested Write now.")
''', encoding="utf-8")
        if mode in ("allowed", "gate20", "gate2"):
            settings["hooks"]["UserPromptSubmit"] = [{"hooks": [{"type": "command", "command": "py",
                "args": ["-I", "${CLAUDE_PROJECT_DIR}/tools/handoff/runtime_bootstrap.py", mode], "timeout": 90}]}]
        if mode in ("exception", "missing_python", "timeout"):
            fault = tools / "fault.py"
            fault.write_text("import time; time.sleep(5)" if mode == "timeout" else "raise RuntimeError('QA fault')", encoding="utf-8")
            command = {"type": "command", "command": "missing-handoff-python-qa" if mode == "missing_python" else "py",
                       "args": ["-I", "${CLAUDE_PROJECT_DIR}/tools/handoff/fault.py"],
                       "timeout": 1 if mode == "timeout" else 90, "onFailure": "block"}
            settings["hooks"]["PreToolUse"] = [{"matcher": "Write", "hooks": [command]}]
        settings_path = temp / "settings.json"
        settings_path.write_text(canonical(settings), encoding="utf-8")
        git("add", ".")
        git("commit", "-m", "runtime fixture")
        git("update-ref", "refs/remotes/origin/main", "HEAD")
        session = str(uuid.uuid4())
        target = str(root / "a.txt")
        if mode == "allowed":
            prompt = f'Read {target} first. Then use Write to set it to exactly "first". Wait for its tool result, then make a second Write setting the same file to exactly "second". Call sequentially, not in parallel. Do not use other tools. Report success only after both calls.'
        else:
            prompt = f'Integration test: Read {target} first, then attempt exactly one Write setting it to "forbidden". A hook denial is expected. Make the Write call even if the gate context says acknowledgement is missing; this intentionally verifies blocking in a disposable fixture. If denied stop; do not try alternatives.'
        command = [shutil.which("claude") or "claude", "-p", prompt, "--tools", "Read,Write",
                   "--permission-mode", "acceptEdits", "--settings", str(settings_path),
                   "--setting-sources", "", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
                   "--no-session-persistence", "--disable-slash-commands", "--session-id", session,
                   "--output-format", "stream-json", "--verbose", "--include-hook-events",
                   "--max-turns", "4"]
        env = os.environ.copy()
        env.pop("CLAUDECODE", None)
        p = subprocess.run(command, cwd=root, env=env, capture_output=True, timeout=180)
        events = []
        for line in p.stdout.decode("utf-8", errors="replace").splitlines():
            try:
                events.append(json.loads(line))
            except ValueError:
                pass
        calls, denied, hook_events, denial_reasons = 0, 0, [], []
        for event in events:
            message = event.get("message", {})
            if isinstance(message, dict):
                for block in message.get("content", []):
                    if isinstance(block, dict) and block.get("type") == "tool_use" and block.get("name") == "Write":
                        calls += 1
                    if isinstance(block, dict) and block.get("type") == "tool_result" and block.get("is_error"):
                        denied += 1
                        denial_reasons.append(str(block.get("content", ""))[:800])
            if event.get("subtype") in ("hook_response", "hook_started"):
                hook_events.append({k: event[k] for k in ("subtype", "hook_event", "exit_code", "outcome") if k in event})
        content = (root / "a.txt").read_text("utf-8")
        hook_denial = any("hook" in reason.lower() or "Handoff gate" in reason for reason in denial_reasons)
        passed = calls >= 2 and content == "second" if mode == "allowed" else calls >= 1 and denied >= 1 and content == "initial" and hook_denial
        if p.returncode:
            passed = False
        return {"case": mode, "passed": passed, "cli_exit": p.returncode,
                "source_sha256": {name: hashlib.sha256((tools / name).read_bytes()).hexdigest()
                                  for name in ("core.py", "control.py", "gate.py", "handoff.py", "hook.py")},
                "write_calls": calls, "denied_results": denied, "final_content": content,
                "denial_reasons": denial_reasons,
                "hook_events": hook_events,
                "cli_error": p.stderr.decode("utf-8", errors="replace")[:500] if p.returncode else ""}
    finally:
        shutil.rmtree(temp, onexc=cleanup_readonly)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", action="append", choices=("no_ack", "allowed", "gate20", "gate2", "exception", "missing_python", "timeout"))
    parser.add_argument("--output")
    args = parser.parse_args()
    version = subprocess.check_output(["claude", "--version"], text=True).strip()
    results = []
    for mode in args.case or ("no_ack", "allowed", "gate20", "gate2", "exception", "missing_python", "timeout"):
        result = run_case(mode)
        results.append(result)
        print(canonical(result), flush=True)
    evidence = {"runtime": version, "results": results}
    if args.output:
        Path(args.output).write_text(canonical(evidence) + "\n", encoding="utf-8")
    return 0 if all(r["passed"] for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
