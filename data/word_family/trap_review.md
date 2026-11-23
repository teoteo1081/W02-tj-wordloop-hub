# Kết quả duyệt bẫy Word Family

Nguồn SHA-256: `0583d2330ff3598bbfdbf830bdcad77e80a6cd218b8c01420b10df1ae46fab35`.
ROOT trích PDF SHA-256: `dfb8e5a50a92697d911c3ded9c04109e1127b8b1c7cd864f6efd7685322d6dab`.

Tổng: **4669** bẫy; **3525 approve / 877 reject / 267 fix**.

Kiểm tra máy chạy trên toàn bộ dữ liệu; phán đoán nghĩa/loại lưu theo chỉ số gốc trong `trap_review_semantic.json`. Bẫy family được đọc theo ROOT: định nghĩa dùng chung và từng cạnh từ→bẫy; mẫu why được đối chiếu POS/quiz của nguồn, các câu ngoài mẫu được đọc riêng. Các bẫy còn lại được đọc từng dòng theo lô. Không truy cập mạng, Git hay DB; không sửa nguồn. Đây là đánh giá ngôn ngữ của mô hình, không phải kiểm chứng từ điển độc lập.

FIX chưa được tính APPROVE; chỉ PATCH `approved` cho verdict `approve`, `rejected` cho `reject`; để `fix` chờ áp bản sửa và duyệt lại. `trap_id`/`source_index` nhận diện chính xác dòng nguồn. Một term có nhiều POS vẫn dùng chung bẫy nên xét mọi nghĩa/POS, không chỉ mục đầu.

| Tiêu chí | APPROVE | REJECT | FIX |
| --- | ---: | ---: | ---: |
| C1 | 4261 | 408 | 0 |
| C2 | 4667 | 2 | 0 |
| C3 | 4207 | 462 | 0 |
| C4 | 4602 | 5 | 62 |
| C5 | 4321 | 0 | 348 |

C1–C5 tính riêng, có thể cùng bắt lỗi một dòng; APPROVE nghĩa không ghi nhận lỗi ở tiêu chí đó, không thay thế verdict chung. C6 tính theo term và số bẫy còn dùng được.

## 20 REJECT tiêu biểu

