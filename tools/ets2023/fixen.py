import re
from spellchecker import SpellChecker
sp=SpellChecker()
SKIP=lambda w: False
def fix_word(w):
    if len(w)<4 or w.lower() in sp or SKIP(w): return w
    lw=w.lower(); cands=set()
    for i in range(len(lw)-1):                      # đảo 2 chữ liền kề
        s=lw[:i]+lw[i+1]+lw[i]+lw[i+2:]
        if s in sp: cands.add(s)
    for i in range(len(lw)-1):                      # đảo 2 lần (nhiễu hay xảy ra theo cặp)
        for j in range(i+2,len(lw)-1):
            s=list(lw); s[i],s[i+1]=s[i+1],s[i]; s[j],s[j+1]=s[j+1],s[j]; s=''.join(s)
            if s in sp: cands.add(s)
    if not cands: return w
    best=sorted(cands,key=lambda c:-sp.word_usage_frequency(c) if hasattr(sp,'word_usage_frequency') else 0)[0]
    return best.capitalize() if w[0].isupper() else best
def fix_text(t): return re.sub(r"[A-Za-z]+",lambda m:fix_word(m.group(0)),t)
if __name__=='__main__':
    for s in ['Efefctive (adj) hiệu quả','Cofefehouse & Grill Gift Certfi icate','partciipatni g restaurants will ofefr set menus','Sales staf f (n) nhân viên','Discontinue (v) ngưng Transit pass (n)']: print(s,'=>',fix_text(s))

def _ok(w): return w.lower() in sp or not re.search(r'[A-Za-z]',w) or len(re.sub(r'[^A-Za-z]','',w))<3
def fix_line(line):
    toks=re.split(r'(\s+)',line); words=[i for i,t in enumerate(toks) if t.strip()]
    out=[]; i=0
    while i<len(words):
        a=toks[words[i]]; done=False
        if re.fullmatch(r"[A-Za-z]+",a):
            for span in (3,2):
                if i+span<=len(words):
                    parts=[toks[words[i+k]] for k in range(span)]
                    if all(re.fullmatch(r"[A-Za-z]+",p) for p in parts) and not all(p.lower() in sp for p in parts):
                        j=''.join(parts); f=fix_word(j) if j.lower() not in sp else j
                        if f.lower() in sp and len(f)>=4:
                            out.append(f); i+=span; done=True; break
        if not done: out.append(fix_word(a) if re.fullmatch(r"[A-Za-z]+",a) else a); i+=1
    return ' '.join(out)
def fix_en(t): return '\n'.join(fix_line(l) for l in t.split('\n'))

def fix_lig(t): return t.replace('fcfi','ffic').replace('fcfi','ffic')
def fix_all(t): return fix_en(fix_lig(t))
POS=r'(?:n|v|adj|adv|phr|prep|conj|pron|det|idiom|phr\.? ?v|n/v|v/n|adj/adv)'
def parse_vocab(text):
    """"Judge (v) đáng giá \n Panel of experts (n)\n hội đồng ..." -> [{t,pos,vi}]; dòng chứa (pos) mở mục mới, dòng khác nối vào nghĩa"""
    out=[]
    for ln in [l.strip() for l in text.split('\n') if l.strip()]:
        m=re.match(r'^(.*?)\s*\(('+POS+r')\)\s*(.*)$',ln)
        if m and m.group(1): out.append({'t':fix_all(m.group(1).strip(' :-')),'pos':m.group(2).replace(' ',''),'vi':m.group(3).strip()})
        elif out: out[-1]['vi']=(out[-1]['vi']+' '+ln).strip()
    return [v for v in out if v['t'] and v['vi']]

