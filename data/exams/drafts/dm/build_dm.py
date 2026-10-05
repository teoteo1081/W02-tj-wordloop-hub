# -*- coding: utf-8 -*-
import json, random, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from p1_chinh import CHINH
from p1_xam import XAM
from p1_ta import TA
from p3 import P3
from p4 import P4
from p5 import P5

REF = {
 "fb": "Chính sách quảng cáo/cộng đồng của Meta-Facebook (kiểm tra lại bản mới nhất)",
 "tt": "Quy định TikTok / TikTok Shop (kiểm tra lại bản mới nhất)",
 "pin": "Hướng dẫn nội dung Pinterest (kiểm tra lại bản mới nhất)",
 "gg": "Chính sách Google Ads/Tìm kiếm (kiểm tra lại bản mới nhất)",
 "zalo": "Quy định Zalo OA và tin nhắn quảng cáo (kiểm tra lại bản mới nhất)",
 "email": "Quy định về email quảng cáo, dữ liệu cá nhân và cách đo tỉ lệ mở/bấm email (kiểm tra lại bản mới nhất)",
 "shopee": "Chính sách đánh giá của sàn thương mại điện tử (kiểm tra lại bản mới nhất)",
 "sp": "Nguyên tắc minh bạch giá, khuyến mãi, đánh giá (kiểm tra lại bản mới nhất)",
 "law": "Quy định VN về quảng cáo và bảo vệ người tiêu dùng (kiểm tra lại bản mới nhất)",
 "health": "Quy định quảng cáo thực phẩm bảo vệ sức khỏe (kiểm tra lại bản mới nhất)",
 "fin": "Quy định quảng cáo dịch vụ tài chính (kiểm tra lại bản mới nhất)",
}
LVN = {"chinh": "Chính đạo", "xam": "Xám đạo", "ta": "Tà đạo"}
rng = random.Random(20261005)
cases = CHINH[:12] + XAM + TA
rng.shuffle(cases)

out = []
def refs(c): return [REF.get(r, r) for r in c["refs"]]
def mk(part, num, stem, opts, ans, tag, explain, passage, tag_en, en_expl, en_stem, lvl, rf):
    return dict(id=f"dm_p{part}_{num:03d}", exam="dm", test="dm1", part=part, num=num, stem=stem,
        opts=[f"({'ABCD'[i]}) {o}" for i, o in enumerate(opts)], answer="ABCD"[ans], tag=tag,
        explain=explain, passage=passage, answer_src="claude",
        i18n={"vi": {"tag": tag, "explain": explain, "stem": stem},
              "en": {"tag": tag_en, "explain": en_expl, "stem": en_stem},
              "meta": {"level": lvl, "refs": rf}})

# P1
for i, c in enumerate(cases, 1):
    opts = [f"{LVN['chinh']} — {c['r'][0]}", f"{LVN['xam']} — {c['r'][1]}", f"{LVN['ta']} — {c['r'][2]}"]
    ans = {"chinh": 0, "xam": 1, "ta": 2}[c["lvl"]]
    out.append(mk(1, i, "Theo 4 câu kiểm tra (Sự thật · Minh bạch · Tự nguyện · Hậu quả), tình huống này thuộc loại nào?",
        opts, ans, c["tag"], c["explain"], c["passage"], c["tag_en"], c["en"],
        "Using the four checks (truth, transparency, free choice, consequences), which category is this?", c["lvl"], refs(c)))
# P2
for i, c in enumerate(cases, 1):
    pos = (i - 1) % 4
    wrongs = list(c["d"]); opts = wrongs[:]; opts.insert(pos, c["c2"])
    exp = f"Chiêu chính ở đây là “{c['tag']}”. {c['hook']} " + c["explain"]
    out.append(mk(2, i, "Chiêu hoặc kỹ thuật chính trong tình huống trên là gì?", opts, pos, c["tag"], exp,
        c["passage"], c["tag_en"], c["en"], "What is the main technique in the situation above?", c["lvl"], refs(c)))
# P3, P4, P5 chung
def multi(part, items, posf, stem_en, stem_fn=None):
    for i, c in enumerate(items, 1):
        pos = posf(i - 1)
        opts = list(c["bad"]); opts.insert(pos, c["ok"])
        stem = c["stem"]
        out.append(mk(part, i, stem, opts, pos, c["tag"], c["explain"], c["passage"], c["tag_en"], c["en"],
            stem_en(i) if callable(stem_en) else stem_en, c["lvl"], refs(c)))
multi(3, P3, lambda k: (k + 1) % 4, "How should you reply?")
multi(4, P4, lambda k: [0, 1, 2, 3, 1, 0, 3, 2][k], lambda i: f"Step {(i-1)%4+1}/4: which decision is right?")
multi(5, P5, lambda k: (k * 3 + 1) % 4, "Which conclusion and verification method is correct?")

dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dm_items.json")
json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(out), Counter(o["part"] for o in out))
for p in range(1, 6):
    print(p, dict(Counter(o["answer"] for o in out if o["part"] == p)), dict(Counter(o["i18n"]["meta"]["level"] for o in out if o["part"] == p)))
