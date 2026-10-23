# PLAN_RESTRUCTURE — tái cấu trúc codebase (giữ nguyên logic sản phẩm + giao diện)

> Trạng thái: **ĐỀ XUẤT, CHƯA DUYỆT, CHƯA ĐỔI CODE.** Bản 2.2 (2026-10-20): đã đối chiếu với `AUDIT_INFRA_ADVISOR.md` (commit `d281196`), sửa theo 5 góp ý review, và áp **mô hình vận hành do TJ chốt** (mục 5): `main` đóng băng, mọi việc chỉ trong worktree này, Netlify phục vụ nhánh restructure song song với GitHub Pages phục vụ `main`, cuối cùng thay `main`.
> Số liệu đo từ repo tại `e324beb` (nhánh này) và kiểm lại bằng đọc code ở mục 3; chưa chạy app.
> A0 đã được duyệt theo `WORKTREE_ANCHOR.md`; các phần còn lại vẫn theo cổng quyết định ở mục 9. Cycle kế tiếp và quyền tự chủ được chốt ở mục 0.1 dưới đây.

## 0.1 Cycle A0 tiếp theo — tự thực hiện kỹ thuật, dừng ở quyết định PO

**Chỉ đạo TJ ngày 2026-10-22:** lập cycle dài hơn vì TJ không can thiệp kỹ thuật code; cycle dừng khi cần PO quyết định. Sau đó TJ yêu cầu **commit plan/spec trước khi làm và dừng sau commit**. Vì vậy checkpoint tài liệu này chưa khởi chạy cycle; không được tự tiếp tục triển khai sau commit trong phiên này.

**Kết quả dự kiến khi được tiếp tục:** hoàn thiện phần A0 kiểm được bằng Node trên baseline ghim `e324beb54b29ddfa055956c756a4ceba2676dfa1`, có số liệu gốc, test hồi quy, kiểm tĩnh, ma trận độ phủ và checkpoint commit trên `feat/restructure-plan`. Không đồng nghĩa đã qua toàn bộ cổng M0.

**Phạm vi:** thêm bộ kiểm thử/báo cáo trong `tests/` và cập nhật tài liệu trên worktree hiện tại. Giữ nguyên mã ứng dụng và baseline; không cài gói từ mạng, gọi dịch vụ thật, sửa dữ liệu thật hay deploy. Việc chọn cấu trúc test, shim, dữ liệu giả, cách đo và sửa lỗi của chính bộ test do agent tự xử lý trong phạm vi này.

| Chặng | Kết quả và bằng chứng |
|---|---|
| M0.2 — số liệu gốc | Đo lại chỉ số mục 7, ghi lệnh/cách đếm, SHA nguồn, bản đồ phụ thuộc và các điểm truy cập dữ liệu; phân biệt số đo tĩnh với số đo cần trình duyệt |
| M0.3 — test Node | Test hồi quy `context`, `srs`, `util`, `readalong` và adapter local `db` theo TEST §3–4.1; chạy trên baseline trước, rồi trên nhánh làm việc; không sửa ứng dụng để ép test xanh |
| M0.7b — kiểm tĩnh | Kiểm cú pháp, version/cache, ASSETS, file cấm và các ca tĩnh áp dụng trước M2; đo và công khai ngoại lệ baseline, không tự duyệt ngoại lệ mới |
| Đối chiếu và QA | Đối chiếu ma trận truy vết với test thực chạy, kiểm độc lập diff/kết quả; phân biệt đạt, lỗi baseline, chưa phủ và cần trình duyệt |
| Checkpoint | Cập nhật trạng thái/tài liệu, lệnh tái lập, kết quả QA và các khoảng trống; commit cục bộ trên nhánh hiện tại |

