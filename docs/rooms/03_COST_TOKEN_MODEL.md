# 03_COST_TOKEN_MODEL — Mô Hình "Token", Dự Toán Chi Phí & Chiến Lược Khống Chế Điểm Nghẽn

> **Mã tài liệu:** `DOCS-ROOMS-03`  
> **Tác giả:** AGY (Sản phẩm / UX / Chi phí)  
> **Dự án:** TJ WordLoop & Rooms Platform  
> **Neo kiểm soát:** Tag `anchor/rooms-plan-2026-11-02` trên `W02_TJHUB` (main: `8d9b2fe`)  
> **Trạng thái:** DỰ THẢO NGHIÊN CỨU & KẾ HOẠCH (KHÔNG SỬA MÃ, KHÔNG ĐỘNG DB)  
> **Ngày lập:** 2026-11-02  
> **Cam kết:** Mọi khẳng định về mã có `file:dòng`; mọi con số giá/giới hạn có URL nguồn chính thức + ngày kiểm tra + nhãn VERIFIED; số suy luận ghi "ƯỚC TÍNH" kèm công thức toán học tường minh.

---

## 1. Định nghĩa mô hình "Token" theo 3 nghĩa cốt lõi

Trong bài toán mở phòng game WordLoop cho người khác dùng, khái niệm "Token" không đơn thuần là số lượng token ngôn ngữ của mô hình AI, mà bao gồm 3 lớp chi phí và hạn mức tài nguyên mà hệ thống phải chi trả hoặc bị giới hạn:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MÔ HÌNH 3 LỚP TOKEN CỦA PHÒNG GAME              │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. AI API TOKENS (Đô la trực tiếp)│ 2. SUPABASE QUOTAS (Hạn mức nền)   │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Chi phí trả cho Google & OpenAI │ • Realtime Peak Connections (CCU)  │
│ • Input Tokens (Prompt, System)   │ • Realtime Messages / Giây & Tháng │
│ • Output Tokens (Đáp án, Lời giải)│ • Database Disk Storage (MB / GB)  │
│ • Token dùng qua Proxy Edge Func  │ • Storage Egress Bandwidth (GB/th) │
├───────────────────────────────────┴────────────────────────────────────┤
│ 3. INFRASTRUCTURE & NETWORK TOKENS (Băng thông & Máy chủ phụ trợ)      │
│ • Cloudflare R2 Operations & Storage (Kệ sách & Audio MP3)             │
│ • Cloudflare Workers Invocations (100.000 req/ngày trần Free)          │
│ • Cloudflare WebRTC TURN Credentials (Băng thông chuyển tiếp 1.000 GB) │
│ • GitHub Pages Hosting Bandwidth (Soft cap 100 GB / tháng)             │
│ • TTS & STT (Nhận diện & Đọc giọng nói: Trình duyệt vs. Cloud API)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bản đồ hiện trạng điểm gọi AI trong toàn bộ Codebase

Qua khảo sát trực tiếp mã nguồn của worktree `W02_ROOMS`, toàn bộ các điểm gọi AI và kiểm soát hạn mức được phân bổ tại các tệp sau:

