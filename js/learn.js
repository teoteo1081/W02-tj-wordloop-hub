/* learn.js — "Góc tự học" trên đầu game.html (TJ 2026-10-04: "tích hợp game vào trang game, có TOEIC rồi, thêm EA và Digital Marketing").
   3 thẻ: 🎮 Phòng game = game từ vựng + TOEIC sẵn có (game.js, không đụng gì) · 🧾 EA · 📣 Marketing = 2 game tự học trong learn/ (1 người chơi,
   tiến độ lưu localStorage riêng: ea-quest-v1 / dm-quest-v1). Mở EA/Marketing = lớp phủ iframe ngay dưới thanh trên cùng;
   iframe tạo 1 lần rồi GIỮ SỐNG (ẩn chứ không xoá) để chuyển qua lại không mất lượt đang chơi, và phòng TOEIC bên dưới vẫn chạy. */
(function () {
  "use strict";
  var PAGES = { ea: "learn/ea/index.html?v=11", dm: "learn/dm/index.html?v=11", sp: "learn/sw/index.html?v=71&kind=speaking", wr: "learn/sw/index.html?v=71&kind=writing", ielts: "learn/sw/index.html?v=72&kind=speaking&exam=ielts", ielw: "learn/sw/index.html?v=72&kind=writing&exam=ielts" };
  var TITLES = { ea: "EA Quest", dm: "Marketing Quest", sp: "TOEIC Speaking", wr: "TOEIC Writing", ielts: "IELTS Speaking", ielw: "IELTS Writing" };
  var nav = document.getElementById("g-learn"), top = document.querySelector(".g-top");
  if (!nav || !top) return;
  var layer = document.createElement("div");
  layer.className = "g-learnlayer"; layer.hidden = true;
  document.body.appendChild(layer);
  var frames = {};

  /* thẻ 🎮 Phòng game / 🎯 TOEIC = 2 hub của phòng game (game.js lắng nghe "tjwl-sethub"); IELTS chưa có (nút mờ); EA / Digital Marketing = lớp phủ iframe */
  var hub = window.TJ_HUB || "vocab";
  function paintHub() {
    if (!layer.hidden) return;   /* đang ở EA / Marketing: giữ tô sáng của chúng */
    nav.querySelectorAll("[data-learn]").forEach(function (b) { var k = b.dataset.learn; b.classList.toggle("on", (k === "" && hub !== "test") || (k === "toeic" && hub === "test")); });
  }
  document.addEventListener("tjwl-hubchanged", function (e) { hub = e.detail === "test" ? "test" : "vocab"; paintHub(); });
  function place() { layer.style.top = Math.round(top.getBoundingClientRect().bottom) + "px"; }
  function show(key) {
    if (!PAGES[key]) key = "";
    nav.querySelectorAll("[data-learn]").forEach(function (b) { b.classList.toggle("on", b.dataset.learn === key); });
    Object.keys(frames).forEach(function (k) { frames[k].hidden = k !== key; });
    if (key && !frames[key]) {
      var f = document.createElement("iframe");
      f.src = PAGES[key]; f.title = TITLES[key] || key; f.allow = "autoplay; microphone";
      layer.appendChild(f); frames[key] = f;
    }
    layer.hidden = !key;
    document.body.classList.toggle("learn-on", !!key);
    if (key) place();
    try { sessionStorage.setItem("tjwl_learn_tab", key); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("tjwl-learn-shown", { detail: key })); } catch (e) {}   /* swclass.js: host rời thẻ Speaking/Writing -> đóng lớp cho cả phòng */
    if (!key) paintHub();
  }
  nav.addEventListener("click", function (e) {
    var b = e.target.closest("[data-learn]"); if (!b || b.disabled) return;
    var k = b.dataset.learn;
    try { if (k === "sp" || k === "wr" || k === "ielts" || k === "ielw" || k === "dm" || k === "ea") sessionStorage.setItem("tjwl_sw_keep", k); else sessionStorage.removeItem("tjwl_sw_keep"); } catch (e) {}   /* chỉ host bấm thẻ (thanh thẻ chỉ có ở host) -> F5 quay lại đúng Speaking/Writing; người chơi bị lớp tự mở thì KHÔNG nhớ */
    if (k === "" || k === "toeic") { show(""); document.dispatchEvent(new CustomEvent("tjwl-sethub", { detail: k === "toeic" ? "test" : "vocab" })); }
    else show(k);
  });
  document.addEventListener("tjwl-sw-open", function (e) { show(e.detail === "writing" ? "wr" : e.detail === "ielts" ? "ielts" : e.detail === "ielw" ? "ielw" : e.detail === "dm" ? "dm" : e.detail === "ea" ? "ea" : "sp"); });   /* swclass.js: host bắt đầu lớp -> mở đúng thẻ */
  document.addEventListener("tjwl-learn-home", function () { show(""); });   /* game.js: mở từ bài học -> bỏ lớp phủ EA/Marketing, về thẻ Phòng game */
  window.addEventListener("resize", function () { if (!layer.hidden) place(); });
  /* thanh trên (hàng thẻ Từ vựng/TOEIC/Speaking… xuống dòng, hiện muộn khi biết là host…) đổi chiều cao SAU khi lớp phủ đã đặt -> lớp phủ bị thanh trên che mất đầu trang (nút của host nằm ngay đầu). Theo dõi chiều cao để đặt lại. */
  try { if (window.ResizeObserver) new ResizeObserver(function () { if (!layer.hidden) place(); }).observe(top); } catch (e) {}
  setInterval(function () { if (!layer.hidden) place(); }, 1500);
  try { var last = sessionStorage.getItem("tjwl_learn_tab"); if (last && ((last !== "sp" && last !== "wr" && last !== "ielts" && last !== "ielw" && last !== "dm" && last !== "ea") || sessionStorage.getItem("tjwl_sw_keep"))) show(last); } catch (e) {}   /* sp/wr chỉ mở khi host bắt đầu lớp (người chơi F5 không bị kẹt ở Speaking) */
  paintHub();
})();
