import pymupdf,glob,os,subprocess,sys
ROOT=r'D:\Python\Git\L07-toeic\ETS 2023'
for t in (5,6,7,8,9,10):
    d=f't{t:02d}/ocr'; os.makedirs(d,exist_ok=True)
    pdf=[f for f in glob.glob(f'{ROOT}\TEST {t}\*.pdf')][0]
    doc=pymupdf.open(pdf)
    for i,p in enumerate(doc):
        out=f'{d}/p-{i+1:02d}.png'
        if not os.path.exists(out): p.get_pixmap(dpi=250).save(out)
    print('test',t,os.path.basename(pdf),'pages',len(doc),flush=True)
