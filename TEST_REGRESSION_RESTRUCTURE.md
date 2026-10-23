# TEST_REGRESSION_RESTRUCTURE — kế hoạch kiểm thử hồi quy cho restructure

> Trạng thái: **A0 đã duyệt và có mã test; các phần còn lại là đặc tả chờ thực hiện.** Cycle Node ngày 2026-10-22 ở `tests/a0/` có báo cáo PARTIAL và ma trận độ phủ tại `tests/a0/README.md`; không coi số ca trong đặc tả này là số test đã chạy. Bộ M0.5a cũ ở `tests/capture/` vẫn được kiểm lại.
> Nguồn: `PLAN_RESTRUCTURE.md` bản 2.2 (hai dòng song song: `main` đóng băng trên GitHub Pages, dòng restructure trên Netlify, dùng chung backend), `SPEC_RESTRUCTURE.md` (bất biến I1–I9), mục "Lỗi đã sửa" và "Quyết định đã chốt" trong `CLAUDE.md`.
> Mọi chỗ ghi "(chưa xác minh)" là điều A0 phải kiểm trước khi viết ca tương ứng.

## 1. Mục tiêu và nguyên tắc

**Mục tiêu:** chứng minh sau mỗi bước restructure, sản phẩm *hành xử như trước* — không chỉ *trông như trước*.

1. **Test chạy trên mã hiện tại trước, xanh hết, rồi mới dời mã.** Một test chỉ có giá trị khi đã xanh trên baseline (SPEC/ROADMAP, nguyên tắc 3).
2. **Ba loại ca**, ghi trong cột "Loại":
   - **R** (regression): chống lỗi đã từng sửa thật (nguồn: mục "Lỗi đã sửa").
   - **C** (characterization): ghi lại hành vi hiện tại là *chủ ý* (nguồn: "Quyết định đã chốt").
   - **K** (known): ghi lại hành vi hiện tại là *giới hạn đã biết, chưa sửa*. Test K khẳng định hành vi hiện tại để restructure không vô tình đổi nó; **không** được sửa mã để làm test K "đẹp" hơn. Nếu K đổi kết quả, đó là tín hiệu để hỏi TJ, không phải tự cập nhật.
3. **Cập nhật chuẩn (golden/ảnh/nhật ký) cần TJ duyệt từng dòng khác, và nằm ở PR riêng** không lẫn với thay đổi cấu trúc.
4. **Không bao giờ nới ngưỡng** để qua test. Ảnh không ổn định thì che mặt nạ có ghi lý do; test chập chờn thì sửa nguyên nhân hoặc cách ly có công khai (mục 11).
5. **Test an toàn với dữ liệu thật:** không ghi lên Supabase thật, không vào phòng `TJ` (mục 12).

Ba bậc ưu tiên (cột "Tầng"): **B** = chặn merge; **N** = chạy hằng đêm/khi gọi; **M** = kiểm tay có checklist.

## 2. Phân tầng kiểm thử

| Tầng | Công cụ | Phủ | Mục |
|---|---|---|---|
| Tĩnh | Node + grep | cú pháp, version, bí mật, file cấm, CSS cấm | §3.3 |
| Đơn vị hàm thuần | Node (shim `window`/`localStorage`/`fetch`) | `Context`, `SRS`, `normalizeAnswer`, `esc` | §3.1–3.2 |
| Lớp dữ liệu | Node + Supabase giả | adapter local/cloud, khoá `localStorage` | §4 |
| Nhật ký lời gọi chuẩn | Playwright + mock mạng | I2 | §5 |
| Giao diện (ảnh) | Playwright | I1 | §6 |
| Hai client | Playwright, mỗi client một context + broker Realtime giả trong tiến trình test | I4, giao thức game | §7 |
| Luồng tính năng | Playwright | hành vi WordLoop/Bảng | §8 |
| Máy chủ | Deno/Node + provider giả; SQL trên bản sao | luồng B và C | §9 |
| Kiểm tay | checklist, thiết bị thật | âm thanh, WebRTC thật, iOS | §11.3 |

## 3. Tĩnh và đơn vị (Node)

### 3.1 `Context` (bài đọc, đề, AI)

| ID | Loại | Tầng | Kiểm gì (đầu vào → kết quả đạt) |
|---|---|---|---|
| CTX-01 | R | B | `_markTerms` với `["cost","irreversible cost"]`: kết quả có `[irreversible cost]` nguyên vẹn, không `irreversible [cost]` (luôn sắp từ dài trước) |
| CTX-02 | R | B | `gapSentences` giữ **đoạn cuối không có dấu kết câu** (văn bản dán bị cắt giữa chừng) |
| CTX-03 | C | B | Bộ 10 từ cố định: `gapSentences(marked).length === 10`, khớp đủ 10 từ, không thiếu/thừa/trùng |
| CTX-04 | K | B | Câu chứa `[term]` đứng sau chữ viết tắt có dấu chấm (`Mr.`…): ghi nhận kết quả hiện tại (câu bị cụt). **Không sửa regex** trong restructure |
| CTX-05 | R | B | `parseMeta`: ba cờ `ai`/`pasted`/`claude` loại trừ lẫn nhau; **`pasted` được trả ra khi đọc lại** (lỗi cũ: khai báo khi tạo nhưng quên trả) |
| CTX-06 | C | B | Vòng tròn: `parseMeta(marked + META_SEP + JSON.stringify(meta)).marked === marked` |
| CTX-07 | C | B | `translate(g.text, g.term, null, meta.vi)` khác rỗng cho mọi gap khi `meta.vi` đủ khoá (chữ thường) |
| CTX-08 | R | B | `splitChapters`: cắt theo tầng đoạn → câu → dòng → từ; văn bản **không dấu câu** dài 30.000 ký tự: mọi phần ≤ giới hạn; khi phát hiện không dấu câu dùng `MAX=5000` (có dấu câu: 11.000/12.000) |
| CTX-09 | C | B | `_callProvider` ở Cloud: tài khoản thường Gemini trước, Gemini lỗi mới sang OpenAI; riêng TJ OpenAI trước, lỗi mới sang Gemini (PO xác nhận giữ nguyên 2026-10-22); gọi qua `…/functions/v1/gemini-proxy` và `…/openai-proxy`, **không** gọi thẳng Google/OpenAI; không có `GEMINI_API_KEY` ở client |
| CTX-10 | C | B | Timeout cứng 25 giây (đồng hồ giả): sau 25s huỷ bằng `AbortController`, báo lỗi đúng loại |
| CTX-11 | C | B | 403 `{kind:"quota_user"}` từ proxy được báo thành thông điệp hết lượt, không thử nhà cung cấp kia để lách |
| CTX-12 | C | B | `lookupWord` (và `quotaCtx = null`): body gửi `user_id:null, block_id:null` (không ăn quota 3 Block). Cùng kiểm cho chấm câu, tra nghĩa trên bảng, dịch CC (nối với I2) |
| CTX-13 | C | B | Không có AI và không có bài dán → **trả rỗng**, không sinh câu mẫu cố định (quyết định "không bịa") |
| CTX-14 | C | N | `generateAI`: `difficulty=null` chọn ngẫu nhiên 1 trong 3 (random gieo cố định); prompt mặc định có `{{PICK}}` do **code** chọn; `avoidTitles` = tiêu đề bài đang dùng + mọi candidate |
| CTX-15 | C | B | `extractVocab`/`enrichWords` truyền `quotaCtx` giả `pasteq…` dùng chung cho cả lượt dán nhiều chương |

