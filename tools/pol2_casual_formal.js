// Gộp 3 mức lịch sự -> 2 mức (casual/formal) cho chunks.pol của cia_* (+ chép sang cia2_*)
// node run.js backup | node run.js gen <limit> | node run.js write
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const DIR = __dirname, REPO = '/home/user/W02-tj-wordloop-hub';
const K = fs.readFileSync(REPO + '/js/config.js', 'utf8').match(/eyJ[^"]*/)[0];
const SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K };
const LANGS = ['en', 'es', 'zh', 'vi'];
const nz = t => String(t).toLowerCase().replace(/[\s.,!?;:¿¡。，！？、…"'’]/g, '');
async function all(prefix) {
  let out = [], from = 0;
  for (;;) {
    const r = await fetch(SB + '/rest/v1/words?select=id,term,meaning_vi,meaning_es,meaning_zh,chunks&id=like.' + prefix + '*&order=id', { headers: { ...H, Range: from + '-' + (from + 999) } });
    const rows = await r.json(); if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
    out = out.concat(rows); if (rows.length < 1000) return out; from += 1000;
  }
}
async function ai(user) {
  const sys = `You write "politeness register" pairs for a language-learning game (learners aiming at TOEIC 700).
For each item and each language listed in "candidates", return exactly 2 sentences with the SAME meaning as the original:
- "casual": said to a CLOSE FRIEND. Must sound clearly MORE relaxed than the plain original: contractions, informal words or particles ("gonna", "Hey", "ya", "tú", "嘛/啊/吧", "nha/nhé/mình/bạn"), may drop words. Natural, no vulgar slang.
- "formal": said to a CLIENT or a SENIOR BOSS. Must sound clearly MORE polite than the plain original, with visible politeness markers: English "Could/Would you…", "I would like…", "May I…", "please"; Spanish usted forms ("¿Podría…?", "usted"); Chinese "您", "请", "贵公司", "请问"; Vietnamese "anh/chị", "xin", "ạ", "quý công ty".
Rules: KEEP THE SENTENCE TYPE of the original in that language: a statement stays a statement (never turn it into a question or a request like "Could you confirm that…?"), a question stays a question, a request stays a request. For statements, formality comes from word choice ("We would be pleased to…", "approximately", "I am responsible for…", usted/您/ạ), not from asking. Do NOT add or remove information — no extra clauses, invitations, compliments or new objects ("your company", "should you need…", "it has been a pleasure…"); change only tone/wording. Vietnamese casual uses "mình/tụi mình/bọn mình/bạn" and particles "nha/nhé/á", never "chúng tôi". Never return the plain original unchanged as "formal" unless it already has a politeness marker; the two sentences must differ in several words, not just one; keep names, numbers and facts identical; each sentence only in its own language.
Reply JSON only: {"items":[{"id":"...","pol":{"<lang>":{"casual":"...","formal":"..."}}}]}`;
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(SB + '/functions/v1/openai-proxy', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.MODEL || 'gpt-4o-mini', sys, user, temperature: 0.3 }) });
      const j = await r.json(); const txt = j.choices[0].message.content;
      return JSON.parse(txt.replace(/^```(json)?|```$/g, '').trim());
    } catch (e) { if (t === 2) throw e; await new Promise(r => setTimeout(r, 2000)); }
  }
}
(async () => {
  const cmd = process.argv[2];
  if (cmd === 'backup') {
    const rows = (await all('cia_')).concat(await all('cia2_'));
    const f = DIR + '/words_cia_chunks_before_pol2_2026-10-03.json.gz';
    fs.writeFileSync(f, zlib.gzipSync(JSON.stringify(rows)));
    console.log('backup', rows.length, 'rows ->', f, fs.statSync(f).size, 'bytes');
    return;
  }
  if (cmd === 'gen') {
    const limit = +process.argv[3] || 1e9;
    const rows = JSON.parse(zlib.gunzipSync(fs.readFileSync(DIR + '/words_cia_chunks_before_pol2_2026-10-03.json.gz')));
    const src = rows.filter(w => w.id.startsWith('cia_') && w.chunks && w.chunks.pol).slice(0, limit);
    const outF = DIR + '/gen.json', done = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF)) : {};
    const todo = src.filter(w => !done[w.id]);
    console.log('todo', todo.length, '/', src.length);
    const batches = []; for (let i = 0; i < todo.length; i += 5) batches.push(todo.slice(i, i + 5));
    let bi = 0, fails = 0;
    async function worker() {
      while (bi < batches.length) {
        const b = batches[bi++];
        const user = JSON.stringify(b.map(w => ({ id: w.id, original: { en: w.term, vi: w.meaning_vi, es: w.meaning_es, zh: w.meaning_zh }, context: w.chunks.ctx || '', candidates: Object.fromEntries(LANGS.filter(l => w.chunks.pol[l]).map(l => [l, w.chunks.pol[l]])) })));
        try {
          const res = await ai(user);
          for (const it of res.items || []) {
            const w = b.find(x => x.id === it.id); if (!w) continue;
            const orig = { en: w.term, vi: w.meaning_vi, es: w.meaning_es, zh: w.meaning_zh }, isq = t => /[?？]\s*$/.test(String(t || ''));
            const ok = LANGS.filter(l => w.chunks.pol[l]).every(l => it.pol && it.pol[l] && it.pol[l].casual && it.pol[l].formal && nz(it.pol[l].casual) !== nz(it.pol[l].formal) && (!orig[l] || /^(let'?s|let us|please|can|could|would|will|shall)\b/i.test(w.term) || (isq(it.pol[l].casual) === isq(orig[l]) && isq(it.pol[l].formal) === isq(orig[l]))));
            if (ok) done[w.id] = it.pol; else fails++;
          }
        } catch (e) { fails++; console.warn('batch fail', e.message); }
        if (bi % 20 === 0) { fs.writeFileSync(outF, JSON.stringify(done)); console.log('progress', Object.keys(done).length, 'fails', fails); }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    fs.writeFileSync(outF, JSON.stringify(done));
    console.log('done', Object.keys(done).length, 'fails', fails);
    return;
  }
  if (cmd === 'write') {
    const rows = JSON.parse(zlib.gunzipSync(fs.readFileSync(DIR + '/words_cia_chunks_before_pol2_2026-10-03.json.gz')));
    const gen = JSON.parse(fs.readFileSync(DIR + '/gen.json'));
    const todo = [];
    for (const w of rows) {
      const key = w.id.startsWith('cia2_') ? 'cia_' + w.id.slice(5) : w.id;
      const g = gen[key]; if (!g || !w.chunks || !w.chunks.pol) continue;
      const pol = {};
      for (const l of Object.keys(w.chunks.pol)) pol[l] = g[l] ? { casual: g[l].casual.trim(), formal: g[l].formal.trim() } : { casual: w.chunks.pol[l].casual, formal: w.chunks.pol[l].formal };
      todo.push({ id: w.id, chunks: { ...w.chunks, pol } });
    }
    console.log('write', todo.length);
    let ok = 0, i = 0;
    async function worker() {
      while (i < todo.length) {
        const t = todo[i++];
        const r = await fetch(SB + '/rest/v1/words?id=eq.' + encodeURIComponent(t.id), { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ chunks: t.chunks }) });
        if (r.ok) ok++; else console.warn(t.id, r.status, await r.text());
      }
    }
    await Promise.all(Array.from({ length: 8 }, worker));
    console.log('written', ok, '/', todo.length);
  }
})();
