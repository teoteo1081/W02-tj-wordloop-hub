# PLAN_RESTRUCTURE — tái cấu trúc codebase (giữ nguyên logic sản phẩm + giao diện)

> Trạng thái: **ĐỀ XUẤT, CHƯA DUYỆT, CHƯA LÀM GÌ.** Tài liệu này chỉ là kế hoạch (đánh giá ngày 2026-10-20).
> Chưa có dòng code nào được đổi. Cần TJ trả lời 4 câu hỏi ở mục "Cần TJ quyết" trước khi bắt đầu pha nào.
> Số liệu bên dưới được đo từ repo tại `e324beb`; chưa chạy app, chưa đọc thân hàm.

## 1. Mục tiêu và ranh giới

- **Làm:** đổi cấu trúc thư mục/module, bỏ trùng lặp, đưa mọi truy cập dữ liệu về một lớp, thêm lưới an toàn (test, CI).
- **Không làm:** đổi tính năng, đổi giao diện, đổi quyết định đã chốt trong `CLAUDE.md`, đổi schema Supabase.
- **Tiêu chí xong:** ảnh chụp các màn chính trước/sau giống nhau, test hồi quy xanh, web live chạy như cũ.

## 2. Kết luận: KHÔNG viết lại từ đầu, restructure dần (strangler)

Lý do:
- Repo chưa có test nào, nên không có cách chứng minh "giữ nguyên logic và giao diện".
- `CLAUDE.md` giữ hàng chục lỗi/quyết định mà code không tự nói ra (vd `applyStarter` hồi sinh item đã xoá, `block_progress` phải check `progressLocal()`, `bts` của bảng). Viết lại từ đầu mất các hành vi ngầm đó.
- TJ vẫn thêm tính năng gần như hàng ngày; đóng băng nhiều phiên là không thực tế.
- Dữ liệu dùng chung ở Supabase, lỗi migrate ảnh hưởng người dùng thật.

## 3. Hiện trạng (đã đo)

| Vấn đề | Số liệu |
|---|---|
| File quá lớn | `js/game.js` 5.561 dòng / 529 KB (390 hàm cùng một phạm vi), `js/app.js` 4.947, `js/detail.js` 3.081, `js/board.js` 2.137 / 214 KB, `css/game.css` 2.108, `css/app.css` 2.375 |
| Kiến trúc | 3 ứng dụng trong 1 repo: WordLoop (`index.html`), Game (`game.html`, nhúng vào WordLoop bằng iframe + `postMessage`), `learn/` (dm, ea, sw). Chung một namespace `window.X` |
| Coupling | `App` được gọi từ 11/12 module, `Auth` từ 11, `Detail` từ 8 — phụ thuộc vòng |
| Vi phạm quy tắc của chính repo | `CLAUDE.md` nói `db.js` là lớp duy nhất đụng dữ liệu, nhưng `game.js` gọi Supabase trực tiếp 119 lần, `auth.js` 6, `app.js` 1, `board.js` 1; `localStorage` rải ở 16 file |
| Trùng lặp | `esc()` định nghĩa lại 6 lần (`board`, `cc`, `chat`, `voice`, `readalong`, `game`), cùng `shuffle`/`fmt`/`norm` |
| Quy trình | Không test/lint; CI chỉ có pages-preview + supabase-keepalive; bump `?v=N` bằng tay (từng gây lỗi cache thật); `sw.js` ASSETS lệch `index.html` (network-first nên chưa gây lỗi) |
| `tools/` | 149 file (92 py, 22 js) gồm pipeline đề ETS, migration, QA tạm — lẫn trong repo public |
| Tài liệu | `README.md` 191 KB, `CLAUDE.md` 60 KB, `HANDOFF.md` 55 KB |
| Nhịp thay đổi | 909 commit; 109 commit trong riêng 2026-10-15 |

Điểm tốt giữ lại: `game.html` đã là entry riêng (ranh giới iframe/`postMessage` là seam sẵn có); `db.js` có adapter local/cloud; `context.js` và `srs.js` gần như hàm thuần, test được bằng Node; không build step nên deploy đơn giản.

## 4. Các pha (mỗi pha ship được, PR nhỏ, mỗi việc 1 nhánh `feat/…`)

