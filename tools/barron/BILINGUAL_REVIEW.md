# Barron 600 — 50 bài Words in Context song ngữ riêng tư

Checkpoint 2026-10-25, nhánh `feat/barron-bilingual-50`. TJ yêu cầu làm hết 50 bài sau khi được báo trạng thái mẫu Lesson1–2. Phạm vi hoàn thành là **Words in Context Anh–Việt**, không mở rộng sang Listening hoặc Reading Part5/6/7.

## Kết quả

- 50 Lesson, 600 câu, 156 cặp đoạn Anh–Việt; mỗi Lesson có 12 chỗ trống và 4 lựa chọn/câu.
- Bảng đáp án sách đã kiểm ảnh PDF333–336; chấp nhận các biến thể mà sách ghi rõ. Chỗ trống chọn đúng vị trí trong bài: bốn trường hợp từ lặp được đối chiếu gạch chân trong PDF dịch, không lấy lần xuất hiện đầu tiên.
- Trích theo hai cột và đoạn thụt đầu dòng, giới hạn trong ô bài đọc để loại ghi chú từ vựng phía dưới. Không tự tách câu theo dấu chấm. Đáp án điền lại phải khôi phục chính xác đoạn Anh đã hiệu đính.
- Nguồn là PDF dịch do TJ cung cấp. Các lỗi dính chữ, lỗi nghĩa rõ và thiếu từ đã được hiệu đính, lưu đầy đủ `before/after/reason` trong JSON riêng tư. Đây không phải bản dịch mới do dịch giả chuyên nghiệp chứng nhận. Sách gốc cũng có lỗi: ví dụ Lesson21 dùng “lender” cho bên bị ràng buộc lịch thanh toán; giữ theo nguồn, không dùng đoạn này làm hướng dẫn tài chính.

## Cách chơi và bảo mật dữ liệu

`learn/barron/` là trình chơi riêng tư, không có dữ liệu sách trong Git. Chọn file JSON đã xử lý để mở đủ50 bài, hoặc dùng bản HTML đóng gói riêng tư tự chứa dữ liệu. Có Cả bài/Từng câu, chọn Lesson, nộp và chấm12 câu, lọc câu sai, làm lại. Bản dịch chỉ xuất hiện sau khi nộp, mỗi đoạn Anh rồi đến Việt. Không ghi nội dung hoặc điểm vào localStorage, Supabase hay realtime; không ghi tiến độ Tony Buzan. Notebook từ vựng và game phòng hiện có giữ cơ chế riêng.

Bản HTML đóng gói chạy hoàn toàn local và chặn kết nối ra ngoài bằng CSP. Mã trình chơi có thể lưu Git; JSON, PDF, OCR, các hiệu đính chứa nội dung nguồn và HTML đã đóng gói **không được commit/push vào repo public**. `import_bilingual.js` cũ nhập hai Lesson qua anon đã chuyển thành kiểm tra riêng tư đủ50 bài, không còn thao tác ghi cloud.

Dữ liệu trên máy này: `/Users/thaonguyen/Documents/GIT/_private/barron600/`. File chơi: `Barron600-50-bai-song-ngu.html`. Không suy ra đã có50 bài trên website production hoặc trong `test_items`: **phiên này không ghi cloud/deploy main**.

## Tái tạo

Cần Python với `PyMuPDF==1.26.7`, Node, nguồn PDF và các file riêng tư `heads.json`, `key_rc.json`, `source_edits.json`. Không có API AI trả phí.

```sh
python tools/barron/build_bilingual.py --pdf <PDF-dich> --heads <private>/heads.json --keys <private>/key_rc.json --edits <private>/source_edits.json --out <private>
node tools/barron/import_bilingual.js <private>
python tools/barron/package_private.py --data <private>/bilingual_items.json --out <private>/Barron600-50-bai-song-ngu.html
```

Build thiếu bất kỳ Lesson/đáp án/cặp đoạn nào sẽ báo lỗi và không ghi đè bộ dữ liệu đầy đủ trước đó. `key_rc.json` phải ghi trang đáp án và xác nhận đã kiểm ảnh; các vị trí lặp dùng `target_occurrences` chỉ số từ0. Bộ đóng gói kiểm lại đầy đủ600 câu trước khi xuất.

## Bằng chứng kiểm thử

- `node tools/qa/barron_private_test.js`: đủ50×12, ID, giới hạn Lesson/Part, nhãn/lựa chọn, đáp án, đoạn thiếu dịch, chỗ trống và khôi phục nguyên văn; kiểm các đầu vào lỗi.
- `python tools/qa/barron_builder_test.py`: loại ghi chú ngoài ô, chọn đúng lần xuất hiện đã đối chiếu, chặn key chưa kiểm ảnh và thiếu Lesson.
- `node tools/qa/bilingual_review_test.js`: renderer game cũ escape HTML, thứ tự Anh–Việt, fallback, chưa lộ đáp án thì không render bản dịch.
- Chrome thật với dữ liệu đã tạo: desktop1366px làm đủ50 bài, tất cả đạt12/12 khi chọn theo key; mobile390px kiểm Lesson1/23/50. Kiểm Từng câu, giữ lựa chọn, nộp, làm lại, không tràn ngang, không lỗi JS. CSP chặn yêu cầu mạng thử nghiệm. Không vào phòng thật, không ghi database.
- QA độc lập đọc toàn bộ156 cặp đoạn, kiểm600 chỗ trống theo key/gạch chân và rà lỗi dịch có ý nghĩa. Các kết quả chỉ phản ánh bộ dữ liệu đã kiểm; không tuyên bố nguồn sách/bản dịch hoàn hảo.

Bản renderer/selector đang dở từ `feat/barron-bilingual-review` vẫn nằm trên nhánh tính năng. Không nhập nội dung sách vào Supabase public để kích hoạt selector đó. Đưa phần tính năng vào production cần được xử lý riêng theo quy tắc làn của dự án.

## Yêu cầu đưa lên Supabase — chờ quyền đọc công khai

TJ yêu cầu đưa tài liệu chơi game lên Supabase sau checkpoint riêng tư. Đã chuẩn bị `upload_supabase.js` cho đủ600 dòng, kiểm tra schema, ID và sao lưu; GET tiền kiểm thấy0 dòng Barron. Bảng `test_items` hiện đọc được bằng anon. Lần chạy `--apply` bị bộ duyệt tự động từ chối vì chưa có xác nhận riêng cho việc công khai nội dung bài đọc/bản dịch. **Chưa ghi dữ liệu cloud.** Cần xác nhận rõ quyền đọc công khai trước khi chạy lại. Script chỉ ghi exam barron600 với id đã kiểm, không đổi cấu trúc/RLS hoặc dữ liệu TOEIC/EA; đọc lại toàn bộ và so sánh nội dung/hash sau ghi.
