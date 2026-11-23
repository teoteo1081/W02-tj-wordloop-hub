#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import_db.py — Chuẩn bị và nạp dữ liệu Word Family lên Supabase.
MẶC ĐỊNH LÀ CHẾ ĐỘ DRY-RUN (không ghi gì lên DB).
Chỉ khi có cờ --apply thì mới thực hiện ghi thật.

Quy tắc PostgREST:
  Mọi object trong mảng bulk insert PHẢI có cùng bộ khoá tuyệt đối.
Lưu vết:
  Khi ghi thật (--apply), lưu toàn bộ ID đã tạo vào data/word_family/created_ids.json
  để có thể rollback khi cần.
"""

import sys
import os
import json
import urllib.request
import urllib.error
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_JS = ROOT_DIR / "js" / "config.js"
STRUCTURED_JSON = ROOT_DIR / "data" / "word_family" / "wf_structured.json"
CREATED_IDS_JSON = ROOT_DIR / "data" / "word_family" / "created_ids.json"

CHUNK_SIZE = 100

def get_supabase_config():
    with open(CONFIG_JS, "r", encoding="utf-8") as f:
        text = f.read()
    import re
    url_m = re.search(r'SUPABASE_URL:\s*"([^"]+)"', text)
    key_m = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', text)
    if not url_m or not key_m:
        raise RuntimeError("Không tìm thấy SUPABASE_URL hoặc SUPABASE_ANON_KEY trong js/config.js")
    return url_m.group(1), key_m.group(1)

def rest_get(sb_url, sb_key, path):
    req = urllib.request.Request(
        f"{sb_url}/rest/v1/{path}",
        headers={
            "apikey": sb_key,
            "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def rest_post_chunk(sb_url, sb_key, table, rows):
    url = f"{sb_url}/rest/v1/{table}"
    data = json.dumps(rows, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "apikey": sb_key,
            "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

# Định nghĩa các khoá chuẩn hoá cho từng bảng (PostgREST bulk insert rule)
PAGE_KEYS = ["id", "section_id", "name", "sort", "name_en", "name_zh"]
BATCH_KEYS = ["id", "page_id", "name", "sort", "created_at", "name_en", "name_zh"]
BLOCK_KEYS = ["id", "batch_id", "name", "global_index", "sort", "context_passage", "context_passage_candidates", "framework_data", "framework_data_history"]
WORD_KEYS = ["id", "block_id", "sort", "term", "level", "pos", "ipa", "def_en", "meaning_vi", "freq", "meaning_zh", "meaning_es", "quiz_zh", "quiz_es", "quiz_vi", "audio", "chunks"]
TRAP_KEYS = ["id", "word_term", "kind", "trap_term", "trap_en", "trap_vi", "trap_zh", "trap_es", "why", "risk", "status", "source"]

def normalize_row(row, keys):
    return {k: row.get(k) if k in row else None for k in keys}

def run_import(apply=False):
    sb_url, sb_key = get_supabase_config()
    print(f"Supabase URL: {sb_url}")
    print(f"Chế độ: {'APPLY (GHI THẬT LÊN DATABASE)' if apply else 'DRY-RUN (CHỈ KIỂM TRA, KHÔNG GHI)'}")

    # 1. Kiểm tra Section đích trước
    target_sec_id = "0f1fd8e3-bce9-4edf-8677-13493e553479"
    target_nb_id = "a2571e0c-d952-41ad-98ca-b12fa173e98a"
    
    sec_info = rest_get(sb_url, sb_key, f"sections?id=eq.{target_sec_id}")
    if not sec_info:
        print(f"LỖI: Không tìm thấy Section {target_sec_id} trên Supabase!")
        sys.exit(1)
    print(f"Section xác nhận: {sec_info[0]['name']} (id: {target_sec_id}) thuộc Notebook {sec_info[0]['notebook_id']}")

    existing_pages = rest_get(sb_url, sb_key, f"pages?section_id=eq.{target_sec_id}")
    if existing_pages:
        print(f"CẢNH BÁO / DỪNG: Section đã có sẵn {len(existing_pages)} trang!")
        print("Theo quy định: Nếu đã có dữ liệu thì DỪNG và báo cáo lại, không được xoá hay ghi đè!")
        sys.exit(1)
    else:
        print(f"Section hiện đang hoàn toàn trống (0 trang). An toàn để nạp.")

    # 2. Đọc payload cấu trúc
    if not STRUCTURED_JSON.exists():
        print(f"LỖI: Không tìm thấy file {STRUCTURED_JSON}")
        sys.exit(1)

    with open(STRUCTURED_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_pages = data["pages"]
    raw_batches = data["batches"]
    raw_blocks = data["blocks"]
    raw_words = data["words"]
    raw_traps = data["traps"]

    # 3. Chuẩn hoá khoá cho từng bảng
    norm_pages = [normalize_row(r, PAGE_KEYS) for r in raw_pages]
    norm_batches = [normalize_row(r, BATCH_KEYS) for r in raw_batches]
    norm_blocks = [normalize_row(r, BLOCK_KEYS) for r in raw_blocks]
    norm_words = [normalize_row(r, WORD_KEYS) for r in raw_words]
    norm_traps = [normalize_row(r, TRAP_KEYS) for r in raw_traps]

    # Kiểm tra tính đồng nhất của khoá
    for name, rows, keys in [
        ("pages", norm_pages, PAGE_KEYS),
        ("batches", norm_batches, BATCH_KEYS),
        ("blocks", norm_blocks, BLOCK_KEYS),
        ("words", norm_words, WORD_KEYS),
        ("word_traps", norm_traps, TRAP_KEYS),
    ]:
        for idx, r in enumerate(rows):
            if list(r.keys()) != keys:
                print(f"LỖI BẤT ĐỒNG NHẤT KHOÁ ở bảng {name}, dòng {idx}")
                sys.exit(1)

    print("\n--- KIỂM TRA CHUẨN HOÁ KHOÁ POSTGREST ---")
    print(f"  ✓ pages      : {len(norm_pages)} dòng, đúng {len(PAGE_KEYS)} cột: {PAGE_KEYS}")
    print(f"  ✓ batches    : {len(norm_batches)} dòng, đúng {len(BATCH_KEYS)} cột: {BATCH_KEYS}")
    print(f"  ✓ blocks     : {len(norm_blocks)} dòng, đúng {len(BLOCK_KEYS)} cột: {BLOCK_KEYS}")
    print(f"  ✓ words      : {len(norm_words)} dòng, đúng {len(WORD_KEYS)} cột: {WORD_KEYS}")
    print(f"  ✓ word_traps : {len(norm_traps)} dòng, đúng {len(TRAP_KEYS)} cột: {TRAP_KEYS}")

    print("\n--- MẪU DỮ LIỆU SẼ GỬI (1 DÒNG ĐẦU TIÊN CỦA MỖI BẢNG) ---")
    print("Page mẫu     :", json.dumps(norm_pages[0], ensure_ascii=False))
    print("Batch mẫu    :", json.dumps(norm_batches[0], ensure_ascii=False))
    print("Block mẫu    :", json.dumps({k: norm_blocks[0][k] if k != 'context_passage' else norm_blocks[0][k][:60] + '...' for k in norm_blocks[0]}, ensure_ascii=False))
    print("Word mẫu     :", json.dumps(norm_words[0], ensure_ascii=False))
    print("Trap mẫu     :", json.dumps(norm_traps[0], ensure_ascii=False))

    if not apply:
        print("\n=======================================================")
        print("  DRY-RUN THÀNH CÔNG: KHÔNG CÓ BẤT KỲ DỮ LIỆU NÀO ĐƯỢC GHI!")
        print("  Payload hoàn toàn hợp lệ, sẵn sàng nạp khi được duyệt.")
        print("  Để ghi thật sau này: python tools/wf_import/import_db.py --apply")
        print("=======================================================")
        return

    # 4. CHẾ ĐỘ APPLY (GHI THẬT)
    print("\nBẮT ĐẦU NẠP DỮ LIỆU LÊN SUPABASE THEO LÔ...")
    created_ids = {
        "pages": [],
        "batches": [],
        "blocks": [],
        "words": [],
        "word_traps": []
    }

    try:
        # A. Pages
        print(f"Nạp {len(norm_pages)} pages...")
        res = rest_post_chunk(sb_url, sb_key, "pages", norm_pages)
        created_ids["pages"] = [r["id"] for r in norm_pages]
        print(f"  -> Xong {len(norm_pages)} pages.")

        # B. Batches
        print(f"Nạp {len(norm_batches)} batches...")
        res = rest_post_chunk(sb_url, sb_key, "batches", norm_batches)
        created_ids["batches"] = [r["id"] for r in norm_batches]
        print(f"  -> Xong {len(norm_batches)} batches.")

        # C. Blocks
        print(f"Nạp {len(norm_blocks)} blocks...")
        for i in range(0, len(norm_blocks), CHUNK_SIZE):
            chunk = norm_blocks[i:i + CHUNK_SIZE]
            rest_post_chunk(sb_url, sb_key, "blocks", chunk)
            created_ids["blocks"].extend([r["id"] for r in chunk])
            print(f"  Block chunk {i + len(chunk)}/{len(norm_blocks)}...")

        # D. Words
        print(f"Nạp {len(norm_words)} words...")
        for i in range(0, len(norm_words), CHUNK_SIZE):
            chunk = norm_words[i:i + CHUNK_SIZE]
            rest_post_chunk(sb_url, sb_key, "words", chunk)
            created_ids["words"].extend([r["id"] for r in chunk])
            print(f"  Word chunk {i + len(chunk)}/{len(norm_words)}...")

        # E. Traps
        print(f"Nạp {len(norm_traps)} word_traps...")
        for i in range(0, len(norm_traps), CHUNK_SIZE):
            chunk = norm_traps[i:i + CHUNK_SIZE]
            rest_post_chunk(sb_url, sb_key, "word_traps", chunk)
            created_ids["word_traps"].extend([r["id"] for r in chunk])
            print(f"  Trap chunk {i + len(chunk)}/{len(norm_traps)}...")

        # Lưu created_ids.json
        with open(CREATED_IDS_JSON, "w", encoding="utf-8") as f:
            json.dump(created_ids, f, ensure_ascii=False, indent=2)
        print(f"\nĐÃ NẠP THÀNH CÔNG VÀ LƯU created_ids.json: {CREATED_IDS_JSON}")

    except Exception as e:
        print(f"\nLỖI TRONG QUÁ TRÌNH NẠP: {e}")
        # Lưu created_ids đã tạo trước khi crash để rollback
        with open(CREATED_IDS_JSON, "w", encoding="utf-8") as f:
            json.dump(created_ids, f, ensure_ascii=False, indent=2)
        print(f"Đã lưu các ID đã nạp trước khi lỗi vào: {CREATED_IDS_JSON}")
        sys.exit(1)

if __name__ == "__main__":
    apply_flag = "--apply" in sys.argv
    run_import(apply=apply_flag)
