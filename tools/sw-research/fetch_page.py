# Tải 1 trang web nội dung (blog đề thi) và tóm tắt cấu trúc bằng Python (không tốn token Claude).
#   py fetch_page.py <url> [thư_mục_ra=pages]   -> <ra>/<slug>.html + .txt (chữ sạch) + in: kích thước, tiêu đề mục, số ảnh, link liên quan
# Nội dung tải về có BẢN QUYỀN của chủ trang: chỉ lưu cục bộ để nghiên cứu/hiệu chỉnh, KHÔNG commit lên repo công khai.
import sys, re, os, html, urllib.request, urllib.parse
url = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'pages'; os.makedirs(out, exist_ok=True)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
h = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'ignore')
slug = re.sub(r'[^a-z0-9]+', '-', urllib.parse.urlparse(url).path.lower()).strip('-')[-60:] or 'index'
open(f'{out}/{slug}.html', 'w', encoding='utf-8').write(h)
body = re.sub(r'(?is)<(script|style|noscript|nav|footer|header|aside|form)[^>]*>.*?</\1>', '', h)
heads = [(m.group(1), re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', m.group(2)))).strip()) for m in re.finditer(r'(?is)<h([1-4])[^>]*>(.*?)</h\1>', body)]
t = re.sub(r'(?i)</(p|li|h\d|tr|div|br)>', '\n', body); t = re.sub(r'(?s)<[^>]+>', '', t); t = html.unescape(t)
t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n\s*\n+', '\n', t).strip()
open(f'{out}/{slug}.txt', 'w', encoding='utf-8').write(t)
imgs = re.findall(r'<img[^>]+(?:src|data-src)=["\']([^"\']+)', body)
links = sorted({urllib.parse.urljoin(url, x) for x in re.findall(r'href=["\']([^"\'#]+)', h)})
rel = [l for l in links if re.search(r'toeic|ielts|speaking|writing', l, re.I) and urllib.parse.urlparse(l).netloc == urllib.parse.urlparse(url).netloc]
print('URL', url); print('html', len(h), 'byte | chữ', len(t), 'ký tự ≈', len(t) // 3, 'token | ảnh', len(imgs), '| mục', len(heads))
for lv, tx in heads[:60]: print('  ' * (int(lv) - 1) + 'h' + lv, tx[:110])
print('link liên quan cùng trang:', len(rel)); [print('  ', l) for l in rel[:40]]
