import pymupdf,glob,re,json,sys
BOOK=r'D:\Python\Git\L07-toeic\ETS 2023\chữa đề'
f=[x for x in glob.glob(BOOK+'\*.pdf') if 'Reading' in x][0]
d=pymupdf.open(f)
starts=[10,52,93,134,170,208,243,286,327,369,408]
def clean(s): return re.sub(r'[ \t]+',' ',(s or '').replace('\u00a0',' ')).strip()
out={}
for ti in range(10):
    rows_all=[]
    for pn in range(starts[ti]-1,starts[ti+1]-1):
        for t in d[pn].find_tables().tables:
            for r in t.extract():
                cells=[clean(c) for c in r]
                ne=[c for c in cells if c]
                if not ne: continue
                rows_all.append(ne)
    items={}; cur=None
    for ne in rows_all:
        if re.fullmatch(r'1\d\d|200',ne[0]) and 101<=int(ne[0])<=200:
            cur=int(ne[0]); rest=ne[1:]
            ans=None
            if rest and re.fullmatch(r'[A-D]',rest[0]): ans=rest[0]; rest=rest[1:]
            items[cur]={'ans':ans,'cells':rest}
        elif cur and not (ne[0] in('Câu','hỏi') or ne[0].startswith('Câu')) :
            # continuation row: append each cell to the corresponding previous cell by order
            cs=items[cur]['cells']
            for i,c in enumerate(ne):
                if i<len(cs): cs[i]+=' '+c
                else: cs.append(c)
    out[ti+1]=items
    miss=[n for n in range(101,201) if n not in items]
    noans=[n for n,v in items.items() if not v['ans']]
    print('test',ti+1,'rows',len(items),'missing',miss[:20],'noans',noans[:10])
json.dump(out,open(sys.argv[1] if len(sys.argv)>1 else 'rc_raw.json','w'),ensure_ascii=False)
