# WL-12 — Kế hoạch pipeline TOEIC nhiều năm

Trạng thái: **M1–M3 đã triển khai offline, QA độc lập PASS có điều kiện (2026-10-22), 8 lỗi MINOR đã sửa (`b318d24`); còn 2 MAJOR (i18n chỉ `vi`; dry-run chỉ kiểm seal). M4 đã kiểm nguồn thật nhưng vẫn BLOCKED (xem “Kiểm nguồn thật” bên dưới)**. ID `ets<yy>_`; chưa ghi cloud hoặc đổi mã ứng dụng.

## Tiến độ implementation

| Phạm vi | Kết quả có bằng chứng | Còn thiếu |
|---|---|---|
| ING-01..03 / M1 | Có CLI, schema/profile, codec ID, doctor, source inventory, runner DAG/lock/hash/resume | Nguồn thật chưa có; template 2019–2022 báo `BLOCKED_SOURCE` |
| ING-04..06 / M2 | Có adapter audio/OCR/structure/crop/cues/build/enrich/transcript; fixture 4 năm, mỗi case Test 9 đủ 200 câu và có graphic | Chưa kiểm sách/PDF/audio thật từng bản; chưa chạy model Whisper hoặc provider live |
| ING-07..08 / M3 | Có plan/hash/review, snapshot conflict, capacity preflight, backup/receipt/resume; fake backend chứng minh no-write dry-run và verify sau ghi; quota/attempt ledger giữ qua resume | SQL/R2/Storage live adapter mới kiểm bằng mock; cần quyền và integration pilot riêng |
| ING-09 | Có test suite, dependency lock, tài liệu Windows và artifact demo ngoài repo | **QA độc lập chưa thực hiện**; kiểm nội bộ không thay thế cổng này |
| ING-10 / M4 | `BLOCKED_SOURCE` — không tìm thấy nguồn 2019–2022 trong phạm vi đã rà | Inventory thật, map nguồn, mẫu TJ duyệt, quyền/quota, publish và hậu kiểm live |


### Kiểm nguồn thật (2026-10-22, thư mục ngoài repo `C:\Materials`)

Commit `44f32a4` (ETS Official Sample) **chỉ chứa ~36 câu mẫu** (Listening 18 + Reading 18 mục có đáp án trong `answer_keys_extracted.txt`), không phải đề 200 câu → **không dùng được làm Test cho pipeline** (profile bắt buộc 200 câu). Các nguồn đã đo bằng PyMuPDF/ffprobe (chỉ đọc):

| Nguồn | Thực tế đo được | Dùng cho pipeline? |
|---|---|---|
| `ETS_2019_Listening_1000_Full_Tests.pdf` (771 tr.) + `ETS_2019_Reading_1000_Full_Tests.pdf` (1202 tr.) | **Tên file gây hiểu nhầm**: trang bản quyền ghi “托业全真模拟1000题”, Jim Lee & Park Byung-jae, 群言出版社, 2019-01-01 — sách luyện thi mô phỏng Hàn/Trung, **không phải đề ETS chính thức**. Có lớp chữ; 10 Test LC (đề tr.24, 42, 60, 77, 94, 111, 128, 145, 163, 180; đáp án tr.197+) và 10 Test RC (đề tr.15, 61, 105, 148, 190, 234, 278, 320, 363, 405); Part 1 có ảnh | Có thể làm nguồn `lc_pdf`/`rc_pdf` + một nguồn đáp án. **Chưa có** nguồn đáp án độc lập thứ hai (`reference_key`), chưa thấy lời giải tiếng Việt/script đủ cho `enrichment` |
| `toeic-listening-test-01.mp3` (2962 s), `-02.mp3` (2763 s) | Chỉ 2 file, chưa biết thuộc sách/Test nào | Chưa map được; 10 Test LC cần 10 audio |
| `TOEIC_New_Format_Full_Tests_*` (473 tr.), `ETS - Full Test - Ms Hoa Toeic.pdf` (137 tr.) | Sách Nhật “至高の模試600問” (ALC) và tài liệu lớp học; không phải ETS năm 2019–2022 | Không thuộc phạm vi 4 năm ETS |
| `ETS_Official_TOEIC_LR_Sample_Test.pdf` (34 tr.) | Mẫu chính thức nhưng không đủ 200 câu | Chỉ tham khảo |

