/* board.js — 🖤 BẢNG VẼ CHUNG của phòng game (TJ 2026-10-04, bước 1: nền bảng vẽ).
   · Bảng đen tỉ lệ CỐ ĐỊNH 16:9 (toạ độ logic 1600×900) rồi co giãn theo màn hình -> nét vẽ khớp trên mọi máy.
   · Công cụ: 🔴 laser (chấm đỏ + vệt ngắn tự mờ, không để lại nét) · ✏️ bút (màu phấn, 3 cỡ) · T ô chữ (tạo nhiều ô,
     chạm lại để sửa / gõ tiếp) · ↶ hoàn tác / ↷ làm lại (nét của CHÍNH mình) · 🗑 xoá bảng (chỉ host).
   · Quyền: chỉ host + người host cấp quyền (st.bperm) mới dùng công cụ; người khác CHỈ XEM.
   · Đồng bộ qua kênh realtime sẵn có của phòng (broadcast event "board"); host giữ bản đầy đủ, máy vào sau xin "hello"
     thì host gửi lại toàn bộ. Không lưu vào DB (lưu phiên bản buổi học = bước sau).
   · 🖥 Host chia sẻ màn hình vào bảng (WebRTC, broadcast event "rtc" -> Board.onRtc) — xem mục "CHIA SẺ MÀN HÌNH" bên dưới.
   game.js gắn vào qua Board.attach(api) và chuyển mọi tin "board" vào Board.onMsg(payload), trạng thái phòng vào Board.onState(st). */
