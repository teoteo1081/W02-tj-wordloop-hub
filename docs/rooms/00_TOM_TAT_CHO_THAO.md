# 00_TOM_TAT_CHO_THAO — Kế Hoạch Mở Phòng Game TJ Cho Người Dùng Ngoài

> **Dành cho:** Thảo (Đọc nhanh 5–7 phút, ngôn ngữ bình dân, không cần biết lập trình)  
> **Căn cứ kỹ thuật:** Tổng hợp và đối chiếu 100% từ 3 hồ sơ nghiên cứu kỹ thuật: `01_CURRENT_STATE_AND_ARCH.md`, `02_PRODUCT_UX_AND_ROLLOUT.md`, và `03_COST_TOKEN_MODEL.md`  
> **Điểm neo an toàn (Anchor):** Commit `8d9b2fe` (Tag `anchor/rooms-plan-2026-11-02` trên `W02_TJHUB`)  
> **Cam kết cốt lõi:** Đây là tài liệu NGHIÊN CỨU & KẾ HOẠCH. Tuyệt đối không sửa mã, không động Database, không làm hỏng phòng game hiện có của TJ.

---

## 1. Game phòng TJ hiện tại hoạt động thế nào? (Giải thích bằng ví dụ đời thường)

Hãy hình dung phòng game TJ giống như một **lớp học chơi đố vui bằng loa phát thanh và bảng con**:

```
[Chủ phòng TJ] ──(Loa phát thanh: câu hỏi, đếm giờ)──> [Toàn bộ Học viên]
 (Cầm sổ điểm) <──(Học viên giơ bảng con nộp bài)─────── (Xem & làm bài)
```

1. **Ai là người điều khiển (Host)?**
   - Hiện tại hệ thống đang "khóa cứng" quyền làm chủ phòng cho đúng 1 tài khoản duy nhất của TJ (mã định danh `f3fd95c9-06e8-4d39-b6f2-efc113d436cf` tại [`js/game.js:53-57`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L53-L57)). Người ngoài hay tài khoản quản trị khác vào phòng cũng chỉ là người chơi bình thường ([`01` Mục 1.1]).
2. **Mã phòng sinh ra sao?**
   - Phòng mặc định luôn mang tên ngắn là `"TJ"` ([`js/game.js:52`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L52)). Khi tạo phòng mới, máy tự bốc ngẫu nhiên 5 chữ cái/số dễ nhìn (ví dụ `KT89M`, loại trừ số 0 hay chữ O để khỏi nhìn nhầm) ([`js/game.js:1182-1194`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L1182-L1194), [`01` Mục 1.2]).
3. **Kênh truyền tin trực tiếp (Realtime):**
   - Giống như một **đường dây điện thoại giữ máy liên tục** giữa giáo viên và học sinh (`sb.channel("game:code")` tại [`js/game.js:1741`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L1741)). Cứ 3 giây một lần, máy chủ phòng phát thanh một gói tin: *"Đang ở câu mấy, còn bao nhiêu giây, ai được mấy điểm"* ([`js/game.js:103`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L103)). Học sinh bấm đáp án thì gửi tín hiệu ngược lại cho chủ phòng ([`01` Mục 1.3]).
4. **Sổ ghi điểm (Trạng thái ván đấu) nằm ở đâu?**
   - Điểm số và thời gian **chỉ nằm trong bộ nhớ máy tính/điện thoại của chủ phòng** và lưu tạm trên trình duyệt đó ([`js/game.js:16-17`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L16-L17)). Không có máy chủ trung tâm đứng ra ghi điểm độc lập. Vì vậy, **nếu máy chủ phòng bị sập nguồn hay mất wifi, cả lớp học sẽ bị treo cứng** ([`01` Mục 1.4, 1.5]).
