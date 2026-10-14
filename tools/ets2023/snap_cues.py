# Đặt lại mốc Part 1-2 theo KHOẢNG LẶNG thật của audio (Whisper hay bị lệch chữ "Number"): py snap_cues.py N [--dry]
# đầu câu = cuối khoảng lặng ngay trước chữ đầu tiên của câu; cuối câu = đầu khoảng lặng dài (>= LONG s) đầu tiên sau câu (+0.4s).
import json, re, sys
N = int(sys.argv[1]); DRY = '--dry' in sys.argv; LONG = 2.3
cues = json.load(open('cues_%d.json' % N)); old = json.loads(json.dumps(cues))
sil = []
for l in open('audio/sil_%d.txt' % N, encoding='utf-8', errors='ignore'):
    m = re.search(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)', l)
    if m: e = float(m.group(1)); d = float(m.group(2)); sil.append((round(e - d, 2), e))
W = json.load(open('audio/t%d_whisper_w.json' % N, encoding='utf-8'))['segs']
ws = [(a, b, re.sub(r'[^a-z0-9\-]', '', t.lower())) for sg in W for a, b, t in sg['w']]
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(); TENS = {'twenty': 20, 'thirty': 30}
def toint(t):
    if t.isdigit(): return int(t)
    if t in ONES: return ONES.index(t)
    p = t.split('-')
    if p[0] in TENS: return TENS[p[0]] + (ONES.index(p[1]) if len(p) > 1 and p[1] in ONES else 0)
def first_word_after(n, s0):   # chữ đầu của câu, sau "Number n" (mốc chữ thường đáng tin hơn mốc "Number")
    best = None
    for i in range(len(ws) - 3):
        if ws[i][2] in ('number', 'no') and toint(ws[i + 1][2]) == n and abs(ws[i][0] - s0) < 12:
            j = i + 2
            if best is None or abs(ws[i][0] - s0) < best[0]: best = (abs(ws[i][0] - s0), ws[j][0])
    return best[1] if best else None
starts = {}
for n in range(1, 32):
    c = cues.get(str(n))
    if not c: continue
    s0 = c['q'][0]; ta = first_word_after(n, s0)
    if ta is None: ta = s0 + 2.0 if n > 1 else s0 + 2.0
    cand = [e for (a, e) in sil if e - a >= 1.8 and ta - 6.5 <= e <= ta - 0.3]   # khoảng lặng DÀI (nghỉ trả lời) ngay trước "Number n"
    # câu 1-6: "Number n" rồi "Look at the picture" ngay sau; bám khoảng lặng gần nhất phía trước chữ đầu
    starts[n] = round(max(cand) - 0.2, 2) if cand else s0
def speech_end(start):   # đầu khoảng lặng dài đầu tiên sau start+2s
    for a, e in sil:
        if a >= start + 2.0 and e - a >= LONG: return a
    return None
for n in range(1, 32):
    c = cues.get(str(n)); 
    if not c: continue
    s = starts[n]; e = speech_end(s)
    nxt = starts.get(n + 1)
    end = round(e + 0.4, 2) if e else c['q'][1]
    if nxt and end > nxt - 0.05: end = round(nxt - 0.05, 2)
    if n == 31:   # đuôi Part 2: cuối câu 31 không vượt đầu Part 3 cũ
        end = min(end, c['q'][1]) if c['q'][1] > s + 3 else end
    if end - s < 3: end = c['q'][1]   # an toàn
    c['q'] = [s, end]
ch = [(n, old[str(n)]['q'], cues[str(n)]['q']) for n in range(1, 32) if str(n) in cues and old[str(n)]['q'] != cues[str(n)]['q']]
big = [x for x in ch if abs(x[1][0] - x[2][0]) > 3 or abs(x[1][1] - x[2][1]) > 8]
print('Test', N, 'chỉnh', len(ch), '| lệch lớn:', big)
if len(sys.argv) > 2 and sys.argv[2] == '--show':
    for x in ch[:8]: print('  ', x)
if not DRY: json.dump(cues, open('cues_%d.json' % N, 'w'), indent=1)
