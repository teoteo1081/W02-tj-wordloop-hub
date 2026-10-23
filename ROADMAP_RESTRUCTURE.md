# ROADMAP_RESTRUCTURE — lộ trình thực hiện restructure

> Trạng thái: **DỰ THẢO, CHƯA DUYỆT, CHƯA BẮT ĐẦU.** Sinh từ `PLAN_RESTRUCTURE.md` bản 2.2. **Mô hình vận hành (TJ chốt):** `main` đóng băng (GitHub Pages, TJ dùng); mọi việc chỉ trong worktree `feat/restructure-plan` (Netlify); hai dòng song song, dùng chung backend, tới khi freeze rồi thay hẳn `main`. Đặc tả đích ở `SPEC_RESTRUCTURE.md`; danh mục test ở `TEST_REGRESSION_RESTRUCTURE.md`.
> Ước lượng tính bằng "phiên làm việc" (một phiên Claude Code/một buổi), thô, chưa kiểm chứng. Không có ngày lịch vì còn phụ thuộc các quyết định của TJ.

## 1. Nguyên tắc vận hành lộ trình

1. **Mỗi cột mốc có cổng vào và cổng ra.** Chưa qua cổng vào thì không bắt đầu; chưa qua cổng ra thì không sang cột mốc sau.
2. **Không bước nào vừa đổi cấu trúc vừa đổi hành vi.** Muốn đổi hành vi thì tách luồng B hoặc C với PR riêng.
3. **Test trước, di chuyển sau.** Mỗi vùng mã chỉ được dời sau khi test đặc trưng (characterization) cho vùng đó đã xanh trên mã hiện tại.
4. **PR nhỏ, dễ hoàn tác.** Tham chiếu: một PR đụng một module hoặc một lớp, dưới ~600 dòng diff không tính phần chỉ dời nguyên văn. Mỗi PR có thể `git revert` độc lập.
5. **Quy ước theo mô hình hai dòng (thay quy ước "mỗi việc một nhánh, lên `main` từng bước"):** mọi việc là commit trên một dòng tích hợp duy nhất `feat/restructure-plan`; **không push `origin/main`, không merge `main` vào** cho tới lúc thay `main` ở cuối; lấy commit từ nơi khác bằng cherry-pick; bump `?v=N` (hoặc cơ chế thay thế sau A2) đúng file đã sửa; không commit đề ETS; không dán key.
6. **Luồng B (vá bảo mật):** mã viết trong dòng tích hợp, nhưng **deploy là bước riêng ngoài git cần TJ đồng ý từng lần**, vì backend dùng chung nên có tác dụng ngay với bản `main` đang chạy.
7. Mọi bước chạm dữ liệu Supabase chỉ THÊM (bảng/cột/hàm) và **tương thích ngược với bản `main` đóng băng** (SPEC I9); chạy SQL **trước** khi code dùng nó chạy, và chỉ khi TJ đồng ý (`CLAUDE.md`).
8. **Bản mới chỉ ghi dữ liệu thật theo quy tắc ghi** (plan §5.1): hồ sơ thử/phòng `ZZ_…` cho tới khi nhật ký lời gọi khớp và TJ đồng ý.

## 2. Cổng quyết định của TJ (chặn việc gì)

| Cổng | Câu hỏi (plan, mục 9) | Chặn |
|---|---|---|
| G0 | 1: chấp nhận A0 (câu 2 ✔ đã chốt: `main` đóng băng, một dòng tích hợp) | Mọi thứ |
| G1 | ✔ **đã chốt:** baseline `e324beb`, không merge `main`, cherry-pick khi cần | — |
| G7 | 9: quy tắc ghi dữ liệu thật từ bản mới (hay dùng bản sao Supabase riêng) | Mọi kiểm thử ghi bằng hồ sơ thật; cổng ra M1 |
| G8 | 10: Netlify (site cũ/mới, branch deploy hay production branch, ngân sách) | H0–H2 |
| G9 | 11: host chính sau khi thay `main` | Thủ tục thay `main` bước 5, plan §5.1 |
| G10 | 12: dự phòng quay lại sau khi thay `main` (đề xuất: commit khôi phục cây archive + fast-forward, không force; cần diễn tập HST-10) | Thủ tục thay `main` |
| G-freeze | TJ tuyên bố freeze khi đạt SPEC §9 | Thay `main` |
| G2 | 7: `handoff/gate` (chưa vào `main`, sửa `js/game.js`): cherry-pick vào dòng này, hay bỏ / hoãn. Vì `main` đóng băng nên không có chuyện "merge vào `main` trước" | M0 (CI) và M3 (cắt `game.js`) |
| G3 | 3: cơ chế version (import map / đóng dấu / Vite) và thiết bị iOS đích | M2 |
| G4 | 4: vị trí `tools/` | M1 |
| G5 | 5: phương án xác thực `tj-shelf` | B2 |
| G6 | 6: trần chi tiêu AI, fail-closed/open, tính Gemini hay không | B1 |

