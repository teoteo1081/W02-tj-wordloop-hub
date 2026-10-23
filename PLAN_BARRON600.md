# PLAN_BARRON600.md — thêm "600 Essential Words for the TOEIC" (Barron) vào WordLoop (lập 2026-10-24)

> Trạng thái: **KẾ HOẠCH, chưa làm gì, chưa được TJ duyệt từng bước.** Mọi số liệu dưới đây là quan sát ngày 2026-10-24, chưa kiểm đủ 50 bài.

## 1. Quan sát

**Tài liệu nguồn** (`L07-toeic/Barron 600 TOEIC/`)
- `600-Essential-Words-For-The-TOEIC-Test.pdf`: 374 trang, **bản scan không có text** → cần OCR (tái dùng `tools/ets2023/ocr_pdf.py`, tesseract).
- `600_tu_vung_toeic_co_dich_tieng_viet.pdf`: 17 trang có text (định nghĩa EN + nghĩa VI), hai cột nằm tách rời → phải ghép và kiểm.
- `Bài dịch-600-Essential-Words-for-the-TOEIC.pdf`: 103 trang có text; mới đọc trang 2 (mẹo làm bài, không phải bản dịch bài đọc) → chưa rõ dùng được không.
- `Audio/`: chỉ có `Track 1.wma`, `Track 12.wma` (sách có hơn 50 track).

**Cấu trúc 1 Lesson** (xem Lesson 2 — Marketing)
1. Words to Learn: 12 từ, mỗi từ có định nghĩa + 2 câu ví dụ.
2. Words in Context: đoạn văn 12 chỗ trống + khung từ.
3. Word Families: ~6 họ từ (verb/noun/adjective + câu ví dụ).
4. Word Practice: Listening Part 1–4 (có số Track CD), Reading Part 5 (6 câu), Part 6 (3 câu), có thể có Part 7.
5. Đáp án nằm cuối sách (chưa xác nhận vị trí).

**App**
- Notebook "Baron 600 Essential Words for the TOEIC" **đã có** trên tài khoản TJ (Section "50 Lesson", chưa có Page), **không có trong `data/starter.json`** → nằm trên Supabase.
- Hub thi dùng bảng `test_items` (`exam/test/part/num/stem/opts/answer/passage/i18n`, xem `tools/toeic_items.sql`); Part 5/6/7 + `passage` dùng chung được.
- Kiểu "Phiếu đầy đủ" (có word bank) và "Từng câu" đã có cho Block từ vựng → dùng lại cho Words in Context.

## 2. Thiết kế đề xuất

Giữ tab **Từ vựng** riêng, thêm tab bài tập, nối bằng số Lesson.

| Nơi | Nội dung |
|---|---|
| Tab Từ vựng → Notebook Baron 600 | 50 Page (mỗi Lesson 1 Page) |
| Tab mới "Barron 600" (nhóm TOEIC) | Bộ đề = Barron 600 · Đề = Lesson 1–50 · Part = loại bài |
| Nối | Page Lesson N có nút "Làm bài tập Lesson N" |

**Mỗi Page (Lesson)**

| Batch | Block |
|---|---|
| 1. Từ cốt lõi | 1 Block **12 từ** |
| 2. Word Family | 1 Block chứa **tất cả** từ trong các họ từ (~15–18 từ) |
| 3. Từ mới trong bài | chia Block **10 từ** (từ mới trong Context, Part 5/6/7, Listening; trừ 12 từ và họ từ) |

**Loại bài trong tab Barron 600:** Words in Context · Word Families · Listening Part 1–4 · Reading Part 5 · Part 6 · Part 7.
**Bài đọc (Part 6/7):** *full bài* (hiện cả bài, làm lần lượt các câu; chơi nhóm kiểu Kahoot chung 1 bài) hoặc *từng câu* (mỗi câu mang kèm bài đọc/đoạn liên quan).

## 3. Các bước

0. Kiểm kê (không ghi gì): OCR thử Lesson 1–3 + phần đáp án, xác nhận có Part 7, kiểm tesseract, đọc file "Bài dịch".
1. OCR + parse 50 bài → JSON tạm **ngoài repo**; kiểm 50×12 = 600 từ, đáp án khớp key.
2. Làm mẫu Lesson 1–2 cho TJ duyệt trước khi chạy hàng loạt (`TEAM_PROCESS.md`).
3. Nạp Notebook (50 Page / 3 loại Batch / Block); từ mới cần IPA, CEFR, pos, nghĩa vi/en/zh/es qua pipeline AI sẵn có (Gemini trước, `_vocab_common.py`, `backfill_meaning_*`).
4. Nạp bài tập vào `test_items` (`exam='barron600'`) + lời giải vi/en/zh/es; audio đổi sang mp3 → R2 (`tools/game-worker/upload_audio.py`).
5. Giao diện: thẻ "Barron 600", các kiểu Part, 2 chế độ đọc, nút nối Page ↔ Lesson; bump `?v=N`.
6. QA độc lập (Node + Playwright), rà số câu/đáp án/từ trùng/Block rỗng → mới đưa lên `main`.

Chi phí AI (ước tính, chưa đo): OCR miễn phí; ~1.500 câu × 4 ngôn ngữ ≈ vài USD theo đơn giá ETS; nghĩa từ mới dùng Gemini ≈ 0.

## 4. Ràng buộc và điểm cần TJ chốt

- **Supabase:** Notebook hiện có + nạp Page/Block/`test_items` đều ở Supabase → khi tới bước 0/3, **báo TJ cấp token** (TJ dặn 2026-10-24); báo trước mỗi lần ghi.
- **Bản quyền:** sách có bản quyền, repo public → nội dung câu/bài đọc chỉ để trên Supabase, **không commit PDF/audio/nội dung sách**, không đưa vào `starter.json`.
- **Làn làm việc (`CLAUDE.md`):** `main` chỉ nhận nội dung (làn N). Bước 1–4 làm trên `content/barron600`; bước 5 (thẻ mới, chế độ chơi) là tính năng (làn T, đang hoãn) → nhánh `feat/…` riêng hoặc TJ cho ngoại lệ.
- **Audio:** cần bộ track đầy đủ; nếu không, Listening không tiếng hoặc để sau.
- **Block 12 từ / Block họ từ lớn:** app mặc định 10 từ; kiểm game và bài điền chỗ trống có giả định đúng 10 (`Context.gapSentences === 10`) không.
- **Định nghĩa "từ mới":** loại những từ đã có trong Notebook khác, hay lấy mọi từ ngoài 12 từ và họ từ? Ra khoảng bao nhiêu từ/bài?
