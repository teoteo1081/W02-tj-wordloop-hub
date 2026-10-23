# SPEC_RESTRUCTURE — đặc tả trạng thái đích của codebase sau restructure

> Trạng thái: **DỰ THẢO, CHƯA DUYỆT.** Sinh từ `PLAN_RESTRUCTURE.md` bản 2.2 (mô hình vận hành: `main` đóng băng chạy GitHub Pages, dòng restructure chạy Netlify, dùng chung backend, cuối cùng thay `main`). Plan nói *làm gì và vì sao*; file này nói *đích đến phải đúng như thế nào để nghiệm thu được*. Lộ trình ở `ROADMAP_RESTRUCTURE.md`, kiểm thử ở `TEST_REGRESSION_RESTRUCTURE.md`.
> Mọi chỗ ghi "(chưa xác minh)" là giả định cần A0 kiểm lại bằng đo đạc, không phải sự thật đã biết.
> Từ khoá: **PHẢI** = bắt buộc nghiệm thu; **NÊN** = mong muốn, có thể hoãn nếu ghi lý do.

## 1. Phạm vi

**Trong phạm vi (luồng A, và phần của luồng C cần cấu trúc mới):** tổ chức lại mã nguồn của WordLoop (`index.html`), Game/Bảng (`game.html`) và `learn/`; lớp truy cập dữ liệu; cơ chế version/cache; tài liệu; vị trí `tools/`.

**Ngoài phạm vi:** tính năng mới, đổi giao diện, đổi schema Supabase ngoài việc THÊM hàm/bảng đã nêu trong plan (B1, C2), đổi cơ chế đăng nhập `?u=`/RLS `shared_all`, thay WebRTC mesh, bật TURN.

### 1.1 Nghiệm thu cycle A0 chạy bằng Node (2026-10-22)

Phần này cụ thể hoá cycle trong PLAN §0.1, không mở quyền sửa ứng dụng hay triển khai các luồng sau A0. **Checkpoint kế hoạch ban đầu (`f79eaa7`) chỉ commit plan/spec rồi dừng.** Tiêu chí dưới đây là chuẩn nghiệm thu; trạng thái thực hiện cập nhật ngay bên dưới.

**Cập nhật sau audit `a0e08ac`:** TJ đã yêu cầu chạy cycle và commit trên nhánh, không merge. Chỉ đạo dừng ở checkpoint plan/spec phía trên là lịch sử. Cycle hiện có kết quả **PARTIAL** tại `tests/a0/cycle-report.json`, độ phủ/giới hạn ở `tests/a0/README.md`; không tuyên bố mọi tiêu chí dưới đây đã đạt. Đặc tả CTX-09 vẫn giữ nguyên trong lúc chờ PO xác nhận ngoại lệ TJ, không tự cập nhật kỳ vọng để bỏ lỗi.

| Tiêu chí bắt buộc | Bằng chứng nghiệm thu |
|---|---|
| Đúng nguồn và an toàn | Ghi SHA baseline `e324beb54b29ddfa055956c756a4ceba2676dfa1`, SHA nhánh được kiểm và trạng thái nguồn; baseline không bị sửa; mọi đường mạng trong test được giả lập hoặc chặn |
| Số liệu tái lập được | Bảng M0.2 có cách đo/lệnh, phạm vi file, đơn vị và kết quả; chỉ số cần trình duyệt được ghi chưa đo, không suy diễn thành số đã xác minh |
| Test bám hành vi thật | Các ca Node theo TEST §3–4.1 có ID truy vết, đầu vào và kỳ vọng cụ thể; chạy trên baseline và nhánh làm việc. Không sửa ứng dụng hoặc nới kỳ vọng chỉ để xanh |
| Công khai khả năng kiểm `readalong` | Nếu không truy cập được điểm chấm qua API hiện tại, ghi RA-01 cần trình duyệt và chưa phủ; không sửa IIFE để lộ hàm, không tính ca chưa chạy là đạt |
| Kiểm tĩnh có ranh giới | Áp dụng các ca trước M2; báo riêng ca chưa áp dụng. Ngoại lệ có sẵn phải có vị trí/lý do và chờ duyệt nếu chưa được duyệt; test không được âm thầm bỏ qua vi phạm hoặc tự tăng allowlist |
| Kết quả đủ kiểm lại | Có lệnh chạy, tổng đạt/lỗi/chưa phủ, trạng thái trả về thất bại khi assertion hỏng; ca bị skip hoặc chưa chạy phải hiện trong báo cáo độ phủ |
| QA độc lập | Người kiểm độc lập đối chiếu diff, nguồn baseline, tính an toàn và ma trận test với tiêu chí này; ghi rõ verdict và phần chưa đủ bằng chứng |
| Bảo toàn phạm vi và checkpoint | Diff chỉ gồm `tests/` và tài liệu; có commit SHA trên `feat/restructure-plan`, không push main, không deploy; backlog và điểm dừng PO được ghi lại |

