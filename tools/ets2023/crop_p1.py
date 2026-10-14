# Cắt 6 ảnh Part 1 (2 ảnh / trang, trang 3-5 của PDF đề): py crop_p1.py <pdf> <số đề> [trang_đầu=3]
import sys, os, numpy as np, pymupdf
from PIL import Image
pdf, t = sys.argv[1], sys.argv[2]
p0 = int(sys.argv[3]) if len(sys.argv) > 3 else 3
os.makedirs("img", exist_ok=True)
doc = pymupdf.open(pdf)


def run(mask, thr, minlen):
    ok = mask > thr
    best = (0, 0); i = 0
    while i < len(ok):
        if ok[i]:
            j = i
            while j < len(ok) and ok[j]:
                j += 1
            if j - i > best[1] - best[0]:
                best = (i, j)
            i = j
        else:
            i += 1
    return best if best[1] - best[0] >= minlen else None


k = 1
for pg in range(p0, p0 + 3):
    im = doc[pg - 1].get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
    a = np.frombuffer(im.samples, dtype=np.uint8).reshape(im.height, im.width)
    H, W = a.shape
    for half in (0, 1):
        y0, y1 = (int(H * 0.03), int(H * 0.54)) if half == 0 else (int(H * 0.54), int(H * 0.93))
        sub = a[y0:y1] < 225
        xr = next((r for r in (run(sub.mean(axis=0), th, W // 5) for th in (0.30, 0.20, 0.12, 0.06)) if r), None)
        if not xr:
            print("không thấy ảnh", pg, half); k += 1; continue
        yr = next((r for r in (run(sub[:, xr[0]:xr[1]].mean(axis=1), th, H // 8) for th in (0.30, 0.20, 0.12, 0.06)) if r), None)
        if not yr:
            print("không thấy ảnh y", pg, half); k += 1; continue
        box = (xr[0], y0 + yr[0], xr[1], y0 + yr[1])
        Image.fromarray(a[box[1]:box[3], box[0]:box[2]]).convert("RGB").save("img/T2023-%s_q%d.jpg" % (t, k), quality=85)
        print("q%d" % k, box)
        k += 1

