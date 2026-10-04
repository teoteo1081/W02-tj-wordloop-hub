// Digital Marketing Quest — từ vựng + trắc nghiệm, viết tay theo khoá học
// teoteo1081/L02-digital-marketing-beginner (module 00–10, file docs/src/*.md).
(function () {
  var L = [
    ["m01", 1, "01 · Tổng quan & Customer Journey", "docs/src/01-tong-quan-digital-marketing-vn.md"],
    ["m02", 1, "02 · Marketing Funnel", "docs/src/02-marketing-funnel.md"],
    ["m03", 1, "03 · Buyer Persona", "docs/src/03-buyer-persona-customer-journey.md"],
    ["m04", 1, "04 · Hệ sinh thái nền tảng VN", "docs/src/04-he-sinh-thai-nen-tang-vn.md"],
    ["m05", 2, "05 · Facebook & Instagram Ads", "docs/src/05-facebook-instagram-ads.md"],
    ["m06", 2, "06 · TikTok, Google & Zalo Ads", "docs/src/06-tiktok-ads-google-ads.md"],
    ["m07", 3, "07 · SEO & Content website", "docs/src/07-seo-organic-website.md"],
    ["m08", 3, "08 · Kênh & Cộng đồng organic", "docs/src/08-content-community-zalo-fb-tiktok.md"],
    ["m09", 3, "09 · Đo lường: KPI, UTM, GA4", "docs/src/09-do-luong-ga4-kpi-utm.md"],
    ["m10", 3, "10 · Tối ưu & Capstone", "docs/src/10-toi-uu-va-capstone.md"]
  ];
  var title = {}; L.forEach(function (l) { title[l[0]] = l[2]; });

  var V = {
    m01: [
      ["digital marketing", "tiếp thị trên môi trường số (mạng xã hội, Google, web, app…)"],
      ["customer journey", "hành trình khách hàng: từ lúc biết đến khi mua và mua lại"],
      ["touchpoint", "điểm chạm: mỗi nơi khách gặp thương hiệu (bài đăng, tin nhắn, review…)"],
      ["paid media", "kênh trả tiền: quảng cáo Facebook, Google, TikTok…"],
      ["organic", "tự nhiên, không trả tiền quảng cáo (bài đăng, SEO, cộng đồng)"],
      ["channel", "kênh tiếp cận khách hàng"],
      ["brand awareness", "mức độ khách biết đến thương hiệu"],
      ["word of mouth", "truyền miệng, khách giới thiệu cho nhau"],
      ["social proof", "bằng chứng xã hội: review, đánh giá, số người đã mua"]
    ],
    m02: [
      ["funnel", "phễu: số khách giảm dần qua từng giai đoạn"],
      ["awareness", "nhận biết: khách biết bạn tồn tại"],
      ["consideration", "cân nhắc: khách quan tâm, so sánh"],
      ["conversion", "chuyển đổi: khách hành động (mua, để lại SĐT, nhắn tin)"],
      ["retention", "giữ chân: khách quay lại mua tiếp, giới thiệu người khác"],
      ["TOFU", "Top of Funnel: đầu phễu = Awareness"],
      ["MOFU", "Middle of Funnel: giữa phễu = Consideration"],
      ["BOFU", "Bottom of Funnel: đáy phễu = Conversion + Retention"],
      ["drop-off", "chỗ rớt khách giữa 2 bước của phễu"],
      ["landing page", "trang đích: trang khách đến sau khi bấm quảng cáo"],
      ["lead", "khách tiềm năng đã để lại thông tin liên hệ"]
    ],
    m03: [
      ["buyer persona", "chân dung khách hàng mục tiêu, xây từ dữ liệu thật"],
      ["pain point", "nỗi đau / rào cản khiến khách chưa mua"],
      ["target audience", "nhóm khách hàng mục tiêu"],
      ["demographics", "nhân khẩu học: tuổi, giới tính, nơi sống, thu nhập"],
      ["trigger", "yếu tố kích hoạt quyết định mua (review thật, ưu đãi, học thử…)"],
      ["survey", "khảo sát ngắn khách hàng"],
      ["insight", "sự thật ngầm hiểu về khách, giúp nội dung chạm đúng tâm lý"],
      ["segment", "phân khúc: nhóm nhỏ khách hàng có đặc điểm giống nhau"]
    ],
    m04: [
      ["Zalo OA", "Zalo Official Account: tài khoản chính thức của doanh nghiệp trên Zalo"],
      ["Facebook Group", "nhóm cộng đồng trên Facebook, nơi khách review và hỏi đáp"],
      ["TikTok Shop", "gian hàng mua bán ngay trong app TikTok"],
      ["e-commerce marketplace", "sàn thương mại điện tử (Shopee, TikTok Shop, Lazada…)"],
      ["Shopee Ads", "quảng cáo trong app Shopee, tính phí theo click"],
      ["livestream selling", "bán hàng qua phát trực tiếp"],
      ["search intent", "ý định tìm kiếm: khách đang muốn gì khi gõ từ khoá"],
      ["SME", "doanh nghiệp vừa và nhỏ"],
      ["channel mix", "tổ hợp kênh: chọn 2–3 kênh phối hợp với nhau"]
    ],
    m05: [
      ["campaign", "chiến dịch: tầng chọn mục tiêu (objective)"],
      ["ad set", "nhóm quảng cáo: tầng cài đối tượng, ngân sách, lịch, vị trí"],
      ["ad creative", "nội dung quảng cáo khách nhìn thấy (hình, video, chữ)"],
      ["objective", "mục tiêu chiến dịch (nhận diện, tương tác, tin nhắn, doanh số…)"],
      ["core audience", "đối tượng chọn theo tuổi, khu vực, sở thích, hành vi"],
      ["custom audience", "đối tượng tuỳ chỉnh: người đã tương tác với bạn (để retarget)"],
      ["lookalike audience", "đối tượng tương tự: người giống khách hàng cũ"],
      ["retargeting", "quảng cáo lại cho người đã từng tương tác"],
      ["daily budget", "ngân sách mỗi ngày"],
      ["CBO", "Campaign Budget Optimization: để Facebook tự chia tiền giữa các nhóm"],
      ["placement", "vị trí hiển thị quảng cáo (Feed, Story, Reels…)"],
      ["hook", "câu/hình mở đầu 3 giây đầu để giữ chân người xem"],
      ["CTA", "Call To Action: lời kêu gọi hành động (Nhắn Zalo ngay, Đặt hàng…)"],
      ["Pixel", "đoạn mã đo hành động của khách trên website để tối ưu quảng cáo"]
    ],
    m06: [
      ["In-Feed Ads", "quảng cáo video xen trong feed For You của TikTok"],
      ["Spark Ads", "biến video TikTok tự nhiên (của mình hoặc KOC) thành quảng cáo"],
      ["KOL", "Key Opinion Leader: người có ảnh hưởng lớn"],
      ["KOC", "Key Opinion Consumer: người dùng thật review sản phẩm"],
      ["Search Ads", "quảng cáo hiện trên kết quả tìm kiếm Google"],
      ["Display Ads", "quảng cáo banner trên mạng lưới website đối tác"],
      ["keyword", "từ khoá khách gõ để tìm kiếm"],
      ["negative keyword", "từ khoá phủ định: chặn quảng cáo hiện với từ không liên quan"],
      ["interruption marketing", "quảng cáo xen ngang khi khách không chủ động tìm (Facebook, TikTok)"],
      ["intent-based marketing", "quảng cáo đón đầu nhu cầu khi khách đang chủ động tìm (Google Search)"],
      ["quality score", "điểm chất lượng của Google cho từ khoá + quảng cáo + trang đích"]
    ],
    m07: [
      ["SEO", "Search Engine Optimization: tối ưu để lên top Google tự nhiên"],
      ["on-page SEO", "tối ưu ngay trên trang: tiêu đề, heading, tốc độ, nội dung"],
      ["meta description", "đoạn mô tả ngắn dưới tiêu đề trên kết quả tìm kiếm"],
      ["heading (H1, H2, H3)", "tiêu đề và tiêu đề phụ chia bố cục bài viết"],
      ["page speed", "tốc độ tải trang"],
      ["mobile-friendly", "hiển thị tốt trên điện thoại"],
      ["long-tail keyword", "từ khoá dài, cụ thể, ít cạnh tranh, ý định rõ"],
      ["content pillar", "bài trụ cột: chủ đề lớn, liên kết tới nhiều bài vệ tinh"],
      ["backlink", "liên kết từ website khác trỏ về website của bạn"],
      ["organic traffic", "lượt truy cập tự nhiên từ tìm kiếm, không trả tiền"]
    ],
    m08: [
      ["Facebook Page", "trang chính thức của thương hiệu trên Facebook"],
      ["community", "cộng đồng khách hàng tương tác hai chiều"],
      ["engagement", "tương tác: thích, bình luận, chia sẻ, lưu"],
      ["content calendar", "lịch nội dung: kế hoạch đăng bài theo ngày"],
      ["Reels", "video ngắn dạng dọc trên Instagram/Facebook"],
      ["user-generated content (UGC)", "nội dung do chính khách hàng tạo ra"],
      ["broadcast message", "tin nhắn gửi hàng loạt cho người theo dõi (Zalo OA)"],
      ["algorithm", "thuật toán quyết định ai thấy nội dung của bạn"]
    ],
    m09: [
      ["KPI", "Key Performance Indicator: chỉ số chính để đo mục tiêu"],
      ["impression", "lượt hiển thị quảng cáo"],
      ["reach", "số người khác nhau đã thấy quảng cáo"],
      ["CTR", "Click-Through Rate: số click ÷ lượt hiển thị"],
      ["CPC", "Cost Per Click: chi phí trung bình mỗi click"],
      ["CPM", "Cost Per Mille: chi phí cho 1.000 lượt hiển thị"],
      ["CPA", "Cost Per Action: chi phí cho mỗi hành động mong muốn"],
      ["conversion rate", "tỉ lệ chuyển đổi: số người hành động ÷ số người truy cập/click"],
      ["ROAS", "Return On Ad Spend: doanh thu ÷ tiền quảng cáo"],
      ["UTM", "đoạn gắn vào cuối link để biết khách đến từ kênh/chiến dịch nào"],
      ["utm_source", "nguồn (facebook, zalo, google…)"],
      ["utm_medium", "loại kênh (cpc, social, email…)"],
      ["utm_campaign", "tên chiến dịch"],
      ["GA4", "Google Analytics 4: công cụ đo hành vi trên website"],
      ["session", "một lượt truy cập website"],
      ["engagement rate", "tỉ lệ phiên có tương tác thật (GA4)"],
      ["traffic acquisition", "báo cáo khách đến website từ nguồn nào"],
      ["frequency", "tần suất: trung bình mỗi người thấy quảng cáo mấy lần"]
    ],
    m10: [
      ["A/B testing", "thử 2 phiên bản, chỉ khác 1 yếu tố, để xem bản nào tốt hơn"],
      ["variable", "yếu tố được thay đổi khi test"],
      ["scale", "nhân rộng: tăng ngân sách/phạm vi cho phần đang hiệu quả"],
      ["optimization", "tối ưu: sửa/bỏ phần kém, giữ phần tốt"],
      ["learning phase", "giai đoạn máy quảng cáo đang học, kết quả còn dao động"],
      ["statistical significance", "đủ dữ liệu để kết luận không phải do may rủi"],
      ["capstone", "bài dự án tổng kết cuối khoá"],
      ["mini-funnel", "phễu nhỏ hoàn chỉnh: 1 sản phẩm, 1 persona, đủ 4 giai đoạn"]
    ]
  };

  // [lesson, câu hỏi, [4 lựa chọn], đáp án đúng (0–3), giải thích]
  var Q = [
    ["m01", "Hành trình mua hàng của khách Việt Nam thường như thế nào?", ["Tuyến tính: thấy quảng cáo → vào web → mua", "Không tuyến tính, nhiều điểm chạm: mạng xã hội, chat Zalo, so giá đa sàn", "Chỉ mua qua website chính thức", "Chỉ mua khi gặp trực tiếp"], 1, "Khách VN hay xem review trên Group, nhắn Zalo hỏi, so giá trên Shopee/TikTok Shop trước khi quyết định."],
    ["m01", "Quảng cáo có rất nhiều click. Điều đó có chắc chắn chiến dịch thành công không?", ["Có, click nhiều là thắng", "Không, khách có thể rớt ở bước tư vấn hoặc chốt đơn sau đó", "Có, nếu CPC thấp", "Không thể đo được"], 1, "Click chỉ là một bước. Phải nhìn đến kết quả cuối (tin nhắn, đơn hàng, doanh thu)."],
    ["m01", "Kênh nào phù hợp nhất để chốt đơn qua chat trực tiếp ở Việt Nam?", ["Display Ads", "YouTube", "Zalo OA / chat Zalo", "Banner báo điện tử"], 2, "Zalo gắn với số điện thoại thật, khách tin tưởng, rất hợp để tư vấn và chốt đơn."],
    ["m02", "Thứ tự đúng của 4 giai đoạn funnel là gì?", ["Conversion → Awareness → Retention → Consideration", "Awareness → Consideration → Conversion → Retention", "Consideration → Awareness → Conversion → Retention", "Awareness → Conversion → Consideration → Retention"], 1, "Biết đến → cân nhắc → hành động → quay lại."],
    ["m02", "Quảng cáo nhiều click nhưng rất ít người nhắn tin hỏi mua. Vấn đề nhiều khả năng nằm ở đâu?", ["Trang đích (landing page) / nội dung sau click", "Thuật toán Facebook", "Tên miền website", "Màu logo"], 0, "Khách đã quan tâm (click) nhưng rớt sau đó, nên xem lại trang đích, giá, thông tin, nút liên hệ."],
    ["m02", "TOFU tương ứng với giai đoạn nào?", ["Conversion", "Retention", "Awareness", "Consideration"], 2, "TOFU = Top of Funnel = đầu phễu = nhận biết."],
    ["m02", "Vì sao không nên dùng cùng một kiểu nội dung cho cả 4 giai đoạn?", ["Vì Facebook cấm", "Vì mỗi giai đoạn khách có câu hỏi khác nhau, cần nội dung và kênh khác nhau", "Vì tốn tiền in ấn", "Không có lý do, dùng chung cũng được"], 1, "Awareness cần gây chú ý; Consideration cần review, so sánh; Conversion cần giá, ưu đãi, CTA rõ."],
    ["m03", "Vì sao không nên xây persona bằng cách đoán?", ["Vì mất thời gian", "Vì dễ nhắm sai đối tượng và nội dung không chạm đúng nỗi đau thật", "Vì Facebook không cho phép", "Vì persona không quan trọng"], 1, "Persona phải dựa trên dữ liệu thật: khách cũ, bình luận, tin nhắn, Group, khảo sát."],
    ["m03", "Nguồn dữ liệu MIỄN PHÍ nào tốt nhất để xây persona?", ["Mua danh sách số điện thoại", "Tin nhắn và bình luận của khách cũ", "Đoán theo cảm giác", "Copy persona của đối thủ"], 1, "Câu hỏi khách hay hỏi lặp lại chính là nỗi đau/rào cản thật."],
    ["m03", "Người mới nên bắt đầu với bao nhiêu persona?", ["1 persona chính", "5 persona", "10 persona", "Không cần persona"], 0, "Tập trung 1 nhóm khách chính trước cho dễ làm đúng, rồi mới mở rộng."],
    ["m03", "\"Pain point\" là gì?", ["Giá sản phẩm", "Nỗi đau hoặc rào cản khiến khách chưa mua", "Số lượng follower", "Chi phí quảng cáo"], 1, "Ví dụ: sợ hàng giả, sợ học không hiệu quả, không tin shop lạ."],
    ["m04", "Khách chủ động tìm kiếm thông tin trước khi mua (vd: \"sửa máy lạnh quận 7\"). Kênh nào phù hợp nhất?", ["TikTok In-Feed", "Google Search", "Display Ads", "Facebook Group"], 1, "Google Search đón đúng lúc khách có nhu cầu rõ ràng."],
    ["m04", "Có nên có mặt trên tất cả nền tảng cùng lúc?", ["Có, càng nhiều càng tốt", "Không, nên chọn 2–3 kênh vừa sức", "Chỉ cần 1 kênh duy nhất mãi mãi", "Tuỳ màu logo"], 1, "Dàn trải nguồn lực là lỗi phổ biến của người mới."],
    ["m04", "Sản phẩm trực quan (thời trang, mỹ phẩm, ẩm thực), khách trẻ. Kênh nào thường hợp nhất?", ["TikTok (video ngắn, livestream, TikTok Shop)", "Google Display", "Email B2B", "Báo in"], 0, "TikTok mạnh về video ngắn, thuật toán ưu tiên nội dung hay, có TikTok Shop mua ngay."],
    ["m04", "Vì sao khách hay vào Shopee/TikTok Shop dù đã biết sản phẩm từ kênh khác?", ["Để so giá và xem review, tin vào hạ tầng thanh toán/vận chuyển của sàn", "Vì sàn luôn rẻ hơn 50%", "Vì không có kênh nào khác", "Vì bắt buộc"], 0, "Sàn có uy tín, review, ship, thanh toán, nên là nơi khách so giá và chốt."],
    ["m05", "Trong Meta Ads, tầng nào là nơi cài đối tượng, ngân sách và vị trí hiển thị?", ["Campaign", "Ad Set", "Ad", "Page"], 1, "Campaign = mục tiêu; Ad Set = đối tượng, ngân sách, lịch, vị trí; Ad = nội dung."],
    ["m05", "Muốn quảng cáo lại cho người từng nhắn tin hoặc xem video của bạn. Dùng loại đối tượng nào?", ["Core Audience", "Custom Audience", "Lookalike Audience", "Broad"], 1, "Custom Audience dùng để retarget người đã tương tác."],
    ["m05", "Lookalike Audience là gì?", ["Người đã mua hàng", "Người có đặc điểm giống khách hàng cũ, do Facebook tự tìm", "Người ở cùng thành phố", "Bạn bè của admin"], 1, "Cần có nguồn (danh sách khách, người tương tác) để Facebook tìm người tương tự."],
    ["m05", "Người mới nên chọn kiểu ngân sách nào cho dễ kiểm soát?", ["Ngân sách trọn đời rất lớn", "Daily budget (ngân sách mỗi ngày) cố định", "Không đặt ngân sách", "Tăng gấp đôi mỗi ngày"], 1, "Daily budget giúp kiểm soát chi tiêu và dễ so sánh."],
    ["m05", "Công thức nội dung quảng cáo đơn giản gồm những gì?", ["Hook → Giá trị → Bằng chứng → CTA rõ", "Logo → Logo → Logo", "Giá → Giá → Giá", "Chỉ cần ảnh đẹp"], 0, "Gây chú ý 3 giây đầu, nói rõ lợi ích, có review thật, kêu gọi hành động cụ thể."],
    ["m05", "CTA nào RÕ RÀNG nhất cho shop muốn chốt đơn qua Zalo?", ["Tìm hiểu thêm", "Nhắn Zalo ngay để nhận giá", "Xem thêm", "Like page"], 1, "CTA cụ thể giúp khách biết phải làm gì tiếp theo."],
    ["m06", "Spark Ads trên TikTok là gì?", ["Banner trên website", "Biến video TikTok tự nhiên (của mình hoặc KOC/KOL) thành quảng cáo", "Quảng cáo trên Google", "Tin nhắn hàng loạt"], 1, "Spark Ads giữ được lượt tương tác và cảm giác tự nhiên của video gốc."],
    ["m06", "Điểm khác cốt lõi giữa Google Search Ads và Facebook Ads?", ["Google Search đón đầu nhu cầu khi khách chủ động tìm; Facebook xen vào khi khách không tìm", "Không khác gì", "Facebook chỉ cho video", "Google không tính tiền"], 0, "Intent-based (Google Search) vs interruption (mạng xã hội)."],
    ["m06", "Từ khoá nào là từ khoá \"sẵn sàng mua\"?", ["máy lọc nước là gì", "lịch sử máy lọc nước", "mua máy lọc nước lắp tại nhà quận 3", "máy lọc nước hoạt động thế nào"], 2, "Có chữ \"mua\" + địa điểm = ý định mua rõ. Chi phí thường cao hơn nhưng chuyển đổi tốt hơn."],
    ["m06", "Shop bán khoá học trả phí, quảng cáo Google cứ hiện khi người ta gõ \"khoá học miễn phí\". Nên làm gì?", ["Tăng ngân sách", "Thêm \"miễn phí\" làm negative keyword", "Đổi màu quảng cáo", "Tắt Google Ads vĩnh viễn"], 1, "Negative keyword chặn những lượt tìm kiếm không phù hợp, đỡ tốn tiền."],
    ["m06", "Khi nào nên ưu tiên Zalo Ads?", ["Khi dịch vụ cần tư vấn 1-1 và muốn khách vào thẳng Zalo OA/chat", "Khi bán hàng cho khách nước ngoài", "Khi chỉ muốn tăng view YouTube", "Không bao giờ"], 0, "Zalo rút ngắn khoảng cách từ quảng cáo đến cuộc trò chuyện chốt đơn."],
    ["m07", "Vì sao SEO đáng làm dù ngân sách nhỏ?", ["Vì miễn phí click và bền vững lâu dài, một bài tốt mang khách nhiều tháng", "Vì lên top ngay ngày đầu", "Vì Google trả tiền cho bạn", "Vì không cần nội dung"], 0, "SEO chậm nhưng bền: không trả tiền theo click."],
    ["m07", "Từ khoá chính nên xuất hiện ở đâu đầu tiên?", ["Chân trang", "Tiêu đề bài viết (H1)", "Tên file ảnh duy nhất", "Không cần xuất hiện"], 1, "Tiêu đề chứa từ khoá giúp Google và người đọc hiểu bài nói về gì."],
    ["m07", "Meta description dùng để làm gì?", ["Tăng tốc độ trang", "Đoạn mô tả dưới tiêu đề trên Google, viết hấp dẫn để khách muốn click", "Chặn Google", "Lưu mật khẩu"], 1, "Nó ảnh hưởng tỉ lệ click từ kết quả tìm kiếm."],
    ["m07", "Content pillar là gì?", ["Bài viết ngẫu hứng", "Bài trụ cột về chủ đề lớn, liên kết tới nhiều bài vệ tinh chi tiết", "Bài quảng cáo trả tiền", "Bài chỉ có hình"], 1, "Vd: trụ cột \"Chuyển nhà trọn gói A-Z\", vệ tinh \"Chi phí chuyển nhà TP.HCM\"."],
    ["m07", "Phần lớn người Việt tìm kiếm bằng gì, nên website cần ưu tiên điều gì?", ["Máy tính bàn, cần màn hình lớn", "Điện thoại, cần hiển thị tốt trên di động (mobile-friendly)", "TV, cần chữ to", "Không quan trọng"], 1, "Trang không hợp điện thoại thì khách thoát ngay."],
    ["m08", "Vì sao organic vẫn quan trọng dù đã chạy ads?", ["Vì khách sẽ vào Page/Group xem review, bài cũ để kiểm tra độ tin cậy trước khi mua", "Vì ads luôn thất bại", "Vì organic miễn thuế", "Không quan trọng"], 0, "Page trống trơn làm khách nghi ngờ, quảng cáo kém hiệu quả."],
    ["m08", "Facebook Group khác Page ở điểm nào?", ["Group tương tác 2 chiều mạnh hơn, hợp xây cộng đồng", "Group không có thành viên", "Page không đăng bài được", "Giống hệt nhau"], 0, "Page là bộ mặt chính thức; Group là nơi cộng đồng trao đổi, review."],
    ["m08", "Tài khoản TikTok mới, ít follower, có lên xu hướng được không?", ["Không bao giờ", "Có, vì thuật toán ưu tiên nội dung hay hơn số follower", "Chỉ khi trả tiền", "Chỉ khi có tick xanh"], 1, "Đây là điểm khác biệt lớn của TikTok so với các nền tảng khác."],
    ["m08", "Lịch nội dung (content calendar) giúp gì?", ["Đăng bài đều đặn, có kế hoạch theo mục tiêu, không đăng ngẫu hứng", "Tăng giá sản phẩm", "Thay thế quảng cáo hoàn toàn", "Không giúp gì"], 0, "Đều đặn + có chủ đích theo funnel."],
    ["m09", "CTR được tính thế nào?", ["Doanh thu ÷ chi phí", "Số click ÷ lượt hiển thị", "Chi phí ÷ số click", "Số đơn ÷ số click"], 1, "CTR đo nội dung có hấp dẫn không."],
    ["m09", "Chi 2.000.000đ quảng cáo, thu về 8.000.000đ doanh thu. ROAS là bao nhiêu?", ["0,25", "4", "6", "10"], 1, "ROAS = 8.000.000 ÷ 2.000.000 = 4 (mỗi 1đ quảng cáo mang về 4đ doanh thu)."],
    ["m09", "Chi 1.500.000đ, có 30 tin nhắn hỏi mua. Chi phí mỗi tin nhắn (CPA) là bao nhiêu?", ["30.000đ", "50.000đ", "45.000đ", "150.000đ"], 1, "1.500.000 ÷ 30 = 50.000đ/tin nhắn."],
    ["m09", "UTM dùng để làm gì?", ["Tăng tốc website", "Biết khách đến từ kênh/chiến dịch nào khi chạy nhiều kênh", "Chặn spam", "Tạo mã giảm giá"], 1, "Gắn utm_source, utm_medium, utm_campaign vào link để GA4 phân loại nguồn."],
    ["m09", "Mục tiêu chính là doanh số. KPI nào nên nhìn ĐẦU TIÊN?", ["Số like", "ROAS / CPA mua hàng", "Số follower", "Lượt hiển thị"], 1, "Chọn KPI theo mục tiêu, không nhìn tất cả cùng lúc."],
    ["m09", "Vì sao không nên đánh giá quảng cáo chỉ dựa trên số liệu 1 ngày?", ["Vì số liệu 1 ngày dao động nhiều, nên xem theo tuần/7 ngày", "Vì 1 ngày không có số liệu", "Vì Facebook cấm", "Không có lý do"], 0, "Nhìn xu hướng theo thời gian mới đáng tin."],
    ["m09", "Trong GA4, báo cáo nào cho biết khách đến website từ đâu?", ["Traffic acquisition", "Engagement rate", "Page speed", "Meta description"], 0, "Traffic acquisition chia theo organic search, paid social, direct, referral…"],
    ["m10", "Khi A/B test hai quảng cáo, nên thay đổi bao nhiêu yếu tố?", ["Thay hết mọi thứ", "Chỉ 1 yếu tố (vd: hình hoặc tiêu đề)", "Không thay gì", "3 yếu tố"], 1, "Đổi 1 yếu tố mới biết chính xác cái gì tạo ra khác biệt."],
    ["m10", "Thứ tự đúng của vòng tối ưu liên tục?", ["Test → Đo → Học → Lặp lại", "Lặp lại → Test → Đo → Học", "Đo → Test → Lặp lại → Học", "Học → Lặp lại → Đo → Test"], 0, "Chạy nhỏ, đo đúng KPI, rút bài học, nhân rộng phần tốt."],
    ["m10", "Quảng cáo mới chạy 1 ngày, CPA hơi cao. Nên làm gì?", ["Tắt ngay", "Chờ đủ dữ liệu (thường vài ngày) rồi mới đánh giá, tránh sửa liên tục", "Tăng ngân sách gấp 5", "Đổi hết đối tượng mỗi giờ"], 1, "Thay đổi liên tục làm máy quảng cáo phải học lại từ đầu."],
    ["m10", "Khi nào nên \"scale\" (tăng ngân sách)?", ["Khi nội dung/đối tượng đã ổn định đạt KPI một thời gian", "Ngay ngày đầu", "Khi CPA tăng mạnh", "Khi chưa có dữ liệu"], 0, "Nhân rộng phần đã chứng minh hiệu quả, tăng từ từ."]
  ];

  var lessons = L.map(function (l) { return { id: l[0], part: l[1], title: l[2], file: l[3], vocabCount: (V[l[0]] || []).length, quizCount: Q.filter(function (q) { return q[0] === l[0]; }).length }; });
  var vocab = [];
  Object.keys(V).forEach(function (id) { V[id].forEach(function (x) { vocab.push({ en: x[0], vi: x[1], kind: "term", lesson: id, section: title[id] }); }); });
  var questions = Q.map(function (q) { return { q: q[1], opts: q[2], a: q[3], exp: q[4], lesson: q[0], section: title[q[0]] }; });
  window.QUEST_LESSONS = { lessons: lessons, vocab: vocab, questions: questions };
})();