**Phân loại kết quả cycle:** `SUCCESS` khi mọi tiêu chí bắt buộc được chứng minh; `PARTIAL` khi mới đạt một phần và liệt kê chính xác phần còn thiếu; `FAILURE` khi có lỗi trọng yếu hoặc tác động ngoài phạm vi; `BLOCKED` khi phụ thuộc ngoài ngăn hoàn thành. Verdict QA là `AUDIT_PASS`, `AUDIT_FAIL` hoặc `INSUFFICIENT_EVIDENCE`, tách khỏi trạng thái thực hiện. `SUCCESS` của cycle Node không chứng minh đã hoàn thành M0: M0.4–M0.8 và các ca phụ thuộc trình duyệt vẫn theo cổng riêng.

**Quy tắc quyết định:** agent tự giải quyết kỹ thuật trong phạm vi. Khi cần thay đổi sản phẩm, duyệt chuẩn/ngoại lệ, cấp quyền cài gói/chi phí hoặc tác động hệ thống thật, trình PO quyết định bằng ảnh hưởng và phương án; không tự chọn thay. Hai commit trên main sau baseline nêu ở PLAN §0.1 không được tự nhập vào cycle này; tương thích với main hiện hành và cách tích hợp cuối phải được đánh giá lại trước cổng liên quan.

## 2. Bất biến (hợp đồng "giữ nguyên")

Sau mỗi bước restructure, các điều sau PHẢI vẫn đúng. Đây là tiêu chí nghiệm thu chung, bổ sung cho tiêu chí riêng từng bước.

