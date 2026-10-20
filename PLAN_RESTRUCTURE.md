# PLAN_RESTRUCTURE — tái cấu trúc codebase (giữ nguyên logic sản phẩm + giao diện)

> Trạng thái: **ĐỀ XUẤT, CHƯA DUYỆT, CHƯA ĐỔI CODE.** Bản 2.1 (2026-10-20), đã đối chiếu với `AUDIT_INFRA_ADVISOR.md` (commit `d281196`) và sửa theo 5 góp ý review (mục 0).
> Số liệu đo từ repo tại `e324beb` (nhánh này) và kiểm lại bằng đọc code ở mục 3; chưa chạy app.
> Cần TJ trả lời mục 9 trước khi bắt đầu.

## 0. Thay đổi so với bản 1

**Bản 2.1 — sửa theo review (đã kiểm từng điểm bằng code, cả 5 đều đúng):**
- **B1:** sổ chi tiêu riêng, giữ trước nguyên tử, dùng chung hai provider, đóng khi không đọc/ghi được, không dính khoá ngoại `blocks` (mục 6, B1). Bỏ ý dùng `ai_usage_daily` làm trần.
- **A0:** thêm khung Playwright với Supabase giả + Realtime giả, nhật ký lời gọi chuẩn, kịch bản hai client, cố định dữ liệu/thời gian/random trước khi đòi "sai khác = 0" (mục 6, A0).
- **A2:** thêm cổng version cho cả đồ thị import, cập nhật `/bump`, kiểm Service Worker/offline (mục 6, A2).
- **C2:** hợp đồng RPC trả cả `total_words` lẫn `mastered`, quy tắc chuẩn hoá bám đúng `normalizeAnswer` (mục 6, C2).
- **Baseline:** `origin/main` (`e324beb`) đã là tổ tiên nên rebase lên nó vô nghĩa; `8b071e6` chỉ có ở `main` cục bộ chưa push (mục 5).

**Bản 2 so với bản 1:**

- Thêm mục 3: đối chiếu từng phát hiện của audit với code thật (có 1 phát hiện sai, 2 phát hiện đúng nhưng cách vá đề xuất không hiệu quả hoặc làm hỏng tính năng đang chạy).
- Tách việc thành **3 luồng** vì tính chất khác nhau: A = restructure (giữ nguyên hành vi), B = vá bảo mật (đổi hành vi, deploy ngoài git), C = tối ưu dữ liệu/hiệu năng (đổi cách tải, phải làm sau A1).
- Đánh số lại pha để không trùng "Pha 0" của audit (audit: vá bảo mật; bản 1: lưới an toàn).
- Sửa số liệu tải trang (xem 3.4), thêm chỉ số đo trước/sau, thứ tự với nhánh `handoff/gate`, tiêu chí nghiệm thu và cách quay lại từng bước.

## 1. Mục tiêu và ranh giới

- **Luồng A (làm):** đổi cấu trúc thư mục/module, bỏ trùng lặp, đưa mọi truy cập dữ liệu về một lớp, thêm lưới an toàn (test, CI). **Không đổi tính năng, giao diện, schema.**
- **Luồng B (làm, tách riêng):** vá lỗ hổng chi phí/ghi-xoá tự do. Đổi hành vi server, nên không được lẫn vào PR restructure.
- **Luồng C (làm sau A1):** tối ưu cách tải dữ liệu. Đổi cách chạy bên trong, cần test hồi quy và đôi khi cần SQL thêm bảng/hàm (chỉ THÊM, TJ đồng ý trước).
- **Ngoài phạm vi:** đổi cơ chế đăng nhập `?u=`/RLS `shared_all` (quyết định đã chốt trong `CLAUDE.md`), SFU thay WebRTC mesh (tính năng mới), bật TURN (việc vận hành của TJ, code đã có).
- **Tiêu chí xong của luồng A:** ảnh chụp các màn chính trước/sau giống nhau (sai khác = 0), test hồi quy xanh, web live chạy như cũ.

## 2. Kết luận: KHÔNG viết lại từ đầu, restructure dần (strangler)

- Repo chưa có test nào, nên không có cách chứng minh "giữ nguyên logic và giao diện".
- `CLAUDE.md` giữ hàng chục lỗi/quyết định mà code không tự nói ra (vd `applyStarter` hồi sinh item đã xoá, `block_progress` phải check `progressLocal()`, `bts` của bảng). Viết lại từ đầu mất các hành vi ngầm đó.
- TJ vẫn thêm tính năng gần như hàng ngày; đóng băng nhiều phiên là không thực tế.
- Dữ liệu dùng chung ở Supabase, lỗi migrate ảnh hưởng người dùng thật.

## 3. Đối chiếu `AUDIT_INFRA_ADVISOR.md` với code thật

Ký hiệu: ✅ đúng · ◐ đúng một phần · ❌ sai · ➖ đã là quyết định chốt / ngoài phạm vi.

