# Dựng Part 5 (101-130) từ OCR cột bằng Gemini. py gemini_p5.py <rcp/tN> <N> <keys.json> <out.json>
import re, json, sys, glob, os
D, T, KEYF, OUT = sys.argv[1:5]; KEYS = json.load(open(KEYF))['rc'][T]
exec(open('gemini_kinds.py', encoding='utf-8').read().split('norm = lambda')[0].replace('IN, OUT = sys.argv[1:3]', ''))
NOISE = re.compile(r'Thi thu|Toeic mi|Key va transcript|GO ON TO THE NEXT|group S Toeic', re.I)
pg = sorted(int(re.findall(r'L-(\d+)', f)[0]) for f in glob.glob(D + '/L-*.txt'))
full = {n: open(f'{D}/L-{n:02d}.txt', encoding='utf8', errors='ignore').read() for n in pg}
p5s = [n for n in pg if 'PART 5' in full[n]][0]; p6s = [n for n in pg if 'PART 6' in full[n] and 'PART 5' not in full[n]][0]
def half(n, s):
    f = f'{D}/c{n:02d}{s}.txt'; return open(f, encoding='utf8', errors='ignore').read() if os.path.exists(f) else ''
txt = '\n'.join('\n'.join(l for l in (half(n, 'L') + '\n' + half(n, 'R')).split('\n') if not NOISE.search(l)) for n in range(p5s, p6s))
SYSM = 'Bạn số hoá đề TOEIC Part 5 từ văn bản OCR nhiễu. Chỉ trả 1 object JSON. Sửa lỗi OCR nhưng KHÔNG đổi nội dung câu/đáp án, KHÔNG tự bịa.'
def run(blk):
    u = ('Dưới đây là OCR các câu Part 5 TOEIC. Trả JSON {"items":[{"num":101,"stem":"... _______ ...","opts":["(A) ...","(B) ...","(C) ...","(D) ..."]}]} cho MỌI câu có trong văn bản, đúng thứ tự. '
         'Chỗ trống trong câu viết bằng đúng 7 dấu gạch dưới "_______". Mỗi câu đúng 4 đáp án.\n\n=== OCR ===\n' + blk)
    return json.loads(re.search(r'\{[\s\S]*\}', call(u)).group(0))['items']
got = {}
for attempt in range(3):
    try:
        for x in run(txt): got.setdefault(int(x['num']), x)
    except Exception as e: print('err', str(e)[:80])
    if all(n in got and len(got[n]['opts']) == 4 and '_______' in got[n]['stem'] for n in range(101, 131)): break
bad = [n for n in range(101, 131) if not (n in got and len(got[n]['opts']) == 4 and '_______' in got[n]['stem'])]
items = [{'part': 5, 'num': n, 'stem': re.sub(r'_{2,}', '_______', got[n]['stem']), 'opts': got[n]['opts'], 'passage': '', 'id': f'ets23_t{T}_p5_{n}', 'answer': KEYS[str(n)]} for n in range(101, 131) if n in got]
json.dump(items, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('p5 items', len(items), 'bad', bad)
