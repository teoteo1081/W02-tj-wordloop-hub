# PLAN_BARRON600.md — thêm "600 Essential Words for the TOEIC" (Barron) vào WordLoop (lập 2026-10-24, cập nhật cùng ngày)

> Trạng thái: **KẾ HOẠCH, chưa làm gì ở Supabase/code.** Số liệu là quan sát ngày 2026-10-24, chưa kiểm đủ 50 bài. Mục "Quyết định đã chốt" là lời TJ; mục khác là đề xuất.

## 1. Tài liệu nguồn (`L07-toeic/Barron 600 TOEIC/`)

- `600-Essential-Words-For-The-TOEIC-Test.pdf`: 374 trang, **bản scan không có text** → OCR (tái dùng `tools/ets2023/ocr_pdf.py`, tesseract).
- `Bài dịch-600-Essential-Words-for-the-TOEIC.pdf`: 103 trang **có text**; mỗi Lesson 2 trang: 1 trang ghi chú từ vựng (nghĩa Việt) + 1 trang bảng đoạn **Words in Context Anh|Việt** (từ khoá in đậm/gạch chân). Trang 2–3 là lời giới thiệu của người làm file, bỏ qua. Hai cột có thể bị trộn khi trích → tách theo tọa độ.
- `600_tu_vung_toeic_co_dich_tieng_viet.pdf`: 17 trang có text (định nghĩa EN + nghĩa VI), hai cột tách rời → phải ghép/kiểm.
- Audio chỉ có `Track 1.wma`, `Track 12.wma` (mỗi Lesson 1 track ~3 phút, ~2,9 MB) → Listening để sau.

**Cấu trúc 1 Lesson** (Lesson 2 — Marketing): Words to Learn (12 từ, định nghĩa + 2 ví dụ) → Words in Context (đoạn văn 12 chỗ trống + word bank) → Word Families (~6 họ từ) → Word Practice: Listening Part 1–4, Reading Part 5 (6 câu), Part 6 (3 câu), có thể Part 7. Đáp án cuối sách (chưa xác nhận vị trí).

**Lưu ý:** word bank của Words in Context dùng **dạng biến thể**, không phải 12 từ gốc (Lesson 2: *compared, competes, consumers, persuaded…*) → đây là bài RIÊNG theo sách, không gán vào Block 12 từ.

## 2. Quyết định đã chốt (TJ, 2026-10-24)

1. Làm **Notebook từ vựng** trên Supabase trước, vào Notebook "Baron 600 Essential Words for the TOEIC" (Section "50 Lesson", TJ đã tạo sẵn, chưa có Page).
2. Mỗi Lesson = 1 Page, 3 Batch: (1) **1 Block 12 từ chủ chốt**; (2) **1 Block Word Family** chứa tất cả từ trong các họ từ; (3) **mọi từ CEFR B1 trở lên (gồm B1)** còn lại trong bài, chia **Block 10 từ**.
3. Chỉ lấy **từ vựng + bài tập chọn từ/word form + bài dịch** (Words in Context, Reading Part 5, Part 6). Listening Part 1–4 và Part 7 **để sau**.
4. Từ vựng sau khi tạo Notebook tự học/chơi theo cơ chế game sẵn có.
5. Làm **tab "Barron 600 TOEIC"** giống Hub thi TOEIC nhưng theo cấu trúc sách; chế độ **Full bài** hoặc **Từng câu**.
6. **Tiến độ:** mọi game từ vựng chơi trong tab đều ghi chu kỳ Tony Buzan. Cơ chế game hiện tại (`js/game.js` ~2664–2695) đã đẩy `block_progress` khi làm ≥80% từ của Block và đúng ≥80%, chỉ cho hồ sơ TJ (`HOST_PROFILE_ID`), chưa tới hạn thì không đẩy, "Ván thử" tắt ghi. Words in Context/Part 5/Part 6 không gắn Block → không ghi chu kỳ.
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
| 6 | Reading Part 7 | Sau | |

Tab Từ vựng giữ nguyên (Notebook → Page → Batch → Block).

