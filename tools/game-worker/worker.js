/* Cloudflare Worker "tj-game": phát file ÂM THANH NGHE của game (bucket R2 `tj-game`, thư mục listening/).
   Thay cho đường Supabase Storage cũ  /storage/v1/object/public/toeic/listening/<file>.mp3  (xem js/config.js: AUDIO_BASE).

   CHỈ ĐỌC (GET/HEAD) — không có PUT/DELETE/list, nên không ai ghi hay liệt kê được bucket qua Worker này.
   Chỉ phục vụ đúng đường  /listening/<tên>.mp3  (tên chỉ gồm chữ, số, _ . -).
   Hỗ trợ Range (tua/seek) và If-None-Match (304). CORS mở cho mọi nơi (chỉ là file nghe công khai).

   VÌ SAO LUÔN NẰM TRONG GÓI FREE (đã tính, TJ yêu cầu "free only"):
   - Bucket để PRIVATE, không bật r2.dev, không gắn tên miền -> đường duy nhất vào là Worker này.
   - Worker gói Free chặn cứng 100.000 request/ngày/tài khoản (quá thì lỗi, KHÔNG tính tiền)
     => tối đa ~3,1 triệu lượt đọc R2/tháng, thấp hơn nhiều mức miễn phí 10 triệu Class B.
   - Worker không ghi/liệt kê => 0 thao tác Class A. Băng thông ra (egress) của R2 miễn phí.
   - Dung lượng cố định ~400 MB / 10 GB miễn phí.
   Triển khai: xem tools/game-worker/README.md. Binding: BUCKET = bucket `tj-game`. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,HEAD,OPTIONS",
  "access-control-allow-headers": "range,if-none-match",
  "access-control-expose-headers": "content-length,content-range,accept-ranges,etag",
  "access-control-max-age": "86400",
};
const PATH_OK = /^\/listening\/([A-Za-z0-9_.-]+\.mp3)$/;

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("method not allowed", { status: 405, headers: CORS });
    const m = PATH_OK.exec(new URL(req.url).pathname);
    if (!m) return new Response("not found", { status: 404, headers: CORS });
    const key = "listening/" + m[1];

    const o = req.method === "HEAD" ? await env.BUCKET.head(key) : await env.BUCKET.get(key, { range: req.headers, onlyIf: req.headers });
    if (!o) return new Response("not found", { status: 404, headers: CORS });

    const h = new Headers(CORS);
    o.writeHttpMetadata(h);
    h.set("etag", o.httpEtag);
    h.set("accept-ranges", "bytes");
    h.set("cache-control", "public, max-age=604800");
    if (!h.get("content-type")) h.set("content-type", "audio/mpeg");

    if (req.method === "HEAD") { h.set("content-length", String(o.size)); return new Response(null, { status: 200, headers: h }); }
    if (!o.body) return new Response(null, { status: 304, headers: h }); // If-None-Match khớp
    let status = 200;
    if (req.headers.get("range") && o.range) {
      const off = o.range.offset || 0, len = o.range.length != null ? o.range.length : o.size - off;
      h.set("content-range", "bytes " + off + "-" + (off + len - 1) + "/" + o.size);
      h.set("content-length", String(len));
      status = 206;
    } else h.set("content-length", String(o.size));
    return new Response(o.body, { status, headers: h });
  },
};
