#!/usr/bin/env node
/* Kiểm thử TRÌNH DUYỆT cho hub 🕵️ Marketing (js/exams.js + các móc trong js/game.js) — HOÀN TOÀN OFFLINE, AN TOÀN:
 *  - mọi request ra ngoài localhost bị chặn (kể cả *.supabase.co), WebSocket bị thay bằng đồ giả;
 *  - `window.supabase.createClient` được THAY bằng bản giả trong bộ nhớ (bảng/kênh/presence giả) -> lobby vẽ ra được mà
 *    KHÔNG có kết nối thật nào; phòng dùng mã ZZDM; nếu trang cố vào kênh "game:TJ" thì test báo ❌ (CLAUDE.md: QA từng vào nhầm phòng TJ).
 *  - hồ sơ host là hồ sơ giả (cùng UUID công khai trong game.js) chỉ tồn tại trong localStorage của trình duyệt thử.
 * Kiểm: (1) TOEIC hub vẫn y hệt bản main (so HTML) (2) bấm "🕵️ Marketing" -> form đúng, tùy chọn đã bỏ KHÔNG hiện, nội dung phòng chờ không lẫn
 *       (3) 375px không tràn (4) Bắt đầu -> ra được câu đầu có tình huống + 3/4 đáp án; Kahoot: trả lời -> hiện lời giải + nhãn 🟢🟡🔴
 *       (5) Xem lại đủ nhãn, không có 🔖/nghe lại (6) game_answers.term dùng tiền tố "dm:" (7) ⚡ Đua ra câu, không lộ đáp án.
 * Chạy:  node tools/test_exams_browser.js      (gate.sh browser gọi riêng gate_browser.js; file này chạy qua `gate.sh exams-browser` hoặc trực tiếp)
 * Cần Playwright (NODE_PATH ở môi trường cloud). Thoát mã 1 nếu có ❌; ⏭️ không phải đạt. */
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
let pw; try { pw = require("playwright"); } catch (e) { console.log("⏭️  không có Playwright — KHÔNG tính là đạt"); process.exit(0); }
const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".png": "image/png" };
function serve(dir) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(f).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok({ s, base: "http://127.0.0.1:" + s.address().port }));
  });
}
let fails = 0, skips = 0;
const out = (ok, msg) => { if (ok === "skip") skips++; else if (!ok) fails++; console.log((ok === true ? "✅ " : ok === "skip" ? "⏭️  " : ok === "warn" ? "⚠️  " : "❌ ") + msg); };
const HOST = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf";   /* id hồ sơ host — hằng số công khai trong js/game.js (HOST_PROFILE_ID) */
const ROOM = "ZZDM";

const { STUB } = require("./_exams_stub.js");

