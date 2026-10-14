# Quy trình nạp 1 đề thi nghe–đọc vào WordLoop (đã dùng cho ETS 2023 Test 1–10)

> Mục tiêu: có file nguồn (PDF đề scan + audio + đáp án + sách chữa) → chạy **Python** là ra đủ câu hỏi, audio có mốc từng câu,
> ảnh, lời giải tiếng Việt, lời thoại có mốc thời gian, nạp lên Supabase. **Gần như không tốn token AI**: phần "hiểu chữ" giao cho
> Gemini qua `gemini-proxy` (miễn phí), phần còn lại là quy tắc/regex/Whisper. Mọi bước chạy tay được bằng lệnh bên dưới.
> Công cụ đặt trong `tools/ets2023/` (repo) và bản chạy thật ở `C:\Users\User\Desktop\TJ\_work\ets2023\` (dữ liệu bản quyền KHÔNG commit).

## 0. Chuẩn bị 1 lần
- Python 3.12 + `pip install pymupdf pillow opencv-python faster-whisper pyspellchecker boto3 numpy`; cài tesseract, ffmpeg (winget).
- Khoá: `SBPAT` / `SUPABASE_PAT` (PAT Supabase tạm, xin TJ mỗi lần, nhắc thu hồi). Gemini đi qua `gemini-proxy` (khoá anon công khai trong `js/config.js`);
  proxy có 2 khoá (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`), tự chuyển khoá phụ khi 429. Khoá cá nhân cất ở `~/.tj-secrets/`.
- Windows: luôn `set PYTHONUTF8=1` (nếu không `open()` ghi lỗi tiếng Việt).
- Nguồn đề (ngoài repo): `Desktop\TJ\_staging\ETS 2023\TEST N\{TEST N.pdf, Test NN AUDIO.mp3, dap-an-*.jpg}`, file lớn `ETS 2023 LC.pdf / RC.pdf`,
  sách chữa `Project\L07-toeic\2023\Chữa Listening|Reading test bản full.pdf`.

