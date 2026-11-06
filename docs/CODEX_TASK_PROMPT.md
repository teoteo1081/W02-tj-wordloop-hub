# Nhiệm vụ cho Codex CLI — cào kho đề Zenlish vào kho mới L07A_TOEIC_ZENLISH

Ngày soạn: 2026-11-03. File này gồm 3 phần: (A) kết quả khảo sát schema, (B) quy ước mã đề + vài điều cần Thảo quyết, (C) **prompt để dán nguyên khối cho Codex**.

---

## A. Khảo sát Database (đọc từ `tools/toeic_items.sql`, `js/game.js`, `tools/ets2023/QUY_TRINH_NAP_DE.md`, `tools/game-worker/upload_audio.py` và 8 hàng thật trên Supabase)

Bảng duy nhất chứa đề: `public.test_items` (RLS mở cho anon đọc/ghi; nội dung đề nằm ở DB, **không** nằm trong repo vì repo công khai).

| Cột | Kiểu | Quy ước thật (lấy từ đề 2026-1 đang chạy) |
|---|---|---|
| `id` | text, khoá chính | `ets26_t1_p5_101` = `<tiền tố>_t<số đề>_p<part>_<num>` |
| `exam` | text | luôn `'toeic'` |
| `test` | text | `"<sách>-<số đề>"`, vd `2026-1`; đề ETS 2024 cũ chỉ là `"1"`..`"10"` |
| `part` | int | 1–7 |
| `num` | int | 1–200 (số câu trong đề) |
| `stem` | text | Part 1: `Look at the picture. Choose the statement that best describes it.`; Part 2: `Listen and choose the best response.`; Part 3–7: câu hỏi; Part 5: chỗ trống `_______`; Part 6: câu chứa `------- [131]` |
| `stem_vi` | text/null | bản dịch tiếng Việt (có thể null) |
| `opts` | jsonb mảng | Part 1: `["(A)","(B)","(C)","(D)"]`; Part 2: `["(A)","(B)","(C)"]`; Part 3–7: `["(A) …","(B) …","(C) …","(D) …"]` |
| `answer` | text | `'A'`..`'D'` |
| `tag`, `explain`, `vocab`, `i18n` | text/jsonb | tuỳ chọn, để null nếu nguồn không có |
| `passage` | text/null | Part 1–4: các dòng `[img] <url>` (nếu có hình) và `[aud] q=<giây đầu>-<giây cuối> g=<đầu nhóm>-<cuối nhóm>`; Part 3–4 dòng đầu là `🎧 Conversation · questions 32–34` hoặc `🎧 Talk · questions 71–73`; Part 6–7: cả bài đọc, dòng đầu `Questions 147-148 refer to the following e-mail.` |
| `src` | text | tên nguồn, vd `SIWON2026_T1.pdf` |
| `answer_src` | text | `'key'` (đáp án chính thức) |

Mốc âm thanh `[aud]`: **một file nghe duy nhất cho cả đề** (`TEST_<test>_LC.mp3`), `q=` là cửa sổ lời của chính câu hỏi, `g=` là cả đoạn hội thoại/bài nói của nhóm 3 câu (Part 1–2 chỉ có `q=`). Tính bằng giây từ đầu file.

Nơi lưu file:
- **Âm thanh**: Cloudflare R2 `tj-game`, đường dẫn `listening/TEST_<test>_LC.mp3` (app dựng URL ở `js/game.js:2924`). Tải lên qua `tools/game-worker/upload_audio.py` (cần token Cloudflare, Thảo cấp tạm). Tên file phải khớp `^TEST_[A-Za-z0-9_.-]+_LC\.mp3$`.
- **Hình**: Supabase Storage bucket `toeic`, đường dẫn `listening/img/T<test>_q<num>.jpg` (hình Part 1), `T<test>_g<câu đầu nhóm>.jpg` (biểu đồ Part 3), URL công khai `…/storage/v1/object/public/toeic/listening/img/…jpg?v=1`.

## B. Quy ước mã đề — và một chỗ phải khác yêu cầu ban đầu

Bạn đề xuất `zenlish_2026_test01`. **Không dùng được nguyên văn**, vì app tách mã đề bằng dấu `-` (`tBook` / `tNum` ở `js/game.js:4141-4143`). Mã không có `-` sẽ bị nhận là bộ "2024" (trộn vào kho ETS cũ) và số đề thành NaN. Quy ước dùng thay:

