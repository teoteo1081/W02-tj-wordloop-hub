# OCR cắt đôi cột (tesseract --psm 6) cho đề TOEIC scan 2 cột — chạy trong thư mục OCR (rc<n>/ cạnh file này). File đề gốc ở uploads phiên, KHÔNG commit đề.
import sys,os,glob,subprocess
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
U='/root/.claude/uploads/54ede573-e158-50f2-8bc3-ffb27fc7c5e2'
F={'2':'bf081779-TEST_2_RC_1','3':'3dc562cc-TEST_3_RC_1','4':'6a7405dc-TEST_4_RC_1','5':'452e30f4-TEST_5_RC_1','6':'cd9e6c23-TEST_6_RC_1','7':'e0f76a56-TEST_7_RC_1','8':'8342a714-TEST_8_RC_1','9':'eb4cf584-TEST_9_RC_1','10':'e3d5bd12-TEST_10_RC_1'}
t=sys.argv[1]; d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'rc'+t); os.environ['OMP_THREAD_LIMIT']='1'
subprocess.run(['pdftoppm','-r','250','-png',U+'/'+F[t]+'.pdf',d+'/c'],check=True)
def one(png):
    n=int(png.split('-')[-1][:-4]); im=Image.open(png); w,h=im.size
    for side,box in (('L',(0,0,w//2,h)),('R',(w//2,0,w,h))):
        q=d+'/c%02d%s.png'%(n,side); im.crop(box).save(q); subprocess.run(['tesseract',q,q[:-4],'--psm','6'],capture_output=True); os.remove(q)
    os.remove(png)
with ThreadPoolExecutor(4) as ex: list(ex.map(one,sorted(glob.glob(d+'/c-*.png'))))
print('cols',t)
