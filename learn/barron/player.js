/* Private source files stay in memory. No requests, database writes or text persistence. */
(function (root) {
  'use strict';
  var letters = 'ABCD';
  function fail(message) { throw new Error(message); }
  function validateRows(rows) {
    if (!Array.isArray(rows) || rows.length !== 600) fail('Bộ dữ liệu phải có đủ 600 câu (50 bài × 12 câu).');
    var lessons = Array.from({ length: 50 }, function () { return []; });
    var ids = new Set();
    rows.forEach(function (row) {
      if (!row || row.exam !== 'barron600' || row.part !== 8 || !/^(?:[1-9]|[1-4][0-9]|50)$/.test(String(row.test))) fail('Có câu không thuộc Words in Context, Lesson 1–50.');
      var lesson = Number(row.test), num = row.num;
      if (!Number.isInteger(num) || num < 1 || num > 12 || lessons[lesson - 1][num - 1]) fail('Thiếu hoặc trùng số câu trong một bài.');
      if (typeof row.id !== 'string' || !row.id || ids.has(row.id)) fail('Mã câu hỏi thiếu hoặc bị trùng.');
      ids.add(row.id);
      if (!Array.isArray(row.opts) || row.opts.length !== 4 || !/^[A-D]$/.test(row.answer)) fail('Câu hỏi phải có 4 lựa chọn và đáp án A–D.');
      var words = row.opts.map(function (opt, i) {
        if (typeof opt !== 'string' || !opt.startsWith('(' + letters[i] + ') ') || !opt.slice(4).trim()) fail('Lựa chọn phải có nhãn (A), (B), (C), (D).');
        return opt.slice(4).trim().toLowerCase();
      });
      if (new Set(words).size !== 4) fail('Có đáp án lựa chọn trùng nhau.');
      if (typeof row.passage !== 'string' || !row.passage.trim()) fail('Bài đọc bị trống.');
      var gaps = Array.from(row.passage.matchAll(/-------\((\d+)\)/g), function (m) { return Number(m[1]); });
      if (gaps.length !== 12 || gaps.some(function (n, i) { return n !== i + 1; })) fail('Bài đọc phải có đúng 12 chỗ trống theo thứ tự.');
      var pairs = row.i18n && row.i18n.vi && row.i18n.vi.passage_pairs;
      if (!Array.isArray(pairs) || !pairs.length || pairs.some(function (p) { return !p || typeof p.en !== 'string' || !p.en.trim() || typeof p.vi !== 'string' || !p.vi.trim(); })) fail('Có đoạn thiếu cặp Anh–Việt.');
      lessons[lesson - 1][num - 1] = row;
    });
    lessons.forEach(function (items) {
      if (items.length !== 12 || Array.from({ length: 12 }, function (_, i) { return items[i]; }).some(function (x) { return !x; })) fail('Chưa đủ 12 câu trong mỗi bài.');
      var first = items[0], pairs = JSON.stringify(first.i18n.vi.passage_pairs);
      if (items.some(function (r) { return r.passage !== first.passage || JSON.stringify(r.i18n.vi.passage_pairs) !== pairs; })) fail('Các câu trong cùng bài không dùng chung bài đọc và bản dịch.');
      var answers = items.map(function (r) { return r.opts[letters.indexOf(r.answer)].slice(4).trim(); });
      if (new Set(answers.map(function (a) { return a.toLowerCase(); })).size !== 12) fail('12 từ đáp án trong một bài phải khác nhau.');
      var restored = first.passage.replace(/-------\((\d+)\)/g, function (_, n) { return answers[Number(n) - 1]; });
      var normalize = function (s) { return s.replace(/\s+/g, ' ').trim().toLowerCase(); };
      var original = first.i18n.vi.passage_pairs.map(function (p) { return p.en; }).join('\n\n');
      if (normalize(restored) !== normalize(original)) fail('Điền đáp án chưa khôi phục đúng nguyên văn bài đọc.');
    });
    return lessons;
  }
  function score(items, choices) {
    return items.reduce(function (s, row) {
      if (choices[row.num]) s.answered++;
      if (choices[row.num] === row.answer) s.correct++;
      return s;
    }, { correct: 0, answered: 0, total: items.length });
  }
  var api = { validateRows: validateRows, score: score };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root || !root.document) return;
  root.BarronPrivate = api;
  var doc = root.document, $ = function (id) { return doc.getElementById(id); };
  var lessons = null, current = 0, question = 0, submitted = false, choices = {};
  function element(tag, cls, text) {
    var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e;
  }
  function items() { return lessons[current]; }
  function reset() { choices = {}; submitted = false; question = 0; $('mistakes').checked = false; render(); }
  function selectLesson(n) { current = Math.max(0, Math.min(49, n)); $('lesson').value = String(current); reset(); }
  function renderPassage() {
    var box = $('passage'), text = items()[0].passage, cursor = 0;
    box.replaceChildren();
    text.replace(/-------\((\d+)\)/g, function (match, n, offset) {
      box.append(doc.createTextNode(text.slice(cursor, offset)), element('span', 'gap', '(' + n + ') …'));
      cursor = offset + match.length; return match;
    });
    box.append(doc.createTextNode(text.slice(cursor)));
  }
  function renderQuestions() {
    var box = $('questions'), single = $('mode').value === 'single'; box.replaceChildren();
    items().forEach(function (row, i) {
      if (single && question !== i) return;
      var field = element('fieldset'), legend = element('legend', '', 'Câu ' + row.num), opts = element('div', 'options');
      field.append(legend, opts);
      row.opts.forEach(function (opt, j) {
        var label = element('label', 'option'), input = doc.createElement('input');
        input.type = 'radio'; input.name = 'q' + row.num; input.value = letters[j]; input.checked = choices[row.num] === letters[j]; input.disabled = submitted;
        input.addEventListener('change', function () { choices[row.num] = input.value; renderProgress(); });
        label.append(input, element('span', '', opt)); opts.append(label);
      });
      box.append(field);
    });
    $('question-nav').hidden = !single;
    $('question-position').textContent = 'Câu ' + (question + 1) + ' / 12';
    $('previous-question').disabled = question === 0; $('next-question').disabled = question === 11;
  }
  function renderProgress() {
    var s = score(items(), choices);
    $('progress').textContent = submitted ? s.correct + ' / 12 đúng' : s.answered + ' / 12 đã chọn';
  }
  function renderReview() {
    $('result').hidden = !submitted;
    var answerBox = $('answer-review'), bilingual = $('bilingual'); answerBox.replaceChildren(); bilingual.replaceChildren();
    if (!submitted) return;
    var s = score(items(), choices);
    $('score').textContent = s.correct + ' / 12 câu đúng';
    $('result-detail').textContent = 'Đã trả lời ' + s.answered + '/12 câu. Chọn “Làm lại bài này” để thử lại.';
    items().forEach(function (row) {
      var correct = choices[row.num] === row.answer;
      if ($('mistakes').checked && correct) return;
      var review = element('div', 'answer-row' + (correct ? '' : ' wrong'));
      review.append(element('strong', '', (correct ? '✓ ' : '○ ') + 'Câu ' + row.num + ' · ' + row.opts[letters.indexOf(row.answer)]));
      review.append(element('p', 'answer-status', choices[row.num] ? 'Bạn chọn: ' + row.opts[letters.indexOf(choices[row.num])] : 'Bạn chưa chọn đáp án.'));
      answerBox.append(review);
    });
    if (!answerBox.childElementCount) answerBox.append(element('p', '', 'Không có câu sai. Bạn đã trả lời đúng cả bài!'));
    items()[0].i18n.vi.passage_pairs.forEach(function (pair) {
      var block = element('div', 'pair'), en = element('p', 'english'), vi = element('p', 'vietnamese');
      en.lang = 'en'; vi.lang = 'vi';
      en.append(element('span', 'lang-label', 'ENGLISH'), doc.createTextNode(pair.en));
      vi.append(element('span', 'lang-label', 'TIẾNG VIỆT'), doc.createTextNode(pair.vi));
      block.append(en, vi); bilingual.append(block);
    });
  }
  function render() {
    $('lesson-label').textContent = 'LESSON ' + (current + 1) + ' / 50';
    var first = items()[0]; $('lesson-title').textContent = first.lesson_title || first.title || 'Words in Context';
    $('previous').disabled = current === 0; $('next').disabled = current === 49; $('submit').disabled = submitted;
    renderPassage(); renderQuestions(); renderProgress(); renderReview();
  }
  api.load = function (rows) {
    var checked = validateRows(rows); // Atomic load: malformed files leave existing study data intact.
    lessons = checked; current = 0;
    $('lesson').replaceChildren();
    lessons.forEach(function (rows, i) {
      var title = rows[0].lesson_title || rows[0].title || 'Words in Context';
      var option = element('option', '', 'Lesson ' + (i + 1) + ' · ' + title); option.value = String(i); $('lesson').append(option);
    });
    $('workspace').hidden = false; $('file-status').className = ''; $('file-status').textContent = 'Đã mở đủ 50 bài · 600 câu. Dữ liệu chỉ ở trong phiên này.';
    reset(); return { lessons: 50, items: 600 };
  };
  $('data-file').addEventListener('change', async function () {
    var file = this.files[0]; if (!file) return;
    try {
      if (file.size > 25 * 1024 * 1024) fail('File lớn hơn 25 MB. Hãy chọn bộ JSON Barron đã xử lý.');
      api.load(JSON.parse(await file.text()));
    } catch (err) { $('file-status').className = 'error'; $('file-status').textContent = 'Chưa mở được: ' + err.message; }
    this.value = '';
  });
  $('lesson').addEventListener('change', function () { selectLesson(Number(this.value)); });
  $('mode').addEventListener('change', renderQuestions);
  $('previous').addEventListener('click', function () { selectLesson(current - 1); });
  $('next').addEventListener('click', function () { selectLesson(current + 1); });
  $('previous-question').addEventListener('click', function () { question = Math.max(0, question - 1); renderQuestions(); });
  $('next-question').addEventListener('click', function () { question = Math.min(11, question + 1); renderQuestions(); });
  $('reset').addEventListener('click', reset);
  $('mistakes').addEventListener('change', renderReview);
  $('answers').addEventListener('submit', function (event) {
    event.preventDefault(); submitted = true; render(); $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  var bundled = $('barron-data');
  if (bundled) {
    try { api.load(JSON.parse(bundled.textContent)); }
    catch (err) { $('file-status').className = 'error'; $('file-status').textContent = 'Bộ dữ liệu chưa hợp lệ: ' + err.message; }
  }
})(typeof window !== 'undefined' ? window : null);
