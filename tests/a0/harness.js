"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const NOW = 1792700000000;
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function sandbox(root, options = {}) {
  const values = new Map(), storageLog = [], timers = new Map(), calls = [];
  let serial = 0, random = 29;
  const localStorage = {
    getItem(key) { storageLog.push({ op: "get", key }); return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { storageLog.push({ op: "set", key, shape: typeof value }); values.set(key, String(value)); },
    removeItem(key) { storageLog.push({ op: "remove", key }); values.delete(key); }
  };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return NOW; } }
  const element = () => ({ classList: { add() {}, remove() {}, contains() { return false; } }, querySelectorAll() { return []; }, getBoundingClientRect() { return { top: 0, bottom: 30, height: 30 }; } });
  const w = { Date: Clock, Math: Object.create(Math), JSON, URL, AbortController, localStorage,
    APP_CONFIG: { WORDS_PER_BLOCK: 10 }, console: { log() {}, warn() {}, error() {} },
    document: { createElement: element, addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } },
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); }, toast() {},
    async fetch(url, opts) { calls.push({ url: String(url), opts }); if (options.fetch) return options.fetch(url, opts); throw new Error("NETWORK_BLOCKED: " + url); }
  };
  w.Math.random = () => { random = (random * 16807) % 2147483647; return random / 2147483647; };
  w.window = w;
  vm.createContext(w);
  function load(file) { let source = fs.readFileSync(path.join(root, file), "utf8"); if (options.transform) source = options.transform(file, source); vm.runInContext(source, w, { filename: file, timeout: 3000 }); }
  ["js/util.js", "js/srs.js", "js/context.js", "js/db.js", "js/readalong.js"].forEach(load);
  return { w, values, storageLog, calls, timers, load };
}
function seed() {
  return { hubs: [{ id: "h" }, { id: "other" }], notebooks: [{ id: "n", hub_id: "h", name: "Source" }],
    sections: [{ id: "s", notebook_id: "n" }], pages: [{ id: "p", section_id: "s" }],
    batches: [{ id: "bt", page_id: "p" }], blocks: [{ id: "b", batch_id: "bt", context_passage: "Keep [cat]." }],
    words: [{ id: "w1", block_id: "b", term: "Cat" }, { id: "w2", block_id: "b", term: "cat!" }, { id: "w3", block_id: "b", term: " " }],
    word_progress: [{ user_id: "u1", word_id: "w1", mastered: true }, { user_id: "u2", word_id: "w2", mastered: true }],
    block_progress: [{ user_id: "u1", block_id: "b", passed: true, cycle: 1, next_review_at: NOW + 1000 }] };
}
async function casesRun(cases) {
  const results = [];
  for (const c of cases) {
    let timeout;
    try { await Promise.race([Promise.resolve().then(c.run), new Promise((_resolve, reject) => { timeout = setTimeout(() => reject(new Error("Test wall timeout 5000ms")), 5000); })]); results.push({ id: c.id, name: c.name, status: "PASS" }); }
    catch (e) { results.push({ id: c.id, name: c.name, status: "FAIL", error: String(e.message) }); }
    finally { clearTimeout(timeout); }
  }
  return { passed: results.filter(r => r.status === "PASS").length, failed: results.filter(r => r.status === "FAIL").length, results };
}
module.exports = { sandbox, seed, plain, assert, NOW, casesRun };
