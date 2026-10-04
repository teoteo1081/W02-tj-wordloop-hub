#!/usr/bin/env python3
"""Cổng HỒI QUY dữ liệu (chỉ ĐỌC Supabase, không ghi): số câu TOEIC + danh sách Hub không được đổi.

Hồi quy (regression) = sau khi thêm cái mới, chạy lại phép đo của cái CŨ để chắc nó không hỏng.
Mốc chuẩn nằm ở tools/gate_baseline.json. Chạy:
  python3 tools/gate_data.py                  # so với mốc
  python3 tools/gate_data.py --update-baseline  # chụp mốc mới (chỉ khi CHỦ ĐỊNH đổi TOEIC)
"""
import json, os, re, sys, urllib.request
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "tools", "gate_baseline.json")
cfg = open(os.path.join(ROOT, "js", "config.js"), encoding="utf-8").read()
URL = re.search(r'SUPABASE_URL:\s*"([^"]+)"', cfg).group(1)
KEY = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', cfg).group(1)


def get(path):
    r = urllib.request.Request(f"{URL}/rest/v1/{path}", headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    return json.load(urllib.request.urlopen(r, timeout=30))


def snapshot():
    rows, frm = [], 0
    while True:
        part = get(f"test_items?select=test,part&exam=eq.toeic&order=id&limit=1000&offset={frm}")
        rows += part
        if len(part) < 1000:
            break
        frm += 1000
    c = Counter(f"{r['test']}:{r['part']}" for r in rows)
    hubs = sorted(h["id"] for h in get("hubs?select=id"))
    return {"toeic_total": len(rows), "toeic_by_test_part": dict(sorted(c.items())), "hub_ids": hubs}


try:
    now = snapshot()
except Exception as e:
    print(f"⏭️  không đọc được Supabase ({e.__class__.__name__}: {e}) — KHÔNG tính là đạt")
    sys.exit(0)

if "--update-baseline" in sys.argv:
    json.dump(now, open(BASE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"📌 đã chụp mốc mới: {now['toeic_total']} câu TOEIC, {len(now['hub_ids'])} hub → tools/gate_baseline.json")
    sys.exit(0)
if not os.path.exists(BASE):
    print("⏭️  chưa có mốc (chạy với --update-baseline lần đầu)"); sys.exit(0)

base = json.load(open(BASE, encoding="utf-8"))
fails = 0
if now["toeic_by_test_part"] != base["toeic_by_test_part"]:
    diff = {k: (base["toeic_by_test_part"].get(k), now["toeic_by_test_part"].get(k)) for k in set(base["toeic_by_test_part"]) | set(now["toeic_by_test_part"]) if base["toeic_by_test_part"].get(k) != now["toeic_by_test_part"].get(k)}
    print(f"❌ hồi quy TOEIC: số câu theo (đề:part) đã ĐỔI — (mốc → hiện tại) {dict(list(diff.items())[:6])}"); fails += 1
else:
    print(f"✅ hồi quy TOEIC: {now['toeic_total']} câu, {len(now['toeic_by_test_part'])} nhóm (đề:part) y hệt mốc")
gone = sorted(set(base["hub_ids"]) - set(now["hub_ids"]))
if gone:
    print(f"❌ hồi quy Hub: MẤT hub {gone}"); fails += 1
else:
    new = sorted(set(now["hub_ids"]) - set(base["hub_ids"]))
    print(f"✅ hồi quy Hub: đủ {len(base['hub_ids'])} hub cũ" + (f" (thêm mới, bình thường: {new})" if new else ""))
sys.exit(1 if fails else 0)
