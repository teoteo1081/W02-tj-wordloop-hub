#!/usr/bin/env node
/* HỒI QUY TOEIC THẬT (offline, an toàn): chơi 1 ván TOEIC nhiều Part (P6 + P7) kiểu Kahoot trên supabase GIẢ (tools/_exams_stub.js,
 * có vài dòng test_items), phòng giả ZZDM, WebSocket/Internet bị chặn. Kiểm: (a) game_answers.term bắt đầu "toeic:" (b) nhịp giây từng Part
 * vẫn theo T_SEC (P6=30, P7=60, KHÔNG phải ô "Giây mỗi câu") (c) 📖 Xem lại câu TOEIC vẫn có 🔖 / nghe lại / hộp từ vựng (d) không có nhãn
 * 🟢🟡🔴 ở hub TOEIC, lúc chơi, hay Xem lại. Sinh ra để bắt đột biến "tPre() mặc định dm", "đảo !xmOf() ở nhịp nhiều Part".
 * Chạy: node tools/test_toeic_play_browser.js [thư mục gốc web, mặc định repo]   — thoát 1 nếu có ❌. */
const http = require("http"), fs = require("fs"), path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { console.log("⏭️  không có Playwright — KHÔNG tính là đạt"); process.exit(0); }
const { STUB, HOST } = require("./_exams_stub.js");
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const ROOM = "ZZDM";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
let fails = 0;
const out = (ok, msg) => { if (!ok) fails++; console.log((ok ? "✅ " : "❌ ") + msg); };
const row = (part, num, passage) => ({ id: "t1_p" + part + "_" + num, exam: "toeic", test: "1", part, num, stem: "Choose the best answer " + num, stem_vi: "", opts: ["(A) alpha", "(B) beta", "(C) gamma", "(D) delta"], answer: "A", tag: "tag" + part, explain: "Vì alpha đúng.", passage, answer_src: "key", vocab: [{ t: "alpha", pos: "n", vi: "an pha", en: "first" }], i18n: null });
const ITEMS = [row(6, 131, "Memo text for part six."), row(6, 132, "Memo text two."), row(7, 153, "Article for part seven."), row(7, 154, "Article two.")];

(async () => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + srv.address().port;
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }).catch(() => pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })).catch(() => pw.chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route((u) => !/^http:\/\/127\.0\.0\.1:/.test(u.toString()), (r) => r.request().url().includes("supabase-js") ? r.fulfill({ status: 200, contentType: "text/javascript", body: "/* bản giả */" }) : r.abort());
  await ctx.addInitScript(STUB, { HOST, ROOM, items: ITEMS });
  const page = await ctx.newPage(), errs = []; page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 160))); page.on("dialog", (d) => d.accept());
  try {
    await page.goto(`${base}/game.html?room=${ROOM}`, { waitUntil: "load" });
    await page.waitForFunction(() => { const h = document.querySelector("#l-host"); return h && !h.hidden && document.querySelector("#l-hubs [data-hub]"); }, null, { timeout: 15000 });
    await page.click('#l-hubs [data-hub="test"]'); await page.waitForSelector("#t-start");
    await page.waitForFunction(() => document.querySelectorAll("#t-tnum option").length > 0, null, { timeout: 8000 });
    out(await page.evaluate(() => !document.querySelector("#l-hub-test .g-lvl") && !document.querySelector("#l-hub-test .g-lvlguide")), "(d) hub TOEIC: không có nhãn/chú giải mức 🟢🟡🔴");
    /* nhiều Part: Tuỳ chọn P6 + P7, Kahoot, giây mỗi câu ô "Giây mỗi câu" = 20 (khác T_SEC để phân biệt) */
    await page.selectOption("#t-scope", "custom");
    await page.evaluate(() => { document.querySelectorAll(".t-pck").forEach((c) => { c.checked = c.value === "6" || c.value === "7"; c.dispatchEvent(new Event("change", { bubbles: true })); }); });
    await page.selectOption("#t-mode", "kahoot"); await page.evaluate(() => { document.querySelector("#t-qs").disabled = false; document.querySelector("#t-qs").value = "20"; });
    await page.click("#t-start");
    await page.waitForFunction(() => !document.querySelector("#s-play").hidden && document.querySelectorAll("#p-opts .g-opt").length === 4, null, { timeout: 15000 });
    const seen = {};
    for (let i = 0; i < 4; i++) {
      await page.waitForFunction((n) => window.__states.some((s) => s.qn === n), i + 1, { timeout: 15000 });
      await page.waitForFunction((n) => { const s = window.__states.filter((x) => x.qn === n).pop(); return s && document.querySelectorAll("#p-opts .g-opt").length === 4 && !document.querySelector("#p-opts .g-opt:disabled"); }, i + 1, { timeout: 15000 }).catch(() => {});
      const st = await page.evaluate((n) => window.__states.filter((x) => x.qn === n).pop(), i + 1); seen[i + 1] = st;
      await page.click('#p-opts .g-opt[data-opt="(A) alpha"]');
      await page.waitForTimeout(i < 3 ? 3500 : 500);
    }
    const lim = [1, 2, 3, 4].map((n) => seen[n] && seen[n].limit + "s/P" + seen[n].part);
    out(JSON.stringify(lim) === JSON.stringify(["30s/P6", "30s/P6", "60s/P7", "60s/P7"]), "(b) ván TOEIC nhiều Part: giới hạn giây từng câu theo T_SEC (P6=30, P7=60): " + lim.join(", "));
    const lvlPlay = await page.evaluate(() => !!document.querySelector("#s-play .g-lvl"));
    await page.click("#p-stop"); await page.waitForFunction(() => !document.querySelector("#s-end").hidden, null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    const terms = await page.evaluate(() => window.__inserts.filter((x) => x.table === "game_answers").flatMap((x) => x.rows.map((r) => r.term)));
    out(terms.length >= 3 && terms.every((t) => /^toeic:1:[67]:\d+$/.test(t)), '(a) game_answers.term bắt đầu "toeic:1:<part>:<câu>": ' + JSON.stringify(terms));
    out(!lvlPlay, "(d) lúc chơi TOEIC: không có nhãn mức");
    await page.click("#e-review"); await page.waitForSelector("#rv-res .g-texpl", { timeout: 5000 });
    const v = await page.evaluate(() => ({ star: !document.querySelector("#rv-star").hidden && /🔖/.test(document.querySelector("#rv-star").textContent), say: !document.querySelector("#rv-say").hidden, tv: !!document.querySelector("#rv-res .g-tvbox"), lvl: !!document.querySelector("#rv-res .g-lvl, #rv-res .g-lvlref"), claude: /Claude/.test(document.querySelector("#rv-res").innerText) }));
    out(v.star, "(c) 📖 Xem lại câu TOEIC: có nút 🔖 để dành");
    out(v.say, "(c) 📖 Xem lại câu TOEIC: có nút nghe lại");
    out(v.tv, "(c) 📖 Xem lại câu TOEIC: có hộp “Từ vựng cần học”");
    out(!v.lvl, "(d) 📖 Xem lại câu TOEIC: không có nhãn mức / căn cứ");
    out(errs.length === 0, "không lỗi JS chưa bắt" + (errs.length ? " — " + errs.slice(0, 2).join(" | ") : ""));
  } catch (e) { out(false, "test bị ngắt: " + String(e.message).split("\n")[0]); }
  await browser.close(); srv.close();
  console.log(`\nKẾT QUẢ hồi quy TOEIC (chơi thật offline): ${fails === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${fails} lỗi)`}`);
  process.exit(fails ? 1 : 0);
})();
