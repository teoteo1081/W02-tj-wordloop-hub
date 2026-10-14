# Ghép test_items cho 1 đề ETS 2023: py build_sql.py <số đề> -> items_<đề>.json + load_<đề>.sql (KHÔNG chạy vào DB)
import json, re, sys, os, glob
T = sys.argv[1]
TEST = "2023-%s" % T
BASE = "https://pqarpszsipbdugrumhfy.supabase.co/storage/v1/object/public/toeic/listening/img/"
key = json.load(open("key_%s.json" % T, encoding="utf-8"))
LC, RC = key["LC"].split(), key["RC"].split()
ans = {i + 1: c for i, c in enumerate(LC)}
ans.update({101 + i: c for i, c in enumerate(RC)})
cues = json.load(open("cues_%s.json" % T))
lc = {x["num"]: x for x in json.load(open("lc_%s.json" % T, encoding="utf-8"))}
p5 = {x["num"]: x for x in json.load(open("p5_%s.json" % T, encoding="utf-8"))}
rc67 = {}
if os.path.exists("rc67_%s.json" % T):
    rc67 = {x["num"]: x for x in json.load(open("rc67_%s.json" % T, encoding="utf-8"))["items"]}

# từ vựng để vá chữ dính "Aconference" -> "A conference"
vocab = set()
for f in glob.glob("ocr/t%s/*.txt" % T):
    vocab |= set(re.findall(r"[a-z]{4,}", open(f, encoding="utf-8", errors="ignore").read()))
W = json.load(open("audio/t%s_whisper.json" % T, encoding="utf-8"))
for sg in W["segs"]:
    vocab |= set(re.findall(r"[a-z]{4,}", sg["t"].lower()))
CUT = re.compile(r"\s+(?:\d{1,3}\s+[\[\(\|]|he Listening|TEST\s*\d|GO ON|[A-Z]{2,}\s*©|\[[A-Z]{2,}|ee ia a|Refrigerator Options)")


def clean_opt(o):
    m = re.match(r"\(([A-D])\)\s*(.*)$", o)
    lab, txt = (m.group(1), m.group(2)) if m else ("", o)
    txt = CUT.split(txt)[0].strip()
    mm = re.match(r"^A([a-z]{4,})\b(.*)$", txt)
    if mm and mm.group(1) in vocab and ("a" + mm.group(1)) not in vocab:
        txt = "A " + mm.group(1) + mm.group(2)
    txt = re.sub(r"^A djust\b", "Adjust", txt)
    return "(%s) %s" % (lab, txt)


def fmt(a, b):
    return "%.2f-%.2f" % (a, b)


def group_of(n):
    for g in range(32, 101, 3):
        if g <= n <= g + 2:
            return g


# đồ thị theo nhóm (từ xem trang đề)
GFX = {65: "g65", 68: "g68", 95: "g95", 98: "g98"} if T == "1" else {}
items = []
IMG = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}
for n in range(1, 101):
    c = cues.get(str(n), {})
    part = 1 if n <= 6 else 2 if n <= 31 else 3 if n <= 70 else 4
    base = {"id": "ets23_t%s_p%d_%d" % (T, part, n), "exam": "toeic", "test": TEST, "part": part, "num": n,
            "answer": ans[n], "tag": None, "src": "ETS2023_T%s_LC.pdf" % T, "answer_src": "key"}
    q = c.get("q")
    if part == 1:
        base.update(stem="Look at the picture. Choose the statement that best describes it.", opts=["(A)", "(B)", "(C)", "(D)"],
                    passage="[img] %sT2023-%s_q%d.jpg?v=1\n[aud] q=%s" % (BASE, T, n, fmt(*q)))
    elif part == 2:
        base.update(stem="Listen and choose the best response.", opts=["(A)", "(B)", "(C)"], passage="[aud] q=%s" % fmt(*q))
    else:
        x = lc[n]
        g = group_of(n)
        kind = "Conversation" if part == 3 else "Talk"
        lines = ["🎧 %s · questions %d–%d" % (kind, g, g + 2)]
        if g in GFX:
            lines.append("[img] %sT2023-%s_%s.jpg?v=1" % (BASE, T, GFX[g]))
        lines.append("[aud] q=%s g=%s" % (fmt(*q), fmt(*c["g"])))
        base.update(stem=re.sub(r"\s*\|\s*", " ", x["stem"]), opts=[clean_opt(o) for o in x["opts"]], passage="\n".join(lines))
    items.append(base)
for n in range(101, 201):
    if n <= 130:
        x = p5[n]
        items.append({"id": "ets23_t%s_p5_%d" % (T, n), "exam": "toeic", "test": TEST, "part": 5, "num": n, "stem": x["stem"],
                      "opts": [clean_opt(o) for o in x["opts"]], "answer": ans[n], "tag": None, "passage": "",
                      "src": "ETS2023_T%s_RC.pdf" % T, "answer_src": "key"})
    elif n in rc67:
        x = rc67[n]
        items.append({"id": "ets23_t%s_p%d_%d" % (T, x["part"], n), "exam": "toeic", "test": TEST, "part": x["part"], "num": n,
                      "stem": x["stem"], "opts": [clean_opt(o) for o in x["opts"]], "answer": ans[n], "tag": None,
                      "passage": x["passage"], "src": "ETS2023_T%s_RC.pdf" % T, "answer_src": "key"})
json.dump(items, open("items_%s.json" % T, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)


def lit(v):
    return "null" if v is None else "'" + str(v).replace("'", "''") + "'"


rows = []
for it in items:
    rows.append("(%s,%s,%s,%d,%d,%s,%s::jsonb,%s,%s,%s,%s,%s)" % (
        lit(it["id"]), lit(it["exam"]), lit(it["test"]), it["part"], it["num"], lit(it["stem"]),
        lit(json.dumps(it["opts"], ensure_ascii=False)), lit(it["answer"]), lit(it["tag"]), lit(it["passage"]), lit(it["src"]), lit(it["answer_src"])))
sql = ("-- ETS 2023 Test %s: %d câu. HOÀN TÁC: delete from test_items where exam='toeic' and test='%s';\n" % (T, len(items), TEST)
       + "insert into test_items (id,exam,test,part,num,stem,opts,answer,tag,passage,src,answer_src) values\n" + ",\n".join(rows)
       + "\non conflict (id) do nothing;\n")
open("load_%s.sql" % T, "w", encoding="utf-8", newline="\n").write(sql)
by = {}
for it in items:
    by[it["part"]] = by.get(it["part"], 0) + 1
print("tổng", len(items), "câu; theo Part:", by, "; còn thiếu Part 6/7:", 200 - 100 - 30 - sum(1 for i in items if i["part"] in (6, 7)))