| # | Bất biến | Cách chứng minh |
|---|---|---|
| I1 | Mỗi màn hình dựng ra giống hệt trước (cùng dữ liệu cố định, cùng viewport) | Ảnh chụp, sai khác = 0 (TEST §6) |
| I2 | Cùng thao tác người dùng gọi cùng chuỗi lời gọi Supabase/Edge/Worker (bảng, thao tác, bộ lọc, hình dạng payload, thứ tự) | Nhật ký lời gọi chuẩn (TEST §5) |
| I3 | Dữ liệu `localStorage` giữ nguyên tên khoá và hình dạng (người dùng đang dùng không mất dữ liệu khi cập nhật) | Test khoá/giá trị `localStorage` (TEST §4.1) |
| I4 | Giao thức realtime của game giữ nguyên tên sự kiện và hình dạng tin. **Suốt dự án** (không chỉ lúc cập nhật): người dùng bản `main` đóng băng và bản restructure có thể ở cùng một phòng | Test hai client, một bản baseline một bản mới, tầng chặn merge (TEST §7, MP-18) |
| I5 | Hàm thuần (`Context`, `SRS`, `normalizeAnswer`, `ReadAlong` chấm điểm) trả cùng kết quả cho cùng đầu vào | Test Node (TEST §3) |
| I6 | URL công khai không đổi: `index.html`, `game.html`, `game.html?room=…`, `?u=…`, `?sel=…`, `learn/*/index.html`, `manifest.webmanifest`, `data/starter*.json` | Test điều hướng + kiểm tĩnh |
| I7 | Mọi quyết định trong mục "Quyết định đã chốt" và "Lỗi đã sửa" của `CLAUDE.md` còn hiệu lực | Ma trận truy vết (TEST §10) |
| I8 | Không thêm yêu cầu build bắt buộc trước khi chạy local (`python3 -m http.server`), trừ khi TJ chọn A4. Cũng áp cho Netlify: phục vụ được từ thư mục gốc nguyên trạng, hoặc bước build/copy phải được TJ chọn rõ (plan, luồng H1b) | Chạy tay + CI |
| I9 | **Tương thích ngược với bản `main` đóng băng trên backend dùng chung:** (a) schema chỉ THÊM (không đổi tên/xoá/đổi kiểu); (b) Edge Function/Worker nhận đúng mọi yêu cầu mà bản baseline gửi (kể cả `user_id:null`); (c) bản restructure chỉ ghi dữ liệu thật theo quy tắc ghi của plan §5.1 | Test BCK-* (TEST §9.5), nhật ký lời gọi (TEST §5), SCH-01 |

I2, I3, I4, I9 được viết ra vì ảnh chụp không bắt được chúng (xem plan, A0 và §5.1).

Ghi chú khi đổi origin: `localStorage`, `sessionStorage` và PWA gắn theo origin, nên bản `main` (github.io) và bản restructure (Netlify) **không dùng chung** dữ liệu cục bộ. I3 đảm bảo *tên khoá và hình dạng* giữ nguyên khi người dùng chuyển sang bản mới sau khi thay `main` (cùng origin lúc đó), chứ không đảm bảo dữ liệu tự chuyển giữa hai origin.

## 3. Cấu trúc đích

```
index.html            điểm vào WordLoop (giữ nguyên tên và URL)
game.html             điểm vào Game/Bảng (giữ nguyên)
learn/                điểm vào các mini-app (giữ nguyên URL)
src/
  core/               config, supabase client, storage, util, i18n, errors
  data/               adapters (local, cloud), repositories, schema map
  domain/             hàm thuần: srs, context (bài đọc), wordset (tính toán), readalong (chấm)
  features/           notebook, detail, journey, reader, speech, auth, export, home, hubpage
  game/               state, room-net, rounds, ui, board, plugins/{voice,chat,cc,readalong,shadow,swclass}
  learn/              dm, ea, sw (mã dùng chung giữa các mini-app)
css/                  tách theo component, cùng nguồn gốc với app.css/game.css hiện tại
docs/                 architecture, decisions, backlog, runbooks
```

Ghi chú: tên thư mục trên là đề xuất. Điều PHẢI giữ là **tầng và chiều phụ thuộc** (mục 4), không phải từng tên.

