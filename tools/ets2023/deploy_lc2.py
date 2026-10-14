# Test 2 CHỈ Listening (Reading đã có trong DB): py deploy_lc2.py upload | load   (load cần SBPAT trong môi trường)
import json, re, os, sys, urllib.request
REF = "pqarpszsipbdugrumhfy"; TEST = "2023-2"
cfg = open(r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\js\config.js", encoding="utf-8").read()
URL = re.search(r"https://[a-z0-9]+\.supabase\.co", cfg).group(0)
ANON = re.search(r"eyJ[\w-]+\.[\w-]+\.[\w-]+", cfg).group(0)
items = [x for x in json.load(open("items_2.json", encoding="utf-8")) if x["part"] <= 4]
assert len(items) == 100 and [x["num"] for x in items] == list(range(1, 101))
def up(path, file, ct):
    data = open(file, "rb").read()
    urllib.request.urlopen(urllib.request.Request("%s/storage/v1/object/toeic/%s" % (URL, path), data=data, method="POST",
        headers={"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": ct, "x-upsert": "true"})).read()
    n = int(urllib.request.urlopen(urllib.request.Request("%s/storage/v1/object/public/toeic/%s" % (URL, path), method="HEAD")).headers["Content-Length"])
    print(("OK   " if n == len(data) else "LỆCH ") + path, len(data), n)
    if n != len(data): sys.exit("lệch kích thước")
def lit(v):
    if v is None: return "null"
    return "'" + str(v).replace("'", "''") + "'"
if sys.argv[1] == "upload":
    sys.path.insert(0, r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\tools\game-worker")
    from upload_audio import upload_mp3   # mp3 nghe -> R2 bucket tj-game (KHÔNG còn đẩy lên Supabase)
    if not upload_mp3({"TEST_%s_LC.mp3" % TEST: "audio/TEST_2023_02_LC.mp3"}): sys.exit("lệch kích thước mp3 trên R2")
    for f in sorted({u.split("/")[-1].split("?")[0] for it in items for u in re.findall(r"\[img\] (\S+)", it["passage"])}):
        up("listening/img/" + f, "img/" + f, "image/jpeg")
else:
    PAT = os.environ["SBPAT"]
    def q(sql):
        return json.load(urllib.request.urlopen(urllib.request.Request("https://api.supabase.com/v1/projects/%s/database/query" % REF,
            data=json.dumps({"query": sql}).encode("utf-8"), headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json; charset=utf-8"})))
    have = q("select count(*) n from test_items where exam='toeic' and test='%s' and part<=4" % TEST)[0]["n"]
    if have: sys.exit("ĐÃ có %s câu Listening của %s; không nạp đè" % (have, TEST))
    rows = ",\n".join("(%s,'toeic',%s,%d,%d,%s,%s::jsonb,%s,%s,%s,%s,'key')" % (lit(x["id"]), lit(TEST), x["part"], x["num"], lit(x["stem"]),
        lit(json.dumps(x["opts"], ensure_ascii=False)), lit(x["answer"]), lit(x["tag"]), lit(x["passage"]), lit(x["src"])) for x in items)
    q("insert into test_items (id,exam,test,part,num,stem,opts,answer,tag,passage,src,answer_src) values\n" + rows)
    print(q("select part,count(*) n from test_items where exam='toeic' and test='%s' group by part order by part" % TEST))
