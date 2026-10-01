"""Soạn câu trắc nghiệm điền chỗ trống NGẮN cho từ vựng WordLoop (OpenAI qua openai-proxy) -> bảng game_gap_sentences.

Chạy (cần đã chạy tools/game_gap_schema.sql):
    python tools/gen_gap_sentences.py --limit 40        # thử 40 từ
    python tools/gen_gap_sentences.py                   # tất cả từ chưa có câu (chạy lại được, bỏ qua từ đã có)
    python tools/gen_gap_sentences.py --block bl_xxx    # chỉ 1 Block
Mỗi lượt 20 từ CÙNG Block: AI viết câu có manh mối chỉ hợp từ đó, rồi AI thứ 2 đóng vai thí sinh chọn từ trong danh sách;
chọn sai / AMBIGUOUS thì bỏ câu (từ đó sẽ được thử lại ở lần chạy sau).
"""
import argparse, json, re, sys, time
import requests
from _vocab_common import SUPABASE_URL, SUPABASE_ANON_KEY, REST_URL, HEADERS, fetch_all

PROXY = SUPABASE_URL + "/functions/v1/openai-proxy"
MODEL = "gpt-4o-mini"
BATCH = 20


def base_term(t):
    return re.sub(r"\s+", " ", re.sub(r"\s*\([^)]*\)", " ", t or "")).strip()


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", (s or "").lower())).strip()


def ask(sys_msg, user_msg, temperature):
    for attempt in range(4):
        try:
            r = requests.post(PROXY, headers={**HEADERS, "Content-Type": "application/json"}, timeout=90,
                              json={"model": MODEL, "temperature": temperature, "sys": sys_msg, "user": user_msg, "block_id": "game-gap"})
            if r.status_code == 200:
                return json.loads(r.json()["choices"][0]["message"]["content"])
            print("  proxy", r.status_code, r.text[:160])
        except Exception as e:
            print("  lỗi gọi proxy:", e)
        time.sleep(3 * (attempt + 1))
    return None


def write_sentences(items):
    o = ask("You write TOEIC Part 5 style sentences for an English vocabulary fill-in-the-blank quiz. Reply with JSON only.",
            "For EACH item write ONE sentence of 8-14 words in a TOEIC business/workplace context (office, meetings, sales, "
            "travel, hiring, customers, finance, shipping...). Rules:\n"
            "1. Use the term EXACTLY as given (same spelling and form, no plural/past/-ing change), once, with the given meaning.\n"
            "2. Write the FULL sentence WITH the term in it (do NOT write blanks or underscores; we remove the term later).\n"
            "3. The quiz hides the term and offers the OTHER terms in this list as wrong options, so add a strong context clue "
            "(a detail that only goes with this term, e.g. 'by 5 p.m. Friday' for a deadline, 'both sides signed' for an agreement) "
            "so that NO other term in the list fits.\n"
            "4. No definitions, no quotes, no real company names.\n"
            'Return {"items":[{"id":"<id>","s":"<sentence>"}]}.\n'
            + json.dumps([{"id": w["id"], "term": base_term(w["term"]), "pos": w.get("pos") or "",
                           "meaning": w.get("meaning_vi") or w.get("def_en") or ""} for w in items], ensure_ascii=False), 0.7)
    return {x["id"]: x["s"] for x in (o or {}).get("items", []) if x.get("id") and x.get("s")}


def check_sentences(items, cand):
    if not cand:
        return {}
    o = ask("You are a strict TOEIC test taker. Reply with JSON only.",
            'For each sentence choose the ONE term from the list that best fills the blank. If two or more terms fit equally well, answer "AMBIGUOUS".\n'
            "Terms: " + json.dumps([base_term(w["term"]) for w in items], ensure_ascii=False) + "\n"
            'Return {"items":[{"id":"<id>","a":"<term or AMBIGUOUS>"}]}.\n'
            + json.dumps([{"id": i, "s": s} for i, s in cand.items()], ensure_ascii=False), 0)
    return {x["id"]: norm(x.get("a")) for x in (o or {}).get("items", []) if x.get("id")}


def blank_of(sent, term):
    """Câu sau khi thay term bằng _____ ; None nếu term không khớp TRỌN từ đúng 1 lần."""
    b = base_term(term)
    ms = list(re.finditer(r"(?<![A-Za-z])" + re.escape(b) + r"(?![A-Za-z])", sent, re.I))
    if len(ms) != 1 or len(sent.split()) > 20:
        return None
    return sent[:ms[0].start()] + "_____" + sent[ms[0].end():]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--block")
    a = ap.parse_args()

    words = fetch_all("words", "id,block_id,sort,term,pos,meaning_vi,def_en")
    have = {r["word_id"] for r in fetch_all("game_gap_sentences", "word_id")}
    todo = [w for w in words if w["id"] not in have and w.get("term") and (not a.block or w["block_id"] == a.block)]
    if a.limit:
        todo = todo[:a.limit]
    print(f"{len(words)} từ · đã có câu {len(have)} · cần soạn {len(todo)}")

    by_block = {}
    for w in todo:
        by_block.setdefault(w["block_id"], []).append(w)
    batches = []
    for bid, ws in by_block.items():
        ws.sort(key=lambda w: w.get("sort") or 0)
        for i in range(0, len(ws), BATCH):
            batches.append(ws[i:i + BATCH])

    saved = dropped = 0
    for n, items in enumerate(batches, 1):
        out = write_sentences(items)
        cand = {}
        for w in items:
            s = out.get(w["id"])
            if s and blank_of(s, w["term"]):
                cand[w["id"]] = blank_of(s, w["term"])
        chk = check_sentences(items, cand)
        rows = []
        for w in items:
            ok = w["id"] in cand and chk.get(w["id"]) == norm(base_term(w["term"]))
            if ok:
                rows.append({"word_id": w["id"], "block_id": w["block_id"], "term": w["term"], "sentence": out[w["id"]], "checked": True, "model": MODEL})
        dropped += len(items) - len(rows)
        if rows:
            r = requests.post(REST_URL + "/game_gap_sentences", timeout=60,
                              headers={**HEADERS, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}, json=rows)
            if r.status_code >= 300:
                sys.exit(f"❌ Không ghi được vào game_gap_sentences ({r.status_code}): {r.text[:300]}")
            saved += len(rows)
        print(f"[{n}/{len(batches)}] lưu {len(rows)}/{len(items)} · tổng lưu {saved} · bỏ {dropped}", flush=True)
    print(f"Xong. Lưu {saved}, bỏ {dropped} (chạy lại để thử các từ bị bỏ).")


if __name__ == "__main__":
    main()
