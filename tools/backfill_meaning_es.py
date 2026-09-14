"""
================================================================================
 backfill_meaning_es.py — ĐIỀN NGHĨA TIẾNG TÂY BAN NHA cho từ CŨ đã có sẵn
================================================================================
 NHÂN BẢN từ tools/backfill_meaning_zh.py (giữ nguyên logic, chỉ đổi ZH -> ES).

 Tính năng tab "Nghĩa" chọn "ES" (thêm 2026-09-14) cần cột words.meaning_es
 — nhưng CHỈ từ mới dán sau ngày đó mới được AI tự điền (qua
 Context.enrichWords khi dùng "+ Paste từ mới"). Mọi từ CŨ (tạo trước đó,
 gần như toàn bộ kho) vẫn thiếu, khiến tab ES luôn báo trống với các
 Block cũ (TJ gặp đúng tình huống này với Block 6).

 Script này quét TOÀN BỘ từ đang thiếu meaning_es, gọi Gemini (qua proxy
 gemini-proxy, giống hệt context.js — KHÔNG cần key riêng, miễn phí) để
 điền — CHỈ điền đúng 1 cột meaning_es, KHÔNG đụng level/pos/ipa/def_en/
 meaning_vi/meaning_zh/freq đã có sẵn (đưa kèm nghĩa VI/EN đã biết vào
 prompt để AI chọn đúng nghĩa phù hợp ngữ cảnh, tránh nghĩa chung chung
 sai be bét).

 AN TOÀN — chạy lại bao nhiêu lần cũng được (idempotent): mỗi lần chỉ lấy
 đúng những dòng CÒN TRỐNG meaning_es, dòng đã điền rồi không đụng lại.

 CÁCH DÙNG:
   python3 tools/backfill_meaning_es.py            (điền hết những gì đang thiếu)
   python3 tools/backfill_meaning_es.py --limit 200 (test thử 200 từ trước)
================================================================================
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import requests

HERE = Path(__file__).resolve().parent
CONFIG_JS_PATH = HERE.parent / "js" / "config.js"


def _read_config_js():
    text = CONFIG_JS_PATH.read_text(encoding="utf-8")
    url_m = re.search(r'SUPABASE_URL:\s*"([^"]+)"', text)
    key_m = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', text)
    if not url_m or not key_m or not url_m.group(1) or not key_m.group(1):
        sys.exit(f"❌ {CONFIG_JS_PATH} đang trống SUPABASE_URL/KEY — chạy từ thư mục TJHUB gốc.")
    return url_m.group(1).rstrip("/"), key_m.group(1)


SUPABASE_URL, SUPABASE_ANON_KEY = _read_config_js()
REST_URL = SUPABASE_URL + "/rest/v1"
PROXY_URL = SUPABASE_URL + "/functions/v1/gemini-proxy"
HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

BATCH = 25  # khớp BATCH trong Context.enrichWords (context.js)


def fetch_missing(limit=None):
    """Lấy TOÀN BỘ từ đang thiếu meaning_es (phân trang 1000 dòng/lần)."""
    rows = []
    offset = 0
    while True:
        headers = dict(HEADERS)
        headers["Range-Unit"] = "items"
        headers["Range"] = f"{offset}-{offset + 999}"
        r = requests.get(f"{REST_URL}/words", headers=headers, params={
            "select": "id,term,meaning_vi,def_en",
            "meaning_es": "eq."
        }, timeout=30)
        r.raise_for_status()
        chunk = r.json()
        rows.extend(chunk)
        if limit and len(rows) >= limit:
            return rows[:limit]
        if len(chunk) < 1000:
            break
        offset += 1000
    return rows


def call_gemini(sys_prompt, user_prompt):
    body = {"model": "gemini-3.5-flash-lite", "sys": sys_prompt, "user": user_prompt}
    last_err = None
    for attempt in range(3):
        if attempt > 0:
            time.sleep(1.5 * (2 ** (attempt - 1)))
        try:
            r = requests.post(PROXY_URL, headers=HEADERS, json=body, timeout=60)
        except requests.RequestException as e:
            last_err = e
            continue
        if r.status_code == 200:
            data = r.json()
            cand = (data.get("candidates") or [{}])[0]
            text = (cand.get("content") or {}).get("parts", [{}])[0].get("text")
            if text:
                return text
            last_err = RuntimeError("Gemini trả về rỗng")
        else:
            last_err = RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
            if r.status_code not in (429, 503):
                break
    raise last_err


def process_batch(rows):
    listing = "\n".join(
        f'{i + 1}. "{r["term"]}"' + (
            f" (nghĩa VI đã biết: {r['meaning_vi']})" if r.get("meaning_vi")
            else (f" (định nghĩa EN đã biết: {r['def_en']})" if r.get("def_en") else "")
        )
        for i, r in enumerate(rows)
    )
    sys_p = ("Bạn là từ điển Anh-Tây Ban Nha cho người Việt học tiếng Anh. Trả lời DUY NHẤT 1 object "
             "JSON đúng schema được yêu cầu, không thêm chữ nào khác, không dùng markdown code fence.")
    user_p = (
        f"Cho nghĩa tiếng Tây Ban Nha (ngắn gọn, đúng nghĩa dùng trong từ điển — không phải câu "
        f"giải thích dài) của ĐÚNG {len(rows)} từ/cụm từ tiếng Anh sau (đã đánh số thứ tự, có sẵn "
        f"nghĩa Việt/Anh tham khảo để bạn chọn đúng nghĩa phù hợp ngữ cảnh, không phải nghĩa khác của "
        f"từ đa nghĩa):\n\n" + listing + "\n\n"
        f"Trả về ĐÚNG THEO THỨ TỰ đã đánh số, đủ {len(rows)} mục, không bỏ mục nào:\n"
        '{"words":["nghĩa tiếng Tây Ban Nha của từ 1","nghĩa tiếng Tây Ban Nha của từ 2",...]}'
    )
    raw = call_gemini(sys_p, user_p)
    parsed = json.loads(raw)
    return parsed.get("words", [])


def patch_word(word_id, meaning_es):
    r = requests.patch(
        f"{REST_URL}/words", headers=HEADERS, params={"id": f"eq.{word_id}"},
        json={"meaning_es": meaning_es}, timeout=30
    )
    r.raise_for_status()


def main():
    ap = argparse.ArgumentParser(description="Điền nghĩa tiếng Tây Ban Nha (meaning_es) cho từ cũ còn thiếu.")
    ap.add_argument("--limit", type=int, default=None, help="Chỉ xử lý tối đa N từ (test thử)")
    args = ap.parse_args()

    print(f"📡 Kết nối Supabase: {SUPABASE_URL}")
    rows = fetch_missing(args.limit)
    print(f"Tổng số từ cần điền nghĩa tiếng Tây Ban Nha: {len(rows)}")
    if not rows:
        print("✅ Không còn từ nào thiếu — đã điền đủ từ trước.")
        return

    done, failed_batches = 0, 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        try:
            es_list = process_batch(chunk)
        except Exception as e:
            print(f"  ⚠️ Lỗi batch {i // BATCH + 1}: {e} — bỏ qua batch này, thử batch sau")
            failed_batches += 1
            continue
        for r, es in zip(chunk, es_list):
            if not es:
                continue
            try:
                patch_word(r["id"], es)
                done += 1
            except Exception as e:
                print(f"  ⚠️ Lỗi lưu '{r['term']}': {e}")
        print(f"  Tiến độ: {min(i + BATCH, len(rows))}/{len(rows)} · đã điền thành công: {done}")

    print("")
    print(f"✅ HOÀN TẤT: {done}/{len(rows)} từ đã có nghĩa tiếng Tây Ban Nha"
          + (f" ({failed_batches} batch lỗi, chạy lại lệnh này lần nữa sẽ tự thử lại đúng phần còn thiếu)."
             if failed_batches else "."))


if __name__ == "__main__":
    main()
