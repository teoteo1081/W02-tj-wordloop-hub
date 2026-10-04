#!/usr/bin/env python3
"""Cổng 0 + 1 — kiểm tra TĨNH (không cần mạng, không cần trình duyệt). Xem docs/TEAM.md.

Chạy:  python3 tools/gate_static.py [--base origin/main]
Thoát mã 1 nếu có ❌. ⚠️ chỉ cảnh báo. ⏭️ = không kiểm được (KHÔNG tính là đạt).
"""
import argparse, base64, glob, json, os, re, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="origin/main")
args = ap.parse_args()
ROOT = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
os.chdir(ROOT)
fails = 0


def sh(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout.strip(), r.stderr.strip()


def out(kind, msg):
    global fails
    icon = {"ok": "✅", "fail": "❌", "warn": "⚠️ ", "skip": "⏭️ "}[kind]
    if kind == "fail":
        fails += 1
    print(f"{icon} {msg}")


def tracked():
    return [f for f in sh("git", "ls-files")[1].split("\n") if f and os.path.exists(f)]


def base_ok():
    return sh("git", "rev-parse", "--verify", "-q", args.base)[0] == 0


print("── Cổng 0: trước khi làm ──")
if base_ok():
    n = int(sh("git", "rev-list", "--count", f"HEAD..{args.base}")[1] or 0)
    out("ok" if n == 0 else "warn", f"nhánh {'đã theo kịp' if n == 0 else f'CHẬM {n} commit so với'} {args.base}" + ("" if n == 0 else " — gộp main vào trước khi làm tiếp"))
else:
    out("skip", f"không thấy {args.base} (chưa git fetch?) — không kiểm được độ chậm của nhánh")

print("── Cổng 1: trước khi lưu/đẩy ──")
files = tracked()

# 1) cú pháp JS
js = [f for f in files if f.endswith(".js") and "_backups/" not in f]
bad = [f for f in js if sh("node", "--check", f)[0] != 0]
out("ok" if not bad else "fail", f"cú pháp JS: {len(js)} file" + ("" if not bad else " — LỖI ở: " + ", ".join(bad)))

# 2) JSON hợp lệ
jf = [f for f in files if f.endswith((".json", ".webmanifest")) and "_backups/" not in f]
badj = []
for f in jf:
    try:
        json.load(open(f, encoding="utf-8"))
    except Exception as e:
        badj.append(f"{f} ({e.__class__.__name__})")
out("ok" if not badj else "fail", f"JSON hợp lệ: {len(jf)} file" + ("" if not badj else " — LỖI: " + ", ".join(badj)))

# 3) 2 file version của thư viện mẫu phải khớp tuyệt đối
try:
    a = json.load(open("data/starter.json", encoding="utf-8")).get("version")
    b = json.load(open("data/starter.version.json", encoding="utf-8")).get("version")
    out("ok" if a == b else "fail", f"starter.json ↔ starter.version.json khớp version ({a!r} vs {b!r})")
except Exception as e:
    out("skip", f"không đọc được starter version: {e}")

# 4) game-version.json phải khớp ?v= của game.js trong game.html
try:
    gv = json.load(open("game-version.json"))["v"]
    m = re.search(r"js/game\.js\?v=(\d+)", open("game.html", encoding="utf-8").read())
    out("ok" if m and int(m.group(1)) == gv else "fail", f"game-version.json (v{gv}) khớp game.html (?v={m.group(1) if m else '?'})")
except Exception as e:
    out("skip", f"không đọc được game-version: {e}")

# 5) file JS/CSS đã đổi so với base thì ?v= của ĐÚNG file đó phải tăng
if base_ok():
    changed = [f for f in sh("git", "diff", "--name-only", f"{args.base}...HEAD")[1].split("\n") if re.match(r"(js|css)/[^/]+\.(js|css)$", f)]
    changed += [f for f in sh("git", "diff", "--name-only", "HEAD")[1].split("\n") if re.match(r"(js|css)/[^/]+\.(js|css)$", f) and f not in changed]
    stale = []
    for f in changed:
        ver = {}
        for page in ("index.html", "game.html"):
            for label, txt in (("now", open(page, encoding="utf-8").read() if os.path.exists(page) else ""), ("base", sh("git", "show", f"{args.base}:{page}")[1])):
                m = re.search(re.escape(f) + r"\?v=(\d+)", txt)
                if m:
                    ver.setdefault(page, {})[label] = int(m.group(1))
        refs = [v for v in ver.values() if "now" in v and "base" in v]
        if refs and not any(v["now"] > v["base"] for v in refs):
            stale.append(f)
        elif not refs:
            out("warn", f"{f} đổi nhưng không thấy trong index.html/game.html (file mới? nhớ thêm thẻ <script>/<link> kèm ?v=)")
    out("ok" if not stale else "fail", f"đã tăng ?v= cho file JS/CSS đổi ({len(changed)} file)" + ("" if not stale else " — QUÊN tăng: " + ", ".join(stale)))
else:
    out("skip", "chưa có base để so ?v= (cần git fetch origin main)")

# 6) quét bí mật (chỉ in tên file:dòng, KHÔNG in giá trị)
pats = {
    "sb_secret": r"sb_secret_[A-Za-z0-9_\-]{10,}", "supabase PAT": r"sbp_[0-9a-f]{20,}",
    "OpenAI key": r"sk-[A-Za-z0-9_\-]{20,}", "Google key": r"AIza[0-9A-Za-z_\-]{35}", "GitHub token": r"gh[pousr]_[A-Za-z0-9]{30,}",
}
hits = []
for f in files:
    if f.endswith((".png", ".jpg", ".jpeg", ".webp", ".ico", ".svg", ".woff", ".woff2")) or f.startswith("tools/_backups/"):
        continue
    try:
        lines = open(f, encoding="utf-8").read().split("\n")
    except Exception:
        continue
    for i, ln in enumerate(lines, 1):
        for name, p in pats.items():
            if re.search(p, ln):
                hits.append(f"{f}:{i} ({name})")
        for tok in re.findall(r"eyJ[A-Za-z0-9_\-]{10,}\.([A-Za-z0-9_\-]{10,})\.[A-Za-z0-9_\-]{10,}", ln):
            try:
                role = json.loads(base64.urlsafe_b64decode(tok + "=" * (-len(tok) % 4))).get("role")
                if role == "service_role":
                    hits.append(f"{f}:{i} (JWT role=service_role)")
            except Exception:
                pass
out("ok" if not hits else "fail", "không lộ khóa bí mật (sb_secret / PAT / OpenAI / Google / GitHub / JWT service_role)" + ("" if not hits else " — THẤY: " + ", ".join(hits[:8])))

# 7) bản quyền: không commit file đề/âm thanh/tài liệu vào repo (repo public)
risky = [f for f in files if re.search(r"\.(pdf|mp3|m4a|wav|mp4|docx?|xlsx?|pptx?)$", f, re.I)]
out("ok" if not risky else "fail", "không có PDF/âm thanh/Office trong repo (đề thi bản quyền để ở Supabase Storage)" + ("" if not risky else " — THẤY: " + ", ".join(risky[:6])))
big = [f"{f} ({os.path.getsize(f)//1024} KB)" for f in files if os.path.getsize(f) > 2_000_000 and "starter" not in f]
if big:
    out("warn", "file lớn > 2 MB: " + ", ".join(big[:5]))

# 8) HANDOFF.md không được phình to
try:
    n = len(open("HANDOFF.md", encoding="utf-8").read().split("\n"))
    out("ok" if n <= 150 else "warn", f"HANDOFF.md {n} dòng" + ("" if n <= 150 else " — quá dài, dời info bền vững sang README/CLAUDE"))
except FileNotFoundError:
    pass

# 9) bộ câu hỏi mới (nếu có)
items = sorted(glob.glob("data/exams/*.json"))
if items:
    rc = subprocess.run([sys.executable, "tools/gate_items.py"] + items).returncode
    out("ok" if rc == 0 else "fail", f"bộ câu hỏi data/exams ({len(items)} file) qua kiểm tra nội dung")

print(f"\nKẾT QUẢ cổng tĩnh: {'ĐẠT ✅' if fails == 0 else f'KHÔNG ĐẠT ❌ ({fails} lỗi)'}")
sys.exit(1 if fails else 0)