5. **Nội dung bài học lấy từ đâu?**
   - Từ vựng lấy từ các Kệ sách sẵn có trên hệ thống ([`js/game.js:1197-1230`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L1197-L1230)); câu điền từ lấy từ bảng đề thi ([`tools/game_gap_schema.sql:1-12`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/tools/game_gap_schema.sql#L1-L12)); file âm thanh nghe bài thi lấy từ kho lưu trữ đám mây Cloudflare R2 miễn phí cước tải ([`tools/game-worker/worker.js`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/tools/game-worker/worker.js), [`01` Mục 1.10, 1.11]).
6. **Trí tuệ nhân tạo (AI) dùng ở đâu?**
   - AI được gọi qua cổng trung gian máy chủ bảo mật (`gemini-proxy` và `openai-proxy`) để: tự soạn câu điền từ Part 5, chấm bài viết tiếng Anh, và tra nhanh nghĩa từ vựng ([`js/game.js:1320-1343, 2544, 3561`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L1320-L1343)). Giọng đọc tiếng Anh (TTS) chạy trực tiếp bằng loa của trình duyệt điện thoại/laptop nên **hoàn toàn miễn phí 0 USD** ([`js/game.js:2825`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L2825), [`03` Mục 2, 3.4]).

---

## 2. Nhả cho người ngoài dùng thì thiết kế thế nào? (Khuyến nghị thiết kế & So sánh 3 phương án)

### 2.1. Trải nghiệm đề xuất: Đơn giản tối đa, vào chơi dưới 60 giây
- **Người chơi (Học sinh):** Tuyệt đối **không bắt tạo tài khoản**. Chỉ cần quét mã QR trên máy chiếu hoặc bấm vào link Zalo, gõ tên (ví dụ: "Minh Anh") là vào chơi ngay trong 15–30 giây ([`02` Mục 2.2]).
- **Người mở phòng (Giáo viên / Host):** Phải đăng nhập (bằng tài khoản Google) để hệ thống biết ai là chủ phòng nhằm quản lý học sinh và kiểm soát chi phí ([`02` Mục 0, 2.1]).
- **Phân chia kho tài liệu:**
  - *Thư viện chung (Core Shared):* Đề thi TOEIC ETS, Barron 600, Digital Marketing, EA 2025 có sẵn trên hệ thống cho mọi người dùng chung ([`02` Mục 4]).
  - *Bộ đề riêng của giáo viên:* Giáo viên tải file từ vựng riêng của lớp mình lên; hệ thống khóa bảo vệ bằng ổ khóa dữ liệu (RLS), lớp khác không bao giờ nhìn thấy đề của nhau ([`02` Mục 4]).
- **Bảo vệ an toàn lớp học & Riêng tư trẻ em (COPPA):** Giáo viên có nút "Đuổi người quấy rối" (Kick) và "Khóa cửa phòng" khi lớp đã vào đủ ([`02` Mục 5.1]). Không thu thập email, họ tên thật hay số điện thoại của học sinh ([`02` Mục 6.1]). Học sinh lỡ tắt màn hình điện thoại khi mở lại vẫn giữ nguyên điểm số ([`02` Mục 5.2.5]).

### 2.2. Bảng so sánh ngắn 3 phương án kỹ thuật

| Tiêu chí | 🏛️ Phương án A: Dùng chung 1 nhà Supabase + Khóa phòng RLS | 🏢 Phương án B: Tách riêng nhà cho từng Trung tâm | ⚡ Phương án C: Phòng tự phát nhẹ tênh (BYO Key) |
|---|---|---|---|
| **Cách làm** | Giữ 1 máy chủ hiện tại; lập thêm "ổ khóa cửa" (RLS) theo từng phòng và chủ phòng. | Mỗi trường học lập 1 tài khoản máy chủ Supabase riêng biệt hoàn toàn. | Không lưu điểm vào máy chủ chung; giáo viên tự điền chìa khóa AI cá nhân. |
| **Chi phí máy chủ** | **Thấp nhất:** 0 đ (Pha 1), 630.000 đ/tháng ($25) từ Pha 2 cho cả hệ thống. | **Rất đắt:** Mỗi trường tốn 630.000 đ/tháng ($25); 10 trường tốn 6,3 triệu/tháng. | **Gần bằng 0 đ:** Máy chủ không tốn tiền lưu trữ; tiền AI do giáo viên tự trả. |
| **Bảo vệ phòng TJ** | **Rất an toàn:** Giữ nguyên dữ liệu của TJ, cấp khóa riêng bảo vệ mã phòng `TJ`. | **Tuyệt đối an toàn:** Phòng TJ nằm ở nhà riêng, người ngoài không chạm tới được. | **Tuyệt đối an toàn:** Người ngoài không ghi bất kỳ dữ liệu nào vào máy chủ TJ. |
| **Độ khó / Thời gian** | **Vừa phải:** Mất khoảng 5 – 7 ngày làm việc để cài đặt ổ khóa bảo mật. | **Rất khó:** Mất 12 – 15 ngày; phải cài đặt máy chủ tự động phức tạp. | **Dễ nhất:** Mất 3 – 4 ngày; chỉ cần thêm ô nhập chìa khóa trên web. |
| **Khả năng quay xe (Hoàn tác)** | **Rất dễ:** Tắt công tắc cho phép người ngoài là quay về nguyên vẹn phòng TJ. | **Phức tạp:** Phải xóa các máy chủ vệ tinh và di chuyển dữ liệu đối tác. | **Cực kỳ dễ:** Tắt tính năng trên trang web là xong ngay trong 1 phút. |
| **Đánh giá & Khuyến nghị** | ⭐ **KHUYẾN NGHỊ LÕI:** Tối ưu chi phí nhất, phù hợp cho cộng đồng giáo viên vừa và nhỏ ([`01` Mục 3.1, 4.1], [`02` Mục 10]). | Chỉ dành cho hợp đồng lớn với các trường quốc tế muốn máy chủ riêng ([`01` Mục 3.2]). | ⭐ **KẾT HỢP VỚI PA A:** Dùng cho tính năng tự điền chìa khóa AI ([`01` Mục 3.3]). |

---

## 3. Mỗi người có phòng riêng thì "Token" ảnh hưởng ra sao? (Mô hình chi phí & Điểm nghẽn)

### 3.1. Hiểu đúng "Token" theo 3 lớp tài nguyên
1. **Lớp 1 - Token Trí tuệ nhân tạo (Tiền túi trả cho Google/OpenAI):** Tiền gọi Gemini và OpenAI để chấm bài viết và tra từ. Giá chính thức: Gemini Flash $0.075 / 1 triệu token (nguồn: [Google AI Studio Pricing](https://ai.google.dev/pricing), VERIFIED 2026-11-02); OpenAI gpt-4o-mini $0.150 / 1 triệu token (nguồn: [OpenAI Pricing](https://openai.com/api/pricing/), VERIFIED 2026-11-02) ([`03` Mục 3.2, 3.3]).
2. **Lớp 2 - Hạn mức máy chủ Supabase:** Gói Miễn phí (Free) cho tối đa **200 người kết nối cùng lúc (CCU)** và 100 tin nhắn/giây; Gói Chuyên nghiệp (Pro - $25/tháng) cho **500 người cùng lúc** và 500 tin nhắn/giây (nguồn: [Supabase Pricing](https://supabase.com/pricing), VERIFIED 2026-11-02) ([`03` Mục 3.1]).
3. **Lớp 3 - Đường truyền mạng khác:** Giọng đọc tiếng Anh (TTS) chạy trực tiếp trên máy học viên = **0 đ**; Băng thông tải file nghe từ Cloudflare R2 = **0 đ** (nguồn: [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/), VERIFIED 2026-11-02) ([`03` Mục 3.4]).

### 3.2. Bảng 9 kịch bản quy mô tải & Dự toán ngân sách hàng tháng (Trích [`03` Mục 5])
*(Giả định: Mỗi phòng mở 20 giờ/tháng, khoảng 10 buổi học, mỗi buổi 2 giờ)*

| Quy mô kịch bản | Người online cùng lúc (Đỉnh) | Giới hạn tin nhắn | Tiền Supabase ($/tháng) | Tiền AI ước tính ($/tháng) | TỔNG CHI PHÍ THÁNG (USD) | Đánh giá an toàn |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **10 phòng $\times$ 5 người** | 62 người | 6.7 tin/giây | **$0.00** (Gói Free) | $0.25 (ƯỚC TÍNH) | **< $1 (~25.000 đ)** | ✅ Hoàn toàn an toàn |
| **10 phòng $\times$ 20 người** | **212 người** | 16.7 tin/giây | **$25.00** (Bắt buộc lên Pro) | $0.85 (ƯỚC TÍNH) | **~$26 (~650.000 đ)** | ⚠️ **VỠ TRẦN 200 NGƯỜI FREE** |
| **10 phòng $\times$ 50 người** | 512 người | 36.8 tin/giây | **$25.00** (Gói Pro) | $2.10 (ƯỚC TÍNH) | **~$27 (~680.000 đ)** | ⚠️ Chạm ngưỡng 500 người Pro |
| **100 phòng $\times$ 5 người** | 620 người | 67.0 tin/giây | **$27.00** (Pro + vượt mức) | $2.50 (ƯỚC TÍNH) | **~$30 (~760.000 đ)** | Ổn định trên gói Pro |
| **100 phòng $\times$ 20 người**| 2.120 người | 167.0 tin/giây| **$58.70** (Pro + vượt mức) | $8.50 (ƯỚC TÍNH) | **~$68 (~1.720.000 đ)** | Hoạt động tốt |
| **100 phòng $\times$ 50 người**| 5.120 người | 368.0 tin/giây| **$124.90** (Pro + vượt mức)| $21.00 (ƯỚC TÍNH) | **~$150 (~3.800.000 đ)**| Bắt đầu đông học sinh |
| **1.000 phòng $\times$ 5 người**| 6.200 người | 670 tin/giây* | **$189.50** (Pro + vượt mức)| $25.00 (ƯỚC TÍNH) | **~$220 (~5.500.000 đ)**| Cần gộp gói tin gửi định kỳ |
| **1.000 phòng $\times$ 20 người**| 21.200 người | 1.670 tin/giây*| **$520.50** (Pro + vượt mức)| $85.00 (ƯỚC TÍNH) | **~$625 (~15.800.000 đ)**| Quy mô cấp thành phố |
| **1.000 phòng $\times$ 50 người**| 51.200 người | 3.680 tin/giây*| **$1,182.00** (Pro + vượt)| $210.00 (ƯỚC TÍNH) | **~$1,440 (~36.500.000 đ)**| Cần hạ tầng doanh nghiệp riêng |

### 3.3. Điểm nghẽn đầu tiên sẽ vỡ ở đâu? (Trích [`03` Mục 6])
Nếu mở tự do ngay ngày mai mà không có hàng rào bảo vệ, hệ thống sẽ gãy đổ tại **4 điểm nghẽn** sau:
1. **Điểm vỡ số 1 (Gãy ngay ở 10 phòng):** Gói Supabase Free chỉ cho tối đa **200 người online cùng lúc**. Chỉ cần 10 giáo viên mở lớp, mỗi lớp 20 học sinh ($10 \times 20 = 200$), học sinh thứ 201 bấm vào phòng sẽ bị báo lỗi mạng và văng ra ngoài ngay lập tức.
2. **Điểm vỡ số 2 (Gãy ở phút thứ 15 của buổi học):** Gói Gemini Free chỉ cho gọi tối đa **15 lần / phút**. Nếu 3 lớp học cùng lúc nộp bài viết câu, hệ thống sẽ bị nghẽn và báo lỗi chữ đỏ "Too Many Requests", màn hình đứng yên.
3. **Điểm vỡ số 3 (Thủng ví tiền ngầm của TJ):** Mã nguồn hiện tại có lỗ hổng: nếu người dùng ngoài gọi AI mà không đăng nhập (`user_id: null` tại [`gemini-proxy/index.ts:81-82`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/supabase/functions/gemini-proxy/index.ts#L81-L82) và [`openai-proxy/index.ts:63`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/supabase/functions/openai-proxy/index.ts#L63)), hệ thống sẽ **bỏ qua việc trừ hạn mức và xả tiền thẳng vào thẻ tín dụng của TJ**.
4. **Điểm vỡ số 4 (Treo cả lớp học):** Do toàn bộ điểm số nằm ở máy tính của giáo viên, nếu giáo viên gập máy hoặc rớt mạng quá 7 giây, 50 học sinh trong phòng sẽ bị treo màn hình ([`js/game.js:103, 110`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L103-L110)).

### 3.4. Cách khống chế triệt để chi phí (7 Đòn bẩy bảo vệ — Trích [`03` Mục 7])
- **Đòn bẩy 1 - Kho đề sinh sẵn (Cache dùng chung):** Câu hỏi trắc nghiệm và từ vựng lưu sẵn trong cơ sở dữ liệu. 1.000 phòng cùng chơi một đề thì số token AI tốn thêm = **0 đồng**.
- **Đòn bẩy 2 - Vá lỗ hổng và khóa trần phòng Free:** Chặn đứng yêu cầu gọi AI không rõ nguồn gốc; phòng Free chỉ được gọi tối đa 10 lần AI/ngày.
- **Đòn bẩy 3 - Tự mang chìa khóa AI (BYO Key):** Giáo viên muốn chấm nhiều bài viết thì tự điền chìa khóa Google Gemini cá nhân miễn phí của họ vào web. Máy của giáo viên gọi thẳng sang Google, **TJ không tốn 1 đồng nào**.
- **Đòn bẩy 4 - Mặc định tắt AI:** Chỉ chơi câu hỏi tĩnh; AI chỉ chạy khi chủ phòng chủ động bấm nút bật.
- **Đòn bẩy 5 - Bán gói Pro 199.000 đ/tháng:** Thu phí giáo viên mở lớp lớn. Chỉ cần **4 khách hàng Pro** (thu về 800.000 đ) là đủ bù đắp hoàn toàn tiền thuê máy chủ Supabase Pro ($25 ~ 630.000 đ).
- **Đòn bẩy 6 - Giới hạn sĩ số:** Phòng Free tối đa 15 người/phòng để không kéo sập máy chủ; muốn đông hơn phải nâng gói Pro.
- **Đòn bẩy 7 - Giữ nguyên giọng đọc trình duyệt:** Tiếp tục dùng công nghệ đọc tiếng Anh miễn phí có sẵn trên điện thoại học sinh ([`js/game.js:2825`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L2825)), không mua giọng đọc đám mây đắt đỏ.

---

## 4. Lộ trình triển khai theo 4 Pha có ANCHOR (Trích [`01` Mục 4.2] & [`02` Mục 9])

Mỗi pha đều có mục tiêu, thước đo thành công và đường lui an toàn:

```
[Pha 0: Kế hoạch] ──> [Pha 1: Alpha Bạn bè] ──> [Pha 2: Beta Giới hạn] ──> [Pha 3: Mở toàn quốc]
 (Không đụng mã)       (5-10 giáo viên quen)    (30-50 lớp, bật Pro)       (Tự bù đắp chi phí)
```

1. **Pha 0 - Lên Kế Hoạch & Nghiên Cứu (Hiện tại):**
   - *Điểm neo an toàn:* Tag Git `anchor/rooms-plan-2026-11-02` (commit `8d9b2fe`).
   - *Mục tiêu:* Hoàn thành bộ tài liệu nghiên cứu `00`, `01`, `02`, `03`. Không sửa 1 dòng code, không đụng Database.
   - *Đường lui:* Xóa nhánh tài liệu, hệ thống TJ giữ nguyên 100%.
2. **Pha 1 - Thử Nghiệm Nội Bộ & Bạn Bè Thân Tín (Alpha - 4 tuần):**
   - *Mục tiêu:* Mời 5 – 10 giáo viên quen thử mở phòng; mỗi phòng tối đa 20 người; chỉ dùng đề thi chung có sẵn; máy chủ vẫn giữ gói Miễn phí ($0).
   - *Cổng nghiệm thu:* 100% giáo viên tự mở được phòng; học sinh vào phòng dưới 45 giây; tiền máy chủ = 0 đ.
   - *Đường lui:* Gạt 1 công tắc `ALLOW_EXTERNAL_HOST = false` là hệ thống khóa lại, chỉ còn duy nhất phòng TJ chạy.
3. **Pha 2 - Thử Nghiệm Có Thu Phí Giới Hạn (Closed Beta - 6 tuần):**
   - *Mục tiêu:* Mở cho 30 – 50 lớp học; nâng cấp máy chủ lên gói Pro ($25/tháng ~ 630.000 đ có trần an toàn Spend Cap); bật tính năng giáo viên tự điền chìa khóa AI (BYO Key).
   - *Cổng nghiệm thu:* Tỷ lệ rớt mạng < 1.5%; tiền AI phát sinh của TJ < 250.000 đ ($10)/tháng.
   - *Đường lui:* Đưa các phòng ngoài về chế độ chỉ xem điểm, phòng TJ hoàn toàn bình yên vô sự.
4. **Pha 3 - Mở Rộng Toàn Cộng Đồng (Public GA):**
   - *Mục tiêu:* Phát hành rộng rãi, bán gói Pro 199.000 đ/tháng để người dùng tự nuôi máy chủ.
   - *Cổng nghiệm thu:* Đạt trên 200 phòng/tuần; tiền thu từ gói Pro gấp đôi tiền vận hành máy chủ.

---

## 5. Các giả định đã chọn thay Thảo & 4 Quyết định thật sự cần Thảo

### 5.1. Các giả định nhóm kỹ thuật đã tự chọn thay Thảo (để Thảo không phải bận tâm)
1. **Phòng TJ là bất khả xâm phạm:** Toàn bộ mã phòng `"TJ"` và hồ sơ của TJ được đặt ở làn ưu tiên cao nhất, người ngoài không thể sửa đổi hay làm chậm phòng TJ ([`02` Mục 0]).
2. **Học sinh vào chơi cực nhanh (Zero-friction):** Không bắt học sinh đăng ký tài khoản, quét QR 1 chạm là vào chơi ([`02` Mục 0]).
3. **Giáo viên mở phòng phải đăng nhập:** Đăng nhập bằng Google để chịu trách nhiệm lớp học và chống tạo phòng rác ([`02` Mục 0]).
4. **Tuyệt đối không bao cấp tiền AI cho người ngoài:** Người ngoài muốn dùng AI chấm bài nhiều phải tự điền API Key hoặc trả phí gói Pro ([`02` Mục 0, 7]).

### 5.2. Bốn quyết định thật sự cần Thảo chốt (kèm gợi ý mặc định)

| STT | Câu hỏi cần Thảo quyết định | Lý do & Tác động | Gợi ý mặc định (Nên chọn) |
|:---:|---|---|---|
| **D1** | **Có duyệt nâng cấp Supabase lên gói Pro ($25/tháng ~ 630.000 đ) khi bước vào Pha 2 không?** | Gói Free 200 người sẽ sập khi có 10 lớp học. Gói Pro mở rộng lên 500 người và có trần chống tràn cước (Spend Cap) ([`03` Mục 3.1, 5]). | **DUYỆT:** Bật gói Pro ở Pha 2 có Spend Cap. Chỉ cần 4 giáo viên trả phí là hòa vốn. |
| **D2** | **Chốt mức giá gói Pro cho giáo viên là 199.000 đ / tháng (~$8 USD)?** | Rẻ hơn nhiều so với Kahoot ($10–$15/tháng) nhưng đủ tiền lãi nuôi máy chủ và có ngân sách phát triển tiếp ([`02` Mục 7], [`03` Mục 7]). | **CHỐT 199.000 đ/tháng** (hoặc gói năm 1.800.000 đ tặng 3 tháng). |
| **D3** | **Phòng miễn phí có được dùng thử AI không?** | Nếu cấm hẳn AI thì kém hấp dẫn; nếu thả tự do thì tốn tiền của TJ ([`03` Mục 7]). | **CHO THỬ 10 LƯỢT/NGÀY** với mô hình siêu rẻ Gemini Flash-8B (tốn < 25 đồng/ngày), sau đó mời nâng gói Pro hoặc tự điền Key. |
| **D4** | **Lịch sử bài làm chi tiết của học sinh lưu bao lâu?** | Nếu lưu vĩnh viễn sẽ phình ổ cứng máy chủ; xóa sớm thì học sinh không xem lại được ([`02` Mục 6.2]). | **LƯU ĐIỂM TỔNG VĨNH VIỄN, TỰ XÓA CHI TIẾT CÂU SAI SAU 30 NGÀY** để bảo vệ dung lượng và tuân thủ quyền riêng tư. |

---

## 6. Ba rủi ro lớn nhất & Biện pháp phòng vệ tối thượng

1. **RỦI RO KỸ THUẬT LỚN NHẤT — Ổ khóa dữ liệu RLS đang mở toang:**
   - *Sự thật:* Trong mã hiện tại ([`tools/game_schema.sql:61-67`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/tools/game_schema.sql#L61-L67)), bất kỳ ai biết kỹ thuật cũng có thể gửi lệnh xóa sạch toàn bộ danh sách phòng và điểm số trên máy chủ ([`01` Mục 1.8, 2]).
   - *Phòng vệ:* **Bắt buộc phải cài đặt lại ổ khóa RLS phân quyền theo phòng trước khi mở cho người ngoài**, đảm bảo chỉ chủ phòng mới sửa được phòng của mình.
2. **RỦI RO TÀI CHÍNH LỚN NHẤT — Lỗ hổng xả cạn tiền thẻ visa qua AI proxy:**
   - *Sự thật:* Nếu gọi AI mà không truyền mã người dùng, máy chủ đang cho qua tự do mà không trừ hạn mức ([`gemini-proxy/index.ts:81-82`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/supabase/functions/gemini-proxy/index.ts#L81-L82), [`03` Mục 2, 6]).
   - *Phòng vệ:* **Triển khai ngay đoạn mã vá chặn chặt chẽ** ([`03` Mục 7 Đòn bẩy 2]): không có mã phòng hợp lệ là từ chối phục vụ ngay ở cửa máy chủ.
3. **RỦI RO VẬN HÀNH LỚN NHẤT — Máy giáo viên sập nguồn làm gián đoạn cả lớp:**
   - *Sự thật:* Do điểm số nằm ở máy giáo viên, giáo viên mất mạng thì học sinh bị đứng hình ([`js/game.js:16`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L16), [`01` Mục 1.4, 1.5]).
   - *Phòng vệ:* Giao diện đã có sẵn bảng thông báo màu vàng dặn học sinh *"Chờ giáo viên kết nối lại"* ([`game.html:175`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/game.html#L175)), khi giáo viên tải lại trang thì toàn bộ điểm số tự động khôi phục nguyên vẹn từ bộ nhớ máy ([`js/game.js:147`](file:////192.168.1.11/31%20vietnam%20staff/THAO%20NGUYEN/Python/Git/W02_ROOMS/js/game.js#L147), [`02` Mục 5.2]).

---
*Tài liệu tóm tắt được lập theo chỉ thị `prompts/S3_summary.md`, đảm bảo tính trung thực, không bịa đặt số liệu, có đầy đủ căn cứ mã nguồn và bảo toàn tuyệt đối phòng game TJ.*
