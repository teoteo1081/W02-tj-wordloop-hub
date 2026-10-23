# TOEIC nhiều năm — công cụ nội dung WL-12

Entry point: `python -B -m tools.exam_ingest`, chạy từ worktree nguồn Git. Import package không đọc env, nguồn, mạng hoặc script legacy. Python 3.12 trở lên; core CLI/config/ID dùng standard library. Các adapter xử lý dùng dependency tùy chọn trong [requirements.lock](requirements.lock), khóa từ môi trường Windows/Python 3.12 đã có; không có lệnh tự cài hoặc tải model.

Trạng thái: có implementation và ca kiểm offline cho M1–M3. Fixture là nội dung tự tạo, không phải đề ETS. Tính tương thích với PDF/audio/sách thật 2019–2022, provider/cloud live và QA độc lập chưa được xác nhận. M4 vẫn `BLOCKED_SOURCE` vì chưa tìm thấy nguồn. Xem [kế hoạch WL-12](../../PLAN_TOEIC_INGEST.md).

## Lệnh và tác dụng

| Lệnh | Đọc/ghi |
|---|---|
| `doctor` | Đọc metadata package, PATH/config và kiểm thư mục model; không gọi mạng, binary, cài đặt hoặc tải model. `runtime_verified=false` |
| `inventory` | Đọc/hash nguồn, mở PDF, kiểm map trang, audio duration; file audio ngoài WAV cần ffprobe local. Không ghi nếu thiếu `--output` |
| `run` | Xử lý stage DAG, ghi artifact ngoài repo. CPU adapters chạy local; AI bị khóa trừ khi có `--allow-ai`, budget và quota mới kiểm |
| `validate` | Kiểm bundle và nguồn/media hiện tại, không có backend client |
| `plan-publish --snapshot` | Dùng snapshot JSON đã cấp; tính diff, không gọi backend/AI. `--live-read` là lựa chọn riêng để đọc Management API/R2/public media |
| `publish` | Mặc định chỉ `DRY_RUN`, không tạo client và không đọc/ghi backend |
| `publish --apply` | Cần hash plan đúng, review đúng content, preflight còn hạn, quyền và backup ngoài repo. Có ghi live khi người vận hành đã cấp rõ phạm vi này |

Exit code: `0` = PASS/PLANNED/DRY_RUN; `2` = input/cổng kiểm bị chặn; `1` = lỗi môi trường/input không phân loại được. Không coi exit 2 do nguồn chưa có là bộ đề đã xử lý thành công.

## Kiểm ngay khi chưa có nguồn

```powershell
python -B -m tools.exam_ingest --help
python -B -m tools.exam_ingest doctor --profile tools/exam_ingest/profiles/ets2019.json
python -B -m tools.exam_ingest inventory --profile tools/exam_ingest/profiles/ets2019.json
```

Các template 2019–2022 để `source_status=not_found`, `tests=[]`, `structure_verified=false`. Profile 2023 cũng là template tham chiếu chưa gắn nguồn, không phải khẳng định mất nguồn 2023 trên máy. `inventory` phải trả `BLOCKED_SOURCE`, không bịa số Test. Tesseract có trên máy nhưng không ở PATH: doctor sẽ báo thiếu cho đến khi cấu hình đường dẫn, ví dụ `C:/Program Files/Tesseract-OCR/tesseract.exe`.

## Gắn nguồn thật sau khi có đường dẫn

Copy template thành file cấu hình **ngoài repo**. Đặt `source_status=available`, `source_root`, bản in `edition`, đúng danh sách Test thực tế và `structure_verified=true` chỉ sau khi đã đối chiếu cấu trúc nguồn. Chưa hỗ trợ profile có cấu trúc khác 200 câu/Part chuẩn 2023; không tự suy ra cấu trúc đúng chỉ từ năm.

Schema: [profile.schema.json](schemas/profile.schema.json), [manifest.schema.json](schemas/manifest.schema.json). Runtime dùng validator Python, không tải JSON Schema từ mạng.

Mỗi Test có `number`, `sources` và `graphics`. Nguồn cơ bản bắt buộc:

- `lc_pdf`, `rc_pdf`: `path` + `pages` là danh sách trang PDF vật lý bắt đầu từ 1; không mặc định theo số trang in. LC/RC và các Test không được chiếm nhầm cùng trang trong cùng file.
- `audio`: WAV/MP3 đọc được; cùng Test/bản in. `ffprobe` cần cấu hình nếu không ở PATH.
- `answer_key`, `reference_key`: hai file JSON riêng để đối chiếu; người rà vẫn phải chứng minh đó là hai nguồn độc lập, không chỉ hai bản copy. Mỗi JSON có `year`, `test_number`, `LC` và `RC`, mỗi mảng đúng 100 ký tự. Part 2 chỉ A/B/C; phần còn lại A/B/C/D.
- Tùy chọn `sha256` khóa bản nguồn; `year`/`test_number` trên source spec phải khớp profile. Inventory luôn hash file kể cả khi không có hash kỳ vọng.

Nguồn xử lý có thể đã được người rà chuẩn hóa thành JSON:

