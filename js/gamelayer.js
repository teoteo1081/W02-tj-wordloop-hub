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
  var settled = false;   /* chưa biết chắc là ai (đang đăng nhập / mạng chậm) -> KHÔNG đóng game vừa mở lại */
  /* chỉ coi là "chắc chắn KHÔNG phải TJ" khi kho đang Cloud và đăng nhập người khác. Mất mạng -> DB rơi về Local, Auth thành hồ sơ máy
     -> KHÔNG đóng game, không xoá dấu mở lại (QA 2026-10-04: F5 lúc mất mạng bị kẹt ở Learning) */
  function notTJ() { return !!(w.Auth && w.Auth.user && w.Auth.user.id !== TJ_ID && w.DB && w.DB.mode === "cloud" && !w.Auth.viewAsUserId); }
  function syncBtn() {
    if (isTJ() || notTJ()) settled = true;
    btn.hidden = !isTJ() && !(isOpen() && !notTJ()); if (mbtn) mbtn.hidden = btn.hidden;
    if (notTJ() && isOpen()) { close(); kill(); }
  }
  function kill() { while (layer.firstChild) layer.removeChild(layer.firstChild); }   /* không phải TJ -> bỏ hẳn iframe: trước chỉ ẩn, game vẫn chạy & ngồi trong phòng TJ như "người chơi ma" */
  function isOpen() { return !layer.hidden; }

  /* 🖤 CHẾ ĐỘ BẢNG (TJ 2026-10-05): bảng mở -> lớp game chỉ phủ VÙNG GIỮA (#workspace) — thanh trên, cột Notebooks / Pages (có ghim)
     giữ y nguyên như Learning; ghim cột thì vùng hẹp lại, bỏ ghim thì rộng ra (theo kích thước #workspace). */
  var fitOn = false, fitRO = null;
  function fitRect() {
    var ws = w.$("#workspace"); if (!ws || !fitOn) return;
    var r = ws.getBoundingClientRect(); if (r.width < 50 || r.height < 50) return;
    layer.style.top = Math.round(r.top) + "px"; layer.style.left = Math.round(r.left) + "px";
    layer.style.width = Math.round(r.width) + "px"; layer.style.right = "auto";
  }
  function setFit(on) {
    on = !!on && isOpen();
    if (on === fitOn) { if (on) fitRect(); return; }
    fitOn = on; layer.classList.toggle("board-fit", on);
    if (!on) { layer.style.top = layer.style.left = layer.style.width = layer.style.right = ""; if (fitRO) { fitRO.disconnect(); fitRO = null; } return; }
    fitRect();
    var ws = w.$("#workspace");
    if (w.ResizeObserver && ws) { fitRO = new w.ResizeObserver(fitRect); fitRO.observe(ws); }
  }
  w.addEventListener("resize", function () { if (fitOn) fitRect(); });
  /* Bảng mở + đã có Block -> lớp game phủ vùng giữa (bảng đang hiện bài).
     Bảng mở nhưng CHƯA có Block -> ẩn lớp game, màn hình Learning (danh sách Block, ghim y chang) hiện trên NỀN BẢNG (xanh + viền nâu);
     bấm 1 Block thì Block đó lên bảng (TJ 2026-10-05: "khi chưa vào block thì bảng thấy nguyên màn hình Learning"). */
  var boardOnState = false, bb = null;
  function setBoardState(on, doc) {
    boardOnState = !!on;
    var idle = !!on && !doc;
    setFit(!!on && !!doc);
    layer.classList.toggle("board-idle", idle);
    layer.style.visibility = idle ? "hidden" : ""; layer.style.pointerEvents = idle ? "none" : "";   /* ẩn ngay trong JS (không phụ thuộc CSS cũ trong bộ nhớ đệm) */
    document.body.classList.toggle("board-skin", idle);
    if (bb) bb.classList.toggle("active", !!on);
  }
  /* CHẾ ĐỘ BẢNG = một chế độ của Learning (TJ 2026-10-05: "bảng là chế độ khác lấy giao diện của Learning, Learning đâu mất rồi"):
     vào chế độ bảng thì Learning LUÔN hiện (nền bảng); lớp game chỉ lộ ra đúng vùng giữa khi bảng đã có Block, không bao giờ phủ kín Learning. */
  var boardMode = false, seenOn = false;
  function enterBoard() {
    boardMode = true; seenOn = false;
    layer.hidden = false; layer.classList.add("board-idle");   /* lớp game có mặt nhưng ẨN (visibility) cho tới khi có Block */
    layer.style.visibility = "hidden"; layer.style.pointerEvents = "none";
    document.body.classList.add("board-skin");
    boardOnState = true; if (bb) bb.classList.add("active");
  }
  w.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== "tjwl-board-on") return;
    var on = !!e.data.on, doc = !!e.data.doc;
    if (on) seenOn = true;
    if (!on && boardMode) { if (seenOn) close(); return; }   /* khung game báo bảng đã đóng -> thoát chế độ bảng (trước khi bảng từng mở thì bỏ qua) */
    setBoardState(on, doc);
  });

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
    try { sessionStorage.setItem("tjwl_game_open", "1"); localStorage.setItem("tjwl_game_open_at", String(Date.now())); if (!/tjwl_game/.test(w.name || "")) w.name = (w.name || "") + " tjwl_game"; } catch (e) {}   /* F5 khi đang ở Game -> mở lại Game (TJ 2026-10-02) */
    btn.classList.add("active");
    if (mbtn) { w.$$(".mobile-nav button").forEach(function (x) { x.classList.toggle("active", x === mbtn); }); }
    document.body.classList.add("game-on");
  }
  function close() {
    setFit(false);
    boardOnState = false; boardMode = false; seenOn = false; layer.style.visibility = ""; layer.style.pointerEvents = ""; layer.classList.remove("board-idle"); document.body.classList.remove("board-skin"); if (bb) bb.classList.remove("active");
    layer.hidden = true;
    try { sessionStorage.removeItem("tjwl_game_open"); localStorage.removeItem("tjwl_game_open_at"); w.name = String(w.name || "").replace(/\s*tjwl_game/g, ""); } catch (e) {}
    learn.hidden = learnWasHidden;
    btn.classList.remove("active");
    if (mbtn) mbtn.classList.remove("active");
    document.body.classList.remove("game-on");
  }
  btn.addEventListener("click", function () { isOpen() ? close() : open(); });

  /* 🖤 nút "Bảng" cạnh "Game": bật bảng ở màn DANH SÁCH Block (màn hình Learning trên nền bảng) / tắt bảng (TJ 2026-10-05) */
  bb = document.createElement("button"); bb.id = "btn-board"; bb.type = "button";
  bb.className = String(btn.className || "").replace(/\bactive\b/g, "").trim(); bb.textContent = "🖤 Bảng"; bb.title = "Bật / tắt bảng chung";
  bb.hidden = btn.hidden; btn.parentNode.insertBefore(bb, btn.nextSibling);
  setInterval(function () { bb.hidden = btn.hidden; }, 1000);
  bb.addEventListener("click", function () { boardOnState ? closeBoardMode() : openBoardIdle(); });
  function openBoardIdle() {
    if (!layer.firstChild) {
      var f = document.createElement("iframe");
      f.src = "game.html?embed=1&t=" + Date.now() + "&boardidle=1";
      f.title = "WordLoop Game"; f.allow = "clipboard-write; autoplay";
      layer.appendChild(f);
    } else { try { layer.firstChild.contentWindow.postMessage({ type: "tjwl-game-boardopen" }, location.origin); } catch (e) {} }
    enterBoard();   /* không gọi open(): lớp game không được phủ Learning */
  }
  function closeBoardMode() { try { layer.firstChild.contentWindow.postMessage({ type: "tjwl-game-boardclose" }, location.origin); } catch (e) {} }

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

  /* 🖤 Mở bảng cho 1 mục (Block/Batch/Page/Section/Notebook/Hub): mở thẻ Game (giữ phòng đang mở), game tự mở bảng với MỌI Block trong mục. */
  function openBoard(table, id, title) {
    var sc = [{ table: table, id: id, title: title || id }];
    if (!layer.firstChild) {
      var f = document.createElement("iframe");
      f.src = "game.html?embed=1&t=" + Date.now() + "&scope=" + encodeURIComponent(table + ":" + id) + "&title=" + encodeURIComponent(title || "") + "&board=1";
      f.title = "WordLoop Game";
      f.allow = "clipboard-write; autoplay";
      layer.appendChild(f);
    } else {
      try { layer.firstChild.contentWindow.postMessage({ type: "tjwl-game-board", scope: sc }, location.origin); } catch (e) {}
    }
    enterBoard();   /* Learning luôn hiện; lớp game chỉ lộ ra đúng vùng giữa khi bảng có Block */
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
  /* F5 / mất mạng tự tải lại / trình duyệt tự nạp lại tab khi đang ở Game -> MỞ LẠI GAME NGAY (TJ 2026-10-04: "bị trả về trang
     learning hoặc trang ngẫu nhiên"). Trước: chờ nhận ra hồ sơ TJ tối đa 30 giây, mạng chậm là bỏ cuộc. Nay mở luôn,
     chỉ đóng khi đã chắc chắn KHÔNG phải TJ. Dự phòng localStorage (≤ 15 phút) nếu trình duyệt mất sessionStorage. */
  var wasOpen = false;
  /* dự phòng localStorage CHỈ cho đúng tab đã mở game (đánh dấu window.name: giữ qua F5, tab khác không có) — trước đây
     mọi tab mới cùng trình duyệt đều tự mở game trong 15 phút (QA 2026-10-04) */
  try { wasOpen = sessionStorage.getItem("tjwl_game_open") === "1" || (/tjwl_game/.test(w.name || "") && Date.now() - (+localStorage.getItem("tjwl_game_open_at") || 0) < 15 * 60000); } catch (e) {}
  if (wasOpen) open();
  var tries = 0, t = setInterval(function () {   /* Auth.init chạy bất đồng bộ */
    syncBtn();
    if (++tries > 120) { settled = true; syncBtn(); }
    if (settled) clearInterval(t);
  }, 1000);
  syncBtn();
  /* ?game=1[&scope=<table>:<id>&title=…&board=1] (game.html mở riêng chuyển về đây): mở thẻ Game, có scope thì chọn sẵn / mở bảng */
  try {
    var qg = new URLSearchParams(location.search);
    if (qg.get("game") === "1") {
      var sc0 = qg.get("scope"), ix = sc0 ? sc0.indexOf(":") : -1;
      if (ix > 0) (qg.get("board") === "1" ? openBoard : openScope)(sc0.slice(0, ix), sc0.slice(ix + 1), qg.get("title") || ""); else open();
      history.replaceState(null, "", location.pathname);
    }
  } catch (e) {}
  w.GameLayer = { open: open, close: close, isOpen: isOpen, openScope: openScope, openBoard: openBoard };
})(window);
