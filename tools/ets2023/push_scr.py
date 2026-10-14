# Ghi scr_N.json đã dựng vào test_items.i18n.scr (không dựng lại). SUPABASE_PAT trong môi trường. py push_scr.py N [N ...]
import json, os, sys
sys.path.insert(0, 'book')
from rc_upload_lib import sql
for N in sys.argv[1:]:
    d = json.load(open('scr_%s.json' % N, encoding='utf-8')); rows = []
    for k, sc in sorted(d.items(), key=lambda kv: int(kv[0])):
        n = int(k); part = 1 if n <= 6 else 2 if n <= 31 else 3 if n <= 70 else 4
        rows.append({'id': 'ets23_t%s_p%d_%d' % (N, part, n), 'scr': sc})
    got = 0
    for i in range(0, len(rows), 25):
        js = json.dumps(rows[i:i + 25], ensure_ascii=False); assert '$j$' not in js
        got += len(sql("update test_items t set i18n = coalesce(t.i18n,'{}'::jsonb) || jsonb_build_object('scr', r.scr) from jsonb_to_recordset($j$" + js + "$j$::jsonb) as r(id text, scr jsonb) where t.id = r.id returning t.id"))
    print('Test', N, 'ghi', got, '/', len(rows))
