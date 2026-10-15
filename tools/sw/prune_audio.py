# Dọn file ghi âm mồ côi trong Storage (bucket toeic/sw-audio): file không còn dòng nào trong bảng sw_history trỏ tới.
#   set SBP=<token Supabase tạm>            (KHÔNG lưu token vào file/git; xong thì thu hồi token)
#   py tools/sw/prune_audio.py              -> chỉ liệt kê (dry-run)
#   py tools/sw/prune_audio.py --delete     -> xoá thật (qua Storage API với service key lấy bằng token)
import os, sys, json, urllib.request
REF = 'pqarpszsipbdugrumhfy'; TOK = os.environ['SBP']
def api(path, data=None, method=None, headers=None, base='https://api.supabase.com'):
    h = {'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json', 'User-Agent': 'tj-sw/1.0'}; h.update(headers or {})
    r = urllib.request.Request(base + path, data=json.dumps(data).encode() if data is not None else None, method=method, headers=h)
    return json.loads(urllib.request.urlopen(r, timeout=120).read().decode() or 'null')
def sql(q): return api('/v1/projects/%s/database/query' % REF, {'query': q})
orph = sql("""select o.name, (o.metadata->>'size')::bigint as size from storage.objects o
  where o.bucket_id='toeic' and o.name like 'sw-audio/%'
  and not exists (select 1 from public.sw_history h where h.audio is not null and h.audio like '%' || o.name || '%')""")
tot = sum(int(x['size'] or 0) for x in orph)
print('file mồ côi:', len(orph), '| dung lượng ≈ %.1f MB' % (tot / 1e6))
for x in orph[:10]: print('  ', x['name'])
if '--delete' in sys.argv and orph:
    keys = api('/v1/projects/%s/api-keys' % REF); sk = [k['api_key'] for k in keys if k['name'] == 'service_role'][0]
    base = 'https://%s.supabase.co' % REF; names = [x['name'] for x in orph]
    for i in range(0, len(names), 100):
        r = urllib.request.Request(base + '/storage/v1/object/toeic', data=json.dumps({'prefixes': names[i:i + 100]}).encode(), method='DELETE',
                                   headers={'Authorization': 'Bearer ' + sk, 'apikey': sk, 'Content-Type': 'application/json'})
        print('xoá', len(names[i:i + 100]), json.loads(urllib.request.urlopen(r, timeout=120).read().decode() or '[]').__len__(), 'file')
