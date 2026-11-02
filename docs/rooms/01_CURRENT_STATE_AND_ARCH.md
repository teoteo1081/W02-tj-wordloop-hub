# 01_CURRENT_STATE_AND_ARCH — Khảo Sát Hiện Trạng Phòng Game TJ & Các Phương Án Kiến Trúc Mở Rộng

> **Mã tài liệu:** `DOCS-ROOMS-01`  
> **Tác giả:** AGY & Codex (Tổng hợp Kỹ thuật Kiến trúc)  
> **Dự án:** TJ WordLoop & Rooms Platform  
> **Neo kiểm soát:** Tag `anchor/rooms-plan-2026-11-02` trên `W02_TJHUB` (main: `8d9b2fe`)  
> **Trạng thái:** DỰ THẢO NGHIÊN CỨU & KẾ HOẠCH (KHÔNG SỬA MÃ, KHÔNG ĐỘNG DB)  
> **Ngày lập:** 2026-11-02  
> **Nguyên tắc:** Thảo đang đi đường không trả lời câu hỏi — Tự chọn phương án an toàn nhất, tương thích ngược 100% với phòng TJ hiện tại.

---

## 1. Bản đồ hiện trạng phòng game TJ (Ground Truth Architecture)

Qua khảo sát trực tiếp toàn bộ mã nguồn tại worktree `W02_ROOMS`, hiện trạng kiến trúc phòng game TJ được xác lập chính xác qua các thành phần kỹ thuật sau:

### 1.1. Định danh Host cứng cho TJ
- **Mã nguồn:** `js/game.js:53-57`, `js/game.js:1695-1698`.
- **Cơ chế:** Hệ thống đặt cứng `HOST_PROFILE_ID = "f3fd95c9-06e8-4d39-b6f2-efc113d436cf"`. Chỉ tài khoản có UUID này VÀ tên người chơi chuẩn hóa là `"tj"` (`isTJ()` tại `:1696`) mới được cấp quyền làm Host điều khiển phòng game. Tài khoản admin thứ hai (`Anti_TJ`) hoặc bất kỳ ai khác khi vào phòng đều chỉ được coi là người chơi thông thường (`player`).

### 1.2. Quy tắc tạo và kiểm tra mã phòng
- **Mã nguồn:** `js/game.js:52`, `js/game.js:1046-1048`, `js/game.js:1182-1194`.
- **Cơ chế:** Phòng mặc định của hệ thống mang mã cố định `"TJ"`. Khi tạo phòng mới, hàm client sinh chuỗi 5 ký tự ngẫu nhiên từ bảng chữ cái 32 ký tự `ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (loại trừ các ký tự dễ nhầm lẫn: O, 0, 1, I). Thuật toán thử lại tối đa 5 lần nếu phát hiện trùng mã unique trên bảng `game_rooms`.

### 1.3. Kênh Supabase Realtime & Giao thức truyền tin
- **Mã nguồn:** `js/game.js:11-15`, `js/game.js:1741`, `js/game.js:1781-1804`.
- **Cơ chế:** Toàn bộ phòng game chỉ sử dụng 1 kênh Realtime duy nhất: `sb.channel("game:" + G.room.code)`. Kênh kết hợp hai tính năng:
  1. `presence`: Theo dõi danh sách người chơi online trong sảnh (`G.roster`).
  2. `broadcast`: Trao đổi thông điệp thời gian thực giữa các trình duyệt:
     - `state`: Host phát tán trạng thái trận đấu (câu hỏi hiện tại, thời gian còn lại, điểm số) tới toàn phòng chu kỳ 3 giây/lần (`HEARTBEAT_MS = 3000` tại `:103`).
     - `ans`: Người chơi gửi đáp án đã chọn về cho Host.
     - `hello`: Người chơi mới kết nối chào sảnh để nhận đồng bộ tức thì.
     - `alive`: Gửi nhịp tim duy trì kết nối presence 10 giây/lần (`PRESENCE_ALIVE_MS = 90000` tại `:1818`).

### 1.4. Nguồn chân lý trạng thái trận (State of Truth)
- **Mã nguồn:** `js/game.js:16-17`, `js/game.js:147`, `js/game.js:1743-1752`.
- **Cơ chế:** Hệ thống hoạt động theo mô hình **Local Host Truth** — trạng thái thật của toàn bộ ván đấu (điểm số của từng người chơi, đồng hồ đếm ngược, danh sách câu hỏi) nằm hoàn toàn trong bộ nhớ RAM trình duyệt của Host (`G.st`) và được sao lưu tự động vào `localStorage` máy Host (`LS_HOST = "tjwl_game_host_" + MÃ`). Không có backend game server hay Edge Function nào lưu trữ state trong lúc ván đấu diễn ra.

### 1.5. Cơ chế xử lý khi Host rớt mạng
- **Mã nguồn:** `game.html:175`, `js/game.js:103`, `js/game.js:110`, `js/game.js:1745`, `js/game.js:1769`.
- **Cơ chế:** Nếu Host không gửi nhịp tim quá 7 giây (`HOST_LOST_MS = 7000`), client người chơi hiện thanh cảnh báo vàng `#p-hostlost` (`"⚠ Host mất kết nối — chờ host quay lại…"`). Nếu Host vắng mặt quá 3 giây, các client tự động phát tán gói tin tiếp sóng (`relay: 1`) mang trạng thái sao lưu gần nhất để người mới vào sau không bị trắng màn hình. Hiện tại **chưa có cơ chế tự động bầu Host mới (Host Failover)**.

