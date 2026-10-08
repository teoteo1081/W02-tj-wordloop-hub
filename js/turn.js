/* turn.js — lấy TURN tạm thời (Cloudflare Realtime TURN) cho chia sẻ màn hình + voice, để mạng 5G / công ty nối được.
   Gọi Edge Function `turn-creds` (supabase/functions/turn-creds/index.ts) — khoá Cloudflare chỉ nằm trong Supabase secret, KHÔNG ở client / git.
   Chưa triển khai hàm đó (hoặc lỗi mạng) -> lặng lẽ bỏ qua, app vẫn chạy với STUN như cũ.
   Kết quả đặt ở window.__turnServers (mảng RTCIceServer); board.js và voice.js đọc khi tạo kết nối. Làm mới mỗi 20 phút (mật khẩu sống 1 giờ). */
(function () {
  "use strict";
  var cfg = window.APP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  function pull() {
    fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/turn-creds", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY, "apikey": cfg.SUPABASE_ANON_KEY }, body: "{}" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var s = d && d.iceServers; if (s && !Array.isArray(s)) s = [s];
        if (Array.isArray(s) && s.length) window.__turnServers = s.filter(function (x) { return x && x.urls && x.username && x.credential; });   /* bỏ mục STUN (không có tài khoản) vì đã có sẵn */
      }).catch(function () {});
  }
  pull(); setInterval(pull, 20 * 60 * 1000);
})();
