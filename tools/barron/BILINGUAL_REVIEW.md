# Barron: sửa bài song ngữ

Yêu cầu TJ ngày 2026-10-24: khi sửa bài, hiện lần lượt tiếng Anh rồi bản dịch tiếng Việt tương ứng. Thực hiện trên nhánh `feat/barron-bilingual-review`, theo yêu cầu trực tiếp của TJ; chưa deploy.

Renderer của game nhận các cặp câu hoặc đoạn đã được đối chiếu trong `test_items.i18n.vi.passage_pairs`:

```json
{"vi":{"passage_pairs":[{"en":"The meeting starts at nine.","vi":"Cuộc họp bắt đầu lúc chín giờ."}]}}
```

Ví dụ tự viết, không trích sách. Mỗi cặp phải có cả `en` và `vi`, giữ đúng thứ tự nguồn. Không tự tách theo dấu chấm hay ghép hai danh sách theo chỉ số. Các cặp hiện sẵn trong phần sửa bài, kể cả khi chưa có `explain`; bản dịch cũ trong `passage` vẫn dùng cho dữ liệu chưa có cặp hợp lệ. Cả Anh và Việt được escape trước khi render. `i18n` đi theo luồng câu hỏi/review hiện có.

Kiểm tra: `node tools/qa/bilingual_review_test.js` và `node --check js/game.js`.

Giới hạn: thay đổi này là phần hiển thị. Chưa có pipeline trích/ghép bản dịch sách, chưa nạp các cặp lên Supabase, chưa mở bộ đề Barron trong bộ chọn (game hiện vẫn truy vấn `exam='toeic'`). Vì vậy chưa thể xem bài sách thật trên web chỉ bằng thay đổi này. Cần hoàn tất dữ liệu và luồng chọn Lesson để dùng từ đầu đến cuối. Không coi thay đổi này là đã đưa sách vào game.
