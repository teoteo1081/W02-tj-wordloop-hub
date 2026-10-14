# Sinh bộ đề TOEIC Speaking + Writing (đề MỚI, đúng dạng ETS) bằng Gemini qua gemini-proxy -> learn/sw/sets.json
#   py tools/sw/gen_sets.py [--speaking 10] [--writing 10] [--out learn/sw/sets.json] [--examples <thư_mục_pages>]
# Không chép đề của bên thứ ba: --examples chỉ nạp vài mẩu ngắn làm MẪU PHONG CÁCH cho prompt (nội dung vẫn phải mới).
# Không tốn token Claude: chạy bằng Python, Gemini miễn phí qua proxy (có khoá phụ, tự chờ khi 429). Có tự kiểm cấu trúc, đề lỗi tự sinh lại.
import json, re, sys, os, time, random, urllib.request, urllib.error
ARGS = sys.argv[1:]
def opt(name, default):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default
N_S, N_W = int(opt('--speaking', 10)), int(opt('--writing', 10)); OUT = opt('--out', 'learn/sw/sets.json'); EX = opt('--examples', '')
CFG = open(os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'config.js'), encoding='utf-8').read()
URL = re.search(r'https://[a-z0-9]+\.supabase\.co', CFG).group(0); ANON = re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', CFG).group(0)
MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash']

def call(user, sysm):
    last = None
    for rnd in range(5):
        for m in MODELS:
            try:
                req = urllib.request.Request(URL + '/functions/v1/gemini-proxy', data=json.dumps({'model': m, 'sys': sysm, 'user': user}).encode(),
                                             headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON})
                return json.load(urllib.request.urlopen(req, timeout=170))['candidates'][0]['content']['parts'][0]['text']
            except Exception as e:
                last = e; time.sleep(3)
        time.sleep(20 + 10 * rnd)
    raise RuntimeError('gemini fail: %s' % last)

def jload(raw): return json.loads(re.search(r'\{[\s\S]*\}', raw).group(0))
def words(s): return len(re.findall(r"[A-Za-z0-9'’-]+", s or ''))

# ---- mẫu phong cách (tuỳ chọn): vài câu ngắn lấy từ trang tham khảo đã tải cục bộ, chỉ để giữ giọng văn/độ khó ----
STYLE = ''
if EX and os.path.isdir(EX):
    for fn in os.listdir(EX):
        if 'speaking' in fn and fn.endswith('.txt'):
            t = open(os.path.join(EX, fn), encoding='utf-8').read()
            qs = re.findall(r'Câu \d+: ([^\n]{40,220})', t); random.Random(7).shuffle(qs)
            STYLE = '\nGợi ý giọng văn/độ khó (KHÔNG chép, hãy viết nội dung hoàn toàn mới):\n' + '\n'.join('- ' + q for q in qs[:4])

SP_THEMES = ['company workshop', 'museum opening', 'store sale', 'airport announcement', 'software training', 'restaurant opening', 'fitness center', 'hotel services', 'community festival', 'job fair', 'bank services', 'library event']
SP_INTERVIEW = ['online shopping', 'commuting', 'watching television', 'eating out', 'travel', 'exercise', 'using technology', 'music', 'working hours', 'public transportation', 'books and reading', 'hobbies']
SP_INFO = ['conference agenda', 'train schedule', 'job interview schedule', 'price list of a print shop', 'class timetable', 'tour itinerary', 'office meeting plan', 'event program']
SP_PROBLEM = ['a delayed shipment', 'a double-booked meeting room', 'a billing error', 'a broken projector', 'a missing hotel reservation', 'a lost package', 'a scheduling conflict', 'a defective product']
SP_OPINION = ['working from home', 'online classes versus classroom classes', 'public transportation versus private cars', 'team projects versus individual work', 'learning from books versus learning on the Internet', 'job stability versus high salary']

