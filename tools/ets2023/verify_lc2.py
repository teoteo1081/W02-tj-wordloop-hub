# Kiểm chéo đáp án Listening Part 3-4 bằng TRANSCRIPT CỦA SÁCH chữa + Gemini. py verify_lc2.py <N>
import json, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
N = int(sys.argv[1])
exec(open('gemini_kinds.py', encoding='utf-8').read().split('norm = lambda')[0].replace('IN, OUT = sys.argv[1:3]', ''))
items = {x['num']: x for x in json.load(open('items_%d.json' % N, encoding='utf-8'))}
BOOK = json.load(open('book/lc_raw.json', encoding='utf-8')).get(str(N), {})
SYSM = 'Bạn là giám khảo TOEIC Listening. Chỉ trả đúng 1 object JSON, không markdown.'
def booktx(ns):
    for n in ns:
        r = BOOK.get(str(n))
        if r and r.get('conv') and r['conv'].get('en'): return r['conv']['en']
def ask(u):
    for attempt in range(4):
        for m in ('gemini-3.6-flash', 'gemini-3.5-flash-lite'):
            try:
                req = urllib.request.Request(URL + '/functions/v1/gemini-proxy', data=json.dumps({'model': m, 'sys': SYSM, 'user': u}).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON})
                raw = json.load(urllib.request.urlopen(req, timeout=170))['candidates'][0]['content']['parts'][0]['text']
                return json.loads(re.search(r'\{[\s\S]*\}', raw).group(0))['answers']
            except Exception: time.sleep(2)
    return None
def one(ns):
    if any('look at the graphic' in items[n]['stem'].lower() for n in ns): return ns, None, 'graphic'
    tx = booktx(ns)
    if not tx: return ns, None, 'no-transcript'
    qs = '\n'.join('%d. %s\n%s' % (n, items[n]['stem'], '\n'.join(items[n]['opts'])) for n in ns)
    a = ask('Lời thoại/bài nói (transcript, các số 44,45... là mốc vị trí thông tin của câu đó):\n"' + tx + '"\n\nTrả lời 3 câu hỏi theo lời thoại:\n' + qs + '\nSchema: {"answers":{"%d":"A|B|C|D","%d":"..","%d":".."}}' % tuple(ns))
    return ns, a, 'ok' if a else 'gemini-fail'
groups = [[g, g + 1, g + 2] for g in range(32, 101, 3)]
with ThreadPoolExecutor(2) as ex: res = list(ex.map(one, groups))
import collections; print(collections.Counter(st for _, _, st in res))
ok = 0; mism = []
for ns, a, st in res:
    if not a: continue
    for n, v in a.items():
        n = int(n); real = items[n]['answer']
        if str(v).strip().upper()[:1] == real: ok += 1
        else: mism.append((n, real, v))
print('khớp', ok, 'lệch', sorted(mism), '| bỏ qua:', [ns[0] for ns, a, st in res if not a])
