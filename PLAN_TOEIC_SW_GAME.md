# PLAN_TOEIC_SW_GAME.md — ý tưởng game TOEIC Speaking (đề xuất 2026-10-09, chờ TJ chọn)

> **Đối chiếu 2026-10-20:** đây là thiết kế/đề xuất lịch sử, không phải roadmap hiện tại. Hành động, trạng thái và thứ tự chờ TJ chọn nằm tại [README — WL](README.md#việc-còn-dang-dở); bản đồ nguồn ở [PLAN_TONG](PLAN_TONG.md). Số liệu DB/Storage/quyền ghi ngày 08–09/10 chưa đo lại. Không thực hiện lệnh/nhập sách hay đổi quyền từ ghi chú cũ.
> **Code hiện có:** TOEIC S&W, IELTS Speaking/Writing và lớp ở [learn/sw/sw.js](learn/sw/sw.js), [js/learn.js](js/learn.js), [js/swclass.js](js/swclass.js). Có bộ đề JSON trong repo; không suy ra bảng DB `sw_tasks`/`sw_attempts` đã được tạo. Các trò/mô hình dữ liệu đề xuất dưới đây chưa mặc nhiên được duyệt/triển khai. Receiver `tjwl-game-show` đã có trong [js/gamelayer.js](js/gamelayer.js); lỗi điều hướng cũ cần tái hiện trước sửa.


> Nguồn: sách NTV TOEIC Speaking (bản scan, 292 trang) + sách đáp án + audio 268 file (~136 MB). Sách và audio có bản quyền: KHÔNG đưa lên bucket public `toeic`, KHÔNG commit vào repo. Khi làm game, dùng thư mục máy cục bộ (đã gitignore) hoặc bucket private + link có chữ ký.
> Checkpoint 2026-10-09 trong `HANDOFF.md` chỉ là lịch sử; trạng thái hiện tại xem roadmap WL-05/WL-15 trong README.

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

## Mô hình dữ liệu đề xuất 09/10 (trạng thái DB chưa kiểm lại)
- Bảng `sw_tasks` (test, part, đề, ảnh, thời gian, đáp án mẫu, tiêu chí) và `sw_attempts` (user, bản chữ, điểm, nhận xét; không lưu ghi âm hoặc xoá sau 30 ngày). Cần PAT của TJ để tạo (nhắc thu hồi sau).
- Chấm điểm bằng AI qua `gemini-proxy` (miễn phí) hoặc `openai-proxy` (có phí, hỏi TJ trước).

## Đề xuất làm mẫu đầu tiên
Part 1 Shadowing: ít code nhất vì `readalong.js` đã có chấm từng từ.
