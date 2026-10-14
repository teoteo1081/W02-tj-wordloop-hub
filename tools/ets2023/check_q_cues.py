# Kiểm + sửa mốc ĐẦU và CUỐI từng câu Part 3-4 theo mốc từng chữ Whisper. py check_q_cues.py <N> [--fix]
import json, re, sys
N = int(sys.argv[1]); FIX = '--fix' in sys.argv
cues = json.load(open('cues_%d.json' % N)); lc = {x['num']: x for x in json.load(open('lc_%d.json' % N, encoding='utf-8'))}
W = json.load(open('audio/t%d_whisper_w.json' % N, encoding='utf-8'))['segs']
ws = [(a, b, re.sub(r"[^a-z0-9']", '', t.lower())) for sg in W for a, b, t in sg['w']]; ws = [w for w in ws if w[2]]
tkz = lambda st: [t for t in (re.sub(r"[^a-z0-9']", '', x.lower()) for x in st.split()) if t]
found = {}
for n in range(32, 101):
    tk = tkz(lc.get(n, {}).get('stem', '')); c = cues.get(str(n))
    if not c or len(tk) < 3: continue
    s0 = c['q'][0]; cand = [i for i in range(len(ws) - 2) if [w[2] for w in ws[i:i + 3]] == tk[:3] and abs(ws[i][0] - s0) < 40]
    if not cand: continue
    i = min(cand, key=lambda i: abs(ws[i][0] - (s0 + 2)))   # lần xuất hiện gần mốc cũ nhất
    j = next((k for k in range(i, min(i + len(tk) + 14, len(ws) - 2)) if [w[2] for w in ws[k:k + 3]] == tk[-3:]), None)
    if j is None: continue
    found[n] = (ws[i][0], ws[j + 2][1])
chg = []
for n, (qs, qe) in found.items():
    c = cues[str(n)]; s0, e0 = c['q']; ns = max(0, round(qs - 2.2, 2)); ne = round(qe + 0.3, 2)
    badS = not (qs - 4.0 <= s0 <= qs - 0.3 + 0.01) ; badE = e0 < qe - 0.05
    if badS or badE:
        chg.append((n, s0, e0, '->', ns if badS else s0, ne if badE else e0))
print('N', N, 'câu cần chỉnh:', len(chg)); [print('  ', x) for x in chg]
if FIX:
    for n, s0, e0, _, ns, ne in chg:
        cues[str(n)]['q'] = [ns, ne]
    # đầu câu sau không được trước cuối câu trước
    for n in range(32, 100):
        a, b = cues.get(str(n)), cues.get(str(n + 1))
        if a and b and a['q'][1] > b['q'][0]: a['q'][1] = b['q'][0]
    json.dump(cues, open('cues_%d.json' % N, 'w'), indent=1)
