"""
translate_wf_traps.py — Dịch tiếng Trung (zh) + Tây Ban Nha (es) cho bẫy Word Family (word_traps)

Phạm vi: Bảng word_traps với source = 'codex-wf' và status = 'approved' (3330 dòng).
Điền:
- trap_zh: nghĩa tiếng Trung giản thể ngắn gọn (1-2 từ, cùng phong cách trap_vi).
- trap_es: nghĩa tiếng Tây Ban Nha ngắn gọn (1-2 từ, cùng phong cách trap_vi).
Ràng buộc:
- Nghĩa zh/es của bẫy KHÔNG được trùng nghĩa zh/es của từ gốc (word_term) sau chuẩn hoá:
  viết thường, bỏ ngoặc, tách , ; /
- Nếu trùng: tự động dịch lại cho phân biệt rõ. Nếu vẫn trùng sau khi dịch lại, ghi vào báo cáo (không đổi status).
Dùng: gemini-3.5-flash-lite qua gemini-proxy; fallback openai-proxy (gpt-4o-mini).
Batch: ~40 bẫy/lần gọi.
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
    "Translate trap/distractor words into Simplified Chinese (trap_zh) and Spanish (trap_es). "
    "IMPORTANT CONSTRAINT: The trap word is a distractor for the target word. "
    "The translation of the trap word MUST accurately convey its meaning, but MUST NOT have the exact same meaning as the target word. "
    "Keep translations short (1-2 concise meanings/words, like trap_vi). "
    "Return ONLY a valid JSON object matching the requested schema. No code fences, no extra text."
)

def normalize_meanings(text):
    """
    Chuẩn hoá theo yêu cầu:
    1. Viết thường
    2. Bỏ ngoặc (...), [...], （...）, 【...】
    3. Tách theo , ; / (và biến thể 、 ， ；)
    """
    if not text:
        return set()
    cleaned = re.sub(r'[\(\[\（\【][^\)\]\）\】]*[\)\]\）\】]', ' ', str(text))
    cleaned = cleaned.lower()
    raw_parts = re.split(r'[,;/\n|、，；]+', cleaned)
    tokens = set()
    for p in raw_parts:
        p = p.strip().strip('.').strip('-')
        if p:
            tokens.add(p)
    return tokens

def fetch_word_meanings_map():
    """Lấy map từ gốc word_term -> {zh_tokens, es_tokens, meaning_zh, meaning_es, quiz_zh, quiz_es}."""
    print("📖 Đang tải từ điển từ gốc (words wd_wf_%)...")
    word_map = {}
    offset = 0
    while True:
        h = dict(HEADERS)
        h["Range-Unit"] = "items"
        h["Range"] = f"{offset}-{offset + 999}"
        params = {
            "id": "like.wd_wf_%",
            "select": "term,pos,meaning_zh,quiz_zh,meaning_es,quiz_es",
        }
        r = requests.get(f"{REST_URL}/words", headers=h, params=params, timeout=30)
        r.raise_for_status()
        chunk = r.json()
        for w in chunk:
            term_key = w["term"].strip().lower()
            zh_text = f"{w.get('meaning_zh') or ''}, {w.get('quiz_zh') or ''}"
            es_text = f"{w.get('meaning_es') or ''}, {w.get('quiz_es') or ''}"
            if term_key not in word_map:
                word_map[term_key] = {
                    "term": w["term"],
                    "pos": w.get("pos"),
                    "meaning_zh": w.get("meaning_zh"),
                    "meaning_es": w.get("meaning_es"),
                    "quiz_zh": w.get("quiz_zh"),
                    "quiz_es": w.get("quiz_es"),
                    "zh_tokens": set(),
                    "es_tokens": set()
                }
            word_map[term_key]["zh_tokens"].update(normalize_meanings(zh_text))
            word_map[term_key]["es_tokens"].update(normalize_meanings(es_text))
        if len(chunk) < 1000:
            break
        offset += 1000
    print(f"✅ Đã tải thông tin cho {len(word_map)} từ gốc.")
    return word_map

def fetch_traps_to_translate(limit=None):
    """Lấy danh sách word_traps (source=codex-wf, status=approved) còn thiếu trap_zh hoặc trap_es."""
    rows = []
    offset = 0
    while True:
        h = dict(HEADERS)
        h["Range-Unit"] = "items"
        h["Range"] = f"{offset}-{offset + 999}"
        params = {
            "source": "eq.codex-wf",
            "status": "eq.approved",
            "select": "id,word_term,trap_term,trap_en,trap_vi,trap_zh,trap_es",
            "order": "id.asc"
        }
        r = requests.get(f"{REST_URL}/word_traps", headers=h, params=params, timeout=30)
        r.raise_for_status()
        chunk = r.json()
        for row in chunk:
            if not row.get("trap_zh") or not row.get("trap_es"):
                rows.append(row)
                if limit and len(rows) >= limit:
                    return rows
        if len(chunk) < 1000:
            break
        offset += 1000
    return rows

def call_ai(user_prompt):
    """Gọi Gemini trước qua gemini-proxy, lỗi thì fallback OpenAI (gpt-4o-mini)."""
    gemini_body = {
        "model": "gemini-3.5-flash-lite",
        "sys": SYS_PROMPT,
        "user": user_prompt
    }
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
        except Exception as e:
            print(f"    [OpenAI attempt {attempt+1} err: {e}]", file=sys.stderr)

    raise RuntimeError("Cả Gemini và OpenAI proxy đều thất bại.")

def translate_batch(batch, word_map):
    listing = []
    for i, t in enumerate(batch):
        w_info = word_map.get(t["word_term"].strip().lower(), {})
        w_zh = w_info.get("meaning_zh") or ""
        w_es = w_info.get("meaning_es") or ""
        listing.append(
            f"{i+1}. id: \"{t['id']}\" | Target word: \"{t['word_term']}\" (target ZH: '{w_zh}', target ES: '{w_es}') | "
            f"TRAP: \"{t['trap_term']}\" | trap_en: \"{t.get('trap_en') or ''}\" | trap_vi: \"{t.get('trap_vi') or ''}\""
        )
    listing_str = "\n".join(listing)

    user_prompt = f"""For each of the following {len(batch)} trap items, translate the TRAP term into:
