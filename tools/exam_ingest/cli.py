"""CLI; offline commands never construct backend/provider network clients."""
import argparse
import json
from pathlib import Path
from .common import IngestError, outside_repository, read_json, write_json
from .config import load_profile
from .doctor import doctor
from .sources import inventory


def parser():
    root = argparse.ArgumentParser(description="TOEIC multi-year content pipeline (offline by default)")
    commands = root.add_subparsers(dest="command", required=True)
    for name in ("doctor", "inventory", "run", "validate", "plan-publish", "publish"):
        cmd = commands.add_parser(name)
        cmd.add_argument("--profile", type=Path, required=True)
        if name != "run":
            cmd.add_argument("--output", type=Path)
        if name in {"inventory", "run"}:
            cmd.add_argument("--test", type=int, required=name == "run")
        if name == "run":
            from .runner import DEPENDENCIES
            cmd.add_argument("--work-root", type=Path, required=True)
            cmd.add_argument("--run-id", required=True)
            cmd.add_argument("--stage", choices=DEPENDENCIES, default="review")
            cmd.add_argument("--allow-ai", action="store_true")
        if name in {"validate", "plan-publish"}:
            cmd.add_argument("--bundle", type=Path, required=True)
        if name == "plan-publish":
            cmd.add_argument("--approval", type=Path, required=True)
            group = cmd.add_mutually_exclusive_group(required=True)
            group.add_argument("--snapshot", type=Path)
            group.add_argument("--live-read", action="store_true")
            cmd.add_argument("--preflight", type=Path)
            cmd.add_argument("--mode", choices=("insert", "enrich"), default="insert")
        if name == "publish":
            cmd.add_argument("--plan", type=Path, required=True)
            cmd.add_argument("--backup-root", type=Path)
            cmd.add_argument("--apply", action="store_true")
            cmd.add_argument("--approved-plan-hash")
            cmd.add_argument("--preflight", type=Path)
    return root


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        profile = load_profile(args.profile)
        if args.command == "doctor":
            result = doctor(profile)
        elif args.command == "inventory":
            result = inventory(profile, args.test)
        elif args.command == "run":
            from .runner import run
            result = run(profile, args.test, args.work_root, args.run_id, args.stage, args.allow_ai)
        elif args.command == "validate":
            from .publish import validate_bundle
            result = {"status": "PASS", "test": validate_bundle(read_json(args.bundle), profile)}
        elif args.command == "plan-publish":
            from .publish import make_plan, validate_bundle, validate_approval
            bundle = read_json(args.bundle)
            approval = read_json(args.approval)
            validate_bundle(bundle, profile)
            validate_approval(bundle, approval)
            if args.snapshot:
                snapshot = read_json(args.snapshot)
            else:
                from .storage import LiveBackend
                backend = LiveBackend(profile.data["target"], read_json(args.preflight) if args.preflight else None)
                snapshot = backend.snapshot(profile.identity(bundle["test_number"]).test, bundle["media"])
            result = make_plan(args.bundle, profile, approval, snapshot, args.mode)
        else:
            from .publish import apply_plan
            backend = None
            if args.apply:
                from .common import require
                require(args.backup_root is not None, "INVALID_OUTPUT", "Explicit backup-root required for apply")
                require(args.preflight is not None, "BLOCKED_PREFLIGHT", "--preflight file required for apply")
                require(args.approved_plan_hash, "BLOCKED_APPROVAL", "--approved-plan-hash required for apply")
                from .storage import LiveBackend
                backend = LiveBackend(profile.data["target"], read_json(args.preflight))
            result = apply_plan(read_json(args.plan), profile, backend, args.backup_root,
                                args.approved_plan_hash, args.apply)
        if getattr(args, "output", None):
            write_json(outside_repository(args.output), result)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result.get("status") in {"PASS", "PLANNED", "DRY_RUN"} else 2
    except IngestError as exc:
        print(json.dumps({"status": exc.code, "detail": str(exc)}, ensure_ascii=False))
        return 2
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        print(json.dumps({"status": "FAILED", "detail": "Invalid input/environment; no credentials or response bodies logged"}))
        return 1
