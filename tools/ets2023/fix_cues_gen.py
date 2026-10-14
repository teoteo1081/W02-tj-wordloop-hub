# Bù mốc thiếu từ lượt Whisper theo đoạn: Part 2 không có chữ "Number" (bám đoạn câu hỏi) + nhóm Part 3-4 thiếu cue. py fix_cues_gen.py N
import json, re, sys
N = int(sys.argv[1])
cues = json.load(open('cues_%d.json' % N)); S = json.load(open('audio/t%d_whisper.json' % N, encoding='utf-8'))['segs']
Wd = json.load(open('audio/t%d_whisper_w.json' % N, encoding='utf-8'))['segs']
ws = [(a, b, re.sub(r'[^a-z0-9\-]', '', t.lower())) for sg in Wd for a, b, t in sg['w']]
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(); TENS = {'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90}
def toint(t):
    t = t.strip('.,?:')
    if t.isdigit(): return int(t)
    if t in ONES: return ONES.index(t)
    p = t.split('-')
    if p[0] in TENS: return TENS[p[0]] + (ONES.index(p[1]) if len(p) > 1 and p[1] in ONES else 0)
def num_seg(n, lo, hi):   # đoạn có chữ "Number n" (hoặc bắt đầu bằng "n.") trong [lo,hi]
    for i, s in enumerate(S):
        if lo <= s['s'] <= hi:
            if re.match(r'\s*%d\s*[.,]\s' % n, s['t']): return i
            for m in re.finditer(r'(?i)(?:number|\bno\.?)\s+([\w\-]+)', s['t']):
                if toint(m.group(1).lower()) == n: return i
    return None
def has_word_anchor(n, s0):
    return any(ws[i][2] == 'number' and toint(ws[i + 1][2]) == n and abs(ws[i][0] - s0) < 12 for i in range(len(ws) - 1))
changes = []
# --- Part 2: câu không có mốc chữ "Number"
for n in range(7, 32):
    c = cues.get(str(n))
    if not c:   # mất hẳn cue: dựng từ đoạn "Number n" / "No. n" / "n." nằm giữa cue trước và cue sau
        lo = cues[str(n - 1)]['q'][0] + 8 if str(n - 1) in cues else 0
        nxtc = next((cues[str(k)]['q'][0] for k in range(n + 1, 33) if str(k) in cues), None)
        hi = (nxtc - 4) if nxtc else lo + 40
        i = num_seg(n, lo, hi)
        if i is None: print('KHÔNG dựng được cue Part 2', n); continue
        st = S[i]; nx = S[i + 1] if i + 1 < len(S) else None
        qs = nx['s'] if nx and not re.match(r'(?i)^(number|no)', nx['t'].strip()) else st['s'] + 2
        cues[str(n)] = {'q': [round(max(st['s'], qs - 2.0), 2), round(max(st['s'], qs - 2.0), 2) + 1]}; changes.append(('mới', n, cues[str(n)]['q'][0]))
        continue
    s0 = c['q'][0]
    if has_word_anchor(n, s0): continue
    i = num_seg(n, s0 - 8, s0 + 8)
    if i is None: continue
    st = S[i]; nxt = S[i + 1] if i + 1 < len(S) else None
    qs = nxt['s'] if nxt and not re.match(r'(?i)^number', nxt['t'].strip()) else st['s'] + 2
    new = round(max(st['s'], qs - 2.0), 2)
    if abs(new - s0) > 0.3: changes.append((n, s0, new)); c['q'][0] = new; 
    prev = cues.get(str(n - 1))
    if prev and n > 7: prev['q'][1] = c['q'][0]
# nối Part 2: cuối câu n = đầu câu n+1
for n in range(7, 31):
    if str(n) in cues and str(n + 1) in cues: cues[str(n)]['q'][1] = cues[str(n + 1)]['q'][0]
if '31' in cues and cues['31']['q'][1] - cues['31']['q'][0] < 6:   # câu 31 mới dựng: cuối = đầu lời hướng dẫn Part 3
    p3 = next((s['s'] for s in S if re.search(r'(?i)part\s*(three|3)', s['t']) and s['s'] > cues['31']['q'][0]), None)
    if p3: cues['31']['q'][1] = round(p3, 2)
# --- nhóm Part 3-4 thiếu
def good(n): 
    c = cues.get(str(n)); return c and c['q'][1] and c['q'][1] > c['q'][0]
for g0 in range(32, 101, 3):
    if all(good(n) for n in (g0, g0 + 1, g0 + 2)): continue
    hdr = next((s for s in S if re.search(r'(?i)questions?\s+%d\s+through\s+%d' % (g0, g0 + 2), s['t'])), None)
    ws_h = [w for w in ws if w[2] == 'questions' and False]
    # mốc chữ của tiêu đề nhóm
    hw = next((w for i, w in enumerate(ws[:-3]) if w[2].startswith('question') and toint(ws[i + 1][2]) == g0 and ws[i + 2][2] == 'through'), None)
    if not hdr and not hw:   # Whisper bỏ chữ "Questions": đoạn bắt đầu bằng "77-79 refer" / "77 through 79" / "through 79 refer"
        hdr = next((s for s in S if re.search(r'(?i)(?:^|\b(?:and|questions?|the)\s+)%d\s*(?:-|–|through|to)\s*%d\s+refer' % (g0, g0 + 2), s['t']) or re.search(r'(?i)^\s*through\s+%d\s+refer' % (g0 + 2), s['t'])), None)
        if hdr: hdr = dict(hdr); hdr['s'] = hdr['s'] - 1.5
    gs = hw[0] if hw else (hdr['s'] if hdr else None)
    starts = {}
    for n in (g0, g0 + 1, g0 + 2):
        i = num_seg(n, (gs or 0), (gs or 0) + 140)
        if i is not None: starts[n] = S[i]['s']
    if gs is None or len(starts) < 3: print('KHÔNG dựng được nhóm', g0, gs, starts); continue
    nxt_hdr = next((s['s'] for s in S if s['s'] > starts[g0 + 2] and re.search(r'(?i)questions?\s+\d+\s+through', s['t'])), starts[g0 + 2] + 20)
    g = [round(gs, 2), round(starts[g0] - 1.0, 2)]
    for k, n in enumerate((g0, g0 + 1, g0 + 2)):
        a = starts[n]; b = starts[n + 1] if n + 1 in starts else nxt_hdr
        e = a + 6.0 if True else b
        cues[str(n)] = {'q': [round(a, 2), round(min(e, b), 2)], 'g': g}
    changes.append(('group', g0, gs, starts))
json.dump(cues, open('cues_%d.json' % N, 'w'), indent=1); print('đã chỉnh', len(changes)); [print('  ', x) for x in changes]