### 3.2 `SRS`, `util`, tính điểm

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| SRS-01 | C | B | `SRS.advance`/`demote`/`stepFor`/`groupOf`/`state` theo bảng bước hiện tại; nhãn "Đã vào trí nhớ dài hạn 💎" khi hết chu kỳ |
| UTL-01 | C | B | `normalizeAnswer` bảng đầu vào: hạ chữ thường → cắt hai đầu → xoá `. , ! ? ; : " ' \` ( ) [ ]` → gộp khoảng trắng. **`"( cat )"` ra `" cat "`** (không cắt lại). `null`/`undefined` ra `""`. Đây cũng là *oracle* của C2 |
| UTL-02 | C | B | `esc` thoát `& < > "`; chuỗi `null` ra rỗng |
| RA-01 | C | B | Chấm đọc theo (`ReadAlong`): đúng / sai / bỏ sót (nhảy cóc) / từ thừa bỏ qua; từ lệch 1–2 chữ cái tính đúng; điểm = đúng ÷ số từ đã đọc tới (không phạt phần chưa đọc). *Nếu hàm không truy cập được từ ngoài IIFE (chưa xác minh) thì kiểm ở tầng trình duyệt với `SpeechRecognition` giả* |

### 3.3 Kiểm tĩnh

**Quy tắc ngoại lệ baseline (áp cho mọi ca tĩnh).** M0 yêu cầu mọi ca tầng B xanh *trên mã chưa đổi*. Nếu một ca bắt được vi phạm có sẵn từ trước, **không** được bỏ qua âm thầm, cũng không sửa mã ngay trong M0. Chọn một trong hai:
1. **Ratchet:** đo vi phạm hiện có ở M0, ghi vào tệp danh sách ngoại lệ có lý do từng dòng; test đỏ khi có vi phạm *mới*, xanh khi danh sách *giảm*. Danh sách được duyệt cùng M0.
2. **Tách bước sửa trước cổng M0:** chỉ khi vi phạm là lỗi thật đáng sửa ngay, làm thành commit riêng trên dòng tích hợp (không lẫn vào commit dời mã, có bump), merge xong mới tính cổng.

Kiểm đo trên baseline (2026-10-20, `e324beb`) cho STA-03: có 5 mục cục bộ không `?v=` — `index.html:25–27` (`manifest.webmanifest`, `icon.svg`, `apple-touch-icon` → `icon.svg`), `game.html:7` (`icon.svg`), `learn/sw/index.html:15` (`../../js/config.js`). `learn/dm`, `learn/ea` không có mục nào.

| Mục | Xử lý | Lý do |
|---|---|---|
| `manifest.webmanifest`, `icon.svg` (3 chỗ) | Ngoại lệ **vĩnh viễn** trong `tests/a0/STA-03.allow.json` | Tài nguyên hầu như không đổi, không phải mã; thêm `?v=` không có lợi |
| `learn/sw/index.html` → `../../js/config.js` | Ngoại lệ **tạm** trong `tests/a0/STA-03.allow.json` + sửa trong commit ứng dụng riêng trước nghiệm thu preview, thêm `?v=` đúng số của `index.html` và xoá dòng khỏi danh sách (PO chốt 2026-10-22) | Có rủi ro thật (cache cũ của cấu hình), nhưng đổi nó là sửa mã ngoài phạm vi M0; không gộp vào restructure |

Mọi danh sách ngoại lệ nằm cạnh bộ test và chỉ được sửa bởi PR có TJ duyệt.

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| STA-01 | C | B | `node --check` mọi `.js` đã theo dõi |
| STA-02 | R | B | `data/starter.json` `version` **trùng ký tự** với `data/starter.version.json` (lỗi vòng lặp "Thư viện có bản mới") |
| STA-03 | R | B | **Kiểu ratchet (chỉ được giảm):** mọi `<script src>`/`<link href>` cục bộ trong `index.html`, `game.html`, `learn/*/index.html` phải có `?v=`, *ngoại trừ* các mục trong danh sách ngoại lệ baseline `tests/a0/STA-03.allow.json` (đo ở M0, xem dưới). Thêm mục mới vào danh sách = đỏ; bớt mục = được. `GAME_VER` (từ `game.js?v=` trong `game.html`) trùng `game-version.json`. Sau M2: thay bằng STA-10 |
| STA-04 | R | B | Không chuỗi `GEMINI_API_KEY=`/`sb_secret_`/`sbp_` trong `js/`, `supabase/`, `*.html`, `tools/**/*.js` (trừ ví dụ có chú thích rõ) |
| STA-05 | C | B | `SUPABASE_ANON_KEY` trong `js/config.js` giải mã ra `role: "anon"` (lỗi cũ: nhầm `service_role`) |
| STA-06 | C | B | Không file đề ETS bị theo dõi: danh sách `git ls-files` không chứa `*.pdf`, `*.mp3` ngoài danh sách cho phép (liệt kê ở A0) |
| STA-07 | R | B | CSS bài đọc/bảng từ vựng không có `hyphens:auto`, `overflow-wrap:anywhere`, `word-break:break-all` (lỗi hiện "sch-/ool"). *Trạng thái hiện tại của repo: chưa đo; nếu đang vi phạm thì ghi vào danh sách ngoại lệ có TJ duyệt, không sửa trong restructure* |
| STA-08 | C | B | Mọi đường dẫn trong `ASSETS` của `sw.js` tồn tại |
| STA-09 | C | B | Không tên `window.X` mới ngoài danh sách tương thích; số dòng `// compat` giảm đơn điệu (từ M2) |
| STA-10 | C | B | Đồ thị import không vòng; mỗi module đúng một mục version (từ M2) |
| STA-11 | R | B | **Mã không bị chú thích nuốt:** nạp từng file JS trong Node/trình duyệt giả và gọi điểm vào công khai của nó với tham số giả (`node --check` không bắt được lỗi này). Bổ sung bởi BRD-01 |

## 4. Lớp dữ liệu

### 4.1 Local và khoá `localStorage` (Node + shim)

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| LS-01 | C | B | **Nhật ký khoá `localStorage`:** chạy các kịch bản chuẩn, ghi lại mọi khoá được đọc/ghi + hình dạng giá trị; so sánh trước/sau (I3). Ví dụ khoá đã biết: `tjwl_deleted_ids_v1`, `tjwl_bookmarks_v1`, `tjwl_wrong_open_v1`, `tjwl_wrong_ctx_v1`, `tjwl_voice_raw_v1`; danh sách đầy đủ do A0 lập (16 file đang dùng `localStorage`) |
| DB-01 | R | B | `applyStarter`: mục user đã chuyển Hub/Notebook/Section giữ nguyên field cha của bản local (so sánh cha giữa local và fresh) |
| DB-02 | R | B | `applyStarter`: mục đã xoá (`tjwl_deleted_ids_v1`) **không hồi sinh** khi có trong thư viện mẫu mới |
| DB-03 | C | B | `duplicateNotebook`: `progressScope` = `null` (trắng) / `"__ALL__"` / uuid; ánh xạ `blockIdMap`/`wordIdMap`; giữ `user_id` gốc; là ảnh chụp một lần (sửa bản gốc sau đó không ảnh hưởng bản sao) |
| DB-04 | C | B | `exportJSON` → `importJSON` thay thế toàn bộ (không gộp) và vòng tròn không mất dữ liệu |
| DB-05 | R | B | `bmState`: `bookmarked` null = chưa bấm; mặc định ⭐ chỉ cho từ trong batch "⭐ Từ đã lưu" **mà chính user có dòng `word_progress`** và chưa ở mức 5; bỏ ⭐ ghi `false` (kể cả bản lưu tạm). Người khác không thấy ⭐ cho từ họ lưu |
| DB-06 | C | B | `markResults`: sai → `wrong_open=true`, đúng lại → `false`; câu bỏ trống không tính sai; thiếu cột → rơi về lưu tạm mà điểm vẫn lưu |
| DB-07 | C | B | Fix lỗi sai: `wrong_ctx` dựng lại đúng câu + đúng 4 đáp án; **chỉ gỡ khỏi Fix khi làm đúng cùng loại** (điền từ↔điền từ, nghĩa↔nghĩa cùng ngôn ngữ) hoặc ngay trong màn Fix |
| DB-08 | C | B | Thống kê không đếm trùng: `getJourneySummary` (local) cho `totalWords`/`mastered` theo `normalizeAnswer(term)`, bỏ chuỗi rỗng; danh sách Ôn riêng/Fix gộp bản trùng (`dup_ids`) |
| DB-09 | C | B | Ôn riêng: `ensureOnRieng` chỉ tạo khi `canOnRieng()`; id cố định (`hub_onrieng`, `nb_onr_<uid>`, `bl_onr_<uid>_<n>`…); `syncOnRiengBlocks`: bỏ ⭐ → gỡ khỏi Block (bài đọc giữ), Block rỗng → xoá, ⭐ mới → lấp Block cuối rồi mở Block mới (10 từ/Block), không xếp lại Block cũ |

