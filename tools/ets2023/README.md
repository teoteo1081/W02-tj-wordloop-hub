# tools/ets2023 — nạp ETS 2023 vào test_items (Python)

Chạy trên Windows, cần: Python 3.13 (PyMuPDF, Pillow, OpenCV, pyspellchecker, boto3), tesseract, ffmpeg.
Đặt `SUPABASE_PAT=sbp_...` trong môi trường (không ghi vào file). Nguồn PDF có bản quyền: để ngoài repo (thư mục `ETS 2023/`).
Dữ liệu trung gian (đáp án, bản trích sách chữa) lưu ở bucket PRIVATE `source-docs/work/ets2023/` — tải về dùng, KHÔNG commit.

| File | Việc |
|---|---|
| `rc_extract.py`, `rc_build.py`, `lc_extract.py`, `lc_build.py` | trích lời giải tiếng Việt từ sách "Chữa chi tiết ETS 2023" (PyMuPDF find_tables) |
| `fixen.py`, `vnfix.py`, `vnfix2.py` | sửa chữ bị đảo trong sách (từ điển + kiểm âm tiết tiếng Việt, không đụng tên riêng) |
| `finalize.py <số đề...>` | ghép + nạp `explain`/`stem_vi`/`vocab`/`i18n.vi` vào `test_items` (cần câu hỏi đã có) |
| `setkeys.py` | lưu đáp án chính thức (chép từ ảnh) và đối chiếu với sách |
| `layout_ocr.py`, `prep_all.py` | dựng ảnh trang + OCR theo cột (có tiền xử lý OpenCV) |
| `p5_parse.py`, `rc_parse.py` | dựng câu hỏi Reading từ OCR (Part 6/7 cần LLM: dùng `gemini-proxy`) |

Trạng thái: xem HANDOFF.md mục "TOEIC ETS 2023".
