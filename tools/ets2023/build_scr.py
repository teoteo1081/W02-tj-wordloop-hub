# Dựng i18n.scr (lời thoại có mốc thời gian từng lượt nói + câu chứa đáp án) cho Listening Part 1-4 của 1 đề.
#   py build_scr.py N            -> ghi scr_N.json + báo cáo chất lượng căn chỉnh (không đụng DB)
#   py build_scr.py N --push     -> thêm: ghi vào test_items.i18n.scr (cần SUPABASE_PAT trong môi trường)
#
# Nguyên liệu (đều đã có sau quy trình nạp đề):
#   book/lc_raw.json          transcript tiếng Anh + bản dịch tiếng Việt từng hội thoại, trích từ sách chữa (lc_extract.py)
#   audio/t<N>_whisper_w.json Whisper có mốc TỪNG CHỮ
#   cues_<N>.json             mốc từng câu / từng nhóm (q=[a,b], g=[a,b] của hội thoại)
# Cách làm: căn (difflib) chữ trong sách với chữ Whisper nghe được -> mỗi lượt nói nhận a/b = giây tuyệt đối trong file mp3;
# chữ sách bị lỗi OCR (vd "fol or", "of fa") được thay bằng chữ Whisper nghe ra khi chữ sách KHÔNG có trong từ điển còn chữ Whisper có;
# số "44", "45" dính liền đầu câu trong sách = đánh dấu câu chứa đáp án của câu hỏi 44, 45 -> ev.
import json, re, sys, os, difflib
sys.path.insert(0, 'book')
from spellchecker import SpellChecker
try:
    from vnfix2 import fix_vi_en as FIX
except Exception:
    FIX = lambda s: s
N = sys.argv[1]; PUSH = '--push' in sys.argv
RAW = json.load(open('book/lc_raw.json', encoding='utf-8'))[N]
cues = json.load(open('cues_%s.json' % N))
W = json.load(open('audio/t%s_whisper_w.json' % N, encoding='utf-8'))['segs']
WS = [(a, b, t.strip()) for sg in W for a, b, t in sg['w'] if t.strip()]
SP = SpellChecker()
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
known = lambda s: (not re.search(r"[a-z]", s.lower())) or bool(SP.known([re.sub(r"[^a-z]", "", s.lower())]))
MARK = re.compile(r"(?<![\d$.,:/\-])(\d{2,3}(?:,\d{2,3})*)(?=[A-Za-z“\"'‘(])")   # "44I'm" hoặc "41,42I think" (1 chỗ chứa đáp án của 2 câu)
TAG = re.compile(r"(?m)(?:^|(?<=\s))([MW]-[A-Z][a-z]):\s*")


def parse_marks(text):
    """tách đánh dấu số câu dính liền: trả (chữ sạch, [(vị trí trong chữ sạch, số câu)])"""
    out, marks, last = [], [], 0
    for m in MARK.finditer(text):
        out.append(text[last:m.start()])
        for q in m.group(1).split(","): marks.append((len(''.join(out)), int(q)))
        last = m.end()
    out.append(text[last:]); return ''.join(out), marks


def clean_ws(s): return re.sub(r"\s+", " ", s.replace("\n", " ")).strip()


MARK_ANY = re.compile(r"(?<![\d$.,:/\-])(\d{2,3}(?:,\d{2,3})*)(?=[^\W\d_]|[“\"'‘(])")   # số đánh dấu dính liền chữ cái (kể cả chữ có dấu tiếng Việt)


def strip_marks(s): return MARK_ANY.sub("", s)


_G = {}


def gemini_split_vi(en_lines, vn):
    """chia bản dịch tiếng Việt thành đúng len(en_lines) đoạn khớp từng dòng tiếng Anh; None nếu Gemini không làm đúng"""
    if not _G:
        exec(open('gemini_kinds.py', encoding='utf-8').read().split('norm = lambda')[0].replace('IN, OUT = sys.argv[1:3]', ''), _G)
    vn = re.sub(r"^(?:[MW]-[A-Z][a-z]:\s*)", "", vn); vn = TAG.sub("", vn)
    u = ('Có %d dòng tiếng Anh (đánh số 1..%d) và bản dịch tiếng Việt của cả đoạn. Hãy CHIA bản dịch thành đúng %d đoạn, đoạn i dịch dòng i. '
         'Giữ NGUYÊN từng chữ của bản dịch, không sửa/không bỏ/không thêm, chỉ cắt (ghép lại theo thứ tự phải trùng khít bản dịch gốc). Nếu bản dịch gộp 2 dòng thì cắt ở chỗ hợp lý nhất.\\n'
         'Dòng tiếng Anh:\\n%s\\n\\nBản dịch:\\n%s\\n\\nSchema: {"vi":["đoạn 1","đoạn 2",...]}') % (len(en_lines), len(en_lines), len(en_lines), "\\n".join("%d. %s" % (i + 1, t) for i, t in enumerate(en_lines)), vn)
    G = _G
    G['SYS'] = 'Bạn chia bản dịch tiếng Việt theo từng dòng tiếng Anh. Chỉ trả 1 object JSON.'
    for _ in range(3):
        try:
            j = json.loads(re.search(r"\{[\s\S]*\}", G['call'](u)).group(0))["vi"]
            if len(j) == len(en_lines) and re.sub(r"\W+", "", "".join(j)).lower() == re.sub(r"\W+", "", vn).lower(): return j
        except Exception:
            pass
    return None


