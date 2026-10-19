# Handoff gate implementation evidence

Implementation branch: `handoff/gate`, continuing plan commit `43a2ee2`.
Scope: handoff tooling, Claude settings/instructions, tests and this plan/report.
No application JS/CSS, database, deployment, push or merge is part of this work.

## Execution contract

The supported Windows regular-file workflow must inspect real Git state without
writing to the repo; persist immutable checkpoints; bind acknowledgements to
session, task, worktree, scope and snapshot; reject stale/replayed rights and
unsupported write paths; retain uncertainty after interruption; and verify
claims only in their declared scope. Claude's normal permission checks remain in
effect. Arbitrary shell/Git mutation adapters are intentionally not implemented;
the plan explicitly allows denying unsupported operations.

Measurement adaptation was communicated before final status and recorded in
PLAN section 8: Windows v1 rejects **all reparse points**, including symbolic
links and junctions. This host cannot create unprivileged symlinks. An actual
native junction tests the same Windows reparse-point rejection, including parent
traversal and snapshot collection. The POSIX symlink test is outside the Windows
runtime claim; no untested Windows symlink support is advertised.

## Verification

Final execution status: **SUCCESS** for the revised Windows contract.

- Final behavioral suite: **29 tests, 28 passed, 1 POSIX-only skip**, exit 0,
  397.283 seconds. Native Windows reparse-point tests passed; the skip is not an
  unproven Windows capability being treated as passed.
- Actual Claude Code **2.1.303**: **7/7 runtime scenarios passed**. Every case's
  five production source hashes match the final files, independently checked by
  the executor and QA.
- Real repository: **2 worktrees, 737 files**, including Git metadata; identical
  before/after SHA-256 `51281ae44072900b6b6d3e6bb7497322af7d82a3b877c302634a44843a882770`.
  Two CLI outputs were byte-identical, exits `[0, 0]`.
- Python AST/JSON checks and `git diff --check` passed.

Commands:

```text
py -I tools/handoff/test_handoff.py
py -I tools/handoff/test_runtime.py --output tools/handoff/runtime-evidence.json
py -I tools/handoff/verify_repository.py --output tools/handoff/real-evidence.json
git diff --check
```

| Contract criterion | Evidence |
|---|---|
| Clean/warning/block/error decisions; merge and worktree overlap | Disposable Git fixtures, including current and other-worktree operation states |
| Content-sensitive token | Already-dirty file rewritten with identical byte length and restored mtime; porcelain unchanged, token changes |
| Index/untracked/deleted/ignored path handling | Staged, untracked, Unicode and explicitly scoped ignored file fixtures |
| Scoped one-use writes | Two sequential writes; foreign session, old token, wrong path, duplicate post/tool ID and outside-scope changes denied |
| Crash uncertainty | Real writer subprocess killed after partial write; durable before checkpoint/pending remain, next write blocked; reviewed recovery invalidates ack |
| Append-only records and declarative claims | Schema/type/hash checks; malformed record excluded; historical claim does not block; active invariant does; executable claim rejected |
| Windows path safety | Metadata aliases/reserved paths, case aliases, hardlinks and actual native junction rejected |
| No external Git filter execution | Clean/process drivers configured to write a sibling marker; gate rejects before marker creation |
| Actual Claude enforcement | Seven runtime scenarios, including successful two-write workflow and fail-closed exceptions/missing interpreter/timeout |
| Real repo read-only/determinism | Independent content/mode fingerprint of Git-listed worktree files and Git common-dir files before/after two CLI gate invocations; stdout compared byte-for-byte |

`runtime-evidence.json` contains the actual Claude version, tool call counts,
hook events, denial reasons, final target content and SHA-256 of each production
Python source file copied into each fixture. The test uses only disposable
repos, Read/Write tools and an empty MCP configuration. Its auto-ack bootstrap is
test-only; production settings never automatically acknowledge warnings.

`real-evidence.json` is written only after the before/after comparison, so its own
creation is not confused with a gate side effect. Worktree/remote state may evolve
outside this branch. Merge-review was active when the original plan was written;
another workflow subsequently integrated main to `e324beb` and removed the old
worktrees. Current real-repo verification therefore measures the available
worktrees, and merge-in-progress behavior is demonstrated with reproducible
fixtures. No changes from that integration were merged into this branch here.

## Independent QA

The independent reviewer discovered six additional defects during implementation:
Windows `.git.` aliases, hardlinks escaping scope, case-insensitive overlap,
replayed tool IDs, orphan lock recovery, and Git clean/process filters executing
inside status. All were fixed and independently re-reproduced in fresh temp
repos. The reviewer also independently checked the revised Windows reparse-point
contract against a real junction and found no additional critical issue.

Final independent verdict: **AUDIT_PASS — revised Windows contract**. QA inspected
the final artifacts, independently matched every recorded source digest to the
current files and reviewed the real-repo inspector's separate fingerprint logic.
No critical finding remains in the supported scope. The final behavioral summary
above was supplied by the executor after the suite completed.

## Operational limits

- Claude Code 2.1.303 and Python 3.12 on Windows were the runtime under test.
  Hooks require Claude 2.1.295+ for `onFailure: block`. Other runtimes/OSs require
  their own integration run. The checked-in executable is the Windows `py` launcher.
- Windows reparse points, submodules, case-colliding/bare/prunable worktrees and
  active external Git filters fail closed. POSIX symlink behavior is not covered
  by this Windows evidence.
- The lock coordinates cooperating adapters. This is not a sandbox against a
  malicious actor disabling hooks or external processes racing filesystem or Git
  configuration. Snapshots detect persistent drift; no postflight undoes a write.
- Missing post events or permission denials may leave a pending reservation;
  recovery requires an operator to inspect reality and establish no writer lives.
- Game/starter version equality is checked. An automatic proof of every changed
  JS/CSS cache bump is not provided; review cache bumps before publishing.
- CLI runtime tests use the existing logged-in Claude allowance. No separately
  billed API service was provisioned; the allowance/billing cost was not measured.
- PowerShell verification output was appended to `Desktop/session_3.txt` at the
  user's request. Each command transcript ends with its command process; it does
  not claim to contain chat messages or every file-edit tool operation.