- #5 **ability → skill**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.
- #9 **about → regarding**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C5: Cần thường đầu câu, trừ tên riêng.
- #12 **accent → tone**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C5: Cần thường đầu câu, trừ tên riêng.
- #42 **achieve → attain**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C5: Cần thường đầu câu, trừ tên riêng.
- #44 **achievement → success**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh.
- #39 **accountant → contact**: C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ. C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.
- #47 **across → crops**: C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ. C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.
- #113 **advantage → advantageous**: C3: Đây là cặp phái sinh cùng họ rõ ràng; chưa có cơ chế bạn giả để gắn loại false. C3: Đây là cặp phái sinh cùng họ rõ ràng; chưa có cơ chế bạn giả để gắn loại false. C5: Cần thường đầu câu, trừ tên riêng.
- #116 **disadvantage → disadvantaged**: C3: Đây là cặp phái sinh cùng họ rõ ràng; chưa có cơ chế bạn giả để gắn loại false. C3: Đây là cặp phái sinh cùng họ rõ ràng; chưa có cơ chế bạn giả để gắn loại false. C5: Cần thường đầu câu, trừ tên riêng.
- #126 **afraid → varied**: C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ. C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.
- #103 **adoption → fostering**: C4: Fostering cũng dùng cho việc chăm sóc trẻ tạm thời; định nghĩa Anh chỉ giới hạn động vật không khớp đối chiếu nhận nuôi con, cần sửa trap_en ngoài phạm vi FIX cho phép. C4: Fostering cũng dùng cho việc chăm sóc trẻ tạm thời; định nghĩa Anh chỉ giới hạn động vật không khớp đối chiếu nhận nuôi con, cần sửa trap_en ngoài phạm vi FIX cho phép. C5: Cần thường đầu câu, trừ tên riêng.
- #243 **approach → approachment**: C4: Approachment được chính dòng nguồn thừa nhận không chuẩn; không dùng từ không chuẩn làm một lựa chọn từ vựng thật. C4: Approachment được chính dòng nguồn thừa nhận không chuẩn; không dùng từ không chuẩn làm một lựa chọn từ vựng thật.
- #821 **community → commune**: C4: Commune là một dạng cộng đồng; định nghĩa Anh not community sai và ô Việt cũng lộ cách loại trừ, cần sửa cả trap_en. C4: Commune là một dạng cộng đồng; định nghĩa Anh not community sai và ô Việt cũng lộ cách loại trừ, cần sửa cả trap_en. C5: Cần thường đầu câu, trừ tên riêng.
- #1035 **dealer → deader**: C4: Deader không phải dạng từ vựng thông dụng phù hợp bộ học này; More dead là cách nói cường điệu theo ngữ cảnh, không có nghĩa đối chiếu ổn định. C4: Deader không phải dạng từ vựng thông dụng phù hợp bộ học này; More dead là cách nói cường điệu theo ngữ cảnh, không có nghĩa đối chiếu ổn định. C5: Cần thường đầu câu, trừ tên riêng.
- #1040 **deal with → deal on**: C4: Deal on không phải cụm động từ chuẩn mang nghĩa thương lượng như bản ghi; không thể cứu bằng sửa nghĩa Việt khi trap_en sai. C4: Deal on không phải cụm động từ chuẩn mang nghĩa thương lượng như bản ghi; không thể cứu bằng sửa nghĩa Việt khi trap_en sai.
- #119 **advise → recommend**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C5: Cần thường đầu câu, trừ tên riêng.
- #123 **advice → suggestion**: C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C1: Cặp có nghĩa thông dụng trùng/đồng nghĩa hoặc dịch Việt tương đương; khác phạm vi, sắc thái, POS được chọn hay độ trang trọng không bảo đảm một đáp án đúng trong quiz hai chiều không ngữ cảnh. C5: Cần thường đầu câu, trừ tên riêng.
- #128 **against → invest**: C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ. C3: Cặp look chỉ trùng vài chữ rời/hậu tố phổ biến; không có độ giống chữ hoặc âm đủ rõ để làm bẫy phân biệt mặt chữ.
- #132 **agree → agree on**: C1: agree/agree on/agree to diễn đạt cùng sự đồng ý; không có bổ ngữ để tách nghĩa, khác giới từ không đủ tạo đáp án sai. C1: agree/agree on/agree to diễn đạt cùng sự đồng ý; không có bổ ngữ để tách nghĩa, khác giới từ không đủ tạo đáp án sai.
- #136 **agreed → agree on**: C1: agree/agree on/agree to diễn đạt cùng sự đồng ý; không có bổ ngữ để tách nghĩa, khác giới từ không đủ tạo đáp án sai. C1: agree/agree on/agree to diễn đạt cùng sự đồng ý; không có bổ ngữ để tách nghĩa, khác giới từ không đủ tạo đáp án sai.

## C6: từ còn dưới 2 bẫy APPROVE

**913 / 2198 term duy nhất** thiếu; nguồn có 2082 mục từ/POS. Các mục trùng term được gộp để khớp khoá bẫy. Từ không có bẫy cũng được liệt kê.

