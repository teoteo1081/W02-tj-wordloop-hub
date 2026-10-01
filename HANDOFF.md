# HANDOFF.md — checkpoint TẠM giữa phiên (đọc kỹ luật trước khi tin nội dung bên dưới)

> **Đây KHÔNG phải nguồn sự thật lâu dài.** Muốn hiểu tổng thể app / xem việc dở dang đã được xác nhận → đọc `README.md` mục "Việc còn dang dở" và `CLAUDE.md` trước. File này chỉ tồn tại để 1 phiên **sắp hết token giữa chừng 1 tác vụ** ghi lại nhanh "đang làm gì, tới đâu" cho phiên/AI kế tiếp nối việc — không phải chỗ ghi quyết định kiến trúc hay backlog dài hạn.

## Luật dùng file này (bắt buộc, để khỏi lặp lại lỗi lệch thông tin 2026-09-10)
1. **Người viết** (phiên sắp hết token): điền đúng mẫu bên dưới, càng cụ thể càng tốt — nhất là "cách verify lại" (lệnh curl/REST API/Node cụ thể), đừng chỉ viết cảm nhận ("hình như đã xong").
2. **Người đọc** (phiên/AI kế tiếp): **verify lại bằng lệnh thật trước khi tin bất kỳ con số/trạng thái nào ở đây** — đừng thao tác tiếp dựa trên trí nhớ của phiên trước. Nếu lệch, tin vào thực tế (DB/code/git log), không tin file này.
3. **Khi xong việc HOẶC đã xác nhận xong 1 phần**: dời thông tin bền vững (quyết định, backlog còn lại) sang `README.md`/`CLAUDE.md`, rồi **XOÁ sạch nội dung đã xử lý** ở file này — không để chồng chất nhiều task cũ. Nếu không còn task nào đang treo giữa chừng, để nguyên trạng thái "trống" bên dưới, đừng xoá cả file (giữ làm chỗ có sẵn cho phiên sau).
4. **Không dùng file này để ghi kiến trúc/quyết định lâu dài** (đó là việc của `CLAUDE.md`) hay backlog nhiều-phiên (đó là việc của `README.md`) — chỉ ghi đúng 1 việc đang dở dang NGAY LÚC NGẮT PHIÊN.

## Trạng thái hiện tại

## Đang làm: Đơn giản hoá tài khoản game — "1 hồ sơ = 1 người chơi" (CHỜ TJ chốt, CHƯA code)
- **Mục tiêu**: hết cảnh TJ#2/TJ#3. Hiện có 2 hệ danh tính song song: hồ sơ WordLoop (`profiles`, nhận qua link `?u=`, localStorage `tjwl_link_user_id_v1`) và người chơi game (`game_players`, localStorage `tjwl_game_player_v1`, trùng tên tự đánh `name_no`). Xoá cache -> máy quên cả 2 -> game tạo người mới #N.
- **Đề xuất đã gửi TJ (2026-10-01, máy 2)**:
  1. Ai có hồ sơ WordLoop -> người chơi = hồ sơ đó, bỏ màn nhập tên, mỗi hồ sơ đúng 1 `game_players` (DB: unique index trên `profile_id` where not null).
  2. Khách không hồ sơ -> chỉ gõ tên, **bỏ đánh số #2/#3: cùng tên = cùng người** (DB: unique trên `lower(name)`); đổi máy/xoá cache gõ lại tên là về tài khoản cũ.
  3. TJ xoá cache -> mở link bookmark `index.html?u=<HOST_PROFILE_ID>` (id nằm trong `js/game.js`).
- **Đã làm xong tới đâu** (v46, commit `eb5a82f`): vá tạm — `loadProfile` tự đổi về người chơi gắn hồ sơ; màn 👥 Quản lý người chơi (đổi tên/gộp/xoá); đã gộp dữ liệu TJ#2/#3 -> TJ, Anti_TJ#2-4 -> Anti_TJ, Anti_TJ#1 gắn lại hồ sơ Anti_TJ. Verify: `curl "$SB_URL/rest/v1/game_players?select=name,name_no,profile_id&order=created_at" -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY"` -> phải còn 6 người, không ai có `name_no` > 1 (TJ, Anti_TJ, Dung, Son D, Son, Aaron).
- **Bước tiếp theo cụ thể** (nếu TJ đồng ý): sửa `renderNameScreen` + `loadProfile` trong `js/game.js` (bỏ tạo `name_no` mới, tên trùng = đăng nhập lại; có hồ sơ thì bỏ qua màn tên, tự tạo/gắn 1 người chơi); thêm 2 unique index ở trên vào `tools/game_schema.sql` và chạy qua Management API (cần TJ tạo PAT mới, chạy xong nhắc revoke).
- **TJ hỏi "người dùng tạo tên xong mình vẫn control được trong TJ admin?"** -> đã trả lời: có, qua 👥 Quản lý người chơi (đổi tên / gộp / xoá), giữ nguyên sau khi đổi cách. TJ: "tạm ổn", chỉ GHI ĐỀ XUẤT thêm (chưa làm): (a) đưa 👥 vào menu Admin của WordLoop (không cần mở phòng game); (b) chặn tên (không cho vào chơi); (c) "nâng" khách lên hồ sơ WordLoop (gắn `profile_id`, giữ lịch sử game).
- **Quyết định còn treo cần hỏi TJ**:
  - Đồng ý hướng trên? Gửi PAT mới, hay "làm phần code trước" (chưa có ràng buộc DB)?
  - Game đẩy chu kỳ Tony Buzan đang tính MỌI dạng câu (kể cả 🔤 trắc nghiệm, dễ hơn Phiếu) — có muốn chỉ tính ⌨️ Gõ từ / 📝 Điền chỗ trống / 📄 Phiếu không?
  - WordLoop: thêm tab "✏️ Câu ngắn" (câu từ `game_gap_sentences`) sau 🔀 Nghĩa (đề xuất (a)) hay đổi tab 🔤 Từng câu sang câu ngắn (b)? Câu ngắn có đẩy chu kỳ không?
  - Game ghi vào Journey ("hôm nay ôn N từ bằng game")? Khu "❌ Từ đang sai"/"⭐ Ôn riêng" ở đầu cột chủ đề game? Bảng "từ còn yếu" sau ván?
  - 841 từ chưa có `level` (CEFR) — nhờ AI gắn?
  - Điện thoại: `.topbar-right` không co (~890px) -> cả trang WordLoop rộng hơn màn hình; đề xuất gom nút vào menu ☰ (TJ từng dặn không đổi bố cục mobile -> phải hỏi).
  - Bảo mật: gần như mọi bảng có policy `shared_all` cho anon (ai có anon key trong repo public cũng xoá được kho từ) — đề xuất sao lưu định kỳ + chỉ hồ sơ TJ được ghi (cần PAT).
- **Commit/push gần nhất liên quan**: `eb5a82f` — "Game v46: tự đổi về người chơi gắn hồ sơ (hết TJ#3), màn 👥 Quản lý người chơi…"

<!-- MẪU khi cần điền (xoá dòng comment này, điền các mục dưới, xoá mục nào không có):

## Đang làm: <tên việc, 1 dòng>
- **Mục tiêu**: ...
- **Đã làm xong tới đâu** (kèm cách verify lại được ngay, đừng bắt phiên sau tự dò):
  - ...
- **Bước tiếp theo cụ thể**: ...
- **Quyết định còn treo cần hỏi người dùng** (nếu có): ...
- **Commit/push gần nhất liên quan**: `<sha>` — "<message>"

-->
