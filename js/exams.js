/* exams.js — 🧩 CÁC MÔN "ĐỀ/TÌNH HUỐNG" NGOÀI TOEIC trong phòng game (docs/EXAMS_PLAN.md, docs/EXAMS_HOOKS.md).
   Nạp TRƯỚC js/game.js. game.js chỉ gọi vài móc nhỏ: `window.Exams[<môn>]`; thiếu file này thì TOEIC/game từ vựng chạy y như cũ.

   Khuôn 1 môn (đăng ký vào window.Exams[id]) — thêm EA / IELTS sau này theo cùng khuôn:
     id, prefix        tên môn; tiền tố của game_answers.term ("dm:<đề>:<part>:<câu>"; TOEIC giữ "toeic:")
     file              đề nằm FILE TĨNH cùng origin (không nạp bảng test_items) -> mọi máy trong phòng tải cùng 1 file
     label, modes      nhãn nút hub + danh sách chế độ (mỗi chế độ = 1 part, hoặc "mix" = trộn)
     listening(part)   có phải part Nghe không (game.js dùng thay cho `part<=4`) — DM: luôn false
     load()            tải đề (có cache) -> Promise<mảng câu>
     select(items, o)  LỌC theo chế độ + TRỘN theo seed (hàm thuần, test bằng Node: tools/test_exams.js)
     paintHub(el, o)   vẽ form vào hộp #l-hub-<môn>;   readForm(el) đọc lại các lựa chọn
     introHTML(L,…)    phòng chờ của người chơi;       levelBadge/refsHTML  nhãn 🟢🟡🔴 + căn cứ ở phần lời giải
   Nhãn riêng của môn: vi + en (ngôn ngữ khác rơi về en). Nhãn chung (điểm, đội…) dùng từ điển của game. */
