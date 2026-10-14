# Ghép rc_N.json từ p5_Ng + p67_Nk (tự chạy gemini_kinds2 cho nhóm lỗi nhãn). py assemble_rc.py N
import json, re, sys, subprocess
N = sys.argv[1]
log = open('rcp/log_k_%s.txt' % N, encoding='utf-8').read()
m = re.search(r"fail \[([^\]]*)\]", log); fail = re.findall(r"'([^']+)'", m.group(1)) if m else []
if fail:
    subprocess.run([sys.executable, 'gemini_kinds2.py', 'rcp/p67_%sk.json' % N, 'rcp/p67_%sk.json' % N] + fail, check=True)
p5 = json.load(open('rcp/p5_%sg.json' % N, encoding='utf-8')); p67 = json.load(open('rcp/p67_%sk.json' % N, encoding='utf-8'))
items = []
for x in p5: items.append({'part': 5, 'num': x['num'], 'stem': re.sub(r'[-_–—]{2,}', '_______', x['stem']), 'opts': x['opts'], 'passage': ''})
for x in p67: items.append({'part': x['part'], 'num': x['num'], 'stem': x['stem'], 'opts': x['opts'], 'passage': x['passage']})
items.sort(key=lambda x: x['num']); assert [x['num'] for x in items] == list(range(101, 201)), 'thiếu câu Reading'
assert all(len(x['opts']) == 4 for x in items), 'câu thiếu đáp án'
assert all(re.match(r'\[[^\]\n]+\]\n', x['passage']) for x in items if x['part'] >= 6), 'thiếu nhãn tài liệu'
assert all(re.search(r'-{3,}\(%d\)' % x['num'], x['passage']) for x in items if x['part'] == 6), 'Part 6 thiếu chỗ trống'
assert all('_______' in x['stem'] for x in items if x['part'] == 5), 'Part 5 thiếu chỗ trống'
json.dump({'items': items, 'flags': []}, open('rc_%s.json' % N, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('rc_%s.json OK' % N, len(items))
