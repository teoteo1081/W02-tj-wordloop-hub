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

  /* ══════════════ PHẠM VI: Block / Batch / Page / Section / Notebook / Hub ══════════════
     2026-09-25, TJ: "ra ngoài Batch thì cũng có tương tự Từ đã lưu và Fix
     lỗi sai cho từng Block, batch, page, section, notebook, hub... tuỳ giao
     diện mà hiện lên sao cho hợp lý". Màn này có 1 hàng chọn phạm vi dựng
     theo ĐÚNG chỗ đang đứng lúc mở (breadcrumb), mỗi nút kèm số ⭐/❌.
     Page trở lên: lọc theo word.loc (DB.loadWordSets gắn sẵn đường dẫn).
     Block/Batch: ngoài từ của chính Block, còn tính các từ LƯU TỪ BÀI ĐỌC
     của Block đó — từ lưu nằm ở batch "⭐ Từ đã lưu" chung của cả Page
     (không có cột nào ghi "lưu từ bài của Block nào"), nên gán theo: từ đã
     lưu của CÙNG Page mà có xuất hiện trong bài đọc của Block. */
  WS.scope = { kind: "all" };
  var SCOPE_ICON = { all: "🌐", hub: "🏢", notebook: "📓", section: "📑", page: "📄", batch: "📦", block: "📕" };

  function nameIn(list, id) { var x = (list || []).find(function (y) { return y.id === id; }); return x ? x.name : ""; }

  /* Các phạm vi đang có ý nghĩa ở vị trí hiện tại (Tất cả → ... → Block). */
  function scopeOptions() {
    var S = w.S || {}, out = [{ kind: "all", id: null, label: "Tất cả" }];
    if (S.hubId) out.push({ kind: "hub", id: S.hubId, label: nameIn(S.hubs, S.hubId) || "Hub" });
    if (S.notebookId) out.push({ kind: "notebook", id: S.notebookId, label: nameIn(S.notebooks, S.notebookId) || "Notebook" });
    if (S.sectionId) out.push({ kind: "section", id: S.sectionId, label: nameIn(S.sections, S.sectionId) || "Section" });
    if (S.pageId) out.push({ kind: "page", id: S.pageId, label: nameIn(S.pages, S.pageId) || "Page" });
    if (S.batchId) out.push({ kind: "batch", id: S.batchId, label: nameIn(S.batches, S.batchId) || "Batch" });
    var bid = WS._openedFromBlock;
    if (bid) out.push({ kind: "block", id: bid, label: nameIn(S.blocks, bid) || "Block" });
    return out;
  }

  var passCache = {};
  function passageNorm(b) {
    var raw = (b && b.context_passage) || "";
    var key = b.id + ":" + raw.length;
    if (passCache[key] == null) {
      var marked = raw ? w.Context.parseMeta(raw).marked : "";
      passCache[key] = " " + w.normalizeAnswer(marked).replace(/[^\p{L}\p{N}'\- ]+/gu, " ").replace(/\s+/g, " ") + " ";
    }
    return passCache[key];
  }

  /* Id các từ thuộc 1 Block/Batch (Notebook đang mở) — gồm từ của chính
     Block + từ đã lưu cùng Page có xuất hiện trong bài đọc của Block. */
  WS.localScopeIds = function (kind, id) {
    var S = w.S, ids = {};
    if (!S || !id) return ids;
    var blocks = kind === "block" ? S.blocks.filter(function (b) { return b.id === id; })
               : kind === "batch" ? w.App.blocksOf(id) : [];
    if (!blocks.length) return ids;
    var inScope = {};
    blocks.forEach(function (b) { inScope[b.id] = 1; });
    S.words.forEach(function (x) { if (inScope[x.block_id]) ids[x.id] = true; });
    var bt = S.batches.find(function (x) { return x.id === blocks[0].batch_id; });
    if (!bt || bt.name === w.DB.SAVED_BATCH_NAME) return ids;
    var savedBlocks = {};
    S.batches.forEach(function (x) {
      if (x.page_id === bt.page_id && x.name === w.DB.SAVED_BATCH_NAME) {
        w.App.blocksOf(x.id).forEach(function (b) { savedBlocks[b.id] = 1; });
      }
    });
    var texts = blocks.map(passageNorm).filter(function (t) { return t.trim(); });
    if (!texts.length) return ids;
    S.words.forEach(function (x) {
      if (!savedBlocks[x.block_id]) return;
      var t = " " + w.normalizeAnswer(x.term) + " ";
      if (t.trim() && texts.some(function (p) { return p.indexOf(t) >= 0; })) ids[x.id] = true;
    });
    return ids;
  };

  /* Số ⭐ Từ đã lưu / ❌ Fix lỗi sai của 1 Block/Batch — tính ngay từ S (không
     gọi mạng), dùng cho chip đầu Block, đầu Batch và từng thẻ Block. */
  WS.localCounts = function (kind, id) {
    var u = w.Auth.user, S = w.S, ids = WS.localScopeIds(kind, id), bm = {}, wrong = {};
    if (!u) return { bm: 0, wrong: 0 };
    var termOf = {};
    S.words.forEach(function (x) { if (ids[x.id]) termOf[x.id] = w.normalizeAnswer(x.term); });
    /* đếm theo CHỮ khác nhau — không đếm trùng */
    Object.keys(ids).forEach(function (wid) {
      var k = termOf[wid] || wid;
      if (w.Detail.isBookmarked(wid)) bm[k] = 1;
      if (w.DB.isWrongOpen(u.id, S.wp[wid])) wrong[k] = 1;
    });
    return { bm: Object.keys(bm).length, wrong: Object.keys(wrong).length };
  };

  /* Mọi id bản trùng cùng chữ với wordId trong danh sách đã tải (gồm chính nó). */
  WS.dupIdsOf = function (wordId) {
    var d = WS.data;
    if (!d) return [wordId];
    var hit = d.bookmarks.find(function (x) { return x.dup_ids && x.dup_ids.indexOf(wordId) >= 0; }) ||
              (d.wrong.find(function (x) { return x.word.dup_ids && x.word.dup_ids.indexOf(wordId) >= 0; }) || {}).word;
    var ids = (hit && hit.dup_ids) ? hit.dup_ids.slice() : [wordId];
    if (ids.indexOf(wordId) < 0) ids.push(wordId);
    return ids;
  };

  function inScope(x, sc) {
    if (!sc || sc.kind === "all") return true;
    if (sc.kind === "block" || sc.kind === "batch") {
      sc._ids = sc._ids || WS.localScopeIds(sc.kind, sc.id);
      return !!sc._ids[x.id];
    }
    return !!(x.loc && x.loc[sc.kind + "Id"] === sc.id);
  }
  function listsFor(sc) {
    var d = WS.data || { bookmarks: [], wrong: [] };
    return {
      bookmarks: d.bookmarks.filter(function (x) { return inScope(x, sc); }),
      wrong: d.wrong.filter(function (x) { return inScope(x.word, sc); })
    };
  }

  /* Danh sách từ (dạng word row) của tab + phạm vi đang chọn. */
  function currentWords() {
    if (!WS.data) return [];
    var l = listsFor(WS.scope);
    return WS.tab === "wrong" ? l.wrong.map(function (x) { return x.word; }) : l.bookmarks;
  }

  function renderScopes() {
    var bar = w.$("#ws-scopes");
    if (!bar) return;
    bar.innerHTML = '<span class="ws-scope-lbl">Phạm vi:</span>' + WS._scopes.map(function (sc, i) {
      var l = listsFor(sc);
      var on = sc.kind === WS.scope.kind && sc.id === WS.scope.id;
      return '<button class="ws-scope' + (on ? " active" : "") + '" data-scope-i="' + i + '" type="button" title="' +
          w.esc(sc.label) + '">' + SCOPE_ICON[sc.kind] + " " + w.esc(sc.label) +
          ' <span class="ws-scope-n">⭐' + l.bookmarks.length + " · ❌" + l.wrong.length + "</span></button>";
    }).join("");
  }

  /* ══════════════ MỞ / ĐÓNG ══════════════ */
  /* tab: "bm" (⭐ Từ đã lưu) | "wrong" (❌ Fix lỗi sai) — không truyền thì
     mở lại tab dùng lần trước. scope: {kind, id} — mở từ chip Block/Batch
     thì lọc sẵn đúng chỗ đó; mở từ thanh trên cùng thì "Tất cả". */
  WS.open = async function (tab, scope) {
    w.Speech.stop();
    if (tab) WS.tab = tab;
    else { try { WS.tab = localStorage.getItem(LS_TAB) === "wrong" ? "wrong" : "bm"; } catch (e) {} }
    try { localStorage.setItem(LS_TAB, WS.tab); } catch (e) {}
    WS._openedFromBlock = (w.Detail && !w.$("#screen-detail").hidden && w.Detail.blockId) ||
                          (scope && scope.kind === "block" ? scope.id : null);
    WS._scopes = scopeOptions();
    WS.scope = scope ? { kind: scope.kind, id: scope.id } : { kind: "all", id: null };
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
    if (!WS.data) return;
    if (WS.data.rows) WS.data.rows[wordId] = Object.assign({}, WS.data.rows[wordId] || { word_id: wordId }, { bookmarked: on });
    if (!WS.isOpen()) return;
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
    var l = listsFor(WS.scope);
    w.$("#ws-n-bm").textContent = l.bookmarks.length;
    w.$("#ws-n-wrong").textContent = l.wrong.length;
    renderScopes();
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
    w.$("#ws-quiz-btn").textContent = WS.tab === "wrong" ? "🎯 Làm lại câu sai" : "🔀 Kiểm tra nghĩa";
    var note = w.$("#ws-note");
    if (WS.tab === "wrong") {
      note.textContent = "Từ bạn đang làm sai ở bất kỳ bài kiểm tra nào. \"🎯 Làm lại câu sai\" hỏi lại ĐÚNG câu đã sai (điền từ hoặc nghĩa), từng từ riêng lẻ — đúng là tự bỏ ra khỏi danh sách.";
    } else {
      note.textContent = "Từ bạn đã bấm ☆ ở bảng từ vựng/bài Nghĩa, và từ lưu khi đọc bài (mức 1–4). Bấm ★ để bỏ khỏi danh sách.";
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
        ? '<span class="ws-wrong" title="Sai ' + wr.wrong + " / " + wr.attempts + ' lần làm">✗ ' + wr.wrong + "/" + wr.attempts + "</span>" +
          (WS.tab === "wrong" ? '<div class="ws-ctx">' + w.esc(WS.ctxLabel(wr.ctx)) + "</div>" : "")
        : (x.mastered ? '<span class="ws-ok">✓ Đã thuộc</span>' : "");
      return "<tr data-i=\"" + i + "\">" +
        '<td><div class="term-cell">' +
          '<button class="spk" data-ws-say="' + w.esc(x.term) + '" title="Nghe">🔊</button>' +
          "<b>" + w.esc(x.term) + "</b>" +
          w.Detail.bmBtnHtml(x.id, x.saved) +
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
  /* Dựng đề. Tab "Fix lỗi sai": MỖI TỪ hỏi lại ĐÚNG câu đã làm sai (TJ
     2026-09-25: "lôi đúng câu sai ra kiểm lại... tách lẻ ra để kiểm tra
     đúng từ đó... ko phải làm full block") — ctx do Detail ghi lúc chấm:
       gap     -> đúng câu điền từ đó + đúng 4 đáp án cũ
       meaning -> đúng câu hỏi nghĩa đó (đúng ngôn ngữ VN/EN/CN/ES) + 4 đáp án cũ
     Không có ctx (dữ liệu cũ) hoặc tab ⭐ -> hỏi nghĩa tiếng Việt như trước. */
  var FIELD = { vi: "meaning_vi", en: "def_en", zh: "meaning_zh", es: "meaning_es" };
  var LANG_LBL = { vi: "Nghĩa VN", en: "Nghĩa EN", zh: "Nghĩa CN", es: "Nghĩa ES" };
  function ctxOf(wordId) {
    if (WS.tab !== "wrong" || !WS.data) return null;
    var hit = WS.data.wrong.find(function (x) { return x.word.id === wordId; });
    return hit && hit.ctx ? hit.ctx : null;
  }
  WS.ctxLabel = function (ctx) {
    if (!ctx) return "Nghĩa VN";
    return ctx.t === "gap" ? "Điền từ vào câu" : (LANG_LBL[ctx.lang] || "Nghĩa");
  };
  function meaningDistractors(x, field, pool, extra) {
    var seen = {}; seen[x[field]] = true;
    var others = [];
    shuffle(pool).concat(shuffle(extra)).forEach(function (y) {
      if (others.length >= 3 || y.id === x.id || !y[field] || seen[y[field]]) return;
      seen[y[field]] = true;
      others.push(y[field]);
    });
    return others;
  }
  function buildQuiz() {
    var list = currentWords();
    var extra = ((w.S && w.S.words) || []);
    var picked = shuffle(list).slice(0, Math.min(QUIZ_CAP, list.length));
    var mc = [];
    picked.forEach(function (x) {
      var ctx = ctxOf(x.id);
      if (ctx && ctx.t === "gap" && ctx.text && ctx.text.indexOf("{{GAP}}") >= 0) {
        var opts = (ctx.opts || []).filter(Boolean);
        if (opts.indexOf(x.term) < 0 || opts.length < 2) {
          var terms = shuffle(list.concat(extra).map(function (y) { return y.term; })
            .filter(function (t, i, a) { return t && a.indexOf(t) === i && w.normalizeAnswer(t) !== w.normalizeAnswer(x.term); })).slice(0, 3);
          opts = [x.term].concat(terms);
        }
        mc.push({ kind: "gap", term: x.term, wordId: x.id, text: ctx.text, answer: x.term,
                  options: shuffle(opts), given: null, ctx: ctx });
        return;
      }
      var lang = ctx && ctx.t === "meaning" && FIELD[ctx.lang] ? ctx.lang : "vi";
      var field = FIELD[lang];
      var answer = (ctx && ctx.t === "meaning" && ctx.answer) || x[field] || (lang !== "vi" ? x.meaning_vi : "");
      if (!answer) return;
      if (!x[field]) { lang = "vi"; field = "meaning_vi"; }
      var mopts = ctx && ctx.t === "meaning" && (ctx.opts || []).indexOf(answer) >= 0 && ctx.opts.length >= 2
        ? ctx.opts.slice() : [answer].concat(meaningDistractors(Object.assign({}, x, (function () { var o = {}; o[field] = answer; return o; })()), field, list, extra));
      mc.push({ kind: "meaning", lang: lang, term: x.term, wordId: x.id, answer: answer,
                options: shuffle(mopts), given: null,
                ctx: { t: "meaning", lang: lang, answer: answer, opts: mopts } });
    });
    if (!mc.length) return null;
    return { mc: mc, total: mc.length, graded: false };
  }

  /* Câu điền từ (kind "gap") — trình bày giống tab "Từng câu". */
  function gapQuestionHtml(q, optClass) {
    var shown = !!q.shown, parts = q.text.split("{{GAP}}");
    var optsHtml = q.options.map(function (t, j) {
      return '<button class="' + optClass(t) + '" data-pick="' + w.esc(t) + '"' + (shown ? " disabled" : "") +
        '><span class="mk">' + "ABCD".charAt(j) + ".</span>" + w.esc(t) + "</button>";
    }).join("");
    var explain = shown
      ? '<div class="quiz-feedback ' + (q.ok ? "ok" : "no") + '">' +
          (q.ok ? "✅ Chính xác! Đã gỡ khỏi Fix lỗi sai." : "❌ Đáp án đúng: <b>" + w.esc(q.answer) + "</b>") + "</div>" +
        (w.Detail.answerNote ? w.Detail.answerNote(q.term, q.text) : "")
      : "";
    return '<div class="gap-card">' +
        '<div class="gap-label">Chọn từ đúng điền vào chỗ trống</div>' +
        '<div class="gap-sentence">' + w.esc(parts[0] || "") +
          '<span class="blank' + (q.given ? " has" : "") + (shown ? (q.ok ? " ok" : " no") : "") + '">' +
            (q.given ? w.esc(q.given) : "_ _ _") + "</span>" + w.esc(parts[1] || "") +
        "</div>" +
      "</div>" +
      '<div class="single-grid"><div class="opt-list">' + optsHtml + '</div><div class="single-explain">' + explain + "</div></div>";
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
        (WS.tab === "wrong" ? '<div class="ws-qtype">🎯 Câu bạn từng sai · ' + w.esc(q.kind === "gap" ? "Điền từ vào câu" : (LANG_LBL[q.lang] || "Nghĩa")) + "</div>" : "") +
        (q.kind === "gap" ? gapQuestionHtml(q, optClass) : w.Detail.mcQuestionHtml(q, optClass)) +
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
        q.ok = q.kind === "gap" ? w.normalizeAnswer(q.given) === w.normalizeAnswer(q.answer) : q.given === q.answer;
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
    if (w.S && w.S.wp) w.S.wp[q.wordId] = Object.assign({}, prev, patch, { user_id: u.id, word_id: q.wordId, wrong_open: !q.ok });
    if (WS.data && WS.data.rows) WS.data.rows[q.wordId] = Object.assign({}, WS.data.rows[q.wordId], patch, { wrong_open: !q.ok });
    try {
      await w.DB.saveWordProgress(u.id, q.wordId, patch);
      /* ❌ Fix lỗi sai: đúng -> bỏ khỏi danh sách, sai -> (vẫn) nằm trong. */
      /* sai lại -> giữ đúng câu đó (cập nhật lựa chọn vừa chọn) để lần sau hỏi lại y vậy */
      var ctx = q.ctx ? Object.assign({}, q.ctx, { given: q.given || "" }) : null;
      /* mọi bản trùng cùng chữ (dup_ids) nhận chung kết quả — xem dedupe trong DB.loadWordSets */
      await w.DB.markResults(u.id, WS.dupIdsOf(q.wordId).map(function (id) { return { wordId: id, ok: !!q.ok, ctx: ctx }; }));
      if (!q.ok && WS.data) {
        var wi = WS.data.wrong.find(function (x) { return x.word.id === q.wordId; });
        if (wi && ctx) wi.ctx = ctx;
      }
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
  w.$("#ws-scopes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-scope-i]");
    if (!b) return;
    var sc = WS._scopes[+b.dataset.scopeI];
    if (!sc) return;
    clearTimeout(WS._autoNext);
    w.Speech.stop();
    WS.scope = { kind: sc.kind, id: sc.id };
    WS.quiz = null;
    WS.render();
  });
  /* Chip "⭐ N / ❌ M" ở đầu Block, đầu Batch, trên từng thẻ Block
     (data-ws-open="bm|wrong", data-ws-kind, data-ws-id) — capture để không
     lọt xuống thẻ Block (bấm thẻ = mở Block) hay dải tổng quan (= tab
     Tiến trình). */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest("[data-ws-open]");
    if (!chip) return;
    e.preventDefault();
    e.stopPropagation();
    WS.open(chip.dataset.wsOpen, { kind: chip.dataset.wsKind, id: chip.dataset.wsId });
  }, true);

  /* Dòng word_progress của từ ở Notebook KHÁC (không có trong S.wp) — để
     Detail.isBookmarked biết đúng trạng thái ⭐ đã bấm của từ đó. */
  WS.rowOf = function (wordId) { return WS.data && WS.data.rows && WS.data.rows[wordId]; };
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
