"use strict";
/* Self-test cho capture_context_calls.js và verify_backend_fixture.js: chứng minh chúng THẤT BẠI khi hợp đồng bị đổi.
   Làm hỏng có chủ đích bản sao trong thư mục tạm (chế độ unsafe), KHÔNG đụng baseline thật, KHÔNG ghi fixture.
   Mỗi phép làm hỏng được NEO THEO DÒNG (đúng vị trí cần đổi) và phải áp dụng đúng một chỗ — tránh phản chứng rỗng hoặc đổi nhầm chỗ khác.
   Dùng:  node tests/capture/selftest_capture_verify.js [thư_mục_baseline]   → mã 0 nếu mọi phản chứng đều bị bắt. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const baseline = require("./baseline");
const { verify } = require("./verify_backend_fixture");
const capture = require("./capture_context_calls");

const root = path.resolve(process.argv[2] || baseline.defaultRoot());
baseline.assertPinned(root);                                   // self-test cũng chỉ lấy nguồn từ đúng baseline
const FILES = ["js/cc.js", "js/game.js", "js/app.js", "js/turn.js", "js/context.js"];
const FIXTURE = path.join(__dirname, "..", "fixtures", "baseline-backend-calls.static.json");

const made = [];
function mk(prefix) { const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix)); made.push(d); return d; }
function cleanup() { made.forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) {} }); }
let pass = 0, fail = 0;
function ok(name, cond, extra) { (cond ? pass++ : fail++); console.log((cond ? "  ĐẠT  " : "  HỎNG ") + name + (cond || !extra ? "" : "  → " + extra)); }

function copyTree() {
  const dir = mk("tjwl-selftest-");
  FILES.forEach((f) => {                                         // chuẩn hoá CRLF→LF trong BẢN SAO để chuỗi nhiều dòng khớp
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n"));
  });
  return dir;
}
/* Thay `from` → `to` tại lần xuất hiện bắt đầu trong ±2 dòng quanh `near` (số dòng 1-based). Ném lỗi nếu không có đúng một chỗ như vậy. */
function mutateAt(dir, file, near, from, to) {
  const p = path.join(dir, file);
  const src = fs.readFileSync(p, "utf8");
  const hits = [];
  for (let i = src.indexOf(from); i >= 0; i = src.indexOf(from, i + 1)) {
    const line = src.slice(0, i).split("\n").length;
    if (Math.abs(line - near) <= 2) hits.push(i);
  }
  if (hits.length !== 1) throw new Error("phản chứng không áp dụng được (" + hits.length + " chỗ khớp gần dòng " + near + ") trong " + file + ": `" + from.slice(0, 60) + "`");
  fs.writeFileSync(p, src.slice(0, hits[0]) + to + src.slice(hits[0] + from.length));
}
function failsFor(res, id) { const r = res.results.find((x) => x.id === id); return !!(r && r.problems.length); }

