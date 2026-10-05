#!/usr/bin/env node
/* Kiểm thử THUẦN (không mạng, không trình duyệt) cho js/exams.js + data/exams/dm_items.json.
   Chạy:  node tools/test_exams.js        (gate.sh unit / all gọi file này; thoát mã 1 nếu có ❌) */
const fs = require("fs"), path = require("path"), assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const Exams = require(path.join(ROOT, "js/exams.js"));
const dm = Exams.dm;
let fails = 0, n = 0;
function t(name, fn) { n++; try { fn(); console.log("✅ " + name); } catch (e) { fails++; console.log("❌ " + name + " — " + e.message); } }

const items = JSON.parse(fs.readFileSync(path.join(ROOT, dm.file), "utf8"));

t("đăng ký môn dm đúng khuôn (id, prefix, file, modes, listening, load, select)", () => {
  assert.strictEqual(dm.id, "dm"); assert.strictEqual(dm.prefix, "dm");
  assert.ok(/^data\/exams\/.*\.json$/.test(dm.file));
  ["load", "select", "paintHub", "readForm", "introHTML", "levelBadge", "refsHTML", "validate", "parts"].forEach((f) => assert.strictEqual(typeof dm[f], "function", f));
  assert.strictEqual(dm.modes.length, 6);
  assert.deepStrictEqual(dm.modes.map((m) => m.k), ["p1", "p2", "p3", "p4", "p5", "mix"]);
});
t("listening(part) luôn false cho part 0–9 (không bật audio / khóa giờ Nghe)", () => { for (let p = 0; p <= 9; p++) assert.strictEqual(dm.listening(p), false); });
t("đủ 102 câu: P1 36 · P2 36 · P3 12 · P4 8 · P5 10", () => {
  assert.strictEqual(items.length, 102);
  const c = {}; items.forEach((x) => (c[x.part] = (c[x.part] || 0) + 1));
  assert.deepStrictEqual(c, { 1: 36, 2: 36, 3: 12, 4: 8, 5: 10 });
});
t("cấu trúc từng câu hợp lệ (validate() không báo lỗi)", () => { const e = dm.validate(items); assert.deepStrictEqual(e, []); });
t("id duy nhất; (part,num) duy nhất; num liền mạch 1..n trong từng part", () => {
  assert.strictEqual(new Set(items.map((x) => x.id)).size, 102);
  const by = {}; items.forEach((x) => { (by[x.part] = by[x.part] || []).push(+x.num); });
  Object.keys(by).forEach((p) => { const a = by[p].sort((x, y) => x - y); assert.deepStrictEqual(a, a.map((_, i) => i + 1), "part " + p); });
});
t("đáp án ∈ A..D, nằm trong số lựa chọn, tiền tố (A)–(D) khớp; P1 có 3 đáp án, P2–P5 có 4", () => {
  items.forEach((x) => {
    assert.ok(/^[A-D]$/.test(x.answer), x.id);
    assert.ok("ABCD".indexOf(x.answer) < x.opts.length, x.id);
    x.opts.forEach((o, i) => assert.ok(o.indexOf("(" + "ABCD"[i] + ") ") === 0, x.id + " opt " + i));
    assert.strictEqual(x.opts.length, x.part === 1 ? 3 : 4, x.id);
  });
});
t("mọi câu có level chinh|xam|ta (32 · 31 · 39) và lời giải vi + en", () => {
  const c = { chinh: 0, xam: 0, ta: 0 };
  items.forEach((x) => { const l = x.i18n.meta.level; assert.ok(l in c, x.id + " level " + l); c[l]++; assert.ok(x.i18n.vi.explain && x.i18n.en.explain, x.id); });
  assert.deepStrictEqual(c, { chinh: 32, xam: 31, ta: 39 });
});
t('mã đề DM = "dm1" (không trùng mã TOEIC); tKey kiểu game: "dm:dm1:<part>:<num>"', () => {
  assert.strictEqual(dm.test, "dm1"); items.forEach((x) => assert.strictEqual(x.test, "dm1", x.id));
  const key = (x) => dm.prefix + ":" + x.test + ":" + x.part + ":" + x.num;
  items.forEach((x) => assert.ok(key(x).indexOf("dm:dm1:") === 0));
  assert.strictEqual(new Set(items.map(key)).size, 102);
});
t("câu không thiếu: stem, passage, tag, explain đều khác rỗng", () => { items.forEach((x) => ["stem", "passage", "tag", "explain"].forEach((k) => assert.ok(String(x[k] || "").trim(), x.id + "." + k))); });

