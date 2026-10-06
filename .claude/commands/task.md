---
description: Đọc backlog trong README.md ("Việc còn dang dở") và làm tiếp việc chưa xong
argument-hint: [từ khoá hoặc số thứ tự việc, bỏ trống = tự chọn theo ưu tiên]
---
Làm tiếp việc dang dở trong repo. Yêu cầu thêm của TJ (nếu có): $ARGUMENTS

## Bước 1 — Đọc backlog (chỉ đọc)
- Mục "Việc còn dang dở" của `README.md` có dòng RẤT dài: dùng `grep -n '^- \*\*' README.md | cut -c1-300` để lấy mục lục, rồi `sed -n 'A,Bp' README.md | cut -c1-600` để đọc từng đoạn. Đừng dùng Read cả file.
- Đọc thêm `TEAM_PROCESS.md` mục 4 ("Việc TJ đang chờ") và `HANDOFF.md` (chỉ là ghi chú tạm — verify bằng git/Supabase/code trước khi tin).
- `git log --oneline -15` để biết việc nào đã xong nhưng README chưa gạch.

## Bước 2 — Chọn việc
- Ưu tiên hiện tại của TJ (ghi đầu mục backlog) đứng trước; việc ghi "ưu tiên THẤP" đứng sau. Nếu `$ARGUMENTS` có chỉ rõ việc nào thì làm việc đó.
- BỎ QUA việc ghi "chờ TJ chốt/duyệt/brainstorm", việc cần PAT/token mới, việc của người khác (TJ tự làm: bật Pages, GA4, revoke token…).
- Lập danh sách ngắn (3–5 việc) theo thứ tự, mỗi việc 1 dòng: việc gì · vì sao chọn · ước tính chi phí (token/USD/dung lượng Supabase) · rủi ro.

## Bước 3 — Cổng tiền kiểm (theo TEAM_PROCESS.md)
- Việc nhỏ, chỉ sửa code/tài liệu, không tốn tiền -> làm luôn việc số 1.
- Việc lớn, tốn tiền API, ghi hàng loạt vào Supabase, hoặc TJ chưa chốt hướng -> DỪNG, trình đề xuất + mẫu nhỏ, HỎI TJ trước. Không tự quyết thay.
- Trước khi sửa dữ liệu: backup. Trước khi sửa file: `git fetch` + xem nhánh agent khác (L02/L04) để khỏi đè việc nhau.

## Bước 4 — Làm
- Tuân thủ CLAUDE.md: bump `?v=N` đúng file đã sửa (+ `GAME_VER`/`game-version.json` nếu đụng game), không dán API key vào file client, không commit file đề ETS, test game chỉ dùng phòng `ZZ_QA_*`.
- Verify bằng Node (`/verify`) hoặc Playwright (`/qa`) trước khi báo xong. Người làm không tự chấm bài mình.

## Bước 5 — Cập nhật & báo cáo
- Sửa mục tương ứng trong `README.md` cho khớp thực tế (việc xong thì ghi ngày + commit; việc còn dở thì ghi rõ tới đâu). Không để README lệch thực tế.
- Không commit/push nếu TJ chưa bảo (dùng `/ship` khi được phép).
- Báo bằng tiếng Việt dễ hiểu, ít thuật ngữ: đã làm gì, đã thử thật gì, CHƯA thử gì, chi phí thật, còn treo gì, việc kế tiếp đề xuất.
