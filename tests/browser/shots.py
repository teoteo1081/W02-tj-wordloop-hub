"""Ảnh chuẩn desktop 1280×800 + mobile 390×844 (PLAN §0.2 M0.6; TEST §6 VIS-W02/W03/W06/G01/G02).

    python -I -X utf8 tests/browser/shots.py --target branch --out <thư_mục>     # thu ảnh + manifest.json
    python -I -X utf8 tests/browser/shots.py --compare <thư_mục_A> <thư_mục_B>   # so từng ảnh (băm + pixel); exit 1 nếu khác

Cùng cơ chế với các kịch bản (dữ liệu tổng hợp, đồng hồ ảo, random gieo cố định, animation tắt, mạng chặn). Không có vùng
che (mask) nào: nếu một vùng dao động, sửa nguyên nhân hoặc khai báo mask kèm lý do công khai ở MASKS bên dưới.
"""
import argparse, hashlib, json, os, struct, sys, zlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bw, cloudwl, scn_cloud, scn_game                  # noqa: E402
from wl import answer_meaning, VI                        # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
BASELINE_DIR = os.path.abspath(os.path.join(REPO, "..", "wt-baseline-e324beb"))
MASKS = {}      # {tên_ảnh: [(selector, lý do công khai)]} — hiện KHÔNG có mask nào


class Env:
    def __init__(self, browser, site):
        self.browser, self.site = browser, site


def settle_fonts(page):
    page.evaluate("document.fonts && document.fonts.ready")


def snap(c, out, name, vp):
    settle_fonts(c.page)
    path = os.path.join(out, "%s__%s.png" % (name, vp))
    c.page.screenshot(path=path, animations="disabled", caret="hide", full_page=False)
    real = c.page.evaluate("[innerWidth, innerHeight]")
    with open(path, "rb") as f:
        data = f.read()
    return {"file": os.path.basename(path), "viewport": real, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}


def wordloop_shots(env, vp, out):
    shots = []
    cl, be, c = scn_cloud.boot_cloud(env, viewport=vp)
    pg = c.page
    scn_cloud.open_block_c(cl, c, "bl_syn_1", "study")
    shots.append(("VIS-W03", snap(c, out, "W03_study", vp)))
    pg.click('.dtab[data-tab="meaning"]'); cl.run(500)
    shots.append(("VIS-W03", snap(c, out, "W03_meaning", vp)))
    pg.click("#meaning-card [data-bm]"); cl.run(300)
    answer_meaning(pg, wrong_terms={"anchor"}, pump=lambda: cl.run(100)); cl.run(1500)
    pg.click("#meaning-card >> text=Về danh sách Block"); cl.run(1500)
    pg.wait_for_selector("#screen-blocks:not([hidden])")
    shots.append(("VIS-W02", snap(c, out, "W02_blocks", vp)))
    pg.click("#btn-fixwrong"); pg.wait_for_selector("#screen-wordset:not([hidden])"); cl.run(1500)
    shots.append(("VIS-W06", snap(c, out, "W06_fix", vp)))
    errs = (be.unsupported, be.violations, [e for e in c.ctx.errors if "404" not in e["text"]], c.ctx.guard.blocked)
    cl.close()
    return shots, errs


def game_shots(env, vp, out):
    shots = []
    cl, be, host, player = scn_game.setup(env)
    # cùng viewport cho cả hai client (setup dùng desktop mặc định) → đặt lại theo vp
    for c in (host, player):
        c.page.set_viewport_size(bw.VIEWPORTS[vp])
    scn_game.lobby_ready(cl, host, player)
    cl.run(500)
    shots.append(("VIS-G01", snap(host, out, "G01_lobby_host", vp)))
    shots.append(("VIS-G01", snap(player, out, "G01_lobby_player", vp)))
    host.page.click("#l-start")
    scn_game.wait_screen(cl, host, "s-play"); scn_game.wait_screen(cl, player, "s-play")
    cl.settle(lambda: all(scn_game.question(c) and scn_game.question(c)["vi"] for c in (host, player)), step=250, what="câu hỏi đầu")
    shots.append(("VIS-G02", snap(host, out, "G02_play_host", vp)))
    shots.append(("VIS-G02", snap(player, out, "G02_play_player", vp)))
    errs = (be.unsupported, be.violations, [e for c in (host, player) for e in c.ctx.errors if "404" not in e["text"]],
            [b for c in (host, player) for b in c.ctx.guard.blocked])
    cl.close()
    return shots, errs