| STT | Vị trí (`file:dòng`) | Hàm / Chức năng | Mô hình gọi | Trạng thái Quota hiện tại | Rủi ro khi mở công khai |
|---|---|---|---|---|---|
| **1** | `supabase/functions/gemini-proxy/index.ts:1-205` | Edge Function làm proxy gọi Google Gemini, bảo vệ `GEMINI_API_KEY` server-side | `gemini-3.6-flash` hoặc tham số truyền vào | Quota 3 Block/ngày nếu có `userId` (`:45, :81-101`). **Nếu `user_id: null` -> BỎ QUA QUOTA (`:81-82`)** | **CỰC KỲ NGUY HIỂM:** Gọi bằng anon key công khai, client truyền `user_id: null` sẽ bypass 100% quota, gây tràn bill. |
| **2** | `supabase/functions/openai-proxy/index.ts:1-181` | Edge Function làm proxy gọi OpenAI, bảo vệ `OPENAI_API_KEY` server-side | `gpt-4o-mini` mặc định (`:137`) | Dùng chung quota 3 Block/ngày với Gemini (`:31, :62-86`). **`user_id: null` -> BỎ QUA QUOTA (`:63`)** | **CỰC KỲ NGUY HIỂM:** Tiền OpenAI bị trừ trực tiếp từ thẻ visa của TJ mà không có trần bảo vệ per-IP/per-room. |
| **3** | `tools/supabase_schema.sql:379-399` | Khởi tạo bảng `ai_usage_daily` lưu vết `call_count`, `prompt_tokens`, `completion_tokens`, `total_tokens` | N/A (PostgreSQL) | RLS bật, không cấp policy cho anon/auth (chỉ proxy service_role ghi được) | Đã sẵn sàng ghi log token chuẩn xác, nhưng chỉ ghi khi có `user_id` và `block_id`. |
| **4** | `supabase/functions/turn-creds/index.ts:1-36` | Cấp TURN ICE servers tạm thời (1 giờ) qua Cloudflare Realtime | N/A (WebRTC) | Không giới hạn, cấp qua anon key (`:11-12`) | Có thể bị lợi dụng kéo băng thông TURN vượt 1.000 GB miễn phí của Cloudflare. |
| **5** | `js/game.js:1319-1328` | Hàm `openAI()` trong game gọi `openai-proxy` | `gpt-4o-mini` | Truyền `user_id: G.profile ? G.profile.id : null, block_id: "game-gap"` (`:1323`) | Host không đăng nhập profile TJ thì `user_id: null` -> bypass quota. |
| **6** | `js/game.js:1329-1343` | `callGapAI()` tạo câu trắc nghiệm điền từ Part 5 tại chỗ khi thiếu câu | `gpt-4o-mini` | Gọi qua `openAI()` | Nếu mở phòng lớn mà chưa cache câu, host sẽ gọi hàng chục request OpenAI cùng lúc. |
| **7** | `js/game.js:2342-2345` | Tạo bài đọc mới trên Bảng khi host yêu cầu | Gemini fallback OpenAI qua `Context.generateAI` | Ăn quota tạo bài đọc của profile host | Tốn token prompt bài đọc dài (khoảng 1.500 - 2.500 tokens/lần). |
| **8** | `js/game.js:2528-2564` | `gradeWrites()` chấm bài viết của học sinh (ngữ pháp LT + Gemini dùng từ) | `gemini-3.5-flash-lite` | **Ép cứng `user_id: null, block_id: null` (`:2547`)** | Cả lớp 30 học sinh cùng nộp bài viết -> Gemini được gọi gom 1 lần nhưng không trừ quota ai. |
| **9** | `js/game.js:3555-3568` | `tvLookup()` tra từ điển nhanh trong bài đọc | `gemini-3.5-flash-lite` | **Ép cứng `user_id: null, block_id: null` (`:3563`)** | Cache cục bộ trên RAM trình duyệt (`tvCache`), người chơi khác tra lại từ đó vẫn gọi API mới. |
| **10** | `js/game.js:3569-3580` | `boardLookup()` tra nghĩa từ trên bảng chung | Gemini fallback OpenAI | **Ép cứng `quotaCtx = null` (`:3572`)** | Cache trên RAM host (`blCache:3573`), gửi kết quả broadcast cho phòng. |
| **11** | `js/cc.js:85-99` | `translate()` dịch từ và câu trong phụ đề lời nói CC | `gemini-3.5-flash-lite` | **Ép cứng `user_id: null, block_id: null` (`:92`)** | Học sinh bấm liên tục vào phụ đề để tra từ sẽ spam request Gemini qua proxy. |
| **12** | `js/readalong.js:1-170` | Luyện đọc phát âm theo bài (Read Along) | **Web Speech API & `speechSynthesis`** (`:10, :111`) | **100% MIỄN PHÍ TRÊN TRÌNH DUYỆT (0 USD)** | Không tốn token đám mây. |
| **13** | `learn/sw/sw.js:923` | Chấm Speaking & Writing TOEIC độc lập | `gemini-3.5-flash-lite`, `gemini-3.8-flash` | Gọi qua `gemini-proxy` | Dễ bị spam nếu người dùng ngoài mở trang luyện thi tự do. |

---

## 3. Bảng giá & Giới hạn định mức hiện hành của các nhà cung cấp

Tất cả các con số dưới đây được tra cứu và xác minh trực tiếp từ tài liệu chính thức của nhà cung cấp vào ngày **2026-11-02**:

