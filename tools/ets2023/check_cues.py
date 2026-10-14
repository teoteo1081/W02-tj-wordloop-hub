# Kiểm mốc audio: in chữ Whisper nghe được trong cửa sổ q của vài câu + so với đề. py check_cues.py <N>
import json, sys, re
N = int(sys.argv[1])
W = json.load(open("audio/t%d_whisper_w.json" % N, encoding="utf-8"))
ws = [(s, e, t) for sg in W["segs"] for s, e, t in sg["w"]]
c = json.load(open("cues_%d.json" % N))
it = {x["num"]: x for x in json.load(open("items_%d.json" % N, encoding="utf-8"))}
tok = lambda s: set(re.findall(r"[a-z']{3,}", s.lower()))
bad = []
for n in range(1, 101):
    if str(n) not in c:
        continue
    q = c[str(n)]["q"]
    heard = " ".join(t for s, e, t in ws if q[0] - 0.2 <= s <= q[1] + 0.05)
    if n >= 32:
        stem = it[n]["stem"] if n in it else ""
        a, b = tok(heard), tok(stem)
        ov = len(a & b) / max(1, len(b))
        if ov < 0.5:
            bad.append((n, round(ov, 2)))
print("TEST", N, "câu Part 3-4 có cửa sổ nghe KHỚP ít với đề (<50% từ):", bad)
for n in (1, 7, 20, 31, 32, 50, 71, 100):
    if str(n) in c:
        q = c[str(n)]["q"]
        print(n, q, "->", " ".join(t for s, e, t in ws if q[0] - 0.2 <= s <= q[1] + 0.05)[:90])

# Part 1-2: cửa sổ phải chứa "number <n>" (chữ hoặc số) và có đủ phương án A/B/C
W2 = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty","thirty"]
def nword(n):
    if n <= 20: return W2[n]
    t = {2: "twenty", 3: "thirty"}[n // 10]
    return t + ("" if n % 10 == 0 else "-" + W2[n % 10])
bad2 = []
for n in range(7, 32):
    if str(n) not in c: bad2.append((n, "không có cue")); continue
    q = c[str(n)]["q"]
    SG = json.load(open("audio/t%d_whisper.json" % N, encoding="utf-8"))["segs"]
    heard = (" ".join(t for s, e, t in ws if q[0] - 0.4 <= s <= q[1] + 0.05) + " " + " ".join(sg["t"] for sg in SG if q[0] - 0.4 <= sg["s"] <= q[1] + 0.05)).lower().replace(" -", "-")
    has_n = (str(n) in heard) or (nword(n) in heard) or (nword(n).replace("-", " ") in heard)
    has_opts = ("a." in heard or " a " in heard) and ("b." in heard or " b " in heard)
    if not has_n or not has_opts: bad2.append((n, has_n, has_opts))
print("Part 2 cửa sổ nghi vấn (thiếu số câu hoặc thiếu A/B):", bad2)
