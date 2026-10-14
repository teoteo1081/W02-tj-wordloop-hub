# NGUON_THAM_KHAO_SW_IELTS.md — nguồn tham khảo cho TOEIC Speaking/Writing và IELTS (khảo sát 2026-10-14)

> Mục đích: TJ muốn thêm thẻ "TOEIC S&W" và IELTS vào WordLoop (kế hoạch ở `PLAN_TONG.md` mục 4). File này ghi LINK nguồn, đã khảo sát được gì, lấy được gì bằng Python, và giới hạn bản quyền để máy/phiên khác hiểu ngay.
> **Nội dung các trang này có bản quyền của chủ trang.** Bản tải về chỉ để ở máy (`Desktop\TJ\_work\sw_research\pages\`), KHÔNG commit lên repo công khai. Trong game ưu tiên đề do AI sinh theo đúng dạng; trang web/sách chỉ làm bộ mẫu để hiệu chỉnh bộ chấm.

## 1. Nguồn đã khảo sát
| Nguồn | Nội dung | Kích thước chữ | Lấy bằng Python? |
|---|---|---|---|
| https://prepedu.com/vi/blog/de-thi-toeic-speaking-co-dap-an | **10 đề mẫu TOEIC Speaking + đáp án gợi ý** | ~65.000 ký tự ≈ 21.600 token, 58 ảnh | **Có — phần lớn là chữ** (cắt theo "Đề N" / "Câu N") |
| https://prepedu.com/vi/blog/de-thi-toeic-writing | **3 đề TOEIC Writing + đáp án** (Q1–5 ảnh, Q6–7 thư, Q8 bài luận), bảng tiêu chí chấm | ~20.400 ký tự ≈ 6.800 token, 48 ảnh | Chữ có; **Q1–5 nằm trong ảnh** (cần OCR/xem ảnh) |
| https://study4.com/posts/2774/tong-hop-de-thi-toeic-writing-co-dap-an/ | Tổng hợp đề TOEIC Writing có lời giải | ~19.000 ký tự ≈ 5.900 token, 48 ảnh | Chữ ít, nội dung chính ở ảnh |
| https://study4.com/posts/259/cau-truc-de-thi-ielts-chi-tiet-va-chuan-nhat-2023/ | Cấu trúc đề IELTS (Listening/Reading/Writing/Speaking, dạng câu, thời gian) | ~20.000 ký tự ≈ 6.300 token, 52 ảnh | Có (chữ) — đã dùng để đối chiếu thiết kế |
| https://prepedu.com/vi/blog/ielts-speaking-part-3-noisy-place (và `…-shopping-online-shopping`) | IELTS Speaking Part 3 theo chủ đề: câu hỏi + trả lời mẫu | ~12.000 ký tự ≈ 4.000 token/trang | Có (chữ) |
| https://prepedu.com/vi/ielts/test-practice (+ `ielts-writing-latest-real-tests-quarter-iv2025-306`, `ielts-speaking-forecast-quarter-iii2026-440`) | Trang liệt kê bộ đề IELTS: Writing = loại biểu đồ Task 1 + dạng bài Task 2; Speaking forecast = chủ đề + thẻ Part 2 | ~5.000 ký tự/trang | Chỉ **danh sách chủ đề/dạng bài** (nội dung đề chi tiết nằm sau đăng nhập/gói Pro → không lấy) |
| Sách NTV TOEIC Speaking/Writing (scan) | `Project\L07-toeic\SPEAKING & WRITING\` (PDF 292 + 104 + 202 trang, audio ~136 MB) | — | OCR (tesseract), bản quyền, không commit |

Các trang liên quan khác của prepedu (cấu trúc đề, thang điểm, từng Part): `/vi/blog/cau-truc-de-thi-toeic-speaking-and-writing`, `/vi/blog/thang-diem-toeic-writing`, `/vi/blog/toeic-writing-part-1`, `…part-2`, `…question-8-toeic-writing-part-3`, `/vi/blog/toeic-speaking-part-1-read-a-text-aloud`, `…-mo-ta-tranh-describe-a-picture-part-2`, `…part-3`, `…part-4`, `…question-11`, `/vi/blog/lo-trinh-toeic-speaking-and-writing`.

## 2. Trang Speaking prepedu — cấu trúc lấy được (đếm bằng Python)
- 10 đề mẫu × 5 dạng. Chữ theo từng dạng: Read a text aloud (**~20 đoạn đọc**), Describe a picture (ảnh ở dạng ảnh + đáp án chữ), Respond to questions (**30 câu hỏi** kèm tình huống), Respond using information (bảng thông tin — kiểm xem là chữ hay ảnh trước khi dựng), Express an opinion (**10 đề ý kiến**), mỗi dạng có "Đáp án gợi ý".
- **Lưu ý đánh số:** trang gọi "câu 3,4 = Describe a picture; câu 5,6,7 = Respond to questions; câu 8,9,10 = Respond using information; câu 11 = Express an opinion" — KHÔNG khớp chuẩn ETS (11 câu: Q1–2 đọc to; Q3 tả ảnh; Q4–6 trả lời; Q7–9 thông tin; Q10 giải pháp "Propose a solution"; Q11 ý kiến) và không thấy dạng Propose a solution. Đối chiếu với sách NTV trước khi dùng.
- Dùng được vào: kho đoạn đọc to cho shadowing (`js/readalong.js`), bộ câu hỏi Part 4–6, đề ý kiến Q11, **bộ mẫu để hiệu chỉnh bộ chấm Nói**.

## 3. Trang Writing prepedu
- 3 đề đầy đủ (Q1–5 tả ảnh có 2 từ gợi ý; Q6–7 trả lời yêu cầu bằng văn bản; Q8 bài luận) + đáp án + bảng tiêu chí (ngữ pháp, liên quan tranh; chất lượng và đa dạng câu, từ vựng, tổ chức ý). Chỉ 3 đề nên **dùng làm bộ mẫu hiệu chỉnh**, không đủ làm kho đề → đề Viết nên do AI sinh theo đúng dạng.

## 4. IELTS
- Cấu trúc đã xác nhận (study4): Listening 4 phần×10 câu/30 phút; Reading 3 bài/40 câu/60 phút; Writing 60 phút (Task 1 150 từ ≈ 20 phút chiếm 1/3 điểm, Task 2 250 từ ≈ 40 phút chiếm 2/3); Speaking 11–14 phút (Part 1 phỏng vấn, Part 2 thuyết trình theo thẻ gợi ý, Part 3 thảo luận). Academic và General khác ở Reading và Writing Task 1.
- Prepedu IELTS: bài blog Speaking Part 3 theo chủ đề có câu hỏi + trả lời mẫu (lấy được bằng Python); mục `test-practice` chỉ hé lộ **tên chủ đề/dạng bài** (rất hợp làm *ngân hàng chủ đề* cho AI sinh đề: Task 1 = loại biểu đồ, Task 2 = advantages/causes–solutions/discussion…, Speaking Part 2 = chủ đề thẻ gợi ý).

## 5. Bản quyền và quy tắc dùng
- `prepedu.com/robots.txt` ghi `Content-Signal: search=yes, ai-input=yes, ai-train=no` → **không dùng nội dung để huấn luyện mô hình**; chỉ đọc/tham khảo cho cá nhân. Không cào nhiều trang, không đăng lại.
- Quy tắc cho dự án: không commit nội dung tải về; nếu cần lưu đề mẫu cho game, để ở Supabase bảng riêng tư; nguồn chính của đề S&W/IELTS trong game là **đề AI sinh** + đề tự soạn.

## 6. Cách lấy tiếp (Python, gần như 0 token Claude)
```
python tools/sw-research/fetch_page.py <url> pages      # tải trang, in kích thước + mục lục + link liên quan
```
- Chữ sạch ra `pages/<slug>.txt`; tách theo "Đề N" / "Câu N" bằng regex để dựng JSON mẫu.
- Ảnh trong trang: tải về rồi OCR bằng tesseract (như quy trình ETS 2023, xem `tools/ets2023/QUY_TRINH_NAP_DE.md`), chỉ dùng Claude xem vài ảnh để kiểm.
- Dự trù: đọc cả trang bằng Claude ≈ 6–22 nghìn token (chữ) + ~1,5 nghìn mỗi ảnh; làm bằng Python ≈ 2–4 nghìn token cho mỗi nguồn (chạy + xem báo cáo).
