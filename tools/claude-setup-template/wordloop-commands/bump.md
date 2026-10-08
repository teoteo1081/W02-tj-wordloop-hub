---
description: Kiểm đã bump ?v=N / GAME_VER cho các file JS/CSS vừa sửa chưa
---
Trước khi commit/push, kiểm cache-busting:

1. `git diff --name-only` (và `git diff --cached --name-only`) -> liệt kê file `.js`/`.css` đã đổi.
2. Với mỗi file, tìm thẻ `<script>`/`<link>` tương ứng trong `index.html` (hoặc `game.html`, `learn/*/index.html`) và xem số `?v=` đã tăng so với `git diff` chưa.
3. Nếu sửa `js/game.js` hoặc `css/game.css`: `GAME_VER` (lấy từ `?v=` của `game.js` trong `game.html`) và `game-version.json` phải khớp nhau.
4. Nếu sửa `data/starter.json`: `version` trong `data/starter.version.json` phải GIỐNG HỆT.
5. Báo file nào còn thiếu bump. Chỉ bump đúng file đã sửa, không bump hàng loạt.
