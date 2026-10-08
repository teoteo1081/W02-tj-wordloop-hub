---
description: QA giao diện/game bằng Playwright (an toàn, không vào phòng TJ)
argument-hint: [khu vực cần QA]
---
QA độc lập cho: $ARGUMENTS

Luật bắt buộc (CLAUDE.md, TEAM_PROCESS.md):
- KHÔNG BAO GIỜ mở `game.html` trơn hay phòng "TJ". Làm trên BẢN SAO repo, đổi `DEFAULT_ROOM` trong `js/game.js` thành `ZZ_QA_<tên>`, mock Supabase bằng `page.route`.
- Người làm không tự chấm bài mình: ưu tiên giao Agent QA riêng.
- Thử cả điện thoại (iPhone 13, CPU chậm 4x) lẫn máy tính; chụp màn hình, soi như designer (chữ đều, không che nội dung, nút bấm được).
- Cách dựng: xem `tools/qa/README.md` (server `python3 -m http.server 8951`, rồi `node tools/qa/<script>.js`).
- Báo rõ cái gì ĐÃ thử thật, cái gì CHƯA thử, lỗi tìm được + đã sửa gì.
