"use strict";
// Counterexamples mutate source strings in memory only. Baseline files are never written.
const baseline = require("../capture/baseline");
const { cases } = require("./unit");
const { casesRun, assert } = require("./harness");
const cachePolicy = require("./cache-policy");
const { isNonReadingRule } = require("./static");
const mutations = [
  { file: "js/context.js", from: "String(b).length - String(a).length", to: "String(a).length - String(b).length", id: "CTX-01" },
  { file: "js/util.js", from: ".toLowerCase().trim()", to: ".trim()", id: "UTL-01" },
  { file: "js/srs.js", from: "wait: 24 * HOUR", to: "wait: 23 * HOUR", id: "SRS-01" },
  { file: "js/db.js", from: "return !tomb[row.id];", to: "return true;", id: "DB-02" },
  { file: "js/readalong.js", from: "a.length >= 8 ? 2 : 1", to: "0", id: "RA-01" },
  { file: "js/context.js", from: 'if (eGemini.kind === "quota_user") throw eGemini;', to: "if (false) throw eGemini;", id: "CTX-11" },
  { file: "js/context.js", from: "if (isTJ && hasOpenAI)", to: "if (false)", id: "CTX-09" }
];
async function run(root = baseline.defaultRoot()) {
  baseline.assertPinned(root);
  const results = [];
  for (const m of mutations) {
    let changed = false;
    const tests = cases(root, { transform(file, source) { if (file !== m.file) return source; assert.ok(source.includes(m.from), "Mutation marker missing: " + m.id); changed = true; return source.replace(m.from, m.to); } }).filter(c => c.id === m.id);
    const control = await casesRun(cases(root).filter(c => c.id === m.id));
    const mutant = await casesRun(tests);
    results.push({ id: m.id, status: control.failed === 0 && changed && mutant.failed > 0 ? "PASS" : "FAIL", controlFailures: control.failed, mutantFailures: mutant.failed });
  }
  cachePolicy.validate(cachePolicy.load());
  const policy = cachePolicy.approvedBaseline(), config = policy.entries.find(e => e.kind === "until-preview"), issue = { file: config.file, line: config.line, resource: config.resource };
  const checks = [
    ["CACHE-preview", () => { assert.equal(cachePolicy.classify([issue], policy).accepted.length, 1); assert.equal(cachePolicy.classify([issue], policy, true).blocked.length, 1); }],
    ["CACHE-no-expansion", () => assert.throws(() => cachePolicy.validate({ ...policy, entries: [...policy.entries, { file: "evil.html", line: 1, resource: "new.js", kind: "metadata" }] }))],
    ["CACHE-no-deadline-removal", () => assert.throws(() => cachePolicy.validate({ ...policy, entries: policy.entries.map(e => e.kind === "until-preview" ? { ...e, kind: "metadata" } : e) }))],
    ["CACHE-no-duplicates", () => assert.throws(() => cachePolicy.validate({ ...policy, entries: [...policy.entries, policy.entries[0]] }))],
    ["CACHE-removal-allowed", () => { assert.equal(cachePolicy.validate({ ...policy, entries: [] }).entries.length, 0); assert.equal(cachePolicy.classify([issue], { ...policy, entries: [] }).blocked.length, 1); }],
    ["CACHE-new-issue-blocked", () => assert.equal(cachePolicy.classify([{ file: "new.html", line: 1, resource: "new.js" }], policy).blocked.length, 1)],
    ["CACHE-no-readd-after-removal", () => { assert.throws(() => cachePolicy.validate(policy, { ...policy, entries: policy.entries.filter(e => e.kind !== "until-preview") })); }],
    ["CACHE-committed-readd-rejected", () => { const reduced = { ...policy, entries: policy.entries.filter(e => e.kind !== "until-preview") }; assert.throws(() => cachePolicy.validateHistory(policy, [policy, reduced, policy])); assert.equal(cachePolicy.validateHistory(reduced, [policy, reduced, policy]).entries.length, 4); }],
    ["CSS-menu-scope", () => assert.equal(isNonReadingRule("css/app.css", ".menu-sub", "word-break:break-all"), true)],
    ["CSS-reading-not-exempt", () => { assert.equal(isNonReadingRule("css/app.css", ".bd-doc", "word-break:break-all"), false); assert.equal(isNonReadingRule("css/game.css", ".menu-sub", "word-break:break-all"), false); assert.equal(isNonReadingRule("css/app.css", ".menu-sub, .bd-doc", "word-break:break-all"), false); }]
  ];
  results.push(...(await casesRun(checks.map(([id, run]) => ({ id, name: id, run })))).results);
  return { passed: results.filter(x => x.status === "PASS").length, failed: results.filter(x => x.status === "FAIL").length, results };
}
if (require.main === module) run().then(r => { console.log(JSON.stringify(r, null, 2)); process.exitCode = r.failed ? 1 : 0; }).catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { run };
