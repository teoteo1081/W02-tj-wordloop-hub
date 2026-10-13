import re,glob,json,sys
bp=json.load(open('book_pages.json')); P5=[20,52,82,112,142,172,202,232,262,292]; P6=bp['p6']
pages={int(re.findall(r'L-(\d+)',f)[0]):open(f,encoding='utf8',errors='ignore').read() for f in glob.glob('book_rc/L-*.txt')}
NOISE=re.compile(r'Thi thu|Toeic mi|Key va transcript|GO ON TO THE NEXT|group S Toeic|stoeic',re.I)
def lines(t):
    out=[]
    for l in t.split('\n'):
        if NOISE.search(l) or re.fullmatch(r'\s*\d{1,3}\s*',l): continue
        l=re.sub(r'^[^\w(\[“"\'$]{1,4}\s+(?=\S)','',l.rstrip())   # rác đầu dòng do nền nhiễu
        out.append(l)
    return out
def norm_opts(t): return re.sub(r'\(\s*([A-D])\s*\)\.?',r'(\1)',t)
def parse_p5(t,n0=101,n1=130):
    items={}; pos=0
    for n in range(n0,n1+1):
        m=re.search(r'(?m)^\s*[1l47I]'+str(n)[1:]+r'\s*[.,]\s',t)
        items[n]=m
    order=sorted([(m.start(),n) for n,m in items.items() if m])
    res={}; 
    for i,(st,n) in enumerate(order):
        end=order[i+1][0] if i+1<len(order) else len(t)
        body=norm_opts(' '.join(t[items[n].end():end].split()))
        ms=list(re.finditer(r'\(([A-D])\)',body))
        if [x.group(1) for x in ms][:4]!=list('ABCD'): res[n]=None; continue
        ms=ms[:4]; stem=body[:ms[0].start()].strip()
        opts=['('+x.group(1)+') '+body[x.end():(ms[j+1].start() if j<3 else len(body))].strip() for j,x in enumerate(ms)]
        stem=re.sub(r'[-–—_~]{3,}','_______',stem)
        res[n]={'stem':stem,'opts':opts}
    return res
out={}
for k in range(10):
    t='\n'.join('\n'.join(lines(pages[n])) for n in range(P5[k],P6[k]))
    r=parse_p5(t); out[k+1]=r
    bad=[n for n in range(101,131) if not r.get(n) or '_______' not in r[n]['stem'] or any(len(o)<5 for o in r[n]['opts'])]
    print('test',k+1,'parsed',sum(1 for v in r.values() if v),'/30','bad',bad)
json.dump(out,open('p5_book.json','w'),ensure_ascii=False)
