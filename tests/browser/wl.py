"""wl — helper cho kịch bản WordLoop (Local mode) và khung kết quả kịch bản."""
import json, os, re, traceback
import bw

KEYS_404 = "/js/keys.local.js"     # tệp riêng của máy TJ, không nằm trong repo: 404 là hành vi đã biết (CLAUDE.md)
GA4 = "https://www.googletagmanager.com/gtag/js?id=G-6X5S109XKM"
SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"
PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"
EMPTY_JS = (200, "application/javascript", "")


class Scenario:
    """Gom assertion mềm (không dừng ở lỗi đầu tiên) + bằng chứng quan sát để so baseline/nhánh."""

    def __init__(self, ids, name):
        self.ids, self.name = ids, name
        self.checks, self.evidence, self.notes = [], {}, []

    def check(self, cond, msg, **detail):
        self.checks.append({"ok": bool(cond), "msg": msg, **({"detail": detail} if detail else {})})
        return bool(cond)

    def eq(self, actual, expected, msg):
        ok = actual == expected
        self.checks.append({"ok": ok, "msg": msg, **({} if ok else {"actual": actual, "expected": expected})})
        return ok

    def ev(self, key, value):
        self.evidence[key] = value


def run_scenario(fn, env):
    sc = Scenario(getattr(fn, "ids", []), getattr(fn, "title", fn.__name__))
    try:
        fn(sc, env)
        status = "PASS" if sc.checks and all(c["ok"] for c in sc.checks) else "FAIL"
        if not sc.checks:
            status = "FAIL"; sc.notes.append("kịch bản không có assertion nào")
        err = None
    except Exception as e:   # lỗi hạ tầng/UI không như mong đợi = FAIL, không nuốt
        status, err = "FAIL", "".join(traceback.format_exception_only(type(e), e)).strip()[:600]
    return {"fn": fn.__name__, "ids": sc.ids, "name": sc.name, "status": status, "error": err,
            "checks": sc.checks, "evidence": sc.evidence, "notes": sc.notes}


def scenario(ids, title):
    def deco(fn):
        fn.ids, fn.title = ids, title
        return fn
    return deco


# ───────────────────────── khởi động Local mode ─────────────────────────
def local_mocks(root):
    """Mock KHAI BÁO cho Local mode: config không URL Supabase (đúng như bản không cấu hình Cloud),
    starter tổng hợp thay thư viện thật, version khớp starter."""
    cfg = open(os.path.join(root, "js", "config.js"), encoding="utf-8").read()
    cfg = re.sub(r'SUPABASE_URL:\s*"[^"]*"', 'SUPABASE_URL: ""', cfg)
    cfg = re.sub(r'SUPABASE_ANON_KEY:\s*"[^"]*"', 'SUPABASE_ANON_KEY: ""', cfg)
    starter = bw.read_fixture("synthetic-starter.json")
    ver = json.dumps({"version": json.loads(starter)["version"]}).encode()
    return {"/js/config.js": (200, "application/javascript", cfg),
            "/data/starter.json": (200, "application/json", starter),
            "/data/starter.version.json": (200, "application/json", ver)}


def local_stubs():
    return {bw_url: EMPTY_JS for bw_url in (GA4, SUPABASE_CDN, PDFJS)}


FIXTURE = json.loads(bw.read_fixture("synthetic-starter.json"))
VI = {w["term"]: w["meaning_vi"] for w in FIXTURE["words"]}


def boot_local(env, viewport="desktop", seed=29, path="/index.html", now_ms=bw.NOW_MS, ctx=None):
    ctx = ctx or env.browser.context(env.site, viewport=viewport, seed=seed, mocks=local_mocks(env.site.root),
                                     stubs=local_stubs(), now_ms=now_ms)
    pg = env.browser.page(ctx)
    pg.goto(env.site.origin + path, wait_until="load")
    pg.wait_for_function("window.DB && DB.ready && document.querySelector('.block-card')", timeout=15000)
    return ctx, pg


def real_errors(ctx):
    """Lỗi console/pageerror ngoài hành vi đã biết (keys.local.js 404, ghi nhận trong báo cáo)."""
    out = []
    for e in ctx.errors:
        if e["kind"] == "console.error" and "404" in e["text"] and ctx.guard.site.served.get(KEYS_404, {}).get("status") == 404:
            continue
        out.append(e)
    return out


