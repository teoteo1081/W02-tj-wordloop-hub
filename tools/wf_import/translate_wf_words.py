"""
translate_wf_words.py — Dịch tiếng Trung (zh) + Tây Ban Nha (es) cho từ vựng Word Family (wd_wf_%)

Phạm vi: Bảng words, id dạng 'wd_wf_%' (2082 dòng).
Điền:
- meaning_zh, meaning_es: 2-3 nghĩa ngắn, phẩy ngăn, khớp từ loại (POS) và context.
- quiz_zh, quiz_es: 1 nghĩa ngắn gọn nhất, khớp với quiz_vi.
Gửi kèm: term, pos, def_en, meaning_vi, quiz_vi.
Dùng: gemini-3.5-flash-lite qua gemini-proxy; fallback openai-proxy (gpt-4o-mini).
Batch: ~40 từ/lần gọi.
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path
import requests

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent.parent
CONFIG_JS = REPO_ROOT / "js" / "config.js"

def get_config():
    text = CONFIG_JS.read_text(encoding="utf-8")
    url = re.search(r'SUPABASE_URL:\s*"([^"]+)"', text).group(1).rstrip("/")
    key = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', text).group(1)
    return url, key

SUPABASE_URL, SUPABASE_ANON_KEY = get_config()
REST_URL = SUPABASE_URL + "/rest/v1"
GEMINI_PROXY_URL = SUPABASE_URL + "/functions/v1/gemini-proxy"
OPENAI_PROXY_URL = SUPABASE_URL + "/functions/v1/openai-proxy"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

SYS_PROMPT = (
    "You are an expert lexicographer and translator for an educational vocabulary learning app. "
    "Translate English terms into Simplified Chinese (zh) and Spanish (es). "
    "Strictly follow the specified Part of Speech (POS) and context definition. "
    "For example: 'decide' (v) vs 'decision' (n) vs 'decisive' (adj) must reflect their distinct POS in Chinese and Spanish translations. "
    "Return ONLY a valid JSON object matching the requested schema. No code fences, no extra text."
)

def fetch_words_to_translate(limit=None):
    """Lấy danh sách từ wd_wf_% còn thiếu ít nhất 1 trong 4 cột zh/es."""
    rows = []
    offset = 0
    while True:
        h = dict(HEADERS)
        h["Range-Unit"] = "items"
        h["Range"] = f"{offset}-{offset + 999}"
        params = {
            "id": "like.wd_wf_%",
            "select": "id,term,pos,def_en,meaning_vi,quiz_vi,meaning_zh,quiz_zh,meaning_es,quiz_es",
            "order": "id.asc"
        }
        r = requests.get(f"{REST_URL}/words", headers=h, params=params, timeout=30)
        r.raise_for_status()
        chunk = r.json()
        for row in chunk:
            # Kiểm tra nếu còn thiếu bất kỳ cột nào
            if (not row.get("meaning_zh") or not row.get("quiz_zh") or
                not row.get("meaning_es") or not row.get("quiz_es")):
                rows.append(row)
                if limit and len(rows) >= limit:
                    return rows
        if len(chunk) < 1000:
            break
        offset += 1000
    return rows

def call_ai(user_prompt):
    """Gọi Gemini trước qua gemini-proxy, lỗi thì fallback OpenAI (gpt-4o-mini)."""
    # 1. Thử Gemini
    gemini_body = {
        "model": "gemini-3.5-flash-lite",
        "sys": SYS_PROMPT,
        "user": user_prompt
    }
    provider_used = "gemini"
    for attempt in range(3):
        if attempt > 0:
            time.sleep(2 * attempt)
        try:
            r = requests.post(GEMINI_PROXY_URL, headers=HEADERS, json=gemini_body, timeout=60)
            if r.status_code == 200:
                data = r.json()
                cand = (data.get("candidates") or [{}])[0]
                text = (cand.get("content") or {}).get("parts", [{}])[0].get("text")
                if text:
                    return text, "gemini"
        except Exception as e:
            print(f"    [Gemini attempt {attempt+1} err: {e}]", file=sys.stderr)

    # 2. Fallback OpenAI
    print("    [Fallback to OpenAI gpt-4o-mini...]", file=sys.stderr)
    openai_body = {
        "model": "gpt-4o-mini",
        "sys": SYS_PROMPT,
        "user": user_prompt
    }
    for attempt in range(2):
        if attempt > 0:
            time.sleep(2)
        try:
            r = requests.post(OPENAI_PROXY_URL, headers=HEADERS, json=openai_body, timeout=60)
            if r.status_code == 200:
                data = r.json()
                text = data["choices"][0]["message"]["content"]
                if text:
                    return text, "openai"
            else:
                print(f"    [OpenAI HTTP {r.status_code}: {r.text[:150]}]", file=sys.stderr)
        except Exception as e:
            print(f"    [OpenAI attempt {attempt+1} err: {e}]", file=sys.stderr)

    raise RuntimeError("Cả Gemini và OpenAI proxy đều thất bại.")

def translate_batch(batch):
    listing = []
    for i, w in enumerate(batch):
        listing.append(
            f"{i+1}. id: \"{w['id']}\" | term: \"{w['term']}\" | pos: \"{w.get('pos') or ''}\" | "
            f"def_en: \"{w.get('def_en') or ''}\" | meaning_vi: \"{w.get('meaning_vi') or ''}\" | "
            f"quiz_vi: \"{w.get('quiz_vi') or ''}\""
        )
    listing_str = "\n".join(listing)

    user_prompt = f"""For each of the following {len(batch)} English words, provide:
