# PLAN — Chuyển frontend WordLoop sang Netlify

Ngày lập: 2026-10-20. Trạng thái: **đã chọn hướng, chưa triển khai**.

TJ chọn chỉ chuyển nơi deploy frontend sang Netlify, giữ backend hiện tại. Commit tài liệu này chỉ lưu kế hoạch; không thay cấu hình, kết nối tài khoản, push, deploy, đổi domain hay dữ liệu production.

## 1. Mục tiêu và phạm vi

Kết quả mong muốn: WordLoop chạy từ địa chỉ Netlify ổn định, giữ nguyên logic, giao diện, hồ sơ cloud và các luồng game hiện có. Có bằng chứng kiểm thử và đường quay lại GitHub Pages trước khi công bố địa chỉ mới.

| Thành phần | Sau khi chuyển |
|---|---|
| HTML, CSS, JavaScript, dữ liệu tĩnh đi kèm | Netlify |
| Database, API dữ liệu, realtime, storage đang dùng | Giữ Supabase |
| AI proxy và TURN credentials | Giữ các Supabase Edge Function hiện tại |
| Audio TOEIC, kệ tài liệu | Giữ Cloudflare Workers/R2, trình duyệt gọi trực tiếp |
| Git repository và lịch sử | Giữ repository hiện tại |

Không đưa Netlify Functions, AI Gateway, Database hay Blob vào phạm vi này. Không chuyển backend sang Render, Google Cloud hay Sheets/Apps Script. Không gộp ES modules, Vite, restructure hoặc vá bảo mật vào việc đổi hosting.

Quy định cũ trong `CLAUDE.md` chọn GitHub Pages là bối cảnh trước quyết định này. TJ đã chọn hướng mới, nhưng chưa yêu cầu thực hiện chuyển hosting. Khi thực hiện, cập nhật tài liệu hosting trong một thay đổi riêng có phạm vi rõ; tài liệu này không tự sửa các quyết định khác của repo.

## 2. Bằng chứng và giới hạn hiện tại

- Plan được tạo trên nhánh riêng `feat/netlify-frontend-plan`, từ local `main@8b071e6`; không sửa kế hoạch restructure của agent khác.
- Mốc remote đã đọc trong phiên: `origin/main@e324beb`. Trước triển khai phải cập nhật trạng thái Git và chốt SHA nguồn production thực tế; không mặc định local main hoặc nhánh tài liệu là bản cần deploy.
- App thuần HTML/CSS/JS; không cần đổi framework hay thêm bundler để chạy trên Netlify.
- `js/gamelayer.js` dùng đường dẫn tương đối `game.html` và kiểm tra `location.origin`; parent và game phải cùng hostname của bản deploy.
- `manifest.webmanifest` dùng đường dẫn tương đối; `js/app.js` đăng ký `sw.js`. Vẫn phải kiểm tra PWA/cache trên domain mới.
- `js/hubpage.js` còn nhúng trang CIA từ GitHub Pages của `L00_ES-CN`; `js/board.js` tải nội dung Marketing từ Pages của `L02-digital-marketing-beginner`. Chuyển WordLoop không chuyển hai nguồn này.
- README ghi Netlify cũ từng hết hạn mức và đứng ở bản cũ. Chưa xác minh dashboard, plan legacy/credit, usage, cấu hình domain hoặc deploy hiện tại của tài khoản đó.
- Chưa chạy app trên Netlify, đo hiệu năng hoặc kiểm tra dữ liệu production. Các mục kiểm thử bên dưới là yêu cầu tương lai, chưa phải kết quả đã đạt.

## 3. Chi phí và giới hạn vận hành

Giá tham khảo được kiểm tra ngày 2026-10-20, USD, chưa thuế. Chỉ áp dụng bảng sau nếu tài khoản dùng gói credit hiện hành; tài khoản legacy phải đọc đúng Usage & billing của nó.

| Khoản | Giá/hạn mức tham khảo |
|---|---|
| Free | $0, 300 credit/tháng |
| Personal | $9/tháng, 1.000 credit |
| Pro cơ bản | $20/tháng, 3.000 credit |
| Production deploy thành công | 15 credit/lần |
| Băng thông | 20 credit/GB |
| Web request | 2 credit/10.000 request |
| Deploy Preview/branch deploy | 0 credit cho thao tác deploy; traffic vẫn tính |

Với frontend thuần, dự toán credit = `15 × số deploy production + 20 × GB phục vụ + 2 × request / 10.000`. Đây là mô hình ước tính, không phải số usage đã đo hoặc cách làm tròn hóa đơn.

