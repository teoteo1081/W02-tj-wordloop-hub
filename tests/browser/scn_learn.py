"""Kịch bản luồng học chính WordLoop trong trình duyệt (PLAN §0.2 "Luồng học chính", TEST §4/§8.1).

Chạy trên Local mode với mã app thật; chỉ dữ liệu (starter), cấu hình Supabase trống và các script CDN bị mock.
Đáp án đúng suy từ fixture, không đọc cờ đúng/sai do app tự chấm; kết quả kiểm bằng dữ liệu đầu ra trong
localStorage (`tjwl_db_v1`) và nội dung DOM, không bằng số lần click.
"""
import json, re
import bw
from wl import (scenario, boot_local, open_block, answer_meaning, fill_sheet, block_progress, word_rows, db_state,
                real_errors, visible_screens, set_clock, VI, SENT, FIXTURE, _term_for_row)

H, MIN, DAY = 3600 * 1000, 60 * 1000, 24 * 3600 * 1000
T0 = bw.NOW_MS
TABS = ["study", "meaning", "quiz", "dictation", "sheet", "single", "progress"]
COUNTER_JS = r"[...document.querySelectorAll('*')].map(e=>e.children.length===0 && e.innerText).filter(t=>t && /^\W*\d+\s*\/\s*\d+\s*$/.test(t))[0] || null"


def active_tab(pg):
    return pg.evaluate("document.querySelector('.dtab.active') && document.querySelector('.dtab.active').dataset.tab")


def redo_meaning(pg, **kw):
    pg.click("#meaning-card >> text=Làm lại")
    pg.wait_for_selector("#meaning-card .exam-idx")
    return answer_meaning(pg, **kw)


# ──────────────────────────────────────────────────────────────────────────
@scenario(["FLW-01", "FLW-02", "FLW-08", "FLW-09"], "Chuyển 7 tab, 'Hiểu rồi' mở Nghĩa, các thành phần đã bỏ hẳn không quay lại")
def tabs_and_negatives(sc, env):
    ctx, pg = boot_local(env)
    # FLW-09/08 phủ định trên màn Block trước khi vào Chi tiết
    sc.check(pg.query_selector("#word-ticker, .word-ticker, [class*='wt-']") is None, "không có thanh đánh máy #word-ticker/.wt-*")
    head_btns = pg.evaluate("[...document.querySelectorAll('#screen-blocks .screen-head button')].map(b=>b.innerText.trim())")
    sc.check(not any(t in ("←", "→", "‹", "›") for t in head_btns), "không có mũi tên Batch ở .screen-head", buttons=head_btns)
    bar_btns = pg.evaluate("[...document.querySelectorAll('.batches-bar button')].map(b=>b.innerText.trim())")
    sc.check("←" in bar_btns and "→" in bar_btns, "mũi tên Batch trước/sau nằm trong .batches-bar", buttons=bar_btns)
    open_block(pg, "bl_syn_1", "study")
    diff = pg.evaluate("[...document.querySelectorAll('#screen-detail button')].filter(b=>/^(Dễ|Vừa|Khó|Easy|Medium|Hard)$/i.test(b.innerText.trim())).length")
    sc.eq(diff, 0, "không có nút chọn độ khó Dễ/Vừa/Khó")
    # FLW-01
    for t in TABS:
        pg.click('.dtab[data-tab="%s"]' % t)
        panes = pg.evaluate("[...document.querySelectorAll('#screen-detail .tab-pane.active')].map(e=>e.id)")
        sc.eq(panes, ["pane-" + t], "tab %s bật đúng #pane-%s, các pane khác tắt" % (t, t))
        sc.eq(active_tab(pg), t, "nút tab %s ở trạng thái active" % t)
    sc.check(pg.query_selector("#pane-final") is None, "không tồn tại #pane-final")
    sc.eq(real_errors(ctx), [], "console/pageerror không có lỗi mới trong lúc chuyển tab")
    # FLW-02
    pg.click('.dtab[data-tab="study"]')
    pg.click("#btn-go-exam")
    pg.wait_for_selector('.dtab[data-tab="meaning"].active')
    sc.eq(active_tab(pg), "meaning", "'Hiểu rồi, vào kiểm tra →' mở tab Nghĩa")
    sc.ev("tabs", TABS)


