# OCR 2 cột tự dò khe giữa (không cắt cứng ở w/2): py ocr_gutter.py <pdf> <thư mục ra> <trang_đầu> <trang_cuối> [dpi]
import sys, os, subprocess, numpy as np, pymupdf
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

TESS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pdf, out, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
dpi = int(sys.argv[5]) if len(sys.argv) > 5 else 220
os.makedirs(out, exist_ok=True)
os.environ["OMP_THREAD_LIMIT"] = "1"


def gutter(arr):
    h, w = arr.shape
    lo, hi = int(w * 0.35), int(w * 0.65)
    ink = (arr[:, lo:hi] < 170).sum(axis=0).astype(float)
    k = 21
    sm = np.convolve(ink, np.ones(k) / k, mode="same")
    i = int(np.argmin(sm[k:-k])) + k
    return lo + i, sm[i], sm.mean()


def run(p):
    base = os.path.join(out, "p%03d" % p)
    if os.path.exists(base + "R.txt"):
        return
    doc = pymupdf.open(pdf)
    pix = doc[p - 1].get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY)
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width)
    g, v, mean = gutter(arr)
    w = pix.width
    im = Image.fromarray(arr)
    TR = float(os.environ.get("TRIM", "0"))
    for side, box in (("L", (int(w * TR), 0, min(w, g + 6), pix.height)), ("R", (max(0, g - 6), 0, int(w * (1 - TR)), pix.height))):
        q = base + side + ".png"
        im.crop(box).save(q)
        subprocess.run([TESS, q, base + side, "--psm", "6"], capture_output=True)
        os.remove(q)
    open(base + "_gutter.txt", "w").write("%d %.1f %.1f" % (g, v, mean))
    print("page", p, "gutter", g, "/", w, flush=True)


with ThreadPoolExecutor(4) as ex:
    list(ex.map(run, range(a, b + 1)))
print("done", a, b)
