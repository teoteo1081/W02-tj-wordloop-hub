# -*- coding: utf-8 -*-
# P5 Bắt số liệu giả. Số liệu là ví dụ giả định, thương hiệu giả.
P5 = [
dict(tag="Follower tăng đột biến, tương tác giảm", tag_en="Follower spike, engagement drop", refs=["fb","tt"], lvl="ta",
passage="Báo cáo tháng của agency gửi shop “Hoa Lụa”:\n- Follower trang: 8.000 (đầu tháng) -> 32.000 (cuối tháng), +300%\n- Lượt thích mỗi bài: trung bình 45 -> 38\n- Bình luận mỗi bài: 6 -> 4\n- Đơn hàng từ trang: 52 -> 50\nAgency kết luận: “Thương hiệu tăng trưởng mạnh, đề nghị gia hạn hợp đồng.”",
stem="Điều nào đáng nghi nhất và cách kiểm tra đúng?",
ok="Follower tăng gấp 4 nhưng lượt thích, bình luận, đơn không tăng; kiểm tra nguồn follower và tương tác trong công cụ thống kê chính thức của nền tảng",
bad=["Follower tăng 300% là rất tốt nên có thể gia hạn ngay","Lượt thích giảm chút là bình thường, không cần xem thêm","Hỏi agency có thật không và tin theo câu trả lời"],
explain="Người thật đến thì thường kéo theo tương tác và đơn hàng tăng. Ở đây follower tăng 4 lần nhưng mọi chỉ số còn lại đi ngang hoặc giảm, dấu hiệu của tài khoản ảo hoặc người theo dõi không quan tâm. Cách xác minh: xem thống kê người theo dõi (quốc gia, độ tuổi, nguồn) trong công cụ thống kê của nền tảng như Meta Business Suite, đối chiếu với đơn thật trong hệ thống bán hàng. Không dựa vào lời của chính bên báo cáo."
, en="Followers quadrupled while likes, comments and orders did not move. Verify follower sources in the platform's official insights."),
dict(tag="CTR cao nhưng không có đơn", tag_en="High CTR, zero orders", refs=["fb","gg"], lvl="ta",
passage="Báo cáo chiến dịch quảng cáo 7 ngày của “Máy Lọc Trong”:\n- Chi phí: 14.000.000đ\n- Lượt nhấp: 28.000, CTR 18%\n- Phiên truy cập ghi nhận trên website: 3.100\n- Tỉ lệ thoát: 97%, thời gian trung bình 2 giây\n- Đơn hàng: 0\nBáo cáo viết: “Chiến dịch đạt CTR cực cao, đề nghị tăng ngân sách gấp 3.”",
stem="Kết luận đúng là gì?",
ok="Lượt nhấp 28.000 nhưng chỉ 3.100 phiên, thoát 97% và 0 đơn: dấu hiệu nhấp không thật hoặc không đúng đối tượng; cần kiểm tra nguồn trong Google Analytics và báo cáo vị trí hiển thị",
bad=["CTR 18% rất cao nên cần tăng ngân sách ngay","0 đơn là do sản phẩm xấu, không liên quan quảng cáo","Chỉ cần đổi hình quảng cáo là sẽ có đơn"],
explain="CTR cao bất thường mà không có đơn thường do nhấp nhầm, tệp đối tượng sai hoặc lưu lượng không thật. Khoảng cách 28.000 lượt nhấp và chỉ 3.100 phiên là điều cần giải thích. Cách xác minh: so số nhấp trong Ads Manager với số phiên trong Google Analytics 4, xem nguồn, quốc gia, vị trí hiển thị, và báo cáo chặn vị trí kém. Không tăng ngân sách trước khi hiểu dữ liệu. Có thể liên hệ hỗ trợ nền tảng để xem xét."
, en="28,000 clicks but only 3,100 sessions, 97% bounce and no orders suggest low-quality or non-genuine traffic. Compare ad-platform clicks with Google Analytics before increasing budget."),
dict(tag="ROAS tính cả đơn hủy và hoàn", tag_en="ROAS counting cancelled orders", refs=["tt","shopee"], lvl="xam",
passage="Báo cáo livestream tháng của “Bếp Nhà Mây”:\n- Chi phí quảng cáo: 10.000.000đ\n- Doanh thu ghi nhận: 80.000.000đ -> ROAS 8,0\n- (ghi chú nhỏ) Trong đó đơn đã hủy/hoàn: 45.000.000đ\nBáo cáo gửi sếp: “ROAS 8, hiệu quả xuất sắc.”",
stem="ROAS thật là bao nhiêu và cách xác minh nào đúng?",
ok="(80 − 45) / 10 = 3,5; đối chiếu bằng báo cáo đơn hoàn thành trong trang quản lý của sàn và hệ thống kế toán",
bad=["8,0, vì báo cáo ghi như vậy","80/10 = 8 và đơn hủy là việc của bộ phận khác","1,0, vì phải trừ cả chi phí hàng hóa lẫn quảng cáo"],
explain="Doanh thu thật là đơn đã giao và không hoàn: 80 − 45 = 35 triệu, chia 10 triệu chi phí = 3,5 (chưa trừ giá vốn). Báo cáo giấu phần hủy trong chú thích nhỏ để số trông đẹp, thuộc vùng xám. Cách xác minh: xuất báo cáo “đơn hoàn thành” từ Seller Center của sàn, đối chiếu với kế toán, ghi rõ định nghĩa ROAS trong mỗi báo cáo. Đáp án 1,0 sai vì trộn giá vốn vào ROAS mà không nói. Số liệu là ví dụ giả định."
, en="Only completed, non-refunded orders count: (80-45)/10 = 3.5. Verify with the marketplace's completed-order report and accounting."),
dict(tag="Tăng trưởng % từ nền rất nhỏ", tag_en="Percentage growth from a tiny base", refs=["sp"], lvl="xam",
passage="Slide của “Trà Quê”: “Doanh số tăng 300% so với tháng trước!” Dòng phụ ở góc dưới: tháng trước 10 đơn, tháng này 40 đơn. Ngành cùng kỳ tăng 25% (nguồn báo cáo ngành, kiểm tra lại bản mới nhất). Slide không nêu lợi nhuận hay chi phí quảng cáo.",
stem="Cách đọc con số nào đúng?",
ok="+300% từ 10 lên 40 là +30 đơn, nền rất nhỏ; cần xem số đơn tuyệt đối, chi phí và lợi nhuận, rồi đối chiếu hệ thống đơn hàng",
bad=["300% là con số cực kỳ lớn, shop đang vượt xa ngành","Con số phần trăm luôn chính xác hơn số đơn","Chỉ cần thêm hình minh họa là biểu đồ đáng tin hơn"],
explain="Phần trăm lớn từ nền nhỏ dễ gây ấn tượng nhưng chỉ là +30 đơn. Khi trình bày, cần số tuyệt đối, chi phí và lợi nhuận để người xem quyết định. Con số không bịa nhưng cách trình bày dẫn người xem hiểu quá mức, thuộc vùng xám. Cách xác minh: lấy báo cáo đơn từ hệ thống bán hàng, so với chi phí thật, và so sánh cùng kỳ với số liệu ngành đáng tin."
, en="+300% from 10 to 40 orders is just 30 extra orders. Ask for absolute numbers, cost and profit."),
dict(tag="Khảo sát “98% hài lòng” mẫu nhỏ, chọn lọc", tag_en="Cherry-picked satisfaction survey", refs=["sp"], lvl="ta",
passage="Trang giới thiệu của “Gối Mây” nêu: “98% khách hàng hài lòng.” Chú thích bằng chữ rất nhỏ: Khảo sát 50 khách, gửi đến những người đã đánh giá 5 sao trên sàn, thực hiện bởi chính shop. Shop có 4.200 đơn trong năm. Không công bố câu hỏi khảo sát.",
stem="Điều gì khiến con số này không đáng tin?",
ok="Chỉ hỏi 50 trong 4.200 khách, chọn người đã chấm 5 sao, shop tự khảo sát, không nêu câu hỏi; nên dựa trên đánh giá thật của mọi khách đã mua trên sàn",
bad=["98% là rất cao nên chắc chắn đúng","Vì có chú thích nên số liệu đã minh bạch","Chỉ cần tăng số người khảo sát lên 60 là đủ tin cậy"],
explain="Mẫu 50 khách chỉ khoảng 1,2% số đơn và chọn trước nhóm đã hài lòng nên kết quả lệch. Nêu chú thích rất nhỏ không làm con số thành minh bạch. Cách xác minh: xem phân bố sao và đánh giá của toàn bộ khách đã mua trên sàn, hoặc khảo sát mẫu ngẫu nhiên có nêu câu hỏi, đơn vị thực hiện. Số liệu là ví dụ giả định."
, en="50 hand-picked 5-star customers out of 4,200 buyers is not a satisfaction rate. Check the full rating distribution of verified buyers."),
dict(tag="Đánh giá dồn vào một ngày", tag_en="Burst of reviews", refs=["shopee","sp"], lvl="ta",
passage="Số liệu gian hàng “Đèn Ngủ Sao” (tháng 9):\n- Tổng đánh giá: 1.200, điểm 4,9\n- Ngày 3/9: 800 đánh giá trong 24 giờ, 5 sao; 0 đánh giá có ảnh\n- Các ngày còn lại: trung bình 13 đánh giá/ngày, điểm 4,3, 40% có ảnh\n- Đơn hàng ngày 3/9: 22 đơn",
stem="Điều nào đáng ngờ nhất?",
ok="800 đánh giá 5 sao chỉ trong 1 ngày không ảnh, trong khi chỉ có 22 đơn; kiểm tra nhãn “đã mua hàng” và so khớp với đơn thật trong Seller Center",
bad=["Điểm 4,9 chứng tỏ sản phẩm rất xuất sắc","Một ngày nhiều đánh giá là do khách thích đồng loạt","Số đánh giá nhiều nên tốt, không cần kiểm tra"],
explain="22 đơn nhưng 800 đánh giá trong 1 ngày là không khớp: đánh giá thật cần đơn thật. Các ngày còn lại điểm 4,3 và nhiều ảnh cho thấy mức bình thường của shop. Cách xác minh: lọc đánh giá “Đã mua hàng”, đối chiếu mã đơn trong Seller Center, xem thời điểm và tài khoản đánh giá, báo cáo bất thường cho sàn. Số liệu là ví dụ giả định."
, en="800 five-star reviews in a day with only 22 orders do not match. Compare verified-purchase reviews against actual orders."),
dict(tag="Lượt xem livestream cao, bình luận và đơn thấp", tag_en="Live views vs real interaction", refs=["tt"], lvl="ta",
passage="Báo cáo livestream 2 giờ của shop “Giày Nhanh”:\n- Lượt xem đỉnh: 50.000 người cùng lúc\n- Bình luận: 40 (đa số “1”, “ok”)\n- Thời gian xem trung bình: 8 giây\n- Đơn hàng: 3\nAgency viết: “Live đạt 50.000 người, rất thành công.”",
stem="Cách đánh giá đúng là gì?",
ok="Lượng người cao nhưng thời gian xem 8 giây, 40 bình luận và 3 đơn không khớp; kiểm tra nguồn người xem, thời gian xem, tỉ lệ chuyển đổi trong báo cáo livestream chính thức của nền tảng",
bad=["50.000 người cùng lúc là rất thành công, cứ tin","Bình luận ít do người xem ngại nói","Chỉ cần mở livestream lâu hơn là được"],
explain="Người xem thật thường ở lại lâu hơn 8 giây và có bình luận, hỏi giá. Dữ liệu cho thấy lượng người cao nhưng tương tác gần như không có, nên cần xem nguồn truy cập và phân tích khán giả. Cách xác minh: xem báo cáo chi tiết của livestream trong công cụ của nền tảng (nguồn người xem, thời lượng, tỉ lệ nhấp giỏ hàng) và đối chiếu với đơn thật. Số liệu là ví dụ giả định."
, en="50,000 peak viewers with 8-second average watch time, 40 comments and 3 orders do not fit. Check viewer sources in the official live report."),
dict(tag="Tỉ lệ mở email cao nhưng không bấm", tag_en="Inflated email open rate", refs=["zalo"], lvl="xam",
passage="Báo cáo email tháng của “Sách Sáng”: gửi 10.000 email, tỉ lệ mở 95%, tỉ lệ bấm 0,2%, 6 đơn hàng. Báo cáo viết: “Email của chúng ta được khách hàng đọc gần như toàn bộ, thành công lớn.” Ghi chú nhỏ: nhiều ứng dụng email tự tải ảnh khi xem trước.",
stem="Điều đúng nhất là gì?",
ok="Tỉ lệ mở có thể bị tăng do ứng dụng tự tải ảnh; nên nhìn tỉ lệ bấm (0,2%) và số đơn (6) rồi đối chiếu với hệ thống đơn hàng",
bad=["95% mở nghĩa là gần như mọi người đọc kỹ","Chỉ có tỉ lệ mở mới quan trọng","Tăng số email gửi lên gấp đôi để tăng đơn"],
explain="Tỉ lệ mở đo qua ảnh theo dõi nên có thể cao giả khi ứng dụng email tự tải ảnh. Chỉ số quan trọng hơn là bấm và đơn hàng: 0,2% và 6 đơn. Cách xác minh: đối chiếu số bấm với số phiên trong Google Analytics và số đơn trong hệ thống. Chỉ báo chỉ số đẹp mà bỏ chỉ số kém là xám. Gửi gấp đôi cho người chưa đồng ý còn có thể bị đánh dấu spam."
, en="Open rates can be inflated by automatic image loading. Look at click rate and orders and confirm them in analytics."),
dict(tag="“Lên top 1” chỉ với từ khóa tên thương hiệu", tag_en="Top 1 only for brand keyword", refs=["gg"], lvl="xam",
passage="Báo cáo SEO của “Nội Thất Mộc An”: “Từ khóa ‘Nội Thất Mộc An’ lên top 1 Google!” Bảng đính kèm: từ khóa ‘nội thất Mộc An’ hạng 1; ‘sofa giá rẻ’ hạng 64; ‘bàn làm việc gỗ’ hạng 87; lượng truy cập tự nhiên không đổi so với tháng trước (1.200 lượt).",
stem="Cách nhận xét báo cáo này nào đúng?",
ok="Từ khóa tên thương hiệu vốn dễ lên top 1; từ khóa khách hay tìm vẫn hạng 64–87 và truy cập không tăng; nên xem Google Search Console để biết lượt hiển thị và nhấp thật",
bad=["Lên top 1 là SEO rất thành công","Từ khóa nào lên top 1 cũng mang khách mới","Nên trả thêm tiền cho agency để lên top 1 cho nhiều tên thương hiệu khác"],
explain="Tên thương hiệu thường dễ đứng đầu vì ít đối thủ; từ khóa mang khách mới vẫn hạng 64–87 và truy cập không tăng. Báo cáo chọn con số đẹp nhất, thuộc vùng xám. Cách xác minh: xem Google Search Console (lượt hiển thị, nhấp, từ khóa thật) và so lưu lượng tự nhiên qua Google Analytics. Số liệu là ví dụ giả định."
, en="A brand-name keyword is easy to rank for. Check Google Search Console for impressions and clicks on non-brand keywords."),
dict(tag="Tỉ lệ chuyển đổi tăng vọt bất thường", tag_en="Implausible conversion rate", refs=["gg","sp"], lvl="ta",
passage="Dashboard của “Nón Lá Xanh”: tỉ lệ chuyển đổi tuần này 40% (bình thường 2%), 120 đơn. Chi tiết: 90 đơn có cùng địa chỉ giao là văn phòng của shop, giá trị mỗi đơn 1.000đ, thanh toán bằng một thẻ duy nhất. Không có thay đổi nào về quảng cáo hay giá. Báo cáo kết luận: “Trang bán hàng mới hiệu quả gấp 20 lần.”",
stem="Điều cần làm đúng nhất là gì?",
ok="Loại các đơn nội bộ/đơn thử (cùng địa chỉ, giá 1.000đ, cùng thẻ) rồi đo lại bằng đơn thật trong hệ thống bán hàng và Google Analytics",
bad=["Công bố 40% với khách hàng làm bằng chứng","Giữ nguyên con số vì không ai biết","Tăng ngân sách quảng cáo gấp 5 theo con số này"],
explain="90/120 đơn có cùng địa chỉ văn phòng, giá 1.000đ, cùng thẻ là đơn thử hoặc đơn nội bộ, không phản ánh khách thật. Nếu chỉ lấy đơn thật (30 đơn) thì kết luận khác hẳn. Cách làm đúng: lọc đơn nội bộ khỏi báo cáo, đối chiếu mã đơn với kế toán và sàn, rồi đo lại hiệu quả trang mới. Công bố số liệu đã biết là sai là tà đạo. Số liệu là ví dụ giả định."
, en="Most of the 'orders' share one address, price and card: test orders. Filter them out and re-measure with real orders."),
]
