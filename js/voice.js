/* voice.js — 🎤 Nói chuyện bằng giọng trong phòng game (TJ 2026-10-08).
   · MẶC ĐỊNH TẮT MIC khi vào phòng. Ai cũng tự bật / tắt mic của mình bất cứ lúc nào, KHÔNG cần host duyệt (trình duyệt vẫn tự hỏi quyền micro 1 lần — không tránh được).
   · WebRTC dạng LƯỚI (mesh) chỉ-âm-thanh: người đang BẬT mic mở 1 kết nối tới MỖI người còn lại (≈ 30–40 kbps mỗi luồng) -> ổn cho khoảng 6–8 người cùng nói.
     Báo hiệu qua kênh phòng sẵn có (broadcast event "voice"), cùng kiểu chia sẻ màn hình trong board.js:
       talker: "on" (lặp 5 giây/lần + trả lời "hello" của máy vào sau) -> người nghe gửi "want" -> talker offer -> người nghe answer -> trao ICE.
   · Host: nút "Tắt mic cả phòng" (Voice.muteAll) — chỉ tắt 1 lần, ai cũng bật lại được.
   · Chỉ STUN Google; TURN tuỳ chọn qua window.APP_CONFIG.TURN (mảng RTCIceServer) — KHÔNG để mật khẩu TURN trong repo. Không có TURN thì mạng 5G / công ty có thể không nối được.
   · Dùng TAI NGHE để khỏi vọng tiếng (đã bật echoCancellation nhưng loa ngoài vẫn dễ hú).
   Game gọi: Voice.attach(api) · Voice.onMsg(payload) · Voice.reset(). api = { ch, me, isHost }. */
