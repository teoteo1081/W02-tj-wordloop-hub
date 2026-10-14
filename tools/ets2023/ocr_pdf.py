# OCR một PDF scan: dựng trang bằng pymupdf, tesseract cắt đôi cột (psm 6) + cả trang (psm 3).
# py ocr_pdf.py <pdf> <thư mục ra> [dpi] [trang_đầu] [trang_cuối]  (trang tính từ 1)
import sys, os, subprocess, pymupdf
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

TESS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pdf, out = sys.argv[1], sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 220
os.makedirs(out, exist_ok=True)
os.environ["OMP_THREAD_LIMIT"] = "1"
doc = pymupdf.open(pdf)
a = int(sys.argv[4]) if len(sys.argv) > 4 else 1
b = int(sys.argv[5]) if len(sys.argv) > 5 else len(doc)


def run(i):
    base = os.path.join(out, "p%03d" % i)
    if os.path.exists(base + "_full.txt"):
        return
    pix = pymupdf.open(pdf)[i - 1].get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY)
    png = base + ".png"
    pix.save(png)
    im = Image.open(png); w, h = im.size
    subprocess.run([TESS, png, base + "_full", "--psm", "3"], capture_output=True)
    for side, box in (("L", (0, 0, w // 2, h)), ("R", (w // 2, 0, w, h))):
        q = base + side + ".png"; im.crop(box).save(q)
        subprocess.run([TESS, q, base + side, "--psm", "6"], capture_output=True); os.remove(q)
    os.remove(png)
    print("page", i, flush=True)


with ThreadPoolExecutor(4) as ex:
    list(ex.map(run, range(a, b + 1)))
print("done", a, b)