### 3.1 Hạ tầng và bảo mật

| # | Audit nói | Kiểm lại | Kết luận → xử lý |
|---|---|---|---|
| II.1 | Proxy AI bỏ qua quota khi thiếu `user_id`, ai cũng gọi được | ✅ `gemini-proxy` dòng 82 và `openai-proxy` dòng 63: `if (!userId \|\| !blockId …) return {blocked:false}`. CORS `*`, `--no-verify-jwt`. Grep không thấy danh sách model cho phép hay giới hạn kích thước đầu vào/ra | ✅ có thật → **B1**. Nhưng xem cách vá bên dưới |
| II.1 (cách vá) | Bắt buộc `user_id`, thiếu thì 401; thêm secret header | ❌ **Sẽ làm hỏng tính năng đang chạy**: `cc.js:92`, `game.js:2519`, `game.js:3536` (và `Context.lookupWord`) **cố ý** gửi `user_id:null, block_id:null` (quyết định trong `CLAUDE.md`: tra nghĩa/dịch CC không ăn quota 3 Block). Thêm nữa `user_id` là chuỗi do client tự gửi, không được xác thực; "secret header" nằm trong JS công khai nên ai đọc source cũng lấy được | Không áp dụng nguyên văn. Cách vá thay thế ở **B1** |
| II.2 | Worker `tj-shelf` mở PUT/DELETE/mkdir/move không xác thực; mỗi PUT gọi `listAll` toàn bucket | ✅ `worker.js` dòng 46–54: PUT chạy `listAll(env,"",null)` để cộng dung lượng, DELETE xoá thẳng, không có kiểm tra nào | ✅ có thật → **B2** |
| II.2 (cách vá) | Header `X-Shelf-Token` | ◐ `game.js:2283–2291` gọi PUT/DELETE trực tiếp từ trình duyệt (`SHELF = …workers.dev`), nên token cũng phải nằm trong JS công khai → chỉ chặn được người không đọc source | Cần chọn phương án (mục 9, câu 5) |
| II.3 | RLS `shared_all` mở toàn quyền, quyền chỉ nằm ở UI | ➖ Đúng sự thật nhưng **đã ghi và chốt** trong `CLAUDE.md` ("app gia đình, tin tưởng nội bộ", không phải ranh giới bảo mật). Đổi là chuyển sang Supabase Auth thật, một dự án riêng. Cần cân nhắc lại nếu mở cho người chơi ngoài nhóm | Đưa vào sổ rủi ro (mục 8), không làm ở đây |
| II.4 | `supabase_schema.sql` thiếu `bookmarked`, `wrong_open`, `wrong_ctx`, `ref_word_ids`, `quiz_zh`, `quiz_es` | ❌ **Sai**: grep thấy cả 6 cột (và `i18n`) trong `tools/supabase_schema.sql`. Chưa kiểm được file có khớp 100% production hay không | Đổi việc thành "đối chiếu file với `information_schema` thật (chỉ đọc)" → **B3** |
| IV.2 | Keepalive là điểm yếu | ◐ Workflow chạy đúng (cron 3 ngày, exit khác 0 khi không phải HTTP 200 nên GitHub báo lỗi). Rủi ro còn lại thấp | Giữ, không làm gì |

### 3.2 Frontend

| # | Audit nói | Kiểm lại | Kết luận → xử lý |
|---|---|---|---|
| III.1 | File quá khổ, phụ thuộc chéo qua `window.*` | ✅ Khớp số liệu bản 1 | Luồng A |
| III.1 | Trình duyệt di động parse hơn 2 MB JS khi tải trang | ◐ **Overstated**: `index.html` nạp ~978 KB JS tự viết; `game.html` ~850 KB nhưng `gamelayer.js` chỉ tạo iframe game khi mở game. Tổng ~1,8 MB nhưng không nạp cùng lúc. Điểm nặng bị audit bỏ sót: **pdf.js từ CDN nạp ngay ở `index.html`** dù chỉ dùng khi upload PDF "Dán cả sách" | Sửa nhận định; thêm việc lazy-load pdf.js → **C1** |
| III.2 | `?v=N` thủ công; `sw.js` ASSETS lệch; cần `ignoreSearch` | ◐ Phần `?v=N` đúng (đã gây lỗi thật). Phần SW nhẹ hơn audit nói: SW **mạng trước** và `cache.put(req)` lưu theo đúng URL có `?v=`, nên offline vẫn khớp những gì đã từng tải; `ignoreSearch` chỉ lợi cho danh sách pre-cache. ASSETS thật sự thiếu nhiều file (wordset, i18n, game…) | Sửa danh sách ASSETS trong **A1** (rủi ro thấp). Không coi là khẩn |
| III.3 | `distinctWordIndex`/`getFullTree` kéo hết dữ liệu | ✅ `db.js:2051` (CLAUDE.md: tải `id,term` toàn kho, cache 10 phút). Chưa đo thời gian thực | **C2, C3**, sau A1 |
| III.4 | WebRTC mesh giới hạn 6–8 người, TURN chưa bật | ➖ Đã ghi trong `CLAUDE.md`/README, là tính năng/vận hành. SFU là dự án mới | Ngoài phạm vi |