### 4.2 Cloud với Supabase giả

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| CL-01 | R | B | **`progressLocal()`:** kho Cloud nhưng chưa đăng nhập thật → `getFullTree`/`getJourneySummary`/`loadProgress` **không gửi** id hồ sơ local (`us_…`, không phải uuid) lên `block_progress`/`word_progress`. Mock trả `22P02 invalid input syntax for type uuid` nếu nhận id sai |
| CL-02 | R | B | Chèn hàng loạt: mock PostgREST trả `PGRST102 "All object keys must match"` khi bộ khoá các object khác nhau; các đường `insertMany` phải luôn pass |
| CL-03 | C | B | `sbListAll` phân trang: kho 2.500 dòng trả đủ 2.500, không trùng/thiếu |
| CL-04 | C | B | Cache `distinctWordIndex` 10 phút; `insertOne/insertMany("words")` xoá cache (`invalidateDistinctWords`) |
| CL-05 | C | B | Thiếu cột `bookmarked`/`wrong_open`/`wrong_ctx`/`ref_word_ids` (mock trả lỗi cột): app rơi về lưu tạm, không sập |
| CL-06 | C | B | Hồ sơ máy dùng kho Cloud nhưng không đăng nhập thật: **không** tạo Hub Ôn riêng, không ghi rác lên kho chung |

## 5. Nhật ký lời gọi chuẩn (I2)

**Mục đích:** bắt thay đổi hành vi mà ảnh không thấy, nhất là khi 119 điểm gọi Supabase của `game.js` chuyển về `data/` (M1.4).

**Định dạng:** với mỗi kịch bản, ghi danh sách có thứ tự các lời gọi: `{kênh: rest|storage|function|worker|realtime, đối tượng (bảng/đường dẫn/tên kênh), thao tác, bộ lọc chuẩn hoá, tập khoá của payload (không giá trị dễ đổi)}`. Giá trị dễ đổi (id sinh bởi `uid()`, thời gian, mã phòng) thay bằng chỗ giữ chỗ ổn định (`<id1>`, `<now>`).

**So sánh:** thứ tự *trong cùng nhánh bất đồng bộ* phải giữ; thứ tự giữa các nhánh song song so như tập hợp. Khác biệt chỉ được chấp nhận khi PR liệt kê *từng dòng* khác kèm lý do và TJ duyệt.

| ID | Kịch bản (mock; phòng `ZZ_…` cho game) | Tầng |
|---|---|---|
| CALL-W01 | Khởi động Cloud với hồ sơ TJ: `DB.init` → `Auth.init` → nạp Hub/Notebook → Journey | B |
| CALL-W02 | Mở Notebook → Block → học tab Nghĩa → trả lời hết → tự chấm → ghi tiến trình | B |
| CALL-W03 | Phiếu đầy đủ: nộp bài, đạt ≥80% → `bp.passed`, `review_history` | B |
| CALL-W04 | Bấm ⭐ một từ; mở "⭐ Ôn riêng"; làm một câu sai; "❌ Fix lỗi sai" làm lại | B |
| CALL-W05 | Dán danh sách từ → `enrichWords` (AI giả) → tạo Batch | B |
| CALL-W06 | "🔄 Tạo lại" bài đọc (AI giả) → ghi `context_passage_candidates` đúng nhóm nguồn | B |
| CALL-W07 | Nhân bản Notebook với `progressScope` = `__ALL__` | N |
| CALL-W08 | Đăng nhập qua `?u=`; ghi `site_visits` | B |
| CALL-G01 | Host tạo phòng ZZ, chọn chủ đề, bắt đầu ván điền từ, kết thúc, ghi lịch sử | B |
| CALL-G02 | Người chơi vào phòng, trả lời, rời | B |
| CALL-G03 | Ván đề thi TOEIC: tải câu hỏi, audio qua Worker, chấm | N |
| CALL-G04 | Bảng: mở tài liệu, kệ sách (`list`/`PUT`/`DELETE` qua Worker `tj-shelf`, mock) | B |
| CALL-G05 | Chia sẻ tệp tạm `lib/_tmp/<mã phòng>/…` và xoá khi thay/đóng/`pagehide` | B |
| CALL-G06 | Chấm câu viết (LanguageTool + `gemini-proxy`, mock) | N |
| CALL-G07 | Lịch sử → "Ôn ngay" (`pastToeicReview`, `G.rvMid`) | N |

## 6. Giao diện (I1)

**Điều kiện cho "sai khác = 0"** (plan, A0): chạy chuẩn hai lần liên tiếp phải giống hệt; vùng dao động che mặt nạ có ghi lý do; không nới ngưỡng chung. Chi tiết môi trường ở §12.

**Màn hình × cỡ:** ma trận tối thiểu (tầng B) và đầy đủ (tầng N). Cỡ: `390×844` (qua iframe 390, vì Chrome headless không cho cửa sổ nhỏ hơn ~500px — `CLAUDE.md`), `768×1024`, `1280×800`; đầy đủ thêm `1024×768` (thanh trên cùng từng tràn ở ~1024px) và `1920×1080`.

| ID | Màn | Trạng thái chụp | B | N |
|---|---|---|---|---|
| VIS-W01 | `screen-home` | có dữ liệu / rỗng | 1280, 390 | tất cả cỡ |
| VIS-W02 | `screen-blocks` | danh sách Block, chip Batch, thanh trên cùng (nút ⭐/❌ đủ số), breadcrumb dài | 1280, 390 | tất cả |
| VIS-W03 | `screen-detail`, 7 tab: study, quiz, sheet, single, meaning, progress, dictation | mỗi tab một ảnh; riêng study kèm bài đọc có `[term]` | study, meaning × 1280, 390 | tất cả tab × tất cả cỡ |
| VIS-W04 | Bảng tra từ (Reader) | mở trên một từ có cắt dấu câu | 1280 | tất cả |
| VIS-W05 | `screen-journey`, `screen-leaderboard` | có dữ liệu | 1280 | tất cả |
| VIS-W06 | `screen-wordset`: Ôn riêng, Fix lỗi sai (nhóm 10 từ) | | 1280 | tất cả |
| VIS-G01 | Game lobby: host / người chơi | | 1280, 390 | tất cả |
| VIS-G02 | Game đang chơi (điền từ, đề thi) | | 1280 | tất cả |
| VIS-G03 | Kết thúc ván; lịch sử | | 1280 | tất cả |
| VIS-G04 | Bảng: tài liệu `wl` và bảng từ vựng `vt`, kệ sách, thanh đáy `[ô chat][🎤][CC][💬]`, CC ba cỡ | | 1280, 390 | tất cả |
| VIS-L01 | `learn/dm`, `learn/ea`, `learn/sw` trang vào | | 1280 | tất cả |
| VIS-T01 | **Toàn vẹn chữ trên Bảng:** đo bằng DOM (không chỉ ảnh) rằng chữ bài đọc không bị ngắt giữa từ (`hyphens:none`, `overflow-wrap:break-word`) và không tràn | | B | |