- trap_zh: 1-2 concise Simplified Chinese words/meanings (matching trap_vi style). MUST NOT overlap with target ZH!
- trap_es: 1-2 concise Spanish words/meanings (matching trap_vi style). MUST NOT overlap with target ES!

Traps to translate:
{listing_str}

Return JSON with format:
{{
  "items": [
    {{
      "index": 1,
      "id": "...",
      "trap_zh": "...",
      "trap_es": "..."
    }}
  ]
}}"""

    raw_text, provider = call_ai(user_prompt)
    clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.MULTILINE)
    clean_text = re.sub(r"\s*```$", "", clean_text.strip(), flags=re.MULTILINE)
    data = json.loads(clean_text)
    return data.get("items", []), provider

def disambiguate_single_trap(trap_item, word_info, collision_type, provider="gemini"):
    """Dịch lại khi phát hiện trùng nghĩa giữa bẫy và từ gốc."""
    t_term = trap_item["trap_term"]
    w_term = trap_item["word_term"]
    w_zh = word_info.get("meaning_zh") or ""
    w_es = word_info.get("meaning_es") or ""

    user_p = f"""Target word is "{w_term}" (ZH meanings: "{w_zh}", ES meanings: "{w_es}").
The distractor/trap word is "{t_term}" (def: "{trap_item.get('trap_en')}", vi: "{trap_item.get('trap_vi')}").
Previous translation caused collision on {collision_type}.
Please provide an alternative distinct, accurate translation for the trap "{t_term}" that DOES NOT duplicate the target word "{w_term}" meanings in Chinese and Spanish.