**Dữ liệu:** Words in Context, Part 5, Part 6 lưu `test_items` (`exam='barron600'`, `passage` cho đoạn, `i18n` cho giải thích/dịch; word bank kèm bài, ví dụ dòng `[bank] a|b|c…` trong `passage` theo kiểu `[img]`/`[aud]`). Cần kiểm mã `part` cho Words in Context (cột là int 1–7; game coi `part ≤ 4` là Listening) — chọn mã riêng (vd 8) hoặc thêm cột loại bài (cần SQL, cần token TJ). Game hiện chỉ đọc `exam='toeic'` và đặt tên "ETS … · Test n" → tab cần code mới (bộ đề, tên "Lesson N", danh sách Part, chế độ Full cho Part 6/Words in Context).

**Từ B1+ (Batch 3):** nguồn gồm đoạn Words in Context, câu ví dụ, Part 5, Part 6 của bài; chấm CEFR bằng danh sách có sẵn trước, AI chỉ chấm từ không có trong danh sách (đánh dấu "AI chấm" để TJ rà). Mỗi từ cần `term, pos, ipa, def_en, level, freq, meaning_vi/zh/es` (+ `quiz_*` nếu pipeline dùng).

## 4. Các bước

- **G0 Kiểm kê (chỉ đọc):** OCR thử Lesson 1–3 + đáp án; trích thử bản dịch Lesson 1–3; kiểm `part`/game với Words in Context; kiểm game với Block 12 từ/Block họ từ lớn (`Context.gapSentences === 10`); chốt phương án dữ liệu. Cần token Supabase khi cần.
- **G1 Trích xuất** (script cục bộ, JSON trung gian ngoài repo, mỗi Lesson 1 file). Kiểm: đủ 50 bài × 12 từ, 12 chỗ trống, 6 câu Part 5, 3 câu Part 6, đáp án A–D hợp lệ.
- **G2 Bổ sung từ** (Gemini/Codex theo brief `tools/barron/AGENT_BRIEF.md`: JSON cố định, **không giữ khoá Supabase**, không commit nội dung sách; mỗi lô có checker).
- **G3 Mẫu Lesson 1–2:** ghi lên Supabase (báo TJ trước, backup bằng `export_vocab.py`), TJ duyệt rồi mới làm tiếp (`TEAM_PROCESS.md`).
- **G4 Nạp 48 Lesson còn lại + bài tập + QA độc lập** (đếm số, trùng, đáp án, Block rỗng; phòng `ZZ_QA_*`, bật Ván thử).
- **G5 Tab Barron 600 TOEIC:** nhánh `feat/barron600-tab` (tính năng mới là làn T đang hoãn — TJ cần cho ngoại lệ); bump `?v=N`; QA Playwright.

## 5. Ràng buộc

- **Bản quyền:** sách và file Bài dịch là tài liệu của người khác, repo public → nội dung câu/bài đọc/bản dịch chỉ ở Supabase, **không commit PDF/audio/nội dung** (như đề ETS).
- **Làn (`CLAUDE.md`):** nội dung (G0–G4) trên `content/barron600`; tab/code (G5) làn T.
- **Hạ tầng (2026-10-24):** Supabase DB 58 MB/500 MB, Storage 58 MB/1 GB sau dọn (xem `SUPABASE_STORAGE.md`) → dư rất nhiều cho từ vựng (~5–10 MB). Audio/ảnh Barron sau này lên **R2** (Worker `tj-game` hiện chỉ phát `/listening/*.mp3`; phát ảnh cần sửa `worker.js` regex + content-type và `upload_audio.py`; URL `[img] https://…` dùng được bất kỳ nguồn nào). Khoá ghi R2 (`~/.tj-secrets/kho.env`) chưa có trên máy này.
- **Chi phí (ước tính):** OCR 0; Gemini free (có thể chạm hạn mức ngày); ~450 câu Part 5/6 dịch 4 ngôn ngữ vài USD theo đơn giá ETS nếu dùng OpenAI.

## 6. Còn cần TJ

- Xác nhận "bài word form" = Part 5 + Part 6 và "bài chọn từ" = Words in Context.
- Từ B1+ lặp giữa các Lesson: giữ ở bài đầu (đề xuất) hay lặp lại? Lưu dạng gốc (đề xuất) hay dạng xuất hiện?
- Nguồn danh sách CEFR muốn dùng; chọn AI làm việc lặp (Codex hay AGY).
- Cho ngoại lệ làm tab ở nhánh `feat/…`; token Supabase (đọc/ghi) khi tới G0/G3; bộ audio đầy đủ nếu muốn Listening.
- Chơi tab Barron có ghi tiến độ cho người chơi khác ngoài hồ sơ TJ không (hiện chỉ TJ).