(function () {
  "use strict";
  var W = 1600, H = 900;
  var COLORS = ["#f5f4ef", "#ffd84d", "#ff8fb1", "#7cc4ff", "#7be0a1", "#ff6b5e"];
  var SIZES = [4, 8, 16];
  var api = null, open = false, mini = false, tool = "pen", color = COLORS[0], size = SIZES[1];
  var items = {}, order = [];          /* id -> {k:"s"|"t", ...}; order = thứ tự vẽ */
  var mine = [], redo = [];            /* id nét/ô chữ của mình để hoàn tác */
  var lasers = {};                     /* pid -> {pts:[{x,y,t}], name, at} */
  var cv, ctx, wrap, dpr = 1, cur = null, sendT = 0, lastLaserSend = 0, laserTail = 0, raf = 0, editing = null;
  var cid = Math.random().toString(36).slice(2, 9);   /* mã máy này — bỏ qua tin của chính mình (kênh bật self) */

  /* chữ trên bảng theo NGÔN NGỮ GIAO DIỆN của người xem (TJ 2026-10-04: chọn 中文 mà bảng vẫn tiếng Việt) — game.js truyền api.lang() */
  var TX = {
    vi: { board: "🖤 Bảng", can: "✍️ bạn được dùng bảng", view: "👀 chỉ xem", viewmsg: "👀 Bạn đang xem — host cấp quyền thì mới dùng được bút", perm: "👥 Quyền", permt: "Cấp quyền dùng bảng", min: "Thu nhỏ trên máy mình", close: "Đóng bảng cho cả phòng", laser: "Laser", pen: "Bút vẽ", text: "Ô chữ", color: "Màu", size: "Cỡ nét", undo: "Hoàn tác", redo: "Làm lại", clearAll: "Xoá cả bảng", clearMine: "Xoá nét của tôi", dock: "🖤 Mở bảng", open: "🖤 Bảng", qAll: "Xoá hết nét vẽ và ô chữ trên bảng (của cả phòng)?", qMine: "Xoá hết nét vẽ và ô chữ của bạn?", who: "Ai được dùng bảng (bút, laser, ô chữ):", none: "Chưa có người chơi nào.", share: "🖥 Chia sẻ màn hình", unshare: "⏹ Dừng chia sẻ", sharet: "Chia sẻ màn hình của bạn cho cả phòng (như Google Meet) — người có quyền vẫn vẽ/laser lên trên", sharing: "🖥 Bạn đang chia sẻ màn hình", nview: "👁 {n} người xem", watching: "🖥 {n} đang chia sẻ màn hình", conn: "🖥 đang kết nối…", fail: "⚠️ Không kết nối được — mạng có thể chặn (cần TURN)", full: "⚠️ Đã đủ 10 người xem — chờ có chỗ trống", hostfull: "⚠️ Tối đa 10 người xem — {n} người chưa xem được", unmute: "🔊 Bật tiếng", mute: "🔇 Tắt tiếng", shErr: "Không chia sẻ được màn hình: " },
    en: { board: "🖤 Board", can: "✍️ you can use the board", view: "👀 view only", viewmsg: "👀 You are watching — the host must give you permission to draw", perm: "👥 Access", permt: "Give board access", min: "Minimise on my screen", close: "Close the board for everyone", laser: "Laser", pen: "Pen", text: "Text box", color: "Colour", size: "Size", undo: "Undo", redo: "Redo", clearAll: "Clear the whole board", clearMine: "Clear my marks", dock: "🖤 Open board", open: "🖤 Board", qAll: "Clear all drawings and text on the board (for everyone)?", qMine: "Clear all your drawings and text?", who: "Who can use the board (pen, laser, text):", none: "No players yet.", share: "🖥 Share screen", unshare: "⏹ Stop sharing", sharet: "Share your screen with the whole room (like Google Meet) — people with access can still draw/laser on top", sharing: "🖥 You are sharing your screen", nview: "👁 {n} watching", watching: "🖥 {n} is sharing their screen", conn: "🖥 connecting…", fail: "⚠️ Could not connect — the network may be blocking it (TURN needed)", full: "⚠️ 10 viewers already — waiting for a free spot", hostfull: "⚠️ Max 10 viewers — {n} people cannot watch", unmute: "🔊 Turn sound on", mute: "🔇 Mute", shErr: "Could not share the screen: " },
    zh: { board: "🖤 白板", can: "✍️ 你可以使用白板", view: "👀 仅观看", viewmsg: "👀 你正在观看 — 主持人授权后才能使用画笔", perm: "👥 权限", permt: "授权使用白板", min: "在我的屏幕上最小化", close: "为全房间关闭白板", laser: "激光笔", pen: "画笔", text: "文本框", color: "颜色", size: "粗细", undo: "撤销", redo: "重做", clearAll: "清空整个白板", clearMine: "清除我的笔迹", dock: "🖤 打开白板", open: "🖤 白板", qAll: "清除白板上所有笔迹和文字（全房间）？", qMine: "清除你所有的笔迹和文字？", who: "谁可以使用白板（画笔、激光笔、文本框）：", none: "还没有玩家。", share: "🖥 共享屏幕", unshare: "⏹ 停止共享", sharet: "把你的屏幕共享给全房间（像 Google Meet）— 有权限的人仍可在上面画画/用激光笔", sharing: "🖥 你正在共享屏幕", nview: "👁 {n} 人观看", watching: "🖥 {n} 正在共享屏幕", conn: "🖥 正在连接…", fail: "⚠️ 无法连接 — 网络可能被拦截（需要 TURN）", full: "⚠️ 观看人数已满 10 人 — 等待空位", hostfull: "⚠️ 最多 10 人观看 — 还有 {n} 人看不到", unmute: "🔊 打开声音", mute: "🔇 静音", shErr: "无法共享屏幕：" },
    es: { board: "🖤 Pizarra", can: "✍️ puedes usar la pizarra", view: "👀 solo ver", viewmsg: "👀 Estás mirando — el anfitrión debe darte permiso para dibujar", perm: "👥 Permisos", permt: "Dar acceso a la pizarra", min: "Minimizar en mi pantalla", close: "Cerrar la pizarra para todos", laser: "Láser", pen: "Lápiz", text: "Cuadro de texto", color: "Color", size: "Grosor", undo: "Deshacer", redo: "Rehacer", clearAll: "Borrar toda la pizarra", clearMine: "Borrar mis trazos", dock: "🖤 Abrir pizarra", open: "🖤 Pizarra", qAll: "¿Borrar todos los trazos y textos de la pizarra (para todos)?", qMine: "¿Borrar todos tus trazos y textos?", who: "Quién puede usar la pizarra (lápiz, láser, texto):", none: "Aún no hay jugadores.", share: "🖥 Compartir pantalla", unshare: "⏹ Dejar de compartir", sharet: "Comparte tu pantalla con toda la sala (como Google Meet) — quien tenga permiso puede seguir dibujando/usando el láser encima", sharing: "🖥 Estás compartiendo tu pantalla", nview: "👁 {n} mirando", watching: "🖥 {n} está compartiendo su pantalla", conn: "🖥 conectando…", fail: "⚠️ No se pudo conectar — la red puede estar bloqueándolo (hace falta TURN)", full: "⚠️ Ya hay 10 espectadores — esperando un hueco", hostfull: "⚠️ Máximo 10 espectadores — {n} personas no pueden ver", unmute: "🔊 Activar sonido", mute: "🔇 Silenciar", shErr: "No se pudo compartir la pantalla: " }
  };
  function t(k) { var l = api && api.lang ? api.lang() : "vi"; return (TX[l] || TX.vi)[k] || TX.vi[k] || k; }
  function relabel() {
    document.querySelectorAll("[data-bt]").forEach(function (e) { e.textContent = t(e.dataset.bt); });
    document.querySelectorAll("[data-btt]").forEach(function (e) { e.title = t(e.dataset.btt); });
  }
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function me() { return api && api.me ? api.me() : null; }
  function myId() { var m = me(); return m ? m.id : cid; }
  function st() { return api && api.st ? api.st() : null; }
  function canDraw() {
    if (!api) return false;
    if (api.isHost()) return true;
    var s = st(), p = s && s.bperm; return !!(p && me() && p[me().id]);
  }
  function send(m) { var ch = api && api.ch(); if (!ch) return; m.cid = cid; m.pid = myId(); ch.send({ type: "broadcast", event: "board", payload: m }); }
  /* ✍️ ai đang gõ ô chữ nào (kiểu Google Docs, TJ 2026-10-04): mỗi tin "t" đang gõ mang ed=1 + tên; máy khác viền màu người đó
     + nhãn tên trên ô; 4 giây không nghe gì (hoặc ed=0 khi rời ô) thì tắt. Màu cố định theo id người chơi. */
  var answered = {};   /* cid đã có người gửi "full" -> moderator khỏi gửi trùng */
  var typing = {}, PCOL = ["#ff6b5e", "#7cc4ff", "#7be0a1", "#ffd84d", "#ff8fb1", "#c9a0ff", "#ffa94d"];
  function pcol(id) { var h = 0; String(id).split("").forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return PCOL[Math.abs(h) % PCOL.length]; }
  function tmsg(it, ed) { var m = { t: "t", id: it.id, x: it.x, y: it.y, c: it.c, z: it.z, text: it.text }; if (ed != null) { m.ed = ed ? 1 : 0; m.n = me() ? me().name : ""; } return m; }
  setInterval(function () { var ch = false, now = Date.now(); Object.keys(typing).forEach(function (id) { if (now - typing[id].at > 4000) { delete typing[id]; ch = true; } }); if (ch) paintTexts(); }, 1000);
  function uid() { return myId().slice(0, 6) + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  /* ---------- giao diện ---------- */
  function build() {
    if ($("#bd")) return;
    var el = document.createElement("section");
    el.id = "bd"; el.className = "bd"; el.hidden = true;
    el.innerHTML =
      '<div class="bd-head"><b data-bt="board"></b><span class="bd-who" id="bd-who"></span><span class="bd-scr" id="bd-scr"></span>' +
      '<button type="button" class="bd-hb" id="bd-share" hidden data-btt="sharet" data-bt="share"></button>' +   /* 🖥 chia sẻ màn hình (chỉ host, máy tính) */
      '<button type="button" class="bd-hb" id="bd-perm" hidden data-btt="permt" data-bt="perm"></button>' +
      '<button type="button" class="bd-hb" id="bd-min" data-btt="min">▁</button>' +
      '<button type="button" class="bd-hb" id="bd-close" hidden data-btt="close">✕</button></div>' +
      '<div class="bd-stage" id="bd-stage"><video id="bd-video" class="bd-video" autoplay playsinline muted hidden></video><canvas id="bd-cv"></canvas><div class="bd-texts" id="bd-texts"></div><button type="button" class="bd-aud" id="bd-aud" hidden data-bt="unmute"></button></div>' +
      '<div class="bd-tools" id="bd-tools">' +
        '<button type="button" data-tool="laser" data-btt="laser">🔴</button>' +
        '<button type="button" data-tool="pen" data-btt="pen">✏️</button>' +
        '<button type="button" data-tool="text" data-btt="text">T</button>' +
        '<span class="bd-sep"></span>' +
        COLORS.map(function (c) { return '<button type="button" class="bd-col" data-col="' + c + '" style="--c:' + c + '" data-btt="color"></button>'; }).join("") +
        '<span class="bd-sep"></span>' +
        SIZES.map(function (z, i) { return '<button type="button" class="bd-sz" data-sz="' + z + '" data-btt="size"><i style="width:' + (6 + i * 5) + 'px;height:' + (6 + i * 5) + 'px"></i></button>'; }).join("") +
        '<span class="bd-sep"></span>' +
        '<button type="button" id="bd-undo" data-btt="undo">↶</button><button type="button" id="bd-redo" data-btt="redo">↷</button>' +
        '<button type="button" id="bd-clear" hidden>🗑</button>' +
      '</div><div class="bd-permbox" id="bd-permbox" hidden></div>' +   /* danh sách người được cấp quyền nằm DƯỚI hàng nút như HelloTalk (TJ 2026-10-04) */
      '<div class="bd-view" id="bd-view" data-bt="viewmsg"></div>';
    document.body.appendChild(el);
    var dock = document.createElement("button");
    dock.id = "bd-dock"; dock.type = "button"; dock.className = "bd-dock"; dock.hidden = true; dock.dataset.bt = "dock";
    document.body.appendChild(dock);
    cv = $("#bd-cv"); ctx = cv.getContext("2d"); wrap = $("#bd-stage");
    el.addEventListener("click", onClick);
    dock.addEventListener("click", function () { mini = false; paintOpen(); });
    var ob = document.createElement("button");   /* host: mở bảng cho cả phòng */
    ob.id = "bd-open"; ob.type = "button"; ob.className = "bd-dock bd-openbtn"; ob.hidden = true; ob.dataset.bt = "open";
    document.body.appendChild(ob);
    ob.addEventListener("click", function () { api.setBoard(true); });
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    window.addEventListener("resize", fit);
    paintTools();
  }
  function onClick(e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) { tool = b.dataset.tool; paintTools(); return; }
    if (b.dataset.col) { color = b.dataset.col; if (tool === "laser") tool = "pen"; paintTools(); return; }
    if (b.dataset.sz) { size = +b.dataset.sz; paintTools(); return; }
    if (b.id === "bd-undo") return undo();
    if (b.id === "bd-redo") return redoOne();
    if (b.id === "bd-clear") {
      if (api.isHost()) { if (confirm(t("qAll"))) { clearAll(); send({ t: "clear" }); } return; }
      /* người được cấp quyền: sọt rác chỉ xoá nét + ô chữ CỦA MÌNH (TJ 2026-10-04) */
      var me0 = myId(), ids = order.filter(function (id) { return items[id] && items[id].by === me0; });
      if (ids.length && confirm(t("qMine"))) { ids.forEach(function (id) { removeItem(id); send({ t: "del", id: id }); }); mine = []; redo = []; draw(); paintTexts(); paintTools(); }
      return;
    }
    if (b.id === "bd-share") { if (shStream) stopShare(); else startShare(); return; }
    if (b.id === "bd-aud") { var v = $("#bd-video"); v.muted = !v.muted; if (!v.muted) v.play().catch(function () {}); paintShare(); return; }
    if (b.id === "bd-min") { mini = true; paintOpen(); return; }
    if (b.id === "bd-close") { api.setBoard(false); return; }
    if (b.id === "bd-perm") { var pb = $("#bd-permbox"); pb.hidden = !pb.hidden; paintPerm(); paintOpen(); return; }   /* QA v106 L2: cập nhật phần đẩy nội dung xuống */
    if (b.dataset.perm) { api.togglePerm(b.dataset.perm); return; }
  }
  function paintTools() {
    if (!$("#bd")) return;
    var ok = canDraw();
    $("#bd-tools").hidden = !ok; $("#bd-view").hidden = ok;
    document.querySelectorAll("#bd-tools [data-tool]").forEach(function (b) { b.classList.toggle("on", b.dataset.tool === tool); });
    document.querySelectorAll("#bd-tools [data-col]").forEach(function (b) { b.classList.toggle("on", b.dataset.col === color); });
    document.querySelectorAll("#bd-tools [data-sz]").forEach(function (b) { b.classList.toggle("on", +b.dataset.sz === size); });
    $("#bd-clear").hidden = !ok; $("#bd-clear").title = t(api.isHost() ? "clearAll" : "clearMine"); relabel(); $("#bd-close").hidden = !api.isHost(); $("#bd-perm").hidden = !api.isHost();
    cv.style.cursor = !ok ? "default" : tool === "text" ? "text" : "crosshair";
    $("#bd-undo").disabled = !mine.length; $("#bd-redo").disabled = !redo.length;
    paintShare();
  }
  function paintPerm() {
    var box = $("#bd-permbox"); if (!box || box.hidden) return;
    var s = st() || {}, p = s.bperm || {}, all = api.players(), list = all.filter(function (x) { return !api.isHostId(x.id); });
    var hosts = all.filter(function (x) { return api.isHostId(x.id); });
    if (!hosts.length && api.isHost() && me()) hosts = [me()];   /* host làm MC (không chơi) không nằm trong danh sách người chơi */   /* host luôn có quyền: hiện đầu danh sách, không bấm tắt được (TJ 2026-10-04) */
    box.innerHTML = '<div class="bd-ph">' + esc(t("who")) + "</div>" +
      hosts.map(function (x) { return '<span class="bd-pp on bd-phost">👑 ' + esc(x.name || "Host") + " · host</span>"; }).join("") + (list.length ? list.map(function (x) {
      return '<button type="button" class="bd-pp' + (p[x.id] ? " on" : "") + '" data-perm="' + esc(x.id) + '">' + (p[x.id] ? "🛡 " : "👤 ") + esc(x.name || "?") + "</button>"; }).join("") : '<span class="bd-ph">' + esc(t("none")) + "</span>");
  }
  function paintOpen() {
    var el = $("#bd"); if (!el) return;
    el.hidden = !open || mini; $("#bd-dock").hidden = !open || !mini;
    $("#bd-open").hidden = open || !api || !api.isHost() || !api.ch();
    document.body.classList.toggle("bd-on", open && !mini);
    if (open && !mini) { fit(); paintTools(); paintPerm(); }
    document.body.style.paddingTop = open && !mini ? el.offsetHeight + "px" : "";   /* bảng nằm trên cùng, nội dung game đẩy xuống dưới */
  }

  /* ---------- vẽ ---------- */
  function fit() {
    if (!cv || $("#bd").hidden) return;
    var r = cv.getBoundingClientRect(); dpr = window.devicePixelRatio || 1;   /* đo CHÍNH canvas (trong viền gỗ) — QA v106 L1 */
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w !== cv.width || h !== cv.height) { cv.width = w; cv.height = h; draw(); }   /* trạng thái phòng tới vài giây/lần -> chỉ dựng lại khi ĐỔI cỡ (iPhone chớp/mất nét đang vẽ) */
    paintTexts();
  }
  function sx() { return cv.width / W; }
  function toLogic(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function strokePath(s) {
    var p = s.pts; if (!p || !p.length) return;
    var k = sx();
    ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.w * k; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (p.length < 4) { ctx.beginPath(); ctx.arc(p[0] * k, p[1] * k, s.w * k / 2, 0, 7); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(p[0] * k, p[1] * k);
    for (var i = 2; i < p.length - 2; i += 2) { var mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2; ctx.quadraticCurveTo(p[i] * k, p[i + 1] * k, mx * k, my * k); }
    ctx.lineTo(p[p.length - 2] * k, p[p.length - 1] * k); ctx.stroke();
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    order.forEach(function (id) { var it = items[id]; if (it && it.k === "s") strokePath(it); });
    if (cur) strokePath(cur);
    var now = Date.now(), k = sx(), any = false;
    Object.keys(lasers).forEach(function (pid) {
      var L = lasers[pid]; L.pts = L.pts.filter(function (q) { return now - q.t < 600; });
      if (!L.pts.length) { delete lasers[pid]; return; }
      any = true;
      for (var i = 1; i < L.pts.length; i++) {
        var a = L.pts[i - 1], b = L.pts[i], al = Math.max(0, 1 - (now - b.t) / 600);
        ctx.strokeStyle = "rgba(255,60,60," + (al * 0.6).toFixed(2) + ")"; ctx.lineWidth = 6 * k * al + 1; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(a.x * k, a.y * k); ctx.lineTo(b.x * k, b.y * k); ctx.stroke();
      }
      var h = L.pts[L.pts.length - 1];
      ctx.fillStyle = "rgba(255,40,40,.95)"; ctx.shadowColor = "rgba(255,60,60,.9)"; ctx.shadowBlur = 14 * k;
      ctx.beginPath(); ctx.arc(h.x * k, h.y * k, 9 * k, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (L.name) { ctx.font = (22 * k) + "px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(L.name, h.x * k + 14 * k, h.y * k - 12 * k); }
    });
    if (any && !raf) raf = requestAnimationFrame(function () { raf = 0; draw(); });
  }
  function down(e) {
    if (!canDraw() || e.button > 0) return;
    var p = toLogic(e);
    if (tool === "text") { e.preventDefault(); return newText(p); }
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    if (tool === "laser") { cur = { laser: true }; laserAt(p); return; }
    cur = { k: "s", id: uid(), c: color, w: size, pts: [Math.round(p.x), Math.round(p.y)], by: myId() };
    sendT = Date.now(); cur.sent = cur.pts.length; send({ t: "s", id: cur.id, c: cur.c, w: cur.w, from: 0, pts: cur.pts.slice(), done: false });
    draw();
  }
  function move(e) {
    if (!cur) return;
    var p = toLogic(e);
    if (cur.laser) return laserAt(p);
    var n = cur.pts.length, lx = cur.pts[n - 2], ly = cur.pts[n - 1];
    if (Math.abs(p.x - lx) + Math.abs(p.y - ly) < 2) return;
    cur.pts.push(Math.round(p.x), Math.round(p.y)); draw();
    if (Date.now() - sendT > 80) { sendT = Date.now(); var f = cur.sent; cur.sent = cur.pts.length; send({ t: "s", id: cur.id, c: cur.c, w: cur.w, from: f, pts: cur.pts.slice(f), done: false }); }   /* ~12 lần/giây, CHỈ gửi phần mới (trước gửi lại cả nét mỗi lần -> tin to dần, kênh dễ nghẽn) */
  }
  function up() {
    if (!cur) return;
    if (cur.laser) { cur = null; return; }
    var s = cur; cur = null; delete s.sent;
    items[s.id] = s; order.push(s.id); mine.push(s.id); redo = [];
    send({ t: "s", id: s.id, c: s.c, w: s.w, pts: s.pts, done: true });
    draw(); paintTools();
  }
  function laserAt(p) {
    var name = me() ? me().name : "";
    var L = lasers[myId()] = lasers[myId()] || { pts: [], name: name }; L.pts.push({ x: p.x, y: p.y, t: Date.now() }); draw();
    var msg = { t: "l", x: Math.round(p.x), y: Math.round(p.y), n: name };
    clearTimeout(laserTail);
    if (Date.now() - lastLaserSend > 80) { lastLaserSend = Date.now(); send(msg); }
    else laserTail = setTimeout(function () { lastLaserSend = Date.now(); send(msg); }, 90); // gửi bù vị trí cuối khi dừng tay
  }

  /* ---------- ô chữ ---------- */
  function newText(p) {
    var t = { k: "t", id: uid(), x: Math.round(p.x), y: Math.round(p.y), c: color === COLORS[0] ? COLORS[1] : color, z: size >= 16 ? 44 : size >= 8 ? 34 : 26, text: "", by: myId() };
    items[t.id] = t; order.push(t.id); mine.push(t.id); redo = [];
    paintTexts(); editText(t.id); paintTools();
  }
  function paintTexts() {
    var box = $("#bd-texts"); if (!box || !cv) return;
    var r = cv.getBoundingClientRect(), k = r.width / W, ky = r.height / H;
    var have = {};
    order.forEach(function (id) {
      var it = items[id]; if (!it || it.k !== "t") return; have[id] = 1;
      var d = box.querySelector('[data-id="' + id + '"]');
      if (!d) { d = document.createElement("div"); d.className = "bd-tx"; d.dataset.id = id; box.appendChild(d); }
      d.style.left = (it.x * k) + "px"; d.style.top = (it.y * ky) + "px"; d.style.color = it.c; d.style.fontSize = (it.z * k) + "px";
      if (editing !== id) d.textContent = it.text || "…";
      d.classList.toggle("empty", !it.text);
      var w = typing[id];
      d.classList.toggle("remote", !!w); d.dataset.who = w ? "✍️ " + w.name : "";
      if (w) d.style.setProperty("--who", w.col);
    });
    box.querySelectorAll(".bd-tx").forEach(function (d) { if (!have[d.dataset.id]) d.remove(); });
  }
  function editText(id) {
    var d = $('#bd-texts [data-id="' + id + '"]'); if (!d || !canDraw()) return;
    editing = id; d.contentEditable = "true"; d.classList.add("edit"); if (items[id].text) send(tmsg(items[id], true)); if (!items[id].text) d.textContent = "";
    d.focus();
    var sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(d); rg.collapse(false); sel.removeAllRanges(); sel.addRange(rg);
  }
  var textT = 0, textLast = 0;
  document.addEventListener("input", function (e) {
    var d = e.target.closest && e.target.closest(".bd-tx"); if (!d || !items[d.dataset.id]) return;
    items[d.dataset.id].text = d.innerText.replace(/\n+$/, "");
    var id = d.dataset.id, flush = function () { var it = items[id]; textLast = Date.now(); if (it) send(tmsg(it, true)); };
    clearTimeout(textT);
    if (Date.now() - textLast > 250) flush(); else textT = setTimeout(flush, 250);   /* gõ tới đâu cả phòng thấy tới đó (gửi đều ~4 lần/giây, QA v106 L3) */
  });
  document.addEventListener("focusout", function (e) {
    var d = e.target.closest && e.target.closest(".bd-tx"); if (!d) return;
    d.contentEditable = "false"; d.classList.remove("edit"); editing = null;
    var it = items[d.dataset.id]; if (!it) return;
    if (!it.text.trim()) { removeItem(it.id); send({ t: "del", id: it.id }); mine = mine.filter(function (x) { return x !== it.id; }); }
    else send(tmsg(it, false));
    paintTexts(); paintTools();
  });
  document.addEventListener("click", function (e) {   /* chạm lại ô chữ để sửa / gõ tiếp (ai có quyền cũng sửa được) */
    var d = e.target.closest && e.target.closest(".bd-tx"); if (!d || editing === d.dataset.id || !canDraw() || tool === "laser") return;
    editText(d.dataset.id);
  });

  /* ---------- hoàn tác / xoá ---------- */
  function removeItem(id) { delete items[id]; order = order.filter(function (x) { return x !== id; }); }
  function undo() {
    var id = mine.pop(); if (!id) return;
    var it = items[id]; if (it) redo.push(it);
    removeItem(id); send({ t: "del", id: id }); draw(); paintTexts(); paintTools();
  }
  function redoOne() {
    var it = redo.pop(); if (!it) return;
    items[it.id] = it; order.push(it.id); mine.push(it.id);
    send(it.k === "s" ? { t: "s", id: it.id, c: it.c, w: it.w, pts: it.pts, done: true } : { t: "t", id: it.id, x: it.x, y: it.y, c: it.c, z: it.z, text: it.text });
    draw(); paintTexts(); paintTools();
  }
  function clearAll() { items = {}; order = []; mine = []; redo = []; lasers = {}; draw(); paintTexts(); paintTools(); }

  /* ---------- nhận tin ---------- */
  function onMsg(m) {
    if (!m || m.cid === cid) return;
    if (m.t === "s") {
      var it = items[m.id] || (items[m.id] = { k: "s", id: m.id, by: m.pid });
      it.c = m.c; it.w = m.w;
      it.pts = m.from > 0 && !m.done ? (it.pts || []).slice(0, m.from).concat(m.pts) : m.pts;   /* phần nối tiếp; tin cuối (done) mang cả nét -> sửa nếu lỡ rớt 1 phần */
      if (order.indexOf(m.id) < 0) order.push(m.id);
      draw();
    } else if (m.t === "t") {
      var t = items[m.id] || (items[m.id] = { k: "t", id: m.id, by: m.pid });
      t.x = m.x; t.y = m.y; t.c = m.c; t.z = m.z; t.text = m.text; if (order.indexOf(m.id) < 0) order.push(m.id);
      if (m.ed === 1) typing[m.id] = { name: m.n || "", col: pcol(m.pid), at: Date.now() }; else if (m.ed === 0) delete typing[m.id];
      paintTexts();
    } else if (m.t === "del") { removeItem(m.id); draw(); paintTexts(); }
    else if (m.t === "clear") clearAll();
    else if (m.t === "l") { var L = lasers[m.pid] = lasers[m.pid] || { pts: [] }; L.name = m.n; L.pts.push({ x: m.x, y: m.y, t: Date.now() }); draw(); }
    /* xin bản đầy đủ: host trả lời ngay; HOST VẮNG (mất mạng) thì người được cấp quyền (moderator) có nét trên bảng trả lời thay
       (chờ ngẫu nhiên 0.3–1s, ai đã thấy người khác trả lời thì thôi) — TJ 2026-10-04: "host mất mạng mà có moderator thì bảng vẫn ổn" */
    else if (m.t === "hello") {
      var full = function () { send({ t: "full", to: m.cid, items: order.map(function (id) { return items[id]; }).filter(Boolean) }); };
      if (api.isHost()) { full(); if (shStream) announce(); }   /* máy vừa mở bảng -> báo ngay đang chia sẻ màn hình (khỏi chờ 5 giây) */
      else if (order.length) { answered[m.cid] = 0; setTimeout(function () { if (!answered[m.cid]) full(); delete answered[m.cid]; }, (canDraw() ? 300 : 1200) + Math.random() * 700); }   /* moderator trả lời trước, người xem làm dự phòng */
    }
    else if (m.t === "full") {
      answered[m.to] = 1;
      if (m.to !== cid) return;
      (m.items || []).forEach(function (it) { if (!items[it.id]) { items[it.id] = it; order.push(it.id); } });   /* GỘP (không xoá): host vừa tải lại vẫn giữ nét đang có */
      draw(); paintTexts();
    }
  }
  function onState(s) {
    if (!s) return;
    var want = !!s.board;
    if (want && !open) { open = true; mini = false; build(); paintOpen(); if (!api.isHost() || !order.length) send({ t: "hello" }); }   /* host tải lại trang (bảng trống) cũng xin lại nét từ moderator/người chơi */
    else if (!want && open) { open = false; paintOpen(); if (shStream) stopShare(); }   /* host đóng bảng = dừng chia sẻ màn hình */
    paintOpen();
    if (open) { paintTools(); paintPerm(); var who = $("#bd-who"); if (who) who.textContent = t(canDraw() ? "can" : "view"); }
  }
  /* ---------- 🖥 CHIA SẺ MÀN HÌNH (TJ 2026-10-04: trang TRẢ PHÍ chỉ tài khoản TJ mở được -> chia sẻ cho cả phòng như Google Meet) ----------
     · Chỉ host, chỉ trình duyệt máy tính có getDisplayMedia (điện thoại không có -> ẩn nút).
     · WebRTC dạng LƯỚI (mesh): host mở 1 RTCPeerConnection cho MỖI người xem (tối đa MAXV=10, mỗi luồng ~1.2 Mbps).
       Báo hiệu qua kênh phòng sẵn có, broadcast event "rtc" (tin mang cid máy gửi + to = cid máy nhận):
       host báo share-on (lặp lại 5 giây/lần + trả lời ngay khi có máy "hello" mở bảng) -> máy chưa nối gửi want -> host offer
       -> người xem answer -> trao ICE 2 chiều. Host dừng (nút / nút "Dừng chia sẻ" của trình duyệt) -> share-off, đóng hết kết nối.
     · Video nằm DƯỚI canvas (canvas trong suốt) -> laser/bút/ô chữ của người được cấp quyền vẽ đè lên màn hình đang chia sẻ.
     · Chỉ STUN Google; TURN tuỳ chọn qua window.APP_CONFIG.TURN (mảng RTCIceServer) — KHÔNG để mật khẩu TURN trong repo.
       Không có TURN thì mạng chặn chặt (công ty, China…) có thể không nối được -> hiện lỗi "cần TURN". */
  var MAXV = 10, BITRATE = 1200000;
  var canShare = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.RTCPeerConnection);
  var shStream = null, shAnn = 0, peers = {}, shFull = {};   /* host: cid người xem -> {pc, q, bad}; shFull = máy bị từ chối vì đủ 10 */
  var rv = null, rvHost = null, rvName = "", rvLastOn = 0, rvRetryAt = 0, rvErr = "";   /* người xem: rv = {host, pc, q, ok, at, dis, stream, pend} */
  function iceServers() {
    var s = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }], c = window.APP_CONFIG;
    if (c && Array.isArray(c.TURN)) s = s.concat(c.TURN);
    return s;
  }
  function rtc(m) { var ch = api && api.ch(); if (!ch) return; m.cid = cid; m.pid = myId(); ch.send({ type: "broadcast", event: "rtc", payload: m }); }
  function chain(o, f) { o.q = o.q.then(f).catch(function (e) { console.warn("[board rtc]", e); }); }   /* xếp hàng thao tác SDP/ICE của 1 kết nối -> ICE tới sớm không lỗi */
  function cand(c) { return c.toJSON ? c.toJSON() : { candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }; }
  function desc(d) { return { type: d.type, sdp: d.sdp }; }
  function announce() { if (shStream) rtc({ t: "share-on", n: me() ? me().name : "" }); }
  function showVideo(stream, local) {
    var v = $("#bd-video"); if (!v) return;
    if (v.srcObject !== (stream || null)) v.srcObject = stream || null;
    v.hidden = !stream; if (local || !stream) v.muted = true;   /* tự phát cần muted; người xem bấm 🔊 Bật tiếng */
    if (stream) v.play().catch(function () {});
    $("#bd-stage").classList.toggle("bd-screen", !!stream);
    paintShare();
  }

  /* host */
  function startShare() {
    if (!canShare || !api || !api.isHost() || shStream) return;
    var gdm = function (a) { return navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 24 } }, audio: a }); };
    gdm(true).catch(function (e) { if (e && (e.name === "NotAllowedError" || e.name === "AbortError")) throw e; return gdm(false); })   /* trình duyệt không cho kèm tiếng -> chỉ hình */
      .then(function (s) {
        shStream = s; shFull = {};
        s.getVideoTracks().forEach(function (tr) { try { tr.contentHint = "detail"; } catch (e) {} tr.onended = stopShare; });   /* chữ trang web rõ hơn; bấm "Dừng chia sẻ" của trình duyệt */
        if (!open) api.setBoard(true);   /* bảng chưa mở cho phòng -> mở luôn (màn hình chia sẻ nằm trong bảng) */
        mini = false; paintOpen();
        showVideo(s, true); announce();
        clearInterval(shAnn); shAnn = setInterval(announce, 5000);   /* máy vào sau / lỡ tin -> 5 giây sau tự xin nối */
      }, function (e) { if (e && e.name !== "NotAllowedError" && e.name !== "AbortError") alert(t("shErr") + (e.message || e.name)); });
  }
  function stopShare() {
    if (!shStream) return;
    var s = shStream; shStream = null; clearInterval(shAnn);
    s.getTracks().forEach(function (tr) { tr.onended = null; tr.stop(); });
    Object.keys(peers).forEach(dropPeer); shFull = {};
    rtc({ t: "share-off" }); showVideo(null);
  }
  function dropPeer(vc) { var p = peers[vc]; if (!p) return; delete peers[vc]; clearTimeout(p.bad); try { p.pc.close(); } catch (e) {} paintShare(); }
  function capRate(pc) {   /* giới hạn ~1.2 Mbps/người xem -> mesh 10 người ~12 Mbps tải lên */
    pc.getSenders().forEach(function (sd) {
      if (!sd.track || sd.track.kind !== "video" || !sd.getParameters || !sd.setParameters) return;
      try { var pr = sd.getParameters(); if (!pr.encodings || !pr.encodings.length) pr.encodings = [{}]; pr.encodings[0].maxBitrate = BITRATE; sd.setParameters(pr).catch(function () {}); } catch (e) {}
    });
  }
  function hostPeer(vc) {
    if (peers[vc]) dropPeer(vc);   /* người xem xin lại (kết nối cũ hỏng) -> dựng mới */
    delete shFull[vc];
    var pc = new RTCPeerConnection({ iceServers: iceServers() }), p = peers[vc] = { pc: pc, q: Promise.resolve(), bad: 0, ok: false, at: Date.now() };
    shStream.getTracks().forEach(function (tr) { pc.addTrack(tr, shStream); });
    pc.onicecandidate = function (e) { if (e.candidate) rtc({ t: "ice", to: vc, c: cand(e.candidate) }); };
    pc.onconnectionstatechange = function () {
      if (peers[vc] !== p) return;
      var s = pc.connectionState;
      if (s === "connected") { clearTimeout(p.bad); p.bad = 0; p.ok = true; }
      else if ((s === "failed" || s === "disconnected") && !p.bad) p.bad = setTimeout(function () { if (peers[vc] === p) dropPeer(vc); }, 15000);   /* người xem rời phòng / mất mạng 15 giây -> đóng */
      else if (s === "closed") dropPeer(vc);
      paintShare();
    };
    chain(p, function () { return pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { rtc({ t: "offer", to: vc, sdp: desc(pc.localDescription) }); }); });
    paintShare();
  }

  /* người xem */
  function rvClose(err) {
    var o = rv; rv = null;
    if (o && o.pc) try { o.pc.close(); } catch (e) {}
    rvErr = err || ""; if (err) rvRetryAt = Date.now() + 15000;   /* lỗi / đủ chỗ -> 15 giây sau mới thử lại */
    showVideo(null);
  }
  function rvWant() {
    if (rv && rv.pc) try { rv.pc.close(); } catch (e) {}
    rv = { host: rvHost, pc: null, q: Promise.resolve(), ok: false, at: Date.now(), dis: 0, stream: null, pend: [] };
    rvErr = ""; rtc({ t: "want", to: rvHost }); paintShare();
  }
  function rvOffer(m) {
    if (!rv || m.cid !== rv.host) return;
    if (rv.pc) try { rv.pc.close(); } catch (e) {}
    var o = rv, pc = o.pc = new RTCPeerConnection({ iceServers: iceServers() });
    o.q = Promise.resolve(); o.at = Date.now();
    pc.ontrack = function (e) {
      if (rv !== o) return;
      var ms = (e.streams && e.streams[0]) || o.stream || new MediaStream();
      if (ms.getTracks().indexOf(e.track) < 0) ms.addTrack(e.track);
      o.stream = ms; showVideo(ms);
    };
    pc.onicecandidate = function (e) { if (e.candidate && rv === o) rtc({ t: "ice", to: o.host, c: cand(e.candidate) }); };
    pc.onconnectionstatechange = function () {
      if (rv !== o) return;
      var s = pc.connectionState;
      if (s === "connected") { o.ok = true; o.dis = 0; rvErr = ""; }
      else if (s === "disconnected") o.dis = o.dis || Date.now();
      else if (s === "failed") return rvClose("fail");
      paintShare();
    };
    chain(o, function () {
      return pc.setRemoteDescription(m.sdp).then(function () { return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); })
        .then(function () { rtc({ t: "answer", to: o.host, sdp: desc(pc.localDescription) }); var pd = o.pend; o.pend = []; return Promise.all(pd.map(function (c) { return pc.addIceCandidate(c).catch(function () {}); })); });
    });
    paintShare();
  }
  setInterval(function () {   /* canh: nối mãi không xong / rớt lâu / host biến mất không kịp báo */
    var now = Date.now();
    if (rv) {
      if (!rv.ok && now - rv.at > 20000) rvClose("fail");
      else if (rv.dis && now - rv.dis > 15000) rvClose(now - rvLastOn < 12000 ? "fail" : "");
    } else if (rvHost && now - rvLastOn > 16000) { rvHost = null; rvErr = ""; paintShare(); }
    Object.keys(peers).forEach(function (vc) { var p = peers[vc]; if (!p.ok && now - p.at > 30000) dropPeer(vc); });   /* host: 30 giây chưa nối được -> trả chỗ (tối đa 10) */
  }, 2000);
  window.addEventListener("pagehide", function () { if (shStream) rtc({ t: "share-off" }); else if (rv) rtc({ t: "bye", to: rv.host }); });

  function onRtc(m) {
    if (!m || !api || m.cid === cid || (m.to && m.to !== cid)) return;
    var p = peers[m.cid];
    if (m.t === "share-on") {
      if (shStream) return;
      rvLastOn = Date.now(); rvName = m.n || "";
      if (rv && rv.host !== m.cid) rvClose();   /* host tải lại trang / đổi máy */
      rvHost = m.cid;
      if (!rv && open && Date.now() >= rvRetryAt) rvWant();
      paintShare();
    } else if (m.t === "share-off") {
      if (m.cid !== rvHost) return;
      rvClose(); rvHost = null; rvErr = ""; rvRetryAt = 0; paintShare();
    } else if (m.t === "want") {
      if (!shStream) return;
      if (!p && Object.keys(peers).length >= MAXV) { shFull[m.cid] = 1; rtc({ t: "full", to: m.cid }); paintShare(); return; }
      hostPeer(m.cid);
    } else if (m.t === "answer") {
      if (p) chain(p, function () { return p.pc.setRemoteDescription(m.sdp).then(function () { capRate(p.pc); }); });
    } else if (m.t === "bye") {
      if (p) dropPeer(m.cid); delete shFull[m.cid]; paintShare();
    } else if (m.t === "offer") rvOffer(m);
    else if (m.t === "full") { if (rv && rv.host === m.cid) rvClose("full"); }
    else if (m.t === "ice" && m.c) {
      if (p) chain(p, function () { return p.pc.addIceCandidate(m.c); });
      else if (rv && rv.host === m.cid) { if (rv.pc) { var o = rv; chain(o, function () { return o.pc.addIceCandidate(m.c); }); } else rv.pend.push(m.c); }
    }
  }
  function paintShare() {
    var b = $("#bd-share"); if (!b || !api) return;
    b.hidden = !api.isHost() || !canShare;
    b.dataset.bt = shStream ? "unshare" : "share"; b.textContent = t(b.dataset.bt); b.classList.toggle("on", !!shStream);
    var line = "";
    if (shStream) {
      var nc = Object.keys(peers).filter(function (k) { return peers[k].pc.connectionState === "connected"; }).length, nf = Object.keys(shFull).length;
      line = t("sharing") + " · " + t("nview").replace("{n}", nc) + (nf ? " · " + t("hostfull").replace("{n}", nf) : "");
    } else if (rvErr) line = t(rvErr);
    else if (rv) line = rv.ok ? t("watching").replace("{n}", rvName || "Host") : t("conn");
    var sc = $("#bd-scr"); sc.textContent = line; sc.classList.toggle("err", !shStream && !!rvErr);
    var a = $("#bd-aud"), v = $("#bd-video"), au = !shStream && rv && rv.stream && rv.stream.getAudioTracks().length;
    a.hidden = !au; if (au) { a.dataset.bt = v.muted ? "unmute" : "mute"; a.textContent = t(a.dataset.bt); }
  }

  window.Board = {
    attach: function (a) { api = a; build(); },
    onMsg: onMsg, onState: onState, onRtc: onRtc,
    resync: function () { if (open) setTimeout(function () { send({ t: "hello" }); }, 400); },
    isOpen: function () { return open; }
  };
})();
