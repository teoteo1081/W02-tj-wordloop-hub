import re,unicodedata,itertools
from vnfix import VS,TOK,_swaps,_sp,best
from fixen import fix_all
TONES={'\u0300','\u0301','\u0309','\u0303','\u0323'}
def strip_tone(w):
    d=unicodedata.normalize('NFD',w.lower()); return unicodedata.normalize('NFC',''.join(c for c in d if c not in TONES))
ONS=r'(?:ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdđghklmnpqrstvx])?'
NOC=r'(?:iêu|yêu|uôi|ươi|ươu|oai|oay|uây|uya|uyu|oeo|ai|ao|au|ay|âu|ây|eo|êu|ia|iu|oi|ôi|ơi|ua|ui|ưa|ưi|ưu)'
COK=r'(?:uyê|iê|yê|uô|ươ|uê|uâ|uy|oa|oă|oe|a|ă|â|e|ê|i|o|ô|ơ|u|ư|y)'
SYL=re.compile('^'+ONS+'(?:'+NOC+'|'+COK+r'(?:ch|ng|nh|c|m|n|p|t)?)$')
def valid_syl(w): return bool(SYL.match(strip_tone(w)))
LONE=re.compile(r"(?<![\w’'])([^\W\d_]{2,6})\s([b-df-hj-np-tv-xz])(?![\w’'.:)\-–/%$])",re.U)
def p1(t):
    def rep(m):
        w,x=m.group(1),m.group(2)
        if w[0].isupper() or valid_syl(w): return m.group(0)
        c=best(list(unicodedata.normalize('NFC',(w+x).lower())))
        return c if c and valid_syl(c) else m.group(0)
    return LONE.sub(rep,t)
def p2(t):
    def rep(m):
        w=m.group(0); lw=w.lower()
        if len(lw)<3 or w[0].isupper() or VS.get(lw,0)>2 or lw in _sp or valid_syl(lw): return w
        cands=[(VS[c],c) for c in _swaps(lw) if VS.get(c,0)>=8 and valid_syl(c)]
        if not cands: return w
        cands.sort(reverse=True)
        if len(cands)>1 and cands[0][0]<2*cands[1][0]: return w
        return cands[0][1]
    return TOK.sub(rep,t)
import fixen
fixen.SKIP=lambda w: valid_syl(w) or VS.get(w.lower(),0)>=3
def fix_vi_en(t):
    t=re.sub(r'\s*\n\s*',' ',unicodedata.normalize('NFC',t or '')).strip()
    t=re.sub(r'\s*\|\s*',' ',t)
    return p2(p1(fix_all(t)))
if __name__=='__main__':
    for s in ['sẽ tốn nhiều tềi n hơn','chị gái anh, Elise','Simon Elkund sẽ','ước tní h này','tìm tmì thông tni','drink, ues no','tại meetni g, rồi','yên tnĩ h,']: print(fix_vi_en(s))

_p2_old=p2
def p2(t):                      # thêm: từ Việt không dấu bị đảo thành từ tiếng Anh (vd "gain" thay cho "gian") khi láng giềng là tiếng Việt
    toks=t.split(' ')
    for i,w in enumerate(toks):
        m=re.fullmatch(r'([^\w]*)([A-Za-z]{3,5})([^\w]*)',w)
        if not m: continue
        core=m.group(2).lower()
        if valid_syl(core): continue
        VD=re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]',re.I)
        nbs=[x for x in (toks[i-1] if i>0 else None, toks[i+1] if i+1<len(toks) else None) if x]
        if not nbs or not all(VD.search(x) or not re.search(r'[A-Za-z]',x) for x in nbs): continue
        c=[(VS[x],x) for x in _swaps(core) if valid_syl(x) and VS.get(x,0)>=50]
        if c:
            r=max(c)[1]; toks[i]=m.group(1)+(r.capitalize() if m.group(2)[0].isupper() else r)+m.group(3)
    return _p2_old(' '.join(toks))
