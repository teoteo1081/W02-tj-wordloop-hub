"use strict";
// Reports are observations, not approved golden fixtures. Never rewrites the baseline.
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process");
const assert = require("node:assert/strict");
const baseline = require("../capture/baseline"), unit = require("./unit"), measure = require("./measure"), statics = require("./static"), selftest = require("./selftest");
const root = path.resolve(__dirname, "../..");
const git = (...args) => cp.execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
const SOURCE_FILES = ["js/util.js", "js/srs.js", "js/context.js", "js/db.js", "js/readalong.js", "js/detail.js"];
function coverage(results) {
  const ids = [...new Set(results.map(r => r.id))].sort();
  return {
    executedIds: ids,
    failingIds: [...new Set(results.filter(r => r.status === "FAIL").map(r => r.id))],
    partial: {
      "CTX-05": "Valid single-source metadata flags tested; malformed/conflicting flags not tested.",
      "CTX-12": "Node lookup tested; game/CC contract assertions remain static M0.5a, not DOM execution.",
      "CTX-13": "Public Detail.generatePassage no-key/AI-error preserves empty block and never invokes stock fallback; rendering is a stub, not a visual assertion.",
      "CTX-15": "Quota forwarded on single extraction and batched enrichment; multi-chapter app orchestration needs browser.",
      "RA-01": "Public _align plus toggle/fake SpeechRecognition lifecycle, card percentage and Board.broadcast tested. Real microphone, browser layout and Web Speech integration still need browser/device.",
      "DB-06": "Wrong/correct and missing-column fallback tested; blank-answer filtering occurs in UI callers and is not tested here.",
      "DB-07": "Stored exact context and Detail.pushFixResult same-kind guard tested; WordSet saveAnswer/rendering not executed.",
      "LS-01": "Runtime trace for synthetic Node scenarios only, no full UI key/value golden or all 16 storage-reference files."
    },
    unexecuted: { "CTX-14": "Nightly generateAI prompt/random/title scenario not implemented.", "STA-11": "Only six modules loaded with entry-point checks here, not every tracked JS module.", "STA-09": "Applies from M2.", "STA-10": "Applies from M2.", browser: "M0.4, M0.5, M0.6, M0.7 and UI-dependent clauses; Playwright installation requires PO authorization.", CI: "M0.8 still awaits handoff/gate decision (G2)." }
  };
}
async function run() {
  const pin = baseline.assertPinned(baseline.defaultRoot());
  assert.equal(git("branch", "--show-current"), "feat/restructure-plan", "Wrong working branch");
  git("merge-base", "--is-ancestor", baseline.PIN.commit, "HEAD");
  const sourceHashes = Object.fromEntries(SOURCE_FILES.map(file => [file, { baseline: baseline.sha256Lf(path.join(baseline.defaultRoot(), file)), current: baseline.sha256Lf(path.join(root, file)) }]));
  const sourceEqual = Object.values(sourceHashes).every(h => h.baseline === h.current);
  const changedOutsideDocsTests = git("diff", "--name-only", baseline.PIN.commit, "--").split("\n").filter(Boolean).filter(file => !file.startsWith("tests/") && !file.endsWith(".md"));
  assert.deepEqual(changedOutsideDocsTests, [], "Changes outside docs/tests must be evaluated separately");
  const measured = measure.run(), currentMeasured = measure.run(root, { current: true });
  const baselineUnit = await unit.run(baseline.defaultRoot()), currentUnit = await unit.run(root);
  const baselineStatic = statics.run(), currentStatic = statics.run(root, { current: true });
  const counterexamples = await selftest.run();
  const existingCapture = ["verify_backend_fixture.js", "capture_context_calls.js", "selftest_capture_verify.js"].map(file => {
    const p = cp.spawnSync(process.execPath, [path.join(root, "tests/capture", file)], { cwd: root, encoding: "utf8", timeout: 30000 });
    return { file, exitCode: p.status, error: p.error ? p.error.message : null, stdout: p.stdout || "", stderr: p.stderr || "" };
  });
  const report = {
    status: "PARTIAL", scope: "A0 Node cycle; no application changes or production calls", checkpointBeforeCycle: git("rev-parse", "HEAD"),
    baseline: pin, originMainObserved: git("rev-parse", "origin/main"), sourceHashes, sourceEqual, changedOutsideDocsTests,
    baselineUnit, currentUnit, baselineStatic, currentStatic, counterexamples, existingCapture,
    coverage: coverage(currentUnit.results),
    measurementSummary: { largestJs: measured.largestJs, indexLocalScripts: measured.indexLocalScripts, escDefinitionCount: measured.escDefinitions.length, storageReferenceFileCount: measured.localStorage.referenceFiles.length, measurementMethods: measured.methods, incomplete: measured.pending, baselineAndCurrentAppMeasurementsEqual: JSON.stringify(measured.files.filter(f => /^js\//.test(f.file))) === JSON.stringify(currentMeasured.files.filter(f => /^js\//.test(f.file))) },
    poDecisions: ["CTX-09: baseline TJ profile chooses OpenAI first; TEST §3.1 requires Gemini first without specifying the TJ exception. Confirm existing exception or authorize separate behavior fix.", "STA-03: approve the five measured baseline version exceptions or authorize a separate application fix; no allowlist has been approved by this cycle.", "Before browser work: authorize Playwright package installation. G2 still needed for final CI integration; main drift decision needed before final integration."],
    notes: ["STA-07 conservatively reports two non-reading CSS candidates for technical scope review, not as a confirmed product violation.", "Legacy Context.generate still exists but no caller was found in application JS; CTX-13 is tested through Detail.generatePassage instead.", "No automatic acceptance of failures or golden updates; runner exits 1 while assertions fail or static review is pending."]
  };
  assert.deepEqual(currentUnit.results, baselineUnit.results, "Baseline/current unit behavior differs");
  assert.equal(sourceEqual, true, "Application source drift: evaluate before proceeding");
  if (existingCapture.some(p => p.exitCode !== 0) || counterexamples.failed || currentStatic.failed) report.status = "FAILURE";
  if (process.argv.includes("--write-report")) {
    fs.writeFileSync(path.join(__dirname, "cycle-report.json"), JSON.stringify(report, null, 2) + "\n");
    fs.writeFileSync(path.join(__dirname, "metrics-baseline.json"), JSON.stringify(measured, null, 2) + "\n");
  }
  console.log(JSON.stringify({ status: report.status, sourceEqual, baselineUnit: { passed: baselineUnit.passed, failed: baselineUnit.failed }, currentUnit: { passed: currentUnit.passed, failed: currentUnit.failed }, static: { passed: currentStatic.passed, failed: currentStatic.failed, pending: currentStatic.pending }, counterexamples, capture: existingCapture.map(({ file, exitCode }) => ({ file, exitCode })), reportWritten: process.argv.includes("--write-report") }, null, 2));
  process.exitCode = currentUnit.failed || currentStatic.failed || currentStatic.pending || counterexamples.failed || existingCapture.some(p => p.exitCode !== 0) ? 1 : 0;
}
if (require.main === module) run().catch(e => { console.error(e.stack); process.exitCode = 1; });
module.exports = { run, coverage };
