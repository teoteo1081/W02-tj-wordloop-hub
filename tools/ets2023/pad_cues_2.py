# Chỉnh mốc đầu câu Part 1-2: bám chữ "Number" (mốc từng chữ) rồi lùi 0.6s nhưng cách lời trước >=0.15s. py pad_cues_2.py <N>
import json, sys, re
N = int(sys.argv[1]); PAD = 0.6
W = json.load(open("audio/t%d_whisper_w.json" % N, encoding="utf-8"))["segs"]
words = [(a, b, re.sub(r"[^a-z0-9]", "", t.lower())) for sg in W for a, b, t in sg["w"]]
ends = sorted(b for a, b, t in words)
nums = [a for a, b, t in words if t == "number"]
cues = json.load(open("cues_%d.json" % N))
new = {}
for n in range(2, 32):
    s = cues[str(n)]["q"][0]
    snap = [a for a in nums if s - 2.5 <= a <= s + 0.5]
    if snap: s = min(snap, key=lambda a: abs(a - s)) if n < 7 else min(snap)
    prev = max([e for e in ends if e <= s - 0.05] or [0])
    new[n] = round(min(s, max(prev + 0.15, s - PAD)), 2)
for n in range(2, 32):
    q = cues[str(n)]["q"]; q[0] = new[n]
    if n < 31 and n != 6: q[1] = new[n + 1]
    if n not in (7,): cues[str(n - 1)]["q"][1] = new[n]   # câu 6 giữ nguyên (sau đó là lời hướng dẫn Part 2)
json.dump(cues, open("cues_%d.json" % N, "w"), indent=1)
print({n: cues[str(n)]["q"] for n in (1, 2, 6, 7, 8, 12, 31)})