(async () => {
  console.log("Nền: bản sao không sửa phải đạt (unsafe)");
  { const d = copyTree(); const r = verify({ root: d, unsafe: true }); ok("bản sao nguyên vẹn → mọi hợp đồng khớp", r.ok, JSON.stringify(r.results.filter((x) => x.problems.length))); }

  console.log("Verifier phải bắt thay đổi hợp đồng:");
  const APIKEY_GAP = 'Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY, apikey: cfg.SUPABASE_ANON_KEY }';
  const cases = [
    // [file, dòng, from, to, id, nhãn]
    ["game.js", 1313, 'block_id: "game-gap"', 'block_id: "WRONG-BLOCK"', "GAME-GAP-OPENAI", "đổi block_id game-gap → WRONG-BLOCK"],
    ["game.js", 1313, "user_id: G.profile ? G.profile.id : null", "user_id: null", "GAME-GAP-OPENAI", "đổi user_id"],
    ["cc.js", 92, "user_id: null, block_id: null }", 'user_id: "x", block_id: null }', "CC-TRANSLATE", "đổi user_id trong cc.js"],
    ["game.js", 1313, "temperature: temperature, ", "", "GAME-GAP-OPENAI", "bỏ khoá body `temperature`"],
    ["game.js", 1313, 'block_id: "game-gap" })', 'block_id: "game-gap", extra: 1 })', "GAME-GAP-OPENAI", "thêm khoá body lạ"],
    ["game.js", 1311, APIKEY_GAP, 'Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY }', "GAME-GAP-OPENAI", "bỏ header apikey"],
    ["game.js", 2520, " signal: ctl.signal,", "", "GAME-GRADE-SENTENCE", "bỏ signal (dòng 2520)"],
    ["game.js", 2518, "}, 25000);", "}, 1000);", "GAME-GRADE-SENTENCE", "đổi hẹn giờ huỷ 25000→1000"],
    ["game.js", 2287, '{ method: "PUT", headers: { "content-type"', '{ method: "POST", headers: { "content-type"', "SHELF-UPLOAD", "đổi method PUT→POST"],
    ["game.js", 2291, '{ method: "DELETE" }', '{ method: "DELETE", headers: { Authorization: "x" } }', "SHELF-DELETE", "thêm header xác thực vào DELETE"],
    ["game.js", 2302, "JSON.stringify({ path: path })", "JSON.stringify({ path: path, owner: 1 })", "SHELF-MKDIR", "thêm khoá body mkdir"],
    ["app.js", 2343, "body: JSON.stringify({ url: url })", "body: JSON.stringify({ url: url, extra: 1 })", "APP-FETCH-ARTICLE", "thêm khoá body fetch-article"],
    ["turn.js", 10, 'body: "{}"', 'body: "{\\"a\\":1}"', "TURN-CREDS", "đổi body turn-creds"]
  ];
  for (const [file, near, from, to, id, label] of cases) {
    const d = copyTree();
    try { mutateAt(d, "js/" + file, near, from, to); } catch (e) { ok("phản chứng áp dụng được: " + label, false, e.message); continue; }
    const r = verify({ root: d, unsafe: true });
    ok("bắt được: " + label + " (" + id + ")", failsFor(r, id), "verifier không báo lỗi " + id);
    const others = r.results.filter((x) => x.id !== id && x.problems.length).map((x) => x.id);
    ok("   và không báo nhầm mục khác", others.length === 0, "báo thêm: " + others.join(", "));
  }

  console.log("Verifier phải bắt fixture sai:");
  const fx = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const fxCases = [
    ["blockIdExpr sai", (f) => { f.calls.find((c) => c.id === "GAME-GAP-OPENAI").blockIdExpr = '"WRONG"'; }, "GAME-GAP-OPENAI"],
    ["userIdExpr sai", (f) => { f.calls.find((c) => c.id === "CC-TRANSLATE").userIdExpr = '"x"'; }, "CC-TRANSLATE"],
    ["bodyKeys thiếu khoá", (f) => { f.calls.find((c) => c.id === "CC-TRANSLATE").bodyKeys = ["model", "sys", "user"]; }, "CC-TRANSLATE"],
    ["headerNames thừa", (f) => { f.calls.find((c) => c.id === "SHELF-DELETE").headerNames = ["Authorization"]; }, "SHELF-DELETE"],
    ["timeoutMs sai", (f) => { f.calls.find((c) => c.id === "GAME-GRADE-SENTENCE").timeoutMs = 5000; }, "GAME-GRADE-SENTENCE"],
    ["signal sai", (f) => { f.calls.find((c) => c.id === "GAME-LOOKUP-TOEIC").signal = true; }, "GAME-LOOKUP-TOEIC"],
    ["method sai", (f) => { f.calls.find((c) => c.id === "SHELF-MOVE").method = "PUT"; }, "SHELF-MOVE"]
  ];
  for (const [label, edit, id] of fxCases) {
    const f2 = JSON.parse(JSON.stringify(fx)); edit(f2);
    const tmp = path.join(mk("tjwl-fx-"), "fx.json"); fs.writeFileSync(tmp, JSON.stringify(f2));
    const r = verify({ root: copyTree(), unsafe: true, fixture: tmp });
    ok("bắt được fixture sai: " + label, failsFor(r, id), "verifier không báo lỗi " + id);
  }
  { const f2 = JSON.parse(JSON.stringify(fx)); f2.baseline.commit = "0".repeat(40);
    const tmp = path.join(mk("tjwl-fx-"), "fx.json"); fs.writeFileSync(tmp, JSON.stringify(f2));
    const r = verify({ root: copyTree(), unsafe: true, fixture: tmp });
    ok("bắt được fixture ghim sai SHA", !r.ok && r.failures.length > 0); }

  console.log("Verifier phải bắt fixture mất hợp đồng (schema, ID bắt buộc, mức xác minh):");
  const schemaCases = [
    ["calls = [] (mất hết hợp đồng)", (f) => { f.calls = []; }],
    ["đổi mọi mục thành position-only", (f) => { f.calls.forEach((c) => { c.verification = "position-only"; }); }],
    ["hạ một hợp đồng (CC-TRANSLATE) xuống position-only", (f) => { f.calls.find((c) => c.id === "CC-TRANSLATE").verification = "position-only"; }],
    ["nâng SHELF-URL lên contract", (f) => { f.calls.find((c) => c.id === "SHELF-URL").verification = "contract"; }],
    ["thiếu một ID bắt buộc (SHELF-MKDIR)", (f) => { f.calls = f.calls.filter((c) => c.id !== "SHELF-MKDIR"); }],
    ["ID trùng", (f) => { f.calls.push(JSON.parse(JSON.stringify(f.calls[0]))); }],
    ["ID lạ ngoài danh sách bắt buộc", (f) => { const c = JSON.parse(JSON.stringify(f.calls[0])); c.id = "EXTRA-CALL"; f.calls.push(c); }],
    ["thiếu trường method", (f) => { delete f.calls.find((c) => c.id === "GAME-GAP-OPENAI").method; }],
    ["signal không phải boolean", (f) => { f.calls.find((c) => c.id === "GAME-GAP-OPENAI").signal = "no"; }],
    ["thiếu timeoutMs", (f) => { delete f.calls.find((c) => c.id === "TURN-CREDS").timeoutMs; }],
    ["đổi file của một ID", (f) => { f.calls.find((c) => c.id === "TURN-CREDS").file = "js/cc.js"; }],
    ["verification sai chính tả", (f) => { f.calls.find((c) => c.id === "TURN-CREDS").verification = "contrat"; }],
    ["khai cả bodyKeys và bodyExpr", (f) => { f.calls.find((c) => c.id === "TURN-CREDS").bodyKeys = []; }],
    ["thiếu mảng calls", (f) => { delete f.calls; }]
  ];
  for (const [label, edit] of schemaCases) {
    const f2 = JSON.parse(JSON.stringify(fx)); edit(f2);
    const tmp = path.join(mk("tjwl-fx-"), "fx.json"); fs.writeFileSync(tmp, JSON.stringify(f2));
    const r = verify({ root: copyTree(), unsafe: true, fixture: tmp });
    ok("bắt được: " + label, !r.ok && r.failures.some((x) => /^SCHEMA:/.test(x)), JSON.stringify({ ok: r.ok, failures: r.failures.slice(0, 2) }));
  }

  console.log("Băm baseline không phụ thuộc kiểu xuống dòng (CRLF/LF):");
  { const lf = copyTree(); const crlf = copyTree();
    const p = path.join(crlf, "js/context.js"); fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\n/g, "\r\n"));
    ok("sha256Lf: bản CRLF và bản LF cho cùng một băm", baseline.sha256Lf(path.join(lf, "js/context.js")) === baseline.sha256Lf(p));
    const a = (await capture.collect(lf, null)).out, b = (await capture.collect(crlf, null)).out;
    ok("capture: source_hashes giống hệt giữa CRLF và LF", JSON.stringify(a.source_hashes) === JSON.stringify(b.source_hashes));
    const golden = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", "baseline-context-calls.json"), "utf8"));
    ok("băm LF khớp fixture đã commit (CI Linux sẽ khớp)", a.source_hashes["js/context.js"].sha256_lf === golden.source_hashes["js/context.js"].sha256_lf);
    ok("git blob ghim trong fixture khớp kho git baseline", baseline.gitBlob(root, "js/context.js") === golden.source_hashes["js/context.js"].git_blob && !!golden.source_hashes["js/context.js"].git_blob);
    ok("so sánh toàn bộ kịch bản giữa CRLF và LF giống hệt", JSON.stringify(a.scenarios) === JSON.stringify(b.scenarios)); }

  console.log("Ghim baseline:");
  { let threw = false; try { verify({ root: copyTree() }); } catch (e) { threw = true; } ok("verifier từ chối nguồn không phải baseline git", threw); }
  { let threw = false; try { await capture.run({ root: copyTree(), mode: "check" }); } catch (e) { threw = true; } ok("capture từ chối nguồn không phải baseline git", threw); }
  { let threw = false; try { await capture.run({ root: copyTree(), mode: "write", unsafe: true }); } catch (e) { threw = true; } ok("capture cấm --write ở chế độ unsafe", threw); }

  console.log("Capture phải thất bại (không ghi) khi kịch bản sai:");
  { const d = copyTree(); mutateAt(d, "js/context.js", 260, "_callGemini: async function (cfg, sys, user, quotaCtx) {", "_callGemini: async function (cfg, sys, user, quotaCtx) { throw new Error('ép lỗi');");
    const r = await capture.run({ root: d, unsafe: true, mode: "check" });
    ok("ép _callGemini lỗi → capture báo thất bại", !r.ok && r.errors.some((e) => /CTX-GEM-NOCTX/.test(e)), JSON.stringify(r.errors)); }
  { const d = copyTree(); mutateAt(d, "js/context.js", 272, '"gemini-3.5-flash-lite";', '"gemini-OTHER";');
    const r = await capture.run({ root: d, unsafe: true, mode: "check" });
    ok("đổi model mặc định → capture báo thất bại", !r.ok && r.errors.some((e) => /model/.test(e)), JSON.stringify(r.errors)); }
  { const d = copyTree(); mutateAt(d, "js/context.js", 276, "user_id: (quotaCtx && quotaCtx.userId) || null,", "user_id: null,");
    const r = await capture.run({ root: d, unsafe: true, mode: "check" });
    ok("bỏ chuyển user_id (gemini) → capture báo thất bại", !r.ok && r.errors.some((e) => /CTX-GEM-CTX/.test(e) && /user_id/.test(e)), JSON.stringify(r.errors)); }
  { const d = copyTree(); mutateAt(d, "js/context.js", 346, "user_id: (quotaCtx && quotaCtx.userId) || null,", "user_id: null,");
    const r = await capture.run({ root: d, unsafe: true, mode: "check" });
    ok("bỏ chuyển user_id (openai) → capture báo thất bại", !r.ok && r.errors.some((e) => /CTX-OAI-CTX/.test(e)), JSON.stringify(r.errors)); }

  console.log("Capture không được ghi đè fixture khi kịch bản bắt buộc thất bại (nguồn thật, đã ghim):");
  { const tmpFx = path.join(mk("tjwl-fx-"), "golden.json");
    fs.writeFileSync(tmpFx, "GOLDEN-CŨ\n");
    const bad = capture.SCENARIOS.slice(0, 1).map((s) => Object.assign({}, s, { id: "FORCED-FAIL", urlEnd: "/functions/v1/KHONG-TON-TAI" }));
    const r = await capture.run({ root, mode: "write", fixture: tmpFx, scenarios: bad });
    ok("kịch bản sai kỳ vọng → ok=false", r.ok === false && r.errors.length > 0, JSON.stringify(r));
    ok("fixture cũ giữ nguyên, không bị ghi đè", fs.readFileSync(tmpFx, "utf8") === "GOLDEN-CŨ\n");
    ok("không để lại tệp tạm", fs.readdirSync(path.dirname(tmpFx)).every((f) => !f.startsWith(".tmp-")));
    const none = capture.SCENARIOS.slice(0, 1).map((s) => Object.assign({}, s, { id: "FORCED-NO-REQUEST", run: async () => {} }));
    const r2 = await capture.run({ root, mode: "write", fixture: tmpFx, scenarios: none });
    ok("kịch bản không gửi yêu cầu nào → ok=false và fixture giữ nguyên", r2.ok === false && fs.readFileSync(tmpFx, "utf8") === "GOLDEN-CŨ\n"); }

  console.log("\n" + pass + " đạt, " + fail + " hỏng.");
  cleanup();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("Self-test lỗi: " + (e && e.stack || e)); process.exit(1); });