# ──────────────────────────────────────────────────────────────────────────
@scenario(["FLW-03", "FLW-04", "FLW-05", "SRS-01"], "Done qua Nghĩa đẩy SRS thật; học sớm ghi điểm nhưng không đẩy; ôn sớm ≤1 giờ tính đúng hạn")
def srs_timeline(sc, env):
    ctx, pg = boot_local(env)
    open_block(pg, "bl_syn_1", "meaning")
    sc.check(pg.query_selector("#meaning-card #sheet-submit, #meaning-card [id*=submit]") is None, "tab Nghĩa không có nút Nộp bài (tự chấm ở câu cuối)")
    answer_meaning(pg)
    bp = block_progress(pg, "bl_syn_1")
    sc.eq(bp and bp["passed"], True, "10/10 ở thẻ Nghĩa đẩy bp.passed (cả ba thẻ đẩy chu kỳ thật)")
    sc.eq((bp["cycle"], bp["next_review_at"]), (1, T0 + DAY), "lần đạt đầu: cycle=1, ôn tiếp sau đúng 24 giờ (đồng hồ giả)")
    sc.eq([(h["step"], h["at"]) for h in bp["review_history"]], [(1, T0)], "review_history có đúng một mục {step:1, at:T0}")
    sc.eq((bp.get("meaning_passed"), bp.get("meaning_best")), (True, 100), "meaning_passed/meaning_best được ghi")
    a0 = word_rows(pg, "anchor")[0]
    sc.eq((bp.get("last_reviewed_at"), a0.get("last_reviewed_at")), (T0, T0), "last_reviewed_at của Block và của từ = đúng thời điểm làm bài (đồng hồ giả)")
    ev = {"after_first_pass": bp}

    # học sớm: làm lại ngay, cùng đồng hồ
    redo_meaning(pg)
    bp2 = block_progress(pg, "bl_syn_1")
    sc.eq((bp2["cycle"], bp2["next_review_at"], len(bp2["review_history"])), (1, T0 + DAY, 1), "học sớm (trước hạn) KHÔNG đẩy chu kỳ, không thêm review_history")
    anchor = word_rows(pg, "anchor")
    sc.eq(anchor and anchor[0]["attempts"], 2, "học sớm vẫn ghi điểm: attempts của từ tăng lên 2")

    # còn 2 giờ mới tới hạn: vẫn sớm
    set_clock(ctx, T0 + DAY - 2 * H)
    redo_meaning(pg)
    bp3 = block_progress(pg, "bl_syn_1")
    sc.eq((bp3["cycle"], len(bp3["review_history"])), (1, 1), "sớm hơn hạn 2 giờ (ngoài nới 1 giờ): không đẩy")

    # còn 30 phút: trong nới 1 giờ, tính đúng hạn
    set_clock(ctx, T0 + DAY - 30 * MIN)
    redo_meaning(pg)
    bp4 = block_progress(pg, "bl_syn_1")
    sc.eq(bp4["cycle"], 2, "sớm hơn hạn 30 phút (≤1 giờ nới): tính đúng hạn, cycle=2")
    sc.eq([(h["step"], h["at"]) for h in bp4["review_history"]], [(1, T0), (2, T0 + DAY - 30 * MIN)],
          "review_history thêm {step:2, at:lúc ôn} và giữ mục cũ")
    sc.eq(bp4["next_review_at"], T0 + DAY - 30 * MIN + 7 * DAY, "bước 2 → chờ 1 tuần kể từ lúc ôn")
    ev.update({"after_early": bp2, "after_2h_early": bp3, "after_grace": bp4})
    sc.ev("progress_timeline", ev)

    # 4 lần làm → mỗi từ attempts>=3, đúng 100% → đã thuộc (dữ liệu)
    rows = db_state(pg)["word_progress"]
    sc.check(len(rows) == 10 and all(r["mastered"] and r["attempts"] == 4 for r in rows),
             "sau 4 lần đạt: cả 10 từ attempts=4, mastered=true", rows=len(rows))
    # Bộ đếm trên cùng: tổng tính theo chữ KHÁC NHAU (38), không phải 40 dòng. Quan sát: trong lúc còn ở màn
    # Chi tiết bộ đếm vẫn '0 / 38', chỉ cập nhật sau khi tải lại.
    sc.ev("counter_in_detail", pg.evaluate(COUNTER_JS))
    pg.reload(wait_until="load")
    pg.wait_for_function("window.DB && DB.ready && document.querySelector('.block-card')", timeout=15000)
    pg.wait_for_function(r"/10\s*\/\s*38/.test(document.body.innerText)", timeout=8000)
    sc.waited("bộ đếm 'đã thuộc / tổng' = 10/38 sau khi tải lại (tổng đếm theo chữ khác nhau, không phải 40 dòng)")


