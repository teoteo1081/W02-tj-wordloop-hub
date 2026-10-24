# G0 — Kiểm kê Barron 600 (chỉ đọc, 2026-10-24)

Chỉ ghi SỐ LIỆU + cấu trúc, không có nội dung sách. Dữ liệu trung gian (ảnh, OCR) ở `D:\Python\Git\_work_barron600\` — ngoài mọi repo.

## Sách scan (374 trang)
- OCR bằng Windows OCR (en-US, qua `powershell.exe` 5.1 + WinRT; PowerShell 7 KHÔNG gọi được WinRT; máy không có tesseract). 374/374 trang có chữ. Chữ đọc khá sạch nhưng **cột bị trộn thứ tự, chỗ trống (blank) mất, vài ký tự sai** (ví dụ "l.c" thay "1. C") → mọi đáp án/câu hỏi phải đối chiếu ảnh trang gốc (đúng ràng buộc G1).
- **50 Lesson** (đủ), mỗi Lesson ~6 trang: Words to Learn · Words in Context · Word Families · Word Practice (Listening) · Reading Part 5 · Part 6 · Part 7. Trang đầu Lesson: 13, 19, 25, 31, 37, 45, 51, … 325.
- Mỗi Lesson có đủ Part 5, 6, 7 (50/50). Words in Context: OCR nhận 49/50 (1 trang cần kiểm ảnh).
- **Đáp án ở trang 333–336** ("Answer Key"), theo Lesson: Words in Context 1–12 + Word Practice 1–23 (+ "Word Review" mỗi 5 Lesson). Đánh số Word Practice: **Q1–9 Listening, Q10–15 = Part 5 (6 câu), Q16–18 = Part 6 (3 câu), Q19–23 = Part 7 (5 câu)** → khớp plan (6 + 3) và cho biết Part 7 = 5 câu/Lesson ≈ 250 câu.
- OCR bảng đáp án có lỗi (ví dụ "l.c", "15.8", Lesson 5 đánh nhầm 11–12 thành 21–22) → đáp án phải đọc lại từ ảnh.
- **Có sẵn Tapescript Listening** (phụ lục từ trang ~340) → Listening sau này có thể làm chữ mà không cần nghe audio.

## Nguồn khác (có chữ, không cần OCR)
- "Bài dịch…" (103 trang): ghi chú từ vựng + đoạn Words in Context bản Anh/Việt đầy đủ → dùng thay OCR cho Words in Context.
- "600_tu_vung…" (17 trang): định nghĩa EN + nghĩa VI (hai cột, cần ghép).

## Supabase (đọc bằng khoá anon)
- Notebook "Baron 600…" (`7c3db651-bc1e-4e7f-84a1-ea1748e0c27a`) + Section "50 Lesson" (`e4fcb998-67eb-4d60-a2c4-a881db95c037`) có sẵn, **chưa có Page**.
- `test_items` cột: id, exam, test, part, num, stem, stem_vi, opts, answer, tag, explain, passage, src, answer_src, created_at, i18n, vocab. `exam` hiện có `toeic`, `ea`; `part` int. Part 6: mỗi câu mang NGUYÊN đoạn văn trong `passage`.
- `words`: id, block_id, sort, term, level, pos, ipa, def_en, meaning_vi/zh/es, freq, quiz_*, audio, chunks. `blocks`: có `context_passage`, `vocab_fill_meta`, `ref_word_ids`.
- Game đọc cứng `exam='toeic'` ở nhiều chỗ (`game.js` ~1082, 3133, 3159, 3787, 3998, 4117) và `part <= 4` = Listening → tab Barron là **code mới** (G5); dữ liệu Barron lưu `exam='barron600'` thì KHÔNG ảnh hưởng game hiện tại.

## Đề xuất mã dữ liệu (chưa ghi gì)
`exam='barron600'`, `test` = số Lesson (chuỗi), `part` = 5/6/7 đúng sách, **Words in Context = part 8** (không cần SQL), `num` = số câu trong Word Practice (10–23) hoặc 1–12 cho Words in Context. Chưa kiểm ràng buộc unique của `test_items` (cần đọc schema qua PAT khi tới G3).
