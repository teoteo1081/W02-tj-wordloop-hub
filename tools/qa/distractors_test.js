// Kiểm đáp án nhiễu của game trên DỮ LIỆU THẬT (chỉ đọc Supabase): không có 2 ô cùng nghĩa/cùng chữ ở bất kỳ tiếng nào,
// không ô nào lộ ghi chú "(sai)". Chạy:  N=10000 NODE_USE_ENV_PROXY=1 node tools/qa/distractors_test.js
// Lấy nguyên văn hàm `distractors` + bộ lọc từ js/game.js (không bản sao -> không lệch).
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../js/game.js'), 'utf8');
const a = src.indexOf('  var MLANGS ='), b = src.indexOf('  /* thời gian mỗi câu (giây) theo dạng');
const pre = src.slice(src.indexOf('  function norm(t)'), src.indexOf('  function norm(t)') + 200).split('\n')[0];
const qf = src.slice(src.indexOf('  function quizForm(t) {'), src.indexOf('  function shuffle(a)'));
const sh = src.slice(src.indexOf('  function shuffle(a)'), src.indexOf('  function fmt('));
const tk = src.match(/var TRAPS = null, TRAP_KINDS = [^;]*;/)[0];
const env = new Function(pre + '\n' + qf + '\n' + sh + '\n' + tk + '\n' + src.slice(a, b) + '\nreturn { distractors: distractors, setTraps: function (t) { TRAPS = t; }, getLast: function () { return lastTraps; }, getMs: function () { return lastMs; }, mKeys: mKeys, norm: norm, quizForm: quizForm };')();
const K = fs.readFileSync(path.join(__dirname, '../../js/config.js'), 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K };
async function all(p) { const o = []; for (let f = 0; ; f += 1000) { const r = await fetch(SB + '/rest/v1/' + p + '&limit=1000&offset=' + f, { headers: H }); if (!r.ok) throw new Error(p + ' ' + r.status); const d = await r.json(); o.push(...d); if (d.length < 1000) break; } return o; }
(async () => {
  const N = +process.env.N || 10000, norm = env.norm;
  const ws = await all('words?select=id,term,block_id,pos,quiz_vi,meaning_vi,def_en,quiz_es,meaning_es,quiz_zh,meaning_zh&meaning_vi=not.is.null&order=id');
  const tr = await all('word_traps?select=word_term,kind,trap_term,trap_en,trap_vi,trap_zh,trap_es,why&status=eq.approved&order=id');
  const clean = t => String(t || '').trim(), seen = {}, pool = [];
  ws.forEach(w => { const k = norm(w.term); if (!k || /[.!?]/.test(w.term)) return; pool.push({ wid: w.id, term: w.term, block: w.block_id, pos: w.pos, m: { vi: clean(w.quiz_vi || w.meaning_vi), en: clean(w.def_en), es: clean(w.quiz_es || w.meaning_es), zh: clean(w.quiz_zh || w.meaning_zh) } }); });
  const T = {}; tr.forEach(x => (T[x.word_term] = T[x.word_term] || []).push(x)); env.setTraps(T);
  console.log('pool', pool.length, 'bẫy', tr.length);
  const bad = { dupText: 0, dupMean: 0, leak: 0, noCorrect: 0, size: 0 }, ex = [];
  for (let i = 0; i < N; i++) {
    const w = pool[Math.floor(Math.random() * pool.length)], mode = ['meaning', 'en2m', 'gap'][i % 3];
    const opts = env.distractors(w, pool, mode), last = env.getLast() || {}, lm = env.getMs();
    const m = o => lm[norm(o)] || {};
    if (opts.length !== 4) bad.size++;
    if (opts.filter(o => norm(o) === norm(w.term)).length !== 1) bad.noCorrect++;
    const seenK = {}; let dup = false, dupT = false, leak = false;
    opts.forEach(o => {
      const mm = m(o); const keys = [...new Set(env.mKeys(mm))];
      keys.forEach(k => { if (seenK[k]) dup = true; seenK[k] = 1; });
      ['vi', 'zh', 'es', 'en'].forEach(l => { if (/[(（]/.test(mm[l] || '') && last[norm(o)]) leak = true; });
      if (/\bsai\b/i.test(mm.vi || '') && last[norm(o)]) leak = true;
    });
    if (dup) { bad.dupMean++; if (ex.length < 5) ex.push([w.term, mode, opts, opts.map(o => { const mm = m(o); return mm.vi + ' / ' + mm.zh + ' / ' + mm.es; })]); } if (leak) bad.leak++;
  }
  console.log('mô phỏng', N, 'câu ->', bad);
  ex.forEach(e => console.log('  lỗi:', JSON.stringify(e)));
  // ca thật trong ảnh của TJ
  ['well-balanced', 'self-centred'].forEach(t => { const w = pool.find(x => norm(x.term) === t); if (!w) return console.log('không thấy', t); let d = 0; for (let i = 0; i < 300; i++) { const o = env.distractors(w, pool, 'en2m'), last = env.getLast() || {}; const vi = o.map(x => { const tt = last[norm(x)]; return norm(env.quizForm(tt ? tt.m.vi : (norm(x) === norm(w.term) ? w.m.vi : (pool.find(y => norm(y.term) === norm(x)) || { m: {} }).m.vi))); }); if (new Set(vi).size < vi.length) d++; } console.log(t, ': 300 lần bốc, số lần có 2 ô trùng nghĩa VN =', d); });
  process.exit(Object.values(bad).some(v => v) ? 1 : 0);
})().catch(e => { console.error('ERR', e.message); process.exit(2); });
