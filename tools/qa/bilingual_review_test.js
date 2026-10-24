/* Offline regression checks against the real review renderer; no Supabase writes. */
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('js/game.js', 'utf8');
const start = source.indexOf('  function toeicBilingual(');
const end = source.indexOf('  /* TS-012:', start);
const context = {
  G: { myLang: 'vi', st: {} },
  effLang: () => context.G.myLang,
  esc: s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  FLAG: { vi: 'VI', en: 'EN' }, T: s => s, toeicTraps: () => ''
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const q = { type: 'toeic', ans: '(A) yes', i18n: { vi: {
  passage_pairs: [{ en: 'First <script> & sentence.', vi: 'Câu một.' }, { en: 'Second sentence.', vi: 'Câu hai.' }]
} } };
const html = context.toeicExpl(q);
assert(html.includes('&lt;script&gt; &amp;'));
const ordered = ['First', 'Câu một.', 'Second sentence.', 'Câu hai.'].map(x => html.indexOf(x));
assert(ordered.every((x, i) => x >= 0 && (!i || x > ordered[i - 1])));
assert(!html.includes('<details'), 'Bilingual review must be expanded');
assert(!html.includes('<script>'));
context.G.myLang = 'en';
assert.equal(context.toeicExpl(q), html, 'Explicit English/Vietnamese pairs stay bilingual');
q.i18n.vi.explain = 'Explanation';
q.i18n.vi.passage = 'Legacy translation';
context.G.myLang = 'vi';
assert(!context.toeicExpl(q).includes('Legacy translation'), 'Do not duplicate paired passage');
delete q.i18n.vi.passage_pairs;
assert(context.toeicExpl(q).includes('<details'), 'Existing TOEIC presentation stays available');
q.i18n.vi.passage_pairs = [{ en: 'Missing translation' }];
assert(context.toeicExpl(q).includes('Legacy translation'), 'Malformed alignment falls back without dropping text');
assert.equal(context.toeicExpl({ ...q, ans: '' }), '', 'Do not expose review before an answer is available');
console.log('PASS: bilingual order, escaping, expanded display, no-explanation support, language choice, legacy fallback, answer gate');
