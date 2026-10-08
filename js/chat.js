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
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function st() { return api && api.st ? api.st() : null; }
  function me() { return api && api.me ? api.me() : null; }
  function host() { return !!(api && api.isHost && api.isHost()); }
  function off() { var s = st(); return !!(s && s.chatOff); }
  function muted(id) { var s = st(); return !!(s && s.chatMute && s.chatMute.indexOf(id) >= 0); }
  function send(p) { var ch = api && api.ch && api.ch(); if (!ch) return; ch.send({ type: "broadcast", event: "chat", payload: p }); }

  function build() {
    if (built) return; built = true;
    var b = document.createElement("button"); b.type = "button"; b.id = "ch-btn"; b.className = "ch-btn"; b.hidden = true; b.title = "Chat phòng"; b.innerHTML = '💬<i id="ch-badge" hidden>0</i>';
    var top = document.querySelector(".g-top"), meb = $("#g-me");
    if (top) top.insertBefore(b, meb || null); else document.body.appendChild(b);
    var p = document.createElement("div"); p.id = "ch-panel"; p.className = "ch-panel"; p.hidden = true;
    p.innerHTML = '<div class="ch-head"><b>💬 Chat phòng</b><span class="ch-note">chỉ lưu tạm, đóng phòng là mất</span><button type="button" id="ch-menu" class="ch-x" hidden title="Cài đặt chat (host)">⋯</button><button type="button" id="ch-close" class="ch-x" title="Đóng">✕</button></div>' +
      '<div class="ch-hostmenu" id="ch-hostmenu" hidden><button type="button" id="ch-off"></button><button type="button" id="ch-clear">🗑 Xoá hết tin nhắn</button><div class="ch-hint">Bấm vào tên 1 người trong khung chat để tắt / bật chat của họ.</div></div>' +
      '<div class="ch-list" id="ch-list"></div>' +
      '<form class="ch-form" id="ch-form" autocomplete="off"><input id="ch-in" maxlength="' + MAXLEN + '" placeholder="Nhập tin nhắn…" enterkeyhint="send"><button type="submit" id="ch-send">Gửi</button></form>';
    document.body.appendChild(p);
    b.addEventListener("click", function () { toggle(!isOpen); });
    $("#ch-close").addEventListener("click", function () { toggle(false); });
    $("#ch-menu").addEventListener("click", function () { var m = $("#ch-hostmenu"); m.hidden = !m.hidden; });
    $("#ch-off").addEventListener("click", function () { if (api.setChat) api.setChat({ off: !off() }); setTimeout(paint, 300); });
    $("#ch-clear").addEventListener("click", function () { if (!host()) return; send({ t: "clear" }); $("#ch-hostmenu").hidden = true; });
    $("#ch-form").addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    $("#ch-list").addEventListener("click", function (e) {   /* host bấm tên = tắt / bật chat của người đó */
      var n = e.target.closest && e.target.closest("[data-chid]"); if (!n || !host() || !api.setChat) return;
      var id = n.dataset.chid, mm = me(); if (mm && id === mm.id) return;
      if (confirm((muted(id) ? "Bật lại chat cho " : "Tắt chat của ") + (n.textContent || "người này") + "?")) { api.setChat({ mute: id }); setTimeout(paint, 300); }
    });
  }
  function toggle(v) {
    isOpen = !!v; var p = $("#ch-panel"); if (!p) return; p.hidden = !isOpen;
    if (isOpen) { unread = 0; paint(); var i = $("#ch-in"); if (i && !i.disabled) try { i.focus(); } catch (e) {} scrollEnd(); }
    badge();
  }
  function badge() { var bd = $("#ch-badge"); if (!bd) return; bd.hidden = !(unread > 0 && !isOpen); bd.textContent = unread > 9 ? "9+" : String(unread); }
  function scrollEnd() { var l = $("#ch-list"); if (l) l.scrollTop = l.scrollHeight; }
  function avatarHtml(a) { a = String(a || ""); return /^https?:/.test(a) ? '<img alt="" src="' + esc(a) + '">' : esc(a || "👤"); }
  function paint() {
    if (!built) return;
    var l = $("#ch-list"), mm = me(), h = host();
    if (!l) return;
    l.innerHTML = log.length ? log.map(function (m) {
      var mine = mm && m.id === mm.id;
      return '<div class="ch-m' + (mine ? " me" : "") + '"><span class="ch-av">' + avatarHtml(m.a) + '</span><div class="ch-b"><span class="ch-n' + (h && !mine ? " ch-clk" : "") + (muted(m.id) ? " ch-muted" : "") + '" data-chid="' + esc(m.id) + '">' + esc(m.n || "?") + '</span><span class="ch-t">' + esc(m.x) + "</span></div></div>";
    }).join("") : '<div class="ch-empty">Chưa có tin nhắn nào. Nói xin chào nhé 👋</div>';
    var inp = $("#ch-in"), sd = $("#ch-send"), blocked = (off() && !h) || (mm && muted(mm.id) && !h);
    if (inp) { inp.disabled = !!blocked; inp.placeholder = off() && !h ? "Host đã tắt chat" : (mm && muted(mm.id) && !h ? "Bạn đang bị tắt chat" : "Nhập tin nhắn…"); }
    if (sd) sd.disabled = !!blocked;
    var mn = $("#ch-menu"); if (mn) mn.hidden = !h;
    var of = $("#ch-off"); if (of) of.textContent = off() ? "✅ Bật lại chat cả phòng" : "🚫 Tắt chat cả phòng";
    scrollEnd();
  }
  function add(m) {
    log.push(m); if (log.length > MAXLOG) log = log.slice(-MAXLOG);
    var mm = me(), mine = mm && m.id === mm.id;
    if (!isOpen && !mine) { unread++; badge(); }
    paint();
  }
  function submit() {
    var inp = $("#ch-in"), mm = me(); if (!inp || !mm) return;
    var x = String(inp.value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAXLEN); if (!x) return;
    if (!host() && (off() || muted(mm.id))) return;
    if (Date.now() - lastSend < GAP) { inp.classList.add("ch-wait"); setTimeout(function () { inp.classList.remove("ch-wait"); }, 400); return; }   /* chậm lại chút (2 giây / tin) */
    lastSend = Date.now(); inp.value = "";
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
      } else if (p.t === "clear") { log = []; unread = 0; badge(); paint(); }
      else if (p.t === "req") { if (host() && log.length && Date.now() - lastSync > 3000) { lastSync = Date.now(); send({ t: "sync", log: log.slice(-MAXLOG) }); } }
      else if (p.t === "sync") {
        if (log.length || !Array.isArray(p.log)) return;   /* chỉ máy chưa có gì mới nhận bản của host */
        log = p.log.slice(-MAXLOG).filter(function (m) { return m && typeof m.x === "string" && m.id; }).map(function (m) { return { id: String(m.id), n: String(m.n || "").slice(0, 40), a: String(m.a || "").slice(0, 300), x: m.x.slice(0, MAXLEN), ts: +m.ts || 0 }; });
        paint();
      }
    },
    onState: function (s) {
      if (!api || !s) return;
      build(); var b = $("#ch-btn"); if (b) b.hidden = false;
      if (!asked) { asked = true; setTimeout(function () { send({ t: "req" }); }, 1200); }   /* vào sau: xin host gửi lại 30 tin gần nhất */
      var sg = (s.chatOff ? 1 : 0) + "|" + (s.chatMute || []).join(",") + "|" + (host() ? 1 : 0); if (sg !== sig) { sig = sg; paint(); }   /* chỉ vẽ lại khi cài đặt chat / vai trò đổi (không giật khung đang cuộn) */
    },
    reset: function () { log = []; unread = 0; asked = false; var b = $("#ch-btn"); if (b) b.hidden = true; toggle(false); }
  };
})();
