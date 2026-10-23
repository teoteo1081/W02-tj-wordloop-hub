# tests/browser — cycle A0 trong trình duyệt (PLAN §0.2, SPEC §1.2)

Bằng chứng **hành vi trong trình duyệt** cho bản baseline `e324beb` và nhánh restructure: luồng học chính, nhật ký lời gọi
backend/storage, hai client độc lập, ảnh chuẩn. Chỉ thêm `tests/` và tài liệu; **không sửa mã ứng dụng**.
Số liệu, hash và danh sách khoảng trống nằm ở `report.json` (máy đọc, không phải golden đã được PO duyệt).

## Chạy lại

Cần Python 3.12 + Playwright Python + Chromium **đã có sẵn** (không cài thêm gì). Từ thư mục gốc worktree:

```powershell
python -I -X utf8 tests/browser/run.py                                   # kịch bản trên baseline VÀ nhánh, so với nhau
python -I -X utf8 tests/browser/run.py --only call_w                     # lọc theo tên hàm kịch bản
python -I -X utf8 tests/browser/run.py --selftest                        # thêm phản chứng: cài lỗi vào BẢN CHÉP mã app, kịch bản phải FAIL
python -I -X utf8 tests/browser/run.py --shots                           # thêm ảnh 1280x800 + 390x844, hai lượt độc lập mỗi nguồn (~8 phút)
python -I -X utf8 tests/browser/run.py --selftest --shots --write-report # bộ đầy đủ, ghi tests/browser/report.json
python -I -X utf8 tests/browser/shots.py --target branch --out <thư_mục> # chỉ chụp ảnh;  --compare A B để so hai thư mục ảnh
python -I -X utf8 tests/browser/fixtures/make_fixture.py --check         # fixture tổng hợp còn khớp bộ sinh
```

`-X utf8` cần vì console Windows mặc định cp1252. Baseline được đọc ở `../wt-baseline-e324beb` (worktree chỉ-đọc, detached `e324beb`).
Exit 1 nếu có kịch bản FAIL, request ngoài khai báo, nguồn sai/không sạch, mã phục vụ khác blob trong git, hoặc ảnh không ổn định.
Exit 0 vẫn in **PARTIAL** nếu còn ID cam kết chưa có kịch bản đạt (xem `coverage.py`); chỉ in SUCCESS khi hết khoảng trống.

## Khung (M0.4)

| Thành phần | Tệp | Vai trò |
|---|---|---|
| Server tĩnh + băm | `bw.py` `Site` | Mỗi nguồn một server cổng ngẫu nhiên, `Cache-Control: no-store`; ghi băm LF của từng tệp đã phục vụ. `verify_served` so với blob trong `git HEAD` của nguồn → không chạy nhầm checkout/bản sửa tay/cache cũ |
| Chặn mạng | `bw.py` `Guard` | Ở cấp **BrowserContext**, cài trước khi nạp trang: chỉ origin cục bộ và mock KHAI BÁO; mọi thứ khác bị abort và ghi vào báo cáo. `service_workers="block"`; `WebSocket` bị ghi đè trong trang (Playwright sync không cho `ws.close()` trong handler) và có lưới thứ hai ở tầng mạng |
| Tính xác định | `bw.py` `INIT_BASE`, `cluster.py` | `Math.random` gieo theo (hạt giống context, số lần nạp trang), animation tắt, locale/múi giờ cố định, stub `speechSynthesis`/`SpeechRecognition`/`getUserMedia`/`getDisplayMedia`. Local mode: `set_fixed_time`. Cloud/game: đồng hồ **ảo** (`install` + `pause_at` + `run_for`) — thời gian chỉ trôi khi test `tick()` |
| Dữ liệu | `fixtures/` | **Tổng hợp**, sinh bởi `make_fixture.py` (1 Hub, 2 Notebook "SURVIVAL"/"OFFICE WORDS", 40 từ gồm trùng/hoa-thường/dấu câu, 1 Block có bài đọc + 4 nguồn candidate). Không dùng `data/starter.json` thật, không tài khoản/phòng thật |
| Cloud mode giả | `fakesb.js`, `fakebackend.py`, `cloudwl.py` | Thay `window.supabase` bằng shim gửi MÔ TẢ truy vấn tới engine PostgREST-tập-con trong Python; Edge Function/Worker được `Guard` chặn và trả bản đóng hộp |
| Hai client | `cluster.py` | Mỗi người một BrowserContext (storage riêng); broker Realtime giả chuyển tin qua hàng đợi, `pump()` đẩy theo thứ tự đến; có `hold_matching/release_held/close_member` để bơm lỗi |
| Kịch bản | `scn_guard.py` `scn_learn.py` `scn_cloud.py` `scn_game.py` | Mỗi kịch bản gắn ID TEST, assertion mềm, bằng chứng quan sát (`evidence`) để so baseline/nhánh |
| Ảnh | `shots.py` | 8 màn × 2 cỡ; manifest băm; so pixel; `shots-candidate/` = ảnh **candidate** chờ review |
| Phản chứng | `selftest.py` | Lỗi cài vào bản chép + đối chứng xanh; phản chứng kiểm "đúng nguồn" |

