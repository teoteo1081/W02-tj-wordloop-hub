# Part 3-4 (câu 32-100) từ OCR: py parse_lc.py <thư mục ocr> <số đề> [trang_đầu trang_cuối]
import re, sys, os, json
d, t = sys.argv[1], sys.argv[2]
a, b = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (7, 13)
txt = ""
for p in range(a, b + 1):
    for s in "LR":
        f = os.path.join(d, "p%03d%s.txt" % (p, s))
        if os.path.exists(f):
            txt += "\n" + open(f, encoding="utf-8", errors="ignore").read()
junk = re.compile(r"\s*[\[\]|=¥]+\s*\S{0,3}\s*$")


def opts_of(body):
    out = []
    for ltr, nxt in (("A", "B"), ("B", "C"), ("C", "D"), ("D", None)):
        mm = re.search(r"\(%s\)\s*(.*?)(?=\(%s\)|\Z)" % (ltr, nxt) if nxt else r"\(D\)\s*(.*)", body, re.S)
        o = re.sub(r"\s+", " ", mm.group(1)).strip() if mm else ""
        o = junk.sub("", o).strip()
        out.append("(%s) %s" % (ltr, o))
    return out


items = {}
for m in re.finditer(r"(?m)^\s*(\d{2,3})\.\s*(.*?)(?=^\s*\d{2,3}\.|\Z)", txt, re.S):
    n = int(m.group(1))
    if not 32 <= n <= 100 or n in items:
        continue
    body = m.group(2)
    om = re.search(r"\(A\)", body)
    if not om:
        items[n] = {"num": n, "stem": re.sub(r"\s+", " ", body).strip(), "opts": None}
        continue
    stem = re.sub(r"\s+", " ", body[:om.start()]).strip()
    o = opts_of(body)
    o[3] = re.split(r"\n\s*\n|PART \d|Questions \d", o[3])[0].strip()
    items[n] = {"num": n, "stem": stem, "opts": o}
miss = [n for n in range(32, 101) if n not in items]
bad = [n for n, x in items.items() if x["opts"] is None or any(len(o) < 6 for o in x["opts"]) or not x["stem"]]
print("tìm thấy", len(items), "thiếu:", miss, "cần soát:", sorted(bad))
json.dump([items[k] for k in sorted(items)], open("lc_%s.json" % t, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