Môi trường: ffmpeg/ffprobe/PyMuPDF/Pillow/faster-whisper có; **Tesseract không ở PATH, chưa có model Whisper local** (`doctor` = BLOCKED_ENV). Nguồn có lớp chữ nên OCR không bắt buộc; Whisper cần để dựng mốc audio và để xác định mp3 thuộc Test nào.

**Việc cần TJ quyết trước M4:** (1) nhãn ID cho sách này (dùng `ets19_` như “ETS 2019” hay tiền tố/exam khác vì không phải ETS chính thức — ảnh hưởng ID, tên file media, hiển thị “ETS”); (2) cung cấp/khớp audio 10 Test LC; (3) nguồn đáp án thứ hai; (4) cho tải model Whisper local (dung lượng + thời gian) và cấp quyền/quota nếu dùng AI; (5) thứ tự mẫu: 1 Test (LC+RC) làm pilot TJ duyệt trước khi chạy cả 10.

Lệnh, ca kiểm và giới hạn: [README công cụ](tools/exam_ingest/README.md), [báo cáo implementation](tools/exam_ingest/QA_REPORT.md). Chưa công nhận pipeline đã sẵn sàng nạp đề thật. Những mục bên dưới giữ tiêu chí kế hoạch, không tự đổi trạng thái thành DONE chỉ vì có code.

## 1. Mục tiêu, phạm vi và điểm gốc

- Yêu cầu TJ: dùng quy trình ETS 2023 làm cơ sở cho ETS **2019, 2020, 2021, 2022**, kiểm thiếu sót trước; tách worktree và lên kế hoạch trước khi build.
- Worktree: `C:/Users/User/Desktop/TJ/_work/wt-toeic-ingest-plan`; nhánh `content/toeic-ingest-plan`; làn **N — công cụ nội dung**, nối backlog WL-12 trong README.
- Điểm gốc thực tế: `f785ae17232f611f8b92fc660c37e4b8d38ddcc5`. Khi tiền kiểm Git, `origin/main` là `7c51d37`; một phiên khác push trong lúc tạo worktree. Đã xác minh remote `main` và worktree cùng `f785ae1`; các script ETS được rà không đổi giữa hai mốc.
- Kết quả mong muốn: một CLI chạy theo năm/Test, có kiểm nguồn, artifact truy vết được, chạy lại an toàn, báo cáo chất lượng và bước xuất bản tách biệt; giữ payload tương thích `test_items` hiện tại.
- 2023 là bộ tham chiếu để đối chiếu; dữ liệu 2023/2024 đang có không được đổi tên hoặc ghi lại trong dự án này. Thiết kế cho phép thêm profile 2025/2026 sau; chưa xác nhận có nguồn hoặc đã hỗ trợ hai năm đó.
- Mốc lập kế hoạch `75e8143` chỉ tạo worktree/tài liệu; sửa đổi `8e3b059` chốt codec và ranh giới làn. Sau khi TJ giao implementation, mã công cụ được xây ở nhánh này; việc gọi AI/upload/SQL/deploy thật vẫn là bước riêng.

## 2. Bằng chứng tiền kiểm

