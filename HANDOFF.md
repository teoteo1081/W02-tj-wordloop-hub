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
- **v48 đã có link riêng từng người** (👥 -> 🔗 Copy link, `game.html?p=<id>`): người mới vào bằng link chung, gõ tên 1 lần; TJ copy link riêng gửi họ, lần sau vào thẳng tài khoản. Đã giải thích cho TJ: tài khoản game (`game_players`) và tài khoản WordLoop (`profiles`) là 2 danh sách riêng, nối qua `game_players.profile_id` — hiện chỉ TJ và Anti_TJ đã nối; Aaron có cả 2 nhưng CHƯA nối (hỏi TJ có muốn nối không). TJ: "lát cân nhắc sau".
- **2026-10-02: đội 5 chuyên gia đã đánh giá** — toàn bộ ở README mục "🧭 Đánh giá 5 chuyên gia & lộ trình thương mại hoá". Đã sửa ngay (commit `29b729b`): topbar điện thoại 2 hàng vuốt ngang, Journey Tải lại, nút Learning/Game hiện sai. **Chờ TJ chọn bước tiếp**: bước 1 = bảo mật tối thiểu (backup hằng đêm, bỏ `read_all_profiles`, bảng từ vựng anon chỉ đọc, khoá AI proxy, hạn mức chi tiêu) — CẦN PAT mới; hoặc bước 2 = sửa nhanh (ẩn nút sửa với khách, logo 🔁 reload, PWA offline, tương phản, chữ Việt khi chọn English).
- **2026-10-02 (máy 2), game v49 → v64 — đã làm** (chi tiết từng bản ở README mục game): 🔊 đọc từ tiếng Anh (host đặt mặc định phòng, mỗi người tự bật/tắt + âm lượng; Từ→Nghĩa đọc 1 lần lúc câu hiện, dạng khác đọc từ đúng lúc lộ đáp án; loa nghe lại xám); Kahoot còn giờ được ĐỔI đáp án; kiểu ⚡ Đua tốc độ; host tải lại trang/mất mạng vẫn chơi tiếp (snapshot `tjwl_game_host_<MÃ>` + `G.outbox` gửi bù); F5 WordLoop giữ thẻ Game; tự cập nhật phiên bản (`GAME_VER` ⇔ `game-version.json`, hiện **64** — mỗi lần sửa game.js/css tăng CẢ HAI + `?v=`); thống kê (✓ đúng · đã làm a/N · còn N câu · % · câu/phút · TB s · ⏭ bỏ N) trên bảng xếp hạng + hàng trên cùng.
- **Sau đó (cùng ngày): v65–v67** — câu bỏ lỡ = sai; hàng trên 2 tầng + dải ô thống kê; nhắc "chạm 1 lần để bật tiếng" + đọc bù khi Chrome chặn. Live = **v67** (`game-version.json`).
- **Còn treo (game)**: (a) Kahoot khi host mất HẲN (không quay lại) vẫn đứng chờ — cần "người chơi tự lên làm host thay" (không cần đổi server; hỏi TJ có làm không); (b) ✅ XONG v65: câu bỏ lỡ = câu sai; (c) âm thanh: TJ sẽ test lại — chờ TJ xác nhận trên Chrome thật (máy tính / điện thoại) sau v63 (bỏ câu mồi dấu cách gây kẹt hàng đợi).
- **Quyết định còn treo cần hỏi TJ**:
  - Đồng ý hướng trên? Gửi PAT mới, hay "làm phần code trước" (chưa có ràng buộc DB)?
  - Game đẩy chu kỳ Tony Buzan đang tính MỌI dạng câu (kể cả 🔤 trắc nghiệm, dễ hơn Phiếu) — có muốn chỉ tính ⌨️ Gõ từ / 📝 Điền chỗ trống / 📄 Phiếu không?
  - WordLoop: thêm tab "✏️ Câu ngắn" (câu từ `game_gap_sentences`) sau 🔀 Nghĩa (đề xuất (a)) hay đổi tab 🔤 Từng câu sang câu ngắn (b)? Câu ngắn có đẩy chu kỳ không?
  - Game ghi vào Journey ("hôm nay ôn N từ bằng game")? Khu "❌ Từ đang sai"/"⭐ Ôn riêng" ở đầu cột chủ đề game? Bảng "từ còn yếu" sau ván?
  - 841 từ chưa có `level` (CEFR) — nhờ AI gắn?
  - Điện thoại: `.topbar-right` không co (~890px) -> cả trang WordLoop rộng hơn màn hình; đề xuất gom nút vào menu ☰ (TJ từng dặn không đổi bố cục mobile -> phải hỏi).
  - Bảo mật: gần như mọi bảng có policy `shared_all` cho anon (ai có anon key trong repo public cũng xoá được kho từ) — đề xuất sao lưu định kỳ + chỉ hồ sơ TJ được ghi (cần PAT).