(async () => {
  const main = await serve(ROOT);
  let base = null, baseDir = null;   /* bản main gốc (để so TOEIC hub trước/sau) */
  try {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "tjwl_base_"));
    execFileSync("sh", ["-c", `git -C "${ROOT}" archive ${process.env.BASE_REF || "origin/main"} | tar -x -C "${baseDir}"`], { stdio: "pipe" });
    if (fs.existsSync(path.join(baseDir, "game.html"))) base = await serve(baseDir);
  } catch (e) { base = null; }
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }).catch(() => pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })).catch(() => pw.chromium.launch());
  const errs = [], dialogs = [];

  async function open(origin, vp, blockExams) {
    const ctx = await browser.newContext({ viewport: vp || { width: 1280, height: 900 } });
    await ctx.route((u) => !/^http:\/\/127\.0\.0\.1:/.test(u.toString()), (r) => r.request().url().includes("supabase-js") ? r.fulfill({ status: 200, contentType: "text/javascript", body: "/* thư viện thật bị thay bằng bản giả */" }) : r.abort());
    if (blockExams) await ctx.route(/\/js\/exams\.js/, (r) => r.abort());
    await ctx.addInitScript(STUB, { HOST, ROOM });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 160)));
    page.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });
    await page.goto(`${origin}/game.html?room=${ROOM}`, { waitUntil: "load" });
    await page.waitForFunction(() => { const h = document.querySelector("#l-host"); return h && !h.hidden && document.querySelector("#g-learn [data-learn]"); }, null, { timeout: 15000 });
    await page.waitForTimeout(500);
    return { ctx, page };
  }
  const toeicSnap = async (page) => {
    await page.click('#g-learn [data-learn="toeic"]'); await page.waitForSelector("#t-start", { timeout: 5000 }); await page.waitForTimeout(400);
    return page.evaluate(() => ({ html: document.querySelector("#l-hub-test").innerHTML, hidden: document.querySelector("#l-hub-test").hidden, tabs: [...document.querySelectorAll("#g-learn [data-learn]")].map((b) => b.dataset.learn + ":" + b.textContent.trim()) }));
  };

  try {
    /* ===== A. HỒI QUY TOEIC: hub TOEIC y hệt bản main ===== */
    const A = await open(main.base);
    const toeicNew = await toeicSnap(A.page);
    if (base) {
      const B = await open(base.base); const toeicOld = await toeicSnap(B.page); await B.ctx.close();
      out(toeicNew.html === toeicOld.html, `TOEIC hub: HTML y hệt bản main (${toeicOld.html.length} ký tự)` + (toeicNew.html === toeicOld.html ? "" : " — KHÁC!"));
      const nw = toeicNew.tabs.filter((t) => !/^dmhub:/.test(t));
      out(JSON.stringify(nw) === JSON.stringify(toeicOld.tabs) && toeicNew.tabs.length === toeicOld.tabs.length + 1, `thanh trên: các thẻ cũ y nguyên + 1 thẻ mới "🕵️ Thám tử Marketing": ${toeicNew.tabs.join(" | ")}`);
    } else out("skip", "không lấy được bản origin/main để so TOEIC hub trước/sau (cần `git fetch origin main`)");
    out(!toeicNew.hidden && (await A.page.evaluate(() => document.querySelector("#l-hub-dm").hidden)), "ở hub TOEIC: #l-hub-test hiện, #l-hub-dm ẩn");
    const tHas = await A.page.evaluate(() => ["t-book", "t-tnum", "t-scope", "t-test", "t-mode", "t-qs", "t-from", "t-to", "t-aud", "t-wrong", "t-bm", "t-stats", "t-tips", "t-marks"].filter((i) => !document.getElementById(i)));
    out(tHas.length === 0, "TOEIC hub vẫn đủ ô: Bộ đề/Đề/Phạm vi/Part/Kiểu chơi/Giây/Từ–Đến/Audio/❌/🔖/📊/🧠/🔖 đoạn nghe" + (tHas.length ? " — THIẾU " + tHas : ""));

    /* ===== B. FORM DM ===== */
    await A.page.click('#g-learn [data-learn="dmhub"]'); await A.page.waitForSelector("#dm-start", { timeout: 5000 });
    const f = await A.page.evaluate(() => {
      const dm = document.querySelector("#l-hub-dm"), opt = (id) => [...(document.getElementById(id) || { options: [] }).options].map((o) => o.value);
      const host = document.querySelector("#l-host"), shown = [...host.children].filter((c) => getComputedStyle(c).display !== "none").map((c) => c.id || c.className || c.tagName);
      return { dmHidden: dm.hidden, toeicHidden: document.querySelector("#l-hub-test").hidden, mode: opt("dm-mode"), play: opt("dm-play"), scoring: opt("dm-scoring"), teams: opt("dm-teams"), qs: document.getElementById("dm-qs").value,
        hostplay: !!document.getElementById("dm-hostplay"), banned: ["t-book", "t-tnum", "t-scope", "t-test", "t-mode", "t-from", "t-to", "t-aud", "t-wrong", "t-bm", "t-stats", "t-tips", "t-marks"].filter((i) => dm.querySelector("#" + i)).concat(dm.querySelectorAll(".t-pck").length ? ["checkbox P1–P7"] : []),
        text: dm.innerText, shown, active: document.querySelector("#g-learn .on").dataset.learn, lvl: dm.querySelectorAll(".g-lvl").length };
    });
    out(!f.dmHidden && f.toeicHidden && f.active === "dmhub", "bấm 🕵️ Marketing: hộp DM hiện, hộp TOEIC ẩn, nút DM sáng");
    out(JSON.stringify(f.mode) === JSON.stringify(["p1", "p2", "p3", "p4", "p5", "mix"]), "Chế độ: 5 part + 🎲 Trộn: " + f.mode.join(","));
    out(JSON.stringify(f.play) === JSON.stringify(["kahoot", "race"]), "Kiểu chơi chỉ Kahoot + ⚡ Đua (không Thi thật/Tự do/Theo audio): " + f.play.join(","));
    out(f.qs === "45", "Giây mỗi câu mặc định 45");
    out(f.scoring.length === 2 && f.teams.join() === "0,2,3,4" && f.hostplay, "Cách tính điểm · Hình thức thi đấu · Host cũng chơi đều có");
    out(f.banned.length === 0, "các tùy chọn đã bỏ KHÔNG hiện (Bộ đề/Đề/Phạm vi/Part/Từ–Đến/Audio/📊/🧠/🔖/❌)" + (f.banned.length ? " — còn: " + f.banned : ""));
    out(!/Part 5|Audio|TOEIC|Listening/i.test(f.text), "chữ trong form không còn nhắc TOEIC/Audio/Part 5");
    out(f.lvl === 3, "có chú giải 3 mức 🟢🟡🔴");
    out(f.shown.every((s) => ["l-hubs", "l-hub-dm"].includes(s) || /g-hubs/.test(s)), "nội dung phòng chờ từ vựng không hiện lẫn khi ở hub DM — thấy: " + f.shown.join(","));
    /* quay lại TOEIC rồi về DM: không vỡ */
    await A.page.click('#g-learn [data-learn="toeic"]'); await A.page.waitForTimeout(200); await A.page.click('#g-learn [data-learn="dmhub"]'); await A.page.waitForSelector("#dm-mode");
    out(await A.page.evaluate(() => document.querySelector("#l-hub-test").hidden && !document.querySelector("#l-hub-dm").hidden), "đổi qua lại TOEIC ↔ DM chạy tốt");

    /* ===== C. ĐIỆN THOẠI 375px ===== */
    const M = await open(main.base, { width: 375, height: 812 });
    await M.page.click('#g-learn [data-learn="dmhub"]'); await M.page.waitForSelector("#dm-start");
    const mo = await M.page.evaluate(() => ({ ov: document.documentElement.scrollWidth - window.innerWidth, btn: [...document.querySelectorAll("#g-learn button")].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top)]; }), vw: window.innerWidth,
      dmw: Math.max(...[...document.querySelectorAll("#l-hub-dm *")].map((e) => e.getBoundingClientRect().right)) }));
    out(mo.ov <= 1, `375px: không tràn ngang (${mo.ov}px)`);
    out(mo.btn.length >= 6, "375px: thẻ 🕵️ Thám tử Marketing có mặt trên thanh trên (thanh tự cuộn ngang bên trong, trang không tràn): " + mo.btn.length + " thẻ");
    out(mo.dmw <= mo.vw + 1, "375px: form DM không có phần tử thò ra ngoài màn hình");
    await M.ctx.close();

    /* ===== D. CHƠI KAHOOT (Phân loại): ra câu đầu, trả lời, lời giải + nhãn ===== */
    const items = JSON.parse(fs.readFileSync(path.join(ROOT, "data/exams/dm_items.json"), "utf8"));
    await A.page.fill("#dm-qs", "20"); await A.page.selectOption("#dm-mode", "p1"); await A.page.selectOption("#dm-play", "kahoot");
    await A.page.click("#dm-start");
    let played = true; try { await A.page.waitForFunction(() => !document.querySelector("#s-play").hidden && document.querySelector("#p-vi .g-tpass") && document.querySelectorAll("#p-opts .g-opt").length >= 3, null, { timeout: 15000 }); } catch (e) { played = false; }
    out(played, "Bắt đầu (Kahoot, Phân loại): dựng được câu đầu — có khung tình huống + đáp án" + (played ? "" : " — info: " + (await A.page.textContent("#dm-info")) + " | dialogs: " + dialogs.join("|")));
    if (played) {
      const q1 = await A.page.evaluate(() => ({ pass: document.querySelector("#p-vi .g-tpass").innerText.trim(), stem: document.querySelector("#p-vi .g-tstem").innerText, n: document.querySelectorAll("#p-opts .g-opt").length, opts: [...document.querySelectorAll("#p-opts .g-opt")].map((b) => b.dataset.opt), lvlEarly: !!document.querySelector("#p-res .g-lvl, #p-vi .g-lvl"), aud: !!document.querySelector(".g-taud") }));
      const it = items.find((x) => x.passage.trim() === q1.pass);
      out(!!it && it.part === 1, "câu đầu là 1 câu thật của Part 1 trong dm_items.json (" + (it ? it.id : "?") + ")");
      out(q1.n === 3 && it && JSON.stringify(q1.opts) === JSON.stringify(it.opts), "P1 hiện đúng 3 đáp án Chính/Xám/Tà đạo (nguyên văn)");
      out(!q1.lvlEarly && !q1.aud, "trước khi trả lời: chưa lộ nhãn mức, không có nút nghe audio");
      const right = it.opts["ABCD".indexOf(it.answer)], t0 = Date.now();
      await A.page.click(`#p-opts .g-opt[data-opt="${right.replace(/"/g, '\\"')}"]`);
      let rev = true; try { await A.page.waitForSelector("#p-res .g-lvl", { timeout: 20000 }); } catch (e) { rev = false; }
      out(rev, "Kahoot: sau khi trả lời hiện lời giải + nhãn mức (sau " + Math.round((Date.now() - t0) / 100) / 10 + "s)");
      if (rev) {
        const r = await A.page.evaluate(() => ({ lvl: document.querySelector("#p-res .g-lvl").textContent, ok: [...document.querySelectorAll("#p-opts .g-opt.ok")].map((b) => b.dataset.opt), bad: document.querySelectorAll("#p-opts .g-opt.bad").length, msg: document.querySelector("#p-msg").textContent, expl: document.querySelector("#p-res .g-texpl").innerText.length, trapNote: /Claude giải/.test(document.querySelector("#p-res").innerText), ref: !!document.querySelector("#p-res .g-lvlref") }));
        const want = { chinh: "Chính đạo", xam: "Xám đạo", ta: "Tà đạo" }[it.i18n.meta.level];
        out(r.lvl.indexOf(want) >= 0, `nhãn mức đúng với dữ liệu: "${r.lvl}" (cần "${want}")`);
        out(r.ok.length === 1 && r.ok[0] === right && r.bad === 0, "đáp án đúng được tô xanh, không có ô sai");
        out(r.expl > 200, "lời giải dài " + r.expl + " ký tự hiện ra");
        out(!r.trapNote, "không hiện dòng “đáp án do Claude giải” của TOEIC");
        out(/đúng|✓|\+/i.test(r.msg) || r.msg.length > 0, "thông báo: " + r.msg.slice(0, 60));
      }
      /* kết thúc ván -> Xem lại */
      await A.page.click("#p-stop"); await A.page.waitForFunction(() => !document.querySelector("#s-end").hidden, null, { timeout: 10000 }).catch(() => {});
      await A.page.waitForTimeout(500);
      const ans = await A.page.evaluate(() => window.__inserts.filter((x) => x.table === "game_answers").flatMap((x) => x.rows.map((r) => r.term)));
      out(ans.length > 0 && ans.every((t) => /^dm:dm1:1:\d+$/.test(t)), 'game_answers.term dùng tiền tố "dm:dm1:" (không đụng "toeic:"): ' + JSON.stringify(ans));
      if (await A.page.evaluate(() => !document.querySelector("#s-end").hidden && !document.querySelector("#e-review").hidden)) {
        await A.page.click("#e-review"); await A.page.waitForSelector("#rv-res .g-texpl", { timeout: 5000 }).catch(() => {});
        const v = await A.page.evaluate(() => ({ lvl: !!document.querySelector("#rv-res .g-lvl"), star: document.querySelector("#rv-star").hidden, say: document.querySelector("#rv-say").hidden, tv: !!document.querySelector("#rv-res .g-tvbox"), pass: !!document.querySelector("#rv-vi .g-tpass") }));
        out(v.lvl && v.pass, "📖 Xem lại: có tình huống + lời giải + nhãn mức");
        out(v.star && v.say && !v.tv, "📖 Xem lại: ẩn 🔖 để dành, nghe lại (giọng Anh) và hộp từ vựng TOEIC");
      } else out("skip", "chưa vào được màn kết quả/Xem lại trong môi trường giả — chưa kiểm Xem lại");
    }
    await A.ctx.close();

    /* ===== E. ĐUA TỐC ĐỘ + Trộn ===== */
    const E = await open(main.base);
    await E.page.click('#g-learn [data-learn="dmhub"]'); await E.page.waitForSelector("#dm-start");
    await E.page.selectOption("#dm-mode", "mix"); await E.page.selectOption("#dm-play", "race"); await E.page.fill("#dm-qs", "30");
    await E.page.click("#dm-start");
    let p2 = true; try { await E.page.waitForFunction(() => !document.querySelector("#s-play").hidden && document.querySelector("#p-vi .g-tpass") && document.querySelectorAll("#p-opts .g-opt").length >= 3, null, { timeout: 15000 }); } catch (e) { p2 = false; }
    out(p2, "⚡ Đua + 🎲 Trộn: dựng được câu đầu");
    if (p2) {
      const first = await E.page.evaluate(() => document.querySelector("#p-vi .g-tpass").innerText.trim());
      await E.page.click("#p-opts .g-opt"); await E.page.waitForTimeout(2200);
      const nx = await E.page.evaluate(() => ({ pass: (document.querySelector("#p-vi .g-tpass") || { innerText: "" }).innerText.trim(), lvl: !!document.querySelector("#p-res .g-lvl"), msg: document.querySelector("#p-msg").textContent }));
      out(nx.pass && nx.pass !== first, "⚡ Đua: chọn là chốt và tự sang câu kế (không dừng xem lời giải)");
      out(!nx.lvl, "⚡ Đua: không lộ nhãn/lời giải giữa ván (xem ở 📖 Xem lại)");
      const itemsAll = JSON.parse(fs.readFileSync(path.join(ROOT, "data/exams/dm_items.json"), "utf8"));
      out(!!itemsAll.find((x) => x.passage.trim() === nx.pass), "câu kế là câu thật trong dm_items.json");
    }
    await E.ctx.close();

    /* ===== G. exams.js LỖI TẢI: nút Marketing không được hiện/bấm; TOEIC + từ vựng vẫn chạy ===== */
    const nerr = errs.length, X = await open(main.base, null, true);
    const g0 = await X.page.evaluate(() => { const b = document.querySelector('#g-learn [data-learn="dmhub"]'); return { has: !!b, hidden: !b || b.hidden || getComputedStyle(b).display === "none", exams: typeof window.Exams }; });
    out(g0.exams === "undefined" && g0.hidden, "exams.js bị chặn: nút 🕵️ Marketing ẩn (không bấm được)");
    await X.page.evaluate(() => document.querySelector('#g-learn [data-learn="dmhub"]').click());   /* ép bấm bằng mã: không được rơi vào hub DM rỗng */
    await X.page.waitForTimeout(300);
    const g1 = await X.page.evaluate(() => ({ on: document.querySelector("#g-learn .on").dataset.learn, dmHidden: document.querySelector("#l-hub-dm").hidden, hostCls: document.querySelector("#l-host").classList.contains("g-hubtest") }));
    out(g1.on === "" && g1.dmHidden && !g1.hostCls, "exams.js bị chặn + ép bấm nút DM: về hub từ vựng, hộp DM ẩn (hub nhận: " + g1.on + ")");
    await X.page.click('#g-learn [data-learn="toeic"]'); await X.page.waitForSelector("#t-start", { timeout: 5000 });
    out(await X.page.evaluate(() => !document.querySelector("#l-hub-test").hidden && document.querySelector("#l-hub-dm").hidden), "exams.js bị chặn: hub TOEIC vẫn mở bình thường");
    await X.page.evaluate(() => document.querySelector('#g-learn [data-learn=""]').click());   /* thẻ 🎮 bị tiêu đề cột bên (side-pinned) của main đè trong stub -> bấm bằng mã */ await X.page.waitForTimeout(200);
    out(await X.page.evaluate(() => document.querySelector("#l-hub-test").hidden && !!document.querySelector("#l-levels")), "exams.js bị chặn: hub từ vựng vẫn mở bình thường");
    out(errs.length === nerr, "exams.js bị chặn: không phát sinh lỗi JS chưa bắt" + (errs.length > nerr ? " — " + errs.slice(nerr, nerr + 2).join(" | ") : ""));
    await X.ctx.close();

    /* ===== F. AN TOÀN ===== */
    const probe = await open(main.base);
    const used = await probe.page.evaluate(() => ({ ch: window.__channels, rooms: window.__rooms })); await probe.ctx.close();
    out(!used.ch.concat(used.rooms.map((r) => "game:" + r)).some((x) => /^game:TJ$/i.test(x)) && used.ch.every((c) => c === "game:" + ROOM), "chỉ dùng phòng giả " + ROOM + " (không có kênh nào vào \"TJ\"): " + JSON.stringify(used.ch));
    out(errs.length === 0, "không lỗi JS chưa bắt" + (errs.length ? " — " + errs.slice(0, 3).join(" | ") : ""));
  } catch (e) { out(false, "test bị ngắt: " + String(e.stack || e.message).split("\n").slice(0, 3).join(" ⏎ ")); }
  await browser.close(); main.s.close(); if (base) base.s.close();
  if (baseDir) try { fs.rmSync(baseDir, { recursive: true, force: true }); } catch (e) {}
  console.log(`\nKẾT QUẢ trình duyệt exams: ${fails === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${fails} lỗi)`}${skips ? ` · ⏭️ ${skips} mục không kiểm được (KHÔNG tính là đạt)` : ""}`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log("❌ test_exams_browser lỗi:", e.message); process.exit(1); });
