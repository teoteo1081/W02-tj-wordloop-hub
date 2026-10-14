# HUONG_DAN_LAM_O_NHA.md — kéo repo về máy khác và làm tiếp

> Dành cho TJ (và Claude ở máy mới). Repo này CÔNG KHAI: KHÔNG có khoá, token, sách/đề có bản quyền. Những thứ đó phải mang theo bằng cách khác (mục 3).

## 1. Cài một lần trên máy mới
- Git, Python 3.12, Node.js, VS Code + tiện ích Claude Code (đăng nhập cùng tài khoản), GitHub CLI `gh` (đăng nhập: `gh auth login` — cần cho repo riêng tư).
- `pip install pymupdf pillow opencv-python faster-whisper pyspellchecker boto3 numpy`
- winget: Tesseract-OCR, FFmpeg (`winget install UB-Mannheim.TesseractOCR Gyan.FFmpeg`).
- Windows: đặt biến `PYTHONUTF8=1` khi chạy Python (nếu không ghi file tiếng Việt lỗi).

## 2. Kéo toàn bộ repo
Nên đặt đúng đường dẫn như máy cũ để dùng lại memory của Claude: `C:\Users\User\Desktop\TJ\Project\`.
```powershell
mkdir C:\Users\User\Desktop\TJ\Project -Force; cd C:\Users\User\Desktop\TJ\Project
gh repo list teoteo1081 --limit 100 --json name -q ".[].name" | ForEach-Object { if (-not (Test-Path $_)) { git clone "https://github.com/teoteo1081/$_.git" } }
# lần sau chỉ cần cập nhật:
Get-ChildItem -Directory | ForEach-Object { git -C $_.FullName pull --ff-only }
```
- Trước khi sửa trong `W02-tj-wordloop-hub`: `git status -sb` (thư mục có thể đang ở nhánh khác `main`). Cần đưa lên `main` thì dùng `git worktree add ../_tmp origin/main`.
- Trang web chạy từ nhánh `main` qua GitHub Pages: https://teoteo1081.github.io/W02-tj-wordloop-hub/ (sửa xong push, khoảng 1 phút sau Ctrl+F5).

## 3. Những thứ KHÔNG nằm trong git (phải mang theo hoặc tạo lại)
| Thứ | Ở đâu (máy cũ) | Cách có ở máy mới |
|---|---|---|
| Memory của Claude | `C:\Users\User\.claude\projects\c--Users-User-Desktop-TJ-Project\memory\` | Copy nguyên thư mục (USB/OneDrive). Đường dẫn dự án phải giống nhau thì Claude mới tự nhận |
| Khoá bí mật | `C:\Users\User\.tj-secrets\` (`kho.env` = token R2; `gemini.env` = khoá Gemini phụ) | Copy riêng, KHÔNG qua git/chat |
| Supabase PAT | không lưu | TJ tạo mới ở https://supabase.com/dashboard/account/tokens khi cần, dùng xong thu hồi |
| Sách/đề gốc ETS (PDF, audio, zip) | `Desktop\TJ\_staging\ETS 2023\`, `Project\L07-toeic\2023\` | Chỉ cần khi nạp đề MỚI. Bản sao lưu: R2 bucket `tj-source-staging` |
| Dữ liệu trung gian (OCR, whisper, cues…) | `Desktop\TJ\_work\ets2023\` | Không cần mang: dựng lại bằng công cụ ở `tools/ets2023/` |
| Khoá Gemini/OpenAI chính của proxy | secret trên Supabase (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `OPENAI_API_KEY`) | Đã ở server, không cần làm gì |

## 4. Làm việc với Claude Code ở máy mới
1. Mở VS Code ở `C:\Users\User\Desktop\TJ\Project`, bật Claude Code.
2. Nhắn mở đầu (dán nguyên, sửa Việc cho phù hợp):
```
Đọc trước: memory dự án, W02-tj-wordloop-hub/PLAN_TONG.md, HUONG_DAN_LAM_O_NHA.md,
tools/ets2023/QUY_TRINH_NAP_DE.md và PLAN_TOEIC_SW_GAME.md.
Việc hôm nay: <ghi việc, ví dụ: làm skill exam-ingest / nạp ETS 2025 / thẻ TOEIC S&W>.
Ràng buộc: ưu tiên Python, ít tốn token; không commit sách/đề bản quyền hay khoá; kiểm git status trước khi commit.
```
3. Công cụ nạp đề: copy `tools/ets2023/*` vào thư mục làm việc `Desktop\TJ\_work\ets2023\` (các file của `book/` vào `_work\ets2023\book\`); nguồn đề đặt ở `Desktop\TJ\_staging\ETS <năm>\TEST N\`. Thứ tự lệnh: `tools/ets2023/QUY_TRINH_NAP_DE.md` mục 1.
4. Đường dẫn sách chữa đổi được bằng biến môi trường `ETS_BOOK_DIR` (mặc định `C:/Users/User/Desktop/TJ/Project/L07-toeic/2023`).

## 5. Trước khi rời máy cũ
- Mỗi repo: `git status -sb` (không còn thay đổi chưa commit) và `git push`.
- Copy memory + `.tj-secrets` (mục 3).
- Thu hồi PAT Supabase đã tạo trong phiên.
