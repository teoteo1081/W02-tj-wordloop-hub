#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
parse_pdf.py — Trích xuất toàn bộ họ từ và từ vựng từ file PDF:
  C:/Users/User/AppData/Local/Temp/wf_pdf/wf.pdf
Ra file trung gian:
  data/word_family/wf_parsed.json
"""

import sys
import os
import re
import json
import unicodedata
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import pdfplumber
import pymupdf

PDF_PATH = Path(r"C:\Users\User\AppData\Local\Temp\wf_pdf\wf.pdf")
OUTPUT_JSON = Path(r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\data\word_family\wf_parsed.json")

POS_MAP = {
    "n": "Noun",
    "v": "Verb",
    "adj": "Adjective",
    "adv": "Adverb",
    "phr v": "Phrasal verb",
    "prep": "Preposition",
    "conj": "Conjunction",
    "pron": "Pronoun",
    "det": "Determiner",
    "num": "Number",
    "interj": "Interjection",
}

def clean_text(s):
    if s is None:
        return ""
    # Chuẩn hoá Unicode NFC và thay thế khoảng trắng / xuống dòng thừa
    s = unicodedata.normalize("NFC", str(s))
    s = re.sub(r"\s+", " ", s).strip()
    return s

def make_quiz_vi(meaning_vi):
    """
    Tạo quiz_vi: gọt ngoặc (...), lấy cách dịch ngắn đầu tiên trước dấu phẩy/chấm phẩy/gạch chéo.
    """
    if not meaning_vi:
        return ""
    s = clean_text(meaning_vi)
    # Bỏ ngoặc đơn (..) hoặc （..）
    s = re.sub(r"（[^）]*）|\([^)]*\)", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    # Lấy vế đầu tiên trước , ; /
    parts = re.split(r"[,;/\uff0c\uff1b]", s)
    first = parts[0].strip()
    return first if first else s

def extract_index(doc):
    """Trích xuất mục từ trong Index (trang 142-147) để đối chiếu"""
    entries = []
    for p_idx in range(141, len(doc)):
        text = doc[p_idx].get_text("text")
        for line in text.split("\n"):
            line = clean_text(line)
            # Dạng: application (n) → apply
            m = re.match(r"^([^(→]+?)\s*\(([^)]+)\)\s*→\s*(.+)$", line)
            if m:
                word = clean_text(m.group(1))
                pos = clean_text(m.group(2))
                root = clean_text(m.group(3))
                entries.append({"word": word, "pos": pos, "root": root, "page": p_idx + 1})
    return entries

def parse_pdf():
    print(f"Bắt đầu đọc PDF: {PDF_PATH}")
    if not PDF_PATH.exists():
        print(f"LỖI: Không tìm thấy file {PDF_PATH}")
        sys.exit(1)

    # Đọc Index trước bằng PyMuPDF (rất nhanh)
    mu_doc = pymupdf.open(str(PDF_PATH))
    index_entries = extract_index(mu_doc)
    print(f"Đã đọc Index: {len(index_entries)} mục từ đối chiếu.")

    roots = []       # Danh sách các họ (bao gồm cả multi-member root và standalone word)
    all_words = []   # Danh sách tất cả 2082 từ vựng
    
    current_root = None
    current_chain_terms = set()
    current_letter = "A"

    with pdfplumber.open(str(PDF_PATH)) as pdf:
        # Trang 2 đến trang 141 (0-indexed: 1 đến 140)
        for page_idx in range(1, 141):
            page_num = page_idx + 1
            p = pdf.pages[page_idx]
            tables = p.extract_tables()
            
            for t in tables:
                for row in t:
                    if not row or not any(row):
                        continue
                    
                    c0 = clean_text(row[0])
                    if not c0 or c0 in ("Word", "Tiếng Anh"):
                        continue
                    
                    # Kiểm tra nếu là thanh ROOT
                    if c0.startswith("ROOT"):
                        # Parse chain
                        chain_raw = c0
                        notes_raw = clean_text(row[3]) if len(row) > 3 else ""
                        
                        # Tách dòng ghi chú tiếng Anh và tiếng Việt
                        raw_col3 = row[3] or ""
                        col3_lines = [clean_text(l) for l in raw_col3.split("\n") if clean_text(l)]
                        notes_en = col3_lines[0] if len(col3_lines) > 0 else ""
                        notes_vi = "\n".join(col3_lines[1:]) if len(col3_lines) > 1 else (notes_en if any(ord(c) > 127 for c in notes_en) else "")
                        if notes_vi == "" and any(ord(c) > 127 for c in notes_en):
                            notes_vi = notes_en
                            notes_en = ""
                        
                        # Tách các term trong chain
                        # Chuỗi: ROOT able (adj) → ability (n) → unable (adj) + phrasal: ...
                        cleaned_chain = re.sub(r"^ROOT\s+", "", chain_raw)
                        chain_parts = re.split(r"→|\+\s*phrasal\s*:|,", cleaned_chain)
                        terms_in_chain = set()
                        for pt in chain_parts:
                            pt_word = re.sub(r"\([^)]*\)", "", pt).strip().lower()
                            if pt_word:
                                terms_in_chain.add(pt_word)
                        
                        # Headword của họ: từ đầu tiên
                        m_head = re.match(r"^ROOT\s+([^(→]+?)(?:\s*\([^)]*\))?(?:\s*→|\s*$)", chain_raw)
                        headword = clean_text(m_head.group(1)) if m_head else clean_text(chain_parts[0])
                        
                        current_root = {
                            "root_id": f"root_{len(roots) + 1}",
                            "headword": headword,
                            "chain": chain_raw,
                            "notes_en": notes_en,
                            "notes_vi": notes_vi,
                            "notes_raw": notes_raw,
                            "is_standalone": False,
                            "page": page_num,
                            "words": []
                        }
                        roots.append(current_root)
                        current_chain_terms = terms_in_chain
                    
                    else:
                        # Dòng từ vựng
                        pos_raw = clean_text(row[1]) if len(row) > 1 else ""
                        if not pos_raw:
                            continue
                        
                        term = c0
                        pos = POS_MAP.get(pos_raw, pos_raw.capitalize())
                        def_en = clean_text(row[2]) if len(row) > 2 else ""
                        meaning_vi = clean_text(row[3]) if len(row) > 3 else ""
                        ex_en = clean_text(row[4]) if len(row) > 4 else ""
                        ex_vi = clean_text(row[5]) if len(row) > 5 else ""
                        quiz_vi = make_quiz_vi(meaning_vi)
                        
                        term_norm = term.lower()
                        
                        # Kiểm tra xem từ này có thuộc current_root không
                        is_member = current_root is not None and (term_norm in current_chain_terms)
                        
                        if not is_member:
                            # Từ đứng lẻ không có ROOT
                            standalone_root = {
                                "root_id": f"root_{len(roots) + 1}",
                                "headword": term,
                                "chain": f"ROOT {term} ({pos_raw})",
                                "notes_en": "",
                                "notes_vi": "",
                                "notes_raw": "",
                                "is_standalone": True,
                                "page": page_num,
                                "words": []
                            }
                            roots.append(standalone_root)
                            current_root = standalone_root
                            current_chain_terms = {term_norm}
                        
                        word_obj = {
                            "word_idx": len(all_words) + 1,
                            "term": term,
                            "pos": pos,
                            "pos_raw": pos_raw,
                            "def_en": def_en,
                            "meaning_vi": meaning_vi,
                            "quiz_vi": quiz_vi,
                            "ex_en": ex_en,
                            "ex_vi": ex_vi,
                            "page": page_num,
                            "root_id": current_root["root_id"],
                            "root_headword": current_root["headword"],
                            "is_standalone": current_root["is_standalone"]
                        }
                        all_words.append(word_obj)
                        current_root["words"].append(word_obj)

    print(f"\n--- KẾT QUẢ PARSE ---")
    print(f"Tổng số họ (ROOT) tạo thành: {len(roots)}")
    teal_roots = [r for r in roots if not r["is_standalone"]]
    standalone_roots = [r for r in roots if r["is_standalone"]]
    print(f"  - Họ có thanh ROOT (teal bar): {len(teal_roots)}")
    print(f"  - Từ lẻ (standalone root): {len(standalone_roots)}")
    print(f"  - Tổng họ từ = {len(teal_roots)} + {len(standalone_roots)} = {len(roots)}")
    print(f"Tổng số dòng từ vựng: {len(all_words)}")

    # Đối chiếu với Index
    word_terms_set = set(w["term"].lower() for w in all_words)
    missing_index_words = []
    for entry in index_entries:
        w_norm = entry["word"].lower()
        if w_norm not in word_terms_set:
            missing_index_words.append(entry)
    
    print(f"\n--- ĐỐI CHIẾU INDEX ---")
    print(f"Mục từ Index: {len(index_entries)}")
    print(f"Số từ Index khớp trong dữ liệu từ: {len(index_entries) - len(missing_index_words)} / {len(index_entries)}")
    if missing_index_words:
        print(f"CẢNH BÁO: {len(missing_index_words)} từ trong Index chưa khớp hoàn toàn:")
        for m in missing_index_words[:10]:
            print("  ", m)
    else:
        print("TẤT CẢ TỪ TRONG INDEX ĐỀU XUẤT HIỆN TRONG DỮ LIỆU TỪ VỰNG 100%!")

    # Kiểm tra ô tiếng Việt rỗng hoặc mất dấu
    empty_vi = [w for w in all_words if not w["meaning_vi"]]
    print(f"\n--- KIỂM TRA DỮ LIỆU TIẾNG VIỆT ---")
    print(f"Số từ thiếu meaning_vi: {len(empty_vi)}")
    
    # Lưu ra JSON
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    out_payload = {
        "metadata": {
            "source_pdf": str(PDF_PATH),
            "total_roots": len(roots),
            "teal_roots": len(teal_roots),
            "standalone_roots": len(standalone_roots),
            "total_words": len(all_words),
            "index_entries_count": len(index_entries),
            "index_matched_count": len(index_entries) - len(missing_index_words),
            "generated_at": unicodedata.normalize("NFC", "2026-11-23")
        },
        "roots": roots,
        "words": all_words,
        "index_entries": index_entries
    }
    
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out_payload, f, ensure_ascii=False, indent=2)
    print(f"\nĐã ghi file: {OUTPUT_JSON} ({os.path.getsize(OUTPUT_JSON)} bytes)")

if __name__ == "__main__":
    parse_pdf()