### 3.3 Backend

| # | Audit nói | Kết luận → xử lý |
|---|---|---|
| IV.1 | Thiếu RPC/view, logic SRS/đếm từ nằm ở client | ◐ Đúng ý, nhưng đổi chỗ tính SRS là đổi logic sản phẩm. Chỉ nên làm phần **đếm từ khác nhau** (C2), vì nó là phép tổng hợp thuần. Phần SRS giữ ở client |

### 3.4 Chỗ cần sửa trong chính audit (không sửa file audit, ghi ở đây)

- II.4 là sai (xem trên). III.1 "hơn 2 MB khi tải trang" cần thay bằng "~1 MB ở `index.html` + pdf.js CDN; game nạp theo yêu cầu".
- "Pha 2: Vite" của audit và "ES modules gốc trước, Vite sau" của bản này khác nhau: chọn ở mục 9, câu 3.
- Audit liệt kê "`w.Game`, `w.S`, `w.D`" là global; `S` và `D` có thật, `Game` chưa xác minh.
- Vùng đặt Supabase ("Frankfurt/Singapore") trong sơ đồ audit chưa xác minh.

## 4. Hiện trạng (đã đo)

| Vấn đề | Số liệu |
|---|---|
| File quá lớn | `js/game.js` 5.561 dòng / 529 KB (390 hàm cùng một phạm vi), `js/app.js` 4.947, `js/detail.js` 3.081, `js/board.js` 2.137 / 214 KB, `css/game.css` 2.108, `css/app.css` 2.375 |
| Kiến trúc | 3 ứng dụng trong 1 repo: WordLoop (`index.html`), Game (`game.html`, nhúng bằng iframe + `postMessage`), `learn/` (dm, ea, sw). Chung namespace `window.X` |
| Coupling | `App` được gọi từ 11/12 module, `Auth` từ 11, `Detail` từ 8 |
| Vi phạm quy tắc của repo | `CLAUDE.md` nói `db.js` là lớp duy nhất đụng dữ liệu, nhưng `game.js` gọi Supabase trực tiếp 119 lần, `auth.js` 6, `app.js` 1, `board.js` 1; `localStorage` rải ở 16 file |
| Trùng lặp | `esc()` định nghĩa lại 6 lần, cùng `shuffle`/`fmt`/`norm` |
| Quy trình | Không test/lint; CI chỉ có pages-preview + supabase-keepalive; bump `?v=N` tay |
| `tools/` | 149 file (92 py, 22 js) gồm pipeline đề ETS, migration, QA tạm trong repo public |
| Tài liệu | `README.md` 191 KB, `CLAUDE.md` 60 KB, `HANDOFF.md` 55 KB |

Giữ lại: `game.html` là entry riêng (iframe + `postMessage` là seam sẵn có); `db.js` có adapter local/cloud; `context.js`, `srs.js` gần như hàm thuần; không build step.

## 5. Trạng thái nhánh và thứ tự với việc khác (kiểm 2026-10-20)

- **Baseline cần xác định rõ** (kiểm bằng `git rev-list`/`merge-base`, 2026-10-20): nhánh này rẽ từ `origin/main` = `e324beb`, và `origin/main` **đã là tổ tiên** của nhánh nên rebase lên nó không lấy thêm gì. Commit mới `8b071e6` (chỉ sửa 6 file `.md`, không đụng code) nằm ở **`main` cục bộ, chưa push lên `origin`** (`origin/main...main` = 0 trước, 1 sau).
  - Muốn có `8b071e6` trong nhánh này: `git rebase main` (ref cục bộ), hoặc `git cherry-pick 8b071e6`. Nhánh chưa push nên rebase an toàn.
  - Nếu TJ muốn baseline là bản đã lên remote: TJ push `main` (một lệnh `git push origin main` riêng) rồi `git fetch` và rebase lên `origin/main`.
  - Chốt ở mục 9, câu 8. Đến lúc chốt, mọi chỗ trong tài liệu ghi "rebase lên main" nghĩa là theo ref đã chọn, và A0 ghi lại SHA baseline vào bảng số liệu gốc.
- Nhánh `handoff/gate` (chưa vào `main`) **sửa `js/game.js` (28 dòng)** và thêm `tools/handoff/` (Python + test). Phải quyết định merge hay bỏ nó **trước khi cắt `game.js` ở A3**, nếu không sẽ xung đột nặng. Thêm: CI ở A0 nên chạy được cả test của nó nếu nó được giữ.
- `AUDIT_INFRA_ADVISOR.md` đang nằm trong commit của nhánh này; giữ nguyên làm tài liệu tham chiếu.

