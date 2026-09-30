/* game.js — 🎮 PHÒNG GAME CHƠI CHUNG (TJ 2026-09-30)
   ---------------------------------------------------------------
   Đặc tả: README.md "Việc còn dang dở" > PHÒNG GAME. Bảng: tools/game_schema.sql.
   - Chỉ admin WordLoop (đăng nhập qua link ?u=, xem auth.js) mở được phòng.
     Người chơi vào bằng link/mã phòng, chỉ cần gõ tên (máy nhớ, trùng tên -> #2, #3…).
   - Đồng bộ bằng Supabase Realtime, kênh "game:<MÃ>":
       · presence  = ai đang ở trong phòng (tên, ảnh)
       · broadcast "state" (host -> mọi người): pha, câu hỏi hiện tại, điểm, thời gian còn lại
       · broadcast "ans"   (người chơi -> host): câu trả lời
     HOST LÀ NGUỒN SỰ THẬT DUY NHẤT: chỉ host chấm điểm + đếm giờ. Host thoát giữa trận = trận dừng.
   - 2 kiểu: "kahoot" (cả phòng cùng 1 câu, đếm ngược mỗi câu) | "free" (mỗi người tự làm câu riêng).
   - Hết giờ: host lưu game_results + game_answers. Tiến trình học (word_progress) CHỈ ghi cho
     người chơi đang đăng nhập hồ sơ admin (TJ) — attempts/correct/mastered/❌wrong_open,
     KHÔNG đụng SRS/Done (giống màn Ôn riêng).
   - IM LẶNG: không có âm thanh nào, đúng/sai báo bằng màu.
   --------------------------------------------------------------- */
