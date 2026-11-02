/**
 * quest-mini.js — Bộ engine chạy game 1 chạm, Flashcard SRS, Quiz 10 câu, Sprint 90s và Case tiếp khách
 * Độc lập, gọn nhẹ cho trang khoá học L04_EA
 * Tuân thủ D1-D5, RUBRIC B.1 (<= 2 chạm vào câu 1)
 */
(function(w) {
  "use strict";

  const STORE_KEY = "ea-quest-v1";
  const BOX_DAYS = [0, 1, 2, 4, 7, 15, 30];

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { xp: 0, streak: { count: 0, last: "" }, vocab: {}, quiz: {}, cases: {}, sprint: { best: 0, plays: 0 } };
  }

  let S = loadProgress();
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch(e) {}
    if (w.updateCourseStats) w.updateCourseStats();
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  function speak(text) {
    try {
      if (!w.speechSynthesis) return;
      w.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.95;
      w.speechSynthesis.speak(u);
    } catch(e) {}
  }

  // Dual-source data loader (D5)
  function loadData(callback) {
    if (w.EA_LESSONS && w.EA_CASES && w.EA_RESEARCH) {
      return callback();
    }
    const isLocal = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.search.includes("local=1");
    const R = "https://pqarpszsipbdugrumhfy.supabase.co/storage/v1/object/public/ea/";
    const files = [
      ["data/lessons-data.js?v=6", R + "data/lessons-data.js?v=6"],
      ["data/cases.js?v=2", R + "data-w02/cases.js?v=2"],
      ["data/research.js?v=2", R + "data/research.js?v=2"]
    ];

    let idx = 0;
    function next() {
      if (idx >= files.length) {
        prepareData();
        return callback();
      }
      const item = files[idx++];
      const srcPrimary = isLocal ? item[0] : item[1];
      const srcFallback = isLocal ? item[1] : item[0];

      const s = document.createElement("script");
      s.src = srcPrimary;
      s.onload = () => next();
      s.onerror = () => {
        const s2 = document.createElement("script");
        s2.src = srcFallback;
        s2.onload = () => next();
        s2.onerror = () => next();
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    }
    next();
  }

  let DATA = { lessons: [], vocab: [], questions: [] };
  let CASES = [];
  let RESEARCH = [];
  let lessonById = {};

  function prepareData() {
    DATA = w.EA_LESSONS || { lessons: [], vocab: [], questions: [] };
    CASES = w.EA_CASES || [];
    RESEARCH = w.EA_RESEARCH || [];
    lessonById = Object.fromEntries(DATA.lessons.map(l => [l.id, l]));
    DATA.vocab.forEach(v => { v.key = v.lesson + "|" + v.en; v.part = (lessonById[v.lesson] || {}).part; });
    DATA.questions.forEach(q => { q.key = q.lesson + "|" + hash(q.q); q.part = (lessonById[q.lesson] || {}).part; });
    if (w.renderLessonList) w.renderLessonList(DATA.lessons);
    if (w.updateCourseStats) w.updateCourseStats(DATA, CASES);
  }

  let $arena = null;
  let $courseView = null;

  function initUI() {
    $arena = document.getElementById("gameArena");
    $courseView = document.getElementById("courseView");
  }

  function showGame() {
    if ($courseView) $courseView.style.display = "none";
    if ($arena) { $arena.style.display = "block"; $arena.scrollIntoView({ behavior: "smooth" }); }
  }

  function hideGame() {
    if ($arena) $arena.style.display = "none";
    if ($courseView) $courseView.style.display = "block";
    history.replaceState(null, "", location.pathname + location.search);
  }

  // 1. FLASHCARD VOCAB
  let V = null;
  function startVocab(items, title) {
    if (!items.length) { alert("Không có từ vựng nào!"); return hideGame(); }
    V = { items, i: 0, right: 0, xp: 0, title: title || "Ôn Từ Vựng 1 Chạm" };
    showGame();
    renderVocabQ();
  }

  function renderVocabQ() {
    const v = V.items[V.i];
    const st = S.vocab[v.key] || { box: 0 };
    const distractors = shuffle(DATA.vocab.filter(x => x.en !== v.en && x.vi !== v.vi)).slice(0, 3);
    const opts = shuffle([v, ...distractors]);
    V.cur = { v, opts, answer: opts.indexOf(v) };

    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnGameBack">← Về trang khoá</button>
        <span class="game-stepper">🔤 ${esc(V.title)} · ${V.i + 1}/${V.items.length}</span>
        <span class="game-box-tag">Hộp ${st.box}</span>
      </div>
      <div class="game-card">
        <div style="font-size:14px;color:var(--sub);margin-bottom:6px;">Nghĩa tiếng Việt đúng của thuật ngữ:</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <h2 style="font-size:24px;color:var(--accent);margin:0;">${esc(v.en)}</h2>
          <button class="btn-speak" data-speak="${esc(v.en)}" aria-label="Phát âm">🔊</button>
        </div>
        <div class="opts-list" id="optsList">
          ${opts.map((o, idx) => `
            <button class="opt-btn" data-idx="${idx}">
              <span class="opt-key">${"ABCD"[idx]}.</span>
              <span>${esc(o.vi)}</span>
            </button>
          `).join("")}
        </div>
        <div id="gameAfter"></div>
      </div>
    `;

    document.getElementById("btnGameBack").onclick = hideGame;
    document.querySelectorAll(".btn-speak").forEach(btn => {
      btn.onclick = () => speak(btn.dataset.speak);
    });
    document.querySelectorAll("#optsList .opt-btn").forEach(btn => {
      btn.onclick = () => onVocabAns(+btn.dataset.idx);
    });
  }

  function onVocabAns(idx) {
    const c = V.cur;
    const ok = idx === c.answer;
    document.querySelectorAll("#optsList .opt-btn").forEach((b, j) => {
      b.disabled = true;
      if (j === c.answer) b.classList.add("right");
      else if (j === idx) b.classList.add("wrong");
    });

    const v = c.v;
    const st = S.vocab[v.key] || { box: 0, right: 0, wrong: 0 };
    if (ok) {
      st.box = Math.min(st.box + 1, BOX_DAYS.length - 1);
      st.right++;
      V.right++;
      V.xp += 5;
    } else {
      st.box = 0;
      st.wrong++;
    }
    st.due = addDays(today(), BOX_DAYS[st.box]);
    S.vocab[v.key] = st;
    S.xp = (S.xp || 0) + (ok ? 5 : 0);
    saveProgress();

    document.getElementById("gameAfter").innerHTML = `
      <div class="ans-feedback ${ok ? 'ok' : 'bad'}">
        <b>${ok ? '🎉 Chính xác!' : '💡 Ghi nhớ nhé:'}</b> <b>${esc(v.en)}</b> = ${esc(v.vi)}
        <div style="font-size:13px;margin-top:4px;color:var(--sub);">Thuộc bài: ${esc(v.section || (lessonById[v.lesson] && lessonById[v.lesson].title) || '')}</div>
      </div>
      <div class="sticky-act">
        <button class="btn-primary" style="width:100%;" id="btnNextVocab">${V.i + 1 < V.items.length ? 'Tiếp tục câu sau →' : 'Xem kết quả 🎁'}</button>
      </div>
    `;
    document.getElementById("btnNextVocab").onclick = () => {
      V.i++;
      if (V.i < V.items.length) renderVocabQ();
      else renderVocabSummary();
    };
    if (ok) speak(v.en);
  }

  function renderVocabSummary() {
    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnGameBack">← Về trang khoá</button>
        <span class="game-stepper">Kết quả ôn tập</span>
      </div>
      <div class="game-card" style="text-align:center;padding:32px 16px;">
        <div style="font-size:48px;">🏆</div>
        <h2>Hoàn thành ${V.right}/${V.items.length} từ</h2>
        <p style="color:var(--accent2);font-weight:700;">+${V.xp} XP đã được lưu vào tiến độ</p>
        <div class="sticky-act" style="margin-top:20px;">
          <button class="btn-primary" style="width:100%;" id="btnBackCourse">Hoàn thành & Về khoá học</button>
        </div>
      </div>
    `;
    document.getElementById("btnGameBack").onclick = hideGame;
    document.getElementById("btnBackCourse").onclick = hideGame;
  }

  // 2. QUIZ RUNNER
  let Q = null;
  function startQuiz(items, title) {
    if (!items.length) { alert("Không có câu hỏi trắc nghiệm!"); return hideGame(); }
    Q = { items, i: 0, right: 0, xp: 0, title: title || "Đấu Trường Trắc Nghiệm 1 Chạm" };
    showGame();
    renderQuizQ();
  }

  function renderQuizQ() {
    const q = Q.items[Q.i];
    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnGameBack">← Về trang khoá</button>
        <span class="game-stepper">⚔️ ${esc(Q.title)} · Câu ${Q.i + 1}/${Q.items.length}</span>
        <span class="game-box-tag">Part ${q.part || 1}</span>
      </div>
      <div class="game-card">
        <div style="font-size:13px;color:var(--sub);margin-bottom:8px;">${esc(q.section || (lessonById[q.lesson] && lessonById[q.lesson].title) || 'SEE Examination')}</div>
        <div style="font-size:17.5px;font-weight:700;line-height:1.5;margin-bottom:16px;">${esc(q.q)}</div>
        <div class="opts-list" id="optsList">
          ${q.opts.map((o, idx) => `
            <button class="opt-btn" data-idx="${idx}">
              <span class="opt-key">${"ABCD"[idx]}.</span>
              <span>${esc(o)}</span>
            </button>
          `).join("")}
        </div>
        <div id="gameAfter"></div>
      </div>
    `;

    document.getElementById("btnGameBack").onclick = hideGame;
    document.querySelectorAll("#optsList .opt-btn").forEach(btn => {
      btn.onclick = () => onQuizAns(+btn.dataset.idx);
    });
  }

  function onQuizAns(idx) {
    const q = Q.items[Q.i];
    const ok = idx === q.a;
    document.querySelectorAll("#optsList .opt-btn").forEach((b, j) => {
      b.disabled = true;
      if (j === q.a) b.classList.add("right");
      else if (j === idx) b.classList.add("wrong");
    });

    const st = S.quiz[q.key] || { right: 0, wrong: 0, last: null };
    if (ok) {
      st.right++;
      st.last = 1;
      Q.right++;
      Q.xp += 10;
    } else {
      st.wrong++;
      st.last = 0;
    }
    S.quiz[q.key] = st;
    S.xp = (S.xp || 0) + (ok ? 10 : 0);
    saveProgress();

    document.getElementById("gameAfter").innerHTML = `
      <div class="ans-feedback ${ok ? 'ok' : 'bad'}">
        <b>${ok ? '🎉 Chính xác!' : '❌ Chưa đúng rồi!'}</b> Đáp án đúng: <b>${"ABCD"[q.a]}. ${esc(q.opts[q.a])}</b>
        ${q.exp ? `<div style="margin-top:6px;font-size:14px;color:var(--ink);">💡 <b>Giải thích:</b> ${esc(q.exp)}</div>` : ''}
      </div>
      <div class="sticky-act">
        <button class="btn-primary" style="width:100%;" id="btnNextQuiz">${Q.i + 1 < Q.items.length ? 'Câu tiếp theo →' : 'Xem kết quả tổng kết 🎁'}</button>
      </div>
    `;
    document.getElementById("btnNextQuiz").onclick = () => {
      Q.i++;
      if (Q.i < Q.items.length) renderQuizQ();
      else renderQuizSummary();
    };
  }

  function renderQuizSummary() {
    const pct = Math.round((Q.right / Q.items.length) * 100);
    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnGameBack">← Về trang khoá</button>
        <span class="game-stepper">Tổng kết bài làm</span>
      </div>
      <div class="game-card" style="text-align:center;padding:32px 16px;">
        <div style="font-size:48px;">${pct >= 70 ? '🎓' : '💪'}</div>
        <h2>Đúng ${Q.right}/${Q.items.length} câu (${pct}%)</h2>
        <p style="color:var(--sub);">${pct >= 70 ? 'Đạt chuẩn kỳ thi IRS SEE (yêu cầu khoảng 70% trở lên)!' : 'Cần ôn lại các câu sai để chuẩn bị tốt hơn nhé.'}</p>
        <p style="color:var(--accent2);font-weight:700;">+${Q.xp} XP đã tích luỹ</p>
        <div class="sticky-act" style="margin-top:20px;">
          <button class="btn-primary" style="width:100%;" id="btnBackCourse">Hoàn thành & Về khoá học</button>
        </div>
      </div>
    `;
    document.getElementById("btnGameBack").onclick = hideGame;
    document.getElementById("btnBackCourse").onclick = hideGame;
  }

  // 3. RESEARCH SPRINT 90s
  let R = null;
  function startSprint() {
    if (!RESEARCH.length) { alert("Chưa có dữ liệu tra cứu!"); return hideGame(); }
    R = { pool: shuffle(RESEARCH), i: 0, right: 0, end: Date.now() + 90000, timer: null };
    showGame();
    renderSprintQ();
    R.timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((R.end - Date.now()) / 1000));
      const el = document.getElementById("sprintTimer");
      if (el) el.textContent = "⏱️ " + left + "s";
      if (left <= 0) {
        clearInterval(R.timer);
        renderSprintSummary();
      }
    }, 250);
  }

  function renderSprintQ() {
    if (R.i >= R.pool.length) R.pool = R.pool.concat(shuffle(RESEARCH));
    const q = R.pool[R.i];
    const left = Math.max(0, Math.ceil((R.end - Date.now()) / 1000));
    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnSprintQuit">✕ Dừng</button>
        <span class="game-stepper" id="sprintTimer">⏱️ ${left}s</span>
        <span class="game-box-tag">Điểm: ${R.right}</span>
      </div>
      <div class="game-card">
        <div style="font-size:13px;color:var(--sub);margin-bottom:6px;">⚡ Tra cứu nhanh 90 giây</div>
        <div style="font-size:18px;font-weight:700;line-height:1.45;margin-bottom:16px;">${esc(q.q)}</div>
        <div class="opts-list" id="optsList">
          ${q.opts.map((o, idx) => `
            <button class="opt-btn" data-idx="${idx}">
              <span>${esc(o)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("btnSprintQuit").onclick = () => {
      clearInterval(R.timer);
      renderSprintSummary();
    };
    document.querySelectorAll("#optsList .opt-btn").forEach(btn => {
      btn.onclick = () => {
        const ok = +btn.dataset.idx === q.a;
        if (ok) { R.right++; S.xp = (S.xp || 0) + 6; saveProgress(); }
        R.i++;
        renderSprintQ();
      };
    });
  }

  function renderSprintSummary() {
    if (R.right > (S.sprint.best || 0)) S.sprint.best = R.right;
    S.sprint.plays = (S.sprint.plays || 0) + 1;
    saveProgress();
    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnGameBack">← Về trang khoá</button>
        <span class="game-stepper">Hết giờ 90s!</span>
      </div>
      <div class="game-card" style="text-align:center;padding:32px 16px;">
        <div style="font-size:48px;">⚡</div>
        <h2>Đạt ${R.right} câu đúng!</h2>
        <p style="color:var(--sub);">Kỷ lục của bạn: <b>${S.sprint.best}</b> câu</p>
        <p style="color:var(--accent2);font-weight:700;">+${R.right * 6} XP</p>
        <div class="sticky-act" style="margin-top:20px;">
          <button class="btn-primary" style="width:100%;" id="btnBackCourse">Hoàn thành & Về khoá học</button>
        </div>
      </div>
    `;
    document.getElementById("btnGameBack").onclick = hideGame;
    document.getElementById("btnBackCourse").onclick = hideGame;
  }

  // 4. CLIENT CASE SIMULATOR
  let C = null;
  function startCase(caseId) {
    const c = CASES.find(x => x.id === caseId) || CASES[0];
    if (!c) { alert("Chưa có tình huống khách hàng!"); return hideGame(); }
    C = { c, step: 1 };
    showGame();
    renderCaseStep();
  }

  function renderCaseStep() {
    const c = C.c;
    $arena.innerHTML = `
      <div class="game-top">
        <button class="btn-back" id="btnGameBack">← Về trang khoá</button>
        <span class="game-stepper">🧑‍💼 Tình huống: ${esc(c.title)}</span>
        <span class="game-box-tag">Bước ${C.step}/4</span>
      </div>
      <div class="game-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:32px;">${c.emoji || '🧑‍💼'}</span>
          <div>
            <h3 style="margin:0;font-size:18px;">${esc(c.title)}</h3>
            <span style="font-size:13px;color:var(--sub);">${esc(c.client)}</span>
          </div>
        </div>
        <p style="font-size:15px;line-height:1.5;background:var(--chip);padding:10px 12px;border-radius:10px;margin-bottom:14px;">
          "${esc(c.story || c.quote || '')}"
        </p>

        ${C.step === 1 ? `
          <h4 style="margin:0 0 8px;">① Chọn hồ sơ/giấy tờ cần xin khách:</h4>
          <div class="opts-list">
            ${(c.docs || []).map((d, i) => `
              <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;cursor:pointer;">
                <input type="checkbox" data-idx="${i}" style="width:18px;height:18px;">
                <span>${esc(d.name || d)}</span>
              </label>
            `).join("")}
          </div>
          <div class="sticky-act">
            <button class="btn-primary" style="width:100%;" id="btnCaseNext">Chốt danh sách giấy tờ →</button>
          </div>
        ` : C.step === 2 ? `
          <h4 style="margin:0 0 8px;">② Giải thích bằng ngôn ngữ luật (IRS Authority):</h4>
          <div style="padding:12px;border:1px solid var(--line);border-radius:10px;margin-bottom:16px;">
            ${esc(c.legalText || 'Áp dụng theo quy định của Internal Revenue Code (IRC) và hướng dẫn của IRS...')}
          </div>
          <div class="sticky-act">
            <button class="btn-primary" style="width:100%;" id="btnCaseNext">Tiếp tục bước 3 →</button>
          </div>
        ` : C.step === 3 ? `
          <h4 style="margin:0 0 8px;">③ Giải thích bằng ngôn ngữ dễ hiểu cho khách hàng:</h4>
          <div style="padding:12px;border:1px solid var(--line);border-radius:10px;margin-bottom:16px;">
            ${esc(c.plainText || 'Dạ thưa anh/chị, khoản chi phí này được khấu trừ hợp lệ khi có đủ hoá đơn chứng từ...')}
          </div>
          <div class="sticky-act">
            <button class="btn-primary" style="width:100%;" id="btnCaseNext">Bước 4: Câu hỏi thực chiến →</button>
          </div>
        ` : `
          <h4 style="margin:0 0 8px;">④ Câu hỏi bẫy tư vấn:</h4>
          <div style="font-size:16px;font-weight:600;margin-bottom:12px;">${esc(c.trapQ || c.focus || 'Khi khách yêu cầu không kê khai tiền boa mặt, bạn xử lý thế nào?')}</div>
          <div class="opts-list">
            <button class="opt-btn" onclick="this.classList.add('right'); document.getElementById('btnFinCase').style.display='block';">
              Giải thích nghĩa vụ Circular 230 §10.21, từ chối ký tờ khai nếu khách cố tình giấu doanh thu.
            </button>
            <button class="opt-btn" onclick="this.classList.add('wrong');">
              Đồng ý bỏ qua nếu số tiền nhỏ để giữ khách.
            </button>
          </div>
          <div class="sticky-act">
            <button class="btn-primary" style="width:100%;display:none;" id="btnFinCase">Hoàn tất tình huống +25 XP 🎉</button>
          </div>
        `}
      </div>
    `;

    document.getElementById("btnGameBack").onclick = hideGame;
    const btnNext = document.getElementById("btnCaseNext");
    if (btnNext) {
      btnNext.onclick = () => { C.step++; renderCaseStep(); };
    }
    const btnFin = document.getElementById("btnFinCase");
    if (btnFin) {
      btnFin.onclick = () => {
        S.cases[c.id] = { stars: 3, done: true };
        S.xp = (S.xp || 0) + 25;
        saveProgress();
        hideGame();
      };
    }
  }

  // 1-TAP URL / HASH ROUTER (RUBRIC B.1)
  function handleUrlRouting() {
    const raw = location.hash.replace(/^#\/?/, "");
    const qHash = new URLSearchParams(raw.includes("=") ? raw : (raw ? "play=" + raw : ""));
    const qUrl = new URLSearchParams(location.search);
    const play = qHash.get("play") || qUrl.get("play");
    const part = +(qHash.get("part") || qUrl.get("part") || 0);
    const lesson = qHash.get("lesson") || qUrl.get("lesson");

    if (!play && !lesson) {
      hideGame();
      return;
    }

    loadData(() => {
      if (play === "vocab") {
        let pool = DATA.vocab;
        if (part) pool = pool.filter(v => v.part === part);
        if (lesson) pool = pool.filter(v => v.lesson === lesson);
        startVocab(shuffle(pool).slice(0, 10));
      } else if (play === "quiz") {
        let pool = DATA.questions;
        if (part) pool = pool.filter(q => q.part === part);
        if (lesson) pool = pool.filter(q => q.lesson === lesson);
        startQuiz(shuffle(pool).slice(0, 10));
      } else if (play === "sprint") {
        startSprint();
      } else if (play === "case") {
        startCase(lesson);
      } else if (play === "mock") {
        startQuiz(shuffle(DATA.questions).slice(0, 20), "Thi Thử Mini 20 Câu");
      } else if (play === "wrong") {
        const wrongPool = DATA.questions.filter(q => S.quiz[q.key] && S.quiz[q.key].last === 0);
        if (wrongPool.length) startQuiz(shuffle(wrongPool).slice(0, 15), "Ôn Câu Sai Đã Gặp");
        else { alert("Bạn chưa có câu sai nào, làm ván 10 câu mới nhé!"); startQuiz(shuffle(DATA.questions).slice(0, 10)); }
      }
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (["1", "2", "3", "4"].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      const btn = document.querySelectorAll("#optsList .opt-btn")[idx];
      if (btn && !btn.disabled) btn.click();
    } else if (e.key === "Enter" || e.key === " ") {
      const nextBtn = document.querySelector("#gameAfter button, .sticky-act button");
      if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== "none") {
        e.preventDefault();
        nextBtn.click();
      }
    }
  });

  w.addEventListener("hashchange", handleUrlRouting);

  // Khởi động
  document.addEventListener("DOMContentLoaded", () => {
    initUI();
    loadData(() => {
      handleUrlRouting();
    });
  });

  w.QuestMini = {
    startVocab,
    startQuiz,
    startSprint,
    startCase,
    loadData
  };
})(window);
