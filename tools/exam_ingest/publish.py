"""Sealed publication plans, local backups, conflict checks and resumable receipts.

The client protocol is intentionally small: snapshot(test, media), put_media,
write_rows. No client is created on import or for offline planning.
"""
from copy import deepcopy
from datetime import datetime, timezone, timedelta
from pathlib import Path
from .common import digest, file_hash, outside_repository, read_json, require, write_json
from .ids import parse_test
from . import validate as checks

ENRICH_FIELDS = {"explain", "stem_vi", "vocab", "i18n"}


def _merge(old, new):
    result = deepcopy(old)
    for key, value in new.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _merge(result[key], value)
        else:
            result[key] = deepcopy(value)
    return result


def validate_bundle(bundle, profile):
    from .runner import package_hash
    from . import __version__
    require(bundle.get("code_hash") == package_hash() and bundle.get("pipeline_version") == __version__,
            "ARTIFACT_CHANGED", "Pipeline code/version changed; rebuild artifact before publication")
    number = bundle.get("test_number")
    require(bundle.get("year") == profile.year and bundle.get("profile_hash") == profile.fingerprint,
            "PLAN_SCOPE", "Bundle does not match selected profile")
    require(bundle.get("provenance", {}).get("status") == "PASS", "BLOCKED_SOURCE", "Bundle source inventory did not pass")
    # Re-inspect files at planning/apply time, not just the old inventory status.
    from .sources import inventory
    current = inventory(profile, number)
    require(current == bundle["provenance"], "SOURCE_CHANGED", "Sources/profile changed since build")
    expected = digest({k: v for k, v in bundle.items() if k not in {"review", "content_hash"}})
    require(bundle.get("content_hash") == expected, "ARTIFACT_CHANGED", "Bundle content hash mismatch")
    sources = profile.test(number)["sources"]
    official = checks.answer_keys(read_json(profile.source(sources["answer_key"])))
    reference = checks.answer_keys(read_json(profile.source(sources["reference_key"])))
    require(official == reference == bundle.get("answers"), "KEY_MISMATCH", "Bundle official keys do not match current sources")
    checks.rows(bundle.get("items"), profile, number, official)
    checks.cues(bundle.get("cues"), bundle.get("duration"))
    checks.enrichment_rows(bundle["items"], bundle["cues"], bundle["duration"])
    import re
    for row in bundle["items"]:
        if row["num"] <= 100:
            marker = re.search(r"\[aud\] q=([\d.]+)-([\d.]+)(?: g=([\d.]+)-([\d.]+))?", row["passage"])
            cue = bundle["cues"][str(row["num"])]
            require(marker is not None and all(abs(float(x) - y) <= 0.011 for x, y in zip(marker.group(1, 2), cue["q"])),
                    "INVALID_CUE", "Database marker differs from validated cue")
            if row["num"] >= 32:
                require(marker[3] is not None and all(abs(float(x) - y) <= 0.011 for x, y in zip(marker.group(3, 4), cue["g"])),
                        "INVALID_CUE", "Conversation marker differs from validated cue")
    require(len({m["object"] for m in bundle["media"]}) == len(bundle["media"]), "INVALID_MEDIA", "Duplicate object path")
    media_names = set()
    for media in bundle["media"]:
        path = Path(media["path"])
        require(path.is_file() and file_hash(path) == media["sha256"] and path.stat().st_size == media["bytes"],
                "ARTIFACT_CHANGED", "Local media changed or missing")
        require(media["kind"] in {"image", "audio"} and media["object"] ==
                ("listening/img/" if media["kind"] == "image" else "listening/") + path.name,
                "INVALID_MEDIA", "Unexpected media destination")
        require(path.name == profile.identity(number).audio_name if media["kind"] == "audio" else
                path.name.startswith(f"T{profile.year}-{number}_") and path.suffix == ".jpg",
                "INVALID_MEDIA", "Media name belongs to a different year/Test")
        media_names.add(path.name)
    require(sum(m["kind"] == "audio" for m in bundle["media"]) == 1,
            "INVALID_MEDIA", "Require one Listening audio object")
    for row in bundle["items"]:
        import re
        for url in re.findall(r"\[img\] (\S+)", row["passage"]):
            require(url.startswith(profile.data["target"]["image_base"]) and
                    url.rsplit("/", 1)[-1].split("?", 1)[0] in media_names,
                    "INVALID_MEDIA", "Question references media outside this publication")
    return profile.identity(number).test