(function () {
  "use strict";
  var cfg = window.APP_CONFIG || {};
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var LS_ME = "tjwl_game_player_v1";
  var LS_LINK = "tjwl_link_user_id_v1";          /* hồ sơ WordLoop đăng nhập qua link (auth.js) */
  var AVATARS = ["🐣","🦊","🐼","🐨","🦁","🐯","🐸","🐙","🦉","🐝","🌟","🚀","📚","🎯","🔥","💎","🍀","⚡","🐧","🦄","🐶","🐱","🐰","🐻","🐵","🦋","🌈","🍉","🍩","🎸"];
  var MASTER_T = cfg.MASTER_THRESHOLD || 0.8, MASTER_N = cfg.MASTER_MIN_ATTEMPTS || 3;
  var REVEAL_MS = 2500, POINTS = 100;

  var G = {
    me: null,          /* {id, name, name_no, avatar} */
    profile: null,     /* {id, display_name, is_admin} nếu máy đang đăng nhập WordLoop */
    room: null, ch: null, isHost: false,
    pool: [],          /* [{wid, term, vi}] */
    roster: {},        /* pid -> {name, no, avatar} (host gom từ presence) */
    st: null,          /* state mới nhất (host tự giữ, người chơi nhận qua broadcast) */
    endAt: 0, qUntil: 0, tick: null, hostTimer: null,
    answers: [],       /* host gom: {pid, wid, term, ok, ms} */
    myQ: null, myQStart: 0, lastN: -1
  };

  /* ---------- tiện ích ---------- */
  function show(id) { document.querySelectorAll(".g-screen").forEach(function (s) { s.hidden = s.id !== id; }); }
  function norm(t) { return String(t || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmt(ms) { ms = Math.max(0, ms); var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function label(p) { return p ? esc(p.name) + (p.no > 1 ? ' <span class="g-no">#' + p.no + "</span>" : "") : "?"; }
  function avatar(a) { return a && /^https?:/.test(a) ? '<img class="g-av" src="' + esc(a) + '" alt="">' : '<span class="g-av">' + esc(a || "🐣") + "</span>"; }
  function readMe() { try { return JSON.parse(localStorage.getItem(LS_ME)); } catch (e) { return null; } }
  function saveMe() { try { localStorage.setItem(LS_ME, JSON.stringify(G.me)); } catch (e) {} }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function roomLink(code) { return location.origin + location.pathname + "?room=" + code; }

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
      saveMe(); paintMe();
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
  $("#h-go").addEventListener("click", function () { var c = $("#h-code").value.trim().toUpperCase(); if (c) joinRoom(c); });
  $("#h-code").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#h-go").click(); });
  $("#h-mode").addEventListener("change", function () { $("#h-qs-wrap").hidden = this.value !== "kahoot"; });

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
    var nbAll = null;
    var hubs = by("hubs"), nbs = by("notebooks");
    if (hubs.length || nbs.length) {
      var r = await sb.from("notebooks").select("id,hub_id,parent_notebook_id"); if (r.error) throw r.error; nbAll = r.data;
      nbAll.forEach(function (n) { if (hubs.indexOf(n.hub_id) >= 0) nbs.push(n.id); });
      /* Notebook con lồng bên trong (mọi cấp) */
      for (var grew = true; grew;) { grew = false; nbAll.forEach(function (n) { if (n.parent_notebook_id && nbs.indexOf(n.parent_notebook_id) >= 0 && nbs.indexOf(n.id) < 0) { nbs.push(n.id); grew = true; } }); }
    }
    var secs = by("sections").concat(nbs.length ? (await inIds("sections", "id", "notebook_id", nbs)).map(function (x) { return x.id; }) : []);
    var pages = by("pages").concat(secs.length ? (await inIds("pages", "id", "section_id", secs)).map(function (x) { return x.id; }) : []);
    var bats = by("batches").concat(pages.length ? (await inIds("batches", "id", "page_id", pages)).map(function (x) { return x.id; }) : []);
    var blks = by("blocks").concat(bats.length ? (await inIds("blocks", "id", "batch_id", bats)).map(function (x) { return x.id; }) : []);
    var words = blks.length ? await inIds("words", "id,term,meaning_vi,meaning_zh,meaning_es,def_en", "block_id", blks) : [];
    var seen = {}, pool = [];
    words.forEach(function (w) {
      var k = norm(w.term), m = { vi: clean(w.meaning_vi), en: clean(w.def_en), es: clean(w.meaning_es), zh: clean(w.meaning_zh) };
      if (!k || seen[k] || !(m.vi || m.en || m.es || m.zh)) return;
      seen[k] = 1; pool.push({ wid: w.id, term: String(w.term).trim(), m: m });
    });
    return pool;
  }
  function clean(t) { return String(t || "").trim(); }
  var FLAG = { vi: "🇻🇳", en: "🇺🇸", es: "🇪🇸", zh: "🇨🇳" };
  function poolFor(lang) { return G.pool.filter(function (x) { return x.m[lang]; }); }
  function poolCounts() { return ["vi", "en", "es", "zh"].map(function (l) { return FLAG[l] + " " + poolFor(l).length; }).join(" · "); }
  /* "xào bài": hỏi lần lượt hết các từ (thứ tự ngẫu nhiên) rồi mới lặp lại — tránh 2 câu liền nhau trùng từ */
  var deck = { key: "", list: [] };
  function makeQ(lang) {
    var p = poolFor(lang);
    if (deck.key !== lang + p.length || !deck.list.length) deck = { key: lang + p.length, list: shuffle(p.slice()) };
    var w = deck.list.pop();
    var others = shuffle(p.filter(function (x) { return norm(x.term) !== norm(w.term) && norm(x.m[lang]) !== norm(w.m[lang]); })).slice(0, 3);
    return { wid: w.wid, vi: w.m[lang], lang: lang, ans: w.term, opts: shuffle([w.term].concat(others.map(function (x) { return x.term; }))) };
  }

  /* ---------- 3. vào phòng ---------- */
  async function joinRoom(code) {
    code = code.toUpperCase();
    var r = await sb.from("game_rooms").select("*").eq("code", code).maybeSingle();
    if (r.error || !r.data) { show("s-home"); $("#h-err").textContent = "Không tìm thấy phòng " + code + "."; return; }
    G.room = r.data;
    G.isHost = !!(G.profile && G.profile.is_admin && G.profile.id === G.room.host_id);
    if (G.room.status === "ended") return showSavedResults();
    $("#g-room-badge").hidden = false; $("#g-room-badge").textContent = "Phòng " + code;
    if (G.isHost || G.room.mode === "free") {
      if (!G.pool.length) { $("#l-pool").textContent = "Đang tải từ vựng…"; G.pool = await loadPool(G.room.scope); }
    }
    connect();
    renderLobby();
  }

  function connect() {
    if (G.ch) sb.removeChannel(G.ch);
    G.ch = sb.channel("game:" + G.room.code, { config: { broadcast: { self: true }, presence: { key: G.me.id } } });
    G.ch.on("presence", { event: "sync" }, onPresence);
    G.ch.on("broadcast", { event: "state" }, function (m) { onState(m.payload); });
    G.ch.on("broadcast", { event: "ans" }, function (m) { if (G.isHost) hostOnAnswer(m.payload); });
    G.ch.on("broadcast", { event: "hello" }, function () { if (G.isHost && G.st) push(); });
    G.ch.subscribe(async function (s) {
      if (s !== "SUBSCRIBED") return;
      await G.ch.track({ id: G.me.id, name: G.me.name, no: G.me.name_no, avatar: G.me.avatar, host: G.isHost });
      if (G.isHost) { if (!G.st) G.st = { phase: "lobby", mode: G.room.mode, lang: G.room.meaning_lang || "vi", minutes: +G.room.minutes, qs: G.room.q_seconds, scores: {}, roster: {} }; push(); }
      else G.ch.send({ type: "broadcast", event: "hello", payload: {} });   /* xin host gửi lại trạng thái hiện tại */
    });
  }
  function onPresence() {
    var ps = G.ch.presenceState(), list = [];
    Object.keys(ps).forEach(function (k) { var p = ps[k][0]; if (p) list.push(p); });
    G.online = list;
    if (G.isHost && G.st) {
      list.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
      push();
    }
    if (G.st && G.st.phase === "lobby") paintLobbyPlayers();
  }

  /* ---------- phòng chờ ---------- */
  function renderLobby() {
    show("s-lobby");
    $("#l-code").textContent = G.room.code;
    $("#l-info").textContent = "Từ vựng: " + (G.room.title || "") + (G.pool.length ? " · " + G.pool.length + " từ" : "");
    $("#l-host").hidden = !G.isHost; $("#l-wait").hidden = G.isHost;
    if (G.isHost) {
      $("#l-mode").value = G.room.mode; $("#l-min").value = G.room.minutes; $("#l-qs").value = G.room.q_seconds; $("#l-lang").value = G.room.meaning_lang || "vi";
      $("#l-qs-wrap").hidden = G.room.mode !== "kahoot";
      $("#l-pool").textContent = G.pool.length + " từ khác nhau · có nghĩa: " + poolCounts();
    }
    paintLobbyPlayers();
  }
  function paintLobbyPlayers() {
    var list = G.online || [];
    $("#l-count").textContent = list.length;
    $("#l-players").innerHTML = list.map(function (p) {
      return '<div class="g-player">' + avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (p.host ? '<span class="g-tag">Host</span>' : "") + "</div>";
    }).join("");
  }
  $("#l-copy").addEventListener("click", function () {
    var link = roomLink(G.room.code), b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { b.textContent = "✓ Đã copy link"; }, function () { prompt("Copy link này:", link); });
    setTimeout(function () { b.textContent = "🔗 Copy link mời"; }, 2000);
  });
  ["#l-mode", "#l-min", "#l-qs", "#l-lang"].forEach(function (s) {
    $(s).addEventListener("change", function () {
      if (!G.isHost) return;
      G.st.mode = $("#l-mode").value; G.st.lang = $("#l-lang").value; G.st.minutes = Math.max(1, +$("#l-min").value || 5); G.st.qs = Math.max(5, +$("#l-qs").value || 15);
      $("#l-qs-wrap").hidden = G.st.mode !== "kahoot";
      sb.from("game_rooms").update({ mode: G.st.mode, meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs }).eq("id", G.room.id).then(function () {});
      push();
    });
  });

  /* ---------- HOST: điều khiển trận ---------- */
  function push() {   /* gửi trạng thái; thời gian gửi dạng "còn lại bao nhiêu ms" để khỏi lệch đồng hồ giữa các máy */
    var s = Object.assign({}, G.st, { left: G.endAt ? G.endAt - Date.now() : null, qLeft: G.qUntil ? G.qUntil - Date.now() : null });
    if (s.q) s.q = { n: s.q.n, vi: s.q.vi, lang: s.q.lang, opts: s.q.opts, wid: s.q.wid, ans: s.q.revealed ? s.q.ans : null, revealed: !!s.q.revealed };
    G.ch.send({ type: "broadcast", event: "state", payload: s });
  }
  $("#l-start").addEventListener("click", async function () {
    if (!G.isHost) return;
    if (poolFor(G.st.lang).length < 4) { alert("Cần ít nhất 4 từ có nghĩa bằng tiếng đã chọn (" + poolCounts() + ")."); return; }
    G.st.phase = "play"; G.st.scores = {}; G.answers = [];
    (G.online || []).forEach(function (p) { G.st.scores[p.id] = { s: 0, c: 0, w: 0, st: 0, best: 0 }; });
    G.endAt = Date.now() + G.st.minutes * 60000;
    await sb.from("game_rooms").update({ status: "playing", started_at: new Date().toISOString(), mode: G.st.mode, minutes: G.st.minutes, q_seconds: G.st.qs }).eq("id", G.room.id);
    if (G.st.mode === "kahoot") hostNextQ(); else { G.st.q = null; G.qUntil = 0; push(); }
    clearInterval(G.hostTimer);
    G.hostTimer = setInterval(hostTick, 250);
  });
  $("#p-stop").addEventListener("click", function () { if (G.isHost && confirm("Kết thúc trận ngay?")) hostEnd(); });
  function hostNextQ() {
    var q = makeQ(G.st.lang);
    G.st.q = { n: (G.st.q ? G.st.q.n : 0) + 1, vi: q.vi, lang: q.lang, opts: q.opts, ans: q.ans, wid: q.wid, revealed: false, got: {} };
    G.qUntil = Date.now() + G.st.qs * 1000;
    push();
  }
  function hostTick() {
    var now = Date.now();
    if (now >= G.endAt) {
      if (G.st.mode === "kahoot" && G.st.q && !G.st.q.revealed) return hostReveal();   /* chấm nốt câu đang dở */
      if (G.st.mode !== "kahoot" || !G.revealUntil || now >= G.revealUntil) return hostEnd();
      return;
    }
    if (G.st.mode !== "kahoot" || !G.st.q) return;
    if (!G.st.q.revealed) {
      var online = (G.online || []).length, got = Object.keys(G.st.q.got).length;
      if (now >= G.qUntil || (online && got >= online)) hostReveal();
    } else if (now >= G.revealUntil) hostNextQ();
  }
  function hostReveal() {
    G.st.q.revealed = true; G.revealUntil = Date.now() + REVEAL_MS; G.qUntil = 0;
    /* ai không trả lời câu này thì mất streak */
    Object.keys(G.st.scores).forEach(function (pid) { if (!G.st.q.got[pid]) G.st.scores[pid].st = 0; });
    push();
  }
  function score(pid, ok) {
    var s = G.st.scores[pid] || (G.st.scores[pid] = { s: 0, c: 0, w: 0, st: 0, best: 0 });
    if (ok) { s.s += POINTS; s.c++; s.st++; s.best = Math.max(s.best, s.st); } else { s.w++; s.st = 0; }
  }
  function hostOnAnswer(a) {
    if (!G.st || G.st.phase !== "play") return;
    if (G.st.mode === "kahoot") {
      var q = G.st.q;
      if (!q || q.revealed || a.n !== q.n || q.got[a.pid]) return;   /* mỗi người 1 lần / câu */
      var ok = norm(a.choice) === norm(q.ans);
      q.got[a.pid] = ok; score(a.pid, ok);
      G.answers.push({ pid: a.pid, wid: q.wid, term: q.ans, ok: ok, ms: a.ms });
    } else {
      score(a.pid, !!a.ok);
      G.answers.push({ pid: a.pid, wid: a.wid, term: a.term, ok: !!a.ok, ms: a.ms });
    }
    push();
  }
  async function hostEnd() {
    if (G.st.phase === "end") return;
    clearInterval(G.hostTimer);
    G.st.phase = "end"; G.st.q = null; G.endAt = 0; G.qUntil = 0;
    push();
    try {
      var ranked = rankList(G.st.scores);
      if (ranked.length) {
        var rr = await sb.from("game_results").upsert(ranked.map(function (x) {
          return { room_id: G.room.id, player_id: x.pid, team: null, score: x.s, correct: x.c, wrong: x.w, best_streak: x.best, rank: x.rank };
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
    var list = Object.keys(scores).map(function (pid) { return Object.assign({ pid: pid }, scores[pid]); })
      .sort(function (a, b) { return b.s - a.s || b.c - a.c || a.w - b.w; });
    list.forEach(function (x, i) { x.rank = i > 0 && x.s === list[i - 1].s && x.c === list[i - 1].c ? list[i - 1].rank : i + 1; });
    return list;
  }

  /* ---------- MỌI NGƯỜI: nhận trạng thái ---------- */
  function onState(s) {
    var was = G.st && G.st.phase;
    if (!G.isHost) G.st = s;
    if (s.left != null) G.endAt = Date.now() + s.left;
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
    $("#p-mode").textContent = (FLAG[s.lang] || "") + " " + (s.mode === "kahoot" ? "Cùng 1 câu · " + s.qs + " giây/câu" : "Tự do — ai nhanh nhiều điểm");
    $("#p-stop").hidden = !G.isHost;
    clearInterval(G.tick);
    G.tick = setInterval(function () {
      $("#p-left").textContent = fmt(G.endAt - Date.now());
      var bar = $("#p-qbar");
      if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) {
        var tot = (G.st.qs || 15) * 1000; bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / tot * 100)) + "%";
      } else bar.style.width = "0%";
      if (G.st && G.st.mode === "free" && Date.now() >= G.endAt) lockOpts("⏱ Hết giờ — chờ host tổng kết…");
    }, 200);
    if (s.mode === "free") {
      /* host có thể đổi sang "Tự do" sau khi người chơi vào phòng -> lúc đó mới tải kho từ */
      if (G.pool.length) freeNext();
      else { $("#p-vi").textContent = "Đang tải từ vựng…"; loadPool(G.room.scope).then(function (p) { G.pool = p; freeNext(); }); }
    }
  }
  function paintBoard(s) {
    var roster = s.roster || {}, list = rankList(s.scores || {});
    $("#p-board").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + x.rank + "</span>" + avatar(p.avatar) +
        '<span class="g-pname">' + label(p) + '</span><span class="g-streak">' + (x.st > 1 ? "🔥" + x.st : "") + '</span><b class="g-score">' + x.s + "</b></li>";
    }).join("");
  }

  /* kiểu Kahoot: host gửi câu, mọi người chọn 1 lần, hết giờ mới hiện đáp án */
  function paintKahoot(s) {
    var q = s.q;
    if (q.n !== G.lastN) {
      G.lastN = q.n; G.myChoice = null; G.myQStart = Date.now();
      G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0;
      $("#p-vi").textContent = (FLAG[q.lang] || "") + " " + q.vi;
      $("#p-opts").innerHTML = q.opts.map(function (o) { return '<button class="g-opt" data-opt="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
      $("#p-msg").textContent = "";
    }
    if (q.revealed) {
      G.qUntilLocal = 0;
      document.querySelectorAll(".g-opt").forEach(function (b) {
        b.disabled = true;
        var o = b.dataset.opt;
        if (norm(o) === norm(q.ans)) b.classList.add("ok");
        else if (G.myChoice && norm(o) === norm(G.myChoice)) b.classList.add("bad");
      });
      if (!G.revealedN || G.revealedN !== q.n) {
        G.revealedN = q.n;
        var ok = G.myChoice != null && norm(G.myChoice) === norm(q.ans);
        $("#p-msg").textContent = G.myChoice == null ? "Hết giờ — đáp án: " + q.ans : ok ? "✓ Đúng! +" + POINTS : "✗ Sai — đáp án: " + q.ans;
        if (G.myChoice != null) recordMyProgress(q.wid, ok);
      }
    }
  }
  $("#p-opts").addEventListener("click", function (e) {
    var b = e.target.closest(".g-opt"); if (!b || b.disabled) return;
    var s = G.st; if (!s || s.phase !== "play") return;
    if (s.mode === "kahoot") {
      if (G.myChoice != null || !s.q || s.q.revealed) return;
      G.myChoice = b.dataset.opt;
      b.classList.add("picked");
      document.querySelectorAll(".g-opt").forEach(function (x) { x.disabled = true; });
      $("#p-msg").textContent = "Đã chọn — chờ mọi người…";
      G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, n: s.q.n, choice: G.myChoice, ms: Date.now() - G.myQStart } });
    } else freeAnswer(b);
  });

  /* kiểu tự do: mỗi máy tự sinh câu từ cùng kho, báo đúng/sai cho host chấm điểm */
  function freeNext() {
    if (Date.now() >= G.endAt) return lockOpts("⏱ Hết giờ — chờ host tổng kết…");
    if (!G.pool.length) { $("#p-vi").textContent = "Đang tải từ vựng…"; return; }
    G.myQ = makeQ(G.st.lang || "vi"); G.myQStart = Date.now();
    $("#p-vi").textContent = (FLAG[G.myQ.lang] || "") + " " + G.myQ.vi;
    $("#p-opts").innerHTML = G.myQ.opts.map(function (o) { return '<button class="g-opt" data-opt="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
    $("#p-msg").textContent = "";
  }
  function freeAnswer(b) {
    var q = G.myQ; if (!q) return;
    var ok = norm(b.dataset.opt) === norm(q.ans);
    document.querySelectorAll(".g-opt").forEach(function (x) {
      x.disabled = true;
      if (norm(x.dataset.opt) === norm(q.ans)) x.classList.add("ok");
    });
    if (!ok) b.classList.add("bad");
    $("#p-msg").textContent = ok ? "✓ +" + POINTS : "✗ " + q.ans;
    G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, ok: ok, wid: q.wid, term: q.ans, ms: Date.now() - G.myQStart } });
    recordMyProgress(q.wid, ok);
    setTimeout(freeNext, ok ? 450 : 1100);
  }
  function lockOpts(msg) { document.querySelectorAll(".g-opt").forEach(function (x) { x.disabled = true; }); $("#p-msg").textContent = msg; }

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

  /* ---------- kết quả ---------- */
  function renderEnd(s) {
    show("s-end");
    $("#e-info").textContent = (G.room.title || "") + " · " + (s.mode === "kahoot" ? "Cùng 1 câu" : "Tự do") + " · " + s.minutes + " phút";
    var roster = s.roster || {};
    $("#e-board").innerHTML = rankList(s.scores || {}).map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + (x.rank === 1 ? "🥇" : x.rank === 2 ? "🥈" : x.rank === 3 ? "🥉" : x.rank) + "</span>" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + '</span><span class="g-sub">✓' + x.c + " ✗" + x.w + " 🔥" + x.best + '</span><b class="g-score">' + x.s + "</b></li>";
    }).join("") || '<li class="g-sub">Chưa ai trả lời câu nào.</li>';
  }
  async function showSavedResults() {
    var r = await sb.from("game_results").select("player_id,score,correct,wrong,best_streak,rank,game_players(name,name_no,avatar)").eq("room_id", G.room.id).order("rank");
    var scores = {}, roster = {};
    (r.data || []).forEach(function (x) {
      scores[x.player_id] = { s: x.score, c: x.correct, w: x.wrong, st: 0, best: x.best_streak };
      var p = x.game_players || {}; roster[x.player_id] = { name: p.name, no: p.name_no, avatar: p.avatar };
    });
    renderEnd({ mode: G.room.mode, minutes: G.room.minutes, scores: scores, roster: roster });
  }

  /* ---------- khởi động ---------- */
  async function loadProfile() {
    var id = null; try { id = localStorage.getItem(LS_LINK); } catch (e) {}
    if (!id) return;
    var r = await sb.from("profiles").select("id,display_name,is_admin").eq("id", id).maybeSingle();
    if (r.data) G.profile = r.data;
  }
  async function route() {
    if (!G.me) return renderNameScreen();
    var room = param("room"), scope = param("scope");
    if (room) return joinRoom(room);
    await renderHome();
    /* mở từ chuột phải trong WordLoop: ?scope=<table>:<id>&title=… -> chọn sẵn */
    if (scope && G.profile && G.profile.is_admin && !picked.length) {
      var i = scope.indexOf(":");
      picked = [{ table: scope.slice(0, i), id: scope.slice(i + 1), title: param("title") || scope }];
      paintPicked();
      document.querySelectorAll("[data-pick]").forEach(function (c) { if (c.dataset.pick === picked[0].table && c.dataset.id === picked[0].id) c.checked = true; });
    }
  }
  (async function boot() {
    G.me = readMe();
    await loadProfile().catch(function () {});
    paintMe();
    route();
  })();
})();
