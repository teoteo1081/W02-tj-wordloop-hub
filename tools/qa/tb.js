const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 800], [768, 900], [943, 706], [1100, 800], [1366, 768], [1600, 900]]) {
    const pg = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800 })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await pg.route(/^http:\/\/localhost:8951\//, r => { const u = new URL(r.request().url()); let p = 'qa' + decodeURIComponent(u.pathname); if (p === 'qa/') p = 'qa/index.html'; if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: '' }); const ct = p.endsWith('.js') ? 'application/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.json') ? 'application/json' : p.endsWith('.svg') ? 'image/svg+xml' : 'text/html'; r.fulfill({ path: p, contentType: ct }); });
    await pg.goto('http://localhost:8951/index.html'); await pg.waitForTimeout(2500);
    const m = await pg.evaluate(() => { const q = s => document.querySelector(s), r = e => e ? Math.round(e.getBoundingClientRect().width) : null, tr = q('.topbar-right'); return { top: q('.topbar').offsetHeight, hubTabs: r(q('#hub-tabs')), right: tr.clientWidth + '/' + tr.scrollWidth, docW: document.documentElement.scrollWidth, btns: [...tr.children].filter(x => x.offsetParent).length }; });
    console.log(w, JSON.stringify(m), errs.slice(0, 2));
    await pg.screenshot({ path: 'tb_' + w + '.png', clip: { x: 0, y: 0, width: w, height: 190 } });
  }
  await b.close();
})();
