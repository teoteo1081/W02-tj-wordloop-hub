# 🎯 EXAMS_PLAN.md — Thêm hub đề thi EA / IELTS / Digital Marketing vào game (TJ chốt 2026-10-04)

Bộ nhớ quyết định cho dự án này. Điểm móc vào `game.js` (đã điều tra): `docs/EXAMS_HOOKS.md`. Cập nhật tại đây khi có chốt mới; việc nhiều-phiên còn dang dở cũng được trỏ từ `README.md` mục "Việc còn dang dở". Đội và cổng kiểm tra: `docs/TEAM.md`.

## 0. Trạng thái
| Hạng mục | Trạng thái |
|---|---|
| 87 PDF bài học EA | ✅ Đã tải lên Supabase `toeic/lib/EA2025/Part I·II·III/…` (hiện trong 📁 Tài liệu của bảng). Công cụ: repo L04-ea-2025 `tools/upload_pdfs_to_supabase.py` |
| Hub IELTS | ✅ Đã tạo hàng `hubs`: id `hub_ielts_claude`, tên **"IELTS - Claude"**, sort 10 (trống). 2 notebook IELTS cũ vẫn ở hub NGÔN NGỮ, không đụng. Xóa: `DELETE hubs WHERE id='hub_ielts_claude'` |
| Cổng kiểm tra + đội | ✅ `tools/gate*.{sh,py,js}`, `docs/TEAM.md`, `.claude/agents/` |
| Kiến trúc móc vào game | ⏳ Điều tra `game.js` (hub TOEIC dựng trong `paintTestHub()`), đề xuất file riêng `js/exams.js` |
| Nội dung **Digital Marketing** | ✅ `data/exams/dm_items.json` — 102 câu (P1 36 · P2 36 · P3 12 · P4 8 · P5 10), qua `gate_items.py` + **2 vòng Tuân thủ độc lập** ("ĐƯỢC NẠP"). **Chưa nạp vào Supabase** (chờ code hub + TJ đồng ý). Tồn đọng: đáp án đúng hay có chữ số/"kiểm tra" hơn đáp án nhiễu (P3/P5); 27 đoạn P3/P4/P5 ngắn <60 từ; "Trượt dốc" chưa mang trạng thái giữa các bước; thiếu 1 tình huống bait-and-switch ở mức tà; nên tra thủ công tên hư cấu có thể trùng thương hiệu nhỏ (An Nhiên, Mộc An, Nhà Gọn, Bé Khỏe, Mầm Sáng, Nụ Cười, Hoa Lụa) |
| Nội dung IELTS Writing + Speaking | 🟡 bản nháp `data/exams/drafts/ielts_ws_bank.draft.json` (chưa kiểm toán) |
| Nội dung EA | ⏳ 378 câu đã chuyển khuôn; 195 câu thiếu lời giải → giao Biên soạn; **không commit lên repo công khai** (gần sách Gleim) |
| Nội dung IELTS Reading + Listening | ⏳ chưa soạn |
| Đề IELTS Listening/Reading chính thức | ⛔ Mạng cloud chặn `ielts.idp.com`, `takeielts.britishcouncil.org`, `ielts.org`. TJ tự tải rồi đưa vào 📁 Tài liệu thư mục `IELTS/`, HOẶC thêm 3 tên miền vào Allowed domains rồi mở phiên mới. Kho `toeic` công khai → bản quyền do TJ quyết |

## 1. Nguyên tắc chung
- Mỗi môn = 1 hub đề thi trong game; câu hỏi nằm bảng `test_items` với `exam` = `ea` | `ielts` | `dm` (mọi truy vấn TOEIC có `.eq("exam","toeic")` nên **không bị ảnh hưởng**). `id` có tiền tố `ea_` / `ielts_` / `dm_`. Lời giải đủ vi + en, sau đó dịch zh + es bằng `tools/toeic_i18n_add.js` (OpenAI qua `openai-proxy`) như quy định cho đề thi.
- **Bỏ tùy chọn không dùng cho từng môn** (TJ: "không xài thì bỏ cho đỡ rối"). Bảng bên dưới là bản chốt.
- Thêm môn = **file mới `js/exams.js`** (định nghĩa từng môn + vẽ form theo môn), `game.js` chỉ thêm vài điểm móc nhỏ. Mỗi lần đổi `.js/.css` nhớ tăng `?v=` (cổng 1 chặn nếu quên). Mỗi giai đoạn 1 PR; `game.js` đang có người sửa hằng ngày → luôn lấy `main` mới nhất làm gốc.
- Từ vựng + bài học của IELTS/DM đi vào **WordLoop** (notebook trong hub), không vào game đề.

