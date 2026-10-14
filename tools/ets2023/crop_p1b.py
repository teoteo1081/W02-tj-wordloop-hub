# Cắt 6 ảnh Part 1 (2 ảnh/trang) bền hơn: nền = trung vị trang, nhóm cột/hàng "có mực" cho phép khoảng hở 45px.
# py crop_p1b.py <pdf> <số đề> <trang_đầu(1-based)> [dpi=150]
import sys, os, numpy as np, pymupdf
from PIL import Image
pdf, t, p0 = sys.argv[1], sys.argv[2], int(sys.argv[3])
dpi = int(sys.argv[4]) if len(sys.argv) > 4 else 150
os.makedirs("img", exist_ok=True)
doc = pymupdf.open(pdf)


def best_run(flags, gap):
    idx = np.where(flags)[0]
    if len(idx) == 0:
        return None
    runs, s, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > gap:
            runs.append((s, prev)); s = i
        prev = i
    runs.append((s, prev))
    return max(runs, key=lambda r: r[1] - r[0])


k = 1
for pg in range(p0, p0 + 3):
    pix = doc[pg - 1].get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY)
    a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width)
    H, W = a.shape
    bg = np.median(a)
    mask = a < bg - 14
    for half in (0, 1):
        y0, y1 = (int(H * 0.02), int(H * 0.53)) if half == 0 else (int(H * 0.53), int(H * 0.94))
        sub = mask[y0:y1]
        xr = best_run(sub.mean(axis=0) > 0.04, 45)
        if not xr:
            print("không thấy ảnh", pg, half); k += 1; continue
        yr = best_run(sub[:, xr[0]:xr[1] + 1].mean(axis=1) > 0.04, 45)
        if not yr:
            print("không thấy ảnh y", pg, half); k += 1; continue
        box = (max(0, xr[0] - 2), y0 + max(0, yr[0] - 2), min(W, xr[1] + 3), y0 + min(sub.shape[0], yr[1] + 3))
        Image.fromarray(a[box[1]:box[3], box[0]:box[2]]).convert("RGB").save("img/T2023-%s_q%d.jpg" % (t, k), quality=85)
        print("q%d" % k, box, "(%dx%d)" % (box[2] - box[0], box[3] - box[1]))
        k += 1