## 7. Hai client và giao thức game (I4)

**Cách chạy: mỗi client một `BrowserContext` Playwright riêng, nối với nhau bằng một *broker Realtime giả* chạy trong tiến trình test; phòng `ZZ_…`.**

Vì sao không dùng hai trang cùng context (đã đọc `game.js:1625–1644, 1716`; sửa lỗi thiết kế của bản trước):
- Game đã có kênh `BroadcastChannel("tjwl_game_tabs")` để **một trình duyệt chỉ một tab vào phòng**: tab mới vào thì tab cũ tạm dừng (`tab_other`), còn tab cũ đang giữa ván thì tab mới bị chặn (`tab_busy`). Hai trang cùng context sẽ tự đá nhau khỏi phòng ngay trên baseline, làm MP-01/02 đỏ vì lý do không liên quan restructure.
- Người chơi lưu theo trình duyệt (`localStorage`): hai trang cùng context là **cùng một người**, không dựng được "host + người chơi". Mỗi client cần `localStorage` riêng, nghĩa là context riêng.
- `BroadcastChannel` chỉ trao đổi trong **cùng origin**; client chạy bản baseline ở cổng khác (MP-18) sẽ không thấy client bản mới.

**Broker Realtime giả (thay `supabase.channel`):**
- Tiêm vào mỗi trang một shim thay `sb.channel(...)`; shim chuyển mọi tin qua `page.exposeBinding` tới broker trong Node, broker phát lại cho các trang khác cùng tên kênh (`game:<mã>`). Vì đi qua tiến trình test nên nối được giữa các context và giữa các origin/cổng khác nhau.
- Bề mặt API tối thiểu (đo ở `game.js`, `board.js`, `voice.js`, `chat.js`, `cc.js`, `swclass.js`; A0 xác nhận đủ): `channel(tên, {config:{broadcast:{self:true}, presence:{key}}})`, `.on("broadcast",{event},cb)`, `.on("presence",{event},cb)`, `.subscribe(cb)` với các trạng thái `SUBSCRIBED/CLOSED/CHANNEL_ERROR`, `.send({type:"broadcast",event,payload})`, `.track`, `.untrack`, `.presenceState()`, `removeChannel`. `broadcast.self=true` phải đúng nghĩa (người gửi cũng nhận lại tin của mình).
- Điều khiển lỗi: broker có thể trễ, thả tin, đảo thứ tự, ngắt kênh một client (`CLOSED`) rồi cho nối lại — dùng cho MP-05, MP-07.
- Hệ quả cần nói rõ: thư viện `supabase-js` Realtime thật (logic tự nối lại, heartbeat) **không** được chạy trong các test này; chỉ logic phía game. Phần đó thuộc kiểm tay (§11.3).

**Cách ly giữa các client (bắt buộc):**
- Mỗi context có hồ sơ riêng trong fixture (host dùng `HOST_PROFILE_ID`, người chơi dùng id khác) và `localStorage` riêng.
- **Gieo `Math.random` khác nhau cho mỗi context.** `G.tab` được sinh bằng `Math.random()` và việc bầu host dựa vào nó (`game.js:152`); nếu hai context gieo cùng một hạt giống thì trùng `tab` và hành vi bầu host sai.
- Kênh `tjwl_game_tabs` và `tjwl-host-speak` giữ nguyên là `BroadcastChannel` thật trong từng context (không giả), nên hành vi một-tab-một-phòng vẫn đúng như sản phẩm (xem MP-21).

Tên sự kiện đóng băng: `alive, ans, bmeta, board, cc, chat, gaps, graded, hello, rtc, state, sw, sync, voice`, cờ `relay`, mốc `bts` (SPEC §7).

| ID | Loại | Tầng | Kịch bản → đạt |
|---|---|---|---|
| MP-01 | C | B | Host tạo phòng, người chơi vào bằng mã: cả hai thấy nhau (presence); `hello` → `state` đồng bộ |
| MP-02 | C | B | Host bắt đầu ván điền từ; người chơi trả lời; điểm hai bên khớp sau `graded`; ván kết thúc ở `end` |
| MP-03 | R | B | **Host tải lại giữa ván:** không bị hạ vai (khối `d.relay` chặn trước khối "nhường host") |
| MP-04 | C | B | Người chơi tải lại giữa ván và nối lại đúng trạng thái |
| MP-05 | C | B | Host vắng (mất mạng giả): người chơi trả lời `hello` bằng `state` có `relay:1`; bảng tạm `G.bst` dùng khi chưa có `G.st` |
| MP-06 | C | B | `bmeta`/`bts`: bản mới nhất thắng; **host không đè được bản mới hơn**; `setHost` giữ `bts` |
| MP-07 | C | B | Vòng đời kênh: rời phòng/`pagehide` gọi `untrack` + `removeChannel`; kênh sang `CLOSED` → đăng ký lại; đếm kênh mở không tăng sau 5 lần rời/vào (không rò) |
| MP-08 | C | B | Quyền "mọi người như host" trên Bảng: người chơi mở/đóng/đổi bài, lật trang, vẽ/laser; chỉ host thật có "Game →", "Bổ sung từ", cây Notebook |
| MP-09 | C | B | Người chơi **không thấy** Notebook/Hub/Page/Block (lớp `bd-realhost` chỉ ở host thật) |
| MP-10 | C | N | Chia sẻ màn hình: người sau đè người trước (`share-take`) — *chỉ kiểm tầng tín hiệu; media là kiểm tay* |
| MP-11 | C | B | Chat: chỉ trong bộ nhớ, tối đa 30 tin, ≤200 ký tự, 2 giây/tin; **không có lời gọi ghi Supabase**; máy vào sau gửi `req`, host trả `sync`; `chatOff`, `chatMute` hoạt động |
| MP-12 | C | N | Voice (tầng tín hiệu): mic mặc định tắt; **khoá và tự tắt khi `phase==="play"`**, mở lại khi hết giờ; host "Tắt mic cả phòng" một lần; không tự mở mic bao giờ |
| MP-13 | C | N | CC: gửi **chữ** qua sự kiện `cc` kèm mã ngôn ngữ `l`, không gửi âm thanh; bấm dòng → dịch qua `gemini-proxy` với `user_id:null` |
| MP-14 | C | B | Tệp chia sẻ tạm của người chơi: lên `lib/_tmp/<mã phòng>/<ts36>_<tên>`; bị xoá ngay khi doc bị thay/đóng; xoá khi `pagehide` (keepalive); `janitor` dọn >4 giờ (đồng hồ giả) |
| MP-15 | R | B | **Bảo vệ phòng thật:** trong mọi test, nếu có kênh `game:TJ` hoặc mã phòng `TJ` xuất hiện trong lời gọi → test **thất bại ngay** (lỗi QA cũ: vào nhầm phòng "TJ"). Gamelayer đóng vì "không phải TJ" thì xoá iframe; mất mạng (DB rơi về Local) không coi là "không phải TJ" |
| MP-16 | R | B | Lịch sử → "Ôn ngay": dùng `G.rvMid`, **không** ghi đè `G.logMatch` (log ván đang chơi vẫn nguyên) |
| MP-17 | C | N | `renderLobby()`/`renderEnd()` chạy lặp mỗi lần phòng gửi trạng thái: các hành động "một lần" (tắt tiếng, reset) chỉ chạy một lần nhờ cờ đổi pha (`G.soundPh`) |
| MP-18 | C | **B** | **Hỗn hợp phiên bản (I4) — chặn merge vì hai bản sẽ cùng tồn tại suốt dự án (plan §5.1):** client chạy bản baseline = `e324beb` (đúng nội dung bản `main` đóng băng) (phục vụ ở cổng riêng, từ một thư mục `git worktree` của SHA baseline) và client chạy bản mới (cổng khác), **mỗi client một context, nối qua cùng broker**; broker chỉ khoá theo tên kênh `game:<mã>` nên không phụ thuộc origin. Một phòng `ZZ_…`: MP-01, MP-02, MP-06 vẫn đạt. (Hai bản dưới cùng origin không cần thiết và không dùng) |
| MP-19 | C | N | Bảng: `docTap` dùng `getClientRects()` từng dòng — chạm vào từ vắt hai dòng chọn đúng từ, không nuốt cú chạm từ khác |
| MP-20 | C | B | Bài đọc/bảng từ vựng mặc định `freeView = true` (mỗi người tự cuộn) |
| MP-21 | C | B | **Một tab một phòng** (`tjwl_game_tabs`, quyết định 2026-09-30): hai trang **cùng một context** cùng hồ sơ: tab mới vào → tab cũ tạm dừng (`tab_other`); tab cũ đang `phase==="play"` → tab mới bị chặn (`tab_busy`); nút "Dùng game ở tab này" (`force`) giành được, chấp nhận bỏ ván; 📺 (`view==="screen"`) và xem lại ván không tính. Đây là ca *duy nhất* dùng hai trang chung context |