Ví dụ 10 deploy + 5 GB + 50.000 request = 260 credit; 30 deploy cùng mức traffic = 560 credit. Free không đủ cho 20 deploy production cộng thêm traffic. Credit được dùng chung trong team; phải tính cả các site khác. Khi hết credit, site có thể bị pause.

Khuyến nghị: thử nghiệm bằng preview, chỉ phát hành production ở các mốc đã kiểm tra. Không tự bật auto recharge hay chọn gói trả phí. Trước cutover, TJ cần chốt mức chi phí chấp nhận và cách xử lý khi gần hết hạn mức; nếu chọn giới hạn cứng, phải chấp nhận khả năng hết credit gây gián đoạn.

Giữ audio/PDF và truy vấn backend đi trực tiếp tới dịch vụ hiện có, không proxy qua Netlify. Phí AI, Supabase, Cloudflare/R2 tiếp tục theo các dịch vụ đó; đổi frontend không tạo trần tiền AI và không xử lý lỗ hổng đã audit.

Nguồn:
- [Netlify pricing](https://www.netlify.com/pricing/)
- [How credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)

## 4. Tác động tới người dùng và dữ liệu

Domain GitHub Pages và Netlify là hai origin khác nhau. LocalStorage, sessionStorage, cache, quyền mic và bản PWA đã cài không tự chuyển sang origin mới.

- Tiến trình đã lưu trên Supabase vẫn ở đó, nhưng người dùng cần vào lại đúng hồ sơ. Kiểm tra mã hồ sơ/player trước và sau; không tự tạo hay gộp tài khoản để xử lý nhầm danh tính.
- Dữ liệu chỉ lưu local cần được kiểm kê và sao lưu bằng cơ chế hiện có trước khi chuyển người dùng liên quan; nếu thiếu đường khôi phục phải giải quyết trước cutover, không giả định cloud chứa mọi thứ.
- Link cũ và PWA cũ tiếp tục mở host cũ. Chuẩn bị hướng dẫn địa chỉ mới, cách nhận lại hồ sơ và cài lại PWA nếu cần; chưa tự redirect hoặc xóa dữ liệu host cũ.
- URL preview có origin riêng, nên không dùng việc mất hồ sơ đang nhớ ở preview để kết luận dữ liệu cloud đã mất. Dùng một hostname thử ổn định cho kiểm tra liên phiên/PWA.
- Preview dùng backend production nếu giữ nguyên config. Một bản preview không phải một database thử riêng; dùng phòng `ZZ_…`, không mở `game.html` trơn hoặc vào phòng thật `TJ` khi QA.

## 5. Các bước triển khai dự kiến

### N0 — Xác minh trước khi thay cấu hình

Đọc dashboard Netlify cũ: quyền truy cập, gói, credit/team usage, repo liên kết, production branch, domain và deploy đang phục vụ. Chốt SHA cần đưa lên và ghi trạng thái Pages hiện tại. Chọn hostname Netlify ổn định; domain riêng là lựa chọn ngoài phạm vi mặc định.

Đầu ra: bảng cấu hình nguồn/đích, chi phí dự kiến theo usage thật, danh sách hồ sơ/dữ liệu local cần bảo toàn. Nếu chưa có quyền đọc dashboard hoặc số liệu, ghi rõ phần chưa xác minh, không tự chọn gói thay thế.

### N1 — Chuẩn bị bản frontend có thể xem thử

- Dùng nhánh triển khai riêng khi được yêu cầu thực hiện; không sửa hoặc commit phần việc của agent khác.
- Chuẩn bị publish directory chỉ chứa tài nguyên frontend cần thiết: `index.html`, `game.html`, `css/`, `js/`, `learn/`, dữ liệu tĩnh cần dùng trong `data/`, icon, manifest, `sw.js`, `game-version.json` và các dependency thực tế được kiểm tra.
- Không publish trực tiếp toàn bộ thư mục làm việc của máy. Không đưa secret, file local bị ignore, SQL, script quản trị, backup hoặc tài liệu nội bộ vào artifact. Việc chọn artifact không đồng nghĩa xóa hay di chuyển các file đó trong repo.
- Giữ nguyên các endpoint Supabase/Workers và không đổi query/schema. Không đưa secret backend vào biến môi trường rồi nhúng chúng vào JavaScript công khai.
- Bảo toàn các trang thật `game.html`, `learn/*/index.html`; không thêm rewrite toàn bộ URL về `index.html` như một SPA.
- Cấu hình preview/production tách rõ. Chỉ nhánh production đã chốt được cập nhật địa chỉ chính; không bắt mọi push của nhánh khác thành production deploy.
- Kiểm tra CORS, quyền nhúng/Permissions Policy và origin allowlist thực tế. Chỉ chỉnh khi có bằng chứng cần thiết, trong phạm vi được giao; không tự siết header làm hỏng iframe, mic hoặc tài nguyên ngoài.

Đầu ra: artifact đối chiếu được với SHA nguồn và URL thử. Chưa công bố thay thế Pages.

### N2 — Kiểm chứng trước cutover

| Luồng | Điều kiện đạt |
|---|---|
| Tài nguyên/đường dẫn | Không thiếu file cần dùng; mở trực tiếp game và các trang learn được |
| Hồ sơ và học tập | Nhận đúng hồ sơ; tiến trình cloud trước/sau khớp; dữ liệu local có đường bảo toàn |
| Game hai thiết bị | Vào cùng phòng `ZZ_…`, host/player đồng bộ, nhận kết quả và reconnect đúng |
| Bảng và media | Mở tài liệu, audio/tua, voice/chia sẻ màn hình hoạt động theo quyền trình duyệt |
| Nguồn bên ngoài | Trang CIA và bài Marketing còn tải được từ các repo Pages liên quan |
| AI | Các luồng hợp lệ vẫn gọi đúng proxy; chỉ thử ít lượt có kiểm soát trong phạm vi được cho phép |
| Cập nhật/cache/PWA | Tải lại từ bản đã cache nhận đúng code; offline theo mức hỗ trợ hiện có; cài/mở lại PWA đúng host |
| Chi phí/hiệu năng | Ghi credit sau thử nghiệm, đối chiếu request/media đi đúng host; đo cùng kịch bản nếu muốn kết luận nhanh hơn |

Lưu SHA, URL, trình duyệt/thiết bị, kết quả và lỗi còn mở. Không dùng ảnh giao diện làm bằng chứng duy nhất cho đúng dữ liệu hoặc multiplayer. Giữ quy tắc bump `?v=N` hiện tại; Netlify không tự thay thế cơ chế cache của app.

### N3 — Chuyển địa chỉ chính khi có yêu cầu phát hành

Chỉ thực hiện khi N2 đạt, ngân sách/hạn mức đã chốt và có yêu cầu chuyển production. Thông báo địa chỉ mới cùng cách vào đúng hồ sơ. Giữ Pages làm đường quay lại trong giai đoạn chuyển tiếp; xác định rõ host nào là chính và SHA mỗi host, tránh quảng bá hai địa chỉ như hai môi trường dữ liệu độc lập.

Theo dõi lỗi nhận dạng, game/realtime, thiếu tài nguyên, cache và credit sau chuyển. Chưa tắt Pages hoặc thêm redirect bắt buộc trong lần chuyển đầu. Cập nhật README/CLAUDE/runbook hosting trong PR triển khai để tài liệu không tiếp tục chỉ người dùng về sai host.

## 6. Rollback

- Nếu frontend mới lỗi, có thể phát hành lại deploy Netlify đã kiểm chứng hoặc hướng người dùng về Pages đã ghi nhận ở N0; kiểm tra bản Pages còn tương thích backend và các tính năng đã dùng trước khi coi là fallback đạt.
- Nếu site Netlify bị pause do hết credit, không coi nút rollback deploy là cách khôi phục quota; dùng fallback Pages hoặc xử lý hạn mức theo lựa chọn đã chốt.
- Không xóa localStorage/cache của người dùng như một bước rollback mặc định. Dữ liệu phát sinh riêng trên host mới có thể cần sao lưu/khôi phục trước khi quay về host cũ.
- Rollback hosting không hoàn tác dữ liệu đã ghi lên Supabase/R2, không quay lại phiên game đang chạy. Plan không thay schema nên không có bước rollback database trong phạm vi.
- Khi rollback trên Netlify, kiểm tra auto publishing để lần push tiếp theo không tự phát hành lại bản đang lỗi.

Nguồn: [Manage deploys / rollback](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).

## 7. Những việc còn cần chốt trước production

1. Dùng site Netlify cũ hay site mới, dựa trên quyền sở hữu và cấu hình được xác minh ở N0.
2. Ngân sách/hạn mức chấp nhận, đặc biệt khi có nhiều site chung team hoặc deploy thường xuyên.
3. Cách bảo toàn dữ liệu local và đưa người dùng về đúng hồ sơ tại địa chỉ mới.
4. SHA nguồn, URL chính và bản Pages fallback đã kiểm chứng.

Agent chịu trách nhiệm chi tiết cấu hình, artifact, kiểm thử và bằng chứng trong phạm vi được giao. Không cần TJ chọn framework hay cơ chế kỹ thuật chỉ để đổi host. Việc commit plan này không tự cấp quyền kết nối tài khoản, trả phí, push hoặc phát hành production.