(function () {
  "use strict";
  if (/[?&]usersonly=1/.test(location.search)) return;
  var locked = false, helloSent = false, api = null, cid = Math.random().toString(36).slice(2, 10), stream = null, annT = 0, built = false;
  var out = {}, inc = {}, talkers = {}, MAXP = 8, FULL = {};   /* out[cid] = kết nối GỬI tiếng của mình tới máy đó; inc[cid] = kết nối NHẬN tiếng từ talker đó; talkers[cid] = {n, at} */
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function me() { return api && api.me ? api.me() : null; }
  function myName() { var m = me(); return m && m.name ? m.name : "?"; }
  function send(m) { var ch = api && api.ch && api.ch(); if (!ch) return; m.cid = cid; ch.send({ type: "broadcast", event: "voice", payload: m }); }
  function iceServers() {
    var s = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }], c = window.APP_CONFIG;
    if (c && Array.isArray(c.TURN)) s = s.concat(c.TURN);
    if (Array.isArray(window.__turnServers)) s = s.concat(window.__turnServers);   /* TURN cấp tạm từ Edge Function turn-creds (js/turn.js) */
    return s;
  }
  function chain(o, f) { o.q = o.q.then(f).catch(function (e) { console.warn("[voice]", e); }); }
  function cand(c) { return c.toJSON ? c.toJSON() : { candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }; }
  function desc(d) { return { type: d.type, sdp: d.sdp }; }

  /* ---------- giao diện: nút 🎤 tròn, đặt cạnh nút 💬 (nếu có) ---------- */
  function bar() {   /* thanh dưới đáy dùng chung với chat.js / cc.js (ai gọi trước thì tạo) */
    var b = document.getElementById("cb-bar");
    if (!b) { b = document.createElement("div"); b.id = "cb-bar"; b.className = "cb-bar"; b.hidden = true; b.innerHTML = '<form id="cb-form" class="cb-form" autocomplete="off"><input id="cb-in" name="chat-message" type="text" maxlength="200" placeholder="Nhập tin nhắn…" enterkeyhint="send" autocomplete="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-form-type="other"></form>'; document.body.appendChild(b); }
    return b;
  }
  function build() {
    if (built) return; built = true;
    var b = document.createElement("button"); b.type = "button"; b.id = "vc-btn"; b.className = "vc-btn off"; b.hidden = true; b.title = "Bật / tắt mic của bạn (mặc định đang tắt)";
    b.innerHTML = '<svg class="cb-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 14.5a3.2 3.2 0 0 0 3.2-3.2V6.2a3.2 3.2 0 0 0-6.4 0v5.1A3.2 3.2 0 0 0 12 14.5z" fill="currentColor"/><path d="M6.2 11.2a5.8 5.8 0 0 0 11.6 0M12 17.2v3.3M8.8 20.5h6.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><g class="vcs"><path d="M4.5 4.5l15 15" style="stroke:var(--cb-btn,#34332f)" fill="none" stroke-width="5" stroke-linecap="round"/><path d="M4.5 4.5l15 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></g></svg>'; bar().appendChild(b);
    var p = document.createElement("div"); p.id = "vc-who"; p.className = "vc-who"; p.hidden = true; document.body.appendChild(p);
    p.addEventListener("click", function (e) { if (e.target.closest && !e.target.closest("[data-vcraw],[data-vcmon]")) { dbgOn = !dbgOn; paint(); } });   /* chạm nhãn = bật/tắt số chẩn đoán */
    p.addEventListener("click", function (e) {   /* nút "🎧 Nghe giọng mình" (TJ 2026-10-09): bật/tắt nghe lại CHÍNH MÌNH khi đang nói — riêng máy mình */
      var t = e.target.closest && e.target.closest("[data-vcmon]"); if (!t) return;
      var v = !monOn(); setMon(v); if (v) monStart(); else monStop(); paint();
      flash(v ? "🎧 Đang nghe lại giọng bạn — NÊN đeo tai nghe, loa ngoài sẽ bị vang." : "Đã tắt nghe lại giọng mình");
    });
    p.addEventListener("click", function (e) {   /* nút "Âm thanh máy tính" trong nhãn: đổi chế độ mic rồi bật lại mic */
      var t = e.target.closest && e.target.closest("[data-vcraw]"); if (!t) return;
      var v = !rawMode(); setRaw(v); flash(v ? "🎧 ÂM THANH GỐC: tắt khử ồn/khử vọng — tiếng máy tính qua mic không còn bị cắt" : "🗣 Chế độ GIỌNG NÓI (lọc ồn)");
      if (stream) { micOff(); micOn(); }
    });
    var lpT = 0, lpDone = false;
    var lpStart = function () { lpDone = false; clearTimeout(lpT); lpT = setTimeout(function () {
      lpDone = true; var v = !rawMode(); setRaw(v);
      flash(v ? "🎧 Mic: ÂM THANH GỐC (không lọc) — dùng khi phát âm thanh máy tính vào mic" : "🗣 Mic: GIỌNG NÓI (lọc ồn) — chế độ thường");
      if (stream) { micOff(); micOn(); }
    }, 700); };
    var lpEnd = function () { clearTimeout(lpT); };
    b.addEventListener("pointerdown", lpStart); b.addEventListener("pointerup", lpEnd); b.addEventListener("pointerleave", lpEnd); b.addEventListener("pointercancel", lpEnd);
    b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    b.addEventListener("click", function (e) { if (lpDone) { lpDone = false; e.stopImmediatePropagation(); return; } if (locked) { flash("🔇 Đang trong ván — mic tạm khoá. Hết giờ bạn tự bật mic nhé."); return; } if (stream) micOff(); else micOn(); });
    setInterval(tick, 700);
  }
  var flashT = 0;
  function flash(txt) { var wh = $("#vc-who"); if (!wh) return; wh.hidden = false; wh.textContent = txt; clearTimeout(flashT); flashT = setTimeout(paint, 3500); }
  function place() {   /* nút 🎤 nằm trong thanh đáy; chỉ đặt ô "ai đang nói" ngay trên thanh, sát bên phải */
    var wh = $("#vc-who"), br = $("#cb-bar"); if (!wh) return;
    wh.style.left = "auto"; wh.style.right = "10px"; wh.style.bottom = ((br && br.offsetHeight ? br.offsetHeight : 56) + 8) + "px";
  }
  function paint() {
    var b = $("#vc-btn"); if (!b) return;
    b.classList.toggle("off", !stream); b.classList.toggle("on", !!stream); b.classList.toggle("locked", !!locked);
    b.title = locked ? "Mic tạm khoá trong lúc chơi — hết giờ bạn tự bật" : stream ? "Đang BẬT mic — bấm để tắt" : "Bật mic của bạn (mặc định đang tắt)";
    var names = Object.keys(talkers).map(function (k) {
      var n = esc(talkers[k].n), i = inc[k], st = i && i.pc ? i.pc.connectionState : "", age = i ? Date.now() - i.at : 0;
      if (st === "connected") return (i.blocked ? "🔈 " + n + " — <b>chạm vào màn hình để nghe</b>" : "🎙 " + n) + dbgText(i);
      if (st === "failed" || st === "disconnected" || (st !== "connected" && age > 8000)) return "⚠ " + n + " (chưa nghe được — mạng có thể chặn)";
      return "⏳ " + n + " (đang nối…)";
    });
    if (stream) names.unshift("🎙 " + esc(myName()) + " (bạn)<br><span id=\"vc-lv\" style=\"font-size:11px;opacity:.9\">mic đang gửi: …</span><br>" + '<button type="button" data-vcraw="1" style="margin-top:3px;border:0;border-radius:999px;padding:4px 10px;font:700 11px/1.2 inherit;font-family:inherit;cursor:pointer;background:' + (rawMode() ? "#ffd84d;color:#2b2420" : "rgba(255,255,255,.22);color:#fff") + '">🎧 ' + (rawMode() ? "Âm thanh máy tính: BẬT" : "Phát âm thanh máy tính? Bấm bật") + "</button>" +
      ' <button type="button" data-vcmon="1" style="margin-top:3px;border:0;border-radius:999px;padding:4px 10px;font:700 11px/1.2 inherit;font-family:inherit;cursor:pointer;background:' + (monOn() ? "#3a86ff;color:#fff" : "rgba(255,255,255,.22);color:#fff") + '">🎧 ' + (monOn() ? "Đang nghe giọng mình" : "Nghe lại giọng mình") + "</button>");
    var wh = $("#vc-who"); if (wh) { wh.hidden = !names.length; wh.innerHTML = names.join("<br>"); }
  }
  /* chẩn đoán tiếng (hiện cạnh tên người nói): KB đã nhận, mức âm, loa đang phát/dừng -> biết tiếng KHÔNG TỚI máy hay TỚI mà loa im */
  function dbgText(i) {
    if (!i || !i.dbg) return ""; var d = i.dbg, el = i.el;
    if (!dbgOn && el && !el.paused && !i.blocked) return "";   /* ổn thì chỉ hiện tên cho gọn (khỏi che phụ đề); chạm vào nhãn để xem số chẩn đoán */
    return '<br><span style="opacity:.85;font-size:11px">' + (d.kb >= 0 ? "nhận " + d.kb + "KB" : "") + (d.lv != null ? " · mức " + d.lv : "") + " · loa " + (!el ? "chưa có" : el.paused ? "DỪNG" : "phát") + (el && el.muted ? " (tắt tiếng)" : "") + "</span>";
  }
  var dbgOn = false;
  function probe() {
    Object.keys(inc).forEach(function (k) {
      var i = inc[k]; if (!i || !i.pc || !i.pc.getStats || i.pc.connectionState !== "connected") return;
      i.pc.getStats().then(function (r) { r.forEach(function (x) { if (x.type === "inbound-rtp" && (x.kind === "audio" || x.mediaType === "audio")) { i.dbg = { kb: Math.round((x.bytesReceived || 0) / 1024), lv: x.audioLevel != null ? Math.round(x.audioLevel * 100) / 100 : null }; } }); }).catch(function () {});
    });
  }
  function tick() {
    place(); probe();
    Object.keys(inc).forEach(function (k) {
      var i = inc[k]; if (!i) return;
      if (i.el && i.pc && i.pc.connectionState === "connected" && i.el.paused) tryPlay(i);
      if (Date.now() - i.at > 12000 && !(i.pc && i.pc.connectionState === "connected")) redo(k);   /* nối mãi không xong -> làm lại từ đầu */
    });   /* tiếng đã nối mà <audio> đang dừng -> thử phát lại */
    if (Object.keys(talkers).length) paint();   /* cập nhật trạng thái nối (đang nối / nghe được / bị chặn) */
    var now = Date.now(), ch = false;
    Object.keys(talkers).forEach(function (k) { if (now - talkers[k].at > 13000) { delete talkers[k]; closeIn(k); ch = true; } });
    if (ch) paint();
  }

  /* ---------- người NÓI ---------- */
  function announce() { if (stream) send({ t: "on", n: myName() }); }
  /* "Âm thanh gốc": khi đưa âm thanh MÁY TÍNH (YouTube, nhạc, podcast…) vào mic, bộ lọc giọng nói của trình duyệt (khử ồn / khử vọng / tự chỉnh âm lượng) coi đó là tiếng ồn và làm méo -> nghe rì rào.
     Bật chế độ này (nhấn GIỮ nút 🎤 ~0,7 giây) thì tắt cả 3 bộ lọc + tăng chất lượng truyền. Nhớ theo máy. */
  /* 🎧 Nghe giọng mình (shadowing khi đang nói chuyện): đường mic -> loa của CHÍNH máy này, không gửi đi đâu; mặc định tắt, nhớ theo máy */
  function monOn() { try { return localStorage.getItem("tjwl_voice_mon_v1") === "1"; } catch (e) { return false; } }
  function setMon(v) { try { localStorage.setItem("tjwl_voice_mon_v1", v ? "1" : "0"); } catch (e) {} }
  var mon = null;
  function monStart() {
    monStop(); if (!stream || !monOn()) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var c = new AC({ latencyHint: "interactive" }), src = c.createMediaStreamSource(stream), g = c.createGain(); g.gain.value = 0.9;
      src.connect(g); g.connect(c.destination); if (c.state === "suspended") c.resume();
      mon = { c: c };
    } catch (e) {}
  }
  function monStop() { if (!mon) return; try { mon.c.close(); } catch (e) {} mon = null; }
  function rawMode() { try { return localStorage.getItem("tjwl_voice_raw_v1") === "1"; } catch (e) { return false; } }
  function setRaw(v) { try { localStorage.setItem("tjwl_voice_raw_v1", v ? "1" : "0"); } catch (e) {} }
  async function micOn() {
    if (stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) { alert("Trình duyệt này không hỗ trợ nói chuyện bằng mic. Thử Chrome, Edge hoặc Safari mới."); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: rawMode() ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } : { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
    catch (e) { stream = null; alert((e && e.name === "NotAllowedError") ? "Bạn chưa cho phép dùng micro. Bấm vào biểu tượng ổ khoá cạnh thanh địa chỉ để cho phép, rồi bấm 🎤 lại." : "Không mở được micro: " + (e && (e.message || e.name))); paint(); return; }
    stream.getAudioTracks().forEach(function (t) { t.onended = micOff; });
    announce(); clearInterval(annT); annT = setInterval(announce, 5000);
    paint(); meterStart(); monStart();
  }
  /* đo mức tiếng mic CỦA MÌNH đang gửi đi (hiện trong nhãn): ▁▂▃▄▅▆▇ + số; 0 mãi khi đang nói = tiếng gửi đi bị câm ở máy này */
  var meter = null;
  function meterStart() {
    meterStop(); try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC || !stream) return;
      var c = new AC(), src = c.createMediaStreamSource(stream), an = c.createAnalyser(); an.fftSize = 1024; src.connect(an);
      var buf = new Float32Array(1024), peak = 0, t = setInterval(function () {
        an.getFloatTimeDomainData(buf); var m = 0; for (var k = 0; k < buf.length; k++) { var a = Math.abs(buf[k]); if (a > m) m = a; } peak = Math.max(m, peak * 0.85);
        var el = document.getElementById("vc-lv"); if (!el) return; var n = Math.min(7, Math.round(Math.sqrt(peak) * 9)), bars = "▁▂▃▄▅▆▇".slice(0, n) || "·";
        el.textContent = "mic đang gửi: " + bars + " " + Math.round(peak * 100);
      }, 200);
      meter = { c: c, t: t };
    } catch (e) {}
  }
  function meterStop() { if (!meter) return; clearInterval(meter.t); try { meter.c.close(); } catch (e) {} meter = null; }
  function micOff() {
    if (!stream) return; meterStop(); monStop();
    var s = stream; stream = null; clearInterval(annT);
    s.getTracks().forEach(function (t) { t.onended = null; t.stop(); });
    Object.keys(out).forEach(closeOut); send({ t: "off" });
    paint();
  }
  function closeOut(c) { var o = out[c]; if (!o) return; delete out[c]; try { o.pc.close(); } catch (e) {} }
  function offerTo(to) {
    if (!stream) return;
    if (!out[to] && Object.keys(out).length >= MAXP - 1) { send({ t: "full", to: to }); return; }
    closeOut(to);
    var pc = new RTCPeerConnection({ iceServers: iceServers() }), o = out[to] = { pc: pc, q: Promise.resolve(), at: Date.now(), pend: [] };
    stream.getAudioTracks().forEach(function (t) { var sn = pc.addTrack(t, stream); if (rawMode() && sn && sn.getParameters) { try { var pr = sn.getParameters(); if (!pr.encodings || !pr.encodings.length) pr.encodings = [{}]; pr.encodings[0].maxBitrate = 64000; sn.setParameters(pr).catch(function () {}); } catch (e) {} } });
    pc.onicecandidate = function (e) { if (e.candidate && out[to] === o) send({ t: "ice", to: to, d: "o", c: cand(e.candidate) }); };   /* d:"o" = ICE của kết nối GỬI (người nghe nhận vào inc) */
    pc.onconnectionstatechange = function () { if (out[to] === o && (pc.connectionState === "failed" || pc.connectionState === "closed")) closeOut(to); };
    chain(o, function () { return pc.createOffer().then(function (d) { return pc.setLocalDescription(d); }).then(function () { send({ t: "offer", to: to, sdp: desc(pc.localDescription) }); }); });
  }

  /* ---------- người NGHE ---------- */
  function closeIn(c) {
    var i = inc[c]; if (!i) return; delete inc[c];
    try { i.pc.close(); } catch (e) {} if (i.el) { try { i.el.srcObject = null; } catch (e) {} giveEl(i.el); i.el = null; }
  }
  function redo(c) { closeIn(c); if (talkers[c]) setTimeout(function () { if (talkers[c]) want(c); }, 400); }
  function want(c) { if (inc[c] || FULL[c] > Date.now()) return; inc[c] = { pc: null, q: Promise.resolve(), pend: [], at: Date.now(), want: 1 }; send({ t: "want", to: c }); }
  function onOffer(m) {
    var i = inc[m.cid]; if (!i) return;
    if (i.pc) try { i.pc.close(); } catch (e) {}
    var pc = i.pc = new RTCPeerConnection({ iceServers: iceServers() });
    pc.ontrack = function (e) {
      var el = i.el; if (!el) el = i.el = takeEl();
      el.removeAttribute("src"); el.srcObject = (e.streams && e.streams[0]) || new MediaStream([e.track]); el.muted = false; el.volume = 1; tryPlay(i);
    };
    pc.onicecandidate = function (e) { if (e.candidate && inc[m.cid] === i) send({ t: "ice", to: m.cid, d: "i", c: cand(e.candidate) }); };
    pc.onconnectionstatechange = function () {   /* mạng chập chờn (5G/wifi): rớt thì tự nối lại thay vì chờ — trước đây chỉ "failed" mới đóng nên tiếng có rồi mất */
      if (inc[m.cid] !== i) return; var st = pc.connectionState; clearTimeout(i.rt);
      if (st === "failed") redo(m.cid);
      else if (st === "disconnected") i.rt = setTimeout(function () { if (inc[m.cid] === i && pc.connectionState !== "connected") redo(m.cid); }, 3500);
    };
    chain(i, function () {
      return pc.setRemoteDescription(m.sdp).then(function () { return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); })
        .then(function () { send({ t: "answer", to: m.cid, sdp: desc(pc.localDescription) }); var pd = i.pend; i.pend = []; return Promise.all(pd.map(function (c) { return pc.addIceCandidate(c).catch(function () {}); })); });
    });
  }
  /* ---- iPhone/Safari chặn tự phát tiếng: phần tử <audio> chỉ được "mở khoá" khi play() chạy TRONG 1 cú chạm (touchend/click — pointerdown thôi chưa đủ).
     Cách làm: ở cú chạm đầu tiên, tạo sẵn một dàn <audio> và phát 1 đoạn im lặng để mở khoá; sau đó tiếng talker chỉ việc gắn vào các phần tử đã mở khoá. */
  var pool = [], unlockedOk = false, SIL = "";
  function silentUrl() {
    if (SIL) return SIL; var n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
    function w(o, t) { for (var k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); }
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    SIL = URL.createObjectURL(new Blob([b], { type: "audio/wav" })); return SIL;
  }
  function mkEl() { var el = document.createElement("audio"); el.autoplay = true; el.playsInline = true; el.setAttribute("playsinline", ""); el.style.display = "none"; document.body.appendChild(el); return el; }
  function unlock() {
    if (unlockedOk) return;
    if (!pool.length) for (var k = 0; k < MAXP; k++) pool.push({ el: mkEl(), use: 0 });
    pool.forEach(function (o) {
      if (o.use || o.ok) return;
      try { o.el.src = silentUrl(); var p = o.el.play(); if (p && p.then) p.then(function () { o.ok = 1; unlockedOk = true; if (!o.use) o.el.pause(); }).catch(function () {}); } catch (e) {}
    });
  }
  function takeEl() { for (var k = 0; k < pool.length; k++) if (!pool[k].use) { pool[k].use = 1; return pool[k].el; } var el = mkEl(); pool.push({ el: el, use: 1 }); return el; }
  function giveEl(el) { for (var k = 0; k < pool.length; k++) if (pool[k].el === el) { pool[k].use = 0; return; } try { el.remove(); } catch (e) {} }
  function tryPlay(i) {
    if (!i || !i.el) return; var pl; try { pl = i.el.play(); } catch (e) { i.blocked = 1; return; }
    if (pl && pl.then) pl.then(function () { i.blocked = 0; }).catch(function () { i.blocked = 1; });
  }
  function onTouch() {
    unlock();
    Object.keys(inc).forEach(function (k) { var i = inc[k]; if (i && i.el && (i.blocked || i.el.paused)) tryPlay(i); });
  }
  ["touchend", "click", "pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, onTouch, true); });

  window.Voice = {
    attach: function (a) { api = a; build(); send({ t: "hello" }); },
    /* TJ 2026-10-08: cả nhóm nói chuyện bên HelloTalk -> TRONG VÁN (phase "play") mic bị khoá + tự tắt mic đang mở; hết giờ (về phòng chờ / kết quả) ai cũng TỰ bật mic của mình. App không bao giờ tự mở mic. */
    onState: function (s) {
      if (!api || !s) return; build(); var b = $("#vc-btn"); if (b) b.hidden = false; bar().hidden = false; document.body.classList.add("has-cbar");
      var lk = s.phase === "play";
      if (lk !== locked) { locked = lk; if (lk && stream) micOff(); paint(); }
      if (!helloSent) { helloSent = true; send({ t: "hello" }); }   /* vào sau: báo để người đang nói nối tiếng tới mình */
    },
    show: function () { build(); var b = $("#vc-btn"); if (b) b.hidden = false; place(); },
    onMsg: function (m) {
      if (!m || !api || m.cid === cid || (m.to && m.to !== cid)) return;
      var t = m.t;
      if (t === "on") { var first = !talkers[m.cid]; talkers[m.cid] = { n: String(m.n || "?").slice(0, 40), at: Date.now() }; want(m.cid); if (first) paint(); }
      else if (t === "off") { delete talkers[m.cid]; closeIn(m.cid); paint(); }
      else if (t === "hello") { if (stream) announce(); }
      else if (t === "want") { offerTo(m.cid); }
      else if (t === "offer") { onOffer(m); }
      else if (t === "answer") { var o = out[m.cid]; if (o) chain(o, function () { return o.pc.setRemoteDescription(m.sdp).then(function () { var pd = o.pend; o.pend = []; return Promise.all(pd.map(function (c) { return o.pc.addIceCandidate(c).catch(function () {}); })); }); }); }
      else if (t === "ice") {
        var tgt = m.d === "o" ? inc[m.cid] : out[m.cid];   /* ICE của luồng GỬI (d:"o") đi vào kết nối NHẬN của mình, và ngược lại */
        if (!tgt) return; if (tgt.pc && tgt.pc.remoteDescription) tgt.pc.addIceCandidate(m.c).catch(function () {}); else tgt.pend.push(m.c);
      }
      else if (t === "full") { FULL[m.cid] = Date.now() + 15000; closeIn(m.cid); }
      else if (t === "muteall") { if (stream) { micOff(); } }
    },
    muteAll: function () { if (api && api.isHost && api.isHost()) { send({ t: "muteall" }); if (stream) micOff(); } },   /* chỉ host */
    on: micOn, off: micOff, isOn: function () { return !!stream; }, isLocked: function () { return !!locked; },
    reset: function () { helloSent = false; locked = false; micOff(); Object.keys(inc).forEach(closeIn); talkers = {}; var b = $("#vc-btn"); if (b) b.hidden = true; paint(); }
  };
})();
