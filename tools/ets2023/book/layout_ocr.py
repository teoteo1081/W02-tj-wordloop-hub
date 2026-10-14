import sys,os,glob,re,subprocess,io,csv
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
TESS=r'C:\Program Files\Tesseract-OCR\tesseract.exe'
import cv2
def clean(png):
    im=cv2.imread(png,0); bg=cv2.GaussianBlur(im,(0,0),25); n=cv2.divide(im,bg,scale=255)
    _,bw=cv2.threshold(n,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU); out=png[:-4]+'_c.png'; cv2.imwrite(out,bw); return out
def page_text(png0):
    png=clean(png0)
    r=subprocess.run([TESS,png,'stdout','--psm','6','tsv'],capture_output=True,env={**os.environ,'OMP_THREAD_LIMIT':'1'})
    rows=list(csv.reader(io.StringIO(r.stdout.decode('utf8','ignore')),delimiter='\t',quoting=csv.QUOTE_NONE))
    h=rows[0]; ix={k:i for i,k in enumerate(h)}
    W=Image.open(png).size[0]; mid=W/2
    os.remove(png)
    lines={}
    for r_ in rows[1:]:
        if len(r_)<len(h) or r_[ix['level']]!='5' or not r_[ix['text']].strip(): continue
        if float(r_[ix['conf']])<0: continue
        k=(r_[ix['block_num']],r_[ix['par_num']],r_[ix['line_num']])
        lines.setdefault(k,[]).append((int(r_[ix['left']]),int(r_[ix['top']]),int(r_[ix['width']]),r_[ix['text']]))
    out=[]; bandL=[]; bandR=[]
    def flush():
        nonlocal bandL,bandR
        for t in sorted(bandL): out.append(t[1])
        for t in sorted(bandR): out.append(t[1])
        bandL=[];bandR=[]
    for k,ws in sorted(lines.items(),key=lambda kv:min(w[1] for w in kv[1])):
        ws.sort(); top=min(w[1] for w in ws)
        txt=lambda L:' '.join(w[3] for w in L)
        best=None
        for i in range(len(ws)-1):
            g=ws[i+1][0]-(ws[i][0]+ws[i][2]); c=(ws[i+1][0]+ws[i][0]+ws[i][2])/2
            if abs(c-mid)<170 and g>=30 and (best is None or g>best[0]): best=(g,i)
        if best:
            left=ws[:best[1]+1]; right=ws[best[1]+1:]
            bandL.append((top,txt(left))); bandR.append((top,txt(right)))
        else:
            x0=min(w[0] for w in ws); x1=max(w[0]+w[2] for w in ws)
            if (x1-x0)/W>0.62: flush(); out.append(txt(ws))
            elif (x0+x1)/2<mid: bandL.append((top,txt(ws)))
            else: bandR.append((top,txt(ws)))
    flush(); return '\n'.join(out)
if __name__=='__main__':
    d=sys.argv[1]; pngs=sorted(p for p in glob.glob(d+'/p-*.png') if not p.endswith('_c.png'))
    def one(p):
        n=re.findall(r'p-(\d+)',p)[0]; open(f'{d}/L-{n}.txt','w',encoding='utf8').write(page_text(p))
    with ThreadPoolExecutor(4) as ex: list(ex.map(one,pngs))
    print('layout ocr done',len(pngs))
