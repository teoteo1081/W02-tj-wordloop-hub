# PLAN_BARRON600.md — thêm "600 Essential Words for the TOEIC" (Barron) vào WordLoop (lập 2026-10-24, cập nhật cùng ngày)

> Đã audit commit 2161c2 và sửa theo audit (2026-10-24). Trạng thái: **KẾ HOẠCH, chưa làm gì ở Supabase/code.** Số liệu là quan sát ngày 2026-10-24, chưa kiểm đủ 50 bài. Mục "Quyết định đã chốt" là lời TJ; mục khác là đề xuất.

## 1. Tài liệu nguồn (`L07-toeic/Barron 600 TOEIC/`)

- `600-Essential-Words-For-The-TOEIC-Test.pdf`: 374 trang, **bản scan không có text** → OCR (tái dùng `tools/ets2023/ocr_pdf.py`, tesseract).
- `Bài dịch-600-Essential-Words-for-the-TOEIC.pdf`: 103 trang **có text**; mỗi Lesson 2 trang: 1 trang ghi chú từ vựng (nghĩa Việt) + 1 trang bảng đoạn **Words in Context Anh|Việt** (từ khoá in đậm/gạch chân). Trang 2–3 là lời giới thiệu của người làm file, bỏ qua. Hai cột có thể bị trộn khi trích → tách theo tọa độ.
- `600_tu_vung_toeic_co_dich_tieng_viet.pdf`: 17 trang có text (định nghĩa EN + nghĩa VI), hai cột tách rời → phải ghép/kiểm.
- Audio chỉ có `Track 1.wma`, `Track 12.wma` (mỗi Lesson 1 track ~3 phút, ~2,9 MB) → Listening để sau.

**Cấu trúc 1 Lesson** (Lesson 2 — Marketing): Words to Learn (12 từ, định nghĩa + 2 ví dụ) → Words in Context (đoạn văn 12 chỗ trống + word bank) → Word Families (~6 họ từ) → Word Practice: Listening Part 1–4, Reading Part 5 (6 câu), Part 6 (3 câu), có thể Part 7. Đáp án cuối sách (chưa xác nhận vị trí).

**Lưu ý:** word bank của Words in Context dùng **dạng biến thể**, không phải 12 từ gốc (Lesson 2: *compared, competes, consumers, persuaded…*) → đây là bài RIÊNG theo sách, không gán vào Block 12 từ.

## 2. Quyết định đã chốt (TJ, 2026-10-24)

1. Làm **Notebook từ vựng** trên Supabase trước, vào Notebook "Baron 600 Essential Words for the TOEIC" (Section "50 Lesson", TJ đã tạo sẵn, chưa có Page).
2. Mỗi Lesson = 1 Page, 3 Batch: (1) **1 Block 12 từ chủ chốt**; (2) **Word Family chia Block tối đa 10 từ** (Block cuối giữ số từ còn lại); (3) **mọi từ CEFR B1 trở lên (gồm B1)** còn lại trong bài, chia **Block tối đa 10 từ** (Block cuối giữ số từ còn lại); giữ từ B1+ lặp giữa các Lesson, mỗi Lesson có từ riêng để học theo bài.
3. Chỉ lấy **từ vựng + bài tập chọn từ/word form + bài dịch** (Words in Context, Reading Part 5, Part 6). Listening Part 1–4 để sau; **Part 7 TJ đã chốt đưa vào (2026-10-24), làm sau Part 5/6 trong cùng đợt**.
4. Từ vựng sau khi tạo Notebook tự học/chơi theo cơ chế game sẵn có.
5. Làm **tab "Barron 600 TOEIC"** giống Hub thi TOEIC nhưng theo cấu trúc sách; chế độ **Full bài** hoặc **Từng câu**.
6. **Tiến độ:** mọi game từ vựng chơi trong tab đều ghi chu kỳ Tony Buzan. Cơ chế game hiện tại (`js/game.js` ~2664–2695) đã đẩy `block_progress` khi làm ≥80% từ của Block và đúng ≥80%, ghi vào hồ sơ TJ (`HOST_PROFILE_ID`) — người chơi tên TJ hoặc Thảo trong phòng đều được ghi vào hồ sơ này (`progName`, `js/game.js:62`; TJ xác nhận cố ý 2026-10-24); chưa tới hạn thì không đẩy; "Ván thử" (`tjwl_game_trial_v1`, theo máy) tắt ghi. Words in Context/Part 5/Part 6 không gắn Block → không ghi chu kỳ.
7. Làm tiết kiệm token Claude: việc lặp (nghĩa vi/zh/es, ipa, def_en, gắn CEFR, rà OCR) giao Gemini/AGY/Codex theo brief; TJ cần Supabase thì **Claude báo TJ cấp token**, không tự làm.