Return JSON:
{{
  "trap_zh": "distinct Chinese meaning",
  "trap_es": "distinct Spanish meaning"
}}"""
    try:
        raw_text, prov = call_ai(user_p)
        clean = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.MULTILINE)
        clean = re.sub(r"\s*```$", "", clean.strip(), flags=re.MULTILINE)
        res = json.loads(clean)
        return res.get("trap_zh"), res.get("trap_es"), prov
    except Exception as e:
        print(f"    ⚠️ Lỗi khi thử disambiguate '{t_term}': {e}")
        return None, None, provider

def process_and_patch_traps(session, batch, items, word_map, report_collisions):
    items_by_idx = {it.get("index"): it for it in items if "index" in it}
    items_by_id = {it.get("id"): it for it in items if "id" in it}

    success_count = 0
    for i, orig in enumerate(batch):
        matched = items_by_id.get(orig["id"]) or items_by_idx.get(i + 1)
        if not matched:
            print(f"    ⚠️ Không tìm thấy kết quả cho trap {orig['id']} ({orig['trap_term']})")
            continue

        trap_zh = str(matched.get("trap_zh") or "").strip()
        trap_es = str(matched.get("trap_es") or "").strip()

        w_info = word_map.get(orig["word_term"].strip().lower(), {})
        w_zh_tokens = w_info.get("zh_tokens", set())
        w_es_tokens = w_info.get("es_tokens", set())

        # Kiểm tra trùng nghĩa
        t_zh_tokens = normalize_meanings(trap_zh)
        t_es_tokens = normalize_meanings(trap_es)

        collision_zh = bool(t_zh_tokens & w_zh_tokens)
        collision_es = bool(t_es_tokens & w_es_tokens)

        if collision_zh or collision_es:
            col_type = "ZH and ES" if (collision_zh and collision_es) else ("ZH" if collision_zh else "ES")
            print(f"    ⚠️ Trùng nghĩa {col_type} giữa trap '{orig['trap_term']}' và target '{orig['word_term']}' -> Đang dịch lại...")
            new_zh, new_es, _ = disambiguate_single_trap(orig, w_info, col_type)
            if new_zh and (normalize_meanings(new_zh) & w_zh_tokens == set()):
                trap_zh = new_zh
                collision_zh = False
            if new_es and (normalize_meanings(new_es) & w_es_tokens == set()):
                trap_es = new_es
                collision_es = False

            # Nếu vẫn trùng sau retry, ghi nhận vào report_collisions (không đổi status)
            if collision_zh or collision_es:
                report_collisions.append({
                    "id": orig["id"],
                    "word_term": orig["word_term"],
                    "trap_term": orig["trap_term"],
                    "collision_zh": collision_zh,
                    "trap_zh": trap_zh,
                    "target_zh_tokens": list(w_zh_tokens),
                    "collision_es": collision_es,
                    "trap_es": trap_es,
                    "target_es_tokens": list(w_es_tokens)
                })

        payload = {
            "trap_zh": trap_zh,
            "trap_es": trap_es
        }

        if not payload["trap_zh"] or not payload["trap_es"]:
            print(f"    ⚠️ Giá trị trống cho trap {orig['id']}: {payload}")
            continue

        r = session.patch(f"{REST_URL}/word_traps?id=eq.{orig['id']}", headers=HEADERS, json=payload, timeout=20)
        if r.status_code in (200, 204):
            success_count += 1
        else:
            print(f"    ❌ Lỗi patch trap {orig['id']}: HTTP {r.status_code} {r.text[:100]}")

    return success_count

def run_translation(batch_size=40, limit=None):
    print("=" * 60)
    print("🚀 BẮT ĐẦU DỊCH TIẾNG TRUNG & TÂY BAN NHA CHO BẢNG WORD_TRAPS")
    print("=" * 60)

    word_map = fetch_word_meanings_map()
    rows = fetch_traps_to_translate(limit=limit)
    total = len(rows)
    print(f"Tổng số bẫy cần điền (còn thiếu trap_zh hoặc trap_es): {total}")
    if total == 0:
        print("✅ Tất cả bẫy approved đã có đủ trap_zh và trap_es!")
        return 0, 0, [], []

    session = requests.Session()
    session.headers.update(HEADERS)

    total_patched = 0
    providers_used = set()
    report_collisions = []
    num_batches = (total + batch_size - 1) // batch_size
    start_time = time.time()

    for b_idx in range(num_batches):
        b_start = b_idx * batch_size
        b_end = min(b_start + batch_size, total)
        chunk = rows[b_start:b_end]

        print(f"\n📦 Lô {b_idx + 1}/{num_batches} (bẫy {b_start + 1} - {b_end}/{total})...", end=" ", flush=True)
        try:
            items, provider = translate_batch(chunk, word_map)
            providers_used.add(provider)
            patched = process_and_patch_traps(session, chunk, items, word_map, report_collisions)
            total_patched += patched
            print(f"✅ Xong ({patched}/{len(chunk)} bẫy, via {provider})", flush=True)
        except Exception as e:
            print(f"❌ LỖI LÔ: {e}", flush=True)

        time.sleep(1.0)

    elapsed = time.time() - start_time
    # Ghi nhận danh sách trùng nghĩa (nếu có)
    collision_file = REPO_ROOT / "data" / "word_family" / "trap_collisions.json"
    collision_file.parent.mkdir(parents=True, exist_ok=True)
    with open(collision_file, "w", encoding="utf-8") as f:
        json.dump(report_collisions, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"🎉 HOÀN THÀNH: Đã patch {total_patched}/{total} bẫy trong {elapsed:.1f}s.")
    print(f"Nhà cung cấp đã dùng: {', '.join(providers_used)}")
    print(f"Số bẫy vẫn còn trùng nghĩa sau retry: {len(report_collisions)} (đã lưu vào {collision_file})")
    print(f"Số bẫy vẫn còn trùng nghĩa sau retry (ghi nhận báo cáo): {len(report_collisions)}")
    print("=" * 60)
    return total_patched, total, list(providers_used), report_collisions

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=40)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    run_translation(batch_size=args.batch_size, limit=args.limit)
