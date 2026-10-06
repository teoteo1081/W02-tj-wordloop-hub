# Hướng dẫn cho MÁY/PHIÊN KHÁC: dựng repo `claude-setup` (soạn 2026-10-06)

**Bối cảnh**: TJ muốn 1 bộ quy tắc dùng chung cho mọi dự án (khỏi bàn lại từ đầu): 3 lệnh slash chung + `CLAUDE.md` mẫu. Phiên cloud soạn bản này chỉ có quyền với repo W02 nên KHÔNG tạo được repo mới (GitHub trả 403 khi tạo `claude-setup`). Toàn bộ nội dung đã để sẵn trong thư mục này. Việc của bạn: đưa nó thành repo riêng.

## Trong thư mục này có gì
| Đường dẫn | Là gì |
|---|---|
| `.claude/commands/start.md`, `sync.md`, `task.md` | 3 lệnh CHUNG (đã bỏ chi tiết riêng WordLoop) |
| `CLAUDE.md.template` | 10 luật chung TJ đã dặn + mục `[RIÊNG]` điền theo từng dự án |
| `README.md` | Hướng dẫn dùng cho repo `claude-setup` (sẽ là README của repo mới) |
| `wordloop-commands/` | 4 lệnh RIÊNG của WordLoop (`/bump /verify /qa /ship`), chỉ để lưu; không đưa vào `claude-setup` |

## Các bước (làm theo thứ tự)
1. `git pull` repo W02 để có thư mục này. Đọc `CLAUDE.md` + `TEAM_PROCESS.md` của W02 trước.
2. **Tạo repo `claude-setup`** (nên **Private**, tài khoản `teoteo1081`). Nếu chưa có quyền tạo repo: nhờ TJ tạo repo trống trên GitHub, rồi gắn vào phiên (`add_repo`, access `push`).
3. Chép vào repo mới (KHÔNG chép `wordloop-commands/` và `HUONG_DAN.md`):
   ```bash
   cp -r tools/claude-setup-template/.claude <claude-setup>/
   cp tools/claude-setup-template/CLAUDE.md.template tools/claude-setup-template/README.md <claude-setup>/
   ```
4. Commit + `git push -u origin main` trong repo `claude-setup`.
5. **Kiểm**: mở repo mới thấy 5 file; thử `/sync` và `/start` trong 1 thư mục có `.claude/commands/` đã chép. Báo TJ cái gì đã thử thật, cái gì chưa.
6. **Xong thì dọn**: xoá thư mục `tools/claude-setup-template/` khỏi W02 (hoặc giữ `wordloop-commands/` nếu TJ muốn), và xoá dòng trỏ tới đây trong `HANDOFF.md`.

## Việc còn treo — HỎI TJ trước, đừng tự làm
- **7 lệnh riêng WordLoop** (`/start /sync /task /verify /bump /qa /ship`) đang nằm trong `.claude/commands/` của W02 nhưng `.gitignore` dòng `.claude/` bỏ qua nó -> mất khi máy cloud bị xoá. Cách giữ: đổi `.gitignore` thành `.claude/*` + `!.claude/commands/` rồi commit. TJ CHƯA đồng ý (mới hỏi tác động); 4 lệnh riêng đã sao lưu ở `wordloop-commands/`.
- Bản chung của `/task` vẫn nhắc `TEAM_PROCESS.md`/`HANDOFF.md`; dự án không có 2 file đó thì bỏ qua.

## Luật nhớ khi làm
Không dán key/token vào file nào; không commit file đề ETS; push `main` bằng lệnh riêng `git push origin main`; chỉ push khi TJ cho phép.