| Thứ | Quy ước | Ví dụ |
|---|---|---|
| `test` | `zenlish_<bộ>-<số đề>` | `zenlish_2026-1`, `zenlish_hacker3-1`, `zenlish_hacker2-10` |
| `id` | `zl<mã bộ>_t<đề>_p<part>_<num>` (mã bộ: `26`, `h3`, `h2`) | `zl26_t1_p5_101` |
| Audio | `TEST_<test>_LC.mp3` | `TEST_zenlish_2026-1_LC.mp3` |
| Hình | `T<test>_q<num>.jpg`, `T<test>_g<num>.jpg` | `Tzenlish_2026-1_q1.jpg` |
| Tên hiển thị | `[Zenlish] 2026 Test 01` | |

Cách này không đụng kho cũ (`1`..`10`, `2023-*`, `2025-1`, `2026-1..3`) vì tiền tố `zenlish_` không trùng.

**Tên hiển thị cần sửa app.** Hiện `tName()` luôn in `ETS <sách> · Test <n>`, nên đề mới sẽ hiện "ETS zenlish_2026 · Test 1". Cần một bản vá nhỏ ở `js/game.js` (`tName` và `paintBooks`) để mã có tiền tố `zenlish_` hiện `[Zenlish] 2026 Test 01`, bộ chọn hiện "[Zenlish] 2026". Bản vá này **không giao cho Codex**; làm riêng sau khi dữ liệu nạp xong (thuộc lane sửa lỗi, cần Thảo đồng ý).

**Nguồn có đăng nhập.** Trang đề của Zenlish có màn chắn đăng nhập (`zen-quiz-login-gate`). Prompt dưới đây yêu cầu Codex dùng phiên đăng nhập của chính Thảo, không né cổng. Mục Full Test trên trang có 77 đề (prompt chỉ cào 57 đề, bỏ 2023 và 2024): các năm 2018, 2019, 2020, 2022, 2023, 2024, 2026, Hacker 2, Hacker 3 và 3 đề đầu vào. Không có 2021 và 2025.

**Bản quyền.** Đề gốc là của bên thứ ba (ETS, sách Hacker). Dữ liệu cào chỉ để trong thư mục kho mới, không commit vào Git, không đưa vào repo công khai.

---

## C. PROMPT DÁN CHO CODEX CLI (bắt đầu từ dòng dưới, copy tới hết khối)

````text
Bạn là kỹ sư dữ liệu. Làm việc bằng tiếng Việt, code Python 3 + Playwright (Python). Mục tiêu: cào đề TOEIC Full Test (Listening + Reading, 200 câu) từ https://zenlishtoeic.vn/test-online-new/ (mục "Full Test"), lưu vào kho MỚI, và xuất JSON khớp 100% bảng Supabase `public.test_items` để chỉ cần chạy script import là app chơi được ngay.

## 0. Ràng buộc bắt buộc
- Thư mục làm việc: `%USERPROFILE%\L07A_TOEIC_ZENLISH` (ổ local; Codex không ghi được ổ mạng UNC). Tạo cấu trúc:
  raw\ (HTML/JSON thô), audio\ , img\ , out\ (JSON cuối), logs\ , scripts\ , README.md.
- KHÔNG sửa/xoá bất kỳ file nào ngoài thư mục này. KHÔNG đụng thư mục L07_TOEIC cũ và repo W02_TJHUB. KHÔNG git commit/push.
- KHÔNG ghi khoá/token vào file. Mọi khoá lấy từ biến môi trường; không in khoá ra màn hình/log.
- Trang có cổng đăng nhập. KHÔNG vượt/né cổng, không dò mật khẩu. Nếu cần đăng nhập: viết `scripts\login_once.py` mở trình duyệt có giao diện cho người dùng tự đăng nhập, rồi lưu `storage_state.json` vào thư mục làm việc (không in nội dung); các script cào dùng file đó. Nếu vẫn không xem được đề → DỪNG và báo lý do, không đoán dữ liệu.
- Lịch sự với máy chủ: tối đa 1 request song song, nghỉ 1–2 giây giữa các trang, chạy lại được (bỏ qua việc đã xong, đánh dấu bằng file `.done`).
- Không bịa dữ liệu. Thiếu gì ghi vào `logs\gaps.md`, không tự điền.

