/* Synthetic fixture only. No book text or network. Run from repository root. */
const assert = require('node:assert/strict');
const { validateRows, score } = require('../../learn/barron/player.js');
function fixture() {
  const rows = [];
  for (let lesson = 1; lesson <= 50; lesson++) {
    const words = Array.from({ length: 12 }, (_, n) => 'sample' + (n + 1));
    const passage = words.map((_, n) => 'Choose -------(' + (n + 1) + ').').join(' ');
    const en = words.map(w => 'Choose ' + w + '.').join(' ');
    for (let n = 0; n < 12; n++) rows.push({
      id: `synthetic_${lesson}_${n + 1}`, exam: 'barron600', test: String(lesson), part: 8, num: n + 1,
      passage, opts: [words[n], 'other', 'alternative', 'different'].map((w, i) => '(' + 'ABCD'[i] + ') ' + w), answer: 'A',
      i18n: { vi: { passage_pairs: [{ en, vi: 'Đoạn văn mẫu tự viết để kiểm tra.' }] } }
    });
  }
  return rows;
}
const rows = fixture();
assert.equal(validateRows(rows).length, 50);
assert.deepEqual(score(rows.slice(0, 12), { 1: 'A', 2: 'B' }), { correct: 1, answered: 2, total: 12 });
function rejects(mutate, pattern) { const input = structuredClone(rows); mutate(input); assert.throws(() => validateRows(input), pattern); }
rejects(r => r.pop(), /600/);
rejects(r => { r[1].id = r[0].id; }, /trùng/);
rejects(r => { r[0].test = '51'; }, /1–50/);
rejects(r => { r[0].part = 5; }, /Words in Context/);
rejects(r => { r[0].num = 2; }, /trùng/);
rejects(r => { r[0].opts[0] = '(B) sample1'; }, /nhãn/);
rejects(r => { r[0].answer = 'E'; }, /A–D/);
rejects(r => { r[0].i18n.vi.passage_pairs[0].vi = ''; }, /Anh–Việt/);
rejects(r => { r[0].passage = 'No gaps'; }, /12 chỗ/);
rejects(r => { r[0].i18n.vi.passage_pairs[0].en = 'Wrong source'; }, /chung bài đọc/);
rejects(r => { for (let i = 0; i < 12; i++) r[i].i18n.vi.passage_pairs[0].en = 'Wrong source'; }, /khôi phục/);
console.log('PASS private player: all50 validation, scoring, counts, IDs, Lesson bounds, part, labels, answers, missing translation, gaps and exact reconstruction.');
module.exports = { fixture };
