# Cắt hình "Look at the graphic" Part 3-4 (nằm giữa đường kẻ ngăn nhóm phía trên và câu đầu nhóm). py crop_graphics.py N
import sys, os, re, io, csv, json, subprocess
import numpy as np, pymupdf, cv2
from PIL import Image
N = int(sys.argv[1]); LC = {1: 20, 2: 34, 3: 48, 4: 62, 5: 76, 6: 90, 7: 104, 8: 118, 9: 132, 10: 144}
PDF = r'C:\Users\User\Desktop\TJ\_staging\ETS 2023\ETS 2023 LC.pdf'; TESS = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
D = 'ocr/s%d' % N; groups = json.load(open('lc34_%d.json' % N, encoding='utf-8'))['graphic_groups']
doc = pymupdf.open(PDF); DPI = 220
def clean(png):
    im = cv2.imread(png, 0); bg = cv2.GaussianBlur(im, (0, 0), 25); n = cv2.divide(im, bg, scale=255)
    _, bw = cv2.threshold(n, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU); return n, bw
def render(rel):
    pix = doc[LC[N] + rel - 2].get_pixmap(dpi=DPI, colorspace=pymupdf.csGRAY); png = 'rcp/_pg.png'; pix.save(png)
    gray, bw = clean(png); cv2.imwrite('rcp/_pgc.png', bw); return gray, bw
def tsv(png):
    r = subprocess.run([TESS, png, 'stdout', '--psm', '3', 'tsv'], capture_output=True, env={**os.environ, 'OMP_THREAD_LIMIT': '2'})
    rows = list(csv.reader(io.StringIO(r.stdout.decode('utf8', 'ignore')), delimiter='\t', quoting=csv.QUOTE_NONE)); h = rows[0]; ix = {k: i for i, k in enumerate(h)}
    L = {}
    for x in rows[1:]:
        if len(x) < len(h) or x[ix['level']] != '5' or not x[ix['text']].strip(): continue
        L.setdefault((x[ix['block_num']], x[ix['par_num']], x[ix['line_num']]), []).append((int(x[ix['left']]), int(x[ix['top']]), int(x[ix['width']]), int(x[ix['height']]), x[ix['text']]))
    out = []
    for ws in L.values():
        ws.sort(); out.append({'x0': ws[0][0], 'x1': max(w[0] + w[2] for w in ws), 'y0': min(w[1] for w in ws), 'y1': max(w[1] + w[3] for w in ws), 't': ' '.join(w[4] for w in ws)})
    return out
USED = set()
MAN = json.load(open('crop_manual_%d.json' % N)) if os.path.exists('crop_manual_%d.json' % N) else {}
for g in groups:
    if str(g) in MAN:   # [trang tương đối, x0, y0, x1, y1] theo tỉ lệ trang
        rel, x0f, y0f, x1f, y1f = MAN[str(g)]; gray, bw = render(rel); H, W = bw.shape
        Image.fromarray(gray).crop((int(x0f * W), int(y0f * H), int(x1f * W), int(y1f * H))).save('img/T2023-%d_g%d.jpg' % (N, g), quality=92); print('nhóm', g, 'thủ công trang', rel); continue
    rel = None
    for gg in (g, g + 1, g + 2, g - 1):
        rel = next((p for p in range(1, 16) if os.path.exists('%s/p%03d_full.txt' % (D, p)) and re.search(r'(?m)^\s*%d\s*[.,]' % gg, open('%s/p%03d_full.txt' % (D, p), encoding='utf8', errors='ignore').read())), None)
        if rel: break
    if rel is None: print('KHÔNG thấy trang của nhóm', g); continue
    gray, bw = render(rel); H, W = bw.shape; mid = W // 2
    lines = tsv('rcp/_pgc.png')
    q = [l for gg in (g, g + 1, g + 2) for l in lines if re.match(r'^\s*%d\s*[.,]' % gg, l['t'])]
    if not q:   # OCR đọc sai số: dùng dòng 'Look at the graphic' đầu tiên chưa dùng
        gl = sorted([l for l in lines if re.search(r'(?i)look at the graphic', l['t'])], key=lambda l: (l['x0'] > mid, l['y0']))
        gl = [l for l in gl if (rel, l['x0'], l['y0']) not in USED]
        if gl: q = gl[:1]; USED.add((rel, gl[0]['x0'], gl[0]['y0']))
    if not q: print('nhóm', g, 'trang', rel, ': không tìm được câu đầu'); continue
    q = min(q, key=lambda l: l['y0']); col = 0 if (q['x0'] + q['x1']) / 2 < mid else 1
    cx0, cx1 = (60, mid - 25) if col == 0 else (mid + 25, W - 60)
    # đường kẻ ngang: hàng có >55% pixel tối trong cột
    dark = (bw[:, cx0:cx1] < 128).mean(axis=1); rows = np.where(dark > 0.55)[0]
    rules = []
    for y in rows:
        if not rules or y - rules[-1][1] > 3: rules.append([y, y])
        else: rules[-1][1] = y
    def separator(r):   # đường kẻ ngăn nhóm: phía dưới nó có khoảng trắng; viền bảng: có chữ/nội dung ngay dưới
        return (bw[r[1] + 5:r[1] + 28, cx0:cx1] < 128).mean() < 0.004
    above = [r for r in rules if r[1] < q['y0'] - 150 and separator(r)]
    top = (above[-1][1] + 10) if above else max(int(0.08 * H), 0)
    # nếu không có đường kẻ: cắt từ dòng chữ cuối thuộc nhóm trước
    if not above:   # nhóm ở đầu cột: hình bắt đầu từ chỗ có nội dung đầu tiên của cột (bỏ lề trên ~7%)
        colmask = (bw[:, cx0:cx1] < 128).mean(axis=1); ys = np.where(colmask[int(0.07 * H):q['y0'] - 40] > 0.02)[0]
        top = max(int(0.05 * H), (int(0.07 * H) + int(ys[0]) - 30)) if len(ys) else int(0.08 * H)
    box = (cx0, top, cx1, q['y0'] - 8)
    if box[3] - box[1] < 80: print('nhóm', g, 'vùng quá thấp', box); continue
    # ảnh sắc nét: lấy từ ảnh xám đã chia nền (không nhị phân hoá) để giữ độ xám
    for l in lines:
        if re.search(r'(?i)look at the graphic', l['t']) and q['y0'] - 5 <= l['y0'] <= q['y0'] + 800 and abs(l['x0'] - q['x0']) < 400: USED.add((rel, l['x0'], l['y0']))
    crop = Image.fromarray(gray).crop(box); crop.save('img/T2023-%d_g%d.jpg' % (N, g), quality=92); print('nhóm', g, 'trang', rel, 'cột', col, box, '->', 'T2023-%d_g%d.jpg' % (N, g), 'rules', len(rules))
