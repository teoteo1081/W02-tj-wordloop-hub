# BOARD.md — bảng nhận việc (để nhiều AI không đè nhau)
> Điều phối hiện tại: Claude chính (phiên 2026-10-06). Điều phối là người duy nhất giao việc và sửa bảng này. Luật: xem `AGENTS.md` trong repo claude-setup.

## Đang làm
| Việc | Ai | Nhánh | File được đụng | Cập nhật | Trạng thái |
|---|---|---|---|---|---|
| Sửa nút "Mở bảng" báo chưa có Block | Claude chính (Thợ làm) | main (commit ed9756c, chưa push) | js/game.js, game.html, game-version.json | 2026-10-06 | chờ QA |
| QA chấm bản sửa nút Bảng | QA (agent độc lập) | — (chỉ đọc) | — | 2026-10-06 | đang chạy |

## Chờ quyết định của TJ
- Push bản sửa nút Bảng (ed9756c) lên main.
- Lỗ hổng inHist: tiếng chưa tắt khi đang xem lại (sửa 1 dòng?).
- Thử động B11 (tắt âm thanh) trên phòng ZZ_QA_* (ghi dữ liệu Supabase thật).
- Dọn 6 file trong tools/claude-setup-template/ (giữ wordloop-commands/).

## Đã xong
- Dừng âm thanh khi Kết thúc / về phòng chờ · 2026-10-06 · 506608d · QA: code ĐẠT, thử động CHƯA THỬ.
