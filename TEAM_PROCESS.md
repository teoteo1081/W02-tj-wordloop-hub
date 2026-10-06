# TEAM_PROCESS.md — cách làm việc của "đội Agent" của TJ

> Mọi Agent/phiên Claude (cloud, máy local, nhiều repo) đọc file này trước khi nhận việc. Lập 2026-10-05 từ những gì TJ **thật sự dặn** trong phiên "Build app học từ vựng" (trích nguyên văn bên dưới) + phần **đề xuất** lấy từ quy trình công ty phần mềm (đánh dấu rõ, chờ TJ duyệt). Chưa tìm thấy chữ "tiền kiểm / hậu kiểm" trong phiên này — nếu TJ nói ở phiên khác thì bổ sung vào đây, ghi rõ nguồn.

## 1. Việc nào cũng đi qua 3 cổng
**Tiền kiểm (trước khi làm)**
- [TJ dặn] *"bàn trước nha"*, *"Trình mình xem trước nhé"*, *"Cho mình artifact để xem nha"*, *"Okay thử và gởi link artifact cho mình xem nha"*: việc mới/lớn hoặc tốn tiền -> **đề xuất + mẫu nhỏ cho TJ xem/duyệt TRƯỚC** (artifact/ảnh/số liệu thử), rồi mới làm hàng loạt. (Ví dụ đã làm: mẫu 100 từ bẫy -> TJ duyệt -> mới soạn 6.000 từ.)
- [TJ dặn] *"tốn tiền cho vui hả?"*, *"Mình muốn kiểm tra thời gian và tài nguyên free còn lại"*, *"Kho từ lưu ở đâu? Có tốn token hay bộ nhớ hong"*: **nói trước ước tính chi phí** (USD/token/dung lượng Supabase) và **báo chi phí thật sau khi chạy**; việc tốn tiền phải được TJ đồng ý.
- [TJ dặn] *"nhớ kiểm xem là file với bài test có đúng hong nha"*: kiểm **nguồn vào đúng chưa** (file đúng bài, đúng Test/Part) trước khi nhập.
- [CLAUDE.md] đọc README + CLAUDE.md; backup trước khi sửa dữ liệu người dùng; kiểm xem agent khác đang làm gì (git fetch, xem nhánh) để không đè việc nhau.
- [Đề xuất] Xem có trùng việc đang chạy không; rủi ro bản quyền (sách, đề ETS), dữ liệu khách hàng; có đủ quyền/ngân sách không.

**Trong khi làm**
- [TJ dặn] *"làm song song luôn đi, tất cả task"* (trong ngân sách ~100 USD/24h): chia việc độc lập cho nhiều Agent chạy song song.
- Mỗi Agent một nhánh/khu vực riêng; không ghi đè nhánh người khác (xem CLAUDE.md); tăng `?v=`/`GAME_VER` khi sửa JS/CSS; push `main` bằng lệnh riêng.

**Hậu kiểm (sau khi làm, TRƯỚC khi báo "xong")**
- [TJ dặn] *"Cử ra nguyên đội agent để kiểm tra mọi thứ nhé, cẩn thận vào"*, *"cho agent vào kiểm tra kỹ lại đi nha"*, *"Là bạn ko cử ra agent để testing dc hả"*: **luôn có Agent QA độc lập** (Playwright, giả lập điện thoại + CPU chậm) thử lại — người làm không tự chấm bài mình.
- [TJ dặn] *"tự xem giao diện của điện thoại ... một bậc thầy về designer có chấp nhận dc hong?"*, *"tự xem có gì kỳ lạ hong"*: tự chụp màn hình điện thoại + máy tính xem như chuyên gia thiết kế (chữ đều, không che nội dung, nút bấm được) rồi mới giao.
- [CLAUDE.md] verify bằng Node/Playwright; **QA game BẮT BUỘC dùng phòng riêng `ZZ_QA_*`, không bao giờ vào phòng thật "TJ"**.
- [TJ dặn] *"Xong đẩy lên mình vào kiểm liền"*: đẩy lên web rồi nhắn TJ **link + việc cần TJ kiểm**; nói rõ cái gì đã thử thật, cái gì CHƯA thử (không nói "xong" khi chưa thử).
- [TJ dặn] *"Ko nha. Game cũ có thống kê và hình thức sao thì giữ vậy"*: không đổi thứ TJ đã chốt khi làm chức năng mới.
- Báo cáo: nêu chi phí thật, lỗi QA tìm được + đã sửa gì, còn treo gì.

## 2. Vai trò (đề xuất — TJ chọn)
| Vai | Việc | Không được làm |
|---|---|---|
| Điều phối | Giữ `PROGRESS.md`/README, chia việc theo khu vực, nhắc TJ việc treo | Không tự sửa code của người khác |
| Builder | Làm 1 việc trên nhánh riêng | Không tự chấm bài mình, không merge khi chưa qua QA |
| QA | Thử độc lập (Playwright, điện thoại) + chụp màn hình | Không vào phòng game thật, không sửa code |
| Chuyên gia (thiết kế / sư phạm / bảo mật) | Đánh giá theo vai | Không đẩy lên `main` |

## 3. Chỗ ghi tiến độ chung
- Nguồn thật = **file văn bản trong git** (`README.md` "Việc còn dang dở" hiện tại; có thể thêm `PROGRESS.md`), KHÔNG dùng Excel/Supabase làm nguồn chung (ghi đè nhau / tốn Storage). Excel chỉ là bản xem tự sinh: `python3 tools/readme_to_xlsx.py` (cần `pip install openpyxl`) -> `TJ_CongViec.xlsx` gồm sheet Tóm tắt / Việc còn dang dở / Đã xong gần đây (không commit file .xlsx; Ưu tiên/Trạng thái là script ĐOÁN từ README).
- Phiên sắp hết token: ghi checkpoint vào `HANDOFF.md` rồi dọn khi xong (luật trong file đó).

## 4. Việc TJ đang chờ (lấy từ README, cập nhật 2026-10-06; ưu tiên hiện tại: EA + Digital Marketing)
~~Duyệt 1.301 bẫy pending~~ (XONG 2026-10-06: AI chấm lần 2 -> 72 duyệt / 1.042 loại / 187 chờ, xem README); bật GitHub Pages/public cho L02, L05–L08 (xem cảnh báo bản quyền L08/L04); đăng ký custom dimension `site` trong GA4; revoke token Supabase (nếu còn); chọn 3–5 KPI cho dashboard.