| Hạng mục | Đã quan sát | Ý nghĩa |
|---|---|---|
| Nguồn 2019–2022 | **Không tìm thấy** đường dẫn/tên nguồn TOEIC/ETS mang các năm này trong `Desktop/TJ`; kiểm trực tiếp `_staging` và `Project/L07-toeic` | Chưa xác định số Test/năm, bản in, trang, file thiếu hay đáp án đúng nguồn. Không suy ra mỗi năm có 10 Test. Chưa rà toàn ổ đĩa, Drive hoặc kho private |
| Cơ sở quy trình | `tools/ets2023/QUY_TRINH_NAP_DE.md` có 12 bước từ nguồn PDF/audio đến câu hỏi, mốc, ảnh, lời giải và lời thoại | Tái sử dụng từng thành phần, không copy nguyên trạng sang năm khác |
| Mã năm | `prep.py`, `build_test.py`, `build_sql.py`, `deploy_test.py`, `build_scr.py`, `book/finalize.py` gắn đường dẫn, `2023-N`, `ets23_*`, tên media hoặc truy vấn `2023%` | Chỉ thay một biến năm sẽ chưa đủ; có nguy cơ gán nhầm/ghi vào dữ liệu 2023 |
| Bản đồ trang | `assemble.py`, `crop_graphics.py`, `book/lc_extract.py`, `book/rc_extract.py` chứa bảng số trang theo sách 2023 | Phải có cấu hình/trình kiểm bản đồ trang theo từng bản nguồn |
| Ngoại lệ Test 9 | `build_test.py` dòng 110–111 bỏ câu 3–6 khỏi danh sách kỳ vọng của Test 9 | Không được kế thừa ngoại lệ này cho mọi năm/Test 9 |
| Hai bản script | `_work/ets2023/deploy_test.py` còn upload audio vào Supabase; bản repo upload R2 | Chạy từ source Git được chọn, không nhân bản script ra thư mục dữ liệu |
| Hoàn thành giả | `run_rc.sh` không dừng ngay khi lệnh trước lỗi, vẫn có thể tạo `done_N.txt` | Stage phải có mã thoát, output và trạng thái kiểm chứng; không dùng cờ done đơn thuần |
| Công cụ local | Python 3.12; tìm được package PyMuPDF/Pillow/OpenCV/faster-whisper/pyspellchecker/boto3/numpy; có FFmpeg, Tesseract và Git Bash | Mới xác nhận hiện diện; chưa xác minh chạy pipeline, model Whisper đã cache hay phiên bản tương thích |
| Cú pháp | Phân tích AST 66 file Python: không có SyntaxError; có cảnh báo escape chuỗi đường dẫn trong một số script | Không đồng nghĩa đã kiểm runtime hoặc nguồn dữ liệu |
| Đáp án | `keys_data.py` không thuộc repo; có bản ngoài repo dành cho 2023 | Cần bước nhập đáp án có schema; không phụ thuộc một file Python riêng chứa dữ liệu |
| Quyền | `SBPAT` và `SUPABASE_PAT` chưa có trong env; CLI từng trả invalid access token; file cấu hình CF có tồn tại | Chưa xác nhận quyền quản trị/quota/hiệu lực token; không đọc hoặc ghi secret vào báo cáo |
| Đọc backend trong phiên | `test_items` có 4.000 dòng TOEIC: 20 mã đề 2023/2024, 200 câu/mã; khóa `(test,part,num)` không trùng; `answer_src=key` toàn bộ | Snapshot trong phiên, không thay thế kiểm live ngay trước publish. Chưa kiểm nội dung/đáp án đúng bằng nguồn |

Nguồn cho các kết luận: [quy trình 2023](tools/ets2023/QUY_TRINH_NAP_DE.md), [build](tools/ets2023/build_test.py), [deploy](tools/ets2023/deploy_test.py), [bản đồ trang](tools/ets2023/assemble.py), [sách Listening](tools/ets2023/book/lc_extract.py), [sách Reading](tools/ets2023/book/rc_extract.py), [runner shell](tools/ets2023/run_rc.sh).

## 3. Thiết kế cần build

Mã mới ở `tools/exam_ingest/`, entrypoint `python -B -m tools.exam_ingest` đã có. Không import trực tiếp các script cũ có tác dụng phụ ở top level. Trong implementation, trách nhiệm manifest nằm trong `sources.py`/`common.py`, state trong `runner.py`, và các stage trong `stages.py`; không cần tách mỗi trách nhiệm thành đúng một filename dự kiến.

