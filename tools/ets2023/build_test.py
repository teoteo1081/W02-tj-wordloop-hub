# Ghép + KIỂM + (tuỳ chọn) nạp 1 đề ETS 2023: py build_test.py <N> [--load]
# Cần: key_N.json, lc34_N.json (subagent), rc_N.json (subagent), cues_N.json (build_cues.py), img\T2023-N_q1..6.jpg, img\T2023-N_g*.jpg,
#      audio\TEST_2023_NN_LC.mp3 (đã nén) + audio\tN_whisper*.json.  Ghi items_N.json, load_N.sql, report_N.txt.
import json, re, sys, os, urllib.request, subprocess
N = int(sys.argv[1])
LOAD = "--load" in sys.argv
TEST = "2023-%d" % N
BASE = "https://pqarpszsipbdugrumhfy.supabase.co/storage/v1/object/public/toeic/listening/img/"
key = json.load(open("key_%d.json" % N, encoding="utf-8"))
LC, RC = key["LC"].split(), key["RC"].split()
assert len(LC) == 100 and len(RC) == 100, "đáp án không đủ 100/100"
ans = {i + 1: c for i, c in enumerate(LC)}
ans.update({101 + i: c for i, c in enumerate(RC)})
cues = json.load(open("cues_%d.json" % N))
lc34 = json.load(open("lc34_%d.json" % N, encoding="utf-8"))
rc = json.load(open("rc_%d.json" % N, encoding="utf-8"))
lcd = {x["num"]: x for x in lc34["items"]}
gfx = {int(g["group"]): g["file"] for g in lc34.get("graphics", [])}
problems = []

CUT = re.compile(r"\s+(?:\d{1,3}\s+[\[\(\|]|he Listening|TEST\s*\d|GO ON|[A-Z]{2,}\s*©)")


def clean(o):
    m = re.match(r"\(([A-D])\)\s*(.*)$", o.replace("\r", "").strip())
    lab, txt = (m.group(1), m.group(2)) if m else ("", o)
    txt = CUT.split(txt)[0].strip()
    return "(%s) %s" % (lab, txt)


def clean_text(s):
    return (s or "").replace("\r", "")


