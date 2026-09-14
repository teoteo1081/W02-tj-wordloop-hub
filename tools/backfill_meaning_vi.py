"""
================================================================================
 backfill_meaning_vi.py — ĐIỀN NGHĨA TIẾNG VIỆT cho từ CŨ còn thiếu, dùng OpenAI
================================================================================
 NHÂN BẢN cấu trúc từ tools/backfill_meaning_zh.py / backfill_meaning_es.py,
 nhưng đổi nguồn AI: gọi THẲNG OpenAI API (không qua openai-proxy) bằng key
 lấy từ js/keys.local.js — CHỈ chạy được trên máy có sẵn file này (key cá
 nhân, không commit lên git, xem .gitignore). Trình duyệt bị CORS chặn khi
 gọi thẳng api.openai.com (xem ghi chú trong js/context.js), nhưng Python
 không bị CORS ràng buộc (CORS chỉ áp dụng cho trình duyệt) nên gọi thẳng
 vẫn ổn — không cần qua Edge Function ở đây.

 Quét TOÀN BỘ từ đang thiếu meaning_vi (cột lẽ ra hiếm khi trống vì đây là
 nghĩa mặc định app hiển thị, nhưng vẫn có thể sót — ví dụ từ paste qua
 AI extractVocab lỗi giữa chừng, hoặc nhập tay bỏ trống). CHỈ điền đúng 1
 cột meaning_vi, KHÔNG đụng level/pos/ipa/def_en/meaning_zh/meaning_es/freq
 đã có sẵn (đưa kèm định nghĩa EN đã biết vào prompt để AI chọn đúng nghĩa
 phù hợp ngữ cảnh, tránh nghĩa chung chung sai be bét).

 AN TOÀN — chạy lại bao nhiêu lần cũng được (idempotent): mỗi lần chỉ lấy
 đúng những dòng CÒN TRỐNG meaning_vi, dòng đã điền rồi không đụng lại.

 CÁCH DÙNG (bắt buộc chạy trên máy có js/keys.local.js với OPENAI_API_KEY):
   python3 tools/backfill_meaning_vi.py            (điền hết những gì đang thiếu)
   python3 tools/backfill_meaning_vi.py --limit 200 (test thử 200 từ trước)
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
KEYS_LOCAL_PATH = HERE.parent / "js" / "keys.local.js"


def _read_config_js():
    text = CONFIG_JS_PATH.read_text(encoding="utf-8")
    url_m = re.search(r'SUPABASE_URL:\s*"([^"]+)"', text)
    key_m = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', text)
    if not url_m or not key_m or not url_m.group(1) or not key_m.group(1):
        sys.exit(f"❌ {CONFIG_JS_PATH} đang trống SUPABASE_URL/KEY — chạy từ thư mục TJHUB gốc.")
    return url_m.group(1).rstrip("/"), key_m.group(1)


def _read_openai_key():
    if not KEYS_LOCAL_PATH.exists():
        sys.exit(f"❌ Không thấy {KEYS_LOCAL_PATH} — script này CHỈ chạy trên máy có key OpenAI cá "
                  f"nhân (copy js/keys.local.example.js thành js/keys.local.js rồi điền key thật).")
    text = KEYS_LOCAL_PATH.read_text(encoding="utf-8")
    m = re.search(r'OPENAI_API_KEY\s*=\s*"([^"]+)"', text)
    if not m or not m.group(1):
        sys.exit(f"❌ {KEYS_LOCAL_PATH} chưa có OPENAI_API_KEY.")
    return m.group(1)


SUPABASE_URL, SUPABASE_ANON_KEY = _read_config_js()
OPENAI_API_KEY = _read_openai_key()
REST_URL = SUPABASE_URL + "/rest/v1"
DB_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = "gpt-4o-mini"  # khớp mặc định Context._callOpenAI trong js/context.js

BATCH = 25  # khớp BATCH trong Context.enrichWords (context.js)


def fetch_missing(limit=None):
    """Lấy TOÀN BỘ từ đang thiếu meaning_vi (phân trang 1000 dòng/lần)."""
    rows = []
    offset = 0
    while True:
        headers = dict(DB_HEADERS)
        headers["Range-Unit"] = "items"
        headers["Range"] = f"{offset}-{offset + 999}"
        r = requests.get(f"{REST_URL}/words", headers=headers, params={
            "select": "id,term,def_en",
            "meaning_vi": "eq."
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


def call_openai(sys_prompt, user_prompt):
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    body = {
        "model": OPENAI_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    last_err = None
    for attempt in range(3):
        if attempt > 0:
            time.sleep(1.5 * (2 ** (attempt - 1)))
        try:
            r = requests.post(OPENAI_URL, headers=headers, json=body, timeout=60)
        except requests.RequestException as e:
            last_err = e
            continue
        if r.status_code == 200:
            data = r.json()
            text = data["choices"][0]["message"]["content"]
            if text:
                return text
            last_err = RuntimeError("OpenAI trả về rỗng")
        else:
            last_err = RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
            if r.status_code not in (429, 503):
                break
    raise last_err


def process_batch(rows):
    listing = "\n".join(
        f'{i + 1}. "{r["term"]}"' + (f" (định nghĩa EN đã biết: {r['def_en']})" if r.get("def_en") else "")
        for i, r in enumerate(rows)
    )
    sys_p = ("Bạn là từ điển Anh-Việt cho người Việt học tiếng Anh. Trả lời DUY NHẤT 1 object JSON "
             "đúng schema được yêu cầu, không thêm chữ nào khác.")
    user_p = (
        f"Cho nghĩa tiếng Việt (ngắn gọn, đúng nghĩa dùng trong từ điển — không phải câu giải thích "
        f"dài) của ĐÚNG {len(rows)} từ/cụm từ tiếng Anh sau (đã đánh số thứ tự, có sẵn định nghĩa EN "
        f"tham khảo để bạn chọn đúng nghĩa phù hợp ngữ cảnh, không phải nghĩa khác của từ đa "
        f"nghĩa):\n\n" + listing + "\n\n"
        f"Trả về ĐÚNG THEO THỨ TỰ đã đánh số, đủ {len(rows)} mục, không bỏ mục nào:\n"
        '{"words":["nghĩa tiếng Việt của từ 1","nghĩa tiếng Việt của từ 2",...]}'
    )
    raw = call_openai(sys_p, user_p)
    parsed = json.loads(raw)
    return parsed.get("words", [])


def patch_word(word_id, meaning_vi):
    r = requests.patch(
        f"{REST_URL}/words", headers=DB_HEADERS, params={"id": f"eq.{word_id}"},
        json={"meaning_vi": meaning_vi}, timeout=30
    )
    r.raise_for_status()


def main():
    ap = argparse.ArgumentParser(description="Điền nghĩa tiếng Việt (meaning_vi) cho từ cũ còn thiếu, dùng OpenAI.")
    ap.add_argument("--limit", type=int, default=None, help="Chỉ xử lý tối đa N từ (test thử)")
    args = ap.parse_args()

    print(f"📡 Kết nối Supabase: {SUPABASE_URL}")
    print(f"🤖 Dùng OpenAI ({OPENAI_MODEL}) trực tiếp bằng key local")
    rows = fetch_missing(args.limit)
    print(f"Tổng số từ đang thiếu nghĩa tiếng Việt: {len(rows)}")
    if not rows:
        print("✅ Không còn từ nào thiếu — đã điền đủ từ trước.")
        return

    done, failed_batches = 0, 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        try:
            vi_list = process_batch(chunk)
        except Exception as e:
            print(f"  ⚠️ Lỗi batch {i // BATCH + 1}: {e} — bỏ qua batch này, thử batch sau")
            failed_batches += 1
            continue
        for r, vi in zip(chunk, vi_list):
            if not vi:
                continue
            try:
                patch_word(r["id"], vi)
                done += 1
            except Exception as e:
                print(f"  ⚠️ Lỗi lưu '{r['term']}': {e}")
        print(f"  Tiến độ: {min(i + BATCH, len(rows))}/{len(rows)} · đã điền thành công: {done}")

    print("")
    print(f"✅ HOÀN TẤT: {done}/{len(rows)} từ đã có nghĩa tiếng Việt"
          + (f" ({failed_batches} batch lỗi, chạy lại lệnh này lần nữa sẽ tự thử lại đúng phần còn thiếu)."
             if failed_batches else "."))


if __name__ == "__main__":
    main()
