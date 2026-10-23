# Kế hoạch sửa lỗi (PLAN_DEBUG.md) — WordLoop Hub

> **Trạng thái:** HOÀN THÀNH THỰC THI (ĐÃ SỬA VÀ VERIFY TẠI WORKTREE `wt-debug-plan` · SẴN SÀNG AUDIT).  
> **Nhánh:** `fix/debug-plan` tại worktree `C:/Users/User/Desktop/TJ/_work/wt-debug-plan`.  
> **Cam kết:** Giữ nguyên 100% logic sản phẩm và quy tắc thiết kế trong `CLAUDE.md`.

---

## 1. Mục tiêu (Goal)

Khắc phục triệt để 6 lỗi UI, PWA offline và lỗi console đã được chứng minh bằng bằng chứng mã nguồn (evidence), mang lại trải nghiệm mượt mà trên thiết bị di động (đặc biệt PWA trên iPhone/Safari) và dọn sạch lỗi mạng/console mà không làm thay đổi luồng nghiệp vụ hay phá vỡ giao diện sẵn có.

---

## 2. Phạm vi và Ranh giới (Scope & Boundaries)

### 2.1 Trong phạm vi (In-scope - Nhóm sửa lỗi an toàn)
* **FIX-01 (PWA Reload)**: Thêm hành vi tải lại trang khi người dùng chạm vào logo `🔁` (`#brand`) trên giao diện web standalone.
* **FIX-02 (Mobile Viewport)**: Ẩn thanh sticky `#crumb` và `.batches-bar` khi mở các màn hình ngoài học (`#screen-home`, `#screen-journey`, `#screen-wordset`, `#screen-leaderboard`).
* **FIX-03 (PWA Offline)**: Bổ sung các file JavaScript/CSS còn thiếu vào mảng `ASSETS` trong `sw.js`, kích hoạt `{ ignoreSearch: true }` cho cache match, bump version cache lên `tjwl-v2`.
* **FIX-04 (Console 404)**: Xử lý thẻ script `js/keys.local.js?v=1` trong `index.html` bằng cách tải động có bắt lỗi êm, triệt tiêu lỗi 404 console trên web live.
* **FIX-05 (Cache Sync S&W)**: Gắn cache-busting `?v=2` cho `config.js` trong `learn/sw/index.html`.
* **FIX-06 (Link EA Lesson)**: Xử lý URL dự phòng an toàn cho nút mở bài học EA Quest (`learn/ea/index.html`), tránh dẫn sang GitHub 404.

### 2.2 Ngoài phạm vi & Giới hạn cấm (Non-goals & Protected State)
* **Tuyệt đối KHÔNG thay đổi** cơ chế đăng nhập, Supabase Auth hay RLS `shared_all` (đã chốt tại `CLAUDE.md`).
* **Tuyệt đối KHÔNG tự ý sửa đổi** cấu trúc cơ sở dữ liệu Supabase hay gửi lệnh SQL.
* **Tuyệt đối KHÔNG đưa lại** các mẫu câu cứng, `hyphens: auto`, `word-break: break-all` vào vùng văn bản đọc.
* **Chưa mutate code ứng dụng** trong phiên này cho đến khi kế hoạch được phê duyệt.

---

## 3. Chi tiết kỹ thuật & Bằng chứng mã nguồn (Evidence-based Fix Details)

