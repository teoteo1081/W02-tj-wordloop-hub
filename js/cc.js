/* cc.js — CC phụ đề trực tiếp trong phòng game, kiểu HelloTalk (TJ 2026-10-08).
   · CÁCH A (MIỄN PHÍ): trình duyệt của CHÍNH NGƯỜI NÓI tự nhận giọng -> chữ (Web Speech API), rồi gửi CHỮ cho cả phòng qua kênh phòng (broadcast event "cc").
     Không gửi âm thanh lên đâu cả, không tốn tiền. Chạy tốt trên Chrome / Edge; iPhone (Safari) không ổn định; Firefox không có (vẫn XEM được phụ đề của người khác).
   · Chỉ nhận giọng khi mic của mình đang BẬT (Voice.isOn()) và không đang trong ván (mic bị khoá lúc đó).
   · Nút CC trên thanh dưới đáy: bấm lần lượt NHỎ (dải 2–3 dòng) -> VỪA (khoảng 1/3 màn hình) -> TO (xuống tận thanh đáy) -> tắt.
   · Chữ chỉ giữ trong bộ nhớ (60 dòng gần nhất), KHÔNG lưu ở đâu.
   Game gọi: CC.attach(api) · CC.onMsg(payload) · CC.onState(st) · CC.reset(). api = { ch, me }. */