def check_preflight(snapshot, media, target_hash):
    preflight = snapshot.get("preflight", {})
    try:
        checked = datetime.fromisoformat(preflight["checked_at"])
        fresh = checked.tzinfo is not None and timedelta(0) <= datetime.now(timezone.utc) - checked <= timedelta(hours=24)
    except (KeyError, TypeError, ValueError):
        fresh = False
    require(fresh and preflight.get("target_hash") == target_hash and
            preflight.get("permissions_checked") is True and preflight.get("quota_checked") is True,
            "BLOCKED_PREFLIGHT", "Require a scoped permission/quota check within the last 24 hours")
    for kind, field in (("image", "supabase_free_bytes"), ("audio", "r2_free_bytes")):
        needed = sum(m["bytes"] for m in media if m["kind"] == kind)
        available = preflight.get(field)
        require(type(available) is int and available >= needed, "BLOCKED_QUOTA", f"Insufficient measured capacity: {kind}")


def validate_approval(bundle, approval):
    required = set(bundle["review"]["required_checks"])
    require(approval.get("approved") is True and bool(approval.get("reviewer")) and
            approval.get("content_hash") == bundle["content_hash"] and
            required <= set(approval.get("checks", [])), "BLOCKED_REVIEW", "Review must approve this exact content and required checks")


def make_plan(bundle_path, profile, approval, snapshot, mode="insert"):
    bundle_path = Path(bundle_path).resolve()
    bundle = read_json(bundle_path)
    test = validate_bundle(bundle, profile)
    require(profile.year not in (2023, 2024), "PROTECTED_YEAR", "2023/2024 publication is outside this pipeline scope")
    require(mode in {"insert", "enrich"}, "INVALID_MODE", "Unknown publication mode")
    validate_approval(bundle, approval)
    require(snapshot.get("schema_version") == 1 and snapshot.get("complete") is True and
            snapshot.get("target_hash") == digest(profile.data["target"]) and snapshot.get("test") == test and
            bool(snapshot.get("protected_hash")), "INVALID_SNAPSHOT", "Complete scoped target snapshot required")
    check_preflight(snapshot, bundle["media"], digest(profile.data["target"]))
    pending = checks.i18n_missing(bundle["items"])
    require(not pending or approval.get("accept_i18n_pending") is True, "I18N_INCOMPLETE",
            "Explanations lack " + ",".join(pending) + "; translate them or approve vi-only with accept_i18n_pending=true "
            "and run the i18n step afterwards (mode enrich)")
    rows = snapshot.get("rows", [])
    require(len({r["id"] for r in rows}) == len(rows) and all(r.get("test") == test for r in rows),
            "INVALID_SNAPSHOT", "Duplicate/out-of-scope rows in snapshot")
    before = {r["id"]: r for r in rows}
    desired_ids = {r["id"] for r in bundle["items"]}
    require(set(before) <= desired_ids, "TARGET_CONFLICT", "Target contains unexpected IDs")
    operations = []
    for new in bundle["items"]:
        old = before.get(new["id"])
        if mode == "enrich":
            require(old is not None, "TARGET_CONFLICT", "Enrich requires every target row to exist")
            for field in ("exam", "test", "part", "num", "answer", "answer_src", "stem", "opts", "passage", "src"):
                require(old.get(field) == new.get(field), "TARGET_CONFLICT", "Enrich cannot change question/key/media identity")
            after = _merge(old, {k: new[k] for k in ENRICH_FIELDS if k in new})
        else:
            require(old is None or all(old.get(k) == v for k, v in new.items()),
                    "TARGET_CONFLICT", "Existing question differs; refusing overwrite")
            after = old or new
        if old != after:
            operations.append({"id": "row:" + new["id"], "kind": "row", "before": old, "after": after})
    for media in bundle["media"]:
        old = snapshot.get("objects", {}).get(media["object"])
        desired = {"sha256": media["sha256"], "bytes": media["bytes"]}
        require(old is None or old == desired, "TARGET_CONFLICT", "Existing media differs; refusing overwrite")
        if old is None:
            operations.append({"id": "media:" + media["object"], "kind": "media", "before": None,
                               "after": desired, "media": media})
    plan = {"schema_version": 1, "mode": mode, "target_hash": digest(profile.data["target"]),
            "test": test, "artifact": str(bundle_path), "artifact_sha256": file_hash(bundle_path),
            "content_hash": bundle["content_hash"], "approval": approval, "snapshot": snapshot,
            "operations": operations, "i18n_pending": pending, "status": "PLANNED", "writes_performed": 0}
    plan["plan_hash"] = digest(plan)
    return plan