## 3. Thiết kế

**Tab Barron 600 TOEIC** — cùng khung Hub thi: Bộ đề = Barron 600 · Đề = Lesson 1–50 (+ "Cả sách") · Phạm vi · Part (loại bài) · Kiểu chơi · Full/Từng câu.

| # | Loại bài | Giai đoạn này | Full / Từng câu |
|---|---|---|---|
| 1 | Từ vựng (12 từ, Word Family, từ mới B1+) | Có | Game từ vựng sẵn có, chọn Lesson + Batch |
| 2 | Words in Context | Có | Full: đoạn + word bank (như "Phiếu đầy đủ"); Từng câu: 4 đáp án từ chính word bank |
| 3 | Reading Part 5 | Có | Từng câu; Full = 6 câu liên tiếp |
| 4 | Reading Part 6 | Có | Full: cả đoạn 3 chỗ; Từng câu: từng chỗ |
| 5 | Listening Part 1–4 | Sau | cần audio/ảnh → R2 |
| 6 | Reading Part 7 | Có — TJ chốt 2026-10-24 (làm sau Part 5/6) | Cả bài đọc / Từng câu |

Tab Từ vựng giữ nguyên (Notebook → Page → Batch → Block).

**Dữ liệu:** Words in Context, Part 5, Part 6 lưu `test_items` (`exam='barron600'`, `passage` cho đoạn, `i18n` cho giải thích/dịch; word bank kèm bài, ví dụ dòng `[bank] a|b|c…` trong `passage` theo kiểu `[img]`/`[aud]`). Cần kiểm mã `part` cho Words in Context (cột là int 1–7; game coi `part ≤ 4` là Listening) — chọn mã riêng (vd 8) hoặc thêm cột loại bài (cần SQL, cần token TJ). Game hiện chỉ đọc `exam='toeic'` và đặt tên "ETS … · Test n" → tab cần code mới (bộ đề, tên "Lesson N", danh sách Part, chế độ Full cho Part 6/Words in Context).

**Từ B1+ (Batch 3):** nguồn gồm đoạn Words in Context, câu ví dụ, Part 5, Part 6 của bài; chấm CEFR bằng danh sách có sẵn trước, AI chỉ chấm từ không có trong danh sách (đánh dấu "AI chấm" để TJ rà). Mỗi từ cần `term, pos, ipa, def_en, level, freq, meaning_vi/zh/es` (+ `quiz_*` nếu pipeline dùng).

## 4. Các bước

