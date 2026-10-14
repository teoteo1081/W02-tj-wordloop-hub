# Cấu trúc Part 5 (câu 101-130) của 1 đề từ OCR hai cột. py parse_p5.py <thư mục ocr> <số đề> -> p5_<đề>.json
import re, sys, os, glob, json
d, t = sys.argv[1], sys.argv[2]
pages = sorted(set(int(re.search(r"p(\d+)", f).group(1)) for f in glob.glob(os.path.join(d, "p*L.txt"))))
txt = ""
if any(p >= 100 for p in pages):
    pages = [p for p in pages if p >= 100]   # đề ghép từ sách: chỉ trang RC (p101..)
for p in pages:
    for s in "LR":
        f = os.path.join(d, "p%03d%s.txt" % (p, s))
        if os.path.exists(f):
            txt += "\n" + open(f, encoding="utf-8", errors="ignore").read()
junk = re.compile(r"\s*[\[\]|=¥]+\s*\S{0,3}\s*$")
items = {}
for m in re.finditer(r"(?m)^\s*(1[0-3]\d)\.\s+(.*?)(?=^\s*(?:1[0-3]\d)\.\s|\Z)", txt, re.S):
    n = int(m.group(1))
    if not 101 <= n <= 130 or n in items:
        continue
    body = m.group(2)
    om = re.search(r"\(A\)", body)
    if not om:
        continue
    stem = re.sub(r"\s+", " ", body[:om.start()]).strip()
    stem = re.sub(r"-{3,}|—{2,}|_{2,}", "_", stem)
    opts = []
    for ltr, nxt in (("A", "B"), ("B", "C"), ("C", "D"), ("D", None)):
        mm = re.search(r"\(%s\)\s*(.*?)(?=\(%s\)|\Z)" % (ltr, nxt) if nxt else r"\(D\)\s*(.*)", body, re.S)
        o = re.sub(r"\s+", " ", mm.group(1)).strip() if mm else ""
        o = re.split(r"PART \d", junk.sub("", o))[0].strip()
        opts.append("(%s) %s" % (ltr, o))
    items[n] = {"num": n, "stem": stem, "opts": opts}
miss = [n for n in range(101, 131) if n not in items]
print("tìm thấy", len(items), "câu; thiếu:", miss)
json.dump([items[k] for k in sorted(items)], open("p5_%s.json" % t, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

