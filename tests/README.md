# tests/ — lưới an toàn A0

Phần của `ROADMAP_RESTRUCTURE.md` M0. Mục đích: có **bằng chứng về hành vi của bản baseline `e324beb`** để sau này chứng minh restructure và các thay đổi backend không làm hỏng bản `main` đóng băng (`SPEC_RESTRUCTURE.md` I2, I9; `TEST_REGRESSION_RESTRUCTURE.md` §5, §9.5).

Luật: chỉ thêm tệp trong thư mục này. Không sửa mã ứng dụng. Không gọi dịch vụ thật. Không để khoá, token, link `?u=` hay dữ liệu người dùng thật vào đây.

## M0.5a — baseline lời gọi tới Edge Function AI và Worker `tj-shelf`

Điều kiện để deploy B1/B2 (plan, luồng B). Hai nguồn bổ sung cho nhau:

| Tệp | Cách thu | Phủ |
|---|---|---|
| `fixtures/baseline-context-calls.json` | **Đã chạy** (Node, `fetch` giả) — sinh bởi `capture/capture_context_calls.js` | `Context._callGemini`, `_callOpenAI` (qua proxy), `lookupWord`, `_callProvider`; có/không `quotaCtx`; tên header, khoá body, `user_id`/`block_id`, có `signal` timeout |
| `fixtures/baseline-backend-calls.static.json` | **Đọc từ mã** (chưa chạy) | `cc.js`, ba điểm trong `game.js` (chấm câu, tra nghĩa, viết câu), `fetch-article` ở `app.js`, `turn-creds`, và 7 lời gọi kệ sách `tj-shelf` |

Kiểm hợp đồng tĩnh còn khớp mã baseline:

```
node tests/capture/verify_backend_fixture.js [thư_mục_baseline]   # mặc định ../wt-baseline-e324beb
node tests/capture/capture_context_calls.js  [thư_mục_baseline]   # sinh lại fixture đã chạy
```

Đã thử phản chứng: sửa một dòng trong bản sao `cc.js` thì verifier báo `LỆCH` và thoát mã 1.

## Giới hạn (phải nói thẳng)

- Các điểm gọi trong `game.js`, `cc.js`, `app.js`, `turn.js` nằm trong IIFE có DOM nên **chưa được chạy**; hợp đồng của chúng mới là *đọc mã* và được giữ khớp bằng anchor. M0.5 (Playwright) sẽ chuyển chúng sang "đã chạy".
- Fixture chỉ ghi **hình dạng** yêu cầu (tên khoá, tên header, kiểu giá trị), không ghi nội dung prompt đầy đủ và không ghi phản hồi thật của dịch vụ.
- Chưa có test BCK-*: bộ này mới là **đầu vào** của chúng. BCK-01/02/03 sẽ so yêu cầu của bản baseline với phản hồi của backend đã đổi.
- Chưa phủ REST/Storage/Realtime của Supabase (thuộc M0.5, sau khi có khung Playwright; cần TJ đồng ý cài gói).

## Phát hiện khi thu (đã ghi vào fixture)

- Mọi lời gọi `tj-shelf` **không mang header xác thực**; upload gửi `File` thô với `content-type` theo tệp. Phương án xác thực của B2 sẽ làm bản baseline mất quyền ghi/xoá (BCK-03).
- Ba điểm (CC dịch, chấm câu, tra nghĩa TOEIC) và `lookupWord` **cố ý** gửi `user_id:null, block_id:null`; `game.js` viết câu gửi `block_id:"game-gap"` kèm `user_id` hồ sơ.
- Có hai Edge Function ngoài hai proxy AI mà baseline đang gọi: `fetch-article` và `turn-creds`.
