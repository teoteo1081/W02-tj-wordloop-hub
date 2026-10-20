# TEST_REGRESSION_RESTRUCTURE — kế hoạch kiểm thử hồi quy cho restructure

> Trạng thái: **DỰ THẢO, CHƯA DUYỆT; CHƯA CÓ DÒNG TEST NÀO ĐƯỢC VIẾT.** Đây là đặc tả bộ test (ca nào, kiểm gì, tiêu chí đạt), không phải mã test. Mã test viết ở M0 sau khi TJ duyệt (xem `ROADMAP_RESTRUCTURE.md`).
> Nguồn: `PLAN_RESTRUCTURE.md` bản 2.1, `SPEC_RESTRUCTURE.md` (bất biến I1–I8), mục "Lỗi đã sửa" và "Quyết định đã chốt" trong `CLAUDE.md`.
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
| Hai client | Playwright, 2 trang cùng context + Realtime giả | I4, giao thức game | §7 |
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
| CTX-09 | C | B | `_callProvider` ở Cloud: thử Gemini trước, Gemini lỗi mới sang OpenAI; gọi qua `…/functions/v1/gemini-proxy` và `…/openai-proxy`, **không** gọi thẳng Google/OpenAI; không có `GEMINI_API_KEY` ở client |
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

| ID | Loại | Tầng | Kiểm gì |
|---|---|---|---|
| STA-01 | C | B | `node --check` mọi `.js` đã theo dõi |
| STA-02 | R | B | `data/starter.json` `version` **trùng ký tự** với `data/starter.version.json` (lỗi vòng lặp "Thư viện có bản mới") |
| STA-03 | R | B | Mọi `<script src>`/`<link href>` cục bộ trong `index.html`, `game.html`, `learn/*/index.html` có `?v=`; `GAME_VER` (từ `game.js?v=` trong `game.html`) trùng `game-version.json`. Sau M2: thay bằng STA-10 |
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

Cách chạy: hai trang cùng một context Playwright, Realtime giả bằng `BroadcastChannel`, phòng `ZZ_…`. Tên sự kiện đóng băng: `alive, ans, bmeta, board, cc, chat, gaps, graded, hello, rtc, state, sw, sync, voice`, cờ `relay`, mốc `bts` (SPEC §7).

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
| MP-18 | C | N | **Hỗn hợp phiên bản (I4):** client chạy bản baseline (phục vụ ở cổng riêng) và client chạy bản mới cùng một phòng `ZZ_…`: MP-01, MP-02, MP-06 vẫn đạt |
| MP-19 | C | N | Bảng: `docTap` dùng `getClientRects()` từng dòng — chạm vào từ vắt hai dòng chọn đúng từ, không nuốt cú chạm từ khác |
| MP-20 | C | B | Bài đọc/bảng từ vựng mặc định `freeView = true` (mỗi người tự cuộn) |

**Giới hạn phải nói thẳng:** `BroadcastChannel` không mô phỏng độ trễ/mất gói/thứ tự của Realtime thật. Sau M1.4 và mỗi lô M3 thuộc `game.js` vẫn có kiểm tay hai thiết bị thật (§11.3).

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
| Gemini trước, OpenAI dự phòng; hai proxy dùng chung quota | CTX-09, CTX-11 |
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
| Hosting GitHub Pages; preview theo nhánh | — (kiểm tay: workflow chạy) |

## 11. CI, cổng merge và kiểm tay

### 11.1 Tầng chạy

| Tầng | Khi nào | Gồm |
|---|---|---|
| **B (chặn merge)** | Mọi PR | STA-*, CTX/SRS/UTL/RA, LS/DB/CL, CALL-* tầng B, VIS tầng B, MP tầng B, FLW/BRD tầng B, LED/RPC/SHF/SCH tầng B (khi PR thuộc luồng đó). Mục tiêu ≤ 10 phút |
| **N (hằng đêm / gọi tay)** | Lịch hoặc `workflow_dispatch` | Ma trận ảnh đầy đủ, MP-10/12/13/17/18, offline/SW, CALL-W07/G03/G06/G07, LED-11, RPC-06, SCH-01 |
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
8. Bản deploy: xem workflow "pages build and deployment", tải lại từng file JS ở web thật (`curl`) và `node --check`.

## 12. Môi trường, dữ liệu cố định và an toàn

**Tính xác định:**
- Dữ liệu mẫu cố định (fixture): 1 Hub, 2 Notebook (một tên gợi chủ đề dễ lệch như "SURVIVAL"), ~30 từ gồm dấu câu/hoa-thường/trùng/rỗng, tiến trình hai user, một mục đã xoá (tombstone), một Block có bài đọc candidate đủ nhóm nguồn. Phản hồi AI ghi sẵn.
- Đồng hồ giả (`page.clock`) cố định ở một thời điểm UTC; mọi test về hạn ôn dùng đồng hồ này.
- `Math.random` gieo cố định bằng script khởi tạo; tắt animation/transition (CSS tiêm + `prefers-reduced-motion`); đợi `document.fonts.ready`; ảnh/âm thanh bằng tệp mock.
- Stub: `speechSynthesis` (ghi lại thứ tự gọi), `SpeechRecognition`, `getUserMedia`, `getDisplayMedia`, `RTCPeerConnection` (tầng tín hiệu).
- Thư viện `@supabase/supabase-js@2.45.4` phục vụ cục bộ (đóng gói bằng `npm pack`, theo `tools/qa/README.md`) để chặn mạng thật; chặn mọi miền ngoài trừ mock.

**An toàn:**
- Không ghi lên Supabase thật. Kiểm chạm dịch vụ thật (nếu cần, ví dụ SCH-01) chỉ-đọc và có TJ đồng ý.
- Mọi test game dùng mã phòng `ZZ_<test>_<ngẫu nhiên cố định>`; lớp bao kiểm tra (MP-15) thất bại ngay nếu thấy `game:TJ`.
- Không đưa dữ liệu người dùng thật, link đăng nhập `?u=`, key hay token vào fixture hay vào repo; ảnh chụp dữ liệu thật cho RPC-01 để ngoài repo.
- Không commit tệp đề ETS (STA-06).

**Tham khảo có sẵn:** `tools/qa/` (`c.js`, `tb.js`, `t2.js`, `d2.js`, `harness.js`, `board4.js`, `sync.sh`). Đường dẫn trong đó là của máy cloud và hạ tầng chỉ là khung mock cũ; dùng làm ý tưởng, viết lại cho khung mới.

## 13. Việc A0 phải làm rõ trước khi viết mã test

1. Hàm nào của `ReadAlong`, `Context`, `Speech` truy cập được từ ngoài IIFE để test trực tiếp (nếu không, kiểm ở tầng trình duyệt).
2. Danh sách đầy đủ khoá `localStorage` (LS-01) và danh sách file được phép theo dõi cho STA-06.
3. Hiện trạng CSS cho STA-07 (đang xanh hay đang vi phạm).
4. Số điểm gọi Supabase *động* (chuỗi bảng ghép lúc chạy) trong `game.js` — ảnh hưởng độ khó của nhật ký lời gọi chuẩn (ROADMAP §10, điều kiện đổi lộ trình).
5. Danh sách hàm `App.*` bị gọi ngược (SPEC §4.2).
6. Cách phục vụ hai bản (baseline + mới) song song cho MP-18.
