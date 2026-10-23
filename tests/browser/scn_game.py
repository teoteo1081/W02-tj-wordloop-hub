"""Hai client độc lập trong phòng game (TEST §7 MP-01..04, MP-15; §5 CALL-G01/G02; PLAN M0.7).

Mỗi người một BrowserContext (storage riêng, hạt giống random khác nhau), nối qua broker giả trong tiến trình test,
phòng `ZZ_A0_ROOM`. Đồng hồ ảo: thời gian chỉ trôi khi test `tick()`. Đáp án đúng suy từ fixture (nghĩa → từ), không đọc
cờ đúng/sai của app; người chơi cố ý sai vài câu để điểm hai bên khác nhau và kiểm được.
Giới hạn nói thẳng: broker giả không mô phỏng độ trễ/mất gói ngoài những gì test chủ động bơm; thư viện Realtime thật
(tự nối lại, heartbeat) không chạy ở đây — phần đó là kiểm tay hai thiết bị thật.
"""
import json, re
import bw, cloudwl
from wl import scenario, real_errors, FIXTURE

ROOM = "ZZ_A0_ROOM"
ROOM_ID = "00000000-0000-4000-8000-0000000000b1"
HOST_PID = "00000000-0000-4000-8000-0000000000c1"
ALICE_PID = "00000000-0000-4000-8000-0000000000c2"
HOST = cloudwl.HOST_ID
TERM_BY_VI = {w["meaning_vi"]: w["term"] for w in FIXTURE["words"] if w["block_id"] == "bl_syn_1"}
EPOCH = "2026-10-22T00:00:00.000Z"


def me(pid, name):
    return json.dumps({"id": pid, "name": name, "name_no": None, "avatar": None})


def seed_room(be):
    be.tables["game_rooms"].append({"id": ROOM_ID, "code": ROOM, "host_id": HOST, "title": "", "mode": "kahoot", "qtype": "meaning",
                                    "minutes": 1, "q_seconds": 10, "meaning_lang": "vi", "status": "lobby", "created_at": EPOCH,
                                    "scope": [{"table": "blocks", "id": "bl_syn_1", "title": "Block 1"}]})
    be.tables["game_players"] += [
        {"id": HOST_PID, "name": "TJ", "name_no": None, "avatar": None, "profile_id": HOST, "created_at": EPOCH},
        {"id": ALICE_PID, "name": "Alice", "name_no": None, "avatar": None, "profile_id": None, "created_at": "2026-10-22T00:00:01.000Z"}]


def setup(env, room=ROOM):
    cl, be = cloudwl.new_cluster(env.browser, env.site, env.site.root)
    seed_room(be)
    host = cl.client("host", ls={"tjwl_game_player_v1": me(HOST_PID, "TJ")}, seed=11)
    host.goto("/game.html?u=%s&room=%s" % (HOST, room))
    player = cl.client("player", ls={"tjwl_game_player_v1": me(ALICE_PID, "Alice")}, seed=23)
    player.goto("/game.html?room=%s" % room)
    return cl, be, host, player


def screens(c):
    return c.page.evaluate("[...document.querySelectorAll('section.g-screen')].filter(s=>!s.hidden).map(s=>s.id)")


def wait_screen(cl, c, sid, what=None, timeout=20000):
    cl.settle(lambda: sid in screens(c), timeout_ms=timeout, step=250, what=what or "%s ở %s" % (c.label, sid))


def lobby_ready(cl, host, player):
    wait_screen(cl, host, "s-lobby"); wait_screen(cl, player, "s-lobby")
    cl.settle(lambda: all("Alice" in c.page.inner_text("#s-lobby") and "TJ" in c.page.inner_text("#s-lobby") for c in (host, player)),
              timeout_ms=15000, step=250, what="hai bên thấy nhau trong phòng chờ")


def question(c):
    return c.page.evaluate("""(() => { const p = document.querySelector('#p-vi'); if (!p || !p.offsetParent) return null;
        const vi = p.firstChild ? (p.firstChild.textContent || '').trim() : '';
        const opts = [...document.querySelectorAll('#p-opts .g-opt')];
        return {vi, opts: opts.map(b => b.dataset.opt), picked: opts.some(b => b.classList.contains('picked'))}; })()""")