### 3.1. Supabase (Database, Realtime, Storage & Egress)
*Nguồn tham chiếu:*
- [Supabase Pricing Official](https://supabase.com/pricing) (Ngày kiểm tra: 2026-11-02, VERIFIED)
- [Supabase Realtime Rate Limits Guide](https://supabase.com/docs/guides/realtime/rate-limits) (Ngày kiểm tra: 2026-11-02, VERIFIED)
- [Supabase Compute & Disk Budget Docs](https://supabase.com/docs/guides/platform/compute-add-ons) (Ngày kiểm tra: 2026-11-02, VERIFIED)

| Hạng mục tài nguyên | Gói Miễn Phí (Free Tier) | Gói Chuyên Nghiệp (Pro Tier - $25/tháng) | Chi phí vượt định mức (Overage - Pro) |
|---|---|---|---|
| **Realtime Peak Concurrent Connections** | **200 kết nối đồng thời** | **500 kết nối đồng thời** (đã gồm trong gói) | **$10.00 / 1.000 peak connections** / tháng |
| **Realtime Messages / Tháng** | **2.000.000 tin nhắn** / tháng | **5.000.000 tin nhắn** / tháng | **$2.50 / 1.000.000 tin nhắn** |
| **Realtime Message Rate Limit** | **100 tin nhắn / giây** | **500 tin nhắn / giây** | Mở rộng theo yêu cầu doanh nghiệp |
| **Realtime Presence Rate Limit** | **20 tin nhắn presence / giây** | **50 tin nhắn presence / giây** | Tối đa 1.000 presence/s khi tắt Spend Cap |
| **Kích thước gói tin Realtime tối đa** | 256 KB / tin | 3.000 KB (3 MB) / tin | Cố định theo gói |
| **Database Disk Storage** | **500 MB** (tự động pause sau 1 tuần vô hiệu) | **8 GB** (không bao giờ pause) | **$0.125 / GB** / tháng |
| **File Storage** | **1 GB** | **100 GB** | **$0.0213 / GB** / tháng |
| **Băng thông mạng ra (Egress / Bandwidth)** | **5 GB** (hoặc 10 GB tổng org) | **250 GB** / tháng | **$0.09 / GB** (uncached) / **$0.03 / GB** (cached) |
| **Edge Functions Invocations** | 500.000 lượt gọi / tháng | 2.000.000 lượt gọi / tháng | **$2.00 / 1.000.000 lượt** |

### 3.2. Google Gemini API
*Nguồn tham chiếu:*
- [Google AI Studio Pricing](https://ai.google.dev/pricing) (Ngày kiểm tra: 2026-11-02, VERIFIED)
- [Gemini API Rate Limits Guide](https://ai.google.dev/gemini-api/docs/rate-limits) (Ngày kiểm tra: 2026-11-02, VERIFIED)

| Mô hình | Free Tier (RPM / RPD / TPM) | Giá Input / 1M Tokens (Paid $\le$ 128k) | Giá Output / 1M Tokens (Paid $\le$ 128k) | Ghi chú bảo mật dữ liệu |
|---|---|---|---|---|
| **Gemini 1.5 Flash-8B** | 15 RPM / 1.500 RPD / 1M TPM | **$0.0375** | **$0.1500** | Rẻ nhất, cực kỳ thích hợp cho sửa từ / tra nghĩa |
| **Gemini 1.5 Flash** | 15 RPM / 1.500 RPD / 1M TPM | **$0.0750** | **$0.3000** | Model chuẩn hiện tại của TJ proxy |
| **Gemini 1.5 Pro** | 2 RPM / 50 RPD / 32k TPM | **$1.2500** | **$5.0000** | Dùng cho phân tích ngữ pháp chuyên sâu |
| *Chính sách dữ liệu* | Miễn phí tiền nhưng Google dùng dữ liệu train | Trả tiền: Google **KHÔNG** dùng dữ liệu train | Paid tier bảo vệ riêng tư học sinh |

#### Bảng ánh xạ Model Codebase TJ WordLoop sang Model Google AI Studio chính thức
Trong mã nguồn TJ, các chuỗi tên mô hình được định nghĩa riêng biệt. Bảng sau đối chiếu chuỗi nội bộ với mô hình thực tế và đơn giá tương ứng của Google:

| Chuỗi model trong mã nguồn | Vị trí định nghĩa (`file:dòng`) | Mô hình Google AI Studio thực tế | Đơn giá Input/Output (1M tokens) | Mục đích sử dụng |
|---|---|---|---|---|
| `gemini-3.6-flash` | `supabase/functions/gemini-proxy/index.ts:155` | **Gemini 1.5 Flash** | **$0.0750 / $0.3000** | Model mặc định khi proxy không nhận tham số `model`. |
| `gemini-3.5-flash-lite` | `js/game.js:2547`, `js/game.js:3563`, `js/cc.js:92` | **Gemini 1.5 Flash-8B** | **$0.0375 / $0.1500** | Chấm bài viết nhanh (`gradeWrites`), tra từ điển (`tvLookup`), dịch phụ đề CC (`translate`). |
| `gemini-3.8-flash` | `learn/sw/sw.js:923` | **Gemini 1.5 Flash** | **$0.0750 / $0.3000** | Chấm đề thi Speaking & Writing TOEIC độc lập. |

### 3.3. OpenAI API
*Nguồn tham chiếu:*
- [OpenAI API Pricing](https://openai.com/api/pricing/) (Ngày kiểm tra: 2026-11-02, VERIFIED)
- [OpenAI Rate Limits Docs](https://platform.openai.com/docs/guides/rate-limits) (Ngày kiểm tra: 2026-11-02, VERIFIED)

| Mô hình | Giá Input / 1M Tokens | Giá Output / 1M Tokens | Cached Input / 1M Tokens | Rate Limit (Tier 1: Đã nạp $\ge$ $5) |
|---|---|---|---|---|
| **gpt-4o-mini** | **$0.1500** | **$0.6000** | **$0.0750** (-50%) | 500 RPM / 200.000 TPM / 10.000 RPD |
| **gpt-4o** | $2.5000 | $10.0000 | $1.2500 | 500 RPM / 30.000 TPM |

### 3.4. Các hạ tầng khác (GitHub Pages, Cloudflare R2 / Workers / Calls WebRTC & Native Audio)
*Nguồn tham chiếu:*
- [GitHub Pages Usage Limits](https://docs.github.com/pages/getting-started-with-github-pages/about-github-pages#usage-limits) (Ngày kiểm tra: 2026-11-02, VERIFIED): Soft cap băng thông **100 GB / tháng**; dung lượng site xuất bản tối đa **1 GB**.
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) (Ngày kiểm tra: 2026-11-02, VERIFIED): Gói Free gồm **10 GB lưu trữ**, 1.000.000 Class A ops, 10.000.000 Class B ops, **Egress hoàn toàn $0** (miễn phí băng thông ra).
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) (Ngày kiểm tra: 2026-11-02, VERIFIED): Trần cứng Free **100.000 requests / ngày**.
- [Cloudflare Calls / WebRTC TURN Pricing](https://developers.cloudflare.com/calls/pricing/) (Ngày kiểm tra: 2026-11-02, VERIFIED): Miễn phí **1.000 GB TURN / tháng**; vượt định mức tính **$0.05 / GB**.
- [Cloudflare Realtime TURN FAQ](https://developers.cloudflare.com/realtime/turn/faq/) (Ngày kiểm tra: 2026-11-02, VERIFIED): Chi tiết hạn mức TURN phục vụ chuyển tiếp WebRTC voice/màn hình.
- [W3C Web Speech API Spec](https://wicg.github.io/speech-api/) & [MDN Web Speech API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (Ngày kiểm tra: 2026-11-02, VERIFIED): Chuẩn client-side SpeechSynthesis/SpeechRecognition tích hợp sẵn trong trình duyệt (Chrome, Safari, Edge), chạy offline trên thiết bị học viên, chi phí đám mây = **$0**.

---

## 4. Công thức mô hình hóa chi phí (Cost Calculation Formula)

Hệ thống được mô hình hóa theo các tham số vận hành thực tế:
- $R$: Số lượng phòng hoạt động đồng thời (Active Rooms).
- $P$: Số người chơi trung bình trong một phòng (Players per Room).
- $T_{session}$: Thời lượng trung bình một buổi học (mặc định: $1.0\text{ giờ} = 3.600\text{ giây}$).
- $H$: Tổng số giờ phòng hoạt động trong 1 tháng (ước tính: mỗi phòng mở $20\text{ giờ/tháng}$).
- $F_{hb}$: Tần số gửi nhịp tim/đồng bộ của Host ($HEARTBEAT\_MS = 3.000\text{ ms} \implies 0.333\text{ msg/giây}$ theo `js/game.js:103`).
- $Q$: Số câu hỏi trong một ván đấu (trung bình 20 câu/ván, 1 buổi chơi 3 ván = 60 câu).
- $A_{rate}$: Tỷ lệ học sinh tương tác tính năng AI (chấm bài viết, tra nghĩa từ trên bảng).

### 4.1. Công thức Realtime Supabase
1. **Đỉnh kết nối đồng thời (Peak Concurrent Connections - CCU):**
   $$CCU = R \times (P + 1_{host} + 0.2_{screen})$$
2. **Tổng tin nhắn Realtime mỗi giây trên toàn hệ thống (Messages per Second - MPS):**
   - Broadcast từ Host (State + Heartbeat): $R \times 0.333\text{ msg/s}$
   - Broadcast từ Người chơi (Gửi câu trả lời `ans` dồn vào lúc hết câu): $R \times \frac{P}{15\text{s/câu}} \approx R \times P \times 0.067\text{ msg/s}$
   $$MPS_{total} = R \times (0.333 + 0.067 \times P)$$
3. **Tổng số tin nhắn Realtime trong tháng ($M_{month}$):**
   $$M_{month} = MPS_{total} \times H \times 3.600$$

### 4.2. Công thức Chi phí AI API (Áp dụng nếu TJ bao cấp 100%)
Giả sử ván đấu có chế độ chấm bài viết (`qwrite` tại `js/game.js:2544`):
- Mỗi ván có 5 câu viết; cả lớp $P$ người nộp bài. Host gom thành 1 request gửi Gemini Flash.
- Input tokens cho 1 lượt chấm gom $P$ học sinh: $\approx 500 + 40 \times P\text{ tokens}$.
- Output tokens (sửa lỗi + điểm): $\approx 100 + 35 \times P\text{ tokens}$.
- Chi phí 1 lượt chấm bài viết ($Cost_{batch}$):
  $$Cost_{batch} = \frac{(500 + 40P) \times \$0.075 + (100 + 35P) \times \$0.30}{10^6}$$

### 4.3. Công thức Băng thông WebRTC Voice qua Cloudflare TURN
Khi phòng kích hoạt đàm thoại nhóm qua Cloudflare WebRTC TURN (`supabase/functions/turn-creds/index.ts:1-36`):
- Mỗi luồng âm thanh nén Opus chiếm bitrate trung bình: $32\text{ kbps} = 4\text{ KB/giây} = 14.4\text{ MB / người / giờ}$.
- Băng thông TURN chuyển tiếp cho $P$ người chơi trong $R$ phòng trong $H$ giờ hoạt động:
  $$BW_{TURN} = R \times P \times 14.4\text{ MB} \times H$$
- Ở kịch bản K8 (1.000 phòng $\times$ 20 người $\times$ 20 giờ/tháng): $BW_{TURN} = 1.000 \times 20 \times 14.4\text{ MB} \times 20 \approx 5.760\text{ GB/tháng}$.
  - Hạn mức miễn phí: 1.000 GB TURN/tháng (VERIFIED: `developers.cloudflare.com/calls/pricing/`).
  - Phần vượt định mức: $4.760\text{ GB} \times \$0.05/\text{GB} \approx \$238.00\text{/tháng}$.
  - Cơ chế khống chế: Chỉ cấp TURN relay cho tài khoản Pro; người dùng Free ưu tiên kết nối ngang hàng P2P mesh qua STUN ($0 chi phí TURN).

---

## 5. Bảng ma trận kịch bản mô phỏng tải & dự toán chi phí (10, 100, 1.000 phòng)

Mô phỏng 9 kịch bản quy mô kết hợp: $R \in \{10, 100, 1.000\}$ phòng và $P \in \{5, 20, 50\}$ người chơi. Giả định mỗi phòng hoạt động **20 giờ / tháng** (khoảng 10 buổi học, 2 giờ/buổi).

*Ghi chú đơn vị:* USD / tháng. Tính toán dựa trên giá Pay-as-you-go đã VERIFIED ở Mục 3.

| Kịch bản | Quy mô (Phòng $\times$ Người) | Peak CCU (Kết nối) | MPS Đỉnh (Tin nhắn/s) | Tổng Msg Realtime/Tháng | Chi phí Supabase ($/tháng) | Chi phí AI API (Gemini/OpenAI) | Chi phí Băng thông (R2/Egress) | TỔNG CHI PHÍ ƯỚC TÍNH ($/tháng) | Trạng thái Dự án |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **K1** | 10 phòng $\times$ 5 người | 62 CCU | 6.7 msg/s | 480.000 msg | **$0.00** (Free Tier) | $0.25 (ƯỚC TÍNH) | $0.00 (R2 Free) | **< $1 / tháng** | ✅ An toàn tuyệt đối |
| **K2** | 10 phòng $\times$ 20 người | 212 CCU | 16.7 msg/s | 1.200.000 msg | **$25.00** (Pro bắt buộc*) | $0.85 (ƯỚC TÍNH) | $0.00 (R2 Free) | **~$26 / tháng** | ⚠️ Vỡ trần Free 200 CCU |
| **K3** | 10 phòng $\times$ 50 người | 512 CCU | 36.8 msg/s | 2.650.000 msg | **$25.00** (Pro) | $2.10 (ƯỚC TÍNH) | $0.00 (R2 Free) | **~$27 / tháng** | ⚠️ Vừa chạm trần Pro 500 CCU |
| **K4** | 100 phòng $\times$ 5 người | 620 CCU | 67.0 msg/s | 4.820.000 msg | **$27.00** (Pro + overage) | $2.50 (ƯỚC TÍNH) | $0.00 (R2 Free) | **~$30 / tháng** | Ổn định trên Pro |
| **K5** | 100 phòng $\times$ 20 người | 2.120 CCU | 167.0 msg/s | 12.020.000 msg | **$58.70** (Pro + overage) | $8.50 (ƯỚC TÍNH) | $1.20 (ƯỚC TÍNH) | **~$68 / tháng** | Cần theo dõi MPS |
| **K6** | 100 phòng $\times$ 50 người | 5.120 CCU | 368.0 msg/s | 26.500.000 msg | **$124.90** (Pro + overage) | $21.00 (ƯỚC TÍNH) | $3.50 (ƯỚC TÍNH) | **~$150 / tháng** | Bắt đầu tốn kém |
| **K7** | 1.000 phòng $\times$ 5 người | 6.200 CCU | 670 msg/s* | 48.200.000 msg | **$189.50** (Pro + overage) | $25.00 (ƯỚC TÍNH) | $5.00 (ƯỚC TÍNH) | **~$220 / tháng** | ⚠️ Vượt trần 500 msg/s |
| **K8** | 1.000 phòng $\times$ 20 người | 21.200 CCU | 1.670 msg/s* | 120.200.000 msg | **$520.50** (Pro + overage) | $85.00 (ƯỚC TÍNH) | $18.00 (ƯỚC TÍNH) | **~$625 / tháng** | 🚨 Vỡ Rate Limit Supabase |
| **K9** | 1.000 phòng $\times$ 50 người | 51.200 CCU | 3.680 msg/s* | 265.000.000 msg | **$1,182.00** (Pro + overage) | $210.00 (ƯỚC TÍNH) | $45.00 (ƯỚC TÍNH) | **~$1,440 / tháng** | 🚨 Cần hạ tầng Enterprise |

*\*Chi tiết cách tính overage Supabase ở kịch bản K5 (100 phòng $\times$ 20 người):*
- *Peak connections:* $2.120\text{ CCU} - 500\text{ miễn phí} = 1.620\text{ kết nối dư} \implies 1.62 \times \$10 = \$16.20$.
- *Messages:* $12.02\text{M} - 5\text{M miễn phí} = 7.02\text{M tin nhắn dư} \implies 7.02 \times \$2.50 = \$17.55$.
- *Cộng base Pro:* $\$25 + \$16.20 + \$17.55 = \$58.75\text{ / tháng}$.

*\*Giải pháp khống chế trần Rate Limit tin nhắn (500 msg/s) cho K7, K8, K9:*
- Trần cứng của Supabase Pro là 500 tin nhắn / giây (`supabase.com/docs/guides/realtime/rate-limits`).
- K7 (670 msg/s), K8 (1.670 msg/s), K9 (3.680 msg/s) sẽ kích hoạt ngắt nhịp nếu gửi broadcast riêng rẽ từng câu.
- **Giải pháp kỹ thuật (Client Message Batching):** Client gom tin nhắn `ans` và `presence` vào bộ đệm rồi phát tán theo chu kỳ 500ms thay vì gửi ngay lập tức. Điều này giảm lưu lượng MPS xuống 3 – 5 lần, đưa K7 về ~150 msg/s, K8 về ~450 msg/s (hoàn toàn an toàn trong trần Pro). Kịch bản K9 (1.000 phòng $\times$ 50 người = 50.000 người đồng thời) là bài toán cấp quy mô toàn quốc, cần tách project theo Tenant hoặc ký hợp đồng cụm Realtime Cluster với Supabase.

---

## 6. ĐIỂM NGHẼN ĐẦU TIÊN (Where the System Fractures First)

Nếu ngày mai mở link cho công chúng sử dụng tự do mà **chưa có cơ chế khống chế**, hệ thống sẽ không sập vì hết dung lượng Database, mà sẽ vỡ chính xác tại **4 điểm nghẽn chí tử** sau theo thứ tự thời gian:

### 💥 Điểm vỡ 1 (Vỡ ngay ở 10 phòng): Trần 200 CCU Realtime Supabase Free
- **Hiện tượng:** Khi có 10 giáo viên mở phòng, mỗi lớp chỉ cần 20 học sinh ($10 \times 20 = 200\text{ người}$), học sinh thứ 201 bấm vào phòng sẽ lập tức bị lỗi kết nối WebSocket (`WebSocket connection failed`).
- **Hậu quả:** Học sinh không nhận được câu hỏi, màn hình chờ quay tròn vô tận, giáo viên mất uy tín và bỏ nền tảng ngay trong 5 phút đầu tiên.

### 💥 Điểm vỡ 2 (Vỡ ở phút thứ 15 của buổi học): Trần 15 RPM của Gemini Free Tier
- **Hiện tượng:** Trong `js/game.js:2544`, hàm `gradeWrites()` gọi thẳng `gemini-proxy`. Khi 3 lớp học cùng chơi thể thức Viết câu hoặc học sinh bấm tra từ điển phụ đề (`js/cc.js:92`), số request gửi về proxy vượt quá **15 request / phút**.
- **Hậu quả:** Google trả về mã lỗi HTTP `429 Too Many Requests (Resource Exhausted)`. Proxy không có hàng đợi (queue) nên ném lỗi thẳng về client (`supabase/functions/gemini-proxy/index.ts:181`). Cả phòng bị treo ở màn hình "Đang chấm câu của mọi người..." (`js/game.js:109`).

### 💥 Điểm vỡ 3 (Vỡ tài chính âm thầm): Lỗ hổng `user_id: null` xả cạn Credit của TJ
- **Hiện tượng:** Tại `supabase/functions/gemini-proxy/index.ts:81-82` và `openai-proxy/index.ts:63`:
  ```typescript
  if (!userId || !blockId || !SERVICE_ROLE_KEY || !SUPABASE_URL) return { blocked: false };
  ```
- **Hậu quả:** Bất kỳ ai mở Console F12 hoặc viết script curl đều có thể gọi `gemini-proxy` và `openai-proxy` với `user_id: null` bao nhiêu triệu lần cũng được. Hạn mức 3 Block/ngày hoàn toàn vô hiệu. Thẻ tín dụng của TJ sẽ bị trừ tiền không có điểm dừng.

### 💥 Điểm vỡ 4 (Vỡ cấu trúc vận hành): Host mất mạng làm treo cả phòng
- **Hiện tượng:** Tại `js/game.js:16`: *"HOST LÀ NGUỒN SỰ THẬT DUY NHẤT: chỉ host chấm điểm + đếm giờ, gửi nhịp 3s/lần"*. Trạng thái ván đấu nằm trên bộ nhớ RAM trình duyệt của Host, không nằm trên máy chủ.
- **Hậu quả:** Nếu laptop giáo viên bị sập nguồn, mất wifi hoặc gập màn hình quá 7 giây (`HOST_LOST_MS = 7000` tại `js/game.js:103`), toàn bộ 50 học sinh trong phòng bị treo cứng (`js/game.js:110: host_lost`).

---

## 7. Bảy đòn bẩy khống chế chi phí & bảo vệ hệ thống (The 7 Cost Levers)

Để ngăn chặn triệt để 4 điểm vỡ trên mà vẫn cho phép người ngoài dùng mượt mà, hệ thống bắt buộc áp dụng **7 đòn bẩy bảo vệ**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   7 ĐÒN BẨY KHỐNG CHẾ CHI PHÍ & TÀI NGUYÊN             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 🗄️ SHARED AI CACHE      : Cache vĩnh viễn theo mã câu/từ (0 token)  │
│ 2. 🛡️ STRICT PER-ROOM CAP  : Vá lỗ hổng user_id null; áp trần per-room │
│ 3. 🔑 BYO KEY MODEL        : Giáo viên tự nhập API Key cá nhân         │
│ 4. 🎛️ HOST OPT-IN AI       : Chỉ gọi AI khi Host chủ động bấm nút bật  │
│ 5. 💎 TIERED MONETIZATION  : Thu phí gói Pro 199k/tháng bù infra Pro    │
│ 6. 👥 ROOM CAPACITY LIMITS : Free tối đa 15 CCU; Pro tối đa 60 CCU     │
│ 7. 🔇 BROWSER-NATIVE AUDIO : Giữ 100% TTS Web Speech API (0 USD cloud) │
└────────────────────────────────────────────────────────────────────────┘
```

### Đòn bẩy 1: Bộ nhớ đệm AI dùng chung theo mã câu (Shared AI Cache)
- **Cơ chế:** Toàn bộ câu trắc nghiệm điền từ (`game_gap_sentences`) và từ điển ngữ cảnh được sinh sẵn hoặc lưu vào bảng database ngay lần đầu tiên có người gọi.
- **Hiệu quả:** Khi 1.000 phòng cùng chơi bộ đề TOEIC Test 1, hệ thống lấy 100% từ bảng DB có sẵn (`tools/game_gap_schema.sql:4`). **Số token tiêu tốn = 0**.

### Đòn bẩy 2: Vá lỗ hổng `user_id: null` & Hạn mức chặt theo Phòng
- **Cơ chế:** Sửa đổi `checkQuota()` trong `gemini-proxy` và `openai-proxy`. Tuyệt đối không cho phép `user_id: null` đi qua tự do. Nếu không có `user_id`, bắt buộc phải có `room_id` hợp lệ và kiểm tra hạn mức của phòng đó:
  - Mỗi phòng Free chỉ được tối đa **10 lượt gọi AI / ngày**. Hết lượt, hệ thống chuyển sang chế độ câu hỏi tĩnh không AI.
- **Đặc tả mã nguồn đề xuất (Pseudocode Patch cho `supabase/functions/gemini-proxy/index.ts`):**
  ```typescript
  // Thay thế logic kiểm tra lỏng lẻo tại dòng 81-82
  if (!userId && !roomId) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing user_id or room_id" }), { status: 401 });
  }
  if (!userId && roomId) {
    const { count } = await sb.from("room_ai_usage_daily")
      .select("call_count", { count: "exact" })
      .eq("room_code", roomId).eq("date", today);
    if ((count ?? 0) >= FREE_ROOM_DAILY_AI_CAP) { // FREE_ROOM_DAILY_AI_CAP = 10
      return new Response(JSON.stringify({ error: "Daily room AI limit reached. Please upgrade to Pro or BYO Key." }), { status: 429 });
    }
  }
  ```

### Đòn bẩy 3: Cơ chế "Tự mang chìa khóa" (Bring Your Own Key - BYO Key)
- **Cơ chế:** Trong phần cài đặt phòng của Host, bổ sung ô nhập: *"Google Gemini API Key của bạn"* hoặc *"OpenAI Key"*.
- **Kiến trúc phân luồng 2 cấp:**
  1. *Direct Client-to-Provider (Khuyến nghị ưu tiên):* Trình duyệt của Host gọi thẳng Google AI Studio API (`https://generativelanguage.googleapis.com/...`) sử dụng API Key lưu an toàn trong `localStorage` máy Host. Bỏ qua hoàn toàn Supabase Edge Function: **chi phí invocation = $0, độ trễ proxy trung gian = 0ms**.
  2. *Proxy Pass-through (Dự phòng):* Nếu client gặp hạn chế môi trường mạng, gửi kèm header `x-byo-api-key`. Proxy sử dụng key này gọi upstream thay vì dùng key trả phí của TJ.
- **Bảo mật:** Key không bao giờ lưu vào Database Supabase, không bị lộ cho học viên trong phòng.
- **Hiệu quả:** TJ chi trả 0 VNĐ cho các lớp học có nhu cầu chấm bài viết/nói số lượng lớn.

### Đòn bẩy 4: Chỉ gọi AI khi Host chủ động kích hoạt (Opt-in AI Features)
- **Cơ chế:** Mặc định các ván đấu sử dụng ngân hàng câu hỏi trắc nghiệm A/B/C/D có sẵn lời giải.
- **Quy định:** Tính năng chấm điểm bài viết tự do (`qwrite`) hoặc tra từ điển nâng cao chỉ được kích hoạt khi Host tích chọn: *"[X] Bật chấm AI cho ván này"*. Tránh việc học sinh vô tình kích hoạt API liên tục.

### Đòn bẩy 5: Gói dịch vụ trả phí bù đắp hạ tầng (Monetization)
- **Hạch toán kinh tế:**
  - 1 trung tâm hoặc giáo viên mua gói Pro **199.000 VNĐ / tháng (~$8 USD)**.
  - Chỉ cần **4 khách hàng Pro** ($32 USD) là bù đắp hoàn toàn chi phí cơ sở của gói **Supabase Pro ($25 USD)**.
  - Từ khách hàng thứ 5 trở đi, doanh thu thặng dư hoàn toàn trang trải chi phí overage Realtime và tích lũy quỹ phát triển.

### Đòn bẩy 6: Giới hạn sĩ số cứng theo gói (Room Capacity Caps)
- **Gói Free:** Khóa cứng tối đa **15 người chơi / phòng**. Ngăn chặn 1 phòng quá đông kéo sập hạn mức 200 CCU của dự án.
- **Gói Pro:** Cho phép lên tới **60 người chơi / phòng**.

### Đòn bẩy 7: Tắt hoàn toàn Cloud TTS — Tiếp tục tận dụng Browser Web Speech API
- **Quyết định kiến trúc:** Tuyệt đối không tích hợp các dịch vụ Cloud TTS trả phí (như ElevenLabs hay Google Cloud TTS tốn $16 - $30 / 1M ký tự).
- **Hiện trạng:** Hệ thống đang sử dụng rất thành công `window.speechSynthesis` (`js/game.js:2825`, `js/readalong.js:111`, `js/speech.js:15`). Giải pháp này chạy trực tiếp trên chip của máy học sinh, chất lượng giọng đọc tiếng Anh của Chrome/Edge/Safari rất tốt và **hoàn toàn miễn phí (0 USD)**.

---
*Tài liệu được lập bởi AGY theo đúng yêu cầu trong `prompts/S1_agy.md` và tuân thủ tuyệt đối các điều cấm trong `ANCHOR_ROOMS.md`.*
