# Trạng thái kiểm chéo (Claude ghi 2026-11-02)
- **02, 03:** Codex kiểm 2 vòng, còn lại chỉ P2 (không P0/P1); vòng 3 Codex không đọc được file (lỗi quyền ổ mạng) nên chưa có ACCEPT chính thức.
- **01:** Codex không ghi được file lên ổ mạng (PermissionDenied) nên AGY viết thay; AGY chỉ kiểm được 3 vòng khi file chưa có → chưa có kiểm độc lập hợp lệ cho 01. Claude đã tự đối chiếu 3 phát hiện then chốt với mã: RLS `shared_all using(true)` (tools/game_schema.sql:61-67), `checkQuota` bỏ qua khi thiếu userId (gemini-proxy/index.ts:81-82), mã phòng sinh phía client (js/game.js:1183).
- Số giá/giới hạn (Supabase/Gemini/OpenAI) do AGY tự ghi VERIFIED; Claude chưa mở lại nguồn → coi là UNVERIFIED cho tới khi kiểm.

# Ràng buộc từ Thảo (2026-11-03)
**Tạm thời KHÔNG thay đổi nhà cung cấp.** Giữ nguyên Supabase (DB/Realtime/Edge Functions), Gemini + OpenAI qua `gemini-proxy`/`openai-proxy`, GitHub Pages, Cloudflare (R2/TURN) như hiện tại. Mọi phương án/pha phải nằm trong các nhà cung cấp này. Nâng gói trong cùng nhà cung cấp (ví dụ Supabase Pro) vẫn cần Thảo duyệt riêng, không tự coi là đã được phép.