def capture(target, out, flows=("wordloop", "game")):
    root = {"baseline": BASELINE_DIR, "branch": REPO}[target]
    os.makedirs(out, exist_ok=True)
    B = bw.Browser()
    site = bw.Site(root, target)
    env = Env(B, site)
    manifest = {"target": target, "source": bw.source_identity(root, bw.BASELINE_SHA if target == "baseline" else None),
                "chromium": B.browser.version, "images": []}
    problems = []
    try:
        for vp in ("desktop", "mobile"):
            for fn in [f for f in (wordloop_shots, game_shots) if f.__name__.split("_")[0] in flows]:
                shots, errs = fn(env, vp, out)
                for tid, m in shots:
                    m["id"] = tid
                    manifest["images"].append(m)
                if any(errs):
                    problems.append({"flow": fn.__name__, "viewport": vp, "errs": [str(e)[:200] for e in errs if e]})
        manifest["servedMismatch"] = bw.verify_served(root, site)
    finally:
        B.close(); site.close()
    manifest["images"].sort(key=lambda m: m["file"])
    manifest["problems"] = problems
    with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1, sort_keys=True); f.write("\n")
    return manifest


# ── so sánh pixel không cần thư viện ảnh: giải mã PNG bằng zlib ──
def _png_pixels(path):
    d = open(path, "rb").read()
    assert d[:8] == b"\x89PNG\r\n\x1a\n"
    pos, idat, w = 8, b"", None
    while pos < len(d):
        ln, typ = struct.unpack(">I4s", d[pos:pos + 8]); body = d[pos + 8:pos + 8 + ln]; pos += 12 + ln
        if typ == b"IHDR":
            w, h, bd, ct = struct.unpack(">IIBB", body[:10])
        elif typ == b"IDAT":
            idat += body
    bpp = {2: 3, 6: 4}[ct]
    raw = zlib.decompress(idat)
    stride = w * bpp
    rows, prev = [], bytearray(stride)
    i = 0
    for _ in range(h):
        f = raw[i]; line = bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]; c = prev[x - bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else (b if pb <= pc else c))) & 255
        rows.append(bytes(line)); prev = line
    return w, h, rows


def compare(a, b):
    ma = json.load(open(os.path.join(a, "manifest.json"), encoding="utf-8"))
    mb = json.load(open(os.path.join(b, "manifest.json"), encoding="utf-8"))
    bad, same = [], 0
    names = sorted({i["file"] for i in ma["images"]} | {i["file"] for i in mb["images"]})
    ia, ib = {i["file"]: i for i in ma["images"]}, {i["file"]: i for i in mb["images"]}
    for n in names:
        if n not in ia or n not in ib:
            bad.append({"file": n, "problem": "chỉ có ở một bên"}); continue
        if ia[n]["sha256"] == ib[n]["sha256"]:
            same += 1; continue
        wa, ha, ra = _png_pixels(os.path.join(a, n)); wb, hb, rb = _png_pixels(os.path.join(b, n))
        diff = sum(1 for y in range(min(ha, hb)) if ra[y] != rb[y]) if (wa, ha) == (wb, hb) else None
        bad.append({"file": n, "problem": "khác", "sizeA": [wa, ha], "sizeB": [wb, hb], "rowsDifferent": diff})
    return {"identical": same, "total": len(names), "different": bad}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["baseline", "branch"])
    ap.add_argument("--out")
    ap.add_argument("--flows", default="wordloop,game", help="wordloop,game (mặc định cả hai)")
    ap.add_argument("--compare", nargs=2)
    a = ap.parse_args()
    if a.compare:
        r = compare(*a.compare)
        print(json.dumps(r, ensure_ascii=False, indent=1))
        return 1 if r["different"] else 0
    m = capture(a.target, a.out, tuple(a.flows.split(',')))
    print("%d ảnh, vấn đề: %s" % (len(m["images"]), m["problems"] or "không"))
    for i in m["images"]:
        print("  %-34s %-10s %s" % (i["file"], i["viewport"], i["sha256"][:12]))
    return 1 if m["problems"] or m["servedMismatch"] else 0


if __name__ == "__main__":
    sys.exit(main())
