# SUPABASE_STORAGE.md — cấu trúc kho file (bucket `toeic`) và việc dọn dẹp

> Kiểm kê ngày 2026-10-08. Gói Free: 1 GB. Trước dọn: 898 MB (260 file); sau dọn: 325,5 MB (245 file). Chỉ xem được bucket `toeic` bằng anon key; bucket `game-avatars` (ảnh đại diện game) có tồn tại nhưng chưa liệt kê được (cần PAT).

## Cấu trúc hiện tại
| Thư mục | Chứa gì | Ai dùng |
|---|---|---|
| ~~`listening/TEST_<n>_LC.mp3`~~ (20 file, ~18,6 MB mỗi file, 371 MB) | Audio đề Listening ETS 2024 + 2023 (đã nén) | ĐÃ CHUYỂN sang R2 `tj-game` (xem mục cuối); bản Supabase còn tạm làm dự phòng, TJ tự xoá sau khi thử |
| `listening/img/*.jpg` (110 file, 22 MB) | Ảnh Part 1 / hình đề | `test_items.passage` ("[img] url") — GIỮ, cả 110 đều được tham chiếu |
| `listening/TEST_<n>_LC.pdf`, `reading/TEST_<n>_RC.pdf` | PDF đề (nguồn OCR) | Chỉ công cụ `tools/toeic_ocr_*` — chưa dọn |
| `listening/script/`, `reading/script/` | PDF lời giải ETS 2024 | Chỉ công cụ OCR — ứng viên dọn (đã OCR vào DB) |
| `listening/Test_01..10.mp3` (~44 MB mỗi file) | Bản audio chưa nén | **Không code/DB nào tham chiếu** — ứng viên dọn |
| ~~`lib/EA2025/…`~~ | ĐÃ CHUYỂN sang kệ R2 (Worker `tj-shelf`), xoá khỏi Supabase 2026-10-14 | Kệ Bảng nay đọc từ R2 |
| `lib/_tmp/<mã phòng>/` | File người chơi chia sẻ tạm trên Bảng, tự xoá | Bảng (`api.lib`, đường `_tmp`) — GIỮ ở Supabase |