**Điểm dừng PO:** cần đổi hành vi sản phẩm/phạm vi; phát sinh chi phí hoặc quyền cài gói; tác động hosting/backend/dữ liệu thật; baseline khác đặc tả mà phải chọn giữ hay sửa; cần duyệt ngoại lệ/golden mới. Không hỏi TJ chọn cách viết code hoặc xử lý lỗi kỹ thuật thông thường. Nếu một quyết định chỉ chặn một chặng, tiếp tục phần độc lập còn được phép trước khi bàn giao.

**Lệch main đã quan sát:** lần fetch ngày 2026-10-22 cho thấy `origin/main` tại `6c7b66b`, có hai commit `4708ba9` và `6c7b66b` sau baseline. Mô tả lịch sử rằng `origin/main = e324beb` và có thể thay main bằng fast-forward trực tiếp không còn đúng tại checkpoint này. Giữ baseline; không tự merge/cherry-pick hay chọn cách tích hợp thay PO. Lệch này chưa chặn test Node, nhưng cần PO chọn phạm vi tiếp nhận thay đổi trước tích hợp cuối và đánh giá lại tương thích với bản đang dùng.

**Bàn giao cuối cycle:** nêu kết quả, bằng chứng, SHA checkpoint, giới hạn độ phủ và quyết định PO theo dạng tác động người dùng / phương án / đề xuất. Tiêu chí nghiệm thu cụ thể ở SPEC §1.1. Không tuyên bố A0 hoàn tất khi chưa có bằng chứng trình duyệt, ảnh chuẩn và hai client.

## 0. Thay đổi so với bản 1

**Bản 2.2 — mô hình vận hành TJ chốt (2026-10-20):**
- `main` **đóng băng**; mọi việc chỉ làm trên `feat/restructure-plan` (một dòng tích hợp, không nhánh `fix/…` riêng cho việc thuộc restructure).
- Baseline **giữ `e324beb`**, không merge `main`; lấy commit từ nơi khác bằng cherry-pick (đã đưa kế hoạch Netlify vào: `9ce51fd`). Câu 2 và câu 8 ở mục 9 đã được trả lời.
- **Hai dòng song song:** `main` → GitHub Pages (TJ dùng), `feat/restructure-plan` → Netlify (kiểm thử), cho tới khi worktree **freeze** rồi thay hẳn `main` bằng fast-forward, không force-push (mục 5).
- Thêm **luồng H (hosting)** và các hệ quả của việc hai dòng **dùng chung backend production** (mục 5.1, luồng H, mục 8): tương thích ngược schema/giao thức/Edge Function với bản `main` đóng băng, và quy tắc ghi dữ liệu từ bản mới.
- Bỏ quy trình "mỗi bước merge vào `main`" ở mọi tài liệu; thay bằng "mỗi bước commit vào dòng tích hợp, kiểm trên Netlify".

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
- **Luồng B (làm, commit riêng):** vá lỗ hổng chi phí/ghi-xoá tự do. Đổi hành vi server, nên mỗi việc là commit riêng (không lẫn vào commit dời mã) và **deploy là bước riêng cần TJ đồng ý từng lần**, vì backend dùng chung với bản `main` đang chạy (mục 5.1).
- **Luồng H (hosting):** chuyển nơi phục vụ frontend của dòng restructure sang Netlify theo `PLAN_NETLIFY_FRONTEND.md`, trong khi `main` ở lại GitHub Pages. Không đụng mã ứng dụng.
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

