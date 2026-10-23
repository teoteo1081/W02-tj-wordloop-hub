"""Cluster — nhiều client độc lập (mỗi người một BrowserContext) nối với MỘT backend giả và MỘT broker Realtime giả.

Tính xác định: đồng hồ của mọi client đã `install` rồi `pause_at` — thời gian chỉ trôi khi test gọi `tick()`
(`clock.run_for`), nên timer của app (alive 10s, đồng hồ câu hỏi...) chạy tiền định và nhanh hơn thời gian thật.
Broker không đẩy tin tới trang ngay trong callback (Playwright sync không cho gọi lồng): tin vào hàng đợi, và
`pump()` đẩy theo thứ tự đến. Test có thể giữ/thả/đảo tin hoặc đóng kênh để bơm lỗi (MP-05, MP-07).
"""
import json, re
import bw
from fakebackend import NOW_MS, REAL_ROOM_CODES

CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"}


class Broker:
    def __init__(self, backend):
        self.b = backend
        self.members = {}          # id -> {label, page, topic, key, self, meta}
        self.n = 0
        self.queue = []            # [(page, msg)] theo thứ tự đến
        self.hold = False
        self.hold_preds = []       # [pred(page, msg)]: tin khớp bị GIỮ lại (bơm trễ/đảo thứ tự) cho tới release_held()
        self.held = []
        self.ref = 0
        self.open_count = lambda: len(self.members)

    # ── gọi từ page qua expose_binding ──
    def handle(self, label, page, d):
        op = d["op"]
        if op == "join":
            topic = d["topic"]
            if topic.split(":", 1)[-1].upper() in REAL_ROOM_CODES:
                self.b.violations.append({"rule": "MP-15", "client": label, "detail": "kênh " + topic})
            self.n += 1
            m = {"label": label, "page": page, "topic": topic, "key": d.get("key"), "self": bool(d.get("self")), "meta": None}
            self.members[self.n] = m
            self.b.record(label, {"ch": "realtime", "obj": topic, "op": "join", "presenceKey": "<key>" if d.get("key") else None,
                                  "self": bool(d.get("self"))})
            self._sync(topic)
            return {"member": self.n}
        m = self.members.get(d.get("member"))
        if op == "leave":
            if m:
                self.b.record(label, {"ch": "realtime", "obj": m["topic"], "op": "leave"})
                del self.members[d["member"]]
                self._sync(m["topic"])
            return {}
        if m is None:
            return {"error": "not joined"}
        if op == "track":
            self.ref += 1
            m["meta"] = dict(d.get("payload") or {}, presence_ref="r%d" % self.ref)
            self.b.record(label, {"ch": "realtime", "obj": m["topic"], "op": "track", "payloadKeys": sorted((d.get("payload") or {}).keys())})
            self._sync(m["topic"])
        elif op == "untrack":
            m["meta"] = None
            self.b.record(label, {"ch": "realtime", "obj": m["topic"], "op": "untrack"})
            self._sync(m["topic"])
        elif op == "send":
            pl = d.get("payload")
            self.b.record(label, {"ch": "realtime", "obj": m["topic"], "op": "send", "event": d.get("event"),
                                  "payloadKeys": sorted(pl.keys()) if isinstance(pl, dict) else None})
            for mid, o in sorted(self.members.items()):
                if o["topic"] != m["topic"] or (o is m and not m["self"]):
                    continue
                self.queue.append((o["page"], {"member": mid, "kind": "broadcast", "event": d.get("event"), "payload": pl}))
        return {}

    def drop_page(self, page):
        """Trang bị tải lại/đóng: máy chủ Realtime thật gỡ presence NGAY khi socket đóng (pagehide không đáng tin).
        Gỡ mọi thành viên của trang đó rồi báo presence mới cho phần còn lại; tin còn trong hàng đợi gửi tới trang đó bị bỏ."""
        gone = [mid for mid, o in self.members.items() if o["page"] is page]
        topics = {self.members[mid]["topic"] for mid in gone}
        for mid in gone:
            del self.members[mid]
        self.queue = [(p, m) for p, m in self.queue if p is not page]
        for t in sorted(topics):
            self._sync(t)

    def _sync(self, topic):
        state = {}
        for mid, o in sorted(self.members.items()):
            if o["topic"] == topic and o["meta"] is not None:
                state.setdefault(o["key"] or str(mid), []).append(dict(o["meta"]))
        for mid, o in sorted(self.members.items()):
            if o["topic"] == topic:
                self.queue.append((o["page"], {"member": mid, "kind": "presence", "state": state}))

    # ── điều khiển từ test ──
    def pump(self, max_rounds=200):
        delivered = 0
        for _ in range(max_rounds):
            if self.hold or not self.queue:
                break
            q, self.queue = self.queue, []
            batches = {}
            for page, msg in q:
                if any(pr(page, msg) for pr in self.hold_preds):
                    self.held.append((page, msg)); continue
                batches.setdefault(id(page), (page, []))[1].append(msg)
            for page, msgs in batches.values():
                try:
                    page.evaluate("b => window.__a0_deliver && window.__a0_deliver(b)", msgs)
                    delivered += len(msgs)
                except Exception:
                    pass          # trang đã đóng/đang điều hướng: tin bị mất như mất mạng
        return delivered

    def hold_matching(self, pred):
        """Giữ lại (không đẩy) các tin khớp pred(page, msg) cho tới khi release_held()."""
        self.hold_preds.append(pred)

    def release_held(self):
        """Thả MỌI tin đang giữ (theo thứ tự đã đến) và ngừng giữ tin mới. Trả số tin đã thả."""
        n = len(self.held)
        self.queue = self.held + self.queue
        self.held, self.hold_preds = [], []
        return n

    def close_member(self, label, status="CLOSED"):
        """Đóng kênh của một client (mất mạng giả): app nhận trạng thái CLOSED và tự nối lại."""
        for mid, o in list(self.members.items()):
            if o["label"] == label:
                self.queue.append((o["page"], {"member": mid, "kind": "status", "status": status}))

    def drop_where(self, pred):
        before = len(self.queue)
        self.queue = [(p, m) for p, m in self.queue if not pred(m)]
        return before - len(self.queue)

    def topics(self):
        return sorted({o["topic"] for o in self.members.values()})


