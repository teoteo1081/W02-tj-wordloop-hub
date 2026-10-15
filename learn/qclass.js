/* qclass.js — LỚP KAHOOT cho EA Quest / Marketing Quest (TJ 2026-10-15): host chọn module + số câu + giây/câu, cả phòng trả lời CÙNG LÚC trên máy mình,
   hết giờ (hoặc cả phòng đã trả lời) thì lộ đáp án + lời giải + bảng điểm; host bấm "Câu tiếp".
   Chạy bên trong khung iframe của thẻ (learn/dm hoặc learn/ea); trang cha (js/swclass.js) chỉ chuyển tin qua kênh phòng:
     khung -> cha: {type:"sw-class-send", p:{t:"qz"|"qa", game, ...}} · cha -> khung: {type:"sw-qz", p} · ngữ cảnh phòng: "sw-ctx" (hỏi bằng "sw-hello")
   Tin "qz" (host phát, nhắc lại mỗi 2s để khung nạp trễ vẫn kịp): {run, ph:"q"|"rev"|"end"|"close", i, n, q:{t,o}, rem(giây còn lại), tot, ans, exp, cnt, board, got}
   Tin "qa" (người chơi gửi host): {run, i, pid, name, avatar, c(chỉ số đáp án), ms}. Điểm: đúng = 1000 − 500 × (thời gian dùng / thời gian cho). */