| Role | JSON payload, ngoài `year`/`test_number` |
|---|---|
| `structured` | `items` đủ câu 32–200; mỗi item có `num`, `part`, `stem`, `opts`; Reading Part 6/7 có `passage` và `group:[first,last]`. Các câu cùng nhóm giữ cùng passage/group; Part 6 giữ mọi blank `(num)`. `flags` phải rỗng |
| `cues` | `items` map chuỗi `1..100` → `{q:[a,b],g:[a,b]}`; `g` bắt buộc Part 3/4, cùng nhóm có cùng mốc. Giây nằm trong audio duration và mốc câu không chồng nhau |
| `whisper` | `words:[{a,b,t}]` đã rà, để dựng cues hoặc căn transcript |
| `enrichment` | `items` đủ 1–200: `num,answer,explain,stem_vi,vocab:[{t,vi}]`, tùy chọn `i18n:{en|zh|es:{explain}}` (vocab cần thêm khoá `zh`/`es` tương ứng); câu Listening có `scr` hoặc lấy từ role `transcript` |
| `transcript` | `items:[{num,scr:{lines:[{sp,t,vi,a,b}],ev:{"num":"source excerpt"}}}]`. `t` là chữ gốc theo schema game. Nếu a/b thiếu, cần Whisper words để căn; coverage dưới 85% phải rà |
| `lc_book`, `rc_book` | PDF sách chữa + map trang từng Test. Nếu thiếu JSON enrichment, adapter trích text/tables và yêu cầu provider chuẩn hóa; scan chưa có text phải cung cấp OCR đã rà |

Mỗi crop trong `graphics`: `role`, `page`, `box:[x0,y0,x1,y1]` theo tỷ lệ 0..1 và **một** trong `num` (1–6) hoặc `group` (32,35,…98). Cần đủ sáu ảnh Part 1 và mọi graphic được câu hỏi tham chiếu; không cố định số graphic là 5.

Không có `structured`: adapter yêu cầu AI dựng từng Part từ OCR. Không có `cues`: cần Whisper local và đủ số câu/nhóm/khoảng lặng đáng tin; thiếu dấu mốc sẽ dừng để người rà bổ sung cues. Không có `enrichment`: cần hai sách chữa đúng map và AI đã cho phép. Không thay phần thiếu bằng nội dung AI tự sáng tác.

## Chạy stage và tiếp tục run

```powershell
python -B -m tools.exam_ingest run --profile C:/toeic-private/ets2019.json --test 1 --work-root C:/toeic-private/work --run-id pilot001 --stage review
```

Các stage: `keys`, `audio`, `ocr`, `structure`, `crop`, `cues`, `build`, `enrich`, `review`. Chọn stage cuối, runner chạy các phụ thuộc. Input thiếu sẽ block trước xử lý. Directory: `<work-root>/<year>/<edition>/test-<N>/<run-id>`. `manifest.json`, `state.json`, từng `<stage>.json` và `report.json` nằm ở đó.

Artifact PASS chỉ được dùng lại khi profile, nguồn, mã package, dependency output và file phụ vẫn đúng hash. Lỗi đánh `FAILED`, không tạo trạng thái done giả. Lock file chặn hai process cùng run; khi process chết cứng, kiểm process chủ trước khi bỏ lock thủ công. Không có lệnh tự dọn/xóa thư mục.

`review.json` là bundle đã enrich kèm `content_hash`; trạng thái human review vẫn PENDING, không tự duyệt bởi runner. Thêm năm không phải đổi `2023` bằng search/replace: dùng bộ codec trong `ids.py`, ví dụ `2019-1`, `ets19_t1_p5_101`, `TEST_2019-1_LC.mp3`, `T2019-1_q1.jpg`. Mã legacy `1`/`ets_t*` được parse về 2024; publication vào 2023/2024 bị khóa.

## AI, model và chi phí

Provider chỉ dùng proxy HTTPS được cấu hình; không tự thử OpenAI hoặc model trả phí khác. Muốn gọi AI cần đồng thời:

- Cờ `run --allow-ai`.
- `provider.model`, `endpoint`, `credential_env` (tên biến env), `max_calls` và `attempts` 1..3.
- `quota_checked=true`, `budget_approved=true`, `quota_checked_at` là ISO timestamp có timezone trong 24 giờ qua.

Budget đếm **mọi attempt**, kể cả timeout/JSON lỗi; ledger `ai_usage.json` giữ số đã gọi qua resume. Nếu provider không trả usage/cost thì ghi `null`, không khẳng định miễn phí hoặc bịa chi phí USD. Không ghi request secret/response lỗi vào log. Whisper chỉ nhận thư mục model local; không tự tải model. Có cues đã rà vẫn có thể đặt `tools.whisper_model` để lấy words phục vụ căn transcript.

## Plan publish và duyệt

Sau khi rà Part 1/graphic, mốc audio, đáp án và mẫu transcript/lời giải, lưu approval JSON ngoài repo:

