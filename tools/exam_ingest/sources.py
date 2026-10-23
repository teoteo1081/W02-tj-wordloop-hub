"""Read-only source inventory and file provenance."""
from pathlib import Path
import json
import subprocess
import wave
from .common import IngestError, file_hash, require

REQUIRED = {"lc_pdf", "rc_pdf", "audio", "answer_key", "reference_key"}


def audio_duration(path, ffprobe="ffprobe"):
    if Path(path).suffix.lower() == ".wav":
        try:
            with wave.open(str(path), "rb") as audio:
                duration = audio.getnframes() / audio.getframerate()
                require(duration > 0, "INVALID_AUDIO", "Empty WAV")
                return duration
        except (wave.Error, EOFError, OSError) as exc:
            raise IngestError("INVALID_AUDIO", "Cannot read WAV") from exc
    try:
        result = subprocess.run([str(ffprobe), "-v", "error", "-show_entries", "format=duration",
                                 "-of", "json", str(path)], capture_output=True, text=True,
                                check=True, timeout=60)
        value = float(json.loads(result.stdout)["format"]["duration"])
        require(value > 0, "INVALID_AUDIO", "Audio duration must be positive")
        return value
    except (OSError, subprocess.SubprocessError, ValueError, KeyError) as exc:
        raise IngestError("INVALID_AUDIO", "Cannot inspect audio with ffprobe") from exc


def inspect_source(profile, role, spec):
    path = profile.source(spec)
    require(path.is_file(), "MISSING_SOURCE", f"Missing {role}: {path.name}")
    sha = file_hash(path)
    require(not spec.get("sha256") or sha == spec["sha256"], "SOURCE_CHANGED", f"Hash mismatch: {role}")
    out = {"path": str(path), "sha256": sha, "bytes": path.stat().st_size}
    if path.suffix.lower() == ".pdf":
        try:
            import pymupdf
            with pymupdf.open(path) as doc:
                require(not doc.needs_pass, "ENCRYPTED_PDF", f"Encrypted PDF: {role}")
                pages = spec.get("pages")
                require(bool(pages), "MISSING_PAGE_MAP", f"Explicit page map required: {role}")
                require(max(pages) <= len(doc), "INVALID_PAGE_MAP", f"Page exceeds PDF: {role}")
                out.update(page_count=len(doc), pages=pages,
                           text_pages=sum(bool(doc[p - 1].get_text().strip()) for p in pages))
        except ImportError as exc:
            raise IngestError("MISSING_TOOL", "PyMuPDF is required for PDFs") from exc
        except IngestError:
            raise
        except Exception as exc:
            raise IngestError("INVALID_PDF", f"Cannot read PDF: {role}") from exc
    elif role == "audio":
        out["duration"] = audio_duration(path, profile.data.get("tools", {}).get("ffprobe", "ffprobe"))
    elif path.suffix.lower() == ".json":
        from .common import read_json
        data = read_json(path)
        require(isinstance(data, dict) and data.get("year") == profile.year,
                "SOURCE_IDENTITY", f"JSON year mismatch: {role}")
        require(data.get("test_number") == spec.get("test_number"),
                "SOURCE_IDENTITY", f"JSON Test mismatch: {role}")
    return out


def inventory(profile, test_number=None):
    issues, tests = [], []
    if profile.data["source_status"] == "not_found" or not profile.data["tests"]:
        issues.append({"code": "BLOCKED_SOURCE", "detail": "Source not found; Test count unknown"})
    if not profile.data["structure_verified"]:
        issues.append({"code": "UNVERIFIED_PROFILE", "detail": "Question structure not verified against source"})
    page_owners = {}
    for test in profile.data["tests"]:
        for role in ("lc_pdf", "rc_pdf", "lc_book", "rc_book"):
            spec = test["sources"].get(role)
            if not spec:
                continue
            for page in spec.get("pages", []):
                position = (str(profile.source(spec)), page)
                owner = page_owners.get(position)
                if owner is not None and owner != test["number"]:
                    issues.append({"code": "OVERLAPPING_TEST_MAP", "detail": f"Tests {owner}/{test['number']} share a mapped source page"})
                page_owners[position] = test["number"]
    specs = [profile.test(test_number)] if test_number is not None else profile.data["tests"]
    for test in specs:
        record = {"test_number": test["number"], "sources": {}, "issues": []}
        for role in sorted(REQUIRED - set(test["sources"])):
            record["issues"].append({"code": "MISSING_SOURCE", "detail": role})
        occupied = {}
        for role, original in test["sources"].items():
            spec = {**original, "test_number": test["number"]}
            try:
                info = inspect_source(profile, role, spec)
                if role in {"lc_pdf", "rc_pdf"}:
                    positions = {(info["path"], page) for page in info["pages"]}
                    require(not (positions & occupied.keys()), "OVERLAPPING_PAGE_MAP", "LC/RC page maps overlap")
                    occupied.update({p: role for p in positions})
                if role == "reference_key" and "answer_key" in test["sources"]:
                    primary = profile.source(test["sources"]["answer_key"])
                    require(profile.source(spec) != primary, "SAME_KEY_SOURCE", "Reference key must be a separate source")
                record["sources"][role] = info
            except IngestError as exc:
                record["issues"].append({"code": exc.code, "detail": str(exc)})
        tests.append(record)
    blocked = bool(issues or any(t["issues"] for t in tests))
    return {"schema_version": 1, "year": profile.year, "edition": profile.data["edition"],
            "profile_hash": profile.fingerprint, "status": "BLOCKED_SOURCE" if blocked else "PASS",
            "issues": issues, "tests": tests}
