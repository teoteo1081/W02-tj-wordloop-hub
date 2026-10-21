// Đổi status approved -> rejected cho các bẫy trong file do word_traps_audit.js xuất (KHÔNG xoá dòng; hoàn lại bằng cách đổi status về approved theo file backup).
//   IN=<audit.json> BACKUP=<backup.json> NODE_USE_ENV_PROXY=1 node tools/word_traps_reject.js
const fs = require('fs');
const K = fs.readFileSync(__dirname + '/../js/config.js', 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
(async () => {
  const ids = JSON.parse(fs.readFileSync(process.env.IN, 'utf8')).map(x => x.id);
  const bak = [];
  for (let i = 0; i < ids.length; i += 100) {   // backup TRƯỚC khi ghi
    const r = await fetch(SB + '/rest/v1/word_traps?select=*&id=in.(' + ids.slice(i, i + 100).join(',') + ')', { headers: H });
    if (!r.ok) throw new Error('backup ' + r.status); bak.push(...await r.json());
  }
  fs.writeFileSync(process.env.BACKUP, JSON.stringify(bak));
  console.log('backup', bak.length, 'dòng ->', process.env.BACKUP);
  let n = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const r = await fetch(SB + '/rest/v1/word_traps?status=eq.approved&id=in.(' + ids.slice(i, i + 100).join(',') + ')', { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ status: 'rejected' }) });
    if (!r.ok) throw new Error('patch ' + r.status + ' ' + await r.text());
    n += (await r.json()).length;
  }
  console.log('đã đổi sang rejected:', n);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