class Client:
    def __init__(self, cluster, label, ctx, page):
        self.cluster, self.label, self.ctx, self.page = cluster, label, ctx, page

    def goto(self, path):
        self.page.goto(self.cluster.site.origin + path, wait_until="load")

    def ev(self, js, arg=None):
        return self.page.evaluate(js, arg)


class Cluster:
    def __init__(self, browser, site, backend, stubs=None, handlers=None, mocks=None):
        self.B, self.site, self.backend = browser, site, backend
        self.broker = Broker(backend)
        self.stubs = dict(stubs or {})
        self.handlers = list(handlers or [])
        self.mocks = dict(mocks or {})
        self.clients = {}

    def client(self, label, viewport="desktop", seed=29, init_extra="", ls=None, session=None):
        """Context mới + trang mới đã gắn shim/backend. `ls` = {khóa: giá trị} đặt vào localStorage TRƯỚC khi app chạy."""
        be, br = self.backend, self.broker
        ctx = self.B.context(self.site, viewport=viewport, seed=seed, mocks=self.mocks, stubs=self.stubs, name=label,
                             now_ms=None)
        ctx.guard.handlers = self.handlers
        ctx.expose_binding("__a0_q", lambda source, d: be.query(label, d))
        ctx.expose_binding("__a0_st", lambda source, d: be.storage_op(label, d))
        ctx.expose_binding("__a0_rt", lambda source, d: br.handle(label, source["page"], d))
        pre = ""
        if ls:
            pre += "try{for(const [k,v] of Object.entries(%s)) localStorage.setItem(k, v);}catch(e){}" % json.dumps(ls)
        if session:
            pre += "try{for(const [k,v] of Object.entries(%s)) sessionStorage.setItem(k, v);}catch(e){}" % json.dumps(session)
        if pre or init_extra:
            ctx.add_init_script("(()=>{ if (window.__A0_PRE_DONE__) return; window.__A0_PRE_DONE__=1; %s %s })();" % (pre, init_extra))
        ctx.clock.install(time=(NOW_MS - 1000) / 1000.0)
        ctx.clock.pause_at(NOW_MS / 1000.0)
        page = self.B.page(ctx)
        page.on("framenavigated", lambda f, pg=page: br.drop_page(pg) if f == pg.main_frame else None)
        page.on("close", lambda pg=page: br.drop_page(pg))
        c = Client(self, label, ctx, page)
        self.clients[label] = c
        return c

    # ── thời gian + tin ──
    def tick(self, ms):
        for c in self.clients.values():
            try:
                c.ctx.clock.run_for(ms)
            except Exception:
                pass

    def settle(self, cond=None, timeout_ms=15000, step=100, what="điều kiện"):
        """Đẩy tin + tiến đồng hồ ảo theo bước cho tới khi cond() đúng. Hết timeout ảo → ném lỗi (không bỏ qua)."""
        waited = 0
        while True:
            self.broker.pump()
            if cond is not None and cond():
                return waited
            if cond is None and waited >= timeout_ms:
                return waited
            if waited >= timeout_ms:
                raise TimeoutError("settle: quá %d ms (ảo) khi chờ %s" % (timeout_ms, what))
            self.tick(step)
            waited += step

    def run(self, ms, step=100):
        return self.settle(None, timeout_ms=ms, step=step)

    def close(self):
        for c in self.clients.values():
            try:
                c.ctx.close()
            except Exception:
                pass