**Giới hạn phải nói thẳng:** broker giả không mô phỏng độ trễ/mất gói/thứ tự của Realtime thật ngoài những gì ta chủ động bơm vào, và không chạy phần tự nối lại của thư viện. Sau M1.4 và mỗi lô M3 thuộc `game.js` vẫn có kiểm tay hai thiết bị thật (§11.3).

## 8. Luồng tính năng (trình duyệt, mock)

### 8.1 WordLoop

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| FLW-01 | R | B | **Chuyển tab:** mỗi nút tab chi tiết bật đúng `#pane-<tên>` (study/quiz/sheet/single/meaning/progress/dictation); không `#pane-final`; console không lỗi (lỗi cũ: `showTab("final")` treo màn hình) |
| FLW-02 | C | B | "Hiểu rồi, vào kiểm tra →" mở tab **Nghĩa** |
| FLW-03 | C | B | Từng câu và Nghĩa: trả lời câu cuối là tự chấm, không nút nộp; Phiếu đầy đủ có nút "Nộp bài" |
| FLW-04 | C | B | "Done" = một trong ba thẻ đạt ≥80%; **cả ba** thẻ đẩy chu kỳ thật (`bp.passed`), kể cả Nghĩa |
| FLW-05 | C | B | Học sớm (trước `next_review_at`) ghi điểm nhưng **không đẩy chu kỳ**; ôn sớm ≤1 giờ (`SRS_GRACE_MS`) tính đúng hạn; mỗi lần đẩy thật thêm `{step, at}` vào `review_history` (đồng hồ giả) |
| FLW-06 | C | B | Tab "🎧 Dictation": **không có lời gọi ghi** `block_progress`/`word_progress`, không đổi SRS; thoát tab mất kết quả |
| FLW-07 | C | B | Bộ chọn nguồn bài: tab "📝 Dán" + "Dán/Claude/OpenAI/Gemini n"; nhóm theo `parseMeta` (không theo vị trí mảng); không giới hạn số bài; bài mới nối cuối đúng nhóm; chỉ mất khi bấm "🗑 Xoá bài này" (ẩn ở tab "📝 Dán"); "Dùng bài này" vừa áp dụng vừa lưu; huy hiệu nguồn + chi phí đúng |
| FLW-08 | C | B | Không có UI độ khó Dễ/Vừa/Khó; không tự luân phiên bài theo chu kỳ ôn |
| FLW-09 | C | B | **Phủ định (đã bỏ hẳn):** không có `#word-ticker`/`.wt-*`; không có lọc Block theo trạng thái trên ô cảnh báo; không có mũi tên Batch trong `#screen-blocks .screen-head` (chỉ ở `.batches-bar`) |
| FLW-10 | C | B | Breadcrumb rút gọn "Hub › … › cấp đang đứng" khi vượt `CRUMB_MAX_CHARS`; Batch đang chọn có trong breadcrumb |
| FLW-11 | R | B | Reader: bấm từ có dấu câu hai đầu ("exhilarating,", "cabinet.") lưu **không dính dấu câu**; lưu mức 1–4 tự thêm ⭐; ✓ mức 5 giữ trạng thái cũ; tra AI theo câu không ăn quota (nối CTX-12) |
| FLW-12 | C | B | Đọc bài: user tự cuộn → không tự cuộn nữa tới lần bấm nghe tiếp (`userTookControl`); tra từ chen ngang → tạm dừng + nhớ câu (`_resume`), đóng bảng tra → đọc tiếp đúng câu; ⏹ → "▶ Đọc tiếp"; token `_passTok` chặn `onend` trễ |
| FLW-13 | R | B | `Speech.speakList`: bắt đầu lượt mới khi lượt cũ đang chạy **không** đọc xen kẽ (token mỗi lượt). Dùng `speechSynthesis` giả ghi lại thứ tự |
| FLW-14 | C | B | "🔇 Tắt tiếng bài kiểm tra" áp cho Nghĩa, Từng câu, Ôn riêng; không áp loa bảng từ vựng/bài đọc/Dictation |
| FLW-15 | C | B | Số ⭐/❌ trên hai nút nhảy ngay (`App.wsMark`); `D.instantFix` ghi `markResults` từng câu; thoát giữa bài không mất; phạm vi Block/Batch/Page/Section/Notebook/Hub đúng |
| FLW-16 | C | N | "🧭 AI Framework" hiện cho mọi Notebook, ẩn với vai "Chỉ xem" |
| FLW-17 | C | N | Nút "🎤 Đọc theo" chỉ ở bài `wl`, ẩn ở bảng từ vựng; kết quả không gửi đi đâu |
| FLW-18 | K | N | Thanh trên cùng tràn ~11px ở 900px (tràn từ trước, chưa sửa): ghi nhận, không sửa trong restructure |
| FLW-19 | C | N | Font settings desktop chỉ áp từ 521px; mobile 17px/50px |
| FLW-20 | C | N | Trích từ: văn bản dán có/không dấu câu đi hết `processArticleToBatch` với AI giả, kể cả nhiều chương dùng một `quotaCtx` |

