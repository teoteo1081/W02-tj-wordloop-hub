---
description: Đẩy lên main đúng quy trình (chỉ chạy khi TJ bảo push)
---
Chỉ làm khi TJ đã yêu cầu push. Thứ tự:

1. Chạy quy trình `/bump` (kiểm `?v=`, `GAME_VER`, version starter).
2. `git status` + `git diff --stat`: chắc chắn không có key/token, file đề ETS, file `.bak-*`, `keys.local.js`.
3. Commit (tiếng Việt, mô tả ngắn việc đã đổi).
4. Push `main` bằng MỘT LỆNH RIÊNG: `git push origin main` (đừng gộp nhiều nhánh — GitHub Pages sẽ bỏ qua build).
5. Nhắn TJ link web live https://teoteo1081.github.io/W02-tj-wordloop-hub/ + việc TJ cần tự kiểm; nói rõ phần nào đã/chưa thử.
6. Nếu vừa làm xong việc trong backlog: cập nhật mục "Việc còn dang dở" của README.md cho khớp thực tế.