| Thành phần dự kiến | Trách nhiệm |
|---|---|
| `__main__.py`, `cli.py` | Lệnh doctor, inventory, run, validate, plan-publish, publish; chọn rõ profile, năm, Test và stage |
| `config.py`, `profiles/` | Schema cấu hình; năm, bản in, Test thật, đường dẫn nguồn, bản đồ trang, profile cấu trúc câu hỏi; template 2019–2022 để `source_status=not_found`, không điền giả đường dẫn/trang |
| `sources.py`, `manifest.py` | Inventory, hash nguồn, ánh xạ PDF/audio/đáp án/transcript, phiên bản cấu hình và artifact |
| `runner.py`, `state.py` | Thứ tự phụ thuộc stage; lỗi thì dừng phần phụ thuộc, resume dựa trên hash và trạng thái đã kiểm |
| `stages/` | Adapter OCR, answer keys, LC/RC, crop, cues, build, lời giải và transcript |
| `validate.py`, `report.py` | Kiểm cấu trúc/ngữ nghĩa/media; JSON cho máy và Markdown ngắn cho TJ; phân biệt missing, failed, skipped, blocked |
| `providers.py` | Gemini/Whisper cấu hình được; quota/budget, timeout, retry có giới hạn và log usage đã che secret |
| `publish.py`, `storage.py` | Tạo kế hoạch ghi, kiểm xung đột, backup, upload, ghi DB và đối chiếu sau ghi |
| `tests/`, `README.md`, tệp dependency khóa phiên bản | Ca kiểm bằng dữ liệu giả lập; hướng dẫn Windows và tiếp tục công việc khi đổi phiên |

### Hợp đồng dữ liệu

- `year`, `test_number`, `edition` và provenance có trường rõ ràng trong cấu hình/manifest local. Giữ schema DB hiện tại; chưa cần thêm cột năm hoặc đổi mã ứng dụng.
- Mã đề mới dự kiến: `2019-1`; ID câu mới: `ets19_t1_p5_101`; audio: `TEST_2019-1_LC.mp3`; ảnh: `T2019-1_q1.jpg` hoặc tên graphic có group. Cùng quy tắc cho 2020–2022 (`ets20_`…`ets22_`). Mọi nơi đọc/ghi phải dùng cùng bộ dựng ID.
- **Tiền tố ID dùng 2 chữ số năm** (`ets<yy>_`), khớp dữ liệu 2023 đang có (`ets23_*`) và chú thích `ets25_t3_p5_101` ở `js/game.js` (kiểm trên `origin/main` `f785ae1`). Không dùng dạng 4 chữ số (`ets2019_`): trộn hai kiểu làm truy vấn theo tiền tố (`like 'ets20%'`) khớp nhầm. Cột `test` vẫn dùng 4 chữ số (`2019-1`) vì app tách năm từ đó (`tBook`/`tNum`); không code nào parse tiền tố ID. Một hàm dựng/parse ID duy nhất (ING-01) chịu trách nhiệm cho cả hai dạng.
- Adapter chỉ đọc dữ liệu cũ hiểu `2023-N`/`ets23_*` và mã `1..10` mà app hiện ánh xạ sang 2024. Không tự chuẩn hóa lại 4.000 dòng cũ.
- Mỗi run nằm ngoài repo: `<work-root>/<year>/<edition>/test-<N>/<run-id>/`. Không tái dùng `key_1.json`, `cues_1.json` hoặc cache của năm khác.
- Lưu nguồn cho từng câu, đáp án và media: file/hash/trang hoặc đoạn audio. Chưa có nguồn thì ghi rõ thiếu; không lấy đề AI sinh để điền vào đề ETS có năm.
- PDF, audio, đáp án thật, sách chữa, transcript, artifact và backup chứa nội dung thật nằm ngoài repo public. Repo chỉ chứa code, schema, template rỗng và fixture tự tạo.

