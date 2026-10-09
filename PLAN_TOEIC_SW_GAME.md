# PLAN_TOEIC_SW_GAME.md — ý tưởng game TOEIC Speaking (đề xuất 2026-10-09, chờ TJ chọn)

> Nguồn: sách NTV TOEIC Speaking (bản scan, 292 trang) + sách đáp án + audio 268 file (~136 MB). Sách và audio có bản quyền: KHÔNG đưa lên bucket public `toeic`, KHÔNG commit vào repo. Khi làm game, dùng thư mục máy cục bộ (đã gitignore) hoặc bucket private + link có chữ ký.
> Trạng thái làm việc xem `HANDOFF.md` mục CHECKPOINT 2026-10-09.

## 6 dạng đề → 6 trò chơi
| Part (câu) | Trò | Cơ chế |
|---|---|---|
| 1. Read a Text Aloud (Q1–2) | 🎤 Shadowing chấm sao | Nghe mẫu → đọc theo → ghi âm. Tận dụng `js/readalong.js` (sao, vòng %, từ sai tô đỏ). |
| 2. Describe a Picture (Q3) | 🖼 Ba câu vàng | Ảnh trên Bảng, 30 giây chuẩn bị; 3 ô *ai/ở đâu → đang làm gì → chi tiết* kéo thả cụm có sẵn rồi nói. |
| 3. Respond to Questions (Q4–6) | ⏱ Phản xạ 15 giây | Nghe câu hỏi, đếm ngược, nói; chấm độ trôi chảy (không dừng > 2 giây). |
| 4. Information Provided (Q7–9) | 🔎 Thám tử lịch trình | Tìm đúng giờ/ngày/số tiền trong bảng, rồi nói thành câu. |
| 5. Propose a Solution (Q10) | 🛠 Giải quyết khách hàng | Khung xin lỗi → nêu vấn đề → đề xuất → kết; đủ bước mới mở ô tiếp. |
| 6. Express an Opinion (Q11) | 🗣 Xây tháp ý kiến | Quan điểm → lý do 1 → ví dụ → lý do 2 → kết; điểm thưởng cho từ nối. |

## Chế độ chung
- **Thi thật:** đúng thời gian chuẩn bị/trả lời của đề (bảng tr.5 sách), không nghe lại, điểm ước tính 0–200.
- **Lớp:** host mở Bảng, một người nói, cả phòng chấm sao, host chốt.
- **Sửa lỗi kiểu HelloTalk:** hai khối "Bạn nói" (đỏ gạch) / "Gợi ý" (xanh), thiết kế đầy đủ ở README mục "💡 Ý TƯỞNG CHỜ LÀM".
- **Thử thách hằng ngày:** 1 câu Part 3 + 1 câu Part 5, chuỗi ngày.
- **Sổ cụm hay dùng:** cụm nói đúng → ⭐ Ôn riêng, ôn theo chu kỳ Tony Buzan.

## Dữ liệu cần (chưa tạo)
- Bảng `sw_tasks` (test, part, đề, ảnh, thời gian, đáp án mẫu, tiêu chí) và `sw_attempts` (user, bản chữ, điểm, nhận xét; không lưu ghi âm hoặc xoá sau 30 ngày). Cần PAT của TJ để tạo (nhắc thu hồi sau).
- Chấm điểm bằng AI qua `gemini-proxy` (miễn phí) hoặc `openai-proxy` (có phí, hỏi TJ trước).

## Đề xuất làm mẫu đầu tiên
Part 1 Shadowing: ít code nhất vì `readalong.js` đã có chấm từng từ.