Cổng nào chưa mở thì việc chặn bởi nó đứng yên; việc không bị chặn vẫn chạy.

## 3. Sơ đồ phụ thuộc

```mermaid
flowchart LR
    G0([G0]) --> M0[M0 Nền tảng + lưới an toàn]
    G1([G1]) --> M0
    G2([G2]) --> M0
    M0 --> M1[M1 Dọn + lớp dữ liệu]
    G4([G4]) --> M1
    M1 --> M2[M2 ES modules]
    G3([G3]) --> M2
    M2 --> M3[M3 Cắt file lớn]
    G2 --> M3
    M3 --> M4[M4 Vite - tuỳ chọn]
    M1 --> C1[C1 lazy pdf.js]
    M1 --> C2[C2 RPC thống kê]
    M1 --> C3[C3 nạp lười cây]
    G6([G6]) --> B1[B1 Sổ chi tiêu AI]
    G5([G5]) --> B2[B2 tj-shelf]
    G0 --> B3[B3 Đối chiếu schema]
```

Viết mã B1, B2, B3 không phụ thuộc M0–M3 và chạy song song ngay khi cổng của chúng mở. **Deploy B1/B2 thì phụ thuộc M0.5a** (bộ lời gọi baseline tới Edge Function AI và Worker `tj-shelf`) và các ca BCK-* tương ứng; B3 chỉ đọc nên không bị ràng buộc này.

## 4. Cột mốc

### M0 — Nền tảng và lưới an toàn

**Cổng vào:** G0, G2 đã mở (G1 đã chốt: baseline `e324beb`).

| Việc | Đầu ra | Ghi chú |
|---|---|---|
| M0.1 Chốt baseline | Xác nhận đầu nhánh dẫn xuất từ `e324beb`; ghi SHA baseline vào bảng số liệu gốc; phục vụ một bản baseline (worktree thứ hai tại `e324beb`) để dùng cho MP-18 và BCK-* | |
| M0.2 Đo số liệu gốc | Bảng plan mục 7 điền đủ cột "Hiện tại" | gồm danh sách hàm `App.*` bị gọi ngược (SPEC §4, quy tắc 2–3) |
| M0.3 Test Node | Bộ test `context`, `srs`, `util`, `readalong`, adapter local `db`; kiểm tĩnh | TEST §3, §4.1 |
| M0.4 Khung Playwright | Mock REST/Storage/Functions; **broker Realtime giả trong tiến trình test, mỗi client một context** (không dùng `BroadcastChannel` để nối client); cố định dữ liệu/đồng hồ/random (hạt giống random khác nhau giữa các context) | TEST §7, §12 |
| **M0.5a Baseline lời gọi backend (làm sớm, tách riêng)** | Bộ lời gọi baseline tới **Edge Function AI** (WordLoop, CC, chấm câu, tra nghĩa) và **Worker `tj-shelf`** (`list`/`PUT`/`DELETE`), chụp ở `e324beb`; là đầu vào của BCK-01..03 và là **điều kiện deploy B1/B2** | TEST §9.5, §13.7 |
| M0.5 Nhật ký lời gọi chuẩn | Golden call log cho mọi kịch bản chuẩn (gồm cả REST/Storage/Realtime; đầu vào của BCK-04/05) | TEST §5 |
| M0.6 Ảnh chuẩn | Ma trận màn × viewport; chạy hai lần giống hệt | TEST §6 |
| M0.7 Kịch bản hai client | Các kịch bản multiplayer chạy xanh trên mã hiện tại | TEST §7 |
| M0.7b Ngoại lệ baseline | Chạy mọi ca tĩnh trên mã chưa đổi; lập danh sách vi phạm có sẵn (vd `STA-03.allow` với 5 mục: manifest, 3 chỗ `icon.svg`, `learn/sw` → `config.js`) theo quy tắc ratchet; commit riêng (sau M0) cho vi phạm đáng sửa như `learn/sw` thiếu `?v=` | TEST §3.3, §13 |
| M0.8 CI | Workflow chạy test tầng PHẢI-chặn-merge; tích hợp test của `handoff/gate` nếu G2 giữ nó | TEST §11 |