```json
{
  "approved": true,
  "reviewer": "TJ",
  "content_hash": "COPY_FROM_REVIEW_BUNDLE",
  "accept_i18n_pending": false,
  "checks": ["Part 1 images", "graphics", "audio boundaries", "official keys", "transcript and explanation samples"]
}
```

`test_items.i18n` phải đủ vi+en+zh+es (CLAUDE.md). Nếu bundle còn thiếu ngôn ngữ, `plan-publish` báo `I18N_INCOMPLETE` trừ khi approval đặt `accept_i18n_pending=true` (chỉ nên dùng khi đã định chạy bước dịch sau bằng `--mode enrich`); plan ghi `i18n_pending`. `publish` không `--apply` (DRY_RUN) giờ chạy lại toàn bộ cổng offline (bundle/hash/target/năm bảo vệ/rebuild plan), không chỉ kiểm dấu hash; vẫn không tạo client.

Approval là biên bản vận hành cho đúng nội dung, không phải hệ thống xác thực/chữ ký điện tử. Target cấu hình phải chỉ rõ `project_ref`, `supabase_url`, `image_base`, `audio_base`, `r2_endpoint`, `r2_bucket`; URL Supabase và project phải khớp nhau. Không điền credential vào profile.

Offline snapshot phải có `schema_version=1`, `complete=true`, `test`, `target_hash` (SHA256 canonical JSON bằng `common.digest`), `protected_hash`, `rows` và `objects` map object-path → `{sha256,bytes}`. Snapshot chỉ gồm scope đích, không được coi snapshot cũ là trạng thái live. `preflight` trong snapshot cần cùng target hash, timestamp có timezone trong 24 giờ, `permissions_checked=true`, `quota_checked=true`, `supabase_free_bytes` và `r2_free_bytes` đã đo đủ headroom. Đây là bằng chứng người vận hành cung cấp; chương trình không suy ra billing/quota từ Git.

```powershell
python -B -m tools.exam_ingest plan-publish --profile C:/toeic-private/ets2019.json --bundle C:/toeic-private/review.json --approval C:/toeic-private/approval.json --snapshot C:/toeic-private/snapshot.json --output C:/toeic-private/publish-plan.json
python -B -m tools.exam_ingest publish --profile C:/toeic-private/ets2019.json --plan C:/toeic-private/publish-plan.json
```

`plan-publish --live-read --preflight <file>` thay cho `--snapshot` sẽ tạo snapshot bằng client live; chỉ dùng khi đã có quyền đọc. Mode mặc định insert; `--mode enrich` chỉ cập nhật explain/stem_vi/vocab/i18n trên đúng hàng đã có, merge giữ ngôn ngữ cũ, không sửa question/key/media identity.

Apply live là bước riêng sau duyệt plan hash, có cú pháp:

```powershell
python -B -m tools.exam_ingest publish --profile C:/toeic-private/ets2019.json --plan C:/toeic-private/publish-plan.json --apply --approved-plan-hash COPY_EXACT_PLAN_HASH --backup-root C:/toeic-private/backups --preflight C:/toeic-private/preflight.json
```

Client live cần `SUPABASE_PAT` hoặc `SBPAT` cho Management API; `SUPABASE_SERVICE_ROLE_KEY` cho Storage không-upsert; `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` là credential S3 đã được cấp. Thiếu quyền thì block; không tạo account/token hoặc deploy Worker nhận PUT. Quota/preflight phải còn hạn ở thời điểm apply, không chỉ lúc lập plan.

Kiểm nguồn/hash/conflict và quyền diễn ra trước upload. Snapshot/plan được backup ngoài repo, receipt theo từng object/batch DB; insert DB theo một statement, enrich khóa các hàng và kiểm trạng thái trước. R2 conditional PUT và Storage non-upsert không đè file cũ. Verify đọc lại DB/media và kiểm Range/CORS audio public. Nếu lỗi sau server write nhưng trước verify/receipt, trạng thái không rõ phải snapshot/re-plan; không đoán đã thành công và không tự xóa object/hàng theo prefix. Rollback chỉ theo backup/receipt đã được rà.

## Kiểm offline và artifact mẫu

```powershell
python -B -m unittest discover -s tools/exam_ingest/tests -t . -v
python -B -m tools.exam_ingest.tests.demo --output-root C:/toeic-private/synthetic-qa
```

Demo dùng PDF/WAV/JSON tự tạo, CPU FFmpeg/PyMuPDF/Pillow thật, chặn mạng bằng mock; provider và backend chỉ là fake. Nó tạo 4 case năm 2019–2022, mỗi case 200 câu, có graphic, dry-run plan và receipt fake-publish. Approval trong demo được ghi rõ fixture, không phải duyệt đề thật của TJ. Demo không thể chứng minh kết nối/live SQL/R2 hoặc nội dung đề thật đúng.

Các giới hạn ứng dụng trong plan vẫn giữ: không dùng màn `tSaveKey` để sửa key đề có năm; chuỗi “ETS 2024” cứng và kiểm URL ảnh trên UI thuộc làn D/M4. Không đổi `js/`, Supabase schema hay dữ liệu 2023/2024 trong implementation này.