| Tùy chọn | TOEIC | EA | IELTS | Digital Marketing |
|---|---|---|---|---|
| Phạm vi | Full / LC / RC / Part | Thi thử / Từng Part (I·II·III) / Từng chương | Reading / Listening / Writing / Speaking | Không có — chơi theo vòng |
| Audio đề | ✅ | ❌ | ✅ chỉ Listening | ❌ |
| Part 1–7, "câu 1–200" | ✅ | ❌ (3 Part, 100 câu/Part) | ❌ (40 câu/kỹ năng) | ❌ |
| Chủ điểm | ngữ pháp | chương (SU) | dạng câu hỏi | kênh / kỹ thuật |
| Điểm | điểm TOEIC | % đúng | **band 0–9** | điểm theo vòng |
| Kiểu chơi (thi thật/tự do/Kahoot/đua) | ✅ | ✅ | R+L ✅; W+S chỉ chơi một mình | ✅ Kahoot + đua |

## 2. EA
Nguồn: 378 câu có lời giải trong repo L04-ea-2025 (`game/data/lessons-data.js`, chia theo `lesson`/`part` 1–3) + Research Sprint + 15 tình huống (đã đổi tên khách sang tên Mỹ). Thi EA thật: mỗi Part 100 câu/3,5 giờ. Chỉ nạp **câu hỏi** (từ vựng EA đã có trong hub EA2025).

## 3. IELTS — đủ 4 kỹ năng
| Kỹ năng | Thật | Trong game | Chấm |
|---|---|---|---|
| 🎧 Listening | 30′ · 40 câu · 4 Section | audio (file chính thức nếu có; tạm giọng máy của trình duyệt) | tự động |
| 📖 Reading | 60′ · 40 câu · 3 bài | trắc nghiệm, Đúng/Sai/Không có TT, chọn tiêu đề, điền từ | tự động |
| ✍️ Writing | 60′ · Task 1 (20′) + Task 2 (40′) | tự viết, đếm giờ | **OpenAI** theo 4 tiêu chí (TR/TA, CC, LR, GRA) → band ước tính + lỗi + bản viết lại |
| 🎙️ Speaking | 11–14′ · Part 1/2/3 | máy đọc câu hỏi, thẻ gợi ý Part 2 (1′ chuẩn bị), người chơi nói → nhận dạng giọng nói → chữ | **OpenAI** (Fluency, Lexical, Grammar). **Phát âm AI KHÔNG chấm chuẩn được** — ghi rõ trên màn hình |
- Band từng kỹ năng 0–9; tổng = trung bình 4 kỹ năng làm tròn 0,5 (như thi thật). Điểm W/S ghi **"AI ước tính"**. Quy đổi số câu đúng → band (ước lượng, kiểm lại bảng chính thức): Reading ~ 39–40=9 · 37–38=8,5 · 35–36=8 · 33–34=7,5 · 30–32=7 · 27–29=6,5 · 23–26=6 · 19–22=5,5 · 15–18=5; Listening ~ 39–40=9 · 37–38=8,5 · 35–36=8 · 32–34=7,5 · 30–31=7 · 26–29=6,5 · 23–25=6 · 18–22=5,5 · 16–17=5.
- **OpenAI (TJ chốt 2026-10-04)**: qua `openai-proxy` có sẵn, **không cần deploy**. ~1–2 cent/lần chấm (kiểm lại giá hiện tại). Hạn mức: gửi `user_id` + `block_id` riêng mỗi lần chấm (vd `ielts_w_<ngày>_<n>`) → tài khoản thường tối đa **3 lượt AI/ngày** (chung với AI viết bài đọc), Admin không giới hạn. Không gọi OpenAI trực tiếp từ sandbox (`api.openai.com` bị chặn).
- WordLoop hub **"IELTS - Claude"** sẽ có notebook (tên đuôi "Claude"): Reading skills · Writing Task 1 · Writing Task 2 · Speaking · Listening · Từ vựng theo chủ đề. Mỗi Block = bài đọc + 10 từ. Có sẵn trong repo L06-ielts: 600 từ + 50 bài đọc kiểu IELTS (`IELTS_Business_Vocab_600.html`).

