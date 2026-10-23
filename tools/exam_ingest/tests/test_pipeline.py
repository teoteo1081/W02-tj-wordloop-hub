from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
import contextlib
import io
import json
import tempfile
import unittest
from unittest.mock import patch
from ..common import IngestError, digest, read_json, write_json
from ..config import load_profile, profile_from_dict
from ..ids import Identity, parse_id, parse_test
from ..providers import Provider
from ..runner import run
from ..sources import inventory
from .. import validate
from ..publish import make_plan, apply_plan
from .fixtures import make_fixture, approval, FakeBackend


class IdConfigTests(unittest.TestCase):
    def test_canonical_roundtrip_and_legacy_do_not_collide(self):
        ids = set()
        for year in (y for y in range(2019, 2027) if y != 2024):
            value = Identity(year, 1, 5, 101)
            self.assertEqual(value, parse_id(value.question_id))
            self.assertEqual(value.year, parse_test(value.test).year)
            ids.add(value.question_id)
        legacy = Identity(2024, 1, 5, 101, legacy=True)
        self.assertEqual(legacy, parse_id("ets_t1_p5_101"))
        self.assertEqual(parse_test("1").year, 2024)
        self.assertNotIn(legacy.question_id, ids)
        self.assertEqual(Identity(2019, 1, 5, 101).question_id, "ets19_t1_p5_101")

    def test_2024_only_legacy_codec(self):
        with self.assertRaises(IngestError):
            Identity(2024, 1, 5, 101)
        with self.assertRaises(IngestError):
            parse_id("ets24_t1_p5_101")
        with self.assertRaises(IngestError):
            parse_test("2024-1")

    def test_provider_config_error_does_not_spend_budget(self):
        settings = {"model": "fixture-model", "max_calls": 2, "attempts": 3, "endpoint": "https://example.invalid/x",
                    "quota_checked": True, "budget_approved": True,
                    "quota_checked_at": datetime.now(timezone.utc).isoformat()}
        provider = Provider(settings, allow_ai=True, sleep=lambda _: None)
        with self.assertRaises(IngestError) as caught:
            provider.structured("sys", "prompt")
        self.assertEqual(caught.exception.code, "INVALID_TARGET")
        self.assertEqual((provider.calls, provider.usage), (0, []))

    def test_cli_apply_requires_preflight_before_any_client(self):
        import io, contextlib
        from ..cli import main
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = main(["publish", "--profile", "tools/exam_ingest/profiles/ets2019.json", "--plan", "x.json",
                         "--apply", "--approved-plan-hash", "h", "--backup-root", "C:/nowhere"])
        self.assertEqual(code, 2)
        self.assertIn("BLOCKED_PREFLIGHT", out.getvalue())

    def test_invalid_ids(self):
        for value in ("ets2019_t1_p5_101", "ets19_t0_p1_1", "ets19_t1_p8_1", "ets19_t1_p5_201", "ets19_t1_p1_200"):
            with self.assertRaises(IngestError):
                parse_id(value)
        for value in ("2019-0", "19-1", "2019-01", "../2019-1"):
            with self.assertRaises(IngestError):
                parse_test(value)

    def test_templates_report_missing_without_network(self):
        root = Path(__file__).parents[1] / "profiles"
        with patch("urllib.request.urlopen", side_effect=AssertionError("Network prohibited")):
            for year in range(2019, 2024):
                result = inventory(load_profile(root / f"ets{year}.json"))
                self.assertEqual(result["status"], "BLOCKED_SOURCE")
                self.assertEqual(result["tests"], [])

    def test_config_rejects_unknown_and_invented_tests(self):
        data = load_profile(Path(__file__).parents[1] / "profiles/ets2019.json").data
        data["oops"] = True
        with self.assertRaises(IngestError):
            profile_from_dict(data, ".")
        del data["oops"]
        data["tests"] = [{"number": 1, "sources": {}}]
        with self.assertRaises(IngestError):
            profile_from_dict(data, ".")

    def test_ai_no_implicit_network_and_bounded_retry(self):
        calls = []
        def fail(payload):
            calls.append(payload)
            raise RuntimeError("token must not appear in report")
        settings = {"model": "fixture-model", "max_calls": 2, "attempts": 3,
                    "quota_checked": True, "budget_approved": True,
                    "quota_checked_at": datetime.now(timezone.utc).isoformat()}
        provider = Provider(settings, transport=fail, sleep=lambda _: None)
        with self.assertRaises(IngestError):
            provider.structured("sys", "prompt")
        self.assertEqual(calls, [])
        provider.allowed = True
        with self.assertRaisesRegex(IngestError, "limit"):
            provider.structured("sys", "prompt")
        self.assertEqual(len(calls), 2)


class SourceRunnerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="toeic-source-test-")
        self.root = Path(self.tmp.name)
        self.profile = make_fixture(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def test_inventory_scope_overlap_and_missing(self):
        self.assertEqual(inventory(self.profile)["status"], "PASS")
        data = deepcopy(self.profile.data)
        data["tests"][0]["sources"]["rc_pdf"] = deepcopy(data["tests"][0]["sources"]["lc_pdf"])
        result = inventory(profile_from_dict(data, self.root))
        self.assertEqual(result["tests"][0]["issues"][0]["code"], "OVERLAPPING_PAGE_MAP")
        data["tests"][0]["sources"]["lc_pdf"]["pages"] = [999]
        result = inventory(profile_from_dict(data, self.root))
        self.assertIn("INVALID_PAGE_MAP", [i["code"] for i in result["tests"][0]["issues"]])
        data["tests"][0]["sources"]["audio"]["path"] = "missing.wav"
        self.assertEqual(inventory(profile_from_dict(data, self.root))["status"], "BLOCKED_SOURCE")

    def test_json_source_identity(self):
        path = self.profile.source(self.profile.test(9)["sources"]["answer_key"])
        value = read_json(path)
        value["year"] = 2020
        write_json(path, value)
        result = inventory(self.profile)
        self.assertIn("SOURCE_IDENTITY", [i["code"] for i in result["tests"][0]["issues"]])

    def test_encrypted_pdf_is_blocked(self):
        import pymupdf
        path = self.root / "encrypted.pdf"
        with pymupdf.open() as doc:
            doc.new_page()
            doc.save(path, encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="fixture", owner_pw="owner")
        data = deepcopy(self.profile.data)
        data["tests"][0]["sources"]["lc_pdf"]["path"] = str(path)
        result = inventory(profile_from_dict(data, self.root))
        self.assertIn("ENCRYPTED_PDF", [i["code"] for i in result["tests"][0]["issues"]])

    def test_runner_resume_invalidation_and_failure(self):
        calls = []
        def action(ctx):
            calls.append(ctx.profile.year)
            return {"ok": True}
        first = run(self.profile, 9, self.root / "work", "r1", "keys", actions={"keys": action})
        second = run(self.profile, 9, self.root / "work", "r1", "keys", actions={"keys": action})
        self.assertEqual(second["stages"][0]["status"], "CACHED")
        self.assertEqual(len(calls), 1)
        source = self.profile.source(self.profile.test(9)["sources"]["structured"])
        content = read_json(source)
        content["review_note"] = "changed source"
        write_json(source, content)
        run(self.profile, 9, self.root / "work", "r1", "keys", actions={"keys": action})
        self.assertEqual(len(calls), 2)
        def fail(ctx):
            raise RuntimeError("failure")
        with self.assertRaises(IngestError):
            run(self.profile, 9, self.root / "work", "failed", "keys", actions={"keys": fail})
        directory = Path(first["directory"]).parent / "failed"
        self.assertEqual(read_json(directory / "state.json")["stages"]["keys"]["status"], "FAILED")
        self.assertFalse((directory / "run.lock").exists())

    def test_two_years_do_not_share_artifacts(self):
        other = make_fixture(self.root, 2020, 9)
        a = run(self.profile, 9, self.root / "work", "same", "keys", actions={"keys": lambda c: {"year": c.profile.year}})
        b = run(other, 9, self.root / "work", "same", "keys", actions={"keys": lambda c: {"year": c.profile.year}})
        self.assertNotEqual(a["directory"], b["directory"])
        self.assertEqual(read_json(Path(a["directory"]) / "keys.json")["year"], 2019)

    def test_runner_rejects_checkout_output_and_escape(self):
        with self.assertRaises(IngestError):
            run(self.profile, 9, Path(__file__).parents[1], "x", "keys")
        with self.assertRaises(IngestError):
            run(self.profile, 9, self.root / "work", "../escape", "keys")

    def test_duplicate_test_and_wrong_source_scope_rejected(self):
        data = deepcopy(self.profile.data)
        data["tests"].append(deepcopy(data["tests"][0]))
        with self.assertRaises(IngestError):
            profile_from_dict(data, self.root)
        data["tests"].pop()
        data["tests"][0]["sources"]["lc_pdf"]["year"] = 2022
        with self.assertRaises(IngestError):
            profile_from_dict(data, self.root)


class EndToEndTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="toeic-offline-e2e-")
        cls.root = Path(cls.tmp.name)
        cls.profiles, cls.paths = {}, {}
        with patch("urllib.request.urlopen", side_effect=AssertionError("Network prohibited")):
            for year in range(2019, 2023):
                profile = make_fixture(cls.root, year)
                result = run(profile, 9, cls.root / "work", "full", "review")
                cls.profiles[year] = profile
                cls.paths[year] = Path(result["directory"]) / "review.json"

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def setUp(self):
        self.profile = self.profiles[2019]
        self.bundle_path = self.paths[2019]
        self.bundle = read_json(self.bundle_path)
        self.backend = FakeBackend(self.profile.data["target"], "2019-9")

    def plan(self):
        return make_plan(self.bundle_path, self.profile, approval(self.bundle),
                         self.backend.snapshot("2019-9", self.bundle["media"]))

    def test_four_years_build_complete_without_ai(self):
        for year, path in self.paths.items():
            bundle = read_json(path)
            self.assertEqual(len(bundle["items"]), 200)
            self.assertEqual(bundle["items"][2]["id"], f"ets{year % 100}_t9_p1_3")
            self.assertEqual(len(bundle["media"]), 8)
            report = read_json(path.parent / "report.json")
            self.assertEqual(report["ai_calls"], 0)
            self.assertFalse(bundle["review"]["approved"])

    def test_test9_missing_four_questions_is_rejected(self):
        rows = [r for r in self.bundle["items"] if r["num"] not in {3, 4, 5, 6}]
        with self.assertRaises(IngestError):
            validate.rows(rows, self.profile, 9, self.bundle["answers"])

    def test_wrong_part_key_options_and_cues_rejected(self):
        for field, value in (("part", 5), ("answer", "B"), ("opts", ["(A)"])):
            rows = deepcopy(self.bundle["items"])
            rows[0][field] = value
            with self.assertRaises(IngestError):
                validate.rows(rows, self.profile, 9, self.bundle["answers"])
        cues = read_json(self.bundle_path.parent / "cues.json")["items"]
        cues["100"]["q"][1] = self.bundle["duration"] + 1
        with self.assertRaises(IngestError):
            validate.cues(cues, self.bundle["duration"])

    def test_dry_run_has_no_client_calls_or_writes(self):
        plan = self.plan()
        before = (self.backend.reads, self.backend.writes)
        with patch("urllib.request.urlopen", side_effect=AssertionError("Network prohibited")):
            result = apply_plan(plan, self.profile, self.backend, None)
        self.assertEqual(result["status"], "DRY_RUN")
        self.assertEqual(before, (self.backend.reads, self.backend.writes))

    def test_apply_requires_exact_approval_before_reading_backend(self):
        plan = self.plan()
        before = self.backend.reads
        with self.assertRaises(IngestError):
            apply_plan(plan, self.profile, self.backend, self.root / "backups", "wrong", True)
        self.assertEqual(self.backend.reads, before)
        self.assertEqual(self.backend.writes, 0)

    def test_publish_verify_and_repeat_are_idempotent(self):
        plan = self.plan()
        result = apply_plan(plan, self.profile, self.backend, self.root / "backups-ok", plan["plan_hash"], True)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(len(self.backend.rows), 200)
        self.assertEqual(len(self.backend.objects), 8)
        writes = self.backend.writes
        apply_plan(plan, self.profile, self.backend, self.root / "backups-ok", plan["plan_hash"], True)
        self.assertEqual(self.backend.writes, writes)

    def test_failed_upload_receipt_resumes_without_overwrite(self):
        plan = self.plan()
        self.backend.fail_after = 2
        backup = self.root / "backups-failure"
        with self.assertRaises(RuntimeError):
            apply_plan(plan, self.profile, self.backend, backup, plan["plan_hash"], True)
        receipt = read_json(backup / plan["plan_hash"] / "receipt.json")
        self.assertEqual(receipt["status"], "FAILED")
        self.assertEqual(len(receipt["completed"]), 2)
        self.assertFalse(self.backend.rows)
        self.backend.fail_after = None
        apply_plan(plan, self.profile, self.backend, backup, plan["plan_hash"], True)
        self.assertEqual(len(self.backend.rows), 200)

    def test_stale_plan_and_changed_target_block_before_write(self):
        plan = self.plan()
        plan["mode"] = "enrich"
        with self.assertRaises(IngestError):
            apply_plan(plan, self.profile, self.backend, None)
        plan = self.plan()
        self.backend.protected_hash = "changed"
        with self.assertRaises(IngestError):
            apply_plan(plan, self.profile, self.backend, self.root / "backups-conflict", plan["plan_hash"], True)
        self.assertEqual(self.backend.writes, 0)

    def test_media_conflict_unapproved_review_and_low_quota_block(self):
        snapshot = self.backend.snapshot("2019-9", self.bundle["media"])
        approve = approval(self.bundle)
        approve["approved"] = False
        with self.assertRaises(IngestError):
            make_plan(self.bundle_path, self.profile, approve, snapshot)
        snapshot["objects"][self.bundle["media"][0]["object"]] = {"sha256": "wrong", "bytes": 4}
        with self.assertRaises(IngestError):
            make_plan(self.bundle_path, self.profile, approval(self.bundle), snapshot)
        snapshot["objects"] = {}
        snapshot["preflight"]["r2_free_bytes"] = 0
        with self.assertRaises(IngestError):
            make_plan(self.bundle_path, self.profile, approval(self.bundle), snapshot)

    def test_enrich_preserves_other_languages_and_blocks_answer_changes(self):
        self.backend.rows = {row["id"]: deepcopy(row) for row in self.bundle["items"]}
        for row in self.backend.rows.values():
            row["explain"] = "old explanation"
            row["i18n"]["en"] = {"explain": "keep English"}
        snapshot = self.backend.snapshot("2019-9", self.bundle["media"])
        plan = make_plan(self.bundle_path, self.profile, approval(self.bundle), snapshot, "enrich")
        row = next(o["after"] for o in plan["operations"] if o["kind"] == "row")
        self.assertEqual(row["i18n"]["en"]["explain"], "keep English")
        apply_plan(plan, self.profile, self.backend, self.root / "backups-enrich", plan["plan_hash"], True)
        self.assertEqual(self.backend.rows[row["id"]]["i18n"]["en"]["explain"], "keep English")
        snapshot["rows"][0]["answer"] = "B"
        with self.assertRaises(IngestError):
            make_plan(self.bundle_path, self.profile, approval(self.bundle), snapshot, "enrich")

    def test_cli_inventory_and_dry_run_without_network(self):
        from ..cli import main
        profile_path = self.root / "profile.json"
        write_json(profile_path, self.profile.data)
        with patch("urllib.request.urlopen", side_effect=AssertionError("Network prohibited")), contextlib.redirect_stdout(io.StringIO()) as output:
            status = main(["inventory", "--profile", str(profile_path)])
        self.assertEqual(status, 0)
        self.assertEqual(json.loads(output.getvalue())["status"], "PASS")

    def test_changed_local_media_blocks_before_any_write(self):
        plan = self.plan()
        path = Path(self.bundle["media"][0]["path"])
        original = path.read_bytes()
        try:
            path.write_bytes(original + b"changed")
            with self.assertRaises(IngestError):
                apply_plan(plan, self.profile, self.backend, self.root / "backups-media-change", plan["plan_hash"], True)
            self.assertEqual(self.backend.writes, 0)
        finally:
            path.write_bytes(original)

    def test_missing_or_stale_preflight_and_incomplete_snapshot(self):
        snapshot = self.backend.snapshot("2019-9", self.bundle["media"])
        snapshot["complete"] = False
        with self.assertRaises(IngestError):
            make_plan(self.bundle_path, self.profile, approval(self.bundle), snapshot)
        snapshot["complete"] = True
        snapshot["preflight"]["checked_at"] = "2000-01-01T00:00:00+00:00"
        with self.assertRaises(IngestError):
            make_plan(self.bundle_path, self.profile, approval(self.bundle), snapshot)

    def test_unpersisted_upload_cannot_be_marked_pass(self):
        plan = self.plan()
        self.backend.put_media = lambda media: None
        with self.assertRaises(IngestError):
            apply_plan(plan, self.profile, self.backend, self.root / "backups-no-persist", plan["plan_hash"], True)
        self.assertFalse(self.backend.rows)

    def test_sealed_bundle_cannot_hide_bad_cue_marker(self):
        from ..publish import validate_bundle
        bundle = deepcopy(self.bundle)
        bundle["items"][0]["passage"] = bundle["items"][0]["passage"].replace("q=3.00-3.50", "q=999.00-999.50")
        bundle["content_hash"] = digest({k: v for k, v in bundle.items() if k not in {"review", "content_hash"}})
        with self.assertRaises(IngestError):
            validate_bundle(bundle, self.profile)

    def test_bundle_cannot_replace_official_keys_or_drop_enrichment(self):
        from ..publish import validate_bundle
        bundle = deepcopy(self.bundle)
        bundle["answers"]["1"] = "B"
        bundle["items"][0]["answer"] = "B"
        bundle["content_hash"] = digest({k: v for k, v in bundle.items() if k not in {"review", "content_hash"}})
        with self.assertRaises(IngestError):
            validate_bundle(bundle, self.profile)
        bundle = deepcopy(self.bundle)
        del bundle["items"][0]["i18n"]["scr"]
        bundle["content_hash"] = digest({k: v for k, v in bundle.items() if k not in {"review", "content_hash"}})
        with self.assertRaises(IngestError):
            validate_bundle(bundle, self.profile)

    def test_resealed_plan_cannot_change_operation_scope(self):
        plan = self.plan()
        plan["operations"][0]["after"]["test"] = "2023-9"
        plan["plan_hash"] = digest({k: v for k, v in plan.items() if k != "plan_hash"})
        with self.assertRaises(IngestError):
            apply_plan(plan, self.profile, self.backend, self.root / "backups-forged", plan["plan_hash"], True)
        self.assertEqual(self.backend.writes, 0)


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="toeic-adapter-test-")
        self.root = Path(self.tmp.name)
        self.profile = make_fixture(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def test_structure_provider_opt_in_and_flags(self):
        from ..runner import Context
        from ..stages import structure
        data = deepcopy(self.profile.data)
        del data["tests"][0]["sources"]["structured"]
        profile = profile_from_dict(data, self.root)
        original = read_json(self.profile.source(self.profile.test(9)["sources"]["structured"]))["items"]
        settings = {"model": "fixture-model", "attempts": 1, "max_calls": 5,
                    "quota_checked": True, "quota_checked_at": datetime.now(timezone.utc).isoformat(), "budget_approved": True}
        def respond(payload):
            import re
            first, last = map(int, re.search(r"questions (\d+)\.\.(\d+)", payload["user"]).groups())
            value = {"items": [i for i in original if first <= i["num"] <= last], "flags": []}
            return {"candidates": [{"content": {"parts": [{"text": json.dumps(value)}]}}]}
        provider = Provider(settings, allow_ai=True, transport=respond)
        ctx = Context(profile, 9, self.root, {}, provider,
                      {"ocr": {"pages": {"lc_pdf": [{"text": "fixture"}], "rc_pdf": [{"text": "fixture"}]}}})
        with patch("urllib.request.urlopen", side_effect=AssertionError("Network prohibited")):
            result = structure(ctx)
        self.assertEqual(len(result["items"]), 169)
        self.assertEqual(provider.calls, 5)

    def test_provider_budget_survives_restart(self):
        settings = {"model": "fixture-model", "attempts": 1, "max_calls": 1,
                    "quota_checked": True, "quota_checked_at": datetime.now(timezone.utc).isoformat(), "budget_approved": True}
        def fail(payload):
            raise RuntimeError("fixture failure")
        ledger = self.root / "usage.json"
        first = Provider(settings, allow_ai=True, transport=fail, ledger=ledger)
        with self.assertRaises(IngestError):
            first.structured("sys", "prompt")
        second = Provider(settings, allow_ai=True, transport=fail, ledger=ledger)
        with self.assertRaises(IngestError):
            second.structured("sys", "prompt")
        self.assertEqual(second.calls, 1)

    def test_keys_part2_cannot_have_d_and_reference_must_match(self):
        from ..runner import Context
        from ..stages import keys
        path = self.profile.source(self.profile.test(9)["sources"]["answer_key"])
        data = read_json(path)
        data["LC"][6] = "D"
        with self.assertRaises(IngestError):
            validate.answer_keys(data)
        reference = self.profile.source(self.profile.test(9)["sources"]["reference_key"])
        data = read_json(reference)
        data["RC"][0] = "B"
        write_json(reference, data)
        ctx = Context(self.profile, 9, self.root, {}, Provider(), {})
        with self.assertRaises(IngestError):
            keys(ctx)

    def test_overlapping_test_maps_and_invalid_wav(self):
        data = deepcopy(self.profile.data)
        other = deepcopy(data["tests"][0])
        other["number"] = 8
        data["tests"].append(other)
        result = inventory(profile_from_dict(data, self.root))
        self.assertIn("OVERLAPPING_TEST_MAP", [i["code"] for i in result["issues"]])
        self.profile.source(self.profile.test(9)["sources"]["audio"]).write_text("not audio")
        result = inventory(self.profile)
        self.assertIn("INVALID_AUDIO", [i["code"] for i in result["tests"][0]["issues"]])

    def test_transcript_alignment_rejects_low_coverage(self):
        from ..stages import _align_lines
        lines = [{"t": "Synthetic source line"}]
        words = [{"a": 0.1, "b": 0.2, "t": "Synthetic"}, {"a": 0.2, "b": 0.4, "t": "source"},
                 {"a": 0.4, "b": 0.6, "t": "line"}]
        _align_lines(lines, words, [0, 1])
        self.assertEqual((lines[0]["a"], lines[0]["b"]), (0.1, 0.6))
        with self.assertRaises(IngestError):
            _align_lines([{"t": "a completely different source"}], words, [0, 1])

    def test_storage_sql_and_target_are_explicit(self):
        from ..storage import LiveBackend
        with patch.dict("os.environ", {"SUPABASE_PAT": "fixture-token"}), patch("urllib.request.urlopen", side_effect=AssertionError("No network")):
            backend = LiveBackend(self.profile.data["target"])
            queries = []
            backend._sql = lambda query: queries.append(query) or [{"id": "fixture"}]
            row = {"id": "ets19_t9_p5_101", "test": "2019-9", "exam": "toeic", "explain": "text ' $$"}
            backend.write_rows([row], "enrich", [row])
            self.assertIn("for update", queries[0])
            self.assertIn("gate", queries[0])
            self.assertIn("text '' $$", queries[0])
            self.assertNotIn("on conflict", queries[0])

    def test_scanned_pdf_uses_configured_tesseract(self):
        import shutil
        import pymupdf
        from PIL import Image, ImageDraw, ImageFont
        from ..runner import Context
        from ..stages import ocr
        tess = shutil.which("tesseract") or "C:/Program Files/Tesseract-OCR/tesseract.exe"
        if not Path(tess).is_file():
            self.skipTest("Tesseract is not installed")
        image = Image.new("RGB", (1000, 200), "white")
        ImageDraw.Draw(image).text((20, 50), "SYNTHETIC LOCAL SOURCE ONLY", font=ImageFont.load_default(size=36), fill="black")
        png = self.root / "scan.png"
        image.save(png)
        pdf = self.root / "scan.pdf"
        with pymupdf.open() as doc:
            page = doc.new_page(width=500, height=100)
            page.insert_image(page.rect, filename=str(png))
            doc.save(pdf)
        data = deepcopy(self.profile.data)
        data["tools"]["tesseract"] = str(tess)
        data["tests"][0]["sources"]["lc_pdf"]["path"] = str(pdf)
        profile = profile_from_dict(data, self.root)
        ctx = Context(profile, 9, self.root, {}, Provider(), {})
        result = ocr(ctx)
        self.assertEqual(result["pages"]["lc_pdf"][0]["mode"], "ocr")
        self.assertTrue(result["pages"]["lc_pdf"][0]["text"])

    def test_fail_fast_does_not_run_dependents(self):
        calls = []
        def fail(ctx):
            raise IngestError("FIXTURE_FAIL", "Injected OCR failure")
        def structure(ctx):
            calls.append("should not run")
            return {}
        with self.assertRaises(IngestError):
            run(self.profile, 9, self.root / "work", "fail-fast", "structure", actions={"ocr": fail, "structure": structure})
        self.assertEqual(calls, [])

    def test_r2_write_is_conditional_and_never_deploys_worker(self):
        from ..common import file_hash
        from ..storage import LiveBackend
        with patch.dict("os.environ", {"SUPABASE_PAT": "fixture-token"}):
            backend = LiveBackend(self.profile.data["target"])
        operations = []
        class S3:
            def put_object(self, **kwargs):
                operations.append({k: v for k, v in kwargs.items() if k != "Body"})
        backend._r2 = lambda: S3()
        path = self.root / "fixture.mp3"
        path.write_bytes(b"synthetic")
        backend.put_media({"kind": "audio", "path": str(path), "sha256": file_hash(path), "object": "listening/TEST_2019-9_LC.mp3"})
        self.assertEqual(operations[0]["IfNoneMatch"], "*")




if __name__ == "__main__":
    unittest.main()