def split_turns(text):
    """'M-Au: ... W-Br: ...' -> [(sp, text)]; không có thẻ người nói -> 1 lượt sp=''"""
    ps = TAG.split(text)
    if len(ps) == 1: return [("", text)]
    res = []
    if ps[0].strip(): res.append(("", ps[0]))
    for i in range(1, len(ps), 2): res.append((ps[i], ps[i + 1] if i + 1 < len(ps) else ""))
    return res


def split_sentences(text):
    # không tách sau chữ viết tắt (Mr. Ms. Dr. Inc. p.m. ...): mỗi lookbehind độ dài cố định
    pat = r"(?<=[.!?])(?<!\bMr\.)(?<!\bMs\.)(?<!\bDr\.)(?<!\bSt\.)(?<!\bJr\.)(?<!\bSr\.)(?<!\bCo\.)(?<!\bMrs\.)(?<!\bInc\.)(?<!\bLtd\.)(?<!\bvs\.)(?<!\bp\.m\.)(?<!\ba\.m\.)(?<!\bP\.M\.)(?<!\bA\.M\.)(?<!\bU\.S\.)(?<!\bNo\.)\s+(?=[A-Z0-9“\"‘(])"
    return [x for x in re.split(pat, text) if x.strip()]


def build_lines(en, vn, mono):
    """en/vn: chữ thô. mono=True (Part 4 độc thoại): tách theo câu. Trả [{sp,t,marks,vi}]"""
    te, tv = split_turns(en), split_turns(vn or "")
    lines = []
    for sp, t in te:
        parts = split_sentences(t) if mono else [t]
        for p in parts: lines.append({"sp": sp, "raw": p})
    # bản dịch: chỉ gán khi số đoạn khớp 1-1
    vi_parts = []
    for sp, t in tv:
        parts = split_sentences(t) if mono else [t]
        vi_parts += parts
    if vn and len(vi_parts) == len(lines):
        for L, v in zip(lines, vi_parts): L["vi"] = clean_ws(FIX(clean_ws(strip_marks(v))))
    elif vn:   # số đoạn không khớp 1-1 -> nhờ Gemini chia bản dịch theo từng dòng tiếng Anh (tự kiểm: ghép lại phải trùng bản dịch gốc)
        segs = gemini_split_vi([parse_marks(L["raw"])[0] for L in lines], strip_marks(clean_ws(vn)))
        if segs:
            for L, v in zip(lines, segs): L["vi"] = clean_ws(FIX(v))
    for L in lines:
        t, mk = parse_marks(L.pop("raw")); L["t"] = clean_ws(t); L["marks"] = mk
    return lines


def tokenize(lines):
    toks = []   # {raw, n, line, mark}
    for li, L in enumerate(lines):
        t = L["t"]; pos = 0
        for m in re.finditer(r"\S+", t):
            toks.append({"raw": m.group(0), "n": norm(m.group(0)), "line": li, "pos": m.start(), "mark": []})
        for (cp, qn) in L.get("marks", []):   # đánh dấu gắn vào token đầu tiên có pos >= cp (chữ sạch đã bỏ số)
            # cp tính trên chuỗi chưa clean_ws; xấp xỉ: tìm token gần nhất theo tỉ lệ
            tk = [x for x in toks if x["line"] == li]
            if not tk: continue
            idx = min(range(len(tk)), key=lambda k: abs(tk[k]["pos"] - cp))
            tk[idx]["mark"].append(qn)
    return toks


def align(toks, lo, hi):
    ws = [w for w in WS if lo <= w[0] and w[1] <= hi]
    A = [norm(w[2]) for w in ws]; B = [x["n"] for x in toks]
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    match = {}; repl = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1): match[j1 + k] = i1 + k
        elif tag == "replace" and j2 - j1 >= 1 and i2 - i1 >= 1: repl.append((i1, i2, j1, j2))
    return ws, match, repl, sm.ratio()


