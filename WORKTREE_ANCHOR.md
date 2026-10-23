# WORKTREE_ANCHOR — worktree này dùng để làm gì

> Đọc file này đầu tiên nếu bạn (người hoặc AI) mở đúng thư mục này. Nó chỉ nói **worktree này tồn tại để làm gì và không được làm gì**. Nội dung kế hoạch nằm ở `PLAN_RESTRUCTURE.md`, không lặp lại ở đây.

## Nhận dạng

| | |
|---|---|
| Thư mục | `C:\Users\User\Desktop\TJ\_work\wt-restructure-plan` |
| Nhánh | `feat/restructure-plan` (tên giữ nguyên; đổi tên chỉ khi TJ bảo) |
| Rẽ từ | `origin/main` tại `e324beb` (2026-10-20). **Baseline đã chốt: `e324beb`.** |
| Checkout chính | `C:\Users\User\Desktop\TJ\Project\W02-tj-wordloop-hub` (nhánh `main`, không thuộc worktree này) |
| Upstream | `origin/feat/restructure-plan` (đã kiểm lại 2026-10-22); không theo dõi `origin/main`. |

## Mô hình vận hành (TJ chốt 2026-10-20)

1. **`main` đóng băng.** Là bản TJ dùng hằng ngày, tiếp tục được GitHub Pages phục vụ. Không ai sửa, không merge vào, không push lên `main` trong suốt quá trình restructure.
2. **Mọi việc chỉ làm trong worktree này.** Không tạo nhánh `fix/…`/`feat/…` riêng ở nơi khác cho việc thuộc restructure; mỗi bước là một hoặc vài commit có thông điệp rõ trên `feat/restructure-plan`.
3. **Không merge `main` hay nhánh khác vào đây.** Cần lấy một commit từ nơi khác thì **cherry-pick** (đã làm một lần: kế hoạch Netlify, `9ce51fd` ← `e94e086`). Baseline không đổi; `8b071e6` (chỉ có ở `main` cục bộ, chưa push) **không** vào nhánh này.
4. **Hai dòng chạy song song:** `main` → GitHub Pages (bản cũ, TJ dùng); `feat/restructure-plan` → Netlify (bản mới, để kiểm thử). Duy trì song song cho tới khi worktree này **freeze**.
5. **Kết thúc:** khi worktree freeze, bản restructure thay thế `main` theo phương án PO duyệt. Kế hoạch fast-forward ban đầu chỉ đúng khi `origin/main` là tổ tiên của nhánh này. **Điều kiện đã lệch:** ngày 2026-10-22, `origin/main` ở `6c7b66b` và không còn là tổ tiên của nhánh restructure. Không tự merge, cherry-pick, force-push hay thay main; PO chọn cách tiếp nhận thay đổi trước tích hợp cuối (PLAN §0.1).

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
| `TEST_REGRESSION_RESTRUCTURE.md` | Đặc tả bộ test hồi quy; phần đã thực chạy và giới hạn ở `tests/a0/README.md`, không đồng nhất đặc tả với độ phủ thực tế |
| `PLAN_NETLIFY_FRONTEND.md` | Kế hoạch chuyển nơi deploy frontend sang Netlify (cherry-pick từ `feat/netlify-frontend-plan`). Trong mô hình này Netlify phục vụ **nhánh restructure**, còn `main` ở lại GitHub Pages; xem luồng H trong plan restructure |
| `tests/` | Lưới an toàn A0: capture/fixtures cũ và cycle Node/đo số liệu/kiểm tĩnh ở `tests/a0/`; mã ứng dụng giữ nguyên |
| `AUDIT_INFRA_ADVISOR.md` | Báo cáo audit hạ tầng/bảo mật làm đầu vào. Có chỗ chưa khớp code thật; phần đối chiếu nằm ở mục 3 của `PLAN_RESTRUCTURE.md`. Không sửa file audit để chữa chỗ sai, ghi errata vào plan |

## Luật của worktree này

**Được làm:**
- Đọc, đo, đối chiếu code; sửa và commit các file kế hoạch/tài liệu ở đây.
- Commit cục bộ trên `feat/restructure-plan`; cherry-pick commit từ nơi khác khi TJ bảo.

**Đã được TJ duyệt (2026-10-20): A0 — lưới an toàn.** Được thêm tệp mới trong `tests/` (fixture, kịch bản thu lời gọi, khung kiểm thử) và dựng worktree baseline chỉ-đọc `C:\Users\User\Desktop\TJ\_work\wt-baseline-e324beb` (detached tại `e324beb`, không sửa, không commit trong đó). TJ đã quyết **không dùng đường vá gấp cho rủi ro chi phí AI**: B1 đi theo thứ tự có cổng.

