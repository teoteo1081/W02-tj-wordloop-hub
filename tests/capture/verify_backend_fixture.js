"use strict";
/* Đối chiếu hợp đồng lời gọi backend trong fixture với MÃ NGUỒN baseline (không gọi mạng).
   Với mục `verification: contract`, phân tích lời gọi fetch(...) tại vị trí đã ghi và kiểm:
     method · tên header · khoá body (hoặc biểu thức body) · biểu thức model/user_id/block_id · có `signal` · hẹn giờ huỷ (ms) · URL.
   Mục `verification: position-only` chỉ kiểm vị trí (anchor) và được in rõ là KHÔNG phải xác minh hợp đồng.

   Dùng:  node tests/capture/verify_backend_fixture.js [thư_mục_baseline]
   Nguồn phải là đúng commit e324beb, sạch (baseline.js). Thoát mã 1 nếu có mục lệch hoặc nguồn không đúng baseline. */
const fs = require("fs");
const path = require("path");
const baseline = require("./baseline");

const FIXTURE = path.join(__dirname, "..", "fixtures", "baseline-backend-calls.static.json");

/* ---------- bộ quét cú pháp tối thiểu (chuỗi, chú thích, regex, ngoặc cân bằng) ---------- */
const REGEX_PREV = "(,=:[!&|?{};+-*%<>~^";
function skipString(s, i) {            // s[i] là dấu nháy mở; trả về chỉ số SAU dấu nháy đóng
  const q = s[i];
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s[j] === q) return j + 1;
  }
  throw new Error("chuỗi không đóng");
}
function skipRegex(s, i) {             // s[i] === "/" mở regex
  let inClass = false;
  for (let j = i + 1; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") { j++; continue; }
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    else if (c === "/" && !inClass) { let k = j + 1; while (/[a-z]/i.test(s[k] || "")) k++; return k; }
  }
  throw new Error("regex không đóng");
}
function prevSignificant(s, i) { let j = i - 1; while (j >= 0 && /\s/.test(s[j])) j--; return j >= 0 ? s[j] : ""; }
/* Gọi cb(ch, i, depth) cho mỗi ký tự "mã" (ngoài chuỗi/chú thích/regex). cb trả true để dừng. depth đếm () [] {}. */
function walk(s, start, cb) {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(s, i) - 1; continue; }
    if (c === "/" && s[i + 1] === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
    if (c === "/" && s[i + 1] === "*") { const e = s.indexOf("*/", i + 2); if (e < 0) throw new Error("chú thích không đóng"); i = e + 1; continue; }
    if (c === "/") { const p = prevSignificant(s, i); if (p === "" || REGEX_PREV.indexOf(p) >= 0) { i = skipRegex(s, i) - 1; continue; } }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    if (cb(c, i, depth)) return i;
  }
  return -1;
}
/* s[open] là "(" "[" hoặc "{": trả về chỉ số ngoặc đóng tương ứng */
function matching(s, open) {
  let base = null;
  const end = walk(s, open, (c, i, d) => { if (base === null) { base = d; return false; } return d < base; });
  if (end < 0) throw new Error("ngoặc không cân bằng");
  return end;
}
function splitTop(s) {                 // tách theo dấu phẩy ở độ sâu 0 của chuỗi s (không gồm ngoặc bao ngoài)
  const parts = []; let last = 0;
  walk(s, 0, (c, i, d) => { if (c === "," && d === 0) { parts.push(s.slice(last, i)); last = i + 1; } return false; });
  parts.push(s.slice(last));
  return parts.map((p) => p.trim()).filter((p) => p.length);
}
const norm = (s) => String(s).replace(/\s+/g, " ").trim();
/* "{ a: 1, 'b-c': x }" -> { a: "1", "b-c": "x" } */
function parseObject(src) {
  src = src.trim();
  if (src[0] !== "{" || matching(src, 0) !== src.length - 1) throw new Error("không phải object literal: " + src.slice(0, 40));
  const out = {};
  splitTop(src.slice(1, -1)).forEach((seg) => {
    let colon = -1;
    walk(seg, 0, (c, i, d) => { if (c === ":" && d === 0) { colon = i; return true; } return false; });
    if (colon < 0) throw new Error("mục object không có ':' → " + seg.slice(0, 40));
    const key = seg.slice(0, colon).trim().replace(/^["']|["']$/g, "");
    out[key] = norm(seg.slice(colon + 1));
  });
  return out;
}

/* ---------- đối chiếu một mục hợp đồng ---------- */
function checkCall(c, lines) {
  const problems = [];
  const from = Math.max(0, c.line - 1 - 6), to = Math.min(lines.length, c.line - 1 + 7);
  const re = new RegExp(c.anchor);
  let anchorIdx = -1;
  for (let i = from; i < to; i++) if (re.test(lines[i])) { anchorIdx = i; break; }
  if (anchorIdx < 0) return { level: c.verification, problems: ["anchor không khớp quanh dòng " + c.line] };
  if (c.verification === "position-only") return { level: "position-only", problems: [] };

  const src = lines.join("\n");
  const lineStart = [0]; for (let i = 0; i < lines.length; i++) lineStart.push(lineStart[i] + lines[i].length + 1);
  const hay = src.slice(lineStart[anchorIdx], lineStart[Math.min(lines.length, anchorIdx + 4)]);
  const fpos = hay.search(/\bfetch\s*\(/);
  if (fpos < 0) return { level: "contract", problems: ["không thấy fetch( trong 4 dòng từ anchor"] };
  const open = lineStart[anchorIdx] + hay.indexOf("(", fpos);
  const close = matching(src, open);
  const args = splitTop(src.slice(open + 1, close));
  const url = norm(args[0] || "");
  const fetchLine = src.slice(0, open).split("\n").length - 1;

  if (c.urlContains && url.indexOf(norm(c.urlContains)) < 0) problems.push("URL = `" + url.slice(0, 80) + "` không chứa `" + c.urlContains + "`");
  if (c.urlDefinedByAnchor && !re.test(lines[anchorIdx])) problems.push("dòng định nghĩa URL không khớp");

  let opt = {};
  if (c.noOptions) {
    if (args.length > 1) problems.push("kỳ vọng fetch không có options, nhưng có tham số thứ hai");
  } else {
    if (args.length < 2) problems.push("thiếu options của fetch");
    else { try { opt = parseObject(args[1]); } catch (e) { problems.push("không phân tích được options: " + e.message); } }
  }
  const method = opt.method ? opt.method.replace(/^["']|["']$/g, "") : "GET";
  if (method !== c.method) problems.push("method = " + method + " (fixture: " + c.method + ")");

  let hdr = [];
  if (opt.headers) { try { hdr = Object.keys(parseObject(opt.headers)).map((k) => k.toLowerCase()).sort(); } catch (e) { problems.push("không phân tích được headers: " + e.message); } }
  const wantHdr = (c.headerNames || []).map((k) => k.toLowerCase()).sort();
  if (JSON.stringify(hdr) !== JSON.stringify(wantHdr)) problems.push("header = " + JSON.stringify(hdr) + " (fixture: " + JSON.stringify(wantHdr) + ")");

  if (c.bodyKeys) {
    const b = opt.body || "";
    const m = /^JSON\.stringify\s*\(/.exec(b);
    if (!m) problems.push("body không phải JSON.stringify(...): " + b.slice(0, 40));
    else {
      try {
        const inner = b.slice(m[0].length - 1);                       // bắt đầu tại "("
        const objSrc = splitTop(inner.slice(1, matching(inner, 0)))[0];
        const obj = parseObject(objSrc);
        const keys = Object.keys(obj).sort();
        if (JSON.stringify(keys) !== JSON.stringify(c.bodyKeys.slice().sort())) problems.push("khoá body = " + JSON.stringify(keys) + " (fixture: " + JSON.stringify(c.bodyKeys) + ")");
        [["model", c.modelExpr], ["user_id", c.userIdExpr], ["block_id", c.blockIdExpr]].forEach(([k, want]) => {
          if (want !== undefined && obj[k] !== norm(want)) problems.push(k + " = `" + obj[k] + "` (fixture: `" + norm(want) + "`)");
        });
      } catch (e) { problems.push("không phân tích được body: " + e.message); }
    }
  } else if (c.bodyExpr !== undefined) {
    if (opt.body !== norm(c.bodyExpr)) problems.push("body = `" + opt.body + "` (fixture: `" + norm(c.bodyExpr) + "`)");
  } else if (opt.body !== undefined) problems.push("fixture không khai body nhưng mã có body: " + opt.body.slice(0, 40));

  const hasSignal = Object.prototype.hasOwnProperty.call(opt, "signal");
  if (hasSignal !== !!c.signal) problems.push("signal: mã " + (hasSignal ? "có" : "không có") + ", fixture " + (c.signal ? "có" : "không có"));
  let timer = null;
  for (let i = Math.max(0, fetchLine - 8); i <= fetchLine; i++) {
    const t = /setTimeout\(\s*function\s*\(\)\s*\{[^}]*abort\(\)[^}]*\}\s*,\s*(\d+)\s*\)/.exec(lines[i]);
    if (t) timer = +t[1];
  }
  if ((c.timeoutMs === null ? null : c.timeoutMs) !== timer) problems.push("hẹn giờ huỷ = " + timer + " ms (fixture: " + c.timeoutMs + ")");
  return { level: "contract", problems };
}

/* Danh sách hợp đồng BẮT BUỘC có trong fixture, kèm mức xác minh và nguồn. Thiếu, thừa, trùng hoặc hạ mức đều là lỗi:
   chỉ SHELF-URL (hàm dựng URL, không có fetch) được là position-only. Thêm/bớt hợp đồng = sửa bảng này trong PR có TJ duyệt. */
const REQUIRED = {
  "CC-TRANSLATE": { verification: "contract", service: "gemini-proxy", file: "js/cc.js" },
  "GAME-GRADE-SENTENCE": { verification: "contract", service: "gemini-proxy", file: "js/game.js" },
  "GAME-LOOKUP-TOEIC": { verification: "contract", service: "gemini-proxy", file: "js/game.js" },
  "GAME-GAP-OPENAI": { verification: "contract", service: "openai-proxy", file: "js/game.js" },
  "APP-FETCH-ARTICLE": { verification: "contract", service: "fetch-article", file: "js/app.js" },
  "TURN-CREDS": { verification: "contract", service: "turn-creds", file: "js/turn.js" },
  "SHELF-LIST": { verification: "contract", service: "tj-shelf", file: "js/game.js" },
  "SHELF-UPLOAD": { verification: "contract", service: "tj-shelf", file: "js/game.js" },
  "SHELF-DELETE": { verification: "contract", service: "tj-shelf", file: "js/game.js" },
  "SHELF-MOVE": { verification: "contract", service: "tj-shelf", file: "js/game.js" },
  "SHELF-FOLDERS": { verification: "contract", service: "tj-shelf", file: "js/game.js" },
  "SHELF-MKDIR": { verification: "contract", service: "tj-shelf", file: "js/game.js" },
  "SHELF-URL": { verification: "position-only", service: "tj-shelf", file: "js/game.js" }
};

/* Kiểm cấu trúc fixture trước khi đối chiếu với mã. Trả về danh sách lỗi (rỗng = hợp lệ). */
function validateSchema(fx) {
  const errs = [];
  if (!fx || typeof fx !== "object") return ["fixture không phải object"];
  if (!Array.isArray(fx.calls)) return ["fixture thiếu mảng `calls`"];
  const seen = {};
  fx.calls.forEach((c, i) => {
    const where = "calls[" + i + "]" + (c && c.id ? " (" + c.id + ")" : "");
    if (!c || typeof c !== "object") { errs.push(where + ": không phải object"); return; }
    if (typeof c.id !== "string" || !c.id) { errs.push(where + ": thiếu id"); return; }
    if (seen[c.id]) errs.push("id trùng: " + c.id);
    seen[c.id] = true;
    const req = REQUIRED[c.id];
    if (!req) { errs.push("id không nằm trong danh sách bắt buộc: " + c.id + " (thêm vào REQUIRED trong PR có duyệt)"); return; }
    if (c.verification !== req.verification) errs.push(c.id + ": verification = " + JSON.stringify(c.verification) + " (bắt buộc: " + req.verification + ")");
    if (c.service !== req.service) errs.push(c.id + ": service = " + JSON.stringify(c.service) + " (bắt buộc: " + req.service + ")");
    if (c.file !== req.file) errs.push(c.id + ": file = " + JSON.stringify(c.file) + " (bắt buộc: " + req.file + ")");
    if (!Number.isInteger(c.line) || c.line < 1) errs.push(c.id + ": line không hợp lệ");
    if (typeof c.anchor !== "string" || !c.anchor) errs.push(c.id + ": thiếu anchor");
    if (c.verification === "contract") {
      if (typeof c.method !== "string") errs.push(c.id + ": thiếu method");
      if (!Array.isArray(c.headerNames)) errs.push(c.id + ": thiếu headerNames (mảng)");
      if (typeof c.signal !== "boolean") errs.push(c.id + ": thiếu signal (boolean)");
      if (!("timeoutMs" in c) || !(c.timeoutMs === null || Number.isInteger(c.timeoutMs))) errs.push(c.id + ": timeoutMs phải là null hoặc số nguyên");
      if (typeof c.urlContains !== "string" || !c.urlContains) errs.push(c.id + ": thiếu urlContains");
      if (c.bodyKeys !== undefined && c.bodyExpr !== undefined) errs.push(c.id + ": không được khai cả bodyKeys và bodyExpr");
      if (c.bodyKeys !== undefined && !Array.isArray(c.bodyKeys)) errs.push(c.id + ": bodyKeys phải là mảng");
    }
  });
  Object.keys(REQUIRED).forEach((id) => { if (!seen[id]) errs.push("thiếu hợp đồng bắt buộc: " + id); });
  const nContract = fx.calls.filter((c) => c && c.verification === "contract").length;
  const wantContract = Object.keys(REQUIRED).filter((id) => REQUIRED[id].verification === "contract").length;
  if (nContract !== wantContract) errs.push("số hợp đồng được kiểm = " + nContract + " (bắt buộc: " + wantContract + ")");
  return errs;
}

function verify(opts) {
  opts = opts || {};
  const root = path.resolve(opts.root || baseline.defaultRoot());
  const fixturePath = opts.fixture || FIXTURE;
  const fx = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const meta = { pinned: false };
  const failures = [];
  if (!opts.unsafe) { baseline.assertPinned(root); meta.pinned = true; }
  const schemaErrs = validateSchema(fx);
  if (schemaErrs.length) return { ok: false, results: [], failures: schemaErrs.map((e) => "SCHEMA: " + e), meta };
  if (!fx.baseline || fx.baseline.commit !== baseline.PIN.commit || fx.baseline.tree !== baseline.PIN.tree) failures.push("metadata baseline của fixture không khớp commit/tree đã ghim");
  const results = []; const cache = {};
  fx.calls.forEach((c) => {
    const f = path.join(root, c.file);
    if (!fs.existsSync(f)) { results.push({ id: c.id, level: c.verification, file: c.file, line: c.line, problems: ["thiếu file " + c.file] }); return; }
    const lines = cache[f] || (cache[f] = fs.readFileSync(f, "utf8").split(/\r?\n/));
    let r;
    try { r = checkCall(c, lines); } catch (e) { r = { level: c.verification, problems: ["lỗi phân tích: " + e.message] }; }
    results.push({ id: c.id, level: r.level, file: c.file, line: c.line, problems: r.problems });
  });
  const bad = results.filter((r) => r.problems.length);
  return { ok: !bad.length && !failures.length, results, failures, meta };
}

module.exports = { verify, checkCall, validateSchema, REQUIRED, parseObject, splitTop, matching };

if (require.main === module) {
  const rootArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  let r;
  try { r = verify({ root: rootArg }); } catch (e) { console.error("THẤT BẠI: " + (e && e.message || e)); process.exit(1); }
  r.results.forEach((x) => {
    const tag = x.level === "position-only" ? "VỊ TRÍ (không phải hợp đồng)" : "HỢP ĐỒNG";
    console.log((x.problems.length ? "LỆCH  " : "OK    ") + x.id + "  " + x.file + ":" + x.line + "  [" + tag + "]");
    x.problems.forEach((p) => console.log("        - " + p));
  });
  r.failures.forEach((f) => console.log("LỆCH  " + f));
  const nContract = r.results.filter((x) => x.level === "contract").length;
  console.log(r.ok ? "\nTất cả " + nContract + " hợp đồng khớp mã baseline; " + (r.results.length - nContract) + " mục chỉ xác nhận vị trí." : "\nCó mục lệch.");
  process.exit(r.ok ? 0 : 1);
}