## 1. Danh sách đề cần cào (phạm vi)
Lấy từ mục #full-test của trang. Mỗi đề → một "bộ" + số đề:
| Bộ (book) | Nguồn (slug trang) | Số đề | `test` trong DB | tiền tố id |
|---|---|---|---|---|
| 2026 | test-n-2026 | 1–10 | `zenlish_2026-n` | `zl26` |
| 2022 | test-n-2022 | 1–6 | `zenlish_2022-n` | `zl22` |
| 2020 | test-n-2020 | 3–10 (trang không có Test 1–2) | `zenlish_2020-n` | `zl20` |
| 2019 | test-n-2019 | 1–5 | `zenlish_2019-n` | `zl19` |
| 2018 | test-n-2018 (Test 3 là test-3-ets-2018) | 1–5 | `zenlish_2018-n` | `zl18` |
| Hacker 3 | HACKER 3 – TEST n | 1–10 | `zenlish_hacker3-n` | `zlh3` |
| Hacker 2 | HACKER 2 – TEST n | 1–10 | `zenlish_hacker2-n` | `zlh2` |
| Đầu vào | test-dau-vao, -2, -3 | 1–3 | `zenlish_dauvao-n` | `zldv` |
Trang KHÔNG có đề năm 2021 và năm 2025 trong mục Full Test; đừng tìm chỗ khác để bù. Ghi nhận trong `logs\gaps.md`.
(URL hacker không đều, vd hacker-3-test-1, hacker-3-test (=Test 2), hacker-2-test-1-2 (=Test 1): đọc tiêu đề trang để gán số đề, đừng suy từ URL.) Bỏ qua năm 2023 và 2024 (kho cũ đã có ETS 2023, 2024; tính sau, đừng cào). Bỏ qua các mini test (Be_/Ca_/Fo_/Su_/Sub_ ...) và đề lẻ ETS 2018/2020 trong mục mini cho tới khi được yêu cầu.
Làm THEO THỨ TỰ: (1) thí điểm đúng 1 đề `zenlish_2026-1` đến khi qua toàn bộ kiểm tra ở mục 5; (2) dừng lại, in báo cáo; (3) chỉ khi thí điểm đạt mới chạy các đề còn lại.

