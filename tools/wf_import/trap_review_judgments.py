"""Explicit semantic exceptions recorded while reading the source in batches.

Applied to the ledger only after all rows have been read. No model/network calls.
"""
from trap_review import *


def apply():
    ledger=read(LEDGER)
    def reject(indices,criterion,reason):
        for i in indices:
            ledger['decisions'][str(i)]={'verdict':'reject','reason':f'{criterion}: {reason}',
                'findings':[{'criterion':criterion,'verdict':'reject','reason':reason}]}
    def fix(indices,reason,**changes):
        for i in indices:
            ledger['decisions'][str(i)]={'verdict':'fix','reason':reason,'fix':changes,
                'findings':[{'criterion':'C5' if set(changes)=={'why'} else 'C4','verdict':'fix','reason':reason}]}

    # Family ROOT groups 0–59.
    reject([132,133,136,137,150,151,154,155], 'C1', 'agree/agree on/agree to diễn đạt cùng sự đồng ý; không có bổ ngữ để tách nghĩa, khác giới từ không đủ tạo đáp án sai.')
    reject([224,233], 'C1', 'apply và apply for cùng nghĩa nộp đơn xin trong bộ này.')
    fix([280], 'C5: attempt còn là động từ; cần nói rõ khác dạng quá khứ.', why='Attempted là dạng quá khứ của động từ attempt, còn attempt có thể là động từ hoặc danh từ.')
    reject([330,331,335], 'C1', 'base có nghĩa cơ sở và lấy làm cơ sở; basis/dựa trên cũng diễn đạt chính nghĩa đó trong quiz không ngữ cảnh.')
    reject([348,352], 'C1', 'bath còn dùng như động từ tắm; bath/bathe không bảo đảm một đáp án đúng khi chỉ hiển thị từ.')
    reject([481], 'C1', 'Bẫy broke bỏ dấu quá khứ trong nghĩa Việt, làm vỡ trùng nghĩa break.')
    fix([486,489], 'C4: giữ rõ dấu quá khứ của broke trong đáp án Việt.', trap_vi='đã làm hỏng, đã làm vỡ')
    reject([512,517,526,527], 'C1', 'build/build up đều có nghĩa xây dựng, phát triển; các bản dịch hiện tại không tách được trong quiz đứng riêng.')
    reject([576,582,583], 'C1', 'calm và calm down cùng có nghĩa làm dịu/bình tĩnh lại; không thể dựa vào một POS được chọn để bỏ qua nghĩa động từ của calm.')
    fix([597], 'C4/C5: nghĩa Anh chỉ người ủng hộ chủ nghĩa tư bản; capital nguồn đang mang nghĩa thủ đô.', trap_vi='người ủng hộ chủ nghĩa tư bản', why='Capitalist là danh từ chỉ người ủng hộ chủ nghĩa tư bản, khác với capital mang nghĩa thủ đô trong mục gốc.')
    reject([615,619,628], 'C1', 'care và care about đều có nghĩa quan tâm; thêm đến không tạo nghĩa khác rõ ràng.')

    # Family ROOT groups 60–119.
    reject([671,678], 'C1', 'certain/certainly đều diễn đạt chắc chắn; rồi/được thôi chỉ là sắc thái hoặc nghĩa phụ của certainly, không làm cặp an toàn.')
    reject([724,726], 'C1', 'child/children chỉ khác số ít/số nhiều; đứa trẻ và trẻ em cùng trả lời đúng nghĩa từ nếu câu hỏi không chỉ số lượng.')
    reject([944,946], 'C1', 'country còn có nghĩa vùng nông thôn, đồng nghĩa countryside khi đứng riêng.')
    reject([1032,1037], 'C1', 'deal còn có nghĩa xử lý trong deal with; thiếu ngữ cảnh/bổ ngữ nên không dùng hai dạng này làm đáp án đối nghịch.')
    fix([1033], 'C4: bỏ ngoặc đã làm mất tân ngữ của nghĩa chia bài.', trap_vi='chia bài, buôn bán')
    reject([1079,1086,1096,1098], 'C1', 'depend/dependent/depend on đều có thể dịch phụ thuộc; phụ thuộc vào không đủ phân biệt đáp án đứng riêng.')
    reject([1155,1161], 'C1', 'differ/different đều thể hiện khác nhau/khác biệt; thiếu dấu hiệu loại từ trong nghĩa Việt để buộc chọn một từ.')
    reject([1188,1195], 'C1', 'disappoint và disappointing đều có nghĩa gây/làm thất vọng trong cách dịch đang dùng.')

    # Family ROOT groups 120–199.
    reject([1215,1217], 'C1', 'ghê tởm và kinh tởm đồng nghĩa trong ô Việt; bản dịch không phân biệt người cảm thấy với vật gây cảm giác.')
    reject([1219,1225], 'C1', 'distract và distracting đều mang nghĩa làm phân tâm/gây xao nhãng; bản dịch hiện tại không đánh dấu loại từ rõ.')
    reject([1254,1256,1258], 'C1', 'dress/dressed/dressed in đều chỉ mặc hoặc đang mặc quần áo; cặp không có tân ngữ để tách nghĩa.')
    reject([1376,1378], 'C1', 'end còn là danh từ phần kết/cái kết, đồng nghĩa ending trong câu hỏi không ngữ cảnh.')
    reject([1495,1497], 'C1', 'eye/eyes chỉ khác số lượng nhưng mắt/con mắt không buộc một đáp án duy nhất.')
    reject([1525,1529], 'C1', 'far/faraway đều là xa/xa xôi; sắc thái xa xôi không tạo nghĩa sai rõ.')
    reject([1545,1549], 'C1', 'feature có thể chỉ nét mặt, features cũng có thể là động từ có/giới thiệu; tách riêng một nghĩa nguồn không loại được đáp án đúng thứ hai.')
    fix([1547], 'C4: featured là được làm nổi bật, không chỉ tự nó nổi bật.', trap_vi='được làm nổi bật')
    reject([1565,1573], 'C1', 'fight và fighting đều có danh từ chỉ sự đánh nhau/giao tranh; không chỉ xét fight là động từ.')
    reject([1596,1599,1604,1605], 'C1', 'find/find out đều có nghĩa tìm ra, phát hiện hoặc biết được; thiếu ngữ cảnh phân biệt tìm vật với biết thông tin.')
    fix([1650], 'C4: không dùng lái đứng riêng khi định nghĩa Anh là bay.', trap_vi='bay')
    reject([1686,1690,1694,1698], 'C1', 'footstep có thể là âm thanh hoặc dấu của bước chân; các bẫy tiếng bước chân/dấu chân không tách được nghĩa đó.')
    fix([1685,1689,1693,1697], 'C4: feet là số nhiều bàn chân hoặc đơn vị đo; bỏ tiếng Anh khỏi ô nghĩa.', trap_vi='những bàn chân; đơn vị đo chiều dài foot')
    reject([1761], 'C1', 'fund và funds đều là tiền/quỹ/kinh phí; số nhiều không làm nghĩa tiền thành đáp án sai.')
    reject([1782,1785], 'C1', 'gentleman/gentlemen chỉ khác số lượng; không có dữ kiện số lượng để đáp án quý ông sai.')
    fix([1797,1801], 'C4: giữ nghĩa lên phương tiện của get on.', trap_vi='lên xe')
    reject([1844,1846], 'C1', 'kính và kính đeo mắt đều có thể là nghĩa đúng của glasses, trong khi glass còn có các nghĩa vật liệu và vật dụng; ô kính quá rộng.')

    # Family ROOT groups 200–259.
    reject([1872,1873], 'C1', 'go over trong nghĩa đi đến chỗ không tách rõ khỏi go/went trong quiz thiếu đích đến.')
    reject([1967,1969], 'C1', 'head còn là động từ đi về hướng, đồng nghĩa head for; từ gốc đứng riêng không chỉ giới hạn danh từ cái đầu.')
    reject([2037,2044], 'C1', 'hope/hopefully cùng diễn đạt hy vọng là khi không có cấu trúc câu; thêm là không đủ làm đáp án sai.')
    reject([2057], 'C1', 'house là một nhà ở, housing là nhà ở nói chung; bản dịch không giữ được ranh giới đếm được và tập hợp.')
    fix([2148], 'C4: incoming là đang đến/sắp đến, không phải đã đến nơi.', trap_vi='đang đến, sắp đến')
    reject([2224,2226], 'C1', 'involve/involved đều diễn đạt có liên quan; không có cấu trúc chủ động/bị động để tách trong ô dịch.')
    reject([2337,2340], 'C1', 'last còn là trạng từ sau cùng, đồng nghĩa lastly trong cách dịch cuối cùng là.')

    # Family ROOT groups 260–324.
    reject([2352], 'C1', 'laugh còn là danh từ tiếng cười, đồng nghĩa laughter ở chiều Việt sang Anh.')
    reject([2380,2385,2386], 'C1', 'leave/leave for đều là rời đi/lên đường đi, không có đích đến để tách nghĩa.')
    reject([2448,2449,2455,2457,2459,2461], 'C1', 'look around/looked around là cùng hành động nhìn quanh; bản dịch looked around không đánh dấu quá khứ, look cũng trả lời đúng nhìn quanh khi không có câu.')
    fix([2453,2466,2470,2474,2478], 'C4: giữ dấu quá khứ của looked around.', trap_vi='đã nhìn quanh')
    reject([2505,2508,2513,2514], 'C1', 'luck/lucky/luckily đều được hiểu may mắn, thêm là không tạo đáp án sai rõ.')
    reject([2518,2520], 'C1', 'magic còn là tính từ thần kỳ/có phép màu, đồng nghĩa magical kỳ diệu trong quiz đứng riêng.')
    reject([2661,2665,2672,2673], 'C1', 'move còn có nghĩa chuyển nhà/chuyển đi, đồng nghĩa move away; không có ngữ cảnh để giới hạn là cử động.')
    fix([2663,2667], 'C4: moved on phải biểu thị quá khứ.', trap_vi='đã đi tiếp')
    reject([2705,2710], 'C1', 'near và nearby đều có nghĩa gần/gần đó; đó chỉ quy chiếu ngữ cảnh vắng mặt.')
    fix([2811], 'C4: biểu đạt đúng tính từ opportunistic.', trap_vi='mang tính cơ hội, trục lợi')
    fix([2843], 'C5: package nguồn là danh từ gói hàng, không phải hành động.', trap_vi='bao bì', why='Packaging chỉ vật liệu bao gói, còn package trong mục gốc là gói hàng.')
    reject([2849,2851], 'C1', 'parent/parents chỉ khác số lượng; không có dữ kiện số lượng để loại nghĩa cha mẹ.')
    reject([2859,2861], 'C1', 'particular/particularly cùng có nghĩa đặc biệt; thêm là không đủ đánh dấu khác nghĩa trong quiz.')
    reject([2868,2871,2876,2877], 'C1', 'pass/pass by đều có nghĩa đi ngang qua; không có bổ ngữ hoặc ngữ cảnh để tách.')
    reject([2912,2916,2920,2921], 'C1', 'pay/pay for đều là trả tiền cho; thiếu tân ngữ để tách nghĩa, đặc biệt định nghĩa Anh đã trùng.')

    # Additional reciprocal ambiguity found while checking the two quiz directions.
    reject([332], 'C1', 'base còn là danh từ cơ sở/nền tảng, đồng nghĩa basis ở chiều Việt sang Anh.')
    reject([2059], 'C1', 'house còn là danh từ nhà ở, cũng trả lời đúng cho nghĩa housing ở chiều Việt sang Anh.')

    # Family ROOT groups 325–389.
    fix([2962], 'C4: thể hiện quá khứ của picked up.', trap_vi='đã nhặt lên, đã cầm lấy')
    reject([2983,2990], 'C1', 'play và playing with đều là chơi/nghịch; không có tân ngữ để giới từ with tạo khác biệt nghĩa rõ.')
    reject([2995,2996,2997,2998,2999,3000], 'C1', 'point/point to/pointed out đều có nghĩa chỉ/chỉ ra/chỉ vào; bản dịch không đánh dấu quá khứ và không tách cử chỉ với nêu ý kiến.')
    reject([3073,3075], 'C1', 'practice còn là động từ theo chính tả Mỹ, đồng nghĩa hoàn toàn với practise; không chỉ giới hạn practice ở danh từ.')
    reject([3108,3110], 'C1', 'previous/previously đều là trước đó/trước đây; không có câu để dùng POS chọn duy nhất.')
    reject([3200,3202], 'C1', 'put/put down cùng nghĩa đặt/đặt xuống; quiz không có vị trí đặt để buộc một lựa chọn.')
    fix([3201,3203], 'C4: bỏ ra đứng riêng quá mơ hồ; ghi rõ thời gian/công sức như định nghĩa Anh.', trap_vi='bỏ thời gian, bỏ công sức')
    fix([3256,3264,3267], 'C4: cúi tay không tự nhiên; reach down là đưa tay xuống.', trap_vi='đưa tay xuống')
    reject([3331,3333], 'C1', 'record còn là bản ghi âm/hình, đồng nghĩa recording ở chiều Việt sang Anh.')
    reject([3338,3340], 'C1', 'reference/referral đều có thể là giấy/thư giới thiệu; bản dịch hiện tại không chỉ rõ giới thiệu nhân sự hay chuyển tuyến.')
    reject([3360,3364], 'C1', 'relate/related cùng biểu thị có liên quan/liên hệ; thiếu cấu trúc câu để phân biệt loại từ.')
    reject([3370,3374], 'C1', 'relation/relationship đều có nghĩa mối quan hệ/mối liên hệ; sắc thái không đủ tách khi đứng riêng.')
    reject([3371,3378], 'C1', 'relation còn có nghĩa người họ hàng, đồng nghĩa relative khi chỉ hiển thị từ.')
    reject([3475,3481], 'C1', 'respect/respectful đều dịch tôn trọng; phần lễ phép không loại được vế đồng nghĩa.')

    # Family ROOT groups 390–454.
    reject([3532], 'C1', 'rise còn có nghĩa thức dậy, còn bẫy rose bỏ dấu quá khứ trong ô Việt nên cũng đúng nghĩa đó.')
    fix([3539], 'C4/C5: thể hiện quá khứ của rose và không giả tách nghĩa dậy khỏi risen.', trap_vi='đã thức dậy', why='Rose là quá khứ đơn của rise, còn risen là quá khứ phân từ và có thể diễn đạt đã tăng hoặc đã dậy.')
    reject([3547], 'C1', 'rocked rung lắc đồng nghĩa rock đung đưa/lắc nhẹ khi không có dấu quá khứ trong đáp án.')
    fix([3551], 'C4: giữ quá khứ của rocked.', trap_vi='đã rung lắc')
    reject([3552,3554], 'C1', 'roll/roll in cùng chỉ lăn; giới từ trong không cho nghĩa sai rõ nếu không có vật/ngữ cảnh.')
    reject([3564,3566], 'C1', 'round còn là giới từ/trạng từ quanh, đồng nghĩa around khi từ đứng riêng.')
    fix([3585,3593,3597,3601,3609], 'C4: ran là quá khứ của run.', trap_vi='đã chạy')
    reject([3577,3581,3588,3589,3599,3603,3604,3605,3607], 'C1', 'run/ran off/run away đều có thể diễn đạt chạy đi/bỏ chạy; bản dịch không tách quá khứ và không có ngữ cảnh thoát thân.')
    ledger['decisions']['3660']={'verdict':'approve','reason':'C1–C5: Scotland là tên nước, khác Scottish thuộc Scotland; giữ chữ hoa tên riêng.', 'machine_overrides':{'C5':'Tên riêng Scotland giữ chữ hoa.'}}
    reject([3699,3700,3701,3703], 'C1', 'seem/seemed/seemingly đều đang dịch có vẻ/dường như; không thể lấy như làm khác biệt nghĩa, cũng không đánh dấu quá khứ.')
    reject([3713,3715], 'C1', 'serious/seriously cùng diễn đạt nghiêm túc; mà nói là cấu trúc câu chứ không tạo nghĩa sai.')
    reject([3727,3731], 'C1', 'servant và server đều có thể là người phục vụ; bản dịch người hầu/người phục vụ bàn không đủ nếu không có ngữ cảnh vai trò.')
    reject([3765,3767], 'C1', 'shoe/shoes chỉ khác số lượng; chiếc giày/giày không đủ để một đáp án chắc chắn sai.')
    reject([3856,3860,3870,3871], 'C1', 'sit/sit down đều được dịch ngồi/ngồi xuống; quiz thiếu ngữ cảnh tư thế hay động tác, sat không được giải thích bởi cấu trúc câu.')
    reject([3900], 'C1', 'slow còn là động từ giảm tốc/chậm lại, đồng nghĩa slow down.')
    reject([3936,3938], 'C1', 'special/especially đều có thể là đặc biệt; thêm là không đủ đánh dấu khác nghĩa trong ô đáp án.')
    fix([3956,3957], 'C4: khôi phục tân ngữ bị mất khi bỏ ngoặc trong nghĩa spend.', trap_vi='tiêu tiền')

    # Family ROOT groups 455–522, including six invalid word_term links.
    reject([4086,4088], 'C1', 'đột ngột và đột nhiên đồng nghĩa trong hai ô Việt; khác POS tiếng Anh không được biểu đạt rõ trong bản dịch.')
    reject([4125,4129], 'C1', 'surprising/surprisingly đều dịch đáng ngạc nhiên, thêm là không đủ tạo nghĩa khác.')
    fix([4154,4158,4162], 'C4: took out là quá khứ, phải dịch đã lấy ra.', trap_vi='đã lấy ra')
    reject([4180,4183], 'C1', 'talk/talked about cùng chỉ nói chuyện về; ô Việt không có dấu quá khứ hoặc chủ đề để phân biệt.')
    fix([4182], 'C4: giữ quá khứ của talked about.', trap_vi='đã nói chuyện về')
    fix([4216], 'C5: term và terminology đều là danh từ; không nói khác loại từ.', why='Terminology ở đây chỉ ngành nghiên cứu thuật ngữ, còn term trong mục gốc chỉ học kỳ và cả hai đều là danh từ.')
    reject([4272,4275], 'C1', 'tire/tiring đều thể hiện làm/gây mệt mỏi, chưa có cách dịch phân biệt loại từ rõ.')
    reject([4318,4320], 'C1', 'transport còn là danh từ sự vận chuyển/giao thông, đồng nghĩa transportation ở chiều Việt sang Anh.')
    reject([4351,4355], 'C1', 'trusted/trustworthy có thể cùng mang nghĩa đáng tin cậy; không có ngữ cảnh để tách được tin tưởng khỏi đáng tin.')
    reject([4358,4359,4362,4366,4382], 'C1', 'turn/turn around/turn away cùng được diễn đạt quay/rẽ/quay đi; không đủ ngữ cảnh hướng để một đáp án chắc chắn sai.')
    reject([4436,4439], 'C1', 'various/varied đều có thể dịch đa dạng/nhiều loại khác nhau; thiếu ngữ cảnh phân biệt số lượng loại với tính phong phú.')
    reject([4582,4584], 'C1', 'wife/wives chỉ khác số lượng; ô nghĩa vợ không có câu để quy định số lượng.')
    reject([4606,4608], 'C1', 'wood/woods cùng nghĩa khu rừng nhỏ; dạng số nhiều không tạo nghĩa khác.')
    fix([4613,4615,4618], 'C4: work towards là nỗ lực hướng tới, không bắt buộc cùng nhau.', trap_vi='nỗ lực hướng tới')
    reject([2310,2311,2312,2313,2799,2800], 'C3', 'word_term dùng khoảng trắng trong well known/old fashioned, nhưng words dùng well-known/old-fashioned; phải sửa khoá trước, không thể sửa bằng trap_vi hoặc why.')

    # Non-family rows 0–109 (positions in the non-family view, source IDs below).
    reject([5,9,12,42,44,112,115,119,120,123,232,237,239,242,247,251,258,276,281,282,293,296,300], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([39,47,126,127,128,129,158,187,197,198,199,200,201,205,206,261,270,273,277,301], 'C3', 'Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.')
    reject([103], 'C4', 'Fostering cũng dùng cho việc chăm sóc trẻ tạm thời; định nghĩa Anh chỉ giới hạn động vật không khớp đối chiếu nhận nuôi con, cần sửa trap_en ngoài phạm vi FIX cho phép.')
    reject([113,116], 'C3', 'Đây là cặp phái sinh cùng họ rõ ràng; chưa có cơ chế bạn giả để gắn loại false.')
    reject([243], 'C4', 'Approachment được chính dòng nguồn thừa nhận không chuẩn; không dùng từ không chuẩn làm một lựa chọn từ vựng thật.')
    fix([8], 'C5: giải thích theo nghĩa khoảng của about trong nguồn.', trap_vi='ở trên', why='About trong mục gốc có nghĩa khoảng, còn above nghĩa ở trên và hai từ có mặt chữ gần nhau.')
    fix([11], 'C5: gộp why thành một câu Việt.', trap_vi='phương ngữ', why='Dialect chỉ phương ngữ với khác biệt từ vựng hoặc ngữ pháp, còn accent chỉ cách phát âm.')
    fix([41], 'C5: giống mặt chữ, không phải phát âm gần.', trap_vi='lưu trữ', why='Archive và achieve dễ nhầm mặt chữ, nhưng archive là lưu trữ còn achieve là đạt được.')
    fix([111], 'C5: chỉnh cơ chế gần chữ thay vì gần âm.', trap_vi='khuyên bảo', why='Advise và advantage có phần đầu chữ gần nhau, nhưng advise là khuyên bảo còn advantage là lợi thế.')
    fix([225], 'C5: mục apply nguồn là nộp đơn, không phải áp dụng.', trap_vi='vỗ tay tán thưởng', why='Apply và applaud có phần đầu chữ gần nhau, nhưng applaud là vỗ tay tán thưởng còn apply ở mục gốc là nộp đơn.')
    fix([290], 'C4: trap_en là nghĩa danh từ của focus.', trap_vi='trọng tâm', why='Focus ở đây chỉ trọng tâm của sự quan tâm, còn attention chỉ sự chú ý.')

    # Non-family rows 110–239.
    reject([370,380,448,492,532,533,598,599,660,677,681,690,693,698,702,706,707], 'C1', 'Cặp trùng nghĩa hoặc là các cách dịch tương đương của một nghĩa thông dụng; sắc thái, phạm vi hay độ trang trọng không làm bẫy chắc chắn sai trong quiz đứng riêng.')
    reject([326,327,386,415,462,471,472,506,507,536,537,552,594,595,718,720,721], 'C3', 'Cặp look chỉ có vài chữ chung hoặc hậu tố phổ biến; khác cả dáng chữ lẫn âm nên không có cơ chế nhầm đủ rõ.')
    reject([381,493,715], 'C3', 'Chỉ là từ khác nghĩa, đối nghĩa hoặc cùng chủ đề; why chưa nêu cơ chế bạn giả có lý.')
    fix([491], 'C5: bridge nguồn là cây cầu; nói rõ gần chữ, không thay bằng nghĩa kết nối.', why='Bride và bridge có mặt chữ gần nhau, nhưng bride là cô dâu còn bridge trong mục gốc là cây cầu.')
    fix([551], 'C4/C5: solitude là trạng thái ở một mình, không phải sự tĩnh lặng.', trap_vi='sự ở một mình', why='Solitude là trạng thái ở một mình, còn loneliness là cảm giác cô đơn nên ở một mình không nhất thiết cô đơn.')
    fix([596], 'C5: capital nguồn là thủ đô.', why='Capital và capitol phát âm giống nhau, nhưng capital ở mục gốc là thủ đô còn capitol là tòa nhà quốc hội.')
    fix([701], 'C4: charged phải thể hiện dạng quá khứ/bị động.', trap_vi='đã tính phí, bị tính phí')
    fix([705], 'C5: chaos và chaise giống chữ đầu, không có âm gần như câu gốc khẳng định.', trap_vi='ghế dài', why='Chaise và chaos có mặt chữ gần nhau, nhưng chaise là ghế dài còn chaos là sự hỗn loạn.')

    # Non-family rows 240–379.
    reject([808,816,822,823,826,827,841,851,856,857,865,887,890,891,931,932,936,979,1029,1050,1071,1072,1075,1124,1132,1136,1164,1180,1194,1198,1204,1207,1211,1224], 'C1', 'Có nghĩa thông dụng đồng nghĩa hoặc đáp án Việt tương đương; các hạn định về bối cảnh, mức độ hoặc một POS trong why không xuất hiện trong câu hỏi để loại đáp án đúng thứ hai.')
    reject([763,765,860,895,903,945,948,981,991,997,999,1007,1064,1250], 'C3', 'Không có tương đồng chữ/âm đủ rõ, hoặc loại syn chỉ là liên tưởng chủ đề chứ không gần nghĩa; cần thay cặp/loại ngoài hai trường FIX.')
    reject([821], 'C4', 'Commune là một dạng cộng đồng; định nghĩa Anh not community sai và ô Việt cũng lộ cách loại trừ, cần sửa cả trap_en.')
    fix([771], 'C4: trap_en là sự tình cờ, không phải cơ hội.', trap_vi='sự tình cờ', why='Chance ở đây là sự tình cờ, còn coincidence là sự trùng hợp của các sự kiện.')
    reject([772], 'C3', 'Coincidence và incident chưa có cơ chế bạn giả cụ thể; câu nói dịch sai không phải bằng chứng một cặp nhầm hợp lý.')
    fix([886], 'C2/C5: ô nghĩa chỉ giữ nghĩa chính, không viết câu giải thích.', trap_vi='bao gồm, được cấu thành từ')
    fix([978], 'C5: crop nguồn đang là danh từ cây trồng.', trap_vi='rác rưởi', why='Crap và crop có mặt chữ gần nhau, nhưng crap chỉ thứ kém chất lượng còn crop trong mục gốc là cây trồng.')
    reject([1035], 'C4', 'Deader không phải dạng từ vựng thông dụng phù hợp bộ học này; More dead là cách nói cường điệu theo ngữ cảnh, không có nghĩa đối chiếu ổn định.')
    fix([1036], 'C5: why cần giải thích điểm phân biệt, không chỉ nói không phải.', trap_vi='người môi giới', why='Broker sắp xếp giao dịch cho người khác, còn dealer thường trực tiếp mua bán hàng hóa.')
    reject([1040], 'C4', 'Deal on không phải cụm động từ chuẩn mang nghĩa thương lượng như bản ghi; không thể cứu bằng sửa nghĩa Việt khi trap_en sai.')
    fix([1074], 'C4: giữ tính chất của tính từ demeaning.', trap_vi='mang tính hạ nhục')
    fix([1203], 'C5: discus là dụng cụ, không phải môn thể thao.', trap_vi='đĩa ném', why='Discus là đĩa dùng trong môn ném đĩa, còn discuss là động từ thảo luận và hai từ có mặt chữ gần nhau.')

    # Non-family rows 380–519.
    reject([1343,1351,1371,1400,1401,1416,1427,1455,1459,1465,1474,1490,1509,1520,1587,1588,1616,1617,1622], 'C1', 'Từ bẫy cũng là cách diễn đạt nghĩa thông dụng của từ gốc; khác mức độ, phạm vi hoặc bối cảnh không có trong câu hỏi không bảo đảm đáp án sai.')
    reject([1260,1282,1294,1325,1353,1355,1385,1403,1409,1413,1496,1542,1544,1558,1590,1594,1630], 'C3', 'Cặp look chỉ trùng ít chữ hoặc một đuôi thông dụng, không có tương đồng hình/âm đủ rõ.')
    reject([1316,1480], 'C3', 'Chỉ khác phái sinh/biến tố cùng họ; why chưa đưa ra cơ chế bạn giả để dùng loại false.')
    fix([1323], 'C5: nêu khác biệt hiệu suất và kết quả đạt được thay vì chỉ nói không thay thế mọi ngữ cảnh.', trap_vi='có hiệu suất cao', why='Efficient nhấn mạnh ít lãng phí nguồn lực, còn effective nhấn mạnh đạt kết quả mong muốn.')
    fix([1346], 'C4: giữ dạng quá khứ của embraced.', trap_vi='đã ôm chặt')
    fix([1350], 'C4: giữ dạng đang của embracing.', trap_vi='đang ôm chặt')
    fix([1417], 'C5: witness có nghĩa khác là bằng chứng, nên cặp không an toàn.')
    reject([1417], 'C1', 'Witness còn có nghĩa bằng chứng/chứng cứ trong các cách dùng như bear witness; không thể khẳng định không phải evidence ở quiz từ đứng riêng.')
    reject([1548], 'C3', 'Feature/future là cặp giống chữ/âm, why không nêu một nghĩa bạn giả; cần đổi kind thành look.')

    # Scotland proper noun override
    ledger['decisions']['3658']={'verdict':'approve','reason':'C1–C5: Scotland là tên nước, khác Scottish thuộc Scotland; giữ chữ hoa tên riêng.', 'machine_overrides':{'C2':'Scotland là tên riêng, giữ trong nghĩa thuộc Scotland.'}}

    # Non-family rows 520–659 (indices 1635..2165).
    reject([1759, 1777, 1885, 1898, 2100, 2162], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([1658, 1659, 1701, 1703, 1738, 1756, 1765, 1766, 1767, 1768, 1779, 1793, 1833, 1890, 1900, 1901, 1915, 1917, 1918, 1919, 1935, 1936, 1950, 1952, 1970, 2018, 2025, 2026, 2033, 2034, 2047, 2049, 2050, 2056, 2058, 2060, 2061, 2062, 2068, 2070, 2072, 2086, 2089, 2090, 2092, 2120, 2121, 2122, 2123, 2124, 2164, 2165], 'C3', 'Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.')
    reject([1661, 1760, 2163], 'C3', 'Từ đối nghĩa hoặc chỉ liên tưởng chủ đề/thẩm mỹ; không phải từ đồng nghĩa hay bạn giả có cơ chế gây nhầm lẫn hợp lý.')
    reject([2007, 2008], 'C3', 'word_term dùng khoảng trắng trong high quality nhưng words dùng high-quality; phải sửa khoá trước, không thể sửa bằng trap_vi hoặc why.')

    # Non-family rows 660–799 (indices 2168..2640).
    reject([2507, 2530, 2531, 2558, 2581, 2615, 2616, 2625], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([2174, 2175, 2177, 2179, 2181, 2221, 2223, 2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2248, 2249, 2251, 2257, 2259, 2260, 2261, 2262, 2263, 2269, 2283, 2287, 2288, 2289, 2394, 2396, 2400, 2402, 2480, 2516, 2517, 2527, 2554, 2579, 2580, 2582, 2608, 2609, 2613, 2614, 2618, 2619, 2627, 2628, 2631], 'C3', 'Cặp look chỉ có vài chữ chung hoặc hậu tố phổ biến; khác cả dáng chữ lẫn âm nên không có cơ chế nhầm đủ rõ.')
    reject([2253], 'C2', 'Ô nghĩa nhắc từ gốc và lộ bản chất đây chỉ là biến thể chính tả của cùng một từ, không phải cặp bẫy độc lập.')
    reject([2255, 2595, 2596, 2605], 'C3', 'Đây là cặp phái sinh cùng họ rõ ràng; không thể dùng làm bẫy khác loại hoặc gán bạn giả.')
    reject([2597, 2598], 'C3', 'word_term dùng khoảng trắng trong medium size nhưng words dùng medium-size; phải sửa khoá trước, không thể sửa bằng trap_vi hoặc why.')

    # Non-family rows 800–949 (indices 2641..3109).
    reject([2772, 2833, 2863, 2883, 2906, 3022, 3057], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([2648, 2649, 2650, 2651, 2652, 2654, 2655, 2657, 2659, 2684, 2685, 2689, 2722, 2723, 2737, 2741, 2743, 2745, 2754, 2765, 2767, 2795, 2796, 2805, 2806, 2813, 2814, 2816, 2847, 2848, 2860, 2865, 2866, 2879, 2929, 2932, 2933, 2934, 2940, 2947, 2948, 2964, 2966, 2967, 2970, 2972, 2994, 3002, 3041, 3062, 3063, 3074, 3076, 3104, 3105, 3107, 3109], 'C3', 'Cặp look chỉ trùng ít chữ hoặc một đuôi thông dụng, không có tương đồng hình/âm đủ rõ.')
    reject([2748, 2773, 2809, 2864, 3026], 'C3', 'Chỉ là từ khác nghĩa, đối nghĩa, cụm từ sai hoặc liên tưởng chủ đề; không có cơ chế bạn giả có lý.')
    reject([2810, 2907, 2909, 2939, 3036, 3039, 3072], 'C3', 'Cặp cùng gốc từ phái sinh/biến tố hoặc từ yếu; không phải dạng bạn giả hay bẫy phân biệt mặt chữ hợp lệ.')
    reject([2801, 2802], 'C3', 'word_term dùng khoảng trắng trong old fashioned nhưng words dùng old-fashioned; phải sửa khoá trước, không thể sửa bằng trap_vi hoặc why.')

    # Non-family rows 950–1099 (indices 3111..3649).
    reject([3173, 3212, 3217, 3233, 3249, 3250, 3325, 3326, 3329, 3349, 3437, 3459, 3463, 3553, 3649], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([3111, 3153, 3163, 3164, 3180, 3185, 3186, 3187, 3199, 3214, 3222, 3223, 3227, 3231, 3240, 3241, 3242, 3246, 3269, 3270, 3328, 3332, 3357, 3359, 3441, 3443, 3445, 3447, 3449, 3458, 3472, 3473, 3502, 3504, 3505, 3506, 3543, 3545, 3555, 3557, 3559, 3561, 3563, 3573, 3575, 3645], 'C3', 'Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.')
    reject([3117], 'C2', 'Ô nghĩa nhắc từ gốc và dùng tiếng lóng không chuẩn; không dùng làm lựa chọn từ vựng nghiêm túc.')
    reject([3158, 3162, 3182, 3183, 3195, 3197, 3234, 3342], 'C3', 'Từ đối nghĩa, thuật ngữ kỹ thuật hẹp (git) hoặc liên tưởng xa; không đáp ứng tiêu chuẩn của loại syn/false.')
    reject([3159, 3168, 3285, 3324, 3455, 3457, 3469, 3471, 3497, 3567, 3644], 'C3', 'Cặp cùng họ từ rõ ràng trong nguồn; không phải dạng look hay bạn giả độc lập.')

    # Non-family rows 1100–1249 (indices 3651..4091).
    reject([3664, 3761, 3893, 3953, 4032], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([3651, 3659, 3661, 3662, 3665, 3667, 3677, 3679, 3702, 3704, 3733, 3764, 3775, 3776, 3799, 3800, 3804, 3810, 3851, 3852, 3853, 3875, 3884, 3903, 3912, 3913, 3920, 3921, 3925, 3929, 3932, 3933, 3935, 3959, 3962, 3978, 3981, 3984, 3986, 4012, 4021, 4023, 4044, 4046, 4066, 4068, 4070, 4089], 'C3', 'Cặp look chỉ có vài chữ chung hoặc hậu tố phổ biến; khác cả dáng chữ lẫn âm nên không có cơ chế nhầm đủ rõ.')
    reject([3762, 3787, 3970, 4036], 'C3', 'Từ không có cơ chế bạn giả cụ thể hoặc phân loại syn sai (chiến thuật vs chiến lược; sitcom vs hài kịch đứng).')
    reject([3668, 3669, 3673, 3675, 3934, 3941, 3954, 3969, 4011, 4078, 4081], 'C3', 'Đây là cặp phái sinh/biến tố cùng họ; không có cơ chế bạn giả hoặc nhầm mặt chữ độc lập.')
    reject([3930, 3931], 'C3', 'word_term dùng khoảng trắng trong south west nhưng words dùng south-west; phải sửa khoá trước, không thể sửa bằng trap_vi hoặc why.')

    # Non-family rows 1250–1420 (indices 4093..4668).
    reject([4105, 4111, 4117, 4147, 4204, 4399, 4526], 'C1', 'Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.')
    reject([4101, 4107, 4189, 4198, 4200, 4226, 4231, 4233, 4234, 4235, 4252, 4255, 4284, 4285, 4286, 4290, 4292, 4296, 4321, 4336, 4337, 4338, 4339, 4341, 4387, 4389, 4400, 4401, 4402, 4403, 4440, 4441, 4443, 4462, 4469, 4529, 4530, 4531, 4540, 4544, 4548, 4552, 4556, 4563, 4565, 4567, 4569, 4585, 4632, 4658, 4668], 'C3', 'Cặp look chỉ trùng ít chữ hoặc một đuôi thông dụng, không có tương đồng hình/âm đủ rõ.')
    reject([4229, 4527, 4559], 'C3', 'Cụm từ tạo sai (theory of / warn about / weekend day); không phải từ vựng độc lập.')
    reject([4096, 4097, 4210, 4212, 4225, 4291, 4328, 4329, 4352, 4356, 4534], 'C3', 'Đây là cặp phái sinh/biến tố cùng họ; không có cơ chế bạn giả hoặc nhầm mặt chữ độc lập.')

    LEDGER.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Applied semantic exceptions')


if __name__=='__main__':
    apply()
