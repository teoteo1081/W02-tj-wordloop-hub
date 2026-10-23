# Kế hoạch sửa tốc độ tải web live (PLAN_PERF_BOOT.md) — WordLoop Hub

> **Trạng thái:** CHỈ LÀ KẾ HOẠCH — chưa sửa code ứng dụng. Chờ TJ duyệt trước khi làm.
> **Nhánh làm việc dự kiến:** `fix/perf-boot` (rẽ từ `origin/main`). Không đẩy lên `main` trước khi TJ duyệt.
> **Ngày đo:** 2026-10-23, web live `https://teoteo1081.github.io/W02-tj-wordloop-hub/`, Chrome, 1 lần đo, 1 mạng — số liệu mang tính định hướng.

---

## 1. Vấn đề

Web live tải chậm. JS/CSS không phải thủ phạm (44 request, ~477 KB, xong ~0,9 giây). Chậm vì các request Supabase chạy **nối đuôi nhau** lúc khởi động và ở nền, mỗi request ~0,3–0,5 giây.

| Mốc | Thời điểm đo |
|---|---|
| First paint (khung trang) | ~1,4 giây |
| Hiện danh sách Hub/Notebook/Section (request `sections?...words(*)` xong) | ~4,2 giây |
| Request nền cuối cùng kết thúc | > 10 giây |

## 2. Nguyên nhân (bằng chứng mã nguồn)

