import json,re,os
from fixen import parse_vocab
raw=json.load(open('lc_raw.json'))
J=lambda s: re.sub(r'\s*\n\s*',' ',s or '').strip()
VNCH=re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]',re.I)
LAB=re.compile(r'(?:(?<=\s)|^)([A-D])\.\s')
def segs(t):
    t=J(t); ms=list(LAB.finditer(t))
    if not ms: return t,[]
    q=t[:ms[0].start()].strip(); out=[]
    for i,m in enumerate(ms): out.append((m.group(1),t[m.end():(ms[i+1].start() if i+1<len(ms) else len(t))].strip()))
    return q,out
def vn_options(cells,expected):
    q,s=segs(cells[1] if len(cells)>1 else '')
    q=re.sub(r'^\d{2,3}\.\s*','',q).strip()
    opts=[x[1] for x in s]
    if len(opts)==expected: return q,opts,'pos'
    if len(opts)<expected:                       # phần còn thiếu thường rơi sang ô khác do bảng bị ngắt trang
        have=set(); res={}
        for i,(lab,txt) in enumerate(s): res[lab]=txt
        # nhãn trong ô VN có thể sai; chỉ vá khi các nhãn còn lại là tập con đúng thứ tự
        labels='ABCD'[:expected]
        extra={}
        for c in cells:
            for lab,txt in segs(c)[1]:
                if VNCH.search(txt): extra.setdefault(lab,txt)
        if len(opts)+0<expected:
            full=[]
            for lab in labels:
                if lab in res and res[lab] in opts: full.append(res[lab])
                elif lab in extra: full.append(extra[lab])
            if len(full)==expected and all(f in opts or f in extra.values() for f in full): return q,full,'patched'
    return q,None,'bad'
def evidence(vn,q):
    m=re.search(r'(?<![\d$.,/\-:])'+str(q)+r'(?=[^\d\s.,:%)])',vn)
    if not m: return None
    s=vn[m.end():]; e=re.search(r'[.?!](\s|$)',s)
    return (s[:e.end()] if e else s[:300]).strip()
def grp(n): base=32 if n<=70 else 71; return base+((n-base)//3)*3
out={}; stats={'pos':0,'patched':0,'bad':0,'conv_drop':0}
for t,recs in raw.items():
    for ns,v in recs.items():
        n=int(ns); part=1 if n<=6 else 2 if n<=31 else 3 if n<=70 else 4; c=v['cells']
        exp=3 if part==2 else 4
        q,opts,how=vn_options(c,exp); stats[how]+=1
        vocab=[]; conv=None; ev=None
        if part<=2: vocab=parse_vocab(c[2]) if len(c)>2 else []
        else:
            cv=v.get('conv') or {}; cvn=J(cv.get('vn'))
            marks=set(int(x) for x in re.findall(r'(?<![\d$.,/\-:])(\d{2,3})(?=[^\d\s.,:%)])',cvn))
            g=grp(n)
            if cvn and (marks & set(range(g,g+3))): conv=cvn; ev=evidence(cvn,n); vocab=parse_vocab((cv.get('vocab','')+'\n'+v.get('vx','')).strip())
            else: stats['conv_drop']+=1
        out[f'{t}_{n}']={'test':t,'num':n,'part':part,'q_vn':q or None,'opts_vn':opts,'how':how,'conv_vn':conv,'ev':ev,'vocab':vocab}
json.dump(out,open('lc_payload.json','w'),ensure_ascii=False); print(stats,'items',len(out))
