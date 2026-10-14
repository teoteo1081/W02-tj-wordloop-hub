# OCR bảng đáp án chính thức (ảnh) bằng bỏ phiếu nhiều cỡ/chế độ: py ocr_key.py <ảnh> <số đề>
# -> key_<N>_ocr.json {"key":{n:chữ}, "weak":[câu không chắc]}; in số câu nhận được/thiếu/yếu; so với key_<N>.json nếu có.
import sys, re, json, subprocess, os, collections
from PIL import Image, ImageOps, ImageFilter
img, N = sys.argv[1], sys.argv[2]
TESS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
im = Image.open(img).convert("L")
w, h = im.size
votes = collections.defaultdict(collections.Counter)
runs = 0
for side, box in (("L", (0, 0, w // 2, h)), ("R", (w // 2, 0, w, h))):
    base = im.crop(box)
    for scale in (3, 4, 5):
        for sharp in (False, True):
            c = base.resize((base.width * scale, base.height * scale), Image.LANCZOS)
            c = ImageOps.autocontrast(c)
            if sharp:
                c = c.filter(ImageFilter.SHARPEN)
            p = "_k_%s%s.png" % (N, side)
            c.save(p)
            for psm in ("6", "11", "4"):
                txt = subprocess.run([TESS, p, "-", "--psm", psm, "-c", "tessedit_char_whitelist=0123456789()ABCD "], capture_output=True, text=True).stdout
                for m in re.finditer(r"(\d{1,3})\s*[\(\[{]\s*([ABCD])\s*[\)\]}]", txt):
                    n = int(m.group(1))
                    if 1 <= n <= 200 and (side == "L") == (n <= 100):
                        votes[n][m.group(2)] += 1
            os.remove(p)
key, weak = {}, []
for n in range(1, 201):
    v = votes.get(n)
    if not v:
        continue
    (a, ca), rest = v.most_common(1)[0], v.most_common()[1:]
    key[n] = a
    if rest or ca < 6:
        weak.append(n)
miss = [n for n in range(1, 201) if n not in key]
print("TEST", N, "nhận", len(key), "- thiếu:", miss, "- yếu (phiếu lệch/ít):", weak)
json.dump({"key": {str(k): v for k, v in key.items()}, "weak": weak, "missing": miss}, open("key_%s_ocr.json" % N, "w"))
if os.path.exists("key_%s.json" % N):
    k = json.load(open("key_%s.json" % N, encoding="utf-8"))
    ref = {i + 1: c for i, c in enumerate(k["LC"].split())}
    ref.update({101 + i: c for i, c in enumerate(k["RC"].split())})
    print("sai so với bản đã soát:", [(n, key[n], ref[n]) for n in key if n in ref and key[n] != ref[n]])