- **G0 Kiểm kê (chỉ đọc):** OCR thử Lesson 1–3 + đáp án; trích thử bản dịch Lesson 1–3; kiểm `part`/game với Words in Context; kiểm game với Block 12 từ chính và Block tối đa 10 từ của Word Family/B1+ (`Context.gapSentences === 10`); chốt phương án dữ liệu. Cần token Supabase khi cần.
- **G1 Trích xuất** (script cục bộ, JSON trung gian trong khu material riêng tư, mỗi Lesson 1 file). Kiểm: đủ 50 bài × 12 từ, 12 chỗ trống, 6 câu Part 5, 3 câu Part 6; đáp án Part 5/6 thuộc A–D và từng đáp án phải khớp đáp án chính thức trong sách. Words in Context phải đối chiếu từng chỗ trống với đáp án chính thức, giữ đúng dạng từ trong word bank. Ghi nguồn kiểm chứng (Lesson, số câu/chỗ trống, trang đáp án) trong JSON trung gian trong khu material riêng tư; khi OCR mơ hồ phải kiểm trực tiếp ảnh trang gốc. **Chặn nhập Lesson ở G3/G4 nếu còn đáp án sai lệch hoặc chưa xác minh; không dùng việc đáp án thuộc A–D hay AI tự giải làm bằng chứng thay cho đối chiếu sách.**
- **G2 Bổ sung từ** (Gemini/Codex theo brief `tools/barron/AGENT_BRIEF.md` (đã soạn; checker `check_batch.js` viết ở G2): JSON cố định, **không giữ khoá Supabase**, không commit nội dung sách; mỗi lô có checker).
- **G3 Mẫu Lesson 1–2:** ghi lên Supabase (báo TJ trước, backup bằng `export_vocab.py`), TJ duyệt rồi mới làm tiếp (`TEAM_PROCESS.md`).
- **G4 Nạp 48 Lesson còn lại + bài tập + QA độc lập** (đếm số, trùng, đáp án, Block rỗng; phòng `ZZ_QA_*`, bật Ván thử).
- **G5 Tab Barron 600 TOEIC:** nhánh `feat/barron600-tab` (tính năng mới là làn T đang hoãn — TJ cần cho ngoại lệ); bump `?v=N`; QA Playwright.

## 5. Ràng buộc

- **Material nguồn (TJ chốt 2026-10-24):** hiện xử lý sách, bản dịch, OCR và JSON trung gian trên máy local; đưa dữ liệu đã xử lý lên online để chơi game. Giữ vị trí material hiện có; tổ chức lại thư mục Git/repo để sau, không coi đây là điều kiện chặn xử lý. Chưa copy/commit/upload material trong phiên chốt plan.
- **Làn (`CLAUDE.md`):** nội dung (G0–G4) trên `content/barron600`; tab/code (G5) làn T.
- **Hạ tầng (2026-10-24):** Supabase DB 58 MB/500 MB, Storage 58 MB/1 GB sau dọn (xem `SUPABASE_STORAGE.md`) → dư rất nhiều cho từ vựng (~5–10 MB). Audio/ảnh Barron sau này lên **R2** (Worker `tj-game` hiện chỉ phát `/listening/*.mp3`; phát ảnh cần sửa `worker.js` regex + content-type và `upload_audio.py`; URL `[img] https://…` dùng được bất kỳ nguồn nào). Khoá ghi R2 (`~/.tj-secrets/kho.env`) chưa có trên máy này.
- **Chi phí (ước tính):** OCR 0; Gemini free (có thể chạm hạn mức ngày); ~450 câu Part 5/6 dịch 4 ngôn ngữ vài USD theo đơn giá ETS nếu dùng OpenAI.

## 6. Còn cần TJ

- Xác nhận "bài word form" = Part 5 + Part 6 và "bài chọn từ" = Words in Context.
- Đã chốt giữ từ B1+ trùng giữa các Lesson. Còn chọn lưu dạng gốc (đề xuất) hay dạng xuất hiện.
- Nguồn danh sách CEFR muốn dùng; chọn AI làm việc lặp (Codex hay AGY).
- Cho ngoại lệ làm tab ở nhánh `feat/…`; token Supabase (đọc/ghi) khi tới G0/G3; bộ audio đầy đủ nếu muốn Listening.
- Đã chốt game từ vựng ghi tiến độ theo cơ chế hiện tại (hồ sơ TJ; người chơi tên TJ hoặc Thảo đều ghi vào đó, cố ý); không mở rộng đối tượng ghi tiến độ trong phạm vi này.
## 7. Tổng hợp phiên chốt ngày 2026-10-24

