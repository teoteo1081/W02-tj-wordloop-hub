/* learn.js — "Góc tự học" trên đầu game.html (TJ 2026-10-04: "tích hợp game vào trang game, có TOEIC rồi, thêm EA và Digital Marketing").
   3 thẻ: 🎮 Phòng game = game từ vựng + TOEIC sẵn có (game.js, không đụng gì) · 🧾 EA · 📣 Marketing = 2 game tự học trong learn/ (1 người chơi,
   tiến độ lưu localStorage riêng: ea-quest-v1 / dm-quest-v1). Mở EA/Marketing = lớp phủ iframe ngay dưới thanh trên cùng;
   iframe tạo 1 lần rồi GIỮ SỐNG (ẩn chứ không xoá) để chuyển qua lại không mất lượt đang chơi, và phòng TOEIC bên dưới vẫn chạy. */
(function () {
  "use strict";
  var PAGES = { ea: "learn/ea/index.html?v=31", dm: "learn/dm/index.html?v=31", sp: "learn/sw/index.html?v=92&kind=speaking", wr: "learn/sw/index.html?v=92&kind=writing", ielts: "learn/sw/index.html?v=92&kind=speaking&exam=ielts", ielw: "learn/sw/index.html?v=92&kind=writing&exam=ielts" };
  var TITLES = { ea: "EA Quest", dm: "Marketing Quest", sp: "TOEIC Speaking", wr: "TOEIC Writing", ielts: "IELTS Speaking", ielw: "IELTS Writing" };
  var nav = document.getElementById("g-learn"), top = document.querySelector(".g-top");
  if (!nav || !top) return;
  var layer = document.createElement("div");
  layer.className = "g-learnlayer"; layer.hidden = true;
  document.body.appendChild(layer);
  var frames = {};
  var curKey = "", hist = [], backing = false;   /* thẻ đang mở + lịch sử các thẻ đã chọn trước đó (nút ← của thanh ngữ cảnh) */
  function curToken() { return curKey ? curKey : (hub === "test" ? "toeic" : ""); }
  /* TJ 2026-10-15: điện thoại — hàng 8 thẻ chủ đề (Từ vựng/TOEIC/Speaking…) chiếm ~4 dòng. Chọn xong thì THU GỌN còn 1 nút "đang chọn ▾"; bấm nút để mở lại, chọn thẻ khác thì tự thu. */
  var cur = document.createElement("button");
  cur.type = "button"; cur.id = "g-learn-cur"; cur.className = "g-learn-cur"; cur.setAttribute("aria-expanded", "false");
  nav.parentNode.insertBefore(cur, nav);
  function paintCur() {
    var on = nav.querySelector("[data-learn].on"), op = nav.classList.contains("open"), t = document.createElement("span"), a = document.createElement("b");
    t.textContent = on ? on.textContent.trim() : "🎮 Từ vựng"; a.textContent = op ? "▴" : "▾";
    cur.textContent = ""; cur.appendChild(t); cur.appendChild(a); cur.setAttribute("aria-expanded", op ? "true" : "false");
    var cp = document.getElementById("cx-path-t"); if (cp) cp.textContent = on ? on.textContent.trim() : "🎮 Từ vựng";   /* thanh ngữ cảnh */
    var cb = document.getElementById("cx-back"); if (cb) cb.classList.toggle("off", !hist.length);
  }
  cur.addEventListener("click", function () { nav.classList.toggle("open"); paintCur(); });

  /* thẻ 🎮 Phòng game / 🎯 TOEIC = 2 hub của phòng game (game.js lắng nghe "tjwl-sethub"); IELTS chưa có (nút mờ); EA / Digital Marketing = lớp phủ iframe */
  var hub = window.TJ_HUB || "vocab";
  function paintHub() {
    if (!layer.hidden) return;   /* đang ở EA / Marketing: giữ tô sáng của chúng */
    nav.querySelectorAll("[data-learn]").forEach(function (b) { var k = b.dataset.learn; b.classList.toggle("on", (k === "" && hub !== "test") || (k === "toeic" && hub === "test")); });
    paintCur();
  }
  document.addEventListener("tjwl-hubchanged", function (e) { hub = e.detail === "test" ? "test" : "vocab"; paintHub(); });
  /* TJ 2026-10-15: lúc làm bài thanh trên bị đẩy khỏi màn hình -> mép dưới của nó ÂM, khung lớp bị đặt lên trên, mất khúc đầu.
     Nay: đang chơi (body.g-playing) hoặc mép âm -> khung bắt đầu từ mép trên màn hình (0). */
  function place() { var b = top.getBoundingClientRect().bottom, bc = document.body.classList; layer.style.top = (bc.contains("g-playing") ? 0 : bc.contains("g-tidy") ? 46 : Math.max(0, Math.round(b))) + "px"; }
  document.addEventListener("tjwl-top-layout", function () { place(); setTimeout(place, 250); });   /* menu ẩn/hiện/ghim -> đặt lại mép trên khung lớp */
  document.addEventListener("tjwl-sw-focus", function () { place(); setTimeout(place, 250); });   /* sau hiệu ứng trượt thanh trên (.18s) */
  function show(key) {
    if (!PAGES[key]) key = "";
    nav.querySelectorAll("[data-learn]").forEach(function (b) { b.classList.toggle("on", b.dataset.learn === key); });
    Object.keys(frames).forEach(function (k) { frames[k].hidden = k !== key; });
    if (key && !frames[key]) {
      var f = document.createElement("iframe");
      f.src = PAGES[key]; f.title = TITLES[key] || key; f.allow = "autoplay; microphone";
      layer.appendChild(f); frames[key] = f;
    }
    layer.hidden = !key; curKey = key;
    document.body.classList.toggle("learn-on", !!key);
    if (key) place();
    try { sessionStorage.setItem("tjwl_learn_tab", key); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("tjwl-learn-shown", { detail: key })); } catch (e) {}   /* swclass.js: host rời thẻ Speaking/Writing -> đóng lớp cho cả phòng */
    if (!key) paintHub();
    nav.classList.remove("open"); paintCur();   /* chọn xong -> thu gọn hàng thẻ (điện thoại) */
  }
  nav.addEventListener("click", function (e) {
    var b = e.target.closest("[data-learn]"); if (!b || b.disabled) return;
    var k = b.dataset.learn, before = curToken();
    try { if (k === "sp" || k === "wr" || k === "ielts" || k === "ielw" || k === "dm" || k === "ea") sessionStorage.setItem("tjwl_sw_keep", k); else sessionStorage.removeItem("tjwl_sw_keep"); } catch (e) {}   /* chỉ host bấm thẻ (thanh thẻ chỉ có ở host) -> F5 quay lại đúng Speaking/Writing; người chơi bị lớp tự mở thì KHÔNG nhớ */
    if (k === "" || k === "toeic") { hub = k === "toeic" ? "test" : "vocab"; show(""); document.dispatchEvent(new CustomEvent("tjwl-sethub", { detail: k === "toeic" ? "test" : "vocab" })); }   /* cập nhật hub NGAY (nhãn thanh ngữ cảnh không chờ tín hiệu trễ từ game) */
    else show(k);
    if (!backing && k !== before) { hist.push(before); if (hist.length > 12) hist.shift(); }
    paintCur();
    try { document.dispatchEvent(new CustomEvent("tjwl-tidy")); } catch (e) {}   /* chọn thẻ xong -> menu tự ẩn (điện thoại) */
  });
  /* 📍 THANH NGỮ CẢNH (TJ 2026-10-15: "hong biết đang ở thư mục nào, cho đường dẫn + ← + ✕ để thoát nhanh, combobox phải hiện để chọn lại"):
     chỉ hiện khi menu tự ẩn trên điện thoại (CSS body.g-tidy). */
  (function () {
    var pop = document.getElementById("cx-pop"), path = document.getElementById("cx-path"); if (!pop || !path) return;
    function closePop() { pop.hidden = true; path.setAttribute("aria-expanded", "false"); }
    function openPop() {
      var on = nav.querySelector("[data-learn].on"); pop.textContent = "";
      [].slice.call(nav.querySelectorAll("[data-learn]")).forEach(function (nb) {
        var it = document.createElement("button"); it.type = "button"; it.dataset.cx = nb.dataset.learn; it.textContent = nb.textContent.trim(); it.disabled = !!nb.disabled; it.setAttribute("role", "option");
        if (nb === on) { it.className = "on"; it.setAttribute("aria-selected", "true"); } pop.appendChild(it);
      });
      pop.hidden = false; path.setAttribute("aria-expanded", "true");
    }
    path.addEventListener("click", function () { if (pop.hidden) openPop(); else closePop(); });
    pop.addEventListener("click", function (e) { var it = e.target.closest("[data-cx]"); if (!it || it.disabled) return; closePop(); var nb = nav.querySelector('[data-learn="' + it.dataset.cx + '"]'); if (nb) nb.click(); });
    document.addEventListener("click", function (e) { if (!pop.hidden && !e.target.closest("#cx-pop") && !e.target.closest("#cx-path")) closePop(); });
    document.getElementById("cx-back").addEventListener("click", function () {
      closePop(); var t = hist.pop(); if (t === undefined) return;
      var nb = nav.querySelector('[data-learn="' + t + '"]'); if (!nb) return; backing = true; try { nb.click(); } finally { backing = false; } paintCur();
    });
    document.getElementById("cx-close").addEventListener("click", function () { closePop(); try { window.parent.GameLayer.close(); } catch (e) {} });   /* thoát game về Learning */
    document.getElementById("cx-menu").addEventListener("click", function () { closePop(); var h = document.getElementById("g-tophandle"); if (h) h.click(); });   /* hiện menu đầy đủ (tạm) */
    document.getElementById("cx-pin").addEventListener("click", function () { closePop(); var p = document.getElementById("g-toppin"); if (p) p.click(); });   /* ghim menu */
  })();
  document.addEventListener("tjwl-sw-open", function (e) { show(e.detail === "writing" ? "wr" : e.detail === "ielts" ? "ielts" : e.detail === "ielw" ? "ielw" : e.detail === "dm" ? "dm" : e.detail === "ea" ? "ea" : "sp"); });   /* swclass.js: host bắt đầu lớp -> mở đúng thẻ */
  document.addEventListener("tjwl-learn-home", function () { show(""); });   /* game.js: mở từ bài học -> bỏ lớp phủ EA/Marketing, về thẻ Phòng game */
  window.addEventListener("resize", function () { if (!layer.hidden) place(); });
  /* thanh trên (hàng thẻ Từ vựng/TOEIC/Speaking… xuống dòng, hiện muộn khi biết là host…) đổi chiều cao SAU khi lớp phủ đã đặt -> lớp phủ bị thanh trên che mất đầu trang (nút của host nằm ngay đầu). Theo dõi chiều cao để đặt lại. */
  try { if (window.ResizeObserver) new ResizeObserver(function () { if (!layer.hidden) place(); }).observe(top); } catch (e) {}
  setInterval(function () { if (!layer.hidden) place(); }, 1500);
  try { var last = sessionStorage.getItem("tjwl_learn_tab"); if (last && ((last !== "sp" && last !== "wr" && last !== "ielts" && last !== "ielw" && last !== "dm" && last !== "ea") || sessionStorage.getItem("tjwl_sw_keep"))) show(last); } catch (e) {}   /* sp/wr chỉ mở khi host bắt đầu lớp (người chơi F5 không bị kẹt ở Speaking) */
  paintHub(); paintCur();
})();