**Cổng ra:** mọi test M0 xanh **trên mã chưa đổi** (các ca ratchet xanh với danh sách ngoại lệ đã duyệt; không ca nào bị bỏ qua âm thầm); ảnh chuẩn ổn định qua hai lần chạy; ma trận truy vết (TEST §10) không còn dòng "chưa có test" cho nhóm PHẢI-chặn-merge; TJ xem báo cáo số liệu gốc.
**Rủi ro:** mock lệch Realtime thật (giảm bằng kiểm tay hai thiết bị ở cổng ra M1/M3); bộ test chuẩn dao động (không tiếp tục nếu hai lần chạy khác nhau).
**Ước lượng:** 3–4 phiên (lớn hơn con số 1–2 phiên ở plan bản 1, vì bản 2.1 thêm mock Realtime, nhật ký lời gọi và hai client).

### M1 — Dọn và lớp dữ liệu

**Cổng vào:** M0 đã qua cổng ra; G4 mở nếu có việc dời `tools/`.

| Việc | Đầu ra |
|---|---|
| M1.1 `core/util` | `esc`, `shuffle`, `fmt`, `norm` còn 1 định nghĩa; các bản sao xoá |
| M1.2 `core/storage` | Mọi `localStorage` đi qua một chỗ, giữ nguyên khoá (I3) |
| M1.3 `data/` cho `auth`, `app`, `board` | 8 điểm Supabase ngoài `data/` còn lại về 0 |
| M1.4 `data/game` | 119 điểm của `game.js` về `data/game`, theo từng nhóm chức năng (phòng, đáp án, lịch sử, thư viện/kệ, tệp tạm) — mỗi nhóm một PR |
| M1.5 Client AI duy nhất | Một chỗ gọi Edge Function AI (hiện lặp 5 nơi), body không đổi |
| M1.6 `sw.js` | ASSETS khớp file thật |
| M1.7 Tài liệu | Tách kiến trúc / quyết định / backlog / runbook; `HANDOFF.md` giữ vai tạm thời |
| M1.8 `tools/` | Dời theo G4 (đề xuất repo riêng); không kéo theo lịch sử đề ETS vào repo công khai |

**Cổng ra:** nhật ký lời gọi khớp chuẩn sau mỗi PR M1.3–M1.5; ảnh sai khác = 0; kiểm tay hai thiết bị thật trong `ZZ_…` (lobby → ván → kết thúc, bảng, tải lại giữa ván) sau khi xong M1.4; số điểm Supabase/`localStorage` ngoài lớp quy định = 0.
**Rủi ro:** `game.js` có 119 điểm nên dễ sót; biện pháp là nhật ký lời gọi chuẩn chứ không phải đọc code. Dời `tools/` có thể làm gãy đường dẫn trong `CLAUDE.md`, `/qa`, `.claude/commands` — liệt kê và sửa cùng PR.
**Ước lượng:** 3–4 phiên.

### M2 — ES modules gốc

**Cổng vào:** M1 xong; **G3 đã chọn cơ chế version** (không bắt đầu chuyển module đầu tiên khi chưa chọn).

