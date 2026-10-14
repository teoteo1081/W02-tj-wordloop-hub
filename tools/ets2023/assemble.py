# Ghép OCR bản sách ETS 2023 LC/RC thành thư mục 1 đề: py assemble.py <N>
# ocr/s<N>/: LC trang p001.. (tương đối từ trang 'PART 1'), RC trang p101.. (tương đối từ trang 'PART 5'), rồi chạy parse + in báo cáo.
import sys, os, shutil, subprocess, json, re
N = int(sys.argv[1])
LC = {1: 20, 2: 34, 3: 48, 4: 62, 5: 76, 6: 90, 7: 104, 8: 118, 9: 132, 10: 144}
RC = {1: 20, 2: 52, 3: 82, 4: 112, 5: 142, 6: 172, 7: 202, 8: 232, 9: 262, 10: 292}
lc0, rc0 = LC[N], RC[N]
lc_len = (LC.get(N + 1, 160) - lc0)
rc_len = (RC.get(N + 1, 322) - rc0)
d = "ocr/s%d" % N
shutil.rmtree(d, ignore_errors=True)
os.makedirs(d)
def src(kind, pg, suf):
    """ưu tiên bản OCR dò khe giữa (gLC/gRC) cho L/R; _full lấy từ bản gốc"""
    if suf in ("L", "R"):
        for gd in ("g%s2", "g%s"):
            g = "ocr/" + (gd % kind) + "/p%03d%s.txt" % (pg, suf)
            if os.path.exists(g):
                return g
    return "ocr/big%s/p%03d%s.txt" % (kind, pg, suf)


for i in range(lc_len):
    for suf in ("_full", "L", "R"):
        s = src("LC", lc0 + i, suf)
        if os.path.exists(s):
            shutil.copy(s, "%s/p%03d%s.txt" % (d, 1 + i, suf))
for i in range(rc_len):
    for suf in ("_full", "L", "R"):
        s = src("RC", rc0 + i, suf)
        if os.path.exists(s):
            shutil.copy(s, "%s/p%03d%s.txt" % (d, 101 + i, suf))
print("TEST", N, "LC trang", lc0, "..", lc0 + lc_len - 1, "| RC trang", rc0, "..", rc0 + rc_len - 1)
# Part 3-4: trang tương đối 6..12 (đúng với cấu trúc đã thấy ở Test 1)
subprocess.run([sys.executable, "parse_lc.py", d, str(N), "6", "13"])
subprocess.run([sys.executable, "parse_p5.py", d, str(N)])
a = json.load(open("lc_%d.json" % N, encoding="utf-8"))
print("câu cần có hình (Look at the graphic):", [x["num"] for x in a if "graphic" in x["stem"].lower()])
bad = [x["num"] for x in a if re.search(r"[|¥©]", x["stem"] + "".join(x["opts"]))]
print("ký tự lạ:", bad)
print("đáp án dài >85:", [(x["num"], max(len(o) for o in x["opts"])) for x in a if max(len(o) for o in x["opts"]) > 85])