(function () {
  "use strict";
  var GID = window.QUEST_CLASS_ID || "dm", DATA = window.QUEST_LESSONS || window.EA_LESSONS || { lessons: [], questions: [] };
  if (!DATA.questions || !DATA.questions.length || window.top === window) return;   /* mở thẳng (không trong game) thì không có phòng */
  var CTX = { inRoom: false, isHost: false, me: null, players: [], room: "" }, Z = null, H = null, tmr = 0, hbT = 0, setup = null;
  var $ = function (s, r) { return (r || document).querySelector(s); }, esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function toParent(m) { try { window.parent.postMessage(m, location.origin); } catch (e) {} }
  function send(p) { p.t = p.t || "qz"; p.game = GID; toParent({ type: "sw-class-send", p: p }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ava(a) { return a && /^https?:/.test(a) ? '<img src="' + esc(a) + '" alt="" style="width:1.2em;height:1.2em;border-radius:50%;vertical-align:-.2em">' : esc(a || "🙂"); }

  /* ---------- giao diện ---------- */
  var css = document.createElement("style");
  css.textContent = "#qc{position:fixed;inset:0;z-index:9000;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;overflow:auto;font:16px/1.5 system-ui,sans-serif}" +
    "#qc .qw{max-width:720px;width:100%;margin:0 auto;padding:12px 14px 90px;box-sizing:border-box}#qc h2{margin:6px 0 10px;font-size:22px}" +
    "#qc .qtop{display:flex;align-items:center;gap:10px;margin-bottom:8px}#qc .qx{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:18px;cursor:pointer}" +
    "#qc .qn{font-weight:700}#qc .qc2{margin-left:auto;font-size:30px;font-weight:800;font-variant-numeric:tabular-nums;color:#d97757}" +
    "#qc .qbar{height:8px;border-radius:99px;background:var(--line);overflow:hidden;margin:4px 0 14px}#qc .qbar i{display:block;height:100%;background:#d97757;transition:width .25s linear}" +
    "#qc .qq{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;font-size:20px;font-weight:600;margin-bottom:12px}" +
    "#qc .qo{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;margin:8px 0;padding:14px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:17px;cursor:pointer}" +
    "#qc .qo b{flex:none;width:30px;height:30px;border-radius:8px;background:var(--line);display:flex;align-items:center;justify-content:center}" +
    "#qc .qo.on{border-color:#d97757;background:rgba(217,119,87,.16)}#qc .qo.ok{border-color:#4fb985;background:rgba(79,185,133,.2)}#qc .qo.bad{border-color:#e0607a;background:rgba(224,96,122,.18)}#qc .qo[disabled]{cursor:default}" +
    "#qc .qcnt{margin-left:auto;font-size:14px;color:var(--muted);white-space:nowrap}" +
    "#qc .qex{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0;font-size:16px}" +
    "#qc .qbd{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 12px;margin:10px 0}#qc .qbd div{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}#qc .qbd div:last-child{border:0}#qc .qbd .pts{margin-left:auto;font-weight:800}#qc .qbd .d{color:#4fb985;font-size:13px}" +
    "#qc .qb{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 20px;border-radius:10px;border:1px solid transparent;background:#d97757;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}#qc .qb.soft{background:var(--card);color:var(--ink);border-color:var(--line)}" +
    "#qc .rcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:6px 0 10px}#qc .rtop{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}#qc .rcode{font-size:34px;font-weight:800;letter-spacing:3px;color:#d97757;line-height:1.1}#qc .rcard .sub{font-size:13px;color:var(--muted)}#qc .rbtn{display:flex;gap:8px;flex-wrap:wrap}#qc .rps{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}#qc .rp{display:flex;flex-direction:column;align-items:center;font-size:12px;gap:3px}#qc .rp .av{width:44px;height:44px;font-size:26px}" +
    "#qc .qb.sm{padding:10px 14px}#qc .mg{margin-top:18px}#qc .qfoot{position:fixed;left:0;right:0;bottom:0;padding:10px 14px;background:var(--bg);border-top:1px solid var(--line);display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}#qc .qfoot .sm:first-child{margin-right:auto}" +
    "#qc .qs label{display:block;margin:12px 0 4px;color:var(--muted);font-size:14px}#qc .qch{display:flex;flex-wrap:wrap;gap:6px}#qc .qch button{padding:8px 12px;border-radius:99px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}#qc .qch button.on{background:#d97757;border-color:#d97757;color:#fff}" +
    "#qc .av{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--card);border:3px solid var(--line);font-size:20px;overflow:hidden;flex:none}#qc .av img{width:100%;height:100%;object-fit:cover}" +
    "#qc .av.dim{opacity:.35;filter:grayscale(1)}#qc .av.lit{border-color:#d97757}#qc .av.ok{border-color:#4fb985;box-shadow:0 0 0 2px rgba(79,185,133,.35)}#qc .av.bad{border-color:#e0607a;box-shadow:0 0 0 2px rgba(224,96,122,.3)}" +
    "#qc .strip{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 12px}#qc .strip .l{font-size:13px;color:var(--muted);margin-right:4px}#qc .qo .who{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}#qc .qo .who .av{width:28px;height:28px;font-size:16px;border-width:2px}" +
    "#qc .pod{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:14px 0}#qc .pod>div{text-align:center;flex:1;max-width:150px}#qc .pod .av{width:64px;height:64px;font-size:34px;margin:0 auto 6px}#qc .pod .blk{border-radius:10px 10px 0 0;background:#d97757;color:#fff;font-weight:800;padding:8px 0}" +
    "#qfab{position:fixed;right:14px;bottom:78px;z-index:8000;padding:11px 18px;border-radius:99px;border:0;background:#d97757;color:#fff;font:700 16px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer}";
  css.textContent += "#qc[hidden],#qfab[hidden]{display:none!important}";
  document.head.appendChild(css);
  var ov = document.createElement("div"); ov.id = "qc"; ov.hidden = true; document.body.appendChild(ov);
  var fab = document.createElement("button"); fab.id = "qfab"; fab.type = "button"; fab.hidden = true; fab.textContent = "👥 Chơi cả phòng"; document.body.appendChild(fab);

  function av(id, cls) { var n = (Z && Z.pl && Z.pl[id]) || {}; return '<span class="av ' + (cls || "") + '" title="' + esc(n.name || "") + '">' + ava(n.avatar) + "</span>"; }
  function rem() { return Z && Z.tEnd ? Math.max(0, (Z.tEnd - Date.now()) / 1000) : 0; }
  function paintBoard(b, meId) { var pk = Z && Z.ph === "rev" ? Z.picks || null : null; return '<div class="qbd">' + (b || []).slice(0, 8).map(function (r, k) { var c = pk ? pk[r.id] : null, mk = pk ? (c == null ? "⏰" : c === Z.ans ? "✅" : "❌") : ""; return "<div><b>" + (k + 1) + "</b>" + '<span class="av ' + (pk ? (c == null ? "dim" : c === Z.ans ? "ok" : "bad") : "") + '">' + ava(r.avatar) + "</span><span>" + esc(r.name) + (r.id === meId ? " (bạn)" : "") + '</span><span class="pts">' + mk + " " + r.pts + "</span>" + (r.last ? '<span class="d">+' + r.last + "</span>" : "") + "</div>"; }).join("") + "</div>"; }
  function podium(b) {
    b = (b || []).slice(0, 3); if (!b.length) return ""; var order = b.length === 3 ? [1, 0, 2] : b.length === 2 ? [1, 0] : [0], hh = [90, 64, 48];
    return '<div class="pod">' + order.map(function (i) { var r = b[i]; return '<div><span class="av ok">' + ava(r.avatar) + "</span><div>" + esc(r.name) + '</div><div class="blk" style="height:' + hh[i] + 'px">' + ["🥇", "🥈", "🥉"][i] + " " + r.pts + "</div></div>"; }).join("") + "</div>";
  }
  function render() {
    if (!Z || Z.ph === "close") { ov.hidden = true; fab.hidden = !(CTX.isHost && CTX.inRoom); return; }
    ov.hidden = false; fab.hidden = true;
    var host = !!H, me = CTX.me || {}, mine = Z.my, h = '<div class="qw"><div class="qtop"><button class="qx" data-q="quit" title="' + (host ? "Đóng lớp" : "Thoát") + '">✕</button><span class="qn">' + (Z.ph === "end" ? "🏆 Kết quả" : "Câu " + (Z.i + 1) + "/" + Z.n) + "</span>" + (Z.ph === "q" ? '<span class="qcnt">' + (host ? "Đã trả lời " + (Z.got || 0) + "/" + (H.expect || 0) : mine != null ? "✓ Đã chọn" : "") + '</span><span class="qc2" id="qcd">' + Math.ceil(rem()) + "</span>" : "") + "</div>";
    if (Z.ph === "end") h += "<h2>Bảng xếp hạng cuối</h2>" + podium(Z.board) + paintBoard(Z.board, me.id) + (host ? "" : '<p class="sub" style="color:var(--muted)">Host sẽ đóng lớp, bạn sẽ về phòng game.</p>');
    else {
      var q = Z.q || { t: "", o: [] };
      if (Z.ph === "q") h += '<div class="qbar"><i id="qpg" style="width:' + (Z.tot ? Math.min(100, 100 * rem() / Z.tot) : 0) + '%"></i></div>';
      if (Z.ph === "q") h += '<div class="strip"><span class="l">Đã trả lời:</span>' + Object.keys(Z.pl || {}).map(function (id) { return av(id, (Z.ids || []).indexOf(id) >= 0 ? "lit" : "dim"); }).join("") + "</div>";
      h += '<div class="qq">' + esc(q.t) + "</div>";
      q.o.forEach(function (o, k) {
        var cls = "qo", dis = "";
        if (Z.ph === "rev") { dis = " disabled"; if (k === Z.ans) cls += " ok"; else if (k === mine) cls += " bad"; }
        else if (mine === k) cls += " on"; else if (mine != null || (host && !H.hp)) dis = " disabled";
        h += '<button class="' + cls + '" data-q="pick" data-k="' + k + '"' + dis + "><b>" + "ABCD"[k] + "</b><span>" + esc(o) + "</span>" + (Z.ph === "rev" && Z.picks ? '<span class="who">' + Object.keys(Z.picks).filter(function (id) { return Z.picks[id] === k; }).map(function (id) { return av(id, k === Z.ans ? "ok" : "bad"); }).join("") + "</span>" : "") + "</button>";
      });
      if (Z.ph === "rev") {
        var my = (Z.board || []).filter(function (r) { return r.id === me.id; })[0];
        h += '<div class="qex"><b>' + (mine === Z.ans ? "✅ Đúng rồi!" : mine == null ? "⏰ Chưa trả lời" : "❌ Chưa đúng") + (my && my.last ? " +" + my.last : "") + "</b><br>" + esc(Z.exp || "") + "</div>" + (function () { var no = Object.keys(Z.pl || {}).filter(function (id) { return Z.picks && Z.picks[id] == null; }); return no.length ? '<div class="strip"><span class="l">⏰ Không kịp:</span>' + no.map(function (id) { return av(id, "dim"); }).join("") + "</div>" : ""; })() + paintBoard(Z.board, me.id);
      }
    }
    h += "</div>";
    if (host) h += '<div class="qfoot"><button class="qb soft sm" data-q="users" title="Quản lý người chơi">👥</button><button class="qb soft sm" data-q="copy" title="Copy link mời">🔗</button>' + (Z.ph === "q" ? '<button class="qb soft" data-q="lock">⏭ Chốt câu</button>' : Z.ph === "rev" ? '<button class="qb" data-q="next">' + (Z.i + 1 >= Z.n ? "🏆 Xem kết quả" : "Câu tiếp ›") + "</button>" : '<button class="qb" data-q="close">Đóng lớp</button>') + "</div>";
    ov.innerHTML = h;
  }
  function tick() {
    if (!Z || Z.ph !== "q") return;
    var d = $("#qcd"), pg = $("#qpg"), r = rem(); if (d) d.textContent = Math.ceil(r); if (pg && Z.tot) pg.style.width = Math.min(100, 100 * r / Z.tot) + "%";
    if (H && r <= 0) reveal();
  }
  setInterval(tick, 250);

  /* ---------- HOST ---------- */
  function lessonsList() { return DATA.lessons || []; }
  function roomCard() {   /* thẻ phòng giống phòng chờ game: mã phòng + avatar người trong phòng + Quản lý người chơi / Copy link mời */
    return '<div class="rcard"><div class="rtop"><div><div class="sub">Mã phòng</div><div class="rcode">' + esc(CTX.room || "") + '</div></div><div class="rbtn"><button class="qb soft sm" data-q="users">👥 Quản lý người chơi</button><button class="qb soft sm" data-q="copy">🔗 Copy link mời</button></div></div><div class="rps">' +
      (CTX.players || []).map(function (p) { return '<span class="rp" title="' + esc(p.name || "") + '"><span class="av lit">' + ava(p.avatar) + "</span><b>" + esc(p.name || "?") + "</b></span>"; }).join("") + "</div></div>";
  }
  function showSetup() {
    if (!setup) setup = { mods: lessonsList().map(function (l) { return l.id; }), n: 10, sec: 20, hp: true };
    var cnt = DATA.questions.filter(function (q) { return setup.mods.indexOf(q.lesson) >= 0; }).length, h = '<div class="qw"><div class="qtop"><button class="qx" data-q="setupx">✕</button><span class="qn">👥 Chơi cả phòng</span></div>' + roomCard() + '<div class="qs"><h2>Thiết lập ván</h2><label>Module / bài (chạm để bật/tắt) · ' + cnt + " câu có sẵn</label><div class=\"qch\">";
    lessonsList().forEach(function (l) { h += '<button class="' + (setup.mods.indexOf(l.id) >= 0 ? "on" : "") + '" data-q="mod" data-id="' + esc(l.id) + '">' + esc(String(l.title || l.id).slice(0, 34)) + "</button>"; });
    h += '</div><label>Số câu</label><div class="qch">' + [5, 10, 15, 20, 30].map(function (n) { return '<button class="' + (setup.n === n ? "on" : "") + '" data-q="n" data-v="' + n + '">' + n + "</button>"; }).join("") +
      '</div><label>Giây mỗi câu</label><div class="qch">' + [10, 15, 20, 30, 45].map(function (n) { return '<button class="' + (setup.sec === n ? "on" : "") + '" data-q="sec" data-v="' + n + '">' + n + "s</button>"; }).join("") +
      '</div><label><input type="checkbox" id="qhp"' + (setup.hp ? " checked" : "") + '> Host cũng chơi (tính điểm)</label><p style="margin-top:16px"><button class="qb" data-q="go"' + (cnt ? "" : " disabled") + '>▶ Bắt đầu</button></p></div></div>';
    ov.hidden = false; fab.hidden = true; ov.innerHTML = h;
  }
  function expectIds() { return (CTX.players || []).filter(function (p) { return setup.hp !== false || !(CTX.me && p.id === CTX.me.id); }).map(function (p) { return p.id; }); }
  function startRun() {
    var pool = shuffle(DATA.questions.filter(function (q) { return setup.mods.indexOf(q.lesson) >= 0; })).slice(0, setup.n);
    var qs = pool.map(function (q) { var idx = shuffle(q.opts.map(function (_, k) { return k; })); return { t: q.q, o: idx.map(function (k) { return q.opts[k]; }), a: idx.indexOf(q.a), exp: q.exp || "" }; });
    H = { hp: setup.hp !== false, run: Date.now() + "-" + Math.random().toString(36).slice(2, 6), qs: qs, i: -1, sec: setup.sec, ans: {}, score: {}, last: {}, expect: 0, names: {} };
    (CTX.players || []).forEach(function (p) { H.names[p.id] = { name: p.name, avatar: p.avatar }; H.score[p.id] = 0; });
    nextQ();
  }
  function playersMap() { var m = {}; (CTX.players || []).forEach(function (p) { if (H.hp !== false || !(CTX.me && p.id === CTX.me.id)) m[p.id] = { name: p.name, avatar: p.avatar }; }); Object.keys(H.ans).forEach(function (id) { if (!m[id]) m[id] = H.names[id] || {}; }); return m; }
  function snap() {
    var q = H.qs[H.i] || { t: "", o: [], a: 0, exp: "" }, base = { run: H.run, ph: H.ph, i: H.i, n: H.qs.length, q: { t: q.t, o: q.o }, tot: H.sec, rem: H.ph === "q" ? rem() : 0, got: Object.keys(H.ans).length, ids: Object.keys(H.ans), pl: playersMap() };
    if (H.ph === "rev" || H.ph === "end") { base.ans = q.a; base.exp = q.exp; base.cnt = H.cnt; base.board = H.board; base.picks = {}; Object.keys(base.pl).forEach(function (id) { base.picks[id] = H.ans[id] ? H.ans[id].c : null; }); }
    return base;
  }
  function pushState() { if (!H) return; var s = snap(); send(s); Z = Object.assign({}, s, { tEnd: H.tEnd, my: H.my }); render(); }
  function nextQ() {
    H.i++; if (H.i >= H.qs.length) return finish();
    H.ph = "q"; H.ans = {}; H.my = null; H.tEnd = Date.now() + H.sec * 1000; H.t0 = Date.now(); H.expect = expectIds().length; H.last = {};
    pushState(); clearInterval(hbT); hbT = setInterval(pushState, 2000);
  }
  function board() {
    return Object.keys(H.score).map(function (id) { var n = H.names[id] || {}; return { id: id, name: n.name || "?", avatar: n.avatar || "", pts: H.score[id], last: H.last[id] || 0 }; }).sort(function (a, b) { return b.pts - a.pts; });
  }
  function reveal() {
    if (!H || H.ph !== "q") return;
    var q = H.qs[H.i]; H.ph = "rev"; H.cnt = [0, 0, 0, 0];
    Object.keys(H.ans).forEach(function (id) { var a = H.ans[id]; H.cnt[a.c] = (H.cnt[a.c] || 0) + 1; if (a.c === q.a) { var pts = Math.round(1000 - 500 * Math.min(1, a.ms / (H.sec * 1000))); H.score[id] = (H.score[id] || 0) + pts; H.last[id] = pts; } });
    H.board = board(); pushState();
  }
  function finish() { H.ph = "end"; H.board = board(); H.last = {}; H.board.forEach(function (r) { r.last = 0; }); pushState(); }
  function closeRun() { clearInterval(hbT); if (H) send({ run: H.run, ph: "close" }); H = null; Z = null; ov.hidden = true; fab.hidden = !(CTX.isHost && CTX.inRoom); }
  function hostGot(a) {   /* người chơi gửi đáp án */
    if (!H || H.ph !== "q" || a.run !== H.run || a.i !== H.i || H.ans[a.pid]) return;
    H.names[a.pid] = { name: a.name, avatar: a.avatar }; if (H.score[a.pid] == null) H.score[a.pid] = 0;
    H.ans[a.pid] = { c: a.c, ms: Math.max(0, +a.ms || 0) };
    if (Object.keys(H.ans).length >= H.expect) reveal(); else pushState();
  }

  /* ---------- sự kiện ---------- */
  ov.addEventListener("click", function (e) {
    var b = e.target.closest("[data-q]"); if (!b || b.disabled) return; var a = b.dataset.q, me = CTX.me || {};
    if (a === "quit") { if (H) { if (confirm("Đóng lớp cho cả phòng?")) closeRun(); } else { ov.hidden = true; toParent({ type: "sw-leave" }); } }
    else if (a === "setupx") { ov.hidden = true; fab.hidden = false; }
    else if (a === "mod") { var i = setup.mods.indexOf(b.dataset.id); if (i >= 0) setup.mods.splice(i, 1); else setup.mods.push(b.dataset.id); showSetup(); }
    else if (a === "n") { setup.n = +b.dataset.v; showSetup(); } else if (a === "sec") { setup.sec = +b.dataset.v; showSetup(); }
    else if (a === "go") { var hp = $("#qhp"); setup.hp = hp ? hp.checked : true; startRun(); }
    else if (a === "users" || a === "copy") toParent({ type: "sw-do", a: a });
    else if (a === "lock") reveal(); else if (a === "next") nextQ(); else if (a === "close") closeRun();
    else if (a === "pick" && Z && Z.ph === "q" && Z.my == null) {
      var k = +b.dataset.k, used = Math.max(0, (Z.tot || 0) * 1000 - rem() * 1000); Z.my = k;
      if (H) { H.my = k; hostGot({ run: H.run, i: H.i, pid: me.id, name: me.name, avatar: me.avatar, c: k, ms: used }); } else send({ t: "qa", run: Z.run, i: Z.i, pid: me.id, name: me.name || "", avatar: me.avatar || "", c: k, ms: used });
      render();
    }
  });
  ov.addEventListener("change", function (e) { if (e.target.id === "qhp") setup.hp = e.target.checked; });
  fab.addEventListener("click", showSetup);
  window.addEventListener("message", function (e) {
    var d = e.data; if (e.origin !== location.origin || !d || typeof d.type !== "string") return;
    if (d.type === "sw-ctx") { CTX = { inRoom: !!d.inRoom, isHost: !!d.isHost, me: d.me || null, players: d.players || [], room: d.room || "" }; if (!Z && !H) fab.hidden = !(CTX.isHost && CTX.inRoom) || !ov.hidden; }
    else if (d.type === "sw-qz" && d.p) {
      var p = d.p; if (p.game !== GID) return;
      if (p.t === "qa") { if (H) hostGot(p); return; }
      if (H) return;   /* host tự giữ trạng thái của mình */
      if (p.ph === "close") { var was = !!Z; Z = null; ov.hidden = true; if (was) toParent({ type: "sw-leave" }); return; }
      var keepMy = Z && Z.run === p.run && Z.i === p.i ? Z.my : null;
      Z = Object.assign({}, p, { tEnd: Date.now() + (p.rem || 0) * 1000, my: keepMy });
      if (Z.ph === "rev" && Z.my == null) Z.my = null;
      render();
    }
  });
  setInterval(function () { toParent({ type: "sw-hello", kind: "dm" }); }, 2500); toParent({ type: "sw-hello", kind: "dm" });
})();