### 1.6. Cơ chế nộp bài & Nguy cơ can thiệp điểm số
- **Mã nguồn:** `js/game.js:1753`, `js/game.js:2565-2595`.
- **Cơ chế:** Khi người chơi bấm chọn đáp án, client gửi broadcast dạng thô: `{ event: "ans", player_id, q_idx, ans, time_ms }`. Host nhận gói tin qua hàm `hostOnAnswer(a)`, tự kiểm tra đúng/sai và cộng dồn điểm vào `G.st.scores`. Giao tiếp hoàn toàn không có chữ ký số (HMAC/JWT) hay kiểm tra ở server, người chơi am hiểu kỹ thuật có thể dùng DevTools gửi gói tin điểm giả.

### 1.7. Lưu lịch sử ván đấu & Bảng xếp hạng
- **Mã nguồn:** `tools/game_schema.sql:28-57, 81-100`, `js/game.js:2395, 2651-2653`.
- **Cơ chế:** Khi Host bấm bắt đầu hoặc kết thúc, hệ thống ghi bản ghi vào bảng `game_matches` (gắn với `room_id`). Điểm số chung cuộc lưu vào `game_results`, chi tiết từng câu trả lời lưu vào `game_answers`. Kết thúc trận, Host cập nhật trạng thái phòng về `"lobby"`.

### 1.8. Chính sách bảo mật Row Level Security (RLS) hiện tại
- **Mã nguồn:** `tools/game_schema.sql:61-67, 101-103`, `tools/game_gap_schema.sql:14-16`, `tools/sw_history.sql:23-25`.
- **Cơ chế:** Toàn bộ 7 bảng game chính gồm `game_rooms`, `game_players`, `game_matches`, `game_results`, `game_answers`, `game_gap_sentences`, `sw_history` đều kích hoạt RLS, nhưng áp dụng chính sách `shared_all` với quyền `ALL` cho cả `anon` và `authenticated`:
  ```sql
  create policy "shared_all" on game_rooms for all to anon, authenticated using (true) with check (true);
  ```
  **Hệ quả:** Bất kỳ ai sở hữu Supabase Anon Key công khai đều có quyền SELECT, UPDATE, DELETE sạch toàn bộ dữ liệu phòng thi của người khác.

### 1.9. Lưu trữ ảnh đại diện (Storage Bucket)
- **Mã nguồn:** `tools/game_schema.sql:69-76`.
- **Cơ chế:** Bucket `game-avatars` được cấu hình công khai (public), giới hạn dung lượng 300 KB / file. Cho phép vai trò `anon` quyền SELECT và INSERT vô điều kiện (`bucket_id = 'game-avatars'`). Chưa có giới hạn tổng dung lượng lưu trữ của bucket.

### 1.10. Nguồn dữ liệu nội dung câu hỏi & đề thi
- **Mã nguồn:** `js/game.js:1197-1230`, `tools/game_gap_schema.sql:1-12`, `learn/sw/sets.json`.
- **Cơ chế:**
  - Từ vựng: Truy vấn từ các bảng `notebooks`, `sections`, `pages`, `batches`, `blocks`, `words` theo từng lô 80 ID bằng hàm `inIds`.
  - Câu trắc nghiệm điền từ Part 5: Nạp trực tiếp từ bảng `game_gap_sentences`.
  - Bộ đề Speaking & Writing: Nạp từ file tĩnh `learn/sw/sets.json`.

