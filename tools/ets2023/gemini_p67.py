# Dựng Part 6-7 của 1 đề ETS 2023 từ OCR bằng Gemini (qua gemini-proxy, KHÔNG tốn token Claude).
# py gemini_p67.py <thư mục OCR đã chuẩn hoá rcp/tN> <N> <keys.json> <out.json>
import re, json, sys, os, glob, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
D, T, KEYF, OUT = sys.argv[1:5]
KEYS = json.load(open(KEYF))['rc'][T]
cfg = open(r'C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\js\config.js', encoding='utf-8').read()
URL = re.search(r'https://[a-z0-9]+\.supabase\.co', cfg).group(0); ANON = re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', cfg).group(0)
MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite']
NOISE = re.compile(r'Thi thu|Toeic mi|Key va transcript|GO ON TO THE NEXT|group S Toeic', re.I)
pg = sorted(int(re.findall(r'L-(\d+)', f)[0]) for f in glob.glob(D + '/L-*.txt'))
full = {n: open(f'{D}/L-{n:02d}.txt', encoding='utf8', errors='ignore').read() for n in pg}
p6s = [n for n in pg if 'PART 6' in full[n] and 'PART 5' not in full[n]][0]
body = '\n'.join('\n'.join(l for l in full[n].split('\n') if not NOISE.search(l)) + '\n=== PAGE ===' for n in pg if n >= p6s)
H = re.compile(r'Questions?\s+(\d{3})\s*[-–~—]\s*(\d{3})\s*(?:refer\s+to\s+(?:the\s+)?following)?\s*([^.\n]*)', re.I)
hs = list(H.finditer(body)); groups = []
for i, h in enumerate(hs):
    a, b = int(h.group(1)), int(h.group(2)); blk = body[h.start():(hs[i + 1].start() if i + 1 < len(hs) else len(body))].replace('=== PAGE ===', '\n')
    groups.append((a, b, blk))
# chuẩn hoá số nhóm theo thứ tự liên tục (OCR hay đọc sai số: "196-200" -> "496-200")
exp = 131; fixed_groups = []
for a_, b_, blk_ in groups:
    if a_ != exp: print('sửa số nhóm', a_, '->', exp)
    fixed_groups.append((exp, b_, blk_)); exp = b_ + 1
groups = fixed_groups
assert groups[-1][1] == 200, 'nhóm cuối không kết thúc ở 200: %s' % (groups[-1][:2],)
SYS = 'Bạn là người số hoá đề thi TOEIC từ văn bản OCR bị nhiễu. Chỉ trả đúng 1 object JSON, không markdown. Sửa lỗi OCR (chữ dính, ký tự lạ, dấu câu) nhưng KHÔNG đổi nội dung, KHÔNG tự bịa câu hay đáp án.'
def prompt(a, b, blk):
    return (f'Văn bản OCR dưới đây là nhóm câu {a}-{b} của TOEIC (Reading). Hãy tách thành bài đọc và các câu hỏi.\n'
            'Quy tắc: (1) "passage" là TOÀN BỘ bài đọc (Part 6 giữ chỗ trống dạng -----(131)-----; email/thư/bảng/quảng cáo giữ xuống dòng hợp lý; bài đọc kép thì giữ cả hai bài, đánh dấu bằng dòng trống). '
            '(2) "questions": mỗi câu có "num" (số), "stem" (câu hỏi; với Part 6 để rỗng ""), "opts" đúng 4 chuỗi dạng "(A) ...", "(B) ...", "(C) ...", "(D) ...". '
            '(3) Part 6 có thể có câu "chèn câu": khi đó mỗi đáp án là một câu đầy đủ. '
            '(4) Nếu thiếu thông tin thì để "opts": [] cho câu đó và thêm vào "flags" mô tả ngắn.\n'
            'Schema: {"kind":"...","passage":"...","questions":[{"num":131,"stem":"","opts":["(A) ...","(B) ...","(C) ...","(D) ..."]}],"flags":[]}\n\n=== OCR ===\n' + blk)
def call(model, sysm, user):
    for _try in range(6):
        try: return _call(model, sysm, user)
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(20 + 15 * _try)
    return _call(model, sysm, user)
def _call(model, sysm, user):
    req = urllib.request.Request(URL + '/functions/v1/gemini-proxy', data=json.dumps({'model': model, 'sys': sysm, 'user': user}).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON})
    d = json.load(urllib.request.urlopen(req, timeout=170))
    return d['candidates'][0]['content']['parts'][0]['text']
def one(g):
    a, b, blk = g; last = None
    extra = ''
    if b <= 146:
        extra = '\nLƯU Ý: bài Part 6 PHẢI giữ đủ mọi chỗ trống dạng -----(%d)----- đến -----(%d)----- tại đúng vị trí; nếu OCR mất ký hiệu chỗ trống thì dựa vào ngữ cảnh để đặt lại đúng chỗ.' % (a, b)
    for attempt in range(5):
        m = MODELS[0] if attempt < 4 else MODELS[1]
        try:
            raw = call(m, SYS, prompt(a, b, blk) + extra); j = json.loads(re.search(r'\{[\s\S]*\}', raw).group(0))
            nums = [q['num'] for q in j['questions']]
            if sorted(nums) != list(range(a, b + 1)): raise ValueError('nums %s' % nums)
            if b <= 146:   # Part 6: bài phải còn đủ mọi chỗ trống -----(n)-----
                lost = [n for n in range(a, b + 1) if not re.search(r'-{3,}\(%d\)' % n, j.get('passage', ''))]
                if lost: raise ValueError('mất chỗ trống %s' % lost)
            return {'group': f'{a}-{b}', **j}
        except Exception as e:
            last = e; time.sleep(3 * (attempt + 1))
    return {'group': f'{a}-{b}', 'error': str(last)[:200], 'questions': []}
with ThreadPoolExecutor(2) as ex: res = list(ex.map(one, groups))
items = []; bad = []
for r in res:
    if r.get('error'): bad.append((r['group'], r['error'])); continue
    a = int(r['group'].split('-')[0])
    for q in r['questions']:
        n = q['num']; part = 6 if n <= 146 else 7
        if len(q.get('opts') or []) != 4: bad.append((n, 'opts %d' % len(q.get('opts') or []))); 
        stem = f'Choose the best answer for blank ({n}).' if part == 6 else q['stem']
        items.append({'part': part, 'num': n, 'stem': stem, 'opts': q.get('opts') or [], 'passage': f"[{r.get('kind', '')}]\n" + r['passage'], 'group': r['group'], 'id': f'ets23_t{T}_p{part}_{n}', 'answer': KEYS[str(n)]})
json.dump(sorted(items, key=lambda x: x['num']), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
got = {x['num'] for x in items}
print('groups', len(groups), 'items', len(items), 'missing', [n for n in range(131, 201) if n not in got], 'bad', bad[:12])