t("select(mode p1..p5) chỉ trả đúng part, theo thứ tự câu khi không có seed", () => {
  [1, 2, 3, 4, 5].forEach((p) => {
    const r = dm.select(items, { mode: "p" + p });
    assert.ok(r.length > 0 && r.every((x) => x.part === p), "p" + p);
    assert.deepStrictEqual(r.map((x) => x.num), r.map((_, i) => i + 1));
  });
});
t("select(mix) trả cả 102 câu, không trùng, không mất", () => {
  const r = dm.select(items, { mode: "mix", seed: 7 });
  assert.strictEqual(r.length, 102); assert.strictEqual(new Set(r.map((x) => x.id)).size, 102);
});
t("trộn: cùng seed -> cùng thứ tự (mọi máy giống nhau); khác seed -> khác; không đổi mảng gốc", () => {
  const before = items.map((x) => x.id).join();
  const a = dm.select(items, { mode: "mix", seed: 123 }).map((x) => x.id), b = dm.select(items, { mode: "mix", seed: 123 }).map((x) => x.id), c = dm.select(items, { mode: "mix", seed: 124 }).map((x) => x.id);
  assert.deepStrictEqual(a, b); assert.notDeepStrictEqual(a, c);
  assert.notDeepStrictEqual(a, dm.select(items, { mode: "mix" }).map((x) => x.id), "seed phải xáo thật");
  assert.strictEqual(items.map((x) => x.id).join(), before);
});
t("select: chế độ lạ / không có câu -> mảng rỗng, không ném lỗi", () => {
  assert.deepStrictEqual(dm.select(items, { mode: "zzz" }), []); assert.deepStrictEqual(dm.select([], { mode: "mix" }), []); assert.deepStrictEqual(dm.select(null, { mode: "p1" }), []);
});
t("validate() bắt được dữ liệu hỏng (đáp án sai, level sai, part sai)", () => {
  const bad = JSON.parse(JSON.stringify(items.slice(0, 3)));
  bad[0].answer = "D"; bad[1].i18n.meta.level = "xyz"; bad[2].part = 9;
  assert.ok(dm.validate(bad).length >= 3);
});
t("levelBadge: 3 mức đúng nhãn vi/en; mức lạ -> rỗng; escape HTML", () => {
  assert.ok(/🟢 Chính đạo/.test(dm.levelBadge({ level: "chinh" }, "vi")));
  assert.ok(/🟡 Xám đạo/.test(dm.levelBadge({ level: "xam" }, "vi")));
  assert.ok(/🔴 Tà đạo/.test(dm.levelBadge({ level: "ta" }, "vi")));
  assert.ok(/🔴 Deceptive/.test(dm.levelBadge({ level: "ta" }, "en")));
  assert.ok(/🔴 Deceptive/.test(dm.levelBadge({ level: "ta" }, "zh")), "ngôn ngữ khác rơi về en");
  assert.strictEqual(dm.levelBadge({ level: "?" }, "vi"), ""); assert.strictEqual(dm.levelBadge(null, "vi"), "");
  assert.ok(dm.refsHTML({ refs: ["<b>x</b>"] }, "vi").indexOf("<b>") < 0);
});
t("introHTML vi/en có 4 câu kiểm tra + 3 mức; ngôn ngữ lạ rơi về en", () => {
  ["vi", "en", "zh"].forEach((l) => { const h = dm.introHTML(l, ""); assert.strictEqual((h.match(/<li>/g) || []).length, 4, l); assert.ok(/g-lvl-chinh/.test(h) && /g-lvl-xam/.test(h) && /g-lvl-ta/.test(h)); });
  assert.ok(/Sự thật/.test(dm.introHTML("vi", ""))); assert.ok(/Truth/.test(dm.introHTML("zh", "")));
});
(async () => {
  let calls = 0; const prev = globalThis.fetch;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => items }; };
  const a = await dm.load(), b = await dm.load();
  try { assert.strictEqual(a.length, 102); assert.strictEqual(calls, 1); assert.strictEqual(a, b); console.log("✅ load(): 1 lần tải, cache đúng (102 câu)"); } catch (e) { fails++; console.log("❌ load cache — " + e.message); }
  dm._p = null; globalThis.fetch = async () => { throw new Error("offline"); };
  const w = console.warn; console.warn = () => {};
  try { const e1 = await dm.load(); assert.deepStrictEqual(e1, []); assert.strictEqual(dm._p, null, "lỗi không được cache"); console.log("✅ load(): lỗi mạng -> [] và không cache lỗi"); } catch (e) { fails++; console.log("❌ load lỗi — " + e.message); }
  console.warn = w; globalThis.fetch = prev;
  console.log(`\nKẾT QUẢ unit: ${fails === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${fails} lỗi)`} (${n} + 2 phép thử bất đồng bộ)`);
  process.exit(fails ? 1 : 0);
})();