| Việc | Đầu ra |
|---|---|
| M2.1 Cơ chế version | Import map / script đóng dấu / (nếu G3 chọn Vite thì chuyển sang M4 trước) |
| M2.2 `/bump` bắc cầu | `.claude/commands/bump.md` cập nhật; kiểm một URL/module |
| M2.3 Chuyển theo thứ tự lá trước | `util` → `srs` → `context` → `speech` → `db` → `auth` → feature → `app`; mỗi lô một PR, giữ `window.X` tương thích |
| M2.4 Kiểm SW/offline | Tải online → offline → tải lại `index.html` và game |
| M2.5 CI đồ thị import | Không vòng; mỗi module đúng một mục version; đếm dòng tương thích giảm |

**Cổng ra:** I1–I8 (SPEC §2) vẫn đúng; kiểm offline đạt; kiểm "không kẹt cache" bằng cách đổi version một module lá và xác nhận mọi importer lấy bản mới (trên bản preview, có xoá cache và không xoá cache).
**Rủi ro:** module nhân đôi do URL khác nhau; iOS cũ không chạy import map; thứ tự khởi tạo thay đổi khi bỏ nạp tuần tự bằng thẻ `<script>`.
**Ước lượng:** 3–5 phiên.

### M3 — Cắt file lớn

**Cổng vào:** M2 xong; G2 đã giải quyết (`handoff/gate` đã được cherry-pick vào dòng này hoặc đã bị bỏ) để không xung đột trên `js/game.js`.

Thứ tự đề xuất (rủi ro tăng dần, vì phần sau bám nhiều phụ thuộc hơn):
1. `board.js` (phần canvas/chia sẻ/PDF tách thành module riêng).
2. `detail.js` theo tab: dictation → progress → meaning → single → sheet → quiz → study.
3. `app.js` theo màn hình: home/journey/wordset → danh sách Block → cây Notebook → dán/trích từ.
4. `game.js`: tách plugin (`voice`, `chat`, `cc`, `readalong`, `shadow`, `swclass` đã là file riêng — chỉ dọn giao diện với lõi) → state/room-net → rounds → UI.
5. CSS tách theo component, kèm bước ảnh chụp sau mỗi lần cắt.

**Cổng ra:** file lớn nhất dưới ~800 dòng (hoặc ngoại lệ có lý do); I1–I8; kiểm tay hai thiết bị thật sau mỗi lô thuộc `game.js`; bảng chỉ số plan mục 7 đạt đích.
**Rủi ro:** `game.js` có 390 hàm trong một phạm vi (chia sẻ biến đóng); cần lập đồ thị biến dùng chung trước khi cắt (đầu ra của M0.2). Mỗi lô cắt kèm test hai client.
**Ước lượng:** 5–8 phiên.

### M4 — Vite (tuỳ chọn)

**Cổng vào:** TJ chọn ở G3, hoặc lỗi cache vẫn tái diễn sau M2/M3. (Nếu G3 chọn Vite thay cho import map, M4 được kéo lên trước M2.)
**Đầu ra:** build có băm tên file, deploy bằng GitHub Actions, bản preview theo nhánh vẫn hoạt động (`pages-preview.yml`), local `python3 -m http.server` vẫn dùng được cho bản không build hoặc có hướng dẫn mới.
**Cổng ra:** không còn `?v=N` thủ công; offline/SW đạt; thời gian build CI ≤ 5 phút.
**Ước lượng:** 1–2 phiên (chưa tính chuyển deploy).

## 5. Luồng B — vá bảo mật (song song; mã trong dòng tích hợp, deploy là bước riêng)

| Mã | Việc | Cổng vào | Cổng ra |
|---|---|---|---|
| B1 | Sổ chi tiêu AI: bảng `ai_spend_ledger`, hàm `reserve/settle`, danh sách model, trần kích thước và token, fail-closed, mã dùng chung `_shared/` | **Viết mã:** G6. **Deploy:** G6 + **M0.5a xong** + TJ đồng ý chạy SQL và deploy | 8 test của TEST §9.1 xanh, **BCK-01/02 đạt** trên bộ lời gọi baseline; deploy bằng lệnh trong `CLAUDE.md` |
| B2 | `tj-shelf`: bỏ `listAll` mỗi PUT; xác thực theo phương án G5 | **Viết mã:** G5. **Deploy:** G5 + **M0.5a xong** + TJ đồng ý | Test TEST §9.3, **BCK-03 đạt**; giới hạn 2 GB/25 MB giữ nguyên |
| B3 | Đối chiếu `supabase_schema.sql`/`game_schema.sql` với `information_schema` (chỉ đọc) | TJ cấp PAT tạm, nhắc thu hồi sau | Báo cáo lệch + sửa file cho khớp; không DDL |