### 8.2 Bảng

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| BRD-01 | R | B | **Smoke dựng `board.js`:** trang tĩnh + `api` giả (`new Proxy(base,{get:(t,k)=>k in t?t[k]:()=>null})`, `Board.attach(api); Board.onState({board:true,phase:"lobby",bdoc:{k:"vt",bid:"b1",t:"t"}})`) dựng được bảng, không lỗi console (bắt lỗi "chú thích mở nuốt mã") |
| BRD-02 | R | B | Mỗi lớp CSS mới đặt lên `<body>` (`g-viewer`, `bd-realhost`…) không trùng lớp thành phần có sẵn: kiểm bằng chụp lobby ở hai vai (vỡ bố cục = đỏ) |
| BRD-03 | C | N | `?embed=1`, `?scope=`, `postMessage` (`tjwl-game-lib`, `tjwl-game-boardopen/close`, `tjwl-parent-hover`) giữa WordLoop và iframe game vẫn hoạt động |

## 9. Máy chủ (luồng B, C)

### 9.1 Sổ chi tiêu AI — B1 (tám ca bắt buộc, plan mục 6)

Chạy trên Postgres thật (container) hoặc bản sao với hàm `ai_budget_reserve/settle`, provider giả.

| ID | Tầng | Kiểm gì → đạt |
|---|---|---|
| LED-01 | B | 50 request đồng thời, trần đủ cho 10: đúng ≤10 lần gọi provider; tổng sổ ≤ trần |
| LED-02 | B | Biên trần: request vừa đủ được qua; request vượt bị từ chối; `p_amount > p_cap` bị từ chối ngay |
| LED-03 | B | Provider lỗi → hoàn lại toàn bộ phần giữ chỗ |
| LED-04 | B | `settle` lỗi → sổ không bị đếm thiếu (phần giữ chỗ ở lại) |
| LED-05 | B | Sổ không đọc/ghi được → 503 `{kind:"budget_unavailable"}`, **không** gọi provider |
| LED-06 | B | Xoá Block (cascade) không làm đổi sổ |
| LED-07 | B | Hai provider cùng tiêu một trần |
| LED-08 | B | Bốn đường hợp lệ hiện có (WordLoop, CC, chấm câu, tra nghĩa — gồm `user_id:null`) vẫn chạy khi còn ngân sách |
| LED-09 | B | Model ngoài danh sách bị từ chối; đầu vào vượt trần kích thước bị từ chối; token ra bị ép về trần phía server dù client xin cao hơn |
| LED-10 | B | Hạn mức mềm 3 Block/ngày giữ hành vi cũ (`kind:"quota_user"` 403); lỗi tra hạn mức mềm vẫn fail-open như cũ |
| LED-11 | N | Qua ngày UTC: dòng mới, không dồn sổ ngày trước |

### 9.2 Thống kê từ — C2

Chạy trên **ảnh chụp dữ liệu thật** (xuất chỉ-đọc, đặt ngoài repo vì chứa dữ liệu người dùng) cộng bộ dữ liệu giả.

| ID | Tầng | Kiểm gì → đạt |
|---|---|---|
| RPC-01 | B | Với **mọi** user có tiến trình: `total_words` và `mastered` của RPC **bằng** `distinctWordIndex()`+`distinctMastered()` cũ |
| RPC-02 | B | Bộ giả: dấu câu, hoa/thường, Unicode ngoài ASCII, chuỗi rỗng, chuỗi chỉ có khoảng trắng, `"( cat )"`, cùng từ ở nhiều Block, hai bản trùng cùng `mastered` (đếm 1) |
| RPC-03 | B | Chuẩn hoá đúng thứ tự của UTL-01 (không cắt lại sau khi xoá dấu câu) |
| RPC-04 | B | Cache `total` 10 phút + xoá khi chèn `words`; `mastered` không cache — giữ như cũ |
| RPC-05 | B | Đường cũ sau cờ vẫn chạy và cho cùng kết quả |
| RPC-06 | N | Đo thời gian trước/sau trên mạng giả lập chậm (không dùng làm tiêu chí đạt/trượt tự động) |

### 9.3 Kệ sách — B2

| ID | Tầng | Kiểm gì |
|---|---|---|
| SHF-01 | B | PUT không gọi `listAll` toàn bucket (đếm thao tác R2 giả = 0 liệt kê toàn bucket) |
| SHF-02 | B | Giới hạn 25 MB/file và 2 GB tổng vẫn chặn (413/507) |
| SHF-03 | B | Hành vi xác thực theo phương án TJ chọn (plan mục 9, câu 5): trường hợp từ chối và cho phép; các lời gọi hợp lệ của `game.js` (list/PUT/DELETE) vẫn chạy |

### 9.4 Schema — B3 và hợp đồng đường gọi

| ID | Tầng | Kiểm gì |
|---|---|---|
| SCH-01 | N | Script chỉ-đọc so `information_schema` (bảng, cột, kiểu, khoá, chỉ mục, policy) với `tools/supabase_schema.sql` + `tools/game_schema.sql`; xuất danh sách lệch. Cần PAT tạm của TJ; thu hồi sau |
| SCH-02 | B | Hình dạng body gọi Edge Function AI (`model, sys, user, user_id, block_id`) không đổi sau M1.5 (nối I2) |

### 9.5 Tương thích ngược với bản `main` đóng băng — BCK (I9)

Backend dùng chung: mọi thay đổi ở `supabase/`, Worker, SQL có tác dụng ngay với bản đang dùng. Các ca này chạy **bộ lời gọi của bản baseline** (lấy từ nhật ký lời gọi chuẩn §5, chụp ở `e324beb`) lên backend đã đổi.

| ID | Loại | Tầng | Kiểm gì → đạt |
|---|---|---|---|
| BCK-01 | C | B | Edge Function AI (sau B1): bốn đường gọi hợp lệ của bản baseline (WordLoop, CC, chấm câu, tra nghĩa — gồm `user_id:null, block_id:null`) nhận phản hồi cùng hình dạng như trước khi còn ngân sách; 403 `quota_user` giữ nguyên hình dạng |
| BCK-02 | C | B | Sau B1 khi hết ngân sách hoặc sổ không đọc được: bản baseline nhận lỗi mà nó đã xử lý được (không ném lỗi không bắt; thông báo hiển thị như lỗi proxy hiện có) — ghi lại hành vi thật của bản baseline với 503 trước khi bật B1 |
| BCK-03 | C | B | Worker `tj-shelf` (sau B2): `list`/`PUT`/`DELETE` mà `game.js` baseline gửi (không có thêm header mới) vẫn chạy theo phương án xác thực TJ chọn; nếu phương án làm bản baseline mất quyền ghi/xoá thì ghi rõ đây là thay đổi hành vi có chủ đích, cần TJ duyệt |
| BCK-04 | C | B | Schema: mọi DDL chỉ THÊM (kiểm bằng so sánh `information_schema` trước/sau: không cột/bảng/hàm bị xoá, đổi tên hoặc đổi kiểu); bộ lời gọi REST của bản baseline chạy y hệt |
| BCK-05 | C | B | Hàm Postgres mới (C2) không đổi kết quả của đường cũ mà bản baseline vẫn dùng (`words`/`word_progress` truy vấn như trước) |
| BCK-06 | C | B | Giao thức game: bản baseline và bản mới cùng phòng (MP-18) sau mỗi thay đổi ở `game`/`board` |

### 9.6 Hosting — HST (luồng H)

Chạy trên URL Netlify của nhánh restructure (và, với HST-04, cả bản Pages của `main`). Kiểm tay hoặc Playwright trỏ vào URL thật; **không** ghi dữ liệu thật trừ theo §12.

