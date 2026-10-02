/* gamelayer.js — thẻ "🎮 Game" trên thanh trên cùng, ngay sau "📖 Learning" (TJ 2026-10-01).
   Bê NGUYÊN game.html vào 1 lớp phủ (iframe, cùng origin nên dùng chung localStorage -> nhận đúng hồ sơ TJ).
   Iframe chỉ tạo lần đầu bấm và GIỮ SỐNG khi quay lại học (ẩn chứ không xoá) -> phòng/ván đang chơi không bị ngắt.
   Chỉ hiện cho hồ sơ TJ (khớp HOST_PROFILE_ID trong js/game.js và menu "🎮 Mở phòng game" trong app.js). */
(function (w) {
  "use strict";
  var TJ_ID = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf";
  var btn = w.$("#btn-game"), layer = w.$("#game-layer"), learn = w.$("#btn-learning");
  var mbtn = w.$("#mnav-game");   /* điện thoại: thanh trên cùng tràn -> nút 🎮 ở thanh điều hướng dưới đáy */
  if (!btn || !layer) return;
  var learnWasHidden = true;

  function isTJ() { return !!(w.Auth && w.Auth.user && w.Auth.user.id === TJ_ID && !w.Auth.viewAsUserId && w.DB && w.DB.mode === "cloud"); }
  function syncBtn() { btn.hidden = !isTJ(); if (mbtn) mbtn.hidden = btn.hidden; if (btn.hidden && isOpen()) close(); }
  function isOpen() { return !layer.hidden; }

  function open() {
    if (!layer.firstChild) {
      var f = document.createElement("iframe");
      f.src = "game.html?embed=1&t=" + Date.now();   /* &t: luôn lấy game.html MỚI (Ctrl+F5 WordLoop không làm mới iframe -> từng kẹt bản cũ, TJ 2026-10-02) */
      f.title = "WordLoop Game";
      f.allow = "clipboard-write; autoplay";
      layer.appendChild(f);
    }
    if (w.Speech && w.Speech.stop) w.Speech.stop();
    learnWasHidden = learn.hidden;
    learn.hidden = false;          /* "📖 Learning" = về lại trang đang học */
    layer.hidden = false;
    btn.classList.add("active");
    if (mbtn) { w.$$(".mobile-nav button").forEach(function (x) { x.classList.toggle("active", x === mbtn); }); }
    document.body.classList.add("game-on");
  }
  function close() {
    layer.hidden = true;
    learn.hidden = learnWasHidden;
    btn.classList.remove("active");
    if (mbtn) mbtn.classList.remove("active");
    document.body.classList.remove("game-on");
  }
  btn.addEventListener("click", function () { isOpen() ? close() : open(); });

  /* Mở game với chủ đề chọn sẵn (nút 🎮 trên Block card / chuột phải "🎮 Mở phòng game"). Game chưa mở -> tạo iframe
     với ?scope=; đã mở -> gửi postMessage để game đổi chủ đề tại chỗ (không tải lại, giữ phòng/người chơi). */
  function openScope(table, id, title) {
    if (!layer.firstChild) {
      var f = document.createElement("iframe");
      f.src = "game.html?embed=1&t=" + Date.now() + "&scope=" + encodeURIComponent(table + ":" + id) + "&title=" + encodeURIComponent(title || "");
      f.title = "WordLoop Game";
      f.allow = "clipboard-write; autoplay";
      layer.appendChild(f);
    } else {
      try { layer.firstChild.contentWindow.postMessage({ type: "tjwl-game-scope", scope: [{ table: table, id: id, title: title || id }] }, location.origin); } catch (e) {}
    }
    if (!isOpen()) open();
  }

  /* "📖 Learning": đang mở game thì chỉ đóng game (màn bên dưới vẫn y như lúc rời đi) */
  learn.addEventListener("click", function (e) {
    if (!isOpen()) return;
    e.stopImmediatePropagation(); e.preventDefault();
    close();
  }, true);
  /* bấm bất cứ nút điều hướng nào khác trên thanh trên cùng (hub, Trang chủ, Journey, Ôn riêng…) -> rời game */
  w.$(".topbar").addEventListener("click", function (e) {
    if (!isOpen() || e.target.closest("#btn-game") || e.target.closest("#btn-learning")) return;
    if (e.target.closest(".hub-tab, #btn-home, #btn-journey, #btn-wordset, #btn-fixwrong, #brand")) close();
  }, true);
  /* app.js gán onclick cho MỌI nút .mobile-nav (mở drawer theo data-m) -> nút 🎮 chặn ở pha capture (chạy trước onclick) */
  if (mbtn) mbtn.addEventListener("click", function (e) {
    e.stopImmediatePropagation(); e.preventDefault();
    if (isOpen()) { close(); var main = w.$('.mobile-nav button[data-m="main"]'); if (main) main.classList.add("active"); } else open();
  }, true);
  w.$$(".mobile-nav button").forEach(function (b) { if (b !== mbtn) b.addEventListener("click", function () { if (isOpen()) close(); }, true); });

  if (w.Auth && w.Auth.onChange) w.Auth.onChange(syncBtn);
  var tries = 0, t = setInterval(function () { syncBtn(); if (++tries > 30 || !btn.hidden) clearInterval(t); }, 1000);   /* Auth.init chạy bất đồng bộ */
  syncBtn();
  w.GameLayer = { open: open, close: close, isOpen: isOpen, openScope: openScope };
})(window);
