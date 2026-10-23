"use strict";
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const cp = require("node:child_process");
// Ratchet ceiling: only these five identities from the reviewed baseline may be exempted.
const CEILING = [
  ["game.html", 7, "icon.svg", "metadata"],
  ["index.html", 25, "manifest.webmanifest", "metadata"],
  ["index.html", 26, "icon.svg", "metadata"],
  ["index.html", 27, "icon.svg", "metadata"],
  ["learn/sw/index.html", 15, "../../js/config.js", "until-preview"]
].map(entry => JSON.stringify(entry));
function key(e) { return JSON.stringify([e.file, e.line, e.resource, e.kind]); }
function validate(policy, previous) {
  assert.ok(policy && typeof policy.decision === "string" && Array.isArray(policy.entries), "Invalid cache-policy schema");
  const seen = new Set();
  for (const entry of policy.entries) {
    assert.deepEqual(Object.keys(entry).sort(), ["file", "kind", "line", "resource"], "Unexpected policy fields");
    const id = key(entry);
    assert.ok(CEILING.includes(id), "Unapproved cache exception or changed deadline");
    assert.ok(!seen.has(id), "Duplicate cache exception"); seen.add(id);
    if (previous) assert.ok(previous.entries.some(e => key(e) === id), "Cache exception re-added after removal; requires a new PO-reviewed policy change");
  }
  return policy;
}
function approvedBaseline() { return { decision: "Reviewed baseline ceiling; test fixture independent of remaining exceptions", entries: CEILING.map(text => JSON.parse(text)).map(([file,line,resource,kind]) => ({file,line,resource,kind})) }; }
function validateHistory(policy, revisions) {
  validate(policy);
  // Intersection with every committed policy: a removed entry cannot quietly return,
  // even if the re-addition was already committed. Corrective removals can still pass.
  for (const previous of revisions) validate(policy, previous);
  return policy;
}
function load() {
  const git = args => cp.execFileSync("git", ["-C", path.resolve(__dirname, "../.."), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const commits = git(["log", "--format=%H", "--", "tests/a0/STA-03.allow.json"]).split("\n").filter(Boolean);
  const revisions = commits.map(commit => JSON.parse(git(["show", commit + ":tests/a0/STA-03.allow.json"])));
  return validateHistory(JSON.parse(fs.readFileSync(path.join(__dirname, "STA-03.allow.json"), "utf8")), revisions);
}
function classify(issues, policy = load(), preview = false) {
  validate(policy);
  const accepted = [], blocked = [];
  for (const issue of issues) {
    const entry = policy.entries.find(e => e.file === issue.file && e.line === issue.line && e.resource === issue.resource);
    if (entry && (!preview || entry.kind === "metadata")) accepted.push({ ...issue, kind: entry.kind });
    else blocked.push(issue);
  }
  return { accepted, blocked };
}
module.exports = { load, validate, classify, approvedBaseline, validateHistory };