Ước lượng: B1 1–2 phiên, B2 dưới 1, B3 dưới 1. Chưa deploy gì khi cổng chưa mở.

## 6. Luồng C — tối ưu dữ liệu (sau M1)

| Mã | Việc | Cổng vào | Cổng ra |
|---|---|---|---|
| C1 | Lazy-load pdf.js | M1 | Upload PDF vẫn đọc được; thông báo lỗi cũ giữ; JS nạp ở `index.html` giảm |
| C2 | RPC `total_words` + `mastered` | M1; TJ đồng ý chạy SQL | TEST §9.2: so cũ/mới bằng nhau với mọi user trên dữ liệu thật; đường cũ giữ sau cờ một phiên |
| C3 | Nạp lười cây (`getFullTree`) | M1, C2 | Chỉ làm nếu C2 chưa đủ; test Journey + ảnh chụp |

Ước lượng: C1 dưới 1, C2 1–2, C3 1–2. Đo thời gian trước/sau trên mạng giả lập chậm.

## 6b. Luồng H — hosting (Netlify cho dòng restructure; song song, không đụng mã ứng dụng)

| Mã | Việc | Cổng vào | Cổng ra |
|---|---|---|---|
| H0 | Xác minh dashboard Netlify cũ: quyền, gói, credit/team usage, repo liên kết, domain; chốt site cũ hay mới | G8 | Bảng cấu hình nguồn/đích, ngân sách đã chốt (chú ý: hết credit thì mọi site trong tài khoản bị pause; gói Free là giới hạn cứng) |
| H1 | Tạo cấu hình phục vụ nhánh `feat/restructure-plan` (mặc định branch deploy, 0 credit); chọn publish directory (nguyên gốc / copy / chờ Vite) | H0 | URL kiểm thử ổn định; artifact đối chiếu được với SHA; `main` **không** nối vào Netlify |
| H2 | Chạy bộ kiểm HST-* (TEST §9.6) và quy trình dọn dữ liệu `ZZ_…` trên URL Netlify | H1, G7 | Bằng chứng ghi SHA, URL, thiết bị, kết quả; đo `Cache-Control` bằng `curl -I` |
| H3 | Quyết định host chính sau khi thay `main` | Freeze + G9 | Plan Netlify N3 áp dụng nếu chọn Netlify |

Lưu ý nhịp: nếu (trái đề xuất) đặt nhánh restructure làm production branch của Netlify thì mỗi lần push tốn 15 credit; gói Free chỉ đủ 20 lần/tháng chưa tính traffic. Mặc định branch deploy để tránh vấn đề này.

## 7. Quy trình mỗi bước (danh sách kiểm)

Mỗi bước restructure (một hoặc vài commit trên dòng tích hợp) PHẢI đạt trước khi báo xong:

1. Đang ở worktree này, nhánh `feat/restructure-plan`; chạy lệnh kiểm trong `WORKTREE_ANCHOR.md` (baseline `e324beb`; `origin/main` hiện `6c7b66b` = +2 commit đã ghi nhận ở PLAN 0.1, không còn fast-forward nguyên trạng). Không `git push origin main`, không merge `main`.
2. `node --check` mọi file đã sửa, nối bằng `&&`; dừng nếu lỗi.
3. Test Node + kiểm tĩnh xanh.
4. Playwright: nhóm PHẢI-chặn-merge xanh; ảnh sai khác = 0; nhật ký lời gọi khớp chuẩn (khác thì liệt kê từng dòng khác và lý do để TJ duyệt).
5. `/bump` (bản bắc cầu sau M2); `GAME_VER` khớp `game-version.json`; `starter` khớp version.
6. `/verify` cho vùng `context.js` nếu có đụng.
7. Sửa một chỗ thì rà các chỗ giống (`grep`) và sửa cùng lượt (quy ước TJ 2026-10-08).
8. Agent QA độc lập cho PR đụng `game.js`/`board.js` hoặc giao thức realtime (quy ước đã dùng 3 vòng cho thay đổi tương tự).
9. Đẩy nhánh `feat/restructure-plan` (khi TJ bảo; `git push -u origin feat/restructure-plan`, **không** `:main`) để Netlify dựng bản kiểm thử; TJ xem trên URL Netlify. Bước đẩy nhánh cũng kích hoạt workflow Pages preview của repo (hợp lệ, nhưng đường dẫn đó dùng chung origin với `main`: không dùng hồ sơ thật ở đó).
10. Nếu bước có deploy backend: TJ đồng ý riêng; chạy BCK-* trước và sau.
11. Cập nhật bảng trạng thái ở mục 8 trong cùng commit.