Các quyết định mới nhất dưới đây thay thế nội dung cũ nếu có mâu thuẫn:

### TJ đã chốt trực tiếp
- Batch 1: giữ 1 Block 12 từ chủ chốt như kế hoạch trước.
- Batch 2 Word Family: chia Block tối đa 10 từ; Block cuối ít hơn 10 giữ nguyên, không thêm từ để đủ số.
- Batch 3 từ bổ sung B1+: chia Block tối đa 10 từ; Block cuối ít hơn 10 giữ nguyên. Không loại từ chỉ vì đã có ở Lesson khác.
- Game từ vựng ghi theo cơ chế hiện tại cho TJ (ngưỡng, hạn ôn, Ván thử giữ như hiện tại).
- Hiện xử lý material trên máy local và đưa dữ liệu đã xử lý lên online để chơi game. Tổ chức lại thư mục Git/repo để sau; không mở việc tạo repo material hoặc di chuyển thư mục lúc này. Phân bổ Supabase/R2 bên dưới là phương án kỹ thuật đề xuất, chưa triển khai.

### Bản đầy đủ đang đề xuất, chưa gán thành quyết định của TJ
- TJ đã chốt (2026-10-24) bao gồm Reading Part 7 có trong sách cùng Words in Context, Part 5 và Part 6. Kiểm kê số bài/câu Part 7 thực tế, không áp số lượng giả định. Đối chiếu đáp án chính thức và giữ liên kết bài đọc–câu hỏi.
- Listening Part 1–4 để sau do bộ audio hiện mới ghi nhận Track 1 và 12; cần kiểm kê lại nguồn.
- Lưu từ gốc để học, giữ dạng xuất hiện ở câu/bài gốc. CEFR dùng nguồn tham chiếu có tên/phiên bản; AI đề xuất phần thiếu và đánh dấu cần rà.
- Kế hoạch cũ hoãn Part 7; bản đầy đủ hiện tại đề xuất đưa Part 7 vào, chờ TJ xác nhận rõ. Part 7 đã được TJ xác nhận 2026-10-24 (xem mục 2.3).

### Đề xuất lưu trữ phục vụ game
| Loại dữ liệu | Nơi lưu đề xuất | Cách dùng |
|---|---|---|
| Notebook, Page, Batch, Block, từ và nghĩa/IPA/CEFR | Supabase Database | Dùng cấu trúc từ vựng hiện có; giữ liên kết từ theo từng Lesson |
| Bài đọc, câu hỏi, lựa chọn, đáp án, bản dịch và giải thích | Supabase Database | Mở rộng mô hình `test_items` sau kiểm schema; giữ nhóm bài đọc cho Part 6/7 và word bank cho Words in Context |
| Tiến độ Block của TJ | Supabase theo cơ chế hiện tại | Game từ vựng dùng luồng ghi hiện có; không tạo hệ thống tiến độ thứ hai trên R2 |
| Audio và ảnh dùng trong game | R2 `tj-game` | Supabase lưu URL/key tham chiếu. Worker hiện chỉ phục vụ `/listening/*.mp3`; cần bổ sung đường dẫn/MIME cho ảnh và cấu trúc Barron trước khi dùng |
| PDF, bản dịch, audio gốc, OCR và JSON trung gian | Máy local, giữ vị trí hiện có | Phục vụ biên soạn và đối chiếu; tổ chức lại thư mục Git để sau |

Lý do: Supabase/Postgres phù hợp dữ liệu có quan hệ, truy vấn theo Lesson và cập nhật tiến độ; R2 phù hợp file nhị phân, tránh đưa audio/ảnh vào Database. Không cần thêm JSON runtime trên R2 khi nội dung chữ đã được quản lý trong Supabase.

Nguồn tư vấn kỹ thuật: https://supabase.com/docs/guides/database/overview và https://developers.cloudflare.com/r2/ ; đối chiếu kiến trúc repo ở `R2_BUCKETS.md`, `tools/game-worker/worker.js`. Chưa đo dung lượng hoặc quyền truy cập cloud trong phiên chốt này; số liệu phần 5 là quan sát lịch sử.