# ──────────────────────────────────────────────────────────────────────────
def _single_term(pg):
    return _term_for_row(pg.inner_text("#single-card .gap-sentence, #single-card .qtext"))


@scenario(["FLW-03", "FLW-04"], "Ba thẻ bài tập (Nghĩa / Từng câu / Phiếu đầy đủ) đều đẩy chu kỳ thật; Từng câu và Nghĩa tự chấm, Phiếu có nút Nộp bài")
def three_cards_advance_srs(sc, env):
    results = {}
    for card in ("meaning", "single", "sheet"):
        ctx, pg = boot_local(env)
        open_block(pg, "bl_syn_1", card)
        if card == "meaning":
            answer_meaning(pg)
        elif card == "single":
            n = int(re.search(r"/\s*(\d+)", pg.inner_text("#single-card .exam-idx")).group(1))
            sc.check(pg.query_selector("#single-card #sheet-submit") is None, "Từng câu không có nút Nộp bài")
            for i in range(n):
                term = _single_term(pg)
                pg.click('#single-card .opt[data-pick="%s"]' % term)
                if i < n - 1:
                    pg.click("#sg-next")
            pg.wait_for_function("/Đúng \\d+\\/\\d+ câu/.test(document.querySelector('#single-card').innerText)", timeout=8000)
        else:
            fill_sheet(pg)
            sc.check(pg.query_selector("#sheet-submit") is not None, "Phiếu đầy đủ có nút 'Nộp bài' tường minh")
            sc.check(block_progress(pg, "bl_syn_1") is None, "Phiếu chưa nộp thì chưa ghi tiến trình")
            pg.click("#sheet-submit")
            pg.wait_for_function("/Đúng \\d+\\/\\d+/.test(document.querySelector('#sheet-card').innerText)", timeout=8000)
        bp = block_progress(pg, "bl_syn_1")
        sc.check(bp and bp["passed"] and bp["cycle"] == 1 and len(bp["review_history"]) == 1,
                 "thẻ %s đạt ≥80%% → passed, cycle=1, review_history 1 mục" % card, bp=bp)
        results[card] = {k: bp.get(k) for k in ("passed", "cycle", "next_review_at", "review_history", "best_score")} if bp else None
        sc.eq(real_errors(ctx), [], "thẻ %s: console không lỗi" % card)
        ctx.close()
    sc.ev("per_card", results)


