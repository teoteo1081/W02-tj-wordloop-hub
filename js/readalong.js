/* readalong.js — 🎤 ĐỌC THEO: người học đọc TO bài đọc trên Bảng, app nghe, tô sáng chỗ đã đọc, báo từ ĐÚNG / SAI / BỎ SÓT và chấm điểm (TJ 2026-10-08).
   · Riêng từng máy (không gửi cho ai): kết quả chỉ hiện ở máy người đọc, không lưu lên Supabase.
   · Nhận giọng bằng Web Speech API (miễn phí; Chrome / Edge ổn, iPhone Safari không ổn định, Firefox không có), ngôn ngữ en-US.
   · Cách chấm: so từng từ người đọc với từng từ trong bài, theo thứ tự, có xét: đọc nhảy cóc (bỏ sót từ), nhận nhầm (sai), thêm từ thừa (bỏ qua). Giống từ ≈ khớp (sai 1–2 chữ cái vẫn đúng, vì trình duyệt hay nhận lệch).
   · Bắt đầu từ từ đầu tiên đang thấy trên màn hình; đọc tới đâu tô tới đó và tự cuộn theo.
   · Điểm = số từ đúng / số từ đã đọc tới (không phạt phần chưa đọc). Bấm từ sai để nghe phát âm chuẩn.
   board.js gọi: ReadAlong.toggle() khi bấm nút 🎤 Đọc theo (data-ra). */
