// openai-proxy — gọi OpenAI hộ client, giữ OPENAI_API_KEY server-side
// (Supabase secret) — y hệt lý do/cấu trúc gemini-proxy (xem file đó),
// áp dụng cho OpenAI: TJ yêu cầu 2026-09-13 "nhả quyền tạo từ mới/dán
// cho user dùng chung key của mình, cho OpenAI vào luôn" + "cất trong
// supabase được không" — trước đây OPENAI_API_KEY chỉ nằm trong
// js/keys.local.js (gitignore, KHÔNG lên git, nhưng vì vậy CŨNG chỉ máy
// nào tự chép file đó mới gọi được OpenAI — user khác/web live không có).
// Giờ chuyển hẳn sang proxy này để MỌI USER (không chỉ máy TJ) đều gọi
// được OpenAI qua key chung, không ai cần biết giá trị key thật nữa.
//
// Client (context.js _callOpenAI) gọi hàm này bằng:
//   POST {SUPABASE_URL}/functions/v1/openai-proxy
//   headers: { Authorization: "Bearer <SUPABASE_ANON_KEY>", apikey: "<SUPABASE_ANON_KEY>" }
//   body: { model, sys, user, user_id, block_id }
// và nhận lại NGUYÊN VẸN response JSON + status code của OpenAI — client
// tự parse y hệt như khi gọi thẳng OpenAI trước đây, không đổi format gì.
//
// Deploy (cần Supabase CLI đã `supabase login`):
//   supabase secrets set OPENAI_API_KEY=<key thật> --project-ref pqarpszsipbdugrumhfy
//   supabase functions deploy openai-proxy --project-ref pqarpszsipbdugrumhfy --no-verify-jwt
//
// Dùng CHUNG 1 quota "3 Block AI/ngày cho user thường" với gemini-proxy —
// checkQuota() bên dưới đọc bảng ai_usage_daily KHÔNG lọc theo provider,
// nên 1 lượt Gemini + 1 lượt OpenAI trong cùng ngày cho cùng 1 Block chỉ
// tính là ĐÃ DÙNG 1 Block (không phải cấp thêm hạn mức riêng cho từng nhà
// cung cấp) — hợp lý vì OpenAI tốn tiền thật, càng không nên nới thêm.

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NON_ADMIN_DAILY_BLOCK_CAP = 3;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function sb(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
  });
  return res;
}

// Y hệt checkQuota() trong gemini-proxy/index.ts — xem ghi chú ở đó.
// Cố tình KHÔNG lọc theo provider khi đếm usedBlockIds -> quota CHUNG cho
// cả 2 nhà cung cấp (xem ghi chú đầu file).
async function checkQuota(userId: string | null, blockId: string | null): Promise<{ blocked: boolean; message?: string }> {
  if (!userId || !blockId || !SERVICE_ROLE_KEY || !SUPABASE_URL) return { blocked: false };

  try {
    const profRes = await sb(`profiles?id=eq.${encodeURIComponent(userId)}&select=is_admin`);
    const profRows = profRes.ok ? await profRes.json() : [];
    const isAdmin = !!(profRows[0] && profRows[0].is_admin);
    if (isAdmin) return { blocked: false };

    const today = new Date().toISOString().slice(0, 10);
    const usedRes = await sb(`ai_usage_daily?user_id=eq.${encodeURIComponent(userId)}&date_key=eq.${today}&select=block_id`);
    const usedRows = usedRes.ok ? await usedRes.json() : [];
    const usedBlockIds: string[] = usedRows.map((r: { block_id: string }) => r.block_id);

    if (usedBlockIds.indexOf(blockId) < 0 && usedBlockIds.length >= NON_ADMIN_DAILY_BLOCK_CAP) {
      return {
        blocked: true,
        message: `Tài khoản thường chỉ được nhờ AI viết bài cho tối đa ${NON_ADMIN_DAILY_BLOCK_CAP} Block khác nhau mỗi ngày — đã dùng đủ hôm nay, thử lại vào ngày mai hoặc nhờ Admin.`,
      };
    }
    return { blocked: false };
  } catch (_e) {
    return { blocked: false };
  }
}

