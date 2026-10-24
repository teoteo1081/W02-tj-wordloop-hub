#!/usr/bin/env node
/* Kiểm 1 lô từ vựng Barron 600 (xem AGENT_BRIEF.md). Chỉ ĐỌC file, không ghi, không gọi mạng.
   Dùng:  node tools/barron/check_batch.js <heads_final.json> <thư_mục_chứa vocab_LNN.json> [từ_Lesson] [đến_Lesson]
   Thoát mã 1 nếu có lỗi. */
const fs = require("fs"), path = require("path");
const [headsFile, dir, a0, b0] = process.argv.slice(2);
if (!headsFile || !dir) { console.error("Dùng: node check_batch.js <heads_final.json> <dir vocab_LNN.json> [từ] [đến]"); process.exit(2); }
const heads = JSON.parse(fs.readFileSync(headsFile, "utf8"));
const from = +a0 || 1, to = +b0 || heads.length;
const REQ = ["term", "pos", "ipa", "def_en", "level", "freq", "meaning_vi", "meaning_zh", "meaning_es"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
let errs = 0, warns = 0, words = 0;
const e = (n, m) => { errs++; console.log("LỖI  L" + n + ": " + m); };
const w = (n, m) => { warns++; console.log("CẢNH BÁO L" + n + ": " + m); };

for (let n = from; n <= to; n++) {
  const h = heads[n - 1], f = path.join(dir, "vocab_L" + String(n).padStart(2, "0") + ".json");
  if (!fs.existsSync(f)) { e(n, "thiếu file " + f); continue; }
  let v; try { v = JSON.parse(fs.readFileSync(f, "utf8")); } catch (x) { e(n, "JSON hỏng: " + x.message); continue; }
  const ws = v.words || [];
  if (ws.length !== h.words.length) e(n, "số từ " + ws.length + " ≠ " + h.words.length);
  const meanSeen = {};
  ws.forEach((x, i) => {
    words++;
    if (x.term !== h.words[i]) e(n, "term #" + (i + 1) + " '" + x.term + "' ≠ '" + h.words[i] + "'");
    REQ.forEach(k => { if (x[k] == null || String(x[k]).trim() === "") e(n, "'" + x.term + "' thiếu " + k); });
    if (x.level && !LEVELS.includes(x.level)) e(n, "'" + x.term + "' level lạ: " + x.level);
    if (x.freq && !["common", "uncommon"].includes(x.freq)) e(n, "'" + x.term + "' freq lạ: " + x.freq);
    if (x.ipa && !/^\/.+\/$/.test(x.ipa)) e(n, "'" + x.term + "' ipa không có dạng /…/: " + x.ipa);
    if (x.meaning_vi) { const k = x.meaning_vi.toLowerCase(); if (meanSeen[k]) w(n, "'" + x.term + "' và '" + meanSeen[k] + "' trùng nghĩa vi: " + x.meaning_vi); meanSeen[k] = x.term; }
    if (x.def_en && x.def_en.split(/\s+/).length > 20) w(n, "'" + x.term + "' def_en dài " + x.def_en.split(/\s+/).length + " từ");
    if (x.def_en && new RegExp("\\b" + x.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(x.def_en)) w(n, "'" + x.term + "' def_en chứa chính từ đó");
  });
}
console.log("\nĐã kiểm Lesson " + from + "–" + to + ": " + words + " từ, " + errs + " lỗi, " + warns + " cảnh báo.");
process.exit(errs ? 1 : 0);
