# Tải ảnh minh hoạ cho Speaking Q3 (tả ảnh) + Writing Q1–5 (viết câu theo ảnh) từ Wikimedia Commons (ảnh tự do, có ghi nguồn)
# rồi tải lên Supabase Storage (bucket toeic, thư mục sw/) và ghi t["image"], t["credit"] vào learn/sw/sets.json.
#   py tools/sw/fetch_images.py --queries      # (1) nhờ Gemini viết từ khoá tìm ảnh cho từng cảnh -> _work/sw_img/queries.json (1 lần gọi)
#   py tools/sw/fetch_images.py --search       # (2) tìm + tải ảnh về _work/sw_img/*.jpg + meta.json (chưa đụng sets.json)
#   py tools/sw/fetch_images.py --sheet        # (3) ghép ảnh thành tờ xem nhanh để duyệt bằng mắt
#   py tools/sw/fetch_images.py --upload       # (4) tải lên Storage + ghi image/credit vào sets.json
# Khoá Supabase (anon) đọc từ js/config.js (công khai). Không dùng khoá riêng.
import json, os, re, sys, time, io, urllib.request, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SETS = os.path.join(ROOT, 'learn', 'sw', 'sets.json')
WORK = os.environ.get('SW_IMG_DIR', os.path.join(os.path.expanduser('~'), 'Desktop', 'TJ', '_work', 'sw_img'))
os.makedirs(WORK, exist_ok=True)
CFG = open(os.path.join(ROOT, 'js', 'config.js'), encoding='utf-8').read()
SB = re.search(r'SUPABASE_URL:\s*"([^"]+)"', CFG).group(1).rstrip('/')
ANON = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', CFG).group(1)
UA = {'User-Agent': 'wordloop-sw-images/1.0 (teoteo108@gmail.com)'}


def tasks():
    d = json.load(open(SETS, encoding='utf-8'))
    out = []
    for kind in ('speaking', 'writing'):
        for s in d[kind]:
            for t in s['tasks']:
                if (kind == 'speaking' and t['type'] == 'describe') or (kind == 'writing' and t['type'] == 'sentence'):
                    out.append((kind, s['id'], t))
    return d, out


def key(kind, sid, t):
    return '%s_%s_q%d' % (kind, sid, t['q'])


def http_json(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or UA)
    return json.loads(urllib.request.urlopen(req, timeout=60).read())


