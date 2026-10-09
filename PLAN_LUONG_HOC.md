# PLAN_LUONG_HOC.md — sắp xếp lại luồng học TJ WordLoop (đề xuất 2026-10-08, CHỜ TJ DUYỆT)

> Mục tiêu của TJ: mỗi khoá (TOEIC, EA, Marketing, CIA 1000 câu EN-ES-CN…) có **một trang riêng dễ hiểu**, đi theo một luồng học rõ, gắn với game ôn bài; TJ là admin + host nên cần chỗ quản trị; giao diện bắt mắt, nội dung hút người học chung.
> Số liệu lấy từ Supabase thật + code ngày 2026-10-08. Chưa chơi thử toàn bộ luồng trên trình duyệt.

## 1. Các khái niệm trong web (hiện tại)
| Khái niệm | Là gì | Ví dụ |
|---|---|---|
| **Hub** | Một khoá / một chủ đề lớn (tab trên thanh trên cùng) | TJ (TOEIC), EA2025, DIGITAL MARKETING, CIA_Top Secret |
| **Notebook → Section → Page → Batch → Block → Word** | Cây nội dung. **Block = 10 từ** là đơn vị học và ôn | |
| **Learning** | Màn học: bài học, bài đọc, 3 kiểu kiểm tra, chu kỳ ôn Tony Buzan | |
| **Journey / ⭐ Ôn riêng / ❌ Fix lỗi sai** | Theo dõi tiến độ, từ đã ⭐, từ hay sai | |
| **🎮 Game (phòng game)** | Chơi chung nhiều người, host điều khiển, có xếp hạng | Mã phòng TJ |
| **🖤 Bảng** | Bảng chung trong phòng game: đọc sách/PDF/bài học cùng nhau, vẽ, tra từ | |
| **Góc tự học** | Thanh thẻ trong trang game: 🎮 Từ vựng · 🎯 TOEIC · 🧾 EA · 📣 Marketing | EA Quest, Marketing Quest chơi một mình |
| **Trang riêng của Hub** | Hiện chỉ CIA có (mở nguyên trang L00 trong lớp phủ) | |
| **Admin / Host / Người chơi** | Admin = quản hệ thống; Host = điều khiển phòng (hiện cả hai đều là hồ sơ TJ); Người chơi vào bằng link | |

## 2. Vì sao đang lộn xộn (đo từ code và dữ liệu)
1. **Chữ "Hub" và "Game" mang nhiều nghĩa.** "Hub" vừa là tab khoá học ở thanh trên, vừa là 2 chế độ trong game (vocab/test). "Game" vừa là thẻ 🎮, vừa là trang game.html, vừa là phòng.
2. **Một khoá nằm ở 3–4 nơi.** EA: Hub EA2025 (79 Block, 440 từ) + EA Quest (620 từ, 378 câu, chơi riêng) + 377 câu EA trong `test_items` + repo L04. Marketing: Hub (73 Block) + Marketing Quest + bài `mk` trên Bảng + repo L02.
3. **Hai hệ tiến độ không nối nhau.** WordLoop lưu chu kỳ ôn trên Supabase; EA/Marketing Quest chỉ lưu `localStorage` từng máy → Journey không tính.
4. **Tên Hub khó hiểu.** Hub "TJ" thực chất là TOEIC (35 notebook, 1.301 Block, 9.814 từ). Hub ENGLISH FILE và IELTS đang trống.
5. **Thanh trên quá tải:** Trang chủ, Journey, Ôn riêng, Fix lỗi sai, Learning, Game, Bảng, sáng/tối, ngôn ngữ, user… Người mới không biết bắt đầu từ đâu.
6. **Điều hướng nhảy sai** giữa Learning ↔ Game ↔ Bảng (nút "Game →" trên Bảng không sang trang Game vì thiếu bộ nhận tin `tjwl-game-show`; xem phân tích trước).
7. Nội dung khoá chỉ có **một** khoá có trang riêng (CIA); các khoá còn lại vào là thấy ngay cây Notebook.

Quy mô hiện có (số Block / từ): TOEIC(TJ) 1.301 / 9.814 · CIA 256 / 2.130 · EA2025 79 / 440 · Marketing 73 / 562 · NGÔN NGỮ 68 / 647 · Tax 1040 50 / 386 · Grammar 18 / 134 · English File 0 · IELTS 0.

## 3. Cách nghĩ đề xuất: "Khoá học" là trung tâm, luồng 4 bước
Mỗi **Hub = một Khoá học** có **một trang chủ riêng** (cùng một khuôn, khác màu, ảnh bìa, giới thiệu). Trên trang đó người học luôn thấy 4 bước theo thứ tự:

1. **📖 Học** — mở Notebook của khoá, học theo Block.
2. **🔁 Ôn** — những từ đến hạn hôm nay (chu kỳ Tony Buzan), ⭐ và ❌ của riêng khoá.
3. **🎯 Luyện** — game một người (EA Quest, Marketing Quest, đề TOEIC…), tiến độ lưu Supabase.
4. **🎮 Chơi chung** — vào phòng game với đúng chủ đề khoá này; **🖤 Đọc chung** — mở Bảng với tài liệu của khoá.

