"use strict";
/* M0.5a — thu lời gọi baseline của Context tới Edge Function AI (EXECUTED, không gọi mạng thật).
   Nạp js/context.js của BẢN BASELINE, thay fetch bằng stub ghi lại yêu cầu, gọi các hàm công khai, ĐỐI CHIẾU với kỳ vọng
   của từng kịch bản, rồi mới so/ghi fixture tests/fixtures/baseline-context-calls.json.

   Dùng:
     node tests/capture/capture_context_calls.js [thư_mục_baseline]            # mặc định: --check (so với fixture đã commit, KHÔNG ghi)
     node tests/capture/capture_context_calls.js [thư_mục_baseline] --write    # cập nhật fixture (cần PR riêng + TJ duyệt)
   Quy tắc:
   - Nguồn phải là đúng commit e324beb, sạch (baseline.js). Mã khác → từ chối, không ghi gì.
   - Một kịch bản lỗi/sai kỳ vọng → thoát mã 1 và KHÔNG ghi đè fixture.
   - Ghi bằng tệp tạm rồi đổi tên, chỉ sau khi mọi kịch bản đạt. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const baseline = require("./baseline");

const FIXTURE = path.join(__dirname, "..", "fixtures", "baseline-context-calls.json");
const CFG = { SUPABASE_URL: "https://example.invalid", SUPABASE_ANON_KEY: "ANON_PLACEHOLDER" };
const HEADERS = ["Authorization", "Content-Type", "apikey"];

/* Kỳ vọng bắt buộc cho từng kịch bản (hợp đồng của baseline). */
const SCENARIOS = [
  { id: "CTX-GEM-NOCTX", desc: "Context._callGemini, quotaCtx = null", urlEnd: "/functions/v1/gemini-proxy", model: "gemini-3.5-flash-lite", user_id: null, block_id: null, run: (C) => C._callGemini(CFG, "SYS", "USER", null) },
  { id: "CTX-GEM-CTX", desc: "Context._callGemini, quotaCtx = {userId, blockId}", urlEnd: "/functions/v1/gemini-proxy", model: "gemini-3.5-flash-lite", user_id: "U-PLACEHOLDER", block_id: "B-PLACEHOLDER", run: (C) => C._callGemini(CFG, "SYS", "USER", { userId: "U-PLACEHOLDER", blockId: "B-PLACEHOLDER" }) },
  { id: "CTX-OAI-NOCTX", desc: "Context._callOpenAI qua proxy, quotaCtx = null", urlEnd: "/functions/v1/openai-proxy", model: "gpt-4o-mini", user_id: null, block_id: null, run: (C) => C._callOpenAI(CFG, "SYS", "USER", null) },
  { id: "CTX-OAI-CTX", desc: "Context._callOpenAI qua proxy, quotaCtx = {userId, blockId}", urlEnd: "/functions/v1/openai-proxy", model: "gpt-4o-mini", user_id: "U-PLACEHOLDER", block_id: "B-PLACEHOLDER", run: (C) => C._callOpenAI(CFG, "SYS", "USER", { userId: "U-PLACEHOLDER", blockId: "B-PLACEHOLDER" }) },
  { id: "CTX-LOOKUP", desc: "Context.lookupWord (quotaCtx null -> không ăn quota)", urlEnd: "/functions/v1/gemini-proxy", model: "gemini-3.5-flash-lite", user_id: null, block_id: null, run: (C) => { C._lookupCache = {}; return C.lookupWord("cost", "The cost rose.", CFG); } },
  { id: "CTX-PROVIDER-ORDER", desc: "Context._callProvider: Gemini trước", urlEnd: "/functions/v1/gemini-proxy", model: "gemini-3.5-flash-lite", user_id: null, block_id: null, run: (C) => C._callProvider(CFG, "SYS", "USER", null) }
];
const BODY_KEYS = ["block_id", "model", "sys", "user", "user_id"];

function mask(c) {
  const b = c.body && typeof c.body === "object" ? c.body : {};
  const shape = {};
  Object.keys(b).sort().forEach((k) => {
    const v = b[k];
    shape[k] = v === null ? null : (typeof v === "string" && v.length > 40 ? "<string " + v.length + " ký tự>" : v);
  });
  return { url: c.url, method: c.method, headerNames: c.headerNames, hasSignal: c.hasSignal, bodyKeys: Object.keys(b).sort(), body: shape };
}

