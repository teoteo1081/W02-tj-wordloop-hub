// Tình huống "Bàn tiếp khách" — viết tay, đi từ dễ đến khó.
// Mỗi case có 4 bước:
//   1. docs     : chọn giấy tờ cần xin khách (need: "must" = bắt buộc, "maybe" = tùy trường hợp, "no" = không cần)
//   2. legal    : chọn lời giải thích bằng NGÔN NGỮ LUẬT (tiếng Anh, kiểu đề thi / kiểu nói với IRS)
//   3. plain    : chọn lời giải thích bằng NGÔN NGỮ CỦA KHÁCH (tiếng Việt dễ hiểu)
//   4. critical : 1 câu hỏi "bẫy" cần suy nghĩ kỹ
// scriptEn: câu tiếng Anh đơn giản để luyện nói với khách (TOEIC).
window.EA_CASES = [
  {
    id: "c01", part: 1, emoji: "👩‍💼", title: "Lần đầu khai thuế",
    client: "Chị Lan, 24 tuổi, nhân viên văn phòng",
    story: "Chị Lan mới đi làm năm đầu tiên ở Mỹ, độc thân, chỉ có 1 công việc trả lương. Chị muốn khai thuế để lấy tiền hoàn (refund) càng sớm càng tốt.",
    quote: "This is my first time filing taxes. What do I need to bring?",
    focus: "Form W-2",
    docs: [
      { name: "Form W-2 từ công ty", need: "must", why: "Ghi lương và số thuế công ty đã giữ lại (withholding). Không có W-2 thì không biết thu nhập và tiền hoàn." },
      { name: "Thẻ SSN + giấy tờ tùy thân có hình", need: "must", why: "Tên và SSN trên tờ khai phải khớp hồ sơ của SSA, sai là IRS từ chối e-file. Giấy tờ có hình giúp xác minh đúng người, chống mạo danh." },
      { name: "Số tài khoản ngân hàng (routing + account)", need: "maybe", why: "Chỉ cần nếu chị muốn nhận refund bằng direct deposit (nhanh nhất). Không có thì IRS gửi check." },
      { name: "Tờ khai thuế năm trước", need: "no", why: "Năm đầu đi làm nên không có. Với người đã khai năm trước thì AGI năm trước hay dùng để ký e-file." },
      { name: "Giấy đăng ký kết hôn", need: "no", why: "Chị độc thân nên không liên quan." },
      { name: "Form 1098 (lãi vay mua nhà)", need: "no", why: "Chị không có nhà. Hỏi để chắc, nhưng không phải giấy cần xin." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT vì sao cần Form W-2:",
      options: [
        "Form W-2 reports the employee's wages, which are gross income under IRC Sec. 61, and the federal income tax withheld, which is allowed as a credit against the tax under Sec. 31.",
        "Form W-2 is required because wages are only taxable if the employer reports them to the IRS.",
        "Form W-2 shows the employee's itemized deductions, which reduce adjusted gross income under Sec. 62."
      ],
      a: 0,
      exp: "Sec. 61 = mọi khoản thu nhập (kể cả lương) đều là gross income. Sec. 31 = tiền thuế đã bị giữ lại được trừ vào số thuế phải đóng. Đáp án 2 sai: thu nhập vẫn chịu thuế dù không ai báo cáo. Đáp án 3 sai: W-2 không ghi itemized deductions."
    },
    plain: {
      q: "Chọn cách nói với chị Lan bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Giấy W-2 cho biết năm rồi chị kiếm được bao nhiêu và công ty đã đóng thuế trước giùm chị bao nhiêu. Em lấy 2 con số đó để tính chị được hoàn lại bao nhiêu tiền.",
        "W-2 là Wage and Tax Statement theo Sec. 6051, box 1 là taxable wages, box 2 là federal withholding.",
        "Chị cần W-2 vì nếu không có thì IRS sẽ phạt chị ngay."
      ],
      a: 0,
      exp: "Cách 1 dễ hiểu và nói rõ lợi ích cho khách (tính tiền hoàn). Cách 2 đúng nhưng toàn thuật ngữ, khách nghe không hiểu. Cách 3 hù dọa và không đúng."
    },
    critical: {
      q: "Đã giữa tháng 2 mà chị Lan vẫn chưa nhận được W-2, công ty cũng không trả lời. Bạn làm gì trước?",
      options: [
        "Khai thuế luôn, đoán đại số lương theo tiền trong tài khoản",
        "Liên hệ công ty lần nữa; nếu vẫn không có thì gọi IRS, và cuối cùng có thể dùng Form 4852 (W-2 thay thế) dựa trên phiếu lương cuối năm",
        "Chờ đến khi nào có W-2 thì khai, kể cả trễ hạn",
        "Nộp Form 1040-X"
      ],
      a: 1,
      exp: "Thứ tự đúng: hỏi công ty → nhờ IRS liên hệ công ty → nếu vẫn không có thì dùng Form 4852 với số liệu ước tính hợp lý (từ pay stub cuối năm). Không được đoán đại, và không nên để trễ hạn (có thể xin gia hạn bằng Form 4868)."
    },
    scriptEn: "Please bring your W-2 form and your Social Security card. The W-2 shows how much you earned and how much tax was already paid. We use it to calculate your refund."
  },
  {
    id: "c02", part: 1, emoji: "🚗", title: "Tài xế Uber tự làm chủ",
    client: "Anh Minh, 31 tuổi, chạy Uber và DoorDash",
    story: "Anh Minh chạy xe toàn thời gian cho Uber và DoorDash. Anh không nhận W-2, chỉ nhận vài mẫu 1099. Anh nói: 'Xăng xe tốn nhiều lắm, em trừ hết giùm anh nha'.",
    quote: "I drive for Uber full-time. Can I deduct all my gas and car costs?",
    focus: "Sổ ghi số dặm (mileage log)",
    docs: [
      { name: "Form 1099-NEC / 1099-K từ các app", need: "must", why: "Cho biết thu nhập các app đã báo cáo cho IRS. Tờ khai phải khớp (hoặc giải thích được) với các con số này." },
      { name: "Sổ ghi số dặm chạy (mileage log)", need: "must", why: "Chi phí xe phải có chứng từ nghiêm ngặt (Sec. 274(d)): ngày, quãng đường, mục đích. Không có log thì có thể mất toàn bộ khoản trừ xe." },
      { name: "Báo cáo thu nhập cả năm trong app (annual summary)", need: "must", why: "App thường có bảng tổng kết gồm cả tiền tip, phí app thu và số dặm online. Dùng để đối chiếu với 1099." },
      { name: "Biên lai điện thoại, phụ kiện, phí cầu đường, bãi đậu xe", need: "maybe", why: "Trừ được nếu dùng cho công việc (phần trăm cho việc làm)." },
      { name: "Giấy tờ đã đóng estimated tax (1040-ES)", need: "maybe", why: "Nếu anh có đóng thuế ước tính hằng quý thì phải ghi vào để trừ, không thì đóng thuế 2 lần." },
      { name: "Form W-2", need: "no", why: "Tài xế app là người tự làm chủ (independent contractor), không phải nhân viên nên không có W-2 từ app." },
      { name: "Hóa đơn xăng đổ cho chuyến đi chơi gia đình", need: "no", why: "Chi phí cá nhân không bao giờ được trừ (Sec. 262)." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT vì sao cần mileage log:",
      options: [
        "Car expenses are deductible without records as long as the amount is reasonable compared with income.",
        "Under Sec. 274(d), expenses for listed property such as a passenger automobile must be substantiated by adequate records showing the amount, date, and business purpose of each use; estimates are not accepted.",
        "A mileage log is required only if the taxpayer uses the actual expense method, not the standard mileage rate."
      ],
      a: 1,
      exp: "Sec. 274(d) yêu cầu chứng từ chặt cho xe (listed property). Dùng standard mileage rate cũng PHẢI có số dặm công việc, nên đáp án 3 sai. Đáp án 1 sai vì 'hợp lý' không thay thế được chứng từ (không áp dụng Cohan rule cho 274(d))."
    },
    plain: {
      q: "Chọn cách nói với anh Minh bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Anh cứ đưa em tổng tiền xăng, em trừ hết cho anh.",
        "Muốn trừ tiền xe thì luật bắt phải có sổ ghi mỗi ngày anh chạy bao nhiêu dặm cho công việc. Có sổ này thì nếu IRS hỏi, anh giữ được khoản trừ; không có thì họ có thể gạch hết và anh phải đóng thêm thuế cộng tiền phạt.",
        "Theo Sec. 274(d) và Treas. Reg. 1.274-5T, anh cần contemporaneous substantiation cho listed property."
      ],
      a: 1,
      exp: "Cách 2 nói đúng luật nhưng bằng lời đời thường, có lý do và hậu quả rõ ràng. Cách 1 sai luật (tiền xăng đi chơi không trừ được). Cách 3 đúng nhưng khách không hiểu."
    },
    critical: {
      q: "Anh Minh có lời ròng (net profit) từ chạy xe là $380 trong năm. Anh có phải đóng self-employment tax không?",
      options: [
        "Có, mọi khoản thu nhập tự làm chủ đều chịu SE tax",
        "Không, SE tax chỉ áp dụng khi net earnings from self-employment từ $400 trở lên",
        "Chỉ khi anh có W-2",
        "Chỉ khi anh lập công ty"
      ],
      a: 1,
      exp: "Ngưỡng SE tax là net earnings from self-employment ≥ $400. Lưu ý: dù không đóng SE tax, thu nhập $380 vẫn tính vào thu nhập chịu thuế income tax."
    },
    scriptEn: "To deduct your car costs, you need a mileage log. Please write down the date, the miles, and the reason for each business trip. Without it, the IRS can deny the deduction."
  },
  {
    id: "c03", part: 1, emoji: "👩‍👧", title: "Mẹ đơn thân & tín dụng thuế",
    client: "Chị Hoa, 35 tuổi, có 1 bé 4 tuổi",
    story: "Chị Hoa ly thân từ đầu năm (chưa ly hôn xong), sống riêng với bé. Chị gửi bé đi nhà trẻ để đi làm. Chị muốn khai Head of Household và nhận các khoản credit cho con.",
    quote: "I take care of my daughter alone. Can I file as head of household?",
    focus: "Giấy tờ chứng minh bé sống cùng chị",
    docs: [
      { name: "SSN của bé", need: "must", why: "Child Tax Credit cần bé có SSN hợp lệ. Thiếu là mất credit." },
      { name: "Giấy tờ chứng minh bé sống với chị hơn nửa năm (giấy nhà trẻ, giấy bác sĩ, hợp đồng thuê nhà có tên)", need: "must", why: "HOH và EITC đều yêu cầu bé sống cùng chị hơn nửa năm. Đây là điều IRS hay kiểm tra nhất." },
      { name: "Tên, địa chỉ, mã số thuế (TIN) của nhà trẻ", need: "must", why: "Form 2441 (Child and Dependent Care Credit) bắt buộc ghi thông tin người/nơi giữ trẻ." },
      { name: "Hóa đơn tiền nhà, điện nước, đi chợ", need: "must", why: "HOH yêu cầu chị trả hơn một nửa chi phí duy trì nhà. Có hóa đơn là có bằng chứng." },
      { name: "Thời điểm chồng dọn ra ở riêng", need: "must", why: "Người đã kết hôn chỉ được coi như 'chưa kết hôn' để khai HOH nếu vợ chồng không sống chung trong 6 tháng cuối năm (cùng các điều kiện khác)." },
      { name: "Giấy khai sinh của chị", need: "no", why: "Không cần cho các điều kiện trên." }
    ],
    legal: {
      q: "Vì sao người làm thuế (preparer) PHẢI hỏi kỹ và giữ giấy tờ chứng minh nơi ở của bé? Chọn câu đúng nhất:",
      options: [
        "Because Sec. 6695(g) imposes a penalty on paid preparers who fail to meet due diligence requirements (Form 8867, knowledge, and record retention) when claiming EITC, CTC/ACTC/ODC, AOTC, or HOH filing status.",
        "Because the taxpayer must attach the child's school records to the return.",
        "Because only Enrolled Agents may claim the EITC for a client."
      ],
      a: 0,
      exp: "Due diligence của preparer theo Sec. 6695(g): hoàn thành Form 8867, hỏi thêm khi thông tin có vẻ không khớp (knowledge requirement), và giữ hồ sơ 3 năm. Không phải đính kèm giấy tờ vào tờ khai."
    },
    plain: {
      q: "Chọn cách nói với chị Hoa bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Mấy giấy này IRS bắt em phải xin, chị không đưa thì em không làm.",
        "Mấy khoản tiền cho con khá lớn nên IRS hay kiểm tra lại. Nếu mình có giấy nhà trẻ hay giấy bác sĩ ghi địa chỉ của chị, thì khi IRS hỏi mình đưa ra liền, chị không bị đòi lại tiền.",
        "Chị cần chứng minh qualifying child residency test cho EITC và HOH theo Sec. 2(b) và Sec. 32(c)."
      ],
      a: 1,
      exp: "Cách 2 nói lợi ích cho khách: được bảo vệ khi bị kiểm tra. Cách 1 làm khách khó chịu. Cách 3 khách không hiểu."
    },
    critical: {
      q: "Chồng chị Hoa dọn ra vào tháng 9 (tức chỉ ở riêng 4 tháng cuối năm), hai người chưa ly hôn. Chị có được khai HOH không?",
      options: [
        "Được, vì chị nuôi con một mình",
        "Không. Chị vẫn bị coi là đã kết hôn, vì vợ chồng còn sống chung trong 6 tháng cuối năm. Chị chỉ chọn được MFJ hoặc MFS",
        "Được, chỉ cần nộp đơn ly hôn trước 31/12",
        "Chỉ được khai Single"
      ],
      a: 1,
      exp: "Điều kiện 'considered unmarried' cần vợ chồng không sống chung trong 6 tháng cuối năm. Chỉ nộp đơn ly hôn là chưa đủ. Chưa có bản án ly hôn hay separate maintenance thì không được khai Single."
    },
    scriptEn: "The IRS often reviews these credits. Please bring a daycare or doctor's record with your address. It proves your daughter lived with you for more than half of the year."
  },
  {
    id: "c04", part: 1, emoji: "📈", title: "Bán cổ phiếu và crypto",
    client: "Anh Tuấn, 28 tuổi, kỹ sư IT",
    story: "Anh Tuấn bán một ít cổ phiếu trên Robinhood và đổi Bitcoin sang Ethereum vài lần trên một sàn crypto. Anh nghĩ 'đổi coin qua coin thì chưa rút tiền ra, không cần khai'.",
    quote: "I only swapped one coin for another. I didn't cash out, so it's not taxable, right?",
    focus: "Giấy tờ về giá mua (cost basis)",
    docs: [
      { name: "Form 1099-B từ công ty môi giới chứng khoán", need: "must", why: "Ghi tiền bán, ngày mua/bán và thường có cả cost basis. Dùng để điền Form 8949 và Schedule D." },
      { name: "Lịch sử giao dịch đầy đủ từ sàn crypto (file CSV)", need: "must", why: "Mỗi lần đổi coin là một lần 'bán'. Cần ngày, số lượng, giá trị lúc mua và lúc đổi để tính lời/lỗ." },
      { name: "Form 1099-DA từ sàn crypto (nếu có)", need: "maybe", why: "Mẫu mới cho giao dịch digital asset qua broker, bắt đầu áp dụng cho giao dịch từ năm 2025. Năm đầu chủ yếu ghi tiền bán (gross proceeds), giá mua vẫn phải tự chứng minh." },
      { name: "Form 1099-DIV, 1099-INT", need: "maybe", why: "Nếu tài khoản có cổ tức hay tiền lãi thì cũng phải khai." },
      { name: "Hình chụp số dư ví hiện tại", need: "no", why: "Số dư không cho biết lời lỗ. Thứ cần là lịch sử từng giao dịch." },
      { name: "Form W-2", need: "maybe", why: "Anh có đi làm nên vẫn cần cho phần lương, nhưng không liên quan phần cổ phiếu/crypto." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT vì sao cần chứng từ cost basis:",
      options: [
        "Gain is the amount realized minus the adjusted basis (Sec. 1001); basis is generally cost (Sec. 1012). The taxpayer bears the burden of proving basis; if it cannot be substantiated, basis may be treated as zero.",
        "Basis is only required for assets held less than one year.",
        "The IRS calculates basis automatically for all digital assets, so the taxpayer does not need records."
      ],
      a: 0,
      exp: "Lời = tiền nhận được − basis (Sec. 1001), basis thường = giá mua (Sec. 1012). Người nộp thuế phải tự chứng minh basis. Không chứng minh được thì có thể bị tính basis = 0."
    },
    plain: {
      q: "Chọn cách nói với anh Tuấn bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Đổi coin qua coin không tính thuế nên anh khỏi lo.",
        "Muốn biết anh lời bao nhiêu thì phải biết anh mua vào giá bao nhiêu. Nếu không có giấy chứng minh giá mua, IRS có thể coi như anh mua giá 0 đồng, nghĩa là toàn bộ tiền bán đều bị tính là tiền lời và anh đóng thuế nhiều hơn.",
        "Anh cần cung cấp adjusted basis để tính realized gain theo Sec. 1001(a)."
      ],
      a: 1,
      exp: "Cách 2 đưa ra ví dụ dễ hình dung (giá mua = 0 thì thuế cao). Cách 1 sai luật: đổi coin là một lần bán (taxable exchange). Cách 3 khách không hiểu."
    },
    critical: {
      q: "Anh Tuấn mua 1 ETH ngày 10/03/2024 và đổi sang Bitcoin ngày 10/03/2025. Lời từ giao dịch này là loại gì?",
      options: [
        "Long-term, vì giữ đúng 1 năm",
        "Short-term, vì phải giữ HƠN 1 năm mới là long-term; ngày bắt đầu tính là ngày sau ngày mua",
        "Không có lời vì chưa đổi ra đô la",
        "Ordinary income như lương"
      ],
      a: 1,
      exp: "Long-term cần giữ hơn 1 năm. Holding period tính từ ngày SAU ngày mua. Mua 10/03/2024 thì phải bán từ 11/03/2025 trở đi mới là long-term. Bẫy kinh điển trong đề thi!"
    },
    scriptEn: "Swapping one coin for another is a sale for tax purposes. Please download your full transaction history. We need your purchase price to calculate your gain."
  },
  {
    id: "c05", part: 1, emoji: "🕯️", title: "Ba mất, con lo giấy tờ thuế",
    client: "Chị Thảo, con gái của ông Sáu (mất tháng 5)",
    story: "Ông Sáu mất tháng 5, để lại một căn nhà và một tài khoản ngân hàng. Chị Thảo được tòa chỉ định làm người thi hành di chúc (executor). Chị muốn bán căn nhà và hỏi phải khai thuế gì.",
    quote: "My father passed away in May. I'm the executor. What tax forms do I need to file?",
    focus: "Giấy định giá nhà vào ngày mất (date-of-death appraisal)",
    docs: [
      { name: "Giấy chứng tử", need: "must", why: "Xác định ngày mất: chia năm thuế cuối cùng của ông và là mốc định giá tài sản." },
      { name: "Giấy tòa chỉ định executor (letters testamentary)", need: "must", why: "Chứng minh chị có quyền thay mặt người mất làm việc với IRS." },
      { name: "Form 56 (Notice Concerning Fiduciary Relationship)", need: "must", why: "Báo cho IRS biết chị là người đại diện (fiduciary) để IRS gửi thư từ cho chị." },
      { name: "Giấy định giá nhà vào ngày mất", need: "must", why: "Basis của căn nhà được 'reset' về giá thị trường ngày mất (step-up). Đây là bằng chứng để giảm tiền lời khi bán." },
      { name: "W-2, 1099 của ông từ 1/1 đến ngày mất", need: "must", why: "Dùng cho tờ khai cuối cùng (final Form 1040) của ông." },
      { name: "Giấy tờ mua nhà gốc của ông từ năm 1990", need: "maybe", why: "Thường không cần vì basis đã reset theo giá ngày mất. Chỉ hữu ích để tham khảo hoặc trường hợp đặc biệt." },
      { name: "Bằng lái xe của chị Thảo", need: "no", why: "Không phải giấy tờ thuế cần thiết." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT vì sao cần giấy định giá nhà vào ngày mất:",
      options: [
        "Under Sec. 1015, the heir takes the decedent's original cost basis (carryover basis).",
        "Under Sec. 1014, the basis of property acquired from a decedent is generally its fair market value at the date of death (or the alternate valuation date if elected), so a qualified appraisal substantiates the stepped-up basis.",
        "Appraisals are only needed if the estate owes estate tax."
      ],
      a: 1,
      exp: "Sec. 1014 = basis tài sản thừa kế = FMV ngày mất (hoặc alternate valuation date 6 tháng sau nếu chọn). Sec. 1015 là quy tắc cho tài sản được TẶNG khi còn sống, không phải thừa kế. Kể cả khi không phải đóng estate tax, vẫn cần chứng minh basis khi bán."
    },
    plain: {
      q: "Chọn cách nói với chị Thảo bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Khi ba mất, giá của căn nhà được tính lại theo giá thị trường ngày ba mất. Ví dụ ba mua $100,000, ngày mất nhà đáng $500,000, chị bán $510,000 thì chỉ bị tính lời $10,000 thôi. Giấy định giá chính là bằng chứng cho con số $500,000 đó.",
        "Chị phải đóng thuế trên toàn bộ $510,000 tiền bán nhà.",
        "Chị cần stepped-up basis theo Sec. 1014(a)(1), substantiate bằng qualified appraisal."
      ],
      a: 0,
      exp: "Ví dụ con số cụ thể giúp khách hiểu ngay lợi ích (tiết kiệm thuế rất nhiều). Cách 2 sai. Cách 3 khách không hiểu."
    },
    critical: {
      q: "Sau khi ông mất, tài khoản ngân hàng (giờ thuộc estate) sinh ra $800 tiền lãi trong năm. Estate có phải nộp Form 1041 không?",
      options: [
        "Không, estate không bao giờ phải khai thuế",
        "Có, estate phải nộp Form 1041 nếu gross income trong năm từ $600 trở lên",
        "Chỉ khi estate lớn hơn mức miễn thuế estate tax",
        "Ghi $800 vào tờ khai cá nhân của chị Thảo"
      ],
      a: 1,
      exp: "Form 1041 bắt buộc khi gross income của estate ≥ $600 (hoặc có beneficiary là nonresident alien). Estate cũng cần xin EIN riêng (Form SS-4). Form 1041 (thuế thu nhập) khác Form 706 (estate tax)."
    },
    scriptEn: "When your father passed away, the value of the house was reset to its market value on that date. Please get an appraisal. It can save you a lot of tax when you sell."
  },
  {
    id: "c06", part: 1, emoji: "🇻🇳", title: "Tài khoản ngân hàng ở Việt Nam",
    client: "Anh Khoa, 40 tuổi, có thẻ xanh",
    story: "Anh Khoa có sổ tiết kiệm ở Việt Nam, có lúc số dư lên tới khoảng $30,000. Mỗi năm có tiền lãi khoảng $900. Anh nói: 'Tiền ở Việt Nam thì Mỹ đâu có biết, khỏi khai'.",
    quote: "My savings account is in Vietnam. The U.S. doesn't need to know about it, right?",
    focus: "Số dư cao nhất của từng tài khoản nước ngoài",
    docs: [
      { name: "Số dư CAO NHẤT trong năm của từng tài khoản ở VN", need: "must", why: "FBAR yêu cầu báo cáo giá trị tối đa (maximum value) của mỗi tài khoản, không phải số dư cuối năm." },
      { name: "Sao kê / sổ tiết kiệm cả năm", need: "must", why: "Dùng để tìm số dư cao nhất và tiền lãi phải khai." },
      { name: "Tiền lãi nhận từ ngân hàng VN", need: "must", why: "Người cư trú Mỹ (có thẻ xanh) bị đánh thuế trên thu nhập toàn cầu, nên tiền lãi ở VN phải ghi vào Form 1040." },
      { name: "Tên ngân hàng, địa chỉ, số tài khoản", need: "must", why: "Thông tin bắt buộc trên FinCEN Form 114 (FBAR)." },
      { name: "Thuế đã khấu trừ ở Việt Nam (nếu có)", need: "maybe", why: "Có thể dùng để xin Foreign Tax Credit, tránh đóng thuế hai lần." },
      { name: "Hộ chiếu Việt Nam", need: "no", why: "Không cần để làm FBAR hay khai thuế." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT về nghĩa vụ báo cáo của anh Khoa:",
      options: [
        "A U.S. person must file FinCEN Form 114 (FBAR) if the aggregate maximum value of foreign financial accounts exceeds $10,000 at any time during the calendar year. The FBAR is filed electronically with FinCEN, separately from the income tax return.",
        "A green card holder is a nonresident alien and does not report foreign accounts.",
        "FBAR is attached to Form 1040 and is only required if the year-end balance exceeds $50,000."
      ],
      a: 0,
      exp: "Người có thẻ xanh là U.S. person (resident alien). Ngưỡng FBAR là TỔNG giá trị cao nhất > $10,000 vào BẤT KỲ lúc nào. FBAR nộp điện tử cho FinCEN (BSA E-Filing), không kèm 1040. Hạn 15/4, tự động gia hạn đến 15/10. Ngưỡng $50,000 là của Form 8938 (người độc thân ở Mỹ)."
    },
    plain: {
      q: "Chọn cách nói với anh Khoa bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Đúng rồi anh, tiền ở VN thì khỏi khai.",
        "Ở Mỹ có thẻ xanh thì phải khai thu nhập ở mọi nơi trên thế giới, kể cả tiền lãi ở VN. Ngoài ra, nếu tổng tiền trong các tài khoản nước ngoài có lúc vượt $10,000, anh phải báo cáo riêng. Đây chỉ là báo cáo, không phải đóng thêm thuế, nhưng không khai thì tiền phạt có thể rất nặng.",
        "Anh có FBAR filing requirement theo 31 U.S.C. 5314 và có thể có Form 8938 theo Sec. 6038D."
      ],
      a: 1,
      exp: "Cách 2 nói rõ 3 ý: phải khai thu nhập toàn cầu, FBAR chỉ là báo cáo (giảm lo lắng), và hậu quả nếu không làm. Cách 1 sai. Cách 3 khách không hiểu."
    },
    critical: {
      q: "Anh Khoa có 3 tài khoản ở VN, số dư cao nhất mỗi cái là $4,000, $3,500 và $3,000 (không cùng thời điểm). Có phải nộp FBAR không?",
      options: [
        "Không, vì không tài khoản nào vượt $10,000",
        "Có, vì CỘNG giá trị cao nhất của các tài khoản lại = $10,500 > $10,000",
        "Chỉ khi số dư cuối năm > $10,000",
        "Chỉ khi có tiền lãi > $10,000"
      ],
      a: 1,
      exp: "FBAR dùng tổng (aggregate) của các giá trị cao nhất, kể cả khi các mức cao nhất xảy ra vào thời điểm khác nhau. $4,000 + $3,500 + $3,000 = $10,500 → phải nộp. Đây là bẫy hay gặp!"
    },
    scriptEn: "As a green card holder, you must report income from all countries. If your foreign accounts were worth more than ten thousand dollars at any time, you must also file a separate report called the FBAR."
  },
  {
    id: "c07", part: 2, emoji: "💅", title: "Hai bạn mở tiệm nail",
    client: "Chị Vy và chị Ngọc, mở tiệm nail chung",
    story: "Hai chị lập một LLC, mỗi người góp vốn 50%. Chị Vy góp $40,000 tiền mặt, chị Ngọc góp máy móc và đồ nghề. Hai chị không nộp đơn chọn loại hình thuế nào cả.",
    quote: "We opened an LLC together. Do we file our business taxes on our personal returns?",
    focus: "Operating agreement (thỏa thuận hoạt động)",
    docs: [
      { name: "Operating agreement của LLC", need: "must", why: "Quy định cách chia lời/lỗ, vốn góp, quyền rút tiền. Partnership chia theo thỏa thuận này (nếu có substantial economic effect)." },
      { name: "Thư cấp EIN của IRS", need: "must", why: "LLC nhiều thành viên phải có EIN để nộp Form 1065 và phát K-1." },
      { name: "Giấy tờ góp vốn: tiền mặt và danh sách máy móc kèm giá mua/giá trị", need: "must", why: "Máy móc góp vào giữ nguyên basis của người góp (Sec. 723). Cần để tính basis của từng thành viên và khấu hao." },
      { name: "Sổ sách thu chi, sao kê ngân hàng của tiệm", need: "must", why: "Để làm Form 1065 (thu nhập, chi phí, guaranteed payments)." },
      { name: "Form 8832 hoặc 2553 (nếu đã nộp)", need: "maybe", why: "Chỉ có nếu LLC đã chọn bị đánh thuế như corporation / S corporation. Ở đây chưa nộp nên áp dụng mặc định." },
      { name: "W-2 của hai chị từ tiệm", need: "no", why: "Thành viên partnership không phải nhân viên của partnership, nên không nhận W-2. Tiền nhận được là guaranteed payments hoặc phần chia lời." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT về cách LLC này bị đánh thuế:",
      options: [
        "Under the check-the-box regulations (Reg. 301.7701-3), a domestic LLC with two or more members is classified by default as a partnership. It files Form 1065, an information return, and each member reports her distributive share from Schedule K-1.",
        "Every LLC is taxed as a C corporation unless it elects otherwise.",
        "A two-member LLC is a disregarded entity and reports on Schedule C."
      ],
      a: 0,
      exp: "Mặc định: LLC ≥ 2 thành viên = partnership; LLC 1 thành viên = disregarded entity. Muốn thành corporation thì nộp Form 8832, muốn thành S corp thì nộp Form 2553. Form 1065 hạn ngày 15 tháng thứ 3 (15/3 nếu năm dương lịch)."
    },
    plain: {
      q: "Chọn cách nói với hai chị bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Tiệm tự đóng thuế, hai chị không cần làm gì trên tờ khai cá nhân.",
        "Tiệm phải làm một tờ khai riêng nhưng tiệm không đóng thuế. Tiền lời được chia cho hai chị theo giấy thỏa thuận, rồi mỗi chị đóng thuế trên phần của mình trong tờ khai cá nhân. Vì vậy giấy thỏa thuận góp vốn rất quan trọng: nó quyết định mỗi người chịu thuế bao nhiêu.",
        "Đây là pass-through entity, distributive share flow-through qua K-1 vào Schedule E."
      ],
      a: 1,
      exp: "Cách 2 giải thích 'pass-through' bằng lời thường và nối với lý do cần operating agreement. Cách 1 sai. Cách 3 khách không hiểu."
    },
    critical: {
      q: "Chị Ngọc góp máy móc có basis $10,000 (giá thị trường $25,000). Basis phần vốn của chị Ngọc trong LLC (outside basis) ban đầu là bao nhiêu?",
      options: ["$25,000", "$10,000", "$0", "$15,000"],
      a: 1,
      exp: "Góp tài sản vào partnership thường không tính lời/lỗ (Sec. 721). Outside basis = tiền + basis của tài sản góp = $10,000 (Sec. 722). LLC nhận máy với basis $10,000 (Sec. 723)."
    },
    scriptEn: "Your LLC files its own information return, but it does not pay income tax. The profit passes through to both of you, so your operating agreement decides how much each person reports."
  },
  {
    id: "c08", part: 2, emoji: "🏢", title: "Chủ S corp không trả lương",
    client: "Anh Phúc, chủ duy nhất của một S corporation (công ty IT)",
    story: "Công ty lời $200,000. Anh Phúc làm việc full-time nhưng không trả lương cho mình, chỉ rút tiền ra dưới dạng distribution để 'khỏi đóng payroll tax'. Năm nay anh muốn rút thêm nhiều hơn số lời.",
    quote: "I don't pay myself a salary. I just take distributions. That's legal, right?",
    focus: "Payroll và hồ sơ tính basis (Form 7203)",
    docs: [
      { name: "Hồ sơ payroll: W-2, Form 941 của chủ", need: "must", why: "Cổ đông làm việc cho S corp phải nhận lương hợp lý (reasonable compensation). Cần xem đã trả lương chưa." },
      { name: "Sổ theo dõi các lần rút tiền (distributions)", need: "must", why: "Để biết anh rút bao nhiêu, so với basis và AAA." },
      { name: "Hồ sơ tính basis cổ phần (Form 7203 các năm trước)", need: "must", why: "Distribution vượt quá stock basis sẽ bị tính là capital gain. Form 7203 bắt buộc khi cổ đông nhận distribution." },
      { name: "Thư IRS chấp nhận Form 2553", need: "must", why: "Xác nhận công ty thật sự là S corp và từ năm nào." },
      { name: "Lương trung bình thị trường cho công việc tương tự", need: "maybe", why: "Bằng chứng tốt để chứng minh mức lương anh chọn là hợp lý." },
      { name: "Schedule C của anh Phúc", need: "no", why: "S corp khai trên Form 1120-S, không phải Schedule C." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT:",
      options: [
        "S corporation shareholders who are not employees may take unlimited distributions tax-free.",
        "A shareholder-employee who performs substantial services must receive reasonable compensation subject to employment taxes; the IRS may recharacterize distributions as wages. Distributions in excess of stock basis are treated as gain from the sale of stock, and shareholders receiving distributions must attach Form 7203 to substantiate basis.",
        "Distributions from an S corporation are always taxed as qualified dividends."
      ],
      a: 1,
      exp: "Hai ý chính: (1) reasonable compensation, IRS có thể đổi distribution thành lương và đòi payroll tax + phạt; (2) distribution vượt basis = capital gain, phải có Form 7203."
    },
    plain: {
      q: "Chọn cách nói với anh Phúc bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Anh làm việc cho công ty thì luật bắt công ty phải trả cho anh một mức lương hợp lý, giống lương thuê người khác làm việc đó. Nếu không, IRS có thể coi tiền anh rút ra là lương rồi đòi thuế lương cộng tiền phạt. Còn nếu rút nhiều hơn số vốn và lời còn lại trong công ty, phần dư sẽ bị tính thuế như tiền lời bán cổ phần.",
        "Anh rút bao nhiêu cũng được, S corp không bị đánh thuế.",
        "Anh cần reasonable compensation theo Rev. Rul. 74-44 và track stock basis per Sec. 1367."
      ],
      a: 0,
      exp: "Cách 1 dài hơn nhưng khách hiểu cả 2 rủi ro. Cách 2 sai. Cách 3 khách không hiểu."
    },
    critical: {
      q: "Đầu năm stock basis của anh Phúc là $30,000, phần lời công ty chia cho anh trong năm là $200,000, anh rút $260,000. Phần rút vượt basis là bao nhiêu và bị đánh thuế thế nào?",
      options: [
        "$0, mọi distribution đều miễn thuế",
        "$30,000, tính là capital gain",
        "$260,000, tính là lương",
        "$60,000, tính là ordinary income"
      ],
      a: 1,
      exp: "Basis tăng thêm phần lời trước, rồi mới trừ distribution: $30,000 + $200,000 = $230,000. Rút $260,000 → vượt $30,000 → capital gain (S corp không có E&P). Phần $230,000 không bị đánh thuế lần nữa, vì phần lời đã được khai qua K-1."
    },
    scriptEn: "Because you work for your company, you need to pay yourself a reasonable salary. Otherwise, the IRS can treat your distributions as wages and add penalties."
  },
  {
    id: "c09", part: 2, emoji: "🏠", title: "Cho thuê nhà lần đầu",
    client: "Cô Mai, 50 tuổi, có thêm 1 căn nhà cho thuê",
    story: "Cô Mai mua thêm một căn nhà để cho thuê, tự tìm người thuê và quyết định sửa chữa. Năm đầu bị lỗ vì sửa nhiều. MAGI của cô khoảng $120,000. Cô hỏi có trừ được tiền lỗ vào lương không.",
    quote: "My rental house lost money this year. Can I use that loss to lower my taxes?",
    focus: "Closing Disclosure (giấy tờ mua nhà)",
    docs: [
      { name: "Closing Disclosure / settlement statement khi mua nhà", need: "must", why: "Xác định basis của căn nhà và tách giá trị đất (không được khấu hao) khỏi giá trị nhà." },
      { name: "Form 1098 (lãi vay) và hóa đơn thuế nhà (property tax)", need: "must", why: "Là chi phí được trừ trên Schedule E." },
      { name: "Sổ ghi tiền thuê nhận được từng tháng", need: "must", why: "Thu nhập cho thuê phải khai đầy đủ, kể cả tiền đặt cọc giữ lại hoặc tiền thuê trả trước." },
      { name: "Hóa đơn sửa chữa, ghi rõ làm gì", need: "must", why: "Phải phân biệt repair (trừ ngay) và improvement (cộng vào basis, khấu hao dần). Hóa đơn ghi rõ việc làm thì mới phân loại đúng." },
      { name: "Số ngày cô hoặc người nhà ở căn nhà đó", need: "maybe", why: "Nếu ở cá nhân quá nhiều ngày, nhà bị coi là nhà để ở (Sec. 280A) và bị giới hạn khoản lỗ." },
      { name: "Giấy khai sinh của người thuê", need: "no", why: "Không liên quan đến thuế của cô." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT về khoản lỗ cho thuê:",
      options: [
        "Rental losses are always fully deductible against wages.",
        "Rental activities are generally passive under Sec. 469. However, an individual who actively participates may deduct up to $25,000 of rental losses against nonpassive income; the allowance is reduced by 50% of MAGI over $100,000 and is fully phased out at $150,000.",
        "Rental losses can never be deducted until the property is sold."
      ],
      a: 1,
      exp: "Sec. 469(i): special allowance $25,000 cho người active participation. Giảm 50% phần MAGI vượt $100,000, hết hẳn ở $150,000. Phần lỗ không được trừ thì chuyển sang năm sau (suspended) và được trừ hết khi bán nhà."
    },
    plain: {
      q: "Chọn cách nói với cô Mai bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Lỗ cho thuê thì mất luôn, không làm gì được.",
        "Vì cô tự quản lý căn nhà, luật cho trừ tối đa $25,000 tiền lỗ vào thu nhập khác. Nhưng thu nhập của cô khá cao nên mức này bị giảm bớt. Phần lỗ chưa được trừ thì không mất, nó được giữ lại cho các năm sau, hoặc trừ hết khi cô bán nhà.",
        "Khoản lỗ của cô là passive activity loss, bị giới hạn bởi Sec. 469(i) phase-out."
      ],
      a: 1,
      exp: "Cách 2 trấn an khách (lỗ không mất) và giải thích giới hạn đơn giản. Cách 1 sai. Cách 3 khách không hiểu."
    },
    critical: {
      q: "MAGI của cô Mai là $120,000. Cô được trừ tối đa bao nhiêu tiền lỗ cho thuê vào thu nhập khác trong năm nay?",
      options: ["$25,000", "$15,000", "$10,000", "$0"],
      a: 1,
      exp: "Phần vượt: $120,000 − $100,000 = $20,000. Mức giảm: 50% × $20,000 = $10,000. Còn lại: $25,000 − $10,000 = $15,000."
    },
    scriptEn: "Because you manage the rental yourself, you can deduct some of the loss this year. Any loss you can't use now is carried forward, so it is not lost."
  },
  {
    id: "c10", part: 2, emoji: "🍜", title: "Nhà hàng mua máy móc mới",
    client: "Anh Long, chủ nhà hàng phở (sole proprietor)",
    story: "Cuối tháng 12, anh Long đặt mua bếp và tủ lạnh công nghiệp $60,000, nhưng tháng 1 năm sau mới giao và lắp xong. Năm nay nhà hàng chỉ lời $20,000. Anh muốn trừ hết $60,000 ngay năm nay bằng Section 179.",
    quote: "I bought new kitchen equipment in December. Can I write off the whole cost this year?",
    focus: "Hóa đơn có ngày giao và ngày bắt đầu sử dụng (placed in service)",
    docs: [
      { name: "Hóa đơn mua máy, có ngày giao và ngày lắp đặt xong", need: "must", why: "Khấu hao và Section 179 bắt đầu từ năm tài sản được 'placed in service' (sẵn sàng sử dụng), không phải năm đặt mua hay trả tiền." },
      { name: "Bảng khấu hao các năm trước (Form 4562 cũ)", need: "must", why: "Để tiếp tục khấu hao đúng các tài sản cũ và biết tài sản nào đã bán hoặc bỏ." },
      { name: "Báo cáo lời lỗ (P&L) của nhà hàng", need: "must", why: "Section 179 bị giới hạn bởi thu nhập chịu thuế từ hoạt động kinh doanh." },
      { name: "Hợp đồng vay mua máy (nếu có)", need: "maybe", why: "Lãi vay kinh doanh được trừ. Mua bằng tiền vay vẫn được tính vào basis." },
      { name: "Hóa đơn mua tủ lạnh cho nhà riêng", need: "no", why: "Tài sản cá nhân không được khấu hao." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT:",
      options: [
        "Depreciation and the Sec. 179 deduction begin in the year property is placed in service, meaning ready and available for its specific use. The Sec. 179 deduction is also limited to taxable income from the active conduct of a trade or business; any disallowed amount is carried forward.",
        "Property is depreciable in the year it is ordered and paid for.",
        "Sec. 179 can create a net operating loss with no limitation."
      ],
      a: 0,
      exp: "Hai bẫy: (1) 'placed in service', không phải ngày mua; (2) Sec. 179 bị giới hạn bởi business income, phần thừa chuyển sang năm sau (không tạo ra lỗ)."
    },
    plain: {
      q: "Chọn cách nói với anh Long bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Anh trả tiền năm nay thì trừ năm nay.",
        "Luật tính theo ngày máy được lắp xong và dùng được, không tính theo ngày đặt mua. Máy lắp xong tháng 1 thì được trừ vào năm sau. Thêm nữa, khoản trừ đặc biệt này không được lớn hơn tiền lời của nhà hàng; phần dư thì để dành trừ các năm sau, không mất.",
        "Asset chưa placed in service, Sec. 179 bị business income limitation."
      ],
      a: 1,
      exp: "Cách 2 giải thích 2 quy tắc bằng lời thường và nói rõ phần dư không mất."
    },
    critical: {
      q: "Giả sử máy lắp xong ngay trong năm. Lời kinh doanh (trước Sec. 179) là $20,000, anh chọn Sec. 179 cho $60,000. Năm nay trừ được bao nhiêu?",
      options: ["$60,000", "$20,000, phần còn lại $40,000 chuyển sang năm sau", "$0", "$40,000"],
      a: 1,
      exp: "Sec. 179 bị giới hạn ở business taxable income ($20,000). Phần $40,000 không được trừ năm nay sẽ chuyển sang năm sau (carryforward). (Bonus depreciation thì không có giới hạn này. Đây là điểm khác biệt hay thi!)"
    },
    scriptEn: "The deduction starts when the equipment is ready to use, not when you order it. Please bring the invoice with the delivery and installation dates."
  },
  {
    id: "c11", part: 3, emoji: "📬", title: "Nhận thư CP2000 của IRS",
    client: "Bác Hùng, 62 tuổi, đã nghỉ hưu",
    story: "Bác Hùng hoảng hốt mang tới một lá thư CP2000. IRS nói bác quên khai $8,000 từ Form 1099-R (rút tiền hưu) và đề nghị bác đóng thêm thuế. Bác muốn em 'gọi IRS nói chuyện giùm bác'.",
    quote: "I got this scary letter from the IRS. Can you call them for me?",
    focus: "Form 2848 (giấy ủy quyền đại diện)",
    docs: [
      { name: "Lá thư CP2000 (đủ các trang)", need: "must", why: "Ghi số tiền IRS đề nghị điều chỉnh, lý do, và HẠN TRẢ LỜI. Phải trả lời đúng hạn." },
      { name: "Form 2848 có chữ ký của bác", need: "must", why: "EA chỉ được đại diện, nói chuyện và thương lượng với IRS thay khách khi có Form 2848." },
      { name: "Form 1099-R mà IRS nhắc đến", need: "must", why: "Kiểm tra xem số tiền có đúng không, có phải rollover (không chịu thuế) hay không." },
      { name: "Bản sao tờ khai năm đó", need: "must", why: "So sánh với thông tin IRS có để tìm chỗ thiếu." },
      { name: "Giấy tờ chứng minh tiền đã được rollover trong 60 ngày (nếu có)", need: "maybe", why: "Nếu tiền rút ra được chuyển vào IRA khác trong 60 ngày thì không bị đánh thuế. Có giấy này thì có thể không cần đóng thêm." },
      { name: "Form 8821", need: "no", why: "8821 chỉ cho phép XEM thông tin, không cho đại diện hay thương lượng. Bác cần em nói chuyện giùm nên phải dùng 2848." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT về Form 2848:",
      options: [
        "Form 2848 authorizes an eligible practitioner, such as an Enrolled Agent, to represent the taxpayer before the IRS for the tax matters and periods listed, including receiving confidential information and performing acts the taxpayer can perform, except those specifically excluded such as endorsing or cashing refund checks.",
        "Form 8821 and Form 2848 grant identical authority.",
        "An Enrolled Agent may represent any taxpayer without written authorization."
      ],
      a: 0,
      exp: "2848 = đại diện (representation). 8821 = chỉ xem thông tin (tax information authorization), không đại diện. EA cần ủy quyền bằng văn bản cho từng loại thuế và năm thuế."
    },
    plain: {
      q: "Chọn cách nói với bác Hùng bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Bác cứ kệ lá thư, IRS gửi thư hoài à.",
        "Bác đừng lo quá, thư này chưa phải là hóa đơn đòi tiền. Đây là IRS hỏi lại vì số liệu họ có khác với tờ khai của bác. Bác ký giấy ủy quyền này thì luật cho phép con nói chuyện với IRS thay bác. Mình phải trả lời trước ngày hạn ghi trong thư.",
        "CP2000 là Automated Underreporter notice, con cần POA để handle."
      ],
      a: 1,
      exp: "Cách 2 trấn an, giải thích bản chất lá thư, lý do cần ký giấy và nhắc hạn. Cách 1 nguy hiểm: bỏ qua thì IRS sẽ tự điều chỉnh rồi gửi thư đòi nợ."
    },
    critical: {
      q: "Kiểm tra thì thấy $8,000 đó bác đã chuyển sang một IRA khác sau 30 ngày (rollover hợp lệ). Bước tiếp theo đúng nhất là gì?",
      options: [
        "Đóng tiền theo thư CP2000 cho nhanh",
        "Trả lời CP2000 trước hạn: chọn 'không đồng ý', giải thích đây là rollover trong 60 ngày và gửi kèm bằng chứng (ví dụ Form 5498 hoặc sao kê IRA)",
        "Nộp tờ khai mới hoàn toàn",
        "Bỏ qua vì rollover không chịu thuế"
      ],
      a: 1,
      exp: "CP2000 là đề nghị điều chỉnh (proposed adjustment). Không đồng ý thì trả lời kèm bằng chứng trước hạn. Rollover trong 60 ngày không chịu thuế, nhưng vẫn phải khai trên tờ khai (ghi chữ 'Rollover')."
    },
    scriptEn: "Don't worry. This letter is not a bill. The IRS is asking about a difference in your return. Please sign this form so I can talk to the IRS for you."
  },
  {
    id: "c12", part: 3, emoji: "💸", title: "Nợ thuế không đủ tiền trả",
    client: "Chị Trang, làm tóc tự do, nợ IRS $38,000",
    story: "Chị Trang nợ $38,000 (gồm thuế, tiền phạt và tiền lãi) vì mấy năm không đóng estimated tax. Chị không đủ tiền trả một lần và sợ bị IRS lấy hết tiền trong tài khoản.",
    quote: "I owe the IRS money, but I can't pay it all at once. What can I do?",
    focus: "Tất cả tờ khai các năm đã nộp đủ (filing compliance)",
    docs: [
      { name: "Tất cả thư IRS gần nhất (CP14, CP501, CP503...)", need: "must", why: "Biết chính xác số nợ, năm nào, và đang ở giai đoạn nào của quá trình thu nợ." },
      { name: "Xác nhận đã nộp đủ tất cả tờ khai bắt buộc", need: "must", why: "IRS không cho trả góp nếu còn tờ khai chưa nộp. Đây là điều kiện đầu tiên." },
      { name: "Form 2848", need: "must", why: "Để em được đại diện chị làm việc với IRS (bộ phận thu nợ)." },
      { name: "Thu nhập và chi phí hàng tháng", need: "maybe", why: "Với streamlined installment agreement (nợ ≤ $50,000) thường không cần bảng tài chính chi tiết, nhưng vẫn nên có để chọn mức trả hằng tháng chị trả nổi." },
      { name: "Form 433-A / 433-F (bảng kê tài chính)", need: "maybe", why: "Cần nếu nợ lớn hơn mức streamlined hoặc xin Offer in Compromise / tình trạng 'không có khả năng trả' (CNC)." },
      { name: "Sổ đỏ nhà ở Việt Nam", need: "no", why: "Không cần ở bước này. (Nếu xin Offer in Compromise thì phải kê khai toàn bộ tài sản, kể cả ở nước ngoài.)" }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT:",
      options: [
        "Under Sec. 6159, the IRS may enter into an installment agreement. Individuals whose assessed balance of tax, penalties, and interest is $50,000 or less generally qualify for a streamlined agreement paid within 72 months (or before the collection statute expires), usually without a financial statement, provided all required returns have been filed.",
        "The IRS cannot collect if the taxpayer cannot pay in full.",
        "Installment agreements stop penalties and interest from accruing."
      ],
      a: 0,
      exp: "Streamlined IA: nợ ≤ $50,000, trả trong 72 tháng, phải nộp đủ tờ khai. Lưu ý: trả góp KHÔNG dừng tiền lãi; failure-to-pay penalty tiếp tục chạy nhưng được giảm mức trong thời gian có IA (nếu tờ khai nộp đúng hạn)."
    },
    plain: {
      q: "Chọn cách nói với chị Trang bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Nợ chưa tới $50,000 nên chị xin trả góp được, tối đa 6 năm, thường không cần nộp nhiều giấy tờ tài chính. Điều kiện là chị phải nộp đủ tờ khai các năm và đóng đúng thuế năm nay. Trong lúc trả góp, IRS thường không tịch thu tài khoản của chị, nhưng tiền lãi vẫn tính nên trả sớm được thì đỡ hơn.",
        "Chị cứ để đó, sau 3 năm IRS sẽ xóa nợ.",
        "Chị đủ điều kiện streamlined IA theo IRM 5.14.5, cần filing compliance."
      ],
      a: 0,
      exp: "Cách 1 cho khách lựa chọn rõ ràng, điều kiện và lưu ý về tiền lãi. Cách 2 sai: thời hạn thu nợ (CSED) là 10 năm từ ngày assessment (Sec. 6502), không phải 3 năm."
    },
    critical: {
      q: "Đang trả góp đều đặn thì năm sau chị Trang lại nợ thuế mới và không trả. Chuyện gì có thể xảy ra?",
      options: [
        "Không sao, IRS tự cộng vào khoản trả góp cũ",
        "Thỏa thuận trả góp có thể bị mặc định (default) và chấm dứt, vì một điều kiện là phải nộp tờ khai và đóng thuế đúng hạn trong thời gian trả góp",
        "IRS xóa luôn khoản nợ cũ",
        "Chị phải ra Tax Court"
      ],
      a: 1,
      exp: "Điều kiện để giữ IA: trả đúng hạn hàng tháng, nộp tờ khai và đóng thuế mới đúng hạn. Vi phạm thì IA có thể bị default/terminate và IRS tiếp tục thu nợ cưỡng chế."
    },
    scriptEn: "You can request a payment plan. Because you owe less than fifty thousand dollars, you can pay over up to six years. You must file all your returns and pay your current taxes on time."
  },
  {
    id: "c13", part: 3, emoji: "⚠️", title: "Thư dọa tịch thu (levy)",
    client: "Anh Đạt, chủ tiệm sửa xe",
    story: "Anh Đạt nhận Letter 1058: 'Final Notice of Intent to Levy and Notice of Your Right to a Hearing', ghi ngày 1/3. Hôm nay là 20/3. Anh nghĩ số nợ bị tính sai vì có một khoản đã trả mà IRS chưa ghi nhận.",
    quote: "The IRS says they will take my money. I think their numbers are wrong. What should I do?",
    focus: "Form 12153 (xin buổi điều trần CDP)",
    docs: [
      { name: "Letter 1058 có ghi ngày", need: "must", why: "Ngày trên thư quyết định hạn 30 ngày để xin Collection Due Process (CDP) hearing." },
      { name: "Form 12153 (Request for CDP or Equivalent Hearing)", need: "must", why: "Mẫu để xin buổi điều trần. Nộp đúng hạn thì IRS tạm ngừng levy và anh có quyền đưa lên Tax Court nếu không đồng ý kết quả." },
      { name: "Bằng chứng đã trả tiền (check đã rút, sao kê ngân hàng, xác nhận EFTPS)", need: "must", why: "Để chứng minh IRS ghi nhận thiếu khoản đã trả." },
      { name: "Form 2848", need: "must", why: "Để em được đại diện anh trong buổi hearing với IRS Independent Office of Appeals." },
      { name: "Bảng kê tài chính (Form 433-A)", need: "maybe", why: "Cần nếu anh muốn đề xuất phương án thu nợ khác (trả góp, OIC) trong buổi hearing." },
      { name: "Tờ khai thuế của em trai anh Đạt", need: "no", why: "Không liên quan." }
    ],
    legal: {
      q: "Chọn lời giải thích bằng NGÔN NGỮ LUẬT:",
      options: [
        "Under Sec. 6330, the taxpayer has 30 days from the date of the notice to request a Collection Due Process hearing using Form 12153. A timely request generally suspends levy action, and the Appeals determination may be petitioned to the Tax Court. A late request (within one year) receives only an equivalent hearing without Tax Court review.",
        "The taxpayer has 90 days to petition the Tax Court directly.",
        "Once Letter 1058 is issued, the taxpayer has no appeal rights."
      ],
      a: 0,
      exp: "CDP (levy) theo Sec. 6330: 30 ngày từ ngày ghi trên thư, nộp Form 12153. Trễ hạn nhưng trong 1 năm → equivalent hearing (không được ra Tax Court). 90 ngày là hạn của notice of deficiency (thư 90 ngày), một thủ tục khác."
    },
    plain: {
      q: "Chọn cách nói với anh Đạt bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Anh cứ gửi thư phàn nàn cho IRS lúc nào cũng được.",
        "Anh còn 10 ngày nữa là hết hạn 30 ngày. Nếu mình nộp đơn xin buổi điều trần trước hạn đó, IRS phải tạm ngừng lấy tiền của anh, và một bộ phận độc lập của IRS sẽ xem lại con số. Nếu vẫn không đồng ý, anh còn quyền đưa lên tòa án thuế. Trễ hạn là mất quyền quan trọng này.",
        "Anh cần timely CDP request theo Sec. 6330 để preserve Tax Court review."
      ],
      a: 1,
      exp: "Cách 2 nói rõ thời gian còn lại, lợi ích và hậu quả nếu trễ, đúng thứ khách cần để hành động ngay."
    },
    critical: {
      q: "Letter 1058 ghi ngày 1/3. Hạn cuối để nộp Form 12153 xin CDP hearing (không phải equivalent hearing) là khoảng ngày nào?",
      options: ["15/3", "31/3 (30 ngày từ ngày ghi trên thư)", "30/5 (90 ngày)", "1/3 năm sau"],
      a: 1,
      exp: "30 ngày tính từ ngày ghi trên thư → 31/3. Hôm nay 20/3 → còn khoảng 11 ngày. Phải nộp NGAY. Đã quá 30 ngày nhưng chưa quá 1 năm thì chỉ còn equivalent hearing."
    },
    scriptEn: "This is a final notice. You have thirty days from the date on the letter to request a hearing. If we file the form on time, the IRS must pause collection while Appeals reviews your case."
  },
  {
    id: "c14", part: 3, emoji: "🔍", title: "Bị kiểm toán (audit)",
    client: "Chị Phương, bán hàng online",
    story: "Chị Phương nhận thư mời kiểm toán tại văn phòng IRS (office audit) cho Schedule C năm 2023, kèm Form 4564 (Information Document Request) yêu cầu chứng từ chi phí quảng cáo và hàng tồn kho. Sau buổi làm việc, IRS gửi '30-day letter'.",
    quote: "The IRS wants to audit my online business. What documents should I prepare?",
    focus: "Đúng những chứng từ mà Form 4564 yêu cầu",
    docs: [
      { name: "Thư mời audit và Form 4564 (IDR)", need: "must", why: "IDR liệt kê CHÍNH XÁC những giấy tờ IRS muốn xem. Chuẩn bị đúng danh sách đó." },
      { name: "Hóa đơn quảng cáo (Facebook Ads, Google Ads) năm 2023", need: "must", why: "Chứng minh khoản chi quảng cáo đã trừ là có thật và dùng cho kinh doanh." },
      { name: "Sổ theo dõi hàng tồn kho đầu năm/cuối năm, hóa đơn mua hàng", need: "must", why: "Để chứng minh giá vốn hàng bán (COGS)." },
      { name: "Form 2848", need: "must", why: "Để em đại diện chị trong buổi audit. Nhiều trường hợp chị không cần có mặt." },
      { name: "Tờ khai và sổ sách năm 2021 và 2022", need: "maybe", why: "Chỉ đưa khi IRS yêu cầu. Không tự ý đưa thêm tài liệu ngoài phạm vi IDR." },
      { name: "Toàn bộ sao kê tài khoản cá nhân 10 năm", need: "no", why: "Không cần và không nên tự đưa ra những thứ không được yêu cầu." }
    ],
    legal: {
      q: "Sau audit, chị Phương nhận 30-day letter và không đồng ý. Chọn lời giải thích bằng NGÔN NGỮ LUẬT:",
      options: [
        "The 30-day letter proposes adjustments and allows the taxpayer to request a conference with the IRS Independent Office of Appeals. If the matter is not resolved, the IRS issues a statutory notice of deficiency (90-day letter) under Sec. 6212; the taxpayer then has 90 days (150 if addressed outside the U.S.) to petition the Tax Court without paying the tax first.",
        "The taxpayer must pay the tax before any appeal is possible.",
        "The 30-day letter is the final assessment and cannot be appealed."
      ],
      a: 0,
      exp: "Thứ tự: 30-day letter → Appeals → 90-day letter (notice of deficiency) → Tax Court trong 90 ngày (150 ngày nếu ở ngoài Mỹ). Tax Court là tòa duy nhất không bắt đóng thuế trước."
    },
    plain: {
      q: "Chọn cách nói với chị Phương bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Thư này mới là đề nghị của nhân viên kiểm toán, chưa phải quyết định cuối cùng. Mình có 30 ngày để xin một bộ phận độc lập của IRS xem lại. Nếu vẫn không xong, IRS sẽ gửi thư 90 ngày, lúc đó chị có quyền ra tòa án thuế mà chưa cần đóng tiền trước.",
        "Thôi chị đóng tiền đi cho xong, cãi với IRS không được đâu.",
        "Chị có thể request Appeals conference, sau đó nhận SNOD rồi petition Tax Court."
      ],
      a: 0,
      exp: "Cách 1 vẽ ra lộ trình rõ ràng, cho khách thấy còn quyền lợi. Cách 2 bỏ mất quyền lợi của khách."
    },
    critical: {
      q: "Nhân viên audit hỏi miệng: 'Năm 2022 chị có bán hàng online không?' (không có trong IDR). Bạn nên làm gì?",
      options: [
        "Trả lời đại khái để audit nhanh xong",
        "Không đoán. Trả lời trung thực trong phạm vi mình biết chắc, hoặc xin ghi nhận câu hỏi để kiểm tra với khách rồi trả lời sau. Tuyệt đối không cung cấp thông tin sai (Circular 230 §10.22, §10.51)",
        "Nói dối là không có để bảo vệ khách",
        "Đứng dậy ra về"
      ],
      a: 1,
      exp: "EA phải trung thực, cẩn thận (due diligence) và không được đưa thông tin sai hoặc gây hiểu lầm cho IRS. Đồng thời cũng không cần đoán hay tự mở rộng phạm vi audit. Trả lời chính xác sau khi đã kiểm tra là cách chuyên nghiệp."
    },
    scriptEn: "This letter is only a proposal. You have thirty days to ask the IRS Appeals Office to review it. If we still disagree, you can go to Tax Court before paying."
  },
  {
    id: "c15", part: 3, emoji: "⚖️", title: "Khách muốn giấu lỗi cũ",
    client: "Anh Bình, khách mới chuyển từ preparer khác",
    story: "Xem tờ khai năm ngoái của anh Bình (do người khác làm), bạn thấy họ đã trừ tiền đi du lịch gia đình như chi phí kinh doanh. Anh Bình nói: 'Năm nay em cứ làm giống năm ngoái, đừng nói gì hết nha'.",
    quote: "Just do it the same way as last year. Nobody will notice.",
    focus: "Chứng từ chi phí kinh doanh thật",
    docs: [
      { name: "Tờ khai năm trước (bản đầy đủ)", need: "must", why: "Để phát hiện lỗi cũ và tránh lặp lại." },
      { name: "Chứng từ cho từng chi phí kinh doanh định trừ năm nay", need: "must", why: "Chi phí phải 'ordinary and necessary' cho kinh doanh (Sec. 162). Chi phí cá nhân không được trừ (Sec. 262)." },
      { name: "Lịch trình chuyến đi, mục đích công việc (nếu có đi công tác thật)", need: "maybe", why: "Đi công tác thật thì có thể trừ, nhưng phải có bằng chứng mục đích kinh doanh." },
      { name: "Hình chụp du lịch gia đình", need: "no", why: "Không chứng minh được mục đích kinh doanh. Ngược lại còn cho thấy đây là chuyến đi cá nhân." }
    ],
    legal: {
      q: "Theo Circular 230, khi biết tờ khai cũ của khách có lỗi, EA phải làm gì? Chọn lời giải thích bằng NGÔN NGỮ LUẬT:",
      options: [
        "Under Circular 230 §10.21, a practitioner who knows that a client has not complied with the revenue laws or has made an error or omission must promptly advise the client of the noncompliance, error, or omission and its consequences. The practitioner is not required to notify the IRS, but may not prepare the current return repeating the improper position.",
        "The practitioner must immediately report the client to the IRS.",
        "The practitioner may ignore errors on returns prepared by another preparer."
      ],
      a: 0,
      exp: "§10.21: phải báo cho KHÁCH (không bắt báo IRS) về lỗi và hậu quả. Ngoài ra §10.22 (due diligence) và §10.34 (không ký tờ khai có vị trí không hợp lý) không cho phép làm sai năm nay."
    },
    plain: {
      q: "Chọn cách nói với anh Bình bằng NGÔN NGỮ CỦA KHÁCH:",
      options: [
        "Dạ được anh, em làm giống năm ngoái.",
        "Em phải nói thật với anh: tiền du lịch gia đình không được tính là chi phí kinh doanh. Năm ngoái làm vậy là sai, nếu IRS kiểm tra thì anh phải đóng lại thuế, cộng tiền phạt và tiền lãi. Em khuyên anh sửa lại tờ khai năm ngoái (1040-X) để giảm tiền phạt. Năm nay em chỉ trừ những chi phí có chứng từ kinh doanh thật.",
        "Theo §10.21, em có duty to advise về noncompliance."
      ],
      a: 1,
      exp: "Cách 2 trung thực, giải thích hậu quả và đưa ra giải pháp. Đây chính là điều §10.21 yêu cầu, nói bằng lời của khách."
    },
    critical: {
      q: "Anh Bình nghe xong vẫn nhất quyết không sửa năm ngoái và đòi năm nay làm y chang. Bạn nên làm gì?",
      options: [
        "Làm theo ý khách vì khách là thượng đế",
        "Không chuẩn bị tờ khai có vị trí sai. Ghi lại việc đã tư vấn cho khách bằng văn bản. Nếu khách vẫn đòi làm sai thì cân nhắc từ chối/ngừng nhận khách",
        "Tự nộp 1040-X cho khách mà không cần chữ ký",
        "Báo cảnh sát"
      ],
      a: 1,
      exp: "EA không bắt buộc báo IRS, nhưng cũng không được tham gia làm sai. Lưu lại hồ sơ tư vấn bằng văn bản để tự bảo vệ, và có thể ngừng nhận khách. Không ai được nộp tờ khai thay khách mà không có chữ ký và sự đồng ý của khách."
    },
    scriptEn: "I have to be honest with you. Family vacation costs are not business expenses. I recommend amending last year's return, and this year I can only deduct real business expenses."
  }
];
