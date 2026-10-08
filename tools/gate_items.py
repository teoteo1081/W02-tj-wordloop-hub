#!/usr/bin/env python3
"""Kiểm tra NỘI DUNG bộ câu hỏi (exam='ea' | 'ielts' | 'dm') trước khi nạp vào bảng test_items.

Chạy:  python3 tools/gate_items.py data/exams/dm_cases.json [file khác…]
File là mảng JSON; mỗi phần tử là 1 câu theo cột bảng test_items (tools/toeic_items.sql):
  id (duy nhất, tiền tố ea_/ielts_/dm_) · exam · test · part · num · stem · opts ["(A) …",…] · answer "A".."D"
  tag · explain (tiếng Việt) · passage (tuỳ chọn) · i18n {vi:{tag,explain,stem}, en:{tag,explain}, …} (tuỳ chọn ở bước soạn)
Thoát mã 1 nếu có ❌.
"""
import json, re, sys
from collections import Counter

PREFIX = {"ea": "ea_", "ielts": "ielts_", "dm": "dm_"}
# chỉ các cột CÓ trong bảng test_items (thêm khoá lạ => PostgREST từ chối cả mảng)
ALLOWED = {"id", "exam", "test", "part", "num", "stem", "stem_vi", "opts", "answer", "tag", "explain", "passage", "src", "answer_src", "i18n"}
fails = 0


def bad(where, msg):
    global fails
    fails += 1
    print(f"❌ {where}: {msg}")


def check(path):
    try:
        data = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return bad(path, f"không đọc được JSON ({e})")
    if not isinstance(data, list) or not data:
        return bad(path, "phải là mảng JSON không rỗng")
    ids = Counter(x.get("id") for x in data if isinstance(x, dict))
    keys0 = set(data[0].keys())
    for i, q in enumerate(data):
        w = f"{path}[{i}] {q.get('id') if isinstance(q, dict) else '?'}"
        if not isinstance(q, dict):
            bad(w, "không phải object"); continue
        if set(q.keys()) != keys0:
            bad(w, f"bộ khoá khác câu đầu (PostgREST bắt buộc mọi object cùng khoá): {sorted(set(q) ^ keys0)}")
        extra = set(q) - ALLOWED
        if extra:
            bad(w, f"khoá không có trong bảng test_items: {sorted(extra)} (nhét thêm thông tin vào i18n.meta)")
        for k in ("id", "exam", "test", "part", "num", "stem", "opts", "answer", "tag", "explain"):
            if q.get(k) in (None, "", []):
                bad(w, f"thiếu '{k}'")
        ex = q.get("exam")
        if ex not in PREFIX:
            bad(w, f"exam phải là ea|ielts|dm (không được 'toeic'), đang là {ex!r}")
        elif not str(q.get("id", "")).startswith(PREFIX[ex]):
            bad(w, f"id phải bắt đầu bằng {PREFIX[ex]!r} để không trùng TOEIC")
        if ids[q.get("id")] > 1:
            bad(w, "id bị trùng")
        opts = q.get("opts") or []
        if not (2 <= len(opts) <= 4):
            bad(w, f"opts phải 2–4 đáp án, đang {len(opts)}")
        for j, o in enumerate(opts):
            if not re.match(rf"^\({'ABCD'[j]}\) \S", str(o)):
                bad(w, f"opts[{j}] phải bắt đầu '({'ABCD'[j]}) ' — đang {str(o)[:30]!r}")
        a = q.get("answer")
        if not (isinstance(a, str) and len(a) == 1 and "ABCD".find(a) in range(len(opts))):
            bad(w, f"answer {a!r} không khớp số đáp án")
        if len({re.sub(r'^\([A-D]\)\s*', '', str(o)).strip().lower() for o in opts}) != len(opts):
            bad(w, "có 2 đáp án giống nhau")
        if len(str(q.get("explain", ""))) < 30:
            bad(w, "lời giải quá ngắn (<30 ký tự) — phải nói rõ vì sao đúng/sai")
        if re.search(r"(?i:lorem|xxx)|\bTODO\b|\?\?\?", json.dumps(q, ensure_ascii=False)):  # TODO phân biệt hoa/thường: "todo" tiếng Tây Ban Nha là từ thường
            bad(w, "còn chữ giữ chỗ (lorem/TODO/???/xxx)")
        for tag in (q.get("i18n") or {}):
            if tag not in ("vi", "en", "zh", "es", "meta"):
                bad(w, f"i18n có ngôn ngữ lạ {tag!r}")
    print(f"   {path}: {len(data)} câu, {len({q.get('test') for q in data if isinstance(q, dict)})} đề, các part: {sorted({q.get('part') for q in data if isinstance(q, dict)})}")


for p in sys.argv[1:] or []:
    check(p)
if len(sys.argv) < 2:
    print("Cách dùng: gate_items.py <file.json> …"); sys.exit(2)
print("KẾT QUẢ nội dung:", "ĐẠT ✅" if fails == 0 else f"KHÔNG ĐẠT ❌ ({fails} lỗi)")
sys.exit(1 if fails else 0)
