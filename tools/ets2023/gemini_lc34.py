# Dựng Part 3-4 (câu 32-100) sạch từ OCR bằng Gemini -> lc34_N.json (+ danh sách nhóm có hình). py gemini_lc34.py N
import re, json, sys, os
N = sys.argv[1]; D = 'ocr/s%s' % N
exec(open('gemini_kinds.py', encoding='utf-8').read().split('norm = lambda')[0].replace('IN, OUT = sys.argv[1:3]', ''))
pg = sorted(int(re.findall(r'p(\d+)_full', f)[0]) for f in os.listdir(D) if f.endswith('_full.txt'))
full = {n: open(f'{D}/p{n:03d}_full.txt', encoding='utf8', errors='ignore').read() for n in pg}
p3 = next(n for n in pg if re.search(r'(?i)part\s*3', full[n]))
lastL = max(n for n in pg if n < 100)
def half(n, s):
    f = f'{D}/p{n:03d}{s}.txt'; return open(f, encoding='utf8', errors='ignore').read() if os.path.exists(f) else ''
txt = '\n'.join('--- trang %d ---\n%s\n%s' % (n, half(n, 'L'), half(n, 'R')) for n in range(p3, lastL + 1))
SYSM = 'Bạn số hoá đề TOEIC Listening Part 3-4 từ OCR nhiễu. Chỉ trả 1 object JSON. Sửa lỗi OCR (chữ dính, ký tự rác, số trang) nhưng KHÔNG đổi nội dung, KHÔNG bịa.'
def run(a, b):
    u = ('OCR các trang Listening Part 3-4 của đề TOEIC (2 cột ghép trái rồi phải). Trả JSON {"items":[{"num":%d,"stem":"...","opts":["(A) ...","(B) ...","(C) ...","(D) ..."],"graphic":false}]} '
         'cho các câu %d đến %d (đủ từng câu, đúng thứ tự). "stem" là câu hỏi (giữ nguyên chữ "Look at the graphic." nếu có, đặt "graphic":true cho câu có chữ đó). '
         'Mỗi câu đúng 4 đáp án có nhãn (A)-(D). Bỏ các dòng hướng dẫn "Questions X through Y refer to..." và số trang.\n\n=== OCR ===\n' % (a, a, b) + txt)
    return json.loads(re.search(r'\{[\s\S]*\}', call(u)).group(0))['items']
got = {}
for a, b in ((32, 54), (55, 77), (78, 100)):
    for attempt in range(3):
        try:
            for x in run(a, b):
                n = int(x['num'])
                if a <= n <= b and len(x['opts']) == 4: got.setdefault(n, x)
        except Exception as e: print('err', str(e)[:70])
        if all(n in got for n in range(a, b + 1)): break
miss = [n for n in range(32, 101) if n not in got]
items = [{'num': n, 'stem': got[n]['stem'].strip(), 'opts': [o.strip() for o in got[n]['opts']]} for n in range(32, 101) if n in got]
gr = sorted({(n - 32) // 3 * 3 + 32 for n in got if got[n].get('graphic') or 'look at the graphic' in got[n]['stem'].lower()})
json.dump({'items': items, 'graphics': [], 'graphic_groups': gr, 'flags': ['Gemini dựng từ OCR; thiếu: %s' % miss] if miss else []}, open('lc34_%s.json' % N, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('lc34', N, 'items', len(items), 'thiếu', miss, 'nhóm có hình', gr)
