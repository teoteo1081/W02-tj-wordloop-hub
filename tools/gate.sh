#!/usr/bin/env bash
# Cổng kiểm tra WordLoop — xem docs/TEAM.md. Dùng:
#   tools/gate.sh pre       Cổng 0+1: tĩnh (cú pháp, ?v=, khóa bí mật, bản quyền…) — chạy TRƯỚC khi lưu/đẩy
#   tools/gate.sh unit      Kiểm thử thuần (Node) cho js/exams.js + data/exams/dm_items.json
#   tools/gate.sh data      Hồi quy dữ liệu: số câu TOEIC + Hub không đổi (chỉ đọc Supabase)
#   tools/gate.sh browser   Cổng 2: trình duyệt tự động, chặn hết Supabase/WebSocket (an toàn) + test hub Marketing bằng supabase giả
#   tools/gate.sh post      Cổng 3: HẬU KIỂM web live (sau khi đã gộp vào main)
#   tools/gate.sh all       pre + unit + data + browser   (trước khi xin gộp)
# Mã thoát 0 = mọi cổng đã chạy đều ĐẠT; 1 = có cổng KHÔNG ĐẠT. ⏭️ (bỏ qua) KHÔNG phải đạt — đọc kỹ log.
set -u
cd "$(git rev-parse --show-toplevel)"
mode="${1:-all}"; rc=0
run() { echo; echo "════ $1 ════"; shift; "$@" || rc=1; }
case "$mode" in
  pre)     run "Cổng 0+1 · tĩnh" python3 tools/gate_static.py ;;
  unit)    run "Kiểm thử thuần · exams" node tools/test_exams.js ;;
  data)    run "Hồi quy dữ liệu" python3 tools/gate_data.py ;;
  browser) run "Cổng 2 · trình duyệt" node tools/gate_browser.js
           run "Cổng 2 · trình duyệt · hub Marketing (offline, stub)" node tools/test_exams_browser.js ;;
  post)    run "Cổng 3 · hậu kiểm" python3 tools/gate_post.py ;;
  all)     run "Cổng 0+1 · tĩnh" python3 tools/gate_static.py
           run "Kiểm thử thuần · exams" node tools/test_exams.js
           run "Hồi quy dữ liệu" python3 tools/gate_data.py
           run "Cổng 2 · trình duyệt" node tools/gate_browser.js
           run "Cổng 2 · trình duyệt · hub Marketing (offline, stub)" node tools/test_exams_browser.js ;;
  *) echo "Cách dùng: tools/gate.sh pre|unit|data|browser|post|all"; exit 2 ;;
esac
echo; if [ $rc -eq 0 ]; then echo "🟢 TỔNG KẾT: các cổng đã chạy đều ĐẠT"; else echo "🔴 TỔNG KẾT: CÓ CỔNG KHÔNG ĐẠT — dừng, sửa rồi chạy lại"; fi
exit $rc
