"""Generate local-only synthetic input, including a complete 200-question shape."""
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
import wave
from ..common import digest, read_json, write_json
from ..config import profile_from_dict
from ..validate import part_of


def make_fixture(root, year=2019, number=9):
    import pymupdf
    root = Path(root) / f"source-{year}-{number}"
    root.mkdir(parents=True, exist_ok=True)
    for role in ("lc_pdf", "rc_pdf"):
        with pymupdf.open() as doc:
            page = doc.new_page(width=200, height=100)
            page.insert_text((10, 30), f"Synthetic test fixture {year}, Test {number}.")
            doc.save(root / f"{role}.pdf")
    with wave.open(str(root / "audio.wav"), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(800)
        stream.writeframes(b"\0\0" * 800 * 205)
    scope = {"year": year, "test_number": number}
    key = {**scope, "LC": ["A"] * 100, "RC": ["A"] * 100}
    write_json(root / "key.json", key)
    write_json(root / "reference.json", key)
    structured = []
    for num in range(32, 201):
        item = {"num": num, "part": part_of(num), "stem": f"Synthetic question {num}?",
                "opts": [f"Synthetic option {letter} for {num}" for letter in "ABCD"], "passage": ""}
        if num == 32:
            item["stem"] = "Look at the graphic. Synthetic question 32?"
        if num >= 131:
            start = (131 + (num - 131) // 4 * 4) if num <= 146 else (147 + (num - 147) // 3 * 3)
            end = start + (3 if num <= 146 else 2)
            item.update(group=[start, end], passage="Synthetic local passage. " +
                        " ".join(f"-----({n})-----" for n in range(start, end + 1)))
        structured.append(item)
    write_json(root / "structured.json", {**scope, "items": structured, "flags": []})
    cues = {}
    enrichment = []
    for num in range(1, 201):
        rec = {"num": num, "answer": "A", "explain": f"Synthetic explanation {num}",
               "stem_vi": "Nội dung giả lập để kiểm thử.", "vocab": [{"t": "sample", "vi": "mẫu"}]}
        if num <= 100:
            cue = {"q": [num * 2 + 1, num * 2 + 1.5]}
            span = cue["q"]
            if num >= 32:
                group = 32 + (num - 32) // 3 * 3
                cue["g"] = [group * 2, group * 2 + 0.5]
                span = cue["g"]
            cues[str(num)] = cue
            rec["scr"] = {"lines": [{"sp": "M", "t": "Synthetic source line.", "vi": "Câu giả lập.",
                                      "a": span[0], "b": span[1]}], "ev": {str(num): "Synthetic source"}}
        enrichment.append(rec)
    write_json(root / "cues.json", {**scope, "items": cues})
    write_json(root / "enrichment.json", {**scope, "items": enrichment})
    sources = {"lc_pdf": {"path": "lc_pdf.pdf", "pages": [1]},
               "rc_pdf": {"path": "rc_pdf.pdf", "pages": [1]}, "audio": {"path": "audio.wav"},
               "answer_key": {"path": "key.json"}, "reference_key": {"path": "reference.json"},
               "structured": {"path": "structured.json"}, "cues": {"path": "cues.json"},
               "enrichment": {"path": "enrichment.json"}}
    target = {"project_ref": "a" * 20, "supabase_url": "https://" + "a" * 20 + ".supabase.co",
              "image_base": "https://" + "a" * 20 + ".supabase.co/storage/v1/object/public/toeic/listening/img/",
              "audio_base": "https://fixture.invalid", "r2_endpoint": "https://" + "a" * 32 + ".r2.cloudflarestorage.com",
              "r2_bucket": "fixture-only"}
    data = {"schema_version": 1, "year": year, "edition": "synthetic", "source_status": "available",
            "source_root": str(root), "structure_verified": True, "tools": {}, "target": target,
            "tests": [{"number": number, "sources": sources, "graphics": [
                {"role": "lc_pdf", "page": 1, "box": [0, 0, 1, 1], "num": n} for n in range(1, 7)] +
                [{"role": "lc_pdf", "page": 1, "box": [0, 0, 1, 1], "group": 32}]}]}
    return profile_from_dict(data, root)


def approval(bundle):
    return {"approved": True, "content_hash": bundle["content_hash"], "reviewer": "offline-fixture-reviewer",
            "checks": bundle["review"]["required_checks"], "accept_i18n_pending": True}


class FakeBackend:
    def __init__(self, target, test):
        self.target_hash = digest(target)
        self.test = test
        self.rows = {}
        self.objects = {}
        self.protected_hash = "fixture-protected-2023-2024"
        self.reads, self.writes = 0, 0
        self.fail_after = None

    def snapshot(self, test, media):
        self.reads += 1
        return {"schema_version": 1, "complete": True, "test": self.test, "target_hash": self.target_hash,
                "protected_hash": self.protected_hash, "rows": deepcopy(list(self.rows.values())),
                "objects": deepcopy(self.objects), "live": False,
                "preflight": {"target_hash": self.target_hash, "checked_at": datetime.now(timezone.utc).isoformat(),
                              "permissions_checked": True, "quota_checked": True,
                              "supabase_free_bytes": 10**9, "r2_free_bytes": 10**9}}

    def put_media(self, item):
        if self.fail_after is not None and self.writes == self.fail_after:
            raise RuntimeError("Injected upload failure")
        if item["object"] in self.objects:
            raise RuntimeError("Refusing overwrite")
        self.writes += 1
        self.objects[item["object"]] = {"sha256": item["sha256"], "bytes": item["bytes"]}

    def write_rows(self, rows, mode, expected=None):
        if mode == "insert" and any(row["id"] in self.rows for row in rows):
            raise RuntimeError("Duplicate insert")
        if mode == "enrich" and any(self.rows.get(old["id"]) != old for old in expected):
            raise RuntimeError("Concurrent row changed")
        self.writes += 1
        for row in rows:
            self.rows[row["id"]] = deepcopy(row)
