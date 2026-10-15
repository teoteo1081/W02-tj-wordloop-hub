/* sw.js — TOEIC Speaking & Writing (luyện một mình): đề theo dạng ETS, đếm giờ chuẩn, ghi âm (Web Speech) hoặc gõ bài, AI (Gemini qua gemini-proxy) chấm điểm ƯỚC TÍNH.
   Dữ liệu: sets.json (đề AI sinh bởi tools/sw/gen_sets.py) + đề riêng nạp từ file (localStorage, không lên server). Tiến độ lưu localStorage "sw-quest-v1".
   Chạy thử không cần mic: thêm ?mock=1 (giọng giả lấy từ bài mẫu, đồng hồ nhanh 25 lần). */
(function () {
  "use strict";
  var CFG = window.APP_CONFIG || {}, QS = new URLSearchParams(location.search), MOCK = QS.get("mock") === "1", SCALE = MOCK ? 0.04 : 1;
  var $ = function (s) { return document.querySelector(s); }, app = $("#app");
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var KEY = "sw-quest-v1", EXTRA = "sw-extra-sets-v1";
  var TIME = {
    speaking: { 1: [45, 45], 2: [45, 45], 3: [45, 30], 4: [3, 15], 5: [3, 15], 6: [3, 30], 7: [3, 15], 8: [3, 15], 9: [3, 30], 10: [30, 60], 11: [45, 60] },   /* [chuẩn bị, trả lời] giây */
    writing: { 1: [0, 96], 2: [0, 96], 3: [0, 96], 4: [0, 96], 5: [0, 96], 6: [0, 600], 7: [0, 600], 8: [0, 1800] }
  };
  /* FORMAT 2 (đề prepedu / cấu trúc chuẩn ETS theo ZIM): Q1–2 đọc to · Q3–4 tả ảnh · Q5–7 trả lời · Q8–10 dựa vào thông tin · Q11 nêu ý kiến. Đề có "fmt":2 dùng bảng này, đề cũ (AI sinh) giữ nguyên */
  var TIME2 = { 1: [45, 45], 2: [45, 45], 3: [45, 30], 4: [45, 30], 5: [3, 15], 6: [3, 15], 7: [3, 30], 8: [3, 15], 9: [3, 15], 10: [3, 30], 11: [45, 60] };
  var MAXS2 = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 5 };
  var GROUPS2 = [{ k: "all", t: "Cả bộ (~17 phút)", qs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, { k: "read", t: "Q1–2 Đọc to", qs: [1, 2] }, { k: "desc", t: "Q3–4 Tả ảnh", qs: [3, 4] }, { k: "resp", t: "Q5–7 Trả lời câu hỏi", qs: [5, 6, 7] }, { k: "info", t: "Q8–10 Dựa vào thông tin", qs: [8, 9, 10] }, { k: "opin", t: "Q11 Nêu ý kiến", qs: [11] }];
  /* FORMAT 3 (IELTS Speaking): Q1–4 Part 1 · Q5 Part 2 (thẻ nói: chuẩn bị 1 phút, nói 2 phút) · Q6–9 Part 3. Điểm = band 0–9 mỗi câu */
  var TIME3 = { 1: [0, 30], 2: [0, 30], 3: [0, 30], 4: [0, 30], 5: [60, 120], 6: [0, 45], 7: [0, 45], 8: [0, 45], 9: [0, 45] };
  var MAXS3 = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 };
  var GROUPS3 = [{ k: "all", t: "Cả bài (~11 phút)", qs: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, { k: "p1", t: "Part 1 · Câu hỏi chung", qs: [1, 2, 3, 4] }, { k: "p2", t: "Part 2 · Thẻ nói 2 phút", qs: [5] }, { k: "p3", t: "Part 3 · Thảo luận", qs: [6, 7, 8, 9] }];
  var TIPS3 = [["Part 1", "Trả lời thẳng câu hỏi trong 2–3 câu: đáp án + lý do + 1 ví dụ ngắn. Nói tự nhiên, không học thuộc."], ["Part 2", "1 phút chuẩn bị: ghi từ khoá cho từng gạch đầu dòng. Nói đủ 2 phút theo thứ tự các ý; dùng thì quá khứ nếu kể chuyện."], ["Part 3", "Trả lời dài hơn, trừu tượng hơn: nêu quan điểm → giải thích → ví dụ → so sánh (trước/nay, thành phố/nông thôn)."], ["Chấm điểm", "4 tiêu chí: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation (AI chỉ chấm được 3 tiêu chí đầu qua chữ nhận được)."], ["Chung", "Nói liền mạch, tự sửa nhanh rồi nói tiếp. Dùng từ nối (however, as a result) và đa dạng cấu trúc câu."]];
  var TIME3W = { 1: [0, 1200], 2: [0, 2400] }, MAXS3W = { 1: 9, 2: 9 };
  var GROUPS3W = [{ k: "all", t: "Cả bài (60 phút)", qs: [1, 2] }, { k: "t1", t: "Task 1 · Mô tả biểu đồ (20 phút)", qs: [1] }, { k: "t2", t: "Task 2 · Bài luận (40 phút)", qs: [2] }];
  var TIPS3W = [["Task 1", "Mở bài: viết lại đề bằng từ khác. Overview: 2 xu hướng/điểm nổi bật nhất. Thân bài: so sánh số liệu chính, không đưa ý kiến. ≥ 150 từ, nên làm trong ~20 phút."], ["Task 2", "Chia 4 đoạn: mở bài (paraphrase + nêu quan điểm) · 2 đoạn thân (ý chính + giải thích + ví dụ) · kết bài. ≥ 250 từ, ~40 phút; Task 2 chiếm 2/3 điểm Writing."], ["Chấm điểm", "4 tiêu chí: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy."], ["Chung", "Chừa 3–5 phút cuối soát lỗi: thì động từ, mạo từ, số ít/số nhiều, chính tả."]];
  function fmtN() { var st = curSet(); return st && st.fmt === 3 ? 3 : st && st.fmt === 2 ? 2 : 1; }
  function fmt2() { var st = curSet(); return !!(st && st.fmt === 2); }
  function TMT(kind) { return kind === "writing" && fmtN() === 3 ? TIME3W : kind === "speaking" && fmtN() === 3 ? TIME3 : kind === "speaking" && fmt2() ? TIME2 : TIME[kind]; }
  function MXS(kind) { return kind === "writing" && fmtN() === 3 ? MAXS3W : kind === "speaking" && fmtN() === 3 ? MAXS3 : kind === "speaking" && fmt2() ? MAXS2 : MAXS[kind]; }
  function GRP(kind) { return kind === "writing" && fmtN() === 3 ? GROUPS3W : kind === "speaking" && fmtN() === 3 ? GROUPS3 : kind === "speaking" && fmt2() ? GROUPS2 : GROUPS[kind]; }
  function tl(t) { return fmtN() === 3 && S.kind === "writing" ? "Task " + t.q : fmtN() === 3 ? (t.type === "cue" ? "Part 2 · thẻ nói" : t.q <= 4 ? "Part 1" : "Part 3") : String(t.type || "").replace("_", " "); }
  var MAXS = { speaking: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 5, 11: 5 }, writing: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5 } };
  var GROUPS = {
    speaking: [{ k: "all", t: "Cả bộ 11 câu (~17 phút)", qs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, { k: "read", t: "Q1–2 Đọc to", qs: [1, 2] }, { k: "desc", t: "Q3 Tả ảnh", qs: [3] }, { k: "resp", t: "Q4–6 Trả lời câu hỏi", qs: [4, 5, 6] }, { k: "info", t: "Q7–9 Dựa vào thông tin", qs: [7, 8, 9] }, { k: "sol", t: "Q10 Đề xuất giải pháp", qs: [10] }, { k: "opin", t: "Q11 Nêu ý kiến", qs: [11] }],
    writing: [{ k: "all", t: "Cả bộ 8 câu (~60 phút)", qs: [1, 2, 3, 4, 5, 6, 7, 8] }, { k: "sent", t: "Q1–5 Viết câu theo ảnh", qs: [1, 2, 3, 4, 5] }, { k: "mail", t: "Q6–7 Trả lời email", qs: [6, 7] }, { k: "essay", t: "Q8 Bài luận ý kiến", qs: [8] }]
  };
  var SETS = { speaking: [], writing: [] }, ST = load(), S = { kind: QS.get("kind") === "writing" ? "writing" : "speaking", setId: "", group: "all", screen: "home" }, timerId = 0, rec = null, recOn = false, CTX = { inRoom: false, isHost: false, me: null, players: [] }, LIVE = null, liveTimer = 0, PENDING = null, KIND0 = QS.get("kind") || "", EX0 = QS.get("exam") === "ielts" ? "ielts" : "", EMBED = (function () { try { return window.parent !== window; } catch (e) { return true; } })();

  /* ---------- lưu ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { hist: [] }; } catch (e) { return { hist: [] }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
  function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("show"); }, 2400); }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function nWords(s) { return (String(s || "").match(/[A-Za-z0-9'’-]+/g) || []).length; }

  /* ---------- nạp đề ---------- */
  /* sắp đề theo SỐ trong tên ("Đề 2" trước "Đề 10"), thay vì theo chữ (TJ 2026-10-15: "Đề 1 rồi tới 10 là sai"). Đề có sẵn giữ nguyên thứ tự và đứng trước đề nạp từ file. */
  function natSets(arr) {
    var key = function (s, i) { var m = /(?:đề|de|test|part)\s*0*(\d+)/i.exec(String(s.title || s.name || "")) || /(\d+)\s*$/.exec(String(s.id || "")); return [s.mine ? 1 : 0, m ? +m[1] : 1e9, i]; };
    return arr.map(function (s, i) { return { s: s, k: key(s, i) }; }).sort(function (a, b) { return a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2]; }).map(function (x) { return x.s; });
  }
  async function loadSets() {
    try { var r = await fetch("sets.json?v=" + (QS.get("v") || "1")); var d = await r.json(); SETS.speaking = d.speaking || []; SETS.writing = d.writing || []; } catch (e) { toast("Không tải được bộ đề"); }
    if (EX0) { try { var ri = await fetch("ielts.json?v=" + (QS.get("v") || "1")); var di = await ri.json(); SETS.speaking = di.speaking || []; SETS.writing = di.writing || []; } catch (e) { toast("Không tải được đề IELTS"); } }
    try { var x = JSON.parse(localStorage.getItem(EXTRA) || "null"); if (x) { (x.speaking || []).forEach(function (s) { s.mine = 1; SETS.speaking.push(s); }); (x.writing || []).forEach(function (s) { s.mine = 1; SETS.writing.push(s); }); } } catch (e) {}
    if (!EX0) { SETS.speaking = SETS.speaking.filter(function (x) { return x.fmt !== 3; }); SETS.writing = SETS.writing.filter(function (x) { return x.fmt !== 3; }); }
    SETS.speaking = natSets(SETS.speaking); SETS.writing = natSets(SETS.writing);
    S.setId = (SETS[S.kind][0] || {}).id || "";
    var pf = (ST.pref || {})[EX0 ? "ielts" : S.kind];
    if (pf && SETS[S.kind].some(function (x) { return x.id === pf.set; })) { S.setId = pf.set; S.group = pf.group || "all"; S.src = pf.src; S.qFrom = pf.from || null; S.qTo = pf.to || null; }
  }
  function savePref() { ST.pref = ST.pref || {}; ST.pref[EX0 ? "ielts" : S.kind] = { set: S.setId, group: S.group, src: S.src, from: S.qFrom, to: S.qTo }; save(); }
  function curSet() { return SETS[S.kind].filter(function (s) { return s.id === S.setId; })[0]; }
  function curTask() { return S.tasks[S.i]; }
  function best(kind, id) { var b = 0; ST.hist.forEach(function (h) { if (h.kind === kind && h.set === id && h.group === "all" && h.est > b) b = h.est; }); return b; }

  /* ---------- màn hình ---------- */
  /* người chơi (không phải host) trong phòng: KHÔNG tự luyện riêng (TJ 2026-10-14) — chưa tới lượt lớp thì chỉ chờ rồi về phòng chờ / bảng chờ */
  function waitView() {
    app.innerHTML = '<div class="card" style="text-align:center;margin-top:30px"><div style="font-size:42px">⏳</div><h2>Đang chờ host bắt đầu</h2><p class="sub">Khi host bấm bắt đầu, đề sẽ tự hiện ra ở đây.</p><button class="big" data-act="leave">← Về phòng chờ</button></div>';
    clearTimeout(S.leaveT);
    S.leaveT = setTimeout(function () { if (S.screen === "home" && !LIVE && !PENDING && CTX.inRoom && !CTX.isHost) toParent({ type: "sw-leave" }); }, 15000);   /* 15s: đủ để nhận nhịp trạng thái của host (4s/lần) nếu lớp đã bắt đầu; lớp mở thì không rời */
  }
  /* TJ 2026-10-15: "chữ lúc chờ bắt đầu với lúc nói to nhỏ bất thường" — chữ đề phải CÙNG CỠ ở mọi trạng thái (chờ · 3-2-1 · chuẩn bị · nói · kết quả) và to nhất có thể mà vẫn vừa màn hình.
     Chọn cỡ MỘT LẦN theo độ dài đề + cỡ màn (không theo bố cục từng trạng thái) rồi đặt vào --pfs (sw.css). Chỉ điện thoại. */
  function fitPrompt() {
    var root = document.documentElement, p = document.querySelector("#app .prompt");
    if (!p || window.innerWidth > 520) { root.style.removeProperty("--pfs"); fitPrompt.k = ""; return; }
    var txt = p.textContent || "", w = Math.max(200, p.clientWidth || (window.innerWidth - 56)), key = txt.length + ":" + w + ":" + window.innerHeight;
    if (fitPrompt.k === key) return; fitPrompt.k = key;
    var cardEl = p.closest(".card"), hasImg = !!(cardEl && cardEl.querySelector("img"));
    var avail = Math.max(120, window.innerHeight - 300 - (hasImg ? Math.round(window.innerHeight * 0.3) : 0));   /* chừa chỗ: tiêu đề + thẻ đồng hồ/danh sách + nút (+ ảnh/biểu đồ nếu đề có) */
    var probe = document.createElement("div"); probe.className = p.className;
    probe.style.cssText = "position:absolute;visibility:hidden;left:-9999px;top:0;padding:0;margin:0;white-space:pre-wrap;width:" + w + "px";
    probe.textContent = txt; document.body.appendChild(probe);
    var fs = 18; for (; fs > 14; fs--) { probe.style.setProperty("font-size", fs + "px", "important"); probe.style.setProperty("line-height", "1.45", "important"); if (probe.scrollHeight <= avail) break; }
    document.body.removeChild(probe); root.style.setProperty("--pfs", fs + "px");
  }
  /* ☐ 🎨 nút tick bật/tắt tô màu đề lúc nói (chỉ bài đọc to) — nằm cạnh ✕ ở thanh tiêu đề (TJ 2026-10-15) */
  var HL_KEY = "sw_hl_v1";
  function hlOn() { try { return localStorage.getItem(HL_KEY) === "1"; } catch (e) { return false; } }
  function hlPaint(b) { var on = hlOn(); b.className = "hlt" + (on ? " on" : ""); b.setAttribute("aria-pressed", on ? "true" : "false"); b.textContent = (on ? "☑" : "☐") + " 🎨"; }
  function addHlToggle() {
    /* TJ 2026-10-15: trước nằm ở thanh trên cùng -> hộp "Đã cho phép truy cập Micrô" của iPhone phủ lên vài giây, không bấm được. Nay ở GÓC DƯỚI PHẢI thẻ đề (dính đáy thẻ khi đề cuộn). */
    var p = document.querySelector("#app .prompt.read"), t = curTask(); if (!p || S.kind !== "speaking" || !t || t.type !== "read_aloud") return;
    var card = p.closest(".card"); if (!card || card.querySelector(".hlt")) return;
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-act", "hl"); b.title = "Tô màu đề trực tiếp lúc đọc (mặc định TẮT — thi thật không có phản hồi giữa chừng)"; hlPaint(b); card.appendChild(b);
  }
  function hlClear() { document.querySelectorAll("#app .prompt .lw").forEach(function (s) { if (s.className !== "lw") s.className = "lw"; }); }
  function dockLive() {
    addHlToggle();   /* TJ 2026-10-15: phụ đề chạy nằm NGAY DƯỚI ĐỀ (chiếm chỗ trống), đồng hồ + nút Xong gọn ở đáy */
    var l = document.getElementById("live"), docked = false;
    if (l && document.body.classList.contains("one")) { var card = l.closest(".card"); if (card && l.parentNode === card) card.parentNode.insertBefore(l, card); docked = l.parentNode === app; }
    document.body.classList.toggle("has-live", docked);
  }
  function setOne(on) {   /* bật/tắt chế độ 1 màn hình; bật thì về đầu trang (trang đang cuộn dở sẽ lệch khi khoá cuộn) */
    var was = document.body.classList.contains("one"); document.body.classList.toggle("one", !!on);
    var ct = curTask(); document.body.classList.toggle("txfree", !!on && S.kind === "speaking" && !!ct && ct.type !== "read_aloud");   /* nói tự do: khung phụ đề chạy được nới rộng */
    if (on && !was) { try { window.scrollTo(0, 0); } catch (e) {} }
  }
  function render() {
    document.body.classList.toggle("live", S.screen === "live");
    if (S.screen !== "live" && S.screen !== "task") { document.body.classList.remove("one"); micRelease(); }   /* rời bài -> nhả mic */
    if (S.screen === "home" && CTX.inRoom && !CTX.isHost) return waitView();
    if (S.screen === "rev") return revView();
    if (S.screen === "live") return liveRender();
    if (S.screen === "home") return home();
    if (S.screen === "sum") return summary();
    return task();
  }
  var TIPS = {
    speaking: [["Q1–2 Đọc to", "Ngắt ở dấu phẩy và dấu chấm, nhấn từ nội dung, đọc rõ số / ngày / tên riêng; đọc vừa phải để kịp hết đoạn."], ["Q3 Tả ảnh", "Theo thứ tự: ảnh chụp ở đâu → chủ thể chính đang làm gì → vài chi tiết → cảm giác chung. Đừng sa đà chi tiết nhỏ."], ["Q4–6 Trả lời câu hỏi", "Nói đáp án ngay, rồi lý do, rồi 1 ví dụ ngắn. Chỉ có 3 giây chuẩn bị nên bắt đầu nói luôn."], ["Q7–9 Dựa vào thông tin", "Tìm đúng thông tin trong bảng, không đọc nguyên văn, trả lời đúng điều được hỏi."], ["Q10 Đề xuất giải pháp", "Nhắc lại vấn đề → 2 giải pháp → câu kết."], ["Q11 Nêu ý kiến", "Ý kiến → 2 lý do → 1 ví dụ → câu kết."], ["Chung", "Nói đủ thời gian, không im lặng. Lỡ sai thì nói tiếp, đừng quay lại sửa."]],
    writing: [["Q1–5 Viết câu theo ảnh", "Dùng ĐÚNG cả hai từ cho sẵn, viết 1 câu hoàn chỉnh, đúng ngữ pháp, soát chính tả."], ["Q6–7 Trả lời email", "Chào + nêu lý do viết, trả lời đủ TỪNG yêu cầu trong email, giữ giọng lịch sự, kết + tên."], ["Q8 Bài luận ý kiến", "Từ 300 từ: nêu ý kiến + 2–3 lý do + ví dụ + kết; chia đoạn rõ ràng."], ["Chung", "Chừa 1–2 phút cuối để đọc lại và soát lỗi."]]
  };
  var TIPS2 = [["Q1–2 Đọc to", "Ngắt ở dấu phẩy và dấu chấm, nhấn từ nội dung, đọc rõ số / ngày / tên riêng; 45 giây chuẩn bị để đọc thầm trước."], ["Q3–4 Tả ảnh", "Ảnh chụp ở đâu → chủ thể chính đang làm gì → vài chi tiết → cảm giác chung. 45 giây chuẩn bị, nói 30 giây."], ["Q5–7 Trả lời câu hỏi", "3 giây chuẩn bị: nói đáp án ngay, rồi lý do, rồi 1 ví dụ ngắn. Q5, Q6 có 15 giây, Q7 có 30 giây."], ["Q8–10 Dựa vào thông tin", "45 giây đọc bảng trước, rồi 3 giây chuẩn bị mỗi câu (15s, 15s, 30s). Tìm đúng thông tin, đừng đọc nguyên văn."], ["Q11 Nêu ý kiến", "45 giây chuẩn bị, nói 60 giây: ý kiến → 2 lý do → 1 ví dụ → câu kết."], ["Chung", "Nói đủ thời gian, không im lặng. Lỡ sai thì nói tiếp, đừng quay lại sửa."]];
  function guideHtml() {
    var tm = TMT(S.kind), gs = GRP(S.kind), tot = 0, cs = curSet(), nTask = cs ? cs.tasks.length : gs[0].qs.length, rows = gs.filter(function (g) { return g.k !== "all" && (!cs || cs.tasks.some(function (t) { return g.qs.indexOf(t.q) >= 0; })); }).map(function (g) {
      var sec = 0; g.qs.forEach(function (q) { if (!cs || cs.tasks.some(function (t) { return t.q === q; })) sec += (tm[q] || [0, 0])[0] + (tm[q] || [0, 0])[1]; }); tot += sec;
      return '<div class="gd-row"><span>' + esc(g.t) + "</span><span>" + (cs ? cs.tasks.filter(function (t) { return g.qs.indexOf(t.q) >= 0; }).length : g.qs.length) + " câu</span><span>" + mmss(sec) + "</span></div>";
    }).join("");
    return '<div class="guide"><p class="sub">Hub này để <b>làm đề thi</b> (' + (EX0 ? "IELTS" : "TOEIC") + ' ' + (S.kind === "speaking" ? "Speaking" : "Writing") + "): làm cả bộ, hoặc chọn từng Part / khoảng câu. Thời gian mặc định theo đề thi thật:</p>" +
      '<h3>' + (S.kind === "speaking" ? "🎤 Speaking" : "✍️ Writing") + ' <span class="sub">' + nTask + " câu · " + Math.round(tot / 60) + " phút · " + (S.kind === "speaking" ? "nói vào micro, AI chấm điểm ước tính" : "gõ bài, AI chấm điểm ước tính") + "</span></h3>" + rows + "</div>";
  }
  function tipsHtml() {
    return '<div class="card tips"><b>🧠 Chiến thuật đạt điểm cao</b>' + (S.kind === "writing" && fmtN() === 3 ? TIPS3W : S.kind === "speaking" && fmtN() === 3 ? TIPS3 : S.kind === "speaking" && fmt2() ? TIPS2 : TIPS[S.kind]).map(function (x) { return "<p><b>" + esc(x[0]) + ":</b> " + esc(x[1]) + "</p>"; }).join("") + "</div>";
  }
  function roomCard() {
    var pl = (CTX.players || []).map(function (p) { return '<div class="rc-p" title="' + esc(p.name || "") + '"><span class="rc-av">' + avatarHtml(p.avatar) + "</span><b>" + esc(p.name || "?") + "</b></div>"; }).join("");
    /* TJ 2026-10-15: "Quản lý người chơi" + "Copy link mời" cũng nằm ở ô phòng của Speaking/Writing (như phòng Từ vựng) — chỉ host */
    var hb = CTX.isHost ? '<div class="rc-btns"><button type="button" class="soft" data-act="hdo" data-v="users">👥 Quản lý người chơi</button><button type="button" class="soft" data-act="hdo" data-v="copy">🔗 Copy link mời</button></div>' : "";
    return '<div class="roomcard"><div class="rc-head"><div><div class="sub">Mã phòng</div><div class="rc-code">' + esc(CTX.room || "") + "</div></div>" + hb + '</div><div class="rc-ps">' + pl + "</div></div>";
  }
  function home() {
    savePref();
    var all = SETS[S.kind], hasMine = all.some(function (x) { return x.mine; });
    if (S.src === "mine" && !hasMine) S.src = "std";
    var mineLabel = (all.filter(function (x) { return x.mine && x.src; })[0] || {}).src || "Đề riêng (nạp từ file)";
    var sets = all.filter(function (x) { return S.src === "mine" ? x.mine : !x.mine; }), set = curSet();
    if (!set || sets.indexOf(set) < 0) { set = sets[0]; if (set) S.setId = set.id; }
    var g = GRP(S.kind), has = function (x) { return !!set && set.tasks.some(function (t) { return x.qs.indexOf(t.q) >= 0; }); }, parts = g.filter(function (x) { return x.k !== "all" && has(x); });
    if (!g.some(function (x) { return x.k === S.group && (x.k === "all" || has(x)); })) { S.group = "all"; S.qFrom = S.qTo = null; }
    var gsel = g.filter(function (x) { return x.k === S.group; })[0], scopeAll = S.group === "all", inRoom = classOn();
    var qmin = Math.min.apply(null, gsel.qs), qmax = Math.max.apply(null, gsel.qs);
    function fld(label, inner, cls) { return '<label' + (cls ? ' class="' + cls + '"' : "") + ">" + label + inner + "</label>"; }
    var h = (CTX.inRoom ? roomCard() : "") + '<div class="hubpanel"><div class="hp-grid">' +
      fld("Bộ đề", '<select id="sel-src"><option value="std"' + (S.src !== "mine" ? " selected" : "") + ">" + (EX0 ? (S.kind === "writing" ? "IELTS Writing (dạng đề: prepedu.com · đề + biểu đồ: AI tạo)" : "IELTS Speaking (chủ đề: prepedu.com · câu hỏi: AI soạn)") : "TOEIC " + (S.kind === "speaking" ? "Speaking" : "Writing") + " (đề AI sinh)") + "</option>" + (hasMine ? '<option value="mine"' + (S.src === "mine" ? " selected" : "") + ">📥 " + esc(mineLabel) + "</option>" : "") + "</select>") +
      fld("Đề", '<select id="sel-set">' + sets.map(function (x, n) { return '<option value="' + esc(x.id) + '"' + (x.id === S.setId ? " selected" : "") + ">Test " + (n + 1) + " — " + esc(String(x.title || "").replace(/^Phỏng vấn:\s*/i, "").slice(0, 30)) + "</option>"; }).join("") + "</select>") +
      fld("Phạm vi", '<select id="sel-scope"><option value="all"' + (scopeAll ? " selected" : "") + '>🧩 Cả bộ</option><option value="part"' + (scopeAll ? "" : " selected") + ">🧩 Từng Part</option></select>") +
      fld("Part", '<select id="sel-grp"' + (scopeAll ? " disabled" : "") + ">" + parts.map(function (x) { return '<option value="' + x.k + '"' + (x.k === S.group ? " selected" : "") + ">" + esc(x.t) + "</option>"; }).join("") + "</select>") +
      fld("Kiểu chơi", '<select disabled><option>' + (inRoom ? "Cùng 1 câu (kiểu Kahoot: host bấm giờ, cả phòng cùng chơi)" : EMBED ? "Đang vào phòng…" : "Làm một mình") + "</option></select>") +
      fld("Giây mỗi câu", '<input type="text" value="Theo đề thi thật" disabled>') +
      fld("Từ câu", '<input type="number" id="q-from" min="' + qmin + '" max="' + qmax + '" value="' + (S.qFrom || qmin) + '">') +
      fld("Đến câu", '<input type="number" id="q-to" min="' + qmin + '" max="' + qmax + '" value="' + (S.qTo || qmax) + '">') +
      (inRoom ? '<label class="chk"><input type="checkbox" id="hostplays"' + (S.hostPlays !== false ? " checked" : "") + "> Host cũng chơi</label>" : "<span></span>") + "</div>" +
      (inRoom ? aiToggleHtml() : "") +
      (S.kind === "speaking" && !SR && !MOCK && !inRoom ? '<div class="warn">Trình duyệt này không nhận giọng nói (Web Speech). Dùng Chrome/Edge trên máy tính hoặc Android để nói; ở đây bạn vẫn gõ lại lời mình nói được.</div>' : "") +
      '<div class="hp-btns">' + (!sets.length ? '<span class="sub">Chưa có đề.</span>' : (EMBED && !inRoom) ? '<button class="pri gb" disabled>⏳ Đang vào phòng game…</button>' : '<button class="pri gb" data-act="start" data-v="' + esc(S.group) + '">▶ Bắt đầu làm bài</button>') +
      (((ST.rev || []).filter(function (r) { return r.kind === S.kind; }).length) ? '<button class="soft gb" data-act="rev">📒 Bài đã làm (' + (ST.rev || []).filter(function (r) { return r.kind === S.kind; }).length + ")</button>" : "") +
      '<button class="soft gb" data-act="tips">🧠 Chiến thuật đạt điểm cao</button></div></div>';
    var hist = set ? ST.hist.filter(function (h2) { return h2.kind === S.kind && h2.set === set.id; }).slice(-3).reverse() : [];
    if (hist.length) h += '<h2>Lần làm gần đây</h2><div class="card">' + hist.map(function (x) { return '<div class="row"><span class="sub">' + new Date(x.ts).toLocaleDateString() + " · " + esc(x.gt) + '</span><span style="margin-left:auto"><b>' + x.raw + "/" + x.max + "</b> ≈ " + x.est + "</span></div>"; }).join("") + "</div>";
    h += guideHtml() + '<div id="tips-box">' + tipsHtml() + "</div>";
    h += '<details><summary>📥 Nạp đề riêng từ file .json (lưu ở máy này)</summary><p class="sub">Dùng file do <code>tools/sw/parse_prepedu.py</code> tạo. Đề nạp ở đây chỉ nằm trong trình duyệt của bạn, không đưa lên web.</p><input type="file" id="imp" accept=".json,application/json"> <button class="soft" data-act="delextra">Xoá đề đã nạp</button></details>';
    app.innerHTML = h;
    var imp = $("#imp"); if (imp) imp.onchange = importFile;
  }
  /* ---------- CHẾ ĐỘ LỚP (js/swclass.js ở trang game lo kênh phòng) ---------- */
  /* host trong phòng: Chế độ lớp BẬT sẵn (chỉ tắt khi tự bỏ tick) — trước: chỉ bật khi lúc mở thẻ đã có >=2 người, người vào sau thì host bấm Bắt đầu thành luyện riêng và người chơi không thấy gì */
  /* màu sáng/tối theo TRANG GAME bên ngoài (không theo hệ điều hành) -> màn người chơi giống hệt màn Admin (TJ 2026-10-14) */
  function syncTheme() {
    try {
      var bg = getComputedStyle(window.parent.document.body).backgroundColor, m = String(bg).match(/[\d.]+/g); if (!m || m.length < 3) return;
      if (m.length > 3 && +m[3] === 0) return;   /* trong suốt: chưa biết */
      var lum = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
      document.documentElement.setAttribute("data-theme", lum < 0.5 ? "dark" : "light");
    } catch (e) {}
  }
  syncTheme(); setInterval(syncTheme, 3000);
  function classOn() { return !!(CTX.inRoom && CTX.isHost && S.classMode !== false); }
  setInterval(function () { if (S.screen !== "task") toParent({ type: "sw-hello", kind: S.kind }); }, 2500);   /* luôn hỏi lại (kể cả khi lúc mới nạp CHƯA vào phòng: F5 xong khung nạp trước khi game vào phòng -> trước đây kẹt ở "không trong phòng" nên Admin bắt đầu thành luyện riêng, người chơi không thấy gì) */   /* cập nhật danh sách người trong phòng (người vào sau) */
  function plist() { return (CTX.players || []).filter(function (p) { return !(CTX.isHost && S.hostPlays === false && CTX.me && p.id === CTX.me.id); }); }
  function aiOn() { return S.aiGrade === undefined ? true : !!S.aiGrade; }   /* TJ 2026-10-15: AI chấm luôn BẬT sẵn cho cả Speaking và Writing (host tắt được) */
  function aiToggleHtml() {
    if (!(CTX.inRoom && CTX.isHost)) return "";
    return '<label class="card clsrow"><input type="checkbox" id="aimode"' + (aiOn() ? " checked" : "") + '><span>🤖 <b>AI chấm điểm</b> ' + (S.kind === "writing" ? "(người chơi gõ bài ngay trên web, hết giờ AI chấm)" : "(người chơi dùng mic trên web)") + '<br><span class="sub">' + (S.kind === "writing" ? "Tắt: chỉ hiện đề + đồng hồ, viết ở chỗ khác" : "Tắt: nói bên HelloTalk, web chỉ hiện đề + đồng hồ (Bật sẵn: người được chọn nói bằng mic trên web)") + "</span></span></label>";
  }
  function classBanner() {
    if (!CTX.inRoom) return "";
    if (CTX.isHost) return '<label class="card clsrow"><input type="checkbox" id="clsmode"' + (classOn() ? " checked" : "") + '><span>👥 <b>Chế độ lớp</b><br><span class="sub">Bật rồi chọn đề: cả phòng cùng xem, bạn bấm giờ từng người</span></span></label>' + (classOn() ? aiToggleHtml() : "");
    return '<div class="warn">👥 Bạn đang trong phòng. Khi host bấm bắt đầu, bài sẽ tự mở ra. Bạn vẫn luyện riêng được.</div>';
  }
  function toParent(m) { try { if (window.parent !== window) window.parent.postMessage(m, location.origin); } catch (e) {} }
  function avatarHtml(a) { a = String(a || ""); return /^https?:/.test(a) ? '<img src="' + esc(a) + '" alt="" style="width:20px;height:20px;border-radius:50%;vertical-align:-5px">' : esc(a.slice(0, 2) || "👤"); }
  function boardHtml() {
    if (!S.class) return "";
    var rows = Object.keys(S.class.board).map(function (k) { return S.class.board[k]; }).sort(function (a, b) { return b.total - a.total; });
    if (!rows.length) return '<div class="card" id="cls-board"><b>🏆 Bảng điểm lớp</b><p class="sub">Đang chờ kết quả…</p></div>';
    return '<div class="card" id="cls-board"><b>🏆 Bảng điểm lớp</b><table class="sum">' + rows.map(function (r, i) { return "<tr><td>" + (i + 1) + "</td><td>" + avatarHtml(r.avatar) + " " + esc(r.name) + '</td><td class="n"><b>' + r.total + "</b> điểm · " + r.n + " câu</td></tr>"; }).join("") + "</table></div>";
  }
  function updBoard() { var el = $("#cls-board"); if (el) el.outerHTML = boardHtml(); }
  function classReport(res) {
    if (!S.class || !CTX.me || res.score == null) return;
    var me = CTX.me, b = S.class.board, e = b[me.id] || (b[me.id] = { name: me.name || "Bạn", avatar: me.avatar || "", total: 0, n: 0 });
    var scm = (S.class.sc = S.class.sc || {})[me.id] = S.class.sc[me.id] || {}; scm[res.q] = res.score; e.total = Object.keys(scm).reduce(function (a, k) { return a + scm[k]; }, 0); e.n = Object.keys(scm).length;   /* nói lại -> điểm câu đó thay bằng lần mới */
    var fb = res.fb || {}, rec = { pid: me.id, name: me.name || "", avatar: me.avatar || "", q: res.q, score: res.score, max: res.max, ans: String(res.ans || "").slice(0, 500), s: (fb.strengths || []).slice(0, 2), f: (fb.fixes || []).slice(0, 3), b: String(fb.better || "").slice(0, 600) };
    ((S.class.rq = S.class.rq || {})[res.q] = S.class.rq[res.q] || {})[me.id] = rec;
    toParent({ type: "sw-class-send", p: Object.assign({ t: "res", run: S.class.run, total: e.total, n: e.n }, rec) });
  }
  function applyStart(d) {
    if (KIND0 && d.kind && d.kind !== KIND0) return;
    if ((d.exam || "") !== EX0) return;   /* khung IELTS chỉ nhận lớp IELTS, khung TOEIC chỉ nhận lớp TOEIC */
    if (LIVE && LIVE.run === d.run) return;   /* tin bắt đầu gửi lại (khung nạp xong / nhịp) -> không dựng lại giữa chừng */
    if (!SETS[d.kind].length) { PENDING = d; return; }
    if (!SETS[d.kind].some(function (x) { return x.id === d.set; })) { if (!privOK && CTX.room) { PENDING = d; privLoad(); return; } toast("Máy bạn chưa có đề này"); return; }
    clearTimer(); stopSpeech(); S.kind = d.kind; S.setId = d.set; liveInit(d); toParent({ type: "sw-want-open", kind: d.kind, exam: EX0 }); toast("👥 Lớp bắt đầu!");
  }
  /* ---------- LỚP TRỰC TIẾP: host điều khiển, cả phòng thấy đề + đồng hồ ngược, không chấm điểm, không âm thanh ---------- */
  function liveInit(d) {
    var g = GRP(d.kind).filter(function (x) { return x.k === d.group; })[0] || GRP(d.kind)[0], set = curSet();
    clearTimer(); stopSpeech();
    S.kind = d.kind; S.group = g.k; S.gt = g.t; S.qFrom = d.from || null; S.qTo = d.to || null; S.tasks = set.tasks.filter(function (t) { return g.qs.indexOf(t.q) >= 0 && (!S.qFrom || t.q >= S.qFrom) && (!S.qTo || t.q <= S.qTo) && (d.kind === "writing" || t.type !== "describe" || t.scene || t.image); });
    S.i = 0; S.screen = "live"; S.class = { run: d.run, board: {}, rq: {} }; S.saved = 1; S.results = {}; LIVE = { run: d.run, phase: "show", sp: null, done: {}, tEnd: 0, tot: 0 };
    toParent({ type: "sw-hello", kind: S.kind }); liveRender();
    if (!liveTimer) liveTimer = setInterval(liveTick, 200);
  }
  /* thẻ ⚙ Quản trị của game (rê chuột mép phải) hiện phần "Lớp Speaking/Writing": người chơi, AI chấm, host cũng chơi, Dừng / Kết thúc lớp */
  function adminSync() {
    if (!CTX.isHost) return;
    var L = LIVE;
    if (!L || S.screen !== "live" || L.phase === "end") { toParent({ type: "sw-admin", p: { on: false, kind: S.kind } }); return; }
    toParent({ type: "sw-admin", p: { on: true, kind: S.kind, i: S.i, n: S.tasks.length, phase: L.phase, pd: L.pd ? 1 : 0, ai: aiOn() ? 1 : 0, hp: S.hostPlays !== false ? 1 : 0, sp: L.sp ? L.sp.id : "", pick: (pickOf(plist().filter(function (p) { return !L.done[p.id]; })) || {}).id || "",
      players: (CTX.players || []).map(function (p) { return { id: p.id, name: p.name || "?", avatar: p.avatar || "", done: !!L.done[p.id], me: !!(CTX.me && p.id === CTX.me.id) }; }) } });
  }
  function saveLive() {
    if (!CTX.isHost || !LIVE) return;
    try {
      sessionStorage.setItem("sw-live-v1", JSON.stringify({ run: LIVE.run, kind: S.kind, exam: EX0, set: S.setId, group: S.group, from: S.qFrom || 0, to: S.qTo || 0, i: S.i, phase: LIVE.phase, sp: LIVE.sp, done: LIVE.done, tEnd: LIVE.tEnd, pd: LIVE.pd ? 1 : 0, nx: LIVE.nx || "", ai: aiOn() ? 1 : 0, at: Date.now() }));
      sessionStorage.setItem("tjwl_sw_keep", S.kind);   /* learn.js: F5 thì mở lại đúng thẻ Speaking/Writing */
    } catch (e) {}
  }
  function clearLive() { toParent({ type: "sw-admin", p: { on: false, kind: S.kind } }); try { sessionStorage.removeItem("sw-live-v1"); sessionStorage.removeItem("tjwl_sw_keep"); } catch (e) {} }
  function maybeRestore() {
    if (S.restored || !CTX.isHost || !CTX.inRoom || !SETS[S.kind].length || LIVE) return;
    S.restored = 1;
    var o = null; try { o = JSON.parse(sessionStorage.getItem("sw-live-v1") || "null"); } catch (e) {}
    if (!o || o.kind !== S.kind || Date.now() - o.at > 6 * 3600e3 || !SETS[o.kind].some(function (x) { return x.id === o.set; })) return;
    S.setId = o.set; S.aiGrade = !!o.ai;
    liveInit({ kind: o.kind, group: o.group, run: o.run, from: o.from, to: o.to });
    var running = o.phase === "ready" || o.phase === "prep" || o.phase === "resp", left = o.tEnd ? (o.tEnd - Date.now()) / 1000 : 0, st = { i: o.i, phase: o.phase, sp: o.sp, done: o.done || {}, sec: 0, pd: o.pd || 0, nx: o.nx || "" };
    if (running && left > 0.5) st.sec = left / SCALE;
    else if (running) { st.phase = "idle"; st.done = Object.assign({}, st.done); if (o.sp) st.done[o.sp.id] = 1; st.sp = null; }   /* hết giờ trong lúc tải lại: coi như xong lượt */
    liveSend(st);
  }
  function liveSend(st) { st.t = "live"; st.run = LIVE.run; st.ai = aiOn() ? 1 : 0; st.from = S.qFrom || 0; st.to = S.qTo || 0; st.kind = S.kind; st.exam = EX0; st.set = S.setId; st.group = S.group; if (st.pd === undefined) st.pd = LIVE.pd ? 1 : 0; toParent({ type: "sw-class-send", p: st }); liveApply(st); }
  function liveApply(st) {
    if (!st || st.run === S.leftRun) return;
    if (st.phase === "close") {   /* host rời lớp / chuyển sang game khác -> người chơi tự thoát khỏi màn lớp, về game */
      if (LIVE && st.run === LIVE.run && !CTX.isHost) { S.leftRun = st.run; LIVE = null; clearTimer(); stopSpeech(); S.screen = "home"; render(); toParent({ type: "sw-leave" }); }
      return;
    }
    if (!LIVE || st.run !== LIVE.run) {   /* vào phòng sau: dựng màn hình theo trạng thái host đang phát */
      if (KIND0 && st.kind && st.kind !== KIND0) return;
      if ((st.exam || "") !== EX0) return;   /* khung Writing không nhận lớp Speaking (và ngược lại) */
      if (!st.kind || !st.set || !SETS[st.kind].some(function (x) { return x.id === st.set; })) return;
      S.setId = st.set; liveInit({ kind: st.kind, group: st.group, run: st.run, from: st.from, to: st.to });
      toParent({ type: "sw-want-open", kind: st.kind, exam: EX0 });   /* lớp đang chạy -> bảo trang cha mở lại lớp phủ (nếu người chơi lỡ bị đóng) */
    }
    var sig = [st.i, st.phase, st.sp && st.sp.id, Object.keys(st.done || {}).length, st.ai ? 1 : 0, st.pd ? 1 : 0, st.nx || ""].join("|");
    if (LIVE.sig === sig && st.hb) { LIVE.tot = (st.sec || 0) * SCALE; LIVE.tEnd = st.sec ? Date.now() + LIVE.tot * 1000 : 0; if (S.screen === "live") smoothBar(); return; }
    LIVE.sig = sig;
    var wasR = LIVE.mineOn, nowR = meActive(st) && st.phase === "resp", oldI = S.i;
    if (wasR && !nowR) finishMine();
    LIVE.fins = {}; LIVE.rdys = {}; LIVE.rdyMe = false; LIVE.pd = !!st.pd; LIVE.nx = st.nx || ""; LIVE.ai = !!st.ai; LIVE.phase = st.phase; LIVE.sp = st.sp || null; LIVE.done = st.done || {}; S.i = st.i || 0; LIVE.adv = 0;
    LIVE.tot = (st.sec || 0) * SCALE; LIVE.tEnd = st.sec ? Date.now() + LIVE.tot * 1000 : 0;
    if ((st.i || 0) !== oldI) LIVE.my = null;
    liveRender();
    if (!wasR && nowR) startMine();
    if (st.phase === "end") clearLive(); else saveLive();
  }
  function liveRdy(pid) {   /* host: người nói bấm "Sẵn sàng" -> vào phần nói ngay; "cả lớp" thì khi mọi người (trừ host) đã sẵn sàng */
    var L = LIVE; if (!L || !CTX.isHost || L.adv || L.phase !== "prep") return;
    if (L.sp) { if (L.sp.id === pid) { L.adv = 1; liveNext(); } return; }
    L.rdys = L.rdys || {}; L.rdys[pid] = 1;
    var others = plist().filter(function (p) { return !(CTX.me && p.id === CTX.me.id); });
    if (others.length && others.every(function (p) { return L.rdys[p.id]; })) { L.adv = 1; liveNext(); }
  }
  function liveFin(pid) {   /* host: có người bấm Xong -> hết lượt sớm khi người nói xong, hoặc khi cả lớp đã nộp */
    var L = LIVE; if (!L || !CTX.isHost || L.adv || L.phase !== "resp") return;
    if (L.sp) { if (L.sp.id === pid) { L.adv = 1; liveNext(); } return; }
    L.fins = L.fins || {}; L.fins[pid] = 1;
    if (Object.keys(L.fins).length >= Math.max(1, plist().length)) { L.adv = 1; liveNext(); }
  }
  function busy(L) { return !!L && (L.phase === "ready" || L.phase === "prep" || L.phase === "resp"); }
  function myTurn(st) {   /* tới lượt máy này: host chọn mình, hoặc "cả lớp" (sp rỗng) */
    if (!st || (st.phase !== "prep" && st.phase !== "resp")) return false;
    return !st.sp || !!(CTX.me && st.sp.id === CTX.me.id);
  }
  /* mic + AI chấm trên web CHỈ khi host bật "AI chấm" (TJ 2026-10-14: đang nói bằng mic trên HelloTalk nên web không xài mic; tắt = web chỉ hiện đề + đồng hồ) */
  function meActive(st) { return !!(st && st.ai) && myTurn(st); }
  function startMine() {
    var L = LIVE, t = curTask(); L.mineOn = true; L.my = null; S.tr = ""; S.interim = ""; S.text = ""; liveRender();
    if (S.kind === "speaking") { recAudioStart(); startSpeech(t); }
  }
  function finishMine() {
    var L = LIVE, t = curTask(); L.mineOn = false; stopSpeech();
    if (S.kind === "writing") { var a = $("#ans"); if (a) S.text = a.value; } else { var m = $("#manual"); if (m && m.value) S.tr = m.value; }
    var aP = S.kind === "speaking" ? recAudioStop() : null; L.my = "grading"; L.myQ = t.q;
    if (S.class && CTX.me) toParent({ type: "sw-class-send", p: { t: "res", pending: 1, run: S.class.run, pid: CTX.me.id, name: CTX.me.name || "", avatar: CTX.me.avatar || "", q: t.q } });   /* cả phòng thấy "AI đang chấm bạn này" */
    grade(aP);
  }
  function smoothBar() {   /* thanh chạy liền mạch từ vị trí hiện tại tới hết giờ (không nhảy từng khúc theo nhịp 200ms) */
    var pg = $("#pg"), L = LIVE; if (!pg || !L || !L.tEnd) return;
    var left = Math.max(0, (L.tEnd - Date.now()) / 1000);
    pg.style.transition = "none"; pg.style.width = Math.min(100, 100 * (1 - left / Math.max(.001, L.tot))) + "%";
    void pg.offsetWidth; pg.style.transition = "width " + left.toFixed(2) + "s linear"; pg.style.width = "100%";
  }
  function shortPrep() { return liveTimes()[0] <= 5; }   /* chuẩn bị chỉ ~3s (Q4–9): không có pha chuẩn bị chung — chạm tên là người đó nói luôn (3-2-1 chính là 3 giây đó) */
  function needPrep() { var L = LIVE; return !!L && S.kind === "speaking" && !shortPrep() && !L.pd; }
  function liveTimes() { var t = curTask(); return TMT(S.kind)[t.q] || [0, 60]; }
  function liveNext() {   /* host: hết giờ (hoặc bấm Dừng / Bỏ qua) pha hiện tại.
     Luồng mỗi câu Speaking: 3-2-1 -> CHUẨN BỊ CHUNG cả phòng (1 lần) -> chọn từng người: 3-2-1 -> người đó NÓI (không chuẩn bị riêng) -> ... -> Câu tiếp */
    var L = LIVE, tm = liveTimes(), st = { i: S.i, sp: L.sp, done: L.done, pd: L.pd ? 1 : 0 };
    if (L.phase === "ready") {
      if (L.nx === "prep" || L.nx === "prep+all") { st.phase = "prep"; st.sec = tm[0]; st.sp = null; st.pd = 0; st.nx = L.nx === "prep+all" ? "all" : ""; }
      else { st.phase = "resp"; st.sec = tm[1]; st.pd = 1; }
    } else if (L.phase === "prep") {
      if (L.nx === "all") { st.phase = "resp"; st.sec = tm[1]; st.sp = null; st.pd = 1; }   /* "Cả lớp": hết chuẩn bị chung là cả phòng nói luôn */
      else { st.phase = "idle"; st.sec = 0; st.sp = null; st.pd = 1; }                         /* chuẩn bị chung xong -> host chọn người nói */
    } else { st.done = Object.assign({}, L.done); if (L.sp) st.done[L.sp.id] = 1; else if (S.kind === "speaking") plist().forEach(function (p) { st.done[p.id] = 1; }); st.phase = "idle"; st.sec = 0; st.sp = null; st.pd = 1; }
    liveSend(st);
  }
  function liveTick() {
    var L = LIVE, el = $("#tm"); if (!L || S.screen !== "live") return;
    if (CTX.isHost && Date.now() - (L.hbAt || 0) > 4000) {
      L.hbAt = Date.now();
      toParent({ type: "sw-class-send", p: { t: "live", hb: 1, pd: L.pd ? 1 : 0, nx: L.nx || "", ai: aiOn() ? 1 : 0, from: S.qFrom || 0, to: S.qTo || 0, run: L.run, kind: S.kind, exam: EX0, set: S.setId, group: S.group, i: S.i, phase: L.phase, sp: L.sp, done: L.done, sec: L.tEnd ? Math.max(0, (L.tEnd - Date.now()) / 1000 / SCALE) : 0 } });
    }
    if (L.phase === "ready" && L.tEnd) {
      var lf = Math.max(0, (L.tEnd - Date.now()) / 1000), rn = $("#rdnum"), ra = $("#rdarc");
      if (rn) { var nn = Math.max(1, Math.ceil((MOCK ? lf / SCALE : lf) - .001)); if (rn.textContent !== String(nn)) { rn.textContent = nn; rn.classList.remove("pop"); void rn.offsetWidth; rn.classList.add("pop"); } }
      if (ra) ra.style.strokeDashoffset = String(339.3 * (1 - Math.min(1, lf / Math.max(.001, L.tot))));
      if (lf <= 0 && CTX.isHost && !L.adv) { L.adv = 1; liveNext(); }
      return;
    }
    if (!el || !L.tEnd) return;
    var left = Math.max(0, (L.tEnd - Date.now()) / 1000), sh = MOCK ? left / SCALE : left, cd = $("#cd");
    el.textContent = mmss(sh); el.classList.toggle("last5", sh > 0 && sh <= 5);   /* 5 giây cuối: số nhấp nháy nhẹ + thanh đổi màu, không che đề */
    var pgb = $("#pg"); if (pgb && pgb.parentNode) pgb.parentNode.classList.toggle("last5", sh > 0 && sh <= 5);
    if (left <= 0 && CTX.isHost && !L.adv) { L.adv = 1; liveNext(); }
  }
  function liveRender() {
    var L = LIVE; if (!L) return; var host = CTX.isHost, spk = S.kind === "speaking", me = CTX.me || {};
    if (S.kind === "speaking" && (L.phase === "ready" || L.phase === "prep")) primeMic();   /* đếm 3-2-1 / chuẩn bị: xin quyền mic NGAY, tới lượt nói là có sẵn */
    setOne(L.phase === "ready" || L.phase === "prep" || L.phase === "resp");   /* TJ 2026-10-15: đang đếm giờ/nói/viết -> MỌI THỨ vừa 1 màn hình, không cuộn */
    if (S.i !== liveRender.lastI) { liveRender.lastI = S.i; try { window.scrollTo(0, 0); } catch (e) {} }   /* sang câu mới: luôn về đầu trang (không bị lệch khuất đề) */
    if (L.phase === "end") { app.innerHTML = '<div class="top"><button class="soft" data-act="quit" title="Thoát">✕</button><div class="t"><b>Hết bài</b></div></div><div class="card" style="text-align:center"><h2>🎉 Cả lớp đã xong</h2></div><div class="bottom"><div class="in"><button class="pri big" data-act="home">Về chọn đề</button></div></div>'; return; }
    var t = curTask(), tm = liveTimes(), run = L.phase === "prep" || L.phase === "resp", last = S.i >= S.tasks.length - 1, act = meActive(L), mybox = "";
    var fin = '<button class="rec big" data-act="lfin" style="width:100%;margin-top:8px">⏹ Xong</button>';
    if (act && L.phase === "resp" && !L.mineOn) mybox = '<p class="sub" style="margin-top:8px">' + (L.my === "grading" ? "✓ Đã nộp — AI đang chấm…" : "✓ Đã nộp") + "</p>";
    else if (act && L.phase === "resp") mybox = spk ? '<div class="live" id="live"><i>🎤 Mic của bạn đang bật — hãy nói…</i></div>' + (SR || MOCK ? "" : '<textarea id="manual" placeholder="Trình duyệt không nhận giọng: gõ lại điều bạn nói"></textarea>') + fin : '<textarea id="ans" placeholder="Gõ bài viết của bạn…"></textarea>' + fin;
    else if (!L.ai && myTurn(L) && L.phase === "resp") mybox = fin;
    else if (act) mybox = '<p class="sub">' + (spk ? "Đến lượt bạn — hết giờ chuẩn bị máy tự bật mic." : "Chuẩn bị viết…") + "</p>";
    if (L.phase === "prep" && !L.sp) mybox = '<p class="sub">Cả phòng cùng chuẩn bị — xong thì bấm "Sẵn sàng".</p>';
    if (!host && myTurn(L) && L.phase === "prep") mybox += L.rdyMe ? '<p class="sub">✓ Bạn đã sẵn sàng — đợi mọi người</p>' : '<button class="pri big" data-act="lrdy" style="width:100%;margin-top:8px">⏭ Sẵn sàng rồi — nói luôn</button>';
    var h = '<div class="top"><button class="soft" data-act="quit" title="Thoát">✕</button><div class="t"><b>Câu ' + t.q + "</b> · " + esc(tl(t)) + ' <span class="sub">(' + (S.i + 1) + "/" + S.tasks.length + ")</span></div></div>";
    h += '<div class="card">' + promptHtml(t) + "</div>";   /* TJ 2026-10-14: màn người chơi PHẢI giống Admin (thấy đề ngay); Admin chỉ bấm bắt đầu + đếm giờ */
    h += '<div class="card" style="text-align:center">';
    if (L.phase === "ready") {
      var rw = L.sp ? avatarHtml(L.sp.avatar) + " <b>" + esc(L.sp.name) + "</b>" : "Cả lớp";
      h += '<div class="sub">Sắp bắt đầu</div><div class="rd"><svg class="rd-spin" viewBox="0 0 130 130"><circle cx="65" cy="65" r="62" /></svg><svg class="rd-ring" viewBox="0 0 130 130"><circle class="trk" cx="65" cy="65" r="54" /><circle class="arc" id="rdarc" cx="65" cy="65" r="54" /></svg><div class="num" id="rdnum">3</div></div><div class="row" style="justify-content:center"><b>' + rw + "</b></div>";
    } else if (run) {
      var who = L.sp ? avatarHtml(L.sp.avatar) + " <b>" + esc(L.sp.name) + "</b>" : "Cả lớp", mine = L.sp && me.id && L.sp.id === me.id;
      h += '<div class="row" style="justify-content:center"><span class="badge ' + (L.phase === "resp" ? "resp" : "prep") + '">' + (L.phase === "prep" ? "Chuẩn bị" : spk ? "Đang nói" : "Đang viết") + "</span> " + who + "</div>" + (mine ? "<p><b>🎤 Đến lượt bạn!</b></p>" : "") + '<div class="timer ' + (L.phase === "resp" ? "resp" : "prep") + '" id="tm">0:00</div><div class="bar ' + (L.phase === "resp" ? "resp" : "") + '"><i id="pg"></i></div>' + mybox + (L.ai ? "" : '<p class="sub">🎧 Nói trên HelloTalk · web chỉ đếm giờ (không ghi âm, không chấm)</p>');
    } else {
      var nd = Object.keys(L.done).length;
      h += (spk ? rosterHtml(host) : "") + (spk ? '<p class="sub">' + (nd ? "Đã nói: <b>" + nd + "</b> người. " : "") + (tm[0] <= 5 ? "Chạm tên = người đó nói luôn · mỗi người <b>" + tm[1] + "s</b>" : L.pd ? "✓ Chuẩn bị xong — chọn người nói, mỗi người <b>" + tm[1] + "s</b>" : "Chuẩn bị chung cả phòng <b>" + tm[0] + "s</b>, rồi từng người nói <b>" + tm[1] + "s</b>") + "</p>" : '<p class="sub">Thời gian viết: <b>' + mmss(tm[1]) + "</b></p>");
      if (!host) h += "<p><i>Đợi host bấm Bắt đầu…</i></p>";
    }
    h += "</div>";
    var hostbar = "";
    if (host) {
      var ps = plist().filter(function (p) { return !L.done[p.id]; }), needP = spk && tm[0] > 5 && !L.pd, prim = "", more = "";
      var prvB = S.i > 0 ? '<button class="big" data-act="lprev">‹ Câu trước</button>' : "",
          nxb = prvB + (last ? "" : '<button class="big" data-act="lnext">Câu tiếp ›</button>'),
          endB = '<button class="big endb" data-act="lend">⏹ Kết thúc lớp</button>',
          mgB = '<button class="big" data-act="hdo" data-v="users">👥 Quản lý người chơi</button><button class="big" data-act="hdo" data-v="copy">🔗 Copy link mời</button>',
          aiB = '<label class="aisw" title="AI chấm điểm cho cả phòng (áp dụng từ lượt kế tiếp)"><span>🤖 AI chấm điểm</span><input type="checkbox" id="aimode"' + (aiOn() ? " checked" : "") + "></label>",
          allB = '<button class="big" data-act="lall" title="Cả phòng nói cùng lúc, mỗi máy tự chấm">👥 Cả lớp nói cùng lúc</button>',
          pk = pickOf(ps), nm = pk ? " · " + esc(pk.name || "") : "";
      if (L.phase === "ready") { prim = '<button class="big" data-act="lstop">⏭ Bỏ qua đếm ngược</button>'; more = prvB + aiB + endB; }
      else if (L.phase === "prep") { prim = '<button class="pri big" data-act="lskip">⏭ Kết thúc chuẩn bị</button>'; more = prvB + aiB + endB; }
      else if (run) { prim = '<button class="big" data-act="lstop">⏹ Dừng lượt này</button>'; more = prvB + aiB + endB; }
      else if (needP) { prim = nxb; more = allB + aiB + endB; if (last) prim += endB; }   /* chuẩn bị chung = nút NHỎ ở khu danh sách người chơi */
      else if (spk) { prim = nxb; more = allB + aiB + endB; if (last) prim += endB; }   /* nút "Bắt đầu nói" nằm ngay dưới danh sách người chơi (rosterHtml) */
      else { prim = (L.phase === "idle" ? "" : '<button class="pri big" data-act="lstart">▶ Bắt đầu viết</button>') + nxb; more = aiB + endB; if (last && L.phase === "idle") prim += endB; }
      hostbar = '<div class="card hostbar"><div class="hb-main">' + prim + '</div><div class="hmore" tabindex="0"><button type="button" class="hmore-h" data-act="hmore" title="Thêm: AI chấm, Kết thúc lớp… (rê chuột vào)">⋯</button><div class="hmore-p"><button type="button" class="hmore-x" data-act="hclose" title="Đóng">✕</button>' + mgB + more + "</div></div></div>";
    }
    var below = !!hostbar && (L.phase === "ready" || run);   /* đang đếm giờ: nút host nằm NGAY DƯỚI đồng hồ */
    if (below) h += hostbar.replace('class="card hostbar"', 'class="card hostbar below"').replace(/<div class="hmore"[\s\S]*<\/div><\/div><\/div>$/, "</div>");   /* đang đếm giờ: chỉ 1 nút; AI chấm / Kết thúc lớp nằm ở thẻ ⚙ Quản trị */
    if (!L.mineOn && L.phase !== "ready" && L.my && L.myQ === t.q) h += L.my === "grading" ? '<div class="card" style="text-align:center"><span class="spin"></span> AI đang chấm bài của bạn…</div>' : (S.results[t.q] ? result("", t, true) : "");
    if (L.phase !== "ready") h += othersHtml(t.q) + (run ? "" : boardHtml());
    if (run && spk) h += rosterHtml(false);
    if (hostbar && !below) { var ti = h.indexOf("</div></div>") + 12; h = h.slice(0, ti) + hostbar + h.slice(ti); }   /* thanh điều khiển của host DÍNH Ở ĐẦU màn (cuộn đâu cũng thấy; ảnh to không đẩy nút xuống khuất) */
    app.innerHTML = h; dockLive(); fitPrompt(); smoothBar(); liveTick(); adminSync();
    if (S.kind === "speaking" && L.phase === "resp" && $("#live")) liveUpd();   /* vẽ lại giữa chừng không làm mất phụ đề + tô màu đề */
  }
  /* ---------- LỊCH SỬ: xem lại bài cũ + lỗi sai (lưu ở máy này) ---------- */
  function promptShort(t) {
    var x = t.text || t.question || t.message || t.scene || (t.email && (t.email.subject + " — " + t.email.body)) || "";
    if (t.words) x += " [" + t.words.join(" + ") + "]";
    return String(x).slice(0, 400);
  }
  function saveRev(t, res, aP) {
    var fb = res.fb || {}; ST.rev = ST.rev || [];
    var rec = { ts: Date.now(), kind: S.kind, set: S.setId, q: res.q, type: t.type, pm: promptShort(t), ans: String(res.ans || "").slice(0, 900), score: res.score, max: res.max, s: (fb.strengths || []).slice(0, 3), f: (fb.fixes || []).slice(0, 5), better: String(fb.better || "").slice(0, 900), live: LIVE ? 1 : 0 };
    ST.rev.push(rec); revCloudSave(rec);
    if (aP) aP.then(function (blob) { uploadAudio(rec, blob); });   /* ghi âm xong -> tải lên rồi gắn đường dẫn vào bài này */
    if (ST.rev.length > 200) ST.rev.splice(0, ST.rev.length - 200);
    save();
  }
  /* đồng bộ Supabase (bảng sw_history, xem tools/sw_history.sql): chỉ lưu câu chưa đạt tối đa, giữ 50 bài gần nhất/người, xoá >90 ngày; chưa có bảng/mạng lỗi thì im lặng dùng bản trên máy */
  /* ĐỀ RIÊNG TRONG PHÒNG (Supabase, bảng sw_private_sets): đề nguyên văn có bản quyền KHÔNG nằm trong repo công khai; chỉ đọc được qua hàm sw_private_get(mã phòng) -> người trong phòng được phép thấy */
  var privFor = "", privOK = false;
  async function privLoad() {
    var room = CTX.room; if (!room || room === privFor) return; privFor = room; privOK = false;
    try {
      var r = await sbRest("rpc/sw_private_get", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_room: room }) }); if (!r.ok) { privOK = true; return; }
      (await r.json()).forEach(function (st) {
        var k = st.kind === "writing" ? "writing" : "speaking"; if (EX0 || !st || SETS[k].some(function (x) { return x.id === st.id; })) return;
        st.mine = 1; st.src = st.src || (/^prep-/.test(st.id) ? "Từ prepedu.com (TOEIC " + (k === "speaking" ? "Speaking" : "Writing") + " có đáp án)" : "Đề riêng trong phòng");
        st.title = String(st.title || "").replace(/^Prepedu\s*/i, "") + (/^prep-/.test(st.id) ? " · prepedu.com" : ""); SETS[k].push(st);
      });
      privOK = true;
      if (PENDING && SETS[PENDING.kind].length) { var pp = PENDING; PENDING = null; applyStart(pp); }
      else if (S.screen === "home") render();
    } catch (e) {}
    privOK = true; if (PENDING && SETS[PENDING.kind].length) { var p2 = PENDING; PENDING = null; applyStart(p2); }
  }
  function sbRest(path, opt) {
    opt = opt || {};
    return fetch(String(CFG.SUPABASE_URL || "").replace(/\/$/, "") + "/rest/v1/" + path, { method: opt.method || "GET", headers: Object.assign({ apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, opt.headers || {}), body: opt.body });
  }
  function revCloudSave(r) {
    var me = CTX.me; if (!me || !me.id || r.score == null) return;
    try { sbRest("sw_history?on_conflict=player_id,ts", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ player_id: me.id, ts: r.ts, kind: r.kind, set_id: r.set, q: r.q, type: r.type, pm: r.pm, score: r.score, max: r.max, ans: r.ans, s: r.s, f: r.f, better: r.better, live: !!r.live, audio: r.audio || null }) }).catch(function () {}); } catch (e) {}
  }
  async function revCloudLoad() {
    var me = CTX.me; if (!me || !me.id || S.revLoaded === me.id) return; S.revLoaded = me.id;
    try {
      var r = await sbRest("sw_history?player_id=eq." + encodeURIComponent(me.id) + "&order=ts.desc&limit=80"); if (!r.ok) return;
      var rows = await r.json(); if (!Array.isArray(rows)) return;
      ST.rev = ST.rev || []; var have = {}, add = 0; ST.rev.forEach(function (x) { have[x.ts] = 1; });
      rows.forEach(function (x) { if (have[x.ts]) return; ST.rev.push({ ts: +x.ts, kind: x.kind, set: x.set_id, q: x.q, type: x.type, pm: x.pm || "", ans: x.ans || "", score: x.score, max: x.max, s: x.s || [], f: x.f || [], better: x.better || "", live: x.live ? 1 : 0, audio: x.audio || "" }); add++; });
      if (add) { ST.rev.sort(function (a, b) { return a.ts - b.ts; }); if (ST.rev.length > 200) ST.rev.splice(0, ST.rev.length - 200); save(); if (S.screen === "rev" || S.screen === "home") render(); }
      var lim = Math.max(rows.length > 50 ? rows[49].ts : 0, Date.now() - 90 * 86400000);
      sbRest("sw_history?player_id=eq." + encodeURIComponent(me.id) + "&ts=lt." + lim, { method: "DELETE" }).catch(function () {});
    } catch (e) {}
  }
  function revView() {
    var all = (ST.rev || []).filter(function (r) { return r.kind === S.kind; }).slice().reverse(), list = S.revAll ? all : all.filter(function (r) { return r.score < r.max; });
    var li = function (a, c) { return a && a.length ? '<ul class="fb ' + c + '">' + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : ""; };
    var h = '<div class="top"><button class="soft" data-act="home" title="Về">✕</button><div class="t"><b>📒 Bài cũ · ' + (S.kind === "speaking" ? "Speaking" : "Writing") + '</b></div></div>' +
      '<div class="row" style="gap:8px;margin:6px 0"><button class="' + (S.revAll ? "" : "pri") + '" data-act="revf">' + (S.revAll ? "Đang xem: tất cả (" + all.length + ")" : "Đang xem: câu chưa đạt tối đa (" + list.length + ")") + '</button></div>';
    if (!list.length) h += '<div class="card"><p class="sub">' + (all.length ? "Không có câu nào cần xem lại 🎉" : "Chưa có bài nào. Chấm xong câu nào thì câu đó tự lưu ở đây.") + "</p></div>";
    list.forEach(function (r) {
      h += '<details class="card"><summary><span class="sub">' + new Date(r.ts).toLocaleDateString() + " " + new Date(r.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + (r.live ? " · 👥 lớp" : "") + "</span> · <b>Câu " + r.q + "</b> · " + esc(String(r.type).replace("_", " ")) + ' <b style="float:right">' + r.score + "/" + r.max + "</b></summary>" +
        '<p class="sub">Đề:</p><div class="prompt">' + esc(r.pm) + '</div><p class="sub">Bài bạn:</p>' + (r.audio ? '<audio controls preload="none" src="' + esc(r.audio) + '" style="width:100%;margin:4px 0"></audio>' : "") + '<div class="live">' + esc(r.ans || "(trống)") + "</div>" + li(r.s, "ok") + (r.f && r.f.length ? "<p><b>Cần sửa</b></p>" : "") + li(r.f, "") + (r.better ? '<details><summary>✨ Bản gợi ý cải thiện</summary><div class="model">' + esc(r.better) + "</div></details>" : "") + "</details>";
    });
    if (all.length) h += '<p style="text-align:center"><button class="soft" data-act="revclr">🗑 Xoá lịch sử</button></p>';
    app.innerHTML = h;
  }
  function othersHtml(q) {   /* kết quả của các bạn khác ở câu này: hiện công khai cho cả phòng */
    var m = (S.class && S.class.rq && S.class.rq[q]) || {}, me = (CTX.me || {}).id;
    var rows = Object.keys(m).filter(function (k) { return k !== me; }).map(function (k) {
      var r = m[k]; if (r.pending) return '<div class="oth pend">' + avatarHtml(r.avatar) + " <b>" + esc(r.name) + '</b> · <span class="spin"></span> AI đang chấm…</div>';
      var ul = function (a, c) { return a && a.length ? '<ul class="fb ' + c + '">' + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : ""; };
      return '<details open class="oth"><summary>' + avatarHtml(r.avatar) + " <b>" + esc(r.name) + "</b> · " + r.score + "/" + r.max + "</summary>" + (r.ans ? '<div class="live">' + esc(r.ans) + "</div>" : "") + ul(r.s, "ok") + ul(r.f, "") + (r.b ? '<details open class="oth-b"><summary>✨ Bản gợi ý cải thiện</summary><div class="model">' + esc(r.b) + "</div></details>" : "") + "</details>";
    });
    return '<div id="oth-box">' + (rows.length ? '<div class="card"><b>👥 Kết quả của cả lớp</b>' + rows.join("") + "</div>" : "") + "</div>";
  }
  function pickOf(ps) { var L = LIVE, all = plist(); return all.filter(function (p) { return p.id === L.pick; })[0] || ps[0] || all[0]; }   /* host chọn được cả người đã nói (nói lại, chấm lại) */
  function rosterGo(host) {   /* nút "Bắt đầu nói · tên" sát danh sách người chơi (chạm tên để chọn, rồi bấm ngay bên dưới) */
    var L = LIVE; if (!host || !L || S.kind !== "speaking" || L.sp || L.phase === "ready" || L.phase === "prep" || L.phase === "resp") return "";
    var ps = plist().filter(function (p) { return !L.done[p.id]; }), pk = pickOf(ps), tm = liveTimes();
    var prepB = needPrep() ? '<button type="button" class="pri big prepbtn" data-act="lprep">⏱ Chuẩn bị chung · ' + tm[0] + "s</button>" : "";
    return '<div class="gorow">' + prepB + (pk ? '<button class="pri big gobtn" data-act="lspeak">' + (ps.length ? "▶ Bắt đầu nói" : "↻ Nói lại") + " · " + esc(pk.name || "") + " · " + tm[1] + "s</button>" : "") + "</div>";
  }
  function rosterHtml(host) {
    var L = LIVE, ps = plist(), rest = ps.filter(function (p) { return !L.done[p.id]; }), cur = L.sp ? L.sp.id : (host ? (pickOf(rest) || {}).id : "");
    if (!ps.length) return "";
    return '<div class="card roster"><div class="sub">' + (host ? "Chạm tên để chọn người nói tiếp" : "Thứ tự trong phòng") + '</div>' + ps.map(function (p) {
      var dn = L.done[p.id], on = p.id === cur; return '<button class="chip' + (dn ? " done" : "") + (on ? " on" : "") + '"' + (host && !L.sp ? ' data-act="lpick" data-v="' + esc(p.id) + '" title="' + (dn ? "Nói lại" : "Chọn") + '"' : " disabled") + ">" + (dn ? "✓ " : "") + avatarHtml(p.avatar) + " " + esc(p.name || "?") + "</button>";
    }).join("") + rosterGo(host) + "</div>";
  }
  function liveAct(a, v) {
    if (a === "lsolo" && LIVE) {   /* rời lớp, tự luyện đúng câu này (AI chấm như bình thường) */
      var t = curTask(); S.leftRun = LIVE.run; LIVE = null; clearTimer(); S.class = null; S.saved = 1; S.tasks = [t]; S.i = 0; S.results = {}; S.group = "one"; S.gt = "Câu " + t.q; S.screen = "task"; question(); return true;
    }
    if (a === "lrdy" && LIVE && LIVE.phase === "prep" && !CTX.isHost) {
      LIVE.rdyMe = true; var me1 = CTX.me || {};
      toParent({ type: "sw-class-send", p: { t: "rdy", run: LIVE.run, pid: me1.id } }); liveRender(); return true;
    }
    if (a === "lfin" && LIVE && (LIVE.mineOn || (!LIVE.ai && myTurn(LIVE) && LIVE.phase === "resp"))) {
      var me0 = CTX.me || {};
      if (!LIVE.sp && LIVE.mineOn) { finishMine(); liveRender(); }
      if (CTX.isHost) liveFin(me0.id); else toParent({ type: "sw-class-send", p: { t: "fin", run: LIVE.run, pid: me0.id } });
      return true;
    }
    if (a === "lregrade" && LIVE) { LIVE.my = "grading"; liveRender(); grade(); return true; }
    if (!LIVE || S.screen !== "live" || !CTX.isHost) return false;
    var tm = liveTimes(), L = LIVE;
    if (a === "lstart") {
      if (needPrep()) liveSend({ i: S.i, phase: "ready", sp: null, sec: 3, done: L.done, pd: 0, nx: "prep" });   /* chuẩn bị CHUNG cả phòng trước */
      else {
        var sp = null;
        if (S.kind === "speaking") { sp = pickOf(plist().filter(function (p) { return !L.done[p.id]; })); if (!sp) return true; sp = { id: sp.id, name: sp.name, avatar: sp.avatar }; }
        liveSend({ i: S.i, phase: "ready", sp: sp, sec: 3, done: L.done, pd: 1, nx: "resp" });
      }
    } else if (a === "lprep") { liveSend({ i: S.i, phase: "ready", sp: null, sec: 3, done: L.done, pd: 0, nx: "prep" }); }
    else if (a === "lspeak") {   /* nói luôn (bỏ qua chuẩn bị chung nếu chưa làm) */
      var sp2 = pickOf(plist().filter(function (p) { return !L.done[p.id]; })); if (!sp2) return true;
      liveSend({ i: S.i, phase: "ready", sp: { id: sp2.id, name: sp2.name, avatar: sp2.avatar }, sec: 3, done: L.done, pd: 1, nx: "resp" });
    } else if (a === "lpick") { L.pick = v; if (S.kind === "speaking" && (L.pd || shortPrep()) && !L.sp && (L.phase === "idle" || L.phase === "show")) return liveAct("lstart"); liveRender(); }   /* cả phòng đã chuẩn bị xong -> chạm tên là người đó vào nói luôn (3-2-1 rồi nói) */
    else if (a === "lall") liveSend(needPrep() ? { i: S.i, phase: "ready", sp: null, sec: 3, done: L.done, pd: 0, nx: "prep+all" } : { i: S.i, phase: "ready", sp: null, sec: 3, done: L.done, pd: 1, nx: "resp" });
    else if (a === "lskip") { L.adv = 1; liveNext(); }
    else if (a === "lstop") { L.adv = 1; liveNext(); }
    else if (a === "lend") liveSend({ i: S.i, phase: "end", done: {} });
    else if (a === "hdo") { toParent({ type: "sw-do", a: v }); }
    else if (a === "hclose") { var hm0 = $(".hmore"); if (hm0) { hm0.classList.remove("open"); hm0.classList.add("shut"); setTimeout(function () { hm0.classList.remove("shut"); }, 600); var ae = document.activeElement; if (ae && ae.blur) ae.blur(); } }
    else if (a === "hmore") { var hm = $(".hmore"); if (hm) hm.classList.toggle("open"); }
    else if (a === "lprev") { if (S.i > 0) { liveSend({ i: S.i - 1, phase: "show", sp: null, done: {}, sec: 0, pd: 0 }); toParent({ type: "sw-hello", kind: S.kind }); } }
    else if (a === "lnext") {
      if (S.i >= S.tasks.length - 1) liveSend({ i: S.i, phase: "end", done: {} });
      else { liveSend({ i: S.i + 1, phase: "show", sp: null, done: {}, sec: 0, pd: 0 }); toParent({ type: "sw-hello", kind: S.kind }); }
    } else return false;
    return true;
  }
  function importFile() {
    var f = this.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { var d = JSON.parse(r.result); if (!d.speaking && !d.writing) throw 0; localStorage.setItem(EXTRA, JSON.stringify(d)); toast("Đã nạp đề — tải lại trang để thấy"); setTimeout(function () { location.reload(); }, 900); } catch (e) { toast("File không đúng định dạng"); } };
    r.readAsText(f);
  }
  function dots() { return '<span class="dots">' + S.tasks.map(function (t, i) { return "<i class=\"" + (i < S.i || (S.results[t.q] && i !== S.i) ? "d" : i === S.i ? "c" : "") + '"></i>'; }).join("") + "</span>"; }
  function task() {
    setOne(S.phase === "read" || S.phase === "prep" || S.phase === "resp");   /* như lớp: đang đếm giờ/nói/viết -> vừa 1 màn hình */
    var t = curTask(), set = curSet(), tm = TMT(S.kind)[t.q] || [0, 60], lab = { read_aloud: "Đọc to", describe: "Tả ảnh", respond: "Trả lời câu hỏi", info: "Dựa vào thông tin", solution: "Đề xuất giải pháp", opinion: "Nêu ý kiến", sentence: "Viết câu theo ảnh", email: "Trả lời email", essay: "Bài luận ý kiến", cue: "Part 2 · Thẻ nói", task1: "Task 1 · Mô tả biểu đồ", task2: "Task 2 · Bài luận" }[t.type] || "";
    var h = '<div class="top"><button class="soft" data-act="quit" title="Thoát">✕</button><div class="t"><b>Câu ' + t.q + "</b> · " + esc(lab) + '</div>' + dots() + "</div>";
    if (S.phase === "grading") { h += '<div class="card" style="text-align:center"><p><span class="spin"></span> AI đang chấm…</p><p class="sub">Thường mất 5–15 giây.</p></div>'; app.innerHTML = h; return; }
    if (S.phase === "result") return result(h + (t.image ? '<div class="card">' + promptHtml(t) + "</div>" : ""), t);   /* kết quả vẫn hiện ảnh đề để đối chiếu */
    h += '<div class="card">' + promptHtml(t) + "</div>";
    if (S.phase === "intro") {
      h += '<div class="card"><p class="sub">' + intro(t, tm) + '</p><button class="pri big" data-act="go" style="width:100%;margin-top:6px">' + (S.kind === "speaking" ? "▶ Bắt đầu" : "▶ Bắt đầu viết") + '</button><div class="row" style="justify-content:space-between;margin-top:8px">' + (S.i > 0 ? '<button class="soft" data-act="skipq" data-v="-1">‹ Câu trước</button>' : "<span></span>") + '<button class="soft" data-act="skipq" data-v="1">' + (S.i >= S.tasks.length - 1 ? "Kết thúc ›" : "Bỏ qua câu này ›") + "</button></div></div>";
    } else {
      var ph = S.phase, badge = ph === "read" ? "Đọc thông tin" : ph === "prep" ? "Chuẩn bị" : "Đang " + (S.kind === "speaking" ? "nói" : "viết");
      h += '<div class="card"><div class="row"><span class="badge ' + (ph === "resp" ? "resp" : "prep") + '">' + badge + '</span></div><div class="timer ' + (ph === "resp" ? "resp" : "prep") + '" id="tm">0:00</div><div class="bar ' + (ph === "resp" ? "resp" : "") + '"><i id="pg"></i></div>';
      if (ph === "resp" && S.kind === "speaking") h += '<div class="live" id="live"><i>🎤 Hãy nói… lời bạn nói sẽ hiện ở đây</i></div>' + (SR || MOCK ? "" : '<textarea id="manual" placeholder="Trình duyệt không nhận giọng: gõ lại điều bạn đã nói…"></textarea>');
      if (ph === "resp" && S.kind === "writing") h += '<textarea id="ans" placeholder="Gõ bài viết của bạn ở đây…" autofocus>' + esc(S.text || "") + '</textarea><p class="sub" id="wc">0 từ</p>';
      h += "</div>";
      h += '<div class="bottom"><div class="in">' + (ph === "resp" ? '<button class="' + (S.kind === "speaking" ? "rec" : "pri") + ' big" data-act="stop">' + (S.kind === "speaking" ? "⏹ Xong, nộp bài" : "✔ Nộp bài") + "</button>" : '<button class="big" data-act="skipprep">Bắt đầu nói ngay ▶</button>') + "</div></div>";
    }
    app.innerHTML = h; dockLive(); fitPrompt(); updTimer();
    if (S.phase === "resp" && S.kind === "writing") { var a = $("#ans"); a.oninput = function () { S.text = a.value; $("#wc").textContent = nWords(a.value) + " từ" + (fmtN() === 3 ? " (mục tiêu ≥ " + (S.tasks[S.i].min || 150) + ")" : S.tasks[S.i].q === 8 ? " (mục tiêu ≥ 300)" : ""); }; a.dispatchEvent(new Event("input")); try { a.focus(); } catch (e) {} }
    if (S.phase === "resp" && S.kind === "speaking") { liveUpd(); var m = $("#manual"); if (m) m.oninput = function () { S.tr = m.value; }; }
  }
  function imgHtml(t) {   /* ảnh đề + dòng ghi nguồn nhỏ (ảnh tự do trên Wikimedia Commons) */
    return '<img src="' + esc(t.image) + '" alt="" style="max-width:100%;max-height:min(420px,38vh);object-fit:contain;border-radius:10px;display:block;margin:0 auto">' + (t.credit ? '<div class="sub" style="font-size:11px;text-align:center;margin-top:4px">' + esc(t.credit) + "</div>" : "");
  }
  function promptHtml(t) {
    var h = "";
    if (t.type === "read_aloud") h += '<div class="prompt read">' + esc(t.text) + "</div>";
    else if (t.type === "describe") h += (t.image ? imgHtml(t) : "") + (!t.image && t.scene ? '<p class="sub">📷 Chưa có ảnh thật — đọc mô tả cảnh rồi tả lại bằng lời của bạn:</p><p class="prompt">' + esc(t.scene) + "</p>" : "");
    else if (t.type === "respond") h += (t.scenario ? '<p class="sub">' + esc(t.scenario) + "</p>" : "") + '<div class="prompt">❓ ' + esc(t.question) + "</div>";
    else if (t.type === "info") { var inf = (S.tasks.filter(function (x) { return x.info; })[0] || {}).info; if (inf) h += '<p><b>' + esc(inf.title || "") + '</b></p><table class="tbl">' + inf.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return (i === 0 ? "<th>" : "<td>") + esc(c) + (i === 0 ? "</th>" : "</td>"); }).join("") + "</tr>"; }).join("") + "</table>"; if (S.phase !== "read") h += '<div class="prompt">❓ ' + esc(t.question) + "</div>"; }
    else if (t.type === "solution") h += '<p class="sub">Nghe tin nhắn rồi đề xuất giải pháp:</p><div class="prompt">🔊 ' + esc(t.message) + '</div><button class="soft" data-act="say" data-v="' + esc(t.message) + '">🔊 Nghe lại</button>';
    else if (t.type === "cue") h += '<p class="sub">IELTS Speaking Part 2 · chuẩn bị 1 phút, nói tới 2 phút</p><div class="prompt cue"><b>' + esc(t.cue) + '</b><div class="sub" style="margin:8px 0 2px">You should say:</div><ul>' + (t.bullets || []).map(function (b, i) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div>";
    else if (t.type === "opinion") h += '<div class="prompt">❓ ' + esc(t.question) + "</div>";
    else if (t.type === "sentence") h += '<div class="wordrow"><span class="sub">Viết 1 câu dùng cả 2 từ:</span>' + t.words.map(function (w) { return '<span class="wchip">' + esc(w) + "</span>"; }).join('<span class="wplus">+</span>') + "</div>" + (t.image ? imgHtml(t) : '<p class="prompt">📷 <i>(Ảnh)</i> ' + esc(t.scene || "") + "</p>");
    else if (t.type === "email") { var e = t.email || {}; h += '<div class="mail"><div class="h">From: ' + esc(e.from) + "<br>To: " + esc(e.to) + "<br>Subject: " + esc(e.subject) + '</div><p class="prompt">' + esc(e.body) + '</p></div><p class="sub">' + esc(t.directions || "") + "</p>"; }
    else if (t.type === "task1") h += '<p class="sub">IELTS Writing Task 1 · viết ≥ ' + (t.min || 150) + ' từ (~20 phút)</p>' + imgHtml(t) + '<div class="prompt" style="margin-top:10px">' + esc(t.question) + "</div>";
    else if (t.type === "task2") h += '<p class="sub">IELTS Writing Task 2 · viết ≥ ' + (t.min || 250) + ' từ (~40 phút)</p><div class="prompt">' + esc(t.question) + "</div>";
    else if (t.type === "essay") h += '<div class="prompt">' + esc(t.question) + '</div><p class="sub">Viết bài luận nêu ý kiến, nêu lý do và ví dụ (≥ 300 từ).</p>';
    return h;
  }
  function intro(t, tm) {
    if (S.kind === "writing") return (fmtN() === 3 ? "Viết ít nhất <b>" + ((curTask() || {}).min || 150) + " từ</b>. " : "") + "Thời gian: <b>" + mmss(tm[1]) + "</b>. Hết giờ bài sẽ tự nộp.";
    var s = "Chuẩn bị <b>" + tm[0] + " giây</b>, rồi trả lời <b>" + tm[1] + " giây</b>. Bấm Bắt đầu để tính giờ.";
    if (t.type === "info" && t.info) s = "Đọc bảng thông tin <b>45 giây</b> trước, rồi lần lượt trả lời 3 câu (15s, 15s, 30s). " + s;
    return s;
  }

  /* ---------- đồng hồ ---------- */
  function startTimer(sec, onEnd) { clearTimer(); S.tTotal = sec * SCALE; S.tEnd = Date.now() + S.tTotal * 1000; S.onEnd = onEnd; timerId = setInterval(function () { updTimer(); if (Date.now() >= S.tEnd) { var f = S.onEnd; clearTimer(); if (f) f(); } }, 200); updTimer(); }
  function clearTimer() { if (timerId) clearInterval(timerId); timerId = 0; }
  function updTimer() { var el = $("#tm"); if (!el || !S.tEnd) return; var left = Math.max(0, (S.tEnd - Date.now()) / 1000); el.textContent = mmss(MOCK ? left / SCALE : left); var pg = $("#pg"); if (pg) pg.style.width = Math.min(100, 100 * (1 - left / Math.max(.001, S.tTotal))) + "%"; }
  function beep(f) { try { var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = f || 880; o.connect(g); g.connect(c.destination); g.gain.value = .15; o.start(); setTimeout(function () { o.stop(); c.close(); }, 220); } catch (e) {} }
  function say(text, rate) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = rate || .95; speechSynthesis.speak(u); } catch (e) {} }

  /* ===== 🎯 LUYỆN TỪNG CHỮ (TJ 2026-10-15: "từng từ luyện lại giống Elsa", gói MIỄN PHÍ) =====
     Giọng máy đọc mẫu (thường / chậm) + nhận giọng của trình duyệt để kiểm lại: chữ đúng -> chuyển xanh. Mặc định luyện CỤM 3 chữ quanh chữ đó
     (nhận 1 chữ lẻ hay sai); chỉ biết KHỚP CHỮ, chưa chấm từng âm như ELSA. Không có nhận giọng -> nghe mẫu + tự bấm "đọc được rồi". */
  /* ===== 🎯 LUYỆN CẢ BÀI (TJ 2026-10-15) — theo cách ELSA / Read Along / shadowing:
     ① 👂 Nghe mẫu cả đoạn, chữ chạy theo giọng (thường / chậm)  ② 🎤 Đọc cả bài: tô màu TRỰC TIẾP (xanh đúng · đỏ sai · vàng sót) + tự cuộn  ③ chấm % + so với lần trước + nút luyện các chữ sai.
     Đây là chế độ LUYỆN (khác lúc thi: lúc thi không tô màu). Không ảnh hưởng điểm bài thi. */
  var PR = null;
  function prWords(text) { var k = 0, off = []; String(text).split(/(\s+)/).reduce(function (pos, tok) { if (tok && !/^\s+$/.test(tok) && normW(tok)) off.push(pos); return pos + tok.length; }, 0); return off; }
  function prHtml(text) { var k = 0; return String(text).split(/(\s+)/).map(function (tok) { if (!tok) return ""; if (/^\s+$/.test(tok)) return tok; if (!normW(tok)) return esc(tok); return '<span class="lw" data-k="' + (k++) + '">' + esc(tok) + "</span>"; }).join(""); }
  function prStop() { try { clearTimeout(PR && PR.tm); clearInterval(PR && PR.iv); if (PR && PR.rec) { PR.rec.onend = null; PR.rec.stop(); } } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} if (PR) { PR.rec = null; PR.recOn = false; } }
  function prClose() { prStop(); PR = null; var el = document.getElementById("practice"); if (el) el.parentNode.removeChild(el); }
  function prSpans() { return document.querySelectorAll("#pr-text .lw"); }
  function prMark(upTo, cls) { var sp = prSpans(); for (var i = 0; i < sp.length; i++) { var c = "lw" + (i < upTo ? " lw-said" : i === upTo ? " lw-cur" : ""); if (sp[i].className !== c) sp[i].className = c; } prScroll(upTo); }
  function prScroll(i) { var box = document.getElementById("pr-text"), sp = prSpans()[i]; if (!box || !sp) return; var cr = box.getBoundingClientRect(), r = sp.getBoundingClientRect(); if (r.bottom > cr.bottom - 20 || r.top < cr.top + 10) box.scrollTop += r.top - cr.top - box.clientHeight * 0.3; }
  function prOpen() {
    var t = S.prT; if (!t || !t.text) return; stopSpeech && stopSpeech();
    var key = (S.setId || "") + ":" + t.q, hist = ((ST.pr || {})[key] || []);
    PR = { text: t.text, off: prWords(t.text), key: key, hist: hist, state: "idle", tr: "", interim: "" };
    var el = document.getElementById("practice"); if (!el) { el = document.createElement("div"); el.id = "practice"; el.className = "drill"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Luyện cả bài"); document.body.appendChild(el); }
    var best = hist.reduce(function (m, h) { return Math.max(m, h.pct); }, 0);
    el.innerHTML = '<div class="dr-card pr-card"><div class="dr-top"><b>🎯 Luyện cả bài</b><span class="sub" id="pr-best">' + (hist.length ? "Tốt nhất " + Math.round(best * 100) + "% · " + hist.length + " lần" : "") + '</span><button class="soft" data-act="pr-close" aria-label="Đóng">✕</button></div>' +
      '<div class="pr-text prompt read" id="pr-text">' + prHtml(t.text) + '</div>' +
      '<div class="dr-row"><button type="button" data-act="pr-listen" data-v="1">👂 Nghe mẫu</button><button type="button" data-act="pr-listen" data-v=".6">🐢 Nghe chậm</button></div>' +
      (SR ? '<button type="button" class="rec big" id="pr-mic" data-act="pr-mic">🎤 Đọc cả bài</button>' : '<p class="sub">Máy này chưa hỗ trợ nhận giọng: bạn vẫn nghe mẫu và đọc theo được.</p>') +
      '<div id="pr-res"></div><p class="sub" id="pr-hint">Gợi ý: 👂 nghe mẫu trước, rồi đọc theo giọng mẫu, rồi 🎤 đọc cả bài để xem chữ nào xanh/đỏ.</p></div>';
  }
  function prListen(rate) {
    if (!PR) return; prStop(); PR.state = "play"; prMark(-1);
    var u = new SpeechSynthesisUtterance(PR.text); u.lang = "en-US"; u.rate = rate; var got = false, n = PR.off.length;
    u.onboundary = function (ev) { if (typeof ev.charIndex !== "number") return; got = true; var k = 0; for (var i = 0; i < PR.off.length; i++) if (PR.off[i] <= ev.charIndex) k = i; prMark(k); };
    u.onend = function () { if (PR) { clearInterval(PR.iv); PR.state = "idle"; prMark(n); } };
    try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { return; }
    PR.tm = setTimeout(function () { if (!PR || got || PR.state !== "play") return; var per = (60 / (150 * rate)) * 1000, k = 0; PR.iv = setInterval(function () { if (!PR || PR.state !== "play") return clearInterval(PR && PR.iv); prMark(k++); if (k >= n) clearInterval(PR.iv); }, per); }, 1300);   /* máy không báo biên chữ -> chạy ước lượng theo tốc độ */
  }
  function prColor() {
    var tr = ((PR.tr || "") + " " + (PR.interim || "")).trim(); if (!tr) return;
    var cls = liveCls(gradeRead(PR.text, tr)), sp = prSpans(), cur = 0;
    for (var i = 0; i < sp.length; i++) { var c = "lw" + (cls[i] ? " lw-" + cls[i] : ""); if (sp[i].className !== c) sp[i].className = c; if (cls[i] === "cur") cur = i; }
    prScroll(cur);
  }
  function prMic() {
    if (!PR || !SR) return; var btn = document.getElementById("pr-mic");
    if (PR.recOn) { prFinish(); return; }
    prStop(); PR.tr = ""; PR.interim = ""; PR.state = "rec"; PR.recOn = true; prMark(-1); document.getElementById("pr-res").innerHTML = ""; if (btn) btn.textContent = "⏹ Xong";
    var rec = new SR(); PR.rec = rec; rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = function (e) { if (!PR) return; var ip = ""; for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) PR.tr = (PR.tr + " " + r[0].transcript).trim(); else ip += r[0].transcript; } PR.interim = ip; prColor(); };
    rec.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) { PR.recOn = false; toast("Chưa cho dùng micro — bấm ổ khoá cạnh thanh địa chỉ để cho phép"); if (btn) btn.textContent = "🎤 Đọc cả bài"; } };
    rec.onend = function () { if (PR && PR.recOn) { try { rec.start(); } catch (e) {} } };
    try { rec.start(); } catch (e) { PR.recOn = false; toast("Không mở được nhận giọng"); if (btn) btn.textContent = "🎤 Đọc cả bài"; }
  }
  function prFinish() {
    if (!PR) return; var tr = ((PR.tr || "") + " " + (PR.interim || "")).trim(); prStop(); PR.state = "done"; var btn = document.getElementById("pr-mic"); if (btn) btn.textContent = "🔁 Đọc lại";
    var g = gradeRead(PR.text, tr), pct = g.pct, prev = PR.hist.length ? PR.hist[PR.hist.length - 1].pct : null, best = PR.hist.reduce(function (m, h) { return Math.max(m, h.pct); }, 0);
    PR.g = g; var bad = g.st.filter(function (s) { return s !== "ok"; }).length;
    ST.pr = ST.pr || {}; (ST.pr[PR.key] = ST.pr[PR.key] || []).push({ ts: Date.now(), pct: pct }); if (ST.pr[PR.key].length > 30) ST.pr[PR.key].shift(); save(); PR.hist = ST.pr[PR.key];
    var cmp = prev == null ? "Lần đầu luyện bài này 👍" : (pct > prev ? "▲ Tăng " + Math.round((pct - prev) * 100) + "% so với lần trước (" + Math.round(prev * 100) + "%)" : pct < prev ? "▼ Thấp hơn lần trước (" + Math.round(prev * 100) + "%) — thử lại nhé" : "= Bằng lần trước") + (pct > best && prev != null ? " · 🏆 kỷ lục mới!" : "");
    document.getElementById("pr-res").innerHTML = '<div class="dr-fb ' + (pct >= .9 ? "good" : "bad") + '"><b>' + Math.round(pct * 100) + "% khớp bài</b> · " + bad + " chữ chưa đúng<br>" + esc(cmp) + "</div>" + (bad ? '<div class="dr-row"><button type="button" class="pri" data-act="pr-words">🎯 Luyện ' + bad + " chữ chưa đúng</button></div>" : "");
    var bs = document.getElementById("pr-best"); if (bs) bs.textContent = "Tốt nhất " + Math.round(Math.max(best, pct) * 100) + "% · " + PR.hist.length + " lần";
  }
  function practiceAct(a, v) {
    if (a === "pr-open") prOpen(); else if (!PR) return;
    else if (a === "pr-close") prClose();
    else if (a === "pr-listen") prListen(+v || 1);
    else if (a === "pr-mic") prMic();
    else if (a === "pr-words") { var g = PR.g; prClose(); if (g) { S.rd = g; drOpen(); } }
  }
  var DR = null;
  function drBad() { var o = []; if (S.rd) S.rd.st.forEach(function (s, i) { if (s !== "ok") o.push(i); }); return o; }
  function drText(i) { var W = S.rd.words; if (DR.mode === "word") return { text: W[i], at: 0, a: i }; var a = Math.max(0, i - 1), b = Math.min(W.length - 1, i + 1); return { text: W.slice(a, b + 1).join(" "), at: i - a, a: a }; }
  function drCheck(alts) {
    var i = DR.list[DR.pos], tg = drText(i), ok = false;
    alts.forEach(function (tr) {
      if (DR.mode === "word") { var tw = normW(S.rd.words[i]); String(tr).split(/\s+/).forEach(function (x) { if (same(tw, x)) ok = true; }); }
      else { var g = gradeRead(tg.text, tr); if (g.st[tg.at] === "ok") ok = true; }
    });
    return ok;
  }
  function drSync(i) {   /* chữ vừa đúng: tô xanh ngay trong kết quả + cập nhật nút đếm */
    var el = document.querySelector('#app .prompt.read [data-i="' + i + '"]');
    if (el) { el.className = "w-ok tapw"; el.setAttribute("data-act", "say"); el.title = "Chạm để nghe đọc mẫu"; }
    var n = drBad().length, bt = document.getElementById("dr-open-btn");
    if (bt) { if (n) bt.textContent = "🎯 Luyện " + n + " chữ chưa đúng"; else bt.parentNode.removeChild(bt); }
  }
  function drStop() { try { clearTimeout(DR && DR.tm); if (DR && DR.rec) { DR.rec.onend = null; DR.rec.stop(); } } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} }
  function drClose() { drStop(); DR = null; var el = document.getElementById("drill"); if (el) el.parentNode.removeChild(el); }
  function drOpen(startAt) {
    if (!S.rd) return; var list = drBad(); if (!list.length) { toast("Không còn chữ nào cần luyện 🎉"); return; }
    stopSpeech && stopSpeech();
    DR = { list: list, pos: Math.max(0, list.indexOf(startAt)), mode: "chunk", tries: 0, state: "idle", heard: "", okN: 0, nothing: false };
    if (!document.getElementById("drill")) { var d = document.createElement("div"); d.id = "drill"; d.className = "drill"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Luyện từng chữ"); document.body.appendChild(d); }
    drRender(); say(drText(DR.list[DR.pos]).text);
  }
  function drRender() {
    var el = document.getElementById("drill"); if (!el || !DR) return;
    if (DR.state === "done") { el.innerHTML = '<div class="dr-card"><div class="dr-top"><b>🎉 Xong rồi!</b><button class="soft" data-act="dr-close" aria-label="Đóng">✕</button></div><p class="dr-big">Đã luyện đúng ' + DR.okN + "/" + DR.list.length + ' chữ</p><p class="sub">Chữ nào còn đỏ/vàng thì chạm lại để luyện tiếp.</p><button type="button" class="pri big" data-act="dr-close">Đóng</button></div>'; return; }
    var i = DR.list[DR.pos], tg = drText(i), W = S.rd.words, ctx = tg.text.split(" ").map(function (w, k) { return k === tg.at ? '<b class="dr-hl">' + esc(w) + "</b>" : esc(w); }).join(" ");
    var ok = DR.state === "ok", fb = "";
    if (DR.state === "listening") fb = '<div class="dr-fb listen">🎤 Đang nghe… hãy đọc: <b>' + esc(tg.text) + "</b></div>";
    else if (ok) fb = '<div class="dr-fb good">✓ Chuẩn rồi!' + (DR.self ? " (bạn tự chấm)" : "") + "</div>";
    else if (DR.state === "fail") fb = '<div class="dr-fb bad">Máy nghe thành: “' + esc(DR.heard || "…") + '” — chưa khớp. Nghe mẫu rồi thử lại (lần ' + Math.min(DR.tries + 1, 3) + "/3)." + (DR.tries >= 3 ? " Thử 🐢 nghe chậm hoặc bấm “Bỏ qua”." : "") + "</div>";
    else if (DR.nothing) fb = '<div class="dr-fb bad">Chưa nghe thấy gì — bấm 🎤 rồi nói gần micro hơn.</div>';
    var last = DR.pos >= DR.list.length - 1;
    el.innerHTML = '<div class="dr-card"><div class="dr-top"><b>🎯 Luyện từng chữ</b><span class="sub">' + (DR.pos + 1) + "/" + DR.list.length + '</span><button class="soft" data-act="dr-close" aria-label="Đóng">✕</button></div>' +
      '<div class="dr-word">' + esc(W[i]) + '</div><div class="dr-ctx">' + ctx + "</div>" +
      '<div class="dr-row"><button type="button" data-act="dr-say">🔊 Nghe</button><button type="button" data-act="dr-slow">🐢 Nghe chậm</button></div>' +
      '<div class="dr-modes"><button type="button" class="' + (DR.mode === "chunk" ? "on" : "") + '" data-act="dr-mode" data-v="chunk">Cụm 3 chữ</button><button type="button" class="' + (DR.mode === "word" ? "on" : "") + '" data-act="dr-mode" data-v="word">Chỉ 1 chữ</button></div>' +
      (SR ? '<button type="button" class="rec big" data-act="dr-mic">' + (DR.state === "listening" ? "⏹ Dừng" : "🎤 Bấm rồi đọc") + "</button>" : '<p class="sub">Máy này chưa hỗ trợ nhận giọng: nghe mẫu, đọc to, rồi bấm “Đọc được rồi”.</p>') +
      fb + '<div class="dr-row"><button type="button" class="soft" data-act="dr-ok">✓ Đọc được rồi</button><button type="button" class="' + (ok ? "pri" : "soft") + '" data-act="dr-next">' + (ok ? (last ? "Hoàn tất" : "Chữ kế →") : (last ? "Bỏ qua · xong" : "Bỏ qua →")) + "</button></div></div>";
  }
  function drMark(self) { var i = DR.list[DR.pos]; if (S.rd.st[i] !== "ok") { S.rd.st[i] = "ok"; DR.okN++; drSync(i); } DR.state = "ok"; DR.self = !!self; DR.nothing = false; }
  function drMic() {
    if (!SR || !DR) return;
    if (DR.state === "listening") { try { DR.rec.stop(); } catch (e) {} return; }
    try { speechSynthesis.cancel(); } catch (e) {}
    DR.state = "listening"; DR.heard = ""; DR.nothing = false; DR.self = false; drRender();
    var got = false, rec = new SR(); DR.rec = rec; rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 3;
    rec.onresult = function (e) { got = true; var r0 = e.results[0], alts = []; for (var k = 0; k < r0.length; k++) alts.push(r0[k].transcript); DR.heard = alts[0] || ""; DR.tries++; if (drCheck(alts)) drMark(false); else DR.state = "fail"; drRender(); };
    rec.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) toast("Chưa cho dùng micro — bấm ổ khoá cạnh thanh địa chỉ để cho phép"); };
    rec.onend = function () { if (!got && DR && DR.state === "listening") { DR.state = "idle"; DR.nothing = true; drRender(); } };
    try { rec.start(); } catch (e) { DR.state = "idle"; drRender(); toast("Không mở được nhận giọng"); return; }
    clearTimeout(DR.tm); DR.tm = setTimeout(function () { try { rec.stop(); } catch (e) {} }, 7000);
  }
  function drNext() { drStop(); if (!DR) return; if (DR.pos >= DR.list.length - 1) { DR.state = "done"; drRender(); return; } DR.pos++; DR.tries = 0; DR.state = "idle"; DR.heard = ""; DR.nothing = false; DR.self = false; drRender(); say(drText(DR.list[DR.pos]).text); }
  function drillAct(a, v, b) {
    if (a === "dr-open") drOpen(); else if (a === "dr-word") drOpen(+b.dataset.i);
    else if (!DR) return;
    else if (a === "dr-close") drClose();
    else if (a === "dr-say") say(drText(DR.list[DR.pos]).text);
    else if (a === "dr-slow") say(drText(DR.list[DR.pos]).text, .55);
    else if (a === "dr-mode") { drStop(); DR.mode = v === "word" ? "word" : "chunk"; DR.tries = 0; DR.state = "idle"; DR.nothing = false; drRender(); }
    else if (a === "dr-mic") drMic();
    else if (a === "dr-ok") { drStop(); drMark(true); drRender(); }
    else if (a === "dr-next") drNext();
  }

  /* ---------- luồng 1 câu ---------- */
  function begin(kind, group) {
    var set = curSet(), g = GRP(kind).filter(function (x) { return x.k === group; })[0];
    S.kind = kind; S.group = group; S.gt = g.t; S.tasks = set.tasks.filter(function (t) { return g.qs.indexOf(t.q) >= 0 && (!S.qFrom || t.q >= S.qFrom) && (!S.qTo || t.q <= S.qTo) && (kind === "writing" || t.type !== "describe" || t.scene || t.image); });
    S.i = 0; S.results = {}; S.screen = "task"; question();
  }
  function question() { var t = curTask(); S.phase = "intro"; S.tr = ""; S.interim = ""; S.text = ""; render(); }
  function go() {
    var t = curTask(); stopSpeech();
    if (S.kind === "writing") return startResp();
    if (t.type === "info" && t.info && S.tasks.indexOf(t) === S.tasks.indexOf(S.tasks.filter(function (x) { return x.info; })[0])) { S.phase = "read"; render(); return startTimer(45, startPrep); }
    startPrep();
  }
  function startPrep() { var t = curTask(), tm = TMT(S.kind)[t.q]; S.phase = "prep"; render(); if (!MOCK) { if (t.type === "respond" || t.type === "info" || t.type === "opinion") say(t.question); else if (t.type === "solution") say(t.message); } startTimer(tm[0], startResp); }
  function startResp() {
    var t = curTask(), tm = TMT(S.kind)[t.q]; try { speechSynthesis.cancel(); } catch (e) {}
    if (S.kind === "speaking") beep(880); S.phase = "resp"; render();
    if (S.kind === "speaking") startSpeech(t);
    startTimer(tm[1], function () { finish(true); });
  }
  function finish() { clearTimer(); stopSpeech(); if (S.kind === "writing") { var a = $("#ans"); if (a) S.text = a.value; } else { var m = $("#manual"); if (m && m.value) S.tr = m.value; } if (S.kind === "speaking") beep(520); S.phase = "grading"; render(); grade(); }

  /* ---------- nhận giọng ---------- */
  /* 📜 PHỤ ĐỀ CHẠY (TJ 2026-10-15): chữ MỚI NÓI luôn hiện ở CUỐI khung, chữ cũ đẩy lên (kéo lên xem lại được, đang kéo thì không giật về cuối).
     🎯 Bài ĐỌC TO: so khớp NGAY trên đề — xanh = đúng, đỏ = sai, vàng = bỏ sót, gạch dưới = chữ kế tiếp; đề tự cuộn theo chỗ đang đọc (kiểu karaoke như ELSA / Read Along). */
  function liveUpd() {
    var el = $("#live"); if (!el) return;
    var stick = !el.dataset.init || (el.scrollHeight - el.scrollTop - el.clientHeight < 40); el.dataset.init = "1";
    var tx = (S.tr || "").trim(), ip = (S.interim || "").trim();
    el.innerHTML = '<div class="lv-in">' + (tx || ip ? esc(tx) + (ip ? " <i>" + esc(ip) + "</i>" : "") : "<i>🎤 Hãy nói… lời bạn nói sẽ hiện ở đây</i>") + "</div>";
    if (stick) el.scrollTop = el.scrollHeight;
    try { if (hlOn()) hlRead(); } catch (e) {}   /* TJ 2026-10-15: LÚC THI mặc định KHÔNG tô màu (thi thật không có phản hồi giữa chừng) — chỉ khi bấm nút tick 🎨 (nhớ theo máy) */
  }
  function hlRead() {
    var t = curTask(); if (!t || S.kind !== "speaking" || t.type !== "read_aloud") return;
    var p = document.querySelector("#app .prompt.read"); if (!p) return;
    if (p.dataset.wrapped !== String(t.text.length)) {   /* bọc từng chữ 1 lần (cùng cách tách với gradeRead) */
      var k = 0; p.innerHTML = String(t.text).split(/(\s+)/).map(function (tok) { if (!tok) return ""; if (/^\s+$/.test(tok)) return tok; if (!normW(tok)) return esc(tok); return '<span class="lw" data-k="' + (k++) + '">' + esc(tok) + "</span>"; }).join("");
      p.dataset.wrapped = String(t.text.length);
    }
    var tr = ((S.tr || "") + " " + (S.interim || "")).trim(), sp = p.querySelectorAll(".lw"), cls = tr ? liveCls(gradeRead(t.text, tr)) : [], cur = null;
    for (var i = 0; i < sp.length; i++) {
      var c = "lw" + (cls[i] ? " lw-" + cls[i] : ""); if (sp[i].className !== c) sp[i].className = c;
      if (cls[i] === "cur" || (!tr && i === 0)) cur = sp[i];
    }
    var card = p.closest(".card"); if (card && cur && card.scrollHeight > card.clientHeight + 4) {   /* tự cuộn riêng trong thẻ đề, giữ chữ đang đọc ở khoảng 1/3 */
      var cr = card.getBoundingClientRect(), r = cur.getBoundingClientRect();
      if (r.bottom > cr.bottom - 24 || r.top < cr.top + 12) card.scrollTop += r.top - cr.top - card.clientHeight * 0.33;
    }
  }
  function startSpeech(t) {
    S.tr = ""; S.interim = "";
    if (MOCK) { setTimeout(function () { S.tr = mockSpeech(t); liveUpd(); }, 400); return; }
    if (!SR) return;
    recOn = true; rec = new SR(); rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = function (e) { var interim = ""; for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) S.tr = (S.tr + " " + r[0].transcript).trim(); else interim += r[0].transcript; } S.interim = interim; liveUpd(); };
    rec.onerror = function (e) { if (e && e.error === "audio-capture" && RECD) recAudioStop();   /* mic bị tranh với ghi âm trên máy này -> bỏ ghi âm, giữ nhận giọng */
      if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) { recOn = false; toast("Chưa cho dùng micro — bấm ổ khoá cạnh thanh địa chỉ để cho phép"); } };
    rec.onend = function () { if (recOn) { try { rec.start(); } catch (e) {} } };
    try { rec.start(); } catch (e) { toast("Không mở được nhận giọng"); }
  }
  /* ghi âm lượt nói (MediaRecorder) để NGHE LẠI sau: lưu Supabase Storage (toeic/sw-audio/…) + đường dẫn trong sw_history.audio */
  /* 🎤 XIN QUYỀN MIC SỚM, NHẢ NGAY (TJ 2026-10-15: "mới vô bài speaking phải accept cái loa mất mấy giây"; và "chơi game xong không đọc đáp án"):
     hộp xin quyền hiện NGAY lần chạm đầu / lúc đếm 3-2-1, chứ không đợi tới lúc bắt đầu nói. Xin xong là DỪNG luồng ngay (quyền vẫn được nhớ cho cả phiên) — KHÔNG giữ micro mở:
     trên iPhone micro đang mở làm hệ thống chuyển sang chế độ thu âm và TẮT TIẾNG giọng đọc ở các thẻ khác (lỗi game không đọc đáp án). Tới lượt nói mới mở lại (không hỏi lại). */
  var MIC = { busy: null, sr: false, asked: false, ok: false };
  function primeMic() {
    if (MOCK || MIC.ok || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(null);
    if (!MIC.busy) MIC.busy = navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) { MIC.ok = true; MIC.busy = null; try { st.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} return true; }).catch(function () { MIC.busy = null; return null; });
    if (SR && !MIC.sr) { MIC.sr = true; try { var pr = new SR(); pr.lang = "en-US"; pr.onerror = pr.onend = function () {}; pr.start(); setTimeout(function () { try { pr.abort(); } catch (e) {} }, 700); } catch (e) {} }
    return MIC.busy;
  }
  function micRelease() { MIC.asked = false; }   /* không còn luồng nào để nhả; chỉ cho phép "mồi" lại lần sau */
  var RECD = null;
  function recAudioStart() {
    RECD = null;
    if (MOCK || !window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    var r = RECD = { stopped: false, chunks: [], blob: null, done: false, cbs: [], mr: null };
    function done(blob) { r.blob = blob; r.done = true; var cbs = r.cbs; r.cbs = []; cbs.forEach(function (cb) { cb(blob); }); }
    r.fin = done;
    var rel = function (st) { st.getTracks().forEach(function (t) { t.stop(); }); };
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
      if (r.stopped) { rel(st); return done(null); }
      var mr; try { mr = new MediaRecorder(st); } catch (e) { rel(st); return done(null); }
      r.mr = mr; mr.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
      mr.onstop = function () { rel(st); done(r.chunks.length ? new Blob(r.chunks, { type: mr.mimeType || "audio/webm" }) : null); };
      try { mr.start(1000); } catch (e) { done(null); }
    }).catch(function () { done(null); });
  }
  function recAudioStop() {
    var r = RECD; RECD = null; if (!r) return Promise.resolve(null);
    return new Promise(function (res) {
      if (r.done) return res(r.blob);
      r.cbs.push(res); r.stopped = true;
      try { if (r.mr && r.mr.state !== "inactive") r.mr.stop(); else if (!r.mr) setTimeout(function () { if (!r.done) r.fin(null); }, 4000); } catch (e) { r.fin(null); }
    });
  }
  function uploadAudio(r, blob) {
    var me = CTX.me; if (!me || !me.id || !blob || blob.size < 3000) return;
    var base = String(CFG.SUPABASE_URL || "").replace(/\/$/, ""), key = CFG.SUPABASE_ANON_KEY, mime = (blob.type || "audio/webm").split(";")[0], ext = /mp4|aac|m4a/.test(mime) ? "mp4" : /ogg/.test(mime) ? "ogg" : "webm";
    var path = "sw-audio/" + me.id + "/" + r.ts + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    fetch(base + "/storage/v1/object/toeic/" + path, { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": mime, "x-upsert": "true" }, body: blob }).then(function (res) {
      if (!res.ok) throw new Error("upload " + res.status);
      r.audio = base + "/storage/v1/object/public/toeic/" + path; save();
      var patch = function () { return sbRest("sw_history?player_id=eq." + encodeURIComponent(me.id) + "&ts=eq." + r.ts, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ audio: r.audio }) }); };
      setTimeout(function () { patch().catch(function () {}); }, 5000);   /* dòng lịch sử có thể chưa kịp tạo lúc này -> gắn lại lần nữa sau 5s */
      return patch();
    }).catch(function (e) { console.warn("ghi âm:", e && e.message || e); });
  }
  function stopSpeech() { recOn = false; try { if (rec) rec.stop(); } catch (e) {} rec = null; S.interim = ""; }
  function mockSpeech(t) {
    var src = t.type === "read_aloud" ? t.text : ((curSet().models || {})[t.q] || "This is a sample answer for the question.");
    var w = src.split(/\s+/); if (t.type === "read_aloud") w.splice(Math.floor(w.length / 2), 1);   /* bỏ 1 chữ giữa bài để thử tô màu */
    return w.join(" ");
  }

  /* ---------- chấm điểm ---------- */
  function normW(w) { return String(w || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]/g, ""); }
  function lev(a, b) { var m = a.length, n = b.length, d = [], i, j; if (!m) return n; if (!n) return m; for (j = 0; j <= n; j++) d[j] = j; for (i = 1; i <= m; i++) { var p = d[0]; d[0] = i; for (j = 1; j <= n; j++) { var t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[n]; }
  function same(a, b) { a = normW(a); b = normW(b); if (!a || !b) return false; if (a === b) return true; if (a.length <= 3 || b.length <= 3) return false; return lev(a, b) <= (a.length >= 8 ? 2 : 1); }
  /* 🧭 ĐỐI CHIẾU LỜI NÓI VỚI ĐỀ (TJ 2026-10-15: "chữ chạy trước giọng nói khá xa"):
     cách cũ đi THAM LAM từng chữ (nhìn trước 3 chữ) nên chữ "the/and/to" nói lặp hoặc 1 chữ nhận sai là con trỏ nhảy vọt về trước; cứ mỗi chữ rác lại đẩy con trỏ thêm 1.
     Cách mới = CĂN CHỈNH TỐI ƯU (Wagner–Fischer, như cách đo WER/ASR dùng): tìm cách ghép ÍT LỖI NHẤT giữa lời nói và đề, kết thúc đề "miễn phí" (chưa đọc tới đâu không bị phạt);
     con trỏ chỉ đi theo chữ KHỚP thật, chữ rác/nhận sai không đẩy con trỏ. Mô phỏng 1300 lần nhận giọng nhiễu: chạy trước giọng ≥4 chữ giảm từ 10,2% xuống 1,5%. */
  var _smc = {}, _smn = 0;
  function sameC(a, b) { if (!a || !b) return false; if (a === b) return true; if (a.length <= 3 || b.length <= 3) return false; var k = a + "|" + b, v = _smc[k]; if (v === undefined) { if (++_smn > 30000) { _smc = {}; _smn = 0; } v = _smc[k] = lev(a, b) <= (a.length >= 8 ? 2 : 1); } return v; }
  function alignRead(P, S) {   /* P, S: mảng chữ đã chuẩn hoá -> st[]: ok (khớp) · bad (nói sai chữ này) · miss (bỏ sót / chưa tới) */
    var n = P.length, m = S.length, D = [], c = [], i, j;
    for (j = 0; j <= n; j++) { D[j] = new Array(m + 1); D[j][0] = j; } for (i = 0; i <= m; i++) D[0][i] = i;
    for (j = 1; j <= n; j++) { c[j] = []; for (i = 1; i <= m; i++) { c[j][i] = sameC(P[j - 1], S[i - 1]) ? 0 : 1; D[j][i] = Math.min(D[j - 1][i - 1] + c[j][i], D[j - 1][i] + 1, D[j][i - 1] + 1); } }
    var js = 0; for (j = 0; j <= n; j++) if (D[j][m] < D[js][m]) js = j;   /* đề dài hơn lời nói: phần đề chưa tới KHÔNG bị tính lỗi */
    var st = P.map(function () { return "miss"; }); j = js; i = m;
    while (j > 0 && i > 0) { if (D[j][i] === D[j - 1][i - 1] + c[j][i]) { st[j - 1] = c[j][i] ? "bad" : "ok"; j--; i--; } else if (D[j][i] === D[j - 1][i] + 1) { st[j - 1] = "miss"; j--; } else i--; }
    return st;
  }
  function gradeRead(text, tr) {
    var T = text.split(/\s+/).filter(normW), Sx = String(tr || "").split(/\s+/).filter(normW);
    var st = alignRead(T.map(normW), Sx.map(normW));
    var ok = st.filter(function (x) { return x === "ok"; }).length, pct = T.length ? ok / T.length : 0;
    return { score: pct >= .9 ? 3 : pct >= .72 ? 2 : pct >= .45 ? 1 : 0, pct: pct, words: T, st: st };
  }
  /* màu khi đang đọc (luyện / bật 🎨): chỉ chữ KHỚP mới xanh; chữ bỏ sót / sai chỉ hiện đỏ-vàng khi con trỏ đã đi qua >= 3 chữ (đủ chắc, tránh nhấp nháy theo bản nhận giọng tạm); gạch dưới = chữ kế tiếp */
  function liveCls(g) { var last = -1; g.st.forEach(function (s, i) { if (s === "ok") last = i; }); return g.st.map(function (s, i) { if (i > last) return i === last + 1 ? "cur" : ""; if (s === "ok") return "ok"; return last - i >= 3 ? (s === "bad" ? "bad" : "skip") : ""; }); }
  var SP_RUBRIC = {
    describe: "Tả ảnh (0-3): đúng nội dung ảnh/đủ chi tiết, ngữ pháp, từ vựng, mạch lạc/trôi chảy.",
    respond: "Trả lời câu hỏi (0-3): đúng trọng tâm, đủ ý, ngữ pháp, từ vựng, mạch lạc.",
    info: "Trả lời dựa vào bảng thông tin (0-3): thông tin ĐÚNG so với bảng, đủ ý, ngữ pháp, mạch lạc.",
    solution: "Đề xuất giải pháp (0-5): nêu lại vấn đề + xin lỗi/đồng cảm, đề xuất giải pháp cụ thể, thông tin hợp lý, tổ chức ý, ngữ pháp, từ vựng.",
    opinion: "Nêu ý kiến (0-5): nêu rõ quan điểm, lý do + ví dụ, tổ chức ý, từ nối, ngữ pháp, từ vựng."
  };
  async function ai(sys, user) {
    var url = String(CFG.SUPABASE_URL || "").replace(/\/$/, "") + "/functions/v1/gemini-proxy", last = null, models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"];
    for (var k = 0; k < models.length; k++) {
      for (var a = 0; a < 2; a++) {
        try {
          var r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY, apikey: CFG.SUPABASE_ANON_KEY }, body: JSON.stringify({ model: models[k], sys: sys, user: user, user_id: null, block_id: null }) });
          if (r.status === 429 || r.status === 503) { last = new Error("busy " + r.status); await new Promise(function (z) { setTimeout(z, 1500 * (a + 1)); }); continue; }
          var d = await r.json(), tx = d.candidates && d.candidates[0].content.parts[0].text, m = tx && tx.match(/\{[\s\S]*\}/);
          if (m) return JSON.parse(m[0]);
          last = new Error("empty");
        } catch (e) { last = e; }
      }
    }
    throw last || new Error("AI lỗi");
  }
  /* AI đôi khi trả mỗi ý là 1 đối tượng {issue, fix…} thay vì chuỗi -> hiện "[object Object]". Chuẩn hoá về chuỗi. */
  function fbText(x) {
    if (x == null) return ""; if (typeof x === "string") return x; if (typeof x !== "object") return String(x);
    var main = x.fix || x.text || x.suggestion || x.correction || x.issue || x.error || x.point || x.tip || x.comment, why = x.reason || x.explanation || x.why || x.detail;
    if (main) return String(main) + (why ? " — " + why : "");
    return Object.keys(x).map(function (k) { return x[k]; }).filter(function (v) { return typeof v === "string"; }).join(" — ");
  }
  async function grade(aP) {
    var t = curTask(), q = t.q, max = MXS(S.kind)[q], res = { q: q, max: max }, ans = S.kind === "writing" ? (S.text || "") : (S.tr || "");
    try {
      if (S.kind === "speaking" && t.type === "read_aloud") {
        var g = gradeRead(t.text, ans); res.score = g.score; res.read = g; res.fb = { strengths: [], fixes: ["Điểm đọc to ở đây ước tính theo độ khớp chữ nhận được (" + Math.round(g.pct * 100) + "%). Phát âm/ngữ điệu thật chưa chấm được."] };
        if (g.pct < .9) res.fb.fixes.push("Đọc chậm, rõ từng chữ; nhấn từ nội dung; ngắt nghỉ ở dấu câu. Chạm vào chữ đỏ/vàng để nghe đọc mẫu rồi nói lại.");
        else res.fb.strengths.push("Đọc khớp bài rất tốt.");
      } else if (nWords(ans) < (S.kind === "speaking" ? 3 : 2)) {
        res.score = 0; res.fb = { strengths: [], fixes: [S.kind === "speaking" ? "Không nghe được lời nói (hoặc quá ngắn). Kiểm tra micro/quyền truy cập, nói to và rõ hơn." : "Bài viết trống hoặc quá ngắn."] };
      } else {
        var out = await ai(sysPrompt(), userPrompt(t, ans)); res.score = Math.max(0, Math.min(max, Math.round(+out.score || 0))); out.strengths = (out.strengths || []).map(fbText); out.fixes = (out.fixes || []).map(fbText); res.fb = out; res.words = nWords(ans);
      }
    } catch (e) { res.err = String(e.message || e); res.score = null; }
    res.ans = ans; S.results[q] = res; if (res.score != null) saveRev(t, res, aP); classReport(res); if (LIVE && LIVE.myQ === q) LIVE.my = "result"; S.phase = "result"; render();
  }
  function sysPrompt() {
    if (fmtN() === 3 && S.kind === "writing") return "You are a strict but fair IELTS Writing examiner. Judge Task Achievement/Response, Coherence and Cohesion, Lexical Resource and Grammatical Range and Accuracy. Give ONE integer band 0-9 for the answer; typical learner answers are band 4-6; penalise answers clearly under the word limit. Reply JSON only.";
    if (fmtN() === 3) return "You are a strict but fair IELTS Speaking examiner. The candidate's speech was transcribed automatically (punctuation may be missing, small recognition errors are possible: do NOT penalise recognition glitches). Judge Fluency and Coherence, Lexical Resource and Grammatical Range and Accuracy from the text only (do not judge pronunciation). Give ONE integer band 0-9 for the answer; typical learner answers are band 4-6. Reply JSON only.";
    return S.kind === "speaking" ? "You are a strict but fair TOEIC Speaking rater. The learner's speech was transcribed automatically (punctuation may be missing, small recognition errors are possible: do NOT penalise recognition glitches). You can only judge content, organisation, grammar, vocabulary and fluency signals from the text; do not claim to judge pronunciation. Typical learner answers deserve 1-2 on a 0-3 scale. Reply JSON only."
      : "You are a strict but fair TOEIC Writing rater. Typical learner answers deserve 1-2 on a 0-3 scale (0-4 for emails, 0-5 for the essay). Reply JSON only.";
  }
  function userPrompt(t, ans) {
    var max = MXS(S.kind)[t.q], base = 'Return JSON: {"score":<integer 0-' + max + '>,"strengths":["<1-2 short Vietnamese points>"],"fixes":["<up to 3 Vietnamese points, each with a short English example of the correction>"],"better":"<an improved English version of the learner answer, similar length>"}.\n';
    if (fmtN() === 3 && S.kind === "writing") {
      var wq = t.type === "task1" ? "Task 1 (describe a chart/diagram, min " + (t.min || 150) + " words). The learner saw an AI-made visual; the prompt is: " + t.question : "Task 2 essay (min " + (t.min || 250) + " words). Question: " + t.question;
      return base.replace("0-" + max, "0-9") + wq + "\nLearner answer (" + nWords(ans) + " words):\n" + ans;
    }
    if (fmtN() === 3) {
      var ex = t.type === "cue" ? "Part 2 long turn. Cue card: " + t.cue + " You should say: " + (t.bullets || []).join("; ") + ". Expect a 1.5-2 minute talk covering every point." : (t.q <= 4 ? "Part 1 short answer (expect 2-4 sentences). " : "Part 3 discussion (expect an extended, abstract answer with reasons and examples). ") + "Question: " + t.question;
      return base.replace("0-" + max, "0-9") + "Task: " + ex + "\nCandidate transcript (" + nWords(ans) + " words): " + ans;
    }
    if (S.kind === "speaking") {
      var d = t.type === "describe" ? "Photo description (the learner sees a photo described as): " + t.scene : t.type === "solution" ? "Voicemail the learner heard: " + t.message : t.type === "info" ? "Info table: " + JSON.stringify((S.tasks.filter(function (x) { return x.info; })[0] || {}).info) + "\nQuestion: " + t.question : "Question: " + t.question + (t.scenario ? "\nContext: " + t.scenario : "");
      return base + "Task rubric: " + SP_RUBRIC[t.type] + "\n" + d + "\nLearner transcript (" + nWords(ans) + " words): " + ans;
    }
    var q = t.type === "sentence" ? "Write ONE sentence using BOTH words: " + t.words.join(" + ") + ". Photo: " + t.scene + ". Judge grammar + relevance to the photo + both words used correctly (0-3)." : t.type === "email" ? "Respond to this e-mail. Requirement: " + t.directions + "\nE-mail:\n" + JSON.stringify(t.email) + "\nJudge: requirements met, clarity, organisation, grammar, vocabulary (0-4)." : "Opinion essay (0-5): " + t.question + "\nJudge: clear opinion, reasons + examples, organisation, grammar/vocabulary. Expected 300+ words.";
    return base + q + "\nLearner answer (" + nWords(ans) + " words):\n" + ans;
  }

  /* ---------- kết quả 1 câu + tổng ---------- */
  function result(h, t, embed) {
    var r = S.results[t.q], set = curSet(), last = S.i >= S.tasks.length - 1;
    if (embed && r.err) return h + '<div class="card"><p class="bad"><b>Chưa chấm được</b> (' + esc(r.err) + ')</p><p class="sub">Có thể AI đang bận.</p><button class="big" data-act="lregrade">Chấm lại</button></div>';
    if (r.err) h += '<div class="card"><p class="bad"><b>Chưa chấm được</b> (' + esc(r.err) + ')</p><p class="sub">Có thể AI đang bận. Bấm "Chấm lại".</p></div><div class="bottom"><div class="in"><button class="big" data-act="regrade">Chấm lại</button><button class="big" data-act="next">' + (last ? "Xong" : "Câu tiếp ▶") + "</button></div></div>";
    else {
      var cls = r.score === r.max ? "top" : "s" + r.score, fb = r.fb || {};
      h += '<div class="card"><div class="score"><div class="ring ' + cls + '">' + r.score + "<small>/" + r.max + '</small></div><div><b>' + (r.score >= r.max - 0 ? "Rất tốt!" : r.score >= Math.ceil(r.max / 2) ? "Khá ổn" : "Cần cải thiện") + '</b><div class="sub">Điểm ước tính cho câu này</div></div></div>';
      if (r.read && r.read.pct >= .05) {
        S.rd = r.read;   /* thẻ luyện từng chữ (drill*) dùng lại kết quả này */
        h += '<p class="prompt read" style="margin-top:8px">' + r.read.words.map(function (w, i) { var cw = String(w).replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, ""), s0 = r.read.st[i] || "miss", bad = s0 !== "ok";
          return '<span data-i="' + i + '" class="w-' + s0 + (cw ? " tapw" : "") + '"' + (cw ? ' role="button" tabindex="0" data-act="' + (bad ? "dr-word" : "say") + '" data-v="' + esc(cw) + '" title="' + (bad ? "Chạm để luyện chữ này" : "Chạm để nghe đọc mẫu") + '"' : "") + ">" + esc(w) + "</span>"; }).join(" ") + '</p><p class="sub"><span class="w-ok">xanh = đúng</span> · <span class="w-bad">đỏ = sai/chưa rõ</span> · <span class="w-miss">vàng = bỏ sót</span> · 👆 chạm chữ đỏ/vàng để luyện</p>';
        var nb0 = r.read.st.filter(function (x) { return x !== "ok"; }).length;
        if (nb0) h += '<p><button type="button" class="pri" id="dr-open-btn" data-act="dr-open">🎯 Luyện ' + nb0 + ' chữ chưa đúng</button></p>';
      }
      if (t && t.type === "read_aloud" && S.kind === "speaking") { S.prT = t; h += '<p class="dr-actions"><button type="button" class="pri" data-act="pr-open">🎯 Luyện cả bài</button></p>'; }
      if ((fb.strengths || []).length) h += '<ul class="fb ok">' + fb.strengths.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      if ((fb.fixes || []).length) h += '<p><b>Cần sửa</b></p><ul class="fb">' + fb.fixes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      h += "</div>";
      if (r.ans && !r.read) h += '<details open><summary>' + (S.kind === "speaking" ? "Lời bạn nói (nhận được)" : "Bài của bạn") + ' · ' + nWords(r.ans) + ' từ</summary><div class="live">' + esc(r.ans) + "</div></details>";
      if (fb.better) h += '<details><summary>✨ Bản gợi ý cải thiện</summary><div class="model">' + esc(fb.better) + "</div></details>";
      var md = (set.models || {})[t.q]; if (md) h += '<details><summary>📘 Bài mẫu của đề</summary><div class="model">' + esc(md) + "</div></details>";
      if (embed) return h;
      h += '<div class="bottom"><div class="in"><button class="big" data-act="retry">↻ Làm lại câu</button><button class="pri big" data-act="next">' + (last ? "Xem kết quả" : "Câu tiếp ▶") + "</button></div></div>";
    }
    h = h.replace('<div class="bottom">', boardHtml() + '<div class="bottom">'); app.innerHTML = h;
  }
  function nextSetOf() {   /* đề kế tiếp cùng nguồn + cùng format -> luyện 1 Part qua TẤT CẢ các đề lần lượt */
    var cur = curSet(); if (!cur || (LIVE && S.screen === "live")) return null;
    var list = SETS[S.kind].filter(function (x) { return !!x.mine === !!cur.mine && (x.fmt || 1) === (cur.fmt || 1); }), i = list.indexOf(cur);
    return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  }
  function summary() {
    var raw = 0, max = 0, rows = "";
    S.tasks.forEach(function (t) { var r = S.results[t.q]; max += MXS(S.kind)[t.q]; if (r && r.score != null) raw += r.score; rows += "<tr><td>Câu " + t.q + "</td><td>" + esc(tl(t)) + '</td><td class="n">' + (r && r.score != null ? r.score : "—") + "/" + MXS(S.kind)[t.q] + "</td></tr>"; });
    var est = Math.round(raw / max * 200 / 5) * 5, lo = Math.max(0, est - 15), hi = Math.min(200, est + 15), band = Math.round(raw / (max || 1) * 9 * 2) / 2;
    var h = '<h1>Kết quả</h1><div class="card"><div class="sub">' + esc(S.gt) + ' · ' + (S.kind === "speaking" ? "Speaking" : "Writing") + '</div><div class="est">' + (fmtN() === 3 ? "Band " + band.toFixed(1) : S.group === "all" ? lo + "–" + hi : raw + "/" + max) + '</div><div class="sub">' + (fmtN() === 3 ? "Band ước tính theo các câu đã làm (AI, chỉ để tham khảo)" : S.group === "all" ? "Điểm ước tính thang 0–200 (AI, chỉ để tham khảo)" : "Điểm thô của phần đã làm") + '</div><table class="sum">' + rows + '</table><p class="sub">' + (fmtN() === 3 ? "Band do AI ước tính từ chữ nhận được, không chấm phát âm; điểm thật do giám khảo IELTS chấm có thể khác." : "Thang 0–200 quy đổi gần đúng từ điểm thô; điểm thật do ETS chấm có thể khác.") + '</p></div>' +
      '<div class="bottom"><div class="in"><button class="big" data-act="home">Chọn đề khác</button><button class="pri big" data-act="again">↻ Làm lại</button>' + (nextSetOf() ? '<button class="big" data-act="nextset">▶ ' + (S.group === "all" ? "Đề kế tiếp" : "Part này ở đề kế tiếp") + " (" + esc(String(nextSetOf().title || "").slice(0, 34)) + ")</button>" : "") + "</div></div>";
    h = h.replace('<div class="bottom">', boardHtml() + '<div class="bottom">'); app.innerHTML = h;
    if (!S.saved) { S.saved = 1; ST.hist.push({ kind: S.kind, set: S.setId, group: S.group, gt: S.gt, ts: Date.now(), raw: raw, max: max, est: est }); if (ST.hist.length > 80) ST.hist.shift(); save(); }
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener("click", function (e) {
    if (!MIC.asked && S.kind === "speaking") { MIC.asked = true; primeMic(); }   /* chạm đầu tiên = xin quyền mic sớm (không đợi tới lúc bắt đầu nói) */
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return; var a = b.dataset.act, v = b.dataset.v;
    if (a === "hl") { try { localStorage.setItem(HL_KEY, hlOn() ? "0" : "1"); } catch (x) {} hlPaint(b); if (hlOn()) { try { hlRead(); } catch (x) {} } else hlClear(); return; }
    if (a === "kind") { S.kind = v; S.setId = (SETS[v][0] || {}).id || ""; render(); }
    else if (a === "set") { S.setId = v; render(); }
    else if (a === "start") { if (EMBED && !classOn()) { toast("Đang vào phòng game, thử lại sau giây lát"); return; } if (classOn()) toParent({ type: "sw-host-start", kind: S.kind, exam: EX0, set: S.setId, group: v, from: S.qFrom || 0, to: S.qTo || 0 }); else { S.class = null; S.saved = 0; begin(S.kind, v); } }
    else if (a === "leave") toParent({ type: "sw-leave" });
    else if (a === "tips") { var tb = $("#tips-box"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (a === "part") { S.group = v; render(); }
    else if (a === "rev") { S.screen = "rev"; render(); }
    else if (a === "revf") { S.revAll = !S.revAll; render(); }
    else if (a === "revclr") { if (confirm("Xoá toàn bộ lịch sử bài " + (S.kind === "speaking" ? "nói" : "viết") + " trên máy này?")) { ST.rev = (ST.rev || []).filter(function (r) { return r.kind !== S.kind; }); save(); render(); } }
    else if (a.indexOf("dr-") === 0) { drillAct(a, v, b); return; }   /* thẻ luyện từng chữ */
    else if (a.indexOf("pr-") === 0) { practiceAct(a, v); return; }   /* luyện cả bài */
    else if (a === "hdo") { toParent({ type: "sw-do", a: v }); return; }   /* nút ở ô phòng (màn chờ, chưa có lớp đang chạy) */
    else if (liveAct(a, v)) return;
    else if (a === "go") go();
    else if (a === "skipprep") { clearTimer(); startResp(); }
    else if (a === "stop") finish();
    else if (a === "say") say(v);
    else if (a === "retry") { question(); }
    else if (a === "regrade") { S.phase = "grading"; render(); grade(); }
    else if (a === "skipq") { var n = S.i + (+v || 0); if (n < 0) return; clearTimer(); stopSpeech(); if (n >= S.tasks.length) { S.screen = "sum"; render(); } else { S.i = n; question(); } }
    else if (a === "next") { if (S.i >= S.tasks.length - 1) { S.screen = "sum"; render(); } else { S.i++; question(); } }
    else if (a === "quit") { clearLive(); if (LIVE && !CTX.isHost) setTimeout(function () { toParent({ type: "sw-leave" }); }, 50); if (LIVE) { if (CTX.isHost) toParent({ type: "sw-class-send", p: { t: "live", run: LIVE.run, phase: "close" } }); S.leftRun = LIVE.run; LIVE = null; } clearTimer(); stopSpeech(); try { speechSynthesis.cancel(); } catch (x) {} S.screen = "home"; render(); }
    else if (a === "home") { S.screen = "home"; render(); }
    else if (a === "nextset") { var ns = nextSetOf(); if (ns) { S.setId = ns.id; S.qFrom = S.qTo = null; S.class = null; S.saved = 0; begin(S.kind, S.group); } }
    else if (a === "again") { S.saved = 0; begin(S.kind, S.group); }
    else if (a === "delextra") { try { localStorage.removeItem(EXTRA); } catch (x) {} toast("Đã xoá đề riêng"); setTimeout(function () { location.reload(); }, 700); }
  });
  window.addEventListener("message", function (e) {
    var d = e.data; if (e.origin !== location.origin || !d || typeof d.type !== "string" || d.type.indexOf("sw-") !== 0) return;
    if (d.type === "sw-ctx") { var np = d.players || [], sig = JSON.stringify([!!d.inRoom, !!d.isHost, d.room || "", np.map(function (p) { return p.id; })]), changed = sig !== CTX.sig; CTX = { inRoom: !!d.inRoom, isHost: !!d.isHost, me: d.me || null, players: np, room: d.room || "", sig: sig }; revCloudLoad(); privLoad(); maybeRestore(); if (changed && (S.screen === "home" || (S.screen === "live" && LIVE && !busy(LIVE)))) render(); }
    else if (d.type === "sw-class-start") applyStart(d);
    else if (d.type === "sw-class-live") liveApply(d.p);
    else if (d.type === "sw-class-fin" && d.p) liveFin(d.p.pid);
    else if (d.type === "sw-class-rdy" && d.p) liveRdy(d.p.pid);
    else if (d.type === "sw-cmd" && CTX.isHost && LIVE) {   /* lệnh từ thẻ Quản trị */
      var c = d.cmd, v = d.v;
      if (c === "end") liveAct("lend"); else if (c === "stop") liveAct("lstop"); else if (c === "next") liveAct("lnext"); else if (c === "start") liveAct("lstart");
      else if (c === "ai") { S.aiGrade = !!v; LIVE.ai = S.aiGrade; liveRender(); }
      else if (c === "hp") { S.hostPlays = !!v; liveRender(); }
      else if (c === "pick") { LIVE.pick = v; liveRender(); }
    }
    else if (d.type === "sw-class-res" && S.class && d.p && d.p.run === S.class.run && !(CTX.me && d.p.pid === CTX.me.id)) { var b = S.class.board, p = d.p, e2 = b[p.pid] || (b[p.pid] = { name: p.name || "Bạn học", avatar: p.avatar || "", total: 0, n: 0 }); if (!p.pending) { e2.total = p.total; e2.n = p.n || e2.n; } ((S.class.rq = S.class.rq || {})[p.q] = S.class.rq[p.q] || {})[p.pid] = p; if (S.screen === "live" && LIVE && !busy(LIVE)) liveRender(); else { updBoard(); var ob = $("#oth-box"); if (ob && S.screen === "live" && LIVE && curTask()) ob.outerHTML = othersHtml(curTask().q); } }   /* đang đếm giờ: chỉ cập nhật ô kết quả, không vẽ lại cả màn (mất chữ đang gõ) */
  });
  document.addEventListener("change", function (e) {
    if (!e.target) return;
    var id = e.target.id;
    if (id === "sel-src") { S.src = e.target.value; S.setId = ""; render(); return; }
    if (id === "sel-set") { S.setId = e.target.value; render(); return; }
    if (id === "sel-scope") { S.group = e.target.value === "all" ? "all" : GRP(S.kind)[1].k; S.qFrom = S.qTo = null; render(); return; }
    if (id === "sel-grp") { S.group = e.target.value; S.qFrom = S.qTo = null; render(); return; }
    if (id === "q-from" || id === "q-to") {
      var g0 = GRP(S.kind).filter(function (x) { return x.k === S.group; })[0], lo = Math.min.apply(null, g0.qs), hi = Math.max.apply(null, g0.qs), v0 = parseInt(e.target.value, 10);
      var f = id === "q-from" ? (isNaN(v0) ? lo : v0) : (S.qFrom || lo), t = id === "q-to" ? (isNaN(v0) ? hi : v0) : (S.qTo || hi);
      f = Math.max(lo, Math.min(hi, f)); t = Math.max(lo, Math.min(hi, t)); if (f > t) { if (id === "q-from") t = f; else f = t; }
      S.qFrom = f === lo ? null : f; S.qTo = t === hi ? null : t; render(); return;
    }
    if (id === "hostplays") { S.hostPlays = e.target.checked; return; }
    if (e.target.id === "clsmode") { S.classMode = e.target.checked; if (S.screen === "home") render(); }
    else if (e.target.id === "aimode") { S.aiGrade = e.target.checked; if (LIVE) { LIVE.ai = S.aiGrade; if (S.screen === "live" && CTX.isHost && !busy(LIVE)) liveSend({ i: S.i, phase: LIVE.phase, sp: LIVE.sp, done: LIVE.done, sec: 0 }); } }
  });
  window.addEventListener("pagehide", function () { stopSpeech(); micRelease(); try { speechSynthesis.cancel(); } catch (e) {} });
  /* TJ 2026-10-15: "khi vào test thì tất cả chỉ có bài test, vừa gọn màn hình" — đang làm bài (lớp đang chạy hoặc tự luyện 1 câu) -> báo trang game thu gọn
     thanh trên/dưới của WordLoop + thanh game (như ván Từ vựng); xong/thoát thì trả lại. Áp cho cả 4 lớp: Speaking, Writing, IELTS Speaking, IELTS Writing. */
  document.addEventListener("click", function (e) {   /* chạm ảnh đề (đang làm bài 1 màn hình) -> phóng to; chạm lại -> thu nhỏ */
    var im = e.target && e.target.tagName === "IMG" ? e.target : null;
    if (im && document.body.classList.contains("one") && im.closest("#app > .top + .card")) im.classList.toggle("zoom");
  });
  var focusOn = false;
  setInterval(function () {
    var on = (S.screen === "live" && !!LIVE && LIVE.phase !== "end") || S.screen === "task";
    if (on !== focusOn) { focusOn = on; toParent({ type: "sw-focus", on: on }); }
  }, 300);
  loadSets().then(function () { render(); maybeRestore(); toParent({ type: "sw-hello", kind: S.kind }); if (PENDING) { var d = PENDING; PENDING = null; applyStart(d); } });
})();