## 4. Chuỗi xử lý và cổng kiểm

| Stage | Đầu vào → đầu ra | Điều kiện qua cổng |
|---|---|---|
| S00 Doctor | Config, Python, binary, model cache → báo cáo môi trường | Đúng Python/package; gọi binary bằng đường dẫn cấu hình; không tự cài hoặc tải model |
| S01 Inventory | Nguồn theo năm/bản in → manifest + bảng đủ/thiếu từng Test | Đọc được PDF, số trang, khả năng trích chữ/OCR, audio duration, key/transcript; nguồn không tồn tại báo `BLOCKED_SOURCE`, không thành công rỗng |
| S02 Map + keys | Manifest + bản đồ trang + đáp án chính thức → source map, keys JSON | Từng Test đúng LC/RC; key đủ 100+100 theo profile đã xác minh, ký hiệu đúng và đối chiếu nguồn thứ hai; số graphic lấy từ nguồn, không cố định 5 |
| S03 Audio | Audio gốc → bản nén, Whisper word timestamps, silence map | Có duration/hash; không tải model hoặc gọi dịch vụ ngoài ngoài lựa chọn đã cho phép; không cắt mất câu |
| S04 OCR | PDF + page map → text/cột/trang có provenance | Mỗi trang có kết quả hoặc lỗi cụ thể; phân biệt scan/text; không bỏ trang thất bại rồi đánh done |
| S05 LC/RC + ảnh | OCR/key/profile → câu hỏi, nhóm passage, ảnh/graphics | AI chỉ dựng lại cấu trúc chữ nguồn; không thay official key; đoạn không rõ gắn cờ để duyệt; đủ nội dung theo profile |
| S06 Cues | Whisper/silence/câu hỏi → mốc câu/nhóm | Mốc hợp lệ trong duration, thứ tự đúng, câu không bị cụt; kiểm mẫu nghe ở ranh giới Part và nhóm |
| S07 Build + validate | Artifact đã kiểm → items JSON, SQL preview, report | Đủ bộ số câu kỳ vọng, không trùng khóa, đúng Part/opts/key, passage/ảnh đúng nhóm; không có ngoại lệ Test 9 chung |
| S08 Enrich | Sách chữa/transcript đúng bản → lời giải, vocab, `i18n.scr` | Bản đồ trang theo nguồn, lời giải/đáp án khớp key; coverage và mốc từng lượt nói rõ. Thiếu sách: báo thiếu, không khai đủ quy trình tương đương 2023 |
| S09 Review | Artifact + báo cáo đối chiếu → bản mẫu để TJ xem | Câu tranh xem ảnh; câu graphic đối chiếu; nghe các mốc chọn trước; vấn đề nghiêm trọng bằng 0, ca chưa thử ghi riêng |
| S10 Plan publish | Artifact khóa hash + target live → kế hoạch diff/backup/ghi | Đọc trạng thái live, kiểm trùng/mã đích/URL/quota/quyền; không thay đổi dữ liệu hoặc Worker |
| S11 Publish + audit | Kế hoạch được duyệt → receipt, backup, kết quả kiểm lại | Chỉ phần đã được duyệt; xác minh DB/media sau ghi; 2023/2024 không bị thay đổi; báo phần thành công/thất bại khi lỗi giữa chừng |

Các stage CPU có thể chạy local sau khi implementation được giao. Stage AI cần bật rõ, kiểm quota/chi phí hiện tại và hạn mức trước chạy. S10 là dry-run thật, không gọi AI hay endpoint ghi. S11 yêu cầu hành động apply rõ ràng, gắn với hash kế hoạch và phạm vi được TJ cho phép.

### Các chỗ phải sửa về độ tin cậy

