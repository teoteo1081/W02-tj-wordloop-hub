// WL-19: ĐO (chỉ đọc) tần suất 2 ô gần nghĩa (không giống hệt) trong 1 câu của game. Không sửa bộ lọc.
// Gần nghĩa = (a) nghĩa VN của 2 ô giống nhau >= 50% số chữ (Jaccard), hoặc (b) định nghĩa EN dùng chung >= 60% chữ nội dung.
// Chạy:  N=20000 NODE_USE_ENV_PROXY=1 node tools/qa/gap_nearsyn_measure.js   (in ví dụ để TJ đánh giá bằng mắt)
// Lấy nguyên văn `distractors` từ js/game.js, cùng cách nạp như distractors_test.js.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../js/game.js'), 'utf8');
const a = src.indexOf('  var MLANGS ='), b = src.indexOf('  /* thời gian mỗi câu (giây) theo dạng');
const pre = src.slice(src.indexOf('  function norm(t)'), src.indexOf('  function norm(t)') + 200).split('\n')[0];
const qf = src.slice(src.indexOf('  function quizForm(t) {'), src.indexOf('  function shuffle(a)'));
const sh = src.slice(src.indexOf('  function shuffle(a)'), src.indexOf('  function fmt('));
const tk = src.match(/var TRAPS = null, TRAP_KINDS = [^;]*;/)[0];
const env = new Function(pre + '\n' + qf + '\n' + sh + '\n' + tk + '\n' + src.slice(a, b) + '\nreturn { distractors: distractors, setTraps: function (t) { TRAPS = t; }, getMs: function () { return lastMs; }, norm: norm, quizForm: quizForm };')();
const K = fs.readFileSync(path.join(__dirname, '../../js/config.js'), 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K };
async function all(p) { const o = []; for (let f = 0; ; f += 1000) { const r = await fetch(SB + '/rest/v1/' + p + '&limit=1000&offset=' + f, { headers: H }); if (!r.ok) throw new Error(p + ' ' + r.status); const d = await r.json(); o.push(...d); if (d.length < 1000) break; } return o; }
const STOP = new Set('a an the of to in on for and or is are be being with that this it as by at from one who which not'.split(' '));
const toks = (s, stop) => new Set(String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^\p{L}]+/u).filter(x => x && x.length > 1 && !(stop && STOP.has(x))));
function jac(x, y) { if (!x.size || !y.size) return 0; let n = 0; x.forEach(t => y.has(t) && n++); return n / (x.size + y.size - n); }
function ovl(x, y) { if (!x.size || !y.size) return 0; let n = 0; x.forEach(t => y.has(t) && n++); return n / Math.min(x.size, y.size); }
(async () => {
  const N = +process.env.N || 10000, norm = env.norm;
  const ws = await all('words?select=id,term,block_id,pos,quiz_vi,meaning_vi,def_en,quiz_es,meaning_es,quiz_zh,meaning_zh&meaning_vi=not.is.null&order=id');
  const tr = await all('word_traps?select=word_term,kind,trap_term,trap_en,trap_vi,trap_zh,trap_es,why&status=eq.approved&order=id');
  const clean = t => String(t || '').trim(), pool = [];
  ws.forEach(w => { const k = norm(w.term); if (!k || /[.!?]/.test(w.term)) return; pool.push({ wid: w.id, term: w.term, block: w.block_id, pos: w.pos, m: { vi: clean(w.quiz_vi || w.meaning_vi), en: clean(w.def_en), es: clean(w.quiz_es || w.meaning_es), zh: clean(w.quiz_zh || w.meaning_zh) } }); });
  const T = {}; tr.forEach(x => (T[x.word_term] = T[x.word_term] || []).push(x)); env.setTraps(T);
  let hit = 0, hitVi = 0, hitEn = 0, hitCorrect = 0; const ex = [];
  for (let i = 0; i < N; i++) {
    const w = pool[Math.floor(Math.random() * pool.length)], opts = env.distractors(w, pool, 'gap'), lm = env.getMs();
    const info = opts.map(o => { const mm = lm[norm(o)] || (norm(o) === norm(w.term) ? w.m : {}); return { o, vi: toks(env.quizForm(mm.vi || '')), en: toks(mm.en, true), rawVi: mm.vi, rawEn: mm.en }; });
    let qVi = false, qEn = false, withCorrect = false, pair = null;
    for (let x = 0; x < info.length; x++) for (let y = x + 1; y < info.length; y++) {
      const v = jac(info[x].vi, info[y].vi) >= 0.5, e = ovl(info[x].en, info[y].en) >= 0.6;
      if (v) qVi = true; if (e) qEn = true;
      if ((v || e) && !pair) pair = [info[x], info[y]];
      if ((v || e) && (norm(info[x].o) === norm(w.term) || norm(info[y].o) === norm(w.term))) withCorrect = true;
    }
    if (qVi || qEn) { hit++; if (qVi) hitVi++; if (qEn) hitEn++; if (withCorrect) hitCorrect++; if (ex.length < 25 && Math.random() < 0.05 + 25 / N) ex.push(pair.map(p => p.o + ' = ' + p.rawVi + ' | ' + (p.rawEn || '').slice(0, 60)).join('   <>   ')); }
  }
  const pc = n => (100 * n / N).toFixed(2) + '%';
  console.log('pool', pool.length, '| câu gap mô phỏng', N);
  console.log('có >=1 cặp gần nghĩa:', hit, pc(hit), '| theo nghĩa VN:', hitVi, pc(hitVi), '| theo định nghĩa EN:', hitEn, pc(hitEn), '| cặp dính ĐÁP ÁN ĐÚNG:', hitCorrect, pc(hitCorrect));
  console.log('--- ví dụ (TJ xem có thật sự gần nghĩa không) ---'); ex.forEach(e => console.log(' ', e));
})().catch(e => { console.error('ERR', e.message); process.exit(2); });