## Đã dọn 2026-10-08 (TJ tự xoá trên Dashboard, Claude kiểm lại)
19 file, ~572 MB, đã sao lưu về máy TJ: `C:\Users\User\Desktop\TJ\_backup_supabase\toeic\` (đã kiểm khớp dung lượng).
- `listening/Test_01.mp3` … `Test_10.mp3` (~439 MB)
- `listening/script/ETS2024_LC_giai_p001-100|p101-200|p201-296.pdf`, `listening/script/TRANSCRIPT_PART 3_TEST 1_ETS 2024.pdf`
- `reading/script/ETS2024_RC_giai_p001-100|p101-200|p201-208.pdf`
- `lib/DAP_AN_ETS_2024_LC.pdf` (trùng với `lib/TOEIC/Listening/DAP_AN_ETS_2024_LC.pdf`)
- `lib/_Trash/probe.tmp`

**Kết quả kiểm lại:** 260 → 245 file, 897,8 → 325,5 MB. Cả 19 file đã biến mất, không file nào khác bị xoá nhầm. Còn đủ: `TEST_n_LC.mp3` 10/10 (HTTP 200), `TEST_n_LC.pdf` 10/10, `TEST_n_RC.pdf` 10/10, `listening/img` 110/110, `lib/EA2025` 87/87, bản `lib/TOEIC/Listening/DAP_AN_ETS_2024_LC.pdf`.
**Còn sót:** `lib/_tmp/ZZ_QA_PROBE/probe_*.png` (file thử của agent QA, ~0 MB, xoá được).

## Dọn đợt 2 — ĐÃ XOÁ 2026-10-09 (TJ tự xoá, Claude kiểm lại: 245 → 225 file, 325,5 → 258,9 MB; không xoá nhầm gì, còn đủ TEST_n_LC.mp3 10/10, img 110/110, EA2025 87/87)
20 file PDF đề ETS 2024, ~66 MB: `reading/TEST_1_RC.pdf` … `TEST_10_RC.pdf` và `listening/TEST_1_LC.pdf` … `TEST_10_LC.pdf`. Chỉ công cụ OCR từng dùng; game đọc dữ liệu từ `test_items` (đủ 2.000 câu). **GIỮ** `listening/TEST_n_LC.mp3` (game phát). Đã sao lưu về máy TJ: `Desktop\TJ\_backup_supabase	oeiceading|listening\` (đã kiểm khớp dung lượng). TJ tự xoá trên Dashboard.

## Đề xuất lưu trữ cho các lớp
- **Sách AEF/Upper/AEF5/Business Result/Real Listening (~840 MB PDF)**: KHÔNG đưa lên Supabase (hết chỗ, file 60–270 MB, vượt 50 MB/file). Dùng Cloudflare R2 hoặc Backblaze B2 (10 GB free) hoặc Google Drive; đặt cùng cấu trúc `aef/aef3|upper|aef5|business-result|real-listening-4/`.
- **Digital Marketing**: `Downloads\digital marketing.pdf` (81 MB) vượt giới hạn 50 MB/file → nén hoặc để ngoài Supabase; đích: `lib/Digital-Marketing/`.
- **EA 2025**: 81 file Part I–III đã có đủ; 2 file ở Downloads (`EA 2025.pdf` 9 MB, `EA 2025 - Part I Individuals.pdf` 82 MB) chưa có.
- Bài do mình tạo (TuVung, Reading…) nằm trên GitHub (L02/L03/L04), không cần lên Supabase.
- Bản quyền: sách ETS/sách thương mại để bucket private, không commit vào repo.

## 2026-10-14 — kệ sách Bảng chuyển sang R2
- `lib/Books` (2 sách), `lib/EA2025` (82 PDF gốc + 5 bài Lessons) và `lib/TOEIC/Listening/DAP_AN_ETS_2024_LC.pdf` đã xoá khỏi Supabase (TJ tự xoá; bản gốc ở R2 `tj-source-staging`, bản kệ ở R2 `tj-shelf`).
- Kệ sách Bảng đọc từ Cloudflare Worker `tj-shelf` (mã: `tools/shelf-worker/worker.js`); chỉ `_tmp/` còn ở Supabase.
- Đo lại: Storage 378,2 MB / 1024 (230 file `toeic` + 2 avatar), Database 56,7 MB / 500. Bucket `source-docs` đã xoá.

## 2026-10-14 (2) — âm thanh nghe chuyển sang R2 `tj-game`
- **Vì sao:** 20 file mp3 = 371 MB = 93% Storage; mỗi lượt nghe tải ~18,6 MB nên 5 GB egress/tháng của Supabase Free chỉ đủ ~270 lượt. R2 không tính băng thông ra.
- **Chuyển gì:** CHỈ `listening/TEST_<n>_LC.mp3` (20 file, đã kiểm kích thước + md5 khớp bản Supabase). Ảnh `listening/img/*.jpg` (28 MB) GIỮ ở Supabase vì đường dẫn nằm sẵn trong dữ liệu `test_items.passage` (đổi phải sửa DB thật); `lib/_tmp` và `game-avatars` GIỮ vì ghi trực tiếp từ trình duyệt bằng khoá anon.
- **Game phát từ đâu:** `cfg.AUDIO_BASE` (js/config.js) = Worker `tj-game` → `GET /listening/TEST_<n>_LC.mp3` (Range/tua, 304, cache 7 ngày). Hàm dùng chung `audUrl()` trong js/game.js; xoá `AUDIO_BASE` thì game tự quay về đường Supabase cũ.
- **Nạp đề mới:** `tools/ets2023/deploy_test.py` / `deploy_lc2.py` gọi `tools/game-worker/upload_audio.py` (mp3 → R2); ảnh vẫn lên Supabase.
- **Xoá bản Supabase:** TJ tự xoá `listening/TEST_*_LC.mp3` trên Dashboard SAU KHI thử nghe trong game (xem `tools/game-worker/README.md`).
- Chi tiết 3 bucket R2 (game / sách tham khảo / sách soạn bài): `R2_BUCKETS.md`.

## 2026-10-24 — xoá bản mp3 trùng ở Supabase (TJ tự xoá, Claude kiểm lại)
- **Xoá:** 20 file `listening/TEST_*_LC.mp3` (TEST_1…10 và TEST_2023-1…10), ~371 MB. Bản phát nằm ở R2 `tj-game`.
- **Kiểm trước:** 20/20 file trên Worker `tj-game` đúng kích thước theo `W08-infra-report/infra-report/game_manifest.json`, đúng content-type audio, Range 206 hoạt động; `main` trên GitHub có `AUDIO_BASE` trỏ vào Worker.
- **Kiểm sau:** Storage 429,2 MB (379 file) → **58,1 MB (359 file)**; không còn `.mp3`; `listening/img` còn đủ 220 ảnh (tải thử 1 ảnh: 200 `image/jpeg`); `sw`, `sw-audio`, `lib` còn nguyên; R2 vẫn 20/20.
- **Lưu ý:** gọi Worker bằng script phải gửi `User-Agent`, không có thì Cloudflare trả 403 (trình duyệt luôn gửi nên người chơi không gặp).
- **Hết đường dự phòng Supabase:** nếu xoá `AUDIO_BASE` trong `js/config.js` thì game không còn nguồn mp3 dự phòng.
- Database cùng ngày: 58,1 MB / 500 MB (báo cáo `W08-infra-report`). Chưa đo R2/Cloudflare (thiếu `R2_SECRET_ACCESS_KEY`, mục Worker báo lỗi).
