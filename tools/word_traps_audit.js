// Rà kho bẫy ĐÃ DUYỆT (chỉ ĐỌC, không ghi DB): bẫy nào làm game có 2 ô cùng nghĩa / lộ đáp án.
//   OUT=<file.json> NODE_USE_ENV_PROXY=1 node tools/word_traps_audit.js
// Xuất danh sách {id, word_term, kind, trap_term, trap_vi, reasons[]} để TJ xem mẫu TRƯỚC khi đổi status (xem word_traps_reject.js nếu có).
const fs = require('fs');
const K = fs.readFileSync(__dirname + '/../js/config.js', 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K };
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const strip = t => String(t || '').replace(/（[^）]*）|\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
const qf = t => norm(strip(t).split(/\s*[\/;；,，、]\s*/)[0]).replace(/[。.!！?？…]+$/, '');
const loose = t => String(t || '').toLowerCase().replace(/[^a-z0-9À-ɏ一-鿿]+/g, '');
const LEAK = /(\bsai\b|không đúng|nhầm|\bwrong\b|\bincorrect\b|misspell|错误|不正确|incorrecto)/i;
async function all(p) { const o = []; for (let f = 0; ; f += 1000) { const r = await fetch(SB + '/rest/v1/' + p + '&limit=1000&offset=' + f, { headers: H }); if (!r.ok) throw new Error(p + ' ' + r.status); const d = await r.json(); o.push(...d); if (d.length < 1000) break; } return o; }
(async () => {
  const tr = await all('word_traps?select=id,word_term,kind,trap_term,trap_en,trap_vi,trap_zh,trap_es&status=eq.approved&order=id');
  const ws = await all('words?select=term,quiz_vi,meaning_vi,quiz_es,meaning_es,quiz_zh,meaning_zh&order=id');
  const W = {}; ws.forEach(w => (W[norm(w.term)] = W[norm(w.term)] || []).push(w));
  const out = [], by = {};
  const byWord = {};
  tr.forEach(t => {
    const reasons = [], rows = W[norm(t.word_term)] || [];
    if (rows.some(w => [['quiz_vi', 'meaning_vi', 'trap_vi'], ['quiz_zh', 'meaning_zh', 'trap_zh'], ['quiz_es', 'meaning_es', 'trap_es']].some(([q, m, b]) => { const a = qf(w[q] || w[m]); return a && t[b] && a === qf(t[b]); }))) reasons.push('same_meaning');
    if (LEAK.test([t.trap_vi, t.trap_en, t.trap_zh, t.trap_es].join(' | '))) reasons.push('leak_note');
    if (loose(t.trap_term) === loose(t.word_term)) reasons.push('same_word');
    (byWord[t.word_term] = byWord[t.word_term] || []).push(t);
    if (reasons.length) { out.push({ id: t.id, word_term: t.word_term, kind: t.kind, trap_term: t.trap_term, trap_vi: t.trap_vi, reasons }); reasons.forEach(r => by[r] = (by[r] || 0) + 1); }
  });
  // 2 bẫy của CÙNG từ trùng nghĩa nhau (giữ bẫy đầu, đánh dấu bẫy sau)
  const flagged = new Set(out.map(x => x.id));
  Object.values(byWord).forEach(a => { const seen = {}; a.forEach(t => { const keys = [qf(t.trap_vi), qf(t.trap_zh), qf(t.trap_es)].filter(Boolean); if (keys.some(k => seen[k]) && !flagged.has(t.id)) { out.push({ id: t.id, word_term: t.word_term, kind: t.kind, trap_term: t.trap_term, trap_vi: t.trap_vi, reasons: ['same_as_other_trap'] }); by.same_as_other_trap = (by.same_as_other_trap || 0) + 1; } keys.forEach(k => seen[k] = 1); }); });
  fs.writeFileSync(process.env.OUT || 'trap_audit.json', JSON.stringify(out, null, 1));
  console.log('đã duyệt', tr.length, '· bẫy lỗi', out.length, '(' + (100 * out.length / tr.length).toFixed(1) + '%)', by);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
