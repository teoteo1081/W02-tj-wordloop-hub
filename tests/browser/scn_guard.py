"""Phản chứng cách ly mạng (SPEC §1.2 'Cách ly mạng/dữ liệu'): request tới endpoint KHÔNG khai báo phải bị chặn,
hiện trong báo cáo, và không có kết nối thật nào ra khỏi máy."""
import wl
from wl import scenario, boot_local


@scenario(["NET-01"], "Chặn mạng: endpoint không khai báo (Supabase thật, miền lạ, WebSocket) bị từ chối và được ghi nhận; origin cục bộ và mock vẫn chạy")
def network_isolation(sc, env):
    ctx, pg = boot_local(env)
    g = ctx.guard
    real_rest = "https://pqarpszsipbdugrumhfy.supabase.co/rest/v1/hubs"
    real_fn = "https://pqarpszsipbdugrumhfy.supabase.co/functions/v1/gemini-proxy"
    other = "https://example.com/a0-probe"
    for u in (real_rest, real_fn, other):
        g.expect_blocked(u)
    g.expect_blocked("wss://pqarpszsipbdugrumhfy.supabase.co/")
    for u in (real_rest, real_fn, other):
        res = pg.evaluate("u => fetch(u, {method:'GET', mode:'no-cors'}).then(() => 'REACHED', e => 'REJECTED')", u)
        sc.eq(res, "REJECTED", "fetch tới %s bị từ chối" % u.split("//")[1][:40])
    ws = pg.evaluate("""() => new Promise(r => { try { const w = new WebSocket('wss://pqarpszsipbdugrumhfy.supabase.co/realtime/v1/websocket');
        w.onopen = () => r('OPENED'); w.onerror = () => r('ERROR'); w.onclose = () => r('CLOSED'); setTimeout(() => r('TIMEOUT'), 4000); } catch (e) { r('THROW'); } })""")
    sc.check(ws in ("ERROR", "CLOSED"), "WebSocket tới Supabase Realtime thật không mở được", result=ws)
    urls = [b["url"] for b in g.blocked]
    for u in (real_rest, real_fn, other):
        sc.check(u in urls, "request bị chặn xuất hiện trong báo cáo guard: %s" % u.split("//")[1][:40])
    sc.check(any(w.startswith("wss://pqarpszsipbdugrumhfy") for w in g.ws_blocked), "WebSocket bị chặn được ghi nhận")
    sc.eq(g.ws_leaked, [], "không có WebSocket nào lọt xuống tầng mạng")
    local = pg.evaluate("fetch('/data/starter.json').then(r => r.json()).then(j => j.version)")
    sc.eq(local, "synthetic-a0-browser-01", "origin cục bộ vẫn phục vụ, starter là bản TỔNG HỢP (mock khai báo), không phải thư viện thật")
    sc.check("/data/starter.json" in g.mocked and "/js/config.js" in g.mocked, "các mock được khai báo và dùng thật", mocked=sorted(set(g.mocked)))
    cfg = pg.evaluate("window.APP_CONFIG.SUPABASE_URL")
    sc.eq(cfg, "", "Local mode: không có URL Supabase nào trong cấu hình đang chạy")
    sc.eq(pg.evaluate("typeof window.supabase"), "undefined", "thư viện supabase-js không được nạp (CDN bị stub rỗng)")
    sc.eq(pg.evaluate("DB.mode"), "local", "app chạy Local mode")


@scenario(["NET-02"], "Chặn mạng, đường lách (QA độc lập): Worker/SharedWorker, RTCPeerConnection, sendBeacon, iframe, EventSource không ra khỏi máy và được ghi nhận")
def network_isolation_bypasses(sc, env):
    ctx, pg = boot_local(env)
    g = ctx.guard
    for p in ("worker:blob", "sharedworker:", "rtc:rtc", "https://example.invalid/"):
        g.expect_blocked(p)
    g.expect_blocked("https://example.com/")
    res = pg.evaluate("""() => {
        const out = {};
        try { new Worker(URL.createObjectURL(new Blob(["self.postMessage(1)"]))); out.worker = 'CREATED'; } catch (e) { out.worker = 'BLOCKED'; }
        try { new SharedWorker(URL.createObjectURL(new Blob(["1"]))); out.shared = 'CREATED'; } catch (e) { out.shared = 'BLOCKED'; }
        try { new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]}); out.rtc = 'CREATED'; } catch (e) { out.rtc = 'BLOCKED'; }
        try { out.beacon = navigator.sendBeacon('https://example.com/a0-beacon', 'x') ? 'QUEUED' : 'REFUSED'; } catch (e) { out.beacon = 'THROW'; }
        try { const f = document.createElement('iframe'); f.src = 'https://example.com/a0-frame'; document.body.appendChild(f); out.iframe = 'ADDED'; } catch (e) { out.iframe = 'THROW'; }
        try { const es = new EventSource('https://example.com/a0-sse'); es.onerror = () => es.close(); out.sse = 'OPENED'; } catch (e) { out.sse = 'THROW'; }
        return out;
    }""")
    sc.eq((res["worker"], res["shared"], res["rtc"]), ("BLOCKED", "BLOCKED", "BLOCKED"), "Worker, SharedWorker, RTCPeerConnection không tạo được")
    pg.wait_for_timeout(500)
    kinds = sorted({w.split(":")[0] for w in g.ws_blocked if not w.startswith("wss:")})
    sc.check(kinds == ["rtc", "sharedworker", "worker"], "ba đường lách được ghi nhận trong báo cáo guard", seen=g.ws_blocked)
    urls = [b["url"] for b in g.blocked]
    for u in ("https://example.com/a0-beacon", "https://example.com/a0-frame", "https://example.com/a0-sse"):
        sc.check(u in urls, "request bị chặn và ghi nhận: %s" % u.rsplit("/", 1)[1], blocked=len(urls))
    sc.eq(g.ws_leaked, [], "không có WebSocket nào lọt xuống tầng mạng")
