# A0 — checkpoint Node 2026-10-22

**Execution: PARTIAL.** Cycle đã chạy theo PLAN §0.1 / SPEC §1.1 và dừng ở quyết định PO; chưa qua cổng M0. Không sửa ứng dụng, merge, push, cài gói hay gọi backend thật. Các test dùng dữ liệu giả trong VM, fetch bị chặn mặc định, đồng hồ/random cố định. Nhận giọng và Supabase thiếu cột đều là stub, không kết nối dịch vụ.

Baseline ghim `e324beb54b29ddfa055956c756a4ceba2676dfa1`, tree `9de0480570b1c95c85912d685626891ba142b825`, worktree sạch. Đầu nhánh trước cycle `a0e08ac6d9721d95e692fd723658e5cb98e9915a`. Báo cáo ghi SHA nguồn trước commit checkpoint; mã nạp thực tế có hash LF riêng. Commit chứa file này là checkpoint kết quả, xem `git log --oneline -- tests/a0/README.md`.

## Chạy lại

Từ worktree restructure, với Node/Git đã có sẵn:

```powershell
node tests/a0/run.js                    # chỉ đọc; expected exit 1 tại checkpoint này
node tests/a0/unit.js                   # baseline; expected exit 1 do CTX-09
node tests/a0/unit.js .                 # current; expected exit 1 do CTX-09
node tests/a0/selftest.js               # 6 phản chứng; exit 0
node tests/a0/measure.js                # baseline đã ghim, JSON stdout
node tests/a0/measure.js . --current    # snapshot tĩnh nhánh hiện tại
node tests/a0/static.js                 # baseline; exit 1 do pending
node tests/a0/static.js . --current      # current; exit 1 do pending
```

Chỉ `node tests/a0/run.js --write-report` mới ghi lại hai báo cáo quan sát trong thư mục này; không ghi baseline hay fixture `tests/fixtures/`. Runner kiểm pin baseline và ancestry HEAD, so hash sáu module nạp và diff toàn bộ tracked file ngoài tài liệu/tests so với baseline. Lỗi assertion/pending không bị chuyển thành pass; report không phải allowlist hoặc chuẩn mới đã duyệt. STA-01 dùng `git ls-files`: file JS mới cần được stage/commit để thuộc tập tracked được kiểm.

## Kết quả

| Nhóm | Baseline | Nhánh hiện tại |
|---|---|---|
| Unit/scenario Node | 54 PASS / 1 FAIL | 54 PASS / 1 FAIL, kết quả khớp baseline |
| Kiểm tĩnh STA-01..08 | 6 PASS / 0 FAIL / 2 pending | như baseline, không issue mới |
| Phản chứng mới | 6/6 PASS (đối chứng xanh, mutant bị bắt) | mutate chuỗi mã baseline trong RAM, không sửa nguồn |
| Bộ capture cũ | 12 hợp đồng + 1 vị trí khớp; 6 capture khớp; self-test 65/65 | chạy lại ba công cụ, tất cả exit 0 |

`cycle-report.json` chứa từng kết quả, hash, trace storage, ma trận khoảng trống và stdout bộ capture cũ. `metrics-baseline.json` chứa vị trí từng candidate, cách đếm và SHA nguồn. Hai báo cáo không chứa prompt/dữ liệu người dùng thật, credential hay link hồ sơ thật.

## Độ phủ và giới hạn

| ID | Bằng chứng và phần còn thiếu |
|---|---|
| CTX-01..04,06..08 | Cụm dài, đoạn cuối thiếu dấu, đủ 10 gap, giới hạn chữ viết tắt; meta roundtrip, bản dịch và chia văn bản giữ nội dung theo ngưỡng |
| CTX-05 | Ba cờ đơn hợp lệ đọc lại được; chưa kiểm metadata có cờ xung đột |
| CTX-09 | Người thường Gemini trước/fallback đạt; case TJ đỏ vì OpenAI trước, cần PO chốt ngoại lệ |
| CTX-10,11 | Timeout 25.000 ms huỷ và dọn timer; quota_user không lách provider ở nhánh Gemini-first |
| CTX-12 | Lookup runtime gửi quota null; game/CC mới được kiểm hợp đồng tĩnh trong M0.5a |
| CTX-13 | Gọi public `Detail.generatePassage` khi thiếu key và khi AI ném lỗi: bài vẫn rỗng, không gọi stock generator hoặc save; DOM paint được stub nên không chứng minh layout |
| CTX-14 | Chưa triển khai ca nightly về prompt/random/title |
| CTX-15 | Truyền quota nguyên vẹn trong extract và enrich 26 từ/2 batch; orchestration nhiều chương ở app chưa chạy |
| SRS-01, UTL-01,02 | Toàn bộ bước chờ/nhóm, advance/demote, trạng thái học, normalize kể cả khoảng trắng còn lại, escape/NFC |
| RA-01 | `_align`: đúng/sai/bỏ sót/từ thừa/tolerance; `toggle` với SpeechRecognition giả kiểm lifecycle, thẻ kết quả và broadcast phần trăm, không phạt từ chưa đọc. Chưa có micro/trình duyệt thật |
| DB-01,02 | Giữ parent ở mọi tầng và cập nhật nội dung; tombstone không hồi sinh |
| DB-03,04 | Copy mọi cấp, scope null/__ALL__/user, ánh xạ ID/tiến trình và ảnh chụp độc lập; import thay thế/export/reload |
| DB-05,06 | Bookmark mặc định/false, wrong-context và clear đúng lại, missing-column fallback. DB-06 chưa phủ blank filtering ở UI; giữ trường mastered cũ nhưng chưa assert đầy đủ mọi trường attempts/correct sau fallback |
| DB-07 | Context nguyên câu/4 đáp án, `Detail.pushFixResult` giữ sai khác loại/ngôn ngữ; chưa chạy WordSet.saveAnswer qua UI |
| DB-08,09 | Journey dedupe/blank, dup_ids trong bookmark/Fix; Ôn riêng idempotent, 10 từ/block, giữ bài đọc, lấp block cuối, ổn định block cũ, xoá block rỗng và chặn cloud chưa đăng nhập |
| LS-01 | Runtime trace khóa/thao tác/hình dạng cuối của các scenario giả Node; chưa phải golden cho mọi UI hay đủ 16 file |
| STA-01..08 | Có công cụ chạy; ngoại lệ/pending công khai bên dưới. STA-09/10 từ M2; STA-11 chưa kiểm entry point của mọi module |
| M0.4..08 | Chưa có ảnh/browser/multiplayer golden; CI tích hợp còn G2; không suy ra thành hoàn tất A0 |