// 2026-09-14: nhận thêm usage token (prompt/completion/total) từ response
// OpenAI để CỘNG DỒN vào dòng user/block/ngày đã có (không ghi đè) — 1
// Block có thể được nhờ viết lại nhiều lần/ngày dù chỉ tính 1 "lượt" quota,
// nên phải đọc dòng cũ (nếu có) rồi cộng thêm, không thể dùng thẳng
// "resolution=merge-duplicates" (nó GHI ĐÈ toàn bộ cột trùng khoá, không
// cộng). Âm thầm bỏ qua mọi lỗi — KHÔNG được làm hỏng response OpenAI đã
// trả về, ghi log usage chỉ là "cố gắng tốt nhất".
async function recordUsage(
  userId: string | null,
  blockId: string | null,
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
) {
  if (!userId || !blockId || !SERVICE_ROLE_KEY || !SUPABASE_URL) return;
  const dateKey = new Date().toISOString().slice(0, 10);
  const pIn = usage?.prompt_tokens || 0;
  const pOut = usage?.completion_tokens || 0;
  const pTot = usage?.total_tokens || (pIn + pOut);
  try {
    const existingRes = await sb(
      `ai_usage_daily?user_id=eq.${encodeURIComponent(userId)}&block_id=eq.${encodeURIComponent(blockId)}&date_key=eq.${dateKey}&select=call_count,prompt_tokens,completion_tokens,total_tokens`,
    );
    const existingRows = existingRes.ok ? await existingRes.json() : [];
    const prev = existingRows[0] || { call_count: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    await sb("ai_usage_daily", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: userId, block_id: blockId, date_key: dateKey, provider: "openai",
        call_count: (prev.call_count || 0) + 1,
        prompt_tokens: (prev.prompt_tokens || 0) + pIn,
        completion_tokens: (prev.completion_tokens || 0) + pOut,
        total_tokens: (prev.total_tokens || 0) + pTot,
      }),
    });
  } catch (_e) { /* không chặn response vì lỗi ghi log */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed, dùng POST" }, 405);
  if (!OPENAI_KEY) return json({ error: "OPENAI_API_KEY chưa được đặt (supabase secrets set)" }, 500);

  let body: { model?: string; sys?: string; user?: string; user_id?: string | null; block_id?: string | null; temperature?: number };
  try {
    body = await req.json();
  } catch (_e) {
    return json({ error: "Body phải là JSON hợp lệ {model, sys, user}" }, 400);
  }

  const model = body.model || "gpt-4o-mini";
  const sys = body.sys || "";
  const user = body.user || "";
  const userId = body.user_id || null;
  const blockId = body.block_id || null;
  // 2026-09-14: cho client tự truyền temperature (vd Context.generateFrameworkAnalysis
  // dùng thấp hơn để JSON schema phức tạp/nhiều phần tử ra đúng đủ, đã test thật
  // 0.9 làm model bỏ sót phần tử mảng "frameworks" dù chỉ thị "ĐÚNG 7") — KHÔNG đổi
  // mặc định 0.9 cho các lệnh gọi cũ (generateAI/extractVocab) không truyền field này.
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.9;
  if (!user) return json({ error: "Thiếu field 'user' (nội dung yêu cầu gửi cho AI)" }, 400);

  const quota = await checkQuota(userId, blockId);
  if (quota.blocked) return json({ error: quota.message, kind: "quota_user" }, 403);

  const upstreamBody = JSON.stringify({
    model,
    temperature,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
      body: upstreamBody,
    });
    const text = await res.text();
    if (res.ok) {
      let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
      try { usage = JSON.parse(text)?.usage; } catch (_e) { /* body không phải JSON hợp lệ -> bỏ qua usage, vẫn trả response gốc */ }
      await recordUsage(userId, blockId, usage);
    }
    // Trả NGUYÊN status + body của OpenAI — client (_callOpenAI) đã có sẵn
    // logic parse choices[0].message.content + usage token, giữ proxy càng
    // "trong suốt" càng ít chỗ để lệch hành vi so với gọi thẳng trước đây.
    return new Response(text, {
      status: res.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return json({ error: "openai-proxy: lỗi gọi upstream OpenAI — " + String(e) }, 502);
  }
});
