/* sw.js — TOEIC Speaking & Writing (luyện một mình): đề theo dạng ETS, đếm giờ chuẩn, ghi âm (Web Speech) hoặc gõ bài, AI (Gemini qua gemini-proxy) chấm điểm ƯỚC TÍNH.
   Dữ liệu: sets.json (đề AI sinh bởi tools/sw/gen_sets.py) + đề riêng nạp từ file (localStorage, không lên server). Tiến độ lưu localStorage "sw-quest-v1".
   Chạy thử không cần mic: thêm ?mock=1 (giọng giả lấy từ bài mẫu, đồng hồ nhanh 25 lần). */
(function () {
  "use strict";
  var CFG = window.APP_CONFIG || {}, QS = new URLSearchParams(location.search), MOCK = QS.get("mock") === "1", SCALE = MOCK ? 0.04 : 1;
  var $ = function (s) { return document.querySelector(s); }, app = $("#app");
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var KEY = "sw-quest-v1", EXTRA = "sw-extra-sets-v1";
  var TIME = {
    speaking: { 1: [45, 45], 2: [45, 45], 3: [45, 30], 4: [3, 15], 5: [3, 15], 6: [3, 30], 7: [3, 15], 8: [3, 15], 9: [3, 30], 10: [30, 60], 11: [15, 60] },   /* [chuẩn bị, trả lời] giây */
    writing: { 1: [0, 90], 2: [0, 90], 3: [0, 90], 4: [0, 90], 5: [0, 90], 6: [0, 600], 7: [0, 600], 8: [0, 1800] }
  };
  var MAXS = { speaking: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 5, 11: 5 }, writing: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5 } };
  var GROUPS = {
    speaking: [{ k: "all", t: "Cả bộ 11 câu (~17 phút)", qs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, { k: "read", t: "Q1–2 Đọc to", qs: [1, 2] }, { k: "desc", t: "Q3 Tả ảnh", qs: [3] }, { k: "resp", t: "Q4–6 Trả lời câu hỏi", qs: [4, 5, 6] }, { k: "info", t: "Q7–9 Dựa vào thông tin", qs: [7, 8, 9] }, { k: "sol", t: "Q10 Đề xuất giải pháp", qs: [10] }, { k: "opin", t: "Q11 Nêu ý kiến", qs: [11] }],
    writing: [{ k: "all", t: "Cả bộ 8 câu (~60 phút)", qs: [1, 2, 3, 4, 5, 6, 7, 8] }, { k: "sent", t: "Q1–5 Viết câu theo ảnh", qs: [1, 2, 3, 4, 5] }, { k: "mail", t: "Q6–7 Trả lời email", qs: [6, 7] }, { k: "essay", t: "Q8 Bài luận ý kiến", qs: [8] }]
  };
  var SETS = { speaking: [], writing: [] }, ST = load(), S = { kind: QS.get("kind") === "writing" ? "writing" : "speaking", setId: "", group: "all", screen: "home" }, timerId = 0, rec = null, recOn = false, CTX = { inRoom: false, isHost: false, me: null, players: [] }, LIVE = null, liveTimer = 0, PENDING = null;

  /* ---------- lưu ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { hist: [] }; } catch (e) { return { hist: [] }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
  function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("show"); }, 2400); }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function nWords(s) { return (String(s || "").match(/[A-Za-z0-9'’-]+/g) || []).length; }

  /* ---------- nạp đề ---------- */
  async function loadSets() {
    try { var r = await fetch("sets.json?v=" + (QS.get("v") || "1")); var d = await r.json(); SETS.speaking = d.speaking || []; SETS.writing = d.writing || []; } catch (e) { toast("Không tải được bộ đề"); }
    try { var x = JSON.parse(localStorage.getItem(EXTRA) || "null"); if (x) { (x.speaking || []).forEach(function (s) { s.mine = 1; SETS.speaking.push(s); }); (x.writing || []).forEach(function (s) { s.mine = 1; SETS.writing.push(s); }); } } catch (e) {}
    S.setId = (SETS[S.kind][0] || {}).id || "";
  }
  function curSet() { return SETS[S.kind].filter(function (s) { return s.id === S.setId; })[0]; }
  function curTask() { return S.tasks[S.i]; }
  function best(kind, id) { var b = 0; ST.hist.forEach(function (h) { if (h.kind === kind && h.set === id && h.group === "all" && h.est > b) b = h.est; }); return b; }

  /* ---------- màn hình ---------- */
  function render() {
    if (S.screen === "rev") return revView();
    if (S.screen === "live") return liveRender();
    if (S.screen === "home") return home();
    if (S.screen === "sum") return summary();
    return task();
  }
  function home() {
    var sets = SETS[S.kind], set = curSet(), g = GROUPS[S.kind];
    var fixed = !!QS.get("kind");
    var h = '<h1>' + (S.kind === "speaking" ? "🎤 TOEIC Speaking" : "✍️ TOEIC Writing") + '</h1><p class="sub">Luyện theo dạng ETS: đếm giờ chuẩn, ' + (S.kind === "speaking" ? "nói vào micro" : "gõ bài") + ', AI chấm điểm <b>ước tính</b> (không phải điểm chính thức).</p>' +
      '<div class="tabs"' + (fixed ? " hidden" : "") + '><button class="' + (S.kind === "speaking" ? "on" : "") + '" data-act="kind" data-v="speaking">🎤 Nói (Speaking)</button><button class="' + (S.kind === "writing" ? "on" : "") + '" data-act="kind" data-v="writing">✍️ Viết (Writing)</button></div>';
    if (S.kind === "speaking" && !SR && !MOCK) h += '<div class="warn">Trình duyệt này không nhận giọng nói (Web Speech). Dùng Chrome/Edge trên máy tính hoặc Android để nói; ở đây bạn vẫn gõ lại lời mình nói được.</div>';
    h += classBanner() + '<h2>Chọn đề</h2><div class="setgrid">' + sets.map(function (s, i) { var b = best(S.kind, s.id); return '<button class="' + (s.id === S.setId ? "on" : "") + '" data-act="set" data-v="' + esc(s.id) + '">' + (s.mine ? "📥 " : "") + "Đề " + (i + 1) + "<small>" + (b ? "tốt nhất ~" + b : esc(s.title || "")).slice(0, 34) + "</small></button>"; }).join("") + "</div>";
    if (!sets.length) h += '<p class="sub">Chưa có đề.</p>';
    if (set) {
      h += "<h2>Luyện</h2><div class=\"parts\">" + g.map(function (x, i) { var miss = S.kind === "speaking" && x.qs.indexOf(3) >= 0 && x.k === "desc" && !(set.tasks.filter(function (t) { return t.q === 3; })[0] || {}).scene && !(set.tasks.filter(function (t) { return t.q === 3; })[0] || {}).image; return '<button class="' + (i === 0 ? "pri full" : "") + '" data-act="start" data-v="' + x.k + '"' + (miss ? " disabled" : "") + ">" + (i === 0 ? "▶ " : "") + esc(x.t) + "</button>"; }).join("") + "</div>";
      var hist = ST.hist.filter(function (h2) { return h2.kind === S.kind && h2.set === set.id; }).slice(-3).reverse();
      if (hist.length) h += '<h2>Lần làm gần đây</h2><div class="card">' + hist.map(function (x) { return '<div class="row"><span class="sub">' + new Date(x.ts).toLocaleDateString() + " · " + esc(x.gt) + '</span><span style="margin-left:auto"><b>' + x.raw + "/" + x.max + "</b> ≈ " + x.est + "</span></div>"; }).join("") + "</div>";
    }
    var nrev = (ST.rev || []).filter(function (r) { return r.kind === S.kind; }).length;
    if (nrev) h += '<button class="big" data-act="rev" style="margin-top:10px">📒 Xem lại bài cũ (' + nrev + ")</button>";
    h += '<details><summary>📥 Nạp đề riêng từ file .json (lưu ở máy này)</summary><p class="sub">Dùng file do <code>tools/sw/parse_prepedu.py</code> tạo. Đề nạp ở đây chỉ nằm trong trình duyệt của bạn, không đưa lên web.</p><input type="file" id="imp" accept=".json,application/json"> <button class="soft" data-act="delextra">Xoá đề đã nạp</button></details>';
    app.innerHTML = h;
    var imp = $("#imp"); if (imp) imp.onchange = importFile;
  }
  /* ---------- CHẾ ĐỘ LỚP (js/swclass.js ở trang game lo kênh phòng) ---------- */
  function classBanner() {
    if (!CTX.inRoom) return "";
    if (CTX.isHost) return '<label class="card clsrow"><input type="checkbox" id="clsmode"' + (S.classMode ? " checked" : "") + '><span>👥 <b>Chế độ lớp</b><br><span class="sub">Bật rồi chọn đề: cả phòng cùng xem, bạn bấm giờ từng người</span></span></label>';
    return '<div class="warn">👥 Bạn đang trong phòng. Khi host bấm bắt đầu, bài sẽ tự mở ra. Bạn vẫn luyện riêng được.</div>';
  }
  function toParent(m) { try { if (window.parent !== window) window.parent.postMessage(m, location.origin); } catch (e) {} }
  function avatarHtml(a) { a = String(a || ""); return /^https?:/.test(a) ? '<img src="' + esc(a) + '" alt="" style="width:20px;height:20px;border-radius:50%;vertical-align:-5px">' : esc(a.slice(0, 2) || "👤"); }
  function boardHtml() {
    if (!S.class) return "";
    var rows = Object.keys(S.class.board).map(function (k) { return S.class.board[k]; }).sort(function (a, b) { return b.total - a.total; });
    if (!rows.length) return '<div class="card" id="cls-board"><b>🏆 Bảng điểm lớp</b><p class="sub">Đang chờ kết quả…</p></div>';
    return '<div class="card" id="cls-board"><b>🏆 Bảng điểm lớp</b><table class="sum">' + rows.map(function (r, i) { return "<tr><td>" + (i + 1) + "</td><td>" + avatarHtml(r.avatar) + " " + esc(r.name) + '</td><td class="n"><b>' + r.total + "</b> điểm · " + r.n + " câu</td></tr>"; }).join("") + "</table></div>";
  }
  function updBoard() { var el = $("#cls-board"); if (el) el.outerHTML = boardHtml(); }
  function classReport(res) {
    if (!S.class || !CTX.me || res.score == null) return;
    var me = CTX.me, b = S.class.board, e = b[me.id] || (b[me.id] = { name: me.name || "Bạn", avatar: me.avatar || "", total: 0, n: 0 });
    e.total += res.score; e.n++;
    var fb = res.fb || {}, rec = { pid: me.id, name: me.name || "", avatar: me.avatar || "", q: res.q, score: res.score, max: res.max, ans: String(res.ans || "").slice(0, 500), s: (fb.strengths || []).slice(0, 2), f: (fb.fixes || []).slice(0, 3) };
    ((S.class.rq = S.class.rq || {})[res.q] = S.class.rq[res.q] || {})[me.id] = rec;
    toParent({ type: "sw-class-send", p: Object.assign({ t: "res", run: S.class.run, total: e.total, n: e.n }, rec) });
  }
  function applyStart(d) {
    if (!SETS[d.kind].length) { PENDING = d; return; }
    if (!SETS[d.kind].some(function (x) { return x.id === d.set; })) { toast("Máy bạn chưa có đề này"); return; }
    clearTimer(); stopSpeech(); S.kind = d.kind; S.setId = d.set; liveInit(d); toast("👥 Lớp bắt đầu!");
  }
  /* ---------- LỚP TRỰC TIẾP: host điều khiển, cả phòng thấy đề + đồng hồ ngược, không chấm điểm, không âm thanh ---------- */
  function liveInit(d) {
    var g = GROUPS[d.kind].filter(function (x) { return x.k === d.group; })[0] || GROUPS[d.kind][0], set = curSet();
    clearTimer(); stopSpeech();
    S.kind = d.kind; S.group = g.k; S.gt = g.t; S.tasks = set.tasks.filter(function (t) { return g.qs.indexOf(t.q) >= 0 && (d.kind === "writing" || t.type !== "describe" || t.scene || t.image); });
    S.i = 0; S.screen = "live"; S.class = { run: d.run, board: {}, rq: {} }; S.saved = 1; S.results = {}; LIVE = { run: d.run, phase: "show", sp: null, done: {}, tEnd: 0, tot: 0 };
    toParent({ type: "sw-hello", kind: S.kind }); liveRender();
    if (!liveTimer) liveTimer = setInterval(liveTick, 200);
  }
  function liveSend(st) { st.t = "live"; st.run = LIVE.run; st.kind = S.kind; st.set = S.setId; st.group = S.group; toParent({ type: "sw-class-send", p: st }); liveApply(st); }
  function liveApply(st) {
    if (!st || st.run === S.leftRun) return;
    if (!LIVE || st.run !== LIVE.run) {   /* vào phòng sau: dựng màn hình theo trạng thái host đang phát */
      if (!st.kind || !st.set || !SETS[st.kind].some(function (x) { return x.id === st.set; })) return;
      S.setId = st.set; liveInit({ kind: st.kind, group: st.group, run: st.run });
    }
    var sig = [st.i, st.phase, st.sp && st.sp.id, Object.keys(st.done || {}).length].join("|");
    if (LIVE.sig === sig && st.hb) { LIVE.tot = (st.sec || 0) * SCALE; LIVE.tEnd = st.sec ? Date.now() + LIVE.tot * 1000 : 0; return; }
    LIVE.sig = sig;
    var wasR = LIVE.mineOn, nowR = meActive(st) && st.phase === "resp", oldI = S.i;
    if (wasR && !nowR) finishMine();
    LIVE.phase = st.phase; LIVE.sp = st.sp || null; LIVE.done = st.done || {}; S.i = st.i || 0; LIVE.adv = 0;
    LIVE.tot = (st.sec || 0) * SCALE; LIVE.tEnd = st.sec ? Date.now() + LIVE.tot * 1000 : 0;
    if ((st.i || 0) !== oldI) LIVE.my = null;
    liveRender();
    if (!wasR && nowR) startMine();
  }
  function meActive(st) {   /* tới lượt máy này: host chọn mình, hoặc "cả lớp" (sp rỗng) */
    if (!st || (st.phase !== "prep" && st.phase !== "resp")) return false;
    return !st.sp || !!(CTX.me && st.sp.id === CTX.me.id);
  }
  function startMine() {
    var L = LIVE, t = curTask(); L.mineOn = true; L.my = null; S.tr = ""; S.interim = ""; S.text = "";
    if (S.kind === "speaking") startSpeech(t);
  }
  function finishMine() {
    var L = LIVE, t = curTask(); L.mineOn = false; stopSpeech();
    if (S.kind === "writing") { var a = $("#ans"); if (a) S.text = a.value; } else { var m = $("#manual"); if (m && m.value) S.tr = m.value; }
    L.my = "grading"; L.myQ = t.q; grade();
  }
  function liveTimes() { var t = curTask(); return TIME[S.kind][t.q] || [0, 60]; }
  function liveNext() {   /* host: hết giờ (hoặc bấm Dừng) pha hiện tại */
    var L = LIVE, tm = liveTimes(), st = { i: S.i, sp: L.sp, done: L.done };
    if (L.phase === "prep") { st.phase = "resp"; st.sec = tm[1]; }
    else { st.done = Object.assign({}, L.done); if (L.sp) st.done[L.sp.id] = 1; else if (S.kind === "speaking") (CTX.players || []).forEach(function (p) { st.done[p.id] = 1; }); st.phase = "idle"; st.sec = 0; st.sp = null; }
    liveSend(st);
  }
  function liveTick() {
    var L = LIVE, el = $("#tm"); if (!L || S.screen !== "live") return;
    if (CTX.isHost && Date.now() - (L.hbAt || 0) > 4000) {
      L.hbAt = Date.now();
      toParent({ type: "sw-class-send", p: { t: "live", hb: 1, run: L.run, kind: S.kind, set: S.setId, group: S.group, i: S.i, phase: L.phase, sp: L.sp, done: L.done, sec: L.tEnd ? Math.max(0, (L.tEnd - Date.now()) / 1000 / SCALE) : 0 } });
    }
    if (!el || !L.tEnd) return;
    var left = Math.max(0, (L.tEnd - Date.now()) / 1000), sh = MOCK ? left / SCALE : left, cd = $("#cd");
    el.textContent = mmss(sh); var pg = $("#pg"); if (pg) pg.style.width = Math.min(100, 100 * (1 - left / Math.max(.001, L.tot))) + "%";
    if (cd) { var n = Math.ceil(sh - .001); if (sh > 0 && n <= 5 && n >= 1) { if (cd.textContent !== String(n)) { cd.textContent = n; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); } cd.hidden = false; } else cd.hidden = true; }
    if (left <= 0 && CTX.isHost && !L.adv) { L.adv = 1; liveNext(); }
  }
  function liveRender() {
    var L = LIVE; if (!L) return; var host = CTX.isHost, spk = S.kind === "speaking", me = CTX.me || {};
    if (L.phase === "end") { app.innerHTML = '<div class="top"><button class="soft" data-act="quit" title="Thoát">✕</button><div class="t"><b>Hết bài</b></div></div><div class="card" style="text-align:center"><h2>🎉 Cả lớp đã xong</h2></div><div class="bottom"><div class="in"><button class="pri big" data-act="home">Về chọn đề</button></div></div>'; return; }
    var t = curTask(), tm = liveTimes(), run = L.phase === "prep" || L.phase === "resp", last = S.i >= S.tasks.length - 1, act = meActive(L), mybox = "";
    if (act && L.phase === "resp") mybox = spk ? '<div class="live" id="live"><i>🎤 Mic của bạn đang bật — hãy nói…</i></div>' + (SR || MOCK ? "" : '<textarea id="manual" placeholder="Trình duyệt không nhận giọng: gõ lại điều bạn nói"></textarea>') : '<textarea id="ans" placeholder="Gõ bài viết của bạn…"></textarea>';
    else if (act) mybox = '<p class="sub">' + (spk ? "Đến lượt bạn — hết giờ chuẩn bị máy tự bật mic." : "Chuẩn bị viết…") + "</p>";
    var h = '<div class="top"><button class="soft" data-act="quit" title="Thoát">✕</button><div class="t"><b>Câu ' + t.q + "</b> · " + esc(t.type.replace("_", " ")) + ' <span class="sub">(' + (S.i + 1) + "/" + S.tasks.length + ")</span></div></div>";
    h += '<div class="card">' + promptHtml(t) + "</div>";
    h += '<div class="card" style="text-align:center">';
    if (run) {
      var who = L.sp ? avatarHtml(L.sp.avatar) + " <b>" + esc(L.sp.name) + "</b>" : "Cả lớp", mine = L.sp && me.id && L.sp.id === me.id;
      h += '<div class="row" style="justify-content:center"><span class="badge ' + (L.phase === "resp" ? "resp" : "prep") + '">' + (L.phase === "prep" ? "Chuẩn bị" : spk ? "Đang nói" : "Đang viết") + "</span> " + who + "</div>" + (mine ? "<p><b>🎤 Đến lượt bạn!</b></p>" : "") + '<div class="timer ' + (L.phase === "resp" ? "resp" : "prep") + '" id="tm">0:00</div><div class="bar ' + (L.phase === "resp" ? "resp" : "") + '"><i id="pg"></i></div>' + mybox;
    } else {
      var nd = Object.keys(L.done).length;
      h += (spk ? rosterHtml(host) : "") + (spk ? '<p class="sub">' + (nd ? "Đã nói: <b>" + nd + "</b> người. " : "") + "Chuẩn bị <b>" + tm[0] + "s</b> · trả lời <b>" + tm[1] + "s</b></p>" : '<p class="sub">Thời gian viết: <b>' + mmss(tm[1]) + "</b></p>");
      if (!host) h += "<p><i>Đợi host bấm…</i></p>";
    }
    h += "</div>";
    if (!run && L.my && L.myQ === t.q) h += L.my === "grading" ? '<div class="card" style="text-align:center"><span class="spin"></span> AI đang chấm bài của bạn…</div>' : (S.results[t.q] ? result("", t, true) : "");
    if (!run) h += othersHtml(t.q) + boardHtml();
    if (run && spk) h += rosterHtml(false);
    if (host) {
      var ps = (CTX.players || []).filter(function (p) { return !L.done[p.id]; }), b = "", nx = '<button class="big" data-act="lnext">' + (last ? "Kết thúc" : "Câu tiếp ›") + "</button>";
      if (run) b = (L.phase === "prep" ? '<button class="big" data-act="lskip">⏭ Vào phần nói</button>' : "") + '<button class="big" data-act="lstop">⏹ Dừng</button>';
      else if (spk && ps.length) b = '<button class="pri big" data-act="lstart">▶ Bắt đầu' + (pickOf(ps) ? " · " + esc(pickOf(ps).name || "") : "") + '</button><button class="big" data-act="lall" title="Cả lớp nói cùng lúc, mỗi máy tự chấm">👥 Cả lớp</button>' + nx;
      else if (spk) b = nx.replace('class="big"', 'class="pri big"');
      else b = (L.phase === "idle" ? "" : '<button class="pri big" data-act="lstart">▶ Bắt đầu viết</button>') + (L.phase === "idle" ? nx.replace('class="big"', 'class="pri big"') : nx);
      h += '<div class="bottom"><div class="in">' + b + "</div></div>";
    }
    h += '<div class="cd" id="cd" hidden></div>'; app.innerHTML = h; liveTick();
  }
  /* ---------- LỊCH SỬ: xem lại bài cũ + lỗi sai (lưu ở máy này) ---------- */
  function promptShort(t) {
    var x = t.text || t.question || t.message || t.scene || (t.email && (t.email.subject + " — " + t.email.body)) || "";
    if (t.words) x += " [" + t.words.join(" + ") + "]";
    return String(x).slice(0, 400);
  }
  function saveRev(t, res) {
    var fb = res.fb || {}; ST.rev = ST.rev || [];
    ST.rev.push({ ts: Date.now(), kind: S.kind, set: S.setId, q: res.q, type: t.type, pm: promptShort(t), ans: String(res.ans || "").slice(0, 900), score: res.score, max: res.max, s: (fb.strengths || []).slice(0, 3), f: (fb.fixes || []).slice(0, 5), better: String(fb.better || "").slice(0, 900), live: LIVE ? 1 : 0 });
    if (ST.rev.length > 200) ST.rev.splice(0, ST.rev.length - 200);
    save();
  }
  function revView() {
    var all = (ST.rev || []).filter(function (r) { return r.kind === S.kind; }).slice().reverse(), list = S.revAll ? all : all.filter(function (r) { return r.score < r.max; });
    var li = function (a, c) { return a && a.length ? '<ul class="fb ' + c + '">' + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : ""; };
    var h = '<div class="top"><button class="soft" data-act="home" title="Về">✕</button><div class="t"><b>📒 Bài cũ · ' + (S.kind === "speaking" ? "Speaking" : "Writing") + '</b></div></div>' +
      '<div class="row" style="gap:8px;margin:6px 0"><button class="' + (S.revAll ? "" : "pri") + '" data-act="revf">' + (S.revAll ? "Đang xem: tất cả (" + all.length + ")" : "Đang xem: câu chưa đạt tối đa (" + list.length + ")") + '</button></div>';
    if (!list.length) h += '<div class="card"><p class="sub">' + (all.length ? "Không có câu nào cần xem lại 🎉" : "Chưa có bài nào. Chấm xong câu nào thì câu đó tự lưu ở đây.") + "</p></div>";
    list.forEach(function (r) {
      h += '<details class="card"><summary><span class="sub">' + new Date(r.ts).toLocaleDateString() + " " + new Date(r.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + (r.live ? " · 👥 lớp" : "") + "</span> · <b>Câu " + r.q + "</b> · " + esc(String(r.type).replace("_", " ")) + ' <b style="float:right">' + r.score + "/" + r.max + "</b></summary>" +
        '<p class="sub">Đề:</p><div class="prompt">' + esc(r.pm) + '</div><p class="sub">Bài bạn:</p><div class="live">' + esc(r.ans || "(trống)") + "</div>" + li(r.s, "ok") + (r.f && r.f.length ? "<p><b>Cần sửa</b></p>" : "") + li(r.f, "") + (r.better ? '<details><summary>✨ Bản gợi ý cải thiện</summary><div class="model">' + esc(r.better) + "</div></details>" : "") + "</details>";
    });
    if (all.length) h += '<p style="text-align:center"><button class="soft" data-act="revclr">🗑 Xoá lịch sử</button></p>';
    app.innerHTML = h;
  }
  function othersHtml(q) {   /* kết quả của các bạn khác ở câu này: hiện công khai cho cả phòng */
    var m = (S.class && S.class.rq && S.class.rq[q]) || {}, me = (CTX.me || {}).id;
    var rows = Object.keys(m).filter(function (k) { return k !== me; }).map(function (k) {
      var r = m[k], ul = function (a, c) { return a && a.length ? '<ul class="fb ' + c + '">' + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : ""; };
      return '<details open class="oth"><summary>' + avatarHtml(r.avatar) + " <b>" + esc(r.name) + "</b> · " + r.score + "/" + r.max + "</summary>" + (r.ans ? '<div class="live">' + esc(r.ans) + "</div>" : "") + ul(r.s, "ok") + ul(r.f, "") + "</details>";
    });
    return rows.length ? '<div class="card"><b>👥 Kết quả của cả lớp</b>' + rows.join("") + "</div>" : "";
  }
  function pickOf(ps) { var L = LIVE; return ps.filter(function (p) { return p.id === L.pick; })[0] || ps[0]; }
  function rosterHtml(host) {
    var L = LIVE, ps = CTX.players || [], rest = ps.filter(function (p) { return !L.done[p.id]; }), cur = L.sp ? L.sp.id : (host ? (pickOf(rest) || {}).id : "");
    if (!ps.length) return "";
    return '<div class="card roster"><div class="sub">' + (host ? "Chạm tên để chọn người nói tiếp" : "Thứ tự trong phòng") + '</div>' + ps.map(function (p) {
      var dn = L.done[p.id], on = p.id === cur; return '<button class="chip' + (dn ? " done" : "") + (on ? " on" : "") + '"' + (host && !dn && !L.sp ? ' data-act="lpick" data-v="' + esc(p.id) + '"' : " disabled") + ">" + (dn ? "✓ " : "") + avatarHtml(p.avatar) + " " + esc(p.name || "?") + "</button>";
    }).join("") + "</div>";
  }
  function liveAct(a, v) {
    if (a === "lsolo" && LIVE) {   /* rời lớp, tự luyện đúng câu này (AI chấm như bình thường) */
      var t = curTask(); S.leftRun = LIVE.run; LIVE = null; clearTimer(); S.class = null; S.saved = 1; S.tasks = [t]; S.i = 0; S.results = {}; S.group = "one"; S.gt = "Câu " + t.q; S.screen = "task"; question(); return true;
    }
    if (a === "lregrade" && LIVE) { LIVE.my = "grading"; liveRender(); grade(); return true; }
    if (!LIVE || S.screen !== "live" || !CTX.isHost) return false;
    var tm = liveTimes(), L = LIVE;
    if (a === "lstart") {
      var sp = null;
      if (S.kind === "speaking") { sp = pickOf((CTX.players || []).filter(function (p) { return !L.done[p.id]; })); if (!sp) return true; sp = { id: sp.id, name: sp.name, avatar: sp.avatar }; }
      liveSend({ i: S.i, phase: S.kind === "speaking" ? "prep" : "resp", sp: sp, sec: S.kind === "speaking" ? tm[0] : tm[1], done: L.done });
    } else if (a === "lpick") { L.pick = v; liveRender(); }
    else if (a === "lall") liveSend({ i: S.i, phase: "prep", sp: null, sec: tm[0], done: L.done });
    else if (a === "lskip") liveSend({ i: S.i, phase: "resp", sp: L.sp, sec: tm[1], done: L.done });
    else if (a === "lstop") { L.adv = 1; liveNext(); }
    else if (a === "lnext") {
      if (S.i >= S.tasks.length - 1) liveSend({ i: S.i, phase: "end", done: {} });
      else { liveSend({ i: S.i + 1, phase: "show", sp: null, done: {}, sec: 0 }); toParent({ type: "sw-hello", kind: S.kind }); }
    } else return false;
    return true;
  }
  function importFile() {
    var f = this.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { var d = JSON.parse(r.result); if (!d.speaking && !d.writing) throw 0; localStorage.setItem(EXTRA, JSON.stringify(d)); toast("Đã nạp đề — tải lại trang để thấy"); setTimeout(function () { location.reload(); }, 900); } catch (e) { toast("File không đúng định dạng"); } };
    r.readAsText(f);
  }
  function dots() { return '<span class="dots">' + S.tasks.map(function (t, i) { return "<i class=\"" + (i < S.i || (S.results[t.q] && i !== S.i) ? "d" : i === S.i ? "c" : "") + '"></i>'; }).join("") + "</span>"; }
  function task() {
    var t = curTask(), set = curSet(), tm = TIME[S.kind][t.q] || [0, 60], lab = { read_aloud: "Đọc to", describe: "Tả ảnh", respond: "Trả lời câu hỏi", info: "Dựa vào thông tin", solution: "Đề xuất giải pháp", opinion: "Nêu ý kiến", sentence: "Viết câu theo ảnh", email: "Trả lời email", essay: "Bài luận ý kiến" }[t.type] || "";
    var h = '<div class="top"><button class="soft" data-act="quit" title="Thoát">✕</button><div class="t"><b>Câu ' + t.q + "</b> · " + esc(lab) + '</div>' + dots() + "</div>";
    if (S.phase === "grading") { h += '<div class="card" style="text-align:center"><p><span class="spin"></span> AI đang chấm…</p><p class="sub">Thường mất 5–15 giây.</p></div>'; app.innerHTML = h; return; }
    if (S.phase === "result") return result(h, t);
    h += '<div class="card">' + promptHtml(t) + "</div>";
    if (S.phase === "intro") {
      h += '<div class="card"><p class="sub">' + intro(t, tm) + '</p><button class="pri big" data-act="go" style="width:100%;margin-top:6px">' + (S.kind === "speaking" ? "▶ Bắt đầu" : "▶ Bắt đầu viết") + "</button></div>";
    } else {
      var ph = S.phase, badge = ph === "read" ? "Đọc thông tin" : ph === "prep" ? "Chuẩn bị" : "Đang " + (S.kind === "speaking" ? "nói" : "viết");
      h += '<div class="card"><div class="row"><span class="badge ' + (ph === "resp" ? "resp" : "prep") + '">' + badge + '</span></div><div class="timer ' + (ph === "resp" ? "resp" : "prep") + '" id="tm">0:00</div><div class="bar ' + (ph === "resp" ? "resp" : "") + '"><i id="pg"></i></div>';
      if (ph === "resp" && S.kind === "speaking") h += '<div class="live" id="live"><i>🎤 Hãy nói… lời bạn nói sẽ hiện ở đây</i></div>' + (SR || MOCK ? "" : '<textarea id="manual" placeholder="Trình duyệt không nhận giọng: gõ lại điều bạn đã nói…"></textarea>');
      if (ph === "resp" && S.kind === "writing") h += '<textarea id="ans" placeholder="Gõ bài viết của bạn ở đây…" autofocus>' + esc(S.text || "") + '</textarea><p class="sub" id="wc">0 từ</p>';
      h += "</div>";
      h += '<div class="bottom"><div class="in">' + (ph === "resp" ? '<button class="' + (S.kind === "speaking" ? "rec" : "pri") + ' big" data-act="stop">' + (S.kind === "speaking" ? "⏹ Xong, nộp bài" : "✔ Nộp bài") + "</button>" : '<button class="big" data-act="skipprep">Bắt đầu nói ngay ▶</button>') + "</div></div>";
    }
    app.innerHTML = h; updTimer();
    if (S.phase === "resp" && S.kind === "writing") { var a = $("#ans"); a.oninput = function () { S.text = a.value; $("#wc").textContent = nWords(a.value) + " từ" + (S.tasks[S.i].q === 8 ? " (mục tiêu ≥ 300)" : ""); }; a.dispatchEvent(new Event("input")); try { a.focus(); } catch (e) {} }
    if (S.phase === "resp" && S.kind === "speaking") { liveUpd(); var m = $("#manual"); if (m) m.oninput = function () { S.tr = m.value; }; }
  }
  function promptHtml(t) {
    var h = "";
    if (t.type === "read_aloud") h += '<div class="prompt read">' + esc(t.text) + "</div>";
    else if (t.type === "describe") h += (t.image ? '<img src="' + esc(t.image) + '" alt="" style="max-width:100%;border-radius:10px">' : "") + (t.scene ? '<p class="sub">📷 Chưa có ảnh thật — đọc mô tả cảnh rồi tả lại bằng lời của bạn:</p><p class="prompt">' + esc(t.scene) + "</p>" : "");
    else if (t.type === "respond") h += (t.scenario ? '<p class="sub">' + esc(t.scenario) + "</p>" : "") + '<div class="prompt">❓ ' + esc(t.question) + "</div>";
    else if (t.type === "info") { var inf = (S.tasks.filter(function (x) { return x.info; })[0] || {}).info; if (inf) h += '<p><b>' + esc(inf.title || "") + '</b></p><table class="tbl">' + inf.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return (i === 0 ? "<th>" : "<td>") + esc(c) + (i === 0 ? "</th>" : "</td>"); }).join("") + "</tr>"; }).join("") + "</table>"; if (S.phase !== "read") h += '<div class="prompt">❓ ' + esc(t.question) + "</div>"; }
    else if (t.type === "solution") h += '<p class="sub">Nghe tin nhắn rồi đề xuất giải pháp:</p><div class="prompt">🔊 ' + esc(t.message) + '</div><button class="soft" data-act="say" data-v="' + esc(t.message) + '">🔊 Nghe lại</button>';
    else if (t.type === "opinion") h += '<div class="prompt">❓ ' + esc(t.question) + "</div>";
    else if (t.type === "sentence") h += '<p class="prompt">📷 <i>(Ảnh)</i> ' + esc(t.scene || "") + '</p><p>Dùng cả 2 từ/cụm: <b>' + t.words.map(esc).join(" + ") + "</b></p>";
    else if (t.type === "email") { var e = t.email || {}; h += '<div class="mail"><div class="h">From: ' + esc(e.from) + "<br>To: " + esc(e.to) + "<br>Subject: " + esc(e.subject) + '</div><p class="prompt">' + esc(e.body) + '</p></div><p class="sub">' + esc(t.directions || "") + "</p>"; }
    else if (t.type === "essay") h += '<div class="prompt">' + esc(t.question) + '</div><p class="sub">Viết bài luận nêu ý kiến, nêu lý do và ví dụ (≥ 300 từ).</p>';
    return h;
  }
  function intro(t, tm) {
    if (S.kind === "writing") return "Thời gian: <b>" + mmss(tm[1]) + "</b>. Hết giờ bài sẽ tự nộp.";
    var s = "Chuẩn bị <b>" + tm[0] + " giây</b>, rồi trả lời <b>" + tm[1] + " giây</b>. Bấm Bắt đầu để tính giờ.";
    if (t.type === "info" && t.info) s = "Đọc bảng thông tin <b>45 giây</b> trước, rồi lần lượt trả lời 3 câu (15s, 15s, 30s). " + s;
    return s;
  }

  /* ---------- đồng hồ ---------- */
  function startTimer(sec, onEnd) { clearTimer(); S.tTotal = sec * SCALE; S.tEnd = Date.now() + S.tTotal * 1000; S.onEnd = onEnd; timerId = setInterval(function () { updTimer(); if (Date.now() >= S.tEnd) { var f = S.onEnd; clearTimer(); if (f) f(); } }, 200); updTimer(); }
  function clearTimer() { if (timerId) clearInterval(timerId); timerId = 0; }
  function updTimer() { var el = $("#tm"); if (!el || !S.tEnd) return; var left = Math.max(0, (S.tEnd - Date.now()) / 1000); el.textContent = mmss(MOCK ? left / SCALE : left); var pg = $("#pg"); if (pg) pg.style.width = Math.min(100, 100 * (1 - left / Math.max(.001, S.tTotal))) + "%"; }
  function beep(f) { try { var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = f || 880; o.connect(g); g.connect(c.destination); g.gain.value = .15; o.start(); setTimeout(function () { o.stop(); c.close(); }, 220); } catch (e) {} }
  function say(text) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = .95; speechSynthesis.speak(u); } catch (e) {} }

  /* ---------- luồng 1 câu ---------- */
  function begin(kind, group) {
    var set = curSet(), g = GROUPS[kind].filter(function (x) { return x.k === group; })[0];
    S.kind = kind; S.group = group; S.gt = g.t; S.tasks = set.tasks.filter(function (t) { return g.qs.indexOf(t.q) >= 0 && (kind === "writing" || t.type !== "describe" || t.scene || t.image); });
    S.i = 0; S.results = {}; S.screen = "task"; question();
  }
  function question() { var t = curTask(); S.phase = "intro"; S.tr = ""; S.interim = ""; S.text = ""; render(); }
  function go() {
    var t = curTask(); stopSpeech();
    if (S.kind === "writing") return startResp();
    if (t.type === "info" && t.info && S.tasks.indexOf(t) === S.tasks.indexOf(S.tasks.filter(function (x) { return x.info; })[0])) { S.phase = "read"; render(); return startTimer(45, startPrep); }
    startPrep();
  }
  function startPrep() { var t = curTask(), tm = TIME[S.kind][t.q]; S.phase = "prep"; render(); if (!MOCK) { if (t.type === "respond" || t.type === "info" || t.type === "opinion") say(t.question); else if (t.type === "solution") say(t.message); } startTimer(tm[0], startResp); }
  function startResp() {
    var t = curTask(), tm = TIME[S.kind][t.q]; try { speechSynthesis.cancel(); } catch (e) {}
    if (S.kind === "speaking") beep(880); S.phase = "resp"; render();
    if (S.kind === "speaking") startSpeech(t);
    startTimer(tm[1], function () { finish(true); });
  }
  function finish() { clearTimer(); stopSpeech(); if (S.kind === "writing") { var a = $("#ans"); if (a) S.text = a.value; } else { var m = $("#manual"); if (m && m.value) S.tr = m.value; } if (S.kind === "speaking") beep(520); S.phase = "grading"; render(); grade(); }

  /* ---------- nhận giọng ---------- */
  function liveUpd() { var el = $("#live"); if (!el) return; var tx = (S.tr || "") + (S.interim ? ' <i>' + esc(S.interim) + "</i>" : ""); el.innerHTML = tx.trim() ? esc(S.tr || "") + (S.interim ? " <i>" + esc(S.interim) + "</i>" : "") : '<i>🎤 Hãy nói… lời bạn nói sẽ hiện ở đây</i>'; }
  function startSpeech(t) {
    S.tr = ""; S.interim = "";
    if (MOCK) { setTimeout(function () { S.tr = mockSpeech(t); liveUpd(); }, 400); return; }
    if (!SR) return;
    recOn = true; rec = new SR(); rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = function (e) { var interim = ""; for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) S.tr = (S.tr + " " + r[0].transcript).trim(); else interim += r[0].transcript; } S.interim = interim; liveUpd(); };
    rec.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) { recOn = false; toast("Chưa cho dùng micro — bấm ổ khoá cạnh thanh địa chỉ để cho phép"); } };
    rec.onend = function () { if (recOn) { try { rec.start(); } catch (e) {} } };
    try { rec.start(); } catch (e) { toast("Không mở được nhận giọng"); }
  }
  function stopSpeech() { recOn = false; try { if (rec) rec.stop(); } catch (e) {} rec = null; S.interim = ""; }
  function mockSpeech(t) {
    var src = t.type === "read_aloud" ? t.text : ((curSet().models || {})[t.q] || "This is a sample answer for the question.");
    var w = src.split(/\s+/); if (t.type === "read_aloud") w.splice(Math.floor(w.length / 2), 1);   /* bỏ 1 chữ giữa bài để thử tô màu */
    return w.join(" ");
  }

  /* ---------- chấm điểm ---------- */
  function normW(w) { return String(w || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]/g, ""); }
  function lev(a, b) { var m = a.length, n = b.length, d = [], i, j; if (!m) return n; if (!n) return m; for (j = 0; j <= n; j++) d[j] = j; for (i = 1; i <= m; i++) { var p = d[0]; d[0] = i; for (j = 1; j <= n; j++) { var t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[n]; }
  function same(a, b) { a = normW(a); b = normW(b); if (!a || !b) return false; if (a === b) return true; if (a.length <= 3 || b.length <= 3) return false; return lev(a, b) <= (a.length >= 8 ? 2 : 1); }
  function gradeRead(text, tr) {
    var T = text.split(/\s+/).filter(normW), Sx = String(tr || "").split(/\s+/).filter(normW), st = T.map(function () { return ""; }), p = 0, i = 0, j;
    while (i < Sx.length && p < T.length) {
      if (same(T[p], Sx[i])) { st[p] = "ok"; p++; i++; continue; }
      var f = -1; for (j = p + 1; j <= Math.min(p + 3, T.length - 1); j++) if (same(T[j], Sx[i])) { f = j; break; }
      if (f >= 0) { for (j = p; j < f; j++) st[j] = "miss"; st[f] = "ok"; p = f + 1; i++; continue; }
      if (i + 1 < Sx.length && same(T[p], Sx[i + 1])) { i++; continue; }
      st[p] = "bad"; p++; i++;
    }
    for (j = p; j < T.length; j++) st[j] = st[j] || "miss";
    var ok = st.filter(function (x) { return x === "ok"; }).length, pct = T.length ? ok / T.length : 0;
    return { score: pct >= .9 ? 3 : pct >= .72 ? 2 : pct >= .45 ? 1 : 0, pct: pct, words: T, st: st };
  }
  var SP_RUBRIC = {
    describe: "Tả ảnh (0-3): đúng nội dung ảnh/đủ chi tiết, ngữ pháp, từ vựng, mạch lạc/trôi chảy.",
    respond: "Trả lời câu hỏi (0-3): đúng trọng tâm, đủ ý, ngữ pháp, từ vựng, mạch lạc.",
    info: "Trả lời dựa vào bảng thông tin (0-3): thông tin ĐÚNG so với bảng, đủ ý, ngữ pháp, mạch lạc.",
    solution: "Đề xuất giải pháp (0-5): nêu lại vấn đề + xin lỗi/đồng cảm, đề xuất giải pháp cụ thể, thông tin hợp lý, tổ chức ý, ngữ pháp, từ vựng.",
    opinion: "Nêu ý kiến (0-5): nêu rõ quan điểm, lý do + ví dụ, tổ chức ý, từ nối, ngữ pháp, từ vựng."
  };
  async function ai(sys, user) {
    var url = String(CFG.SUPABASE_URL || "").replace(/\/$/, "") + "/functions/v1/gemini-proxy", last = null, models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"];
    for (var k = 0; k < models.length; k++) {
      for (var a = 0; a < 2; a++) {
        try {
          var r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY, apikey: CFG.SUPABASE_ANON_KEY }, body: JSON.stringify({ model: models[k], sys: sys, user: user, user_id: null, block_id: null }) });
          if (r.status === 429 || r.status === 503) { last = new Error("busy " + r.status); await new Promise(function (z) { setTimeout(z, 1500 * (a + 1)); }); continue; }
          var d = await r.json(), tx = d.candidates && d.candidates[0].content.parts[0].text, m = tx && tx.match(/\{[\s\S]*\}/);
          if (m) return JSON.parse(m[0]);
          last = new Error("empty");
        } catch (e) { last = e; }
      }
    }
    throw last || new Error("AI lỗi");
  }
  async function grade() {
    var t = curTask(), q = t.q, max = MAXS[S.kind][q], res = { q: q, max: max }, ans = S.kind === "writing" ? (S.text || "") : (S.tr || "");
    try {
      if (S.kind === "speaking" && t.type === "read_aloud") {
        var g = gradeRead(t.text, ans); res.score = g.score; res.read = g; res.fb = { strengths: [], fixes: ["Điểm đọc to ở đây ước tính theo độ khớp chữ nhận được (" + Math.round(g.pct * 100) + "%). Phát âm/ngữ điệu thật chưa chấm được."] };
        if (g.pct < .9) res.fb.fixes.push("Đọc chậm, rõ từng chữ; nhấn từ nội dung; ngắt nghỉ ở dấu câu. Bấm vào chữ đỏ/vàng để luyện lại.");
        else res.fb.strengths.push("Đọc khớp bài rất tốt.");
      } else if (nWords(ans) < (S.kind === "speaking" ? 3 : 2)) {
        res.score = 0; res.fb = { strengths: [], fixes: [S.kind === "speaking" ? "Không nghe được lời nói (hoặc quá ngắn). Kiểm tra micro/quyền truy cập, nói to và rõ hơn." : "Bài viết trống hoặc quá ngắn."] };
      } else {
        var out = await ai(sysPrompt(), userPrompt(t, ans)); res.score = Math.max(0, Math.min(max, Math.round(+out.score || 0))); res.fb = out; res.words = nWords(ans);
      }
    } catch (e) { res.err = String(e.message || e); res.score = null; }
    res.ans = ans; S.results[q] = res; if (res.score != null) saveRev(t, res); classReport(res); if (LIVE && LIVE.myQ === q) LIVE.my = "result"; S.phase = "result"; render();
  }
  function sysPrompt() {
    return S.kind === "speaking" ? "You are a strict but fair TOEIC Speaking rater. The learner's speech was transcribed automatically (punctuation may be missing, small recognition errors are possible: do NOT penalise recognition glitches). You can only judge content, organisation, grammar, vocabulary and fluency signals from the text; do not claim to judge pronunciation. Typical learner answers deserve 1-2 on a 0-3 scale. Reply JSON only."
      : "You are a strict but fair TOEIC Writing rater. Typical learner answers deserve 1-2 on a 0-3 scale (0-4 for emails, 0-5 for the essay). Reply JSON only.";
  }
  function userPrompt(t, ans) {
    var max = MAXS[S.kind][t.q], base = 'Return JSON: {"score":<integer 0-' + max + '>,"strengths":["<1-2 short Vietnamese points>"],"fixes":["<up to 3 Vietnamese points, each with a short English example of the correction>"],"better":"<an improved English version of the learner answer, similar length>"}.\n';
    if (S.kind === "speaking") {
      var d = t.type === "describe" ? "Photo description (the learner sees a photo described as): " + t.scene : t.type === "solution" ? "Voicemail the learner heard: " + t.message : t.type === "info" ? "Info table: " + JSON.stringify((S.tasks.filter(function (x) { return x.info; })[0] || {}).info) + "\nQuestion: " + t.question : "Question: " + t.question + (t.scenario ? "\nContext: " + t.scenario : "");
      return base + "Task rubric: " + SP_RUBRIC[t.type] + "\n" + d + "\nLearner transcript (" + nWords(ans) + " words): " + ans;
    }
    var q = t.type === "sentence" ? "Write ONE sentence using BOTH words: " + t.words.join(" + ") + ". Photo: " + t.scene + ". Judge grammar + relevance to the photo + both words used correctly (0-3)." : t.type === "email" ? "Respond to this e-mail. Requirement: " + t.directions + "\nE-mail:\n" + JSON.stringify(t.email) + "\nJudge: requirements met, clarity, organisation, grammar, vocabulary (0-4)." : "Opinion essay (0-5): " + t.question + "\nJudge: clear opinion, reasons + examples, organisation, grammar/vocabulary. Expected 300+ words.";
    return base + q + "\nLearner answer (" + nWords(ans) + " words):\n" + ans;
  }

  /* ---------- kết quả 1 câu + tổng ---------- */
  function result(h, t, embed) {
    var r = S.results[t.q], set = curSet(), last = S.i >= S.tasks.length - 1;
    if (embed && r.err) return h + '<div class="card"><p class="bad"><b>Chưa chấm được</b> (' + esc(r.err) + ')</p><p class="sub">Có thể AI đang bận.</p><button class="big" data-act="lregrade">Chấm lại</button></div>';
    if (r.err) h += '<div class="card"><p class="bad"><b>Chưa chấm được</b> (' + esc(r.err) + ')</p><p class="sub">Có thể AI đang bận. Bấm "Chấm lại".</p></div><div class="bottom"><div class="in"><button class="big" data-act="regrade">Chấm lại</button><button class="big" data-act="next">' + (last ? "Xong" : "Câu tiếp ▶") + "</button></div></div>";
    else {
      var cls = r.score === r.max ? "top" : "s" + r.score, fb = r.fb || {};
      h += '<div class="card"><div class="score"><div class="ring ' + cls + '">' + r.score + "<small>/" + r.max + '</small></div><div><b>' + (r.score >= r.max - 0 ? "Rất tốt!" : r.score >= Math.ceil(r.max / 2) ? "Khá ổn" : "Cần cải thiện") + '</b><div class="sub">Điểm ước tính cho câu này</div></div></div>';
      if (r.read) h += '<p class="prompt read" style="margin-top:8px">' + r.read.words.map(function (w, i) { return '<span class="w-' + (r.read.st[i] || "miss") + '">' + esc(w) + "</span>"; }).join(" ") + '</p><p class="sub"><span class="w-ok">xanh = đúng</span> · <span class="w-bad">đỏ = sai/chưa rõ</span> · <span class="w-miss">vàng = bỏ sót</span></p>';
      if ((fb.strengths || []).length) h += '<ul class="fb ok">' + fb.strengths.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      if ((fb.fixes || []).length) h += '<p><b>Cần sửa</b></p><ul class="fb">' + fb.fixes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      h += "</div>";
      if (r.ans && !r.read) h += '<details open><summary>' + (S.kind === "speaking" ? "Lời bạn nói (nhận được)" : "Bài của bạn") + ' · ' + nWords(r.ans) + ' từ</summary><div class="live">' + esc(r.ans) + "</div></details>";
      if (fb.better) h += '<details><summary>✨ Bản gợi ý cải thiện</summary><div class="model">' + esc(fb.better) + "</div></details>";
      var md = (set.models || {})[t.q]; if (md) h += '<details><summary>📘 Bài mẫu của đề</summary><div class="model">' + esc(md) + "</div></details>";
      if (embed) return h;
      h += '<div class="bottom"><div class="in"><button class="big" data-act="retry">↻ Làm lại câu</button><button class="pri big" data-act="next">' + (last ? "Xem kết quả" : "Câu tiếp ▶") + "</button></div></div>";
    }
    h = h.replace('<div class="bottom">', boardHtml() + '<div class="bottom">'); app.innerHTML = h;
  }
  function summary() {
    var raw = 0, max = 0, rows = "";
    S.tasks.forEach(function (t) { var r = S.results[t.q]; max += MAXS[S.kind][t.q]; if (r && r.score != null) raw += r.score; rows += "<tr><td>Câu " + t.q + "</td><td>" + esc(t.type.replace("_", " ")) + '</td><td class="n">' + (r && r.score != null ? r.score : "—") + "/" + MAXS[S.kind][t.q] + "</td></tr>"; });
    var est = Math.round(raw / max * 200 / 5) * 5, lo = Math.max(0, est - 15), hi = Math.min(200, est + 15);
    var h = '<h1>Kết quả</h1><div class="card"><div class="sub">' + esc(S.gt) + ' · ' + (S.kind === "speaking" ? "Speaking" : "Writing") + '</div><div class="est">' + (S.group === "all" ? lo + "–" + hi : raw + "/" + max) + '</div><div class="sub">' + (S.group === "all" ? "Điểm ước tính thang 0–200 (AI, chỉ để tham khảo)" : "Điểm thô của phần đã làm") + '</div><table class="sum">' + rows + '</table><p class="sub">Thang 0–200 quy đổi gần đúng từ điểm thô; điểm thật do ETS chấm có thể khác.</p></div>' +
      '<div class="bottom"><div class="in"><button class="big" data-act="home">Chọn đề khác</button><button class="pri big" data-act="again">↻ Làm lại</button></div></div>';
    h = h.replace('<div class="bottom">', boardHtml() + '<div class="bottom">'); app.innerHTML = h;
    if (!S.saved) { S.saved = 1; ST.hist.push({ kind: S.kind, set: S.setId, group: S.group, gt: S.gt, ts: Date.now(), raw: raw, max: max, est: est }); if (ST.hist.length > 80) ST.hist.shift(); save(); }
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return; var a = b.dataset.act, v = b.dataset.v;
    if (a === "kind") { S.kind = v; S.setId = (SETS[v][0] || {}).id || ""; render(); }
    else if (a === "set") { S.setId = v; render(); }
    else if (a === "start") { if (S.classMode && CTX.isHost) toParent({ type: "sw-host-start", kind: S.kind, set: S.setId, group: v }); else { S.class = null; S.saved = 0; begin(S.kind, v); } }
    else if (a === "rev") { S.screen = "rev"; render(); }
    else if (a === "revf") { S.revAll = !S.revAll; render(); }
    else if (a === "revclr") { if (confirm("Xoá toàn bộ lịch sử bài " + (S.kind === "speaking" ? "nói" : "viết") + " trên máy này?")) { ST.rev = (ST.rev || []).filter(function (r) { return r.kind !== S.kind; }); save(); render(); } }
    else if (liveAct(a, v)) return;
    else if (a === "go") go();
    else if (a === "skipprep") { clearTimer(); startResp(); }
    else if (a === "stop") finish();
    else if (a === "say") say(v);
    else if (a === "retry") { question(); }
    else if (a === "regrade") { S.phase = "grading"; render(); grade(); }
    else if (a === "next") { if (S.i >= S.tasks.length - 1) { S.screen = "sum"; render(); } else { S.i++; question(); } }
    else if (a === "quit") { if (LIVE) { S.leftRun = LIVE.run; LIVE = null; } clearTimer(); stopSpeech(); try { speechSynthesis.cancel(); } catch (x) {} S.screen = "home"; render(); }
    else if (a === "home") { S.screen = "home"; render(); }
    else if (a === "again") { S.saved = 0; begin(S.kind, S.group); }
    else if (a === "delextra") { try { localStorage.removeItem(EXTRA); } catch (x) {} toast("Đã xoá đề riêng"); setTimeout(function () { location.reload(); }, 700); }
  });
  window.addEventListener("message", function (e) {
    var d = e.data; if (e.origin !== location.origin || !d || typeof d.type !== "string" || d.type.indexOf("sw-") !== 0) return;
    if (d.type === "sw-ctx") { CTX = { inRoom: !!d.inRoom, isHost: !!d.isHost, me: d.me || null, players: d.players || [] }; if (S.classMode === undefined && CTX.isHost && CTX.players.length > 1) S.classMode = true; if (S.screen === "home" || (S.screen === "live" && LIVE && LIVE.phase !== "prep" && LIVE.phase !== "resp")) render(); }
    else if (d.type === "sw-class-start") applyStart(d);
    else if (d.type === "sw-class-live") liveApply(d.p);
    else if (d.type === "sw-class-res" && S.class && d.p && d.p.run === S.class.run && !(CTX.me && d.p.pid === CTX.me.id)) { var b = S.class.board, p = d.p, e2 = b[p.pid] || (b[p.pid] = { name: p.name || "Bạn học", avatar: p.avatar || "", total: 0, n: 0 }); e2.total = p.total; e2.n = p.n || e2.n; ((S.class.rq = S.class.rq || {})[p.q] = S.class.rq[p.q] || {})[p.pid] = p; if (S.screen === "live" && LIVE && LIVE.phase !== "prep" && LIVE.phase !== "resp") liveRender(); else updBoard(); }
  });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "clsmode") S.classMode = e.target.checked; });
  window.addEventListener("pagehide", function () { stopSpeech(); try { speechSynthesis.cancel(); } catch (e) {} });
  loadSets().then(function () { render(); toParent({ type: "sw-hello", kind: S.kind }); if (PENDING) { var d = PENDING; PENDING = null; applyStart(d); } });
})();