Trang chủ khoá gồm: ảnh bìa + câu giới thiệu · vòng tiến độ · "Hôm nay học gì" (một nút lớn) · lộ trình các chặng · bảng xếp hạng riêng khoá · nút vào phòng.

Thanh trên cùng gọn lại còn: **Khoá học ▾ · Hôm nay · Journey · Game · Bảng · tài khoản**. ⭐ Ôn riêng và ❌ Fix lỗi sai chuyển vào "Hôm nay".

## 4. Gắn từng khoá vào luồng
| Khoá | Học | Luyện (một người) | Chơi chung / Bảng | Việc thiếu |
|---|---|---|---|---|
| **TOEIC** (đổi tên Hub "TJ" → "TOEIC") | Notebook 1.301 Block | Đề ETS Test 1–10 | Game Test hub, Bảng đọc đề | Speaking & Writing (mới), đáp án LC |
| **EA 2025** | Hub EA2025 + 17 bài HTML | EA Quest | Đề EA 377 câu trong game | Part I SU04–14; sửa nút "mở bài học"; nối tiến độ |
| **Digital Marketing** | Hub 73 Block | Marketing Quest | Bài `mk` trên Bảng | Nguồn gốc `digital marketing.pdf`; nối tiến độ |
| **CIA 1000 câu EN-ES-CN-VN** | Notebook "CIA_Top Secret" | Game chunk (ghép mảnh, chọn lịch sự…) | Phòng game dạng chunk | Dùng làm khoá "mẫu" trang riêng |
| **English File / AEF** | Hub trống — bài TuVung PDF đã soạn | — | Đọc chung PDF trên Bảng | Đưa PDF lên bucket `library` |
| **Tax 1040, Grammar, IELTS** | có / ít / trống | — | — | Sắp xếp sau |

## 5. Quản trị cho TJ (Admin + Host)
Một màn **"Quản trị"** (chỉ hồ sơ TJ):
- **Người dùng và người chơi:** danh sách, gộp, chặn, nâng khách lên hồ sơ (đã có 👥 Quản lý người chơi, gom về một chỗ).
- **Khoá học:** ẩn/hiện, thứ tự, ảnh bìa, tiến độ soạn nội dung (ví dụ EA 30/41 SU).
- **Phòng game:** phòng đang mở, ai đang ở trong, đóng phòng.
- **Kho và chi phí:** dung lượng Storage/DB so với hạn mức, chi phí AI trong tháng.
- **Sức khoẻ dữ liệu:** backup lần gần nhất, file thừa trong kho.
- Tách vai **Host** (điều khiển phòng, có thể giao cho người khác) khỏi **Admin** (hệ thống).

## 6. Làm cho bắt mắt và hấp dẫn người học chung
- **Bìa khoá học** có màu và biểu tượng riêng (đã có "Operation / CIA" làm mẫu kể chuyện).
- **Mục tiêu mỗi ngày + chuỗi ngày học**, vòng tiến độ, huy hiệu chặng.
- **Thử thách hằng ngày** (5 câu từ khoá bạn đang học) và **sự kiện phòng hằng tuần** do host mở.
- **Xếp hạng theo khoá**, theo tuần; chia sẻ link mời bằng một chạm.
- **Nội dung dạng nhiệm vụ ngắn** (5–10 phút), có tình huống thật (EA tiếp khách, Marketing funnel).
- Người mới thấy **một nút lớn "Bắt đầu"** thay vì cả cây thư mục.

## 7. Lộ trình làm (đề xuất, từng bước TJ duyệt)
| Giai đoạn | Việc | Rủi ro |
|---|---|---|
| **0 – Sửa lỗi nền** | Nút "Game →" nhảy đúng; nút mở bài học EA; bucket `library` private cho sách; đổi tên Hub "TJ" | Thấp |
| **1 – Khung "Trang chủ khoá học"** | Một khuôn dữ liệu cho mọi Hub (bìa, giới thiệu, nút Học/Ôn/Luyện/Chơi), làm trước cho EA rồi nhân ra | Trung bình (sửa app.js, hubpage.js) |
| **2 – Nối tiến độ** | EA/Marketing Quest lưu Supabase, Journey đếm chung | Trung bình (thêm bảng, cần PAT) |
| **3 – Màn Quản trị** | Gom 👥 + phòng + kho + chi phí | Trung bình |
| **4 – Hấp dẫn** | Chuỗi ngày, thử thách, huy hiệu, xếp hạng khoá | Thấp–trung bình |
| **5 – Nội dung mới** | TOEIC Speaking & Writing (cần PDF của TJ), EA Part I SU04–14 | Tốn công soạn |

## 8. Cần TJ quyết trước khi làm
1. Chốt **ngôn ngữ gọi**: Hub → "Khoá học"; "Góc tự học" → "Luyện"; có đồng ý không?
2. Khoá nào làm **mẫu đầu tiên**: EA (đã có đủ game) hay CIA (đã có trang riêng)?
3. Có nối tiến độ Quest lên Supabase không (cần chạy migration)?
4. Có tách quyền **Host** cho người khác không?