### 1.11. Cloudflare Worker âm thanh MP3
- **Mã nguồn:** `tools/game-worker/worker.js`, `tools/game-worker/README.md:1-20`.
- **Cơ chế:** Worker `tj-game.tj-wordloop.workers.dev` phục vụ phát âm thanh MP3 luyện nghe TOEIC từ R2 bucket `tj-game`. Worker hoạt động ở chế độ chỉ đọc (GET/HEAD kèm HTTP Range 206), băng thông Egress $0, độc lập hoàn toàn với logic phòng game.

### 1.12. Proxy AI & Bảo mật khóa bí mật
- **Mã nguồn:** `supabase/functions/gemini-proxy/index.ts:1-205`, `supabase/functions/openai-proxy/index.ts:1-181`.
- **Cơ chế:** Edge Function server-side bảo vệ an toàn `GEMINI_API_KEY` và `OPENAI_API_KEY`. Khởi chạy với cờ `--no-verify-jwt`. Client gọi thông qua header `Authorization: Bearer SUPABASE_ANON_KEY`.

### 1.13. Lỗ hổng bỏ qua hạn mức AI qua Proxy
- **Mã nguồn:** `supabase/functions/gemini-proxy/index.ts:81-82`, `supabase/functions/openai-proxy/index.ts:62-64`.
- **Cơ chế:** Hạn mức hàng ngày 3 Block/ngày tính qua bảng `ai_usage_daily`. Tuy nhiên, nếu request truyền `userId` hoặc `blockId` là `null`, hàm `checkQuota()` tự động trả về `{ blocked: false }`, cho phép bypass 100% quota và gọi API trả phí của TJ không giới hạn.

### 1.14. Các điểm kích hoạt gọi AI từ game
- **Mã nguồn:** `js/game.js:1320-1343` (tạo câu gap bằng OpenAI), `js/game.js:2342-2343` (tạo bài đọc trên Bảng), `js/game.js:2544-2550` (`gradeWrites()` truyền cứng `user_id: null, block_id: null`), `js/game.js:3561-3570` (`tvLookup()` tra từ điển truyền cứng `user_id: null`).

### 1.15. Định danh người chơi Cloud qua Link
- **Mã nguồn:** `js/auth.js:15-28, 36`.
- **Cơ chế:** Người chơi đăng nhập qua URL chứa tham số `?u=<uuid>`. Dữ liệu được lưu vào `localStorage`. Không bắt buộc đăng nhập `auth.users`, chấp nhận mô hình không mật khẩu để tối ưu tốc độ vào phòng.

### 1.16. Tích hợp Lớp học Iframe (Quest Class)
- **Mã nguồn:** `learn/qclass.js:1-15`, `js/swclass.js:1-20`.
- **Cơ chế:** Trắc nghiệm EA Quest và Marketing Quest chạy trong iframe, giao tiếp với trang cha qua `postMessage` (`sw-class-send`). Trang cha chuyển tiếp qua Supabase Realtime bằng tin nhắn broadcast `qz` (host phát 2s/lần) và `qa` (học viên nộp bài).

---

## 2. Các rủi ro nghiêm trọng khi mở công khai

1. **Rủi ro RLS mở toang (Data Wipe / Cross-room Tampering):** Do policy `shared_all` cấp quyền `ALL` cho `anon`, một học viên bất kỳ mở DevTools có thể gửi lệnh xóa toàn bộ bảng `game_rooms` hoặc sửa điểm của phòng khác.
2. **Rủi ro xả bill AI (Financial Quota Drain):** Lỗ hổng `user_id: null` tại `gemini-proxy` và `openai-proxy` cho phép kẻ xấu khai thác proxy để gọi LLM miễn phí trên tài khoản thanh toán của TJ.
3. **Rủi ro sập kết nối Realtime (Capacity Crash):** Gói Supabase Free chỉ chịu được 200 CCU và 100 msg/s (VERIFIED: `supabase.com/pricing`). Khi có 10 lớp học đồng thời (mỗi lớp 20 người), hệ thống sẽ từ chối kết nối mới ngay lập tức.
4. **Rủi ro State of Truth đặt tại Host (Host Single Point of Failure):** Nếu Host bị sập nguồn hoặc mất mạng, toàn bộ 50 người chơi trong phòng bị treo cứng do không có backend duy trì trạng thái ván đấu.
5. **Rủi ro an toàn trẻ em & COPPA:** Mở phòng cho các trường tiểu học/THCS mà thu thập email hoặc cho phép chat tự do sẽ vi phạm luật COPPA.

