# Canh mốc thời gian TỪNG LƯỢT NÓI của lời thoại: nghe ra chữ đoạn audio (pocketsphinx, offline) rồi dò chỗ bắt đầu mỗi câu thoại.
# Chạy: python3 tools/toeic_script_align.py <scr.json> <thư mục TEST_n_LC.mp3> <tests 1,2,...>  -> ghi lines[i].a/.b (giây) vào scr.json
import sys, json, re, subprocess, urllib.request, os, tempfile
from multiprocessing import Pool
SCR, AUD, TESTS = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
K = re.search(r'eyJ[^"]*', open('js/config.js').read()).group(0); SB = 'https://pqarpszsipbdugrumhfy.supabase.co'
STOP = set('a an the to of and or is are was in on at it i you we he she they be for this that with will'.split())
def cues(t):
    r = urllib.request.Request(f'{SB}/rest/v1/test_items?exam=eq.toeic&test=eq.{t}&part=lte.4&select=num,passage', headers={'apikey': K, 'Authorization': 'Bearer ' + K})
    out = {}
    for it in json.load(urllib.request.urlopen(r)):
        m = re.search(r'\[aud\] q=([\d.]+)-([\d.]+)(?: g=([\d.]+)-([\d.]+))?', it['passage'] or '')
        if m: out[it['num']] = (float(m[1]), float(m[2]), float(m[3]) if m[3] else None, float(m[4]) if m[4] else None)
    return out
def asr(args):
    mp3, a, b = args
    from pocketsphinx import Decoder
    fd, wav = tempfile.mkstemp(suffix='.wav'); os.close(fd)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(a), '-to', str(b), '-i', mp3, '-ac', '1', '-ar', '16000', '-f', 's16le', wav])
    d = Decoder(samprate=16000); d.start_utt(); d.process_raw(open(wav, 'rb').read(), full_utt=True); d.end_utt(); os.remove(wav)
    return [(re.sub(r'\(\d+\)$', '', s.word).lower(), a + s.start_frame / 100, a + s.end_frame / 100) for s in d.seg() if not s.word.startswith(('<', '['))]
def words(t): return [w for w in re.findall(r"[a-z']+", re.sub(r'^\([A-D]\)\s*', '', t.lower())) if w not in STOP]
def align(L, W, a, b):
    ptr, starts = 0, []
    for i, l in enumerate(L):
        key = words(l['t'])[:5]; best = None
        for p in range(ptr, len(W)):
            win = [w for w, _, _ in W[p:p + 9]]
            sc = sum(1 for k in key if k in win)
            if key and sc >= min(2, len(key)) and W[p][0] in key[:3]: best = p; break
        if best is None: starts.append(None); continue
        starts.append(W[best][1]); ptr = best + 1
    # điền chỗ không dò được: chia đều giữa 2 mốc biết
    known = [(i, s) for i, s in enumerate(starts) if s is not None]
    if not known: return None
    if starts[0] is None: starts[0] = max(a, known[0][1] - 3)
    for i in range(len(starts)):
        if starts[i] is None:
            j = next((k for k in range(i + 1, len(starts)) if starts[k] is not None), None)
            nxt = starts[j] if j is not None else (W[-1][2] if W else b); prev = starts[i - 1]
            starts[i] = prev + (nxt - prev) * (1 / ((j or len(starts)) - i + 1))
    end = min(b, (W[-1][2] + 0.6) if W else b)
    return [(round(max(a, starts[i] - 0.25), 2), round(starts[i + 1] - 0.1 if i + 1 < len(starts) else end, 2)) for i in range(len(starts))]
if __name__ == '__main__':
    D = json.load(open(SCR))
    for t in TESTS:
        C = cues(t); mp3 = f'{AUD}/TEST_{t}_LC.mp3'; jobs = []
        for k, g in D.get(t, {}).items():
            c = C.get(g['nums'][0])
            if not c: continue
            a, b = (c[2], c[3]) if g['part'] >= 3 and c[2] else (c[0], c[1])
            jobs.append((k, a, b))
        with Pool(4) as P: R = P.map(asr, [(mp3, a, b) for _, a, b in jobs])
        ok = 0
        for (k, a, b), W in zip(jobs, R):
            T = align(D[t][k]['lines'], W, a, b)
            if T: ok += 1; [l.update(a=x, b=y) for l, (x, y) in zip(D[t][k]['lines'], T)]
        print('T' + t, 'aligned', ok, '/', len(jobs), flush=True)
        json.dump(D, open(SCR, 'w'))
