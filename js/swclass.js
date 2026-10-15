/* swclass.js — CHẾ ĐỘ LỚP cho thẻ 🎤 Speaking / ✍️ Writing (TJ 2026-10-14): host bấm Bắt đầu → mọi máy trong phòng tự mở thẻ và chạy cùng đề/dạng bài; điểm từng người phát lại qua kênh phòng → bảng điểm lớp.
   Cầu nối giữa kênh phòng của game.js (broadcast event "sw") và app learn/sw/ chạy trong iframe (postMessage cùng origin).
   Game gọi: SWClass.attach({ ch, me, isHost }) · SWClass.onMsg(payload).
   Tin trên kênh (payload.t): "start" {kind,set,group,run,by} · "res" {run,pid,name,avatar,q,score,max,total}.
   Tin iframe→trang: "sw-hello" (xin ngữ cảnh), "sw-host-start" {kind,set,group}, "sw-class-send" {p}. Trang→iframe: "sw-ctx", "sw-class-start", "sw-class-res". */
(function () {
  "use strict";
  var api = null, pending = null, openedRun = "";
  function exOk(f, ex) { return (f.src.indexOf("exam=ielts") >= 0) === (ex === "ielts"); }
  function liveFwd(p) { frames().forEach(function (f) { if (p.kind && f.src.indexOf(p.kind === "writing" ? "kind=writing" : "kind=speaking") < 0) return; if (!exOk(f, p.exam)) return; post(f.contentWindow, { type: "sw-class-live", p: p }); }); }
  function frames() { return [].slice.call(document.querySelectorAll(".g-learnlayer iframe")); }
  function frameFor(kind, ex) { var k = kind === "writing" ? "kind=writing" : "kind=speaking"; return frames().filter(function (f) { return f.src.indexOf(k) >= 0 && exOk(f, ex); })[0]; }
  function post(w, msg) { try { w.postMessage(msg, location.origin); } catch (e) {} }
  function ctx() { var ch = api && api.ch && api.ch(); return { inRoom: !!ch, isHost: !!(api && api.isHost && api.isHost()), me: api && api.me ? api.me() : null, players: api && api.players ? api.players() : [], room: api && api.room ? api.room() : "" }; }
  function send(p) { var ch = api && api.ch && api.ch(); if (ch) ch.send({ type: "broadcast", event: "sw", payload: p }); }
  function deliverStart(p) {
    var f = frameFor(p.kind, p.exam), msg = { type: "sw-class-start", kind: p.kind, exam: p.exam || "", set: p.set, group: p.group, from: p.from, to: p.to, run: p.run, by: p.by };
    pending = msg; setTimeout(function () { if (pending === msg) pending = null; }, 4000); if (f) post(f.contentWindow, msg);   /* luôn giữ lại để gửi lại khi khung nạp xong (tin gửi quá sớm bị mất) */   /* iframe chưa tạo/chưa nạp xong: giữ lại, gửi khi nó xin ngữ cảnh */
  }
  var openedQz = "";
  function qFwd(p) { frames().forEach(function (f) { if (f.src.indexOf("/learn/" + p.game + "/") >= 0) post(f.contentWindow, { type: "sw-qz", p: p }); }); }
  function onMsg(p) {
    if (!p) return;
    if (p.t === "qz" || p.t === "qa") {   /* lớp Kahoot EA / Marketing (learn/qclass.js) */
      if (p.t === "qz" && p.ph !== "close" && p.run !== openedQz) { openedQz = p.run; document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: p.game })); setTimeout(function () { qFwd(p); }, 600); } else qFwd(p);
      if (p.t === "qz" && p.ph === "close" && p.run === openedQz) openedQz = "";
      return;
    }
    if (p.t === "start") { openedRun = p.run; document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: p.kind === "writing" ? (p.exam === "ielts" ? "ielw" : "writing") : p.exam === "ielts" ? "ielts" : "speaking" })); setTimeout(function () { deliverStart(p); }, 250); }
    else if (p.t === "live" && p.phase === "close") { liveFwd(p); if (p.run === openedRun) openedRun = ""; }
    else if (p.t === "live") { if (p.run !== openedRun) { openedRun = p.run; document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: p.kind === "writing" ? (p.exam === "ielts" ? "ielw" : "writing") : p.exam === "ielts" ? "ielts" : "speaking" })); setTimeout(function () { liveFwd(p); }, 400); } else liveFwd(p); }
    else if (p.t === "fin") frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-fin", p: p }); });
    else if (p.t === "rdy") frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-rdy", p: p }); });
    else if (false) frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-live", p: p }); });
    else if (p.t === "res") frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-res", p: p }); });
  }
  window.addEventListener("message", function (e) {
    var d = e.data; if (e.origin !== location.origin || !d || typeof d.type !== "string" || d.type.indexOf("sw-") !== 0) return;
    if (d.type === "sw-hello") {
      post(e.source, Object.assign({ type: "sw-ctx" }, ctx()));
      var fr0 = frames().filter(function (f) { return f.contentWindow === e.source; })[0]; if (pending && (d.kind === "writing" || d.kind === "speaking") && ((pending.kind === "writing") === (d.kind === "writing")) && (pending.kind === "writing" || !fr0 || exOk(fr0, pending.exam))) { var m = pending; pending = null; setTimeout(function () { post(e.source, m); }, 150); }
    } else if (d.type === "sw-host-start") {
      var c = ctx(); if (!c.isHost || !c.inRoom) return;
      var p = { t: "start", kind: d.kind === "writing" ? "writing" : "speaking", exam: d.exam === "ielts" ? "ielts" : "", set: String(d.set || ""), group: String(d.group || "all"), from: +d.from || 0, to: +d.to || 0, run: Date.now() + "-" + Math.random().toString(36).slice(2, 6), by: c.me && c.me.id };
      send(p); onMsg(p);   /* broadcast không gửi lại cho chính mình -> host tự xử lý */
    } else if (d.type === "sw-class-send" && d.p) send(d.p);
    else if (d.type === "sw-do") document.dispatchEvent(new CustomEvent("tjwl-sw-do", { detail: d.a }));
    else if (d.type === "sw-leave") document.dispatchEvent(new CustomEvent("tjwl-learn-home"));
    else if (d.type === "sw-admin") document.dispatchEvent(new CustomEvent("tjwl-sw-admin", { detail: d.p }));   /* thẻ Quản trị của game vẽ phần lớp */
    else if (d.type === "sw-want-open") document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: d.kind === "writing" ? (d.exam === "ielts" ? "ielw" : "writing") : d.exam === "ielts" ? "ielts" : "speaking" }));   /* người chơi thoát lớp -> về trang game */
  });
  /* host chuyển sang thẻ khác (Từ vựng / TOEIC / EA / Marketing / về trang game) khi lớp đang chạy -> báo cả phòng thoát lớp */
  document.addEventListener("tjwl-learn-shown", function (e) {
    var k = e.detail; if (openedQz && ctx().isHost && k !== "dm" && k !== "ea") { send({ t: "qz", game: "dm", run: openedQz, ph: "close" }); send({ t: "qz", game: "ea", run: openedQz, ph: "close" }); openedQz = ""; }
    if (!openedRun || !ctx().isHost || k === "sp" || k === "wr" || k === "ielts" || k === "ielw") return;
    send({ t: "live", run: openedRun, phase: "close" }); openedRun = "";
  });
  function cmd(kind, c, v) { frames().forEach(function (f) { if (kind && f.src.indexOf(kind === "writing" ? "kind=writing" : kind === "dm" || kind === "ea" ? "/learn/" + kind + "/" : "kind=speaking") < 0) return; post(f.contentWindow, { type: "sw-cmd", cmd: c, v: v }); }); }
  window.SWClass = { cmd: cmd, attach: function (a) { api = a; }, onMsg: onMsg };
})();