def gen_speaking(i):
    rng = random.Random(100 + i)
    th = rng.sample(SP_THEMES, 2); iv = rng.choice(SP_INTERVIEW); inf = rng.choice(SP_INFO); pb = rng.choice(SP_PROBLEM); op = rng.choice(SP_OPINION)
    u = f'''Tạo 1 BỘ ĐỀ TOEIC SPEAKING mới, đúng dạng ETS, bằng tiếng Anh, nội dung hoàn toàn gốc. Chủ đề gợi ý: Q1 {th[0]}, Q2 {th[1]}, Q4-6 phỏng vấn về {iv}, Q7-9 {inf}, Q10 {pb}, Q11 {op}.{STYLE}
Trả JSON đúng schema:
{{"title":"<tên ngắn tiếng Việt>","tasks":[
 {{"q":1,"type":"read_aloud","text":"<đoạn thông báo/quảng cáo 55-80 từ, câu đủ ngắt nghỉ>"}},
 {{"q":2,"type":"read_aloud","text":"<đoạn 55-80 từ khác dạng (vd bản tin, giới thiệu diễn giả)>"}},
 {{"q":3,"type":"describe","scene":"<mô tả bằng chữ 1 bức ảnh đời thường 2-3 câu: ai, ở đâu, đang làm gì, vài chi tiết>"}},
 {{"q":4,"type":"respond","scenario":"Imagine that a company is doing research in your country. You have agreed to participate in a telephone interview about {iv}.","question":"..."}},
 {{"q":5,"type":"respond","scenario":"(giống q4)","question":"..."}},
 {{"q":6,"type":"respond","scenario":"(giống q4)","question":"<câu khó hơn, cần 30 giây>"}},
 {{"q":7,"type":"info","info":{{"title":"<tiêu đề>","rows":[["Time/Item","Detail"],["..",".."],["..",".."],["..",".."],["..",".."],["..",".."]]}},"question":"<câu hỏi hỏi 1 thông tin trong bảng>"}},
 {{"q":8,"type":"info","question":"<hỏi 1 thông tin khác trong cùng bảng>"}},
 {{"q":9,"type":"info","question":"<câu cần tóm tắt nhiều mục trong bảng, 30 giây>"}},
 {{"q":10,"type":"solution","message":"<tin nhắn thoại 85-120 từ của khách hàng/đồng nghiệp mô tả vấn đề và cần giúp>"}},
 {{"q":11,"type":"opinion","question":"<câu hỏi nêu ý kiến, dạng 'Do you agree or disagree...' hoặc 'Which do you prefer...'>"}}
],"models":{{"3":"<bài mẫu 50-70 từ>","4":"<mẫu 25-35 từ>","5":"<mẫu 25-35 từ>","6":"<mẫu 55-70 từ>","7":"<mẫu 25-35 từ>","8":"<mẫu 25-35 từ>","9":"<mẫu 55-70 từ>","10":"<mẫu 110-140 từ: xin lỗi, nêu lại vấn đề, đề xuất giải pháp, kết>","11":"<mẫu 120-150 từ: ý kiến, 2 lý do, ví dụ, kết>"}}}}
Các câu info cho q7-9 dùng chung bảng trong q7 (chỉ q7 có trường "info").'''
    return jload(call(u, 'Bạn là giám khảo soạn đề TOEIC Speaking của ETS. Chỉ trả 1 object JSON, không markdown.'))

def check_speaking(d):
    T = {t['q']: t for t in d.get('tasks', [])}
    if sorted(T) != list(range(1, 12)): return 'thiếu câu: %s' % sorted(T)
    for q in (1, 2):
        if not 40 <= words(T[q].get('text')) <= 100: return 'Q%d dài/ngắn lạ (%d từ)' % (q, words(T[q].get('text')))
    if words(T[3].get('scene')) < 12: return 'Q3 mô tả ngắn'
    for q in (4, 5, 6):
        if not T[q].get('question') or not T[4].get('scenario'): return 'Q%d thiếu câu hỏi/scenario' % q
    inf = T[7].get('info') or {}
    if len(inf.get('rows', [])) < 5: return 'bảng info ít dòng'
    for q in (7, 8, 9):
        if not T[q].get('question'): return 'Q%d thiếu câu hỏi' % q
    if words(T[10].get('message')) < 60 or not T[11].get('question'): return 'Q10/Q11 thiếu'
    m = d.get('models') or {}
    if any(not m.get(str(q)) for q in (3, 4, 5, 6, 7, 8, 9, 10, 11)): return 'thiếu bài mẫu'
    return ''

WR_SCENES = ['an office', 'a train station', 'a restaurant', 'a street market', 'a library', 'a construction site', 'a kitchen', 'a park', 'a store', 'an airport']
WR_EMAIL = ['a request for a schedule change', 'a customer complaint about a late delivery', 'an invitation to a company event', 'a request for information about a product', 'a reminder about a meeting', 'a job applicant asking about next steps', 'a supplier asking for payment', 'a coworker asking for help with a report']
WR_ESSAY = ['working from home', 'children using smartphones', 'learning English online or in a classroom', 'public transport versus cars', 'job stability versus high salary', 'teamwork versus individual work', 'shopping online versus in stores', 'studying abroad']

