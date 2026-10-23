"""Deterministic hashing, atomic artifacts and explicit failures."""
import hashlib
import json
import os
from pathlib import Path
import tempfile


class IngestError(ValueError):
    def __init__(self, code, detail):
        self.code = code
        super().__init__(detail)


def require(condition, code, detail):
    if not condition:
        raise IngestError(code, detail)


def read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc:
        raise IngestError("INVALID_JSON", f"Cannot read JSON: {Path(path).name}") from exc


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     allow_nan=False).encode("utf-8")).hexdigest()


def file_hash(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, value):
    write_text(path, json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2,
                               allow_nan=False) + "\n")


def write_text(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".ingest-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(value)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def outside_repository(path):
    path = Path(path).resolve()
    repository = Path(__file__).resolve().parents[2]
    require(path != repository and repository not in path.parents,
            "UNSAFE_OUTPUT", "Work/output path must be outside the source checkout")
    # Reject another Git checkout as well, including worktrees (.git is a file).
    require(not any((p / ".git").exists() for p in (path, *path.parents)),
            "UNSAFE_OUTPUT", "Work/output path must not be inside a Git checkout")
    return path
