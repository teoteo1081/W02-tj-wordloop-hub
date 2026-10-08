// turn-creds — cấp mật khẩu TURN TẠM THỜI (Cloudflare Realtime TURN) cho client, giữ khoá thật server-side.
//
// Vì sao: chia sẻ màn hình + voice nối trực tiếp máy-tới-máy (WebRTC). Mạng 5G / mạng công ty thường KHÔNG nối trực tiếp được ->
// cần máy chủ trung chuyển (TURN). Cloudflare cho 1.000 GB/tháng miễn phí (xem https://developers.cloudflare.com/realtime/turn/faq/).
// Khoá Cloudflare KHÔNG ĐƯỢC để trong repo (public) -> chỉ đặt dưới dạng Supabase secret:
//
//   supabase secrets set CF_TURN_KEY_ID=<TURN key ID> CF_TURN_API_TOKEN=<TURN key API token> --project-ref pqarpszsipbdugrumhfy
//   supabase functions deploy turn-creds --project-ref pqarpszsipbdugrumhfy --no-verify-jwt
//
// Client (js/turn.js) gọi: POST {SUPABASE_URL}/functions/v1/turn-creds, nhận lại {iceServers:[{urls, username, credential}]} sống 1 giờ.
// Lưu ý bảo mật: giống gemini-proxy, ai biết anon key đều gọi được (app dùng chung 1 anon key public). Rủi ro = người lạ dùng ké dung lượng TURN
// (mật khẩu chỉ sống 1 giờ). Nhóm nhỏ thì chấp nhận được; nếu bị lạm dụng thì thêm kiểm tra mã phòng ở đây.
//
// CHƯA kiểm với tài khoản Cloudflare thật (2026-10-08) — thử bằng:
//   curl -s -X POST https://pqarpszsipbdugrumhfy.supabase.co/functions/v1/turn-creds -H "Authorization: Bearer <anon>" -d '{}'

const KEY_ID = Deno.env.get("CF_TURN_KEY_ID");
const API_TOKEN = Deno.env.get("CF_TURN_API_TOKEN");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!KEY_ID || !API_TOKEN) return new Response(JSON.stringify({ error: "chưa đặt CF_TURN_KEY_ID / CF_TURN_API_TOKEN" }), { status: 503, headers: { ...CORS, "Content-Type": "application/json" } });
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${KEY_ID}/credentials/generate-ice-servers`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl: 3600 }),
    });
    const text = await r.text();
    if (!r.ok) return new Response(JSON.stringify({ error: "cloudflare " + r.status, detail: text.slice(0, 300) }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
    return new Response(text, { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