| ID | Loại | Tầng | Kiểm gì → đạt |
|---|---|---|---|
| HST-01 | C | N | Mở trực tiếp `index.html`, `game.html`, `learn/dm`, `learn/ea`, `learn/sw`; không 404; không có rewrite về SPA; `game.html` không bị "Pretty URLs" đổi đường dẫn (chưa xác minh cấu hình mặc định của Netlify) |
| HST-02 | C | N | Mọi tệp mà HTML tham chiếu đều có trên host (quét liên kết); tài nguyên ngoài (CIA, Marketing trên github.io của repo khác) còn tải được |
| HST-03 | C | N | `gamelayer`: iframe game cùng origin với cha, `postMessage` kiểm `location.origin` hoạt động trên origin Netlify |
| HST-04 | C | N | Hai host cùng backend: một thiết bị trên Pages (`main`), một trên Netlify, cùng phòng `ZZ_…` (nối MP-18, BCK-06) |
| HST-05 | C | N | PWA: cài và mở lại đúng host; `sw.js` đăng ký; offline theo mức hiện có |
| HST-06 | C | N | `curl -I` ghi `Cache-Control` của `index.html`, `js/*.js?v=…`, `sw.js` trên cả hai host; ghi lại kết quả (không có tiêu chí đạt/trượt, dùng để quyết áp lực của cổng version A2) |
| HST-07 | C | N | Origin: `localStorage` của hai host tách biệt; vào lại hồ sơ bằng `?u=` hoạt động trên Netlify; bộ lọc `Origin` của B1/B2 (nếu đã bật) chấp nhận đúng hai host chính thức và URL branch deploy, từ chối host lạ |
| HST-08 | C | N | Credit: ghi số credit trước/sau một lượt kiểm thử (đối chiếu công thức của `PLAN_NETLIFY_FRONTEND.md`) |
| HST-09 | C | M | Sau khi thay `main` (plan §5.1): lặp HST-01..05 trên host chính thức; phương án quay lại đã chọn (câu 12) còn dùng được |
| HST-10 | C | N | **Diễn tập commit khôi phục (trước khi thay `main`):** trên nhánh tạm, tạo commit mới có cây = cây nhánh archive đặt trên đầu nhánh restructure; `git diff --stat <archive> <commit khôi phục>` **trống**; commit là hậu duệ trực tiếp của đầu nhánh (đẩy được bằng fast-forward, không cần force); phục vụ nó và chạy BCK-01..06, MP-18, HST-01..05 trên **backend ở trạng thái hiện hành** (sau mọi deploy B/C). Kết quả ghi vào hồ sơ freeze. Lặp lại nếu backend đổi sau diễn tập |

## 10. Ma trận truy vết

Nguồn: `CLAUDE.md`. Cột "Phủ" là ID ca; "—" nghĩa là chưa có ca tự động (cần M0 quyết hoặc để kiểm tay).

### 10.1 "Lỗi đã sửa"

| Mục trong `CLAUDE.md` | Phủ |
|---|---|
| `_markTerms` sắp từ dài trước | CTX-01 |
| `gapSentences` bỏ sót đoạn cuối không dấu | CTX-02 |
| `applyStarter` ghi đè field cha của user | DB-01 |
| `applyStarter` hồi sinh item đã xoá | DB-02 |
| `parseMeta` quên trả `pasted` | CTX-05 |
| Bulk insert `PGRST102` | CL-02 |
| Nhầm `sb_secret_` với anon | STA-04, STA-05 |
| `getFullTree` check `DB.mode` thay vì `progressLocal()` | CL-01 |
| `gapSentences` cụt ở chữ viết tắt | CTX-04 (K) |
| `#pane-final` không tồn tại | FLW-01 |
| `splitChapters` không dấu câu | CTX-08 |
| Timeout 25s và `MAX=5000` | CTX-08, CTX-10 |
| Agent QA vào nhầm phòng "TJ" | MP-15 |
| `bmState` thiếu điều kiện "có dòng tiến trình" | DB-05 |
| `Speech.speakList` đọc xen kẽ | FLW-13 |
| Bảng tra từ cắt dấu câu hai đầu | FLW-11 |
| Chú thích mở nuốt mã; class `<body>` trùng | BRD-01, BRD-02, STA-11 |
| `?v=` / `GAME_VER` / `starter` lệch | STA-02, STA-03 |
| Chữ trên Bảng bị ngắt ("sch-/ool") | STA-07, VIS-T01 |
| `docTap` dùng `getBoundingClientRect` | MP-19 |
| `renderLobby/renderEnd` chạy lặp | MP-17 |
| Host tải lại giữa ván bị hạ vai (relay) | MP-03 |
| Lịch sử "Ôn ngay" ghi đè `G.logMatch` | MP-16 |
| iPhone chỉ mở khoá `<audio>` trong cú chạm; khử vọng khi đưa âm máy tính vào mic | — (kiểm tay §11.3) |
| Chrome dùng một hàng đợi `speechSynthesis` cho mọi cửa sổ | — (thiết kế test: một trang một lần; ghi vào §12) |

### 10.2 "Quyết định đã chốt" (nhóm chính)

| Quyết định | Phủ |
|---|---|
| Không dùng mảng cố định chọn theo seed cho nội dung hiển thị | CTX-13 |
| Người thường Gemini trước, riêng TJ OpenAI trước; hai proxy dùng chung quota | CTX-09, CTX-11 |
| Bộ chọn nguồn bài, không giới hạn, xoá tay | FLW-07 |
| Không UI độ khó; không tự luân phiên; không dashboard lọc; không ticker; không mũi tên Batch ở đầu màn | FLW-08, FLW-09 |
| `global_index` Block không trùng xuyên Notebook | thêm vào DB-03/CALL-W02 (kiểm `global_index` tăng liên tục) |
| Done = 1 trong 3 thẻ ≥80%, cả ba đẩy SRS | FLW-04 |
| Học sớm không đẩy chu kỳ, nới 1 giờ, `review_history` | FLW-05 |
| Dictation thuần luyện tập | FLW-06 |
| Nhân bản Notebook theo `progressScope` | DB-03, CALL-W07 |
| ⭐/❌, Ôn riêng, thống kê không đếm trùng | DB-05..09, FLW-15 |
| Bảng: quyền mọi người như host | MP-08, MP-09 |
| Chat/Voice/CC/Đọc theo | MP-11..13, FLW-17 |
| Game khoá host theo hồ sơ TJ, không theo `is_admin` | MP-15 và thêm ca "hồ sơ không phải TJ không mở được phòng game" (tầng B) |
| Hosting: `main` ở GitHub Pages, dòng restructure ở Netlify song song; cuối cùng thay `main` (TJ 2026-10-20; thay quyết định cũ "Hosting là GitHub Pages, không đề xuất Netlify" của `CLAUDE.md`, cập nhật `CLAUDE.md` khi thay `main`) | HST-01..09, BCK-* |

## 11. CI, cổng merge và kiểm tay

### 11.1 Tầng chạy

| Tầng | Khi nào | Gồm |
|---|---|---|
| **B (chặn merge)** | Mọi PR | STA-*, CTX/SRS/UTL/RA, LS/DB/CL, CALL-* tầng B, VIS tầng B, MP tầng B, FLW/BRD tầng B, LED/RPC/SHF/SCH tầng B (khi PR thuộc luồng đó). Mục tiêu ≤ 10 phút |
| **N (hằng đêm / gọi tay)** | Lịch hoặc `workflow_dispatch` | Ma trận ảnh đầy đủ, MP-10/12/13/17, offline/SW, CALL-W07/G03/G06/G07, LED-11, RPC-06, SCH-01, HST-01..08 (MP-18 và BCK-* đã ở tầng B) |
| **M (kiểm tay)** | Trước khi merge M1.4 và mỗi lô M3 thuộc `game.js`; trước mỗi lần TJ bảo đẩy `main` | §11.3 |

