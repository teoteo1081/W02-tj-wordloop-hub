# Đề prepedu (TOEIC S&W) + IELTS Speaking trong WordLoop

**Đề prepedu (TOEIC Speaking 10 đề, Writing 3 đề)** — nội dung có bản quyền của prepedu.com, KHÔNG nằm trong repo này.
- Lưu ở Supabase, bảng `sw_private_sets` (xem `sw_private_sets.sql`): RLS bật, không ai đọc được bảng trực tiếp; chỉ gọi hàm `sw_private_get(mã_phòng)` (cột `rooms`, mặc định `{TJ}`).
- `learn/sw/sw.js` (`privLoad`) gọi hàm này khi vào phòng; đề hiện ở ô Bộ đề là "📥 Từ prepedu.com …".
- Ảnh câu tả ảnh / viết câu: bucket `toeic`, đường dẫn `sw/p/<ngẫu nhiên>.jpg` (JPEG ≤720px).
- Cách nạp lại: tải trang bằng `tools/sw-research/fetch_page.py`, tách bằng Python (Speaking: 5 phần Q1–2/Q3–4/Q5–7/Q8–10/Q11; Writing: 4 cặp từ + ảnh, email, bài luận), rồi `insert … on conflict (id) do update` bằng Management API (token Supabase tạm, KHÔNG lưu vào file/git).
- Đề có `"fmt": 2` dùng cấu trúc chuẩn ETS theo ZIM: Q1–2 đọc to · Q3–4 tả ảnh · Q5–7 · Q8–10 (45s đọc bảng) · Q11; thời gian trong `TIME2` (sw.js). Đề AI cũ (fmt 1) giữ nguyên cấu trúc cũ.

**IELTS Speaking (`learn/sw/ielts.json`, `"fmt": 3`)** — 50 đề: chủ đề Part 1 + chủ đề thẻ Part 2 theo danh sách *IELTS Speaking Forecast Q3/2026* của prepedu.com; câu hỏi Part 1/3 và gợi ý thẻ Part 2 do AI soạn (không phải đề thật). Mở bằng khung `learn/sw/index.html?kind=speaking&exam=ielts` (nút 🎓 IELTS). Chấm AI theo band 0–9 (3/4 tiêu chí, không chấm phát âm).

**IELTS Writing (`ielts.json` → `writing`, `fmt: 3`)** — 13 đề: dạng Task 1 (loại biểu đồ) + Task 2 (loại bài luận) theo danh sách *IELTS Writing Latest Real Tests Q4/2025* của prepedu.com (trang chỉ có tên đề, nội dung thật cần đăng nhập). Biểu đồ vẽ bằng Pillow (`tools/sw/ielts_build_writing.py`, `ielts_charts.py`, dữ liệu minh hoạ do AI tạo) và đề Task 1/2 do AI soạn. Mở bằng `index.html?kind=writing&exam=ielts` (nút 🎓 IELTS Writing). Chấm AI theo band 0–9.
**Dọn audio mồ côi:** `tools/sw/prune_audio.py` (dry-run mặc định, `--delete` để xoá; cần token Supabase tạm qua biến môi trường SBP).
