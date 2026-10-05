// Nhập bẫy đã duyệt vào bảng word_traps (chạy SAU KHI đã chạy tools/word_traps.sql).
//   ROWS=tools/word_traps_pilot.json NODE_USE_ENV_PROXY=1 node tools/word_traps_import.js
// Dùng anon key trong js/config.js (bảng có policy shared_all như các bảng khác).
const fs = require("fs");
const cfg = {}; global.window = { APP_CONFIG: cfg }; eval(fs.readFileSync(__dirname + "/../js/config.js", "utf8")); Object.assign(cfg, global.window.APP_CONFIG || cfg);
const U = cfg.SUPABASE_URL, K = cfg.SUPABASE_ANON_KEY;
(async () => {
  const rows = JSON.parse(fs.readFileSync(process.env.ROWS || __dirname + "/word_traps_pilot.json", "utf8")).rows;
  for (let i = 0; i < rows.length; i += 100) {
    const r = await fetch(U + "/rest/v1/word_traps?on_conflict=word_term,trap_term", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows.slice(i, i + 100)) });
    if (!r.ok) { console.log("LỖI", r.status, await r.text()); process.exit(1); }
  }
  console.log("đã nhập", rows.length, "dòng");
})();