def gen_writing(i):
    rng = random.Random(500 + i)
    sc = rng.sample(WR_SCENES, 5); em = rng.sample(WR_EMAIL, 2); es = rng.choice(WR_ESSAY)
    u = f'''Tạo 1 BỘ ĐỀ TOEIC WRITING mới, đúng dạng ETS, bằng tiếng Anh, nội dung hoàn toàn gốc.
Q1-5: viết 1 câu từ 2 từ/cụm cho sẵn, dựa vào 1 bức ảnh. Không có ảnh thật nên mô tả BỨC ẢNH bằng chữ (scene) ở các bối cảnh: {sc}. Cặp từ phải 1 danh từ/cụm + 1 động từ/liên từ/giới từ (vd "desk / because", "carry / while").
Q6-7: trả lời email (mỗi email 60-90 từ), yêu cầu: dạng email: {em[0]} và {em[1]}.
Q8: bài luận ý kiến về: {es}.
Trả JSON:
{{"title":"<tên ngắn tiếng Việt>","tasks":[
 {{"q":1,"type":"sentence","words":["w1","w2"],"scene":"<mô tả ảnh 1-2 câu>"}}, ... (q1..q5),
 {{"q":6,"type":"email","email":{{"from":"..","to":"..","subject":"..","body":".."}},"directions":"Respond to the e-mail. In your response, ask TWO questions and make ONE request."}},
 {{"q":7,"type":"email","email":{{...}},"directions":"Respond to the e-mail. In your response, give TWO pieces of information and ask ONE question."}},
 {{"q":8,"type":"essay","question":"<câu hỏi bài luận ý kiến>"}}
],"models":{{"1":"<câu mẫu>","2":"..","3":"..","4":"..","5":"..","6":"<mẫu 90-120 từ>","7":"<mẫu 90-120 từ>","8":"<mẫu 300+ từ có mở bài, 2 lý do + ví dụ, kết>"}}}}'''
    return jload(call(u, 'Bạn là giám khảo soạn đề TOEIC Writing của ETS. Chỉ trả 1 object JSON, không markdown.'))

def check_writing(d):
    T = {t['q']: t for t in d.get('tasks', [])}
    if sorted(T) != list(range(1, 9)): return 'thiếu câu: %s' % sorted(T)
    for q in range(1, 6):
        if len(T[q].get('words', [])) != 2 or words(T[q].get('scene')) < 4: return 'Q%d lỗi từ/scene' % q
    for q in (6, 7):
        e = T[q].get('email') or {}
        if words(e.get('body')) < 35 or not e.get('subject') or not T[q].get('directions'): return 'Q%d email lỗi' % q
    if not T[8].get('question'): return 'Q8 thiếu'
    m = d.get('models') or {}
    if any(not m.get(str(q)) for q in range(1, 9)): return 'thiếu bài mẫu'
    return ''

def build(kind, n, gen, chk):
    out = []
    for i in range(1, n + 1):
        for attempt in range(4):
            try:
                d = gen(i); err = chk(d)
                if not err:
                    d['id'] = '%s%02d' % (kind[0], i); out.append(d); print(kind, i, 'OK', d.get('title', ''), flush=True); break
                print(kind, i, 'lỗi:', err, '-> thử lại', flush=True)
            except Exception as e:
                print(kind, i, 'ngoại lệ:', str(e)[:80], flush=True)
        else:
            print(kind, i, 'BỎ (không đạt sau 4 lần)')
    return out

def retitle(path):
    d = json.load(open(path, encoding='utf-8'))
    for i, st in enumerate(d.get('speaking', []), 1):
        T = {t['q']: t for t in st['tasks']}; m = re.search(r'about ([^.]+?)\.', T[4].get('scenario', '') or '')
        st['title'] = 'Phỏng vấn: ' + (m.group(1) if m else 'chủ đề %d' % i)
    for i, st in enumerate(d.get('writing', []), 1):
        T = {t['q']: t for t in st['tasks']}
        st['title'] = 'Email: ' + re.sub(r'\s+', ' ', (T[6]['email'].get('subject') or ''))[:26]
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('đã đặt lại tên đề', path)

if '--retitle' in ARGS:
    retitle(opt('--retitle', 'learn/sw/sets.json')); sys.exit(0)

if __name__ == '__main__':
    data = {'version': 1, 'note': 'Đề do AI sinh theo dạng ETS (tools/sw/gen_sets.py). Q3 Speaking và Q1-5 Writing dùng mô tả ảnh bằng chữ.',
            'speaking': build('speaking', N_S, gen_speaking, check_speaking), 'writing': build('writing', N_W, gen_writing, check_writing)}
    os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
    json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('đã ghi', OUT, '| speaking', len(data['speaking']), '| writing', len(data['writing']))
