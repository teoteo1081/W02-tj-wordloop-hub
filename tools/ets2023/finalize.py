import json,re,sys
from vnfix2 import fix_vi_en
from lc_build import segs   # noqa (chạy lại build, cần lc_raw.json)
from rc_upload_lib import sql
rc=json.load(open('rc_payload.json')); lc=json.load(open('lc_payload.json'))
F=fix_vi_en
def vocab(vs): return [{'t':F(v['t']),'pos':v['pos'],'vi':F(v['vi'])} for v in vs] or None
def mark(conv,g):
    return re.sub(r'(?<![\d$.,/\-:])(\d{2,3})(?=[^\d\s.,:%)])',lambda m:('【%s】'%m.group(1)) if g<=int(m.group(1))<g+3 else m.group(0),conv)
def grp(n): base=32 if n<=70 else 71; return base+((n-base)//3)*3
def rows_for(tests,ans):
    rows=[]
    for k,v in rc.items():
        if v['test'] not in tests: continue
        n=v['num']; part=v['part']; ex=F(v['explain']); sv=F(v['stem_vi']) if v['stem_vi'] else None
        stem=None
        if part==5: stem=sv
        elif part==7 and sv:
            q,s=segs(v['stem_vi']); q=F(q)
            stem=q or None
            if len(s)==4 and v['ans'] in 'ABCD': ex=f"Đáp án đúng: ({v['ans']}) {F(s['ABCD'.index(v['ans'])][1]).rstrip('.')}. "+ex
        rows.append({'id':f"ets23_t{v['test']}_p{part}_{n}",'explain':ex,'stem_vi':stem,'vocab':vocab(v['vocab']),'vi':{'explain':ex,**({'stem':stem} if stem else {})}})
    for k,v in lc.items():
        if v['test'] not in tests: continue
        n=v['num']; part=v['part']; a=ans.get((v['test'],n))
        if not a: continue
        ov=v['opts_vn']; parts=[]
        if ov and 'ABCD'.index(a)<len(ov): parts.append(f"Đáp án đúng: ({a}) {F(ov['ABCD'.index(a)])}")
        if part>=3 and v['conv_vn']: parts.append("Lời thoại (bản dịch; 【số】 đánh dấu chỗ chứa thông tin của câu đó):\n"+F(mark(v['conv_vn'],grp(n))))
        if not parts: continue
        ex='\n\n'.join(parts); q=F(v['q_vn']) if v['q_vn'] and part>=2 else None
        rows.append({'id':f"ets23_t{v['test']}_p{part}_{n}",'explain':ex,'stem_vi':q,'vocab':vocab(v['vocab']),'vi':{'explain':ex,**({'stem':q} if q else {})}})
    return rows
def push(rows):
    tot=0
    for i in range(0,len(rows),40):
        js=json.dumps(rows[i:i+40],ensure_ascii=False); assert '$j$' not in js
        res=sql("update test_items t set explain=r.explain, stem_vi=coalesce(r.stem_vi,t.stem_vi), vocab=coalesce(r.vocab,t.vocab), i18n=coalesce(t.i18n,'{}'::jsonb)||jsonb_build_object('vi',coalesce(t.i18n->'vi','{}'::jsonb)||r.vi) from jsonb_to_recordset($j$"+js+"$j$::jsonb) as r(id text,explain text,stem_vi text,vocab jsonb,vi jsonb) where t.id=r.id returning t.id")
        tot+=len(res)
    return tot
if __name__=='__main__':
    tests=sys.argv[1:]
    db=sql("select test,num,answer from test_items where test like '2023%' and answer is not null")
    ans={(r['test'].split('-')[1],r['num']):r['answer'] for r in db}
    rows=rows_for(tests,ans); print('rows',len(rows),'updated',push(rows))
    print(sql("select test, part<=4 as lc, count(*) n, count(explain) expl, count(vocab) vocab, count(stem_vi) stemvi from test_items where test like '2023%' group by 1,2 order by 1,2"))
