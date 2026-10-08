---
description: Đọc backlog trong README.md ("Việc còn dang dở") và làm tiếp việc chưa xong
argument-hint: [từ khoá hoặc số thứ tự việc, bỏ trống = tự chọn theo ưu tiên]
---
Làm tiếp việc dang dở trong repo (backlog thường ở `README.md` mục "Việc còn dang dở"/"TODO"; nếu repo đặt chỗ khác thì theo CLAUDE.md). Yêu cầu thêm của chủ dự án (nếu có): $ARGUMENTS

## Bước 1 — Đọc backlog (chỉ đọc)
- Nếu mục backlog có dòng rất dài: dùng `grep -n '^- ' README.md | cut -c1-300` để lấy mục lục, rồi `sed -n 'A,Bp' README.md | cut -c1-600` để đọc từng đoạn. Đừng dùng Read cả file.
- Đọc thêm `TEAM_PROCESS.md` mục 4 ("Việc đang chờ chủ dự án") và `HANDOFF.md` (chỉ là ghi chú tạm — verify bằng git/cơ sở dữ liệu/code trước khi tin).
- `git log --oneline -15` để biết việc nào đã xong nhưng README chưa gạch.

## Bước 2 — Chọn việc
- Ưu tiên hiện tại của chủ dự án (ghi đầu mục backlog) đứng trước; việc ghi "ưu tiên THẤP" đứng sau. Nếu `$ARGUMENTS` có chỉ rõ việc nào thì làm việc đó.
- BỎ QUA việc ghi "chờ chốt/duyệt/brainstorm", việc cần PAT/token mới, việc của người khác (việc chủ dự án tự làm).
- Lập danh sách ngắn (3–5 việc) theo thứ tự, mỗi việc 1 dòng: việc gì · vì sao chọn · ước tính chi phí (token/USD/dung lượng lưu trữ) · rủi ro.

## Bước 3 — Cổng tiền kiểm (theo TEAM_PROCESS.md)
- Việc nhỏ, chỉ sửa code/tài liệu, không tốn tiền -> làm luôn việc số 1.
- Việc lớn, tốn tiền API, ghi hàng loạt vào cơ sở dữ liệu, hoặc chủ dự án chưa chốt hướng -> DỪNG, trình đề xuất + mẫu nhỏ, HỎI chủ dự án trước. Không tự quyết thay.
- Trước khi sửa dữ liệu: backup. Trước khi sửa file: `git fetch` + xem nhánh agent khác để khỏi đè việc nhau.

## Bước 4 — Làm
- Tuân thủ mọi luật trong CLAUDE.md của repo (quy ước cache/phiên bản, key, dữ liệu nhạy cảm, môi trường thật/thử).
- Kiểm bằng cách phù hợp (test, chạy thử, QA) trước khi báo xong. Người làm không tự chấm bài mình.

## Bước 5 — Cập nhật & báo cáo
- Sửa mục tương ứng trong `README.md` cho khớp thực tế (việc xong thì ghi ngày + commit; việc còn dở thì ghi rõ tới đâu). Không để README lệch thực tế.
- Không commit/push nếu chủ dự án chưa bảo .
- Báo bằng tiếng Việt dễ hiểu, ít thuật ngữ: đã làm gì, đã thử thật gì, CHƯA thử gì, chi phí thật, còn treo gì, việc kế tiếp đề xuất.
