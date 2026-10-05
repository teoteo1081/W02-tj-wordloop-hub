const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const SEP = '\n<<<TJWL_META>>>\n';
const meta = o => SEP + JSON.stringify(o);
const BLOCKS = {
  bl_ai: { id: 'bl_ai', name: 'Block 1', context_passage: 'Old AI story about [economy] and a market.\n\nSecond paragraph.' + meta({ ai: true, provider: 'openai', title: 'Old AI story', source: 'Bài đọc do AI sinh riêng cho Block này.' }), context_passage_candidates: [] },
  bl_ea: { id: 'bl_ea', name: 'Ch.1 Filing Status', context_passage: 'Filing status determines your tax bracket. A taxpayer who is single on December 31 files as single.\n\nHead of household has special rules.', context_passage_candidates: [] },
  bl_art: { id: 'bl_art', name: 'Block 9211', context_passage: 'Original pasted article text about [tariff] policy in a long page.' + meta({ ai: true, provider: 'openai', title: '', source: 'Bài đọc do bạn dán vào — AI trích 10 từ B1+ trong đó.' }), context_passage_candidates: [] },
};
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, hasTouch: true, deviceScaleFactor: 2 }); const pg = await ctx.newPage();
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
  await pg.evaluate(() => { localStorage.removeItem('tjwl_bd_recent_v1'); const G = window.__t.G; G.isHost = true; G.me = { id: 'x', name: 'TJ' }; G.st = { board: true, hid: 'x', bperm: {}, phase: 'lobby' }; document.querySelector('#s-lobby').hidden = false; G.online = [{ id: 'x', name: 'TJ' }]; window.Board.onState(G.st); });
  await pg.waitForTimeout(400);

  await pg.evaluate(async () => { await window.__t.loadTree(true); window.__t.paintTree(); window.__t.paintSide(); });
  await pg.waitForTimeout(600);
  console.log('side', await pg.evaluate(() => { const side = document.querySelector('#g-side'), r = side.getBoundingClientRect(), bd = document.querySelector('#bd').getBoundingClientRect(); return { hidden: side.hidden, tree: document.querySelectorAll('#h-tree details').length, side: [r.left|0, r.top|0, r.width|0], bd: [bd.left|0, bd.top|0, bd.width|0, bd.height|0], cls: document.body.className }; }));
  await pg.evaluate(() => document.querySelectorAll('#h-tree details').forEach(d => d.open = true));
  // mở menu ⋯ của Notebook đầu và chọn Mở lên bảng
  await pg.evaluate(() => { const d = document.querySelector('#h-tree details details .g-dots'); d.click(); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: 'd2a.png' });
  await pg.click('[data-act="bd-vw"]'); await pg.waitForTimeout(2000);
  console.log('doc', await pg.evaluate(() => JSON.stringify(window.__t.G.st.bdoc)));
  await pg.screenshot({ path: 'd2b.png' });
  await b.close();
})();
