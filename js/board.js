/* board.js — 🖤 BẢNG VẼ CHUNG của phòng game (TJ 2026-10-04, bước 1: nền bảng vẽ).
   · Bảng đen tỉ lệ CỐ ĐỊNH 16:9 (toạ độ logic 1600×900) rồi co giãn theo màn hình -> nét vẽ khớp trên mọi máy.
   · Công cụ: 🔴 laser (chấm đỏ + vệt ngắn tự mờ, không để lại nét) · ✏️ bút (màu phấn, 3 cỡ) · T ô chữ (tạo nhiều ô,
     chạm lại để sửa / gõ tiếp) · ↶ hoàn tác / ↷ làm lại (nét của CHÍNH mình) · 🗑 xoá bảng (chỉ host).
   · Quyền: chỉ host + người host cấp quyền (st.bperm) mới dùng công cụ; người khác CHỈ XEM.
   · Đồng bộ qua kênh realtime sẵn có của phòng (broadcast event "board"); host giữ bản đầy đủ, máy vào sau xin "hello"
     thì host gửi lại toàn bộ. Không lưu vào DB (lưu phiên bản buổi học = bước sau).
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
  function uid() { return myId().slice(0, 6) + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  /* ---------- giao diện ---------- */
  function build() {
    if ($("#bd")) return;
    var el = document.createElement("section");
    el.id = "bd"; el.className = "bd"; el.hidden = true;
    el.innerHTML =
      '<div class="bd-head"><b>🖤 Bảng</b><span class="bd-who" id="bd-who"></span>' +
      '<button type="button" class="bd-hb" id="bd-perm" hidden title="Cấp quyền dùng bảng">👥 Quyền</button>' +
      '<button type="button" class="bd-hb" id="bd-min" title="Thu nhỏ trên máy mình">▁</button>' +
      '<button type="button" class="bd-hb" id="bd-close" hidden title="Đóng bảng cho cả phòng">✕</button></div>' +
      '<div class="bd-permbox" id="bd-permbox" hidden></div>' +
      '<div class="bd-stage" id="bd-stage"><canvas id="bd-cv"></canvas><div class="bd-texts" id="bd-texts"></div></div>' +
      '<div class="bd-tools" id="bd-tools">' +
        '<button type="button" data-tool="laser" title="Laser pointer">🔴</button>' +
        '<button type="button" data-tool="pen" title="Bút vẽ">✏️</button>' +
        '<button type="button" data-tool="text" title="Ô chữ">T</button>' +
        '<span class="bd-sep"></span>' +
        COLORS.map(function (c) { return '<button type="button" class="bd-col" data-col="' + c + '" style="--c:' + c + '" title="Màu"></button>'; }).join("") +
        '<span class="bd-sep"></span>' +
        SIZES.map(function (z, i) { return '<button type="button" class="bd-sz" data-sz="' + z + '" title="Cỡ nét"><i style="width:' + (6 + i * 5) + 'px;height:' + (6 + i * 5) + 'px"></i></button>'; }).join("") +
        '<span class="bd-sep"></span>' +
        '<button type="button" id="bd-undo" title="Hoàn tác">↶</button><button type="button" id="bd-redo" title="Làm lại">↷</button>' +
        '<button type="button" id="bd-clear" hidden title="Xoá cả bảng">🗑</button>' +
      '</div><div class="bd-view" id="bd-view">👀 Bạn đang xem — host cấp quyền thì mới dùng được bút</div>';
    document.body.appendChild(el);
    var dock = document.createElement("button");
    dock.id = "bd-dock"; dock.type = "button"; dock.className = "bd-dock"; dock.hidden = true; dock.textContent = "🖤 Mở bảng";
    document.body.appendChild(dock);
    cv = $("#bd-cv"); ctx = cv.getContext("2d"); wrap = $("#bd-stage");
    el.addEventListener("click", onClick);
    dock.addEventListener("click", function () { mini = false; paintOpen(); });
    var ob = document.createElement("button");   /* host: mở bảng cho cả phòng */
    ob.id = "bd-open"; ob.type = "button"; ob.className = "bd-dock bd-openbtn"; ob.hidden = true; ob.textContent = "🖤 Bảng";
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
    if (b.id === "bd-clear") { if (api.isHost() && confirm("Xoá hết nét vẽ và ô chữ trên bảng?")) { clearAll(); send({ t: "clear" }); } return; }
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
    $("#bd-clear").hidden = !api.isHost(); $("#bd-close").hidden = !api.isHost(); $("#bd-perm").hidden = !api.isHost();
    cv.style.cursor = !ok ? "default" : tool === "text" ? "text" : "crosshair";
    $("#bd-undo").disabled = !mine.length; $("#bd-redo").disabled = !redo.length;
  }
  function paintPerm() {
    var box = $("#bd-permbox"); if (!box || box.hidden) return;
    var s = st() || {}, p = s.bperm || {}, list = api.players().filter(function (x) { return !api.isHostId(x.id); });
    box.innerHTML = '<div class="bd-ph">Ai được dùng bảng (bút, laser, ô chữ):</div>' + (list.length ? list.map(function (x) {
      return '<button type="button" class="bd-pp' + (p[x.id] ? " on" : "") + '" data-perm="' + esc(x.id) + '">' + (p[x.id] ? "🛡 " : "👤 ") + esc(x.name || "?") + "</button>"; }).join("") : '<span class="bd-ph">Chưa có người chơi nào.</span>');
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
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    draw(); paintTexts();
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
    sendT = Date.now(); send({ t: "s", id: cur.id, c: cur.c, w: cur.w, pts: cur.pts.slice(), done: false });
    draw();
  }
  function move(e) {
    if (!cur) return;
    var p = toLogic(e);
    if (cur.laser) return laserAt(p);
    var n = cur.pts.length, lx = cur.pts[n - 2], ly = cur.pts[n - 1];
    if (Math.abs(p.x - lx) + Math.abs(p.y - ly) < 2) return;
    cur.pts.push(Math.round(p.x), Math.round(p.y)); draw();
    if (Date.now() - sendT > 60) { sendT = Date.now(); send({ t: "s", id: cur.id, c: cur.c, w: cur.w, pts: cur.pts.slice(), done: false }); }   /* gom ~16 lần/giây */
  }
  function up() {
    if (!cur) return;
    if (cur.laser) { cur = null; return; }
    var s = cur; cur = null;
    items[s.id] = s; order.push(s.id); mine.push(s.id); redo = [];
    send({ t: "s", id: s.id, c: s.c, w: s.w, pts: s.pts, done: true });
    draw(); paintTools();
  }
  function laserAt(p) {
    var name = me() ? me().name : "";
    var L = lasers[myId()] = lasers[myId()] || { pts: [], name: name }; L.pts.push({ x: p.x, y: p.y, t: Date.now() }); draw();
    var msg = { t: "l", x: Math.round(p.x), y: Math.round(p.y), n: name };
    clearTimeout(laserTail);
    if (Date.now() - lastLaserSend > 50) { lastLaserSend = Date.now(); send(msg); }
    else laserTail = setTimeout(function () { lastLaserSend = Date.now(); send(msg); }, 60); // gửi bù vị trí cuối khi dừng tay
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
    });
    box.querySelectorAll(".bd-tx").forEach(function (d) { if (!have[d.dataset.id]) d.remove(); });
  }
  function editText(id) {
    var d = $('#bd-texts [data-id="' + id + '"]'); if (!d || !canDraw()) return;
    editing = id; d.contentEditable = "true"; d.classList.add("edit"); if (!items[id].text) d.textContent = "";
    d.focus();
    var sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(d); rg.collapse(false); sel.removeAllRanges(); sel.addRange(rg);
  }
  var textT = 0, textLast = 0;
  document.addEventListener("input", function (e) {
    var d = e.target.closest && e.target.closest(".bd-tx"); if (!d || !items[d.dataset.id]) return;
    items[d.dataset.id].text = d.innerText.replace(/\n+$/, "");
    var id = d.dataset.id, flush = function () { var it = items[id]; textLast = Date.now(); if (it) send({ t: "t", id: it.id, x: it.x, y: it.y, c: it.c, z: it.z, text: it.text }); };
    clearTimeout(textT);
    if (Date.now() - textLast > 250) flush(); else textT = setTimeout(flush, 250);   /* gõ tới đâu cả phòng thấy tới đó (gửi đều ~4 lần/giây, QA v106 L3) */
  });
  document.addEventListener("focusout", function (e) {
    var d = e.target.closest && e.target.closest(".bd-tx"); if (!d) return;
    d.contentEditable = "false"; d.classList.remove("edit"); editing = null;
    var it = items[d.dataset.id]; if (!it) return;
    if (!it.text.trim()) { removeItem(it.id); send({ t: "del", id: it.id }); mine = mine.filter(function (x) { return x !== it.id; }); }
    else send({ t: "t", id: it.id, x: it.x, y: it.y, c: it.c, z: it.z, text: it.text });
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
      it.c = m.c; it.w = m.w; it.pts = m.pts; if (order.indexOf(m.id) < 0) order.push(m.id);
      draw();
    } else if (m.t === "t") {
      var t = items[m.id] || (items[m.id] = { k: "t", id: m.id, by: m.pid });
      t.x = m.x; t.y = m.y; t.c = m.c; t.z = m.z; t.text = m.text; if (order.indexOf(m.id) < 0) order.push(m.id);
      paintTexts();
    } else if (m.t === "del") { removeItem(m.id); draw(); paintTexts(); }
    else if (m.t === "clear") clearAll();
    else if (m.t === "l") { var L = lasers[m.pid] = lasers[m.pid] || { pts: [] }; L.name = m.n; L.pts.push({ x: m.x, y: m.y, t: Date.now() }); draw(); }
    else if (m.t === "hello" && api.isHost()) send({ t: "full", to: m.cid, items: order.map(function (id) { return items[id]; }).filter(Boolean) });
    else if (m.t === "full" && m.to === cid) {
      items = {}; order = [];
      (m.items || []).forEach(function (it) { items[it.id] = it; order.push(it.id); });
      draw(); paintTexts();
    }
  }
  function onState(s) {
    if (!s) return;
    var want = !!s.board;
    if (want && !open) { open = true; mini = false; build(); paintOpen(); if (!api.isHost()) send({ t: "hello" }); }
    else if (!want && open) { open = false; paintOpen(); }
    paintOpen();
    if (open) { paintTools(); paintPerm(); var who = $("#bd-who"); if (who) who.textContent = canDraw() ? "✍️ bạn được dùng bảng" : "👀 chỉ xem"; }
  }
  window.Board = {
    attach: function (a) { api = a; build(); },
    onMsg: onMsg, onState: onState,
    isOpen: function () { return open; }
  };
})();