- **Baseline ĐÃ CHỐT: `e324beb` (= `origin/main`).** `origin/main` là tổ tiên của nhánh này nên rebase lên nó không lấy thêm gì và không cần làm. Commit `8b071e6` (chỉ sửa 6 file `.md`) nằm ở `main` cục bộ, **chưa push và không vào nhánh này** (không merge, không rebase lên `main` cục bộ). Hệ quả khi thay `main` ở cuối: phần chỉnh tài liệu trong `8b071e6` không đi theo; nếu cần giữ phần nào thì chuyển tay vào lúc tách tài liệu (M1.7). A0 ghi SHA baseline vào bảng số liệu gốc.
- **Điều kiện để thay `main` bằng fast-forward ở cuối:** `origin/main` không tiến thêm so với `e324beb`. Vì vậy không ai push gì lên `origin/main` trong thời gian này, kể cả `8b071e6`. Lệnh kiểm có trong `WORKTREE_ANCHOR.md`.
- Nhánh `handoff/gate` (chưa vào `main`) **sửa `js/game.js` (28 dòng)** và thêm `tools/handoff/` (Python + test). Phải quyết định merge hay bỏ nó **trước khi cắt `game.js` ở A3**, nếu không sẽ xung đột nặng. Thêm: CI ở A0 nên chạy được cả test của nó nếu nó được giữ.
- `AUDIT_INFRA_ADVISOR.md` đang nằm trong commit của nhánh này; giữ nguyên làm tài liệu tham chiếu.
- `PLAN_NETLIFY_FRONTEND.md` được cherry-pick vào nhánh này (`9ce51fd` ← `e94e086`); nó viết cho "chuyển frontend sang Netlify" nói chung, còn trong mô hình này Netlify phục vụ **dòng restructure** và `main` ở lại Pages (luồng H).

### 5.1 Mô hình hai dòng song song — hệ quả bắt buộc phải xử lý

| | Dòng cũ | Dòng mới |
|---|---|---|
| Nhánh | `main` (đóng băng, `e324beb`) | `feat/restructure-plan` |
| Phục vụ | GitHub Pages (`teoteo1081.github.io/W02-tj-wordloop-hub/`) | Netlify (chưa tạo; xem luồng H) |
| Ai dùng | TJ hằng ngày | TJ/agent kiểm thử |
| **Backend** | **CHUNG**: cùng Supabase (DB, Storage, Realtime), Edge Function, Worker/R2 | |

Vì backend dùng chung, nên:

1. **Dữ liệu thật có thể bị bản mới làm hỏng.** Bản mới ghi chung bảng với bản đang dùng. Cho tới khi nhật ký lời gọi của bản mới khớp bản `main` (CALL-*, TEST §5) và TJ đồng ý, bản mới chỉ ghi bằng hồ sơ thử và phòng `ZZ_…`; chỉ đọc bằng hồ sơ thật. Sau cổng đó mới ghi bằng hồ sơ thật.
2. **Schema chỉ THÊM và tương thích ngược** với bản `main` đóng băng (không đổi tên/xoá cột, không đổi kiểu, hàm mới không thay hàm cũ). Cột/bảng/hàm mới (B1 sổ chi tiêu, C2 hàm thống kê) bản cũ không dùng nên không bị ảnh hưởng. Đây là bất biến I9 của spec.
3. **Deploy Edge Function/Worker có tác dụng ngay với bản `main` đang dùng.** B1/B2 phải nhận được đúng các yêu cầu mà bản `main` gửi (kể cả `user_id:null`). Test BCK-* (TEST §9.5) chạy bộ lời gọi của bản baseline lên backend đã đổi. Mỗi lần deploy cần TJ đồng ý riêng.
4. **Giao thức game phải tương thích hai chiều trong suốt dự án**, vì người dùng bản `main` và bản mới có thể cùng một phòng. Bất biến I4 từ "trong lúc cập nhật" thành "suốt dự án"; MP-18 (hỗn hợp phiên bản) lên tầng B.
5. **Hai origin khác nhau** (github.io và netlify.app): `localStorage`, `sessionStorage`, PWA đã cài không dùng chung; hồ sơ phải vào lại bằng `?u=`. Bộ lọc `Origin` của B1/B2 phải liệt kê cả hai host.
6. **Đừng dùng hồ sơ thật ở bản xem thử trên github.io của nhánh restructure** (đường dẫn `…/preview/feat-restructure-plan/`): nó cùng origin với `main` nên dùng chung `localStorage` với `main`. Dùng Netlify (origin riêng) để kiểm thử.

