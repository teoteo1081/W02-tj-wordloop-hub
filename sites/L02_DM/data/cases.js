// Tình huống "Bàn tiếp khách" cho Digital Marketing — viết tay, dễ → khó.
// Cấu trúc giống game EA:
//   docs     : dữ liệu/tài liệu cần xin chủ shop (must / maybe / no)
//   legal    : giải thích bằng NGÔN NGỮ CHUYÊN MÔN (tiếng Anh, kiểu marketer nói với nhau / báo cáo)
//   plain    : giải thích bằng NGÔN NGỮ CỦA CHỦ SHOP (tiếng Việt dễ hiểu)
//   critical : câu hỏi bẫy 60 giây
window.QUEST_CASES = [
  {
    "id": "d01",
    "part": 1,
    "emoji": "☕",
    "title": "Quán cà phê mở bán online",
    "client": "Chị Thu, chủ quán cà phê nhỏ ở Quận 3",
    "story": "Chị Thu muốn bán thêm online. Chị nói: 'Em chạy quảng cáo Facebook giùm chị đi, càng nhiều người thấy càng tốt'. Quán chưa có Fanpage tử tế, chưa có Zalo OA, menu chỉ là tấm ảnh chụp.",
    "quote": "Just run some Facebook ads for me. More people, more sales, right?",
    "focus": "Danh sách đơn hàng và câu hỏi của khách cũ",
    "docs": [
      {
        "name": "10–20 đơn hàng gần nhất (ai mua, giờ nào, món gì)",
        "need": "must",
        "why": "Dữ liệu thật để xây persona và chọn giờ chạy quảng cáo, không đoán mò."
      },
      {
        "name": "Những câu khách hay hỏi qua tin nhắn/bình luận",
        "need": "must",
        "why": "Đây là nỗi đau và rào cản thật của khách, dùng làm nội dung quảng cáo và trả lời sẵn."
      },
      {
        "name": "Menu có giá rõ ràng, phí ship, khu vực giao",
        "need": "must",
        "why": "Giai đoạn Conversion cần thông tin rõ. Thiếu thì khách click xong lại bỏ đi."
      },
      {
        "name": "Ngân sách quảng cáo mỗi tháng chị chịu được",
        "need": "must",
        "why": "Để chọn kênh và mức daily budget phù hợp, test nhỏ trước."
      },
      {
        "name": "Hình/video pha chế, không gian quán",
        "need": "maybe",
        "why": "Rất tốt cho nội dung Awareness (TikTok, Reels). Không có thì quay mới."
      },
      {
        "name": "Mật khẩu tài khoản Facebook cá nhân của chị",
        "need": "no",
        "why": "Không bao giờ xin mật khẩu. Hãy cấp quyền qua Business Manager / quyền quản trị Page."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN vì sao chưa nên chạy ads ngay:",
      "options": [
        "Before scaling paid reach, we need to fix the bottom of the funnel. Without a clear offer, pricing and a conversion path such as a Zalo OA or order link, top-of-funnel traffic will drop off and CPA will be high.",
        "Facebook ads always work, so we should spend the whole budget on day one.",
        "Reach is the only KPI that matters for a coffee shop."
      ],
      "a": 0,
      "exp": "Funnel trước, kênh sau. Kéo người vào khi khâu chốt đơn chưa sẵn sàng thì tốn tiền mà ít đơn."
    },
    "plain": {
      "q": "Chọn cách nói với chị Thu bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Chạy quảng cáo giống như mời người ta tới quán. Nhưng nếu tới nơi mà không có menu giá rõ, không biết nhắn đặt ở đâu, thì khách quay về và mình mất tiền mời. Mình sửa chỗ đặt hàng trước, rồi chạy thử ít tiền, thấy hiệu quả mới tăng.",
        "Chị cần tối ưu BOFU và conversion path trước khi scale reach.",
        "Dạ được chị, em chạy luôn 10 triệu hôm nay."
      ],
      "a": 0,
      "exp": "Ví dụ 'mời khách tới quán' giúp chủ shop hiểu funnel mà không cần thuật ngữ."
    },
    "critical": {
      "q": "Quán chỉ giao trong bán kính 3km. Cài đặt nào QUAN TRỌNG nhất khi chạy quảng cáo?",
      "options": [
        "Nhắm toàn quốc cho nhiều người thấy",
        "Giới hạn vị trí quanh quán (khoảng 3km)",
        "Chỉ nhắm theo sở thích cà phê",
        "Nhắm khách nước ngoài"
      ],
      "a": 1,
      "exp": "Người ở xa thấy quảng cáo cũng không đặt được, tiền bị lãng phí. Vị trí là bộ lọc đầu tiên."
    },
    "scriptEn": "Before we spend money on ads, let's make it easy for customers to order. We need a clear menu with prices and one place to message us. Then we test with a small budget."
  },
  {
    "id": "d02",
    "part": 1,
    "emoji": "🎓",
    "title": "Trung tâm tiếng Anh cần persona",
    "client": "Anh Quân, chủ trung tâm tiếng Anh online cho người đi làm",
    "story": "Anh Quân chạy quảng cáo nhắm 'nam nữ 18–65, thích tiếng Anh'. Nhiều người nhắn nhưng toàn học sinh hỏi học phí rồi im lặng. Khoá học của anh dành cho nhân viên văn phòng.",
    "quote": "We get many messages, but almost nobody signs up. What is wrong?",
    "focus": "Hồ sơ học viên đã đăng ký (persona thật)",
    "docs": [
      {
        "name": "Thông tin học viên đã đăng ký: tuổi, nghề, lý do học",
        "need": "must",
        "why": "Khách đã mua là dữ liệu tốt nhất để vẽ persona đúng."
      },
      {
        "name": "Lịch sử tin nhắn của người hỏi rồi không đăng ký",
        "need": "must",
        "why": "Cho thấy rào cản: giá, thời gian, sợ học không hiệu quả…"
      },
      {
        "name": "Cài đặt đối tượng quảng cáo hiện tại",
        "need": "must",
        "why": "Để thấy chỗ nhắm quá rộng (18–65) gây lãng phí."
      },
      {
        "name": "Feedback/before-after của học viên cũ",
        "need": "maybe",
        "why": "Bằng chứng xã hội rất mạnh cho persona 'đã từng học bỏ dở'."
      },
      {
        "name": "Danh sách số điện thoại mua từ bên ngoài",
        "need": "no",
        "why": "Không dùng dữ liệu mua bán: sai đối tượng, rủi ro pháp lý và uy tín."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "The targeting is too broad and not based on a real buyer persona. We should build one primary persona from existing customer data (office workers, 28–35, career-driven pain points) and align targeting, creative and offer to it.",
        "Broad targeting is always the best because the algorithm knows everything.",
        "We should create ten personas at once to cover everyone."
      ],
      "a": 0,
      "exp": "Persona từ dữ liệu thật, bắt đầu với 1 persona chính, rồi nhắm và viết nội dung theo đúng persona đó."
    },
    "plain": {
      "q": "Chọn cách nói với anh Quân bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Quảng cáo đang gửi tới quá nhiều kiểu người, nên học sinh nhắn hỏi nhiều mà không phải khách của anh. Mình nhìn lại những người đã đăng ký thật, vẽ ra chân dung 'chị nhân viên văn phòng muốn lên lương', rồi nói đúng nỗi lo của họ. Ít tin nhắn hơn nhưng đăng ký nhiều hơn.",
        "Anh cần refine targeting theo persona-led segmentation.",
        "Anh tăng ngân sách là sẽ có người đăng ký."
      ],
      "a": 0,
      "exp": "Nói rõ nguyên nhân (nhắm sai người) và kết quả mong đợi (ít tin rác, nhiều đăng ký)."
    },
    "critical": {
      "q": "Tin nhắn giảm 40% sau khi nhắm đúng persona, nhưng số đăng ký tăng gấp đôi. Đánh giá thế nào?",
      "options": [
        "Tệ hơn vì tin nhắn giảm",
        "Tốt hơn, vì KPI chính là đăng ký (CPA đăng ký giảm)",
        "Không so sánh được",
        "Phải quay lại nhắm rộng"
      ],
      "a": 1,
      "exp": "Nhìn KPI theo mục tiêu (đăng ký), không nhìn chỉ số phụ (tin nhắn)."
    },
    "scriptEn": "Your ads reach too many different people. Let's focus on the people who actually buy: office workers who want a better job. Fewer messages, but more sign-ups."
  },
  {
    "id": "d03",
    "part": 1,
    "emoji": "🧴",
    "title": "Mỹ phẩm handmade chọn kênh",
    "client": "Chị Mỹ, bán son và kem dưỡng handmade, 1 mình làm hết",
    "story": "Chị Mỹ đang cố đăng bài mỗi ngày trên Facebook, Instagram, TikTok, YouTube, Shopee, Lazada, Zalo, website… Chị kiệt sức mà doanh số không tăng.",
    "quote": "I post everywhere every day, but my sales are not growing. I am so tired.",
    "focus": "Nguồn của các đơn hàng hiện có",
    "docs": [
      {
        "name": "Đơn hàng 2–3 tháng qua đến từ kênh nào",
        "need": "must",
        "why": "Biết kênh nào đang ra đơn để tập trung vào đó."
      },
      {
        "name": "Thời gian chị bỏ ra cho từng kênh mỗi tuần",
        "need": "must",
        "why": "So công sức với kết quả để cắt bớt kênh kém."
      },
      {
        "name": "Chân dung khách mua (tuổi, hay xem nền tảng nào)",
        "need": "must",
        "why": "Chọn kênh theo nơi khách thật sự ở."
      },
      {
        "name": "Giấy phép công bố mỹ phẩm",
        "need": "maybe",
        "why": "Cần khi chạy quảng cáo hoặc lên sàn (nhiều nền tảng yêu cầu), và tạo niềm tin."
      },
      {
        "name": "Số follower của đối thủ lớn",
        "need": "no",
        "why": "Không giúp chọn kênh cho chị lúc này."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "Spreading limited resources across too many channels dilutes results. We should pick a focused channel mix of two or three platforms based on where the persona is and which channels already drive orders, for example TikTok for awareness, Shopee for conversion and Zalo for retention.",
        "Being on every platform maximizes reach, so keep posting everywhere.",
        "Only paid search matters for cosmetics."
      ],
      "a": 0,
      "exp": "Chọn 2–3 kênh vừa sức, mỗi kênh một vai trò trong funnel."
    },
    "plain": {
      "q": "Chọn cách nói với chị Mỹ bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Chị đang chia sức mình cho 8 nơi nên nơi nào cũng làm chưa tới. Mình giữ 2–3 nơi đang ra đơn nhiều nhất và làm thật đều: TikTok để nhiều người biết, Shopee để khách mua, Zalo để chăm khách cũ. Đỡ mệt mà đơn tập trung hơn.",
        "Chị nên optimize channel mix và de-prioritize low-ROI platforms.",
        "Chị đăng thêm cả Pinterest và Twitter nữa cho đủ."
      ],
      "a": 0,
      "exp": "Dễ hiểu, giảm áp lực cho chủ shop và có kế hoạch cụ thể."
    },
    "critical": {
      "q": "Dữ liệu cho thấy 70% đơn đến từ TikTok, YouTube gần như 0 đơn nhưng tốn 6 giờ/tuần. Nên làm gì?",
      "options": [
        "Bỏ TikTok, dồn sức cho YouTube",
        "Tạm dừng YouTube, dồn thời gian cho TikTok và kênh chốt đơn",
        "Giữ nguyên tất cả",
        "Mua quảng cáo YouTube thật nhiều"
      ],
      "a": 1,
      "exp": "Dồn nguồn lực vào kênh đã chứng minh hiệu quả; kênh tốn sức mà không ra kết quả thì tạm dừng."
    },
    "scriptEn": "You don't need to be everywhere. Let's focus on two or three channels where your customers really are. You will save time and get more orders."
  },
  {
    "id": "d04",
    "part": 2,
    "emoji": "👗",
    "title": "Quảng cáo Facebook nhiều click ít đơn",
    "client": "Chị Ngân, shop thời trang công sở",
    "story": "Quảng cáo Facebook của chị có CTR 3,5% (rất tốt) và CPC rẻ, nhưng 2 tuần chỉ được 4 đơn. Quảng cáo dẫn về website. Chị nghĩ 'chắc Facebook hết linh'.",
    "quote": "My ads get lots of clicks, but almost no orders. Is Facebook broken?",
    "focus": "Trang đích (landing page) trên điện thoại",
    "docs": [
      {
        "name": "Link trang đích mà quảng cáo đang trỏ tới",
        "need": "must",
        "why": "Click tốt mà không có đơn thì vấn đề thường nằm ở trang sau click."
      },
      {
        "name": "Báo cáo Ads Manager (CTR, CPC, số người bấm mua)",
        "need": "must",
        "why": "Để xác định đúng chỗ rớt trong phễu."
      },
      {
        "name": "Dữ liệu GA4: tỉ lệ thoát/engagement trên điện thoại",
        "need": "must",
        "why": "Xem khách có ở lại trang không, nhất là trên di động."
      },
      {
        "name": "Pixel/sự kiện mua hàng đã cài chưa",
        "need": "maybe",
        "why": "Có Pixel thì đo được khách bỏ giỏ ở bước nào và tối ưu theo mua hàng."
      },
      {
        "name": "Hoá đơn tiền điện của shop",
        "need": "no",
        "why": "Không liên quan đến hiệu quả quảng cáo."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "A high CTR with a very low conversion rate points to a post-click problem. We should audit the landing page experience, especially mobile load speed, pricing clarity, size information and the checkout or chat CTA.",
        "The CTR is high, so the campaign is successful and needs no changes.",
        "The Facebook algorithm is broken; we should stop all advertising."
      ],
      "a": 0,
      "exp": "CTR đo sức hút của quảng cáo; conversion rate đo trang đích. Rớt sau click → sửa trang đích."
    },
    "plain": {
      "q": "Chọn cách nói với chị Ngân bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Quảng cáo của chị làm tốt phần 'kéo khách vào cửa'. Nhưng vào tới nơi khách lại đi ra, nghĩa là trong 'cửa hàng' có gì đó làm khách ngại: trang tải chậm trên điện thoại, không thấy giá, không có bảng size, hay khó bấm mua. Mình sửa trang trước, chưa cần đổi quảng cáo.",
        "Facebook hết linh rồi chị, mình bỏ đi.",
        "Chị cần CRO cho landing page để cải thiện CVR."
      ],
      "a": 0,
      "exp": "Hình ảnh 'kéo khách vào cửa' giúp chủ shop thấy vấn đề nằm ở trang chứ không phải quảng cáo."
    },
    "critical": {
      "q": "Mở trang trên điện thoại mất 9 giây mới hiện, ảnh rất nặng. Ưu tiên làm gì trước?",
      "options": [
        "Tăng ngân sách quảng cáo",
        "Giảm dung lượng ảnh, tăng tốc trang trên di động",
        "Đổi hình quảng cáo",
        "Thêm 20 sản phẩm"
      ],
      "a": 1,
      "exp": "Đa số khách vào bằng điện thoại; trang chậm là khách thoát trước khi thấy sản phẩm."
    },
    "scriptEn": "Your ads are working well, because many people click. The problem is after the click. Let's make your website faster on phones and show the price and sizes clearly."
  },
  {
    "id": "d05",
    "part": 2,
    "emoji": "🔧",
    "title": "Dịch vụ sửa điện lạnh và Google Ads",
    "client": "Anh Tài, dịch vụ sửa máy lạnh, tủ lạnh tại nhà",
    "story": "Anh Tài chạy Google Search Ads với từ khoá 'máy lạnh'. Tiền hết rất nhanh, nhiều cuộc gọi hỏi mua máy lạnh mới hoặc hỏi lương thợ.",
    "quote": "My Google ads spend money fast, but the calls are not about repairs.",
    "focus": "Báo cáo từ khoá khách đã tìm (search terms)",
    "docs": [
      {
        "name": "Báo cáo các cụm từ khách đã tìm (search terms report)",
        "need": "must",
        "why": "Thấy chính xác khách gõ gì mà quảng cáo hiện ra, để lọc từ không liên quan."
      },
      {
        "name": "Danh sách từ khoá đang chạy và kiểu đối sánh",
        "need": "must",
        "why": "'máy lạnh' quá rộng, kéo cả người muốn mua máy, tìm việc…"
      },
      {
        "name": "Khu vực anh phục vụ được",
        "need": "must",
        "why": "Giới hạn vị trí để không trả tiền cho cuộc gọi ở xa."
      },
      {
        "name": "Giờ làm việc nhận cuộc gọi",
        "need": "maybe",
        "why": "Có thể chỉ chạy quảng cáo gọi điện trong giờ có người nghe máy."
      },
      {
        "name": "Lượt thích Fanpage",
        "need": "no",
        "why": "Không liên quan hiệu quả Google Search Ads."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "The keyword 'máy lạnh' is too broad and matches non-buying intents. We should switch to high-intent keywords such as 'sửa máy lạnh tại nhà quận 7', add negative keywords like 'mua', 'giá máy mới', 'tuyển thợ', and apply location targeting.",
        "Broad keywords are always cheaper and better.",
        "We should move all budget to Display Ads."
      ],
      "a": 0,
      "exp": "Từ khoá ý định rõ + negative keyword + giới hạn vị trí = ít lãng phí."
    },
    "plain": {
      "q": "Chọn cách nói với anh Tài bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Hiện quảng cáo hiện ra cho mọi ai gõ chữ 'máy lạnh', kể cả người muốn mua máy mới hay đi tìm việc, nên anh trả tiền cho những cuộc gọi không ra tiền. Mình đổi sang chữ cụ thể như 'sửa máy lạnh tại nhà quận 7', và chặn các chữ như 'mua', 'tuyển thợ'. Ít cuộc gọi rác, tiền đi đúng chỗ.",
        "Anh cần thêm negative keywords và chuyển sang phrase match.",
        "Anh tăng ngân sách gấp đôi là ổn."
      ],
      "a": 0,
      "exp": "Giải thích bằng ví dụ chữ khách gõ, rất dễ hình dung."
    },
    "critical": {
      "q": "Từ khoá nào nên thêm làm negative keyword cho dịch vụ SỬA máy lạnh?",
      "options": [
        "sửa",
        "tại nhà",
        "tuyển dụng",
        "quận 7"
      ],
      "a": 2,
      "exp": "'tuyển dụng' là người tìm việc, không phải khách cần sửa. Ba từ còn lại là đúng ý định."
    },
    "scriptEn": "Your ads show up for anyone who searches for air conditioners, even job seekers. Let's use specific repair keywords and block unrelated words, so you only pay for real customers."
  },
  {
    "id": "d06",
    "part": 2,
    "emoji": "🍰",
    "title": "Tiệm bánh với TikTok và KOC",
    "client": "Chị Hạnh, tiệm bánh kem online",
    "story": "Một khách quen (KOC) quay video review bánh của chị Hạnh, được 300.000 lượt xem tự nhiên. Chị muốn tận dụng nhưng không biết làm sao. Chị định thuê KOL nổi tiếng 50 triệu cho 1 video.",
    "quote": "A customer's video about my cake went viral. How can I use it?",
    "focus": "Sự đồng ý của KOC và quyền dùng video",
    "docs": [
      {
        "name": "Link video gốc và sự đồng ý/uỷ quyền của KOC",
        "need": "must",
        "why": "Spark Ads cần mã uỷ quyền từ chủ video; dùng video người khác phải xin phép."
      },
      {
        "name": "Số đơn/tin nhắn tăng sau khi video viral",
        "need": "must",
        "why": "Đo xem video có thật sự ra đơn hay chỉ ra view."
      },
      {
        "name": "Khu vực giao bánh và thời gian đặt trước",
        "need": "must",
        "why": "Bánh kem giao gần, cần đặt trước, phải nhắm đúng vị trí."
      },
      {
        "name": "Báo giá KOL nổi tiếng",
        "need": "maybe",
        "why": "Chỉ để so sánh. Với tiệm nhỏ, nhiều KOC thật thường hiệu quả hơn 1 KOL đắt."
      },
      {
        "name": "Số CMND của KOC",
        "need": "no",
        "why": "Không cần cho việc chạy Spark Ads."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "We can amplify the organic KOC video with TikTok Spark Ads using the creator's authorization code. It keeps the authentic social proof and engagement, and lets us target a local radius, which is usually more cost-effective than a single expensive KOL post.",
        "We must re-upload the video as a new ad and remove all comments.",
        "Only celebrities can make TikTok ads effective."
      ],
      "a": 0,
      "exp": "Spark Ads giữ video gốc + bằng chứng xã hội thật; nhắm vị trí phù hợp tiệm bánh."
    },
    "plain": {
      "q": "Chọn cách nói với chị Hạnh bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Video khách quay khen bánh chị là 'lời khen thật' nên người xem rất tin. Mình xin phép bạn đó rồi trả tiền để TikTok đẩy chính video này tới nhiều người ở gần tiệm hơn. Cách này rẻ hơn nhiều so với thuê người nổi tiếng 50 triệu, mà khách lại tin hơn.",
        "Chị chạy Spark Ads với authorization code và geo-targeting.",
        "Chị cứ tải video về rồi đăng lại, không cần hỏi ai."
      ],
      "a": 0,
      "exp": "Nói rõ lợi ích (khách tin, rẻ hơn) và nhắc phải xin phép."
    },
    "critical": {
      "q": "Video có 300.000 view nhưng 80% người xem ở tỉnh khác, tiệm chỉ giao trong TP.HCM. Khi đẩy quảng cáo nên làm gì?",
      "options": [
        "Nhắm toàn quốc để giữ đà viral",
        "Nhắm vị trí TP.HCM (khu vực giao được)",
        "Không chạy quảng cáo",
        "Chỉ nhắm nước ngoài"
      ],
      "a": 1,
      "exp": "View ở nơi không giao được không ra đơn; trả tiền thì phải nhắm nơi bán được."
    },
    "scriptEn": "This customer's video feels real, so people trust it. With the creator's permission, we can boost it to people near your bakery. It is cheaper than hiring a famous influencer."
  },
  {
    "id": "d07",
    "part": 3,
    "emoji": "📊",
    "title": "Không biết đơn đến từ kênh nào",
    "client": "Anh Khải, bán đồ gia dụng qua website",
    "story": "Anh chạy cùng lúc Facebook, Zalo, TikTok và Google, tất cả trỏ về website. Cuối tháng anh không biết kênh nào ra đơn, định cắt bừa Google vì 'thấy đắt'.",
    "quote": "I run ads on four platforms, but I don't know which one brings sales.",
    "focus": "Link quảng cáo có gắn UTM",
    "docs": [
      {
        "name": "Toàn bộ link đang dùng trong quảng cáo các kênh",
        "need": "must",
        "why": "Kiểm tra đã gắn UTM chưa. Thiếu UTM thì GA4 không tách nguồn được."
      },
      {
        "name": "Quyền xem GA4 của website",
        "need": "must",
        "why": "Đọc báo cáo Traffic acquisition và chuyển đổi theo nguồn."
      },
      {
        "name": "Chi phí từng kênh trong tháng",
        "need": "must",
        "why": "Để tính CPA/ROAS từng kênh, không chỉ nhìn 'đắt hay rẻ' theo cảm giác."
      },
      {
        "name": "Sự kiện chuyển đổi (mua hàng) đã cài trong GA4 chưa",
        "need": "maybe",
        "why": "Không có sự kiện mua thì chỉ biết lượt vào, không biết đơn."
      },
      {
        "name": "Ảnh chụp màn hình bài viết nhiều like nhất",
        "need": "no",
        "why": "Like không cho biết kênh nào ra đơn."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "We need consistent UTM tagging (utm_source, utm_medium, utm_campaign) on every ad link and conversion events in GA4, so we can attribute orders by channel and compare CPA and ROAS instead of cutting a channel based on CPC alone.",
        "GA4 can always detect the source automatically, so UTMs are unnecessary.",
        "The most expensive channel should always be cut first."
      ],
      "a": 0,
      "exp": "UTM + sự kiện chuyển đổi → so sánh kênh theo CPA/ROAS. Kênh 'đắt' theo click có thể lại rẻ nhất theo đơn."
    },
    "plain": {
      "q": "Chọn cách nói với anh Khải bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Mình gắn cho mỗi link quảng cáo một 'mã nhận diện' nhỏ ở cuối, giống ghi tên người giới thiệu. Khi có đơn, công cụ đo sẽ biết khách tới từ Facebook, Zalo, TikTok hay Google. Lúc đó mình mới biết kênh nào đáng tiền thật, chứ Google click đắt nhưng có khi ra đơn rẻ nhất.",
        "Anh cần implement UTM tracking và attribution trong GA4.",
        "Anh cắt Google đi cho nhẹ."
      ],
      "a": 0,
      "exp": "So sánh với 'ghi tên người giới thiệu' giúp chủ shop hiểu UTM ngay."
    },
    "critical": {
      "q": "Sau khi gắn UTM: Google tốn 6 triệu ra 40 đơn; Facebook tốn 4 triệu ra 10 đơn. Kênh nào có CPA tốt hơn?",
      "options": [
        "Facebook (400.000đ/đơn)",
        "Google (150.000đ/đơn)",
        "Bằng nhau",
        "Không tính được"
      ],
      "a": 1,
      "exp": "Google: 6.000.000 ÷ 40 = 150.000đ/đơn. Facebook: 4.000.000 ÷ 10 = 400.000đ/đơn. Kênh 'đắt' lại hiệu quả hơn!"
    },
    "scriptEn": "Let's add a small tracking code to every ad link. Then we can see which platform brings real orders, not just clicks, and spend more on the best one."
  },
  {
    "id": "d08",
    "part": 3,
    "emoji": "🧪",
    "title": "Tối ưu và A/B test",
    "client": "Chị Duyên, bán nến thơm, đã có quảng cáo ổn định",
    "story": "Quảng cáo của chị Duyên đang có CPA ổn. Chị muốn tăng doanh số nên đổi cùng lúc hình, tiêu đề, giá và đối tượng; mỗi ngày lại sửa một lần. Kết quả lên xuống thất thường.",
    "quote": "I change my ads every day, but the results go up and down. What should I do?",
    "focus": "Lịch sử các lần chỉnh sửa và kết quả theo tuần",
    "docs": [
      {
        "name": "Nhật ký các lần chỉnh sửa (ngày nào đổi gì)",
        "need": "must",
        "why": "Để biết thay đổi nào gây ra kết quả nào."
      },
      {
        "name": "Kết quả theo tuần (không chỉ từng ngày)",
        "need": "must",
        "why": "Số liệu từng ngày dao động; xu hướng tuần đáng tin hơn."
      },
      {
        "name": "KPI chính chị muốn tăng (đơn, ROAS…)",
        "need": "must",
        "why": "Test phải đo bằng đúng một KPI chính."
      },
      {
        "name": "Các mẫu hình/tiêu đề mới muốn thử",
        "need": "maybe",
        "why": "Dùng để lên kế hoạch test lần lượt từng yếu tố."
      },
      {
        "name": "Số follower Instagram",
        "need": "no",
        "why": "Không phải KPI của bài test này."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "Frequent multi-variable edits reset the learning phase and make results impossible to attribute. We should run a proper A/B test with one variable at a time, keep the control running, wait for enough data, then scale the winner gradually.",
        "Changing everything daily speeds up optimization.",
        "A/B tests should change at least five variables to save time."
      ],
      "a": 0,
      "exp": "1 biến mỗi lần, có bản đối chứng, đủ dữ liệu, rồi mới nhân rộng từ từ."
    },
    "plain": {
      "q": "Chọn cách nói với chị Duyên bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Mỗi lần chị sửa, máy quảng cáo phải học lại từ đầu, nên kết quả lên xuống. Đổi nhiều thứ một lúc thì cũng không biết cái nào làm tốt lên. Mình giữ bản đang chạy ổn, thử thêm 1 bản chỉ khác đúng cái hình, chờ khoảng 1 tuần. Bản nào thắng thì giữ, rồi mới thử tiếp tiêu đề.",
        "Chị cần A/B test single-variable và tránh reset learning phase.",
        "Chị cứ sửa mỗi ngày, kiểu gì cũng trúng."
      ],
      "a": 0,
      "exp": "Giải thích cả lý do (máy học lại, không biết nguyên nhân) và cách làm cụ thể."
    },
    "critical": {
      "q": "Bản A (hình cũ) và bản B (hình mới) chạy 7 ngày cùng đối tượng, cùng ngân sách: A có CPA 80.000đ, B có CPA 55.000đ, mỗi bản đều có hơn 50 đơn. Làm gì tiếp?",
      "options": [
        "Giữ cả hai mãi mãi",
        "Chọn B, tăng ngân sách từ từ cho B rồi test yếu tố tiếp theo",
        "Chọn A vì quen",
        "Đổi luôn cả đối tượng và giá"
      ],
      "a": 1,
      "exp": "Đủ dữ liệu, chỉ khác 1 yếu tố → B thắng. Nhân rộng từ từ rồi test tiếp yếu tố khác."
    },
    "scriptEn": "When you change many things every day, we cannot learn what works. Let's test one change at a time, wait about a week, and then keep the winner."
  },
  {
    "id": "d09",
    "part": 4,
    "emoji": "⌚",
    "title": "Thẩm định Brief & Tệp SĐT Mua Lậu",
    "client": "Anh Hoàng — Shop Đồng hồ Thời trang",
    "story": "Anh Hoàng muốn chi 30.000.000đ/tháng chạy Ads, đòi cam kết 600 đơn (CPA 50.000đ) ngay tuần đầu. Anh đưa file Excel 50.000 số điện thoại mua trên mạng giá 1 triệu yêu cầu nạp vào chạy Facebook Ads và bắn Zalo ZNS quảng cáo. Fanpage mới lập 0 bài viết, buổi tối không có nhân sự trực tin nhắn.",
    "quote": "Em cam kết cho anh 30 triệu tiền ads phải ra 600 đơn ngay tuần đầu nhé! Nhân tiện anh mới mua file 50.000 SĐT khách vip trên mạng, em nạp vào chạy ads và bắn ZNS quảng cáo luôn giùm anh.",
    "focus": "Thẩm định brief & tuân thủ Điều 28 Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15",
    "docs": [
      {
        "name": "Hồ sơ công bố sản phẩm & hoá đơn nguồn gốc đồng hồ chính hãng",
        "need": "must",
        "why": "Chứng minh hàng hoá hợp pháp, đủ điều kiện quảng cáo theo Luật 75/2025/QH15."
      },
      {
        "name": "Danh sách 50.000 số điện thoại mua trôi nổi trên mạng",
        "need": "no",
        "why": "Vi phạm nghiêm trọng Điều 28 Luật BVDLCN 91/2025/QH15 và chính sách ZNS Zalo; cấm sử dụng."
      },
      {
        "name": "Kế hoạch nhân sự trực chat Zalo/Fanpage buổi tối (SLA < 5 phút)",
        "need": "must",
        "why": "Đảm bảo tỷ lệ chuyển đổi BOFU khi khách hàng nhắn tin sau giờ hành chính."
      },
      {
        "name": "Lịch sử đơn hàng và khách hàng cũ tự thu thập hợp pháp có opt-in",
        "need": "maybe",
        "why": "Nếu có tệp khách cũ hợp pháp thì mới tạo Custom Audience an toàn."
      },
      {
        "name": "Mật khẩu Facebook cá nhân của anh Hoàng",
        "need": "no",
        "why": "Vi phạm nguyên tắc bảo mật Zero-Password; chỉ nhận quyền Partner qua Business Manager."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "Under Article 28 of the Personal Data Protection Law 91/2025/QH15, using purchased third-party phone lists without verifiable explicit opt-in consent for marketing is strictly prohibited. Furthermore, committing to a CPA of 50,000 VND without baseline conversion data on a brand-new page with no after-hours sales coverage is commercially unviable.",
        "Purchasing phone lists is standard industry practice, but we should verify the mobile carrier first before running campaigns.",
        "We can commit to 600 orders immediately by spending all 30 million VND in the first 48 hours."
      ],
      "a": 0,
      "exp": "Tuân thủ Điều 28 Luật 91/2025/QH15 về cấm dùng dữ liệu mua bán không opt-in; từ chối cam kết khống khi chưa có baseline và nhân sự trực chat."
    },
    "plain": {
      "q": "Chọn cách nói với anh Hoàng bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Anh Hoàng ơi, file 50.000 số điện thoại mua ngoài chợ đen là phạm luật bảo vệ dữ liệu cá nhân mới (Luật 91/2025), dùng là bị phạt nặng và khoá tài khoản ngay. Thêm nữa, Fanpage mình chưa có bài nào và buổi tối không có ai trực chat thì tiền ads đổ về sẽ trôi mất. Mình cần chuẩn bị 10 bài uy tín, xếp người trực chat, rồi chạy thử 7 ngày đo số thật trước khi chốt KPI lớn anh nhé.",
        "Anh đưa mật khẩu Facebook đây em nạp danh sách vào chạy ẩn cho anh, không ai biết đâu.",
        "Anh cứ chi 30 triệu đi, em cam đoan ra 600 đơn bất kể có người trực tin nhắn hay không."
      ],
      "a": 0,
      "exp": "Nói rõ rủi ro pháp lý Luật 91/2025/QH15, giải thích lỗ hổng phễu thiếu người trực chat, đề xuất quy trình chuẩn bị bài bản."
    },
    "critical": {
      "q": "Anh Hoàng vẫn nằng nặc đòi nạp file 50.000 SĐT mua trôi nổi vào tài khoản quảng cáo và gửi tin nhắn ZNS tiếp thị. Bạn phải làm gì?",
      "options": [
        "Đồng ý làm theo vì khách hàng là thượng đế",
        "Kiên quyết từ chối sử dụng tệp dữ liệu trái phép theo Điều 28 Luật 91/2025/QH15; nếu khách tiếp tục ép buộc thì từ chối nhận dự án để bảo vệ an toàn pháp lý cho bản thân",
        "Chia nhỏ tệp ra nạp vào ban đêm để tránh bị nền tảng phát hiện",
        "Gửi tin nhắn spam bằng tài khoản Zalo cá nhân thay vì ZNS"
      ],
      "a": 1,
      "exp": "Điều 28 Luật 91/2025/QH15 quy định trách nhiệm pháp lý rõ ràng; kiên quyết từ chối hành vi vi phạm pháp luật là nguyên tắc hành nghề bắt buộc."
    },
    "scriptEn": "We cannot use purchased phone lists under Vietnam's Personal Data Protection Law 91/2025. We must build trust on your page and set up fast chat responses before scaling ad spend."
  },
  {
    "id": "d10",
    "part": 4,
    "emoji": "🍵",
    "title": "Tính Điểm Hoà Vốn ROAS Sau Thuế Sàn",
    "client": "Chị Thảo Vy — Trà Thảo Mộc Đóng Hộp",
    "story": "Hộp trà bán giá 200.000đ, giá vốn sản xuất + đóng gói 90.000đ (45%). Phí sàn TMĐT + thanh toán + voucher + affiliate là 18,5%, hoàn đơn dự phòng 2%, thuế khấu trừ tại nguồn theo Nghị định 117/2025/NĐ-CP là 1,5%. Chị Vy đang tự chạy ads đạt ROAS 2,5 và định vay tiền nhân đôi ngân sách vì nghĩ đang lời to.",
    "quote": "Chị chạy quảng cáo ROAS đang được 2,5 nè, bỏ 1 đồng thu về 2,5 đồng doanh thu là quá lời rồi! Em vào nhân đôi ngân sách tháng này cho chị nha!",
    "focus": "Kinh tế học đơn vị (Unit Economics) & Tính điểm hoà vốn ROAS sau thuế Nghị định 117/2025/NĐ-CP",
    "docs": [
      {
        "name": "Bảng phân tích cơ cấu chi phí sản phẩm (giá vốn, bao bì, phí sàn, thuế)",
        "need": "must",
        "why": "Xác định chính xác biên lợi nhuận ròng trước quảng cáo để tính điểm hoà vốn."
      },
      {
        "name": "Báo cáo doanh thu và chi phí quảng cáo thực tế trên trình quản lý",
        "need": "must",
        "why": "Đối chiếu ROAS báo cáo với doanh thu thực nhận về tài khoản ngân hàng."
      },
      {
        "name": "Tỷ lệ huỷ đơn và hoàn đơn thực tế của sản phẩm",
        "need": "must",
        "why": "Đảm bảo chi phí hoàn hàng được tính đủ vào cơ cấu giá thành."
      },
      {
        "name": "Hồ sơ thiết kế combo 2 hộp (AOV cao hơn)",
        "need": "maybe",
        "why": "Giải pháp tăng giá trị đơn hàng nhằm cải thiện biên lợi nhuận và hạ ROAS hoà vốn."
      },
      {
        "name": "Cam kết mua 10.000 hộp trà từ đối tác bán buôn nước ngoài",
        "need": "no",
        "why": "Không liên quan đến bài toán tối ưu quảng cáo bán lẻ trên sàn TMĐT."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "With COGS at 45%, platform and fulfillment fees at 18.5%, return allowance at 2%, and statutory 1.5% withholding tax under Decree 117/2025/ND-CP, total non-ad costs equal 67%, leaving a net contribution margin of only 33%. Break-even ROAS is 1 / 0.33 = 3.03. Operating at ROAS 2.5 incurs a net loss of 14,000 VND per unit sold, so scaling ad spend immediately would exacerbate operating losses.",
        "A ROAS of 2.5 is always profitable regardless of production costs or statutory e-commerce tax withholdings.",
        "Break-even ROAS equals total sales divided by the ad account balance."
      ],
      "a": 0,
      "exp": "Tổng chi phí trước ads = 45% + 18,5% + 2% + 1,5% = 67%. Biên lợi nhuận ròng = 33%. ROAS hoà vốn = 1/0,33 = 3,03. Chạy ROAS 2,5 đang lỗ 14.000đ/hộp (chi ads 80k > biên lãi 66k)."
    },
    "plain": {
      "q": "Chọn cách nói với chị Thảo Vy bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Chị Vy ơi, nhìn ROAS 2,5 tưởng lời nhưng cộng lại: tiền vốn trà 90k, phí sàn 37k, dự phòng hoàn đơn 4k, thuế sàn khấu trừ theo NĐ 117 mất 3k. Tổng chi phí cố định là 134k, chị chỉ còn dư 66k để chi quảng cáo. Với ROAS 2,5 thì tiền ads mất 80k/hộp, nghĩa là mỗi hộp bán ra chị đang bù lỗ 14k! Giờ mà tăng đôi ngân sách là càng bán càng lỗ. Mình nên ghép combo 2 hộp để nâng giá trị đơn lên rồi mới scale chị nhé.",
        "ROAS 2,5 ngon quá chị ơi, tăng gấp ba ngân sách luôn cho kịp đối thủ.",
        "Chị cần tính Contribution Margin và Break-even ROAS với statutory tax withholding ngay."
      ],
      "a": 0,
      "exp": "Bóc tách từng con số VNĐ rõ ràng (vốn 90k, phí sàn 37k, hoàn 4k, thuế 3k, dư 66k vs ads 80k = lỗ 14k) và đề xuất combo."
    },
    "critical": {
      "q": "Một hộp trà giá 200.000đ đang có ROAS 2,5 (tiền ads 80.000đ/hộp) trong khi biên lợi nhuận ròng trước ads là 66.000đ (lỗ 14.000đ/hộp). Giải pháp nào hiệu quả và an toàn nhất trước khi tăng ngân sách quảng cáo?",
      "options": [
        "Tăng ngân sách gấp đôi ngay lập tức để lấy số lượng bù lỗ",
        "Đóng gói combo 2 hộp bán giá 360.000đ (giảm tỷ lệ phí vận chuyển/hộp quà, tăng AOV) và tối ưu nội dung để đưa ROAS thực tế vượt mốc 3,5",
        "Tắt hoàn toàn quảng cáo và giải thể xưởng sản xuất trà",
        "Tự ý đổi nguyên liệu rẻ tiền kém chất lượng không công bố"
      ],
      "a": 1,
      "exp": "Tạo combo tăng AOV giúp biên lãi tăng, đưa ROAS thực tế vượt điểm hoà vốn 3,03 trước khi mở rộng ngân sách."
    },
    "scriptEn": "At ROAS 2.5, you are currently losing 14,000 VND per box due to marketplace fees and statutory tax. Let's create a 2-box bundle to raise your profit margin before scaling."
  },
  {
    "id": "d11",
    "part": 4,
    "emoji": "📝",
    "title": "Báo Giá 3 Gói & Phụ Lục Hợp Đồng DPA",
    "client": "Soạn Báo giá 3 Gói & Hợp đồng DPA — Hợp tác Freelance / Agency",
    "story": "Khách hàng muốn thuê bạn chạy quảng cáo Meta và Google đa kênh nhưng đề nghị: 'Không cần ký hợp đồng rườm rà, bên em chi ngân sách bao nhiêu thì bên anh ứng trước thẻ cá nhân quẹt giùm em, cuối tháng tính cả thể. Em cam kết ăn chia 20% doanh thu thuần tuý, không cần phí dịch vụ cố định!'.",
    "quote": "Bên em bận lắm, không ký hợp đồng giấy tờ mất thời gian đâu. Em đưa 10.000 số khách cũ, anh cứ lấy thẻ cá nhân quẹt tiền ads trước, cuối tháng em trích 20% doanh thu trả công anh, cần gì phí cứng!",
    "focus": "Lập Báo giá 3 Gói, Hợp đồng Dịch vụ Marketing & Phụ lục DPA tuân thủ Điều 28 Luật 91/2025/QH15",
    "docs": [
      {
        "name": "Bảng Báo giá 3 Gói (Starter / Pro / Growth) phân định rõ phạm vi SOW và giới hạn chỉnh sửa 2 lần",
        "need": "must",
        "why": "Tránh Scope Creep và minh bạch quyền lợi, khối lượng công việc hai bên."
      },
      {
        "name": "Hợp đồng Dịch vụ Marketing chuẩn có điều khoản Bên A tự thanh toán ngân sách quảng cáo",
        "need": "must",
        "why": "Bảo vệ dòng tiền, tuyệt đối không quẹt thẻ cá nhân trả nợ ngân sách ads thay khách."
      },
      {
        "name": "Phụ lục Thỏa thuận Xử lý Dữ liệu Cá nhân (DPA) theo Điều 28 Luật 91/2025/QH15",
        "need": "must",
        "why": "Pháp lý bắt buộc xác định Bên kiểm soát dữ liệu (khách) và Bên xử lý dữ liệu (marketer)."
      },
      {
        "name": "Biên bản cam kết SLA phản hồi lead của nhân viên bán hàng bên A (< 15 phút)",
        "need": "maybe",
        "why": "Làm căn cứ quy kết trách nhiệm chuyển đổi khi có tranh chấp về doanh thu."
      },
      {
        "name": "Thẻ tín dụng cá nhân của marketer đưa cho khách cầm",
        "need": "no",
        "why": "Rủi ro tài chính cực lớn; marketer tuyệt đối không tài trợ tín dụng ads cho khách."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "A compliant service engagement requires a formal Statement of Work (SOW) with defined revision limits, a pure-service fee structure without fronting ad spend via personal payment instruments, and a mandatory Data Processing Agreement (DPA) under Article 28 of Law 91/2025/QH15 to govern customer personal data processing and audit trails.",
        "Pure revenue-share contracts without base retainer or ad budget segregation are the recommended standard for all freelance marketers.",
        "Under Vietnamese commercial law, verbal agreements over social chat supersede written service agreements."
      ],
      "a": 0,
      "exp": "Hợp đồng chuẩn cần SOW rõ ràng, giới hạn sửa bài, không ứng tiền ads bằng thẻ cá nhân, và có phụ lục DPA theo Điều 28 Luật 91/2025/QH15."
    },
    "plain": {
      "q": "Chọn cách nói với khách hàng bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Em cảm ơn anh đã tin tưởng! Tuy nhiên để làm việc lâu dài và an toàn cho cả hai bên: ngân sách quảng cáo anh sẽ gắn trực tiếp thẻ công ty anh để thanh toán cho Facebook/Google, em không đứng ra ứng trước. Em gửi anh Báo giá 3 gói rõ ràng số bài, số video và số lần chỉnh sửa, kèm Hợp đồng dịch vụ và Phụ lục bảo mật dữ liệu khách hàng theo luật mới 91/2025. Mình chốt gói và ký xong là bắt đầu triển khai ngay anh nhé.",
        "Dạ được anh, em lấy thẻ cá nhân quẹt trước 100 triệu tiền ads cho anh luôn.",
        "Bên anh không ký hợp đồng thì em cũng không cần làm kế hoạch gì cả."
      ],
      "a": 0,
      "exp": "Chuyên nghiệp, từ chối ứng thẻ thanh toán, gửi bảng báo giá 3 gói và hợp đồng kèm DPA theo Luật 91/2025/QH15."
    },
    "critical": {
      "q": "Vì sao Freelancer hoặc Agency mới lập CẤM nhận hình thức '0 đồng phí cứng, chỉ nhận hoa hồng % doanh thu' khi chưa có dữ liệu và không kiểm soát được khâu chốt đơn của shop?",
      "options": [
        "Vì pháp luật Việt Nam cấm trả lương theo hoa hồng",
        "Vì Marketer chỉ kéo được khách tiềm năng (Lead/Traffic); nếu nhân viên shop phản hồi chậm trễ, tư vấn kém, kho hết hàng hoặc tỷ lệ hoàn cao thì Marketer mất trắng toàn bộ công sức mà không có tiền trang trải chi phí vận hành",
        "Vì Facebook không cho phép tài khoản nhận hoa hồng",
        "Vì làm như vậy sẽ không cài đặt được Google Analytics 4"
      ],
      "a": 1,
      "exp": "Doanh thu phụ thuộc hàng tồn kho, giá bán, thái độ nhân viên và tỷ lệ hoàn COD. Không phí cứng = marketer gánh 100% rủi ro vận hành của shop."
    },
    "scriptEn": "To protect both sides, ad budgets are paid directly by your company card, and our engagement is formalized with a clear SOW and a DPA under Law 91/2025."
  },
  {
    "id": "d12",
    "part": 4,
    "emoji": "🛡️",
    "title": "Khủng Hoảng KOL & Ranh Giới Hành Nghề",
    "client": "Chị Mai — Cơ sở Kinh doanh Thực phẩm Bổ sung",
    "story": "Chị Mai thuê KOC quay video cam kết 'Uống 5 ngày khỏi hẳn tiểu đường, không cần thuốc tây'. Video không có giấy xác nhận nội dung quảng cáo và không gắn nhãn tài trợ. Tài khoản BM bị khoá vì lỗi Misrepresentation, Fanpage bị người tiêu dùng tố cáo quảng cáo gian dối. Chị Mai đưa mật khẩu Facebook cá nhân và yêu cầu bạn 'lách luật tạo 10 tài khoản ảo chạy tiếp và viết đơn khiếu nại pháp lý gửi cơ quan chức năng giùm chị'.",
    "quote": "Tài khoản bị khoá rồi, em lấy mật khẩu nick chị tạo chục nick ảo lách luật chạy tiếp video đó đi! Tiện thể em viết đơn gửi Sở Y tế cãi giùm chị luôn nha!",
    "focus": "Xử lý khủng hoảng chính sách quảng cáo, Zero-Password và Ranh giới hành nghề (Scope of Practice)",
    "docs": [
      {
        "name": "Giấy tiếp nhận bản công bố và Giấy xác nhận nội dung quảng cáo từ Cục An toàn Thực phẩm",
        "need": "must",
        "why": "Căn cứ pháp lý bắt buộc theo Luật Quảng cáo 75/2025/QH15 để biết nội dung nào được phép nói."
      },
      {
        "name": "Văn bản đính chính thông tin trung thực và chính sách hỗ trợ hoàn tiền cho khách hàng",
        "need": "must",
        "why": "Xử lý triệt để khủng hoảng niềm tin và hạn chế tối đa rủi ro bị cơ quan quản lý xử phạt nặng."
      },
      {
        "name": "Tài khoản Business Portfolio (BM) chính chủ có xác thực 2 lớp (2FA)",
        "need": "must",
        "why": "Tuân thủ chính sách bảo mật Zero-Password, không dùng mật khẩu cá nhân của khách."
      },
      {
        "name": "Danh sách 10 tài khoản Facebook ảo (via) mua trên mạng để lách luật",
        "need": "no",
        "why": "Vi phạm nghiêm trọng lỗi Circumventing Systems; dẫn đến khoá vĩnh viễn toàn bộ BM và tên miền."
      },
      {
        "name": "Hồ sơ đại diện tố tụng và đơn khiếu nại pháp lý gửi cơ quan thanh tra",
        "need": "no",
        "why": "Vượt quá ranh giới chuyên môn của marketer; bắt buộc phải do Luật sư có chứng chỉ thực hiện."
      }
    ],
    "legal": {
      "q": "Chọn cách giải thích bằng NGÔN NGỮ CHUYÊN MÔN:",
      "options": [
        "Claims guaranteeing a permanent cure without pharmaceutical intervention violate Law 75/2025/QH15 and platform Misrepresentation policies. Circumventing systems via disposable accounts triggers irreversible domain-level bans. The agency must immediately retract non-compliant creatives, implement transparent refunds, and refer formal administrative or legal appeals to licensed legal counsel as it exceeds the marketing scope of practice.",
        "Creating 10 disposable ad accounts with anti-detect browsers is the standard protocol for resolving health misrepresentation bans.",
        "Marketing consultants are legally qualified to represent clients in administrative litigation before regulatory bodies."
      ],
      "a": 0,
      "exp": "Gỡ nội dung cam kết bừa bãi, không lách luật qua nick ảo (tránh Circumventing Systems khoá vĩnh viễn), và chuyển việc khiếu nại pháp lý cho Luật sư."
    },
    "plain": {
      "q": "Chọn cách nói với chị Mai bằng NGÔN NGỮ CỦA CHỦ SHOP:",
      "options": [
        "Chị Mai ơi, video khẳng định 'khỏi hẳn tiểu đường' là vi phạm nghiêm trọng Luật Quảng cáo mới và chính sách Facebook, tuyệt đối không được tạo nick ảo chạy lách vì sẽ bị khoá vĩnh viễn cả website và thương hiệu. Mình cần: (1) Gỡ ngay video, đăng bài đính chính trung thực và hoàn tiền cho khách bức xúc; (2) Sửa lại nội dung đúng theo giấy phép của Bộ Y tế; (3) Em không nhận mật khẩu cá nhân của chị mà sẽ hướng dẫn chị cấp quyền Partner qua BM an toàn; (4) Về việc làm việc với cơ quan thanh tra, chị cần liên hệ ngay Luật sư có chứng chỉ để được bảo vệ quyền lợi hợp pháp, em là chuyên môn marketing nên không được phép làm thay luật sư chị nhé.",
        "Chị đưa mật khẩu đây, em thuê tool tự động tạo nick ảo chạy lách cho chị tới cùng.",
        "Chị không cần đính chính gì cả, cứ xoá hết bình luận của khách là xong."
      ],
      "a": 0,
      "exp": "Rõ ràng, kiên quyết từ chối lách luật nick ảo, không cầm mật khẩu cá nhân, hướng dẫn đính chính/hoàn tiền và phân định rõ ranh giới chuyên môn chuyển luật sư."
    },
    "critical": {
      "q": "Khi khách hàng gặp rủi ro pháp lý phức tạp (bị thanh tra xử phạt vì quảng cáo sai sự thật hoặc tranh chấp hợp đồng kinh tế lớn), vai trò đúng đắn của Marketer / Agency là gì?",
      "options": [
        "Nhận trọn gói đứng ra làm đại diện pháp lý và soạn thảo đơn kiện để kiếm thêm thu nhập",
        "Cung cấp trung thực các số liệu báo cáo chiến dịch, rà soát gỡ bỏ nội dung quảng cáo vi phạm kỹ thuật, và khuyến nghị khách hàng làm việc trực tiếp với Luật sư có chứng chỉ hành nghề (Scope of Practice)",
        "Xoá sạch toàn bộ dữ liệu tài khoản và cắt đứt liên lạc với khách hàng",
        "Xúi giục khách hàng làm giả hồ sơ công bố chất lượng sản phẩm"
      ],
      "a": 1,
      "exp": "Marketer hỗ trợ số liệu kỹ thuật và gỡ nội dung vi phạm, nhưng tuyệt đối không hành nghề luật trái phép; phải giới thiệu cho Luật sư có chứng chỉ."
    },
    "scriptEn": "We cannot run misleading claims or circumvent ad systems with fake accounts. We must pull the video, issue truthful corrections, and refer legal matters to a qualified attorney."
  }
];
