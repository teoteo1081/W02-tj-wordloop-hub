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
  var FREE_MS = { q: 10000, dict: 30000, write: 60000, sheet: 150000 };   /* "theo tốc độ" ở kiểu Tự do: mốc thời gian mỗi dạng */
  var POINTS = 100, REVEAL_MS = 3500, HOST_LOST_MS = 7000, HEARTBEAT_MS = 3000;

  /* ---------- chữ giao diện 4 tiếng (người chơi); phần cài đặt của host để tiếng Việt ---------- */
  var UI = {
    vi: { lang_room: "🌐 Theo phòng", same_name: "Tên \"{n}\" đã có người dùng: {list}.\nNếu là BẠN (chơi ở máy/trình duyệt khác) -> gõ số của bạn (vd 1) để giữ lịch sử.\nNếu là người khác -> để trống và bấm OK.", tab_other: "Game đã được mở ở tab khác — tab này tạm dừng.", tab_busy: "Ván đang chơi ở tab khác — tab này không vào phòng để khỏi làm hỏng ván.", tab_use: "Dùng game ở tab này", q_en2m: "Chọn nghĩa đúng của từ tiếng Anh này", pts_speed: "điểm tốc độ", h_right: "✓ Đúng", h_wrong: "✗ Sai", s_bestc: "nhiều câu đúng nhất / 1 ván", q_sheet: "Chọn từ cho TẤT CẢ chỗ trống rồi bấm Nộp", q_write: "Đặt 1 câu tiếng Anh có dùng từ này", q_dict: "Bấm 🔊 nghe rồi gõ lại CẢ CÂU", listen: "🔊 Nghe", headphones: "🎧 Dùng tai nghe để không lọt tiếng vào voice", submit_sheet: "📄 Nộp bài", grading: "✍️ Đang chấm câu của mọi người…", write_ph: "Viết 1 câu tiếng Anh…", dict_ph: "Gõ lại câu vừa nghe…", r_sheet: "✓ {k}/{n} chỗ đúng", r_dict: "✓ {k}/{n} từ đúng", r_write: "Điểm câu {p}/100 (ngữ pháp {g}/50 · dùng từ {u}/50)", fix: "Sửa:", your_ans: "Bạn gõ:", sent_ok: "Đã nộp — chờ mọi người…", mother_h: "Nghĩa hiển thị bằng (tiếng mẹ đẻ)", mother_tt: "Tiếng mẹ đẻ của bạn (chữ giao diện + nghĩa)", name_h: "Bạn tên gì?", name_sub: "Máy này sẽ nhớ tên cho lần sau — không cần email.", name_ph: "Nhập tên…", avatar_h: "Chọn ảnh đại diện", upload: "📷 Tải ảnh của bạn", save: "Lưu & tiếp tục →", need_name: "Nhập tên trước nhé.", saving: "Đang lưu…", uploading: "Đang tải ảnh…", not_image: "File này không phải ảnh.",
      join_h: "Vào phòng", code_ph: "MÃ PHÒNG", go: "Vào", hist_btn: "📜 Lịch sử & Xếp hạng", no_room: "Không tìm thấy phòng {c}.", room: "Phòng", room_code: "Mã phòng", copy_link: "🔗 Copy link mời", copied: "✓ Đã copy", screen_btn: "📺 Màn hình chung", players: "Người chơi", vocab: "Từ vựng", wait_host: "Chờ host bắt đầu…", host_away: "Host chưa vào phòng — xem trước, chờ host tới nhé.", wait_next: "Chờ host mở ván mới…", host_lost: "⚠ Host mất kết nối — chờ host quay lại…",
      m_kahoot: "Cùng 1 câu", m_free: "Tự do", sec_q: "giây/câu", q_meaning: "Chọn từ tiếng Anh đúng nghĩa", q_gap: "Chọn từ điền vào chỗ trống", q_recall: "Gõ từ tiếng Anh của nghĩa này", type_ph: "Gõ từ tiếng Anh…", submit: "Gửi",
      picked: "Đã trả lời — chờ mọi người…", answered: "{n} người đã trả lời", right: "✓ Đúng!", wrong: "✗ Sai — đáp án: {a}", timeout: "⏱ Hết giờ — đáp án: {a}", answer: "Đáp án: {a}", fastest: "⚡ Nhanh nhất: {n}", n_right: "{n} người đúng", time_up: "⏱ Hết giờ — chờ tổng kết…", loading: "Đang tải từ vựng…", mc: "Bạn đang làm MC — mở 📺 Màn hình chung để cả nhóm cùng xem.",
      results: "🏁 Kết quả", back: "← Về trang game", nobody: "Chưa ai trả lời câu nào.", ppl: "người", avg: "TB", team_red: "Đội Đỏ", team_blue: "Đội Xanh", team_green: "Đội Lá", team_yellow: "Đội Vàng", click_team: "· host bấm tên để đổi đội",
      tab_me: "Của tôi", tab_week: "Tuần này", tab_all: "Mọi thời gian", h_player: "Người chơi", h_total: "Tổng điểm", h_games: "Trận", h_best: "Cao nhất", h_acc: "Đúng", h_date: "Ngày", h_topic: "Chủ đề", h_score: "Điểm", h_rank: "Hạng", h_rw: "Đúng/Sai",
      s_games: "trận", s_wins: "lần 🥇", s_best: "kỷ lục điểm", s_streak: "chuỗi dài nhất", no_name: "Bạn chưa đặt tên trên máy này.", no_games: "Bạn chưa chơi trận nào.", no_week: "Chưa có trận nào trong 7 ngày qua.", no_all: "Chưa có trận nào.", loading2: "Đang tải…", join_at: "Vào phòng tại", race: "🏁 Đua tự do!", ended: "🏁 Kết thúc!", q_no: "Câu {n}", err: "Lỗi" },
    en: { lang_room: "🌐 Room language", same_name: "The name \"{n}\" is already used: {list}.\nIf that is YOU (on another device/browser) -> type your number (e.g. 1) to keep your history.\nIf it is someone else -> leave empty and press OK.", tab_other: "The game was opened in another tab — this tab is paused.", tab_busy: "A round is being played in another tab — this tab stays out so it won't break the round.", tab_use: "Use the game in this tab", q_en2m: "Choose the correct meaning of this English word", pts_speed: "speed pts", h_right: "✓ Correct", h_wrong: "✗ Wrong", s_bestc: "most correct in one game", q_sheet: "Fill in ALL the blanks, then press Submit", q_write: "Write one English sentence using this word", q_dict: "Press 🔊 to listen, then type the WHOLE sentence", listen: "🔊 Listen", headphones: "🎧 Use headphones so the sound stays out of the voice call", submit_sheet: "📄 Submit", grading: "✍️ Grading everyone's sentences…", write_ph: "Write one English sentence…", dict_ph: "Type the sentence you heard…", r_sheet: "✓ {k}/{n} blanks correct", r_dict: "✓ {k}/{n} words correct", r_write: "Sentence score {p}/100 (grammar {g}/50 · word use {u}/50)", fix: "Fix:", your_ans: "You typed:", sent_ok: "Submitted — waiting for others…", mother_h: "Show meanings in (your native language)", mother_tt: "Your native language (interface + meanings)", name_h: "What's your name?", name_sub: "This device will remember you next time — no email needed.", name_ph: "Enter your name…", avatar_h: "Choose an avatar", upload: "📷 Upload your photo", save: "Save & continue →", need_name: "Please enter a name.", saving: "Saving…", uploading: "Uploading…", not_image: "That file is not an image.",
      join_h: "Join a room", code_ph: "ROOM CODE", go: "Join", hist_btn: "📜 History & Rankings", no_room: "Room {c} not found.", room: "Room", room_code: "Room code", copy_link: "🔗 Copy invite link", copied: "✓ Copied", screen_btn: "📺 Shared screen", players: "Players", vocab: "Vocabulary", wait_host: "Waiting for the host to start…", host_away: "The host is not here yet — feel free to look around.", wait_next: "Waiting for the host to start a new round…", host_lost: "⚠ Host disconnected — waiting for the host to return…",
      m_kahoot: "Same question", m_free: "Free play", sec_q: "s/question", q_meaning: "Choose the English word for this meaning", q_gap: "Choose the word that fills the blank", q_recall: "Type the English word for this meaning", type_ph: "Type the English word…", submit: "Submit",
      picked: "Answered — waiting for others…", answered: "{n} answered", right: "✓ Correct!", wrong: "✗ Wrong — answer: {a}", timeout: "⏱ Time's up — answer: {a}", answer: "Answer: {a}", fastest: "⚡ Fastest: {n}", n_right: "{n} correct", time_up: "⏱ Time's up — waiting for results…", loading: "Loading vocabulary…", mc: "You are the MC — open 📺 Shared screen so everyone can watch.",
      results: "🏁 Results", back: "← Back to game home", nobody: "Nobody answered yet.", ppl: "players", avg: "avg", team_red: "Red Team", team_blue: "Blue Team", team_green: "Green Team", team_yellow: "Yellow Team", click_team: "· host taps a name to switch team",
      tab_me: "Mine", tab_week: "This week", tab_all: "All time", h_player: "Player", h_total: "Total", h_games: "Games", h_best: "Best", h_acc: "Correct", h_date: "Date", h_topic: "Topic", h_score: "Score", h_rank: "Rank", h_rw: "Right/Wrong",
      s_games: "games", s_wins: "🥇 wins", s_best: "best score", s_streak: "longest streak", no_name: "You haven't set a name on this device.", no_games: "You haven't played yet.", no_week: "No games in the last 7 days.", no_all: "No games yet.", loading2: "Loading…", join_at: "Join at", race: "🏁 Free race!", ended: "🏁 Finished!", q_no: "Question {n}", err: "Error" },
    es: { lang_room: "🌐 Idioma de la sala", same_name: "El nombre \"{n}\" ya existe: {list}.\nSi eres TÚ (en otro dispositivo/navegador) -> escribe tu número (p. ej. 1) para conservar tu historial.\nSi es otra persona -> déjalo vacío y pulsa OK.", tab_other: "El juego se abrió en otra pestaña — esta pestaña está en pausa.", tab_busy: "Hay una partida en otra pestaña — esta pestaña no entra para no romperla.", tab_use: "Usar el juego en esta pestaña", q_en2m: "Elige el significado correcto de esta palabra en inglés", pts_speed: "pts de velocidad", h_right: "✓ Aciertos", h_wrong: "✗ Fallos", s_bestc: "más aciertos en una partida", q_sheet: "Completa TODOS los espacios y pulsa Enviar", q_write: "Escribe una oración en inglés con esta palabra", q_dict: "Pulsa 🔊 para escuchar y escribe la oración COMPLETA", listen: "🔊 Escuchar", headphones: "🎧 Usa auriculares para que el sonido no pase a la llamada", submit_sheet: "📄 Enviar", grading: "✍️ Corrigiendo las oraciones…", write_ph: "Escribe una oración en inglés…", dict_ph: "Escribe la oración que escuchaste…", r_sheet: "✓ {k}/{n} espacios correctos", r_dict: "✓ {k}/{n} palabras correctas", r_write: "Nota de la oración {p}/100 (gramática {g}/50 · uso {u}/50)", fix: "Corrección:", your_ans: "Escribiste:", sent_ok: "Enviado — esperando a los demás…", mother_h: "Mostrar significados en (tu idioma materno)", mother_tt: "Tu idioma materno (interfaz + significados)", name_h: "¿Cómo te llamas?", name_sub: "Este dispositivo recordará tu nombre — sin correo.", name_ph: "Escribe tu nombre…", avatar_h: "Elige un avatar", upload: "📷 Sube tu foto", save: "Guardar y continuar →", need_name: "Escribe un nombre primero.", saving: "Guardando…", uploading: "Subiendo…", not_image: "Ese archivo no es una imagen.",
      join_h: "Entrar a una sala", code_ph: "CÓDIGO", go: "Entrar", hist_btn: "📜 Historial y ranking", no_room: "No se encontró la sala {c}.", room: "Sala", room_code: "Código de sala", copy_link: "🔗 Copiar enlace", copied: "✓ Copiado", screen_btn: "📺 Pantalla compartida", players: "Jugadores", vocab: "Vocabulario", wait_host: "Esperando a que el anfitrión empiece…", host_away: "El anfitrión aún no ha llegado — puedes mirar mientras tanto.", wait_next: "Esperando a que el anfitrión abra otra ronda…", host_lost: "⚠ El anfitrión se desconectó — esperando a que vuelva…",
      m_kahoot: "Misma pregunta", m_free: "Libre", sec_q: "s/pregunta", q_meaning: "Elige la palabra en inglés de este significado", q_gap: "Elige la palabra que completa el espacio", q_recall: "Escribe la palabra en inglés de este significado", type_ph: "Escribe la palabra en inglés…", submit: "Enviar",
      picked: "Respondido — esperando a los demás…", answered: "{n} respondieron", right: "✓ ¡Correcto!", wrong: "✗ Incorrecto — respuesta: {a}", timeout: "⏱ Se acabó el tiempo — respuesta: {a}", answer: "Respuesta: {a}", fastest: "⚡ Más rápido: {n}", n_right: "{n} acertaron", time_up: "⏱ Se acabó el tiempo — esperando resultados…", loading: "Cargando vocabulario…", mc: "Eres el presentador — abre 📺 Pantalla compartida para que todos vean.",
      results: "🏁 Resultados", back: "← Volver", nobody: "Nadie ha respondido todavía.", ppl: "jugadores", avg: "prom.", team_red: "Equipo Rojo", team_blue: "Equipo Azul", team_green: "Equipo Verde", team_yellow: "Equipo Amarillo", click_team: "· el anfitrión toca un nombre para cambiar de equipo",
      tab_me: "Mío", tab_week: "Esta semana", tab_all: "Siempre", h_player: "Jugador", h_total: "Total", h_games: "Partidas", h_best: "Mejor", h_acc: "Aciertos", h_date: "Fecha", h_topic: "Tema", h_score: "Puntos", h_rank: "Puesto", h_rw: "Bien/Mal",
      s_games: "partidas", s_wins: "veces 🥇", s_best: "récord", s_streak: "racha más larga", no_name: "Aún no tienes nombre en este dispositivo.", no_games: "Aún no has jugado.", no_week: "No hubo partidas en los últimos 7 días.", no_all: "Aún no hay partidas.", loading2: "Cargando…", join_at: "Entra en", race: "🏁 ¡Carrera libre!", ended: "🏁 ¡Terminado!", q_no: "Pregunta {n}", err: "Error" },
    zh: { lang_room: "🌐 跟随房间", same_name: "名字 \"{n}\" 已被使用：{list}。\n如果是你（换了设备/浏览器）-> 输入你的编号（如 1）以保留历史记录。\n如果是别人 -> 留空并点确定。", tab_other: "游戏已在另一个标签页打开——此标签页已暂停。", tab_busy: "另一个标签页正在进行比赛——此标签页不进入房间，以免打乱比赛。", tab_use: "在此标签页使用游戏", q_en2m: "选出这个英文单词的正确意思", pts_speed: "速度分", h_right: "✓ 答对", h_wrong: "✗ 答错", s_bestc: "单局最多答对", q_sheet: "给所有空格选词，然后点提交", q_write: "用这个词写一个英文句子", q_dict: "点 🔊 听，然后输入整句话", listen: "🔊 听", headphones: "🎧 请戴耳机，避免声音传进语音通话", submit_sheet: "📄 提交", grading: "✍️ 正在批改大家的句子…", write_ph: "写一个英文句子…", dict_ph: "输入你听到的句子…", r_sheet: "✓ {k}/{n} 空正确", r_dict: "✓ {k}/{n} 词正确", r_write: "句子得分 {p}/100（语法 {g}/50 · 用词 {u}/50）", fix: "修改：", your_ans: "你输入的：", sent_ok: "已提交——等待其他人…", mother_h: "释义显示语言（你的母语）", mother_tt: "你的母语（界面 + 释义）", name_h: "你叫什么名字？", name_sub: "本设备会记住你的名字——无需邮箱。", name_ph: "输入名字…", avatar_h: "选择头像", upload: "📷 上传照片", save: "保存并继续 →", need_name: "请先输入名字。", saving: "保存中…", uploading: "上传中…", not_image: "这个文件不是图片。",
      join_h: "加入房间", code_ph: "房间码", go: "加入", hist_btn: "📜 历史与排名", no_room: "找不到房间 {c}。", room: "房间", room_code: "房间码", copy_link: "🔗 复制邀请链接", copied: "✓ 已复制", screen_btn: "📺 共享屏幕", players: "玩家", vocab: "词汇", wait_host: "等待主持人开始…", host_away: "主持人还没进房间——可以先看看。", wait_next: "等待主持人开始新一局…", host_lost: "⚠ 主持人断线了——等待主持人回来…",
      m_kahoot: "同一题", m_free: "自由模式", sec_q: "秒/题", q_meaning: "选出这个意思的英文单词", q_gap: "选出填入空格的单词", q_recall: "输入这个意思的英文单词", type_ph: "输入英文单词…", submit: "提交",
      picked: "已作答——等待其他人…", answered: "{n} 人已作答", right: "✓ 正确！", wrong: "✗ 错误——答案：{a}", timeout: "⏱ 时间到——答案：{a}", answer: "答案：{a}", fastest: "⚡ 最快：{n}", n_right: "{n} 人答对", time_up: "⏱ 时间到——等待结果…", loading: "正在加载词汇…", mc: "你是主持人——打开 📺 共享屏幕让大家一起看。",
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
    myLang: "room", lastState: 0, lastPush: 0,
    tab: Math.random().toString(36).slice(2)   /* id RIÊNG từng tab: 2 tab cùng trình duyệt có chung G.me.id */
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
  function uiLang() { return G.view === "screen" ? roomLang(G.st) : G.myLang && G.myLang !== "room" ? G.myLang : "vi"; }
  function guessLang() { var l = (navigator.language || "").slice(0, 2).toLowerCase(); return { vi: "vi", es: "es", zh: "zh", en: "en" }[l] || "vi"; }
  /* 🔒 "Ép cả phòng" CHỈ áp cho câu dạng NGHĨA (TJ 2026-09-30) — Điền chỗ trống là câu tiếng Anh, Gõ từ vẫn
     theo tiếng riêng từng người; trộn cả 3 thì chỉ câu Nghĩa bị ép. qtype = dạng của CÂU đang hỏi. */
  function effLang(pref, st, qtype) {
    var forced = st && st.force && (!qtype || qtype === "meaning" || qtype === "en2m");
    return forced ? roomLang(st) : pref && pref !== "room" ? pref : roomLang(st);
  }
  function T(k, vars) {
    var s = (UI[uiLang()] || UI.vi)[k]; if (s == null) s = UI.vi[k] || k;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, x) { return vars[x] == null ? "" : vars[x]; });
    return s;
  }
  function applyUI() {
    document.documentElement.lang = uiLang();
    $$("[data-t]").forEach(function (el) { el.textContent = T(el.dataset.t); });
    $$("[data-tp]").forEach(function (el) { el.placeholder = T(el.dataset.tp); });
    $$("[data-tt]").forEach(function (el) { el.title = T(el.dataset.tt); });
    $$("#n-langs [data-ml], #l-langs [data-ml]").forEach(function (b) { b.classList.toggle("on", b.dataset.ml === G.myLang); });
    $("#p-typein").placeholder = T("type_ph");
    if (G.room) { $("#g-room-badge").textContent = T("room") + " " + G.room.code; var tt = (G.st && G.st.title) || ""; $("#l-info").textContent = tt ? T("vocab") + ": " + tt : ""; }
  }
  function myText(q) { var t = q.texts || {}; return t[effLang(G.myLang, G.st, q.type)] || t.en || t.vi || ""; }
  function myFlag(q) { var t = q.texts || {}, l = effLang(G.myLang, G.st, q.type); return FLAG[t[l] ? l : t.en ? "en" : "vi"]; }

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
  $("#l-langs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ml]"); if (!b) return;
    $("#g-mylang").value = b.dataset.ml; $("#g-mylang").dispatchEvent(new Event("change"));
  });
  $("#n-langs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ml]"); if (!b) return;
    G.myLang = b.dataset.ml; G.langSet = true; writeLS(LS_LANG, G.myLang); $("#g-mylang").value = G.myLang; applyUI();
  });
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
        var r = await sb.from("game_players").select("id,name_no,profile_id").ilike("name", name.replace(/[%_]/g, "\\$&")).order("name_no");
        if (r.error) throw r.error;
        /* máy MỚI (trình duyệt khác / đã xoá dữ liệu) gõ lại tên cũ -> trước đây luôn tạo người mới #2, #3… nên
           "Của tôi" trống trơn (TJ 2026-09-30: TJ#2, Anti_TJ#3). Nay: cùng hồ sơ WordLoop -> tự dùng lại; còn lại hỏi. */
        var mine = G.me ? null : (r.data.find(function (x) { return G.profile && x.profile_id === G.profile.id; }) || pickOld(name, r.data));
        if (mine) G.me = { id: mine.id };
        else if (mine === false) return $("#n-err").textContent = "";
        no = mine ? mine.name_no : r.data.length ? r.data[r.data.length - 1].name_no + 1 : 1;
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
  /* tên đã có -> hỏi có phải chính mình không (giữ lịch sử). null = người mới, false = huỷ */
  function pickOld(name, rows) {
    if (!rows.length) return null;
    var nos = rows.map(function (x) { return x.name_no; });
    var a = prompt(T("same_name", { n: name, list: nos.map(function (n) { return n > 1 ? name + " #" + n : name; }).join(", ") }), "");   /* để trống sẵn: người lạ bấm OK không vô tình nhận lịch sử người khác */
    if (a == null) return false;
    a = a.trim().replace(/^#/, "");
    return rows.find(function (x) { return String(x.name_no) === a; }) || null;
  }
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
    async function all(t, cols, order) {   /* đọc hết (PostgREST trả tối đa 1000 dòng/lần) */
      var out = [], from = 0;
      for (;;) { var r = await sb.from(t).select(cols).order(order).range(from, from + 999); if (r.error) throw r.error; out = out.concat(r.data); if (r.data.length < 1000) return out; from += 1000; }
    }
    try {
      var q = await Promise.all([all("hubs", "id,name,sort", "sort"), all("notebooks", "id,name,sort,hub_id,parent_notebook_id", "sort"), all("sections", "id,name,sort,notebook_id", "sort"),
        all("pages", "id,name,sort,section_id", "sort"), all("batches", "id,name,sort,page_id", "sort"), all("blocks", "id,name,global_index,batch_id", "global_index")]);
      TREE = { hubs: q[0], notebooks: q[1], sections: q[2], pages: q[3], batches: q[4], blocks: q[5] };
    } catch (err) { $("#h-tree").innerHTML = '<p class="g-err">Không tải được cây: ' + esc(err.message || err) + "</p>"; return; }
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
          return node("sections", sc, kids("pages", "section_id", sc.id).map(function (pg) {
            return node("pages", pg, kids("batches", "page_id", pg.id).map(function (bt) {
              return node("batches", bt, kids("blocks", "batch_id", bt.id).map(function (bl) { return node("blocks", bl, ""); }).join(""));
            }).join(""));
          }).join(""));
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
      ? G.pool.length + " từ khác nhau · có nghĩa: " + poolCounts() + " · 📝 " + G.gaps.length + " câu điền chỗ trống · 📄 " + (G.sheets || []).length + " phiếu Block · 🎧 " + (G.dicts || []).length + " câu dictation"
      : "Chưa chọn chủ đề.";
  }
  /* đủ dữ liệu để chơi dạng câu này chưa? (trả về lời nhắc cho host, "" = ổn) */
  function readyMsg(qt, lang) {
    if (!G.st || !G.st.scope || !G.st.scope.length) return "Chọn chủ đề (nhánh từ vựng) trước đã.";
    var nm = poolFor(lang).length, ng = G.gaps.length;
    if ((qt === "meaning" || qt === "recall" || qt === "en2m") && nm < 4) return "Chỉ có " + nm + " từ có nghĩa bằng tiếng đã chọn — cần ít nhất 4. (" + poolCounts() + ")";
    if (qt === "gap" && ng < 4) return "Phạm vi này chỉ có " + ng + " câu có chỗ trống trong bài đọc — cần ít nhất 4 (chọn Block/Page đã có bài đọc).";
    if (qt === "mix" && nm < 4) return "Chỉ có " + nm + " từ có nghĩa — cần ít nhất 4.";
    if (qt === "sheet" && !(G.sheets || []).length) return "Phạm vi này chưa có Block nào có bài đọc (cần ≥3 chỗ trống) — chọn Block/Page đã có bài đọc.";
    if (qt === "dict" && (G.dicts || []).length < 2) return "Phạm vi này chưa đủ câu trong bài đọc để làm Dictation.";
    if (qt === "write" && G.pool.length < 1) return "Chưa có từ nào.";
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
    /* 📄 phiếu theo Block: cả bài đọc, mỗi từ của kho (lần xuất hiện đầu) thành 1 chỗ trống, tối đa 12 */
    var sheets = [];
    blkRows.forEach(function (b) {
      var marked = String(b.context_passage || ""), cut = marked.indexOf(META_SEP);
      if (cut >= 0) marked = marked.slice(0, cut);
      var ans = [], wids = [], used = {};
      var text = marked.replace(/\[([^\]]+)\]/g, function (all, term) {
        var w = byTerm[norm(term)];
        if (!w || used[norm(term)] || ans.length >= 12) return term;
        used[norm(term)] = 1; ans.push(w.term); wids.push(w.wid);
        return "{{G" + (ans.length - 1) + "}}";
      });
      if (ans.length >= 3) sheets.push({ block: b.id, text: text.trim(), ans: ans, wids: wids });
    });
    /* 🎧 câu dictation = câu chỗ trống với từ đã điền lại, 5–24 từ */
    var dicts = gaps.map(function (g) { return { wid: g.wid, term: g.term, sent: g.text.replace("{{GAP}}", g.term) }; })
      .filter(function (d) { var n = d.sent.split(/\s+/).length; return n >= 5 && n <= 24; });
    G.pool = pool; G.gaps = gaps; G.sheets = sheets; G.dicts = dicts;
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
  /* thời gian mỗi câu (giây) theo dạng: phiếu = giây/câu × số chỗ trống; đặt câu ≥60; dictation ≥30 */
  function qLimit(q, qs) {
    if (q.type === "sheet") return Math.min(600, Math.max(60, qs * q.n));
    if (q.type === "write") return Math.max(60, qs);
    if (q.type === "dict") return Math.max(30, qs);
    return qs;
  }
  function makeQ(qtype, lang, langs) {
    var t = qtype;
    if (t === "sheet") {
      var sh = draw("sheet", G.sheets);
      return { type: "sheet", block: sh.block, text: sh.text, ans: sh.ans, wids: sh.wids, n: sh.ans.length, bank: shuffle(sh.ans.slice()) };
    }
    if (t === "dict") { var d = draw("dict", G.dicts); return { type: "dict", wid: d.wid, term: d.term, say: d.sent, ans: d.sent, n: d.sent.split(/\s+/).length }; }
    if (t === "write") { var ww = draw("write" + lang, poolFor(lang).length ? poolFor(lang) : G.pool); return { type: "write", wid: ww.wid, term: ww.term, ans: ww.term, texts: ww.m }; }
    if (t === "mix") t = shuffle(["meaning", "en2m", "recall"].concat(G.gaps.length >= 4 ? ["gap"] : []))[0];
    if (t === "gap" && G.gaps.length >= 4) {
      var g = draw("gap", G.gaps), gw = G.pool.find(function (x) { return x.wid === g.wid; }) || { term: g.term, block: g.block };
      return { type: "gap", wid: g.wid, ans: g.term, sent: g.text, texts: gw.m || {}, opts: distractors(gw, G.pool) };
    }
    var p = langs && langs.length ? poolForAll(langs) : poolFor(lang);
    if (p.length < 4) p = poolFor(lang);   /* thiếu từ có nghĩa ở MỌI tiếng -> theo tiếng phòng, ai thiếu thì hiện nghĩa tiếng Anh */
    if (p.length < 4) p = G.pool;
    var w = draw(t + lang + (langs || []).join(""), p);
    var q = { type: t === "recall" ? "recall" : t === "en2m" ? "en2m" : "meaning", wid: w.wid, ans: w.term, texts: w.m };
    if (q.type === "meaning") q.opts = distractors(w, p);
    if (q.type === "en2m") {   /* hiện TỪ tiếng Anh, 4 lựa chọn = NGHĨA (mỗi người thấy theo tiếng mẹ đẻ của mình) */
      q.word = w.term; q.opts = distractors(w, p); q.optTexts = {};
      q.opts.forEach(function (o) { var x = p.find(function (y) { return norm(y.term) === norm(o); }) || G.pool.find(function (y) { return norm(y.term) === norm(o); }); q.optTexts[o] = x ? x.m : {}; });
    }
    else q.len = w.term.length;
    return q;
  }

  /* ---------- 1 TAB / TRÌNH DUYỆT ----------
     Người chơi lưu theo trình duyệt (localStorage) -> 2 tab (vd bấm chuột phải "🎮 Mở phòng game" lần nữa để đổi
     chủ đề) là CÙNG 1 người: cả 2 tab tự nhận host, gửi 2 trạng thái đè nhau -> màn hình giật về phòng chờ và câu
     hỏi nhảy lung tung (TJ 2026-09-30). Nay tab mới vào thì tab cũ tạm dừng; RIÊNG lúc tab cũ đang giữa ván thì
     tab mới đứng ngoài (có nút "Dùng game ở tab này" để giành, chấp nhận bỏ ván). 📺 và xem lại ván không tính. */
  var BC = null; try { BC = new BroadcastChannel("tjwl_game_tabs"); } catch (e) {}
  function leaveRoom() {
    clearInterval(G.hostTimer); clearInterval(G.aliveTimer); clearInterval(G.tick);
    try { if (G.ch) { G.ch.untrack(); sb.removeChannel(G.ch); } } catch (e) {}
    G.ch = null; G.isHost = false; G.cand = false; G.st = null; G.room = null; G.online = [];
  }
  function pauseTab(msg) { G.asleep = true; leaveRoom(); $("#g-room-badge").hidden = true; $("#t-msg").textContent = msg; show("s-tab"); }
  if (BC) BC.onmessage = function (e) {
    var d = e.data || {}; if (d.tab === G.tab || G.asleep || !G.room || G.view === "screen") return;
    if (d.t === "claim") {
      if (G.st && G.st.phase === "play" && !d.force) BC.postMessage({ t: "busy", tab: G.tab, to: d.tab });
      else pauseTab(T("tab_other"));
    } else if (d.t === "busy" && d.to === G.tab) G.busyElsewhere = true;
  };
  async function claimTab(force) {   /* true = tab này được vào phòng */
    if (!BC || G.view === "screen") return true;
    G.busyElsewhere = false;
    BC.postMessage({ t: "claim", tab: G.tab, force: !!force });
    await new Promise(function (r) { setTimeout(r, 300); });
    if (G.busyElsewhere) { pauseTab(T("tab_busy")); return false; }
    return true;
  }
  $("#t-use").addEventListener("click", async function () {
    if (!(await claimTab(true))) return;
    G.asleep = false;
    route();
  });

  /* ---------- 3. vào phòng ---------- */
  async function joinRoom(code) {
    code = code.toUpperCase();
    if (G.view !== "screen" && !G.asleep && !G.room && !(await claimTab(false))) return;
    var r = await sb.from("game_rooms").select("*").eq("code", code).maybeSingle();
    if (r.error || !r.data) {
      if (G.view === "screen") { show("s-screen"); $("#sc-status").textContent = T("no_room", { c: code }); return; }
      show("s-home"); $("#h-err").textContent = T("no_room", { c: code }); return;
    }
    G.room = r.data;
    /* ỨNG VIÊN host = máy đăng nhập WordLoop bằng hồ sơ TJ. Nhiều máy/cửa sổ cùng đăng nhập TJ (vd 1 trình duyệt đặt tên
       người chơi "Anti_TJ" nhưng từng mở link ?u= của TJ) -> CHỈ máy vào phòng SỚM NHẤT điều khiển, các máy kia là người chơi
       (xem onPresence). Máy host thoát -> máy TJ kế tiếp tự lên thay. */
    G.cand = G.view !== "screen" && isTJ() && G.profile.id === G.room.host_id;
    G.since = Date.now();
    G.isHost = G.cand;
    applyUI();
    $("#g-room-badge").hidden = !G.isHost;
    if (G.isHost) {
      restoreHost();
      if (G.st && G.st.scope) await ensurePool(G.st.scope);
    }
    connect();
    if (G.view === "screen") { show("s-screen"); $("#sc-code").textContent = code; paintScreen(); }
    else if (!G.st || G.st.phase === "lobby") renderLobby();
  }
  /* ĐÃ TẮT khôi phục ván (TJ 2026-09-30: "tự khởi động chơi hoài" — host rớt mạng/tải lại trang thì ván đó bỏ,
     vào lại là phòng chờ). Dọn luôn các ván cũ từng lưu trong localStorage (tjwl_game_host_*) từ bản trước. */
  function saveHost() {}
  function restoreHost() {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(LS_HOST) === 0) localStorage.removeItem(k); }); } catch (e) {}
  }

  function connect() {
    if (G.ch) sb.removeChannel(G.ch);
    var key = G.view === "screen" ? "screen-" + Math.random().toString(36).slice(2) : G.me.id;
    G.ch = sb.channel("game:" + G.room.code, { config: { broadcast: { self: true }, presence: { key: key } } });
    G.ch.on("presence", { event: "sync" }, onPresence);
    G.ch.on("broadcast", { event: "state" }, function (m) {
      var d = m.payload;
      /* so theo TAB (htab), không theo người chơi: 2 tab cùng trình duyệt chung hid -> trước đây không tab nào nhường */
      var other = d.htab ? d.htab !== G.tab : !!(d.hid && G.me && d.hid !== G.me.id);
      if (G.isHost && other && (d.hsince || 0) < G.since) { setHost(false); }   /* có host vào trước -> nhường */
      if (G.isHost && other) return;   /* host không nhận trạng thái của host khác */
      onState(d);
    });
    G.ch.on("broadcast", { event: "ans" }, function (m) { if (G.isHost) hostOnAnswer(m.payload); });
    G.ch.on("broadcast", { event: "hello" }, function () { if (G.isHost && G.st) push(); });
    G.ch.on("broadcast", { event: "graded" }, function (m) {   /* Tự do + đặt câu: kết quả chấm riêng của mình */
      var d = m.payload; if (!G.me || d.pid !== G.me.id || !G.myQ || !G.waitGrade) return;
      G.waitGrade = false;
      G.myQ.res = {}; G.myQ.res[G.me.id] = Object.assign({}, d.r, { p: d.p, text: d.r.text || $("#p-typein").value });
      revealRich(G.myQ, {}, "#p-msg", "#p-res", "#p-vi");
      recordMyProgress(G.myQ.wid, d.r.g + d.r.u >= 60);
      setTimeout(freeNext, 6000);
    });
    clearInterval(G.aliveTimer);
    G.aliveTimer = setInterval(function () { if (G.ch && G.me && G.view !== "screen") track(); onPresence(); }, 10000);
    G.ch.subscribe(async function (s) {
      if (s !== "SUBSCRIBED") return;
      if (G.view !== "screen") await track();
      if (G.isHost) {
        if (!G.st) G.st = { phase: "lobby", scoring: G.room.scoring || "q", scope: G.room.scope || [], title: G.room.title || "", mode: G.room.mode, qtype: G.room.qtype || "meaning", lang: G.room.meaning_lang || "vi", force: false, minutes: +G.room.minutes, qs: G.room.q_seconds, teams: 0, teamOf: {}, scores: {}, roster: {} };
        push();
        if (G.st.phase === "play") onState(pub());
        else initHostLobby();
      } else G.ch.send({ type: "broadcast", event: "hello", payload: {} });   /* xin host gửi lại trạng thái hiện tại */
    });
  }
  function track() { return G.ch.track({ ts: Date.now(), id: G.me.id, tab: G.tab, cand: !!G.cand, since: G.since, pf: G.profile ? G.profile.id : null, name: G.me.name, no: G.me.name_no, avatar: G.me.avatar, host: G.isHost, play: G.isHost ? hostPlays() : true, lang: G.myLang }); }
  /* "Host" do PHÒNG quyết định (hồ sơ = host_id của phòng), không tin máy tự nhận — bản cũ đang mở ở máy khác
     (vd Anti_TJ lúc còn admin) có thể vẫn gửi host:true */
  function isRoomHost(p) { return !!(p && p.pf && G.room && p.pf === G.room.host_id && p.host); }
  function hostPlays() { var c = $("#l-hostplay"); return !c || c.checked; }
  function players() { return G.online.filter(function (p) { return p.play !== false; }); }
  /* ai THOÁT thì không hiện nữa: mỗi máy gửi nhịp "còn ở đây" 10s/lần (track lại với ts mới); máy nào 25s
     không đổi ts -> coi như đã thoát (Supabase không phải lúc nào cũng báo rời phòng ngay, nhất là khi trình
     duyệt chuyển trang chứ không đóng hẳn). So theo đồng hồ CỦA MÁY MÌNH lúc thấy ts đổi -> không lệch giờ giữa các máy. */
  var PRESENCE_ALIVE_MS = 25000;
  G.seen = {};
  function onPresence() {
    if (!G.ch) return;
    var ps = G.ch.presenceState(), list = [], cands = [], now = Date.now();
    Object.keys(ps).forEach(function (k) {   /* 1 key (= người chơi) có thể có NHIỀU tab -> xét hết, không chỉ tab cuối */
      var best = null;
      ps[k].forEach(function (p) {
        if (!p || !p.id) return;
        var sk = p.tab || p.id, sn = G.seen[sk];
        if (!sn || sn.ts !== p.ts) sn = G.seen[sk] = { ts: p.ts, at: now };
        var mine = p.tab ? p.tab === G.tab : !!(G.me && p.id === G.me.id);
        if (!(now - sn.at < PRESENCE_ALIVE_MS || mine)) return;
        if (p.cand) cands.push(p);
        if (!best || mine || (best.tab !== G.tab && (p.ts || 0) > (best.ts || 0))) best = p;
      });
      if (best) list.push(best);
    });
    G.online = list;
    if (G.cand) {   /* nhiều máy/tab TJ: tab vào sớm nhất làm host */
      var ctrl = cands.filter(function (p) { return p.pf === G.room.host_id; })
        .sort(function (a, b) { return (a.since || 0) - (b.since || 0) || ((a.tab || a.id) < (b.tab || b.id) ? -1 : 1); })[0];
      var want = !!(ctrl && ctrl.tab === G.tab);
      /* giữa ván mà host cũ VẪN gửi trạng thái (chỉ nhịp presence trễ, vd tab bị trình duyệt cho "ngủ") -> không giành,
         giành là cả phòng bị kéo về phòng chờ */
      if (ctrl && want && !G.isHost && G.st && G.st.phase === "play" && now - G.lastState < HOST_LOST_MS) return;
      if (ctrl && want !== G.isHost) return setHost(want);
    }
    if (G.isHost && G.st) {
      if (G.st.phase === "lobby") G.st.roster = {};   /* phòng chờ: danh sách = đúng người đang ở trong phòng (ai thoát là mất) */
      list.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
      push();
    }
    if (G.st && G.st.phase === "lobby" && G.view !== "screen") paintLobbyPlayers();
  }

  function setHost(on) {
    G.isHost = on;
    $("#g-room-badge").hidden = !on;
    track();
    if (!on) {   /* nhường quyền: thành người chơi, xin host thật gửi trạng thái */
      clearInterval(G.hostTimer); G.st = null;
      G.ch.send({ type: "broadcast", event: "hello", payload: {} });
      renderLobby();
      return;
    }
    var pv = G.st || {};   /* trạng thái nhận từ host cũ -> lấy lại CÀI ĐẶT, còn ván đang dở thì bỏ (về phòng chờ) */
    G.st = { phase: "lobby", scoring: pv.scoring || G.room.scoring || "q", scope: pv.scope || G.room.scope || [], title: pv.title || G.room.title || "", mode: pv.mode || G.room.mode, qtype: pv.qtype || G.room.qtype || "meaning", lang: pv.lang || G.room.meaning_lang || "vi", force: !!pv.force, minutes: pv.minutes || +G.room.minutes, qs: pv.qs || G.room.q_seconds, teams: 0, teamOf: {}, scores: {}, roster: {} };
    G.endAt = 0; G.qUntil = 0; clearInterval(G.hostTimer);
    G.online.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
    push(); initHostLobby();
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
    $("#l-host").hidden = !G.isHost; $("#l-wait").hidden = G.isHost; $("#l-hostbtns").hidden = !G.isHost;
    $("#l-roomcard").hidden = !G.isHost;   /* người chơi chỉ chơi: không mã phòng, link mời, 📺, chủ đề */
    $("#l-mecard").hidden = G.isHost; $("#l-wait").hidden = true;
    if (!G.isHost && G.me) { $("#l-meav").innerHTML = avatar(G.me.avatar); $("#l-mename").innerHTML = label({ name: G.me.name, no: G.me.name_no }); }
    if (G.isHost) {
      var st = G.st || {};
      $("#l-mode").value = st.mode || G.room.mode; $("#l-qtype").value = st.qtype || G.room.qtype || "meaning";
      $("#l-min").value = st.minutes || G.room.minutes; $("#l-qs").value = st.qs || G.room.q_seconds;
      $("#l-lang").value = roomLang(st); $("#l-teamn").value = String(st.teams || 0); $("#l-force").checked = !!st.force;
      $("#l-qs-wrap").hidden = $("#l-mode").value !== "kahoot";
      $("#l-force-wrap").hidden = !($("#l-qtype").value === "meaning" || $("#l-qtype").value === "en2m" || $("#l-qtype").value === "mix");
      $("#l-teambtns").hidden = !(+$("#l-teamn").value);
      paintPoolInfo(); paintPicked();
      $("#l-scoring").value = st.scoring || "q";
    }
    paintLobbyPlayers();
  }
  function paintLobbyPlayers() {
    var st = G.st || {}, teams = +st.teams || 0, teamOf = st.teamOf || {};
    var tt = st.title || ""; $("#l-info").textContent = tt ? T("vocab") + ": " + tt : "";
    if (!G.isHost) $("#l-wait2").textContent = G.online.some(isRoomHost) ? T("wait_host") : T("host_away");
    $("#l-count").textContent = players().length;
    $("#l-teamhint").textContent = teams ? T("click_team") : "";
    $("#l-teams").innerHTML = teams ? teamSummary(st, false) : "";
    $("#l-players").innerHTML = G.online.map(function (p) {
      var t = teamOf[p.id];
      return '<button class="g-player' + (teams && G.isHost && p.play !== false ? " g-click" : "") + (G.me && p.id === G.me.id ? " me" : "") + '" data-pid="' + esc(p.id) + '"' + (t && TEAM_C[t] ? ' style="border-color:' + TEAM_C[t].c + '"' : "") + ">" +
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
    var b = this, link = G.room.code === DEFAULT_ROOM ? location.origin + location.pathname : roomLink(G.room.code);   /* phòng TJ: link trần */
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { b.textContent = "✓ Đã copy"; }, function () { prompt("Link:", link); });
    setTimeout(function () { b.textContent = "🔗 Copy link mời"; }, 2000);
  });
  $("#l-screen").addEventListener("click", function () { window.open(roomLink(G.room.code, true), "_blank"); });
  ["#l-mode", "#l-qtype", "#l-min", "#l-qs", "#l-lang", "#l-teamn", "#l-hostplay", "#l-force", "#l-scoring"].forEach(function (s) {
    $(s).addEventListener("change", function () {
      if (!G.isHost || !G.st) return;   /* chưa kết nối xong (G.st chưa có) -> bỏ qua, initHostLobby sẽ vẽ lại */
      var st = G.st;
      st.mode = $("#l-mode").value; st.qtype = $("#l-qtype").value; st.scoring = $("#l-scoring").value; st.lang = $("#l-lang").value; st.force = $("#l-force").checked;
      st.minutes = Math.max(1, +$("#l-min").value || 5); st.qs = Math.max(5, +$("#l-qs").value || 15);
      var tn = +$("#l-teamn").value;
      if (tn !== st.teams) { st.teams = tn; st.teamOf = {}; if (tn) autoTeams(); }
      $("#l-qs-wrap").hidden = st.mode !== "kahoot";
      $("#l-teambtns").hidden = !tn;
      $("#l-force-wrap").hidden = !(st.qtype === "meaning" || st.qtype === "en2m" || st.qtype === "mix");
      if (s === "#l-hostplay") track();
      sb.from("game_rooms").update({ scoring: st.scoring, mode: st.mode, qtype: st.qtype, meaning_lang: st.lang, minutes: st.minutes, q_seconds: st.qs, team_mode: !!tn, teams: tn }).eq("id", G.room.id).then(function () {});
      push(); paintLobbyPlayers();
    });
  });

  /* ---------- HOST: điều khiển trận ---------- */
  function onlineIds() { return G.online.map(function (p) { return p.id; }); }
  /* chỉ hiện người đang ở trong phòng (TJ: "ai thoát rồi thì không hiện tên nữa") — s.on do host gửi */
  function live(s, list) { var on = s.on; return on ? list.filter(function (x) { return on.indexOf(x.pid) >= 0; }) : list; }
  function pub() {   /* bản công khai: giấu đáp án tới lúc lộ; thời gian gửi dạng "còn lại bao nhiêu ms" (khỏi lệch đồng hồ) */
    var s = Object.assign({}, G.st, { hid: G.me && G.me.id, htab: G.tab, hsince: G.since, on: onlineIds(), left: G.endAt ? G.endAt - Date.now() : null, qLeft: G.qUntil ? G.qUntil - Date.now() : null });
    if (s.q) {
      var q = s.q, rev = !!q.revealed;
      s.q = { qn: q.qn, n: q.n, wids: q.wids, word: q.word, optTexts: q.optTexts, type: q.type, texts: q.texts, sent: q.sent, opts: q.opts, len: q.len, wid: q.wid, term: q.term, text: q.text, bank: q.bank, say: q.say, limit: q.limit, grading: !!q.grading,
              res: rev ? q.res : null, revealed: rev, ans: rev ? q.ans : null, cnt: Object.keys(q.got).length,
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
    var mr = await sb.from("game_matches").insert({ room_id: G.room.id, title: G.st.title, scope: G.st.scope, mode: G.st.mode, qtype: G.st.qtype, scoring: G.st.scoring || "q", meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs, teams: G.st.teams || 0 }).select("id").single();
    G.st.matchId = mr.data ? mr.data.id : null;
    if (G.st.mode === "kahoot") hostNextQ(); else { G.qUntil = 0; push(); }
    clearInterval(G.hostTimer);
    G.hostTimer = setInterval(hostTick, 250);
  });
  $("#p-stop").addEventListener("click", function () { if (G.isHost && confirm("Kết thúc trận ngay?")) hostEnd(); });
  function roomLangs() {
    var set = {}; players().forEach(function (p) { set[effLang(p.lang, G.st, "recall")] = 1; if (G.st.force) set[roomLang(G.st)] = 1; });
    return Object.keys(set);
  }
  function hostNextQ() {
    if (!G.st || G.st.phase !== "play") return;
    var q = makeQ(G.st.qtype, G.st.lang, roomLangs());
    G.st.q = Object.assign(q, { qn: (G.st.q ? G.st.q.qn : 0) + 1, revealed: false, got: {}, fast: null, res: {} });
    G.st.q.limit = qLimit(G.st.q, G.st.qs);
    G.qUntil = Date.now() + G.st.q.limit * 1000;
    push();
  }
  function hostTick() {
    if (!G.st || G.st.phase !== "play") { clearInterval(G.hostTimer); return; }   /* đã Kết thúc -> dừng hẳn, chờ TJ bấm Ván mới */
    var now = Date.now();
    if (now - G.lastPush > HEARTBEAT_MS) push();   /* nhịp "host còn sống" — người chơi quá HOST_LOST_MS không nghe thì báo mất kết nối */
    if (now >= G.endAt) {
      if (G.st.mode === "kahoot" && G.st.q && !G.st.q.revealed) return hostReveal();   /* chấm nốt câu đang dở */
      if (G.st.mode !== "kahoot" || !G.revealUntil || now >= G.revealUntil) return hostEnd();
      return;
    }
    if (G.st.mode !== "kahoot" || !G.st.q) return;
    if (!G.st.q.revealed) {
      if (G.st.q.grading) return;
      var n = players().filter(function (p) { return G.st.scores[p.id]; }).length, got = Object.keys(G.st.q.got).length;
      if (now >= G.qUntil || (n && got >= n)) hostReveal();
    } else if (now >= G.revealUntil) hostNextQ();
  }
  async function hostReveal() {
    var q = G.st.q; if (!q || G.st.phase !== "play") return;
    if (q.type === "write" && !q.graded) {
      if (q.grading) return;
      q.grading = true; G.qUntil = 0; push();
      var items = Object.keys(q.got).map(function (pid) { return { pid: pid, text: String(q.got[pid].c || "") }; }).filter(function (x) { return x.text.trim(); });
      var gr = items.length ? await gradeWrites(q.term, items) : {};
      Object.keys(q.got).forEach(function (pid) {
        var r = gr[pid] || { g: 0, u: 0, fix: "", note: "", errs: [] }, tot = r.g + r.u;
        q.got[pid].ok = tot >= 60;
        r.p = award(pid, tot, tot >= 60, tot >= 60 ? 1 : 0, tot >= 60 ? 0 : 1, q.got[pid].ms, q.limit * 1000);
        r.text = q.got[pid].c;
        q.res[pid] = r;
        G.answers.push({ pid: pid, wid: q.wid, term: q.term, ok: tot >= 60, ms: q.got[pid].ms });
      });
      q.graded = true; q.grading = false;
      if (G.st.phase !== "play") return;   /* bấm Kết thúc lúc đang chấm -> không lộ/ra câu nữa */
    }
    q.revealed = true; G.revealUntil = Date.now() + (q.type === "write" || q.type === "sheet" ? REVEAL_MS * 3 : q.type === "dict" ? REVEAL_MS * 2 : REVEAL_MS); G.qUntil = 0;
    var best = null; Object.keys(q.got).forEach(function (pid) { var g = q.got[pid]; if (g.ok && (!best || g.ms < q.got[best].ms)) best = pid; });
    q.fast = best;   /* chỉ để khoe, không cộng điểm */
    Object.keys(G.st.scores).forEach(function (pid) { if (!q.got[pid]) G.st.scores[pid].st = 0; });   /* bỏ câu = mất chuỗi */
    push();
  }
  /* ⏱ cách tính điểm của ván: "q" theo câu (đúng = đủ điểm) | "speed" theo tốc độ (đúng 100% -> 50% điểm, chậm bị trừ) */
  function speedFactor(ms, limitMs) { return G.st && G.st.scoring === "speed" ? 1 - 0.5 * Math.min(1, Math.max(0, (ms || 0) / limitMs)) : 1; }
  /* cộng điểm: base = điểm gốc (câu thường 100, phiếu 100/chỗ đúng, dictation theo % từ, đặt câu 0-100); ok = tính là đúng cho chuỗi */
  function award(pid, base, ok, nOk, nBad, ms, limitMs) {
    var s = G.st.scores[pid] || (G.st.scores[pid] = { s: 0, c: 0, w: 0, st: 0, best: 0 });
    var p = Math.round(base * speedFactor(ms, limitMs));
    s.s += p; s.c += nOk; s.w += nBad; s.g = p;
    if (ok) { s.st++; s.best = Math.max(s.best, s.st); } else s.st = 0;
    return p;
  }
  function score(pid, ok, ms, limitMs) { return award(pid, ok ? POINTS : 0, ok, ok ? 1 : 0, ok ? 0 : 1, ms, limitMs); }
  /* dictation: tỉ lệ từ đúng theo thứ tự (LCS trên từ đã chuẩn hoá) */
  function wordAcc(typed, ans) {
    var a = normAns(typed).split(" ").filter(Boolean), b = normAns(ans).split(" ").filter(Boolean);
    if (!b.length) return { k: 0, n: 0, r: 0 };
    var dp = []; for (var i = 0; i <= a.length; i++) { dp[i] = []; for (var j = 0; j <= b.length; j++) dp[i][j] = i && j ? (a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])) : 0; }
    var k = dp[a.length][b.length];
    return { k: k, n: b.length, r: k / Math.max(b.length, a.length) };
  }
  /* ✍️ chấm câu: LanguageTool (ngữ pháp/chính tả, 0-50) + Gemini qua gemini-proxy của WordLoop (dùng từ đúng/tự nhiên, 0-50, câu sửa).
     Cả 2 miễn phí; Gemini gọi 1 lần cho cả phòng (user_id null -> không ăn quota "3 Block AI/ngày"). */
  async function ltErrors(text) {
    try {
      var ctl = new AbortController(); setTimeout(function () { ctl.abort(); }, 8000);
      var r = await fetch("https://api.languagetool.org/v2/check", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "language=en-US&text=" + encodeURIComponent(text) });
      var d = await r.json();
      return (d.matches || []).map(function (m) { return m.message; });
    } catch (e) { return null; }
  }
  async function gradeWrites(term, items) {   /* items: [{pid, text}] -> {pid: {g, u, fix, note, errs}} */
    var out = {};
    var lts = await Promise.all(items.map(function (it) { return ltErrors(it.text); }));
    var ai = [];
    try {
      var ctl = new AbortController(); setTimeout(function () { ctl.abort(); }, 25000);
      var res = await fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/gemini-proxy", {
        method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY, "apikey": cfg.SUPABASE_ANON_KEY },
        body: JSON.stringify({ model: cfg.GEMINI_MODEL || "gemini-3.5-flash-lite", user_id: null, block_id: null,
          sys: "You are a kind but strict English teacher grading learners' sentences in a vocabulary game. Reply JSON only.",
          user: "Target word/phrase: " + JSON.stringify(term) + ". For each sentence judge ONLY how correctly and naturally the target word is used (0-50; 0 if the target word is missing or used with the wrong meaning). Also give a corrected natural version of the whole sentence and a short note (max 12 words, simple English). Sentences: " +
            JSON.stringify(items.map(function (it, i) { return { i: i, s: it.text }; })) + '. Return JSON array: [{"i":0,"use":0,"fix":"...","note":"..."}]' }) });
      var d = await res.json();
      var raw = d.candidates && d.candidates[0] && d.candidates[0].content.parts[0].text;
      ai = JSON.parse(raw || "[]");
    } catch (e) { ai = []; }
    items.forEach(function (it, i) {
      var errs = lts[i], a = (Array.isArray(ai) ? ai : []).find(function (x) { return x && x.i === i; }) || {};
      var has = normAns(it.text).indexOf(normAns(String(term).replace(/\([^)]*\)/g, " ")).split(" ")[0]) >= 0;
      var g = errs == null ? 35 : Math.max(0, 50 - 12 * errs.length);
      var u = a.use != null ? Math.max(0, Math.min(50, Math.round(+a.use || 0))) : (has ? 30 : 0);
      if (!has && a.use == null) u = 0;
      out[it.pid] = { g: g, u: u, fix: a.fix || "", note: a.note || "", errs: errs || [] };
    });
    return out;
  }
  function hostOnAnswer(a) {
    if (!G.st || G.st.phase !== "play") return;
    if (!G.st.scores[a.pid]) return;   /* vào muộn giữa ván -> chỉ xem, ván sau mới tính */
    if (G.st.mode === "kahoot") {
      var q = G.st.q;
      if (!q || q.revealed || a.qn !== q.qn || q.got[a.pid]) return;   /* mỗi người 1 lần / câu */
      var lim = q.limit * 1000;
      if (q.type === "sheet") {
        var ch = Array.isArray(a.choice) ? a.choice : [], k = 0;
        q.ans.forEach(function (t, i) { var okk = norm(ch[i]) === norm(t); if (okk) k++; G.answers.push({ pid: a.pid, wid: q.wids[i], term: t, ok: okk, ms: a.ms }); });
        q.got[a.pid] = { ok: k === q.n, c: ch, ms: a.ms };
        q.res[a.pid] = { k: k, n: q.n, p: award(a.pid, POINTS * k, k >= Math.ceil(q.n * 0.8), k, q.n - k, a.ms, lim) };
      } else if (q.type === "dict") {
        var acc = wordAcc(a.choice, q.ans);
        q.got[a.pid] = { ok: acc.r >= 0.8, c: a.choice, ms: a.ms };
        q.res[a.pid] = { k: acc.k, n: acc.n, text: a.choice, p: award(a.pid, Math.round(POINTS * acc.r), acc.r >= 0.8, acc.r >= 0.8 ? 1 : 0, acc.r >= 0.8 ? 0 : 1, a.ms, lim) };
        G.answers.push({ pid: a.pid, wid: q.wid, term: q.term, ok: acc.r >= 0.8, ms: a.ms });
      } else if (q.type === "write") {
        q.got[a.pid] = { ok: null, c: a.choice, ms: a.ms };   /* chấm lúc hết giờ (gom cả phòng 1 lần) */
      } else {
        var ok = q.type === "recall" ? typedOk(a.choice, q.ans) : norm(a.choice) === norm(q.ans);
        q.got[a.pid] = { ok: ok, c: a.choice, ms: a.ms };
        score(a.pid, ok, a.ms, lim);
        G.answers.push({ pid: a.pid, wid: q.wid, term: q.ans, ok: ok, ms: a.ms });
      }
    } else {
      var fl = FREE_MS[a.t] || FREE_MS.q;
      if (a.t === "sheet") {
        (a.items || []).forEach(function (it) { G.answers.push({ pid: a.pid, wid: it.wid, term: it.term, ok: it.ok, ms: a.ms }); });
        award(a.pid, POINTS * a.k, a.k >= Math.ceil(a.n * 0.8), a.k, a.n - a.k, a.ms, fl);
      } else if (a.t === "dict") {
        award(a.pid, Math.round(POINTS * a.r), a.r >= 0.8, a.r >= 0.8 ? 1 : 0, a.r >= 0.8 ? 0 : 1, a.ms, fl);
        G.answers.push({ pid: a.pid, wid: a.wid, term: a.term, ok: a.r >= 0.8, ms: a.ms });
      } else if (a.t === "write") {
        gradeWrites(a.term, [{ pid: a.pid, text: a.text }]).then(function (gr) {
          var r = gr[a.pid], tot = r.g + r.u;
          award(a.pid, tot, tot >= 60, tot >= 60 ? 1 : 0, tot >= 60 ? 0 : 1, a.ms, fl);
          G.answers.push({ pid: a.pid, wid: a.wid, term: a.term, ok: tot >= 60, ms: a.ms });
          G.ch.send({ type: "broadcast", event: "graded", payload: { pid: a.pid, r: r, p: G.st.scores[a.pid].g } });
          push();
        });
        return;
      } else {
        score(a.pid, !!a.ok, a.ms, fl);
        G.answers.push({ pid: a.pid, wid: a.wid, term: a.term, ok: !!a.ok, ms: a.ms });
      }
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
  /* xếp hạng: ván "theo câu" -> nhiều câu ĐÚNG nhất (hoà thì ít sai hơn); ván "theo tốc độ" -> điểm tốc độ */
  function rankList(scores, speed) {
    if (speed === undefined) speed = !!(G.st && G.st.scoring === "speed");
    var cmp = speed ? function (a, b) { return b.s - a.s || b.c - a.c || a.w - b.w; } : function (a, b) { return b.c - a.c || a.w - b.w || b.s - a.s; };
    var list = Object.keys(scores || {}).map(function (pid) { return Object.assign({ pid: pid }, scores[pid]); }).sort(cmp);
    list.forEach(function (x, i) { var y = list[i - 1]; x.rank = y && cmp(x, y) === 0 ? y.rank : i + 1; });
    return list;
  }
  /* TJ: không hiện điểm số to — chỉ ✓ đúng / ✗ sai; ván "theo tốc độ" mới kèm điểm nhỏ có ghi rõ cách tính */
  function tally(x, s) {
    return '<span class="g-tally"><b class="g-ok">✓' + (x.c || 0) + '</b> <span class="g-bad">✗' + (x.w || 0) + "</span>" +
      (s && s.scoring === "speed" ? ' <span class="g-pts">' + (x.s || 0) + " " + T("pts_speed") + "</span>" : "") + "</span>";
  }
  function gainTail(p) { return G.st && G.st.scoring === "speed" && p != null ? "  (+" + p + " " + T("pts_speed") + ")" : ""; }
  /* điểm đội = TỔNG; đội lệch số người thì hiện thêm điểm TRUNG BÌNH để so công bằng */
  function teamTotals(st) {
    var out = [];
    for (var t = 1; t <= (+st.teams || 0); t++) out.push({ t: t, s: 0, c: 0, w: 0, n: 0 });
    Object.keys(st.teamOf || {}).forEach(function (pid) {
      var row = out[st.teamOf[pid] - 1]; if (!row) return;
      var x = st.scores && st.scores[pid] || {};
      row.n++; row.s += x.s || 0; row.c += x.c || 0; row.w += x.w || 0;
    });
    var sp = st.scoring === "speed";
    return out.sort(function (a, b) { return sp ? b.s - a.s : b.c - a.c || a.w - b.w; });
  }
  function teamSummary(st, withScore) {
    var tt = teamTotals(st), uneven = tt.some(function (x) { return x.n !== tt[0].n; });
    return tt.map(function (x, i) {
      var C = TEAM_C[x.t];
      var lead = st.scoring === "speed" ? x.s : x.c;
      return '<div class="g-team" style="--tc:' + C.c + '"><span>' + (withScore && i === 0 && lead > 0 ? "👑 " : "") + C.e + " " + esc(teamName(x.t)) + '</span><span class="g-sub">' + x.n + " " + T("ppl") + "</span>" +
        (withScore ? tally(x, st) + (uneven && x.n ? '<span class="g-sub">' + T("avg") + " ✓" + (Math.round(x.c / x.n * 10) / 10) + "</span>" : "") : "") + "</div>";
    }).join("");
  }

  /* ---------- MỌI NGƯỜI: nhận trạng thái ---------- */
  function onState(s) {
    G.lastState = Date.now();
    if (!G.langSet && !isTJ() && s.lang && G.myLang !== s.lang) { G.myLang = s.lang; $("#g-mylang").value = s.lang; applyUI(); }
    var was = G.st && G.st.phase, langWas = G.st && G.st.lang;
    if (!G.isHost) G.st = s;
    if (s.left != null) G.endAt = Date.now() + s.left;
    if (G.myLang === "room" && langWas !== s.lang) applyUI();   /* "theo phòng" -> host đổi tiếng thì giao diện đổi theo */
    if (G.view === "screen") return paintScreen(s);
    if (s.phase === "play" && !G.isHost && G.me && !(s.scores || {})[G.me.id]) {   /* vào muộn: xem trước, ván sau chơi */
      if (!G.spectating) { G.spectating = true; G.lastN = -1; G.scRev = -1; }
      return paintScreen(s);
    }
    if (G.spectating) { G.spectating = false; G.lastN = -1; clearInterval(G.tick); }
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
    G.lastN = -1; G.revealedN = -1; G.scRev = -1; G.myChoice = null;   /* ván mới đánh số câu lại từ 1 */
    show("s-play");
    $("#p-mode").textContent = modeLine(s);
    $("#p-stop").hidden = !G.isHost;
    clearInterval(G.tick);
    G.tick = setInterval(function () {
      $("#p-left").textContent = fmt(G.endAt - Date.now());
      var bar = $("#p-qbar");
      if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / ((G.qLimit || G.st.qs || 15) * 1000) * 100)) + "%";
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
    var roster = s.roster || {}, list = live(s, rankList(s.scores)), teams = +s.teams;
    $("#p-teams").innerHTML = teams ? teamSummary(s, true) : "";
    $("#p-board").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + x.rank + "</span>" + avatar(p.avatar) +
        '<span class="g-pname">' + label(p) + "</span>" + (teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-streak">' + (x.st >= 2 ? "🔥" + x.st : "") + "</span>" + tally(x, s) + "</li>";
    }).join("");
  }

  /* vẽ 1 câu hỏi (dùng chung Kahoot / Tự do): gợi ý dạng câu + nội dung + 4 lựa chọn HOẶC ô gõ */
  var QHINT = { en2m: "q_en2m", gap: "q_gap", recall: "q_recall", meaning: "q_meaning", sheet: "q_sheet", write: "q_write", dict: "q_dict" };
  function sheetHTML(q, sel) {   /* bài đọc có ô chọn từ (người chơi) hoặc "_____" (📺) */
    return '<div class="g-sheet">' + esc(q.text).split(/\n\s*\n/).map(function (para) {
      return "<p>" + para.replace(/\{\{G(\d+)\}\}/g, function (_, i) {
        return sel ? '<select class="g-sel" data-gi="' + i + '"><option value="">—</option>' + q.bank.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + "</option>"; }).join("") + "</select>"
                   : '<span class="g-blank" data-gi="' + i + '">_____</span>';
      }) + "</p>";
    }).join("") + "</div>";
  }
  function paintQuestion(q, hintEl, textEl, optsEl) {
    $(hintEl).textContent = T(QHINT[q.type] || "q_meaning");
    var mine = optsEl === "#p-opts";
    if (mine) { $("#p-saywrap").hidden = q.type !== "dict"; $("#p-res").innerHTML = ""; }
    if (q.type === "sheet") {
      $(textEl).innerHTML = sheetHTML(q, mine);
      $(optsEl).innerHTML = mine ? '<button class="g-btn" id="p-sheetgo" type="button">' + T("submit_sheet") + "</button>" : "";
      if (mine) $("#p-type").hidden = true;
      return;
    }
    if (q.type === "dict" || q.type === "write") {
      $(textEl).textContent = q.type === "dict" ? "🎧" : "✍️ " + q.term + "  —  " + myFlag(q) + " " + myText(q);
      $(optsEl).innerHTML = "";
      if (mine) { $("#p-type").hidden = false; var ti = $("#p-typein"); ti.value = ""; ti.disabled = false; $("#p-typego").disabled = false; ti.placeholder = T(q.type === "dict" ? "dict_ph" : "write_ph"); if (iPlay()) ti.focus(); }
      return;
    }
    if (mine) $("#p-typein").placeholder = T("type_ph");
    if (q.type === "en2m") {   /* từ tiếng Anh to ở trên, 4 nghĩa theo tiếng của người xem (data-opt vẫn là từ để chấm) */
      var ml = effLang(mine ? G.myLang : "room", G.st, "en2m");
      $(textEl).textContent = "🇺🇸 " + q.word;
      if (mine) $("#p-type").hidden = true;
      $(optsEl).innerHTML = q.opts.map(function (o) {
        var m = (q.optTexts || {})[o] || {}, t = m[ml] || m.en || m.vi || o;
        return '<button class="g-opt" data-opt="' + esc(o) + '"><span class="g-otext">' + esc(t) + '</span><span class="g-pickers"></span></button>';
      }).join("");
      return;
    }
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
    $$(".g-opt, .g-sel, #p-sheetgo").forEach(function (x) { x.disabled = true; });
    $("#p-typein").disabled = true; $("#p-typego").disabled = true;
    if (msg) $("#p-msg").textContent = msg;
  }

  /* kiểu Kahoot: host gửi câu, mọi người trả lời 1 lần, hết giờ mới hiện đáp án + ai chọn gì + ai nhanh nhất */
  function paintKahoot(s) {
    var q = s.q;
    if (q.qn !== G.lastN) {
      G.lastN = q.qn; G.myChoice = null; G.myQStart = Date.now();
      G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0; G.qLimit = q.limit || s.qs;
      paintQuestion(q, "#p-hint", "#p-vi", "#p-opts");
      if (!iPlay()) lockAll();
      $("#p-msg").textContent = iPlay() ? "" : T("mc");
    }
    if (!q.revealed) {
      if (q.grading) { lockAll(T("grading")); return; }
      if (G.myChoice != null || !iPlay()) $("#p-msg").textContent = (iPlay() ? T("picked") + " · " : "") + T("answered", { n: q.cnt || 0 });
      return;
    }
    G.qUntilLocal = 0;
    lockAll();
    paintPickers(q, s.roster || {}, ".g-opt");
    if (G.revealedN === q.qn) return;
    G.revealedN = q.qn;
    if (q.type === "sheet" || q.type === "dict" || q.type === "write") return revealRich(q, s.roster || {}, "#p-msg", "#p-res", "#p-vi");
    var ok = G.myChoice != null && (q.type === "recall" ? typedOk(G.myChoice, q.ans) : norm(G.myChoice) === norm(q.ans));
    var mine = (s.scores || {})[G.me.id] || {};
    var msg = !iPlay() ? T("answer", { a: q.ans }) : G.myChoice == null ? T("timeout", { a: q.ans }) : ok ? T("right") + gainTail(mine.g) : T("wrong", { a: q.ans });
    if (q.type === "recall") msg += "  ·  " + T("n_right", { n: (q.oks || []).length }) + " " + (q.oks || []).map(function (pid) { var p = (s.roster || {})[pid]; return p ? p.avatar && !/^https?:/.test(p.avatar) ? p.avatar : "👤" : ""; }).join("");
    var fast = q.fast ? (s.roster || {})[q.fast] : null;
    if (fast) msg += "  ·  " + T("fastest", { n: plain(fast) });
    $("#p-msg").textContent = msg;
    if (q.type === "recall") $("#p-typein").value = G.myChoice || "";
    if (G.myChoice != null) recordMyProgress(q.wid, ok);
  }
  /* lộ đáp án dạng phiếu / dictation / đặt câu: điểm của mình + danh sách cả phòng (để cả nhóm bàn qua voice) */
  function revealRich(q, roster, msgEl, resEl, textEl) {
    var me = G.me && q.res ? q.res[G.me.id] : null;
    if (q.type === "sheet") {
      $$(textEl + " [data-gi]").forEach(function (el) {
        var i = +el.dataset.gi, right = q.ans[i];
        if (el.tagName === "SELECT") {
          var okk = norm(el.value) === norm(right);
          el.classList.add(okk ? "ok" : "bad");
          if (!okk) el.insertAdjacentHTML("afterend", '<span class="g-fixw">' + esc(right) + "</span>");
        } else { el.textContent = right; el.classList.add("sc-ans"); }
      });
      if (msgEl) $(msgEl).textContent = me ? T("r_sheet", { k: me.k, n: me.n }) + gainTail(me.p) : T("timeout", { a: "" });
    } else if (q.type === "dict") {
      $(textEl).innerHTML = "🎧 <b>" + esc(q.ans) + "</b>";
      if (msgEl) $(msgEl).textContent = me ? T("r_dict", { k: me.k, n: me.n }) + gainTail(me.p) : T("timeout", { a: q.ans });
    } else if (msgEl) $(msgEl).textContent = me ? T("r_write", { p: (me.g || 0) + (me.u || 0), g: me.g, u: me.u }) + gainTail(me.p) : T("timeout", { a: q.term });
    var rows = Object.keys(q.res || {}).map(function (pid) { return { pid: pid, r: q.res[pid] }; }).sort(function (a, b) { return (b.r.p || 0) - (a.r.p || 0); });
    $(resEl).innerHTML = rows.map(function (x) {
      var p = roster[x.pid] || {}, r = x.r;
      var badge = q.type === "write" ? (r.g || 0) + (r.u || 0) + "/100" : "✓" + (r.k || 0) + "/" + (r.n || 0);
      var head = '<div class="g-rhead">' + avatar(p.avatar, "g-av-sm") + label(p) + "<b>" + badge + "</b></div>";
      if (q.type === "sheet") return '<div class="g-resrow">' + head + "</div>";
      if (q.type === "dict") return '<div class="g-resrow">' + head + '<div class="g-rtext">' + esc(r.text || "") + "</div></div>";
      return '<div class="g-resrow">' + head + '<div class="g-rtext">' + esc(r.text || "") + "</div>" +
        (r.fix && normAns(r.fix) !== normAns(r.text) ? '<div class="g-rfix">' + T("fix") + " " + esc(r.fix) + "</div>" : "") +
        '<div class="g-rnote">' + T("r_write", { p: (r.g || 0) + (r.u || 0), g: r.g, u: r.u }) + (r.note ? " · " + esc(r.note) : "") + "</div></div>";
    }).join("");
    if (G.me && q.res && q.res[G.me.id]) {
      if (q.type === "sheet") q.wids.forEach(function (wid, i) { var el = $(textEl + ' select[data-gi="' + i + '"]'); recordMyProgress(wid, el && norm(el.value) === norm(q.ans[i])); });
      else recordMyProgress(q.wid, (q.res[G.me.id].p || 0) >= 60 || (q.type === "dict" && q.res[G.me.id].k / q.res[G.me.id].n >= 0.8));
    }
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
    G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, qn: s.q.qn, choice: choice, ms: Date.now() - G.myQStart } });
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
  $("#p-opts").addEventListener("click", function (e) {
    if (!e.target.closest("#p-sheetgo")) return;
    var s = G.st; if (!s || s.phase !== "play" || !iPlay()) return;
    var picks = $$("#p-vi .g-sel").sort(function (a, b) { return a.dataset.gi - b.dataset.gi; }).map(function (x) { return x.value; });
    if (s.mode === "kahoot") { if (G.myChoice == null && s.q && !s.q.revealed) { sendAnswer(picks); $("#p-msg").textContent = T("sent_ok"); } }
    else freeSheet(picks);
  });
  /* 🎧 dictation: đọc câu bằng giọng tiếng Anh CỦA MÁY NGƯỜI CHƠI (nghe lại được) — game vẫn im lặng trừ khi tự bấm */
  function sayIt(text) {
    try {
      var syn = window.speechSynthesis; if (!syn) return;
      syn.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.9;
      var v = syn.getVoices().filter(function (x) { return /^en[-_]US/i.test(x.lang); });
      if (v.length) u.voice = v.find(function (x) { return /natural|online|google/i.test(x.name); }) || v[0];
      syn.speak(u);
    } catch (e) {}
  }
  $("#p-say").addEventListener("click", function () {
    var q = G.st && G.st.mode === "kahoot" ? G.st.q : G.myQ;
    if (q && q.say) sayIt(q.say);
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
    if (!G.st || G.st.phase !== "play") return;
    if (Date.now() >= G.endAt) return lockAll(T("time_up"));
    if (!G.pool.length) { $("#p-vi").textContent = T("loading"); return; }
    var ml = effLang(G.myLang, G.st, "recall");
    G.myQ = makeQ(G.st.qtype || "meaning", poolFor(ml).length >= 4 ? ml : roomLang(G.st));
    $("#p-res").innerHTML = "";
    G.myQStart = Date.now();
    paintQuestion(G.myQ, "#p-hint", "#p-vi", "#p-opts");
    $("#p-msg").textContent = "";
  }
  function freeSheet(picks) {
    var q = G.myQ; if (!q || q.type !== "sheet") return;
    var k = 0, items = q.ans.map(function (t, i) { var okk = norm(picks[i]) === norm(t); if (okk) k++; return { wid: q.wids[i], term: t, ok: okk }; });
    var ms = Date.now() - G.myQStart;
    q.res = {}; q.res[G.me.id] = { k: k, n: q.n, p: Math.round(POINTS * k * speedFactor(ms, FREE_MS.sheet)) };
    lockAll(); revealRich(q, {}, "#p-msg", "#p-res", "#p-vi");
    G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, t: "sheet", k: k, n: q.n, items: items, ms: ms } });
    setTimeout(freeNext, 5000);
  }
  function freeAnswer(choice, btn) {
    var q = G.myQ; if (!q) return;
    var ms0 = Date.now() - G.myQStart;
    if (q.type === "dict") {
      var acc = wordAcc(choice, q.ans);
      q.res = {}; q.res[G.me.id] = { k: acc.k, n: acc.n, text: choice, p: Math.round(POINTS * acc.r * speedFactor(ms0, FREE_MS.dict)) };
      lockAll(); revealRich(q, {}, "#p-msg", "#p-res", "#p-vi");
      G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, t: "dict", r: acc.r, wid: q.wid, term: q.term, ms: ms0 } });
      setTimeout(freeNext, 3500);
      return;
    }
    if (q.type === "write") {
      lockAll(T("grading"));
      G.waitGrade = true;
      G.ch.send({ type: "broadcast", event: "ans", payload: { pid: G.me.id, t: "write", text: choice, wid: q.wid, term: q.term, ms: ms0 } });
      return;   /* host chấm xong gửi "graded" -> hiện kết quả rồi câu mới */
    }
    var ok = q.type === "recall" ? typedOk(choice, q.ans) : norm(choice) === norm(q.ans);
    lockAll();
    $$(".g-opt").forEach(function (x) { if (norm(x.dataset.opt) === norm(q.ans)) x.classList.add("ok"); });
    if (!ok && btn) btn.classList.add("bad");
    $("#p-msg").textContent = ok ? T("right") + gainTail(Math.round(POINTS * speedFactor(Date.now() - G.myQStart, FREE_MS.q))) : T("wrong", { a: q.ans });
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
      if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / ((G.qLimit || G.st.qs || 15) * 1000) * 100)) + "%";
      else bar.style.width = "0%";
    }, 200);
    if (!s) { $("#sc-status").textContent = T("loading2"); return; }
    var roster = s.roster || {};
    if (s.phase === "lobby") {
      $("#sc-status").innerHTML = T("join_at") + " <b>" + esc(roomLink(G.room.code)) + "</b>";
      $("#sc-hint").textContent = "";
      $("#sc-q").textContent = T("room_code") + ": " + G.room.code;
      $("#sc-opts").innerHTML = '<div class="sc-waiting">' + (s.on || Object.keys(roster)).filter(function (pid) { return roster[pid]; }).map(function (pid) { return avatar(roster[pid].avatar); }).join("") + "</div>";
    } else if (s.phase === "play") {
      if (s.mode === "kahoot" && s.q) {
        $("#sc-status").textContent = T("q_no", { n: s.q.qn }) + (s.q.grading ? " · " + T("grading") : s.q.revealed ? "" : " · " + T("answered", { n: s.q.cnt || 0 }));
        if (s.q.qn !== G.lastN) {
          G.lastN = s.q.qn; G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0; G.qLimit = s.q.limit || s.qs;
          $("#sc-res").innerHTML = ""; G.scRev = -1;
          paintQuestion(s.q, "#sc-hint", "#sc-q", "#sc-opts");
          $$("#sc-opts .g-opt").forEach(function (b, i) { b.classList.add("sc-opt"); b.insertAdjacentHTML("afterbegin", '<span class="sc-key">' + "ABCD"[i] + "</span>"); b.disabled = true; });
        }
        if (s.q.revealed) {
          G.qUntilLocal = 0;
          paintPickers(s.q, roster, "#sc-opts .g-opt");
          if ((s.q.type === "sheet" || s.q.type === "dict" || s.q.type === "write") && G.scRev !== s.q.qn) { G.scRev = s.q.qn; revealRich(s.q, roster, null, "#sc-res", "#sc-q"); }
          if (s.q.type === "recall") $("#sc-opts").innerHTML = '<div class="sc-waiting"><b class="sc-ans">' + esc(s.q.ans) + "</b> · " + esc(T("n_right", { n: (s.q.oks || []).length })) + " " + (s.q.oks || []).map(function (pid) { return avatar((roster[pid] || {}).avatar); }).join("") + "</div>";
          var fast = s.q.fast ? roster[s.q.fast] : null;
          if (fast) $("#sc-status").textContent = T("fastest", { n: plain(fast) });
        }
      } else if (s.mode === "free") { $("#sc-status").textContent = T("m_free"); $("#sc-hint").textContent = ""; $("#sc-q").textContent = T("race"); $("#sc-opts").innerHTML = ""; }
    } else if (s.phase === "end") {
      clearInterval(G.tick); $("#sc-left").textContent = "";
      $("#sc-status").textContent = T("ended"); $("#sc-hint").textContent = "";
      var top = rankList(s.scores).slice(0, 3);
      $("#sc-q").innerHTML = top.map(function (x, i) { var p = roster[x.pid] || {}; return '<span class="sc-pod">' + ["🥇", "🥈", "🥉"][i] + avatar(p.avatar) + label(p) + " " + tally(x, s) + "</span>"; }).join("");
      $("#sc-opts").innerHTML = ""; $("#sc-res").innerHTML = "";
    }
    $("#sc-teams").innerHTML = +s.teams ? teamSummary(s, s.phase !== "lobby") : "";
    /* đường đua: ảnh chạy tới theo điểm (người dẫn đầu = đích) */
    var sp = s.scoring === "speed", list = live(s, rankList(s.scores, sp)), val = function (x) { return sp ? x.s || 0 : x.c || 0; }, max = Math.max(1, list.length ? val(list[0]) : 1);
    $("#sc-lanes").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {}, t = (s.teamOf || {})[x.pid];
      return '<div class="sc-lane"' + (t && TEAM_C[t] ? ' style="--tc:' + TEAM_C[t].c + '"' : "") + '><span class="sc-lname">' + x.rank + ". " + label(p) + '</span><div class="sc-track"><div class="sc-runner" style="left:' + Math.round(val(x) / max * 88) + '%">' + avatar(p.avatar) + "</div></div>" + tally(x, s) + "</div>";
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
    $("#e-info").textContent = G.isHost || s.saved ? (s.title || "") + " · " + modeLine(s) + " · " + s.minutes + "'" : "";
    $("#e-again").hidden = !G.isHost || s.saved;
    $("#e-hostnav").hidden = !G.isHost && !s.saved;
    $("#e-wait").hidden = G.isHost || !!s.saved;
    $("#e-teams").innerHTML = +s.teams ? teamSummary(s, true) : "";
    var roster = s.roster || {};
    $("#e-board").innerHTML = rankList(s.scores, s.scoring === "speed").map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (G.me && x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + (x.rank === 1 ? "🥇" : x.rank === 2 ? "🥈" : x.rank === 3 ? "🥉" : x.rank) + "</span>" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (+s.teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-streak">' + (x.best >= 2 ? "🔥" + x.best : "") + "</span>" + tally(x, s) + "</li>";
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
    renderEnd({ phase: "end", saved: true, scoring: M.scoring || "q", title: M.title, mode: M.mode, qs: M.q_seconds, minutes: M.minutes, teams: M.teams || 0, teamOf: teamOf, scores: scores, roster: roster });
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
        var a = agg[x.player_id] || (agg[x.player_id] = { p: x.game_players || {}, games: 0, wins: 0, c: 0, w: 0 });
        a.games++; if (x.rank === 1) a.wins++; a.c += x.correct; a.w += x.wrong;
      });
      var rows = Object.keys(agg).map(function (k) { return Object.assign({ id: k }, agg[k]); }).sort(function (a, b) { return b.c - a.c || a.w - b.w; });
      $("#hi-body").innerHTML = rows.length ? '<table class="g-table"><thead><tr><th>#</th><th>' + T("h_player") + "</th><th>" + T("h_right") + "</th><th>" + T("h_wrong") + "</th><th>" + T("h_games") + "</th><th>🥇</th><th>" + T("h_acc") + "</th></tr></thead><tbody>" +
        rows.map(function (a, i) {
          return '<tr class="' + (G.me && a.id === G.me.id ? "me" : "") + '"><td>' + (i + 1) + "</td><td>" + avatar(a.p.avatar, "g-av-sm") + " " + label({ name: a.p.name, no: a.p.name_no }) + "</td><td><b class=\"g-ok\">" + a.c + '</b></td><td class="g-bad">' + a.w + "</td><td>" + a.games + "</td><td>" + a.wins + "</td><td>" + (a.c + a.w ? Math.round(a.c / (a.c + a.w) * 100) + "%" : "—") + "</td></tr>";
        }).join("") + "</tbody></table>" : '<p class="g-sub">' + T(tab === "week" ? "no_week" : "no_all") + "</p>";
    } catch (e) { $("#hi-body").innerHTML = '<p class="g-err">' + T("err") + ": " + esc(e.message || e) + "</p>"; }
  }
  async function histMine() {
    if (!G.me) { $("#hi-body").innerHTML = '<p class="g-sub">' + T("no_name") + "</p>"; return; }
    var r = await sb.from("game_results").select("match_id,team,score,rank,correct,wrong,best_streak,created_at,game_matches(title,mode,qtype,meaning_lang,minutes,teams,scoring)").eq("player_id", G.me.id).not("match_id", "is", null).order("created_at", { ascending: false }).limit(200);
    if (r.error) throw r.error;
    if (!r.data.length) { $("#hi-body").innerHTML = '<p class="g-sub">' + T("no_games") + "</p>"; return; }
    var cnt = await sb.from("game_results").select("match_id").in("match_id", r.data.map(function (x) { return x.match_id; }));
    var nIn = {}; (cnt.data || []).forEach(function (x) { nIn[x.match_id] = (nIn[x.match_id] || 0) + 1; });
    var best = r.data.reduce(function (m, x) { return Math.max(m, x.correct); }, 0);
    var wins = r.data.filter(function (x) { return x.rank === 1; }).length;
    var streak = r.data.reduce(function (m, x) { return Math.max(m, x.best_streak); }, 0);
    var QT = { meaning: "🔤", en2m: "🔤", gap: "📝", recall: "⌨️", mix: "🔀", sheet: "📄", write: "✍️", dict: "🎧" };
    $("#hi-body").innerHTML =
      '<div class="g-stats"><div><b>' + r.data.length + "</b><span>" + T("s_games") + "</span></div><div><b>" + wins + "</b><span>" + T("s_wins") + "</span></div><div><b>✓" + best + "</b><span>" + T("s_bestc") + "</span></div><div><b>🔥" + streak + "</b><span>" + T("s_streak") + "</span></div></div>" +
      '<table class="g-table"><thead><tr><th>' + T("h_date") + "</th><th>" + T("h_topic") + "</th><th>" + T("h_rw") + "</th><th>" + T("h_rank") + "</th></tr></thead><tbody>" +
      r.data.map(function (x) {
        var rm = x.game_matches || {}, d = new Date(x.created_at);
        return "<tr><td>" + d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</td><td><a href="?match=' + esc(x.match_id) + '">' + esc(rm.title || "—") + "</a>" +
          '<div class="g-sub">' + (QT[rm.qtype] || "") + " " + (FLAG[rm.meaning_lang] || "") + " " + (rm.mode === "kahoot" ? T("m_kahoot") : T("m_free")) + (x.team && TEAM_C[x.team] ? " · " + TEAM_C[x.team].e + " " + esc(teamName(x.team)) : "") + "</div></td><td>" + tally({ c: x.correct, w: x.wrong }) + (x.correct === best && best ? " 🏆" : "") + "</td><td>" +
          (x.rank === 1 ? "🥇" : x.rank) + "/" + (nIn[x.match_id] || "?") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  /* ---------- khởi động ---------- */
  $("#g-mylang").addEventListener("change", function () {
    G.myLang = this.value; G.langSet = true; writeLS(LS_LANG, G.myLang);
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
  window.addEventListener("pagehide", function () { try { if (G.ch) { G.ch.untrack(); sb.removeChannel(G.ch); } } catch (e) {} });
  (async function boot() {
    G.view = param("view");
    G.myLang = readLS(LS_LANG);
    G.langSet = !!(G.myLang && G.myLang !== "room");   /* đã TỰ chọn ngôn ngữ chưa (chưa -> theo tiếng chung của phòng) */
    if (!G.langSet) G.myLang = "vi";
    $("#g-mylang").value = G.myLang;
    $("#g-mylang").hidden = G.view === "screen";
    applyUI();
    G.me = readLS(LS_ME);
    await loadProfile().catch(function () {});
    if (!G.langSet && isTJ()) { G.myLang = "vi"; $("#g-mylang").value = "vi"; applyUI(); }   /* máy TJ mặc định tiếng Việt */
    paintMe();
    route();
  })();
})();
