"""Tải file âm thanh nghe (listening/TEST_<n>_LC.mp3) lên R2 bucket `tj-game`.

Vì Worker tj-game phát công khai là CHỈ-ĐỌC (không PUT), việc ghi file làm theo cách an toàn, không cần tạo khoá R2 mới:
  1) triển khai TẠM một Worker có PUT, khoá upload ngẫu nhiên sinh ra lúc chạy (không lưu đâu cả),
  2) PUT từng file,
  3) triển khai lại Worker CHỈ-ĐỌC (tools/game-worker/worker.js) -> khoá tạm hết hiệu lực,
  4) kiểm kích thước qua HEAD + ghi vào manifest.json (sổ file, để báo cáo hạ tầng đọc).
Cần: CF_ACCOUNT_ID + CF_SHELF_TOKEN (quyền Workers Scripts + R2 Edit) trong biến môi trường hoặc ~/.tj-secrets/kho.env.
Dùng:  py upload_audio.py <đường dẫn file.mp3> [<file.mp3> ...]   (tên file phải dạng TEST_<n>_LC.mp3)
Hoặc từ Python:  from upload_audio import upload_mp3;  upload_mp3({"TEST_2023-11_LC.mp3": r"D:\\...\\file.mp3"})
"""
import json, os, re, secrets, sys, urllib.error, urllib.request, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT, BUCKET = "tj-game", "tj-game"
HOST = "https://tj-game.tj-wordloop.workers.dev"
NAME_OK = re.compile(r"^TEST_[A-Za-z0-9_.-]+_LC\.mp3$")

UPLOAD_JS = """
const PATH_OK = /^\\/listening\\/([A-Za-z0-9_.-]+\\.mp3)$/;
export default { async fetch(req, env) {
  if (req.method !== "PUT") return new Response("temp uploader", { status: 405 });
  if (req.headers.get("x-upload-key") !== env.UPLOAD_KEY) return new Response("forbidden", { status: 403 });
  const mm = PATH_OK.exec(new URL(req.url).pathname);
  if (!mm) return new Response("bad path", { status: 400 });
  await env.BUCKET.put("listening/" + mm[1], req.body, { httpMetadata: { contentType: "audio/mpeg", cacheControl: "public, max-age=604800" } });
  return new Response("ok");
} };
"""


def _env():
    e = dict(os.environ)
    p = os.path.join(os.path.expanduser("~"), ".tj-secrets", "kho.env")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                e.setdefault(k.strip(), v.strip())
    return e


def _cf(path, token, method, data, ctype):
    req = urllib.request.Request("https://api.cloudflare.com/client/v4" + path, method=method, data=data,
                                 headers={"Authorization": "Bearer " + token, "Content-Type": ctype, "User-Agent": "tj-audio"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode() or "{}")


def _deploy(acct, token, js, key=None):
    bindings = [{"type": "r2_bucket", "name": "BUCKET", "bucket_name": BUCKET}]
    if key:
        bindings.append({"type": "secret_text", "name": "UPLOAD_KEY", "text": key})
    meta = {"main_module": "worker.js", "compatibility_date": "2025-01-01", "bindings": bindings}
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n{json.dumps(meta)}\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n'
            f'Content-Type: application/javascript+module\r\n\r\n{js}\r\n--{b}--\r\n').encode("utf-8")
    r = _cf(f"/accounts/{acct}/workers/scripts/{SCRIPT}", token, "PUT", body, f"multipart/form-data; boundary={b}")
    if not r.get("success"):
        raise SystemExit("Không triển khai được Worker: %s" % r.get("errors"))


def upload_mp3(files):
    """files: {"TEST_<n>_LC.mp3": đường_dẫn_file}. Trả về True nếu mọi file khớp kích thước."""
    e = _env()
    acct, token = e.get("CF_ACCOUNT_ID"), e.get("CF_SHELF_TOKEN")
    if not (acct and token):
        raise SystemExit("Thiếu CF_ACCOUNT_ID / CF_SHELF_TOKEN (đặt biến môi trường hoặc ~/.tj-secrets/kho.env)")
    for n in files:
        if not NAME_OK.match(n):
            raise SystemExit("Tên file phải dạng TEST_<n>_LC.mp3, nhận: " + n)
    key = secrets.token_urlsafe(24)
    final_js = open(os.path.join(HERE, "worker.js"), encoding="utf-8").read()
    _deploy(acct, token, UPLOAD_JS, key)
    ok_all, sizes = True, {}
    try:
        import time
        time.sleep(5)
        for n, path in files.items():
            data = open(path, "rb").read()
            req = urllib.request.Request("%s/listening/%s" % (HOST, n), data=data, method="PUT",
                                         headers={"x-upload-key": key, "content-type": "audio/mpeg", "User-Agent": "tj-audio"})
            if urllib.request.urlopen(req, timeout=300).read() != b"ok":
                raise SystemExit("Ghi thất bại: " + n)
            sizes[n] = len(data)
            print("đã ghi", n, len(data))
    finally:
        _deploy(acct, token, final_js)   # luôn trả về bản chỉ-đọc, kể cả khi lỗi giữa chừng
        print("đã triển khai lại Worker chỉ-đọc")
    import time
    time.sleep(5)
    mp = os.path.join(HERE, "manifest.json")
    man = json.load(open(mp, encoding="utf-8")) if os.path.exists(mp) else {}
    for n, sz in sizes.items():
        req = urllib.request.Request("%s/listening/%s" % (HOST, n), method="HEAD", headers={"User-Agent": "tj-audio"})
        got = int(urllib.request.urlopen(req, timeout=60).headers["Content-Length"])
        good = got == sz
        ok_all &= good
        print(("OK   " if good else "LỆCH ") + n, sz, got)
        if good:
            man["listening/" + n] = {"size": sz}
    json.dump(man, open(mp, "w", encoding="utf-8"), indent=0)
    return ok_all


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(0 if upload_mp3({os.path.basename(p): p for p in sys.argv[1:]}) else 1)
