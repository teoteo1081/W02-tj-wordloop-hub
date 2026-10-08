const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const SEP = '\n<<<TJWL_META>>>\n';
const meta = o => SEP + JSON.stringify(o);
const LONG = require('fs').readFileSync('long.txt','utf8').replace(/\. /g, '.\n\n'.slice(0,0)+'. ');
const BLOCKS = {
  bl_ai: { id: 'bl_ai', name: 'Block 1', context_passage: LONG + meta({ ai: true, provider: 'openai', title: 'Old AI story', source: 'Bài đọc do AI sinh riêng cho Block này.' }), context_passage_candidates: [] },
  bl_ea: { id: 'bl_ea', name: 'Ch.1 Filing Status', context_passage: 'Filing status determines your tax bracket. A taxpayer who is single on December 31 files as single.\n\nHead of household has special rules.', context_passage_candidates: [] },
  bl_art: { id: 'bl_art', name: 'Block 9211', context_passage: 'Original pasted article text about [tariff] policy in a long page.' + meta({ ai: true, provider: 'openai', title: '', source: 'Bài đọc do bạn dán vào — AI trích 10 từ B1+ trong đó.' }), context_passage_candidates: [] },
};
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +(process.env.VW||390), height: +(process.env.VH||844) }, hasTouch: true, deviceScaleFactor: 2 }); const pg = await ctx.newPage();
  const errs = [], patches = []; pg.on('pageerror', e => errs.push(e.message));
  const J = (r, body, st) => r.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } });
  await pg.route(/^https:/, async r => {
    const u = new URL(r.request().url()), p = u.pathname, m = r.request().method();
    if (u.href.includes('@supabase')) return r.fulfill({ path: 'sbjs/package/dist/umd/supabase.js', contentType: 'application/javascript' });
    if (p.includes('/functions/v1/gemini-proxy')) return J(r, { candidates: [{ content: { parts: [{ text: JSON.stringify({ topic_vi: 'kinh tế', title: 'A Brand New Story', source_vi: 'Bài mới', passage_en: 'Maya studied the economy of her town. The inflation worried everyone at the market.\n\nShe wrote a long report about tariff rules and the deficit.', translations: [{ term: 'economy', vi: 'nền kinh tế' }] }) }] } }] });
    if (p.includes('/storage/v1/object/list/toeic')) { const pre = (JSON.parse(r.request().postData() || '{}').prefix || '').replace(/\/$/, ''); return J(r, pre === 'lib' ? [{ name: 'Books', id: null }] : pre === 'lib/Books' ? [{ name: 'Tu_Duy.pdf', id: '1', metadata: { size: 2400000 } }] : []); }
    if (p.includes('/rest/v1/hubs')) return J(r, [{ id: 'h1', name: 'TJ', sort: 1 }, { id: 'hub_ea2025', name: 'EA2025', sort: 2 }]);
    if (p.includes('/rest/v1/notebooks')) return J(r, [{ id: 'n1', name: 'Communication', hub_id: 'h1', parent_notebook_id: null, sort: 1 }, { id: 'n2', name: 'EA 2025 - Part I', hub_id: 'hub_ea2025', parent_notebook_id: null, sort: 1 }, { id: 'n3', name: 'Bài báo-Youtube', hub_id: 'h1', parent_notebook_id: null, sort: 2 }]);
    if (p.includes('/rest/v1/sections')) return J(r, [{ id: 's1', name: 'Unit 1', notebook_id: 'n1', sort: 1 }, { id: 's2', name: 'Chapters', notebook_id: 'n2', sort: 1 }, { id: 's3', name: 'Bài báo', notebook_id: 'n3', sort: 1 }]);
    if (p.includes('/rest/v1/pages')) return J(r, [{ id: 'pg1', name: 'P1', section_id: 's1', sort: 1 }, { id: 'pg2', name: 'P2', section_id: 's2', sort: 1 }, { id: 'pg3', name: 'P3', section_id: 's3', sort: 1 }]);
    if (p.includes('/rest/v1/batches')) return J(r, [{ id: 'bt1', name: 'B1', page_id: 'pg1', sort: 1 }, { id: 'bt2', name: 'B2', page_id: 'pg2', sort: 1 }, { id: 'bt3', name: 'B3', page_id: 'pg3', sort: 1 }]);
    if (p.includes('/rest/v1/blocks')) {
      if (m === 'PATCH') { const pb = JSON.parse(r.request().postData()); patches.push(pb); const id = decodeURIComponent(u.search.split('id=eq.')[1].split('&')[0]); Object.assign(BLOCKS[id], pb); return r.fulfill({ status: 204, body: '', headers: { 'access-control-allow-origin': '*' } }); }
      if (u.search.includes('id=eq.')) { const id = decodeURIComponent(u.search.split('id=eq.')[1].split('&')[0]); const x = BLOCKS[id]; const obj = (r.request().headers()['accept'] || '').includes('object'); return J(r, obj ? (x || null) : (x ? [x] : [])); }
      return J(r, [{ id: 'bl_ai', name: 'Block 1', global_index: 1, batch_id: 'bt1' }, { id: 'bl_ea', name: 'Ch.1 Filing Status', global_index: 2, batch_id: 'bt2' }, { id: 'bl_art', name: 'Block 9211', global_index: 3, batch_id: 'bt3' }]);
    }
    if (p.includes('/rest/v1/words')) return J(r, ['economy', 'inflation', 'tariff', 'deficit'].map((t, i) => ({ id: 'w' + i, term: t, ipa: '/x/', pos: 'n', level: 'B2', def_en: 'def of ' + t, meaning_vi: 'nghĩa ' + t, meaning_zh: '', meaning_es: '', sort: String(i) })));
    return r.abort();
  });
  await pg.route(/^http:\/\/localhost:8951\//, r => { const u = new URL(r.request().url()); const p = 'qa' + decodeURIComponent(u.pathname); if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: '' }); const ct = p.endsWith('.js') ? 'application/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.json') ? 'application/json' : 'text/html'; r.fulfill({ path: p, contentType: ct }); });
  await pg.goto('http://localhost:8951/game.html'); await pg.waitForFunction(() => window.__t && window.Board);
  await pg.evaluate(() => { localStorage.removeItem('tjwl_bd_recent_v1'); const G = window.__t.G; G.isHost = true; G.me = { id: 'x', name: 'TJ' }; G.st = { board: true, hid: 'x', bperm: {}, phase: 'lobby' }; G.online = [{ id: 'x', name: 'TJ' }]; window.Board.onState(G.st); });
  await pg.waitForTimeout(400);

  const info = () => pg.evaluate(() => { const d = window.__t.G.st.bdoc, w = document.querySelector('.bd-wl,.bd-vt'); return { d: JSON.stringify(d), fs: w && getComputedStyle(w).fontSize, t: (document.querySelector('.bd-wl,.bd-vt')||{}).innerText?.slice(0,50).replace(/\n/g,' '), pg: document.querySelector('#bd-dpg').textContent }; });
  const stagebox = () => pg.evaluate(() => { const r = document.querySelector('#bd-stage').getBoundingClientRect(), n = document.querySelector('#bd-docnav').getBoundingClientRect(), t = document.querySelector('#bd-tools').getBoundingClientRect(); return { stage: [r.left|0, r.top|0, r.width|0, r.height|0], nav: [n.top|0, n.height|0], tools: t.top|0, vh: innerHeight }; });
  // 1) open vocab table via tree button
  await pg.click('#bd-lib'); await pg.waitForTimeout(300); await pg.click('[data-lt="wl"]'); await pg.waitForTimeout(1200);
  await pg.evaluate(() => document.querySelectorAll('#bd-wllist details').forEach(d => d.open = true));
  await pg.click('[data-vt="bl_ai"]'); await pg.waitForTimeout(1200);
  console.log('1 vt:', await info(), await stagebox());
  await pg.screenshot({ path: 'c1_vt.png' });
  // 2) next past last page -> reading
  for (let i = 0; i < 4; i++) { await pg.click('#bd-dnext'); await pg.waitForTimeout(500); const x = await info(); console.log('  next', i, x.pg, x.fs, x.t); if (/wl/.test(x.d)) break; }
  await pg.waitForTimeout(1200); console.log('2 now:', await info());
  await pg.screenshot({ path: 'c2_wl.png' });
  // 3) font consistency across pages
  const fonts = []; for (let i = 0; i < 6; i++) { const x = await info(); fonts.push(x.fs + '|' + x.pg); await pg.click('#bd-dnext'); await pg.waitForTimeout(600); }
  console.log('3 fonts/pages:', fonts.join('  '));
  // 4) A+ / A- change level, pages change
  await pg.click('[data-z="out"]'); await pg.waitForTimeout(900); console.log('4 A- :', await info(), await pg.textContent('#bd-zfit'));
  await pg.click('[data-z="in"]'); await pg.click('[data-z="in"]'); await pg.waitForTimeout(900); console.log('4 A+ A+:', await info());
  // 5) edge tap
  const sb = await stagebox(); const [sl, st0, sw0, sh0] = sb.stage;
  for (const [nm, x] of [['L', sl + 6], ['R', sl + sw0 - 6], ['R2', sl + sw0 - 30], ['L2', sl + 20], ['R3', sl + sw0 - 6]]) {
    const before = (await info()).pg;
    await pg.touchscreen.tap(x, st0 + sh0 * 0.8); await pg.waitForTimeout(900);
    console.log('5 tap', nm, before, '->', (await info()).pg, JSON.stringify(await pg.evaluate(() => [document.querySelector('#bd-stage').getBoundingClientRect().width|0])));
  }
  // 6) word tap
  const wpos = await pg.evaluate(() => { const w = [...document.querySelectorAll('.bd-w')].find(e => e.textContent === 'winter' || e.textContent === 'market') || document.querySelector('.bd-w'); const r = w.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: w.textContent }; });
  await pg.touchscreen.tap(wpos.x, wpos.y); await pg.waitForTimeout(1500);
  console.log('6 word tap', wpos.t, '->', await pg.evaluate(() => [document.querySelector('#bd-lk').hidden, document.querySelector('#bd-lkr').innerText.replace(/\n/g, ' ')]));
  await pg.screenshot({ path: 'c6_lookup.png' });
  // 7) typed lookup
  await pg.click('#bd-dsrch'); await pg.fill('#bd-lkin', 'inflation'); await pg.press('#bd-lkin', 'Enter'); await pg.waitForTimeout(1200);
  console.log('7 typed:', await pg.evaluate(() => document.querySelector('#bd-lkr').innerText.replace(/\n/g, ' ')));
  await pg.screenshot({ path: 'c7_typed.png' });
  await pg.click('#bd-lkx'); await pg.waitForTimeout(300);
  // 8) side tree
  await pg.click('#bd-dtree'); await pg.waitForTimeout(1200);
  console.log('8 side visible:', await pg.evaluate(() => !document.querySelector('#bd-side').hidden), 'details:', await pg.evaluate(() => document.querySelectorAll('#bd-sidelist details').length));
  await pg.click('#bd-sideexp'); await pg.waitForTimeout(200);
  await pg.screenshot({ path: 'c8_side.png' });
  // tick the first notebook group
  await pg.evaluate(() => { const c = document.querySelector('#bd-sidelist > details > summary .bd-tck'); c.click(); });
  await pg.waitForTimeout(300);
  console.log('8 selected:', await pg.evaluate(() => document.querySelector('.bd-selc').textContent));
  await pg.click('#bd-side [data-qgo]'); await pg.waitForTimeout(1500);
  console.log('8 queue opened:', await info(), 'side hidden:', await pg.evaluate(() => document.querySelector('#bd-side').hidden));
  // 9) zoom out below 100 (non-text doc: use img)
  await pg.evaluate(() => window.__t.G.st.bdoc = null);
  console.log('errs', errs);
  await b.close();
})();
