const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext()).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route(/^https:/, async r => { const u = r.request().url(); if (u.includes('@supabase')) return r.fulfill({ path: 'sbjs/package/dist/umd/supabase.js', contentType: 'application/javascript' }); if (u.includes('/rest/v1/word_traps')) { global.q = (global.q||[]); global.q.push(decodeURIComponent(u).slice(-120)); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ word_term: 'active', kind: 'look', trap_term: 'act', trap_vi: 'hành động' }]), headers: { 'access-control-allow-origin': '*' } }); } return r.abort(); });
  await pg.route(/^http:\/\/localhost:8951\//, r => { const u = new URL(r.request().url()); const p = 'qa' + decodeURIComponent(u.pathname); if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: '' }); const ct = p.endsWith('.js') ? 'application/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.json') ? 'application/json' : 'text/html'; r.fulfill({ path: p, contentType: ct }); });
  await pg.goto('http://localhost:8951/game.html'); await pg.waitForFunction(() => window.__t);
  await pg.evaluate(() => window.__t.loadTraps([{term:'Active'},{term:'beta'}])); console.log('traps', await pg.evaluate(() => JSON.stringify(window.__t.getTraps())), global.q);
  const out = await pg.evaluate(() => {
    const T = window.__t, mk = (term, pos, block) => ({ term, pos, block, m: { vi: 'nghĩa ' + term, en: 'def ' + term } });
    const pool = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma'].map(t => mk(t, 'Noun', 'b1')), w = mk('active', 'Adj', 'b1');
    const noTrap = T.distractors(w, pool, 'meaning'), l0 = T.last();
    T.setTraps({ active: [{ word_term: 'active', kind: 'look', trap_term: 'act', trap_en: 'do', trap_vi: 'hành động', why: 'x' }, { word_term: 'active', kind: 'syn', trap_term: 'energetic', trap_en: 'e', trap_vi: 'năng động', why: 'y' }, { word_term: 'active', kind: 'false', trap_term: 'activeness', trap_en: 'z', trap_vi: 'tính', why: 'z' }] });
    const m = T.distractors(w, pool, 'meaning'), lm = T.last(), g = T.distractors(w, pool, 'gap'), lg = T.last();
    return { noTrap, l0, m, lm: Object.keys(lm || {}), g, lg: Object.keys(lg || {}).map(k => lg[k].k) };
  });
  console.log(JSON.stringify(out)); console.log('errs', errs); await b.close();
})();
