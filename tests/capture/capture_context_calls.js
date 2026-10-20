"use strict";
/* M0.5a — thu lời gọi baseline của Context tới Edge Function AI (EXECUTED, không gọi mạng thật).
   Nạp js/context.js của BẢN BASELINE (mặc định worktree e324beb) trong Node, thay fetch bằng stub ghi lại yêu cầu,
   gọi các hàm công khai rồi ghi hình dạng yêu cầu ra tests/fixtures/baseline-context-calls.json.
   Dùng:  node tests/capture/capture_context_calls.js [thư_mục_baseline]
   An toàn: URL/khoá giả (example.invalid / ANON_PLACEHOLDER), không đọc keys.local.js, không gọi dịch vụ thật. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || path.join(__dirname, "..", "..", "..", "wt-baseline-e324beb"));
const ctxFile = path.join(root, "js", "context.js");
if (!fs.existsSync(ctxFile)) { console.error("Không thấy " + ctxFile); process.exit(2); }

const CFG = { SUPABASE_URL: "https://example.invalid", SUPABASE_ANON_KEY: "ANON_PLACEHOLDER" };
const calls = [];
let reply = "gemini";

global.window = global;
global.window.esc = (s) => String(s == null ? "" : s);
global.fetch = async (url, opts) => {
  opts = opts || {};
  let body = null;
  try { body = opts.body ? JSON.parse(opts.body) : null; } catch (e) { body = "(không phải JSON)"; }
  calls.push({ url: String(url), method: opts.method || "GET", headerNames: Object.keys(opts.headers || {}).sort(), hasSignal: !!opts.signal, body });
  const ok = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) });
  if (/openai-proxy/.test(url)) return ok({ choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } });
  return ok({ candidates: [{ content: { parts: [{ text: '{"meaning_vi":"nghĩa","other_vi":[],"base":"x","pos":"Noun","ipa":"/x/","level":"A1","def_en":"d","explain_vi":"e"}' }] } }] });
};

require(ctxFile);
const C = window.Context;
if (!C) { console.error("window.Context không có sau khi nạp context.js"); process.exit(3); }

function mask(c) {
  /* chỉ giữ hình dạng: tên khoá + kiểu; chuỗi dài (prompt) thay bằng độ dài */
  const b = c.body && typeof c.body === "object" ? c.body : {};
  const shape = {};
  Object.keys(b).sort().forEach((k) => {
    const v = b[k];
    shape[k] = v === null ? null : (typeof v === "string" && v.length > 40 ? "<string " + v.length + " ký tự>" : v);
  });
  return { url: c.url, method: c.method, headerNames: c.headerNames, hasSignal: c.hasSignal, bodyKeys: Object.keys(b).sort(), body: shape };
}

(async () => {
  const out = { baseline_root: path.basename(root), captured_with: "executed (fetch stub)", scenarios: [] };
  async function scenario(id, desc, fn) {
    calls.length = 0;
    let error = null;
    try { await fn(); } catch (e) { error = String(e && e.message || e); }
    out.scenarios.push({ id, desc, error, calls: calls.map(mask) });
  }

  await scenario("CTX-GEM-NOCTX", "Context._callGemini, quotaCtx = null", () => C._callGemini(CFG, "SYS", "USER", null));
  await scenario("CTX-GEM-CTX", "Context._callGemini, quotaCtx = {userId, blockId}", () => C._callGemini(CFG, "SYS", "USER", { userId: "U-PLACEHOLDER", blockId: "B-PLACEHOLDER" }));
  await scenario("CTX-OAI-NOCTX", "Context._callOpenAI qua proxy, quotaCtx = null", () => C._callOpenAI(CFG, "SYS", "USER", null));
  await scenario("CTX-OAI-CTX", "Context._callOpenAI qua proxy, quotaCtx = {userId, blockId}", () => C._callOpenAI(CFG, "SYS", "USER", { userId: "U-PLACEHOLDER", blockId: "B-PLACEHOLDER" }));
  await scenario("CTX-LOOKUP", "Context.lookupWord (quotaCtx null -> không ăn quota)", () => { C._lookupCache = {}; return C.lookupWord("cost", "The cost rose.", CFG); });
  await scenario("CTX-PROVIDER-ORDER", "Context._callProvider: Gemini trước", () => C._callProvider(CFG, "SYS", "USER", null));

  const dir = path.join(__dirname, "..", "fixtures");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "baseline-context-calls.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log("Đã ghi " + file);
  out.scenarios.forEach((s) => console.log(" - " + s.id + ": " + s.calls.length + " lời gọi" + (s.error ? " (lỗi: " + s.error + ")" : "") + " -> " + s.calls.map((c) => c.url.replace(CFG.SUPABASE_URL, "")).join(", ")));
})();
