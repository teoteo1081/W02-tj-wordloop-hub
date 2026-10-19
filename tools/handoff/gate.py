"""CLI: read-only gate. Exit 0 clean, 10 warning, 20 blocked, 2 error."""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import argparse
from core import GateError, Repo, canonical, gate


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--repo", default=".")
    p.add_argument("--touch", action="append", default=[])
    p.add_argument("--task", default="")
    p.add_argument("--session", default="")
    p.add_argument("--as-of")
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        _, report = gate(Repo(args.repo), args.touch, args.task, args.session, args.as_of)
        print(canonical(report))
        print("GATE_TOKEN=" + report["state_hash"])
        return report["exit_code"]
    except Exception as e:
        print(canonical({"exit_code": 2, "error": str(e), "type": type(e).__name__}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
