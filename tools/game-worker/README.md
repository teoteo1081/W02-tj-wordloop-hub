# game-worker — phát âm thanh nghe TOEIC từ R2 (`tj-game`)

- `worker.js`: Worker **chỉ đọc** (GET/HEAD), phát `GET /listening/TEST_<n>_LC.mp3` có Range, 304, CORS. Binding `BUCKET` = bucket R2 `tj-game`.
- URL: `https://tj-game.tj-wordloop.workers.dev` (đặt trong `js/config.js` → `AUDIO_BASE`).
- `upload_audio.py`: tải mp3 mới lên bucket (triển khai tạm Worker có PUT với khoá ngẫu nhiên → PUT → triển khai lại bản chỉ-đọc → kiểm HEAD → ghi `manifest.json`).
- `manifest.json`: sổ các file đã chép (tên + kích thước + md5 lúc chép đợt đầu). `infra_report.py` đọc sổ này để liệt kê bucket `tj-game`.

## Triển khai lại Worker chỉ-đọc (khi sửa `worker.js`)
Dùng `CF_ACCOUNT_ID` + `CF_SHELF_TOKEN` (quyền Workers Scripts + R2) trong `~/.tj-secrets/kho.env`. Cách nhanh nhất: gọi `_deploy(acct, token, open("worker.js").read())` trong `upload_audio.py`, hoặc dán `worker.js` vào Cloudflare Dashboard → Workers → `tj-game` → Edit code (binding `BUCKET` → `tj-game` phải còn).

## Thử nhanh
```
curl -I https://tj-game.tj-wordloop.workers.dev/listening/TEST_1_LC.mp3            # 200, Content-Length 19521420
curl -s -o NUL -w "%{http_code}\n" -H "Range: bytes=0-999" https://tj-game.tj-wordloop.workers.dev/listening/TEST_1_LC.mp3   # 206
curl -s -o NUL -w "%{http_code}\n" -X PUT https://tj-game.tj-wordloop.workers.dev/listening/x.mp3                           # 405
```

## Sau khi thử nghe trong game thấy ổn
TJ tự xoá `listening/TEST_*_LC.mp3` ở Supabase Dashboard → Storage → `toeic` → `listening` (20 file mp3, ~371 MB). Ảnh `listening/img/` GIỮ.
Hạn dùng token `tj-shelf-worker` (Cloudflare): **20/10/2026** — gia hạn trước ngày đó nếu không muốn Worker/upload dừng.