### 3.1 Ánh xạ file hiện tại → đích (đề xuất, chưa xác minh phạm vi từng hàm)

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `js/config.js` | `src/core/config` | Chỉ giữ cấu hình công khai; không key bí mật (`CLAUDE.md`) |
| `js/util.js` | `src/core/util` | Nhận `esc`, `shuffle`, `fmt`, `norm` đang bị lặp ở 6 file |
| `js/i18n.js` | `src/core/i18n` | |
| `js/srs.js` | `src/domain/srs` | Hàm thuần |
| `js/context.js` | `src/domain/context` (+ `ai-client` tách riêng cho `_callGemini/_callOpenAI/_callProvider*`) | Phần thuần (`parseMeta`, `gapSentences`, `build`, `translate`, `splitChapters`) tách khỏi phần gọi mạng |
| `js/db.js` | `src/data/*` | Tách adapter local / cloud; giữ nguyên bề mặt `DB.*` (mục 5) |
| `js/auth.js` | `src/features/auth` (+ phần truy cập Supabase đi qua `data/`) | 6 điểm gọi Supabase trực tiếp phải về `data/` |
| `js/speech.js`, `js/reader.js`, `js/readalong.js` | `src/features/speech`, `reader`, `domain/readalong` | |
| `js/wordset.js` | `src/domain/wordset` + `features/wordset` | Phần tính toán tách khỏi phần vẽ |
| `js/journey.js`, `home.js`, `hubpage.js`, `export.js` | `src/features/*` | |
| `js/detail.js` | `src/features/detail/*` theo tab (study, quiz, sheet, single, meaning, progress, dictation) | |
| `js/app.js` | `src/app/*` (khởi động, định tuyến, cây Notebook, dán/trích từ) | Chỉ điểm vào được phép biết mọi feature |
| `js/gamelayer.js` | `src/features/gamelayer` | Giữ seam iframe + `postMessage` |
| `js/game.js` | `src/game/*` | 119 điểm gọi Supabase về `data/` |
| `js/board.js` | `src/game/board/*` | |
| `js/voice.js`, `chat.js`, `cc.js`, `turn.js`, `shadow.js`, `swclass.js`, `learn.js`, `toeic_tips.js` | `src/game/plugins/*`, `src/learn/*` | |
| `sw.js` | `sw.js` (giữ ở gốc để phạm vi bao cả site) | ASSETS sinh từ nguồn version |
| `tools/` | repo/thư mục riêng (plan, câu 4) | Không để đề ETS gần repo public |

## 4. Quy tắc phụ thuộc

Chiều phụ thuộc duy nhất được phép: `core` ← `data` ← `domain` ← `features` ← `app`. `game` là cây riêng với cùng quy tắc, được dùng `core`, `data`, `domain`.

1. Tầng dưới PHẢI KHÔNG import tầng trên. Kiểm bằng công cụ trong CI (đồ thị import; không vòng).
2. `features/*` PHẢI KHÔNG import lẫn nhau trực tiếp. Giao tiếp qua `app` (callback truyền vào) hoặc một bus sự kiện nhỏ ở `core`. Lý do: hiện `App` bị 11/12 module gọi ngược (plan mục 4). **A0 PHẢI lập danh sách chính xác các hàm `App.*` bị gọi ngược** để thiết kế bus/callback; danh sách này chưa có.
3. Truy cập dữ liệu:
   - Gọi Supabase (REST, Storage, Functions, Realtime) chỉ ở `data/` và `core/supabase`. Số điểm ngoài `data/` PHẢI = 0.
   - `localStorage`/`sessionStorage`/IndexedDB chỉ qua `core/storage`. Số điểm ngoài = 0. `core/storage` PHẢI giữ nguyên tên khoá hiện có (I3).
   - Ngoại lệ có tên: `fetch` tới Worker `tj-game`/`tj-shelf`/LanguageTool/Edge Function đi qua `data/` dưới dạng "client dịch vụ", không gọi rải rác.
4. Không `window.X` mới. Trong lúc chuyển, mỗi module được phép có **một** dòng gán tương thích `window.X = …` ghi chú `// compat: xoá khi mọi người dùng đã import`; CI đếm số dòng này và phải giảm đơn điệu.
5. Một module = một trách nhiệm; kích thước tham chiếu: dưới ~800 dòng, hàm dưới ~120 dòng (NÊN, ngoại lệ ghi lý do).
6. Không mã chạy khi `import` ngoài khai báo (không side-effect lúc nạp), trừ điểm vào. Khởi động đi qua một hàm `start()` tường minh.

## 5. Lớp dữ liệu — hợp đồng

