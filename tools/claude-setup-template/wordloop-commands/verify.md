---
description: Kiểm bằng Node (context.js, bài đọc) trước khi giao việc
argument-hint: [mô tả việc cần kiểm]
---
Kiểm tra bằng Node, KHÔNG cần trình duyệt. Việc cần kiểm: $ARGUMENTS

- `require()` thẳng file JS (vd `js/context.js`), shim tối thiểu `global.window`, `window.esc`, `localStorage`, `fetch`.
- Với bài đọc viết tay (xem CLAUDE.md mục "Khi viết bài đọc tay hàng loạt"):
  - `Context.gapSentences(marked).length === 10`, khớp đúng 10 term của Block, không thiếu/thừa/trùng.
  - Số chữ `Context.build(marked).plain.trim().split(/\s+/).length` >= 450.
  - `Context.translate(g.text, g.term, null, meta.vi)` khác rỗng cho MỌI gap.
  - `Context.parseMeta(marked + Context.META_SEP + JSON.stringify(meta)).marked === marked`.
- Báo kết quả thật (pass/fail kèm output). Không nói "xong" nếu chưa chạy.
