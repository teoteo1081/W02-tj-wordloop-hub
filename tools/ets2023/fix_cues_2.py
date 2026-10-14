# Vá mốc Part 2 (câu 7-31) + câu 54 của Test 2 từ lượt Whisper theo đoạn. py fix_cues_2.py
import json, re
S = json.load(open("audio/t2_whisper.json", encoding="utf-8"))["segs"]
cues = json.load(open("cues_2.json"))
# vị trí đoạn: bắt đầu câu 7 = cue có sẵn, kết thúc Part 2 = đầu phần Part 3
start = cues["7"]["q"][0] if "7" in cues else None
p3 = next((s["s"] for s in S if re.search(r"(?i)part\s*(three|3)", s["t"]) and s["s"] > 300), None)
seg = [s for s in S if start - 0.5 <= s["s"] < p3 - 0.5]
isC = lambda t: re.match(r"^\(?C\)?[.\s]?", t.strip()) is not None and len(t.strip()) < 3 or re.match(r"^C[.,]\s", t.strip())
items, cur, waitC = [], [], False
for s in seg:
    t = s["t"].strip()
    if re.match(r"(?i)^number\s+\w+\.?$", t) and cur and not waitC:   # "Number N." đứng riêng -> mở câu mới
        items.append(cur); cur = []
    cur.append(s)
    if waitC:
        items.append(cur); cur = []; waitC = False
    elif re.match(r"^C\.?$", t):
        waitC = True
    elif re.match(r"^C[.,]\s", t):
        items.append(cur); cur = []
if cur: items.append(cur)
print("số câu tách được:", len(items), "(mong đợi", 31 - 7 + 1, ")")
for k, it in enumerate(items):
    print(7 + k, round(it[0]["s"], 1), it[0]["t"][:60])

starts = [round(it[0]["s"], 2) for it in items]
ends = starts[1:] + [round(p3, 2)]
for k in range(len(items)):
    n = 7 + k
    cues[str(n)] = {"q": [starts[k], ends[k]]}
# câu 54: 'Number 54. ... logo? Number 55.' trong cùng đoạn 1418.2-1436.3 -> mốc từng chữ
W = json.load(open("audio/t2_whisper_w.json", encoding="utf-8"))["segs"]
ws = [(a, b, re.sub(r"[^a-z0-9]", "", t.lower())) for sg in W for a, b, t in sg["w"]]
i54 = next(i for i in range(len(ws) - 1) if abs(ws[i][0] - 1418.1) < 0.5 and ws[i][2] == "number")
iend = next(i for i in range(i54, len(ws)) if ws[i][2] == "logo")
q54 = [round(ws[i54][0], 2), round(ws[iend][1] + 0.3, 2)]
g = cues["53"].get("g") or cues["55"].get("g")
cues["54"] = {"q": q54, **({"g": g} if g else {})}
print("câu 54:", q54, "g:", g)
json.dump(dict(sorted(cues.items(), key=lambda kv: int(kv[0]))), open("cues_2.json", "w"), indent=1)
