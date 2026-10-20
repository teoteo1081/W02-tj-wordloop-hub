# WORKTREE_ANCHOR — worktree này dùng để làm gì

> Đọc file này đầu tiên nếu bạn (người hoặc AI) mở đúng thư mục này. Nó chỉ nói **worktree này tồn tại để làm gì và không được làm gì**. Nội dung kế hoạch nằm ở `PLAN_RESTRUCTURE.md`, không lặp lại ở đây.

## Nhận dạng

| | |
|---|---|
| Thư mục | `C:\Users\User\Desktop\TJ\_work\wt-restructure-plan` |
| Nhánh | `feat/restructure-plan` |
| Rẽ từ | `origin/main` tại `e324beb` (2026-10-20) |
| Checkout chính | `C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub` (nhánh `main`, không thuộc worktree này) |
| Upstream | **Cố ý để trống.** Lúc tạo, nhánh tự theo dõi `origin/main`; đã gỡ để một lệnh `git push` trần không đẩy thẳng lên `main`. |

## Mục đích

Worktree này là **chỗ riêng, tách khỏi checkout chính, để đánh giá và lập kế hoạch tái cấu trúc codebase** (giữ nguyên logic sản phẩm và giao diện, chỉ đổi cấu trúc), rồi — sau khi TJ duyệt — thực hiện luồng restructure theo `PLAN_RESTRUCTURE.md`.

Nó tồn tại vì:
- Checkout chính đang có thay đổi tài liệu dở dang và là nơi làm việc hằng ngày; việc restructure kéo dài nhiều phiên không được làm lẫn vào đó.
- Cần một nơi có lịch sử commit riêng để so sánh kế hoạch trước/sau và quay lại được.

## Trong thư mục này có gì

| File | Vai trò |
|---|---|
| `WORKTREE_ANCHOR.md` | File này: mục đích và luật của worktree |
| `PLAN_RESTRUCTURE.md` | Kế hoạch tái cấu trúc (nguồn sự thật của việc cần làm, các luồng A/B/C, câu hỏi chờ TJ quyết) |
| `AUDIT_INFRA_ADVISOR.md` | Báo cáo audit hạ tầng/bảo mật làm đầu vào. Có chỗ chưa khớp code thật; phần đối chiếu nằm ở mục 3 của `PLAN_RESTRUCTURE.md`. Không sửa file audit để chữa chỗ sai, ghi errata vào plan |

## Luật của worktree này

**Được làm:**
- Đọc, đo, đối chiếu code; sửa và commit các file kế hoạch/tài liệu ở đây.
- Commit cục bộ trên `feat/restructure-plan`.

**Chưa được làm cho đến khi TJ duyệt `PLAN_RESTRUCTURE.md` và trả lời mục 9 của nó:**
- Sửa bất kỳ file trong `js/`, `css/`, `index.html`, `game.html`, `sw.js`, `data/`, `supabase/`, `tools/`.
- Chạy SQL lên Supabase, deploy Edge Function hay Worker, đổi secret.

**Không bao giờ:**
- `git push origin main` hoặc đẩy nhánh này lên `main` mà TJ chưa bảo. `push origin main` luôn là một lệnh riêng (`CLAUDE.md`).
- Đưa lại `GEMINI_API_KEY`/token vào file, commit file đề ETS.
- Mở `game.html` trơn hoặc vào phòng thật "TJ" khi kiểm thử; dùng phòng `ZZ_…`.
- Chạy việc vá bảo mật (luồng B: proxy AI, Worker `tj-shelf`) trong nhánh này. Luồng đó tách nhánh `fix/…` riêng vì deploy nằm ngoài git.

## Trạng thái hiện tại

Giai đoạn **lập kế hoạch**. Chưa có dòng code ứng dụng nào bị đổi. Việc kế tiếp phụ thuộc câu trả lời của TJ ở mục 9 của `PLAN_RESTRUCTURE.md`; bước đầu tiên khi được duyệt là tích hợp baseline đã chốt (xem `PLAN_RESTRUCTURE.md` mục 5: `origin/main` đã là tổ tiên của nhánh này, commit `8b071e6` chỉ có ở `main` cục bộ) rồi làm A0 (lưới an toàn).

Khi trạng thái đổi (bắt đầu A0, hoàn thành một pha, hủy), sửa đúng mục này trong cùng commit.

## Cách kiểm worktree còn đúng mục đích

```
git -C C:/Users/User/Desktop/TJ/_work/wt-restructure-plan status -sb          # phải là ## feat/restructure-plan (không có ...origin/main)
git -C C:/Users/User/Desktop/TJ/_work/wt-restructure-plan diff --stat origin/main -- js css index.html game.html sw.js   # phải trống khi còn ở giai đoạn lập kế hoạch
```

## Khi nào dọn worktree

- Restructure xong và đã vào `main`, hoặc TJ quyết định hủy: `git worktree remove C:/Users/User/Desktop/TJ/_work/wt-restructure-plan`, rồi xoá nhánh nếu đã merge hoặc bị bỏ. Không xoá khi còn commit chưa vào đâu cả.
- Nếu chỉ một phần kế hoạch được giữ, chuyển phần đó sang `README.md` (mục "Việc còn dang dở") hoặc `CLAUDE.md` (quyết định đã chốt) trước khi dọn, theo vai trò 3 file tài liệu ghi trong `CLAUDE.md`.
