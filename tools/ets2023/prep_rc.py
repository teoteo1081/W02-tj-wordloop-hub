# Chuẩn hoá thư mục OCR + keys cho rc_parse/gemini: py prep_rc.py N
import re, os, shutil, json, sys
N = sys.argv[1]; D = 'ocr/s%s' % N; O = 'rcp/t%s' % N; os.makedirs(O, exist_ok=True)
for f in os.listdir(D):
    m = re.fullmatch(r'p(\d+)_full\.txt', f)
    if m: shutil.copy(f'{D}/{f}', f'{O}/L-{int(m.group(1)):02d}.txt')
    m = re.fullmatch(r'p(\d+)([LR])\.txt', f)
    if m: shutil.copy(f'{D}/{f}', f'{O}/c{int(m.group(1)):02d}{m.group(2)}.txt')
k = json.load(open('key_%s.json' % N, encoding='utf-8'))['RC'].split(); assert len(k) == 100
d = json.load(open('rcp/keys.json')); d['rc'][N] = {str(101 + i): c for i, c in enumerate(k)}; json.dump(d, open('rcp/keys.json', 'w'))
print('prep ok', N)