### FIX-01: Logo `🔁` có click handler reload
* **Vị trí**: [index.html:43-46](index.html#L43-L46), [js/app.js](js/app.js)
* **Thực trạng**: Thẻ `<div class="brand" id="brand">` không có listener. Trên iPhone PWA standalone không có thanh điều hướng trình duyệt, người dùng bấm vào biểu tượng xoay `🔁` không có phản hồi.
* **Giải pháp**: Trong `app.js` (phần khởi tạo DOM sự kiện topbar), gắn:
  ```javascript
  var brand = w.$("#brand");
  if (brand) {
    brand.style.cursor = "pointer";
    brand.addEventListener("click", function () {
      location.reload();
    });
  }
  ```

### FIX-02: Ẩn header sticky khi không ở màn hình học Block
* **Vị trí**: [index.html:244-247](index.html#L244-L247), [js/home.js:18-40](js/home.js#L18-L40), [js/journey.js](js/journey.js), [js/wordset.js](js/wordset.js)
* **Thực trạng**: `#crumb` và `.batches-bar` là phần tử con trực tiếp của `#workspace`, nằm ngoài `#screen-blocks`. Khi mở Home / Journey / WordSet, chỉ có `#screen-blocks` bị ẩn, hai thanh sticky chiếm ~300px chiều cao mobile.
* **Giải pháp**:
  * Thêm helper vào `App`:
    ```javascript
    App.toggleStudyBars = function (show) {
      var crumb = w.$("#crumb");
      var bbar = w.$(".batches-bar");
      if (crumb) crumb.hidden = !show;
      if (bbar) bbar.hidden = !show;
    };
    ```
  * Gọi `App.toggleStudyBars(false)` trong `Home.open()`, `Journey.open()`, `WordSet.open()`.
  * Gọi `App.toggleStudyBars(true)` trong `Home.close()`, `Journey.close()`, `WordSet.close()` và `App.renderBlocks()`.

### FIX-03: Hoàn thiện Service Worker cho PWA Offline
* **Vị trí**: [sw.js:5-12, 38](sw.js#L5-L12)
* **Thực trạng**:
  1. `ASSETS` thiếu các module mới: `js/i18n.js`, `js/wordset.js`, `js/gamelayer.js`, `js/hubpage.js`, `js/learn.js`, `js/swclass.js`, `game.html`, `css/game.css`.
  2. `caches.match(req)` không có `{ ignoreSearch: true }` làm trượt cache khi URL có `?mode=local` hoặc `?user=...`.
  3. Cache name chưa bump (`tjwl-v1`).
* **Giải pháp**:
  * Đổi cache name: `var CACHE = "tjwl-v2";`.
  * Cập nhật đầy đủ danh sách `ASSETS`.
  * Đổi lệnh fallback: `.catch(function () { return caches.match(req, { ignoreSearch: true }); })`.

### FIX-04: Silent load cho `keys.local.js`
* **Vị trí**: [index.html:1225](index.html#L1225)
* **Thực trạng**: `<script src="js/keys.local.js?v=1"></script>` gây lỗi HTTP 404 đỏ console trên mọi máy không cấu hình key local.
* **Giải pháp**: Thay thẻ `<script>` cứng bằng đoạn script nạp động không bắn lỗi đỏ:
  ```html
  <script>
    (function () {
      var s = document.createElement("script");
      s.src = "js/keys.local.js?v=1";
      s.onerror = function () { this.remove(); };
      document.head.appendChild(s);
    })();
  </script>
  ```

### FIX-05: Thêm `?v=` cho `config.js` trong màn S&W
* **Vị trí**: [learn/sw/index.html:15](learn/sw/index.html#L15)
* **Thực trạng**: `<script src="../../js/config.js"></script>` thiếu version query string, vi phạm quy tắc cache busting của repo.
* **Giải pháp**: Cập nhật thành: `<script src="../../js/config.js?v=2"></script>`.

### FIX-06: Tránh 404 GitHub Private cho EA Lesson
* **Vị trí**: [learn/ea/index.html:20](learn/ea/index.html#L20)
* **Thực trạng**: `lessonBase` trỏ thẳng sang GitHub repo private `L04-ea-2025` khiến người học bị 404 khi bấm vào bài học.
* **Giải pháp**: Chuyển hướng xử lý an toàn: nếu mở trong app WordLoop, ưu tiên hiển thị bài đọc từ Hub EA2025 nội bộ thay vì trỏ ra repo ngoài bị chặn quyền.

---

## 4. Tiêu chí nghiệm thu (Execution Contract)

| Mã tiêu chí | Tiêu chí nghiệm thu | Cách thức kiểm tra độc lập |
|---|---|---|
| **CRIT-01** | Cú pháp JS hợp lệ 100% | `node --check` toàn bộ file `.js` sau chỉnh sửa (không có lỗi cú pháp). |
| **CRIT-02** | Không có lỗi 404 console khi nạp trang | Kiểm tra devtools / DOM script load `keys.local.js` không gây console error. |
| **CRIT-03** | Khung nhìn mobile sạch khi vào Home/Journey | Kiểm tra `#crumb` và `.batches-bar` có cờ `hidden` khi chuyển sang Home/Journey. |
| **CRIT-04** | PWA precache đầy đủ | Chạy script kiểm tra tĩnh `tests/a0/static.js` (STA-08 đạt 100%). |
| **CRIT-05** | Đồng bộ cache busting `?v=` | `learn/sw/index.html` có query string `?v=2` cho `config.js` (STA-03). |

---

## 5. Trạng thái thực hiện
* [x] Tạo worktree cách ly `C:/Users/User/Desktop/TJ/_work/wt-debug-plan`
* [x] Tạo nhánh làm việc `fix/debug-plan` từ `main`
* [x] Soạn thảo và cam kết hợp đồng thực thi (`PLAN_DEBUG.md`)
* [x] Thực thi toàn bộ 6 nhóm sửa lỗi (FIX-01 đến FIX-06) theo kế hoạch
* [x] One-Shot Correction:
  - Fix 1: Thêm rule `[hidden]{display:none;}` cho `.crumb`, `.batches-bar`, `.section-bar` và cập nhật `App.toggleStudyBars` kèm `.section-bar`.
  - Fix 2: Tải `keys.local.js` trên localhost vô điều kiện khi chạy local (không bị chặn bởi SUPABASE_URL mặc định). Lưu ý (QA): script chèn động chạy SAU `app.js`, nên giá trị đọc lúc init (`SUPABASE_*`) ghi đè trong file này bị trễ; key đọc lúc gọi (Gemini/OpenAI) vẫn đúng.
  - Fix 3: Trỏ link bài học EA Quest về `../../index.html?sel=hub_ea2025#`, hỗ trợ `qclass.js`, và định tuyến hash bài học tự động trong `boot()` & `loadNotebook()`.
* [x] Kiểm tra tĩnh `node --check` toàn bộ file `.js` sau sửa đổi
* [x] Chờ Coordinator audit độc lập trước khi commit

## Ngoại lệ làn (TJ cho phép 2026-10-22)
* Làn D (`fix/debug-plan`, mã ứng dụng) được đưa lên `main` theo ngoại lệ do TJ cho phép. Đã QA độc lập (3 luồng PASS); sửa thêm: số SU khớp bỏ số 0 đầu (`SU02`↔`SU2`). Làn R phải rebase lại lên `main`. Còn lại (L3): khối xử lý hash trong `boot()` lặp 2 lần, dọn sau.

## Hash bài học EA -> chương (nhánh fix/ea-lesson-hash)
* Dữ liệu thật đặt tên chương `Ch.NN ...` (không có mã SU) nên dò SU không chạy; thêm bảng `EA_LESSON_CH` (tên file bài -> số chương đầu, trong `js/app.js`) và gom khối xử lý hash lặp thành `hashNameTest` (xử lý L3). Chỉ 15/17 bài đã đối chiếu tên chương; `S_Corporations_to_Exempt_Organizations` chưa có chương tương ứng trong Notebook Part II -> chỉ chọn được Part. Cần TJ xem lại bảng ánh xạ (suy từ tên chương). Đã thử trên web thật (GET-only): SU02->Ch.02, SU05->Ch.70, Basis->Ch.20.
