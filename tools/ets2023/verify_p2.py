import json, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
N = int(sys.argv[1])
exec(open('verify_lc2.py', encoding='utf-8').read().split("def one(ns):")[0].replace('N = int(sys.argv[1])', 'N = %d' % N))
def one(n):
    r = BOOK.get(str(n))
    if not r: return n, None
    tx = r['cells'][0].replace('\n', ' ')
    a = ask('Câu Part 2 TOEIC (câu hỏi/câu nói rồi 3 lựa chọn):\n"' + tx + '"\nChọn phản hồi phù hợp nhất. Schema: {"answers":{"%d":"A|B|C"}}' % n)
    return n, a
with ThreadPoolExecutor(2) as ex: res = list(ex.map(one, range(7, 32)))
bad = []; ok = 0; skip = []
for n, a in res:
    if not a: skip.append(n); continue
    v = str(list(a.values())[0]).strip().upper()[:1]
    if v == items[n]['answer']: ok += 1
    else: bad.append((n, items[n]['answer'], v))
print('Part 2: khớp', ok, 'lệch', bad, 'bỏ qua', skip)
for n in range(1, 7):
    r = BOOK.get(str(n)); print(n, items[n]['answer'], (r['cells'][0].replace('\n', ' ')[:200] if r else None))
