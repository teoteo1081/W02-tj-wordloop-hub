# SUPABASE_STORAGE.md — cấu trúc kho file (bucket `toeic`) và việc dọn dẹp

> Kiểm kê ngày 2026-10-08. Gói Free: 1 GB. Trước dọn: 898 MB (260 file); sau dọn: 325,5 MB (245 file). Chỉ xem được bucket `toeic` bằng anon key; bucket `game-avatars` (ảnh đại diện game) có tồn tại nhưng chưa liệt kê được (cần PAT).

## Cấu trúc hiện tại
| Thư mục | Chứa gì | Ai dùng |
|---|---|---|
| `listening/TEST_<n>_LC.mp3` (10 file, ~19 MB mỗi file) | Audio đề Listening ETS 2024 (đã nén) | **game.js** (`tCue`, `apUrl`) — GIỮ |
| `listening/img/*.jpg` (110 file, 22 MB) | Ảnh Part 1 / hình đề | `test_items.passage` ("[img] url") — GIỮ, cả 110 đều được tham chiếu |
| `listening/TEST_<n>_LC.pdf`, `reading/TEST_<n>_RC.pdf` | PDF đề (nguồn OCR) | Chỉ công cụ `tools/toeic_ocr_*` — chưa dọn |
| `listening/script/`, `reading/script/` | PDF lời giải ETS 2024 | Chỉ công cụ OCR — ứng viên dọn (đã OCR vào DB) |
| `listening/Test_01..10.mp3` (~44 MB mỗi file) | Bản audio chưa nén | **Không code/DB nào tham chiếu** — ứng viên dọn |
| `lib/EA2025/Part I-II-III/` (87 file) | Sách gốc EA 2025 | Thư viện của Bảng (`GameLayer`/`game.js` `api.lib`) — GIỮ |
| `lib/Books, Communication, Data-Analyst, Digital-Marketing, Grammar, IELTS, Other, TOEIC/*` | Cây thư viện (hầu hết rỗng) | Bảng — GIỮ |

## Đã dọn 2026-10-08 (TJ tự xoá trên Dashboard, Claude kiểm lại)
19 file, ~572 MB, đã sao lưu về máy TJ: `C:\Users\User\Desktop\TJ\_backup_supabase\toeic\` (đã kiểm khớp dung lượng).
- `listening/Test_01.mp3` … `Test_10.mp3` (~439 MB)
- `listening/script/ETS2024_LC_giai_p001-100|p101-200|p201-296.pdf`, `listening/script/TRANSCRIPT_PART 3_TEST 1_ETS 2024.pdf`
- `reading/script/ETS2024_RC_giai_p001-100|p101-200|p201-208.pdf`
- `lib/DAP_AN_ETS_2024_LC.pdf` (trùng với `lib/TOEIC/Listening/DAP_AN_ETS_2024_LC.pdf`)
- `lib/_Trash/probe.tmp`

**Kết quả kiểm lại:** 260 → 245 file, 897,8 → 325,5 MB. Cả 19 file đã biến mất, không file nào khác bị xoá nhầm. Còn đủ: `TEST_n_LC.mp3` 10/10 (HTTP 200), `TEST_n_LC.pdf` 10/10, `TEST_n_RC.pdf` 10/10, `listening/img` 110/110, `lib/EA2025` 87/87, bản `lib/TOEIC/Listening/DAP_AN_ETS_2024_LC.pdf`.
**Còn sót:** `lib/_tmp/ZZ_QA_PROBE/probe_*.png` (file thử của agent QA, ~0 MB, xoá được).

## Danh sách dọn đợt 2 (TJ duyệt 2026-10-09, CHƯA xoá — xoá khi cần chỗ cho ETS 2023)
20 file PDF đề ETS 2024, ~66 MB: `reading/TEST_1_RC.pdf` … `TEST_10_RC.pdf` và `listening/TEST_1_LC.pdf` … `TEST_10_LC.pdf`. Chỉ công cụ OCR từng dùng; game đọc dữ liệu từ `test_items` (đủ 2.000 câu). **GIỮ** `listening/TEST_n_LC.mp3` (game phát). Đã sao lưu về máy TJ: `Desktop\TJ\_backup_supabase	oeiceading|listening\` (đã kiểm khớp dung lượng). TJ tự xoá trên Dashboard.

## Đề xuất lưu trữ cho các lớp
- **Sách AEF/Upper/AEF5/Business Result/Real Listening (~840 MB PDF)**: KHÔNG đưa lên Supabase (hết chỗ, file 60–270 MB, vượt 50 MB/file). Dùng Cloudflare R2 hoặc Backblaze B2 (10 GB free) hoặc Google Drive; đặt cùng cấu trúc `aef/aef3|upper|aef5|business-result|real-listening-4/`.
- **Digital Marketing**: `Downloads\digital marketing.pdf` (81 MB) vượt giới hạn 50 MB/file → nén hoặc để ngoài Supabase; đích: `lib/Digital-Marketing/`.
- **EA 2025**: 81 file Part I–III đã có đủ; 2 file ở Downloads (`EA 2025.pdf` 9 MB, `EA 2025 - Part I Individuals.pdf` 82 MB) chưa có.
- Bài do mình tạo (TuVung, Reading…) nằm trên GitHub (L02/L03/L04), không cần lên Supabase.
- Bản quyền: sách ETS/sách thương mại để bucket private, không commit vào repo.
