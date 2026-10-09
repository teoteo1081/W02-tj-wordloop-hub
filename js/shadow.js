/* shadow.js — 🎧 SHADOWING: nghe mẫu (giọng đọc của bảng) rồi NÓI THEO, app GHI giọng bạn để bạn NGHE LẠI chính mình (TJ 2026-10-09).
   · Hoàn toàn RIÊNG máy này: ghi bằng MediaRecorder, giữ trong bộ nhớ (blob), KHÔNG gửi cho ai, KHÔNG lưu lên Supabase; đóng thanh là xoá.
   · Cách dùng: bấm 🎧 Shadowing -> ⏺ Ghi (bật mic, tối đa 2 phút) -> ⏹ Dừng -> ▶ Nghe lại. Nên đeo TAI NGHE để mic không thu cả giọng mẫu từ loa.
   · Tạm dừng phụ đề CC (CC.hold) lúc ghi vì cùng dùng micro / nhận giọng; không chạy khi đang 🎤 Đọc theo.
   board.js tạo nút data-sh; file này tự lắng nghe cú bấm. Chrome / Edge / Safari (iOS 14.5+) có MediaRecorder; Firefox cũng có. */
(function () {
  "use strict";
  var MAXMS = 120000;
  var $ = function (s) { return document.querySelector(s); };
  var bar = null, stream = null, rec = null, chunks = [], blob = null, url = "", audio = null, t0 = 0, tick = 0, stopT = 0, meter = null, state = "idle";   /* idle | rec | done */
  function stage() { return $("#bd-stage") || document.body; }
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function pickMime() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
    var c = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
    for (var i = 0; i < c.length; i++) { try { if (MediaRecorder.isTypeSupported(c[i])) return c[i]; } catch (e) {} }
    return "";
  }
  function setBtn(on) { [].forEach.call(document.querySelectorAll("[data-sh]"), function (b) { b.classList.toggle("on", !!on); }); }
  function paint() {
    if (!bar) return;
    var h = "";
    if (state === "idle") h = '<b>🎧 Shadowing</b><span>Nghe mẫu rồi nói theo. Đeo tai nghe nhé.</span><button type="button" data-shgo class="rec">⏺ Ghi</button><button type="button" data-shx aria-label="Đóng">✕</button>';
    else if (state === "rec") h = '<b class="live">● Đang ghi <i id="sh-t">0:00</i></b><span class="sh-lv"><u id="sh-lv"></u></span><button type="button" data-shstop class="rec">⏹ Dừng</button>';
    else h = '<b>✅ Đã ghi <i>' + fmt(blob ? (blob._ms || 0) : 0) + '</i></b><span class="sh-pl"><button type="button" data-shplay>▶ Nghe lại</button></span><button type="button" data-shgo class="ghost">🔁 Ghi lại</button><button type="button" data-shx aria-label="Đóng">✕</button>';
    bar.innerHTML = h;
  }
  function open() {
    if (bar) return;
    if (window.ReadAlong && ReadAlong.isRunning && ReadAlong.isRunning()) { alert("Đang 🎤 Đọc theo — bấm Xong rồi mới dùng Shadowing nhé."); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { alert("Trình duyệt này chưa hỗ trợ ghi âm. Dùng Chrome, Edge hoặc Safari mới nhé."); return; }
    bar = document.createElement("div"); bar.className = "sh-bar"; stage().appendChild(bar);
    bar.addEventListener("click", onBar); state = "idle"; setBtn(true); paint();
  }
  function cleanup(keepBar) {
    clearInterval(tick); clearTimeout(stopT); stopMeter();
    if (rec && rec.state !== "inactive") { try { rec.onstop = null; rec.stop(); } catch (e) {} }
    rec = null; if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
    if (url) { try { URL.revokeObjectURL(url); } catch (e) {} url = ""; }
    blob = null; chunks = []; if (window.CC && CC.hold) CC.hold(false);
    if (!keepBar && bar) { bar.remove(); bar = null; setBtn(false); state = "idle"; }
  }
  function startMeter() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC || !stream) return;
      var c = new AC(), src = c.createMediaStreamSource(stream), an = c.createAnalyser(); an.fftSize = 512; src.connect(an);
      var buf = new Float32Array(512), peak = 0, id = setInterval(function () {
        an.getFloatTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) { var a = Math.abs(buf[i]); if (a > m) m = a; }
        peak = Math.max(m, peak * 0.8); var u = $("#sh-lv"); if (u) u.style.width = Math.min(100, Math.round(Math.sqrt(peak) * 120)) + "%";
      }, 90);
      meter = { c: c, id: id };
    } catch (e) {}
  }
  function stopMeter() { if (!meter) return; clearInterval(meter.id); try { meter.c.close(); } catch (e) {} meter = null; }
  async function start() {
    cleanup(true);
    if (window.CC && CC.hold) CC.hold(true);
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true }, video: false }); }
    catch (e) { if (window.CC && CC.hold) CC.hold(false); alert((e && e.name === "NotAllowedError") ? "Bạn chưa cho phép dùng micro. Bấm ổ khoá cạnh thanh địa chỉ để cho phép rồi thử lại." : "Không mở được micro: " + (e && (e.message || e.name))); return; }
    var mime = pickMime(), r;
    try { r = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch (e) { cleanup(true); alert("Không bật được ghi âm trên máy này."); return; }
    rec = r; chunks = [];
    r.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    r.onstop = function () {
      var ms = Date.now() - t0; clearInterval(tick); clearTimeout(stopT); stopMeter();
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      if (window.CC && CC.hold) CC.hold(false);
      if (!chunks.length || ms < 400) { state = "idle"; blob = null; paint(); return; }
      blob = new Blob(chunks, { type: r.mimeType || mime || "audio/webm" }); blob._ms = ms;
      if (url) { try { URL.revokeObjectURL(url); } catch (e) {} } url = URL.createObjectURL(blob);
      state = "done"; paint();
    };
    t0 = Date.now(); r.start(250); state = "rec"; paint(); startMeter();
    tick = setInterval(function () { var e = $("#sh-t"); if (e) e.textContent = fmt(Date.now() - t0); }, 250);
    stopT = setTimeout(stopRec, MAXMS);
  }
  function stopRec() { if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) {} } }
  function play() {
    if (!url) return;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}   /* đang đọc mẫu thì dừng để nghe riêng giọng mình */
    if (audio) { try { audio.pause(); } catch (e) {} }
    audio = new Audio(url); audio.playsInline = true;
    var b = $("[data-shplay]"); if (b) b.textContent = "⏸ Đang phát…";
    audio.onended = function () { var x = $("[data-shplay]"); if (x) x.textContent = "▶ Nghe lại"; };
    audio.onerror = function () { var x = $("[data-shplay]"); if (x) x.textContent = "⚠ Không phát được"; };
    var pr = audio.play(); if (pr && pr.catch) pr.catch(function () { var x = $("[data-shplay]"); if (x) x.textContent = "⚠ Chạm lại để phát"; });
  }
  function onBar(e) {
    var t = e.target.closest && e.target.closest("button"); if (!t) return;
    if (t.hasAttribute("data-shgo")) start();
    else if (t.hasAttribute("data-shstop")) stopRec();
    else if (t.hasAttribute("data-shplay")) { if (audio && !audio.paused) { audio.pause(); t.textContent = "▶ Nghe lại"; } else play(); }
    else if (t.hasAttribute("data-shx")) cleanup(false);
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-sh]"); if (b) { if (bar) cleanup(false); else open(); } });
  window.addEventListener("pagehide", function () { cleanup(false); });
  window.Shadow = { toggle: function () { if (bar) cleanup(false); else open(); }, isOpen: function () { return !!bar; }, _state: function () { return state; } };
})();
