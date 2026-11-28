/* net.js — kênh PHÒNG CHƠI CHUNG của Thành phố (TJ 2026-11-28: "nếu có 1 người thì chơi 1 người, ko thì phòng đó sẽ đợi người vào chơi chung").
   · Dùng Supabase Realtime BROADCAST (giống phòng game), kênh RIÊNG "town:<mã>" — không đụng kênh "game:<mã>" của phòng game thật.
   · KHÔNG dùng presence.track() (Supabase giới hạn số lần track mỗi máy): mỗi máy tự gửi tin "hi" 2 giây/lần, im 7 giây coi như đã rời.
   · Không lưu gì lên database. Không có Supabase (hoặc ?net=local) -> dùng BroadcastChannel: các tab cùng trình duyệt thấy nhau (để kiểm thử). */
export function createNet(code, onMsg) {
  const id = Math.random().toString(36).slice(2, 10);
  const cfg = window.APP_CONFIG || {};
  const forceLocal = /[?&]net=local\b/.test(location.search);
  let ch = null, bc = null, ready = false, mode = "";
  const queue = [];
  function deliver(m) { if (m && m.from !== id) { try { onMsg(m); } catch (e) { console.error(e); } } }
  function useLocal() {
    if (bc) return;
    mode = "local"; bc = new BroadcastChannel("tjwl-town-" + code); bc.onmessage = (e) => deliver(e.data); ready = true; flush();
  }
  function flush() { while (queue.length) send(...queue.shift()); }
  if (!forceLocal && window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    try {
      const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 20 } } });
      ch = sb.channel("town:" + code, { config: { broadcast: { self: false } } });
      ch.on("broadcast", { event: "m" }, (e) => deliver(e.payload));
      const t = setTimeout(() => { if (!ready) { try { sb.removeChannel(ch); } catch (e) {} ch = null; useLocal(); } }, 6000);
      ch.subscribe((st) => { if (st === "SUBSCRIBED" && !bc) { clearTimeout(t); mode = "cloud"; ready = true; flush(); } });
      window.addEventListener("pagehide", () => { try { send("bye", {}); sb.removeChannel(ch); } catch (e) {} });
    } catch (e) { useLocal(); }
  } else useLocal();
  function send(type, data) {
    if (!ready) { if (queue.length < 20) queue.push([type, data]); return; }
    const m = Object.assign({}, data, { t: type, from: id });
    if (bc) bc.postMessage(m);
    else if (ch) ch.send({ type: "broadcast", event: "m", payload: m }).catch(() => {});
  }
  return { id, send, get mode() { return mode; }, get ready() { return ready; }, leave() { send("bye", {}); try { bc && bc.close(); } catch (e) {} } };
}
