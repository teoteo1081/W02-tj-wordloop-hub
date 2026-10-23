# tests/ — lưới an toàn A0

## Cycle Node ngày 2026-10-22

Đã thực hiện cycle M0.2/M0.3/M0.7b tới điểm cần PO, kết quả **PARTIAL**. Chạy `node tests/a0/run.js` (exit 1 khi còn lỗi đặc tả hoặc pending). Bằng chứng, ma trận độ phủ và hướng dẫn tái lập ở [`a0/README.md`](a0/README.md); nguồn máy đọc ở `a0/cycle-report.json`, số liệu baseline ở `a0/metrics-baseline.json`. Đây là báo cáo quan sát, không phải golden/allowlist đã được PO duyệt. Không có thay đổi mã ứng dụng.

Phần của `ROADMAP_RESTRUCTURE.md` M0. Mục đích: có **bằng chứng về hành vi của bản baseline `e324beb`** để sau này chứng minh restructure và các thay đổi backend không làm hỏng bản `main` đóng băng (`SPEC_RESTRUCTURE.md` I2, I9; `TEST_REGRESSION_RESTRUCTURE.md` §5, §9.5).

Luật: chỉ thêm tệp trong thư mục này. Không sửa mã ứng dụng. Không gọi dịch vụ thật. Không để khoá, token, link `?u=` hay dữ liệu người dùng thật vào đây.

## M0.5a — baseline lời gọi tới Edge Function AI và Worker `tj-shelf`

Điều kiện để deploy B1/B2 (plan, luồng B). Hai nguồn bổ sung cho nhau:

| Tệp | Cách thu | Phủ |
|---|---|---|
| `fixtures/baseline-context-calls.json` | **Đã chạy** (Node, `fetch` giả) — sinh bởi `capture/capture_context_calls.js` | `Context._callGemini`, `_callOpenAI` (qua proxy), `lookupWord`, `_callProvider`; có/không `quotaCtx`; tên header, khoá body, `user_id`/`block_id`, có `signal` timeout |
| `fixtures/baseline-backend-calls.static.json` | **Đọc từ mã** (chưa chạy) | `cc.js`, ba điểm trong `game.js` (chấm câu, tra nghĩa, viết câu), `fetch-article` ở `app.js`, `turn-creds`, và 7 lời gọi kệ sách `tj-shelf` |

Lệnh (mặc định đọc `../wt-baseline-e324beb`):

```
node tests/capture/verify_backend_fixture.js [thư_mục_baseline]          # đối chiếu hợp đồng tĩnh với mã baseline
node tests/capture/capture_context_calls.js  [thư_mục_baseline]          # THU LẠI và SO với fixture đã commit (không ghi)
node tests/capture/capture_context_calls.js  [thư_mục_baseline] --write  # cập nhật fixture: chỉ trong PR riêng, TJ duyệt từng dòng khác
node tests/capture/selftest_capture_verify.js [thư_mục_baseline]         # phản chứng: hai công cụ trên phải THẤT BẠI khi hợp đồng bị đổi
```

Ràng buộc của công cụ (đã có phản chứng trong self-test, 65 ca):

- **Khoá baseline (`baseline.js`):** nguồn phải là đúng commit `e324beb54b29…`, cây tệp `9de0480570b1…`, `git status` sạch. Mã khác hoặc có sửa cục bộ → từ chối, không ghi gì. Fixture ghi `baseline.commit/tree` và băm của `js/context.js` theo hai cách **không phụ thuộc kiểu xuống dòng**: `git_blob` (SHA blob trong kho git, đọc từ git, không từ tệp làm việc) và `sha256_lf` (băm nội dung đã chuẩn hoá về LF). Windows CRLF và Linux LF cho cùng kết quả (self-test kiểm trực tiếp). Metadata lệch ghim → báo lỗi.
- **Verifier kiểm hợp đồng, không chỉ vị trí:** với mục `verification: contract`, nó phân tích lời gọi `fetch(...)` và kiểm method, tên header, khoá body (hoặc biểu thức body), biểu thức `model`/`user_id`/`block_id`, có `signal` hay không, và hẹn giờ huỷ (ms). Mục `position-only` (chỉ `SHELF-URL`, hàm dựng URL không có `fetch`) chỉ xác nhận *vị trí* và được in rõ là "không phải hợp đồng". Self-test làm hỏng từng thuộc tính trong bản sao (kể cả `block_id: "game-gap"` → `"WRONG-BLOCK"`) và kiểm verifier bắt đúng mục, không báo nhầm mục khác.
- **Capture đối chiếu kỳ vọng từng kịch bản** (đúng 1 yêu cầu, URL, method, header, khoá body, model, `user_id`, `block_id`, có `signal`). Kịch bản ném lỗi hoặc sai kỳ vọng → thoát mã 1 và **không ghi gì**; ghi bằng tệp tạm rồi đổi tên; mặc định chỉ *so* với fixture đã commit.
- Chế độ `unsafe` (không ghim) chỉ dành cho self-test và bị cấm ghi fixture.

## Giới hạn (phải nói thẳng)

- Các điểm gọi trong `game.js`, `cc.js`, `app.js`, `turn.js` nằm trong IIFE có DOM nên **chưa được chạy**; hợp đồng của chúng mới là *đọc mã* và được verifier đối chiếu với mã baseline bằng cách phân tích lời gọi (không chỉ tìm vị trí). M0.5 (Playwright) sẽ chuyển chúng sang "đã chạy".
- Fixture chỉ ghi **hình dạng** yêu cầu (tên khoá, tên header, kiểu giá trị), không ghi nội dung prompt đầy đủ và không ghi phản hồi thật của dịch vụ.
- Chưa có test BCK-*: bộ này mới là **đầu vào** của chúng. BCK-01/02/03 sẽ so yêu cầu của bản baseline với phản hồi của backend đã đổi.
- Chưa phủ REST/Storage/Realtime của Supabase (thuộc M0.5, sau khi có khung Playwright; cần TJ đồng ý cài gói).

## Phát hiện khi thu (đã ghi vào fixture)

- Mọi lời gọi `tj-shelf` **không mang header xác thực**; upload gửi `File` thô với `content-type` theo tệp. Phương án xác thực của B2 sẽ làm bản baseline mất quyền ghi/xoá (BCK-03).
- Ba điểm (CC dịch, chấm câu, tra nghĩa TOEIC) và `lookupWord` **cố ý** gửi `user_id:null, block_id:null`; `game.js` viết câu gửi `block_id:"game-gap"` kèm `user_id` hồ sơ.
- Có hai Edge Function ngoài hai proxy AI mà baseline đang gọi: `fetch-article` và `turn-creds`.

## Schema và danh sách hợp đồng bắt buộc

`verify_backend_fixture.js` kiểm cấu trúc fixture **trước** khi đối chiếu mã (`REQUIRED` trong file): đủ 13 ID, không trùng, không ID lạ; đúng `service`/`file`; mọi mục `contract` có `method`, `headerNames`, `signal` (boolean), `timeoutMs` (null hoặc số), `urlContains`; chỉ `SHELF-URL` được là `position-only`; tổng số hợp đồng được kiểm phải đúng 12. `calls: []`, hạ mức xác minh, thiếu/thừa ID đều làm verifier thất bại (14 ca trong self-test). Thêm hoặc bớt hợp đồng = sửa `REQUIRED` trong PR có TJ duyệt.
