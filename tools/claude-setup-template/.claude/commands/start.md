---
description: Khởi động phiên — đọc tài liệu, git log, tóm tắt việc dang dở
---
Khởi động phiên làm việc cho repo hiện tại. Làm theo thứ tự, chỉ ĐỌC, chưa sửa gì:

1. Đọc `CLAUDE.md`, rồi `README.md` (nếu dòng quá dài, đọc từng đoạn bằng `sed -n 'A,Bp' README.md | cut -c1-400`), rồi `TEAM_PROCESS.md`.
2. Đọc `HANDOFF.md` SAU CÙNG. Nó chỉ là checkpoint tạm: verify bằng lệnh thật (git/cơ sở dữ liệu/code) trước khi tin bất cứ gì trong đó.
3. Chạy `git fetch origin`, `git log --oneline -20`, `git status -sb`, `git branch -r` (xem agent khác có đang làm nhánh riêng không).
4. Tóm tắt bằng tiếng Việt dễ hiểu, ít thuật ngữ: ưu tiên hiện tại của chủ dự án, việc dang dở, câu hỏi đang chờ chủ dự án chốt.
5. Hỏi chủ dự án muốn làm gì trước. Đừng tự bắt tay vào việc tốn tiền/lớn khi chưa được duyệt.

Nhắc các luật trong CLAUDE.md của repo này (key, dữ liệu nhạy cảm, môi trường thật/thử).
