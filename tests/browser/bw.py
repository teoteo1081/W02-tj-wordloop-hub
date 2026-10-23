"""bw — khung trình duyệt cho cycle A0 (PLAN §0.2, M0.4).

Chỉ dùng Playwright Python + Chromium đã có sẵn trên máy (không cài thêm gì).
Nguyên tắc:
  * Chặn mạng TRƯỚC khi nạp app, ở cấp BrowserContext: chỉ origin cục bộ và vài mock được KHAI BÁO.
    Mọi thứ khác bị abort và ghi vào `Guard.blocked`; runner thất bại nếu có request bị chặn mà
    kịch bản không chủ động gây ra (phản chứng thì khai `expected_blocked`).
  * Dữ liệu tổng hợp (fixtures/), đồng hồ và Math.random cố định, animation tắt.
  * Mock đặt ở RANH GIỚI dịch vụ; không thay hàm của app bằng kết quả mong muốn.
"""
import hashlib, http.server, json, os, re, socketserver, subprocess, sys, threading, functools, time
from playwright.sync_api import sync_playwright, Page

# wait_for_function mặc định poll bằng requestAnimationFrame: trong Chromium headless nhiều context rAF có thể bị
# bỏ đói và làm chờ treo ngẫu nhiên. Poll theo khoảng thời gian cố định để kết quả không phụ thuộc rAF.
_orig_wff = Page.wait_for_function


def _wff(self, expression, *, arg=None, polling=100, timeout=None):
    return _orig_wff(self, expression, arg=arg, polling=polling, timeout=timeout)


Page.wait_for_function = _wff

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.join(HERE, "fixtures")
CHROME = os.environ.get("A0_CHROME") or os.path.join(os.environ.get("LOCALAPPDATA", ""), "ms-playwright",
                                                  "chromium-1248", "chrome-win64", "chrome.exe")
NOW_MS = 1792700000000        # = NOW trong tests/a0/harness.js
BASELINE_SHA = "e324beb54b29ddfa055956c756a4ceba2676dfa1"
VIEWPORTS = {"desktop": {"width": 1280, "height": 800}, "mobile": {"width": 390, "height": 844}}


def sha_lf(data):
    """Băm nội dung đã chuẩn hoá CRLF->LF (cùng cách với tests/capture/baseline.js)."""
    return hashlib.sha256(data.replace(b"\r\n", b"\n")).hexdigest()


def read_fixture(name):
    with open(os.path.join(FIX, name), "rb") as f:
        return f.read()


