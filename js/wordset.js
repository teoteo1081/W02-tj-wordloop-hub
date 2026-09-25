/* wordset.js — Màn "⭐ Ôn riêng" (2026-09-24, TJ yêu cầu): 2 danh sách từ
   trên TOÀN APP của người đang học (không chỉ Notebook đang mở):
     · ⭐ Yêu thích — từ đã bấm Bookmark (☆/★ ở bảng từ vựng, cạnh từ trong
       bài Nghĩa, hoặc ngay trong màn này để bỏ Bookmark).
     · ❌ Hay sai — từ từng trả lời sai (word_progress.attempts > correct)
       mà CHƯA thuộc (mastered). Làm đúng đủ nhiều ở đây là tự rời danh sách.
   Mỗi danh sách: đọc tất cả (TTS) + kiểm tra nghĩa 4 đáp án (dùng chung
   giao diện câu hỏi với tab Nghĩa — Detail.mcQuestionHtml, có 🔊 nghe từ
   + nút tắt tiếng). Kết quả kiểm tra cộng vào word_progress y hệt tab
   Nghĩa (attempts/correct/mastered) nhưng KHÔNG đụng block_progress/SRS —
   đây là ôn thêm theo từ, không phải hoàn thành 1 Block.
   Dữ liệu: DB.loadWordSets / DB.setBookmark / DB.locateBlock (db.js). */
