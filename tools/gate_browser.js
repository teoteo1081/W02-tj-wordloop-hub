#!/usr/bin/env node
/* Cổng 2 — mở web bằng trình duyệt tự động (Playwright), AN TOÀN BẰNG CÁCH THIẾT KẾ:
 *  - chặn MỌI request tới *.supabase.co và thay WebSocket bằng đồ giả => không thể vào phòng game thật "TJ",
 *    không ghi/đọc dữ liệu thật (CLAUDE.md: agent QA từng vào nhầm phòng TJ 2026-10-04).
 *  - chỉ chạy với web phục vụ từ máy mình (localhost), không bao giờ mở web live.
 * Kiểm: không lỗi JS chưa bắt (pageerror), trang không trắng, file JS/CSS local không 404,
 *       không tràn ngang ở điện thoại 375px (cảnh báo). Thoát mã 1 nếu có ❌.
 * Cần Playwright: có sẵn trong NODE_PATH ở môi trường cloud, hoặc `npm i --no-save playwright` ở thư mục tạm.
 */
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
let pw; try { pw = require("playwright"); } catch (e) { console.log("⏭️  không có Playwright — KHÔNG tính là đạt"); process.exit(0); }
const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
/* Thư viện supabase-js tải từ CDN (cùng phiên bản ghim trong html). Sandbox có thể chặn CDN -> lấy đúng bản từ npm, chạy THẬT. */
function supabaseLib(ver, name) {
  const dir = path.join(os.tmpdir(), "gate_supabase_" + ver), umd = path.join(dir, "package/dist/umd");
  if (!fs.existsSync(umd)) {
    fs.mkdirSync(dir, { recursive: true });
    const tgz = execFileSync("npm", ["pack", "@supabase/supabase-js@" + ver, "--silent"], { cwd: dir, encoding: "utf8" }).trim().split("\n").pop();
    execFileSync("tar", ["-xzf", tgz], { cwd: dir });
  }
  const cand = [name, name.replace(".min.js", ".js")].map((n) => path.join(umd, path.basename(n)));   /* npm gói không có bản .min */
  return fs.readFileSync(cand.find((f) => fs.existsSync(f)));
}
const IGNORE_404 = /\/js\/keys\.local\.js/; /* file khoá cá nhân, cố ý KHÔNG có trong git (.gitignore) */
let fails = 0;
const out = (ok, msg) => { if (!ok) fails++; console.log((ok === true ? "✅ " : ok === "warn" ? "⚠️  " : "❌ ") + msg); };

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }).catch(() => pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })).catch(() => pw.chromium.launch());
  for (const page_ of ["index.html", "game.html"]) {
    for (const vp of [{ w: 1280, h: 800, name: "máy tính" }, { w: 375, h: 812, name: "điện thoại" }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      await ctx.addInitScript(() => { window.__wsTried = 0; window.WebSocket = function () { window.__wsTried++; throw new Error("WebSocket bị chặn bởi gate"); }; });
      await ctx.route(/supabase\.co/, (r) => r.abort());
      await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[\d.]+\/dist\/umd\//, (r) => {
        try { const m = r.request().url().match(/supabase-js@([\d.]+)\/dist\/umd\/([^?]+)/); r.fulfill({ status: 200, contentType: "text/javascript", body: supabaseLib(m[1], m[2]) }); } catch (e) { r.abort(); }
      });
      const page = await ctx.newPage(), errs = [], bad404 = [], cons = [];
      page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 140)));
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to (load resource|fetch)|net::ERR|WebSocket/.test(m.text())) cons.push(m.text().slice(0, 120)); });
      page.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400 && !IGNORE_404.test(r.url())) bad404.push(r.url().replace(base, "")); });
      const tag = `${page_} · ${vp.name}`;
      try {
        await page.goto(`${base}/${page_}`, { waitUntil: "load", timeout: 20000 }); await page.waitForTimeout(2500);
        out(errs.length === 0, `${tag}: không lỗi JS chưa bắt` + (errs.length ? " — " + errs.slice(0, 2).join(" | ") : ""));
        out(bad404.length === 0, `${tag}: file JS/CSS local đều tải được` + (bad404.length ? " — 404: " + bad404.slice(0, 3).join(", ") : ""));
        const len = await page.evaluate(() => document.body.innerText.trim().length);
        out(len > 20, `${tag}: trang không trắng (${len} ký tự chữ)`);
        const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (vp.w < 500) out(ov <= 1 ? true : "warn", `${tag}: ${ov <= 1 ? "không tràn ngang" : "TRÀN NGANG " + ov + "px"}`);
        if (cons.length) out("warn", `${tag}: ${cons.length} console.error (đầu tiên: ${cons[0]})`);
        const ws = await page.evaluate(() => window.__wsTried); if (ws) out("warn", `${tag}: trang cố mở kết nối realtime ${ws} lần (đã chặn — an toàn)`);
      } catch (e) { out(false, `${tag}: không mở được (${String(e.message).slice(0, 80)})`); }
      await ctx.close();
    }
  }
  await browser.close(); server.close();
  console.log(`\nKẾT QUẢ cổng trình duyệt: ${fails === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${fails} lỗi)`}`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log("❌ gate_browser lỗi:", e.message); process.exit(1); });