## 4. Digital Marketing — game "Thám tử Marketing" (không phải đề thi)
Mục tiêu (TJ): giúp người học hiểu kỹ năng **"thu hút" vs "lừa dối"** — **chính đạo / xám đạo / tà đạo** — theo **tình huống thực tế ở VN** (Facebook, Zalo, TikTok, Shopee, Google, Pinterest, nhóm FB, KOL…). Khóa nền: repo L02-digital-marketing-beginner (VN; chưa có phần đạo đức → đây là phần mới; bài học viết dạng Block trong hub DIGITAL MARKETING).

**4 câu kiểm tra dùng cho mọi tình huống:** (1) **Sự thật**: điều quảng cáo nói có đúng? (2) **Minh bạch**: có giấu điều khoản/giấu "đây là quảng cáo"? (3) **Tự nguyện**: khách tự quyết và rút lui dễ? (4) **Hậu quả**: nếu khách biết hết sự thật, họ còn mua không?
- 🟢 **Chính đạo** (thu hút): đúng sự thật + minh bạch + tôn trọng lựa chọn. 🟡 **Xám đạo**: không nói dối trắng trợn nhưng lách/giấu/nhấn quá, vùng mơ hồ. 🔴 **Tà đạo** (lừa dối): nói dối/gây hại/vi phạm luật hoặc điều khoản nền tảng.
- 5 chế độ = 5 `part`: 1 🕵️ Phân loại · 2 🔍 Nhận ra chiêu (kỹ thuật) · 3 ⚖️ Tư vấn sếp/khách · 4 🛝 Trượt dốc (chiến dịch 5 bước, mỗi bước "lách" thêm) · 5 📊 Bắt số liệu giả.
- Chủ đề bắt buộc có: **seeding**, **pinterest**, **compliance**, đánh giá giả, đồng hồ đếm ngược giả, bait-and-switch, mạo danh chuyên gia/KOL không công bố quảng cáo, giấu phí/dark pattern hủy gia hạn, clickbait, spam/link bẩn, tin nhắn Zalo hàng loạt…
- Mỗi tình huống: **hậu quả thật** (khóa tài khoản quảng cáo, phạt hành chính, mất uy tín, hoàn tiền) + **cách làm lại cho chính đạo** vẫn thu hút. Trích chính sách/luật phải ghi "kiểm tra lại bản mới nhất".
- **Hàng rào nội dung:** viết theo hướng *nhận diện – hậu quả – cách làm đúng*. **KHÔNG** viết hướng dẫn thực hiện chiêu lừa (cách mua đánh giá giả, dựng bot/click farm, code cloaking, lách hệ thống phát hiện…). `compliance.md` kiểm lại từng bộ nội dung.
- Dữ liệu: `exam='dm'`, `part` 1–5, `tag` = tên kỹ thuật, `passage` = nội dung tình huống (tiếng Việt), thêm cột/ trường `level` (chinh|xam|ta) trong `i18n`/`explain` nếu bảng chưa có cột riêng (hỏi trước khi đổi bảng).

## 5. Thứ tự làm
1) EA → 2) Digital Marketing → 3) IELTS Reading + Listening → 4) IELTS Writing + Speaking (AI). Mỗi bước: Điều tra → Thợ code + Biên soạn → Auditor → QA/hồi quy → xin TJ → gộp → hậu kiểm.

## 6. Việc đang chờ TJ
- Cung cấp/nhận file IELTS (xem mục 0). - Cho phép PR từng giai đoạn vào `main`. - Có muốn tạo notebook trong hub "IELTS - Claude" ngay không.