function sameJSON(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* Chạy toàn bộ kịch bản; trả về { out, errors }. Không ghi tệp. */
async function collect(root, pin, scenarios) {
  const ctxFile = path.join(root, "js", "context.js");
  if (!fs.existsSync(ctxFile)) throw new Error("Không thấy " + ctxFile);
  const calls = [];
  const saved = { window: global.window, fetch: global.fetch };
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
  delete require.cache[require.resolve(ctxFile)];
  require(ctxFile);
  const C = window.Context;
  const errors = [];
  const out = {
    baseline: pin ? { commit: pin.commit, tree: pin.tree, clean: true } : { commit: "(KHÔNG GHIM — chỉ self-test)", tree: null, clean: null },
    source_sha256: { "js/context.js": baseline.sha256File(ctxFile) },
    captured_with: "executed (fetch stub)",
    scenarios: []
  };
  try {
    if (!C) throw new Error("window.Context không có sau khi nạp context.js");
    for (const s of (scenarios || SCENARIOS)) {
      calls.length = 0;
      let error = null;
      try { await s.run(C); } catch (e) { error = String(e && e.message || e); }
      const got = calls.map(mask);
      const why = [];
      if (error) why.push("kịch bản ném lỗi: " + error);
      if (got.length !== 1) why.push("số yêu cầu = " + got.length + " (cần đúng 1)");
      else {
        const g = got[0];
        if (!g.url.endsWith(s.urlEnd)) why.push("URL = " + g.url + " (cần kết thúc " + s.urlEnd + ")");
        if (g.method !== "POST") why.push("method = " + g.method);
        if (!sameJSON(g.headerNames, HEADERS)) why.push("header = " + JSON.stringify(g.headerNames));
        if (!sameJSON(g.bodyKeys, BODY_KEYS)) why.push("khoá body = " + JSON.stringify(g.bodyKeys));
        if (g.body.model !== s.model) why.push("model = " + JSON.stringify(g.body.model));
        if (g.body.user_id !== s.user_id) why.push("user_id = " + JSON.stringify(g.body.user_id));
        if (g.body.block_id !== s.block_id) why.push("block_id = " + JSON.stringify(g.body.block_id));
        if (g.hasSignal !== true) why.push("thiếu signal timeout");
      }
      if (why.length) errors.push(s.id + ": " + why.join("; "));
      out.scenarios.push({ id: s.id, desc: s.desc, calls: got });
    }
  } finally {
    global.fetch = saved.fetch;
    if (saved.window === undefined) delete global.window;
  }
  return { out, errors };
}

/* mode: "check" | "write". unsafe=true chỉ cho self-test: bỏ ghim và CẤM ghi fixture. */
async function run(opts) {
  const root = path.resolve(opts.root || baseline.defaultRoot());
  const mode = opts.mode || "check";
  const fixture = opts.fixture || FIXTURE;
  let pin = null;
  if (opts.unsafe) {
    if (mode === "write") throw new Error("Chế độ unsafe không được phép ghi fixture");
  } else {
    pin = baseline.assertPinned(root);
  }
  const { out, errors } = await collect(root, pin, opts.scenarios);
  if (errors.length) return { ok: false, errors, out };
  const text = JSON.stringify(out, null, 2) + "\n";
  if (mode === "write") {
    fs.mkdirSync(path.dirname(fixture), { recursive: true });
    const tmp = path.join(path.dirname(fixture), ".tmp-" + process.pid + "-" + path.basename(fixture));
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, fixture);
    return { ok: true, wrote: fixture, out };
  }
  if (!fs.existsSync(fixture)) return { ok: false, errors: ["Chưa có fixture: " + fixture + " (chạy với --write sau khi được duyệt)"], out };
  const have = fs.readFileSync(fixture, "utf8").replace(/\r\n/g, "\n");
  if (have !== text) return { ok: false, errors: ["Fixture đã commit khác kết quả thu lại từ baseline. Không tự ghi đè; nếu chủ ý thì chạy --write trong PR riêng và để TJ duyệt từng dòng khác."], out };
  return { ok: true, out };
}

module.exports = { run, collect, SCENARIOS };

if (require.main === module) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const rootArg = args.find((a) => !a.startsWith("--"));
  run({ root: rootArg, mode: write ? "write" : "check" }).then((r) => {
    if (!r.ok) {
      console.error("THẤT BẠI — không ghi gì:");
      r.errors.forEach((e) => console.error(" - " + e));
      process.exit(1);
    }
    r.out.scenarios.forEach((s) => console.log(" OK " + s.id + ": " + s.calls[0].url.replace(CFG.SUPABASE_URL, "")));
    console.log(r.wrote ? "Đã ghi " + r.wrote : "Fixture khớp kết quả thu lại từ baseline " + baseline.PIN.short + ".");
  }).catch((e) => { console.error("THẤT BẠI — không ghi gì: " + (e && e.message || e)); process.exit(1); });
}