def fix_line(line):                      # bản mới: cho phép dấu câu dính cuối token (meetni g,)
    toks=line.split(' '); out=[]; i=0
    CORE=re.compile(r"^([“\"(‘']*)([A-Za-z]+)([,.;:!?”\")’']*)$")
    while i<len(toks):
        a=CORE.match(toks[i]); done=False
        if a:
            for span in (3,2):
                if i+span<=len(toks):
                    ms=[CORE.match(toks[i+k]) for k in range(span)]
                    if all(ms) and all(not m.group(3) for m in ms[:-1]) and all(not m.group(1) for m in ms[1:]):
                        parts=[m.group(2) for m in ms]
                        if not all(p.lower() in sp or SKIP(p) for p in parts):
                            j=''.join(parts); f=fix_word(j) if j.lower() not in sp else j
                            if f.lower() in sp and len(f)>=4:
                                out.append(ms[0].group(1)+f+ms[-1].group(3)); i+=span; done=True; break
            if not done:
                out.append(a.group(1)+fix_word(a.group(2))+a.group(3)); i+=1; done=True
        if not done: out.append(toks[i]); i+=1
    return ' '.join(out)

MINF=2.5e-7
def _freq(w): return sp.word_usage_frequency(w.lower())
def fix_word(w):                     # bản chặt: tần suất tối thiểu, không đụng tên riêng ngắn
    if len(w)<4 or w.lower() in sp or SKIP(w): return w
    lw=w.lower(); cands=set()
    for i in range(len(lw)-1):
        s=lw[:i]+lw[i+1]+lw[i]+lw[i+2:]
        if s in sp: cands.add(s)
    for i in range(len(lw)-1):
        for j in range(i+2,len(lw)-1):
            s=list(lw); s[i],s[i+1]=s[i+1],s[i]; s[j],s[j+1]=s[j+1],s[j]; s=''.join(s)
            if s in sp: cands.add(s)
    cands=[c for c in cands if _freq(c)>=MINF]
    if not cands: return w
    best=max(cands,key=_freq)
    if w[0].isupper() and len(best)<8: return w
    return best.capitalize() if w[0].isupper() else best
_CORE=re.compile(r"^([“\"(‘']*)([A-Za-z]+)([,.;:!?”\")’']*)$")
def fix_line(line):
    toks=line.split(' '); out=[]; i=0
    while i<len(toks):
        a=_CORE.match(toks[i]); done=False
        if a:
            for span in (3,2):
                if i+span<=len(toks):
                    ms=[_CORE.match(toks[i+k]) for k in range(span)]
                    if all(ms) and all(not m.group(3) for m in ms[:-1]) and all(not m.group(1) for m in ms[1:]):
                        parts=[m.group(2) for m in ms]
                        if not all(p.lower() in sp or SKIP(p) for p in parts):
                            j=''.join(parts); f=fix_word(j) if j.lower() not in sp else j
                            ok=f.lower() in sp and len(f)>=4 and _freq(f)>=MINF and (len(f)>=7 or (len(parts[-1])==1 and len(parts)==2))
                            if ok and parts[0][0].isupper() and len(f)<8: ok=False
                            if ok: out.append(ms[0].group(1)+f+ms[-1].group(3)); i+=span; done=True; break
            if not done: out.append(a.group(1)+fix_word(a.group(2))+a.group(3)); i+=1; done=True
        if not done: out.append(toks[i]); i+=1
    return ' '.join(out)

def _two_swaps(lw):
    n=len(lw); res=set()
    for i in range(n-1):
        a=list(lw); a[i],a[i+1]=a[i+1],a[i]
        for j in range(n-1):
            b=a[:]; b[j],b[j+1]=b[j+1],b[j]; res.add(''.join(b))
    return res
_old_fix_word=fix_word
def fix_word(w):
    r=_old_fix_word(w)
    if r!=w or len(w)<5 or w.lower() in sp or SKIP(w): return r
    lw=w.lower()
    cands=[c for c in _two_swaps(lw) if c in sp and _freq(c)>=MINF]
    if not cands: return w
    best=max(cands,key=_freq)
    if w[0].isupper() and len(best)<8: return w
    return best.capitalize() if w[0].isupper() else best
_CORE=re.compile(r"^([“\"(‘']*(?:[A-Za-z0-9]+-)*)([A-Za-z]+)([,.;:!?”\")’']*)$")
