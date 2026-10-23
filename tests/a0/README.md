# A0 — checkpoint Node 2026-10-22

**Execution A0: PARTIAL. Áp dụng quyết định PO: SUCCESS.** Cycle đã chạy theo PLAN §0.1 / SPEC §1.1 và dừng ở quyết định PO; chưa qua cổng M0. Không sửa ứng dụng, merge, push, cài gói hay gọi backend thật. Các test dùng dữ liệu giả trong VM, fetch bị chặn mặc định, đồng hồ/random cố định. Nhận giọng và Supabase thiếu cột đều là stub, không kết nối dịch vụ.

Baseline ghim `e324beb54b29ddfa055956c756a4ceba2676dfa1`, tree `9de0480570b1c95c85912d685626891ba142b825`, worktree sạch. Cycle ban đầu lưu tại `d1e793c`; báo cáo hiện tại là lần kiểm lại sau PO, SHA nguồn trước commit nằm trong `cycle-report.json`. Báo cáo ghi SHA nguồn trước commit checkpoint; mã nạp thực tế có hash LF riêng. Commit chứa file này là checkpoint kết quả, xem `git log --oneline -- tests/a0/README.md`.

## Chạy lại

Từ worktree restructure, với Node/Git đã có sẵn:

```powershell
node tests/a0/run.js                    # chỉ đọc; exit 0 cho phần Node đã chạy, A0 vẫn PARTIAL
node tests/a0/unit.js                   # baseline; exit 0
node tests/a0/unit.js .                 # current; exit 0
node tests/a0/selftest.js               # 17 phản chứng/policy checks; exit 0
node tests/a0/measure.js                # baseline đã ghim, JSON stdout
node tests/a0/measure.js . --current    # snapshot tĩnh nhánh hiện tại
node tests/a0/static.js                 # baseline; exit 0
node tests/a0/static.js . --current      # current; exit 0
node tests/a0/static.js . --current --preview # exit 1 cho tới khi config được version
```

Chỉ `node tests/a0/run.js --write-report` mới ghi lại hai báo cáo quan sát trong thư mục này; không ghi baseline hay fixture `tests/fixtures/`. Runner kiểm pin baseline và ancestry HEAD, so hash sáu module nạp và diff toàn bộ tracked file ngoài tài liệu/tests so với baseline. Lỗi assertion/pending không bị chuyển thành pass; report là quan sát; allowlist được duyệt riêng ở `STA-03.allow.json`, với deadline cấu hình trước preview. STA-01 dùng `git ls-files`: file JS mới cần được stage/commit để thuộc tập tracked được kiểm.

## Kết quả

| Nhóm | Baseline | Nhánh hiện tại |
|---|---|---|
| Unit/scenario Node | 56 PASS / 0 FAIL | 56 PASS / 0 FAIL, kết quả khớp baseline |
| Kiểm tĩnh STA-01..08 | 8 PASS / 0 FAIL / 0 pending | như baseline, không issue mới |
| Phản chứng mới | 17/17 PASS (7 mutation có đối chứng và 10 kiểm policy/scope) | mutate chuỗi mã baseline trong RAM, không sửa nguồn |
| Bộ capture cũ | 12 hợp đồng + 1 vị trí khớp; 6 capture khớp; self-test 65/65 | chạy lại ba công cụ, tất cả exit 0 |

`cycle-report.json` chứa từng kết quả, hash, trace storage, ma trận khoảng trống và stdout bộ capture cũ. `metrics-baseline.json` chứa vị trí từng candidate, cách đếm và SHA nguồn. Hai báo cáo không chứa prompt/dữ liệu người dùng thật, credential hay link hồ sơ thật.

## Độ phủ và giới hạn

| ID | Bằng chứng và phần còn thiếu |
|---|---|
| CTX-01..04,06..08 | Cụm dài, đoạn cuối thiếu dấu, đủ 10 gap, giới hạn chữ viết tắt; meta roundtrip, bản dịch và chia văn bản giữ nội dung theo ngưỡng |
| CTX-05 | Ba cờ đơn hợp lệ đọc lại được; chưa kiểm metadata có cờ xung đột |
| CTX-09 | Người thường Gemini trước/fallback; TJ OpenAI trước/fallback Gemini, đúng PO đã chốt |
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

Phản chứng mã kiểm 7 lỗi: bỏ ngoại lệ TJ; đảo thứ tự đánh dấu cụm dài; bỏ lowercase; sai chu kỳ 24 giờ; bỏ tombstone; bỏ dung sai đọc; bỏ quota guard. Mỗi mutation có đối chứng xanh riêng và phải làm ít nhất một assertion đỏ, 10 kiểm policy/scope bổ sung xác nhận chặn preview khi còn config, không tăng/gia hạn/trùng/lấy lại ngoại lệ đã xoá (kể cả đã commit), cho giảm danh sách, không miễn selector vùng đọc. Self-test không phụ thuộc config còn trong policy, vẫn chạy khi policy rỗng.