> **Bố cục thư mục làm việc:** copy `tools/ets2023/*` vào `Desktop\TJ\_work\ets2023\`; các file trong `tools/ets2023/book/` (finalize.py, lc_/rc_ extract+build, fixen.py, vnfix*.py, rc_upload_lib.py) vào `_work\ets2023ook\` (chạy `finalize.py` ở đó, `lc_raw.json` cũng nằm ở đó). Sách chữa: biến môi trường `ETS_BOOK_DIR`. Các script đọc `key_N.json` (đáp án chính thức, tự chép từ ảnh bằng `keys_data.py` — file dữ liệu này KHÔNG commit).
> Hướng dẫn kéo repo/làm ở máy khác: `HUONG_DAN_LAM_O_NHA.md`. Kế hoạch tổng: `PLAN_TONG.md`.

## 1. Thứ tự các bước cho đề N (mỗi bước chạy lại được)
| # | Việc | Lệnh | Ra file |
|---|------|------|---------|
| 1 | Nén audio + Whisper 2 lượt (chữ có mốc) + dò khoảng lặng | `./listen_prep.sh N` ; `ffmpeg -i audio/TEST_2023_NN_LC.mp3 -af silencedetect=noise=-33dB:d=0.35 -f null - 2> audio/sil_N.txt` | `audio/TEST_2023_NN_LC.mp3`, `t<N>_whisper(_w).json`, `sil_N.txt` |
| 2 | OCR trang đề (tesseract, cắt cột) | `ocr_pdf.py`, `assemble.py N` → thư mục `ocr/sN` ; `python prep_rc.py N` | `ocr/sN`, `rcp/tN` |
| 3 | Đáp án chính thức (chép từ ảnh, 20 hàng×5, assert đủ 100+100) | sửa `keys_data.py` rồi chạy | `key_N.json` |
| 4 | Reading Part 5/6/7 bằng Gemini (kiểm đủ câu, đủ 4 đáp án, đủ chỗ trống) | `./run_rc.sh N` rồi `python assemble_rc.py N` | `rc_N.json` |
| 5 | Listening Part 3–4 (câu hỏi/đáp án) bằng Gemini | `python gemini_lc34.py N` | `lc34_N.json` (+ nhóm có hình) |
| 6 | Ảnh Part 1 (6 ảnh) và đồ thị "Look at the graphic" (5 hình) | `crop_p1b.py <pdf> N <trang>` ; `python crop_graphics.py N` (chỗ OCR không bắt: `crop_manual_N.json`) | `img/T2023-N_q1..6.jpg`, `_g<nhóm>.jpg` |
| 7 | Mốc audio từng câu | `./cues_pipeline.sh N` (build_cues → fix_cues_gen → pad_cues_2 → check_q_cues --fix → snap_cues) | `cues_N.json` |
| 8 | Dựng + tự kiểm (0 vấn đề mới nạp) | `python build_test.py N` | `items_N.json`, `load_N.sql`, `report_N.txt` |
| 9 | Kiểm chéo đáp án | `verify_all.py N` (Reading vs sách), `verify_lc2.py N` (Part 3–4 bằng transcript sách), `verify_p2.py N` (Part 2) ; Part 1 xem ảnh | in ra số lệch |
| 10 | Tải audio+ảnh lên Storage, nạp `test_items` | `SBPAT=... python deploy_test.py N` | DB |
| 11 | Lời giải tiếng Việt (từ sách chữa) | `cd book; python lc_extract.py; python lc_build.py; python rc_extract.py; python rc_build.py` (1 lần cho cả bộ) rồi `SUPABASE_PAT=... python finalize.py N` | `explain/stem_vi/vocab` |
| 12 | Lời thoại có mốc từng lượt nói (`i18n.scr`) | `python build_scr.py N [--push]` | `scr_N.json` + DB |

## 2. Ý tưởng cốt lõi (để áp cho năm khác / dạng khác)
- **Tách việc "máy làm được" và "cần hiểu nghĩa"**: cắt/ghép/căn mốc = Python thuần; chỉ chữ OCR nhiễu → Gemini dựng JSON, **luôn kèm kiểm tra tự động**
  (đủ số câu, đủ 4 đáp án, đủ chỗ trống, đáp án khớp sách) và thử lại theo model/khoá khi 429/503.
- **Mốc audio theo KHOẢNG LẶNG thật** (`silencedetect`), không tin mốc chữ "Number" của Whisper (hay bị kéo dài qua khoảng nghỉ → cắt giữa
  "Go on to the next page"). Đầu câu = cuối khoảng lặng dài trước câu; cuối câu = đầu khoảng lặng ≥2.3s sau lời đọc cuối (`snap_cues.py`).
- **Mốc theo chữ câu hỏi**: `check_q_cues.py` tìm 3 chữ đầu/cuối của câu hỏi trong chữ Whisper để sửa đầu/cuối cụt hoặc dư.
- **Whisper bỏ sót đoạn nói** (VAD): nghe lại riêng đoạn đó không VAD (`whisper_slice.py`), `build_scr.py` tự làm khi độ phủ thấp.
- **Kiểm chéo đáp án** bằng nguồn thứ 2 (sách chữa + transcript + Gemini tự chọn đáp án) → phát hiện chép tay lệch hàng.
- **Căn chữ sách ↔ chữ Whisper** bằng `difflib` rồi sửa lỗi OCR của sách (chữ ngoài từ điển → chữ Whisper nghe được) → `build_scr.py`.
- Sách chữa có thể in **chữ bị đảo cố ý** (`vnfix2.py`, `fixen.py`) và **dính lẫn dữ liệu giữa các ô** (hội thoại nhóm 41 dính vào đáp án D câu 40) → luôn có đường dự phòng.

## 3. Bẫy đã gặp (đọc trước khi làm đề mới)
1. Gemini miễn phí hết hạn mức/ngày (429, reset 00:00 giờ Thái Bình Dương); chạy 2 tác vụ Gemini song song dễ 429. OpenAI proxy hết credit.
2. Whisper nghe "Number 30" thành "No. 30" / "13." / "And 62 through 64"; hoặc bỏ cả "Number N". `fix_cues_gen.py` xử lý.
3. OCR đọc sai số nhóm ("196-200" → "496-200"), mất tiêu đề nhóm (`gemini_p67.py` chuẩn hoá theo thứ tự liên tục).
4. Đồ thị nằm ở **đầu cột**, không có đường kẻ phía trên; viền bảng bị nhận nhầm là đường kẻ ngăn nhóm (`crop_graphics.py` có kiểm "ngay dưới đường kẻ có nội dung").
5. File PDF đề có thể **thiếu trang** (Test 9 thiếu 2 trang ảnh Part 1): lấy ảnh từ trang giải bên ngoài, đối chiếu câu mô tả + đáp án.
6. Chép đáp án từ ảnh bằng tay dễ lệch → luôn assert đủ 100/100 và kiểm chéo.
7. Anon key upload được lên bucket nhưng KHÔNG xoá được; PAT thì làm được mọi thứ (thu hồi sau).
8. `git`: thư mục W02 có thể đang ở nhánh khác (đã từng commit nhầm nhánh `feat/shelf-r2`) → kiểm `git status -sb` trước khi commit; dùng `git worktree` để đưa lên `main` nếu cần.

## 4. Trạng thái (2026-10-14)
ETS 2023 Test 1–10 đã nạp đủ 2.000 câu; lời giải VN 1998/2000 (thiếu T2 câu 30,31; T8 câu 79,94); `i18n.scr` dựng bằng `build_scr.py`.
