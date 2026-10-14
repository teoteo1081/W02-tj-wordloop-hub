# Tải audio+ảnh lên Supabase Storage (khoá anon công khai, upsert) rồi nạp test_items. py deploy_test.py <N>  (đặt SBPAT trong môi trường)
import json, re, os, sys, urllib.request
N = int(sys.argv[1])
REF = "pqarpszsipbdugrumhfy"
cfg = open(r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\js\config.js", encoding="utf-8").read()
URL = re.search(r"https://[a-z0-9]+\.supabase\.co", cfg).group(0)
ANON = re.search(r"eyJ[\w-]+\.[\w-]+\.[\w-]+", cfg).group(0)
PAT = os.environ["SBPAT"]
TEST = "2023-%d" % N
rep = open("report_%d.txt" % N, encoding="utf-8").read()
assert "vấn đề: 0" in rep, "báo cáo còn vấn đề, không nạp"
items = json.load(open("items_%d.json" % N, encoding="utf-8"))


def up(path, file, ct):
    data = open(file, "rb").read()
    req = urllib.request.Request("%s/storage/v1/object/toeic/%s" % (URL, path), data=data, method="POST",
                                 headers={"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": ct, "x-upsert": "true"})
    urllib.request.urlopen(req).read()
    r = urllib.request.Request("%s/storage/v1/object/public/toeic/%s" % (URL, path), method="HEAD")
    n = int(urllib.request.urlopen(r).headers["Content-Length"])
    ok = n == len(data)
    print(("OK   " if ok else "LỆCH ") + path, len(data), n)
    if not ok:
        sys.exit("lệch kích thước, dừng")


up("listening/TEST_%s_LC.mp3" % TEST, "audio/TEST_2023_%02d_LC.mp3" % N, "audio/mpeg")
files = set()
for it in items:
    for u in re.findall(r"\[img\] (\S+)", it["passage"]):
        files.add(u.split("/")[-1].split("?")[0])
for f in sorted(files):
    up("listening/img/" + f, "img/" + f, "image/jpeg")


def q(sql):
    req = urllib.request.Request("https://api.supabase.com/v1/projects/%s/database/query" % REF, data=json.dumps({"query": sql}).encode("utf-8"),
                                 headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json; charset=utf-8"})
    return json.load(urllib.request.urlopen(req))


have = q("select count(*) n from test_items where exam='toeic' and test='%s'" % TEST)[0]["n"]
if have:
    sys.exit("ĐÃ có %s dòng của %s trong DB; không nạp đè" % (have, TEST))
q(open("load_%d.sql" % N, encoding="utf-8").read())
res = q("select part,count(*) n from test_items where exam='toeic' and test='%s' group by part order by part" % TEST)
print("đã nạp:", {r["part"]: r["n"] for r in res}, "tổng", sum(r["n"] for r in res))
print("ETS 2024 còn nguyên:", q("select count(*) n from test_items where exam='toeic' and test in ('1','2','3','4','5','6','7','8','9','10')")[0]["n"])
