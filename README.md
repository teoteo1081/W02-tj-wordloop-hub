# TJ WordLoop Hub

App học từ vựng tiếng Anh cá nhân, dùng phương pháp lặp lại ngắt quãng (spaced repetition) theo mô hình Tony Buzan. Plain HTML/CSS/JS, không build step, không framework.

## Mục lục
- [Chạy thử ở máy](#chạy-thử-ở-máy)
- [Triển khai hiện tại](#triển-khai-hiện-tại)
- [Cây dữ liệu](#cây-dữ-liệu)
- [Chế độ Local vs Cloud](#chế-độ-local-vs-cloud)
- [Các file JS chính](#các-file-js-chính-jsxxxjs)
- [Bài đọc ngữ cảnh — cách hoạt động](#bài-đọc-ngữ-cảnh--cách-hoạt-động)
- [3 kiểu bài kiểm tra](#3-kiểu-bài-kiểm-tra)
- [Chu kỳ ôn tập (Tony Buzan)](#chu-kỳ-ôn-tập-tony-buzan)
- [Journey — thống kê học theo ngày](#journey--thống-kê-học-theo-ngày)
- [Cách thêm từ vựng mới](#cách-thêm-từ-vựng-mới)
- [AI Framework — phân tích & luyện nói theo khung](#ai-framework--phân-tích--luyện-nói-theo-khung)
- [Khoá API / bí mật](#khoá-api--bí-mật)
- [Việc còn dang dở](#việc-còn-dang-dở)

## Chạy thử ở máy
```bash
cd TJHUB
python3 -m http.server 8934
```
Mở **`http://localhost:8934`** — **không** mở bằng `file://` (fetch() bị chặn, dữ liệu sẽ "biến mất").

Điện thoại cùng Wi-Fi với laptop: `http://<IP-LAN-của-laptop>:8934` (lấy IP bằng `ipconfig getifaddr en0` trên Mac).

## Triển khai hiện tại
| Thứ | Ở đâu |
|---|---|
| Code (GitHub, **public**) | https://github.com/teoteo1081/W02-tj-wordloop-hub |
| Web live (GitHub Pages) | **https://teoteo1081.github.io/W02-tj-wordloop-hub/** |
| Web live (Netlify — tạm ngưng deploy) | https://tj-wordloop-hub.netlify.app (đứng ở bản cũ, team hết hạn mức tháng, xem CLAUDE.md) |
| Database dùng chung (Supabase) | project `pqarpszsipbdugrumhfy`, region Singapore |

Deploy lại sau khi sửa code — chỉ cần push, GitHub Pages tự build lại (không cần lệnh deploy riêng như Netlify):
```bash
git add -A && git commit -m "..." && git push
```
Kiểm tra Pages build xong chưa: `gh api repos/teoteo1081/tj-wordloop-hub/pages/builds/latest`

**Lưu ý repo đã chuyển PUBLIC** (bắt buộc để dùng GitHub Pages miễn phí) — đã rà soát kỹ, không có key/credential nhạy cảm nào trong repo hay lịch sử git (xem CLAUDE.md).

## Cây dữ liệu
```
Hub > Notebook > Section > Page > Batch > Block (10 từ) > Word
```
Mỗi **Block** chuẩn 10 từ (`APP_CONFIG.WORDS_PER_BLOCK`). Tên Block đánh số lại từ **1** trong từng **Batch** (không chạy dồn toàn Notebook) — batch cũ lỡ có Block đánh số kiểu khác thì Block mới thêm vào vẫn nối tiếp số đã có, không nhảy lùi về 1.

## Chế độ Local vs Cloud
Cấu hình duy nhất ở **`js/config.js`**:
- Để trống `SUPABASE_URL`/`SUPABASE_ANON_KEY` → chế độ **local** (dữ liệu trong `localStorage` của từng trình duyệt, không chia sẻ được).
- Điền 2 giá trị đó → chế độ **cloud**: **kho từ vựng** (hubs→words, kể cả bài đọc) dùng chung giữa mọi thiết bị vào cùng link. Hiện đã bật.

**Tiến trình học** (đã thuộc từ nào, streak, điểm thi) là **RIÊNG TỪNG THIẾT BỊ** cho tới khi có đăng nhập thật (magic link, `js/auth.js`) — xem thêm ở [Việc còn dang dở](#việc-còn-dang-dở).

`anon` key an toàn để đưa vào code công khai (được chặn bởi RLS trong `tools/supabase_schema.sql`) — **không bao giờ** dùng `service_role`/`sb_secret_...` ở phía client.

Chạy `tools/supabase_schema.sql` (SQL Editor trên Supabase Dashboard) mỗi khi schema đổi (thêm cột/bảng mới).

## Các file JS chính (`js/*.js`)
Mỗi file tự gắn 1 global lên `window` (`w.App`, `w.DB`, `w.Detail`, `w.Context`, `w.Reader`, `w.Speech`, `w.Auth`, `w.Export`, `w.Journey`, `w.SRS`). Nạp theo đúng thứ tự trong `index.html` (đừng đảo).

| File | Vai trò |
|---|---|
| `config.js` + `keys.local.js` | Cấu hình Supabase + API key AI (file sau **gitignore**, tự tạo lại khi đổi máy) |
| `util.js` | Tiện ích dùng chung (`$`, `esc`, `uid`, `pct`, `humanTime`...) |
| `srs.js` | Thuật toán chu kỳ ôn Tony Buzan (5 mốc: 10p/24h/1 tuần/1 tháng/3-6 tháng) |
| `context.js` | Sinh & phân tích bài đọc ngữ cảnh — xem mục riêng bên dưới |
| `speech.js` | Đọc bằng giọng máy (Web Speech API) + karaoke |
| `db.js` | Lớp trừu tượng Local/Cloud — mọi nơi khác chỉ gọi `DB.xxx()`, không biết dữ liệu nằm đâu |
| `auth.js` | Hồ sơ người dùng cục bộ + đăng nhập Supabase (magic link) |
| `reader.js` | Chế độ đọc kiểu LingQ (bôi màu từ đã học, lưu từ mới từ bài đọc) |
| `detail.js` | Màn học chi tiết 1 Block: bài học, bài đọc, 3 kiểu thi, tiến trình |
| `export.js` | Xuất PDF (Block/Batch/Page/Section/Notebook) |
| `journey.js` | Màn Journey — tổng quan + lịch học theo ngày |
| `wordset.js` | Màn "⭐ Ôn riêng" — từ đã Bookmark + từ hay sai, đọc tất cả + kiểm tra nghĩa |
| `app.js` | Bộ điều phối chính: nạp dữ liệu, render Hub/Notebook/Section/Page/Batch/Block, menu, paste-từ-mới, di chuyển Hub/Notebook/Section |

## Bài đọc ngữ cảnh — cách hoạt động
Mỗi Block có **đúng 1 bài đọc đang dùng**: `block.context_passage` (chuỗi text `[term]` đánh dấu + 1 khối JSON ẩn phía sau, ngăn bởi `Context.META_SEP`, chứa `{ai, pasted, claude, vi, title, source}`).

**Không tự sinh bài khi mở Block.** Khu "chọn nguồn bài đọc" (`#passage-empty`, hàm `D.renderSourcePicker`) LUÔN hiện — kể cả khi đã có bài đọc chính, để đổi bất cứ lúc nào — dưới dạng 1 hàng tab:
- **"📝 Dán"** — dán bài của riêng bạn vào ô, app tự bôi `[ngoặc]` đúng các từ của Block bằng `Context._markTerms()`.
- **"Claude 1/2/3"** — nếu Block có `context_passage_candidates` (mảng tối đa 3 bài Claude viết tay sẵn), hiện thêm các tab này. Đây là cách **KHÔNG tốn quota AI**.

Chọn tab nào thì xem trước tab đó, bấm **"✅ Dùng bài này"** mới đẩy lên chính thức. Muốn nhờ AI viết bài mới thì dùng nút **"🔄 Tạo lại"** ở đầu card bài đọc — chạy được ở **mọi nơi** (web live lẫn máy local) qua **Gemini** (Supabase Edge Function `gemini-proxy`, xem [Khoá API / bí mật](#khoá-api--bí-mật)), giới hạn 3 Block AI/ngày cho user thường. **OpenAI** là tuỳ chọn phụ, chỉ hoạt động trên máy local có tự cấu hình `OPENAI_API_KEY` trong `js/keys.local.js` (không commit — key trả tiền thật) — máy đó sẽ ưu tiên gọi OpenAI trước, lỗi mới rơi về Gemini; máy không có key này (kể cả web live) luôn dùng Gemini trước (xem `Context._callProvider` trong `context.js`).

Bộ mẫu câu cứng cũ (`OPENERS`/`MIDDLES`/`CLOSERS`, kiểu "quarterly planning meeting" lặp lại) **đã bị loại bỏ hoàn toàn** — không còn là fallback im lặng nữa vì nội dung vô nghĩa/lặp lại. `db.js` có 1 lượt dọn tự động (`cleanupLegacyPassages`, chạy mỗi lần mở app ở chế độ local) xoá sạch bài đọc nào không có `ai`/`pasted`/`claude` trong meta.

**Viết bài đọc tay cho Claude tương lai**: mỗi bài ~500 từ, mỗi từ trong 10 từ của Block xuất hiện ĐÚNG 1 lần, nguyên văn (không chia động từ), bọc `[term]`. Kèm bản dịch tiếng Việt từng câu chứa từ đó (khoá theo `term.toLowerCase()`) trong `meta.vi`. Đặt `meta.claude = true`. Xem `Context.parseMeta`/`Context.gapSentences`/`Context.build` để hiểu định dạng chính xác trước khi viết hàng loạt — **luôn verify bằng Node** (`require` trực tiếp `context.js`, không cần trình duyệt) trước khi giao cho người dùng import.

## 3 kiểu bài kiểm tra
Sau khi học xong bài + đọc bài, có 3 tab kiểm tra độc lập, mỗi tab tối đa 10 câu:
- **Phiếu đầy đủ** (Sheet) — điền từ kiểu word-bank cả tờ, có nút "Nộp bài" tường minh.
- **Từng câu** (Single) — mỗi lần 1 câu trắc nghiệm 4 đáp án; trả lời xong (đúng/sai) **tự chấm luôn, không cần bấm Nộp bài** — đúng thì tự qua câu tiếp, sai thì hiện đáp án đúng rồi mới tự qua (câu cuối cũng tự chấm ra kết quả).
- **Nghĩa** (Meaning) — 10 từ đảo nghĩa, trắc nghiệm, **độc lập** không đụng chu kỳ SRS; trình bày giống hệt "Từng câu" (tự chấm, không cần nút Nộp bài).

**Phiếu đầy đủ và Từng câu dùng chung 1 đề** (`D._exam`, `gaps` capped 10) và cùng ghi vào `bp.passed`/SRS. **Nghĩa** có đề riêng (`D._meaningQuiz`) và field riêng `bp.meaning_passed`/`bp.meaning_best` — **không đẩy chu kỳ ôn**.

**"✓ Done"** trên thẻ Block (góc phải) hiện ra khi **BẤT KỲ 1 trong 3 thẻ** đạt ≥ 80% (`bp.passed || bp.meaning_passed`) — không cần cả 3 đều đạt.

## ⭐ Ôn riêng — Bookmark & từ hay sai
- **Hub "⭐ ÔN RIÊNG"** (tab Hub trên cùng): mỗi người 1 Notebook riêng tư, các từ ⭐ tự gom thành **Block 10 từ** theo thứ tự lưu — mỗi Block có bài đọc tự gen (🔄 Tạo lại chỉ dùng từ của Block đó), Nghĩa/Phiếu/Từng câu/Dictation/Tiến trình như Block thường. Bỏ ⭐ -> từ tự gỡ khỏi Block (bài đọc đã tạo giữ nguyên); ⭐ từ mới -> vào Block cuối. Cần chạy dòng SQL `blocks.ref_word_ids` trong `tools/supabase_schema.sql`.
- **☆/★ Bookmark** cạnh từ ở bảng từ vựng (tab Bài học) và cạnh từ đang hỏi trong bài **Nghĩa** — lưu theo từng người (`word_progress.bookmarked`).
- 2 nút **"⭐ Ôn riêng"** (dòng nhỏ: số từ đã thuộc/tổng từ Bookmark) và **"❌ Fix lỗi sai"** (dòng nhỏ: số từ đang sai, viền đỏ khi còn) trên thanh trên cùng (`js/wordset.js`) mở 2 danh sách trên TOÀN APP: **⭐ Yêu thích** (bỏ Bookmark ngay tại đây được) và **❌ Fix lỗi sai** (từ đang trả lời sai ở bất kỳ bài kiểm tra nào — nút "🎯 Làm lại câu sai" hỏi lại ĐÚNG câu đã sai: đúng câu điền từ hoặc đúng câu hỏi nghĩa cùng ngôn ngữ, từng từ riêng lẻ; làm đúng là tự bỏ ra). Mỗi danh sách có 🔊 Đọc tất cả + 🔀 Kiểm tra nghĩa (ghi độ nhớ từng từ, không đụng SRS của Block) + nút ↗ nhảy về đúng Block.
- **Cần chạy SQL** (`tools/supabase_schema.sql`, các dòng `bookmarked` + `wrong_open` ngay sau bảng word_progress) để Bookmark/Fix lỗi sai đồng bộ giữa các máy — chưa chạy thì lưu tạm trên máy đó, chạy xong mở "⭐ Ôn riêng" là tự đẩy lên.
- **🔊 Đọc cả Batch** / **+ định nghĩa** ở đầu màn danh sách Block — đọc mọi từ của mọi Block trong Batch (bỏ từ trùng của Block `full_…`), Block đang đọc sáng lên, bấm lại để dừng.
- **Theo phạm vi**: đầu mỗi Block (dải tổng quan), đầu mỗi Batch và trên từng thẻ Block có chip **⭐ Từ đã lưu N** / **❌ Fix lỗi sai M** của riêng chỗ đó (Block tính cả từ lưu khi đọc bài của Block) — bấm để mở màn Ôn riêng lọc sẵn; trong màn Ôn riêng có hàng **Phạm vi** (Tất cả / Hub / Notebook / Section / Page / Batch / Block) kèm số từng cấp.
- **Đọc bài không bị mất chỗ**: bấm tra 1 từ lúc đang nghe bài → bài tạm dừng, đọc từ; đóng/lưu xong tự đọc tiếp đúng câu đang dở. Bấm ⏹ thì nút thành **▶ Đọc tiếp**, muốn nghe lại từ đầu bấm **⏮ Từ đầu**.
- Trong **bài đọc**, bấm/bôi 1 từ → bảng tra: lưu mức **1–4** là tự thêm vào ⭐ Yêu thích; từ chưa có trong kho tự **✨ tra nghĩa theo câu bằng AI** (Gemini free, không tính quota), kèm link Google Dịch/Cambridge.
- Đầu tab **Bài học** có dải tổng quan: đã làm bài mấy lần, đã ôn mấy/6 chu kỳ, lịch ôn, điểm cao nhất, độ nhớ, số từ đã thuộc (bấm để xem tab Tiến trình).
- Bài **Nghĩa** có nút **🔊** nghe từ trước khi chọn đáp án + nút **"🔊 Có tiếng / 🔇 Đã tắt tiếng"** (tắt HẾT âm thanh khi làm bài; dùng chung cho Từng câu và màn Ôn riêng).

## Chu kỳ ôn tập (Tony Buzan)
`js/srs.js` — 1 Block chỉ vào chu kỳ SAU KHI đạt bài thi (Phiếu đầy đủ/Từng câu ≥ 80%, ghi `bp.passed`). 5 mốc: 10 phút → 24 giờ → 1 tuần → 1 tháng → 3 tháng (→ 6 tháng duy trì). Trả lời sai nhiều thì `SRS.demote()` lùi 1 bậc.

## Journey — thống kê học theo ngày
Icon 📊 "Journey" trên thanh trên cùng. Số liệu ở đây **LUÔN là của TOÀN BỘ app** (không đổi theo cây thư mục bên phải — xem dưới), khác tab "Tiến trình" trong Block (chỉ xem 1 Block).
- **3 thẻ tổng quan**: (1) Đã thuộc / Đã học / Tổng từ — "Đã thuộc" (`word_progress.mastered`, bậc cao, cần nhớ đúng nhiều lần ở bảng tra từ) khác "Đã học" (từ thuộc Block đã Done ít nhất 1 lần); (2) Block đã Done / Tổng Block; (3) Block đang quá hạn ôn (đếm chính xác theo Block từ cây `DB.getFullTree`, bấm vào nhảy thẳng tới Block quá hạn gần nhất).
- **4 chip giai đoạn Tony Buzan** ngay dưới 3 thẻ — mỗi chip là số Block quá hạn của đúng giai đoạn đó, bấm vào để nhảy tới tab tương ứng bên dưới.
- **Lịch 28 ngày**: xanh (+N) = số từ "học" hôm đó, cộng dồn mỗi lần 1 trong 3 thẻ bài tập đạt ≥ 80% (`DB.bumpLearnedToday`, lưu `daily_log`); đỏ (⚠N) = số từ đang **quá hạn ôn** hôm đó — tính SỐNG mỗi lần mở màn Journey, dựa vào `bp.next_review_at` đã trôi qua mà chưa ôn lại. Có chú thích ký hiệu ngay trên lịch.
- **2 khung song song bên dưới**: TRÁI = "🚦 Theo tiến độ Tony Buzan" — 4 tab (khớp `w.SRS.STEPS[].group`), mỗi tab liệt kê 2 danh sách **theo Block** (không theo từng từ, vì tiến trình chỉ lưu ở cấp Block): "🔴 Đến hạn ôn ngay" và "🟢 Đã ôn, chưa tới hạn kế tiếp". PHẢI = cây drill-down cũ (Hub›Notebook›Section›Page›Batch›Block) để duyệt/nhảy vào học theo cấu trúc thư mục — cây này CHỈ để duyệt, không ảnh hưởng tới số liệu bên trái.
- `DB.getJourneySummary` (số tổng quan, nhanh) và `DB.getFullTree` (toàn bộ cấu trúc + `bp` map, dùng cho cây + 4 tab) là 2 đường load riêng — cả 2 đều PHẢI check `progressLocal()` (không phải `DB.mode`) khi quyết định đọc `block_progress` ở đâu, vì kho từ vựng có thể là Cloud trong khi tiến trình vẫn Local (chưa đăng nhập thật) — nhầm 2 cái này từng gây lỗi `invalid input syntax for type uuid` sập cả cây Journey (đã sửa).

## Cách thêm từ vựng mới
- **"+ Paste từ mới"**: dán danh sách từ (mỗi dòng 1 từ, các cột cách nhau `|` hoặc tab) → tự cắt Block 10 từ/batch mới, đánh số lại từ 1. Có key AI thì tự tra điền nốt cột thiếu (level/pos/ipa/def_en/meaning_vi).
- **"✨ Dán bài, tự trích từ"**: dán bài báo/transcript YouTube (`.txt` hoặc nguyên file phụ đề `.srt` — tự nhận diện, bỏ số thứ tự/mốc giờ) → AI trích từ vựng B1+ → tự tạo Block. Bài dài hơn ~12.000 ký tự/lượt **tự động chia nhiều phần** (`Context.splitChapters`, cùng cơ chế với "Dán cả sách" bên dưới, cắt tầng đoạn văn→câu→dòng→từ nên luôn cắt được kể cả bài không có dấu câu) — không cần tự cắt tay, chỉ cần xem/sửa tên từng phần rồi bấm xử lý. Transcript tự động (YouTube auto-generated) thường **không có dấu câu** — app tự phát hiện và nhờ CHÍNH lệnh AI trích từ vựng chấm câu lại luôn (không tốn thêm lượt gọi AI riêng), bài dài thì tự chia phần nhỏ hơn (5000 ký tự thay vì 11000) để lượt AI nào cũng kịp trả lời trong 25 giây.
- **Lưu từ khi đọc** (kiểu LingQ): bôi/bấm từ trong bài đọc → lưu vào Batch "⭐ Từ đã lưu" của Page hiện tại, đủ 10 từ tự sang Block mới (đánh số tiếp theo Block cũ nhất trong batch đó, không nhảy về 1 nếu batch đã có số).

## AI Framework — phân tích & luyện nói theo khung
Nút **"🧭 AI Framework"** trên toolbar Notebook (`app.js` `doAiFramework`) — hiện ở **MỌI Notebook** (từ 2026-09-24; trước đó chỉ TJ_DATA ANALYST), ẩn với role "Chỉ xem". Dán 1 hoặc NHIỀU câu hỏi/tình huống (mỗi dòng 1 câu) → AI phân tích từng câu theo **7 Master Framework cố định** (`Context.FRAMEWORK_BANK`: opinion/why/story/self_intro/problem_solving/presentation/data_analysis) → mỗi câu tạo ra 1 cặp Block **🗣️ Speaking + ✍️ Writing** (chung 1 Batch, chung bộ từ vựng `full_words`, khác bài đọc), lưu vào `blocks.framework_data` (JSON).

**2 lệnh gọi AI/câu hỏi** (`Context.generateFrameworkAnalysis`): Call 1 (nhẹ) = fit_tier/why/communication_method/method_key/opening_lines/keywords_by_stage/linking_words/closing_lines/paraphrase cho cả 7 framework; Call 2 (nặng) = từ vựng dùng chung + 2 bài đọc tổng quan (nói/viết) + bài đọc riêng từng framework. Cả 2 lệnh bọc qua `Context._callProviderJSONValidated` — **tự động gọi lại AI 1 lần** (không chỉ parse lại chuỗi cũ) nếu JSON hỏng cú pháp **hoặc** JSON hợp lệ nhưng sai schema (vd thiếu framework, sai số lượng 7) — 2 loại lỗi AI-flaky khác nhau, cùng 1 cơ chế retry. Nếu vẫn lỗi sau khi thử lại: `doAiFramework` **tự xoá Batch rỗng vừa tạo** (không để lại rác "0/0" nếu user bấm lại nhiều lần).

**Panel Framework** (`detail.js` `D.renderFrameworkPanel`, hiện trong màn học 1 Block) có **5 tab xem** (`#fw-view-tabs`, nhớ theo máy qua `localStorage`):
| Tab | Nội dung |
|---|---|
| 📋 Danh sách | Xổ từng framework theo hàng, xem chi tiết why/mở đầu/từ khoá/linking words/kết luận/bài viết/paraphrase/từ vựng/bài đọc riêng. |
| 📊 So sánh | Bảng Excel-kiểu: cột = 7 framework, hàng = từng mục ở trên — cuộn 2 chiều, cột nhãn + hàng tiêu đề đều sticky (`.fw-compare-wrap`). |
| 🧩 Theo phương pháp | Dashboard lọc theo `method_key` AI tự gán mỗi framework (1 trong `Context.METHOD_BANK`: SCQA/Pyramid/BLUF/PREP/5W-1H/Claim-Evidence/STAR/TAKE ACTION) — chỉ hiện phương pháp THẬT SỰ có mặt trong 7 framework của câu hỏi này. |
| TJ | Bảng kiểu Google Sheet của TJ — hàng = ĐÚNG các giai đoạn riêng của 1 phương pháp (vd SCQA: Situation/Complication/Question/Answer), cột = cả 7 master framework. Cần **1 lệnh AI riêng mỗi phương pháp** (`Context.generateMethodBreakdown`, nút "✨ Tạo bảng chi tiết" — KHÔNG tự gọi lúc mở panel), cache vào `framework_data.method_breakdowns[method_key]`. |
| 🎯 Bảo | Deep-dive kiểu tài liệu mẫu "anh Bảo" (`\\...\a Bảo-high level communication.pdf`) — khác tab TJ: AI **tự đặt 1 "chain" 4 bước riêng** cho từng framework (không có trục phương pháp cố định để chọn) + 1 bài SPOKEN ANSWER đầy đủ + 1 "Recall Path". 1 lệnh AI DUY NHẤT cho cả 7 framework (`Context.generateBaoAnswers`), cache vào `framework_data.bao_breakdown`. Phần "cách luyện tập 4 bước"/"câu nối tự nhiên" trong tab này là NỘI DUNG TĨNH (không AI sinh). |

**"🔄 Tạo lại tất cả"** (đầu panel) sinh lại CẢ 7 framework — giữ **liên tục từ vựng** (truyền `previousWords` vào Call 2, AI ưu tiên giữ/chỉ đổi dạng ngữ pháp hoặc từ đồng nghĩa thay vì nhảy chủ đề), từ MỚI thật sự tự chạy xuống bảng từ vựng Block (`DB.addWordsToBlock`), bản cũ đẩy vào `framework_data_history` (mảng, tối đa 5 bản, mỗi bản có `_meta.{provider,cost_usd,generated_at}`) — chip lịch sử bấm khôi phục ngay. Tab TJ có nút **"🔄 Tạo lại bảng"** nhỏ RIÊNG mỗi phương pháp (`method_breakdown_history[key]`), tab Bảo có nút **"🔄 Tạo lại"** riêng cho `bao_breakdown_history` — 3 cơ chế lịch sử độc lập, đừng nhầm.

Mỗi Block card trong danh sách Block (chưa mở) có **preview nhanh** (`app.js` `fwCardPreviewHtml`) — framework fit nhất (`fit_tier==="top"` đầu tiên) + tên phương pháp ngắn (qua `method_key`→`METHOD_BANK`) + câu mở/kết mẫu + linking words, gói CHUNG hàng với dải icon tab tắt nhanh (`.block-tabs-row`) vì luôn có chỗ trống bên phải dải icon.

**Khác với nội dung THẬT đã viết sẵn** (không qua AI Framework): Section **"A THIÊN BẢO"** (Notebook TJ_DATA ANALYST) là 20 Page — mỗi Page 1 câu hỏi thật của anh Bảo, dùng NGUYÊN VĂN bài trả lời + từ vựng đã trích sẵn từ PDF gốc (copy lại từ batch "A Bảo N" trong section `File1_TJ_Communication`, không gọi AI thêm), có thêm Recall Path + Target time. Không liên quan tab "🎯 Bảo" ở trên (tab đó dùng AI tự viết MỚI cho câu hỏi bất kỳ TJ dán vào; Section này là thư viện nội dung THẬT cố định 20 câu của anh Bảo).

## Khoá API / bí mật
- `js/config.js` — **có commit** (repo **Public** trên GitHub — mọi key trong file này coi như công khai). Chỉ chứa `SUPABASE_URL`/`SUPABASE_ANON_KEY` — an toàn để lộ (chặn bởi RLS trong `tools/supabase_schema.sql`). **Tuyệt đối không** đặt `service_role`/`sb_secret_...` vào đây.
- **`GEMINI_API_KEY` KHÔNG nằm trong bất kỳ file client-side nào nữa** (đã bị Google tự thu hồi 3 lần liên tiếp khi từng để trần trong `config.js` — repo Public bị secret-scanning quét ra). Key thật giờ chỉ là **Supabase secret** dùng bởi Edge Function `gemini-proxy` (`supabase/functions/gemini-proxy/index.ts`); client (web live lẫn máy local) gọi qua proxy này bằng `SUPABASE_URL`/`SUPABASE_ANON_KEY` sẵn có, không bao giờ cần biết giá trị key thật. Đổi key Gemini: `supabase secrets set GEMINI_API_KEY=<key> --project-ref pqarpszsipbdugrumhfy` rồi `supabase functions deploy gemini-proxy --project-ref pqarpszsipbdugrumhfy --no-verify-jwt` — không sửa file JS nào. Xem thêm ở `CLAUDE.md`.
- `js/keys.local.js` (copy từ `js/keys.local.example.js`) — **gitignored**, không commit, chỉ tồn tại trên 1 máy cụ thể. Dùng **duy nhất** để bật **OpenAI tuỳ chọn** (`OPENAI_API_KEY` + `OPENAI_MODEL`) cho máy đó — trả tiền thật nên không đưa lên web live. Không có file này (mặc định) thì app chỉ dùng Gemini qua proxy, hoạt động bình thường ở mọi nơi.

## Việc còn dang dở
> **Đây là nơi ghi backlog nhiều-phiên, LÂU DÀI** (khác `HANDOFF.md` — file đó chỉ ghi checkpoint TẠM của 1 phiên sắp hết token, xem luật dùng ngay đầu file đó, và `CLAUDE.md` mục "Nguyên tắc chung"). Việc nào kéo dài nhiều phiên/nhiều người thì cập nhật thẳng vào đây; đừng lập thêm file `.md` mới ngoài 3 file đã có (README/CLAUDE/HANDOFF).

- **🎮 PHÒNG GAME CHƠI CHUNG (chốt với TJ 2026-09-30 — GĐ1 ĐÃ LÊN LIVE, xem cuối mục này)** — đấu từ vựng real-time với bạn bè (thường kèm voice HelloTalk nên game **im lặng hoàn toàn**, báo đúng/sai bằng màu).
  - **Trang riêng `game.html` + `js/game.js`** (không nhồi 1 file inline), dùng chung `config.js`/Supabase. 2 cửa vào: (1) chuột phải / ⋯ ở MỌI cấp Hub/Notebook/Section/Page/Batch/Block -> "🎮 Mở phòng game" (phạm vi chọn sẵn, dùng `App.scopeIds` như "🏆 Xem xếp hạng"); (2) mở thẳng `game.html` -> tự chọn 1 hoặc nhiều nhánh trên cây.
  - **Chỉ TJ (admin, `Auth.isAdmin()`) được mở phòng** — tạm thời, sau mở rộng. Host = profile TJ lưu vào `game_rooms.host_id`; trang game so với người đang đăng nhập để hiện bảng điều khiển host. Người chơi vào qua link/mã phòng, không cần tài khoản.
  - **Người chơi**: lần đầu gõ tên + chọn ảnh (bộ có sẵn HOẶC tự tải lên — Supabase Storage bucket public, thu nhỏ 128px phía trình duyệt), máy nhớ cho lần sau. Tên trùng -> tự thêm `#2`, `#3`…
  - **Host chọn 2 kiểu chơi**: (a) kiểu Kahoot — cả phòng cùng 1 câu, đếm ngược mỗi câu, hết giờ hiện đáp án + bảng xếp hạng; (b) tự do — mỗi người tự làm câu riêng, ai nhanh nhiều điểm. **Trận tính theo PHÚT (host tự gõ số phút)**; câu hỏi lấy từ các nhánh đã chọn (lọc trùng theo chữ — kho 12.049 dòng chỉ 7.238 từ khác nhau). Câu hỏi v1: nghĩa Việt -> chọn 1 trong 4 từ/chunk tiếng Anh. Đúng +100, streak; sai reset streak.
  - **Chơi lẻ** (1-1 hoặc nhiều người đấu tự do) hoặc **chơi đội**: host đặt số đội + tự xếp người vào đội (nhanh nhất; leader chọn thành viên — tính sau). Điểm đội = **TỔNG** điểm thành viên.
  - **Lịch sử (lưu Supabase)**: mỗi người xem danh sách trận (ngày, chủ đề, điểm, hạng, đội) + bảng xếp hạng tổng mọi thời gian.
  - **Tiến trình học: CHỈ của TJ** được ghi từ game — mỗi câu TJ trả lời trong game ghi `game_answers` (có room_id = "học chung") + cập nhật `word_progress` (attempts/correct, ❌ Fix lỗi sai) nhưng **KHÔNG đẩy SRS/Done** (giống màn Ôn riêng). Người chơi khác chỉ lưu điểm game. "Học riêng" = tiến trình WordLoop như cũ; "học chung" xem riêng qua lịch sử game.
  - **Bảng mới (cần PAT chạy migration)**: `game_players` (id, name, name_no, avatar_url, profile_id?), `game_rooms` (code, host_id, scope jsonb, mode, team_mode, minutes, q_seconds, status, started_at, ended_at), `game_results` (room_id, player_id, team, score, correct, wrong, best_streak, rank), `game_answers` (room_id, player_id, word_id, correct, ms). Realtime: Broadcast/Presence theo kênh `room:<code>`.
  - **Giai đoạn**: GĐ1 = tên+ảnh, tạo/vào phòng, 2 kiểu chơi, bảng xếp hạng trực tiếp, lưu kết quả + ghi tiến trình TJ. GĐ2 = đội + trang lịch sử + xếp hạng tổng. GĐ3 = thêm kiểu câu (Anh->Việt, điền từ trong bài đọc), đấu lại.
  - **GĐ1 xong (2026-09-30)**: `game.html` + `js/game.js` + `css/game.css`, bảng trong `tools/game_schema.sql` (đã chạy trên Supabase thật + bucket `game-avatars`). Menu chuột phải "🎮 Mở phòng game" (chỉ admin, Cloud mode) mở `game.html?scope=<table>:<id>&title=…`. **Nghĩa hiển thị bằng 4 tiếng** host chọn (🇻🇳 `meaning_vi` · 🇺🇸 `def_en` · 🇪🇸 `meaning_es` · 🇨🇳 `meaning_zh`, cột `game_rooms.meaning_lang`) -> chọn từ tiếng Anh; câu hỏi "xào bài" (hết lượt mới lặp). Host là nguồn sự thật duy nhất (chấm điểm + đếm giờ, host thoát = trận dừng; host tải lại trang giữa trận thì mất điểm đang chạy — chưa xử lý). Đã test 2 trình duyệt headless (host Anti_TJ + 1 người chơi): tạo/vào phòng, tên trùng #2, Kahoot, kết thúc sớm, lưu game_results/game_answers, mở lại phòng đã kết thúc xem kết quả; dữ liệu test đã xoá. Tiến trình `word_progress` chỉ ghi cho hồ sơ TJ (`HOST_PROFILE_ID`; Anti_TJ đã bỏ admin 2026-09-30 — xem CLAUDE.md).
  - **GĐ2 xong (2026-09-30, game.js v5)**, test 4 tab headless (host + 2 người chơi Việt/Trung + 📺), dữ liệu test đã xoá:
    - **Điểm**: đúng = 100 + thưởng tốc độ tối đa 50 (Kahoot theo giây/câu, Tự do theo 8 giây); chuỗi đúng ≥3 thì ×1.5; sai/bỏ câu mất chuỗi.
    - **Lộ đáp án**: ảnh những người chọn từng đáp án + "⚡ Nhanh nhất" (người đúng nhanh nhất).
    - **Đáp án nhiễu khó**: ưu tiên từ CÙNG Block, rồi cùng `pos`, rồi mới bất kỳ; "xào bài" hết lượt mới lặp.
    - **Đội**: host chọn 2-4 đội, "🔀 Chia đều tự động" (chênh tối đa 1 người) hoặc bấm tên để đổi đội; người vào muộn tự vào đội ít người nhất; điểm đội = TỔNG, đội lệch người thì hiện thêm TB. Lưu `game_results.team`, `game_rooms.teams`.
    - **Mỗi người tự chọn tiếng nghĩa** (ô 🌐 trên cùng, nhớ theo máy `tjwl_game_lang_v1`). **Mặc định "Theo phòng"** (= tiếng host chọn) — KHÔNG đoán theo trình duyệt nữa (TJ thấy 2 cửa sổ hiện 2 tiếng khác nhau, 2026-09-30). Host có ô **"🔒 Ép cả phòng dùng tiếng này"** (`st.force`) -> ô 🌐 của người chơi bị khoá, cả phòng 1 tiếng (vd ép 🇺🇸 = ai cũng thấy định nghĩa tiếng Anh). Cả phòng vẫn cùng 1 câu + cùng 4 đáp án tiếng Anh; host ưu tiên từ có đủ nghĩa cho MỌI tiếng đang có trong phòng, thiếu thì hiện nghĩa tiếng Anh.
    - **📜 Lịch sử & Xếp hạng**: "Của tôi" (số trận, số lần 🥇, kỷ lục điểm, chuỗi dài nhất, từng trận), "Tuần này", "Mọi thời gian".
    - **📺 Màn hình chung** `game.html?room=MÃ&view=screen`: chỉ xem (không tính là người chơi) — câu to, số người đã trả lời, ai chọn gì, điểm đội, **đường đua** (ảnh chạy theo điểm). Host có ô "Host cũng chơi" (bỏ tích = làm MC).
    - **Host mất kết nối**: host gửi nhịp 3 giây/lần; người chơi quá 7 giây không nghe -> banner "⚠ Host mất kết nối". Host vào lại trên CÙNG máy -> khôi phục trận từ localStorage `tjwl_game_host_<MÃ>` (không mất điểm; đồng hồ vẫn chạy trong lúc mất kết nối). Host mất hẳn -> trận không được lưu. **Chưa làm**: tự chuyển host sang người khác.
  - **GĐ3 phần 1 xong (2026-09-30, game.js v7)** — test 5 tab headless (host + Việt + Trung + Tây Ban Nha + 📺), dữ liệu test đã xoá:
    - **Điểm TÍNH THEO CÂU** (TJ đổi): đúng +100, sai/bỏ 0; chuỗi 🔥 chỉ hiển thị; ⚡ nhanh nhất chỉ để khoe. (Bỏ thưởng tốc độ ×1.5 của GĐ2 — tính theo thời gian để sau, xem mục tư vấn bên dưới.)
    - **3 dạng câu** (host chọn ở tạo phòng/phòng chờ, cột `game_rooms.qtype`): 🔤 `meaning` nghĩa -> chọn từ · 📝 `gap` điền chỗ trống = câu trong **bài đọc của Block** (`blocks.context_passage`, tách câu y như `Context.gapSentences`; phạm vi mẫu 1 Page TOEIC có 51 câu) · ⌨️ `recall` gõ từ tiếng Anh từ nghĩa (chấm như `w.normalizeAnswer`, "subscribe (to)" gõ "subscribe" cũng đúng) · 🔀 `mix` trộn.
    - **Giao diện 4 tiếng theo từng người** (ô 🌐: vi/en/es/zh, "Theo phòng" = tiếng host chọn): chữ nút/hướng dẫn/thông báo/lịch sử dịch hết; phần cài đặt chỉ host dùng để tiếng Việt. Host 🔒 ép thì chỉ NGHĨA cả phòng 1 tiếng, chữ giao diện vẫn theo từng người.
  - **PHÒNG CỐ ĐỊNH + 1 LINK (2026-09-30, game.js v9)** — TJ: "tạo lại mã phòng mới là vô lý":
    - **1 link cho tất cả: `…/game.html`** (không tham số) = phòng mã **`TJ`** (`DEFAULT_ROOM`). TJ mở cùng link -> là host. Người chơi mở link -> gõ tên -> vào phòng chờ; TJ chưa vào thì thấy "Host chưa vào phòng", không có gì chạy cho tới khi host bấm Bắt đầu. `?room=MÃ` vẫn dùng được.
    - Host = phòng `TJ` của mình (hoặc phòng mới nhất, chưa có thì tự tạo). **Chủ đề, dạng câu, tiếng, số phút, chơi lẻ/đội chọn TRONG PHÒNG CHỜ** (cây chủ đề nằm trong khung host); đổi chủ đề không đổi mã/link. Chuột phải "🎮 Mở phòng game" = mở phòng này với chủ đề chọn sẵn.
    - **🔒 Ép cả phòng dùng tiếng nghĩa CHỈ áp cho câu dạng 🔤 Nghĩa** (ô chỉ hiện khi dạng câu = Nghĩa/Trộn): Điền chỗ trống là câu tiếng Anh, Gõ từ vẫn theo tiếng riêng từng người; trộn cả 3 thì chỉ câu Nghĩa bị ép. Từ cần trả lời LUÔN là tiếng Anh ở mọi dạng.
    - **Chỉ hồ sơ TJ làm host** (`HOST_PROFILE_ID`), nhãn "Host" do phòng quyết định (hồ sơ = `host_id`), không tin máy tự nhận.
    - **Mỗi lần Bắt đầu = 1 VÁN** (`game_matches`: chủ đề/cài đặt chụp lại lúc bắt đầu); `game_results`/`game_answers` có `match_id` (unique match_id+player_id). Hết ván -> host bấm **"🔁 Ván mới"** -> cả phòng về phòng chờ (giữ người, đội, cài đặt). Lịch sử xem lại từng ván qua `?match=<id>`. Bảng xếp hạng Tuần/Mọi thời gian = cộng điểm mọi ván.
  - **v22 (2026-09-30)**: ⏱ **cách tính điểm mỗi ván** (Theo câu / Theo tốc độ: đúng 100 -> 50) · 📄 **Phiếu đầy đủ theo Block** (cả bài đọc, ô chọn từ, thời gian = giây/câu × số chỗ trống) · ✍️ **Đặt câu** (LanguageTool API miễn phí chấm ngữ pháp 0-50 + Gemini qua gemini-proxy chấm dùng từ 0-50 + câu sửa; gom cả phòng 1 lần gọi) · 🎧 **Dictation** (🔊 giọng máy trên máy người chơi, nhắc tai nghe, chấm % từ đúng theo LCS). **Hiển thị ✓ đúng / ✗ sai** thay điểm to (xếp hạng theo số câu đúng; ván "tốc độ" kèm điểm nhỏ ghi rõ). Người chơi CHỈ chọn "Nghĩa hiển thị bằng" (tiếng mẹ đẻ, màn tên + thẻ phòng chờ + ô 🌐 Language), ẩn mã phòng/link/📺/chủ đề/cài đặt. Vào giữa ván -> xem 📺, ván sau mới chơi. Ai thoát không hiện nữa (nhịp presence 10s, quá 25s = thoát; pagehide untrack). Nhiều máy đăng nhập TJ -> chỉ máy vào SỚM NHẤT làm host, thoát thì máy TJ kế tiếp lên (về phòng chờ, giữ cài đặt). Cây chủ đề xuống Batch/Block. "Chơi đội" đổi nhãn "Hình thức thi đấu / Chơi lẻ".
  - **v23**: thêm dạng 🔤 **Từ tiếng Anh → chọn nghĩa** (`en2m`: hiện từ, 4 lựa chọn là NGHĨA theo tiếng mẹ đẻ từng người, `data-opt` vẫn là từ để chấm; 🔒 ép áp dụng; có trong Trộn). **Khôi phục ván khi host tải lại trang: ĐÃ TẮT HẲN** (TJ: "tự khởi động chơi hoài" — host rớt mạng thì ván đó bỏ, vào lại là phòng chờ; localStorage `tjwl_game_host_*` cũ tự dọn). Phòng chờ: roster = đúng người đang online.
  - **v25**: **Kết thúc = dừng hẳn** (host không ra câu/lộ đáp án nữa kể cả đang chấm dở; chỉ TJ bấm 🔁 Ván mới mới về phòng chờ). 2 host cùng lúc (tab bản cũ) -> host nào nhận trạng thái của host vào trước thì nhường (`hid/hsince` trong state). Ngôn ngữ mặc định: máy TJ = tiếng Việt; người chơi CHƯA tự chọn = "Tiếng chung" của phòng (không đoán theo trình duyệt nữa — bug: TJ thấy nghĩa tiếng Anh vì trình duyệt để English).
  - **v26–v34 (2026-09-30 → 10-01)** — sửa lỗi khi chơi thật + thêm tính năng (chi tiết trong git log):
    - **Kênh realtime bị server đóng** ("Client presence rate limit exceeded", ~10s sau khi bắt đầu) vì mỗi máy `track()` presence 10s/lần -> nay nhịp "còn ở đây" gửi bằng broadcast `alive`; kênh rớt tự nối lại 1.5s; host chấm câu của chính mình trực tiếp (không vòng qua mạng).
    - **1 tab / trình duyệt** (BroadcastChannel): 2 tab cùng người chơi từng tự nhận host cùng lúc -> màn hình nhảy, Kết thúc vẫn chạy. Bầu host theo `tab` (G.tab), tab TJ mới không tự nhận host ngay; máy TJ khác không giành host giữa ván.
    - Người chơi bị coi là thoát sau **90s** (không phải 25s — điện thoại chuyển HelloTalk); ai trong phòng mà chưa có trong ván -> host thêm vào chơi luôn.
    - Gõ lại tên cũ ở máy mới: hồ sơ TJ tự dùng lại người chơi cũ, người khác được hỏi "có phải bạn không" (giữ lịch sử, khỏi #2).
    - 📜 Lịch sử & Xếp hạng: cho MỌI người (phòng chờ + kết quả), không bị trạng thái phòng kéo đi.
    - ☑ Chọn tất cả / ✖ Bỏ tất cả chủ đề trong phòng chờ.
    - 📝 **Điền chỗ trống = câu AI ngắn kiểu TOEIC Part 5** (gpt-4o-mini qua `openai-proxy`), AI thứ 2 kiểm "chỉ 1 đáp án hợp" rồi mới giữ; nhớ trên máy host (localStorage `tjwl_game_gapai_v3`, tối đa 60 từ/phạm vi); Tự do: host gửi câu cho người chơi (broadcast `gaps`). Ô trống nằm trong câu, dài bằng từ.
    - 📖 **Xem lại đáp án** sau ván (◀ ▶ / phím ← →), mỗi máy tự chụp câu lúc lộ đáp án.
    - **Sang câu bằng tay** ("Câu tiếp ▶"; Kahoot host bấm, có "👁 Hiện đáp án"); **⏱ Có tính giờ / ∞ Không tính giờ**; hết giờ chưa Enter -> tự nộp chữ đang gõ/ô phiếu đã chọn.
  - **CÒN DANG DỞ (cập nhật 2026-10-01)**:
    - **Tài khoản game rối (TJ#2/#3) — đề xuất "1 hồ sơ = 1 người chơi, khách trùng tên = cùng người" đang chờ TJ chốt, chi tiết ở `HANDOFF.md`.**
    - **Chờ TJ đồng ý (đụng dữ liệu thật)**: (1) trừ 9 câu test đã lỡ ghi vào `word_progress` của TJ (8 từ Block 1 `bl_mtx25v31_jkbfuu`, `last_reviewed_at` 1790783624948–1790783668162; attempts +1 mỗi câu, 2 đúng/7 sai, 6 từ bị bật `wrong_open`) — không khôi phục được `last_reviewed_at`/`wrong_open` cũ; (2) gộp người chơi trùng: TJ#2 -> TJ (#1), Anti_TJ#3 -> Anti_TJ (chuyển `game_results`/`game_answers` rồi xoá dòng thừa); (3) bỏ `profile_id` TJ khỏi "Anti_TJ" #1.
    - ~~Câu AI chỉ nhớ trên máy host~~ — XONG: bảng `game_gap_sentences` (v41 ghi cả câu AI soạn tại chỗ). Còn: bảng chỉ 1 câu/`word_id` (muốn nhiều câu/từ, mỗi bài đọc/AI 1 câu, thống kê câu hay sai -> đổi khoá chính, cần PAT). AI kiểm vẫn có thể lọt câu hợp 2 đáp án.
    - Xem lại đáp án chỉ lưu trong trang (tải lại trang là mất); chưa lưu lên Supabase.
    - Chưa làm: tự chuyển host sang NGƯỜI CHƠI khác khi host (TJ) mất hẳn; leader tự chọn thành viên đội; nút "đấu lại" (có thể trùng 🔁 Ván mới — hỏi TJ).
    - Test headless dùng phòng tạm `ZTEST` + người chơi `ZZ_*` (tạo/xoá qua REST) — host để MC (bỏ "Host cũng chơi") để KHÔNG ghi tiến trình TJ.
- **Active Recall Quiz / game — hướng hỏi theo NGÔN NGỮ MẸ ĐẺ — ĐÃ LÀM 2026-09-30** (detail.js v45: tab Active Recall có hàng nút VN/EN/CN/ES, dùng chung lựa chọn `D.meaningLang()` với tab Nghĩa, nhớ theo máy; game có ô 🌐 từng người). Ghi chú gốc: đúng ra phải **hiện nghĩa bằng tiếng mẹ đẻ của người học rồi gõ/chọn từ tiếng Anh**. Hiện tại người học chỉ là người Việt (chủ yếu TJ) nên giữ như cũ; tương lai có người học nói tiếng khác (vd bạn HelloTalk) thì đổi: lấy tiếng mẹ đẻ theo hồ sơ (vd `profiles.lang` / người chơi game tự chọn) để chọn cột nghĩa (`meaning_vi`/`meaning_es`/`meaning_zh`/`def_en`). Game đã có sẵn ô chọn "Nghĩa hiển thị bằng" cho cả phòng — bước sau là cho TỪNG người chơi 1 tiếng riêng.
- **Đăng nhập thật (magic link) để đồng bộ tiến trình học** (đã thuộc từ nào, streak Journey) giữa các thiết bị — hiện chỉ kho từ vựng/bài đọc đồng bộ qua Supabase, tiến trình vẫn theo từng máy (`progressLocal()` = true cho tới khi có đăng nhập thật).
- **Viết bài đọc tay — 2 notebook riêng biệt đang thiếu, ĐỪNG NHẦM LẪN VỚI NHAU:**
  - **(A) "TOEIC_COLOCATION"** (section id `nb_toeic_s2`, 60 Block, `Block 1 → Block 60`). Trạng thái thật (kiểm bằng REST API ngày 2026-09-10, không tin theo trí nhớ của phiên làm việc trước — đã từng bị lệch giữa các file .md): **35/60 Block đã có đủ 3 bài**, **Block 7 và Block 8 mới có 1/3 bài**, **23 Block còn TRỐNG hoàn toàn**: Block 9, 10, 11, 12, 16, 17, 18, 19, 20, 21, 34, 35, 43, 44, 45, 53, 54, 55, 56, 57, 58, 59, 60. Kiểm tra nhanh:
    ```bash
    SB_URL="https://pqarpszsipbdugrumhfy.supabase.co"; SB_KEY="<xem js/config.js>"
    curl -s "$SB_URL/rest/v1/blocks?batch_id=in.(nb_toeic_s2_p1_b1,nb_toeic_s2_p2_b1,nb_toeic_s2_p3_b1,nb_toeic_s2_p4_b1,nb_toeic_s2_p5_b1,nb_toeic_s2_p6_b1,nb_toeic_s2_p7_b1,nb_toeic_s2_p8_b1,nb_toeic_s2_p9_b1,nb_toeic_s2_p10_b1)&select=id,name,global_index,context_passage_candidates&order=global_index" -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY"
    ```
    Ghi thẳng lên Supabase bằng `PATCH .../rest/v1/blocks?id=eq.<id>` với body `{"context_passage_candidates": [...]}` (mảng candidates, KHÔNG phải `context_passage`), KHÔNG cần export/import file JSON.
  - **(B) Section "Loop by Topics"** (id `2a064e84-b574-4c07-8a2d-929f90f70486`, hub TOEIC HUB, notebook "SCENARIO", 8 Page × Block, `Block 104 → Block 149`, 46 Block tổng). Khác notebook (A) ở trên — cấu trúc riêng, đè thẳng lên **`context_passage`** (không phải candidates, đã được người dùng xác nhận trước đó). Trạng thái thật (verify REST API 2026-09-10): **11/46 Block đã có bài Claude thật** (`meta.claude:true`) — trọn 2 topic đầu "01_Doanh nghiệp & Quản trị" (Block 104-109) + "02_Tài chính & Kinh tế" (Block 110-114). **35 Block còn lại chỉ có bài placeholder/cũ**, danh sách đầy đủ (block_id + 10 từ + nghĩa tiếng Việt, không cần query lại Supabase) nằm sẵn trong `tools/_passage_todo.json`, chia theo topic: `03_Công nghệ và dữ liệu` (6 Block, 115-120), `04_Giao tiếp & Đàm phán` (5 Block, 121-125), `05_Tâm lý & Tư duy` (6 Block, 126-131), `06_Sức khỏe & Sinh học` (4 Block, 132-135), `07_Pháp lý, Chính trị & Xã hội` (5 Block, 136-140), `08_Đời sống, Thành ngữ & Môi trường` (9 Block, 141-149, **Block 149 chỉ có 1 từ — "green auditing"**, hỏi lại người dùng có cần viết đủ 500 từ chỉ để nhét 1 từ không). Tooling đã dựng sẵn, dùng lại y nguyên: `tools/_verify_passage.js` (verify Node đúng chuẩn CLAUDE.md) + `tools/_passage_pipeline.py` (hàm `run(out_path, block_id, terms_vi_dict, marked_text, title, source_vi)` gộp ghi JSON case → verify → PATCH thẳng lên Supabase nếu PASS hết). Bài học rút ra: ước lượng số từ trước khi verify hay THIẾU — nhắm ~550-600 từ lúc soạn (không phải đúng 500) để đỡ phải quay lại thêm câu.
  - Cả 2 việc trên dùng chung quy trình viết + verify: xem mục "Khi viết bài đọc tay hàng loạt" trong `CLAUDE.md`.
- **Data quality**: `data/starter.json` (kho mẫu ban đầu) đã được 1 subagent rà soát và sửa 4 notebook bị lỗi xáo trộn cột — còn vài quyết định treo (gán CEFR cho 600 collocation TOEIC, xử lý các dòng "bảng tham chiếu" lẫn trong bảng words) cần người dùng tự quyết, xem log commit tương ứng.
- **Audit UI/UX** (1 subagent, xem log commit "Vá 5 lỗi từ audit UI/UX"): đã vá các lỗi ưu tiên cao (tab treo sau Active Recall Quiz, nút "⋯" vô hình trên Block card, 4 chỗ hardcode màu hex phá theme sáng, thiếu `[data-block]` ở contextmenu, thiếu aria-label). Các mục còn treo trước đây **đã vá xong đêm 08/09** (xem log commit "A11y: vòng focus bàn phím...", "Mobile: nới vùng bấm...", "Thêm thanh loading mảnh..."): (1) `.block-card`/`.jrow`/`.g-row` đã có `tabindex`/`role="button"` + vòng focus bàn phím; (2) `.batches-bar` đã hết chật ở màn hẹp (nới vùng bấm icon-button ~40px + wrap); (3) đã có thanh loading mảnh lúc `boot()` đang tải ở chế độ Cloud/mạng chậm. Chỉ còn treo đúng 1 mục: **(4) chưa có phím tắt cho bài trắc nghiệm** (1-4/A-D chọn đáp án, Enter next).
- **Tab "🎧 Dictation"**: đã code xong + lên live (nghe câu, gõ lại, tự chấm) — xem quyết định phạm vi (không ghi điểm/SRS, chỉ luyện) trong `CLAUDE.md` mục "Quyết định đã chốt".
- **Phiên 2026-09-13 — ĐÃ XONG, đã test bằng Playwright:**
  - **Thêm tiếng Trung (zh) làm ngôn ngữ giao diện thứ 3** (cạnh vi/en) —
    `js/i18n.js` thêm `DICT_ZH`/`REV_ZH`/`PARTIAL_ZH` (dịch ~150 chuỗi UI
    chính: menu, nút, tiêu đề). `translateText`/`applyPartial`/`walk`/
    `I18N.apply`/observer đều đã tổng quát hoá cho 3 ngôn ngữ.
  - **FIX BUG THẬT** phát hiện lúc thêm zh: `Auth.effectiveLang()` fallback
    "en" khi `Auth.user` CHƯA có (đang chờ `Auth.init()` xong) khiến lượt
    dịch ĐẦU TIÊN lúc boot LUÔN chạy nhầm sang "en" trước khi biết ngôn
    ngữ thật — vô hại với vi/en (vì "en" tình cờ đúng cho user "en") nhưng
    HỎNG HẲN với "zh" (dịch nhầm vi->en trước, rồi khi biết đúng là "zh"
    thì DOM đã là "en" chứ không còn "vi", tra `DICT_ZH` (khoá tiếng Việt)
    không khớp gì cả, đứng yên sai). Sửa: fallback về "vi" (khớp đúng
    trạng thái DOM thật lúc đó) — sửa dứt điểm cho mọi ngôn ngữ.
  - **Tự đổi ngôn ngữ trong menu, giống hệt nút sáng/tối** — hàng "Ngôn
    ngữ" mới (`#lang-row`, 3 lá cờ) trong menu user, TỰ ĐỔI NGAY không cần
    qua Admin nữa (Admin panel vẫn còn, giờ dùng để đổi HỘ người khác).
    Cloud mode lưu `profiles.lang` (chạy NỀN, không chờ mạng mới đổi giao
    diện — bài học từ vụ freq/mạng chậm trước đó); Local mode lưu
    localStorage riêng máy đó (`tjwl_local_lang_v1`).
  - **Hồ sơ Local mới** tự đoán ngôn ngữ theo `navigator.language` của
    trình duyệt (vi/zh nhận diện được, còn lại mặc định "en") thay vì
    luôn cứng "en" — CHỈ áp dụng Local mode (Cloud do Admin tạo hộ, máy
    Admin không phản ánh đúng ngôn ngữ người dùng thật, để họ tự đổi lần
    đầu mở link qua nút mới ở trên).
  - **Tab "Nghĩa" thêm lựa chọn "🇨🇳 意思 ZH"** (cạnh VN/EN có sẵn) — cột
    mới `words.meaning_zh` (đã chạy `alter table` trên Supabase thật),
    `Context.enrichWords` giờ cũng tự điền nghĩa tiếng Trung khi thiếu
    (dùng cho "+ Paste từ mới"). PHẠM VI CHỦ Ý HẸP (TJ chốt): CHỈ tab
    Nghĩa đổi, bảng từ vựng chính/PDF export vẫn CHỈ VI/EN như cũ, không
    đổi gì thêm.
  - Đã tự cài lại Playwright (CLI, browser binary vẫn cache từ phiên
    trước) để test: chuyển ngôn ngữ đổi đúng chữ ngay lập tức, tab Nghĩa
    ZH hiện đúng 3 tab + đúng thông báo trống cho Block cũ chưa có dữ
    liệu meaning_zh, insert thật lên Supabase có meaning_zh không lỗi.
  - **Nút xổ xuống chọn ngôn ngữ sát 🌙/☀️** (`#lang-picker`/`#lang-btn`/
    `#lang-dropdown`, TJ yêu cầu "sát nút đổi giao diện" rồi chốt lại
    "chọn 3 ngôn ngữ" — không phải xoay vòng từng bước) — bấm nút (hiện
    lá cờ + ▾) xổ ra đúng 3 lựa chọn 🇻🇳/🇺🇸/🇨🇳 để CHỌN THẲNG, tự đóng sau
    khi chọn, đóng khi bấm ra ngoài (cùng cơ chế mở/đóng với #user-menu).
    Cờ EN đổi thành 🇺🇸 (Mỹ) thay vì 🇬🇧 (Anh) theo yêu cầu, khớp với quy
    ước "US" đã dùng sẵn trong app (giọng đọc "Nghe US", "en-US"...).
    Hàng "Ngôn ngữ" (3 lá cờ) trong menu vẫn còn song song, luôn đồng bộ
    (dùng chung class `.lang-dot`).
  - **FIX BUG THẬT #2** phát hiện lúc test: `I18N.apply()` chỉ dịch TỪ
    tiếng Việt gốc (`DICT`/`DICT_ZH` đều chỉ có chiều "từ vi") — đổi
    THẲNG en→zh (bỏ qua vi ở giữa, xảy ra thật khi chọn 2 ngôn ngữ khác
    "vi" liên tiếp trong dropdown) đứng yên sai ở "en" vì không có bản
    dịch trực tiếp en<->zh. Sửa: `apply()` giờ LUÔN đưa DOM về "vi"
    trước (vô hại/no-op nếu đã sẵn vi) rồi mới dịch sang đích thật —
    đúng với MỌI hướng chuyển đổi. Đã test Playwright qua nhiều lượt
    chọn liên tiếp, ổn định hoàn toàn.
  - **Hướng dẫn sử dụng — ĐÃ TẠO** (không phải Notebook riêng — COMMUNICATION
    hoá ra là 1 NOTEBOOK có sẵn, không phải Hub): thêm 1 Section mới
    "📘 Hướng dẫn sử dụng" ngay bên trong Notebook COMMUNICATION (id
    `c545186c-d218-42a1-9196-03f87df60e4d`) > Page "Bắt đầu" > Batch 1 >
    Block "Giới thiệu ứng dụng". Block này CHÍNH LÀ ví dụ sống — 10 "từ
    vựng" thật ra là 10 THUẬT NGỮ CỦA APP (Hub/Notebook/Batch/Block/full
    batch/karaoke/sticky player/Tony Buzan cycle + 2 thuật ngữ tiếng Anh
    thật collocation/phrasal verb), bài đọc ~520 từ giải thích cách dùng
    app bằng tiếng Việt kèm đoạn hướng dẫn đổi ngôn ngữ vi/en/zh (tính
    năng vừa thêm ở trên). Đã verify bằng Playwright: đúng 10 dòng bảng
    từ, đúng 10 từ được bôi [ngoặc] karaoke, đúng tiêu đề/nội dung khi mở
    Block thật trên app.

- **Phiên 2026-09-13 (tiếp) — ĐANG LÀM DỞ:**
  - **Tên Hub/Notebook/Section/Page/Batch tự đổi theo ngôn ngữ giao diện**
    (TJ yêu cầu: "đổi cờ là phải đồng bộ ... các Page nếu đang có tên
    tiếng Việt thì đổi qua luôn", đã hỏi rõ phạm vi = CẢ 5 cấp Hub/
    Notebook/Section/Page/Batch, không phải chỉ Page). Đã làm: thêm cột
    `name_en`/`name_zh` (`tools/supabase_schema.sql`), helper `displayName(row)`
    trong `js/app.js` (đọc theo `Auth.effectiveLang()`, rơi về `.name` gốc
    nếu ô dịch trống — KHÔNG bao giờ hiện trống trơn) đã nối vào
    `renderHubs`/`renderNotebooks`/`renderSections`/`renderPages`/
    `renderBatches`/`renderCrumb` — chỉ Hub/Notebook/Section/Page/Batch,
    CHỪA RIÊNG Block/Word (tên Block ít ý nghĩa để dịch). Script
    `tools/backfill_names.py` (mẫu y hệt `backfill_meaning_zh.py` đã chạy
    ổn định trước đó) đã viết xong, gọi Gemini dịch hàng loạt, GIỮ NGUYÊN
    tên đã là tiếng Anh/mã/tên riêng, chỉ dịch tên tiếng Việt có nghĩa thật.
    **CÒN THIẾU: (1) chưa chạy migration SQL thật trên Supabase** (đã verify
    bằng `curl` — cột `name_en` CHƯA tồn tại, script sẽ lỗi 42703 nếu chạy
    ngay bây giờ) — cần TJ tự chạy 10 dòng `alter table` trong
    `tools/supabase_schema.sql`, hoặc nhờ chạy hộ; (2) `tools/backfill_names.py`
    chưa test bằng `--limit` nhỏ, chưa chạy full, chưa commit; (3) label
    "Ôn sau N giờ/ngày/tháng/phút" (đếm ngược ôn tập) vẫn CHƯA dịch theo
    ngôn ngữ (còn nguyên tiếng Việt bất kể chọn en/zh) — thiết kế đã có
    (PARTIAL dict prefix/suffix cho en, đảo từ cho zh) nhưng chưa code;
    (4) toast/thông báo nhỏ khác ("đã lưu", "lỗi"...) vẫn hoàn toàn tiếng
    Việt, chưa đụng tới phần này.
  - **FIX BUG THẬT**: "Đang ở Journey, bấm qua Block khác thì không nhảy,
    màn hình vẫn đứng ở Journey, phải bấm lại 📖 Learning mới thoát ra
    (trả về màn danh sách Block, KHÔNG phải đúng Block vừa bấm)" — TJ báo.
    Root cause: `App.jumpTo(opts)` (dùng chung cho Journey/Trang chủ nhảy
    thẳng vào 1 Block) gọi `await App.ensureNotebookContext(...)` (tải
    Notebook đích nếu khác Notebook đang mở) KHÔNG bọc try/catch — mạng
    chậm/lỗi lúc tải (đúng kiểu độ trễ Supabase đã ghi nhận ở phiên
    2026-09-12) khiến `await` NÉM LỖI, cả hàm `async` dừng NGANG giữa
    chừng TRƯỚC đoạn code ẩn `#screen-journey` phía dưới -> kẹt nguyên tại
    Journey, không có thông báo lỗi nào cho biết vì sao. Bấm "Learning"
    sau đó chỉ đơn thuần đóng Journey theo nhánh dự phòng (trả về
    `#screen-blocks`, không phải đúng Block) — đúng y hệt hiện tượng TJ
    mô tả. Đã verify bằng Playwright: cố tình giả lập `DB.loadNotebook`
    ném lỗi cho 1 notebookId giả -> xác nhận đúng lỗi trên (màn kẹt tại
    Journey, promise `App.jumpTo` bị reject không được bắt). Sửa: (1) bọc
    try/catch quanh `ensureNotebookContext` trong `App.jumpTo`, báo lỗi
    bằng `toast` thay vì im lặng treo; (2) luôn chạy tiếp phần dọn màn
    hình bên dưới dù tải lỗi (không kẹt ở Journey nữa); (3) nếu Block đích
    rốt cuộc vẫn chưa có trong `S.blocks` (do bước trên lỗi), chốt cứng
    về `#screen-blocks` thay vì gọi `Detail.open` (vốn sẽ tự lặng lẽ
    không làm gì nếu không tìm thấy Block, để lại màn trắng). Đã verify
    lại bằng Playwright sau khi sửa: giả lập lỗi y hệt -> giờ ra đúng
    toast lỗi + về `#screen-blocks` gọn gàng, không còn kẹt tại Journey.
    File đổi: `js/app.js` (bump `?v=27` trong `index.html`).

- **Phiên 2026-09-12 — ĐÃ XONG (lên live, commit `733ea53`):**
  - Fix DB thiếu cột `words.freq` (chưa từng chạy migration thật) — đã khiến CẢ "+ Paste từ mới" LẪN "✨ Dán bài, tự trích từ" lỗi PGRST204 mỗi lần tạo từ mới.
  - "✨ Dán bài, tự trích từ" giờ tạo thêm 1 Block `full_<tên batch>` đứng đầu batch, chứa TOÀN BỘ từ đã trích + nguyên văn bài đọc (không giới hạn 10 từ như các Block thường).
  - `DB.loadNotebook` (Cloud mode): 5 lần gọi Supabase tuần tự -> 1 request duy nhất (lồng bảng qua FK) — đo thật giảm ~4s còn ~0.8s cho notebook 602 từ. Đây là điểm chậm rõ nhất khi mạng có độ trễ cao.
  - `Context.extractVocab`: prompt cải thiện — đọc từng câu, chủ động tìm phrasal verb/collocation/idiom (không chỉ từ đơn), đảm bảo không bỏ sót B1. Bỏ hẳn khoảng số lượng ước tính theo yêu cầu TJ ("có bao nhiêu thì lấy bấy nhiêu", đừng neo theo mốc nào).
  - Mới: `Context.splitChapters` + UI "📚 Dán cả sách (PDF)" trong modal extract — upload PDF (đọc bằng pdf.js CDN, PHẢI dùng cờ `hasEOL` để dựng lại đúng xuống dòng, nếu không không nhận diện được chapter nào), tự chia theo "Chapter X"/"Chương X", xem trước danh sách, xử lý hàng loạt (mỗi chapter → 1 batch riêng).
  - Bảng từ vựng + bài đọc tạo từ "Dán bài, tự trích từ"/"Dán cả sách" giờ CÓ hiện chi phí/nhà cung cấp (`vocab_fill_meta` + `meta.provider/cost_usd` trong `context_passage`) — trước đó `processArticleToBatch` không đọc `Context._lastProvider/_lastCostUsd` nên badge luôn trống dù AI có tốn tiền hay không.
  - `js/export.js` (Xuất PDF): sửa hộp thoại cảnh báo ">30 Block" đếm THẬT số từ thay vì giả định cứng 10 từ/block (sai lệch với Block `full_...` có thể 30-60+ từ) — đã verify bằng dữ liệu thật, xuất PDF hoạt động bình thường với Block `full_batch`.
  - `tools/manage_users.py`: tự mở Excel bằng đúng lệnh theo OS (Mac/Linux/Windows) thay vì chỉ `os.startfile` (Windows-only).
  - `tools/offline_sync.py` (mới, chưa dùng chính thức): pull/push snapshot 1 user giữa Supabase và bản offline (`TJHUB_OFFLINE`, không nằm trong git) — dựng lúc mạng quá chậm rồi TJ quyết định học online lại, tool vẫn giữ để dùng sau nếu cần.
  - "Thanh điều khiển nghe nổi (sticky player)" — giống mini-player "Listen to Page" của Safari, dùng chung cho CẢ bài đọc LẪN bảng từ vựng (2 chỗ có nút Nghe/Dừng riêng). Bố cục: nút Play tròn trái, tiêu đề + thanh tiến độ giữa, nút "🎤 nhảy tới karaoke" (cuộn thẳng tới đúng chữ/dòng đang sáng — `.kw.on` ở bài đọc, `tr.reading` ở bảng từ vựng) + nút Đóng bên phải.
    - **Điều kiện hiện đúng như TJ yêu cầu**: tự hiện ngay khi cuộn khỏi TẦM NHÌN CỦA HÀNG NÚT Nghe/Dừng (`.audio-toolbar`) — KHÔNG phải khi cả khối nội dung biến mất (bug bản đầu: bài dài cuộn tới giữa chừng, khối nội dung vẫn còn hiện 1 phần nên thanh không hiện dù nút Dừng đã khuất từ lâu — đã sửa bằng cách theo dõi đúng `.audio-toolbar` thay vì cả `#passage-content-block`).
    - `js/speech.js` thêm `S.pause()`/`S.resume()`/`S.getProgress()` (Web Speech API hỗ trợ sẵn pause/resume, không cắt utterance như stop() cũ), áp dụng cho CẢ `readPassage` (bài đọc) lẫn `speakList` (bảng từ vựng) — tiến độ/tổng thời gian là ƯỚC TÍNH (không có API trình duyệt nào trả về giây thật đã đọc), theo công thức ~14.5 ký tự/giây đã dùng ở `startFallbackTimer`.
    - **Đã tự test bằng Playwright (headless Chromium qua CLI, không cần chrome-devtools MCP)** — PASS cả 5 kịch bản: hiện đúng lúc cuộn khỏi hàng nút (kể cả bài dài cuộn giữa chừng), pause, resume, nhảy karaoke (🎤), đóng hẳn (✕). Chưa test tay trên Safari/điện thoại thật — pause/resume của Web Speech API từng có tiếng chập chờn tuỳ trình duyệt, nên vẫn nên thử qua 1 lần trên máy/điện thoại thật trước khi yên tâm hoàn toàn.
  - **Nút "▾ Thu gọn / ▸ Mở rộng" cho bài đọc** (`#btn-toggle-passage`) — y hệt nút đã có sẵn cho bảng từ vựng, đặt trước `#voice-select` trong `.audio-toolbar`. Bài đọc (đặc biệt Block "full_..." dán cả bài báo) có thể rất dài, thu gọn còn 22rem (~352px, có gradient mờ dần ở đáy) đỡ chiếm hết màn hình. Mặc định KHÔNG thu gọn (khác bảng từ vựng mặc định CÓ thu gọn) — bài đọc là nội dung chính cần đọc ngay. Dùng lại đúng 2 chuỗi dịch có sẵn trong `js/i18n.js` ("▾ Thu gọn"/"▸ Mở rộng") nên tự dịch English luôn, không cần thêm dòng DICT mới. Đã test Playwright: bấm thu gọn đúng còn 352px, mở lại đúng về full.


## 🔄 Bàn giao sang máy khác (2026-10-01)

**Làm tiếp ở máy mới:** `git pull` repo này. Python cần `requests` (`pip install requests openpyxl`). Mọi khóa đọc từ `js/config.js`, không cần file nào thêm.

**Link game (nội bộ gia đình)**
- Người chơi: `https://teoteo1081.github.io/W02-tj-wordloop-hub/game.html` (phòng `TJ`, link trần).
- Host (TJ): cùng link + `?u=<id hồ sơ TJ>` (id nằm ở `HOST_PROFILE_ID` trong `js/game.js`). Mở **1 lần** trên máy mới là máy đó nhớ TJ (localStorage `tjwl_link_user_id_v1`), và tự dùng lại người chơi "TJ" cũ. Đã gộp TJ#2/#3 vào TJ#1. `Anti_TJ` là nick thử của TJ, để nguyên.
- Test vai người chơi trên cùng máy: cửa sổ ẩn danh (chưa có tham số `?player=1`).

**Thay đổi game 2026-10-01 (v35–v37)**
- Tự sang câu sau ít giây (bỏ nút "Câu tiếp"); xem lại đáp án sau ván bằng "📖 Xem lại đáp án" (lưu tạm trên máy từng người, mất khi tải lại trang).
- Bỏ hẳn tùy chọn "không tính giờ"; luôn có giờ.
- Bỏ cờ trước câu hỏi (Windows vẽ cờ thành chữ "US"); `FLAG` trên Windows là EN/VI/ES/ZH.
- Phòng chờ: nút Lịch sử ngang hàng "Người chơi", cây chọn nhánh bung sẵn, ô chủ đề hiện đường dẫn Hub › … › Block.
- Khi sửa `game.js` / `game.css` nhớ tăng `?v=` trong `game.html` (Chrome giữ cache cũ).
- **v39 (2026-10-01, máy 2):** cây chủ đề dời sang **CỘT TRÁI** (`#g-side`, chỉ host, chỉ phòng chờ), 1 cây Hub › … › Block, nút nhỏ ☑ ✖ ⊞ ⊟ 🔄 trên đầu cột; **📌 ghim** (nhớ ở `tjwl_game_sidepin_v1`) = cột luôn mở, bỏ ghim = thu lại, bấm 📚 ở mép trái / "📚 Chọn chủ đề…" thì trượt ra; điện thoại (≤900px) luôn là ngăn kéo. **⋯ từng mục CHỈ để chọn**: Chọn cả nhánh / Chỉ chọn mục này / Bỏ chọn (cả nhánh) — sửa/dời/xoá vẫn làm bên WordLoop (TJ chốt).
- **WordLoop 2026-10-01 — tách/chuyển linh hoạt:** chuột phải / ⋯ ở **Section, Page, Batch, Block** đều có "📓 Chuyển thành Notebook…" (`App.promoteToNotebook(table,id,hubId)`: tạo Notebook gốc mới trong Hub chọn + các cấp trung gian CÙNG TÊN, rồi chỉ đổi cột cha của mục đó — nội dung + tiến trình giữ nguyên; `App.promoteSectionToNotebook` giờ gọi hàm này) và "📦 Chuyển tới … khác…" chọn nơi đến ở **mọi Hub** (`moveDestinations`: đọc `DB.getFullTree`, nhãn là đường dẫn đầy đủ; người không phải admin chỉ thấy Notebook đang mở mà mình được sửa). Hộp chọn (`askPick`) có ô 🔍 lọc khi > 12 lựa chọn (gõ nhiều chữ = phải khớp tất cả), bấm đúp = chọn. `DB.addBatch` mới. Đã test trên Hub tạm rồi xoá.
- **v46 (2026-10-01):** (1) Máy giữ người chơi KHÔNG gắn hồ sơ đang đăng nhập (vd xoá cache -> lỡ tạo "TJ#3" lúc chưa nhận ra TJ) -> `loadProfile` tự đổi về người chơi gắn hồ sơ (cũ nhất); hồ sơ chưa có ai thì gắn luôn người chơi đang dùng. (2) **👥 Quản lý người chơi** (nút cạnh 📜 trong phòng chờ, chỉ TJ host): bảng mọi `game_players` (hồ sơ WordLoop, số ván, ngày tạo, tên trùng có số tô vàng) + ✏️ Đổi tên · 🔀 Gộp vào… (`mergePlayer`: chuyển `game_results`/`game_answers`, ván trùng giữ kết quả của người được gộp vào, rồi xoá) · 🗑 Xoá. (3) Dữ liệu 2026-10-01: đã gộp TJ#2/#3 -> TJ, Anti_TJ#2/#3/#4 -> Anti_TJ (6 kết quả trùng ván bỏ), Anti_TJ#1 gắn lại hồ sơ Anti_TJ (trước gắn nhầm hồ sơ TJ). Mục "Chờ TJ đồng ý (2)(3)" trong CÒN DANG DỞ coi như xong.
- **v45 (2026-10-01):** Journey: dòng Block (cây + tab Tony Buzan) có nút tím "🎮 Chơi game →" (`data-act="game"` -> `GameLayer.openScope`, chỉ TJ). Game: điện thoại không còn viền cam "kẹt" ở ô đáp án câu sau (`.g-opt:hover` chỉ trong `@media (hover:hover)`, bỏ tap-highlight/focus, `lockAll` blur ô vừa bấm). WordLoop: `.nav-list > *{flex-shrink:0}` — Hub nhiều Notebook làm dòng cây co còn ~9px chồng chữ, giờ giữ 27px và cuộn.
- **v44 (2026-10-01):** (1) WordLoop: mỗi Block card có nút tím **"🎮 Chơi game →"** cuối hàng icon (`gameBtnHtml`, chỉ hồ sơ TJ) -> `GameLayer.openScope("blocks", id, title)`: game chưa mở thì tạo iframe `game.html?embed=1&scope=…`, đã mở thì `postMessage({type:"tjwl-game-scope"})` -> game đổi chủ đề tại chỗ (đang chơi dở thì báo). Chuột phải "🎮 Mở phòng game" cũng đi đường này (không mở tab mới nữa). (2) Game: **⏱ Tự tính tổng thời gian** (`st.auto`, mặc định bật): số câu × giây mỗi câu — số câu = số từ trong chủ đề sau lọc cấp độ (📄 Phiếu = tổng chỗ trống); Kahoot cộng `REVEAL_MS` (3,5 giây xem đáp án) mỗi câu; tối thiểu 30 giây; ô "Tổng thời gian" khoá lại, gợi ý ghi rõ phép tính. Bỏ tick = nhập phút tay như cũ.
- **v42 (2026-10-01):** (1) **🎚 Lọc cấp độ từ** trong phòng chờ (nút A1…C2 + "Chưa gắn", kèm số từ mỗi cấp; không chọn = tất cả) — theo cột `words.level`, nằm trong khoá kho từ (`scopeKey`) nên đổi cấp là tải lại kho. (2) **🔁 Hết ván đẩy chu kỳ Tony Buzan** (`srsAfterMatch`, chỉ TJ, chỉ khi TJ chơi): Block ĐANG trong chu kỳ + ĐÚNG HẠN (nới 1 tiếng như detail.js) + TJ trả lời ≥ 80% số từ THẬT của Block (`G.blockWordN`, không theo lọc cấp độ) + đúng ≥ 80% -> `cycle+1`, `next_review_at`, `review_history` thêm `{via:"game"}`. **v43:** Block CHƯA vào chu kỳ mà đạt đủ 2 điều kiện -> game BẮT ĐẦU chu kỳ (TJ yêu cầu): `passed=true`, lần 1, ôn sau 24 giờ, `hard_passed_at` nếu chưa có (upsert, chưa có dòng `block_progress` thì tạo); Block mới chỉ được nhắc "chưa đủ" khi đã làm ≥ 50% số từ. Màn kết quả (host) liệt kê Block đã đẩy / Block đến hạn nhưng chưa đủ. Test đã chặn ghi thật (route Playwright).
- **v41 (2026-10-01):** (1) Phòng chờ có ô **"Nguồn câu điền chỗ trống"** (`st.gapsrc`, chỉ hiện với 📝/🔀): 📚 Thư viện câu (mặc định — `game_gap_sentences` + AI soạn tại chỗ; thiếu < 4 câu thì tạm câu bài đọc ≤ 20 từ) · 📖 Câu trong bài đọc (MỌI bài: `context_passage` + các bài phụ `context_passage_candidates`, không giới hạn độ dài) · 🔀 Cả hai. (2) Câu AI host soạn tại chỗ + câu AI cũ chỉ nằm trong localStorage host -> **ghi vào `game_gap_sentences`** (`model = "gpt-4o-mini (game host)"`, upsert ignore-duplicates: từ đã có câu thì giữ câu cũ). Bảng vẫn 1 câu/word_id — muốn nhiều câu/từ (mỗi bài đọc, mỗi AI 1 câu) cần đổi khoá chính (PAT). (3) **⏳ Đến hạn ôn** ở đầu cột chủ đề (chỉ TJ): đọc `block_progress` của TJ (passed, cycle < 6, `next_review_at` <= bây giờ — cùng luật `SRS.state`) + nhóm "🗓 Sắp đến hạn (7 ngày)", tích từng Block hoặc "Chọn hết". Chỉ đọc, KHÔNG đẩy chu kỳ (game vẫn chỉ ghi `word_progress`).
- **v40 (2026-10-01):** chuột phải HOẶC ⋯ ở từng mục cây game: thêm "▸▸ Bung hết / ▾▾ Thu hết nhánh này" (chỉ mục có con); cột chủ đề có « thu nhỏ + kéo mép phải đổi độ rộng (180–520px, nhớ `tjwl_game_sidew_v1`, bấm đúp = 280px). WordLoop: chuột phải/⋯ tab Hub ĐANG MỞ có "Bung hết / Thu hết cây Notebook"; mọi lệnh bung/thu (cả 4 lệnh cũ cấp Notebook) giờ vẽ lại ngay thay vì `reloadCurrent()` tải lại cả cây từ DB (trước chậm vài giây, tưởng không ăn).
- **🎮 Game trong WordLoop (2026-10-01):** thẻ "🎮 Game" ngay sau "📖 Learning" trên thanh trên cùng (điện thoại: nút 🎮 ở thanh điều hướng dưới đáy), chỉ hồ sơ TJ. `js/gamelayer.js` mở `game.html?embed=1` trong iframe phủ dưới thanh trên cùng; iframe GIỮ SỐNG khi quay lại học (📖 Learning / Trang chủ / Journey / hub… đều đóng lớp game, không xoá). `?embed=1` chỉ ẩn logo game. Hub tab hẹp lại (padding .3rem .5rem, chữ .74rem) cho đủ chỗ.
  - ⚠ Điện thoại: `.topbar-right` không co (≈890px) nên CẢ TRANG WordLoop rộng hơn màn hình (layout viewport ~1000px, thanh điều hướng dưới đáy cũng dài theo). Lớp game đã tự né bằng `width:100vw`; gốc lỗi thanh trên cùng CHƯA sửa (chờ TJ quyết vì đụng bố cục mobile).
- **v38 (2026-10-01, máy 2):** cây "Chọn nhánh từ vựng" có ⊞ Mở rộng / ⊟ Thu gọn / 🔄 Tải lại cây. Cây + kho từ tự tải lại khi host quay lại tab game (`visibilitychange`, chỉ ở phòng chờ) → đổi cấu trúc / thêm từ bên WordLoop là game thấy, không cần F5; nhánh đang bung giữ nguyên, mục đã chọn bị xoá thì bỏ, đổi tên thì lấy tên mới.

**Câu điền chỗ trống soạn sẵn (đang dở)**
- Bảng Supabase `game_gap_sentences` (schema: `tools/game_gap_schema.sql`, đã chạy). Script `tools/gen_gap_sentences.py`: gpt-4o-mini qua `openai-proxy` soạn câu 8–14 từ kiểu TOEIC Part 5 + AI thứ 2 kiểm "chỉ 1 từ hợp" (câu bị bỏ sẽ được thử lại ở lần chạy sau).
- Nhóm theo (từ + loại từ + nghĩa): cùng nhóm = 1 câu; khác nghĩa/ngữ cảnh = câu mới; không câu nào trùng câu nào.
- Game đọc câu theo **từ** (không theo id) nên 1 từ nhiều nghĩa ra nhiều câu; thiếu thì host tự nhờ AI soạn tại chỗ như cũ.
- **Tiếp tục:** `cd tools && python gen_gap_sentences.py` (chạy lại được, bỏ qua nhóm đã có câu). Có thể lặp vài lần để vớt các từ bị bỏ. Xem tiến độ: đếm dòng `game_gap_sentences` trên Supabase.
- 82 dòng thử cũ lưu `term` ở dạng thô (có thể kèm ngoặc đơn) — từ có ngoặc có thể không khớp khi game tra; script mới lưu dạng đã bỏ ngoặc. Có thể xóa 82 dòng cũ rồi chạy lại nếu muốn đồng bộ.

**Bảo mật:** token Supabase (`sbp_…`) từng dùng để tạo bảng chỉ dùng tạm — TJ cần Revoke ở https://supabase.com/dashboard/account/tokens. Muốn chạy SQL lần sau thì xin token mới.

**Gợi ý việc tiếp:** thêm `?player=1` để test vai người chơi trong cùng trình duyệt; xem lại tốc độ chuyển câu (thời gian chờ mỗi dạng câu) sau khi chơi thật.
