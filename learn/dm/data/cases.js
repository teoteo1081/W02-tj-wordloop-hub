// Tình huống "Bàn tiếp khách" cho Digital Marketing — viết tay, dễ → khó.
// Cấu trúc giống game EA:
//   docs     : dữ liệu/tài liệu cần xin chủ shop (must / maybe / no)
//   legal    : giải thích bằng NGÔN NGỮ CHUYÊN MÔN (tiếng Anh, kiểu marketer nói với nhau / báo cáo)
//   plain    : giải thích bằng NGÔN NGỮ CỦA CHỦ SHOP (tiếng Việt dễ hiểu)
//   critical : câu hỏi bẫy 60 giây
window.QUEST_CASES = [
  {
    id: "d01", part: 1, emoji: "☕", title: "Quán cà phê mở bán online",
    client: "Chị Thu, chủ quán cà phê nhỏ ở Quận 3",
    story: "Chị Thu muốn bán thêm online. Chị nói: 'Em chạy quảng cáo Facebook giùm chị đi, càng nhiều người thấy càng tốt'. Quán chưa có Fanpage tử tế, chưa có Zalo OA, menu chỉ là tấm ảnh chụp.",
    quote: "Just run some Facebook ads for me. More people, more sales, right?",
    focus: "Danh sách đơn hàng và câu hỏi của khách cũ",
    docs: [
      { name: "10–20 đơn hàng gần nhất (ai mua, giờ nào, món gì)", need: "must", why: "Dữ liệu thật để xây persona và chọn giờ chạy quảng cáo, không đoán mò." },
      { name: "Những câu khách hay hỏi qua tin nhắn/bình luận", need: "must", why: "Đây là nỗi đau và rào cản thật của khách, dùng làm nội dung quảng cáo và trả lời sẵn." },
      { name: "Menu có giá rõ ràng, phí ship, khu vực giao", need: "must", why: "Giai đoạn Conversion cần thông tin rõ. Thiếu thì khách click xong lại bỏ đi." },
      { name: "Ngân sách quảng cáo mỗi tháng chị chịu được", need: "must", why: "Để chọn kênh và mức daily budget phù hợp, test nhỏ trước." },
      { name: "Hình/video pha chế, không gian quán", need: "maybe", why: "Rất tốt cho nội dung Awareness (TikTok, Reels). Không có thì quay mới." },
      { name: "Mật khẩu tài khoản Facebook cá nhân của chị", need: "no", why: "Không bao giờ xin mật khẩu. Hãy cấp quyền qua Business Manager / quyền quản trị Page." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN vì sao chưa nên chạy ads ngay:",
      options: [
        "Before scaling paid reach, we need to fix the bottom of the funnel. Without a clear offer, pricing and a conversion path such as a Zalo OA or order link, top-of-funnel traffic will drop off and CPA will be high.",
        "Facebook ads always work, so we should spend the whole budget on day one.",
        "Reach is the only KPI that matters for a coffee shop."
      ],
      a: 0,
      exp: "Funnel trước, kênh sau. Kéo người vào khi khâu chốt đơn chưa sẵn sàng thì tốn tiền mà ít đơn."
    },
    plain: {
      q: "Chọn cách nói với chị Thu bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Chạy quảng cáo giống như mời người ta tới quán. Nhưng nếu tới nơi mà không có menu giá rõ, không biết nhắn đặt ở đâu, thì khách quay về và mình mất tiền mời. Mình sửa chỗ đặt hàng trước, rồi chạy thử ít tiền, thấy hiệu quả mới tăng.",
        "Chị cần tối ưu BOFU và conversion path trước khi scale reach.",
        "Dạ được chị, em chạy luôn 10 triệu hôm nay."
      ],
      a: 0,
      exp: "Ví dụ 'mời khách tới quán' giúp chủ shop hiểu funnel mà không cần thuật ngữ."
    },
    critical: {
      q: "Quán chỉ giao trong bán kính 3km. Cài đặt nào QUAN TRỌNG nhất khi chạy quảng cáo?",
      options: ["Nhắm toàn quốc cho nhiều người thấy", "Giới hạn vị trí quanh quán (khoảng 3km)", "Chỉ nhắm theo sở thích cà phê", "Nhắm khách nước ngoài"],
      a: 1,
      exp: "Người ở xa thấy quảng cáo cũng không đặt được, tiền bị lãng phí. Vị trí là bộ lọc đầu tiên."
    },
    scriptEn: "Before we spend money on ads, let's make it easy for customers to order. We need a clear menu with prices and one place to message us. Then we test with a small budget."
  },
  {
    id: "d02", part: 1, emoji: "🎓", title: "Trung tâm tiếng Anh cần persona",
    client: "Anh Quân, chủ trung tâm tiếng Anh online cho người đi làm",
    story: "Anh Quân chạy quảng cáo nhắm 'nam nữ 18–65, thích tiếng Anh'. Nhiều người nhắn nhưng toàn học sinh hỏi học phí rồi im lặng. Khoá học của anh dành cho nhân viên văn phòng.",
    quote: "We get many messages, but almost nobody signs up. What is wrong?",
    focus: "Hồ sơ học viên đã đăng ký (persona thật)",
    docs: [
      { name: "Thông tin học viên đã đăng ký: tuổi, nghề, lý do học", need: "must", why: "Khách đã mua là dữ liệu tốt nhất để vẽ persona đúng." },
      { name: "Lịch sử tin nhắn của người hỏi rồi không đăng ký", need: "must", why: "Cho thấy rào cản: giá, thời gian, sợ học không hiệu quả…" },
      { name: "Cài đặt đối tượng quảng cáo hiện tại", need: "must", why: "Để thấy chỗ nhắm quá rộng (18–65) gây lãng phí." },
      { name: "Feedback/before-after của học viên cũ", need: "maybe", why: "Bằng chứng xã hội rất mạnh cho persona 'đã từng học bỏ dở'." },
      { name: "Danh sách số điện thoại mua từ bên ngoài", need: "no", why: "Không dùng dữ liệu mua bán: sai đối tượng, rủi ro pháp lý và uy tín." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "The targeting is too broad and not based on a real buyer persona. We should build one primary persona from existing customer data (office workers, 28–35, career-driven pain points) and align targeting, creative and offer to it.",
        "Broad targeting is always the best because the algorithm knows everything.",
        "We should create ten personas at once to cover everyone."
      ],
      a: 0,
      exp: "Persona từ dữ liệu thật, bắt đầu với 1 persona chính, rồi nhắm và viết nội dung theo đúng persona đó."
    },
    plain: {
      q: "Chọn cách nói với anh Quân bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Quảng cáo đang gửi tới quá nhiều kiểu người, nên học sinh nhắn hỏi nhiều mà không phải khách của anh. Mình nhìn lại những người đã đăng ký thật, vẽ ra chân dung 'chị nhân viên văn phòng muốn lên lương', rồi nói đúng nỗi lo của họ. Ít tin nhắn hơn nhưng đăng ký nhiều hơn.",
        "Anh cần refine targeting theo persona-led segmentation.",
        "Anh tăng ngân sách là sẽ có người đăng ký."
      ],
      a: 0,
      exp: "Nói rõ nguyên nhân (nhắm sai người) và kết quả mong đợi (ít tin rác, nhiều đăng ký)."
    },
    critical: {
      q: "Tin nhắn giảm 40% sau khi nhắm đúng persona, nhưng số đăng ký tăng gấp đôi. Đánh giá thế nào?",
      options: ["Tệ hơn vì tin nhắn giảm", "Tốt hơn, vì KPI chính là đăng ký (CPA đăng ký giảm)", "Không so sánh được", "Phải quay lại nhắm rộng"],
      a: 1,
      exp: "Nhìn KPI theo mục tiêu (đăng ký), không nhìn chỉ số phụ (tin nhắn)."
    },
    scriptEn: "Your ads reach too many different people. Let's focus on the people who actually buy: office workers who want a better job. Fewer messages, but more sign-ups."
  },
  {
    id: "d03", part: 1, emoji: "🧴", title: "Mỹ phẩm handmade chọn kênh",
    client: "Chị Mỹ, bán son và kem dưỡng handmade, 1 mình làm hết",
    story: "Chị Mỹ đang cố đăng bài mỗi ngày trên Facebook, Instagram, TikTok, YouTube, Shopee, Lazada, Zalo, website… Chị kiệt sức mà doanh số không tăng.",
    quote: "I post everywhere every day, but my sales are not growing. I am so tired.",
    focus: "Nguồn của các đơn hàng hiện có",
    docs: [
      { name: "Đơn hàng 2–3 tháng qua đến từ kênh nào", need: "must", why: "Biết kênh nào đang ra đơn để tập trung vào đó." },
      { name: "Thời gian chị bỏ ra cho từng kênh mỗi tuần", need: "must", why: "So công sức với kết quả để cắt bớt kênh kém." },
      { name: "Chân dung khách mua (tuổi, hay xem nền tảng nào)", need: "must", why: "Chọn kênh theo nơi khách thật sự ở." },
      { name: "Giấy phép công bố mỹ phẩm", need: "maybe", why: "Cần khi chạy quảng cáo hoặc lên sàn (nhiều nền tảng yêu cầu), và tạo niềm tin." },
      { name: "Số follower của đối thủ lớn", need: "no", why: "Không giúp chọn kênh cho chị lúc này." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "Spreading limited resources across too many channels dilutes results. We should pick a focused channel mix of two or three platforms based on where the persona is and which channels already drive orders, for example TikTok for awareness, Shopee for conversion and Zalo for retention.",
        "Being on every platform maximizes reach, so keep posting everywhere.",
        "Only paid search matters for cosmetics."
      ],
      a: 0,
      exp: "Chọn 2–3 kênh vừa sức, mỗi kênh một vai trò trong funnel."
    },
    plain: {
      q: "Chọn cách nói với chị Mỹ bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Chị đang chia sức mình cho 8 nơi nên nơi nào cũng làm chưa tới. Mình giữ 2–3 nơi đang ra đơn nhiều nhất và làm thật đều: TikTok để nhiều người biết, Shopee để khách mua, Zalo để chăm khách cũ. Đỡ mệt mà đơn tập trung hơn.",
        "Chị nên optimize channel mix và de-prioritize low-ROI platforms.",
        "Chị đăng thêm cả Pinterest và Twitter nữa cho đủ."
      ],
      a: 0,
      exp: "Dễ hiểu, giảm áp lực cho chủ shop và có kế hoạch cụ thể."
    },
    critical: {
      q: "Dữ liệu cho thấy 70% đơn đến từ TikTok, YouTube gần như 0 đơn nhưng tốn 6 giờ/tuần. Nên làm gì?",
      options: ["Bỏ TikTok, dồn sức cho YouTube", "Tạm dừng YouTube, dồn thời gian cho TikTok và kênh chốt đơn", "Giữ nguyên tất cả", "Mua quảng cáo YouTube thật nhiều"],
      a: 1,
      exp: "Dồn nguồn lực vào kênh đã chứng minh hiệu quả; kênh tốn sức mà không ra kết quả thì tạm dừng."
    },
    scriptEn: "You don't need to be everywhere. Let's focus on two or three channels where your customers really are. You will save time and get more orders."
  },
  {
    id: "d04", part: 2, emoji: "👗", title: "Quảng cáo Facebook nhiều click ít đơn",
    client: "Chị Ngân, shop thời trang công sở",
    story: "Quảng cáo Facebook của chị có CTR 3,5% (rất tốt) và CPC rẻ, nhưng 2 tuần chỉ được 4 đơn. Quảng cáo dẫn về website. Chị nghĩ 'chắc Facebook hết linh'.",
    quote: "My ads get lots of clicks, but almost no orders. Is Facebook broken?",
    focus: "Trang đích (landing page) trên điện thoại",
    docs: [
      { name: "Link trang đích mà quảng cáo đang trỏ tới", need: "must", why: "Click tốt mà không có đơn thì vấn đề thường nằm ở trang sau click." },
      { name: "Báo cáo Ads Manager (CTR, CPC, số người bấm mua)", need: "must", why: "Để xác định đúng chỗ rớt trong phễu." },
      { name: "Dữ liệu GA4: tỉ lệ thoát/engagement trên điện thoại", need: "must", why: "Xem khách có ở lại trang không, nhất là trên di động." },
      { name: "Pixel/sự kiện mua hàng đã cài chưa", need: "maybe", why: "Có Pixel thì đo được khách bỏ giỏ ở bước nào và tối ưu theo mua hàng." },
      { name: "Hoá đơn tiền điện của shop", need: "no", why: "Không liên quan đến hiệu quả quảng cáo." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "A high CTR with a very low conversion rate points to a post-click problem. We should audit the landing page experience, especially mobile load speed, pricing clarity, size information and the checkout or chat CTA.",
        "The CTR is high, so the campaign is successful and needs no changes.",
        "The Facebook algorithm is broken; we should stop all advertising."
      ],
      a: 0,
      exp: "CTR đo sức hút của quảng cáo; conversion rate đo trang đích. Rớt sau click → sửa trang đích."
    },
    plain: {
      q: "Chọn cách nói với chị Ngân bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Quảng cáo của chị làm tốt phần 'kéo khách vào cửa'. Nhưng vào tới nơi khách lại đi ra, nghĩa là trong 'cửa hàng' có gì đó làm khách ngại: trang tải chậm trên điện thoại, không thấy giá, không có bảng size, hay khó bấm mua. Mình sửa trang trước, chưa cần đổi quảng cáo.",
        "Facebook hết linh rồi chị, mình bỏ đi.",
        "Chị cần CRO cho landing page để cải thiện CVR."
      ],
      a: 0,
      exp: "Hình ảnh 'kéo khách vào cửa' giúp chủ shop thấy vấn đề nằm ở trang chứ không phải quảng cáo."
    },
    critical: {
      q: "Mở trang trên điện thoại mất 9 giây mới hiện, ảnh rất nặng. Ưu tiên làm gì trước?",
      options: ["Tăng ngân sách quảng cáo", "Giảm dung lượng ảnh, tăng tốc trang trên di động", "Đổi hình quảng cáo", "Thêm 20 sản phẩm"],
      a: 1,
      exp: "Đa số khách vào bằng điện thoại; trang chậm là khách thoát trước khi thấy sản phẩm."
    },
    scriptEn: "Your ads are working well, because many people click. The problem is after the click. Let's make your website faster on phones and show the price and sizes clearly."
  },
  {
    id: "d05", part: 2, emoji: "🔧", title: "Dịch vụ sửa điện lạnh và Google Ads",
    client: "Anh Tài, dịch vụ sửa máy lạnh, tủ lạnh tại nhà",
    story: "Anh Tài chạy Google Search Ads với từ khoá 'máy lạnh'. Tiền hết rất nhanh, nhiều cuộc gọi hỏi mua máy lạnh mới hoặc hỏi lương thợ.",
    quote: "My Google ads spend money fast, but the calls are not about repairs.",
    focus: "Báo cáo từ khoá khách đã tìm (search terms)",
    docs: [
      { name: "Báo cáo các cụm từ khách đã tìm (search terms report)", need: "must", why: "Thấy chính xác khách gõ gì mà quảng cáo hiện ra, để lọc từ không liên quan." },
      { name: "Danh sách từ khoá đang chạy và kiểu đối sánh", need: "must", why: "'máy lạnh' quá rộng, kéo cả người muốn mua máy, tìm việc…" },
      { name: "Khu vực anh phục vụ được", need: "must", why: "Giới hạn vị trí để không trả tiền cho cuộc gọi ở xa." },
      { name: "Giờ làm việc nhận cuộc gọi", need: "maybe", why: "Có thể chỉ chạy quảng cáo gọi điện trong giờ có người nghe máy." },
      { name: "Lượt thích Fanpage", need: "no", why: "Không liên quan hiệu quả Google Search Ads." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "The keyword 'máy lạnh' is too broad and matches non-buying intents. We should switch to high-intent keywords such as 'sửa máy lạnh tại nhà quận 7', add negative keywords like 'mua', 'giá máy mới', 'tuyển thợ', and apply location targeting.",
        "Broad keywords are always cheaper and better.",
        "We should move all budget to Display Ads."
      ],
      a: 0,
      exp: "Từ khoá ý định rõ + negative keyword + giới hạn vị trí = ít lãng phí."
    },
    plain: {
      q: "Chọn cách nói với anh Tài bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Hiện quảng cáo hiện ra cho mọi ai gõ chữ 'máy lạnh', kể cả người muốn mua máy mới hay đi tìm việc, nên anh trả tiền cho những cuộc gọi không ra tiền. Mình đổi sang chữ cụ thể như 'sửa máy lạnh tại nhà quận 7', và chặn các chữ như 'mua', 'tuyển thợ'. Ít cuộc gọi rác, tiền đi đúng chỗ.",
        "Anh cần thêm negative keywords và chuyển sang phrase match.",
        "Anh tăng ngân sách gấp đôi là ổn."
      ],
      a: 0,
      exp: "Giải thích bằng ví dụ chữ khách gõ, rất dễ hình dung."
    },
    critical: {
      q: "Từ khoá nào nên thêm làm negative keyword cho dịch vụ SỬA máy lạnh?",
      options: ["sửa", "tại nhà", "tuyển dụng", "quận 7"],
      a: 2,
      exp: "'tuyển dụng' là người tìm việc, không phải khách cần sửa. Ba từ còn lại là đúng ý định."
    },
    scriptEn: "Your ads show up for anyone who searches for air conditioners, even job seekers. Let's use specific repair keywords and block unrelated words, so you only pay for real customers."
  },
  {
    id: "d06", part: 2, emoji: "🍰", title: "Tiệm bánh với TikTok và KOC",
    client: "Chị Hạnh, tiệm bánh kem online",
    story: "Một khách quen (KOC) quay video review bánh của chị Hạnh, được 300.000 lượt xem tự nhiên. Chị muốn tận dụng nhưng không biết làm sao. Chị định thuê KOL nổi tiếng 50 triệu cho 1 video.",
    quote: "A customer's video about my cake went viral. How can I use it?",
    focus: "Sự đồng ý của KOC và quyền dùng video",
    docs: [
      { name: "Link video gốc và sự đồng ý/uỷ quyền của KOC", need: "must", why: "Spark Ads cần mã uỷ quyền từ chủ video; dùng video người khác phải xin phép." },
      { name: "Số đơn/tin nhắn tăng sau khi video viral", need: "must", why: "Đo xem video có thật sự ra đơn hay chỉ ra view." },
      { name: "Khu vực giao bánh và thời gian đặt trước", need: "must", why: "Bánh kem giao gần, cần đặt trước, phải nhắm đúng vị trí." },
      { name: "Báo giá KOL nổi tiếng", need: "maybe", why: "Chỉ để so sánh. Với tiệm nhỏ, nhiều KOC thật thường hiệu quả hơn 1 KOL đắt." },
      { name: "Số CMND của KOC", need: "no", why: "Không cần cho việc chạy Spark Ads." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "We can amplify the organic KOC video with TikTok Spark Ads using the creator's authorization code. It keeps the authentic social proof and engagement, and lets us target a local radius, which is usually more cost-effective than a single expensive KOL post.",
        "We must re-upload the video as a new ad and remove all comments.",
        "Only celebrities can make TikTok ads effective."
      ],
      a: 0,
      exp: "Spark Ads giữ video gốc + bằng chứng xã hội thật; nhắm vị trí phù hợp tiệm bánh."
    },
    plain: {
      q: "Chọn cách nói với chị Hạnh bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Video khách quay khen bánh chị là 'lời khen thật' nên người xem rất tin. Mình xin phép bạn đó rồi trả tiền để TikTok đẩy chính video này tới nhiều người ở gần tiệm hơn. Cách này rẻ hơn nhiều so với thuê người nổi tiếng 50 triệu, mà khách lại tin hơn.",
        "Chị chạy Spark Ads với authorization code và geo-targeting.",
        "Chị cứ tải video về rồi đăng lại, không cần hỏi ai."
      ],
      a: 0,
      exp: "Nói rõ lợi ích (khách tin, rẻ hơn) và nhắc phải xin phép."
    },
    critical: {
      q: "Video có 300.000 view nhưng 80% người xem ở tỉnh khác, tiệm chỉ giao trong TP.HCM. Khi đẩy quảng cáo nên làm gì?",
      options: ["Nhắm toàn quốc để giữ đà viral", "Nhắm vị trí TP.HCM (khu vực giao được)", "Không chạy quảng cáo", "Chỉ nhắm nước ngoài"],
      a: 1,
      exp: "View ở nơi không giao được không ra đơn; trả tiền thì phải nhắm nơi bán được."
    },
    scriptEn: "This customer's video feels real, so people trust it. With the creator's permission, we can boost it to people near your bakery. It is cheaper than hiring a famous influencer."
  },
  {
    id: "d07", part: 3, emoji: "📊", title: "Không biết đơn đến từ kênh nào",
    client: "Anh Khải, bán đồ gia dụng qua website",
    story: "Anh chạy cùng lúc Facebook, Zalo, TikTok và Google, tất cả trỏ về website. Cuối tháng anh không biết kênh nào ra đơn, định cắt bừa Google vì 'thấy đắt'.",
    quote: "I run ads on four platforms, but I don't know which one brings sales.",
    focus: "Link quảng cáo có gắn UTM",
    docs: [
      { name: "Toàn bộ link đang dùng trong quảng cáo các kênh", need: "must", why: "Kiểm tra đã gắn UTM chưa. Thiếu UTM thì GA4 không tách nguồn được." },
      { name: "Quyền xem GA4 của website", need: "must", why: "Đọc báo cáo Traffic acquisition và chuyển đổi theo nguồn." },
      { name: "Chi phí từng kênh trong tháng", need: "must", why: "Để tính CPA/ROAS từng kênh, không chỉ nhìn 'đắt hay rẻ' theo cảm giác." },
      { name: "Sự kiện chuyển đổi (mua hàng) đã cài trong GA4 chưa", need: "maybe", why: "Không có sự kiện mua thì chỉ biết lượt vào, không biết đơn." },
      { name: "Ảnh chụp màn hình bài viết nhiều like nhất", need: "no", why: "Like không cho biết kênh nào ra đơn." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "We need consistent UTM tagging (utm_source, utm_medium, utm_campaign) on every ad link and conversion events in GA4, so we can attribute orders by channel and compare CPA and ROAS instead of cutting a channel based on CPC alone.",
        "GA4 can always detect the source automatically, so UTMs are unnecessary.",
        "The most expensive channel should always be cut first."
      ],
      a: 0,
      exp: "UTM + sự kiện chuyển đổi → so sánh kênh theo CPA/ROAS. Kênh 'đắt' theo click có thể lại rẻ nhất theo đơn."
    },
    plain: {
      q: "Chọn cách nói với anh Khải bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Mình gắn cho mỗi link quảng cáo một 'mã nhận diện' nhỏ ở cuối, giống ghi tên người giới thiệu. Khi có đơn, công cụ đo sẽ biết khách tới từ Facebook, Zalo, TikTok hay Google. Lúc đó mình mới biết kênh nào đáng tiền thật, chứ Google click đắt nhưng có khi ra đơn rẻ nhất.",
        "Anh cần implement UTM tracking và attribution trong GA4.",
        "Anh cắt Google đi cho nhẹ."
      ],
      a: 0,
      exp: "So sánh với 'ghi tên người giới thiệu' giúp chủ shop hiểu UTM ngay."
    },
    critical: {
      q: "Sau khi gắn UTM: Google tốn 6 triệu ra 40 đơn; Facebook tốn 4 triệu ra 10 đơn. Kênh nào có CPA tốt hơn?",
      options: ["Facebook (400.000đ/đơn)", "Google (150.000đ/đơn)", "Bằng nhau", "Không tính được"],
      a: 1,
      exp: "Google: 6.000.000 ÷ 40 = 150.000đ/đơn. Facebook: 4.000.000 ÷ 10 = 400.000đ/đơn. Kênh 'đắt' lại hiệu quả hơn!"
    },
    scriptEn: "Let's add a small tracking code to every ad link. Then we can see which platform brings real orders, not just clicks, and spend more on the best one."
  },
  {
    id: "d08", part: 3, emoji: "🧪", title: "Tối ưu và A/B test",
    client: "Chị Duyên, bán nến thơm, đã có quảng cáo ổn định",
    story: "Quảng cáo của chị Duyên đang có CPA ổn. Chị muốn tăng doanh số nên đổi cùng lúc hình, tiêu đề, giá và đối tượng; mỗi ngày lại sửa một lần. Kết quả lên xuống thất thường.",
    quote: "I change my ads every day, but the results go up and down. What should I do?",
    focus: "Lịch sử các lần chỉnh sửa và kết quả theo tuần",
    docs: [
      { name: "Nhật ký các lần chỉnh sửa (ngày nào đổi gì)", need: "must", why: "Để biết thay đổi nào gây ra kết quả nào." },
      { name: "Kết quả theo tuần (không chỉ từng ngày)", need: "must", why: "Số liệu từng ngày dao động; xu hướng tuần đáng tin hơn." },
      { name: "KPI chính chị muốn tăng (đơn, ROAS…)", need: "must", why: "Test phải đo bằng đúng một KPI chính." },
      { name: "Các mẫu hình/tiêu đề mới muốn thử", need: "maybe", why: "Dùng để lên kế hoạch test lần lượt từng yếu tố." },
      { name: "Số follower Instagram", need: "no", why: "Không phải KPI của bài test này." }
    ],
    legal: {
      q: "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      options: [
        "Frequent multi-variable edits reset the learning phase and make results impossible to attribute. We should run a proper A/B test with one variable at a time, keep the control running, wait for enough data, then scale the winner gradually.",
        "Changing everything daily speeds up optimization.",
        "A/B tests should change at least five variables to save time."
      ],
      a: 0,
      exp: "1 biến mỗi lần, có bản đối chứng, đủ dữ liệu, rồi mới nhân rộng từ từ."
    },
    plain: {
      q: "Chọn cách nói với chị Duyên bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      options: [
        "Mỗi lần chị sửa, máy quảng cáo phải học lại từ đầu, nên kết quả lên xuống. Đổi nhiều thứ một lúc thì cũng không biết cái nào làm tốt lên. Mình giữ bản đang chạy ổn, thử thêm 1 bản chỉ khác đúng cái hình, chờ khoảng 1 tuần. Bản nào thắng thì giữ, rồi mới thử tiếp tiêu đề.",
        "Chị cần A/B test single-variable và tránh reset learning phase.",
        "Chị cứ sửa mỗi ngày, kiểu gì cũng trúng."
      ],
      a: 0,
      exp: "Giải thích cả lý do (máy học lại, không biết nguyên nhân) và cách làm cụ thể."
    },
    critical: {
      q: "Bản A (hình cũ) và bản B (hình mới) chạy 7 ngày cùng đối tượng, cùng ngân sách: A có CPA 80.000đ, B có CPA 55.000đ, mỗi bản đều có hơn 50 đơn. Làm gì tiếp?",
      options: ["Giữ cả hai mãi mãi", "Chọn B, tăng ngân sách từ từ cho B rồi test yếu tố tiếp theo", "Chọn A vì quen", "Đổi luôn cả đối tượng và giá"],
      a: 1,
      exp: "Đủ dữ liệu, chỉ khác 1 yếu tố → B thắng. Nhân rộng từ từ rồi test tiếp yếu tố khác."
    },
    scriptEn: "When you change many things every day, we cannot learn what works. Let's test one change at a time, wait about a week, and then keep the winner."
  }
];
