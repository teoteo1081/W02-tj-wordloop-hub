"""Sinh tools/dm_hub_seed.sql từ tools/dm_hub_data.py.
CHẠY: python3 tools/dm_hub_gen.py  -> dán file .sql vào Supabase SQL Editor -> Run.
Chạy lại nhiều lần vẫn an toàn (on conflict do update, không nhân đôi, không đẩy Hub thêm lần nữa)."""
import os, re
from dm_hub_data import MODULES

HUB, NB = "hub_digital_marketing", "nb_dm_l02"
q = lambda s: "'" + str(s).replace("'", "''") + "'"
def short(vi): return re.sub(r"\s*\(.*?\)", "", vi).strip()

out = ["-- Hub 📈 DIGITAL MARKETING (khoá L02, 11 module × 10 từ) — SINH TỰ ĐỘNG bởi tools/dm_hub_gen.py, đừng sửa tay.",
       "-- Đặt Hub ngay SAU Hub EA2025 (id hub_ea2025); không thấy EA thì đặt cuối.",
       "begin;",
       "do $$ declare ea int; begin",
       f"  if exists (select 1 from hubs where id = {q(HUB)}) then return; end if;",
       "  select sort into ea from hubs where id = 'hub_ea2025';",
       "  if ea is null then select coalesce(max(sort), 0) into ea from hubs; raise notice 'Không thấy Hub EA -> đặt cuối'; end if;",
       "  update hubs set sort = sort + 1 where sort > ea;",
       f"  insert into hubs (id, code, name, sort, name_en, name_zh) values ({q(HUB)}, 'DIGITAL_MARKETING', '📈 DIGITAL MARKETING', ea + 1, '📈 DIGITAL MARKETING', '📈 数字营销');",
       "end $$;",
       f"insert into notebooks (id, hub_id, name, icon, sort, name_en, name_zh) values ({q(NB)}, {q(HUB)}, 'Digital Marketing cho người mới (L02)', '📈', 1, 'Digital Marketing for Beginners (L02)', '数字营销入门 (L02)')",
       "  on conflict (id) do update set name = excluded.name, icon = excluded.icon, name_en = excluded.name_en, name_zh = excluded.name_zh;",
       f"insert into sections (id, notebook_id, name, sort, name_en, name_zh) values ('{NB}_s1', {q(NB)}, '11 MODULE', 1, '11 MODULES', '11 个单元')",
       "  on conflict (id) do update set name = excluded.name;"]
n = 0
for i, (mid, name_vi, name_en, words) in enumerate(MODULES, 1):
    assert len(words) == 10, mid
    p, bt, bl = f"{NB}_s1_p{mid}", f"{NB}_s1_p{mid}_b1", f"{NB}_s1_p{mid}_b1_bl1"
    out += [f"-- Module {mid}",
            f"insert into pages (id, section_id, name, sort, name_en) values ({q(p)}, '{NB}_s1', {q(name_vi)}, {i}, {q(name_en)}) on conflict (id) do update set name = excluded.name, sort = excluded.sort, name_en = excluded.name_en;",
            f"insert into batches (id, page_id, name, sort, created_at, name_en) values ({q(bt)}, {q(p)}, 'Từ vựng', 1, 1791100000000, 'Vocabulary') on conflict (id) do update set name = excluded.name;",
            f"insert into blocks (id, batch_id, name, global_index, sort) values ({q(bl)}, {q(bt)}, 'Block 1', {i}, 1) on conflict (id) do update set name = excluded.name;"]
    rows = []
    for j, (term, pos, lvl, ipa, de, vi, zh, es) in enumerate(words, 1):
        rows.append(f"  ({q(bl + '_w' + str(j))}, {q(bl)}, {j}, {q(term)}, {q(lvl)}, {q(pos)}, {q(ipa)}, {q(de)}, {q(vi)}, {q(zh)}, {q(es)}, {q(short(vi))}, 'common')")
        n += 1
    out += ["insert into words (id, block_id, sort, term, level, pos, ipa, def_en, meaning_vi, meaning_zh, meaning_es, quiz_vi, freq) values",
            ",\n".join(rows),
            "  on conflict (id) do update set term = excluded.term, level = excluded.level, pos = excluded.pos, ipa = excluded.ipa, def_en = excluded.def_en,",
            "    meaning_vi = excluded.meaning_vi, meaning_zh = excluded.meaning_zh, meaning_es = excluded.meaning_es, quiz_vi = excluded.quiz_vi;"]
out += ["commit;",
        f"-- Kiểm tra: select h.sort, h.name from hubs h order by h.sort;   select count(*) from words where id like '{NB}%';  -- phải = {n}"]
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dm_hub_seed.sql")
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
print(path, n, "từ")
