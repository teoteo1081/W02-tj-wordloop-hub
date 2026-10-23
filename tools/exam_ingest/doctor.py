"""Inspect environment without installing dependencies or fetching models."""
import importlib.metadata
import importlib.util
from pathlib import Path
import shutil
import sys
from . import __version__


def doctor(profile):
    packages = {}
    for module, package in (("pymupdf", "PyMuPDF"), ("PIL", "Pillow"),
                            ("faster_whisper", "faster-whisper"), ("boto3", "boto3")):
        available = importlib.util.find_spec(module) is not None
        try:
            version = importlib.metadata.version(package) if available else None
        except importlib.metadata.PackageNotFoundError:
            version = None
        packages[package] = {"available": available, "version": version}
    tools = profile.data.get("tools", {})
    binaries = {}
    for name in ("ffmpeg", "ffprobe", "tesseract"):
        requested = tools.get(name, name)
        location = shutil.which(requested)
        if not location and Path(requested).is_file():
            location = str(Path(requested).resolve())
        binaries[name] = {"available": location is not None, "path": location}
    model = tools.get("whisper_model")
    python_ok = sys.version_info >= (3, 12)
    ready = python_ok and all(v["available"] for v in packages.values()) and all(v["available"] for v in binaries.values())
    return {"status": "PASS" if ready else "BLOCKED_ENV", "version": __version__,
            "python": sys.version.split()[0], "python_supported": python_ok,
            "year": profile.year, "source_status": profile.data["source_status"],
            "packages": packages, "binaries": binaries,
            "whisper_model_local": bool(model and Path(model).is_dir()),
            "runtime_verified": False, "network_calls": 0}
