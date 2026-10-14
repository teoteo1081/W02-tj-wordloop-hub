# R2_BUCKETS.md — 3 bucket Cloudflare R2, mỗi bucket một mục đích

Quy ước đặt tên: `tj-<mục đích>`. Chỉ dùng gói **Free** (10 GB lưu trữ, 1 triệu thao tác ghi/liệt kê và 10 triệu thao tác đọc mỗi tháng, băng thông ra miễn phí).

| Bucket | Mục đích | Chứa gì | Ai/cái gì truy cập | Giới hạn tự đặt |
|---|---|---|---|---|
| `tj-game` | **Chơi game** | `listening/TEST_<n>_LC.mp3` (âm thanh nghe TOEIC, ~18,6 MB/file) | Người chơi, qua Worker **`tj-game`** (CHỈ ĐỌC, công khai) | Bucket private; không r2.dev, không tên miền |
| `tj-shelf` | **Sách tham khảo** | Kệ sách của Bảng (PDF tham khảo) | Bảng trong game, qua Worker **`tj-shelf`** (đọc/ghi) | Worker chặn cứng 2 GB, 25 MB/file (`tools/shelf-worker/worker.js`) |
| `tj-source-staging` | **Sách để soạn bài** | File gốc (PDF/DOCX…) cho Agent soạn game | Chỉ Agent/máy TJ, qua khoá S3 (`~/.tj-secrets/kho.env`). **Người chơi không đụng tới** | Private hoàn toàn |

## Vì sao tách 3 bucket
- Quyền khác nhau: game công khai (đọc) ≠ kệ tham khảo (đọc/ghi qua Worker) ≠ nguồn soạn bài (riêng tư). Gộp một bucket thì lộ nhầm sách bản quyền.
- Dễ đo và dễ dọn: báo cáo hạ tầng (`infra_report.py`) hiện dung lượng và nguyên nhân tốn chỗ theo từng bucket.
- Hỏng/lạm dụng một nơi không kéo theo nơi khác.

## Vì sao luôn nằm trong gói Free (với `tj-game`)
1. Bucket private, chỉ Worker `tj-game` đọc được (binding `BUCKET`).
2. Worker gói Free **chặn cứng 100.000 request/ngày/tài khoản** (quá thì lỗi, không tính tiền) ⇒ tối đa ~3,1 triệu lượt đọc/tháng < 10 triệu mức miễn phí.
3. Worker chỉ GET/HEAD, không liệt kê ⇒ 0 thao tác ghi/liệt kê (Class A). Tên file chỉ khớp `^/listening/[A-Za-z0-9_.-]+\.mp3$`.
4. Dung lượng cố định (~400 MB trên tổng 10 GB dùng chung cả 3 bucket).
Lưu ý: R2 không có công tắc "ngừng khi hết free"; sự an toàn đến từ thiết kế trên + theo dõi bằng `infra_report.py` (sheet Tổng quan có dòng "Request hôm nay (mọi Worker)" so với 100.000, và "Storage R2" so với 10 GB). Chỉ khi nâng Workers lên gói Paid thì mức chặn cứng 100k/ngày mới mất.

## Việc cần làm khi thêm file
- Âm thanh đề mới: `tools/game-worker/upload_audio.py` (hoặc `deploy_test.py`/`deploy_lc2.py` tự gọi).
- Sách tham khảo: dùng kệ trong game (Worker `tj-shelf`).
- Sách soạn bài: qua khoá S3 vào `tj-source-staging`.