def group_of(n):
    return 32 + ((n - 32) // 3) * 3


def fmt(a, b):
    return "%.2f-%.2f" % (a, b)


items = []
for n in range(1, 101):
    part = 1 if n <= 6 else 2 if n <= 31 else 3 if n <= 70 else 4
    base = {"id": "ets23_t%d_p%d_%d" % (N, part, n), "exam": "toeic", "test": TEST, "part": part, "num": n,
            "answer": ans[n], "tag": None, "src": "ETS2023_T%d_LC.pdf" % N, "answer_src": "key"}
    c = cues.get(str(n))
    if not c:
        problems.append("câu %d: không có mốc audio" % n)
        continue
    q = c["q"]
    if q[1] is None or q[1] <= q[0]:
        problems.append("câu %d: mốc audio lỗi %s" % (n, q))
        continue
    if part == 1:
        f = "img/T2023-%d_q%d.jpg" % (N, n)
        if not os.path.exists(f):
            problems.append("câu %d (Part 1): thiếu ảnh -> bỏ câu này" % n)
            continue
        base.update(stem="Look at the picture. Choose the statement that best describes it.", opts=["(A)", "(B)", "(C)", "(D)"],
                    passage="[img] %sT2023-%d_q%d.jpg?v=1\n[aud] q=%s" % (BASE, N, n, fmt(*q)))
    elif part == 2:
        base.update(stem="Listen and choose the best response.", opts=["(A)", "(B)", "(C)"], passage="[aud] q=%s" % fmt(*q))
    else:
        x = lcd.get(n)
        if not x:
            problems.append("câu %d: thiếu nội dung Part %d" % (n, part)); continue
        g = group_of(n)
        lines = ["🎧 %s · questions %d–%d" % ("Conversation" if part == 3 else "Talk", g, g + 2)]
        if g in gfx:
            lines.append("[img] %s%s?v=1" % (BASE, gfx[g]))
        lines.append("[aud] q=%s g=%s" % (fmt(*q), fmt(*c["g"])))
        base.update(stem=re.sub(r"\s*\|\s*", " ", clean_text(x["stem"])), opts=[clean(o) for o in x["opts"]], passage="\n".join(lines))
    items.append(base)
rcd = {x["num"]: x for x in rc["items"]}
for n in range(101, 201):
    x = rcd.get(n)
    if not x:
        problems.append("câu %d: thiếu (Reading)" % n); continue
    part = int(x["part"])
    items.append({"id": "ets23_t%d_p%d_%d" % (N, part, n), "exam": "toeic", "test": TEST, "part": part, "num": n,
                  "stem": clean_text(x["stem"]), "opts": [clean(o) for o in x["opts"]], "answer": ans[n], "tag": None,
                  "passage": clean_text(x.get("passage", "")), "src": "ETS2023_T%d_RC.pdf" % N, "answer_src": "key"})

# ---- kiểm tra tự động
seen = set()
for it in items:
    if it["id"] in seen: problems.append("trùng id " + it["id"])
    seen.add(it["id"])
    need = 3 if it["part"] == 2 else 4
    if len(it["opts"]) != need: problems.append("câu %d: số đáp án %d" % (it["num"], len(it["opts"])))
    if "ABCD".index(it["answer"]) >= need: problems.append("câu %d: đáp án ngoài khoảng" % it["num"])
    blob = it["stem"] + "".join(it["opts"]) + it["passage"]
    if "\r" in blob: problems.append("câu %d: còn \\r" % it["num"])
    if re.search(r"[|¥©]", it["stem"] + "".join(it["opts"])) and it["part"] not in (6, 7): problems.append("câu %d: ký tự lạ trong đề/đáp án" % it["num"])
    if it["part"] in (3, 4, 5, 6, 7):
        for o in it["opts"]:
            if len(re.sub(r"^\([A-D]\)\s*", "", o)) < 1: problems.append("câu %d: đáp án rỗng" % it["num"])
            if len(o) > 160: problems.append("câu %d: đáp án dài bất thường (%d)" % (it["num"], len(o)))
    if it["part"] in (6, 7) and len(it["passage"]) < 120: problems.append("câu %d: đoạn văn ngắn" % it["num"])
    if it["part"] <= 4:
        m = re.search(r"\[aud\] q=([\d.]+)-([\d.]+)", it["passage"])
        if not m or float(m.group(1)) >= float(m.group(2)): problems.append("câu %d: mốc audio" % it["num"])
    for u in re.findall(r"\[img\] (\S+)", it["passage"]):
        fn = u.split("/")[-1].split("?")[0]
        if not os.path.exists("img/" + fn): problems.append("câu %d: thiếu file ảnh %s" % (it["num"], fn))
nums = sorted(i["num"] for i in items)
exp = list(range(1, 201))
if N == 9:
    exp = [n for n in exp if n not in (3, 4, 5, 6)]
miss = [n for n in exp if n not in nums]
if miss: problems.append("thiếu câu: %s" % miss)
# mốc audio tăng dần theo câu (Part 2) và không vượt độ dài audio
mono = [(a["num"], b["num"]) for a, b in zip(items, items[1:]) if a["part"] == 2 and b["part"] == 2 and
        float(re.search(r"q=([\d.]+)", a["passage"]).group(1)) >= float(re.search(r"q=([\d.]+)", b["passage"]).group(1))]
if mono: problems.append("mốc Part 2 không tăng dần: %s" % mono[:5])

json.dump(items, open("items_%d.json" % N, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)


def lit(v):
    return "null" if v is None else "'" + str(v).replace("'", "''") + "'"


rows = ["(%s,%s,%s,%d,%d,%s,%s::jsonb,%s,%s,%s,%s,%s)" % (
    lit(it["id"]), lit(it["exam"]), lit(it["test"]), it["part"], it["num"], lit(it["stem"]),
    lit(json.dumps(it["opts"], ensure_ascii=False)), lit(it["answer"]), lit(it["tag"]), lit(it["passage"]), lit(it["src"]), lit(it["answer_src"])) for it in items]
sql = ("-- ETS 2023 Test %d: %d câu. HOÀN TÁC: delete from test_items where exam='toeic' and test='%s';\n" % (N, len(items), TEST)
       + "insert into test_items (id,exam,test,part,num,stem,opts,answer,tag,passage,src,answer_src) values\n" + ",\n".join(rows) + "\non conflict (id) do nothing;\n")
open("load_%d.sql" % N, "w", encoding="utf-8", newline="\n").write(sql)
by = {}
for it in items: by[it["part"]] = by.get(it["part"], 0) + 1
rep = "TEST %d: %d câu %s | vấn đề: %d\n" % (N, len(items), by, len(problems)) + "\n".join(" - " + p for p in problems)
open("report_%d.txt" % N, "w", encoding="utf-8").write(rep)
print(rep)
flags = (lc34.get("flags") or []) + (rc.get("flags") or [])
print("flags của subagent:", len(flags))
if LOAD:
    if problems:
        sys.exit("CÒN VẤN ĐỀ -> KHÔNG nạp")
    print("(nạp DB do bước sau làm: dùng load_%d.sql)" % N)