def _seal(plan):
    return digest({k: v for k, v in plan.items() if k != "plan_hash"})


def apply_plan(plan, profile, client, backup_root, approved_plan_hash=None, apply=False):
    if not apply:
        return _apply_plan(plan, profile, client, backup_root, approved_plan_hash, False)
    require(plan.get("plan_hash") == _seal(plan) and approved_plan_hash == plan["plan_hash"],
            "BLOCKED_APPROVAL", "Explicit approval of an unchanged plan hash required")
    require(backup_root is not None, "INVALID_OUTPUT", "Explicit backup-root required for apply")
    directory = outside_repository(Path(backup_root) / plan["plan_hash"])
    directory.mkdir(parents=True, exist_ok=True)
    lock = directory / "publish.lock"
    try:
        with lock.open("x", encoding="utf-8") as stream:
            stream.write("publication in progress\n")
    except FileExistsError:
        require(False, "PUBLISH_LOCKED", "Publication lock exists; inspect owner before retry")
    import tempfile
    target_lock = Path(tempfile.gettempdir()) / f"exam_ingest_{plan['target_hash'][:16]}_{plan['test']}.lock"
    try:
        with target_lock.open("x", encoding="utf-8") as stream:
            stream.write("publication in progress for this target/Test" + chr(10))
    except FileExistsError:
        lock.unlink()
        require(False, "PUBLISH_LOCKED", "Another publication of this target/Test is running; inspect owner before retry")
    try:
        return _apply_plan(plan, profile, client, backup_root, approved_plan_hash, True)
    finally:
        target_lock.unlink()
        lock.unlink()