---

## 3. Ba phương án kiến trúc kỹ thuật (Architectural Options)

### 3.1. Phương án A: 1 Supabase Project + Multi-tenant RLS (KHUYẾN NGHỊ LÕI)
- **Mô tả:** Tiếp tục sử dụng 1 project Supabase hiện tại; nâng cấp lên gói Pro ($25/tháng); phân tách dữ liệu theo `tenant_id` / `host_profile_id` và viết lại toàn bộ chính sách RLS.
- **Sơ đồ kiến trúc:**
  ```
  [Trình duyệt Học viên] ──(Realtime game:code)──┐
  [Trình duyệt Host]    ──(Realtime game:code)──┼──> [Supabase Project Duy Nhất]
  [Màn hình Máy chiếu]  ──(Realtime game:code)──┘    ├── PostgreSQL (RLS Multi-tenant)
                                                     ├── Realtime Engine (500 CCU Pro)
                                                     └── Edge Functions (Vá Quota Cap)
  ```
- **Thay đổi Database & RLS đề xuất:**
  - Thêm cột `host_id (uuid)` và `is_public (boolean)` vào bảng `game_rooms`.
  - Thay thế policy `shared_all` bằng policy theo phòng:
    ```sql
    -- Chỉ Host mới có quyền UPDATE hoặc DELETE phòng của mình
    create policy "host_manage_room" on game_rooms
      for all to authenticated
      using (auth.uid() = host_id) with check (auth.uid() = host_id);
    -- Mọi người được phép đọc thông tin phòng đang mở
    create policy "public_read_open_rooms" on game_rooms
      for select to anon, authenticated
      using (status in ('lobby', 'playing'));
    ```
- **Thay đổi mã nguồn:** Bỏ kiểm tra cứng `HOST_PROFILE_ID` tại `js/game.js:55`; thêm màn hình tạo phòng động; vá hàm `checkQuota()` trong proxy.
- **Công sức ước tính:** 5 – 7 ngày-người.
- **Tương thích ngược với phòng TJ:** Phòng mang mã `"TJ"` được gắn cứng `host_id = 'f3fd95c9-06e8-4d39-b6f2-efc113d436cf'` và cấp policy đặc quyền, bảo toàn 100% luồng chạy hiện nay.
- **Phương án hoàn tác (Rollback):** Chạy script hoàn tác migration RLS và khôi phục biến cờ `ALLOW_EXTERNAL_HOST = false`.

---

### 3.2. Phương án B: Cô lập Supabase Project theo Tenant (Dedicated Projects)
- **Mô tả:** Mỗi đối tác trường học / trung tâm lớn được thiết lập một project Supabase độc lập (hoặc schema biệt lập), sử dụng URL và Anon Key riêng.
- **Sơ đồ kiến trúc:**
  ```
  [Lớp học TJ]           ──> [Supabase Project TJ Gốc] (Bảo vệ tuyệt đối)
  [Trung tâm Ngoại ngữ A] ──> [Supabase Project Đối tác A] ($25/tháng do A trả)
  [Trường Quốc tế B]     ──> [Supabase Project Đối tác B] ($25/tháng do B trả)
  ```
- **Thay đổi Database:** Nhân bản toàn bộ schema `game_schema.sql` sang các project mới thông qua Supabase CLI migration.
- **Thay đổi mã nguồn:** `js/db.js` và `js/game.js` hỗ trợ nạp cấu hình `SUPABASE_URL` và `ANON_KEY` động theo subdomain hoặc mã trung tâm (vd: `trungtamA.wordloop.vn`).
- **Ưu điểm:** Bảo mật cô lập tuyệt đối; không có nguy cơ dữ liệu phòng này ảnh hưởng phòng khác; chi phí hạ tầng đẩy về đối tác chi trả.
- **Nhược điểm:** Phức tạp trong việc tự động hóa khởi tạo project; chi phí cao ($25/tháng cho mỗi đối tác); người dùng nhỏ lẻ không thể tự tạo phòng nhanh.
- **Công sức ước tính:** 12 – 15 ngày-người.
- **Khả năng hoàn tác:** Xóa URL trỏ tới project đối tác, quay về project gốc.

