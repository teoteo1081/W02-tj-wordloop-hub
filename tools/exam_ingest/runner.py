"""Fail-fast stage DAG, exclusive run lock and hash-based resume."""
from dataclasses import dataclass
from pathlib import Path
import re
from . import __version__
from .common import IngestError, digest, file_hash, outside_repository, read_json, require, write_json
from .providers import Provider
from .sources import inventory

DEPENDENCIES = {"keys": (), "audio": (), "ocr": (), "structure": ("ocr",),
                "crop": ("structure",), "cues": ("audio", "structure"),
                "build": ("keys", "audio", "structure", "crop", "cues"),
                "enrich": ("build",), "review": ("enrich",)}


@dataclass
class Context:
    profile: object
    number: int
    directory: Path
    manifest: dict
    provider: Provider
    outputs: dict

    @property
    def spec(self):
        return self.profile.test(self.number)

    def source(self, role):
        require(role in self.spec["sources"], "MISSING_SOURCE", f"Source role missing: {role}")
        return self.profile.source(self.spec["sources"][role])

    def scoped_json(self, role):
        from .validate import check_scope
        return check_scope(read_json(self.source(role)), self.profile, self.number)


def package_hash():
    root = Path(__file__).parent
    return digest({str(p.relative_to(root)): file_hash(p) for p in sorted(root.glob("*.py"))})


def tools_identity(profile):
    """Size+mtime of configured tool binaries/model dirs, so a tool upgrade invalidates cached stages."""
    identity = {}
    for key, value in sorted((profile.data.get("tools") or {}).items()):
        path = Path(str(value))
        try:
            info = path.stat()
            identity[key] = [str(value), info.st_size, info.st_mtime_ns]
        except OSError:
            identity[key] = [str(value), None, None]
    return identity


def run(profile, number, work_root, run_id, stage="review", allow_ai=False,
        provider=None, actions=None):
    require(stage in DEPENDENCIES, "INVALID_STAGE", "Unknown processing stage")
    require(bool(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}", run_id)), "INVALID_RUN", "Invalid run ID")
    manifest = inventory(profile, number)
    require(manifest["status"] == "PASS", "BLOCKED_SOURCE", "Inventory is blocked; run inventory for details")
    root = outside_repository(work_root)
    directory = outside_repository(root / str(profile.year) / profile.data["edition"] /
                                   f"test-{number}" / run_id)
    require(not any(directory == Path(s["path"]).parent or directory in Path(s["path"]).parents
                    for t in manifest["tests"] for s in t["sources"].values()),
            "UNSAFE_OUTPUT", "Run directory must not contain input sources")
    directory.mkdir(parents=True, exist_ok=True)
    lock = directory / "run.lock"
    try:
        handle = lock.open("x", encoding="utf-8")
    except FileExistsError as exc:
        raise IngestError("RUN_LOCKED", "Run lock exists; inspect owner before resuming") from exc
    with handle:
        handle.write("exclusive run; do not remove while another process is active\n")
    try:
        from . import stages
        actions = actions or {name: getattr(stages, name) for name in DEPENDENCIES}
        state_path = directory / "state.json"
        state = read_json(state_path) if state_path.exists() else {"schema_version": 1, "stages": {}}
        context = Context(profile, number, directory, manifest,
                          provider or Provider(profile.data.get("provider"), allow_ai,
                                               ledger=directory.parent / "ai_usage.json"), {})
        fingerprint = digest({"profile": profile.fingerprint, "sources": manifest,
                              "code": package_hash(), "version": __version__,
                              "tools": tools_identity(profile)})
        completed = []

        def execute(name):
            if name in context.outputs:
                return
            for dep in DEPENDENCIES[name]:
                execute(dep)
            inputs = digest({"run": fingerprint, "dependencies": {d: digest(context.outputs[d])
                             for d in DEPENDENCIES[name]}})
            target = directory / f"{name}.json"
            previous = state["stages"].get(name, {})
            if previous.get("status") == "PASS" and previous.get("inputs") == inputs and target.is_file():
                if file_hash(target) == previous.get("sha256"):
                    value = read_json(target)
                    files_valid = all(Path(f["path"]).is_file() and file_hash(f["path"]) == f["sha256"]
                                      for f in value.get("files", []))
                    if files_valid:
                        context.outputs[name] = value
                        completed.append({"stage": name, "status": "CACHED"})
                        return
            state["stages"][name] = {"status": "RUNNING", "inputs": inputs}
            write_json(state_path, state)
            try:
                value = actions[name](context)
                require(isinstance(value, dict), "INVALID_STAGE", "Stage output must be an object")
                write_json(target, value)
                state["stages"][name] = {"status": "PASS", "inputs": inputs, "sha256": file_hash(target)}
                context.outputs[name] = value
                completed.append({"stage": name, "status": "PASS"})
            except Exception as exc:
                state["stages"][name] = {"status": "FAILED", "inputs": inputs,
                                          "code": exc.code if isinstance(exc, IngestError) else "STAGE_FAILED"}
                write_json(state_path, state)
                if isinstance(exc, IngestError):
                    raise
                raise IngestError("STAGE_FAILED", f"Stage {name} failed; inspect source/config") from exc
            write_json(state_path, state)

        write_json(directory / "manifest.json", manifest)
        execute(stage)
        summary = {"status": "PASS", "directory": str(directory), "stages": completed,
                   "ai_calls": context.provider.calls, "usage": context.provider.usage}
        write_json(directory / "report.json", summary)
        from .report import markdown
        from .common import write_text
        write_text(directory / "REPORT.md", markdown(summary))
        return summary
    finally:
        lock.unlink()