- **2026-10-02 → 10-03 (máy 1), game v68 → v76 — đã làm, đã push** (chi tiết từng bản trong `git log`):
  - v68/v70/v75: điện thoại hết giật khi chọn đáp án — dải thống kê cố định (ô Câu/phút luôn có, 4 ô/hàng), dòng xếp hạng 1 dòng, dòng nhắc bật tiếng nổi ở đáy, đổi câu hiện dần 0.16s, đúng giữ 0.8s; Kahoot: ảnh người chọn nổi góc phải ô (ô không cao thêm), `#p-msg` giữ 2 dòng. Đo khung iPhone 13 + CPU 4×: 0 layout shift (Tự do + Kahoot).
  - v68: 🔊 nghe lại trong màn xem lại (nút + loa nhỏ cạnh từ đúng).
  - v69: nhãn cấp độ CEFR cạnh từ mọi dạng câu. **Dữ liệu**: đã bù `words.level` 819/833 dòng trống bằng gpt-4o-mini (chỉ ghi ô trống); 14 dòng cố ý để trống (12 mã mẫu thuế 1099/1095/1098/K-1 + 2 dòng không phải từ). Sao lưu trước khi ghi: `GITHUB_REPOS/_backups/words_level_before_2026-10-02.json` (ngoài repo).
  - v71: âm thanh lúc đọc lúc không — Kahoot câm từ ván 2 (`spoke` không xoá mỗi ván), tự đọc xếp hàng không cắt ngang, giữ `G.utt`, gỡ kẹt 6s, thử lại lỗi audio. **Chờ TJ nghe thử trên máy thật.**
  - v72: 🔀 Trộn có giây RIÊNG từng loại (Nghĩa · Từ→Nghĩa · Điền chỗ trống · Gõ từ; Gõ từ mặc định gấp đôi ≥ 20s).
  - v73: đang xem lại/kết quả/lịch sử KHÔNG tự tải lại khi có bản mới (`busyReading`); phần xem lại lưu sessionStorage + nút 📖 ở phòng chờ.
  - v74: ⭐ "Để dành học lại" trong màn xem lại -> `word_progress.bookmarked` của TJ (vào Hub ⭐ ÔN RIÊNG); `progUid()` = hồ sơ TJ hoặc người chơi gắn `profile_id` = TJ. **Dữ liệu**: đã gắn người chơi "Thảo" (`2254ff04-…`) vào hồ sơ TJ -> câu Thảo trả lời ghi tiến trình + chu kỳ Tony Buzan của TJ. 📜 Lịch sử: nút 📖 xem lại từng ván cũ (từ game_answers — chỉ biết đúng/sai).
  - v76: 📜 Lịch sử › Của tôi: "📖 Xem lại tất cả các ván" + "❌ Chỉ từ hay sai"; ẩn ván trống 0/0.