**Freeze và thay `main`.** Freeze = hoàn tất cột mốc cần thiết, đạt tiêu chí nghiệm thu của spec §9, và TJ đồng ý. Trình tự thay `main` (mỗi bước là một lệnh/quyết định riêng của TJ, không tự động):
1. Kiểm `origin/main` vẫn `e324beb` và còn fast-forward được.
2. Lưu `main` cũ: nhánh/tag `archive/main-before-restructure-<ngày>` trên `origin` (tiền lệ: `archive/main-before-20261019`).
3. `git push origin <đầu nhánh restructure>:main` (fast-forward, không force); GitHub Pages tự build lại.
4. Cập nhật `CLAUDE.md`/`README.md` (hosting, quy trình, các quy ước đã đổi).
5. Kiểm bản deploy; quyết định host chính sau khi thay (mục 9, câu 11).
6. **Quay lại nếu hỏng — có ba phương án, ưu tiên theo thứ tự (chốt ở mục 9, câu 12):**
   1. **Commit khôi phục (đề xuất; không force-push, giữ nguyên URL chính).** Tạo một commit **mới** có cây tệp đúng bằng cây của nhánh archive, đặt lên đầu `main` hiện tại, rồi đẩy bằng fast-forward bình thường. Ví dụ ý tưởng (chưa chạy): `git commit-tree <archive>^{tree} -p <đầu main> -m "Khôi phục frontend về <archive>"`, kiểm `git diff --stat <archive> <commit mới>` trống, rồi `git push origin <commit mới>:main`. Lịch sử restructure vẫn nằm nguyên trong `main` (không viết lại), nên sửa tiếp về phía trước dễ; GitHub Pages tự build lại; nếu Netlify là host chính, deploy của commit này tốn credit như mọi deploy production (hoàn tác bằng "publish lại deploy cũ" của Netlify không tốn credit nhưng chỉ tác dụng trên Netlify, không đổi `main`).
      - **Phải kiểm tương thích với backend tại thời điểm khôi phục.** Bản archive (frontend của `main` cũ) chạy trên backend đã được deploy thêm trong lúc song song (B1/B2/C2…). Điều kiện này do I9 và BCK-* bảo đảm *tại thời điểm deploy từng thay đổi*; trước khi thay `main` phải chạy lại BCK-* trên đúng trạng thái backend lúc đó và ghi kết quả vào hồ sơ freeze. Sau khi thay `main`, **mọi thay đổi backend tiếp theo** vẫn phải giữ BCK-* xanh cho tới khi TJ bỏ phương án khôi phục.
      - **Phải diễn tập trước khi thay `main`** (HST-10): làm commit khôi phục trên một nhánh tạm, kiểm cây bằng cây archive, phục vụ nó (bản xem thử/Netlify) và chạy BCK-* + MP-18 + HST-01..05 trên backend hiện hành.
      - Giới hạn: người dùng đã mở bản mới có thể còn mã cũ trong bộ nhớ đệm/PWA cho tới khi tải lại; dữ liệu `localStorage` do bản mới tạo chỉ dùng được nếu I3 đúng (bản cũ bỏ qua khoá lạ).
   2. **Phục vụ bản archive trên địa chỉ riêng** (đường dẫn Pages hoặc repo phụ) và hướng người dùng sang đó. Không đụng `main`, nhưng đổi URL, đổi origin (mất `localStorage`/PWA của người dùng) — chỉ dùng khi (1) không khả thi.
   3. **Ghi đè `origin/main` về nhánh archive (force-push).** Chỉ khi TJ chỉ đạo rõ bằng lời, vì viết lại lịch sử.

## 6. Kế hoạch theo luồng

### Luồng A — Restructure (giữ nguyên hành vi)

