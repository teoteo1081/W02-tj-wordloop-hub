/* game.js — 🎮 PHÒNG GAME CHƠI CHUNG (TJ 2026-09-30)
   ---------------------------------------------------------------
   Đặc tả: README.md "Việc còn dang dở" > PHÒNG GAME. Bảng: tools/game_schema.sql.
   - Chỉ admin WordLoop (đăng nhập qua link ?u=, xem auth.js) mở được phòng.
     Người chơi vào bằng link/mã phòng, chỉ cần gõ tên (máy nhớ, trùng tên -> #2, #3…).
   - Đồng bộ bằng Supabase Realtime, kênh "game:<MÃ>":
       · presence  = ai đang ở trong phòng (tên, ảnh, có chơi không)
       · broadcast "state" (host -> mọi người): pha, câu hỏi, điểm, đội, thời gian còn lại
       · broadcast "ans"   (người chơi -> host): câu trả lời
       · broadcast "hello" (người mới vào / màn hình chung -> host): xin gửi lại trạng thái
     HOST LÀ NGUỒN SỰ THẬT DUY NHẤT: chỉ host chấm điểm + đếm giờ. Host tải lại trang giữa
     trận -> khôi phục từ localStorage (tjwl_game_host_<MÃ>), không mất điểm.
   - 2 kiểu: "kahoot" (cả phòng cùng 1 câu) | "free" (mỗi người tự làm câu riêng).
   - Điểm: đúng = 100 + thưởng tốc độ tối đa 50; chuỗi đúng ≥3 thì ×1.5. Sai = 0, mất chuỗi.
   - Đội: host chọn 2-4 đội, chia đều tự động hoặc bấm tên để đổi đội; điểm đội = TỔNG
     (đội lệch số người thì hiện thêm điểm trung bình).
   - 📺 Màn hình chung: ?room=MÃ&view=screen — chỉ xem (không tính là người chơi).
   - Tiến trình học (word_progress) CHỈ ghi cho người chơi đang đăng nhập hồ sơ admin (TJ) —
     attempts/correct/mastered/❌wrong_open, KHÔNG đụng SRS/Done (giống màn Ôn riêng).
   - IM LẶNG: không có âm thanh nào, đúng/sai báo bằng màu.
   --------------------------------------------------------------- */