**Vẫn chưa được làm cho đến khi TJ duyệt phần tương ứng của `PLAN_RESTRUCTURE.md` và trả lời mục 9:**
- Sửa bất kỳ file ứng dụng trong `js/`, `css/`, `index.html`, `game.html`, `sw.js`, `data/`, `supabase/`, `tools/` (A0 chỉ *thêm* `tests/`, không đụng mã ứng dụng).
- Chạy SQL lên Supabase, deploy Edge Function hay Worker, đổi secret, kết nối Netlify, tạo site hay trả phí.
- Cài gói từ mạng (vd Playwright): cần TJ đồng ý riêng khi tới bước dựng khung trình duyệt.

**Không bao giờ:**
- Push lên `origin/main`, merge `main` vào đây, hoặc force-push. Thay `main` chỉ theo mục 5 ở trên và chỉ khi TJ bảo.
- Đưa lại `GEMINI_API_KEY`/token vào file, commit file đề ETS.
- Mở `game.html` trơn hoặc vào phòng thật "TJ" khi kiểm thử; dùng phòng `ZZ_…`.
- Triển khai thay đổi backend dùng chung (Edge Function, Worker, SQL) mà không có TJ đồng ý từng lần: backend được `main` đang chạy dùng chung, nên deploy ở đây **có tác dụng ngay với bản TJ đang dùng**. Chi tiết ở `PLAN_RESTRUCTURE.md` (mục "hai dòng song song").

## Trạng thái hiện tại

Giai đoạn **A0 — lưới an toàn (đang thực thi)**. Đã xong M0.1 (baseline) và đầu vào M0.5a (xem `tests/README.md`). Mã ứng dụng giữ nguyên. `origin/main` đã tiến hai commit sau baseline tới `6c7b66b`; PO chọn cách tiếp nhận trước tích hợp cuối. Các câu 3–7 và 9–12 của plan vẫn mở và chặn phần tương ứng sau A0.

**Checkpoint lịch sử `d1e793c` — cycle Node 2026-10-22:** TJ đã cho chạy sau audit `a0e08ac`. Đã sửa ancestry gate và mô tả fast-forward; chạy cycle tới điểm PO, **PARTIAL**: unit baseline/current cùng 54 đạt/1 lỗi đặc tả (CTX-09, TJ OpenAI trước); kiểm tĩnh 6 đạt/2 pending (version baseline + scope CSS); phản chứng mới 6/6, capture cũ 65/65. Báo cáo và lệnh tái lập ở `tests/a0/README.md`. Không sửa app/không cài gói/không mạng production. Chờ PO xác nhận ngoại lệ TJ và ngoại lệ version; Playwright vẫn cần quyền cài gói riêng. Không merge, không push trong cycle này.

**Quyết định PO mới nhất:** giữ ưu tiên AI hiện tại và sửa cache trước nghiệm thu preview. Đã ghi ngoại lệ TJ và policy cache; unit 56/56, static 8/8, self-test 17/17. Cổng A0 vẫn PARTIAL; preview cache gate hiện phải đỏ tới khi config được sửa. Cài Playwright/G2/tích hợp main vẫn theo quyền riêng; không tự nhập nhánh debug hay lane-policy.

Khi trạng thái đổi (bắt đầu A0, hoàn thành một pha, freeze, hủy), sửa đúng mục này trong cùng commit.

## Cách kiểm worktree còn đúng mục đích

```
git -C C:/Users/User/Desktop/TJ/_work/wt-restructure-plan status -sb          # phải là ## feat/restructure-plan (không có ...origin/main)
git -C C:/Users/User/Desktop/TJ/_work/wt-restructure-plan diff --stat e324beb -- js css index.html game.html sw.js data learn supabase tools   # phải trống (mã ứng dụng chưa đổi so với baseline)
git rev-parse --short origin/main                                              # hiện 6c7b66b (đã ghi nhận ở PLAN 0.1); giá trị khác = main tiến thêm, báo PO
git merge-base --is-ancestor e324beb origin/main && echo baseline-ok           # phải in baseline-ok: baseline vẫn là tổ tiên của main
git merge-base --is-ancestor e324beb HEAD && echo restructure-baseline-ok      # phải in restructure-baseline-ok: nhánh đang làm vẫn chứa baseline
git rev-list --count e324beb..origin/main                                      # hiện 2 (4708ba9, 6c7b66b); số khác = main tiến thêm, báo PO
```

## Khi nào dọn worktree

- Sau khi `main` đã được thay bằng bản restructure (mục 5) và TJ xác nhận, hoặc TJ quyết định hủy: `git worktree remove C:/Users/User/Desktop/TJ/_work/wt-restructure-plan`, rồi xoá nhánh nếu đã vào `main` hoặc bị bỏ. Không xoá khi còn commit chưa vào đâu cả.
- Nếu chỉ một phần kế hoạch được giữ, chuyển phần đó sang `README.md` (mục "Việc còn dang dở") hoặc `CLAUDE.md` (quyết định đã chốt) trước khi dọn, theo vai trò 3 file tài liệu ghi trong `CLAUDE.md`.
