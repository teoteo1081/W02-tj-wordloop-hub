# 🪝 EXAMS_HOOKS.md — Điểm móc để thêm hub EA / IELTS / DM vào game (điều tra 2026-10-05)

Kết quả nhân viên Điều tra, **số dòng theo `main` lúc đó (v150) và đã kiểm lại 4 điểm lớn bằng grep**; số dòng sẽ trôi — tìm lại bằng tên hàm/chuỗi. Kế hoạch tổng: `docs/EXAMS_PLAN.md`, đội/cổng: `docs/TEAM.md`.

## Kết luận
- `board.js`, `app.js`, `gamelayer.js` **không** chứa gì riêng TOEIC; gần như tất cả nằm trong `js/game.js` + 1 dòng `game.html` (nút hub, hộp `#l-hub-test`).
- Cờ nội bộ `qtype==="toeic"` / `q.type==="toeic"` (~60 chỗ) thực chất nghĩa "ván đề thi" → **giữ nguyên tên**, đừng đổi. Thêm trường mới cho môn, vd `G.exam` = `toeic|ea|ielts|dm` và `st.xm` trong trạng thái phòng.
- ⚠️ **`st.exam` ĐÃ LÀ cờ boolean "📝 Thi thật"** (game.js ~3276). Tuyệt đối không dùng tên này cho "môn".

## Chỗ CHẮC CHẮN phải sửa (tham số hoá theo môn, không đổi hành vi TOEIC)
| Chỗ | Vấn đề | Cách |
|---|---|---|
| `ensureTest` (~734–748), `loadTestList` (~3185), 📊 `tStats` (~3075), lời thoại `SCR` (~2427) | cứng `.eq("exam","toeic")`; cache `"toeic:"+…` → EA test "1" đụng TOEIC test "1" | lấy `exam` từ `G.exam`; khoá cache thêm tên môn |
| `tKey` (~3962) | `"toeic:<test>:<part>:<num>"` là `game_answers.term`, đọc lại ở nhiều nơi | môn ≠ toeic dùng tiền tố `ea:`/`ielts:`/`dm:`; **giữ nguyên `toeic:`** để không mất dữ liệu cũ. Key 🔖 `tq:…` cũng thêm môn |
| `part<=4` = Listening (≥8 chỗ: ~3212, 3228, 3241, 3256–3257, 3277, 3299, 3986–3987) | EA part 1–3 / DM part 1–5 sẽ bị bật chế độ audio, khóa giờ, "Thi thật" không tới Reading | cờ `listening(part)` trong cấu hình môn |
| `tNum`/`tBook`/`tName` (~3191–3211) | ép mã đề thành số: `R1`/`L1` → NaN, sắp sai | đưa vào cấu hình môn; `test` luôn là chuỗi |
| `setHub` (~3320) | ép `h = h==="test" ? "test" : "vocab"` | nhận thêm `ea/ielts/dm` → `G.hub="test"` + `G.exam=h`; TOEIC giữ đường cũ |
| `exSubmit` (~3908–3925), 📊 | cứng "Listening/Reading", "/990", điểm TOEIC | gọi `xm().score(...)` nếu có (EA %, IELTS band, DM điểm vòng) |
| `#t-start` (~3271) | bắt buộc `test` khác rỗng | DM không có đề → dùng giá trị cố định (DM: `"dm1"` — KHÔNG dùng `"1"`, trùng mã đề TOEIC) |
| `paintTestHub` (~3003) | HTML cứng TOEIC (Bộ đề ETS, 200 câu, P1–P7, Audio…); `el.dataset.done` chặn dựng lại | **giữ nguyên cho TOEIC**; `exams.js` vẽ form riêng vào hộp `#l-hub-<môn>` |
| `TINTRO`/`paintTIntro` (~3128–3135), `TOEIC_TIPS` | phòng chờ chỉ có nội dung TOEIC (4 ngôn ngữ) | `TINTRO` theo môn |
| `css/game.css:470` | `.g-hubtest > :not(.g-hubs):not(#l-hub-test){display:none!important}` | thêm `#l-hub-ea,#l-hub-ielts,#l-hub-dm` vào `:not(...)`, nếu không nội dung phòng chờ hiện lẫn |
| `tCue` (~2219) | audio: tự trả `null` nếu passage không có dòng `[aud]` → EA/DM/IELTS Reading **tự không có audio** | chỉ cần đổi đường dẫn khi có audio IELTS (`toeic/listening/TEST_<n>_LC.mp3` đang cứng) |

## Móc nhỏ nhất (đề xuất)
1. `game.html`: thêm `<script src="js/exams.js?v=1">` **trước** `game.js`; thêm nút hub (hoặc 1 danh sách chọn "Môn thi" nếu 4 nút không vừa điện thoại).
2. `game.js`: `var XM = window.Exams || null; function xm(){ return (XM && XM[G.exam||"toeic"]) || null; }` — thiếu file thì TOEIC chạy như cũ. Mỗi hook 1–3 dòng, đặt `if (xm())` **trước** đường cũ.
3. Làm **1 PR "móc" không đổi hành vi** trước, rồi mỗi môn 1 PR.
4. Tăng đủ 3 chỗ phiên bản khi đổi `game.js`: `game-version.json`, `?v=` trong `game.html`, `GAME_VER` trong `game.js`; đổi `css/game.css` thì tăng `?v=` css. `tools/gate.sh all` trước khi xin gộp.

## Dữ liệu `test_items` (đã kiểm)
- Cột bắt buộc để chơi: `id, exam, test, part, num, stem, opts, answer`. Không có ràng buộc DB về `part` 1–7 hay `answer ∈ A..D`.
- `opts` 3 đáp án chạy được (lưới nút sinh bằng `.map`, chấm theo chữ đáp án không theo vị trí; không có phím tắt A–D). **Nên lưu `opts` có tiền tố "(A) "** vì `toeicFull`/gỡ tiền tố/`g-tabcd` giả định dạng đó.
- `passage` dài (IELTS Reading, tình huống DM) hiển thị tốt ở Tự do/Thi thật (khung cuộn, mobile `max-height:none`); **chưa thử ở Kahoot** (có thể quá dài) và Đua chưa có xử lý riêng.
- `i18n[L].explain/tag/stem` dùng nguyên; riêng DM cần chỗ hiện `level` (chinh|xam|ta) → thêm hook nhỏ ở `toeicExpl`.
- Đề xuất đã chốt trong kế hoạch: `level`/`refs` nằm trong `i18n.meta` (không đổi bảng). **Vẫn hỏi TJ trước khi đổi cấu trúc bảng.**

## Xung đột
`game.js` là file nóng nhất (có mặt ở v141–v150: Xem lại, audio Listening, Thi thật/Tự do — đúng các hàm ta móc vào). Chưa thấy nhánh nào khác ngoài `main`; chưa kiểm PR đang mở. Luôn gộp `main` mới nhất vào nhánh trước khi làm.

## Câu hỏi còn treo cho TJ
4 nút hub ngang có vừa điện thoại không, hay gộp 1 danh sách "Môn thi"? · EA "Thi thử" mỗi Part 100 câu/3,5 giờ tính thế nào khi nhiều người chơi? · IELTS Listening: file chính thức hay giọng máy tạm? · giữ `toeic:` cho thống kê cũ (đề xuất: giữ).
