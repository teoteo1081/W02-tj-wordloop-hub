"""Behavioral tests in disposable Git repos. No writes to the WordLoop worktrees."""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import json
import os
import shutil
import stat
import subprocess
import tempfile
import unittest

from core import (GateError, Repo, canonical, digest, gate, git, read_records,
                  snapshot, validate_record)
from control import (ack_path, acknowledge, begin, checkpoint, durable_json,
                     finish, load_json, recover, warning_codes)
import hook
import handoff

SOURCE = Path(__file__).resolve().parent


def cleanup_readonly(func, path, exc):
    os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
    func(path)


class HandoffTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.mkdtemp(prefix="handoff-test-")
        self.root = Path(self.temp) / "repo"
        self.root.mkdir()
        self.g("init", "-b", "main")
        self.g("config", "user.name", "Handoff Test")
        self.g("config", "user.email", "handoff@example.invalid")
        self.put("a.txt", "base\n")
        self.put("b.txt", "other\n")
        self.put(".gitignore", "ignored.txt\n__pycache__/\n")
        target = self.root / "tools/handoff"
        target.mkdir(parents=True)
        for name in ("core.py", "control.py", "gate.py", "handoff.py", "hook.py"):
            shutil.copyfile(SOURCE / name, target / name)
        self.commit()
        self.repo = Repo(self.root)
        self.session, self.task = "session-1", "task-1"

    def tearDown(self):
        shutil.rmtree(self.temp, onexc=cleanup_readonly)

    def g(self, *args, root=None, check=True):
        result = subprocess.run(["git", "-C", str(root or self.root), *args],
                                capture_output=True, check=check)
        return result.stdout

    def put(self, name, text, root=None):
        p = (root or self.root) / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    def commit(self):
        self.g("add", "--all")
        self.g("commit", "-m", "fixture")

    def report(self, paths=("a.txt",), task=None, session=None):
        return gate(self.repo, paths, task or self.task, session or self.session)[1]

    def ack(self, paths=("a.txt",)):
        report = self.report(paths)
        acknowledge(self.repo, self.session, self.task, report["state_hash"], paths, warning_codes(report))
        return report

    def begin(self, name="a.txt", tool_id="call-1"):
        data = {"file_path": str(self.root / name), "content": "edited"}
        begin(self.repo, self.session, tool_id, "Write", data, [name])
        return data

    def claim(self, **extra):
        value = {"claim_id": "c1", "kind": "required_invariant", "repo_id": self.repo.id,
                 "worktree": self.repo.worktree, "task_id": self.task,
                 "baseline_head": self.g("rev-parse", "HEAD").decode().strip(),
                 "applies_head": None, "verifier": "head_equals", "args": {}, "expected": "not-the-head"}
        value.update(extra)
        return value

    def metadata_bytes(self):
        return {str(p.relative_to(self.root)): p.read_bytes() for p in self.root.rglob("*")
                if p.is_file() and "handoff-control" not in p.parts}

    def test_clean_and_unrecorded_dirty_exit_codes(self):
        # Publish fixture HEAD to a local remote ref to isolate a clean 0 case.
        self.g("update-ref", "refs/remotes/origin/main", "HEAD")
        self.assertEqual(self.report()["exit_code"], 0)
        self.put("a.txt", "dirty\n")
        self.assertEqual(self.report()["exit_code"], 10)
        self.assertIn("UNRECORDED_WORK", warning_codes(self.report()))

    def test_gate_deterministic_and_no_file_or_git_metadata_writes(self):
        before = self.metadata_bytes()
        a = self.report()
        b = self.report()
        self.assertEqual(canonical(a), canonical(b))
        self.assertEqual(before, self.metadata_bytes())
        p = subprocess.run([sys.executable, "-I", str(self.root / "tools/handoff/gate.py"),
                            "--repo", str(self.root)], capture_output=True)
        self.assertEqual(p.returncode, 10)
        self.assertIn(b"GATE_TOKEN=", p.stdout)
        self.assertEqual(before, self.metadata_bytes())

    def test_git_clean_and_process_filters_never_execute(self):
        script = Path(self.temp) / "filter.py"
        marker = Path(self.temp) / "filter-ran"
        script.write_text("import pathlib,sys\npathlib.Path(sys.argv[1]).write_text('BAD')\nsys.stdout.buffer.write(sys.stdin.buffer.read())\n")
        self.put(".gitattributes", "a.txt filter=qa\n")
        self.commit()
        self.put("a.txt", "same\n")
        for kind in ("clean", "process"):
            self.g("config", f"filter.qa.{kind}", f'"{sys.executable}" -I "{script}" "{marker}"')
            with self.subTest(kind=kind), self.assertRaisesRegex(GateError, "filters are unsupported"):
                self.report()
            self.assertFalse(marker.exists(), "gate executed an external Git filter")
            self.g("config", "--unset", f"filter.qa.{kind}")

    def test_dirty_same_status_and_mtime_still_changes_hash(self):
        self.put("a.txt", "edit-one\n")
        original_time = (self.root / "a.txt").stat().st_mtime_ns
        a = self.report()
        status_a = git(self.root, "status", "--porcelain=v2", "-z")
        self.put("a.txt", "edit-two\n")
        os.utime(self.root / "a.txt", ns=(original_time, original_time))
        self.assertEqual(status_a, git(self.root, "status", "--porcelain=v2", "-z"))
        self.assertNotEqual(a["state_hash"], self.report()["state_hash"])

    def test_untracked_staged_deleted_and_unicode_are_hashed(self):
        names = ("mới.txt", "untracked.txt")
        a = self.report()
        for name in names:
            self.put(name, "one")
        b = self.report()
        self.assertNotEqual(a["state_hash"], b["state_hash"])
        self.g("add", "mới.txt")
        self.assertNotEqual(b["state_hash"], self.report()["state_hash"])
        (self.root / "a.txt").unlink()
        self.assertIn("a.txt", self.report()["worktrees"][self.repo.worktree]["dirty"])

    def test_ignored_only_hashed_in_explicit_scope(self):
        self.put("ignored.txt", "one")
        a = self.report()
        scoped_a = self.report(("ignored.txt",))
        self.put("ignored.txt", "two")
        self.assertEqual(a["state_hash"], self.report()["state_hash"])
        self.assertNotEqual(scoped_a["state_hash"], self.report(("ignored.txt",))["state_hash"])

    def test_missing_ack_and_stale_scope_and_foreign_session_denied(self):
        with self.assertRaises(GateError):
            self.begin()
        self.ack()
        with self.assertRaises(GateError):
            self.begin("b.txt")
        with self.assertRaises(GateError):
            begin(self.repo, "other-session", "other", "Write", {}, ["a.txt"])
        self.put("a.txt", "outside-writer")
        with self.assertRaises(GateError):
            self.begin()

    def test_two_edits_refresh_ack_and_duplicate_post_is_rejected(self):
        self.ack()
        for i in range(2):
            call = f"call-{i}"
            data = self.begin(tool_id=call)
            self.put("a.txt", f"edit-{i}")
            finish(self.repo, self.session, call, "Write", data)
            self.assertTrue(load_json(ack_path(self.repo, self.session))["ready"])
        with self.assertRaises(GateError):
            finish(self.repo, self.session, call, "Write", data)
        records, invalid = read_records(self.repo)
        self.assertFalse(invalid)
        self.assertEqual([r["phase"] for r in records], ["before_tool", "after_tool"] * 2)

    def test_scope_violation_keeps_pending_and_blocks_next_writer(self):
        self.ack()
        data = self.begin()
        self.put("a.txt", "allowed")
        self.put("b.txt", "unexpected")
        with self.assertRaises(GateError):
            finish(self.repo, self.session, "call-1", "Write", data)
        self.assertTrue((self.repo.control / "pending.json").exists())
        self.assertEqual(self.report()["exit_code"], 20)
        with self.assertRaises(GateError):
            self.begin(tool_id="call-2")

    def test_failed_tool_and_missing_post_require_operator_recovery(self):
        self.ack()
        data = self.begin()
        self.put("a.txt", "partial write")
        with self.assertRaises(GateError):
            finish(self.repo, self.session, "call-1", "Write", data, failed=True)
        with self.assertRaises(GateError):
            recover(self.repo, self.session)
        recover(self.repo, self.session, reviewed=True)
        self.assertFalse(load_json(ack_path(self.repo, self.session))["ready"])
        self.ack()
        self.begin(tool_id="call-2")
        # Missing post (e.g. killed writer) leaves the durable before checkpoint.
        self.assertEqual(read_records(self.repo)[0][-1]["phase"], "before_tool")
        with self.assertRaises(GateError):
            self.ack()

    def test_killed_writer_retains_checkpoint_and_pending(self):
        self.ack()
        script = '''import sys, time
from pathlib import Path
sys.dont_write_bytecode = True
sys.path.insert(0, sys.argv[1])
from core import Repo
from control import begin
r = Repo(sys.argv[2])
begin(r, "session-1", "killed-tool", "Write", {}, ["a.txt"])
(r.root / "a.txt").write_text("partial-before-kill")
print("READY", flush=True)
time.sleep(120)
'''
        process = subprocess.Popen([sys.executable, "-I", "-c", script,
                                    str(self.root / "tools/handoff"), str(self.root)],
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            self.assertEqual(process.stdout.readline().strip(), "READY")
            process.kill()
            process.wait(timeout=10)
            self.assertEqual(self.report(session="after-crash")["exit_code"], 20)
            self.assertEqual(read_records(self.repo)[0][-1]["phase"], "before_tool")
            self.assertEqual((self.root / "a.txt").read_text(), "partial-before-kill")
            recover(self.repo, "after-crash", reviewed=True)
        finally:
            if process.poll() is None:
                process.kill()
                process.wait(timeout=10)
            process.stdout.close()
            process.stderr.close()

    def test_wrong_post_identity_does_not_release_reservation(self):
        self.ack()
        data = self.begin()
        with self.assertRaises(GateError):
            finish(self.repo, "other", "call-1", "Write", data)
        with self.assertRaises(GateError):
            finish(self.repo, self.session, "wrong-call", "Write", data)
        with self.assertRaises(GateError):
            finish(self.repo, self.session, "call-1", "Write", {"changed": True})
        self.assertTrue((self.repo.control / "transaction.lock").exists())

    def test_completed_tool_id_cannot_be_replayed(self):
        self.ack()
        data = self.begin()
        self.put("a.txt", "allowed edit")
        finish(self.repo, self.session, "call-1", "Write", data)
        with self.assertRaises(GateError):
            self.begin()

    def test_lock_without_pending_can_be_recovered_by_operator(self):
        durable_json(self.repo.control / "transaction.lock", {"session_id": self.session, "worktree": self.repo.worktree})
        self.assertEqual(self.report()["exit_code"], 20)
        recover(self.repo, self.session, reviewed=True)
        self.assertFalse((self.repo.control / "transaction.lock").exists())
        self.ack()

    def test_windows_git_alias_and_hardlinks_are_rejected(self):
        for path in (".git./config", ".GIT /config", "NUL.txt", "dir./a.txt"):
            with self.subTest(path=path), self.assertRaises(GateError):
                self.repo.path(path, regular=True)
        outside = Path(self.temp) / "outside.txt"
        outside.write_text("protected")
        os.link(outside, self.root / "hardlink.txt")
        with self.assertRaises(GateError):
            self.repo.path("hardlink.txt", regular=True)
        self.assertEqual(outside.read_text(), "protected")

    @unittest.skipUnless(os.name == "nt", "Windows case normalization")
    def test_windows_case_alias_cannot_bypass_overlap_or_scope(self):
        other = Path(self.temp) / "other"
        self.g("worktree", "add", "-b", "other", str(other))
        self.put("a.txt", "other dirty", root=other)
        self.assertEqual(self.report(("A.TXT",))["exit_code"], 20)
        (other / "a.txt").write_text("base\n")
        self.ack(("A.TXT",))
        data = self.begin("a.txt")
        self.put("a.txt", "edited")
        finish(self.repo, self.session, "call-1", "Write", data)

    def test_claim_invariant_blocks_history_does_not_and_tasks_are_scoped(self):
        historical = self.claim(kind="historical_evidence", claim_id="history")
        checkpoint(self.repo, self.session, self.task, new_claims=[historical], terminal=True)
        self.assertNotEqual(self.report()["exit_code"], 20)
        invariant = self.claim()
        checkpoint(self.repo, self.session, self.task, new_claims=[invariant])
        self.assertEqual(self.report()["exit_code"], 20)
        results = self.report()["claim_results"]
        self.assertTrue(any(r["claim_id"] == "c1" and r["passed"] is False for r in results))
        self.assertNotEqual(self.report(task="different-task")["exit_code"], 20)
        with self.assertRaises(GateError):
            checkpoint(self.repo, self.session, self.task, new_claims=[self.claim(kind="historical_evidence")])

    def test_executable_claim_rejected_and_version_invariant_checked(self):
        with self.assertRaises(GateError):
            checkpoint(self.repo, self.session, self.task, new_claims=[self.claim(verifier="shell")])
        self.put("left.json", '{"version":1}')
        self.put("right.json", '{"version":2}')
        c = self.claim(verifier="versions_equal", args={"left": "left.json", "right": "right.json", "key": "version"}, expected=True)
        checkpoint(self.repo, self.session, self.task, new_claims=[c])
        self.assertEqual(self.report()["exit_code"], 20)
        self.put("right.json", '{"version":1}')
        self.assertNotEqual(self.report()["exit_code"], 20)

    def test_checkpoint_hash_corruption_is_not_trusted(self):
        checkpoint(self.repo, self.session, self.task)
        self.put(".git/handoff/partial.json", '{"schema_version":1')
        self.assertIn("INVALID_CHECKPOINT", warning_codes(self.report()))
        records, invalid = read_records(self.repo)
        self.assertEqual(len(records), 1)
        self.assertEqual(invalid, ["partial.json"])
        records[0]["head_sha"] = "tampered"
        with self.assertRaises(GateError):
            validate_record(records[0])

    def test_export_uses_ack_and_copies_only_requested_task_snapshot(self):
        original = checkpoint(self.repo, self.session, self.task, terminal=True)
        self.ack((".handoff/latest.json",))
        args = handoff.parser().parse_args(["export", "--repo", str(self.root),
                                          "--session", self.session, "--task", self.task])
        result = handoff.run(args)
        self.assertTrue(result["ready"])
        exported = json.loads((self.root / ".handoff/latest.json").read_text("utf-8"))
        self.assertEqual(exported, original)

    def test_schema_and_checkpoint_types_match(self):
        value = checkpoint(self.repo, self.session, self.task)
        schema = json.loads((SOURCE / "schema.json").read_text("utf-8"))
        self.assertEqual(set(value), set(schema["required"]))
        for field, bad in (("dirty", [42]), ("next_steps", [False]), ("session_id", ""),
                           ("task_id", ""), ("schema_version", True)):
            changed = dict(value)
            changed[field] = bad
            changed["record_hash"] = digest({k: v for k, v in changed.items() if k != "record_hash"})
            with self.subTest(field=field), self.assertRaises(GateError):
                validate_record(changed)

    def test_drift_and_uncLOSED_session(self):
        checkpoint(self.repo, self.session, self.task)
        self.put("a.txt", "next")
        self.commit()
        codes = warning_codes(self.report(session="next-session"))
        self.assertIn("HEAD_DRIFT", codes)
        self.assertIn("UNCLOSED_SESSION", codes)
        checkpoint(self.repo, "next-session", self.task, phase="session_start")
        self.assertIn("HEAD_DRIFT", warning_codes(self.report(session="next-session")))

    def test_other_worktree_operation_warns_and_overlap_blocks(self):
        other = Path(self.temp) / "other"
        self.g("worktree", "add", "-b", "other", str(other))
        self.put("a.txt", "other dirty", root=other)
        gd = Path(self.g("rev-parse", "--path-format=absolute", "--git-dir", root=other).decode().strip())
        (gd / "MERGE_HEAD").write_bytes(self.g("rev-parse", "HEAD"))
        report = self.report(("b.txt",))
        self.assertEqual(report["exit_code"], 10)
        self.assertTrue(any(r["code"] == "OPERATION_IN_PROGRESS" for r in report["reasons"]))
        self.assertEqual(self.report()["exit_code"], 20)
        # Current operation always blocks, even with no overlapping touch path.
        current_gd = Path(self.g("rev-parse", "--path-format=absolute", "--git-dir").decode().strip())
        (current_gd / "CHERRY_PICK_HEAD").write_bytes(self.g("rev-parse", "HEAD"))
        self.assertEqual(self.report(("b.txt",))["exit_code"], 20)

    def test_versions_detect_real_script_but_allow_independent_css_version(self):
        self.put("game-version.json", '{"v":398}')
        self.put("game.html", '<link href="css/game.css?v=284"><script src="js/game.js?v=398"></script>')
        self.put("js/game.js", 'var GAME_VER = 398;')
        self.assertNotIn("VERSION_MISMATCH", warning_codes(self.report()))
        self.put("game-version.json", '{"v":399}')
        self.assertIn("VERSION_MISMATCH", warning_codes(self.report()))

    def test_shell_syntax_scripts_unknown_tools_and_cross_scope_denied(self):
        bad = ('echo pwn > a.txt', 'python -c "open(\'a.txt\',\'w\')"',
               'sed -i s/a/b/ a.txt', 'tee a.txt', 'git status; echo x',
               'git log --output=a.txt', 'git -c alias.x="!echo pwn" x',
               'py -I tools/handoff/gate.py $(echo x)', 'pwd\necho pwn')
        for command in bad:
            with self.subTest(command=command), self.assertRaises(GateError):
                hook.shell_read_or_helper(self.repo, self.session, command)
        hook.shell_read_or_helper(self.repo, self.session, "pwd")
        with self.assertRaises(GateError):
            hook.tool_paths(self.repo, "Write", {"file_path": "../outside.txt"})
        with self.assertRaises(GateError):
            hook.tool_paths(self.repo, "Write", {"file_path": ".git/config"})
        nested = self.root / "nested"
        self.put("nested/tools/handoff/gate.py", "raise SystemExit('spoof')")
        with self.assertRaises(GateError):
            hook.shell_read_or_helper(self.repo, self.session, "py -I tools/handoff/gate.py", nested)
        hook.shell_read_or_helper(self.repo, self.session, "py -I tools/handoff/gate.py")

    def test_hook_maps_error_to_blocking_exit_two(self):
        payload = {"session_id": self.session, "cwd": str(self.root),
                   "hook_event_name": "PreToolUse", "tool_name": "Write",
                   "tool_use_id": "real-call", "tool_input": {"file_path": str(self.root / "a.txt"), "content": "blocked"}}
        result = subprocess.run([sys.executable, "-I", str(self.root / "tools/handoff/hook.py")],
                                input=canonical(payload).encode(), capture_output=True)
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertEqual((self.root / "a.txt").read_text(), "base\n")
        payload["tool_name"] = "mcp__unknown__write"
        result = subprocess.run([sys.executable, "-I", str(self.root / "tools/handoff/hook.py")],
                                input=canonical(payload).encode(), capture_output=True)
        self.assertEqual(result.returncode, 2)

    @unittest.skipIf(os.name == "nt", "Windows v1 rejects all reparse points; native junction test covers this")
    def test_posix_symlink_target_hashed_without_following_and_write_denied(self):
        link = self.root / "link.txt"
        try:
            link.symlink_to(self.root / "a.txt")
        except OSError:
            self.skipTest("OS does not permit symlink creation")
        state = snapshot(self.repo)
        self.assertEqual(state["worktrees"][self.repo.worktree]["files"]["link.txt"]["kind"], "symlink")
        with self.assertRaises(GateError):
            self.repo.path("link.txt", regular=True)

    @unittest.skipUnless(os.name == "nt", "Windows reparse-point policy")
    def test_windows_reparse_point_and_parent_are_blocked(self):
        outside = Path(self.temp) / "junction-target"
        outside.mkdir()
        (outside / "protected.txt").write_text("unchanged")
        link = self.root / "junction"
        subprocess.run(["cmd.exe", "/c", "mklink", "/J", str(link), str(outside)],
                       check=True, capture_output=True)
        with self.assertRaises(GateError):
            self.repo.path("junction/protected.txt", regular=True)
        with self.assertRaises(GateError):
            self.repo.path("junction")
        with self.assertRaises(GateError):
            snapshot(self.repo)
        self.assertEqual((outside / "protected.txt").read_text(), "unchanged")

    def test_as_of_required_for_age_check_and_explicit_determinism(self):
        a = gate(self.repo, task=self.task, as_of="2100-01-01T00:00:00Z")[1]
        self.assertIn("FETCH_STALE", warning_codes(a))
        self.assertEqual(a, gate(self.repo, task=self.task, as_of="2100-01-01T00:00:00Z")[1])
        with self.assertRaises(GateError):
            gate(self.repo, as_of="no timezone")


if __name__ == "__main__":
    unittest.main(verbosity=2)
