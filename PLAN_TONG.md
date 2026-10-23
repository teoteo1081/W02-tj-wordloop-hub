# PLAN_TONG.md — bản đồ tài liệu WordLoop (đối chiếu 2026-10-20)

**Roadmap/action list hiện tại duy nhất: [README — WL-01…WL-18](README.md#việc-còn-dang-dở).** File này nối các thiết kế nguồn, không tạo lịch ưu tiên thứ hai. Thứ tự sản phẩm chưa được chốt lại trong lần rà tài liệu.

## Hiện trạng có bằng chứng code/Git

- `main` = ref cục bộ `origin/main` = `e324beb54b29ddfa055956c756a4ceba2676dfa1`; tích hợp 19/10 đã ở cả hai ref. Không fetch, không xác nhận Pages/deploy.
- **Cập nhật 2026-10-22:** sau `git fetch`, `origin/main` = `6c7b66b` (hơn `e324beb` hai commit nội dung/game). `main` nay chỉ nhận nội dung (làn N, [CLAUDE.md](CLAUDE.md) mục “Làn làm việc”); mốc `e324beb` ở dòng trên là của 20/10.
- TOEIC Speaking/Writing, IELTS Speaking/Writing và chế độ lớp có code: [js/learn.js](js/learn.js) PAGES, [learn/sw/sw.js](learn/sw/sw.js) FORMAT3/TIME3W/loadSets, [js/swclass.js](js/swclass.js) routing `exam=ielts`. Bộ đề trong repo: [sets.json](learn/sw/sets.json), [ielts.json](learn/sw/ielts.json); không dùng chúng suy ra DB/cloud inventory. Việc tiếp là QA/nguồn/quota (WL-05), không dựng lại màn “sắp có”.
- Gate có implementation/test ở `handoff/gate` / `origin/handoff/gate` `4c43c50`; chưa thuộc lịch sử main. Audit/integration theo WL-02, không tự merge.
- `js/gamelayer.js` đã có receiver `tjwl-game-show`; ghi chú “thiếu receiver” trong kế hoạch 08/10 là lịch sử, cần tái hiện luồng (WL-06).
- `learn/ea/index.html` còn `lessonBase` trỏ GitHub L04; không kiểm quyền repo ngoài. Các số ETS/Storage/quota/token/chi phí bên dưới là ghi nhận có ngày, chưa đo lại.

## Tra thiết kế theo hành động

| Việc | Action hiện tại | Tài liệu nguồn |
|---|---|---|
| Tích hợp, QA thiết bị và gate | WL-01, WL-02, WL-11 | [README](README.md#việc-còn-dang-dở), [HANDOFF](HANDOFF.md) |
| Kho sách, R2, quyền file tạm | WL-03, WL-04 | [R2_BUCKETS](R2_BUCKETS.md), [SUPABASE_STORAGE](SUPABASE_STORAGE.md) |
| S&W và IELTS | WL-05, WL-15 | [ý tưởng S&W](PLAN_TOEIC_SW_GAME.md), [nguồn tham khảo](NGUON_THAM_KHAO_SW_IELTS.md) |
| EA, Marketing và khung khoá học | WL-06, WL-07, WL-13 | [PLAN_LUONG_HOC](PLAN_LUONG_HOC.md) |
| Phòng, Bảng, Correct | WL-08…WL-11 | Chi tiết dated backlog ở README |
| Nạp đề / nội dung / việc còn lại | WL-12…WL-18 | README và lịch sử dưới đây |

Làn của từng WL (N nội dung / T tính năng, hoãn / D debug / R restructure): cột “Làn” trong [README](README.md#việc-còn-dang-dở). Thiết kế restructure, debug và Netlify nằm ở nhánh riêng (`feat/restructure-plan`, `fix/debug-plan`, `feat/netlify-frontend-plan`), không có trên `main`.

## Quyết định còn cần TJ

Tên gọi/khung khoá học và EA hay CIA làm mẫu; đồng bộ tiến độ Quest, tách Host; IELTS Academic/General và có làm Nghe/Đọc không; nền tảng mic/âm thanh; mẫu, quyền và ngân sách trước mọi nhập dữ liệu/chuyển kho/chạy AI hàng loạt. Không hỏi lại quyết định không TURN trả phí. Hướng thẻ giữ nguyên/chỉ thêm đã được ghi là TJ chốt 14/10; bố cục chi tiết vẫn cần đối chiếu code/mẫu.

---

# Bản ghi kế hoạch 2026-10-14 (lịch sử)

> Gộp từ `PLAN_LUONG_HOC.md` (đề xuất 2026-10-08), `PLAN_TOEIC_SW_GAME.md`, `README.md`, `HANDOFF.md` và các quyết định trong phiên 2026-10-13/14.
> Mục nào ghi "đề xuất" là CHƯA được TJ duyệt. Chi tiết kỹ thuật từng việc: xem file nguồn tương ứng.

## 1. Đã xong gần đây
- **ETS 2023 Test 1–10** nạp đủ 2.000 câu (Listening + Reading), audio có mốc từng câu (theo khoảng lặng thật), lời giải tiếng Việt 1.998/2.000, lời thoại có mốc từng lượt nói (`i18n.scr`) 996/1000 câu Listening. Quy trình + công cụ: `tools/ets2023/QUY_TRINH_NAP_DE.md`.
- **Game thi TOEIC:** nhóm 3 câu Part 3–4 gọn vừa màn (xếp theo bề rộng khung, `@container`), xem trước nhóm sau chọn trước được, đọc trước 25s ở nhóm đầu Part 3/4, Kahoot là kiểu chơi mặc định (câu tự chuyển theo giờ chuẩn), ghim bảng Quản trị, dòng đường dẫn đề ("ETS 2023 › Test 5 › Listening › Part 4"), chơi lại ván TOEIC từ Lịch sử.
- **Hạ tầng AI:** `gemini-proxy` có khoá phụ `GEMINI_API_KEY_2` (tự chuyển khi 429).

## 2. Nền tảng cần sửa trước (giai đoạn 0)
- Chuyển giáo trình gốc EA khỏi bucket công khai `toeic` (`lib/EA2025`) sang bucket riêng `library`, sửa Bảng.
- Sửa nút "mở bài học" EA (`learn/ea/index.html` `lessonBase`, đang trỏ repo L04 PRIVATE).
- TJ tự chạy SQL cho phép xoá file tạm (`toeic_tmp_delete`, xem README mục 1) + dọn `lib/_tmp/ZZ_QA_PROBE/`.
- Theo dõi dung lượng Supabase (từng 911/1024 MB; kho 3 tầng R2 xem `SUPABASE_STORAGE.md`).

## 3. Khung "Khoá học" và điều hướng (đề xuất, chờ duyệt)
- Mỗi Hub = một Khoá học, trang riêng, luồng 4 bước **Học → Ôn → Luyện → Chơi chung**; nối tiến độ EA/Marketing Quest lên Supabase để Journey đếm chung.
- Màn **Quản trị** cho TJ (người dùng, phòng, kho/chi phí, tách quyền Host).
- Hấp dẫn: chuỗi ngày, thử thách hằng ngày, huy hiệu, xếp hạng theo khoá.
- **Điều hướng thẻ (TJ chốt hướng 2026-10-14):** GIỮ NGUYÊN các thẻ hiện tại, chỉ THÊM thẻ mới; thanh thẻ chia hàng theo nhóm: Từ vựng / TOEIC / IELTS / Khác (EA, Digital Marketing, GA4, Git & GitHub…); thêm môn mới = thêm 1 dòng cấu hình. Cách nhìn "Theo kỹ năng" (nghe/đọc/viết/nói xuyên kỳ thi) để SAU, khi đã có S&W và IELTS.

## 4. Thiết kế ban đầu TOEIC S&W / IELTS (đã có code về sau; xem hiện trạng đầu file)
- Thẻ mới **"TOEIC S&W"** cạnh thẻ TOEIC. Màn nhỏ: chỉ hiện Đề / Part / Bắt đầu, phần còn lại thu gọn; làm bài ở chế độ tập trung (ẩn thanh phụ).
- Thứ tự: **bộ chấm Viết** (dán bài → AI chấm theo tiêu chí, hiện KHOẢNG điểm ước tính; đề do AI sinh, sách NTV/study4 chỉ làm bộ mẫu hiệu chỉnh) → game Viết (đếm giờ chuẩn, bảng điểm) → **Nói Part 1–2** (tận dụng `js/readalong.js`) → các Part Nói còn lại → thi thử đủ bộ + chế độ lớp.
- Điểm Nói/Viết là ƯỚC TÍNH do AI; phát âm/ngữ điệu không chấm thật được (Web Speech chỉ cho chữ). Quyết sớm: Nói chỉ hỗ trợ Chrome máy tính/Android, hay ghi âm gửi Gemini (cần sửa proxy nhận âm thanh).
- **IELTS**: một thẻ có Nghe | Đọc | Viết | Nói bên trong; Viết/Nói dùng lại bộ chấm TOEIC (4 tiêu chí, band 0–9; Writing Task1 1/3 – Task2 2/3); Nghe–Đọc (dạng câu mới: điền chỗ trống, nối tiêu đề, T/F/NG…) làm sau cùng hoặc bỏ. Cần chốt Academic hay General.
- Dự trù token Claude: TOEIC S&W ≈ 250–350k, IELTS thêm ≈ 200–250k.
- Nguồn tham khảo TJ chỉ định (study4 + prepedu: 10 đề mẫu Speaking, 3 đề Writing, chủ đề IELTS): đã khảo sát, xem **`NGUON_THAM_KHAO_SW_IELTS.md`** (lấy được gì, giới hạn bản quyền, cách lấy bằng Python `tools/sw-research/fetch_page.py`). Đọc bằng Python (curl + OCR ảnh), không để Claude đọc ảnh.

## 4b. Tiến độ thực tế S&W (cập nhật 2026-10-14 tối)
- **ĐÃ LÀM (main, commit 9214370):** 2 nút "🎤 Speaking" / "✍️ Writing" trong thanh "Góc tự học" → app một người `learn/sw/` (đếm giờ chuẩn ETS, Web Speech nhận giọng, AI chấm qua gemini-proxy, điểm ước tính, tiến độ localStorage `sw-quest-v1`, `?mock=1` giả giọng để test). 10 đề Speaking + 10 đề Writing do Python sinh (`tools/sw/gen_sets.py`; Q3 Speaking và Q1–5 Writing dùng mô tả ảnh bằng chữ). Đã chạy thử trên web thật bằng Playwright (Python + chromium có sẵn, `executable_path`); CHƯA thử micro thật.
- **Thiết kế lớp ban đầu — code hiện đã có trên main:** host chọn đề + dạng bài trong phòng, bấm Bắt đầu → mọi máy vào Speaking/Writing chạy cùng câu → điểm từng người phát lại qua kênh phòng → bảng xếp hạng chung. Nhánh `feat/sw-class` (xem commit gần nhất để biết làm tới đâu). Cần: tin `sw` trong `js/game.js` (G.ch), cầu nối trong `js/learn.js`, phần lớp trong `learn/sw/sw.js`.
- **Danh sách còn treo ghi ngày 14/10, cần đối chiếu lại WL-05:** nạp đề prepedu nguyên văn vào máy TJ (`tools/sw/parse_prepedu.py` → file .json → nút "Nạp đề riêng"; KHÔNG commit nội dung có bản quyền); ảnh thật cho Speaking Q3 / Writing Q1–5; IELTS Viết/Nói hiện có code, cần QA (WL-05/WL-15).

## 5. Phòng và Bảng (README, theo thứ tự nên làm)
1. Tab "🖍 Bảng trắng" riêng (bút + ô chữ). 2. Phòng học 24/24 không cần host. 3. Nút "Theo mọi người" cho bài đọc. 4. Chia sẻ ảnh/file trên iPhone. 5. Sửa lỗi Nói/Đọc kiểu HelloTalk. 6. Kiểm trên máy thật (voice iPhone, ghi âm, thanh bút, CC, file lớn).
- Đã chốt: KHÔNG bật TURN Cloudflare (có phí).

## 6. Nội dung và quy trình nạp đề
- **Bộ skill `exam-ingest`:** gom công cụ Python (`tools/ets2023/`) thành các bước (stage) chạy độc lập, có cấu hình theo kỳ thi (TOEIC, sau này IELTS…), README tự chạy tay khi hết token; Claude chỉ chạy lệnh + đọc báo cáo ngắn.
- **ETS 2025:** nạp bằng skill trên (nguồn đặt ở `Desktop\TJ\_staging\ETS 2025\TEST N\`, cùng cách đặt tên như 2023).
- Việc nội dung: EA Part I SU04–14; PDF English File lên bucket `library`; hub IELTS/English File đang trống.

## 7. Thứ tự đề xuất ngày 14/10 (đã cũ, không dùng để triển khai)
1. Nền tảng (mục 2) + xếp thẻ theo nhóm + thẻ S&W (ý tưởng lúc lập kế hoạch; hiện đã có app).
2. Skill `exam-ingest` + ETS 2025 (làm ở session mới).
3. Bộ chấm Viết → Nói Part 1–2.
4. Khung Khoá học, Quản trị, nối tiến độ.
5. Tính năng Phòng/Bảng, IELTS Viết–Nói, phần còn lại (cách nhìn theo kỹ năng, IELTS Nghe–Đọc: chỉ làm nếu cần).

## 8. TJ cần quyết
- Tên gọi (Hub → "Khoá học"; "Góc tự học" → "Luyện") và khoá làm mẫu đầu (EA hay CIA).
- Nối tiến độ Quest lên Supabase? Tách quyền Host?
- IELTS Academic hay General? Nói: chỉ Chrome/Android hay ghi âm gửi Gemini?

### Cập nhật 2026-10-14 — Chế độ lớp Speaking/Writing: ĐÃ LÀM (game v307)
- Host (đang trong phòng) tick "👥 Chế độ lớp" ở thẻ Speaking/Writing, bấm ▶ → mọi máy tự mở thẻ + chạy cùng đề/dạng bài; điểm từng câu phát qua kênh phòng (event `sw`) → "🏆 Bảng điểm lớp" ở màn kết quả. Code: `js/swclass.js` (cầu nối), `learn/sw/sw.js` (phía iframe).
- Đã thử bằng Playwright với phòng giả lập (1 người); CHƯA thử 2 người thật qua Supabase realtime → việc kế: mở 2 trình duyệt cùng 1 phòng để kiểm.
- Còn lại: import đề prepedu riêng (không commit), ảnh thật cho Q3/Writing Q1–5, thử micro thật, QA IELTS S/W đã có code, skill exam-ingest, ETS 2025.