**A0 — Lưới an toàn (bắt buộc làm trước mọi thứ trong A và C)**
- Baseline đã chốt `e324beb` (mục 5; không merge `main`). Chốt xử lý `handoff/gate` (mục 5). Ghi SHA baseline.
- Đo số liệu gốc cho bảng mục 7 và lưu lại.
- Test Node cho `context`, `srs`, adapter local của `db`; chuyển các mục "Lỗi đã sửa" trong `CLAUDE.md` thành test hồi quy.
- Workflow CI chạy `node --check` + test trên mọi PR.

*Khung kiểm thử trình duyệt (Playwright) — phải xong trước khi A1 đụng 119 điểm gọi Supabase của game:*
- **Cố định môi trường trước khi đòi "sai khác = 0":** dữ liệu mẫu cố định (fixture), đồng hồ giả (`page.clock`), gieo `Math.random` cố định *(riêng bài hai client: hạt giống KHÁC nhau cho từng context, vì `G.tab` sinh từ `Math.random` và dùng để bầu host)*, tắt animation/transition, viewport + font cố định. Chạy bản chuẩn **hai lần liên tiếp**; chỉ khi hai lần giống hệt nhau mới dùng làm chuẩn. Vùng nào còn dao động (vd avatar, ảnh tải chậm) thì che mặt nạ và ghi lý do, không nới ngưỡng chung.
- **Supabase giả (mock) ở tầng mạng:** `page.route` cho `/rest/v1/*`, `/storage/v1/*`, `/functions/v1/*` với kho dữ liệu trong bộ nhớ (thực hiện các bộ lọc mà app đang dùng: `eq`, `in`, `or`, phân trang, `upsert`). Realtime giả (`channel`, `subscribe`, `unsubscribe`, `broadcast`, `presence`, đổi trạng thái `SUBSCRIBED/CLOSED/CHANNEL_ERROR`) dựng bằng **broker trong tiến trình test**, mỗi client một `BrowserContext` riêng nối qua broker (`page.exposeBinding`). Không dùng hai trang cùng context vì game có `BroadcastChannel("tjwl_game_tabs")` tự đá tab thứ hai khỏi phòng, người chơi lưu theo `localStorage` nên hai trang chung context là cùng một người, và `BroadcastChannel` không nối được giữa các origin/cổng khác nhau (cần cho bài kiểm hai phiên bản). Chi tiết ở `TEST_REGRESSION_RESTRUCTURE.md` §7.
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

**A2 — ES modules gốc** (`<script type="module">`). Vẫn không cần build, chạy được trên GitHub Pages và Netlify (cả hai chỉ phục vụ tệp tĩnh). Thứ tự lá trước, gốc sau: `util`, `srs`, `context`, `speech`, `db`, `auth`, các feature, cuối cùng `app`. Bỏ `window.X` dần; giữ lớp tương thích tạm cho code chưa chuyển.

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

**A4 (tuỳ chọn) — Vite.** Băm tên file thay `?v=N`, loại hẳn lỗi cache. Đổi lại có build step và phải có nơi chạy build (GitHub Actions cho Pages, hoặc Netlify tự build; Netlify sinh `dist/` rất hợp, xem luồng H). Chỉ làm nếu TJ chọn (mục 9, câu 3); có thể được kéo lên trước A2 nếu import map không dùng được trên thiết bị đích (xem cổng version ở A2).

### Luồng B — Vá bảo mật (đổi hành vi; commit riêng trong dòng tích hợp; deploy là bước riêng)

