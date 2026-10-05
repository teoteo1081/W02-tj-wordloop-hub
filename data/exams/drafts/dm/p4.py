# -*- coding: utf-8 -*-
# P4 Trượt dốc: 2 chiến dịch x 4 bước. ok = lựa chọn chính đạo; bad = 3 lựa chọn trượt dốc (nhẹ -> nặng).
P4 = [
dict(tag="Trượt dốc – Mầm Sáng bước 1: ra mắt chưa có đánh giá", tag_en="Slippery slope A1", refs=["fb","sp","law"], lvl="chinh",
passage="Chiến dịch “Kem dưỡng Mầm Sáng” (shop nhỏ, ngân sách 20.000.000đ). Hôm ra mắt, trang sản phẩm chưa có đánh giá nào. Chị chủ muốn có người “nói tốt” trước khi chạy quảng cáo.",
stem="Bước 1/4: Quyết định nào là đúng?",
ok="Tặng dùng thử cho 30 khách thật, nói rõ “được shop tặng”, mời họ đánh giá bất kể khen hay chê",
bad=["Nhân viên của shop vào nhóm đăng bài khen sản phẩm bằng tài khoản thật của mình nhưng không nói mình làm ở shop","Lập vài tài khoản phụ vào khen sản phẩm cho trang đỡ trống, chờ có đánh giá thật thì xóa bớt đi","Mua trọn gói 100 đánh giá 5 sao từ một dịch vụ bên ngoài để trang sản phẩm trông uy tín ngay hôm ra mắt"],
explain="Bước đầu nhìn nhỏ nhưng quyết định hướng đi. Chính đạo: tặng thử thật, công bố, nhận cả lời chê. Nhân viên giấu danh tính là xám; nick phụ và mua đánh giá là tà, dễ bị phát hiện và phải che tiếp ở các bước sau. Làm đúng thì 30 người dùng thử có thể mang về khoảng 10–15 đánh giá thật (ước tính, ví dụ giả định). Chính sách nền tảng có thể đổi, kiểm tra lại bản mới nhất."
, en="Gift to 30 real customers with disclosure and invite honest reviews. Hidden staff posts, extra accounts or bought reviews start the slide."),
dict(tag="Trượt dốc – Mầm Sáng bước 2: có đánh giá chê", tag_en="Slippery slope A2", refs=["sp","shopee","law"], lvl="chinh",
passage="Hai tuần sau Mầm Sáng có 12 đánh giá, trong đó 3 đánh giá 2 sao: “Kem hơi bết với da dầu”. Điểm trung bình tụt còn 4,1. Chị chủ lo doanh thu giảm.",
stem="Bước 2/4: Bạn xử lý thế nào?",
ok="Trả lời công khai từng đánh giá, tư vấn loại da phù hợp và đổi sang bản nhẹ cho khách da dầu",
bad=["Nhắn riêng cho các khách chê, tặng 20.000đ nếu họ chịu xóa đánh giá để điểm trung bình quay lại trên 4,5","Nhờ người quen viết thêm 10 đánh giá 5 sao để “đè” các đánh giá chê xuống dưới, điểm tăng nhanh trong tuần","Báo cáo với sàn để xóa cả 3 đánh giá chê với lý do nội dung không phù hợp dù thực tế không vi phạm gì"],
explain="Đánh giá chê là dữ liệu thật để cải thiện sản phẩm. Chính đạo: trả lời tử tế, đưa giải pháp. Trả tiền để xóa đánh giá THẬT là tà đạo (cùng cách gọi với câu tư vấn sếp đòi xóa đánh giá; chỉ xin khách xóa mà không trả tiền mới là vùng xám), viết thêm để “đè” là tà vì tạo bằng chứng giả, báo cáo vô lý có thể bị sàn phạt (kiểm tra lại chính sách mới nhất). Mỗi bước sai ở bước 1 đang kéo bạn phải che thêm ở bước này. Các con số (12 đánh giá, 3 đánh giá 2 sao, 20.000đ) là ví dụ giả định."
, en="Reply publicly with advice and an alternative. Paying to remove, adding fake praise or false reports deepen the slide."),
dict(tag="Trượt dốc – Mầm Sáng bước 3: doanh thu chậm", tag_en="Slippery slope A3", refs=["sp","tt","law"], lvl="chinh",
passage="Sau 1 tháng, doanh thu Mầm Sáng chỉ đạt một nửa mục tiêu. Chị chủ muốn tăng đơn ngay trong tuần với chương trình khuyến mãi và một buổi livestream. Giá thường của kem là 320.000đ.",
stem="Bước 3/4: Chương trình nào đúng đạo?",
ok="Giảm 15% còn 272.000đ đến hết Chủ nhật (hạn thật) và để livestream hiển thị đúng số tồn kho thật",
bad=["Ghi giá “gốc” 650.000đ rồi giảm 50% xuống 320.000đ, dù giá 650.000đ chưa từng được bán trước đây","Đặt đồng hồ đếm ngược tự chạy lại mỗi ngày kèm dòng “còn 5 hộp” trong khi trong kho vẫn còn khoảng 200 hộp","Trong livestream hô “còn 3 hộp cuối” nhiều lần và để màn hình báo đơn ảo liên tục cho người xem chốt nhanh"],
explain="Khuyến mãi thật, hạn thật, tồn kho thật là chính đạo. Giá gốc ảo, đồng hồ lặp, tồn kho giả là các biến thể của cùng một chiêu: tạo áp lực không có thật. Ở bước 3, “giải pháp nhanh” thường là bước trượt lớn nhất vì shop đang áp lực doanh thu. Làm đúng: nêu rõ điều kiện, giữ tồn kho thật, tặng kèm mẫu thử có giới hạn thật. Giảm 15% và các con số khác là ví dụ giả định; kiểm tra lại quy định quảng cáo mới nhất."
, en="Use a real discount with a real deadline and real stock numbers. Fake original prices, resetting timers and invented scarcity are all the same trick."),
dict(tag="Trượt dốc – Mầm Sáng bước 4: khiếu nại và bài tố", tag_en="Slippery slope A4", refs=["fb","law"], lvl="chinh",
passage="Một khách báo da bị kích ứng nhẹ sau khi dùng kem và đăng bài lên nhóm Facebook, có 400 lượt tương tác. Shop đang trong đợt khuyến mãi lớn và sợ ảnh hưởng đơn hàng.",
stem="Bước 4/4: Phản ứng nào đúng đạo?",
ok="Xin lỗi công khai, hoàn tiền cho khách, kiểm tra lô hàng liên quan rồi công bố kết quả kiểm tra cho mọi người",
bad=["Nhắn riêng cho khách và hứa bồi thường thêm 500.000đ nếu họ chịu xóa bài đăng trong nhóm Facebook","Đăng bài nói khách nói dối để bán hàng, kèm ảnh cá nhân của khách lấy từ trang cá nhân của họ","Dùng nhiều tài khoản vào nhóm phản bác bài của khách và khen sản phẩm để kéo dư luận về phía shop"],
explain="Khủng hoảng là lúc lộ rõ đạo đức. Chính đạo: xin lỗi, hoàn tiền, kiểm tra thật và công bố; khách thấy shop có trách nhiệm thường bớt giận. Ép xóa bài bằng tiền, tố ngược và đăng thông tin cá nhân của khách, hoặc dùng nick giả đều đã là tà đạo và có thể gây rắc rối pháp lý (kiểm tra lại quy định bảo vệ dữ liệu mới nhất). Chuỗi 4 bước cho thấy: một lựa chọn “vô hại” ở bước 1 buộc bạn phải che đậy thêm. Các con số (400 lượt tương tác, 500.000đ) là ví dụ giả định."
, en="Apologise publicly, refund, test the batch and publish findings. Hush money, counter-attacks and fake accounts are deceptive and risky."),
dict(tag="Trượt dốc – Excel Pro bước 1: tiêu đề trang đăng ký", tag_en="Slippery slope B1", refs=["fb","law"], lvl="chinh",
passage="Chiến dịch khóa học “Excel Pro 30 ngày” giá 1.470.000đ. Đội marketing viết tiêu đề trang đăng ký. Học viên mục tiêu là nhân viên văn phòng muốn làm báo cáo nhanh hơn.",
stem="Bước 1/4: Tiêu đề nào đúng đạo?",
ok="“30 bài Excel cho người đi làm – học xong tự làm được báo cáo cơ bản, hoàn tiền 7 ngày nếu chưa hài lòng”",
bad=["“Khóa Excel số 1 Việt Nam – 100% học viên được tăng lương gấp đôi chỉ sau 30 ngày học cùng chúng tôi”","“Bí quyết Excel mà các chuyên gia nước ngoài không muốn người Việt biết – học ngay trước khi nội dung bị gỡ”","“Học 30 ngày, đảm bảo có việc làm mới lương 20 triệu hoặc hoàn tiền gấp đôi, đăng ký ngay hôm nay”"],
explain="Cam kết đúng phạm vi khóa học và chính sách hoàn tiền rõ là chính đạo. “Số 1”, “100% học viên” cần bằng chứng; “bí quyết bị giấu” là clickbait; “đảm bảo việc 20 triệu” là hứa điều không kiểm soát được. Các lời hứa quá tay ở bước 1 buộc bạn phải bịa bằng chứng ở bước 2. Giá 1.470.000đ và thời hạn 7 ngày là ví dụ giả định. Kiểm tra lại quy định quảng cáo mới nhất."
, en="Promise only what the course can deliver and state the refund policy. Superlatives, hidden-secret headlines and job guarantees start the slide."),
dict(tag="Trượt dốc – Excel Pro bước 2: lời chứng thực học viên", tag_en="Slippery slope B2", refs=["fb","law"], lvl="chinh",
passage="Trang đăng ký cần lời chứng thực. Mới có 5 học viên cũ, trong đó 2 người ghi nhận xét tốt qua tin nhắn riêng, 3 người chưa trả lời. Đội muốn trang trông thuyết phục hơn trước khi chạy quảng cáo.",
stem="Bước 2/4: Làm thế nào cho đúng?",
ok="Xin phép 2 học viên đã nhận xét, ghi đúng tên/chức danh họ cho phép và mô tả đúng kết quả họ nói",
bad=["Lấy ảnh và nhận xét học viên đăng công khai trên mạng rồi dùng luôn trên trang đăng ký mà không hỏi ai","Sửa nhận xét của học viên cho “mạnh” hơn và thêm số liệu như “tăng 40% năng suất” dù họ không hề nói vậy","Bịa thêm vài “học viên” (ví dụ “kế toán Anh Nam”, “chị Lan”) kèm ảnh minh họa lấy trên mạng để đủ 10 nhận xét"],
explain="Chính đạo: xin phép, ghi đúng lời họ nói. Dùng ảnh không hỏi là xám; sửa lời hoặc thêm số liệu họ không nói là bóp méo sự thật; tạo học viên bịa là tà. Ít lời chứng thật vẫn tốt hơn nhiều lời chứng bịa vì chỉ một lần bị lộ là mất toàn bộ tin cậy. Làm đúng: mời thêm học viên cũ bằng khảo sát ngắn, ghi “ý kiến theo phản hồi của học viên, được phép đăng”. Các con số (5 học viên, 10 nhận xét, 40%) là ví dụ giả định."
, en="Ask permission and quote people accurately. Using photos unasked, altering quotes or inventing students escalates to deception."),
dict(tag="Trượt dốc – Excel Pro bước 3: thu thập khách tiềm năng", tag_en="Slippery slope B3", refs=["zalo","law"], lvl="chinh",
passage="Đội cần 2.000 người để nhắn quảng cáo khóa học. Họ có ngân sách chạy quảng cáo 15.000.000đ và đang cân nhắc cách thu thập thông tin liên hệ.",
stem="Bước 3/4: Cách thu thập nào đúng đạo?",
ok="Tặng tài liệu Excel miễn phí qua form đăng ký, ô đồng ý nhận email để trống, mỗi email đều có nút hủy nhận dễ thấy",
bad=["Dùng form bốc thăm có ô đồng ý nhận tin tick sẵn bằng chữ xám mờ, người tham gia khó nhận ra khi đăng ký","Mua trọn danh sách 2.000 số điện thoại của người làm văn phòng từ một nguồn bên ngoài để nhắn Zalo ngay","Thu thập số điện thoại của khách tham gia minigame rồi chia sẻ cho đối tác quảng cáo mà không báo khách biết"],
explain="Chính đạo: xin đồng ý rõ ràng và cho phép rút lui. Ô tick sẵn là xám; mua danh sách là tà; chia sẻ dữ liệu không báo vi phạm lòng tin và có thể vi phạm quy định về dữ liệu cá nhân (kiểm tra lại bản mới nhất). Ở bước này nhiều đội “trượt” vì sợ thiếu người; thực tế 500 người tự đăng ký thường hiệu quả hơn 2.000 người nhận tin ngoài ý muốn (ví dụ giả định)."
, en="Collect consented leads with an unticked box and an unsubscribe link. Pre-ticked boxes, bought lists or unannounced sharing deepen the slide."),
dict(tag="Trượt dốc – Excel Pro bước 4: yêu cầu hoàn tiền", tag_en="Slippery slope B4", refs=["sp","law"], lvl="chinh",
passage="Quảng cáo hứa “hoàn tiền trong 7 ngày nếu chưa hài lòng”. Tuần đầu có 40 đơn, trong đó 8 học viên yêu cầu hoàn tiền (20%). Số này cao hơn dự tính của đội.",
stem="Bước 4/4: Xử lý yêu cầu hoàn tiền thế nào?",
ok="Hoàn tiền đúng như cam kết, hỏi lý do để cải thiện nội dung, giữ chính sách hoàn tiền trên trang",
bad=["Thêm điều kiện nhỏ “phải hoàn thành 90% bài học” vào điều khoản sau khi quảng cáo đã chạy, áp dụng cả cho đơn cũ","Chỉ nhận yêu cầu hoàn tiền qua tổng đài giờ hành chính, thường báo bận, để nhiều học viên bỏ cuộc giữa chừng","Từ chối hoàn tiền với lý do học viên đã xem bài học và chặn tài khoản của những người đã hỏi nhiều lần"],
explain="Lời hứa hoàn tiền là cam kết. Chính đạo: giữ đúng lời, học từ phản hồi (20% hoàn tiền cho thấy nội dung hoặc quảng cáo kỳ vọng chưa khớp). Đổi điều kiện sau khi chạy quảng cáo, làm khó thủ tục hoặc chặn học viên đều là cách “lấy lại” lời hứa. Hậu quả: khiếu nại, đánh giá xấu, có thể bị xử lý theo quy định bảo vệ người tiêu dùng (kiểm tra lại bản mới nhất). Số liệu 8/40 là ví dụ giả định."
, en="Honour the promised refund and use the feedback to improve. Changing terms after the fact, making refunds hard or blocking students deepens the slide."),
]
