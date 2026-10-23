"""Phản chứng của chính bộ kiểm trình duyệt (SPEC §1.2 'Tính tái lập': không báo xanh khi bằng chứng không đủ).

Không bao giờ sửa repo hay baseline: mã app được CHÉP vào thư mục tạm rồi cài lỗi có chủ đích vào BẢN CHÉP. Mỗi lỗi phải
làm ít nhất một kịch bản FAIL (nếu kịch bản vẫn PASS = lỗi 'sống sót' = bộ kiểm không nhạy ở chỗ đó, và selftest thất bại).
Mỗi lỗi cũng có đối chứng xanh: cùng kịch bản trên bản chép CHƯA sửa phải PASS (loại trừ lỗi do bản chép/khung).
Thêm phản chứng cho kiểm 'đúng nguồn': tệp phục vụ khác blob trong git phải bị phát hiện.
"""
import os, shutil, subprocess, tempfile
import bw, wl, scn_learn, scn_cloud, scn_game

COPY = ["js", "css", "index.html", "game.html", "game-version.json", "icon.svg", "manifest.webmanifest"]

MUTATIONS = [
    # (id, tệp, chuỗi cũ, chuỗi mới, kịch bản phải FAIL, mô tả)
    ("M-SRS-GRACE", "js/detail.js", "var SRS_GRACE_MS = 60 * 60 * 1000;", "var SRS_GRACE_MS = 0;",
     scn_learn.srs_timeline, "bỏ khoảng nới 1 giờ của ôn sớm (FLW-05)"),
    ("M-SRS-24H", "js/srs.js", 'wait: 24 * HOUR, group: 1, short: "24 giờ"', 'wait: 12 * HOUR, group: 1, short: "24 giờ"',
     scn_learn.srs_timeline, "chu kỳ lần 2 còn 12 giờ thay vì 24 giờ"),
    ("M-WRONG-OPEN", "js/db.js", "r.wrong_open = !x.ok;", "r.wrong_open = false;",
     scn_learn.bookmark_and_fix, "câu sai không bao giờ vào Fix lỗi sai (Local)"),
    ("M-ONCONFLICT", "js/db.js", 'DB.sb.from("word_progress").upsert(row, { onConflict: "user_id,word_id" })',
     'DB.sb.from("word_progress").upsert(row, { onConflict: "user_id" })', scn_cloud.call_w02, "đổi onConflict của lưu tiến trình từ (Cloud)"),
    ("M-RELAY", "js/game.js", "if (d.relay && (G.isHost || G.st)) return;", "", scn_game.mp03_host_reload,
     "bỏ chặn relay trước khối nhường host: host tải lại giữa ván bị hạ vai (MP-03)"),
]


def _copy_app(src, dst):
    for name in COPY:
        s = os.path.join(src, name)
        d = os.path.join(dst, name)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        elif os.path.exists(s):
            shutil.copy2(s, d)


def _mutate(root, rel, old, new):
    p = os.path.join(root, rel)
    with open(p, "r", encoding="utf-8", newline="") as f:
        text = f.read()
    if text.count(old) < 1:
        raise AssertionError("mỏ neo lỗi không còn trong %s: %r" % (rel, old[:60]))
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(text.replace(old, new, 1))


def run_selftest(browser, repo_root, log=print):
    out = {"mutations": [], "identityCounterproof": None}
    tmp = tempfile.mkdtemp(prefix="a0mut_")
    try:
        # đối chứng xanh: bản chép chưa sửa
        control = os.path.join(tmp, "control"); os.makedirs(control)
        _copy_app(repo_root, control)
        cache = {}
        for mid, rel, old, new, fn, desc in MUTATIONS:
            if fn.__name__ not in cache:
                site = bw.Site(control, "control")
                cache[fn.__name__] = wl.run_scenario(fn, scn_env(browser, site))["status"]
                site.close()
            root = os.path.join(tmp, mid); os.makedirs(root)
            _copy_app(repo_root, root)
            _mutate(root, rel, old, new)
            site = bw.Site(root, mid)
            r = wl.run_scenario(fn, scn_env(browser, site))
            site.close()
            failing = [c["msg"] for c in r["checks"] if not c["ok"]] + ([r["error"]] if r["error"] else [])
            row = {"id": mid, "what": desc, "scenario": fn.__name__, "controlStatus": cache[fn.__name__], "mutantStatus": r["status"],
                   "caught": r["status"] == "FAIL" and cache[fn.__name__] == "PASS", "firstFailures": failing[:2]}
            out["mutations"].append(row)
            log("  %-14s control=%s mutant=%s %s" % (mid, row["controlStatus"], row["mutantStatus"], "BẮT ĐƯỢC" if row["caught"] else "!! SỐNG SÓT"))
        out["identityCounterproof"] = identity_counterproof(tmp)
        log("  identity: %s" % out["identityCounterproof"])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    out["ok"] = all(m["caught"] for m in out["mutations"]) and out["identityCounterproof"]["detected"]
    return out


def identity_counterproof(tmp):
    """Mã app trong working tree khác commit → source_identity báo appCodeDirty và verify_served báo lệch (không chạy nhầm bản sửa tay)."""
    repo = os.path.join(tmp, "gitrepo"); os.makedirs(os.path.join(repo, "js"))
    open(os.path.join(repo, "js", "a.js"), "w", newline="\n").write("var a = 1;\n")
    open(os.path.join(repo, "index.html"), "w", newline="\n").write("<html></html>\n")
    g = lambda *a: subprocess.run(["git", "-C", repo, *a], capture_output=True, check=True)
    g("init", "-q"); g("config", "user.email", "a0@example.invalid"); g("config", "user.name", "a0")
    g("add", "-A"); g("commit", "-q", "-m", "x")
    clean = bw.source_identity(repo)
    with open(os.path.join(repo, "js", "a.js"), "w", newline="\n") as f:
        f.write("var a = 2;\n")                      # sửa tay, chưa commit
    dirty = bw.source_identity(repo)
    class S:                                        # phục vụ giả đúng tệp đã sửa
        served = {"/js/a.js": {"sha256_lf": bw.sha_lf(b"var a = 2;\n"), "status": 200}}
    mism = bw.verify_served(repo, S())
    return {"cleanTreeDirtyFlag": clean["appCodeDirty"], "editedTreeDirtyFlag": dirty["appCodeDirty"],
            "servedMismatchDetected": bool(mism), "detected": (not clean["appCodeDirty"]) and dirty["appCodeDirty"] and bool(mism)}


class _Env:
    def __init__(self, browser, site):
        self.browser, self.site, self.label = browser, site, site.label


def scn_env(browser, site):
    return _Env(browser, site)
