"""Luồng WordLoop ở Cloud mode với backend giả (TEST §5 CALL-W01..W04; PLAN M0.5).

Mỗi kịch bản: backend giả mới + một client (hồ sơ host GIẢ, admin), đồng hồ ảo tạm dừng. Bằng chứng gồm
  (a) nhật ký lời gọi chuẩn: kênh, bảng, thao tác, bộ lọc chuẩn hóa, khóa/hình dạng payload, thứ tự;
  (b) trạng thái đã LƯU trong backend (không chỉ màn hình);
  (c) không có tính năng chưa hỗ trợ / lời gọi ngoài kế hoạch.
Nhật ký là quan sát ở ranh giới thư viện (xem fakebackend.py), candidate để review, không phải golden đã duyệt.
"""
import json
import bw, cloudwl
from wl import scenario, answer_meaning, fill_sheet, real_errors, VI, wait_js, RESULT_RX
import scn_learn

HOST = cloudwl.HOST_ID


def boot_cloud(env, label="host", viewport="desktop"):
    cl, be = cloudwl.new_cluster(env.browser, env.site, env.site.root)
    c = cl.client(label, viewport=viewport)
    c.goto("/index.html")
    cloudwl.wait_ready(c, cl)
    cl.run(2000)       # xả hàng đợi nền của app (làm mới số ⭐/❌...)
    return cl, be, c


def view(be, start=0):
    """Nhật ký chuẩn hóa để so sánh: bỏ số thứ tự tuyệt đối và tên client."""
    return [{k: v for k, v in e.items() if k not in ("n", "client")} for e in be.log[start:]]


def rows(be, table, **where):
    return [r for r in be.tables.get(table, []) if all(r.get(k) == v for k, v in where.items())]


def clean(sc, be, c, label):
    sc.eq(be.unsupported, [], "%s: không có truy vấn/hàm chưa hỗ trợ hay lời gọi ngoài kế hoạch" % label)
    sc.eq(be.violations, [], "%s: không chạm phòng/đường dẫn thật" % label)
    sc.eq(real_errors(c.ctx), [], "%s: console không có lỗi" % label)
    sc.eq(c.ctx.guard.blocked, [], "%s: không có request ngoài khai báo" % label)


def rel_progress(r):
    """Thời điểm tuyệt đối phụ thuộc số bước đồng hồ ảo đã tiến → chỉ giữ khoảng chênh tương đối (ổn định)."""
    if not r:
        return None
    out = {k: r.get(k) for k in ("passed", "cycle", "meaning_passed", "best_score") if k in r}
    hist = r.get("review_history") or []
    out["review_steps"] = [h["step"] for h in hist]
    if hist and r.get("next_review_at"):
        out["next_review_after_last_ms"] = r["next_review_at"] - hist[-1]["at"]
    return out


def rest_ops(be, table=None):
    return [(e["op"], e["obj"]) for e in be.log if e["ch"] == "rest" and (table is None or e["obj"] == table)]


def wait_text(cl, c, sel, needle, what, timeout=8000):
    cl.settle(lambda: needle in c.page.evaluate("document.querySelector(%s) ? document.querySelector(%s).innerText : ''" % (json.dumps(sel), json.dumps(sel))),
              timeout_ms=timeout, what=what)


def open_block_c(cl, c, block_id, tab):
    c.page.click('[data-open="%s"][data-quicktab="%s"]' % (block_id, tab))
    c.page.wait_for_selector('.dtab[data-tab="%s"].active' % tab)
    cl.run(500)