def db_state(pg):
    return json.loads(pg.evaluate("localStorage.getItem('tjwl_db_v1')"))


def block_progress(pg, block_id):
    rows = [r for r in db_state(pg).get("block_progress", []) if r["block_id"] == block_id]
    return rows[0] if rows else None


def word_rows(pg, term):
    wid = next(w["id"] for w in FIXTURE["words"] if w["term"] == term)
    return [r for r in db_state(pg).get("word_progress", []) if r["word_id"] == wid]


def open_block(pg, block_id, tab="study"):
    pg.click('[data-open="%s"][data-quicktab="%s"]' % (block_id, tab))
    pg.wait_for_selector('.dtab[data-tab="%s"].active' % tab)


def visible_screens(pg):
    return pg.evaluate("[...document.querySelectorAll('section[id^=screen-]')].filter(s=>!s.hidden).map(s=>s.id)")


def answer_meaning(pg, wrong=(), wrong_terms=()):
    """Trả lời hết câu ở tab Nghĩa. `wrong` = tập chỉ số câu (0-based), `wrong_terms` = tập từ, cố ý chọn sai.
    Chọn bằng cách CLICK đáp án; đáp án đúng suy từ fixture (meaning_vi của từ hiển thị), không đọc cờ của app."""
    pg.wait_for_selector("#meaning-card .exam-idx")
    n = int(re.search(r"/\s*(\d+)", pg.inner_text("#meaning-card .exam-idx")).group(1))
    asked = []
    for i in range(n):
        term = pg.evaluate("document.querySelector('#meaning-card [data-quiz-say]').dataset.quizSay")
        opts = pg.evaluate("[...document.querySelectorAll('#meaning-card .opt')].map(o=>o.dataset.pick)")
        right = VI[term]
        pick = right if (i not in wrong and term not in wrong_terms) else next(o for o in opts if o != right)
        asked.append(term)
        pg.click('#meaning-card .opt[data-pick="%s"]' % pick)
        if i < n - 1:
            pg.click("#mn-next")
    pg.wait_for_function(r"/Đúng \d+\/\d+ câu/.test(document.querySelector('#meaning-card').innerText)", timeout=8000)
    return asked


def _load_sent():
    import importlib.util
    spec = importlib.util.spec_from_file_location("mf", os.path.join(bw.FIX, "make_fixture.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.SENT


SENT = _load_sent()
def _norm(t):
    return re.sub(r"\s+", " ", t).strip()


_SPLIT = {t: tuple(_norm(x) for x in s[0].split("[%s]" % t)) for t, s in SENT.items()}


def _term_for_row(row_text):
    """Suy từ đúng của một câu có ô trống: khớp phần TRƯỚC và phần SAU ô (một mình phần đầu như 'The' nhập nhằng)."""
    flat = _norm(re.sub(r"^\s*\d+\.\s*", "", row_text))
    hits = [t for t, (before, after) in _SPLIT.items() if flat.startswith(before) and flat.endswith(after)]
    if len(hits) != 1:
        raise AssertionError("không suy ra đúng một từ cho câu %r (khớp %r)" % (flat[:70], hits))
    return hits[0]


def fill_sheet(pg, wrong=()):
    """Điền Phiếu đầy đủ bằng cách click chip vào ô trống đang active; `wrong` = tập chỉ số ô cố ý điền từ khác.
    Đáp án đúng suy từ câu trong fixture, không đọc cờ đúng/sai của app. Chưa bấm Nộp bài."""
    n = pg.evaluate("document.querySelectorAll('#sheet-card .slot').length")
    for i in range(n):
        row = pg.evaluate("document.querySelectorAll('#sheet-card .ex-q')[%d].innerText" % i)
        term = _term_for_row(row)
        chips = pg.evaluate("[...document.querySelectorAll('#sheet-card .wb-chip')].filter(c=>!c.disabled && !c.classList.contains('used')).map(c=>c.dataset.bank)")
        pick = term if i not in wrong else next(c for c in chips if c != term)
        pg.click('#sheet-card .slot[data-gap="%d"]' % i)
        pg.click('#sheet-card .wb-chip[data-bank="%s"]' % pick)
    return n


def set_clock(ctx, ms):
    ctx.clock.set_fixed_time(ms / 1000.0)
