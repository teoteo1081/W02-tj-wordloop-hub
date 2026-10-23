"""Strict, offline profile validation. Templates do not assert source compatibility."""
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
import re
from .common import digest, read_json, require
from .ids import Identity, PART_RANGES

PARTS = {str(part): list(span) for part, span in enumerate(PART_RANGES, 1)}
ROLES = {"lc_pdf", "rc_pdf", "audio", "answer_key", "reference_key", "structured",
         "cues", "enrichment", "transcript", "lc_book", "rc_book", "whisper"}


@dataclass(frozen=True)
class Profile:
    data: dict
    base: Path

    @property
    def fingerprint(self):
        return digest(self.data)

    @property
    def year(self):
        return self.data["year"]

    def test(self, number):
        found = next((t for t in self.data["tests"] if t["number"] == number), None)
        require(found is not None, "BLOCKED_SOURCE", f"Test {number} is not inventoried")
        return found

    def source(self, spec):
        root = self.data.get("source_root")
        root = Path(root) if root else self.base
        if not root.is_absolute():
            root = self.base / root
        path = Path(spec["path"])
        return (root / path).resolve() if not path.is_absolute() else path.resolve()

    def identity(self, number, part=None, num=None):
        return Identity(self.year, number, part, num)


def load_profile(path):
    path = Path(path).resolve()
    return profile_from_dict(read_json(path), path.parent)


def profile_from_dict(data, base):
    data = deepcopy(data)
    require(isinstance(data, dict), "INVALID_CONFIG", "Profile must be an object")
    allowed = {"schema_version", "year", "edition", "source_status", "source_root", "tests",
               "structure_verified", "parts", "tools", "provider", "target"}
    require(not (set(data) - allowed), "INVALID_CONFIG", "Unknown profile fields")
    require(data.get("schema_version") == 1, "INVALID_CONFIG", "schema_version must be 1")
    Identity(data.get("year"), 1)
    require(isinstance(data.get("edition"), str) and
            re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}", data["edition"]),
            "INVALID_CONFIG", "edition must be a safe path component")
    require(data.get("source_status") in {"not_found", "available"},
            "INVALID_CONFIG", "source_status must be not_found or available")
    require(type(data.get("structure_verified")) is bool, "INVALID_CONFIG", "structure_verified required")
    require(data.get("parts", PARTS) == PARTS, "INVALID_CONFIG",
            "Only the 200-question TOEIC profile is currently implemented")
    data.setdefault("parts", deepcopy(PARTS))
    require(data.get("source_root") is None or isinstance(data.get("source_root"), str),
            "INVALID_CONFIG", "source_root must be null or a path")
    require(isinstance(data.get("tests"), list), "INVALID_CONFIG", "tests must be an array")
    seen = set()
    for test in data["tests"]:
        require(isinstance(test, dict) and set(test) <= {"number", "sources", "graphics", "review"},
                "INVALID_CONFIG", "Invalid Test fields")
        number = test.get("number")
        Identity(data["year"], number)
        require(number not in seen, "INVALID_CONFIG", "Duplicate Test number")
        seen.add(number)
        require(isinstance(test.get("sources"), dict) and not (set(test["sources"]) - ROLES),
                "INVALID_CONFIG", "Unknown/missing source roles")
        for role, spec in test["sources"].items():
            require(isinstance(spec, dict) and set(spec) <=
                    {"path", "sha256", "pages", "year", "test_number"}, "INVALID_CONFIG", "Invalid source fields")
            require(isinstance(spec.get("path"), str) and bool(spec["path"].strip()),
                    "INVALID_CONFIG", "Source path required")
            require(spec.get("year", data["year"]) == data["year"] and
                    spec.get("test_number", number) == number,
                    "INVALID_CONFIG", "Source belongs to another year/Test")
            if "sha256" in spec:
                require(bool(re.fullmatch(r"[a-f0-9]{64}", spec["sha256"])), "INVALID_CONFIG", "Invalid SHA256")
            if "pages" in spec:
                pages = spec["pages"]
                require(isinstance(pages, list) and pages and
                        all(type(p) is int and p > 0 for p in pages) and len(set(pages)) == len(pages),
                        "INVALID_CONFIG", "Pages must be distinct positive 1-based integers")
        require(isinstance(test.get("graphics", []), list), "INVALID_CONFIG", "graphics must be an array")
    if data["source_status"] == "not_found":
        require(not data["tests"], "INVALID_CONFIG", "not_found template must not invent Tests")
    for key in ("tools", "provider", "target"):
        require(isinstance(data.get(key, {}), dict), "INVALID_CONFIG", f"{key} must be an object")
    allowed_nested = {
        "tools": {"ffmpeg", "ffprobe", "tesseract", "whisper_model"},
        "provider": {"model", "max_calls", "attempts", "quota_checked", "quota_checked_at", "budget_approved",
                     "credential_env", "endpoint", "timeout"},
        "target": {"project_ref", "supabase_url", "image_base", "audio_base", "r2_endpoint", "r2_bucket", "origin"},
    }
    for key, allowed_fields in allowed_nested.items():
        settings = data.get(key, {})
        require(not (set(settings) - allowed_fields), "INVALID_CONFIG", f"Unknown {key} fields; never place secrets in profiles")
    require(all(isinstance(v, str) and bool(v.strip()) for v in data.get("tools", {}).values()),
            "INVALID_CONFIG", "Tool paths must be nonempty strings")
    variable = data.get("provider", {}).get("credential_env", "SUPABASE_ANON_KEY")
    require(isinstance(variable, str) and bool(re.fullmatch(r"[A-Z][A-Z0-9_]*", variable)),
            "INVALID_CONFIG", "Provider credential_env must name an environment variable")
    target = data.get("target", {})
    if target:
        ref = target.get("project_ref", "")
        require(isinstance(ref, str) and bool(re.fullmatch(r"[a-z]{20}", ref)), "INVALID_CONFIG", "Invalid target project ref")
        base_url = f"https://{ref}.supabase.co"
        require(target.get("supabase_url") == base_url and target.get("image_base") ==
                base_url + "/storage/v1/object/public/toeic/listening/img/", "INVALID_CONFIG", "Target URLs must agree")
        require(isinstance(target.get("audio_base"), str) and target["audio_base"].startswith("https://"),
                "INVALID_CONFIG", "Target audio_base must use HTTPS")
    return Profile(data, Path(base).resolve())