(function () {
  "use strict";
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var T = [], p = 0, rec = null, running = false, hud = null, card = null, spokenDone = 0, startedAt = 0, stopTimer = 0;
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(w) { return String(w || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]/g, ""); }

  /* ---- so khớp từ: bằng nhau, hoặc gần giống (trình duyệt hay nhận lệch 1–2 chữ cái) ---- */
  function lev(a, b) {
    var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    var d = [], i, j; for (j = 0; j <= n; j++) d[j] = j;
    for (i = 1; i <= m; i++) { var prev = d[0]; d[0] = i; for (j = 1; j <= n; j++) { var t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
    return d[n];
  }
  function same(target, said) {
    var a = norm(target), b = norm(said); if (!a || !b) return false;
    if (a === b) return true;
    if (a.length <= 3 || b.length <= 3) return false;   /* từ ngắn: phải đúng hẳn */
    var lim = a.length >= 8 ? 2 : 1;
    return lev(a, b) <= lim;
  }

  /* ---- lấy danh sách từ của bài đang hiện (theo thứ tự đọc) ---- */
  function collect() {
    var box = $("#bd-doc .bd-scroll") || $("#bd-doc"); if (!box) return [];
    var els = box.querySelectorAll(".bd-w, .bd-term"), out = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.classList.contains("bd-w") && el.closest(".bd-term")) continue;   /* từ nằm trong cụm [term]: tính theo cụm */
      var words = (el.textContent || "").split(/\s+/).filter(function (x) { return norm(x); });
      for (var k = 0; k < words.length; k++) out.push({ w: words[k], n: norm(words[k]), el: el, st: "", last: k === words.length - 1 });
    }
    return out;
  }
  function startIndex() {   /* từ đầu tiên đang thấy ở mép trên khung bài đọc */
    var box = $("#bd-doc .bd-scroll") || $("#bd-doc"); if (!box) return 0;
    var top = box.getBoundingClientRect().top - 2;
    for (var i = 0; i < T.length; i++) { var r = T[i].el.getBoundingClientRect(); if (r.height && r.bottom > top + 6) return i; }
    return 0;
  }

  /* ---- tô màu ---- */
  function paintTok(i) {
    var t = T[i]; if (!t) return; var el = t.el;
    var group = T.filter(function (x) { return x.el === el; });
    var st = group.some(function (x) { return x.st === "bad"; }) ? "bad" : group.some(function (x) { return x.st === "miss"; }) ? "miss" : group.every(function (x) { return x.st === "ok"; }) ? "ok" : "";
    el.classList.remove("ra-ok", "ra-bad", "ra-miss"); if (st) el.classList.add("ra-" + st);
  }
  function mark(i, st) { if (T[i] && !T[i].st) { T[i].st = st; paintTok(i); } }
  function cursor() {
    document.querySelectorAll("#bd-doc .ra-cur").forEach(function (x) { x.classList.remove("ra-cur"); });
    var t = T[p]; if (!t) return; t.el.classList.add("ra-cur");
    var box = $("#bd-doc .bd-scroll"); if (!box) return;
    var r = t.el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top < b.top + 30 || r.bottom > b.bottom - 50) { try { box.scrollTop += Math.round(r.top - b.top - b.height * 0.3); } catch (e) {} }   /* cuộn để từ đang đọc nằm ở khoảng 1/3 từ trên */
  }
  function clearAll() {
    document.querySelectorAll("#bd-doc .ra-ok, #bd-doc .ra-bad, #bd-doc .ra-miss, #bd-doc .ra-cur").forEach(function (x) { x.classList.remove("ra-ok", "ra-bad", "ra-miss", "ra-cur"); });
  }

  /* ---- căn từ người đọc vào bài ---- */
  function align(S) {
    var i = 0;
    while (i < S.length && p < T.length) {
      var s = S[i], found = -1, j;
      if (same(T[p].w, s)) { mark(p, "ok"); p++; i++; continue; }
      for (j = p + 1; j <= Math.min(p + 3, T.length - 1); j++) if (same(T[j].w, s)) { found = j; break; }   /* người đọc nhảy cóc: bỏ sót từ p..j-1 */
      if (found >= 0) { for (j = p; j < found; j++) mark(j, "miss"); mark(found, "ok"); p = found + 1; i++; continue; }
      if (i + 1 < S.length && same(T[p].w, S[i + 1])) { i++; continue; }   /* từ thừa (ờ, à…) rồi đọc đúng từ p */
      mark(p, "bad"); p++; i++;   /* nhận nhầm / đọc sai từ p */
    }
  }
  function counts() {
    var ok = 0, bad = 0, miss = 0; T.forEach(function (t) { if (t.st === "ok") ok++; else if (t.st === "bad") bad++; else if (t.st === "miss") miss++; });
    return { ok: ok, bad: bad, miss: miss, done: ok + bad + miss };
  }

  /* ---- nhận giọng ---- */
  function onResult(e) {
    var fin = [];
    for (var i = spokenDone; i < e.results.length; i++) { if (e.results[i].isFinal) { fin.push((e.results[i][0] && e.results[i][0].transcript) || ""); spokenDone = i + 1; } }
    if (!fin.length) { hudPaint(); return; }
    var S = fin.join(" ").split(/\s+/).filter(function (x) { return norm(x); });
    align(S); cursor(); hudPaint();
    if (p >= T.length) stop();   /* đọc hết bài */
  }
  function startRec() {
    var r = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-US"; r.maxAlternatives = 1;
    spokenDone = 0;
    r.onresult = onResult;
    r.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) { stopHard("Chưa cho dùng micro. Bấm ổ khoá cạnh thanh địa chỉ để cho phép rồi bấm 🎤 Đọc theo lại."); } };
    r.onend = function () { if (running) { try { spokenDone = 0; r.start(); } catch (er) { setTimeout(function () { if (running) { try { r.start(); } catch (e2) {} } }, 300); } } };
    rec = r; try { r.start(); } catch (e) { stopHard("Không mở được nhận giọng. Thử lại nhé."); }
  }

  /* ---- giao diện ---- */
  function stage() { return $("#bd-stage") || document.body; }
  function hudPaint() {
    if (!hud) return; var c = counts();
    hud.innerHTML = '<b>🎤 Đang nghe bạn đọc…</b><span>Đã đọc ' + c.done + "/" + T.length + ' từ · <i class="ok">✓ ' + c.ok + '</i> · <i class="bad">✗ ' + (c.bad + c.miss) + '</i></span><button type="button" data-raend>Xong</button>';
  }
  function btnPaint() { document.querySelectorAll("[data-ra]").forEach(function (b) { b.classList.toggle("on", running); b.innerHTML = running ? '⏹ <span>Dừng đọc</span>' : '🎤 <span>Đọc theo</span>'; }); }
  function showHud() { if (hud) hud.remove(); hud = document.createElement("div"); hud.className = "ra-hud"; stage().appendChild(hud); hud.addEventListener("click", function (e) { if (e.target.closest("[data-raend]")) stop(); }); hudPaint(); }
  function say(w) { try { var s = window.speechSynthesis; if (!s) return; s.cancel(); var u = new SpeechSynthesisUtterance(w); u.lang = "en-US"; u.rate = 0.85; s.speak(u); } catch (e) {} }
  function showCard() {
    if (card) card.remove();
    var c = counts(), pct = c.done ? Math.round(100 * c.ok / c.done) : 0;
    var msg = !c.done ? "Chưa nghe thấy bạn đọc. Kiểm tra micro rồi thử lại nhé." : pct >= 90 ? "Tuyệt vời! 🎉" : pct >= 75 ? "Khá tốt, cố thêm chút nữa 💪" : pct >= 50 ? "Đang tiến bộ, đọc chậm và rõ từng từ nhé 🐢" : "Luyện thêm nhé — nghe mẫu rồi đọc lại 🎧";
    var seen = {}, bad = []; T.forEach(function (t) { if ((t.st === "bad" || t.st === "miss") && !seen[t.n]) { seen[t.n] = 1; bad.push(t); } });
    card = document.createElement("div"); card.className = "ra-card";
    card.innerHTML = '<div class="ra-top"><b>Kết quả đọc theo</b><button type="button" data-raclose aria-label="Đóng">✕</button></div>' +
      '<div class="ra-score"><span class="ra-n">' + pct + '</span><span class="ra-u">/100</span></div><div class="ra-msg">' + esc(msg) + "</div>" +
      '<div class="ra-sum">Đọc tới ' + c.done + "/" + T.length + ' từ · <i class="ok">✓ ' + c.ok + ' đúng</i> · <i class="bad">✗ ' + c.bad + ' sai</i> · <i class="miss">… ' + c.miss + " bỏ sót</i></div>" +
      (bad.length ? '<div class="ra-h">Từ cần luyện (bấm để nghe):</div><div class="ra-chips">' + bad.slice(0, 14).map(function (t) { return '<button type="button" class="ra-chip ' + t.st + '" data-raw="' + esc(t.w.replace(/[^A-Za-z’'-]/g, "")) + '">🔊 ' + esc(t.w.replace(/[^A-Za-z’'-]/g, "")) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="ra-act"><button type="button" data-raagain>🎤 Đọc lại</button></div>';
    stage().appendChild(card);
    card.addEventListener("click", function (e) {
      var w = e.target.closest("[data-raw]"); if (w) { say(w.dataset.raw); return; }
      if (e.target.closest("[data-raclose]")) { closeCard(); return; }
      if (e.target.closest("[data-raagain]")) { closeCard(); start(); }
    });
  }
  function closeCard() { if (card) { card.remove(); card = null; } clearAll(); }

  /* ---- bắt đầu / kết thúc ---- */
  function stopHard(msg) { running = false; clearTimeout(stopTimer); if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } if (hud) { hud.remove(); hud = null; } btnPaint(); if (window.CC && CC.hold) CC.hold(false); if (msg) alert(msg); }
  function stop() {
    if (!running) return; stopHard(); showCard();
  }
  function start() {
    if (!SR) { alert("Trình duyệt này chưa hỗ trợ nhận giọng đọc. Dùng Chrome hoặc Edge (iPhone Safari có thể không chạy)."); return; }
    closeCard(); clearAll(); T = collect();
    if (!T.length) { alert("Hãy mở một BÀI ĐỌC lên bảng trước, rồi bấm 🎤 Đọc theo."); return; }
    p = startIndex();
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}   /* đang nghe giọng đọc mẫu thì tắt, kẻo mic thu cả giọng máy */
    if (window.CC && CC.hold) CC.hold(true);   /* phụ đề CC cũng dùng nhận giọng: tạm dừng để khỏi tranh nhau */
    running = true; startedAt = Date.now(); btnPaint(); showHud(); cursor(); startRec();
  }
  window.ReadAlong = { toggle: function () { if (running) stop(); else start(); }, isRunning: function () { return running; }, _align: function (words, texts) { T = texts.map(function (w) { return { w: w, n: norm(w), el: document.createElement("span"), st: "" }; }); p = 0; align(words); return { p: p, st: T.map(function (t) { return t.st; }) }; } };
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-ra]"); if (b) window.ReadAlong.toggle(); });
})();
