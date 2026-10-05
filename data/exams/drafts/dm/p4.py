# -*- coding: utf-8 -*-
# P4 Trượt dốc: 2 chiến dịch x 4 bước. ok = lựa chọn chính đạo; bad = 3 lựa chọn trượt dốc (nhẹ -> nặng).
P4 = [
dict(tag="Trượt dốc – Mầm Sáng bước 1: ra mắt chưa có đánh giá", tag_en="Slippery slope A1", refs=["fb","sp","law"], lvl="chinh",
passage="Chiến dịch “Kem dưỡng Mầm Sáng” (shop nhỏ, ngân sách 20.000.000đ). Hôm ra mắt, trang sản phẩm chưa có đánh giá nào. Chị chủ muốn có người “nói tốt” trước khi chạy quảng cáo.",
stem="Bước 1/4: Quyết định nào là đúng?",
ok="Tặng dùng thử cho 30 khách thật, nói rõ “được shop tặng”, mời họ đánh giá bất kể khen hay chê",
bad=["Nhân viên đăng bài khen trên nhóm nhưng không nói mình làm ở shop","Lập vài tài khoản phụ để khen cho “đỡ trống”","Mua 100 đánh giá 5 sao cho trang đẹp ngay"],
explain="Bước đầu nhìn nhỏ nhưng quyết định hướng đi. Chính đạo: tặng thử thật, công bố, nhận cả lời chê. Nhân viên giấu danh tính là xám; nick phụ và mua đánh giá là tà, dễ bị phát hiện và phải che tiếp ở các bước sau. Làm đúng thì 30 người dùng thử có thể mang về khoảng 10–15 đánh giá thật (ước tính, ví dụ giả định)."
, en="Gift to 30 real customers with disclosure and invite honest reviews. Hidden staff posts, extra accounts or bought reviews start the slide."),
dict(tag="Trượt dốc – Mầm Sáng bước 2: có đánh giá chê", tag_en="Slippery slope A2", refs=["sp","shopee","law"], lvl="chinh",
passage="Hai tuần sau Mầm Sáng có 12 đánh giá, trong đó 3 đánh giá 2 sao: “Kem hơi bết với da dầu”. Điểm trung bình tụt còn 4,1. Chị chủ lo doanh thu giảm.",
stem="Bước 2/4: Bạn xử lý thế nào?",
ok="Trả lời công khai, tư vấn loại da phù hợp và đổi sang bản nhẹ cho khách da dầu",
bad=["Nhắn khách chê, tặng 20.000đ nếu xóa đánh giá","Nhờ người quen viết thêm 10 đánh giá 5 sao để “đè” lên","Báo cáo sàn xóa 3 đánh giá chê dù không vi phạm gì"],
explain="Đánh giá chê là dữ liệu thật để cải thiện sản phẩm. Chính đạo: trả lời tử tế, đưa giải pháp. Trả tiền để xóa là xám nặng, viết thêm để “đè” là tà vì tạo bằng chứng giả, báo cáo vô lý có thể bị sàn phạt (kiểm tra lại chính sách mới nhất). Mỗi bước sai ở bước 1 đang kéo bạn phải che thêm ở bước này."
, en="Reply publicly with advice and an alternative. Paying to remove, adding fake praise or false reports deepen the slide."),
dict(tag="Trượt dốc – Mầm Sáng bước 3: doanh thu chậm", tag_en="Slippery slope A3", refs=["sp","tt","law"], lvl="chinh",
passage="Sau 1 tháng, doanh thu Mầm Sáng chỉ đạt một nửa mục tiêu. Chị chủ muốn tăng đơn ngay trong tuần với chương trình khuyến mãi và một buổi livestream. Giá thường của kem là 320.000đ.",
stem="Bước 3/4: Chương trình nào đúng đạo?",
ok="Giảm 15% còn 272.000đ đến hết Chủ nhật (hạn thật), livestream hiển thị số tồn thật",
bad=["Ghi giá “gốc” 650.000đ rồi giảm 50% (giá đó chưa từng bán)","Đặt đồng hồ đếm ngược chạy lại mỗi ngày kèm “còn 5 hộp” dù kho còn 200","Livestream hô “còn 3 hộp cuối” và báo đơn ảo trên màn hình"],
explain="Khuyến mãi thật, hạn thật, tồn kho thật là chính đạo. Giá gốc ảo, đồng hồ lặp, tồn kho giả là các biến thể của cùng một chiêu: tạo áp lực không có thật. Ở bước 3, “giải pháp nhanh” thường là bước trượt lớn nhất vì shop đang áp lực doanh thu. Làm đúng: nêu rõ điều kiện, giữ tồn kho thật, tặng kèm mẫu thử có giới hạn thật. Giảm 15% là ví dụ; kiểm tra lại quy định quảng cáo mới nhất."
, en="Use a real discount with a real deadline and real stock numbers. Fake original prices, resetting timers and invented scarcity are all the same trick."),
dict(tag="Trượt dốc – Mầm Sáng bước 4: khiếu nại và bài tố", tag_en="Slippery slope A4", refs=["fb","law"], lvl="chinh",
passage="Một khách báo da bị kích ứng nhẹ sau khi dùng kem và đăng bài lên nhóm Facebook, có 400 lượt tương tác. Shop đang trong đợt khuyến mãi lớn và sợ ảnh hưởng đơn hàng.",
stem="Bước 4/4: Phản ứng nào đúng đạo?",
ok="Xin lỗi công khai, hoàn tiền, kiểm tra lô hàng và công bố kết quả kiểm tra",
bad=["Nhắn riêng khách hứa bồi thường nếu xóa bài","Đăng bài nói khách nói dối, kèm ảnh cá nhân của khách","Dùng nhiều tài khoản vào nhóm phản bác và khen shop"],
explain="Khủng hoảng là lúc lộ rõ đạo đức. Chính đạo: xin lỗi, hoàn tiền, kiểm tra thật và công bố; khách thấy shop có trách nhiệm thường bớt giận. Ép xóa bài bằng tiền, tố ngược và đăng thông tin cá nhân của khách, hoặc dùng nick giả đều đã là tà đạo và có thể gây rắc rối pháp lý (kiểm tra lại quy định bảo vệ dữ liệu mới nhất). Chuỗi 4 bước cho thấy: một lựa chọn “vô hại” ở bước 1 buộc bạn phải che đậy thêm."
, en="Apologise publicly, refund, test the batch and publish findings. Hush money, counter-attacks and fake accounts are deceptive and risky."),
dict(tag="Trượt dốc – Excel Pro bước 1: tiêu đề trang đăng ký", tag_en="Slippery slope B1", refs=["fb","law"], lvl="chinh",
passage="Chiến dịch khóa học “Excel Pro 30 ngày” giá 1.470.000đ. Đội marketing viết tiêu đề trang đăng ký. Học viên mục tiêu là nhân viên văn phòng muốn làm báo cáo nhanh hơn.",
stem="Bước 1/4: Tiêu đề nào đúng đạo?",
ok="“30 bài học Excel cho người đi làm – học xong tự làm được báo cáo cơ bản, hoàn tiền trong 7 ngày nếu chưa hài lòng”",
bad=["“Số 1 Việt Nam – 100% học viên lương tăng gấp đôi”","“Bí quyết Excel chuyên gia nước ngoài không muốn bạn biết”","“Học 30 ngày, đảm bảo có việc lương 20 triệu”"],
explain="Cam kết đúng phạm vi khóa học và chính sách hoàn tiền rõ là chính đạo. “Số 1”, “100% học viên” cần bằng chứng; “bí quyết bị giấu” là clickbait; “đảm bảo việc 20 triệu” là hứa điều không kiểm soát được. Các lời hứa quá tay ở bước 1 buộc bạn phải bịa bằng chứng ở bước 2. Kiểm tra lại quy định quảng cáo mới nhất."
, en="Promise only what the course can deliver and state the refund policy. Superlatives, hidden-secret headlines and job guarantees start the slide."),
dict(tag="Trượt dốc – Excel Pro bước 2: lời chứng thực học viên", tag_en="Slippery slope B2", refs=["fb","law"], lvl="chinh",
passage="Trang đăng ký cần lời chứng thực. Mới có 5 học viên cũ, trong đó 2 người ghi nhận xét tốt qua tin nhắn riêng, 3 người chưa trả lời. Đội muốn trang trông thuyết phục hơn trước khi chạy quảng cáo.",
stem="Bước 2/4: Làm thế nào cho đúng?",
ok="Xin phép 2 học viên đã nhận xét, ghi đúng tên/chức danh họ cho phép và mô tả đúng kết quả",
bad=["Lấy ảnh học viên đăng công khai và dùng luôn, khỏi hỏi","Sửa nhận xét của học viên cho “mạnh” hơn, thêm số liệu họ không nói","Tạo thêm “học viên” kế toán Anh Nam, chị Lan có ảnh minh họa để đủ 10 người"],
explain="Chính đạo: xin phép, ghi đúng lời họ nói. Dùng ảnh không hỏi là xám; sửa lời hoặc thêm số liệu họ không nói là bóp méo sự thật; tạo học viên bịa là tà. Ít lời chứng thật vẫn tốt hơn nhiều lời chứng bịa vì chỉ một lần bị lộ là mất toàn bộ tin cậy. Làm đúng: mời thêm học viên cũ bằng khảo sát ngắn, ghi “ý kiến theo phản hồi của học viên, được phép đăng”."
, en="Ask permission and quote people accurately. Using photos unasked, altering quotes or inventing students escalates to deception."),
dict(tag="Trượt dốc – Excel Pro bước 3: thu thập khách tiềm năng", tag_en="Slippery slope B3", refs=["zalo","law"], lvl="chinh",
passage="Đội cần 2.000 người để nhắn quảng cáo khóa học. Họ có ngân sách chạy quảng cáo 15.000.000đ và đang cân nhắc cách thu thập thông tin liên hệ.",
stem="Bước 3/4: Cách thu thập nào đúng đạo?",
ok="Tặng tài liệu Excel miễn phí qua form đăng ký, ô đồng ý nhận email để trống, mỗi email có nút hủy nhận",
bad=["Dùng form bốc thăm có ô đồng ý nhận tin tick sẵn, chữ mờ","Mua danh sách 2.000 số điện thoại người làm văn phòng để nhắn Zalo","Thu thập số điện thoại từ khách tham gia minigame rồi chia sẻ cho đối tác không báo"],
explain="Chính đạo: xin đồng ý rõ ràng và cho phép rút lui. Ô tick sẵn là xám; mua danh sách là tà; chia sẻ dữ liệu không báo vi phạm lòng tin và có thể vi phạm quy định về dữ liệu cá nhân (kiểm tra lại bản mới nhất). Ở bước này nhiều đội “trượt” vì sợ thiếu người; thực tế 500 người tự đăng ký thường hiệu quả hơn 2.000 người nhận tin ngoài ý muốn (ví dụ giả định)."
, en="Collect consented leads with an unticked box and an unsubscribe link. Pre-ticked boxes, bought lists or unannounced sharing deepen the slide."),
dict(tag="Trượt dốc – Excel Pro bước 4: yêu cầu hoàn tiền", tag_en="Slippery slope B4", refs=["sp","law"], lvl="chinh",
passage="Quảng cáo hứa “hoàn tiền trong 7 ngày nếu chưa hài lòng”. Tuần đầu có 40 đơn, trong đó 8 học viên yêu cầu hoàn tiền (20%). Số này cao hơn dự tính của đội.",
stem="Bước 4/4: Xử lý yêu cầu hoàn tiền thế nào?",
ok="Hoàn tiền đúng như cam kết, hỏi lý do để cải thiện nội dung, giữ chính sách hoàn tiền trên trang",
bad=["Thêm điều kiện nhỏ “phải hoàn thành 90% bài học” vào điều khoản sau khi quảng cáo đã chạy","Bắt gọi tổng đài giờ hành chính mới được hoàn tiền","Từ chối hoàn tiền và chặn các học viên đã hỏi"],
explain="Lời hứa hoàn tiền là cam kết. Chính đạo: giữ đúng lời, học từ phản hồi (20% hoàn tiền cho thấy nội dung hoặc quảng cáo kỳ vọng chưa khớp). Đổi điều kiện sau khi chạy quảng cáo, làm khó thủ tục hoặc chặn học viên đều là cách “lấy lại” lời hứa. Hậu quả: khiếu nại, đánh giá xấu, có thể bị xử lý theo quy định bảo vệ người tiêu dùng (kiểm tra lại bản mới nhất). Số liệu 8/40 là ví dụ giả định."
, en="Honour the promised refund and use the feedback to improve. Changing terms after the fact, making refunds hard or blocking students deepens the slide."),
]
