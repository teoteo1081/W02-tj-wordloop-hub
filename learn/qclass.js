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
    "#qc .panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin:6px 0 14px}#qc .panel .ph{font-weight:800;font-size:18px;margin-bottom:6px}#qc .pchips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}#qc .pchips span{padding:3px 12px;border-radius:99px;border:1px solid var(--line);background:var(--bg);font-size:13px}" +
    "#qc .panel .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px 14px;margin-top:8px}#qc .panel label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)}#qc .panel select,#qc .panel input[type=number]{padding:10px 8px;border-radius:10px;background:var(--bg);color:var(--ink);border:1px solid var(--line);font:inherit;font-size:14px;width:100%;box-sizing:border-box}" +
    "#qc .panel .rowchk{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 2px}#qc .panel label.chk{flex-direction:row;align-items:center;gap:8px;color:var(--ink);font-size:14px}#qc .panel .chk input{width:20px;height:20px;accent-color:#d97757}#qc .pinfo{margin:10px 0;font-size:13px;color:var(--muted)}#qc .qb.big{padding:12px 26px;font-size:16px;border-radius:10px}" +
    "#qc .lhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0}#qc .lhead h2{margin:0;font-size:19px}" +
    "#qc .bk{background:var(--card);border:1px solid var(--line);border-left:4px solid #5aa9d6;border-radius:12px;padding:12px 14px;margin:10px 0}#qc .bkh{display:flex;gap:6px;align-items:center;flex-wrap:wrap}#qc .bkh b{font-size:17px;margin-right:4px}#qc .bkh .c{font-size:12px;padding:2px 9px;border-radius:99px;border:1px solid var(--line);background:var(--bg)}#qc .bkh .part{color:var(--muted)}#qc .bkt{margin:4px 0 8px;color:var(--muted);font-size:14px}" +
    "#qc .bkw{display:flex;flex-wrap:wrap;gap:6px}#qc .bkw span{padding:4px 11px;border-radius:99px;border:1px solid var(--line);background:var(--bg);font-size:14px}#qc .bkf{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px}#qc .bkf button{font:inherit;font-size:14px;font-weight:700;border-radius:10px;padding:8px 16px;cursor:pointer;border:1px solid var(--line);background:var(--bg);color:var(--ink)}#qc .bkf .tg.on{border-color:#4fb985;color:#4fb985}#qc .bkf .pl{background:#8b5cf6;border-color:#8b5cf6;color:#fff}" +
    "#qc .qb.sm{padding:10px 14px}#qc .mg{margin-top:18px}#qc .qfoot{position:fixed;left:0;right:0;bottom:0;padding:10px 14px;background:var(--bg);border-top:1px solid var(--line);display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}#qc .qfoot .sm:first-child{margin-right:auto}" +
    "#qc .qs label{display:block;margin:12px 0 4px;color:var(--muted);font-size:14px}#qc .qch{display:flex;flex-wrap:wrap;gap:6px}#qc .qch button{padding:8px 12px;border-radius:99px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}#qc .qch button.on{background:#d97757;border-color:#d97757;color:#fff}" +
    "#qc .av{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--card);border:3px solid var(--line);font-size:20px;overflow:hidden;flex:none}#qc .av img{width:100%;height:100%;object-fit:cover}" +
    "#qc .av.dim{opacity:.35;filter:grayscale(1)}#qc .av.lit{border-color:#d97757}#qc .av.ok{border-color:#4fb985;box-shadow:0 0 0 2px rgba(79,185,133,.35)}#qc .av.bad{border-color:#e0607a;box-shadow:0 0 0 2px rgba(224,96,122,.3)}" +
    "#qc .strip{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 12px}#qc .strip .l{font-size:13px;color:var(--muted);margin-right:4px}#qc .qo .who{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}#qc .qo .who .av{width:28px;height:28px;font-size:16px;border-width:2px}" +
    "#qc .pod{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:14px 0}#qc .pod>div{text-align:center;flex:1;max-width:150px}#qc .pod .av{width:64px;height:64px;font-size:34px;margin:0 auto 6px}#qc .pod .blk{border-radius:10px 10px 0 0;background:#d97757;color:#fff;font-weight:800;padding:8px 0}" +
    "#qc .gq .gclock{display:flex;align-items:center;gap:10px;flex-wrap:wrap;row-gap:6px;margin-bottom:10px}#qc .gq .gt{font-size:34px;font-weight:800;color:#d97757;font-variant-numeric:tabular-nums;min-width:44px}#qc .gq .gsub{color:var(--muted);font-size:14px}#qc .gq .gtools{margin-left:auto;display:flex;gap:8px;align-items:center}#qc .qx.sm{width:36px;height:36px;font-size:16px}" +
    "#qc .gcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}#qc .gbar{height:5px;border-radius:3px;background:var(--line);overflow:hidden;margin-bottom:12px}#qc .gbar i{display:block;height:100%;background:#d97757;transition:width .25s linear}#qc .ghint{text-align:center;font-size:13px;color:var(--muted)}" +
    "#qc .gvi{font-size:22px;font-weight:700;color:var(--blue-dark,#8fb8e8);text-align:center;min-height:2.4em;display:flex;align-items:center;justify-content:center;line-height:1.45;padding:4px 2px}#qc .gsay{text-align:center;margin:4px 0}" +
    "#qc .gopts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}#qc .gopt{min-height:56px;padding:10px;border-radius:12px;border:2px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:16px;font-weight:600;cursor:pointer;word-break:break-word;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}" +
    "#qc .gopt:disabled{cursor:default}#qc .gopt.picked{border-color:#f0a66e;background:rgba(240,166,110,.14)}#qc .gopt.ok{border-color:#4fb985;background:rgba(79,185,133,.2)}#qc .gopt.bad{border-color:#e0607a;background:rgba(224,96,122,.18)}#qc .gopt .pk{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}#qc .gopt .pk .av{width:26px;height:26px;font-size:15px;border-width:2px}" +
    "#qc .gq .gt.nx{font-size:24px;color:var(--muted)}#qc .nxl{text-align:center;margin-top:10px}#qc .gres{margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line);font-size:15px}#qc .gres.ok{border-color:#4fb985}#qc .gres.bad{border-color:#e0607a}#qc .grow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px}#qc .grow.gm{margin-top:18px}" +
    "#qc .gq .qbd div.me{outline:2px solid #d97757;border-radius:8px}" +
    "#qc .gtopbar{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:2px 0 8px}#qc .gtopbar .tp{display:flex;flex-direction:column;align-items:center;font-size:12px;gap:2px;padding:4px 8px;border-radius:12px;border:1px solid var(--line);background:var(--card)}#qc .gtopbar .tp.me{border-color:#d97757}#qc .gtopbar .tp.got{border-color:#4fb985;background:rgba(79,185,133,.14)}#qc .gtopbar .tp.got .av{border-color:#4fb985}#qc .gtopbar .tp .av{width:30px;height:30px;font-size:18px;border-width:2px}" +
    "#qc .gstat{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 10px}#qc .gstat span{display:flex;flex-direction:column;align-items:center;min-width:64px;padding:6px 10px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:11px;color:var(--muted)}#qc .gstat b{font-size:17px;color:var(--ink)}#qc i.g,#qc b.g{color:#4fb985;font-style:normal}#qc i.r,#qc b.r{color:#e0607a;font-style:normal}#qc .cw{margin-left:auto;font-size:13px;white-space:nowrap}#qc .qbd .pts{margin-left:10px}#qc #qvol{width:80px;accent-color:#d97757}" +
    "@media (max-width:420px){#qc .gopts{grid-template-columns:1fr}}" +
        "#qc .phead{margin:16px 2px 6px;font-weight:700;font-size:16px;display:flex;align-items:center;gap:8px}#qc .pb{font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px;border:1px solid}#qc .pb1{background:rgba(90,169,214,.15);color:#8cc8ec;border-color:#5aa9d6}#qc .pb2{background:rgba(168,146,217,.15);color:#c6b6f0;border-color:#a892d9}#qc .pb3{background:rgba(224,123,155,.15);color:#f0a3be;border-color:#e07b9b}#qc .bkt1{font-weight:700;font-size:17px}#qc .bk .bkt{margin:2px 0 10px}"+
    "#qc .bkr{display:flex;gap:8px}#qc .bkf .tb{background:var(--bg)}#qc .bkw span[data-tip]{position:relative;cursor:help}#qc .bkw span[data-tip]:hover::after,#qc .bkw span[data-tip]:focus::after{content:attr(data-tip);position:absolute;left:0;bottom:calc(100% + 6px);z-index:6;width:max-content;max-width:260px;white-space:normal;background:#111;color:#fff;padding:6px 10px;border-radius:8px;font-size:13px;font-weight:400;line-height:1.4;box-shadow:0 6px 16px rgba(0,0,0,.4)}" +
    "#qc .tbl{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:4px 12px;margin:8px 0}#qc .tr{display:grid;grid-template-columns:26px minmax(110px,170px) 40px 1fr;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}#qc .tr:last-child{border:0}#qc .tr .n{color:var(--muted);font-size:13px}#qc .tr .te{font-size:16px}#qc .tr .tv{font-size:15px;color:var(--ink)}" +
    "@media (max-width:520px){#qc .tr{grid-template-columns:22px 1fr 40px}#qc .tr .tv{grid-column:2/-1}}" +
    "#qfab{position:fixed;right:14px;bottom:78px;z-index:8000;padding:11px 18px;border-radius:99px;border:0;background:#d97757;color:#fff;font:700 16px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer}";
  css.textContent += "#qc[hidden],#qfab[hidden]{display:none!important}";
  document.head.appendChild(css);
  var ov = document.createElement("div"); ov.id = "qc"; ov.hidden = true; document.body.appendChild(ov);
  var fab = document.createElement("button"); fab.id = "qfab"; fab.type = "button"; fab.hidden = true; fab.textContent = "👥 Chơi cả phòng"; document.body.appendChild(fab);

  function av(id, cls) { var n = (Z && Z.pl && Z.pl[id]) || {}; return '<span class="av ' + (cls || "") + '" title="' + esc(n.name || "") + '">' + ava(n.avatar) + "</span>"; }
  var lastSay = "";
  var SND = (function () { try { return JSON.parse(localStorage.getItem("qz-snd") || "null") || { mute: false, vol: 100 }; } catch (e) { return { mute: false, vol: 100 }; } })();
  function saveSnd() { try { localStorage.setItem("qz-snd", JSON.stringify(SND)); } catch (e) {} }
  function speak(t) { if (SND.mute) return; try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = "en-US"; u.rate = 0.9; u.volume = Math.max(0, Math.min(1, SND.vol / 100)); speechSynthesis.speak(u); } catch (e) {} }
  function autoSay() { if (Z && Z.ph === "q" && Z.q && Z.q.say && Z.q.auto !== 0 && Z.q.k !== "m2en") { var key = Z.run + ":" + Z.i; if (key !== lastSay) { lastSay = key; speak(Z.q.say); } } }
  function rem() { return Z && Z.tEnd ? Math.max(0, (Z.tEnd - Date.now()) / 1000) : 0; }
  function paintBoard(b, meId) { var pk = Z && Z.ph === "rev" ? Z.picks || null : null; return '<div class="qbd">' + (b || []).slice(0, 8).map(function (r, k) { var c = pk ? pk[r.id] : null, mk = pk ? (c == null ? "⏰" : c === Z.ans ? "✅" : "❌") : ""; return "<div" + (r.id === meId ? ' class="me"' : "") + "><b>" + (k + 1) + "</b>" + '<span class="av ' + (pk ? (c == null ? "dim" : c === Z.ans ? "ok" : "bad") : "") + '">' + ava(r.avatar) + "</span><span>" + esc(r.name) + (r.id === meId ? " (bạn)" : "") + '</span><span class="cw"><i class="g">✓' + (r.c || 0) + '</i> <i class="r">✗' + (r.w || 0) + '</i></span><span class="pts">' + mk + " " + r.pts + "</span>" + (r.last ? '<span class="d">+' + r.last + "</span>" : "") + "</div>"; }).join("") + "</div>"; }
  function podium(b) {
    b = (b || []).slice(0, 3); if (!b.length) return ""; var order = b.length === 3 ? [1, 0, 2] : b.length === 2 ? [1, 0] : [0], hh = [90, 64, 48];
    return '<div class="pod">' + order.map(function (i) { var r = b[i]; return '<div><span class="av ok">' + ava(r.avatar) + "</span><div>" + esc(r.name) + '</div><div class="blk" style="height:' + hh[i] + 'px">' + ["🥇", "🥈", "🥉"][i] + " " + r.pts + "</div></div>"; }).join("") + "</div>";
  }
  var HINT = { quiz: "📝 Trắc nghiệm bài học", en2m: "Chọn nghĩa đúng của thuật ngữ", m2en: "Chọn thuật ngữ đúng với nghĩa", listen: "🎧 Nghe và chọn nghĩa đúng" };
  function render() {   /* bố cục giống màn chơi Kahoot của game Từ vựng: đồng hồ · thanh tiến trình · từ to giữa · 4 đáp án lưới 2×2 (avatar người chọn dưới chữ) · nút trong thẻ · bảng điểm bên dưới */
    if (!Z || Z.ph === "close") { ov.hidden = true; fab.hidden = !(CTX.isHost && CTX.inRoom); return; }
    ov.hidden = false; fab.hidden = true;
    var host = !!H, me = CTX.me || {}, mine = Z.my, q = Z.q || { t: "", o: [] }, rev = Z.ph === "rev";
    var h = '<div class="qw gq"><div class="gclock"><button class="qx sm" data-q="quit" title="' + (host ? "Đóng lớp" : "Thoát") + '">✕</button>' + (Z.ph === "end" ? '<span class="gt">🏆</span><span class="gsub">Kết quả</span>' : '<span class="gt' + (Z.ph === "q" ? "" : " nx") + '" id="qcd">' + (Z.ph === "q" ? Math.ceil(rem()) : Z.nxEnd ? "⏭ " + Math.max(0, Math.ceil((Z.nxEnd - Date.now()) / 1000)) : "✓") + '</span><span class="gsub">Câu ' + (Z.i + 1) + "/" + Z.n + (Z.ph === "q" ? " · " + (host ? "đã trả lời " + (Z.got || 0) + "/" + (H.expect || 0) : mine != null ? "✓ đã chọn" : "") : "") + "</span>") + '<span class="gtools">' + (Z.ph !== "end" ? '<button class="qx sm" data-q="mute" title="' + (SND.mute ? "Bật tiếng đọc" : "Tắt tiếng đọc") + '">' + (SND.mute ? "🔇" : "🔊") + '</button><input type="range" id="qvol" min="0" max="100" step="5" value="' + SND.vol + '" aria-label="Âm lượng đọc từ">' : "") + (q.say && Z.ph !== "end" ? '<button class="qx sm" data-q="say" title="Nghe lại">🔁</button>' : "") + (host ? '<button class="qb soft sm" data-q="close">⏹ Kết thúc</button>' : "") + "</span></div>";
    if (Z.ph === "end") {
      h += "<h2>Bảng xếp hạng cuối</h2>" + podium(Z.board) + paintBoard(Z.board, me.id) + (host ? "" : '<p class="gsub">Host sẽ đóng lớp, bạn sẽ về phòng game.</p>');
    } else {
      var rows = (Z.board && Z.board.length ? Z.board : Object.keys(Z.pl || {}).map(function (id) { return { id: id, name: (Z.pl[id] || {}).name, avatar: (Z.pl[id] || {}).avatar, c: 0, w: 0 }; })), meR = rows.filter(function (r) { return r.id === me.id; })[0] || { c: 0, w: 0 };
      h += '<div class="gstat"><span><b class="g">' + (meR.c || 0) + "</b>Đúng</span><span><b class=\"r\">" + (meR.w || 0) + "</b>Sai</span><span><b>" + (Z.ph === "q" ? Z.i : Z.i + 1) + "/" + Z.n + "</b>Đã làm</span><span><b>" + Math.max(0, Z.n - (Z.ph === "q" ? Z.i : Z.i + 1)) + "</b>Còn lại</span></div>";
      h += '<div class="gtopbar">' + rows.slice(0, 8).map(function (r) { var got = Z.ph === "q" && (Z.ids || []).indexOf(r.id) >= 0; return '<span class="tp' + (r.id === me.id ? " me" : "") + (got ? " got" : "") + '" title="' + (got ? "Đã trả lời" : "") + '"><span class="av">' + ava(r.avatar) + '</span><b>' + esc(String(r.name || "?").slice(0, 8)) + ' <i class="g">✓' + (r.c || 0) + "</i>" + (got ? ' <i class="g">✔</i>' : "") + "</b></span>"; }).join("") + "</div>";
      h += '<div class="gcard">' + (Z.ph === "q" ? '<div class="gbar"><i id="qpg" style="width:' + (Z.tot ? Math.min(100, 100 * rem() / Z.tot) : 0) + '%"></i></div>' : "") + '<div class="ghint">' + esc(HINT[q.k] || "") + '</div><div class="gvi">' + (q.hide ? '<span style="font-size:44px">🎧</span>' : esc(q.t)) + "</div>";
      if (q.hide) h += '<div class="gsay"><button class="qb" data-q="say">🔊 Nghe</button></div>';
      h += '<div class="gopts">';
      q.o.forEach(function (o, k) {
        var cls = "gopt", dis = "";
        if (rev) { dis = " disabled"; if (k === Z.ans) cls += " ok"; else if (k === mine) cls += " bad"; }
        else if (mine === k) cls += " picked"; else if (mine != null || (host && !H.hp)) dis = " disabled";
        h += '<button class="' + cls + '" data-q="pick" data-k="' + k + '"' + dis + '><span class="otext">' + esc(o) + "</span>" + (rev && Z.picks ? '<span class="pk">' + Object.keys(Z.picks).filter(function (id) { return Z.picks[id] === k; }).map(function (id) { return av(id, k === Z.ans ? "ok" : "bad"); }).join("") + "</span>" : "") + "</button>";
      });
      h += "</div>";
      if (rev) {
        var my = (Z.board || []).filter(function (r) { return r.id === me.id; })[0], no = Object.keys(Z.pl || {}).filter(function (id) { return Z.picks && Z.picks[id] == null; });
        h += '<div class="gres ' + (mine === Z.ans ? "ok" : "bad") + '"><b>' + (mine === Z.ans ? "✅ Đúng rồi!" : mine == null ? "⏰ Chưa trả lời" : "❌ Chưa đúng") + (my && my.last ? " +" + my.last : "") + "</b><br>" + esc(Z.exp || "") + "</div>" +
          (no.length ? '<div class="strip"><span class="l">⏰ Không kịp:</span>' + no.map(function (id) { return av(id, "dim"); }).join("") + "</div>" : "");
      }
      if (Z.ph === "rev" && Z.nxEnd) h += '<div class="gsub nxl">⏭ ' + (Z.i + 1 >= Z.n ? "Xem kết quả" : "Câu tiếp") + ' sau <b id="qnx">' + Math.max(0, Math.ceil((Z.nxEnd - Date.now()) / 1000)) + "</b>s…</div>";
      if (host) h += '<div class="grow">' + (Z.ph === "q" ? '<button class="qb soft" data-q="lock">👁 Chốt câu</button>' : '<button class="qb' + (Z.nxEnd ? " soft" : "") + '" data-q="next">' + (Z.nxEnd ? "⏭ Bỏ qua" : Z.i + 1 >= Z.n ? "🏆 Xem kết quả" : "Câu tiếp ▶") + "</button>") + "</div>";
      h += "</div>";
      if (rev) h += paintBoard(Z.board, me.id);
    }
    if (host) h += '<div class="grow gm"><button class="qb soft sm" data-q="users">👥 Quản lý người chơi</button><button class="qb soft sm" data-q="copy">🔗 Copy link mời</button></div>';
    ov.innerHTML = h + "</div>"; autoSay();
  }
  function tick() {
    if (Z && Z.ph === "rev" && Z.nxEnd) { var left = Math.max(0, Math.ceil((Z.nxEnd - Date.now()) / 1000)), nx = $("#qnx"), cd = $("#qcd"); if (nx) nx.textContent = left; if (cd) cd.textContent = "⏭ " + left; }
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
  function showTable(id) {   /* bảng từ vựng của 1 module: thuật ngữ · nghe · nghĩa tiếng Việt · link đọc bài học */
    var l = lessonsList().filter(function (x) { return x.id === id; })[0] || { id: id, title: id }, vs = (DATA.vocab || []).filter(function (v) { return v.lesson === id; });
    var base = (window.QUEST_CONFIG && QUEST_CONFIG.lessonBase) || "", link = l.file && /^https?:/.test(base) ? base + l.file : "";
    var h = '<div class="qw"><div class="qtop"><button class="qx" data-q="back">←</button><span class="qn">📖 ' + esc(String(l.title || id)) + '</span></div><div class="tbl">' +
      vs.map(function (v, k) { return '<div class="tr"><span class="n">' + (k + 1) + '</span><span class="te"><b>' + esc(v.en) + '</b></span><button class="qx sm" data-q="sayw" data-w="' + esc(v.en) + '" title="Nghe">🔊</button><span class="tv">' + esc(v.vi) + "</span></div>"; }).join("") + "</div>" +
      '<div class="grow"><button class="qb soft" data-q="back">← Quay lại</button>' + (link ? '<button class="qb soft" data-q="lesson" data-u="' + esc(link) + '">📘 Đọc bài học</button>' : "") + '<button class="qb" data-q="one" data-id="' + esc(id) + '">🎮 Chơi bài này</button></div></div>';
    ov.hidden = false; fab.hidden = true; ov.innerHTML = h; ov.scrollTop = 0;
  }
  var TYPES = [["pro", "🎓 Chuyên ngành: thuật ngữ + câu hỏi tình huống"], ["vocab", "📚 Chỉ thuật ngữ (nghĩa · nghe)"], ["mix", "🔀 Trộn cả trắc nghiệm bài học"], ["quiz", "📝 Trắc nghiệm bài học"], ["en2m", "🔤 Thuật ngữ → nghĩa (tiếng mẹ đẻ)"], ["m2en", "🈯 Nghĩa → thuật ngữ"], ["listen", "🎧 Nghe → chọn nghĩa"]];
  function typesOf(t) { return t === "pro" ? { quiz: true, en2m: true, m2en: true } : t === "vocab" ? { en2m: true, m2en: true, listen: true } : t === "mix" ? { quiz: true, en2m: true, m2en: true, listen: true } : (function (o) { o[t] = true; return o; })({}); }
  function showSetup() {   /* giống hub Từ vựng của game: thẻ phòng · bảng "Chủ đề ván này" · các thẻ Block bên dưới (bài học Marketing) */
    if (!setup) setup = { mods: lessonsList().map(function (l) { return l.id; }), n: 10, sec: 25, secV: 15, hp: true, say: true, auto: true, type: "pro" };
    var T = typesOf(setup.type), V = DATA.vocab || [], Qs = DATA.questions || [], inSel = function (id) { return setup.mods.indexOf(id) >= 0; };
    var nQ = Qs.filter(function (q) { return inSel(q.lesson); }).length, nV = V.filter(function (v) { return inSel(v.lesson); }).length, cnt = (T.quiz ? nQ : 0) + (T.en2m || T.m2en || T.listen ? nV : 0);
    var mins = Math.max(1, Math.round(setup.n * ((T.quiz && (T.en2m || T.m2en || T.listen) ? (setup.sec + setup.secV) / 2 : T.quiz ? setup.sec : setup.secV) + 6) / 60));
    var sel = function (id, opts, cur) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; };
    var h = '<div class="qw"><div class="qtop"><button class="qx" data-q="setupx">✕</button><span class="qn">👥 Chơi cả phòng</span></div>' + roomCard() +
      '<div class="panel"><div class="ph">📚 Chủ đề ván này</div><div class="pchips">' + (setup.mods.length ? lessonsList().filter(function (l) { return inSel(l.id); }).map(function (l) { return "<span>" + esc(String(l.title || l.id).replace(/^\d+ · /, "")) + "</span>"; }).join("") : "<span>(chưa chọn bài nào — chọn ở các thẻ bên dưới)</span>") + "</div>" +
      '<div class="grid"><label>Kiểu chơi<select disabled><option>Cùng 1 câu (kiểu Kahoot)</option></select></label>' +
      '<label>Dạng câu hỏi' + sel("qtype", TYPES, setup.type) + "</label>" +
      '<label>Số câu<input type="number" id="qn" min="1" max="60" value="' + setup.n + '"></label>' +
      '<label>Giây / câu trắc nghiệm<input type="number" id="qsec" min="5" max="120" value="' + setup.sec + '"></label>' +
      '<label>Giây / câu từ vựng<input type="number" id="qsecv" min="3" max="60" value="' + setup.secV + '"></label>' +
      '<label>Cách tính điểm<select disabled><option>Theo tốc độ: đúng +500…1000</option></select></label></div>' +
      '<div class="rowchk"><label class="chk"><input type="checkbox" id="qhp"' + (setup.hp ? " checked" : "") + '> Host cũng chơi</label><label class="chk"><input type="checkbox" id="qauto"' + (setup.auto !== false ? " checked" : "") + '> ⏭ Tự chuyển câu (kiểu Kahoot)</label><label class="chk"><input type="checkbox" id="qsay"' + (setup.say ? " checked" : "") + '> 🔊 Tự đọc thuật ngữ tiếng Anh</label></div>' +
      '<div class="pinfo">' + setup.mods.length + " bài · " + nQ + " câu trắc nghiệm · " + nV + " thuật ngữ · ván ≈ " + mins + " phút</div>" +
      '<button class="qb big" data-q="go"' + (cnt ? "" : " disabled") + '>▶ Bắt đầu</button></div>' +
      '<div class="lhead"><h2>📚 Các bài học</h2><span><button class="qb soft sm" data-q="all">Chọn hết</button> <button class="qb soft sm" data-q="none">Bỏ hết</button></span></div>';
    var PARTS = (window.QUEST_CONFIG && QUEST_CONFIG.parts) || {}, lastPart = null;
    lessonsList().forEach(function (l) {
      var vs = V.filter(function (v) { return v.lesson === l.id; }), lq = Qs.filter(function (q) { return q.lesson === l.id; }).length, pt = PARTS[l.part] || null;
      if (l.part !== lastPart) { lastPart = l.part; if (pt) h += '<div class="phead">' + (pt ? '<span class="pb pb' + esc(l.part) + '">' + esc(pt.label) + "</span> " + esc(pt.name) : "") + "</div>"; }
      h += '<div class="bk"><div class="bkt1">' + esc(String(l.title || l.id)) + '</div><div class="bkt">' + vs.length + " từ · " + lq + ' câu trắc nghiệm</div><div class="bkw">' +
        vs.map(function (v) { return '<span tabindex="0" title="' + esc(v.vi) + '" data-tip="' + esc(v.vi) + '">' + esc(v.en) + "</span>"; }).join("") + '</div><div class="bkf"><button class="tg' + (inSel(l.id) ? " on" : "") + '" data-q="mod" data-id="' + esc(l.id) + '">' + (inSel(l.id) ? "☑ Đã chọn" : "☐ Chọn") + '</button><span class="bkr"><button class="tb" data-q="table" data-id="' + esc(l.id) + '">📖 Mở bảng</button><button class="pl" data-q="one" data-id="' + esc(l.id) + '">🎮 Chơi game →</button></span></div></div>';
    });
    h += "</div>";
    ov.hidden = false; fab.hidden = true; var st = ov.scrollTop; ov.innerHTML = h; ov.scrollTop = st; saveH();
  }
  function expectIds() { return (CTX.players || []).filter(function (p) { return setup.hp !== false || !(CTX.me && p.id === CTX.me.id); }).map(function (p) { return p.id; }); }
  function startRun() {
    var T = typesOf(setup.type), kinds = ["quiz", "en2m", "m2en", "listen"].filter(function (k) { return T[k]; }), V = shuffle((DATA.vocab || []).filter(function (v) { return setup.mods.indexOf(v.lesson) >= 0; })), Q = shuffle(DATA.questions.filter(function (q) { return setup.mods.indexOf(q.lesson) >= 0; })), qs = [], vi = 0, qi = 0, guard = 0;
    function pick4(v, key) {   /* 3 đáp án nhiễu: ưu tiên cùng module, không trùng nghĩa */
      var same = V.filter(function (x) { return x !== v && x.lesson === v.lesson && x[key] !== v[key]; }), rest = V.filter(function (x) { return x !== v && x.lesson !== v.lesson && x[key] !== v[key]; }), o = [v[key]];
      shuffle(same).concat(shuffle(rest)).forEach(function (x) { if (o.length < 4 && o.indexOf(x[key]) < 0) o.push(x[key]); });
      return shuffle(o);
    }
    while (qs.length < setup.n && guard++ < 400 && kinds.length) {
      var k = kinds[Math.floor(Math.random() * kinds.length)];
      if (k === "quiz") {
        var q = Q[qi++]; if (!q) { kinds.splice(kinds.indexOf("quiz"), 1); continue; }
        var idx = shuffle(q.opts.map(function (_, i) { return i; }));
        qs.push({ t: q.q, o: idx.map(function (i) { return q.opts[i]; }), a: idx.indexOf(q.a), exp: q.exp || "", sec: setup.sec, k: "quiz" }); continue;
      }
      var v = V[vi++]; if (!v || V.length < 4) { ["en2m", "m2en", "listen"].forEach(function (x) { var i = kinds.indexOf(x); if (i >= 0) kinds.splice(i, 1); }); continue; }
      var exp = v.en + " = " + v.vi;
      if (k === "m2en") { var o1 = pick4(v, "en"); qs.push({ t: "Thuật ngữ nào có nghĩa: " + v.vi, o: o1, a: o1.indexOf(v.en), exp: exp, sec: setup.secV, k: k, say: v.en }); }
      else { var o2 = pick4(v, "vi"); qs.push({ t: k === "listen" ? "Nghe thuật ngữ rồi chọn nghĩa đúng" : v.en, o: o2, a: o2.indexOf(v.vi), exp: exp, sec: setup.secV, k: k, say: v.en, hide: k === "listen" }); }
    }
    if (!qs.length) return;
    H = { cor: {}, wr: {}, auto: setup.auto !== false, say: setup.say !== false, hp: setup.hp !== false, run: Date.now() + "-" + Math.random().toString(36).slice(2, 6), qs: qs, i: -1, sec: setup.sec, ans: {}, score: {}, last: {}, expect: 0, names: {} };
    (CTX.players || []).forEach(function (p) { H.names[p.id] = { name: p.name, avatar: p.avatar }; H.score[p.id] = 0; });
    nextQ();
  }
  function playersMap() { var m = {}; (CTX.players || []).forEach(function (p) { if (H.hp !== false || !(CTX.me && p.id === CTX.me.id)) m[p.id] = { name: p.name, avatar: p.avatar }; }); Object.keys(H.ans).forEach(function (id) { if (!m[id]) m[id] = H.names[id] || {}; }); return m; }
  function snap() {
    var q = H.qs[H.i] || { t: "", o: [], a: 0, exp: "" }, base = { run: H.run, ph: H.ph, i: H.i, n: H.qs.length, q: { t: q.t, o: q.o, say: q.say || "", hide: q.hide ? 1 : 0, k: q.k || "quiz", auto: H.say === false ? 0 : 1 }, tot: H.sec, rem: H.ph === "q" ? rem() : 0, got: Object.keys(H.ans).length, ids: Object.keys(H.ans), pl: playersMap() };
    if (H.ph === "rev") base.nx = H.revEnd ? Math.max(0, (H.revEnd - Date.now()) / 1000) : 0;
    if (H.ph === "rev" || H.ph === "end") { base.ans = q.a; base.exp = q.exp; base.cnt = H.cnt; base.board = H.board; base.picks = {}; Object.keys(base.pl).forEach(function (id) { base.picks[id] = H.ans[id] ? H.ans[id].c : null; }); }
    return base;
  }
  var SKEY = "qz-host-v1-" + GID;
  function saveH() { try { if (H) sessionStorage.setItem(SKEY, JSON.stringify({ at: Date.now(), H: H, ui: "run" })); else if (setup && !ov.hidden) sessionStorage.setItem(SKEY, JSON.stringify({ at: Date.now(), ui: "setup", setup: setup })); } catch (e) {} }
  function clearSaved() { try { sessionStorage.removeItem(SKEY); } catch (e) {} }
  var restored = false;
  function tryRestore() {
    if (restored || H || !CTX.isHost || !CTX.inRoom) return; restored = true;
    var o; try { o = JSON.parse(sessionStorage.getItem(SKEY) || "null"); } catch (e) { o = null; } if (!o || Date.now() - o.at > 3 * 3600 * 1000) return;
    if (o.ui === "setup") { setup = o.setup; showSetup(); return; }
    if (o.ui === "run" && o.H) {
      H = o.H; setup = setup || { mods: [], n: 10, sec: 20, secV: 10, hp: H.hp !== false, say: H.say !== false, type: "mix" };
      if (H.ph === "q") { if (Date.now() >= H.tEnd) { reveal(); } else { pushState(); clearInterval(hbT); hbT = setInterval(pushState, 2000); } } else if (H.ph === "rev" && H.auto && H.revEnd) { var left = H.revEnd - Date.now(); if (left <= 0) nextQ(); else { H.autoT = setTimeout(function () { if (H && H.ph === "rev") nextQ(); }, left); pushState(); } } else pushState();
    }
  }
  function pushState() { if (!H) return; var s = snap(); send(s); Z = Object.assign({}, s, { tEnd: H.tEnd, nxEnd: H.revEnd || 0, my: H.my }); saveH(); render(); }
  function nextQ() {
    if (H) { clearTimeout(H.autoT); H.revEnd = 0; }
    H.i++; if (H.i >= H.qs.length) return finish();
    H.sec = H.qs[H.i].sec || H.sec; H.ph = "q"; H.ans = {}; H.my = null; H.tEnd = Date.now() + H.sec * 1000; H.t0 = Date.now(); H.expect = expectIds().length; H.last = {};
    pushState(); clearInterval(hbT); hbT = setInterval(pushState, 2000);
  }
  function board() {
    return Object.keys(H.score).map(function (id) { var n = H.names[id] || {}; return { id: id, name: n.name || "?", avatar: n.avatar || "", pts: H.score[id], last: H.last[id] || 0, c: H.cor[id] || 0, w: H.wr[id] || 0 }; }).sort(function (a, b) { return b.pts - a.pts; });
  }
  function reveal() {
    if (!H || H.ph !== "q") return;
    var q = H.qs[H.i]; H.ph = "rev"; H.cnt = [0, 0, 0, 0];
    Object.keys(H.score).forEach(function (id) { var a0 = H.ans[id]; if (a0 && a0.c === q.a) H.cor[id] = (H.cor[id] || 0) + 1; else H.wr[id] = (H.wr[id] || 0) + 1; });
    Object.keys(H.ans).forEach(function (id) { var a = H.ans[id]; H.cnt[a.c] = (H.cnt[a.c] || 0) + 1; if (a.c === q.a) { var pts = Math.round(1000 - 500 * Math.min(1, a.ms / (H.sec * 1000))); H.score[id] = (H.score[id] || 0) + pts; H.last[id] = pts; } });
    H.board = board(); clearTimeout(H.autoT); H.revEnd = 0;
    if (H.auto) { var ms = (q.k === "quiz" ? 7000 : 4000) + (H.hp === false ? 0 : 0); H.revEnd = Date.now() + ms; H.autoT = setTimeout(function () { if (H && H.ph === "rev") nextQ(); }, ms); }
    pushState();
  }
  function finish() { H.ph = "end"; H.board = board(); H.last = {}; H.board.forEach(function (r) { r.last = 0; }); pushState(); }
  function closeRun() { clearInterval(hbT); clearSaved(); if (H) clearTimeout(H.autoT); if (H) send({ run: H.run, ph: "close" }); H = null; Z = null; ov.hidden = true; fab.hidden = !(CTX.isHost && CTX.inRoom); }
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
    else if (a === "setupx") { ov.hidden = true; fab.hidden = false; clearSaved(); }
    else if (a === "table") showTable(b.dataset.id);
    else if (a === "back") showSetup();
    else if (a === "sayw") speak(b.dataset.w);
    else if (a === "mute") { SND.mute = !SND.mute; saveSnd(); if (SND.mute) { try { speechSynthesis.cancel(); } catch (x) {} } render(); }
    else if (a === "lesson") { try { window.open(b.dataset.u, "_blank", "noopener"); } catch (x) {} }
    else if (a === "all") { setup.mods = lessonsList().map(function (l) { return l.id; }); showSetup(); }
    else if (a === "none") { setup.mods = []; showSetup(); }
    else if (a === "one") { e.stopPropagation(); setup.mods = [b.dataset.id]; var hp0 = $("#qhp"); setup.hp = hp0 ? hp0.checked : setup.hp; startRun(); }
    else if (a === "mod") { var i = setup.mods.indexOf(b.dataset.id); if (i >= 0) setup.mods.splice(i, 1); else setup.mods.push(b.dataset.id); showSetup(); }
    else if (a === "n") { setup.n = +b.dataset.v; showSetup(); } else if (a === "sec") { setup.sec = +b.dataset.v; showSetup(); } else if (a === "secv") { setup.secV = +b.dataset.v; showSetup(); }
    else if (a === "type") { setup.types[b.dataset.v] = !setup.types[b.dataset.v]; showSetup(); }
    else if (a === "say") { if (Z && Z.q && Z.q.say) speak(Z.q.say); }
    else if (a === "go") { var hp = $("#qhp"); setup.hp = hp ? hp.checked : true; startRun(); }
    else if (a === "users" || a === "copy") toParent({ type: "sw-do", a: a });
    else if (a === "lock") reveal(); else if (a === "next") nextQ(); else if (a === "close") closeRun();
    else if (a === "pick" && Z && Z.ph === "q" && Z.my == null) {
      var k = +b.dataset.k, used = Math.max(0, (Z.tot || 0) * 1000 - rem() * 1000); Z.my = k;
      if (H) { H.my = k; hostGot({ run: H.run, i: H.i, pid: me.id, name: me.name, avatar: me.avatar, c: k, ms: used }); } else send({ t: "qa", run: Z.run, i: Z.i, pid: me.id, name: me.name || "", avatar: me.avatar || "", c: k, ms: used });
      render();
    }
  });
  ov.addEventListener("change", function (e) {
    var t = e.target, v = +t.value;
    if (t.id === "qvol") { SND.vol = v; saveSnd(); return; }
    if (t.id === "qhp") setup.hp = t.checked; else if (t.id === "qsay") setup.say = t.checked; else if (t.id === "qauto") setup.auto = t.checked;
    else if (t.id === "qn") { setup.n = Math.max(1, Math.min(60, v || 10)); setTimeout(showSetup, 0); } else if (t.id === "qsec") { setup.sec = Math.max(5, Math.min(120, v || 20)); setTimeout(showSetup, 0); } else if (t.id === "qsecv") { setup.secV = Math.max(3, Math.min(60, v || 10)); setTimeout(showSetup, 0); }
    else if (t.id === "qtype") { setup.type = t.value; setTimeout(showSetup, 0); }
  });
  fab.addEventListener("click", showSetup);
  window.addEventListener("message", function (e) {
    var d = e.data; if (e.origin !== location.origin || !d || typeof d.type !== "string") return;
    if (d.type === "sw-ctx") { CTX = { inRoom: !!d.inRoom, isHost: !!d.isHost, me: d.me || null, players: d.players || [], room: d.room || "" }; if (!Z && !H) fab.hidden = !(CTX.isHost && CTX.inRoom) || !ov.hidden; tryRestore(); }
    else if (d.type === "sw-qz" && d.p) {
      var p = d.p; if (p.game !== GID) return;
      if (p.t === "qa") { if (H) hostGot(p); return; }
      if (H) return;   /* host tự giữ trạng thái của mình */
      if (p.ph === "close") { var was = !!Z; Z = null; ov.hidden = true; if (was) toParent({ type: "sw-leave" }); return; }
      var keepMy = Z && Z.run === p.run && Z.i === p.i ? Z.my : null;
      Z = Object.assign({}, p, { tEnd: Date.now() + (p.rem || 0) * 1000, nxEnd: p.nx ? Date.now() + p.nx * 1000 : 0, my: keepMy });
      if (Z.ph === "rev" && Z.my == null) Z.my = null;
      render();
    }
  });
  /* màu sáng/tối theo TRANG GAME bên ngoài (không theo hệ điều hành) -> màn người chơi giống hệt màn host */
  function syncTheme() {
    try {
      var bg = getComputedStyle(window.parent.document.body).backgroundColor, m = String(bg).match(/[\d.]+/g); if (!m || m.length < 3) return;
      if (m.length > 3 && +m[3] === 0) return;
      var lum = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
      document.documentElement.setAttribute("data-theme", lum < 0.5 ? "dark" : "light");
    } catch (e) {}
  }
  syncTheme(); setInterval(syncTheme, 3000);
  setInterval(function () { toParent({ type: "sw-hello", kind: "dm" }); }, 2500); toParent({ type: "sw-hello", kind: "dm" });
})();