class Site:
    """Server tĩnh cho một thư mục mã nguồn; ghi lại tệp đã phục vụ (+băm) để kiểm đúng nguồn."""

    def __init__(self, root, label):
        self.root, self.label, self.served = os.path.abspath(root), label, {}
        site = self

        class H(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
            def end_headers(self):
                self.send_header("Cache-Control", "no-store")
                super().end_headers()
            def send_head(self):
                f = super().send_head()
                return f
            def do_GET(self):
                p = self.path.split("?")[0]
                fs = self.translate_path(p)
                if os.path.isfile(fs):
                    with open(fs, "rb") as fh:
                        site.served[p] = {"sha256_lf": sha_lf(fh.read()), "status": 200}
                else:
                    site.served[p] = {"sha256_lf": None, "status": 404}
                return super().do_GET()

        class _Srv(socketserver.ThreadingTCPServer):
            request_queue_size = 256      # mặc định 5: trình duyệt mở ~40 kết nối song song → đôi khi ERR_CONNECTION_REFUSED
        self._srv = _Srv(("127.0.0.1", 0), functools.partial(H, directory=self.root))
        self._srv.daemon_threads = True
        self.port = self._srv.server_address[1]
        threading.Thread(target=self._srv.serve_forever, daemon=True).start()

    @property
    def origin(self):
        return "http://127.0.0.1:%d" % self.port

    def close(self):
        self._srv.shutdown(); self._srv.server_close()


def git(root, *args):
    return subprocess.run(["git", "-C", root] + list(args), capture_output=True, check=True).stdout


def committed_text(root, rel):
    """Nội dung tệp theo blob git HEAD của `root`; chỉ khi `root` KHÔNG phải repo git (bản chép của selftest) mới đọc từ đĩa."""
    try:
        return git(root, "show", "HEAD:" + rel).decode("utf-8")
    except (subprocess.CalledProcessError, FileNotFoundError):
        if os.path.isdir(os.path.join(root, ".git")) or os.path.isfile(os.path.join(root, ".git")):
            raise
        with open(os.path.join(root, rel), encoding="utf-8") as f:
            return f.read()


def source_identity(root, expected_commit=None):
    """SHA/cây/trạng thái của thư mục mã nguồn. Dùng để chứng minh không chạy nhầm checkout."""
    head = git(root, "rev-parse", "HEAD").decode().strip()
    tree = git(root, "rev-parse", "HEAD^{tree}").decode().strip()
    dirty = git(root, "status", "--porcelain", "--", "js", "css", "index.html", "game.html", "sw.js", "data",
                "learn", "supabase", "tools").decode().strip()
    out = {"commit": head, "tree": tree, "appCodeDirty": bool(dirty)}
    if expected_commit:
        out["expectedCommit"] = expected_commit
        out["matchesExpected"] = head.startswith(expected_commit) or expected_commit.startswith(head)
    return out


def verify_served(root, site, paths=None):
    """Mọi .js/.css/.html đã phục vụ phải trùng blob trong git HEAD của `root` (LF-băm).
    Trả về danh sách lệch; rỗng = trình duyệt đã nạp đúng mã đã commit (không phải cache/bản sửa tay)."""
    bad = []
    for p, info in sorted(site.served.items()):
        if not re.search(r"\.(js|css|html)$", p) or info["status"] != 200:
            continue
        if paths and p not in paths:
            continue
        rel = p.lstrip("/")
        try:
            blob = git(root, "show", "HEAD:" + rel)
        except subprocess.CalledProcessError:
            bad.append({"path": p, "problem": "không có trong HEAD (tệp chưa commit?)"}); continue
        if sha_lf(blob) != info["sha256_lf"]:
            bad.append({"path": p, "problem": "nội dung phục vụ khác blob HEAD"})
    return bad


class Guard:
    """Chặn mạng ở cấp context. `mocks` : {đường dẫn tuyệt đối trên origin cục bộ -> (status, content_type, body)}
    và `stubs` : {url đầy đủ ngoài -> (status, content_type, body)} đều phải KHAI BÁO."""

    def __init__(self, site, mocks=None, stubs=None, name=""):
        self.site, self.name = site, name
        self.mocks, self.stubs = mocks or {}, stubs or {}
        self.blocked, self.stubbed, self.mocked, self.ws_blocked, self.local_requests = [], [], [], [], []
        self.handled = []           # request ngoài do handler khai báo xử lý
        self.handlers = []          # [(url_prefix, fn(req, client_label) -> (status, content_type, body, headers))]
        self.ws_leaked = []         # WebSocket tới được tầng mạng dù đã ghi đè trong trang (phải luôn rỗng)
        self.expected = []          # tiền tố URL mà kịch bản phản chứng CHỦ Ý gọi để chứng minh bị chặn

    def expect_blocked(self, url_prefix):
        self.expected.append(url_prefix)

    def is_expected(self, url):
        return any(url.startswith(p) for p in self.expected)

    def install(self, ctx):
        ctx.route("**/*", self._route)
        ctx.expose_function("__a0_ws_blocked", lambda url: self.ws_blocked.append(str(url)))
        ctx.route_web_socket("**", self._ws)   # lưới thứ hai: không bao giờ nối server thật; chỉ ghi nhận

    def _route(self, route):
        req = route.request
        url = req.url
        if url.startswith(self.site.origin + "/"):
            path = url[len(self.site.origin):].split("?")[0]
            self.local_requests.append(path)
            if path in self.mocks:
                st, ct, body = self.mocks[path]
                self.mocked.append(path)
                return route.fulfill(status=st, content_type=ct, body=body)
            return route.fallback()
        if url.startswith("data:") or url.startswith("blob:") or url.startswith("about:"):
            return route.fallback()
        base = url.split("?")[0]
        for key, val in self.stubs.items():
            if url == key or base == key:
                self.stubbed.append(url)
                st, ct, body = val[0], val[1], val[2]
                return route.fulfill(status=st, content_type=ct, body=body, headers=val[3] if len(val) > 3 else None)
        for prefix, fn in self.handlers:                    # endpoint ngoài có HANDLER khai báo (Edge Function, Worker...)
            if url.startswith(prefix):
                self.handled.append(url)
                if req.method == "OPTIONS":
                    return route.fulfill(status=204, headers={"access-control-allow-origin": "*", "access-control-allow-headers": "*",
                                                              "access-control-allow-methods": "*"})
                st, ct, body, headers = fn(req, self.name)
                return route.fulfill(status=st, content_type=ct, body=body, headers=headers)
        self.blocked.append({"method": req.method, "url": url, "resource": req.resource_type})
        return route.abort("blockedbyclient")

    def _ws(self, ws):
        # KHÔNG gọi ws.close() ở đây (deadlock Playwright sync); không connect_to_server => không có kết nối thật.
        self.ws_leaked.append(ws.url)


INIT_BASE = r"""
(() => {
  // --- Math.random gieo cố định, KHÁC nhau theo context (TEST §7: G.tab sinh từ Math.random) ---
  // Hạt giống đổi theo SỐ LẦN NẠP TRANG trong tab (sessionStorage, đặt trước khi bọc nhật ký): tải lại ra mã tab mới như
  // trình duyệt thật (G.tab sinh từ Math.random) nhưng vẫn tiền định theo (hạt giống context, số lần nạp).
  let loads = 0;
  try { loads = (+sessionStorage.getItem('__a0_loads') || 0) + 1; sessionStorage.setItem('__a0_loads', String(loads)); } catch (e) {}
  let s = ((((window.__A0_SEED__ >>> 0) || 29) + loads * 104729) % 2147483647) || 29;
  Math.random = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  // --- WebSocket: không bao giờ tạo kết nối thật; báo về harness rồi tự đóng với lỗi ---
  const mkWS = function (url) {
    try { window.__a0_ws_blocked(String(url)); } catch (e) {}
    const o = new EventTarget(); o.url = String(url); o.readyState = 3; o.close = () => {};
    o.send = () => { throw new DOMException('A0: WebSocket blocked', 'InvalidStateError'); };
    setTimeout(() => { for (const t of ['error', 'close']) { const ev = new Event(t); try { o['on' + t] && o['on' + t](ev); } catch (e) {} o.dispatchEvent(ev); } }, 0);
    return o;
  };
  mkWS.CONNECTING = 0; mkWS.OPEN = 1; mkWS.CLOSING = 2; mkWS.CLOSED = 3;
  window.WebSocket = mkWS;
  // --- nhật ký localStorage/sessionStorage: chỉ quan sát, không đổi hành vi ---
  window.__lsLog = [];
  const shape = v => (v === null || v === undefined) ? 'null' : (typeof v === 'string'
      ? (/^\s*[\[{]/.test(v) ? (v.trim()[0] === '[' ? 'json-array' : 'json-object') : (v === '' ? 'empty-string' : 'string')) : typeof v);
  for (const kind of ['localStorage', 'sessionStorage']) {
    let st; try { st = window[kind]; } catch (e) { continue; }
    const P = Object.getPrototypeOf(st);
    for (const op of ['getItem', 'setItem', 'removeItem']) {
      const orig = P[op];
      if (P['__a0_' + op]) continue;
      Object.defineProperty(P, '__a0_' + op, { value: true, enumerable: false });
      P[op] = function (k, v) {
        if (this === st) window.__lsLog.push({ store: kind, op, key: String(k), shape: op === 'setItem' ? shape(v) : undefined });
        return orig.apply(this, arguments);
      };
    }
  }
  // --- stub thiết bị: ghi lại thứ tự gọi, không có tiếng/mic thật ---
  window.__stubLog = [];
  const logS = (n, a) => window.__stubLog.push({ n, a });
  const synth = { speaking: false, pending: false, paused: false, onvoiceschanged: null,
    speak(u) { logS('speak', { text: u && u.text, lang: u && u.lang }); setTimeout(() => { try { u.onstart && u.onstart({}); u.onend && u.onend({}); } catch (e) {} }, 0); },
    cancel() { logS('cancel'); }, pause() { logS('pause'); }, resume() { logS('resume'); },
    getVoices() { return []; }, addEventListener() {}, removeEventListener() {} };
  try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true }); } catch (e) {}
  if (!window.SpeechSynthesisUtterance) window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  try { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; } catch (e) {}
  window.SpeechRecognition = window.webkitSpeechRecognition = function () {
    this.start = () => logS('rec.start'); this.stop = () => logS('rec.stop'); this.abort = () => logS('rec.abort');
  };
  // --- Worker / SharedWorker / RTCPeerConnection: init script không chạy trong worker và RTC thu candidate qua STUN mà route() không
  //     thấy (QA độc lập), nên KHÔNG cho tạo; ghi nhận để báo cáo. App hiện không dùng Worker; RTC chỉ dựng sau getUserMedia/getDisplayMedia (đã stub từ chối).
  const blockedAPI = (kind) => function (...a) {
    try { window.__a0_ws_blocked(kind + ':' + String(a[0] && a[0].iceServers ? 'rtc' : a[0])); } catch (e) {}
    throw new DOMException('A0: ' + kind + ' blocked', 'NotSupportedError');
  };
  for (const k of ['Worker', 'SharedWorker']) { try { window[k] = blockedAPI(k.toLowerCase()); } catch (e) {} }
  for (const k of ['RTCPeerConnection', 'webkitRTCPeerConnection']) { try { window[k] = blockedAPI('rtc'); } catch (e) {} }
  try { navigator.mediaDevices.getUserMedia =() => { logS('getUserMedia'); return Promise.reject(new DOMException('stub', 'NotAllowedError')); };
        navigator.mediaDevices.getDisplayMedia = () => { logS('getDisplayMedia'); return Promise.reject(new DOMException('stub', 'NotAllowedError')); }; } catch (e) {}
  // --- tắt animation/transition để ảnh và đo không phụ thuộc thời gian ---
  const css = document.createElement('style');
  css.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';
  const add = () => (document.head || document.documentElement).appendChild(css);
  if (document.head) add(); else document.addEventListener('readystatechange', add, { once: true });
})();
"""


class Browser:
    def __init__(self):
        self._pw = sync_playwright().start()
        self.contexts = []
        self.browser = self._pw.chromium.launch(executable_path=CHROME, headless=True,
                                                args=["--disable-background-networking", "--disable-component-update",
                                                      "--no-first-run", "--disable-sync",
                                                      # render tiền định cho ảnh chuẩn: không GPU, không raster/compositor đa luồng
                                                      "--disable-gpu", "--disable-gpu-compositing", "--disable-gpu-rasterization",
                                                      "--disable-partial-raster", "--disable-lcd-text",
                                                      "--font-render-hinting=none", "--force-color-profile=srgb",
                                                      # WebRTC không được thu candidate ra ngoài kể cả khi có đường lách khỏi stub
                                                      "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"])

    def close(self):
        self.browser.close(); self._pw.stop()

    def context(self, site, viewport="desktop", seed=29, mocks=None, stubs=None, name="", init_extra="",
                now_ms=NOW_MS, scale=1):
        """Context mới = máy khác (storage riêng). Chặn mạng + đồng hồ + random được cài TRƯỚC khi nạp trang."""
        vp = VIEWPORTS[viewport] if isinstance(viewport, str) else viewport
        ctx = self.browser.new_context(viewport=vp, device_scale_factor=scale, service_workers="block",
                                       reduced_motion="reduce", locale="vi-VN", timezone_id="UTC",
                                       color_scheme="light", accept_downloads=False)
        ctx.set_default_timeout(8000)
        ctx.set_default_navigation_timeout(15000)
        g = Guard(site, mocks, stubs, name)
        g.install(ctx)
        ctx.add_init_script("window.__A0_SEED__ = %d;" % seed)
        ctx.add_init_script(INIT_BASE)
        if init_extra:
            ctx.add_init_script(init_extra)
        if now_ms is not None:      # None = đồng hồ ảo do Cluster điều khiển (install + pause_at + run_for)
            ctx.clock.set_fixed_time(now_ms / 1000.0)   # API Python nhận GIÂY (nhận MILI-giây làm Date.now() lệch x1000)
        ctx.guard = g
        ctx.errors = []
        self.contexts.append(ctx)
        return ctx

    def page(self, ctx):
        pg = ctx.new_page()
        pg.on("console", lambda m: ctx.errors.append({"kind": "console." + m.type, "text": m.text[:300], "url": pg.url})
              if m.type in ("error",) else None)
        pg.on("pageerror", lambda e: ctx.errors.append({"kind": "pageerror", "text": str(e)[:300], "url": pg.url}))
        return pg


def ls_log(page, clear=False):
    log = page.evaluate("window.__lsLog || []")
    if clear:
        page.evaluate("window.__lsLog = []")
    return log


def ls_keys(page, store="localStorage"):
    return page.evaluate("Object.keys(%s).sort()" % store)


def shape_summary(log):
    """Nhật ký storage rút gọn thành {(store,op,key,shape)} có thứ tự lần đầu — đủ so baseline/nhánh."""
    seen, out = set(), []
    for e in log:
        k = (e["store"], e["op"], re.sub(r"_[0-9a-z]{6,}$", "_<id>", e["key"]), e.get("shape"))
        if k not in seen:
            seen.add(k); out.append(list(k))
    return out
