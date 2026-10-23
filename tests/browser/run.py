"""Runner cycle A0 trong trình duyệt (PLAN §0.2 / SPEC §1.2).

    python -I -X utf8 tests/browser/run.py                   # chạy kịch bản trên baseline VÀ nhánh, in tóm tắt
    python -I -X utf8 tests/browser/run.py --only LRN        # lọc theo tên hàm kịch bản
    python -I -X utf8 tests/browser/run.py --target branch   # chỉ một nguồn
    python -I -X utf8 tests/browser/run.py --write-report    # ghi tests/browser/report.json (quan sát, không phải golden)

Exit: 1 nếu có kịch bản FAIL, request mạng ngoài khai báo, nguồn sai/không sạch, hoặc mã phục vụ khác git HEAD.
      0 kể cả khi còn khoảng trống độ phủ — khi đó trạng thái in ra là PARTIAL, không phải SUCCESS.
"""
import argparse, json, os, platform, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bw, wl                                        # noqa: E402
import scn_guard, scn_learn, scn_cloud, scn_game    # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
BASELINE_DIR = os.path.abspath(os.path.join(REPO, "..", "wt-baseline-e324beb"))
MODULES = [scn_guard, scn_learn, scn_cloud, scn_game]
APP_PATHS = ["js", "css", "index.html", "game.html", "sw.js", "data", "learn", "supabase", "tools"]


class Env:
    def __init__(self, browser, site, label):
        self.browser, self.site, self.label = browser, site, label


def scenarios(only=None):
    out = []
    for m in MODULES:
        for name in dir(m):
            fn = getattr(m, name)
            if callable(fn) and hasattr(fn, "ids") and (not only or only.lower() in name.lower()):
                out.append(fn)
    return out


def identity(target, root):
    if target == "baseline":
        idn = bw.source_identity(root, bw.BASELINE_SHA)
        idn["ok"] = idn["matchesExpected"] and not idn["appCodeDirty"]
    else:
        idn = bw.source_identity(root)
        diff = bw.git(root, "diff", "--name-only", bw.BASELINE_SHA, "HEAD", "--", *APP_PATHS).decode().split()
        idn["appCodeChangedVsBaseline"] = diff
        idn["ok"] = not idn["appCodeDirty"] and not diff
    return idn


def run_target(B, target, root, fns):
    site = bw.Site(root, target)
    env = Env(B, site, target)
    t0 = time.time()
    results = []
    for fn in fns:
        print("  ... %s %s" % (target, fn.__name__), flush=True)
        results.append(wl.run_scenario(fn, env))
    guards = [c.guard for c in B.contexts if c.guard.site is site]
    served_bad = bw.verify_served(root, site)
    print("  (%s: %.1fs)" % (target, time.time() - t0), flush=True)      # thời gian thật chỉ in, không ghi vào báo cáo tái lập
    info = {"scenarios": results,
            "servedMismatch": served_bad,
            "servedCount": len(site.served),
            "guard": {"contexts": len(guards),
                      "localPathsServed": sorted({p for g in guards for p in g.local_requests}),   # số lượt thô không ổn định (thời điểm tải) nên chỉ ghi tập đường dẫn
                      "mocked": sorted({p for g in guards for p in g.mocked}),
                      "stubbedExternal": sorted({u for g in guards for u in g.stubbed}),
                      "blockedExpected": [b for g in guards for b in g.blocked if g.is_expected(b["url"])],
                      "blockedUnexpected": [b for g in guards for b in g.blocked if not g.is_expected(b["url"])],
                      "websocketBlocked": sorted({u for g in guards for u in g.ws_blocked}),
                      "websocketLeaked": sorted({u for g in guards for u in g.ws_leaked}),
                      "websocketBlockedUnexpected": sorted({u for g in guards for u in g.ws_blocked if not g.is_expected(u)})},
            "knownResource404": [p for p, i in site.served.items() if i["status"] == 404]}
    site.close()
    return info


def compare(base, branch):
    """So kết quả từng kịch bản giữa baseline và nhánh: trạng thái, từng assertion, bằng chứng."""
    diffs = []
    bmap = {r["fn"]: r for r in base["scenarios"]}
    for r in branch["scenarios"]:
        o = bmap.get(r["fn"])
        if not o:
            diffs.append({"fn": r["fn"], "problem": "chỉ có ở nhánh"}); continue
        if o["status"] != r["status"]:
            diffs.append({"fn": r["fn"], "problem": "trạng thái khác", "baseline": o["status"], "branch": r["status"]})
        if [(c["ok"], c["msg"]) for c in o["checks"]] != [(c["ok"], c["msg"]) for c in r["checks"]]:
            diffs.append({"fn": r["fn"], "problem": "danh sách assertion/kết quả khác"})
        if json.dumps(o["evidence"], sort_keys=True) != json.dumps(r["evidence"], sort_keys=True):
            diffs.append({"fn": r["fn"], "problem": "bằng chứng quan sát khác"})
    return diffs


