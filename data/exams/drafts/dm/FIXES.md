# FIXES — bộ 102 câu "Thám tử Marketing" (sửa theo danh sách leader duyệt)

Sửa trong file nguồn (p1_chinh/p1_xam/p1_ta/p3/p4/p5/build_dm.py) rồi chạy lại `build_dm.py` -> `dm_items.json`.
Giữ nguyên: 102 câu (P1 36, P2 36, P3 12, P4 8, P5 10), id, bộ khoá, tiền tố "(A) …", đáp án đúng của mọi câu.
P2 dùng chung tình huống với P1 (cùng số thứ tự), nên sửa tình huống P1 là P2 tự khớp.

## Kết quả đo (script `measure.py`)
| Part | Đáp án đúng là câu dài nhất (trước -> sau) | TB đúng/TB sai ký tự (trước -> sau) | Tỉ lệ |
|---|---|---|---|
| P3 | 12/12 (100%) -> 4/12 (33%) | 283/67 -> 229/217 | 4,20 -> 1,05 |
| P4 | 8/8 (100%) -> 2/8 (25%) | 91/57 -> 100/103 | 1,60 -> 0,97 |
| P5 | 10/10 (100%) -> 2/10 (20%) | 146/44 -> 138/131 | 3,35 -> 1,05 |

gate_items.py: ĐẠT. Level P1 vẫn 12/12/12. Level P3 mới: ta 9 / xám 3 (trước: ta 8 / xám 4). Không đáp án đúng nào đổi chữ cái.

## A. Đáp án nhiễu gần hàng rào (P3)
- p3_001: (A) bỏ "cho khó phát hiện"; (D) "sàn khó biết" -> "chừng đó thì không sao".
- p3_004: (B) = "Em lập 10 nick như chị yêu cầu…" (bỏ mẹo ngụy trang); (C) bỏ ý "ít nhìn đỡ giả hơn" (đổi thành lý do ngân sách/thời gian).
- p3_005: (A) bỏ giá và số lượng cụ thể.
- p3_012: (B) chỉ còn "cứ gửi 3 lần/ngày", bỏ "nếu bị chặn thì đổi số khác".

## B. Độ dài đáp án (P3, P4, P5)
Viết lại toàn bộ đáp án nhiễu của 30 câu cho dài/chi tiết tương đương (sai ở nội dung, không ở độ dài), rút gọn nhẹ đáp án đúng. Số liệu ở bảng trên. Không có đáp án nhiễu nào thành đáp án đúng thứ hai (đã rà từng câu).

## C. Số liệu
- p5_006: điểm tổng 4,9 -> 4,8; tổng đánh giá 1.200 -> 1.177 để khớp (800×5 + 377×4,3)/1.177 ≈ 4,78 (377 = 29 ngày × 13); lời giải có dòng kiểm tra số học. Đáp án nhiễu "Điểm 4,9" đổi thành "4,8".
- p5_010: dữ liệu mới: 120 đơn trên ~300 phiên; 114 đơn nội bộ (cùng địa chỉ, 1.000đ, cùng thẻ); 6 đơn thật/300 phiên ≈ 2% = bình thường. Sửa đáp án đúng và lời giải cho nhất quán.
- p5_004: ghi "(số giả định; nguồn báo cáo ngành, kiểm tra lại bản mới nhất)".

## D. Pháp lý/chính sách
- p1_032 / p2_032: tag "…đúng quy định" -> "…ít rủi ro hơn, dễ tuân thủ hơn" (tag_en cũng đổi); explain thêm "kiểm tra lại quy định thực phẩm bảo vệ sức khỏe mới nhất". Đáp án nhiễu của tình huống "Mạo danh bác sĩ" (P2) từng ghi "…đúng quy định" cũng đổi thành "…có cảnh báo đầy đủ".
- p1_008, p1_022 (và P2 tương ứng, tự khớp): thêm "có thể đã không hợp lệ về mặt pháp lý (dữ liệu cá nhân/đồng ý), kiểm tra lại quy định mới nhất".
- p1_006, p1_028, p1_031: "Rủi ro: gần như không có" -> "Rủi ro: thấp".
- p5_001/003/006/007/009 (thêm cả 002): thêm "tên công cụ/mục báo cáo có thể đổi, kiểm tra lại" vào explain.
- p5_008: ref đổi từ Zalo OA sang khoá mới `email` (thêm vào REF trong build_dm.py).
- p1_001, 006, 010, 012, 018, 021, 025, 028, 031: thêm cụm "(kiểm tra lại bản mới nhất)" vào chính explain (đã kiểm tra tự động cả P1 lẫn P2).

