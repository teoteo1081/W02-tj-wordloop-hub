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
  var W = 1600, H = 900, AR = 16 / 9;   /* H đổi theo tỉ lệ tài liệu đang mở (PDF dọc, bài đọc 3:4…) — mọi máy cùng tỉ lệ nên nét vẽ khớp */
  var COLORS = ["#f5f4ef", "#ffd84d", "#ff8fb1", "#7cc4ff", "#7be0a1", "#ff6b5e"];
  var SIZES = [4, 8, 16];
  var api = null, open = false, mini = false, tool = "hand", color = COLORS[0], size = SIZES[1];
  var items = {}, order = [];          /* id -> {k:"s"|"t", ...}; order = thứ tự vẽ */
  var mine = [], redo = [];            /* id nét/ô chữ của mình để hoàn tác */
  var lasers = {};                     /* pid -> {pts:[{x,y,t}], name, at} */
  var ZMIN = 0.5, Z = { s: 1, x: 0, y: 0 }, big = false, bigPref = null, curQ = 1, ptrs = {}, gest = null, lastTap = 0, zT = 0;   /* 🔍 phóng to/kéo bằng tay: riêng từng máy */
  var cv, ctx, wrap, dpr = 1, cur = null, sendT = 0, lastLaserSend = 0, laserTail = 0, raf = 0, editing = null, bg = null, bgDirty = true;
  var cid = Math.random().toString(36).slice(2, 9);   /* mã máy này — bỏ qua tin của chính mình (kênh bật self) */

  /* chữ trên bảng theo NGÔN NGỮ GIAO DIỆN của người xem (TJ 2026-10-04: chọn 中文 mà bảng vẫn tiếng Việt) — game.js truyền api.lang() */
  var TX = {
    vi: { lib_root: "gốc", hand: "Di chuyển / phóng to bằng tay (không vẽ)", zout: "Chữ nhỏ lại", zin: "Chữ to lên", zfit: "Vừa khung", big: "Bảng to / nhỏ", lib_vt: "Bảng từ vựng", lib_pick: "Chọn bài trong cây thư mục", lib_find: "Tìm Block…", lib_dest: "Cất vào thư mục", lib_cur: "Thư mục hiện tại", lib_mk: "➕ Tạo thư mục mới…", lib_mkn: "Tên thư mục mới", lib_go: "Tải lên", lib_no: "Huỷ", lib_mv: "Chuyển", lib_mvt: "Chuyển file này vào thư mục", lib_trash: "Đã chuyển vào Thùng rác (_Trash)", lib_rd: "Đọc", lib_vc: "Từ vựng", lib_office: "Mở file Word/Excel", lib: "📁 Tài liệu", lib_img: "Ảnh", lib_wl: "Bài đọc WordLoop", lib_wlq: "Tìm bài đọc (tên Block / chữ trong bài)…", lib_up: "Tải lên", lib_newf: "Thư mục mới", lib_empty: "Thư mục trống — bấm ⬆️ Tải lên để thêm PDF/ảnh", lib_newhint: "Đã vào thư mục mới — tải file lên là thư mục được tạo", board: "🖤 Bảng", can: "✍️ bạn được dùng bảng", view: "👀 chỉ xem", viewmsg: "👀 Bạn đang xem — host cấp quyền thì mới dùng được bút", perm: "👥 Quyền", permt: "Cấp quyền dùng bảng", min: "Thu nhỏ trên máy mình", close: "Đóng bảng cho cả phòng", laser: "Laser", pen: "Bút vẽ", text: "Ô chữ", color: "Màu", size: "Cỡ nét", undo: "Hoàn tác", redo: "Làm lại", clearAll: "Xoá cả bảng", clearMine: "Xoá nét của tôi", dock: "🖤 Mở bảng", open: "🖤 Bảng", qAll: "Xoá hết nét vẽ và ô chữ trên bảng (của cả phòng)?", qMine: "Xoá hết nét vẽ và ô chữ của bạn?", who: "Ai được dùng bảng (bút, laser, ô chữ):", none: "Chưa có người chơi nào.", share: "🖥 Chia sẻ màn hình", unshare: "⏹ Dừng chia sẻ", sharet: "Chia sẻ màn hình của bạn cho cả phòng (như Google Meet) — người có quyền vẫn vẽ/laser lên trên", sharing: "🖥 Bạn đang chia sẻ màn hình", nview: "👁 {n} người xem", watching: "🖥 {n} đang chia sẻ màn hình", conn: "🖥 đang kết nối…", fail: "⚠️ Không kết nối được — mạng có thể chặn (cần TURN)", full: "⚠️ Đã đủ 10 người xem — chờ có chỗ trống", hostfull: "⚠️ Tối đa 10 người xem — {n} người chưa xem được", unmute: "🔊 Bật tiếng", mute: "🔇 Tắt tiếng", shErr: "Không chia sẻ được màn hình: " },
    en: { lib_root: "root", hand: "Move / zoom with fingers (no drawing)", zout: "Smaller text", zin: "Bigger text", zfit: "Fit", big: "Big / small board", lib_vt: "Vocabulary table", lib_pick: "Pick a lesson from the folder tree", lib_find: "Find a Block…", lib_dest: "Save into folder", lib_cur: "Current folder", lib_mk: "➕ New folder…", lib_mkn: "New folder name", lib_go: "Upload", lib_no: "Cancel", lib_mv: "Move", lib_mvt: "Move this file to a folder", lib_trash: "Moved to Trash (_Trash)", lib_rd: "Reading", lib_vc: "Vocab", lib_office: "Open Word/Excel file", lib: "📁 Materials", lib_img: "Images", lib_wl: "WordLoop readings", lib_wlq: "Search readings (Block name / text)…", lib_up: "Upload", lib_newf: "New folder", lib_empty: "Empty folder — press ⬆️ Upload to add PDFs/images", lib_newhint: "In the new folder — upload a file to create it", board: "🖤 Board", can: "✍️ you can use the board", view: "👀 view only", viewmsg: "👀 You are watching — the host must give you permission to draw", perm: "👥 Access", permt: "Give board access", min: "Minimise on my screen", close: "Close the board for everyone", laser: "Laser", pen: "Pen", text: "Text box", color: "Colour", size: "Size", undo: "Undo", redo: "Redo", clearAll: "Clear the whole board", clearMine: "Clear my marks", dock: "🖤 Open board", open: "🖤 Board", qAll: "Clear all drawings and text on the board (for everyone)?", qMine: "Clear all your drawings and text?", who: "Who can use the board (pen, laser, text):", none: "No players yet.", share: "🖥 Share screen", unshare: "⏹ Stop sharing", sharet: "Share your screen with the whole room (like Google Meet) — people with access can still draw/laser on top", sharing: "🖥 You are sharing your screen", nview: "👁 {n} watching", watching: "🖥 {n} is sharing their screen", conn: "🖥 connecting…", fail: "⚠️ Could not connect — the network may be blocking it (TURN needed)", full: "⚠️ 10 viewers already — waiting for a free spot", hostfull: "⚠️ Max 10 viewers — {n} people cannot watch", unmute: "🔊 Turn sound on", mute: "🔇 Mute", shErr: "Could not share the screen: " },
    zh: { lib_root: "根目录", hand: "用手指移动/缩放（不画）", zout: "缩小文字", zin: "放大文字", zfit: "适合屏幕", big: "白板 大/小", lib_vt: "词汇表", lib_pick: "在文件夹树中选择课文", lib_find: "查找 Block…", lib_dest: "保存到文件夹", lib_cur: "当前文件夹", lib_mk: "➕ 新建文件夹…", lib_mkn: "新文件夹名称", lib_go: "上传", lib_no: "取消", lib_mv: "移动", lib_mvt: "把这个文件移到文件夹", lib_trash: "已移到回收站 (_Trash)", lib_rd: "阅读", lib_vc: "词汇", lib_office: "打开 Word/Excel 文件", lib: "📁 资料", lib_img: "图片", lib_wl: "WordLoop 阅读", lib_wlq: "搜索阅读（Block 名称 / 文中词）…", lib_up: "上传", lib_newf: "新文件夹", lib_empty: "空文件夹 — 点 ⬆️ 上传 添加 PDF/图片", lib_newhint: "已进入新文件夹 — 上传文件即创建", board: "🖤 白板", can: "✍️ 你可以使用白板", view: "👀 仅观看", viewmsg: "👀 你正在观看 — 主持人授权后才能使用画笔", perm: "👥 权限", permt: "授权使用白板", min: "在我的屏幕上最小化", close: "为全房间关闭白板", laser: "激光笔", pen: "画笔", text: "文本框", color: "颜色", size: "粗细", undo: "撤销", redo: "重做", clearAll: "清空整个白板", clearMine: "清除我的笔迹", dock: "🖤 打开白板", open: "🖤 白板", qAll: "清除白板上所有笔迹和文字（全房间）？", qMine: "清除你所有的笔迹和文字？", who: "谁可以使用白板（画笔、激光笔、文本框）：", none: "还没有玩家。", share: "🖥 共享屏幕", unshare: "⏹ 停止共享", sharet: "把你的屏幕共享给全房间（像 Google Meet）— 有权限的人仍可在上面画画/用激光笔", sharing: "🖥 你正在共享屏幕", nview: "👁 {n} 人观看", watching: "🖥 {n} 正在共享屏幕", conn: "🖥 正在连接…", fail: "⚠️ 无法连接 — 网络可能被拦截（需要 TURN）", full: "⚠️ 观看人数已满 10 人 — 等待空位", hostfull: "⚠️ 最多 10 人观看 — 还有 {n} 人看不到", unmute: "🔊 打开声音", mute: "🔇 静音", shErr: "无法共享屏幕：" },
    es: { lib_root: "raíz", hand: "Mover / hacer zoom con los dedos (sin dibujar)", zout: "Texto más pequeño", zin: "Texto más grande", zfit: "Ajustar", big: "Pizarra grande / pequeña", lib_vt: "Tabla de vocabulario", lib_pick: "Elige una lección en el árbol de carpetas", lib_find: "Buscar Block…", lib_dest: "Guardar en la carpeta", lib_cur: "Carpeta actual", lib_mk: "➕ Nueva carpeta…", lib_mkn: "Nombre de la carpeta nueva", lib_go: "Subir", lib_no: "Cancelar", lib_mv: "Mover", lib_mvt: "Mover este archivo a una carpeta", lib_trash: "Movido a la papelera (_Trash)", lib_rd: "Lectura", lib_vc: "Vocab", lib_office: "Abrir archivo Word/Excel", lib: "📁 Materiales", lib_img: "Imágenes", lib_wl: "Lecturas WordLoop", lib_wlq: "Buscar lecturas (nombre del Block / texto)…", lib_up: "Subir", lib_newf: "Nueva carpeta", lib_empty: "Carpeta vacía — pulsa ⬆️ Subir para añadir PDF/imágenes", lib_newhint: "En la carpeta nueva — sube un archivo para crearla", board: "🖤 Pizarra", can: "✍️ puedes usar la pizarra", view: "👀 solo ver", viewmsg: "👀 Estás mirando — el anfitrión debe darte permiso para dibujar", perm: "👥 Permisos", permt: "Dar acceso a la pizarra", min: "Minimizar en mi pantalla", close: "Cerrar la pizarra para todos", laser: "Láser", pen: "Lápiz", text: "Cuadro de texto", color: "Color", size: "Grosor", undo: "Deshacer", redo: "Rehacer", clearAll: "Borrar toda la pizarra", clearMine: "Borrar mis trazos", dock: "🖤 Abrir pizarra", open: "🖤 Pizarra", qAll: "¿Borrar todos los trazos y textos de la pizarra (para todos)?", qMine: "¿Borrar todos tus trazos y textos?", who: "Quién puede usar la pizarra (lápiz, láser, texto):", none: "Aún no hay jugadores.", share: "🖥 Compartir pantalla", unshare: "⏹ Dejar de compartir", sharet: "Comparte tu pantalla con toda la sala (como Google Meet) — quien tenga permiso puede seguir dibujando/usando el láser encima", sharing: "🖥 Estás compartiendo tu pantalla", nview: "👁 {n} mirando", watching: "🖥 {n} está compartiendo su pantalla", conn: "🖥 conectando…", fail: "⚠️ No se pudo conectar — la red puede estar bloqueándolo (hace falta TURN)", full: "⚠️ Ya hay 10 espectadores — esperando un hueco", hostfull: "⚠️ Máximo 10 espectadores — {n} personas no pueden ver", unmute: "🔊 Activar sonido", mute: "🔇 Silenciar", shErr: "No se pudo compartir la pantalla: " }
  };
  function t(k) { var l = api && api.lang ? api.lang() : "vi"; return (TX[l] || TX.vi)[k] || TX.vi[k] || k; }
  function relabel() {
    document.querySelectorAll("[data-bt]").forEach(function (e) { var tx = t(e.dataset.bt); if (e.dataset.ico) { e.title = tx; tx = String(tx).split(" ")[0]; } e.textContent = tx; });
    document.querySelectorAll("[data-btt]").forEach(function (e) { e.title = t(e.dataset.btt); });
  }
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function me() { return api && api.me ? api.me() : null; }
  function myId() { var m = me(); return m ? m.id : cid; }
  function st() { return api && api.st ? api.st() : null; }
  function canDraw() {
    return !!api;   /* TJ 2026-10-05: bỏ phân moderator — ai trong phòng cũng vẽ + lật trang được */
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
      '<aside class="bd-side" id="bd-side" hidden><div class="bd-sidehd"><b>Notebooks</b><span><button type="button" class="bd-hb" id="bd-sidepin" title="Ghim cột (luôn mở bên trái)">📌</button><button type="button" class="bd-hb" id="bd-sideexp" title="Mở hết">⊞</button><button type="button" class="bd-hb" id="bd-sidecol" title="Thu hết">⊟</button><button type="button" class="bd-hb" id="bd-sidex" title="Đóng">✕</button></span></div><input type="search" id="bd-sideq" placeholder="Tìm Block…"><div class="bd-tree bd-sidelist" id="bd-sidelist">⏳</div><div id="bd-sidebar"></div></aside>' +
      '<div class="bd-sw" id="bd-sw"><div class="bd-fx" id="bd-fx">' + '<div class="bd-top" id="bd-card" hidden>' +
          '<div class="bd-crow"><span class="bd-crumb" id="bd-crumb"></span></div>' +
          '<div class="bd-ctitle"><span class="bd-tlg" id="bd-tlg" hidden><button type="button" class="bd-hb" id="bd-back" title="Quay lại danh sách Block">← <span>Quay lại danh sách Block</span></button><button type="button" class="bd-hb" id="bd-bprev" title="Block trước">←</button><button type="button" class="bd-hb" id="bd-bnext" title="Block sau">→</button></span><b id="bd-cname"></b><span class="bd-clv" id="bd-clv"></span><button type="button" class="bd-dots" id="bd-dots" title="Thêm (khay công cụ)" hidden>···</button><span class="bd-pill" id="bd-cdue" hidden></span><span class="bd-pill bd-ctag" id="bd-ctag" hidden></span><span class="bd-cst" id="bd-cst" hidden></span></div>' +
          '<div class="bd-chips" id="bd-chips"></div><div class="bd-cprog" id="bd-cprog" hidden><i></i></div>' +
          '<div class="bd-act" id="bd-act" hidden><button type="button" class="bd-hb bd-acttog" id="bd-acttog" title="Bật/tắt khay công cụ (như nút ghim của Notebooks)">📚 Công cụ <span>📌</span></button><span class="bd-acttools" id="bd-acttools">' +
        '<button type="button" class="bd-hb" data-at="study" title="Bài học & Đọc">📘</button><button type="button" class="bd-hb" data-at="meaning" title="Nghĩa">🔀</button><button type="button" class="bd-hb" data-at="quiz" title="Active Recall Quiz">📝</button><button type="button" class="bd-hb" data-at="dictation" title="Dictation">🎧</button><button type="button" class="bd-hb" data-at="sheet" title="Phiếu đầy đủ">📋</button><button type="button" class="bd-hb" data-at="single" title="Từng câu">🔤</button><button type="button" class="bd-hb" data-at="progress" title="Tiến trình trí nhớ">📊</button></span>' +
        '<button type="button" class="bd-hb bd-cplay" id="bd-cplay">🎮 Chơi game →</button></div>' +
        '</div>' +
        '<div class="bd-path" id="bd-path" hidden></div>' +   /* TJ 2026-10-06: đường dẫn nhỏ đầy đủ Hub › Notebook › Section › Page › Batch › Block */
        '<div class="bd-mebar" id="bd-mebar"><div class="bd-me" id="bd-me" hidden></div></div>' +   /* v201: TRÊN bảng = người đang dùng máy này + 📖 Bài đọc | 📋 Từ vựng */
        '<div class="bd-sfx" id="bd-sfx">' +'<div class="bd-stage" id="bd-stage">' +
        '<div class="bd-zoom" id="bd-zoom"><video id="bd-video" class="bd-video" autoplay playsinline muted hidden></video><div class="bd-doc" id="bd-doc"></div><canvas id="bd-cv"></canvas><div class="bd-texts" id="bd-texts"></div></div>' +
        '<button type="button" class="bd-aud" id="bd-aud" hidden data-bt="unmute"></button>' +
        '</div>' +
        '<div class="bd-hudl" id="bd-hudl">' +
          '<div class="bd-vtbar bd-hud" id="bd-vtbar" hidden>' +
            '<button type="button" class="bd-snd" data-snd title="Bật / tắt tiếng trên máy này">🔊 <span>Có tiếng</span></button>' +
            '<input type="range" class="g-vol js-vol bd-vol" min="0" max="100" step="5" value="100" title="Âm lượng (riêng máy này, chung với game)">' +
            '<select id="bd-vtvoice" title="Giọng đọc (chọn riêng cho máy này)"><option value="">🗣 Giọng</option></select><select id="bd-vtrate" title="Tốc độ đọc (host chọn, cả phòng theo)"><option value="0.3">0.3x</option><option value="0.4">0.4x</option><option value="0.5">0.5x</option><option value="0.6">0.6x</option><option value="0.7">0.7x</option><option value="0.85" selected>0.85x</option><option value="1">1x</option><option value="1.15">1.15x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="1.75">1.75x</option><option value="2">2x</option></select>' +
            '<button type="button" data-vt="stop" title="Dừng đọc">■ <span>Dừng</span></button>' +
            '<button type="button" class="pri" data-vt="readall" title="Đọc tất cả từ">🔊 <span>Đọc tất cả từ</span></button>' +
            '<button type="button" class="pri" data-vt="readdef" title="Đọc từ + định nghĩa">🔊 <span>Đọc + định nghĩa</span></button>' +
          '</div>' +
          '<span class="bd-seg bd-segtop bd-hud" id="bd-seg" hidden><button type="button" data-sw="wl" aria-pressed="true" title="Bài đọc">📖<span> Bài đọc</span></button><button type="button" data-sw="vt" aria-pressed="false" title="Từ vựng">📋<span> Từ vựng</span></button></span>' +
          '<button type="button" class="bd-hb bd-fab bd-hud bd-tr" id="bd-big" data-btt="big">⛶</button>' +
          '<div class="bd-rail bd-hud">' +
            '<button type="button" class="bd-hb bd-fab" id="bd-close" hidden data-btt="close">✕</button>' +
            '<button type="button" class="bd-hb bd-fab" id="bd-lib" hidden data-ico="1" data-bt="lib"></button>' +
            '<button type="button" class="bd-hb bd-fab" id="bd-share" hidden data-ico="1" data-btt="sharet" data-bt="share"></button>' +
            '<button type="button" class="bd-hb bd-fab" id="bd-penbtn" title="Vẽ / ghi chú">✏️</button>' +
            '<button type="button" class="bd-hb bd-fab" id="bd-lkbtn" title="Tra nghĩa: bấm rồi chạm vào từ">🔍</button>' +
            '<button type="button" class="bd-hb bd-fab" id="bd-more" hidden title="Công cụ Block (chỉ Admin)">⋯</button>' +
          '</div>' +
          '<div class="bd-drawer bd-hud" id="bd-drawer" hidden>' +
            '<span class="bd-pane" id="bd-pane" hidden><button type="button" class="bd-pname" id="bd-pname" title="Mở / đóng cây Notebooks">Notebooks</button><button type="button" class="bd-ppin" id="bd-ppin" title="Ghim / bỏ ghim cột Notebooks" aria-label="Ghim / bỏ ghim cột Notebooks">📌</button></span>' +
            '<div class="bd-drow"><button type="button" class="bd-hb" id="bd-dswap" title="Đổi bài đọc / tạo bài mới" hidden>🔀 Đổi bài đọc</button><button type="button" class="bd-hb" id="bd-min" data-btt="min">▁ Thu nhỏ bảng</button></div>' +
            '<span hidden><b data-bt="board"></b><span class="bd-who" id="bd-who"></span><span class="bd-scr" id="bd-scr"></span><button type="button" id="bd-perm" hidden data-btt="permt" data-bt="perm"></button></span>' +
          '</div>' +
          '<div class="bd-pager bd-hud"><button type="button" class="bd-hb bd-fab" id="bd-pgup" title="Trang trước">▲</button><button type="button" class="bd-hb bd-fab" id="bd-pgdn" title="Trang sau">▼</button></div>' +
          '<div id="bd-lk" hidden><div id="bd-lkq" hidden></div><div id="bd-lkr"></div></div>' +
          '<div class="bd-bottom bd-hud">' +
            '<div class="bd-docnav" id="bd-docnav" hidden>' +
              '<button type="button" class="bd-hb" id="bd-dprev" title="Trang trước">◀</button><button type="button" class="bd-hb" id="bd-dpg" title="Nhảy tới trang…"></button><button type="button" class="bd-hb" id="bd-dnext" title="Trang sau">▶</button>' +
              '<button type="button" class="bd-hb" id="bd-dsrch" title="Gõ từ để tra nghĩa" hidden>🔍</button>' +
              '<span class="bd-sep"></span><button type="button" data-z="out" data-btt="zout" class="bd-hb bd-za">A−</button><button type="button" data-z="fit" data-btt="zfit" id="bd-zfit" class="bd-hb" title="Về cỡ mặc định 100%">⤢ 100%</button><button type="button" data-z="in" data-btt="zin" class="bd-hb bd-za">A+</button>' +
              '<button type="button" class="bd-hb" id="bd-dtree" hidden style="display:none">🌳</button><button type="button" class="bd-hb" id="bd-dclose" hidden style="display:none">✕</button>' +
            '</div>' +
            '<div class="bd-tools" id="bd-tools">' +
              '<button type="button" data-tool="hand" data-btt="hand">✋</button>' +
              '<button type="button" data-tool="laser" data-btt="laser">🔴</button>' +
              '<button type="button" data-tool="pen" data-btt="pen">✏️</button>' +
              '<button type="button" data-tool="text" data-btt="text">T</button>' +
              '<span class="bd-extras" id="bd-extras"><span class="bd-sep"></span>' +
              COLORS.map(function (c) { return '<button type="button" class="bd-col" data-col="' + c + '" style="--c:' + c + '" data-btt="color"></button>'; }).join("") +
              '<span class="bd-sep"></span>' +
              SIZES.map(function (z, i) { return '<button type="button" class="bd-sz" data-sz="' + z + '" data-btt="size"><i style="width:' + (6 + i * 5) + 'px;height:' + (6 + i * 5) + 'px"></i></button>'; }).join("") +
              '<span class="bd-sep"></span>' +
              '<button type="button" id="bd-undo" data-btt="undo">↶</button><button type="button" id="bd-redo" data-btt="redo">↷</button>' +
              '<button type="button" id="bd-clear" hidden>🗑</button></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bd-people" id="bd-people" hidden></div>' +   /* v201: DƯỚI bảng = mọi người trong phòng (vòng tròn avatar + tên, kiểu HelloTalk) */
      '<div class="bd-feed" id="bd-feed" hidden>' +
        '<div class="bd-fh"><span class="bd-ftit">🔎 Từ vừa tra <i id="bd-fn">0</i><i id="bd-fs" hidden>0</i></span>' +
        '<span class="bd-fq" id="bd-fq" hidden><input type="search" id="bd-lkin" placeholder="Gõ từ / cụm từ cần tra…" autocomplete="off" autocapitalize="off"><button type="button" class="bd-hb" id="bd-lkgo">Tra</button></span>' +
        '<button type="button" class="bd-hb" id="bd-fread" title="Đọc các từ đã lưu" hidden>🔊 Đọc</button></div>' +
        '<div class="bd-fl" id="bd-fl"></div></div>' +
        '</div></div>' +
      '<div class="bd-permbox" id="bd-permbox" hidden></div><div class="bd-view" id="bd-view" data-bt="viewmsg"></div>';
    document.body.appendChild(el);
    var dock = document.createElement("button");
    dock.id = "bd-dock"; dock.type = "button"; dock.className = "bd-dock"; dock.hidden = true; dock.dataset.bt = "dock";
    document.body.appendChild(dock);
    cv = $("#bd-cv"); ctx = cv.getContext("2d"); wrap = $("#bd-stage");
    /* v201 (TJ 2026-10-05): "Bài đọc | Bảng từ" ra khỏi bảng, nằm trên thẻ Block cạnh nút 🎮 (chỉ Admin) — trong bảng chỉ còn nội dung */
    var seg0 = $("#bd-seg"), mb0 = $("#bd-mebar"); if (seg0 && mb0) { seg0.classList.remove("bd-segtop", "bd-hud"); seg0.classList.add("bd-segcard"); mb0.appendChild(seg0); }
    /* TJ 2026-10-06: "tốc độ, Đọc, Dừng… ra bên ngoài cái bảng; bài đọc + từ vựng sát avatar, mấy cái đó ra phía sau" — nhóm âm thanh nằm ở thanh trên cùng, SAU hai tab */
    if (mb0) {
      var vb0 = $("#bd-vtbar"); if (vb0) { vb0.classList.remove("bd-hud"); vb0.classList.add("bd-audio"); mb0.appendChild(vb0); }
      if (vb0) { var rd0 = document.createElement("button"); rd0.type = "button"; rd0.className = "pri"; rd0.setAttribute("data-wlread", ""); rd0.title = "Đọc cả bài đọc"; rd0.innerHTML = '🔊 <span>Đọc bài</span>'; vb0.appendChild(rd0); }
      mb0.addEventListener("change", function (e) { if (e.target.id === "bd-vtrate" && api.isHost()) send({ t: "rt", r: parseFloat(e.target.value) }); });
      mb0.addEventListener("click", function (e) { var t = e.target; if (!t.closest) return; if (t.closest("[data-wlread]")) readPassage(); else if (t.closest("[data-snd]")) { if (api.toggleSound) { api.toggleSound(); rsTok++; paintSndBtn(); } } });
    }
    /* TJ 2026-10-06: "cho chọn giọng đi chứ đừng theo Learning" — ô chọn giọng riêng của Bảng/Game (lưu tjwl_game_voice_v1, chỉ máy này) */
    (function () {
      var KEY = "tjwl_game_voice_v1", syn = window.speechSynthesis; if (!syn) return;
      function shortName(n) { return String(n).replace(/^Microsofts+/, "").replace(/s*-s*English.*$/i, "").replace(/s*(Natural)/i, " ✨"); }
      function paint() {
        var s = $("#bd-vtvoice"); if (!s) return;
        var cur = ""; try { cur = localStorage.getItem(KEY) || ""; } catch (e) {}
        var vs = (syn.getVoices() || []).filter(function (v) { return /^en/i.test(v.lang); });
        s.innerHTML = '<option value="">🗣 Giọng tự động</option>' + vs.map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === cur ? " selected" : "") + ">" + esc(shortName(v.name)) + "</option>"; }).join("");
      }
      paint(); try { syn.addEventListener("voiceschanged", paint); } catch (e) {}
      el.addEventListener("change", function (e) {
        if (!e.target || e.target.id !== "bd-vtvoice") return;
        try { if (e.target.value) localStorage.setItem(KEY, e.target.value); else localStorage.removeItem(KEY); } catch (er) {}
        try { syn.cancel(); var u = new SpeechSynthesisUtterance("Hello, this is my voice."); u.lang = "en-US"; var v = (syn.getVoices() || []).find(function (x) { return x.name === e.target.value; }); if (v) u.voice = v; syn.speak(u); } catch (er) {}   /* nghe thử ngay */
      });
    })();
    setInterval(function () { if (open && !mini) { paintPeople(); paintHostAway(); paintSndBtn(); } }, 2000);
    var fx0 = $("#bd-fx"); if (fx0) { var ub0 = document.createElement("div"); ub0.id = "bd-ubar"; ub0.className = "bd-ubar"; ub0.hidden = true; fx0.insertBefore(ub0, fx0.firstChild); }   /* TJ 2026-10-06: người chơi thấy avatar + tên của mình TRÊN bảng (như Admin), kể cả lúc chờ nội dung */
    var dn0 = $("#bd-docnav"), ppl0 = $("#bd-people"), fd0 = $("#bd-feed");
    if (dn0) {   /* ☰ ← → (trước) và 🎮 (sau) vào hàng nút dưới bảng — chỉ host thấy */
      /* TJ 2026-10-06: "← Quay lại danh sách Block" + ← → (Block trước/sau) nằm hàng RIÊNG phía TRÊN cái loa (y như thẻ Block), không xuống hàng dưới nữa */
      var tlg0 = $("#bd-tlg"), mbn0 = $("#bd-mebar");
      if (tlg0 && mbn0) { var nr0 = document.createElement("div"); nr0.id = "bd-navrow"; nr0.className = "bd-navrow bd-hostonly"; nr0.hidden = true; mbn0.parentNode.insertBefore(nr0, mbn0); nr0.appendChild(tlg0); }
      var cp = $("#bd-cplay"); if (cp) { cp.classList.add("bd-hostonly"); cp.textContent = "Game →"; cp.title = "Chơi game với Block này"; dn0.appendChild(cp); }
      /* TJ 2026-10-06: "icon phải nằm dưới cái bảng" — gom MỌI icon (cột nút nổi bên phải + hàng lật trang/cỡ chữ) vào 1 hàng cố định dưới bảng */
      var sfx0 = $("#bd-sfx");
      if (sfx0) {
        var ib = document.createElement("div"); ib.id = "bd-iconbar"; ib.className = "bd-iconbar"; sfx0.parentNode.insertBefore(ib, sfx0.nextSibling); ib.appendChild(dn0);
        ["bd-lib", "bd-share", "bd-penbtn", "bd-more"].forEach(function (id) { var e = $("#" + id); if (e) { e.classList.add("bd-ibtn"); dn0.insertBefore(e, cp); } });
        /* TJ 2026-10-06: cửa sổ hẹp thì 🎮 và ✕ nằm cuối dải cuộn ngang (ẩn thanh cuộn) -> bị cắt mất. ✕ = góc TRÊN-PHẢI của bảng (luôn thấy, đúng thói quen đóng cửa sổ);
           🎮 = ghim cuối hàng icon, NGOÀI dải cuộn */
        var cl0 = $("#bd-close"), hl0 = $("#bd-hudl"); if (cl0 && hl0) { cl0.classList.add("bd-closetop"); hl0.appendChild(cl0); }
        if (cp) { cp.classList.add("bd-cpin"); ib.appendChild(cp); }
      }
    }
    if (ppl0) { var ibx = $("#bd-iconbar"); if (ibx) ibx.insertBefore(ppl0, ibx.firstChild); }   /* TJ 2026-10-06: avatar CHUNG HÀNG với dải icon dưới bảng (nửa trái avatar, nửa phải icon, mỗi bên vuốt ngang) */   /* TJ 2026-10-06: avatar mọi người lên thanh trên cho tiết kiệm chỗ, khung Từ vừa tra cao hơn */   /* thứ tự: bảng -> Từ vừa tra -> mọi người trong phòng */   /* ai vào / ra phòng -> dải avatar tự cập nhật */
    try { document.body.classList.toggle("bd-dev-phone", Math.min(screen.width, screen.height) < 600); } catch (e) {}   /* máy THẬT là điện thoại (iframe trong Learning hẹp không tính) */
    el.addEventListener("click", onClick);
    ["pointerdown", "pointermove", "keydown", "touchstart"].forEach(function (ev) { el.addEventListener(ev, poke, { passive: true }); });
    setTimeout(poke, 0);
    el.addEventListener("change", function (e) { Lib.treeChange(e); });
    $("#bd-sideq").addEventListener("input", function () { var v = this.value; clearTimeout(Lib.qt); Lib.qt = setTimeout(function () { Lib.drawTree(v, $("#bd-sidelist")); }, 250); });
    dock.addEventListener("click", function () { mini = false; paintOpen(); });
    var ob = document.createElement("button");   /* host: mở bảng cho cả phòng */
    ob.id = "bd-open"; ob.type = "button"; ob.className = "bd-dock bd-openbtn"; ob.hidden = true; ob.dataset.bt = "open";
    document.body.appendChild(ob);
    ob.addEventListener("click", function () { api.setBoard(true); });
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
    (function () {   /* 2 ngón chụm / bung trên bài = phóng / thu CHỮ cho cả phòng (cỡ chữ đổi thật, không bể nét) */
      var dc = $("#bd-doc"), pp = {}, p0 = null;
      function dist() { var k = Object.keys(pp); return Math.hypot(pp[k[0]].x - pp[k[1]].x, pp[k[0]].y - pp[k[1]].y) || 1; }
      dc.addEventListener("pointerdown", function (e) { if (e.pointerType !== "touch" || !isTxt(curDoc())) return; pp[e.pointerId] = { x: e.clientX, y: e.clientY }; if (Object.keys(pp).length === 2) p0 = { d: dist(), z: lfz }; });
      dc.addEventListener("pointermove", function (e) { if (!pp[e.pointerId]) return; pp[e.pointerId] = { x: e.clientX, y: e.clientY }; if (p0 && Object.keys(pp).length === 2) shareZoom(p0.z * dist() / p0.d); });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { dc.addEventListener(ev, function (e) { delete pp[e.pointerId]; if (Object.keys(pp).length < 2) p0 = null; }); });
    })();
    $("#bd-doc").parentNode.addEventListener("click", function (e) {   /* v200: bài cuộn — lớp vẽ nhường chạm, chạm đi thẳng vào bài */
      if (isTxt(curDoc()) && e.target.closest && e.target.closest("#bd-doc")) docTap(e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", upEv); window.addEventListener("pointercancel", upEv);
    window.addEventListener("resize", fit); window.addEventListener("orientationchange", function () { setTimeout(fit, 250); });
    wrap.addEventListener("wheel", function (e) {
      if (isTxt(curDoc())) { if (e.ctrlKey) { e.preventDefault(); shareZoom(lfz * Math.exp(-Math.max(-30, Math.min(30, e.deltaY)) * 0.006));   /* mỗi nấc chuột ~×1.2, touchpad chụm nhỏ -> mượt */ } return; }   /* bài cuộn: lăn chuột = cuộn bài (trình duyệt tự lo); Ctrl+lăn / chụm touchpad = phóng chữ */
      if (!(e.ctrlKey || big)) return; e.preventDefault(); var c = stageRel(e.clientX, e.clientY); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), c.x, c.y); }, { passive: false });
    paintTools();
    $("#bd-lkin").addEventListener("keydown", function (ev) { if (ev.key === "Enter") { var qv = this.value.trim(); if (qv) lookupShow(qv, "", true); } });
  }
  function onClick(e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "bd-penbtn") { setPen(!penMode); return; }
    if (b.id === "bd-dots") { var dw0 = $("#bd-drawer"); if (dw0) { dw0.hidden = !dw0.hidden; var mb = $("#bd-more"); if (mb) mb.classList.toggle("on", !dw0.hidden); } poke(); return; }
    if (b.id === "bd-lkbtn") { setLook(!lookMode); return; }
    if (b.dataset.fsave) { toggleSave(b.dataset.fsave); return; }
    if (b.dataset.lkstar) { lkStar(b.dataset.lkstar); return; }
    if (b.dataset.ftab) { lkTab = b.dataset.ftab; paintFeed(); return; }
    if (b.id === "bd-fread") { readSaved(); return; }
    if (b.id === "bd-more") { var dw = $("#bd-drawer"); if (dw) { dw.hidden = !dw.hidden; b.classList.toggle("on", !dw.hidden); } poke(); return; }
    if (b.id === "bd-pgup" || b.id === "bd-pgdn") { flip(b.id === "bd-pgdn" ? 1 : -1); return; }
    if (b.dataset.tool) { tool = b.dataset.tool; if (tool === "hand") setPen(false); paintTools(); return; }
    if (b.dataset.z) {
      if (fsMode()) { if (b.dataset.z === "fit") { zoomReset(); fsStep(0); } else fsStep(b.dataset.z === "in" ? 1 : -1); return; }
      var zr = wrap.clientWidth / 2, zq = wrap.clientHeight / 2; if (b.dataset.z === "fit") zoomReset(); else zoomAt(b.dataset.z === "in" ? 1.3 : 1 / 1.3, zr, zq); return;
    }
    if (b.id === "bd-big") { bigPref = !big; paintOpen(); return; }
    if (b.dataset.col) { color = b.dataset.col; if (tool === "laser" || tool === "hand") tool = "pen"; paintTools(); return; }
    if (b.dataset.sz) { size = +b.dataset.sz; paintTools(); return; }
    if (b.id === "bd-undo") return undo();
    if (b.id === "bd-redo") return redoOne();
    if (b.id === "bd-clear") {
      if (confirm(t("qAll"))) { clearAll(); send({ t: "clear" }); } return;   /* TJ 2026-10-05: người chơi cũng xoá hết được (undo vẫn dùng được) */
      /* người được cấp quyền: sọt rác chỉ xoá nét + ô chữ CỦA MÌNH (TJ 2026-10-04) */
      var me0 = myId(), ids = order.filter(function (id) { return items[id] && items[id].by === me0; });
      if (ids.length && confirm(t("qMine"))) { ids.forEach(function (id) { removeItem(id); send({ t: "del", id: id }); }); mine = []; redo = []; draw(); paintTexts(); paintTools(); }
      return;
    }
    if (b.id === "bd-share") { if (shStream) stopShare(); else startShare(); return; }
    if (b.id === "bd-aud") { var v = $("#bd-video"); v.muted = !v.muted; if (!v.muted) v.play().catch(function () {}); paintShare(); return; }
    if (b.id === "bd-min") { mini = true; paintOpen(); return; }
    if (b.id === "bd-close") { api.setBoard(false); return; }
    if (b.id === "bd-lib") { Lib.open(); return; }
    if (b.dataset.vt) { vtAction(b.dataset.vt); return; }
    if (b.id === "bd-back") { if (api.isHost()) docSet(null); return; }   /* ← Quay lại danh sách Block (bảng chưa có Block = hiện màn hình Learning) */
    if (b.id === "bd-bprev" || b.id === "bd-bnext") { navStep("block", b.id === "bd-bnext" ? 1 : -1); return; }
    if (b.dataset.sw) { swKind(b.dataset.sw); return; }
    if (b.dataset.nv) { var pz = b.dataset.nv.split(":"); navStep(pz[0], +pz[1]); return; }
    if (b.dataset.at) { var dA = curDoc(); if (dA && dA.bid && api.isHost() && api.openInApp) api.openInApp(dA.bid, b.dataset.at); return; }
    if (b.id === "bd-cplay") { var dP = curDoc(); if (dP && dP.bid && api.isHost() && api.playBlock) api.playBlock(dP.bid, dP.name || ""); return; }
    if (b.id === "bd-acttog") { actCol = !actCol; try { localStorage.setItem("tjwl_bd_actcol_v1", actCol ? "1" : "0"); } catch (e) {} paintAct(); return; }
    if (b.id === "bd-dprev" || b.id === "bd-dnext") { flip(b.id === "bd-dnext" ? 1 : -1); return; }
    if (b.id === "bd-dtree") { if (api.isHost()) sideShow(!sideOn); return; }
    if (sideClick(b)) return;
    if (b.id === "bd-dsrch") { var lq = $("#bd-lkq"), lk = $("#bd-lk"); var showq = lq.hidden; lq.hidden = !showq; lk.hidden = showq ? false : !$("#bd-lkr").innerHTML; if (showq) { $("#bd-lkin").focus(); } setTimeout(fit, 0); return; }
    if (b.id === "bd-lkx") { $("#bd-lk").hidden = true; $("#bd-lkq").hidden = true; $("#bd-lkr").innerHTML = ""; selWord(null); setTimeout(fit, 0); return; }
    if (b.id === "bd-lkgo") { var qv = $("#bd-lkin").value.trim(); if (qv) lookupShow(qv, "", true); return; }
    if (b.dataset.lksay) { sayWord(b.dataset.lksay); return; }
    if (b.id === "bd-dpg") { var dj = curDoc(); if (dj && api.isHost() && dj.n > 1) { var pj = parseInt(prompt("1 – " + dj.n, dj.p || 1), 10); if (pj >= 1) docSet(Object.assign({}, dj, { p: Math.min(dj.n, pj) })); } return; }
    if (b.id === "bd-dswap") { var dw = curDoc(); if (dw && dw.k === "wl" && api.isHost()) { Lib.open(); Lib.tab = "wl"; Lib.paintPass(dw.bid, dw.name, true); } return; }
    if (b.id === "bd-dclose") { if (api.isHost()) docSet(null); return; }
    if (b.id === "bd-perm") { var pb = $("#bd-permbox"); pb.hidden = !pb.hidden; paintPerm(); paintOpen(); return; }   /* QA v106 L2: cập nhật phần đẩy nội dung xuống */
    if (b.dataset.perm) { api.togglePerm(b.dataset.perm); return; }
  }
  function paintTools() {
    if (!$("#bd")) return;
    var ok = canDraw();
    if (!ok && tool !== "hand") tool = "hand";
    $("#bd-tools").hidden = false; $("#bd-view").hidden = ok;
    document.querySelectorAll("#bd-tools [data-tool]").forEach(function (b) { b.classList.toggle("on", b.dataset.tool === tool); if (b.dataset.tool !== "hand") b.hidden = !ok; });
    document.querySelectorAll("#bd-tools [data-col]").forEach(function (b) { b.classList.toggle("on", b.dataset.col === color); });
    document.querySelectorAll("#bd-tools [data-sz]").forEach(function (b) { b.classList.toggle("on", +b.dataset.sz === size); });
    var ex = $("#bd-extras"); if (ex) ex.classList.toggle("off", !(ok && (tool === "pen" || tool === "text")));   /* màu/cỡ/hoàn tác chỉ hiện khi cầm bút hoặc ô chữ */
    $("#bd-clear").hidden = !ok; $("#bd-clear").title = t("clearAll"); relabel(); $("#bd-close").hidden = !api.isHost(); var pn = $("#bd-pane"); if (pn) pn.hidden = !api.isHost(); $("#bd-perm").hidden = true;
    cv.style.cursor = !ok || tool === "hand" ? (Z.s > 1 ? "grab" : "default") : tool === "text" ? "text" : "crosshair";
    $("#bd-undo").disabled = !mine.length; $("#bd-redo").disabled = !redo.length;
    paintShare(); paintZ();
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
  function phoneScreen() { return window.innerWidth < 760; }
  function wantBig(d) { return document.body.classList.contains("embed") || phoneScreen() ? true : (bigPref != null ? bigPref : (!!d || !!(api && !api.isHost() && api.inLobby && api.inLobby()))); }   /* TJ 2026-10-06: người chơi ở phòng chờ + bảng mở (chưa có nội dung) = form riêng toàn màn hình, không lòi phòng chờ bên dưới */   /* điện thoại: bảng luôn FULL MÀN HÌNH (TJ 2026-10-05) */   /* embed = trong thẻ của Learning: luôn là bảng to (TJ 2026-10-05: "vào chế độ bảng thì bỏ giao diện chính") */
  function notifyParent(show) {
    if (!(window.parent && window.parent !== window)) return;
    var has = !!curDoc(), key = (show ? 1 : 0) + ":" + (has ? 1 : 0); if (notifyParent._k === key) return; notifyParent._k = key;
    try { window.parent.postMessage({ type: "tjwl-board-on", on: !!show, doc: has }, location.origin); } catch (e) {}
  }
  /* TJ 2026-10-06: chuột + cửa sổ rộng = các nút công cụ (A− Aa A+ 📁 📱 ⋯) thành MỘT CỘT DỌC bên phải bảng (dải 56px có sẵn của khung); điện thoại / cảm ứng / bảng nhỏ = hàng ngang dưới bảng như cũ */
  function placeTools() {
    var dn = $("#bd-docnav"), sfx = $("#bd-sfx"), ib = $("#bd-iconbar"); if (!dn || !sfx || !ib) return;
    var rail = !!big && window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:700px)").matches;
    if (placeTools._r === rail) return; placeTools._r = rail;
    if (rail) { sfx.appendChild(dn); sfx.classList.add("bd-hasrail"); dn.classList.add("bd-railtools"); }
    else { var cp = $("#bd-cplay"); ib.insertBefore(dn, cp && cp.parentNode === ib ? cp : null); sfx.classList.remove("bd-hasrail"); dn.classList.remove("bd-railtools"); }
  }
  function paintOpen() {
    var el = $("#bd"); if (!el) return;
    el.classList.toggle("bd-isHost", !!(api && api.isHost()));
    var hd = el.querySelector(".bd-head"); if (hd) hd.style.display = api && api.isHost() ? "" : "none";   /* thanh trên (Bảng / Tài liệu / Quyền / ✕…) CHỈ host thấy (TJ 2026-10-05: "người chơi sẽ hong thấy thanh trên") */
    if (document.body.classList.contains("embed") || phoneScreen()) mini = false;   /* trong Learning (chế độ bảng): bảng luôn chiếm trọn vùng giữa, không thu nhỏ */
    big = wantBig(curDoc());
    el.hidden = !open || mini; $("#bd-dock").hidden = !open || !mini;
    $("#bd-open").hidden = open || !api || !api.isHost() || !api.ch();
    var show = open && !mini;
    notifyParent(!!show);   /* TJ 2026-10-05: báo cho Learning: bảng đang mở + đã có Block chưa (chưa có Block = hiện màn hình Learning trên nền bảng) */
    var tg0 = $("#bd-tlg"); if (tg0) tg0.hidden = !(api && api.isHost()); var nv0 = $("#bd-navrow"); if (nv0) nv0.hidden = !(api && api.isHost());
    document.body.classList.toggle("bd-on", show); document.body.classList.toggle("bd-bigon", show && big);
    el.classList.toggle("bd-big", big);
    placeTools();
    if (show) { fit(); paintTools(); paintPerm(); }
    document.body.style.paddingTop = show && !big ? el.offsetHeight + "px" : "";   /* bảng nhỏ nằm trên cùng, game đẩy xuống dưới; bảng to phủ cả màn hình */
  }
  /* khung bảng: tỉ lệ theo tài liệu; chế độ to = lớn nhất vừa phần còn lại của màn hình */
  function layoutStage() {
    if (!wrap) return;
    wrap.style.setProperty("--ar", AR.toFixed(4));
    var pin = sideOn && sidePinned() && big && window.innerWidth >= 900; $("#bd").classList.toggle("bd-sidepin", pin);
    if (!big) { wrap.style.width = ""; wrap.style.height = ""; return; }
    var sw = $("#bd-sw"), aw = sw.clientWidth - 12 - ($("#bd-sfx") && $("#bd-sfx").classList.contains("bd-hasrail") ? 56 : 0), ah = sw.clientHeight - 12 - ((function () { var t = $("#bd-card"), f = $("#bd-feed"); var mb = $("#bd-mebar"), pp = $("#bd-people"), ibr = $("#bd-iconbar"), pth = $("#bd-path"), nvr = $("#bd-navrow"), ubr = $("#bd-ubar"); return (pth && !pth.hidden ? pth.offsetHeight : 0) + (ubr && !ubr.hidden ? ubr.offsetHeight + 4 : 0) + (nvr && !nvr.hidden ? nvr.offsetHeight + 4 : 0) + (ibr && !ibr.hidden ? ibr.offsetHeight + 6 : 0) + (t && !t.hidden ? t.offsetHeight + 8 : 0) + (f && !f.hidden ? f.offsetHeight + 8 : 0) + (mb && !mb.hidden ? mb.offsetHeight + 6 : 0) + 0; })());
    if (aw < 60 || ah < 60) return;
    /* TJ 2026-10-05: "đừng cố định nữa" — bảng to lấp KÍN chỗ trống (điện thoại dọc, cột Learning hẹp), không ép 4:3 nữa.
       Nét vẽ tính theo bề ngang (k = cv.width / W) nên đổi tỉ lệ không méo; trang bài đọc vẫn chia chung, chỉ cỡ chữ mỗi máy tự phóng cho đầy khung. */
    setAR(aw / ah); wrap.style.width = Math.floor(aw) + "px"; wrap.style.height = Math.floor(ah) + "px";
  }
  function setAR(ar) {
    ar = Math.max(0.3, Math.min(3, +ar || 16 / 9));
    if (Math.abs(ar - AR) < 0.001) return;
    AR = ar; H = Math.round(W / ar); bgDirty = true;
  }

  /* ---------- 🔍 phóng to / kéo bằng tay (TJ 2026-10-04: "không zoom được, chạm là vẽ tùm lum") ---------- */
  function stageRel(px, py) { var r = wrap.getBoundingClientRect(); return { x: px - r.left - wrap.clientLeft, y: py - r.top - wrap.clientTop }; }
  function clampZ() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    Z.s = Math.max(ZMIN, Math.min(6, Z.s));
    if (Z.s < 1) { Z.x = w * (1 - Z.s) / 2; Z.y = h * (1 - Z.s) / 2; return; }   /* thu nhỏ: nằm giữa khung */
    Z.x = Math.min(0, Math.max(w * (1 - Z.s), Z.x)); Z.y = Math.min(0, Math.max(h * (1 - Z.s), Z.y));
  }
  function applyZ() {
    clampZ(); var zw = $("#bd-zoom"); if (!zw) return;
    zw.style.transform = Z.s === 1 && !Z.x && !Z.y ? "" : "translate(" + Z.x.toFixed(1) + "px," + Z.y.toFixed(1) + "px) scale(" + Z.s.toFixed(3) + ")";
    clearTimeout(zT); zT = setTimeout(function () { if (qOf() !== curQ) fit(); }, 220);   /* dừng tay rồi mới vẽ lại nét cho nét hơn */
    paintZ();
  }
  function zoomAt(f, cx, cy) { var s0 = Z.s, s1 = Math.max(ZMIN, Math.min(6, s0 * f)), k = s1 / s0; Z.x = cx - (cx - Z.x) * k; Z.y = cy - (cy - Z.y) * k; Z.s = s1; applyZ(); }
  function zoomReset() { Z.s = 1; Z.x = 0; Z.y = 0; applyZ(); }
  function fsMode() { var d = curDoc(); return !!(d && (d.k === "wl" || d.k === "vt") && api); }   /* ai cũng chỉnh được cỡ chữ chung (người chơi gửi yêu cầu cho host) */   /* host + bài đọc/bảng từ: A−/A+ đổi CỠ CHỮ CHUNG (mọi trang cùng cỡ, ít/nhiều chữ mỗi trang) */
  function paintZ() { var b = $("#bd-zfit"); if (b) b.textContent = fsMode() ? "Aa " + Math.round(lfz * 100) + "%" : "⤢ " + Math.round(Z.s * 100) + "%"; if (cv && (!canDraw() || tool === "hand")) cv.style.cursor = Z.s > 1 ? "grab" : "default"; }
  function qOf() { return Math.min(3, Math.max(1, Math.ceil(Z.s - 0.05))); }
  function pinfo() { var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; }
  function beginPinch() { var p = pinfo(); gest = { m: "pinch", d0: p.d, s0: Z.s, x0: Z.x, y0: Z.y, c0: stageRel(p.cx, p.cy) }; }
  function movePinch() {
    var p = pinfo(), c = stageRel(p.cx, p.cy), s1 = Math.max(ZMIN, Math.min(6, gest.s0 * p.d / gest.d0)), k = s1 / gest.s0;
    Z.s = s1; Z.x = c.x - (gest.c0.x - gest.x0) * k; Z.y = c.y - (gest.c0.y - gest.y0) * k; applyZ();
  }

  /* ---------- vẽ ---------- */
  function fit() {
    if (!cv || $("#bd").hidden) return;
    layoutStage();
    dpr = window.devicePixelRatio || 1;
    var cw = cv.offsetWidth, ch = cv.offsetHeight, q = qOf();
    while (q > 1 && cw * ch * dpr * dpr * q * q > 7e6) q--;   /* trần ~7 triệu điểm ảnh mỗi lớp */
    curQ = qOf();
    var w = Math.round(cw * dpr * q), h = Math.round(ch * dpr * q);
    if (w !== cv.width || h !== cv.height) { cv.width = w; cv.height = h; bgDirty = true; render(); }   /* chỉ dựng lại khi ĐỔI cỡ (iPhone chớp/mất nét đang vẽ) */
    paintTexts(); applyZ(); fitDocText(); extraH();
  }
  function sx() { return cv.width / W; }
  function toLogic(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }   /* getBoundingClientRect đã tính cả phóng to */
  function strokePath(s, c) {
    var ctx = c; var p = s.pts; if (!p || !p.length) return;
    var k = sx();
    ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.w * k; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (p.length < 4) { ctx.beginPath(); ctx.arc(p[0] * k, p[1] * k, s.w * k / 2, 0, 7); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(p[0] * k, p[1] * k);
    for (var i = 2; i < p.length - 2; i += 2) { var mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2; ctx.quadraticCurveTo(p[i] * k, p[i + 1] * k, mx * k, my * k); }
    ctx.lineTo(p[p.length - 2] * k, p[p.length - 1] * k); ctx.stroke();
  }
  /* ⚡ CHỐNG GIẬT (TJ 2026-10-04 "bảng mở lên lag quá"): trước đây MỖI lần rê bút / mỗi tin nhận được đều vẽ lại TẤT CẢ nét từ đầu.
     Giờ: nét đã xong vẽ sẵn vào 1 lớp nền (bg, chỉ dựng lại khi danh sách nét đổi) + gộp mọi lần vẽ vào 1 khung hình (requestAnimationFrame);
     mỗi khung chỉ dán lớp nền + nét đang kéo + laser. draw() = có đổi nét (dựng lại nền); drawLite() = chỉ nét đang kéo/laser. */
  function draw() { bgDirty = true; sched(); }
  function drawLite() { sched(); }
  function sched() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); }); }
  function render() {
    if (!ctx) return;
    if (!bg) bg = document.createElement("canvas");
    if (bg.width !== cv.width || bg.height !== cv.height) { bg.width = cv.width; bg.height = cv.height; bgDirty = true; }
    if (bgDirty) {
      var bc = bg.getContext("2d"); bc.clearRect(0, 0, bg.width, bg.height);
      order.forEach(function (id) { var it = items[id]; if (it && it.k === "s") strokePath(it, bc); });
      bgDirty = false;
    }
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(bg, 0, 0);
    if (cur && !cur.laser) strokePath(cur, ctx);
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
      ctx.fillStyle = "rgba(255,40,40,.95)"; ctx.beginPath(); ctx.arc(h.x * k, h.y * k, 9 * k, 0, 7); ctx.fill();   /* bỏ shadowBlur (rất nặng trên máy yếu) */
      ctx.strokeStyle = "rgba(255,120,120,.5)"; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(h.x * k, h.y * k, 13 * k, 0, 7); ctx.stroke();
      if (L.name) { ctx.font = (22 * k) + "px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(L.name, h.x * k + 14 * k, h.y * k - 12 * k); }
    });
    if (any) sched();
  }
  function down(e) {
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var n = Object.keys(ptrs).length;
    if (n === 2) { if (cur) up(); e.preventDefault(); return beginPinch(); }   /* 2 ngón = phóng to, đang vẽ dở thì chốt nét */
    if (n > 2 || e.button > 0) return;
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    if (tool === "hand" || !canDraw()) { gest = { m: "pan", sx: e.clientX, sy: e.clientY, x0: Z.x, y0: Z.y, moved: false, t: Date.now() }; return; }   /* mặc định KHÔNG vẽ: chỉ kéo/phóng */
    var p = toLogic(e);
    if (tool === "text") { e.preventDefault(); return newText(p); }
    if (tool === "laser") { cur = { laser: true }; laserAt(p); return; }
    cur = { k: "s", id: uid(), c: color, w: size, pts: [Math.round(p.x), Math.round(p.y)], by: myId() };
    sendT = Date.now(); cur.sent = cur.pts.length; send({ t: "s", id: cur.id, c: cur.c, w: cur.w, from: 0, pts: cur.pts.slice(), done: false });
    draw();
  }
  function move(e) {
    if (ptrs[e.pointerId]) { ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY; }
    if (gest) {
      if (gest.m === "pinch") return movePinch();
      var dx = e.clientX - gest.sx, dy = e.clientY - gest.sy; if (Math.abs(dx) + Math.abs(dy) > 6) gest.moved = true;
      if (gest.moved) { Z.x = gest.x0 + dx; Z.y = gest.y0 + dy; applyZ(); }
      return;
    }
    if (!cur) return;
    var p = toLogic(e);
    if (cur.laser) return laserAt(p);
    var n = cur.pts.length, lx = cur.pts[n - 2], ly = cur.pts[n - 1];
    if (Math.abs(p.x - lx) + Math.abs(p.y - ly) < 2) return;
    cur.pts.push(Math.round(p.x), Math.round(p.y)); drawLite();
    if (Date.now() - sendT > 80) { sendT = Date.now(); var f = cur.sent; cur.sent = cur.pts.length; send({ t: "s", id: cur.id, c: cur.c, w: cur.w, from: f, pts: cur.pts.slice(f), done: false }); }   /* ~12 lần/giây, CHỈ gửi phần mới */
  }
  function upEv(e) {
    if (e && e.pointerId != null) delete ptrs[e.pointerId];
    if (gest) {
      var g = gest;
      if (g.m === "pinch") { if (Object.keys(ptrs).length < 2) gest = null; return; }
      gest = null;
      if (!g.moved && Date.now() - g.t < 350 && e) {   /* chạm nhanh: chạm đôi = phóng/thu; chạm 1 lần trên bảng từ vựng = chỉ dòng */
        var now = Date.now(), c = stageRel(e.clientX, e.clientY);
        if (now - lastTap < 350) { lastTap = 0; if (Z.s > 1.2) zoomReset(); else zoomAt(2.5, c.x, c.y); }
        else { lastTap = now; docTap(e.clientX, e.clientY); }
      }
      return;
    }
    up();
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
    var L = lasers[myId()] = lasers[myId()] || { pts: [], name: name }; L.pts.push({ x: p.x, y: p.y, t: Date.now() }); drawLite();
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
    var k = cv.offsetWidth / W, ky = cv.offsetHeight / H;   /* cỡ gốc (chưa phóng) vì ô chữ nằm TRONG lớp được phóng */
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
    var d = e.target.closest && e.target.closest(".bd-tx"); if (!d || editing === d.dataset.id || !canDraw() || tool === "laser" || tool === "hand") return;
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
    else if (m.t === "lk") { if (m.e && m.e.id && m.e.w) lkAdd(m.e); }
    else if (m.t === "lksave") { var le = lkFeed.find(function (x) { return x.id === m.id; }); if (le) { le.saved = !!m.on; paintFeed(); } }
    else if (m.t === "navreq") { if (api.isHost()) { if (m.k === "fs") fsStep(m.dir | 0); else if (m.k === "sw") swKind(m.dir > 0 ? "vt" : "wl"); else if (m.k === "page") flip(m.dir > 0 ? 1 : -1); else if (m.k === "hs") hlSentence(m.dir | 0); else navStep(m.k, m.dir > 0 ? 1 : -1); } }
    else if (m.t === "sc") { applyAnchor(m.a); if (readRemote) soonEnsure(); }
    else if (m.t === "rt") setRateUI(m.r);   /* host đổi tốc độ -> mọi máy hiện cùng mức */
    else if (m.t === "rd") { if (m.r) setRateUI(m.r); readRemote = m.k ? m : null; if (!readOn) { applyReadHL(m, true); remoteSpeak(m); } }   /* người khác đang đọc: tô sáng + cuộn theo (máy này không phát tiếng) */
    else if (m.t === "sw") { if (m.i >= 0) selRange(m.i, m.j == null ? m.i : m.j); else selWord(null); }
    else if (m.t === "zf") { if (setZoom(m.v)) { persistZoom(); } if (m.a) { lastA = m.a; goAnchor(scBox(), m.a); } }   /* sau khi đổi cỡ chữ: về đúng chỗ người phóng đang xem */
    else if (m.t === "l") { var L = lasers[m.pid] = lasers[m.pid] || { pts: [] }; L.name = m.n; L.pts.push({ x: m.x, y: m.y, t: Date.now() }); draw(); }
    /* xin bản đầy đủ: host trả lời ngay; HOST VẮNG (mất mạng) thì người được cấp quyền (moderator) có nét trên bảng trả lời thay
       (chờ ngẫu nhiên 0.3–1s, ai đã thấy người khác trả lời thì thôi) — TJ 2026-10-04: "host mất mạng mà có moderator thì bảng vẫn ổn" */
    else if (m.t === "hello") {
      var full = function () { send({ t: "full", to: m.cid, items: order.map(function (id) { return items[id]; }).filter(Boolean), lk: lkFeed.slice(0, 40) }); };
      if (api.isHost()) { full(); sendAnchor(); send({ t: "rt", r: curRate() }); if (shStream) announce(); }   /* máy vừa mở bảng -> báo ngay đang chia sẻ màn hình (khỏi chờ 5 giây) */
      else if (order.length) { answered[m.cid] = 0; setTimeout(function () { if (!answered[m.cid]) full(); delete answered[m.cid]; }, (canDraw() ? 300 : 1200) + Math.random() * 700); }   /* moderator trả lời trước, người xem làm dự phòng */
    }
    else if (m.t === "full") {
      answered[m.to] = 1;
      if (m.to !== cid) return;
      (m.items || []).forEach(function (it) { if (!items[it.id]) { items[it.id] = it; order.push(it.id); } });   /* GỘP (không xoá): host vừa tải lại vẫn giữ nét đang có */
      (m.lk || []).forEach(function (e) { if (!e || !e.id || !e.w) return; var ex = lkFeed.find(function (x) { return x.w.toLowerCase() === e.w.toLowerCase(); }); if (ex) ex.who = Object.assign({}, e.who || {}, ex.who || {}); else lkFeed.push(e); }); if (m.lk && m.lk.length) paintFeed();
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
    if (open) { var lb = $("#bd-lib"); if (lb) lb.hidden = !api.isHost(); syncDoc(s.bdoc || null); }
  }
  /* ---------- 📁 TÀI LIỆU TRÊN BẢNG (TJ 2026-10-04) ----------
     Host chọn -> st.bdoc = {k:"pdf"|"img"|"wl"|"vt"|"office", url|bid, name, p, n, ar, hl} -> mọi máy tự vẽ tài liệu làm NỀN dưới lớp bút.
     · ar = tỉ lệ khung (rộng/cao) của tài liệu: PDF/ảnh theo trang thật, bài đọc + bảng từ vựng 3:4 → khung bảng đổi theo, nét vẽ vẫn khớp.
     · Nét vẽ RIÊNG từng trang (cất/lấy lại khi lật trang). Phóng to/kéo là riêng từng máy.
     · "wl" bài đọc WordLoop · "vt" bảng từ vựng của Block (nghĩa theo tiếng của từng người; host chạm 1 dòng = chỉ cho cả phòng) ·
       "office" Word/Excel/PowerPoint qua trình xem của Microsoft (mỗi người tự cuộn, không vẽ lên được). */
  var docKey = "", docJob = 0, stash = {}, pdfCache = {}, wlCache = {}, vtCache = {};
  function curDoc() { var s0 = st(); return s0 && s0.bdoc || null; }
  /* 🕘 GẦN ĐÂY (TJ 2026-10-04): nhớ tài liệu/bài đã mở + trang đang đọc, trên MÁY này (localStorage) */
  var RK = "tjwl_bd_recent_v1";
  function recents() { try { return JSON.parse(localStorage.getItem(RK) || "[]") || []; } catch (e) { return []; } }
  function recentPut(d) {
    if (!d) return;
    var key = d.k + ":" + (d.url || d.bid) + (d.ph ? ":" + d.ph : "");
    var L = recents().filter(function (x) { return x.key !== key; });
    L.unshift({ key: key, k: d.k, url: d.url, bid: d.bid, name: d.name, lb: d.lb, ph: d.ph, p: d.p || 1, ar: d.ar, n: d.n, t: Date.now() });
    try { localStorage.setItem(RK, JSON.stringify(L.slice(0, 15))); } catch (e) {}
  }
  function docSet(d) { api.setDoc(d); if (d && api.isHost()) recentPut(d); }
  /* nhận diện bài đọc: bài GỐC (văn bản lesson không có dấu AI / bài dán / nguyên văn bài báo) hay bài AI sinh */
  var SEPM = "\n<<<TJWL_META>>>\n";
  function metaOf(raw) {
    var s0 = String(raw || ""), i = s0.indexOf(SEPM), m = {};
    if (i >= 0) { try { m = JSON.parse(s0.slice(i + SEPM.length)) || {}; } catch (e) {} }
    return { text: i >= 0 ? s0.slice(0, i) : s0, meta: m, plain: i < 0 };
  }
  function hashOf(raw) { var h = 5381, s0 = String(raw || ""); for (var i = 0; i < s0.length; i++) h = ((h << 5) + h + s0.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s0.length.toString(36); }
  function passList(b) {
    var seen = {}, out = [];
    [b && b.context_passage].concat((b && b.context_passage_candidates) || []).forEach(function (raw, i) {
      if (!raw || !String(raw).trim() || seen[raw]) return; seen[raw] = 1;
      var m = metaOf(raw), mt = m.meta, orig = m.plain || !!mt.pasted || /dán|nguyên văn/i.test(mt.source || "");
      var label = orig ? "📄 Bài gốc" : mt.claude ? "🤖 Claude" : mt.provider === "openai" ? "✨ OpenAI" : mt.provider === "gemini" ? "✨ Gemini" : "📝 Khác";
      out.push({ raw: raw, ph: hashOf(raw), orig: orig, label: label, cur: i === 0, title: mt.title || "", snip: m.text.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 90) });
    });
    return out;
  }
  var ORIG_HUBS = ["hub_ea2025", "hub_digital_marketing", "hub_taxform1040", "hub_cia"];   /* bài học: luôn đọc bài gốc */
  function pathInfo(T, bid) {
    if (!T) return { hubOrig: false, hint: "" };
    var g = function (list, id) { return T[list].find(function (r) { return r.id === id; }) || {}; };
    var bl = g("blocks", bid), bt = g("batches", bl.batch_id), pg = g("pages", bt.page_id), sc = g("sections", pg.section_id), nb = g("notebooks", sc.notebook_id), hb = g("hubs", nb.hub_id);
    return { hubOrig: ORIG_HUBS.indexOf(hb.id) >= 0, hint: [nb.name, sc.name].filter(Boolean).join(" › ") };
  }
  /* 🪪 THẺ BLOCK trên bảng (TJ 2026-10-05): đường dẫn + tên + cấp độ + chip từ cho MỌI người; thanh tiến độ/trạng thái + khay 7 tab học + 🎮 Chơi game CHỈ ADMIN (host). Điện thoại: khay công cụ thu/mở như nút ghim Notebooks. */
  /* ✏️ BẤM BÚT mới hiện công cụ vẽ ở dưới (thay hàng qua lại trang); nhả ra thì hàng qua lại trang quay lại. Nút nổi trong bảng TỰ ẨN sau 3 giây không chạm (kiểu HelloTalk, TJ 2026-10-05). */
  var penMode = false, idleT = null;
  function drawerOpen() { var d = $("#bd-drawer"); return !!(d && !d.hidden); }
  function poke() {
    var el = $("#bd"); if (!el) return;
    el.classList.remove("bd-idle"); clearTimeout(idleT);
    var lk = $("#bd-lk");
    if (penMode || lookMode || drawerOpen() || (lk && !lk.hidden)) return;
    idleT = setTimeout(function () { el.classList.add("bd-idle"); }, 3000);
  }
  function setPen(on) {
    penMode = !!on; var el = $("#bd"); if (!el) return;
    if (penMode && lookMode) { lookMode = false; var lb = $("#bd-lkbtn"); if (lb) lb.classList.remove("on"); selWord(null); paintFeed(); }
    el.classList.toggle("bd-pen", penMode);
    var pb = $("#bd-penbtn"); if (pb) pb.classList.toggle("on", penMode);
    if (penMode && tool === "hand") tool = "pen"; if (!penMode) tool = "hand";   /* nhả bút -> về ✋ (kéo + 2 ngón phóng to/thu nhỏ cho mọi người) */
    paintTools(); poke(); setTimeout(fit, 0);
  }
  var cardInfo = {}, actCol; try { actCol = localStorage.getItem("tjwl_bd_actcol_v1"); } catch (e) {} actCol = actCol == null ? window.innerWidth < 700 : actCol === "1";
  function paintAct() { var a = $("#bd-act"); if (!a) return; a.classList.toggle("col", !!actCol); var t = $("#bd-acttog"); if (t) t.classList.toggle("on", !actCol); extraH(); }
  var relayoutN = 0;
  function relayout() { if (relayoutN > 2) return; relayoutN++; setTimeout(function () { try { fit(); } catch (e) {} setTimeout(function () { relayoutN = 0; }, 400); }, 0); }   /* thẻ tóm tắt đổi cao -> tính lại cỡ khung (tối đa 3 lần liền) */
  function extraH() {
    var bd = $("#bd"); if (!bd) return;
    if (!big && !bd.hidden) document.body.style.paddingTop = bd.offsetHeight + "px";   /* bảng nhỏ ở đầu trang: đẩy game xuống đúng chiều cao */
  }
  function paintCard(d) {
    var card = $("#bd-card"), act = $("#bd-act"); if (!card) return;
    var bid = d && (d.k === "wl" || d.k === "vt") ? d.bid : null, host = api.isHost();
    card.hidden = true; if (act) act.hidden = true;   /* TJ 2026-10-06: "khung Block bỏ hẳn luôn cho rộng" — ☰ ← → 🎮 của Admin nằm ở hàng nút dưới bảng */   /* v201: người chơi KHÔNG có thẻ Block — chỉ khung bảng full màn hình */ var sg0 = $("#bd-seg"); if (sg0 && !bid) sg0.hidden = true;
    var mo = $("#bd-more"); if (mo) mo.hidden = !(bid && host); var dt = $("#bd-dots"); if (dt) dt.hidden = !(bid && host);
    if (!bid) { var pe0 = $("#bd-path"); if (pe0 && !pe0.hidden) { pe0.hidden = true; relayout(); } extraH(); return; }
    paintAct();
    var sg = $("#bd-seg"); if (sg) { sg.hidden = false; sg.querySelectorAll("[data-sw]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.sw === d.k); }); }
    if (!$("#bd-cname").textContent) $("#bd-cname").textContent = d.name || "";   /* hiện tên ngay, dữ liệu còn lại về sau */
    extraH();
    var show = function (inf) {
      if (!inf || !curDoc() || curDoc().bid !== bid) return;
      $("#bd-crumb").textContent = inf.path || "";
      var pe = $("#bd-path"); if (pe) { var was = pe.hidden + pe.textContent; pe.textContent = inf.path || ""; pe.title = inf.path || ""; pe.hidden = !inf.path; if (was !== pe.hidden + pe.textContent) relayout(); } $("#bd-cname").textContent = inf.name || d.name || "";
      $("#bd-clv").innerHTML = Object.keys(inf.lv || {}).sort().map(function (k) { return '<span class="bd-lvb">' + inf.lv[k] + " " + esc(k) + "</span>"; }).join("");
      $("#bd-chips").innerHTML = (inf.terms || []).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
      var st = $("#bd-cst"), pg = $("#bd-cprog"), a = host && inf.adm;
      st.hidden = !a; pg.hidden = !a;
      if (a) { st.textContent = (inf.adm.passed ? "✓ Done · " : "") + inf.adm.pct + "%"; pg.firstChild.style.width = inf.adm.pct + "%"; }
      var du = $("#bd-cdue"), tg = $("#bd-ctag"), dd = curDoc();
      if (du) { du.hidden = !(a && inf.adm.due); du.textContent = a && inf.adm.due ? "● " + inf.adm.due : ""; }
      if (tg) { var lbl = dd && dd.lb ? String(dd.lb).replace(/^[^A-Za-zÀ-ỹ]+/, "").trim() : ""; tg.hidden = !(a && lbl); tg.textContent = lbl ? "🤖 " + lbl + " · Free" : ""; }
      extraH(); relayout();
    };
    if (cardInfo[bid] && (!host || cardInfo[bid].adm !== undefined)) { show(cardInfo[bid]); return; }
    if (!api.blockInfo) return;
    api.blockInfo(bid).then(function (inf) { cardInfo[bid] = inf; show(inf); }).catch(function () {});
  }
  function keyOf(d) { return d ? (d.k + ":" + (d.url || d.bid) + ":" + (d.p || 1) + (d.ph ? ":" + d.ph : "") + (d.fs != null ? ":f" + d.fs : "")) : ""; }
  function defAR(d) { return 4 / 3; }   /* TJ 2026-10-05: KHUNG CỐ ĐỊNH 4:3 cho mọi nội dung (bài đọc, bảng từ, PDF, ảnh…): đổi tài liệu khung không nhảy to nhỏ, trang PDF nằm lọt giữa khung */
  var feedBid = "";
  function d0zf(d) { return d && d.zf ? d.zf : 1; }
  function syncDoc(d) {
    var k = keyOf(d), nav = $("#bd-docnav");
    if (nav) {
      var host = api.isHost(), isPg = !!(d && (d.k === "pdf" || d.k === "wl" || d.k === "vt")), isTxt = !!(d && (d.k === "wl" || d.k === "vt"));
      nav.hidden = host ? false : (!d || !isPg);   /* người chơi: hàng lật trang/Block/Batch + 🔍 hiện khi có bài */
      var U0 = isTxt ? unitsOf(d) : null;
      $("#bd-dpg").textContent = !isPg ? "" : (d.k === "vt" ? "📋 " : d.k === "wl" ? "📖 " : "") + (d.p || 1) + (d.n ? " / " + d.n : "");   /* chỉ số trang của bài đọc / của bảng từ (không còn số Block/đơn vị) */
      ["#bd-dprev", "#bd-dnext"].forEach(function (x) { var e = $(x); if (e) e.hidden = !isPg || isTxt; });   /* v200: bài đọc / bảng từ cuộn, không lật trang */
      var isBlk = !!(d && d.bid && (d.k === "wl" || d.k === "vt"));
      document.querySelectorAll("#bd-docnav [data-nv]").forEach(function (e) { e.hidden = !isBlk; });
      if (isBlk) {
        var eg = api.edge ? api.edge(d.bid) : null, kp = $("#bd-kprev"), kn = $("#bd-knext");
        if (kp) { kp.textContent = eg && eg.first ? "⏮" : "⏪"; kp.title = eg && eg.first ? "Batch trước" : "Block trước"; }
        if (kn) { kn.textContent = eg && eg.last ? "⏭" : "⏩"; kn.title = eg && eg.last ? "Batch sau" : "Block sau"; }
      }
      var ib0 = $("#bd-iconbar"); if (ib0) { var pp0 = $("#bd-people"); ib0.hidden = nav.hidden && (!pp0 || pp0.hidden); }   /* chưa có nội dung: dải công cụ ẩn nhưng hàng avatar mọi người dưới bảng PHẢI còn (TJ 2026-10-06) */
      $("#bd-dtree").hidden = !host; $("#bd-dclose").hidden = !host || !d; $("#bd-dpg").hidden = !d || isTxt;
      $("#bd-dsrch").hidden = !isTxt;
      var sw0 = $("#bd-dswap"); if (sw0) sw0.hidden = !(host && d && d.k === "wl");
      if (!isTxt) { $("#bd-lk").hidden = true; $("#bd-lkq").hidden = true; }
    }
    var txt0 = !!(d && (d.k === "wl" || d.k === "vt")), bdl = $("#bd"), pnb = $("#bd-penbtn");
    paintFeed();   /* chừa chỗ khung "Từ vừa tra" TRƯỚC khi dựng bài -> lần dựng đầu đã đúng cỡ, không giật khi bấm nút */   /* (trong hàm này "isTxt" là biến boolean) */
    if (bdl) bdl.classList.toggle("bd-txt", txt0);   /* CSS: lớp vẽ nhường chạm/lăn chuột cho bài cuộn */
    if (pnb) pnb.hidden = txt0; if (txt0 && penMode) setPen(false);   /* bút vẽ tự do không dùng trên bài cuộn (nét sẽ lệch chữ) — chạm câu để tô sáng */
    paintCard(d); paintMe(); paintPeople(); paintHostAway(); notifyParent(open && !mini);
    if (k === docKey) { if (txt0) paintHL(d); return; }
    lastA = null; lfz = Math.max(0.7, Math.min(2.6, +d0zf(d) || 1));
    var nbid = d && d.bid || ""; if (nbid !== feedBid) { feedBid = nbid; lkFeed = []; }   /* sang Block khác -> Từ vừa tra làm mới (mọi máy cùng đổi Block nên cùng xoá) */
    stash[docKey] = { items: items, order: order };   /* cất nét của trang cũ */
    var sv = stash[k] || { items: {}, order: [] }; items = sv.items; order = sv.order; mine = []; redo = [];
    var wasDoc = docKey.split(":").slice(0, 2).join(":"), isDoc = k.split(":").slice(0, 2).join(":");
    docKey = k; setAR(defAR(d)); if (wasDoc !== isDoc) zoomReset();
    var el = $("#bd"); if (el) { big = wantBig(d); paintOpen(); }
    draw(); paintTexts(); paintTools(); paintDoc(d);
  }
  function paintMe() {
    var el = $("#bd-me"), m = api && api.me ? api.me() : null; if (!el) return;
    if (!m || !m.name) { el.hidden = true; return; }
    var av = String(m.avatar || ""), pic = /^https?:/.test(av) ? '<img alt="" src="' + esc(av) + '">' : '<span class="bd-meav">' + esc(av || "👤") + "</span>";
    el.innerHTML = '<span class="bd-mering">' + pic + (api.isHost() ? '<i title="Host">👑</i>' : "") + "</span><b>" + esc(m.name) + (m.name_no > 1 ? " #" + m.name_no : "") + "</b>";   /* kiểu HelloTalk: vòng tròn avatar, tên ở dưới */
    el.hidden = false;
    var ub = $("#bd-ubar");
    if (ub) {
      var showU = !(api && api.isHost()) && !document.body.classList.contains("embed"), wasH = ub.hidden; ub.hidden = !showU;
      var uh = showU ? '<span class="bd-mering">' + pic + "</span><b>" + esc(m.name) + (m.name_no > 1 ? " #" + m.name_no : "") + "</b>" + (curDoc() ? "" : '<span class="bd-ubhint">⏳ Đang chờ host chọn nội dung lên bảng…</span>') : "";
      if (ub._h !== uh) { ub._h = uh; ub.innerHTML = uh; relayout(); } else if (wasH !== ub.hidden) relayout();   /* thanh tên đổi cao -> tính lại khung (trước đây bảng quá cao, đẩy hàng avatar dưới ra khỏi màn) */
    }
  }
  function paintHostAway() {   /* TJ 2026-10-06: host KHÔNG có trong phòng (đang ở trang khác / mất mạng) -> người chơi thấy "chờ host" thay vì 1 bảng đóng băng */
    var el = $("#bd"); if (!el || !api || !api.hostHere) return;
    var away = !api.isHost() && !api.hostHere(); if (el.classList.contains("bd-hostaway") !== away) el.classList.toggle("bd-hostaway", away);
  }
  var peopleKey = "", PFLAG = { vi: "🇻🇳", en: "🇺🇸", zh: "🇨🇳", es: "🇪🇸" };   /* cờ = tiếng mẹ đẻ người đó chọn (như chip phòng chờ) */
  function avHTML(a) { a = String(a || ""); return /^https?:/.test(a) ? '<img alt="" src="' + esc(a) + '">' : '<span class="bd-meav">' + esc(a || "👤") + "</span>"; }
  function tellParent() {   /* TJ 2026-10-06: Admin bấm 🖤 Bảng (màn danh sách Block của Learning) cũng thấy avatar mình ở trên + người trong phòng ở dưới */
    if (!(window.parent && window.parent !== window) || !api) return;
    var m = api.me ? api.me() : null, L = (api.online ? api.online() : []).map(function (p) { return { id: p.id, name: p.name, no: p.no, avatar: p.avatar, host: !!p.host, lang: p.lang }; });
    var msg = { type: "tjwl-board-people", me: m ? { id: m.id, name: m.name, no: m.name_no, avatar: m.avatar, host: api.isHost() } : null, people: L, mine: myId() }, k = JSON.stringify(msg);
    if (k === tellParent._k) return; tellParent._k = k;
    try { window.parent.postMessage(msg, location.origin); } catch (e) {}
  }
  function paintPeople() {
    var el = $("#bd-people"); if (!el || !api) return;
    tellParent();
    var mine = myId(), L = (api.online ? api.online() : api.players()).slice();
    L.sort(function (a, b) { return (b.id === mine) - (a.id === mine) || (!!b.host - !!a.host) || String(a.name || "").localeCompare(String(b.name || "")); });
    var k = L.map(function (p) { return p.id + ":" + p.name + ":" + p.avatar + ":" + (p.host ? 1 : 0) + ":" + (p.lang || ""); }).join("|") + "#" + mine;
    if (k === peopleKey) return; peopleKey = k;
    el.hidden = !L.length;
    var ibp = $("#bd-iconbar"), nvp = $("#bd-docnav"); if (ibp && nvp) ibp.hidden = nvp.hidden && el.hidden;   /* hàng avatar chung khối với dải công cụ: có người thì khối phải hiện */
    el.innerHTML = L.map(function (p) {
      return '<div class="bd-pp1' + (p.id === mine ? " me" : "") + '" title="' + esc(p.name || "") + '"><span class="bd-mering">' + avHTML(p.avatar) + (p.host ? '<i title="Host">👑</i>' : "") + (PFLAG[p.lang] ? '<u>' + PFLAG[p.lang] + "</u>" : "") + "</span><b>" + esc(p.name || "?") + (p.no > 1 ? " #" + p.no : "") + "</b></div>";
    }).join("");
    relayout();
  }
  function paintDoc(d) {
    var box = $("#bd-doc"); if (!box) return;
    var vtb = $("#bd-vtbar"), h0 = vtb && vtb.hidden;
    if (vtb) { vtb.hidden = !isTxt(d); var va = $("#bd-vtadd"); if (va) va.hidden = !api.isHost(); }
    if (h0 !== (vtb && vtb.hidden)) relayout();   /* thanh trên đổi cao -> tính lại khung bảng */
    endRead();
    var job = ++docJob; box.innerHTML = "";
    if (!d && api && !api.isHost()) box.innerHTML = '<div class="bd-docmsg bd-wait">⏳ Chờ host chọn bài…</div>';   /* v201: host đang ở danh sách Block -> người chơi không thấy bảng trống trơn */ wrap.classList.toggle("bd-hasdoc", !!d); wrap.classList.toggle("bd-office", !!(d && d.k === "office"));
    if (!d) return;
    if (d.k === "img") { box.innerHTML = '<img alt="" src="' + esc(d.url) + '">'; return; }
    if (d.k === "pdf") return pdfPage(d, job);
    if (isTxt(d)) return comboPage(d, job);   /* v207 (TJ 2026-10-06): bỏ 2 tab — BẢNG TỪ VỰNG rồi tới BÀI ĐỌC trong 1 trang cuộn, đúng thứ tự Learning */
    if (d.k === "office") { box.innerHTML = '<iframe class="bd-office-f" src="https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(d.url) + '" allowfullscreen></iframe><a class="bd-office-a" target="_blank" rel="noopener" href="' + esc(d.url) + '">⬇ ' + esc(d.name || "file") + "</a>"; return; }
  }
  function loadScript(src) { return new Promise(function (ok, no) { var sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); }
  var PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  async function pdfLib() {
    if (!window.pdfjsLib) await loadScript(PDFJS + "pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; return window.pdfjsLib;
  }
  async function pdfPage(d, job) {
    var box = $("#bd-doc"); box.innerHTML = '<div class="bd-docmsg">⏳ PDF…</div>';
    try {
      var lib = await pdfLib(); var doc = pdfCache[d.url] || (pdfCache[d.url] = await lib.getDocument(d.url).promise);
      if (job !== docJob) return;
      var n = doc.numPages; if (api.isHost() && d.n !== n) { docSet(Object.assign({}, d, { n: n })); }
      var page = await doc.getPage(Math.min(n, d.p || 1)); if (job !== docJob) return;
      var vp0 = page.getViewport({ scale: 1 }), pr = window.devicePixelRatio || 1;
      var want = Math.min(3000, Math.max(wrap.clientWidth * pr * 2.5, 900)), sc = want / vp0.width, vp = page.getViewport({ scale: sc });   /* vẽ dày gấp ~2.5 lần để phóng to vẫn nét */
      var c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height); c.className = "bd-pdfc";
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      if (job !== docJob) return; box.innerHTML = ""; box.appendChild(c);
    } catch (e) { if (job === docJob) box.innerHTML = '<div class="bd-docmsg">⚠ ' + esc(e.message || e) + "</div>"; }
  }
  /* 🔠 CỠ CHỮ TỰ VỪA KHUNG (TJ 2026-10-04: "chữ fit với khung, không mất chữ"): tìm cỡ chữ LỚN NHẤT mà nội dung vẫn nằm gọn trong khung
     (nhị phân, từ 2.2% tới 5.8% bề rộng khung). Trang chia theo số ký tự giống nhau trên mọi máy; cỡ chữ thì mỗi máy tự đo theo khung của mình. */
  /* cỡ chữ CHUNG (TJ 2026-10-05: "chữ giữa các slide không đều"): mọi trang cùng 1 cỡ theo mức fs (0..4); chữ nhỏ -> mỗi trang nhiều chữ hơn,
     chữ to -> ít hơn. Số chữ mỗi trang tính từ mức fs (cùng kết quả trên mọi máy), KHÔNG co chữ theo từng trang nữa. */
  var FS = [0.030, 0.036, 0.043, 0.052, 0.062], FS_DEF = 2, VT_ROWL = [8, 6, 5, 4, 3];   /* ít dòng mỗi trang -> chữ to (≈ cỡ chip từ ở thẻ trên); A−/A+ đổi số dòng. TJ 2026-10-05: "100% mà chữ nhỏ xíu" */
  function fsOf(d) { var f = d && d.fs; return f == null ? FS_DEF : Math.max(0, Math.min(FS.length - 1, +f || 0)); }
  /* v200 (TJ 2026-10-05: "1 trang duy nhất, hất lên hất xuống để đọc"): bài đọc + bảng từ là 1 TRANG CUỘN. Cỡ chữ = cỡ đọc dễ chịu theo bề rộng
     của từng máy (15–22px) × hệ số A−/A+ RIÊNG máy đó (localStorage) — không co giãn cho vừa khung nữa. */
  var lfz = 1;   /* hệ số cỡ chữ DÙNG CHUNG cả phòng (bdoc.zf) */
  function fitDocText() {
    var doc = $("#bd-doc"); if (!doc || !doc.querySelector(".bd-scroll")) return;
    var w = doc.clientWidth; if (!w) return;
    var b = scBox(), a = b ? anchorOf(b) : null, vt = doc.querySelector(".bd-vt"), wl = doc.querySelector(".bd-wl");
    /* TJ 2026-10-06: "bảng từ vựng mặc định phải vừa khung vàng, dù to hay nhỏ vẫn phải là BẢNG đủ cột, tự canh chỉnh" —
       cỡ chữ bảng từ = vừa đúng bề ngang khung ở 100% (đủ 7 cột; khung quá hẹp thì bỏ 2 cột Word form + Phonetic còn 5 cột, vẫn là bảng); lfz (A−/A+/chụm) nhân thêm trên đó. */
    if (vt) {
      var usable = w * 0.92, f7 = usable / 40.5, f6 = usable / 36, f5 = usable / 31, mode = f7 >= 11.5 ? 7 : f6 >= 11 ? 6 : 5;   /* 7 cột đủ -> 6 (bỏ Word form) -> 5 (bỏ thêm Level); LUÔN giữ Phiên âm */
      var fit = Math.max(9, Math.min(20, mode === 7 ? f7 : mode === 6 ? f6 : f5));
      vt.classList.toggle("c7", mode === 7); vt.classList.toggle("c6", mode === 6); vt.classList.toggle("c5", mode === 5);
      vt.style.fontSize = (fit * lfz).toFixed(2) + "px";
    }
    if (wl) wl.style.fontSize = (Math.max(15, Math.min(20, 9 + w * 0.022)) * lfz).toFixed(2) + "px";   /* bài đọc: cỡ đọc dễ chịu theo bề rộng (15–20px) */
    doc.style.fontSize = "";
    if (b && a) goAnchor(b, a);   /* đổi cỡ chữ / xoay máy: giữ đúng chỗ đang đọc */
  }
  /* chia bài đọc thành trang theo CÂU (cùng kết quả trên mọi máy) */
  function splitPagesOld(raw, lvl) {
    var cjk = (raw.match(/[\u3000-\u9fff\uac00-\ud7af]/g) || []).length / Math.max(1, raw.length) > 0.3, f = FS[lvl == null ? FS_DEF : lvl], budget = Math.round((cjk ? 1.1 : 2.2) / (f * f));   /* v172: khung 4:3, vùng chữ ~80% chiều cao -> ít chữ hơn mỗi trang (trước: khung dọc 3:4) */
    var paras = raw.split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean), pages = [], curP = "";
    paras.forEach(function (p) {
      var units = p.match(/[^.!?。！？]+[.!?。！？]+["')\]]*\s*|[^.!?。！？]+$/g) || [p], flat = [];
      units.forEach(function (u) {   /* câu quá dài (không có dấu chấm) -> cắt cứng theo từ/ký tự để trang không phình */
        while (u.length > budget * 1.3) { var cut = cjk ? budget : u.lastIndexOf(" ", budget); if (cut < budget * 0.5) cut = budget; flat.push(u.slice(0, cut)); u = u.slice(cut); }
        flat.push(u);
      });
      flat.forEach(function (u, i) {
        var sep = curP ? (i === 0 ? "\n\n" : "") : "";
        if (curP && (curP + sep + u).length > budget - (cjk ? 40 : 90)) { pages.push(curP.trim()); curP = ""; sep = ""; }   /* trang 1 còn tiêu đề */
        curP += (curP && i === 0 ? "\n\n" : "") + u;
      });
    });
    if (curP.trim()) pages.push(curP.trim());
    return pages;
  }
  /* 📄 CHIA TRANG BẰNG ĐO THẬT (TJ 2026-10-05: "bố cục từng trang vừa vặn, không cuộn"): xếp thử từng câu vào 1 khung đo có CÙNG tỉ lệ + cỡ chữ như vùng bài đọc
     (khung logic 900×540, chữ = FS × 0.45×900) cho tới khi tràn thì sang trang mới -> mỗi trang vừa khít, mọi máy chia giống nhau (cỡ chữ thật tỉ lệ theo khung). */
  var spCache = {};
  function splitPages(raw, lvl, title) {
    var f = lvl == null ? FS_DEF : lvl, key = hashOf(raw) + ":" + f + ":" + (title ? 1 : 0);
    if (spCache[key]) return spCache[key].slice();
    var m = null, hold = null;
    try {
      var paras = raw.split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); if (!paras.length) return [];
      hold = document.createElement("div"); hold.style.cssText = "position:fixed;left:-9999px;top:0;width:900px;height:540px;visibility:hidden;pointer-events:none";   /* % padding của .bd-wl tính theo bề rộng hộp này (900px) như ngoài thật */
      m = document.createElement("div"); m.className = "bd-wl bd-measure"; m.style.fontSize = (405 * FS[f]).toFixed(2) + "px";
      hold.appendChild(m); document.body.appendChild(hold);
      var head = "<h3>" + esc(title || "Title") + "</h3>";
      var fits = function (txt) { m.innerHTML = head + "<p>" + wlHTML(txt) + "</p>"; return m.scrollHeight <= m.clientHeight + 1; };
      var pages = [], cur = "", U = [];
      paras.forEach(function (para) {
        var units = para.match(/[^.!?。！？]+[.!?。！？]+["')\]]*\s*|[^.!?。！？]+$/g) || [para];
        units.forEach(function (u, i) {
          U.push({ u: u, np: i === 0 });
          var cand = cur ? cur + (i === 0 ? "\n\n" : "") + u : u;
          if (cur && !fits(cand)) { pages.push(cur.trim()); cur = u; } else cur = cand;
        });
      });
      if (cur.trim()) pages.push(cur.trim());
      /* TJ 2026-10-05: "canh đều phân bổ" — cách trên lấp đầy trang đầu, trang cuối còn ít chữ. Giữ SỐ TRANG, chia lại câu cho các trang dài gần bằng nhau
         (ngắt trước câu có điểm giữa vượt k/n tổng số ký tự); trang nào không vừa khung đo thì giữ cách chia cũ. */
      if (pages.length > 1) {
        var n = pages.length, tot = 0, at = 0, bal = [], bc = "";
        U.forEach(function (x) { tot += x.u.length; });
        U.forEach(function (x) {
          var mid = at + x.u.length / 2; at += x.u.length;
          if (bc && bal.length < n - 1 && mid > tot * (bal.length + 1) / n) { bal.push(bc.trim()); bc = x.u; }
          else bc = bc ? bc + (x.np ? "\n\n" : "") + x.u : x.u;
        });
        if (bc.trim()) bal.push(bc.trim());
        if (bal.length === n && bal.every(function (pg) { return fits(pg); })) pages = bal;
      }
      document.body.removeChild(hold); hold = null;
      spCache[key] = pages; return pages.slice();
    } catch (e) { if (hold && hold.parentNode) hold.parentNode.removeChild(hold); return splitPagesOld(raw, lvl); }
  }
  function wlPick(d, b) { var items = passList(b), pick = d.ph ? items.find(function (x) { return x.ph === d.ph; }) : null; return { items: items, pick: pick }; }
  function wlScrollHTML(raw) {   /* đoạn -> <p>, câu -> <span class="bd-s" data-s=số thứ tự câu> (giống nhau trên mọi máy) */
    var k = 0;
    return raw.split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (para) {
      var units = para.match(/[^.!?。！？]+[.!?。！？]+["')\]]*\s*|[^.!?。！？]+$/g) || [para];
      return "<p>" + units.map(function (u) { return '<span class="bd-s" data-s="' + (k++) + '">' + wlHTML(u) + "</span>"; }).join("") + "</p>";
    }).join("");
  }
  function wlHTML(pg) {   /* mỗi từ tiếng Anh bọc <span class="bd-w"> để chạm tra nghĩa; [term] của Block là <b class="bd-term"> (chạm = tra cả cụm) */
    var out = "", last = 0, m, re = /\[([^\]]{1,60})\]/g, cjk = (pg.match(/[\u3000-\u9fff\uac00-\ud7af]/g) || []).length / Math.max(1, pg.length) > 0.3;
    function plain(x) {
      if (cjk) return esc(x).replace(/\n\n/g, "</p><p>");
      return x.split(/([A-Za-z][A-Za-z'’-]*)/).map(function (z, i) { return i % 2 ? '<span class="bd-w">' + esc(z) + "</span>" : esc(z).replace(/\n\n/g, "</p><p>"); }).join("");
    }
    while ((m = re.exec(pg))) { out += plain(pg.slice(last, m.index)) + '<b class="bd-term">' + esc(m[1]) + "</b>"; last = m.index + m[0].length; }
    return out + plain(pg.slice(last));
  }
  function vtSection(rows, d) {
    var VR = Math.max(1, rows.length);
      var vtHead = '<div class="bd-vh"><span></span><span>Vocabulary</span><span>Level</span><span>Word form</span><span>Phonetic</span><span>English definition</span><span>' + (api.lang && api.lang() === "en" ? "Meaning" : api.lang && api.lang() === "zh" ? "中文意思" : api.lang && api.lang() === "es" ? "Significado" : "Vietnamese meaning") + "</span></div>";
      var vtInner = function (pp) { var part = rows.slice((pp - 1) * VR, pp * VR); return '<h3>📘 1. Danh sách từ vựng cần học' + (d.name ? ' <small>· ' + esc(d.name) + "</small>" : "") + "</h3>" + '<div class="bd-vtph"></div>' + vtHead + (part.length ? part.map(function (w, i) {
        var idx = (pp - 1) * VR + i;
        return '<div class="bd-vr" data-i="' + idx + '"><span class="bd-vsay" data-say="' + esc(w.term) + '">🔊</span><span class="bd-vtm"><b class="bd-vterm">' + esc(w.term) + '</b><span class="bd-vstar" data-star="' + esc(w.id || "") + '">☆</span></span><span class="bd-vl">' + esc(w.level || "") + '</span><span class="bd-vf">' + (w.pos ? "<i>" + esc(w.pos) + "</i>" : "") + '</span><span class="bd-vph">' + (w.ipa ? esc(w.ipa) : "—") + '</span><span class="bd-ve">' + esc(w.def_en || "") + '</span><span class="bd-vd">' + esc(vtMeaning(w)) + "</span></div>";
      }).join("") : '<div class="bd-docmsg">—</div>'); };
    return '<div class="bd-vt">' + vtInner(1) + "</div>";
  }
  async function comboPage(d, job) {
    var box = $("#bd-doc"); box.innerHTML = '<div class="bd-docmsg">⏳</div>';
    try {
      var b = wlCache[d.bid] || (wlCache[d.bid] = await api.block(d.bid)); if (job !== docJob) return;
      var pk = wlPick(d, b);
      if (d.ph && !pk.pick) { b = wlCache[d.bid] = await api.block(d.bid); pk = wlPick(d, b); if (job !== docJob) return; }   /* bài vừa tạo trên máy khác */
      var mm = metaOf(pk.pick ? pk.pick.raw : pk.items[0] ? pk.items[0].raw : ""), raw = mm.text, meta = mm.meta;
      var rows = vtCache[d.bid] || (vtCache[d.bid] = await api.words(d.bid)); if (job !== docJob) return;
      if (api.isHost() && (d.n !== 1 || (d.p || 1) !== 1)) docSet(Object.assign({}, d, { n: 1, p: 1 }));
      var ttl = meta.title || d.name;
      box.innerHTML = '<div class="bd-both bd-scroll" lang="en">' + vtSection(rows, d) + '<div class="bd-wl">' + (ttl ? "<h3>" + esc(ttl) + "</h3>" : "") + (raw.trim() ? wlScrollHTML(raw) : "<p>(Block này chưa có bài đọc)</p>") + "</div></div>";
      paintStars(rows); afterTxt(d);
    } catch (e) { if (job === docJob) box.innerHTML = '<div class="bd-docmsg">⚠ ' + esc(e.message || e) + "</div>"; }
  }
  async function wlPage(d, job) {
    var box = $("#bd-doc"); box.innerHTML = '<div class="bd-docmsg">⏳</div>';
    try {
      var b = wlCache[d.bid] || (wlCache[d.bid] = await api.block(d.bid)); if (job !== docJob) return;
      var pk = wlPick(d, b);
      if (d.ph && !pk.pick) { b = wlCache[d.bid] = await api.block(d.bid); pk = wlPick(d, b); if (job !== docJob) return; }   /* bài vừa tạo trên máy khác */
      var mm = metaOf(pk.pick ? pk.pick.raw : pk.items[0] ? pk.items[0].raw : ""), raw = mm.text, meta = mm.meta;
      if (api.isHost() && (d.n !== 1 || (d.p || 1) !== 1)) docSet(Object.assign({}, d, { n: 1, p: 1 }));
      var ttl = meta.title || d.name;
      box.innerHTML = '<div class="bd-wl bd-scroll" lang="en">' + (ttl ? "<h3>" + esc(ttl) + "</h3>" : "") + (raw.trim() ? wlScrollHTML(raw) : "<p>(Block này chưa có bài đọc)</p>") + "</div>";
      afterTxt(d);
    } catch (e) { if (job === docJob) box.innerHTML = '<div class="bd-docmsg">⚠ ' + esc(e.message || e) + "</div>"; }
  }
  /* ====== BẢNG TỪ: chức năng y chang Learning (TJ 2026-10-05) — Thu gọn · tốc độ · Copy · Bổ sung từ · Dừng · Đọc tất cả từ · Đọc + định nghĩa · ⭐ ====== */
  var starMap = {}, reading = 0;
  function paintStars(rows) {
    var ids = (rows || []).map(function (w) { return w.id; }).filter(Boolean); if (!ids.length || !api.starState) return;
    api.starState(ids).then(function (m) {
      Object.keys(m || {}).forEach(function (k) { starMap[k] = !!m[k]; });
      document.querySelectorAll("#bd-doc .bd-vstar").forEach(function (e) { var on = !!starMap[e.dataset.star]; e.textContent = on ? "★" : "☆"; e.classList.toggle("on", on); });
    }).catch(function () {});
  }
  async function toggleStar(el) {
    var id = el.dataset.star; if (!id || !api.toggleStar) return;
    var on = await api.toggleStar(id, !starMap[id]); starMap[id] = !!on; el.textContent = on ? "★" : "☆"; el.classList.toggle("on", !!on);
  }
  function placeVtBar() {}   /* v206: thanh âm thanh nằm ở thanh trên cùng (ngoài bảng), không còn bám vào bảng từ */
  /* ====== 🔊 ĐỌC ĐỒNG BỘ + KARAOKE (TJ 2026-10-06) ======
     Máy nào bấm đọc thì máy đó phát tiếng; "đang đọc tới đâu" (câu + TỪNG TỪ / dòng từ vựng) gửi cho CẢ PHÒNG -> mọi máy tô sáng + tự cuộn y hệt nhau.
     ⏸ Tạm dừng giữ nguyên vị trí, ▶ Tiếp tục đọc từ câu / dòng đó; bấm lại "Đọc bài" / "Đọc tất cả từ" thì đọc từ đầu. */
  var SPL = { vi: "vi-VN", zh: "zh-CN", es: "es-ES", en: "en-US" };
  var readOn = false, readPos = null, readRemote = null, uttKeep = [];
  var noSoundAt = 0;
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function stopReading() { reading++; readOn = false; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
  function clearReadHL() { document.querySelectorAll("#bd-doc .bd-rd, #bd-doc .bd-rw, #bd-doc .bd-vr.rd").forEach(function (x) { x.classList.remove("bd-rd", "bd-rw", "rd"); }); }
  function endRead() { remoteStop(); stopReading(); readPos = null; clearReadHL(); paintReadBtn(); }   /* đổi tài liệu / kết thúc: xoá sạch, không phát tin */
  var lastSayAt = 0;
  function sayWord(w) {   /* bấm loa / chạm từ / gõ tra từ: đọc ĐÚNG từ đó. Đang đọc cả bài thì tạm dừng (kẻo câu kế tiếp đọc đè lên) */
    lastSayAt = Date.now(); if (readOn) pauseRead(); remoteStop(); api.say(w, true);
  }
  var READ_TOP = 70;   /* px từ mép trên khung tới chỗ đang đọc — CÙNG trên mọi máy */
  function keepInView(b, el, force) {   /* trả true nếu đã cuộn */
    var r = el.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (force || r.top < br.top + 24 || r.bottom > br.top + Math.max(180, br.height * 0.62)) { progAt = Date.now(); var b0 = b.scrollTop; b.scrollTop += Math.round(r.top - br.top - READ_TOP); return b.scrollTop !== b0; }
    return false;
  }
  var ervT = 0;
  function ensureReadVisible() {   /* máy KHÔNG đọc: theo vị trí cuộn của máy đọc; chỉ cuộn thêm khi chỗ đang đọc lọt hẳn ngoài khung */
    var b = scBox(); if (!b || readOn) return;
    var el = b.querySelector(".bd-rw") || b.querySelector(".bd-s.bd-rd") || b.querySelector(".bd-vr.rd"); if (!el) return;
    var r = el.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (r.top < br.top + 4 || r.bottom > br.bottom - 4) keepInView(b, el, true);
  }
  function soonEnsure() { clearTimeout(ervT); ervT = setTimeout(ensureReadVisible, 160); }
  function applyReadHL(m, remote) {   /* m = {k:"wl", s: câu, w: từ} | {k:"vt", i: dòng} | {k:null} — chạy trên MỌI máy */
    clearReadHL(); var b = scBox();
    if (!m || !m.k || !b) { paintReadBtn(); return; }
    var target = null;
    if (m.k === "vt") { var row = b.querySelector('.bd-vr[data-i="' + m.i + '"]'); if (row) { row.classList.add("rd"); target = row; } }
    else {
      var sn = b.querySelector('.bd-s[data-s="' + m.s + '"]');
      if (sn) { sn.classList.add("bd-rd"); target = sn; if (m.w >= 0) { var we = sn.querySelectorAll(".bd-w, .bd-term")[m.w]; if (we) { we.classList.add("bd-rw"); target = we; } } }
    }
    if (target) { if (!remote) { if (keepInView(b, target)) sendAnchor(); } else soonEnsure(); }   /* máy đọc: cuộn rồi gửi vị trí cho cả phòng; máy khác: theo vị trí đó (không tự cuộn riêng) */
    paintReadBtn();
  }
  function shareRead(m) { applyReadHL(m); send(Object.assign({ t: "rd" }, m)); }
  function paintSndBtn() {
    var b = document.querySelector("#bd-vtbar [data-snd]"); if (!b || !api || !api.soundOn) return;
    var rsel = $("#bd-vtrate"); if (rsel) rsel.disabled = !api.isHost();   /* người chơi: chỉ xem tốc độ của host */
    var vr = document.querySelector("#bd-vtbar .bd-vol");   /* thanh âm lượng: giá trị lấy từ game (lưu trên máy), tắt tiếng thì làm mờ như game */
    if (vr && api.volume && document.activeElement !== vr) { var vv = Math.round(api.volume() * 100); if (+vr.value !== vv) vr.value = vv; }
    var on = api.soundOn(), k = on ? "1" : "0"; if (vr) vr.disabled = !on;
    if (b.dataset.on === k) return; b.dataset.on = k;
    b.innerHTML = (on ? "🔊" : "🔇") + ' <span>' + (on ? "Có tiếng" : "Tắt tiếng") + "</span>"; b.classList.toggle("off", !on);
    b.title = on ? "Đang BẬT tiếng trên máy này (đeo tai nghe thì cứ bật) — bấm để tắt" : "Đang TẮT tiếng trên máy này — bấm để bật";
  }
  /* máy KHÔNG bấm đọc nhưng đang BẬT tiếng: tự đọc theo đúng câu / từ máy đọc đang tới (nghe riêng bằng tai nghe); hết câu thì chờ tin của câu kế */
  var rsTok = 0;
  function remoteStop() { rsTok++; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
  function remoteSpeak(m) {
    if (!m.k || m.paused) { remoteStop(); return; }
    if (!m.sp || !api.soundOn || !api.soundOn() || !window.speechSynthesis) return;
    if (Date.now() - lastSayAt < 5000) return;   /* đang nghe 1 từ mình vừa bấm -> không chen câu của host vào */
    var my = ++rsTok, d = curDoc(), rate = +m.r || 0.85;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    (async function () {
      await delay(60); if (my !== rsTok) return;
      if (m.k === "wl") { var sn = scBox() && scBox().querySelector('.bd-s[data-s="' + m.s + '"]'); if (sn) await speakOne(sn.textContent, "en-US", rate); }
      else { var w = d && (vtCache[d.bid] || [])[m.i]; if (w) { await speakOne(w.term, "en-US", rate); if (my !== rsTok) return; if (m.def && w.def_en) await speakOne("it means " + w.def_en, "en-US", rate); } }
    })();
  }
  function paintReadBtn() {
    paintSndBtn();
    var st = document.querySelector('#bd-vtbar [data-vt="stop"]'); if (!st) return;
    var mode = readOn ? "pause" : readPos ? "resume" : "idle";
    if (st.dataset.m !== mode) {
      st.dataset.m = mode;
      st.innerHTML = mode === "pause" ? '⏸ <span>Tạm dừng</span>' : mode === "resume" ? '▶ <span>Tiếp tục</span>' : '■ <span>Dừng</span>';
      st.title = mode === "pause" ? "Tạm dừng (giữ vị trí)" : mode === "resume" ? "Đọc tiếp từ chỗ đang dừng" : "Chưa đọc";
    }
    st.classList.toggle("pri", mode === "resume"); st.disabled = mode === "idle";
    var g = document.querySelector("#bd-vtbar [data-wlread]"); if (g) g.classList.toggle("on", readOn && readPos && readPos.k === "wl");
  }
  function canRead() { return !!(api && api.isHost()); }   /* TJ 2026-10-06: chỉ HOST bấm đọc / tạm dừng; người chơi chỉ có công tắc 🔊 riêng của máy mình */
  function toggleRead() {
    if (!canRead()) return;
    if (readOn) { var p = Object.assign({}, readPos); stopReading(); shareRead(Object.assign(p, { paused: 1 })); return; }
    if (readPos) { if (readPos.k === "wl") readPassage(readPos.s); else readAll(!!readPos.def, readPos.i); }
  }
  function sentWords(sn) {   /* [{start}] vị trí ký tự của từng từ trong câu (khớp textContent) để đổi charIndex -> từ */
    var out = [], els = sn.querySelectorAll(".bd-w, .bd-term");
    for (var k = 0; k < els.length; k++) { var r = document.createRange(); r.selectNodeContents(sn); r.setEnd(els[k], 0); out.push({ start: r.toString().length }); }
    return out;
  }
  async function readSentence(sn, i, rate, my) {   /* TJ 2026-10-06: bỏ karaoke từng chữ (nhảy bậy) — chỉ tô sáng + cuộn theo NGUYÊN CÂU */
    if (my !== reading) return;
    if (readPos) readPos.w = -1;
    shareRead({ k: "wl", s: i, w: -1, sp: 1, r: rate });   /* sp = bắt đầu câu mới: máy khác đang BẬT tiếng thì đọc theo; r = tốc độ của host */
    await speakOne(sn.textContent, "en-US", rate);
  }
  function curRate() { var sel = $("#bd-vtrate"); return sel ? parseFloat(sel.value) || 0.85 : 0.85; }   /* đọc lại từ ô tốc độ ở MỖI câu / từ -> đổi giữa chừng có hiệu lực ngay */
  function setRateUI(r) { var sel = $("#bd-vtrate"); if (sel && r && Math.abs(parseFloat(sel.value) - r) > 0.001) sel.value = String(r); }
  async function readPassage(fromS) {
    if (!window.speechSynthesis || !canRead()) return;
    stopReading(); var my = reading; readPos = null;
    await delay(90); if (my !== reading) return;   /* Chrome: speak() ngay sau cancel() hay bị nuốt */
    var b = scBox(), sel = $("#bd-vtrate"), rate = sel ? +sel.value || 0.85 : 0.85, ss = b ? b.querySelectorAll(".bd-s") : [];
    if (!ss.length) return;
    readOn = true; paintReadBtn(); if (api.soundOn && !api.soundOn()) feedNote("🔇 Máy này đang TẮT tiếng — bấm 🔊 trên thanh trên để nghe (màn hình vẫn chạy theo lời đọc).");
    for (var i = fromS | 0; i < ss.length && my === reading; i++) { readPos = { k: "wl", s: i }; await readSentence(ss[i], i, curRate(), my); }
    if (my === reading) { readOn = false; readPos = null; shareRead({ k: null }); }
  }
  async function readAll(withDef, from) {
    var d = curDoc(); if (!isTxt(d) || !window.speechSynthesis || !canRead()) return;
    stopReading(); var my = reading; readPos = null;
    await delay(90); if (my !== reading) return;
    var rate = parseFloat(($("#bd-vtrate") || {}).value) || 0.85, ws = vtCache[d.bid] || [];
    readOn = true; paintReadBtn(); if (api.soundOn && !api.soundOn()) feedNote("🔇 Máy này đang TẮT tiếng — bấm 🔊 trên thanh trên để nghe (màn hình vẫn chạy theo lời đọc).");
    for (var i = from | 0; i < ws.length && my === reading; i++) {
      rate = curRate(); readPos = { k: "vt", i: i, def: withDef ? 1 : 0 }; shareRead({ k: "vt", i: i, sp: 1, def: withDef ? 1 : 0, r: rate });
      await speakOne(ws[i].term, "en-US", rate); if (my !== reading) break;
      if (withDef && ws[i].def_en) { await speakOne("it means " + ws[i].def_en, "en-US", rate); if (my !== reading) break; }   /* y như Learning: từ -> "it means" + định nghĩa tiếng Anh (không đọc nghĩa Việt) */
    }
    if (my === reading) { readOn = false; readPos = null; shareRead({ k: null }); }
  }
  function speakOne(text, lang, rate, onB) {
    if (api && api.speak) return api.speak(text, lang, rate, onB, api.soundOn ? !api.soundOn() : false);
    return new Promise(function (ok) { try { var u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; uttKeep.push(u); if (uttKeep.length > 8) uttKeep.shift(); u.onend = u.onerror = function () { ok(); }; window.speechSynthesis.speak(u); } catch (e) { ok(); } });
  }
  function vtAction(a) {
    var d = curDoc(); if (!isTxt(d)) return;   /* v207: tài liệu gộp (từ vựng + bài đọc) — mở ở loại nào cũng đọc được */
    if (a === "readall") return readAll(false);
    if (a === "readdef") return readAll(true);
    if (a === "stop") return toggleRead();
    if (a === "collapse") { var v = document.querySelector("#bd-doc .bd-vt"); if (v) { v.classList.toggle("compact"); var cs = document.querySelector('#bd-vtbar [data-vt="collapse"] span'); if (cs) cs.textContent = v.classList.contains("compact") ? "Mở rộng" : "Thu gọn"; requestAnimationFrame(function () { fitDocText(); placeVtBar(); }); } return; }
    if (a === "copy") {
      var txt = (vtCache[d.bid] || []).map(function (w) { return w.term + "\t" + vtMeaning(w); }).join("\n");
      try { navigator.clipboard.writeText(txt).then(function () { if (window.toast) toast("Đã copy " + (vtCache[d.bid] || []).length + " từ", "ok"); }); } catch (e) {}
      return;
    }
    if (a === "add") { if (api.isHost() && api.openInApp) api.openInApp(d.bid, "study"); return; }
  }
  /* 📋 bảng từ vựng của Block: 6 dòng/trang; nghĩa theo tiếng giao diện của TỪNG người xem */
  
  function vtMeaning(w) {
    var l = api && api.lang ? api.lang() : "vi";
    return (l === "en" ? (w.def_en || w.meaning_vi) : l === "zh" ? (w.meaning_zh || w.meaning_vi) : l === "es" ? (w.meaning_es || w.meaning_vi) : w.meaning_vi) || "";
  }
  async function vtPage(d, job) {
    var box = $("#bd-doc"); box.innerHTML = '<div class="bd-docmsg">⏳</div>';
    try {
      var rows = vtCache[d.bid] || (vtCache[d.bid] = await api.words(d.bid)); if (job !== docJob) return;
      var VR = Math.max(1, rows.length);   /* v200: mọi dòng trong 1 trang cuộn */
      if (api.isHost() && (d.n !== 1 || (d.p || 1) !== 1)) docSet(Object.assign({}, d, { n: 1, p: 1 }));
      var vtHead = '<div class="bd-vh"><span></span><span>Vocabulary</span><span>Level</span><span>Word form</span><span>Phonetic</span><span>English definition</span><span>' + (api.lang && api.lang() === "en" ? "Meaning" : api.lang && api.lang() === "zh" ? "中文意思" : api.lang && api.lang() === "es" ? "Significado" : "Vietnamese meaning") + "</span></div>";
      var vtInner = function (pp) { var part = rows.slice((pp - 1) * VR, pp * VR); return '<h3>📘 1. Danh sách từ vựng cần học' + (d.name ? ' <small>· ' + esc(d.name) + "</small>" : "") + "</h3>" + '<div class="bd-vtph"></div>' + vtHead + (part.length ? part.map(function (w, i) {
        var idx = (pp - 1) * VR + i;
        return '<div class="bd-vr" data-i="' + idx + '"><span class="bd-vsay" data-say="' + esc(w.term) + '">🔊</span><span class="bd-vtm"><b class="bd-vterm">' + esc(w.term) + '</b><span class="bd-vstar" data-star="' + esc(w.id || "") + '">☆</span></span><span class="bd-vl">' + esc(w.level || "") + '</span><span class="bd-vf">' + (w.pos ? "<i>" + esc(w.pos) + "</i>" : "") + '</span><span class="bd-vph">' + (w.ipa ? esc(w.ipa) : "—") + '</span><span class="bd-ve">' + esc(w.def_en || "") + '</span><span class="bd-vd">' + esc(vtMeaning(w)) + "</span></div>";
      }).join("") : '<div class="bd-docmsg">—</div>'); };
      box.innerHTML = '<div class="bd-vt bd-scroll">' + vtInner(1) + "</div>";
      paintStars(rows); afterTxt(d);
    } catch (e) { if (job === docJob) box.innerHTML = '<div class="bd-docmsg">⚠ ' + esc(e.message || e) + "</div>"; }
  }
  function paintHL(d) {
    document.querySelectorAll("#bd-doc .bd-vr").forEach(function (r) { r.classList.toggle("hl", !!(d && d.hl != null && +r.dataset.i === +d.hl)); });
    document.querySelectorAll("#bd-doc .bd-s").forEach(function (x) { x.classList.toggle("bd-shl", !!(d && d.hs != null && +x.dataset.s === +d.hs)); });
  }
  /* ====== 🔗 MÀN HÌNH MỌI NGƯỜI GIỐNG NHAU (TJ 2026-10-06: "màn hình của các user đều giống nhau cho dù là ai kéo hay điều chỉnh") ======
     AI cuộn -> gửi "phần tử đầu tiên đang thấy" (câu / dòng từ, KHÔNG gửi pixel vì mỗi máy xuống dòng khác nhau) -> mọi máy cuộn tới đúng chỗ đó.
     AI phóng / thu chữ (A−/A+, 2 ngón, Ctrl+lăn) -> gửi hệ số cỡ chữ + vị trí -> mọi máy đổi theo; host lưu vào bdoc.zf cho máy vào sau.
     Cùng lúc nhiều người thao tác: người thao tác SAU CÙNG thắng; máy đang tự cuộn thì bỏ qua tin đến trong 0.35s (khỏi giằng co). */
  var progTop = -1, userInputAt = 0, lastA = null, progAt = 0, scSendT = 0, scTimer = 0, userScrollAt = 0, zfSendT = 0, zfTimer = 0, zfPersistT = 0, scrollingT = 0;
  function isTxt(d) { return !!(d && (d.k === "wl" || d.k === "vt")); }
  function scBox() { return document.querySelector("#bd-doc .bd-scroll"); }
  function anchorEls(b) { return b.querySelectorAll("h3, .bd-vh, .bd-vr, .bd-w, .bd-term"); }   /* neo theo TỪNG TỪ (đầu dòng đang thấy) -> mọi máy khớp đúng dòng, không chỉ đúng câu */
  function anchorOf(b) {
    var top = b.getBoundingClientRect().top, els = anchorEls(b);
    if (b.scrollTop < 2) return { i: 0, f: 0 };
    for (var i = 0; i < els.length; i++) { var r = els[i].getBoundingClientRect(); if (r.bottom > top + 1) return { i: i, f: Math.max(0, Math.min(1, (top - r.top) / Math.max(1, r.height))) }; }
    return { i: els.length - 1, f: 1 };
  }
  function goAnchor(b, a) {
    if (!b || !a) return; var els = anchorEls(b), el = els[Math.min(a.i, els.length - 1)]; if (!el) return;
    var r = el.getBoundingClientRect(), bt = b.getBoundingClientRect().top;
    progAt = Date.now(); b.scrollTop = a.i === 0 && !a.f ? 0 : Math.round(b.scrollTop + (r.top - bt) + (a.f || 0) * r.height);
    progTop = b.scrollTop;   /* vị trí THỰC TẾ máy vừa tự đặt (đã bị chặn bởi đầu/cuối trang) — cú cuộn này không phải của người dùng, không gửi ngược lại */
  }
  function sendAnchor() { var b = scBox(); if (!b) return; lastA = anchorOf(b); send({ t: "sc", a: lastA }); }
  function applyAnchor(a) { if (!a) return; lastA = a; if (Date.now() - userScrollAt < 350 && Date.now() - userInputAt < 1600) return; goAnchor(scBox(), a); }   /* chỉ nhường khi CHÍNH máy này đang được người dùng kéo */
  function setZoom(v) { v = Math.max(0.7, Math.min(2.6, +v || 1)); if (Math.abs(v - lfz) < 0.004) return false; lfz = v; fitDocText(); paintZ(); return true; }
  function persistZoom() {   /* host ghi hệ số vào bdoc.zf để máy vào sau / tải lại thấy đúng cỡ (không vẽ lại: cùng keyOf) */
    if (!api.isHost()) return; clearTimeout(zfPersistT);
    zfPersistT = setTimeout(function () { var d = curDoc(); if (d && isTxt(d) && Math.abs((d.zf || 1) - lfz) > 0.004) docSet(Object.assign({}, d, { zf: +lfz.toFixed(3) })); }, 500);
  }
  function shareZoom(v) {   /* người thao tác: đổi cỡ chữ cho TẤT CẢ (giới hạn ~10 tin/giây khi 2 ngón kéo liên tục) */
    var b = scBox(), a0 = b ? anchorOf(b) : null;
    if (!setZoom(v)) return;
    if (b && a0) goAnchor(b, a0);
    clearTimeout(zfTimer);
    var go = function () { zfSendT = Date.now(); var bb = scBox(); send({ t: "zf", v: +lfz.toFixed(3), a: bb ? anchorOf(bb) : null }); persistZoom(); };
    if (Date.now() - zfSendT > 90) go(); else zfTimer = setTimeout(go, 100);
  }
  function afterTxt(d) {
    requestAnimationFrame(function () {
      var b = scBox(); paintFeed(); fitDocText(); paintHL(d); paintReadBtn();   /* khung "Từ vừa tra" chừa chỗ ngay khi mở bài */
      if (!b) return;
      if (lastA) goAnchor(b, lastA);   /* máy vào sau / tải lại: cuộn tới đúng chỗ cả phòng đang xem */
      ["wheel", "touchstart", "touchmove", "pointerdown", "keydown"].forEach(function (ev) { b.addEventListener(ev, function () { userInputAt = Date.now(); }, { passive: true }); });
      b.addEventListener("scroll", function () {
        if (Math.abs(b.scrollTop - progTop) < 2 && Date.now() - progAt < 1500) return;   /* dội lại cú cuộn do chính máy này vừa đặt */
        if (Date.now() - userInputAt > 1600) return;   /* TJ 2026-10-06: đổi cỡ chữ / xuống dòng / máy khác kéo làm trang tự dịch -> KHÔNG phải người dùng cuộn, không gửi, không đè vị trí chung (trước đây 3 máy gửi đè nhau -> mỗi máy 1 chỗ). 1.6s = đủ cho quán tính vuốt */
        if (Date.now() - progAt < 150) return;
        userScrollAt = Date.now(); b.classList.add("bd-scrolling"); clearTimeout(scrollingT); scrollingT = setTimeout(function () { b.classList.remove("bd-scrolling"); }, 900);   /* thanh trượt chỉ lộ lúc đang cuộn */
        var now = Date.now(); clearTimeout(scTimer);
        if (now - scSendT > 110) { scSendT = now; sendAnchor(); } else scTimer = setTimeout(function () { scSendT = Date.now(); sendAnchor(); }, 120);
      }, { passive: true });
    });
  }
  /* ---------- lật trang xuyên Block: bảng từ vựng -> bài đọc -> Block kế (TJ 2026-10-05) ---------- */
  function unitsOf(d) {
    var q = d.q && d.q.length ? d.q : [[d.bid, d.name]], qp = d.qp || "wv", U = [];
    q.forEach(function (x) { qp.split("").forEach(function (ch) { if (ch === "v") U.push({ k: "vt", bid: x[0], name: x[1] }); else if (ch === "w") U.push({ k: "wl", bid: x[0], name: x[1] }); }); });   /* TJ 2026-10-05: BÀI ĐỌC trước, BẢNG TỪ sau */
    return U;
  }
  function unitIdx(d, U) {
    if (d.qi != null && U[d.qi] && U[d.qi].bid === d.bid && U[d.qi].k === d.k) return d.qi;
    for (var i = 0; i < U.length; i++) if (U[i].bid === d.bid && U[i].k === d.k) return i;
    return 0;
  }
  async function defaultPh(bid) {   /* bài học EA / Digital Marketing / bài báo: đọc bài gốc luôn (giống hộp chọn bài) */
    try {
      var b = wlCache[bid] || (wlCache[bid] = await api.block(bid)), items = passList(b), T = await api.tree(), info = pathInfo(T, bid), orig = items.find(function (x) { return x.orig; });
      if ((info.hubOrig || (items[0] && items[0].orig)) && orig) return orig;
    } catch (e) {}
    return null;
  }
  async function flip(dir) {
    var d = curDoc(); if (!d) return;
    if (!api.isHost()) { send({ t: "navreq", k: "page", dir: dir }); return; }
    var n = d.n || 1, p = d.p || 1, np = p + dir;
    if (np >= 1 && np <= n) { docSet(Object.assign({}, d, { p: np })); return; }
    return;   /* TJ 2026-10-05: gói gọn trong 1 Block — hết trang thì dừng (không nhảy sang Block / Batch khác; muốn Block khác thì quay lại danh sách) */
  }
  /* ⏮ ⏪ ⏩ ⏭ sang Block / Batch kế (cùng loại tài liệu đang xem: bài đọc hoặc bảng từ) — ai bấm cũng được, host thực hiện */
  async function navStep(kind, dir) {
    var d = curDoc(); if (!d || !d.bid || (d.k !== "wl" && d.k !== "vt")) return;
    if (!api.isHost()) { send({ t: "navreq", k: kind, dir: dir }); return; }
    if (!api.neighbor) return;
    var nb = await api.neighbor(d.bid, kind, dir); if (!nb || nb.sameBatch === false) { if (window.toast) toast("Hết Block trong Batch này"); return; }   /* chỉ trong cùng Batch — muốn Batch / Page khác thì chọn ở danh sách */
    var nd = { k: d.k, bid: nb.bid, name: nb.name, p: 1, fs: d.fs };
    if (d.k === "wl") { var ph = await defaultPh(nb.bid); if (ph) { nd.ph = ph.ph; nd.lb = ph.label; } }
    await openDoc(nd);
  }
  /* 📖 Bài đọc | 📋 Bảng từ: đổi qua lại cho cùng 1 Block (ai bấm cũng được, host thực hiện) */
  async function swKind(kind) {
    var d = curDoc(); if (!d || !d.bid || d.k === kind || (kind !== "wl" && kind !== "vt")) return;
    if (!api.isHost()) { send({ t: "navreq", k: "sw", dir: kind === "vt" ? 1 : -1 }); return; }
    var nd = { k: kind, bid: d.bid, name: d.name, p: 1, fs: d.fs, q: d.q, qp: d.qp };
    if (kind === "wl") { var ph = await defaultPh(d.bid); if (ph) { nd.ph = ph.ph; nd.lb = ph.label; } }
    await openDoc(nd);
  }
  /* A−/A+ (host, bài đọc/bảng từ): đổi cỡ chữ CHUNG, giữ vị trí đang đọc */
  function fsStep(delta) {
    var d = curDoc(); if (!d) return;
    if (isTxt(d)) { shareZoom(delta === 0 ? 1 : lfz * (delta > 0 ? 1.15 : 1 / 1.15)); return; }   /* TJ 2026-10-06: ai bấm cũng đổi cho cả phòng */
    if (!api.isHost()) { send({ t: "navreq", k: "fs", dir: delta }); return; }
    var cur = fsOf(d), nx = delta === 0 ? FS_DEF : Math.max(0, Math.min(FS.length - 1, cur + delta)); if (nx === cur) return;
    var np = 1;
    if (d.k === "vt") { var first = ((d.p || 1) - 1) * VT_ROWL[cur]; np = Math.floor(first / VT_ROWL[nx]) + 1; }
    else if (d.k === "wl") {
      var b = wlCache[d.bid], pk = b ? wlPick(d, b) : null;
      if (pk) { var raw = metaOf(pk.pick ? pk.pick.raw : pk.items[0] ? pk.items[0].raw : "").text, n2 = splitPages(raw, nx).length, n1 = d.n || 1; np = Math.max(1, Math.min(n2, Math.round(((d.p || 1) - 1) / Math.max(1, n1) * n2) + 1)); }
    }
    docSet(Object.assign({}, d, { fs: nx, p: np, n: 0 }));
  }
  /* ---------- 🔍 tra nghĩa: chạm 1 từ trong bài đọc, hoặc gõ vào ô 🔍 (riêng từng máy, không đồng bộ) ---------- */
  var lkSeq = 0, lkEl = null;
  function wordEls() { return document.querySelectorAll("#bd-doc .bd-w, #bd-doc .bd-term"); }
  function selRange(i, j) {   /* tô sáng các từ i..j (1 hoặc nhiều từ) */
    var L = wordEls(), els = []; for (var k = Math.max(0, i); k <= Math.min(L.length - 1, j == null ? i : j); k++) els.push(L[k]);
    selWord(null); lkEl = els[0] || null; lkEls = els; els.forEach(function (x) { x.classList.add("bd-wsel"); });
  }
  function shareSelRange(i, j) { selRange(i, j); send({ t: "sw", i: i, j: j }); }
  function shareSel(el) {   /* từ vừa chạm sáng GIỐNG NHAU trên mọi máy (TJ 2026-10-06: "cùng nội dung y chang, chỉ khác to nhỏ") */
    var i = el ? Array.prototype.indexOf.call(wordEls(), el) : -1; selWord(el); send({ t: "sw", i: i });
  }
  var lkEls = [];
  function selWord(el) { lkEls.forEach(function (x) { x.classList.remove("bd-wsel"); }); if (lkEl) lkEl.classList.remove("bd-wsel"); lkEl = el; lkEls = el ? [el] : []; if (el) el.classList.add("bd-wsel"); }
  function mnOf(v) {
    var l = api && api.lang ? api.lang() : "vi", own = v && v[l];
    return (v && v.pos ? "<i>" + esc(v.pos) + "</i> " : "") + (own ? "<b>" + esc(own) + "</b>" : "") + (v && v.en ? (own ? "<br><small>" : "") + esc(v.en) + (own ? "</small>" : "") : "");
  }
  /* ====== TRA NGHĨA DÙNG CHUNG (TJ 2026-10-05) ======
     · Bấm 🔍 (cạnh ✏️) rồi mới chạm từ để tra; không bấm thì tay kéo / 2 ngón phóng thu bình thường.
     · Nghĩa hiện ở khung DƯỚI bảng (không đè bảng); ai tra gì cả phòng cùng thấy (mỗi người theo tiếng của mình). Người tra gọi AI 1 lần rồi gửi kết quả cho cả phòng.
     · "☆ Lưu" = đưa vào "Đã lưu của phiên" (kho từ chung của buổi học để ôn); không lưu thì chỉ hiển thị. */
  var lkFeed = [], lkTab = "all", lookMode = false;
  function phoneP() { return window.innerWidth < 760 && window.innerHeight > window.innerWidth; }   /* điện thoại cầm dọc: bảng 4:3 thấp -> dành phần dưới cho khung nghĩa */
  function lkAllow() {   /* mỗi người tối đa 20 lượt tra / giờ (mỗi lượt gọi AI); host không giới hạn */
    if (api.isHost()) return true;
    var now = Date.now(), a = []; try { a = JSON.parse(localStorage.getItem("tjwl_lk_t") || "[]"); } catch (e) {}
    a = a.filter(function (t) { return now - t < 3600000; }); if (a.length >= 20) return false;
    a.push(now); try { localStorage.setItem("tjwl_lk_t", JSON.stringify(a)); } catch (e) {} return true;
  }
  function paintFeed() {
    var f = $("#bd-feed"); if (!f) return;
    var was0 = f.hidden; f.hidden = !(lookMode || isTxt(curDoc()));   /* chưa có bài (chờ host / danh sách Block) thì không chiếm chỗ */   /* TJ 2026-10-06: "phải chừa để từ vựng mới xuất hiện" — luôn có chỗ khi đang đọc */
    var saved = [], list = lkFeed;   /* TJ 2026-10-05: tra từ không cần lưu — chạm là thấy nghĩa */
    $("#bd-fn").textContent = lkFeed.length; $("#bd-fs").textContent = saved.length;
    document.querySelectorAll("#bd-feed [data-ftab]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.ftab === lkTab); });
    var rd = $("#bd-fread"); if (rd) rd.hidden = !(lkTab === "saved" && list.length);
    var fq = $("#bd-fq"); if (fq) fq.hidden = false;   /* TJ 2026-10-06: bỏ kính lúp — ô gõ tra từ luôn nằm sẵn ở đầu khung "Từ vừa tra" */
    var l0 = api && api.lang ? api.lang() : "vi", FL0 = { vi: "🇻🇳", zh: "🇨🇳", es: "🇪🇸" }, d0 = curDoc(), rows0 = d0 && d0.bid ? vtCache[d0.bid] : null;
    $("#bd-fl").innerHTML = list.length ? list.map(function (e, i) {
      var v = e.v || {}, own = l0 !== "en" ? v[l0] : "", row = rows0 ? rows0.find(function (w) { return String(w.term || "").toLowerCase() === e.w.toLowerCase(); }) : null;
      var on = !!e.bm, tj = !!(api.canBookmark && api.canBookmark());
      return '<div class="bd-fe2' + (i === 0 && e.t > Date.now() - 2500 ? " new" : "") + '"><button type="button" class="bd-hb bd-fsay" data-lksay="' + esc(e.w) + '" title="Nghe">🔊</button><div class="bd-fe2m">' +
        '<div class="bd-fe2h"><b>' + esc(e.w) + "</b>" + (v.ipa ? '<span class="bd-fe2ipa">' + esc(v.ipa) + "</span>" : "") + (v.pos ? "<i>" + esc(v.pos) + "</i>" : "") +
        '<button type="button" class="bd-hb bd-fe2star' + (on ? " on" : "") + (tj ? "" : " ro") + '" data-lkstar="' + esc(e.id) + '" title="' + (on ? "Đã vào ⭐ Ôn riêng của TJ" + (tj ? " — bấm để bỏ" : "") : "Chưa vào Ôn riêng") + '">' + (on ? "★" : "☆") + "</button>" + whoHTML(e) + "</div>" +
        (v.en ? '<div class="bd-fe2en"><span>🇺🇸</span>' + esc(v.en) + "</div>" : "") + (own ? '<div class="bd-fe2vi"><span>' + (FL0[l0] || "") + "</span><b>" + esc(own) + "</b></div>" : "") + "</div></div>";
    }).join("") : '<div class="bd-fempty">Chạm vào một từ trong bài đọc để xem nghĩa — từ vừa tra hiện ở đây, kéo lên xuống để xem lại.</div>';
    if (was0 !== f.hidden) relayout();   /* chỉ tính lại khung bảng khi khung tra từ ẩn/hiện — nội dung đổi thì cao cố định, bảng không giật */
  }
  function whoMe() { var m = me(); return { n: m ? m.name : "", a: m ? m.avatar || "" : "" }; }
  function lkAdd(e) {   /* cùng 1 từ ai tra cũng GỘP vào 1 dòng: danh sách người tra (who) + từ nhảy lên đầu */
    var k = e.w.toLowerCase(), ex = lkFeed.find(function (x) { return x.w.toLowerCase() === k; });
    if (ex) { ex.who = Object.assign({}, ex.who || {}, e.who || {}); ex.t = Math.max(ex.t || 0, e.t || 0); if (!ex.v && e.v) ex.v = e.v; if (e.wid) { ex.wid = e.wid; ex.bm = true; } lkFeed = [ex].concat(lkFeed.filter(function (x) { return x !== ex; })); }
    else { e.who = e.who || {}; lkFeed.unshift(e); }
    if (lkFeed.length > 60) lkFeed.length = 60; paintFeed(); var f2 = $("#bd-feed"); if (f2) f2.scrollTop = 0;   /* từ mới nhất luôn ở trên cùng; đầy thì cuộn xuống xem */
  }
  function setLook(on) {
    lookMode = !!on; var b = $("#bd-lkbtn"); if (b) b.classList.toggle("on", lookMode);
    if (lookMode && penMode) setPen(false);
    if (!lookMode) selWord(null);
    paintFeed(); poke();
  }
  function feedNote(txt) { var l = $("#bd-fl"); if (l) { var n = document.createElement("div"); n.className = "bd-fempty"; n.textContent = txt; l.insertBefore(n, l.firstChild); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 4000); } }
  /* 🔎 Từ đã tra: lưu từ MÌNH tra vào máy này (xem lại ở 📜 Lịch sử › Từ đã tra) */
  function lkKeep(w, v) {
    try {
      var KEY = "tjwl_looked_v1", a = JSON.parse(localStorage.getItem(KEY) || "[]"), lw = String(w).toLowerCase();
      a = a.filter(function (x) { return String(x.w).toLowerCase() !== lw; });
      a.unshift({ w: w, v: { pos: v && v.pos || "", ipa: v && v.ipa || "", en: v && v.en || "", vi: v && v.vi || "", zh: v && v.zh || "", es: v && v.es || "" }, t: Date.now() });
      localStorage.setItem(KEY, JSON.stringify(a.slice(0, 400)));
    } catch (e) {}
  }
  async function lookupShow(phrase, ctx, typed) {
    var ph = String(phrase || "").trim(); if (!ph) return;
    if (typed) sayWord(ph);   /* gõ từ rồi Enter: đọc đúng từ vừa gõ ngay */
    var ex = lkFeed.find(function (e) { return e.w.toLowerCase() === ph.toLowerCase(); });
    if (ex && !ex.bm && api.autoSave) { api.autoSave(ex.w, ex.v, null).then(function (wid) { if (wid) { ex.wid = wid; ex.bm = true; paintFeed(); send({ t: "lk", e: { id: ex.id, w: ex.w, v: ex.v, t: ex.t, who: ex.who, wid: wid, bm: true } }); } }); }
    if (ex) { lkKeep(ex.w, ex.v); ex.t = Date.now(); ex.who = ex.who || {}; ex.who[myId()] = whoMe(); lkAdd({ id: ex.id, w: ex.w, v: ex.v, t: ex.t, who: ex.who }); send({ t: "lk", e: { id: ex.id, w: ex.w, v: ex.v, t: ex.t, who: ex.who } }); return; }
    if (!lkAllow()) { feedNote("Bạn đã tra nhiều lần trong giờ này, thử lại sau ít phút nhé."); return; }
    var d = curDoc(); if (d && d.bid && !vtCache[d.bid]) { try { vtCache[d.bid] = await api.words(d.bid); } catch (e) {} }
    var row = d && d.bid && vtCache[d.bid] ? vtCache[d.bid].find(function (w) { return w.term.toLowerCase() === ph.toLowerCase(); }) : null, v = null;
    if (row) v = { pos: row.pos, en: row.def_en, vi: row.meaning_vi, zh: row.meaning_zh, es: row.meaning_es, ipa: row.ipa };   /* từ của chính Block: có nghĩa sẵn, khỏi gọi AI */
    else { feedNote("⏳ Đang tra “" + ph + "”…"); try { v = await api.lookup(ph, ctx || ""); } catch (e) {} }
    var okv = v && (v.en || v.vi || v.zh || v.es);
    if (!okv) { feedNote("Chưa tra được “" + ph + "” (mạng/AI bận). Thử lại nhé."); return; }
    var e2 = { id: uid(), w: ph, v: v, by: me() ? me().name : "", saved: false, t: Date.now(), who: {}, bm: false };
    e2.who[myId()] = whoMe();
    lkKeep(ph, v); lkAdd(e2); send({ t: "lk", e: e2 });
    if (api.autoSave && ph.split(/\s+/).length <= 8 && ph.length <= 60) {   /* TJ 2026-10-06: từ ai tra cũng vào ⭐ Ôn riêng của TJ */
      api.autoSave(ph, v, row).then(function (wid) {
        if (!wid) return; e2.wid = wid; e2.bm = true; var cur = lkFeed.find(function (x) { return x.w.toLowerCase() === ph.toLowerCase(); }); if (cur) { cur.wid = wid; cur.bm = true; }
        paintFeed(); send({ t: "lk", e: { id: e2.id, w: ph, v: v, t: e2.t, who: e2.who, wid: wid, bm: true } });
      });
    }
  }
  function whoHTML(e) {   /* avatar + tên người tra (tối đa 3) + "👥 N" khi từ này nhiều người tra */
    var ids = Object.keys(e.who || {}), n = ids.length; if (!n) return e.by ? '<span class="bd-whol"><span class="bd-wn">' + esc(e.by) + "</span></span>" : "";
    var chips = ids.slice(0, 3).map(function (id) { var w = e.who[id] || {}, av = String(w.a || ""); return '<span class="bd-wc" title="' + esc(w.n || "") + '">' + (/^https?:/.test(av) ? '<img alt="" src="' + esc(av) + '">' : '<i>' + esc(av || "👤") + "</i>") + '<span class="bd-wn">' + esc(w.n || "?") + "</span></span>"; }).join("");
    return '<span class="bd-whol">' + chips + (n > 3 ? '<span class="bd-wmore">+' + (n - 3) + "</span>" : "") + (n > 1 ? '<span class="bd-wcnt" title="' + n + ' người đã tra từ này">👥 ' + n + "</span>" : "") + "</span>";
  }
  async function lkStar(id) {   /* ☆/★ chỉ TJ bấm được: bật / bỏ ⭐ Ôn riêng của TJ cho từ này */
    var e = lkFeed.find(function (x) { return x.id === id; }); if (!e || !e.wid || !(api.canBookmark && api.canBookmark())) return;
    var on = await api.setBookmark(e.wid, !e.bm); e.bm = !!on;
    document.querySelectorAll('#bd-doc .bd-vstar[data-star="' + e.wid + '"]').forEach(function (x) { x.textContent = on ? "★" : "☆"; x.classList.toggle("on", !!on); }); starMap[e.wid] = !!on;
    paintFeed();
  }
  function toggleSave(id) {
    var e = lkFeed.find(function (x) { return x.id === id; }); if (!e) return;
    e.saved = !e.saved; paintFeed(); send({ t: "lksave", id: id, on: e.saved });
  }
  async function readSaved() {
    if (!window.speechSynthesis) return;
    stopReading(); var my = reading, ml = api.lang ? api.lang() : "vi", list = lkFeed.filter(function (e) { return e.saved; }).slice().reverse();
    for (var i = 0; i < list.length && my === reading; i++) {
      await speakOne(list[i].w, "en-US", 0.85); if (my !== reading) break;
      var mv = list[i].v && list[i].v[ml]; if (mv && ml !== "en") await speakOne(mv, SPL[ml] || "vi-VN", 0.85);
    }
  }
  /* chạm 1 lần (bàn tay): bảng từ = 🔊 nghe / host tô dòng; bài đọc = chạm từ để tra; host chạm MÉP trái/phải = lật trang */
  function docTap(x, y) {
    var d = curDoc(); if (!d) return;
    var gs = window.getSelection && window.getSelection(); if ((gs && !gs.isCollapsed) || Date.now() - selDoneAt < 700) return;   /* đang bôi nhiều từ: để phần bôi xử lý */
    var sr = wrap.getBoundingClientRect(), rx = (x - sr.left) / Math.max(1, sr.width), edge = api.isHost() && Z.s <= 1.05 && (rx < 0.18 || rx > 0.82), dir = rx < 0.5 ? -1 : 1;
    if (d.k === "pdf" || d.k === "img") { if (edge && d.k === "pdf") flip(dir); return; }
    var el0 = document.elementFromPoint(x, y), inVt = !!(el0 && el0.closest && el0.closest("#bd-doc .bd-vt"));
    if (isTxt(d) && !inVt) {
      var ws = document.querySelectorAll("#bd-doc .bd-w, #bd-doc .bd-term"), hit = null;
      for (var j = 0; j < ws.length && !hit; j++) { var wr = ws[j].getBoundingClientRect(); if (x >= wr.left - 3 && x <= wr.right + 3 && y >= wr.top - 3 && y <= wr.bottom + 3) hit = ws[j]; }
      if (hit && lookMode) { shareSel(hit); var para = hit.closest("p"); lookupShow(hit.textContent.trim(), para ? para.textContent : "", false); return; }
      if (hit) {   /* TJ 2026-10-06: chạm từ = đọc to + từ đó lên ĐẦU khung "Từ vừa tra" dưới bảng (🔊 · phiên âm · nghĩa Anh · nghĩa Việt · ☆ Lưu) */
        shareSel(hit); var ph0 = hit.textContent.trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""), pa0 = hit.closest("p");
        if (ph0) { sayWord(ph0); lookupShow(ph0, pa0 ? pa0.textContent : "", false); }
        return;
      }
      if (lkEl) shareSel(null);
      return;
    }
    if (!isTxt(d)) return;
    var rows = document.querySelectorAll("#bd-doc .bd-vr");
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i].getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      var stEl = rows[i].querySelector(".bd-vstar");
      if (stEl) { var rr = stEl.getBoundingClientRect(); if (x >= rr.left - 10 && x <= rr.right + 10 && y >= rr.top - 8 && y <= rr.bottom + 8) { toggleStar(stEl); return; } }
      var sy = rows[i].querySelector(".bd-vsay"), sr2 = sy.getBoundingClientRect();
      if (x >= sr2.left - 10 && x <= sr2.right + 10) { sayWord(sy.dataset.say); return; }
      if (api.isHost()) docSet(Object.assign({}, d, { hl: +d.hl === +rows[i].dataset.i ? null : +rows[i].dataset.i }));
      return;
    }
    if (edge) flip(dir);
  }
  /* ====== ✍ BÔI CHỌN 1 / 2 / NHIỀU TỪ (TJ 2026-10-06: "bôi từ vựng cho 1 hoặc 2 hoặc nhiều từ được") ======
     Kéo chuột / giữ rồi kéo trên bài đọc -> cụm từ được bôi: tô sáng giống nhau trên mọi máy, đọc to cụm đó, tra nghĩa cả cụm vào khung "Từ vừa tra" (tối đa 8 từ). */
  var selT = 0;
  document.addEventListener("selectionchange", function () {
    clearTimeout(selT); selT = setTimeout(function () {
      var sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var r = sel.getRangeAt(0), wl = document.querySelector("#bd-doc .bd-wl"); if (!wl || !wl.contains(r.commonAncestorContainer)) return;
      var L = wordEls(), first = -1, last = -1;
      for (var k = 0; k < L.length; k++) if (r.intersectsNode(L[k])) { if (first < 0) first = k; last = k; }
      if (first < 0) return;
      if (last - first > 7) last = first + 7;
      var els = []; for (var q = first; q <= last; q++) els.push(L[q]);
      var ph = els.map(function (e) { return e.textContent.trim(); }).join(" ").replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
      sel.removeAllRanges(); selDoneAt = Date.now();
      if (!ph) return; var para = els[0].closest("p");
      shareSelRange(first, last); sayWord(ph); lookupShow(ph, para ? para.textContent : "", false);
    }, 380);
  });
  var selDoneAt = 0;
  function hlSentence(i) {
    var d = curDoc(); if (!d || d.k !== "wl") return;
    if (!api.isHost()) { send({ t: "navreq", k: "hs", dir: i }); return; }
    docSet(Object.assign({}, d, { hs: d.hs != null && +d.hs === i ? null : i }));
  }
  window.addEventListener("resize", function () { clearTimeout(window.__bdDocT); window.__bdDocT = setTimeout(function () { var d = curDoc(); if (open && d && (d.k === "pdf")) paintDoc(d); }, 300); });
  /* host mở tài liệu: dò tỉ lệ + số trang TRƯỚC khi báo cả phòng (mọi máy cùng khung ngay) */
  async function openDoc(d) {
    try {
      if (d.k === "pdf") { var lib = await pdfLib(), doc = pdfCache[d.url] || (pdfCache[d.url] = await lib.getDocument(d.url).promise), pg = await doc.getPage(1), v = pg.getViewport({ scale: 1 }); d.n = doc.numPages; d.ar = +(v.width / v.height).toFixed(4); }
      else if (d.k === "img") { d.ar = await new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(+(im.naturalWidth / im.naturalHeight).toFixed(4)); }; im.onerror = function () { ok(0.75); }; im.src = d.url; }); }
    } catch (e) { /* không dò được: dùng tỉ lệ mặc định */ }
    docSet(d);
  }

  async function openQueue(list, parts) {   /* mở nối tiếp bảng từ vựng -> bài đọc của từng Block (tối đa 60 Block) */
    var q = list.slice(0, 60); if (!q.length || !parts) return;
    var k0 = parts.charAt(0) === "v" ? "vt" : "wl", nd = { k: k0, bid: q[0][0], name: q[0][1], p: 1, q: q, qp: parts, qi: 0 };
    if (k0 === "wl") { var ph = await defaultPh(nd.bid); if (ph) { nd.ph = ph.ph; nd.lb = ph.label; } }
    if (!open) api.setBoard(true);
    mini = false; await openDoc(nd);
  }
  /* ---------- 🌳 CỘT CÂY BÊN TRÁI trên bảng (TJ 2026-10-05): thụt ra thụt vào như WordLoop, ô tick chọn nguyên Batch/Page/…; 📌 ghim = luôn mở ---------- */
  var SPK = "tjwl_bd_sidepin_v1";
  function sidePinned() { try { return localStorage.getItem(SPK) === "1"; } catch (e) { return false; } }
  var sideOn = false;
  async function sideShow(on) {
    sideOn = !!on && api.isHost();
    var sd = $("#bd-side"), el = $("#bd"); if (!sd) return;
    sd.hidden = !sideOn;
    $("#bd-sidepin").classList.toggle("on", sidePinned()); var pp = $("#bd-ppin"); if (pp) pp.classList.toggle("on", sidePinned());
    setTimeout(fit, 0);
    if (!sideOn) return;
    if (!$("#bd-sidebar").innerHTML) $("#bd-sidebar").innerHTML = Lib.selBar();
    Lib.selPaint();
    if (!Lib.T) { var T = await api.tree(); if (!T) { $("#bd-sidelist").textContent = "⚠"; return; } Lib.T = T; }
    Lib.drawTree($("#bd-sideq").value, $("#bd-sidelist"));
  }
  function sideAfter() { if (!(sideOn && sidePinned() && big && window.innerWidth >= 900)) sideShow(false); }   /* ghim thì giữ cột mở, không thì tự đóng sau khi chọn */
  function sideClick(b) {
    if (b.id === "bd-sidex") { sideShow(false); return true; }
    if (b.id === "bd-pname") { sideShow(!sideOn); return true; }
    if (b.id === "bd-ppin") { try { localStorage.setItem(SPK, sidePinned() ? "0" : "1"); } catch (e) {} sideShow(true); return true; }
    if (b.id === "bd-sidepin") { try { localStorage.setItem(SPK, sidePinned() ? "0" : "1"); } catch (e) {} sideShow(true); return true; }
    if (b.id === "bd-sideexp" || b.id === "bd-sidecol") { document.querySelectorAll("#bd-sidelist details").forEach(function (x) { x.open = b.id === "bd-sideexp"; }); return true; }
    if (!b.closest("#bd-side")) return false;
    if (b.dataset.qgo) { Lib.qGo(); return true; }
    if (b.dataset.qclr) { Lib.sel = []; Lib.drawTree($("#bd-sideq").value, $("#bd-sidelist")); Lib.selPaint(); return true; }
    if (b.dataset.wl) { Lib.open(); Lib.paintPass(b.dataset.wl, b.dataset.wn || "", false); return true; }
    if (b.dataset.vt) { sideAfter(); openDoc({ k: "vt", bid: b.dataset.vt, name: b.dataset.wn || "", p: 1 }); return true; }
    return false;
  }

  /* ---------- 📁 hộp thư viện (host) ---------- */
  var Lib = {
    folder: "", tab: "files", mode: "list", pending: null, mvFile: null, folders: [],
    open: function () {
      var m = $("#bd-libm"); if (!m) { m = document.createElement("div"); m.id = "bd-libm"; m.className = "bd-libm"; document.body.appendChild(m); m.addEventListener("click", Lib.click); m.addEventListener("change", Lib.change); m.addEventListener("input", Lib.input); }
      m.hidden = false; Lib.mode = "list"; Lib.paint();
    },
    close: function () { var m = $("#bd-libm"); if (m) m.hidden = true; },
    path: function (n) { return (Lib.folder ? Lib.folder + "/" : "") + n; },
    msg: function (x) { var e = $("#bd-libmsg"); if (e) e.textContent = x; },
    head: function () {
      return '<div class="bd-libin"><div class="bd-libh"><b>' + esc(t("lib")) + '</b><button type="button" data-lx="1" class="bd-libx">✕</button></div>' +
        '<div class="bd-libtabs"><button type="button" data-lt="files" class="' + (Lib.tab === "files" ? "on" : "") + '">📄 PDF · 🖼 ' + esc(t("lib_img")) + ' · Word/Excel</button><button type="button" data-lt="wl" class="' + (Lib.tab === "wl" ? "on" : "") + '">📖 ' + esc(t("lib_wl")) + " · 📋 " + esc(t("lib_vt")) + "</button></div>";
    },
    paint: async function () {
      var m = $("#bd-libm"); if (!m) return;
      if (Lib.tab === "wl") return Lib.paintWL();
      if (Lib.mode === "dest") return Lib.paintDest();
      var crumbs = '<button type="button" data-lgo="">lib</button>' + (Lib.folder ? Lib.folder.split("/").map(function (seg, i, arr) { return ' › <button type="button" data-lgo="' + esc(arr.slice(0, i + 1).join("/")) + '">' + esc(seg) + "</button>"; }).join("") : "");
      m.innerHTML = Lib.head() + Lib.recentHTML() + '<div class="bd-libbar"><span class="bd-crumb">📂 ' + crumbs + '</span></div><div class="bd-libbar"><label class="bd-libup">⬆️ ' + esc(t("lib_up")) + '<input type="file" id="bd-libfile" accept="application/pdf,image/*,.docx,.xlsx,.pptx,.doc,.xls,.ppt" multiple hidden></label> <button type="button" data-lnew="1">➕ ' + esc(t("lib_newf")) + '</button></div><div id="bd-liblist" class="bd-liblist">⏳</div><div class="bd-libmsg" id="bd-libmsg"></div></div>';
      var r = await api.lib.list(Lib.folder), box = $("#bd-liblist"); if (!box) return;
      if (r.error) { box.textContent = "⚠ " + r.error; return; }
      var items = (r.items || []).filter(function (x) { return x.name[0] !== "."; });
      items.sort(function (a, b) { return (b.dir ? 1 : 0) - (a.dir ? 1 : 0) || a.name.localeCompare(b.name, "vi", { numeric: true }); });
      box.innerHTML = items.map(function (x) {
        if (x.dir) return '<div class="bd-lrow"><button type="button" class="bd-lopen" data-ldir="' + esc(x.name) + '">📂 ' + esc(x.name) + "</button></div>";
        var ico = /\.pdf$/i.test(x.name) ? "📄" : /\.(docx?|rtf)$/i.test(x.name) ? "📝" : /\.(xlsx?|csv)$/i.test(x.name) ? "📊" : /\.(pptx?)$/i.test(x.name) ? "📽" : "🖼";
        return '<div class="bd-lrow"><button type="button" class="bd-lopen" data-lfile="' + esc(x.name) + '">' + ico + " " + esc(x.name) + " <small>" + (x.size ? (x.size > 1048576 ? (x.size / 1048576).toFixed(1) + " MB" : Math.round(x.size / 1024) + " KB") : "") + '</small></button><button type="button" data-lmv="' + esc(x.name) + '" title="' + esc(t("lib_mvt")) + '">📂➜</button><button type="button" data-lren="' + esc(x.name) + '" title="Đổi tên">✏️</button><button type="button" data-ldel="' + esc(x.name) + '" title="Xoá">🗑</button></div>';
      }).join("") || '<div class="bd-libmsg">' + esc(t("lib_empty")) + "</div>";
    },
    /* chọn thư mục đích (tải lên / chuyển file): chọn có sẵn hoặc tạo mới */
    paintDest: async function () {
      var m = $("#bd-libm"), isUp = !!Lib.pending, what = isUp ? Lib.pending.map(function (f) { return f.name; }).join(", ") : Lib.mvFile;
      m.innerHTML = Lib.head() + '<div class="bd-dest"><div class="bd-libmsg">' + (isUp ? "⬆️ " : "📂➜ ") + esc(what) + '</div><label>' + esc(t("lib_dest")) + ':<select id="bd-destsel"><option value="">⏳</option></select></label><input type="text" id="bd-destnew" placeholder="' + esc(t("lib_mkn")) + ' (vd: TOEIC/Test-1)" hidden><div class="bd-libbar"><button type="button" data-ldok="1" class="bd-go">' + (isUp ? "⬆️ " + esc(t("lib_go")) : "📂➜ " + esc(t("lib_mv"))) + '</button><button type="button" data-ldno="1">' + esc(t("lib_no")) + '</button></div></div><div class="bd-libmsg" id="bd-libmsg"></div></div>';
      var fs0 = await api.lib.folders(); Lib.folders = fs0;
      var sel = $("#bd-destsel"); if (!sel) return;
      sel.innerHTML = '<option value="">lib (' + esc(t("lib_root")) + ")</option>" + fs0.map(function (p) { return '<option value="' + esc(p) + '">📂 ' + esc(p) + "</option>"; }).join("") + '<option value="__new">' + esc(t("lib_mk")) + "</option>";
      sel.value = Lib.folder && fs0.indexOf(Lib.folder) >= 0 ? Lib.folder : "";
    },
    input: function () {},
    recentHTML: function () {
      var L = recents().slice(0, 8); if (!L.length) return "";
      return '<div class="bd-rec"><div class="bd-recH">🕘 Gần đây</div><div class="bd-recL">' + L.map(function (x, i) {
        var ico = x.k === "pdf" ? "📄" : x.k === "img" ? "🖼" : x.k === "office" ? "📝" : x.k === "vt" ? "📋" : "📖";
        return '<button type="button" data-rec="' + i + '">' + ico + " <span>" + esc(x.name || x.url || "") + "</span>" + (x.lb ? " <small>" + esc(x.lb) + "</small>" : "") + (x.p > 1 ? " <small>tr." + x.p + "</small>" : "") + "</button>";
      }).join("") + "</div></div>";
    },
    /* 📖 chọn bài đọc của 1 Block: bài gốc / OpenAI / Gemini / Claude / dán… + tạo bài mới */
    pBid: "", pName: "", pOrig: false, pHint: "",
    paintPass: async function (bid, name, force) {
      var m = $("#bd-libm"); if (!m) return;
      Lib.pBid = bid; Lib.pName = name || "";
      m.innerHTML = Lib.head() + '<div class="bd-libmsg">⏳ ' + esc(name || "") + "</div></div>";
      var b, T;
      try { b = await api.block(bid); wlCache[bid] = b; T = await api.tree(); } catch (e) { m.innerHTML = Lib.head() + '<div class="bd-libmsg">⚠ ' + esc(e.message || e) + "</div></div>"; return; }
      var items = passList(b), info = pathInfo(T, bid), orig = items.find(function (x) { return x.orig; });
      Lib.pOrig = info.hubOrig || !!(items[0] && items[0].orig); Lib.pHint = info.hint;
      if (!force && Lib.pOrig && orig) { Lib.close(); return openDoc({ k: "wl", bid: bid, name: name, ph: orig.ph, lb: orig.label, p: 1 }); }   /* bài học EA / Digital Marketing / bài báo: đọc bài gốc luôn */
      m.innerHTML = Lib.head() + '<div class="bd-libmsg">📖 <b>' + esc(name || "") + "</b> — chọn bài đọc" + (Lib.pOrig ? " · Block này có <b>bài gốc</b>, bài AI chỉ lưu thêm (không thay bài gốc)" : "") + "</div>" +
        '<div class="bd-liblist">' + (items.length ? items.map(function (x) {
          return '<div class="bd-lrow"><button type="button" class="bd-lopen bd-pass" data-pw="' + esc(x.ph) + '"><b>' + esc(x.label) + "</b>" + (x.cur ? ' <em>(đang dùng)</em>' : "") + (x.title ? " · " + esc(x.title) : "") + "<small>" + esc(x.snip) + "…</small></button></div>";
        }).join("") : '<div class="bd-libmsg">Block này chưa có bài đọc.</div>') + '</div><div class="bd-libbar"><button type="button" data-pgen="1" class="bd-go">✨ Tạo bài mới bằng AI (Gemini, không được thì OpenAI)</button></div><div class="bd-libmsg" id="bd-libmsg"></div></div>';
    },
    doGen: async function () {
      var btn = document.querySelector("#bd-libm [data-pgen]"); if (!btn || btn.disabled) return;
      btn.disabled = true; Lib.msg("⏳ Đang nhờ AI viết bài (Gemini trước, không được thì OpenAI) — khoảng 10–30 giây…");
      try {
        var r = await api.generate(Lib.pBid, { keepCurrent: Lib.pOrig, topicHint: Lib.pHint });
        delete wlCache[Lib.pBid];
        Lib.close(); await openDoc({ k: "wl", bid: Lib.pBid, name: Lib.pName, ph: hashOf(r.raw), lb: r.provider === "gemini" ? "✨ Gemini" : r.provider === "openai" ? "✨ OpenAI" : "✨ AI", p: 1 });
      } catch (e) { btn.disabled = false; Lib.msg("⚠ " + (e && e.message ? e.message : e) + (e && e.kind === "no_key" ? " (chưa có khoá AI)" : "")); }
    },
    click: async function (e) {
      var b = e.target.closest("button"), m = $("#bd-libm");
      if (e.target === m) return Lib.close();
      if (!b) return;
      if (b.dataset.lx) return Lib.close();
      if (b.dataset.lt) { Lib.tab = b.dataset.lt; Lib.mode = "list"; Lib.pending = null; Lib.mvFile = null; return Lib.paint(); }
      if (b.dataset.lgo != null) { Lib.folder = b.dataset.lgo; return Lib.paint(); }
      if (b.dataset.ldir) { Lib.folder = Lib.path(b.dataset.ldir); return Lib.paint(); }
      if (b.dataset.lnew) {
        var nf = prompt(t("lib_mkn")); if (!nf) return; nf = nf.trim().replace(/[\\#?%:*"<>|]+/g, "-").replace(/^\/+|\/+$/g, ""); if (!nf) return;
        var rr = await api.lib.mkdir(Lib.path(nf)); if (rr.error) return Lib.msg("⚠ " + rr.error); Lib.folder = Lib.path(nf); return Lib.paint();
      }
      if (b.dataset.lfile) {
        var n = b.dataset.lfile, url = api.lib.url(Lib.path(n)), k = /\.pdf$/i.test(n) ? "pdf" : /\.(docx?|xlsx?|pptx?|rtf|csv)$/i.test(n) ? "office" : "img";
        Lib.msg("⏳…"); await openDoc({ k: k, url: url, name: n, p: 1 }); return Lib.close();
      }
      if (b.dataset.lmv) { Lib.mvFile = b.dataset.lmv; Lib.pending = null; Lib.mode = "dest"; return Lib.paint(); }
      if (b.dataset.ldno) { Lib.mode = "list"; Lib.pending = null; Lib.mvFile = null; return Lib.paint(); }
      if (b.dataset.ldok) return Lib.doDest();
      if (b.dataset.ldel) {
        if (!confirm("Xoá \"" + b.dataset.ldel + "\"? (nếu kho chưa cho xoá thì file được chuyển vào Thùng rác)")) return;
        var rd = await api.lib.remove(Lib.path(b.dataset.ldel));
        if (rd.error) { var rm = await api.lib.move(Lib.path(b.dataset.ldel), "_Trash/" + Date.now().toString(36) + "_" + b.dataset.ldel); if (rm.error) return Lib.msg("⚠ " + rm.error); Lib.msg(t("lib_trash")); }
        return Lib.paint();
      }
      if (b.dataset.lren) { var nn = prompt("Tên mới", b.dataset.lren); if (!nn || nn === b.dataset.lren) return; var r2 = await api.lib.move(Lib.path(b.dataset.lren), Lib.path(nn.replace(/[\\/\\\\#?%]+/g, "-"))); if (r2.error) return Lib.msg("⚠ " + r2.error); return Lib.paint(); }
      if (b.dataset.rec != null) { var rc = recents()[+b.dataset.rec]; if (!rc) return; var o2 = {}; Object.keys(rc).forEach(function (k) { if (k !== "key" && k !== "t" && rc[k] != null) o2[k] = rc[k]; }); Lib.close(); await openDoc(o2); return; }
      if (b.dataset.pw) { var nm0 = Lib.pName, lb0 = (b.querySelector("b") || {}).textContent || ""; Lib.close(); await openDoc({ k: "wl", bid: Lib.pBid, name: nm0, ph: b.dataset.pw, lb: lb0, p: 1 }); return; }
      if (b.dataset.pgen) return Lib.doGen();
      if (b.dataset.qgo) return Lib.qGo();
      if (b.dataset.qclr) { Lib.sel = []; Lib.drawTree($("#bd-wlq") ? $("#bd-wlq").value : "", $("#bd-wllist")); Lib.selPaint(); return; }
      if (b.dataset.wl) return Lib.paintPass(b.dataset.wl, b.dataset.wn || "", false);
      if (b.dataset.vt) { Lib.close(); sideAfter(); await openDoc({ k: "vt", bid: b.dataset.vt, name: b.dataset.wn || "", p: 1 }); return; }
    },
    change: async function (e) {
      if (Lib.treeChange(e)) return;
      if (e.target.id === "bd-destsel") { var nw = $("#bd-destnew"); if (nw) nw.hidden = e.target.value !== "__new"; return; }
      if (e.target.id !== "bd-libfile") return;
      var fs = [].slice.call(e.target.files || []); if (!fs.length) return;
      Lib.pending = fs.filter(function (f0) { if (f0.size > 50 * 1024 * 1024) { Lib.msg("⚠ " + f0.name + ": > 50 MB"); return false; } return true; });
      if (!Lib.pending.length) return;
      Lib.mode = "dest"; Lib.paint();
    },
    doDest: async function () {
      var sel = $("#bd-destsel"); if (!sel) return;
      var dest = sel.value;
      if (dest === "__new") {
        dest = ($("#bd-destnew").value || "").trim().replace(/[\\#?%:*"<>|]+/g, "-").replace(/^\/+|\/+$/g, "");
        if (!dest) return Lib.msg("⚠ " + t("lib_mkn"));
        var rr = await api.lib.mkdir(dest); if (rr.error) return Lib.msg("⚠ " + rr.error);
      }
      var pre = dest ? dest + "/" : "";
      if (Lib.pending) {
        var fs = Lib.pending;
        for (var i = 0; i < fs.length; i++) {
          var f0 = fs[i]; Lib.msg("⏳ " + (i + 1) + "/" + fs.length + " " + f0.name);
          var nm = f0.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^A-Za-z0-9._-]+/g, "_");
          var r = await api.lib.upload(pre + nm, f0); if (r.error) { Lib.msg("⚠ " + f0.name + ": " + r.error + (/mime/i.test(r.error) ? " — cần mở loại file này trong Supabase (xem hướng dẫn của Claude)" : "")); return; }
        }
        Lib.pending = null; Lib.folder = dest;
      } else if (Lib.mvFile) {
        var r3 = await api.lib.move(Lib.path(Lib.mvFile), pre + Lib.mvFile); if (r3.error) return Lib.msg("⚠ " + r3.error);
        Lib.mvFile = null; Lib.folder = dest;
      }
      Lib.mode = "list"; Lib.paint();
    },
    /* 📖 chọn bài đọc / 📋 bảng từ vựng bằng CÂY THƯ MỤC như trong game (Hub › Notebook › Section › Page › Batch › Block) */
    paintWL: async function () {
      var m = $("#bd-libm"); if (!m) return;
      m.innerHTML = Lib.head() + Lib.recentHTML() + '<div class="bd-libmsg">' + esc(t("lib_pick")) + '</div><input type="search" id="bd-wlq" placeholder="' + esc(t("lib_find")) + '"><div id="bd-wllist" class="bd-liblist bd-tree">⏳</div>' + Lib.selBar() + '<div class="bd-libmsg" id="bd-libmsg"></div></div>';
      Lib.selPaint();
      var T = await api.tree(); if (!$("#bd-wllist")) return;
      if (!T) { $("#bd-wllist").textContent = "⚠"; return; }
      Lib.T = T; Lib.drawTree("");
      $("#bd-wlq").addEventListener("input", function () { var v = this.value; clearTimeout(Lib.qt); Lib.qt = setTimeout(function () { Lib.drawTree(v); }, 250); });
    },
    /* ----- chọn nhiều Block (ô tick ở từng Block và từng thư mục) -> mở nối tiếp 📋 + 📖 trên bảng ----- */
    sel: [], parts: "wv",
    selHas: function (id) { return Lib.sel.some(function (x) { return x.id === id; }); },
    selSet: function (id, n, on) { var has = Lib.selHas(id); if (on && !has) Lib.sel.push({ id: id, n: n }); else if (!on && has) Lib.sel = Lib.sel.filter(function (x) { return x.id !== id; }); },
    selBar: function () {
      return '<div class="bd-selbar"><label><input type="checkbox" class="bd-qpv"' + (Lib.parts.indexOf("v") >= 0 ? " checked" : "") + '> 📋 Từ vựng</label><label><input type="checkbox" class="bd-qpw"' + (Lib.parts.indexOf("w") >= 0 ? " checked" : "") + '> 📖 Bài đọc</label>' +
        '<span class="bd-selc"></span><button type="button" class="bd-go" data-qgo="1">▶ Mở trên bảng</button><button type="button" data-qclr="1">Bỏ chọn</button></div>';
    },
    selPaint: function () {
      var n = Lib.sel.length;
      document.querySelectorAll(".bd-selc").forEach(function (e) { e.textContent = n ? "✓ " + n + " Block" : "Chưa chọn Block"; });
      document.querySelectorAll("[data-qgo]").forEach(function (e) { e.disabled = !n; });
      document.querySelectorAll(".bd-qpv").forEach(function (e) { e.checked = Lib.parts.indexOf("v") >= 0; });
      document.querySelectorAll(".bd-qpw").forEach(function (e) { e.checked = Lib.parts.indexOf("w") >= 0; });
    },
    treeChange: function (e) {
      var c = e.target; if (!c.classList) return false;
      if (c.classList.contains("bd-qpv") || c.classList.contains("bd-qpw")) {
        var ch = c.classList.contains("bd-qpv") ? "v" : "w", has = Lib.parts.replace(ch, "") + (c.checked ? ch : "");
        Lib.parts = (has.indexOf("v") >= 0 ? "v" : "") + (has.indexOf("w") >= 0 ? "w" : ""); Lib.selPaint(); return true;
      }
      if (!c.classList.contains("bd-tck")) return false;
      if (c.dataset.bid) Lib.selSet(c.dataset.bid, c.dataset.bn, c.checked);
      else { var det = c.closest("details"); if (det) det.querySelectorAll("input.bd-tck[data-bid]").forEach(function (x) { x.checked = c.checked; Lib.selSet(x.dataset.bid, x.dataset.bn, c.checked); }); }
      Lib.selPaint(); return true;
    },
    qGo: async function () {
      if (!api.isHost()) return;
      if (!Lib.sel.length || !Lib.parts) { Lib.msg("Chọn ít nhất 1 Block và 1 phần (từ vựng / bài đọc)"); return; }
      Lib.close(); sideAfter(); await openQueue(Lib.sel.map(function (x) { return [x.id, x.n]; }), Lib.parts);
    },
    drawTree: function (q, box) {
      var T = Lib.T; box = box || $("#bd-wllist"); if (!box || !T) return;
      function kids(list, key, id) { return T[list].filter(function (r) { return r[key] === id; }); }
      function leaf(bl) {
        return '<div class="bd-lrow bd-tleaf"><input type="checkbox" class="bd-tck" data-bid="' + esc(bl.id) + '" data-bn="' + esc(bl.name) + '"' + (Lib.selHas(bl.id) ? " checked" : "") + '><span class="bd-tn">' + esc(bl.name) + '</span><button type="button" data-wl="' + esc(bl.id) + '" data-wn="' + esc(bl.name) + '" title="' + esc(t("lib_rd")) + '">📖</button><button type="button" data-vt="' + esc(bl.id) + '" data-wn="' + esc(bl.name) + '" title="' + esc(t("lib_vc")) + '">📋</button></div>';
      }
      if (q && q.trim()) {   /* tìm: liệt kê Block có tên (hoặc thư mục cha) khớp, kèm đường dẫn */
        var ql = q.trim().toLowerCase(), byId = function (list, id) { return T[list].find(function (r) { return r.id === id; }) || {}; }, out = [];
        T.blocks.forEach(function (bl) {
          var bt = byId("batches", bl.batch_id), pg = byId("pages", bt.page_id), sc = byId("sections", pg.section_id), nb = byId("notebooks", sc.notebook_id), hb = byId("hubs", nb.hub_id);
          var path = [hb.name, nb.name, sc.name, pg.name, bt.name].filter(Boolean).join(" › ");
          if ((path + " " + bl.name).toLowerCase().indexOf(ql) >= 0 && out.length < 60) out.push('<div class="bd-tpath">' + esc(path) + "</div>" + leaf(bl));
        });
        box.innerHTML = out.join("") || '<div class="bd-libmsg">—</div>'; return;
      }
      /* node trả {h: html, ids: [mọi Block bên dưới]} để ô thư mục tự tick khi mọi Block con đã chọn */
      function node(name, parts, open) {
        var ids = [], html = parts.map(function (x) { ids = ids.concat(x.ids); return x.h; }).join("");
        var all = ids.length && ids.every(function (id) { return Lib.selHas(id); });
        return { ids: ids, h: '<details' + (open ? " open" : "") + '><summary><input type="checkbox" class="bd-tck"' + (all ? " checked" : "") + '><span class="bd-tsn">' + esc(name) + "</span></summary>" + html + "</details>" };
      }
      function nbTree(nb) {
        var sub = kids("notebooks", "parent_notebook_id", nb.id).map(nbTree).concat(kids("sections", "notebook_id", nb.id).map(function (sc) {
          return node(sc.name, kids("pages", "section_id", sc.id).map(function (pg) {
            return node(pg.name, kids("batches", "page_id", pg.id).map(function (bt) {
              return node(bt.name, kids("blocks", "batch_id", bt.id).map(function (bl) { return { h: leaf(bl), ids: [bl.id] }; }));
            }));
          }));
        }));
        return node(nb.name, sub);
      }
      box.innerHTML = T.hubs.map(function (h) { return node("🏠 " + h.name, T.notebooks.filter(function (n) { return n.hub_id === h.id && !n.parent_notebook_id; }).map(nbTree)).h; }).join("");
    }
  };
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
    b.dataset.bt = shStream ? "unshare" : "share"; var shTx = t(b.dataset.bt); b.title = shTx; b.textContent = String(shTx).split(" ")[0]; b.classList.toggle("on", !!shStream);
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
    isOpen: function () { return open; },
    noSound: function () { if (!noSoundAt || Date.now() - noSoundAt > 20000) { noSoundAt = Date.now(); feedNote("🔇 Máy này chưa phát được tiếng đọc — kiểm tra loa / âm lượng máy và quyền âm thanh của trình duyệt, rồi bấm đọc lại."); } },
    /* 🖤 từ cây chủ đề của game (⋯ › Mở lên bảng): list = [[blockId, tên], …], parts = "vw" | "w" | "v" */
    /* TJ 2026-10-05: bảng là TỪNG BLOCK — 1 Block thì mở thẳng (bài đọc trước); nhiều Block (Batch/Page/…) thì mở bảng ở màn DANH SÁCH để TJ chọn */
    openBlocks: function (list, parts) {
      if (!(api && api.isHost())) return;
      if (list && list.length === 1) openQueue(list, "wv");
      else { if (!open) api.setBoard(true); mini = false; if (curDoc()) docSet(null); else notifyParent(true); }
    }
  };
})();
