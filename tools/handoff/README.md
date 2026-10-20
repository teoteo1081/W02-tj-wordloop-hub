# Handoff gate

Python 3.12+ stdlib; Git; Claude Code **2.1.295+** for fail-closed `onFailure`.
The checked-in hook uses the Windows `py` launcher and exec-form `args`.
On another OS, change only its executable to an installed Python 3.12+ launcher
and re-run the runtime tests before relying on enforcement.

## Daily use

1. Read the `SessionStart` context for the actual Claude session ID. Pick a task
   ID that describes the continuing task; do not invent a new task to evade an
   invariant. A new task still inherits all repository-wide checks.
2. Run the gate with exact file paths, repeated for multiple files:

   ```text
   py -I tools/handoff/gate.py --session SESSION --task TASK --touch js/example.js
   ```

   The first output line is JSON; the second is `GATE_TOKEN=...`. CLI exit codes:
   `0` clean, `10` warnings, `20` blocked, `2` collection/validation error.
   File paths are repo-relative, not directories or globs. Ignored files are
   outside the default snapshot; explicitly touched ignored files are included.
   Use the same session/task/scope for the next step. If age of the last fetch
   matters, supply an explicit `--as-of 2026-10-19T12:00:00Z` to both commands.
   Without `--as-of` the gate does not make a wall-clock fetch-age claim.
3. For exit 10, report the warnings to TJ before acknowledging them. Supply each
   distinct warning `code` with `--accept CODE`; the helper requires exactly the
   currently observed set. Exit 20 or 2 cannot be acknowledged.

   ```text
   py -I tools/handoff/handoff.py ack --session SESSION --task TASK --touch js/example.js --token HASH --accept UNRECORDED_WORK
   ```

   For exit 0, omit `--accept`. Ack records that the agent inspected the state;
   it does not authorize push, merge, deployment or another action requiring TJ.
4. Use Edit, Write or NotebookEdit. Their PreToolUse hook checks a fresh snapshot,
   reserves the actual tool ID once, persists a before checkpoint, and consumes
   the ack. Their post hook checks the result and automatically issues the next
   ack only when the expected file changed, Git/index/refs and other files stayed
   unchanged, and no new warning/block appeared. A second legitimate edit is
   allowed without acknowledging the first edit's own hash change.
5. Before finishing the task, write an explicit final checkpoint:

   ```text
   py -I tools/handoff/handoff.py write --session SESSION --task TASK --status done --next "No remaining work."
   ```

   Use `partial`, `blocked` or `abandoned` when appropriate. `Stop` is per turn,
   not per session; it saves a nonterminal partial checkpoint. `SessionEnd` may
   close a session as partial; it never infers task completion. If a session dies,
   its earlier checkpoint and/or pending marker remain evidence of uncertainty.

## Supported tools and shell commands

Read, Glob, Grep, WebFetch, WebSearch and a small explicit list of interaction
tools are allowed without an ack. Unknown tools, including unregistered MCP
tools, are denied. Edit/Write/NotebookEdit have scoped write adapters.

The shell allowlist deliberately has no general command parser. It accepts only
`pwd`, `git --version`, and `py/python -I` invoking this worktree's `gate.py` or
the helper's `ack`, `write`, `export` subcommands. Compound commands, redirects,
expansion, background commands, arbitrary scripts/Python, `tee`, `sed -i`,
`git log --output` and Git mutation commands are denied. Use file tools to read
and edit. File tools must provide absolute paths so a subdirectory cannot change
the meaning of a target. Run tests or Git commit from the operator/Codex shell until there is a
verified operation adapter for them; do not disguise those commands as reads.

The PreToolUse hook returns an empty success result after preparation, leaving
Claude's normal permission checks in effect. A later permission denial may leave
a pending reservation if no post event runs. This is intentional: an absent post
event never silently renews permission.

## Recovery

Checkpoint files are in `<git-common-dir>/handoff/`; mutable ack/pending/lock and
used-tool-ID files are in `<git-common-dir>/handoff-control/`. A linked worktree's
`.git` is a file: never construct these locations by appending to `./.git`.
State is shared locally among worktrees and is not automatically synced to Git.

If interrupted, inspect the gate output, pending marker, before checkpoint and
actual Git/worktree state. Establish that **no writer is still running**. Then
an operator in the owning worktree can run, from a separate shell:

```text
py -I tools/handoff/handoff.py recover --session REVIEWER --task TASK --reviewed
```

Recovery also handles a lock left before pending was written or after pending
was removed. It saves an uncertainty checkpoint, invalidates the original ack,
and releases the reservation. Re-run the gate and acknowledge a fresh token.
It does not roll back any work. Recovery is deliberately denied inside the
Claude shell adapter: a model cannot clear its own active transaction. Do not
delete metadata files or expire locks merely because they are old.

For sharing with another machine, explicitly acknowledge `.handoff/latest.json`
as a touch path and run:

```text
py -I tools/handoff/handoff.py export --session SESSION --task TASK
```