1. Thay toàn bộ năm/ID/tên media/SQL filter/page offsets cố định bằng cấu hình thống nhất, kể cả lời giải và `build_scr --push`.
2. Chặn thiếu câu 3–6 ở Test 9 của năm mới; không dùng `ALLOW_MISSING_P1` làm điều kiện đạt cho batch hoàn chỉnh.
3. Kiểm đúng bộ số câu và phân bố Part, không chỉ tổng 200. Profile tham chiếu 2023 là `6/25/39/30/30/16/54`; phải xác minh với nguồn từng bản mới trước khi áp dụng.
4. Kiểm khóa `(exam,test,part,num)` và ID; answer thuộc opts; câu/group/passage/ảnh/mốc đúng liên kết; duration audio, mốc đầu/cuối và coverage transcript.
5. Stage lỗi phải có exit code khác 0 và report; không tạo cờ done sau lệnh fail, không nuốt stderr bằng tail/grep. Retry có giới hạn; không tự đổi provider trả phí.
6. Resume chỉ dùng artifact khi hash nguồn, profile, script version và artifact khớp. Đổi nguồn/keys phải làm mất hiệu lực stage phụ thuộc; ghi output atomically, có nhật ký run.
7. Quyền publish kiểm trước khi upload. Kiểm xung đột DB phải diễn ra trước khi ghi media; build/report phải cùng hash, không dùng report cũ để duyệt items mới.
8. Snapshot các hàng và object đích trước ghi; không upsert đè object có sẵn một cách mặc định. Ghi receipt theo bước, có khả năng tiếp tục; rollback dựa trên receipt/backup, không xóa theo prefix rộng.
9. Uploader R2 hiện đổi Worker phát công khai sang bản nhận PUT rồi deploy lại. Pipeline mới cần adapter upload không thay thế Worker phục vụ người học (credential S3 đã được cấp hoặc uploader riêng). Chưa xác nhận quyền thì block live upload; việc cấp quyền/cấu hình dịch vụ phải được duyệt cụ thể.
10. Chạy mã từ worktree/package Git; dữ liệu nằm ngoài repo. Không chạy bản copy cũ ở `_work/ets2023`, không cài package hoặc đọc secret bằng import module có tác dụng phụ.

## 5. Danh sách build theo thứ tự

Bảng dưới giữ thứ tự phụ thuộc và tiêu chí gốc; trạng thái implementation/kiểm chứng từng nhóm được ghi ở bảng tiến độ đầu file.

| ID | Việc và deliverable | Phụ thuộc | Tiêu chí nghiệm thu |
|---|---|---|---|
| ING-01 | CLI + schema config/manifest; template rỗng 2019–2022, profile 2023 tham chiếu; doctor | Không cần nguồn thật | Báo đúng năm/Test; `not_found` rõ ràng; parse config không gọi mạng hay tạo dữ liệu đề; một hàm dựng/parse `test` + ID (`2019-1` ↔ `ets19_t1_…`) có ca kiểm không va chạm giữa 2019–2023 và với mã cũ `1..10`/`ets_t*` |
| ING-02 | Runner, work-root riêng, stage DAG, hash/cache/resume và log | ING-01 | Hai năm cùng Test 1 không dùng chung artifact; nguồn đổi làm invalidate đúng stage; stage lỗi không ghi done |
| ING-03 | Inventory PDF/audio/key và giao diện map trang/key JSON | ING-01/02 | Fixture đủ/thiếu/trùng/sai bản được phát hiện; file encrypted/không đọc được báo lỗi; không sửa PDF gốc |
| ING-04 | Chuyển adapter OCR/audio/LC/RC/crop/cues sang cấu hình nhiều năm | ING-02/03 | Fixture mô phỏng 2019–2022 đi qua được từng stage; không phát sinh mã `2023` cho run năm khác; dùng lại thuật toán phù hợp |
| ING-05 | Build và bộ validator bắt buộc | ING-04 | Bắt thiếu/trùng câu, sai Part/opts/key, ảnh/mốc sai; Test 9 cũng đòi đủ câu; báo cáo machine-readable |
| ING-06 | Adapter sách chữa, lời giải, vocab và transcript có mốc | ING-03/04/05 | Không dùng offset sách 2023 cho bản khác; không ghi ID `ets23` cho năm mới; coverage/nguồn của phần thiếu được báo đúng |
| ING-07 | Plan-publish, backup, xung đột, upload adapter, receipt và kiểm sau ghi | ING-05/06 | Dry-run bằng fake client không ghi/mạng/AI; apply chặn artifact hash đổi, source/QA thiếu, năm đích sai; phân biệt insert mới và enrich đúng tập |
| ING-08 | Budget/usage, retry và preflight quota/quyền | ING-01/07 | Có trần gọi AI/dung lượng; không dựa vào ghi chú Gemini “free”; không lưu token/secret vào log |
| ING-09 | Kiểm offline, tài liệu Windows, hướng dẫn tiếp tục và QA độc lập | ING-01..08 | Ca kiểm có giá trị ở mục 6 đạt; README chỉ lệnh thực sự có; không cần copy script ra ngoài repo |
| ING-10 | Kiểm nguồn thật → map một Test → mẫu một Part → một Test đủ → batch theo năm | Nguồn thật + ING-09 + quyền/ngân sách phù hợp | Qua từng cổng có báo cáo và mẫu TJ đã xem; chưa tìm thấy nguồn thì mục này vẫn blocked, không thay bằng dữ liệu giả |