def _apply_plan(plan, profile, client, backup_root, approved_plan_hash=None, apply=False):
    require(plan.get("plan_hash") == _seal(plan), "PLAN_CHANGED", "Publication plan was modified")
    if apply:
        require(approved_plan_hash == plan["plan_hash"], "BLOCKED_APPROVAL", "Explicit approval of this plan hash required")
    require(plan["target_hash"] == digest(profile.data["target"]), "PLAN_SCOPE", "Target changed")
    require(profile.year not in (2023, 2024), "PROTECTED_YEAR", "Protected reference year")
    require(file_hash(plan["artifact"]) == plan["artifact_sha256"], "ARTIFACT_CHANGED", "Bundle file changed")
    rebuilt = make_plan(plan["artifact"], profile, plan["approval"], plan["snapshot"], plan["mode"])
    require(rebuilt == plan, "PLAN_CHANGED", "Operations no longer match validated artifact/review/snapshot")
    if not apply:
        # Same validation as apply (no backend contact): DRY_RUN means "would pass the offline gates".
        return {"status": "DRY_RUN", "plan_hash": plan["plan_hash"], "operations": len(plan["operations"]),
                "i18n_pending": plan.get("i18n_pending", []), "validated": True, "writes_performed": 0}
    bundle = read_json(plan["artifact"])
    require(validate_bundle(bundle, profile) == plan["test"], "PLAN_SCOPE", "Wrong target Test")
    require(client is not None, "BLOCKED_AUTH", "Explicit publication client required")
    current = client.snapshot(plan["test"], bundle["media"])
    check_preflight(current, bundle["media"], plan["target_hash"])
    if hasattr(client, "check_write_access"):
        client.check_write_access()
    require(current.get("complete") is True and current.get("target_hash") == plan["target_hash"] and
            current.get("test") == plan["test"] and current.get("protected_hash") == plan["snapshot"]["protected_hash"],
            "TARGET_CHANGED", "Target/protected baseline changed")
    directory = outside_repository(Path(backup_root) / plan["plan_hash"])
    receipt_path = directory / "receipt.json"
    receipt = read_json(receipt_path) if receipt_path.exists() else {"plan_hash": plan["plan_hash"], "completed": [], "status": "PENDING", "observed_rows": {}}
    require(receipt.get("plan_hash") == plan["plan_hash"], "INVALID_RECEIPT", "Receipt belongs to another plan")
    known = {op["id"] for op in plan["operations"]}
    require(set(receipt["completed"]) <= known, "INVALID_RECEIPT", "Unknown receipt operation")
    expected_rows = {r["id"]: r for r in plan["snapshot"]["rows"]}
    expected_objects = deepcopy(plan["snapshot"]["objects"])
    actual_rows = {r["id"]: r for r in current["rows"]}
    for op in plan["operations"]:
        if op["id"] in receipt["completed"]:
            if op["kind"] == "row":
                observed = receipt.get("observed_rows", {}).get(op["id"])
                require(isinstance(observed, dict) and all(observed.get(k) == v for k, v in op["after"].items()),
                        "INVALID_RECEIPT", "Receipt lacks verified row state")
                expected_rows[op["after"]["id"]] = observed
            else:
                expected_objects[op["media"]["object"]] = op["after"]
    require(actual_rows == expected_rows and current["objects"] == expected_objects,
            "TARGET_CHANGED", "Target changed since plan/receipt; re-plan before writing")
    directory.mkdir(parents=True, exist_ok=True)
    backup = directory / "before.json"
    if backup.exists():
        require(read_json(backup) == plan["snapshot"], "INVALID_BACKUP", "Backup does not match original snapshot")
    else:
        write_json(backup, plan["snapshot"])
        write_json(directory / "plan.json", plan)
    receipt["status"] = "RUNNING"
    write_json(receipt_path, receipt)
    try:
        for op in plan["operations"]:
            if op["kind"] != "media" or op["id"] in receipt["completed"]:
                continue
            client.put_media(op["media"])
            live = client.snapshot(plan["test"], bundle["media"])
            require(live["objects"].get(op["media"]["object"]) == op["after"], "VERIFY_FAILED", "Media write did not persist")
            receipt["completed"].append(op["id"])
            write_json(receipt_path, receipt)
        pending = [op for op in plan["operations"] if op["kind"] == "row" and op["id"] not in receipt["completed"]]
        if pending:
            # A single SQL statement is atomic for this Test; no 200-request insert loop.
            client.write_rows([op["after"] for op in pending], plan["mode"],
                              [op["before"] for op in pending])
            live = client.snapshot(plan["test"], bundle["media"])
            by_id = {row["id"]: row for row in live["rows"]}
            for op in pending:
                saved = by_id.get(op["after"]["id"])
                require(saved is not None and all(saved.get(k) == v for k, v in op["after"].items()),
                        "VERIFY_FAILED", "Row batch did not persist")
                receipt["observed_rows"][op["id"]] = saved
                receipt["completed"].append(op["id"])
            write_json(receipt_path, receipt)
        final = client.snapshot(plan["test"], bundle["media"])
        require(final["protected_hash"] == plan["snapshot"]["protected_hash"], "VERIFY_FAILED", "Protected rows changed")
        require(len(final["rows"]) == 200, "VERIFY_FAILED", "Target does not contain exactly 200 questions")
        final_rows = {r["id"]: r for r in final["rows"]}
        desired = {r["id"]: r for r in plan["snapshot"]["rows"]}
        desired.update({op["after"]["id"]: op["after"] for op in plan["operations"] if op["kind"] == "row"})
        for row in desired.values():
            require(row["id"] in final_rows and all(final_rows[row["id"]].get(k) == v for k, v in row.items()),
                    "VERIFY_FAILED", "Final question values differ")
        for media in bundle["media"]:
            require(final["objects"].get(media["object"]) == {"sha256": media["sha256"], "bytes": media["bytes"]},
                    "VERIFY_FAILED", "Final media differs")
        if hasattr(client, "audit_media"):
            client.audit_media(bundle["media"])
        receipt["status"] = "PASS"
    except Exception:
        receipt["status"] = "FAILED"
        write_json(receipt_path, receipt)
        raise
    write_json(receipt_path, receipt)
    return {"status": "PASS", "receipt": str(receipt_path), "completed": len(receipt["completed"]),
            "rollback": "No automatic deletion; restore only from reviewed backup/receipt"}
