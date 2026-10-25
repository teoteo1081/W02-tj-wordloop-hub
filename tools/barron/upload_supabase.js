/* Explicitly requested cloud publishing of the complete Barron dataset.
   node tools/barron/upload_supabase.js <private-directory> [--apply]
   Public test_items is anonymously readable. No book text or keys go into Git/logs.
*/
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { validateRows } = require('../../learn/barron/player.js');
const root = fs.realpathSync(path.resolve(__dirname, '../..'));
assert(process.argv[2], 'Provide a private dataset directory.');
const dir = fs.realpathSync(path.resolve(process.argv[2]));
const relative = path.relative(root, dir);
assert(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative), 'Keep book data and backups outside public Git.');
const input = JSON.parse(fs.readFileSync(path.join(dir, 'bilingual_items.json'), 'utf8'));
validateRows(input);
for (const row of input) {
  const expected = `barron600_l${String(row.test).padStart(2, '0')}_wic_${String(row.num).padStart(2, '0')}`;
  assert.equal(row.id, expected, 'Unexpected question ID; abort before network access.');
}
const allowed = ['id', 'exam', 'test', 'part', 'num', 'stem', 'opts', 'answer', 'answer_src', 'tag', 'passage', 'i18n'];
const rows = input.map(row => {
  const output = Object.fromEntries(allowed.map(key => [key, row[key]]));
  output.src = `barron600:translation-pdf:${row.source.translation_pdf_page};key-pdf:${row.source.key_pdf_page}`;
  output.i18n = { ...row.i18n, lesson_title: row.lesson_title };
  return output;
});
const cfg = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
const url = cfg.match(/SUPABASE_URL:\s*"([^"]+)"/)[1];
const key = cfg.match(/SUPABASE_ANON_KEY:\s*"([^"]+)"/)[1];
const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
async function request(query, options = {}) {
  const response = await fetch(url + '/rest/v1/test_items?' + query, {
    ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(`Supabase ${options.method || 'GET'} failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}
async function readAll() {
  const out = [];
  for (let offset = 0; ; offset += 500) {
    const chunk = await request(`exam=eq.barron600&select=*&order=id&offset=${offset}&limit=500`);
    out.push(...chunk);
    if (chunk.length < 500) return out;
  }
}
(async () => {
  const before = await readAll();
  const byId = new Map(before.map(row => [row.id, row]));
  const collisions = await request('id=like.barron600_l*&exam=neq.barron600&select=id');
  assert.equal(collisions.length, 0, 'A Barron ID belongs to another exam; abort.');
  console.log(JSON.stringify({ phase: 'preflight', lessons: 50, items: rows.length, existing: before.length, bytes: Buffer.byteLength(JSON.stringify(rows)), anonymouslyReadable: true }));
  if (!process.argv.includes('--apply')) return;
  const normalize = actual => Object.fromEntries([...allowed, 'src'].map(field => [field, actual[field]]));
  for (const row of rows.filter(row => byId.has(row.id))) {
    assert.deepEqual(normalize(byId.get(row.id)), row, 'Existing content differs; refusing overwrite.');
  }
  const pending = rows.filter(row => !byId.has(row.id));
  const backupDir = path.join(dir, 'supabase', String(Date.now()));
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, 'before.json'), JSON.stringify(before, null, 1), { flag: 'wx' });
  const manifest = { status: 'started', ids: rows.map(row => row.id), insertedIds: rows.filter(row => !byId.has(row.id)).map(row => row.id), changedIds: [], backupDir };
  const persist = () => fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  persist();
  for (let start = 0; start < pending.length; start += 120) {
    const batch = pending.slice(start, start + 120);
    const result = await request('', {
      method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(batch)
    });
    assert.equal(result.length, batch.length);
    manifest.changedIds.push(...batch.map(row => row.id));
    persist();
  }
  const after = await readAll();
  const actualById = new Map(after.map(row => [row.id, row]));
  for (const row of rows) {
    assert(actualById.has(row.id), 'Missing uploaded ID');
    assert.deepEqual(normalize(actualById.get(row.id)), row, 'Readback differs from prepared data');
  }
  for (const row of before.filter(row => !rows.some(expected => expected.id === row.id))) {
    assert.deepEqual(actualById.get(row.id), row, 'Unexpected change to pre-existing unrelated Barron row');
  }
  for (let lesson = 1; lesson <= 50; lesson++) {
    assert.equal(after.filter(row => row.test === String(lesson) && row.part === 8).length, 12, 'Lesson count differs');
  }
  manifest.status = 'verified';
  manifest.expectedSha256 = hash(rows);
  manifest.actualSha256 = hash(rows.map(row => normalize(actualById.get(row.id))));
  assert.equal(manifest.expectedSha256, manifest.actualSha256, 'Readback content hashes differ');
  manifest.items = 600; manifest.lessons = 50;
  persist();
  fs.writeFileSync(path.join(backupDir, 'after.json'), JSON.stringify(after, null, 1), { flag: 'wx' });
  console.log(JSON.stringify({ phase: manifest.status, lessons: 50, items: 600, matchingHashes: manifest.expectedSha256 === manifest.actualSha256, backupDir }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