## 6. Kế hoạch theo luồng

### Luồng A — Restructure (giữ nguyên hành vi)

**A0 — Lưới an toàn (bắt buộc làm trước mọi thứ trong A và C)**
- Tích hợp baseline đã chốt (mục 9, câu 8) và chốt xử lý `handoff/gate` (mục 5). Ghi SHA baseline.
- Đo số liệu gốc cho bảng mục 7 và lưu lại.
- Test Node cho `context`, `srs`, adapter local của `db`; chuyển các mục "Lỗi đã sửa" trong `CLAUDE.md` thành test hồi quy.
- Workflow CI chạy `node --check` + test trên mọi PR.

*Khung kiểm thử trình duyệt (Playwright) — phải xong trước khi A1 đụng 119 điểm gọi Supabase của game:*
- **Cố định môi trường trước khi đòi "sai khác = 0":** dữ liệu mẫu cố định (fixture), đồng hồ giả (`page.clock`), gieo `Math.random` cố định, tắt animation/transition, viewport + font cố định. Chạy bản chuẩn **hai lần liên tiếp**; chỉ khi hai lần giống hệt nhau mới dùng làm chuẩn. Vùng nào còn dao động (vd avatar, ảnh tải chậm) thì che mặt nạ và ghi lý do, không nới ngưỡng chung.
- **Supabase giả (mock) ở tầng mạng:** `page.route` cho `/rest/v1/*`, `/storage/v1/*`, `/functions/v1/*` với kho dữ liệu trong bộ nhớ (thực hiện các bộ lọc mà app đang dùng: `eq`, `in`, `or`, phân trang, `upsert`). Realtime giả (`channel`, `subscribe`, `unsubscribe`, `broadcast`, `presence`, đổi trạng thái `SUBSCRIBED/CLOSED/CHANNEL_ERROR`) dựng bằng `BroadcastChannel` để hai trang cùng một trình duyệt nói chuyện được với nhau.
- **Nhật ký lời gọi chuẩn ("golden call log"):** ghi lại mỗi kịch bản đã gọi gì (bảng/đường dẫn, thao tác, bộ lọc, hình dạng payload, thứ tự). Sau A1 so sánh lại nhật ký: chuyển 119 điểm gọi về `data/` mà nhật ký đổi tức là đổi hành vi. Ảnh chụp chỉ bắt được giao diện, không bắt được điều này.
- **Kịch bản bắt buộc (phòng `ZZ_…`, chặn `joinRoom("TJ")`, `CLAUDE.md`):**
  1. Hai client (host + người chơi) vào phòng, host bắt đầu ván, người chơi trả lời, điểm hai bên khớp.
  2. Người chơi tải lại giữa ván và nối lại; host tải lại giữa ván (khối `d.relay` phải chặn trước khối "nhường host", đúng lỗi QA cũ trong `CLAUDE.md`).
  3. Ép kênh sang `CLOSED` → app đăng ký lại; đếm số kênh còn mở sau rời phòng/`pagehide` (không rò kênh).
  4. Host vắng, người chơi trả lời `hello` bằng `state` có `relay:1`; `bts`/`bmeta` của bảng, bản mới hơn thắng.
  5. Ghi thất bại (`route.abort`/trả 500) ở các thao tác ghi chính: giao diện không vỡ, hành vi thử lại/báo lỗi giữ như cũ.
- **Giới hạn phải nói thẳng:** mock không phải Realtime thật. Trước khi merge A1 và A3 vẫn phải có một lượt kiểm tay trên bản preview với hai thiết bị thật trong phòng `ZZ_…`.
- Ảnh chụp chuẩn các màn chính của WordLoop và Game/Bảng chạy trên bộ cố định ở trên.

**A1 — Dọn, không đổi hành vi**
- Gom `esc`/`shuffle`/`fmt`/`norm` vào `core/util`.
- Mọi truy cập `localStorage` và Supabase đi qua `core/storage` + `data/`. Nặng nhất là 119 điểm trong `game.js`. Đây là điều kiện cho C2/C3 (đổi nguồn dữ liệu chỉ sửa 1 adapter).
- Sửa danh sách ASSETS trong `sw.js` cho khớp file thật.
- Tách tài liệu: kiến trúc / quyết định / backlog / runbook (`HANDOFF.md` giữ vai tạm thời như `CLAUDE.md` mô tả).
- Dời `tools/` (mục 9, câu 4).

**A2 — ES modules gốc** (`<script type="module">`). Vẫn không cần build, chạy được trên GitHub Pages. Thứ tự lá trước, gốc sau: `util`, `srs`, `context`, `speech`, `db`, `auth`, các feature, cuối cùng `app`. Bỏ `window.X` dần; giữ lớp tương thích tạm cho code chưa chuyển.

