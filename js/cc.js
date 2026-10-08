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
  var hold = false, MAXL = 60, SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var LS_LANG = "tjwl_cc_lang_v1";
  var LANGS = [["en-US", "EN"], ["vi-VN", "VI"], ["zh-CN", "ZH"], ["es-ES", "ES"]];   /* ngôn ngữ MÌNH nói (để trình duyệt nhận giọng đúng) — nói tiếng Việt mà để EN thì chữ ra lung tung */
  var openKey = "", trans = {}, TRANS_MAX = 80;
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function bar() {
    var b = document.getElementById("cb-bar");
    if (!b) { b = document.createElement("div"); b.id = "cb-bar"; b.className = "cb-bar"; b.hidden = true; b.innerHTML = '<form id="cb-form" class="cb-form" autocomplete="off"><input id="cb-in" name="chat-message" type="text" maxlength="200" placeholder="Nhập tin nhắn…" enterkeyhint="send" autocomplete="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-form-type="other"></form>'; document.body.appendChild(b); }
    return b;
  }
  function me() { return api && api.me ? api.me() : null; }
  function send(p) { var ch = api && api.ch && api.ch(); if (!ch) return; ch.send({ type: "broadcast", event: "cc", payload: p }); }
  function lang() { try { var v = localStorage.getItem(LS_LANG); return LANGS.some(function (x) { return x[0] === v; }) ? v : "en-US"; } catch (e) { return "en-US"; } }
  function langTag(l) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === l) return LANGS[i][1]; return "EN"; }
  function guessLang(x, hint) {   /* dòng chữ nói bằng tiếng gì: ưu tiên mã người nói gửi kèm, không có thì đoán (có dấu tiếng Việt / chữ Hán) */
    if (hint) return hint;
    if (/[\u3400-\u9fff]/.test(x)) return "zh-CN";
    if (/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(x)) return "vi-VN";
    return "en-US";
  }

  function build() {
    if (built) return; built = true;
    var b = document.createElement("button"); b.type = "button"; b.id = "cc-btn"; b.className = "cc-btn"; b.hidden = true; b.title = "Phụ đề (CC): bấm để đổi cỡ"; b.innerHTML = '<svg class="cb-ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2.6" y="5.6" width="18.8" height="12.8" rx="3.2" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="15.2" text-anchor="middle" font-size="8.6" font-weight="900" font-family="Arial,Helvetica,sans-serif" fill="currentColor">CC</text></svg>';
    bar().appendChild(b);
    var p = document.createElement("div"); p.id = "cc-panel"; p.className = "cc-panel"; p.hidden = true; p.setAttribute("data-size", "0");
    p.innerHTML = '<div class="cc-head"><b>CC · Phụ đề</b><span class="cc-me" id="cc-me"></span><button type="button" id="cc-lang" class="cc-lang" title="Ngôn ngữ BẠN nói (để tạo phụ đề đúng)"></button><button type="button" id="cc-grow" class="cc-x" title="Đổi cỡ" aria-label="Đổi cỡ phụ đề">⤢</button><button type="button" id="cc-close" class="cc-x" title="Tắt phụ đề" aria-label="Tắt phụ đề">✕</button></div><div class="cc-list" id="cc-list"></div>';
    document.body.appendChild(p);
    b.addEventListener("click", function () { setSize((size + 1) % 4); });
    $("#cc-lang").addEventListener("click", function () {
      var i = 0; for (var k = 0; k < LANGS.length; k++) if (LANGS[k][0] === lang()) i = k;
      var nx = LANGS[(i + 1) % LANGS.length][0]; try { localStorage.setItem(LS_LANG, nx); } catch (e) {}
      if (rec) { stopRec(); }   /* đang nhận giọng: dừng, 1 giây sau tick tự mở lại bằng ngôn ngữ mới */
      paintLang();
    });
    $("#cc-list").addEventListener("click", onLineClick);
    $("#cc-grow").addEventListener("click", function () { setSize(size >= 3 ? 1 : size + 1); });
    $("#cc-close").addEventListener("click", function () { setSize(0); });
    setInterval(tick, 1000); paintLang();
  }
  function setSize(n) {
    size = n; var p = $("#cc-panel"), b = $("#cc-btn"); if (!p) return;
    p.hidden = size === 0; p.setAttribute("data-size", String(size)); if (b) { b.classList.toggle("on", size > 0); b.setAttribute("data-size", String(size)); }
    document.body.setAttribute("data-cc-size", String(size));   /* TJ 2026-10-09: panel CC đè lên Bảng (fixed) -> chừa chỗ cho #bd-big khi cỡ 1/2, xem game.css body[data-cc-size] */
    document.documentElement.style.setProperty("--bd-extra", size === 1 ? "104px" : size === 2 ? "min(38vh,340px)" : "0px");   /* bảng nhỏ (không bd-big): co #bd-stage lại để chữ/nút cuối bảng không chui xuống dưới panel CC */
    paint();
    var l = $("#cc-list"); if (l) { l.scrollTop = l.scrollHeight; setTimeout(function () { l.scrollTop = l.scrollHeight; }, 60); }   /* mở / đổi cỡ: luôn thấy dòng mới nhất ở cuối */
  }
  /* mỗi người 1 màu cố định theo TÊN (máy nào cũng thấy cùng màu); 10 tông pastel cùng độ sáng/độ đậm nên hài hoà trên nền tối */
  var NAME_COLORS = ["#ff9e8f", "#ffc46b", "#d3e472", "#7be3a8", "#62dcd0", "#6fcbf2", "#8fb4ff", "#b6a2ff", "#e29bff", "#ff9bc6"];
  function nameColor(n) { var h = 0, t = String(n || "?"); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return NAME_COLORS[h % NAME_COLORS.length]; }
  function paintLang() { var b = $("#cc-lang"); if (b) b.textContent = "🎙 " + langTag(lang()); }
  /* ---- bấm 1 dòng phụ đề: hiện NGHĨA + nút 🔊 nghe lại ---- */
  function speak(text, l) {
    try {
      var s = window.speechSynthesis; if (!s) return; s.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = l || "en-US"; u.rate = 0.9; s.speak(u);
    } catch (e) {}
  }
  async function translate(text, from) {
    var k = from + "|" + text; if (trans[k]) return trans[k];
    var cfg = window.APP_CONFIG || {}; if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) throw new Error("no cloud");
    var to = from === "vi-VN" ? "English" : "tiếng Việt";
    var sys = "Bạn là phiên dịch cho người Việt học tiếng Anh. Chỉ trả đúng 1 object JSON, không markdown, không chữ thừa.";
    var user = "Dịch câu sau sang " + to + " (tự nhiên, sát nghĩa lời nói):\n\"" + text + "\"\n\nSchema: {\"t\":\"bản dịch\"}";
    var res = await fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/gemini-proxy", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY, "apikey": cfg.SUPABASE_ANON_KEY }, body: JSON.stringify({ model: cfg.GEMINI_MODEL || "gemini-3.5-flash-lite", sys: sys, user: user, user_id: null, block_id: null }) });
    if (!res.ok) throw new Error("http " + res.status);
    var d = await res.json(), raw = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts && d.candidates[0].content.parts[0] && d.candidates[0].content.parts[0].text;
    var m = raw && raw.match(/\{[\s\S]*\}/); var j = m ? JSON.parse(m[0]) : null;
    if (!j || !j.t) throw new Error("empty");
    if (Object.keys(trans).length > TRANS_MAX) trans = {};
    return (trans[k] = String(j.t).slice(0, 400));
  }
  function onLineClick(e) {
    var sp = e.target.closest && e.target.closest("[data-say]");
    if (sp) { var ln = sp.closest(".cc-l"); speak(ln.dataset.x, ln.dataset.l); return; }
    var ln2 = e.target.closest && e.target.closest(".cc-l[data-k]"); if (!ln2) return;
    openKey = openKey === ln2.dataset.k ? "" : ln2.dataset.k; paint();
    if (openKey) { var l = ln2.dataset.l, x = ln2.dataset.x; translate(x, l).then(function () { paint(); }, function () { trans["!" + l + "|" + x] = "err"; paint(); }); }
  }
  function paint() {
    var l = $("#cc-list"); if (!l || size === 0) return;
    var atEnd = l.scrollHeight - l.scrollTop - l.clientHeight < 40, mm = me();
    var items = lines.slice(-MAXL).map(function (m, ix) { return { n: m.n, x: m.x, f: 1, mine: mm && m.id === mm.id, id: m.id, l: m.l, k: m.id + "#" + m.ts }; });
    Object.keys(interim).forEach(function (k) { var it = interim[k]; items.push({ n: it.n, x: it.x, f: 0, mine: mm && k === mm.id, id: k }); });
    l.innerHTML = items.length ? items.map(function (m) {
      if (!m.f) return '<div class="cc-l cc-i' + (m.mine ? " me" : "") + '"><b class="cc-n" style="color:' + nameColor(m.n) + '">' + esc(m.n || "?") + "</b> " + esc(m.x) + "</div>";
      var lg = guessLang(m.x, m.l), open = openKey === m.k, tr = trans[(lg) + "|" + m.x], bad = trans["!" + lg + "|" + m.x];
      return '<div class="cc-l cc-f' + (m.mine ? " me" : "") + (open ? " open" : "") + '" data-k="' + esc(m.k) + '" data-l="' + esc(lg) + '" data-x="' + esc(m.x) + '"><b class="cc-n" style="color:' + nameColor(m.n) + '">' + esc(m.n || "?") + "</b> " + esc(m.x) +
        (open ? '<div class="cc-d"><button type="button" class="cc-say" data-say="1" title="Nghe lại">🔊</button><span class="cc-tr">' + (tr ? esc(tr) : bad ? "Chưa dịch được lúc này" : "Đang dịch…") + "</span></div>" : "") + "</div>";
    }).join("") : '<div class="cc-empty">Chưa có ai nói. Khi có người bật 🎤 và nói, phụ đề sẽ hiện ở đây. Bấm vào 1 dòng để xem nghĩa và nghe lại.</div>';
    var note = $("#cc-me"); if (note) note.textContent = noSupport && window.Voice && Voice.isOn() ? "⚠ Máy bạn không tạo được phụ đề từ giọng của bạn" : "";
    if (atEnd) l.scrollTop = l.scrollHeight;
  }

  /* ---------- người NÓI: nhận giọng -> chữ ---------- */
  function wantRec() { return !!(!hold && SR && window.Voice && Voice.isOn() && !(Voice.isLocked && Voice.isLocked())); }
  var interTimer = 0;
  function chunks(t, max) { var out = []; while (t.length > max) { var k = t.lastIndexOf(" ", max); if (k < max / 2) k = max; out.push(t.slice(0, k).trim()); t = t.slice(k).trim(); } if (t) out.push(t); return out; }
  function startRec() {
    if (rec || !SR) return;
    var r; try { r = new SR(); } catch (e) { noSupport = true; return; }
    r.continuous = true; r.interimResults = true; r.lang = lang(); r.maxAlternatives = 1;
    r.onresult = function (e) {
      var inter = "", fin = "";
      for (var i = e.resultIndex; i < e.results.length; i++) { var t = e.results[i][0] ? e.results[i][0].transcript : ""; if (e.results[i].isFinal) fin += t; else inter += t; }
      var mm = me(); if (!mm) return;
      if (fin.trim()) { clearTimeout(interTimer); chunks(fin.trim(), 280).forEach(function (c) { send({ id: mm.id, n: mm.name || "", x: c, f: 1, l: lang() }); }); }   /* câu dài: chia nhiều dòng, KHÔNG cắt cụt */
      else if (inter.trim()) {
        var it = inter.trim(); if (it.length > 240) { it = it.slice(-240); var sp = it.indexOf(" "); if (sp > -1 && sp < 40) it = it.slice(sp + 1); }   /* dòng tạm: chỉ gửi ĐUÔI mới nhất (trước đây cắt 300 ký tự đầu nên nói dài thì chữ đứng yên) */
        var go = function () { lastSend = Date.now(); send({ id: mm.id, n: mm.name || "", x: it, f: 0, l: lang() }); };
        clearTimeout(interTimer);
        if (Date.now() - lastSend > 250) go(); else interTimer = setTimeout(go, 250);   /* bị giãn nhịp thì vẫn gửi bản mới nhất sau 250ms, không bỏ rơi chữ cuối */
      }
    };
    r.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "language-not-supported")) { noSupport = true; recWant = false; } };
    r.onend = function () { rec = null; if (recWant && wantRec()) setTimeout(startRec, 250); };   /* Chrome tự dừng sau lúc im lặng -> mở lại khi mic còn bật */
    rec = r; try { r.start(); } catch (e) { rec = null; }
  }
  function stopRec() { clearTimeout(interTimer); recWant = false; if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } }
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
      var x = p.x.slice(0, 400), n = String(p.n || "").slice(0, 40);
      if (p.f) { delete interim[p.id]; lines.push({ id: String(p.id), n: n, x: x, l: p.l ? String(p.l).slice(0, 8) : "", ts: Date.now() + "" + lines.length }); if (lines.length > MAXL) lines = lines.slice(-MAXL); }
      else interim[p.id] = { n: n, x: x, at: Date.now() };
      if (size > 0) paint();
    },
    hold: function (v) { hold = !!v; if (hold) stopRec(); },   /* nhường nhận giọng cho tính năng 🎤 Đọc theo (js/readalong.js) */
    setSize: setSize, size: function () { return size; },
    reset: function () { stopRec(); lines = []; interim = {}; setSize(0); var b = $("#cc-btn"); if (b) b.hidden = true; noSupport = false; }
  };
})();
