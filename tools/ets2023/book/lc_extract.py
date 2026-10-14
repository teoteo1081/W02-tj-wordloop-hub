import pymupdf,glob,re,json
from fixen import parse_vocab,fix_all
import os
BOOK=os.environ.get('ETS_BOOK_DIR', r'C:/Users/User/Desktop/TJ/Project/L07-toeic/2023')   # thư mục chứa 'Chữa Listening/Reading test bản full.pdf'
d=pymupdf.open([x for x in glob.glob(BOOK+'/*.pdf') if 'Listening' in x][0])
starts=[10,51,91,131,172,212,251,291,331,370,409]
cl=lambda s: re.sub(r'[ \t]+',' ',(s or '').replace('\u00a0',' ')).strip()
J=lambda s: re.sub(r'\s*\n\s*',' ',s).strip()
SPK=re.compile(r'^(?:[MW]-[A-Za-z]{2}|M|W|Man|Woman|Speaker \d?)\s*:')
out={}
for ti in range(10):
    rows=[]
    for pn in range(starts[ti]-1,starts[ti+1]-1):
        for t in d[pn].find_tables().tables:
            for r in t.extract():
                ne=[cl(c) for c in r if cl(c)]
                if ne and ne[0] not in ('Câu','hỏi','Lời thoại') and not ne[0].startswith('CHỮA CHI TIẾT'): rows.append(ne)
    recs={}; cur_conv=[]; last_conv=None; last=None; vocab_buf=''
    def close_conv():
        global cur_conv,last_conv
        if cur_conv: last_conv={'en':' '.join(c[0] for c in cur_conv),'vn':' '.join(c[1] if len(c)>1 else '' for c in cur_conv),'vocab':''}; cur_conv=[]
    for ne in rows:
        r0=ne[0]
        m=re.fullmatch(r'(\d{1,3})',r0)
        mq=re.match(r'^(\d{2,3})\.\s',r0)
        if m and 1<=int(m.group(1))<=31:
            n=int(m.group(1)); recs[n]={'part':1 if n<=6 else 2,'cells':ne[1:]}; last=('q',n)
        elif mq and 32<=int(mq.group(1))<=100:
            close_conv(); n=int(mq.group(1)); recs[n]={'part':3 if n<=70 else 4,'cells':ne,'conv':last_conv}; last=('q',n)
        elif r0.startswith('Mở rộng'):
            txt='\n'.join(ne).replace('Mở rộng:','').replace('Mở rộng','')
            if cur_conv: cur_conv[-1]=cur_conv[-1][:2]+[txt] if len(cur_conv[-1])>=2 else cur_conv[-1]; vocab_buf=txt
            elif last and last[0]=='q' and last[1]>=32: recs[last[1]].setdefault('vx','');recs[last[1]]['vx']+='\n'+txt
            if last_conv is not None and not cur_conv: last_conv['vocab']+='\n'+txt
        elif SPK.match(r0) or re.match(r'^Questions? \d',r0):
            if last and last[0]=='q' and last[1]>=32 and cur_conv==[] : pass
            cur_conv.append(ne)
            last=('c',0)
        else:   # tiếp dòng của ô trước
            if last and last[0]=='q':
                c=recs[last[1]]['cells']
                for i,x in enumerate(ne):
                    if i<len(c): c[i]+=' '+x
                    else: c.append(x)
            elif cur_conv:
                for i,x in enumerate(ne):
                    if i<len(cur_conv[-1]): cur_conv[-1][i]+=' '+x
    out[ti+1]=recs
    p=lambda a,b:sum(1 for n in range(a,b+1) if n in recs)
    print('test',ti+1,'p1',p(1,6),'p2',p(7,31),'p3',p(32,70),'p4',p(71,100),'conv-less q',[n for n in range(32,101) if n in recs and not recs[n].get('conv')][:8])
json.dump(out,open('lc_raw.json','w'),ensure_ascii=False)