*Cổng bắt buộc trước khi chuyển module đầu tiên — quy tắc version cho cả đồ thị import.* Hiện `/bump` chỉ dò thẻ `<script>`/`<link>` trong HTML; module con được `import` thì không có thẻ nào, và tăng `?v=` của file vào (entry) không đổi URL các file nó import → trình duyệt/CDN giữ bản cũ của module con. Thêm nữa, **danh tính module là URL**: hai nơi import cùng file với `?v=` khác nhau tạo ra hai bản thể riêng (state nhân đôi). Nên:
- Cấm viết tay `?v=` trong câu lệnh `import`. Mỗi module chỉ có **một** chuỗi URL trong cả đồ thị.
- Chọn một cơ chế (quyết ở mục 9, câu 3) trước A2:
  1. **Import map** trong từng HTML (`index.html`, `game.html`, `learn/*/index.html`) ánh xạ tên ngắn → `js/x.js?v=N`; module chỉ `import` bằng tên ngắn. Version nằm ở đúng một chỗ mỗi trang. Điều kiện: kiểm tra thiết bị đích (Safari iOS ≥ 16.4 mới có import map) — cần TJ xác nhận người chơi iPhone dùng bản nào.
  2. **Script đóng dấu** `tools/stamp_versions.js` tự tính `?v=<băm nội dung>` cho mọi specifier và cho danh sách pre-cache; CI so "đã đóng dấu == đã commit".
  3. **Kéo A4 (Vite) lên trước A2** nếu không chấp nhận hai cách trên.
- Sửa `.claude/commands/bump.md` (`/bump`): với mỗi module đổi, tính **tập importer bắc cầu** đến các HTML entry, kiểm mục version của module đó (import map hoặc dấu đóng dấu) đã đổi chưa; kiểm mỗi module chỉ có một URL; giữ các quy tắc cũ về `GAME_VER`/`game-version.json` và `starter.version.json`.
- Service Worker (mạng trước, lưu theo URL đúng như đã tải): tạo danh sách ASSETS từ cùng nguồn version; `activate` dọn các URL đã lỗi thời (nếu không, mỗi lần đổi version thêm một bản vào cache, tăng mãi). Kiểm: tải online một lần → tắt mạng → tải lại `index.html` và game (iframe) vẫn chạy; sau khi đổi version lúc offline, hành vi quay về bản đã cache (ghi rõ, không coi là lỗi).
- Kiểm tự động ở CI: đồ thị import không có vòng, mọi module có mặt đúng một lần trong nguồn version, không còn `?v=` viết tay trong `import`.

**A3 — Cắt file lớn theo seam.** `game.js` → state/room-net, luật vòng chơi, UI, các plugin voice/chat/cc/readalong/shadow. `app.js`, `detail.js` → theo màn hình. CSS tách theo component.

**A4 (tuỳ chọn) — Vite.** Băm tên file thay `?v=N`, loại hẳn lỗi cache. Đổi lại có build step và phải chuyển deploy sang GitHub Actions. Chỉ làm nếu TJ chọn (mục 9, câu 3); có thể được kéo lên trước A2 nếu import map không dùng được trên thiết bị đích (xem cổng version ở A2).

### Luồng B — Vá bảo mật (đổi hành vi; mỗi việc nhánh `fix/…` riêng; deploy ngoài git)

Lý do không gộp vào nhánh restructure: deploy Edge Function/Worker là bước ngoài git, quay lại bằng cách deploy bản cũ, và cần TJ cấp quyền/secret. Có thể làm song song với A, không cần chờ A0.

