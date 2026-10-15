/* swclass.js — CHẾ ĐỘ LỚP cho thẻ 🎤 Speaking / ✍️ Writing (TJ 2026-10-14): host bấm Bắt đầu → mọi máy trong phòng tự mở thẻ và chạy cùng đề/dạng bài; điểm từng người phát lại qua kênh phòng → bảng điểm lớp.
   Cầu nối giữa kênh phòng của game.js (broadcast event "sw") và app learn/sw/ chạy trong iframe (postMessage cùng origin).
   Game gọi: SWClass.attach({ ch, me, isHost }) · SWClass.onMsg(payload).
   Tin trên kênh (payload.t): "start" {kind,set,group,run,by} · "res" {run,pid,name,avatar,q,score,max,total}.
   Tin iframe→trang: "sw-hello" (xin ngữ cảnh), "sw-host-start" {kind,set,group}, "sw-class-send" {p}. Trang→iframe: "sw-ctx", "sw-class-start", "sw-class-res". */
(function () {
  "use strict";
  var api = null, pending = null, openedRun = "";
  function liveFwd(p) { frames().forEach(function (f) { if (p.kind && f.src.indexOf(p.kind === "writing" ? "kind=writing" : "kind=speaking") < 0) return; post(f.contentWindow, { type: "sw-class-live", p: p }); }); }
  function frames() { return [].slice.call(document.querySelectorAll(".g-learnlayer iframe")); }
  function frameFor(kind) { var k = kind === "writing" ? "kind=writing" : "kind=speaking"; return frames().filter(function (f) { return f.src.indexOf(k) >= 0; })[0]; }
  function post(w, msg) { try { w.postMessage(msg, location.origin); } catch (e) {} }
  function ctx() { var ch = api && api.ch && api.ch(); return { inRoom: !!ch, isHost: !!(api && api.isHost && api.isHost()), me: api && api.me ? api.me() : null, players: api && api.players ? api.players() : [], room: api && api.room ? api.room() : "" }; }
  function send(p) { var ch = api && api.ch && api.ch(); if (ch) ch.send({ type: "broadcast", event: "sw", payload: p }); }
  function deliverStart(p) {
    var f = frameFor(p.kind), msg = { type: "sw-class-start", kind: p.kind, set: p.set, group: p.group, from: p.from, to: p.to, run: p.run, by: p.by };
    pending = msg; setTimeout(function () { if (pending === msg) pending = null; }, 4000); if (f) post(f.contentWindow, msg);   /* luôn giữ lại để gửi lại khi khung nạp xong (tin gửi quá sớm bị mất) */   /* iframe chưa tạo/chưa nạp xong: giữ lại, gửi khi nó xin ngữ cảnh */
  }
  function onMsg(p) {
    if (!p) return;
    if (p.t === "start") { openedRun = p.run; document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: p.kind })); setTimeout(function () { deliverStart(p); }, 250); }
    else if (p.t === "live" && p.phase === "close") { liveFwd(p); if (p.run === openedRun) openedRun = ""; }
    else if (p.t === "live") { if (p.run !== openedRun) { openedRun = p.run; document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: p.kind })); setTimeout(function () { liveFwd(p); }, 400); } else liveFwd(p); }
    else if (p.t === "fin") frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-fin", p: p }); });
    else if (p.t === "rdy") frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-rdy", p: p }); });
    else if (false) frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-live", p: p }); });
    else if (p.t === "res") frames().forEach(function (f) { post(f.contentWindow, { type: "sw-class-res", p: p }); });
  }
  window.addEventListener("message", function (e) {
    var d = e.data; if (e.origin !== location.origin || !d || typeof d.type !== "string" || d.type.indexOf("sw-") !== 0) return;
    if (d.type === "sw-hello") {
      post(e.source, Object.assign({ type: "sw-ctx" }, ctx()));
      if (pending && ((pending.kind === "writing") === (d.kind === "writing"))) { var m = pending; pending = null; setTimeout(function () { post(e.source, m); }, 150); }
    } else if (d.type === "sw-host-start") {
      var c = ctx(); if (!c.isHost || !c.inRoom) return;
      var p = { t: "start", kind: d.kind === "writing" ? "writing" : "speaking", set: String(d.set || ""), group: String(d.group || "all"), from: +d.from || 0, to: +d.to || 0, run: Date.now() + "-" + Math.random().toString(36).slice(2, 6), by: c.me && c.me.id };
      send(p); onMsg(p);   /* broadcast không gửi lại cho chính mình -> host tự xử lý */
    } else if (d.type === "sw-class-send" && d.p) send(d.p);
    else if (d.type === "sw-leave") document.dispatchEvent(new CustomEvent("tjwl-learn-home"));
    else if (d.type === "sw-want-open") document.dispatchEvent(new CustomEvent("tjwl-sw-open", { detail: d.kind }));   /* người chơi thoát lớp -> về trang game */
  });
  /* host chuyển sang thẻ khác (Từ vựng / TOEIC / EA / Marketing / về trang game) khi lớp đang chạy -> báo cả phòng thoát lớp */
  document.addEventListener("tjwl-learn-shown", function (e) {
    var k = e.detail; if (!openedRun || !ctx().isHost || k === "sp" || k === "wr") return;
    send({ t: "live", run: openedRun, phase: "close" }); openedRun = "";
  });
  window.SWClass = { attach: function (a) { api = a; }, onMsg: onMsg };
})();