## Phạm vi trung thực — điều KHÔNG được suy ra từ kết quả xanh

1. **Không phải `supabase-js` thật, không phải PostgREST thật.** Máy không có bản `supabase-js@2.45.4` cục bộ và PLAN §0.2 cấm tải gói mới
   (xin phép riêng nếu cần `npm pack`). Cloud mode dùng shim ở ranh giới thư viện. Nhật ký ghi đúng điều app **yêu cầu** backend (bảng, thao
   tác, bộ lọc chuẩn hóa, khóa/hình dạng payload, thứ tự) — đủ để so baseline và nhánh ở I2 — nhưng KHÔNG chứng minh URL, header, mã hóa
   truy vấn của supabase-js, RLS, kiểu cột, khóa ngoại, độ trễ hay lỗi mạng thật. Truy vấn/hàm chưa hỗ trợ trả lỗi rõ và làm kịch bản FAIL.
   Khác biệt đã biết thêm (QA độc lập): `select` không có `order` giữ thứ tự chèn (Postgres thật không đảm bảo, nên thiếu `.order()` trong app bị che); `eq(cột_uuid, 'us_…')`
   không báo 22P02 (chỉ CALL-W01 kiểm riêng); `in()` nhận mảng nên không có giới hạn độ dài URL (game dùng nhóm 150); mốc thời gian trả dạng `…Z` thay vì `+00:00`;
   `created_at` mặc định chỉ cho vài bảng; `auth.getSession` luôn null; Realtime phát cho mọi thành viên bất kể trạng thái subscribe. `onConflict` của upsert ĐƯỢC kiểm với
   ràng buộc duy nhất thật (42P10) từ 2026-10-22 — bảng ràng buộc lấy từ mã app, chưa đối chiếu `tools/*.sql`.
2. **Realtime**: broker giả không mô phỏng độ trễ/mất gói/thứ tự thật ngoài những gì test chủ động bơm; thư viện Realtime thật (tự nối lại,
   heartbeat, giới hạn presence) không chạy. Media (voice, chia sẻ màn hình, WebRTC) không phủ — kiểm tay hai thiết bị thật (TEST §11.3).
3. **Service worker bị chặn** → không kiểm hành vi cache/`sw.js` (nợ cache là việc riêng, cổng preview vẫn đỏ).
4. **Edge Function AI/TURN** không gọi thật. `turn-creds` được trả danh sách ICE rỗng (hiện chưa triển khai theo CLAUDE.md).
5. **Chromium headless một phiên bản**, không phải Safari/iPhone/Firefox; font hệ thống Windows. Ảnh chuẩn chỉ đúng với môi trường này
   (manifest ghi phiên bản Chromium); đổi môi trường là đổi chuẩn.
6. `tjwl_*` khóa ghi trong `sessionStorage` bởi harness: `__a0_loads` (đếm lần nạp trang để đổi hạt giống).

## Quy ước