### Còn cần chốt để triển khai
1. ~~Part 7~~ đã chốt có; Listening vẫn làm sau (cần bộ audio đầy đủ).
2. Đã chốt xử lý local rồi đưa dữ liệu game lên online; việc tổ chức Git để sau. Khi bắt đầu G0 cần xác minh đường dẫn material thực tế trên máy.
3. Đồng ý phân bổ Supabase cho dữ liệu chữ/tiến độ, R2 cho audio/ảnh không?
4. Dạng từ gốc, nguồn CEFR và phạm vi bản dịch cần chốt ở mẫu Lesson 1–2; mẫu phải được duyệt trước khi làm hàng loạt.
5. Tab mới vẫn cần ngoại lệ làn T trước khi sửa code; cập nhật plan này không triển khai tab hay ghi cloud.

## 8. Tiến độ 2026-10-24 (nhánh `content/barron600`)

- **G0 xong** — xem `tools/barron/G0_KIEMKE.md`.
- **Danh sách 12 từ chủ chốt × 50 Lesson xong** (600 từ, 4 từ trùng giữa các Lesson được giữ theo quyết định của TJ). Lesson 39/41/43/44/45 bị OCR bỏ sót từ → đã bù bằng bản dịch PDF + bảng đáp án; Lesson 44/45 đã đối chiếu ảnh. 44 Lesson còn lại dựa vào OCR (chưa đối chiếu ảnh từng trang).
- **G2 (điền thông tin từ) xong cho 600 từ**: pos, IPA, `def_en` (tự viết), CEFR, freq, nghĩa vi/zh/es — qua `gemini-proxy`, `check_batch.js` báo 0 lỗi. Mức CEFR do AI chấm (`level_source` chưa gắn cờ riêng), TJ cần rà mẫu. Dữ liệu ở `D:\Python\Git\_work_barron600\json\vocab_LNN.json` (ngoài repo).
- **Chưa làm / chưa ghi Supabase**: Batch 2 (Word Family), Batch 3 (từ B1+ trong bài), Part 5/6/7 và Words in Context.
- **Về nội dung sách (Claude):** Claude KHÔNG chép nguyên văn câu hỏi/đoạn văn/đáp án của sách để đưa lên Supabase công khai (sách có bản quyền; repo, web và khoá anon đều công khai). Phần từ vựng không chép sách. Bài tập (Part 5/6/7, Words in Context) nếu làm trên Supabase công khai phải là bài VIẾT MỚI dùng đúng các từ của Lesson; nếu TJ muốn dùng nguyên văn sách thì để riêng tư (máy TJ, không đưa lên chỗ công khai) và do TJ tự quyết/thực hiện.

## 9. Quyết định 2026-10-24 (TJ chọn phương án 2): chỉ từ vựng lên Supabase, sách ở riêng tư