## Số liệu M0.2

`game.js` 5.598 dòng/523.111 byte LF; `app.js` 5.290 dòng; `detail.js` 3.292 dòng. Tổng script cục bộ tracked hiện hữu trong index: 983.647 byte LF, `keys.local.js` không có (untracked/ignored), chưa phải dung lượng mạng nén. Có 7 candidate định nghĩa esc, 16 file nhắc localStorage nhưng chỉ 15 có candidate thao tác; `learn.js` chỉ nhắc trong comment.

Regex thấy 182 candidate `.from/rpc/channel/removeChannel` (game121, db53, auth6, app2), 51 candidate global assignment/47 tên, cùng tham chiếu module và App gọi ngược. Đây là inventory vị trí để review: có comment, string và alias `w` cục bộ, không phải số global/call graph đã được AST xác nhận. Đồ thị biến closure đầy đủ, số liệu browser và nhật ký storage của mọi flow vẫn thiếu; M0.2 là PARTIAL.

## Quyết định PO đã áp dụng và phần còn lại

TJ chốt: **"Giữ ưu tiên AI hiện tại; ghi nhận vấn đề cache và sửa trước nghiệm thu preview."**

- Giữ nguyên mã provider: riêng TJ OpenAI trước, Gemini dự phòng; người thường Gemini trước, OpenAI dự phòng. CTX-09 đã sửa theo quyết định này, thêm ca fallback TJ. Đây là thay đổi kỳ vọng đã được PO duyệt, không phải nới test để che lỗi.
- `STA-03.allow.json` ghi đúng 5 mục baseline đã review: 4 metadata (manifest/3 icon theo TEST §3.3) và config `learn/sw` tạm tới preview. `cache-policy.js` kiểm schema, ceiling cố định, không trùng, và giao với mọi revision policy trong Git để không tự thêm lại mục đã xoá sau commit. Danh sách chỉ được giảm; không tự sửa deadline. Nguồn baseline bất biến dùng snapshot ngoại lệ ban đầu làm đối chứng, nhánh hiện tại dùng policy đang giảm; sửa/xoá nợ ở nhánh mới không làm test đối chứng baseline tự đỏ.
- `node tests/a0/static.js . --current --preview` hiện phải exit 1 tại STA-03 do config chưa có version, dù kiểm A0 bình thường xanh. Sửa app/cache và xoá mục tạm trong commit riêng trước nghiệm thu preview; không triển khai app trong lần ghi quyết định này. `cycle-report.json.previewCacheGate.ready` hiện là false; `preview-check.json` lưu CLI thực trả exit 1 và mục cấu hình bị chặn.
- STA-07 đã xử lý kỹ thuật: hai selector chính xác `.menu-sub` và `.admin-new-link code` thuộc menu/admin, ngoài phạm vi vùng đọc/từ vựng. Công khai trong `outOfScope`, không thêm ngoại lệ typography; selector khác/selector list có vùng đọc vẫn bị bắt.
- A0 vẫn PARTIAL vì ma trận còn thiếu browser/storage/UI. Cài Playwright vẫn cần quyền theo anchor; G2 và tích hợp main còn cổng riêng, chưa lấy commit từ debug/lane-policy.

`Context.generate()` legacy vẫn còn mã sinh mẫu nhưng tìm caller trong app JS không thấy sử dụng; CTX-13 kiểm public Detail path thiếu key/AI lỗi và đạt, không suy ra từ legacy probe.

## QA độc lập

Vòng QA `d1e793c` ban đầu đã đạt AUDIT_PASS cho checkpoint PARTIAL. Sau PO, QA độc lập kiểm lại provider order, policy cache và preview gate; phát hiện self-test phụ thuộc mục config chưa xoá và guard re-add chỉ dựa HEAD. Hai lỗi của bộ kiểm đã sửa: self-test dùng fixture độc lập, policy kiểm mọi revision lịch sử. Vòng cuối QA chạy runner chỉ đọc: exit 0, unit baseline/current 56/56, static 8/8, self-test 17/17, capture cũ cả ba exit 0. Preview CLI exit 1 đúng tại cấu hình learn/sw. Verdict AUDIT_PASS cho áp dụng quyết định PO, không còn P1/P2; toàn bộ A0 vẫn PARTIAL. Chú thích P3 về so sánh issue preview đã sửa để baseline/current cùng chế độ.
