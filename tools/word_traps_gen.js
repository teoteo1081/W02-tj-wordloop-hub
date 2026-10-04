// Soạn ĐÁP ÁN BẪY cho từ vựng (TJ duyệt 2026-10-04): 4 loại — look (gần chữ/âm) · family (cùng họ từ) · syn (gần nghĩa sai sắc thái) · false (người Việt hay nhầm).
// Cách chạy (OpenAI gpt-4o qua openai-proxy, KHÔNG để khoá ở client):
//   N=100 OUT=<file.json> [MODEL=gpt-4o] [OFFSET=0] NODE_USE_ENV_PROXY=1 node tools/word_traps_gen.js
// Chọn N từ KHÁC NHAU (không phải câu), cấp B1–C1, ngẫu nhiên cố định (seed) -> mỗi từ tối đa 4 bẫy + cờ rủi ro. Chưa ghi gì vào DB.
const fs = require('fs');
const K = fs.readFileSync(__dirname + '/../js/config.js', 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const N = +process.env.N || 100, OFFSET = +process.env.OFFSET || 0, MODEL = process.env.MODEL || 'gpt-4o', BATCH = 10;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9一-鿿 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const SYS = `Bạn là giáo viên tiếng Anh giàu kinh nghiệm dạy người Việt (trình TOEIC 700+). Với MỖI từ, soạn ĐÁP ÁN BẪY cho câu trắc nghiệm — mỗi từ tối đa 4 bẫy, mỗi bẫy một loại khác nhau:
- "look": từ/cụm GẦN CHỮ hoặc GẦN ÂM dễ nhầm (vd affect/effect, principal/principle).
- "family": CÙNG HỌ TỪ nhưng khác loại từ hoặc khác nghĩa (vd economy/economic/economical).
- "syn": GẦN NGHĨA nhưng SAI sắc thái/văn cảnh — phải KHÔNG thể thay cho từ gốc trong câu thông thường.
- "false": lỗi người Việt hay mắc: bạn giả, dịch sai phổ biến, hoặc kết hợp từ (collocation) sai. Đó phải là từ/cụm tiếng Anh mà người học dễ CHỌN NHẦM.
Quy tắc cứng: (1) bẫy phải SAI RÕ RÀNG với nghĩa từ gốc, KHÔNG được là cách dịch/đồng nghĩa chấp nhận được (tránh tạo 2 đáp án đúng); (2) là từ/cụm tiếng Anh có thật; (3) cùng loại từ và độ dài tương đương khi có thể; (4) không lặp lại từ gốc hay lặp nhau; (5) nếu KHÔNG có bẫy tốt cho một loại, đặt giá trị null cho loại đó — đừng gượng ép; (6) "risk":"check" nếu bạn thấy bẫy có thể bị coi là đúng trong một số ngữ cảnh (kèm risk_note ngắn), còn lại "safe".
Mỗi bẫy: {"term":"","en":"định nghĩa tiếng Anh ngắn ≤8 từ của CHÍNH TỪ BẪY","vi":"nghĩa tiếng Việt ngắn của từ bẫy","zh":"中文","es":"español","why":"1 câu tiếng Việt: vì sao dễ nhầm và khác thế nào","risk":"safe|check","risk_note":""}.
Trả JSON: {"items":[{"term":"<từ gốc đúng như đề>","look":{...}|null,"family":{...}|null,"syn":{...}|null,"false":{...}|null}]}`;
async function rest(path) { const r = await fetch(SB + '/rest/v1/' + path, { headers: H }); if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }
async function ai(user) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(SB + '/functions/v1/openai-proxy', { method: 'POST', headers: H, body: JSON.stringify({ model: MODEL, sys: SYS, user, temperature: 0.3 }) });
      const j = await r.json(); const o = JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g, '').trim()); return { o, usage: j.usage || {} };
    } catch (e) { if (t === 2) throw e; await new Promise(r => setTimeout(r, 3000)); }
  }
}
function seeded(n) { let x = 20261004; return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296; }
(async () => {
  // 1) gom từ khác nhau
  const rows = []; for (let f = 0; ; f += 1000) { const d = await rest('words?select=term,pos,level,meaning_vi,def_en&meaning_vi=not.is.null&order=term&limit=1000&offset=' + f); rows.push(...d); if (d.length < 1000) break; }
  const seen = new Set(), pool = [];
  rows.forEach(w => {
    const t = String(w.term || '').trim(), k = norm(t);
    if (!k || seen.has(k) || /[.!?]/.test(t) || t.split(/\s+/).length > 3 || t.length < 4 || /^(Câu|★)/.test(w.pos || '') || !['B1', 'B2', 'C1'].includes(w.level)) return;
    seen.add(k); pool.push(w);
  });
  const rnd = seeded(); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const pick = pool.slice(OFFSET, OFFSET + N); console.log('từ khác nhau', pool.length, '-> lấy', pick.length);
  // 2) gọi AI theo lô, 3 lô song song
  const batches = []; for (let i = 0; i < pick.length; i += BATCH) batches.push(pick.slice(i, i + BATCH));
  const out = [], tot = { p: 0, c: 0 }; let bi = 0;
  const work = async () => { while (bi < batches.length) { const my = batches[bi++], r = await ai(JSON.stringify(my.map(w => ({ term: w.term, pos: w.pos, vi: w.meaning_vi, en: (w.def_en || '').slice(0, 120) })))); tot.p += r.usage.prompt_tokens || 0; tot.c += r.usage.completion_tokens || 0; (r.o.items || []).forEach(it => out.push(it)); process.stdout.write('.'); } };
  await Promise.all([work(), work(), work()]);
  // 3) kiểm tra tự động
  const byTerm = {}; pick.forEach(w => byTerm[norm(w.term)] = w);
  const items = [];
  out.forEach(it => {
    const w = byTerm[norm(it.term)]; if (!w) return;
    const traps = [], used = new Set([norm(w.term)]);
    ['look', 'family', 'syn', 'false'].forEach(kind => {
      const t = it[kind]; if (!t || !t.term) return; const k = norm(t.term), flags = [];
      if (used.has(k)) return; used.add(k);
      if (!t.vi || !t.why) flags.push('thiếu nghĩa/lý do');
      if (norm(t.vi) && norm(t.vi) === norm(w.meaning_vi)) flags.push('nghĩa trùng từ gốc');
      if (kind === 'syn' || kind === 'false') flags.push('loại dễ thành đáp án đúng thứ hai');
      traps.push({ kind, term: t.term, en: t.en || '', vi: t.vi || '', zh: t.zh || '', es: t.es || '', why: t.why || '', risk: t.risk === 'check' || flags.some(f => f !== 'loại dễ thành đáp án đúng thứ hai') ? 'check' : 'safe', risk_note: [t.risk_note, ...flags.filter(f => f !== 'loại dễ thành đáp án đúng thứ hai')].filter(Boolean).join('; ') });
    });
    items.push({ term: w.term, pos: w.pos, level: w.level, vi: w.meaning_vi, en: w.def_en || '', traps });
  });
  items.sort((a, b) => a.term.localeCompare(b.term));
  fs.writeFileSync(process.env.OUT, JSON.stringify({ model: MODEL, made: new Date().toISOString(), items }, null, 1));
  const nt = items.reduce((s, i) => s + i.traps.length, 0), usd = MODEL === 'gpt-4o' ? tot.p * 2.5e-6 + tot.c * 10e-6 : tot.p * 0.15e-6 + tot.c * 0.6e-6;
  console.log('\nxong', items.length, 'từ,', nt, 'bẫy; token', tot.p, '+', tot.c, '≈', usd.toFixed(3), 'USD');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