def play(cl, host, player, wrong_player=(), stop=None, max_ms=400000):
    """Chơi tới màn kết quả. Mỗi client trả lời MỌI câu khi chưa chọn, bằng đáp án ĐÚNG (suy từ fixture), trừ người chơi
    ở các chỉ số câu `wrong_player` (đếm theo số câu người đó đã trả lời). Ván chạy theo thời gian nên số câu > số từ.
    `stop(n_host, seen)` trả True để dừng sớm (kịch bản tải lại giữa ván). Trả về các câu đã thấy theo từng client."""
    seen = {host.label: [], player.label: []}
    waited = 0
    while waited < max_ms:
        cl.broker.pump()
        if "s-end" in screens(host) and "s-end" in screens(player):
            break
        for c in (host, player):
            q = question(c)
            if not q or not q["vi"] or q["picked"]:
                continue
            qi = len(seen[c.label])
            seen[c.label].append(q["vi"])
            right = TERM_BY_VI[q["vi"]]
            pick = right
            if c is player and qi in wrong_player:
                pick = next(o for o in q["opts"] if o != right)
            c.page.click('#p-opts .g-opt[data-opt="%s"]' % pick)
        if stop and stop(len(seen[host.label]), seen):
            return seen
        cl.tick(250)
        waited += 250
    return seen


BOARD_JS = r"""[...document.querySelectorAll('#e-board li')].map(li => li.querySelector('.g-pname').innerText.trim() + ' ' +
    li.querySelector('.g-tally').innerText.replace(/\s+/g, ' ').trim())"""


def by_client(be):
    out = {}
    for e in be.log:
        out.setdefault(e["client"], []).append({k: v for k, v in e.items() if k not in ("n", "client")})
    return out


def clean(sc, be, cl, *clients):
    sc.eq(be.unsupported, [], "không có truy vấn/hàm chưa hỗ trợ hay lời gọi ngoài kế hoạch")
    sc.eq(be.violations, [], "MP-15: không chạm phòng/đường dẫn thật (kênh, game_rooms.code, storage)")
    sc.eq(cl.broker.topics() and [t for t in cl.broker.topics() if t != "game:" + ROOM], [], "chỉ có kênh game:%s" % ROOM)
    for c in clients:
        sc.eq(real_errors(c.ctx), [], "%s: console không có lỗi" % c.label)
        sc.eq(c.ctx.guard.blocked, [], "%s: không có request ngoài khai báo" % c.label)


