/* learn.js — "Góc tự học" trên đầu game.html (TJ 2026-10-04: "tích hợp game vào trang game, có TOEIC rồi, thêm EA và Digital Marketing").
   3 thẻ: 🎮 Phòng game = game từ vựng + TOEIC sẵn có (game.js, không đụng gì) · 🧾 EA · 📣 Marketing = 2 game tự học trong learn/ (1 người chơi,
   tiến độ lưu localStorage riêng: ea-quest-v1 / dm-quest-v1). Mở EA/Marketing = lớp phủ iframe ngay dưới thanh trên cùng;
   iframe tạo 1 lần rồi GIỮ SỐNG (ẩn chứ không xoá) để chuyển qua lại không mất lượt đang chơi, và phòng TOEIC bên dưới vẫn chạy. */
(function () {
  "use strict";
  var PAGES = { ea: "learn/ea/index.html?v=1", dm: "learn/dm/index.html?v=1" };
  var nav = document.getElementById("g-learn"), top = document.querySelector(".g-top");
  if (!nav || !top) return;
  var layer = document.createElement("div");
  layer.className = "g-learnlayer"; layer.hidden = true;
  document.body.appendChild(layer);
  var frames = {};

  function place() { layer.style.top = Math.round(top.getBoundingClientRect().bottom) + "px"; }
  function show(key) {
    if (!PAGES[key]) key = "";
    nav.querySelectorAll("[data-learn]").forEach(function (b) { b.classList.toggle("on", b.dataset.learn === key); });
    Object.keys(frames).forEach(function (k) { frames[k].hidden = k !== key; });
    if (key && !frames[key]) {
      var f = document.createElement("iframe");
      f.src = PAGES[key]; f.title = key === "ea" ? "EA Quest" : "Marketing Quest"; f.allow = "autoplay";
      layer.appendChild(f); frames[key] = f;
    }
    layer.hidden = !key;
    document.body.classList.toggle("learn-on", !!key);
    if (key) place();
    try { sessionStorage.setItem("tjwl_learn_tab", key); } catch (e) {}
  }
  nav.addEventListener("click", function (e) { var b = e.target.closest("[data-learn]"); if (b) show(b.dataset.learn); });
  window.addEventListener("resize", function () { if (!layer.hidden) place(); });
  try { var last = sessionStorage.getItem("tjwl_learn_tab"); if (last) show(last); } catch (e) {}
})();
