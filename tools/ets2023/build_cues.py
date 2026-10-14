# Mốc audio Listening từ Whisper (mốc từng chữ): py build_cues.py <whisper_w.json> <lc_N.json> <out cues.json>
import json, re, sys
wj, lcj, out = sys.argv[1:4]
W = json.load(open(wj, encoding="utf-8"))
words = []
for sg in W["segs"]:
    for s, e, t in sg["w"]:
        words.append((s, e, re.sub(r"[^a-z0-9\-']", "", t.lower())))
words = [w for w in words if w[2]]
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}


def toint(t):
    if t.isdigit():
        return int(t)
    if t in ONES:
        return ONES.index(t)
    if t == "hundred":
        return 100
    p = t.split("-")
    if p[0] in TENS:
        return TENS[p[0]] + (ONES.index(p[1]) if len(p) > 1 and p[1] in ONES else 0)
    return None


stems = {x["num"]: x["stem"] for x in json.load(open(lcj, encoding="utf-8"))}
ann = {}  # số câu -> index từ "number"
pos = 0
for n in range(1, 101):
    for i in range(pos, len(words) - 1):
        if words[i][2] == "number" and toint(words[i + 1][2]) == n:
            # "number one" của Part 1 câu 1: chấp nhận; tránh khớp "number 2 in your test book"
            if i > 0 and words[i - 1][2] in ("marked", "picture"):
                continue
            ann[n] = i; pos = i + 1; break
# nhóm "questions X through Y"
grp = {}
for i in range(len(words) - 4):
    if words[i][2].startswith("question") and toint(words[i + 1][2]) and words[i + 2][2] == "through" and toint(words[i + 3][2]):
        grp.setdefault(toint(words[i + 1][2]), i)
miss = [n for n in range(1, 101) if n not in ann]


def fuzzy(n, lo, hi):
    """Tìm vị trí đọc câu n (Part 3-4) bằng 4 chữ đầu của đề, trong khoảng index lo..hi."""
    tk = [re.sub(r"[^a-z0-9']", "", x.lower()) for x in stems.get(n, "").split()][:4]
    if len(tk) < 3:
        return None
    for i in range(lo, min(hi, len(words) - len(tk))):
        if all(words[i + j][2] == tk[j] for j in range(len(tk))):
            return i - 2 if i >= 2 else i   # lùi 2 chữ ("number N")
    return None


# điền chỗ thiếu của Part 3-4 bằng so khớp đề
for g0 in sorted(grp):
    g1 = g0 + 2
    for n in range(g0, g1 + 1):
        if n not in ann:
            lo = ann.get(n - 1, grp[g0]) + 1
            hi = ann.get(n + 1, lo + 400)
            r = fuzzy(n, lo, hi)
            if r is not None:
                ann[n] = r
miss2 = [n for n in range(1, 101) if n not in ann]
T = lambda i: round(words[i][0], 2)
annT = {n: T(i) for n, i in ann.items()}
# lượt Whisper không mốc chữ (nếu có) bù chỗ thiếu: lấy giờ bắt đầu đoạn có "Number N"
if len(sys.argv) > 4:
    S = json.load(open(sys.argv[4], encoding="utf-8"))["segs"]
    for n in miss2:
        lo = max([v for k, v in annT.items() if k < n] or [0]); hi = min([v for k, v in annT.items() if k > n] or [1e9])
        for sg in S:
            if lo < sg["s"] < hi and re.search(r"(?i)number\s+(\S+)", sg["t"]):
                for mm in re.finditer(r"(?i)number\s+([\w\-]+)", sg["t"]):
                    if toint(re.sub(r"[^a-z0-9\-]", "", mm.group(1).lower())) == n:
                        annT[n] = sg["s"]; break
                if n in annT:
                    break
cues = {}
# Part 1 + 2
part3 = next((i for i in range(len(words) - 1) if words[i][2] == "part" and words[i + 1][2] in ("three", "3")), None)
part2 = next((i for i in range(len(words) - 1) if words[i][2] == "part" and words[i + 1][2] in ("two", "2")), None)
for n in range(1, 32):
    if n not in annT:
        continue
    nxt = annT.get(n + 1)
    if n == 6:
        nxt = T(part2) if part2 else None
    if n == 31:
        nxt = T(part3) if part3 else None
    s = annT[n] if n != 1 else round(max(0, annT[1] - 3), 2)
    cues[n] = {"q": [s, nxt]}
# Part 3 + 4
for g0 in sorted(grp):
    gi = grp[g0]
    first = annT.get(g0)
    if first is None:
        continue
    g = [T(gi), round(first - 1.0, 2)]
    for n in range(g0, g0 + 3):
        if n not in annT:
            continue
        ntok = len(stems.get(n, "").split())
        if n in ann:
            e = round(words[min(ann[n] + 1 + ntok, len(words) - 1)][1] + 0.3, 2)
        else:
            e = round(annT[n] + 0.5 * (ntok + 2) + 0.3, 2)
        nxt = annT.get(n + 1)
        if nxt and e > nxt:
            e = nxt
        cues[n] = {"q": [annT[n], e], "g": g}
nm = sorted(set(range(1, 101)) - set(cues))
json.dump({str(k): v for k, v in sorted(cues.items())}, open(out, "w"), indent=1)
print("announce tìm thấy", len(ann), "- thiếu sau fuzzy:", miss2, "- nhóm", len(grp), "- cues", len(cues), "- không có cue:", nm)


# bù nhóm không có trong lượt mốc-từ: lấy tiêu đề nhóm từ lượt đoạn
if len(sys.argv) > 4:
    c2 = json.load(open(out))
    for sg in S:
        mm = re.search(r"(?i)questions?\s+(\d+)\s+through\s+(\d+)", sg["t"])
        if not mm:
            continue
        g0 = int(mm.group(1))
        if str(g0) in c2 or g0 not in annT:
            continue
        g = [sg["s"], round(annT[g0] - 1.0, 2)]
        for n in range(g0, int(mm.group(2)) + 1):
            if n in annT:
                ntok = len(stems.get(n, "").split())
                e = round(annT[n] + 0.5 * (ntok + 2) + 0.3, 2)
                if annT.get(n + 1) and e > annT[n + 1]:
                    e = annT[n + 1]
                c2[str(n)] = {"q": [annT[n], e], "g": g}
    json.dump(dict(sorted(c2.items(), key=lambda kv: int(kv[0]))), open(out, "w"), indent=1)
    print("sau bù nhóm:", len(c2), "cue; thiếu:", sorted(set(range(1, 101)) - set(int(k) for k in c2)))
