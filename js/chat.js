/* chat.js — 💬 Chat trong phòng game (TJ 2026-10-08).
   Quyết định (xem CLAUDE.md "Chat phòng"): chỉ lưu TẠM theo phiên, KHÔNG ghi vào Supabase (bảng đang mở cho ai có khoá công khai -> chat lưu lâu sẽ ai cũng đọc được).
   · Tin đi qua kênh phòng sẵn có (broadcast event "chat", self:true -> chính mình cũng nhận lại). Mỗi máy giữ 30 tin gần nhất trong bộ nhớ.
   · Máy vào sau / tải lại: gửi {t:"req"} -> host trả {t:"sync", log:[…]}.
   · Host: tắt/bật chat cả phòng (st.chatOff), tắt tiếng 1 người (st.chatMute = [id…]), xoá hết ({t:"clear"}). Hai trường này nằm trong trạng thái phòng nên người vào sau cũng nhận.
   · Chỉ chữ (textContent, không link tự động, không ảnh), tối đa 200 ký tự, 2 giây/tin. Nguyên văn — chưa dịch.
   Game gọi: Chat.attach(api) · Chat.onMsg(payload) · Chat.onState(st) · Chat.reset(). */
(function () {
  "use strict";
  if (/[?&]usersonly=1/.test(location.search)) return;   /* pop-up Quản lý người chơi: không cần chat */
  var api = null, sig = "", log = [], unread = 0, isOpen = false, lastSend = 0, asked = false, lastSync = 0, built = false;
  var MAXLOG = 30, MAXLEN = 200, GAP = 2000;
  var QUICK = ["❓ Chưa hiểu", "✅ Hiểu rồi", "⏳ Chờ mình chút", "🔁 Đọc lại giúp mình", "👏", "😂"];   /* trả lời nhanh 1 chạm — tiện cho lớp học, khỏi gõ chữ */
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* nhớ 30 tin gần nhất trong localStorage của CHÍNH máy này, 24 giờ, theo mã phòng — tải lại / lỡ tắt tab vẫn còn chat. KHÔNG gửi lên Supabase (TJ chốt: không tốn dung lượng). */
  var TTL = 24 * 3600 * 1000, loadedFor = "";
  function skey() { var c = api && api.room && api.room(); return c ? "tjwl_chat_v1_" + c : ""; }
  function save() { var k = skey(); if (!k) return; try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), log: log.slice(-MAXLOG) })); } catch (e) {} }
  function clean(m) { return { id: String(m.id), n: String(m.n || "").slice(0, 40), a: String(m.a || "").slice(0, 300), x: String(m.x || "").slice(0, MAXLEN), ts: +m.ts || 0 }; }
  function mergeIn(arr) {   /* gộp tin (đã nhớ trên máy / host gửi lại), bỏ trùng, theo giờ, tối đa 30, bỏ tin quá 24 giờ */
    var seen = {}, out = [], now = Date.now();
    log.concat(arr || []).forEach(function (m) { if (!m || typeof m.x !== "string" || !m.id) return; var ts = +m.ts || 0; if (ts && now - ts > TTL) return; var key = m.id + "|" + ts + "|" + m.x; if (seen[key]) return; seen[key] = 1; out.push(m); });
    out.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); }); log = out.slice(-MAXLOG);
  }
  function loadSaved() {
    var k = skey(); if (!k || loadedFor === k) return; loadedFor = k;
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && Array.isArray(v.log) && Date.now() - (v.at || 0) < TTL) { mergeIn(v.log.map(clean)); paint(); } else if (v) localStorage.removeItem(k); } catch (e) {}
  }
  function st() { return api && api.st ? api.st() : null; }
  function me() { return api && api.me ? api.me() : null; }
  function host() { return !!(api && api.isHost && api.isHost()); }
  function off() { var s = st(); return !!(s && s.chatOff); }
  function muted(id) { var s = st(); return !!(s && s.chatMute && s.chatMute.indexOf(id) >= 0); }
  function send(p) { var ch = api && api.ch && api.ch(); if (!ch) return; ch.send({ type: "broadcast", event: "chat", payload: p }); }

  function build() {
    if (built) return; built = true;
    var b = document.createElement("button"); b.type = "button"; b.id = "ch-btn"; b.className = "ch-btn"; b.hidden = true; b.title = "Chat phòng"; b.innerHTML = '💬<i id="ch-badge" hidden>0</i>';
    document.body.appendChild(b);   /* kiểu Clubhouse: nút tròn nhỏ nổi ở góc dưới phải, có chấm báo tin mới + bong bóng xem trước tin mới nhất */
    var pv = document.createElement("div"); pv.id = "ch-peek"; pv.className = "ch-peek"; pv.hidden = true; document.body.appendChild(pv);
    pv.addEventListener("click", function () { toggle(true); });
    var p = document.createElement("div"); p.id = "ch-panel"; p.className = "ch-panel"; p.hidden = true;
    p.innerHTML = '<div class="ch-grab" id="ch-grab" aria-hidden="true"><i></i></div><div class="ch-head" id="ch-headbar"><button type="button" id="ch-close" class="ch-x ch-down" title="Hạ xuống" aria-label="Hạ khung chat xuống"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button><b>Chat phòng</b><span class="ch-note">chỉ lưu tạm</span><button type="button" id="ch-menu" class="ch-x" hidden title="Cài đặt chat (host)">⋯</button></div>' +
      '<div class="ch-hostmenu" id="ch-hostmenu" hidden><button type="button" id="ch-off"></button><button type="button" id="ch-clear">🗑 Xoá hết tin nhắn</button><div class="ch-hint">Bấm vào tên 1 người trong khung chat để tắt / bật chat của họ.</div></div>' +
      '<div class="ch-list" id="ch-list"></div>' +
      '<div class="ch-quick" id="ch-quick">' + QUICK.map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + "</button>"; }).join("") + "</div>" +
      '<form class="ch-form" id="ch-form" autocomplete="off"><input id="ch-in" name="chat-message" type="text" maxlength="' + MAXLEN + '" placeholder="Nhập tin nhắn…" enterkeyhint="send" autocomplete="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-form-type="other"><button type="submit" id="ch-send">Gửi</button></form>';
    document.body.appendChild(p);
    var bk = document.createElement("div"); bk.id = "ch-back"; bk.className = "ch-back"; bk.hidden = true; document.body.appendChild(bk);   /* điện thoại: chạm vùng mờ phía trên để hạ chat xuống */
    bk.addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) toggle(false); });
    /* vuốt xuống ở thanh tay nắm / tiêu đề để hạ chat xuống (như Clubhouse) */
    var drag = null;
    function dEnd(e) {
      if (!drag) return; var dy = Math.max(0, (e.clientY != null ? e.clientY : drag.y) - drag.y), fast = (Date.now() - drag.t) < 300 && dy > 40;
      p.style.transition = ""; p.style.transform = ""; drag = null;
      if (dy > 90 || fast) toggle(false);
    }
    ["ch-grab", "ch-headbar"].forEach(function (id) {
      var el = $("#" + id);
      el.addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; drag = { y: e.clientY, t: Date.now() }; try { el.setPointerCapture(e.pointerId); } catch (er) {} p.style.transition = "none"; });
      el.addEventListener("pointermove", function (e) { if (!drag) return; var dy = Math.max(0, e.clientY - drag.y); p.style.transform = "translateY(" + dy + "px)"; });
      el.addEventListener("pointerup", dEnd); el.addEventListener("pointercancel", dEnd);
    });
    b.addEventListener("click", function () { toggle(!isOpen); });
    $("#ch-close").addEventListener("click", function () { toggle(false); });
    $("#ch-menu").addEventListener("click", function () { var m = $("#ch-hostmenu"); m.hidden = !m.hidden; });
    $("#ch-off").addEventListener("click", function () { if (api.setChat) api.setChat({ off: !off() }); setTimeout(paint, 300); });
    $("#ch-clear").addEventListener("click", function () { if (!host()) return; send({ t: "clear" }); $("#ch-hostmenu").hidden = true; });
    $("#ch-quick").addEventListener("click", function (e) { var q = e.target.closest && e.target.closest("[data-q]"); if (q) submit(q.dataset.q); });
    $("#ch-form").addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    $("#ch-list").addEventListener("click", function (e) {   /* host bấm tên = tắt / bật chat của người đó */
      var n = e.target.closest && e.target.closest("[data-chid]"); if (!n || !host() || !api.setChat) return;
      var id = n.dataset.chid, mm = me(); if (mm && id === mm.id) return;
      if (confirm((muted(id) ? "Bật lại chat cho " : "Tắt chat của ") + (n.textContent || "người này") + "?")) { api.setChat({ mute: id }); setTimeout(paint, 300); }
    });
  }
  function place() {   /* nút NỔI (không chèn vào bố cục). Màn thường: góc dưới phải. Màn Bảng: nằm vào KHOẢNG TRỐNG giữa hàng avatar và cụm công cụ (A− Aa A+) ở hàng dưới bảng -> không đè chữ nào */
    var b = $("#ch-btn"); if (!b) return;
    var ib = $("#bd-iconbar"), dn = $("#bd-docnav"), pe = $("#bd-people"), pk = $("#ch-peek"), pn = $("#ch-panel");
    var key = "r78", L = "", bot = 78;
    if (document.body.classList.contains("bd-on") && ib && ib.offsetParent !== null) {
      var ir = ib.getBoundingClientRect(), bw = b.offsetWidth || 44, bh = b.offsetHeight || 44;
      var last = pe && pe.offsetParent !== null ? pe.lastElementChild : null, leftEdge = last ? last.getBoundingClientRect().right + 8 : ir.left + 8;
      var dr = dn && dn.parentNode === ib && dn.offsetParent !== null ? dn.getBoundingClientRect() : null, rightEdge = dr ? dr.left - 8 : ir.right - 8;
      bot = Math.round(innerHeight - ir.bottom + Math.max(0, (ir.height - bh) / 2));
      if (!dr) { key = "c" + bot; }   /* không có cụm công cụ: góc dưới phải của hàng */
      else if (rightEdge - leftEdge >= bw + 4) { var lf = Math.round(leftEdge + (rightEdge - leftEdge - bw) / 2); key = "g" + bot + "," + lf; L = lf + "px"; }
      else { bot = Math.round(innerHeight - ir.top + 8); key = "a" + bot; }   /* hết chỗ: nâng lên ngay trên hàng */
    }
    if (b.dataset.key === key) return; b.dataset.key = key;
    b.style.bottom = bot + "px"; b.style.left = L || "auto"; b.style.right = L ? "auto" : "12px";
    if (pk) { pk.style.bottom = (bot + 52) + "px"; pk.style.left = L ? Math.max(8, parseInt(L, 10) - 20) + "px" : "auto"; pk.style.right = L ? "auto" : "66px"; if (!L) pk.style.bottom = (bot + 6) + "px"; }
    if (pn && innerWidth > 520) pn.style.bottom = (bot + 56) + "px";
  }
  setInterval(place, 700);
  /* iPhone: bàn phím mở thì vùng nhìn thấy (visualViewport) co lại nhưng khung chat vẫn cao 88% -> tiêu đề, nút ⌄ và tin nhắn bị đẩy lên khuất. Co khung vừa vùng nhìn thấy, dán ngay trên bàn phím. */
  function fitVV() {
    var p = $("#ch-panel"), vv = window.visualViewport; if (!p) return;
    if (!isOpen || !vv || innerWidth > 520) { p.style.height = ""; if (innerWidth <= 520) p.style.bottom = ""; return; }
    var kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
    p.style.bottom = kb + "px"; p.style.height = Math.round(Math.min(innerHeight * 0.88, vv.height - 8)) + "px";
    scrollEnd();
  }
  if (window.visualViewport) { window.visualViewport.addEventListener("resize", fitVV); window.visualViewport.addEventListener("scroll", fitVV); }
  function toggle(v) {
    isOpen = !!v; var p = $("#ch-panel"); if (!p) return; p.hidden = !isOpen; setTimeout(fitVV, 0); if (isOpen) { p.classList.remove("ch-enter"); void p.offsetWidth; p.classList.add("ch-enter"); }   /* bung lên từ đáy */ var bkd = $("#ch-back"); if (bkd) bkd.hidden = !isOpen; var pk = $("#ch-peek"); if (pk) pk.hidden = true;
    var bt = $("#ch-btn"); if (bt) bt.classList.toggle("on", isOpen);
    if (isOpen) { unread = 0; paint(); var i = $("#ch-in"); if (i && !i.disabled) try { i.focus(); } catch (e) {} scrollEnd(); }
    badge();
  }
  var peekT = 0;
  function peek(m) {   /* bong bóng 4 giây cạnh nút: ai nói gì (chưa mở chat vẫn biết có tin) */
    var pv = $("#ch-peek"); if (!pv) return;
    pv.innerHTML = "<b>" + esc(m.n || "?") + "</b> " + esc(m.x.length > 60 ? m.x.slice(0, 60) + "…" : m.x); pv.hidden = false;
    clearTimeout(peekT); peekT = setTimeout(function () { pv.hidden = true; }, 4000);
  }
  function badge() { var bd = $("#ch-badge"); if (!bd) return; bd.hidden = !(unread > 0 && !isOpen); bd.textContent = unread > 9 ? "9+" : String(unread); }
  function scrollEnd() { var l = $("#ch-list"); if (l) l.scrollTop = l.scrollHeight; }
  function avatarHtml(a) { a = String(a || ""); return /^https?:/.test(a) ? '<img alt="" src="' + esc(a) + '">' : esc(a || "👤"); }
  function hhmm(ts) { var d = new Date(ts || Date.now()); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function paint() {
    if (!built) return;
    var l = $("#ch-list"), mm = me(), h = host(), s = st();
    if (!l) return;
    var atEnd = l.scrollHeight - l.scrollTop - l.clientHeight < 60;   /* đang xem tin cũ thì đừng giật xuống cuối */
    var prev = null;
    l.innerHTML = log.length ? log.map(function (m) {
      var mine = mm && m.id === mm.id, same = prev && prev.id === m.id && (m.ts - prev.ts) < 60000, crown = (s && s.hid === m.id) || (h && mine);   /* host thấy tin của chính mình cũng có 👑 (state của host không có trường hid) */
      prev = m;
      return '<div class="ch-m' + (mine ? " me" : "") + (same ? " same" : "") + '"><span class="ch-av">' + (same ? "" : avatarHtml(m.a)) + '</span><div class="ch-b">' +
        (same ? "" : '<span class="ch-n' + (h && !mine ? " ch-clk" : "") + (muted(m.id) ? " ch-muted" : "") + '" data-chid="' + esc(m.id) + '">' + (crown ? "👑 " : "") + esc(m.n || "?") + "</span>") +
        '<span class="ch-t">' + esc(m.x) + '</span><span class="ch-ts">' + hhmm(m.ts) + "</span></div></div>";
    }).join("") : '<div class="ch-empty"><div class="ch-big">💬</div>Chưa có tin nhắn nào.<br>Nói xin chào cả lớp nhé 👋</div>';
    var inp = $("#ch-in"), sd = $("#ch-send"), blocked = (off() && !h) || (mm && muted(mm.id) && !h);
    if (inp) { inp.disabled = !!blocked; inp.placeholder = off() && !h ? "Host đã tạm tắt chat" : (mm && muted(mm.id) && !h ? "Bạn đang bị tắt chat" : "Nhập tin nhắn…"); }
    if (sd) sd.disabled = !!blocked;
    var qk = $("#ch-quick"); if (qk) qk.hidden = !!blocked;
    var mn = $("#ch-menu"); if (mn) mn.hidden = !h;
    var of = $("#ch-off"); if (of) of.textContent = off() ? "✅ Bật lại chat cả phòng" : "🚫 Tắt chat cả phòng";
    if (atEnd || !isOpen) scrollEnd();
  }
  function add(m) {
    log.push(m); if (log.length > MAXLOG) log = log.slice(-MAXLOG); save();
    var mm = me(), mine = mm && m.id === mm.id;
    if (!isOpen && !mine) { unread++; badge(); peek(m); }
    paint();
  }
  function submit(preset) {
    var inp = $("#ch-in"), mm = me(); if (!inp || !mm) return;
    var x = String(preset != null ? preset : inp.value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAXLEN); if (!x) return;
    if (!host() && (off() || muted(mm.id))) return;
    if (Date.now() - lastSend < GAP) { inp.classList.add("ch-wait"); setTimeout(function () { inp.classList.remove("ch-wait"); }, 400); return; }   /* chậm lại chút (2 giây / tin) */
    lastSend = Date.now(); if (preset == null) inp.value = "";
    send({ t: "m", id: mm.id, n: mm.name || "", a: mm.avatar || "", x: x, ts: Date.now() });
  }

  window.Chat = {
    attach: function (a) { api = a; build(); },
    onMsg: function (p) {
      if (!p || !api) return;
      if (p.t === "m") {
        if (typeof p.x !== "string" || !p.x || !p.id) return;
        if (muted(p.id) && !host()) return;   /* người bị tắt chat: bỏ (host vẫn thấy để biết) */
        if (off() && !host() && p.id !== (st() && st().hid)) return;
        add({ id: String(p.id), n: String(p.n || "").slice(0, 40), a: String(p.a || "").slice(0, 300), x: p.x.slice(0, MAXLEN), ts: +p.ts || Date.now() });
      } else if (p.t === "clear") { log = []; unread = 0; badge(); paint(); var kc = skey(); if (kc) try { localStorage.removeItem(kc); } catch (e) {} }
      else if (p.t === "req") { if (host() && log.length && Date.now() - lastSync > 3000) { lastSync = Date.now(); send({ t: "sync", log: log.slice(-MAXLOG) }); } }
      else if (p.t === "sync") {
        if (!Array.isArray(p.log)) return;   /* gộp với tin đã nhớ trên máy này (bỏ trùng) */
        mergeIn(p.log.slice(-MAXLOG).filter(function (m) { return m && typeof m.x === "string" && m.id; }).map(clean));
        save(); paint();
      }
    },
    onState: function (s) {
      if (!api || !s) return;
      build(); var b = $("#ch-btn"); if (b) b.hidden = false; place(); loadSaved();
      if (!asked) { asked = true; setTimeout(function () { send({ t: "req" }); }, 1200); }   /* vào sau: xin host gửi lại 30 tin gần nhất */
      var sg = (s.chatOff ? 1 : 0) + "|" + (s.chatMute || []).join(",") + "|" + (host() ? 1 : 0); if (sg !== sig) { sig = sg; paint(); }   /* chỉ vẽ lại khi cài đặt chat / vai trò đổi (không giật khung đang cuộn) */
    },
    reset: function () { log = []; unread = 0; asked = false; loadedFor = ""; var b = $("#ch-btn"); if (b) b.hidden = true; toggle(false); }
  };
})();