def repair(toks, ws, match, repl):
    """thay đoạn chữ sách (có chữ lạ ngoài từ điển) bằng đoạn Whisper nghe ra (toàn chữ có trong từ điển) khi đủ giống"""
    n_fix = 0
    for i1, i2, j1, j2 in repl:
        T = toks[j1:j2]; Ww = ws[i1:i2]
        if len(T) == len(Ww):   # cặp 1-1: chữ sách lạ (ngoài từ điển) + chữ Whisper có trong từ điển + gần giống -> thay từng chữ ("ln" -> "in")
            done = 0
            for k, (x, w) in enumerate(zip(T, Ww)):
                wn = norm(w[2]); r = difflib.SequenceMatcher(None, x["n"], wn).ratio()
                if x["n"] and not known(x["raw"]) and known(w[2]) and (r >= 0.6 or (len(wn) <= 3 and r >= 0.5)):
                    p = re.search(r"[.,!?;:”\"')]+$", x["raw"]); new = w[2].strip(".,!?;:\"“”")
                    if x["raw"][:1].isupper(): new = new[:1].upper() + new[1:]
                    x["raw"] = new + (p.group(0) if p else ""); x["n"] = norm(x["raw"]); match[j1 + k] = i1 + k; done += 1
            if done == len(T): n_fix += 1; continue
        if abs(len(T) - len(Ww)) > 3: continue
        tt = " ".join(x["n"] for x in T); wt = " ".join(norm(w[2]) for w in Ww)
        same_glued = tt.replace(" ", "") == wt.replace(" ", "")   # chỉ khác chỗ cách chữ: "of fa" / "off a", "Aman" / "A man"
        if not same_glued:
            if difflib.SequenceMatcher(None, tt, wt).ratio() < 0.6: continue
            if all(known(x["raw"]) for x in T): continue
            if not all(known(w[2]) for w in Ww): continue
        marks = [m for x in T for m in x["mark"]]
        punct_end = re.search(r"[.,!?;:”\"')]+$", T[-1]["raw"]); punct_end = punct_end.group(0) if punct_end else ""
        new = [w[2].strip(".,!?;:\"“”") for w in Ww]
        if T[0]["raw"][:1].isupper() and new: new[0] = new[0][:1].upper() + new[0][1:]
        new[-1] += punct_end
        for k, x in enumerate(T):
            x["raw"] = new[k] if k < len(new) else ""; x["n"] = norm(x["raw"])
            if k < len(new): match[j1 + k] = i1 + k
        if len(new) > len(T): T[-1]["raw"] += " " + " ".join(new[len(T):])
        if marks: T[0]["mark"] = marks
        n_fix += 1
    return n_fix


def times(lines, toks, ws, match, lo, hi):
    """a/b mỗi dòng từ các token đã khớp; dòng không khớp -> nội suy theo độ dài"""
    for li, L in enumerate(lines):
        idx = [i for i, x in enumerate(toks) if x["line"] == li]; L["_idx"] = idx
        mt = [i for i in idx if i in match]
        L["_cov"] = len(mt) / max(1, len(idx))
        if mt:
            first, last = mt[0], mt[-1]
            L["a"] = ws[match[first]][0] - 0.25 * (first - idx[0]) * 0.3
            L["b"] = ws[match[last]][1] + 0.3 * (idx[-1] - last) * 0.3
    # nội suy dòng thiếu mốc
    for li, L in enumerate(lines):
        if "a" in L: continue
        pa = next((lines[k]["b"] for k in range(li - 1, -1, -1) if "b" in lines[k]), lo)
        nb = next((lines[k]["a"] for k in range(li + 1, len(lines)) if "a" in lines[k]), hi)
        run = [k for k in range(li, len(lines)) if "a" not in lines[k]]
        tot = sum(len(lines[k]["t"]) + 8 for k in run); t = pa
        for k in run:
            d = (nb - pa) * (len(lines[k]["t"]) + 8) / tot; lines[k]["a"], lines[k]["b"] = t, t + d; t += d
    for li, L in enumerate(lines):   # a/b hợp lệ, không đảo
        L["a"] = round(max(lo, L["a"]), 2); L["b"] = round(min(hi + 1.0, max(L["b"], L["a"] + 0.6)), 2)


