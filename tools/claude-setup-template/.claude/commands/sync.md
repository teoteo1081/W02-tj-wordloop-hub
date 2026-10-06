---
description: Đồng bộ với GitHub — git pull an toàn, kiểm tra stash, báo cáo diff
---
Đồng bộ repo với remote. Làm theo thứ tự, báo kết quả THẬT sau mỗi bước:

1. **Xem trước khi động vào gì**: `git status -sb`, `git branch --show-current`, `git stash list`.
   - Có thay đổi chưa commit -> nói rõ file nào, KHÔNG tự `git reset`/`checkout --`/`clean` (mất việc của chủ dự án hoặc agent khác).
2. **Lấy bản mới**: `git fetch origin` (thử lại tối đa 4 lần, chờ 2s/4s/8s/16s nếu lỗi mạng).
3. **So sánh trước khi kéo**:
   - `git log --oneline HEAD..origin/<nhánh>` (remote có gì mới)
   - `git log --oneline origin/<nhánh>..HEAD` (máy mình có gì chưa push)
   - `git diff --stat HEAD...origin/<nhánh>` (file nào đổi)
4. **Pull**: `git pull --ff-only origin <nhánh>`.
   - Nếu không fast-forward được (hai bên cùng đổi): DỪNG, báo rõ, hỏi chủ dự án chọn merge hay rebase. Không rebase/force-push nhánh của người khác.
   - Nếu có thay đổi chưa commit mà pull bị chặn: đề nghị `git stash push -u -m "sync-<ngày giờ>"`, chỉ làm khi chủ dự án đồng ý, rồi `git stash pop` sau khi pull. Pop lỗi/xung đột thì GIỮ NGUYÊN stash, đừng drop.
5. **Kiểm stash**: `git stash list` — nhắc nếu còn stash cũ chưa xử lý (nói tuổi + nội dung `git stash show --stat stash@{0}`).
6. **Báo cáo bằng tiếng Việt dễ hiểu**, gồm:
   - Nhánh nào, trước/sau pull ở commit nào.
   - Có bao nhiêu commit mới, của ai, làm gì (tóm 1 dòng mỗi commit).
   - File nào đổi (`git diff --stat <trước>..HEAD`); nhấn mạnh nếu đụng file cấu hình, tài liệu (`CLAUDE.md`, `README.md`) hoặc file dữ liệu.
   - Nếu có nhánh khác của agent khác mới cập nhật (`git branch -r`) thì nêu tên.
   - Cảnh báo nếu có file phiên bản/cache bị lệch nhau sau khi kéo (nếu repo có quy ước đó trong CLAUDE.md).
7. Không commit, không push, không tạo PR trong lệnh này.
