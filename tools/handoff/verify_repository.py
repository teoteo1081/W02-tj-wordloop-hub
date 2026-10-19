"""Independent real-repo read-only/determinism check. Writes evidence only at end."""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import argparse
import hashlib
import json
import os
import stat
import subprocess


def command(root, *args):
    return subprocess.check_output(["git", "-c", "core.fsmonitor=false", "-C", str(root), *args],
        env={**{k: v for k, v in os.environ.items() if not k.upper().startswith("GIT_")},
             "GIT_OPTIONAL_LOCKS": "0"})


def fingerprint(root):
    # This inspector deliberately does not import the gate's snapshot code.
    roots = [Path(os.fsdecode(block.split(b"\x00", 1)[0].split(b" ", 1)[1]))
             for block in command(root, "worktree", "list", "--porcelain", "-z").split(b"\x00\x00") if block]
    paths = set()
    for worktree in roots:
        files = command(worktree, "ls-files", "--cached", "--others", "--exclude-standard", "-z")
        paths.update(worktree / os.fsdecode(name) for name in files.split(b"\x00") if name)
    common = Path(os.fsdecode(command(root, "rev-parse", "--path-format=absolute", "--git-common-dir")).strip())
    paths.update(p for p in common.rglob("*") if not p.is_dir())
    total = hashlib.sha256()
    for p in sorted(paths):
        total.update(os.fsencode(str(p)))
        try:
            mode = p.lstat().st_mode
            total.update(str(stat.S_IMODE(mode)).encode("ascii"))
            if stat.S_ISLNK(mode):
                total.update(os.fsencode(os.readlink(p)))
            else:
                with p.open("rb") as f:
                    for chunk in iter(lambda: f.read(1024 * 1024), b""):
                        total.update(chunk)
        except FileNotFoundError:
            total.update(b"MISSING")
    return total.hexdigest(), len(roots), len(paths)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--repo", default=".")
    p.add_argument("--output")
    args = p.parse_args()
    root = Path(args.repo).resolve()
    before, count, paths = fingerprint(root)
    invocation = [sys.executable, "-I", str(root / "tools/handoff/gate.py"), "--repo", str(root),
                  "--session", "codex-verification", "--task", "handoff-implementation"]
    first = subprocess.run(invocation, capture_output=True, timeout=240)
    second = subprocess.run(invocation, capture_output=True, timeout=240)
    after, _, _ = fingerprint(root)
    report = json.loads(first.stdout.splitlines()[0])
    evidence = {"worktrees": count, "inspected_files": paths,
                "before_sha256": before, "after_sha256": after,
                "readonly": before == after, "byte_identical": first.stdout == second.stdout,
                "exit_codes": [first.returncode, second.returncode],
                "reasons": report.get("reasons", []),
                "passed": before == after and first.stdout == second.stdout and first.returncode in (0, 10, 20)}
    rendered = json.dumps(evidence, sort_keys=True, ensure_ascii=True)
    print(rendered)
    # Evidence is intentionally written only AFTER the before/after comparison.
    if args.output:
        Path(args.output).write_text(rendered + "\n", encoding="utf-8")
    return 0 if evidence["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
