# BOARD.md — bảng nhận việc (để nhiều AI không đè nhau)
> Luật bảng và vai trò: xem `AGENTS.md` trong repo `claude-setup` (Private, teoteo1081). Điều phối hiện tại: Claude chính (phiên 2026-10-06, máy local TJ, đã dừng vì TJ về nhà). AI mới: đọc `CLAUDE.md`, `README.md`, `TEAM_PROCESS.md`, rồi `HANDOFF.md` (mục CHECKPOINT 2026-10-06 và BỔ SUNG CUỐI PHIÊN) và VERIFY bằng git/curl trước khi tin.

## Đang làm
| Việc | Ai | Nhánh | File được đụng | Cập nhật | Trạng thái |
|---|---|---|---|---|---|
| (trống: phiên 2026-10-06 đã đẩy hết lên main, không còn việc dở trong cây làm việc) | | | | 2026-10-06 | — |

## Việc kế tiếp (theo thứ tự)
1. Công cụ Text: kéo vẽ ô, chữ tự co giãn vừa ô, avatar người gõ, kéo di chuyển, kéo góc đổi cỡ (spec chi tiết trong HANDOFF.md).
2. Nút "Game →" chơi MỘT MÌNH cho người chơi trên dòng Lịch sử (cần thiết kế chế độ solo cục bộ).
3. Làm đẹp thanh công cụ dọc; sửa lỗi UI 390px do QA tìm (✕ đè tiêu đề, thanh nút đọc bị cắt, nút nhỏ hơn 36px).
4. Hỏi TJ: có làm "người chơi tự lên host thay khi host mất hẳn" không.

## Chờ quyết định hoặc chờ TJ
- Chữ trên bảng: căn trái, tiêu đề không vàng, font (Atkinson Hyperlegible?).
- PDF mờ: cần 1 file mẫu để thử nén lại hoặc OCR.
- Dọn 6 file thừa trong tools/claude-setup-template/ (giữ wordloop-commands/): chờ TJ nhắn "cho phép xoá".
- Viền vàng bên trái bảng: cần ảnh khoanh đỏ.

## Đã xong (gần nhất, đã lên web thật)
- Bảng màu bút 10 màu và hộp thoại xác nhận thân thiện · board v94, css v193.
- Nút Game mờ khi đọc sách/PDF · board v93. Chia sẻ màn hình hiện cho người xem + icon camera · board v92.
- Pop-up Quản lý người chơi · game v249. Tra từ im lặng khi đang đọc, thử lại và báo lý do · board v90–v91.
