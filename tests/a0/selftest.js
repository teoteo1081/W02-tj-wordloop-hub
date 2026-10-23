"use strict";
// Counterexamples mutate source strings in memory only. Baseline files are never written.
const baseline = require("../capture/baseline");
const { cases } = require("./unit");
const { casesRun, assert } = require("./harness");
const mutations = [
  { file: "js/context.js", from: "String(b).length - String(a).length", to: "String(a).length - String(b).length", id: "CTX-01" },
  { file: "js/util.js", from: ".toLowerCase().trim()", to: ".trim()", id: "UTL-01" },
  { file: "js/srs.js", from: "wait: 24 * HOUR", to: "wait: 23 * HOUR", id: "SRS-01" },
  { file: "js/db.js", from: "return !tomb[row.id];", to: "return true;", id: "DB-02" },
  { file: "js/readalong.js", from: "a.length >= 8 ? 2 : 1", to: "0", id: "RA-01" },
  { file: "js/context.js", from: 'if (eGemini.kind === "quota_user") throw eGemini;', to: "if (false) throw eGemini;", id: "CTX-11" }
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
  return { passed: results.filter(x => x.status === "PASS").length, failed: results.filter(x => x.status === "FAIL").length, results };
}
if (require.main === module) run().then(r => { console.log(JSON.stringify(r, null, 2)); process.exitCode = r.failed ? 1 : 0; }).catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { run };
