# PLAN_TONG.md — kế hoạch tổng WordLoop (tổng hợp 2026-10-14)

> Gộp từ `PLAN_LUONG_HOC.md` (đề xuất 2026-10-08), `PLAN_TOEIC_SW_GAME.md`, `README.md`, `HANDOFF.md` và các quyết định trong phiên 2026-10-13/14.
> Mục nào ghi "đề xuất" là CHƯA được TJ duyệt. Chi tiết kỹ thuật từng việc: xem file nguồn tương ứng.

## 1. Đã xong gần đây
- **ETS 2023 Test 1–10** nạp đủ 2.000 câu (Listening + Reading), audio có mốc từng câu (theo khoảng lặng thật), lời giải tiếng Việt 1.998/2.000, lời thoại có mốc từng lượt nói (`i18n.scr`) 996/1000 câu Listening. Quy trình + công cụ: `tools/ets2023/QUY_TRINH_NAP_DE.md`.
- **Game thi TOEIC:** nhóm 3 câu Part 3–4 gọn vừa màn (xếp theo bề rộng khung, `@container`), xem trước nhóm sau chọn trước được, đọc trước 25s ở nhóm đầu Part 3/4, Kahoot là kiểu chơi mặc định (câu tự chuyển theo giờ chuẩn), ghim bảng Quản trị, dòng đường dẫn đề ("ETS 2023 › Test 5 › Listening › Part 4"), chơi lại ván TOEIC từ Lịch sử.
- **Hạ tầng AI:** `gemini-proxy` có khoá phụ `GEMINI_API_KEY_2` (tự chuyển khi 429).

## 2. Nền tảng cần sửa trước (giai đoạn 0)
- Chuyển giáo trình gốc EA khỏi bucket công khai `toeic` (`lib/EA2025`) sang bucket riêng `library`, sửa Bảng.
- Sửa nút "mở bài học" EA (`learn/ea/index.html` `lessonBase`, đang trỏ repo L04 PRIVATE).
- TJ tự chạy SQL cho phép xoá file tạm (`toeic_tmp_delete`, xem README mục 1) + dọn `lib/_tmp/ZZ_QA_PROBE/`.
- Theo dõi dung lượng Supabase (từng 911/1024 MB; kho 3 tầng R2 xem `SUPABASE_STORAGE.md`).

## 3. Khung "Khoá học" và điều hướng (đề xuất, chờ duyệt)
- Mỗi Hub = một Khoá học, trang riêng, luồng 4 bước **Học → Ôn → Luyện → Chơi chung**; nối tiến độ EA/Marketing Quest lên Supabase để Journey đếm chung.
- Màn **Quản trị** cho TJ (người dùng, phòng, kho/chi phí, tách quyền Host).
- Hấp dẫn: chuỗi ngày, thử thách hằng ngày, huy hiệu, xếp hạng theo khoá.
- **Điều hướng thẻ (TJ chốt hướng 2026-10-14):** GIỮ NGUYÊN các thẻ hiện tại, chỉ THÊM thẻ mới; thanh thẻ chia hàng theo nhóm: Từ vựng / TOEIC / IELTS / Khác (EA, Digital Marketing, GA4, Git & GitHub…); thêm môn mới = thêm 1 dòng cấu hình. Cách nhìn "Theo kỹ năng" (nghe/đọc/viết/nói xuyên kỳ thi) để SAU, khi đã có S&W và IELTS.

## 4. TOEIC Speaking & Writing và IELTS (đã bàn, CHƯA làm)
- Thẻ mới **"TOEIC S&W"** cạnh thẻ TOEIC. Màn nhỏ: chỉ hiện Đề / Part / Bắt đầu, phần còn lại thu gọn; làm bài ở chế độ tập trung (ẩn thanh phụ).
- Thứ tự: **bộ chấm Viết** (dán bài → AI chấm theo tiêu chí, hiện KHOẢNG điểm ước tính; đề do AI sinh, sách NTV/study4 chỉ làm bộ mẫu hiệu chỉnh) → game Viết (đếm giờ chuẩn, bảng điểm) → **Nói Part 1–2** (tận dụng `js/readalong.js`) → các Part Nói còn lại → thi thử đủ bộ + chế độ lớp.
- Điểm Nói/Viết là ƯỚC TÍNH do AI; phát âm/ngữ điệu không chấm thật được (Web Speech chỉ cho chữ). Quyết sớm: Nói chỉ hỗ trợ Chrome máy tính/Android, hay ghi âm gửi Gemini (cần sửa proxy nhận âm thanh).
- **IELTS**: một thẻ có Nghe | Đọc | Viết | Nói bên trong; Viết/Nói dùng lại bộ chấm TOEIC (4 tiêu chí, band 0–9; Writing Task1 1/3 – Task2 2/3); Nghe–Đọc (dạng câu mới: điền chỗ trống, nối tiêu đề, T/F/NG…) làm sau cùng hoặc bỏ. Cần chốt Academic hay General.
- Dự trù token Claude: TOEIC S&W ≈ 250–350k, IELTS thêm ≈ 200–250k.
- Nguồn tham khảo TJ chỉ định: study4 (TOEIC Writing có đáp án; cấu trúc đề IELTS) — đọc bằng Python (curl + OCR ảnh), không để Claude đọc ảnh.

## 5. Phòng và Bảng (README, theo thứ tự nên làm)
1. Tab "🖍 Bảng trắng" riêng (bút + ô chữ). 2. Phòng học 24/24 không cần host. 3. Nút "Theo mọi người" cho bài đọc. 4. Chia sẻ ảnh/file trên iPhone. 5. Sửa lỗi Nói/Đọc kiểu HelloTalk. 6. Kiểm trên máy thật (voice iPhone, ghi âm, thanh bút, CC, file lớn).
- Đã chốt: KHÔNG bật TURN Cloudflare (có phí).

## 6. Nội dung và quy trình nạp đề
- **Bộ skill `exam-ingest`:** gom công cụ Python (`tools/ets2023/`) thành các bước (stage) chạy độc lập, có cấu hình theo kỳ thi (TOEIC, sau này IELTS…), README tự chạy tay khi hết token; Claude chỉ chạy lệnh + đọc báo cáo ngắn.
- **ETS 2025:** nạp bằng skill trên (nguồn đặt ở `Desktop\TJ\_staging\ETS 2025\TEST N\`, cùng cách đặt tên như 2023).
- Việc nội dung: EA Part I SU04–14; PDF English File lên bucket `library`; hub IELTS/English File đang trống.

## 7. Thứ tự đề xuất
1. Nền tảng (mục 2) + xếp thẻ theo nhóm + thẻ S&W (rỗng, "sắp có").
2. Skill `exam-ingest` + ETS 2025 (làm ở session mới).
3. Bộ chấm Viết → Nói Part 1–2.
4. Khung Khoá học, Quản trị, nối tiến độ.
5. Tính năng Phòng/Bảng, IELTS Viết–Nói, phần còn lại (cách nhìn theo kỹ năng, IELTS Nghe–Đọc: chỉ làm nếu cần).

## 8. TJ cần quyết
- Tên gọi (Hub → "Khoá học"; "Góc tự học" → "Luyện") và khoá làm mẫu đầu (EA hay CIA).
- Nối tiến độ Quest lên Supabase? Tách quyền Host?
- IELTS Academic hay General? Nói: chỉ Chrome/Android hay ghi âm gửi Gemini?