(function (root) {
  "use strict";
  var Exams = root.Exams = root.Exams || {};

  /* ---------- tiện ích thuần ---------- */
  function pick(map, lang) { return (map && (map[lang] || map.en || map.vi)) || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* xáo trộn có hạt giống (mulberry32): cùng seed -> cùng thứ tự trên MỌI máy (ván Đua: mỗi máy tự dựng câu từ cùng danh sách) */
  function rng(seed) { var a = (+seed || 0) >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(list, seed) {
    var a = list.slice(), r = rng(seed);
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ============================================================
     🕵️ DIGITAL MARKETING — "Thám tử Marketing" (chính đạo / xám đạo / tà đạo)
     ============================================================ */
  var DM_MODES = [
    { k: "p1", part: 1, label: { vi: "🕵️ Phân loại — chính / xám / tà đạo", en: "🕵️ Classify — fair / grey / deceptive" } },
    { k: "p2", part: 2, label: { vi: "🔍 Nhận ra chiêu — tên kỹ thuật", en: "🔍 Spot the tactic" } },
    { k: "p3", part: 3, label: { vi: "⚖️ Tư vấn — sếp/khách nhờ bạn", en: "⚖️ Advise — a boss/client asks you" } },
    { k: "p4", part: 4, label: { vi: "🛝 Trượt dốc — chiến dịch lách dần", en: "🛝 Slippery slope — a campaign drifting" } },
    { k: "p5", part: 5, label: { vi: "📊 Số liệu giả — bắt con số", en: "📊 Fake numbers — catch the claim" } },
    { k: "mix", part: 0, label: { vi: "🎲 Trộn tất cả", en: "🎲 Mix everything" } }
  ];
  var DM_LEVELS = {
    chinh: { icon: "🟢", cls: "g-lvl-chinh", label: { vi: "Chính đạo", en: "Fair play" }, hint: { vi: "đúng sự thật, minh bạch, tôn trọng lựa chọn", en: "truthful, transparent, respects choice" } },
    xam:   { icon: "🟡", cls: "g-lvl-xam",   label: { vi: "Xám đạo", en: "Grey zone" },   hint: { vi: "không nói dối trắng trợn nhưng lách/giấu/nhấn quá", en: "no outright lie, but bends, hides or overstates" } },
    ta:    { icon: "🔴", cls: "g-lvl-ta",    label: { vi: "Tà đạo", en: "Deceptive" },    hint: { vi: "nói dối, gây hại hoặc vi phạm luật/điều khoản", en: "lies, harms, or breaks law/platform rules" } }
  };
  var DM_T = {
    mode: { vi: "Chế độ", en: "Mode" },
    play: { vi: "Kiểu chơi", en: "Play style" },
    kahoot: { vi: "Cùng 1 câu (kiểu Kahoot) — xong mỗi câu xem lời giải", en: "Same question for all (Kahoot) — explanation after each" },
    race: { vi: "⚡ Đua tốc độ — tổng giờ cố định, chọn là chốt", en: "⚡ Speed race — fixed total time, first pick is final" },
    qs: { vi: "Giây mỗi câu", en: "Seconds per question" },
    scoring: { vi: "Cách tính điểm", en: "Scoring" },
    sq: { vi: "Theo câu — đúng +100", en: "Per question — correct +100" },
    ss: { vi: "Theo tốc độ — đúng 100 → 50", en: "By speed — correct 100 → 50" },
    teams: { vi: "Hình thức thi đấu", en: "Teams" },
    t0: { vi: "Chơi lẻ", en: "Solo" }, t2: { vi: "2 đội", en: "2 teams" }, t3: { vi: "3 đội", en: "3 teams" }, t4: { vi: "4 đội", en: "4 teams" },
    hostplay: { vi: "Host cũng chơi", en: "Host plays too" },
    start: { vi: "▶ Bắt đầu", en: "▶ Start" },
    about: { vi: "Mỗi câu là một <b>tình huống thật ở Việt Nam</b> (Facebook, Zalo, TikTok, Shopee, Google…). Dùng <b>4 câu kiểm tra</b> để nhận ra đâu là thu hút đúng cách, đâu là lừa dối.", en: "Each question is a <b>real-world Vietnamese situation</b> (Facebook, Zalo, TikTok, Shopee, Google…). Use the <b>4 checks</b> to tell honest attraction from deception." },
    nodata: { vi: "Không tải được đề Thám tử Marketing — kiểm tra mạng rồi thử lại.", en: "Could not load the Marketing Detective questions — check your connection and try again." },
    ready: { vi: " câu sẵn sàng.", en: " questions ready." }
  };
  var DM_INTRO = {
    vi: { h: "🕵️ Phòng đang chơi Thám tử Marketing", what: "Đọc một tình huống marketing thật ở Việt Nam, rồi quyết định: đây là thu hút đúng cách hay lừa dối? Không có đáp án “thuộc lòng” — chỉ cần 4 câu kiểm tra.",
      checks: "🔎 4 câu kiểm tra", c: ["Sự thật — điều quảng cáo nói có đúng không?", "Minh bạch — có giấu điều khoản, hay giấu “đây là quảng cáo” không?", "Tự nguyện — khách tự quyết và rút lui có dễ không?", "Hậu quả — nếu khách biết hết sự thật, họ còn mua không?"],
      lv: "🚦 3 mức", wait: "Chờ host chọn chế độ và bấm Bắt đầu" },
    en: { h: "🕵️ The room is playing Marketing Detective", what: "Read a real Vietnamese marketing situation, then decide: honest attraction or deception? No memorising — just the 4 checks.",
      checks: "🔎 The 4 checks", c: ["Truth — is what the ad claims actually true?", "Transparency — are terms or “this is an ad” hidden?", "Voluntary — does the customer decide freely and leave easily?", "Consequence — if they knew everything, would they still buy?"],
      lv: "🚦 3 levels", wait: "Waiting for the host to pick a mode and start" }
  };

  var dm = Exams.dm = {
    id: "dm", prefix: "dm", icon: "🕵️",
    file: "data/exams/dm_items.json",
    label: { vi: "🕵️ Marketing", en: "🕵️ Marketing" },
    title: { vi: "🕵️ Thám tử Marketing", en: "🕵️ Marketing Detective" },
    modes: DM_MODES, levels: DM_LEVELS,
    defaultQs: 45,           /* có đoạn tình huống để đọc -> 45 giây/câu */
    revealMs: 18000,         /* Kahoot: giữ lời giải trên màn hình đủ lâu để đọc */
    listening: function () { return false; },   /* không có part Nghe/audio */
    parts: function (mode) { var m = DM_MODES.filter(function (x) { return x.k === mode; })[0]; return !m ? [] : m.part ? [m.part] : [1, 2, 3, 4, 5]; },
    modeLabel: function (mode, lang) { var m = DM_MODES.filter(function (x) { return x.k === mode; })[0]; return m ? pick(m.label, lang) : ""; },

    /* LỌC theo chế độ rồi TRỘN theo seed. mode "p1".."p5": đúng part đó; "mix": cả 5 part. Không đổi mảng gốc.
       Chế độ 1 part giữ thứ tự câu (1,2,3…) nếu không có seed; có seed thì xáo. */
    select: function (items, o) {
      o = o || {};
      var parts = o.parts && o.parts.length ? o.parts : dm.parts(o.mode);
      var out = (items || []).filter(function (x) { return x && parts.indexOf(+x.part) >= 0; });
      out.sort(function (a, b) { return (+a.part - +b.part) || (+a.num - +b.num); });
      return o.seed != null ? shuffle(out, o.seed) : out;
    },
    /* hợp lệ về cấu trúc? trả về danh sách lỗi (rỗng = tốt) — dùng cho test + kiểm tra lúc tải */
    validate: function (items) {
      var errs = [], seen = {};
      (items || []).forEach(function (x, i) {
        var w = "câu #" + (i + 1) + " (" + (x && x.id) + ")";
        if (!x || !x.id) return errs.push(w + ": thiếu id");
        if (seen[x.id]) errs.push(w + ": trùng id"); seen[x.id] = 1;
        if (x.exam !== "dm") errs.push(w + ": exam ≠ dm");
        if (!(x.part >= 1 && x.part <= 5)) errs.push(w + ": part ngoài 1–5");
        if (!Array.isArray(x.opts) || x.opts.length < 3 || x.opts.length > 4) errs.push(w + ": số đáp án ≠ 3–4");
        else if (!/^[A-D]$/.test(String(x.answer)) || "ABCD".indexOf(x.answer) >= x.opts.length) errs.push(w + ": đáp án không hợp lệ");
        else if (!new RegExp("^\\(" + x.answer + "\\)\\s").test(x.opts["ABCD".indexOf(x.answer)])) errs.push(w + ": đáp án không khớp tiền tố (A)–(D)");
        if (!x.stem || !x.passage) errs.push(w + ": thiếu stem/passage");
        var m = x.i18n && x.i18n.meta; if (!m || !DM_LEVELS[m.level]) errs.push(w + ": level không hợp lệ");
        if (!(x.i18n && x.i18n.vi && x.i18n.vi.explain && x.i18n.en && x.i18n.en.explain)) errs.push(w + ": thiếu lời giải vi/en");
      });
      return errs;
    },

    /* tải đề từ file tĩnh (cùng origin), CÓ CACHE: nhiều lần gọi chỉ tải 1 lần; lỗi mạng -> [] và lần sau thử lại */
    load: function () {
      if (dm._p) return dm._p;
      var f = root.fetch ? root.fetch(dm.file, { cache: "no-cache" }) : Promise.reject(new Error("no fetch"));
      dm._p = f.then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (a) { if (!Array.isArray(a) || !a.length) throw new Error("empty"); return a; })
        .catch(function (e) { dm._p = null; if (root.console) console.warn("Exams.dm.load", e && e.message); return []; });
      return dm._p;
    },

    /* nhãn mức 🟢🟡🔴 + căn cứ — hiện ở phần lời giải (toeicExpl) */
    levelBadge: function (meta, lang) {
      var L = meta && DM_LEVELS[meta.level]; if (!L) return "";
      return '<div class="g-lvlrow"><span class="g-lvl ' + L.cls + '">' + L.icon + " " + esc(pick(L.label, lang)) + '</span><span class="g-sub">' + esc(pick(L.hint, lang)) + "</span></div>";
    },
    refsHTML: function (meta, lang) {
      var r = meta && meta.refs; if (!r || !r.length) return "";
      return '<div class="g-sub g-lvlref">📎 ' + esc(r.join(" · ")) + "</div>";
    },

    /* ----- form hub (vẽ vào #l-hub-dm). Chỉ những gì dùng tới: Chế độ · Kiểu chơi · Giây/câu · Điểm · Đội · Host chơi ----- */
    readForm: function (el) {
      var g = function (id) { return el && el.querySelector("#" + id); };
      return { mode: g("dm-mode") ? g("dm-mode").value : "p1", play: g("dm-play") ? g("dm-play").value : "kahoot",
        qs: Math.max(5, Math.min(300, +(g("dm-qs") && g("dm-qs").value) || dm.defaultQs)), scoring: g("dm-scoring") ? g("dm-scoring").value : "q",
        teams: g("dm-teams") ? +g("dm-teams").value : 0, hostplay: g("dm-hostplay") ? !!g("dm-hostplay").checked : true };
    },
    paintHub: function (el, o) {
      o = o || {}; var L = o.lang || "vi", t = function (k) { return pick(DM_T[k], L); };
      var old = el.querySelector("#dm-mode") ? dm.readForm(el) : null, v = Object.assign({ mode: "p1", play: "kahoot", qs: dm.defaultQs, scoring: o.scoring || "q", teams: o.teams || 0, hostplay: o.hostplay !== false }, old || {});
      var sel = function (id, label, opts, cur) {
        return '<label>' + label + ' <select id="' + id + '">' + opts.map(function (x) { return '<option value="' + x[0] + '"' + (String(x[0]) === String(cur) ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + "</select></label>";
      };
      el.dataset.lang = L;
      el.innerHTML = '<div class="g-tplay"><div class="g-settings">' +
        sel("dm-mode", esc(t("mode")), DM_MODES.map(function (m) { return [m.k, pick(m.label, L)]; }), v.mode) +
        sel("dm-play", esc(t("play")), [["kahoot", t("kahoot")], ["race", t("race")]], v.play) +
        '<label>' + esc(t("qs")) + ' <input id="dm-qs" type="number" min="5" max="300" value="' + v.qs + '"></label>' +
        sel("dm-scoring", esc(t("scoring")), [["q", t("sq")], ["speed", t("ss")]], v.scoring) +
        sel("dm-teams", esc(t("teams")), [[0, t("t0")], [2, t("t2")], [3, t("t3")], [4, t("t4")]], v.teams) +
        '<label class="g-check"><input type="checkbox" id="dm-hostplay"' + (v.hostplay ? " checked" : "") + "> " + esc(t("hostplay")) + "</label></div>" +
        '<div class="g-row"><button class="g-btn" id="dm-start" type="button">' + esc(t("start")) + '</button></div><p class="g-sub" id="dm-info"></p></div>' +
        '<p class="g-sub">' + t("about") + "</p>" +
        '<div class="g-lvlguide">' + ["chinh", "xam", "ta"].map(function (k) { var l = DM_LEVELS[k]; return '<div><span class="g-lvl ' + l.cls + '">' + l.icon + " " + esc(pick(l.label, L)) + "</span> " + esc(pick(l.hint, L)) + "</div>"; }).join("") + "</div>";
    },
    msg: function (k, lang) { return pick(DM_T[k], lang); },

    /* phòng chờ của người chơi (cùng class với TINTRO của TOEIC) */
    introHTML: function (lang, title) {
      var X = DM_INTRO[lang] || DM_INTRO.en;
      return '<h3 class="g-tih">' + esc(X.h) + "</h3>" + (title ? '<div class="g-tit">' + esc(title) + "</div>" : "") +
        '<p class="g-tiw">' + esc(X.what) + '</p><div class="g-tih2">' + esc(X.checks) + '</div><ul class="g-til">' + X.c.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
        '<div class="g-tih2">' + esc(X.lv) + '</div><div class="g-lvlguide">' + ["chinh", "xam", "ta"].map(function (k) { var l = DM_LEVELS[k]; return '<div><span class="g-lvl ' + l.cls + '">' + l.icon + " " + esc(pick(l.label, lang)) + "</span> " + esc(pick(l.hint, lang)) + "</div>"; }).join("") + "</div>" +
        '<p class="g-sub g-waitdots">' + esc(X.wait) + "</p>";
    }
  };

  Exams._util = { shuffle: shuffle, rng: rng, pick: pick };
  if (typeof module !== "undefined" && module.exports) module.exports = Exams;
})(typeof window !== "undefined" ? window : globalThis);