Có thể build ING-01..09 bằng fixture tự tạo dù nguồn chưa có; compatibility với nguồn thật và năng lực soạn/nạp trọn năm chỉ được công nhận sau ING-10. Không cần thêm UI hoặc đổi schema Supabase để bắt đầu.

## 6. Kế hoạch kiểm chứng

- Unit/integration offline có mục đích: mã năm/ID không đụng nhau; map trang đúng Test; official key đủ và đúng tập ký tự; Part/group/passage/media gắn đúng; phân bố Part/số câu/opts/duration được kiểm.
- Ca lỗi bắt buộc: Test 9 thiếu 3–6; hai năm cùng Test 1; OCR/AI timeout hoặc trả JSON sai; thiếu sách; stale report/cache; upload lỗi giữa chừng; publish retry; object/row đã có; creds/quota không đủ; không thể ghi trước khi plan được chấp thuận.
- Fake backend/provider ghi nhận mọi lời gọi để chứng minh doctor/validate/plan-publish và dry-run không ghi dữ liệu, không deploy Worker và không gọi AI. Không import script legacy khi test có thể gây IO.
- Regression 2023: so sánh artifact mới với snapshot local chỉ đọc nếu snapshot có sẵn; so sánh số câu/key/passage/media/mốc. Không chạy lại AI hoặc publish vào 2023/2024 để “test”. Nếu thiếu snapshot thì báo chưa có bằng chứng regression nội dung.
- QA độc lập sau implementation: người kiểm đọc config, report và artifact; thử lại các ca lỗi; kiểm mẫu ảnh/audio/transcript với nguồn. Chỉ kiểm UI game nếu đã có batch mẫu riêng được phép, dùng phòng `ZZ_QA_*` theo TEAM_PROCESS; không vào phòng TJ.
- Sau publish thật: đối chiếu exact keys/counts/Part và checksum hoặc metadata media, URL/Range/CORS và playback mẫu; so sánh hash dữ liệu 2023/2024 trong phạm vi backup trước/sau. Báo riêng chưa nghe từng câu hoặc chưa kiểm mọi thiết bị.

## 7. Trình tự giao và ước lượng

1. **M1 — Nền offline:** ING-01..03; giao CLI doctor/inventory, schema và báo cáo nguồn `not_found`.
2. **M2 — Xử lý và chất lượng:** ING-04..06; giao artifact fixture và report, chưa xuất bản.
3. **M3 — Publish có kiểm soát:** ING-07..09; giao dry-run plan và bằng chứng fake-client, tài liệu thao tác, audit độc lập.
4. **M4 — Nguồn thật:** ING-10; chọn một năm/Test có nguồn đầy đủ làm mẫu trước, chưa chốt là năm nào khi chưa có inventory.

