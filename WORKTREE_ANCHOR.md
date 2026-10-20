# WORKTREE_ANCHOR — worktree này dùng để làm gì

> Đọc file này đầu tiên nếu bạn (người hoặc AI) mở đúng thư mục này. Nó chỉ nói **worktree này tồn tại để làm gì và không được làm gì**. Nội dung kế hoạch nằm ở `PLAN_RESTRUCTURE.md`, không lặp lại ở đây.

## Nhận dạng

| | |
|---|---|
| Thư mục | `C:\Users\User\Desktop\TJ\_work\wt-restructure-plan` |
| Nhánh | `feat/restructure-plan` (tên giữ nguyên; đổi tên chỉ khi TJ bảo) |
| Rẽ từ | `origin/main` tại `e324beb` (2026-10-20). **Baseline đã chốt: `e324beb`.** |
| Checkout chính | `C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub` (nhánh `main`, không thuộc worktree này) |
| Upstream | **Cố ý để trống.** Lúc tạo, nhánh tự theo dõi `origin/main`; đã gỡ để một lệnh `git push` trần không đẩy thẳng lên `main`. |

## Mô hình vận hành (TJ chốt 2026-10-20)

1. **`main` đóng băng.** Là bản TJ dùng hằng ngày, tiếp tục được GitHub Pages phục vụ. Không ai sửa, không merge vào, không push lên `main` trong suốt quá trình restructure.
2. **Mọi việc chỉ làm trong worktree này.** Không tạo nhánh `fix/…`/`feat/…` riêng ở nơi khác cho việc thuộc restructure; mỗi bước là một hoặc vài commit có thông điệp rõ trên `feat/restructure-plan`.
3. **Không merge `main` hay nhánh khác vào đây.** Cần lấy một commit từ nơi khác thì **cherry-pick** (đã làm một lần: kế hoạch Netlify, `9ce51fd` ← `e94e086`). Baseline không đổi; `8b071e6` (chỉ có ở `main` cục bộ, chưa push) **không** vào nhánh này.
4. **Hai dòng chạy song song:** `main` → GitHub Pages (bản cũ, TJ dùng); `feat/restructure-plan` → Netlify (bản mới, để kiểm thử). Duy trì song song cho tới khi worktree này **freeze**.
5. **Kết thúc:** khi worktree freeze, bản restructure **thay thế hoàn toàn `main` cũ**. Cách thay: lưu `main` cũ thành nhánh/tag `archive/main-before-restructure-<ngày>`, rồi đưa `origin/main` tiến tới đầu nhánh này bằng **fast-forward, không force-push** (làm được vì `origin/main` = tổ tiên của nhánh này, miễn `origin/main` không tiến thêm; vì vậy **không được push gì lên `origin/main`** trong thời gian này, kể cả `8b071e6`). Đây là một quyết định và một lệnh riêng của TJ, không tự động.

## Mục đích

Worktree này là **chỗ riêng, tách khỏi checkout chính, để đánh giá, lập kế hoạch rồi thực hiện tái cấu trúc codebase** (giữ nguyên logic sản phẩm và giao diện, chỉ đổi cấu trúc) theo `PLAN_RESTRUCTURE.md`, sau khi TJ duyệt.

Nó tồn tại vì:
- `main` phải ổn định để TJ dùng app trong lúc restructure kéo dài nhiều phiên.
- Cần một dòng lịch sử riêng để so sánh trước/sau, kiểm thử song song và quay lại được.

## Trong thư mục này có gì

