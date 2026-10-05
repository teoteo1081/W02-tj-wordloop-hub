// QA harness: isolated copy, mocked Supabase DB (except read-only test_items), fake realtime hub in Node.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const SP = __dirname, QA = path.join(SP, 'qa');
const SUPA = 'https://pqarpszsipbdugrumhfy.supabase.co';
const QA_HOST = '00000000-0000-4000-8000-00000000a0a0';
const UMD = fs.readFileSync(path.join(SP, 'package/dist/umd/supabase.js'), 'utf8') + '\n' + fs.readFileSync(path.join(SP, 'rt_shim.js'), 'utf8');
const MP3 = path.join(QA, 'TEST_1_LC.mp3');
const log = (...a) => console.log('[H]', ...a);

// ---------- mock DB ----------
const DB = {};
function seed() {
  for (const k of Object.keys(DB)) delete DB[k];
  DB.profiles = [{ id: QA_HOST, display_name: 'ZZ_QA_HOST', is_admin: true }];
  DB.game_players = [
    { id: 'aaaaaaaa-0000-4000-8000-000000000000', name: 'TJ', name_no: 1, avatar: '🦊', profile_id: QA_HOST, created_at: '2026-01-01T00:00:00Z' },
    { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'ZZ_QA_P1', name_no: 1, avatar: '🐼', profile_id: null, created_at: '2026-01-01T00:00:01Z' },
    { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'ZZ_QA_P2', name_no: 1, avatar: '🐨', profile_id: null, created_at: '2026-01-01T00:00:02Z' },
    { id: 'aaaaaaaa-0000-4000-8000-000000000003', name: 'ZZ_QA_P3', name_no: 1, avatar: '🐸', profile_id: null, created_at: '2026-01-01T00:00:03Z' },
  ];
  DB.game_rooms = [{ id: 'bbbbbbbb-0000-4000-8000-000000000000', code: 'ZZ_QA_PLAY', host_id: QA_HOST, title: '', scope: [], mode: 'kahoot', qtype: 'meaning', minutes: 5, q_seconds: 15, meaning_lang: 'vi', status: 'lobby', scoring: 'q', team_mode: false, teams: 0, created_at: '2026-01-01T00:00:00Z' }];
  DB.game_matches = []; DB.game_answers = []; DB.game_results = []; DB.vocab_saves = [];
}
seed();
const PLAYERS = () => DB.game_players;
let ansId = 1;
const writes = []; // log of writes
function parseFilter(v) {
  let m;
  if ((m = v.match(/^not\.(.*)$/))) { const f = parseFilter(m[1]); return x => !f(x); }
  if ((m = v.match(/^eq\.(.*)$/s))) return x => String(x) === m[1] && x != null;
  if ((m = v.match(/^neq\.(.*)$/s))) return x => String(x) !== m[1];
  if ((m = v.match(/^in\.\((.*)\)$/s))) { const set = m[1].split(',').map(s => s.replace(/^"|"$/g, '')); return x => set.includes(String(x)); }
  if ((m = v.match(/^(i?like)\.(.*)$/s))) { const re = new RegExp('^' + m[2].replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*') + '$', m[1] === 'ilike' ? 'i' : ''); return x => re.test(String(x)); }
  if ((m = v.match(/^is\.null$/))) return x => x == null;
  if ((m = v.match(/^gte\.(.*)$/))) return x => x >= (isNaN(m[1]) ? m[1] : +m[1]);
  if ((m = v.match(/^lte\.(.*)$/))) return x => x <= (isNaN(m[1]) ? m[1] : +m[1]);
  if ((m = v.match(/^gt\.(.*)$/))) return x => x > (isNaN(m[1]) ? m[1] : +m[1]);
  if ((m = v.match(/^lt\.(.*)$/))) return x => x < (isNaN(m[1]) ? m[1] : +m[1]);
  return () => true;
}
function mockRest(method, u, headers, body) {
  const table = u.pathname.split('/').pop();
  const rows = DB[table] = DB[table] || [];
  const sp = u.searchParams, filters = [];
  for (const [k, v] of sp) if (!['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) filters.push([k, parseFilter(v)]);
  const match = r => filters.every(([k, f]) => f(r[k]));
  const single = /vnd\.pgrst\.object/.test(headers['accept'] || '');
  const ret = /return=representation/.test(headers['prefer'] || '');
  let out;
  if (method === 'GET' || method === 'HEAD') {
    out = rows.filter(match);
    const ord = sp.get('order'); if (ord) { const [c, d] = ord.split(',')[0].split('.'); out.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (d === 'desc' ? -1 : 1)); }
    const rg = headers['range']; if (rg) { const [a, b] = rg.split('-').map(Number); out = out.slice(a, b + 1); }
    if (sp.get('offset')) out = out.slice(+sp.get('offset'));
    if (sp.get('limit')) out = out.slice(0, +sp.get('limit'));
  } else if (method === 'POST') {
    let arr = JSON.parse(body || '[]'); if (!Array.isArray(arr)) arr = [arr];
    const oc = sp.get('on_conflict'), merge = /resolution=merge-duplicates/.test(headers['prefer'] || '');
    out = arr.map(o => {
      o = Object.assign({}, o);
      if (oc && merge) { const ks = oc.split(','); const ex = rows.find(r => ks.every(k => String(r[k]) === String(o[k]))); if (ex) { Object.assign(ex, o); return ex; } }
      if (table === 'game_answers') o.id = ansId++; else if (!o.id) o.id = crypto.randomUUID();
      if (!o.created_at) o.created_at = new Date().toISOString(); if (table === 'game_answers' && !o.at) o.at = new Date().toISOString();
      rows.push(o); return o;
    });
    writes.push({ method, table, n: arr.length });
  } else if (method === 'PATCH') {
    const patch = JSON.parse(body || '{}'); out = rows.filter(match); out.forEach(r => Object.assign(r, patch)); writes.push({ method, table, n: out.length });
  } else if (method === 'DELETE') {
    out = rows.filter(match); DB[table] = rows.filter(r => !match(r)); writes.push({ method, table, n: out.length });
  }
  if (method !== 'GET' && !ret) return { status: 201, body: '' };
  if (single) { if (out.length !== 1) return { status: 406, body: JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'Results contain ' + out.length + ' rows' }) }; return { status: 200, body: JSON.stringify(out[0]) }; }
  return { status: 200, body: JSON.stringify(out) };
}

// ---------- fake realtime hub ----------
const HUB = {}; // ch -> Map(cid -> {page, key, meta, ref})
const pageQ = new WeakMap();
function deliver(page, cid, msg) {
  if (page.isClosed()) return;
  const prev = pageQ.get(page) || Promise.resolve();
  const next = prev.then(() => new Promise(r => setTimeout(r, 15))).then(() => page.isClosed() ? null : page.evaluate(([c, m]) => window.__rtIn && window.__rtIn(c, m), [cid, JSON.stringify(msg)]).catch(() => {}));
  pageQ.set(page, next);
}
function presState(ch) { const st = {}; for (const [cid, m] of HUB[ch] || []) if (m.meta) (st[m.key] = st[m.key] || []).push(Object.assign({ presence_ref: m.ref }, m.meta)); return st; }
function presBroadcast(ch) { const st = presState(ch); for (const [cid, m] of HUB[ch] || []) deliver(m.page, cid, { op: 'presence', state: st }); }
const bcLog = [];
function rt(page, json) {
  const m = JSON.parse(json);
  if (!/^game:ZZ/.test(m.ch)) throw new Error('KILL-SWITCH: channel ' + m.ch);
  const H = HUB[m.ch] = HUB[m.ch] || new Map();
  if (m.op === 'join') { H.set(m.cid, { page, key: m.key, meta: null, ref: crypto.randomUUID().slice(0, 8) }); presBroadcast(m.ch); }
  else if (m.op === 'track') { const x = H.get(m.cid); if (x) { x.meta = m.meta; presBroadcast(m.ch); } }
  else if (m.op === 'untrack') { const x = H.get(m.cid); if (x) { x.meta = null; presBroadcast(m.ch); } }
  else if (m.op === 'leave') { H.delete(m.cid); presBroadcast(m.ch); }
  else if (m.op === 'bc') {
    bcLog.push({ t: Date.now(), ev: m.event, from: m.cid, payload: m.event === 'ans' ? m.payload : undefined });
    for (const [cid, x] of H) if (cid !== m.cid || m.self) deliver(x.page, cid, { op: 'bc', event: m.event, payload: m.payload });
  }
  return true;
}
function dropPage(page) { for (const ch of Object.keys(HUB)) { let ch2 = false; for (const [cid, x] of HUB[ch]) if (x.page === page) { HUB[ch].delete(cid); ch2 = true; } if (ch2) presBroadcast(ch); } }

// ---------- routes ----------
const restCache = new Map();
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
const blocked = [];
async function setupRoutes(ctx) {
  await ctx.route('**/*', async (route) => {
    const req = route.request(), url = req.url(), u = new URL(url);
    try {
      if (u.host === 'qa.local') {
        const f = path.join(QA, decodeURIComponent(u.pathname));
        if (!f.startsWith(QA) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' } });
      }
      if (u.host === 'cdn.jsdelivr.net' && /supabase-js/.test(url)) return route.fulfill({ status: 200, body: UMD, contentType: 'application/javascript' });
      if (url.startsWith(SUPA)) {
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
        if (u.pathname.startsWith('/storage/v1/object/public/toeic/listening/') && /_LC\.mp3$/.test(u.pathname)) {
          const st = fs.statSync(MP3), rg = req.headers()['range'];
          const H = Object.assign({ 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes' }, CORS);
          if (rg) { let [a, b] = rg.replace('bytes=', '').split('-'); a = +a; b = b ? +b : Math.min(st.size - 1, a + 4 * 1024 * 1024); const fd = fs.openSync(MP3, 'r'); const buf = Buffer.alloc(b - a + 1); fs.readSync(fd, buf, 0, buf.length, a); fs.closeSync(fd); return route.fulfill({ status: 206, body: buf, headers: Object.assign(H, { 'content-range': `bytes ${a}-${b}/${st.size}`, 'content-length': String(buf.length) }) }); }
          return route.fulfill({ status: 200, body: fs.readFileSync(MP3), headers: H });
        }
        if (u.pathname.startsWith('/rest/v1/')) {
          const table = u.pathname.split('/').pop();
          if (table === 'test_items') {
            if (req.method() !== 'GET') { blocked.push(req.method() + ' ' + url); return route.fulfill({ status: 403, body: JSON.stringify({ message: 'QA: write to test_items blocked' }), headers: CORS }); }
            const key = url + '|' + (req.headers()['range'] || '') + '|' + (req.headers()['accept'] || '');
            if (!restCache.has(key)) { const res = await route.fetch(); restCache.set(key, { status: res.status(), body: await res.body(), headers: res.headers() }); }
            const c = restCache.get(key); return route.fulfill({ status: c.status, body: c.body, headers: Object.assign({}, c.headers, CORS) });
          }
          const r = mockRest(req.method(), u, req.headers(), req.postData());
          return route.fulfill({ status: r.status, body: r.body, headers: Object.assign({ 'content-type': 'application/json' }, CORS) });
        }
        if (u.pathname.startsWith('/storage/v1/object/public/') && req.method() === 'GET') { // images (read-only)
          const key = 'S|' + url; if (!restCache.has(key)) { const res = await route.fetch(); restCache.set(key, { status: res.status(), body: await res.body(), headers: res.headers() }); }
          const c = restCache.get(key); return route.fulfill({ status: c.status, body: c.body, headers: Object.assign({}, c.headers, CORS) });
        }
        blocked.push(req.method() + ' ' + url); return route.fulfill({ status: 404, body: '{}', headers: CORS });
      }
      blocked.push(req.method() + ' ' + url.slice(0, 120));
      return route.abort();
    } catch (e) { log('route err', url.slice(0, 100), e.message); try { await route.abort(); } catch (_) {} }
  });
}

let browser;
async function start() { browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args: ['--autoplay-policy=no-user-gesture-required'] }); return browser; }
const consoleErrs = [];
// role: {name, playerIdx, host:bool, lang}
async function client(name, playerIdx, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  await setupRoutes(ctx);
  await ctx.exposeBinding('__rtSend', (src, json) => rt(src.page, json));
  const P = DB.game_players[playerIdx];
  await ctx.addInitScript(([me, host, lang]) => {
    if (sessionStorage.getItem('__qa_init')) return; sessionStorage.setItem('__qa_init', '1');
    localStorage.setItem('tjwl_game_player_v1', JSON.stringify(me));
    if (host) localStorage.setItem('tjwl_link_user_id_v1', host); else localStorage.removeItem('tjwl_link_user_id_v1');
    localStorage.setItem('tjwl_game_lang_v1', JSON.stringify(lang || 'vi'));
    localStorage.setItem('tjwl_game_hub_v1', 'test');
    localStorage.setItem('tjwl_game_sound_v1', '0');
  }, [{ id: P.id, name: P.name, name_no: P.name_no, avatar: P.avatar }, opts.host ? QA_HOST : null, opts.lang]);
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleErrs.push(name + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => consoleErrs.push(name + ' PAGEERROR: ' + (e.stack || e.message).slice(0, 400)));
  page.on('close', () => dropPage(page));
  page.on('framenavigated', f => { if (f === page.mainFrame()) dropPage(page); });
  await page.goto('http://qa.local/game.html?room=ZZ_QA_PLAY');
  return { name, ctx, page, P };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(page, fn, arg, timeout = 15000) { return page.waitForFunction(fn, arg, { timeout, polling: 100 }); }
module.exports = { start, client, DB, seed, sleep, waitFor, consoleErrs, blocked, writes, bcLog, HUB, QA_HOST, log, get browser() { return browser; } };