- Đáp án đúng luôn suy từ fixture (nghĩa ↔ từ), **không** đọc cờ đúng/sai app tự chấm; kết quả kiểm bằng dữ liệu đã lưu (localStorage hoặc
  bảng backend giả) và DOM, không bằng số lần click.
- Phòng game luôn là `ZZ_A0_ROOM`; backend giả ghi vi phạm MP-15 nếu có truy vấn `game_rooms.code=TJ`, kênh `game:TJ` hay đường dẫn
  `lib/_tmp/TJ/…`; kịch bản `mp15_counterproof` chứng minh bảo vệ này hoạt động.
- Không nới ngưỡng, không retry che chập chờn: chập chờn phải tìm nguyên nhân (xem "Phát hiện khi làm").
- Ảnh/nhật ký lần đầu là **candidate baseline để review**; thay chuẩn đã có theo TEST §1.3.

## Kết quả (lần chạy đầy đủ cuối; chi tiết ở `report.json`)

Nhánh `feat/restructure-plan` ở `b5887ea` (mã app **không đổi** so với baseline `e324beb`; runner kiểm bằng `git diff`). Chromium 156.0.8078.4, Playwright 1.64.0, Python 3.12.10.

| Hạng mục | Kết quả |
|---|---|
| Kịch bản | 18 kịch bản, **214/214 assertion đạt trên baseline VÀ trên nhánh** (7 lệnh chờ thành công ghi riêng ở `waits`, không tính là assertion); bằng chứng quan sát (dữ liệu đã lưu, nhật ký lời gọi dạng chuẩn) giống hệt giữa hai nguồn |
| Cách ly mạng | 0 request ngoài khai báo ở mọi context; phản chứng `NET-01` (Supabase thật, miền lạ, WebSocket) và `NET-02` (Worker, SharedWorker, RTCPeerConnection, sendBeacon, iframe, EventSource) bị chặn và hiện trong báo cáo. Worker/RTC không tạo được (init script ghi đè); Chromium chạy với chính sách WebRTC `disable_non_proxied_udp` |
| Đúng nguồn | baseline `e324beb`, sạch; mã nạp thực tế trùng blob git HEAD của từng nguồn; phản chứng: tệp sửa tay chưa commit bị phát hiện |
| Phản chứng bộ kiểm | 7/7 lỗi cài vào **bản chép** mã app làm kịch bản tương ứng FAIL (đối chứng xanh trên bản chép chưa sửa); 2 trong 7 là lỗi QA độc lập từng làm sống sót (`last_reviewed_at`, `game_answers.correct`), nay đã có assertion bắt |
| Ảnh | 16 ảnh (8 màn × `1280×800` và `390×844`), **hai lượt độc lập giống hệt từng byte, baseline = nhánh, không mask**; khớp `shots-candidate/` |
| Tái lập | hai lượt đầy đủ độc lập cho `report.json` giống hệt từng byte (và một lượt kịch bản-riêng khớp phần kịch bản) |

Ma trận ID → kịch bản: xem `report.json` (`scenarios[].ids`). **Một ID có kịch bản đạt KHÔNG có nghĩa phủ hết yêu cầu của TEST**: QA độc lập (2026-10-22)
chỉ ra bản đầu ghi 'đã phủ' quá tay. Phần CHƯA phủ của từng ID nằm ở `coverage.py` `PARTIAL` và `report.json.partialCoverage` (DB-05, DB-06, DB-07, FLW-15,
SRS-01, LS-01, CALL-G01/G02, MP-01, MP-04, FLW-07). Ví dụ: DB-05 chỉ phủ bấm ⭐ → `bookmarked=true`, chưa phủ mặc định của batch '⭐ Từ đã lưu'; CALL-G01/G02
dùng phòng seed sẵn nên chưa phủ 'host tạo phòng/chọn chủ đề' và 'người chơi rời phòng'; SRS-01 chưa phủ demote và trạng thái 💎.