- meaning_zh: 2-3 short meanings in Simplified Chinese separated by commas (matching meaning_vi style and POS).
- quiz_zh: exactly 1 shortest, most concise Chinese meaning (matching quiz_vi).
- meaning_es: 2-3 short meanings in Spanish separated by commas (matching meaning_vi style and POS).
- quiz_es: exactly 1 shortest, most concise Spanish meaning (matching quiz_vi).

Words to translate:
{listing_str}

Return JSON with format:
{{
  "items": [
    {{
      "index": 1,
      "id": "...",
      "meaning_zh": "...",
      "quiz_zh": "...",
      "meaning_es": "...",
      "quiz_es": "..."
    }}
  ]
}}"""

    raw_text, provider = call_ai(user_prompt)
    clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.MULTILINE)
    clean_text = re.sub(r"\s*```$", "", clean_text.strip(), flags=re.MULTILINE)
    data = json.loads(clean_text)
    items = data.get("items", [])
    return items, provider

def patch_words(session, batch, items):
    """PATCH từng từ vào Supabase words table."""
    items_by_idx = {it.get("index"): it for it in items if "index" in it}
    items_by_id = {it.get("id"): it for it in items if "id" in it}

    success_count = 0
    for i, orig in enumerate(batch):
        matched = items_by_id.get(orig["id"]) or items_by_idx.get(i + 1)
        if not matched:
            print(f"    ⚠️ Không tìm thấy kết quả cho từ {orig['id']} ({orig['term']})")
            continue

        payload = {}
        if not orig.get("meaning_zh") or matched.get("meaning_zh"):
            payload["meaning_zh"] = str(matched.get("meaning_zh") or "").strip()
        if not orig.get("quiz_zh") or matched.get("quiz_zh"):
            payload["quiz_zh"] = str(matched.get("quiz_zh") or "").strip()
        if not orig.get("meaning_es") or matched.get("meaning_es"):
            payload["meaning_es"] = str(matched.get("meaning_es") or "").strip()
        if not orig.get("quiz_es") or matched.get("quiz_es"):
            payload["quiz_es"] = str(matched.get("quiz_es") or "").strip()

        # Kiểm tra nếu rỗng thì không ghi đè giá trị rác
        if not payload.get("meaning_zh") or not payload.get("quiz_zh") or not payload.get("meaning_es") or not payload.get("quiz_es"):
            print(f"    ⚠️ Kết quả thiếu trường cho {orig['term']}: {payload}")
            continue

        r = session.patch(f"{REST_URL}/words?id=eq.{orig['id']}", headers=HEADERS, json=payload, timeout=20)
        if r.status_code in (200, 204):
            success_count += 1
        else:
            print(f"    ❌ Lỗi patch {orig['id']}: HTTP {r.status_code} {r.text[:100]}")
    return success_count

def run_translation(batch_size=40, limit=None):
    print("=" * 60)
    print("🚀 BẮT ĐẦU DỊCH TIẾNG TRUNG & TÂY BAN NHA CHO BẢNG WORDS (wd_wf_%)")
    print("=" * 60)

    rows = fetch_words_to_translate(limit=limit)
    total = len(rows)
    print(f"Tổng số từ cần điền (còn thiếu ít nhất 1 cột): {total}")
    if total == 0:
        print("✅ Tất cả từ wd_wf_% đã có đủ 4 cột zh/es!")
        return 0, 0, "gemini"

    session = requests.Session()
    session.headers.update(HEADERS)

    total_patched = 0
    providers_used = set()
    num_batches = (total + batch_size - 1) // batch_size
    start_time = time.time()

    for b_idx in range(num_batches):
        b_start = b_idx * batch_size
        b_end = min(b_start + batch_size, total)
        chunk = rows[b_start:b_end]

        print(f"\n📦 Lô {b_idx + 1}/{num_batches} (từ {b_start + 1} - {b_end}/{total})...", end=" ", flush=True)
        try:
            items, provider = translate_batch(chunk)
            providers_used.add(provider)
            patched = patch_words(session, chunk, items)
            total_patched += patched
            print(f"✅ Xong ({patched}/{len(chunk)} từ, via {provider})", flush=True)
        except Exception as e:
            print(f"❌ LỖI LÔ: {e}", flush=True)

        # Nghỉ nhẹ giữa các lô để bảo vệ rate limit
        time.sleep(1.0)

    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print(f"🎉 HOÀN THÀNH: Đã patch {total_patched}/{total} từ trong {elapsed:.1f}s.")
    print(f"Nhà cung cấp đã dùng: {', '.join(providers_used)}")
    print("=" * 60)
    return total_patched, total, list(providers_used)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=40)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    run_translation(batch_size=args.batch_size, limit=args.limit)
