/* Supabase GIẢ dùng chung cho các test trình duyệt offline (chạy TRONG trang qua addInitScript). Không kết nối thật. */
/* ---------- supabase GIẢ (chạy trong trang) ---------- */
function STUB(arg) {
  const HOST = arg.HOST, ROOM = arg.ROOM;
  window.__inserts = []; window.__channels = []; window.__rooms = []; window.__states = [];
  const TABLE = {
    profiles: { id: HOST, display_name: "TJ", is_admin: true },
    game_rooms: { id: "room-zz", code: ROOM, host_id: HOST, scoring: "q", mode: "kahoot", qtype: "meaning", minutes: 5, q_seconds: 15, scope: [], title: "", meaning_lang: "vi", team_mode: false, teams: 0, status: "lobby" },
    game_matches: { id: "00000000-0000-4000-8000-000000000001" }
  };
  function builder(table) {
    const st = { table, single: false, op: "select", rows: null, eq: {}, inn: {} };
    const res = () => {
      if (st.op === "insert" && st.rows) window.__inserts.push({ table, rows: st.rows });
      if (table === "game_rooms") for (const k of Object.keys(st.eq)) if (k === "code") window.__rooms.push(String(st.eq[k]));
      if (table === "test_items" && !st.single) return { data: (arg.items || []).filter((r) => Object.keys(st.eq).every((k) => String(r[k]) === String(st.eq[k])) && Object.keys(st.inn).every((k) => st.inn[k].indexOf(r[k]) >= 0)), error: null };
      if (st.single) return { data: TABLE[table] || null, error: null };
      return { data: [], error: null };
    };
    const b = new Proxy(function () {}, { get(_, k) {
      if (k === "then") return (a, c) => Promise.resolve(res()).then(a, c);
      if (k === "maybeSingle" || k === "single") return () => { st.single = true; return b; };
      if (k === "insert" || k === "upsert") return (rows) => { st.op = "insert"; st.rows = rows; return b; };
      if (k === "eq") return (c, v) => { st.eq[c] = v; return b; };
      if (k === "in") return (c, v) => { st.inn[c] = v; return b; };
      return () => b;
    } });
    return b;
  }
  function channel(name, cfg) {
    window.__channels.push(name);
    const h = {}, ps = {}, key = ((cfg || {}).config || {}).presence ? cfg.config.presence.key : "k";
    const ch = {
      on(type, opts, fn) { const ev = type === "presence" ? "presence" : opts.event; (h[ev] = h[ev] || []).push(fn); return ch; },
      subscribe(cb) { setTimeout(() => cb("SUBSCRIBED"), 0); return ch; },
      track(p) { ps[key] = [p]; setTimeout(() => (h.presence || []).forEach((f) => f()), 0); return Promise.resolve("ok"); },
      untrack() { return Promise.resolve(); }, presenceState() { return ps; },
      send(m) { if (m && m.event === "state" && m.payload && m.payload.q) window.__states.push({ qn: m.payload.q.qn, limit: m.payload.q.limit, part: m.payload.q.part, num: m.payload.q.num }); if (m && m.type === "broadcast") setTimeout(() => (h[m.event] || []).forEach((f) => f({ payload: JSON.parse(JSON.stringify(m.payload)) })), 0); return Promise.resolve("ok"); }
    };
    return ch;
  }
  const storage = { from: () => ({ list: async () => ({ data: [], error: null }), upload: async () => ({ error: null }), remove: async () => ({ data: [], error: null }), move: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) };
  window.supabase = { createClient: () => ({ from: builder, channel, removeChannel() {}, storage }) };
  try { localStorage.setItem("tjwl_game_player_v1", JSON.stringify({ id: "p-tj", name: "TJ", name_no: 1, avatar: "🦊" })); localStorage.setItem("tjwl_link_user_id_v1", HOST); localStorage.setItem("tjwl_game_lang_v1", "vi"); } catch (e) {}
  window.WebSocket = function () { throw new Error("WebSocket bị chặn"); };
}

module.exports = { STUB, HOST: "f3fd95c9-06e8-4d39-b6f2-efc113d436cf" };
