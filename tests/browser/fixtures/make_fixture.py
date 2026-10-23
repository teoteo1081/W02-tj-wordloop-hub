"""Sinh fixture TỔNG HỢP, xác định, cho cycle trình duyệt A0 (TEST §12).

Không đọc data/starter.json và không chứa nội dung thư viện thật: từ vựng, bài đọc,
hồ sơ đều là chuỗi bịa để kiểm hành vi. Chạy lại phải cho đúng byte cũ
(`python -I tests/browser/fixtures/make_fixture.py --check`).

Ghi ra:
  synthetic-starter.json   dạng data/starter.json (Local mode) và nguồn cho bảng giả của Cloud mode
  profiles.json            hồ sơ giả (id là chuỗi bịa; riêng host dùng id hằng số HOST_PROFILE_ID
                           của game.js vì game khoá host theo id đó — chỉ là chuỗi trong dữ liệu giả)
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SEP = "\n<<<TJWL_META>>>\n"          # = Context.META_SEP
HOST_ID = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf"   # = HOST_PROFILE_ID/LOCAL_DEFAULT_ID trong mã app
PLAYER_ID = "00000000-0000-4000-8000-0000000000a2"
VERSION = "synthetic-a0-browser-01"

# (term, pos, ipa, level, def_en, meaning_vi)
B1 = [
    ("anchor", "n", "/ˈæŋkər/", "B1", "a heavy object that keeps a ship in place", "cái neo"),
    ("bridge", "n", "/brɪdʒ/", "A2", "a structure carrying a road over water", "cây cầu"),
    ("candle", "n", "/ˈkændl/", "A2", "a stick of wax that burns to give light", "cây nến"),
    ("harbor", "n", "/ˈhɑːrbər/", "B1", "a sheltered place where ships stay", "bến cảng"),
    ("ladder", "n", "/ˈlædər/", "A2", "steps used to climb up or down", "cái thang"),
    ("meadow", "n", "/ˈmedoʊ/", "B1", "a field of grass and wild flowers", "đồng cỏ"),
    ("orchard", "n", "/ˈɔːrtʃərd/", "B2", "a garden where fruit trees grow", "vườn cây ăn quả"),
    ("pebble", "n", "/ˈpebl/", "B2", "a small smooth stone", "viên sỏi"),
    ("quarry", "n", "/ˈkwɔːri/", "C1", "a place where stone is cut from the ground", "mỏ đá"),
    ("village", "n", "/ˈvɪlɪdʒ/", "A2", "a small group of houses in the country", "ngôi làng"),
]
B2 = [
    ("blanket", "n", "/ˈblæŋkɪt/", "A2", "a warm cover for a bed", "cái chăn"),
    ("compass", "n", "/ˈkʌmpəs/", "B1", "a tool that shows direction", "la bàn"),
    ("lantern", "n", "/ˈlæntərn/", "B1", "a lamp with a protective case", "đèn lồng"),
    ("shelter", "n", "/ˈʃeltər/", "B1", "a place that protects from weather", "nơi trú ẩn"),
    ("rope", "n", "/roʊp/", "A2", "thick strong cord", "sợi dây thừng"),
    ("canteen", "n", "/kænˈtiːn/", "C1", "a small container for water", "bình nước"),
    ("trail", "n", "/treɪl/", "B1", "a path through the countryside", "lối mòn"),
    ("summit", "n", "/ˈsʌmɪt/", "B2", "the highest point of a mountain", "đỉnh núi"),
    ("ration", "n", "/ˈræʃn/", "C1", "a fixed amount of food", "khẩu phần"),
    ("flare", "n", "/fler/", "C1", "a bright light used as a signal", "pháo sáng"),
]
# Block 3: ca biên có chủ ý (hoa/thường, dấu câu thừa, trùng với Block 1) — để kiểm đếm trùng/Reader
B3 = [
    ("Harbor", "n", "/ˈhɑːrbər/", "B1", "a sheltered place where ships stay", "bến cảng"),
    ("anchor,", "n", "/ˈæŋkər/", "B1", "a heavy object that keeps a ship in place", "cái neo"),
    ("cabinet", "n", "/ˈkæbɪnət/", "B2", "a cupboard with shelves or drawers", "tủ có ngăn"),
    ("exhilarating", "adj", "/ɪɡˈzɪləreɪtɪŋ/", "C1", "making you feel very happy and excited", "phấn khích"),
    ("immense", "adj", "/ɪˈmens/", "B2", "extremely large", "to lớn"),
    ("glimpse", "n", "/ɡlɪmps/", "B2", "a very brief look", "cái nhìn thoáng qua"),
    ("fragile", "adj", "/ˈfrædʒl/", "B2", "easily broken", "dễ vỡ"),
    ("gather", "v", "/ˈɡæðər/", "A2", "to come or bring together", "tập hợp"),
    ("steady", "adj", "/ˈstedi/", "B1", "firm and not shaking", "vững vàng"),
    ("whisper", "v", "/ˈwɪspər/", "B1", "to speak very quietly", "thì thầm"),
]
B4 = [
    ("agenda", "n", "/əˈdʒendə/", "B2", "a list of items to discuss", "chương trình họp"),
    ("deadline", "n", "/ˈdedlaɪn/", "B1", "the latest time to finish something", "hạn chót"),
    ("invoice", "n", "/ˈɪnvɔɪs/", "B2", "a bill for goods or services", "hóa đơn"),
    ("budget", "n", "/ˈbʌdʒɪt/", "B1", "a plan for how to spend money", "ngân sách"),
    ("colleague", "n", "/ˈkɑːliːɡ/", "B1", "a person you work with", "đồng nghiệp"),
    ("estimate", "n", "/ˈestɪmət/", "B2", "a rough guess of a cost", "bản ước tính"),
    ("shipment", "n", "/ˈʃɪpmənt/", "B2", "goods sent together", "lô hàng"),
    ("vendor", "n", "/ˈvendər/", "C1", "a company that sells goods", "nhà cung cấp"),
    ("warranty", "n", "/ˈwɔːrənti/", "C1", "a promise to repair a product", "bảo hành"),
    ("refund", "n", "/ˈriːfʌnd/", "B1", "money given back to a customer", "tiền hoàn lại"),
]

SENT = {  # term -> (câu đã bọc [term], bản dịch nguyên câu)
    "anchor": ("The old ship dropped its [anchor] near the edge of the bay.", "Con tàu cũ thả neo gần rìa vịnh."),
    "bridge": ("A narrow [bridge] connected the dock to the fishing town.", "Một cây cầu hẹp nối bến tàu với thị trấn đánh cá."),
    "candle": ("Every evening someone placed a [candle] in the window of the lighthouse keeper's house.", "Mỗi tối có người đặt một cây nến ở cửa sổ nhà người giữ hải đăng."),
    "harbor": ("The [harbor] was quiet at dawn, and the water looked like glass.", "Bến cảng yên ắng lúc bình minh, mặt nước phẳng như gương."),
    "ladder": ("A worker leaned a wooden [ladder] against the wall to repair the roof.", "Một người thợ dựa chiếc thang gỗ vào tường để sửa mái nhà."),
    "meadow": ("Beyond the road, a wide [meadow] stretched toward the hills.", "Bên kia con đường, một đồng cỏ rộng trải dài về phía đồi."),
    "orchard": ("At the far end grew an [orchard] full of ripe apples.", "Ở tận cuối có một vườn cây đầy táo chín."),
    "pebble": ("A child picked up a smooth [pebble] and threw it into the stream.", "Một đứa trẻ nhặt viên sỏi nhẵn và ném xuống dòng suối."),
    "quarry": ("The stone [quarry] above the valley had been closed for many years.", "Mỏ đá phía trên thung lũng đã đóng cửa nhiều năm."),
    "village": ("Soon the whole [village] gathered in the square to share a simple meal.", "Chẳng bao lâu cả ngôi làng tụ họp ở quảng trường để chia sẻ bữa ăn giản dị."),
}
ORDER = [t[0] for t in B1]


def passage(title, flags, cost=None):
    paras = [ORDER[0:3], ORDER[3:6], ORDER[6:10]]
    marked = "\n\n".join(" ".join(SENT[t][0] for t in p) for p in paras)
    meta = {"title": title, "source": "Bài đọc tổng hợp cho kiểm thử A0",
            "vi": {t: SENT[t][1] for t in ORDER}}
    meta.update(flags)
    if cost is not None:
        meta["cost_usd"] = cost
    return marked + SEP + json.dumps(meta, ensure_ascii=False, separators=(",", ":"))


def build():
    hubs = [{"id": "hub_syn", "code": "SYN", "name": "SYNTHETIC HUB", "sort": 1}]
    notebooks = [
        {"id": "nb_syn_survival", "hub_id": "hub_syn", "name": "SURVIVAL", "icon": "🧭", "sort": 1},
        {"id": "nb_syn_office", "hub_id": "hub_syn", "name": "OFFICE WORDS", "icon": "📎", "sort": 2},
    ]
    sections = [
        {"id": "sec_syn_1", "notebook_id": "nb_syn_survival", "name": "Section A", "sort": 1},
        {"id": "sec_syn_2", "notebook_id": "nb_syn_office", "name": "Section B", "sort": 1},
    ]
    pages = [
        {"id": "pg_syn_1", "section_id": "sec_syn_1", "name": "Page 1", "sort": 1},
        {"id": "pg_syn_2", "section_id": "sec_syn_2", "name": "Page 2", "sort": 1},
    ]
    batches = [
        {"id": "bt_syn_1", "page_id": "pg_syn_1", "name": "Batch 1", "sort": 1, "created_at": 1792000000000},
        {"id": "bt_syn_2", "page_id": "pg_syn_2", "name": "Batch 2", "sort": 1, "created_at": 1792000000000},
    ]
    cands = [
        passage("Dán tổng hợp", {"pasted": True}),
        passage("Claude tổng hợp", {"claude": True}),
        passage("OpenAI tổng hợp", {"ai": True, "provider": "openai", "origin": "openai"}, cost=0.0021),
        passage("Gemini tổng hợp", {"ai": True, "provider": "gemini", "origin": "gemini"}),
    ]
    blocks = [
        {"id": "bl_syn_1", "batch_id": "bt_syn_1", "name": "Block 1", "global_index": 1, "sort": 1,
         "context_passage": passage("Bến cảng buổi sớm", {"claude": True}),
         "context_passage_candidates": cands},
        {"id": "bl_syn_2", "batch_id": "bt_syn_1", "name": "Block 2", "global_index": 2, "sort": 2, "context_passage": ""},
        {"id": "bl_syn_3", "batch_id": "bt_syn_1", "name": "Block 3", "global_index": 3, "sort": 3, "context_passage": ""},
        {"id": "bl_syn_4", "batch_id": "bt_syn_2", "name": "Block 4", "global_index": 4, "sort": 1, "context_passage": ""},
    ]
    words = []
    for bi, rows in enumerate([B1, B2, B3, B4], 1):
        for i, (term, pos, ipa, lvl, den, vi) in enumerate(rows, 1):
            words.append({"id": "w_syn_%d_%02d" % (bi, i), "block_id": "bl_syn_%d" % bi, "sort": i,
                          "term": term, "level": lvl, "pos": pos, "ipa": ipa, "def_en": den, "meaning_vi": vi})
    starter = {"hubs": hubs, "notebooks": notebooks, "sections": sections, "pages": pages, "batches": batches,
               "blocks": blocks, "words": words, "word_progress": [], "block_progress": [], "version": VERSION}
    profiles = [
        {"id": HOST_ID, "display_name": "Host Giả", "avatar_emoji": "🧭", "is_admin": True, "can_edit_passage": True, "lang": "vi"},
        {"id": PLAYER_ID, "display_name": "Người Chơi Giả", "avatar_emoji": "🐣", "is_admin": False, "can_edit_passage": False, "lang": "vi"},
    ]
    return {"synthetic-starter.json": starter, "profiles.json": profiles}


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, indent=1, sort_keys=True) + "\n"


if __name__ == "__main__":
    out = build()
    bad = 0
    for name, obj in out.items():
        path = os.path.join(HERE, name)
        text = dump(obj)
        if "--check" in sys.argv:
            cur = open(path, encoding="utf-8", newline="").read() if os.path.exists(path) else None
            same = cur is not None and cur.replace("\r\n", "\n") == text
            print(("OK   " if same else "DIFF ") + name)
            bad += 0 if same else 1
        else:
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
            print("wrote", name, len(text), "bytes")
    sys.exit(1 if bad else 0)