1. **Chuỗi khởi động tuần tự** — `boot()` ([js/app.js:5285](js/app.js#L5285)): `DB.init` (có 1 request kiểm tra kết nối, ~1,2 giây) → `Auth.init` → `loadNotebookAccess` → `ensureOnRieng` (gọi lại `loadNotebookAccess` lần 2, [js/app.js:192](js/app.js#L192)) → `getHubsForUser` → `loadNotebooksFiltered` → `loadNotebook`. `refreshVisibleHubIds` còn gọi `getAllNotebooksLite`, nên `notebooks`/`hubs` bị tải lặp 3 lần.
2. **Bảng xếp hạng nhỏ ở sidebar tải cả kho** — `renderAll` → `App.renderSidebarLbMini` ([js/app.js:296](js/app.js#L296), [js/app.js:1525](js/app.js#L1525)) → `loadLeaderboardData` → `App.scopeIds` ([js/app.js:3049](js/app.js#L3049)) → `DB.getFullTree` + `DB.getAllWordsLite` (toàn bộ ~9.338 từ, 10 trang), chỉ để tính top 5 của 1 notebook.
3. **Bộ đếm "đã thuộc / tổng từ" tải toàn bộ words lần thứ hai** — `getJourneySummary` → `distinctWordIndex` ([js/db.js:2050](js/db.js#L2050)), lần này lấy `id,term`.
4. **Phân trang tuần tự** — `sbListAll` ([js/db.js:358](js/db.js#L358)) chờ trang trước xong mới gọi trang sau.
5. (Phụ) pdf.js nạp từ CDN ngay từ đầu dù chỉ cần khi upload PDF ([index.html](index.html#L1214)).

## 3. Các bước sửa (theo thứ tự ưu tiên)

| Bước | Việc | File | Rủi ro | Hiệu quả dự kiến (ước lượng, chưa kiểm chứng) |
|---|---|---|---|---|
| 1 | Chạy song song `listAllNotebookAccess`, `getHubs`, `getAllNotebooksLite` trong `boot()`; bỏ lần `loadNotebookAccess` thứ 2 trong `ensureOnRieng` khi chưa tạo gì mới | `js/app.js` | Thấp — giữ đúng phụ thuộc: lọc notebook cần `myGrantedIds` có trước | Cắt ~1–2 giây ở đoạn chờ 4,2 giây |
| 2 | Cache trong bộ nhớ cho `notebooks`/`hubs`/`getAllNotebooksLite` trong 1 phiên khởi động; xoá cache khi đổi user, kéo-thả, nhân bản | `js/db.js` | Trung bình — hiện dữ liệu cũ nếu quên xoá cache | Bỏ 3–4 request thừa |
| 3 | Trì hoãn `renderSidebarLbMini` và `refreshWordCounter` ~2–3 giây sau khi trang hiện (`requestIdleCallback`/`setTimeout`); ô xếp hạng hiện "⏳ Đang tải…" | `js/app.js` | Thấp — đổi hiển thị đã được PO đồng ý | Trang chính không tranh băng thông với phần tải nền |
| 4 | `sbListAll` lấy các trang song song (trang đầu lấy `count`, còn lại gọi cùng lúc, tối đa 4 request/lần) | `js/db.js` | Trung bình — giữ đúng thứ tự dòng, tránh rate limit | Phần words ~4 giây → ~1–1,5 giây |
| 5 | Dùng chung 1 lần tải words cho bảng xếp hạng và bộ đếm; xoá cache khi thêm từ (`invalidateDistinctWords` đã có) | `js/db.js` | Trung bình | Bỏ hẳn 1 lần tải 9.000 từ |
| 6 | Nạp pdf.js khi cần (lúc `readPdfText`) | `index.html`, `js/app.js` | Thấp | Bớt 1 request CDN lúc khởi động |

Nên làm 1, 3, 4 trước; 2, 5, 6 làm sau khi đo lại.

## 4. Ngoài phạm vi / chưa quyết

* **KHÔNG** đổi cấu trúc DB Supabase, không chạy SQL. Hàm đếm/RPC phía Supabase (tránh tải 9.000 từ chỉ để đếm) để sau, **chờ TJ quyết** — chỉ xét lại nếu 6 bước trên vẫn chưa đủ nhanh.
* KHÔNG đổi cơ chế đăng nhập, RLS, logic nghiệp vụ.
* Nguyên nhân request kiểm tra kết nối đầu tiên (`hubs?select=id&limit=1`, ~1,2 giây) chưa rõ — cần kiểm tra thêm, có thể không sửa được từ phía app.

## 5. Quy tắc bắt buộc khi làm (theo `CLAUDE.md`)

* Mỗi file JS/CSS đã sửa phải bump đúng `?v=N` trong `index.html` (`app.js` đang `?v=71`, `db.js` đang `?v=19`).
* `node --check` từng file đã sửa trước khi commit (dùng `&&`).
* Push `main` là 1 lệnh riêng; chỉ merge khi TJ duyệt.
* QA độc lập (agent riêng) vì đổi thứ tự khởi động.

## 6. Tiêu chí nghiệm thu

| Mã | Tiêu chí | Cách kiểm tra |
|---|---|---|
| **PERF-01** | Danh sách Hub/Notebook hiện trong < 2,5 giây (hiện ~4,2 giây) | Chạy lại đo `performance.getEntriesByType('resource')` trên Chrome, cùng tài khoản |
| **PERF-02** | Toàn bộ request nền kết thúc < 6 giây (hiện > 10 giây) | Như trên |
| **PERF-03** | Số liệu giữ nguyên: bảng xếp hạng, bộ đếm đã thuộc/tổng từ, badge Ôn riêng/Fix lỗi sai, Journey | So sánh trước/sau với Admin và user thường có Notebook `restricted` |
| **PERF-04** | Đổi user, đổi Hub/Notebook, nhân bản Notebook, thêm ⭐ vẫn đúng (cache được xoá đúng lúc) | Thử tay + QA độc lập |
| **PERF-05** | Chế độ Local vẫn mở được khi Supabase không kết nối | Chặn mạng tới Supabase rồi mở trang |
| **PERF-06** | Cú pháp JS hợp lệ | `node --check` từng file đã sửa |

## 7. Trạng thái

* [x] Đo trên web live, truy nguyên nhân tới dòng code
* [x] Soạn kế hoạch (file này)
* [ ] TJ duyệt kế hoạch
* [ ] Tạo nhánh `fix/perf-boot` từ `origin/main`, thực thi bước 1, 3, 4
* [ ] Đo lại, QA độc lập
* [ ] TJ xem thử rồi mới đưa lên `main`
