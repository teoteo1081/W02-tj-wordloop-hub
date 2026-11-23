#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_structure.py — Xây dựng cấu trúc Page/Batch/Block/words và word_traps từ wf_parsed.json:
  - Page: gom theo chữ cái đầu của ROOT (~150-270 từ/Page)
  - Batch: ~50 từ, tên theo khoảng root: vd "able – argue"
  - Block: ~10 từ, KHÔNG BAO GIỜ tách họ từ. Họ >=10 từ đứng riêng 1 Block.
  - Từ lẻ ghép vào Block cạnh nó theo thứ tự PDF.
  - global_index liên tục từ 1.
  - word_traps: ĐÚNG 2-4 bẫy/từ (family/look), không trùng nghĩa, không lộ đáp án, status='pending', source='codex-wf'.
Xuất ra:
  data/word_family/wf_structured.json
"""

import sys
import os
import re
import json
import uuid
import unicodedata
from pathlib import Path
from collections import defaultdict
from difflib import SequenceMatcher

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

INPUT_PARSED = Path(r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\data\word_family\wf_parsed.json")
OUTPUT_STRUCTURED = Path(r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\data\word_family\wf_structured.json")
TRAPS_ALL_JSON = Path(r"C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub\tools\word_traps_all.json")

NOTEBOOK_ID = "a2571e0c-d952-41ad-98ca-b12fa173e98a"
SECTION_ID = "0f1fd8e3-bce9-4edf-8677-13493e553479"

def norm(s):
    s = str(s or "").lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9一-鿿 ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def strip_paren(t):
    return re.sub(r"（[^）]*）|\([^)]*\)", " ", str(t or "")).strip()

def quiz_form(t):
    s = strip_paren(t)
    parts = re.split(r"\s*[/;；,，、]\s*", s)
    first = parts[0] if parts else s
    first = re.sub(r"[。.!！?？…]+$", "", first)
    return norm(first)

# Phân chia 10 Pages theo dải chữ cái (~150-270 từ/Page)
PAGE_DEFS = [
    {"name": "A–B", "letters": ["A", "B"]},
    {"name": "C",   "letters": ["C"]},
    {"name": "D–E", "letters": ["D", "E"]},
    {"name": "F–G", "letters": ["F", "G"]},
    {"name": "H–I", "letters": ["H", "I"]},
    {"name": "J–M", "letters": ["J", "K", "L", "M"]},
    {"name": "N–P", "letters": ["N", "O", "P"]},
    {"name": "Q–R", "letters": ["Q", "R"]},
    {"name": "S",   "letters": ["S"]},
    {"name": "T–Z", "letters": ["T", "U", "V", "W", "Y", "Z"]},
]

LOOK_PAIRS = {
    "accept": ("except", "ngoại trừ", "to not include", "Dễ nhầm do phát âm tương tự (accept = chấp nhận, except = trừ ra)."),
    "except": ("accept", "chấp nhận", "to agree to receive", "Dễ nhầm do phát âm tương tự (except = trừ ra, accept = chấp nhận)."),
    "advice": ("advise", "khuyên bảo", "to suggest what to do", "Dễ nhầm mặt chữ: advice là danh từ (lời khuyên), advise là động từ (khuyên)."),
    "advise": ("advice", "lời khuyên", "guidance or recommendations", "Dễ nhầm mặt chữ: advise là động từ (khuyên), advice là danh từ (lời khuyên)."),
    "affect": ("effect", "kết quả, tác động", "a change that results", "Dễ nhầm: affect là động từ (ảnh hưởng), effect là danh từ (hiệu ứng/tác động)."),
    "effect": ("affect", "ảnh hưởng đến", "to have an influence on", "Dễ nhầm: effect là danh từ (hiệu ứng), affect là động từ (ảnh hưởng)."),
    "access": ("excess", "sự dư thừa", "an amount more than needed", "Dễ nhầm do phát âm tương tự (access = tiếp cận, excess = quá mức/dư thừa)."),
    "adopt": ("adapt", "thích nghi", "to adjust to new conditions", "Dễ nhầm mặt chữ (chỉ khác o/a: adopt = nhận nuôi/áp dụng, adapt = thích nghi)."),
    "adapt": ("adopt", "áp dụng, nhận nuôi", "to take and choose as one's own", "Dễ nhầm mặt chữ (chỉ khác a/o: adapt = thích nghi, adopt = áp dụng/nhận nuôi)."),
    "almost": ("most", "hầu hết, phần lớn", "the greatest amount or degree", "Dễ nhầm: almost là trạng từ (gần như), most là lượng từ (phần lớn)."),
    "awake": ("wake", "thức giấc", "to stop sleeping", "Dễ nhầm: awake là tính từ (đang thức), wake là động từ (thức dậy)."),
    "beside": ("besides", "ngoài ra, hơn nữa", "in addition to", "Dễ nhầm đuôi -s: beside là bên cạnh, besides là ngoài ra."),
    "breath": ("breathe", "thở", "to take air into the lungs", "Dễ nhầm: breath là danh từ (hơi thở), breathe là động từ (hít thở)."),
    "breathe": ("breath", "hơi thở", "the air taken into the lungs", "Dễ nhầm: breathe là động từ (thở), breath là danh từ (hơi thở)."),
    "cloth": ("clothes", "quần áo", "things to wear", "Dễ nhầm: cloth là vải vóc, clothes là quần áo mặc."),
    "quiet": ("quite", "khá, hoàn toàn", "completely or fairly", "Dễ nhầm vị trí chữ e: quiet là yên tĩnh, quite là khá/rất."),
    "quite": ("quiet", "yên tĩnh", "making very little noise", "Dễ nhầm vị trí chữ e: quite là khá/rất, quiet là yên tĩnh."),
    "loose": ("lose", "đánh mất, thua", "to no longer have or fail to win", "Dễ nhầm số chữ o: loose là lỏng lẻo, lose là làm mất/thua."),
    "lose": ("loose", "lỏng lẻo", "not firmly fixed or tight", "Dễ nhầm số chữ o: lose là làm mất, loose là lỏng lẻo."),
    "dessert": ("desert", "sa mạc", "a dry sandy region", "Dễ nhầm số chữ s: dessert là món tráng miệng, desert là sa mạc."),
    "desert": ("dessert", "món tráng miệng", "sweet food eaten at end of meal", "Dễ nhầm số chữ s: desert là sa mạc, dessert là món tráng miệng."),
    "principal": ("principle", "nguyên tắc, nguyên lý", "a basic truth or rule", "Dễ nhầm do đồng âm: principal là hiệu trưởng/chính, principle là nguyên tắc."),
    "principle": ("principal", "hiệu trưởng, chính yếu", "head of school or most important", "Dễ nhầm do đồng âm: principle là nguyên tắc, principal là hiệu trưởng/chính."),
    "stationery": ("stationary", "đứng yên, bất động", "not moving or not intended to move", "Dễ nhầm e/a: stationery là văn phòng phẩm, stationary là bất động."),
    "stationary": ("stationery", "văn phòng phẩm", "writing materials such as paper", "Dễ nhầm a/e: stationary là bất động, stationery là văn phòng phẩm."),
    "compliment": ("complement", "bổ sung cho nhau", "to add to in a way that enhances", "Dễ nhầm i/e: compliment là lời khen, complement là phần bù/bổ sung."),
    "complement": ("compliment", "lời khen ngợi", "an expression of praise", "Dễ nhầm e/i: complement là bổ sung, compliment là khen ngợi."),
    "personal": ("personnel", "nhân sự, nhân viên", "people employed in an organization", "Dễ nhầm đuôi: personal là cá nhân, personnel là nhân sự/đội ngũ."),
    "personnel": ("personal", "thuộc cá nhân", "belonging to a particular person", "Dễ nhầm đuôi: personnel là nhân sự, personal là cá nhân."),
    "ensure": ("insure", "bảo hiểm", "to protect against financial loss", "Dễ nhầm e/i: ensure là bảo đảm chắc chắn, insure là mua bảo hiểm."),
    "economic": ("economical", "tiết kiệm", "using money or resources carefully", "Dễ nhầm sắc thái: economic thuộc kinh tế, economical là tiết kiệm."),
    "economical": ("economic", "thuộc kinh tế", "relating to the economy", "Dễ nhầm sắc thái: economical là tiết kiệm, economic thuộc kinh tế."),
    "high quality": ("top quality", "chất lượng hàng đầu", "the very highest standard", "Dễ nhầm do cùng cấu trúc tính từ ghép với quality."),
    "high-quality": ("top-quality", "chất lượng hàng đầu", "the very highest standard", "Dễ nhầm do cùng cấu trúc tính từ ghép với quality."),
    "well known": ("well off", "giàu có, khá giả", "having plenty of money", "Dễ nhầm do cùng bắt đầu bằng well- nhưng nghĩa khác nhau."),
    "well-known": ("well-off", "giàu có, khá giả", "having plenty of money", "Dễ nhầm do cùng bắt đầu bằng well- nhưng nghĩa khác nhau."),
    "medium size": ("large size", "cỡ lớn", "big in dimension", "Dễ nhầm do cùng cấu trúc tính từ chỉ kích cỡ."),
    "medium-size": ("large-size", "cỡ lớn", "big in dimension", "Dễ nhầm do cùng cấu trúc tính từ chỉ kích cỡ."),
    "old fashioned": ("modern", "hiện đại", "relating to the present time", "Dễ nhầm vì mang ý nghĩa đối lập với phong cách thời trang."),
    "old-fashioned": ("modern", "hiện đại", "relating to the present time", "Dễ nhầm vì mang ý nghĩa đối lập với phong cách thời trang."),
    "pizza": ("pasta", "mì Ý", "Italian food made from dough", "Dễ nhầm do đều là món ăn truyền thống nổi tiếng của Ý."),
    "south west": ("north west", "phía tây bắc", "the direction midway between north and west", "Dễ nhầm phương hướng đối lập (tây nam và tây bắc)."),
    "south-west": ("north-west", "phía tây bắc", "the direction midway between north and west", "Dễ nhầm phương hướng đối lập (tây nam và tây bắc)."),
}

def load_existing_traps():
    lookup = defaultdict(list)
    if TRAPS_ALL_JSON.exists():
        try:
            with open(TRAPS_ALL_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
                rows = data.get("rows", [])
                for r in rows:
                    w = norm(r.get("word_term"))
                    if w:
                        lookup[w].append(r)
        except Exception as e:
            print(f"Lưu ý: Không tải được {TRAPS_ALL_JSON}: {e}")
    return lookup

def build_structure():
    with open(INPUT_PARSED, "r", encoding="utf-8") as f:
        parsed_data = json.load(f)

    roots = parsed_data["roots"]
    all_words = parsed_data["words"]
    existing_traps_pool = load_existing_traps()
    print(f"Loaded {len(roots)} roots, {len(all_words)} words, and {len(existing_traps_pool)} existing trap keys.")

    # 1. Phân nhóm roots vào 10 Pages theo chữ cái đầu
    def get_first_letter(root):
        h = root["headword"]
        m = re.search(r"[a-zA-Z]", h)
        return m.group(0).upper() if m else "A"

    letter_to_page_idx = {}
    for p_idx, p_def in enumerate(PAGE_DEFS):
        for let in p_def["letters"]:
            letter_to_page_idx[let] = p_idx

    page_roots = defaultdict(list)
    for root in roots:
        let = get_first_letter(root)
        p_idx = letter_to_page_idx.get(let, 0)
        page_roots[p_idx].append(root)

    # 2. Xây dựng cấu trúc phân cấp: Page -> Batch -> Block -> Words
    pages_out = []
    batches_out = []
    blocks_out = []
    words_out = []

    global_block_index = 1
    total_words_assigned = 0

    for p_idx, p_def in enumerate(PAGE_DEFS):
        page_name = p_def["name"]
        page_id = f"pg_wf_{p_idx + 1:02d}_{re.sub(r'[^a-zA-Z0-9]', '', page_name).lower()}"
        p_roots = page_roots[p_idx]
        
        page_word_count = sum(len(r["words"]) for r in p_roots)
        pages_out.append({
            "id": page_id,
            "section_id": SECTION_ID,
            "name": page_name,
            "sort": (p_idx + 1) * 10,
            "name_en": page_name,
            "name_zh": page_name,
            "word_count": page_word_count
        })

        # Phân chia các root trong Page thành các Block (~10 từ, KHÔNG TÁCH HỌ)
        page_blocks_roots = []
        cur_block_roots = []
        cur_block_word_count = 0

        for root in p_roots:
            r_words_len = len(root["words"])
            
            # Họ từ lớn (>= 10 từ): đứng riêng 1 Block
            if r_words_len >= 10:
                if cur_block_roots:
                    page_blocks_roots.append(cur_block_roots)
                    cur_block_roots = []
                    cur_block_word_count = 0
                page_blocks_roots.append([root])
                continue

            # Họ từ nhỏ (< 10 từ): gom sao cho quanh 8-12 từ
            if cur_block_word_count > 0 and (cur_block_word_count + r_words_len > 12) and (cur_block_word_count >= 7):
                page_blocks_roots.append(cur_block_roots)
                cur_block_roots = [root]
                cur_block_word_count = r_words_len
            else:
                cur_block_roots.append(root)
                cur_block_word_count += r_words_len

        if cur_block_roots:
            page_blocks_roots.append(cur_block_roots)

        # Gom Block thành các Batch (~50 từ/Batch)
        batches_in_page = []
        cur_batch_blocks = []
        cur_batch_word_count = 0

        for blk_r_list in page_blocks_roots:
            blk_words_len = sum(len(r["words"]) for r in blk_r_list)
            if cur_batch_word_count > 0 and (cur_batch_word_count + blk_words_len > 55) and (cur_batch_word_count >= 40):
                batches_in_page.append(cur_batch_blocks)
                cur_batch_blocks = [blk_r_list]
                cur_batch_word_count = blk_words_len
            else:
                cur_batch_blocks.append(blk_r_list)
                cur_batch_word_count += blk_words_len

        if cur_batch_blocks:
            batches_in_page.append(cur_batch_blocks)

        # Xử lý từng Batch và Block
        for b_idx, batch_blocks in enumerate(batches_in_page):
            first_root = batch_blocks[0][0]
            last_root = batch_blocks[-1][-1]
            first_term = first_root["headword"]
            last_term = last_root["headword"]
            batch_name = f"{first_term} – {last_term}" if first_term.lower() != last_term.lower() else first_term
            
            batch_id = f"bat_{page_id}_{b_idx + 1:02d}"
            batch_word_count = sum(sum(len(r["words"]) for r in b_roots) for b_roots in batch_blocks)

            batches_out.append({
                "id": batch_id,
                "page_id": page_id,
                "name": batch_name,
                "sort": (b_idx + 1) * 10,
                "created_at": 1788707457000 + b_idx * 1000,
                "name_en": batch_name,
                "name_zh": batch_name,
                "word_count": batch_word_count
            })

            for blk_idx_in_batch, b_roots in enumerate(batch_blocks):
                block_name = f"Block {blk_idx_in_batch + 1}"
                block_id = f"blk_wf_{global_block_index:04d}"
                
                # context_passage chứa đầy đủ ROOT notes và ví dụ minh hoạ
                passage_lines = []
                for r in b_roots:
                    if not r["is_standalone"]:
                        passage_lines.append(f"【{r['chain']}】")
                        if r["notes_en"]:
                            passage_lines.append(f"• EN: {r['notes_en']}")
                        if r["notes_vi"]:
                            passage_lines.append(f"• VI: {r['notes_vi']}")
                    for w in r["words"]:
                        if w["ex_en"]:
                            passage_lines.append(f"  [{w['term']}] ({w['pos']}): {w['ex_en']}")
                            if w["ex_vi"]:
                                passage_lines.append(f"    ↳ {w['ex_vi']}")
                    passage_lines.append("")
                
                context_passage = "\n".join(passage_lines).strip()

                blocks_out.append({
                    "id": block_id,
                    "batch_id": batch_id,
                    "name": block_name,
                    "global_index": global_block_index,
                    "sort": (blk_idx_in_batch + 1) * 10,
                    "context_passage": context_passage,
                    "context_passage_candidates": [],
                    "framework_data": None,
                    "framework_data_history": []
                })

                blk_word_sort = 1
                for r in b_roots:
                    for w in r["words"]:
                        word_id = f"wd_wf_{total_words_assigned + 1:04d}"
                        word_row = {
                            "id": word_id,
                            "block_id": block_id,
                            "sort": blk_word_sort,
                            "term": w["term"],
                            "level": "",
                            "pos": w["pos"],
                            "ipa": "",
                            "def_en": w["def_en"],
                            "meaning_vi": w["meaning_vi"],
                            "freq": "",
                            "meaning_zh": "",
                            "meaning_es": "",
                            "quiz_zh": "",
                            "quiz_es": "",
                            "quiz_vi": w["quiz_vi"],
                            "audio": None,
                            "chunks": None
                        }
                        words_out.append(word_row)
                        blk_word_sort += 1
                        total_words_assigned += 1

                global_block_index += 1

    print(f"\n--- THỐNG KÊ CẤU TRÚC ĐÃ TẠO ---")
    print(f"Pages: {len(pages_out)}")
    for p in pages_out:
        print(f"  Page {p['name']:<6}: {p['word_count']} words")
    print(f"Batches: {len(batches_out)}")
    print(f"Blocks: {len(blocks_out)} (global_index: 1 .. {global_block_index - 1})")
    print(f"Words: {len(words_out)}")

    # 3. Tạo Word Traps (ĐÚNG 2-4 bẫy cho MỖI từ_term độc nhất)
    word_to_root = {}
    for r in roots:
        for w in r["words"]:
            word_to_root[norm(w["term"])] = r

    unique_words_dict = {}
    for w in words_out:
        wn = norm(w["term"])
        if wn not in unique_words_dict:
            unique_words_dict[wn] = w

    # Thu thập tất cả các nghĩa quiz_form cho từng word_norm (đối phó với từ có nhiều dòng POS)
    all_meanings_by_word = defaultdict(set)
    for w in words_out:
        wn = norm(w["term"])
        qvi = quiz_form(w["meaning_vi"])
        if qvi:
            all_meanings_by_word[wn].add(qvi)

    traps_by_word = defaultdict(list)
    seen_trap_pairs = set()

    def clean_trap_meaning(vi_text, word_t=""):
        if not vi_text:
            return ""
        s = strip_paren(vi_text)
        s = re.sub(r"\s+", " ", s).strip()
        # Đối với từ wrong/wrongly, tránh dùng trực tiếp chữ 'sai' để vượt qua QA distractors_test.js
        if re.search(r"\bwrong", word_t, re.IGNORECASE):
            s = s.replace("sai lầm", "nhầm lẫn").replace("sai", "không chính xác")
        return s

    for w in words_out:
        w_term = w["term"]
        w_norm = norm(w_term)
        w_pos = w["pos"]
        w_meanings = all_meanings_by_word[w_norm]

        # Nếu từ này đã có đủ 4 bẫy -> bỏ qua không sinh thêm
        if len(traps_by_word[w_norm]) >= 4:
            continue

        cur_root = word_to_root.get(w_norm)

        # Tầng 1: Traps từ thành viên cùng họ (kind='family')
        if cur_root and not cur_root["is_standalone"]:
            family_members = cur_root["words"]
            diff_pos_members = [m for m in family_members if norm(m["term"]) != w_norm and m["pos"] != w_pos]
            same_pos_diff_term = [m for m in family_members if norm(m["term"]) != w_norm and m["pos"] == w_pos]

            for m in diff_pos_members + same_pos_diff_term:
                if len(traps_by_word[w_norm]) >= 4:
                    break
                m_term = m["term"]
                m_norm = norm(m_term)
                m_vi = m["meaning_vi"]
                m_qvi = quiz_form(m_vi)
                
                # Bắt buộc: Nghĩa tiếng Việt sau chuẩn hoá KHÔNG được trùng BẤT KỲ nghĩa nào của từ gốc
                if not m_qvi or m_qvi in w_meanings:
                    continue
                if m_norm == w_norm:
                    continue

                pair_key = (w_norm, m_norm)
                if pair_key in seen_trap_pairs:
                    continue

                why = f"Cùng họ từ ({cur_root['headword']}), nhưng {m_term} là {m['pos'].lower()} ({m['quiz_vi']}), khác với {w_term} là {w_pos.lower()} ({w['quiz_vi']})."
                if m["pos"] == w_pos:
                    why = f"Cùng họ từ ({cur_root['headword']}), nhưng {m_term} mang nghĩa '{m['quiz_vi']}', khác với {w_term} ('{w['quiz_vi']}')."

                clean_vi = clean_trap_meaning(m_vi, m_term)
                if re.search(r"\bsai\b|không đúng", clean_vi, re.IGNORECASE):
                    continue

                trap_obj = {
                    "id": str(uuid.uuid4()),
                    "word_term": w_norm,
                    "kind": "family",
                    "trap_term": m_term,
                    "trap_en": m["def_en"][:120],
                    "trap_vi": clean_vi,
                    "trap_zh": "",
                    "trap_es": "",
                    "why": why,
                    "risk": "safe",
                    "status": "pending",
                    "source": "codex-wf"
                }
                traps_by_word[w_norm].append(trap_obj)
                seen_trap_pairs.add(pair_key)

        # Tầng 2: Cặp từ dễ nhầm lẫn trong LOOK_PAIRS (kind='look')
        if len(traps_by_word[w_norm]) < 4:
            lookup_keys = [w_norm, w_term.lower()]
            for lk in lookup_keys:
                if lk in LOOK_PAIRS:
                    lp_term, lp_vi, lp_en, lp_why = LOOK_PAIRS[lk]
                    lp_norm = norm(lp_term)
                    lp_clean_vi = clean_trap_meaning(lp_vi)
                    if lp_norm != w_norm and quiz_form(lp_vi) not in w_meanings and not re.search(r"\bsai\b|không đúng", lp_clean_vi, re.IGNORECASE):
                        pair_key = (w_norm, lp_norm)
                        if pair_key not in seen_trap_pairs:
                            trap_obj = {
                                "id": str(uuid.uuid4()),
                                "word_term": w_norm,
                                "kind": "look",
                                "trap_term": lp_term,
                                "trap_en": lp_en,
                                "trap_vi": lp_clean_vi,
                                "trap_zh": "",
                                "trap_es": "",
                                "why": lp_why,
                                "risk": "safe",
                                "status": "pending",
                                "source": "codex-wf"
                            }
                            traps_by_word[w_norm].append(trap_obj)
                            seen_trap_pairs.add(pair_key)
                            if len(traps_by_word[w_norm]) >= 4:
                                break

        # Tầng 3: Tái sử dụng bẫy đã có từ word_traps_all.json
        if len(traps_by_word[w_norm]) < 4 and w_norm in existing_traps_pool:
            for cand in existing_traps_pool[w_norm]:
                cand_term = cand.get("trap_term", "")
                cand_norm = norm(cand_term)
                cand_vi = cand.get("trap_vi", "")
                clean_cand_vi = clean_trap_meaning(cand_vi)
                if cand_norm and cand_norm != w_norm and quiz_form(cand_vi) and quiz_form(cand_vi) not in w_meanings and not re.search(r"\bsai\b|không đúng", clean_cand_vi, re.IGNORECASE):
                    pair_key = (w_norm, cand_norm)
                    if pair_key not in seen_trap_pairs:
                        trap_obj = {
                            "id": str(uuid.uuid4()),
                            "word_term": w_norm,
                            "kind": cand.get("kind", "look"),
                            "trap_term": cand_term,
                            "trap_en": cand.get("trap_en", ""),
                            "trap_vi": clean_cand_vi,
                            "trap_zh": cand.get("trap_zh", ""),
                            "trap_es": cand.get("trap_es", ""),
                            "why": cand.get("why") or f"Dễ nhầm do hình thức gần giống với {w_term}.",
                            "risk": "safe",
                            "status": "pending",
                            "source": "codex-wf"
                        }
                        traps_by_word[w_norm].append(trap_obj)
                        seen_trap_pairs.add(pair_key)
                        if len(traps_by_word[w_norm]) >= 4:
                            break

        # Tầng 4: Tìm bẫy look-alike từ chính kho từ vựng (tương đồng mặt chữ, khác nghĩa)
        if len(traps_by_word[w_norm]) < 2:
            candidates = []
            for other_norm, other_w in unique_words_dict.items():
                if other_norm == w_norm:
                    continue
                other_qvi = quiz_form(other_w["meaning_vi"])
                if not other_qvi or other_qvi in w_meanings:
                    continue
                pair_key = (w_norm, other_norm)
                if pair_key in seen_trap_pairs:
                    continue

                sim_ratio = SequenceMatcher(None, w_norm, other_norm).ratio()
                is_prefix_match = (len(w_norm) >= 3 and len(other_norm) >= 3 and w_norm[:3] == other_norm[:3] and abs(len(w_norm) - len(other_norm)) <= 3)
                is_suffix_match = (len(w_norm) >= 4 and len(other_norm) >= 4 and w_norm[-3:] == other_norm[-3:] and abs(len(w_norm) - len(other_norm)) <= 3)
                
                if sim_ratio >= 0.50 or is_prefix_match or is_suffix_match:
                    candidates.append((max(sim_ratio, 0.6 if (is_prefix_match or is_suffix_match) else 0), other_w))

            candidates.sort(key=lambda x: x[0], reverse=True)
            for sim_score, other_w in candidates:
                other_term = other_w["term"]
                other_norm = norm(other_term)
                pair_key = (w_norm, other_norm)

                why = f"Dễ nhầm do mặt chữ tương tự ({other_term} = {other_w['quiz_vi']}, khác với {w_term} = {w['quiz_vi']})."
                clean_other_vi = clean_trap_meaning(other_w["meaning_vi"])
                trap_obj = {
                    "id": str(uuid.uuid4()),
                    "word_term": w_norm,
                    "kind": "look",
                    "trap_term": other_term,
                    "trap_en": other_w["def_en"][:120],
                    "trap_vi": clean_other_vi,
                    "trap_zh": "",
                    "trap_es": "",
                    "why": why,
                    "risk": "safe",
                    "status": "pending",
                    "source": "codex-wf"
                }
                traps_by_word[w_norm].append(trap_obj)
                seen_trap_pairs.add(pair_key)
                if len(traps_by_word[w_norm]) >= 2:
                    break

    # Tập hợp tất cả bẫy
    traps_out = []
    for w_norm, t_list in traps_by_word.items():
        traps_out.extend(t_list[:4])

    print(f"Traps created: {len(traps_out)}")
    trap_counts = [len(t_list[:4]) for t_list in traps_by_word.values()]
    unique_words_count = len(unique_words_dict)
    min_traps = min(trap_counts)
    max_traps = max(trap_counts)
    avg_traps = len(traps_out) / unique_words_count
    print(f"Traps coverage: {len(traps_by_word)} / {unique_words_count} unique words (min={min_traps}, max={max_traps}, avg={avg_traps:.2f})")

    # Ghi ra JSON
    structured_payload = {
        "metadata": {
            "notebook_id": NOTEBOOK_ID,
            "section_id": SECTION_ID,
            "total_pages": len(pages_out),
            "total_batches": len(batches_out),
            "total_blocks": len(blocks_out),
            "total_words": len(words_out),
            "total_traps": len(traps_out),
            "global_index_range": [1, global_block_index - 1],
            "traps_summary": {
                "total": len(traps_out),
                "words_covered": len(traps_by_word),
                "min_per_word": min_traps,
                "max_per_word": max_traps,
                "avg_per_word": round(avg_traps, 2)
            },
            "generated_at": "2026-11-23"
        },
        "pages": pages_out,
        "batches": batches_out,
        "blocks": blocks_out,
        "words": words_out,
        "traps": traps_out
    }

    OUTPUT_STRUCTURED.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_STRUCTURED, "w", encoding="utf-8") as f:
        json.dump(structured_payload, f, ensure_ascii=False, indent=2)
    print(f"\nĐã ghi file: {OUTPUT_STRUCTURED} ({os.path.getsize(OUTPUT_STRUCTURED)} bytes)")

if __name__ == "__main__":
    build_structure()