| File | Vai trò |
|---|---|
| `WORKTREE_ANCHOR.md` | File này: mục đích, mô hình vận hành và luật của worktree |
| `PLAN_RESTRUCTURE.md` | Kế hoạch tái cấu trúc (nguồn sự thật của việc cần làm, các luồng A/B/C/H, câu hỏi chờ TJ quyết) |
| `SPEC_RESTRUCTURE.md` | Đặc tả trạng thái đích: bất biến I1–I9, cấu trúc, quy tắc phụ thuộc, hợp đồng lớp dữ liệu, version/cache, giao thức game, tiêu chí nghiệm thu |
| `ROADMAP_RESTRUCTURE.md` | Lộ trình: cột mốc M0–M4, luồng B/C/H, cổng quyết định của TJ, quy trình mỗi bước, ước lượng |
| `TEST_REGRESSION_RESTRUCTURE.md` | Đặc tả bộ test hồi quy (ca, tiêu chí đạt, tầng chạy, ma trận truy vết tới `CLAUDE.md`). Chỉ là đặc tả, **chưa có mã test** |
| `PLAN_NETLIFY_FRONTEND.md` | Kế hoạch chuyển nơi deploy frontend sang Netlify (cherry-pick từ `feat/netlify-frontend-plan`). Trong mô hình này Netlify phục vụ **nhánh restructure**, còn `main` ở lại GitHub Pages; xem luồng H trong plan restructure |
| `AUDIT_INFRA_ADVISOR.md` | Báo cáo audit hạ tầng/bảo mật làm đầu vào. Có chỗ chưa khớp code thật; phần đối chiếu nằm ở mục 3 của `PLAN_RESTRUCTURE.md`. Không sửa file audit để chữa chỗ sai, ghi errata vào plan |

## Luật của worktree này

**Được làm:**
- Đọc, đo, đối chiếu code; sửa và commit các file kế hoạch/tài liệu ở đây.
- Commit cục bộ trên `feat/restructure-plan`; cherry-pick commit từ nơi khác khi TJ bảo.

**Chưa được làm cho đến khi TJ duyệt `PLAN_RESTRUCTURE.md` và trả lời mục 9 của nó:**
- Sửa bất kỳ file trong `js/`, `css/`, `index.html`, `game.html`, `sw.js`, `data/`, `supabase/`, `tools/`.
- Chạy SQL lên Supabase, deploy Edge Function hay Worker, đổi secret, kết nối Netlify, tạo site hay trả phí.

**Không bao giờ:**
- Push lên `origin/main`, merge `main` vào đây, hoặc force-push. Thay `main` chỉ theo mục 5 ở trên và chỉ khi TJ bảo.
- Đưa lại `GEMINI_API_KEY`/token vào file, commit file đề ETS.
- Mở `game.html` trơn hoặc vào phòng thật "TJ" khi kiểm thử; dùng phòng `ZZ_…`.
- Triển khai thay đổi backend dùng chung (Edge Function, Worker, SQL) mà không có TJ đồng ý từng lần: backend được `main` đang chạy dùng chung, nên deploy ở đây **có tác dụng ngay với bản TJ đang dùng**. Chi tiết ở `PLAN_RESTRUCTURE.md` (mục "hai dòng song song").

## Trạng thái hiện tại

Giai đoạn **lập kế hoạch**. Chưa có dòng code ứng dụng nào bị đổi. Việc kế tiếp phụ thuộc câu trả lời của TJ ở mục 9 của `PLAN_RESTRUCTURE.md`; khi được duyệt, bắt đầu từ A0 (lưới an toàn) trên baseline `e324beb`.

Khi trạng thái đổi (bắt đầu A0, hoàn thành một pha, freeze, hủy), sửa đúng mục này trong cùng commit.

## Cách kiểm worktree còn đúng mục đích

```
git -C C:/Users/User/Desktop/TJ/_work/wt-restructure-plan status -sb          # phải là ## feat/restructure-plan (không có ...origin/main)
git -C C:/Users/User/Desktop/TJ/_work/wt-restructure-plan diff --stat origin/main -- js css index.html game.html sw.js   # phải trống khi còn ở giai đoạn lập kế hoạch
git rev-parse --short origin/main                                              # phải vẫn là e324beb (main đóng băng, chưa ai push)
git merge-base --is-ancestor origin/main feat/restructure-plan && echo ff-ok    # phải in ff-ok: còn fast-forward được
```

## Khi nào dọn worktree

- Sau khi `main` đã được thay bằng bản restructure (mục 5) và TJ xác nhận, hoặc TJ quyết định hủy: `git worktree remove C:/Users/User/Desktop/TJ/_work/wt-restructure-plan`, rồi xoá nhánh nếu đã vào `main` hoặc bị bỏ. Không xoá khi còn commit chưa vào đâu cả.
- Nếu chỉ một phần kế hoạch được giữ, chuyển phần đó sang `README.md` (mục "Việc còn dang dở") hoặc `CLAUDE.md` (quyết định đã chốt) trước khi dọn, theo vai trò 3 file tài liệu ghi trong `CLAUDE.md`.