*Thay `main` ở cuối không phải một bước của danh sách này; nó theo thủ tục ở plan §5.1 và chỉ khi TJ tuyên bố freeze.*

## 8. Bảng theo dõi tiến độ

| Cột mốc | Trạng thái | Cổng đang chờ | Ghi chú |
|---|---|---|---|
| G1 (baseline), câu 2 | ✔ Đã chốt 2026-10-20 | — | `e324beb`; `main` đóng băng; fast-forward ở cuối *(lệch từ 2026-10-22: `origin/main` = `6c7b66b`, PO chọn cách tiếp nhận, PLAN 0.1)* |
| G0 ✔ (2026-10-20); G2–G10 | G0 đã duyệt, còn lại chưa mở | TJ trả lời plan mục 9 | |
| H0–H2 | Chưa bắt đầu | G8 (+ G7 cho H2) | |
| M0 | **Đang làm** (G0 ✔ duyệt A0 2026-10-20; G2 chưa) | G2 cho M0.8 (CI) | Xong: M0.1 (worktree baseline `wt-baseline-e324beb`), M0.5a (xem `tests/README.md`). Còn: M0.2, M0.3, M0.4, M0.5, M0.6, M0.7, M0.7b, M0.8 |
| M1 | Chưa bắt đầu | M0, G4 | |
| M2 | Chưa bắt đầu | M1, G3 | |
| M3 | Chưa bắt đầu | M2, G2 | |
| M4 | Tuỳ chọn | G3 | |
| B1 | Chưa bắt đầu | G6 | |
| B2 | Chưa bắt đầu | G5 | |
| B3 | Chưa bắt đầu | TJ cấp PAT | |
| C1–C3 | Chưa bắt đầu | M1 | |

## 9. Thứ tự đề xuất nếu phải ưu tiên

1. **Ngay (song song):** viết mã B1/B2 và làm B3 (chỉ đọc); **M0.5a** (nhỏ) để mở cổng deploy B1/B2. Deploy B1/B2 chờ M0.5a + BCK-* đạt + TJ đồng ý (không còn là "không phụ thuộc").
2. **M0** (nền cho mọi thứ còn lại).
3. **M1**, trong lúc đó chạy **C1**.
4. **C2** (hiệu năng Journey) khi M1 xong.
5. **M2 → M3**.
6. **M4** và **C3** chỉ khi còn cần.

## 10. Tổng ước lượng và điều kiện thay đổi lộ trình

| Phần | Phiên |
|---|---|
| M0 | 3–4 |
| M1 | 3–4 |
| M2 | 3–5 |
| M3 | 5–8 |
| M4 (tuỳ chọn) | 1–2 |
| B1–B3 | 2–4 |
| C1–C3 | 2–5 |
| **Luồng A (M0–M3)** | **14–21** |

Con số lớn hơn plan bản 1 (11–18) vì M0 nay gồm Supabase/Realtime giả và kịch bản hai client. Lộ trình PHẢI được xét lại nếu: (a) hai lần chạy ảnh chuẩn không giống nhau mà không che được vùng dao động; (b) nhật ký lời gọi chuẩn cho thấy `game.js` có nhiều điểm gọi động (chuỗi bảng ghép lúc chạy) hơn dự tính; (c) TJ không đóng băng tính năng và xung đột trên các file lớn vượt khả năng rebase thường xuyên; (d) thiết bị iOS đích không hỗ trợ import map.
