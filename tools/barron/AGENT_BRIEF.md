# AGENT_BRIEF — bổ sung từ vựng Barron 600 (giao cho Gemini / Codex / AGY)

Brief này cho AI làm phụ không biết gì về dự án. Chỉ làm đúng việc dưới đây, không làm thêm.

## Việc cần làm
Mỗi lô là 1 Lesson (1 file JSON đầu vào). Với MỖI từ, điền các trường còn thiếu:
`pos`, `ipa`, `def_en` (≤ 15 từ, tiếng Anh đơn giản), `level` (CEFR A1–C2), `meaning_vi`, `meaning_zh`, `meaning_es`.
Nghĩa ngắn, đúng nghĩa trong ngữ cảnh TOEIC (kinh doanh/văn phòng), không dịch word-by-word.

## Định dạng trả về
Chỉ trả JSON hợp lệ, không thêm chữ nào ngoài JSON. Giữ nguyên thứ tự và số phần tử của đầu vào.

```json
{
  "lesson": 2,
  "words": [
    {
      "term": "compete",
      "pos": "verb",
      "ipa": "/kəmˈpiːt/",
      "def_en": "to try to win or be better than others",
      "level": "B2",
      "level_source": "ai",
      "meaning_vi": "cạnh tranh",
      "meaning_zh": "竞争",
      "meaning_es": "competir"
    }
  ]
}
```

- `term` giữ NGUYÊN như đầu vào (không đổi dạng từ, không đổi hoa/thường).
- `level_source`: `"list"` nếu mức CEFR lấy từ danh sách tham chiếu được giao kèm, `"ai"` nếu tự chấm (TJ sẽ rà các từ `"ai"`).
- Không chắc thì để `null`, KHÔNG bịa.

## Điều cấm
- KHÔNG giữ, hỏi hay dùng khoá Supabase/OpenAI/R2 hay bất kỳ token nào. Không gọi API của dự án.
- KHÔNG chép nguyên văn nội dung sách (định nghĩa/ví dụ/đoạn văn của Barron) vào kết quả hay vào commit — sách có bản quyền; `def_en` phải tự viết.
- KHÔNG commit file đầu vào hay kết quả vào repo; JSON nằm trong khu material riêng tư trên máy local.
- KHÔNG sửa file nào ngoài file kết quả của lô.

## Tự kiểm trước khi nộp (checker)
Mỗi lô phải chạy `tools/barron/check_batch.js` (sẽ viết ở bước G2) và báo kết quả. Tối thiểu phải đạt:
1. Số từ đầu ra = số từ đầu vào; mọi `term` khớp từng ký tự.
2. Không trường bắt buộc nào rỗng (trừ `null` có chủ đích, phải liệt kê).
3. `level` thuộc A1–C2; `level_source` thuộc `list`/`ai`.
4. `ipa` bắt đầu và kết thúc bằng `/`; không có nghĩa trùng nhau giữa 2 từ khác nhau trong cùng lô.
