# TOEIC pipeline — synthetic QA

All sources and approvals below are generated fixtures.
No network, paid AI calls, real exams or real backend writes were used.

| Year | Questions | Media | Dry run | Fake publish | AI calls |
|---|---|---|---|---|---|
| 2019 | 200 | 8 | DRY_RUN | PASS | 0 |
| 2020 | 200 | 8 | DRY_RUN | PASS | 0 |
| 2021 | 200 | 8 | DRY_RUN | PASS | 0 |
| 2022 | 200 | 8 | DRY_RUN | PASS | 0 |

Pending: real-source compatibility, live integration and independent human QA.

## Bằng chứng kiểm nội bộ (2026-10-22)

- `python -B -m unittest discover -s tools/exam_ingest/tests -t .` -> 38 test OK.
- `python -B -m tools.exam_ingest.tests.demo --output-root <ngoài repo>` sinh bảng trên.
- `inventory` với profile 2019 -> `BLOCKED_SOURCE`, exit 2 (không bịa số Test).
- Đây là kiểm nội bộ, KHÔNG thay QA độc lập (ING-09).

## QA độc lập M1–M3 (2026-10-22, agent opus/medium, chỉ đọc, commit 28e502e)

Kết luận: **PASS có điều kiện** cho ING-01..09 offline. Không có lỗi CRITICAL: không có đường ghi live hoặc gán nhầm 2023/2024 nếu thiếu plan hash + approval + preflight + credential. Chưa kiểm live SQL/R2/Storage, provider/Whisper, nguồn ETS thật (M4 vẫn `BLOCKED_SOURCE`). Ca âm: 38 test + script ngoài repo; coordinator đã đối chiếu code cho MAJOR-1/2 và MINOR-1.

### MAJOR (cần xử lý trước M4)
1. **i18n chỉ có `vi`** (`stages.py:332`): CLAUDE.md bắt buộc vi+en+zh+es cho `test_items.i18n`; thiếu cả `vi.stem`. Cần stage/cổng dịch (vd `tools/toeic_i18n_add.js`) hoặc validator chặn/cảnh báo.
2. **Dry-run chỉ kiểm seal** (`publish.py:174-178`): plan 2023 tự đóng dấu vẫn ra `DRY_RUN` rc=0. Nên chạy lại `make_plan`/`validate_bundle` + khóa năm, hoặc in nhãn "seal-only".

### MINOR
1. Trần AI theo từng run-id (ledger trong thư mục run, `runner.py:70`): đổi `--run-id` được thêm `max_calls`.
2. Lỗi cấu hình provider (endpoint/credential) bị retry, ăn attempt, báo `AI_FAILED` (`providers.py:49,62,74-76`).
3. Đổi 1 nguồn chạy lại cả DAG (`runner.py:71`); fingerprint chưa có phiên bản ffmpeg/tesseract/Whisper.
4. CLI không bắt `AttributeError` (`cli.py:89`): key JSON dạng mảng -> traceback rc=1.
5. `publish --apply` đọc mạng (snapshot) trước khi kiểm `--preflight` (`cli.py:79`, `publish.py:188`). Chỉ đọc.
6. Cổng enrich SQL dùng `@>` thay vì so bằng (`storage.py:173-179`).
7. Chưa chặn đường dẫn nguồn nằm trong repo; `.gitignore` chưa có `*.pdf/*.mp3/*.wav`.
8. Lock publish theo `backup_root/plan_hash`; URL ảnh thiếu `?v=1`; `ets24_` parse ra `2024-1` (2024 có 2 cách mã hóa, publish vẫn khóa).

### Cập nhật sau QA (commit `b318d24`)
Đã sửa cả 8 nhóm MINOR: ledger AI theo năm/edition/Test (không theo run-id); lỗi cấu hình provider không ăn budget; fingerprint có size+mtime công cụ (invalidate theo từng stage vẫn là giới hạn đã biết); CLI bắt `AttributeError`; `publish --apply` bắt buộc `--preflight` và `--approved-plan-hash` trước khi dựng client; cổng SQL enrich dùng `=` thay `@>`; nguồn trong Git checkout bị chặn (`UNSAFE_SOURCE`) + `.gitignore` chặn pdf/mp3/wav; khóa publish thêm theo target+Test (thư mục temp); URL ảnh có `?v=1`; 2024 chỉ còn mã legacy. Test: 41 pass (thêm 3). **Chưa sửa (ngoài yêu cầu):** MAJOR-1 i18n chỉ `vi`, MAJOR-2 dry-run chỉ kiểm seal.
