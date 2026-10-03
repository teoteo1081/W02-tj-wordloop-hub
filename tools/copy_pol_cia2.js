/* Chép chunks.pol (3 mức lịch sự) từ Notebook 1 (cia_<code>_wNN) sang Notebook 2 (cia2_<code>_wNN).
   Cách chạy: mở web WordLoop (đã đăng nhập hay chưa đều được) -> F12 -> Console -> dán toàn bộ file này -> Enter.
   Lần 1 chạy THỬ (DRY = true): chỉ đếm, không ghi gì. Thấy số hợp lý thì đổi DRY = false rồi dán chạy lại.
   Chỉ ghi vào dòng cia2_* CHƯA có pol; giữ nguyên mọi phần khác của chunks (tiles/key/level/ctx). */
(async function () {
  var DRY = true;
  var cfg = window.APP_CONFIG, U = cfg.SUPABASE_URL + "/rest/v1/words", H = { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY };
  async function all(prefix) {
    var out = [], from = 0;
    for (;;) {
      var r = await fetch(U + "?select=id,chunks&id=like." + prefix + "*&order=id", { headers: Object.assign({ Range: from + "-" + (from + 999) }, H) });
      var rows = await r.json(); if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
      out = out.concat(rows); if (rows.length < 1000) return out; from += 1000;
    }
  }
  var src = await all("cia_"), dst = await all("cia2_"), byId = {};
  src.forEach(function (w) { byId[w.id] = w; });
  var todo = [];
  dst.forEach(function (w) {
    var s = byId["cia_" + w.id.slice(5)];
    var pol = s && s.chunks && s.chunks.pol;
    if (pol && !(w.chunks && w.chunks.pol)) todo.push({ id: w.id, chunks: Object.assign({}, w.chunks || {}, { pol: pol }) });
  });
  console.log("Notebook 1 có pol:", src.filter(function (w) { return w.chunks && w.chunks.pol; }).length, "/", src.length,
              "· Notebook 2:", dst.length, "dòng · cần chép:", todo.length);
  if (DRY) { console.log("Chạy thử xong (chưa ghi). Đổi DRY = false để ghi thật."); return; }
  var ok = 0;
  for (var i = 0; i < todo.length; i++) {
    var r = await fetch(U + "?id=eq." + encodeURIComponent(todo[i].id), { method: "PATCH", headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, H), body: JSON.stringify({ chunks: todo[i].chunks }) });
    if (r.ok) ok++; else console.warn(todo[i].id, r.status, await r.text());
    if (i % 100 === 0) console.log("đã ghi", ok, "/", todo.length);
  }
  console.log("✅ Xong: đã chép pol cho", ok, "/", todo.length, "dòng.");
})();
