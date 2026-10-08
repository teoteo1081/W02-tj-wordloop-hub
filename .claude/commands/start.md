---
description: Khởi động phiên — đọc tài liệu, git log, tóm tắt việc dang dở
---
Khởi động phiên làm việc cho repo TJ WordLoop Hub. Làm theo thứ tự, chỉ ĐỌC, chưa sửa gì:

1. Đọc `CLAUDE.md`, rồi `README.md` (mục "Việc còn dang dở" dòng rất dài — dùng `sed -n 'A,Bp' README.md | cut -c1-400` nếu Read báo quá cỡ), rồi `TEAM_PROCESS.md`.
2. Đọc `HANDOFF.md` SAU CÙNG. Nó chỉ là checkpoint tạm: verify bằng lệnh thật (git/Supabase/code) trước khi tin bất cứ gì trong đó.
3. Chạy `git fetch origin`, `git log --oneline -20`, `git status -sb`, `git branch -r` (xem agent khác — L02/L04 — có đang làm nhánh riêng không).
4. Tóm tắt bằng tiếng Việt dễ hiểu, ít thuật ngữ: ưu tiên hiện tại của TJ, việc dang dở, câu hỏi đang chờ TJ chốt.
5. Hỏi TJ muốn làm gì trước. Đừng tự bắt tay vào việc tốn tiền/lớn khi chưa được duyệt.

Nhắc luật: không dán API key vào file client; không commit file đề ETS; test game chỉ dùng phòng `ZZ_QA_*`, không vào phòng "TJ".