Mã viết trong worktree này như mọi việc khác (`main` đóng băng, không nhánh `fix/…` riêng). Nhưng **deploy Edge Function/Worker/SQL là bước ngoài git, có tác dụng ngay với bản `main` đang dùng** (mục 5.1), quay lại bằng cách deploy bản cũ, và cần TJ đồng ý và cấp secret từng lần. **Tách hai việc:**
- **Viết mã B** (Edge Function, Worker, SQL, test) có thể làm song song với A, không cần chờ A0.
- **Deploy B1/B2 (và mọi SQL/Function/Worker) KHÔNG được chạy trước** khi: (a) bộ lời gọi baseline của đúng thành phần đó đã được thu ở `e324beb` (ROADMAP M0.5a; TEST §13.7), (b) các ca BCK-* tương ứng đạt (BCK-01/02 cho B1, BCK-03 cho B2, BCK-04/05 cho SQL/RPC), (c) TJ đồng ý từng lần. Không có đầu vào baseline thì "tương thích ngược" chỉ là giả định.
- B3 (đối chiếu schema, chỉ đọc) không bị ràng buộc này.
- **Đánh đổi cần TJ biết:** B1 vá lỗ hổng chi phí, nên bị M0.5a làm chậm. M0.5a được tách riêng, nhỏ (chỉ thu các lời gọi tới Edge Function AI và Worker `tj-shelf`, từ các điểm gọi đã biết), để không phải chờ hết M0 (ước 3–4 phiên). Nếu TJ muốn vá khẩn cấp hơn, có phương án thay: kiểm tay bốn đường gọi hợp lệ trên bản baseline với ghi chép có chữ ký của TJ, rồi deploy; ghi rõ đó là ngoại lệ có chủ đích, không phải chuẩn.

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

### Luồng H — Hosting (Netlify cho dòng restructure; xem `PLAN_NETLIFY_FRONTEND.md`)

Chi tiết N0–N3, chi phí, rollback nằm ở file đó; ở đây chỉ ghi phần **điều chỉnh theo mô hình hai dòng** và phần plan Netlify chưa nói.

| Mã | Việc | Điều chỉnh / bổ sung |
|---|---|---|
| H0 (= N0) | Xác minh dashboard Netlify cũ, quyền, gói, credit | Thêm: hết credit thì **mọi site trong tài khoản bị pause** và gói Free là giới hạn cứng (đã kiểm tài liệu Netlify); kiểm các site khác trong team |
| H1 (= N1) | Cấu hình site phục vụ **nhánh `feat/restructure-plan`**, không phải `main` | Mặc định dùng **branch deploy** (0 credit cho thao tác deploy, URL ổn định theo tên nhánh) thay vì đặt nhánh này làm production branch (mỗi lần push tốn 15 credit). Chốt ở N0 sau khi xác minh định dạng URL. `main` không nối vào Netlify trong giai đoạn song song |
| H1b | Publish directory | Netlify publish cả thư mục; muốn artifact chỉ chứa frontend thì cần bước copy sang `dist/`, xung đột bất biến I8 (không build step). Chọn: (a) publish nguyên gốc, giống Pages hiện nay, (b) script copy nhỏ, (c) để A4 (Vite) sinh `dist/`. Đề xuất (a) cho giai đoạn song song |
| H1c | Cấu hình bỏ qua build khi không đổi file frontend | Chỉ cần nếu dùng production branch; với branch deploy thì không tốn credit nên chưa cần |
| H2 (= N2) | Kiểm chứng | Dùng bộ test của dự án (TEST) trỏ vào URL Netlify; "game hai thiết bị" ghi dữ liệu `ZZ_…` lên backend thật cần TJ cho phép và quy trình dọn (TEST §12) |
| H3 (= N3) | Chuyển địa chỉ chính | **Không còn là một cột mốc riêng.** Sau khi thay `main` (mục 5.1), quyết định host chính (câu 11). Plan Netlify giữ nguyên các bước thông báo/rollback |

Cache: Netlify và Pages có thể đặt `Cache-Control` mặc định khác nhau (nhớ Netlify mặc định revalidate, Pages `max-age=600`; **chưa kiểm**). Đo bằng `curl -I` trên bản deploy đầu tiên; kết quả chỉ làm nhẹ áp lực của cổng version A2, không thay thế nó (danh tính module là URL).

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