## 2. Việc cần làm
1. `scripts\discover.py`: Playwright mở trang, liệt kê Full Test (tiêu đề, URL, bộ, số đề) → `raw\catalog.json`.
2. `scripts\scrape_test.py <slug>`: mở trang đề, lấy đủ 200 câu theo 7 Part: số câu mỗi Part PHẢI là 6 / 25 / 39 / 30 / 30 / 16 / 54, num liên tục 1..200. Lấy: nội dung câu hỏi, các đáp án, đáp án đúng, bài đọc/hội thoại (nếu trang cho xem), lời giải/transcript nếu trang có (lưu vào `explain`/raw, không bắt buộc). Lưu HTML/JSON thô vào `raw\<test>\`. Quan sát cấu trúc mạng (XHR/JSON do trang tải) trước, ưu tiên đọc JSON trang gọi thay vì cắt HTML nếu có.
3. Tải TOÀN BỘ âm thanh (.mp3) và HÌNH câu hỏi:
   - Audio → `audio\TEST_<test>_LC.mp3`: MỘT file cho cả phần Listening. Nếu nguồn chia nhiều file (theo Part hoặc theo câu), ghép bằng ffmpeg (concat, giữ nguyên chất lượng, mono 22050Hz ~56kbps là đủ) và LƯU bảng offset để tính mốc cho mục 3.
   - Hình → `img\T<test>_q<num>.jpg` (hình Part 1, mỗi câu 1 hình), `img\T<test>_g<câu đầu nhóm>.jpg` (hình/biểu đồ đi kèm nhóm Part 3–4, vd g62). Đổi sang JPEG, cạnh dài ≤ 1400px. Hình trong bài đọc Part 6–7 (nếu là ảnh chứ không phải chữ) cũng lưu `img\T<test>_r<câu đầu nhóm>.jpg` và nhúng bằng dòng `[img] <url>` trong passage.
   - Ghi `out\<test>_assets.json`: tên file, kích thước, sha256, URL nguồn.
4. Mốc âm thanh: với mỗi câu Part 1–4 cần `q=<đầu>-<cuối>` (giây trong file LC cuối), Part 3–4 thêm `g=<đầu nhóm>-<cuối nhóm>`. Nếu nguồn cho sẵn thời điểm/phụ đề/từng file câu → dùng và cộng offset. Nếu không có → dò khoảng lặng bằng `ffmpeg -af silencedetect=noise=-33dB:d=0.35` và/hoặc faster-whisper để căn, theo ý tưởng: đầu câu = cuối khoảng lặng dài trước lời đọc, cuối câu = đầu khoảng lặng ≥ 2.3s sau lời đọc cuối. Câu nào không tính được mốc → ghi `logs\gaps.md`, KHÔNG đoán.
5. `scripts\build_items.py <test>`: dựng `out\<test>_items.json` (mảng 200 object) theo schema ở mục 4.
6. `scripts\import_to_supabase.py` (chỉ viết, KHÔNG chạy với khoá thật):
   - Mặc định `--dry-run`: kiểm tra và in tóm tắt, không ghi gì.
   - Chế độ ghi cần cờ `--apply`. Đọc `SUPABASE_URL`, `SUPABASE_KEY` từ biến môi trường.
   - Trước khi ghi: truy vấn `test_items?test=eq.<test>&select=id`; nếu đã có hàng của đề đó thì DỪNG (không ghi đè), trừ khi có `--replace-existing`. Không bao giờ ghi vào `test` không bắt đầu bằng `zenlish_`.
   - Ghi bằng REST `POST /rest/v1/test_items?on_conflict=id` kèm `Prefer: resolution=merge-duplicates`, lô 50 hàng.
   - Hình: tải lên Supabase Storage bucket `toeic`, đường dẫn `listening/img/<tên file>` (công khai); đặt `[img]` URL = `<SUPABASE_URL>/storage/v1/object/public/toeic/listening/img/<tên file>?v=1`. Trong dry-run, URL này đã được điền sẵn trong JSON.
   - Audio: KHÔNG tự tải. In lệnh gợi ý: `py tools\game-worker\upload_audio.py audio\TEST_<test>_LC.mp3` (Thảo sẽ chạy với token Cloudflare tạm).

## 3. Quy ước mã (khớp app, không đổi)
- `test` = `zenlish_<bộ>-<số đề>` (bắt buộc có đúng MỘT dấu `-`, vì app tách `<sách>-<số>`): `zenlish_2026-1`, `zenlish_hacker3-4`, `zenlish_hacker2-10`. TUYỆT ĐỐI không dùng dạng `zenlish_2026_test01`.
- `id` = `<tiền tố>_t<số đề>_p<part>_<num>`, vd `zl26_t1_p5_101`, `zlh3_t4_p3_32`. Duy nhất toàn bảng.
- Tên hiển thị (chỉ để ghi trong `out\catalog_display.json`, app tự dựng): `[Zenlish] 2026 Test 01`, `[Zenlish] Hacker 3 Test 04`.

## 4. Schema JSON đầu ra (mỗi phần tử = 1 hàng bảng test_items; chỉ dùng đúng các khoá này)
```json
{
  "id": "zl26_t1_p5_101",
  "exam": "toeic",
  "test": "zenlish_2026-1",
  "part": 5,
  "num": 101,
  "stem": "Rather than restocking products ..., the store donates _______ to local charities.",
  "stem_vi": null,
  "opts": ["(A) it", "(B) its", "(C) their", "(D) them"],
  "answer": "D",
  "tag": null,
  "explain": null,
  "passage": null,
  "src": "ZENLISH:test-1-2026",
  "answer_src": "key"
}
```
Quy tắc theo Part:
- Part 1 (num 1–6): `stem` = "Look at the picture. Choose the statement that best describes it."; `opts` = ["(A)","(B)","(C)","(D)"] (nếu nguồn có chữ mô tả thì để "(A) chữ..." ); `passage` = "[img] <url hình>\n[aud] q=<a>-<b>".
- Part 2 (7–31): `stem` = "Listen and choose the best response."; `opts` có ĐÚNG 3 phần tử ["(A)","(B)","(C)"] (hoặc kèm chữ nếu nguồn có); `passage` = "[aud] q=<a>-<b>". Nếu có transcript tiếng Anh thì để vào `explain`, không vào stem.
- Part 3 (32–70) và Part 4 (71–100): `stem` = câu hỏi; `opts` 4 phần tử "(A) …"; `passage` = "🎧 Conversation · questions 32–34" (Part 4: "🎧 Talk · questions 71–73") + (nếu có hình) "\n[img] <url>" + "\n[aud] q=<a>-<b> g=<a>-<b>" với g của cả 3 câu trong nhóm GIỐNG NHAU.
- Part 5 (101–130): `stem` có chỗ trống `_______`; `passage` null.
- Part 6 (131–146): `passage` = nguyên bài ("Questions 131-134 refer to the following e-mail.\n\n..."), chỗ trống ghi `------- [131]`; `stem` = câu có chỗ trống (hoặc câu cần chèn).
- Part 7 (147–200): `passage` = nguyên văn bài đọc của nhóm (nhiều bài thì nối bằng dòng trống, giữ đúng thứ tự); `stem` = câu hỏi.
- `answer` ∈ A–D (Part 2: A–C). `answer_src` = "key" nếu đáp án lấy từ trang; nếu không có đáp án, để `answer` null và ghi vào gaps (KHÔNG tự giải rồi gán "key").
- `src` = "ZENLISH:<slug trang>". `created_at` do DB tự điền, không xuất. Đa ngôn ngữ/từ vựng: để `i18n`, `vocab` vắng mặt.
- Văn bản: UTF-8, bỏ HTML, giữ xuống dòng bằng \n, trim; không để ký tự thừa của giao diện ("Show answer", số thứ tự, v.v.).

## 5. Tự kiểm bắt buộc (`scripts\validate.py <test>`, phải in PASS cho thí điểm trước khi làm tiếp)
1. Đủ 200 hàng; theo Part: 6/25/39/30/30/16/54; `num` 1..200 không thiếu/trùng; `id` duy nhất; `test` đúng mẫu `^zenlish_[a-z0-9]+-\d+$`, chỉ 1 dấu "-".
2. `opts`: Part 2 đúng 3, các Part khác đúng 4 phần tử; mỗi phần tử Part 3–7 bắt đầu bằng "(A) ".."(D) " và có chữ; `answer` hợp lệ cho cả 200 câu.
3. Part 1–4: mọi câu có `[aud] q=a-b` với a<b, tăng dần theo `num` (không chồng lấn), b ≤ độ dài file LC; Part 3–4 có `g=` và `g` kết thúc ≤ `q` bắt đầu của câu đầu nhóm; 3 câu trong nhóm có cùng `g`.
4. Mọi `[img]` trỏ tới file có thật trong `img\` (và >0 byte); Part 1 đủ 6 hình.
5. Part 6–7: `passage` không rỗng; Part 6 có đủ 4 chỗ trống mỗi bài (`[131]`…); không câu nào có `stem` rỗng.
6. Không có văn bản giữ chỗ ("Loading", "undefined", "null", "..."), không có hai đề trùng nhau.
7. Kiểm ngẫu nhiên: lấy 10 câu rải đều, mở lại trang gốc trên Playwright, so khớp stem/opts/answer, in bảng đối chiếu.
8. Nghe thử: cắt 5 đoạn audio theo `q=` (ffmpeg → file nhỏ trong `logs\clips\`) để người xem nghe khớp câu.
Kết quả ghi `logs\validate_<test>.md`. Thiếu/sai → sửa script rồi chạy lại, tối đa 3 vòng; vẫn lỗi thì dừng và báo.

## 6. Bàn giao
Trả lời cuối cùng phải có: (1) danh sách file đã tạo + đường dẫn; (2) bảng đối chiếu theo Part (có/cần) của đề thí điểm; (3) các điểm không chắc / dữ liệu thiếu (`gaps.md`); (4) đúng lệnh để chạy import ở chế độ dry-run, rồi `--apply`; (5) xác nhận rõ: chưa ghi vào Supabase/R2, chưa chạm kho cũ, không commit.
````

---

## D. Sau khi Codex xong (việc của Claude/Thảo, ngoài prompt)
1. Thảo xem báo cáo thí điểm; nghe thử clip; đồng ý thì cho cào 29 đề còn lại.
2. Chạy `import_to_supabase.py --dry-run`, rồi `--apply` với khoá Supabase tạm (nhắc thu hồi sau).
3. Tải audio R2 bằng `upload_audio.py` (token Cloudflare tạm).
4. Vá `tName/paintBooks` trong `js/game.js` để hiện `[Zenlish] 2026 Test 01`, bump version, thử trên web.