# ──────────────────────────────────────────────────────────────────────────
@scenario(["CALL-W01"], "Khởi động Cloud với hồ sơ host giả: DB.init → Auth.init → nạp Hub/Notebook → Journey (nhật ký lời gọi)")
def call_w01(sc, env):
    cl, be, c = boot_cloud(env)
    pg = c.page
    ops = rest_ops(be)
    sc.eq(ops[0], ("select", "hubs"), "DB.init dò kết nối bằng select hubs (limit 1) trước tiên")
    sc.check(("select", "profiles") in ops and ops.index(("select", "profiles")) > 0, "Auth.init đọc profiles sau khi DB.init")
    sc.eq(pg.evaluate("[DB.mode, Auth.user.id, Auth.user.admin, DB.progressCloud]"), ["cloud", HOST, True, True],
          "Cloud mode, đăng nhập đúng hồ sơ host giả bằng link mặc định localhost, tiến trình dùng Cloud")
    sc.check(any(e["obj"] == "site_visits" and e["op"] == "upsert" for e in be.log), "ghi site_visits (upsert) sau khi đăng nhập")
    sc.check(any(e["obj"] == "sections" and "pages(*" in (e.get("cols") or "") for e in be.log), "nạp Notebook bằng truy vấn lồng sections→pages→batches→blocks→words")
    boot_calls = view(be)
    pg.click("#btn-journey")
    pg.wait_for_selector("#screen-journey:not([hidden])")
    cl.run(5000)
    j = [e for e in view(be, len(boot_calls))]
    sc.check(len(j) > 0, "mở Journey phát sinh lời gọi đọc tiến trình", n=len(j))
    sc.check(all(e["op"] == "select" for e in j if e["ch"] == "rest"), "Journey chỉ ĐỌC (không ghi)", ops=sorted({e["op"] for e in j}))
    sc.check(not any(e["obj"] in ("block_progress", "word_progress") and any(str(f[2]).startswith("us_") for f in e["filters"] if len(f) > 2) for e in j),
             "không gửi id hồ sơ local (us_…) lên block_progress/word_progress (CL-01)")
    clean(sc, be, c, "W01")
    sc.ev("calls_boot", cloudwl.canon(boot_calls))
    sc.ev("calls_journey", cloudwl.canon(j))
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["CALL-W02", "FLW-04"], "Mở Block → tab Nghĩa → trả lời hết → tự chấm → ghi tiến trình lên backend; tải lại vẫn còn")
def call_w02(sc, env):
    cl, be, c = boot_cloud(env)
    pg = c.page
    open_block_c(cl, c, "bl_syn_1", "meaning")
    start = len(be.log)
    answer_meaning(pg, pump=lambda: cl.run(100))
    cl.run(5000)
    calls = view(be, start)
    bp = rows(be, "block_progress", user_id=HOST, block_id="bl_syn_1")
    sc.eq(len(bp), 1, "backend có đúng một dòng block_progress của host cho Block 1")
    if bp:
        r = bp[0]
        sc.check(r["passed"] is True and r["cycle"] == 1 and r["meaning_passed"] is True and r["best_score"] == 100,
                 "đã LƯU: passed, cycle=1, meaning_passed, best_score=100", row={k: r.get(k) for k in ("passed", "cycle", "meaning_passed", "best_score")})
        sc.eq([h["step"] for h in r["review_history"]], [1], "đã LƯU review_history với đúng một bước")
    wp = rows(be, "word_progress", user_id=HOST)
    sc.check(len(wp) == 10 and all(x["attempts"] == 1 and x["correct"] == 1 for x in wp), "đã LƯU word_progress cho 10 từ (attempts=1, correct=1)", n=len(wp))
    writes = [(e["op"], e["obj"]) for e in calls if e["ch"] == "rest" and e["op"] in ("insert", "upsert", "update", "delete")]
    sc.check(("upsert", "block_progress") in writes and ("upsert", "word_progress") in writes, "ghi tiến trình bằng upsert block_progress và word_progress", writes=sorted(set(writes)))
    ups = [e for e in calls if e["obj"] == "word_progress" and e["op"] == "upsert"]
    sc.check(all(e.get("onConflict") == "user_id,word_id" for e in ups), "upsert word_progress dùng onConflict=user_id,word_id")
    # tải lại: dữ liệu đọc LẠI từ backend, không phải bộ nhớ trang
    pg.reload(wait_until="load")
    cloudwl.wait_ready(c, cl)
    cl.run(2000)
    sc.check(pg.evaluate("[...document.querySelectorAll('.block-card')].length") >= 1, "sau tải lại danh sách Block hiện lại")
    sc.eq(rows(be, "block_progress", user_id=HOST, block_id="bl_syn_1")[0]["cycle"], 1, "tải lại không làm đổi/mất tiến trình đã lưu")
    sc.check(any(e["obj"] == "block_progress" and e["op"] == "select" for e in view(be, start)), "tải lại đọc block_progress từ backend")
    clean(sc, be, c, "W02")
    sc.ev("calls_answer", cloudwl.canon(calls))
    sc.ev("stored", {"block_progress": [rel_progress(r) for r in rows(be, "block_progress")],
                     "word_progress_n": len(wp), "word_progress_sample": {k: wp[0].get(k) for k in ("attempts", "correct", "mastered", "wrong_open")} if wp else None})
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["CALL-W03", "FLW-03"], "Phiếu đầy đủ: nộp bài đạt ≥80% → bp.passed và review_history lưu lên backend; bỏ trống không phải câu sai")
def call_w03(sc, env):
    cl, be, c = boot_cloud(env)
    pg = c.page
    open_block_c(cl, c, "bl_syn_1", "sheet")
    fill_sheet(pg, wrong={0, 1})              # 8/10 = 80% → vừa đủ đạt
    start = len(be.log)
    sc.eq(rows(be, "block_progress"), [], "điền xong nhưng CHƯA nộp: chưa có dòng block_progress nào")
    pg.click("#sheet-submit")
    cl.run(5000)
    calls = view(be, start)
    r = (rows(be, "block_progress", user_id=HOST, block_id="bl_syn_1") or [None])[0]
    sc.check(r and r["passed"] is True and r["cycle"] == 1 and len(r["review_history"]) == 1,
             "8/10 (80%) → passed, cycle=1, review_history 1 mục (đã lưu trên backend)", row=r and {k: r.get(k) for k in ("passed", "cycle", "best_score")})
    sc.check(r and 79 <= r["best_score"] <= 81, "best_score ≈ 80", best=r and r["best_score"])
    wrong = [x for x in rows(be, "word_progress", user_id=HOST) if x.get("wrong_open")]
    sc.eq(len(wrong), 2, "đúng 2 từ bị đánh wrong_open (2 ô điền sai), 8 từ đúng không bị đánh")
    for x in wrong:
        sc.check(x["wrong_ctx"] and x["wrong_ctx"]["t"] == "gap" and len(x["wrong_ctx"]["opts"]) >= 2, "wrong_ctx của ô điền từ có loại 'gap' + các lựa chọn", ctx=x["wrong_ctx"] and x["wrong_ctx"]["t"])
    sc.check(("upsert", "block_progress") in [(e["op"], e["obj"]) for e in calls], "nộp bài ghi block_progress bằng upsert")
    clean(sc, be, c, "W03")
    sc.ev("calls_submit", cloudwl.canon(calls))
    sc.ev("stored", {"block_progress": rel_progress(r),
                     "wrong_open_terms": sorted(x["word_id"] for x in wrong)})
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["CALL-W04", "FLW-15", "DB-05", "DB-07"], "⭐ một từ → Ôn riêng → làm một câu sai → Fix lỗi sai làm lại: lời gọi và dữ liệu đã lưu")
def call_w04(sc, env):
    cl, be, c = boot_cloud(env)
    pg = c.page
    open_block_c(cl, c, "bl_syn_1", "meaning")
    first = pg.evaluate("document.querySelector('#meaning-card [data-quiz-say]').dataset.quizSay")
    start = len(be.log)
    pg.click("#meaning-card [data-bm]")
    cl.run(300)
    bm_calls = view(be, start)
    sc.check(any(e["obj"] == "word_progress" and e["op"] == "upsert" and "bookmarked" in e.get("payloadKeys", []) for e in bm_calls),
             "bấm ⭐ → upsert word_progress có cột bookmarked", calls=[(e["op"], e["obj"]) for e in bm_calls])
    wid = next(w["id"] for w in __import__("wl").FIXTURE["words"] if w["term"] == first)
    sc.eq((rows(be, "word_progress", user_id=HOST, word_id=wid) or [{}])[0].get("bookmarked"), True, "backend lưu bookmarked=true cho từ vừa ⭐")
    answer_meaning(pg, wrong_terms={"anchor"}, pump=lambda: cl.run(100))
    cl.run(5000)
    a = (rows(be, "word_progress", user_id=HOST, word_id="w_syn_1_01") or [{}])[0]
    sc.eq((a.get("wrong_open"), (a.get("wrong_ctx") or {}).get("t"), (a.get("wrong_ctx") or {}).get("answer")), (True, "meaning", VI["anchor"]),
          "backend lưu wrong_open=true và wrong_ctx {t:'meaning', answer} cho câu sai")
    # Ôn riêng + Fix
    start2 = len(be.log)
    pg.click("#btn-wordset")
    pg.wait_for_selector("#screen-wordset:not([hidden])")
    cl.run(5000)
    ws = view(be, start2)
    sc.check(any(e["obj"] in ("word_progress", "words") and e["op"] == "select" for e in ws), "mở Ôn riêng đọc word_progress/words từ backend")
    pg.click('#ws-tabs [data-ws="wrong"]')
    cl.run(500)
    pg.click("#ws-quiz-btn")
    pg.wait_for_selector("#ws-body .opt")
    start3 = len(be.log)
    term = pg.evaluate("document.querySelector('#ws-body [data-quiz-say]').dataset.quizSay")
    sc.eq(term, "anchor", "Fix hỏi lại đúng từ đã sai")
    pg.click('#ws-body .opt[data-pick="%s"]' % VI["anchor"])
    cl.run(5000)
    fix = view(be, start3)
    a2 = (rows(be, "word_progress", user_id=HOST, word_id="w_syn_1_01") or [{}])[0]
    sc.eq(a2.get("wrong_open"), False, "làm đúng trong Fix → backend wrong_open=false")
    sc.check(any(e["obj"] == "word_progress" and e["op"] in ("upsert", "update") for e in fix), "làm lại ghi word_progress", calls=[(e["op"], e["obj"]) for e in fix])
    clean(sc, be, c, "W04")
    sc.ev("calls_bookmark", cloudwl.canon(bm_calls))
    sc.ev("calls_wordset_open", cloudwl.canon(ws))
    sc.ev("calls_fix_answer", cloudwl.canon(fix))
    sc.ev("stored", {"anchor_before_fix": {"wrong_open": True, "answer": VI["anchor"]},
                     "anchor_after_fix": {k: a2.get(k) for k in ("wrong_open", "attempts", "correct", "mastered")}})
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["FLW-07"], "Bộ chọn nguồn bài (admin, Cloud): nhóm theo nguồn thật, xem trước có chi phí, 'Dùng bài này' áp dụng và lưu, không mất bài nào")
def flw07_source_picker(sc, env):
    cl, be, c = boot_cloud(env)
    pg = c.page
    open_block_c(cl, c, "bl_syn_1", "study")
    tabs = pg.evaluate("[...document.querySelectorAll('#src-tabs > button')].map(b => [b.dataset.src, b.innerText.trim()])")
    sc.eq([t[0] for t in tabs], ["paste", "paste:0", "claude:0", "openai:0", "gemini:0"],
          "tab: '📝 Dán' (khung soạn) + một khe cho MỖI nguồn thật theo parseMeta (Dán/Claude/OpenAI/Gemini)")
    sc.eq(tabs[0][1], "📝 Dán", "tab đầu là khung dán chưa lưu")
    before = rows(be, "blocks", id="bl_syn_1")[0]
    n_before = len(before["context_passage_candidates"])
    pg.click("#src-tabs >> text=OpenAI 1")
    cl.run(500)
    prev = pg.inner_text("#src-body")
    sc.check("OpenAI tổng hợp" in prev and "~$0.0021" in prev, "xem trước bài OpenAI hiện tiêu đề nguồn và chi phí ước tính", preview=prev[:60])
    start = len(be.log)
    pg.click("#btn-use-source")
    cl.run(5000)
    after = rows(be, "blocks", id="bl_syn_1")[0]
    sc.check("OpenAI tổng hợp" in after["context_passage"], "'Dùng bài này' đặt bài OpenAI làm context_passage (đã LƯU trên backend)")
    sc.eq(len(after["context_passage_candidates"]), n_before, "không bài ứng viên nào bị mất hay nhân đôi sau khi áp dụng")
    sc.check(any(e["obj"] == "blocks" and e["op"] == "update" and "context_passage" in e.get("payloadKeys", []) for e in view(be, start)),
             "áp dụng ghi blocks (update) có cột context_passage")
    clean(sc, be, c, "FLW-07")
    sc.ev("tabs", tabs)
    sc.ev("calls_use_source", cloudwl.canon(view(be, start)))
    cl.close()