Mỗi bước A được commit vào dòng tích hợp (`feat/restructure-plan`) chỉ khi: CI xanh, ảnh chụp sai khác = 0, nhật ký lời gọi khớp chuẩn, và (với bước đụng `game.js`/giao thức) đã kiểm tay hai thiết bị thật trên bản Netlify. **Không có bước nào đẩy lên `main`**; `main` chỉ thay một lần ở cuối (mục 5.1). Quay lại: mỗi bước là một nhóm commit có thể `git revert`; riêng thay đổi backend (luồng B, C2) quay lại bằng deploy bản cũ vì chỉ THÊM, không đổi schema hiện có.

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
| Bản mới ghi sai vào DB dùng chung → hỏng dữ liệu bản `main` đang dùng | Cao | Chỉ ghi bằng hồ sơ thử cho tới khi nhật ký lời gọi khớp; TJ đồng ý trước khi ghi bằng hồ sơ thật (mục 5.1) |
| Deploy backend (B1/B2/C2) làm hỏng bản `main` đóng băng | Cao | Tương thích ngược bắt buộc (I9), test BCK-*, mỗi lần deploy TJ đồng ý |
| Hai phiên bản client cùng phòng game trong nhiều tuần | Trung bình | Giao thức đóng băng (I4), MP-18 tầng B |
| Hết credit Netlify làm pause cả tài khoản | Trung bình | Branch deploy (0 credit), chốt ngân sách ở N0 (câu 10) |
| `origin/main` bị ai đó push → mất khả năng fast-forward | Trung bình | Không push `origin/main`; kiểm bằng lệnh trong anchor trước mỗi phiên |
| Thay `main` rồi hỏng, cần quay lại | Trung bình | Lưu archive; ưu tiên **commit khôi phục** (cây = cây archive, fast-forward, không force, giữ URL) đã diễn tập (HST-10) và kiểm BCK-* trên backend hiện hành (mục 5.1 bước 6, câu 12) |
| Deploy backend trước khi có baseline lời gọi → "tương thích ngược" chỉ là giả định | Cao | Cổng deploy B: M0.5a + BCK-* đạt + TJ đồng ý (luồng B) |
| Chỉnh tài liệu trong `8b071e6` thất lạc khi thay `main` | Thấp | Chuyển tay ở M1.7 nếu TJ muốn giữ |

## 9. Cần TJ quyết

*Đã chốt (TJ 2026-10-20):* câu 2 (`main` đóng băng, mọi việc chỉ trong worktree này, một dòng tích hợp, kể cả luồng B), câu 8 (baseline `e324beb`, cherry-pick không merge), cách thay `main` ở cuối (fast-forward, không force), hai dòng song song Pages/Netlify. Các câu còn mở: 1, 3–7, 9–12.

