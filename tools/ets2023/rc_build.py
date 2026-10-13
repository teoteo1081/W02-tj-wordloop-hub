import json,re
from fixen import fix_all,parse_vocab
raw=json.load(open('rc_raw.json'))
def sp_vocab(c):                       # tách "Mở rộng:" khỏi 1 ô
    m=re.split(r'\bMở rộng\s*:?',c,maxsplit=1)
    return (m[0].strip(), m[1].strip() if len(m)>1 else '')
out={}
for t,items in raw.items():
    for ns,v in items.items():
        n=int(ns); part=5 if n<=130 else 6 if n<=146 else 7; c=v['cells']
        explain=stem_vi=None; vocab=[]
        if part==5:
            explain=c[0]; stem_vi=c[1] if len(c)>1 else None; vocab=parse_vocab(c[2]) if len(c)>2 else []
        elif part==6:
            e,vx=sp_vocab(c[0]); explain=e; vocab=parse_vocab(c[2] if len(c)>2 else vx)
        else:
            q,vx=sp_vocab(c[0]); stem_vi=q; explain=c[1] if len(c)>1 else None; vocab=parse_vocab(vx)
        out[f'{t}_{n}']={'test':t,'num':n,'part':part,'ans':v['ans'],'explain':fix_all(explain) if explain else None,'stem_vi':stem_vi,'vocab':vocab}
json.dump(out,open('rc_payload.json','w'),ensure_ascii=False)
import collections
print('items',len(out),'no explain',sum(1 for x in out.values() if not x['explain']),'no vocab',sum(1 for x in out.values() if not x['vocab']))
for k in ('3_105','3_139','3_150'): print(json.dumps(out[k],ensure_ascii=False)[:900]); print()