**Lỗi QA độc lập cài vào mà bộ kiểm hiện VẪN KHÔNG bắt** (`report.json.survivingMutationsFromIndependentQA`): bỏ điều kiện 'user có dòng tiến trình' ở mặc định ⭐
(Q2); quy tắc gỡ khỏi Fix ở tầng WordSet (Q5); host bỏ qua `hello` (Q7, chưa điều tra vì sao MP-04 vẫn xanh); bỏ khử trùng id câu trả lời (Q8).

## Phát hiện khi làm

**Lỗi của chính harness do phản chứng bắt được (đã sửa, nếu không bộ kiểm sẽ xanh giả):**
1. `Math.random` gieo cùng hạt giống ở MỖI lần nạp trang ⇒ host tải lại ra **cùng mã tab** như bản cũ ⇒ nhánh "nhường host" không bao giờ chạy ⇒ MP-03 không
   bắt được lỗi QA cũ (bỏ khối `d.relay` mà vẫn xanh). Sửa: hạt giống đổi theo số lần nạp trang; MP-03 chủ động giữ `relay` tới sau khi host đã lên vai.
2. Broker giả giữ presence "ma" của trang đã tải lại; máy chủ Realtime thật gỡ ngay khi socket đóng. Sửa: gỡ thành viên khi trang điều hướng/đóng.
3. Ảnh dao động ±1–6 mức màu ở vài pixel góc bo tròn (raster đa luồng). Sửa bằng cờ Chromium (tắt GPU/LCD text/partial raster, hinting none, sRGB), không mask.
4. `socketserver` mặc định hàng đợi 5 ⇒ đôi khi `ERR_CONNECTION_REFUSED`; `wait_for_function` poll bằng `requestAnimationFrame` đôi khi treo ⇒ poll theo khoảng.
5. So nhật ký theo thứ tự toàn cục là sai với TEST §5 (nhánh song song): nay giữ thứ tự **trong cùng nhóm kênh+đối tượng**, so nhóm như tập hợp; realtime chỉ so tập (thao tác, sự kiện, khóa payload), không đếm nhịp.

**Quan sát về app (chỉ ghi nhận, KHÔNG sửa — ngoài phạm vi cycle này):**
- Bộ đếm "📚 đã thuộc / tổng" trên thanh trên cùng không cập nhật khi đang ở màn Chi tiết Block (đã thuộc 10 từ vẫn "0 / 38"), chỉ đúng sau khi tải lại. Có thể là thiết kế.
- Tải lại trang mở lại đúng Block + tab đang học dở (`tjwl_last_block_v1` = `{blockId, tab}`), không về danh sách.
- Cloud + đăng nhập thật: lúc khởi động app tự `upsert` Hub/Notebook/Section/Page/Batch "Ôn riêng" (`hub_onrieng`…) — có trong nhật ký CALL-W01 (đúng với CLAUDE.md).
- Ở Local mode không có admin nên không có bộ chọn nguồn bài (FLW-07 chỉ kiểm được ở Cloud).
- Ván game chạy theo **thời gian** (≈25 câu cho 10 từ, từ lặp lại), không dừng ở 10 câu.

## Điều cần PO quyết định (tác động người dùng / phương án / đề xuất)

1. **Chạy `supabase-js` thật?** Hiện Cloud mode dùng bản giả ở ranh giới thư viện, nên chưa chứng minh được URL/header/mã hóa truy vấn thật. Cần `npm pack @supabase/supabase-js@2.45.4`
   (tải gói, theo anchor phải hỏi riêng). *Không đổi gì với người dùng.* Đề xuất: cho phép trước khi làm M1.4 (chuyển 119 điểm gọi của `game.js`), vì khi đó sai khác URL/header mới là rủi ro thật.
2. **Duyệt ảnh và nhật ký candidate** (`shots-candidate/`, `report.json`): mới là quan sát đầu tiên, chưa là chuẩn. Đề xuất: xem 16 ảnh rồi duyệt, hoặc nêu ảnh cần sửa.
3. M0.8/CI vẫn chờ G2 `handoff/gate`; nợ cache vẫn làm `node tests/a0/static.js . --current --preview` đỏ (đúng quyết định trước, không thuộc cycle này).
