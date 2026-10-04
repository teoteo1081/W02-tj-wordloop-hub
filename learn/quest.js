/* EA Quest — game ôn thi Enrolled Agent.
 * Chạy hoàn toàn trong trình duyệt, không cần server. Tiến độ lưu trong localStorage
 * (và có nút sao lưu / khôi phục ra file JSON để không bao giờ mất).
 */
(function () {
  "use strict";

  const DATA = window.QUEST_LESSONS || window.EA_LESSONS || { lessons: [], vocab: [], questions: [] };
  const CASES = window.QUEST_CASES || window.EA_CASES || [];
  const RESEARCH = window.QUEST_RESEARCH || window.EA_RESEARCH || [];
  // Cấu hình mặc định = game EA. Trang khác (vd Digital Marketing) đặt window.QUEST_CONFIG trước khi nạp file này.
  const CFG = Object.assign({
    storeKey: "ea-quest-v1",
    dailyGoal: 60,
    unlock: { sprint: 100, cases: 200 },
    lessonBase: "../",
    parts: { 1: { label: "Part I", name: "Individuals" }, 2: { label: "Part II", name: "Businesses" }, 3: { label: "Part III", name: "Representation" } },
    mock: { perPart: { 1: 7, 2: 7, 3: 6 }, minutes: 40 },
    typeLabel: { form: "📄 Form nào?", pub: "📘 Tra ở đâu?", authority: "⚖️ Nguồn luật", flag: "🚩 Điểm bất thường" },
    text: {
      pathTitle: "🗺️ Lộ trình từ số 0 đến EA",
      quizIntro: "Câu hỏi lấy từ chính bài học của bạn. Sai câu nào sẽ vào <b>Sổ lỗi sai</b> để làm lại. Đề thi EA thật có 100 câu trong 3,5 giờ, tức khoảng 2 phút/câu ⏰",
      mockDesc: "20 câu trộn cả 3 Part · 40 phút (đúng tốc độ thi thật)",
      mockPass: "Tỉ lệ này là đủ sức đậu rồi đó (đề thật cần khoảng 70%)! 🎓",
      mockFail: "Thi thật cần khoảng 70%. Xem lại các câu sai bên dưới rồi thử lại nha 💪",
      sprintName: "Research Sprint",
      sprintTile: "Tra cứu nhanh 90 giây",
      sprintIntro: "Làm thuế giỏi không phải là thuộc hết, mà là <b>biết tra ở đâu thật nhanh</b> và <b>nhận ra chỗ bất thường</b>. Bạn có 90 giây, trả lời càng nhiều càng tốt! Mỗi câu đúng +6 XP.",
      sprintGuide: "90 giây trả lời thật nhanh mẫu đơn nào, tài liệu nào, nguồn luật nào mạnh hơn, chỗ nào bất thường.",
      caseIntro: "Khách bước vào văn phòng EA của bạn! Mỗi tình huống có 4 bước:<br>① Chọn giấy tờ cần xin<br>② Giải thích bằng <b>ngôn ngữ luật</b><br>③ Giải thích bằng <b>ngôn ngữ của khách</b><br>④ Câu hỏi bẫy, chỉ có 60 giây ⏱️<br>Làm xong tình huống này thì mở tình huống sau nha.",
      docsTitle: "① Bạn sẽ xin khách những giấy tờ nào?",
      docsHint: "Chọn tất cả giấy tờ CẦN THIẾT. Xin thừa giấy không liên quan sẽ bị trừ điểm (khách thấy phiền!).",
      docsUnit: "giấy",
      legalTitle: "② Ngôn ngữ luật ⚖️",
      legalShort: "Ngôn ngữ luật",
      goal: "Đưa bạn từ con số 0 thành một EA biết: <b>hiểu thuật ngữ</b> → <b>làm đúng câu thi</b> → <b>tra cứu nhanh</b> → <b>tư vấn khách</b> bằng cả ngôn ngữ luật lẫn lời dễ hiểu.",
      disclaimer: "Game dùng để ôn tập, không thay thế tư vấn thuế. Các con số (ngưỡng, mức phạt) có thể thay đổi theo năm. Khi làm thật luôn kiểm tra lại trên IRS.gov và tài liệu Gleim mới nhất nha."
    },
    ranks: [
    { xp: 0, emoji: "🐣", vi: "Thực tập sinh thuế", en: "Tax Intern" },
    { xp: 150, emoji: "🐥", vi: "Người làm thuế", en: "Tax Preparer" },
    { xp: 400, emoji: "📒", vi: "Preparer có PTIN", en: "PTIN Holder" },
    { xp: 800, emoji: "🎓", vi: "Ứng viên EA", en: "EA Candidate" },
    { xp: 1500, emoji: "🦅", vi: "Enrolled Agent", en: "Enrolled Agent" },
    { xp: 2500, emoji: "🦉", vi: "EA kỳ cựu", en: "Senior EA" },
    { xp: 4000, emoji: "🛡️", vi: "Chuyên gia đại diện", en: "Representation Pro" },
    { xp: 6000, emoji: "👑", vi: "Huyền thoại thuế", en: "Tax Legend" }
    ]
  }, window.QUEST_CONFIG || {});
  CFG.text = Object.assign({}, CFG.text, (window.QUEST_CONFIG || {}).text || {});
  const STORE_KEY = CFG.storeKey;
  const DAILY_GOAL = CFG.dailyGoal;
  const BOX_DAYS = [0, 1, 2, 4, 7, 15, 30];
  const UNLOCK = CFG.unlock;
  const RANKS = CFG.ranks;
  const TX = CFG.text;
  const PART_IDS = Object.keys(CFG.parts).map(Number);
  const partLabel = (p) => (CFG.parts[p] || { label: "" }).label;
  const CHEERS = [
    "Giỏi quá trời! 🎉", "Chuẩn không cần chỉnh! ✨", "Đúng rồi nè! 💯", "Quá xịn luôn! 🌟",
    "EA tương lai là đây! 🦅", "Ngon lành! 🍀"
  ];
  const COMFORT = [
    "Không sao, sai để nhớ lâu hơn nè 🫶", "Gần đúng rồi, đọc giải thích nha 📖",
    "Câu này bẫy lắm, lần sau né được! 💪", "Bình tĩnh, mình học từ từ 🐢"
  ];
  const TYPE_LABEL = CFG.typeLabel;

  // ---------- tiện ích ----------
  const $app = document.getElementById("app");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const lessonById = Object.fromEntries(DATA.lessons.map((l) => [l.id, l]));
  const shortTitle = (l) => l.title.replace(/^EA( Exam)? Part (I|II|III)\s*[–-]\s*/, "");
  const lessonLink = (id) => { const l = lessonById[id]; return l ? CFG.lessonBase + l.file.split("/").map(encodeURIComponent).join("/") : "#"; };
  DATA.vocab.forEach((v) => { v.key = v.lesson + "|" + v.en; v.part = (lessonById[v.lesson] || {}).part; });
  DATA.questions.forEach((q) => { q.key = q.lesson + "|" + hash(q.q); q.part = (lessonById[q.lesson] || {}).part; });

  // ---------- lưu tiến độ ----------
  function fresh() {
    return { xp: 0, streak: { count: 0, last: "" }, daily: { date: today(), xp: 0 }, vocab: {}, quiz: {}, cases: {}, sprint: { best: 0, plays: 0 }, freeMode: false, theme: "" };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { /* trình duyệt chặn bộ nhớ: vẫn chơi được, chỉ không lưu */ }
    return fresh();
  }
  let S = load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } }
  function applyTheme() { if (S.theme) document.documentElement.setAttribute("data-theme", S.theme); else document.documentElement.removeAttribute("data-theme"); }
  applyTheme();

  function gainXP(n) {
    if (n <= 0) return;
    const before = rankOf(S.xp);
    const t = today();
    if (S.daily.date !== t) S.daily = { date: t, xp: 0 };
    if (S.streak.last !== t) {
      S.streak.count = S.streak.last === addDays(t, -1) ? S.streak.count + 1 : 1;
      S.streak.last = t;
    }
    S.xp += n;
    S.daily.xp += n;
    save();
    const after = rankOf(S.xp);
    if (after.idx > before.idx) toast("🎊 Lên cấp! Bạn giờ là " + after.r.emoji + " " + after.r.vi + " (" + after.r.en + ")", 3500);
  }
  function rankOf(xp) {
    let idx = 0;
    RANKS.forEach((r, i) => { if (xp >= r.xp) idx = i; });
    return { idx, r: RANKS[idx], next: RANKS[idx + 1] };
  }
  function streakNow() { const t = today(); return S.streak.last === t || S.streak.last === addDays(t, -1) ? S.streak.count : 0; }
  const unlocked = (what) => S.freeMode || S.xp >= UNLOCK[what];

  let toastTimer;
  function toast(msg, ms) {
    const el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), ms || 1800);
  }
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return toast("Trình duyệt này chưa hỗ trợ đọc to 🥲");
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* bỏ qua */ }
  }

  // ---------- điều hướng ----------
  let timer = null;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function go(screen, arg) {
    stopTimer();
    try { speechSynthesis && speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ }
    (SCREENS[screen] || SCREENS.home)(arg);
    window.scrollTo(0, 0);
  }
  const back = (to, label) => `<div class="topbar"><button class="back" data-go="${to || "home"}">← ${label || "Trang chủ"}</button>${xpPill()}</div>`;
  const xpPill = () => `<span class="pill">⭐ ${S.xp} XP · 🔥 ${streakNow()}</span>`;
  const owl = (text) => `<div class="mascot"><div class="owl">🦉</div><div class="bubble">${text}</div></div>`;

  $app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-act],[data-speak]");
    if (!t || t.disabled) return;
    if (t.dataset.speak != null) return speak(t.dataset.speak);
    if (t.dataset.go) return go(t.dataset.go, t.dataset.arg);
    const fn = ACTIONS[t.dataset.act];
    if (fn) fn(t);
  });
  let ACTIONS = {};

  // ---------- TRANG CHỦ ----------
  function home() {
    const { r, next } = rankOf(S.xp);
    const pct = next ? Math.round(((S.xp - r.xp) / (next.xp - r.xp)) * 100) : 100;
    const dailyXp = S.daily.date === today() ? S.daily.xp : 0;
    const dueCount = dueWords().length;
    const wrongCount = DATA.questions.filter((q) => (S.quiz[q.key] || {}).last === 0).length;
    const casesDone = CASES.filter((c) => S.cases[c.id]).length;
    const lockNote = (w) => `🔒 Cần ${UNLOCK[w]} XP`;
    $app.innerHTML = `
      <section class="card hero pop">
        <div class="row">
          <div class="rank-emoji">${r.emoji}</div>
          <div style="flex:1;min-width:180px">
            <small>Cấp hiện tại</small>
            <h1>${esc(r.vi)}</h1>
            <div class="muted">${esc(r.en)}${next ? ` · còn ${next.xp - S.xp} XP nữa lên <b>${esc(next.vi)}</b>` : " · cấp cao nhất rồi! 👑"}</div>
          </div>
        </div>
        <div class="bar" style="margin:12px 0 8px"><i style="width:${pct}%"></i></div>
        <div class="row spread">
          <span class="pill">⭐ ${S.xp} XP</span>
          <span class="pill">🔥 ${streakNow()} ngày liên tiếp</span>
          <span class="pill">🎯 Hôm nay ${Math.min(dailyXp, DAILY_GOAL)}/${DAILY_GOAL} XP</span>
        </div>
      </section>
      ${owl(dailyXp >= DAILY_GOAL ? "Hôm nay bạn xong mục tiêu rồi, giỏi ghê! Chơi thêm thì càng nhớ lâu nha 💜" :
            dueCount ? `Có <b>${dueCount} từ</b> đến hạn ôn lại. Ôn trước khi học từ mới nha, não sẽ nhớ chắc hơn 🧠` :
            "Mỗi ngày chỉ cần 15 phút: 1 lượt từ vựng + 1 lượt trắc nghiệm. Đều đặn quan trọng hơn học dồn nha ✨")}
      <h2 class="section-title">${TX.pathTitle}</h2>
      <div class="grid">
        <button class="tile" data-go="vocabMenu"><span class="step-no">Bước 1</span><span class="ico">📚</span><b>Từ vựng</b><small>${DATA.vocab.length} thuật ngữ · ${dueCount} từ cần ôn</small></button>
        <button class="tile" data-go="quizMenu"><span class="step-no">Bước 2</span><span class="ico">📝</span><b>Trắc nghiệm</b><small>${DATA.questions.length} câu kiểu đề thi thật</small></button>
        <button class="tile" data-go="sprintMenu" ${unlocked("sprint") ? "" : "disabled"}><span class="step-no">Bước 3</span><span class="ico">⏱️</span><b>${TX.sprintName}</b><small>${unlocked("sprint") ? `${TX.sprintTile} · kỷ lục ${S.sprint.best}` : lockNote("sprint")}</small></button>
        <button class="tile" data-go="caseMenu" ${unlocked("cases") ? "" : "disabled"}><span class="step-no">Bước 4</span><span class="ico">🧑‍💼</span><b>Bàn tiếp khách</b><small>${unlocked("cases") ? `${casesDone}/${CASES.length} tình huống` : lockNote("cases")}</small></button>
      </div>
      <h2 class="section-title">🎒 Công cụ</h2>
      <div class="grid">
        <button class="tile" data-go="notebook"><span class="ico">📒</span><b>Sổ lỗi sai</b><small>${wrongCount} câu cần làm lại</small></button>
        <button class="tile" data-go="progress"><span class="ico">📊</span><b>Tiến độ</b><small>Xem từng bài học</small></button>
        <button class="tile" data-go="settings"><span class="ico">💾</span><b>Sao lưu & cài đặt</b><small>Không bao giờ mất tiến độ</small></button>
        <button class="tile" data-go="guide"><span class="ico">💡</span><b>Cách chơi</b><small>Đọc 1 phút là hiểu</small></button>
      </div>`;
  }

  // ---------- TỪ VỰNG ----------
  function dueWords() {
    const t = today();
    return DATA.vocab.filter((v) => { const s = S.vocab[v.key]; return s && s.due <= t && s.box < BOX_DAYS.length; });
  }
  function vocabMenu() {
    const due = dueWords();
    $app.innerHTML = back() + `
      <h1>📚 Từ vựng</h1>
      ${owl("Mỗi lượt 10 từ. Trả lời đúng thì từ đó được 'lên hộp' và hẹn ôn lại sau vài ngày. Sai thì ôn lại sớm hơn. Cứ vậy là nhớ lâu cực kỳ! 🧠")}
      <div class="card" style="margin-top:12px">
        <div class="row spread"><div><b>🔁 Ôn từ đến hạn</b><div class="muted">${due.length} từ đang chờ bạn</div></div>
        <button class="btn" data-act="vocabDue" ${due.length ? "" : "disabled"}>Ôn ngay</button></div>
      </div>
      ${partLessonList("vocab")}`;
  }
  function partLessonList(mode) {
    let html = "";
    PART_IDS.forEach((p) => {
      const ls = DATA.lessons.filter((l) => l.part === p);
      if (!ls.length) return;
      html += `<h2 class="section-title"><span class="pill p${(p - 1) % 3 + 1}">${esc(partLabel(p))}</span> ${esc(CFG.parts[p].name)}</h2>`;
      if (mode === "quiz" && DATA.questions.filter((q) => q.part === p).length > 10) html += `<button class="list-item" data-act="quizPart" data-arg="${p}"><span>🎲 <b>Đề trộn ${esc(partLabel(p))}</b><div class="meta">15 câu ngẫu nhiên từ mọi bài</div></span><span>›</span></button>`;
      ls.forEach((l) => {
        const meta = mode === "vocab" ? vocabStat(l.id) : quizStat(l.id);
        html += `<button class="list-item" data-act="${mode}Lesson" data-arg="${l.id}"><span><b>${esc(shortTitle(l))}</b><div class="meta">${meta.text}</div></span><span class="pill">${meta.pct}%</span></button>`;
      });
    });
    return html;
  }
  function vocabStat(id) {
    const vs = DATA.vocab.filter((v) => v.lesson === id);
    const learned = vs.filter((v) => (S.vocab[v.key] || {}).box >= 3).length;
    const seen = vs.filter((v) => S.vocab[v.key]).length;
    return { text: `${vs.length} từ · đã gặp ${seen} · thuộc ${learned}`, pct: vs.length ? Math.round((learned / vs.length) * 100) : 0 };
  }
  function quizStat(id) {
    const qs = DATA.questions.filter((q) => q.lesson === id);
    const ok = qs.filter((q) => (S.quiz[q.key] || {}).last === 1).length;
    return { text: `${qs.length} câu · đang đúng ${ok}`, pct: qs.length ? Math.round((ok / qs.length) * 100) : 0 };
  }

  let V = null; // lượt từ vựng đang chơi
  function startVocab(items, title, backTo) {
    if (!items.length) return toast("Không có từ nào để ôn 🎉");
    V = { items, i: 0, right: 0, xp: 0, title, backTo: backTo || "vocabMenu", wrong: [] };
    vocabQ();
  }
  function vocabPool(v) {
    const same = DATA.vocab.filter((x) => x.lesson === v.lesson && x.kind === v.kind && x.en !== v.en && x.vi !== v.vi);
    const wide = DATA.vocab.filter((x) => x.part === v.part && x.kind === v.kind && x.en !== v.en && x.vi !== v.vi);
    return (same.length >= 3 ? same : wide);
  }
  function vocabQ() {
    const v = V.items[V.i];
    const st = S.vocab[v.key];
    const reverse = v.kind === "term" && st && st.box >= 2 && Math.random() < 0.5;
    const distract = shuffle(vocabPool(v)).filter((x, i, a) => a.findIndex((y) => (reverse ? y.en : y.vi) === (reverse ? x.en : x.vi)) === i).slice(0, 3);
    const opts = shuffle([v].concat(distract));
    V.cur = { v, reverse, opts, answer: opts.indexOf(v) };
    const isNew = !st;
    $app.innerHTML = back(V.backTo, "Thoát") + `
      <div class="steps">${V.items.map((_, i) => `<i class="${i <= V.i ? "on" : ""}"></i>`).join("")}</div>
      <div class="card pop">
        <div class="row spread"><small>${esc(V.title)} · ${V.i + 1}/${V.items.length}</small>${isNew ? '<span class="pill">✨ Từ mới</span>' : `<span class="pill">📦 Hộp ${st.box}</span>`}</div>
        ${v.kind === "fact" ? `<div class="muted" style="margin-top:8px">Bảng: ${esc(v.head)}</div>` : ""}
        <div class="question" style="margin-top:8px">
          ${reverse ? `<div class="muted">Thuật ngữ tiếng Anh nào có nghĩa là:</div><div class="term" style="font-size:20px">${esc(v.vi)}</div>`
                    : `<div class="muted">${v.kind === "fact" ? "Thông tin đúng cho:" : "Nghĩa đúng là gì?"}</div><div class="row"><span class="term">${esc(v.en)}</span><button class="speak" data-speak="${esc(v.en)}" aria-label="Nghe phát âm">🔊</button></div>`}
        </div>
        <div id="opts">${opts.map((o, i) => `<button class="opt" data-act="vocabAns" data-arg="${i}">${esc(reverse ? o.en : o.vi)}</button>`).join("")}</div>
        <div id="after"></div>
      </div>`;
  }
  ACTIONS.vocabAns = (btn) => {
    const i = +btn.dataset.arg, c = V.cur, v = c.v, ok = i === c.answer;
    document.querySelectorAll("#opts .opt").forEach((b, j) => { b.disabled = true; if (j === c.answer) b.classList.add("right"); else if (j === i) b.classList.add("wrong"); });
    const st = S.vocab[v.key] || { box: 0, due: today(), right: 0, wrong: 0 };
    if (ok) { st.box = Math.min(st.box + 1, BOX_DAYS.length - 1); st.right++; V.right++; V.xp += 5; }
    else { st.box = 0; st.wrong++; V.wrong.push(v); }
    st.due = addDays(today(), BOX_DAYS[st.box]);
    S.vocab[v.key] = st; save();
    const l = lessonById[v.lesson];
    document.getElementById("after").innerHTML = `
      <div class="feedback ${ok ? "ok" : "bad"}"><b>${ok ? pick(CHEERS) : pick(COMFORT)}</b><br>
        <b>${esc(v.en)}</b> <button class="speak" data-speak="${esc(v.en)}">🔊</button> = ${esc(v.vi)}
        <div class="muted" style="margin-top:6px">📍 ${esc(v.section)}${l ? ` · <a href="${lessonLink(v.lesson)}" target="_blank" rel="noopener">mở bài học</a>` : ""}</div>
        <div class="muted">Ôn lại sau: ${BOX_DAYS[st.box] === 0 ? "hôm nay" : BOX_DAYS[st.box] + " ngày"}</div>
      </div>
      <button class="btn block" data-act="vocabNext">${V.i + 1 < V.items.length ? "Tiếp nha →" : "Xem kết quả 🎁"}</button>`;
    if (ok) speak(v.en);
  };
  ACTIONS.vocabNext = () => {
    V.i++;
    if (V.i < V.items.length) return vocabQ();
    gainXP(V.xp);
    const pct = Math.round((V.right / V.items.length) * 100);
    $app.innerHTML = back(V.backTo, "Từ vựng") + `
      <div class="card pop" style="text-align:center">
        <div class="big">${pct >= 80 ? "🏆" : pct >= 50 ? "🌱" : "🐢"} ${V.right}/${V.items.length}</div>
        <p>+${V.xp} XP</p>
        ${owl(pct >= 80 ? "Xuất sắc! Mấy từ này sẽ hẹn gặp lại bạn sau vài ngày để khắc sâu nha." : "Không sao hết! Mấy từ sai sẽ quay lại sớm, gặp vài lần là thuộc liền 💪")}
      </div>
      ${V.wrong.length ? `<div class="card"><h3>Từ cần nhớ thêm</h3><table class="mini">${V.wrong.map((w) => `<tr><td><b>${esc(w.en)}</b> <button class="speak" data-speak="${esc(w.en)}">🔊</button></td><td>${esc(w.vi)}</td></tr>`).join("")}</table></div>` : ""}
      <div class="row"><button class="btn" data-act="vocabAgain">Chơi lượt nữa</button><button class="btn ghost" data-go="home">Về trang chủ</button></div>`;
  };
  ACTIONS.vocabAgain = () => (V.lesson ? ACTIONS.vocabLesson({ dataset: { arg: V.lesson } }) : V.backTo === "notebook" ? ACTIONS.redoWeak() : ACTIONS.vocabDue());
  ACTIONS.vocabDue = () => { startVocab(shuffle(dueWords()).slice(0, 10), "Ôn từ đến hạn"); };
  ACTIONS.vocabLesson = (btn) => {
    const id = btn.dataset.arg, t = today();
    const all = DATA.vocab.filter((v) => v.lesson === id);
    const due = shuffle(all.filter((v) => S.vocab[v.key] && S.vocab[v.key].due <= t));
    const fresh = all.filter((v) => !S.vocab[v.key]);
    const rest = shuffle(all.filter((v) => S.vocab[v.key] && S.vocab[v.key].due > t)).sort((a, b) => S.vocab[a.key].box - S.vocab[b.key].box);
    // ưu tiên: từ đến hạn → tối đa 5 từ mới (theo thứ tự bài) → từ còn yếu
    const items = due.slice(0, 10);
    items.push(...fresh.slice(0, Math.min(5, 10 - items.length)));
    items.push(...rest.slice(0, 10 - items.length));
    items.push(...fresh.slice(5, 5 + 10 - items.length));
    startVocab(shuffle(items), shortTitle(lessonById[id]));
    V.lesson = id;
  };

  // ---------- TRẮC NGHIỆM ----------
  function quizMenu() {
    $app.innerHTML = back() + `
      <h1>📝 Trắc nghiệm</h1>
      ${owl(TX.quizIntro)}
      <div class="card" style="margin-top:12px">
        <div class="row spread"><div><b>⏰ Thi thử mini</b><div class="muted">${TX.mockDesc}</div></div>
        <button class="btn" data-act="quizMock">Bắt đầu</button></div>
      </div>
      ${partLessonList("quiz")}`;
  }
  let Q = null;
  function startQuiz(items, title, opts) {
    if (!items.length) return toast("Không có câu nào ở đây 🎉");
    Q = Object.assign({ items, i: 0, right: 0, xp: 0, title, wrong: [], backTo: "quizMenu", limit: 0 }, opts || {});
    if (Q.limit) { Q.end = Date.now() + Q.limit * 1000; }
    quizQ();
  }
  function quizTimer() {
    if (!Q.limit) return;
    stopTimer();
    const tick = () => {
      const left = Math.max(0, Math.round((Q.end - Date.now()) / 1000));
      const el = document.getElementById("qtimer");
      if (el) { el.textContent = "⏰ " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); el.classList.toggle("low", left < 120); }
      if (left <= 0) { stopTimer(); toast("Hết giờ! ⏰"); quizEnd(); }
    };
    tick(); timer = setInterval(tick, 1000);
  }
  function quizQ() {
    const q = Q.items[Q.i];
    const l = lessonById[q.lesson];
    $app.innerHTML = back(Q.backTo, "Thoát") + `
      <div class="row spread" style="margin-bottom:8px"><small>${esc(Q.title)} · câu ${Q.i + 1}/${Q.items.length}</small>${Q.limit ? '<span class="timer" id="qtimer"></span>' : ""}</div>
      <div class="steps">${Q.items.map((_, i) => `<i class="${i <= Q.i ? "on" : ""}"></i>`).join("")}</div>
      <div class="card pop">
        <div class="row"><span class="pill p${(q.part - 1) % 3 + 1}">${esc(partLabel(q.part))}</span><small>${esc(q.section)}</small></div>
        <div class="question" style="margin-top:10px">${esc(q.q)}</div>
        <div id="opts">${q.opts.map((o, i) => `<button class="opt" data-act="quizAns" data-arg="${i}"><span class="letter">${"ABCD"[i]}.</span>${esc(o)}</button>`).join("")}</div>
        <div id="after"></div>
      </div>`;
    quizTimer();
    Q.lessonLink = l ? lessonLink(q.lesson) : "";
  }
  ACTIONS.quizAns = (btn) => {
    const i = +btn.dataset.arg, q = Q.items[Q.i], ok = i === q.a;
    document.querySelectorAll("#opts .opt").forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add("right"); else if (j === i) b.classList.add("wrong"); });
    const st = S.quiz[q.key] || { right: 0, wrong: 0, last: null };
    if (ok) { st.right++; st.last = 1; Q.right++; Q.xp += 10; } else { st.wrong++; st.last = 0; Q.wrong.push({ q, pickedIdx: i }); }
    S.quiz[q.key] = st; save();
    document.getElementById("after").innerHTML = `
      <div class="feedback ${ok ? "ok" : "bad"}"><b>${ok ? pick(CHEERS) : pick(COMFORT)}</b> Đáp án: <b>${"ABCD"[q.a]}. ${esc(q.opts[q.a])}</b>
        ${q.exp ? `<div style="margin-top:6px">💡 ${esc(q.exp)}</div>` : ""}
        ${Q.lessonLink ? `<div class="muted" style="margin-top:6px">📖 <a href="${Q.lessonLink}" target="_blank" rel="noopener">Đọc lại bài: ${esc(q.section)}</a></div>` : ""}
      </div>
      <button class="btn block" data-act="quizNext">${Q.i + 1 < Q.items.length ? "Câu tiếp →" : "Xem kết quả 🎁"}</button>`;
  };
  ACTIONS.quizNext = () => { Q.i++; if (Q.i < Q.items.length) quizQ(); else quizEnd(); };
  function quizEnd() {
    stopTimer();
    gainXP(Q.xp);
    const done = Q.limit ? Q.i + (document.querySelector("#opts .opt:disabled") ? 1 : 0) : Q.items.length;
    const total = Q.items.length;
    const pct = Math.round((Q.right / total) * 100);
    $app.innerHTML = back(Q.backTo, "Trắc nghiệm") + `
      <div class="card pop" style="text-align:center">
        <div class="big">${pct >= 70 ? "🏆" : pct >= 50 ? "🌱" : "🐢"} ${Q.right}/${total}</div>
        <p>+${Q.xp} XP${Q.limit ? ` · làm được ${Math.min(done, total)}/${total} câu` : ""}</p>
        ${owl(Q.limit ? (pct >= 70 ? TX.mockPass : TX.mockFail)
                     : pct >= 80 ? "Bạn nắm bài này chắc rồi! Thử đề trộn hoặc thi thử nha." : "Mấy câu sai đã vào Sổ lỗi sai. Đọc giải thích rồi làm lại sau 1 ngày là nhớ liền!")}
      </div>
      ${Q.wrong.length ? `<div class="card"><h3>📒 Câu sai lượt này</h3>${Q.wrong.map((w) => `<div style="margin-bottom:12px"><b>${esc(w.q.q)}</b><div class="muted">Bạn chọn: ${"ABCD"[w.pickedIdx]}. ${esc(w.q.opts[w.pickedIdx])}</div><div>✅ ${"ABCD"[w.q.a]}. ${esc(w.q.opts[w.q.a])}</div>${w.q.exp ? `<div class="muted">💡 ${esc(w.q.exp)}</div>` : ""}</div>`).join("")}</div>` : ""}
      <div class="row"><button class="btn" data-go="${Q.backTo}">Chơi tiếp</button><button class="btn ghost" data-go="home">Về trang chủ</button></div>`;
  }
  function quizPick(pool, n) {
    // ưu tiên câu chưa làm và câu từng sai, rồi mới đến câu đã đúng
    const score = (q) => { const s = S.quiz[q.key]; return !s ? 1 : s.last === 0 ? 0 : 2; };
    return shuffle(pool).sort((a, b) => score(a) - score(b)).slice(0, n);
  }
  ACTIONS.quizLesson = (btn) => { const id = btn.dataset.arg; startQuiz(quizPick(DATA.questions.filter((q) => q.lesson === id), 10), shortTitle(lessonById[id])); };
  ACTIONS.quizPart = (btn) => { const p = +btn.dataset.arg; startQuiz(quizPick(DATA.questions.filter((q) => q.part === p), 15), "Đề trộn " + partLabel(p)); };
  ACTIONS.quizMock = () => {
    let items = [];
    Object.entries(CFG.mock.perPart).forEach(([p, n]) => { items = items.concat(quizPick(DATA.questions.filter((q) => q.part === +p), n)); });
    startQuiz(shuffle(items), "Thi thử mini", { limit: CFG.mock.minutes * 60 });
  };

  // ---------- RESEARCH SPRINT ----------
  let R = null;
  function sprintMenu() {
    $app.innerHTML = back() + `
      <h1>⏱️ ${TX.sprintName}</h1>
      ${owl(TX.sprintIntro)}
      <div class="card" style="margin-top:12px">
        <p><b>Chọn loại câu hỏi:</b></p>
        <div class="chips" id="chips">${Object.entries(TYPE_LABEL).map(([k, v]) => `<button class="chip on" data-act="chip" data-arg="${k}">${v}</button>`).join("")}</div>
        <div class="row spread"><span class="muted">🏅 Kỷ lục: <b>${S.sprint.best}</b> câu · đã chơi ${S.sprint.plays} lượt</span>
        <button class="btn" data-act="sprintStart">Bắt đầu 90 giây!</button></div>
      </div>`;
  }
  ACTIONS.chip = (b) => b.classList.toggle("on");
  ACTIONS.sprintStart = () => {
    const types = [...document.querySelectorAll("#chips .chip.on")].map((b) => b.dataset.arg);
    const pool = RESEARCH.filter((r) => types.includes(r.type));
    if (!pool.length) return toast("Chọn ít nhất 1 loại nha 🥺");
    R = { pool: shuffle(pool), i: 0, right: 0, wrong: [], end: Date.now() + 90000, over: false };
    sprintQ();
    const tick = () => {
      const left = Math.max(0, Math.ceil((R.end - Date.now()) / 1000));
      const el = document.getElementById("stimer");
      if (el) { el.textContent = "⏱️ " + left + "s"; el.classList.toggle("low", left <= 15); }
      if (left <= 0) sprintEnd();
    };
    tick(); timer = setInterval(tick, 250);
  };
  function sprintQ() {
    if (R.i >= R.pool.length) { R.pool = R.pool.concat(shuffle(R.pool)); }
    const q = R.pool[R.i];
    const order = shuffle(q.opts.map((_, i) => i));
    R.cur = { q, order };
    $app.innerHTML = `
      <div class="topbar"><button class="back" data-act="sprintQuit">← Dừng</button><span class="timer" id="stimer">⏱️ 90s</span><span class="pill">✅ ${R.right}</span></div>
      <div class="card pop">
        <small>${TYPE_LABEL[q.type]}</small>
        <div class="question" style="margin-top:6px">${esc(q.q)}</div>
        <div id="opts">${order.map((oi) => `<button class="opt" data-act="sprintAns" data-arg="${oi}">${esc(q.opts[oi])}</button>`).join("")}</div>
        <div id="after"></div>
      </div>`;
  }
  ACTIONS.sprintAns = (btn) => {
    if (R.over) return;
    const oi = +btn.dataset.arg, q = R.cur.q, ok = oi === q.a;
    document.querySelectorAll("#opts .opt").forEach((b) => { b.disabled = true; const k = +b.dataset.arg; if (k === q.a) b.classList.add("right"); else if (k === oi) b.classList.add("wrong"); });
    if (ok) R.right++; else R.wrong.push(q);
    document.getElementById("after").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}">${ok ? "✅" : "❌"} ${esc(q.exp)}</div><button class="btn block" data-act="sprintNext">Tiếp →</button>`;
  };
  ACTIONS.sprintNext = () => { if (R.over) return; R.i++; sprintQ(); };
  ACTIONS.sprintQuit = () => sprintEnd();
  function sprintEnd() {
    if (!R || R.over) return;
    R.over = true; stopTimer();
    const record = R.right > S.sprint.best;
    S.sprint.plays++; if (record) S.sprint.best = R.right;
    save(); gainXP(R.right * 6);
    const seen = new Set();
    const wrong = R.wrong.filter((q) => !seen.has(q.q) && seen.add(q.q));
    $app.innerHTML = back("sprintMenu", TX.sprintName) + `
      <div class="card pop" style="text-align:center">
        <div class="big">${record ? "🏅 Kỷ lục mới!" : "⏱️"} ${R.right} câu</div>
        <p>+${R.right * 6} XP</p>
        ${owl(R.right >= 12 ? "Tốc độ tra cứu của chuyên gia luôn! 🚀" : "Chơi vài lượt nữa là các mẫu đơn sẽ tự nhảy ra trong đầu bạn 😎")}
      </div>
      ${wrong.length ? `<div class="card"><h3>Ôn lại câu sai</h3>${wrong.map((q) => `<div style="margin-bottom:10px"><b>${esc(q.q)}</b><div>✅ ${esc(q.opts[q.a])}</div><div class="muted">${esc(q.exp)}</div></div>`).join("")}</div>` : ""}
      <div class="row"><button class="btn" data-go="sprintMenu">Chơi lại</button><button class="btn ghost" data-go="home">Về trang chủ</button></div>`;
  }

  // ---------- BÀN TIẾP KHÁCH ----------
  function caseMenu() {
    let prevDone = true;
    const items = CASES.map((c) => {
      const res = S.cases[c.id];
      const open = S.freeMode || prevDone;
      prevDone = !!res;
      const stars = res ? "⭐".repeat(res.stars) + "☆".repeat(3 - res.stars) : open ? "Mới" : "🔒";
      return `<button class="list-item" data-act="caseOpen" data-arg="${c.id}" ${open ? "" : "disabled"}>
        <span class="row" style="flex-wrap:nowrap"><span style="font-size:28px">${c.emoji}</span><span><b>${esc(c.title)}</b><div class="meta"><span class="pill p${(c.part - 1) % 3 + 1}">${esc(partLabel(c.part))}</span> ${esc(c.client)}</div></span></span>
        <span class="pill">${stars}</span></button>`;
    }).join("");
    $app.innerHTML = back() + `
      <h1>🧑‍💼 Bàn tiếp khách</h1>
      ${owl(TX.caseIntro)}
      <div style="margin-top:12px">${items}</div>`;
  }
  let C = null;
  ACTIONS.caseOpen = (btn) => {
    const c = CASES.find((x) => x.id === btn.dataset.arg);
    C = { c, step: 0, score: { docs: 0, legal: 0, plain: 0, critical: 0 } };
    caseStep();
  };
  const caseSteps = () => `<div class="steps">${[0, 1, 2, 3, 4].map((i) => `<i class="${i <= C.step ? "on" : ""}"></i>`).join("")}</div>`;
  function caseStep() {
    stopTimer();
    const c = C.c;
    const head = back("caseMenu", "Danh sách khách") + caseSteps();
    if (C.step === 0) {
      $app.innerHTML = head + `
        <div class="card pop">
          <div class="row"><span style="font-size:44px">${c.emoji}</span><div><h2>${esc(c.title)}</h2><div class="muted">${esc(c.client)}</div></div></div>
          <p style="margin-top:10px">${esc(c.story)}</p>
          <div class="quote">"${esc(c.quote)}" <button class="speak" data-speak="${esc(c.quote)}">🔊</button></div>
          <p class="muted">🎯 Điểm mấu chốt cần giải thích: <b>${esc(c.focus)}</b></p>
          <button class="btn block" data-act="caseNext">Bắt đầu tư vấn →</button>
        </div>`;
    } else if (C.step === 1) {
      C.docs = shuffle(c.docs);
      $app.innerHTML = head + `
        <div class="card pop">
          <h3>${TX.docsTitle}</h3>
          <p class="muted">${TX.docsHint}</p>
          <div id="docs">${C.docs.map((d, i) => `<label class="check" data-i="${i}"><input type="checkbox" value="${i}"><span>${esc(d.name)}<span class="why"></span></span></label>`).join("")}</div>
          <div id="after"><button class="btn block" data-act="docsCheck">Chốt danh sách ✔️</button></div>
        </div>`;
    } else if (C.step === 2 || C.step === 3 || C.step === 4) {
      const key = ["", "", "legal", "plain", "critical"][C.step];
      const block = c[key];
      const order = shuffle(block.options.map((_, i) => i));
      C.order = order;
      const titles = { legal: TX.legalTitle, plain: "③ Ngôn ngữ của khách 💬", critical: "④ Tình huống bẫy 🧠" };
      $app.innerHTML = head + `
        <div class="card pop">
          <div class="row spread"><h3>${titles[key]}</h3>${key === "critical" ? '<span class="timer" id="ctimer">⏱️ 60s</span>' : ""}</div>
          <div class="question">${esc(block.q)}</div>
          <div id="opts">${order.map((oi) => `<button class="opt" data-act="caseAns" data-arg="${oi}">${key === "legal" ? `<span lang="en">${esc(block.options[oi])}</span>` : esc(block.options[oi])}</button>`).join("")}</div>
          <div id="after"></div>
        </div>`;
      if (key === "critical") {
        const end = Date.now() + 60000;
        timer = setInterval(() => {
          const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
          const el = document.getElementById("ctimer");
          if (el) { el.textContent = "⏱️ " + left + "s"; el.classList.toggle("low", left <= 10); }
          if (left <= 0) { stopTimer(); caseAnswer(-1); }
        }, 250);
      }
    } else {
      caseEnd();
    }
  }
  ACTIONS.caseNext = () => { C.step++; caseStep(); };
  ACTIONS.docsCheck = () => {
    const picked = new Set([...document.querySelectorAll("#docs input:checked")].map((x) => +x.value));
    let must = 0, mustHit = 0, noHit = 0;
    C.docs.forEach((d, i) => {
      const el = document.querySelector(`#docs .check[data-i="${i}"]`);
      el.querySelector("input").disabled = true;
      el.classList.add(d.need); if (picked.has(i)) el.classList.add("picked");
      if (d.need === "must") { must++; if (picked.has(i)) mustHit++; else el.classList.add("missed"); }
      if (d.need === "no" && picked.has(i)) noHit++;
      const label = { must: "Cần", maybe: "Tùy trường hợp", no: "Không cần" }[d.need];
      el.querySelector(".why").innerHTML = ` <span class="tag ${d.need}">${label}</span><div class="muted" style="font-size:14px;margin-top:4px">${esc(d.why)}</div>`;
    });
    C.score.docs = Math.max(0, Math.round((40 * (mustHit - noHit)) / must));
    const good = mustHit === must && noHit === 0;
    document.getElementById("after").innerHTML = `
      <div class="feedback ${good ? "ok" : "info"}"><b>${good ? "Danh sách chuẩn chỉnh! 🎯" : "Xem lại phần giải thích từng giấy nha 👀"}</b><br>
        Đúng ${mustHit}/${must} ${TX.docsUnit} bắt buộc${noHit ? ` · xin thừa ${noHit} ${TX.docsUnit} không cần` : ""} → <b>${C.score.docs}/40 điểm</b></div>
      <button class="btn block" data-act="caseNext">Tiếp: ${TX.legalShort.toLowerCase()} →</button>`;
  };
  ACTIONS.caseAns = (btn) => caseAnswer(+btn.dataset.arg);
  function caseAnswer(oi) {
    stopTimer();
    const key = ["", "", "legal", "plain", "critical"][C.step];
    const block = C.c[key], ok = oi === block.a;
    document.querySelectorAll("#opts .opt").forEach((b) => { b.disabled = true; const k = +b.dataset.arg; if (k === block.a) b.classList.add("right"); else if (k === oi) b.classList.add("wrong"); });
    if (ok) C.score[key] = 20;
    const nextLabel = { legal: "Tiếp: nói với khách bằng lời dễ hiểu →", plain: "Tiếp: tình huống bẫy (60 giây) →", critical: "Xem kết quả 🎁" }[key];
    document.getElementById("after").innerHTML = `
      <div class="feedback ${ok ? "ok" : "bad"}"><b>${oi === -1 ? "Hết giờ rồi! ⏰" : ok ? pick(CHEERS) + " +20 điểm" : pick(COMFORT)}</b><div style="margin-top:6px">💡 ${esc(block.exp)}</div></div>
      <button class="btn block" data-act="caseNext">${nextLabel}</button>`;
  }
  function caseEnd() {
    const c = C.c, s = C.score;
    const total = s.docs + s.legal + s.plain + s.critical;
    const stars = total >= 90 ? 3 : total >= 70 ? 2 : total >= 40 ? 1 : 0;
    const prev = S.cases[c.id];
    const firstTime = !prev;
    const xp = firstTime ? total : Math.max(0, total - prev.best);
    S.cases[c.id] = { best: Math.max(total, prev ? prev.best : 0), stars: Math.max(stars, prev ? prev.stars : 0) };
    save(); gainXP(xp);
    $app.innerHTML = back("caseMenu", "Danh sách khách") + caseSteps() + `
      <div class="card pop" style="text-align:center">
        <div class="stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        <div class="big">${total}/100</div>
        <p>+${xp} XP${!firstTime && xp === 0 ? " (chơi lại chỉ cộng phần điểm vượt kỷ lục cũ)" : ""}</p>
      </div>
      <div class="card">
        <table class="mini">
          <tr><td>① Chọn ${TX.docsUnit === "giấy" ? "giấy tờ" : TX.docsUnit}</td><td class="num">${s.docs}/40</td></tr>
          <tr><td>② ${TX.legalShort}</td><td class="num">${s.legal}/20</td></tr>
          <tr><td>③ Ngôn ngữ của khách</td><td class="num">${s.plain}/20</td></tr>
          <tr><td>④ Tình huống bẫy</td><td class="num">${s.critical}/20</td></tr>
        </table>
      </div>
      <div class="card">
        <h3>🗣️ Luyện nói tiếng Anh với khách</h3>
        <p class="muted">Bấm 🔊 nghe, rồi tự đọc to theo 3 lần nha. Đây là câu bạn sẽ nói thật khi đi làm!</p>
        <div class="quote" lang="en">${esc(c.scriptEn)} <button class="speak" data-speak="${esc(c.scriptEn)}">🔊</button></div>
      </div>
      <div class="row"><button class="btn" data-go="caseMenu">Khách tiếp theo →</button><button class="btn ghost" data-act="caseOpen" data-arg="${c.id}">Làm lại</button></div>`;
  }

  // ---------- SỔ LỖI SAI ----------
  function notebook() {
    const wrongQ = DATA.questions.filter((q) => (S.quiz[q.key] || {}).last === 0);
    const weak = DATA.vocab.filter((v) => { const s = S.vocab[v.key]; return s && s.box === 0 && s.wrong > 0; });
    $app.innerHTML = back() + `
      <h1>📒 Sổ lỗi sai</h1>
      ${owl("Người giỏi không phải là người không sai, mà là người không sai <b>lần 2</b>. Làm lại cho đến khi sổ trống trơn nha! ✨")}
      <div class="card" style="margin-top:12px">
        <div class="row spread"><div><b>📝 ${wrongQ.length} câu trắc nghiệm sai</b><div class="muted">Làm đúng 1 lần là ra khỏi sổ</div></div>
        <button class="btn" data-act="redoWrong" ${wrongQ.length ? "" : "disabled"}>Làm lại</button></div>
      </div>
      <div class="card">
        <div class="row spread"><div><b>📚 ${weak.length} từ vựng còn yếu</b><div class="muted">Các từ vừa trả lời sai</div></div>
        <button class="btn" data-act="redoWeak" ${weak.length ? "" : "disabled"}>Ôn lại</button></div>
        ${weak.length ? `<table class="mini" style="margin-top:10px">${weak.slice(0, 30).map((w) => `<tr><td><b>${esc(w.en)}</b></td><td>${esc(w.vi)}</td></tr>`).join("")}</table>` : ""}
      </div>`;
  }
  ACTIONS.redoWrong = () => {
    const wrongQ = DATA.questions.filter((q) => (S.quiz[q.key] || {}).last === 0);
    startQuiz(shuffle(wrongQ).slice(0, 15), "Làm lại câu sai", { backTo: "notebook" });
  };
  ACTIONS.redoWeak = () => {
    const weak = DATA.vocab.filter((v) => { const s = S.vocab[v.key]; return s && s.box === 0 && s.wrong > 0; });
    startVocab(shuffle(weak).slice(0, 10), "Ôn từ còn yếu", "notebook");
  };

  // ---------- TIẾN ĐỘ ----------
  function progress() {
    const rows = DATA.lessons.map((l) => {
      const v = vocabStat(l.id), q = quizStat(l.id);
      return `<tr><td><span class="pill p${(l.part - 1) % 3 + 1}">${esc(partLabel(l.part))}</span> <a href="${lessonLink(l.id)}" target="_blank" rel="noopener">${esc(shortTitle(l))}</a></td><td class="num">📚 ${v.pct}%</td><td class="num">📝 ${q.pct}%</td></tr>`;
    }).join("");
    const learned = DATA.vocab.filter((v) => (S.vocab[v.key] || {}).box >= 3).length;
    const qOk = DATA.questions.filter((q) => (S.quiz[q.key] || {}).last === 1).length;
    $app.innerHTML = back() + `
      <h1>📊 Tiến độ</h1>
      <div class="grid">
        <div class="card"><small>Từ vựng đã thuộc</small><div class="big">${learned}</div><small>/ ${DATA.vocab.length}</small></div>
        <div class="card"><small>Câu trắc nghiệm đang đúng</small><div class="big">${qOk}</div><small>/ ${DATA.questions.length}</small></div>
        <div class="card"><small>Tình huống đã xử lý</small><div class="big">${CASES.filter((c) => S.cases[c.id]).length}</div><small>/ ${CASES.length}</small></div>
        <div class="card"><small>Kỷ lục Sprint</small><div class="big">${S.sprint.best}</div><small>câu / 90 giây</small></div>
      </div>
      <div class="card"><h3>Theo từng bài học</h3><p class="muted">"Thuộc" = trả lời đúng một từ ít nhất 3 lần ở các ngày khác nhau.</p><table class="mini">${rows}</table></div>
      <div class="card"><h3>🏅 Các cấp bậc</h3><table class="mini">${RANKS.map((r) => `<tr><td>${r.emoji} <b>${esc(r.vi)}</b> <span class="muted">${esc(r.en)}</span></td><td class="num">${r.xp} XP ${S.xp >= r.xp ? "✅" : ""}</td></tr>`).join("")}</table></div>`;
  }

  // ---------- CÀI ĐẶT ----------
  function settings() {
    $app.innerHTML = back() + `
      <h1>💾 Sao lưu & cài đặt</h1>
      ${owl("Tiến độ được lưu tự động trong trình duyệt này. Thỉnh thoảng bấm <b>Tải file sao lưu</b> để cất 1 bản, đổi máy hay xóa lịch sử trình duyệt cũng không mất nha 🔐")}
      <div class="card" style="margin-top:12px">
        <h3>Sao lưu</h3>
        <div class="row"><button class="btn" data-act="exportSave">⬇️ Tải file sao lưu</button>
        <label class="btn ghost" style="display:inline-block">⬆️ Khôi phục từ file<input type="file" accept="application/json,.json" id="importFile" hidden></label></div>
      </div>
      <div class="card">
        <h3>Chế độ tự do</h3>
        <p class="muted">Mở khóa tất cả màn chơi và tình huống ngay, không cần đủ XP. (Khuyên dùng lộ trình từ từ để nền tảng chắc hơn.)</p>
        <button class="btn ghost" data-act="toggleFree">${S.freeMode ? "🔓 Đang bật · bấm để tắt" : "🔒 Đang tắt · bấm để bật"}</button>
      </div>
      <div class="card">
        <h3>Giao diện</h3>
        <div class="chips">${[["", "Theo máy"], ["light", "☀️ Sáng"], ["dark", "🌙 Tối"]].map(([k, v]) => `<button class="chip ${S.theme === k ? "on" : ""}" data-act="theme" data-arg="${k}">${v}</button>`).join("")}</div>
      </div>
      <div class="card">
        <h3>Làm lại từ đầu</h3>
        <p class="muted">Xóa toàn bộ tiến độ. Nhớ tải file sao lưu trước nha!</p>
        <button class="btn ghost" data-act="resetAll">🗑️ Xóa tiến độ</button>
      </div>`;
    document.getElementById("importFile").addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const data = JSON.parse(rd.result);
          if (typeof data.xp !== "number" || typeof data.vocab !== "object") throw new Error("bad");
          S = Object.assign(fresh(), data); save(); applyTheme(); toast("Khôi phục thành công! 🎉"); go("home");
        } catch (err) { toast("File này không đúng định dạng sao lưu 🥲"); }
      };
      rd.readAsText(f);
    });
  }
  ACTIONS.exportSave = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "ea-quest-sao-luu-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Đã tải file sao lưu 💾");
  };
  ACTIONS.toggleFree = () => { S.freeMode = !S.freeMode; save(); settings(); };
  ACTIONS.theme = (b) => { S.theme = b.dataset.arg; save(); applyTheme(); settings(); };
  ACTIONS.resetAll = () => { if (confirm("Xóa hết tiến độ thật không? Không hoàn tác được đâu 🥺")) { S = fresh(); save(); applyTheme(); go("home"); } };

  // ---------- HƯỚNG DẪN ----------
  function guide() {
    $app.innerHTML = back() + `
      <h1>💡 Cách chơi</h1>
      <div class="card">
        <h3>🎯 Mục tiêu</h3>
        <p>${TX.goal}</p>
      </div>
      <div class="card">
        <h3>🗺️ 4 bước</h3>
        <p><b>📚 Bước 1 · Từ vựng:</b> ${DATA.vocab.length} thuật ngữ lấy từ chính bài học của bạn. Học theo kiểu "hộp nhớ": đúng thì từ lên hộp và hẹn gặp lại sau 1, 2, 4, 7, 15, 30 ngày; sai thì về hộp 0.</p>
        <p><b>📝 Bước 2 · Trắc nghiệm:</b> ${DATA.questions.length} câu kiểu đề thi, có giải thích và link mở lại bài học. Có thi thử mini canh giờ đúng tốc độ thi thật.</p>
        <p><b>⏱️ Bước 3 · ${TX.sprintName}</b> (mở ở ${UNLOCK.sprint} XP): ${TX.sprintGuide}</p>
        <p><b>🧑‍💼 Bước 4 · Bàn tiếp khách</b> (mở ở ${UNLOCK.cases} XP): ${CASES.length} tình huống thật. Chọn ${TX.docsUnit === "giấy" ? "giấy tờ" : TX.docsUnit} cần xin, giải thích bằng ${TX.legalShort.toLowerCase()}, giải thích bằng lời của khách, rồi giải câu bẫy trong 60 giây. Cuối mỗi tình huống có câu tiếng Anh mẫu để luyện nói (TOEIC).</p>
      </div>
      <div class="card">
        <h3>🌱 Lịch học gợi ý mỗi ngày (15–20 phút)</h3>
        <p>1. Ôn từ đến hạn (nếu có) · 2. 1 lượt từ vựng của bài đang học · 3. 1 lượt trắc nghiệm bài đó · 4. Có thời gian thì 1 Sprint hoặc 1 khách.</p>
        <p class="muted">Đạt ${DAILY_GOAL} XP/ngày để giữ chuỗi 🔥. Học đều mỗi ngày hiệu quả hơn học dồn nhiều.</p>
      </div>
      <div class="card">
        <h3>⚠️ Lưu ý</h3>
        <p class="muted">${TX.disclaimer}</p>
      </div>`;
  }

  const SCREENS = { home, vocabMenu, quizMenu, sprintMenu, caseMenu, notebook, progress, settings, guide };
  go("home");
})();