### Pha 0 — Lưới an toàn (bắt buộc làm trước)
- Chụp ảnh chuẩn các màn chính bằng Playwright, **dùng phòng `ZZ_…`, không bao giờ mở phòng "TJ"** (xem `CLAUDE.md`, mục agent kiểm thử).
- Test Node cho `context`, `srs`, adapter local của `db`; chuyển các mục "Lỗi đã sửa" trong `CLAUDE.md` thành test hồi quy.
- Workflow CI chạy `node --check` + các test trên mọi PR.
- Dọn working tree trước khi mở nhánh restructure.

### Pha 1 — Dọn, không đổi hành vi
- Gom `esc`/`shuffle`/`fmt`/`norm` vào `core/util`.
- Mọi truy cập `localStorage` và Supabase đi qua `core/storage` + `data/`. Phần nặng nhất là 119 điểm trong `game.js`.
- Dời `tools/` ra thư mục hoặc repo riêng.
- Tách tài liệu: kiến trúc / quyết định / backlog / runbook.

### Pha 2 — ES modules gốc (`<script type="module">`)
- Vẫn không cần build, chạy được trên GitHub Pages. Xoá `window.X` và vòng phụ thuộc.
- Thứ tự lá trước, gốc sau: `util`, `srs`, `context`, `speech`, `db`, `auth`, các feature, cuối cùng `app`.

### Pha 3 — Cắt file lớn theo seam
- `game.js` → state/room-net, luật vòng chơi, UI, các plugin voice/chat/cc/readalong/shadow.
- `app.js`, `detail.js` → theo màn hình. CSS tách theo component tương ứng.

### Pha 4 (tuỳ chọn) — Vite
- Băm tên file thay `?v=N` thủ công, loại hẳn lỗi cache. Đổi lại có build step và phải chuyển deploy sang GitHub Actions.

## 5. Cấu trúc đích (đề xuất)

```
src/
  core/      config, supabase client, storage, util, i18n
  data/      adapters local + cloud, repositories (tree, progress, wordset)
  domain/    srs, context/passage (hàm thuần, test được)
  features/  notebook, detail, journey, reader, wordset, speech, auth
  game/      state, room-net, rounds, ui, board, voice, cc, chat, readalong, shadow
  learn/     dm, ea, sw
docs/        architecture, decisions, backlog, runbooks
```

## 6. Ước lượng thô (chưa kiểm chứng)

Pha 0: 1–2 phiên · Pha 1: 2–3 · Pha 2: 3–5 · Pha 3: 5–8 → tổng khoảng 12–18 phiên, chia PR nhỏ.

## 7. Ràng buộc phải giữ trong suốt quá trình

- Bump `?v=N` đúng file đã sửa (và `game-version.json` khớp `game.html`) cho đến khi có Pha 4.
- `data/starter.json` và `data/starter.version.json` luôn khớp `version`.
- Chỉ THÊM cột DB, chạy SQL trước khi merge code, không tự chạy khi chưa được TJ đồng ý.
- `git push origin main` là một lệnh riêng; mỗi việc một nhánh; TJ xem thử rồi mới lên `main`.
- Không commit file đề ETS, không dán key/token vào file.
- Không hồi lại các thứ đã bỏ hẳn (xem "Quyết định đã chốt" trong `CLAUDE.md`).

## 8. Cần TJ quyết

1. Chấp nhận Pha 0 (lưới an toàn) trước khi đụng code?
2. Có đóng băng tính năng mới trong lúc restructure không? Nếu không, mỗi PR phải nhỏ và merge nhanh để tránh xung đột.
3. ES modules gốc hay Vite? (Đề xuất: ES modules gốc trước, Vite sau nếu lỗi cache còn lặp lại.)
4. `tools/` ra repo riêng (private) hay chỉ ra thư mục riêng? (Đề xuất: repo riêng, vì có đề ETS.)

## 9. Giới hạn của bản đánh giá

Chỉ đọc cấu trúc và đếm số liệu. Chưa đọc thân hàm, chưa chạy app, chưa kiểm phụ thuộc vòng chi tiết giữa `game.js` và `app.js`. Pha 0 sẽ làm rõ các điểm này.