- Bề mặt công khai `DB.*` hiện có (≈ 80 phương thức: `DB.init`, `getFullTree`, `loadNotebook`, `saveBlockProgress`, `saveWordProgress`, `markResults`, `applyStarter`, `duplicateNotebook`, `getJourneySummary`, `ensureOnRieng`, `syncOnRiengBlocks`, …) PHẢI giữ nguyên tên, tham số và kiểu trả về trong suốt A1–A3. Cấu trúc bên trong tự do.
- Quy tắc `progressLocal()` (`DB.mode==="local" || !DB.progressCloud`) PHẢI áp cho mọi hàm đụng `block_progress`/`word_progress`; có test hồi quy riêng (lỗi cũ `getFullTree`).
- Chèn hàng loạt PHẢI chuẩn hoá bộ khoá của mọi object trong mảng (lỗi `PGRST102`).
- `sbListAll` (phân trang) PHẢI giữ nguyên hành vi trên dữ liệu hơn 1000 dòng.
- Game: 119 điểm gọi Supabase chuyển thành các phương thức đặt tên ở `data/game` (rooms, answers, history, library). Danh sách phương thức được lập ở A1 từ nhật ký lời gọi chuẩn, không đoán trước.
- Lời gọi tới Edge Function AI đi qua một client duy nhất (hiện lặp ở `context.js`, `cc.js`, `game.js`×3). Hình dạng body (`model, sys, user, user_id, block_id`) giữ nguyên (I2) trừ khi luồng B đổi có chủ đích.

## 6. Quy ước version và cache

Áp dụng tới khi A4 (Vite) hoàn tất; chi tiết cổng lựa chọn ở plan, A2.

1. Mỗi module có **đúng một** URL trong toàn đồ thị import (danh tính module là URL).
2. Cấm `?v=` viết tay trong câu lệnh `import`.
3. Nguồn version duy nhất cho mỗi trang HTML (import map, hoặc kết quả script đóng dấu, hoặc băm của Vite).
4. `/bump` PHẢI bắc cầu: module đổi → mọi trang importer → mục version tương ứng đã đổi.
5. `GAME_VER` và `game-version.json` PHẢI khớp; `data/starter.json.version` PHẢI trùng ký tự với `data/starter.version.json.version` (kiểm tự động, §TEST 3).
6. `sw.js`: chiến lược mạng-trước giữ nguyên; ASSETS sinh từ nguồn version; `activate` dọn URL lỗi thời; offline tải lại `index.html` và game vẫn chạy sau một lần tải online.

## 7. Giao thức game (đóng băng)

Tên sự kiện kênh phòng, hình dạng tin và các cờ sau PHẢI giữ nguyên trong suốt restructure (I4): `alive`, `ans`, `bmeta`, `board`, `cc`, `chat`, `gaps`, `graded`, `hello`, `rtc`, `state`, `sw`, `sync`, `voice`; cờ `relay`; mốc `bts`; mã phòng; kênh `game:<mã>` với `broadcast.self=true` và presence. Thứ tự xử lý PHẢI giữ: khối `d.relay` chặn **trước** khối "nhường host". Mọi đổi giao thức là thay đổi hành vi, thuộc về tính năng, không thuộc restructure.

Quy tắc an toàn khi kiểm thử: không bao giờ vào phòng `TJ`; mọi harness dùng mã phòng `ZZ_…` và chặn `joinRoom("TJ")`.

## 8. Chất lượng và công cụ

