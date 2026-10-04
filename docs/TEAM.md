# 👥 TEAM.md — Đội AI & cổng kiểm tra (TJ chốt 2026-10-04)

> TJ chỉ nói chuyện với **1 leader**; dưới leader là cả đội làm việc. File này là bộ nhớ lâu dài để **phiên nào cũng dựng lại được đội** (hồ sơ từng vai nằm ở `.claude/agents/*.md`).

## 1. Vai trò

| Vai | File hồ sơ | Làm gì | Được ghi file? |
|---|---|---|---|
| 👑 **Leader** | (chính là phiên đang nói chuyện với TJ) | Nhận yêu cầu, chia việc, gom kết quả, báo TJ bằng tiếng Việt dễ hiểu, **giữ cổng cuối** (chỉ leader gộp/đẩy `main`, và chỉ khi TJ đồng ý) | ✅ |
| 🧭 Điều tra | `explorer.md` | Đọc code/dữ liệu, báo xung đột + điểm móc, KHÔNG sửa | ❌ |
| 🏗️ Thợ code | `builder.md` | Viết code theo kế hoạch, mỗi người 1 nhánh/1 file riêng | ✅ (chỉ vùng được giao) |
| ✍️ Biên soạn | `writer.md` | Soạn câu hỏi/tình huống/bài đọc thành JSON, tự chạy `gate_items.py` | ✅ (chỉ thư mục được giao) |
| 🧪 Kiểm thử | `qa-tester.md` | Chạy trình duyệt tự động an toàn (offline hoặc phòng `ZZ…`), đo hồi quy | ❌ code |
| 🔍 Kiểm toán độc lập | `auditor.md` | Đọc **diff** của người khác, tìm lỗi/vi phạm `CLAUDE.md` | ❌ |
| 🛡️ Tuân thủ | `compliance.md` | Khóa bí mật, bản quyền, quyền dữ liệu, chính sách nền tảng (cho game Digital Marketing) | ❌ |
| 🚦 Hậu kiểm | `release-checker.md` | Sau khi lên web: đúng phiên bản chưa, TOEIC còn nguyên không | ❌ |

**Quy tắc cứng**
1. **Người làm ≠ người kiểm.** Thợ code/Biên soạn không tự duyệt bài của mình.
2. **Chỉ leader mới `merge`/push `main`**, và chỉ sau khi TJ nói đồng ý. Mỗi giai đoạn = 1 PR riêng. Gộp bằng đúng `expectedHeadSha` (không gộp "bản nào cũng được").
3. **QA KHÔNG BAO GIỜ vào phòng thật "TJ"** (từng xảy ra 2026-10-04). Chỉ dùng `tools/gate.sh browser` (chặn hết Supabase + WebSocket) hoặc phòng riêng mã `ZZ…`.
4. Không dán khóa/token vào file hay chat; không commit PDF/âm thanh/đề bản quyền (repo public).
5. Ghi vào DB thật chỉ khi **thêm mới**, ghi lại id đã thêm để xóa được; sửa dữ liệu người dùng thì **backup trước**.
6. Việc nhỏ dùng 1–2 người; việc lớn 4–6. Mỗi người phải đọc lại bối cảnh từ đầu nên càng nhiều người càng tốn.

## 2. Luồng làm việc và 4 cổng (gate)

Gate = chốt kiểm tra **Đạt / Không đạt**; không đạt thì **dừng, sửa, chạy lại**. `⏭️ bỏ qua` (không kiểm được) **không phải là đạt**.

| Cổng | Khi nào | Lệnh | Không đạt thì |
|---|---|---|---|
| 🚪 **0** | Trước khi làm | `tools/gate.sh pre` (phần Cổng 0) + đọc `CLAUDE.md`, `git fetch`, xem ai đang sửa gì | Dừng, hỏi TJ |
| 🚪 **1** | Trước khi lưu/đẩy | `tools/gate.sh pre` — cú pháp JS, JSON, 2 file starter khớp version, `game-version` khớp `game.html`, **đã tăng `?v=`**, không lộ khóa, không PDF/âm thanh, câu hỏi mới qua `gate_items.py` | Sửa rồi chạy lại, không được đẩy |
| 🔍 **Duyệt diff** | Trước cổng 2 | Auditor đọc `git diff origin/main...HEAD` (người khác viết) | Trả về Thợ code |
| 🚪 **2** | Trước khi xin gộp | `tools/gate.sh all` — thêm `data` (**hồi quy** TOEIC/Hub) và `browser` (mở trang, không lỗi JS, không tràn điện thoại) | Không gộp |
| 🚪 **3 — hậu kiểm** | Sau khi gộp | `tools/gate.sh post` + leader đối chiếu workflow "pages build and deployment" **đúng commit sha vừa gộp** | Đề xuất **hoàn tác (revert)** ngay |