- **Lên Supabase công khai: CHỈ từ vựng** (Notebook → Page → Batch → Block, thông tin từ do AI/Claude tự viết). KHÔNG đưa câu hỏi, đoạn văn, bài dịch hay đáp án của sách lên Supabase/repo/web.
- **Bản sách giữ riêng tư trên máy TJ** (`D:\Python\Git\_work_barron600\` và thư mục material): ảnh, OCR, `key_rc.json` (đáp án Part 5/6/7, đã tách từ OCR, CHƯA đối chiếu ảnh). TJ tự dùng để đối chiếu/học; không commit.
- **Hệ quả cho các bước cũ:** bỏ G1 (trích Part 5/6/7, Words in Context), bỏ tab "Barron 600 TOEIC" (G5) vì game từ vựng sẵn có đã chơi được Notebook — **không cần ngoại lệ làn T nữa**. Part 7 và Listening không làm trên web. Nếu sau này muốn có bài tập: viết bài MỚI (không chép sách).
- **Còn lại:** Batch 2 (Word Family) và Batch 3 (từ B1+) chỉ lấy DANH SÁCH TỪ (không chép câu/đoạn); G3 ghi mẫu Lesson 1–2 lên Supabase sau khi TJ duyệt; G4 nạp 48 Lesson còn lại + QA.

## 10. Tiến độ 2026-10-25: đã nạp 50 Lesson lên Supabase (chỉ từ vựng)

- **Vị trí:** Section "50 Lesson" (id `e4fcb998-67eb-4d60-a2c4-a881db95c037`, Notebook `7c3db651-bc1e-4e7f-84a1-ea1748e0c27a`). Mỗi Lesson = 1 Page, 3 Batch: "Từ chủ chốt (12 từ)" (1 Block), "Word Family" và "Từ B1+ trong bài" (Block tối đa 10 từ, Block cuối giữ phần dư).
- **Số liệu sau khi đọc lại từ Supabase:** 50 Page, 150 Batch, 283 Block (`global_index` 9543–9825, không trùng), 2.330 từ (600 chủ chốt + Word Family + B1+, sau khi xoá từ rác). Từ B1+ lặp giữa các Lesson được giữ theo quyết định cũ; cùng term + pos dùng chung một bản ghi (IPA, CEFR, nghĩa giống nhau ở mọi bài).
- **Nguồn:** danh sách từ lấy từ trang từng Lesson (chỉ lấy TỪ, không chép câu/đoạn/đáp án/bài dịch của sách); toàn bộ thông tin từ (pos, IPA, `def_en`, CEFR, nghĩa vi/zh/es) do AI tự viết qua `gemini-proxy`. CEFR do AI gán, chưa có danh sách chuẩn đối chiếu.
- **QA độc lập 2 lượt (agent chỉ đọc):** lượt 1 trên 600 từ chủ chốt (sửa 4 từ OCR theo ảnh trang, ~46 lỗi nghĩa, IPA, CEFR, định dạng); lượt 1 và 2 trên Word Family + B1+ (xoá 59 từ rác, ~1.700 dòng sửa nghĩa/IPA/định nghĩa, thống nhất bản ghi chuẩn cho từ lặp). Kiểm tự động cuối trên dữ liệu đọc thẳng Supabase: 0 lỗi định dạng, 0 nhóm term+pos không nhất quán.
- **Còn mở:** (1) lỗi mức thấp về văn phong định nghĩa và dấu câu trong nghĩa; (2) CEFR cần TJ rà mẫu; (3) đã đối chiếu ảnh trang của 48 Lesson (Lesson 44/45 đối chiếu trước đó): 600 từ chủ chốt khớp ảnh, không phát hiện thêm từ sai; ghi chú: sách in `sytematically` ở Lesson 29, dữ liệu dùng `systematically`. Đã xoá thêm 16 từ do QA lượt 2 đề nghị (`courier`/`deadline`/`owe`/`penalty` trùng từ chủ chốt cùng bài; `memorial`, `basement`, `judicial`, `material`, `materialize`, `suitor`, `skilful`, `wrinkly`, `outdate`, `conduce`, `yielding`, `diagnostician` không đúng họ từ/quá hiếm) theo TJ duyệt — tổng còn **2.330 từ**, 0 Block rỗng.
- **Rollback:** chỉ INSERT dòng mới; xoá theo id trong các file kế hoạch ở `D:\Python\Git\_work_barron600\json\` (`g3_plan_L1_2.json`, `g5_plan_all.json`); các dòng đã xoá được lưu ở `backup_deleted_words*.json` (ngoài repo).
- **Không thuộc phần này:** bài dịch/đối chiếu song ngữ phần review đáp án do Codex phụ trách trên nhánh riêng; mục này không đụng tới.
- **Token:** TJ quyết định chưa thu hồi Supabase PAT và token Cloudflare (nhớ thu hồi PAT tạm khi xong hẳn).
