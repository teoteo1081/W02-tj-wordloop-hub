# py verify_all.py N : đáp án Reading vs sách chữa + contact sheet ảnh
import json, sys
from PIL import Image
N = sys.argv[1]
k = json.load(open('key_%s.json' % N, encoding='utf-8'))['RC'].split()
rc = json.load(open('book/rc_payload.json', encoding='utf-8'))
mine = {int(v['num']): v['ans'] for v in rc.values() if str(v['test']) == N}
print('Reading vs sách: có', len(mine), 'lệch', [(n, k[n - 101], mine[n]) for n in range(101, 201) if n in mine and k[n - 101] != mine[n]], 'thiếu', [n for n in range(101, 201) if n not in mine])
fs = ['T2023-%s_q%d.jpg' % (N, i) for i in range(1, 7)] + sorted(f for f in __import__('os').listdir('img') if f.startswith('T2023-%s_g' % N))
ims = [Image.open('img/' + f).convert('RGB') for f in fs]; H = 230
ims = [im.resize((int(im.width * H / im.height), H)) for im in ims]
rows = [ims[:6], ims[6:]]; W = max(sum(i.width for i in r) + 8 * len(r) for r in rows)
sh = Image.new('RGB', (W, H * 2 + 10), 'white'); y = 0
for r in rows:
    x = 0
    for im in r: sh.paste(im, (x, y)); x += im.width + 8
    y += H + 10
sh.save('rcp/contact_%s.png' % N); print('sheet', sh.size, len(fs), 'ảnh')