**Giới hạn thật thà:** gate chỉ bắt lỗi *đã viết thành luật*. "Game có vui/dễ hiểu không" và nội dung đúng/sai về thuế, IELTS, marketing phải có người đọc (Auditor + TJ). Cổng 3 từ sandbox cloud có thể không truy cập được `github.io` → báo ⏭️, leader kiểm bằng công cụ GitHub.

**Đã thử cổng (2026-10-04):** trên `main` lúc đó mọi cổng ĐẠT (2.000 câu TOEIC · 70 nhóm đề:part · 10 hub · 32 file JS). Thử gây lỗi cố ý: cú pháp JS, `starter` lệch version, `sb_secret_…`, file `.pdf`, quên tăng `?v=` → cổng **bắt đủ 5/5**. Lần đầu cổng trình duyệt báo ❌ giả (do `keys.local.js` cố ý không có trong git và CDN bị chặn trong sandbox) → đã sửa cổng, không sửa website.

## 3. Từ điển đội

| Từ | Nghĩa dễ hiểu |
|---|---|
| **diff** | Bảng "cái gì đã đổi": dòng thêm, dòng xóa. Người kiểm đọc diff, không đọc cả dự án |
| **commit** | 1 lần lưu thay đổi kèm lời mô tả. Mỗi commit nên làm đúng 1 việc |
| **commit sha** | Mã số duy nhất của 1 commit (40 ký tự). Dùng để chỉ ĐÚNG bản cần gộp/kiểm, không nhầm bản khác |
| **sha mới nhất** | Mã của commit cuối trên `main` — hậu kiểm phải chắc web live được build **từ đúng sha này**, không phải bản cũ còn cache |
| **hồi quy (test regression)** | Sau khi thêm cái MỚI, chạy lại phép đo của cái CŨ để chắc nó **không hỏng**. Ví dụ: thêm hub EA thì TOEIC vẫn phải đủ 2.000 câu/70 nhóm và mở được (`tools/gate_data.py`) |
| **index** | `index.html` — trang cửa chính. Mọi file JS/CSS nạp ở đây kèm `?v=N`; đổi file mà quên tăng `?v=` thì trình duyệt giữ bản cũ |
| **compliance (tuân thủ)** | Có đúng luật/điều khoản không: bản quyền đề thi, quyền riêng tư, chính sách quảng cáo Meta/Google/TikTok, luật quảng cáo & bảo vệ người tiêu dùng. Là chủ đề cốt lõi của game Digital Marketing (chính/xám/tà đạo) |
| **seeding** | (marketing VN) Người của thương hiệu đóng vai khách thật đi khen/hỏi mua để tạo "hiệu ứng đám đông". Có công khai thì là chính đạo; **giấu danh tính để lừa** thì là xám→tà đạo. Đưa vào tình huống game DM |
| **pinterest** | Nền tảng ảnh/tìm kiếm trực quan — đưa vào tình huống game DM (ghim bài thật có giá trị vs spam ghim hàng loạt trùng lặp) |
| **gate / pass / fail / skip** | Cổng / đạt / không đạt / không kiểm được (≠ đạt) |

## 4. Hồi quy — danh sách phải còn nguyên sau MỌI thay đổi

Tự động (`tools/gate.sh data` + `browser`): 2.000 câu TOEIC · 70 nhóm (đề:part) y hệt `tools/gate_baseline.json` · đủ 10 Hub cũ · `index.html` và `game.html` mở không lỗi JS ở cả máy tính + điện thoại 375 px.
Chụp mốc mới **chỉ khi chủ ý đổi TOEIC**: `python3 tools/gate_data.py --update-baseline` (nói rõ trong PR).
Thủ công (QA ở phòng `ZZ…`, TJ xem): chơi 1 ván TOEIC Part 5 → Xem lại; mở hub 🎯 TOEIC thấy đủ Part 1–7; mở 1 Block từ vựng bình thường.
