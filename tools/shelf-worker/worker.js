/* Cloudflare Worker "tj-shelf": kệ sách của Bảng (WordLoop game) trên R2 bucket `tj-shelf`.
   Chỉ là kho THAM KHẢO — mọi thứ game cần nằm ở Supabase. Không cần khoá: bucket gắn thẳng vào Worker (binding BUCKET).
   Giới hạn cứng để luôn nằm trong gói free: 25 MB/file, tổng 2 GB. */
const MAX_FILE = 25 * 1024 * 1024, MAX_TOTAL = 2 * 1024 * 1024 * 1024, PH = ".emptyFolderPlaceholder";
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" };
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: Object.assign({ "content-type": "application/json" }, CORS) });
const clean = (p) => { p = decodeURIComponent(p || "").replace(/^\/+|\/+$/g, ""); if (p.split("/").some((x) => x === ".." || x === ".")) throw new Error("bad path"); return p; };

async function listAll(env, prefix, delim) {
  let out = { objects: [], dirs: [] }, cursor;
  do {
    const opt = { prefix, limit: 1000 }; if (delim) opt.delimiter = delim; if (cursor) opt.cursor = cursor;
    const r = await env.BUCKET.list(opt);
    out.objects = out.objects.concat(r.objects); out.dirs = out.dirs.concat(r.delimitedPrefixes || []);
    cursor = r.truncated ? r.cursor : null;
  } while (cursor);
  return out;
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    try {
      const u = new URL(req.url), path = u.pathname;
      if (path === "/list" && req.method === "GET") {
        const p = clean(u.searchParams.get("prefix")), pre = p ? p + "/" : "";
        const r = await listAll(env, pre, "/"), items = [];
        r.dirs.forEach((d) => items.push({ name: d.slice(pre.length).replace(/\/$/, ""), dir: true }));
        r.objects.forEach((o) => { const n = o.key.slice(pre.length); if (n && n !== PH) items.push({ name: n, dir: false, size: o.size }); });
        return json({ items });
      }
      if (path === "/folders" && req.method === "GET") {
        const r = await listAll(env, "", null), set = {};
        r.objects.forEach((o) => { const parts = o.key.split("/"); parts.pop(); let acc = ""; parts.forEach((x, i) => { if (i < 3) { acc = acc ? acc + "/" + x : x; set[acc] = 1; } }); });
        return json({ folders: Object.keys(set).filter((f) => f.split("/").pop()[0] !== "." && f.split("/").pop()[0] !== "_").sort() });
      }
      if (path.startsWith("/file/")) {
        const key = clean(path.slice(6));
        if (!key) return json({ error: "thiếu đường dẫn" }, 400);
        if (req.method === "GET") {
          const o = await env.BUCKET.get(key);
          if (!o) return json({ error: "không thấy file" }, 404);
          const h = new Headers(CORS); o.writeHttpMetadata(h); h.set("etag", o.httpEtag); h.set("cache-control", "public, max-age=300");
          return new Response(o.body, { headers: h });
        }
        if (req.method === "PUT") {
          const len = Number(req.headers.get("content-length") || 0);
          if (!len || len > MAX_FILE) return json({ error: "file quá lớn (tối đa 25 MB)" }, 413);
          const r = await listAll(env, "", null); let total = 0; r.objects.forEach((o) => { total += o.size; });
          if (total + len > MAX_TOTAL) return json({ error: "kệ đã đầy (2 GB)" }, 507);
          await env.BUCKET.put(key, req.body, { httpMetadata: { contentType: req.headers.get("content-type") || "application/octet-stream" } });
          return json({ ok: true });
        }
        if (req.method === "DELETE") { await env.BUCKET.delete(key); return json({ ok: true }); }
      }
      if (path === "/mkdir" && req.method === "POST") {
        const b = await req.json(), p = clean(b.path);
        if (!p) return json({ error: "thiếu tên thư mục" }, 400);
        await env.BUCKET.put(p + "/" + PH, new Uint8Array(0)); return json({ ok: true });
      }
      if (path === "/move" && req.method === "POST") {
        const b = await req.json(), a = clean(b.from), c = clean(b.to);
        const o = await env.BUCKET.get(a);
        if (!o) return json({ error: "không thấy file" }, 404);
        await env.BUCKET.put(c, o.body, { httpMetadata: o.httpMetadata }); await env.BUCKET.delete(a);
        return json({ ok: true });
      }
      return json({ error: "không có đường này" }, 404);
    } catch (e) { return json({ error: String((e && e.message) || e) }, 500); }
  },
};