- **v77**: nhãn "🔒 Nghĩa: 🇨🇳 中文" cạnh ô Language khi host ép tiếng nghĩa (TJ chọn giữ giao diện theo từng người).
- **v78**: 🎯 **Ngôn ngữ đang học** (phòng chờ, host chọn): English (mặc định) · 中文 · Español · Tiếng Việt. Khác English: từ = `meaning_<target>`, nghĩa theo tiếng mẹ đẻ (tiếng Anh = chính từ tiếng Anh), đọc giọng zh-CN/es-ES/vi-VN; chỉ dạng Nghĩa / Từ→Nghĩa / Gõ từ / Trộn; tắt điền chỗ trống/phiếu/dictation/đặt câu, nhãn CEFR, ghi tiến trình WordLoop + ⭐. Gõ từ chấp nhận 1 trong các cách nói ("牛肉 / 羊肉 / 猪肉"). Chưa làm: lưu `target` vào game_rooms/game_matches (hiện chỉ trong state, tải lại phòng về English); lịch sử/xem lại ván cũ luôn hiện từ tiếng Anh.
- **v79–v84 (2026-10-03)**: tiếng mẹ đẻ không trùng tiếng đang học (ô mờ, nhãn "🎯 Học · Nghĩa"); nhãn dạng câu theo tiếng đang học; 🀄 pinyin (pinyin-pro) dưới chữ Hán ở mọi chỗ khi học tiếng Trung; học khác English thì 🔒 không tác dụng; v83 lịch sử theo đúng tiếng đã học + lưu đáp án đã chọn + không 2 đáp án trùng nghĩa; v84 sửa theo QA (đổi tiếng giữa câu không lộ đáp án, chấm gõ không dấu/dấu câu/dấu phân cách, 📺 theo tiếng phòng, cờ 🎯 trong lịch sử).
- **Dữ liệu 2026-10-03**: (1) PAT TJ cấp -> đã thêm cột `words.quiz_zh/es/vi`, `game_matches.target`, `game_answers.target/choice` (ghi ở tools/*.sql). **Nhắc TJ revoke PAT**. (2) gpt-4o-mini bổ sung `meaning_zh` 4.722 + `meaning_es` 3.851 ô TRỐNG (chỉ ghi ô trống); còn ~85 dòng cố ý trống (mã mẫu thuế, tên riêng, dòng có "/"). Danh sách ô trống trước khi ghi: `GITHUB_REPOS/_backups/words_zh_es_empty_before_2026-10-03.json`. (3) Đánh giá 3 chuyên gia (sư phạm, QA, ngôn ngữ) — phần chưa làm: AI làm gọn vào `quiz_*` (vi 21% có nhiều cách nói/giải thích), duyệt dịch sai (vd sweetheart -> 心肠好的人), giọng đọc khi máy không có giọng zh/vi, gõ pinyin thay chữ Hán.
- **Còn treo sau v76 (làm tiếp)**:
  - TJ xác nhận trên điện thoại thật: hết giật (v75) + âm thanh (v71).
  - Ván cũ không lưu ĐÁP ÁN ĐÃ CHỌN (game_answers chỉ có correct) — muốn xem lại đầy đủ cần cột mới (vd `game_answers.choice`) -> cần PAT.
  - Vẫn chưa trừ 9 câu test lỡ ghi vào word_progress TJ (Block 1, 2026-09-30) — chờ TJ đồng ý.
  - Test headless dùng phòng tạm `ZTEST` + người chơi `ZZ_*`, host để MC; script đo giật/âm thanh nằm ở scratchpad (không lưu) — viết lại theo mô tả trong commit v68/v70/v71/v75 nếu cần.
- **Commit/push gần nhất liên quan**: `056daa5` — "Game v76: 📖 xem lại TẤT CẢ các ván + ❌ chỉ từ hay sai"
- **Commit cũ hơn**: `eb5a82f` — "Game v46: tự đổi về người chơi gắn hồ sơ (hết TJ#3), màn 👥 Quản lý người chơi…"

<!-- MẪU khi cần điền (xoá dòng comment này, điền các mục dưới, xoá mục nào không có):

## Đang làm: <tên việc, 1 dòng>
- **Mục tiêu**: ...
- **Đã làm xong tới đâu** (kèm cách verify lại được ngay, đừng bắt phiên sau tự dò):
  - ...
- **Bước tiếp theo cụ thể**: ...
- **Quyết định còn treo cần hỏi người dùng** (nếu có): ...
- **Commit/push gần nhất liên quan**: `<sha>` — "<message>"

-->