This copies the latest checkpoint of that task/worktree through the same write
transaction. Successful export checkpoints preserve the source task's status,
terminal flag, description and next steps; exporting a completed task does not
reopen it. A failed or interrupted export still requires transaction recovery.
The imported JSON is historical evidence, not an ack on another
machine. Local repo IDs include the common-dir identity; exports do not silently
join a different machine's active checkpoint chain.

## Claims

`schema.json` describes checkpoints and claims; readers also enforce the schema's
field/type/enum rules in stdlib code and verify a SHA-256 record hash. An invalid
or incomplete checkpoint is preserved, excluded from the valid chain and reported
as `INVALID_CHECKPOINT`. Writers use exclusive creation, flush/fsync and make
records read-only. Read-only attributes and hashes prevent accidental overwrite
and detect alteration; they are not an authentication or filesystem security
boundary against an actor who can modify the metadata directory.

`handoff.py write --claims-file PATH` accepts an array of declarative claims.
Each has `claim_id`, `kind`, `repo_id`, `worktree`, `task_id`, `baseline_head`,
`applies_head` (SHA or null), `verifier`, `args`, `expected`. Take repo/worktree
identity from the gate output/checkpoints; do not guess it. Supported verifiers:

| Verifier | Args | Expected |
|---|---|---|
| `head_equals` | `{}` | commit SHA string |
| `versions_equal` | `{"left":"a.json","right":"b.json","key":"version"}` | `true` |

`historical_evidence` is never replayed as a current blocker. A
`required_invariant` is replayed only in its exact repo/worktree/task and, when
set, its `applies_head`. Its wrong result blocks; an unreadable/unsupported input
is an error. Claim inputs must be in the snapshot; explicitly touch an ignored
input. Claims are accumulated across valid records; omission or a new ack does
not remove one. Redefining an existing claim ID with different meaning is denied.
There is no automatic claim retirement/policy override command in v1: changes
require a reviewed implementation/policy change. No claim can execute shell code.

## Evidence and limitations

The token hashes exact content of tracked and nonignored untracked files, index
stages/modes/object IDs, HEAD/refs/stash, operations and all available worktrees.
It also binds task, scope, active claims, policy, reasons and explicit time input.
No source contents or tool Write contents are saved in checkpoints; snapshots in
control state contain paths and digests. Git runs with optional locks, fsmonitor,
untracked-cache and replace objects disabled. Active external clean/process
filters are unsupported and rejected before status; inactive configured drivers
are disabled for status collection. Git configuration is hashed without storing
its values. Collection is repeated to detect
concurrent changes. No network/fetch/index refresh is performed by the gate.

New checkpoints include an optional v1 `content_hash` of the index and all tracked
and nonignored untracked file contents/modes. Gate compares it with the latest
non-SessionStart checkpoint, so changes after a completed checkpoint (including
a second rewrite of an already dirty file) warn as `UNRECORDED_WORK`. Opening a
session does not clear this warning. Old v1 checkpoints remain readable; dirty
work against one without this fingerprint warns as `CHECKPOINT_STATE_UNVERIFIED`.
This comparison is independent of touch scope. Ignored files stay outside this
cross-checkpoint fingerprint; exact touched ignored files remain protected by
the full scoped acknowledgement token, as before.

Windows trailing-dot/space aliases, reserved device names, path traversal and
Git metadata targets are rejected. Write/verifier paths cannot be symlinks,
junctions or hardlinks. On Windows v1 all reparse points (including symlinks and
junctions) fail closed, both in the snapshot and in write paths. This deliberately
limits the supported Windows scope to regular files; native junction fixtures
test the shared reparse-point guard without requiring symlink privilege. On
POSIX, snapshot code records a file symlink's target without following it;
that POSIX-only behavior is not claimed as runtime-verified on this Windows host.
Directory symlinks/junctions and submodules are unsupported and fail closed.
Case-colliding repositories are unsupported. Locked/prunable/bare or unreadable
worktrees require operator review rather than being silently omitted.

This coordinates cooperating adapters, not arbitrary processes or a malicious
agent that can disable hooks. It cannot prevent an external process from changing
a path after preflight, nor recover unflushed results from a process killed during
a write. Postflight detects unexpected changes; it does not undo them. Both normal
permissions and TJ's authorization rules still apply.

The game check compares `game-version.json.v` to the game.js query parameter and
to a literal `GAME_VER`, when one exists; CSS and script query versions are
independent. Starter versions must match. It does not prove that every changed
JS/CSS file received a cache bump; review that separately before publishing.

Run focused tests (no network/model usage):

```text
py -I tools/handoff/test_handoff.py
```

Opt-in actual Claude runtime tests consume the logged-in Claude allowance and
run only in disposable repos with Read/Write tools, no MCP servers, no app/game:

```text
py -I tools/handoff/test_runtime.py --output tools/handoff/runtime-evidence.json
```

See `IMPLEMENTATION_REPORT.md` for the observed outcomes and independent QA.
That report and the checked-in runtime evidence describe the original
implementation checkpoint. The 2026-10-20 checkpoint/export fixes change the
production Python sources; the old runtime digests do not certify these changes.
Their behavioral regressions are checked separately; repeat the opt-in Claude
runtime suite before claiming fresh runtime enforcement evidence.
Runtime configuration reference: [Claude Code hooks](https://code.claude.com/docs/en/hooks).
