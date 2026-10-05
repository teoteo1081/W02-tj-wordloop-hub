# Kịch bản QA bằng Playwright (tạm, viết trong các phiên Claude)
Cách dùng (không có trong repo vì cần thư viện ngoài):
1. Tạo thư mục `qa/` = bản sao repo, đổi `DEFAULT_ROOM` trong `js/game.js` thành `ZZ_QA_...` (KHÔNG BAO GIỜ mở phòng thật "TJ" khi test — xem CLAUDE.md), chèn `window.__t = { G: G, ... }` trước dòng `$("#l-start").addEventListener` (xem `sync.sh`).
2. `npm pack @supabase/supabase-js@2.45.4` -> giải nén vào `sbjs/` (test chặn mạng thật, mock Supabase bằng `page.route`).
3. `python3 -m http.server 8951` rồi `node c.js` (bảng v17: lật trang, cỡ chữ, tra từ, cây), `node tb.js` (thanh trên cùng nhiều cỡ màn), `node t2.js` (bẫy), `node d2.js` (cây game -> bảng).
`harness.js`, `board4.js` là khung mock cũ (bảng/thư viện). Các file này chỉ để tham khảo, đường dẫn trong đó là của máy cloud.