### 11.2 Chính sách

- **Chập chờn:** test thất bại một lần rồi pass khi chạy lại bị coi là *lỗi của bộ test*, không phải "xanh". Sửa nguyên nhân (chờ sự kiện thay vì chờ giờ). Cách ly tạm cần issue công khai và tối đa một PR trước khi sửa; không cách ly test tầng B của I2/I4.
- **Chuẩn thay đổi:** PR cập nhật ảnh/golden/nhật ký không chứa thay đổi cấu trúc; mô tả liệt kê từng khác biệt; TJ duyệt.
- **Khi test đỏ sau một lần dời mã:** mặc định coi là hồi quy. Chỉ được kết luận "test sai" sau khi tái hiện trên baseline.
- **Bắt buộc theo cột mốc:** M0 cổng ra = mọi ca tầng B xanh trên baseline. M1 cổng ra = CALL-*, LS-01, CL-*, MP tầng B xanh. M2 cổng ra = thêm STA-09/10 và kiểm offline (N, chạy tay một lần). M3 cổng ra = toàn bộ tầng B + N.

### 11.3 Kiểm tay (checklist, thiết bị thật, phòng `ZZ_…`)

1. Hai thiết bị: lobby → ván → kết thúc; bảng; tải lại giữa ván ở cả host và người chơi.
2. Voice: người nghe có nghe thấy; chẩn đoán trên màn hình ("nhận X KB · mức Y · loa phát/DỪNG"); iPhone Safari mở khoá `<audio>` bằng cú chạm.
3. CC: Chrome/Edge nhận giọng; Firefox chỉ xem; iPhone không ổn định (ghi nhận, không phải lỗi).
4. Đọc to (`speechSynthesis`) trên Chrome; một máy một cửa sổ (Chrome dùng chung hàng đợi giữa các cửa sổ).
5. Đọc theo (Web Speech): Chrome/Edge; ghi nhận iPhone flaky.
6. Chia sẻ màn hình (người sau đè người trước); iPhone không có `getDisplayMedia` (không phải lỗi).
7. Offline: tải online → tắt mạng → tải lại `index.html` và game.
8. Bản deploy Netlify: xem log deploy (SHA đúng nhánh), tải lại từng file JS từ URL Netlify (`curl`) và `node --check`; ghi `Cache-Control` (HST-06). Bản `main` trên Pages **không bị đụng**: xác nhận SHA trên trang Pages vẫn là bản đóng băng.
9. Hỗn hợp: một thiết bị bản `main` (Pages) + một thiết bị bản Netlify cùng phòng `ZZ_…` (HST-04).

## 12. Môi trường, dữ liệu cố định và an toàn

**Tính xác định:**
- Dữ liệu mẫu cố định (fixture): 1 Hub, 2 Notebook (một tên gợi chủ đề dễ lệch như "SURVIVAL"), ~30 từ gồm dấu câu/hoa-thường/trùng/rỗng, tiến trình hai user, một mục đã xoá (tombstone), một Block có bài đọc candidate đủ nhóm nguồn. Phản hồi AI ghi sẵn.
- Đồng hồ giả (`page.clock`) cố định ở một thời điểm UTC; mọi test về hạn ôn dùng đồng hồ này.
- `Math.random` gieo cố định bằng script khởi tạo; tắt animation/transition (CSS tiêm + `prefers-reduced-motion`); đợi `document.fonts.ready`; ảnh/âm thanh bằng tệp mock.
- Stub: `speechSynthesis` (ghi lại thứ tự gọi), `SpeechRecognition`, `getUserMedia`, `getDisplayMedia`, `RTCPeerConnection` (tầng tín hiệu).
- Thư viện `@supabase/supabase-js@2.45.4` phục vụ cục bộ (đóng gói bằng `npm pack`, theo `tools/qa/README.md`) để chặn mạng thật; chặn mọi miền ngoài trừ mock.

**An toàn:**
- **Bộ test tự động không bao giờ ghi lên Supabase thật** (mock). Kiểm chạm dịch vụ thật (SCH-01, HST-*) chỉ-đọc, trừ ngoại lệ dưới đây.
- **Ngoại lệ ghi dữ liệu thật (dòng restructure dùng chung backend với bản `main` đang dùng — plan §5.1):** (1) chỉ khi TJ cho phép từng đợt; (2) chỉ bằng hồ sơ thử và phòng/khoá `ZZ_…` có tiền tố rõ ràng; (3) có danh sách việc đã ghi và bước dọn (xoá dòng `ZZ_…` trong `game_rooms`, câu trả lời, lịch sử, tệp `lib/_tmp/ZZ_…`) chạy ngay sau đợt kiểm; (4) ghi bằng **hồ sơ thật** chỉ sau cổng nhật ký lời gọi khớp + TJ đồng ý (câu 9 của plan). Không bao giờ bằng hồ sơ TJ trong phòng `TJ`.
- Mọi test game dùng mã phòng `ZZ_<test>_<ngẫu nhiên cố định>`; lớp bao kiểm tra (MP-15) thất bại ngay nếu thấy `game:TJ`.
- Không đưa dữ liệu người dùng thật, link đăng nhập `?u=`, key hay token vào fixture hay vào repo; ảnh chụp dữ liệu thật cho RPC-01 để ngoài repo.
- Không commit tệp đề ETS (STA-06).

**Tham khảo có sẵn:** `tools/qa/` (`c.js`, `tb.js`, `t2.js`, `d2.js`, `harness.js`, `board4.js`, `sync.sh`). Đường dẫn trong đó là của máy cloud và hạ tầng chỉ là khung mock cũ; dùng làm ý tưởng, viết lại cho khung mới.

## 13. Việc A0 phải làm rõ trước khi viết mã test

0. **Chạy thử từng ca tĩnh trên baseline và lập danh sách vi phạm có sẵn** (STA-03 đã đo: 5 mục; STA-04, STA-06, STA-07, STA-08 chưa đo). Mỗi vi phạm xử lý theo quy tắc ngoại lệ baseline ở §3.3. Không ca nào được bước vào cổng M0 mà chưa chạy xanh trên mã chưa đổi.

1. Hàm nào của `ReadAlong`, `Context`, `Speech` truy cập được từ ngoài IIFE để test trực tiếp (nếu không, kiểm ở tầng trình duyệt).
2. Danh sách đầy đủ khoá `localStorage` (LS-01) và danh sách file được phép theo dõi cho STA-06.
3. Hiện trạng CSS cho STA-07 (đang xanh hay đang vi phạm).
4. Số điểm gọi Supabase *động* (chuỗi bảng ghép lúc chạy) trong `game.js` — ảnh hưởng độ khó của nhật ký lời gọi chuẩn (ROADMAP §10, điều kiện đổi lộ trình).
5. Danh sách hàm `App.*` bị gọi ngược (SPEC §4.2).
6. Cách phục vụ bản baseline (`e324beb`, một `git worktree` thứ hai ở cổng khác) song song với bản mới cho MP-18/BCK-* (ROADMAP M0.1).
7. Chụp bộ lời gọi baseline (đầu vào cho BCK-*) ở `e324beb` **trước khi deploy bất kỳ thay đổi backend nào** (ROADMAP M0.5a, tách riêng và nhỏ: chỉ Edge Function AI và Worker `tj-shelf`; phần REST/Storage/Realtime nằm ở M0.5). Thiếu bộ này thì BCK-* không chạy được và B1/B2/SQL không được deploy.
8. Xác minh cấu hình Netlify cho HST-01 ("Pretty URLs") và định dạng URL branch deploy cho HST-07 (H0).