CANDIDATE_DIR = os.path.join(HERE, "shots-candidate")
SHOT_IDS = ["VIS-W02", "VIS-W03", "VIS-W06", "VIS-G01", "VIS-G02", "SHOT-STABLE"]


def shots_stage(targets, write_candidate=False):
    """M0.6: mỗi nguồn chụp HAI lượt độc lập; hai lượt phải giống hệt từng byte (không mask), baseline và nhánh cũng vậy;
    nếu đã có ảnh candidate trong repo thì so tiếp (đổi chuẩn cần quyết định riêng, TEST §1.3)."""
    import shutil, tempfile
    import shots
    tmp = tempfile.mkdtemp(prefix="a0shots_")
    out, dirs = {"targets": {}, "problems": []}, {}
    try:
        for t in targets:
            for k in (1, 2):
                d = os.path.join(tmp, "%s%d" % (t, k))
                m = shots.capture(t, d)
                dirs[(t, k)] = d
                if m["problems"] or m["servedMismatch"]:
                    out["problems"].append({"target": t, "run": k, "problems": m["problems"], "servedMismatch": m["servedMismatch"]})
                if k == 1:
                    out["targets"][t] = {"chromium": m["chromium"], "images": [{x: i[x] for x in ("file", "id", "viewport", "sha256", "bytes")} for i in m["images"]]}
            same = shots.compare(dirs[(t, 1)], dirs[(t, 2)])
            out["targets"][t]["repeatRuns"] = same
        if len(targets) == 2:
            out["baselineVsBranch"] = shots.compare(dirs[("baseline", 1)], dirs[("branch", 1)])
        ref = dirs.get(("baseline", 1)) or dirs.get(("branch", 1))
        if write_candidate:
            if os.path.isdir(CANDIDATE_DIR):
                shutil.rmtree(CANDIDATE_DIR)
            shutil.copytree(ref, CANDIDATE_DIR)
        if os.path.isfile(os.path.join(CANDIDATE_DIR, "manifest.json")):
            out["vsCommittedCandidate"] = shots.compare(CANDIDATE_DIR, ref)
        else:
            out["vsCommittedCandidate"] = "chưa có ảnh candidate đã commit (chạy --write-candidate)"
        shutil.rmtree(tmp, ignore_errors=True)
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        raise
    ok = not out["problems"] and all(not v["repeatRuns"]["different"] for v in out["targets"].values())         and not out.get("baselineVsBranch", {}).get("different")         and (isinstance(out["vsCommittedCandidate"], str) or not out["vsCommittedCandidate"]["different"])
    out["stable"] = bool(ok)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["baseline", "branch", "both"], default="both")
    ap.add_argument("--only")
    ap.add_argument("--write-report", action="store_true")
    ap.add_argument("--selftest", action="store_true", help="phản chứng: cài lỗi có chủ đích vào BẢN CHÉP mã app, kịch bản tương ứng phải FAIL")
    ap.add_argument("--shots", action="store_true", help="thêm bước M0.6: ảnh 1280×800 và 390×844, hai lượt độc lập (chậm ~8 phút)")
    ap.add_argument("--write-candidate", action="store_true", help="ghi ảnh candidate vào tests/browser/shots-candidate (chỉ khi được review)")
    a = ap.parse_args()
    fns = scenarios(a.only)
    targets = ["baseline", "branch"] if a.target == "both" else [a.target]
    roots = {"baseline": BASELINE_DIR, "branch": REPO}
    report = {"tool": {"python": platform.python_version(), "playwright": _pw_version(), "chromium": None,
                       "chromePath": "ms-playwright/chromium-1248/chrome-win64/chrome.exe"},
              "ranAtNote": "đồng hồ app cố định %d (UTC); thời gian thật không ghi để báo cáo tái lập" % bw.NOW_MS,
              "sources": {}, "targets": {}}
    B = bw.Browser()
    report["tool"]["chromium"] = B.browser.version
    failed = False
    try:
        for t in targets:
            idn = identity(t, roots[t])
            report["sources"][t] = idn
            if not idn["ok"]:
                failed = True
            report["targets"][t] = run_target(B, t, roots[t], fns)
        if a.selftest:
            import selftest
            print("\n== PHẢN CHỨNG (lỗi cài vào bản chép, repo không bị sửa) ...", flush=True)
            report["selfTest"] = selftest.run_selftest(B, REPO, print)
            if not report["selfTest"]["ok"]:
                failed = True
    finally:
        B.close()
    if len(targets) == 2:
        report["comparison"] = {"differences": compare(report["targets"]["baseline"], report["targets"]["branch"])}

    # ── tóm tắt ──
    for t in targets:
        tr = report["targets"][t]
        print("\n== %s  (%s)" % (t.upper(), report["sources"][t]["commit"][:7]))
        for r in tr["scenarios"]:
            n_ok = sum(c["ok"] for c in r["checks"])
            print("  %-4s %-26s %-46s %d/%d%s" % (r["status"], r["fn"], ",".join(r["ids"]), n_ok, len(r["checks"]),
                                                 ("  ERR: " + r["error"]) if r["error"] else ""))
            for c in r["checks"]:
                if not c["ok"]:
                    print("        x", c["msg"], json.dumps({k: v for k, v in c.items() if k not in ("ok", "msg")}, ensure_ascii=False)[:300])
        g = tr["guard"]
        print("  guard: %d context, %d đường dẫn cục bộ khác nhau, chặn ngoài-khai-báo=%d, chặn-có-chủ-ý=%d, ws=%d" % (
            g["contexts"], len(g["localPathsServed"]), len(g["blockedUnexpected"]), len(g["blockedExpected"]), len(g["websocketBlocked"])))
        if tr["servedMismatch"]:
            print("  !! mã phục vụ khác git HEAD:", tr["servedMismatch"])
        if any(r["status"] != "PASS" for r in tr["scenarios"]) or g["blockedUnexpected"] or tr["servedMismatch"]                 or g["websocketLeaked"] or g["websocketBlockedUnexpected"]:
            failed = True
    if "comparison" in report:
        d = report["comparison"]["differences"]
        print("\nso sánh baseline/nhánh: %s" % ("giống hệt" if not d else "%d khác biệt: %s" % (len(d), d)))
        failed = failed or bool(d)
    if a.shots:
        print("\n== ẢNH (M0.6): hai lượt độc lập mỗi nguồn ...", flush=True)
        report["shots"] = shots_stage(targets, a.write_candidate)
        sh = report["shots"]
        print("  ổn định (hai lượt giống hệt, baseline=nhánh, khớp candidate): %s" % sh["stable"])
        if not sh["stable"]:
            failed = True
            print("  !!", json.dumps({k: v for k, v in sh.items() if k != "targets"}, ensure_ascii=False)[:600])
    gaps = coverage_gaps(report, fns)
    report["coverageGaps"] = gaps
    import coverage
    report["declaredOutOfScope"] = coverage.DECLARED_OUT
    print("\nkhoảng trống độ phủ còn lại (chưa chạy): %d" % len(gaps))
    # Không bao giờ in SUCCESS: hết khoảng trống chỉ nghĩa là PHẠM VI CAM KẾT của cycle này đã có bằng chứng. Còn thiếu: verdict QA độc
    # lập, PO duyệt ảnh/nhật ký candidate, và các mục DECLARED_OUT (CI/G2, supabase-js thật) — nên A0 tổng thể vẫn PARTIAL.
    status = "FAIL" if failed else ("PARTIAL" if gaps else "CYCLE_SCOPE_EVIDENCED__A0_STILL_PARTIAL")
    report["status"] = status
    print("TRẠNG THÁI:", status)
    if a.write_report:
        with open(os.path.join(HERE, "report.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(report, f, ensure_ascii=False, indent=1, sort_keys=True); f.write("\n")
        print("đã ghi tests/browser/report.json")
    return 1 if failed else 0


def _pw_version():
    import importlib.metadata
    return importlib.metadata.version("playwright")


def coverage_gaps(report, fns):
    import coverage
    ran = {i for r in report["targets"][next(iter(report["targets"]))]["scenarios"] if r["status"] == "PASS" for i in r["ids"]}
    if report.get("shots", {}).get("stable"):
        ran |= set(SHOT_IDS)
    return [{"id": i, "reason": why} for i, why in coverage.IN_SCOPE.items() if i not in ran]


if __name__ == "__main__":
    sys.exit(main())