- **B1 — Proxy AI.** Không bắt buộc `user_id`. Thay bằng: danh sách model cho phép; trần kích thước `sys`+`user`; ép trần token ra ở phía server (bỏ qua giá trị client xin cao hơn); kiểm `Origin` làm lớp lọc mềm; và **sổ chi tiêu (ledger) toàn hệ thống** thiết kế như dưới đây.

  *Vì sao không dùng `ai_usage_daily` làm trần* (đã đọc `recordUsage`): bảng này ghi **sau** khi gọi provider, theo kiểu đọc → cộng → upsert (không nguyên tử, nhiều request đồng thời làm mất số cộng dồn hoặc vượt trần), lỗi ghi bị nuốt, và `block_id` bắt buộc tham chiếu `blocks(id) ON DELETE CASCADE` (xoá Block là mất dòng chi tiêu; "khoá đại diện" không tồn tại trong `blocks` bị từ chối). Cần kiểm thêm: các `block_id` giả mà client đang gửi (`pasteq…`, `aiframe…`, `game-gap`) có thể đã bị khoá ngoại này từ chối âm thầm, tức số liệu hiện tại có thể thiếu. Bảng này giữ vai **thống kê + hạn mức mềm 3 Block/ngày**, không phải điều khiển chi tiêu.

  *Thiết kế sổ chi tiêu (chỉ THÊM, TJ đồng ý trước khi chạy SQL):*
  - Bảng riêng `ai_spend_ledger(day date primary key, spent_micro_usd bigint not null default 0)`; **không** khoá ngoại tới `blocks`/`profiles`, không cascade. RLS bật, không policy cho `anon`/`authenticated`; chỉ `service_role` (Edge Function) gọi được hàm.
  - **Giữ trước (reserve) trước khi gọi provider, một câu lệnh nguyên tử:** hàm `ai_budget_reserve(p_day, p_amount, p_cap)` làm `insert … on conflict (day) do update set spent = spent + p_amount where spent + p_amount <= p_cap returning spent`, trả null (từ chối) khi vượt trần; từ chối ngay nếu `p_amount > p_cap`. Hai request đồng thời không thể cùng qua khi chỉ đủ chỗ cho một.
  - **Ước lượng giữ chỗ theo trường hợp xấu nhất:** token vào ≈ số ký tự của `sys`+`user` (1 token/ký tự, cận trên an toàn cho tiếng Việt/CJK) + token ra tối đa do **server** ép, nhân đơn giá của model (bảng giá nằm ở server, cho cả OpenAI lẫn Gemini).
  - **Chốt sau (settle):** sau khi provider trả, `ai_budget_settle(p_day, p_reserved, p_actual)` điều chỉnh về số thật (hoàn phần dư; provider lỗi → hoàn toàn bộ). Nếu bước settle hỏng thì phần giữ chỗ **ở lại** (đếm dư, an toàn) — không bao giờ đếm thiếu.
  - **Dùng chung hai provider:** một đơn vị (micro-USD), một dòng/ngày UTC, mã chung đặt ở `supabase/functions/_shared/` thay cho bản sao chép giữa `gemini-proxy` và `openai-proxy` hiện nay. Gemini gói miễn phí vẫn tính theo giá danh nghĩa để một trần chặn cả hai.
  - **Khi không đọc/ghi được sổ (RPC lỗi, mất mạng tới DB): đóng (fail-closed)** — trả 503 `{kind:"budget_unavailable"}`, không gọi provider. Đây là điều khiển chi tiêu nên khác hạn mức mềm hiện tại (đang fail-open). Đánh đổi: khi DB hỏng thì AI cũng dừng. Chốt ở mục 9, câu 6.
  - Thứ tự trong proxy: kiểm model/kích thước → hạn mức mềm theo user (giữ nguyên, fail-open như cũ) → `reserve` → gọi provider → `settle`.
  - **Test (bắt buộc, dùng provider giả):** (1) 50 request đồng thời với trần đủ cho 10 → đúng ≤ 10 lần gọi provider, tổng sổ ≤ trần; (2) ngay biên trần: request cuối vừa đủ/vừa vượt; (3) provider lỗi → hoàn lại; (4) `settle` bị lỗi → sổ không bị đếm thiếu; (5) sổ không đọc được → 503, không gọi provider; (6) xoá Block không làm đổi sổ; (7) hai provider cùng tiêu một trần; (8) bốn đường gọi hợp lệ hiện có (WordLoop, CC, chấm câu, tra nghĩa — gồm cả `user_id:null`) vẫn chạy khi còn ngân sách.
- **B2 — Worker `tj-shelf`.** Việc chắc chắn nên làm: bỏ `listAll` quét toàn bucket mỗi PUT (giữ tổng dung lượng ở nơi khác hoặc dùng cận trên rẻ hơn) — giữ nguyên giới hạn 2 GB/25 MB. Phần xác thực: chọn phương án ở mục 9, câu 5.
- **B3 — Đối chiếu schema.** Chạy truy vấn đọc `information_schema` (cần PAT tạm, nhắc TJ thu hồi), so với `tools/supabase_schema.sql` + `tools/game_schema.sql`, sửa file cho khớp. Không chạy DDL.

### Luồng C — Tối ưu dữ liệu/hiệu năng (sau A1)

