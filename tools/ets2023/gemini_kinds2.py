# Dự phòng: Gemini chỉ cho kind + dòng đầu mỗi tài liệu; mình tự cắt bản gốc theo mốc (không để AI chép lại chữ). py gemini_kinds2.py <in.json> <out.json> <nhóm...>
import json, re, sys
sys.argv_save = sys.argv; IN, OUT = sys.argv[1:3]; WANT = sys.argv[3:]
exec(open('gemini_kinds.py', encoding='utf-8').read().split('norm = lambda')[0].replace('IN, OUT = sys.argv[1:3]', ''))
items = json.load(open(IN, encoding='utf-8')); done = {}
for g in WANT:
    ps = next(i['passage'] for i in items if i['group'] == g); body = re.sub(r'^\[[^\]\n]*\]\n', '', ps)
    for _ in range(3):
        try:
            u = ('Bài đọc TOEIC dưới đây gồm 1 hoặc nhiều tài liệu. Với MỖI tài liệu theo thứ tự, trả "kind" (tiếng Anh, chọn gần nhất trong: ' + KINDS + ') và "start" = 6-8 chữ ĐẦU TIÊN của tài liệu, chép NGUYÊN VĂN từ bài.\nSchema: {"docs":[{"kind":"E-mail","start":"..."}]}\n\n=== BÀI ĐỌC ===\n' + body)
            docs = json.loads(re.search(r'\{[\s\S]*\}', call(u)).group(0))['docs']
            pos = []; cur = 0
            for d in docs:
                w = re.escape(d['start'].strip()).replace(r'\ ', r'\s+'); m = re.compile(w).search(body, cur)
                if not m: raise ValueError('anchor ' + d['start'])
                pos.append(m.start()); cur = m.end()
            if pos[0] > 40: raise ValueError('first doc not at start')
            pos[0] = 0; parts = [body[pos[i]:(pos[i + 1] if i + 1 < len(pos) else len(body))].strip() for i in range(len(pos))]
            done[g] = '\n\n'.join('[%s]\n%s' % (d['kind'].strip(), t) for d, t in zip(docs, parts)); print(g, [d['kind'] for d in docs]); break
        except Exception as e: print('retry', g, str(e)[:80])
items = json.load(open(IN, encoding='utf-8'))
for it in items:
    if it['group'] in done: it['passage'] = done[it['group']]
json.dump(items, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('fixed', list(done))