def ev_of(lines, toks):
    ev = {}
    for L in lines:
        for (cp, qn) in L.get("marks", []):
            if str(qn) in ev: continue
            t = L["t"]; tk = [x for x in toks if x["mark"] and qn in x["mark"] and toks.index(x) in L["_idx"]]
            if not tk: continue
            start = tk[0]["pos"] if tk else 0
            seg = t[start:]; m = re.search(r"[.!?](\s|$)", seg); seg = seg[:m.end()].strip() if m else seg
            if len(seg) < 12: seg = t[start:start + 110]
            ev[str(qn)] = seg[:160]
    return ev


def finish_line(L, toks):
    L["t"] = clean_ws(" ".join(x["raw"] for x in toks if x["line"] == L["_li"]))


def make_scr(lines, lo, hi, rep, tag):
    toks = tokenize(lines)
    ws, match, repl, ratio = align(toks, lo, hi)
    nfix = repair(toks, ws, match, repl)
    for li, L in enumerate(lines): L["_li"] = li
    times(lines, toks, ws, match, lo, hi)
    for L in lines: L["t"] = clean_ws(" ".join(x["raw"] for x in toks if x["line"] == L["_li"]))
    # tính lại vị trí token trong chữ đã sửa để cắt ev
    toks2 = tokenize([{"t": L["t"], "marks": []} for L in lines])
    pos_by_line = {}
    for x in toks2: pos_by_line.setdefault(x["line"], []).append(x["pos"])
    for x in toks:
        pass
    cnt = {}
    ev = {}
    for li, L in enumerate(lines):
        seq = [x for x in toks if x["line"] == li]
        for k, x in enumerate(seq):
            for qn in x["mark"]:
                if str(qn) in ev: continue
                words = L["t"].split(" ")
                start = len(" ".join(words[:k])) + (1 if k else 0) if k < len(words) else 0
                seg = L["t"][start:]; m = re.search(r"[.!?](\s|$)", seg); seg = seg[:m.end()].strip() if m else seg
                if len(seg) < 12: seg = L["t"][start:start + 110]
                ev[str(qn)] = seg[:160]
    cov = sum(L["_cov"] for L in lines) / max(1, len(lines))
    rep.append((tag, round(ratio, 2), round(cov, 2), nfix, len(lines)))
    out = [dict({"sp": L["sp"], "t": L["t"], "a": L["a"], "b": L["b"]}, **({"vi": L["vi"]} if L.get("vi") else {})) for L in lines]
    return {"lines": out, "ev": ev}


def opt_lines(en, vn):
    """Part 1-2: 'câu hỏi A. ... B. ... C. ...' -> các dòng '(A) ...'; phần trước A. là câu hỏi (Part 2)"""
    def split(txt):
        txt = clean_ws(txt); ms = list(re.finditer(r"(?:(?<=\s)|^)([A-D])\.\s", txt))
        if not ms: return txt, []
        head = txt[:ms[0].start()].strip(); opts = []
        for i, m in enumerate(ms): opts.append((m.group(1), txt[m.end():(ms[i + 1].start() if i + 1 < len(ms) else len(txt))].strip()))
        return head, opts
    h, o = split(en); hv, ov = split(vn or "")
    lines = []
    if h: lines.append({"sp": "", "t": h, "marks": [], "vi": clean_ws(FIX(hv)) if hv else None})
    for k, (lab, tx) in enumerate(o):
        vi = None
        if len(ov) == len(o): vi = clean_ws(FIX(strip_marks(ov[k][1])))
        lines.append({"sp": "", "t": "(%s) %s" % (lab, tx), "marks": [], "vi": vi})
    return lines


result = {}; report = []
ITEMS_LC34 = {}
try:
    for x in json.load(open('lc34_%s.json' % N, encoding='utf-8'))['items']: ITEMS_LC34[x['num']] = x
except Exception:
    pass


def reload_whisper():
    global WS
    W2 = json.load(open('audio/t%s_whisper_w.json' % N, encoding='utf-8'))['segs']
    WS = [(a, b, t.strip()) for sg in W2 for a, b, t in sg['w'] if t.strip()]


def retranscribe(lo, hi):
    """Whisper (có VAD) hay bỏ sót đoạn nói -> nghe lại riêng đoạn này không VAD rồi nạp lại"""
    import subprocess
    print("   nghe lại đoạn %.0f-%.0f (Whisper bỏ sót chữ)" % (lo, hi), flush=True)
    subprocess.run([sys.executable, 'whisper_slice.py', N, str(max(0, lo)), str(hi)], capture_output=True)
    reload_whisper()


