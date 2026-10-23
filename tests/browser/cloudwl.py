"""cloudwl — dựng môi trường Cloud mode giả: backend dữ liệu tổng hợp + shim supabase + handler Edge Function/Worker."""
import json, os, re
import bw
from fakebackend import Backend
from cluster import Cluster, CORS
from wl import GA4, PDFJS, SUPABASE_CDN, EMPTY_JS, FIXTURE

HOST_ID = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf"      # chuỗi hằng trong mã app; ở đây chỉ là id của hồ sơ GIẢ
PLAYER_ID = "00000000-0000-4000-8000-0000000000a2"
PROFILES = json.loads(bw.read_fixture("profiles.json"))

# phản hồi đóng hộp cho Edge Function (không dịch vụ AI thật). Tên → (status, body); thiếu = coi là gọi ngoài kế hoạch.
# turn-creds: hiện CHƯA triển khai ở backend thật (CLAUDE.md); app bỏ qua im lặng nếu không có máy chủ TURN → trả danh sách rỗng.
CANNED = {"turn-creds": (200, {"iceServers": []})}


def fixture_tables():
    t = {k: json.loads(json.dumps(FIXTURE[k])) for k in ("hubs", "notebooks", "sections", "pages", "batches", "blocks", "words")}
    t["profiles"] = json.loads(json.dumps(PROFILES))
    for k in ("word_progress", "block_progress", "notebook_access", "daily_log", "site_visits", "vocab_saves",
              "game_rooms", "game_players", "game_matches", "game_answers", "game_results", "game_gap_sentences",
              "test_items", "word_traps", "toeic"):
        t.setdefault(k, [])
    return t


def app_config(root):
    txt = bw.committed_text(root, "js/config.js")
    g = lambda k: (re.search(k + r':\s*"([^"]*)"', txt) or [None, ""])[1]
    return {"SUPABASE_URL": g("SUPABASE_URL").rstrip("/"), "AUDIO_BASE": g("AUDIO_BASE").rstrip("/")}


def make_handlers(backend, root):
    cfg = app_config(root)

    def fn_handler(req, label):
        name = req.url.split("/functions/v1/", 1)[1].split("?")[0]
        try:
            body = json.loads(req.post_data or "{}")
        except Exception:
            body = {}
        hdr = sorted(k for k in req.headers if k in ("apikey", "authorization", "content-type", "x-client-info"))
        backend.record(label, {"ch": "function", "obj": name, "op": req.method, "headerNames": hdr,
                               "bodyKeys": sorted(body.keys()) if isinstance(body, dict) else None})
        if name in CANNED:
            st, b = CANNED[name]
            return st, "application/json", json.dumps(b), CORS
        backend.unsupported.append({"client": label, "table": "function:" + name, "op": req.method, "why": "Edge Function chưa có phản hồi đóng hộp"})
        return 501, "application/json", json.dumps({"error": "A0: chưa mock"}), CORS

    def storage_handler(req, label):      # board.js xoá tệp tạm bằng fetch DELETE trực tiếp (keepalive)
        path = req.url.split("/storage/v1/object/", 1)[1]
        backend.record(label, {"ch": "storage", "obj": "direct", "op": req.method, "path": backend._norm_path(path)})
        m = re.search(r"/_tmp/([^/]+)/", path)
        if m and m.group(1).upper() in ("TJ",):
            backend.violations.append({"rule": "MP-15", "client": label, "detail": "storage direct " + path})
        return 200, "application/json", "{}", CORS

    def audio_handler(req, label):
        backend.record(label, {"ch": "worker", "obj": "tj-game", "op": req.method, "path": re.sub(r"TEST_\d+", "TEST_<n>", req.url.split("//", 1)[1].split("/", 1)[1])})
        return 200, "audio/mpeg", b"", CORS

    hs = []
    if cfg["SUPABASE_URL"]:
        hs.append((cfg["SUPABASE_URL"] + "/functions/v1/", fn_handler))
        hs.append((cfg["SUPABASE_URL"] + "/storage/v1/object/", storage_handler))
    if cfg["AUDIO_BASE"]:
        hs.append((cfg["AUDIO_BASE"] + "/", audio_handler))
    return hs


def cloud_stubs(root):
    fakesb = open(os.path.join(bw.HERE, "fakesb.js"), encoding="utf-8").read()
    return {GA4: EMPTY_JS, PDFJS: EMPTY_JS, SUPABASE_CDN: (200, "application/javascript", fakesb)}


def new_cluster(browser, site, root):
    be = Backend(fixture_tables(), label=site.label)
    cl = Cluster(browser, site, be, stubs=cloud_stubs(root), handlers=make_handlers(be, root))
    return cl, be


def wait_ready(client, cluster, what="app sẵn sàng"):
    cluster.settle(lambda: client.page.evaluate("!!(window.DB && DB.ready && window.Auth && Auth.user && document.querySelector('.block-card'))"),
                   timeout_ms=20000, what=what)


def canon(entries):
    """Dạng chuẩn để SO SÁNH nhật ký (TEST §5): thứ tự được GIỮ trong cùng nhóm (kênh+đối tượng), các nhóm so như TẬP HỢP.
    Với realtime chỉ so tập (thao tác, sự kiện, khóa payload) đã thấy — không đếm nhịp (alive/state/track phụ thuộc số bước đồng hồ ảo).
    Giới hạn: không phát hiện đổi tần suất/thứ tự tin realtime; lời gọi REST/storage/function/worker thì so cả số lượng và thứ tự trong nhóm."""
    groups = {}
    for e in entries:
        e = {k: v for k, v in e.items() if k not in ("n", "client")}
        key = "%s|%s" % (e.get("ch"), e.get("obj"))
        if e.get("ch") == "realtime":
            sig = json.dumps([e.get("op"), e.get("event"), e.get("payloadKeys"), e.get("presenceKey"), e.get("self")], sort_keys=True)
            groups.setdefault(key, set()).add(sig)
        else:
            groups.setdefault(key, []).append(e)
    return {k: (sorted(v) if isinstance(v, set) else v) for k, v in sorted(groups.items())}


def canon_by_client(be):
    out = {}
    for e in be.log:
        out.setdefault(e["client"], []).append(e)
    return {c: canon(v) for c, v in sorted(out.items())}
