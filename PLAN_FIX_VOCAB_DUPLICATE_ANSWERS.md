# Kế hoạch sửa đáp án trùng trong game từ vựng

## Mục tiêu và phạm vi

Mỗi câu có các lựa chọn phân biệt rõ để người chơi không bị chấm sai vì hai ô cùng nghĩa. Phạm vi: logic tạo/hiển thị đáp án và kiểm thử; không sửa dữ liệu kho hoặc triển khai trong bước lập kế hoạch.

## Bằng chứng Git

- Lúc lập kế hoạch, checkout là `fix/board-mobile-bottom-padding` (`f3dbe3e`). Nay làm việc trên `fix/vocab-dup-answers`, đã chứa `4708ba9`.
- Đã có bản sửa cũ `5492386` trong checkout.
- Bản sửa bổ sung `4708ba9` có trên `origin/main` và `origin/fix/game-trap-dup`; lúc lập kế hoạch chưa có trong checkout, nay nhánh `fix/vocab-dup-answers` đã chứa nó (xác nhận bằng `git merge-base --is-ancestor`).
- Sau fetch, `origin/main` tại `f785ae1`. Chưa xác nhận phiên bản website đang chạy.

## Các bước thực hiện

1. Tạo ca tái hiện cố định cho `well-balanced`, `self-centred`, bẫy AI trùng nghĩa và từ cùng chữ nhưng khác nghĩa. Chứng minh kiểm thử bắt được lỗi cũ.
2. Rà bản sửa `4708ba9` trên nền mới nhất trước khi tích hợp. Đáp án thường và bẫy AI dùng chung bộ lọc chống trùng; nội dung hiển thị giữ đúng nghĩa của dòng đã chọn.
3. Hoàn thiện kiểm thử độc lập: kiểm tra chữ và nghĩa thực sự hiển thị. Test hiện có chưa kiểm tra đầy đủ trùng chữ; không chỉ dùng chính bộ lọc làm bằng chứng đúng.
4. Chạy ca cố định, mô phỏng 10.000 câu với dữ liệu chỉ đọc từ kho, thử giao diện chọn từ/chọn nghĩa/điền chỗ trống và đổi ngôn ngữ. Nếu không đủ ứng viên hợp lệ, ghi rõ hành vi thực tế và xử lý trong phạm vi sửa lỗi.
5. Chuẩn bị diff, kết quả kiểm thử và giới hạn cho review. Kiểm tra phiên bản website riêng trước khi kết luận bản sửa đã đến người chơi.

## Tiêu chí hoàn thành

- Không trùng chữ/nghĩa GIỐNG HỆT sau chuẩn hóa ở vi/en/es/zh. Ô gần nghĩa (không giống hệt) vẫn có thể xuất hiện (~12,85% câu gap, đo 24/10); TJ quyết giữ nguyên (WL-19).
- Đáp án đúng xuất hiện đúng một lần.
- Có bốn lựa chọn khi kho có đủ ứng viên hợp lệ.
- Đổi ngôn ngữ vẫn hiển thị đúng nghĩa đã dùng để lọc.
- Các ca từng lỗi vượt qua kiểm thử; không có hồi quy trong các chế độ đã nêu.

## Bằng chứng và audit

Đối chiếu diff, kết quả ca cố định, báo cáo mô phỏng và nội dung lựa chọn thực sự hiển thị, đặc biệt hai ca đã báo lỗi. Audit không chỉ tin kết quả của bộ lọc.

Khi thực thi, báo một trạng thái `SUCCESS`, `PARTIAL`, `FAILURE` hoặc `BLOCKED`; audit riêng trả `AUDIT_PASS`, `AUDIT_FAIL` hoặc `INSUFFICIENT_EVIDENCE`. Chỉ kết luận hoàn thành khi mọi tiêu chí quan trọng có đủ bằng chứng.

## Trạng thái

Đã chạy kiểm thử 24/10: `N=10000 node tools/qa/distractors_test.js` ra dupText/dupMean/leak/noCorrect/size = 0; well-balanced và self-centred 300 lần bốc đều 0 ô trùng. Chưa làm: thử UI từng chế độ, phòng nhiều người, kiểm phiên bản web đang chạy.
