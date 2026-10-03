/* hubpage.js — Hub có "trang riêng" (TJ 2026-10-03): bấm tab Hub 🕵️ CIA_Top Secret -> mở NGUYÊN trang web 1000 câu
   (repo L00_ES-CN, GitHub Pages, cùng origin teoteo1081.github.io) trong 1 lớp phủ như thẻ 🎮 Game (js/gamelayer.js).
   Thanh trên lớp phủ: "📖 Trang gốc" | "📒 Học & chơi game" (đóng lớp phủ -> notebook CIA trong WordLoop: ôn theo Block,
   chọn chủ đề cho game) | "↗ Tab mới". Bấm lại tab Hub -> mở lại trang. Iframe tạo 1 lần, GIỮ SỐNG (đang nghe dở không mất). */
(function (w) {
  "use strict";
  var HUB_PAGES = {
    hub_cia: { url: "https://teoteo1081.github.io/L00_ES-CN/Operation_0-Chunks_1000_cau_EN_ES_CN_VN_v4.html", title: "🕵️ Operation 0→Chunks · 1000 câu" }
  };
  var tabs = w.$("#hub-tabs"); if (!tabs) return;
  var layer = document.createElement("div");
  layer.className = "game-layer hubpage-layer"; layer.id = "hubpage-layer"; layer.hidden = true;
  document.body.appendChild(layer);
  var cur = null;
  function build(id) {
    var cfg = HUB_PAGES[id];
    layer.innerHTML = '<div class="hubpage-bar"><b>' + w.esc(cfg.title) + '</b><span class="hubpage-sp"></span>' +
      '<button type="button" class="btn btn-sm hubpage-study" title="Notebook trong WordLoop: ôn theo Block, ⭐ Ôn riêng, chọn chủ đề chơi game">📒 Học &amp; chơi game</button>' +
      '<a class="btn btn-sm" href="' + w.esc(cfg.url) + '" target="_blank" rel="noopener" title="Mở trang gốc ở tab mới">↗ Tab mới</a></div>' +
      '<iframe title="' + w.esc(cfg.title) + '" allow="autoplay; clipboard-write" src="' + w.esc(cfg.url) + '"></iframe>';
    layer.querySelector(".hubpage-study").addEventListener("click", close);
    cur = id;
  }
  function open(id) {
    if (!HUB_PAGES[id]) return close();
    if (cur !== id) build(id);
    var g = w.$("#game-layer"); if (g && !g.hidden) { var b = w.$("#btn-game"); if (b) b.click(); }   /* đang mở Game -> đóng */
    if (w.Speech && w.Speech.stop) w.Speech.stop();
    layer.hidden = false; document.body.classList.add("hubpage-on");
  }
  function close() { layer.hidden = true; document.body.classList.remove("hubpage-on"); }
  /* bấm tab Hub: Hub có trang riêng -> mở trang (app.js vẫn nạp notebook bên dưới như thường); Hub khác -> đóng */
  tabs.addEventListener("click", function (e) {
    if (e.target.closest("[data-menu]")) return;
    var b = e.target.closest("[data-hub]"); if (!b) return;
    var id = b.dataset.hub;
    setTimeout(function () { HUB_PAGES[id] ? open(id) : close(); }, 0);
  });
  /* các nút điều hướng khác trên thanh trên cùng / thanh dưới đáy -> rời trang */
  var top = w.$(".topbar");
  if (top) top.addEventListener("click", function (e) {
    if (layer.hidden) return;
    if (e.target.closest("#btn-home, #btn-journey, #btn-wordset, #btn-fixwrong, #btn-learning, #btn-game, #brand")) close();
  }, true);
  w.$$(".mobile-nav button").forEach(function (b) { b.addEventListener("click", function () { if (!layer.hidden) close(); }, true); });
  /* mở WordLoop mà Hub đang chọn là Hub có trang riêng -> mở luôn trang (chờ app.js vẽ tab Hub) */
  var tries = 0, t = setInterval(function () {
    var a = w.$("#hub-tabs .hub-tab.active");
    if (a || ++tries > 40) { clearInterval(t); if (a && HUB_PAGES[a.dataset.hub]) open(a.dataset.hub); }
  }, 250);
  w.HubPage = { open: open, close: close, pages: HUB_PAGES };
})(window);
