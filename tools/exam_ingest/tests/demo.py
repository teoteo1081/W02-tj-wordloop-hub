"""Reproducible QA artifact using only synthetic sources and a fake backend."""
import argparse
from pathlib import Path
from unittest.mock import patch
from ..common import outside_repository, read_json, write_json
from ..runner import run
from ..publish import make_plan, apply_plan
from .fixtures import make_fixture, approval, FakeBackend


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", required=True, type=Path)
    args = parser.parse_args()
    root = outside_repository(args.output_root)
    cases = []
    with patch("urllib.request.urlopen", side_effect=AssertionError("QA demo prohibits network")):
        for year in range(2019, 2023):
            profile = make_fixture(root, year)
            write_json(root / f"profile-{year}.json", profile.data)
            result = run(profile, 9, root / "work", "synthetic-demo", "review")
            bundle_path = Path(result["directory"]) / "review.json"
            bundle = read_json(bundle_path)
            backend = FakeBackend(profile.data["target"], f"{year}-9")
            review = approval(bundle)
            write_json(root / f"approval-{year}.json", review)
            snapshot = backend.snapshot(f"{year}-9", bundle["media"])
            write_json(root / f"snapshot-{year}.json", snapshot)
            plan = make_plan(bundle_path, profile, review, snapshot)
            write_json(root / f"plan-{year}.json", plan)
            dry = apply_plan(plan, profile, backend, None)
            applied = apply_plan(plan, profile, backend, root / "fake-backups", plan["plan_hash"], True)
            cases.append({"year": year, "questions": len(bundle["items"]), "media": len(bundle["media"]),
                          "dry_run": dry["status"], "fake_publish": applied["status"],
                          "ai_calls": result["ai_calls"], "bundle": str(bundle_path), "receipt": applied["receipt"]})
    report = {"status": "PASS", "evidence_type": "SYNTHETIC_ONLY", "network_calls": 0,
              "real_backend_writes": 0, "cases": cases,
              "unverified": ["ETS 2019–2022 real sources", "live provider/backend integration", "independent human QA"]}
    write_json(root / "qa-report.json", report)
    lines = ["# TOEIC pipeline — synthetic QA", "", "All sources and approvals below are generated fixtures.",
             "No network, paid AI calls, real exams or real backend writes were used.", "",
             "| Year | Questions | Media | Dry run | Fake publish | AI calls |", "|---|---|---|---|---|---|"]
    lines += [f"| {c['year']} | {c['questions']} | {c['media']} | {c['dry_run']} | {c['fake_publish']} | {c['ai_calls']} |" for c in cases]
    lines += ["", "Pending: real-source compatibility, live integration and independent human QA.", ""]
    (root / "QA_REPORT.md").write_text("\n".join(lines), encoding="utf-8")
    print(root / "QA_REPORT.md")


if __name__ == "__main__":
    main()