## E. Phân loại đạo
- p3_011: level xám -> TÀ; tag/tag_en/explain sửa cho nhất quán ("chỉ thị KOC nói dối 'tự mua' = tà; giấu nhãn đơn thuần mới là xám").
- p3_008 (giữ xám): explain ghi rõ ranh giới "xin xóa = xám; TRẢ TIỀN xóa đánh giá THẬT = tà", cùng cách gọi với p4_002. Để câu còn là xám thật, sửa nhẹ passage: bỏ chữ "cho 20.000đ để họ xóa" của sếp (thành "nhắn xin xóa giúp, năn nỉ vài lần"); chiêu trả tiền chỉ còn nằm ở đáp án nhiễu (A).
- p4_002: bỏ "xám nặng", đổi thành "trả tiền để xóa đánh giá THẬT là tà đạo; chỉ xin xóa không trả tiền là vùng xám".
- p3_010 (giữ xám): explain thêm "cắt tên + không xin phép = tà". Passage bỏ câu "cắt tên đi cho gọn" của sếp (chỉ còn không xin phép = xám); "cắt tên" nằm ở đáp án nhiễu (A).
- p3_009: thêm đoạn giải thích vì sao khác ca "dùng thử 0đ" (p1_003: giấu phí chữ nhỏ + nút mỉa mai + hủy khó + không nhắc = tà): ở đây phí vẫn hiện trước khi trả tiền, khách thoát dễ.

## F. Đáp án mơ hồ
- p2_001 (D): "Đặt lời mời kiểm tra miễn phí ở cuối" -> "Mua lượt bấm để tiêu đề trông nổi tiếng" (không có trong passage).

## G. Tên giống thật
- p1_016 / p2_016: "Bác sĩ Nguyễn Văn Ví Dụ (tên giả định)", "Bệnh viện Đa khoa Ví Dụ (tên giả định)".
- p1_024: "Hồng Ký" -> "Tám Lá". p1_029: "Bảo Khuê" -> "Triệu Mộc". p1_034: "Sao Việt" -> "Tinh Hà Số". P2 tự khớp.

## H. "(ví dụ giả định)"
Đã thêm vào explain: p3_001, 002, 003, 004, 007, 008, 010, 011, 012; p4_002, 003, 004, 005, 006; p5_001, 002, 004, 008 (kiểm tra tự động: đủ cả 18 câu). Bản en của các câu P3 cũng ghi "(illustrative numbers)".

## I. Tiếng Anh
Thêm câu "The right way: …" vào i18n.en (và P2 tương ứng): p1_001, 007, 015, 017, 028.

## J. Tiếng Việt gượng
- p1_005: "Thiệp không nói phải bao nhiêu sao, nhưng trên trang đánh giá cũng không có dòng nào cho biết người viết đã nhận quà."
- p1_021: "Khách quen biết ưu đãi này lặp lại nên không vội, còn khách mới thì thường mua ngay vì sợ lỡ."
- p1_014: "Dòng chữ “Còn 2 suất” vẫn y nguyên dù đã có hơn 300 người mua trong 3 tuần."
- p4_006: "Bịa thêm vài “học viên” (ví dụ “kế toán Anh Nam”, “chị Lan”) kèm ảnh minh họa lấy trên mạng để đủ 10 nhận xét."

## K. "Shopee"
Thay "sàn" chung chung bằng "Shopee" ở p3_001 và p3_008 (chỉ tên nền tảng).

## Không làm / lưu ý
- Không có mục nào bỏ sót. Ngoài danh sách: sửa passage p3_008, p3_010 (mục E) và dữ liệu p5_006 (tổng 1.177), p5_010; thêm ref `email`.
- Chỗ chưa chắc: (1) tên "Ví Dụ"/"Tám Lá"/"Triệu Mộc"/"Tinh Hà Số" nên tra nhanh xem có trùng thương hiệu thật không; (2) p3_009 nhắc "ca dùng thử 0đ" bằng lời, không nêu số câu; (3) độ dài đã cân nhưng vẫn nên cho Tuân thủ/QA đọc lại xem đáp án nhiễu mới có "hấp dẫn quá mức" không.