| Từ | APPROVE | Đề xuất / khoảng trống |
| --- | ---: | --- |
| about | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| accent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| accountant | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| achieve | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| across | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| advantage | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| disadvantage | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| afraid | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| against | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| aim | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| among | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| animal | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| announce | 0 | Cùng ROOT chưa có cạnh: announcement; cần duyệt C1–C5 trước khi thêm. |
| announcement | 0 | Cùng ROOT chưa có cạnh: announce; cần duyệt C1–C5 trước khi thêm. |
| any | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| anyone | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| appreciate | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| appreciation | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| approach | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| argument | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| article | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| assume | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| assumption | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attack | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attempt | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| average | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| avoid | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| awake | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| barbecue | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| bathe | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| bath | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| beat | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| become | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| before | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| behaviour | 1 | Cùng ROOT chưa có cạnh: misbehave; cần duyệt C1–C5 trước khi thêm. |
| benefit | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| beneficial | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| beside | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| besides | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| between | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| bonus | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| bridge | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| brother | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| business | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| button | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cabin | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cannon | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| capital | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| centre | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| central | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| challenge | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| change | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| chaos | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| charge | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cheek | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| chest | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| child | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| children | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| clothes | 1 | Cùng ROOT chưa có cạnh: clothing; cần duyệt C1–C5 trước khi thêm. |
| clothing | 1 | Cùng ROOT chưa có cạnh: clothes; cần duyệt C1–C5 trước khi thêm. |
| coincidence | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| community | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| company | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| complete | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| completely | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| conclude | 1 | Cùng ROOT chưa có cạnh: conclusion; cần duyệt C1–C5 trước khi thêm. |
| condition | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| contact | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| countryside | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| country | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| course | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| crop | 0 | Cùng ROOT chưa có cạnh: crops; cần duyệt C1–C5 trước khi thêm. |
| crops | 1 | Cùng ROOT chưa có cạnh: crop; cần duyệt C1–C5 trước khi thêm. |
| crowded | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cup | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cupped | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| current | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| currently | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| daddy | 1 | Cùng ROOT chưa có cạnh: dad; cần duyệt C1–C5 trước khi thêm. |
| dark | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| darkness | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| daylight | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deal | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dealer | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| definite | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| demand | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| demanding | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| difficult | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| difficulty | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| discuss | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| disease | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| disgusting | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| disgusted | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dream | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dress | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dressed | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dressed in | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| drink | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| drop | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dusty | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| effective | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| effort | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| empire | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| emperor | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| end | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ending | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| engineer | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| environmental | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| euro | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| everywhere | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| exactly | 1 | Cùng ROOT chưa có cạnh: exact; cần duyệt C1–C5 trước khi thêm. |
| examine | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| excursion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| expensive | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| experience | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| eyes | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| eye | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fail | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fell | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| far | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| faraway | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| favour | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| favourite | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| feature | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| features | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| female | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| figure | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| figure out | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| finally | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| find out | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fire | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fitness | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| floor | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| focus | 0 | Cùng ROOT chưa có cạnh: focused; cần duyệt C1–C5 trước khi thêm. |
| focused | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| force | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| forced | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| former | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| formerly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fountain | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| function | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| functional | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fund | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| furniture | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| garage | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gathering | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gesture | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gifted | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| glass | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| glasses | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| goddess | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| grab | 0 | Cùng ROOT chưa có cạnh: grabbed; cần duyệt C1–C5 trước khi thêm. |
| grabbed | 0 | Cùng ROOT chưa có cạnh: grab; cần duyệt C1–C5 trước khi thêm. |
| green | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| greenish | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| group | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| guest | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| happen | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| happening | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| head | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| head for | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| high-quality | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hilly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hit | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| homeland | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| horse | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hospital | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hotel | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| house | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| housing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| however | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hugely | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| human | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| humanity | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hurried | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| husband | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| idea | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| imagine | 1 | Cùng ROOT chưa có cạnh: imaginary; cần duyệt C1–C5 trước khi thêm. |
| imaginary | 1 | Cùng ROOT chưa có cạnh: imagine; cần duyệt C1–C5 trước khi thêm. |
| immediate | 0 | Cùng ROOT chưa có cạnh: immediately; cần duyệt C1–C5 trước khi thêm. |
| immediately | 0 | Cùng ROOT chưa có cạnh: immediate; cần duyệt C1–C5 trước khi thêm. |
| income | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| incredibly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| indeed | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| individual | 0 | Cùng ROOT chưa có cạnh: individually; cần duyệt C1–C5 trước khi thêm. |
| individually | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| influence | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| influential | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| invite | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| invitation | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| involve | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| involved | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| issue | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| item | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| itself | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| jacket | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| journey | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| judge | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| judgment | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| jump | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| jumped in | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| june | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| key | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| killer | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| king | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| kiss | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| kitchen | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| well-known | 0 | Cùng ROOT chưa có cạnh: know, knew, known, knowledge, unknown, known as; cần duyệt C1–C5 trước khi thêm. |
| language | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| last | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| lastly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| laughter | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| leave for | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| legend | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| legendary | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| let go | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| level | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| unload | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| lorry | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| lucky | 1 | Cùng ROOT chưa có cạnh: luck; cần duyệt C1–C5 trước khi thêm. |
| luckily | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| lunchtime | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| magic | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| magical | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| main | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mainly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| maintenance | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| male | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| manage | 1 | Cùng ROOT chưa có cạnh: manager; cần duyệt C1–C5 trước khi thêm. |
| material | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| maybe | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| measurement | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| measured | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| medium-size | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| menu | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| metal | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| method | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| middle | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mild | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mildly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| military | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| minister | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mobile | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| modern | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| more | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| motorway | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mountain | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mouth | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mum | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| muscular | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| necklace | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| never | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| newspaper | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| nod | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| nodded | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| none | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| normal | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| normally | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| notice | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| noticeable | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| often | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| old | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| old-fashioned | 0 | Cùng ROOT chưa có cạnh: old, older; cần duyệt C1–C5 trước khi thêm. |
| once | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| opinion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| opportunity | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| orange | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| order | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| panic | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| parent | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| parents | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| particular | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| particularly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| party | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pass by | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| past | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| path | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pause | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| paused | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pay for | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| people | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| percent | 1 | Cùng ROOT chưa có cạnh: percentage; cần duyệt C1–C5 trước khi thêm. |
| percentage | 0 | Cùng ROOT chưa có cạnh: percent; cần duyệt C1–C5 trước khi thêm. |
| perfectly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| period | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pick | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pick up | 1 | Cùng ROOT chưa có cạnh: picked up; cần duyệt C1–C5 trước khi thêm. |
| picked up | 1 | Cùng ROOT chưa có cạnh: pick up; cần duyệt C1–C5 trước khi thêm. |
| picture | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pirate | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pizza | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pocket | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| point | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| point to | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pointed out | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| police | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| positive | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| positively | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| potentially | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| potion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| practise | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| practice | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| presentation | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pretend | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pretty | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| previous | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| previously | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| profit | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| progress | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| project | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| promise | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| protection | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| prove | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| provider | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pull | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pull out | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| purchase | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| push | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| push open | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| put | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| put down | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| puzzled | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| puzzling | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| split into | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| split up | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quarter | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| question | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quick | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quickly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quietly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quit | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| raced | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| radio | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rainy | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rating | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ready | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| recommend | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| record | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| recording | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| reference | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| referral | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| region | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| regional | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| renovate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| renovation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rental | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| replace | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| replacement | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| reply | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| replied | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| represent | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| representative | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| request | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| requirement | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| research | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| researcher | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| resource | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rest | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| restless | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| result | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| return | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rise | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| risen | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| risky | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| river | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rock | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rocky | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| roll | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| roll in | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| room | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| roomy | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rough | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| roughly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| round | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| around | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rule | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ruler | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| run away | 1 | Cùng ROOT chưa có cạnh: ran out of, run ahead, run around, run into; cần duyệt C1–C5 trước khi thêm. |
| sand | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sandwich | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| savings | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| scotland | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| scottish | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| screen | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| scroll | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sea | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| search | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| secret | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| secretly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| seem | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| seemed | 0 | Cùng ROOT chưa có cạnh: seemingly; cần duyệt C1–C5 trước khi thêm. |
| seemingly | 0 | Cùng ROOT chưa có cạnh: seemed; cần duyệt C1–C5 trước khi thêm. |
| serious | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| seriously | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| several | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ship | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| shirt | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| shoe | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| shoes | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| shore | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sibling | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sickness | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| signature | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sir | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sister | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| site | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| skin | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| slight | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| slow | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| slowly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| slow down | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| society | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| soldier | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| solve | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| somehow | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sooner | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sort out | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| south-west | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| space | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| spaceship | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| special | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| especially | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| specific | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| spent | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| spending | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| spy | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| staff | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| starts | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| state | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| station | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stay | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stay away from | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stopped | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stormy | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stout | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| strategy | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stretch | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| strict | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| strictly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| structure | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stuff | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stupid | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stupidly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| successful | 1 | Cùng ROOT chưa có cạnh: succeed; cần duyệt C1–C5 trước khi thêm. |
| sudden | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| suddenly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sunglasses | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sunset | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| supply | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| supplies | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| support | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| talk | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| talkative | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| talked about | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| task | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tax | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| taxi | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| technology | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| technological | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| territory | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| theory | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| theoretical | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| therefore | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| thicket | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| thirty | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| throughout | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tight | 1 | Cùng ROOT chưa có cạnh: tightly; cần duyệt C1–C5 trước khi thêm. |
| tire | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tiring | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| torch | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| total | 0 | Cùng ROOT chưa có cạnh: totally; cần duyệt C1–C5 trước khi thêm. |
| totally | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| touch | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| towards | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trade | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| traditional | 1 | Cùng ROOT chưa có cạnh: tradition; cần duyệt C1–C5 trước khi thêm. |
| transport | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| transportation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| travelled | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trip | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trouble | 0 | Cùng ROOT chưa có cạnh: troublesome; cần duyệt C1–C5 trước khi thêm. |
| troublesome | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ugly | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| uncle | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| unit | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| university | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| vehicle | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| view | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| volunteer | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| voluntary | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wagon | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| warn | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| warning | 1 | Cùng ROOT chưa có cạnh: warn; cần duyệt C1–C5 trước khi thêm. |
| warrior | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| waste | 0 | Cùng ROOT chưa có cạnh: wasteful; cần duyệt C1–C5 trước khi thêm. |
| wasteful | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| watchmaker | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| watery | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| weapon | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wore | 1 | Cùng ROOT chưa có cạnh: worn; cần duyệt C1–C5 trước khi thêm. |
| weather | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| welcoming | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| whisper | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| whispered | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| white | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wife | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wives | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wood | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| woods | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| worried | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wow | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wrong | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| zero | 1 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| liability | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| above | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ascent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dialect | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| except | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| excess | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| archive | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attain | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| adapt | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fostering | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| advantageous | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| drawback | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| disadvantaged | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| suggest | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| suggestion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| most | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| applaud | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| candidate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| value | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gratitude | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| depreciation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| reproach | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| approachment | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| endorse | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| appraisal | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| consent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| argosy | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| debate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| consumption | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| guess | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attempted | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| try | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attentive | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| aver | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| averagely | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mediocre | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| avert | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| evade | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| beet | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| turn into | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| benedict | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| beneficiary | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| bride | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| connect | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| busyness | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| busy | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| isolation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| solitude | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| capitol | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| capitalist | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wealth | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| surely | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| certify | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| channel | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| problem | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| changing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| alter | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| exchange | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| charged | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| altered | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| chaise | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| disorder | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mess | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| bill | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| coincide | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| incident | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| concert | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cozy | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| conveniently | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| commune | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| neighborhood | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| companion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| companionable | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| enterprise | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| corporation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rival | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| competent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| completion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| concernment | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| conditional | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| situation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| consist | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ponder | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deliberation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| contemplation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| content | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| framework | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| cast | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| price | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| custom | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attire | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| uniform | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| crap | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trim | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| currant | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| currency | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deader | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| broker | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deal in | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deal on | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deceive | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| definitively | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| defiantly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| demands | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| need | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| demeaning | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| exacting | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| process | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| print | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| developing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| distinct | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| frustrated | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| unsatisfactory | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| discus | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| conversation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| decease | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| diseased | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| unfocused | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| attraction | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| dune | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ecology | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| market | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| financial | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| economics | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| affect | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| affective | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| efficient | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| embrace | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| humiliate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| embraced | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| embracing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| incur | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| motivate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| environ | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| habitat | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| surroundings | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| evidential | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| witness | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| example | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| exam | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| inspect | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| exhort | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| exhaustive | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| expansive | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| experiment | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| experiencing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| explode | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| investigate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| flounder | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| feel | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| filler | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| defeat | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mistake | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| similar | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| familiarity | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| featured | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| future | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| figurine | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| number | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| digit | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fry | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| blaze | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| flame | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fiercely | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| flour | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ground | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fallow | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| subscriber | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| forgo | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| functionality | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| operational | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| decorative | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gutter | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| collect | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gestate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gaol | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| objective | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gold | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| grasp | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| snatch | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| grate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| good | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| grouse | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| hurtful | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| high quality | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| top quality | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| identification | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| recognize | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| uninformed | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| image | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| visualize | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fantasy | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| imported | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| impotence | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| improvise | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| enhance | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| outcome | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| incoming | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| revenue | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| salary | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| incense | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| amplify | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| barely | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| indict | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| indicator | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| data | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| notified | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| informal | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fascinating | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| invent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| judgement | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| judgemental | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| well known | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| linguistic | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| upload | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| discharge | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| unpack | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| loose | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fortune | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| retain | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sustain | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| keep | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| repair | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| massage | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| control | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| handle | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| meter | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| gauge | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| evaluation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| measuring | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| medium size | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| large size | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mentionable | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| remind | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| communication | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| note | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| manner | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| means | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| mildew | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trend | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| protest | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| officious | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| old fashioned | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| old-fashion | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| option | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| opinion about | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| opportunist | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| opportunistic | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| possession | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| packaging | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| partially | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| very | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pat | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| route | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pathway | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| patent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pasta | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| property | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| destitution | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| weakly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| populace | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| populate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| posit | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| positivity | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| potent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| capability | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| potently | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| weak | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| representation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| presenter | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| demonstration | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tension | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pleasure | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| prolly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| professor | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| expert | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| advancement | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| projector | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| projection | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| scheme | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| probe | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| demonstrate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| confirm | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| proofing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| fetch | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| commit | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| spit | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quarrel | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| quarterly | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trimester | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| semester | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| resign | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| raiser | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| elevate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ration | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| ranking | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| realist | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| perception | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| commend | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| reconciliation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| transfer | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| concerning | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| version | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| launch | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| innovate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| restore | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| decorate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| innovation | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| remodeling | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| acquire | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| aspect | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| respectively | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| response | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| comeback | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| refund | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| security | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| send | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| polish | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| rescue | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| seasoned | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| temporary | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| seasonalized | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| seeker | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| desperate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| host | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| deliver | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| shortage of | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| skull | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| talent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| salve | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| solvent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| resolution | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| south west | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| north west | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| specify | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| detailed | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| expenditure | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| standby | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| sitcom | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| warehouse | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tragedy | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tactics | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| strategically | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tactical | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stitch | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stretched | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| extend | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| expand | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| string | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| lengthen | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| stricture | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| structural | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| construction | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| proceed | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| succession | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| successor | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| prosperous | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| surfing | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| pain | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| suffrage | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| supple | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| supplier | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| provision | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| suppose | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| aid | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| supporting | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| survey | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| endure | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| team | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| terminology | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| expression | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| theorem | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| theory of | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tide | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| tightening | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| secure | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| transitional | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| conventional | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trustee | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| believable | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| trusty | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| honest | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| undertake | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| understate | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| undertaking | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| comprehension | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| visibility | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| apparent | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| invisibility | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| warp | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| alert | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| warn about | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| waist | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| wasting | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| weekday | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| holiday | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| weekend day | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| widow | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| opening | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |
| anxious | 0 | Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT. |

## Tái lập và giới hạn

`python tools/wf_import/trap_review.py build` kiểm đủ quyết định, SHA nguồn, chạy luật máy, hợp nhất với phán đoán đã lưu rồi tái tạo JSON/Markdown. Script không gọi mô hình để tự chấm các dòng mới; dữ liệu đổi sẽ dừng vì SHA không khớp.
Không đọc PDF gốc ở đường dẫn Temp đã ghi trong metadata; quan hệ ROOT là từ bản trích `wf_parsed.json`. Cặp phái sinh rõ được đánh giá ngôn ngữ; đề xuất bổ sung chưa được đưa vào kết quả approved.
Kiểm chứng cuối: đủ 4.669 chỉ số và ID duy nhất, tổng verdict khớp, FIX có sửa cụ thể và qua kiểm tra máy lần nữa, danh sách C6 đối chiếu tất cả term. Không có kiểm định từ điển hay người duyệt thứ hai độc lập.