| Hạng mục | Yêu cầu |
|---|---|
| CI | Chạy trên mọi PR: `node --check` mọi `.js`; test Node; kiểm tĩnh (mục 6, cấm `hyphens:auto` và `overflow-wrap:anywhere` ở CSS bài đọc/bảng, không `GEMINI_API_KEY`/`sb_secret_` trong file, không file đề ETS); kiểm đồ thị import; Playwright cho nhóm PHẢI-chặn-merge (TEST §11). Bước CI chạy trong ≤ 10 phút |
| Lint/format | NÊN thêm sau A2, với bộ luật tối thiểu (không biến chưa khai báo, không `==`); không định dạng lại hàng loạt trong cùng PR với thay đổi cấu trúc (giữ diff đọc được) |
| Chú thích | Giữ chú thích tiếng Việt hiện có khi dời mã; không để chú thích `/* … */` mở trong giữa dòng mã (lỗi đã xảy ra, `CLAUDE.md`) |
| Kết thúc dòng | Giữ CRLF/LF như file gốc khi dời mã; script sửa nhiều dòng phải khớp kiểu xuống dòng (`CLAUDE.md`) |
| Bí mật | Không key trong repo; anon key công khai được phép; tuân `CLAUDE.md` về proxy |
| Tài liệu | Mỗi thư mục `src/*` có `README` ngắn (trách nhiệm, được import gì); `docs/` tách kiến trúc / quyết định / backlog / runbook theo vai trò 3 file trong `CLAUDE.md` |

## 9. Tiêu chí nghiệm thu tổng

Restructure luồng A được coi là **xong** khi đồng thời:

1. Toàn bộ nhóm test PHẢI-chặn-merge xanh **trên đầu nhánh restructure ở thời điểm freeze**, ảnh chụp sai khác = 0, nhật ký lời gọi khớp chuẩn (hoặc khác có ghi chú duyệt từng dòng).
2. Bảng chỉ số ở plan mục 7 đạt đích: ngoài `data/` 0 điểm Supabase, 0 điểm `localStorage`, 1 định nghĩa `esc`, file lớn nhất dưới ~800 dòng, 0 global tự đặt (trừ điểm vào), đồ thị import không vòng.
3. Kiểm tay trên bản Netlify bằng hai thiết bị thật trong phòng `ZZ_…`: lobby → ván → kết thúc, bảng, voice/CC bật-tắt, tải lại giữa ván; thêm một lượt **hỗn hợp phiên bản**: một thiết bị chạy bản `main` (Pages), một thiết bị chạy bản Netlify, cùng phòng.
4. Bản Netlify chạy: tải online → tắt mạng → tải lại vẫn dùng được; sau một lần cập nhật không còn người dùng kẹt bản cũ. *(Sau khi thay `main`, lặp lại kiểm này trên host chính thức.)*
5. Bản restructure ghi dữ liệu thật đúng như `main` (nhật ký lời gọi khớp) và TJ đã đồng ý cho ghi bằng hồ sơ thật (plan §5.1, câu 9).
6. Diễn tập khôi phục (HST-10) đạt trên backend ở trạng thái hiện hành: có phương án quay lại **không cần force-push** (commit khôi phục cây archive rồi fast-forward) hoặc TJ đã chọn phương án khác ở câu 12.
7. TJ xem bản Netlify và đồng ý freeze. Việc thay `main` là một quyết định và một lệnh riêng theo plan §5.1 (`/ship` chỉ khi TJ bảo).

## 10. Câu hỏi còn mở ảnh hưởng đặc tả

Các câu này nằm ở plan mục 9 và chặn các phần tương ứng:

| Câu | Chặn phần nào của đặc tả |
|---|---|
| 3 (cơ chế version) | §6, và toàn bộ A2 |
| 4 (vị trí `tools/`) | §3.1 dòng `tools/` |
| 7 (`handoff/gate`) | §3.1 dòng `js/game.js` / A3 |
| ~~8 (baseline)~~ ✔ đã chốt `e324beb` | — |
| ~~2 (đóng băng, một dòng tích hợp)~~ ✔ đã chốt | — |
| 1 (A0) | Toàn bộ lộ trình |
| 9 (ghi dữ liệu thật từ bản mới) | I9(c), tiêu chí nghiệm thu 5 |
| 10, 11, 12 (Netlify, host chính, dự phòng quay lại) | Luồng H, thủ tục thay `main` |

Phần B1 (sổ chi tiêu) và C2 (RPC thống kê) có đặc tả riêng trong plan (mục 6) và được kiểm bằng TEST §9; không lặp ở đây.