(function (w) {
  "use strict";

  var WS = { tab: "bm", data: null, quiz: null, qi: 0 };
  w.WordSet = WS;
  var cfg = w.APP_CONFIG || {};
  var QUIZ_CAP = 20;
  var LS_TAB = "tjwl_wordset_tab_v1";

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Danh sách từ (dạng word row) của tab đang chọn. */
  function currentWords() {
    if (!WS.data) return [];
    return WS.tab === "wrong" ? WS.data.wrong.map(function (x) { return x.word; }) : WS.data.bookmarks;
  }

  /* ══════════════ MỞ / ĐÓNG ══════════════ */
  /* tab: "bm" (nút ⭐ Ôn riêng) | "wrong" (nút ❌ Fix lỗi sai) — không
     truyền thì mở lại tab dùng lần trước. */
  WS.open = async function (tab) {
    w.Speech.stop();
    if (tab) WS.tab = tab;
    else { try { WS.tab = localStorage.getItem(LS_TAB) === "wrong" ? "wrong" : "bm"; } catch (e) {} }
    try { localStorage.setItem(LS_TAB, WS.tab); } catch (e) {}
    WS._prevWasDetail = !w.$("#screen-detail").hidden;
    ["#screen-blocks", "#screen-detail", "#screen-leaderboard", "#screen-journey", "#screen-home"].forEach(function (s) {
      w.$(s).hidden = true;
    });
    w.$("#btn-back").hidden = true;
    w.$("#screen-wordset").hidden = false;
    w.$("#btn-learning").hidden = false;
    w.$("#workspace").scrollTop = 0;
    WS.quiz = null;
    await WS.load();
  };

  WS.close = function () {
    w.Speech.stop();
    clearTimeout(WS._autoNext);
    w.$("#screen-wordset").hidden = true;
    w.$("#btn-learning").hidden = true;
    if (WS._prevWasDetail && w.Detail && w.Detail.blockId) {
      w.$("#screen-detail").hidden = false;
      w.$("#btn-back").hidden = false;
      /* Có thể vừa bỏ/thêm ⭐ ở đây -> vẽ lại bảng từ vựng cho khớp. */
      if (w.Detail.renderStudy) w.Detail.renderStudy();
    } else {
      w.$("#screen-blocks").hidden = false;
    }
  };

  WS.isOpen = function () { return !w.$("#screen-wordset").hidden; };

  WS.load = async function () {
    var u = w.Auth.user;
    w.$("#ws-body").innerHTML = '<div class="muted ws-empty">⏳ Đang tải…</div>';
    try {
      WS.data = await w.DB.loadWordSets(u && u.id);
    } catch (e) {
      console.warn("[WordSet] load lỗi:", e);
      w.$("#ws-body").innerHTML = '<div class="muted ws-empty">Không tải được danh sách: ' + w.esc(e.message || String(e)) + "</div>";
      return;
    }
    WS.render();
  };

  /* Gọi từ Detail.toggleBookmark — bấm ☆/★ ở bất kỳ đâu. Đang mở màn này
     thì cập nhật luôn danh sách ⭐ (bỏ ★ là biến khỏi danh sách ngay). */
  WS.onBookmarkChanged = function (wordId, on) {
    if (!WS.data || !WS.isOpen()) return;
    var bm = WS.data.bookmarks;
    var idx = bm.findIndex(function (x) { return x.id === wordId; });
    if (!on && idx >= 0) bm.splice(idx, 1);
    if (on && idx < 0) {
      var src = WS.data.wrong.find(function (x) { return x.word.id === wordId; });
      if (src) bm.push(src.word);
    }
    if (!WS.quiz) WS.render(); else paintCounts();
  };

  /* ══════════════ VẼ ══════════════ */
  function paintCounts() {
    var d = WS.data || { bookmarks: [], wrong: [] };
    w.$("#ws-n-bm").textContent = d.bookmarks.length;
    w.$("#ws-n-wrong").textContent = d.wrong.length;
    /* số trên 2 nút thanh trên cùng khớp luôn với danh sách vừa tải */
    if (w.App && w.App.setWordSetBadges && WS.data) {
      w.App.setWordSetBadges({
        bm: d.bookmarks.length,
        bmMastered: d.bookmarks.filter(function (x) { return x.mastered; }).length,
        wrong: d.wrong.length
      });
    }
    w.$$("#ws-tabs [data-ws]").forEach(function (b) { b.classList.toggle("active", b.dataset.ws === WS.tab); });
  }

  WS.render = function () {
    paintCounts();
    var note = w.$("#ws-note");
    if (WS.tab === "wrong") {
      note.textContent = "Từ bạn đang trả lời sai ở bất kỳ bài kiểm tra nào. Làm đúng lại từ đó (ở đây hoặc trong Block) là tự bỏ ra khỏi danh sách.";
    } else {
      note.textContent = "Từ bạn đã bấm ☆ Bookmark ở bảng từ vựng hoặc trong bài Nghĩa. Bấm ★ để bỏ Bookmark.";
    }
    if (WS.data && WS.data.fallback && WS.tab === "bm") {
      note.textContent += " (Bookmark đang lưu tạm trên máy này — cần chạy cập nhật CSDL để đồng bộ giữa các máy.)";
    }
    if (WS.quiz) { renderQuiz(); return; }
    renderList();
  };

  function renderList() {
    var list = currentWords();
    w.$("#ws-quiz-btn").disabled = list.length < 1;
    w.$("#ws-read-all").disabled = list.length < 1;
    if (!list.length) {
      w.$("#ws-body").innerHTML = '<div class="muted ws-empty">' +
        (WS.tab === "wrong"
          ? "🎉 Chưa có từ nào hay sai — làm bài kiểm tra ở các Block, từ trả lời sai sẽ tự vào đây."
          : "Chưa có từ nào. Bấm ☆ cạnh từ trong bảng từ vựng hoặc trong bài Nghĩa để thêm vào đây.") +
        "</div>";
      return;
    }
    var wrongById = {};
    if (WS.data) WS.data.wrong.forEach(function (x) { wrongById[x.word.id] = x; });
    var rows = list.map(function (x, i) {
      var wr = wrongById[x.id];
      var wrongCell = wr
        ? '<span class="ws-wrong" title="Sai ' + wr.wrong + " / " + wr.attempts + ' lần làm">✗ ' + wr.wrong + "/" + wr.attempts + "</span>"
        : (x.mastered ? '<span class="ws-ok">✓ Đã thuộc</span>' : "");
      return "<tr data-i=\"" + i + "\">" +
        '<td><div class="term-cell">' +
          '<button class="spk" data-ws-say="' + w.esc(x.term) + '" title="Nghe">🔊</button>' +
          "<b>" + w.esc(x.term) + "</b>" +
          w.Detail.bmBtnHtml(x.id) +
        "</div></td>" +
        '<td class="ipa" data-label="Phonetic">' + w.esc(x.ipa || "—") + "</td>" +
        '<td class="vi-cell" data-label="Nghĩa Việt">' + w.esc(x.meaning_vi || "—") + "</td>" +
        '<td class="def-en" data-label="Definition">' + w.esc(x.def_en || "—") + "</td>" +
        '<td data-label="Sai">' + (wrongCell || "—") + "</td>" +
        '<td data-label="Block"><button class="btn-ghost ws-jump" data-ws-jump="' + w.esc(x.block_id) + '" title="Mở Block chứa từ này">' +
          w.esc(x.block_name || "Block") + " ↗</button></td>" +
      "</tr>";
    }).join("");
    w.$("#ws-body").innerHTML =
      '<div class="table-wrap"><table class="vocab-table ws-table">' +
        "<thead><tr><th>Vocabulary</th><th>Phonetic</th><th>Nghĩa Việt</th><th>English Definition</th><th>Sai</th><th>Block</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table></div>";
  }

  /* ══════════════ KIỂM TRA NGHĨA ══════════════ */
  function buildQuiz() {
    var pool = currentWords().filter(function (x) { return x.meaning_vi; });
    if (!pool.length) return null;
    /* Đáp án nhiễu: ưu tiên từ trong chính danh sách, thiếu (danh sách
       < 4 từ) thì mượn thêm nghĩa từ Notebook đang mở (S.words). */
    var extra = ((w.S && w.S.words) || []).filter(function (y) { return y.meaning_vi; });
    var picked = shuffle(pool).slice(0, Math.min(QUIZ_CAP, pool.length));
    var mc = picked.map(function (x) {
      var seen = {}; seen[x.meaning_vi] = true;
      var others = [];
      shuffle(pool).concat(shuffle(extra)).forEach(function (y) {
        if (others.length >= 3 || y.id === x.id || seen[y.meaning_vi]) return;
        seen[y.meaning_vi] = true;
        others.push(y.meaning_vi);
      });
      return { term: x.term, wordId: x.id, answer: x.meaning_vi,
               options: shuffle([x.meaning_vi].concat(others)), given: null };
    });
    return { mc: mc, total: mc.length, graded: false };
  }

  function renderQuiz() {
    var ex = WS.quiz, box = w.$("#ws-body");
    w.$("#ws-quiz-btn").disabled = false;
    if (ex.graded) {
      var pct = w.pct(ex.correct, ex.total);
      box.innerHTML =
        '<div class="card final-wrap">' +
          '<div class="exam-result ' + (pct >= 80 ? "pass" : "failed") + '">' +
            '<div class="score">' + pct + "%</div>" +
            '<div class="verdict">' + (pct >= 80 ? "✅ Giỏi lắm!" : "🙂 Ôn thêm cho quen") + "</div>" +
            '<div class="detail">Đúng ' + ex.correct + "/" + ex.total + " câu · kết quả đã cộng vào độ nhớ từng từ</div>" +
          "</div>" +
          '<div class="exam-actions">' +
            '<button class="btn-soft" id="ws-again">🔁 Làm lại</button>' +
            '<button class="btn-primary" id="ws-to-list">📋 Về danh sách</button>' +
          "</div>" +
        "</div>";
      w.$("#ws-again").onclick = function () { WS.quiz = buildQuiz(); WS.qi = 0; WS.render(); };
      w.$("#ws-to-list").onclick = function () { WS.quiz = null; WS.load(); };
      return;
    }

    if (WS.qi < 0) WS.qi = 0;
    if (WS.qi >= ex.mc.length) WS.qi = ex.mc.length - 1;
    var q = ex.mc[WS.qi];
    var answered = ex.mc.filter(function (x) { return x.given; }).length;
    var pctDone = Math.round((answered / ex.total) * 100);
    var shown = !!q.shown;
    function optClass(val) {
      var c = "opt";
      if (!shown) { if (q.given === val) c += " sel"; return c; }
      if (val === q.answer) return c + " right";
      if (q.given === val) return c + " wrong";
      return c + " dim";
    }
    var last = WS.qi >= ex.mc.length - 1;
    box.innerHTML =
      '<div class="card final-wrap">' +
        '<div class="exam-bar-row">' +
          '<span class="exam-idx">CÂU ' + (WS.qi + 1) + " / " + ex.mc.length + "</span>" +
          '<button class="mn-mute" data-quiz-mute type="button"></button>' +
          '<span class="exam-score">đã làm ' + answered + "/" + ex.total + "</span>" +
        "</div>" +
        '<div class="quiz-bar"><i style="width:' + pctDone + '%"></i></div>' +
        w.Detail.mcQuestionHtml(q, optClass) +
        '<div class="exam-actions">' +
          '<button class="btn-soft" id="ws-prev"' + (WS.qi === 0 ? " disabled" : "") + ">← Trước</button>" +
          (last
            ? (shown ? '<button class="btn-primary" id="ws-finish">Xem kết quả →</button>' : '<button class="btn-soft" id="ws-quit">✕ Thoát</button>')
            : '<button class="btn-primary" id="ws-next">Câu tiếp →</button>') +
        "</div>" +
      "</div>";

    w.Detail.bindQuizAudio(box);
    w.$$("#ws-body [data-pick]").forEach(function (b) {
      b.onclick = function () {
        if (q.shown) return;
        q.given = b.dataset.pick;
        q.ok = q.given === q.answer;
        q.shown = true;
        saveAnswer(q);
        renderQuiz();
        if (q.ok) w.Speech.speakQuiz(q.term);
        clearTimeout(WS._autoNext);
        if (q.ok && !last) {
          WS._autoNext = setTimeout(function () {
            if (WS.quiz === ex && WS.qi < ex.mc.length - 1) { WS.qi++; renderQuiz(); }
          }, 1100);
        }
      };
    });
    var p = w.$("#ws-prev"), n = w.$("#ws-next"), f = w.$("#ws-finish"), quit = w.$("#ws-quit");
    if (p) p.onclick = function () { clearTimeout(WS._autoNext); WS.qi--; renderQuiz(); };
    if (n) n.onclick = function () { clearTimeout(WS._autoNext); WS.qi++; renderQuiz(); };
    if (quit) quit.onclick = function () { WS.quiz = null; WS.load(); };
    if (f) f.onclick = function () {
      ex.correct = ex.mc.filter(function (x) { return x.ok; }).length;
      ex.graded = true;
      renderQuiz();
    };
  }

  /* Ghi NGAY từng câu (không đợi hết bài — thoát giữa chừng vẫn giữ những
     câu đã làm). Cùng công thức mastered với Detail.submitMeaning. */
  async function saveAnswer(q) {
    var u = w.Auth.user;
    if (!u || !q.wordId) return;
    var wpMap = (w.S && w.S.wp) || {};
    var prev = wpMap[q.wordId] || findProgress(q.wordId) || { attempts: 0, correct: 0 };
    var attempts = (prev.attempts || 0) + 1;
    var okCount = (prev.correct || 0) + (q.ok ? 1 : 0);
    var patch = {
      attempts: attempts, correct: okCount,
      mastered: attempts >= (cfg.MASTER_MIN_ATTEMPTS || 3) && (okCount / attempts) >= (cfg.MASTER_THRESHOLD || 0.8),
      last_reviewed_at: Date.now()
    };
    rememberProgress(q.wordId, patch);
    if (w.S && w.S.wp) w.S.wp[q.wordId] = Object.assign({}, prev, patch, { user_id: u.id, word_id: q.wordId });
    try {
      await w.DB.saveWordProgress(u.id, q.wordId, patch);
      /* ❌ Fix lỗi sai: đúng -> bỏ khỏi danh sách, sai -> (vẫn) nằm trong. */
      await w.DB.markResults(u.id, [{ wordId: q.wordId, ok: !!q.ok }]);
      if (WS.data) {
        var i = WS.data.wrong.findIndex(function (x) { return x.word.id === q.wordId; });
        if (q.ok && i >= 0) WS.data.wrong.splice(i, 1);
        var bmHit = WS.data.bookmarks.find(function (x) { return x.id === q.wordId; });
        if (bmHit) bmHit.mastered = patch.mastered;
        paintCounts();
      }
    } catch (e) {
      console.warn("[WordSet] saveWordProgress lỗi:", e);
      w.toast("⚠️ Chưa lưu được kết quả lên máy chủ (mất mạng?)", "err");
    }
  }
  /* Từ ở Notebook KHÁC Notebook đang mở không có trong S.wp — lấy số cũ từ
     WS.data.progress (DB.loadWordSets tải sẵn), và ghi đè số mới vào đó sau
     mỗi câu để làm lại lần 2 trong cùng phiên vẫn cộng tiếp đúng. */
  function findProgress(wordId) {
    return (WS.data && WS.data.progress && WS.data.progress[wordId]) || null;
  }
  function rememberProgress(wordId, patch) {
    if (WS.data && WS.data.progress) WS.data.progress[wordId] = { attempts: patch.attempts, correct: patch.correct };
  }

  /* ══════════════ GẮN SỰ KIỆN (1 lần lúc tải trang) ══════════════ */
  w.$("#btn-wordset").onclick = function () { WS.open("bm"); };
  w.$("#btn-fixwrong").onclick = function () { WS.open("wrong"); };
  w.$("#btn-wordset-back").onclick = function () { WS.close(); };
  w.$("#wordset-refresh").onclick = function () { WS.quiz = null; WS.load(); };
  w.$$("#ws-tabs [data-ws]").forEach(function (b) {
    b.onclick = function () {
      if (b.dataset.ws === WS.tab && !WS.quiz) return;
      clearTimeout(WS._autoNext);
      w.Speech.stop();
      WS.tab = b.dataset.ws;
      try { localStorage.setItem(LS_TAB, WS.tab); } catch (e) {}
      WS.quiz = null;
      WS.render();
    };
  });
  w.$("#ws-quiz-btn").onclick = function () {
    w.Speech.stop();
    WS.quiz = buildQuiz();
    WS.qi = 0;
    if (!WS.quiz) { w.toast("Danh sách này chưa có từ nào có nghĩa tiếng Việt để kiểm tra", "err"); return; }
    WS.render();
  };
  function readAll(withDef) {
    var list = currentWords();
    if (!list.length) return;
    var btn = w.$("#ws-read-all");
    btn.textContent = "🔊 Đang đọc…";
    var items = [];
    list.forEach(function (x, idx) {
      items.push({ text: x.term, groupIndex: idx });
      if (withDef && x.def_en) items.push({ text: "it means " + x.def_en, groupIndex: idx });
    });
    w.Speech.speakList(items, function (i) {
      w.$$("#ws-body tbody tr").forEach(function (tr, k) { tr.classList.toggle("reading", k === i); });
    }, function () { btn.textContent = "🔊 Đọc tất cả"; });
  }
  w.$("#ws-read-all").onclick = function () { if (WS.quiz) { WS.quiz = null; WS.render(); } readAll(false); };
  w.$("#ws-stop").onclick = function () {
    w.Speech.stop();
    w.$("#ws-read-all").textContent = "🔊 Đọc tất cả";
    w.$$("#ws-body tbody tr").forEach(function (tr) { tr.classList.remove("reading"); });
  };
  w.$("#ws-body").addEventListener("click", async function (e) {
    var say = e.target.closest("[data-ws-say]");
    if (say) { w.Speech.speakWord(say.dataset.wsSay); return; }
    var jump = e.target.closest("[data-ws-jump]");
    if (jump) {
      jump.disabled = true;
      try {
        var loc = await w.DB.locateBlock(jump.dataset.wsJump);
        if (!loc) { w.toast("Không tìm thấy Block của từ này", "err"); return; }
        w.$("#screen-wordset").hidden = true;
        await w.App.jumpTo(loc);
      } catch (err) {
        w.toast("Không mở được Block: " + (err.message || err), "err");
      } finally { jump.disabled = false; }
    }
  });
})(window);