- **C1 — Lazy-load pdf.js** khi người dùng bấm upload PDF. Giữ nguyên thông báo lỗi hiện có ("Chưa nạp được thư viện đọc PDF").
- **C2 — Thống kê từ khác nhau bằng hàm Postgres** thay vì tải ~12.000 dòng. Chỉ thay nhánh Cloud của `DB.getJourneySummary`; nhánh local (`progressLocal()`) giữ nguyên.
  - **Hợp đồng đầu ra phải thay cả hai thứ mà `distinctWordIndex()` + `distinctMastered()` đang cung cấp** (đã đọc `db.js:2051–2065, 2129`): hàm trả `total_words` **và** `mastered`. `termOf` (id → từ chuẩn hoá) chỉ được `distinctMastered` dùng (grep: không nơi nào khác trong `db.js`; `wordset.js` có `termOf` riêng, độc lập), nên khi `mastered` tính ở server thì bỏ được `termOf`, nhưng **không được** chỉ thay tổng đếm.
  - Định nghĩa: `total_words` = số giá trị `norm(term)` khác nhau trên toàn bảng `words`, **bỏ chuỗi rỗng**. `mastered(p_user_id)` = số `norm(term)` khác nhau của các `words` mà user có dòng `word_progress.mastered = true`, bỏ chuỗi rỗng; **gộp từ trùng theo từng user** (hai bản của một từ cùng thuộc chỉ đếm 1) — đúng như hiện nay. `word_progress.user_id` là `uuid`.
  - **`norm` phải bám đúng thứ tự của `Util.normalizeAnswer` (`util.js:30`):** hạ chữ thường → cắt khoảng trắng hai đầu → xoá các ký tự ``. , ! ? ; : " ' ` ( ) [ ] `` → gộp `\s+` thành một dấu cách. Lưu ý **sau khi xoá dấu câu không cắt lại**, nên `"( cat )"` ra `" cat "` ở JS; SQL phải y hệt, hoặc đổi cả hai phía cùng lúc (khi đó là đổi hành vi, phải ghi rõ). `lower()` của Postgres phụ thuộc collation và có thể khác `toLowerCase()` của JS với ký tự ngoài ASCII; xét bằng dữ liệu thật chứ không giả định.
  - **Bộ nhớ đệm:** hiện `total` cache 10 phút và bị xoá khi chèn `words` (`db.js:521, 576`); `mastered` tính mới mỗi lần. Giữ đúng hai hành vi đó (không cache `mastered`, vẫn gọi `invalidateDistinctWords` khi chèn từ).
  - **Nghiệm thu:** trên ảnh chụp dữ liệu thật, so cũ/mới cho **mọi** user có tiến trình và tổng toàn kho, kết quả phải bằng nhau từng số; thêm bộ dữ liệu giả có dấu câu, hoa/thường, Unicode, chuỗi rỗng, chuỗi chỉ có khoảng trắng, trùng giữa nhiều Block, hai bản trùng cùng `mastered`. Giữ đường cũ sau cờ cho một phiên làm dự phòng. DDL chỉ THÊM hàm, TJ đồng ý trước khi chạy.
- **C3 — Nạp lười cây** (`DB.getFullTree`). Đổi hành vi Journey/sidebar; chỉ làm khi có test và ảnh chụp từ A0. Ưu tiên thấp nếu C2 đã giải được phần lớn độ trễ.
- Đo thời gian trước/sau trên mạng giả lập chậm, không chỉ tin vào số dòng.

## 7. Chỉ số đo trước/sau và nghiệm thu

| Chỉ số | Hiện tại | Đích |
|---|---|---|
| Ảnh chụp các màn chính (sai khác) | chưa có chuẩn | 0 sau mỗi bước A |
| Truy cập Supabase ngoài lớp `data/` | 119 + 6 + 1 + 1 | 0 |
| Truy cập `localStorage` ngoài `core/storage` | 16 file | 0 |
| Định nghĩa `esc()` | 6 | 1 |
| File JS lớn nhất | 5.561 dòng | dưới ~800 dòng |
| Global `window.X` do app tự đặt | 17 module (đếm từ `w.X =`/`window.X =`) | 0 (sau A2, trừ điểm vào) |
| Test tự động | 0 | `context`, `srs`, `db` local + Playwright với Supabase/Realtime giả, nhật ký lời gọi chuẩn, kịch bản hai client |
| Ổn định của ảnh chuẩn | chưa đo | hai lần chạy liên tiếp giống hệt nhau trước khi dùng làm chuẩn |
| Version module | `?v=N` thủ công trên thẻ HTML | giữ đến khi A2 có cơ chế cho cả đồ thị import (một URL/module, `/bump` bắc cầu); sau A4 không còn |
| JS nạp ở `index.html` (không tính CDN) | ~978 KB | không tăng; mục tiêu giảm sau A3/C1 |

Mỗi bước A merge vào `main` chỉ khi: CI xanh, ảnh chụp sai khác = 0, TJ xem bản preview (`feat/…` có preview qua `pages-preview.yml`) rồi mới `git push origin main` (một lệnh riêng). Quay lại: mỗi bước là một nhóm commit có thể `git revert`; không có bước nào đổi schema.

