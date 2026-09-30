/* game.js — 🎮 PHÒNG GAME CHƠI CHUNG (TJ 2026-09-30)
   ---------------------------------------------------------------
   Đặc tả: README.md "Việc còn dang dở" > PHÒNG GAME. Bảng: tools/game_schema.sql.
   - Chỉ admin WordLoop (đăng nhập qua link ?u=, xem auth.js) làm host + bấm Bắt đầu.
     PHÒNG CỐ ĐỊNH (TJ 2026-09-30): mỗi host 1 phòng dùng mãi (phòng mới nhất của host trong game_rooms,
     chưa có thì tự tạo) — mã/link KHÔNG đổi. Người chơi vào link rồi ngồi chờ; host chọn CHỦ ĐỀ, dạng câu,
     chơi lẻ/đội NGAY TRONG PHÒNG CHỜ (sau khi thấy có bao nhiêu người). Mỗi lần bấm Bắt đầu = 1 VÁN
     (game_matches, kết quả gắn match_id); hết ván host bấm "🔁 Ván mới" -> cả phòng về phòng chờ.
     Chuột phải "🎮 Mở phòng game" trong WordLoop = mở phòng cố định đó với chủ đề chọn sẵn.
     Người chơi chỉ cần gõ tên (máy nhớ, trùng tên -> #2, #3…).
   - Đồng bộ bằng Supabase Realtime, kênh "game:<MÃ>":
       · presence  = ai đang ở trong phòng (tên, ảnh, có chơi không, tiếng)
       · broadcast "state" (host -> mọi người): pha, câu hỏi, điểm, đội, thời gian còn lại
       · broadcast "ans"   (người chơi -> host): câu trả lời
       · broadcast "hello" (người mới vào / màn hình chung -> host): xin gửi lại trạng thái
     HOST LÀ NGUỒN SỰ THẬT DUY NHẤT: chỉ host chấm điểm + đếm giờ, gửi nhịp 3s/lần.
     Host tải lại trang giữa trận -> khôi phục từ localStorage (tjwl_game_host_<MÃ>), không mất điểm.
   - 2 kiểu: "kahoot" (cả phòng cùng 1 câu) | "free" (mỗi người tự làm câu riêng).
   - 3 dạng câu (host chọn, hoặc trộn): "meaning" nghĩa -> chọn từ | "gap" điền chỗ trống câu trong
     BÀI ĐỌC của Block (blocks.context_passage, [term] đánh dấu — cùng cách tách câu với
     Context.gapSentences) | "recall" gõ từ tiếng Anh từ nghĩa (Active Recall, chấm như w.normalizeAnswer).
   - Điểm TÍNH THEO CÂU (TJ 2026-09-30): đúng +100, sai/bỏ = 0. Chuỗi 🔥 chỉ để xem, không nhân điểm.
     (⚡ "nhanh nhất" chỉ để khoe, không cộng điểm — phần liên quan thời gian để sau.)
   - Đội: host chọn 2-4 đội, chia đều tự động hoặc bấm tên để đổi đội; điểm đội = TỔNG
     (đội lệch số người thì hiện thêm điểm trung bình).
   - Mỗi người chọn TIẾNG CỦA MÌNH (ô 🌐): đổi chữ giao diện + tiếng của nghĩa. Host 🔒 ép thì nghĩa
     cả phòng 1 tiếng (giao diện vẫn theo từng người). Cả phòng luôn cùng câu + cùng đáp án tiếng Anh.
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
  var LS_LANG = "tjwl_game_lang_v1";             /* tiếng người chơi chọn (riêng máy): room | vi | en | es | zh */
  var META_SEP = "\n<<<TJWL_META>>>\n";          /* = Context.META_SEP (js/context.js) */
  var AVATARS = ["🐣","🦊","🐼","🐨","🦁","🐯","🐸","🐙","🦉","🐝","🌟","🚀","📚","🎯","🔥","💎","🍀","⚡","🐧","🦄","🐶","🐱","🐰","🐻","🐵","🦋","🌈","🍉","🍩","🎸"];
  var TEAM_C = [null, { c: "#d9695f", e: "🔴", k: "team_red" }, { c: "#5b9bd9", e: "🔵", k: "team_blue" }, { c: "#4fae82", e: "🟢", k: "team_green" }, { c: "#d9a03c", e: "🟡", k: "team_yellow" }];
  var FLAG = { vi: "🇻🇳", en: "🇺🇸", es: "🇪🇸", zh: "🇨🇳" };
  var MASTER_T = cfg.MASTER_THRESHOLD || 0.8, MASTER_N = cfg.MASTER_MIN_ATTEMPTS || 3;
  var DEFAULT_ROOM = "TJ";
  /* CHỈ hồ sơ TJ được làm host + ghi tiến trình học từ game (TJ chốt 2026-09-30). KHÔNG dùng is_admin:
     WordLoop có 2 admin (TJ + Anti_TJ) — Anti_TJ vào game chỉ là người chơi thường. */
  var HOST_PROFILE_ID = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf";
  function isTJ() { return !!(G.profile && G.profile.id === HOST_PROFILE_ID); }   /* 1 link duy nhất cho tất cả: game.html (không tham số) = phòng của TJ */
  var POINTS = 100, REVEAL_MS = 3500, HOST_LOST_MS = 7000, HEARTBEAT_MS = 3000;

  /* ---------- chữ giao diện 4 tiếng (người chơi); phần cài đặt của host để tiếng Việt ---------- */
  var UI = {
    vi: { lang_room: "🌐 Theo phòng", name_h: "Bạn tên gì?", name_sub: "Máy này sẽ nhớ tên cho lần sau — không cần email.", name_ph: "Nhập tên…", avatar_h: "Chọn ảnh đại diện", upload: "📷 Tải ảnh của bạn", save: "Lưu & tiếp tục →", need_name: "Nhập tên trước nhé.", saving: "Đang lưu…", uploading: "Đang tải ảnh…", not_image: "File này không phải ảnh.",
      join_h: "Vào phòng", code_ph: "MÃ PHÒNG", go: "Vào", hist_btn: "📜 Lịch sử & Xếp hạng", no_room: "Không tìm thấy phòng {c}.", room: "Phòng", room_code: "Mã phòng", copy_link: "🔗 Copy link mời", copied: "✓ Đã copy", screen_btn: "📺 Màn hình chung", players: "Người chơi", vocab: "Từ vựng", wait_host: "Chờ host bắt đầu…", host_away: "Host chưa vào phòng — xem trước, chờ host tới nhé.", wait_next: "Chờ host mở ván mới…", host_lost: "⚠ Host mất kết nối — chờ host quay lại…",
      m_kahoot: "Cùng 1 câu", m_free: "Tự do", sec_q: "giây/câu", q_meaning: "Chọn từ tiếng Anh đúng nghĩa", q_gap: "Chọn từ điền vào chỗ trống", q_recall: "Gõ từ tiếng Anh của nghĩa này", type_ph: "Gõ từ tiếng Anh…", submit: "Gửi",
      picked: "Đã trả lời — chờ mọi người…", answered: "{n} người đã trả lời", right: "✓ Đúng! +{p}", wrong: "✗ Sai — đáp án: {a}", timeout: "⏱ Hết giờ — đáp án: {a}", answer: "Đáp án: {a}", fastest: "⚡ Nhanh nhất: {n}", n_right: "{n} người đúng", time_up: "⏱ Hết giờ — chờ tổng kết…", loading: "Đang tải từ vựng…", mc: "Bạn đang làm MC — mở 📺 Màn hình chung để cả nhóm cùng xem.",
      results: "🏁 Kết quả", back: "← Về trang game", nobody: "Chưa ai trả lời câu nào.", ppl: "người", avg: "TB", team_red: "Đội Đỏ", team_blue: "Đội Xanh", team_green: "Đội Lá", team_yellow: "Đội Vàng", click_team: "· host bấm tên để đổi đội",
      tab_me: "Của tôi", tab_week: "Tuần này", tab_all: "Mọi thời gian", h_player: "Người chơi", h_total: "Tổng điểm", h_games: "Trận", h_best: "Cao nhất", h_acc: "Đúng", h_date: "Ngày", h_topic: "Chủ đề", h_score: "Điểm", h_rank: "Hạng", h_rw: "Đúng/Sai",
      s_games: "trận", s_wins: "lần 🥇", s_best: "kỷ lục điểm", s_streak: "chuỗi dài nhất", no_name: "Bạn chưa đặt tên trên máy này.", no_games: "Bạn chưa chơi trận nào.", no_week: "Chưa có trận nào trong 7 ngày qua.", no_all: "Chưa có trận nào.", loading2: "Đang tải…", join_at: "Vào phòng tại", race: "🏁 Đua tự do!", ended: "🏁 Kết thúc!", q_no: "Câu {n}", err: "Lỗi" },
    en: { lang_room: "🌐 Room language", name_h: "What's your name?", name_sub: "This device will remember you next time — no email needed.", name_ph: "Enter your name…", avatar_h: "Choose an avatar", upload: "📷 Upload your photo", save: "Save & continue →", need_name: "Please enter a name.", saving: "Saving…", uploading: "Uploading…", not_image: "That file is not an image.",
      join_h: "Join a room", code_ph: "ROOM CODE", go: "Join", hist_btn: "📜 History & Rankings", no_room: "Room {c} not found.", room: "Room", room_code: "Room code", copy_link: "🔗 Copy invite link", copied: "✓ Copied", screen_btn: "📺 Shared screen", players: "Players", vocab: "Vocabulary", wait_host: "Waiting for the host to start…", host_away: "The host is not here yet — feel free to look around.", wait_next: "Waiting for the host to start a new round…", host_lost: "⚠ Host disconnected — waiting for the host to return…",
      m_kahoot: "Same question", m_free: "Free play", sec_q: "s/question", q_meaning: "Choose the English word for this meaning", q_gap: "Choose the word that fills the blank", q_recall: "Type the English word for this meaning", type_ph: "Type the English word…", submit: "Submit",
      picked: "Answered — waiting for others…", answered: "{n} answered", right: "✓ Correct! +{p}", wrong: "✗ Wrong — answer: {a}", timeout: "⏱ Time's up — answer: {a}", answer: "Answer: {a}", fastest: "⚡ Fastest: {n}", n_right: "{n} correct", time_up: "⏱ Time's up — waiting for results…", loading: "Loading vocabulary…", mc: "You are the MC — open 📺 Shared screen so everyone can watch.",
      results: "🏁 Results", back: "← Back to game home", nobody: "Nobody answered yet.", ppl: "players", avg: "avg", team_red: "Red Team", team_blue: "Blue Team", team_green: "Green Team", team_yellow: "Yellow Team", click_team: "· host taps a name to switch team",
      tab_me: "Mine", tab_week: "This week", tab_all: "All time", h_player: "Player", h_total: "Total", h_games: "Games", h_best: "Best", h_acc: "Correct", h_date: "Date", h_topic: "Topic", h_score: "Score", h_rank: "Rank", h_rw: "Right/Wrong",
      s_games: "games", s_wins: "🥇 wins", s_best: "best score", s_streak: "longest streak", no_name: "You haven't set a name on this device.", no_games: "You haven't played yet.", no_week: "No games in the last 7 days.", no_all: "No games yet.", loading2: "Loading…", join_at: "Join at", race: "🏁 Free race!", ended: "🏁 Finished!", q_no: "Question {n}", err: "Error" },
    es: { lang_room: "🌐 Idioma de la sala", name_h: "¿Cómo te llamas?", name_sub: "Este dispositivo recordará tu nombre — sin correo.", name_ph: "Escribe tu nombre…", avatar_h: "Elige un avatar", upload: "📷 Sube tu foto", save: "Guardar y continuar →", need_name: "Escribe un nombre primero.", saving: "Guardando…", uploading: "Subiendo…", not_image: "Ese archivo no es una imagen.",
      join_h: "Entrar a una sala", code_ph: "CÓDIGO", go: "Entrar", hist_btn: "📜 Historial y ranking", no_room: "No se encontró la sala {c}.", room: "Sala", room_code: "Código de sala", copy_link: "🔗 Copiar enlace", copied: "✓ Copiado", screen_btn: "📺 Pantalla compartida", players: "Jugadores", vocab: "Vocabulario", wait_host: "Esperando a que el anfitrión empiece…", host_away: "El anfitrión aún no ha llegado — puedes mirar mientras tanto.", wait_next: "Esperando a que el anfitrión abra otra ronda…", host_lost: "⚠ El anfitrión se desconectó — esperando a que vuelva…",
      m_kahoot: "Misma pregunta", m_free: "Libre", sec_q: "s/pregunta", q_meaning: "Elige la palabra en inglés de este significado", q_gap: "Elige la palabra que completa el espacio", q_recall: "Escribe la palabra en inglés de este significado", type_ph: "Escribe la palabra en inglés…", submit: "Enviar",
      picked: "Respondido — esperando a los demás…", answered: "{n} respondieron", right: "✓ ¡Correcto! +{p}", wrong: "✗ Incorrecto — respuesta: {a}", timeout: "⏱ Se acabó el tiempo — respuesta: {a}", answer: "Respuesta: {a}", fastest: "⚡ Más rápido: {n}", n_right: "{n} acertaron", time_up: "⏱ Se acabó el tiempo — esperando resultados…", loading: "Cargando vocabulario…", mc: "Eres el presentador — abre 📺 Pantalla compartida para que todos vean.",
      results: "🏁 Resultados", back: "← Volver", nobody: "Nadie ha respondido todavía.", ppl: "jugadores", avg: "prom.", team_red: "Equipo Rojo", team_blue: "Equipo Azul", team_green: "Equipo Verde", team_yellow: "Equipo Amarillo", click_team: "· el anfitrión toca un nombre para cambiar de equipo",
      tab_me: "Mío", tab_week: "Esta semana", tab_all: "Siempre", h_player: "Jugador", h_total: "Total", h_games: "Partidas", h_best: "Mejor", h_acc: "Aciertos", h_date: "Fecha", h_topic: "Tema", h_score: "Puntos", h_rank: "Puesto", h_rw: "Bien/Mal",
      s_games: "partidas", s_wins: "veces 🥇", s_best: "récord", s_streak: "racha más larga", no_name: "Aún no tienes nombre en este dispositivo.", no_games: "Aún no has jugado.", no_week: "No hubo partidas en los últimos 7 días.", no_all: "Aún no hay partidas.", loading2: "Cargando…", join_at: "Entra en", race: "🏁 ¡Carrera libre!", ended: "🏁 ¡Terminado!", q_no: "Pregunta {n}", err: "Error" },
    zh: { lang_room: "🌐 跟随房间", name_h: "你叫什么名字？", name_sub: "本设备会记住你的名字——无需邮箱。", name_ph: "输入名字…", avatar_h: "选择头像", upload: "📷 上传照片", save: "保存并继续 →", need_name: "请先输入名字。", saving: "保存中…", uploading: "上传中…", not_image: "这个文件不是图片。",
      join_h: "加入房间", code_ph: "房间码", go: "加入", hist_btn: "📜 历史与排名", no_room: "找不到房间 {c}。", room: "房间", room_code: "房间码", copy_link: "🔗 复制邀请链接", copied: "✓ 已复制", screen_btn: "📺 共享屏幕", players: "玩家", vocab: "词汇", wait_host: "等待主持人开始…", host_away: "主持人还没进房间——可以先看看。", wait_next: "等待主持人开始新一局…", host_lost: "⚠ 主持人断线了——等待主持人回来…",
      m_kahoot: "同一题", m_free: "自由模式", sec_q: "秒/题", q_meaning: "选出这个意思的英文单词", q_gap: "选出填入空格的单词", q_recall: "输入这个意思的英文单词", type_ph: "输入英文单词…", submit: "提交",
      picked: "已作答——等待其他人…", answered: "{n} 人已作答", right: "✓ 正确！+{p}", wrong: "✗ 错误——答案：{a}", timeout: "⏱ 时间到——答案：{a}", answer: "答案：{a}", fastest: "⚡ 最快：{n}", n_right: "{n} 人答对", time_up: "⏱ 时间到——等待结果…", loading: "正在加载词汇…", mc: "你是主持人——打开 📺 共享屏幕让大家一起看。",
      results: "🏁 结果", back: "← 返回", nobody: "还没有人作答。", ppl: "人", avg: "平均", team_red: "红队", team_blue: "蓝队", team_green: "绿队", team_yellow: "黄队", click_team: "· 主持人点名字可换队",
      tab_me: "我的", tab_week: "本周", tab_all: "全部", h_player: "玩家", h_total: "总分", h_games: "场次", h_best: "最高分", h_acc: "正确率", h_date: "日期", h_topic: "主题", h_score: "分数", h_rank: "名次", h_rw: "对/错",
      s_games: "场", s_wins: "次 🥇", s_best: "最高分", s_streak: "最长连对", no_name: "你还没有在本设备设置名字。", no_games: "你还没有玩过。", no_week: "最近 7 天没有比赛。", no_all: "还没有比赛。", loading2: "加载中…", join_at: "加入地址", race: "🏁 自由赛跑！", ended: "🏁 结束！", q_no: "第 {n} 题", err: "错误" }
  };

  var G = {
    me: null,          /* {id, name, name_no, avatar} */
    profile: null,     /* {id, display_name, is_admin} nếu máy đang đăng nhập WordLoop */
    view: null,        /* "screen" = 📺 màn hình chung */
    room: null, ch: null, isHost: false,
    pool: [],          /* [{wid, term, block, pos, m:{vi,en,es,zh}}] */
    gaps: [],          /* [{wid, term, block, text:"... {{GAP}} ..."}] từ bài đọc của Block */
    online: [],        /* presence */
    st: null,          /* state mới nhất (host tự giữ, người khác nhận qua broadcast) */
    endAt: 0, qUntil: 0, qUntilLocal: 0, revealUntil: 0, tick: null, hostTimer: null,
    answers: [],       /* host gom: {pid, wid, term, ok, ms} */
    myQ: null, myQStart: 0, lastN: -1, myChoice: null, revealedN: -1,
    myLang: "room", lastState: 0, lastPush: 0
  };

  /* ---------- tiện ích ---------- */
  function show(id) { $$(".g-screen").forEach(function (s) { s.hidden = s.id !== id; }); document.body.classList.toggle("big", id === "s-screen"); }
  function norm(t) { return String(t || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  /* chấm câu GÕ TAY giống WordLoop (w.normalizeAnswer): bỏ dấu câu/ngoặc, thường hoá, gộp khoảng trắng */
  function normAns(s) { return String(s || "").toLowerCase().trim().replace(/[.,!?;:"'`()\[\]]/g, "").replace(/\s+/g, " "); }
  function typedOk(typed, ans) {   /* "subscribe (to)": gõ "subscribe to" hoặc "subscribe" đều đúng */
    var t = normAns(typed); if (!t) return false;
    return t === normAns(ans) || t === normAns(String(ans).replace(/\([^)]*\)/g, " "));
  }
  function clean(t) { return String(t || "").trim(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmt(ms) { ms = Math.max(0, ms); var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function label(p) { return p ? esc(p.name) + (p.no > 1 ? ' <span class="g-no">#' + p.no + "</span>" : "") : "?"; }
  function plain(p) { return p ? p.name + (p.no > 1 ? " #" + p.no : "") : "?"; }
  function avatar(a, cls) { return a && /^https?:/.test(a) ? '<img class="g-av ' + (cls || "") + '" src="' + esc(a) + '" alt="">' : '<span class="g-av ' + (cls || "") + '">' + esc(a || "🐣") + "</span>"; }
  function readLS(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function writeLS(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function roomLink(code, screen) { return location.origin + location.pathname + "?room=" + code + (screen ? "&view=screen" : ""); }
  function teamName(t) { return TEAM_C[t] ? T(TEAM_C[t].k) : ""; }
  function teamDot(t) { return t && TEAM_C[t] ? '<span class="g-tdot" style="background:' + TEAM_C[t].c + '" title="' + esc(teamName(t)) + '"></span>' : ""; }

  /* Tiếng của TỪNG người: đổi chữ giao diện + tiếng của nghĩa ("room" = theo tiếng host chọn).
     Host 🔒 ép -> NGHĨA cả phòng 1 tiếng, còn chữ giao diện vẫn theo từng người. */
  function roomLang(st) { return (st && st.lang) || (G.room && G.room.meaning_lang) || "vi"; }
  function uiLang() { return G.myLang && G.myLang !== "room" ? G.myLang : G.view === "screen" || G.room ? roomLang(G.st) : "vi"; }
  function effLang(pref, st) { return st && st.force ? roomLang(st) : pref && pref !== "room" ? pref : roomLang(st); }
  function T(k, vars) {
    var s = (UI[uiLang()] || UI.vi)[k]; if (s == null) s = UI.vi[k] || k;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, x) { return vars[x] == null ? "" : vars[x]; });
    return s;
  }
  function applyUI() {
    document.documentElement.lang = uiLang();
    $$("[data-t]").forEach(function (el) { el.textContent = T(el.dataset.t); });
    $$("[data-tp]").forEach(function (el) { el.placeholder = T(el.dataset.tp); });
    $("#p-typein").placeholder = T("type_ph");
    if (G.room) { $("#g-room-badge").textContent = T("room") + " " + G.room.code; var tt = (G.st && G.st.title) || ""; $("#l-info").textContent = tt ? T("vocab") + ": " + tt : ""; }
  }
  function myText(q) { var t = q.texts || {}; return t[effLang(G.myLang, G.st)] || t.en || t.vi || ""; }
  function myFlag(q) { var t = q.texts || {}, l = effLang(G.myLang, G.st); return FLAG[t[l] ? l : t.en ? "en" : "vi"]; }

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
    $("#n-err").textContent = T("uploading");
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas"); c.width = c.height = 128;
      var s = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
      c.toBlob(async function (blob) {
        var path = "av-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".webp";
        var r = await sb.storage.from("game-avatars").upload(path, blob, { contentType: "image/webp" });
        if (r.error) { $("#n-err").textContent = T("err") + ": " + r.error.message; return; }
        pickedAvatar = sb.storage.from("game-avatars").getPublicUrl(path).data.publicUrl;
        $("#n-err").textContent = ""; paintAvatars();
      }, "image/webp", 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = function () { $("#n-err").textContent = T("not_image"); };
    img.src = URL.createObjectURL(f);
  });
  $("#n-save").addEventListener("click", async function () {
    var name = $("#n-name").value.trim().replace(/\s+/g, " ");
    if (!name) { $("#n-err").textContent = T("need_name"); return; }
    $("#n-err").textContent = T("saving");
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
    } catch (e) { $("#n-err").textContent = T("err") + ": " + (e.message || e); }
  });
  function paintMe() {
    var b = $("#g-me"); b.hidden = !G.me;
    if (G.me) b.innerHTML = avatar(G.me.avatar) + " " + label({ name: G.me.name, no: G.me.name_no });
  }
  $("#g-me").addEventListener("click", function () { if (!G.room || !G.st || G.st.phase === "lobby") renderNameScreen(); });

  /* ---------- 2. trang chính ---------- */
  var picked = [];   /* [{table, id, title}] */
  function renderHome() { show("s-home"); }
  $("#h-go").addEventListener("click", function () { var c = $("#h-code").value.trim().toUpperCase(); if (c) { history.replaceState(null, "", "?room=" + c); joinRoom(c); } });
  $("#h-code").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#h-go").click(); });
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
    hostSetScope();
  });
  $("#h-tree").addEventListener("click", function (e) { if (e.target.closest(".g-pick")) e.stopPropagation(); });
  function paintPicked() {
    $("#h-picked").innerHTML = picked.length ? picked.map(function (p) { return '<span class="g-chip">' + esc(p.title) + "</span>"; }).join("") : '<span class="g-sub">Chưa chọn chủ đề — mở "Chọn nhánh từ vựng…" bên dưới.</span>';
  }

  /* PHÒNG CỐ ĐỊNH của host: lấy phòng mới nhất của host, chưa có thì tạo — mã/link dùng mãi */
  async function openHostRoom() {
    var r = await sb.from("game_rooms").select("code").eq("host_id", G.profile.id).order("created_at", { ascending: false }).limit(1);
    var own = await sb.from("game_rooms").select("code").eq("code", DEFAULT_ROOM).eq("host_id", G.profile.id).maybeSingle();   /* phòng "TJ" ưu tiên */
    var code = own.data ? own.data.code : r.data && r.data[0] ? r.data[0].code : await createRoom([], "", { mode: "kahoot", qtype: "meaning", minutes: 5, q_seconds: 15, lang: "vi" });
    var sc = param("scope");   /* giữ chủ đề chọn từ chuột phải cho initHostLobby */
    history.replaceState(null, "", "?room=" + code + (sc ? "&scope=" + encodeURIComponent(sc) + "&title=" + encodeURIComponent(param("title") || "") : ""));
    return joinRoom(code);
  }
  /* host đổi chủ đề trong phòng chờ -> lưu vào phòng + tải trước kho từ để báo số từ/câu */
  var scopeTimer = null;
  function hostSetScope() {
    if (!G.isHost || !G.st) return;
    G.st.scope = picked.map(function (p) { return { table: p.table, id: p.id, title: p.title }; });
    G.st.title = picked.map(function (p) { return p.title; }).join(" + ");
    sb.from("game_rooms").update({ scope: G.st.scope, title: G.st.title }).eq("id", G.room.id).then(function () {});
    push(); applyUI();
    clearTimeout(scopeTimer);
    $("#l-pool").textContent = G.st.scope.length ? "Đang tải từ vựng…" : "";
    scopeTimer = setTimeout(async function () { await ensurePool(G.st.scope); if (G.st.phase === "lobby") paintPoolInfo(); }, 400);
  }
  function scopeKey(scope) { return JSON.stringify((scope || []).map(function (p) { return p.table + ":" + p.id; }).sort()); }
  async function ensurePool(scope) {
    var k = scopeKey(scope);
    if (G.poolKey === k) return;
    G.poolKey = k; decks = {};
    if (!scope || !scope.length) { G.pool = []; G.gaps = []; return; }
    await loadPool(scope);
  }
  function paintPoolInfo() {
    $("#l-pool").textContent = G.st && G.st.scope && G.st.scope.length
      ? G.pool.length + " từ khác nhau · có nghĩa: " + poolCounts() + " · 📝 " + G.gaps.length + " câu điền chỗ trống"
      : "Chưa chọn chủ đề.";
  }
  /* đủ dữ liệu để chơi dạng câu này chưa? (trả về lời nhắc cho host, "" = ổn) */
  function readyMsg(qt, lang) {
    if (!G.st || !G.st.scope || !G.st.scope.length) return "Chọn chủ đề (nhánh từ vựng) trước đã.";
    var nm = poolFor(lang).length, ng = G.gaps.length;
    if ((qt === "meaning" || qt === "recall") && nm < 4) return "Chỉ có " + nm + " từ có nghĩa bằng tiếng đã chọn — cần ít nhất 4. (" + poolCounts() + ")";
    if (qt === "gap" && ng < 4) return "Phạm vi này chỉ có " + ng + " câu có chỗ trống trong bài đọc — cần ít nhất 4 (chọn Block/Page đã có bài đọc).";
    if (qt === "mix" && nm < 4) return "Chỉ có " + nm + " từ có nghĩa — cần ít nhất 4.";
    return "";
  }

  async function createRoom(scope, title, set) {
    var ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (var k = 0; k < 5; k++) {
      var code = ""; for (var i = 0; i < 5; i++) code += ABC[Math.floor(Math.random() * ABC.length)];
      var r = await sb.from("game_rooms").insert({
        code: code, host_id: G.profile.id, title: title, mode: set.mode, qtype: set.qtype, minutes: set.minutes, q_seconds: set.q_seconds, meaning_lang: set.lang,
        scope: scope.map(function (p) { return { table: p.table, id: p.id, title: p.title }; })
      }).select().single();
      if (!r.error) return code;
      if (!/duplicate|unique/i.test(r.error.message)) throw r.error;
    }
    throw new Error("không tạo được mã phòng");
  }

  /* ---------- từ vựng + bài đọc theo phạm vi: scope -> Block -> words (lọc trùng theo chữ) ---------- */
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
    var blkRows = [];
    if (bats.length) blkRows = await inIds("blocks", "id,context_passage", "batch_id", bats);
    var extra = by("blocks").filter(function (id) { return !blkRows.some(function (b) { return b.id === id; }); });
    if (extra.length) blkRows = blkRows.concat(await inIds("blocks", "id,context_passage", "id", extra));
    var blks = ids(blkRows);
    var words = blks.length ? await inIds("words", "id,block_id,term,pos,meaning_vi,meaning_zh,meaning_es,def_en", "block_id", blks) : [];
    var seen = {}, pool = [], byTerm = {};
    words.forEach(function (w) {
      var k = norm(w.term), m = { vi: clean(w.meaning_vi), en: clean(w.def_en), es: clean(w.meaning_es), zh: clean(w.meaning_zh) };
      if (!k || seen[k] || !(m.vi || m.en || m.es || m.zh)) return;
      seen[k] = 1;
      var it = { wid: w.id, term: clean(w.term), block: w.block_id, pos: norm(w.pos), m: m };
      pool.push(it); byTerm[k] = it;
    });
    /* câu có chỗ trống: tách câu trong bài đọc giống Context.gapSentences (js/context.js) */
    var gaps = [], gseen = {};
    blkRows.forEach(function (b) {
      var marked = String(b.context_passage || ""), cut = marked.indexOf(META_SEP);
      if (cut >= 0) marked = marked.slice(0, cut);
      gapSentences(marked).forEach(function (g) {
        var w = byTerm[norm(g.term)], key = norm(g.text);
        if (!w || gseen[key]) return;
        gseen[key] = 1;
        gaps.push({ wid: w.wid, term: w.term, block: b.id, text: g.text });
      });
    });
    G.pool = pool; G.gaps = gaps;
    return pool;
  }
  function gapSentences(text) {
    var out = [], seen = {}, re = /[^.!?\n]+[.!?]+/g, m, lastEnd = 0;
    function one(raw) {
      var s = String(raw || "").trim(); if (!s) return;
      var termRe = /\[([^\]]+)\]/g, hit, terms = [];
      while ((hit = termRe.exec(s)) !== null) terms.push(hit[1]);
      terms.forEach(function (term) {
        if (seen[term.toLowerCase()]) return;
        seen[term.toLowerCase()] = 1;
        out.push({ term: term, text: s.replace("[" + term + "]", "{{GAP}}").replace(/\[([^\]]+)\]/g, "$1") });
      });
    }
    while ((m = re.exec(text)) !== null) { one(m[0]); lastEnd = re.lastIndex; }
    text.slice(lastEnd).split(/\n+/).forEach(one);
    return out;
  }
  function poolFor(lang) { return G.pool.filter(function (x) { return x.m[lang]; }); }
  function poolForAll(langs) { return G.pool.filter(function (x) { return langs.every(function (l) { return x.m[l]; }); }); }
  function poolCounts() { return ["vi", "en", "es", "zh"].map(function (l) { return FLAG[l] + " " + poolFor(l).length; }).join(" · "); }

  /* ---------- sinh câu hỏi ----------
     "xào bài": hỏi lần lượt hết (thứ tự ngẫu nhiên) rồi mới lặp lại.
     Đáp án nhiễu KHÓ: ưu tiên từ CÙNG Block, rồi cùng loại từ (pos), rồi mới tới từ bất kỳ. */
  var decks = {};
  function draw(key, list) {
    var d = decks[key];
    if (!d || d.n !== list.length || !d.list.length) d = decks[key] = { n: list.length, list: shuffle(list.slice()) };
    return d.list.pop();
  }
  function distractors(w, p) {
    var ok = function (x) { return norm(x.term) !== norm(w.term); };
    var sameBlock = shuffle(p.filter(function (x) { return ok(x) && x.block === w.block; }));
    var samePos = shuffle(p.filter(function (x) { return ok(x) && x.block !== w.block && w.pos && x.pos === w.pos; }));
    var rest = shuffle(p.filter(function (x) { return ok(x) && x.block !== w.block && !(w.pos && x.pos === w.pos); }));
    var picks = [], used = {};
    sameBlock.concat(samePos, rest).forEach(function (x) { if (picks.length < 3 && !used[norm(x.term)]) { used[norm(x.term)] = 1; picks.push(x.term); } });
    return shuffle([w.term].concat(picks));
  }
  function makeQ(qtype, lang, langs) {
    var t = qtype;
    if (t === "mix") t = shuffle(["meaning", "recall"].concat(G.gaps.length >= 4 ? ["gap"] : []))[0];
    if (t === "gap" && G.gaps.length >= 4) {
      var g = draw("gap", G.gaps), gw = G.pool.find(function (x) { return x.wid === g.wid; }) || { term: g.term, block: g.block };
      return { type: "gap", wid: g.wid, ans: g.term, sent: g.text, texts: gw.m || {}, opts: distractors(gw, G.pool) };
    }
    var p = langs && langs.length ? poolForAll(langs) : poolFor(lang);
    if (p.length < 4) p = poolFor(lang);   /* thiếu từ có nghĩa ở MỌI tiếng -> theo tiếng phòng, ai thiếu thì hiện nghĩa tiếng Anh */
    if (p.length < 4) p = G.pool;
    var w = draw(t + lang + (langs || []).join(""), p);
    var q = { type: t === "recall" ? "recall" : "meaning", wid: w.wid, ans: w.term, texts: w.m };
    if (q.type === "meaning") q.opts = distractors(w, p);
    else q.len = w.term.length;
    return q;
  }

  /* ---------- 3. vào phòng ---------- */
  async function joinRoom(code) {
    code = code.toUpperCase();
    var r = await sb.from("game_rooms").select("*").eq("code", code).maybeSingle();
    if (r.error || !r.data) {
      if (G.view === "screen") { show("s-screen"); $("#sc-status").textContent = T("no_room", { c: code }); return; }
      show("s-home"); $("#h-err").textContent = T("no_room", { c: code }); return;
    }
    G.room = r.data;
    G.isHost = G.view !== "screen" && isTJ() && G.profile.id === G.room.host_id;
    applyUI();
    $("#g-room-badge").hidden = false;
    if (G.isHost) {
      restoreHost();
      if (G.st && G.st.scope) await ensurePool(G.st.scope);
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
        if (!G.st) G.st = { phase: "lobby", scope: G.room.scope || [], title: G.room.title || "", mode: G.room.mode, qtype: G.room.qtype || "meaning", lang: G.room.meaning_lang || "vi", force: false, minutes: +G.room.minutes, qs: G.room.q_seconds, teams: 0, teamOf: {}, scores: {}, roster: {} };
        push();
        if (G.st.phase === "play") onState(pub());
        else initHostLobby();
      } else G.ch.send({ type: "broadcast", event: "hello", payload: {} });   /* xin host gửi lại trạng thái hiện tại */
    });
  }
  function track() { return G.ch.track({ id: G.me.id, pf: G.profile ? G.profile.id : null, name: G.me.name, no: G.me.name_no, avatar: G.me.avatar, host: G.isHost, play: G.isHost ? hostPlays() : true, lang: G.myLang }); }
  /* "Host" do PHÒNG quyết định (hồ sơ = host_id của phòng), không tin máy tự nhận — bản cũ đang mở ở máy khác
     (vd Anti_TJ lúc còn admin) có thể vẫn gửi host:true */
  function isRoomHost(p) { return !!(p && p.pf && G.room && p.pf === G.room.host_id && p.host); }
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
  async function initHostLobby() {
    var sc = param("scope");
    if (sc) {   /* mở từ chuột phải trong WordLoop: ?scope=<table>:<id>&title=… -> thành chủ đề ván tới */
      var i = sc.indexOf(":");
      picked = [{ table: sc.slice(0, i), id: sc.slice(i + 1), title: param("title") || sc }];
      history.replaceState(null, "", "?room=" + G.room.code);
      hostSetScope();
    } else {
      picked = (G.st.scope || []).map(function (p) { return { table: p.table, id: p.id, title: p.title || p.id }; });
      await ensurePool(G.st.scope);
    }
    renderLobby();
    await loadTree();
  }
  function renderLobby() {
    show("s-lobby");
    $("#l-code").textContent = G.room.code;
    applyUI();
    $("#l-host").hidden = !G.isHost; $("#l-wait").hidden = G.isHost;
    if (G.isHost) {
      var st = G.st || {};
      $("#l-mode").value = st.mode || G.room.mode; $("#l-qtype").value = st.qtype || G.room.qtype || "meaning";
      $("#l-min").value = st.minutes || G.room.minutes; $("#l-qs").value = st.qs || G.room.q_seconds;
      $("#l-lang").value = roomLang(st); $("#l-teamn").value = String(st.teams || 0); $("#l-force").checked = !!st.force;
      $("#l-qs-wrap").hidden = $("#l-mode").value !== "kahoot";
      $("#l-teambtns").hidden = !(+$("#l-teamn").value);
      paintPoolInfo(); paintPicked();
    }
    paintLobbyPlayers();
  }
  function paintLobbyPlayers() {
    var st = G.st || {}, teams = +st.teams || 0, teamOf = st.teamOf || {};
    var tt = st.title || ""; $("#l-info").textContent = tt ? T("vocab") + ": " + tt : "";
    if (!G.isHost) $("#l-wait").textContent = G.online.some(isRoomHost) ? T("wait_host") : T("host_away");
    $("#l-count").textContent = players().length;
    $("#l-teamhint").textContent = teams ? T("click_team") : "";
    $("#l-teams").innerHTML = teams ? teamSummary(st, false) : "";
    $("#l-players").innerHTML = G.online.map(function (p) {
      var t = teamOf[p.id];
      return '<button class="g-player' + (teams && G.isHost && p.play !== false ? " g-click" : "") + '" data-pid="' + esc(p.id) + '"' + (t && TEAM_C[t] ? ' style="border-color:' + TEAM_C[t].c + '"' : "") + ">" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (p.lang && p.lang !== "room" ? '<span class="g-sub">' + FLAG[p.lang] + "</span>" : "") + (teams && t ? teamDot(t) : "") +
        (isRoomHost(p) ? '<span class="g-tag">Host' + (p.play === false ? " · MC" : "") + "</span>" : "") + "</button>";
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
  $("#l-copy").addEventListener("click", function () {
    var b = this, link = roomLink(G.room.code);
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { b.textContent = T("copied"); }, function () { prompt("Link:", link); });
    setTimeout(function () { b.textContent = T("copy_link"); }, 2000);
  });
  $("#l-screen").addEventListener("click", function () { window.open(roomLink(G.room.code, true), "_blank"); });
  ["#l-mode", "#l-qtype", "#l-min", "#l-qs", "#l-lang", "#l-teamn", "#l-hostplay", "#l-force"].forEach(function (s) {
    $(s).addEventListener("change", function () {
      if (!G.isHost) return;
      var st = G.st;
      st.mode = $("#l-mode").value; st.qtype = $("#l-qtype").value; st.lang = $("#l-lang").value; st.force = $("#l-force").checked;
      st.minutes = Math.max(1, +$("#l-min").value || 5); st.qs = Math.max(5, +$("#l-qs").value || 15);
      var tn = +$("#l-teamn").value;
      if (tn !== st.teams) { st.teams = tn; st.teamOf = {}; if (tn) autoTeams(); }
      $("#l-qs-wrap").hidden = st.mode !== "kahoot";
      $("#l-teambtns").hidden = !tn;
      if (s === "#l-hostplay") track();
      sb.from("game_rooms").update({ mode: st.mode, qtype: st.qtype, meaning_lang: st.lang, minutes: st.minutes, q_seconds: st.qs, team_mode: !!tn, teams: tn }).eq("id", G.room.id).then(function () {});
      push(); paintLobbyPlayers();
    });
  });

  /* ---------- HOST: điều khiển trận ---------- */
  function pub() {   /* bản công khai: giấu đáp án tới lúc lộ; thời gian gửi dạng "còn lại bao nhiêu ms" (khỏi lệch đồng hồ) */
    var s = Object.assign({}, G.st, { left: G.endAt ? G.endAt - Date.now() : null, qLeft: G.qUntil ? G.qUntil - Date.now() : null });
    if (s.q) {
      var q = s.q, rev = !!q.revealed;
      s.q = { n: q.n, type: q.type, texts: q.texts, sent: q.sent, opts: q.opts, len: q.len, wid: q.wid, revealed: rev, ans: rev ? q.ans : null, cnt: Object.keys(q.got).length,
              picks: rev ? Object.keys(q.got).reduce(function (o, pid) { o[pid] = q.got[pid].c; return o; }, {}) : null,
              oks: rev ? Object.keys(q.got).filter(function (pid) { return q.got[pid].ok; }) : null, fast: rev ? q.fast : null };
    }
    return s;
  }
  function push() { G.lastPush = Date.now(); if (G.ch) G.ch.send({ type: "broadcast", event: "state", payload: pub() }); saveHost(); }
  $("#l-start").addEventListener("click", async function () {
    if (!G.isHost) return;
    if (G.st.scope && G.st.scope.length) await ensurePool(G.st.scope);
    var need = readyMsg(G.st.qtype, G.st.lang);
    if (need) { alert(need); return; }
    if (!players().length) { alert("Chưa có người chơi nào."); return; }
    fillTeams();
    G.st.phase = "play"; G.st.scores = {}; G.st.q = null; G.answers = [];
    players().forEach(function (p) { G.st.scores[p.id] = { s: 0, c: 0, w: 0, st: 0, best: 0 }; });
    G.endAt = Date.now() + G.st.minutes * 60000;
    await sb.from("game_rooms").update({ status: "playing", started_at: new Date().toISOString(), mode: G.st.mode, qtype: G.st.qtype, meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs, team_mode: !!G.st.teams, teams: G.st.teams }).eq("id", G.room.id);
    /* mỗi lần bắt đầu = 1 VÁN riêng (lịch sử xem theo ván) */
    var mr = await sb.from("game_matches").insert({ room_id: G.room.id, title: G.st.title, scope: G.st.scope, mode: G.st.mode, qtype: G.st.qtype, meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs, teams: G.st.teams || 0 }).select("id").single();
    G.st.matchId = mr.data ? mr.data.id : null;
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
    var q = makeQ(G.st.qtype, G.st.lang, roomLangs());
    G.st.q = Object.assign(q, { n: (G.st.q ? G.st.q.n : 0) + 1, revealed: false, got: {}, fast: null });
    G.qUntil = Date.now() + G.st.qs * 1000;
    push();
  }
  function hostTick() {
    var now = Date.now();
    if (now - G.lastPush > HEARTBEAT_MS) push();   /* nhịp "host còn sống" — người chơi quá HOST_LOST_MS không nghe thì báo mất kết nối */
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
    var best = null; Object.keys(q.got).forEach(function (pid) { var g = q.got[pid]; if (g.ok && (!best || g.ms < q.got[best].ms)) best = pid; });
    q.fast = best;   /* chỉ để khoe, không cộng điểm */
    Object.keys(G.st.scores).forEach(function (pid) { if (!q.got[pid]) G.st.scores[pid].st = 0; });   /* bỏ câu = mất chuỗi */
    push();
  }
  function score(pid, ok) {   /* điểm TÍNH THEO CÂU: đúng +100 */
    var s = G.st.scores[pid] || (G.st.scores[pid] = { s: 0, c: 0, w: 0, st: 0, best: 0 });
    if (ok) { s.s += POINTS; s.c++; s.st++; s.best = Math.max(s.best, s.st); } else { s.w++; s.st = 0; }
  }
  function hostOnAnswer(a) {
    if (!G.st || G.st.phase !== "play") return;
    if (G.st.mode === "kahoot") {
      var q = G.st.q;
      if (!q || q.revealed || a.n !== q.n || q.got[a.pid]) return;   /* mỗi người 1 lần / câu */
      var ok = q.type === "recall" ? typedOk(a.choice, q.ans) : norm(a.choice) === norm(q.ans);
      q.got[a.pid] = { ok: ok, c: a.choice, ms: a.ms };
      score(a.pid, ok);
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
    writeLS(LS_HOST + G.room.code, null);
    try {
      var ranked = rankList(G.st.scores);
      if (ranked.length) {
        var rr = await sb.from("game_results").upsert(ranked.map(function (x) {
          return { room_id: G.room.id, match_id: G.st.matchId, player_id: x.pid, team: G.st.teams ? (G.st.teamOf[x.pid] || null) : null, score: x.s, correct: x.c, wrong: x.w, best_streak: x.best, rank: x.rank };
        }), { onConflict: "match_id,player_id" });
        if (rr.error) console.warn("game_results", rr.error);
      }
      for (var i = 0; i < G.answers.length; i += 500) {
        var ra = await sb.from("game_answers").insert(G.answers.slice(i, i + 500).map(function (a) {
          return { room_id: G.room.id, match_id: G.st.matchId, player_id: a.pid, word_id: a.wid, term: a.term, correct: a.ok, ms: a.ms || null };
        }));
        if (ra.error) console.warn("game_answers", ra.error);
      }
      if (G.st.matchId) await sb.from("game_matches").update({ ended_at: new Date().toISOString() }).eq("id", G.st.matchId);
      await sb.from("game_rooms").update({ status: "lobby", ended_at: new Date().toISOString() }).eq("id", G.room.id);
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
      var row = out[st.teamOf[pid] - 1]; if (!row) return;
      row.n++; row.s += (st.scores && st.scores[pid] ? st.scores[pid].s : 0);
    });
    return out.sort(function (a, b) { return b.s - a.s; });
  }
  function teamSummary(st, withScore) {
    var tt = teamTotals(st), uneven = tt.some(function (x) { return x.n !== tt[0].n; });
    return tt.map(function (x, i) {
      var C = TEAM_C[x.t];
      return '<div class="g-team" style="--tc:' + C.c + '"><span>' + (withScore && i === 0 && x.s > 0 ? "👑 " : "") + C.e + " " + esc(teamName(x.t)) + '</span><span class="g-sub">' + x.n + " " + T("ppl") + "</span>" +
        (withScore ? "<b>" + x.s + "</b>" + (uneven && x.n ? '<span class="g-sub">' + T("avg") + " " + Math.round(x.s / x.n) + "</span>" : "") : "") + "</div>";
    }).join("");
  }

  /* ---------- MỌI NGƯỜI: nhận trạng thái ---------- */
  function onState(s) {
    G.lastState = Date.now();
    var was = G.st && G.st.phase, langWas = G.st && G.st.lang;
    if (!G.isHost) G.st = s;
    if (s.left != null) G.endAt = Date.now() + s.left;
    if (G.myLang === "room" && langWas !== s.lang) applyUI();   /* "theo phòng" -> host đổi tiếng thì giao diện đổi theo */
    if (G.view === "screen") return paintScreen(s);
    if (s.phase === "lobby") { if ($("#s-lobby").hidden) renderLobby(); else paintLobbyPlayers(); return; }
    if (s.phase === "end") { clearInterval(G.tick); return renderEnd(s); }
    if (s.phase === "play") {
      if (was !== "play" || $("#s-play").hidden) enterPlay(s);
      paintBoard(s);
      if (s.mode === "kahoot" && s.q) paintKahoot(s);
    }
  }
  function modeLine(s) { return s.mode === "kahoot" ? T("m_kahoot") + " · " + s.qs + " " + T("sec_q") : T("m_free"); }
  function enterPlay(s) {
    show("s-play");
    $("#p-mode").textContent = modeLine(s);
    $("#p-stop").hidden = !G.isHost;
    clearInterval(G.tick);
    G.tick = setInterval(function () {
      $("#p-left").textContent = fmt(G.endAt - Date.now());
      var bar = $("#p-qbar");
      if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / ((G.st.qs || 15) * 1000) * 100)) + "%";
      else bar.style.width = "0%";
      if (G.st && G.st.mode === "free" && Date.now() >= G.endAt) lockAll(T("time_up"));
      if (!G.isHost) {
        var hostHere = G.online.some(isRoomHost);
        $("#p-hostlost").hidden = hostHere && Date.now() - G.lastState <= HOST_LOST_MS;
      }
    }, 200);
    if (!iPlay()) $("#p-msg").textContent = T("mc");
    if (s.mode === "free" && iPlay()) {
      /* host có thể đổi sang "Tự do" sau khi người chơi vào phòng -> lúc đó mới tải kho từ */
      if (G.poolKey === scopeKey(s.scope) && G.pool.length) freeNext();
      else { $("#p-vi").textContent = T("loading"); ensurePool(s.scope).then(freeNext); }
    }
  }
  function iPlay() { return !(G.isHost && !hostPlays()); }
  function paintBoard(s) {
    var roster = s.roster || {}, list = rankList(s.scores), teams = +s.teams;
    $("#p-teams").innerHTML = teams ? teamSummary(s, true) : "";
    $("#p-board").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + x.rank + "</span>" + avatar(p.avatar) +
        '<span class="g-pname">' + label(p) + "</span>" + (teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-streak">' + (x.st >= 2 ? "🔥" + x.st : "") + '</span><b class="g-score">' + x.s + "</b></li>";
    }).join("");
  }

  /* vẽ 1 câu hỏi (dùng chung Kahoot / Tự do): gợi ý dạng câu + nội dung + 4 lựa chọn HOẶC ô gõ */
  function paintQuestion(q, hintEl, textEl, optsEl) {
    $(hintEl).textContent = T(q.type === "gap" ? "q_gap" : q.type === "recall" ? "q_recall" : "q_meaning");
    if (q.type === "gap") $(textEl).innerHTML = esc(q.sent).replace("{{GAP}}", '<span class="g-blank">_____</span>');
    else $(textEl).textContent = myFlag(q) + " " + myText(q) + (q.type === "recall" && q.len ? "  (" + q.len + ")" : "");
    if (q.type === "recall") {
      $(optsEl).innerHTML = "";
      if (optsEl === "#p-opts") { $("#p-type").hidden = false; var inp = $("#p-typein"); inp.value = ""; inp.disabled = false; $("#p-typego").disabled = false; if (iPlay()) inp.focus(); }
    } else {
      if (optsEl === "#p-opts") $("#p-type").hidden = true;
      $(optsEl).innerHTML = q.opts.map(function (o) { return '<button class="g-opt" data-opt="' + esc(o) + '"><span class="g-otext">' + esc(o) + '</span><span class="g-pickers"></span></button>'; }).join("");
    }
  }
  function lockAll(msg) {
    $$(".g-opt").forEach(function (x) { x.disabled = true; });
    $("#p-typein").disabled = true; $("#p-typego").disabled = true;
    if (msg) $("#p-msg").textContent = msg;
  }

  /* kiểu Kahoot: host gửi câu, mọi người trả lời 1 lần, hết giờ mới hiện đáp án + ai chọn gì + ai nhanh nhất */
  function paintKahoot(s) {
    var q = s.q;
    if (q.n !== G.lastN) {
      G.lastN = q.n; G.myChoice = null; G.myQStart = Date.now();
      G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0;
      paintQuestion(q, "#p-hint", "#p-vi", "#p-opts");
      if (!iPlay()) lockAll();
      $("#p-msg").textContent = iPlay() ? "" : T("mc");
    }
    if (!q.revealed) {
      if (G.myChoice != null || !iPlay()) $("#p-msg").textContent = (iPlay() ? T("picked") + " · " : "") + T("answered", { n: q.cnt || 0 });
      return;
    }
    G.qUntilLocal = 0;
    lockAll();
    paintPickers(q, s.roster || {}, ".g-opt");
    if (G.revealedN === q.n) return;
    G.revealedN = q.n;
    var ok = G.myChoice != null && (q.type === "recall" ? typedOk(G.myChoice, q.ans) : norm(G.myChoice) === norm(q.ans));
    var msg = !iPlay() ? T("answer", { a: q.ans }) : G.myChoice == null ? T("timeout", { a: q.ans }) : ok ? T("right", { p: POINTS }) : T("wrong", { a: q.ans });
    if (q.type === "recall") msg += "  ·  " + T("n_right", { n: (q.oks || []).length }) + " " + (q.oks || []).map(function (pid) { var p = (s.roster || {})[pid]; return p ? p.avatar && !/^https?:/.test(p.avatar) ? p.avatar : "👤" : ""; }).join("");
    var fast = q.fast ? (s.roster || {})[q.fast] : null;
    if (fast) msg += "  ·  " + T("fastest", { n: plain(fast) });
    $("#p-msg").textContent = msg;
    if (q.type === "recall") $("#p-typein").value = G.myChoice || "";
    if (G.myChoice != null) recordMyProgress(q.wid, ok);
  }
  /* tô đúng/sai + gắn ảnh những người đã chọn từng đáp án (dạng chọn 1 trong 4) */
  function paintPickers(q, roster, sel) {
    var by = {};
    Object.keys(q.picks || {}).forEach(function (pid) { var k = norm(q.picks[pid]); (by[k] = by[k] || []).push(pid); });
    $$(sel).forEach(function (b) {
      var o = norm(b.dataset.opt), who = by[o] || [];
      if (o === norm(q.ans)) b.classList.add("ok");
      else if (G.myChoice && o === norm(G.myChoice)) b.classList.add("bad");
      var box = b.querySelector(".g-pickers");
      if (box) box.innerHTML = who.map(function (pid) { var p = roster[pid] || {}; return avatar(p.avatar, "g-av-sm" + (pid === q.fast ? " g-fast" : "")); }).join("") + (who.length ? '<span class="g-cnt">' + who.length + "</span>" : "");
    });
  }
  function sendAnswer(choice) {
    var s = G.st;
    G.myChoice = choice;
    lockAll(T("picked"));
    G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, n: s.q.n, choice: choice, ms: Date.now() - G.myQStart } });
  }
  $("#p-opts").addEventListener("click", function (e) {
    var b = e.target.closest(".g-opt"); if (!b || b.disabled) return;
    var s = G.st; if (!s || s.phase !== "play" || !iPlay()) return;
    if (s.mode === "kahoot") {
      if (G.myChoice != null || !s.q || s.q.revealed) return;
      b.classList.add("picked");
      sendAnswer(b.dataset.opt);
    } else freeAnswer(b.dataset.opt, b);
  });
  $("#p-type").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#p-typein").value.trim(), s = G.st;
    if (!v || !s || s.phase !== "play" || !iPlay()) return;
    if (s.mode === "kahoot") { if (G.myChoice == null && s.q && !s.q.revealed) sendAnswer(v); }
    else freeAnswer(v, null);
  });

  /* kiểu tự do: mỗi máy tự sinh câu từ cùng kho, báo đúng/sai cho host chấm điểm */
  function freeNext() {
    if (Date.now() >= G.endAt) return lockAll(T("time_up"));
    if (!G.pool.length) { $("#p-vi").textContent = T("loading"); return; }
    var ml = effLang(G.myLang, G.st);
    G.myQ = makeQ(G.st.qtype || "meaning", poolFor(ml).length >= 4 ? ml : roomLang(G.st));
    G.myQStart = Date.now();
    paintQuestion(G.myQ, "#p-hint", "#p-vi", "#p-opts");
    $("#p-msg").textContent = "";
  }
  function freeAnswer(choice, btn) {
    var q = G.myQ; if (!q) return;
    var ok = q.type === "recall" ? typedOk(choice, q.ans) : norm(choice) === norm(q.ans);
    lockAll();
    $$(".g-opt").forEach(function (x) { if (norm(x.dataset.opt) === norm(q.ans)) x.classList.add("ok"); });
    if (!ok && btn) btn.classList.add("bad");
    $("#p-msg").textContent = ok ? T("right", { p: POINTS }) : T("wrong", { a: q.ans });
    G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, ok: ok, wid: q.wid, term: q.ans, ms: Date.now() - G.myQStart } });
    recordMyProgress(q.wid, ok);
    setTimeout(freeNext, ok ? 500 : 1400);
  }

  /* Tiến trình học — CHỈ hồ sơ admin (TJ). "Học chung" vẫn tách được qua game_answers (có room_id). */
  async function recordMyProgress(wid, ok) {
    if (!isTJ() || !wid) return;
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
    if (!s) { $("#sc-status").textContent = T("loading2"); return; }
    var roster = s.roster || {};
    if (s.phase === "lobby") {
      $("#sc-status").innerHTML = T("join_at") + " <b>" + esc(roomLink(G.room.code)) + "</b>";
      $("#sc-hint").textContent = "";
      $("#sc-q").textContent = T("room_code") + ": " + G.room.code;
      $("#sc-opts").innerHTML = '<div class="sc-waiting">' + Object.keys(roster).map(function (pid) { return avatar(roster[pid].avatar); }).join("") + "</div>";
    } else if (s.phase === "play") {
      if (s.mode === "kahoot" && s.q) {
        $("#sc-status").textContent = T("q_no", { n: s.q.n }) + (s.q.revealed ? "" : " · " + T("answered", { n: s.q.cnt || 0 }));
        if (s.q.n !== G.lastN) {
          G.lastN = s.q.n; G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0;
          paintQuestion(s.q, "#sc-hint", "#sc-q", "#sc-opts");
          $$("#sc-opts .g-opt").forEach(function (b, i) { b.classList.add("sc-opt"); b.insertAdjacentHTML("afterbegin", '<span class="sc-key">' + "ABCD"[i] + "</span>"); b.disabled = true; });
        }
        if (s.q.revealed) {
          G.qUntilLocal = 0;
          paintPickers(s.q, roster, "#sc-opts .g-opt");
          if (s.q.type === "recall") $("#sc-opts").innerHTML = '<div class="sc-waiting"><b class="sc-ans">' + esc(s.q.ans) + "</b> · " + esc(T("n_right", { n: (s.q.oks || []).length })) + " " + (s.q.oks || []).map(function (pid) { return avatar((roster[pid] || {}).avatar); }).join("") + "</div>";
          var fast = s.q.fast ? roster[s.q.fast] : null;
          if (fast) $("#sc-status").textContent = T("fastest", { n: plain(fast) });
        }
      } else if (s.mode === "free") { $("#sc-status").textContent = T("m_free"); $("#sc-hint").textContent = ""; $("#sc-q").textContent = T("race"); $("#sc-opts").innerHTML = ""; }
    } else if (s.phase === "end") {
      clearInterval(G.tick); $("#sc-left").textContent = "";
      $("#sc-status").textContent = T("ended"); $("#sc-hint").textContent = "";
      var top = rankList(s.scores).slice(0, 3);
      $("#sc-q").innerHTML = top.map(function (x, i) { var p = roster[x.pid] || {}; return '<span class="sc-pod">' + ["🥇", "🥈", "🥉"][i] + avatar(p.avatar) + label(p) + " · " + x.s + "</span>"; }).join("");
      $("#sc-opts").innerHTML = "";
    }
    $("#sc-teams").innerHTML = +s.teams ? teamSummary(s, s.phase !== "lobby") : "";
    /* đường đua: ảnh chạy tới theo điểm (người dẫn đầu = đích) */
    var list = rankList(s.scores), max = Math.max(1, list.length ? list[0].s : 1);
    $("#sc-lanes").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {}, t = (s.teamOf || {})[x.pid];
      return '<div class="sc-lane"' + (t && TEAM_C[t] ? ' style="--tc:' + TEAM_C[t].c + '"' : "") + '><span class="sc-lname">' + x.rank + ". " + label(p) + '</span><div class="sc-track"><div class="sc-runner" style="left:' + Math.round(x.s / max * 88) + '%">' + avatar(p.avatar) + '</div></div><b>' + x.s + "</b></div>";
    }).join("");
  }

  $("#e-again").addEventListener("click", function () {
    if (!G.isHost || !G.st) return;
    G.st.phase = "lobby"; G.st.scores = {}; G.st.q = null; G.st.matchId = null;
    G.answers = []; G.endAt = 0; G.qUntil = 0; G.lastN = -1;
    push(); renderLobby();
  });

  /* ---------- kết quả ---------- */
  function renderEnd(s) {
    show("s-end");
    $("#e-info").textContent = (s.title || "") + " · " + modeLine(s) + " · " + s.minutes + "'";
    $("#e-again").hidden = !G.isHost || s.saved;
    $("#e-wait").hidden = G.isHost || !!s.saved;
    $("#e-teams").innerHTML = +s.teams ? teamSummary(s, true) : "";
    var roster = s.roster || {};
    $("#e-board").innerHTML = rankList(s.scores).map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (G.me && x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + (x.rank === 1 ? "🥇" : x.rank === 2 ? "🥈" : x.rank === 3 ? "🥉" : x.rank) + "</span>" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (+s.teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-sub">✓' + x.c + " ✗" + x.w + " 🔥" + x.best + '</span><b class="g-score">' + x.s + "</b></li>";
    }).join("") || '<li class="g-sub">' + T("nobody") + "</li>";
  }
  async function showMatch(id) {
    var mr = await sb.from("game_matches").select("*,game_rooms(code)").eq("id", id).maybeSingle();
    if (!mr.data) { renderHome(); $("#h-err").textContent = T("no_room", { c: "" }); return; }
    var M = mr.data;
    G.room = { code: (M.game_rooms || {}).code || "", title: M.title };
    var r = await sb.from("game_results").select("player_id,team,score,correct,wrong,best_streak,rank,game_players(name,name_no,avatar)").eq("match_id", id).order("rank");
    var scores = {}, roster = {}, teamOf = {};
    (r.data || []).forEach(function (x) {
      scores[x.player_id] = { s: x.score, c: x.correct, w: x.wrong, st: 0, best: x.best_streak };
      if (x.team) teamOf[x.player_id] = x.team;
      var p = x.game_players || {}; roster[x.player_id] = { name: p.name, no: p.name_no, avatar: p.avatar };
    });
    renderEnd({ phase: "end", saved: true, title: M.title, mode: M.mode, qs: M.q_seconds, minutes: M.minutes, teams: M.teams || 0, teamOf: teamOf, scores: scores, roster: roster });
  }

  /* ---------- 📜 lịch sử & xếp hạng ---------- */
  $("#hi-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) renderHistory(b.dataset.tab); });
  async function renderHistory(tab) {
    show("s-hist");
    $$("#hi-tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === tab); });
    $("#hi-body").innerHTML = '<p class="g-sub">' + T("loading2") + "</p>";
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
      $("#hi-body").innerHTML = rows.length ? '<table class="g-table"><thead><tr><th>#</th><th>' + T("h_player") + "</th><th>" + T("h_total") + "</th><th>" + T("h_games") + "</th><th>🥇</th><th>" + T("h_best") + "</th><th>" + T("h_acc") + "</th></tr></thead><tbody>" +
        rows.map(function (a, i) {
          return '<tr class="' + (G.me && a.id === G.me.id ? "me" : "") + '"><td>' + (i + 1) + "</td><td>" + avatar(a.p.avatar, "g-av-sm") + " " + label({ name: a.p.name, no: a.p.name_no }) + "</td><td><b>" + a.total + "</b></td><td>" + a.games + "</td><td>" + a.wins + "</td><td>" + a.best + "</td><td>" + (a.c + a.w ? Math.round(a.c / (a.c + a.w) * 100) + "%" : "—") + "</td></tr>";
        }).join("") + "</tbody></table>" : '<p class="g-sub">' + T(tab === "week" ? "no_week" : "no_all") + "</p>";
    } catch (e) { $("#hi-body").innerHTML = '<p class="g-err">' + T("err") + ": " + esc(e.message || e) + "</p>"; }
  }
  async function histMine() {
    if (!G.me) { $("#hi-body").innerHTML = '<p class="g-sub">' + T("no_name") + "</p>"; return; }
    var r = await sb.from("game_results").select("match_id,team,score,rank,correct,wrong,best_streak,created_at,game_matches(title,mode,qtype,meaning_lang,minutes,teams)").eq("player_id", G.me.id).not("match_id", "is", null).order("created_at", { ascending: false }).limit(200);
    if (r.error) throw r.error;
    if (!r.data.length) { $("#hi-body").innerHTML = '<p class="g-sub">' + T("no_games") + "</p>"; return; }
    var cnt = await sb.from("game_results").select("match_id").in("match_id", r.data.map(function (x) { return x.match_id; }));
    var nIn = {}; (cnt.data || []).forEach(function (x) { nIn[x.match_id] = (nIn[x.match_id] || 0) + 1; });
    var best = r.data.reduce(function (m, x) { return Math.max(m, x.score); }, 0);
    var wins = r.data.filter(function (x) { return x.rank === 1; }).length;
    var streak = r.data.reduce(function (m, x) { return Math.max(m, x.best_streak); }, 0);
    var QT = { meaning: "🔤", gap: "📝", recall: "⌨️", mix: "🔀" };
    $("#hi-body").innerHTML =
      '<div class="g-stats"><div><b>' + r.data.length + "</b><span>" + T("s_games") + "</span></div><div><b>" + wins + "</b><span>" + T("s_wins") + "</span></div><div><b>" + best + "</b><span>" + T("s_best") + "</span></div><div><b>🔥" + streak + "</b><span>" + T("s_streak") + "</span></div></div>" +
      '<table class="g-table"><thead><tr><th>' + T("h_date") + "</th><th>" + T("h_topic") + "</th><th>" + T("h_score") + "</th><th>" + T("h_rank") + "</th><th>" + T("h_rw") + "</th></tr></thead><tbody>" +
      r.data.map(function (x) {
        var rm = x.game_matches || {}, d = new Date(x.created_at);
        return "<tr><td>" + d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</td><td><a href="?match=' + esc(x.match_id) + '">' + esc(rm.title || "—") + "</a>" +
          '<div class="g-sub">' + (QT[rm.qtype] || "") + " " + (FLAG[rm.meaning_lang] || "") + " " + (rm.mode === "kahoot" ? T("m_kahoot") : T("m_free")) + (x.team && TEAM_C[x.team] ? " · " + TEAM_C[x.team].e + " " + esc(teamName(x.team)) : "") + "</div></td><td><b>" + x.score + (x.score === best ? " 🏆" : "") + "</b></td><td>" +
          (x.rank === 1 ? "🥇" : x.rank) + "/" + (nIn[x.match_id] || "?") + "</td><td>✓" + x.correct + " ✗" + x.wrong + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  /* ---------- khởi động ---------- */
  $("#g-mylang").addEventListener("change", function () {
    G.myLang = this.value; writeLS(LS_LANG, G.myLang);
    applyUI();
    if (G.ch && G.me && G.view !== "screen") track();
    if (G.st && G.st.phase === "lobby") paintLobbyPlayers();
    if (G.st && G.st.phase === "play") {
      $("#p-mode").textContent = modeLine(G.st);
      var q = G.st.mode === "kahoot" ? G.st.q : G.myQ;
      if (q && q.type !== "gap") $("#p-vi").textContent = myFlag(q) + " " + myText(q) + (q.type === "recall" && q.len ? "  (" + q.len + ")" : "");
      if (q) $("#p-hint").textContent = T(q.type === "gap" ? "q_gap" : q.type === "recall" ? "q_recall" : "q_meaning");
    }
  });
  async function loadProfile() {
    var id = null; try { id = localStorage.getItem(LS_LINK); } catch (e) {}
    if (!id) return;
    var r = await sb.from("profiles").select("id,display_name,is_admin").eq("id", id).maybeSingle();
    if (r.data) G.profile = r.data;
  }
  async function route() {
    var room = param("room"), match = param("match");
    if (match) return showMatch(match);                        /* xem lại 1 ván đã lưu (từ lịch sử) */
    if (G.view === "screen" && room) return joinRoom(room);   /* màn hình chung không cần tên */
    if (!G.me) return renderNameScreen();
    if (room) return joinRoom(room);
    if (isTJ()) return openHostRoom();   /* host: vào thẳng PHÒNG CỐ ĐỊNH (kể cả mở từ chuột phải ?scope=) */
    return joinRoom(DEFAULT_ROOM);   /* người chơi: link trần = phòng của TJ */
  }
  (async function boot() {
    G.view = param("view");
    G.myLang = readLS(LS_LANG) || "room";
    $("#g-mylang").value = G.myLang;
    $("#g-mylang").hidden = G.view === "screen";
    applyUI();
    G.me = readLS(LS_ME);
    await loadProfile().catch(function () {});
    paintMe();
    route();
  })();
})();