# ──────────────────────────────────────────────────────────────────────────
@scenario(["FLW-15", "DB-05", "DB-06", "DB-07"], "⭐ và ❌ nhảy ngay; wrong_open/wrong_ctx đúng; đúng ở LOẠI KHÁC không gỡ, đúng trong màn Fix thì gỡ; câu bỏ trống không tính sai")
def bookmark_and_fix(sc, env):
    ctx, pg = boot_local(env)
    open_block(pg, "bl_syn_1", "meaning")
    pg.wait_for_function("document.querySelector('#btn-fixwrong').innerText.includes('0 từ sai')", timeout=8000)
    sc.waited("ban đầu nút Fix báo 0 từ sai")
    # ⭐ từ đang hiện, rồi trả lời sai đúng từ 'anchor' (nếu chưa tới thì trả đúng)
    first = pg.evaluate("document.querySelector('#meaning-card [data-quiz-say]').dataset.quizSay")
    pg.click("#meaning-card [data-bm]")
    # NGAY = trong <1 giây, nhanh hơn lần đọc lại DB nền 1,5 giây (CLAUDE.md "real time")
    try:
        pg.wait_for_function(r"/0\/1/.test(document.querySelector('#btn-wordset').innerText)", timeout=1000)
        sc.waited("bấm ⭐: số trên nút Ôn riêng đổi NGAY (<1 giây, trước lần đọc lại DB nền 1,5 giây)")
    except Exception:
        sc.check(False, "bấm ⭐: số trên nút Ôn riêng đổi NGAY", text=pg.inner_text("#btn-wordset"))
    asked = answer_meaning(pg, wrong_terms={"anchor"})
    wr = word_rows(pg, "anchor")[0]
    sc.eq(wr["wrong_open"], True, "trả lời sai → wrong_open=true")
    ctxrow = wr["wrong_ctx"]
    sc.check(ctxrow and ctxrow["t"] == "meaning" and ctxrow["answer"] == VI["anchor"] and len(ctxrow["opts"]) == 4 and ctxrow["given"] != VI["anchor"],
             "wrong_ctx lưu loại 'meaning', đáp án, đúng 4 lựa chọn, câu đã chọn sai", wrong_ctx=ctxrow)
    try:
        pg.wait_for_function("document.querySelector('#btn-fixwrong').innerText.includes('1 từ sai')", timeout=1000)
        sc.waited("trả lời sai: số ❌ nhảy lên 1 từ sai NGAY (<1 giây)")
    except Exception:
        sc.check(False, "trả lời sai: số ❌ nhảy lên 1 từ sai NGAY", text=pg.inner_text("#btn-fixwrong"))
    bm = word_rows(pg, first)[0]
    sc.eq(bm.get("bookmarked"), True, "từ vừa ⭐ lưu bookmarked=true")
    others = [r for r in db_state(pg)["word_progress"] if r["word_id"] != word_rows(pg, "anchor")[0]["word_id"]]
    sc.check(all(not r.get("wrong_open") for r in others), "các từ trả lời đúng không bị đánh wrong_open")

    # đúng ở LOẠI KHÁC (điền từ ở Phiếu đầy đủ) → KHÔNG gỡ khỏi Fix
    pg.click('.dtab[data-tab="sheet"]')
    fill_sheet(pg)
    pg.click("#sheet-submit")
    pg.wait_for_function("/Đúng \\d+\\/\\d+/.test(document.querySelector('#sheet-card').innerText)", timeout=8000)
    sc.eq(word_rows(pg, "anchor")[0]["wrong_open"], True, "đúng ở loại KHÁC (điền từ) không gỡ khỏi Fix")

    # làm lại đúng câu đã sai trong màn Fix → gỡ
    pg.click("#btn-fixwrong")
    pg.wait_for_selector("#screen-wordset:not([hidden])")
    pg.click("#ws-quiz-btn")
    pg.wait_for_selector("#ws-body .opt")
    term = pg.evaluate("document.querySelector('#ws-body [data-quiz-say]').dataset.quizSay")
    opts = pg.evaluate("[...document.querySelectorAll('#ws-body .opt')].map(o=>o.dataset.pick)")
    sc.eq(term, "anchor", "màn Fix hỏi lại ĐÚNG từ đã sai")
    sc.eq(sorted(opts), sorted(ctxrow["opts"]), "màn Fix dựng lại ĐÚNG 4 đáp án của câu đã sai")
    pg.click('#ws-body .opt[data-pick="%s"]' % VI["anchor"])
    pg.wait_for_function("document.querySelector('#btn-fixwrong').innerText.includes('0 từ sai')", timeout=5000)
    sc.eq(word_rows(pg, "anchor")[0]["wrong_open"], False, "đúng trong màn Fix → wrong_open=false")
    sc.eq(real_errors(ctx), [], "console không lỗi")
    sc.ev("anchor_row", word_rows(pg, "anchor")[0])
    ctx.close()

    # Câu bỏ trống khi nộp không tính là sai (DB-06) — Block 4, Phiếu để trống hoàn toàn
    ctx, pg = boot_local(env)
    open_block(pg, "bl_syn_1", "sheet")      # Block 1 là Block duy nhất có bài đọc (nên có câu điền từ)
    pg.click("#sheet-submit")
    pg.wait_for_timeout(600)
    wrong = [r for r in db_state(pg).get("word_progress", []) if r.get("wrong_open")]
    sc.eq(len(wrong), 0, "nộp Phiếu bỏ trống hoàn toàn: không từ nào bị đánh wrong_open")
    pg.wait_for_function("document.querySelector('#btn-fixwrong').innerText.includes('0 từ sai')", timeout=8000)
    sc.waited("số ❌ trên thanh trên cùng vẫn 0 từ sai")
    ctx.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["FLW-06"], "Dictation là luyện tập thuần túy: không ghi block_progress/word_progress, không đổi SRS")
