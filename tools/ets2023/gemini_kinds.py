# Gắn nhãn [Loại tài liệu] cho từng tài liệu trong passage Part 6-7 (qua gemini-proxy). py gemini_kinds.py <in.json> <out.json>
import json, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
IN, OUT = sys.argv[1:3]
cfg = open(r'C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\js\config.js', encoding='utf-8').read()
URL = re.search(r'https://[a-z0-9]+\.supabase\.co', cfg).group(0); ANON = re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', cfg).group(0)
KINDS = 'E-mail, Article, Advertisement, Text-message chain, Notice, Instructions, Web page, Schedule, Job advertisement, Letter, Press release, Memo, Work order, Review, List, Product information, Online profile, Process chart, Report, Form, Product description, Online article, Meeting minutes, Online chat discussion, Menu, Company newsletter article, Coupon, Gift certificate, Checklist, Invoice, Receipt, Flyer, Announcement, Brochure, Survey, Table, Calendar, Itinerary'
SYS = 'Bạn gắn nhãn loại tài liệu cho bài đọc TOEIC. Chỉ trả đúng 1 object JSON, không markdown.'
def call(user):
    for m in ('gemini-3.6-flash', 'gemini-3.5-flash-lite'):
        try:
            req = urllib.request.Request(URL + '/functions/v1/gemini-proxy', data=json.dumps({'model': m, 'sys': SYS, 'user': user}).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON})
            return json.load(urllib.request.urlopen(req, timeout=170))['candidates'][0]['content']['parts'][0]['text']
        except Exception as e: time.sleep(3)
    raise RuntimeError('gemini fail')
norm = lambda t: re.sub(r'\s+', '', t)
items = json.load(open(IN, encoding='utf-8')); groups = {}
for it in items: groups.setdefault(it['group'], it['passage'])
def one(kv):
    g, ps = kv; body = re.sub(r'^\[[^\]\n]*\]\n', '', ps)
    u = ('Bài đọc dưới đây có thể gồm 1 hoặc nhiều tài liệu (e-mail, bài báo, quảng cáo, tin nhắn...). Tách thành từng tài liệu theo đúng thứ tự, GIỮ NGUYÊN từng chữ, không sửa, không bỏ, không thêm. '
         'Với mỗi tài liệu cho "kind" (tiếng Anh, chọn gần nhất trong: ' + KINDS + ') và "text".\nSchema: {"docs":[{"kind":"E-mail","text":"..."}]}\n\n=== BÀI ĐỌC ===\n' + body)
    for _ in range(3):
        try:
            j = json.loads(re.search(r'\{[\s\S]*\}', call(u)).group(0)); docs = j['docs']
            if norm(''.join(d['text'] for d in docs)) == norm(body) and all(d.get('kind') for d in docs):
                return g, '\n\n'.join('[%s]\n%s' % (d['kind'].strip(), d['text'].strip()) for d in docs), [d['kind'] for d in docs]
        except Exception: time.sleep(2)
    return g, None, None
with ThreadPoolExecutor(3) as ex: res = {g: (p, k) for g, p, k in ex.map(one, groups.items())}
fail = [g for g, (p, k) in res.items() if p is None]
for it in items:
    p = res[it['group']][0]
    if p: it['passage'] = p
json.dump(items, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('groups', len(groups), 'fail', fail, {g: k for g, (p, k) in res.items() if k})