## 8. Sổ rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Lạm dụng proxy AI, tốn tiền OpenAI | Cao | B1 (trần chi tiêu toàn hệ thống) |
| Xoá/ghi đè kệ sách R2 | Trung bình (sách tham khảo; bản gốc còn ở `tj-source-staging`) | B2 |
| Ai cũng sửa/xoá dữ liệu qua REST bằng anon key | Trung bình, đã chấp nhận | Quyết định cũ; cân nhắc lại nếu mở cho người chơi ngoài nhóm |
| Restructure làm mất hành vi ngầm | Cao | A0 + test từ mục "Lỗi đã sửa" |
| Xung đột với `handoff/gate` trên `game.js` | Trung bình | Quyết định trước A3 (mục 5) |
| Thống kê từ lệch khi chuyển sang SQL | Trung bình | So sánh trên dữ liệu thật, giữ đường cũ 1 phiên (C2) |
| Module con kẹt cache cũ / module nhân đôi do `?v=` khác nhau | Trung bình | Cổng version ở A2, `/bump` bắc cầu, CI kiểm một URL/module |
| Vượt trần chi tiêu AI do đua nhau (race) hoặc sổ lệch | Cao nếu dùng `ai_usage_daily` | Sổ riêng, giữ trước nguyên tử, đóng khi lỗi (B1) |
| Ảnh "giống nhau" nhưng hành vi mạng/realtime đã đổi sau A1 | Trung bình | Nhật ký lời gọi chuẩn + kịch bản hai client + kiểm tay hai thiết bị thật |
| Agent QA vào nhầm phòng thật | Đã từng xảy ra | Phòng `ZZ_…`, chặn `joinRoom("TJ")` |

## 9. Cần TJ quyết

1. Chấp nhận A0 (lưới an toàn) trước khi đụng code?
2. Có đóng băng tính năng mới trong lúc restructure không? Nếu không, mỗi bước phải nhỏ và merge nhanh. Một nhánh tích hợp duy nhất (`feat/restructure-plan`) cho luồng A và C như bạn yêu cầu, hay quay về quy ước mỗi việc một nhánh? Đề xuất: **một nhánh cho luồng A**, luồng B tách `fix/…` riêng vì deploy ngoài git.
3. Cơ chế version cho A2: import map (cần Safari iOS ≥ 16.4: người chơi iPhone của bạn dùng bản nào?), script đóng dấu, hay kéo Vite lên trước A2? (Đề xuất: import map nếu thiết bị đích đủ mới; nếu không thì Vite trước. Không bắt đầu A2 khi chưa chọn.)
4. `tools/` ra repo riêng (private) hay chỉ ra thư mục riêng? (Đề xuất: repo riêng, vì có đề ETS.)
5. Kệ sách `tj-shelf`: (a) token trong JS công khai + giới hạn `Origin` và tốc độ (chặn người bình thường, không chặn người cố ý); (b) chỉ host được ghi/xoá qua chữ ký ngắn hạn do Edge Function cấp (chặt hơn nhưng chỉ chắc nếu hồ sơ host được xác thực thật); (c) chấp nhận rủi ro vì là sách tham khảo có bản gốc ở nơi khác, chỉ sửa phần `listAll`.
6. Sổ chi tiêu AI (B1): (a) trần mỗi ngày là bao nhiêu USD (cần con số)? (b) Khi sổ không đọc/ghi được: đóng (AI dừng, an toàn chi tiêu — đề xuất) hay mở (AI vẫn chạy, mất bảo vệ trong lúc DB hỏng)? (c) Gemini miễn phí có tính vào trần theo giá danh nghĩa không (đề xuất: có, để một trần chặn cả hai)?
7. `handoff/gate`: giữ và merge trước, hay hoãn đến sau A3?
8. Baseline: tích hợp `8b071e6` từ `main` cục bộ (`git rebase main`) ngay, hay TJ push `main` lên `origin` trước rồi mới rebase lên `origin/main`? (Đề xuất: `git rebase main` cục bộ, vì commit chỉ sửa `.md` và nhánh này chưa push.)

## 10. Ước lượng thô (chưa kiểm chứng)

A0: 1–2 phiên · A1: 2–3 · A2: 3–5 · A3: 5–8 · B1–B3: 1–2 phiên (làm song song) · C1: dưới 1 · C2: 1–2 · C3: 1–2. Luồng A tổng khoảng 11–18 phiên, chia bước nhỏ.

## 11. Ràng buộc phải giữ trong suốt quá trình

- Bump `?v=N` đúng file đã sửa (và `game-version.json` khớp `game.html`) cho đến khi có A4.
- `data/starter.json` và `data/starter.version.json` luôn khớp `version`.
- Chỉ THÊM cột/bảng/hàm DB, chạy SQL trước khi merge code, không tự chạy khi chưa được TJ đồng ý.
- `git push origin main` là một lệnh riêng; TJ xem thử rồi mới lên `main`.
- Không commit file đề ETS, không dán key/token vào file.
- Không hồi lại các thứ đã bỏ hẳn (xem "Quyết định đã chốt" trong `CLAUDE.md`).

## 12. Giới hạn của bản đánh giá

Chỉ đọc cấu trúc, đếm số liệu và đọc các đoạn code liên quan đến từng phát hiện. Chưa đọc thân hàm đầy đủ của hai proxy và `worker.js`, chưa chạy app, chưa đo thời gian tải thật, chưa đối chiếu schema với database production, chưa kiểm phụ thuộc vòng chi tiết giữa `game.js` và `app.js`. A0 và B3 sẽ làm rõ các điểm này.
