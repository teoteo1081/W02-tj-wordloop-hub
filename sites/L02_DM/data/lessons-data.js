// Digital Marketing Quest — Từ vựng + Trắc nghiệm Thực chiến 2026
// teoteo1081/L02-digital-marketing-beginner nâng cấp toàn diện theo PLAN v2 (16 module m01–m16).
(function () {
  var L = [
    ["m01", 1, "01 · Tổng quan & Customer Journey VN 2026", "m01.html"],
    ["m02", 1, "02 · Marketing Funnel & Kinh tế học Phễu", "m02.html"],
    ["m03", 1, "03 · Buyer Persona & Bảo vệ Dữ liệu Cá nhân", "m03.html"],
    ["m04", 1, "04 · Hệ sinh thái Nền tảng & Sàn TMĐT VN", "m04.html"],
    ["m05", 2, "05 · Meta Ads: ODAX, Advantage+ & CAPI", "m05.html"],
    ["m06", 2, "06 · TikTok GMV Max, Google PMax & Zalo Ads", "m06.html"],
    ["m07", 3, "07 · SEO, GEO (AI Overviews) & Google Maps", "m07.html"],
    ["m08", 3, "08 · Xây Kênh Organic, Cộng đồng & Zalo OA/ZNS", "m08.html"],
    ["m09", 3, "09 · Đo lường: KPI, ROAS Hoà vốn, UTM & GA4", "m09.html"],
    ["m10", 3, "10 · A/B Testing, Tối ưu & Capstone Mini-Funnel", "m10.html"],
    ["m11", 4, "11 · 5 Con đường Kiếm tiền DM & Thuế Thực tế", "m11.html"],
    ["m12", 4, "12 · Xây Portfolio từ Số 0 & Tìm Khách Đầu tiên", "m12.html"],
    ["m13", 4, "13 · Tiếp nhận Brief & Khám bệnh Phễu Bán hàng", "m13.html"],
    ["m14", 4, "14 · Định giá, Báo giá, ROAS Hoà vốn & Hợp đồng", "m14.html"],
    ["m15", 4, "15 · Quy trình Vận hành AI & Báo cáo Giữ chân Khách", "m15.html"],
    ["m16", 4, "16 · Quản trị Rủi ro BM, Khủng hoảng & Pháp lý 2026", "m16.html"]
  ];
  var title = {}; L.forEach(function (l) { title[l[0]] = l[2]; });

  var V = {
    m01: [
      ["digital marketing", "tiếp thị trên môi trường số (mạng xã hội, Google, web, app…) nhằm đạt mục tiêu kinh doanh đo được"],
      ["customer journey", "hành trình khách hàng: từ lúc biết đến khi mua và quay lại mua tiếp"],
      ["touchpoint", "điểm chạm: mỗi nơi khách gặp thương hiệu (video TikTok, bài Group, tin nhắn Zalo, gian hàng sàn)"],
      ["paid media", "kênh truyền thông trả phí: quảng cáo Meta Ads, Google Ads, TikTok Ads, Shopee Ads"],
      ["organic media", "kênh tự nhiên không trả phí: bài đăng Fanpage, video viral, bài SEO Google, cộng đồng Group"],
      ["channel mix", "tổ hợp kênh phối hợp: kết hợp 2–3 kênh ăn khớp với nhau thay vì dàn trải"],
      ["brand awareness", "mức độ nhận biết và ghi nhớ thương hiệu trong tâm trí khách hàng"],
      ["word of mouth", "tiếp thị truyền miệng: khách hàng hài lòng tự chia sẻ và giới thiệu cho người khác"],
      ["social proof", "bằng chứng xã hội: đánh giá sao, review thật, số lượng đơn đã bán chứng minh uy tín"],
      ["social commerce", "thương mại mạng xã hội: mua hàng trực tiếp ngay trong trải nghiệm xem video/livestream"],
      ["omnichannel", "tiếp thị đa kênh liền mạch: đồng bộ trải nghiệm khách hàng giữa online, mạng xã hội và cửa hàng"],
      ["conversion path", "đường dẫn chuyển đổi: lộ trình dẫn dắt người xem từ click quảng cáo đến thanh toán thành công"],
      ["ROAS", "doanh thu trên chi phí quảng cáo (Return On Ad Spend = Doanh thu ÷ Chi phí ads)"],
      ["customer lifetime value (CLV)", "giá trị vòng đời: tổng số tiền khách hàng chi trả trong suốt thời gian gắn bó"],
      ["zero-moment of truth (ZMOT)", "khoảnh khắc số 0: khách hàng chủ động tự tra cứu review trên mạng trước khi liên hệ người bán"]
    ],
    m02: [
      ["marketing funnel", "phễu tiếp thị: mô hình số lượng người quan tâm giảm dần qua từng bước đến khi mua hàng"],
      ["TOFU (Top of Funnel)", "đầu phễu (Awareness): giai đoạn thu hút người lạ biết đến thương hiệu"],
      ["MOFU (Middle of Funnel)", "giữa phễu (Consideration): giai đoạn khách hàng cân nhắc, tìm hiểu và so sánh giải pháp"],
      ["BOFU (Bottom of Funnel)", "đáy phễu (Conversion): giai đoạn khách hàng ra quyết định chốt đơn mua hàng"],
      ["retention", "giữ chân sau mua: chăm sóc khách cũ quay lại mua tiếp và giới thiệu người khác"],
      ["drop-off rate", "tỷ lệ rơi rớt: phần trăm khách hàng dừng lại không chuyển tiếp sang bước tiếp theo trong phễu"],
      ["bottleneck", "nút thắt cổ chai: điểm có tỷ lệ rớt khách cao bất thường làm nghẽn dòng doanh thu"],
      ["landing page", "trang đích đơn mục tiêu khách đến sau khi bấm vào quảng cáo"],
      ["lead", "khách hàng tiềm năng đã để lại thông tin liên hệ (SĐT, email, nhu cầu)"],
      ["conversion rate (CR)", "tỷ lệ chuyển đổi: số người thực hiện hành động mục tiêu ÷ tổng lượt truy cập (%)"],
      ["customer acquisition cost (CAC)", "chi phí để có được 1 khách hàng mới (tổng chi phí tiếp thị & bán hàng ÷ số khách mới)"],
      ["AIDA model", "mô hình kinh điển: Chú ý (Attention) → Thích thú (Interest) → Khao khát (Desire) → Hành động (Action)"],
      ["average order value (AOV)", "giá trị đơn hàng trung bình (tổng doanh thu ÷ tổng số đơn hàng thành công)"],
      ["post-purchase loop", "vòng lặp sau mua hàng: quy trình chăm sóc, bảo hành và ưu đãi nuôi dưỡng khách trung thành"],
      ["lead magnet", "mồi câu thông tin: tài liệu hay quà tặng miễn phí đổi lấy số điện thoại khách hàng"]
    ],
    m03: [
      ["buyer persona", "chân dung khách hàng mục tiêu lý tưởng, được xây dựng từ dữ liệu thật"],
      ["pain point", "nỗi đau / rào cản nhức nhối khiến khách hàng bức xúc cần tìm giải pháp"],
      ["target audience", "nhóm đối tượng khách hàng mục tiêu doanh nghiệp hướng tới"],
      ["demographics", "nhân khẩu học: độ tuổi, giới tính, nơi sinh sống, nghề nghiệp, mức thu nhập"],
      ["trigger", "yếu tố kích hoạt quyết định mua: lương về, sự kiện cưới hỏi, hàng sắp hết"],
      ["survey", "phiếu khảo sát ngắn 5–7 câu hỏi tìm hiểu hành vi khách hàng"],
      ["consumer insight", "sự thật ngầm hiểu về động lực sâu kín chi phối hành vi mua của khách hàng"],
      ["customer segment", "phân khúc khách hàng: nhóm nhỏ có chung đặc điểm hành vi và nhu cầu"],
      ["first-party data", "dữ liệu cấp 1: dữ liệu do chính doanh nghiệp thu thập hợp pháp từ khách hàng cũ"],
      ["opt-in consent", "sự đồng ý tường minh chủ động của khách hàng trước khi thu thập dữ liệu (Điều 28 Luật 91/2025)"],
      ["opt-out mechanism", "cơ chế từ chối nhận thông tin tiếp thị dễ dàng, miễn phí cho người dùng"],
      ["value proposition", "tuyên ngôn giá trị: lý do thuyết phục nhất để khách hàng chọn bạn thay vì đối thủ"],
      ["RFM analysis", "phân tích khách hàng theo Recency (mua gần đây) – Frequency (tần suất) – Monetary (chi tiêu)"],
      ["buying objection", "rào cản từ chối mua hàng: sợ đắt, sợ hàng giả, ngại đổi trả phức tạp"]
    ],
    m04: [
      ["Zalo OA (Official Account)", "tài khoản Zalo chính thức của doanh nghiệp có tích xác thực"],
      ["ZNS (Zalo Notification Service)", "dịch vụ thông báo giao dịch/CSKH tự động qua số điện thoại theo template duyệt sẵn"],
      ["Zalo Mini App", "ứng dụng thu nhỏ chạy mượt mà ngay trong Zalo để đặt bàn, mua sắm, tích điểm"],
      ["TikTok Shop", "gian hàng thương mại điện tử tích hợp ngay trong ứng dụng TikTok"],
      ["Shopee Ads", "quảng cáo nội sàn Shopee hiển thị tại trang tìm kiếm và gợi ý hôm nay"],
      ["e-commerce marketplace", "sàn thương mại điện tử (Shopee, TikTok Shop, Lazada) có sẵn hạ tầng thanh toán"],
      ["withholding tax (khấu trừ tại nguồn)", "thuế sàn khấu trừ nộp thay 1,5% doanh thu hàng hoá cá nhân cư trú (NĐ 117/2025/NĐ-CP)"],
      ["marketplace take rate", "tổng tỷ lệ phí sàn thu (phí cố định, phí thanh toán, voucher xtra, freeship) chiếm 12–18%"],
      ["Google Business Profile (GBP)", "hồ sơ doanh nghiệp trên Google Maps phục vụ tìm kiếm địa phương"],
      ["break-even ROAS", "ROAS hoà vốn tối thiểu để không bị lỗ vốn sau khi trừ giá vốn, phí sàn và thuế"],
      ["livestream selling", "bán hàng qua phát trực tiếp chốt đơn theo cảm xúc tức thì"],
      ["search intent", "ý định tìm kiếm: thông tin, so sánh hay sẵn sàng mua hàng"],
      ["SME", "doanh nghiệp vừa và nhỏ có nguồn lực tiếp thị giới hạn"],
      ["gross merchandise value (GMV)", "tổng giá trị giao dịch hàng hoá trên sàn trước khi trừ chiết khấu và phí"],
      ["channel mix", "tổ hợp kênh phối hợp kéo khách – chốt đơn – chăm sóc sau mua"]
    ],
    m05: [
      ["ODAX framework", "khung 6 mục tiêu quảng cáo Meta dựa trên kết quả đầu ra (Outcome-Driven Ad Experiences)"],
      ["campaign", "chiến dịch quảng cáo: tầng cao nhất chọn mục tiêu ODAX và ngân sách chiến dịch (CBO)"],
      ["ad set", "nhóm quảng cáo: tầng cài đặt đối tượng nhắm chọn, vị trí hiển thị, lịch và ngân sách"],
      ["ad creative", "nội dung quảng cáo: hình ảnh, video, tiêu đề và nút kêu gọi hành động (CTA)"],
      ["Conversions API (CAPI)", "API chuyển đổi máy chủ: gửi dữ liệu sự kiện trực tiếp từ web về Meta không qua cookie"],
      ["event deduplication", "khử trùng lặp sự kiện: dùng cặp event_id + event_name để Meta không đếm trùng"],
      ["event match quality (EMQ)", "điểm chất lượng khớp sự kiện (thang 0–10) đo độ chính xác dữ liệu khách hàng gửi về"],
      ["Advantage+ Audience", "đối tượng tự động hoá AI: Meta tự mở rộng tìm kiếm khách hàng ngoài gợi ý ban đầu"],
      ["Advantage+ Campaign Budget (CBO)", "ngân sách chiến dịch tự động phân bổ tiền về nhóm quảng cáo hiệu quả nhất"],
      ["learning phase", "giai đoạn máy học: cần đạt ~50 sự kiện chuyển đổi trong 7 ngày để chi phí ổn định"],
      ["learning limited", "hạn chế máy học: cảnh báo nhóm quảng cáo không gom đủ 50 kết quả/tuần do ngân sách ít"],
      ["custom audience", "đối tượng tuỳ chỉnh: tệp người đã từng nhắn tin, xem video hoặc vào website"],
      ["lookalike audience (LAL)", "đối tượng tương tự: thuật toán tìm người có đặc điểm giống với tệp khách hàng cũ"],
      ["core audience", "đối tượng cơ bản nhắm chọn theo độ tuổi, giới tính, vị trí và sở thích thủ công"],
      ["hook 3-second", "móc câu 3 giây đầu: câu nói hoặc hình ảnh mở màn giữ chân người xem không lướt qua"],
      ["CTA (Call To Action)", "lời kêu gọi hành động cụ thể: Nhắn tin ngay, Đặt lịch hẹn, Mua ngay"],
      ["placement", "vị trí hiển thị quảng cáo: Bảng nguồn cấp dữ liệu (Feed), Tin (Stories), Thước phim (Reels)"],
      ["daily budget", "ngân sách chi tiêu giới hạn mỗi ngày cho chiến dịch hoặc nhóm quảng cáo"]
    ],
    m06: [
      ["Product GMV Max", "chiến dịch TikTok Shop tự động tối đa hoá doanh số cho sản phẩm được chọn"],
      ["LIVE GMV Max", "chiến dịch TikTok Shop tự động bơm lượng truy cập chuyển đổi cao vào phiên livestream"],
      ["blended attribution", "cơ chế quy gán gộp: TikTok gộp cả đơn tự nhiên và affiliate vào tổng ROI chiến dịch"],
      ["incremental ROAS", "ROAS tăng thêm thực tế: (Doanh thu tổng − Doanh thu tự nhiên nền) ÷ Chi phí quảng cáo"],
      ["Performance Max (PMax)", "chiến dịch hiệu suất tối đa của Google tự động phân bổ trên Search, Maps, YouTube, Gmail"],
      ["Spark Ads", "quảng cáo video tự nhiên của TikTok dùng mã uỷ quyền từ kênh của KOC hoặc shop"],
      ["In-Feed Ads", "quảng cáo video ngắn hiển thị xen kẽ trên trang Dành cho bạn (For You) của TikTok"],
      ["KOL / KOC", "người có tầm ảnh hưởng / người tiêu dùng review chịu điều chỉnh của Luật QC 75/2025/QH15"],
      ["phrase match", "đối sánh cụm từ trong Google Search Ads: đặt trong dấu ngoặc kép \"từ khoá\""],
      ["exact match", "đối sánh chính xác trong Google Search Ads: đặt trong dấu ngoặc vuông [từ khoá]"],
      ["negative keyword", "từ khoá phủ định: chặn quảng cáo hiển thị khi người dùng gõ từ không mong muốn"],
      ["quality score", "điểm chất lượng từ khoá của Google (1–10) dựa trên CTR dự kiến, độ liên quan và trang đích"],
      ["Zalo Lead Form", "biểu mẫu thu thập thông tin khách hàng tiềm năng hiển thị khép kín ngay trong Zalo"],
      ["interruption marketing", "tiếp thị ngắt quãng: quảng cáo xuất hiện khi người dùng đang lướt giải trí trên MXH"],
      ["intent-based marketing", "tiếp thị đón đầu nhu cầu: xuất hiện khi người dùng chủ động tìm kiếm giải pháp trên Google"],
      ["search keyword", "từ khoá tìm kiếm khách hàng nhập vào thanh tìm kiếm của Google"],
      ["display network", "mạng lưới quảng cáo banner hiển thị trên hàng triệu website và ứng dụng đối tác"]
    ],
    m07: [
      ["SEO (Search Engine Optimization)", "tối ưu hoá công cụ tìm kiếm: cải thiện thứ hạng tự nhiên trên Google"],
      ["GEO (Generative Engine Optimization)", "tối ưu hoá cho công cụ tìm kiếm AI (Google AI Overviews, ChatGPT)"],
      ["AI Overviews", "khối câu trả lời tổng hợp bằng AI hiển thị ngay đầu trang kết quả tìm kiếm Google"],
      ["zero-click search", "tìm kiếm không click: người dùng đọc xong câu trả lời AI trên kết quả rồi rời đi"],
      ["E-E-A-T framework", "tiêu chuẩn chất lượng Google: Trải nghiệm – Chuyên môn – Thẩm quyền – Đáng tin cậy"],
      ["Google Business Profile (GBP)", "hồ sơ doanh nghiệp trên Google Maps phục vụ thu hút khách hàng địa phương"],
      ["NAP consistency", "sự nhất quán 100% giữa Tên (Name) – Địa chỉ (Address) – Số điện thoại (Phone)"],
      ["on-page SEO", "tối ưu ngay trên trang web: tiêu đề H1, thẻ mô tả, cấu trúc đề mục, tốc độ tải trang"],
      ["meta description", "đoạn mô tả ngắn gọn tóm tắt nội dung bài viết hiển thị trên trang kết quả Google"],
      ["heading (H1, H2, H3)", "các thẻ tiêu đề phân cấp cấu trúc thông tin khoa học trong bài viết"],
      ["page speed & mobile-friendly", "tốc độ trang tải dưới 2,5s và giao diện tối ưu hoàn hảo cho điện thoại di động 390px"],
      ["long-tail keyword", "từ khoá đuôi dài cụ thể (4–6 từ) có độ cạnh tranh thấp và tỷ lệ chuyển đổi mua hàng cao"],
      ["content pillar", "bài viết trụ cột chuyên sâu bao quát toàn bộ chủ đề lớn liên kết các bài vệ tinh"],
      ["backlink", "liên kết từ các website uy tín khác trỏ về chứng minh độ thẩm quyền của trang web"],
      ["organic traffic", "lưu lượng truy cập tìm kiếm tự nhiên miễn phí không phải trả tiền theo click"]
    ],
    m08: [
      ["Facebook Page", "trang thông tin chính thức của doanh nghiệp trên nền tảng mạng xã hội Facebook"],
      ["social community group", "nhóm cộng đồng nơi khách hàng trao đổi kinh nghiệm, phản hồi và đánh giá sản phẩm"],
      ["engagement rate", "tỷ lệ tương tác: (thích + bình luận + chia sẻ) ÷ tổng số người tiếp cận nội dung"],
      ["content calendar", "bảng kế hoạch lịch xuất bản nội dung chi tiết theo ngày, giờ và định dạng"],
      ["Reels / Short Video", "video ngắn dạng dọc thu hút lượt xem tự nhiên trên Facebook và Instagram"],
      ["user-generated content (UGC)", "nội dung hình ảnh, video đánh giá do chính người tiêu dùng thật tự sản xuất"],
      ["broadcast message", "tin nhắn gửi hàng loạt định kỳ cho những người đã bấm Quan tâm trang Zalo OA"],
      ["template message", "mẫu tin nhắn ZNS được Zalo kiểm duyệt trước dành riêng cho thông báo giao dịch"],
      ["Zalo Mini App", "ứng dụng chăm sóc khách hàng và tích điểm thành viên thu nhỏ hoạt động trong Zalo"],
      ["social commerce", "bán hàng và tương tác chốt đơn đa điểm chạm trên mạng xã hội"],
      ["transparent seeding", "seeding thảo luận minh bạch đúng luật, nghiêm cấm dùng tài khoản ảo đánh giá giả mạo"],
      ["opt-out mechanism", "cơ chế từ chối nhận tin nhắn tiếp thị dễ dàng, bắt buộc theo Luật BVDLCN 91/2025"],
      ["social algorithm", "thuật toán phân phối nội dung của nền tảng dựa trên mức độ quan tâm của người xem"],
      ["brand advocacy", "sự ủng hộ nhiệt thành: khách hàng cũ tự hào đi giới thiệu sản phẩm cho người quen"]
    ],
    m09: [
      ["KPI (Key Performance Indicator)", "chỉ số đánh giá hiệu suất cốt lõi đo lường mức độ hoàn thành mục tiêu"],
      ["key event (GA4)", "sự kiện chính trong GA4 (thay cho Conversion) đánh dấu hành động giá trị nhất của khách"],
      ["engaged session", "phiên tương tác thật: kéo dài >10s, hoặc xem ≥2 trang, hoặc có ít nhất 1 Key event"],
      ["engagement rate", "tỷ lệ phiên có tương tác thật (số phiên tương tác ÷ tổng số phiên truy cập)"],
      ["bounce rate (GA4)", "tỷ lệ thoát kiểu mới trong GA4: được tính bằng 100% − Tỷ lệ tương tác"],
      ["break-even ROAS", "ROAS hoà vốn tối thiểu: 1 ÷ Biên lợi nhuận ròng trước quảng cáo"],
      ["UTM parameters", "tham số theo dõi gắn vào link: utm_source, utm_medium, utm_campaign, utm_content"],
      ["utm_source", "tham số xác định nguồn gốc lưu lượng truy cập (facebook, google, tiktok, zalo)"],
      ["utm_medium", "tham số xác định hình thức kênh (cpc, social, organic, email, zns)"],
      ["utm_campaign", "tham số xác định tên chiến dịch tiếp thị cụ thể"],
      ["Google Consent Mode v2", "chế độ chấp thuận v2 truyền 4 tín hiệu đồng ý quyền riêng tư sang Google"],
      ["impression", "lượt hiển thị: số lần mẫu quảng cáo xuất hiện trên màn hình người dùng"],
      ["reach", "số người tiếp cận: số lượng người dùng duy nhất nhìn thấy mẫu quảng cáo"],
      ["CTR (Click-Through Rate)", "tỷ lệ nhấp chuột (số click ÷ lượt hiển thị %) đo lường sức hút của mẫu ads"],
      ["CPC (Cost Per Click)", "chi phí trung bình trên mỗi lượt nhấp chuột vào liên kết quảng cáo (VNĐ)"],
      ["CPM (Cost Per Mille)", "chi phí cho 1.000 lượt hiển thị mẫu quảng cáo trên màn hình người dùng (VNĐ)"],
      ["CPA (Cost Per Action)", "chi phí trên mỗi hành động mục tiêu hoàn thành (đơn hàng, số điện thoại lead)"],
      ["conversion rate", "tỷ lệ chuyển đổi: số người hoàn thành mục tiêu ÷ tổng số lượt truy cập (%)"],
      ["frequency", "tần suất hiển thị trung bình mỗi người nhìn thấy quảng cáo (Hiển thị ÷ Reach)"],
      ["traffic acquisition", "báo cáo phân bổ nguồn truy cập của người dùng mới vào website trong GA4"],
      ["attribution window", "cửa sổ quy gán kết quả chuyển đổi cho quảng cáo (click 7 ngày, xem 1 ngày)"],
      ["session", "một phiên truy cập website của người dùng trong một khoảng thời gian nhất định"]
    ],
    m10: [
      ["A/B testing (split testing)", "thử nghiệm phân tách: chạy song song 2 phiên bản chỉ khác 1 biến số duy nhất"],
      ["single variable", "biến số duy nhất được thay đổi trong mỗi thử nghiệm để đo lường chính xác"],
      ["control group", "nhóm đối chứng: phiên bản quảng cáo hiện tại dùng làm mốc so sánh với bản mới"],
      ["budget scaling", "nhân rộng ngân sách: tăng 15–20% mỗi lần để thuật toán máy không bị phá vỡ"],
      ["kill rule", "quy tắc cắt lỗ: ngưỡng chi tiêu tối đa (1,5× CPA mục tiêu) để tắt nhóm quảng cáo kém"],
      ["ad fatigue", "ngán quảng cáo: tần suất tăng cao (Frequency > 4) làm CTR giảm mạnh và CPA tăng"],
      ["statistical significance", "ý nghĩa thống kê: độ tin cậy >95% đảm bảo kết quả thử nghiệm không do ngẫu nhiên"],
      ["incremental lift", "mức tăng trưởng thực chất do yếu tố mới tạo ra so với mức cơ sở ban đầu"],
      ["unit economics", "kinh tế học đơn vị: bài toán tính toán chi phí, giá vốn và biên lãi trên 1 đơn hàng"],
      ["mini-funnel", "phễu thu nhỏ: 1 sản phẩm + 1 persona + 1 kênh kéo + 1 kênh chốt + hệ thống đo"],
      ["capstone project", "đồ án thực chiến tổng kết: bộ hồ sơ hoàn chỉnh chứng minh năng lực tiếp thị số"],
      ["optimization loop", "chu trình tối ưu liên tục: Thử nghiệm → Đo lường → Rút kinh nghiệm → Nhân rộng"],
      ["learning phase reset", "bị học lại từ đầu: trạng thái máy học bị khởi động lại khi sửa đổi quá 20% ngân sách"],
      ["creative refresh", "làm mới nội dung sáng tạo: thay đổi ảnh/video mới để đối phó hiện tượng Ad Fatigue"]
    ],
    m11: [
      ["niche market", "ngách thị trường chuyên biệt: tập trung phục vụ một nhóm đối tượng hoặc ngành hàng cụ thể"],
      ["freelancer", "chuyên viên làm việc tự do: cung cấp dịch vụ chuyên môn tiếp thị cho các doanh nghiệp"],
      ["monthly retainer", "phí dịch vụ quản trị cố định hàng tháng trả đều đặn để vận hành chiến dịch"],
      ["boutique agency", "agency tinh gọn chuyên sâu: nhóm 2–5 người cung cấp giải pháp trọn phễu cho một ngách"],
      ["in-house marketer", "nhân sự tiếp thị nội bộ: làm việc toàn thời gian cho 1 công ty, hưởng lương cứng"],
      ["affiliate marketing", "tiếp thị liên kết: gắn link giỏ hàng hưởng hoa hồng % trên doanh số đơn hàng thành công"],
      ["creator economy", "nền kinh tế sáng tạo nội dung: tạo thu nhập từ review sản phẩm, tài trợ và affiliate"],
      ["gross revenue", "tổng doanh thu gộp từ dịch vụ hoặc bán hàng trước khi trừ các khoản chi phí"],
      ["net income", "thu nhập ròng thực nhận sau khi đã trừ toàn bộ chi phí giá vốn, phí sàn và thuế"],
      ["withholding tax (khấu trừ tại nguồn)", "thuế thu nhập được bên chi trả giữ lại nộp thay vào ngân sách nhà nước"],
      ["tax threshold", "ngưỡng doanh thu tính thuế: mức 200 triệu đồng/năm không chịu thuế theo Luật 48/2024"],
      ["business household", "hộ kinh doanh cá thể: mô hình kinh doanh nộp thuế theo tỷ lệ 7% đối với dịch vụ marketing"],
      ["scope of work (SOW)", "bản phạm vi công việc cam kết cụ thể trong hợp đồng dịch vụ tiếp thị"],
      ["ad spend pass-through", "dòng tiền ngân sách quảng cáo khách hàng tự thanh toán trực tiếp cho nền tảng"]
    ],
    m12: [
      ["portfolio", "hồ sơ năng lực thực chiến: tập hợp các dự án, bài viết và chiến dịch mẫu chứng minh kỹ năng"],
      ["mock project", "dự án phân tích giả lập: bản audit và thiết kế phễu gắn nhãn giả lập minh bạch"],
      ["case study", "hồ sơ nghiên cứu tình huống: Bối cảnh → Nút thắt → Giải pháp thực thi → Kết quả"],
      ["cold outreach", "tiếp cận khách hàng lạ: gửi tin nhắn hoặc bản nhận xét đề xuất giải pháp cho chủ shop"],
      ["warm lead", "khách hàng tiềm năng ấm: người quen, bạn bè giới thiệu hoặc đã tương tác với bài viết của bạn"],
      ["discovery audit", "bản khám bệnh phễu ban đầu: phân tích ngắn chỉ ra 3 điểm làm rớt khách trên web/Google Maps"],
      ["paid pilot", "gói chạy thử nghiệm có thu phí: hợp đồng 7–14 ngày với chi phí vừa phải để đo lường chỉ số nền"],
      ["scope creep", "phình phạm vi công việc: khách hàng liên tục đòi làm thêm việc ngoài thoả thuận ban đầu"],
      ["unique selling proposition (USP)", "lợi thế bán hàng độc nhất: điểm khác biệt nổi bật của dịch vụ bạn cung cấp"],
      ["conversion path audit", "kiểm toán luồng chuyển đổi: rà soát trải nghiệm từ click ads đến khâu chốt đơn trên điện thoại"],
      ["deliverables", "sản phẩm bàn giao cụ thể: số bài viết, bộ ảnh, video ngắn, tài khoản CAPI đã kết nối"],
      ["milestone payment", "thanh toán theo mốc giai đoạn: tạm ứng 50% khi ký hợp đồng và 50% còn lại khi nghiệm thu"],
      ["non-disclosure agreement (NDA)", "thoả thuận bảo mật thông tin kinh doanh và dữ liệu nội bộ của khách hàng"],
      ["social proof", "bằng chứng xã hội thực tế: feedback chân thực từ khách hàng chứng minh năng lực"]
    ],
    m13: [
      ["client discovery brief", "bản khai thác yêu cầu khách hàng: ghi nhận mục tiêu, ngân sách và sản phẩm chủ lực"],
      ["discovery call", "buổi phỏng vấn chẩn đoán ban đầu 30 phút để hiểu rõ bài toán kinh doanh của khách hàng"],
      ["funnel diagnostics", "khám bệnh bắt mạch phễu: rà soát tốc độ trang, luồng chat để tìm ra điểm rơi rớt khách"],
      ["unit economics", "kinh tế học đơn vị: tính toán giá vốn, phí sàn và thuế để xác định biên lãi trên 1 đơn hàng"],
      ["lead response time", "thời gian phản hồi khách tiềm năng: thời gian từ khi khách nhắn đến khi nhân viên trả lời"],
      ["conversion bottleneck", "điểm nghẽn chuyển đổi: bước có tỷ lệ rớt khách cao làm thất thoát đơn hàng"],
      ["first-party data verification", "xác minh dữ liệu khách hàng: kiểm tra tính hợp pháp của danh sách SĐT theo Điều 28 Luật 91/2025"],
      ["regulated product", "sản phẩm kinh doanh có điều kiện: hàng hoá bắt buộc có giấy phép trước khi quảng cáo"],
      ["expectation management", "quản trị kỳ vọng: làm rõ những gì quảng cáo làm được và những gì phụ thuộc khâu chốt sale"],
      ["baseline metric", "chỉ số đo lường nền tảng: mức hiệu suất thực tế đo trong 7–14 ngày đầu làm mốc tối ưu"],
      ["red flag", "dấu hiệu cảnh báo rủi ro: yêu cầu phi lý hoặc vi phạm pháp luật báo hiệu dự án thất bại"],
      ["SLA (Service Level Agreement)", "cam kết mức độ dịch vụ: thoả thuận về tốc độ phản hồi tin nhắn của đội sale khách hàng"],
      ["gross margin", "biên lợi nhuận gộp: phần trăm chênh lệch giữa giá bán và giá vốn hàng bán"],
      ["digital asset audit", "kiểm toán tài sản số: kiểm tra quyền sở hữu BM, Fanpage, Zalo OA và pixel đo lường"]
    ],
    m14: [
      ["pricing model", "mô hình định giá dịch vụ: tính phí theo tháng, theo dự án trọn gói hoặc phí cứng + thưởng KPI"],
      ["monthly retainer", "phí dịch vụ duy trì hàng tháng để quản lý chiến dịch và tối ưu hoá liên tục"],
      ["performance bonus", "thưởng theo hiệu quả vượt trội: khoản thưởng thêm khi chiến dịch vượt mốc doanh thu"],
      ["break-even ROAS", "điểm ROAS hoà vốn: ngưỡng doanh thu tối thiểu trên mỗi đồng quảng cáo để không bị lỗ"],
      ["quotation (báo giá)", "bảng chào giá dịch vụ: tài liệu thể hiện rõ các gói, sản phẩm bàn giao và chi phí"],
      ["statement of work (SOW)", "bản mô tả phạm vi công việc chi tiết kèm theo hợp đồng dịch vụ tiếp thị"],
      ["revision limit", "giới hạn số vòng chỉnh sửa: quy định mỗi sản phẩm được sửa tối đa 2 lần để tránh phình việc"],
      ["service level agreement (SLA)", "cam kết tốc độ phản hồi: yêu cầu đội ngũ sale phản hồi lead trong vòng 5–15 phút"],
      ["data controller", "bên kiểm soát dữ liệu cá nhân: doanh nghiệp thuê dịch vụ quyết định mục đích xử lý dữ liệu"],
      ["data processor", "bên xử lý dữ liệu cá nhân: agency/freelancer thực hiện xử lý dữ liệu theo uỷ quyền hợp đồng"],
      ["data processing agreement (DPA)", "phụ lục thoả thuận xử lý dữ liệu cá nhân bắt buộc theo Điều 28 Luật 91/2025/QH15"],
      ["termination clause", "điều khoản chấm dứt hợp đồng và thời hạn thông báo trước giữa hai bên"],
      ["intellectual property (IP)", "quyền sở hữu trí tuệ đối với các sản phẩm bài viết, video sau khi thanh toán đủ"],
      ["indemnity clause", "điều khoản miễn trừ trách nhiệm khi khách hàng cung cấp sản phẩm vi phạm giấy phép"],
      ["contribution margin", "số dư đảm phí: số tiền còn lại sau khi lấy doanh thu trừ đi toàn bộ chi phí biến đổi"]
    ],
    m15: [
      ["generative AI (GenAI)", "trí tuệ nhân tạo tạo sinh: công cụ tự động tạo văn bản, kịch bản, hình ảnh hỗ trợ marketing"],
      ["AI hallucination", "ảo giác AI: hiện tượng AI tự bịa ra số liệu thống kê, điều luật hoặc công dụng không có thật"],
      ["human-in-the-loop (HITL)", "quy tắc con người kiểm duyệt: bắt buộc chuyên viên phải xác minh trước khi xuất bản"],
      ["creative angle", "góc tiếp cận sáng tạo: góc nhìn đánh vào từng nỗi đau cụ thể của khách hàng mục tiêu"],
      ["synthetic media disclosure", "gắn nhãn nội dung do AI tạo ra theo chuẩn đạo đức và chính sách nền tảng"],
      ["monthly executive report", "báo cáo quản trị cấp cao hàng tháng 1 trang tập trung vào tác động doanh thu và chi phí"],
      ["retainer retention", "tỷ lệ giữ chân khách thuê tháng: tỷ lệ khách hàng tiếp tục ký gia hạn hợp đồng dịch vụ"],
      ["client churn", "tỷ lệ khách hàng rời bỏ: phần trăm khách hàng chấm dứt hợp đồng sau 1–2 tháng đầu"],
      ["month-over-month (MoM)", "tăng trưởng so với tháng trước: chỉ số so sánh hiệu quả giữa 2 tháng liên tiếp"],
      ["actionable insight", "hiểu biết có thể hành động ngay: phát hiện từ số liệu dẫn thẳng đến quyết định kinh doanh"],
      ["prompt context", "ngữ cảnh nạp cho AI: dữ liệu đầu vào cung cấp để AI sinh ra nội dung sát thực tế Việt Nam"],
      ["quarterly business review (QBR)", "buổi đánh giá kinh doanh theo quý giữa agency và chủ doanh nghiệp"],
      ["blended ROAS vs incremental ROAS", "so sánh giữa ROAS gộp và ROAS tăng thêm thực tế sau khi trừ doanh thu tự nhiên"],
      ["attribution window", "cửa sổ quy gán xác định khoảng thời gian ghi nhận chuyển đổi cho quảng cáo"]
    ],
    m16: [
      ["business portfolio (BM)", "trình quản lý kinh doanh doanh nghiệp: nơi chứa fanpage, tài khoản ads, pixel của khách"],
      ["partner access", "quyền truy cập đối tác: cấp quyền cho agency qua ID Đối tác không cần biết mật khẩu cá nhân"],
      ["two-factor authentication (2FA)", "xác thực hai yếu tố: bắt buộc cài mã xác thực qua app bảo mật cho mọi admin"],
      ["ad account restriction", "tài khoản quảng cáo bị hạn chế do vi phạm chính sách hoặc hoạt động bất thường"],
      ["circumventing systems", "hành vi lách hệ thống kiểm duyệt: tạo nhiều nick ảo, che giấu link — bị khoá vĩnh viễn BM"],
      ["misrepresentation", "hành vi gây hiểu lầm / phóng đại: cam kết chữa khỏi bệnh 100%, dùng ảnh trước/sau phản cảm"],
      ["influencer disclosure", "gắn nhãn nội dung được tài trợ: bắt buộc gắn tag quảng cáo minh bạch theo Luật QC 75/2025"],
      ["scope of practice", "ranh giới phạm vi hành nghề: marketer không làm thay việc tư vấn pháp luật hay quyết toán thuế"],
      ["foreign contractor tax (FCT)", "thuế nhà thầu nước ngoài khi chi trả tiền quảng cáo cho Meta, Google xuyên biên giới"],
      ["trademark infringement", "xâm phạm nhãn hiệu độc quyền: dùng tên thương hiệu đối thủ mà chưa được cho phép bằng văn bản"],
      ["crisis management", "quản trị và xử lý khủng hoảng truyền thông: đính chính trung thực, hỗ trợ hoàn tiền khách hàng"],
      ["asset handover protocol", "biên bản bàn giao và thu hồi tài sản số khi chấm dứt hợp đồng dịch vụ"],
      ["backup admin", "quản trị viên dự phòng: luôn cài đặt ít nhất 2 nick admin sạch có bật 2FA trong Business Manager"],
      ["compliance checklist", "danh mục kiểm tra tuân thủ pháp lý và chính sách trước khi bấm chạy chiến dịch quảng cáo"],
      ["Zero-Password Policy", "chính sách không giữ mật khẩu: khách hàng giữ mật khẩu và tự gắn thẻ thanh toán chính chủ"]
    ]
  };

  // [lesson, câu hỏi, [4 lựa chọn], đáp án đúng (0–3), giải thích]
  var Q = [
    // m01 (9 câu)
    ["m01", "Hành trình mua hàng của khách Việt Nam thường như thế nào?", ["Tuyến tính: thấy quảng cáo → vào web → mua", "Không tuyến tính, nhiều điểm chạm: mạng xã hội, chat Zalo, so giá đa sàn", "Chỉ mua qua website chính thức", "Chỉ mua khi gặp trực tiếp"], 1, "Khách VN hay xem review trên Group, nhắn Zalo hỏi, so giá trên Shopee/TikTok Shop trước khi quyết định."],
    ["m01", "Quảng cáo có rất nhiều click. Điều đó có chắc chắn chiến dịch thành công không?", ["Có, click nhiều là thắng", "Không, khách có thể rớt ở bước tư vấn hoặc chốt đơn sau đó", "Có, nếu CPC thấp", "Không thể đo được"], 1, "Click chỉ là một bước. Phải nhìn đến kết quả cuối (tin nhắn, đơn hàng, doanh thu)."],
    ["m01", "Kênh nào phù hợp nhất để chốt đơn qua chat trực tiếp ở Việt Nam?", ["Display Ads", "YouTube", "Zalo OA / chat Zalo", "Banner báo điện tử"], 2, "Zalo gắn với số điện thoại thật, khách tin tưởng, rất hợp để tư vấn và chốt đơn."],
    ["m01", "Theo Luật sửa đổi, bổ sung một số điều của Luật Quảng cáo số 75/2025/QH15, hành vi nào dưới đây bị nghiêm cấm?", ["Gắn nhãn quảng cáo trên video", "Dàn dựng review giả mạo trải nghiệm người tiêu dùng và quảng cáo không gắn nhãn tài trợ minh bạch", "Cung cấp bảng giá chi tiết", "Gửi tin nhắn tư vấn khi khách yêu cầu"], 1, "Luật 75/2025/QH15 siết chặt trách nhiệm của người chuyển tải quảng cáo (KOL/KOC), nghiêm cấm review trá hình lừa dối người tiêu dùng."],
    ["m01", "Khái niệm \"ZMOT\" (Zero-Moment of Truth) trong hành trình khách hàng 2026 có ý nghĩa gì?", ["Khách hàng mua hàng ngay khi thấy biển quảng cáo", "Khách hàng tự tra cứu Google, xem review TikTok độc lập trước khi liên hệ người bán", "Khách hàng không bao giờ mua hàng online", "Khách hàng chỉ mua khi được gọi điện tiếp thị"], 1, "ZMOT là khoảnh khắc khách hàng chủ động tìm kiếm các đánh giá khách quan độc lập trước khi mở lời hỏi mua."],
    ["m01", "Vì sao mô hình Customer Journey của hàng giá trị cao (> 2 triệu) khác với hàng tiêu dùng nhanh (< 500k)?", ["Hàng giá trị cao khách mua theo cảm xúc tức thì trên livestream", "Hàng giá trị cao khách cân nhắc kỹ, sợ rủi ro và cần điểm chạm tư vấn 1-1 qua Zalo hoặc gặp mặt", "Hàng giá trị cao không cần bằng chứng xã hội", "Hàng giá trị cao chỉ bán qua sàn Shopee"], 1, "Sản phẩm giá trị lớn đòi hỏi xây dựng niềm tin chuyên môn và giải đáp thắc mắc riêng biệt qua chat trực tiếp."],
    ["m01", "Thuật ngữ \"Social Commerce\" tại Việt Nam phản ánh hành vi mua sắm nào?", ["Mua hàng tại siêu thị sau khi đọc báo", "Mua hàng trực tiếp ngay trong trải nghiệm xem video ngắn hoặc livestream (TikTok Shop, Shopee Live)", "Gửi thư tay đặt hàng", "Chỉ thanh toán bằng tiền mặt khi nhận hàng"], 1, "Social Commerce kết hợp nội dung giải trí và tính năng giỏ hàng mua sắm khép kín ngay trong một ứng dụng."],
    ["m01", "Một shop chi 10 triệu tiền ads có 2.000 click nhưng chỉ chốt được 2 đơn do Fanpage trắng và không ai trực chat. Điểm gãy nằm ở đâu?", ["Quảng cáo Meta bị hỏng", "Khâu đón tiếp và tư vấn sau click (nội dung trang, kịch bản chốt đơn) bị bỏ trống", "Khách hàng không có tiền", "Màu sắc logo không hợp phong thuỷ"], 1, "Quảng cáo đã đưa khách đến cửa; việc không có người tiếp đón và nội dung nghèo nàn làm rớt toàn bộ khách."],
    ["m01", "Bốn điểm chạm (Touchpoints) bắt buộc cần chuẩn bị trước khi đổ ngân sách chạy quảng cáo trả phí gồm những gì?", ["Biển hiệu, tờ rơi, áo thun, mũ bảo hiểm", "Điểm chạm kéo khách (Ads), điểm chạm thẩm định (Fanpage/Review), điểm chạm chốt đơn (Zalo chat) và điểm chạm giữ chân (CSKH)", "Chỉ cần 1 bài viết quảng cáo duy nhất", "Chỉ cần đường link website"], 1, "Đủ 4 điểm chạm giúp dòng chảy khách hàng liền mạch từ lúc nhìn thấy đến khi quay lại mua tiếp."],

    // m02 (9 câu)
    ["m02", "Thứ tự đúng của 4 giai đoạn funnel tiếp thị là gì?", ["Conversion → Awareness → Retention → Consideration", "Awareness → Consideration → Conversion → Retention", "Consideration → Awareness → Conversion → Retention", "Awareness → Conversion → Consideration → Retention"], 1, "Hành trình chuẩn: Biết đến (Awareness) → Cân nhắc (Consideration) → Chuyển đổi (Conversion) → Giữ chân (Retention)."],
    ["m02", "Quảng cáo nhiều click nhưng rất ít người nhắn tin hỏi mua. Vấn đề nhiều khả năng nằm ở đâu?", ["Trang đích (landing page) / nội dung sau click", "Thuật toán Facebook", "Tên miền website", "Màu logo"], 0, "Khách đã quan tâm (click) nhưng rớt sau đó, nên xem lại trang đích, giá, thông tin, nút liên hệ."],
    ["m02", "TOFU tương ứng với giai đoạn nào trong phễu?", ["Conversion", "Retention", "Awareness", "Consideration"], 2, "TOFU = Top of Funnel = đầu phễu = nhận biết."],
    ["m02", "Vì sao không nên dùng cùng một kiểu nội dung cho cả 4 giai đoạn của phễu?", ["Vì Facebook cấm", "Vì mỗi giai đoạn khách có câu hỏi khác nhau, cần nội dung và kênh khác nhau", "Vì tốn tiền in ấn", "Không có lý do, dùng chung cũng được"], 1, "Awareness cần gây chú ý; Consideration cần review, so sánh; Conversion cần giá, ưu đãi, CTA rõ."],
    ["m02", "Trong bảng phân tích phễu, chỉ số \"Drop-off Rate\" phản ánh điều gì?", ["Tỷ lệ khách hàng mua lại", "Tỷ lệ phần trăm khách hàng dừng lại và rời bỏ giữa hai bước liên tiếp trong phễu", "Tốc độ tải trang web", "Chi phí cho mỗi lượt click"], 1, "Bước nào có Drop-off Rate cao nhất chính là nút thắt cổ chai (bottleneck) cần tập trung sửa chữa ngay."],
    ["m02", "Vì sao khâu giữ chân sau mua (Retention) lại giúp giảm chi phí CAC trung bình của doanh nghiệp?", ["Vì bán cho khách cũ qua Zalo OA có chi phí quảng cáo gần bằng 0, giúp tăng lợi nhuận ròng mà không cần chi thêm ngân sách kéo khách mới", "Vì khách cũ không cần giao hàng", "Vì khách cũ được miễn toàn bộ thuế GTGT", "Vì Facebook trả lại tiền quảng cáo cho khách cũ"], 0, "Chăm sóc khách cũ mua lại lần 2, lần 3 giúp tăng giá trị vòng đời khách hàng (CLV) mà không tốn chi phí quảng cáo mới."],
    ["m02", "Một chiến dịch có 4.000 click vào web nhưng chỉ có 200 người để lại thông tin (Lead). Tỷ lệ chuyển đổi (CR) là bao nhiêu?", ["0,5%", "5,0%", "10,0%", "50,0%"], 1, "CR = 200 ÷ 4.000 = 5% (cứ 100 người vào web thì có 5 người để lại thông tin)."],
    ["m02", "Khi khách hàng lạ ở tầng TOFU vừa nhìn thấy video của bạn, loại thông điệp nào KHÔNG NÊN sử dụng ngay?", ["Chia sẻ mẹo vặt hữu ích giải quyết vấn đề", "Video hài hước tình huống đời sống", "Ép mua ngay với lời kêu gọi \"Mua ngay kẻo lỡ, giảm giá duy nhất hôm nay\"", "Giới thiệu nguyên nhân gây ra nỗi đau của khách"], 2, "Khách lạ chưa biết bạn là ai và chưa có niềm tin; ép mua ngay ở TOFU sẽ khiến tỷ lệ thoát trang cực cao."],
    ["m02", "Khái niệm \"Funnel Economics\" (Kinh tế học phễu) đòi hỏi marketer phải theo dõi điều gì?", ["Chỉ theo dõi số lượng người xem video", "Theo dõi dòng tiền chi phí đơn vị (CPM, CPC, CPL, CPA) và biên lợi nhuận ròng ở từng tầng phễu", "Chỉ theo dõi số tiền tài khoản ngân hàng của giám đốc", "Đếm số lượt thả tim trên mạng xã hội"], 1, "Kinh tế học phễu gắn kết số lượng người chuyển đổi với chi phí tài chính thực tế trên từng đơn hàng."],

    // m03 (9 câu)
    ["m03", "Vì sao không nên xây persona bằng cách tự đoán mò trong phòng máy lạnh?", ["Vì mất thời gian", "Vì dễ nhắm sai đối tượng và nội dung không chạm đúng nỗi đau thật", "Vì Facebook không cho phép", "Vì persona không quan trọng"], 1, "Persona phải dựa trên dữ liệu thật: khách cũ, bình luận, tin nhắn, Group, khảo sát."],
    ["m03", "Nguồn dữ liệu MIỄN PHÍ nào tốt nhất để người mới xây dựng Buyer Persona?", ["Mua danh sách số điện thoại trên mạng", "Tin nhắn, bình luận và lịch sử đơn hàng của khách cũ (First-party data)", "Đoán theo cảm giác cá nhân", "Copy nguyên văn persona của đối thủ"], 1, "Những thắc mắc và lời khen chê lặp đi lặp lại của khách thật là dữ liệu quý giá nhất."],
    ["m03", "Người mới bắt đầu nên tập trung xây dựng bao nhiêu Persona chính?", ["1 persona chính duy nhất", "5 persona", "10 persona", "Không cần persona"], 0, "Tập trung 1 nhóm khách chính trước cho dễ làm đúng, rồi mới mở rộng."],
    ["m03", "\"Pain point\" trong nghiên cứu chân dung khách hàng là gì?", ["Giá bán của sản phẩm", "Nỗi đau hoặc rào cản khiến khách hàng khó chịu chưa tìm được giải pháp", "Số lượng người theo dõi trang", "Chi phí chạy quảng cáo"], 1, "Ví dụ: sợ mua nhầm đồ nhăn nhúm, sợ bị kích ứng da, sợ giao hàng chậm trễ."],
    ["m03", "Theo Điều 28 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, điều kiện bắt buộc khi thu thập số điện thoại khách hàng để tiếp thị là gì?", ["Phải mua từ các công ty môi giới uy tín", "Phải có sự đồng ý tường minh, tự nguyện (opt-in) của chủ thể dữ liệu và cơ chế từ chối (opt-out) dễ dàng", "Chỉ cần thu thập qua mạng là được toàn quyền dùng", "Tự động tích chọn sẵn ô đồng ý trên form"], 1, "Luật 91/2025/QH15 cấm mua bán dữ liệu và bắt buộc cơ chế opt-in không được tích sẵn."],
    ["m03", "Trong mô hình RFM, nhóm khách hàng có điểm \"Recency cao, Frequency cao, Monetary cao\" đại diện cho nhóm nào?", ["Khách hàng đã bỏ đi lâu ngày", "Khách hàng mua thử 1 lần giá rẻ", "Nhóm khách hàng trung thành VIP (mua gần đây, mua nhiều lần và chi tiêu lớn)", "Khách hàng chỉ vào xem không mua"], 2, "Đây là nhóm khách hàng mang lại tỷ trọng lợi nhuận lớn nhất, hình mẫu lý tưởng để vẽ Persona số 1."],
    ["m03", "Mô hình \"Jobs To Be Done\" (JTBD) nhìn nhận hành vi mua sắm của khách hàng như thế nào?", ["Khách hàng mua sản phẩm vì mê logo đẹp", "Khách hàng \"thuê\" sản phẩm để hoàn thành một nhiệm vụ hoặc thoát khỏi một vấn đề trong cuộc sống", "Khách hàng mua chỉ vì giá rẻ nhất", "Khách hàng mua theo lệnh của người khác"], 1, "Khách hàng không mua chiếc máy khoan 8 ly, họ mua một lỗ khoan 8 ly trên tường."],
    ["m03", "Hành vi nào dưới đây khi thiết kế form thu thập thông tin khách hàng là VI PHẠM Luật Bảo vệ dữ liệu cá nhân?", ["Nêu rõ mục đích gửi tin nhắn tư vấn và ưu đãi", "Cung cấp số hotline để khách huỷ nhận tin", "Để ô tích chọn \"Tôi đồng ý nhận quảng cáo\" được đánh dấu sẵn (Pre-ticked box)", "Bảo mật danh sách khách hàng trên CRM"], 2, "Ô tích chọn sẵn vi phạm nguyên tắc đồng ý tự nguyện; ô này bắt buộc phải để trống để người dùng tự tích."],
    ["m03", "Thuật ngữ \"Buying Objection\" phản ánh điều gì trong tâm lý khách hàng?", ["Lời khen ngợi sau khi nhận hàng", "Những băn khoăn, nghi ngại khiến khách ngập ngừng chưa dám bấm mua (sợ đắt, sợ hàng giả, ngại đổi trả)", "Số tiền khách có trong ví", "Tốc độ mạng internet của khách"], 1, "Nắm rõ các rào cản này giúp người viết nội dung đưa ra các cam kết đập tan sự nghi ngờ."],

    // m04 (9 câu)
    ["m04", "Khách chủ động tìm kiếm thông tin trước khi mua (vd: \"sửa máy lạnh quận 7\"). Kênh nào phù hợp nhất?", ["TikTok In-Feed Ads", "Google Search Ads & Google Business Profile (Maps)", "Display banner", "Facebook Group chung chung"], 1, "Google Search đón đúng lúc khách có nhu cầu rõ ràng và khẩn cấp."],
    ["m04", "Có nên có mặt trên tất cả nền tảng mạng xã hội cùng lúc khi mới khởi nghiệp?", ["Có, càng nhiều càng tốt", "Không, nên chọn 2–3 kênh phối hợp vừa sức nguồn lực", "Chỉ cần 1 kênh duy nhất mãi mãi", "Tuỳ màu logo của shop"], 1, "Dàn trải nguồn lực cho 7–8 kênh khi ít nhân sự là nguyên nhân thất bại phổ biến của SME."],
    ["m04", "Sản phẩm trực quan (thời trang, mỹ phẩm, ăn vặt), tệp khách trẻ. Kênh nào thường hợp nhất?", ["TikTok (video ngắn, livestream, TikTok Shop)", "Google Display banner", "Email B2B", "Báo in giấy"], 0, "TikTok mạnh về video ngắn trực quan, thuật toán ưu tiên nội dung hay và có giỏ hàng mua ngay."],
    ["m04", "Theo Nghị định 117/2025/NĐ-CP (hiệu lực 01/07/2025), sàn TMĐT có thanh toán khấu trừ bao nhiêu % thuế đối với hàng hoá của cá nhân cư trú?", ["0,5% doanh thu", "1,5% doanh thu (1% thuế GTGT + 0,5% thuế TNCN)", "7% doanh thu", "10% doanh thu"], 1, "Khoản 2 Điều 5 Nghị định 117/2025/NĐ-CP quy định sàn khấu trừ nộp thay 1,5% doanh thu bán hàng hoá."],
    ["m04", "Một sản phẩm bán trên sàn giá 400.000đ, giá vốn 40%, tổng phí sàn và hoàn đơn là 18,5%, thuế sàn nộp thay là 1,5%. ROAS hoà vốn là bao nhiêu?", ["1,5 lần", "2,0 lần", "2,5 lần (vì biên lợi nhuận ròng trước ads = 40%; 1 ÷ 0,40 = 2,5)", "4,0 lần"], 2, "Tổng chi phí trước ads = 40% + 18,5% + 1,5% = 60%. Biên lãi ròng = 40%. ROAS hoà vốn = 1 ÷ 0,40 = 2,5."],
    ["m04", "Dịch vụ ZNS (Zalo Notification Service) khác với tin nhắn Zalo thông thường ở điểm nào?", ["ZNS không gửi được hình ảnh", "ZNS gửi qua API theo mẫu template được Zalo duyệt trước, dùng cho thông báo giao dịch/CSKH và nghiêm cấm quảng cáo", "ZNS chỉ gửi được vào ban đêm", "ZNS miễn phí hoàn toàn không giới hạn"], 1, "ZNS gửi tới SĐT không cần follow OA nhưng được kiểm duyệt nội dung mẫu rất nghiêm ngặt."],
    ["m04", "Theo Nghị định 70/2025/NĐ-CP, hộ kinh doanh bán lẻ đạt doanh thu từ bao nhiêu trở lên thì bắt buộc áp dụng hoá đơn điện tử từ máy tính tiền?", ["Từ 50 triệu đồng/năm trở lên", "Từ 200 triệu đồng/năm trở lên", "Từ 01 tỷ đồng/năm trở lên", "Từ 50 tỷ đồng/năm trở lên"], 2, "Khoản 8 Điều 1 Nghị định 70/2025/NĐ-CP quy định ngưỡng bắt buộc từ 01 tỷ đồng/năm trở lên đối với bán lẻ."],
    ["m04", "Kênh nào đóng vai trò thu hút khách hàng tìm kiếm địa phương vãng lai tốt nhất cho quán cà phê hoặc tiệm sửa xe?", ["Quảng cáo LinkedIn", "Hồ sơ doanh nghiệp Google Business Profile (Google Maps) đã chuẩn hoá NAP", "Email marketing", "Gửi tin nhắn SMS hàng loạt"], 1, "Khách hàng tìm kiếm quán ăn/tiệm sửa xe quanh đây ưu tiên xem vị trí và đánh giá trên Google Maps."],
    ["m04", "Vì sao người bán hàng online hay gặp tình trạng \"doanh thu tiền tỷ nhưng tài khoản không thấy tiền lời\" trên sàn TMĐT?", ["Do ngân hàng tính phí chuyển tiền", "Do không tính kỹ các khoản phí cố định, phí thanh toán, voucher xtra, hoàn đơn và thuế khấu trừ tại nguồn", "Do Shopee không trả tiền", "Do tiền bị mất giá ngẫu nhiên"], 1, "Tổng các loại phí sàn và thuế thường chiếm từ 15–20% doanh thu; nếu không tính kỹ sẽ bị lỗ vốn ngầm."],

    // m05 (10 câu)
    ["m05", "Trong Meta Ads, tầng nào là nơi bạn cài đặt đối tượng nhắm chọn, ngân sách ngày, lịch và vị trí hiển thị?", ["Campaign (Chiến dịch)", "Ad Set (Nhóm quảng cáo)", "Ad (Quảng cáo)", "Business Manager"], 1, "Campaign chọn mục tiêu; Ad Set cài đối tượng, ngân sách, lịch, vị trí; Ad chứa hình ảnh/video."],
    ["m05", "Muốn quảng cáo lại cho những người đã từng nhắn tin hoặc xem video trên trang của bạn, bạn sử dụng loại đối tượng nào?", ["Core Audience", "Custom Audience (Đối tượng tuỳ chỉnh)", "Lookalike Audience", "Broad Audience"], 1, "Custom Audience dùng để retargeting người đã từng tương tác với thương hiệu."],
    ["m05", "Trong khung 6 mục tiêu ODAX của Meta, nếu mục tiêu là thu hút khách hàng tiềm năng điền form tư vấn, bạn chọn mục tiêu nào?", ["Awareness", "Traffic", "Leads (Khách hàng tiềm năng)", "App Promotion"], 2, "Mục tiêu Leads tối ưu cho hành vi điền form trực tiếp trên Facebook (Instant Form) hoặc trên trang đích."],
    ["m05", "Một nhóm quảng cáo Meta cần gom tối thiểu bao nhiêu sự kiện chuyển đổi trong vòng 7 ngày để thoát khỏi Learning Phase?", ["Khoảng 10 sự kiện", "Khoảng 50 sự kiện chuyển đổi trong vòng 7 ngày", "Khoảng 200 sự kiện", "Không cần sự kiện nào"], 1, "Ngưỡng 50 kết quả/tuần là lượng dữ liệu tối thiểu thuật toán Meta cần để học tập và phân phối ổn định chi phí."],
    ["m05", "Vì sao năm 2026 các nhà quảng cáo bắt buộc phải cài đặt Meta Conversions API (CAPI) song song với Meta Pixel?", ["Vì Pixel bị cấm hoàn toàn", "Vì CAPI gửi trực tiếp từ máy chủ giúp ghi nhận dữ liệu không phụ thuộc cookie trình duyệt, khử trùng lặp qua event_id và tăng điểm EMQ", "Vì CAPI giúp giảm 90% tiền quảng cáo", "Vì CAPI thay thế người viết bài"], 1, "CAPI bù đắp lượng dữ liệu bị rơi rớt do trình duyệt chặn cookie, cải thiện chất lượng tối ưu của máy học."],
    ["m05", "Khi nhóm quảng cáo bị cảnh báo \"Learning Limited\" do ngân sách quá nhỏ không đủ đạt 50 đơn/tuần, cách xử lý khôn ngoan là gì?", ["Tăng ngân sách gấp 10 lần ngay lập tức", "Chuyển sự kiện tối ưu lên bước nông hơn có nhiều sự kiện hơn (như Xem nội dung, Thêm vào giỏ) hoặc gom các nhóm quảng cáo lại", "Xoá tài khoản quảng cáo tạo tài khoản mới", "Tắt mở quảng cáo liên tục mỗi tiếng"], 1, "Gom nhóm hoặc tối ưu sự kiện nông hơn giúp nhóm quảng cáo gom đủ 50 kết quả để máy học hiệu quả."],
    ["m05", "Thang điểm EMQ (Event Match Quality) trong Trình quản lý sự kiện của Meta đo lường điều gì?", ["Tốc độ mạng của máy tính", "Độ chính xác và đầy đủ của thông tin khách hàng (email, SĐT mã hoá SHA-256) gửi về để khớp tài khoản (thang 0–10)", "Số lượng người bấm like bài viết", "Màu sắc của nút CTA"], 1, "Điểm EMQ càng cao (trên 7,0/10) thì tỷ lệ khớp người dùng càng chính xác, giúp đo lường chuyển đổi chuẩn."],
    ["m05", "Tính năng \"Advantage+ Audience\" của Meta có đặc điểm gì nổi bật?", ["Giới hạn nghiêm ngặt chỉ trong độ tuổi chọn sẵn", "Cho phép AI tự động mở rộng tìm kiếm khách hàng ngoài các tiêu chí sở thích ban đầu", "Không cho phép chọn vị trí địa lý", "Tự động trừ tiền trong ví khách hàng"], 1, "Marketer chỉ đưa ra các gợi ý đối tượng (Audience Suggestions) để thuật toán AI tự tìm kiếm rộng hơn."],
    ["m05", "Công thức nội dung quảng cáo chuyển đổi đơn giản và hiệu quả gồm những phần nào?", ["Hook 3 giây gây chú ý → Lợi ích/Giá trị giải quyết nỗi đau → Bằng chứng xã hội thật → Lời kêu gọi hành động CTA rõ ràng", "Chỉ cần đăng ảnh logo công ty thật to", "Viết bài dài 3.000 từ không có hình", "Đăng video không có âm thanh và không phụ đề"], 0, "Công thức Hook – Value – Proof – CTA dẫn dắt người xem từ chú ý đến hành động cụ thể."],
    ["m05", "Khi nào thì một chiến dịch nên áp dụng Advantage+ Campaign Budget (CBO)?", ["Khi chỉ có 1 nhóm quảng cáo duy nhất", "Khi có từ 2–3 nhóm quảng cáo và muốn thuật toán tự động dồn tiền cho nhóm đang hiệu quả nhất", "Khi không có ngân sách", "Khi chạy bài viết cá nhân"], 1, "CBO giúp tự động tối ưu hoá ngân sách tổng giữa các nhóm quảng cáo khác nhau trong cùng chiến dịch."],

    // m06 (10 câu)
    ["m06", "Cơ chế \"Blended Attribution\" trong chiến dịch TikTok Shop Product GMV Max có đặc điểm gì cần lưu ý?", ["Chỉ tính các đơn hàng thanh toán trước", "Hệ thống tính gộp cả doanh số bán hàng tự nhiên (organic) và affiliate vào tổng GMV chiến dịch, dễ gây ảo tưởng về ROI", "TikTok không tính tiền quảng cáo", "Chỉ áp dụng cho các video dưới 5 giây"], 1, "Cơ chế này gộp toàn bộ đơn hàng của sản phẩm khiến chủ shop tưởng quảng cáo lời to nhưng thực chất đang lỗ ngầm."],
    ["m06", "Tính năng \"Spark Ads\" trên TikTok mang lại lợi ích nổi bật nào?", ["Cho phép chạy quảng cáo trực tiếp trên video tự nhiên của kênh KOC hoặc shop, giữ nguyên tương tác và tính chân thật", "Xoá toàn bộ bình luận của khách", "Tự động đổi giọng nói người đọc", "Chỉ hiện trên máy tính"], 0, "Spark Ads giữ được cảm giác tự nhiên của video review, giúp tăng độ tin cậy và tỷ lệ bấm vào giỏ hàng."],
    ["m06", "Điểm khác biệt cốt lõi giữa Google Search Ads và Facebook/TikTok Ads là gì?", ["Google Search đón đầu nhu cầu khi khách chủ động tìm kiếm; Facebook/TikTok hiển thị ngắt quãng khi khách đang lướt giải trí", "Không có điểm khác biệt nào", "Google Search hoàn toàn miễn phí", "TikTok không bán được hàng"], 0, "Tiếp thị dựa trên ý định chủ động (Intent-based) vs Tiếp thị ngắt quãng (Interruption)."],
    ["m06", "Cú pháp nào dưới đây đại diện cho kiểu từ khoá \"Khớp cụm từ\" trong Google Ads?", ["từ khoá không có dấu", "\"từ khoá trong ngoặc kép\"", "[từ khoá trong ngoặc vuông]", "+từ +khoá"], 1, "Dấu ngoặc kép \"từ khoá\" biểu thị đối sánh cụm từ (Phrase Match) trong Google Ads."],
    ["m06", "Mục đích quan trọng nhất của việc thêm danh sách \"Từ khoá phủ định\" trong Google Search Ads là gì?", ["Để tăng giá thầu từ khoá", "Chặn quảng cáo không hiển thị khi khách gõ các từ không phù hợp (như \"miễn phí\", \"cũ\", \"tuyển dụng\"), tiết kiệm ngân sách", "Để xoá tài khoản quảng cáo", "Để bài viết lên top SEO"], 1, "Từ khoá phủ định loại trừ các click lãng phí từ những người không có ý định mua hàng."],
    ["m06", "Theo Luật sửa đổi, bổ sung một số điều của Luật Quảng cáo số 75/2025/QH15, khi thuê KOL/KOC quay video review sản phẩm, nghĩa vụ nào bắt buộc?", ["KOL không cần biết chất lượng sản phẩm ra sao", "Phải kiểm tra hồ sơ công bố sản phẩm và yêu cầu người chuyển tải quảng cáo thông báo rõ đây là nội dung quảng cáo", "Chỉ cần thanh toán tiền mặt không cần hợp đồng", "Cấm KOL không được nhắc tên nhãn hàng"], 1, "Luật 75/2025/QH15 quy định rõ trách nhiệm của Người chuyển tải quảng cáo về tính trung thực và minh bạch."],
    ["m06", "Chiến dịch Google Performance Max (PMax) hoạt động theo cơ chế nào?", ["Chỉ hiển thị trên kết quả tìm kiếm của Google", "Tự động phân bổ ngân sách hiển thị đa kênh (Search, Maps, YouTube, Gmail, Display) bằng thuật toán máy học", "Chỉ dành cho các doanh nghiệp nước ngoài", "Không cho phép sử dụng hình ảnh"], 1, "PMax tối ưu hoá sự hiện diện trên toàn bộ hệ sinh thái của Google để gom chuyển đổi."],
    ["m06", "Kênh Zalo Ads Lead Form phát huy hiệu quả cao nhất đối với nhóm ngành nào?", ["Bán đồ ăn vặt giá 10.000đ", "Dịch vụ cần tư vấn trực tiếp 1-1 (khoá học, nha khoa, bất động sản, thẩm mỹ viện)", "Bán tài liệu photo", "Ứng dụng tải game miễn phí"], 1, "Form Zalo tự động điền số điện thoại giúp khách hàng đăng ký nhanh và kết nối ngay với tư vấn viên."],
    ["m06", "Chỉ số \"Quality Score\" (Điểm chất lượng) của từ khoá trong Google Search Ads phụ thuộc vào yếu tố nào?", ["Độ dài của tên công ty", "Tỷ lệ nhấp dự kiến (CTR), độ liên quan của quảng cáo và trải nghiệm trang đích của người dùng", "Số tiền nạp vào tài khoản nhiều hay ít", "Thời gian tạo tài khoản"], 1, "Điểm chất lượng cao (8–10/10) giúp giảm chi phí mỗi click (CPC) và được ưu tiên xếp hạng cao hơn."],
    ["m06", "Một shop có doanh thu tự nhiên 20 triệu/tháng. Khi bật TikTok GMV Max tốn 10 triệu ads, tổng GMV báo 35 triệu. Incremental ROAS thực tế là bao nhiêu?", ["3,5 lần", "1,5 lần (vì doanh thu tăng thêm là 15 triệu; 15tr ÷ 10tr = 1,5)", "2,0 lần", "0,5 lần"], 1, "Doanh thu tăng thêm thực sự = 35tr − 20tr = 15 triệu. Incremental ROAS = 15tr ÷ 10tr = 1,5 lần."],

    // m07 (9 câu)
    ["m07", "Vì sao SEO vẫn là kênh đầu tư bền vững lâu dài dù cần nhiều thời gian ban đầu?", ["Vì miễn phí tiền cho mỗi lượt click và một bài viết chất lượng có thể mang lại khách hàng đều đặn suốt nhiều tháng", "Vì website lên top ngay sau 1 giờ", "Vì Google trả tiền thưởng hàng tháng cho admin", "Vì không cần phải viết nội dung"], 0, "SEO xây dựng tài sản số dài hạn, không bị phụ thuộc hoàn toàn vào việc đốt tiền quảng cáo mỗi ngày."],
    ["m07", "Khái niệm \"GEO\" (Generative Engine Optimization) trong kỷ nguyên 2026 có ý nghĩa gì?", ["Tối ưu hoá vị trí địa lý của cửa hàng", "Tối ưu hoá nội dung để các công cụ tìm kiếm trí tuệ nhân tạo (Google AI Overviews, ChatGPT) trích dẫn làm nguồn thông tin", "Dịch bài viết sang tiếng Anh tự động", "Chèn toạ độ GPS vào mã nguồn web"], 1, "GEO giúp bài viết được AI nhận diện là nguồn dữ liệu chuẩn mực và đưa vào phần tóm tắt trả lời."],
    ["m07", "Từ khoá chính của bài viết SEO nên xuất hiện ở vị trí nào đầu tiên để được Google đánh giá cao?", ["Ở phần bình luận cuối trang", "Trong tiêu đề chính H1 và trong 100 từ đầu tiên của bài viết", "Chỉ cần nằm trong tên file ảnh duy nhất", "Không cần xuất hiện trong bài"], 1, "Tiêu đề H1 và đoạn mở đầu giúp bot tìm kiếm và người đọc nắm bắt chủ đề ngay lập tức."],
    ["m07", "Thẻ \"Meta Description\" đóng vai trò gì trên trang kết quả tìm kiếm Google?", ["Tăng tốc độ tải trang web lên gấp đôi", "Đoạn mô tả ngắn dưới tiêu đề kết quả tìm kiếm, viết hấp dẫn để thuyết phục người dùng nhấp vào link", "Lưu trữ mật khẩu quản trị viên", "Chặn các bot tìm kiếm độc hại"], 1, "Meta description ảnh hưởng trực tiếp đến tỷ lệ nhấp chuột tự nhiên (Organic CTR) từ trang kết quả."],
    ["m07", "Chiến lược \"Content Pillar\" (Bài viết trụ cột) được triển khai như thế nào?", ["Đăng ngẫu hứng các bài viết ngắn", "Viết 1 bài chuyên sâu bao quát toàn diện chủ đề lớn, liên kết nội bộ tới các bài vệ tinh chi tiết xung quanh", "Chỉ đăng hình ảnh không cần chữ", "Sao chép nguyên văn từ trang Wikipedia"], 1, "Mô hình cụm chủ đề (Topic Cluster) giúp xây dựng độ phủ chuyên môn vững chắc trong mắt Google."],
    ["m07", "Yếu tố nào trong khung E-E-A-T của Google giúp bài viết vượt trội so với bài viết do AI tự sinh?", ["Chữ E đầu tiên — Trải nghiệm thực tế (Experience): ảnh chụp thật, số liệu trải nghiệm cá nhân và quy trình làm việc thực tiễn", "Số lượng từ khoá lặp lại trong bài", "Màu sắc nổi bật của phông chữ", "Độ dài bài viết trên 10.000 từ"], 0, "Trải nghiệm thực tế của con người là điều máy móc không thể tự trải nghiệm hay bịa đặt được."],
    ["m07", "Nguyên tắc \"NAP Consistency\" trong tối ưu hoá Google Business Profile (Maps) yêu cầu điều gì?", ["Tên, Địa chỉ và Số điện thoại phải hoàn toàn trùng khớp và đồng nhất trên website, Google Maps và các mạng xã hội", "Chỉ cần địa chỉ đúng còn tên có thể đổi tuỳ ý", "Số điện thoại mỗi nơi để một số khác nhau", "Không cần ghi địa chỉ cụ thể"], 0, "Sự nhất quán thông tin NAP giúp Google xác thực tính hiện hữu của doanh nghiệp và ưu tiên xếp hạng."],
    ["m07", "Hiện tượng \"Zero-click Search\" xảy ra khi nào trên Google?", ["Khi người dùng bị mất kết nối internet", "Khi câu trả lời của AI Overviews đã giải đáp trọn vẹn thắc mắc ngay trên trang kết quả, người dùng không cần bấm vào xem web", "Khi trang web bị sập máy chủ", "Khi người dùng tìm kiếm bằng giọng nói"], 1, "Bài viết định nghĩa chung chung dễ bị rơi vào zero-click search; cần cung cấp dữ liệu độc quyền để kéo click."],
    ["m07", "Vì sao người mới làm SEO nên tập trung vào \"Từ khoá đuôi dài\" (Long-tail Keywords)?", ["Vì từ khoá dài có độ cạnh tranh thấp hơn, dễ lên top nhanh và người tìm kiếm đã có ý định mua hàng rất cụ thể", "Vì từ khoá dài không tốn dung lượng máy chủ", "Vì Google chỉ cho phép tìm từ khoá dài", "Vì từ khoá dài luôn có hàng triệu lượt tìm mỗi ngày"], 0, "Từ khoá chi tiết phản ánh người dùng đang ở giai đoạn cuối phễu và sẵn sàng chi trả."],

    // m08 (9 câu)
    ["m08", "Vì sao doanh nghiệp vẫn cần chăm sóc kênh Organic dù đang chi nhiều tiền chạy quảng cáo trả phí?", ["Vì khách hàng sẽ vào Fanpage, Group xem bài viết cũ và feedback thực tế để kiểm tra độ tin cậy trước khi quyết định mua", "Vì kênh Organic giúp trốn toàn bộ các loại thuế", "Vì quảng cáo luôn luôn thất bại", "Vì Organic hoàn toàn không tốn công sức"], 0, "Kênh Organic là nơi chứa đựng bằng chứng xã hội; một trang trống trơn sẽ làm quảng cáo kém hiệu quả."],
    ["m08", "Điểm khác biệt lớn nhất giữa Facebook Group và Facebook Page là gì?", ["Page chỉ dành cho máy tính, Group chỉ dành cho điện thoại", "Group tạo ra môi trường thảo luận tương tác 2 chiều mạnh mẽ, rất phù hợp để xây dựng cộng đồng khách hàng", "Group không cho phép thành viên đăng bài", "Page không cần quản trị viên"], 1, "Page là tiếng nói chính thức của nhãn hàng; Group là không gian để khách hàng giao lưu và review lẫn nhau."],
    ["m08", "Theo Luật sửa đổi, bổ sung một số điều của Luật Quảng cáo số 75/2025/QH15, hành vi dàn dựng nick ảo đi bình luận khen sản phẩm trong các hội nhóm bị coi là gì?", ["Chiến thuật tiếp thị thông minh cần khuyến khích", "Hành vi quảng cáo gian dối, cung cấp thông tin sai lệch về sản phẩm và lừa dối người tiêu dùng", "Hoạt động giao lưu cộng đồng bình thường", "Không chịu sự điều chỉnh của pháp luật"], 1, "Luật 75/2025/QH15 nghiêm cấm các hành vi dàn dựng đánh giá giả mạo nhằm bảo vệ người tiêu dùng."],
    ["m08", "Dịch vụ ZNS (Zalo Notification Service) bị nghiêm cấm gửi loại nội dung nào dưới đây?", ["Thông báo đơn hàng đã đóng gói thành công", "Mã xác thực OTP đăng nhập tài khoản", "Nội dung quảng cáo, chương trình khuyến mãi giảm giá hoặc chèn link lạ ra ngoài", "Thông báo lịch hẹn dịch vụ của khách"], 2, "ZNS được thiết kế độc quyền cho thông báo giao dịch và CSKH; vi phạm gửi quảng cáo sẽ bị khoá mẫu tin."],
    ["m08", "Khi khách hàng nhận được tin nhắn tiếp thị và phản hồi từ chối nhận tin, doanh nghiệp phải làm gì theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15?", ["Tiếp tục gửi tin nhắn vào ngày hôm sau", "Lập tức dừng gửi tin nhắn tiếp thị và cập nhật trạng thái từ chối (opt-out) của khách hàng trên hệ thống", "Khoá số điện thoại của khách hàng", "Chuyển số điện thoại đó cho công ty khác"], 1, "Điều 28 Luật 91/2025/QH15 bắt buộc tôn trọng quyền từ chối tiếp thị của chủ thể dữ liệu."],
    ["m08", "Thuật ngữ \"UGC\" (User-Generated Content) mang lại lợi ích nổi bật nào trong tiếp thị số?", ["Nội dung do chính người dùng tự tạo mang tính khách quan và bằng chứng xã hội chân thực giúp tăng tỷ lệ chuyển đổi", "Giúp doanh nghiệp không cần sản xuất sản phẩm", "Tự động đăng bài lên mạng xã hội không cần người duyệt", "Giúp tăng gấp đôi giá bán sản phẩm"], 0, "Người tiêu dùng tin vào hình ảnh và cảm nhận thật của người mua trước hơn bài tự quảng cáo."],
    ["m08", "Trong một Lịch nội dung (Content Calendar) cân bằng, tỷ lệ bài viết nên phân bổ như thế nào?", ["100% bài bán hàng dồn dập", "Khoảng 40% kiến thức chuyên môn hữu ích, 30% bằng chứng xã hội/UGC, và 30% bài chuyển đổi bán hàng", "Chỉ đăng ảnh vui nhộn không liên quan sản phẩm", "Mỗi tháng chỉ cần đăng đúng 1 bài"], 1, "Tỷ lệ cân bằng giúp giữ chân người theo dõi, tăng tương tác tự nhiên và nuôi dưỡng lòng tin trước khi bán hàng."],
    ["m08", "Kênh Zalo Mini App mang lại ưu thế vượt trội nào cho doanh nghiệp khi chăm sóc khách hàng thân thiết?", ["Chạy trực tiếp trong app Zalo mượt mà, khách không cần tải app ngoài, tích hợp đặt lịch và tích điểm thành viên tiện lợi", "Tự động gửi tiền vào tài khoản ngân hàng của khách", "Thay thế hoàn toàn người bán hàng", "Chỉ hoạt động được khi có wifi"], 0, "Zalo Mini App xoá bỏ rào cản phải tải app nặng máy, giúp khách hàng tương tác thường xuyên hơn."],
    ["m08", "Cách làm \"Seeding minh bạch đúng luật\" được thực hiện như thế nào trong các cộng đồng mạng xã hội?", ["Dùng nick ảo giả làm người bệnh khen thuốc khỏi dứt điểm", "Dùng tài khoản chuyên môn chính thức vào chia sẻ giải pháp hữu ích, giải đáp thắc mắc của thành viên một cách khách quan", "Spam đường link bán hàng vào tất cả các bài viết", "Thuê người chê bai sản phẩm của đối thủ cạnh tranh"], 1, "Chia sẻ giá trị chuyên môn thật giúp xây dựng uy tín thương hiệu vững chắc mà không vi phạm pháp luật."],

    // m09 (10 câu)
    ["m09", "Chỉ số CTR (Click-Through Rate) được tính toán theo công thức nào?", ["Tổng doanh thu ÷ Tổng chi phí", "Số lượt click ÷ Số lượt hiển thị (%)", "Tổng chi phí ÷ Số lượt click", "Số đơn hàng ÷ Số lượt click"], 1, "CTR đo lường tỷ lệ phần trăm số người nhìn thấy quảng cáo đã bấm vào xem."],
    ["m09", "Chi 3.000.000đ tiền quảng cáo, thu về 12.000.000đ doanh thu. Chỉ số ROAS là bao nhiêu?", ["0,25 lần", "4,0 lần", "6,0 lần", "9,0 lần"], 1, "ROAS = Doanh thu ÷ Chi phí = 12.000.000 ÷ 3.000.000 = 4,0 (mỗi 1 đồng quảng cáo thu về 4 đồng doanh thu)."],
    ["m09", "Chi 2.000.000đ quảng cáo thu được 40 tin nhắn hỏi mua hàng. Chi phí cho mỗi tin nhắn (CPA) là bao nhiêu?", ["30.000đ", "50.000đ", "80.000đ", "100.000đ"], 1, "CPA = 2.000.000 ÷ 40 = 50.000đ trên mỗi tin nhắn thu được."],
    ["m09", "Các tham số UTM gắn vào đuôi đường link chiến dịch được dùng để làm gì?", ["Tăng tốc độ tải trang web", "Giúp hệ thống Google Analytics (GA4) phân loại chuẩn xác nguồn kênh, hình thức và chiến dịch kéo khách", "Chặn virus cho máy tính", "Tự động giảm giá đơn hàng"], 1, "UTM giúp bạn biết chính xác đơn hàng đến từ bài quảng cáo nào trên Facebook, TikTok hay Zalo."],
    ["m09", "Trong Google Analytics 4 (GA4), thuật ngữ nào đã chính thức thay thế cho khái niệm \"Conversions\" truyền thống?", ["Goals", "Key events (Sự kiện chính)", "Transactions", "Pageviews"], 1, "Google đổi tên thành Key events để phân biệt với chuyển đổi đấu thầu tính tiền trong Google Ads."],
    ["m09", "Một phiên truy cập được tính là \"Phiên tương tác (Engaged Session)\" trong GA4 khi thoả mãn điều kiện nào?", ["Kéo dài trên 10 giây, HOẶC xem từ 2 trang trở lên, HOẶC phát sinh ít nhất 1 Key event", "Chỉ cần người dùng mở trang rồi tắt ngay trong 1 giây", "Người dùng phải mua hàng trên 1 triệu đồng", "Người dùng phải đăng nhập tài khoản Google"], 0, "Định nghĩa này phản ánh chính xác mức độ quan tâm thật sự của người truy cập."],
    ["m09", "Bốn tham số tín hiệu bắt buộc phải có trong Google Consent Mode v2 là gì?", ["ad_storage, analytics_storage, ad_user_data, và ad_personalization", "email, phone, name, address", "cookie, session, ip, device", "click, impression, reach, cost"], 0, "Đây là 4 cờ tín hiệu quyền riêng tư bắt buộc theo chuẩn kỹ thuật của Google."],
    ["m09", "Vì sao không nên đánh giá hiệu quả của một chiến dịch quảng cáo chỉ dựa trên số liệu của 1 ngày duy nhất?", ["Vì Facebook cấm xem số liệu 1 ngày", "Vì số liệu 1 ngày dao động ngẫu nhiên rất lớn; cần theo dõi xu hướng tối thiểu 7 ngày để ra quyết định chính xác", "Vì GA4 không lưu dữ liệu theo ngày", "Vì tiền quảng cáo chỉ trừ vào cuối tháng"], 1, "Theo dõi xu hướng chu kỳ tuần giúp loại trừ các biến động ngẫu nhiên của thuật toán."],
    ["m09", "Một sản phẩm có biên lợi nhuận ròng trước quảng cáo là 25%. ROAS hoà vốn của sản phẩm này là bao nhiêu?", ["2,0 lần", "3,0 lần", "4,0 lần (vì 1 ÷ 0,25 = 4,0)", "5,0 lần"], 2, "Break-even ROAS = 1 ÷ 0,25 = 4,0. Nghĩa là ROAS phải lớn hơn 4,0 thì chiến dịch mới bắt đầu có lãi ròng."],
    ["m09", "Chỉ số \"Frequency\" (Tần suất) trong báo cáo quảng cáo Facebook đo lường điều gì?", ["Tốc độ mạng internet", "Số lần hiển thị trung bình mà một người dùng nhìn thấy quảng cáo (Impressions ÷ Reach)", "Số lần khách bấm mua hàng", "Số lượng nhân viên quản lý trang"], 1, "Frequency vượt quá 4–5 cảnh báo tệp khách hàng đang bị ngán quảng cáo (Ad Fatigue)."],

    // m10 (9 câu)
    ["m10", "Nguyên tắc quan trọng nhất khi tiến hành thử nghiệm A/B Testing là gì?", ["Thay đổi tất cả mọi thứ cùng lúc", "Chỉ thay đổi duy nhất một biến số (hình ảnh HOẶC tiêu đề) giữa hai phiên bản trong cùng điều kiện thử nghiệm", "Không thay đổi gì cả", "Chạy trên 2 website hoàn toàn khác nhau"], 1, "Đổi 1 yếu tố duy nhất mới biết chắc chắn điều gì tạo ra sự chênh lệch hiệu quả."],
    ["m10", "Thứ tự đúng của chu trình tối ưu hoá tiếp thị liên tục là gì?", ["Thử nghiệm (Test) → Đo lường (Measure) → Rút bài học (Learn) → Lặp lại & Nhân rộng (Iterate & Scale)", "Lặp lại → Thử nghiệm → Rút bài học → Đo lường", "Đo lường → Nhân rộng → Thử nghiệm → Bỏ cuộc", "Chỉ chạy 1 lần duy nhất"], 0, "Tối ưu hoá là một vòng lặp khoa học dựa trên số liệu đo lường thực tế."],
    ["m10", "Khi một nhóm quảng cáo đang hoạt động hiệu quả, mức tăng ngân sách an toàn nhất cho mỗi lần điều chỉnh là bao nhiêu?", ["Tăng gấp 5 lần ngay lập tức", "Tăng từ 15% đến 20% mỗi lần, cách nhau khoảng 48–72 giờ", "Tăng 100% mỗi tiếng", "Không bao giờ được tăng ngân sách"], 1, "Tăng từ từ 15–20% giúp thuật toán máy học thích nghi mà không bị phá vỡ giai đoạn ổn định."],
    ["m10", "Theo quy tắc cắt lỗ (Kill Rule), khi nào bạn nên kiên quyết tắt một nhóm quảng cáo?", ["Khi vừa chạy được 10 phút chưa ra đơn", "Khi số tiền chi tiêu đã vượt quá 1,5 đến 2 lần mức CPA mục tiêu mà vẫn không mang lại bất kỳ chuyển đổi nào", "Khi thấy đối thủ đổi ảnh đại diện", "Khi khách hàng khen bài viết hay"], 1, "Cắt lỗ kỷ luật giúp bảo vệ ngân sách để dồn tiền sang các thử nghiệm tiềm năng khác."],
    ["m10", "Dấu hiệu rõ ràng nhất cho thấy mẫu quảng cáo đang bị hiện tượng \"Ad Fatigue\" là gì?", ["Frequency tăng cao trên 4–5 lần, trong khi CTR giảm mạnh và CPA tăng cao", "Số lượng người like trang tăng vọt", "Trang web tải nhanh hơn", "Khách hàng nhắn tin hỏi mua liên tục"], 0, "Khách hàng đã nhìn thấy cùng một mẫu quảng cáo quá nhiều lần; lúc này cần làm mới nội dung sáng tạo."],
    ["m10", "Thuật ngữ \"Statistical Significance\" (Ý nghĩa thống kê) trong A/B Testing đảm bảo điều gì?", ["Đảm bảo không tốn tiền ngân sách", "Đảm bảo kết quả thử nghiệm đạt độ tin cậy khoa học (>95%), không phải do yếu tố may rủi ngẫu nhiên", "Đảm bảo bài viết được lên báo", "Đảm bảo khách hàng luôn hài lòng 100%"], 1, "Đủ số lượng mẫu thử nghiệm giúp kết luận đưa ra có cơ sở vững chắc."],
    ["m10", "Đồ án \"Capstone Mini-Funnel\" tổng kết khoá học yêu cầu học viên phải hoàn thành những gì?", ["Viết một bài luận lý thuyết 50 trang", "Xây dựng 1 bộ hồ sơ phễu thu nhỏ hoàn chỉnh từ Persona, Kênh, Kịch bản sáng tạo đến Bảng tính ROAS hoà vốn và cam kết pháp lý", "Tự bỏ 100 triệu tiền túi ra chạy quảng cáo", "Lập một công ty cổ phần"], 1, "Capstone chứng minh khả năng vận dụng toàn diện kiến thức vào bài toán kinh doanh thật."],
    ["m10", "Khái niệm \"Unit Economics\" (Kinh tế học đơn vị) tính toán chỉ số nào trên mỗi sản phẩm?", ["Tính toán giá bán, giá vốn hàng bán, chi phí đóng gói, phí sàn, thuế và biên lợi nhuận ròng trên 1 đơn hàng", "Đếm số lượng nhân viên trong công ty", "Đo diện tích kho hàng", "Tính tiền điện hàng tháng"], 0, "Unit Economics giúp bạn biết mỗi sản phẩm bán ra thực chất mang lại bao nhiêu tiền lãi."],
    ["m10", "Hành động nào dưới đây sẽ khiến nhóm quảng cáo Meta bị \"Reset Learning Phase\" (máy học lại từ đầu)?", ["Xem báo cáo trong Ads Manager", "Tăng đột ngột ngân sách lên hơn 50% hoặc thay đổi hoàn toàn tệp đối tượng nhắm chọn", "Đổi tên chiến dịch", "Tắt thông báo trên điện thoại"], 1, "Thay đổi lớn về ngân sách hoặc đối tượng buộc thuật toán phân phối phải học lại từ đầu."],

    // m11 (9 câu)
    ["m11", "Theo Luật Thuế giá trị gia tăng số 48/2024/QH15 (Khoản 25 Điều 5), từ ngày 01/01/2026, ngưỡng doanh thu hằng năm không chịu thuế GTGT đối với hộ, cá nhân kinh doanh là bao nhiêu?", ["Từ 100 triệu đồng/năm trở xuống", "Từ 200 triệu đồng/năm trở xuống", "Từ 500 triệu đồng/năm trở xuống", "Từ 1 tỷ đồng/năm trở xuống"], 1, "Luật 48/2024/QH15 chính thức nâng mức doanh thu không chịu thuế của hộ kinh doanh từ 100 triệu lên 200 triệu đồng/năm kể từ 01/01/2026."],
    ["m11", "Theo Khoản 2 Điều 5 Nghị định 117/2025/NĐ-CP (hiệu lực 01/07/2025), khi cá nhân cư trú bán hàng hoá trên sàn TMĐT có thanh toán, sàn sẽ khấu trừ bao nhiêu % thuế trên doanh thu?", ["0,5% doanh thu", "1,5% doanh thu (gồm 1% thuế GTGT và 0,5% thuế TNCN)", "7% doanh thu", "10% doanh thu"], 1, "Mức khấu trừ là 1,5% đối với hàng hoá (nếu là cung cấp dịch vụ trên sàn thì mức khấu trừ là 7%)."],
    ["m11", "Vì sao Freelancer chạy ads KHÔNG NÊN nhận gộp cả tiền ngân sách quảng cáo lẫn phí dịch vụ vào tài khoản cá nhân của mình khi ký hợp đồng dịch vụ?", ["Vì Facebook cấm nạp tiền bằng thẻ Việt Nam", "Vì toàn bộ số tiền chuyển vào theo hợp đồng dịch vụ sẽ bị tính là thu nhập chịu thuế của Freelancer (bị khấu trừ thuế trên cả tiền trả hộ)", "Vì làm giảm điểm chất lượng quảng cáo", "Vì GA4 không đo được nguồn traffic"], 1, "Khách hàng phải tự gắn thẻ thanh toán tiền ads; Freelancer chỉ nhận thù lao và chịu thuế trên đúng phần phí dịch vụ quản trị."],
    ["m11", "Một KOC nhận thù lao quay video review sản phẩm trên TikTok. Theo Luật Quảng cáo số 75/2025/QH15, KOC thuộc nhóm chủ thể pháp lý nào?", ["Cơ quan quản lý báo chí", "Người chuyển tải sản phẩm quảng cáo (có nghĩa vụ xác minh tài liệu sản phẩm, thông báo rõ việc quảng cáo và nộp thuế theo quy định)", "Bên kiểm soát dữ liệu ngân hàng", "Không chịu bất kỳ trách nhiệm pháp lý nào"], 1, "Khoản 8 Điều 2 và Điều 15a Luật 75/2025/QH15 quy định cụ thể quyền và nghĩa vụ pháp lý của Người chuyển tải sản phẩm quảng cáo."],
    ["m11", "Con đường nào phù hợp nhất cho người mới bắt đầu từ số 0, chưa có vốn nhập hàng và muốn thực hành ngân sách thật với rủi ro thấp nhất?", ["Mở ngay Agency lớn thuê văn phòng", "Vay tiền nhập 500 triệu tiền hàng mở shop ngay ngày đầu", "Làm Thực tập sinh / Junior In-house Marketer hoặc trợ lý dự án để tích luỹ kỹ năng và học quy trình đọc số thật trước khi tự nhận việc", "Mua danh sách số điện thoại về gửi tin nhắn rác"], 2, "Vị trí In-house giúp bạn làm việc với ngân sách của doanh nghiệp, có người hướng dẫn mà không phải tự gánh rủi ro vốn hàng tồn kho."],
    ["m11", "Theo Thông tư số 40/2021/TT-BTC, tỷ lệ thuế áp dụng trên doanh thu đối với hộ kinh doanh cung cấp dịch vụ marketing, quảng cáo là bao nhiêu?", ["1,5% (1% GTGT + 0,5% TNCN)", "4,5% (3% GTGT + 1,5% TNCN)", "7% (5% GTGT + 2% TNCN)", "10% thuế TNCN"], 2, "Dịch vụ tiếp thị số thuộc nhóm ngành dịch vụ chịu thuế suất 5% GTGT và 2% TNCN theo Phụ lục I Thông tư 40/2021/TT-BTC."],
    ["m11", "Theo Thông tư 111/2013/TT-BTC, khi một công ty chi trả tiền thù lao dịch vụ cho cá nhân vãng lai từ bao nhiêu tiền một lần trở lên thì phải khấu trừ 10% thuế TNCN tại nguồn?", ["Từ 500.000đ/lần trở lên", "Từ 1.000.000đ/lần trở lên", "Từ 2.000.000đ/lần trở lên", "Từ 10.000.000đ/lần trở lên"], 2, "Điểm i Khoản 1 Điều 25 Thông tư 111/2013/TT-BTC quy định mức chi trả từ 2.000.000đ/lần trở lên phải khấu trừ 10% thuế TNCN."],
    ["m11", "Mô hình \"Boutique Agency\" trong tiếp thị số có đặc điểm gì nổi bật?", ["Công ty có hàng nghìn nhân viên đa quốc gia", "Nhóm tinh gọn từ 2–5 người tập trung phục vụ giải pháp phễu trọn gói cho một ngách thị trường chuyên biệt", "Mô hình chỉ bán hàng qua livestream", "Công ty sản xuất phần cứng máy tính"], 1, "Boutique Agency có bộ máy tinh gọn, chi phí vận hành thấp và chuyên môn hoá sâu sắc trong một ngách."],
    ["m11", "Khái niệm \"Niche Market\" (Thị trường ngách) giúp người làm Freelance tiếp thị giải quyết bài toán gì?", ["Tránh đối đầu trực diện với các agency khổng lồ và tập trung trở thành chuyên gia số 1 trong một lĩnh vực cụ thể", "Giúp tăng gấp 10 lần ngân sách quảng cáo", "Miễn toàn bộ nghĩa vụ thuế doanh nghiệp", "Giúp không cần học kỹ thuật chạy ads"], 0, "Tập trung vào một ngách (như nha khoa, F&B địa phương) giúp tích luỹ tệp khách hàng và quy trình giải quyết vấn đề nhanh chóng."],

    // m12 (9 câu)
    ["m12", "Khi chưa có khách hàng thực tế, cách xây dựng Portfolio nào vừa thuyết phục vừa tuân thủ đạo đức nghề nghiệp và Luật Quảng cáo số 75/2025/QH15?", ["Lấy ảnh chụp doanh thu trên mạng rồi xoá tên nhận là mình chạy", "Thực hiện các Dự án Giả lập phân tích phễu chuyên sâu cho thương hiệu cụ thể và gắn nhãn minh bạch [Dự án Giả lập / Mock Audit] kết hợp dự án thật ngân sách nhỏ", "Tự bịa ra 10 thương hiệu lớn nhận là khách của mình", "Không chuẩn bị gì cả"], 1, "Chủ shop cần thấy tư duy bắt bệnh phễu và cách tính số của bạn; việc gắn nhãn minh bạch thể hiện sự trung thực và tính chuyên nghiệp."],
    ["m12", "Dấu hiệu nào cho thấy khách hàng đang gài bẫy \"làm test miễn phí\" cần kiên quyết từ chối hoặc chuyển sang đàm phán Gói Chạy Thử Có Phí (Paid Pilot)?", ["Khách hỏi xem 2–3 mẫu bài viết bạn từng làm", "Khách hẹn trao đổi 20 phút qua Google Meet", "Khách yêu cầu bàn giao trọn bộ từ khoá, viết 15 bài đăng, dựng 5 video và cài đặt chiến dịch hoàn chỉnh miễn phí 100% trước khi quyết định", "Khách đề nghị ký hợp đồng thử việc có thù lao"], 2, "Bài test chuyên môn chỉ kiểm tra năng lực qua một mẫu nhỏ hoặc buổi chẩn đoán ngắn; đòi hỏi khối lượng bàn giao lớn miễn phí là bóc lột sức lao động."],
    ["m12", "Thuật ngữ \"Paid Pilot\" trong làm việc Freelance/Agency có nghĩa là gì?", ["Chạy quảng cáo cho các hãng hàng không", "Gói hợp tác thử nghiệm ngắn hạn (7–14 ngày) có thu phí dịch vụ và giới hạn phạm vi công việc rõ ràng để hai bên kiểm chứng mức độ phù hợp", "Làm không công suốt 3 tháng đầu", "Cam kết hoàn tiền 200% nếu khách không thích"], 1, "Paid Pilot bảo vệ thời gian của marketer đồng thời giảm rủi ro cam kết dài hạn cho chủ shop mới hợp tác lần đầu."],
    ["m12", "Cách tiếp cận (Cold Outreach) nào có tỷ lệ phản hồi cao nhất khi tìm khách hàng SME đầu tiên tại Việt Nam?", ["Gửi cùng 1 tin nhắn copy-paste vào 500 Fanpage mỗi ngày", "Gửi một bản nhận xét ngắn (3 điểm cải thiện kèm ảnh chụp màn hình) chỉ ra lỗi cụ thể trên Google Maps / Trang đích của shop và gợi ý cách sửa", "Spam số điện thoại dưới tất cả bài đăng của khách", "Mua danh sách email lạ về gửi thư rác hàng loạt"], 1, "Đưa ra giá trị phân tích hữu ích cụ thể ngay từ đầu giúp chủ shop thấy ngay năng lực thực tế của bạn."],
    ["m12", "Trong cấu trúc một Case Study chuẩn trong Portfolio, phần nào giúp chủ doanh nghiệp thấy bạn hiểu bài toán kinh doanh?", ["Trang trí thật nhiều màu sắc sặc sỡ", "Chỉ rõ nút thắt trong phễu (Bottleneck) gắn với các chỉ số kinh doanh (CTR, CPA, ROAS hoà vốn) và lý do lựa chọn giải pháp", "Liệt kê tất cả các phím tắt máy tính", "Chụp ảnh selfie tại quán cà phê"], 1, "Khả năng chẩn đoán đúng điểm nghẽn doanh thu là tiêu chí hàng đầu để chủ shop đưa ra quyết định thuê dịch vụ."],
    ["m12", "Một bộ Portfolio 3 mảnh ghép hoàn chỉnh cho người mới bắt đầu từ số 0 gồm những gì?", ["3 tấm ảnh chụp bằng khen lý thuyết", "Bản phân tích giả lập (Mock Audit), Dự án cá nhân ngân sách nhỏ thật, và Bộ mẫu tài nguyên sẵn sàng bàn giao (kịch bản, calendar, dashboard)", "3 bài thơ về nghề marketing", "3 đường link video nhảy trên TikTok"], 1, "3 mảnh ghép này chứng minh toàn diện tư duy chiến lược, kỹ năng kỹ thuật thực tế và quy trình bàn giao chuyên nghiệp."],
    ["m12", "Hiện tượng \"Scope Creep\" trong làm việc với khách hàng phản ánh rủi ro nào?", ["Khách hàng trả tiền trước thời hạn", "Phạm vi công việc bị phình to liên tục do khách yêu cầu làm thêm việc ngoài thoả thuận ban đầu mà không trả thêm chi phí", "Tài khoản quảng cáo được duyệt nhanh", "Trang web tải nhanh hơn"], 1, "Không khoá rõ phạm vi công việc (SOW) và giới hạn số lần sửa sẽ khiến freelancer kiệt sức vì làm thêm việc không công."],
    ["m12", "Trong tình huống bạn Lan đàm phán với Bác sĩ Hùng (Nha khoa Nụ Cười Xinh), giải pháp khôn ngoan của Lan là gì?", ["Đồng ý làm miễn phí 20 bài viết và 10 video", "Từ chối làm miễn phí trọn gói, gửi bản Audit 1 trang chỉ ra lỗi trên Google Maps, tặng 1 mẫu kịch bản và chốt Gói Chạy Thử 14 ngày có phí 2,5 triệu", "Bỏ nghề marketing đi làm việc khác", "Đăng bài bóc phốt bác sĩ lên mạng"], 1, "Lan chứng minh năng lực bằng giá trị chẩn đoán cụ thể và bảo vệ quyền lợi bằng gói Paid Pilot có thu phí tạm ứng."],
    ["m12", "Vì sao việc thanh toán tạm ứng (Milestone Payment: 30–50%) là bắt buộc trước khi bắt tay vào triển khai dự án?", ["Để chứng minh sự nghiêm túc và cam kết tài chính của khách hàng, tránh rủi ro quỵt tiền sau khi bàn giao", "Để đi du lịch trước khi làm việc", "Vì pháp luật bắt buộc mọi hợp đồng phải trả 100%", "Để trả tiền phạt cho Facebook"], 0, "Tạm ứng giúp ràng buộc trách nhiệm của hai bên và trang trải chi phí vận hành ban đầu."],

    // m13 (9 câu)
    ["m13", "Trong buổi nhận Brief, chủ shop đưa cho bạn danh sách 30.000 số điện thoại mua trôi nổi và yêu cầu nạp vào chạy ads và gửi tin nhắn tiếp thị. Bạn phải xử lý thế nào theo Điều 28 Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15?", ["Nhận ngay và nạp vào tài khoản quảng cáo", "Từ chối sử dụng tệp dữ liệu mua bán trái phép; giải thích rõ Luật 91/2025/QH15 chỉ cho phép dùng dữ liệu thu thập hợp pháp có sự đồng ý tường minh (opt-in)", "Chia nhỏ tệp ra gửi vào ban đêm để không bị phát hiện", "Đổi tên cột trong file Excel rồi tải lên"], 1, "Mua bán và sử dụng dữ liệu cá nhân trái phép để tiếp thị là hành vi vi phạm pháp luật bị nghiêm cấm."],
    ["m13", "Một sản phẩm bán giá 500.000đ, giá vốn 250.000đ (50%), phí sàn 13,5%, thuế sàn nộp thay là 1,5%. Biên lợi nhuận ròng trước ads là bao nhiêu và CPA tối đa để không lỗ là bao nhiêu?", ["Biên lợi nhuận 50% — CPA tối đa 250.000đ", "Biên lợi nhuận 35% — CPA tối đa 175.000đ (tương ứng ROAS hoà vốn ≈ 2,86)", "Biên lợi nhuận 20% — CPA tối đa 100.000đ", "Biên lợi nhuận 85% — CPA tối đa 425.000đ"], 1, "Tổng chi phí trước ads = 50% + 13,5% + 1,5% = 65%. Biên lãi ròng = 35% (175.000đ). Nếu CPA vượt 175.000đ thì shop bị lỗ."],
    ["m13", "Khi khám bệnh phễu cho một trung tâm tư vấn du học, quảng cáo thu hút rất nhiều tin nhắn lúc 20h–22h nhưng nhân viên tư vấn chỉ làm giờ hành chính, sáng hôm sau mới trả lời. Bạn nên tư vấn gì?", ["Tăng gấp đôi ngân sách quảng cáo khung giờ 20h–22h", "Bố trí người trực chat tối hoặc kịch bản Zalo OA/Chatbot thu thập nhu cầu và hẹn lịch gọi lại ngay, vì để khách chờ qua đêm làm rớt đơn nghiêm trọng", "Xoá hết bài đăng trên Fanpage", "Đổi màu ảnh đại diện"], 1, "Nút thắt nằm ở khâu chốt sale sau click (BOFU); rót thêm tiền khi không có người trực chat chỉ làm đốt tiền vô ích."],
    ["m13", "Đối với các ngành hàng có điều kiện như Thực phẩm chức năng, Mỹ phẩm, Dịch vụ y tế, tài liệu nào bắt buộc phải yêu cầu khách cung cấp theo Luật Quảng cáo số 75/2025/QH15?", ["Hợp đồng thuê mặt bằng", "Giấy xác nhận nội dung quảng cáo và Phiếu công bố sản phẩm hợp lệ do cơ quan nhà nước có thẩm quyền cấp", "Sao kê lương nhân viên bảo vệ", "Mật khẩu email cá nhân của giám đốc"], 1, "Quảng cáo sản phẩm đặc thù bắt buộc phải có đầy đủ giấy phép công bố hợp lệ trước khi thực hiện truyền thông."],
    ["m13", "Mục đích quan trọng nhất của việc đo lường \"Baseline Metric\" (chỉ số nền ban đầu) trong 7–14 ngày đầu tiếp nhận dự án là gì?", ["Để thu thêm phí cài đặt", "Để đo lường trung thực hiệu suất thực tế của sản phẩm và trang đích hiện tại (CTR, CPL, CPA), làm cơ sở khoa học trước khi cam kết mục tiêu", "Để kéo dài thời gian hợp đồng mà không làm gì", "Để thay thế hoàn toàn việc gắn mã UTM"], 1, "Không chuyên gia nào dám cam kết khống số liệu khi chưa đo được các chỉ số vận hành nền tảng thực tế."],
    ["m13", "Dấu hiệu cảnh báo đỏ (Red Flag) nào cho thấy bạn nên TỪ CHỐI nhận dự án quảng cáo của khách hàng?", ["Chủ shop cung cấp đầy đủ giấy phép sản phẩm và báo cáo tài chính", "Chủ shop đòi cam kết ra 1.000 đơn ngay ngày đầu với ngân sách 2 triệu, sản phẩm không có giấy phép và yêu cầu chạy hàng nhái", "Chủ shop muốn ký hợp đồng dịch vụ 3 tháng", "Chủ shop có sẵn đội ngũ chăm sóc khách hàng 24/7"], 1, "Yêu cầu phi lý, sản phẩm vi phạm pháp luật là dấu hiệu chắc chắn sẽ dẫn đến tranh chấp và rủi ro pháp lý."],
    ["m13", "Tiêu chuẩn thời gian phản hồi tin nhắn khách hàng (Lead Response Time) tối ưu trong tiếp thị số là bao nhiêu?", ["Trong vòng 24 đến 48 giờ", "Trong vòng 5 đến 15 phút kể từ khi khách để lại tin nhắn", "Cuối tuần trả lời một lần", "Không cần trả lời tin nhắn"], 1, "Phản hồi nhanh trong 5–15 phút giữ cho sự quan tâm của khách hàng ở mức cao nhất, tăng gấp đôi tỷ lệ chốt đơn."],
    ["m13", "Trong Phiếu Khám bệnh Phễu 10 Điểm, nếu sản phẩm có biên lợi nhuận ròng trước quảng cáo dưới 20%, bạn nên đưa ra cảnh báo gì?", ["Nên tăng gấp 10 lần ngân sách quảng cáo", "Cảnh báo biên lợi nhuận quá mỏng, chi phí quảng cáo sàn và thuế sẽ dễ dàng nuốt trọn lợi nhuận, cần đóng combo tăng AOV trước khi chạy ads", "Khuyên khách hàng hạ giá bán rẻ hơn nữa", "Khuyên khách hàng bỏ trang web"], 1, "Biên lợi nhuận mỏng dưới 20% đòi hỏi ROAS hoà vốn trên 5,0 lần — mức cực kỳ khó duy trì ổn định đối với quảng cáo trả phí."],
    ["m13", "Trong tình huống Anh Hoàng (Shop đồng hồ), vì sao marketer kiên quyết từ chối cam kết CPA 50.000đ ngay tuần đầu?", ["Vì marketer ghét bán đồng hồ", "Vì Fanpage mới lập 0 bài viết và không có nhân sự trực chat buổi tối, tỷ lệ chốt đơn chắc chắn rất thấp làm CPA tăng vọt", "Vì đồng hồ không được phép bán online", "Vì Facebook cấm quảng cáo đồng hồ"], 1, "CPA là kết quả phối hợp giữa quảng cáo và khâu chốt đơn; khi khâu chốt đơn bị bỏ trống thì CPA không thể rẻ được."],

    // m14 (10 câu)
    ["m14", "Một sản phẩm bán trên sàn TMĐT với giá 300.000đ/chiếc. Giá vốn 40%, phí sàn và hoàn đơn là 18,5%, thuế sàn nộp thay là 1,5%. ROAS hoà vốn của sản phẩm này là bao nhiêu?", ["1,5 lần", "2,0 lần", "2,5 lần (vì biên lợi nhuận ròng trước ads = 40%; 1 ÷ 0,40 = 2,5)", "4,0 lần"], 2, "Tổng chi phí trước ads = 40% + 18,5% + 1,5% = 60%. Biên lãi ròng = 40%. ROAS hoà vốn = 1 ÷ 0,40 = 2,5."],
    ["m14", "Theo Điều 28 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, khi doanh nghiệp thuê Agency/Freelancer xử lý dữ liệu khách hàng để chạy quảng cáo, văn bản nào bắt buộc phải có?", ["Không cần ký văn bản nào", "Thoả thuận xử lý dữ liệu cá nhân (DPA / điều khoản hợp đồng bằng văn bản) phân định rõ trách nhiệm của Bên kiểm soát và Bên xử lý dữ liệu", "Bản sao kê ngân hàng cá nhân", "Giấy chứng nhận đăng ký kết hôn"], 1, "Điều 28 Luật 91/2025/QH15 bắt buộc việc thuê dịch vụ xử lý dữ liệu tiếp thị phải có thoả thuận bằng văn bản."],
    ["m14", "Vì sao trong Hợp đồng dịch vụ tiếp thị cần có điều khoản cam kết thời gian phản hồi (SLA) của đội ngũ bán hàng phía khách hàng?", ["Để can thiệp vào việc trả lương nhân viên của khách", "Vì nếu marketer mang về lead đúng đối tượng nhưng nhân viên của khách phản hồi quá chậm làm rớt đơn, cần có căn cứ minh bạch để xác định đúng khâu cần cải thiện", "Để không cần cài đặt GA4", "Để tăng giá dịch vụ lên gấp đôi"], 1, "Doanh thu là kết quả chung của Marketing và Sales; SLA giúp bảo vệ cả hai bên và tối ưu đúng điểm nghẽn."],
    ["m14", "Điều khoản \"Giới hạn số lần chỉnh sửa (Revision Limit: tối đa 2 vòng dựa trên Brief đã duyệt)\" giúp giải quyết rủi ro nào lớn nhất cho Freelancer?", ["Rủi ro quên nạp tiền tài khoản ads", "Rủi ro phình phạm vi công việc không giới hạn (Scope Creep) khi khách hàng liên tục đòi sửa đổi thiết kế/video mà không trả thêm tiền", "Rủi ro website tải chậm", "Rủi ro trùng từ khoá SEO"], 1, "Khoá rõ số vòng chỉnh sửa giúp quy trình làm việc kỷ luật và bảo vệ biên lợi nhuận thời gian của người làm dịch vụ."],
    ["m14", "Theo Nghị định 70/2025/NĐ-CP (hiệu lực 01/06/2025), hộ kinh doanh bán lẻ đạt doanh thu hằng năm từ bao nhiêu trở lên thì bắt buộc áp dụng hoá đơn điện tử từ máy tính tiền?", ["Từ 50 triệu đồng/năm trở lên", "Từ 200 triệu đồng/năm trở lên", "Từ 01 tỷ đồng/năm trở lên", "Từ 50 tỷ đồng/năm trở lên"], 2, "Khoản 8 Điều 1 Nghị định 70/2025/NĐ-CP quy định ngưỡng bắt buộc từ 01 tỷ đồng/năm trở lên đối với bán lẻ."],
    ["m14", "Vì sao người mới làm Freelance TUYỆT ĐỐI KHÔNG NÊN nhận kèo hợp tác \"100% ăn chia theo % doanh thu thuần tuý\" với shop lạ?", ["Vì nhận % doanh thu thì bị cấm nộp thuế", "Vì marketer chỉ kiểm soát được khâu kéo khách, không kiểm soát được chất lượng hàng, tồn kho, tốc độ đóng gói và kỹ năng chốt sale của nhân viên shop", "Vì pháp luật cấm chia sẻ doanh thu", "Vì nền tảng quảng cáo không cho phép"], 1, "Nếu shop tư vấn kém hoặc hết hàng, marketer sẽ mất trắng toàn bộ công sức hàng tháng trời mà không nhận được thù lao."],
    ["m14", "Cấu trúc một Bảng Báo giá Dịch vụ 3 Gói chuẩn mực thường bao gồm những gói nào?", ["Gói Miễn phí – Gói Giá rẻ – Gói Tặng kèm", "Gói Cơ bản (Starter) – Gói Tiêu chuẩn (Pro) – Gói Tăng trưởng (Growth)", "Gói 1 ngày – Gói 2 ngày – Gói 3 ngày", "Gói Mùa xuân – Gói Mùa hạ – Gói Mùa đông"], 1, "Cấu trúc 3 gói giúp khách hàng dễ dàng lựa chọn gói dịch vụ phù hợp với ngân sách và giai đoạn phát triển."],
    ["m14", "Trong tình huống Chị Thảo Vy (Trà thảo mộc), sản phẩm bán 200k với giá vốn 45%, phí sàn 18,5%, hoàn đơn 2%, thuế sàn 1,5%. Điểm ROAS hoà vốn là bao nhiêu?", ["ROAS = 1,5 lần", "ROAS = 2,5 lần", "ROAS = 3,03 lần (vì biên lãi ròng trước ads chỉ còn 33%; 1 ÷ 0,33 = 3,03)", "ROAS = 5,0 lần"], 2, "Tổng chi phí trước ads = 67%. Biên lãi ròng = 33%. ROAS hoà vốn = 1 ÷ 0,33 = 3,03 lần."],
    ["m14", "Trong tình huống trên của Chị Thảo Vy, với mức ROAS hiện tại bằng 2,5, tình trạng tài chính của shop đang như thế nào?", ["Đang lãi rất đậm", "Đang hoà vốn chính xác", "Đang LỖ 14.000đ trên mỗi hộp bán ra dù doanh số vẫn tăng trưởng", "Không thể tính toán được"], 2, "ROAS = 2,5 nghĩa là tốn 80.000đ ads để bán hộp 200.000đ; lấy 200k trừ chi phí 134k trừ ads 80k = lỗ 14.000đ/hộp."],
    ["m14", "Điều khoản \"Tách bạch Ngân sách Quảng cáo & Phí Dịch vụ\" trong hợp đồng mang lại ý nghĩa gì?", ["Khách hàng tự thanh toán tiền quảng cáo bằng thẻ của khách; Marketer chỉ nhận thù lao và xuất hoá đơn trên phần phí dịch vụ quản trị", "Marketer dùng thẻ cá nhân nạp tiền cho khách", "Khách hàng không cần trả tiền cho Facebook", "Tất cả chi phí đều do nhà nước chi trả"], 0, "Quy định này bảo vệ marketer khỏi rủi ro bị tính thuế oan trên toàn bộ dòng tiền quảng cáo của khách hàng."],

    // m15 (9 câu)
    ["m15", "Cách ứng dụng AI nào dưới đây là HỢP PHÁP và ĐÚNG CHUẨN đạo đức nghề nghiệp trong tiếp thị số năm 2026?", ["Dùng AI tạo mặt và giọng nói giả mạo một bác sĩ nổi tiếng để khen thực phẩm chức năng", "Dùng AI tự viết 200 đánh giá 5 sao giả mạo đăng lên fanpage", "Dùng AI để phân nhóm các câu hỏi, nỗi đau từ bình luận thật của khách hàng (đã ẩn danh thông tin cá nhân) và gợi ý các góc tiêu đề để con người kiểm duyệt", "Tin tưởng 100% số liệu luật thuế do AI tự sinh ra không cần kiểm tra"], 2, "AI là trợ lý tăng tốc phân tích; con người bắt buộc phải ẩn danh thông tin bảo mật và chịu trách nhiệm kiểm duyệt cuối cùng."],
    ["m15", "Hiện tượng \"AI Hallucination\" (Ảo giác AI) trong sáng tạo nội dung quảng cáo nguy hiểm nhất ở điểm nào?", ["Làm phông chữ nhỏ lại", "AI có thể tự bịa ra các số liệu thống kê, điều luật, chứng nhận kiểm định hoặc công dụng sản phẩm nghe rất thuyết phục nhưng không có thật", "Làm tốc độ mạng internet nhanh hơn", "Giúp quảng cáo được duyệt tự động"], 1, "Mọi con số cam kết và công dụng sản phẩm bắt buộc phải được đối chiếu từ hồ sơ kiểm nghiệm thực tế của cơ quan chức năng."],
    ["m15", "Phần nào trong Báo cáo Hiệu quả Hàng tháng (Monthly Executive Report) đóng vai trò quyết định giúp chủ doanh nghiệp chủ động ký gia hạn hợp đồng tiếp theo?", ["Bảng liệt kê 50 chỉ số kỹ thuật viết tắt không có giải thích", "Lời đổ lỗi hoàn toàn cho thuật toán Facebook", "Sự minh bạch về kết quả kinh doanh thực tế (CPA, ROAS so với điểm hoà vốn), nguyên nhân các thử nghiệm thắng/thua và Kế hoạch 3 hành động cụ thể cho tháng tới", "Ảnh chụp màn hình số lượt hiển thị thật lớn dù không có đơn nào"], 2, "Khách hàng tiếp tục thuê bạn khi họ thấy bạn kiểm soát được bài toán lời/lỗ và luôn có lộ trình phát triển rõ ràng tiếp theo."],
    ["m15", "Trước khi đưa dữ liệu đoạn chat hoặc danh sách đơn hàng của khách vào các công cụ AI công cộng để phân tích, marketer bắt buộc phải làm bước nào?", ["Giữ nguyên đầy đủ Họ tên, Số điện thoại và Số CCCD", "Xoá bỏ hoặc ẩn danh hoàn toàn mọi thông tin định danh cá nhân (Họ tên, Số điện thoại, Email, Số CCCD, Địa chỉ chi tiết) theo Luật BVDLCN 91/2025/QH15", "Đăng công khai file đó lên mạng xã hội trước", "Không cần làm gì cả"], 1, "Đưa dữ liệu cá nhân của khách hàng lên các nền tảng AI của bên thứ ba khi chưa được sự đồng ý là hành vi vi phạm pháp luật bảo vệ quyền riêng tư."],
    ["m15", "Khi báo cáo kết quả chiến dịch TikTok Shop Product GMV Max cho chủ shop, vì sao marketer chuyên nghiệp cần bóc tách doanh thu tự nhiên nền (Organic Baseline)?", ["Vì TikTok không cộng doanh thu", "Vì cơ chế Blended Attribution của GMV Max đã gộp cả các đơn hàng tự nhiên vào tổng doanh số chiến dịch, dễ gây ảo tưởng về hiệu quả thực tế của tiền quảng cáo", "Vì GMV Max chỉ tính đơn hàng bị huỷ", "Vì GMV Max miễn phí hoàn toàn"], 1, "Bóc tách doanh thu tự nhiên giúp chủ shop biết chính xác tiền quảng cáo bỏ ra có thực sự mang lại lợi nhuận tăng thêm (Incremental Lift) hay không."],
    ["m15", "Cấu trúc Báo cáo 4W (\"4W Executive Summary\") bao gồm những phần cốt lõi nào?", ["When – Where – Who – Why", "Business Impact (Tác động kinh doanh) – What Worked (Điều đã thắng) – What Didn't & Why (Điều chưa đạt & cách sửa) – Next Action Plan (Kế hoạch hành động tháng tới)", "Word – Excel – PowerPoint – PDF", "Facebook – Google – TikTok – Zalo"], 1, "Cấu trúc 4W tập trung vào ngôn ngữ kinh doanh của chủ shop, minh bạch kết quả và định hướng tương lai."],
    ["m15", "Trong tình huống Bạn Khoa (Spa Thảo Nguyên), khi một cộng tác viên đề xuất dùng AI ghép mặt bác sĩ nổi tiếng vào video quảng cáo, Khoa phải xử lý thế nào?", ["Đồng ý ngay vì tiết kiệm chi phí thuê bác sĩ thật", "Ngăn chặn ngay lập tức vì hành vi giả mạo hình ảnh cá nhân và đưa lời chứng thực y tế giả vi phạm nghiêm trọng Luật BVDLCN 91/2025 và Luật QC 75/2025", "Chỉ làm mờ mặt bác sĩ rồi chạy tiếp", "Bảo cộng tác viên tự chịu trách nhiệm"], 1, "Vi phạm này có thể dẫn đến việc khoá vĩnh viễn tài khoản doanh nghiệp và bị cơ quan quản lý nhà nước xử phạt nặng."],
    ["m15", "Quy tắc \"Human-in-the-loop\" (HITL) trong tiếp thị số ứng dụng AI có ý nghĩa gì?", ["Để máy móc tự động đăng bài 100% không cần người xem", "Con người bắt buộc phải tham gia vào khâu kiểm duyệt, xác minh sự thật và chịu trách nhiệm pháp lý đối với nội dung do AI tạo ra", "Bắt buộc phải thuê thêm 10 nhân sự mới", "Chỉ dùng AI để viết email cá nhân"], 1, "AI chỉ là công cụ hỗ trợ sản xuất bản nháp; con người luôn là chốt chặn kiểm duyệt đạo đức và pháp lý."],
    ["m15", "Chỉ số \"Client Churn Rate\" trong kinh doanh dịch vụ Freelance/Agency đo lường điều gì?", ["Tỷ lệ khách hàng rời bỏ dịch vụ sau một khoảng thời gian hợp tác", "Tốc độ phản hồi tin nhắn của khách", "Số lượng hoá đơn đã xuất", "Tỷ lệ tăng giá dịch vụ hàng năm"], 0, "Giữ chân khách hàng cũ (Retainer Retention) có chi phí rẻ hơn nhiều so với việc liên tục phải đi tìm khách hàng mới."],

    // m16 (9 câu)
    ["m16", "Cách phân quyền tài khoản nào dưới đây là ĐÚNG CHUẨN bảo mật chuyên nghiệp khi bạn nhận chạy quảng cáo Facebook cho khách hàng?", ["Bảo khách nhắn mật khẩu Facebook và Gmail cá nhân qua Zalo", "Dùng chung 1 tài khoản quảng cáo cá nhân của bạn để chạy lẫn lộn cho 8 khách hàng khác nhau", "Hướng dẫn khách hàng tạo Business Portfolio (BM) chính chủ, khách tự gắn thẻ thanh toán của khách, bật xác thực 2 lớp (2FA) và cấp quyền Đối tác (Partner) cho bạn", "Cài phần mềm bẻ khoá lạ trên mạng để quản lý nhiều tài khoản"], 2, "Khách hàng phải sở hữu tài sản số của chính họ; cấp quyền đối tác giúp cô lập rủi ro và không bao giờ để lộ mật khẩu cá nhân."],
    ["m16", "Theo Luật sửa đổi, bổ sung một số điều của Luật Quảng cáo số 75/2025/QH15, khi thuê KOL/KOC giới thiệu sản phẩm trên mạng xã hội, hành vi nào là VI PHẠM pháp luật?", ["Cung cấp hồ sơ công bố sản phẩm và yêu cầu KOL gắn nhãn tài trợ minh bạch", "Yêu cầu KOL đóng giả làm người mua tình cờ (quảng cáo trá hình không gắn nhãn) và đọc kịch bản phóng đại công dụng chữa bệnh mà sản phẩm không có", "Ký hợp đồng dịch vụ và khấu trừ thuế TNCN đúng quy định", "Kiểm tra kỹ giấy phép sản phẩm trước khi quay video"], 1, "Luật 75/2025/QH15 bắt buộc người có ảnh hưởng phải xác minh tài liệu sản phẩm và thông báo rõ ràng việc đang thực hiện quảng cáo."],
    ["m16", "Khi tài khoản quảng cáo bị hạn chế do mẫu quảng cáo vi phạm chính sách \"Nội dung gây hiểu lầm (Misrepresentation)\", bước xử lý đúng đắn nhất là gì?", ["Mua ngay 10 tài khoản ảo để đăng lại video vừa bị khoá (Circumventing Systems)", "Gỡ bỏ/sửa nội dung vi phạm cho đúng giấy phép công bố (bỏ cam kết 100%, bỏ so sánh phản cảm), rà soát trang đích rồi mới gửi yêu cầu xem xét lại chính thức", "Xoá trang web của công ty", "Nhờ dịch vụ mở khoá chui trên mạng"], 1, "Cố tình tạo tài khoản ảo để lách hệ thống sẽ chuyển lỗi sang vi phạm nghiêm trọng (Circumventing Systems) và bị cấm vĩnh viễn cả BM lẫn tên miền."],
    ["m16", "Vấn đề nào dưới đây nằm NGOÀI ranh giới chuyên môn của Marketer và bắt buộc phải chuyển giao cho Kế toán thuế / Luật sư có chứng chỉ hành nghề?", ["Gắn mã tham số UTM vào đường link chiến dịch", "Thiết lập thử nghiệm A/B testing tiêu đề quảng cáo", "Kê khai quyết toán thuế thu nhập doanh nghiệp, khấu trừ thuế nhà thầu nước ngoài (FCT) hoặc đại diện pháp lý giải quyết tranh chấp khởi kiện tại toà án", "Phân tích báo cáo Traffic Acquisition trên Google Analytics 4"], 2, "Marketer chỉ tư vấn trong phạm vi tiếp thị; các nghiệp vụ kế toán thuế chuyên sâu và đại diện pháp lý phải do người có chứng chỉ hành nghề thực hiện."],
    ["m16", "Theo Điều 28 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, khi hợp đồng dịch vụ quảng cáo giữa Thương hiệu và Agency kết thúc, Agency phải xử lý dữ liệu khách hàng như thế nào?", ["Giữ lại toàn bộ để bán cho công ty đối thủ", "Tiếp tục gửi tin nhắn quảng cáo dịch vụ riêng của Agency tới danh sách đó", "Chấm dứt xử lý, bàn giao lại toàn bộ quyền truy cập cho Bên kiểm soát dữ liệu (Thương hiệu) và xoá an toàn các bản sao dữ liệu cá nhân lưu trữ tạm thời theo thoả thuận", "Đăng danh sách lên hội nhóm công khai"], 2, "Đơn vị dịch vụ quảng cáo chỉ được xử lý dữ liệu cá nhân trong phạm vi thời hạn uỷ quyền hợp pháp của hợp đồng."],
    ["m16", "Hành vi \"chạy bùng\" tiền quảng cáo (tiêu tiền rồi vứt thẻ ngân hàng) gây ra hậu quả nghiêm trọng nào?", ["Giúp doanh nghiệp tiết kiệm chi phí tiếp thị", "Phá huỷ uy tín cá nhân, đưa thông tin thẻ vào danh sách đen quốc tế và có thể bị truy cứu trách nhiệm dân sự/hình sự về tội lừa đảo chiếm đoạt tài sản", "Được các nền tảng quảng cáo khen thưởng", "Giúp tăng điểm chất lượng tài khoản"], 1, "Hành vi gian lận tài chính hủy hoại uy tín nghề nghiệp lâu dài và tiềm ẩn rủi ro pháp lý hình sự."],
    ["m16", "Tại sao marketer tuyệt đối không nên cài đặt các tiện ích mở rộng (browser extensions) cào data hoặc nuôi nick lạ trên trình duyệt máy tính làm việc?", ["Vì làm giao diện trình duyệt xấu đi", "Vì tiện ích lạ thường chứa mã độc đánh cắp cookie đăng nhập, dẫn đến bị chiếm đoạt toàn bộ quyền quản trị Business Manager và lộ thẻ thanh toán", "Vì làm máy tính tốn pin hơn", "Vì Google cấm dùng tiện ích mở rộng"], 1, "Mã độc đánh cắp cookie là nguyên nhân hàng đầu khiến các tài khoản quảng cáo doanh nghiệp bị hack và chiếm quyền kiểm soát."],
    ["m16", "Trong tình huống Chị Mai (Cơ sở TPCN bị khoá BM vì KOC quảng cáo lố khỏi hẳn tiểu đường), hành động đúng đắn của marketer là gì?", ["Nhận mật khẩu cá nhân của chị Mai tạo 10 tài khoản ảo chạy tiếp", "Từ chối lách luật, hướng dẫn gỡ bỏ video sai sự thật, đăng thông báo đính chính hoàn tiền cho khách, và khuyên chị Mai làm việc với Luật sư để xử lý tranh chấp pháp lý", "Xúi giục chị Mai kiện Facebook ra toà án quốc tế", "Đổ lỗi cho khách hàng uống thuốc không đúng cách"], 1, "Xử lý khủng hoảng dựa trên sự trung thực và tôn trọng pháp luật giúp bảo vệ uy tín lâu dài của thương hiệu."],
    ["m16", "Biên bản Bàn giao & Thu hồi Tài sản Số (Asset Handover Protocol) khi kết thúc hợp đồng cần có những nội dung nào?", ["Gỡ quyền truy cập của Agency trong BM, đổi mật khẩu các tài khoản dịch vụ dùng chung, xoá bản sao dữ liệu khách hàng và bàn giao file thiết kế gốc", "Chỉ cần nhắn tin qua Zalo nói lời tạm biệt", "Giữ lại quyền quản trị viên Fanpage làm con tin đòi thêm tiền", "Xoá toàn bộ bài viết trên Fanpage"], 0, "Bàn giao tài sản số minh bạch bằng văn bản thể hiện chuẩn mực hành nghề chuyên nghiệp và phòng ngừa tranh chấp sau này."]
  ];

  var lessons = L.map(function (l) {
    return {
      id: l[0],
      part: l[1],
      title: l[2],
      file: l[3],
      vocabCount: (V[l[0]] || []).length,
      quizCount: Q.filter(function (q) { return q[0] === l[0]; }).length
    };
  });

  var vocab = [];
  Object.keys(V).forEach(function (id) {
    V[id].forEach(function (x) {
      vocab.push({
        en: x[0],
        vi: x[1],
        kind: "term",
        lesson: id,
        section: title[id]
      });
    });
  });

  var questions = Q.map(function (q) {
    return {
      q: q[1],
      opts: q[2],
      a: q[3],
      exp: q[4],
      lesson: q[0],
      section: title[q[0]]
    };
  });

  window.QUEST_LESSONS = {
    lessons: lessons,
    vocab: vocab,
    questions: questions
  };
})();
