/* Validate a complete private book dataset. Never upload source book passages.
   node tools/barron/import_bilingual.js <private directory>
   To play: package_private.py builds an offline HTML outside the public checkout.
*/
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { validateRows } = require('../../learn/barron/player.js');
const root = fs.realpathSync(path.resolve(__dirname, '../..'));
if (!process.argv[2]) throw new Error('Provide the private dataset directory.');
const dir = fs.realpathSync(path.resolve(process.argv[2]));
const relative = path.relative(root, dir);
assert(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative),
       'Book content must stay outside the public checkout.');
assert(!process.argv.includes('--apply'),
       'Cloud import disabled: the approved book dataset stays private. Use package_private.py.');
const rows = JSON.parse(fs.readFileSync(path.join(dir, 'bilingual_items.json'), 'utf8'));
const lessons = validateRows(rows);
console.log(JSON.stringify({ phase: 'validated-private', lessons: lessons.length, items: rows.length, cloudWrites: 0 }));