def make_queries():
    d, ts = tasks()
    items = [{'id': key(*x), 'scene': x[2].get('scene', ''), 'words': x[2].get('words', [])} for x in ts]
    sysm = 'You write search keywords for a free photo library (Wikimedia Commons). For EVERY scene give 3 short English queries, from most specific to most general (2-4 words each, concrete nouns: people, objects, places; no verbs). Reply ONLY JSON: {"<id>": ["q1","q2","q3"], ...} with one entry per given id.'
    h = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON}
    f = os.path.join(WORK, 'queries.json'); q = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
    todo = [i for i in items if i['id'] not in q]
    for c in range(0, len(todo), 12):
        chunk = todo[c:c + 12]
        body = json.dumps({'model': 'gemini-3.5-flash-lite', 'sys': sysm, 'user': json.dumps(chunk, ensure_ascii=False), 'user_id': None}).encode()
        for attempt in range(4):
            try:
                r = http_json(SB + '/functions/v1/gemini-proxy', body, h)
                tx = r['candidates'][0]['content']['parts'][0]['text']
                got = json.loads(re.search(r'\{[\s\S]*\}', tx).group(0)); q.update({k: v for k, v in got.items() if isinstance(v, list)})
                break
            except Exception as e:
                print('thử lại', attempt, e); time.sleep(4 * (attempt + 1))
        json.dump(q, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('đã có từ khoá cho', len(q), '/', len(items), 'cảnh')


def commons(query, n=12):
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': query + ' filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': n,
         'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 900}
    j = http_json('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p))
    res = []
    for pg in (j.get('query', {}).get('pages', {}) or {}).values():
        ii = (pg.get('imageinfo') or [{}])[0]
        if ii.get('mime') not in ('image/jpeg', 'image/png') or not ii.get('thumburl'): continue
        if ii.get('width', 0) < 700 or ii.get('height', 0) < 450: continue
        em = ii.get('extmetadata', {})
        lic = (em.get('LicenseShortName', {}) or {}).get('value', '')
        if not re.search(r'(?i)cc0|public domain|pd|cc by|cc-by', lic): continue
        if re.search(r'(?i)nc|nd', lic): continue
        title = pg.get('title', '')
        if re.search(r'(?i)\b(map|logo|diagram|flag|icon|svg|drawing|painting|illustration|poster|screenshot|chart)\b', title): continue
        res.append({'title': title, 'url': ii['thumburl'], 'license': lic, 'author': re.sub('<[^>]+>', '', (em.get('Artist', {}) or {}).get('value', ''))[:80], 'page': ii.get('descriptionurl', ''), 'idx': pg.get('index', 99)})
    res.sort(key=lambda r: r['idx'])
    return res


def search():
    q = json.load(open(os.path.join(WORK, 'queries.json'), encoding='utf-8'))
    d, ts = tasks(); meta_f = os.path.join(WORK, 'meta.json')
    meta = json.load(open(meta_f, encoding='utf-8')) if os.path.exists(meta_f) else {}
    used = set(m['url'] for m in meta.values())
    for kind, sid, t in ts:
        k = key(kind, sid, t)
        if k in meta and os.path.exists(os.path.join(WORK, k + '.jpg')): continue
        got = None
        for qq in q.get(k, []) + [' '.join(t.get('words', [])[:1])]:
            try: res = commons(qq)
            except Exception as e: print('  lỗi tìm', qq, e); time.sleep(3); continue
            res = [r for r in res if r['url'] not in used]
            if res: got = (qq, res[0]); break
            time.sleep(0.5)
        if not got: print('KHÔNG có ảnh cho', k, q.get(k)); continue
        qq, r = got
        try:
            data = urllib.request.urlopen(urllib.request.Request(r['url'], headers=UA), timeout=60).read()
        except Exception as e:
            print('  lỗi tải', k, e); continue
        open(os.path.join(WORK, k + '.jpg'), 'wb').write(data)
        used.add(r['url']); meta[k] = dict(r, query=qq)
        json.dump(meta, open(meta_f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('OK', k, '|', qq, '|', r['title'][:50], '|', r['license']); time.sleep(0.6)


def sheet():
    from PIL import Image, ImageDraw
    meta = json.load(open(os.path.join(WORK, 'meta.json'), encoding='utf-8')); keys = sorted(meta)
    W, H, cols = 300, 200, 5
    for pi in range(0, len(keys), 20):
        chunk = keys[pi:pi + 20]; rows = (len(chunk) + cols - 1) // cols
        sh = Image.new('RGB', (cols * W, rows * (H + 22)), 'white'); dr = ImageDraw.Draw(sh)
        for i, k in enumerate(chunk):
            im = Image.open(os.path.join(WORK, k + '.jpg')).convert('RGB'); im.thumbnail((W, H))
            x, y = (i % cols) * W, (i // cols) * (H + 22); sh.paste(im, (x, y)); dr.text((x + 3, y + H + 4), k.replace('writing_', 'W').replace('speaking_', 'S')[:44], fill='black')
        sh.save(os.path.join(WORK, 'sheet_%d.jpg' % (pi // 20)), quality=80); print('sheet_%d.jpg' % (pi // 20), len(chunk))


def upload():
    C = json.load(open(os.path.join(WORK, 'cands.json'), encoding='utf-8')); P = json.load(open(os.path.join(WORK, 'picks.json'), encoding='utf-8'))
    d, ts = tasks(); n = 0
    from PIL import Image
    for kind, sid, t in ts:
        k = key(kind, sid, t); i = P.get(k)
        if i is None or k not in C: continue
        m = C[k][i]
        try: data = urllib.request.urlopen(urllib.request.Request(m['url'], headers=UA), timeout=60).read()
        except Exception as e: print('lỗi tải', k, e); continue
        im = Image.open(io.BytesIO(data)).convert('RGB'); im.thumbnail((900, 700)); buf = io.BytesIO(); im.save(buf, 'JPEG', quality=80)
        path = 'sw/%s.jpg' % k
        req = urllib.request.Request('%s/storage/v1/object/toeic/%s' % (SB, path), data=buf.getvalue(), method='POST',
                                     headers={'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'image/jpeg', 'x-upsert': 'true'})
        try: urllib.request.urlopen(req, timeout=60)
        except Exception as e: print('lỗi tải lên', k, e); continue
        t['image'] = '%s/storage/v1/object/public/toeic/%s?v=1' % (SB, path)
        t['credit'] = ('%s · %s · Wikimedia Commons' % (m['author'] or 'Wikimedia', m['license'])).strip()[:120]
        n += 1
    json.dump(d, open(SETS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('đã gắn ảnh cho', n, 'câu')


def cands():
    q = json.load(open(os.path.join(WORK, 'queries.json'), encoding='utf-8'))
    d, ts = tasks(); f = os.path.join(WORK, 'cands.json')
    C = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
    os.makedirs(os.path.join(WORK, 'cand'), exist_ok=True)
    for kind, sid, t in ts:
        k = key(kind, sid, t)
        if k in C: continue
        seen, lst = set(), []
        for qq in q.get(k, [])[:3] + [' '.join(t.get('words', [])[:2])]:
            try: res = commons(qq, 10)
            except Exception as e: print('  lỗi tìm', qq, e); time.sleep(3); continue
            for r in res:
                if r['url'] in seen: continue
                seen.add(r['url']); r['query'] = qq; lst.append(r)
                if len([x for x in lst if x['query'] == qq]) >= 3: break
            time.sleep(0.4)
        lst = lst[:6]
        for i, r in enumerate(lst):
            try:
                u = re.sub(r'/\d+px-', '/360px-', r['url'])
                open(os.path.join(WORK, 'cand', '%s_%d.jpg' % (k, i)), 'wb').write(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read())
            except Exception as e: print('  lỗi tải thử', k, i, e)
            time.sleep(0.3)
        C[k] = lst; json.dump(C, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('OK', k, len(lst), 'ứng viên')


def csheet(per=5):
    from PIL import Image, ImageDraw
    C = json.load(open(os.path.join(WORK, 'cands.json'), encoding='utf-8')); keys = sorted(C)
    W, H = 250, 170
    for pi in range(0, len(keys), per):
        chunk = keys[pi:pi + per]; sh = Image.new('RGB', (6 * W, len(chunk) * (H + 18)), 'white'); dr = ImageDraw.Draw(sh)
        for ri, k in enumerate(chunk):
            for ci in range(len(C[k])):
                fp = os.path.join(WORK, 'cand', '%s_%d.jpg' % (k, ci))
                if not os.path.exists(fp): continue
                im = Image.open(fp).convert('RGB'); im.thumbnail((W - 4, H - 4)); x, y = ci * W, ri * (H + 18); sh.paste(im, (x, y + 16)); dr.text((x + 2, y + 2), '%s #%d' % (k, ci), fill='black')
        sh.save(os.path.join(WORK, 'csheet_%02d.jpg' % (pi // per)), quality=78); print('csheet_%02d' % (pi // per), chunk)


def pick(arg):
    f = os.path.join(WORK, 'picks.json'); P = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
    for part in arg.split(','):
        k, i = part.rsplit(':', 1); P[k] = None if i in ('x', '-') else int(i)
    json.dump(P, open(f, 'w', encoding='utf-8'), indent=1); print(len(P), 'lựa chọn')


if __name__ == '__main__':
    a = sys.argv[1:]
    if '--queries' in a: make_queries()
    elif '--search' in a: search()
    elif '--sheet' in a: sheet()
    elif '--cands' in a: cands()
    elif '--csheet' in a: csheet()
    elif '--pick' in a: pick(a[a.index('--pick') + 1])
    elif '--upload' in a: upload()
    else: print(__doc__)