def dictation_pure(sc, env):
    ctx, pg = boot_local(env)
    open_block(pg, "bl_syn_1", "dictation")
    before = db_state(pg)
    pg.evaluate("window.__lsLog = []")
    pg.click("#dc-play")
    inp = pg.query_selector("#pane-dictation input, #pane-dictation textarea")
    sc.check(inp is not None, "có ô gõ lại câu nghe được")
    if inp:
        inp.fill("the old ship dropped its anchor")
    pg.click("#dc-check")
    pg.wait_for_timeout(400)
    pg.click("#dc-next")
    pg.click('.dtab[data-tab="progress"]')
    after = db_state(pg)
    sc.eq(after.get("block_progress"), before.get("block_progress"), "block_progress không đổi sau khi dùng Dictation")
    sc.eq(after.get("word_progress"), before.get("word_progress"), "word_progress không đổi sau khi dùng Dictation")
    writes = [e for e in pg.evaluate("window.__lsLog") if e["op"] == "setItem" and e["key"] == "tjwl_db_v1"]
    sc.eq(writes, [], "không có lần ghi tjwl_db_v1 nào trong lúc dùng Dictation")
    speaks = [e for e in pg.evaluate("window.__stubLog") if e["n"] == "speak"]
    sc.check(len(speaks) >= 1, "nút 'Nghe câu' gọi speechSynthesis (stub ghi lại)", speaks=len(speaks))
    sc.eq(real_errors(ctx), [], "console không lỗi")
    ctx.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["LS-01", "FLW-15"], "Lưu và tải lại: tiến trình, ⭐/❌ và Block Done còn nguyên sau reload; ghi nhật ký khóa localStorage")
def persistence_reload(sc, env):
    ctx, pg = boot_local(env)
    open_block(pg, "bl_syn_1", "meaning")
    pg.evaluate("window.__lsLog = []")
    pg.click("#meaning-card [data-bm]")
    answer_meaning(pg, wrong_terms={"bridge"})
    log = bw.ls_log(pg)
    snap = db_state(pg)
    badge_before = (pg.inner_text("#btn-wordset"), pg.inner_text("#btn-fixwrong"))
    pg.reload(wait_until="load")
    pg.wait_for_function("window.DB && DB.ready && document.querySelector('.block-card')", timeout=15000)
    after = db_state(pg)
    for k in ("block_progress", "word_progress"):
        sc.eq(after.get(k), snap.get(k), "%s giữ nguyên sau khi tải lại" % k)
    pg.wait_for_function("document.querySelector('#btn-fixwrong').innerText.includes('1 từ sai')", timeout=8000)
    badge_after = (pg.inner_text("#btn-wordset"), pg.inner_text("#btn-fixwrong"))
    sc.eq(badge_after, badge_before, "số ⭐/❌ trên thanh trên cùng giống hệt sau khi tải lại")
    card = pg.inner_text('.block-card[data-block="bl_syn_1"]')
    sc.check("Chưa học" not in card, "thẻ Block 1 không còn 'Chưa học' sau khi tải lại", card=card[:120])
    last = pg.evaluate("localStorage.getItem('tjwl_last_block_v1')")
    sc.eq((visible_screens(pg), json.loads(last)), (["screen-detail"], {"blockId": "bl_syn_1", "tab": "meaning"}),
          "tải lại: app mở lại đúng Block và tab đang học dở (tjwl_last_block_v1), không về danh sách")
    sc.eq(real_errors(ctx), [], "console không lỗi sau khi tải lại")
    keys = bw.ls_keys(pg)
    sc.check({"tjwl_db_v1", "tjwl_users_v1", "tjwl_current_user_v1"} <= set(keys), "các khóa nền có mặt", keys=keys)
    sc.ev("ls_keys_final", keys)
    ops = bw.shape_summary(log)
    writes = sorted({o[2] for o in ops if o[1] == "setItem" and o[0] == "localStorage"})
    reads = {o[2] for o in ops if o[1] == "getItem" and o[0] == "localStorage"}
    sc.eq(writes, ["tjwl_daily_log_v1", "tjwl_db_v1"], "LS-01: khi ⭐ + làm bài, app GHI đúng hai khóa localStorage này (không khóa lạ)")
    sc.check({"tjwl_bookmarks_v1", "tjwl_wrong_open_v1", "tjwl_daily_log_v1"} <= reads, "LS-01: các khóa đã biết được ĐỌC (bookmarks, wrong_open, daily_log)", reads=sorted(reads))
    sc.ev("ls_ops_during_answer", bw.shape_summary(log))
    sc.ev("badges", badge_after)
    ctx.close()
