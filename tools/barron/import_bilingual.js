/* Safe sample import: no secrets in output; book content and backup stay outside repo.
   node tools/barron/import_bilingual.js <private directory> [--apply]
   Only Lesson 1/2, whose key has been visually checked against PDF page 333.
*/
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const dir = path.resolve(process.argv[2] || '');
assert(!path.relative(root, dir).split(path.sep).every(p => p !== '..'), 'Use private output outside the repo');
const cfg = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
const url = cfg.match(/SUPABASE_URL:\s*"([^"]+)"/)[1];
const key = cfg.match(/SUPABASE_ANON_KEY:\s*"([^"]+)"/)[1];
const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
async function request(query, init = {}) {
  const r = await fetch(url + '/rest/v1/test_items?' + query, { ...init, headers: { ...headers, ...init.headers }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('Database response ' + r.status + ': ' + (await r.text()).slice(0, 300));
  return r.status === 204 ? null : r.json();
}
(async () => {
  const rows = JSON.parse(fs.readFileSync(path.join(dir, 'bilingual_items.json'), 'utf8')).filter(r => ['1', '2'].includes(r.test));
  assert.equal(rows.length, 24);
  for (const row of rows) {
    assert.equal(row.exam, 'barron600'); assert.equal(row.part, 8);
    assert.equal(row.opts.length, 4); assert.match(row.answer, /^[A-D]$/);
    assert(row.i18n.vi.passage_pairs.every(p => p.en && p.vi));
    assert.equal((row.passage.match(/-------\(\d+\)/g) || []).length, 12);
  }
  const query = 'exam=eq.barron600&test=in.(1,2)&part=eq.8';
  const before = await request(query + '&select=*');
  console.log(JSON.stringify({ phase: 'preflight', incoming: rows.length, existing: before.length, bytes: Buffer.byteLength(JSON.stringify(rows)) }));
  if (!process.argv.includes('--apply')) return;
  const backup = path.join(dir, 'backup_before_import_' + Date.now() + '.json');
  fs.writeFileSync(backup, JSON.stringify(before, null, 1), { flag: 'wx' });
  await request('on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(rows) });
  const after = await request(query + '&select=*');
  for (const row of rows) {
    const actual = after.find(r => r.id === row.id);
    assert(actual, 'Missing row ' + row.id);
    for (const field of ['exam', 'test', 'part', 'num', 'stem', 'passage', 'opts', 'answer', 'i18n']) assert.deepEqual(actual[field], row[field], row.id + ':' + field);
  }
  console.log(JSON.stringify({ phase: 'verified', items: rows.length, lessons: 2, backup }));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
