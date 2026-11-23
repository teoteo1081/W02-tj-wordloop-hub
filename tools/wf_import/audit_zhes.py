"""
audit_zhes.py — Kiểm tra hoàn tất dịch tiếng Trung (zh) và Tây Ban Nha (es)
- Đếm NULL còn lại cho 4 cột words + 2 cột traps trong phạm vi
- Lấy ngẫu nhiên 20 dòng words và 20 dòng traps
- Kiểm tra toàn bộ collisions giữa traps và words
- Xuất dữ liệu phục vụ báo cáo
"""

import json
import random
import re
from pathlib import Path
import requests

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
HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

def count_nulls(table, filter_param, col):
    h = dict(HEADERS)
    h["Range-Unit"] = "items"
    h["Range"] = "0-0"
    h["Prefer"] = "count=exact"
    params = f"{filter_param}&{col}=is.null&select=id"
    r = requests.get(f"{REST_URL}/{table}?{params}", headers=h)
    cr = r.headers.get("content-range") or "0-0/0"
    return int(cr.split("/")[-1])

def get_total(table, filter_param):
    h = dict(HEADERS)
    h["Range-Unit"] = "items"
    h["Range"] = "0-0"
    h["Prefer"] = "count=exact"
    r = requests.get(f"{REST_URL}/{table}?{filter_param}&select=id", headers=h)
    cr = r.headers.get("content-range") or "0-0/0"
    return int(cr.split("/")[-1])

def normalize_meanings(text):
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

def main():
    print("=" * 60)
    print("🔍 AUDIT DỮ LIỆU ZH & ES TRONG DATABASE SUPABASE")
    print("=" * 60)

    # 1. WORDS
    w_filter = "id=like.wd_wf_%"
    total_words = get_total("words", w_filter)
    null_m_zh = count_nulls("words", w_filter, "meaning_zh")
    null_q_zh = count_nulls("words", w_filter, "quiz_zh")
    null_m_es = count_nulls("words", w_filter, "meaning_es")
    null_q_es = count_nulls("words", w_filter, "quiz_es")

    print(f"BẢNG words (id like 'wd_wf_%'):")
    print(f"  Tổng số dòng: {total_words}")
    print(f"  NULL meaning_zh: {null_m_zh}")
    print(f"  NULL quiz_zh:    {null_q_zh}")
    print(f"  NULL meaning_es: {null_m_es}")
    print(f"  NULL quiz_es:    {null_q_es}")

    # 2. TRAPS
    t_filter = "source=eq.codex-wf&status=eq.approved"
    total_traps = get_total("word_traps", t_filter)
    null_t_zh = count_nulls("word_traps", t_filter, "trap_zh")
    null_t_es = count_nulls("word_traps", t_filter, "trap_es")

    print(f"\nBẢNG word_traps (source='codex-wf' & status='approved'):")
    print(f"  Tổng số dòng: {total_traps}")
    print(f"  NULL trap_zh:    {null_t_zh}")
    print(f"  NULL trap_es:    {null_t_es}")

    # 3. Lấy toàn bộ từ words để kiểm tra collision toàn diện
    print("\nĐang tải toàn bộ dữ liệu để kiểm tra trùng nghĩa (collision)...")
    words_map = {}
    offset = 0
    all_words = []
    while True:
        h = dict(HEADERS)
        h["Range-Unit"] = "items"
        h["Range"] = f"{offset}-{offset + 999}"
        r = requests.get(f"{REST_URL}/words?{w_filter}&select=id,term,pos,meaning_vi,meaning_zh,quiz_zh,meaning_es,quiz_es", headers=h)
        chunk = r.json()
        all_words.extend(chunk)
        for w in chunk:
            tk = w["term"].strip().lower()
            if tk not in words_map:
                words_map[tk] = {
                    "meaning_zh": w.get("meaning_zh"),
                    "quiz_zh": w.get("quiz_zh"),
                    "meaning_es": w.get("meaning_es"),
                    "quiz_es": w.get("quiz_es"),
                    "zh_tokens": set(),
                    "es_tokens": set(),
                }
            words_map[tk]["zh_tokens"].update(normalize_meanings(f"{w.get('meaning_zh')}, {w.get('quiz_zh')}"))
            words_map[tk]["es_tokens"].update(normalize_meanings(f"{w.get('meaning_es')}, {w.get('quiz_es')}"))
        if len(chunk) < 1000:
            break
        offset += 1000

    # Lấy toàn bộ traps
    all_traps = []
    offset = 0
    while True:
        h = dict(HEADERS)
        h["Range-Unit"] = "items"
        h["Range"] = f"{offset}-{offset + 999}"
        r = requests.get(f"{REST_URL}/word_traps?{t_filter}&select=id,word_term,trap_term,trap_vi,trap_zh,trap_es", headers=h)
        chunk = r.json()
        all_traps.extend(chunk)
        if len(chunk) < 1000:
            break
        offset += 1000

    # Rà soát trùng nghĩa
    collisions = []
    for t in all_traps:
        w_info = words_map.get(t["word_term"].strip().lower(), {})
        t_zh_tokens = normalize_meanings(t.get("trap_zh"))
        t_es_tokens = normalize_meanings(t.get("trap_es"))
        col_zh = bool(t_zh_tokens & w_info.get("zh_tokens", set()))
        col_es = bool(t_es_tokens & w_info.get("es_tokens", set()))
        if col_zh or col_es:
            collisions.append({
                "id": t["id"],
                "word_term": t["word_term"],
                "trap_term": t["trap_term"],
                "trap_vi": t.get("trap_vi"),
                "col_zh": col_zh,
                "trap_zh": t.get("trap_zh"),
                "word_zh": f"{w_info.get('meaning_zh')} (quiz: {w_info.get('quiz_zh')})",
                "col_es": col_es,
                "trap_es": t.get("trap_es"),
                "word_es": f"{w_info.get('meaning_es')} (quiz: {w_info.get('quiz_es')})"
            })

    print(f"Tổng số bẫy còn trùng nghĩa sau chuẩn hoá: {len(collisions)}")

    # 4. Lấy ngẫu nhiên 20 dòng words và 20 dòng traps
    random.seed(42)
    sample_words = random.sample(all_words, min(20, len(all_words)))
    sample_traps = random.sample(all_traps, min(20, len(all_traps)))

    audit_result = {
        "words_total": total_words,
        "words_null_meaning_zh": null_m_zh,
        "words_null_quiz_zh": null_q_zh,
        "words_null_meaning_es": null_m_es,
        "words_null_quiz_es": null_q_es,
        "traps_total": total_traps,
        "traps_null_trap_zh": null_t_zh,
        "traps_null_trap_es": null_t_es,
        "collisions_count": len(collisions),
        "collisions": collisions,
        "sample_words": sample_words,
        "sample_traps": sample_traps
    }

    with open(REPO_ROOT / "data" / "word_family" / "audit_zhes_result.json", "w", encoding="utf-8") as f:
        json.dump(audit_result, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Đã lưu kết quả audit vào data/word_family/audit_zhes_result.json")

if __name__ == "__main__":
    main()
