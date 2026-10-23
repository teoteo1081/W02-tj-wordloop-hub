---
description: Đưa nhánh nội dung/tài liệu đã duyệt lên main đúng quy trình (chỉ chạy khi TJ bảo push)
---
Chỉ làm khi TJ đã yêu cầu push. `main` chỉ nhận việc NỘI DUNG (CLAUDE.md, mục "Làn làm việc"). KHÔNG làm việc trên `main` cục bộ và KHÔNG `git push origin main` (main cục bộ có thể lệch `origin/main`; xem bước 1). Đẩy từ NHÁNH đã duyệt bằng `git push origin <nhánh>:main`.

1. **Đang ở đâu:** `git branch --show-current`, `git fetch origin`, `git rev-list --left-right --count origin/main...HEAD`. Nếu đang ở `main` cục bộ → DỪNG: tạo nhánh `content/…` hoặc `docs/…` từ `origin/main` rồi cherry-pick việc cần đưa lên (không reset/xoá `main` cục bộ khi chưa hỏi TJ).
2. Chạy quy trình `/bump` (kiểm `?v=`, `GAME_VER`, version starter) nếu có file JS/CSS đổi.
3. **Kiểm trước khi commit** (bao cả phần chưa commit): `git status --short`, `git diff --stat HEAD` (staged + chưa staged), và `git diff --stat origin/main...HEAD` (đã commit trên nhánh). Chắc chắn không có key/token, file đề ETS, file `.bak-*`, `keys.local.js`.
4. **Kiểm làn** trên TẤT CẢ thay đổi ở bước 3, theo CLAUDE.md "Làn làm việc" › Ranh giới: (a) lọc theo đường dẫn mã ứng dụng — `js/`, `css/`, `index.html`, `game.html`, `sw.js`, `manifest.webmanifest`, `supabase/`, `.github/`, `learn/*.js`, `learn/*.css`, `learn/*/index.html`, `learn/sw/sw.js`, `learn/sw/sw.css`; (b) đọc `git diff` của cả file nội dung xem có hàm/xử lý sự kiện/logic hiển thị không. Dính mã ứng dụng ngoài chuỗi/khoá nội dung → DỪNG, báo TJ (việc làn T/D/R; hotfix nội dung phải ghi `hotfix-nội-dung:` trong commit và TJ đồng ý).
5. Commit (tiếng Việt, mô tả ngắn việc đã đổi).
6. **Kiểm lại SAU commit:** chạy lại bước 4 trên `git diff --stat origin/main...HEAD` và `git diff origin/main...HEAD`; phải khớp những gì đã duyệt ở bước 4.
7. **Tích hợp:** `git fetch origin`; nếu `origin/main` có commit mới (behind > 0) → `git rebase origin/main` trên nhánh (chưa push), chạy lại bước 6. Chỉ đẩy khi nhánh là con trực tiếp của `origin/main` (fast-forward, KHÔNG force).
8. Đẩy bằng MỘT LỆNH RIÊNG: `git push origin <nhánh>:main` (đừng gộp nhiều nhánh — GitHub Pages sẽ bỏ qua build). Báo TJ ref đã đẩy (SHA đầu nhánh). Không đẩy `main` cục bộ; nếu `main` cục bộ lệch `origin/main`, báo TJ và chờ quyết định (không tự reset).
9. Nhắn TJ link web live https://teoteo1081.github.io/W02-tj-wordloop-hub/ + việc TJ cần tự kiểm; nói rõ phần nào đã/chưa thử.
10. Nếu vừa làm xong việc trong backlog: cập nhật mục "Việc còn dang dở" của README.md cho khớp thực tế.