(function () {
  "use strict";
  if (/[?&]usersonly=1/.test(location.search)) return;
  var api = null, size = 0, lines = [], interim = {}, built = false, rec = null, recWant = false, lastSend = 0, noSupport = false, helloT = 0;
  var MAXL = 60, SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var LS_LANG = "tjwl_cc_lang_v1";
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function bar() {
    var b = document.getElementById("cb-bar");
    if (!b) { b = document.createElement("div"); b.id = "cb-bar"; b.className = "cb-bar"; b.hidden = true; b.innerHTML = '<form id="cb-form" class="cb-form" autocomplete="off"><input id="cb-in" name="chat-message" type="text" maxlength="200" placeholder="Nhập tin nhắn…" enterkeyhint="send" autocomplete="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-form-type="other"></form>'; document.body.appendChild(b); }
    return b;
  }
  function me() { return api && api.me ? api.me() : null; }
  function send(p) { var ch = api && api.ch && api.ch(); if (!ch) return; ch.send({ type: "broadcast", event: "cc", payload: p }); }
  function lang() { try { return localStorage.getItem(LS_LANG) || "en-US"; } catch (e) { return "en-US"; } }

  function build() {
    if (built) return; built = true;
    var b = document.createElement("button"); b.type = "button"; b.id = "cc-btn"; b.className = "cc-btn"; b.hidden = true; b.title = "Phụ đề (CC): bấm để đổi cỡ"; b.innerHTML = '<svg class="cb-ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2.6" y="5.6" width="18.8" height="12.8" rx="3.2" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="15.2" text-anchor="middle" font-size="8.6" font-weight="900" font-family="Arial,Helvetica,sans-serif" fill="currentColor">CC</text></svg>';
    bar().appendChild(b);
    var p = document.createElement("div"); p.id = "cc-panel"; p.className = "cc-panel"; p.hidden = true; p.setAttribute("data-size", "0");
    p.innerHTML = '<div class="cc-head"><b>CC · Phụ đề</b><span class="cc-me" id="cc-me"></span><button type="button" id="cc-grow" class="cc-x" title="Đổi cỡ" aria-label="Đổi cỡ phụ đề">⤢</button><button type="button" id="cc-close" class="cc-x" title="Tắt phụ đề" aria-label="Tắt phụ đề">✕</button></div><div class="cc-list" id="cc-list"></div>';
    document.body.appendChild(p);
    b.addEventListener("click", function () { setSize((size + 1) % 4); });
    $("#cc-grow").addEventListener("click", function () { setSize(size >= 3 ? 1 : size + 1); });
    $("#cc-close").addEventListener("click", function () { setSize(0); });
    setInterval(tick, 1000);
  }
  function setSize(n) {
    size = n; var p = $("#cc-panel"), b = $("#cc-btn"); if (!p) return;
    p.hidden = size === 0; p.setAttribute("data-size", String(size)); if (b) { b.classList.toggle("on", size > 0); b.setAttribute("data-size", String(size)); }
    paint();
    var l = $("#cc-list"); if (l) { l.scrollTop = l.scrollHeight; setTimeout(function () { l.scrollTop = l.scrollHeight; }, 60); }   /* mở / đổi cỡ: luôn thấy dòng mới nhất ở cuối */
  }
  function paint() {
    var l = $("#cc-list"); if (!l || size === 0) return;
    var atEnd = l.scrollHeight - l.scrollTop - l.clientHeight < 40, mm = me();
    var items = lines.slice(-MAXL).map(function (m) { return { n: m.n, x: m.x, f: 1, mine: mm && m.id === mm.id, id: m.id }; });
    Object.keys(interim).forEach(function (k) { var it = interim[k]; items.push({ n: it.n, x: it.x, f: 0, mine: mm && k === mm.id, id: k }); });
    l.innerHTML = items.length ? items.map(function (m) { return '<div class="cc-l' + (m.f ? "" : " cc-i") + (m.mine ? " me" : "") + '"><b class="cc-n">' + esc(m.n || "?") + "</b> " + esc(m.x) + "</div>"; }).join("") : '<div class="cc-empty">Chưa có ai nói. Khi có người bật 🎤 và nói, phụ đề sẽ hiện ở đây.</div>';
    var note = $("#cc-me"); if (note) note.textContent = noSupport && window.Voice && Voice.isOn() ? "⚠ Máy bạn không tạo được phụ đề từ giọng của bạn" : "";
    if (atEnd) l.scrollTop = l.scrollHeight;
  }

  /* ---------- người NÓI: nhận giọng -> chữ ---------- */
  function wantRec() { return !!(SR && window.Voice && Voice.isOn() && !(Voice.isLocked && Voice.isLocked())); }
  function startRec() {
    if (rec || !SR) return;
    var r; try { r = new SR(); } catch (e) { noSupport = true; return; }
    r.continuous = true; r.interimResults = true; r.lang = lang(); r.maxAlternatives = 1;
    r.onresult = function (e) {
      var inter = "", fin = "";
      for (var i = e.resultIndex; i < e.results.length; i++) { var t = e.results[i][0] ? e.results[i][0].transcript : ""; if (e.results[i].isFinal) fin += t; else inter += t; }
      var mm = me(); if (!mm) return;
      if (fin.trim()) send({ id: mm.id, n: mm.name || "", x: fin.trim().slice(0, 300), f: 1 });
      else if (inter.trim() && Date.now() - lastSend > 350) { lastSend = Date.now(); send({ id: mm.id, n: mm.name || "", x: inter.trim().slice(0, 300), f: 0 }); }
    };
    r.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "language-not-supported")) { noSupport = true; recWant = false; } };
    r.onend = function () { rec = null; if (recWant && wantRec()) setTimeout(startRec, 250); };   /* Chrome tự dừng sau lúc im lặng -> mở lại khi mic còn bật */
    rec = r; try { r.start(); } catch (e) { rec = null; }
  }
  function stopRec() { recWant = false; if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } }
  function tick() {
    var w = wantRec();
    if (w && !rec && !noSupport) { recWant = true; startRec(); }
    else if (!w && (rec || recWant)) stopRec();
    var now = Date.now(), ch = false;
    Object.keys(interim).forEach(function (k) { if (now - interim[k].at > 6000) { delete interim[k]; ch = true; } });   /* người nói dở rồi im: bỏ dòng tạm */
    if (ch) paint();
  }

  window.CC = {
    attach: function (a) { api = a; build(); },
    onState: function (s) { if (!api || !s) return; build(); var b = $("#cc-btn"); if (b) b.hidden = false; bar().hidden = false; document.body.classList.add("has-cbar"); },
    onMsg: function (p) {
      if (!p || typeof p.x !== "string" || !p.id) return;
      var x = p.x.slice(0, 300), n = String(p.n || "").slice(0, 40);
      if (p.f) { delete interim[p.id]; lines.push({ id: String(p.id), n: n, x: x }); if (lines.length > MAXL) lines = lines.slice(-MAXL); }
      else interim[p.id] = { n: n, x: x, at: Date.now() };
      if (size > 0) paint();
    },
    setSize: setSize, size: function () { return size; },
    reset: function () { stopRec(); lines = []; interim = {}; setSize(0); var b = $("#cc-btn"); if (b) b.hidden = true; noSupport = false; }
  };
})();
