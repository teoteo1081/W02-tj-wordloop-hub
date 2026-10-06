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
  var fitPoll = 0;
  function fitRect() {
    var ws = w.$("#workspace"); if (!ws || !fitOn) return;
    var r = ws.getBoundingClientRect(); if (r.width < 50 || r.height < 50) return;
    layer.style.top = Math.round(r.top) + "px"; layer.style.left = Math.round(r.left) + "px";
    layer.style.width = Math.round(r.width) + "px"; layer.style.right = "auto";
  }
  function setFit(on) {
    on = (!!on || gameOpened) && isOpen();   /* thẻ 🎮 Game đang mở: LUÔN giữ 2 cột Notebooks / Pages như Bảng (TJ 2026-10-06) */
    if (on === fitOn) { if (on) fitRect(); return; }
    fitOn = on; layer.classList.toggle("board-fit", on);
    clearInterval(fitPoll);
    if (on) fitPoll = setInterval(fitRect, 200);   /* TJ 2026-10-06: ẩn Notebooks / Pages mà bảng không bung theo -> ResizeObserver chỉ báo khi BỀ RỘNG đổi; cột trái co + cột phải giãn cùng lúc (rộng giữ nguyên, vị trí đổi) thì lệch -> kiểm tra cả vị trí 5 lần/giây */
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
  var boardMode = false, seenOn = false, gameOpened = false, boardLearnWas = true;
  function refreshLb() { try { if (w.App && w.App.renderSidebarLbMini) w.App.renderSidebarLbMini(true); } catch (e) {} }   /* ô Xếp hạng cột trái: chế độ bảng = người chơi game, mọi thời gian */   /* gameOpened = thẻ 🎮 Game đã mở bằng open(); chế độ bảng KHÔNG gọi open() nên không đụng tới nút Learning / Game */
  function enterBoard() {
    boardMode = true; seenOn = false;
    try { if (w.App && w.App.showBlockList) w.App.showBlockList(); } catch (e) {}   /* Learning về màn danh sách Block */
    layer.hidden = false; layer.classList.add("board-idle");   /* lớp game có mặt nhưng ẨN (visibility) cho tới khi có Block */
    layer.style.visibility = "hidden"; layer.style.pointerEvents = "none";
    document.body.classList.add("board-skin", "board-mode");
    boardLearnWas = learn.hidden; learn.hidden = false;   /* nút "📖 Learning" hiện để quay về Learning, như khi đang ở màn khác */
    boardOnState = true; if (bb) bb.classList.add("active");
    try { sessionStorage.setItem("tjwl_board_mode", "1"); } catch (e) {}   /* F5 -> ở yên trong bảng (TJ 2026-10-05) */
    refreshLb();
  }
  function leaveBoard() {
    try { sessionStorage.removeItem("tjwl_board_mode"); } catch (e) {}
    setFit(false);
    boardOnState = false; boardMode = false; seenOn = false;
    layer.style.visibility = ""; layer.style.pointerEvents = ""; layer.classList.remove("board-idle");
    document.body.classList.remove("board-skin", "board-mode"); if (bb) bb.classList.remove("active");
    layer.hidden = true;
    if (!gameOpened) learn.hidden = boardLearnWas;
    refreshLb();
  }
  /* TJ 2026-10-06: "Admin bấm Bảng thì ở trên là avatar, bên dưới là những người đang trong phòng game" — màn danh sách Block (Learning trên nền bảng)
     không có lớp game, nên Learning tự vẽ 2 dải này từ danh sách game gửi sang (tjwl-board-people). Chỉ hiện khi body.board-skin. */
  var lbdPeople = null;
  function lbdAv(a) { a = String(a || ""); return /^https?:/.test(a) ? '<img alt="" src="' + w.esc(a) + '">' : '<span class="lbd-av">' + w.esc(a || "👤") + "</span>"; }
  var LFLAG = { vi: "🇻🇳", en: "🇺🇸", zh: "🇨🇳", es: "🇪🇸" };
  function lbdRender() {
    var ws = w.$("#workspace"), d = lbdPeople; if (!ws || !d) return;
    var top = w.$("#lbd-me"), bot = w.$("#lbd-people");
    if (!top) { top = document.createElement("div"); top.id = "lbd-me"; top.className = "lbd-me"; }
    if (!bot) { bot = document.createElement("div"); bot.id = "lbd-people"; bot.className = "lbd-people"; }
    if (ws.firstChild !== top) ws.insertBefore(top, ws.firstChild);
    if (ws.lastChild !== bot) ws.appendChild(bot);
    var m = d.me;
    top.innerHTML = m ? '<span class="lbd-ring">' + lbdAv(m.avatar) + (m.host ? "<i>👑</i>" : "") + "</span><b>" + w.esc(m.name || "") + '</b><span class="lbd-hint">Chọn 1 Block để mở lên bảng cho cả phòng</span>' : "";
    var L = (d.people || []).slice().sort(function (a, b) { return (b.id === d.mine) - (a.id === d.mine) || (!!b.host - !!a.host) || String(a.name || "").localeCompare(String(b.name || "")); });
    bot.innerHTML = L.map(function (p) { return '<div class="lbd-p' + (p.id === d.mine ? " me" : "") + '" title="' + w.esc(p.name || "") + '"><span class="lbd-ring">' + lbdAv(p.avatar) + (p.host ? "<i>👑</i>" : "") + (LFLAG[p.lang] ? "<u>" + LFLAG[p.lang] + "</u>" : "") + "</span><b>" + w.esc(p.name || "?") + "</b></div>"; }).join("");
  }
  w.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== "tjwl-board-people") return;
    lbdPeople = e.data; lbdRender();
  });
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
    gameOpened = true;
    setFit(true);
  }
  function close() {
    try { sessionStorage.removeItem("tjwl_board_mode"); } catch (e) {}
    if (boardMode && !gameOpened) { leaveBoard(); return; }   /* chỉ đang ở chế độ bảng: thoát bảng, giữ nguyên nút Learning / Game */
    gameOpened = false;
    setFit(false);
    boardOnState = false; boardMode = false; seenOn = false; layer.style.visibility = ""; layer.style.pointerEvents = ""; layer.classList.remove("board-idle"); document.body.classList.remove("board-skin", "board-mode"); if (bb) bb.classList.remove("active"); refreshLb();
    layer.hidden = true;
    try { sessionStorage.removeItem("tjwl_game_open"); localStorage.removeItem("tjwl_game_open_at"); w.name = String(w.name || "").replace(/\s*tjwl_game/g, ""); } catch (e) {}
    learn.hidden = learnWasHidden;
    btn.classList.remove("active");
    if (mbtn) mbtn.classList.remove("active");
    document.body.classList.remove("game-on");
  }
  /* TJ 2026-10-06: "Bấm game là ra trang game, bấm bảng là ra trang bảng, đừng kẹt bảng trong game" —
     🎮 khi đang ở chế độ bảng: tắt bảng (cả phòng về game) rồi mở trang game; bảng phòng còn bật thì cũng tắt để trang game không bị bảng đè. */
  btn.addEventListener("click", function () {
    if (boardMode) { closeBoardMode(); leaveBoard(); open(); return; }
    if (isOpen()) { close(); return; }
    if (boardOnState) closeBoardMode();
    open();
  });

  /* 🖤 nút "Bảng" cạnh "Game": bật bảng ở màn DANH SÁCH Block (màn hình Learning trên nền bảng) / tắt bảng (TJ 2026-10-05) */
  bb = document.createElement("button"); bb.id = "btn-board"; bb.type = "button";
  bb.className = String(btn.className || "").replace(/\bactive\b/g, "").trim(); bb.textContent = "🖤 Bảng"; bb.title = "Bật / tắt bảng chung";
  bb.hidden = btn.hidden; btn.parentNode.insertBefore(bb, btn.nextSibling);
  setInterval(function () { bb.hidden = btn.hidden; }, 1000);
  bb.addEventListener("click", function () {
    if (boardMode) { closeBoardMode(); return; }
    if (gameOpened) dropGame();   /* đang ở trang game -> rời trang game, sang trang bảng */
    openBoardIdle();
  });
  function dropGame() {
    gameOpened = false; btn.classList.remove("active"); if (mbtn) mbtn.classList.remove("active"); learn.hidden = learnWasHidden;
    document.body.classList.remove("game-on");
    try { sessionStorage.removeItem("tjwl_game_open"); localStorage.removeItem("tjwl_game_open_at"); w.name = String(w.name || "").replace(/\s*tjwl_game/g, ""); } catch (e) {}
  }
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

  /* TJ 2026-10-06: thẻ Game có 2 cột Notebooks (trái) + Pages (phải) y như Bảng, thay cho "Mở cây chủ đề"/📚 trong game.
     Đang ở thẻ Game: bấm 1 Notebook / Section / Page = chọn làm chủ đề ván (không chuyển trang Learning bên dưới). */
  function pickScope(e) {
    if (!(gameOpened && fitOn) || e.target.closest("[data-menu], .dots")) return;
    var el = e.target.closest("[data-nb],[data-sec],[data-page]"); if (!el) return;
    var t = el.dataset.nb ? "notebooks" : el.dataset.sec ? "sections" : "pages", id = el.dataset.nb || el.dataset.sec || el.dataset.page;
    var nm = String(el.getAttribute("title") || el.textContent || "").replace(/[⋯s]+$/g, "").replace(/s+/g, " ").trim().slice(0, 60);
    e.stopImmediatePropagation(); e.preventDefault();
    openScope(t, id, nm);
    w.$$("#sidebar-left .game-pick, #sidebar-right .game-pick").forEach(function (x) { x.classList.remove("game-pick"); }); el.classList.add("game-pick");
  }
  ["#sidebar-left", "#sidebar-right"].forEach(function (s) { var a = w.$(s); if (a) a.addEventListener("click", pickScope, true); });

  /* "📖 Learning": đang mở game thì chỉ đóng game (màn bên dưới vẫn y như lúc rời đi) */
  learn.addEventListener("click", function (e) {
    if (!isOpen()) return;
    if (boardMode && !gameOpened) { leaveBoard(); return; }   /* chế độ bảng: thoát bảng rồi để app tự xử lý nút Learning (không ẩn nút) */
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
  else {   /* F5 đang ở chế độ bảng: dựng lại khung game (nó tự khôi phục bảng + Block đang mở) và vào lại chế độ bảng */
    var wasBoard = false; try { wasBoard = sessionStorage.getItem("tjwl_board_mode") === "1"; } catch (e) {}
    if (wasBoard) {
      var fb = document.createElement("iframe");
      fb.src = "game.html?embed=1&t=" + Date.now(); fb.title = "WordLoop Game"; fb.allow = "clipboard-write; autoplay";
      layer.appendChild(fb);
      enterBoard();
      setTimeout(function () { if (boardMode && !seenOn) { try { fb.contentWindow.postMessage({ type: "tjwl-game-boardopen" }, location.origin); } catch (e) {} } }, 9000);
    }
  }
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
