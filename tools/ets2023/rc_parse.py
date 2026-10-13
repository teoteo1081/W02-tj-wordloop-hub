import re,json,sys,glob,os
D=sys.argv[1]; T=sys.argv[2]; KEYS=json.load(open(sys.argv[3]))['rc'][T]; OUT=sys.argv[4]
NOISE=re.compile(r'Thi thu|Toeic mi|Key va transcript|GO ON TO THE NEXT|group S Toeic|^\s*\d{1,3}\s*$|^\s*[\W_]{0,4}\s*$',re.I)
def lines(txt): return [l.rstrip() for l in txt.split('\n') if not NOISE.search(l)]
pg=sorted(int(re.findall(r'L-(\d+)',f)[0]) for f in glob.glob(D+'/L-*.txt'))
full={n:open(f'{D}/L-{n:02d}.txt',encoding='utf8',errors='ignore').read() for n in pg}
p5s=[n for n in pg if 'PART 5' in full[n]][0]
p6s=[n for n in pg if 'PART 6' in full[n] and 'PART 5' not in full[n]][0]
def half(n,s): 
    f=f'{D}/c{n:02d}{s}.txt'; return open(f,encoding='utf8',errors='ignore').read() if os.path.exists(f) else ''
def norm_opt(t): return re.sub(r'[\(\[]\s*([A-D])\s*[\)\]]',r'(\1)',t)
def opts_of(t):
    t=norm_opt(' '.join(t.split()))
    m=list(re.finditer(r'\(([A-D])\)',t)); 
    if [x.group(1) for x in m]!=list('ABCD'): return t,None
    return t[:m[0].start()].strip(),['('+x.group(1)+') '+t[x.end():(m[i+1].start() if i<3 else len(t))].strip() for i,x in enumerate(m)]
items=[]; flags=[]
# ---- Part 5 : halves (đọc cột trái rồi phải từng trang)
p5txt='\n'.join('\n'.join(lines(half(n,'L')))+'\n'+'\n'.join(lines(half(n,'R'))) for n in range(p5s,p6s))
mk=list(re.finditer(r'(?m)^\s*(1[0-3]\d)\s*[.,]\s',p5txt))
mk=[m for m in mk if 101<=int(m.group(1))<=130]
seen={}
for i,m in enumerate(mk):
    n=int(m.group(1)); body=p5txt[m.end():(mk[i+1].start() if i+1<len(mk) else len(p5txt))]
    if n in seen: continue
    stem,op=opts_of(body); seen[n]=1
    stem=re.sub(r'[-_–—]{3,}','_______',stem)
    if op is None or '_______' not in stem: flags.append((n,'p5'))
    items.append({'part':5,'num':n,'stem':stem,'opts':op or [],'passage':''})
miss=[n for n in range(101,131) if n not in seen]; 
if miss: flags.append(('p5 missing',miss))
# ---- Part 6/7 : trang đầy đủ
body='\n'.join('\n'.join(lines(full[n]))+'\n=== PAGE ===' for n in pg if n>=p6s)
H=re.compile(r'Questions?\s+(\d{3})\s*[-–~—]\s*(\d{3})\s+refer\s+to\s+(?:the\s+)?following\s+([^.\n]*)',re.I)
hs=list(H.finditer(body))
for i,h in enumerate(hs):
    a,b=int(h.group(1)),int(h.group(2)); kind=h.group(3).strip(' .'); blk=body[h.end():(hs[i+1].start() if i+1<len(hs) else len(body))].replace('=== PAGE ===','')
    qm=[m for m in re.finditer(r'(?m)^\s*(\d{3})\s*[.,]\s',blk) if a<=int(m.group(1))<=b]
    # bỏ trùng số, giữ lần đầu
    firsts={}; 
    for m in qm: firsts.setdefault(int(m.group(1)),m)
    qm=sorted(firsts.values(),key=lambda m:m.start())
    if not qm: flags.append((a,b,'no questions')); continue
    passage=blk[:qm[0].start()].strip(); part=6 if a<=146 else 7
    for j,m in enumerate(qm):
        n=int(m.group(1)); qb=blk[m.end():(qm[j+1].start() if j+1<len(qm) else len(blk))]
        stem,op=opts_of(qb)
        if op is None: flags.append((n,'opts')); op=[]
        if part==6: stem=f'Choose the best answer for blank ({n}).'
        items.append({'part':part,'num':n,'stem':stem,'opts':op,'passage':f'[{kind}]\n'+passage,'group':f'{a}-{b}'})
got={x['num'] for x in items}; miss=[n for n in range(101,201) if n not in got]
for x in items: x['id']=f"ets23_t{T}_p{x['part']}_{x['num']}"; x['answer']=KEYS[str(x['num'])]
json.dump(sorted(items,key=lambda x:x['num']),open(OUT,'w'),ensure_ascii=False,indent=1)
print('items',len(items),'missing',miss,'flags',flags[:15])