1. Chấp nhận A0 (lưới an toàn) trước khi đụng code?
2. ✔ **Đã chốt:** `main` đóng băng; mọi việc chỉ trong worktree này; một dòng tích hợp duy nhất.
3. Cơ chế version cho A2: import map (cần Safari iOS ≥ 16.4: người chơi iPhone của bạn dùng bản nào?), script đóng dấu, hay kéo Vite lên trước A2? (Đề xuất: import map nếu thiết bị đích đủ mới; nếu không thì Vite trước. Không bắt đầu A2 khi chưa chọn.)
4. `tools/` ra repo riêng (private) hay chỉ ra thư mục riêng? (Đề xuất: repo riêng, vì có đề ETS.)
5. Kệ sách `tj-shelf`: (a) token trong JS công khai + giới hạn `Origin` và tốc độ (chặn người bình thường, không chặn người cố ý); (b) chỉ host được ghi/xoá qua chữ ký ngắn hạn do Edge Function cấp (chặt hơn nhưng chỉ chắc nếu hồ sơ host được xác thực thật); (c) chấp nhận rủi ro vì là sách tham khảo có bản gốc ở nơi khác, chỉ sửa phần `listAll`.
6. Sổ chi tiêu AI (B1): (a) trần mỗi ngày là bao nhiêu USD (cần con số)? (b) Khi sổ không đọc/ghi được: đóng (AI dừng, an toàn chi tiêu — đề xuất) hay mở (AI vẫn chạy, mất bảo vệ trong lúc DB hỏng)? (c) Gemini miễn phí có tính vào trần theo giá danh nghĩa không (đề xuất: có, để một trần chặn cả hai)?
7. `handoff/gate`: giữ và merge trước, hay hoãn đến sau A3?
8. ✔ **Đã chốt:** baseline `e324beb`; không merge/rebase `main`; lấy commit khác bằng cherry-pick.
9. **Ghi dữ liệu thật từ bản mới (mục 5.1):** đồng ý quy tắc "chỉ ghi bằng hồ sơ thử/phòng `ZZ_…` cho tới khi nhật ký lời gọi khớp, rồi TJ đồng ý mới ghi bằng hồ sơ thật"? Hay muốn một bản sao Supabase riêng cho dòng restructure (an toàn hơn nhưng tốn công dựng và đồng bộ dữ liệu)?
10. **Netlify:** (a) dùng site Netlify cũ hay tạo site mới? (b) branch deploy cho nhánh restructure (0 credit, đề xuất) hay đặt nhánh làm production branch (15 credit mỗi lần push)? (c) ngân sách chấp nhận nếu sau này cần gói trả phí?
11. **Host chính sau khi thay `main`:** vẫn GitHub Pages, hay chuyển sang Netlify (khi đó plan Netlify N3 mới áp dụng)?
12. **Dự phòng quay lại** sau khi thay `main` (mục 5.1 bước 6): (1) commit khôi phục cây archive rồi fast-forward — không force-push, giữ URL (đề xuất), kèm diễn tập HST-10 và duy trì BCK-* xanh sau khi thay; (2) phục vụ archive ở địa chỉ riêng; (3) force-push khi TJ chỉ đạo. Chọn (1) có chấp nhận ràng buộc "backend về sau luôn tương thích với frontend archive" không, và trong bao lâu?

## 10. Ước lượng thô (chưa kiểm chứng)

A0: 1–2 phiên · A1: 2–3 · A2: 3–5 · A3: 5–8 · B1–B3: 1–2 phiên (làm song song) · C1: dưới 1 · C2: 1–2 · C3: 1–2 · H0–H2: dưới 1–2 (song song). Luồng A tổng khoảng 11–18 phiên theo bản 1; `ROADMAP_RESTRUCTURE.md` §10 có số cập nhật (14–21, vì A0 nặng hơn).

## 11. Ràng buộc phải giữ trong suốt quá trình

- Bump `?v=N` đúng file đã sửa (và `game-version.json` khớp `game.html`) cho đến khi có A4.
- `data/starter.json` và `data/starter.version.json` luôn khớp `version`.
- Chỉ THÊM cột/bảng/hàm DB, chạy SQL trước khi merge code, không tự chạy khi chưa được TJ đồng ý.
- **Không push `origin/main`, không merge `main` vào dòng này** cho tới lúc freeze và thay `main` (mục 5.1). Khi thay, `git push origin <đầu nhánh>:main` là một lệnh riêng do TJ bảo.
- Backend dùng chung với bản `main` đóng băng: chỉ THÊM, tương thích ngược; mỗi lần deploy cần TJ đồng ý (I9).
- Không commit file đề ETS, không dán key/token vào file.
- Không hồi lại các thứ đã bỏ hẳn (xem "Quyết định đã chốt" trong `CLAUDE.md`).

## 12. Giới hạn của bản đánh giá

Chỉ đọc cấu trúc, đếm số liệu và đọc các đoạn code liên quan đến từng phát hiện. Chưa đọc thân hàm đầy đủ của hai proxy và `worker.js`, chưa chạy app, chưa đo thời gian tải thật, chưa đối chiếu schema với database production, chưa kiểm phụ thuộc vòng chi tiết giữa `game.js` và `app.js`. A0 và B3 sẽ làm rõ các điểm này.