# ──────────────────────────────────────────────────────────────────────────
@scenario(["MP-01", "MP-15", "CALL-G02"], "Host + người chơi vào phòng ZZ: thấy nhau qua presence; hello → state đồng bộ; chỉ kênh ZZ")
def mp01_lobby(sc, env):
    cl, be, host, player = setup(env)
    lobby_ready(cl, host, player)
    ht, pt = host.page.inner_text("#s-lobby"), player.page.inner_text("#s-lobby")
    sc.check("Alice" in ht and "TJ" in ht, "host thấy cả TJ và Alice trong phòng chờ")
    sc.check("Alice" in pt and "TJ" in pt and "Chờ host bắt đầu" in pt, "người chơi thấy cả hai và dòng 'Chờ host bắt đầu'")
    sc.check(host.page.query_selector("#l-start") is not None and host.page.is_visible("#l-start"), "host có nút ▶ Bắt đầu hiển thị")
    sc.check(not player.page.is_visible("#l-start"), "người chơi KHÔNG thấy nút ▶ Bắt đầu")
    rt = [(e["client"], e["op"], e.get("event")) for e in be.log if e["ch"] == "realtime"]
    sc.check(("player", "send", "hello") in rt, "người chơi gửi hello khi vào kênh")
    sc.check(("host", "send", "state") in rt, "host gửi state (đồng bộ trạng thái phòng chờ)")
    sc.eq(sorted({e["client"] for e in be.log if e["ch"] == "realtime" and e["op"] == "join"}), ["host", "player"], "cả hai client join kênh")
    sc.eq(cl.broker.topics(), ["game:" + ROOM], "broker chỉ có kênh game:%s" % ROOM)
    clean(sc, be, cl, host, player)
    sc.ev("calls", cloudwl.canon_by_client(be))
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["MP-02", "CALL-G01", "CALL-G02"], "Ván điền/chọn từ trọn vẹn: bắt đầu → hai bên cùng câu → trả lời → điểm hai bên khớp → kết thúc → ghi kết quả")
def mp02_full_game(sc, env):
    cl, be, host, player = setup(env)
    lobby_ready(cl, host, player)
    host.page.click("#l-start")
    wait_screen(cl, host, "s-play"); wait_screen(cl, player, "s-play")
    sc.check(True, "bấm ▶ Bắt đầu: cả hai sang màn chơi")
    start_calls = len(be.log)
    seen = play(cl, host, player, wrong_player={2, 5})
    wait_screen(cl, host, "s-end", timeout=30000); wait_screen(cl, player, "s-end", timeout=30000)
    cl.run(3000)
    n = len(seen["host"])
    sc.check(n >= 10, "ván có ít nhất 10 câu (chạy theo thời gian nên lặp lại từ)", questions=n)
    sc.eq(seen["host"], seen["player"], "hai bên thấy CÙNG chuỗi câu hỏi theo cùng thứ tự (trạng thái đồng bộ)")
    sc.eq(len(set(seen["host"])), 10, "đủ 10 từ khác nhau của Block 1 đã xuất hiện")
    hb, pb = host.page.evaluate(BOARD_JS), player.page.evaluate(BOARD_JS)
    sc.eq(sorted(hb), ["Alice ✓%d ✗2" % (n - 2), "TJ ✓%d ✗0" % n], "bảng điểm cuối của host: TJ đúng hết, Alice sai đúng 2 câu đã chọn sai")
    sc.eq(sorted(pb), sorted(hb), "bảng điểm cuối của người chơi giống hệt bảng của host (điểm khớp sau graded)")
    rooms = [r for r in be.tables["game_rooms"] if r["code"] == ROOM]
    sc.eq(len(rooms), 1, "vẫn một phòng ZZ, không tạo phòng mới")
    sc.eq(rooms[0]["status"], "lobby", "phòng quay về lobby sau khi kết thúc")
    matches = be.tables["game_matches"]
    sc.eq(len(matches), 1, "ghi đúng một ván vào game_matches")
    res = {r["player_id"]: r for r in be.tables["game_results"]}
    sc.eq(sorted(res), sorted([HOST_PID, ALICE_PID]), "game_results có dòng của cả host và Alice")
    if len(res) == 2:
        h, a = res[HOST_PID], res[ALICE_PID]
        sc.eq((h["correct"], h["wrong"]), (n, 0), "host: mọi câu đúng, 0 sai (đã lưu vào game_results)")
        sc.eq((a["correct"], a["wrong"]), (n - 2, 2), "Alice: sai đúng 2 câu đã cố ý chọn sai (đã lưu)")
        sc.check(h["score"] > a["score"] and h["rank"] == 1 and a["rank"] == 2, "điểm và hạng khớp: host hơn Alice", host=h["score"], alice=a["score"])
        sc.eq({r["match_id"] for r in res.values()}, {matches[0]["id"]}, "game_results trỏ đúng ván vừa ghi")
    ans = be.tables["game_answers"]
    sc.eq(len(ans), 2 * n, "game_answers ghi câu trả lời của CẢ HAI cho từng câu (2 × số câu)")
    clean(sc, be, cl, host, player)
    sc.ev("calls", cloudwl.canon_by_client(be))
    sc.ev("stored", {"results": sorted(({k: r.get(k) for k in ("correct", "wrong", "rank")} for r in be.tables["game_results"]), key=lambda x: x["rank"]),
                     "answers": len(ans), "matches": len(matches), "room_status": rooms[0]["status"]})
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["MP-03"], "Host tải lại giữa ván: không bị hạ vai (relay chặn trước khối nhường host); ván tiếp tục tới kết quả")
def mp03_host_reload(sc, env):
    cl, be, host, player = setup(env)
    lobby_ready(cl, host, player)
    host.page.click("#l-start")
    wait_screen(cl, host, "s-play"); wait_screen(cl, player, "s-play")
    reloaded = {}
    def stop(n, seen):
        return n >= 4
    seen = play(cl, host, player, stop=stop)
    q_before = question(player)
    before_room = host.page.evaluate("document.querySelector('#g-room-badge').hidden")
    sc.eq(before_room, False, "trước khi tải lại: host có huy hiệu phòng/vai host")
    # Lỗi QA cũ chỉ lộ khi bản sao `state` (relay:1) của người chơi tới host SAU khi host đã lên vai. Thứ tự đến tự nhiên trong
    # broker tiền định cho relay tới TRƯỚC, nên chủ động GIỮ relay gửi tới host rồi thả sau khi host đã nhận lại vai.
    hpage = host.page
    cl.broker.hold_matching(lambda page, m: page is hpage and m.get("kind") == "broadcast" and m.get("event") == "state"
                            and isinstance(m.get("payload"), dict) and m["payload"].get("relay"))
    host.page.reload(wait_until="load")
    cl.settle(lambda: not host.page.evaluate("document.querySelector('#g-room-badge').hidden"), timeout_ms=10000, step=250,
              what="host nhận lại vai sau khi tải lại")
    held = len(cl.broker.held)
    sc.check(held >= 1, "đường relay thật sự được chạy: người chơi đã gửi bản sao state (relay:1) cho host vắng", held=held)
    sc.eq(cl.broker.release_held(), held, "thả relay tới host khi host ĐÃ là host")
    cl.run(3000)
    sc.check(not host.page.evaluate("document.querySelector('#g-room-badge').hidden"), "sau khi tải lại và nhận relay muộn: host VẪN là host (không bị hạ vai thành người chơi)")
    sc.check("s-play" in screens(host) or "s-end" in screens(host), "host vào lại đúng ván đang chơi, không về phòng chờ", screens=screens(host))
    sc.check(not player.page.is_visible("#l-start"), "người chơi không bị nâng lên host")
    # ván tiếp tục tới hết
    seen2 = play(cl, host, player)
    wait_screen(cl, host, "s-end", timeout=60000); wait_screen(cl, player, "s-end", timeout=60000)
    cl.run(2000)
    res = {r["player_id"]: r for r in be.tables["game_results"]}
    sc.check(HOST_PID in res and ALICE_PID in res, "ván kết thúc và ghi kết quả cho cả hai sau khi host tải lại", players=sorted(res))
    sc.eq(len(be.tables["game_matches"]), 1, "chỉ MỘT ván trong game_matches (tải lại không tạo ván mới)")
    clean(sc, be, cl, host, player)
    sc.ev("seen_before_reload", len(seen["host"]))
    sc.ev("stored", {"results_n": len(res), "matches": len(be.tables["game_matches"])})
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["MP-04"], "Người chơi tải lại giữa ván: hello → host trả state → nối lại đúng ván, điểm đã chơi không mất")
def mp04_player_reload(sc, env):
    cl, be, host, player = setup(env)
    lobby_ready(cl, host, player)
    host.page.click("#l-start")
    wait_screen(cl, host, "s-play"); wait_screen(cl, player, "s-play")
    seen = play(cl, host, player, stop=lambda n, s: n >= 4)
    answered_before = len(seen["player"])
    player.page.reload(wait_until="load")
    cl.settle(lambda: "s-play" in screens(player), timeout_ms=20000, step=250, what="người chơi nối lại màn chơi")
    sc.check(True, "sau tải lại người chơi quay lại màn chơi (không kẹt ở phòng chờ)")
    sc.check(not host.page.evaluate("document.querySelector('#g-room-badge').hidden"), "host không bị ảnh hưởng, vẫn là host")
    rt = [(e["client"], e["op"], e.get("event")) for e in be.log if e["ch"] == "realtime"]
    sc.check(rt.count(("player", "send", "hello")) >= 2, "người chơi gửi hello lần nữa sau khi tải lại", hello=rt.count(("player", "send", "hello")))
    seen2 = play(cl, host, player)
    wait_screen(cl, host, "s-end", timeout=60000); wait_screen(cl, player, "s-end", timeout=60000)
    cl.run(2000)
    res = {r["player_id"]: r for r in be.tables["game_results"]}
    sc.check(ALICE_PID in res, "Alice vẫn có kết quả được ghi sau khi tải lại giữa ván")
    if ALICE_PID in res:
        a, h = res[ALICE_PID], res[HOST_PID]
        sc.eq(a["correct"] + a["wrong"], h["correct"] + h["wrong"], "Alice được tính đủ MỌI câu của ván như host (câu lỡ lúc tải lại tính là sai, không biến mất)")
        sc.check(a["correct"] >= answered_before - 1, "điểm đúng trước khi tải lại không mất", correct=a["correct"], before=answered_before)
    sc.eq(len(be.tables["game_matches"]), 1, "một ván duy nhất")
    clean(sc, be, cl, host, player)
    sc.ev("stored", {"results_n": len(res)})
    cl.close()


# ──────────────────────────────────────────────────────────────────────────
@scenario(["MP-15"], "Phản chứng bảo vệ phòng thật: một client cố vào phòng 'TJ' (backend GIẢ) bị ghi nhận là vi phạm, không có gì rời máy")
def mp15_counterproof(sc, env):
    cl, be = cloudwl.new_cluster(env.browser, env.site, env.site.root)
    seed_room(be)
    c = cl.client("probe", ls={"tjwl_game_player_v1": me(ALICE_PID, "Alice")}, seed=5)
    c.goto("/game.html?room=TJ")
    cl.run(3000)
    rules = {v["rule"] for v in be.violations}
    sc.check(rules == {"MP-15"}, "việc cố vào phòng 'TJ' bị phát hiện (bảo vệ hoạt động)", violations=be.violations[:3])
    sc.check(any("game_rooms.code=TJ" in v["detail"] for v in be.violations), "vi phạm ghi rõ truy vấn game_rooms.code=TJ")
    sc.eq(c.ctx.guard.blocked, [], "kể cả vậy không có request nào rời khỏi máy (backend giả)")
    sc.ev("violation_rules", sorted(rules))
    cl.close()
