#!/usr/bin/env python3
"""Cổng 3 — HẬU KIỂM sau khi đã gộp/đẩy lên main: web live có đúng phiên bản vừa đẩy không.

Chạy:  python3 tools/gate_post.py [URL_GỐC]    (mặc định GitHub Pages của WordLoop)
Không truy cập được web => ⏭️ (KHÔNG phải đạt). Người điều phối (leader) còn phải đối chiếu thêm bằng
công cụ GitHub: workflow "pages build and deployment" của ĐÚNG commit sha dưới đây đã xanh chưa.
"""
import json, re, subprocess, sys, urllib.request

URL = (sys.argv[1] if len(sys.argv) > 1 else "https://teoteo1081.github.io/W02-tj-wordloop-hub/").rstrip("/") + "/"
sha = subprocess.run(["git", "rev-parse", "origin/main"], capture_output=True, text=True).stdout.strip()
print(f"commit sha main mới nhất: {sha or '(chưa git fetch)'}  ← đối chiếu với workflow Pages build")


def fetch(p):
    return urllib.request.urlopen(urllib.request.Request(URL + p + "?gate=" + str(abs(hash(p)) % 9999), headers={"Cache-Control": "no-cache"}), timeout=20).read().decode("utf-8", "replace")


try:
    live_gv = json.loads(fetch("game-version.json"))["v"]
    live_game = fetch("game.html")
except Exception as e:
    print(f"⏭️  không truy cập được {URL} ({e.__class__.__name__}) — hậu kiểm CHƯA làm được, KHÔNG tính là đạt")
    sys.exit(0)

local_gv = json.load(open("game-version.json"))["v"]
m = re.search(r"js/game\.js\?v=(\d+)", live_game)
ok = True
if live_gv != local_gv:
    print(f"❌ web live đang v{live_gv}, code vừa đẩy là v{local_gv} (Pages chưa build xong hoặc push bị bỏ qua — kiểm tra workflow)"); ok = False
else:
    print(f"✅ game-version live = v{live_gv} khớp code")
if not m or int(m.group(1)) != live_gv:
    print(f"❌ game.html live có ?v={m.group(1) if m else '?'} lệch game-version.json v{live_gv}"); ok = False
else:
    print("✅ game.html live khớp game-version.json")
sys.exit(0 if ok else 1)
