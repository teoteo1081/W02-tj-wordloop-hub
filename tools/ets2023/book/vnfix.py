import re,json,os,glob,unicodedata,itertools,collections
BOOK=r'D:\Python\Git\L07-toeic\ETS 2023\chữa đề'
CACHE='vs.json'
TOK=re.compile(r"[^\W\d_]+",re.U)
def build():
    import pymupdf
    c=collections.Counter()
    for f in glob.glob(BOOK+'/*.pdf'):
        for p in pymupdf.open(f):
            for w in TOK.findall(unicodedata.normalize('NFC',p.get_text())): c[w.lower()]+=1
    json.dump(c,open(CACHE,'w',encoding='utf8'),ensure_ascii=False); return c
VS=collections.Counter(json.load(open(CACHE,encoding='utf8'))) if os.path.exists(CACHE) else build()
CONS=set('bcdfghjklmnpqrstvwxz')
def best(chars,minc=3):
    seen=set(); res=[]
    for p in set(itertools.permutations(chars)):
        w=''.join(p)
        if VS.get(w,0)>=minc: res.append((VS[w],w))
    return max(res)[1] if res else None
RE=re.compile(r"(?<![\w’'])([^\W\d_]{2,6}) ([b-df-hj-np-tv-xz])(?![\w’'.:)\-–/%$])",re.U)
def fix_vn(t):
    t=unicodedata.normalize('NFC',t)
    def rep(m):
        w,x=m.group(1),m.group(2)
        if re.fullmatch(r'[A-Za-z]+',w) and w.lower() in ('the','and','for','are','was','not','you','all','can','has','his','her','its','our','who','how','why','new','one','two','out','job','any','may','get','use'): return m.group(0)
        if x in 'n' and w.lower()=='sao': pass
        cand=best(list((w+x).lower()))
        if cand and cand!=(w+x).lower() and VS.get(w.lower(),0)<VS.get(cand,0)*0.5+1:
            return (cand.capitalize() if w[0].isupper() else cand)
        return m.group(0)
    return RE.sub(rep,t)
if __name__=='__main__':
    print(len(VS))
    for s in ['sẽ tốn nhiều tềi n hơn—bạn','chúng tôi ước tní h này','đầu bài có nói tới']: print(fix_vn(s))

from spellchecker import SpellChecker
_sp=SpellChecker()
def _swaps(w):
    c=set(); n=len(w)
    for i in range(n-1):
        a=list(w); a[i],a[i+1]=a[i+1],a[i]; c.add(''.join(a))
    for i in range(n-1):
        for j in range(i+2,n-1):
            a=list(w); a[i],a[i+1]=a[i+1],a[i]; a[j],a[j+1]=a[j+1],a[j]; c.add(''.join(a))
    return c
def fix_inword(t):
    t=unicodedata.normalize('NFC',t)
    def rep(m):
        w=m.group(0); lw=w.lower()
        if len(lw)<3 or VS.get(lw,0)>2 or lw in _sp: return w
        cands=[(VS[c],c) for c in _swaps(lw) if VS.get(c,0)>=8 and VS[c]>=4*max(1,VS.get(lw,0))]
        if not cands: return w
        cands.sort(reverse=True)
        if len(cands)>1 and cands[0][0]<2*cands[1][0]: return w     # mơ hồ -> giữ nguyên
        r=cands[0][1]; return r.capitalize() if w[0].isupper() else r
    return TOK.sub(rep,t)
def fix_all_vn(t): return fix_inword(fix_vn(t))
