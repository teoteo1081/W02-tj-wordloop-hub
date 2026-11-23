// Dựng bài đọc chuẩn cho mỗi Block Word Family từ câu ví dụ PDF (thay khối ROOT thô của bản nháp).
// Mỗi họ = 1 đoạn; mỗi từ bọc [term] đúng 1 lần (lần xuất hiện đầu, nguyên văn); meta.vi = câu dịch.
// Chạy: node tools/wf_import/build_passages.js  (ghi đè context_passage trong wf_structured.json, khử trùng bẫy)
const fs = require("fs"), path = require("path");
global.window = global; window.esc = s => String(s);
require(path.join(__dirname, "../../js/context.js"));
const C = window.Context;
const F = path.join(__dirname, "../../data/word_family/wf_structured.json");
const d = JSON.parse(fs.readFileSync(F, "utf8"));

const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let noGap = [], bad = [];
for (const b of d.blocks) {
  const raw = String(b.context_passage || "");
  const paras = [], vi = {}, roots = [], notes = [], used = new Set();
  let cur = null;
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    let m;
    if ((m = L.match(/^【ROOT (.+)】/))) { cur = []; paras.push(cur); roots.push(m[1].split(" (")[0]); continue; }
    if ((m = L.match(/^• VI: (.+)/))) { notes.push(m[1]); continue; }
    if (/^• EN:/.test(L)) continue;
    if ((m = L.match(/^\s+\[(.+?)\] \([^)]*\): (.+)$/))) {
      const term = m[1], en = m[2].trim();
      const vm = (lines[i + 1] || "").match(/↳ (.+)/); const vtxt = vm ? vm[1].trim() : "";
      if (!/^\s{2}/.test(L) || !cur || !/^\s+\[/.test(L)) {}
      if (L.match(/^\s{2}\[/) && cur === null) { cur = []; paras.push(cur); }
      const key = term.toLowerCase();
      let s = en;
      const re = new RegExp("\\b" + rx(term) + "\\b", "i");
      if (!used.has(key) && re.test(en)) { s = en.replace(re, x => "[" + x + "]"); used.add(key); vi[key] = vtxt; }
      (cur || (cur = (paras.push([]), paras[paras.length - 1]))).push(s);
      continue;
    }
    if (L.trim() === "") { if (cur && !roots.length) cur = null; }
  }
  // từ lẻ (không ROOT) nằm sau dòng trống: đoạn riêng đã được gom vào cur hiện tại — tách lại theo dòng trống thì rối; chấp nhận gộp
  const terms = d.words.filter(w => w.block_id === b.id).map(w => w.term.toLowerCase());
  for (const t of new Set(terms)) if (!used.has(t)) noGap.push(b.global_index + ":" + t);
  const marked = paras.filter(p => p.length).map(p => p.join(" ")).join("\n\n");
  const meta = {
    title: "Họ từ: " + (roots.length ? roots.join(" · ") : terms.slice(0, 3).join(" · ")),
    source: "Word Family (PDF TJ gửi) — " + (notes.join(" | ") || "câu ví dụ từ sách"),
    vi, pasted: true
  };
  const full = marked + C.META_SEP + JSON.stringify(meta);
  const pm = C.parseMeta(full);
  const gaps = C.gapSentences(marked);
  if (pm.marked !== marked || gaps.length !== used.size || gaps.some(g => !C.translate(g.text, g.term, null, meta.vi)))
    bad.push(b.global_index);
  b.context_passage = full;
}
// khử trùng bẫy theo (word_term, trap_term) — bảng có unique, access n/v sinh 2 lần
const seen = new Set();
const before = d.traps.length;
d.traps = d.traps.filter(t => { const k = t.word_term + "\u0000" + t.trap_term.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
fs.writeFileSync(F, JSON.stringify(d, null, 1));
console.log("blocks", d.blocks.length, "| block lỗi verify:", bad.length, bad.slice(0, 20).join(","));
console.log("từ không bọc được (câu ví dụ không chứa nguyên văn):", noGap.length, noGap.slice(0, 15).join(", "));
console.log("bẫy", before, "->", d.traps.length);