(function () {
  "use strict";
  var cfg = window.APP_CONFIG || {};
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var LS_ME = "tjwl_game_player_v1";
  var LS_LINK = "tjwl_link_user_id_v1";          /* hồ sơ WordLoop đăng nhập qua link (auth.js) */
  var LS_HOST = "tjwl_game_host_";               /* + MÃ: host lưu trạng thái trận để tải lại trang không mất điểm */
  var AVATARS = ["🐣","🦊","🐼","🐨","🦁","🐯","🐸","🐙","🦉","🐝","🌟","🚀","📚","🎯","🔥","💎","🍀","⚡","🐧","🦄","🐶","🐱","🐰","🐻","🐵","🦋","🌈","🍉","🍩","🎸"];
  var TEAMS = [null, { n: "Đội Đỏ", c: "#d9695f", e: "🔴" }, { n: "Đội Xanh", c: "#5b9bd9", e: "🔵" }, { n: "Đội Lá", c: "#4fae82", e: "🟢" }, { n: "Đội Vàng", c: "#d9a03c", e: "🟡" }];
  var FLAG = { vi: "🇻🇳", en: "🇺🇸", es: "🇪🇸", zh: "🇨🇳" };
  var MASTER_T = cfg.MASTER_THRESHOLD || 0.8, MASTER_N = cfg.MASTER_MIN_ATTEMPTS || 3;
  var REVEAL_MS = 3500, FREE_LIMIT_MS = 8000, HOST_LOST_MS = 7000, HEARTBEAT_MS = 3000;
  var LS_LANG = "tjwl_game_lang_v1";   /* tiếng nghĩa người chơi tự chọn (riêng máy): room | vi | en | es | zh */

  var G = {
    me: null,          /* {id, name, name_no, avatar} */
    profile: null,     /* {id, display_name, is_admin} nếu máy đang đăng nhập WordLoop */
    view: null,        /* "screen" = 📺 màn hình chung */
    room: null, ch: null, isHost: false,
    pool: [],          /* [{wid, term, block, pos, m:{vi,en,es,zh}}] */
    online: [],        /* presence */
    st: null,          /* state mới nhất (host tự giữ, người khác nhận qua broadcast) */
    endAt: 0, qUntil: 0, qUntilLocal: 0, revealUntil: 0, tick: null, hostTimer: null,
    answers: [],       /* host gom: {pid, wid, term, ok, ms} */
    myQ: null, myQStart: 0, lastN: -1, myChoice: null, revealedN: -1, myStreak: 0,
    myLang: "room", lastState: 0
  };
  /* Mỗi người tự chọn tiếng của NGHĨA (người Việt đọc tiếng Việt, người Trung đọc 中文…) — cả phòng vẫn cùng
     1 câu + cùng 4 đáp án tiếng Anh nên vẫn đấu công bằng. "room" = theo tiếng host chọn cho phòng. */
  function effLang(pref, st) {
    var room = (st && st.lang) || (G.room && G.room.meaning_lang) || "vi";
    return st && st.force ? room : pref && pref !== "room" ? pref : room;   /* host "🔒 ép" -> cả phòng 1 tiếng */
  }
  function myText(q) { var t = q.texts || {}; return t[effLang(G.myLang, G.st)] || t.en || t.vi || q.text || ""; }
  function myFlag(q) { var t = q.texts || {}, l = effLang(G.myLang, G.st); return FLAG[t[l] ? l : t.en ? "en" : "vi"]; }

  /* ---------- tiện ích ---------- */
  function show(id) { $$(".g-screen").forEach(function (s) { s.hidden = s.id !== id; }); document.body.classList.toggle("big", id === "s-screen"); }
  function norm(t) { return String(t || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function clean(t) { return String(t || "").trim(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmt(ms) { ms = Math.max(0, ms); var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function label(p) { return p ? esc(p.name) + (p.no > 1 ? ' <span class="g-no">#' + p.no + "</span>" : "") : "?"; }
  function avatar(a, cls) { return a && /^https?:/.test(a) ? '<img class="g-av ' + (cls || "") + '" src="' + esc(a) + '" alt="">' : '<span class="g-av ' + (cls || "") + '">' + esc(a || "🐣") + "</span>"; }
  function readLS(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function writeLS(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function roomLink(code, screen) { return location.origin + location.pathname + "?room=" + code + (screen ? "&view=screen" : ""); }
  function teamDot(t) { return t && TEAMS[t] ? '<span class="g-tdot" style="background:' + TEAMS[t].c + '" title="' + TEAMS[t].n + '"></span>' : ""; }
  /* điểm 1 câu đúng: 100 + thưởng tốc độ (tối đa 50, nhanh ngay = 50, sát hết giờ = 0); chuỗi đúng ≥3 thì ×1.5 */
  function points(ms, limit, streakAfter) {
    var bonus = Math.round(50 * Math.max(0, 1 - (ms || limit) / limit));
    var mult = streakAfter >= 3 ? 1.5 : 1;
    return { p: Math.round((100 + bonus) * mult), boost: mult > 1 };
  }
  function gainText(g) { return g ? "+" + g.p + (g.boost ? " 🔥×1.5" : "") : ""; }

  /* ---------- 1. tên + ảnh ---------- */
  var pickedAvatar = null;
  function renderNameScreen() {
    var cur = G.me || {};
    $("#n-name").value = cur.name || (G.profile ? G.profile.display_name : "");
    pickedAvatar = cur.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
    paintAvatars();
    show("s-name");
    $("#n-name").focus();
  }
  function paintAvatars() {
    var html = AVATARS.map(function (a) { return '<button class="g-avbtn' + (a === pickedAvatar ? " on" : "") + '" data-av="' + a + '">' + a + "</button>"; }).join("");
    if (pickedAvatar && /^https?:/.test(pickedAvatar)) html = '<button class="g-avbtn on" data-av="' + esc(pickedAvatar) + '">' + avatar(pickedAvatar) + "</button>" + html;
    $("#n-avatars").innerHTML = html;
  }
  $("#n-avatars").addEventListener("click", function (e) {
    var b = e.target.closest("[data-av]"); if (!b) return;
    pickedAvatar = b.dataset.av; paintAvatars();
  });
  /* ảnh tự tải: thu nhỏ còn 128×128 ngay trên máy rồi mới gửi lên (bucket game-avatars, ≤300KB) */
  $("#n-file").addEventListener("change", function () {
    var f = this.files && this.files[0]; if (!f) return;
    $("#n-err").textContent = "Đang tải ảnh…";
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas"); c.width = c.height = 128;
      var s = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
      c.toBlob(async function (blob) {
        var path = "av-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".webp";
        var r = await sb.storage.from("game-avatars").upload(path, blob, { contentType: "image/webp" });
        if (r.error) { $("#n-err").textContent = "Không tải được ảnh: " + r.error.message; return; }
        pickedAvatar = sb.storage.from("game-avatars").getPublicUrl(path).data.publicUrl;
        $("#n-err").textContent = ""; paintAvatars();
      }, "image/webp", 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = function () { $("#n-err").textContent = "File này không phải ảnh."; };
    img.src = URL.createObjectURL(f);
  });
  $("#n-save").addEventListener("click", async function () {
    var name = $("#n-name").value.trim().replace(/\s+/g, " ");
    if (!name) { $("#n-err").textContent = "Nhập tên trước nhé."; return; }
    $("#n-err").textContent = "Đang lưu…";
    try {
      var same = G.me && G.me.id && norm(G.me.name) === norm(name);
      var no = same ? G.me.name_no : 1;
      if (!same) {   /* trùng tên người khác -> số kế tiếp (#2, #3…) */
        var r = await sb.from("game_players").select("name_no").ilike("name", name.replace(/[%_]/g, "\\$&")).order("name_no", { ascending: false }).limit(1);
        if (r.error) throw r.error;
        no = r.data.length ? r.data[0].name_no + 1 : 1;
      }
      var row = { name: name, name_no: no, avatar: pickedAvatar, profile_id: G.profile ? G.profile.id : null };
      var w = G.me && G.me.id
        ? await sb.from("game_players").update(row).eq("id", G.me.id).select().single()
        : await sb.from("game_players").insert(row).select().single();
      if (w.error) throw w.error;
      G.me = { id: w.data.id, name: w.data.name, name_no: w.data.name_no, avatar: w.data.avatar };
      writeLS(LS_ME, G.me); paintMe();
      $("#n-err").textContent = "";
      route();
    } catch (e) { $("#n-err").textContent = "Lỗi: " + (e.message || e); }
  });
  function paintMe() {
    var b = $("#g-me"); b.hidden = !G.me;
    if (G.me) b.innerHTML = avatar(G.me.avatar) + " " + label({ name: G.me.name, no: G.me.name_no });
  }
  $("#g-me").addEventListener("click", function () { if (!G.room || !G.st || G.st.phase === "lobby") renderNameScreen(); });

  /* ---------- 2. trang chính ---------- */
  var picked = [];   /* [{table, id, title}] */
  async function renderHome() {
    show("s-home");
    $("#h-host").hidden = !(G.profile && G.profile.is_admin);
    if (G.profile && G.profile.is_admin) await loadTree();
  }
  $("#h-go").addEventListener("click", function () { var c = $("#h-code").value.trim().toUpperCase(); if (c) { history.replaceState(null, "", "?room=" + c); joinRoom(c); } });
  $("#h-code").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#h-go").click(); });
  $("#h-mode").addEventListener("change", function () { $("#h-qs-wrap").hidden = this.value !== "kahoot"; });
  $("#h-hist").addEventListener("click", function () { renderHistory("me"); });
  $("#e-hist").addEventListener("click", function () { renderHistory("me"); });

  /* Cây Hub > Notebook > Section > Page (Batch/Block chọn qua chuột phải trong WordLoop) */
  var TREE = null;
  async function loadTree() {
    if (TREE) return paintTree();
    var q = await Promise.all(["hubs", "notebooks", "sections", "pages"].map(function (t) {
      var cols = t === "hubs" ? "id,name,sort" : t === "notebooks" ? "id,name,sort,hub_id,parent_notebook_id" : t === "sections" ? "id,name,sort,notebook_id" : "id,name,sort,section_id";
      return sb.from(t).select(cols).order("sort");
    }));
    var err = q.find(function (r) { return r.error; });
    if (err) { $("#h-tree").innerHTML = '<p class="g-err">Không tải được cây: ' + esc(err.error.message) + "</p>"; return; }
    TREE = { hubs: q[0].data, notebooks: q[1].data, sections: q[2].data, pages: q[3].data };
    paintTree();
  }
  function paintTree() {
    function kids(list, key, id) { return TREE[list].filter(function (r) { return r[key] === id; }); }
    function node(table, r, inner) {
      var on = picked.some(function (p) { return p.table === table && p.id === r.id; });
      var chk = '<label class="g-pick"><input type="checkbox" data-pick="' + table + '" data-id="' + esc(r.id) + '" data-title="' + esc(r.name) + '"' + (on ? " checked" : "") + "> " + esc(r.name) + "</label>";
      return inner ? "<details><summary>" + chk + "</summary>" + inner + "</details>" : '<div class="g-leaf">' + chk + "</div>";
    }
    function nbTree(nb) {
      var sub = kids("notebooks", "parent_notebook_id", nb.id).map(nbTree).join("") +
        kids("sections", "notebook_id", nb.id).map(function (sc) {
          return node("sections", sc, kids("pages", "section_id", sc.id).map(function (pg) { return node("pages", pg, ""); }).join(""));
        }).join("");
      return node("notebooks", nb, sub);
    }
    $("#h-tree").innerHTML = TREE.hubs.map(function (h) {
      return node("hubs", h, TREE.notebooks.filter(function (n) { return n.hub_id === h.id && !n.parent_notebook_id; }).map(nbTree).join(""));
    }).join("");
    paintPicked();
  }
  $("#h-tree").addEventListener("change", function (e) {
    var c = e.target.closest("[data-pick]"); if (!c) return;
    var t = c.dataset.pick, id = c.dataset.id;
    picked = picked.filter(function (p) { return !(p.table === t && p.id === id); });
    if (c.checked) picked.push({ table: t, id: id, title: c.dataset.title });
    paintPicked();
  });
  $("#h-tree").addEventListener("click", function (e) { if (e.target.closest(".g-pick")) e.stopPropagation(); });
  function paintPicked() {
    $("#h-picked").innerHTML = picked.length ? picked.map(function (p) { return '<span class="g-chip">' + esc(p.title) + "</span>"; }).join("") : '<span class="g-sub">Chưa chọn nhánh nào.</span>';
  }

  $("#h-create").addEventListener("click", async function () {
    if (!picked.length) { $("#h-cerr").textContent = "Chọn ít nhất 1 nhánh từ vựng."; return; }
    $("#h-cerr").textContent = "Đang tải từ vựng…";
    try {
      G.pool = await loadPool(picked);
      var n = poolFor($("#h-lang").value).length;
      if (n < 4) { $("#h-cerr").textContent = "Nhánh này chỉ có " + n + " từ có nghĩa bằng tiếng đã chọn — cần ít nhất 4. (" + poolCounts() + ")"; return; }
      var code = await createRoom(picked, picked.map(function (p) { return p.title; }).join(" + "), {
        mode: $("#h-mode").value, minutes: +$("#h-min").value || 5, q_seconds: +$("#h-qs").value || 15, lang: $("#h-lang").value });
      history.replaceState(null, "", "?room=" + code);
      joinRoom(code);
    } catch (e) { $("#h-cerr").textContent = "Lỗi: " + (e.message || e); }
  });

  async function createRoom(scope, title, set) {
    var ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (var k = 0; k < 5; k++) {
      var code = ""; for (var i = 0; i < 5; i++) code += ABC[Math.floor(Math.random() * ABC.length)];
      var r = await sb.from("game_rooms").insert({
        code: code, host_id: G.profile.id, title: title, mode: set.mode, minutes: set.minutes, q_seconds: set.q_seconds, meaning_lang: set.lang,
        scope: scope.map(function (p) { return { table: p.table, id: p.id, title: p.title }; })
      }).select().single();
      if (!r.error) return code;
      if (!/duplicate|unique/i.test(r.error.message)) throw r.error;
    }
    throw new Error("không tạo được mã phòng");
  }

  /* ---------- từ vựng theo phạm vi: scope -> Block -> words (lọc trùng theo chữ) ---------- */
  async function inIds(table, cols, key, ids) {
    var out = [];
    for (var i = 0; i < ids.length; i += 80) {
      var from = 0;
      for (;;) {   /* phân trang 1000 dòng/lần của PostgREST */
        var r = await sb.from(table).select(cols).in(key, ids.slice(i, i + 80)).range(from, from + 999);
        if (r.error) throw r.error;
        out = out.concat(r.data);
        if (r.data.length < 1000) break;
        from += 1000;
      }
    }
    return out;
  }
  async function loadPool(scope) {
    var by = function (t) { return scope.filter(function (p) { return p.table === t; }).map(function (p) { return p.id; }); };
    var hubs = by("hubs"), nbs = by("notebooks");
    if (hubs.length || nbs.length) {
      var r = await sb.from("notebooks").select("id,hub_id,parent_notebook_id"); if (r.error) throw r.error;
      var nbAll = r.data;
      nbAll.forEach(function (n) { if (hubs.indexOf(n.hub_id) >= 0 && nbs.indexOf(n.id) < 0) nbs.push(n.id); });
      /* Notebook con lồng bên trong (mọi cấp) */
      for (var grew = true; grew;) { grew = false; nbAll.forEach(function (n) { if (n.parent_notebook_id && nbs.indexOf(n.parent_notebook_id) >= 0 && nbs.indexOf(n.id) < 0) { nbs.push(n.id); grew = true; } }); }
    }
    var ids = function (rows) { return rows.map(function (x) { return x.id; }); };
    var secs = by("sections").concat(nbs.length ? ids(await inIds("sections", "id", "notebook_id", nbs)) : []);
    var pages = by("pages").concat(secs.length ? ids(await inIds("pages", "id", "section_id", secs)) : []);
    var bats = by("batches").concat(pages.length ? ids(await inIds("batches", "id", "page_id", pages)) : []);
    var blks = by("blocks").concat(bats.length ? ids(await inIds("blocks", "id", "batch_id", bats)) : []);
    var words = blks.length ? await inIds("words", "id,block_id,term,pos,meaning_vi,meaning_zh,meaning_es,def_en", "block_id", blks) : [];
    var seen = {}, pool = [];
    words.forEach(function (w) {
      var k = norm(w.term), m = { vi: clean(w.meaning_vi), en: clean(w.def_en), es: clean(w.meaning_es), zh: clean(w.meaning_zh) };
      if (!k || seen[k] || !(m.vi || m.en || m.es || m.zh)) return;
      seen[k] = 1; pool.push({ wid: w.id, term: clean(w.term), block: w.block_id, pos: norm(w.pos), m: m });
    });
    return pool;
  }
  function poolFor(lang) { return G.pool.filter(function (x) { return x.m[lang]; }); }
  function poolCounts() { return ["vi", "en", "es", "zh"].map(function (l) { return FLAG[l] + " " + poolFor(l).length; }).join(" · "); }
  /* "xào bài": hỏi lần lượt hết các từ (thứ tự ngẫu nhiên) rồi mới lặp lại.
     Đáp án nhiễu KHÓ: ưu tiên từ CÙNG Block, rồi cùng loại từ (pos), rồi mới tới từ bất kỳ. */
  var deck = { key: "", list: [] };
  function poolForAll(langs) { return G.pool.filter(function (x) { return langs.every(function (l) { return x.m[l]; }); }); }
  function makeQ(lang, langs) {
    var p = langs && langs.length ? poolForAll(langs) : poolFor(lang);
    if (p.length < 4) p = poolFor(lang);   /* không đủ từ có nghĩa ở MỌI tiếng -> theo tiếng phòng, ai thiếu thì hiện nghĩa tiếng Anh */
    var dk = lang + (langs || []).join("");
    if (deck.key !== dk + p.length || !deck.list.length) deck = { key: dk + p.length, list: shuffle(p.slice()) };
    var w = deck.list.pop();
    var ok = function (x) { return norm(x.term) !== norm(w.term) && norm(x.m[lang]) !== norm(w.m[lang]); };
    var sameBlock = shuffle(p.filter(function (x) { return ok(x) && x.block === w.block; }));
    var samePos = shuffle(p.filter(function (x) { return ok(x) && x.block !== w.block && w.pos && x.pos === w.pos; }));
    var rest = shuffle(p.filter(function (x) { return ok(x) && x.block !== w.block && !(w.pos && x.pos === w.pos); }));
    var picks = [], used = {};
    sameBlock.concat(samePos, rest).forEach(function (x) { if (picks.length < 3 && !used[norm(x.term)]) { used[norm(x.term)] = 1; picks.push(x.term); } });
    return { wid: w.wid, text: w.m[lang], texts: w.m, lang: lang, ans: w.term, opts: shuffle([w.term].concat(picks)) };
  }

  /* ---------- 3. vào phòng ---------- */
  async function joinRoom(code) {
    code = code.toUpperCase();
    var r = await sb.from("game_rooms").select("*").eq("code", code).maybeSingle();
    if (r.error || !r.data) { if (G.view === "screen") { show("s-screen"); $("#sc-status").textContent = "Không tìm thấy phòng " + code; return; } show("s-home"); $("#h-err").textContent = "Không tìm thấy phòng " + code + "."; return; }
    G.room = r.data;
    G.isHost = G.view !== "screen" && !!(G.profile && G.profile.is_admin && G.profile.id === G.room.host_id);
    if (G.room.status === "ended") return showSavedResults();
    $("#g-room-badge").hidden = false; $("#g-room-badge").textContent = "Phòng " + code;
    if (G.isHost) {
      if (!G.pool.length) { $("#l-pool").textContent = "Đang tải từ vựng…"; G.pool = await loadPool(G.room.scope); }
      restoreHost();
    }
    connect();
    if (G.view === "screen") { show("s-screen"); $("#sc-code").textContent = code; paintScreen(); }
    else if (!G.st || G.st.phase === "lobby") renderLobby();
  }
  /* host tải lại trang giữa trận -> lấy lại trạng thái đã lưu (điểm, đội, câu đang hỏi) */
  function saveHost() { if (G.isHost && G.st) writeLS(LS_HOST + G.room.code, { st: G.st, endAt: G.endAt, qUntil: G.qUntil, revealUntil: G.revealUntil, answers: G.answers }); }
  function restoreHost() {
    var s = readLS(LS_HOST + G.room.code);
    if (!s || !s.st || s.st.phase !== "play") return;
    G.st = s.st; G.endAt = s.endAt; G.qUntil = s.qUntil; G.revealUntil = s.revealUntil; G.answers = s.answers || [];
    clearInterval(G.hostTimer); G.hostTimer = setInterval(hostTick, 250);
  }

  function connect() {
    if (G.ch) sb.removeChannel(G.ch);
    var key = G.view === "screen" ? "screen-" + Math.random().toString(36).slice(2) : G.me.id;
    G.ch = sb.channel("game:" + G.room.code, { config: { broadcast: { self: true }, presence: { key: key } } });
    G.ch.on("presence", { event: "sync" }, onPresence);
    G.ch.on("broadcast", { event: "state" }, function (m) { onState(m.payload); });
    G.ch.on("broadcast", { event: "ans" }, function (m) { if (G.isHost) hostOnAnswer(m.payload); });
    G.ch.on("broadcast", { event: "hello" }, function () { if (G.isHost && G.st) push(); });
    G.ch.subscribe(async function (s) {
      if (s !== "SUBSCRIBED") return;
      if (G.view !== "screen") await track();
      if (G.isHost) {
        if (!G.st) G.st = { phase: "lobby", mode: G.room.mode, lang: G.room.meaning_lang || "vi", minutes: +G.room.minutes, qs: G.room.q_seconds, teams: 0, teamOf: {}, scores: {}, roster: {} };
        push();
        if (G.st.phase === "play") onState(pub());
      } else G.ch.send({ type: "broadcast", event: "hello", payload: {} });   /* xin host gửi lại trạng thái hiện tại */
    });
  }
  function track() { return G.ch.track({ id: G.me.id, name: G.me.name, no: G.me.name_no, avatar: G.me.avatar, host: G.isHost, play: G.isHost ? hostPlays() : true, lang: G.myLang }); }
  function hostPlays() { var c = $("#l-hostplay"); return !c || c.checked; }
  function players() { return G.online.filter(function (p) { return p.play !== false; }); }
  function onPresence() {
    var ps = G.ch.presenceState(), list = [];
    Object.keys(ps).forEach(function (k) { var p = ps[k][0]; if (p && p.id) list.push(p); });
    G.online = list;
    if (G.isHost && G.st) {
      list.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
      push();
    }
    if (G.st && G.st.phase === "lobby" && G.view !== "screen") paintLobbyPlayers();
  }

  /* ---------- phòng chờ ---------- */
  function renderLobby() {
    show("s-lobby");
    $("#l-code").textContent = G.room.code;
    $("#l-info").textContent = "Từ vựng: " + (G.room.title || "");
    $("#l-host").hidden = !G.isHost; $("#l-wait").hidden = G.isHost;
    if (G.isHost) {
      var st = G.st || {};
      $("#l-mode").value = st.mode || G.room.mode; $("#l-min").value = st.minutes || G.room.minutes; $("#l-qs").value = st.qs || G.room.q_seconds;
      $("#l-lang").value = st.lang || G.room.meaning_lang || "vi"; $("#l-teamn").value = String(st.teams || 0); $("#l-force").checked = !!st.force;
      $("#l-qs-wrap").hidden = $("#l-mode").value !== "kahoot";
      $("#l-teambtns").hidden = !(+$("#l-teamn").value);
      $("#l-pool").textContent = G.pool.length + " từ khác nhau · có nghĩa: " + poolCounts();
    }
    paintLobbyPlayers();
  }
  function paintLobbyPlayers() {
    var st = G.st || {}, teams = +st.teams || 0, teamOf = st.teamOf || {};
    var list = G.online;
    $("#l-count").textContent = players().length;
    $("#l-teamhint").textContent = teams && G.isHost ? "· bấm tên để đổi đội" : "";
    $("#l-teams").innerHTML = teams ? teamSummary(st, null) : "";
    $("#l-players").innerHTML = list.map(function (p) {
      var t = teamOf[p.id];
      return '<button class="g-player' + (teams && G.isHost && p.play !== false ? " g-click" : "") + '" data-pid="' + esc(p.id) + '"' + (t && TEAMS[t] ? ' style="border-color:' + TEAMS[t].c + '"' : "") + ">" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (teams && t ? teamDot(t) : "") +
        (p.host ? '<span class="g-tag">Host' + (p.play === false ? " · MC" : "") + "</span>" : "") + "</button>";
    }).join("");
  }
  $("#l-players").addEventListener("click", function (e) {   /* host bấm tên -> chuyển sang đội kế tiếp */
    var b = e.target.closest("[data-pid]"); if (!b || !G.isHost || !(+G.st.teams)) return;
    var pid = b.dataset.pid, p = G.online.find(function (x) { return x.id === pid; });
    if (!p || p.play === false) return;
    G.st.teamOf[pid] = ((G.st.teamOf[pid] || 0) % G.st.teams) + 1;
    push(); paintLobbyPlayers();
  });
  $("#l-auto").addEventListener("click", function () { if (G.isHost) { autoTeams(); push(); paintLobbyPlayers(); } });
  function autoTeams() {   /* chia đều: xáo ngẫu nhiên rồi chia vòng, các đội hơn kém nhau tối đa 1 người */
    G.st.teamOf = {};
    shuffle(players().map(function (p) { return p.id; })).forEach(function (pid, i) { G.st.teamOf[pid] = (i % G.st.teams) + 1; });
  }
  function fillTeams() {   /* ai chưa có đội (vào muộn) -> xếp vào đội ít người nhất */
    if (!(+G.st.teams)) return;
    players().forEach(function (p) {
      if (G.st.teamOf[p.id]) return;
      var cnt = {}; for (var t = 1; t <= G.st.teams; t++) cnt[t] = 0;
      Object.keys(G.st.teamOf).forEach(function (k) { if (cnt[G.st.teamOf[k]] != null) cnt[G.st.teamOf[k]]++; });
      var best = 1; for (t = 2; t <= G.st.teams; t++) if (cnt[t] < cnt[best]) best = t;
      G.st.teamOf[p.id] = best;
    });
  }
  $("#l-copy").addEventListener("click", function () { copyLink(roomLink(G.room.code), this, "🔗 Copy link mời"); });
  $("#l-screen").addEventListener("click", function () { window.open(roomLink(G.room.code, true), "_blank"); });
  function copyLink(link, b, txt) {
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { b.textContent = "✓ Đã copy"; }, function () { prompt("Copy link này:", link); });
    setTimeout(function () { b.textContent = txt; }, 2000);
  }
  ["#l-mode", "#l-min", "#l-qs", "#l-lang", "#l-teamn", "#l-hostplay", "#l-force"].forEach(function (s) {
    $(s).addEventListener("change", function () {
      if (!G.isHost) return;
      var st = G.st;
      st.mode = $("#l-mode").value; st.lang = $("#l-lang").value; st.force = $("#l-force").checked; st.minutes = Math.max(1, +$("#l-min").value || 5); st.qs = Math.max(5, +$("#l-qs").value || 15);
      var tn = +$("#l-teamn").value;
      if (tn !== st.teams) { st.teams = tn; st.teamOf = {}; if (tn) autoTeams(); }
      $("#l-qs-wrap").hidden = st.mode !== "kahoot";
      $("#l-teambtns").hidden = !tn;
      if (s === "#l-hostplay") track();
      sb.from("game_rooms").update({ mode: st.mode, meaning_lang: st.lang, minutes: st.minutes, q_seconds: st.qs, team_mode: !!tn, teams: tn }).eq("id", G.room.id).then(function () {});
      push(); paintLobbyPlayers();
    });
  });

  /* ---------- HOST: điều khiển trận ---------- */
  function pub() {   /* bản công khai của state: giấu đáp án cho tới lúc lộ; thời gian gửi dạng "còn lại bao nhiêu ms" (khỏi lệch đồng hồ) */
    var s = Object.assign({}, G.st, { left: G.endAt ? G.endAt - Date.now() : null, qLeft: G.qUntil ? G.qUntil - Date.now() : null });
    if (s.q) {
      var q = s.q, rev = !!q.revealed;
      s.q = { n: q.n, text: q.text, texts: q.texts, lang: q.lang, opts: q.opts, wid: q.wid, revealed: rev, ans: rev ? q.ans : null, cnt: Object.keys(q.got).length,
              picks: rev ? Object.keys(q.got).reduce(function (o, pid) { o[pid] = q.got[pid].c; return o; }, {}) : null, fast: rev ? q.fast : null };
    }
    return s;
  }
  function push() { G.lastPush = Date.now(); if (G.ch) G.ch.send({ type: "broadcast", event: "state", payload: pub() }); saveHost(); }
  $("#l-start").addEventListener("click", async function () {
    if (!G.isHost) return;
    if (poolFor(G.st.lang).length < 4) { alert("Cần ít nhất 4 từ có nghĩa bằng tiếng đã chọn (" + poolCounts() + ")."); return; }
    if (!players().length) { alert("Chưa có người chơi nào."); return; }
    fillTeams();
    G.st.phase = "play"; G.st.scores = {}; G.st.q = null; G.answers = [];
    players().forEach(function (p) { G.st.scores[p.id] = { s: 0, c: 0, w: 0, st: 0, best: 0 }; });
    G.endAt = Date.now() + G.st.minutes * 60000;
    await sb.from("game_rooms").update({ status: "playing", started_at: new Date().toISOString(), mode: G.st.mode, meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs, team_mode: !!G.st.teams, teams: G.st.teams }).eq("id", G.room.id);
    if (G.st.mode === "kahoot") hostNextQ(); else { G.qUntil = 0; push(); }
    clearInterval(G.hostTimer);
    G.hostTimer = setInterval(hostTick, 250);
  });
  $("#p-stop").addEventListener("click", function () { if (G.isHost && confirm("Kết thúc trận ngay?")) hostEnd(); });
  function roomLangs() {
    var set = {}; players().forEach(function (p) { set[effLang(p.lang, G.st)] = 1; });
    return Object.keys(set);
  }
  function hostNextQ() {
    var q = makeQ(G.st.lang, roomLangs());
    G.st.q = { n: (G.st.q ? G.st.q.n : 0) + 1, text: q.text, texts: q.texts, lang: q.lang, opts: q.opts, ans: q.ans, wid: q.wid, revealed: false, got: {}, fast: null };
    G.qUntil = Date.now() + G.st.qs * 1000;
    push();
  }
  function hostTick() {
    var now = Date.now();
    if (now - (G.lastPush || 0) > HEARTBEAT_MS) push();   /* nhịp "host còn sống" — người chơi quá HOST_LOST_MS không nghe thì báo mất kết nối */
    if (now >= G.endAt) {
      if (G.st.mode === "kahoot" && G.st.q && !G.st.q.revealed) return hostReveal();   /* chấm nốt câu đang dở */
      if (G.st.mode !== "kahoot" || !G.revealUntil || now >= G.revealUntil) return hostEnd();
      return;
    }
    if (G.st.mode !== "kahoot" || !G.st.q) return;
    if (!G.st.q.revealed) {
      var n = players().length, got = Object.keys(G.st.q.got).length;
      if (now >= G.qUntil || (n && got >= n)) hostReveal();
    } else if (now >= G.revealUntil) hostNextQ();
  }
  function hostReveal() {
    var q = G.st.q;
    q.revealed = true; G.revealUntil = Date.now() + REVEAL_MS; G.qUntil = 0;
    /* ai nhanh nhất trong số trả lời đúng */
    var best = null; Object.keys(q.got).forEach(function (pid) { var g = q.got[pid]; if (g.ok && (!best || g.ms < q.got[best].ms)) best = pid; });
    q.fast = best;
    /* ai không trả lời câu này thì mất chuỗi */
    Object.keys(G.st.scores).forEach(function (pid) { if (!q.got[pid]) { G.st.scores[pid].st = 0; G.st.scores[pid].g = null; } });
    push();
  }
  function score(pid, ok, ms, limit) {
    var s = G.st.scores[pid] || (G.st.scores[pid] = { s: 0, c: 0, w: 0, st: 0, best: 0 });
    if (ok) { s.st++; var g = points(ms, limit, s.st); s.s += g.p; s.c++; s.best = Math.max(s.best, s.st); s.g = g; }
    else { s.w++; s.st = 0; s.g = null; }
  }
  function hostOnAnswer(a) {
    if (!G.st || G.st.phase !== "play") return;
    if (G.st.mode === "kahoot") {
      var q = G.st.q;
      if (!q || q.revealed || a.n !== q.n || q.got[a.pid]) return;   /* mỗi người 1 lần / câu */
      var ok = norm(a.choice) === norm(q.ans);
      q.got[a.pid] = { ok: ok, c: a.choice, ms: a.ms };
      score(a.pid, ok, a.ms, G.st.qs * 1000);
      G.answers.push({ pid: a.pid, wid: q.wid, term: q.ans, ok: ok, ms: a.ms });
    } else {
      score(a.pid, !!a.ok, a.ms, FREE_LIMIT_MS);
      G.answers.push({ pid: a.pid, wid: a.wid, term: a.term, ok: !!a.ok, ms: a.ms });
    }
    push();
  }
  async function hostEnd() {
    if (G.st.phase === "end") return;
    clearInterval(G.hostTimer);
    G.st.phase = "end"; G.st.q = null; G.endAt = 0; G.qUntil = 0;
    push();
    writeLS(LS_HOST + G.room.code, null);
    try {
      var ranked = rankList(G.st.scores);
      if (ranked.length) {
        var rr = await sb.from("game_results").upsert(ranked.map(function (x) {
          return { room_id: G.room.id, player_id: x.pid, team: G.st.teams ? (G.st.teamOf[x.pid] || null) : null, score: x.s, correct: x.c, wrong: x.w, best_streak: x.best, rank: x.rank };
        }), { onConflict: "room_id,player_id" });
        if (rr.error) console.warn("game_results", rr.error);
      }
      for (var i = 0; i < G.answers.length; i += 500) {
        var ra = await sb.from("game_answers").insert(G.answers.slice(i, i + 500).map(function (a) {
          return { room_id: G.room.id, player_id: a.pid, word_id: a.wid, term: a.term, correct: a.ok, ms: a.ms || null };
        }));
        if (ra.error) console.warn("game_answers", ra.error);
      }
      await sb.from("game_rooms").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", G.room.id);
    } catch (e) { console.warn("lưu kết quả lỗi", e); }
  }
  function rankList(scores) {
    var list = Object.keys(scores || {}).map(function (pid) { return Object.assign({ pid: pid }, scores[pid]); })
      .sort(function (a, b) { return b.s - a.s || b.c - a.c || a.w - b.w; });
    list.forEach(function (x, i) { x.rank = i > 0 && x.s === list[i - 1].s && x.c === list[i - 1].c ? list[i - 1].rank : i + 1; });
    return list;
  }
  /* điểm đội = TỔNG; đội lệch số người thì hiện thêm điểm TRUNG BÌNH để so công bằng */
  function teamTotals(st) {
    var out = [];
    for (var t = 1; t <= (+st.teams || 0); t++) out.push({ t: t, s: 0, n: 0 });
    Object.keys(st.teamOf || {}).forEach(function (pid) {
      var t = st.teamOf[pid], row = out[t - 1]; if (!row) return;
      row.n++; row.s += (st.scores && st.scores[pid] ? st.scores[pid].s : 0);
    });
    return out.sort(function (a, b) { return b.s - a.s; });
  }
  function teamSummary(st, withScore) {
    var tt = teamTotals(st), uneven = tt.some(function (x) { return x.n !== tt[0].n; });
    return tt.map(function (x, i) {
      var T = TEAMS[x.t];
      return '<div class="g-team" style="--tc:' + T.c + '"><span>' + (withScore && i === 0 && x.s > 0 ? "👑 " : "") + T.e + " " + T.n + '</span><span class="g-sub">' + x.n + " người</span>" +
        (withScore ? '<b>' + x.s + "</b>" + (uneven && x.n ? '<span class="g-sub">TB ' + Math.round(x.s / x.n) + "</span>" : "") : "") + "</div>";
    }).join("");
  }

  /* ---------- MỌI NGƯỜI: nhận trạng thái ---------- */
  function paintLangLock(s) {
    var sel = $("#g-mylang"), lock = !!(s && s.force);
    sel.disabled = lock;
    sel.title = lock ? "Host đang ép cả phòng dùng " + (FLAG[s.lang] || "") + " — không đổi được" : "Nghĩa hiển thị bằng tiếng nào (riêng máy bạn)";
    sel.value = lock ? s.lang : G.myLang;
  }
  function onState(s) {
    G.lastState = Date.now();
    paintLangLock(s);
    var was = G.st && G.st.phase;
    if (!G.isHost) G.st = s;
    if (s.left != null) G.endAt = Date.now() + s.left;
    if (G.view === "screen") return paintScreen(s);
    if (s.phase === "lobby") { if ($("#s-lobby").hidden) renderLobby(); else paintLobbyPlayers(); return; }
    if (s.phase === "end") { clearInterval(G.tick); return renderEnd(s); }
    if (s.phase === "play") {
      if (was !== "play" || $("#s-play").hidden) enterPlay(s);
      paintBoard(s);
      if (s.mode === "kahoot" && s.q) paintKahoot(s);
    }
  }
  function enterPlay(s) {
    show("s-play");
    $("#p-mode").textContent = (s.mode === "kahoot" ? "Cùng 1 câu · " + s.qs + " giây/câu" : "Tự do — ai nhanh nhiều điểm");
    $("#p-stop").hidden = !G.isHost;
    clearInterval(G.tick);
    G.tick = setInterval(function () {
      $("#p-left").textContent = fmt(G.endAt - Date.now());
      var bar = $("#p-qbar");
      if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) {
        var tot = (G.st.qs || 15) * 1000; bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / tot * 100)) + "%";
      } else bar.style.width = "0%";
      if (G.st && G.st.mode === "free" && Date.now() >= G.endAt) lockOpts("⏱ Hết giờ — chờ host tổng kết…");
      if (!G.isHost) {
        var hostHere = G.online.some(function (p) { return p.host; });
        var quiet = Date.now() - G.lastState > HOST_LOST_MS;
        $("#p-hostlost").hidden = hostHere && !quiet;
      }
    }, 200);
    var playing = !(G.isHost && !hostPlays());
    if (!playing) { $("#p-msg").textContent = "Bạn đang làm MC (không chơi) — mở 📺 Màn hình chung để cả nhóm cùng xem."; }
    if (s.mode === "free" && playing) {
      /* host có thể đổi sang "Tự do" sau khi người chơi vào phòng -> lúc đó mới tải kho từ */
      if (G.pool.length) freeNext();
      else { $("#p-vi").textContent = "Đang tải từ vựng…"; loadPool(G.room.scope).then(function (p) { G.pool = p; freeNext(); }); }
    }
  }
  function paintBoard(s) {
    var roster = s.roster || {}, list = rankList(s.scores), teams = +s.teams;
    $("#p-teams").innerHTML = teams ? teamSummary(s, true) : "";
    $("#p-board").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + x.rank + "</span>" + avatar(p.avatar) +
        '<span class="g-pname">' + label(p) + "</span>" + (teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-streak">' + (x.st >= 3 ? "🔥" + x.st : x.st > 1 ? "·" + x.st : "") + '</span><b class="g-score">' + x.s + "</b></li>";
    }).join("");
  }
  function optHTML(o) { return '<button class="g-opt" data-opt="' + esc(o) + '"><span class="g-otext">' + esc(o) + '</span><span class="g-pickers"></span></button>'; }

  /* kiểu Kahoot: host gửi câu, mọi người chọn 1 lần, hết giờ mới hiện đáp án + ai chọn gì + ai nhanh nhất */
  function paintKahoot(s) {
    var q = s.q, playing = !(G.isHost && !hostPlays());
    if (q.n !== G.lastN) {
      G.lastN = q.n; G.myChoice = null; G.myQStart = Date.now();
      G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0;
      $("#p-vi").textContent = myFlag(q) + " " + myText(q);
      $("#p-opts").innerHTML = q.opts.map(optHTML).join("");
      if (!playing) $$(".g-opt").forEach(function (b) { b.disabled = true; });
      $("#p-msg").textContent = playing ? "" : "MC: " + (q.cnt || 0) + " người đã trả lời";
    } else if (!q.revealed && !playing) $("#p-msg").textContent = "MC: " + (q.cnt || 0) + " người đã trả lời";
    else if (!q.revealed && G.myChoice != null) $("#p-msg").textContent = "Đã chọn — chờ mọi người… (" + (q.cnt || 0) + " đã trả lời)";
    if (q.revealed) {
      G.qUntilLocal = 0;
      paintPickers(q, s.roster || {}, ".g-opt");
      if (G.revealedN !== q.n) {
        G.revealedN = q.n;
        var ok = G.myChoice != null && norm(G.myChoice) === norm(q.ans);
        var me = (s.scores || {})[G.me.id], fast = q.fast ? (s.roster || {})[q.fast] : null;
        var msg = !playing ? "Đáp án: " + q.ans : G.myChoice == null ? "Hết giờ — đáp án: " + q.ans : ok ? "✓ Đúng! " + gainText(me && me.g) : "✗ Sai — đáp án: " + q.ans;
        if (fast) msg += "  ·  ⚡ Nhanh nhất: " + fast.name + (fast.no > 1 ? " #" + fast.no : "");
        $("#p-msg").textContent = msg;
        if (G.myChoice != null) recordMyProgress(q.wid, ok);
      }
    }
  }
  /* tô đúng/sai + gắn ảnh những người đã chọn từng đáp án */
  function paintPickers(q, roster, sel) {
    var by = {};
    Object.keys(q.picks || {}).forEach(function (pid) { var k = norm(q.picks[pid]); (by[k] = by[k] || []).push(pid); });
    $$(sel).forEach(function (b) {
      b.disabled = true;
      var o = norm(b.dataset.opt), who = by[o] || [];
      if (o === norm(q.ans)) b.classList.add("ok");
      else if (G.myChoice && o === norm(G.myChoice)) b.classList.add("bad");
      var box = b.querySelector(".g-pickers");
      if (box) box.innerHTML = who.map(function (pid) { var p = roster[pid] || {}; return avatar(p.avatar, "g-av-sm" + (pid === q.fast ? " g-fast" : "")); }).join("") + (who.length ? '<span class="g-cnt">' + who.length + "</span>" : "");
    });
  }
  $("#p-opts").addEventListener("click", function (e) {
    var b = e.target.closest(".g-opt"); if (!b || b.disabled) return;
    var s = G.st; if (!s || s.phase !== "play") return;
    if (s.mode === "kahoot") {
      if (G.myChoice != null || !s.q || s.q.revealed) return;
      G.myChoice = b.dataset.opt;
      b.classList.add("picked");
      $$(".g-opt").forEach(function (x) { x.disabled = true; });
      $("#p-msg").textContent = "Đã chọn — chờ mọi người…";
      G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, n: s.q.n, choice: G.myChoice, ms: Date.now() - G.myQStart } });
    } else freeAnswer(b);
  });

  /* kiểu tự do: mỗi máy tự sinh câu từ cùng kho, báo đúng/sai cho host chấm điểm */
  function freeNext() {
    if (Date.now() >= G.endAt) return lockOpts("⏱ Hết giờ — chờ host tổng kết…");
    if (!G.pool.length) { $("#p-vi").textContent = "Đang tải từ vựng…"; return; }
    var ml = effLang(G.myLang, G.st);
    G.myQ = makeQ(poolFor(ml).length >= 4 ? ml : (G.st.lang || "vi")); G.myQStart = Date.now();
    $("#p-vi").textContent = myFlag(G.myQ) + " " + myText(G.myQ);
    $("#p-opts").innerHTML = G.myQ.opts.map(optHTML).join("");
    $("#p-msg").textContent = "";
  }
  function freeAnswer(b) {
    var q = G.myQ; if (!q) return;
    var ms = Date.now() - G.myQStart, ok = norm(b.dataset.opt) === norm(q.ans);
    $$(".g-opt").forEach(function (x) { x.disabled = true; if (norm(x.dataset.opt) === norm(q.ans)) x.classList.add("ok"); });
    if (!ok) b.classList.add("bad");
    G.myStreak = ok ? G.myStreak + 1 : 0;   /* dự đoán điểm để báo ngay (host vẫn là người chấm chính thức) */
    $("#p-msg").textContent = ok ? "✓ " + gainText(points(ms, FREE_LIMIT_MS, G.myStreak)) : "✗ " + q.ans;
    G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, ok: ok, wid: q.wid, term: q.ans, ms: ms } });
    recordMyProgress(q.wid, ok);
    setTimeout(freeNext, ok ? 450 : 1100);
  }
  function lockOpts(msg) { $$(".g-opt").forEach(function (x) { x.disabled = true; }); $("#p-msg").textContent = msg; }

  /* Tiến trình học — CHỈ hồ sơ admin (TJ). "Học chung" vẫn tách được qua game_answers (có room_id). */
  async function recordMyProgress(wid, ok) {
    if (!G.profile || !G.profile.is_admin || !wid) return;
    try {
      var r = await sb.from("word_progress").select("attempts,correct").eq("user_id", G.profile.id).eq("word_id", wid).maybeSingle();
      var at = ((r.data && r.data.attempts) || 0) + 1, co = ((r.data && r.data.correct) || 0) + (ok ? 1 : 0);
      await sb.from("word_progress").upsert({
        user_id: G.profile.id, word_id: wid, attempts: at, correct: co,
        mastered: at >= MASTER_N && co / at >= MASTER_T, last_reviewed_at: Date.now(), wrong_open: !ok, wrong_ctx: null
      }, { onConflict: "user_id,word_id" });
    } catch (e) { console.warn("word_progress", e); }
  }

  /* ---------- 📺 màn hình chung: câu to + đường đua điểm, để cả nhóm cùng nhìn khi chia sẻ màn hình ---------- */
  function paintScreen(s) {
    s = s || G.st;
    show("s-screen");
    clearInterval(G.tick);
    G.tick = setInterval(function () {
      $("#sc-left").textContent = G.st && G.st.phase === "play" ? "⏱ " + fmt(G.endAt - Date.now()) : "";
      var bar = $("#sc-qbar");
      if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / ((G.st.qs || 15) * 1000) * 100)) + "%";
      else bar.style.width = "0%";
    }, 200);
    if (!s) { $("#sc-status").textContent = "Đang kết nối…"; return; }
    var roster = s.roster || {};
    if (s.phase === "lobby") {
      $("#sc-status").innerHTML = "Vào phòng tại <b>" + esc(roomLink(G.room.code)) + "</b>";
      $("#sc-q").textContent = "Mã phòng: " + G.room.code;
      $("#sc-opts").innerHTML = '<div class="sc-waiting">' + Object.keys(roster).map(function (pid) { return avatar(roster[pid].avatar) ; }).join("") + "</div>";
    } else if (s.phase === "play") {
      $("#sc-status").textContent = (FLAG[s.lang] || "") + " " + (s.mode === "kahoot" ? (s.q ? "Câu " + s.q.n + (s.q.revealed ? "" : " · " + (s.q.cnt || 0) + " người đã trả lời") : "") : "Tự do — ai nhanh nhiều điểm");
      if (s.mode === "kahoot" && s.q) {
        if (s.q.n !== G.lastN) {
          G.lastN = s.q.n; G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0;
          $("#sc-q").textContent = s.q.text;
          $("#sc-opts").innerHTML = s.q.opts.map(function (o, i) { return '<div class="g-opt sc-opt" data-opt="' + esc(o) + '"><span class="sc-key">' + "ABCD"[i] + '</span><span class="g-otext">' + esc(o) + '</span><span class="g-pickers"></span></div>'; }).join("");
        }
        if (s.q.revealed) {
          G.qUntilLocal = 0;
          paintPickers(s.q, roster, ".sc-opt");
          var fast = s.q.fast ? roster[s.q.fast] : null;
          if (fast) $("#sc-status").textContent = "⚡ Nhanh nhất: " + fast.name + (fast.no > 1 ? " #" + fast.no : "");
        }
      } else if (s.mode === "free") { $("#sc-q").textContent = "🏁 Đua tự do!"; $("#sc-opts").innerHTML = ""; }
    } else if (s.phase === "end") {
      clearInterval(G.tick); $("#sc-left").textContent = "";
      $("#sc-status").textContent = "🏁 Kết thúc!";
      var top = rankList(s.scores).slice(0, 3);
      $("#sc-q").innerHTML = top.map(function (x, i) { var p = roster[x.pid] || {}; return '<span class="sc-pod">' + ["🥇", "🥈", "🥉"][i] + avatar(p.avatar) + label(p) + " · " + x.s + "</span>"; }).join("");
      $("#sc-opts").innerHTML = "";
    }
    $("#sc-teams").innerHTML = +s.teams ? teamSummary(s, s.phase !== "lobby") : "";
    /* đường đua: ảnh chạy tới theo điểm (người dẫn đầu = đích) */
    var list = rankList(s.scores), max = Math.max(1, list.length ? list[0].s : 1);
    $("#sc-lanes").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {}, t = (s.teamOf || {})[x.pid];
      return '<div class="sc-lane"' + (t && TEAMS[t] ? ' style="--tc:' + TEAMS[t].c + '"' : "") + '><span class="sc-lname">' + x.rank + ". " + label(p) + '</span><div class="sc-track"><div class="sc-runner" style="left:' + Math.round(x.s / max * 88) + '%">' + avatar(p.avatar) + '</div></div><b>' + x.s + "</b></div>";
    }).join("");
  }

  /* ---------- kết quả ---------- */
  function renderEnd(s) {
    show("s-end");
    $("#e-info").textContent = (G.room.title || "") + " · " + (s.mode === "kahoot" ? "Cùng 1 câu" : "Tự do") + " · " + s.minutes + " phút";
    $("#e-teams").innerHTML = +s.teams ? teamSummary(s, true) : "";
    var roster = s.roster || {};
    $("#e-board").innerHTML = rankList(s.scores).map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (G.me && x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + (x.rank === 1 ? "🥇" : x.rank === 2 ? "🥈" : x.rank === 3 ? "🥉" : x.rank) + "</span>" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (+s.teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-sub">✓' + x.c + " ✗" + x.w + " 🔥" + x.best + '</span><b class="g-score">' + x.s + "</b></li>";
    }).join("") || '<li class="g-sub">Chưa ai trả lời câu nào.</li>';
  }
  async function showSavedResults() {
    var r = await sb.from("game_results").select("player_id,team,score,correct,wrong,best_streak,rank,game_players(name,name_no,avatar)").eq("room_id", G.room.id).order("rank");
    var scores = {}, roster = {}, teamOf = {};
    (r.data || []).forEach(function (x) {
      scores[x.player_id] = { s: x.score, c: x.correct, w: x.wrong, st: 0, best: x.best_streak };
      if (x.team) teamOf[x.player_id] = x.team;
      var p = x.game_players || {}; roster[x.player_id] = { name: p.name, no: p.name_no, avatar: p.avatar };
    });
    var s = { phase: "end", mode: G.room.mode, minutes: G.room.minutes, teams: G.room.teams || 0, teamOf: teamOf, scores: scores, roster: roster };
    if (G.view === "screen") { $("#sc-code").textContent = G.room.code; return paintScreen(s); }
    renderEnd(s);
  }

  /* ---------- 📜 lịch sử & xếp hạng ---------- */
  var histTab = "me";
  $("#hi-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) renderHistory(b.dataset.tab); });
  async function renderHistory(tab) {
    histTab = tab; show("s-hist");
    $$("#hi-tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === tab); });
    $("#hi-body").innerHTML = '<p class="g-sub">Đang tải…</p>';
    try {
      if (tab === "me") return await histMine();
      var q = sb.from("game_results").select("player_id,score,rank,correct,wrong,created_at,game_players(name,name_no,avatar)").order("created_at", { ascending: false }).limit(5000);
      if (tab === "week") q = q.gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
      var r = await q; if (r.error) throw r.error;
      var agg = {};
      r.data.forEach(function (x) {
        var a = agg[x.player_id] || (agg[x.player_id] = { p: x.game_players || {}, total: 0, games: 0, wins: 0, best: 0, c: 0, w: 0 });
        a.total += x.score; a.games++; if (x.rank === 1) a.wins++; a.best = Math.max(a.best, x.score); a.c += x.correct; a.w += x.wrong;
      });
      var rows = Object.keys(agg).map(function (k) { return Object.assign({ id: k }, agg[k]); }).sort(function (a, b) { return b.total - a.total; });
      $("#hi-body").innerHTML = rows.length ? '<table class="g-table"><thead><tr><th>#</th><th>Người chơi</th><th>Tổng điểm</th><th>Trận</th><th>🥇</th><th>Cao nhất</th><th>Đúng</th></tr></thead><tbody>' +
        rows.map(function (a, i) {
          return '<tr class="' + (G.me && a.id === G.me.id ? "me" : "") + '"><td>' + (i + 1) + "</td><td>" + avatar(a.p.avatar, "g-av-sm") + " " + label({ name: a.p.name, no: a.p.name_no }) + "</td><td><b>" + a.total + "</b></td><td>" + a.games + "</td><td>" + a.wins + "</td><td>" + a.best + "</td><td>" + (a.c + a.w ? Math.round(a.c / (a.c + a.w) * 100) + "%" : "—") + "</td></tr>";
        }).join("") + "</tbody></table>" : '<p class="g-sub">Chưa có trận nào ' + (tab === "week" ? "trong 7 ngày qua." : ".") + "</p>";
    } catch (e) { $("#hi-body").innerHTML = '<p class="g-err">Lỗi: ' + esc(e.message || e) + "</p>"; }
  }
  async function histMine() {
    if (!G.me) { $("#hi-body").innerHTML = '<p class="g-sub">Bạn chưa đặt tên trên máy này.</p>'; return; }
    var r = await sb.from("game_results").select("room_id,team,score,rank,correct,wrong,best_streak,created_at,game_rooms(code,title,mode,meaning_lang,minutes,teams)").eq("player_id", G.me.id).order("created_at", { ascending: false }).limit(200);
    if (r.error) throw r.error;
    if (!r.data.length) { $("#hi-body").innerHTML = '<p class="g-sub">Bạn chưa chơi trận nào.</p>'; return; }
    var cnt = await sb.from("game_results").select("room_id").in("room_id", r.data.map(function (x) { return x.room_id; }));
    var nIn = {}; (cnt.data || []).forEach(function (x) { nIn[x.room_id] = (nIn[x.room_id] || 0) + 1; });
    var best = r.data.reduce(function (m, x) { return Math.max(m, x.score); }, 0);
    var wins = r.data.filter(function (x) { return x.rank === 1; }).length;
    var streak = r.data.reduce(function (m, x) { return Math.max(m, x.best_streak); }, 0);
    $("#hi-body").innerHTML =
      '<div class="g-stats"><div><b>' + r.data.length + '</b><span>trận</span></div><div><b>' + wins + '</b><span>lần 🥇</span></div><div><b>' + best + '</b><span>kỷ lục điểm</span></div><div><b>🔥' + streak + '</b><span>chuỗi dài nhất</span></div></div>' +
      '<table class="g-table"><thead><tr><th>Ngày</th><th>Chủ đề</th><th>Điểm</th><th>Hạng</th><th>Đúng/Sai</th></tr></thead><tbody>' +
      r.data.map(function (x) {
        var rm = x.game_rooms || {}, d = new Date(x.created_at);
        return "<tr><td>" + d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + '</td><td><a href="?room=' + esc(rm.code) + '">' + esc(rm.title || rm.code) + "</a>" +
          '<div class="g-sub">' + (FLAG[rm.meaning_lang] || "") + " " + (rm.mode === "kahoot" ? "Cùng 1 câu" : "Tự do") + (x.team && TEAMS[x.team] ? " · " + TEAMS[x.team].e + " " + TEAMS[x.team].n : "") + "</div></td><td><b>" + x.score + (x.score === best ? " 🏆" : "") + "</b></td><td>" +
          (x.rank === 1 ? "🥇" : x.rank) + "/" + (nIn[x.room_id] || "?") + "</td><td>✓" + x.correct + " ✗" + x.wrong + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  /* ---------- khởi động ---------- */
  async function loadProfile() {
    var id = null; try { id = localStorage.getItem(LS_LINK); } catch (e) {}
    if (!id) return;
    var r = await sb.from("profiles").select("id,display_name,is_admin").eq("id", id).maybeSingle();
    if (r.data) G.profile = r.data;
  }
  async function route() {
    var room = param("room"), scope = param("scope");
    if (G.view === "screen" && room) return joinRoom(room);   /* màn hình chung không cần tên */
    if (!G.me) return renderNameScreen();
    if (room) return joinRoom(room);
    await renderHome();
    /* mở từ chuột phải trong WordLoop: ?scope=<table>:<id>&title=… -> chọn sẵn */
    if (scope && G.profile && G.profile.is_admin && !picked.length) {
      var i = scope.indexOf(":");
      picked = [{ table: scope.slice(0, i), id: scope.slice(i + 1), title: param("title") || scope }];
      paintPicked();
      $$("[data-pick]").forEach(function (c) { if (c.dataset.pick === picked[0].table && c.dataset.id === picked[0].id) c.checked = true; });
    }
  }
  $("#g-mylang").addEventListener("change", function () {
    G.myLang = this.value; writeLS(LS_LANG, G.myLang);
    if (G.ch && G.me && G.view !== "screen") track();
    if (G.st && G.st.phase === "play") {
      if (G.st.mode === "kahoot" && G.st.q) { $("#p-vi").textContent = myFlag(G.st.q) + " " + myText(G.st.q); }
      else if (G.myQ) { $("#p-vi").textContent = myFlag(G.myQ) + " " + myText(G.myQ); }
    }
  });
  function defaultLang() { return "room"; }   /* mặc định theo tiếng host chọn; ai muốn thì tự đổi ở ô 🌐 */
  (async function boot() {
    G.view = param("view");
    G.myLang = readLS(LS_LANG) || defaultLang();
    $("#g-mylang").value = G.myLang;
    $("#g-mylang").hidden = G.view === "screen";
    G.me = readLS(LS_ME);
    await loadProfile().catch(function () {});
    paintMe();
    route();
  })();
})();