def run_scr(gen, lo, hi, tag):
    """dựng scr; nếu độ phủ thấp VÀ Whisper thiếu chữ -> nghe lại đoạn rồi dựng lại 1 lần"""
    for attempt in (0, 1):
        lines = gen(); before = len(report)
        sc = make_scr(lines, lo, hi, report, tag)
        cov = report[-1][2]
        nwords = sum(1 for w in WS if lo <= w[0] and w[1] <= hi); ntok = sum(len(L["t"].split()) for L in lines)
        if attempt == 0 and cov < 0.7 and nwords < 0.75 * ntok:
            del report[before:]; retranscribe(lo - 1.0, hi + 1.0); continue
        return sc
    return sc


def conv_for_group(g0):
    """hội thoại của nhóm g0: ưu tiên conv có đánh dấu số của chính nhóm; không có -> tìm trong ô của câu liền trước (dữ liệu sách bị dính)"""
    want = {g0, g0 + 1, g0 + 2}
    for k in (g0, g0 + 1, g0 + 2):
        r = RAW.get(str(k)); c = (r or {}).get("conv")
        if c and c.get("en"):
            nums = {int(q) for m in MARK.finditer(c["en"]) for q in m.group(1).split(",")}
            if nums & want: return c
    prev = RAW.get(str(g0 - 1))
    if prev and prev.get("cells"):   # hội thoại dính ngay sau đáp án D của câu trước
        en = clean_ws(prev["cells"][0]); it = ITEMS_LC34.get(g0 - 1)
        if it and len(it["opts"]) == 4:
            dtxt = clean_ws(re.sub(r"^\(D\)\s*", "", it["opts"][3])); k = en.find(dtxt[:30]) if dtxt else -1
            if k >= 0:
                rest = en[k + len(dtxt):]
                nums = {int(q) for m in MARK.finditer(rest) for q in m.group(1).split(",")}
                if nums & want:
                    print("   nhóm %d: hội thoại lấy từ ô của câu %d (sách bị dính)" % (g0, g0 - 1))
                    return {"en": rest, "vn": None}
    return None


# --- Part 1-2: từng câu
for n in range(1, 32):
    r = RAW.get(str(n)); c = cues.get(str(n))
    if not r or not c: continue
    cells = r["cells"]
    lo, hi = c["q"][0] - 0.2, c["q"][1] + 0.2
    gen = (lambda cells=cells: opt_lines(cells[0], cells[1] if len(cells) > 1 else ""))
    if not gen(): continue
    result[n] = run_scr(gen, lo, hi, "p%d-%d" % (1 if n <= 6 else 2, n))
# --- Part 3-4: theo nhóm 3 câu
for g0 in range(32, 101, 3):
    conv = conv_for_group(g0)
    c = cues.get(str(g0))
    if not conv or not c or not c.get("g"): report.append(("p3-4 thiếu dữ liệu", g0)); continue
    mono = g0 >= 71
    lo = c["g"][0]; hi = c["g"][1] + 0.8
    sc = run_scr((lambda conv=conv, mono=mono: build_lines(conv["en"], conv.get("vn"), mono)), lo, hi, "g%d" % g0)
    for k in (g0, g0 + 1, g0 + 2): result[k] = sc
json.dump({str(k): v for k, v in result.items()}, open('scr_%s.json' % N, 'w', encoding='utf-8'), ensure_ascii=False)
print("Test", N, "đã dựng", len(result), "câu | cảnh báo (tỉ lệ khớp thấp):")
for r in report:
    if isinstance(r[1], float) and (r[1] < 0.55 or r[2] < 0.6): print("  ", r)
    elif not isinstance(r[1], float): print("  ", r)
avg = [r[2] for r in report if isinstance(r[1], float)]
print("độ phủ trung bình", round(sum(avg) / max(1, len(avg)), 2), "| số chỗ sửa OCR:", sum(r[3] for r in report if isinstance(r[1], float)))

if PUSH:
    sys.path.insert(0, 'book'); os.environ.setdefault("SUPABASE_PAT", os.environ.get("SBPAT", ""))
    from rc_upload_lib import sql
    rows = []
    for n, sc in sorted(result.items()):
        part = 1 if n <= 6 else 2 if n <= 31 else 3 if n <= 70 else 4
        rows.append({"id": "ets23_t%s_p%d_%d" % (N, part, n), "scr": sc})
    for i in range(0, len(rows), 25):
        js = json.dumps(rows[i:i + 25], ensure_ascii=False); assert "$j$" not in js
        r = sql("update test_items t set i18n = coalesce(t.i18n,'{}'::jsonb) || jsonb_build_object('scr', r.scr) from jsonb_to_recordset($j$" + js + "$j$::jsonb) as r(id text, scr jsonb) where t.id = r.id returning t.id")
    print("đã ghi", len(rows), "dòng test_items.i18n.scr")
