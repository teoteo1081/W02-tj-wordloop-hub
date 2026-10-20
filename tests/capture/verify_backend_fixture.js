"use strict";
/* Kiểm hợp đồng tĩnh còn khớp mã baseline: mỗi mục `calls[]` phải có `anchor` khớp trong `file`, trong cửa sổ ±6 dòng quanh `line`.
   Dùng:  node tests/capture/verify_backend_fixture.js [thư_mục_baseline]
   Thoát mã 1 nếu có mục lệch (hợp đồng đã cũ hoặc nhập sai dòng). Không gọi mạng. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || path.join(__dirname, "..", "..", "..", "wt-baseline-e324beb"));
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", "baseline-backend-calls.static.json"), "utf8"));
let bad = 0;
const cache = {};
fx.calls.forEach((c) => {
  const f = path.join(root, c.file);
  if (!fs.existsSync(f)) { console.log("THIẾU FILE  " + c.id + "  " + c.file); bad++; return; }
  const lines = cache[f] || (cache[f] = fs.readFileSync(f, "utf8").split(/\r?\n/));
  const re = new RegExp(c.anchor);
  const from = Math.max(0, c.line - 1 - 6), to = Math.min(lines.length, c.line - 1 + 7);
  const hit = lines.slice(from, to).some((l) => re.test(l)) || re.test(lines.slice(from, to).join("\n"));
  console.log((hit ? "OK     " : "LỆCH   ") + c.id + "  " + c.file + ":" + c.line);
  if (!hit) bad++;
});
console.log(bad ? "\n" + bad + " mục lệch." : "\nTất cả " + fx.calls.length + " mục khớp mã baseline.");
process.exit(bad ? 1 : 0);