### Giới hạn ngoài làn N (ghi cho làn D, không sửa ở nhánh này)

Kiểm trên `origin/main` `f785ae1`, không thuộc phạm vi kế hoạch vì là mã ứng dụng (`js/`), không được vào `main` theo ranh giới làn:

- `js/game.js` `tSaveKey` (màn sửa đáp án) hardcode id `"ets_t" + test + "_p" + part + "_" + num`. Đề có mã năm (`2019-1`, id `ets19_…`) không khớp dòng nào; `update` không trả lỗi nên màn có thể báo đã lưu mà không lưu gì (đã đúng với đề 2023 từ trước). Pipeline mới không phụ thuộc màn này vì ghi `answer_src=key` ngay lúc nạp; không dùng màn này để sửa đáp án đề có năm cho tới khi làn D sửa. Cần TJ cho ghi vào `PLAN_DEBUG.md` ở nhánh làn D.
- Chuỗi tĩnh còn ghi "ETS 2024" (`js/game.js` ~dòng 3953, `js/db.js` ~dòng 63, `js/app.js` ~dòng 4537): chỉ lỗi hiển thị cũ, không chặn nạp đề.
- Chưa kiểm cách app lấy URL ảnh `T2019-1_q1.jpg` (dự đoán URL nằm sẵn trong dòng dữ liệu); ING-10 phải thử trên một Part mẫu trước khi nạp cả Test.

Ước lượng sơ bộ M1–M3: **6–10 ngày công**, bao gồm tái cấu trúc script, kiểm lỗi và tài liệu; điều chỉnh sau M1. Đây không phải thời hạn cam kết hay chi phí API. M4 chưa ước lượng khi thiếu số Test, chất lượng scan/audio và sách chữa.

Chi phí lượt lập kế hoạch: không gọi AI API, không chạy Whisper/OCR, không ghi cloud. Trước M4 phải đo một mẫu, báo CPU/thời gian, số lượt AI/token thực tế (nếu provider trả usage), byte media + backup, dung lượng còn lại và hạn token. Chưa có số liệu thì ghi chưa đo; không ước giá cả bốn năm từ ghi chú miễn phí cũ.

## 8. Cổng hoàn tất và bước tiếp theo

- **Lượt kế hoạch hoàn tất khi:** worktree/nhánh riêng tồn tại; kế hoạch bao phủ mọi thiếu sót đã tìm được; README WL-12 trỏ tới đây; diff chỉ có tài liệu; có commit local giữ checkpoint. Chưa push/merge/deploy.
- **Pipeline build hoàn tất khi:** ING-01..09 đạt bằng chứng offline và QA; không còn đường chạy vô tình gán năm 2023 hoặc ghi live trong chế độ kiểm; hướng dẫn chạy được theo entrypoint mới.
- **Một năm hoàn tất khi:** ING-10 xác nhận mọi Test trong inventory nguồn thật, các phần thiếu được giải quyết hoặc được TJ chấp thuận là phạm vi riêng; có artifact/receipt/kiểm live. Không dùng mốc “4 năm = 40 đề” nếu chưa biết nguồn.
- Việc kế tiếp: QA độc lập M1–M3 từ báo cáo/test/artifact; khi có nguồn thật mới mở M4. Việc tìm nguồn 2019–2022 ghi **không tìm thấy** cho tới khi có đường dẫn mới; không giả vờ đã kiểm bản nguồn.

Quy trình tham chiếu: [ETS 2023](tools/ets2023/QUY_TRINH_NAP_DE.md). Roadmap sống: [README — WL-12](README.md#việc-còn-dang-dở). Phạm vi làn: [CLAUDE.md](CLAUDE.md), [TEAM_PROCESS.md](TEAM_PROCESS.md).