---

### 3.3. Phương án C: Host-ủy-quyền Gọn nhẹ / BYO Key (Stateless Client Host)
- **Mô tả:** Game phòng vận hành theo mô hình phi tập trung (Decentralized); không ghi lịch sử ván đấu vào DB chung; kênh Realtime chỉ dùng Broadcast tạm thời; tính năng AI sử dụng trực tiếp API Key của Host (BYO Key).
- **Sơ đồ kiến trúc:**
  ```
  [Trình duyệt Học viên] <═══ Realtime Broadcast (game:code) ═══> [Trình duyệt Host]
                                                                        │
                                                            (Direct Client API Call)
                                                                        ▼
                                                             [Google AI Studio API]
                                                             (Dùng BYO Key của Host)
  ```
- **Thay đổi Database:** Hoàn toàn **không cần sửa Database**. Không ghi dữ liệu ván đấu người ngoài vào Supabase.
- **Thay đổi mã nguồn:** 
  - Tại `js/game.js`, tắt các lệnh ghi `sb.from('game_results').insert(...)` đối với phòng người ngoài.
  - Bổ sung ô nhập API Key tại sảnh Host (`localStorage.getItem('user_gemini_key')`). Client Host gọi trực tiếp Google AI Studio với chi phí $0 cho TJ.
- **Ưu điểm:** Chi phí hạ tầng = 0 VNĐ; không sợ lộ dữ liệu DB; triển khai cực nhanh; hoàn tác trong 1 phút.
- **Nhược điểm:** Học sinh không lưu được lịch sử học tập dài hạn trên Cloud; Host mất mạng là mất sạch điểm.
- **Công sức ước tính:** 3 – 4 ngày-người.
- **Khả năng hoàn tác:** Tắt cờ tính năng client là xong ngay lập tức.

---

## 4. Khuyến nghị thiết kế & Lộ trình triển khai có ANCHOR

### 4.1. Khuyến nghị thiết kế tổng thể
- **Kiến trúc cốt lõi:** Kết hợp **Phương án A làm nền tảng quản lý phòng & tài khoản** với **Phương án C cho tính năng AI (BYO Key)**.
- **Mô hình chi phí:** Ở giai đoạn đầu, áp dụng gói **Supabase Pro ($25/tháng)** có bật Spend Cap. Cung cấp gói Free (15 CCU, 0 AI) và gói Pro 199.000 VNĐ/tháng để tự bù đắp hạ tầng (4 khách hàng Pro là hòa vốn).
- **Nguyên tắc an toàn:** Mặc định tắt tính năng gọi AI của hệ thống đối với phòng ngoài; chỉ kích hoạt khi Host tự cấp API key hoặc mua gói trả phí.

### 4.2. Lộ trình triển khai 4 pha có Anchor

| Pha | Tên pha | Mục tiêu | Cổng nghiệm thu đo lường được | Phương án hoàn tác (Rollback) |
|:---:|---|---|---|---|
| **Pha 0** | Khảo sát & Kế hoạch | Hoàn thiện bộ 3 tài liệu nghiên cứu `01`, `02`, `03` | Cả 3 tài liệu được kiểm chéo đạt ACCEPT | Xóa branch `docs/rooms-public-plan` |
| **Pha 1** | Alpha Thân tín (4 tuần) | Thử nghiệm 5–10 giáo viên quen, trần 20 người/phòng, dùng kho đề chung | 100% giáo viên tạo được phòng; vào phòng < 45s; chi phí Supabase = $0 | Gạt cờ `ALLOW_EXTERNAL_HOST = false`, về phòng TJ |
| **Pha 2** | Closed Beta (6 tuần) | Mở rộng 30–50 lớp học, bật Supabase Pro ($25), kích hoạt BYO Key | Tỷ lệ disconnect < 1.5%; chi phí AI của TJ < $10/tháng | Tắt tính năng Beta, đưa phòng ngoài về Read-only |
| **Pha 3** | Public GA | Mở tự do cộng đồng, bán gói Pro 199k/tháng tự bù chi phí hạ tầng | Đạt 200 phòng/tuần; doanh thu Pro > 200% chi phí hạ tầng | Khóa đăng ký mới, bảo vệ tài nguyên lõi |

---
*Tài liệu được biên soạn đồng thuận trên cơ sở khảo sát mã nguồn thực tế và kiểm chứng độc lập 18/18 điểm kỹ thuật then chốt.*
