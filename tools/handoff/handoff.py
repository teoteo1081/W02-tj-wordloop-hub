"""CLI for explicit checkpoint, acknowledgement, export, and operator recovery."""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import argparse
import json
from core import Repo, canonical, read_records
from control import acknowledge, begin, checkpoint, durable_json, finish, recover


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    commands = p.add_subparsers(dest="command", required=True)
    for name in ("ack", "write", "export", "recover"):
        sub = commands.add_parser(name)
        sub.add_argument("--repo", default=".")
        sub.add_argument("--session", required=True)
        sub.add_argument("--task", required=True)
        if name == "ack":
            sub.add_argument("--token", required=True)
            sub.add_argument("--touch", action="append", default=[])
            sub.add_argument("--accept", action="append", default=[])
            sub.add_argument("--as-of")
        elif name == "write":
            sub.add_argument("--status", choices=("done", "partial", "blocked", "abandoned"), required=True)
            sub.add_argument("--next", action="append", default=[])
            sub.add_argument("--description", default="")
            sub.add_argument("--claims-file")
        elif name == "recover":
            sub.add_argument("--reviewed", action="store_true")
    return p


def run(args):
    repo = Repo(args.repo)
    if args.command == "ack":
        return acknowledge(repo, args.session, args.task, args.token, args.touch, args.accept, args.as_of)
    if args.command == "write":
        claims = json.loads(Path(args.claims_file).read_text("utf-8")) if args.claims_file else []
        if not isinstance(claims, list):
            raise ValueError("claims-file must contain an array")
        return checkpoint(repo, args.session, args.task, status=args.status, terminal=True,
                          next_steps=args.next, task_text=args.description, new_claims=claims)
    if args.command == "recover":
        return recover(repo, args.session, reviewed=args.reviewed)
    records, _ = read_records(repo)
    records = [r for r in records if r["repo_id"] == repo.id and r["worktree"] == repo.worktree and r["task_id"] == args.task]
    if not records:
        raise ValueError("no checkpoint for this worktree/task")
    from control import ack_path, load_json
    if load_json(ack_path(repo, args.session))["task_id"] != args.task:
        raise ValueError("export task must match acknowledged task")
    target = ".handoff/latest.json"
    tool_input = {"target": target, "record_hash": records[-1]["record_hash"]}
    call_id = "export-" + records[-1]["record_id"]
    begin(repo, args.session, call_id, "handoff-export", tool_input, [target])
    durable_json(repo.path(target, regular=True), records[-1])
    return finish(repo, args.session, call_id, "handoff-export", tool_input)


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        result = run(args)
        print(canonical(result))
        return 0
    except Exception as e:
        print(canonical({"exit_code": 2, "error": str(e), "type": type(e).__name__}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
