// Chấm LẦN 2 các bẫy `pending` (risk=check): bẫy này có thể là đáp án đúng thứ hai không? (OpenAI gpt-4o qua openai-proxy, khoá không ở client)
// Bước 1 (chỉ đọc, chưa ghi DB):  IN=<pending.json> OUT=<verdicts.json> NODE_USE_ENV_PROXY=1 node tools/word_traps_recheck.js
// Bước 2 (ghi DB):                APPLY=<verdicts.json> NODE_USE_ENV_PROXY=1 node tools/word_traps_recheck.js
//   (kèm IN=<pending.json> để bỏ các id AI chép sai; id không có trong IN bị bỏ qua)
//   ok -> status=approved · equivalent -> status=rejected · unsure -> giữ pending (TJ xem tay). Chỉ đụng dòng đang `pending`.
const fs = require('fs');
const K = fs.readFileSync(__dirname + '/../js/config.js', 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const MODEL = process.env.MODEL || 'gpt-4o', BATCH = 20;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const SYS = `You are a strict English-vocabulary quiz reviewer. A multiple-choice question shows a target word (with its Vietnamese meaning); the learner must pick the correct answer. A "trap" is a WRONG option that must be clearly wrong. For each item decide whether the trap could ALSO be accepted as correct for the target word.
Verdicts:
- "equivalent": the trap could be accepted as correct — same meaning, a spelling/regional variant (aging/ageing), a synonym or near-synonym interchangeable in typical contexts, same or nearly the same Vietnamese translation as the target, or a common alternative wording of the same concept.
- "ok": the trap clearly has a DIFFERENT meaning, so a learner who picks it is definitely wrong.
- "unsure": you cannot tell, or it depends heavily on context.
Be strict: if a reasonable teacher might accept the trap as correct, answer "equivalent" or "unsure", never "ok". Compare meanings, not wording of explanations.
Return JSON only: {"items":[{"id":"<id>","v":"ok|equivalent|unsure","note":"≤12 words"}]}`;
async function ai(user) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(SB + '/functions/v1/openai-proxy', { method: 'POST', headers: H, body: JSON.stringify({ model: MODEL, sys: SYS, user, temperature: 0 }) });
      const j = await r.json(); return { o: JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g, '').trim()), usage: j.usage || {} };
    } catch (e) { if (t === 2) throw e; await new Promise(r => setTimeout(r, 3000)); }
  }
}
async function recheck() {
  const rows = JSON.parse(fs.readFileSync(process.env.IN, 'utf8'));
  const vi = {}; for (let f = 0; ; f += 1000) { const r = await fetch(SB + '/rest/v1/words?select=term,meaning_vi&meaning_vi=not.is.null&order=term&limit=1000&offset=' + f, { headers: H }); const d = await r.json(); d.forEach(w => { const k = norm(w.term); if (!vi[k]) vi[k] = w.meaning_vi; }); if (d.length < 1000) break; }
  const batches = []; for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH));
  const out = {}, tot = { p: 0, c: 0 }; let bi = 0;
  async function worker() {
    while (bi < batches.length) {
      const b = batches[bi++];
      const user = JSON.stringify(b.map(r => ({ id: r.id, kind: r.kind, word: r.word_term, word_vi: vi[norm(r.word_term)] || '', trap: r.trap_term, trap_vi: r.trap_vi, trap_en: r.trap_en })));
      try { const { o, usage } = await ai(user); tot.p += usage.prompt_tokens || 0; tot.c += usage.completion_tokens || 0; (o.items || []).forEach(x => { out[x.id] = { v: x.v, note: x.note }; }); }
      catch (e) { console.log('lô lỗi', e.message); }
      process.stdout.write('\r' + Object.keys(out).length + '/' + rows.length);
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  const cnt = {}; Object.values(out).forEach(x => { cnt[x.v] = (cnt[x.v] || 0) + 1; });
  fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log('\nxong', cnt, 'thiếu', rows.length - Object.keys(out).length, '· token', tot, '· ≈USD', (tot.p * 2.5e-6 + tot.c * 10e-6).toFixed(2));
}
async function apply() {
  let v = JSON.parse(fs.readFileSync(process.env.APPLY, 'utf8'));
  if (process.env.IN) { const ids = new Set(JSON.parse(fs.readFileSync(process.env.IN, 'utf8')).map(r => r.id)), bad = Object.keys(v).filter(k => !ids.has(k)); bad.forEach(k => delete v[k]); console.log('bỏ', bad.length, 'id AI chép sai'); }
  const grp = { approved: [], rejected: [] };
  Object.entries(v).forEach(([id, x]) => { if (x.v === 'ok') grp.approved.push(id); else if (x.v === 'equivalent') grp.rejected.push(id); });
  for (const [status, ids] of Object.entries(grp)) for (let i = 0; i < ids.length; i += 100) {
    const r = await fetch(SB + '/rest/v1/word_traps?status=eq.pending&id=in.(' + ids.slice(i, i + 100).join(',') + ')', { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ status }) });
    if (!r.ok) throw new Error(status + ' ' + r.status + ' ' + await r.text());
  }
  console.log('đã ghi: approved', grp.approved.length, '· rejected', grp.rejected.length, '· giữ pending', Object.keys(v).length - grp.approved.length - grp.rejected.length);
}
(process.env.APPLY ? apply() : recheck()).catch(e => { console.error(e); process.exit(1); });
