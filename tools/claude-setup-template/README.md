# claude-setup
Bộ mẫu dùng chung cho mọi dự án của TJ: 3 lệnh slash chung + `CLAUDE.md` mẫu.

| Lệnh | Việc |
|---|---|
| `/start` | Khởi động phiên: đọc tài liệu, git log, tóm tắt việc dang dở, hỏi làm gì trước |
| `/sync` | `git fetch` + `pull --ff-only` an toàn, kiểm stash, báo cáo diff |
| `/task` | Đọc backlog trong README rồi làm tiếp việc chưa xong (việc lớn/tốn tiền thì hỏi trước) |

## Dùng cho dự án mới
```bash
cp -r claude-setup/.claude <repo-moi>/
cp claude-setup/CLAUDE.md.template <repo-moi>/CLAUDE.md   # rồi điền mục [RIÊNG]
```
Nhớ kiểm `.gitignore` của repo mới có đang bỏ qua `.claude/` không; nếu có, đổi thành `.claude/*` + `!.claude/commands/`.

## Lệnh riêng từng dự án
Các lệnh gắn với 1 dự án (vd WordLoop: `/bump`, `/verify`, `/qa`, `/ship`) để trong repo đó, không đưa vào đây.

## Cập nhật bản mẫu
Sửa luật chung thì sửa ở đây trước, rồi chép sang các repo đang dùng.
