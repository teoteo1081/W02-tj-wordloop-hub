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
   - 2 kiểu: "kahoot" (cả phòng cùng 1 câu; câu chọn đáp án được ĐỔI khi còn giờ) | "free" (mỗi người tự làm câu riêng, chọn là chốt).
     "⚡ Đua tốc độ" = "free" + st.race: tổng thời gian host đặt cứng (không tự tính theo số từ), sang câu gần như ngay,
     xếp hạng nhiều câu ĐÚNG nhất (hoà -> ít sai hơn). TJ 2026-10-02.
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
   - MẶC ĐỊNH IM LẶNG (chơi kèm voice HelloTalk), đúng/sai báo bằng màu. Host bật "🔊 Đọc to từ tiếng Anh" làm mặc định của
     phòng; mỗi người tự bật/tắt bằng nút 🔊 lúc chơi (nhớ theo máy) — xem soundOn()/speakQ() (TJ 2026-10-02).
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
  var FLAG = /Windows/.test(navigator.userAgent) ? { vi: "VI", en: "EN", es: "ES", zh: "ZH" } : { vi: "🇻🇳", en: "🇺🇸", es: "🇪🇸", zh: "🇨🇳" };   /* Windows không vẽ cờ -> hiện chữ "US"/"VN" */
  var MASTER_T = cfg.MASTER_THRESHOLD || 0.8, MASTER_N = cfg.MASTER_MIN_ATTEMPTS || 3;
  var DEFAULT_ROOM = "TJ";
  /* CHỈ hồ sơ TJ được làm host + ghi tiến trình học từ game (TJ chốt 2026-09-30). KHÔNG dùng is_admin:
     WordLoop có 2 admin (TJ + Anti_TJ) — Anti_TJ vào game chỉ là người chơi thường. */
  var HOST_PROFILE_ID = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf";
  function isTJ() { return !!(G.profile && G.profile.id === HOST_PROFILE_ID); }
  function isTJPlayer() { return !!(G.me && String(G.me.name || "").trim().toLowerCase() === "tj"); }   /* người chơi của chính TJ (Thảo gắn hồ sơ TJ nhưng tên khác) */
  /* TIẾN TRÌNH HỌC ghi cho ai (TJ 2026-10-03: "các TK Thảo, TJ ... kết quả của Thảo ghi về cho TJ trong TJ WordLoop"):
     máy đăng nhập hồ sơ TJ, HOẶC người chơi game được gắn hồ sơ TJ (game_players.profile_id = TJ, vd "Thảo").
     Gắn/bỏ gắn: 👥 Quản lý người chơi hoặc sửa cột profile_id. null = không ghi (người chơi thường). */
  function progUid() { return isTJ() || G.meProfile === HOST_PROFILE_ID ? HOST_PROFILE_ID : null; }
  async function loadMeProfile() {
    if (!G.me || !G.me.id) { G.meProfile = null; return; }
    var r = await sb.from("game_players").select("profile_id").eq("id", G.me.id).maybeSingle();
    G.meProfile = r.data ? r.data.profile_id : null;
  }   /* 1 link duy nhất cho tất cả: game.html (không tham số) = phòng của TJ */
  var FREE_MS = { q: 10000, dict: 30000, write: 60000, sheet: 150000 };   /* "theo tốc độ" ở kiểu Tự do: mốc thời gian mỗi dạng */
  /* 🔄 TỰ CẬP NHẬT (TJ 2026-10-02: 2 máy thấy 2 giao diện khác nhau — máy mở link game.html giữ trang cũ ~10 phút).
     GAME_VER phải KHỚP game-version.json; mỗi lần đổi game.js/css nhớ tăng CẢ HAI (+ ?v= trong game.html).
     Có bản mới -> tự tải lại, nhưng KHÔNG khi đang giữa ván. */
  var GAME_VER = 154;
  /* đang xem kết quả / 📖 xem lại đáp án / 📜 lịch sử -> KHÔNG tự tải lại (TJ 2026-10-02: "đang xem review mà web tự
     chuyển về màn hình chính" — bản mới lên đúng lúc đó, trang tải lại, mất luôn phần xem lại). Về phòng chờ mới cập nhật. */
  function busyReading() { return !!G.inHist || ["#s-end", "#s-review", "#s-hist"].some(function (id) { var el = $(id); return el && !el.hidden; }); }
  function checkVersion() {
    if (G.st && G.st.phase === "play") return;
    if (busyReading()) return;
    fetch("game-version.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (!(j && +j.v > GAME_VER) || (G.st && G.st.phase === "play") || busyReading()) return;
      var u = new URL(location.href); u.searchParams.set("gv", j.v);
      /* máy TJ (host): KHÔNG tự tải lại giữa buổi (TJ 2026-10-04: "tự refresh tự out") — hiện nút để TJ tự bấm lúc tiện */
      if (isTJ() || G.isHost) {
        if (document.getElementById("g-upd")) return;
        var b = document.createElement("button"); b.id = "g-upd"; b.type = "button"; b.className = "g-btn g-upd"; b.textContent = "🔄 Có bản mới — bấm để cập nhật";
        b.onclick = function () { location.replace(u.toString()); }; document.body.appendChild(b); return;
      }
      location.replace(u.toString());
    }).catch(function () {});
  }
  setTimeout(checkVersion, 3000); setInterval(checkVersion, 120000);
  var POINTS = 100, REVEAL_MS = 3500, HOST_LOST_MS = 7000, HEARTBEAT_MS = 3000;
  var NO_END = 1e11;   /* ván "∞ không tính giờ": hạn chót rất xa, host bấm Kết thúc */
  function untimed(s) { return !!(s && s.hostpace); }   /* luôn tính giờ (TJ 2026-10-01) — TRỪ 🎧 đề Listening "Theo audio": host bấm sang câu theo nhịp audio (TJ 2026-10-04) */

  /* ---------- chữ giao diện 4 tiếng (người chơi); phần cài đặt của host để tiếng Việt ---------- */
  var UI = {
    vi: { snd_on: "🔊 Có tiếng", snd_off: "🔇 Đã tắt tiếng", snd_on_t: "Bấm để tắt tiếng trên máy này (chơi kèm HelloTalk)", snd_off_t: "Bấm để bật lại tiếng", vol: "Âm lượng", taphint: "🔈 Chạm vào màn hình 1 lần để bật tiếng đọc", tap_listen: "Chạm để nghe", snd_you: "Âm thanh của bạn:", tstats_btn: "📊 Điểm TOEIC", tmarks_btn: "🔖 Đoạn nghe", t_doneg: "Xong nhóm này", t_skipg: "Qua nhóm sau", t_backg: "Quay lại nhóm đang nghe", t_next: "Xem trước nhóm câu sau", tips_btn: "🧠 Chiến thuật", tips_h: "Chiến thuật đạt điểm TOEIC cao", replay_q: "Chơi lại ván này ngay với những người đang trong phòng?", replay_btn: "🔁 Chơi lại ván này", ex_left: "Còn {t} · đã làm {n}/{m} câu — chọn số câu để chuyển, đổi đáp án thoải mái", ex_submit: "Nộp bài", ex_confirm: "Còn {n} câu chưa làm. Vẫn nộp bài?", ex_done: "Đã nộp bài", ex_total: "Tổng ước lượng", ex_note: "Điểm quy đổi theo bảng tham khảo (ETS mỗi đề 1 bảng riêng). Xem đáp án + lời giải ở 📖 Xem lại.", t_listen: "Nghe", t_pend: "Bạn chọn {a} — chờ đáp án", t_nokey: "Câu này chưa có đáp án — xem phiếu trả lời cả phòng ở màn kết quả, host sẽ nhập đáp án để chấm.", tsh_who: "Người chơi", tsh_h: "Phiếu trả lời · Test {t} · Part {p}", tsh_graded: "Đã có đáp án — xanh đúng, đỏ sai. Hàng Σ: mỗi đáp án bao nhiêu người chọn.", tsh_nokey: "Chưa có đáp án — đây là lựa chọn cuối của mỗi người. Hàng Σ: mỗi đáp án bao nhiêu người chọn.", tsh_key: "Nhập đáp án để chấm", tsh_keytip: "Gõ kiểu \"{a}C {a}A …\" hoặc chỉ dãy chữ (CABD…) tính lần lượt từ câu {a} tới {b}. Lưu luôn vào đề cho các ván sau.", tsh_save: "Lưu & chấm", tsh_bad: "Chưa đọc được đáp án nào — gõ vd: 7C 8A 9B", tsh_fail: "Đã chấm, nhưng {n} câu chưa lưu được vào đề.", tsh_ok: "✓ Đã chấm và lưu {n} đáp án vào đề.", t_ptr: "📖 Dịch cả bài đọc", t_traps: "Bẫy", t_pick: "Đã chọn — còn giờ thì đổi được, hết giờ tự sang câu sau", t_alldone: "🏁 Bạn đã làm hết — chờ hết giờ hoặc host bấm Kết thúc để xem kết quả", rv_listen: "🔊 Nghe lại", tv_h: "Từ vựng cần học", tv_tip: "Chạm từ trong câu để chọn — chạm từ kế bên để nối thành cụm, rồi bấm ⭐ Lưu", tv_save: "Lưu để học", tv_saved: "Đã lưu", tv_nomean: "Chưa tra được nghĩa — vẫn lưu được", tv_err: "Chưa lưu được, thử lại nhé.", t_claude: "Đáp án do Claude tự giải — chờ đối chiếu đáp án chính thức.", t_saved: "Đã ghi nhận — đáp án và lời giải xem ở 📖 Xem lại sau khi làm xong", t_skip: "Bỏ qua câu này", t_right: "Bạn chọn đúng", t_wrong: "Bạn chọn sai", q_toeic: "Chọn đáp án đúng (A, B, C, D)", lang_room: "🌐 Theo phòng", q_order: "Ghép các mảnh thành câu tiếng Anh đúng nghĩa", q_chunk: "Chọn chunk còn thiếu trong câu", q_listen: "Nghe câu rồi chọn nghĩa đúng", q_polite: "Chọn câu đúng mức lịch sự", redo: "Làm lại", reg_casual: "Nói với bạn thân", reg_neutral: "Nói với đồng nghiệp", reg_formal: "Nói với khách hàng / sếp lớn", no_voice: "🔇 Máy này chưa có giọng đọc {l} nên game không đọc to. Cài thêm: Windows › Cài đặt › Thời gian & ngôn ngữ › Giọng nói · Mac/iPhone › Trợ năng › Nội dung được đọc › Giọng nói.", type_ph_zh: "Gõ chữ Hán hoặc pinyin (vd: pangxie)…", learning_now: "đang học", pair_note: "🎯 Học: {t} · Nghĩa: {m}", pair_tt: "Phòng đang học {t}. Nghĩa hiện bằng {m} (tiếng mẹ đẻ của bạn — đổi ở ô Language; không chọn được tiếng đang học).", force_note: "🔒 Nghĩa: {l}", force_tt: "Host đã chọn tiếng nghĩa cho cả phòng: {l}. Ô Language chỉ đổi chữ giao diện.", back_hist: "← Về Lịch sử", rv_all: "📖 Xem lại tất cả các ván", rv_wrong: "❌ Chỉ từ hay sai", rv_word: "từ {n}/{m}", rv_tally: "Tất cả các ván: ✓ đúng {c} lần · ✗ sai {w} lần", rv_none_wrong: "Bạn chưa sai từ nào 🎉", past_ok: "✓ Bạn trả lời đúng từ này", past_bad: "✗ Bạn trả lời sai từ này — nên để dành học lại", no_answers: "Ván này chưa có câu trả lời nào của bạn được lưu.", next_q: "Câu tiếp ▶", reveal_btn: "👁 Hiện đáp án", wait_nextq: "Chờ host sang câu tiếp…", no_time: "∞ không tính giờ", review_btn: "📖 Xem lại đáp án", review_h: "📖 Xem lại đáp án", prev: "◀ Trước", next: "Sau ▶", back_res: "← Về kết quả", you_typed: "Bạn trả lời: {a}", you_none: "Bạn chưa trả lời câu này", right_ans: "Đáp án đúng: {a}", same_name: "Tên \"{n}\" đã có người dùng: {list}.\nNếu là BẠN (chơi ở máy/trình duyệt khác) -> gõ số của bạn (vd 1) để giữ lịch sử.\nNếu là người khác -> để trống và bấm OK.", tab_other: "Game đã được mở ở tab khác — tab này tạm dừng.", tab_busy: "Ván đang chơi ở tab khác — tab này không vào phòng để khỏi làm hỏng ván.", tab_use: "Dùng game ở tab này", q_en2m: "Chọn nghĩa đúng của từ tiếng Anh này", pts_speed: "điểm tốc độ", h_right: "✓ Đúng", h_wrong: "✗ Sai", s_bestc: "nhiều câu đúng nhất / 1 ván", q_sheet: "Chọn từ cho TẤT CẢ chỗ trống rồi bấm Nộp", q_write: "Đặt 1 câu tiếng Anh có dùng từ này", q_dict: "Bấm 🔊 nghe rồi gõ lại CẢ CÂU", listen: "🔊 Nghe", headphones: "🎧 Dùng tai nghe để không lọt tiếng vào voice", submit_sheet: "📄 Nộp bài", grading: "✍️ Đang chấm câu của mọi người…", write_ph: "Viết 1 câu tiếng Anh…", dict_ph: "Gõ lại câu vừa nghe…", r_sheet: "✓ {k}/{n} chỗ đúng", r_dict: "✓ {k}/{n} từ đúng", r_write: "Điểm câu {p}/100 (ngữ pháp {g}/50 · dùng từ {u}/50)", fix: "Sửa:", your_ans: "Bạn gõ:", sent_ok: "Đã nộp — chờ mọi người…", mother_h: "Nghĩa hiển thị bằng (tiếng mẹ đẻ)", mother_tt: "Tiếng mẹ đẻ của bạn (chữ giao diện + nghĩa)", name_h: "Bạn tên gì?", name_sub: "Máy này sẽ nhớ tên cho lần sau — không cần email.", name_ph: "Nhập tên…", avatar_h: "Chọn ảnh đại diện", upload: "📷 Tải ảnh của bạn", save: "Lưu & tiếp tục →", need_name: "Nhập tên trước nhé.", saving: "Đang lưu…", uploading: "Đang tải ảnh…", not_image: "File này không phải ảnh.",
      join_h: "Vào phòng", code_ph: "MÃ PHÒNG", go: "Vào", hist_btn: "📜 Lịch sử & Xếp hạng", no_room: "Không tìm thấy phòng {c}.", room: "Phòng", room_code: "Mã phòng", copy_link: "🔗 Copy link mời", copied: "✓ Đã copy", screen_btn: "📺 Màn hình chung", players: "Người chơi", vocab: "Từ vựng", wait_host: "Chờ host bắt đầu", host_away: "Host chưa vào phòng — xem trước, chờ host tới nhé.", wait_next: "Chờ host mở ván mới…", host_lost: "⚠ Host mất kết nối — chờ host quay lại…", host_lost_free: "⚠ Host mất kết nối — bạn cứ làm tiếp, đáp án sẽ tự gửi khi host quay lại",
      m_kahoot: "Cùng 1 câu", m_free: "Tự do", left_q: "còn {n} câu", per_min: "{n} câu/ph", missed: "bỏ {n}", st_right: "Đúng", st_wrong: "Sai", st_done: "Đã làm", st_left: "Còn lại", st_acc: "Chính xác", st_pace: "Câu/phút", st_avg: "TB/câu", st_q: "Câu", t_acc: "Tỉ lệ đúng trên các câu đã trả lời", t_pace: "Số câu làm được mỗi phút", t_avg: "Thời gian trung bình để chọn đáp án mỗi câu", t_miss: "Số câu hết giờ mà chưa chọn", t_left: "Số câu còn lại của ván", avg_s: "TB {n}s", react_s: "⚡TB {n}s", q_of: "Câu {i} / {n}", done_of: "đã làm {a}/{n}", m_race: "⚡ Đua tốc độ", sec_q: "giây/câu", q_meaning: "Chọn từ tiếng Anh đúng nghĩa", q_gap: "Chọn từ điền vào chỗ trống", q_recall: "Gõ từ tiếng Anh của nghĩa này", type_ph: "Gõ từ tiếng Anh…", submit: "Gửi",
      picked: "Đã trả lời — chờ mọi người…", picked_change: "Đã chọn — còn giờ thì bấm đáp án khác để đổi", answered: "{n} người đã trả lời", right: "✓ Đúng!", wrong: "✗ Sai — đáp án: {a}", timeout: "⏱ Hết giờ — đáp án: {a}", answer: "Đáp án: {a}", fastest: "⚡ Nhanh nhất: {n}", n_right: "{n} người đúng", time_up: "⏱ Hết giờ — chờ tổng kết…", loading: "Đang tải từ vựng…", mc: "Bạn đang làm MC — mở 📺 Màn hình chung để cả nhóm cùng xem.",
      results: "🏁 Kết quả", back: "← Về trang game", nobody: "Chưa ai trả lời câu nào.", ppl: "người", avg: "TB", team_red: "Đội Đỏ", team_blue: "Đội Xanh", team_green: "Đội Lá", team_yellow: "Đội Vàng", click_team: "· host bấm tên để đổi đội",
      tab_me: "Của tôi", tab_week: "Tuần này", tab_all: "Mọi thời gian", h_player: "Người chơi", h_total: "Tổng điểm", h_games: "Trận", h_best: "Cao nhất", h_acc: "Đúng", h_date: "Ngày", h_topic: "Chủ đề", h_score: "Điểm", h_rank: "Hạng", h_rw: "Đúng/Sai",
      s_games: "trận", s_wins: "lần 🥇", s_best: "kỷ lục điểm", s_streak: "chuỗi dài nhất", no_name: "Bạn chưa đặt tên trên máy này.", no_games: "Bạn chưa chơi trận nào.", no_week: "Chưa có trận nào trong 7 ngày qua.", no_all: "Chưa có trận nào.", loading2: "Đang tải…", join_at: "Vào phòng tại", race: "🏁 Đua tự do!", ended: "🏁 Kết thúc!", q_no: "Câu {n}", err: "Lỗi" },
    en: { snd_on: "🔊 Sound on", snd_off: "🔇 Muted", snd_on_t: "Tap to mute this device (e.g. when on a HelloTalk call)", snd_off_t: "Tap to turn the sound back on", vol: "Volume", taphint: "🔈 Tap the screen once to enable audio", tap_listen: "Tap to listen", snd_you: "Your sound:", tstats_btn: "📊 TOEIC scores", tmarks_btn: "🔖 Saved audio", t_doneg: "Done with these", t_skipg: "Go to next questions", t_backg: "Back to current questions", t_next: "Preview the next questions", tips_btn: "🧠 Strategies", tips_h: "TOEIC high-score strategies", replay_q: "Replay this game now with everyone in the room?", replay_btn: "🔁 Replay this game", ex_left: "{t} left · answered {n}/{m} — tap a number to jump, change answers freely", ex_submit: "Submit", ex_confirm: "{n} questions unanswered. Submit anyway?", ex_done: "Submitted", ex_total: "Estimated total", ex_note: "Scaled with a reference table (ETS uses a table per test). See answers and explanations in 📖 Review.", t_listen: "Listen", t_pend: "You chose {a} — waiting for the answer key", t_nokey: "No answer key yet — see the room's answer sheet on the results screen; the host will enter the key.", tsh_who: "Player", tsh_h: "Answer sheet · Test {t} · Part {p}", tsh_graded: "Key entered — green right, red wrong. Row Σ: how many chose each letter.", tsh_nokey: "No key yet — these are everyone's final choices. Row Σ: how many chose each letter.", tsh_key: "Enter the answer key", tsh_keytip: "Type like \"{a}C {a}A …\" or just letters (CABD…) counted from question {a} to {b}. Saved to the test for later games.", tsh_save: "Save & grade", tsh_bad: "No answers recognised — type e.g. 7C 8A 9B", tsh_fail: "Graded, but {n} answers could not be saved to the test.", tsh_ok: "✓ Graded and saved {n} answers to the test.", t_ptr: "📖 Passage translation", t_traps: "Traps", t_pick: "Picked — you can change it until time runs out, then the next question starts", t_alldone: "🏁 You have finished — wait for time to run out or the host to end the game", rv_listen: "🔊 Listen again", tv_h: "Words to learn", tv_tip: "Tap words in the sentence — tap the next word to make a phrase, then press ⭐ Save", tv_save: "Save to learn", tv_saved: "Saved", tv_nomean: "No meaning found — you can still save it", tv_err: "Could not save, please try again.", t_claude: "Answer solved by Claude — not yet checked against the official key.", t_saved: "Saved — see answers and explanations in 📖 Review after the test", t_skip: "Skipped", t_right: "You chose correctly", t_wrong: "You chose wrong", q_toeic: "Choose the correct answer (A, B, C, D)", lang_room: "🌐 Room language", q_order: "Put the pieces in order to build the English sentence", q_chunk: "Choose the missing chunk", q_listen: "Listen, then choose the meaning", q_polite: "Choose the sentence with the right politeness", redo: "Reset", reg_casual: "Talking to a close friend", reg_neutral: "Talking to a colleague", reg_formal: "Talking to a client / senior boss", no_voice: "🔇 This device has no {l} voice, so the game will not read aloud. Add one: Windows › Settings › Time & language › Speech · Mac/iPhone › Accessibility › Spoken Content › Voices.", type_ph_zh: "Type hanzi or pinyin (e.g. pangxie)…", learning_now: "learning", pair_note: "🎯 Learning: {t} · Meanings: {m}", pair_tt: "The room is learning {t}. Meanings are shown in {m} (your native language — change it in Language; the language being learned cannot be chosen).", force_note: "🔒 Meanings: {l}", force_tt: "The host set the meaning language for the whole room: {l}. Language only changes the interface text.", back_hist: "← Back to history", rv_all: "📖 Review all games", rv_wrong: "❌ Only words I missed", rv_word: "word {n}/{m}", rv_tally: "All games: ✓ right {c}× · ✗ wrong {w}×", rv_none_wrong: "You have not missed any word 🎉", past_ok: "✓ You got this word right", past_bad: "✗ You got this word wrong — worth saving to study again", no_answers: "No saved answers of yours in this match.", next_q: "Next ▶", reveal_btn: "👁 Show answer", wait_nextq: "Waiting for the host to go on…", no_time: "∞ untimed", review_btn: "📖 Review answers", review_h: "📖 Review answers", prev: "◀ Previous", next: "Next ▶", back_res: "← Back to results", you_typed: "Your answer: {a}", you_none: "You did not answer this one", right_ans: "Correct answer: {a}", same_name: "The name \"{n}\" is already used: {list}.\nIf that is YOU (on another device/browser) -> type your number (e.g. 1) to keep your history.\nIf it is someone else -> leave empty and press OK.", tab_other: "The game was opened in another tab — this tab is paused.", tab_busy: "A round is being played in another tab — this tab stays out so it won't break the round.", tab_use: "Use the game in this tab", q_en2m: "Choose the correct meaning of this English word", pts_speed: "speed pts", h_right: "✓ Correct", h_wrong: "✗ Wrong", s_bestc: "most correct in one game", q_sheet: "Fill in ALL the blanks, then press Submit", q_write: "Write one English sentence using this word", q_dict: "Press 🔊 to listen, then type the WHOLE sentence", listen: "🔊 Listen", headphones: "🎧 Use headphones so the sound stays out of the voice call", submit_sheet: "📄 Submit", grading: "✍️ Grading everyone's sentences…", write_ph: "Write one English sentence…", dict_ph: "Type the sentence you heard…", r_sheet: "✓ {k}/{n} blanks correct", r_dict: "✓ {k}/{n} words correct", r_write: "Sentence score {p}/100 (grammar {g}/50 · word use {u}/50)", fix: "Fix:", your_ans: "You typed:", sent_ok: "Submitted — waiting for others…", mother_h: "Show meanings in (your native language)", mother_tt: "Your native language (interface + meanings)", name_h: "What's your name?", name_sub: "This device will remember you next time — no email needed.", name_ph: "Enter your name…", avatar_h: "Choose an avatar", upload: "📷 Upload your photo", save: "Save & continue →", need_name: "Please enter a name.", saving: "Saving…", uploading: "Uploading…", not_image: "That file is not an image.",
      join_h: "Join a room", code_ph: "ROOM CODE", go: "Join", hist_btn: "📜 History & Rankings", no_room: "Room {c} not found.", room: "Room", room_code: "Room code", copy_link: "🔗 Copy invite link", copied: "✓ Copied", screen_btn: "📺 Shared screen", players: "Players", vocab: "Vocabulary", wait_host: "Waiting for the host to start", host_away: "The host is not here yet — feel free to look around.", wait_next: "Waiting for the host to start a new round…", host_lost: "⚠ Host disconnected — waiting for the host to return…", host_lost_free: "⚠ Host disconnected — keep playing, your answers will be sent when the host is back",
      m_kahoot: "Same question", m_free: "Free play", left_q: "{n} left", per_min: "{n}/min", missed: "{n} missed", st_right: "Right", st_wrong: "Wrong", st_done: "Done", st_left: "Left", st_acc: "Accuracy", st_pace: "Per min", st_avg: "Avg/Q", st_q: "Question", t_acc: "Accuracy on answered questions", t_pace: "Questions answered per minute", t_avg: "Average time to pick an answer", t_miss: "Questions that timed out unanswered (not counted as wrong)", t_left: "Questions left in this round", avg_s: "avg {n}s", react_s: "⚡avg {n}s", q_of: "Question {i} / {n}", done_of: "done {a}/{n}", m_race: "⚡ Speed race", sec_q: "s/question", q_meaning: "Choose the English word for this meaning", q_gap: "Choose the word that fills the blank", q_recall: "Type the English word for this meaning", type_ph: "Type the English word…", submit: "Submit",
      picked: "Answered — waiting for others…", picked_change: "Picked — tap another answer to change while time is left", answered: "{n} answered", right: "✓ Correct!", wrong: "✗ Wrong — answer: {a}", timeout: "⏱ Time's up — answer: {a}", answer: "Answer: {a}", fastest: "⚡ Fastest: {n}", n_right: "{n} correct", time_up: "⏱ Time's up — waiting for results…", loading: "Loading vocabulary…", mc: "You are the MC — open 📺 Shared screen so everyone can watch.",
      results: "🏁 Results", back: "← Back to game home", nobody: "Nobody answered yet.", ppl: "players", avg: "avg", team_red: "Red Team", team_blue: "Blue Team", team_green: "Green Team", team_yellow: "Yellow Team", click_team: "· host taps a name to switch team",
      tab_me: "Mine", tab_week: "This week", tab_all: "All time", h_player: "Player", h_total: "Total", h_games: "Games", h_best: "Best", h_acc: "Correct", h_date: "Date", h_topic: "Topic", h_score: "Score", h_rank: "Rank", h_rw: "Right/Wrong",
      s_games: "games", s_wins: "🥇 wins", s_best: "best score", s_streak: "longest streak", no_name: "You haven't set a name on this device.", no_games: "You haven't played yet.", no_week: "No games in the last 7 days.", no_all: "No games yet.", loading2: "Loading…", join_at: "Join at", race: "🏁 Free race!", ended: "🏁 Finished!", q_no: "Question {n}", err: "Error" },
    es: { snd_on: "🔊 Con sonido", snd_off: "🔇 Silenciado", snd_on_t: "Toca para silenciar este dispositivo (p. ej. en una llamada de HelloTalk)", snd_off_t: "Toca para volver a activar el sonido", vol: "Volumen", taphint: "🔈 Toca la pantalla una vez para activar el audio", tap_listen: "Toca para escuchar", snd_you: "Tu sonido:", tstats_btn: "📊 Notas TOEIC", tmarks_btn: "🔖 Audios guardados", t_doneg: "Terminé este grupo", t_skipg: "Ir a las siguientes", t_backg: "Volver a las actuales", t_next: "Vista previa de las siguientes preguntas", tips_btn: "🧠 Estrategias", tips_h: "Estrategias para una nota alta en TOEIC", replay_q: "¿Volver a jugar esta partida ahora con todos en la sala?", replay_btn: "🔁 Repetir esta partida", ex_left: "Quedan {t} · respondidas {n}/{m} — toca un número para saltar, cambia respuestas libremente", ex_submit: "Entregar", ex_confirm: "Quedan {n} preguntas sin responder. ¿Entregar igualmente?", ex_done: "Entregado", ex_total: "Total estimado", ex_note: "Puntuación según una tabla de referencia (ETS usa una por examen). Respuestas y explicaciones en 📖 Revisar.", t_listen: "Escuchar", t_pend: "Elegiste {a} — esperando la clave", t_nokey: "Aún no hay clave — mira la hoja de respuestas de la sala al final; el anfitrión la introducirá.", tsh_who: "Jugador", tsh_h: "Hoja de respuestas · Test {t} · Part {p}", tsh_graded: "Clave introducida — verde bien, rojo mal. Fila Σ: cuántos eligieron cada letra.", tsh_nokey: "Aún sin clave — son las elecciones finales de cada uno. Fila Σ: cuántos eligieron cada letra.", tsh_key: "Introducir la clave", tsh_keytip: "Escribe \"{a}C {a}A …\" o solo letras (CABD…) desde la pregunta {a} hasta la {b}.", tsh_save: "Guardar y corregir", tsh_bad: "No se reconoció ninguna respuesta — p. ej. 7C 8A 9B", tsh_fail: "Corregido, pero {n} respuestas no se guardaron.", tsh_ok: "✓ Corregido y guardadas {n} respuestas.", t_ptr: "📖 Traducción del texto", t_traps: "Trampas", t_pick: "Elegida — puedes cambiarla hasta que se acabe el tiempo; luego pasa sola a la siguiente", t_alldone: "🏁 Has terminado — espera a que acabe el tiempo o el anfitrión termine la partida", rv_listen: "🔊 Escuchar de nuevo", tv_h: "Vocabulario para aprender", tv_tip: "Toca palabras de la frase — toca la siguiente para formar una expresión y pulsa ⭐ Guardar", tv_save: "Guardar", tv_saved: "Guardado", tv_nomean: "Sin significado — puedes guardarla igual", tv_err: "No se pudo guardar, inténtalo de nuevo.", t_claude: "Respuesta resuelta por Claude — pendiente de verificar con la clave oficial.", t_saved: "Guardado — respuestas y explicaciones en 📖 Revisar al terminar", t_skip: "Omitida", t_right: "Elegiste bien", t_wrong: "Elegiste mal", q_toeic: "Elige la respuesta correcta (A, B, C, D)", lang_room: "🌐 Idioma de la sala", q_order: "Ordena las piezas para formar la frase en inglés", q_chunk: "Elige el fragmento que falta", q_listen: "Escucha y elige el significado", q_polite: "Elige la frase con el nivel de cortesía correcto", redo: "Reiniciar", reg_casual: "Hablando con un amigo", reg_neutral: "Hablando con un colega", reg_formal: "Hablando con un cliente / jefe", no_voice: "🔇 Este dispositivo no tiene voz {l}, así que el juego no leerá en voz alta. Añádela en los ajustes de idioma/voz del sistema.", type_ph_zh: "Escribe hanzi o pinyin (ej.: pangxie)…", learning_now: "aprendiendo", pair_note: "🎯 Aprendes: {t} · Significados: {m}", pair_tt: "La sala aprende {t}. Los significados se muestran en {m} (tu lengua materna — cámbiala en Language; no puedes elegir el idioma que aprendes).", force_note: "🔒 Significados: {l}", force_tt: "El anfitrión fijó el idioma de los significados para toda la sala: {l}. Language solo cambia el texto de la interfaz.", back_hist: "← Volver al historial", rv_all: "📖 Revisar todas las partidas", rv_wrong: "❌ Solo palabras falladas", rv_word: "palabra {n}/{m}", rv_tally: "Todas las partidas: ✓ {c} aciertos · ✗ {w} fallos", rv_none_wrong: "No has fallado ninguna palabra 🎉", past_ok: "✓ Acertaste esta palabra", past_bad: "✗ Fallaste esta palabra — guárdala para repasar", no_answers: "No hay respuestas tuyas guardadas en esta partida.", next_q: "Siguiente ▶", reveal_btn: "👁 Mostrar respuesta", wait_nextq: "Esperando a que el anfitrión continúe…", no_time: "∞ sin tiempo", review_btn: "📖 Revisar respuestas", review_h: "📖 Revisar respuestas", prev: "◀ Anterior", next: "Siguiente ▶", back_res: "← Volver a resultados", you_typed: "Tu respuesta: {a}", you_none: "No respondiste esta", right_ans: "Respuesta correcta: {a}", same_name: "El nombre \"{n}\" ya existe: {list}.\nSi eres TÚ (en otro dispositivo/navegador) -> escribe tu número (p. ej. 1) para conservar tu historial.\nSi es otra persona -> déjalo vacío y pulsa OK.", tab_other: "El juego se abrió en otra pestaña — esta pestaña está en pausa.", tab_busy: "Hay una partida en otra pestaña — esta pestaña no entra para no romperla.", tab_use: "Usar el juego en esta pestaña", q_en2m: "Elige el significado correcto de esta palabra en inglés", pts_speed: "pts de velocidad", h_right: "✓ Aciertos", h_wrong: "✗ Fallos", s_bestc: "más aciertos en una partida", q_sheet: "Completa TODOS los espacios y pulsa Enviar", q_write: "Escribe una oración en inglés con esta palabra", q_dict: "Pulsa 🔊 para escuchar y escribe la oración COMPLETA", listen: "🔊 Escuchar", headphones: "🎧 Usa auriculares para que el sonido no pase a la llamada", submit_sheet: "📄 Enviar", grading: "✍️ Corrigiendo las oraciones…", write_ph: "Escribe una oración en inglés…", dict_ph: "Escribe la oración que escuchaste…", r_sheet: "✓ {k}/{n} espacios correctos", r_dict: "✓ {k}/{n} palabras correctas", r_write: "Nota de la oración {p}/100 (gramática {g}/50 · uso {u}/50)", fix: "Corrección:", your_ans: "Escribiste:", sent_ok: "Enviado — esperando a los demás…", mother_h: "Mostrar significados en (tu idioma materno)", mother_tt: "Tu idioma materno (interfaz + significados)", name_h: "¿Cómo te llamas?", name_sub: "Este dispositivo recordará tu nombre — sin correo.", name_ph: "Escribe tu nombre…", avatar_h: "Elige un avatar", upload: "📷 Sube tu foto", save: "Guardar y continuar →", need_name: "Escribe un nombre primero.", saving: "Guardando…", uploading: "Subiendo…", not_image: "Ese archivo no es una imagen.",
      join_h: "Entrar a una sala", code_ph: "CÓDIGO", go: "Entrar", hist_btn: "📜 Historial y ranking", no_room: "No se encontró la sala {c}.", room: "Sala", room_code: "Código de sala", copy_link: "🔗 Copiar enlace", copied: "✓ Copiado", screen_btn: "📺 Pantalla compartida", players: "Jugadores", vocab: "Vocabulario", wait_host: "Esperando a que el anfitrión empiece", host_away: "El anfitrión aún no ha llegado — puedes mirar mientras tanto.", wait_next: "Esperando a que el anfitrión abra otra ronda…", host_lost: "⚠ El anfitrión se desconectó — esperando a que vuelva…", host_lost_free: "⚠ El anfitrión se desconectó — sigue jugando, tus respuestas se enviarán cuando vuelva",
      m_kahoot: "Misma pregunta", m_free: "Libre", left_q: "quedan {n}", per_min: "{n}/min", missed: "{n} sin responder", st_right: "Bien", st_wrong: "Mal", st_done: "Hechas", st_left: "Quedan", st_acc: "Precisión", st_pace: "Por min", st_avg: "Prom", st_q: "Pregunta", t_acc: "Precisión en las respondidas", t_pace: "Preguntas por minuto", t_avg: "Tiempo medio por respuesta", t_miss: "Preguntas sin responder a tiempo (no cuentan como error)", t_left: "Preguntas restantes", avg_s: "prom {n}s", react_s: "⚡prom {n}s", q_of: "Pregunta {i} / {n}", done_of: "hechas {a}/{n}", m_race: "⚡ Carrera", sec_q: "s/pregunta", q_meaning: "Elige la palabra en inglés de este significado", q_gap: "Elige la palabra que completa el espacio", q_recall: "Escribe la palabra en inglés de este significado", type_ph: "Escribe la palabra en inglés…", submit: "Enviar",
      picked: "Respondido — esperando a los demás…", picked_change: "Elegido — toca otra respuesta para cambiarla mientras quede tiempo", answered: "{n} respondieron", right: "✓ ¡Correcto!", wrong: "✗ Incorrecto — respuesta: {a}", timeout: "⏱ Se acabó el tiempo — respuesta: {a}", answer: "Respuesta: {a}", fastest: "⚡ Más rápido: {n}", n_right: "{n} acertaron", time_up: "⏱ Se acabó el tiempo — esperando resultados…", loading: "Cargando vocabulario…", mc: "Eres el presentador — abre 📺 Pantalla compartida para que todos vean.",
      results: "🏁 Resultados", back: "← Volver", nobody: "Nadie ha respondido todavía.", ppl: "jugadores", avg: "prom.", team_red: "Equipo Rojo", team_blue: "Equipo Azul", team_green: "Equipo Verde", team_yellow: "Equipo Amarillo", click_team: "· el anfitrión toca un nombre para cambiar de equipo",
      tab_me: "Mío", tab_week: "Esta semana", tab_all: "Siempre", h_player: "Jugador", h_total: "Total", h_games: "Partidas", h_best: "Mejor", h_acc: "Aciertos", h_date: "Fecha", h_topic: "Tema", h_score: "Puntos", h_rank: "Puesto", h_rw: "Bien/Mal",
      s_games: "partidas", s_wins: "veces 🥇", s_best: "récord", s_streak: "racha más larga", no_name: "Aún no tienes nombre en este dispositivo.", no_games: "Aún no has jugado.", no_week: "No hubo partidas en los últimos 7 días.", no_all: "Aún no hay partidas.", loading2: "Cargando…", join_at: "Entra en", race: "🏁 ¡Carrera libre!", ended: "🏁 ¡Terminado!", q_no: "Pregunta {n}", err: "Error" },
    zh: { snd_on: "🔊 有声音", snd_off: "🔇 已静音", snd_on_t: "点击让本设备静音（例如在 HelloTalk 通话时）", snd_off_t: "点击重新打开声音", vol: "音量", taphint: "🔈 点一下屏幕以开启声音", tap_listen: "点击收听", snd_you: "你的声音：", tstats_btn: "📊 TOEIC 成绩", tmarks_btn: "🔖 收藏的听力", t_doneg: "完成本组", t_skipg: "前往下一组", t_backg: "返回当前题组", t_next: "预览下一组题目", tips_btn: "🧠 应试策略", tips_h: "TOEIC 高分策略", replay_q: "现在和房间里的所有人重玩这一局？", replay_btn: "🔁 重玩这一局", ex_left: "剩余 {t} · 已答 {n}/{m} — 点题号跳转，可随时改答案", ex_submit: "交卷", ex_confirm: "还有 {n} 题未作答。确定交卷？", ex_done: "已交卷", ex_total: "估计总分", ex_note: "按参考换算表估算（ETS 每套题有各自的换算表）。在 📖 查看答案 中看答案和解析。", t_listen: "听", t_pend: "你选了 {a} — 等待答案", t_nokey: "暂无答案 — 结果页可看全房间答题卡，主持人会输入答案批改。", tsh_who: "玩家", tsh_h: "答题卡 · Test {t} · Part {p}", tsh_graded: "已有答案 — 绿色对，红色错。Σ 行：每个选项多少人选。", tsh_nokey: "暂无答案 — 这是每个人的最终选择。Σ 行：每个选项多少人选。", tsh_key: "输入答案批改", tsh_keytip: "输入 \"{a}C {a}A …\" 或只输入字母（CABD…），从第 {a} 题到第 {b} 题依次对应。", tsh_save: "保存并批改", tsh_bad: "没有识别到答案 — 例如 7C 8A 9B", tsh_fail: "已批改，但有 {n} 个答案未能保存。", tsh_ok: "✓ 已批改并保存 {n} 个答案。", t_ptr: "📖 全文翻译", t_traps: "陷阱", t_pick: "已选择——时间结束前可以更改，时间到自动进入下一题", t_alldone: "🏁 你已做完——等待时间结束或主持人结束游戏", rv_listen: "🔊 再听一遍", tv_h: "要学的词汇", tv_tip: "点句子里的词——再点旁边的词连成词组，然后点 ⭐ 保存", tv_save: "保存学习", tv_saved: "已保存", tv_nomean: "暂无释义——仍可保存", tv_err: "保存失败，请再试一次。", t_claude: "答案由 Claude 解答，尚未与官方答案核对。", t_saved: "已记录 — 做完后在 📖 查看答案 中看答案和解析", t_skip: "已跳过", t_right: "你选对了", t_wrong: "你选错了", q_toeic: "选出正确答案（A、B、C、D）", lang_room: "🌐 跟随房间", q_order: "把词块排成正确的英文句子", q_chunk: "选出缺少的词块", q_listen: "听句子，选出正确意思", q_polite: "选出礼貌程度合适的句子", redo: "重来", reg_casual: "对好朋友说", reg_neutral: "对同事说", reg_formal: "对客户 / 上级说", no_voice: "🔇 此设备没有{l}语音，游戏不会朗读。请在系统的语言/语音设置中添加。", type_ph_zh: "输入汉字或拼音（如 pangxie）…", learning_now: "正在学", pair_note: "🎯 学习：{t} · 词义：{m}", pair_tt: "本房间正在学习{t}。词义以{m}显示（你的母语 — 在 Language 中更改；不能选择正在学习的语言）。", force_note: "🔒 词义：{l}", force_tt: "主持人为全房间设定了词义语言：{l}。Language 只改变界面文字。", back_hist: "← 返回历史", rv_all: "📖 查看所有比赛", rv_wrong: "❌ 只看答错的词", rv_word: "第 {n}/{m} 个词", rv_tally: "所有比赛：✓ 对 {c} 次 · ✗ 错 {w} 次", rv_none_wrong: "你还没有答错过 🎉", past_ok: "✓ 这个词你答对了", past_bad: "✗ 这个词你答错了 — 建议收藏复习", no_answers: "这场比赛没有保存你的答案。", next_q: "下一题 ▶", reveal_btn: "👁 显示答案", wait_nextq: "等待主持人进入下一题…", no_time: "∞ 不计时", review_btn: "📖 查看答案", review_h: "📖 查看答案", prev: "◀ 上一题", next: "下一题 ▶", back_res: "← 返回结果", you_typed: "你的答案：{a}", you_none: "你没有回答这题", right_ans: "正确答案：{a}", same_name: "名字 \"{n}\" 已被使用：{list}。\n如果是你（换了设备/浏览器）-> 输入你的编号（如 1）以保留历史记录。\n如果是别人 -> 留空并点确定。", tab_other: "游戏已在另一个标签页打开——此标签页已暂停。", tab_busy: "另一个标签页正在进行比赛——此标签页不进入房间，以免打乱比赛。", tab_use: "在此标签页使用游戏", q_en2m: "选出这个英文单词的正确意思", pts_speed: "速度分", h_right: "✓ 答对", h_wrong: "✗ 答错", s_bestc: "单局最多答对", q_sheet: "给所有空格选词，然后点提交", q_write: "用这个词写一个英文句子", q_dict: "点 🔊 听，然后输入整句话", listen: "🔊 听", headphones: "🎧 请戴耳机，避免声音传进语音通话", submit_sheet: "📄 提交", grading: "✍️ 正在批改大家的句子…", write_ph: "写一个英文句子…", dict_ph: "输入你听到的句子…", r_sheet: "✓ {k}/{n} 空正确", r_dict: "✓ {k}/{n} 词正确", r_write: "句子得分 {p}/100（语法 {g}/50 · 用词 {u}/50）", fix: "修改：", your_ans: "你输入的：", sent_ok: "已提交——等待其他人…", mother_h: "释义显示语言（你的母语）", mother_tt: "你的母语（界面 + 释义）", name_h: "你叫什么名字？", name_sub: "本设备会记住你的名字——无需邮箱。", name_ph: "输入名字…", avatar_h: "选择头像", upload: "📷 上传照片", save: "保存并继续 →", need_name: "请先输入名字。", saving: "保存中…", uploading: "上传中…", not_image: "这个文件不是图片。",
      join_h: "加入房间", code_ph: "房间码", go: "加入", hist_btn: "📜 历史与排名", no_room: "找不到房间 {c}。", room: "房间", room_code: "房间码", copy_link: "🔗 复制邀请链接", copied: "✓ 已复制", screen_btn: "📺 共享屏幕", players: "玩家", vocab: "词汇", wait_host: "等待主持人开始", host_away: "主持人还没进房间——可以先看看。", wait_next: "等待主持人开始新一局…", host_lost: "⚠ 主持人断线了——等待主持人回来…", host_lost_free: "⚠ 主持人断线了——继续答题，主持人回来后会自动提交",
      m_kahoot: "同一题", m_free: "自由模式", left_q: "剩 {n} 题", per_min: "{n} 题/分", missed: "漏 {n}", st_right: "对", st_wrong: "错", st_done: "已做", st_left: "剩余", st_acc: "正确率", st_pace: "题/分", st_avg: "平均", st_q: "题", t_acc: "已答题正确率", t_pace: "每分钟答题数", t_avg: "平均作答时间", t_miss: "超时未作答（不算错）", t_left: "本局剩余题数", avg_s: "均 {n}秒", react_s: "⚡均 {n}秒", q_of: "第 {i} / {n} 题", done_of: "已做 {a}/{n}", m_race: "⚡ 竞速", sec_q: "秒/题", q_meaning: "选出这个意思的英文单词", q_gap: "选出填入空格的单词", q_recall: "输入这个意思的英文单词", type_ph: "输入英文单词…", submit: "提交",
      picked: "已作答——等待其他人…", picked_change: "已选择——时间未到可点其他答案更改", answered: "{n} 人已作答", right: "✓ 正确！", wrong: "✗ 错误——答案：{a}", timeout: "⏱ 时间到——答案：{a}", answer: "答案：{a}", fastest: "⚡ 最快：{n}", n_right: "{n} 人答对", time_up: "⏱ 时间到——等待结果…", loading: "正在加载词汇…", mc: "你是主持人——打开 📺 共享屏幕让大家一起看。",
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
  function show(id) { $$(".g-screen").forEach(function (s) { s.hidden = s.id !== id; }); document.body.classList.toggle("big", id === "s-screen"); paintSide(); }
  function norm(t) { return String(t || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  /* chấm câu GÕ TAY giống WordLoop (w.normalizeAnswer): bỏ dấu câu/ngoặc, thường hoá, gộp khoảng trắng */
  function normAns(s) { return String(s || "").normalize("NFC").toLowerCase().trim().replace(/[.,!?;:"'`()\[\]。，！？；：、¿¡“”‘’（）「」]/g, "").replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim(); }
  /* bỏ dấu (es "atun" = "atún", vi "ca hoi" = "cá hồi") — chấm ĐÚNG, người chơi vẫn thấy đáp án chuẩn có dấu (QA 2026-10-03) */
  function noMarks(s) { return normAns(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"); }
  /* 🀄 gõ PINYIN thay chữ Hán (chuyên gia sư phạm 2026-10-03: nhiều người chưa cài bộ gõ tiếng Trung): chấp nhận
     "páng xiè", "pangxie", "pang xie", "pang2xie4"; ü gõ v hoặc u. Đối chiếu với pinyin-pro của từng cách nói của đáp án. */
  function pyKey(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/v/g, "u").replace(/[^a-z]/g, ""); }
  function pinyinOk(typed, ans) {
    if (!hasZh(ans) || !window.pinyinPro || hasZh(typed)) return false;
    var k = pyKey(typed); if (k.length < 2) return false;
    return [ans].concat(String(ans).split(/\s*[\/;,，、；]\s*/)).some(function (v) { v = v.replace(/（[^）]*）|\([^)]*\)/g, ""); return hasZh(v) && pyKey(py(v)) === k; });
  }
  function typedOk(typed, ans) {   /* "subscribe (to)": gõ "subscribe to" hoặc "subscribe" đều đúng */
    var t = normAns(typed); if (!t) return false;
    if (pinyinOk(typed, ans)) return true;   /* học tiếng Trung: gõ pinyin thay chữ Hán */
    var whole = function (x) { return noMarks(String(x).replace(/\s*[\/;,，、；]\s*/g, "/")).replace(/\s*\/\s*/g, "/"); };   /* gõ đủ cụm với dấu phân cách khác vẫn đúng */
    var cand = [ans, String(ans).replace(/\([^)]*\)|（[^）]*）/g, " ")].concat(String(ans).split(/\s*[\/;,，、；]\s*/).map(function (v) { return v.replace(/\([^)]*\)|（[^）]*）/g, " ").trim(); }));
    return cand.some(function (v) { return v && (normAns(v) === t || noMarks(v) === noMarks(typed) || whole(v) === whole(typed)); });   /* nhiều cách nói: gõ 1 cách là đúng */
  }
  function clean(t) { return String(t || "").trim(); }
  /* 🕵️ CÂU (Hub CIA, 1000 câu EN·ES·CN·VN, 2026-10-03): words.pos = "Câu" / "★ Câu sống còn" -> giữ nguyên cả câu (không cắt ở
     dấu phẩy, không lọc "câu mẫu"). words.audio = {vi,en,es,zh: url mp3} -> phát file thay giọng máy. */
  function isSent(pos) { return /^(★\s*)?câu(\s+sống còn)?$/i.test(String(pos || "").trim()); }
  G.audioMap = {};
  function regAudio(w) {
    if (!w || !w.audio) return;
    var t = { en: w.term, vi: w.meaning_vi, zh: w.meaning_zh, es: w.meaning_es };
    Object.keys(w.audio).forEach(function (l) { var x = clean(t[l]); if (x && w.audio[l]) { G.audioMap[l + "|" + x] = w.audio[l]; G.audioMap[l + "|" + baseTerm(x)] = w.audio[l]; } });
  }
  /* bản dịch -> 1 cách nói cho game (khi chưa có cột quiz_<x>): bỏ ngoặc, lấy cách đầu, bỏ dấu câu cuối (chuyên gia ngôn ngữ 2026-10-03) */
  function quizForm(t) {
    t = String(t || "").replace(/（[^）]*）|\([^)]*\)/g, " ").split(/\s*[\/;；,，、]\s*/)[0] || "";
    return t.replace(/[。.!！?？…]+\s*$/, "").replace(/\s+/g, " ").trim();
  }
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
  /* 🎯 NGÔN NGỮ ĐANG HỌC (TJ 2026-10-03: "chỗ chọn target language — học tiếng Trung, ES, hoặc VN"). Host chọn cho cả
     phòng (st.target, mặc định "en"). Khác "en": từ cần trả lời = bản dịch meaning_<target> của từ; nghĩa hiện theo tiếng
     mẹ đẻ từng người (tiếng Anh dùng chính từ tiếng Anh). Chỉ các dạng Nghĩa / Từ→Nghĩa / Gõ từ / Trộn; các dạng câu tiếng
     Anh (điền chỗ trống, phiếu, dictation, đặt câu), nhãn CEFR và ghi tiến trình WordLoop chỉ có khi học tiếng Anh. */
  function tgt() { return (G.st && G.st.target) || "en"; }
  /* 🀄 PINYIN — học tiếng Trung LUÔN hiện pinyin dưới chữ Hán (TJ 2026-10-03: "luôn luôn như vậy vì người học").
     Thư viện pinyin-pro (CDN, chỉ tải khi học tiếng Trung); có dấu thanh, xử lý chữ đa âm (重要 zhòng, 行业 háng). */
  var PY_SRC = "https://cdn.jsdelivr.net/npm/pinyin-pro@3.29.4/dist/index.js", pyP = null;
  function loadPinyin() {
    if (window.pinyinPro) return Promise.resolve();
    if (!pyP) pyP = new Promise(function (ok) { var sc = document.createElement("script"); sc.src = PY_SRC; sc.onload = function () {
      try { window.pinyinPro.customPinyin({ "还钱": "huán qián", "还给": "huán gěi", "归还": "guī huán", "为背景": "wéi bèi jǐng", "以为": "yǐ wéi" }); } catch (e) {}   /* chữ đa âm pinyin-pro đọc sai */
      ok(); decoratePy(document, true); }; sc.onerror = function () { pyP = null; ok(); }; document.head.appendChild(sc); });
    return pyP;
  }
  function hasZh(t) { return /[\u3400-\u9fff]/.test(String(t || "")); }
  function py(t) {
    if (!hasZh(t) || !window.pinyinPro) return "";
    try { return window.pinyinPro.pinyin(String(t), { toneType: "symbol", nonZh: "consecutive" }).replace(/\s+/g, " ").replace(/(\.\s?){3}/g, "...").trim(); } catch (e) { return ""; }
  }
  function zhA(t) { var p = tgt() === "zh" ? py(t) : ""; return p ? t + " (" + p + ")" : t; }   /* "đáp án: 螃蟹 (páng xiè)" */
  /* gắn dòng pinyin dưới mọi phần tử [data-zh] chưa có (gọi lại sau khi thư viện tải xong) */
  function decoratePy(root, force) {
    if (!force && tgt() !== "zh") return;
    if (!window.pinyinPro) { loadPinyin(); return; }
    (root || document).querySelectorAll("[data-zh]").forEach(function (el) {
      if (el.querySelector(".g-py")) return;
      var p = py(el.dataset.zh); if (p) el.insertAdjacentHTML("beforeend", '<small class="g-py">' + esc(p) + "</small>");
    });
  }
  var TTS_LANG = { en: "en-US", zh: "zh-CN", es: "es-ES", vi: "vi-VN" };
  var TGT_NAME = { vi: { en: "tiếng Anh", zh: "tiếng Trung", es: "tiếng Tây Ban Nha", vi: "tiếng Việt" },
                   en: { en: "English", zh: "Chinese", es: "Spanish", vi: "Vietnamese" },
                   es: { en: "en inglés", zh: "en chino", es: "en español", vi: "en vietnamita" },
                   zh: { en: "英文", zh: "中文", es: "西班牙文", vi: "越南文" } };
  function roomLang(st) { return (st && st.lang) || (G.room && G.room.meaning_lang) || "vi"; }
  function uiLang() { return G.view === "screen" ? roomLang(G.st) : G.myLang && G.myLang !== "room" ? G.myLang : "vi"; }
  function guessLang() { var l = (navigator.language || "").slice(0, 2).toLowerCase(); return { vi: "vi", es: "es", zh: "zh", en: "en" }[l] || "vi"; }
  /* 🔒 "Ép cả phòng" CHỈ áp cho câu dạng NGHĨA (TJ 2026-09-30) — Điền chỗ trống là câu tiếng Anh, Gõ từ vẫn
     theo tiếng riêng từng người; trộn cả 3 thì chỉ câu Nghĩa bị ép. qtype = dạng của CÂU đang hỏi. */
  function effLang(pref, st, qtype) {
    /* học khác English: nghĩa LUÔN theo tiếng mẹ đẻ từng người, 🔒 không có tác dụng (TJ 2026-10-03: "học tiếng Trung mà lộn
       tiếng Anh vào" — phòng để tiếng chung English + 🔒) */
    var forced = st && st.force && tgt() === "en" && (!qtype || qtype === "meaning" || qtype === "en2m");
    var l = forced ? roomLang(st) : pref && pref !== "room" ? pref : roomLang(st);
    return l === tgt() && l !== "en" ? "en" : l;   /* học tiếng X thì nghĩa không thể là tiếng X -> dùng từ tiếng Anh */
  }
  function T(k, vars) {
    var s = (UI[uiLang()] || UI.vi)[k]; if (s == null) s = UI.vi[k] || k;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, x) { return vars[x] == null ? "" : vars[x]; });
    if (tgt() !== "en" && /^(q_meaning|q_en2m|q_recall|type_ph|q_order)$/.test(k)) { var nm = TGT_NAME[uiLang()] || TGT_NAME.vi; s = s.replace(nm.en, nm[tgt()]); }
    return s;
  }
  function applyUI() {
    document.documentElement.lang = uiLang();
    $$("[data-t]").forEach(function (el) { el.textContent = T(el.dataset.t); }); if (typeof paintTIntro === "function") setTimeout(paintTIntro, 0);
    $$("[data-tp]").forEach(function (el) { el.placeholder = T(el.dataset.tp); });
    $$("[data-tt]").forEach(function (el) { el.title = T(el.dataset.tt); });
    $$("#n-langs [data-ml], #l-langs [data-ml]").forEach(function (b) { b.classList.toggle("on", b.dataset.ml === G.myLang); });
    $("#p-typein").placeholder = T("type_ph");
    paintForce();
    if (G.room) { $("#g-room-badge").textContent = T("room") + " " + G.room.code; var tt = (G.st && G.st.title) || ""; $("#l-info").textContent = tt ? T("vocab") + ": " + tt : ""; }
  }
  /* host 🔒 ép tiếng NGHĨA cho cả phòng -> nhãn nhỏ cạnh ô 🌐 Language: "🔒 Nghĩa: 🇨🇳 中文" (TJ 2026-10-03: "đổi qua tiếng
     Trung mà nó còn tiếng Việt" — ô Language chỉ đổi CHỮ GIAO DIỆN, nghĩa do host ép) */
  var LANG_NAME = { vi: "Tiếng Việt", en: "English", es: "Español", zh: "中文" };
  /* 🎯 + tiếng mẹ đẻ PHẢI HỢP LÝ (TJ 2026-10-03): không chọn tiếng mẹ đẻ / tiếng chung TRÙNG tiếng đang học (ô mờ "🎯 đang
     học"); nhãn tóm tắt cạnh ô Language: "🎯 Học: 🇨🇳 中文 · Nghĩa: 🇻🇳 Tiếng Việt" (+ 🔒 khi host ép tiếng nghĩa). */
  /* ô "Dạng câu hỏi" của host ghi đúng NGÔN NGỮ ĐANG HỌC (TJ 2026-10-03: "chọn tiếng Trung thì dạng câu hỏi phải đổi qua
     tiếng Trung -> tiếng mẹ đẻ họ tự chọn"); dạng chỉ có ở tiếng Anh thì mờ. */
  var EN_ONLY = { gap: 1, sheet: 1, write: 1, dict: 1 };
  /* 🕵️ CHẾ ĐỘ CHUNK (TJ 2026-10-03: "game này khác từ vựng định nghĩa — chỉ có câu 4 ngôn ngữ, chơi trò chunk"):
     chủ đề mà phần lớn là CÂU có words.chunks (1000 câu CIA) -> chỉ còn 4 dạng chunk + Trộn, dạng từ vựng bị khoá,
     tự chuyển sang 🕵️ Trộn 4 dạng chunk. */
  var CHUNK_Q = { order: 1, chunk: 1, listen: 1, polite: 1, chunkmix: 1 };
  function chunkMode() {
    var p = G.pool || []; if (!p.length) return false;
    var n = p.filter(function (it) { return it.sent && it.ch; }).length;
    return n * 2 >= p.length;
  }
  function paintQtypes() {
    var sel = $("#l-qtype"); if (!sel || (G.st && G.st.qtype === "toeic")) return;
    if (chunkMode()) {
      $$("#l-qtype option").forEach(function (o) {
        if (o.dataset.orig == null) o.dataset.orig = o.textContent;
        o.disabled = !CHUNK_Q[o.value];
        o.hidden = o.disabled;
        o.textContent = o.dataset.orig;
      });
      if (!CHUNK_Q[sel.value]) {
        sel.value = "chunkmix";
        if (G.isHost && G.st && G.st.phase === "lobby") sel.dispatchEvent(new Event("change"));
      }
      return;
    }
    var loaded = (G.pool || []).length > 0;   /* chưa tải xong chủ đề -> chưa biết, không ẩn/đổi gì */
    $$("#l-qtype option").forEach(function (o) { o.hidden = loaded && !!CHUNK_Q[o.value]; });
    if (loaded && CHUNK_Q[sel.value]) {
      sel.value = "meaning";
      if (G.isHost && G.st && G.st.phase === "lobby") sel.dispatchEvent(new Event("change"));
    }
    var t = tgt(), L = TGT_NAME.vi[t], other = t !== "en";
    var lab = { meaning: "🔤 Nghĩa (tiếng mẹ đẻ) → chọn từ " + L, en2m: "🔤 Từ " + L + " → chọn nghĩa (tiếng mẹ đẻ)",
                recall: "⌨️ Gõ từ " + L + " (Active Recall)", mix: other ? "🔀 Trộn 3 dạng trên" : "🔀 Trộn 4 dạng trên" };
    $$("#l-qtype option").forEach(function (o) {
      if (o.dataset.orig == null) o.dataset.orig = o.textContent;
      o.disabled = (other && !!EN_ONLY[o.value]) || (loaded && !!CHUNK_Q[o.value]);   /* Safari iPhone không ẩn được <option hidden> */
      o.textContent = lab[o.value] || (o.dataset.orig + (o.disabled ? " — chỉ khi học English" : ""));
    });
    if (other && EN_ONLY[sel.value]) sel.value = "meaning";
  }
  function paintForce() {
    paintQtypes();
    var el = $("#g-forcenote"); if (!el) return;
    var st = G.st, t = tgt(), block = t !== "en" ? t : null;
    $$("#g-mylang option, #l-lang option").forEach(function (o) {
      if (o.dataset.orig == null) o.dataset.orig = o.textContent;
      o.disabled = o.value === block;
      o.textContent = o.dataset.orig + (o.disabled ? " — 🎯 " + T("learning_now") : "");
    });
    $$("#n-langs [data-ml], #l-langs [data-ml]").forEach(function (b) {
      var off = b.dataset.ml === block;
      b.disabled = off; b.classList.toggle("g-learning", off); b.title = off ? "🎯 " + T("learning_now") : "";
    });
    if (G.isHost && st && block && st.lang === block) {   /* tiếng chung trùng tiếng đang học -> tự đổi */
      st.lang = block === "vi" ? "en" : "vi"; $("#l-lang").value = st.lang; push();
    }
    var forced = !!(st && st.force && t === "en" && (st.qtype === "meaning" || st.qtype === "en2m" || st.qtype === "mix"));
    var fw = $("#l-force-wrap"); if (fw && block) fw.hidden = true;   /* học khác English: ẩn ô 🔒 */
    var on = !!st && (block || forced) && G.view !== "screen";
    el.hidden = !on;
    if (!on) return;
    var m = effLang(G.myLang, st, "meaning"), ml = FLAG[m] + " " + LANG_NAME[m];
    var full = block ? T("pair_note", { t: FLAG[t] + " " + LANG_NAME[t], m: (forced ? "🔒 " : "") + ml }) : T("force_note", { l: ml });
    var short = block ? "🎯" + FLAG[t] + " → " + (forced ? "🔒" : "") + FLAG[m] : "🔒 " + FLAG[m];
    el.innerHTML = '<span class="g-fnl">' + esc(full) + '</span><span class="g-fns">' + esc(short) + "</span>";
    el.title = block ? T("pair_tt", { t: LANG_NAME[t], m: LANG_NAME[m] }) + (forced ? " " + T("force_tt", { l: LANG_NAME[m] }) : "") : T("force_tt", { l: LANG_NAME[m] });
  }
  function myText(q) { var t = q.texts || {}; return t[effLang(G.view === "screen" ? "room" : G.myLang, G.st, q.type)] || t.en || t.vi || ""; }
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
    var b = e.target.closest("[data-ml]"); if (!b || b.disabled) return;
    $("#g-mylang").value = b.dataset.ml; $("#g-mylang").dispatchEvent(new Event("change"));
  });
  $("#n-langs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ml]"); if (!b || b.disabled) return;
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
      writeLS(LS_ME, G.me); paintMe(); loadMeProfile().catch(function () {});
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
  $("#l-hist").addEventListener("click", function () { renderHistory("me"); });

  /* Cây Hub > Notebook > Section > Page (Batch/Block chọn qua chuột phải trong WordLoop) */
  var TREE = null;
  async function loadTree(fresh) {
    if (TREE && !fresh) return paintTree();
    async function all(t, cols, order) {   /* đọc hết (PostgREST trả tối đa 1000 dòng/lần) */
      var out = [], from = 0;
      for (;;) { var r = await sb.from(t).select(cols).order(order).range(from, from + 999); if (r.error) throw r.error; out = out.concat(r.data); if (r.data.length < 1000) return out; from += 1000; }
    }
    try {
      var q = await Promise.all([all("hubs", "id,name,sort", "sort"), all("notebooks", "id,name,sort,hub_id,parent_notebook_id", "sort"), all("sections", "id,name,sort,notebook_id", "sort"),
        all("pages", "id,name,sort,section_id", "sort"), all("batches", "id,name,sort,page_id", "sort"), all("blocks", "id,name,global_index,batch_id", "global_index")]);
      TREE = { hubs: q[0], notebooks: q[1], sections: q[2], pages: q[3], batches: q[4], blocks: q[5] };
    } catch (err) { $("#h-tree").innerHTML = '<p class="g-err">Không tải được cây: ' + esc(err.message || err) + "</p>"; return; }
    if (!fresh) paintTree();
    loadDue();
    return true;
  }
  /* 🔄 Tải lại cây (TJ 2026-10-01): đổi cấu trúc/thêm từ bên WordLoop -> game thấy ngay không cần F5.
     Giữ nhánh đang bung; mục đã chọn bị xoá bên WordLoop thì bỏ, bị đổi tên thì lấy tên mới; tải lại kho từ. */
  var treeBusy = false;
  async function refreshTree(quiet) {
    if (treeBusy || !G.isHost || !G.st || G.st.phase !== "lobby") return;
    treeBusy = true;
    var opened = $$("#h-tree details[open] > summary [data-pick]").map(function (c) { return c.dataset.pick + ":" + c.dataset.id; });
    if (!quiet) $("#h-reload").disabled = true;
    try {
      if (!(await loadTree(true))) return;
      var before = JSON.stringify(picked);
      picked = picked.filter(function (p) { return (TREE[p.table] || []).some(function (r) { return r.id === p.id; }); })
        .map(function (p) { var r = TREE[p.table].find(function (x) { return x.id === p.id; }); return { table: p.table, id: p.id, title: r.name }; });
      paintTree();
      opened.forEach(function (k) {
        var i = k.indexOf(":"), c = $('#h-tree [data-pick="' + k.slice(0, i) + '"][data-id="' + k.slice(i + 1).replace(/"/g, '\\"') + '"]');
        var d = c && c.closest("details"); if (d) d.open = true;
      });
      G.poolKey = null;   /* tải lại cả kho từ (có thể vừa thêm từ vào Block đang chọn) */
      if (picked.length || before !== "[]") hostSetScope();
    } finally { treeBusy = false; if (!quiet) $("#h-reload").disabled = false; }
  }
  function treeOpenAll(on) {
    $$("#h-tree details").forEach(function (d) { d.open = on; });
  }
  $("#h-expand").addEventListener("click", function () { treeOpenAll(true); });
  $("#h-collapse").addEventListener("click", function () { treeOpenAll(false); });
  $("#h-reload").addEventListener("click", function () { refreshTree(false); });
  function paintTree() {
    function kids(list, key, id) { return TREE[list].filter(function (r) { return r[key] === id; }); }
    function node(table, r, inner) {
      var on = picked.some(function (p) { return p.table === table && p.id === r.id; });
      var chk = '<label class="g-pick"><input type="checkbox" data-pick="' + table + '" data-id="' + esc(r.id) + '" data-title="' + esc(r.name) + '"' + (on ? " checked" : "") + "> " + esc(r.name) + "</label>";
      var dots = '<button class="g-dots" data-dots title="Chọn…">⋯</button>';
      return inner ? '<details><summary><span class="g-nrow">' + chk + dots + "</span></summary>" + inner + "</details>" : '<div class="g-leaf"><span class="g-nrow">' + chk + dots + "</span></div>";
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
    $$("#h-tree input:checked").forEach(function (c) {   /* bung sẵn các nhánh có mục đang chọn */
      for (var d = c.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
    });
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
  $("#h-tree").addEventListener("click", function (e) {
    var d = e.target.closest("[data-dots]");
    if (d) { e.preventDefault(); e.stopPropagation(); return dotMenu(d); }
    if (e.target.closest(".g-pick")) e.stopPropagation();
  });

  /* ---------- 📚 cột trái chứa cây (chỉ host, chỉ phòng chờ) ---------- */
  var LS_PIN = "tjwl_game_sidepin_v1";
  var SIDE = { pinned: readLS(LS_PIN) !== false, open: false };
  function narrow() { return window.matchMedia("(max-width: 900px)").matches; }
  function paintSide() {
    var side = $("#g-side"); if (!side || !SIDE) return;
    document.documentElement.style.setProperty("--gtop", $(".g-top").offsetHeight + "px");
    var on = !!(G.isHost && G.view !== "screen" && !$("#s-lobby").hidden), pinned = SIDE.pinned && !narrow();
    if (!on) SIDE.open = false;
    side.hidden = !on || (!pinned && !SIDE.open);
    side.classList.toggle("fly", !pinned);
    document.body.classList.toggle("side-pinned", on && pinned);
    $("#h-sidetab").hidden = !on || pinned || SIDE.open;
    $("#h-sidebd").hidden = !on || pinned || !SIDE.open;
    $("#h-pin").classList.toggle("on", SIDE.pinned);
    $("#h-sideopen").hidden = pinned;
    if (side.hidden) $("#h-dotmenu").hidden = true;
  }
  function sideOpen(on) { SIDE.open = on; paintSide(); }
  /* « thu nhỏ cột = bỏ ghim + đóng (còn 📚 ở mép trái / nút "Chọn chủ đề…") */
  $("#h-shrink").addEventListener("click", function () { SIDE.pinned = false; SIDE.open = false; writeLS(LS_PIN, false); paintSide(); });
  /* kéo mép phải đổi độ rộng cột (giống thanh kéo Notebooks/Pages của WordLoop), nhớ theo máy */
  var LS_SIDEW = "tjwl_game_sidew_v1";
  function setSideW(px) { px = Math.max(180, Math.min(520, px | 0)); document.documentElement.style.setProperty("--sidew", px + "px"); return px; }
  if (readLS(LS_SIDEW)) setSideW(readLS(LS_SIDEW));
  $("#h-resizer").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    var el = this; el.setPointerCapture(e.pointerId); document.body.classList.add("g-resizing");
    function mv(ev) { setSideW(ev.clientX); }
    function up(ev) { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); document.body.classList.remove("g-resizing"); writeLS(LS_SIDEW, setSideW(ev.clientX)); }
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up);
  });
  $("#h-resizer").addEventListener("dblclick", function () { document.documentElement.style.removeProperty("--sidew"); writeLS(LS_SIDEW, null); });
  $("#h-pin").addEventListener("click", function () { SIDE.pinned = !SIDE.pinned; SIDE.open = false; writeLS(LS_PIN, SIDE.pinned); paintSide(); });
  $("#h-sideopen").addEventListener("click", function () { sideOpen(true); });
  $("#h-sidetab").addEventListener("click", function () { sideOpen(true); });
  $("#h-sideclose").addEventListener("click", function () { sideOpen(false); });
  $("#h-sidebd").addEventListener("click", function () { sideOpen(false); });
  window.addEventListener("resize", paintSide);

  /* ⋯ của từng mục: CHỈ thao tác chọn (sửa/dời/xoá vẫn làm bên WordLoop — TJ 2026-10-01) */
  var dotFor = null;
  function dotMenu(btn, x, y) {   /* x,y = vị trí chuột phải (không có -> ngay dưới nút ⋯) */
    var m = $("#h-dotmenu"), r = btn.getBoundingClientRect();
    var row = btn.closest(".g-nrow");
    dotFor = row.querySelector("[data-pick]");
    var branch = !!row.closest("summary");   /* mục có con -> có Bung/Thu */
    $$("#h-dotmenu [data-fold]").forEach(function (b) { b.hidden = !branch; });
    m.hidden = false;
    m.style.top = Math.min(y != null ? y : r.bottom + 2, window.innerHeight - m.offsetHeight - 8) + "px";
    m.style.left = Math.max(8, Math.min(x != null ? x : r.left, window.innerWidth - m.offsetWidth - 8)) + "px";
  }
  /* chuột phải vào 1 mục = mở cùng menu với ⋯ (TJ 2026-10-01) */
  $("#h-tree").addEventListener("contextmenu", function (e) {
    var row = e.target.closest(".g-nrow"); if (!row) return;
    e.preventDefault();
    dotMenu(row.querySelector("[data-dots]"), e.clientX, e.clientY);
  });
  document.addEventListener("click", function (e) { if (!e.target.closest("#h-dotmenu") && !e.target.closest("[data-dots]")) $("#h-dotmenu").hidden = true; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { $("#h-dotmenu").hidden = true; if (SIDE.open) sideOpen(false); } });
  $("#h-dotmenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || !dotFor) return;
    var c = dotFor, me = { table: c.dataset.pick, id: c.dataset.id, title: c.dataset.title };
    var box = c.closest("details") || c.closest(".g-leaf");
    var inside = Array.prototype.map.call(box.querySelectorAll("[data-pick]"), function (x) { return x.dataset.pick + ":" + x.dataset.id; });   /* mục này + mọi mục con */
    var notMe = function (p) { return inside.indexOf(p.table + ":" + p.id) < 0; };
    if (b.dataset.act === "open" || b.dataset.act === "close") {   /* bung/thu MỌI cấp bên trong nhánh này */
      var on = b.dataset.act === "open";
      if (box.tagName === "DETAILS") { box.open = on; box.querySelectorAll("details").forEach(function (d) { d.open = on; }); }
      $("#h-dotmenu").hidden = true;
      return;
    }
    if (b.dataset.act === "bd-vw" || b.dataset.act === "bd-w") {   /* 🖤 Block trong nhánh này -> mở lên bảng theo thứ tự cây */
      var bl = Array.prototype.filter.call(box.querySelectorAll('[data-pick="blocks"]'), function (x) { return x.dataset.pick === "blocks"; }).map(function (x) { return [x.dataset.id, x.dataset.title]; });
      $("#h-dotmenu").hidden = true;
      if (!bl.length) { alert("Mục này chưa có Block nào."); return; }
      if (window.Board) Board.openBlocks(bl, b.dataset.act === "bd-w" ? "w" : "vw");
      return;
    }
    if (b.dataset.act === "only") picked = [me];
    else if (b.dataset.act === "branch") picked = picked.filter(notMe).concat([me]);   /* chọn cha là đủ cả nhánh -> bỏ chọn lẻ bên trong */
    else picked = picked.filter(notMe);
    $("#h-dotmenu").hidden = true;
    paintTree(); hostSetScope();
  });
  /* ☑ Chọn tất cả = mọi Hub · ✖ Bỏ tất cả = xoá hết rồi chọn lại từng nhánh (tới Block) trên cây */
  $("#h-all").addEventListener("click", function () {
    if (!TREE) return;
    picked = TREE.hubs.map(function (h) { return { table: "hubs", id: h.id, title: h.name }; });
    paintTree(); hostSetScope();
  });
  $("#h-none").addEventListener("click", function () {
    picked = [];
    if (TREE) paintTree(); else paintPicked();
    hostSetScope();
    sideOpen(true);   /* mở cây để chọn lại ngay */
  });
  /* đường dẫn Hub › Notebook › Section › Page › Batch › Block của mục đã chọn (cần TREE đã tải) */
  function pathOf(p) {
    if (!TREE) return p.title;
    var chain = [], t = p.table, id = p.id, by = function (list, i) { return TREE[list].find(function (r) { return r.id === i; }); };
    for (var n = 0; n < 12 && t && id; n++) {
      var r, up;
      if (t === "blocks") { r = by("blocks", id); up = r && ["batches", r.batch_id]; }
      else if (t === "batches") { r = by("batches", id); up = r && ["pages", r.page_id]; }
      else if (t === "pages") { r = by("pages", id); up = r && ["sections", r.section_id]; }
      else if (t === "sections") { r = by("sections", id); up = r && ["notebooks", r.notebook_id]; }
      else if (t === "notebooks") { r = by("notebooks", id); up = r && (r.parent_notebook_id ? ["notebooks", r.parent_notebook_id] : ["hubs", r.hub_id]); }
      else { r = by("hubs", id); up = null; }
      if (!r) break;
      chain.unshift(r.name);
      t = up && up[0]; id = up && up[1];
    }
    return chain.length ? chain.join(" › ") : p.title;
  }
  /* ---------- ⏳ Block ĐẾN HẠN ÔN của TJ (TJ 2026-10-01: "game phục vụ việc học của TJ") ----------
     Cùng luật với SRS.state (js/srs.js): đã đạt bài thi (passed), chưa xong 6 lần ôn, next_review_at <= bây giờ.
     "Sắp đến hạn" = trong 7 ngày tới. Chỉ ĐỌC block_progress, không ghi gì. */
  var DUE = null, DUE_STEPS = 6, DAY_MS = 864e5;
  async function loadDue() {
    if (!G.isHost || !isTJ()) return;
    var r = await sb.from("block_progress").select("block_id,cycle,next_review_at").eq("user_id", HOST_PROFILE_ID).eq("passed", true).limit(5000);
    if (r.error) { console.warn("block_progress", r.error.message); return; }
    var now = Date.now(), ids = {};
    if (TREE) TREE.blocks.forEach(function (b) { ids[b.id] = 1; });
    var rows = (r.data || []).filter(function (x) { return (x.cycle | 0) < DUE_STEPS && (!TREE || ids[x.block_id]); });
    DUE = {
      now: rows.filter(function (x) { return !x.next_review_at || x.next_review_at <= now; }).sort(function (a, b) { return (a.next_review_at || 0) - (b.next_review_at || 0); }),
      soon: rows.filter(function (x) { return x.next_review_at > now && x.next_review_at <= now + 7 * DAY_MS; }).sort(function (a, b) { return a.next_review_at - b.next_review_at; })
    };
    paintDue();
  }
  function dueRow(x, isNow) {
    var b = TREE && TREE.blocks.find(function (r) { return r.id === x.block_id; }); if (!b) return "";
    var on = picked.some(function (p) { return p.table === "blocks" && p.id === b.id; });
    var path = pathOf({ table: "blocks", id: b.id, title: b.name }), parts = path.split(" › ");
    var d = x.next_review_at ? Math.round((x.next_review_at - Date.now()) / DAY_MS) : 0;
    var when = isNow ? (d < 0 ? "trễ " + (-d) + " ngày" : "hôm nay") : (d <= 0 ? "< 1 ngày" : "còn " + d + " ngày");
    return '<div class="g-leaf"><span class="g-nrow" title="' + esc(path) + '"><label class="g-pick"><input type="checkbox" data-due data-id="' + esc(b.id) + '" data-title="' + esc(b.name) + '"' + (on ? " checked" : "") + "> " +
      "<b>" + esc(b.name) + "</b> · " + esc(parts.slice(-5, -4).concat(parts.slice(-3, -2)).join(" › ")) + '</label><span class="g-duetag">Lần ' + ((x.cycle | 0) + 1) + " · " + when + "</span></span></div>";
  }
  function paintDue() {
    var box = $("#h-due"); if (!box) return;
    if (!DUE || !TREE) { box.hidden = true; return; }
    box.hidden = false;
    var wasOpen = {}; $$("#h-due details").forEach(function (d) { wasOpen[d.dataset.g] = d.open; });
    function grp(key, title, list, isNow) {
      var open = key in wasOpen ? wasOpen[key] : isNow;
      return '<details data-g="' + key + '"' + (open ? " open" : "") + '><summary><span class="g-nrow"><b class="g-duehead">' + title + " (" + list.length + ")</b>" +
        (list.length ? '<button class="g-btn g-btn-soft g-btn-xs" data-dueall="' + key + '">Chọn hết</button>' : "") + "</span></summary>" +
        (list.length ? list.map(function (x) { return dueRow(x, isNow); }).join("") : '<div class="g-sub g-duenone">' + (isNow ? "Không có Block nào đến hạn 🎉" : "Không có") + "</div>") + "</details>";
    }
    box.innerHTML = grp("now", "⏳ Đến hạn ôn", DUE.now, true) + grp("soon", "🗓 Sắp đến hạn (7 ngày)", DUE.soon, false);
  }
  $("#h-due").addEventListener("change", function (e) {
    var c = e.target.closest("[data-due]"); if (!c) return;
    picked = picked.filter(function (p) { return !(p.table === "blocks" && p.id === c.dataset.id); });
    if (c.checked) picked.push({ table: "blocks", id: c.dataset.id, title: c.dataset.title });
    paintTree(); hostSetScope();
  });
  $("#h-due").addEventListener("click", function (e) {
    var b = e.target.closest("[data-dueall]");
    if (b) {
      e.preventDefault(); e.stopPropagation();
      var list = DUE[b.dataset.dueall] || [];
      list.forEach(function (x) { if (!picked.some(function (p) { return p.table === "blocks" && p.id === x.block_id; })) { var r = TREE.blocks.find(function (k) { return k.id === x.block_id; }); if (r) picked.push({ table: "blocks", id: r.id, title: r.name }); } });
      paintTree(); hostSetScope();
      return;
    }
    if (e.target.closest(".g-pick")) e.stopPropagation();
  });
  function paintPicked() {
    paintDue();
    $("#h-picked").innerHTML = picked.length ? picked.map(function (p) { return '<span class="g-chip g-chip-path">' + esc(pathOf(p)) + "</span>"; }).join("") : '<span class="g-sub">Chưa chọn chủ đề — tích chọn ở cột 📚 Chủ đề bên trái.</span>';
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
    scopeTimer = setTimeout(async function () { await ensurePool(G.st.scope); if (G.st.phase === "lobby") paintPoolInfo(); if (wantsGap(G.st.qtype)) aiGaps(); }, 400);
  }
  function scopeKey(scope) { return JSON.stringify((scope || []).map(function (p) { return p.table + ":" + p.id; }).sort()) + "|" + levelsOf().join(",") + "|" + tgt(); }
  /* 🎚 lọc cấp độ từ (cột words.level: A1…C2, "-" = chưa gắn) — rỗng = tất cả (TJ 2026-10-01) */
  /* nhãn cấp độ CEFR cạnh từ đang hỏi (TJ 2026-10-02: "mỗi từ vựng phải để level A-C mấy để biết luôn");
     chưa gắn cấp độ thì không hiện. Nhãn nói về TỪ cần trả lời — không lộ đáp án. */
  function lvBadge(l) { l = lvKey(l); return l === "-" ? "" : '<span class="g-lv g-lv-' + l.charAt(0) + '" title="Cấp độ CEFR">' + l + "</span>"; }
  function lvKey(l) { l = String(l || "").trim().toUpperCase(); return /^[ABC][12]$/.test(l) ? l : "-"; }
  function paintLevels() {
    var on = levelsOf(), n = G.lvCount || {};
    $$("#l-levels [data-lv]").forEach(function (b) {
      var k = b.dataset.lv;
      b.classList.toggle("on", on.indexOf(k) >= 0);
      b.innerHTML = (k === "-" ? "Chưa gắn" : k) + (G.lvCount ? "<small>" + (n[k] || 0) + "</small>" : "");
    });
    $("#l-lvhint").textContent = on.length ? "" : "(không chọn = tất cả)";
  }
  $("#l-levels").addEventListener("click", function (e) {
    var b = e.target.closest("[data-lv]"); if (!b || !G.isHost || !G.st) return;
    var lv = levelsOf().slice(), i = lv.indexOf(b.dataset.lv);
    if (i >= 0) lv.splice(i, 1); else lv.push(b.dataset.lv);
    G.st.levels = lv; paintLevels(); hostSetScope();
  });
  function levelsOf() { return (G.st && G.st.levels) || []; }
  /* 🎯 đề thi: câu hỏi ở bảng test_items (Supabase), theo đề + Part */
  async function ensureTest(t) {
    t = t || {}; var parts = t.parts && t.parts.length ? t.parts : [+t.part];
    var k = "toeic:" + t.test + ":" + parts.join(",") + ":" + (t.from || "") + "-" + (t.to || "") + ":" + (t.tag || "") + ":" + (t.only ? t.only.join(",") : "");
    if (G.poolKey === k && (G.tItems || []).length) return;
    G.poolKey = k; decks = {};
    var cols = "id,num,part,stem,stem_vi,opts,answer,tag,explain,passage,answer_src,vocab", q0 = function (c) { return sb.from("test_items").select(c).eq("exam", "toeic").eq("test", String(t.test)).in("part", parts).order("num"); };
    var r = await q0(cols + ",i18n");
    if (r.error) r = await q0(cols);   /* bảng chưa có cột i18n (chưa chạy ALTER) -> vẫn chơi được, chỉ có lời giải tiếng Việt */
    if (G.poolKey !== k) return;
    G.tItems = (r.data || []).filter(function (x) {   /* đoạn câu + chủ điểm host chọn */
      return (!t.from || x.num >= t.from) && (!t.to || x.num <= t.to) && (!t.tag || x.tag === t.tag) && (!t.only || t.only.indexOf(x.num) >= 0);
    });
    G.pool = G.tItems.map(function (x) { return { wid: x.id, term: String(x.num), m: { vi: "-", en: "-", es: "-", zh: "-" } }; });   /* để các chỗ kiểm "kho có câu chưa" chạy đúng */
    G.gaps = []; G.sheets = []; G.dicts = [];
  }
  async function ensurePool(scope) {
    if (G.st && G.st.qtype === "toeic") {
      if (G.st.test && G.st.test.test) return ensureTest(G.st.test);
      G.st.qtype = (G.vSnap && G.vSnap.qtype) || "meaning";   /* QA v98 T5: host tải lại trang sau ván đề thi — phòng chỉ nhớ qtype "toeic", mất đề -> về dạng từ vựng */
    }
    var k = scopeKey(scope);
    if (G.poolKey === k) return;
    G.poolKey = k; decks = {};
    if (!scope || !scope.length) { G.pool = []; G.gaps = []; return; }
    await loadPool(scope);
  }
  /* ⏱ Tổng thời gian TỰ TÍNH (TJ 2026-10-01): số câu × giây mỗi câu, số câu = số từ trong chủ đề (sau lọc cấp độ;
     📄 Phiếu = tổng số chỗ trống). Kiểu Kahoot cộng thêm thời gian xem đáp án sau mỗi câu (REVEAL_MS) để kịp hỏi hết. */
  function autoCount() {
    var st = G.st || {};
    if (st.qtype === "toeic") return (G.tItems || []).length;
    if (st.qtype === "sheet") return (G.sheets || []).reduce(function (n, x) { return n + x.ans.length; }, 0);
    if (st.qtype === "dict") return Math.min((G.dicts || []).length, (G.pool || []).length);
    return (G.pool || []).length;
  }
  function autoSec() {
    var st = G.st || {}, n = autoCount(), qs = +st.qs || 15;
    if (st.qtype === "mix") {   /* Trộn: trung bình giây của các loại sẽ ra */
      var ts = TQ_TYPES.filter(function (t) { return t !== "gap" || (G.gaps || []).length >= 4; });
      qs = Math.round(ts.reduce(function (a, t) { return a + tqOf(st, t); }, 0) / ts.length);
    }
    if (CHUNK_Q[st.qtype]) {   /* dạng chunk có giây riêng (qLimit): ghép mảnh gấp đôi, nghe/lịch sự gấp rưỡi — QA 2026-10-03 */
      var ct = st.qtype === "chunkmix" ? CHUNK_TYPES.filter(function (t) { return chunkPool(t).length >= (t === "chunk" || t === "listen" ? 4 : 1); }) : [st.qtype];
      if (!ct.length) ct = ["listen"];
      var q0 = qs; qs = Math.round(ct.reduce(function (a, t) { return a + qLimit({ type: t }, q0); }, 0) / ct.length);
    }
    var per = qs + (st.mode === "kahoot" ? REVEAL_MS / 1000 : 0);
    return { n: n, qs: qs, per: per, sec: Math.max(30, Math.round(n * per)) };
  }
  function fmtSec(s) { var m = Math.floor(s / 60), r = s % 60; return ((m ? m + " phút " : "") + (r ? r + " giây" : m ? "" : "0 giây")).trim(); }
  function paintAutoTime() {
    if (!G.st || !$("#l-auto")) return;
    var race = !!G.st.race, on = G.st.auto !== false && !race, a = autoSec();
    $("#l-auto-wrap").hidden = race;   /* ⚡ Đua: tổng thời gian do host đặt cứng */
    var mix = G.st.qtype === "mix";
    $("#l-qs-wrap").hidden = !(G.st.mode === "kahoot" || on) || mix;   /* Tự do: giây/câu chỉ dùng để tính tổng */
    $("#l-tq-wrap").hidden = !(G.st.mode === "kahoot" || on) || !mix;
    if (mix) $$("#l-tq-wrap [data-tq]").forEach(function (i) { if (document.activeElement !== i) i.value = tqOf(G.st, i.dataset.tq); });
    $("#l-min").disabled = on;
    if (on) $("#l-min").value = Math.max(1, Math.ceil(a.sec / 60));
    $("#l-autohint").textContent = on ? (a.n ? "→ " + a.n + (G.st.qtype === "sheet" ? " chỗ trống" : CHUNK_Q[G.st.qtype] ? " câu" : " từ") + " × " + a.qs + " giây" + (G.st.mode === "kahoot" ? " (+" + REVEAL_MS / 1000 + " giây xem đáp án)" : "") + " = " + fmtSec(a.sec) : "→ chọn chủ đề trước") : "";
  }
  function paintPoolInfo() {
    paintLevels(); paintAutoTime(); paintQtypes();
    if (G.st && G.st.scope && G.st.scope.length && chunkMode()) {
      $("#l-pool").textContent = "🕵️ " + G.pool.length + " câu (4 ngôn ngữ) · 🔀 ghép mảnh " + chunkPool("order").length + " · 🧩 chunk " + chunkPool("chunk").length + " · 🎧 nghe " + chunkPool("listen").length + " · 🎭 lịch sự " + chunkPool("polite").length;
      return;
    }
    $("#l-pool").textContent = G.st && G.st.scope && G.st.scope.length
      ? G.pool.length + " từ khác nhau · có nghĩa: " + poolCounts() + " · 📝 " + G.gaps.length + " câu điền chỗ trống (📚 thư viện " + (G.gapLib || []).length + " · 📖 bài đọc " + (G.gapsSrc || []).length + ") · 📄 " + (G.sheets || []).length + " phiếu Block · 🎧 " + (G.dicts || []).length + " câu dictation"
      : "Chưa chọn chủ đề.";
  }
  /* đủ dữ liệu để chơi dạng câu này chưa? (trả về lời nhắc cho host, "" = ổn) */
  function readyMsg(qt, lang) {
    if (qt === "toeic") return (G.tItems || []).length ? "" : "Đề này chưa có câu hỏi nào (chưa nạp vào bảng test_items).";
    if (!G.st || !G.st.scope || !G.st.scope.length) return "Chọn chủ đề (nhánh từ vựng) trước đã.";
    if (tgt() !== "en" && /^(gap|sheet|dict|write)$/.test(qt)) return "Dạng câu này chỉ có khi học tiếng Anh. Khi học " + TGT_NAME.vi[tgt()] + " hãy chọn 🔤 Nghĩa, 🔤 Từ→Nghĩa, ⌨️ Gõ từ hoặc 🔀 Trộn.";
    /* tiếng chung thiếu nghĩa (vd English = def_en: câu CIA không có) -> makeQ0 tự lấy cả kho, nghĩa hiện tiếng khác (myText).
       Chỉ chặn khi CẢ KHO có < 4 từ có nghĩa (TJ 2026-10-03: "Block 1 mà hong có từ vựng để chơi") */
    var nm = poolFor(lang).length, ng = G.gaps.length;
    if (nm < 4) nm = G.pool.length;
    if ((qt === "meaning" || qt === "recall" || qt === "en2m") && nm < 4) return "Chỉ có " + nm + " từ có nghĩa bằng tiếng đã chọn — cần ít nhất 4. (" + poolCounts() + ")";
    if (qt === "gap" && ng < 4) return "Phạm vi này chỉ có " + ng + " câu có chỗ trống trong bài đọc — cần ít nhất 4 (chọn Block/Page đã có bài đọc).";
    if (qt === "mix" && nm < 4) return "Chỉ có " + nm + " từ có nghĩa — cần ít nhất 4.";
    if (qt === "sheet" && !(G.sheets || []).length) return "Phạm vi này chưa có Block nào có bài đọc (cần ≥3 chỗ trống) — chọn Block/Page đã có bài đọc.";
    if (qt === "dict" && (G.dicts || []).length < 2) return "Phạm vi này chưa đủ câu trong bài đọc để làm Dictation.";
    if (qt === "write" && G.pool.length < 1) return "Chưa có từ nào.";
    if (/^(order|chunk|listen|polite|chunkmix)$/.test(qt)) {
      var ok = CHUNK_TYPES.filter(function (x) { return chunkPool(x).length >= (x === "chunk" || x === "listen" ? 4 : 1); });
      if (qt === "chunkmix" ? !ok.length : ok.indexOf(qt) < 0) return "Phạm vi này chưa đủ dữ liệu chunk cho dạng câu này (cần chủ đề 1000 câu 🕵️ CIA, đã có mảnh ghép/chunk/mức lịch sự).";
    }
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
    if (bats.length) blkRows = await inIds("blocks", "id,context_passage,context_passage_candidates", "batch_id", bats);
    var extra = by("blocks").filter(function (id) { return !blkRows.some(function (b) { return b.id === id; }); });
    if (extra.length) blkRows = blkRows.concat(await inIds("blocks", "id,context_passage,context_passage_candidates", "id", extra));
    var blks = ids(blkRows);
    var words = blks.length ? await inIds("words", "id,block_id,term,pos,level,meaning_vi,meaning_zh,meaning_es,def_en,quiz_vi,quiz_zh,quiz_es,audio,chunks", "block_id", blks) : [];
    /* số từ THẬT của từng Block (trước khi lọc cấp độ) — để xét "đã ôn đủ Block chưa" khi đẩy chu kỳ Tony Buzan */
    var bwn = {}, lvn = {};
    words.forEach(function (w) { bwn[w.block_id] = (bwn[w.block_id] || 0) + 1; var l = lvKey(w.level); lvn[l] = (lvn[l] || 0) + 1; });
    G.blockWordN = bwn; G.lvCount = lvn;
    var lvs = levelsOf();
    if (lvs.length) words = words.filter(function (w) { return lvs.indexOf(lvKey(w.level)) >= 0; });
    var seen = {}, pool = [], byTerm = {};
    words.forEach(function (w) {
      /* quiz_<x> = bản gọn (AI, 2026-10-03) — có thì dùng cho nghĩa hiển thị; gốc meaning_<x> giữ làm dự phòng */
      var k = norm(w.term), m = { vi: clean(w.quiz_vi || w.meaning_vi), en: clean(w.def_en), es: clean(w.quiz_es || w.meaning_es), zh: clean(w.quiz_zh || w.meaning_zh) };
      if (!k || seen[k] || !(m.vi || m.en || m.es || m.zh)) return;
      seen[k] = 1;
      regAudio(w);
      var it = { wid: w.id, term: clean(w.term), block: w.block_id, pos: norm(w.pos), lv: lvKey(w.level), m: m, sent: isSent(w.pos), ch: w.chunks || null };
      pool.push(it); byTerm[k] = it;
    });
    /* câu có chỗ trống: tách câu trong bài đọc giống Context.gapSentences (js/context.js) */
    var gaps = [], gseen = {};
    /* TẤT CẢ bài đọc của Block: bài chính + các bài phụ (context_passage_candidates — bài Claude/OpenAI/Gemini/dán,
       TJ 2026-10-01 "tận dụng hết các câu"); trùng câu thì bỏ */
    blkRows.forEach(function (b) {
      [b.context_passage].concat(b.context_passage_candidates || []).forEach(function (raw) {
        var marked = String(raw || ""), cut = marked.indexOf(META_SEP);
        if (cut >= 0) marked = marked.slice(0, cut);
        gapSentences(marked).forEach(function (g) {
          var w = byTerm[norm(g.term)], key = norm(g.text);
          if (!w || gseen[key]) return;
          gseen[key] = 1;
          gaps.push({ wid: w.wid, term: w.term, block: b.id, text: g.text });
        });
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
    var tg = tgt();
    if (tg !== "en") {   /* 🎯 học tiếng khác: từ = bản dịch meaning_<tg>, "nghĩa tiếng Anh" = chính từ tiếng Anh */
      var tp = [], tseen = {};
      pool.forEach(function (it) {
        if (!it.sent && /\s\/\s/.test(it.term)) return;                          /* "beef / lamb / pork": 1 dòng ghép 3 từ, không khớp 1-1 */
        var word = it.sent ? clean(it.m[tg]) : quizForm(it.m[tg]); if (!word || tseen[norm(word)]) return;
        if (tg === "zh" && !hasZh(word)) return;                                   /* ô nghĩa tiếng Trung mà chứa chữ Latin (dữ liệu lỗi) */
        if (norm(word) === norm(it.term)) return;                                  /* chưa dịch, còn nguyên tiếng Anh */
        if (!it.sent && (/[.?!。？！]\s*$/.test(it.term) || it.term.split(/\s+/).length > 6)) return;   /* câu mẫu ngữ pháp, không phải từ vựng */
        tseen[norm(word)] = 1;
        var m2 = Object.assign({}, it.m); m2.en = it.term; delete m2[tg];
        tp.push({ wid: it.wid, term: word, block: it.block, pos: it.pos, lv: "-", m: m2, en: it.term, sent: it.sent, ch: it.ch });
      });
      pool = tp; gaps = []; sheets = []; dicts = [];
    }
    await Promise.race([loadTraps(pool), new Promise(function (r) { setTimeout(r, 4000); })]);   /* 🪤 bẫy của các từ trong pool (tối đa chờ 4s) */
    if (G.poolKey !== scopeKey(scope)) return G.pool;   /* đã đổi chủ đề/ngôn ngữ trong lúc tải -> bỏ kết quả cũ */
    G.pool = pool; G.gaps = gaps; G.gapsSrc = gaps; G.gapLib = []; G.sheets = sheets; G.dicts = dicts;
    applyGap();
    if (G.gapsIn && G.gapsIn.key === G.poolKey) G.gaps = G.gapsIn.gaps;   /* người chơi: dùng câu ngắn host đã gửi */
    return pool;
  }

  /* 📝 CÂU ĐIỀN CHỖ TRỐNG NGẮN do AI viết (TJ 2026-09-30: câu tách từ bài đọc 500 từ dài quá; dùng OpenAI
     qua openai-proxy cho đỡ tốn). Mỗi từ 1 câu 8-15 từ đúng nghĩa, viết 1 lần rồi nhớ trên máy host
     (localStorage — CHỈ TJ làm host). Kiểu Tự do: host gửi danh sách câu cho người chơi (broadcast "gaps").
     AI lỗi/thiếu -> dùng câu bài đọc NGẮN (≤ 20 từ), không có nữa thì mới dùng câu bài đọc như cũ. */
  var LS_GAPAI = "tjwl_game_gapai_v3",   /* v3: TOEIC Part 5 + AI kiểm chỉ 1 đáp án hợp (bỏ câu v1/v2) */
      GAPAI_MAX = 60, GAP_SEND_MAX = 120;   /* GAPAI_MAX: tối đa số câu host nhờ AI soạn tại chỗ khi chưa có sẵn trong Supabase */
  function baseTerm(t) { return String(t || "").replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim(); }
  function toGap(sent, term) {
    sent = String(sent || "").trim(); var b = baseTerm(term);
    if (!b || sent.split(/\s+/).length > 20) return null;
    /* khớp TRỌN từ (không khớp giữa chữ khác, vd "act" trong "actually") */
    var m = new RegExp("(^|[^A-Za-z])(" + b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?![A-Za-z])", "i").exec(sent);
    if (!m) return null;
    var i = m.index + m[1].length;
    return sent.slice(0, i) + "{{GAP}}" + sent.slice(i + m[2].length);
  }
  async function openAI(sys, user, temperature) {   /* openai-proxy (key ở Supabase), trả JSON đã parse */
    var res = await fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/openai-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY, apikey: cfg.SUPABASE_ANON_KEY },
      body: JSON.stringify({ model: cfg.OPENAI_MODEL || "gpt-4o-mini", temperature: temperature, sys: sys, user: user, user_id: G.profile ? G.profile.id : null, block_id: "game-gap" })
    });
    var j = await res.json();
    if (!res.ok) throw new Error((j && (j.error && (j.error.message || j.error))) || res.status);
    return JSON.parse(j.choices[0].message.content);
  }
  async function callGapAI(part) {   /* viết câu: {wid: câu ĐẦY ĐỦ có chứa từ} */
    var o = await openAI("You write TOEIC Part 5 style sentences for an English vocabulary fill-in-the-blank quiz. Reply with JSON only.",
      "For EACH item write ONE sentence of 8-14 words in a TOEIC business/workplace context (office, meetings, sales, " +
      "travel, hiring, customers, finance, shipping...). Rules:\n" +
      "1. Use the term EXACTLY as given (same spelling and form, no plural/past/-ing change), once, with the given meaning.\n" +
      "2. Write the FULL sentence WITH the term in it (do NOT write blanks or underscores; we remove the term later).\n" +
      "3. The quiz hides the term and offers the OTHER terms in this list as wrong options, so add a strong context clue " +
      "(a detail that only goes with this term, e.g. 'by 5 p.m. Friday' for a deadline, 'both sides signed' for an agreement) so that NO other term in the list fits.\n" +
      "4. No definitions, no quotes, no real company names.\n" +
      'Return {"items":[{"id":"<id>","s":"<sentence>"}]}.\n' +
      JSON.stringify(part.map(function (w) { return { id: w.wid, term: baseTerm(w.term), pos: w.pos || "", meaning: w.m.vi || w.m.en || w.m.es || w.m.zh }; })), 0.7);
    var out = {};
    (o.items || []).forEach(function (x) { if (x && x.id) out[x.id] = x.s; });
    return out;
  }
  /* KIỂM câu: AI khác đóng vai thí sinh chọn từ cho chỗ trống trong cùng danh sách — chọn SAI / "AMBIGUOUS"
     (nhiều từ cùng hợp) thì bỏ câu đó (TJ 2026-09-30: "điền vào chỗ trống đang không đúng"). */
  async function checkGapAI(part, cand) {
    var ids = Object.keys(cand); if (!ids.length) return {};
    var o = await openAI("You are a strict TOEIC test taker. Reply with JSON only.",
      'For each sentence choose the ONE term from the list that best fills the blank. If two or more terms fit equally well, answer "AMBIGUOUS".\n' +
      "Terms: " + JSON.stringify(part.map(function (w) { return baseTerm(w.term); })) + "\n" +
      'Return {"items":[{"id":"<id>","a":"<term or AMBIGUOUS>"}]}.\n' +
      JSON.stringify(ids.map(function (id) { return { id: id, s: cand[id].replace("{{GAP}}", "_____") }; })), 0);
    var out = {};
    (o.items || []).forEach(function (x) { if (x && x.id) out[x.id] = norm(x.a); });
    return out;
  }
  function aiGaps() {
    if (!G.isHost || !G.pool.length || tgt() !== "en") return Promise.resolve();
    if (G.gapAiKey === G.poolKey && G.gapAiP) return G.gapAiP;
    var key = G.gapAiKey = G.poolKey;
    G.gapAiP = (async function () {
      var cache = readLS(LS_GAPAI) || {};
      /* câu soạn SẴN trong Supabase (bảng game_gap_sentences, tools/gen_gap_sentences.py): dùng trước, nhanh, mọi máy host như nhau */
      var dbN = 0, dbGaps = [], dbSeen = {}, byBase = {}, dbHas = {};
      G.pool.forEach(function (w) { byBase[norm(baseTerm(w.term))] = w; });
      var bases = Object.keys(byBase);
      for (var j = 0; j < bases.length; j += 60) {
        /* tra theo TỪ (không theo id): cùng 1 từ có nhiều nghĩa/ngữ cảnh khác nhau thì mỗi nghĩa 1 câu riêng */
        var terms = bases.slice(j, j + 60).map(function (b) { return '"' + baseTerm(byBase[b].term).split("\\").join("\\\\").split('"').join('\\"') + '"'; });
        var dr = await sb.from("game_gap_sentences").select("term,sentence").in("term", terms);
        if (dr.error) { console.warn("game_gap_sentences", dr.error.message); break; }
        (dr.data || []).forEach(function (r) {
          var w = byBase[norm(baseTerm(r.term))], t = w && toGap(r.sentence, w.term), k = t && norm(t);
          if (w) dbHas[w.wid] = 1;
          if (t && !dbSeen[k]) { dbSeen[k] = 1; dbGaps.push({ wid: w.wid, term: w.term, block: w.block, text: t, ai: 1 }); }
        });
      }
      dbN = dbGaps.length;
      if (G.poolKey !== key) return;
      var have = G.pool.filter(function (w) { return cache[w.wid]; }).length + dbN;
      var maxAi = dbN >= 4 ? 0 : GAPAI_MAX;   /* đủ câu soạn sẵn -> không bắt host chờ AI soạn thêm */
      var todo = shuffle(G.pool.filter(function (w) { return !cache[w.wid]; })).slice(0, Math.max(0, maxAi - have))
        .sort(function (a, b) { return a.block < b.block ? -1 : a.block > b.block ? 1 : 0; });   /* cùng Block chung 1 lần gọi: đáp án nhiễu lấy từ cùng Block */
      for (var i = 0; i < todo.length; i += 20) {
        var part = todo.slice(i, i + 20);
        try {
          var out = await callGapAI(part), cand = {};
          part.forEach(function (w) { var t = toGap(out[w.wid], w.term); if (t) cand[w.wid] = t; });
          var chk = await checkGapAI(part, cand).catch(function () { return null; });   /* kiểm lỗi -> giữ câu (vẫn hơn câu 500 từ) */
          part.forEach(function (w) { if (cand[w.wid] && (!chk || chk[w.wid] === norm(baseTerm(w.term)))) cache[w.wid] = cand[w.wid]; });
          writeLS(LS_GAPAI, cache);
          saveToLib(part.filter(function (w) { return cand[w.wid] && cache[w.wid] === cand[w.wid]; }).map(function (w) { return { w: w, sent: out[w.wid], checked: !!chk }; }));
        } catch (e) { console.warn("câu điền chỗ trống AI lỗi", e); break; }
        if (G.poolKey !== key) return;
      }
      if (G.poolKey !== key) return;
      var ai = dbGaps.slice(), old = [];
      G.pool.forEach(function (w) {
        var t = cache[w.wid]; if (!t || dbSeen[norm(t)]) return;
        dbSeen[norm(t)] = 1; ai.push({ wid: w.wid, term: w.term, block: w.block, text: t, ai: 1 });
        if (!dbHas[w.wid]) old.push({ w: w, sent: t.replace("{{GAP}}", w.term), checked: true });   /* câu AI cũ chỉ nằm trên máy host -> đẩy lên thư viện */
      });
      saveToLib(old);
      G.gapLib = ai;
      applyGap();
      if (G.st && G.st.phase === "lobby") paintPoolInfo();
    })();
    return G.gapAiP;
  }
  function wantsGap(qt) { return qt === "gap" || qt === "mix"; }
  /* Nguồn câu điền chỗ trống (TJ 2026-10-01): lib = thư viện câu ngắn (game_gap_sentences + AI soạn tại chỗ),
     read = câu trong MỌI bài đọc, both = trộn. Thư viện thiếu (< 4 câu) -> tạm dùng câu bài đọc <= 20 từ. */
  function applyGap() {
    if (!G.isHost) return;   /* người chơi dùng câu host gửi (broadcast "gaps") */
    var src = (G.st && G.st.gapsrc) || "lib", lib = G.gapLib || [], rd = G.gapsSrc || [];
    if (src === "read") G.gaps = rd;
    else if (src === "both") { var seen = {}; G.gaps = shuffle(lib.concat(rd)).filter(function (g) { var k = norm(g.text); return seen[k] ? false : (seen[k] = 1); }); }
    else G.gaps = lib.length >= 4 ? lib : rd.filter(function (g) { return g.text.split(/\s+/).length <= 20; });
  }
  /* câu AI soạn tại chỗ -> GHI LẠI vào thư viện chung (game_gap_sentences, 1 câu/word_id; đã có thì giữ câu cũ) */
  function saveToLib(items) {
    var rows = (items || []).filter(function (x) { return x.sent && x.w && x.w.wid; }).map(function (x) {
      return { word_id: x.w.wid, block_id: x.w.block, term: baseTerm(x.w.term), sentence: x.sent, checked: !!x.checked, model: "gpt-4o-mini (game host)" };
    });
    if (!rows.length) return;
    sb.from("game_gap_sentences").upsert(rows, { onConflict: "word_id", ignoreDuplicates: true }).then(function (r) { if (r.error) console.warn("lưu thư viện câu", r.error.message); });
  }
  function sendGaps() { if (G.isHost && G.ch) G.ch.send({ type: "broadcast", event: "gaps", payload: { key: G.poolKey, gaps: G.gaps.slice(0, GAP_SEND_MAX) } }); }
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
  function poolFor(lang) { if (lang === tgt() && lang !== "en") lang = "en"; return G.pool.filter(function (x) { return x.m[lang]; }); }
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
  /* 🪤 ĐÁP ÁN BẪY (TJ duyệt 2026-10-05): bảng word_traps (status=approved) — mỗi từ có vài đáp án sai "dễ nhầm" do AI soạn + TJ duyệt:
     look 🔤 giống mặt chữ · family 👪 cùng họ từ · syn 🔀 gần nghĩa · false ⚠️ bạn giả. Dùng tối đa 2 bẫy / câu, còn lại lấy như cũ;
     điền chỗ trống chỉ dùng look/family (syn/false có thể vừa câu). Chưa có bảng / chưa duyệt = giữ cách cũ. q.traps = {norm(đáp án): {k, why}} chỉ lộ lúc xem lại. */
  var TRAPS = null, TRAP_KINDS = { meaning: ["look", "family", "syn", "false"], en2m: ["look", "family", "syn", "false"], gap: ["look", "family"] }, lastTraps = null;
  var TRAP_LAB = {
    vi: { look: "🔤 Giống mặt chữ", family: "👪 Cùng họ từ", syn: "🔀 Gần nghĩa", false: "⚠️ Bạn giả" },
    en: { look: "🔤 Looks alike", family: "👪 Same word family", syn: "🔀 Close meaning", false: "⚠️ False friend" },
    zh: { look: "🔤 字形相似", family: "👪 同词族", syn: "🔀 意思相近", false: "⚠️ 假朋友" },
    es: { look: "🔤 Se parece", family: "👪 Misma familia", syn: "🔀 Significado cercano", false: "⚠️ Falso amigo" } };
  var TRAP_HIT = { vi: "Bạn dính bẫy", en: "You fell for a trap", zh: "你中了陷阱", es: "Caíste en la trampa" };
  var trapDone = {};
  /* tải bẫy CHỈ cho các từ trong pool (đã có ~15.000 bẫy duyệt -> không tải hết): 80 từ/lượt, 5 lượt song song */
  async function loadTraps(pool) {
    try {
      if (!TRAPS) TRAPS = {};
      var terms = []; (pool || []).forEach(function (w) { var k = norm(w.term); if (k && !trapDone[k] && k.length < 60) { trapDone[k] = 1; terms.push(k); } });
      var chunks = []; for (var i = 0; i < terms.length; i += 80) chunks.push(terms.slice(i, i + 80));
      var next = 0;
      var work = async function () {
        while (next < chunks.length) {
          var c = chunks[next++];
          var r = await sb.from("word_traps").select("word_term,kind,trap_term,trap_en,trap_vi,trap_zh,trap_es,why").eq("status", "approved").in("word_term", c);
          if (r.error) { next = chunks.length; return; }   /* chưa có bảng: dùng đáp án nhiễu cũ */
          (r.data || []).forEach(function (x) { (TRAPS[x.word_term] = TRAPS[x.word_term] || []).push(x); });
        }
      };
      await Promise.all([work(), work(), work(), work(), work()]);
    } catch (e) { /* bỏ qua */ }
  }
  function distractors(w, p, mode) {
    /* không lấy đáp án nhiễu TRÙNG NGHĨA với đáp án đúng ở bất kỳ tiếng nào (lucky/fortunate cùng "may mắn",
       court/course cùng "球场") — câu sẽ có 2 đáp án đúng (chuyên gia ngôn ngữ 2026-10-03) */
    var sameMean = function (x) { return ["vi", "en", "es", "zh"].some(function (l) { return x.m && w.m && x.m[l] && w.m[l] && norm(quizForm(x.m[l])) === norm(quizForm(w.m[l])); }); };
    var ok = function (x) { return norm(x.term) !== norm(w.term) && !sameMean(x); };
    var sameBlock = shuffle(p.filter(function (x) { return ok(x) && x.block === w.block; }));
    var samePos = shuffle(p.filter(function (x) { return ok(x) && x.block !== w.block && w.pos && x.pos === w.pos; }));
    var rest = shuffle(p.filter(function (x) { return ok(x) && x.block !== w.block && !(w.pos && x.pos === w.pos); }));
    var picks = [], used = {};
    var usedM = {};
    lastTraps = null;
    var tl = TRAPS && mode && TRAP_KINDS[mode] ? (TRAPS[norm(w.term)] || []).filter(function (x) { return TRAP_KINDS[mode].indexOf(x.kind) >= 0 && norm(x.trap_term) !== norm(w.term); }) : [];
    if (tl.length) {
      lastTraps = {};
      shuffle(tl).slice(0, 2).forEach(function (x) {
        var k = norm(x.trap_term); if (used[k]) return;
        used[k] = 1; picks.push(x.trap_term); lastTraps[k] = { k: x.kind, why: x.why || "", m: { en: x.trap_en, vi: x.trap_vi, zh: x.trap_zh, es: x.trap_es } };
      });
    }
    sameBlock.concat(samePos, rest).forEach(function (x) {
      if (picks.length >= 3 || used[norm(x.term)]) return;
      var mk = ["vi", "en", "es", "zh"].map(function (l) { return x.m && x.m[l] ? l + ":" + norm(quizForm(x.m[l])) : ""; }).filter(Boolean);
      if (mk.some(function (k) { return usedM[k]; })) return;   /* 2 đáp án nhiễu cũng không trùng nghĩa nhau */
      used[norm(x.term)] = 1; mk.forEach(function (k) { usedM[k] = 1; }); picks.push(x.term);
    });
    return shuffle([w.term].concat(picks));
  }
  /* thời gian mỗi câu (giây) theo dạng: phiếu = giây/câu × số chỗ trống; đặt câu ≥60; dictation ≥30 */
  /* ⏱ giây RIÊNG từng loại khi Trộn (TJ 2026-10-02: "phần gõ nhanh quá không gõ kịp, cho chọn time cho từng loại").
     Chưa chỉnh: trắc nghiệm = giây mỗi câu; Gõ từ = gấp đôi (ít nhất 20 giây). */
  var TQ_TYPES = ["meaning", "en2m", "gap", "recall"];
  function tqDefault(type, qs) { return type === "recall" ? Math.max(20, qs * 2) : qs; }
  function tqOf(st, type) { var qs = +st.qs || 15, v = st.tq && +st.tq[type]; return v > 0 ? v : tqDefault(type, qs); }
  function qLimit(q, qs) {
    if (q.type === "order") return Math.max(25, qs * 2);   /* ghép câu cần thời gian */
    if (q.type === "polite" || q.type === "listen") return Math.max(15, Math.round(qs * 1.5));
    if (G.st && G.st.qtype === "mix" && TQ_TYPES.indexOf(q.type) >= 0) return tqOf(G.st, q.type);
    if (q.type === "sheet") return Math.min(600, Math.max(60, qs * q.n));
    if (q.type === "write") return Math.max(60, qs);
    if (q.type === "dict") return Math.max(30, qs);
    return qs;
  }
  /* câu hỏi mang theo link FILE ÂM THANH của từ/câu đang hỏi (Kahoot: máy người chơi không tải kho từ) */
  function makeQ(qtype, lang, langs) {
    var q = makeQ0(qtype, lang, langs), aud = {}, n = 0;
    [q.ans, q.word, q.full].forEach(function (t) {
      if (typeof t !== "string") return;
      [t.trim(), baseTerm(t)].forEach(function (x) { var k = tgt() + "|" + x; if (G.audioMap[k]) { aud[k] = G.audioMap[k]; n++; } });
    });
    if (n) q.aud = aud;
    return q;
  }
  /* ---------- 🕵️ GAME NHỚ CHUNK (1000 câu, TJ 2026-10-03) — words.chunks = {tiles:{en,es,zh:[mảnh]}, key:{en,es,zh}, pol:{l:{casual,neutral,formal}}, level, ctx}
     🔀 order: ghép mảnh thành câu · 🧩 chunk: điền chunk chính còn thiếu · 🎧 listen: nghe câu -> chọn nghĩa · 🎭 polite: chọn câu đúng mức lịch sự */
  var CHUNK_TYPES = ["order", "chunk", "listen", "polite"];
  function tilesFor(it) {
    var t = tgt(), c = it.ch || {}, tl = c.tiles && c.tiles[t];
    if (tl && tl.length >= 2) return tl.slice();
    if (!it.sent) return null;   /* tiếng Việt (không có mảnh AI): chia câu theo dấu phẩy + từng 2-3 chữ */
    var ws = String(it.term).split(/\s+/); if (ws.length < 3) return null;
    var out = [], step = ws.length > 9 ? 3 : 2;
    for (var i = 0; i < ws.length; i += step) out.push(ws.slice(i, i + step).join(" "));
    return out.length >= 2 ? out : null;
  }
  function keyFor(it) { var k = it.ch && it.ch.key && it.ch.key[tgt()]; return k && String(it.term).indexOf(k) >= 0 && k !== it.term ? k : null; }
  /* 🎭 2 mức (TJ 2026-10-03 chọn gộp): 👫 thân mật / 🎩 lịch sự — bỏ "trung tính" (ranh giới mờ, chấm oan); dữ liệu cũ còn neutral thì bỏ qua */
  function polFor(it) { var p = it.ch && it.ch.pol && it.ch.pol[tgt()]; return p && p.casual && p.formal && norm(p.casual) !== norm(p.formal) ? p : null; }
  function chunkPool(type) {
    return G.pool.filter(function (it) {
      if (type === "order") return !!tilesFor(it);
      if (type === "chunk") return !!keyFor(it);
      if (type === "polite") return !!polFor(it);
      return it.sent;   /* listen */
    });
  }
  function makeChunkQ(t, lang) {
    var p = chunkPool(t); if (!p.length) return null;
    var w = draw("c-" + t + tgt(), p), q;
    if (t === "order") {
      var tl = tilesFor(w), sh = shuffle(tl.slice()), tries = 0;
      while (sh.join("|") === tl.join("|") && tries++ < 5) sh = shuffle(tl.slice());
      q = { type: "order", wid: w.wid, ans: w.term, tiles: sh, sep: tgt() === "zh" ? "" : " ", texts: w.m };
    } else if (t === "chunk") {
      var key = keyFor(w), others = shuffle(p.filter(function (x) { return x.wid !== w.wid; }).map(keyFor).filter(function (k) { return k && norm(k) !== norm(key); }));
      var opts = [key]; others.forEach(function (k) { if (opts.length < 4 && !opts.some(function (o) { return norm(o) === norm(k); })) opts.push(k); });
      q = { type: "chunk", wid: w.wid, ans: key, full: w.term, sent: String(w.term).replace(key, "{{GAP}}"), texts: w.m, opts: shuffle(opts) };
    } else if (t === "polite") {
      var pol = polFor(w), reg = Math.random() < 0.5 ? "casual" : "formal", opts = [pol.casual, pol.formal];
      /* đáp án thứ 3: câu CÙNG mức nhưng KHÁC nghĩa (của câu khác) -> phải để ý cả nghĩa lẫn giọng */
      var oth = shuffle(p.filter(function (x) { return x.wid !== w.wid; }))[0], o3 = oth && polFor(oth) && polFor(oth)[reg];
      if (o3 && opts.every(function (o) { return norm(o) !== norm(o3); })) opts.push(o3);
      q = { type: "polite", wid: w.wid, ans: pol[reg], reg: reg, ctx: (w.ch && w.ch.ctx) || "", texts: w.m, opts: shuffle(opts) };
    } else {
      var lp = poolFor(lang).filter(function (x) { return x.sent; }); if (lp.length < 4) lp = p;
      q = { type: "listen", wid: w.wid, word: w.term, ans: w.term, say: w.term, texts: w.m, opts: distractors(w, lp), optTexts: {} };
      q.opts.forEach(function (o) { var x = lp.find(function (y) { return norm(y.term) === norm(o); }) || G.pool.find(function (y) { return norm(y.term) === norm(o); }); q.optTexts[o] = x ? x.m : {}; });
    }
    return q;
  }
  function makeQ0(qtype, lang, langs) {
    var t = qtype;
    if (t === "toeic") {   /* 🎯 đề thi: hỏi LẦN LƯỢT theo số câu (101, 102…) như làm đề thật; hết thì quay lại đầu */
      var L = G.tItems || []; if (G.tMatch !== (G.st && G.st.matchId)) tPosLoad();
      var i0 = G.tIdx || 0, frq = G.st && G.st.mode === "free";   /* Tự do: lưu vị trí ĐẦU câu đang làm (F5 -> làm lại đúng câu chưa nộp); Kahoot host: câu đang chiếu đã nằm trong st.q -> lưu vị trí SAU */
      var g0 = tGroupAt(L, G.tIdx || 0);
      if (g0) {   /* 🎧 Part 3–4: 3 câu của 1 hội thoại hiện CÙNG LÚC như đề thật (TJ 2026-10-04) */
        G.tIdx += g0.length; tPosSave(frq ? i0 : null);
        var nx = tGroupAt(L, G.tIdx) || [];
        return { type: "toeic", wid: null, num: g0[0].num, sent: "", passage: g0[0].passage || "", opts: [], ans: "", subs: g0.map(tSub), gEnd: tCueEnd(g0[g0.length - 1]),
                 nxt: nx.map(function (x) { return { num: x.num, sent: x.stem || "", opts: (x.opts || []).slice() }; }),
                 test: G.st && G.st.test ? G.st.test.test : null, part: g0[0].part, asrc: g0[0].answer_src || "" };
      }
      var it = L[(G.tIdx++) % Math.max(1, L.length)] || {}; tPosSave(frq ? i0 : null);
      var a0 = String(it.answer || "").trim().toUpperCase(), ai = a0 ? "ABCD".indexOf(a0) : -1;   /* QA v109 LC1: "ABCD".indexOf("") = 0 -> câu chưa có đáp án bị coi là (A) */
      return { type: "toeic", wid: null, num: it.num, sent: tStemOf(it), passage: it.passage || "", opts: (it.opts || []).slice(), ans: ai >= 0 ? (it.opts || [])[ai] : "", tag: it.tag || "", expl: it.explain || "", vi: it.stem_vi || "", i18n: it.i18n || null, vocab: it.vocab || null, test: G.st && G.st.test ? G.st.test.test : null, part: it.part || (G.st && G.st.test ? G.st.test.part : null), asrc: it.answer_src || "", pend: ai < 0 };   /* pend = câu CHƯA có đáp án (vd Listening chờ đáp án): vẫn chọn được, cuối ván ra phiếu cả phòng + 🔑 nhập đáp án */
    }
    if (t === "chunkmix") t = shuffle(CHUNK_TYPES.filter(function (x) { return chunkPool(x).length >= (x === "chunk" || x === "listen" ? 4 : 1); }))[0] || "listen";
    if (CHUNK_TYPES.indexOf(t) >= 0) { var cq = makeChunkQ(t, lang); if (cq) return cq; t = "meaning"; }
    if (t === "sheet") {
      var sh = draw("sheet", G.sheets);
      return { type: "sheet", block: sh.block, text: sh.text, ans: sh.ans, wids: sh.wids, n: sh.ans.length, bank: shuffle(sh.ans.slice()) };
    }
    if (t === "dict") { var d = draw("dict", G.dicts), dw = G.pool.find(function (x) { return x.wid === d.wid; }) || {}; return { type: "dict", wid: d.wid, term: d.term, lv: dw.lv, say: d.sent, ans: d.sent, n: d.sent.split(/\s+/).length }; }
    if (t === "write") { var ww = draw("write" + lang, poolFor(lang).length ? poolFor(lang) : G.pool); return { type: "write", wid: ww.wid, term: ww.term, lv: ww.lv, ans: ww.term, texts: ww.m }; }
    if (t === "mix") t = shuffle(["meaning", "en2m", "recall"].concat(G.gaps.length >= 4 ? ["gap"] : []))[0];
    if (t === "gap" && G.gaps.length >= 4) {
      var g = draw("gap", G.gaps), gw = G.pool.find(function (x) { return x.wid === g.wid; }) || { term: g.term, block: g.block };
      var gopts = distractors(gw, G.pool, "gap");
      return { type: "gap", wid: g.wid, ans: g.term, lv: gw.lv, sent: g.text, len: baseTerm(g.term).length, texts: gw.m || {}, opts: gopts, traps: lastTraps };
    }
    var p = langs && langs.length ? poolForAll(langs) : poolFor(lang);
    if (p.length < 4) p = poolFor(lang);   /* thiếu từ có nghĩa ở MỌI tiếng -> theo tiếng phòng, ai thiếu thì hiện nghĩa tiếng Anh */
    if (p.length < 4) p = G.pool;
    var w = draw(t + lang + (langs || []).join(""), p);
    var q = { type: t === "recall" ? "recall" : t === "en2m" ? "en2m" : "meaning", wid: w.wid, ans: w.term, lv: w.lv, texts: w.m };
    if (q.type === "meaning") { q.opts = distractors(w, p, "meaning"); q.traps = lastTraps; }
    if (q.type === "en2m") {   /* hiện TỪ tiếng Anh, 4 lựa chọn = NGHĨA (mỗi người thấy theo tiếng mẹ đẻ của mình) */
      q.word = w.term; q.opts = distractors(w, p, "en2m"); q.traps = lastTraps; q.optTexts = {};
      q.opts.forEach(function (o) { var tr = q.traps && q.traps[norm(o)]; var x = tr ? { m: tr.m } : (p.find(function (y) { return norm(y.term) === norm(o); }) || G.pool.find(function (y) { return norm(y.term) === norm(o); })); q.optTexts[o] = x ? x.m : {}; });
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
    var d = e.data || {}; if (d.tab === G.tab || G.asleep || G.view === "screen") return;
    if (d.t === "claim" && G.room) {
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
    if (r.error && G.view !== "screen") {   /* lỗi MẠNG (không phải "không có phòng") -> thử lại, không đá về màn hình chính (QA 2026-10-04) */
      show("s-home"); $("#h-err").textContent = "⏳ Mất mạng — đang thử vào lại phòng " + code + "…";
      clearTimeout(G.joinRetry); G.joinRetry = setTimeout(function () { if (!G.room) joinRoom(code); }, 3000); return;
    }
    if (r.error || !r.data) {
      if (G.view === "screen") { show("s-screen"); $("#sc-status").textContent = T("no_room", { c: code }); return; }
      show("s-home"); $("#h-err").textContent = T("no_room", { c: code }); return;
    }
    G.room = r.data;
    /* ỨNG VIÊN host = máy đăng nhập WordLoop bằng hồ sơ TJ. Nhiều máy/cửa sổ cùng đăng nhập TJ (vd 1 trình duyệt đặt tên
       người chơi "Anti_TJ" nhưng từng mở link ?u= của TJ) -> CHỈ máy vào phòng SỚM NHẤT điều khiển, các máy kia là người chơi
       (xem onPresence). Máy host thoát -> máy TJ kế tiếp tự lên thay. */
    /* TJ 2026-10-04: "TJ là quyền cao nhất, Thảo chỉ gộp tiến trình" — máy của người khác (Thảo, Anti_TJ…) dù từng đăng nhập
       hồ sơ TJ cũng KHÔNG được làm host: chỉ người chơi tên "TJ" (trên máy hồ sơ TJ). Trước: 2 máy cùng hồ sơ TJ giành host
       -> màn hình cả phòng giật liên tục. */
    G.cand = G.view !== "screen" && isTJ() && G.profile.id === G.room.host_id && isTJPlayer();
    G.since = Date.now();
    /* KHÔNG tự nhận host ngay: chờ presence xem có tab/máy TJ nào vào trước không (onPresence -> setHost).
       Trước đây tab TJ mới tự làm host rồi gửi "phòng chờ" ngay -> cả phòng đang chơi bị giật về phòng chờ. */
    G.isHost = false;
    applyUI();
    $("#g-room-badge").hidden = true;
    if (G.cand) restoreHost();
    connect();
    if (G.view === "screen") { show("s-screen"); $("#sc-code").textContent = code; paintScreen(); }
    else if (!G.st || G.st.phase === "lobby") renderLobby();
  }
  /* ĐÃ TẮT khôi phục ván (TJ 2026-09-30: "tự khởi động chơi hoài" — host rớt mạng/tải lại trang thì ván đó bỏ,
     vào lại là phòng chờ). Dọn luôn các ván cũ từng lưu trong localStorage (tjwl_game_host_*) từ bản trước. */
  /* 💾 Host tải lại trang / mạng rớt hẳn rồi vào lại GIỮA VÁN -> chơi tiếp đúng ván đó (TJ 2026-10-02: "host bấm refresh
     là mất ván, người chơi phải đợi"). Host lưu ván trên MÁY MÌNH mỗi lần gửi trạng thái; vào lại trong 3 phút và ván
     chưa hết giờ thì khôi phục (điểm, câu đang hỏi, đồng hồ chạy tiếp theo giờ thật). Hết ván / về phòng chờ -> xoá. */
  var SNAP_MAX_AGE = 3 * 60000;
  function saveHost() {
    if (!G.isHost || !G.room || !G.st) return;
    var k = LS_HOST + G.room.code;
    if (G.st.phase !== "play") { writeLS(k, { at: Date.now(), tab: G.tab, st: G.st }); return; }   /* phòng chờ / kết quả cũng nhớ (bảng vẽ, quyền, phiếu trả lời) -> tải lại trang host về ĐÚNG chỗ (TJ 2026-10-04) */
    writeLS(k, { at: Date.now(), tab: G.tab, st: G.st, answers: G.answers || [], myAns: G.myAns || [], endAt: G.endAt, qUntil: G.qUntil, revealUntil: G.revealUntil || 0 });
  }
  function restoreHost() {   /* chỉ GIỮ ván còn mới của phòng này (G.snap); ván cũ / phòng khác thì dọn */
    G.snap = null;
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf(LS_HOST) !== 0) return;
        var v = readLS(k), fresh = v && v.st && (v.st.phase === "play" ? Date.now() - v.at < SNAP_MAX_AGE && Date.now() < (v.endAt || 0) + 30000 : Date.now() - v.at < 30 * 60000);
        if (k === LS_HOST + G.room.code && fresh) G.snap = v; else localStorage.removeItem(k);
      });
    } catch (e) {}
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
    G.ch.on("broadcast", { event: "board" }, function (m) { if (window.Board) Board.onMsg(m.payload); });   /* 🖤 bảng vẽ chung (js/board.js) */
    G.ch.on("broadcast", { event: "rtc" }, function (m) { if (window.Board && Board.onRtc) Board.onRtc(m.payload); });   /* 🖥 chia sẻ màn hình: báo hiệu WebRTC (js/board.js, TJ 2026-10-04) */
    G.ch.on("broadcast", { event: "gaps" }, function (m) {   /* câu điền chỗ trống ngắn từ host (kiểu Tự do) */
      if (G.isHost || !m.payload) return;
      G.gapsIn = m.payload;
      if (G.poolKey === m.payload.key && m.payload.gaps.length >= 4) G.gaps = m.payload.gaps;
    });
    G.ch.on("broadcast", { event: "alive" }, function (m) { var d = m.payload || {}; G.seen[d.tab || d.id] = { at: Date.now() }; });
    G.ch.on("broadcast", { event: "hello" }, function () { if (G.isHost && G.st) { push(); if (G.st.phase === "play" && G.st.mode === "free") sendGaps(); } });
    G.ch.on("broadcast", { event: "graded" }, function (m) {   /* Tự do + đặt câu: kết quả chấm riêng của mình */
      var d = m.payload; if (!G.me || d.pid !== G.me.id || !G.myQ || !G.waitGrade) return;
      G.waitGrade = false;
      G.myQ.res = {}; G.myQ.res[G.me.id] = Object.assign({}, d.r, { p: d.p, text: d.r.text || $("#p-typein").value });
      revealRich(G.myQ, {}, "#p-msg", "#p-res", "#p-vi");
      logQ(G.myQ, G.myQ.res[G.me.id].text, d.r.g + d.r.u >= 60);
      recordMyProgress(G.myQ.wid, d.r.g + d.r.u >= 60);
      showNext(6000);
    });
    clearInterval(G.aliveTimer);
    /* nhịp "còn ở đây" gửi bằng BROADCAST, KHÔNG track() lại presence: Supabase giới hạn số lần track mỗi máy —
       track 10s/lần + mỗi lần đổi cài đặt làm server báo "Client presence rate limit exceeded" rồi ĐÓNG kênh
       (host không nhận câu trả lời, không thấy ai trong phòng -> màn hình nhảy lung tung, TJ 2026-09-30) */
    G.aliveTimer = setInterval(function () {
      if (G.ch && G.me && G.view !== "screen") G.ch.send({ type: "broadcast", event: "alive", payload: { tab: G.tab, id: G.me.id } });
      onPresence();
    }, 10000);
    var ch = G.ch;
    ch.subscribe(async function (s) {
      if (s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT") {   /* kênh rớt (mạng / server đóng) -> tự nối lại, giữ nguyên vai + ván */
        if (ch === G.ch && G.room && !G.asleep) setTimeout(function () { if (ch === G.ch && G.room && !G.asleep) connect(); }, 1500);
        return;
      }
      if (s !== "SUBSCRIBED" || ch !== G.ch) return;
      if (window.Board && Board.resync) Board.resync();   /* nối lại kênh -> xin lại nét vẽ bị lỡ lúc mất mạng (gộp, không xoá) */
      if (G.view !== "screen") await track();
      if (G.isHost) {
        if (!G.st) G.st = { phase: "lobby", sound: true, auto: true, levels: [], gapsrc: "lib", scoring: G.room.scoring || "q", scope: G.room.scope || [], title: G.room.title || "", mode: G.room.mode, qtype: G.room.qtype || "meaning", lang: G.room.meaning_lang || "vi", force: false, minutes: +G.room.minutes, qs: G.room.q_seconds, teams: 0, teamOf: {}, scores: {}, roster: {} };
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
  /* 90s (không phải 25s): điện thoại chuyển sang app khác (HelloTalk) / tab bị ẩn thì trình duyệt cho JS "ngủ",
     nhịp 10s trễ tới 1 phút -> trước đây người chơi bị coi là đã thoát, không được tính vào ván, KHÔNG chọn được đáp án
     (TJ 2026-09-30). Ai đóng/chuyển trang thật thì pagehide untrack + Supabase tự báo rời phòng. */
  var PRESENCE_ALIVE_MS = 90000;
  G.seen = {};
  function onPresence() {
    if (!G.ch) return;
    if (!$("#s-users").hidden) renderUsers(true);   /* có người vào/ra -> danh sách 👥 cập nhật luôn */
    var ps = G.ch.presenceState(), list = [], cands = [], now = Date.now();
    Object.keys(ps).forEach(function (k) {   /* 1 key (= người chơi) có thể có NHIỀU tab -> xét hết, không chỉ tab cuối */
      var best = null;
      ps[k].forEach(function (p) {
        if (!p || !p.id) return;
        var sk = p.tab || p.id, sn = G.seen[sk];
        if (!sn || (sn.ts != null && sn.ts !== p.ts)) sn = G.seen[sk] = { ts: p.ts, at: now };   /* nhịp "alive" (broadcast) cũng làm mới .at */
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
      if (G.st.phase === "play") {   /* ai đang trong phòng mà chưa có trong ván (vào muộn / lúc bấm Bắt đầu bị lỡ) -> cho chơi luôn */
        list.forEach(function (p) { if (p.play !== false && !G.st.scores[p.id] && !(G.me && p.id === G.me.id && !hostPlays())) G.st.scores[p.id] = { s: 0, c: 0, w: 0, st: 0, best: 0 }; });   /* host làm MC thì không tự vào bảng */
        fillTeams();
      }
      if (G.st.phase === "lobby") G.st.roster = {};   /* phòng chờ: danh sách = đúng người đang ở trong phòng (ai thoát là mất) */
      list.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
      push();
    }
    if (G.st && G.st.phase === "lobby" && G.view !== "screen") paintLobbyPlayers();
  }

  function setHost(on) {
    G.isHost = on;
    $("#g-room-badge").hidden = !on;
    paintSide();
    track();
    if (!on) {   /* nhường quyền: thành người chơi, xin host thật gửi trạng thái */
      clearInterval(G.hostTimer); G.st = null;
      G.ch.send({ type: "broadcast", event: "hello", payload: {} });
      renderLobby();
      return;
    }
    var sn = G.snap; G.snap = null;
    if (sn && sn.st && sn.st.phase === "play" && Date.now() < (sn.endAt || 0) + 30000) return resumeHost(sn);
    if (sn && sn.st && sn.st.phase === "end") {   /* đang ở màn kết quả mà tải lại -> về lại đúng màn kết quả (bảng điểm, 📝 phiếu, bảng vẽ) */
      G.st = sn.st; G.endAt = 0; G.qUntil = 0; clearInterval(G.hostTimer); push(); renderEnd(G.st); return;
    }
    var pv = (sn && sn.st && sn.st.phase === "lobby" ? sn.st : null) || G.st || {};   /* phòng chờ: lấy lại cài đặt + bảng vẽ đã lưu */   /* trạng thái nhận từ host cũ -> lấy lại CÀI ĐẶT, còn ván đang dở thì bỏ (về phòng chờ) */
    G.st = { phase: "lobby", sound: pv.sound !== false, auto: pv.auto !== false, levels: pv.levels || [], gapsrc: pv.gapsrc || "lib", scoring: pv.scoring || G.room.scoring || "q", scope: pv.scope || G.room.scope || [], title: pv.title || G.room.title || "", mode: pv.mode || G.room.mode, qtype: pv.qtype || G.room.qtype || "meaning", lang: pv.lang || G.room.meaning_lang || "vi", force: !!pv.force, minutes: pv.minutes || +G.room.minutes, qs: pv.qs || G.room.q_seconds, teams: 0, teamOf: {}, scores: {}, roster: {} };
    ["race", "target", "teams", "teamOf", "hostplay", "hub", "bdoc", "tq"].forEach(function (k) { if (pv[k] !== undefined) G.st[k] = pv[k]; });   /* tải lại ở phòng chờ: giữ ⚡ Đua, tiếng đang học, đội, host chơi/MC (QA) */
    if (pv.board) { G.st.board = true; G.st.bperm = pv.bperm || {}; }   /* đổi máy giữ phòng (mạng chập chờn) -> bảng vẽ KHÔNG tự đóng (TJ 2026-10-04: "bảng tự trả về màn hình chính") */
    G.endAt = 0; G.qUntil = 0; clearInterval(G.hostTimer);
    G.online.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
    push(); initHostLobby();
  }

  async function resumeHost(sn) {
    G.st = sn.st; G.answers = sn.answers || []; G.myAns = sn.myAns || [];
    $("#l-hostplay").checked = G.st.hostplay !== false; track();   /* giữ "Host cũng chơi" như trước khi tải lại */
    G.endAt = sn.endAt; G.qUntil = sn.qUntil || 0; G.revealUntil = sn.revealUntil || 0;
    G.online.forEach(function (p) { G.st.roster[p.id] = { name: p.name, no: p.no, avatar: p.avatar }; });
    picked = (G.st.scope || []).map(function (p) { return { table: p.table, id: p.id, title: p.title || p.id }; });
    try { await ensurePool(G.st.scope); } catch (e) {}   /* cần kho từ để ra câu tiếp */
    if (G.st.mode === "kahoot" && G.st.q && !G.st.q.revealed && G.qUntil && Date.now() > G.qUntil) G.qUntil = Date.now() + 3000;   /* câu đang dở đã quá giờ lúc tải lại -> cho thêm 3 giây */
    clearInterval(G.hostTimer); G.hostTimer = setInterval(hostTick, 250);
    push();
    if (G.st.mode === "free" && !$("#s-play").hidden) freeNext();
  }

  /* ---------- phòng chờ ---------- */
  /* WordLoop (thẻ 🎮 Game, nút 🎮 trên Block card) gửi chủ đề mới khi game đã mở sẵn — đổi tại chỗ, không tải lại */
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== "tjwl-game-scope") return;
    var sc = (e.data.scope || []).filter(function (p) { return p && p.table && p.id; });
    if (!sc.length) return;
    if (!G.isHost || !G.st) { G.pendingScope = sc; return; }   /* chưa vào phòng xong -> initHostLobby áp sau */
    if (G.st.phase !== "lobby") { alert("Đang chơi dở — bấm Kết thúc / Ván mới rồi chọn lại chủ đề nhé."); return; }
    picked = sc.map(function (p) { return { table: p.table, id: p.id, title: p.title || p.id }; });
    if (TREE) paintTree(); else paintPicked();
    hostSetScope();
  });
  async function initHostLobby() {
    var sc = param("scope");
    if (!sc && G.pendingScope) { var ps = G.pendingScope[0]; sc = ps.table + ":" + ps.id; G.pendingTitle = ps.title; G.pendingScope = null; }
    if (sc) {   /* mở từ chuột phải trong WordLoop: ?scope=<table>:<id>&title=… -> thành chủ đề ván tới */
      var i = sc.indexOf(":");
      picked = [{ table: sc.slice(0, i), id: sc.slice(i + 1), title: param("title") || G.pendingTitle || sc }];
      history.replaceState(null, "", "?room=" + G.room.code);
      hostSetScope();
    } else {
      picked = (G.st.scope || []).map(function (p) { return { table: p.table, id: p.id, title: p.title || p.id }; });
      await ensurePool(G.st.scope);
      if (wantsGap(G.st.qtype)) aiGaps();
    }
    renderLobby();
    await loadTree();
  }
  function renderLobby() {
    if (G.inHist) return;   /* đang xem lại / lịch sử: đổi host, ván mới… không kéo màn hình đi (bấm ← để về) */
    $("#l-review").hidden = !G.log.length;
    show("s-lobby");
    $("#l-code").textContent = G.room.code;
    applyUI();
    $("#l-host").hidden = !G.isHost; $("#l-wait").hidden = G.isHost; $("#l-hostbtns").hidden = !G.isHost;
    $("#l-roomcard").hidden = !G.isHost;   /* người chơi chỉ chơi: không mã phòng, link mời, 📺, chủ đề */
    $("#l-users").hidden = !(G.isHost && isTJ());
    paintSoundBtn();
    paintSide();
    $("#l-mecard").hidden = G.isHost; $("#l-wait").hidden = true;
    if (!G.isHost && G.me) { $("#l-meav").innerHTML = avatar(G.me.avatar); $("#l-mename").innerHTML = label({ name: G.me.name, no: G.me.name_no }); }
    if (G.isHost) {
      var st = G.st || {};
      $("#l-mode").value = st.race ? "race" : (st.mode || G.room.mode); $("#l-qtype").value = st.qtype === "toeic" ? ((G.vSnap && G.vSnap.qtype) || "meaning") : (st.qtype || G.room.qtype || "meaning");
      $("#l-min").value = st.minutes || G.room.minutes; $("#l-qs").value = st.qs || G.room.q_seconds;
      $("#l-target").value = st.target || "en";
      $("#l-lang").value = roomLang(st); $("#l-teamn").value = String(st.teams || 0); $("#l-force").checked = !!st.force;
      $("#l-auto").checked = st.auto !== false; paintAutoTime();
      $("#l-sound").checked = st.sound !== false;
      $("#l-force-wrap").hidden = tgt() !== "en" || !($("#l-qtype").value === "meaning" || $("#l-qtype").value === "en2m" || $("#l-qtype").value === "mix");
      $("#l-teambtns").hidden = !(+$("#l-teamn").value);
      paintPoolInfo(); paintPicked();
      $("#l-scoring").value = st.scoring || "q";
      $("#l-gapsrc").value = st.gapsrc || "lib"; $("#l-gapsrc-wrap").hidden = !wantsGap($("#l-qtype").value);
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
  $("#l-tq-wrap").addEventListener("change", function (e) {
    var i = e.target.closest("[data-tq]"); if (!i || !G.isHost || !G.st) return;
    G.st.tq = Object.assign({}, G.st.tq || {}); G.st.tq[i.dataset.tq] = Math.max(3, Math.min(180, Math.round(+i.value) || tqDefault(i.dataset.tq, +G.st.qs || 15)));
    i.value = G.st.tq[i.dataset.tq];
    push(); paintAutoTime();
  });
  $("#l-target").addEventListener("change", async function () {
    if (!G.isHost || !G.st) return;
    G.st.target = this.value; paintForce(); if (this.value === "zh") loadPinyin();
    if (this.value !== "en" && /^(gap|sheet|dict|write)$/.test(G.st.qtype)) { G.st.qtype = "meaning"; $("#l-qtype").value = "meaning"; sb.from("game_rooms").update({ qtype: "meaning" }).eq("id", G.room.id).then(function () {}); }
    push(); applyUI();
    G.poolKey = null; $("#l-pool").textContent = "Đang tải từ vựng…";
    await ensurePool(G.st.scope); paintPoolInfo(); paintAutoTime && paintAutoTime();
  });
  ["#l-mode", "#l-qtype", "#l-min", "#l-qs", "#l-lang", "#l-teamn", "#l-hostplay", "#l-force", "#l-scoring", "#l-gapsrc", "#l-auto", "#l-sound"].forEach(function (s) {
    $(s).addEventListener("change", function () {
      if (!G.isHost || !G.st) return;   /* chưa kết nối xong (G.st chưa có) -> bỏ qua, initHostLobby sẽ vẽ lại */
      var st = G.st;
      st.gapsrc = $("#l-gapsrc").value; $("#l-gapsrc-wrap").hidden = !wantsGap($("#l-qtype").value);
      st.race = $("#l-mode").value === "race"; st.mode = st.race ? "free" : $("#l-mode").value; st.qtype = G.hub === "test" && st.qtype === "toeic" ? "toeic" : $("#l-qtype").value; st.scoring = $("#l-scoring").value; st.lang = $("#l-lang").value; st.force = $("#l-force").checked;
      st.auto = $("#l-auto").checked; st.sound = $("#l-sound").checked; st.hostplay = $("#l-hostplay").checked; if (!st.hostplay && st.teamOf && G.me) delete st.teamOf[G.me.id]; paintSoundBtn();
      st.minutes = Math.max(1, +$("#l-min").value || 5); st.qs = Math.max(3, +$("#l-qs").value || 15);
      st.timed = true;
      var tn = +$("#l-teamn").value;
      if (tn !== st.teams) { st.teams = tn; st.teamOf = {}; if (tn) autoTeams(); }
      paintAutoTime();
      $("#l-teambtns").hidden = !tn;
      $("#l-force-wrap").hidden = tgt() !== "en" || !(st.qtype === "meaning" || st.qtype === "en2m" || st.qtype === "mix");
      if (s === "#l-hostplay") track();
      if (s === "#l-qtype" && wantsGap(st.qtype)) aiGaps();
      if (s === "#l-gapsrc") { applyGap(); paintPoolInfo(); }
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
      s.q = { qn: q.qn, n: q.n, wids: q.wids, word: q.word, lv: q.lv, aud: q.aud, tiles: q.tiles, sep: q.sep, reg: q.reg, ctx: q.ctx, full: q.full, optTexts: q.optTexts, type: q.type, texts: q.texts, sent: q.sent, opts: q.opts, len: q.len, wid: q.wid, term: q.term, text: q.text, bank: q.bank, say: q.say, limit: q.limit, grading: !!q.grading, num: q.num, passage: q.passage, tag: rev ? q.tag : null, expl: rev ? q.expl : null, vi: rev ? q.vi : null, i18n: rev ? q.i18n : null, vocab: rev ? q.vocab : null, test: q.test, part: q.part, asrc: q.asrc, pend: q.pend, gEnd: q.gEnd, nxt: q.nxt,
              subs: q.subs ? q.subs.map(function (x) { return { num: x.num, part: x.part, test: x.test, sent: x.sent, opts: x.opts, ans: rev ? x.ans : null }; }) : null,
              res: rev ? q.res : null, traps: rev ? q.traps : null, revealed: rev, ans: rev ? q.ans : null, cnt: Object.keys(q.got).length,
              picks: rev ? Object.keys(q.got).reduce(function (o, pid) { o[pid] = q.got[pid].c; return o; }, {}) : null,
              oks: rev ? Object.keys(q.got).filter(function (pid) { return q.got[pid].ok; }) : null, fast: rev ? q.fast : null };
    }
    return s;
  }
  function push() { if (G.isHost && G.st && G.hub && G.st.phase === "lobby") G.st.hub = G.hub; G.lastPush = Date.now(); if (G.ch) G.ch.send({ type: "broadcast", event: "state", payload: pub() }); saveHost(); if (window.Board) Board.onState(G.st); }
  /* 🖤 bảng vẽ chung (js/board.js) — host mở/đóng cho cả phòng + cấp quyền từng người (st.board / st.bperm) */
  if (window.Board) Board.attach({
    ch: function () { return G.ch; }, me: function () { return G.me; }, st: function () { return G.st; },
    lang: function () { return uiLang(); },
    isHost: function () { return !!G.isHost; }, players: function () { return players(); },
    isHostId: function (id) { return !!(G.me && G.isHost && id === G.me.id) || !!(G.st && G.st.hid === id); },
    setBoard: function (v) { if (!G.isHost || !G.st) return; G.st.board = !!v; push(); },
    /* 📁 tài liệu trên bảng (board.js Lib): file ở bucket toeic/lib/…, bài đọc WordLoop từ bảng blocks */
    setDoc: function (d) { if (!G.isHost || !G.st) return; G.st.bdoc = d || null; push(); },
    lib: {
      list: async function (folder) {
        var r = await sb.storage.from("toeic").list("lib" + (folder ? "/" + folder : ""), { limit: 500, sortBy: { column: "name", order: "asc" } });
        if (r.error) return { error: r.error.message };
        return { items: (r.data || []).filter(function (x) { return x.name !== ".emptyFolderPlaceholder"; }).map(function (x) { return { name: x.name, dir: !x.id, size: x.metadata && x.metadata.size }; }) };
      },
      upload: async function (path, file) { var r = await sb.storage.from("toeic").upload("lib/" + path, file, { upsert: true, contentType: file.type || undefined }); return { error: r.error && r.error.message }; },
      remove: async function (path) { var r = await sb.storage.from("toeic").remove(["lib/" + path]); return { error: r.error ? r.error.message : (r.data && !r.data.length ? "Không xoá được (chưa có quyền xoá trong kho)" : null) }; },
      move: async function (a, b) { var r = await sb.storage.from("toeic").move("lib/" + a, "lib/" + b); return { error: r.error && r.error.message }; },
      folders: async function () {   /* mọi thư mục trong lib/ (sâu tối đa 3 cấp) */
        var out = [], level = [""];
        for (var d = 0; d < 3 && level.length; d++) {
          var next = [];
          await Promise.all(level.map(async function (p) {
            var r = await sb.storage.from("toeic").list("lib" + (p ? "/" + p : ""), { limit: 300 });
            (r.data || []).forEach(function (x) { if (!x.id && x.name && x.name[0] !== "." && x.name[0] !== "_") { var q = (p ? p + "/" : "") + x.name; out.push(q); next.push(q); } });
          }));
          level = next;
        }
        return out.sort();
      },
      mkdir: async function (path) { var r = await sb.storage.from("toeic").upload("lib/" + path + "/.emptyFolderPlaceholder", new Blob([""], { type: "application/octet-stream" }), { upsert: true, contentType: "application/octet-stream" }); return { error: r.error && r.error.message }; },
      url: function (path) { return cfg.SUPABASE_URL + "/storage/v1/object/public/toeic/lib/" + path.split("/").map(encodeURIComponent).join("/"); }
    },
    tree: async function () { if (!TREE) await loadTree(true); return TREE; },   /* cây Hub › Notebook › … › Block của game, dùng chung cho hộp chọn bài ở bảng */
    lookup: function (t, ctx) { return boardLookup(t, ctx); },
    say: function (text) { try { if (!soundOn()) return; sayIt._lang = "en"; sayIt(String(text || ""), true); } catch (e) {} },
    words: function (bid) { return boardWords(bid); },
    block: async function (id) { var r = await sb.from("blocks").select("id,name,context_passage,context_passage_candidates").eq("id", id).maybeSingle(); return r.data; },
    /* ✨ Tạo bài đọc mới cho Block ngay trên bảng (TJ 2026-10-04): dùng đúng Context.generateAI của WordLoop (Gemini qua gemini-proxy trước, lỗi thì OpenAI qua
       openai-proxy). LƯU NHƯ CŨ: bài mới nối vào CUỐI đúng nhóm nguồn trong context_passage_candidates (không giới hạn, không mất bài cũ) VÀ áp dụng làm
       context_passage — trừ Block đang có bài GỐC (bài học EA/Digital Marketing, bài báo...): chỉ lưu vào candidates, KHÔNG thay bài gốc. */
    generate: async function (bid, opts) {
      opts = opts || {};
      await ensureContext();
      var b = (await sb.from("blocks").select("id,name,context_passage,context_passage_candidates").eq("id", bid).maybeSingle()).data;
      if (!b) throw new Error("Không tìm thấy Block");
      var ws = await boardWords(bid); if (!ws.length) throw new Error("Block chưa có từ vựng");
      var cands = Array.isArray(b.context_passage_candidates) ? b.context_passage_candidates.slice() : [];
      var avoid = [b.context_passage].concat(cands).map(function (raw) { return raw ? Context.parseMeta(raw).title : ""; }).filter(function (t, i, a) { return t && a.indexOf(t) === i; });
      var raw = await Context.generateAI(ws, cfg, null, null, opts.topicHint || "", null, avoid);   /* quotaCtx null: host là admin, không tính hạn mức 3 Block/ngày */
      var prov = Context._lastProvider === "openai" ? "openai" : Context._lastProvider === "gemini" ? "gemini" : null;
      var groupOf = function (r) { var m = Context.parseMeta(r); return m.pasted ? "paste" : m.claude ? "claude" : m.provider === "openai" ? "openai" : m.provider === "gemini" ? "gemini" : "other"; };
      var add = function (list, r) { var g = { paste: [], claude: [], openai: [], gemini: [], other: [] }; list.forEach(function (x) { g[groupOf(x)].push(x); }); if (list.indexOf(r) < 0) g[groupOf(r)].push(r); return g.paste.concat(g.claude, g.openai, g.gemini, g.other); };
      if (!opts.keepCurrent && b.context_passage && String(b.context_passage).trim()) cands = add(cands, b.context_passage);   /* bài đang dùng chưa nằm trong candidates thì giữ lại, khỏi mất khi bị thay */
      cands = add(cands, raw);
      var patch = { context_passage_candidates: cands }; if (!opts.keepCurrent) patch.context_passage = raw;
      var r = await sb.from("blocks").update(patch).eq("id", bid); if (r.error) throw r.error;
      return { raw: raw, provider: prov, applied: !opts.keepCurrent };
    },
    blocks: async function (q) {
      var qq = sb.from("blocks").select("id,name,context_passage").not("context_passage", "is", null).neq("context_passage", "").order("updated_at", { ascending: false }).limit(25);
      if (q && q.trim()) { var v = q.trim().replace(/[%,()]/g, " "); qq = qq.or("name.ilike.%" + v + "%,context_passage.ilike.%" + v + "%"); }
      var r = await qq;
      return (r.data || []).map(function (b) { var raw = String(b.context_passage || ""), i = raw.indexOf("\n<<<TJWL_META>>>\n"), ti = ""; if (i >= 0) { try { ti = JSON.parse(raw.slice(i + 17)).title || ""; } catch (e) {} } return { id: b.id, name: b.name, title: ti, snip: (i >= 0 ? raw.slice(0, i) : raw).replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 90) + "…" }; });
    },
    togglePerm: function (pid) { if (!G.isHost || !G.st) return; var p = G.st.bperm = Object.assign({}, G.st.bperm || {}); if (p[pid]) delete p[pid]; else p[pid] = 1; push(); }
  });
  $("#l-start").addEventListener("click", async function () {
    if (!G.isHost) return;
    if (G.st && G.st.qtype === "toeic" && !G.tStarting) G.st.qtype = $("#l-qtype").value || "meaning";   /* ▶ của Hub từ vựng không được chạy đề thi còn sót */
    G.tStarting = false;
    if (G.st.scope && G.st.scope.length) await ensurePool(G.st.scope);
    if (wantsGap(G.st.qtype)) {   /* chờ AI soạn câu ngắn (tối đa 25s, quá thì dùng câu có sẵn) */
      $("#l-pool").textContent = "✍️ Đang soạn câu điền chỗ trống ngắn…";
      await Promise.race([aiGaps(), new Promise(function (r) { setTimeout(r, 25000); })]);
      paintPoolInfo();
    }
    var need = readyMsg(G.st.qtype, G.st.lang);
    if (need) { alert(need); return; }
    if (!players().length) { alert("Chưa có người chơi nào."); return; }
    fillTeams();
    G.st.phase = "play"; G.st.scores = {}; G.st.q = null; G.st.tsheet = null; G.st.exSubmitAt = null; G.tSheet = null; G.tKeyMsg = ""; G.answers = []; G.myAns = []; G.srsHtml = "";
    G.st.total = G.st.qtype === "toeic" ? (G.tItems || []).length : G.st.race ? 0 : autoCount();   /* ⚡ Đua đề thi cũng tự kết thúc khi cả phòng làm xong (QA) */
    G.st.hostplay = hostPlays();
    delete G.st.elapsed;   /* ván mới: tính lại thời gian chơi */   /* số câu của ván (= số từ; 📄 = số chỗ trống) để hiện "còn N câu"; ⚡ Đua = không giới hạn */
    players().forEach(function (p) { G.st.scores[p.id] = { s: 0, c: 0, w: 0, st: 0, best: 0 }; });
    if (G.st.auto !== false && !G.st.race) { var at = autoSec(); G.st.totalSec = at.sec; G.st.minutes = Math.max(1, Math.ceil(at.sec / 60)); } else G.st.totalSec = G.st.minutes * 60;
    G.endAt = Date.now() + G.st.totalSec * 1000;
    await sb.from("game_rooms").update({ status: "playing", started_at: new Date().toISOString(), mode: G.st.mode, qtype: G.st.qtype, meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs, team_mode: !!G.st.teams, teams: G.st.teams }).eq("id", G.room.id);
    /* mỗi lần bắt đầu = 1 VÁN riêng (lịch sử xem theo ván) */
    var mr = await sb.from("game_matches").insert({ target: tgt(), room_id: G.room.id, title: G.st.title, scope: G.st.scope, mode: G.st.mode, qtype: G.st.qtype, scoring: G.st.scoring || "q", meaning_lang: G.st.lang, minutes: G.st.minutes, q_seconds: G.st.qs, teams: G.st.teams || 0 }).select("id").single();
    G.st.matchId = mr.data ? mr.data.id : null;
    if (G.st.mode === "kahoot") hostNextQ(); else { G.qUntil = 0; sendGaps(); push(); }
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
    if (G.st.qtype === "toeic" && G.st.q && (G.tIdx || 0) >= (G.tItems || []).length) return hostEnd();   /* (đếm theo câu đã ra, nhóm Part 3–4 = 3 câu) */   /* QA v100 L2: hết đoạn câu đã chọn -> kết thúc, không quay vòng */
    var q = makeQ(G.st.qtype, G.st.lang, roomLangs());
    G.st.q = Object.assign(q, { qn: (G.st.q ? G.st.q.qn : 0) + 1, revealed: false, got: {}, fast: null, res: {} });
    G.st.q.limit = qLimit(G.st.q, G.st.qs);   /* vẫn dùng làm mốc điểm "theo tốc độ" */
    if (G.st.qtype === "toeic" && G.st.test && (G.st.test.parts || []).length > 1 && T_SEC[G.st.q.part]) G.st.q.limit = T_SEC[G.st.q.part];   /* nhiều Part: nhịp theo từng Part */
    if (G.st.q.subs && !(G.st.tplay && tCue(G.st.q))) G.st.q.limit = (T_SEC[G.st.q.part] || 30) * G.st.q.subs.length + 45;   /* nhóm không có audio: đủ giờ đọc 3 câu + hội thoại */
    var ac = G.st.qtype === "toeic" && G.st.tplay ? tCue(G.st.q) : null;
    if (ac) {   /* 🎧 audio DẪN NHỊP (TJ 2026-10-04: "phần nghe phải tự canh chạy"): giờ của câu = đoạn audio (câu đầu nhóm có cả hội thoại) + khoảng chờ như đề thật */
      if (G.st.q.qn === 1) G.hLastG = "";
      var gk = ac.g ? ac.g.join("-") : "", dur = ac.q[1] - ac.q[0] + (ac.g && G.hLastG !== gk ? ac.g[1] - ac.g[0] : 0);
      G.hLastG = gk;
      G.st.q.limit = Math.ceil(dur + (+(G.st.q.part || G.st.test.part) <= 2 ? 5 : tGraphic(G.st.q) ? 12 : 8) + 1);
      G.st.q.audLed = true;
    }
    G.qUntil = untimed(G.st) ? 0 : Date.now() + G.st.q.limit * 1000;
    push();
  }
  function hostTick() {
    if (!G.st || G.st.phase !== "play") { clearInterval(G.hostTimer); return; }   /* đã Kết thúc -> dừng hẳn, chờ TJ bấm Ván mới */
    var now = Date.now();
    if (now - G.lastPush > HEARTBEAT_MS) push();   /* nhịp "host còn sống" — người chơi quá HOST_LOST_MS không nghe thì báo mất kết nối */
    if (now >= G.endAt + (G.st.mode === "free" ? 1500 : 0)) {   /* Tự do: chờ 1.5s cho câu tự nộp lúc hết giờ tới nơi */
      if (G.st.mode === "kahoot" && G.st.q && !G.st.q.revealed) return hostReveal();   /* chấm nốt câu đang dở */
      if (G.st.mode !== "kahoot" || !G.revealUntil || now >= G.revealUntil) return hostEnd();
      return;
    }
    /* Tự do / Thi thật: CẢ PHÒNG đã làm hết số câu -> 4s sau tự Kết thúc (TJ 2026-10-04: làm xong 6/6 mà vẫn phải chờ 116 phút) */
    if (G.st.mode === "free" && +G.st.total) {
      var ps0 = players().filter(function (p) { return G.st.scores[p.id]; });
      var fin = ps0.length && ps0.every(function (p) { var x = G.st.scores[p.id]; return (x.c || 0) + (x.w || 0) + (x.m || 0) >= +G.st.total; });
      if (!fin) G.allDoneAt = 0; else if (!G.allDoneAt) G.allDoneAt = now; else if (now - G.allDoneAt > 4000) { G.allDoneAt = 0; return hostEnd(); }
    }
    if (G.st.mode !== "kahoot" || !G.st.q) return;
    if (!G.st.q.revealed) {
      if (G.st.q.grading) return;
      var n = players().filter(function (p) { return G.st.scores[p.id]; }).length, got = Object.keys(G.st.q.got).filter(function (pid) { var g = G.st.q.got[pid]; return !G.st.q.subs || ((g.c || []).filter(function (x) { return x != null; }).length >= G.st.q.subs.length); }).length;   /* nhóm 3 câu: chỉ tính người đã chọn đủ 3 (QA v132) */
      /* hết giờ câu (+0.8s để máy người chơi kịp tự nộp chữ đang gõ dở) hoặc cả phòng đã trả lời -> lộ đáp án */
      /* cả phòng đã chọn: câu chọn đáp án chờ thêm 2 giây sau lần chọn cuối (kịp đổi nếu lỡ bấm nhầm) */
      var allIn = !G.st.hostpace && !G.st.q.audLed && n && got >= n && (!isChoice(G.st.q) || now - (G.st.q.lastAnsAt || 0) >= 2000);
      if ((G.qUntil && now >= G.qUntil + 800) || allIn) hostReveal();
    }
    else if (now >= G.revealUntil) hostNextQ();   /* đã lộ đáp án đủ lâu -> tự sang câu; xem lại sau ván bằng 📖 */
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
    if (isChoice(q) && !q.scored) {   /* chấm theo lựa chọn CUỐI của mỗi người */
      q.scored = true;
      if (q.pend) { Object.keys(q.got).forEach(function (pid) { tSheetAdd(pid, q.num, q.got[pid].c); }); q.missDone = true; }
      else if (q.subs) {   /* nhóm 3 câu: chấm từng câu, ai không chọn câu nào thì câu đó sai */
        Object.keys(G.st.scores).forEach(function (pid) {
          var c = (q.got[pid] || {}).c || [], ms = (q.got[pid] || {}).ms || null;
          q.subs.forEach(function (sq, i) { var ok = c[i] != null && norm(c[i]) === norm(sq.ans); score(pid, ok, ms || q.limit * 1000, q.limit * 1000); G.answers.push({ pid: pid, wid: null, term: tKey(sq), ok: ok, ms: ms, c: c[i] }); });
        });
        q.missDone = true;
      }
      else Object.keys(q.got).forEach(function (pid) {
        var g = q.got[pid]; score(pid, g.ok, g.ms, q.limit * 1000);
        G.answers.push({ pid: pid, wid: q.wid, term: q.type === "toeic" ? tKey(q) : q.ans, ok: g.ok, ms: g.ms, c: g.c });
      });
    }
    /* ⏭ BỎ LỠ = SAI (TJ 2026-10-02): ai đang trong ván mà hết giờ chưa chọn -> tính 1 câu sai (phiếu: sai cả N chỗ trống),
       mất chuỗi, thời gian = trọn giờ của câu. Ghi cả game_answers để lịch sử / Fix lỗi sai đúng. */
    if (!q.missDone && q.type !== "write") {
      q.missDone = true;
      var limMs = (q.limit || G.st.qs || 15) * 1000;
      Object.keys(G.st.scores).forEach(function (pid) {
        if (q.got[pid]) return;
        if (q.type === "sheet") { award(pid, 0, false, 0, q.n || 1, limMs, limMs); (q.wids || []).forEach(function (wid, i) { G.answers.push({ pid: pid, wid: wid, term: q.ans[i], ok: false, ms: null }); }); }
        else { score(pid, false, limMs, limMs); G.answers.push({ pid: pid, wid: q.wid, term: q.type === "toeic" ? tKey(q) : q.term || q.ans, ok: false, ms: null }); }
      });
    }
    q.revealed = true; G.revealUntil = Date.now() + (q.type === "toeic" ? 900 : q.type === "write" || q.type === "sheet" ? REVEAL_MS * 3 : q.type === "dict" ? REVEAL_MS * 2 : REVEAL_MS); G.qUntil = 0;
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
    s.t = (s.t || 0) + Math.max(0, ms || 0); s.k = (s.k || 0) + 1;   /* tổng thời gian trả lời + số lượt -> thời gian TB / câu (thống kê) */
    if (ok) { s.st++; s.best = Math.max(s.best, s.st); } else s.st = 0;
    return p;
  }
  /* câu chọn 1 trong 4 ô (không gõ chữ / phiếu / dictation / đặt câu) — Kahoot cho ĐỔI đáp án khi còn giờ (TJ 2026-10-02) */
  function isChoice(q) { return !!q && (q.type === "toeic" || q.type === "meaning" || q.type === "en2m" || q.type === "gap" || q.type === "chunk" || q.type === "listen" || q.type === "polite"); }
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
      var g = errs == null ? (has ? 35 : 0) : Math.max(0, 50 - 12 * errs.length);   /* máy chấm ngữ pháp không trả lời: không cho điểm câu thiếu từ cần dùng (QA) */
      var u = a.use != null ? Math.max(0, Math.min(50, Math.round(+a.use || 0))) : (has ? 30 : 0);
      if (!has && a.use == null) u = 0;
      out[it.pid] = { g: g, u: u, fix: a.fix || "", note: a.note || "", errs: errs || [] };
    });
    return out;
  }
  function hostOnAnswer(a) {
    if (!G.st || G.st.phase !== "play") return;
    if (a.aid) { G.seenAid = G.seenAid || {}; if (G.seenAid[a.aid]) return; G.seenAid[a.aid] = 1; }   /* đáp án gửi bù sau khi mất kết nối */
    if (!G.st.scores[a.pid]) return;   /* vào muộn giữa ván -> chỉ xem, ván sau mới tính */
    if (a.pend) { tSheetAdd(a.pid, a.n, a.c); return; }
    if (a.batch) {   /* 📝 Thi thật: nộp cả phần Reading 1 lần */
      a.batch.forEach(function (x) { score(a.pid, !!x.ok, 0, 1); G.answers.push({ pid: a.pid, wid: null, term: x.tk, ok: !!x.ok, ms: null, c: x.c }); });
      push(); return;
    }   /* câu chưa có đáp án: chỉ ghi vào phiếu, không chấm */
    if (G.st.mode === "kahoot") {
      var q = G.st.q;
      if (!q || q.revealed || a.qn !== q.qn || (q.got[a.pid] && !isChoice(q))) return;   /* mỗi người 1 lần / câu (câu chọn đáp án: được đổi) */
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
        G.answers.push({ pid: a.pid, wid: q.wid, term: q.term, ok: acc.r >= 0.8, ms: a.ms, c: a.choice });
      } else if (q.type === "write") {
        q.got[a.pid] = { ok: null, c: a.choice, ms: a.ms };   /* chấm lúc hết giờ (gom cả phòng 1 lần) */
      } else if (isChoice(q)) {   /* câu chọn 4 đáp án: được ĐỔI khi còn giờ -> giữ lựa chọn MỚI NHẤT, chấm lúc lộ đáp án (hostReveal) */
        q.got[a.pid] = { ok: q.subs ? false : norm(a.choice) === norm(q.ans), c: a.choice, ms: a.ms };
        q.lastAnsAt = Date.now();
      } else {
        var ok = q.type === "recall" ? typedOk(a.choice, q.ans) : norm(a.choice) === norm(q.ans);
        q.got[a.pid] = { ok: ok, c: a.choice, ms: a.ms };
        score(a.pid, ok, a.ms, lim);
        G.answers.push({ pid: a.pid, wid: q.wid, term: q.ans, ok: ok, ms: a.ms, c: a.choice });
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
        G.answers.push({ pid: a.pid, wid: a.wid, term: a.tk || a.term, ok: !!a.ok, ms: a.ms, c: a.c });
      }
    }
    push();
  }
  async function hostEnd() {
    if (G.st.phase === "end") return;
    if (G.st.exam) {   /* 📝 Thi thật (QA v127 #1): báo cả phòng NỘP BÀI rồi chờ 3.5s nhận bài Reading trước khi chốt — trước đây kết thúc là mất bài chưa nộp */
      if (!G.st.exSubmitAt) { G.st.exSubmitAt = Date.now(); if (G.ex && !G.ex.done && hostPlays()) exSubmit(); push(); setTimeout(hostEnd, 3500); return; }
      if (Date.now() - G.st.exSubmitAt < 3300) return;
    }
    G.st.elapsed = elapsedMs(G.st);   /* chốt thời gian chơi thật trước khi đổi phase -> câu/phút ở màn kết quả đúng */
    clearInterval(G.hostTimer);
    G.st.phase = "end"; G.st.q = null; G.endAt = 0; G.qUntil = 0;
    if (G.tSheet) { G.st.tsheet = G.tSheet; writeLS("tjwl_game_tsheet_" + G.st.matchId, G.tSheet); }   /* phiếu trả lời câu chưa có đáp án -> cả phòng xem, host chấm */
    push();
    saveHost();   /* nhớ màn kết quả (trước: xoá -> tải lại trang là mất) */
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
          return { room_id: G.room.id, match_id: G.st.matchId, player_id: a.pid, word_id: a.wid, term: a.term, correct: a.ok, ms: a.ms || null,
                   target: tgt(), choice: a.c != null ? String(Array.isArray(a.c) ? a.c.join(" | ") : a.c).slice(0, 300) : null };
        }));
        if (ra.error) console.warn("game_answers", ra.error);
      }
      if (G.st.matchId) await sb.from("game_matches").update({ ended_at: new Date().toISOString() }).eq("id", G.st.matchId);
      await srsAfterMatch();
      await sb.from("game_rooms").update({ status: "lobby", ended_at: new Date().toISOString() }).eq("id", G.room.id);
    } catch (e) { console.warn("lưu kết quả lỗi", e); }
  }
  /* 🔁 Đẩy chu kỳ Tony Buzan sau ván (TJ 2026-10-01: "chơi game xong thì đẩy vào chu trình Tony Buzan nếu đúng hẹn").
     CÙNG luật với bài thi WordLoop (detail.js srsAdvanceIfDue + PASS_MARK 80): Block phải ĐANG trong chu kỳ (passed),
     chưa xong 6 lần, ĐÚNG HẠN (next_review_at, nới 1 tiếng). Thêm điều kiện riêng cho game: TJ đã trả lời ≥ 80% số từ
     của Block (đếm trên MỌI từ của Block, không theo lọc cấp độ) và đúng ≥ 80%. Block CHƯA vào chu kỳ mà đạt đủ 2 điều kiện đó -> BẮT ĐẦU chu kỳ (TJ 2026-10-01: "chơi block đó thì bắt đầu tính vào
     chu kỳ"): passed = true, lần 1, ôn tiếp sau 24 giờ — y như lần đầu đạt Phiếu đầy đủ/Từng câu (advance từ cycle 0). */
  var SRS_WAIT = [10 * 6e4, 24 * 36e5, 7 * 864e5, 30 * 864e5, 90 * 864e5, 180 * 864e5], SRS_SHORT = ["10 phút", "24 giờ", "1 tuần", "1 tháng", "3 tháng", "6 tháng"];
  async function srsAfterMatch() {
    G.srsHtml = "";
    if (!isTJ() || tgt() !== "en") return;
    /* câu của MỌI người chơi gắn hồ sơ TJ (TJ + vd Thảo) — host giữ hết câu trả lời trong G.answers */
    try {
      var pids = Object.keys((G.st && G.st.scores) || {});
      var lk = pids.length ? await sb.from("game_players").select("id").eq("profile_id", HOST_PROFILE_ID).in("id", pids) : { data: [] };
      var mine = {}; (lk.data || []).forEach(function (x) { mine[x.id] = 1; });
      var all = (G.answers || []).filter(function (a) { return mine[a.pid] && a.wid; }).map(function (a) { return { wid: a.wid, ok: !!a.ok }; });
      if (all.length) G.myAns = all;
    } catch (e) {}
    if (!(G.myAns || []).length) return;
    var blockOf = {}; (G.pool || []).forEach(function (w) { blockOf[w.wid] = w.block; });
    var per = {};
    G.myAns.forEach(function (a) {
      var b = blockOf[a.wid]; if (!b) return;
      var x = per[b] = per[b] || { seen: {}, n: 0, ok: 0 };
      x.seen[a.wid] = 1; x.n++; if (a.ok) x.ok++;
    });
    var ids = Object.keys(per); if (!ids.length) return;
    var r = await sb.from("block_progress").select("block_id,passed,cycle,next_review_at,review_history,hard_passed_at").eq("user_id", HOST_PROFILE_ID).in("block_id", ids);
    if (r.error) { console.warn("block_progress", r.error.message); return; }
    var bp = {}; (r.data || []).forEach(function (x) { bp[x.block_id] = x; });
    var now = Date.now(), moved = [], notYet = [], started = [];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], x = per[id], p = bp[id], total = (G.blockWordN || {})[id] || 0;
      var name = TREE ? pathOf({ table: "blocks", id: id, title: id }).split(" › ").slice(-3).join(" › ") : id;
      var fresh = !p || !p.passed;                                                              /* chưa vào chu kỳ -> game được BẮT ĐẦU chu kỳ */
      if (!fresh && (p.cycle | 0) >= SRS_WAIT.length) continue;                                  /* đã xong 6 lần 💎 */
      if (!fresh && p.next_review_at && p.next_review_at - 36e5 > now) continue;                  /* chưa tới hạn -> không đẩy (như WordLoop) */
      var cover = total ? Object.keys(x.seen).length / total : 0, acc = x.n ? x.ok / x.n : 0;
      if (cover < 0.8 || acc < 0.8) {
        if (!fresh || cover >= 0.5) notYet.push({ name: name, cover: cover, acc: acc, seen: Object.keys(x.seen).length, total: total, fresh: fresh });   /* Block mới: chỉ nhắc khi đã làm ≥ 50% */
        continue;
      }
      var c = fresh ? 1 : Math.min((p.cycle | 0) + 1, SRS_WAIT.length), next = now + SRS_WAIT[Math.min(c, SRS_WAIT.length - 1)];
      var hist = !fresh && Array.isArray(p.review_history) ? p.review_history.slice() : [];
      hist.push({ step: c, at: now, via: "game" });
      if (hist.length > SRS_WAIT.length) hist = hist.slice(hist.length - SRS_WAIT.length);
      var row = { user_id: HOST_PROFILE_ID, block_id: id, passed: true, cycle: c, next_review_at: next, last_reviewed_at: now, review_history: hist };
      if (fresh && !(p && p.hard_passed_at)) row.hard_passed_at = now;   /* mốc đạt đầu tiên — Bảng xếp hạng lọc Tuần/Tháng */
      var u = await sb.from("block_progress").upsert(row, { onConflict: "user_id,block_id" });   /* chưa có dòng thì tạo, có rồi chỉ sửa các cột này */
      if (u.error) { console.warn("đẩy chu kỳ", u.error.message); continue; }
      (fresh ? started : moved).push({ name: name, c: c, wait: SRS_SHORT[Math.min(c, SRS_SHORT.length - 1)] });
    }
    if (!moved.length && !notYet.length && !started.length) return;
    var pc = function (v) { return Math.round(v * 100) + "%"; };
    G.srsHtml = "<h3>🔁 Chu kỳ Tony Buzan</h3><ul>" +
      started.map(function (m) { return '<li class="ok">▶ ' + esc(m.name) + " — bắt đầu chu kỳ: xong lần 1, ôn tiếp sau " + m.wait + "</li>"; }).join("") +
      moved.map(function (m) { return '<li class="ok">✓ ' + esc(m.name) + " — xong lần " + m.c + (m.c >= SRS_WAIT.length ? " 💎" : ", ôn tiếp sau " + m.wait) + "</li>"; }).join("") +
      notYet.map(function (m) { return '<li class="no">… ' + esc(m.name) + (m.fresh ? " — chưa đủ để bắt đầu chu kỳ: làm " : " — đến hạn nhưng chưa đủ: làm ") + m.seen + "/" + m.total + " từ (" + pc(m.cover) + "), đúng " + pc(m.acc) + " — cần ≥ 80% cả hai</li>"; }).join("") + "</ul>";
    if (!$("#s-end").hidden) { $("#e-srs").innerHTML = G.srsHtml; $("#e-srs").hidden = false; }
    loadDue();   /* cột ⏳ Đến hạn cập nhật ngay */
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
  /* 📊 THỐNG KÊ theo kiểu chơi (TJ 2026-10-02), mọi người thấy của nhau trên bảng xếp hạng:
     ⚡ Đua / Tự do: % chính xác · số câu/phút · thời gian TB mỗi câu; Kahoot: % chính xác · phản xạ TB (nhịp câu do host). */
  function elapsedMs(s) {
    if (s && s.elapsed) return s.elapsed;   /* ván đã kết thúc (kể cả bấm Kết thúc sớm): thời gian chơi THẬT */
    var tot = ((s && (s.totalSec || s.minutes * 60)) || 0) * 1000;
    if (!s || s.phase !== "play" || !G.endAt) return tot;
    return Math.max(0, tot - Math.max(0, G.endAt - Date.now()));
  }
  /* Kahoot: câu đã CHẤM - số lượt đã tính (k). Từ v65 câu bỏ lỡ được tính SAI ngay lúc lộ đáp án (k cũng +1) nên số này
     thường = 0; chỉ còn > 0 với dữ liệu ván cũ. */
  function missedOf(x, s) {
    if (!s || s.mode !== "kahoot" || !s.q) return 0;
    var asked = s.q.revealed ? s.q.qn : s.q.qn - 1, n = (x.k != null ? x.k : (x.c || 0) + (x.w || 0));
    return Math.max(0, asked - n);
  }
  function statBits(x, s, icons) {   /* [{t: chữ, tip: chú thích}] — icons=true -> chip có icon (bảng xếp hạng) */
    var n = (x.c || 0) + (x.w || 0), out = [], miss = missedOf(x, s);
    if (n) out.push({ t: (icons ? "🎯 " : "") + Math.round(100 * (x.c || 0) / n) + "%", tip: T("t_acc") });
    var el = elapsedMs(s);
    if (n && s && s.mode !== "kahoot" && el >= 10000) out.push({ t: (icons ? "⚡ " : "") + T("per_min", { n: Math.round(n / (el / 60000) * 10) / 10 }), tip: T("t_pace") });
    if (x.k && x.t) out.push({ t: (icons ? "⏱ " : "") + T(s && s.mode === "kahoot" ? "react_s" : "avg_s", { n: (x.t / x.k / 1000).toFixed(1) }).replace(/^⚡/, ""), tip: T("t_avg") });
    if (miss) out.push({ t: (icons ? "⏭ " : "") + T("missed", { n: miss }), tip: T("t_miss"), miss: 1 });
    return out;
  }
  function statsHTML(x, s) {
    var b = statBits(x, s, true), n = (x.c || 0) + (x.w || 0);
    b = b.map(function (o) { return '<span class="g-chip2' + (o.miss ? " g-chipmiss" : "") + '" title="' + esc(o.tip) + '">' + esc(o.t) + "</span>"; });
    var bar = n ? '<span class="g-accbar" title="' + esc(Math.round(100 * (x.c || 0) / n) + "% đúng") + '"><i style="width:' + (100 * (x.c || 0) / n).toFixed(1) + '%"></i></span>' : "";
    return (b.length ? '<span class="g-stats">' + b.join("") + "</span>" : "") + bar;
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
    setTimeout(paintTIntro, 0);
    if (s && s.target === "zh") loadPinyin();
    setTimeout(paintForce, 0);
    if (G.outbox && G.outbox.length) setTimeout(flushOutbox, 300);   /* host đã quay lại -> gửi bù đáp án đang giữ */
    if (s && G.st && s.sound !== G.st.sound) setTimeout(paintSoundBtn, 0);   /* host đổi mặc định âm thanh -> nút của người chưa tự chọn đổi theo */
    G.lastState = Date.now();
    if (!G.langSet && !isTJ() && s.lang && G.myLang !== s.lang) { G.myLang = s.lang; $("#g-mylang").value = s.lang; applyUI(); }
    var was = G.st && G.st.phase, langWas = G.st && G.st.lang;
    if (!G.isHost) G.st = s;
    if (s.exSubmitAt && G.ex && !G.ex.done && iPlay()) setTimeout(exSubmit, 0);   /* 📝 host kết thúc -> tự nộp bài */
    if (window.Board) Board.onState(G.isHost ? G.st : s);
    if (s.left != null) G.endAt = Date.now() + s.left;
    if (G.myLang === "room" && langWas !== s.lang) applyUI();   /* "theo phòng" -> host đổi tiếng thì giao diện đổi theo */
    if (G.view === "screen") return paintScreen(s);
    /* đang xem 📜 Lịch sử: phòng gửi trạng thái 3-10s/lần -> trước đây bị kéo về phòng chờ/kết quả liên tục.
       Nay đứng yên ở Lịch sử; chỉ khi ván BẮT ĐẦU mới kéo về để chơi. */
    if (G.inHist) { if (s.phase !== "play" || was === "play") return; G.inHist = false; }
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
  function modeLine(s) { return (s.target && s.target !== "en" ? "🎯 " + FLAG[s.target] + " · " : "") + (s.mode === "kahoot" ? T("m_kahoot") + (untimed(s) ? "" : " · " + s.qs + " " + T("sec_q")) : T(s.race ? "m_race" : "m_free")) + (untimed(s) ? " · " + T("no_time") : ""); }
  /* 🔥 làm nóng giọng đọc: Chrome tải bộ đọc + danh sách giọng chậm ở lần đầu -> câu đầu bị trễ / im (TJ 2026-10-02) */
  function warmTTS() {
    try {
      var syn = window.speechSynthesis; if (!syn || G.ttsWarm) return;
      G.ttsWarm = true; syn.getVoices(); primeTTS();
    } catch (e) {}
  }
  try { if (window.speechSynthesis) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = function () { window.speechSynthesis.getVoices(); }; } } catch (e) {}
  function enterPlay(s) {
    warmTTS();
    logStart(s);
    $("#p-next").hidden = true; $("#p-reveal").hidden = true;
    G.lastN = -1; G.revealedN = -1; G.scRev = -1; G.myChoice = null;   /* ván mới đánh số câu lại từ 1 */
    show("s-play");
    $("#p-mode").textContent = modeLine(s);
    $("#p-stop").hidden = !G.isHost;
    clearInterval(G.tick);
    G.tick = setInterval(function () {
      $("#p-left").textContent = untimed(G.st) ? "∞" : fmt(G.endAt - Date.now());
      autoSubmit();
      var bar = $("#p-qbar");
      if (G.ex && !G.ex.done) { var exl = G.ex.end - Date.now(); exInfo(); if (exl <= 0 || Date.now() >= G.endAt - 1500) exSubmit(); }
      var mq = G.myQ, tq = G.st && G.st.mode === "free" && mq && mq.type === "toeic" && G.tQEnd && !G.ex;
      if (tq && !mq.done && (Date.now() >= G.tQEnd || Date.now() >= G.endAt - 300)) { toeicCommit(mq); if (Date.now() < G.endAt - 300) freeNext(); }   /* đề thi: hết giờ CÂU -> chốt lựa chọn cuối, tự sang câu */
      if (tq) bar.style.width = mq.done ? "0%" : Math.max(0, Math.min(100, (G.tQEnd - Date.now()) / ((G.st.qs || 20) * 1000) * 100)) + "%";
      else if (G.st && G.st.mode === "kahoot" && G.qUntilLocal) bar.style.width = Math.max(0, Math.min(100, (G.qUntilLocal - Date.now()) / ((G.qLimit || G.st.qs || 15) * 1000) * 100)) + "%";
      else bar.style.width = "0%";
      if (G.st && G.st.mode === "free" && Date.now() >= G.endAt) { $("#p-next").hidden = true; lockAll(T("time_up")); }
      if (!G.isHost) {
        var hostHere = G.online.some(isRoomHost);
        var lost = !(hostHere && Date.now() - G.lastState <= HOST_LOST_MS);
        $("#p-hostlost").hidden = !lost;
        if (lost) $("#p-hostlost").textContent = T(G.st && G.st.mode === "free" ? "host_lost_free" : "host_lost");
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
  /* tiến độ của MÌNH (TJ 2026-10-02): "✓ đúng/đã làm · còn N câu" — Kahoot đếm theo số câu của phòng, Tự do theo câu mình đã làm */
  function paintProg(s) {
    var el = $("#p-prog"); if (!el || !s) return;
    var me = G.me && s.scores ? s.scores[G.me.id] : null, total = +s.total || 0, html = "";
    var done = me ? (me.c || 0) + (me.w || 0) : 0;
    var qi = s.mode === "kahoot" && s.q ? s.q.qn : done + 1;   /* số thứ tự câu đang làm */
    var tile = function (v, lbl, tip, cls) { return '<div class="g-stat' + (cls ? " " + cls : "") + '"' + (tip ? ' title="' + esc(tip) + '"' : "") + "><b>" + esc(v) + "</b><span>" + esc(lbl) + "</span></div>"; };
    var used = s.qtype === "toeic" ? done : s.mode === "kahoot" && s.q ? (s.q.revealed ? s.q.qn : s.q.qn - 1) : done;   /* đề thi: nhóm 3 câu = 3 câu, không phải 1 (QA) */   /* Kahoot: theo câu của phòng; Tự do: câu mình đã làm */
    if (me && iPlay()) {
      var n = done, acc = n ? Math.round(100 * (me.c || 0) / n) + "%" : "—", el2 = elapsedMs(s);
      html = tile(me.c || 0, T("st_right"), "", "ok") + tile(me.w || 0, T("st_wrong"), "", "bad") +
        tile(total ? done + "/" + total : done, T("st_done"), "") +
        (total ? tile(Math.max(0, total - used), T("st_left"), T("t_left")) : "") +
        tile(acc, T("st_acc"), T("t_acc")) +
        /* ô Câu/phút LUÔN có (chưa đủ số liệu thì "—"): trước đây ô hiện thêm sau câu đầu -> dải ô cao thêm 1 hàng,
           đẩy khung câu hỏi xuống, điện thoại thấy giật (TJ 2026-10-02) */
        (s.mode !== "kahoot" ? tile(n && el2 >= 10000 ? Math.round(n / (el2 / 60000) * 10) / 10 : "—", T("st_pace"), T("t_pace")) : "") +
        tile(me.k && me.t ? (me.t / me.k / 1000).toFixed(1) + "s" : "—", T("st_avg"), T("t_avg"));
    } else if (s.q && total) html = tile((s.q.qn || 0) + "/" + total, T("st_q"), "") + tile(Math.max(0, total - used), T("st_left"), T("t_left"));
    el.innerHTML = html;
  }
  function paintBoard(s) {
    paintProg(s);
    var roster = s.roster || {}, list = live(s, rankList(s.scores)), teams = +s.teams;
    $("#p-teams").innerHTML = teams ? teamSummary(s, true) : "";
    $("#p-board").innerHTML = list.map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + x.rank + "</span>" + avatar(p.avatar) +
        '<span class="g-pname">' + label(p) + "</span>" + (teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-streak">' + (x.st >= 2 ? "🔥" + x.st : "") + "</span>" + statsHTML(x, s) + tally(x, s) + "</li>";
    }).join("");
  }

  /* vẽ 1 câu hỏi (dùng chung Kahoot / Tự do): gợi ý dạng câu + nội dung + 4 lựa chọn HOẶC ô gõ */
  var QHINT = { toeic: "q_toeic", en2m: "q_en2m", gap: "q_gap", recall: "q_recall", meaning: "q_meaning", sheet: "q_sheet", write: "q_write", dict: "q_dict", order: "q_order", chunk: "q_chunk", listen: "q_listen", polite: "q_polite" };
  var REG_ICON = { casual: "👫", neutral: "🧑‍💼", formal: "🎩" };
  function sheetHTML(q, sel) {   /* bài đọc có ô chọn từ (người chơi) hoặc "_____" (📺) */
    return '<div class="g-sheet">' + esc(q.text).split(/\n\s*\n/).map(function (para) {
      return "<p>" + para.replace(/\{\{G(\d+)\}\}/g, function (_, i) {
        return sel ? '<select class="g-sel" data-gi="' + i + '"><option value="">—</option>' + q.bank.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + "</option>"; }).join("") + "</select>"
                   : '<span class="g-blank" data-gi="' + i + '"></span>';
      }) + "</p>";
    }).join("") + "</div>";
  }
  /* đoạn văn đề thi: dòng "[img] <url>" = ảnh (Part 1 / hình "Look at the graphic" của Listening, ảnh nằm ở bucket toeic) */
  /* 🎧 audio đề Listening (TJ 2026-10-04): mốc thời gian từng câu nằm trong passage dạng "[aud] q=885.27-889.37 g=816.38-883.05"
     (q = đoạn đọc số câu + câu hỏi / 4 câu mô tả / câu hỏi+3 đáp án; g = hội thoại/bài nói của nhóm câu Part 3–4).
     File nghe: bucket toeic/listening/TEST_<n>_LC.mp3 (đã nén ~56kbps). Cắt mốc bằng dò khoảng lặng + nghe ra chữ (pocketsphinx). */
  function tCue(q) {
    var m = String((q && q.passage) || "").match(/^\[aud\] q=([\d.]+)-([\d.]+)(?: g=([\d.]+)-([\d.]+))?/m); if (!m) return null;
    var t = q.test || (G.st && G.st.test && G.st.test.test);
    return { url: cfg.SUPABASE_URL + "/storage/v1/object/public/toeic/listening/TEST_" + t + "_LC.mp3", q: [+m[1], q.gEnd || +m[2]], g: m[3] ? [+m[3], +m[4]] : null };   /* nhóm: từ câu đầu tới hết câu 3 (gồm khoảng chờ giữa các câu như đề thật) */
  }
  var TAUD = null, tSeqTok = 0;
  function tAudio() { if (!TAUD) { TAUD = new Audio(); TAUD.preload = "auto"; } tVol(); return TAUD; }
  /* audio đề nghe theo nút "🔇 Đã tắt tiếng" + thanh âm lượng của máy này (TJ 2026-10-04: tắt tiếng mà vẫn ra quá trời âm thanh).
     Tắt tiếng vẫn CHẠY ngầm (im lặng) để nhịp tự sang câu theo audio của host vẫn đúng. */
  function tVol(force) { if (!TAUD) return; TAUD.muted = !force && !soundOn(); TAUD.volume = volLevel(); }
  /* mở khoá audio ở lần chạm đầu (iPhone cần): phát 1 tiếng IM LẶNG ngắn rồi trả lại — CHỈ khi chưa có lượt phát thật nào chen vào
     (QA v141: bản cũ play() khi chưa có nguồn, promise treo tới lúc tAutoPlay phát câu 1 rồi pause() luôn -> Part 1 câm, "theo audio" kẹt) */
  var T_SILENT = "data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  document.addEventListener("pointerdown", function () {
    if (G.tUnlocked) return; G.tUnlocked = true; var a = tAudio(); if (!a.paused || a.dataset.src) return;
    var tok = tSeqTok; a.src = T_SILENT; var p = a.play();
    var back = function () { if (tok !== tSeqTok || a.dataset.src) return; a.pause(); a.removeAttribute("src"); try { a.load(); } catch (e) {} };
    if (p && p.then) p.then(back, back); else back();
  }, { once: false, capture: true });
  /* trình duyệt chặn tự phát (chưa chạm màn hình: vừa F5, iPhone) -> hiện nút "🔊 Chạm để nghe", chạm là phát tiếp đúng đoạn */
  function tNeedTap(fn) {
    var b = $("#t-needtap");
    if (!b) { b = document.createElement("button"); b.id = "t-needtap"; b.type = "button"; b.className = "g-needtap"; document.body.appendChild(b); }
    b.textContent = "🔊 " + T("tap_listen"); b.hidden = false;
    b.onclick = function () { b.hidden = true; fn(); };
  }
  function tStop() { tSeqTok++; if (TAUD) TAUD.pause(); }
  function tPlaySeq(url, seq, onEnd) {   /* phát lần lượt các đoạn [từ, tới] của 1 file */
    var a = tAudio(), tok = ++tSeqTok, i = 0;
    a.playbackRate = 1; if (AP) AP.live = false;
    if (a.dataset.src !== url) { a.src = url; a.dataset.src = url; }
    function next() {
      if (tok !== tSeqTok) return;
      if (i >= seq.length) { a.pause(); if (onEnd) onEnd(); return; }
      var r = seq[i++];
      var go = function () { if (tok !== tSeqTok) return; try { a.currentTime = r[0]; } catch (e) {} var p = a.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === "NotAllowedError" && tok === tSeqTok) { var rest = seq.slice(i - 1); tNeedTap(function () { tPlaySeq(url, rest, onEnd); tVol(); }); } }); };
      a.ontimeupdate = function () { if (tok === tSeqTok && a.currentTime >= r[1]) { a.ontimeupdate = null; next(); } };
      if (a.readyState >= 1) go(); else a.addEventListener("loadedmetadata", go, { once: true });
    }
    next();
  }
  /* câu mới: phát đúng đoạn của câu; câu đầu nhóm Part 3–4 phát cả hội thoại trước. Host 🎧 theo audio: hết đoạn + khoảng chờ như đề thật
     (5s Part 1–2, 8s Part 3–4, 12s câu "Look at the graphic") thì tự sang câu. */
  function tAutoPlay(q) {
    var c = tCue(q); if (!c || !G.st || !G.st.tplay) return;
    /* 📢 "chỉ máy host phát" (TJ 2026-10-04: nhiều người chơi chung mà máy nào cũng phát là loạn): kiểu Cùng 1 câu / theo audio -> máy người chơi im;
       Tự do / ⚡ Đua mỗi người 1 nhịp nên vẫn phát trên từng máy */
    if (G.st.taud === "host" && !G.isHost && G.st.mode === "kahoot") return;
    if (G.tMatchG !== G.st.matchId) { G.tMatchG = G.st.matchId; G.tLastG = ""; }   /* ván mới: câu đầu nhóm lại phát hội thoại */
    var gk = c.g ? c.g.join("-") : "", seq = [];
    if (c.g && G.tLastG !== gk) seq.push(c.g);
    G.tLastG = gk; seq.push(c.q);
    var qn = G.st.q && G.st.q.qn, gapS = +(q.part || G.st.test.part) <= 2 ? 5 : tGraphic(q) ? 12 : 8;
    if (G.st.mode === "free" && !G.st.race) {   /* Tự do: giờ của câu phải đủ nghe hết đoạn audio + khoảng chờ (hội thoại Part 3 ~40s) */
      var tot = seq.reduce(function (t, r) { return t + r[1] - r[0]; }, 0);
      G.tQEnd = Math.max(G.tQEnd || 0, Date.now() + (tot + gapS + 2) * 1000);
    }
    clearTimeout(G.tNextT);
    if (q.subs) G.tNextT = setTimeout(tShowNext, (c.g && seq.length > 1 ? c.g[1] - c.g[0] : 0) * 1000);   /* hội thoại xong -> hiện trước 3 câu nhóm sau */
    tPlaySeq(c.url, seq, function () {
      if (!G.isHost || !G.st || !G.st.hostpace) return;
      var gap = gapS * 1000;
      setTimeout(function () { var cq = G.st && G.st.q; if (cq && cq.qn === qn && !cq.revealed && G.st.phase === "play") hostReveal(); }, gap);
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-tcue]"); if (!b) return;
    var d = b.dataset.tcue.split("|"), seq = [d[1].split("-").map(Number)];
    if (d[2]) seq.unshift(d[2].split("-").map(Number));
    if (b.classList.contains("on")) { tStop(); b.classList.remove("on"); return; }
    b.classList.add("on"); tPlaySeq(d[0], seq, function () { b.classList.remove("on"); }); tVol(true);   /* bấm 🔊 tay = muốn nghe, kể cả đang tắt tiếng */
  });
  /* ---------- 🎚 THANH NGHE LẠI + 🔖 ĐOẠN KHÓ (TJ 2026-10-04: "lúc review có thanh âm thanh chỉnh tới lui, bấm bookmark để nghe lại
     sau nếu đoạn đó khó — để dành chơi dictation sau này") ----------
     · Xem lại câu Listening: thanh kéo trong phạm vi đoạn (cả bài nói / câu hỏi), ⏪5s ⏩5s, tốc độ 1×/0.75×/0.5×, 🔁 lặp.
     · 🔖 2 bước: "Đánh dấu từ đây" -> "Kết thúc & lưu" (hoặc lưu cả đoạn đang nghe). Lưu vào vocab_saves (không cần bảng mới):
       word_id = "aud:<test>:<part>:<num>:<từ>-<tới>" + test/part/num; máy chưa có hồ sơ -> chỉ lưu trên máy (tjwl_audmarks_v1).
     · "🔖 Đoạn nghe đã lưu" (Hub TEST / phòng chờ / màn Xem lại): nghe lại mọi đoạn đã lưu, xoá được. */
  var AP_TX = {
    vi: { scr: "Lời thoại", scrtip: "bấm 1 câu để nghe đúng câu đó", evq: "Nghe đoạn có đáp án câu", qon: "Đã để dành — làm lại sau", qoff: "Để dành làm lại câu này", h: "Nghe lại", all: "📻 Cả bài nói", q: "❓ Câu hỏi", loop: "Lặp lại", mark: "🔖 Đánh dấu từ đây", mark2: "🔖 Kết thúc & lưu", saveall: "🔖 Lưu cả đoạn này", saved: "✓ Đã lưu đoạn", mine: "🔖 Đoạn đã lưu của câu này", list: "🔖 Đoạn nghe đã lưu", none: "Chưa lưu đoạn nào — ở 📖 Xem lại câu Listening, bấm 🔖 để lưu đoạn khó.", del: "Xoá đoạn này?", tip: "Kéo thanh để tua · đoạn khó thì bấm 🔖 để nghe lại sau (sau này luyện chép chính tả từ đây).", seg: "Đoạn", qn: "Câu" },
    en: { scr: "Audio script", scrtip: "tap a line to hear it", evq: "Hear the answer part of Q", qon: "Saved — redo later", qoff: "Save this question to redo", h: "Listen again", all: "📻 Whole talk", q: "❓ Question", loop: "Repeat", mark: "🔖 Mark from here", mark2: "🔖 End & save", saveall: "🔖 Save this whole part", saved: "✓ Saved", mine: "🔖 Saved parts of this question", list: "🔖 Saved listening parts", none: "Nothing saved yet — in 📖 Review of a Listening question, press 🔖 to save a hard part.", del: "Delete this part?", tip: "Drag the bar to seek · press 🔖 on hard parts to listen again later (dictation practice later).", seg: "Part", qn: "Q" },
    zh: { scr: "听力原文", scrtip: "点一句即可播放这一句", evq: "听答案所在片段 第", qon: "已收藏——以后重做", qoff: "收藏此题以后重做", h: "再听一遍", all: "📻 整段对话", q: "❓ 问题", loop: "循环", mark: "🔖 从这里标记", mark2: "🔖 结束并保存", saveall: "🔖 保存整段", saved: "✓ 已保存", mine: "🔖 本题已保存的片段", list: "🔖 已保存的听力片段", none: "还没有保存——在听力题的 📖 查看答案 中点 🔖 保存难的片段。", del: "删除这个片段？", tip: "拖动进度条快进/后退 · 难的片段点 🔖 保存以后再听（之后可做听写练习）。", seg: "片段", qn: "第" },
    es: { scr: "Transcripción", scrtip: "toca una línea para escucharla", evq: "Escuchar la parte de la respuesta P", qon: "Guardada — repetir luego", qoff: "Guardar para repetir", h: "Escuchar de nuevo", all: "📻 Todo el audio", q: "❓ Pregunta", loop: "Repetir", mark: "🔖 Marcar desde aquí", mark2: "🔖 Terminar y guardar", saveall: "🔖 Guardar todo el fragmento", saved: "✓ Guardado", mine: "🔖 Fragmentos guardados de esta pregunta", list: "🔖 Fragmentos guardados", none: "Aún no hay nada — en 📖 Revisar de una pregunta de Listening, pulsa 🔖 para guardar un fragmento difícil.", del: "¿Borrar este fragmento?", tip: "Arrastra la barra para avanzar/retroceder · pulsa 🔖 en lo difícil para escucharlo luego (dictado más adelante).", seg: "Fragmento", qn: "P" }
  };
  function apT(k) { var d = AP_TX[uiLang()] || AP_TX.vi; return d[k] || AP_TX.vi[k] || k; }
  function apUrl(t) { return cfg.SUPABASE_URL + "/storage/v1/object/public/toeic/listening/TEST_" + t + "_LC.mp3"; }
  function apClock(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
  var AP = null;   /* {box, url, a, b, loop, meta, A(mốc đánh dấu)} */
  function apStop() { if (AP && TAUD) { TAUD.pause(); TAUD.ontimeupdate = null; } if (AP) apSync(); }
  function apSync() {
    if (!AP || !AP.box || !AP.box.isConnected) return;
    var a = TAUD, cur = a && a.dataset.src === AP.url ? a.currentTime : AP.a, on = a && !a.paused && a.dataset.src === AP.url && AP.live;
    cur = Math.max(AP.a, Math.min(AP.b, cur));
    var bar = AP.box.querySelector(".g-apbar"); if (bar && !AP.drag) bar.value = cur;
    var tm = AP.box.querySelector(".g-aptm"); if (tm) tm.textContent = apClock(cur - AP.a) + " / " + apClock(AP.b - AP.a);
    var pb = AP.box.querySelector('[data-ap="play"]'); if (pb) pb.textContent = on ? "⏸" : "▶";
    var mk = AP.box.querySelector('[data-ap="mark"]'); if (mk) { mk.textContent = AP.A != null ? apT("mark2") + " (" + apClock(AP.A - AP.a) + "→)" : apT("mark"); mk.classList.toggle("on", AP.A != null); }
  }
  function apPlay(from) {
    if (!AP) return;
    tSeqTok++;   /* dừng mọi lượt phát tự động / nút 🔊 */
    var a = tAudio(), go = function () {
      try { a.currentTime = from != null ? from : (a.dataset.src === AP.url && a.currentTime >= AP.a && a.currentTime < AP.b - 0.3 ? a.currentTime : AP.a); } catch (e) {}
      a.playbackRate = AP.rate || 1; tVol(true); AP.live = true;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    };
    if (a.dataset.src !== AP.url) { a.src = AP.url; a.dataset.src = AP.url; }
    a.ontimeupdate = function () {
      if (!AP || !AP.live) return;
      if (a.currentTime >= AP.b) { if (AP.loop) { try { a.currentTime = AP.a; } catch (e) {} } else { a.pause(); AP.live = false; try { a.currentTime = AP.a; } catch (e) {} } }
      apSync();
    };
    a.onpause = a.onplay = apSync;
    if (a.readyState >= 1) go(); else a.addEventListener("loadedmetadata", go, { once: true });
  }
  /* box: chỗ vẽ; o = {url, segs:[{k,label,a,b}], meta:{test,part,num}, marks:true} */
  function apMount(box, o) {
    if (AP && AP.live) apStop();
    var s0 = o.segs[0];
    AP = { box: box, url: o.url, a: s0.a, b: s0.b, segs: o.segs, meta: o.meta, loop: false, rate: 1, A: null };
    box.innerHTML = '<div class="g-ap">' +
      (o.segs.length > 1 ? '<div class="g-aprow g-apsegs">' + o.segs.map(function (s, i) { return '<button type="button" class="g-btn g-btn-sm' + (i ? " g-btn-soft" : "") + '" data-apseg="' + i + '">' + esc(s.label) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="g-aprow"><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="back">⏪ 5s</button><button type="button" class="g-btn g-btn-sm g-applay" data-ap="play">▶</button><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="fwd">5s ⏩</button>' +
      '<button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="rate">1×</button><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="loop" title="' + esc(apT("loop")) + '">🔁</button></div>' +
      '<div class="g-aprow g-apline"><input type="range" class="g-apbar" step="0.1"><span class="g-aptm"></span></div>' +
      (o.meta ? '<div class="g-aprow"><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="mark"></button><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="saveall">' + esc(apT("saveall")) + '</button><span class="g-apmsg"></span></div><div class="g-apmarks"></div>' : "") +
      '<div class="g-sub g-aptip">' + esc(apT("tip")) + "</div></div>";
    apSeg(0);
    if (o.meta) apPaintMarks();
  }
  function apSeg(i) {
    var s = AP.segs[i]; if (!s) return;
    AP.a = s.a; AP.b = s.b; AP.A = null;
    var bar = AP.box.querySelector(".g-apbar"); bar.min = s.a; bar.max = s.b; bar.value = s.a;
    AP.box.querySelectorAll("[data-apseg]").forEach(function (b) { b.classList.toggle("g-btn-soft", +b.dataset.apseg !== i); });
    if (AP.live) apPlay(s.a); else apSync();
  }
  document.addEventListener("input", function (e) { if (AP && e.target.classList && e.target.classList.contains("g-apbar")) { AP.drag = true; var tm = AP.box.querySelector(".g-aptm"); if (tm) tm.textContent = apClock(+e.target.value - AP.a) + " / " + apClock(AP.b - AP.a); } });
  document.addEventListener("change", function (e) { if (AP && e.target.classList && e.target.classList.contains("g-apbar")) { AP.drag = false; apPlay(+e.target.value); } });
  document.addEventListener("click", function (e) {
    if (!AP || !e.target.closest) return;
    var sg = e.target.closest("[data-apseg]"); if (sg && AP.box.contains(sg)) { apSeg(+sg.dataset.apseg); if (!AP.live) apPlay(AP.a); return; }
    var b = e.target.closest("[data-ap]"); if (!b || !AP.box.contains(b)) return;
    var k = b.dataset.ap, a = TAUD, cur = a && a.dataset.src === AP.url ? a.currentTime : AP.a;
    if (k === "play") { if (AP.live && a && !a.paused) { a.pause(); AP.live = false; apSync(); } else apPlay(); }
    else if (k === "back" || k === "fwd") { var t = Math.max(AP.a, Math.min(AP.b - 0.2, cur + (k === "back" ? -5 : 5))); if (AP.live && a && !a.paused) { try { a.currentTime = t; } catch (x) {} } else apPlay(t); }
    else if (k === "rate") { AP.rate = AP.rate === 1 ? 0.75 : AP.rate === 0.75 ? 0.5 : 1; b.textContent = AP.rate + "×"; if (a) a.playbackRate = AP.rate; }
    else if (k === "loop") { AP.loop = !AP.loop; b.classList.toggle("on", AP.loop); b.classList.toggle("g-btn-soft", !AP.loop); }
    else if (k === "mark") {
      if (AP.A == null) { AP.A = Math.max(AP.a, cur - 1); if (!(a && !a.paused)) apPlay(AP.A); apSync(); }
      else { var x = AP.A, y = Math.min(AP.b, Math.max(cur, x + 3)); AP.A = null; apSync(); apSave(x, y); }
    } else if (k === "saveall") apSave(AP.a, AP.b);
    else if (k === "mplay") { var r = b.dataset.r.split("-").map(Number); AP.a = r[0]; AP.b = r[1]; var bar = AP.box.querySelector(".g-apbar"); bar.min = r[0]; bar.max = r[1]; AP.box.querySelectorAll("[data-apseg]").forEach(function (s) { s.classList.add("g-btn-soft"); }); apPlay(r[0]); }
    else if (k === "mdel") apDel(b.dataset.id);
  });
  /* 🔖 kho đoạn đã lưu: Supabase vocab_saves (theo người chơi) + bản trên máy */
  var LS_AUDM = "tjwl_audmarks_v1";
  function apLocal() { try { return JSON.parse(localStorage.getItem(LS_AUDM) || "[]"); } catch (e) { return []; } }
  function apLocalSet(a) { try { localStorage.setItem(LS_AUDM, JSON.stringify(a)); } catch (e) {} }
  function apId(m, x, y) { return "aud:" + m.test + ":" + m.part + ":" + m.num + ":" + x.toFixed(1) + "-" + y.toFixed(1); }
  function apParse(id) { var p = String(id).split(":"); if (p[0] !== "aud" || p.length < 5) return null; var r = p[4].split("-").map(Number); return { id: id, test: p[1], part: +p[2], num: +p[3], a: r[0], b: r[1] }; }
  async function apMarks() {
    var ids = apLocal();
    if (G.me) { try { var r = await sb.from("vocab_saves").select("word_id").eq("player_id", G.me.id).like("word_id", "aud:%"); (r.data || []).forEach(function (x) { if (ids.indexOf(x.word_id) < 0) ids.push(x.word_id); }); } catch (e) {} }
    return ids.map(apParse).filter(Boolean);
  }
  async function apSave(x, y) {
    var m = AP && AP.meta; if (!m) return;
    var id = apId(m, x, y), loc = apLocal(); if (loc.indexOf(id) < 0) { loc.push(id); apLocalSet(loc); }
    if (G.me) { try { await sb.from("vocab_saves").upsert({ player_id: G.me.id, word_id: id, test: String(m.test), part: +m.part || null, num: +m.num || null }, { onConflict: "player_id,word_id" }); } catch (e) {} }
    var msg = AP.box.querySelector(".g-apmsg"); if (msg) msg.textContent = apT("saved") + " " + apClock(x - AP.segs[0].a) + "–" + apClock(y - AP.segs[0].a);
    apPaintMarks();
  }
  async function apDel(id) {
    if (!confirm(apT("del"))) return;
    apLocalSet(apLocal().filter(function (x) { return x !== id; }));
    if (G.me) { try { await sb.from("vocab_saves").delete().eq("player_id", G.me.id).eq("word_id", id); } catch (e) {} }
    if ($("#ap-lbody") && !$("#t-statsbox").hidden) apList(); else if (AP && AP.meta) apPaintMarks();
  }
  function apRow(k, label) {
    return '<div class="g-aprow g-apm"><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="mplay" data-r="' + k.a + "-" + k.b + '">▶ ' + esc(label) + '</button><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap="mdel" data-id="' + esc(k.id) + '">✕</button></div>';
  }
  async function apPaintMarks() {
    var m = AP && AP.meta; if (!m) return;
    var box = AP.box.querySelector(".g-apmarks"); if (!box) return;
    var L = (await apMarks()).filter(function (k) { return String(k.test) === String(m.test) && k.num >= m.num && k.num <= (m.last || m.num); });
    var base = AP.segs[0].a;
    box.innerHTML = L.length ? '<div class="g-sub">' + esc(apT("mine")) + "</div>" + L.map(function (k) { return apRow(k, apClock(k.a - base) + "–" + apClock(k.b - base)); }).join("") : "";
  }
  /* 📖 Xem lại: gắn thanh nghe vào đầu phần lời giải câu Listening */
  function apReview(L) {
    var q = L && L.tq; if (!q || !q.full) return;
    var m = String(q.full).match(/^\[aud\] q=([\d.]+)-([\d.]+)(?: g=([\d.]+)-([\d.]+))?/m); if (!m) return;
    var qa = +m[1], qb = q.gEnd || +m[2], segs = [];
    if (m[3]) { segs.push({ label: apT("all"), a: +m[3], b: qb }); segs.push({ label: apT("q"), a: qa, b: qb }); }
    else segs.push({ label: apT("q"), a: qa, b: qb });
    var box = $("#rv-res"); if (!box) return;
    box.insertAdjacentHTML("afterbegin", '<div class="g-apwrap"><div class="g-tvh">🎚 ' + esc(apT("h")) + "</div><div id=\"rv-ap\"></div></div>");
    apMount($("#rv-ap"), { url: apUrl(q.test), segs: segs, meta: { test: q.test, part: q.part, num: q.num, last: q.last || q.num } });
    scrLoad(q).then(function (scr) { if (scr && AP && $("#rv-ap")) scrPaint(scr, q, m[3] ? [+m[3], +m[4]] : [qa, +m[2]]); });
  }
  /* 📜 LỜI THOẠI (TJ 2026-10-04: "xem full bài, nghe lại full bài hoặc đúng đoạn có đáp án") — test_items.i18n.scr = {lines:[{sp,t}], ev:{num:"câu chứa đáp án"}}
     lấy từ sách lời giải ETS (tools/toeic_script_struct.js). Mốc từng câu = ƯỚC LƯỢNG theo độ dài chữ trong đoạn audio (chưa có mốc từng câu thật) -> lùi 1s cho chắc. */
  var SCR = {};
  async function scrLoad(q) {
    var k = q.test + ":" + q.num; if (SCR[k] !== undefined) return SCR[k];
    var it = (G.tItems || []).filter(function (x) { return x.num === q.num && String(x.test || q.test) === String(q.test); })[0];
    if (it && it.i18n && it.i18n.scr) return (SCR[k] = it.i18n.scr);
    try { var r = await sb.from("test_items").select("i18n").eq("exam", "toeic").eq("test", String(q.test)).eq("num", q.num).maybeSingle(); SCR[k] = (r.data && r.data.i18n && r.data.i18n.scr) || null; } catch (e) { SCR[k] = null; }
    return SCR[k];
  }
  function scrNorm(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  /* chia đoạn [a,b] theo độ dài chữ từng lượt nói (+ chút nghỉ giữa các lượt); Part 1–2 bỏ ~1.5s đầu đọc số câu */
  function scrTimes(lines, span, part) {
    var a = span[0] + (+part <= 2 ? 1.5 : 0.3), b = span[1], w = lines.map(function (l) { return String(l.t).length + 12; }), tot = w.reduce(function (x, y) { return x + y; }, 0) || 1, t = a;
    return lines.map(function (l, i) { var d = (b - a) * w[i] / tot, r = [t, t + d]; t += d; return r; });
  }
  function scrPaint(scr, q, span) {
    var box = $("#rv-ap"); if (!box || !scr.lines || !scr.lines.length) return;
    var T0 = scr.lines.every(function (l) { return l.a != null; }) ? scr.lines.map(function (l) { return [l.a, l.b]; }) : scrTimes(scr.lines, span, q.part), ev = scr.ev || {}, evAt = {};   /* a/b = mốc thật (nghe ra chữ, tools/toeic_script_align.py) */
    Object.keys(ev).forEach(function (n) {
      var key = scrNorm(ev[n]).slice(0, 40); if (!key) return;
      scr.lines.forEach(function (l, i) { if (evAt[n] == null && scrNorm(l.t).indexOf(key.slice(0, 25)) >= 0) evAt[n] = i; });
    });
    var mark = {}; Object.keys(evAt).forEach(function (n) { (mark[evAt[n]] = mark[evAt[n]] || []).push(n); });
    /* 🎯 câu có đáp án nằm giữa 1 lượt nói dài (Part 4 cả bài là 1 lượt): ước lượng đoạn con theo vị trí chữ, nới 1.5s */
    var evR = {}; Object.keys(evAt).forEach(function (n) {
      var l = scr.lines[evAt[n]], r = T0[evAt[n]], tx = String(l.t), k = tx.toLowerCase().indexOf(String(ev[n]).toLowerCase().slice(0, 30));
      if (k < 0 || r[1] - r[0] < 12) { evR[n] = r; return; }
      var d = r[1] - r[0], s0 = r[0] + d * k / tx.length, s1 = r[0] + d * Math.min(1, (k + String(ev[n]).length) / tx.length);
      evR[n] = [Math.max(r[0], s0 - 1.5), Math.min(r[1], s1 + 1.5)];
    });
    if (AP && AP.segs && AP.segs[0] && T0[0] && T0[0][0] - 1 > AP.segs[0].a) { AP.segs[0].a = T0[0][0] - 1; if (!AP.live) apSeg(0); }   /* "Cả bài nói" bắt đầu ngay lời thoại, bỏ phần hướng dẫn đọc trước */
    var html = '<div class="g-scr"><div class="g-tvh">📜 ' + esc(apT("scr")) + ' <span class="g-sub">' + esc(apT("scrtip")) + "</span></div>" +
      (Object.keys(evAt).length ? '<div class="g-aprow">' + Object.keys(evAt).sort(function (x, y) { return x - y; }).map(function (n) { var r = evR[n]; return '<button type="button" class="g-btn g-btn-soft g-btn-sm" data-scrp="' + Math.max(span[0], r[0] - 1).toFixed(1) + "-" + Math.min(span[1], r[1] + 1).toFixed(1) + '">🎯 ' + esc(apT("evq")) + " " + n + "</button>"; }).join("") + "</div>" : "") +
      scr.lines.map(function (l, i) {
        var r = T0[i];
        return '<div class="g-scl' + (mark[i] ? " ev" : "") + '" data-scrp="' + Math.max(span[0], r[0] - 0.8).toFixed(1) + "-" + Math.min(span[1], r[1] + 0.5).toFixed(1) + '">' + (l.sp ? '<b class="g-scsp">' + esc(l.sp) + "</b> " : "") + esc(l.t) + (mark[i] ? ' <span class="g-scq">🎯 ' + mark[i].join(", ") + "</span>" : "") + "</div>";
      }).join("") + "</div>";
    box.insertAdjacentHTML("beforeend", html);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-scrp]"); if (!b || !AP) return;
    var r = b.dataset.scrp.split("-").map(Number);
    $$(".g-scl.on").forEach(function (x) { x.classList.remove("on"); }); if (b.classList.contains("g-scl")) b.classList.add("on");
    AP.a = r[0]; AP.b = r[1]; var bar = AP.box.querySelector(".g-apbar"); if (bar) { bar.min = r[0]; bar.max = r[1]; }
    AP.box.querySelectorAll("[data-apseg]").forEach(function (x) { x.classList.add("g-btn-soft"); });
    apPlay(r[0]);
  });
  /* 🔖 danh sách mọi đoạn đã lưu (nghe lại theo Test) */
  async function apList() {
    var box = $("#t-statsbox");
    if (!box) { box = document.createElement("div"); box.id = "t-statsbox"; box.className = "g-tstats"; document.body.appendChild(box); }
    box.hidden = false;
    box.innerHTML = '<div class="g-tsin"><div class="g-h1row"><h2>' + esc(apT("list")) + '</h2><button class="g-btn g-btn-soft g-btn-sm" id="ts-close">✕</button></div><div id="ap-lplayer"></div><div id="ap-lbody">⏳</div></div>';
    var prevAP = AP && AP.meta ? AP : null;   /* thanh nghe ở 📖 Xem lại: trả lại sau khi đóng danh sách (QA) */
    var close = function () { apStop(); box.hidden = true; if (prevAP && prevAP.box.isConnected) AP = prevAP; };
    $("#ts-close").onclick = close; box.onclick = function (e) { if (e.target === box) close(); };
    var L = (await apMarks()).sort(function (x, y) { return String(x.test).localeCompare(String(y.test), "en", { numeric: true }) || x.num - y.num || x.a - y.a; });
    var body = $("#ap-lbody"); if (!body) return;
    if (!L.length) { body.innerHTML = '<p class="g-sub">' + esc(apT("none")) + "</p>"; return; }
    body.innerHTML = L.map(function (k, i) {
      return '<div class="g-aprow g-apm"><button type="button" class="g-btn g-btn-soft g-btn-sm" data-apl="' + i + '">▶ ' + esc(tName(k.test)) + " · Part " + k.part + " · " + esc(apT("qn")) + " " + k.num + " · " + apClock(k.b - k.a) + '</button><button type="button" class="g-btn g-btn-soft g-btn-sm" data-ap-ldel="' + esc(k.id) + '">✕</button></div>';
    }).join("");
    body.onclick = function (e) {
      var p = e.target.closest("[data-apl]"), d = e.target.closest("[data-ap-ldel]");
      if (p) { var k = L[+p.dataset.apl]; apMount($("#ap-lplayer"), { url: apUrl(k.test), segs: [{ label: apT("seg"), a: k.a, b: k.b }], meta: null }); apPlay(k.a); }
      if (d) apDel(d.dataset.apLdel);
    };
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("#t-marks, #l-tmarks, #rv-tmarks"); if (b) apList(); });
  /* 🔖 câu đề thi để dành làm lại: vocab_saves.word_id = "tq:<test>:<part>:<num>[-<num cuối nhóm>]" (+ bản trên máy tjwl_tqmarks_v1) */
  var LS_TQM = "tjwl_tqmarks_v1";
  function tqKey(q) { return "tq:" + q.test + ":" + q.part + ":" + q.num + (q.last && q.last !== q.num ? "-" + q.last : ""); }
  function tqLocal() { try { return JSON.parse(localStorage.getItem(LS_TQM) || "{}"); } catch (e) { return {}; } }
  async function tqMarks() {
    if (G.tqM) return G.tqM;
    var M = tqLocal();
    if (G.me) { try { var r = await sb.from("vocab_saves").select("word_id").eq("player_id", G.me.id).like("word_id", "tq:%"); (r.data || []).forEach(function (x) { M[x.word_id] = 1; }); } catch (e) {} }
    return (G.tqM = M);
  }
  async function tqSet(k, on) {
    var M = await tqMarks(), L = tqLocal(); if (on) { M[k] = 1; L[k] = 1; } else { delete M[k]; delete L[k]; }
    try { localStorage.setItem(LS_TQM, JSON.stringify(L)); } catch (e) {}
    if (!G.me) return;
    var p = k.split(":");
    try { if (on) await sb.from("vocab_saves").upsert({ player_id: G.me.id, word_id: k, test: p[1], part: +p[2] || null, num: parseInt(p[3], 10) || null }, { onConflict: "player_id,word_id" }); else await sb.from("vocab_saves").delete().eq("player_id", G.me.id).eq("word_id", k); } catch (e) {}
  }
  /* số câu đã để dành của 1 đề + các Part (nhóm Part 3–4 -> cả 3 câu) */
  async function tqNums(test, parts) {
    var M = await tqMarks(), out = {};
    Object.keys(M).forEach(function (k) { var p = k.split(":"); if (p[1] !== String(test) || parts.indexOf(+p[2]) < 0) return; var r = p[3].split("-").map(Number); for (var n = r[0]; n <= (r[1] || r[0]); n++) out[n] = 1; });
    return Object.keys(out).map(Number).sort(function (a, b) { return a - b; });
  }
  function tPassHTML(p, num) {
    if (!p) return "";
    var img = [], txt = String(p).split("\n").filter(function (l) { if (/^\[aud\]/.test(l)) return false; var m = l.match(/^\[img\]\s*(https:\/\/\S+)$/); if (m) img.push(m[1]); return !m; }).join("\n").trim();
    /* chỗ trống Part 6 "-------(131)" -> ô không xuống dòng giữa chừng, tô ô của CÂU ĐANG LÀM (QA v107) */
    var body = esc(txt).replace(/-{3,}\((\d+)\)/g, function (m, n) { return '<mark class="g-tblank' + (+n === +num ? " cur" : "") + '">(' + n + ")</mark>"; });
    /* Part 7 nhiều văn bản: nhãn "[Advertisement]" -> tiêu đề nhỏ ngăn cách từng văn bản */
    body = body.replace(/^\[([^\]\n]{2,40})\]\n?/gm, '<span class="g-tdoc">$1</span>');
    /* OCR ghi chú định dạng bằng chữ "7:00 A.M. (underlined)" -> gạch chân thật (TJ 2026-10-04: thấy lạ) */
    body = body.replace(/([^\n—–]*?\S)\s*\((underlined|bold|bolded|in bold|italic|italics|circled|highlighted)\)/gi, function (m, t, k) { k = k.toLowerCase(); return /under/.test(k) ? "<u>" + t + "</u>" : /ital/.test(k) ? "<i>" + t + "</i>" : "<b>" + t + "</b>"; });
    return (txt ? '<div class="g-tpass">' + body + "</div>" : "") + img.map(function (u) { return '<img class="g-timg" alt="" src="' + esc(u) + '">'; }).join("");
  }
  /* 📐 ảnh đề vừa KHÍT màn hình đang dùng (TJ 2026-10-04: "tuỳ kích cỡ màn hình mà phải phù hợp"): đo chỗ trống thật
     = cao màn hình − phần phía trên ảnh − câu hỏi + 4 nút bên dưới. Không đủ chỗ (điện thoại, bảng vẽ đang mở) thì tính
     sau khi đã cuộn tới đề. Đo lại khi ảnh tải xong / xoay máy / đổi cỡ cửa sổ. */
  function fitTImg() {
    $$(".g-timg").forEach(function (img) {
      if (!img.offsetParent) return;
      var box = img.closest(".g-qvi") || img.parentNode, card = box.parentNode;
      var below = 0, sib = img.nextElementSibling; while (sib) { below += sib.offsetHeight; sib = sib.nextElementSibling; }
      var ops = card && card.querySelector(".g-opts"), rv = card && card.querySelector("#p-reveal");
      var sub1 = card && card.querySelector(".g-tsub");   /* nhóm 3 câu (hình "Look at the graphic"): chỉ chừa chỗ cho câu đầu, không ép hình còn 120px (QA thiết kế) */
      var after = sub1 ? sub1.offsetHeight + 28 : ops ? ops.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom + 28 : 0;   /* tới hết 4 nút + 1 dòng thông báo (Xem lại: không tính lời giải dài bên dưới) */
      if (rv && !rv.hidden) after += rv.offsetHeight + 8;   /* host 🎧 theo audio: nút "Câu tiếp ▶" */
      var docTop = img.getBoundingClientRect().top + window.scrollY, boxTop = box.getBoundingClientRect().top + window.scrollY;
      var need = below + after + 24, vh = window.innerHeight;
      var h = vh - docTop - need;                       /* vừa ngay không cần cuộn */
      if (h < 180) h = vh - (docTop - boxTop) - need;   /* không đủ -> vừa sau khi cuộn tới đề */
      img.style.maxHeight = Math.max(120, Math.round(h)) + "px";
    });
  }
  window.addEventListener("resize", function () { clearTimeout(G.fitT); G.fitT = setTimeout(fitTImg, 150); });
  /* 🔍 chạm hình đề -> phóng to cả màn hình (kéo 2 ngón để zoom), chạm lần nữa để đóng */
  document.addEventListener("click", function (e) {
    var im = e.target.closest && e.target.closest(".g-timg"); if (!im) return;
    var lb = document.createElement("div"); lb.className = "g-lbox"; lb.innerHTML = '<img alt="" src="' + esc(im.src) + '"><button type="button" class="g-lbx" aria-label="Đóng">✕</button>';
    lb.addEventListener("click", function () { lb.remove(); }); document.body.appendChild(lb);
  });
  document.addEventListener("load", function (e) { if (e.target && e.target.classList && e.target.classList.contains("g-timg")) fitTImg(); }, true);
  function paintQuestion(q, hintEl, textEl, optsEl) {
    if (q.aud) Object.assign(G.audioMap, q.aud);
    /* câu mới HIỆN DẦN (0.16s) thay vì bật ra đột ngột — điện thoại đỡ cảm giác giật khi đổi câu (TJ 2026-10-02) */
    [textEl, optsEl].forEach(function (sel) { var el = $(sel); if (!el) return; el.classList.remove("g-in"); void el.offsetWidth; el.classList.add("g-in"); });
    $(hintEl).textContent = T(QHINT[q.type] || "q_meaning");
    var mine = optsEl === "#p-opts";
    if (mine) { $("#p-saywrap").hidden = q.type !== "dict" && q.type !== "listen"; $("#p-res").innerHTML = ""; paintSoundBtn(); paintReplay(q); }
    var oe0 = $(optsEl); if (oe0) oe0.classList.toggle("g-tbook", q.type === "toeic");   /* 📖 đề thi: đáp án xếp dọc như sách (TJ 2026-10-04) */
    if (q.type === "toeic") {
      var tc = tCue(q);
      if (q.subs) {   /* 🎧 nhóm 3 câu Part 3–4 */
        document.body.classList.remove("g-tahead");
        $(textEl).innerHTML = tPassHTML(q.passage, q.num) +
          (tc ? '<div class="g-row g-center"><button type="button" class="g-btn g-btn-soft g-btn-sm g-taud" data-tcue="' + esc(tc.url + "|" + tc.q.join("-") + "|" + (tc.g ? tc.g.join("-") : "")) + '">🔊 ' + esc(T("t_listen")) + "</button></div>" : "");
        if (mine) $("#p-type").hidden = true;
        $(optsEl).innerHTML = q.subs.map(function (sq, i) {
          return '<div class="g-tsub"><div class="g-tstem"><b class="g-tnum">' + sq.num + ".</b> " + esc(sq.sent) + '</div><div class="g-tsubopts">' +
            sq.opts.map(function (o) { return '<button class="g-opt g-topt" data-sub="' + i + '" data-opt="' + esc(o) + '"><span class="g-otext">' + esc(o) + "</span></button>"; }).join("") + "</div></div>";
        }).join("") + (optsEl === "#p-opts" && ((q.nxt || []).length || (G.st && G.st.mode === "free")) ? '<div class="g-row g-center"><button type="button" class="g-btn g-btn-soft g-btn-sm" id="p-tskip">' + ((q.nxt || []).length ? "⏭ " + esc(T("t_skipg")) : "✓ " + esc(T("t_doneg"))) + "</button></div>" : "") + ((q.nxt || []).length ? '<div class="g-tnext" hidden><div class="g-sub">👀 ' + esc(T("t_next")) + "</div>" +
          q.nxt.map(function (x) { return '<div class="g-tnq"><b>' + x.num + ".</b> " + esc(x.sent) + "<small>" + x.opts.map(esc).join(" · ") + "</small></div>"; }).join("") + "</div>" : "");
        var pk0 = q.picks || (optsEl === "#p-opts" ? G.myPicks : null) || [];
        pk0.forEach(function (c, i) { if (c != null) $$(optsEl + ' .g-opt[data-sub="' + i + '"]').forEach(function (x) { x.classList.toggle("g-picked", norm(x.dataset.opt) === norm(c)); }); });
        var pk = (G.st && G.st.matchId || "") + ":" + q.num + ":" + (q.qn || "");
        if (mine && tc && G.st && G.st.tplay && pk !== G.tPlayedQn) { G.tPlayedQn = pk; tAutoPlay(q); }
        else if (mine && !(tc && G.st && G.st.tplay)) { setTimeout(tShowNext, 0); if (G.st && G.st.mode === "free" && !G.st.race) G.tQEnd = Date.now() + ((T_SEC[q.part] || 30) * q.subs.length + 45) * 1000; }
        return;
      }
      $(textEl).innerHTML = tPassHTML(q.passage, q.num) +
        (tc ? '<div class="g-row g-center"><button type="button" class="g-btn g-btn-soft g-btn-sm g-taud" data-tcue="' + esc(tc.url + "|" + tc.q.join("-") + "|" + (tc.g ? tc.g.join("-") : "")) + '">🔊 ' + esc(T("t_listen")) + "</button></div>" : "") +
        '<span class="g-gapline g-tstem"><b class="g-tnum">' + esc(q.num) + ".</b> " + esc(q.sent).replace("_______", '<span class="g-blank" style="width:4em"></span>') + "</span>";
      if (mine) $("#p-type").hidden = true;
      if (mine && window.innerWidth < 1100) { var qv = $(textEl); setTimeout(function () { qv.scrollIntoView({ block: "start", behavior: "smooth" }); }, 50); }   /* điện thoại: bảng điểm chiếm ~410px -> cuộn tới đề để thấy A–D (QA v109) */
      setTimeout(fitTImg, 0);
      var pk = (G.st && G.st.matchId || "") + ":" + q.num + ":" + (q.qn || ""); if (mine && tc && G.st && G.st.tplay && pk !== G.tPlayedQn) { G.tPlayedQn = pk; tAutoPlay(q); }
      $(optsEl).innerHTML = (q.opts || []).map(function (o) { return '<button class="g-opt g-topt" data-opt="' + esc(o) + '"><span class="g-otext">' + esc(o) + '</span><span class="g-pickers"></span></button>'; }).join(""); markLongOpts(optsEl);
      return;
    }
    if (q.type === "sheet") {
      $(textEl).innerHTML = sheetHTML(q, mine);
      $(optsEl).innerHTML = mine ? '<button class="g-btn" id="p-sheetgo" type="button">' + T("submit_sheet") + "</button>" : "";
      if (mine) $("#p-type").hidden = true;
      return;
    }
    if (q.type === "dict" || q.type === "write") {
      $(textEl).textContent = q.type === "dict" ? "🎧" : "✍️ " + q.term + "  —  " + myText(q);
      if (q.type === "write") $(textEl).insertAdjacentHTML("beforeend", lvBadge(q.lv));
      $(optsEl).innerHTML = "";
      if (mine) { $("#p-type").hidden = false; var ti = $("#p-typein"); ti.value = ""; ti.disabled = false; $("#p-typego").disabled = false; ti.placeholder = T(q.type === "dict" ? "dict_ph" : "write_ph"); if (iPlay()) ti.focus(); }
      return;
    }
    if (mine) { var ti0 = $("#p-typein"); ti0.placeholder = T(tgt() === "zh" ? "type_ph_zh" : "type_ph"); ti0.lang = tgt() === "en" ? "en" : tgt(); }
    /* 🕵️ 4 dạng nhớ chunk */
    var zhT = tgt() === "zh", optBtn = function (o, text) { return '<button class="g-opt" data-opt="' + esc(o) + '"' + (zhT && hasZh(text) ? ' data-zh="' + esc(text) + '"' : "") + '><span class="g-otext">' + esc(text) + '</span><span class="g-pickers"></span></button>'; };
    if (q.type === "order") {
      $(textEl).innerHTML = '<span class="g-gapline">' + esc(myText(q)) + "</span>";
      if (mine) $("#p-type").hidden = true;
      $(optsEl).innerHTML = '<div class="g-ordline" data-sep="' + esc(q.sep || "") + '"></div><div class="g-tiles">' + (q.tiles || []).map(function (t, i) {
        return '<button type="button" class="g-tile" data-i="' + i + '"' + (zhT ? ' data-zh="' + esc(t) + '"' : "") + "><span>" + esc(t) + "</span></button>"; }).join("") + "</div>" +
        (mine ? '<div class="g-row g-center"><button type="button" class="g-btn g-btn-soft g-btn-sm" id="p-ordreset">↺ ' + esc(T("redo")) + "</button></div>" : "");
      decoratePy($(textEl).parentNode); ordFix(); requestAnimationFrame(ordFix); setTimeout(ordFix, 400); return;   /* đo lại khi khung đã hiện + pinyin nạp xong */
    }
    if (q.type === "chunk") {
      $(textEl).innerHTML = '<span class="g-gapline"' + (zhT && hasZh(q.sent) ? ' data-zh="' + esc(String(q.sent).replace("{{GAP}}", "＿＿")) + '"' : "") + '>' + esc(q.sent).replace("{{GAP}}", '<span class="g-blank" style="width:' + (Math.max(3, String(q.ans || "").length) * 0.55).toFixed(1) + 'em"></span>') + "</span>" +
        '<small class="g-qmean">' + esc(myText(q)) + "</small>";
      if (mine) $("#p-type").hidden = true;
      $(optsEl).innerHTML = (q.opts || []).map(function (o) { return optBtn(o, o); }).join("");
      decoratePy($(textEl).parentNode); return;
    }
    if (q.type === "listen") {
      $(textEl).innerHTML = '<span class="g-listen">🎧</span>';
      if (mine) { $("#p-type").hidden = true; speakQ(q, "q"); }
      var ml3 = effLang(mine ? G.myLang : "room", G.st, "en2m");
      $(optsEl).innerHTML = (q.opts || []).map(function (o) { var m = (q.optTexts || {})[o] || {}; return optBtn(o, m[ml3] || m.en || m.vi || o).replace(/ data-zh="[^"]*"/, ""); }).join("");
      return;
    }
    if (q.type === "polite") {
      $(textEl).innerHTML = '<span class="g-gapline"><b class="g-reg">' + REG_ICON[q.reg] + " " + esc(T("reg_" + q.reg)) + '</b></span><small class="g-qmean">' + esc(myText(q)) + (q.ctx ? " · ☀ " + esc(q.ctx) : "") + "</small>";
      if (mine) $("#p-type").hidden = true;
      $(optsEl).innerHTML = (q.opts || []).map(function (o) { return optBtn(o, o); }).join("");
      decoratePy($(textEl).parentNode); return;
    }
    if (q.type === "en2m") {   /* từ tiếng Anh to ở trên, 4 nghĩa theo tiếng của người xem (data-opt vẫn là từ để chấm) */
      var ml = effLang(mine ? G.myLang : "room", G.st, "en2m");
      $(textEl).innerHTML = (tgt() === "zh" ? '<span class="g-zhw" data-zh="' + esc(q.word) + '"><span>' + esc(q.word) + "</span></span>" : esc(q.word)) + lvBadge(q.lv);
      if (mine) { $("#p-type").hidden = true; speakQ(q, "q"); }
      $(optsEl).innerHTML = q.opts.map(function (o) {
        var m = (q.optTexts || {})[o] || {}, t = m[ml] || m.en || m.vi || o;
        return '<button class="g-opt" data-opt="' + esc(o) + '"><span class="g-otext">' + esc(t) + '</span><span class="g-pickers"></span></button>';
      }).join("");
      decoratePy($(textEl).parentNode); markLongOpts(optsEl);
      return;
    }
    /* bọc cả câu trong 1 span: .g-qvi là flex -> trước đây chữ trước/ô trống/chữ sau thành 3 cột rời, lủng khoảng lớn.
       Ô trống dài đúng bằng từ cần điền (q.len ký tự) */
    if (q.type === "gap") $(textEl).innerHTML = '<span class="g-gapline">' + esc(q.sent).replace("{{GAP}}", '<span class="g-blank" style="width:' + (Math.max(3, q.len || 6) * 0.55).toFixed(1) + 'em"></span>') + lvBadge(q.lv) + "</span>";
    else { $(textEl).textContent = myText(q) + (q.type === "recall" && q.len ? "  (" + q.len + ")" : ""); $(textEl).insertAdjacentHTML("beforeend", lvBadge(q.lv)); }
    if (q.type === "recall") {
      $(optsEl).innerHTML = "";
      if (optsEl === "#p-opts") { $("#p-type").hidden = false; var inp = $("#p-typein"); inp.value = ""; inp.disabled = false; $("#p-typego").disabled = false; if (iPlay()) inp.focus(); }
    } else {
      if (optsEl === "#p-opts") $("#p-type").hidden = true;
      var zh = tgt() === "zh";
      $(optsEl).innerHTML = q.opts.map(function (o) { return '<button class="g-opt" data-opt="' + esc(o) + '"' + (zh ? ' data-zh="' + esc(o) + '"' : "") + '><span class="g-otext">' + esc(o) + '</span><span class="g-pickers"></span></button>'; }).join("");
    }
    decoratePy($(textEl).parentNode); markLongOpts(optsEl);
  }
  /* ---------- 📖 XEM LẠI ĐÁP ÁN (TJ 2026-10-01: "chơi xong phải để người chơi xem lại tất cả đáp án") ----------
     Mỗi máy tự ghi lại câu hỏi NGAY LÚC LỘ ĐÁP ÁN (chụp khung câu hỏi đang hiện: đúng/sai đã tô màu, ai chọn gì),
     không cần server. Hết ván -> nút "📖 Xem lại đáp án" trên màn kết quả, ◀ ▶ (hoặc phím ← →) đi từng câu. */
  G.log = []; G.logMatch = null;
  /* lưu phần xem lại vào bộ nhớ TAB (sessionStorage): lỡ tải lại trang vẫn xem tiếp được */
  var SS_REVIEW = "tjwl_game_review_v1";
  function saveLog() { try { sessionStorage.setItem(SS_REVIEW, JSON.stringify({ m: G.logMatch, log: G.log })); } catch (e) {} }
  try { var sv = JSON.parse(sessionStorage.getItem(SS_REVIEW) || "null"); if (sv && sv.log && sv.log.length) { G.log = sv.log; G.logMatch = sv.m; } } catch (e) {}
  /* ván mới: xoá cả trí nhớ "đã đọc câu số n" — trước đây Kahoot ván 2 đánh số lại từ 1 nên tưởng đã đọc rồi, im luôn */
  function logStart(s) { var k = s.matchId || s.started || "m"; if (G.logMatch !== k) { G.logMatch = k; G.log = []; spoke = {}; saveLog(); } }
  function logQ(q, mine, ok) {
    try {
      var vi = $("#p-vi").cloneNode(true), orig = $$("#p-vi select");
      vi.querySelectorAll("select").forEach(function (c, i) {   /* ô chọn của phiếu: bản sao mất giá trị đã chọn -> đổi thành chữ */
        var o = orig[i], sp = document.createElement("span");
        sp.className = "g-selv " + (o.classList.contains("ok") ? "ok" : o.classList.contains("bad") ? "bad" : "");
        sp.textContent = o.value || "—"; c.replaceWith(sp);
      });
      if (typeof q.ans === "string") vi.querySelectorAll(".g-blank").forEach(function (b) { b.outerHTML = '<b class="g-fill">' + esc(q.type === "toeic" ? q.ans.replace(/^\([A-D]\)\s*/, "") : q.ans) + "</b>"; });
      var opts = $("#p-opts").cloneNode(true);
      opts.querySelectorAll("#p-sheetgo, #p-tskip, .g-tnext").forEach(function (b) { var r = b.closest(".g-row") || b; r.remove(); });   /* Xem lại: bỏ nút ⏭ và phần xem trước nhóm sau */
      opts.querySelectorAll(".g-opt").forEach(function (b) {
        b.classList.remove("g-picked");   /* 🎯 đề thi: dấu "đã chọn" lúc làm đè mất màu xanh/đỏ ở Xem lại (QA v95 T2) */
        b.disabled = true;
        if (q.subs && b.dataset.sub != null) { var si = +b.dataset.sub, sq = q.subs[si], mc = (mine || [])[si]; if (sq && sq.ans && norm(b.dataset.opt) === norm(sq.ans)) b.classList.add("ok"); else if (mc != null && norm(b.dataset.opt) === norm(mc)) b.classList.add("bad"); }
        else if (q.pend) { if (mine != null && norm(b.dataset.opt) === norm(mine)) b.classList.add("g-mine"); }
        else if (typeof q.ans === "string" && norm(b.dataset.opt) === norm(q.ans)) b.classList.add("ok");
        else if (mine != null && norm(b.dataset.opt) === norm(mine)) b.classList.add("bad");
      });
      if (q.traps) opts.querySelectorAll(".g-opt").forEach(function (b) {   /* 🪤 đáp án bẫy: gắn nhãn loại; bẫy NGƯỜI CHƠI đã chọn thì tô đậm + nói rõ dính bẫy gì */
        var tr = q.traps[norm(b.dataset.opt)]; if (!tr) return;
        var L0 = uiLang(), lab = (TRAP_LAB[L0] || TRAP_LAB.vi)[tr.k] || tr.k, tg = document.createElement("span");
        tg.className = "g-trapk"; tg.textContent = lab; b.appendChild(tg); b.classList.add("g-trapo");
        if (mine != null && norm(b.dataset.opt) === norm(mine)) {
          b.classList.add("g-trapped");
          var wy = document.createElement("div"); wy.className = "g-trapwhy";
          wy.textContent = "🪤 " + (TRAP_HIT[L0] || TRAP_HIT.vi) + ": " + lab + (tr.why && L0 === "vi" ? " — " + tr.why : "");
          b.insertAdjacentElement("afterend", wy);
        }
      });
      var typed = q.type === "recall" || q.type === "dict" || q.type === "write";
      G.log.push({ hint: $("#p-hint").textContent, vi: vi.innerHTML, opts: opts.innerHTML, msg: q.subs ? "✓ " + q.subs.filter(function (sq, i) { return (mine || [])[i] != null && norm(mine[i]) === norm(sq.ans); }).length + "/" + q.subs.length : q.type === "toeic" ? (mine == null ? T("t_skip") : q.pend ? "📝 " + T("t_pend", { a: mine }) : ok ? "✓ " + T("t_right") : "✗ " + T("t_wrong")) : $("#p-msg").textContent.split("  ·  " + T("wait_nextq")).join(""), res: q.type === "toeic" ? (q.pend ? '<div class="g-sub">⏳ ' + esc(T("t_nokey")) + "</div>" : toeicExpl(q)) : $("#p-res").innerHTML,
                   mine: typed ? (mine == null ? "" : String(mine)) : null, ans: typeof q.ans === "string" ? q.ans : "", ok: !!ok, typed: typed, played: iPlay(),
                   wid: q.type === "sheet" ? null : q.wid, tg: tgt() !== "en" ? tgt() : null, sl: q.type === "dict" ? "en" : tgt(),
                   tq: q.type === "toeic" ? { test: q.test || (G.st && G.st.test && G.st.test.test), part: q.part || (G.st && G.st.test && G.st.test.part), num: q.num, vocab: q.vocab || [], full: toeicFull(q), gEnd: q.gEnd || null, last: q.subs ? q.subs[q.subs.length - 1].num : q.num, nums: q.subs ? q.subs.map(function (x) { return x.num; }) : null } : null,
                   say: q.type === "toeic" ? toeicFull(q) : q.type === "dict" ? q.say || q.ans : q.type === "en2m" ? baseTerm(q.word) : q.type === "write" ? baseTerm(q.term) : typeof q.ans === "string" ? baseTerm(q.ans) : "" });
      saveLog();
    } catch (e) { console.warn("logQ", e); }
  }
  /* ---------- 🎯 ĐỀ THI · TỪ VỰNG Ở 📖 XEM LẠI (TJ 2026-10-03) ----------
     · "📝 Từ vựng cần học" ghi sẵn từng câu (test_items.vocab) — nghĩa tiếng mẹ đẻ TRƯỚC rồi tiếng Anh, 🔊, ⭐ lưu.
     · Chạm từ trong câu để chọn 1 từ / nhiều từ LIỀN NHAU -> tra nghĩa (Gemini, miễn phí) -> ⭐ lưu.
     · Lưu = KHO CHUNG WordLoop (words, Hub "TJ" › Notebook "📝 Từ vựng đề thi TOEIC" › Test › Part › Block 10 từ, không trùng chữ)
       + SỔ RIÊNG vocab_saves (ai lưu từ nào); hồ sơ TJ -> word_progress.bookmarked (vào ⭐ Ôn riêng). */
  var TV = { hub: "hub_toeic_hub", nb: "nb_toeic_examvocab" };
  function tvSlug(t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60); }
  function tvMeanHTML(v) {
    var L = effLang(G.myLang, G.st, "toeic"), a = [];
    if (L !== "en" && v[L]) a.push((FLAG[L] || "") + " " + esc(v[L]));
    if (v.en) a.push((L !== "en" && v[L] ? FLAG.en + " " : "") + esc(v.en));
    return a.join('<br>');
  }
  function tvSavedSet() { return G.tvSaved || (G.tvSaved = {}); }
  async function tvLoadSaved() {
    if (G.tvLoaded || !G.me) return; G.tvLoaded = true;
    try { var r = await sb.from("vocab_saves").select("word_id").eq("player_id", G.me.id); (r.data || []).forEach(function (x) { tvSavedSet()[x.word_id] = 1; }); } catch (e) {}
  }
  function paintTVocab(L) {
    var q = L.tq, box = $("#rv-res"); if (!box) return;
    if (!(q.vocab || []).length && !$("#rv-vi .g-tstem")) return;   /* Listening nhóm/Part 1–2: không có từ vựng lẫn câu để chạm -> khỏi hộp trống (QA) */
    var list = (q.vocab || []).map(function (v, i) {
      var on = tvSavedSet()["toe_w_" + tvSlug(v.t)];
      return '<div class="g-tvrow"><button type="button" class="g-tvstar' + (on ? " on" : "") + '" data-tv="' + i + '" title="Lưu để học">' + (on ? "★" : "☆") + '</button>' +
        '<div class="g-tvw"><b>' + esc(v.t) + "</b> " + (v.pos ? '<span class="g-sub">(' + esc(v.pos) + ")</span> " : "") + spk(v.t, "en") + '<div class="g-tvm">' + tvMeanHTML(v) + "</div></div></div>";
    }).join("");
    box.insertAdjacentHTML("beforeend", '<div class="g-tvbox"><div class="g-tvh">📝 ' + esc(T("tv_h")) + '</div>' + list +
      '<div class="g-sub g-tvtip">👆 ' + esc(T("tv_tip")) + '</div><div class="g-tvsel" id="rv-tvsel" hidden></div></div>');
    /* chạm chọn từ trong câu */
    var stem = $("#rv-vi .g-tstem"); if (stem) wrapWords(stem);
    setTimeout(fitTImg, 0);
    tvLoadSaved().then(function () { $$("#rv-res .g-tvstar").forEach(function (b) { var v = (q.vocab || [])[+b.dataset.tv]; if (v && tvSavedSet()["toe_w_" + tvSlug(v.t)]) { b.classList.add("on"); b.textContent = "★"; } }); });
  }
  function wrapWords(el) {
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walk.nextNode())) if (!n.parentNode.closest(".g-tnum,.g-spk")) nodes.push(n);
    var idx = 0;
    nodes.forEach(function (t) {
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var m = part.match(/^([^A-Za-z0-9'’-]*)([A-Za-z0-9'’-]+)([^A-Za-z0-9'’-]*)$/);
        if (!m) { frag.appendChild(document.createTextNode(part)); return; }
        if (m[1]) frag.appendChild(document.createTextNode(m[1]));
        var sp = document.createElement("span"); sp.className = "g-w"; sp.dataset.wi = idx++; sp.textContent = m[2]; frag.appendChild(sp);
        if (m[3]) frag.appendChild(document.createTextNode(m[3]));
      });
      t.parentNode.replaceChild(frag, t);
    });
  }
  var tvSel = [];
  function tvPick(w) {
    var i = +w.dataset.wi;
    if (tvSel.length && (i === tvSel[0] - 1 || i === tvSel[tvSel.length - 1] + 1)) { tvSel.push(i); tvSel.sort(function (a, b) { return a - b; }); }
    else if (tvSel.length === 1 && tvSel[0] === i) tvSel = [];
    else if (tvSel.indexOf(i) >= 0) tvSel = tvSel.filter(function (x) { return x !== i && x < i; });   /* chạm từ đang chọn -> cắt cụm tới trước từ đó */
    else tvSel = [i];
    $$("#rv-vi .g-w").forEach(function (x) { x.classList.toggle("sel", tvSel.indexOf(+x.dataset.wi) >= 0); });
    var phrase = tvSel.map(function (k) { var e = $('#rv-vi .g-w[data-wi="' + k + '"]'); return e ? e.textContent : ""; }).join(" ").trim();
    var bar = $("#rv-tvsel"); if (!bar) return;
    if (!phrase) { bar.hidden = true; return; }
    bar.hidden = false; bar.dataset.t = phrase;
    bar.innerHTML = '<div><b>“' + esc(phrase) + '”</b> ' + spk(phrase, "en") + ' <button type="button" class="g-btn g-btn-sm" id="rv-tvsave">⭐ ' + esc(T("tv_save")) + '</button> <button type="button" class="g-btn g-btn-soft g-btn-sm" id="rv-tvx">✕</button></div><div class="g-tvm" id="rv-tvmean">⏳</div>';
    tvLookup(phrase).then(function (v) { if (bar.dataset.t !== phrase) return; bar._v = v; $("#rv-tvmean").innerHTML = v ? tvMeanHTML(v) + (v.pos ? ' <span class="g-sub">(' + esc(v.pos) + ")</span>" : "") : esc(T("tv_nomean")); });
  }
  var tvCache = {};
  async function tvLookup(t) {
    var k = t.toLowerCase(); if (tvCache[k]) return tvCache[k];
    var L = effLang(G.myLang, G.st, "toeic"), langs = ["vi", "en"].concat(L !== "vi" && L !== "en" ? [L] : []);
    try {
      var ctx = (G.rv || G.log)[rvI] && (G.rv || G.log)[rvI].tq ? (G.rv || G.log)[rvI].tq.full : "";
      var res = await fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/gemini-proxy", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY, "apikey": cfg.SUPABASE_ANON_KEY },
        body: JSON.stringify({ model: cfg.GEMINI_MODEL || "gemini-3.5-flash-lite", user_id: null, block_id: null, sys: "You are a concise bilingual dictionary for TOEIC learners. Reply JSON only.",
          user: "Word/phrase: " + JSON.stringify(t) + ". Sentence: " + JSON.stringify(ctx) + ". Give its meaning IN THIS SENTENCE. Return JSON {\"pos\":\"n|v|adj|adv|phr|…\",\"en\":\"short English definition\"" + langs.filter(function (l) { return l !== "en"; }).map(function (l) { return ",\"" + l + "\":\"short meaning in " + LANG_NAME[l] + "\""; }).join("") + "}" }) });
      var d = await res.json(), raw = d.candidates && d.candidates[0] && d.candidates[0].content.parts[0].text;
      var v = JSON.parse(String(raw || "").replace(/^```(json)?|```$/g, "").trim()); v.t = t; tvCache[k] = v; return v;
    } catch (e) { return null; }
  }
  /* 🔍 tra nghĩa ngay trên bảng (chạm từ trong bài đọc / gõ vào ô tra): Gemini qua gemini-proxy, nghĩa theo tiếng giao diện + định nghĩa tiếng Anh, nhớ theo từ+câu */
  var blCache = {};
  async function boardLookup(t, ctx) {
    var L = uiLang(), k = t.toLowerCase() + "|" + L + "|" + String(ctx || "").slice(0, 60); if (blCache[k]) return blCache[k];
    var langs = L !== "en" ? [L] : [];
    try {
      var res = await fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/gemini-proxy", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY, "apikey": cfg.SUPABASE_ANON_KEY },
        body: JSON.stringify({ model: cfg.GEMINI_MODEL || "gemini-3.5-flash-lite", user_id: null, block_id: null, sys: "You are a concise bilingual dictionary for English learners. Reply JSON only.",
          user: "Word/phrase: " + JSON.stringify(t) + (ctx ? ". Paragraph: " + JSON.stringify(String(ctx).slice(0, 700)) : "") + ". Give its meaning" + (ctx ? " IN THIS PARAGRAPH" : "") + ". Return JSON {\"pos\":\"n|v|adj|adv|phr|…\",\"en\":\"short English definition\"" + langs.map(function (l) { return ",\"" + l + "\":\"short meaning in " + LANG_NAME[l] + "\""; }).join("") + "}" }) });
      var d = await res.json(), raw = d.candidates && d.candidates[0] && d.candidates[0].content.parts[0].text;
      var v = JSON.parse(String(raw || "").replace(/^```(json)?|```$/g, "").trim()); blCache[k] = v; return v;
    } catch (e) { return null; }
  }
  async function tvEnsureTree(test, part) {
    var sec = "toe_ex_t" + test, pg = sec + "_p" + part, bt = pg + "_b";
    var rows = [["notebooks", { id: TV.nb, hub_id: TV.hub, name: "📝 Từ vựng đề thi TOEIC", sort: 99, visibility: "everyone" }],
      ["sections", { id: sec, notebook_id: TV.nb, name: "Test " + test, sort: +test || 0 }],
      ["pages", { id: pg, section_id: sec, name: "Part " + part, sort: +part || 0 }],
      ["batches", { id: bt, page_id: pg, name: "Từ đã lưu", sort: 0, created_at: Date.now() }]];
    for (var i = 0; i < rows.length; i++) { var r = await sb.from(rows[i][0]).upsert(rows[i][1], { onConflict: "id", ignoreDuplicates: true }); if (r.error) throw r.error; }
    return bt;
  }
  async function tvBlockFor(bt) {   /* Block CUỐI của Part còn chỗ (<10 từ), hết chỗ thì mở Block mới */
    var bl = await sb.from("blocks").select("id,sort").eq("batch_id", bt).order("sort");
    var last = (bl.data || []).slice(-1)[0];
    if (last) { var c = await sb.from("words").select("id", { count: "exact", head: true }).eq("block_id", last.id); if ((c.count || 0) < 10) return last.id; }
    var all = await sb.from("blocks").select("id", { count: "exact", head: true }).like("id", "toe_ex_%");
    var n = (bl.data || []).length + 1, id = bt.replace(/_b$/, "") + "_bl" + n;
    var r = await sb.from("blocks").insert({ id: id, batch_id: bt, name: "Block " + ((all.count || 0) + 1), global_index: (all.count || 0) + 1, sort: n });
    if (r.error) throw r.error; return id;
  }
  async function tvSave(v, test, part, num) {
    if (!G.me || !v || !v.t) return false;
    var wid = "toe_w_" + tvSlug(v.t);
    var ex = await sb.from("words").select("id").eq("id", wid).maybeSingle();
    if (!ex.data) {   /* kho CHUNG: mỗi chữ 1 dòng, lưu lần đầu thì tạo vào đúng Test/Part */
      var bt = await tvEnsureTree(test || "?", part || 0), blk = await tvBlockFor(bt);
      var w = await sb.from("words").insert({ id: wid, block_id: blk, term: v.t, pos: v.pos || null, meaning_vi: v.vi || null, def_en: v.en || null, meaning_zh: v.zh || null, meaning_es: v.es || null, sort: Date.now() % 100000 });
      if (w.error && !/duplicate/i.test(w.error.message)) throw w.error;
    }
    var s1 = await sb.from("vocab_saves").upsert({ player_id: G.me.id, word_id: wid, test: String(test || ""), part: +part || null, num: +num || null }, { onConflict: "player_id,word_id" });
    if (s1.error) throw s1.error;
    var uid = progUid();   /* TJ -> ⭐ Ôn riêng */
    if (uid) { var bp = await sb.from("word_progress").upsert({ user_id: uid, word_id: wid, bookmarked: true }, { onConflict: "user_id,word_id" }); if (bp.error) console.warn("bookmark", bp.error); }
    tvSavedSet()[wid] = 1;
    return true;
  }
  document.addEventListener("click", async function (e) {
    if ($("#s-review").hidden) return;
    var L = (G.rv || G.log)[rvI]; if (!L || !L.tq) return;
    var w = e.target.closest("#rv-vi .g-w"); if (w) return tvPick(w);
    if (e.target.closest("#rv-tvx")) { tvSel = []; $$("#rv-vi .g-w.sel").forEach(function (x) { x.classList.remove("sel"); }); $("#rv-tvsel").hidden = true; return; }
    var st = e.target.closest(".g-tvstar"), sv = e.target.closest("#rv-tvsave");
    if (!st && !sv) return;
    var btn = st || sv, v = st ? (L.tq.vocab || [])[+st.dataset.tv] : ($("#rv-tvsel")._v || { t: $("#rv-tvsel").dataset.t });
    if (!v || btn.disabled) return;
    btn.disabled = true; var old = btn.textContent; btn.textContent = "…";
    try { await tvSave(v, L.tq.test, L.tq.part, L.tq.num); btn.textContent = st ? "★" : "✓ " + T("tv_saved"); btn.classList.add("on"); }
    catch (er) { console.warn("tvSave", er); btn.textContent = old; btn.disabled = false; alert(T("tv_err")); }
  });

  var rvI = 0;
  function rvCur() { return (G.rv || G.log)[rvI]; }
  /* G.rv = danh sách đang xem: ván vừa chơi (G.log) hoặc 1 ván cũ trong 📜 Lịch sử (pastReview) */
  function renderReview(i, list) {
    var rp = $("#rv-replay"); if (rp) rp.hidden = !(G.isHost && G.room && G.st && G.st.phase !== "play" && (G.rvFrom === "end" || (G.rvMatch && G.rvMatch.qtype !== "toeic")));   /* 🔁 ván cũ đề thi: chưa lưu đề/Part nên không chơi lại được */
    if (list) G.rv = list;
    var R = G.rv || G.log;
    if (!R.length) return;
    G.inHist = true;   /* phòng gửi trạng thái cũng không kéo khỏi màn này (xem onState) */
    rvI = Math.max(0, Math.min(R.length - 1, i));
    var L = R[rvI];
    show("s-review");
    $("#rv-pos").textContent = (rvI + 1) + " / " + R.length;
    $("#rv-prev").disabled = rvI === 0; $("#rv-next").disabled = rvI === R.length - 1;
    paintStar(L);
    $("#rv-back").textContent = G.rvFrom === "hist" ? T("back_hist") : T("back_res");
    $("#rv-hint").textContent = L.hint; $("#rv-vi").innerHTML = L.vi; $("#rv-opts").innerHTML = L.opts; $("#rv-opts").classList.toggle("g-tbook", !!L.tq); if (L.tq) tqPickAvatars(L); $("#rv-hint").hidden = !!L.tq; $$("#rv-vi .g-taud").forEach(function (x) { var r = x.closest(".g-row") || x; r.hidden = true; }); $("#rv-res").innerHTML = L.res; $("#rv-msg").textContent = L.msg;
    /* 🔊 nghe lại (TJ 2026-10-02): nút cạnh ◀ ▶ + loa nhỏ ngay sau từ đúng; đang bật tiếng thì sang câu tự đọc */
    $("#rv-say").hidden = !L.say || !!(L.tq && /\[aud\]/.test(L.tq.full || "")); $("#rv-say").dataset.say = L.say || ""; $("#rv-say").dataset.sl = L.sl || "en";
    $$("#rv-vi .g-fill").forEach(function (f) { if (L.say && !L.tq) f.insertAdjacentHTML("afterend", spk(L.say, L.sl)); });   /* đề thi: nghe cả câu bằng nút #rv-say, không chen loa giữa câu */
    $("#rv-say").textContent = T("rv_listen");
    if (L.tg === "zh") { loadPinyin(); decoratePy($("#s-review"), true); }
    if (L.tq) paintTVocab(L);
    apStop(); if (L.tq) apReview(L);
    if (L.say && soundOn() && !L.tq) { sayIt._lang = L.sl || "en"; sayIt(L.say, true); }   /* đề thi: không tự đọc cả bài khi sang câu */
    var m = $("#rv-mine");
    m.className = "g-rvmine";
    if (L.note) { m.textContent = L.note; m.classList.add(L.ok ? "ok" : "bad"); }   /* ván cũ: chỉ biết đúng/sai */
    else if (L.typed && L.played) {
      m.innerHTML = esc(L.mine ? T("you_typed", { a: L.mine }) : T("you_none")) + (L.ans && !L.ok ? "  ·  " + esc(T("right_ans", { a: L.tg === "zh" ? zhA(L.ans) : L.ans })) + (L.say ? " " + spk(L.say, L.sl) : "") : "");
      m.classList.add(L.ok ? "ok" : "bad");
    } else if (L.say && !$("#rv-vi .g-fill") && L.ans) {   /* câu trắc nghiệm: dòng "Đáp án đúng: … 🔊" */
      m.innerHTML = esc(T("right_ans", { a: L.tg === "zh" ? zhA(L.ans) : L.ans })) + " " + spk(L.say, L.sl); m.classList.add("ok");
    } else m.textContent = "";
  }
  $("#e-review").addEventListener("click", function () { G.rvFrom = "end"; renderReview(0, G.log); });
  /* ⭐ ĐỂ DÀNH HỌC LẠI (TJ 2026-10-03): đánh dấu ⭐ cho từ trong tiến trình của TJ -> WordLoop tự gom vào Hub "⭐ ÔN RIÊNG"
     (cột word_progress.bookmarked, giống bấm ☆ trong WordLoop). Chỉ hiện với người chơi ghi tiến trình cho TJ (progUid). */
  G.stars = {};
  async function paintStar(L) {
    var b = $("#rv-star"), uid = progUid();
    if (L && L.tq) {   /* 🔖 đề thi: để dành CÂU này để làm lại (TJ 2026-10-04: "khó thì làm lại cho nhớ") */
      b.hidden = false; b.dataset.wid = ""; b.dataset.tqk = tqKey(L.tq);
      var on0 = (await tqMarks())[b.dataset.tqk];
      if (b.dataset.tqk !== tqKey(L.tq)) return;
      b.textContent = on0 ? "🔖 " + apT("qon") : "🔖 " + apT("qoff"); b.classList.toggle("on", !!on0);
      return;
    }
    delete b.dataset.tqk;
    b.hidden = !(uid && L && L.wid && !L.tg);
    if (b.hidden) return;
    b.dataset.wid = L.wid;
    if (G.stars[L.wid] == null) {
      b.textContent = "☆ …";
      var r = await sb.from("word_progress").select("bookmarked").eq("user_id", uid).eq("word_id", L.wid).maybeSingle();
      G.stars[L.wid] = !!(r.data && r.data.bookmarked);
      if (b.dataset.wid !== L.wid) return;   /* đã sang câu khác */
    }
    var on = G.stars[L.wid];
    b.textContent = on ? "⭐ Đã để dành (Ôn riêng)" : "☆ Để dành học lại";
    b.classList.toggle("on", on);
  }
  $("#rv-star").addEventListener("click", async function () {
    if (this.dataset.tqk) { var k = this.dataset.tqk, M = await tqMarks(), on1 = !M[k]; await tqSet(k, on1); this.textContent = "🔖 " + apT(on1 ? "qon" : "qoff"); this.classList.toggle("on", on1); return; }
    var uid = progUid(), wid = this.dataset.wid; if (!uid || !wid) return;
    var on = !G.stars[wid], b = this;
    b.disabled = true;
    var r = await sb.from("word_progress").upsert({ user_id: uid, word_id: wid, bookmarked: on }, { onConflict: "user_id,word_id" });
    b.disabled = false;
    if (r.error) { b.textContent = "⚠ Lỗi: " + r.error.message; return; }
    G.stars[wid] = on;
    paintStar((G.rv || G.log)[rvI]);
  });
  /* 📖 XEM LẠI 1 VÁN CŨ (từ 📜 Lịch sử): game_answers của mình trong ván đó + từ/nghĩa/cấp độ. Ván cũ không lưu đáp án
     đã chọn — chỉ biết đúng/sai. */
  /* thẻ xem lại 1 từ trong LỊCH SỬ theo đúng ngôn ngữ đã học ván đó (game_answers.target; null = English):
     từ = quiz_/meaning_<target> (tiếng Trung kèm pinyin), nghĩa = tiếng mẹ đẻ, đọc bằng giọng của tiếng đó */
  var HIST_COLS = "id,term,level,pos,meaning_vi,meaning_zh,meaning_es,def_en,quiz_vi,quiz_zh,quiz_es,audio";
  function histCard(w, tg, extra) {
    tg = tg || "en";
    regAudio(w);
    var t = tg === "en" ? w.term : (isSent(w.pos) ? clean(w["quiz_" + tg] || w["meaning_" + tg]) : quizForm(w["quiz_" + tg] || w["meaning_" + tg])) || w.term;
    var mean = { vi: w.quiz_vi || w.meaning_vi, en: tg === "en" ? w.def_en : w.term, es: w.quiz_es || w.meaning_es, zh: w.quiz_zh || w.meaning_zh };
    delete mean[tg];
    var ml = G.myLang && G.myLang !== "room" ? G.myLang : "vi"; if (ml === tg) ml = "en";
    var word = tg === "zh" ? '<span class="g-zhw" data-zh="' + esc(t) + '"><span>' + esc(t) + "</span></span>" : esc(t);
    return Object.assign({ vi: word + (tg === "en" ? lvBadge(w.level) : "") + (tg !== "en" ? ' <span class="g-sub">' + FLAG[tg] + "</span>" : ""), res: "", msg: "",
             opts: '<div class="g-rvmean">' + esc(mean[ml] || mean.vi || mean.en || "") + "</div>", ans: t, say: tg === "zh" || tg === "en" ? baseTerm(t) : t, sl: tg,
             tg: tg !== "en" ? tg : null, wid: w.id, typed: false, played: true }, extra);
  }
  async function pastReview(matchId, title) {
    if (!G.me) return;
    G.rvMatch = null;
    sb.from("game_matches").select("*").eq("id", matchId).maybeSingle().then(function (r) { G.rvMatch = r.data || null; var rp = $("#rv-replay"); if (rp) rp.hidden = !(G.isHost && G.room && G.st && G.st.phase !== "play" && G.rvMatch && G.rvMatch.qtype !== "toeic"); });   /* 🔁 chơi lại ván cũ (QA v128 #5) */
    var a = await sb.from("game_answers").select("word_id,term,correct,target,choice").eq("match_id", matchId).eq("player_id", G.me.id);
    var rows = (a.data || []).filter(function (x) { return x.word_id; });
    if (!rows.length && (a.data || []).some(function (x) { return /^toeic:/.test(x.term || ""); })) { tStats(); return; }   /* ván đề thi: chưa dựng lại được từng câu -> mở 📊 điểm TOEIC (QA) */
    if (!rows.length) { alert(T("no_answers")); return; }
    var ids = rows.map(function (x) { return x.word_id; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    var wr = await inIds("words", HIST_COLS, "id", ids), W = {};
    wr.forEach(function (w) { W[w.id] = w; });
    var list = rows.map(function (x, i) {
      var w = W[x.word_id] || { id: x.word_id, term: x.term };
      return histCard(w, x.target, { hint: "📜 " + (title || "") + " — " + T("q_no", { n: i + 1 }), ok: !!x.correct,
        note: (x.correct ? T("past_ok") : T("past_bad")) + (x.choice ? "  ·  " + T("you_typed", { a: x.choice }) : "") });
    });
    G.rvFrom = "hist";
    renderReview(0, list);
  }
  /* 📖 XEM LẠI TẤT CẢ các ván (TJ 2026-10-03): gom game_answers của mình ở MỌI ván, mỗi từ (theo từng ngôn ngữ đã học)
     1 thẻ "đúng N lần · sai M lần". "❌ Chỉ từ hay sai": từ từng sai, sai nhiều nhất lên trước. */
  async function allReview(onlyWrong) {
    if (!G.me) return;
    var rows = [], from = 0;
    for (;;) {
      var a = await sb.from("game_answers").select("word_id,term,correct,target").eq("player_id", G.me.id).not("word_id", "is", null).range(from, from + 999);
      if (a.error) { alert(a.error.message); return; }
      rows = rows.concat(a.data); if (a.data.length < 1000) break; from += 1000;
    }
    var agg = {}, order = [];
    rows.forEach(function (x) { var key = x.word_id + "|" + (x.target || "en"), g = agg[key]; if (!g) { g = agg[key] = { id: x.word_id, tg: x.target || "en", term: x.term, c: 0, w: 0 }; order.push(key); } if (x.correct) g.c++; else g.w++; });
    var keys = order.filter(function (k) { return !onlyWrong || agg[k].w > 0; });
    if (onlyWrong) keys.sort(function (a, b) { return agg[b].w - agg[a].w || agg[a].c - agg[b].c; });
    if (!keys.length) { alert(T(onlyWrong ? "rv_none_wrong" : "no_answers")); return; }
    var ids = keys.map(function (k) { return agg[k].id; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    var wr = await inIds("words", HIST_COLS, "id", ids), W = {};
    wr.forEach(function (w) { W[w.id] = w; });
    var list = keys.map(function (k, i) {
      var g = agg[k], w = W[g.id] || { id: g.id, term: g.term };
      return histCard(w, g.tg, { hint: (onlyWrong ? "❌ " : "📖 ") + T("rv_word", { n: i + 1, m: keys.length }), ok: g.w === 0, note: T("rv_tally", { c: g.c, w: g.w }) });
    });
    G.rvFrom = "hist";
    renderReview(0, list);
  }
  $("#hi-body").addEventListener("click", function (e) {
    var all = e.target.closest("[data-rvall]"); if (all) { allReview(all.dataset.rvall === "wrong"); return; }
    var b = e.target.closest("[data-rvmatch]"); if (!b) return;
    e.preventDefault(); pastReview(b.dataset.rvmatch, b.dataset.title);
  });
  function spk(text, lang) { return '<button type="button" class="g-spk" data-say="' + esc(text) + '" data-sl="' + esc(lang || "") + '" title="Nghe lại">🔊</button>'; }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-say]"); if (b && b.dataset.say) { sayIt._lang = b.dataset.sl || null; sayIt(b.dataset.say, true); } });
  $("#rv-prev").addEventListener("click", function () { renderReview(rvI - 1); });
  $("#rv-next").addEventListener("click", function () { renderReview(rvI + 1); });
  $("#rv-back").addEventListener("click", function () { apStop();   /* về đúng màn hiện tại của phòng (ván mới đã mở thì về phòng chờ) */
    if (G.rvFrom === "hist") { G.rvFrom = null; return renderHistory("me"); }   /* xem ván cũ -> về 📜 Lịch sử */
    G.inHist = false;
    var s = G.st;
    if (!s || !G.room) { location.href = "game.html" + (G.embed ? "?embed=1" : ""); return; }
    if (s.phase === "lobby") return renderLobby();
    if (s.phase === "end" || s.saved) return renderEnd(s);
    onState(s);
  });
  $("#l-review").addEventListener("click", function () { G.rvFrom = "lobby"; renderReview(0, G.log); });
  document.addEventListener("keydown", function (e) {
    if ($("#s-review").hidden || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
    if (e.key === "ArrowLeft") renderReview(rvI - 1);
    if (e.key === "ArrowRight") renderReview(rvI + 1);
  });

  /* ---------- 🎯 HUB "LÀM BÀI TEST" (TJ 2026-10-03, đang chuẩn bị) ----------
     Thời gian MẶC ĐỊNH theo đề TOEIC thật (ETS, định dạng từ 2022): Listening 45 phút do audio dẫn nhịp, Reading 75 phút;
     Speaking ~20 phút (giây chuẩn bị / trả lời từng câu), Writing 60 phút. Phút từng Part Reading = nhịp nên làm
     (P5 ~20 s/câu, P6 ~30 s/câu, P7 ~1 phút/câu) — tổng 73 + 2 phút dò lại = 75. Đề lưu Supabase, KHÔNG để trong repo
     (bản quyền ETS, repo public). */
  var TOEIC = [
    { k: "LC", name: "🎧 Listening", min: 45, note: "audio dẫn nhịp, không dừng được", parts: [
      { p: 1, q: 6, name: "Mô tả tranh", min: 4.5 }, { p: 2, q: 25, name: "Hỏi – đáp", min: 9 },
      { p: 3, q: 39, name: "Hội thoại ngắn", min: 17 }, { p: 4, q: 30, name: "Bài nói ngắn", min: 14.5 } ] },
    { k: "RC", name: "📖 Reading", min: 75, note: "tự phân bổ — nhịp gợi ý bên dưới", parts: [
      { p: 5, q: 30, name: "Điền câu (ngữ pháp, từ vựng)", min: 10 }, { p: 6, q: 16, name: "Điền đoạn văn", min: 8 },
      { p: 7, q: 54, name: "Đọc hiểu (đoạn đơn, kép, ba)", min: 55 } ] },
    { k: "SP", name: "🎙 Speaking", min: 20, note: "giây chuẩn bị / giây trả lời", parts: [
      { p: "1–2", q: 2, name: "Đọc to đoạn văn", sec: "45s / 45s" }, { p: "3–4", q: 2, name: "Mô tả tranh", sec: "45s / 30s" },
      { p: "5–7", q: 3, name: "Trả lời câu hỏi", sec: "3s / 15–30s" }, { p: "8–10", q: 3, name: "Trả lời theo thông tin", sec: "45s+3s / 15–30s" },
      { p: "11", q: 1, name: "Nêu quan điểm", sec: "45s / 60s" } ] },
    { k: "WR", name: "✍️ Writing", min: 60, note: "", parts: [
      { p: "1–5", q: 5, name: "Viết câu theo tranh (2 từ cho sẵn)", min: 8 }, { p: "6–7", q: 2, name: "Trả lời email", min: 20, each: 10 },
      { p: "8", q: 1, name: "Bài luận nêu quan điểm", min: 30 } ] }
  ];
  function fmtMin(m) { var s = Math.round(m * 60), mm = Math.floor(s / 60), ss = s % 60; return mm + (ss ? ":" + (ss < 10 ? "0" : "") + ss : "") + " phút"; }
  function paintTestHub() {
    var el = $("#l-hub-test"); if (!el || el.dataset.done) return; el.dataset.done = "1";
    el.innerHTML = '<div class="g-tplay"><div class="g-settings">' +
      '<label>Bộ đề <select id="t-book"><option value="">Đang tải…</option></select></label>' +
      '<label>Đề <select id="t-tnum"></select></label>' +
      '<label>Phạm vi <select id="t-scope"><option value="full">🏆 Full Test — 200 câu, 2 giờ</option><option value="lc">🎧 Full Listening — Part 1–4</option><option value="rc">📖 Full Reading — Part 5–7, 75 phút</option><option value="part" selected>🧩 Từng Part</option><option value="custom">⚙️ Tuỳ chọn — nhiều Part</option></select></label>' +
      '<label class="t-onlypart">Part <select id="t-test"></select></label>' +
      '<div class="t-onlycustom g-tparts" hidden>' + [1, 2, 3, 4, 5, 6, 7].map(function (p) { return '<label class="g-check"><input type="checkbox" class="t-pck" value="' + p + '"> P' + p + "</label>"; }).join("") + "</div>" +
      '<label>Kiểu chơi <select id="t-mode"><option value="exam">📝 Thi thật — tự làm, Reading được quay lại câu trước, nộp bài mới chấm</option><option value="free">Tự do — mỗi người tự làm, đọc lời giải</option><option value="kahoot">Cùng 1 câu (kiểu Kahoot)</option><option value="audio">🎧 Theo audio — host mở audio, bấm sang câu (Listening)</option><option value="race">⚡ Đua tốc độ — tổng giờ cố định, chọn là chốt, nhiều câu đúng nhất thắng</option></select></label>' +
      '<label>Giây mỗi câu <input id="t-qs" type="number" min="5" max="300" value="20"></label>' +
      '<label class="t-onlypart">Từ câu <input id="t-from" type="number" min="1" max="200" value=""></label>' +
      '<label class="t-onlypart">Đến câu <input id="t-to" type="number" min="1" max="200" value=""></label>' +
      '<label class="t-onlypart">Chủ điểm <select id="t-tag"><option value="">Tất cả</option></select></label>' +
      '<label>Cách tính điểm <select id="t-scoring"><option value="q">Theo câu — đúng +100</option><option value="speed">Theo tốc độ — đúng 100 → 50</option></select></label>' +
      '<label>Hình thức thi đấu <select id="t-teams"><option value="0">Chơi lẻ</option><option value="2">2 đội</option><option value="3">3 đội</option><option value="4">4 đội</option></select></label>' +
      '<label class="g-check"><input type="checkbox" id="t-hostplay" checked> Host cũng chơi</label>' +
      '<label class="g-check" title="Chỉ ra các câu của đề/Part này mà người trong phòng từng làm SAI (lần làm gần nhất)"><input type="checkbox" id="t-wrong"> ❌ Chỉ câu từng làm sai (cả phòng)</label><label class="g-check" title="Các câu bạn đã bấm 🔖 ở 📖 Xem lại"><input type="checkbox" id="t-bm"> 🔖 Chỉ câu tôi đã để dành</label>' +
      '<label title="Listening: audio đề phát ở đâu. Chơi chung qua HelloTalk/loa -> chỉ máy host phát cho khỏi loạn. Kiểu Tự do / ⚡ Đua mỗi người 1 nhịp nên luôn phát trên từng máy (đeo tai nghe).">🔊 Audio đề <select id="t-aud"><option value="host">📢 Chỉ máy host phát (cả phòng nghe qua HelloTalk/loa)</option><option value="all">🎧 Mỗi máy tự phát (ai cũng đeo tai nghe)</option><option value="off">🔇 Không phát (host tự mở audio ngoài)</option></select></label></div>' +
      '<div class="g-row"><button class="g-btn" id="t-start" type="button">▶ Bắt đầu làm bài</button><button class="g-btn g-btn-soft" id="t-stats" type="button">📊 Điểm TOEIC & câu hay sai</button><button class="g-btn g-btn-soft" id="t-tips" type="button">🧠 Chiến thuật đạt điểm cao</button><button class="g-btn g-btn-soft" id="t-marks" type="button">🔖 Đoạn nghe đã lưu</button></div><p class="g-sub" id="t-info"></p></div>' +
      '<p class="g-sub">Hub này để <b>làm đề thi</b> (TOEIC trước): chơi từng Part, thi thử cả bài, hoặc gom câu theo <b>chủ điểm ngữ pháp</b>. Thời gian mặc định theo đề thật:</p>' +
      TOEIC.map(function (sk) {
        return '<div class="g-tsk"><div class="g-tskh"><b>' + sk.name + '</b><span class="g-sub">' + sk.parts.reduce(function (a, p) { return a + p.q; }, 0) + " câu · " + sk.min + " phút" + (sk.note ? " · " + esc(sk.note) : "") + "</span></div>" +
          '<table class="g-ttab"><tbody>' + sk.parts.map(function (p) {
            return "<tr><td>" + (typeof p.p === "number" ? "Part " : "Câu ") + p.p + "</td><td>" + esc(p.name) + '</td><td class="g-num">' + p.q + ' câu</td><td class="g-num">' +
              (p.sec ? p.sec : fmtMin(p.min) + (p.each ? "<br><small>" + p.each + " phút/câu</small>" : "")) + "</td></tr>"; }).join("") + "</tbody></table></div>";
      }).join("") +
      tScoreGuide() +
      '<p class="g-sub">Đã có: ETS 2024 Test 1–10, mỗi đề đủ 200 câu (đáp án chính thức, audio Listening, lời giải Reading 4 thứ tiếng). Sắp có: 📝 thi thử full 2 giờ · ✍️🎙 Viết/Nói dạng ghép câu + AI chấm theo đúng tiêu chí ở trên.</p>';
  }
  /* ---------- 📊 ĐIỂM TOEIC & CÂU HAY SAI (TJ 2026-10-04: "từng Part nhớ điểm, full bài xem đạt bao nhiêu, thống kê câu hay sai, cho luyện thêm") ----------
     Nguồn: game_answers.term = "toeic:<đề>:<part>:<câu>" (mỗi lần trả lời 1 dòng). Mỗi câu lấy LẦN LÀM GẦN NHẤT.
     Quy đổi điểm: ETS không công bố bảng thật (mỗi đề 1 bảng riêng theo độ khó) -> dùng bảng THAM KHẢO phổ biến, ghi rõ "ước lượng". */
  var TQ = { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 };
  var SCALE = { L: [[0, 5], [10, 25], [20, 80], [30, 135], [40, 185], [50, 225], [60, 280], [70, 335], [80, 400], [90, 460], [95, 490], [96, 495], [100, 495]],
                R: [[0, 5], [10, 15], [20, 55], [30, 100], [40, 140], [50, 175], [60, 225], [70, 280], [80, 345], [90, 410], [95, 445], [98, 480], [100, 495]] };
  function tScaled(sec, raw) {
    var t = SCALE[sec]; raw = Math.max(0, Math.min(100, raw));
    for (var i = 1; i < t.length; i++) if (raw <= t[i][0]) { var a = t[i - 1], b = t[i]; return Math.round((a[1] + (b[1] - a[1]) * (raw - a[0]) / (b[0] - a[0])) / 5) * 5; }
    return 495;
  }
  var TIPS = {
    1: "Nhìn tranh trước khi nghe: ai, đang làm gì, đồ vật ở đâu. Bẫy hay gặp: từ nghe giống nhau, động từ đúng nhưng sai người/vật.",
    2: "Bắt chặt TỪ ĐẦU câu hỏi (Who/When/Where/Why…). Đáp án lặp lại từ của câu hỏi thường là bẫy; câu trả lời gián tiếp hay đúng.",
    3: "Đọc trước 3 câu hỏi trước khi hội thoại bắt đầu; đáp án thường theo đúng thứ tự trong bài nghe, hay bị nói lại bằng từ đồng nghĩa.",
    4: "Như Part 3: đọc trước câu hỏi, để ý câu 'Look at the graphic' — nghe thông tin KHÔNG có trên hình để suy ra đáp án.",
    5: "Xem 4 đáp án trước: khác đuôi từ -> câu hỏi từ loại (nhìn vị trí trong câu); khác nghĩa -> từ vựng/collocation. Mỗi câu ≤ 20 giây.",
    6: "Câu chọn CÂU điền vào đoạn: đọc câu trước và sau chỗ trống. Thì động từ phải khớp mốc thời gian của cả bài, không chỉ câu đó.",
    7: "Đọc câu hỏi trước, gạch từ khoá rồi dò bài. Câu NOT/true: loại từng đáp án. Đề kép/ba: thông tin thường nằm ở 2 bài khác nhau."
  };
  async function tAnswers(pids) {
    var out = [], from = 0;
    for (;;) {
      var r = await sb.from("game_answers").select("player_id,term,correct,at").in("player_id", pids).like("term", "toeic:%").order("at").range(from, from + 999);
      if (r.error || !r.data) break; out = out.concat(r.data); if (r.data.length < 1000) break; from += 1000;
    }
    var last = {};   /* mỗi người × mỗi câu: lần làm gần nhất */
    out.forEach(function (a) { last[a.player_id + "|" + a.term] = a; });
    return Object.keys(last).map(function (k) { var a = last[k], p = a.term.split(":"); return { pid: a.player_id, test: p[1], part: +p[2], num: +p[3], ok: !!a.correct }; });
  }
  async function tWrongNums(test, part, pids) {
    if (!pids.length) return [];
    var L = await tAnswers(pids), w = {};
    L.forEach(function (x) { if (String(x.test) === String(test) && x.part === part && !x.ok) w[x.num] = 1; });
    return Object.keys(w).map(Number).sort(function (a, b) { return a - b; });
  }
  async function tStats(pid) {
    var box = $("#t-statsbox");
    if (!box) { box = document.createElement("div"); box.id = "t-statsbox"; box.className = "g-tstats"; document.body.appendChild(box); }
    box.hidden = false; box.innerHTML = '<div class="g-tsin"><p class="g-sub">⏳ Đang tính điểm…</p></div>';
    var pids = [pid || G.me.id];
    var L = await tAnswers(pids);
    var tags = {}, LL = effLang(G.myLang, G.st, "toeic");   /* phân trang: máy chủ trả tối đa 1000 dòng/lần (QA) */
    for (var fr0 = 0; ; fr0 += 1000) { var ti = await sb.from("test_items").select("test,part,num,tag,i18n").eq("exam", "toeic").range(fr0, fr0 + 999); (ti.data || []).forEach(function (x) { var I = x.i18n || {}; tags[x.test + ":" + x.num] = (I[LL] && I[LL].tag) || x.tag || ""; }); if (!ti.data || ti.data.length < 1000) break; }
    var by = {};   /* đề -> part -> {k,n} */
    L.forEach(function (x) { var t = by[x.test] = by[x.test] || {}; var c = t[x.part] = t[x.part] || { k: 0, n: 0 }; c.n++; if (x.ok) c.k++; });
    var tests = Object.keys(by).sort(function (a, b) { return a - b; });
    var pct = function (c) { return c && c.n ? Math.round(c.k / c.n * 100) : null; };
    var cell = function (c, p) { if (!c) return '<td class="g-tsn">—</td>'; var v = pct(c); return '<td class="' + (v >= 85 ? "ok" : v >= 60 ? "mid" : "bad") + '" title="đã làm ' + c.n + "/" + TQ[p] + ' câu">' + c.k + "/" + c.n + "<br><small>" + v + "%</small></td>"; };
    var secEst = function (t, parts, sec) {
      var k = 0, n = 0, full = true; parts.forEach(function (p) { var c = (by[t] || {})[p]; if (c) { k += c.k; n += c.n; } if (!c || c.n < TQ[p]) full = false; });
      if (!n) return '<td class="g-tsn">—</td>';
      var raw = full ? k : Math.round(k / n * 100);
      return '<td><b>' + tScaled(sec, raw) + "</b><br><small>" + (full ? "đủ bài" : "ước lượng · " + n + " câu") + "</small></td>";
    };
    var rows = tests.map(function (t) {
      var l = secEst(t, [1, 2, 3, 4], "L"), r = secEst(t, [5, 6, 7], "R");
      var lv = +(l.match(/<b>(\d+)/) || [])[1] || 0, rv = +(r.match(/<b>(\d+)/) || [])[1] || 0;
      return "<tr><td><b>Test " + esc(t) + "</b></td>" + [1, 2, 3, 4].map(function (p) { return cell(by[t][p], p); }).join("") + l +
        [5, 6, 7].map(function (p) { return cell(by[t][p], p); }).join("") + r + "<td><b>" + (lv && rv ? lv + rv : "—") + "</b></td></tr>";
    }).join("");
    /* tổng theo Part (mọi đề) + chủ điểm hay sai */
    var pa = {}, tg = {};
    L.forEach(function (x) {
      var c = pa[x.part] = pa[x.part] || { k: 0, n: 0 }; c.n++; if (x.ok) c.k++;
      var g = tags[x.test + ":" + x.num]; if (!g) return;
      var key = x.part + "|" + g, d = tg[key] = tg[key] || { k: 0, n: 0, part: x.part, tag: g, wr: {} }; d.n++; if (x.ok) d.k++; else d.wr[x.test] = (d.wr[x.test] || 0) + 1;
    });
    var weak = Object.keys(tg).map(function (k) { return tg[k]; }).filter(function (d) { return d.n >= 3 && d.k < d.n; })
      .sort(function (a, b) { return a.k / a.n - b.k / b.n || b.n - a.n; }).slice(0, 8);
    var worstPart = Object.keys(pa).sort(function (a, b) { return pa[a].k / pa[a].n - pa[b].k / pa[b].n; })[0];
    box.innerHTML = '<div class="g-tsin"><div class="g-h1row"><h2>📊 Điểm TOEIC</h2><button class="g-btn g-btn-soft g-btn-sm" id="ts-close">✕</button></div>' +
      (!L.length ? '<p class="g-sub">Chưa có câu nào được ghi. Làm 1 Part trong 🎯 Làm bài TEST là có điểm ngay.</p>' :
      '<div class="g-tsw"><table class="g-tst g-tsc"><tr><th>Đề</th><th>P1</th><th>P2</th><th>P3</th><th>P4</th><th>🎧 LC</th><th>P5</th><th>P6</th><th>P7</th><th>📖 RC</th><th>Tổng</th></tr>' + rows + "</table></div>" +
      '<p class="g-sub">Mỗi câu tính <b>lần làm gần nhất</b>. Điểm LC/RC thang 5–495 (tổng 10–990) là <b>ước lượng</b> theo bảng quy đổi tham khảo — ETS dùng bảng riêng cho từng đề. Làm đủ cả 7 Part của 1 đề sẽ ra điểm sát nhất.</p>' +
      '<h3>📉 Theo Part (mọi đề)</h3><div class="g-tspa">' + [1, 2, 3, 4, 5, 6, 7].map(function (p) { var c = pa[p]; return '<div class="g-tspb' + (String(p) === worstPart ? " worst" : "") + '"><b>Part ' + p + "</b><span>" + (c ? pct(c) + "% · " + c.k + "/" + c.n : "chưa làm") + "</span></div>"; }).join("") + "</div>" +
      (worstPart ? '<p class="g-tstip">💡 <b>Part ' + worstPart + ' đang yếu nhất.</b> ' + esc(TIPS[worstPart]) + "</p>" : "") +
      '<h3>❌ Chủ điểm hay sai</h3>' + (weak.length ? '<div class="g-tsweak">' + weak.map(function (d) {
        var t = Object.keys(d.wr).sort(function (a, b) { return d.wr[b] - d.wr[a]; })[0];
        return '<div class="g-tswr"><span><b>' + esc(d.tag) + '</b> <small>Part ' + d.part + "</small></span><span>" + Math.round(d.k / d.n * 100) + "% đúng · " + d.k + "/" + d.n + "</span>" +
          (G.isHost ? '<button class="g-btn g-btn-sm" data-tsprac="' + esc(t + "|" + d.part + "|" + d.tag) + '">🎯 Luyện</button>' : "") + "</div>"; }).join("") + "</div>" : '<p class="g-sub">Chưa đủ dữ liệu (cần làm ít nhất 3 câu cùng chủ điểm).</p>')) +
      "</div>";
    $("#ts-close").onclick = function () { box.hidden = true; };
    box.onclick = function (e) {
      if (e.target === box) box.hidden = true;
      var b = e.target.closest("[data-tsprac]"); if (!b) return;
      var d = b.dataset.tsprac.split("|"), sel = $("#t-test"); if (!sel) return;
      sel.value = d[0] + "|" + d[1]; sel.dispatchEvent(new Event("change", { bubbles: true }));
      setTimeout(function () { var tg0 = $("#t-tag"); if (tg0) tg0.value = d[2]; var w = $("#t-wrong"); if (w) w.checked = false; }, 50);
      box.hidden = true; $("#t-info").textContent = "Đã chọn Test " + d[0] + " · Part " + d[1] + " · chủ điểm " + d[2] + " — bấm ▶ Bắt đầu.";
    };
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("#t-stats, #l-tstats, #e-tstats"); if (b) tStats(); });
  /* 🧠 Cẩm nang chiến thuật (js/toeic_tips.js) — theo ngôn ngữ giao diện của từng người, ai cũng mở được */
  /* 🎯 PHÒNG CHỜ NGƯỜI CHƠI khi host mở Hub TOEIC (TJ 2026-10-04): TOEIC là gì + cấu trúc đề + chiến thuật — theo tiếng mẹ đẻ của từng người */
  var TINTRO = {
    vi: { h: "🎯 Phòng đang chuẩn bị làm đề TOEIC", what: "TOEIC là bài thi tiếng Anh dùng trong công việc (của ETS). Phần Nghe + Đọc chấm trên thang 10–990 điểm, mỗi phần tối đa 495.", lc: "🎧 Nghe — 100 câu, ~45 phút: Part 1 tả tranh · Part 2 hỏi–đáp · Part 3 hội thoại · Part 4 bài nói", rc: "📖 Đọc — 100 câu, 75 phút: Part 5 điền câu · Part 6 điền đoạn văn · Part 7 đọc hiểu", tips: "🧠 Chiến thuật làm bài", wait: "Chờ host chọn đề và bấm Bắt đầu" },
    en: { h: "🎯 The room is getting ready for a TOEIC test", what: "TOEIC is ETS's English test for the workplace. Listening + Reading are scored 10–990, up to 495 each.", lc: "🎧 Listening — 100 questions, ~45 min: Part 1 photos · Part 2 question–response · Part 3 conversations · Part 4 talks", rc: "📖 Reading — 100 questions, 75 min: Part 5 sentences · Part 6 text completion · Part 7 reading comprehension", tips: "🧠 Test strategies", wait: "Waiting for the host to pick a test and start" },
    zh: { h: "🎯 房间正在准备 TOEIC 考试", what: "TOEIC 是 ETS 的职场英语考试。听力 + 阅读总分 10–990，每部分最高 495 分。", lc: "🎧 听力 — 100 题，约 45 分钟：Part 1 看图 · Part 2 应答 · Part 3 对话 · Part 4 独白", rc: "📖 阅读 — 100 题，75 分钟：Part 5 句子填空 · Part 6 段落填空 · Part 7 阅读理解", tips: "🧠 应试策略", wait: "等待主持人选题并开始" },
    es: { h: "🎯 La sala se prepara para un examen TOEIC", what: "TOEIC es el examen de inglés laboral de ETS. Listening + Reading se puntúan de 10 a 990, hasta 495 cada parte.", lc: "🎧 Listening — 100 preguntas, ~45 min: Part 1 fotos · Part 2 pregunta–respuesta · Part 3 conversaciones · Part 4 charlas", rc: "📖 Reading — 100 preguntas, 75 min: Part 5 frases · Part 6 completar textos · Part 7 comprensión lectora", tips: "🧠 Estrategias del examen", wait: "Esperando a que el anfitrión elija el examen y empiece" }
  };
  function paintTIntro() {
    var box = $("#l-tintro"); if (!box) return;
    var on = !!(G.st && G.st.hub === "test" && G.st.phase === "lobby" && !G.isHost);
    box.hidden = !on; if (!on) { box.dataset.k = ""; return; }
    var L = uiLang(), k = L + "|" + (G.st.title || ""); if (box.dataset.k === k) return; box.dataset.k = k;
    var X = TINTRO[L] || TINTRO.en, tips = (window.TOEIC_TIPS || {})[L] || (window.TOEIC_TIPS || {}).en || [];
    box.innerHTML = '<h3 class="g-tih">' + esc(X.h) + "</h3>" + (G.st.qtype === "toeic" && G.st.title ? '<div class="g-tit">' + esc(G.st.title) + "</div>" : "") +
      '<p class="g-tiw">' + esc(X.what) + '</p><ul class="g-til"><li>' + esc(X.lc) + "</li><li>" + esc(X.rc) + "</li></ul>" +
      '<div class="g-tih2">' + esc(X.tips) + "</div>" +
      tips.map(function (sec, i) { return "<details" + (i === 0 ? " open" : "") + "><summary><b>" + esc(sec.h) + "</b></summary><ul>" + sec.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></details>"; }).join("") +
      '<p class="g-sub g-waitdots">' + esc(X.wait) + "</p>";
  }
  function tTips() {
    var box = $("#t-statsbox");
    if (!box) { box = document.createElement("div"); box.id = "t-statsbox"; box.className = "g-tstats"; document.body.appendChild(box); }
    var all = window.TOEIC_TIPS || {}, L = all[uiLang()] || all.vi || [];
    box.hidden = false;
    box.innerHTML = '<div class="g-tsin g-tips"><div class="g-h1row"><h2>🧠 ' + esc(T("tips_h")) + '</h2><button class="g-btn g-btn-soft g-btn-sm" id="ts-close">✕</button></div>' +
      L.map(function (sec, i) { return "<details" + (i === 0 ? " open" : "") + "><summary><b>" + esc(sec.h) + "</b></summary><ul>" + sec.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></details>"; }).join("") + "</div>";
    $("#ts-close").onclick = function () { box.hidden = true; };
    box.onclick = function (e) { if (e.target === box) box.hidden = true; };
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("#t-tips, #l-ttips, #e-ttips"); if (b) tTips(); });
  /* 📐 hướng dẫn cách tính điểm (TJ 2026-10-04: "phải có bảng quy đổi điểm, cách chấm Speaking/Writing, tiêu chí") */
  function tScoreGuide() {
    var rows = [];
    for (var r = 100; r >= 0; r -= 10) rows.push("<tr><td>" + (r === 100 ? "96–100" : r === 0 ? "0–5" : r + "–" + (r + 9)) + '</td><td class="g-num">' + tScaled("L", r === 100 ? 96 : r) + '</td><td class="g-num">' + tScaled("R", r) + "</td></tr>");
    var tb = function (h, list) { return '<table class="g-ttab"><thead><tr>' + h.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "</tr></thead><tbody>" + list.map(function (r) { return "<tr>" + r.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>"; };
    return '<details class="g-tsk g-guide"><summary><b>📐 Cách tính điểm TOEIC</b> <span class="g-sub">— Listening & Reading 10–990 · Speaking 0–200 · Writing 0–200</span></summary>' +
      '<p class="g-sub"><b>Listening & Reading:</b> mỗi phần 100 câu, không trừ điểm câu sai (đừng bỏ trống!). Số câu đúng được quy ra thang <b>5–495</b> mỗi phần, cộng lại <b>10–990</b>. ETS không công bố bảng thật (mỗi đề 1 bảng theo độ khó) — bảng dưới là bảng <b>tham khảo</b> game dùng để ước lượng:</p>' +
      '<table class="g-ttab"><thead><tr><th>Số câu đúng</th><th>🎧 Listening</th><th>📖 Reading</th></tr></thead><tbody>' + rows.join("") + "</tbody></table>" +
      '<p class="g-sub">Mốc hay dùng: 450 (đầu ra nhiều trường) · 550–650 (xin việc phổ thông) · 750+ (làm việc bằng tiếng Anh) · 860+ (rất tốt) · 945+ (gần tối đa). Muốn 900+: Listening ~92+ câu, Reading ~88+ câu đúng.</p>' +
      '<p class="g-sub"><b>🎙 Speaking (11 câu, ~20 phút) — thang 0–200</b>, mỗi câu được chấm điểm thô rồi quy đổi:</p>' +
      tb(["Câu", "Dạng", "Thang", "Tiêu chí chấm"], [
        ["1–2", "Đọc to đoạn văn", "0–3", "Phát âm · ngữ điệu, trọng âm"],
        ["3–4", "Mô tả tranh", "0–3", "+ ngữ pháp, từ vựng, mạch lạc"],
        ["5–7", "Trả lời câu hỏi", "0–3", "+ đúng trọng tâm, đủ ý"],
        ["8–10", "Trả lời theo thông tin cho sẵn", "0–3", "+ thông tin chính xác"],
        ["11", "Nêu quan điểm", "0–5", "Lập luận + lý do/ví dụ, ngữ pháp, từ vựng, mạch lạc, phát âm"]]) +
      '<p class="g-sub">Điểm Speaking được xếp 8 mức (Level 1–8); 160+ ≈ Level 7 (giao tiếp công việc tốt), 180–200 = Level 8.</p>' +
      '<p class="g-sub"><b>✍️ Writing (8 câu, 60 phút) — thang 0–200:</b></p>' +
      tb(["Câu", "Dạng", "Thang", "Tiêu chí chấm"], [
        ["1–5", "Viết 1 câu theo tranh (dùng 2 từ cho sẵn)", "0–3", "Đúng ngữ pháp · câu hợp với tranh · dùng đủ 2 từ"],
        ["6–7", "Trả lời email", "0–4", "Câu đa dạng, đúng · từ vựng · bố cục · làm ĐỦ các yêu cầu của đề"],
        ["8", "Bài luận nêu quan điểm (≥300 từ)", "0–5", "Có lập luận rõ + lý do & ví dụ · ngữ pháp · từ vựng · bố cục mạch lạc"]]) +
      '<p class="g-sub">Writing xếp 9 mức (Level 1–9); 170+ ≈ Level 8, 200 = Level 9. Mẹo: câu 1–5 viết 1 câu ĐƠN GIẢN đúng là đủ 3 điểm; email phải trả lời đủ mọi câu hỏi/yêu cầu; bài luận nên 4 đoạn (mở – 2 lý do có ví dụ – kết).</p></details>';
  }
  /* danh sách đề + Part đã có câu trong test_items */
  var T_SEC = { 1: 30, 2: 22, 3: 26, 4: 29, 5: 20, 6: 30, 7: 60 };   /* giây/câu mặc định theo nhịp đề thật (bảng TOEIC ở trên) */
  async function loadTestList() {
    var sel = $("#t-test"); if (!sel) return;
    var r = { data: [] }, from = 0;   /* > 1000 câu (nhiều đề) -> tải theo trang */
    for (;;) { var rr = await sb.from("test_items").select("test,part,num,tag,answer_src").eq("exam", "toeic").order("id").range(from, from + 999); if (rr.error) { r = rr; break; } r.data = r.data.concat(rr.data || []); if ((rr.data || []).length < 1000) break; from += 1000; }
    if (r.error) { sel.innerHTML = '<option value="">—</option>'; $("#t-info").textContent = "Chưa có bảng đề (cần chạy tools/toeic_items.sql)."; return; }
    var cnt = {}, cl = {}; G.tMeta = {};
    var nk = {};
    (r.data || []).forEach(function (x) { var k = x.test + "|" + x.part; cnt[k] = (cnt[k] || 0) + 1; if (x.answer_src === "claude") cl[k] = 1; if (!x.answer_src) nk[k] = 1;
      var m = G.tMeta[k] = G.tMeta[k] || { min: 999, max: 0, tags: {} }; m.min = Math.min(m.min, x.num); m.max = Math.max(m.max, x.num); if (x.tag) m.tags[x.tag] = (m.tags[x.tag] || 0) + 1; });
    var keys = Object.keys(cnt).sort(function (a, b) { var A = a.split("|"), B = b.split("|"); return tNum(A[0]) - tNum(B[0]) || (+A[1] - +B[1]); });
    G.tCnt = cnt; G.tCl = cl; G.tNk = nk; G.tKeys = keys; paintBooks();   /* chọn Bộ đề -> Đề -> Phạm vi (paintBooks/paintTests/paintParts) */
  }
  /* 📚 BỘ ĐỀ (TJ 2026-10-04: "đề sau này có năm 2023, 24, 25, 26"): test_items.test = "<số>" (bộ ETS 2024 có sẵn, giữ mã cũ khỏi đổi dữ liệu)
     hoặc "<năm>-<số>" cho bộ mới (vd "2025-3", id ets25_t3_p5_101). */
  function tBook(t) { t = String(t); return t.indexOf("-") > 0 ? t.split("-")[0] : "2024"; }
  function tNum(t) { t = String(t); return +(t.indexOf("-") > 0 ? t.split("-")[1] : t); }
  function tName(t) { return "ETS " + tBook(t) + " · Test " + tNum(t); }
  function tPartsOf(test) { return (G.tKeys || []).filter(function (k) { return k.split("|")[0] === String(test); }).map(function (k) { return +k.split("|")[1]; }); }
  function paintBooks() {
    var bs = {}; (G.tKeys || []).forEach(function (k) { bs[tBook(k.split("|")[0])] = 1; });
    var bsel = $("#t-book"); if (!bsel) return;
    var keep = bsel.value; bsel.innerHTML = Object.keys(bs).sort().reverse().map(function (b) { return '<option value="' + b + '">ETS ' + b + "</option>"; }).join("") || '<option value="">Chưa có đề nào</option>';
    if (keep && bs[keep]) bsel.value = keep;
    paintTests();
  }
  function paintTests() {
    var b = $("#t-book").value, tests = {}, tsel = $("#t-tnum");
    (G.tKeys || []).forEach(function (k) { var t = k.split("|")[0]; if (tBook(t) === b) tests[t] = (tests[t] || 0) + G.tCnt[k]; });
    var keep = tsel.value;
    tsel.innerHTML = Object.keys(tests).sort(function (a, c) { return tNum(a) - tNum(c); }).map(function (t) {
      var n = tests[t], lc = tPartsOf(t).filter(function (p) { return p <= 4; }).length, rc = tPartsOf(t).filter(function (p) { return p >= 5; }).length;
      return '<option value="' + t + '">Test ' + tNum(t) + " — " + (n >= 200 ? "✅ đủ 200 câu" : "⏳ " + n + " câu" + (lc ? "" : " (chưa có Listening)") + (rc ? "" : " (chưa có Reading)")) + "</option>"; }).join("");
    if (keep && tests[keep]) tsel.value = keep;
    paintParts();
  }
  function paintParts() {
    var t = $("#t-tnum").value, ps = tPartsOf(t), sel = $("#t-test"), keep = sel.value;
    sel.innerHTML = ps.map(function (p) { var k = t + "|" + p; return '<option value="' + k + '">Part ' + p + " — " + G.tCnt[k] + " câu" + (G.tCl[k] ? " (đáp án Claude giải)" : G.tNk[k] ? " (chưa có đáp án)" : "") + "</option>"; }).join("");
    if (keep && ps.indexOf(+keep.split("|")[1]) >= 0) sel.value = t + "|" + keep.split("|")[1];   /* đổi Đề: giữ Part đang chọn (QA v127 #3) */
    $$(".t-pck").forEach(function (c) { c.disabled = ps.indexOf(+c.value) < 0; if (c.disabled) c.checked = false; });
    paintScope();
    if (G.tLastTest !== sel.value) { G.tLastTest = sel.value; sel.dispatchEvent(new Event("change", { bubbles: true })); }
  }
  function tScopeParts() {
    var t = $("#t-tnum").value, ps = tPartsOf(t), sc = $("#t-scope").value;
    if (sc === "full") return ps;
    if (sc === "lc") return ps.filter(function (p) { return p <= 4; });
    if (sc === "rc") return ps.filter(function (p) { return p >= 5; });
    if (sc === "custom") return $$(".t-pck").filter(function (c) { return c.checked; }).map(function (c) { return +c.value; });
    return [+String($("#t-test").value).split("|")[1]].filter(Boolean);
  }
  function paintScope() {
    var sc = $("#t-scope").value, one = sc === "part", ps = tScopeParts();
    $$(".t-onlypart").forEach(function (x) { x.hidden = !(one || (sc === "custom" && x.querySelector("#t-tag"))); });
    $$(".t-onlycustom").forEach(function (x) { x.hidden = sc !== "custom"; });
    var multi = !one;
    $("#t-qs").disabled = multi || (ps[0] <= 4); $("#t-qs").title = multi ? "Nhiều Part: giờ TỰ TÍNH theo từng Part (Listening theo audio, Reading theo nhịp đề thật)" : $("#t-qs").title;
    var tmo = $("#t-mode"); if (tmo && multi && (sc === "full" || sc === "lc" || sc === "rc") && tmo.value !== "exam" && !tmo.dataset.user) tmo.value = "exam";
    if (tmo && one && tmo.value === "exam" && !tmo.dataset.user) tmo.value = ps[0] <= 4 ? "audio" : "free";   /* QA v127 #4: về Từng Part thì bỏ Thi thật */
    var all = tPartsOf($("#t-tnum").value), hasL = all.some(function (p) { return p <= 4; }), hasR = all.some(function (p) { return p >= 5; });
    $$("#t-scope option").forEach(function (o) { o.disabled = (o.value === "lc" && !hasL) || (o.value === "rc" && !hasR) || (o.value === "full" && !(hasL && hasR)); });
  }
  document.addEventListener("change", function (e) {
    var id = e.target && e.target.id;
    if (id === "t-book") paintTests();
    else if (id === "t-tnum") paintParts();
    else if (id === "t-scope" || (e.target.classList && e.target.classList.contains("t-pck"))) paintScope();
    else if (id === "t-mode" && e.isTrusted) e.target.dataset.user = "1";
  });
  document.addEventListener("input", function (e) { if (e.target && (e.target.id === "t-from" || e.target.id === "t-to")) e.target.dataset.user = "1"; });
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "t-test" && e.target.value) {
      G.tLastTest = e.target.value;
      var p = +e.target.value.split("|")[1], m = (G.tMeta || {})[e.target.value]; if (T_SEC[p]) $("#t-qs").value = T_SEC[p];
      $("#t-qs").disabled = p <= 4; $("#t-qs").title = p <= 4 ? "Listening: giờ mỗi câu TỰ TÍNH = đoạn audio + khoảng chờ như đề thật (5s/8s/12s)" : "Nhịp gợi ý theo đề thật — sửa được";   /* TJ: "thời gian bạn tự canh theo quy định" */
      var tmo = $("#t-mode"); if (tmo && $("#t-scope") && $("#t-scope").value === "part" && !tmo.dataset.user) { var want = p <= 4 ? "audio" : tmo.value === "audio" || tmo.value === "exam" ? "free" : ""; if (want && tmo.value !== want) { tmo.value = want; tmo.dispatchEvent(new Event("change", { bubbles: true })); } }   /* QA v109 LC3: cả lúc danh sách đề tự chọn đề đầu; Part 5–7 thì bỏ chế độ audio */   /* 🎧 Listening: host mở audio -> cả phòng cùng câu, host bấm sang câu */
      var keep = !e.isTrusted && ($("#t-from").dataset.user || $("#t-to").dataset.user);   /* QA v104: host đã gõ đoạn câu trước khi danh sách đề tải xong -> giữ */
      if (e.isTrusted) { delete $("#t-from").dataset.user; delete $("#t-to").dataset.user; }
      if (m && keep && !(+$("#t-from").value >= m.min && +$("#t-to").value <= m.max)) keep = false;   /* QA v110: đoạn câu cũ không thuộc đề mới -> điền lại */
      if (m && !keep) { $("#t-from").value = m.min; $("#t-to").value = m.max; }
      if (m) { $("#t-from").min = $("#t-to").min = m.min; $("#t-from").max = $("#t-to").max = m.max;
        $("#t-tag").innerHTML = '<option value="">Tất cả</option>' + Object.keys(m.tags).sort().map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + " (" + m.tags[t] + " câu)</option>"; }).join(""); }
    }
    /* đồng bộ sang ô chung của phòng (điểm / đội / host chơi) để danh sách đội ở phòng chờ hiện ngay như Hub từ vựng */
    var map = { "t-scoring": "#l-scoring", "t-teams": "#l-teamn", "t-hostplay": "#l-hostplay" }, tgt0 = e.target && map[e.target.id];
    if (tgt0 && G.isHost) { var o = $(tgt0); if (e.target.type === "checkbox") o.checked = e.target.checked; else o.value = e.target.value; o.dispatchEvent(new Event("change")); }
  });
  document.addEventListener("click", async function (e) {
    if (!e.target.closest || !e.target.closest("#t-start") || !G.isHost || !G.st) return;
    var tt = $("#t-tnum").value, parts = tScopeParts(), sc = $("#t-scope").value; if (!tt || !parts.length) { $("#t-info").textContent = "Chọn đề và Part trước đã."; return; }
    var a = [tt, String(parts[0])], st = G.st, one = sc === "part" || parts.length === 1;
    var fr = one || sc === "custom" ? +$("#t-from").value || 0 : 0, to = one || sc === "custom" ? +$("#t-to").value || 0 : 0, tg = one || sc === "custom" ? $("#t-tag").value || "" : "";
    if (!one) { fr = 0; to = 0; }
    st.qtype = "toeic"; st.test = { test: tt, part: parts[0], parts: parts, from: fr, to: to, tag: tg }; st.race = false; st.auto = true;
    var tm = $("#t-mode").value; st.exam = tm === "exam"; if (st.exam) tm = "free"; st.race = tm === "race"; st.hostpace = tm === "audio"; st.taud = $("#t-aud") ? $("#t-aud").value : "host"; if (st.exam && st.taud === "host") st.taud = "all"; st.tplay = st.taud !== "off"; G.tLastG = ""; st.mode = st.race ? "free" : st.hostpace ? "kahoot" : tm;
    if (st.hostpace || +a[1] <= 4 || parts.length > 1 || st.exam) { st.auto = false; st.minutes = 120; $("#l-min").value = 120; }   /* Listening: audio dẫn nhịp, ván dài đủ cả đề; hết câu tự kết thúc */   /* không đếm giờ từng câu; ván dài đủ cả đề nghe, hết câu tự kết thúc */ st.qs = Math.max(5, Math.min(300, +$("#t-qs").value || 20));
    if ($("#t-wrong") && $("#t-wrong").checked) {   /* ❌ chỉ câu từng sai: lần làm GẦN NHẤT của từng người đang trong phòng còn sai */
      var W = []; for (var pi = 0; pi < parts.length; pi++) W = W.concat(await tWrongNums(tt, parts[pi], G.online.map(function (p) { return p.id; })));
      if (!W.length) { $("#t-info").textContent = "Cả phòng chưa sai câu nào ở Part này 🎉 (hoặc chưa làm)."; return; }
      st.test.only = W;
    }
    if ($("#t-bm") && $("#t-bm").checked) {   /* 🔖 chỉ câu MÌNH đã để dành (TJ 2026-10-04: khó thì làm lại cho nhớ) */
      G.tqM = null; var B = await tqNums(tt, parts);
      if (st.test.only) B = B.filter(function (n) { return st.test.only.indexOf(n) >= 0; });
      if (!B.length) { $("#t-info").textContent = "Chưa để dành câu nào ở phần đã chọn — vào 📖 Xem lại, bấm 🔖 ở câu khó."; return; }
      st.test.only = B; st.title0bm = 1;
    }
    st.title = (st.exam ? "📝 " : "🎯 ") + tName(tt) + " · " + ({ full: "Full Test", lc: "Full Listening", rc: "Full Reading" }[sc] || "Part " + parts.join(", ")) + (tg ? " · " + tg : "") + (fr && to ? " · câu " + fr + "–" + to : "") + (st.title0bm ? " · 🔖 câu để dành" : st.test.only ? " · ❌ câu sai" : ""); delete st.title0bm;
    $("#t-info").textContent = "Đang tải đề…";
    await ensureTest(st.test);
    if (!(G.tItems || []).length) { $("#t-info").textContent = "Không có câu nào khớp đoạn câu / chủ điểm đã chọn."; return; }
    $("#t-info").textContent = (G.tItems || []).length + " câu sẵn sàng.";
    if (st.race) {   /* ⚡ Đua: tổng giờ theo đề thật (phút của Part × phần câu đã chọn), không giờ riêng từng câu */
      var tot = 0; G.tItems.forEach(function (it) { TOEIC.forEach(function (sk) { sk.parts.forEach(function (x) { if (x.p === it.part) tot += x.min / x.q; }); }); });
      st.auto = false; st.minutes = Math.max(1, Math.ceil(tot || st.qs / 60 * G.tItems.length)); $("#l-min").value = st.minutes;
    }
    if (st.exam) {   /* 📝 Thi thật: Listening ~45 phút/100 câu (theo audio) + Reading 75 phút/100 câu, liền mạch */
      var nl = G.tItems.filter(function (it) { return it.part <= 4; }).length, nr = G.tItems.length - nl;
      st.minutes = Math.ceil(nl * 0.47 + nr * 0.75) + 2; $("#l-min").value = st.minutes;
    }
    G.tStarting = true; $("#l-start").click();
  });
  var LS_HUB = "tjwl_game_hub_v1";
  /* cài đặt Hub từ vựng chụp lại LÚC SANG Hub TEST, trả lại khi quay về (QA v100 L3: ô điểm/đội/host chơi của Hub TEST làm hỏng Hub 🎮) */
  function vocabSnap() {
    var st = G.st; if (!st || st.qtype === "toeic") return;
    G.vSnap = { qtype: st.qtype, title: st.title, mode: st.mode, qs: st.qs, race: st.race, scoring: st.scoring, teams: st.teams, hostplay: hostPlays(), auto: st.auto !== false, minutes: st.minutes };
  }
  function vocabRestore() {
    var v = G.vSnap, st = G.st; if (!v || !st) return;
    st.qtype = v.qtype || "meaning"; st.hostpace = false; st.auto = v.auto !== false; if (v.minutes) { st.minutes = v.minutes; $("#l-min").value = v.minutes; } $("#l-auto").checked = st.auto;
    ["exam", "tplay", "taud", "test"].forEach(function (k) { delete st[k]; });   /* bỏ cài đặt riêng của đề thi (QA: ván từ vựng sau đó chạy 120 phút) */ st.title = v.title; st.mode = v.mode; st.qs = v.qs; st.race = !!v.race; st.scoring = v.scoring; st.teams = v.teams;
    $("#l-qtype").value = st.qtype; $("#l-mode").value = st.race ? "race" : st.mode; $("#l-qs").value = st.qs; $("#l-scoring").value = st.scoring || "q";
    $("#l-teamn").value = String(st.teams || 0); $("#l-hostplay").checked = v.hostplay !== false;
    /* chạy đúng đường xử lý của 2 ô này (QA v103: st.hostplay + track() không được cập nhật -> host vẫn là MC) */
    $("#l-hostplay").dispatchEvent(new Event("change")); $("#l-teamn").dispatchEvent(new Event("change"));
  }
  function setHub(h) {
    h = h === "test" ? "test" : "vocab";
    if (h === "test" && G.hub !== "test") vocabSnap();
    G.hub = h;
    if (G.isHost && G.st && G.st.hub !== h) { G.st.hub = h; push(); }   /* người chơi thấy giới thiệu + chiến thuật TOEIC trong phòng chờ */
    var box = $("#l-host"); if (!box) return;
    box.classList.toggle("g-hubtest", h === "test");
    $$("#l-hubs [data-hub]").forEach(function (b) { var on = b.dataset.hub === h; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    $("#l-hub-test").hidden = h !== "test";
    if (h === "test") {
      paintTestHub(); loadTestList();
      if ($("#t-scoring")) { $("#t-scoring").value = (G.st && G.st.scoring) || "q"; $("#t-teams").value = String((G.st && G.st.teams) || 0); $("#t-hostplay").checked = hostPlays(); }
    }
    else if (G.st && G.isHost && (G.st.qtype === "toeic" || G.vSnap)) {   /* ghé hub TOEIC rồi về (chưa chạy đề) vẫn trả lại cài đặt từ vựng (QA) */   /* về Hub từ vựng: trả lại dạng câu + chủ đề cũ, tải lại kho từ */
      if (G.vSnap) vocabRestore(); else { G.st.qtype = $("#l-qtype").value || "meaning"; $("#l-qtype").value = G.st.qtype; }
      paintQtypes(); paintAutoTime();
      G.poolKey = null; ensurePool(G.st.scope).then(function () { if (G.st.phase === "lobby") paintPoolInfo(); }); push();
    }
    try { localStorage.setItem(LS_HUB, h); } catch (e) {}
  }
  $("#l-hubs").addEventListener("click", function (e) { var b = e.target.closest("[data-hub]"); if (b) setHub(b.dataset.hub); });
  setHub(readLSraw(LS_HUB) || "vocab");

  /* 🔀 GHÉP CÂU: bấm mảnh -> lên hàng câu; bấm mảnh trên hàng -> trả về; đủ mảnh -> tự nộp */
  /* hàng câu cao bằng hàng mảnh (+ khoảng đệm) ngay từ đầu -> ghép thêm mảnh không làm khung cao/thấp đi */
  function ordFix() {
    var line = $("#p-opts .g-ordline"), tiles = $("#p-opts .g-tiles"); if (!line || !tiles) return;
    if (tiles.offsetHeight) line.style.minHeight = tiles.offsetHeight + "px";
  }
  function ordPick(btn) {
    var s = G.st; if (!s || s.phase !== "play" || !iPlay() || btn.disabled) return;
    var line = $("#p-opts .g-ordline"), tiles = $("#p-opts .g-tiles"); if (!line || !tiles) return;
    /* KHÔNG chuyển nút giữa 2 hàng (2 hàng đổi chiều cao -> màn hình điện thoại nhảy 42px, QA 2026-10-03):
       mảnh đã chọn để lại chỗ trống tàng hình ở hàng dưới, hàng câu có chiều cao cố định (ordFix) */
    if (btn.parentNode === line) {
      var src = tiles.querySelector('.g-tile[data-i="' + btn.dataset.i + '"]'); if (src) src.classList.remove("g-used");
      btn.remove(); return;
    }
    if (btn.classList.contains("g-used")) return;
    btn.classList.add("g-used"); line.appendChild(btn.cloneNode(true)).classList.remove("g-used");
    var left = tiles.querySelectorAll(".g-tile:not(.g-used)").length;
    if (left) return;
    var sep = line.dataset.sep || "", ans = $$("#p-opts .g-ordline .g-tile").map(function (b) { return b.querySelector("span").textContent; }).join(sep);
    $$("#p-opts .g-tile, #p-ordreset").forEach(function (b) { b.disabled = true; });
    if (s.mode === "kahoot") { if (G.myChoice == null && s.q && !s.q.revealed) sendAnswer(ans); }
    else freeAnswer(ans, null);
  }
  $("#p-opts").addEventListener("click", function (e) {
    var t = e.target.closest(".g-tile"); if (t) return ordPick(t);
    if (e.target.closest("#p-ordreset")) { $$("#p-opts .g-ordline .g-tile").forEach(function (b) { b.remove(); }); $$("#p-opts .g-tiles .g-used").forEach(function (b) { b.classList.remove("g-used"); }); }
  });

  /* ---------- sang câu bằng tay + tự nộp khi hết giờ ---------- */
  /* tự sang câu sau ít giây (TJ 2026-10-01: phải tự nhảy, xem lại đáp án SAU KHI kết thúc bằng 📖) */
  function showNext(ms) { setTimeout(freeNext, ms); }
  $("#p-next").addEventListener("click", function () {
    var s = G.st; if (!s || s.phase !== "play") return;
    this.hidden = true;
    if (s.mode === "kahoot") { if (G.isHost && s.q && s.q.revealed) hostNextQ(); }
    else { if (G.myQ && G.myQ.type === "toeic" && !G.myQ.done) toeicCommit(G.myQ); freeNext(); }
  });
  $("#p-reveal").addEventListener("click", function () { if (G.isHost && G.st && G.st.q && !G.st.q.revealed) { this.hidden = true; hostReveal(); } });
  document.addEventListener("keydown", function (e) {   /* Enter / → = Câu tiếp (khi ô gõ đã khoá) */
    if ($("#p-next").hidden || $("#s-play").hidden) return;
    var tg = e.target || {}; if (/INPUT|TEXTAREA|SELECT/.test(tg.tagName || "") && !tg.disabled) return;
    if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); $("#p-next").click(); }
  });
  /* hết giờ mà chưa bấm Enter/Nộp -> tự nộp chữ đang gõ / các ô đã chọn (TJ 2026-10-01) */
  function autoSubmit() {
    var s = G.st; if (!s || s.phase !== "play" || !iPlay() || untimed(s)) return;
    var now = Date.now(), typed = $("#p-typein").value.trim(), typeOpen = !$("#p-type").hidden && !$("#p-typein").disabled;
    var picks = $$("#p-vi .g-sel").sort(function (a, b) { return a.dataset.gi - b.dataset.gi; }).map(function (x) { return x.value; });
    var sheetOpen = !!$("#p-sheetgo") && !$("#p-sheetgo").disabled && picks.some(Boolean);
    if (s.mode === "kahoot") {
      if (!s.q || s.q.revealed || G.myChoice != null || !G.qUntilLocal || now < G.qUntilLocal - 250) return;
      if (typeOpen && typed) sendAnswer(typed);
      else if (sheetOpen) { sendAnswer(picks); $("#p-msg").textContent = T("sent_ok"); }
    } else if (now >= G.endAt && G.myQ && !G.myQ.done) {
      G.myQ.done = true;
      if (typeOpen && typed) freeAnswer(typed, null);
      else if (sheetOpen) freeSheet(picks);
    }
  }

  function lockAll(msg) {
    var ae = document.activeElement; if (ae && ae.classList && ae.classList.contains("g-opt")) ae.blur();   /* không để ô vừa bấm giữ focus sang câu sau */
    $$(".g-opt, .g-sel, #p-sheetgo, .g-tile, #p-ordreset").forEach(function (x) { x.disabled = true; });
    $("#p-typein").disabled = true; $("#p-typego").disabled = true;
    if (msg) $("#p-msg").textContent = msg;
  }

  /* kiểu Kahoot: host gửi câu, mọi người trả lời 1 lần, hết giờ mới hiện đáp án + ai chọn gì + ai nhanh nhất */
  function paintKahoot(s) {
    var q = s.q;
    $("#p-reveal").hidden = !(G.isHost && untimed(s) && !q.revealed && !q.grading);   /* chỉ ván ∞ không giờ mới cần bấm hiện đáp án */
    if (!$("#p-reveal").hidden) $("#p-reveal").textContent = q.type === "toeic" ? T("next_q") : T("reveal_btn");   /* 🎧 theo audio: bấm = chốt câu này, sang câu sau */
    $("#p-next").hidden = true;   /* tự sang câu, không cần bấm */
    if (q.qn !== G.lastN) {
      G.lastN = q.qn; G.myChoice = null; G.myPicks = []; G.myQStart = Date.now();
      G.qUntilLocal = s.qLeft != null ? Date.now() + s.qLeft : 0; G.qLimit = q.limit || s.qs;
      paintQuestion(q, "#p-hint", "#p-vi", "#p-opts");
      if (!iPlay()) lockAll();
      $("#p-msg").textContent = iPlay() ? "" : T("mc");
    }
    if (!q.revealed) {
      if (q.grading) { lockAll(T("grading")); return; }
      if (G.myChoice != null || !iPlay()) $("#p-msg").textContent = (iPlay() ? T(isChoice(q) ? "picked_change" : "picked") + " · " : "") + T("answered", { n: q.cnt || 0 });
      return;
    }
    G.qUntilLocal = 0;
    lockAll();
    if (q.type === "toeic") {   /* 🎯 làm đề: hết giờ câu chỉ ghi nhận, không lộ đáp án — xem lại sau khi làm xong */
      if (G.revealedN === q.qn) return; G.revealedN = q.qn;
      $("#p-msg").textContent = (q.subs ? !(G.myPicks || []).some(function (x) { return x != null; }) : G.myChoice == null) ? T("t_skip") : T("t_saved");
      var okT = q.subs ? (G.myPicks || []) : G.myChoice != null && norm(G.myChoice) === norm(q.ans);
      if (q.subs) { logQ(q, G.myPicks || [], okT); return; }
      logQ(q, G.myChoice, okT); return;
    }
    paintPickers(q, s.roster || {}, ".g-opt");
    if (G.revealedN === q.qn) return;
    G.revealedN = q.qn;
    if (q.type === "sheet" || q.type === "dict" || q.type === "write") {
      revealRich(q, s.roster || {}, "#p-msg", "#p-res", "#p-vi");
      var rr = G.me && q.res ? q.res[G.me.id] : null;
      return logQ(q, G.myChoice, q.type === "write" ? rr && rr.g + rr.u >= 60 : rr && rr.k === rr.n);
    }
    var ok = G.myChoice != null && (q.type === "recall" ? typedOk(G.myChoice, q.ans) : norm(G.myChoice) === norm(q.ans));
    speakQ(q, "ans");
    var mine = (s.scores || {})[G.me.id] || {};
    var msg = !iPlay() ? T("answer", { a: zhA(q.ans) }) : G.myChoice == null ? T(untimed(s) ? "answer" : "timeout", { a: zhA(q.ans) }) : ok ? T("right") + gainTail(mine.g) : T("wrong", { a: zhA(q.ans) });
    if (q.type === "recall") msg += "  ·  " + T("n_right", { n: (q.oks || []).length }) + " " + (q.oks || []).map(function (pid) { var p = (s.roster || {})[pid]; return p ? p.avatar && !/^https?:/.test(p.avatar) ? p.avatar : "👤" : ""; }).join("");
    var fast = q.fast ? (s.roster || {})[q.fast] : null;
    if (fast) msg += "  ·  " + T("fastest", { n: plain(fast) });
    if (!G.isHost) msg += "  ·  " + T("wait_nextq");
    $("#p-msg").textContent = msg;
    if (q.type === "recall") $("#p-typein").value = G.myChoice || "";
    logQ(q, G.myChoice, ok);
    if (iPlay()) recordMyProgress(q.wid, ok);   /* bỏ lỡ (chưa chọn) = sai -> vào ❌ Fix lỗi sai + xét chu kỳ */
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
  /* câu đề ĐÃ ĐIỀN đáp án (bỏ "(B) ") để 🔊 đọc cả câu ở Xem lại; Part 6/7 có đoạn văn thì đọc cả đoạn */
  function toeicFull(q) {
    var a = String(q.ans || "").replace(/^\([A-D]\)\s*/, ""), stem = String(q.sent || "");
    stem = /_{3,}/.test(stem) ? stem.replace(/_{3,}/, a) : stem;
    var pas = String(q.passage || "").split("\n").filter(function (l) { return !/^\[(img|aud)\]/.test(l) && !/^🎧/.test(l); }).join("\n").replace(/^\[[^\]\n]{2,40}\]\s*$/gm, "").replace(/-{3,}\((\d+)\)/g, "blank $1");   /* đọc to: bỏ [img]/[aud]/nhãn (QA) */
    return ((pas ? pas + "\n" : "") + stem).trim();
  }
  /* lời giải theo TIẾNG MẸ ĐẺ người xem (TJ 2026-10-03: "người chơi toàn thế giới — thêm tiếng Anh, sau này thêm tiếng khác"):
     i18n = {vi:{tag,explain,stem}, en:{tag,explain}, …}; tiếng chưa có -> tiếng Anh; bản cũ chỉ có cột explain/stem_vi = tiếng Việt */
  /* 🪤 bẫy từng đáp án sai — tiếng mẹ đẻ hiện sẵn, tiếng Anh gấp gọn (đỡ dài) */
  function toeicTraps(q, out) {
    var opt = function (k) { return ((q.opts || [])["ABCD".indexOf(k)] || "(" + k + ")"); };
    var list = function (x) { return Object.keys(x.traps || {}).sort().map(function (k) { return '<div class="g-trap"><b>' + esc(opt(k)) + "</b> — " + esc(x.traps[k]) + "</div>"; }).join(""); };
    var a = out[0] && out[0].x.traps ? out[0] : null, b = out[1] && out[1].x.traps ? out[1] : null;
    if (!a && !b) return "";
    var first = a || b;
    return '<div class="g-ttraps"><div class="g-ttrh">🪤 ' + esc(T("t_traps")) + (first.x.trap_type ? ' <span class="g-ttag">' + esc(first.x.trap_type) + "</span>" : "") + "</div>" + list(first.x) +
      (a && b ? '<details class="g-tren"><summary>' + FLAG.en + " English</summary>" + list(b.x) + "</details>" : "") + "</div>";
  }
  function toeicExpl(q) {
    if (!q || q.type !== "toeic" || !q.ans) return "";
    /* TJ: CẢ HAI — tiếng mẹ đẻ TRƯỚC rồi tới tiếng Anh (người xem tiếng Anh thì chỉ tiếng Anh) */
    var L = effLang(G.myLang, G.st, "toeic"), I = q.i18n || {}, vi = { tag: q.tag, explain: q.expl, stem: q.vi };
    var first = I[L] || (L === "vi" ? vi : null), en = I.en || null, out = [];
    if (first && first.explain && L !== "en") out.push({ l: L, x: first });
    if (en && en.explain) out.push({ l: "en", x: en });
    if (!out.length) out.push({ l: "vi", x: vi });
    if (!out[0].x.explain) return "";
    return '<div class="g-texpl"><b>' + esc(q.ans) + "</b>" + (out[0].x.tag ? ' <span class="g-ttag">' + esc(out[0].x.tag) + "</span>" : "") +
      (out[1] && out[1].x.tag && out[1].x.tag !== out[0].x.tag ? ' <span class="g-ttag">' + esc(out[1].x.tag) + "</span>" : "") +
      out.map(function (o) {
        return (o.x.stem ? '<div class="g-tvi">' + (FLAG[o.l] || "") + " " + esc(o.x.stem) + "</div>" : "") +
          '<div class="g-tex">💡 ' + (out.length > 1 ? (FLAG[o.l] || "") + " " : "") + esc(o.x.explain) + "</div>";
      }).join("") + toeicTraps(q, out) +
      (out[0].l !== "en" && out[0].x.passage ? '<details class="g-tpdet"><summary>' + esc(T("t_ptr")) + "</summary>" + '<div class="g-tpass">' + esc(out[0].x.passage) + "</div></details>" : "") +
      (q.asrc === "claude" ? '<div class="g-sub">⚠️ ' + esc(T("t_claude")) + "</div>" : "") + "</div>";
  }
  /* 👥 XEM LẠI đề thi: avatar những người đã chọn từng đáp án (TJ 2026-10-04). Lấy từ game_answers của ván (host ghi lúc kết thúc,
     nên thử lại vài lần); avatar nằm DƯỚI chữ đáp án, không đè lên. */
  function tqPickMap(mid) {
    G.pickMaps = G.pickMaps || {};
    if (G.pickMaps[mid]) return G.pickMaps[mid];
    return (G.pickMaps[mid] = (async function () {
      var M = {}, rows = 0;
      for (var tries = 0; tries < 4; tries++) {
        M = {}; rows = 0;
        for (var from = 0; ; from += 1000) {
          var r = await sb.from("game_answers").select("player_id,term,choice").eq("match_id", mid).like("term", "toeic:%").range(from, from + 999);
          if (r.error) break;
          (r.data || []).forEach(function (x) { if (x.choice == null) return; rows++; var m0 = M[x.term] = M[x.term] || {}, c = norm(String(x.choice)); (m0[c] = m0[c] || []).push(x.player_id); });
          if (!r.data || r.data.length < 1000) break;
        }
        if (rows) break;
        await new Promise(function (ok) { setTimeout(ok, 1500); });
      }
      if (!rows) delete G.pickMaps[mid];
      return M;
    })());
  }
  async function tqPickAvatars(L) {
    var mid = G.logMatch; if (!mid || !/^[0-9a-f-]{20,}$/i.test(String(mid))) return;
    var M = await tqPickMap(mid), tq = L.tq, ros = (G.st && G.st.roster) || {};
    if (rvCur() !== L) return;   /* đã sang câu khác */
    $$("#rv-opts .g-opt").forEach(function (b) {
      var num = b.dataset.sub != null && tq.nums ? tq.nums[+b.dataset.sub] : tq.num, m0 = M["toeic:" + tq.test + ":" + tq.part + ":" + num] || {}, who = m0[norm(b.dataset.opt)] || [];
      var box = b.querySelector(".g-pickers"); if (!box) { box = document.createElement("span"); box.className = "g-pickers"; b.appendChild(box); }
      box.innerHTML = who.map(function (pid) { var p = ros[pid] || {}; return '<span title="' + esc(p.name || "") + '">' + avatar(p.avatar, "g-av-sm") + "</span>"; }).join("") + (who.length ? '<span class="g-cnt">' + who.length + "</span>" : "");
    });
  }
  function paintPickers(q, roster, sel) {
    if (q.type === "toeic") return;   /* 🎯 làm đề: không tô đáp án lúc đang làm (màn hình chung cũng vậy) */
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
  /* host CHẤM LUÔN câu của chính mình (không đi vòng qua mạng): trước đây host gửi rồi tự nhận lại qua kênh —
     kênh rớt là host bấm không ăn ("Host ko chơi được", TJ 2026-09-30) */
  function sendAns(p) {
    if (G.isHost) return hostOnAnswer(p);
    p.aid = p.aid || (G.me.id + ":" + Date.now() + ":" + Math.random().toString(36).slice(2, 7));   /* host bỏ trùng khi gửi lại */
    /* host đang mất kết nối (Tự do / ⚡ Đua): giữ đáp án trên máy, host quay lại thì gửi bù — người chơi KHÔNG phải dừng chờ */
    if (G.st && Date.now() - (G.lastState || 0) > HOST_LOST_MS) { (G.outbox = G.outbox || []).push(p); return; }   /* Kahoot cũng giữ: host tải lại xong còn 3s nhận */
    if (G.ch) G.ch.send({ type: "broadcast", event: "ans", payload: p });
  }
  function flushOutbox() {
    if (G.isHost || !G.outbox || !G.outbox.length || !G.ch) return;
    var box = G.outbox; G.outbox = [];
    box.forEach(function (p) { G.ch.send({ type: "broadcast", event: "ans", payload: p }); });
  }
  function tSubPick(b) {
    var s = G.st, i = +b.dataset.sub, ch = b.dataset.opt;
    $$('#p-opts .g-opt[data-sub="' + i + '"]').forEach(function (x) { x.classList.toggle("g-picked", x === b); });
    if (s.mode === "kahoot") {
      if (!s.q || s.q.revealed) return;
      G.myPicks = G.myPicks || []; G.myPicks[i] = ch;
      sendAns({ pid: G.me.id, qn: s.q.qn, choice: G.myPicks.slice(), ms: Date.now() - G.myQStart });
      $("#p-msg").textContent = T("picked_change");
    } else {
      var q = G.myQ; if (!q || q.done) return;
      q.picks = q.picks || []; q.picks[i] = ch; q.pickAt = Date.now();
      if (s.race && q.subs.every(function (x, k) { return q.picks[k] != null; })) { toeicCommit(q); showNext(300); return; }   /* ⚡ Đua: đủ 3 câu là chốt */
      $("#p-msg").textContent = T("t_pick");
    }
    if (((s.mode === "kahoot" ? G.myPicks : G.myQ.picks) || []).filter(function (x) { return x != null; }).length >= (s.q || G.myQ).subs.length) tShowNext();
  }
  /* 👀 3 câu của nhóm sau (chỉ đọc) — như đề thật: đọc trước câu hỏi trong lúc máy đọc câu hỏi nhóm hiện tại */
  function tShowNext() { var el = $("#p-opts .g-tnext"); if (el) el.hidden = false; }
  /* ⏭ Qua nhóm sau (TJ 2026-10-04: "ai muốn thì tự bấm qua; hết giờ 3 câu thì bắt buộc chuyển, ai qua rồi thì ở yên đó"):
     Cùng 1 câu/theo audio: chuyển MÀN của mình sang 3 câu nhóm sau (đọc trước) — lựa chọn nhóm này đã gửi host; hết giờ nhóm thì cả phòng sang, người đã qua thấy y chỗ đang đứng.
     Tự do/Thi thật: chốt nhóm này rồi sang nhóm sau ngay (audio nhóm sau phát luôn). */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#p-tskip"); if (!b) return;
    var s = G.st; if (!s || s.phase !== "play") return;
    if (s.mode === "kahoot") {
      var on = !document.body.classList.contains("g-tahead");
      document.body.classList.toggle("g-tahead", on); tShowNext();
      b.textContent = on ? "◀ " + T("t_backg") : "⏭ " + T("t_skipg");
      return;
    }
    var q = G.myQ; if (!q || !q.subs) return;
    tStop(); toeicCommit(q); freeNext();
  });
  function sendAnswer(choice) {
    var s = G.st;
    G.myChoice = choice;
    if (isChoice(s.q)) $("#p-msg").textContent = T("picked_change");   /* KHÔNG khoá: còn giờ thì bấm ô khác để đổi */
    else lockAll(T("picked"));
    sendAns({ pid: G.me.id, qn: s.q.qn, choice: choice, ms: Date.now() - G.myQStart });
  }
  $("#p-opts").addEventListener("click", function (e) {
    var b = e.target.closest(".g-opt"); if (!b || b.disabled) return;
    var s = G.st; if (!s || s.phase !== "play" || !iPlay()) return;
    if (b.dataset.sub != null) return tSubPick(b);   /* nhóm 3 câu Part 3–4 */
    if (s.mode === "kahoot") {
      if (!s.q || s.q.revealed || (G.myChoice != null && !isChoice(s.q))) return;
      if (G.myChoice != null && norm(G.myChoice) === norm(b.dataset.opt)) return;   /* bấm lại đúng ô đang chọn */
      $$("#p-opts .g-opt.picked").forEach(function (x) { x.classList.remove("picked"); });
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
  /* ĐỌC TIẾNG (v71, TJ 2026-10-02 "âm thanh lúc đọc lúc không"):
     - now = true (người BẤM loa / nghe lại / xem lại): cắt câu đang đọc, đọc ngay.
     - now = false (tự đọc khi câu hiện / lộ đáp án): nếu đang đọc dở thì XẾP HÀNG (chỉ giữ câu mới nhất), đọc xong
       câu trước mới đọc — trước đây câu mới cắt ngang đáp án đang đọc, Chrome hay nuốt luôn câu ngay sau lệnh cắt.
     - Giữ tham chiếu G.utt: Chrome có thể dọn rác utterance đang đọc -> tắt tiếng giữa chừng + không bao giờ báo onend.
     - Gỡ kẹt: 6 s không thấy onend (Chrome báo "đang đọc" mà thật ra im) -> huỷ, đọc tiếp câu đang chờ.
     - Lỗi âm thanh tạm (audio-busy / synthesis-failed) -> thử lại 1 lần. */
  /* 🔊 FILE GHI ÂM có sẵn (words.audio) -> phát file; lỗi file thì đọc bằng giọng máy. Dùng 1 thẻ <audio> cho cả trang
     (điện thoại cho phát sau lần chạm đầu). Tự đọc khi file đang phát -> xếp hàng như giọng máy. */
  var AUD = null;
  function playFile(url, text, now) {
    if (!AUD) { AUD = new Audio(); AUD.preload = "auto"; }
    if (!now && !AUD.paused && !AUD.ended) { G.nextSay = text; return true; }
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    /* file không tải được / treo (vd ở Trung Quốc github.io chập chờn — Aaron 2026-10-03 "không bấm được nghe lại") ->
       đọc bằng giọng máy; hỏng 2 lần thì cả phiên bỏ qua file, bấm loa đọc giọng máy NGAY trong lúc chạm (iPhone cần vậy) */
    var tok = (playFile._tok = (playFile._tok || 0) + 1), started = false;
    function fail() { if (tok !== playFile._tok || started) return; playFile._tok++; G.fileFails = (G.fileFails || 0) + 1; try { AUD.pause(); } catch (e) {} sayIt._nofile = text; sayIt(text, true); }
    AUD.onended = function () { if (G.nextSay) { var t = G.nextSay; G.nextSay = null; setTimeout(function () { sayIt(t); }, 60); } };
    AUD.onplaying = function () { started = true; G.fileFails = 0; };
    AUD.onerror = fail;
    AUD.src = url; AUD.volume = volLevel();
    setTimeout(fail, 4000);
    var p = AUD.play();
    if (p && p.catch) p.catch(function (e) { if (e && e.name === "NotAllowedError") { playFile._tok++; G.blockedWord = text; tapHint(true); } else fail(); });
    return true;
  }
  /* từ của 1 Block (cho bảng từ vựng + tạo bài đọc); Block "Ôn riêng" giữ từ gốc ở ref_word_ids */
  async function boardWords(bid) {
    var cols = "id,term,ipa,pos,level,def_en,meaning_vi,meaning_zh,meaning_es,sort";
    var r = await sb.from("words").select(cols).eq("block_id", bid).limit(300), rows = r.data || [];
    if (!rows.length) {
      var b = await sb.from("blocks").select("ref_word_ids").eq("id", bid).maybeSingle(), ids = (b.data && b.data.ref_word_ids) || [];
      if (ids.length) { var r2 = await sb.from("words").select(cols).in("id", ids.slice(0, 200)); rows = r2.data || []; }
    }
    return rows.sort(function (a, b2) { return (+a.sort || 0) - (+b2.sort || 0); });
  }
  /* nạp js/context.js (bộ sinh bài đọc AI của WordLoop, ~130 KB) khi cần lần đầu — nó chỉ cần window.esc */
  var CTX_VER = 34, ctxP = null;
  function ensureContext() {
    if (window.Context) return Promise.resolve();
    if (ctxP) return ctxP;
    window.esc = window.esc || esc;
    return (ctxP = new Promise(function (ok, no) { var sc = document.createElement("script"); sc.src = "js/context.js?v=" + CTX_VER; sc.onload = ok; sc.onerror = function () { ctxP = null; no(new Error("Không tải được bộ tạo bài đọc")); }; document.head.appendChild(sc); }));
  }
  function sayIt(text, now) {
    try {
      var fl = sayIt._lang || tgt(), url = sayIt._nofile === text || (G.fileFails || 0) >= 2 ? null : G.audioMap[fl + "|" + String(text || "").trim()];
      sayIt._nofile = null;
      if (url) { sayIt._lang = null; playFile(url, text, now); return; }
      var syn = window.speechSynthesis; if (!syn || !text) return;
      if (!now && G.saying && (syn.speaking || syn.pending)) { G.nextSay = text; return; }
      if (now) G.nextSay = null;
      var busy = syn.speaking || syn.pending;
      if (busy) syn.cancel();
      try { syn.resume(); } catch (er) {}
      var tl = TTS_LANG[sayIt._lang || tgt()] || "en-US"; sayIt._lang = null;
      var u = new SpeechSynthesisUtterance(text); u.lang = tl; u.rate = 0.9; u.volume = volLevel();
      var all = syn.getVoices(), mine = readLSraw("tjwl_voice_v1");   /* giọng đã chọn bên WordLoop (js/speech.js LS_VOICE) */
      var v = tl === "en-US" && mine && all.find(function (x) { return x.name === mine; }) || null;   /* giọng chọn bên WordLoop là giọng tiếng Anh */
      if (!v) { var pre = tl.slice(0, 2), en = all.filter(function (x) { return x.lang.replace("_", "-").toLowerCase().indexOf(tl.toLowerCase()) === 0; });
        if (!en.length) en = all.filter(function (x) { return x.lang.slice(0, 2).toLowerCase() === pre; });
        /* giọng "Google …"/"… Online" đọc qua máy chủ Google/Microsoft — ở Trung Quốc không vào được Google nên im lặng.
           Đã hỏng 1 lần -> cả phiên chỉ dùng giọng có sẵn trong máy (localService) */
        var loc = en.filter(function (x) { return x.localService; });
        v = G.noNetVoice && loc.length ? loc[0] : en.find(function (x) { return /natural|online|google/i.test(x.name); }) || en[0]; }
      /* máy KHÔNG có giọng đúng ngôn ngữ (hay gặp: Windows chỉ có giọng tiếng Anh) -> không đọc (giọng Anh đọc chữ Hán / tiếng
         Việt sai hẳn), nhắc 1 lần mỗi ngôn ngữ. Danh sách giọng còn trống (Chrome nạp chậm) thì vẫn thử đọc. */
      if (!v && all.length && tl !== "en-US") { G.saying = false; noVoiceHint(tl.slice(0, 2)); return; }
      if (v) u.voice = v;
      var tries = (sayIt._retry === text) ? 1 : 0; sayIt._retry = null;
      function done() {
        if (G.utt !== u) return;
        G.saying = false; G.utt = null; clearTimeout(G.sayDog);
        if (G.nextSay) { var t = G.nextSay; G.nextSay = null; setTimeout(function () { sayIt(t); }, 60); }
      }
      G.utt = u; G.saying = true;
      u.onend = done; u.onstart = function () { u._started = true; };
      u.onerror = function (e) {
        var why = e && e.error;
        if (why === "not-allowed") { G.blockedWord = text; tapHint(true); }   /* Chrome chặn khi trang chưa được chạm -> nhắc chạm + đọc bù */
        if (v && !v.localService && !G.noNetVoice && why !== "not-allowed" && why !== "interrupted" && why !== "canceled") { G.noNetVoice = true; G.utt = null; G.saying = false; setTimeout(function () { sayIt(text, true); }, 60); return; }
        if ((why === "audio-busy" || why === "synthesis-failed" || why === "audio-hardware") && !tries) { G.utt = null; G.saying = false; sayIt._retry = text; setTimeout(function () { sayIt(text, true); }, 250); return; }
        done();
      };
      clearTimeout(G.sayDog);
      G.sayDog = setTimeout(function () { if (G.utt === u) { try { syn.cancel(); } catch (er) {} done(); } }, 6000 + text.length * 60);
      if (now) {
        /* NGƯỜI BẤM loa: speak() NGAY trong lúc chạm — iPhone (Safari/Chrome iOS) chỉ cho phát khi lệnh đọc nằm trong
           thao tác chạm; trước đây chờ 0–120 ms (né lỗi Chrome máy tính) nên iPhone chặn luôn (TJ 2026-10-03: "loa đọc lại
           lúc review không hoạt động"). Chrome máy tính đôi khi nuốt câu ngay sau cancel() -> 0.35 s chưa thấy phát thì đọc lại. */
        try { syn.speak(u); } catch (er) {}
        setTimeout(function () { if (G.utt === u && !u._started && !syn.speaking) { try { syn.cancel(); syn.speak(u); } catch (er) {} } }, 350);
        /* giọng mạng treo không báo lỗi: 2.5 s chưa bắt đầu đọc -> chuyển giọng trong máy, đọc lại */
        if (v && !v.localService && !G.noNetVoice) setTimeout(function () { if (G.utt === u && !u._started) { G.noNetVoice = true; try { syn.cancel(); } catch (er) {} G.utt = null; G.saying = false; sayIt(text, true); } }, 2500);
      } else setTimeout(function () { try { if (G.utt === u) syn.speak(u); } catch (er) {} }, busy ? 120 : 0);
    } catch (e) {}
  }
  /* Chrome chặn giọng đọc trong trang (nhất là iframe thẻ 🎮) chưa từng được chạm -> lần chạm đầu đọc 1 câu rỗng để "mở khoá" */
  ["pointerdown", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function unlock() {
      document.removeEventListener(ev, unlock, true);
      primeTTS();
    }, true);
    /* lần chạm sau khi bị chặn: tắt dòng nhắc + đọc BÙ từ vừa bị chặn (không mất câu đầu) */
    document.addEventListener(ev, function () {
      tapHint(false);
      if (G.blockedWord && soundOn()) { var w = G.blockedWord; G.blockedWord = null; setTimeout(function () { sayIt(w, true); }, 120); }
    }, true);
  });
  var noVoiceShown = {};
  function noVoiceHint(l) {
    if (noVoiceShown[l]) return; noVoiceShown[l] = 1;
    var el = document.createElement("div"); el.className = "g-taphint g-novoice";
    el.textContent = T("no_voice", { l: (TGT_NAME[uiLang()] || TGT_NAME.vi)[l] || l });
    el.addEventListener("click", function () { el.remove(); });
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 9000);
  }
  function tapHint(on) { $$(".js-taphint").forEach(function (x) { x.hidden = !on; }); clearTimeout(G.tapHintT); if (on) G.tapHintT = setTimeout(function () { tapHint(false); }, 7000); }   /* tự ẩn sau 7s — không che đáp án */
  /* nhắc sẵn ở phòng chờ: đang bật tiếng mà trang chưa từng được chạm (Chrome sẽ chặn câu đầu) */
  function tapHintIfNeeded() {
    var ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive && soundOn()) tapHint(true);
  }
  setTimeout(tapHintIfNeeded, 1500);
  /* mồi bộ đọc rồi XOÁ hàng đợi ngay: câu mồi chỉ có dấu cách từng làm Chrome KẸT hàng đợi -> từ cần đọc bị dồn tới lần sau
     (TJ 2026-10-02: "lúc lộ đáp án không đọc, sau đó mới đọc") */
  function primeTTS() {
    try {
      var syn = window.speechSynthesis; if (!syn || syn.speaking || syn.pending) return;
      var z = new SpeechSynthesisUtterance("ok"); z.volume = 0; z.rate = 10; z.lang = "en-US";
      syn.speak(z); setTimeout(function () { if (!G.saying && !G.utt) syn.cancel(); }, 60);
    } catch (e) {}
  }
  function readLSraw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  /* 🔊 đọc to từ tiếng Anh: "1"/"0" = người này tự chọn trên máy; chưa chọn -> theo mặc định của phòng (host đặt) */
  var LS_SOUND = "tjwl_game_sound_v1";
  function soundOn() { var o = readLSraw(LS_SOUND); return o === "1" ? true : o === "0" ? false : !(G.st && G.st.sound === false); }
  /* 🔉 âm lượng đọc (0–100, nhớ theo máy; mặc định 100). iPhone/Safari có thể bỏ qua volume của giọng máy -> dùng nút âm lượng của máy */
  var LS_VOL = "tjwl_game_volume_v1";
  function volLevel() { var v = parseInt(readLSraw(LS_VOL), 10); return isNaN(v) ? 1 : Math.max(0, Math.min(100, v)) / 100; }
  /* Nút "🔊 Có tiếng / 🔇 Đã tắt tiếng" + thanh âm lượng có ở 2 chỗ (phòng chờ + lúc chơi), cùng 1 lựa chọn của máy này:
     người chơi tự bật/tắt + chỉnh, đè lên mặc định của host (TJ 2026-10-02). */
  $$(".js-vol").forEach(function (r) { r.value = Math.round(volLevel() * 100); });
  document.addEventListener("input", function (e) {
    var r = e.target.closest(".js-vol"); if (!r) return;
    try { localStorage.setItem(LS_VOL, r.value); } catch (er) {}
    $$(".js-vol").forEach(function (x) { if (x !== r) x.value = r.value; x.title = "Âm lượng: " + r.value + "%"; });
    tVol();
    paintVolLabel();
  });
  document.addEventListener("change", function (e) {   /* thả tay -> đọc thử để nghe mức mới (không đọc lộ đáp án) */
    if (!e.target.closest(".js-vol") || !soundOn()) return;
    var q = G.st && G.st.phase === "play" ? (G.st.mode === "kahoot" ? G.st.q : G.myQ) : null;
    sayIt(baseTerm(replayWord(q) || "volume"), true);
  });
  function paintVolLabel() {   /* "🔉 Âm lượng 80%" cạnh thanh kéo (TJ: thiếu thông tin) */
    var v = Math.round(volLevel() * 100), ic = !soundOn() || v === 0 ? "🔈" : v < 50 ? "🔉" : "🔊";
    $$(".js-volval").forEach(function (x) { x.textContent = ic + " " + T("vol") + " " + v + "%"; });
  }
  function paintSoundBtn() {
    var on = soundOn();
    $$(".js-snd").forEach(function (b) {
      b.textContent = T(on ? "snd_on" : "snd_off");
      b.classList.toggle("off", !on);
      b.title = T(on ? "snd_on_t" : "snd_off_t");
    });
    $$(".js-vol").forEach(function (r) { r.disabled = !on; r.title = T("vol") + ": " + r.value + "%"; });
    tVol();
    $$(".js-sndck").forEach(function (c) { c.checked = on; });
    paintVolLabel();
  }
  document.addEventListener("change", function (e) {   /* ô tích "Có tiếng" lúc chơi */
    var c = e.target.closest(".js-sndck"); if (!c) return;
    try { localStorage.setItem(LS_SOUND, c.checked ? "1" : "0"); } catch (er) {}
    if (!c.checked && window.speechSynthesis) window.speechSynthesis.cancel();
    paintSoundBtn();
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".js-snd")) return;
    var on = !soundOn();
    try { localStorage.setItem(LS_SOUND, on ? "1" : "0"); } catch (er) {}
    if (!on && window.speechSynthesis) window.speechSynthesis.cancel();
    paintSoundBtn();
  });
  /* đọc từ của câu: "q" = lúc câu hiện (chỉ dạng Từ -> Nghĩa, từ tiếng Anh đang hiện to); "ans" = lúc lộ đáp án (đọc từ đúng) */
  var spoke = {};
  function speakQ(q, when) {
    if (q && when === "ans") { q._shown = true; paintReplay(q); }   /* đã lộ đáp án -> hiện loa nghe lại từ đúng */
    if (!q || !soundOn()) return;
    if (q.type === "toeic" || q.type === "dict" || q.type === "sheet" || q.type === "write") return;   /* dictation có nút 🔊 riêng; phiếu/đặt câu không đọc */
    if (q.type === "en2m" && when === "ans") return;   /* Từ->Nghĩa đã đọc lúc câu hiện; đáp án tiếng Việt thì không đọc lại (TJ: phát 2 lần) */
    if (q.type === "listen" && when === "ans") return;   /* đã đọc lúc câu hiện (nút 🔊 nghe lại) */
    var word = when === "q" ? (q.type === "en2m" || q.type === "listen" ? q.word : null) : (q.full || q.ans || q.word);
    if (!word) return;
    if (q.qn != null) { var k = when + ":" + q.qn; if (spoke[k]) return; spoke[k] = 1; }   /* Kahoot: mỗi câu có số qn, trạng thái gửi lại nhiều lần */
    else { var f = "_spoke_" + when; if (q[f]) return; q[f] = 1; }                         /* Tự do: mỗi câu là 1 object riêng */
    sayIt(baseTerm(word));
  }
  /* loa nhỏ cạnh từ tiếng Anh: bấm = nghe lại (luôn được, kể cả khi đang tắt tự đọc) */
  /* 🔊 nghe lại (nút ngoài khung câu): Từ->Nghĩa = từ đang hỏi; dạng khác chỉ sau khi lộ đáp án (không lộ đáp án) */
  function replayWord(q) { if (!q) return null; if (q.type === "en2m") return q.word; if (q.type === "dict") return null; return q.revealed || q._shown ? q.ans : null; }
  function paintReplay(q) { var b = $("#p-replay"); if (b) b.disabled = !replayWord(q); }   /* luôn hiện (hàng 3 nút không nhảy), chỉ mờ khi chưa nghe được */
  $("#p-replay").addEventListener("click", function () { var q = G.st && G.st.mode === "kahoot" ? G.st.q : G.myQ, w = replayWord(q); if (w) sayIt(baseTerm(w), true); });
  $("#p-say").addEventListener("click", function () {
    var q = G.st && G.st.mode === "kahoot" ? G.st.q : G.myQ;
    if (q && q.say) sayIt(q.say, true);
    else if (q && q.type === "en2m" && q.word) sayIt(baseTerm(q.word), true);   /* nghe lại từ tiếng Anh (luôn được, kể cả khi đang tắt tự đọc) */
  });
  $("#p-typein").addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.isComposing || e.keyCode === 229)) { e.preventDefault(); e.stopPropagation(); } }, true);   /* Safari: Enter lúc đang chọn chữ trong bộ gõ tiếng Trung không được nộp bài */
  $("#p-type").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#p-typein").value.trim(), s = G.st;
    if (!v || !s || s.phase !== "play" || !iPlay()) return;
    if (s.mode === "kahoot") { if (G.myChoice == null && s.q && !s.q.revealed) sendAnswer(v); }
    else freeAnswer(v, null);
  });

  /* chốt đáp án đang chọn (Tự do, chọn lại được) — lúc bấm "Câu tiếp", hết giờ, hoặc ván kết thúc */
  /* ---------- 📝 THI THẬT (TJ 2026-10-04) ----------
     Listening: như đề thật — audio từng máy dẫn nhịp, không quay lại. Reading: làm TỰ DO cả phần trong tổng giờ (75 phút × phần câu),
     chuyển câu bằng ◀ ▶ hoặc bảng số câu, đổi đáp án thoải mái; bấm 📝 Nộp bài (hoặc hết giờ) mới chấm, gửi host 1 lần (batch).
     Xong hiện điểm quy đổi LC/RC/tổng (bảng tham khảo) + 📖 Xem lại có đáp án, lời giải. */
  function exQ(it) {
    var ai = "ABCD".indexOf(String(it.answer || "").trim().toUpperCase());
    return { type: "toeic", wid: null, num: it.num, part: it.part, sent: tStemOf(it), passage: it.passage || "", opts: (it.opts || []).slice(), ans: ai >= 0 ? it.opts[ai] : "", tag: it.tag || "", expl: it.explain || "", vi: it.stem_vi || "", i18n: it.i18n || null, vocab: it.vocab || null, test: G.st.test.test, asrc: it.answer_src || "", pick: null };
  }
  function exStart() {
    var rest = (G.tItems || []).slice(G.tIdx || 0); G.tIdx = (G.tItems || []).length;
    var mins = 75 * rest.length / 100;
    G.ex = { qs: rest.map(exQ), i: 0, end: Math.min(G.endAt - 2000, Date.now() + mins * 60000), done: false };
    exPaint();
  }
  function exPaint() {
    var e = G.ex, q = e.qs[e.i]; G.myQ = q; G.myQStart = Date.now(); document.body.classList.add("g-exam");
    paintQuestion(q, "#p-hint", "#p-vi", "#p-opts");
    if (q.pick != null) $$("#p-opts .g-opt").forEach(function (x) { x.classList.toggle("g-picked", norm(x.dataset.opt) === norm(q.pick)); });
    exNav(); exInfo();
  }
  function exInfo() {
    var e = G.ex; if (!e || e.done) return;
    var left = Math.max(0, e.end - Date.now()), n = e.qs.filter(function (q) { return q.pick != null; }).length;
    $("#p-msg").textContent = "📝 " + T("ex_left", { t: fmt(left), n: n, m: e.qs.length });
  }
  function exNav() {
    var e = G.ex; if (!e) return;
    $("#p-res").innerHTML = '<div class="g-row g-center g-exnav"><button class="g-btn g-btn-soft" data-ex="-1">◀</button><button class="g-btn g-btn-soft" data-ex="1">▶</button><button class="g-btn" data-ex="submit">📝 ' + esc(T("ex_submit")) + "</button></div>" +
      '<div class="g-expal">' + e.qs.map(function (q, i) { return '<button class="' + (i === e.i ? "cur " : "") + (q.pick != null ? "done" : "") + '" data-exi="' + i + '">' + q.num + "</button>"; }).join("") + "</div>";
    exInfo();
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-ex],[data-exi]"); if (!b || !G.ex || G.ex.done) return;
    var e = G.ex;
    if (b.dataset.exi != null) e.i = +b.dataset.exi;
    else if (b.dataset.ex === "submit") {
      var left = e.qs.filter(function (q) { return q.pick == null; }).length;
      if (left && !confirm(T("ex_confirm", { n: left }))) return;
      return exSubmit();
    } else e.i = Math.max(0, Math.min(e.qs.length - 1, e.i + +b.dataset.ex));
    exPaint();
  });
  function exSubmit() {
    var e = G.ex; if (!e || e.done) return; e.done = true; tStop(); document.body.classList.remove("g-exam");
    var batch = [];
    e.qs.forEach(function (q) {   /* ghi Xem lại từng câu như chế độ khác */
      var ok = q.pick != null && norm(q.pick) === norm(q.ans); q.done = true;
      G.myQ = q; paintQuestion(q, "#p-hint", "#p-vi", "#p-opts"); logQ(q, q.pick, ok);
      batch.push({ ok: ok, tk: tKey(q), c: q.pick });
    });
    sendAns({ pid: G.me.id, batch: batch });
    var lc = G.exLC || [], lk = lc.filter(function (x) { return x.ok; }).length, rk = batch.filter(function (x) { return x.ok; }).length;
    var ls = lc.length ? tScaled("L", lc.length >= 100 ? lk : Math.round(lk / lc.length * 100)) : null, rs = tScaled("R", batch.length >= 100 ? rk : Math.round(rk / batch.length * 100));
    $("#p-hint").textContent = ""; $("#p-opts").innerHTML = "";
    $("#p-vi").innerHTML = '<div class="g-exres"><h2>📝 ' + esc(T("ex_done")) + "</h2>" +
      (ls != null ? "<p>🎧 Listening: <b>" + lk + "/" + lc.length + "</b> → ~<b>" + ls + "</b></p>" : "") +
      "<p>📖 Reading: <b>" + rk + "/" + batch.length + "</b> → ~<b>" + rs + "</b></p>" +
      (ls != null ? '<p class="g-exsum">' + esc(T("ex_total")) + " ~<b>" + (ls + rs) + "</b> / 990</p>" : "") +
      '<p class="g-sub">' + esc(T("ex_note")) + "</p></div>";
    G.exRes = { m: G.st && G.st.matchId, html: $("#p-vi").innerHTML };   /* giữ để hiện lại ở màn kết quả (QA: chỉ thấy ~7 giây) */
    $("#p-res").innerHTML = ""; $("#p-msg").textContent = T("t_alldone");
  }
  /* nhóm câu Part 3–4: các câu LIÊN TIẾP cùng đoạn hội thoại (cùng g= trong [aud]), đều đã có đáp án */
  function tGOf(it) { var m = String((it && it.passage) || "").match(/^\[aud\] q=[\d.]+-[\d.]+ g=([\d.]+-[\d.]+)/m); return m ? m[1] : null; }
  function tCueEnd(it) { var m = String((it && it.passage) || "").match(/^\[aud\] q=[\d.]+-([\d.]+)/m); return m ? +m[1] : null; }
  function tGroupAt(L, i) {
    var it = L[i]; if (!it || !(it.part === 3 || it.part === 4) || !it.answer) return null;
    var g = tGOf(it); if (!g) return null;
    var out = [it]; while (out.length < 3 && L[i + out.length] && tGOf(L[i + out.length]) === g && L[i + out.length].answer) out.push(L[i + out.length]);
    return out;
  }
  /* Part 6 "Choose the best answer for blank (131)." -> bỏ số lặp (số câu đã hiện ở đầu dòng, chỗ trống đang làm được tô màu trong bài) */
  function tStemOf(it) { return String((it && it.stem) || "").replace(/^Choose the best answer for blank \(\d+\)\.?$/, "Choose the best answer for the highlighted blank."); }
  /* đáp án dài (câu chèn Part 6, Part 3–4/7) -> xếp 1 cột cho dễ đọc, nhất là trên điện thoại */
  function markLongOpts(el) {
    el = typeof el === "string" ? $(el) : el; if (!el) return;
    [el].concat([].slice.call(el.querySelectorAll(".g-opts, .g-tsubopts"))).forEach(function (c) {
      var long = [].slice.call(c.querySelectorAll(":scope > .g-opt .g-otext")).some(function (t) { return t.textContent.length > 26; });
      c.classList.toggle("g-opts-1", long);
      /* Part 1–2: đáp án chỉ là "(A)…(D)" (lời đọc trong audio) -> 1 hàng nút nhỏ, chừa chỗ cho hình vừa khung (TJ 2026-10-04) */
      var tx = [].slice.call(c.querySelectorAll(":scope > .g-opt .g-otext")).map(function (t) { return t.textContent.trim(); });
      c.classList.toggle("g-tabcd", tx.length >= 3 && tx.every(function (t) { return /^\([A-D]\)$/.test(t); }));
    });
  }
  /* vị trí câu đang làm của ván đề thi — giữ qua F5 (QA: host/người chơi tải lại giữa ván bị làm lại từ câu đầu, điểm cộng trùng) */
  function tPosLoad() {
    G.tMatch = G.st && G.st.matchId; G.ex = null; var sv = null;
    try { sv = JSON.parse(sessionStorage.getItem("tjwl_tpos") || "null"); } catch (e) {}
    if (sv && sv.m && sv.m === G.tMatch) { G.tIdx = sv.i || 0; G.exLC = sv.lc || []; } else { G.tIdx = 0; G.exLC = []; }
  }
  function tPosSave(i) { try { sessionStorage.setItem("tjwl_tpos", JSON.stringify({ m: G.tMatch, i: i != null ? i : G.tIdx || 0, lc: G.exLC || [] })); } catch (e) {} }
  function tSub(it) {
    var ai = "ABCD".indexOf(String(it.answer || "").trim().toUpperCase());
    return { num: it.num, part: it.part, test: G.st && G.st.test ? G.st.test.test : null, sent: tStemOf(it), opts: (it.opts || []).slice(), ans: ai >= 0 ? it.opts[ai] : "" };
  }
  function tGraphic(q) { return /look at the graphic/i.test(q.sent || "") || (q.subs || []).some(function (x) { return /look at the graphic/i.test(x.sent); }); }
  function tKey(q) { return "toeic:" + (q.test || (G.st && G.st.test && G.st.test.test)) + ":" + (q.part || (G.st && G.st.test && G.st.test.part)) + ":" + q.num; }   /* game_answers.term của câu đề thi -> 📊 điểm từng Part / câu hay sai */
  function toeicCommit(q, noSend) {
    if (!q || q.done) return;
    if (G.st && G.st.qtype === "toeic" && G.tMatch === G.st.matchId) tPosSave();   /* đã nộp câu này -> F5 thì sang câu sau (lưu NGAY, trước khi câu kế ghi vị trí của nó) */
    if (q.subs) {   /* nhóm 3 câu: chấm từng câu, gửi host 1 lần */
      q.done = true; lockAll();
      var pk = q.picks || [], batch = q.subs.map(function (sq, i) { var ok = pk[i] != null && norm(pk[i]) === norm(sq.ans); if (G.st && G.st.exam) (G.exLC = G.exLC || []).push({ part: sq.part, ok: ok }); return { ok: ok, tk: tKey(sq), c: pk[i] }; });
      logQ(q, pk, pk);
      if (!noSend) sendAns({ pid: G.me.id, batch: batch });
      return;
    }
    q.done = true;
    if (G.st && G.st.exam) (G.exLC = G.exLC || []).push({ part: q.part, ok: q.pick != null && norm(q.pick) === norm(q.ans) });
    var ok = q.pick != null && norm(q.pick) === norm(q.ans);
    lockAll(); logQ(q, q.pick == null ? null : q.pick, ok);
    if (q.pend) { if (!noSend) sendAns({ pid: G.me.id, pend: true, n: q.num, c: q.pick, ms: (q.pickAt || Date.now()) - G.myQStart }); return; }
    if (!noSend) sendAns({ pid: G.me.id, ok: ok, wid: q.wid, term: q.ans, tk: tKey(q), ms: (q.pickAt || Date.now()) - G.myQStart, c: q.pick });   /* điểm tốc độ tính theo LÚC CHỌN đáp án cuối */   /* bỏ trống = sai như Kahoot */
  }
  /* kiểu tự do: mỗi máy tự sinh câu từ cùng kho, báo đúng/sai cho host chấm điểm */
  function freeNext() {
    if (!G.st || G.st.phase !== "play") return;
    $("#p-next").hidden = true;
    if (G.st.qtype === "toeic" && G.tMatch !== G.st.matchId) tPosLoad();   /* ván mới (hoặc tải lại giữa ván -> làm tiếp đúng câu) */
    var nx = G.st.qtype === "toeic" ? (G.tItems || [])[G.tIdx || 0] : null, multi = G.st.test && (G.st.test.parts || []).length > 1;
    G.tQEnd = G.st.qtype === "toeic" && !G.st.race ? Date.now() + ((multi && nx && T_SEC[nx.part]) || +G.st.qs || 20) * 1000 : 0;   /* đề thi: mỗi câu có giờ riêng (nhiều Part: theo từng Part) */
    if (G.st.exam && G.tMatch === G.st.matchId && nx && nx.part >= 5) { G.tQEnd = 0; return exStart(); }   /* 📝 Thi thật: tới Reading -> làm tự do cả phần, nộp bài */
    if (G.ex) return;
    if (G.st.qtype === "toeic" && G.tMatch === G.st.matchId && (G.tIdx || 0) >= (G.tItems || []).length) {   /* làm hết đề -> chờ ván kết thúc */
      G.tQEnd = 0;
      $("#p-hint").textContent = ""; $("#p-vi").textContent = "🏁"; $("#p-opts").innerHTML = ""; $("#p-res").innerHTML = "";
      $("#p-msg").textContent = T("t_alldone"); return;
    }
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
    q.done = true;
    var k = 0, items = q.ans.map(function (t, i) { var okk = norm(picks[i]) === norm(t); if (okk) k++; return { wid: q.wids[i], term: t, ok: okk }; });
    var ms = Date.now() - G.myQStart;
    q.res = {}; q.res[G.me.id] = { k: k, n: q.n, p: Math.round(POINTS * k * speedFactor(ms, FREE_MS.sheet)) };
    lockAll(); revealRich(q, {}, "#p-msg", "#p-res", "#p-vi");
    logQ(q, null, k === q.n);
    sendAns({ pid: G.me.id, t: "sheet", k: k, n: q.n, items: items, ms: ms });
    showNext(5000);
  }
  function freeAnswer(choice, btn) {
    var q = G.myQ; if (!q) return;
    q.done = true;
    var ms0 = Date.now() - G.myQStart;
    if (q.type === "dict") {
      var acc = wordAcc(choice, q.ans);
      q.res = {}; q.res[G.me.id] = { k: acc.k, n: acc.n, text: choice, p: Math.round(POINTS * acc.r * speedFactor(ms0, FREE_MS.dict)) };
      lockAll(); revealRich(q, {}, "#p-msg", "#p-res", "#p-vi");
      logQ(q, choice, acc.k === acc.n);
      sendAns({ pid: G.me.id, t: "dict", r: acc.r, wid: q.wid, term: q.term, ms: ms0 });
      showNext(3500);
      return;
    }
    if (q.type === "write") {
      lockAll(T("grading"));
      G.waitGrade = true;
      sendAns({ pid: G.me.id, t: "write", text: choice, wid: q.wid, term: q.term, ms: ms0 });
      return;   /* host chấm xong gửi "graded" -> hiện kết quả rồi câu mới */
    }
    var ok = q.type === "recall" ? typedOk(choice, q.ans) : norm(choice) === norm(q.ans);
    if (q.type === "toeic" && G.ex && !G.ex.done) { q.done = false; q.pick = choice; $$("#p-opts .g-opt").forEach(function (x) { x.classList.toggle("g-picked", x === btn); }); exNav(); return; }
    if (q.type === "toeic" && G.st && !G.st.race) {   /* đề thi: còn giờ CÂU thì chọn lại được (kể cả tính điểm theo tốc độ — giống game từ vựng); ⚡ Đua mới chốt ngay */
      q.done = false; q.pick = choice; q.pickAt = Date.now();
      $$("#p-opts .g-opt").forEach(function (x) { x.classList.toggle("g-picked", x === btn); });
      $("#p-msg").textContent = T("t_pick");
      return;   /* chốt khi HẾT GIỜ CÂU (G.tick) rồi tự sang câu — không ai phải bấm gì (TJ) */
    }
    if (q.type === "toeic") {   /* 🎯 làm đề: KHÔNG hiện đúng/sai/đáp án lúc làm (TJ: "sao nhãng") — chỉ đánh dấu ô đã chọn, xem đáp án + lời giải ở 📖 Xem lại */
      lockAll(); if (btn) btn.classList.add("g-picked");
      $("#p-msg").textContent = T("t_saved");
      logQ(q, choice, ok);
      sendAns({ pid: G.me.id, ok: ok, wid: q.wid, term: q.ans, tk: tKey(q), ms: ms0, c: choice });
      showNext(300); return;
    }
    lockAll();
    $$(".g-opt").forEach(function (x) { if (norm(x.dataset.opt) === norm(q.ans)) x.classList.add("ok"); });
    if (!ok && btn) btn.classList.add("bad");
    $("#p-msg").textContent = ok ? T("right") + gainTail(Math.round(POINTS * speedFactor(Date.now() - G.myQStart, FREE_MS.q))) : T("wrong", { a: zhA(q.ans) });
    logQ(q, choice, ok);
    speakQ(q, "ans");
    sendAns({ pid: G.me.id, ok: ok, wid: q.wid, term: q.ans, ms: Date.now() - G.myQStart, c: choice });
    recordMyProgress(q.wid, ok);
    showNext(G.st && G.st.race ? (ok ? 250 : 900) : (ok ? 800 : 1400));   /* đúng: giữ màu xanh 0.8s (0.5s trông như chớp giật trên điện thoại) */   /* ⚡ Đua: sang câu gần như ngay */
  }

  /* Tiến trình học — CHỈ hồ sơ admin (TJ). "Học chung" vẫn tách được qua game_answers (có room_id). */
  async function recordMyProgress(wid, ok) {
    var uid = progUid();
    if (!uid || !wid || tgt() !== "en") return;   /* tiến trình WordLoop gắn với từ TIẾNG ANH */
    (G.myAns = G.myAns || []).push({ wid: wid, ok: !!ok });   /* để xét đẩy chu kỳ Tony Buzan lúc hết ván (srsAfterMatch) */
    try {
      var r = await sb.from("word_progress").select("attempts,correct").eq("user_id", uid).eq("word_id", wid).maybeSingle();
      var at = ((r.data && r.data.attempts) || 0) + 1, co = ((r.data && r.data.correct) || 0) + (ok ? 1 : 0);
      await sb.from("word_progress").upsert({
        user_id: uid, word_id: wid, attempts: at, correct: co,
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
          if (s.q.type === "recall") $("#sc-opts").innerHTML = '<div class="sc-waiting"><b class="sc-ans">' + esc(zhA(s.q.ans)) + "</b> · " + esc(T("n_right", { n: (s.q.oks || []).length })) + " " + (s.q.oks || []).map(function (pid) { return avatar((roster[pid] || {}).avatar); }).join("") + "</div>";
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

  /* 🔁 CHƠI LẠI VÁN NÀY (TJ 2026-10-04: "khi review thì Admin bấm chơi lại ván đó với những người chơi hiện tại"):
     cùng chủ đề / dạng câu / kiểu chơi / giờ; ván vừa xong -> lấy nguyên cài đặt hiện tại; ván cũ trong 📜 Lịch sử -> lấy từ game_matches.
     Bắt đầu NGAY với những người đang trong phòng. */
  function replayMatch(M) {
    if (!G.isHost || !G.st || !G.room || G.st.phase === "play") return;
    if (!confirm(T("replay_q"))) return;
    var st = G.st;
    if (M) {
      st.scope = M.scope || st.scope; st.title = M.title || st.title; st.qtype = M.qtype || st.qtype; st.mode = M.mode || st.mode;
      st.scoring = M.scoring || st.scoring; st.lang = M.meaning_lang || st.lang; st.minutes = M.minutes || st.minutes; st.qs = M.q_seconds || st.qs; st.teams = M.teams || 0;
      if (st.qtype === "toeic" && !st.test) st.qtype = "meaning";
    }
    picked = (st.scope || []).map(function (p) { return { table: p.table, id: p.id, title: p.title || p.id }; });
    st.phase = "lobby"; st.scores = {}; st.q = null; st.matchId = null;
    G.answers = []; G.endAt = 0; G.qUntil = 0; G.lastN = -1; G.srsHtml = ""; G.inHist = false; G.rvMatch = null;
    if (st.qtype === "toeic") G.tStarting = true;
    push(); renderLobby();
    setTimeout(function () { $("#l-start").click(); }, 400);
  }
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#e-replay, #rv-replay")) replayMatch(G.rvMatch || null); });
  $("#e-again").addEventListener("click", function () {
    if (!G.isHost || !G.st) return;
    G.st.phase = "lobby"; G.st.scores = {}; G.st.q = null; G.st.matchId = null;
    G.answers = []; G.endAt = 0; G.qUntil = 0; G.lastN = -1; G.srsHtml = "";
    push(); renderLobby();
  });

  /* ---------- kết quả ---------- */
  /* ---------- 📝 PHIẾU TRẢ LỜI (câu chưa có đáp án — TJ 2026-10-04: Listening làm trước, đáp án đưa sau hoặc chấm tay) ----------
     host gom lựa chọn CUỐI của từng người theo số câu; hết ván -> st.tsheet -> mọi máy thấy bảng; host bấm 🔑 Nhập đáp án
     -> ghi test_items (answer_src='key') + st.tsheet.key -> bảng tự chấm, cả phòng thấy điểm. Không vào game_results/answers. */
  function tSheetAdd(pid, n, c) {
    if (n == null) return;
    var t = G.st.test || {}, S = G.tSheet = G.tSheet || { test: t.test, part: t.part, nums: [], picks: {}, key: {} };
    if (S.nums.indexOf(n) < 0) { S.nums.push(n); S.nums.sort(function (a, b) { return a - b; }); }
    (S.picks[pid] = S.picks[pid] || {})[n] = c == null ? "" : String(c).replace(/^\(([A-D])\).*$/, "$1");
  }
  function tSheetScore(S, pid) {
    var k = 0, n = 0, m = S.picks[pid] || {};
    S.nums.forEach(function (q) { if (S.key[q]) { n++; if (m[q] === S.key[q]) k++; } });
    return { k: k, n: n };
  }
  function paintTSheet(s) {
    var box = $("#e-tsheet"), S = s.tsheet;
    if (!box) { box = document.createElement("div"); box.id = "e-tsheet"; box.className = "g-card g-tsheet"; $("#e-board").after(box); }
    if (!S || !S.nums || !S.nums.length) { box.hidden = true; return; }
    box.hidden = false;
    var roster = s.roster || {}, pids = Object.keys(S.picks), key = S.key || {}, hasKey = Object.keys(key).length;
    var head = "<tr><th>" + esc(T("tsh_who")) + "</th>" + (hasKey ? "<th>✓</th>" : "") + S.nums.map(function (n) { return "<th>" + n + (key[n] ? "<br><b>" + esc(key[n]) + "</b>" : "") + "</th>"; }).join("") + "</tr>";
    var rows = pids.map(function (pid) {
      var p = roster[pid] || {}, m = S.picks[pid] || {}, sc = tSheetScore(S, pid);
      return '<tr class="' + (G.me && pid === G.me.id ? "me" : "") + '"><td>' + label(p) + "</td>" + (hasKey ? "<td><b>" + sc.k + "/" + sc.n + "</b></td>" : "") +
        S.nums.map(function (n) { var c = m[n] || ""; return '<td class="' + (c && key[n] ? (c === key[n] ? "ok" : "bad") : "") + '">' + esc(c || "·") + "</td>"; }).join("") + "</tr>";
    }).join("");
    var dist = "<tr class=\"g-tsd\"><td>Σ</td>" + (hasKey ? "<td></td>" : "") + S.nums.map(function (n) {
      var c = {}; pids.forEach(function (pid) { var x = (S.picks[pid] || {})[n]; if (x) c[x] = (c[x] || 0) + 1; });
      return "<td>" + Object.keys(c).sort().map(function (x) { return x + c[x]; }).join(" ") + "</td>"; }).join("") + "</tr>";
    box.innerHTML = "<h3>📝 " + esc(T("tsh_h", { t: S.test || "", p: S.part || "" })) + "</h3>" +
      '<p class="g-sub">' + esc(T(hasKey ? "tsh_graded" : "tsh_nokey")) + "</p>" +
      '<div class="g-tsw"><table class="g-tst">' + head + rows + dist + "</table></div>" +
      (G.isHost && !s.saved ? '<details class="g-tkey"' + (hasKey ? "" : " open") + "><summary>🔑 " + esc(T("tsh_key")) + "</summary>" +
        '<p class="g-sub">' + esc(T("tsh_keytip", { a: S.nums[0], b: S.nums[S.nums.length - 1] })) + "</p>" +
        '<textarea id="e-key" rows="3" placeholder="' + esc(S.nums[0] + "C " + (S.nums[0] + 1) + "A … / CABD…") + '">' + esc(S.nums.filter(function (n) { return key[n]; }).map(function (n) { return n + key[n]; }).join(" ")) + "</textarea>" +
        '<div class="g-row"><button class="g-btn" id="e-keysave">💾 ' + esc(T("tsh_save")) + '</button></div><p class="g-sub" id="e-keymsg">' + esc(G.tKeyMsg || "") + "</p></details>" : "");
    var b = $("#e-keysave"); if (b) b.onclick = function () { tSaveKey(S); };
  }
  function tParseKey(txt, nums) {
    var key = {}, t = String(txt || "").toUpperCase(), pairs = t.match(/\d+\s*[\.\-:)]?\s*[A-D]/g);
    if (pairs && pairs.length) pairs.forEach(function (x) { var m = x.match(/(\d+)\D*([A-D])/); if (nums.indexOf(+m[1]) >= 0) key[+m[1]] = m[2]; });
    else (t.match(/[A-D]/g) || []).forEach(function (c, i) { if (nums[i] != null) key[nums[i]] = c; });   /* chỉ dãy chữ: lần lượt từ câu đầu */
    return key;
  }
  async function tSaveKey(S) {
    var key = tParseKey($("#e-key").value, S.nums), ks = Object.keys(key), msg = $("#e-keymsg");
    if (!ks.length) { msg.textContent = T("tsh_bad"); return; }
    msg.textContent = T("saving");
    var fail = 0;
    for (var i = 0; i < ks.length; i++) {
      var r = await sb.from("test_items").update({ answer: key[ks[i]], answer_src: "key" }).eq("id", "ets_t" + S.test + "_p" + S.part + "_" + ks[i]);
      if (r.error) fail++;
    }
    S.key = Object.assign({}, S.key || {}, key);
    G.tKeyMsg = fail ? T("tsh_fail", { n: fail }) : T("tsh_ok", { n: ks.length });   /* QA v109 LC4: giữ thông báo qua lần vẽ lại sau push() */
    G.st.tsheet = S; writeLS("tjwl_game_tsheet_" + G.st.matchId, S); push();
    paintTSheet(G.st);
  }
  function renderEnd(s) {
    var mq = G.myQ;   /* 🎯 đề thi (Tự do): câu đang làm dở lúc hết ván vẫn vào Xem lại, ghi "Bỏ qua" như Kahoot (QA v95 T4) */
    if (G.ex) { if (!G.ex.done && iPlay()) exSubmit(); }   /* 📝 Thi thật: host bấm Kết thúc khi chưa nộp -> chấm phần đã làm (vào 📖 Xem lại) */
    else if (mq && mq.type === "toeic" && !mq.done && s.mode === "free" && iPlay()) toeicCommit(mq, true);   /* ván đã chấm xong -> chỉ ghi vào Xem lại */
    show("s-end");
    $("#e-info").textContent = G.isHost || s.saved ? (s.title || "") + " · " + modeLine(s) + " · " + s.minutes + "'" : "";
    $("#e-again").hidden = !G.isHost || s.saved;
    /* 📝 Thi thật: điểm quy đổi của MÌNH ở màn kết quả (cả khi chỉ làm Listening) */
    var exBox = $("#e-exres"); if (!exBox) { exBox = document.createElement("div"); exBox.id = "e-exres"; $("#e-info").insertAdjacentElement("afterend", exBox); }
    var lcO = G.exLC || [];
    if (s.exam && G.exRes && G.exRes.m === s.matchId) exBox.innerHTML = G.exRes.html;
    else if (s.exam && G.tMatch === s.matchId && lcO.length) { var lk0 = lcO.filter(function (x) { return x.ok; }).length; exBox.innerHTML = '<div class="g-exres"><h2>📝 ' + esc(T("ex_done")) + "</h2><p>🎧 Listening: <b>" + lk0 + "/" + lcO.length + "</b> → ~<b>" + tScaled("L", lcO.length >= 100 ? lk0 : Math.round(lk0 / lcO.length * 100)) + "</b></p>" + '<p class="g-sub">' + esc(T("ex_note")) + "</p></div>"; }
    else exBox.innerHTML = "";
    if (!s.saved) G.rvMatch = null;
    $("#e-replay").hidden = !(G.isHost && G.room && (!s.saved || (G.rvMatch && G.rvMatch.qtype !== "toeic")));
    $("#e-hostnav").hidden = false;   /* 📜 cho MỌI người (trước chỉ host) */
    $("#e-review").hidden = s.saved || !G.log.length;
    $("#e-wait").hidden = G.isHost || !!s.saved;
    $("#e-teams").innerHTML = +s.teams ? teamSummary(s, true) : "";
    $("#e-srs").hidden = !(G.isHost && !s.saved && G.srsHtml); $("#e-srs").innerHTML = G.srsHtml || "";
    paintTSheet(s);
    var roster = s.roster || {};
    $("#e-board").innerHTML = rankList(s.scores, s.scoring === "speed").map(function (x) {
      var p = roster[x.pid] || {};
      return '<li class="' + (G.me && x.pid === G.me.id ? "me" : "") + '"><span class="g-rank">' + (x.rank === 1 ? "🥇" : x.rank === 2 ? "🥈" : x.rank === 3 ? "🥉" : x.rank) + "</span>" +
        avatar(p.avatar) + '<span class="g-pname">' + label(p) + "</span>" + (+s.teams ? teamDot((s.teamOf || {})[x.pid]) : "") +
        '<span class="g-streak">' + (x.best >= 2 ? "🔥" + x.best : "") + "</span>" + statsHTML(x, s) + tally(x, s) + "</li>";
    }).join("") || '<li class="g-sub">' + T("nobody") + "</li>";
  }
  async function showMatch(id) {
    var mr = await sb.from("game_matches").select("*,game_rooms(code)").eq("id", id).maybeSingle();
    if (!mr.data) { renderHome(); $("#h-err").textContent = T("no_room", { c: "" }); return; }
    var M = mr.data; G.rvMatch = M;   /* 🔁 host chơi lại đúng ván này */
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

  /* ---------- 👥 quản lý người chơi (chỉ TJ) ---------- */
  $("#l-users").addEventListener("click", function () { renderUsers(); });
  $("#us-back").addEventListener("click", function () { G.inHist = false; if (G.st && G.st.phase === "lobby") renderLobby(); else if (G.st) onState(G.st); });
  /* Danh sách tự làm mới (TJ 2026-10-01: "vừa tạo tk mới mà quản lý tk không thấy") — trước chỉ tải 1 lần lúc mở màn.
     Nay: 🔄 Tải lại · 10 giây/lần khi đang mở màn · ngay khi có người vào/ra phòng (onPresence). */
  $("#us-reload").addEventListener("click", function () { renderUsers(true); });
  setInterval(function () { if (!$("#s-users").hidden && !document.hidden) renderUsers(true); }, 10000);
  async function renderUsers(quiet) {
    if (!isTJ()) return;
    G.inHist = true;   /* như 📜: trạng thái phòng không kéo khỏi màn này */
    show("s-users");
    var box = $("#us-body");
    if (!quiet || !box.querySelector(".g-utable")) box.innerHTML = '<p class="g-sub">Đang tải…</p>';
    var pr = await Promise.all([
      sb.from("game_players").select("id,name,name_no,avatar,profile_id,created_at").order("name").order("name_no"),
      sb.from("game_results").select("player_id").limit(10000),
      sb.from("profiles").select("id,display_name")
    ]);
    if (pr[0].error) { box.innerHTML = '<p class="g-err">' + esc(pr[0].error.message) + "</p>"; return; }
    var games = {}; (pr[1].data || []).forEach(function (r) { games[r.player_id] = (games[r.player_id] || 0) + 1; });
    var pname = {}; (pr[2].data || []).forEach(function (p) { pname[p.id] = p.display_name; });
    var list = pr[0].data || [];
    G.usersList = list;
    $("#us-time").textContent = list.length + " người · cập nhật " + new Date().toLocaleTimeString("vi-VN");
    box.innerHTML = '<table class="g-utable"><thead><tr><th>Người chơi</th><th>Hồ sơ WordLoop</th><th>Ván</th><th>Tạo lúc</th><th></th></tr></thead><tbody>' +
      list.map(function (u) {
        var dupOf = u.name_no > 1 && list.some(function (x) { return x.id !== u.id && norm(x.name) === norm(u.name); });
        return '<tr class="' + (dupOf ? "dup" : "") + '" data-uid="' + esc(u.id) + '"><td>' + avatar(u.avatar) + " " + label({ name: u.name, no: u.name_no }) +
          (u.id === (G.me && G.me.id) ? '<span class="g-utag">bạn</span>' : "") + "</td>" +
          "<td>" + (u.profile_id ? esc(pname[u.profile_id] || u.profile_id.slice(0, 8)) : '<span class="g-sub">—</span>') + "</td>" +
          '<td class="num">' + (games[u.id] || 0) + "</td>" +
          '<td class="g-sub">' + esc(new Date(u.created_at).toLocaleDateString("vi-VN")) + "</td>" +
          '<td class="acts"><button class="g-btn g-btn-soft g-btn-xs" data-uact="link" title="Link riêng: mở là vào game đúng tài khoản này, không cần gõ tên">🔗 Copy link</button><button class="g-btn g-btn-soft g-btn-xs" data-uact="ren">✏️ Đổi tên</button><button class="g-btn g-btn-soft g-btn-xs" data-uact="merge">🔀 Gộp vào…</button>' +
          (u.id === (G.me && G.me.id) ? "" : '<button class="g-btn g-btn-soft g-btn-xs" data-uact="del">🗑</button>') + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  /* chuyển lịch sử ván + câu trả lời của "from" sang "to" rồi xoá "from" (ván trùng -> giữ kết quả của "to") */
  async function mergePlayer(from, to) {
    var tm = await sb.from("game_results").select("match_id").eq("player_id", to);
    var have = {}; (tm.data || []).forEach(function (r) { if (r.match_id) have[r.match_id] = 1; });
    var fr = await sb.from("game_results").select("id,match_id").eq("player_id", from);
    for (var i = 0; i < (fr.data || []).length; i++) {
      var r = fr.data[i];
      if (r.match_id && have[r.match_id]) await sb.from("game_results").delete().eq("id", r.id);
      else { await sb.from("game_results").update({ player_id: to }).eq("id", r.id); if (r.match_id) have[r.match_id] = 1; }
    }
    await sb.from("game_answers").update({ player_id: to }).eq("player_id", from);
    var d = await sb.from("game_players").delete().eq("id", from);
    if (d.error) throw d.error;
  }
  $("#us-body").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-uact]"); if (!b) return;
    var id = b.closest("tr").dataset.uid, list = G.usersList || [], u = list.find(function (x) { return x.id === id; }); if (!u) return;
    var nm = u.name + (u.name_no > 1 ? " #" + u.name_no : "");
    if (b.dataset.uact === "link") {
      var link = location.origin + location.pathname + "?p=" + id;   /* pathname = …/game.html (kể cả khi chạy trong thẻ 🎮 của WordLoop) */
      var done = function () { var t = b.textContent; b.textContent = "✓ Đã copy"; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { prompt("Copy link của " + nm + ":", link); });
      else prompt("Copy link của " + nm + ":", link);
      return;
    }
    try {
      if (b.dataset.uact === "ren") {
        var v = prompt("Tên mới cho " + nm + ":", u.name); if (!v || !v.trim() || v.trim() === u.name) return;
        var r1 = await sb.from("game_players").update({ name: v.trim() }).eq("id", id); if (r1.error) throw r1.error;
      } else if (b.dataset.uact === "del") {
        if (!confirm("Xoá hẳn " + nm + " cùng toàn bộ lịch sử ván của người này?")) return;
        var r2 = await sb.from("game_players").delete().eq("id", id); if (r2.error) throw r2.error;
      } else {
        var others = list.filter(function (x) { return x.id !== id; });
        var guess = others.find(function (x) { return norm(x.name) === norm(u.name) && x.name_no === 1; });
        var ask = others.map(function (x, i) { return (i + 1) + ". " + x.name + (x.name_no > 1 ? " #" + x.name_no : ""); }).join("\n");
        var pick = prompt("Gộp " + nm + " vào ai? Gõ số thứ tự:\n" + ask, guess ? String(others.indexOf(guess) + 1) : "");
        var to = others[(+pick || 0) - 1]; if (!to) return;
        if (!confirm("Gộp " + nm + " vào " + to.name + (to.name_no > 1 ? " #" + to.name_no : "") + "? Lịch sử của " + nm + " chuyển sang, rồi xoá " + nm + ".")) return;
        await mergePlayer(id, to.id);
        if (G.me && G.me.id === id) { G.me = { id: to.id, name: to.name, name_no: to.name_no, avatar: to.avatar }; writeLS(LS_ME, G.me); paintMe(); }
      }
    } catch (err) { alert("Lỗi: " + (err.message || err)); }
    renderUsers();
  });

  /* ---------- 📜 lịch sử & xếp hạng ---------- */
  $("#hi-back").addEventListener("click", function () {   /* về đúng màn đang có của phòng, không tải lại trang */
    G.inHist = false;
    var s = G.st;
    if (!G.room || !s) { location.href = "game.html" + (G.embed ? "?embed=1" : ""); return; }
    if (s.saved || s.phase === "end") return renderEnd(s);
    if (s.phase === "lobby") return renderLobby();
    onState(s);
  });
  $("#hi-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) renderHistory(b.dataset.tab); });
  async function renderHistory(tab) {
    G.inHist = true;
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
    var r = await sb.from("game_results").select("match_id,team,score,rank,correct,wrong,best_streak,created_at,game_matches(title,mode,qtype,meaning_lang,target,minutes,teams,scoring)").eq("player_id", G.me.id).not("match_id", "is", null).order("created_at", { ascending: false }).limit(200);
    if (r.error) throw r.error;
    r.data = r.data.filter(function (x) { return (x.correct || 0) + (x.wrong || 0) > 0; });   /* ẩn ván trống 0/0 (bấm bắt đầu rồi kết thúc ngay) */
    if (!r.data.length) { $("#hi-body").innerHTML = '<p class="g-sub">' + T("no_games") + "</p>"; return; }
    var cnt = await sb.from("game_results").select("match_id").in("match_id", r.data.map(function (x) { return x.match_id; }));
    var nIn = {}; (cnt.data || []).forEach(function (x) { nIn[x.match_id] = (nIn[x.match_id] || 0) + 1; });
    var best = r.data.reduce(function (m, x) { return Math.max(m, x.correct); }, 0);
    var wins = r.data.filter(function (x) { return x.rank === 1; }).length;
    var streak = r.data.reduce(function (m, x) { return Math.max(m, x.best_streak); }, 0);
    var QT = { meaning: "🔤", en2m: "🔤", gap: "📝", recall: "⌨️", mix: "🔀", sheet: "📄", write: "✍️", dict: "🎧" };
    $("#hi-body").innerHTML =
      '<div class="g-stats"><div><b>' + r.data.length + "</b><span>" + T("s_games") + "</span></div><div><b>" + wins + "</b><span>" + T("s_wins") + "</span></div><div><b>✓" + best + "</b><span>" + T("s_bestc") + "</span></div><div><b>🔥" + streak + "</b><span>" + T("s_streak") + "</span></div></div>" +
      '<div class="g-row g-allrv"><button type="button" class="g-btn" data-rvall="all">' + esc(T("rv_all")) + '</button><button type="button" class="g-btn g-btn-soft" data-rvall="wrong">' + esc(T("rv_wrong")) + "</button></div>" +
      '<table class="g-table"><thead><tr><th>' + T("h_date") + "</th><th>" + T("h_topic") + "</th><th>" + T("h_rw") + "</th><th>" + T("h_rank") + "</th></tr></thead><tbody>" +
      r.data.map(function (x) {
        var rm = x.game_matches || {}, d = new Date(x.created_at);
        return "<tr><td>" + d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</td><td><button type="button" class="g-mini g-rvbtn" title="' + esc(T("review_btn")) + '" data-rvmatch="' + esc(x.match_id) + '" data-title="' + esc(rm.title || "") + '">📖</button> <a href="?match=' + esc(x.match_id) + '">' + esc(rm.title || "—") + "</a>" +
          '<div class="g-sub">' + (QT[rm.qtype] || "") + " " + (rm.target && rm.target !== "en" ? "🎯" + FLAG[rm.target] + " " : "") + (FLAG[rm.meaning_lang] || "") + " " + (rm.mode === "kahoot" ? T("m_kahoot") : T("m_free")) + (x.team && TEAM_C[x.team] ? " · " + TEAM_C[x.team].e + " " + esc(teamName(x.team)) : "") + "</div></td><td>" + tally({ c: x.correct, w: x.wrong }) + (x.correct === best && best ? " 🏆" : "") + "</td><td>" +
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
      /* đổi tiếng mẹ đẻ giữa câu: GIỮ từ đang hỏi, chỉ dịch lại phần NGHĨA (QA 2026-10-03: đổi giữa câu Từ→Nghĩa từng
         thay chữ Hán bằng nghĩa = lộ đáp án) */
      if (q && q.type === "en2m") {
        var ml2 = effLang(G.myLang, G.st, "en2m");
        $$("#p-opts .g-opt").forEach(function (b) { var m = (q.optTexts || {})[b.dataset.opt] || {}, t = b.querySelector(".g-otext"); if (t) t.textContent = m[ml2] || m.en || m.vi || b.dataset.opt; });
      } else if (q && (q.type === "meaning" || q.type === "recall")) {
        var badge = $("#p-vi .g-lv"); $("#p-vi").textContent = myText(q) + (q.type === "recall" && q.len ? "  (" + q.len + ")" : ""); if (badge) $("#p-vi").appendChild(badge);
      }
      if (q) $("#p-hint").textContent = T(QHINT[q.type] || "q_meaning");
    }
  });
  async function loadProfile() {
    /* link riêng "game.html?u=<mã hồ sơ>" (giống ?u= của web chính, auth.js): mở 1 lần trên máy mới -> máy đó nhớ hồ sơ
       (kể cả TJ = host), không phải tạo tài khoản mới. Người chơi dùng link trần, không cần ?u= */
    var qid = param("u"), id = qid;
    if (!id) { try { id = localStorage.getItem(LS_LINK); } catch (e) {} }
    if (!id) return;
    var r = await sb.from("profiles").select("id,display_name,is_admin").eq("id", id).maybeSingle();
    if (!r.data) return;
    G.profile = r.data;
    if (qid) {
      try { localStorage.setItem(LS_LINK, id); } catch (e) {}
      var u = new URLSearchParams(location.search); u.delete("u");
      history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "") + location.hash);   /* gỡ mã khỏi thanh địa chỉ */
    }
    /* Máy đang giữ 1 người chơi KHÔNG gắn hồ sơ này (vd xoá cache -> lỡ tạo "TJ#3" lúc chưa nhận ra TJ, rồi mới mở link ?u=)
       -> đổi về người chơi gắn hồ sơ (TJ 2026-10-01: "đang ở TJ mà bấm chơi game lại ra TJ#3"). */
    if (G.me && !G.fromLink) {   /* vừa mở link riêng ?p= -> giữ đúng người trong link */
      var cur = await sb.from("game_players").select("id,profile_id").eq("id", G.me.id).maybeSingle();
      if (!cur.data || cur.data.profile_id !== G.profile.id) {
        var lk = await sb.from("game_players").select("id,name,name_no,avatar").eq("profile_id", G.profile.id).order("created_at").limit(1);
        if (lk.data && lk.data[0]) { G.me = { id: lk.data[0].id, name: lk.data[0].name, name_no: lk.data[0].name_no, avatar: lk.data[0].avatar }; writeLS(LS_ME, G.me); }
        else if (cur.data && !cur.data.profile_id) sb.from("game_players").update({ profile_id: G.profile.id }).eq("id", G.me.id).then(function () {});   /* hồ sơ chưa có người chơi nào -> gắn luôn người chơi này */
      }
    }
    /* máy mới chưa có người chơi: dùng lại người chơi cũ của hồ sơ này (tên + ảnh + lịch sử) thay vì bắt tạo mới */
    if (!G.me) {
      var gp = await sb.from("game_players").select("id,name,name_no,avatar").eq("profile_id", G.profile.id).order("created_at").limit(1);
      if (gp.data && gp.data[0]) { G.me = { id: gp.data[0].id, name: gp.data[0].name, name_no: gp.data[0].name_no, avatar: gp.data[0].avatar }; writeLS(LS_ME, G.me); }
    }
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
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && G.ch && G.me && G.view !== "screen") G.ch.send({ type: "broadcast", event: "alive", payload: { tab: G.tab, id: G.me.id } });
    if (document.visibilityState === "visible" && TREE) refreshTree(true);   /* quay lại từ tab WordLoop -> cây mới */
  });
  window.addEventListener("pagehide", function () { try { if (G.ch) { G.ch.untrack(); sb.removeChannel(G.ch); } } catch (e) {} });
  (async function boot() {
    G.view = param("view");
    G.embed = param("embed") === "1";   /* mở trong thẻ 🎮 Game của WordLoop (iframe, js/gamelayer.js) */
    document.body.classList.toggle("embed", G.embed);
    G.myLang = readLS(LS_LANG);
    G.langSet = !!(G.myLang && G.myLang !== "room");   /* đã TỰ chọn ngôn ngữ chưa (chưa -> theo tiếng chung của phòng) */
    if (!G.langSet) G.myLang = "vi";
    $("#g-mylang").value = G.myLang;
    $("#g-mylang").hidden = G.view === "screen";
    applyUI();
    G.me = readLS(LS_ME);
    /* 🔗 link riêng của 1 người chơi (nút "Copy link" trong 👥 Quản lý người chơi): game.html?p=<id> -> máy này thành
       đúng người đó, không phải gõ tên; link ưu tiên hơn người chơi đang nhớ trên máy. Gỡ ?p khỏi thanh địa chỉ. */
    var pid = param("p");
    if (pid) {
      try {
        var pr = await sb.from("game_players").select("id,name,name_no,avatar,profile_id").eq("id", pid).maybeSingle();
        if (pr.data) { G.me = { id: pr.data.id, name: pr.data.name, name_no: pr.data.name_no, avatar: pr.data.avatar }; writeLS(LS_ME, G.me); G.fromLink = true; G.linkProfile = pr.data.profile_id; }
      } catch (e) {}
      var uq = new URLSearchParams(location.search); uq.delete("p");
      history.replaceState(null, "", location.pathname + (uq.toString() ? "?" + uq : "") + location.hash);
    }
    await loadProfile().catch(function () {});
    await loadMeProfile().catch(function () {});
    /* máy đang đăng nhập hồ sơ KHÁC (vd máy TJ thử link của Son) -> lượt này là người trong link, không nhận host/tiến trình TJ */
    if (G.fromLink && G.profile && G.linkProfile !== G.profile.id) G.profile = null;
    if (!G.langSet && isTJ()) { G.myLang = "vi"; $("#g-mylang").value = "vi"; applyUI(); }   /* máy TJ mặc định tiếng Việt */
    paintMe();
    route();
  })();
})();