Phản chứng kiểm 6 lỗi: đảo thứ tự đánh dấu cụm dài; bỏ lowercase; sai chu kỳ 24 giờ; bỏ tombstone; bỏ dung sai đọc; bỏ quota guard. Mỗi mutation có đối chứng xanh riêng và phải làm ít nhất một assertion đỏ, không lấy lỗi sẵn có CTX-09 làm bằng chứng.

## Số liệu M0.2

`game.js` 5.598 dòng/523.111 byte LF; `app.js` 5.290 dòng; `detail.js` 3.292 dòng. Tổng script cục bộ tracked hiện hữu trong index: 983.647 byte LF, `keys.local.js` không có (untracked/ignored), chưa phải dung lượng mạng nén. Có 7 candidate định nghĩa esc, 16 file nhắc localStorage nhưng chỉ 15 có candidate thao tác; `learn.js` chỉ nhắc trong comment.

Regex thấy 182 candidate `.from/rpc/channel/removeChannel` (game121, db53, auth6, app2), 51 candidate global assignment/47 tên, cùng tham chiếu module và App gọi ngược. Đây là inventory vị trí để review: có comment, string và alias `w` cục bộ, không phải số global/call graph đã được AST xác nhận. Đồ thị biến closure đầy đủ, số liệu browser và nhật ký storage của mọi flow vẫn thiếu; M0.2 là PARTIAL.

## Điểm dừng PO

1. **Thứ tự AI cho TJ (CTX-09):** mã baseline có ngoại lệ TJ dùng OpenAI trước, trong khi đặc tả nói Gemini trước. Đề xuất giữ hành vi baseline và bổ sung ngoại lệ vào spec/test sau PO xác nhận; nếu muốn đổi hành vi, cần bước sửa riêng ngoài cycle giữ nguyên hành vi. Chưa sửa kỳ vọng đỏ.
2. **Version baseline (STA-03):** 5 tài nguyên đã liệt kê trong TEST §3.3: manifest, 3 tham chiếu icon và config ở learn/sw. Cần duyệt danh sách ngoại lệ, hoặc cho phép bước sửa app riêng. Cycle chưa tạo allowlist và chưa tự miễn các mục này.
3. **Tiếp tục browser:** quyền cài Playwright theo anchor; G2 `handoff/gate` cần chốt trước CI. Lệch main +2 commit vẫn chờ quyết định tích hợp cuối, không tự lấy commit.

STA-07 còn 2 candidate quét rộng (`.menu-sub` và `.admin-new-link code` trong app.css). Đọc selector cho thấy chúng ở menu/admin, chưa có bằng chứng lỗi typography vùng đọc/từ vựng. Công cụ thận trọng giữ pending để hoàn thiện kiểm scope; đây là việc kỹ thuật, không yêu cầu PO chọn CSS và không phải ngoại lệ tự duyệt.

`Context.generate()` legacy vẫn còn mã sinh mẫu nhưng tìm caller trong app JS không thấy sử dụng; không dùng probe API này để kết luận UI vi phạm CTX-13. Hai ca public Detail ở trên kiểm đúng đường đi ứng dụng và đạt.

## QA độc lập

Agent QA độc lập `a0_qa` đã đọc diff/harness/modules, kiểm pin/sạch baseline, tái đo đối chiếu artifact, chạy unit, phản chứng và runner không ghi báo cáo. Vòng cuối sau khi stage toàn bộ scripts: baseline/current cùng **54 PASS / 1 FAIL**, static **6 PASS / 0 FAIL / 2 pending**, phản chứng **6/6**, ba capture exit 0; kiểm lại RA card/broadcast và DB-09 refill/xoá block; report/counts/coverage khớp, diff ngoài tài liệu/tests trống. Verdict cho toàn bộ checkpoint PARTIAL: **AUDIT_PASS về bằng chứng/an toàn, không phải M0 đạt**; không còn lỗi cần sửa trước commit. Mọi giới hạn ở ma trận trên giữ nguyên, không xem test đỏ là được chấp thuận.
