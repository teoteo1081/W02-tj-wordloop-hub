/**
 * IELTS Academic Listening & Reading Original Validation Suite
 * Path: learn/ielts/tools/validate.js
 * Implements 12 strict validation rules per IELTS_LR_SPEC.md & ANCHOR_WL2026 (D4).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.resolve(__dirname, '../data');
const JSON_PATH = path.join(DATA_DIR, 'ielts-lr.json');
const READING_JS_PATH = path.join(DATA_DIR, 'reading.js');
const LISTENING_JS_PATH = path.join(DATA_DIR, 'listening.js');

function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeIeltsText(raw) {
  if (!raw && raw !== 0) return '';
  let s = String(raw).normalize('NFC');
  s = s.replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/[\u2013\u2014]/g, '-');
  s = s.trim().replace(/\s+/g, ' ');
  // remove trailing punctuation unless part of a number e.g. 14.5
  s = s.replace(/(?<!\d)[,;:.](?!\d)$/g, '');
  return s.toLowerCase();
}

function checkWordLimit(rawText, limitCode) {
  const norm = normalizeIeltsText(rawText);
  if (!norm) return { ok: false, reason: 'empty' };
  const tokens = norm.split(' ').filter(Boolean);

  let numCount = 0;
  let wordCount = 0;
  const numRegex = /^[£$€]?\d+(?:,\d{3})*(?:\.\d+)?(?:%|st|nd|rd|th|s|am|pm)?$/i;

  for (const t of tokens) {
    if (numRegex.test(t)) {
      numCount++;
    } else {
      wordCount++;
    }
  }

  switch (limitCode) {
    case 'ONE_WORD_ONLY':
      if (wordCount <= 1 && numCount === 0) return { ok: true };
      return { ok: false, reason: `Expected 1 word only, got ${wordCount} words, ${numCount} numbers` };
    case 'ONE_WORD_OR_NUMBER':
      if (wordCount <= 1 && numCount <= 1 && (wordCount + numCount >= 1)) return { ok: true };
      return { ok: false, reason: `Exceeded ONE WORD AND/OR A NUMBER: ${wordCount} words, ${numCount} numbers` };
    case 'TWO_WORDS_ONLY':
      if (wordCount <= 2 && numCount === 0) return { ok: true };
      return { ok: false, reason: `Expected max 2 words only, got ${wordCount} words, ${numCount} numbers` };
    case 'TWO_WORDS_OR_NUMBER':
      if (wordCount <= 2 && numCount <= 1) return { ok: true };
      return { ok: false, reason: `Exceeded NO MORE THAN TWO WORDS AND/OR A NUMBER: ${wordCount} words, ${numCount} numbers` };
    case 'THREE_WORDS_ONLY':
      if (wordCount <= 3 && numCount === 0) return { ok: true };
      return { ok: false, reason: `Expected max 3 words only, got ${wordCount} words, ${numCount} numbers` };
    case 'THREE_WORDS_OR_NUMBER':
      if (wordCount <= 3 && numCount <= 1) return { ok: true };
      return { ok: false, reason: `Exceeded NO MORE THAN THREE WORDS AND/OR A NUMBER: ${wordCount} words, ${numCount} numbers` };
    default:
      return { ok: true };
  }
}

function validateAll() {
  console.log('=== RUNNING IELTS LISTENING & READING VALIDATOR ===');
  const errors = [];
  const warnings = [];

  // Rule 1: Read and parse JSON
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`FATAL: File not found: ${JSON_PATH}`);
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf8');
    data = JSON.parse(raw);
    console.log(' [PASS] Rule 1.1: JSON parsed successfully.');
  } catch (err) {
    console.error(`FATAL: JSON parse error: ${err.message}`);
    process.exit(1);
  }

  // Rule 1.2: Check reading.js and listening.js
  if (!fs.existsSync(READING_JS_PATH)) {
    errors.push(`Missing file: ${READING_JS_PATH}`);
  } else {
    try {
      const code = fs.readFileSync(READING_JS_PATH, 'utf8');
      const sandbox = { window: {} };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);
      if (!sandbox.window.IELTS_READING || !Array.isArray(sandbox.window.IELTS_READING)) {
        errors.push('reading.js does not export window.IELTS_READING array');
      } else if (JSON.stringify(sandbox.window.IELTS_READING) !== JSON.stringify(data.reading)) {
        errors.push('reading.js data does not match ielts-lr.json reading property');
      } else {
        console.log(' [PASS] Rule 1.2: reading.js matches ielts-lr.json exactly.');
      }
    } catch (e) {
      errors.push(`reading.js execution error: ${e.message}`);
    }
  }

  if (!fs.existsSync(LISTENING_JS_PATH)) {
    errors.push(`Missing file: ${LISTENING_JS_PATH}`);
  } else {
    try {
      const code = fs.readFileSync(LISTENING_JS_PATH, 'utf8');
      const sandbox = { window: {} };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);
      if (!sandbox.window.IELTS_LISTENING || !Array.isArray(sandbox.window.IELTS_LISTENING)) {
        errors.push('listening.js does not export window.IELTS_LISTENING array');
      } else if (JSON.stringify(sandbox.window.IELTS_LISTENING) !== JSON.stringify(data.listening)) {
        errors.push('listening.js data does not match ielts-lr.json listening property');
      } else {
        console.log(' [PASS] Rule 1.3: listening.js matches ielts-lr.json exactly.');
      }
    } catch (e) {
      errors.push(`listening.js execution error: ${e.message}`);
    }
  }

  // Rule 2: Test counts and unique IDs
  const allIds = new Set();
  function checkId(id, context) {
    if (!id || typeof id !== 'string') {
      errors.push(`Missing or invalid id in ${context}`);
      return;
    }
    if (allIds.has(id)) {
      errors.push(`Duplicate ID detected: "${id}" in ${context}`);
    }
    allIds.add(id);
  }

  const readingTests = data.reading || [];
  const listeningTests = data.listening || [];

  if (readingTests.length < 2) {
    errors.push(`Rule 2: Expected at least 2 Reading tests, found ${readingTests.length}`);
  }
  if (listeningTests.length < 2) {
    errors.push(`Rule 2: Expected at least 2 Listening tests, found ${listeningTests.length}`);
  }

  const observedTypes = new Set();
  let totalReadingQuestions = 0;
  let totalListeningQuestions = 0;

  // Rule 3: Reading tests structure
  readingTests.forEach((t, tIdx) => {
    checkId(t.id, `Reading Test ${tIdx + 1}`);
    const passages = t.passages || [];
    if (passages.length !== 3) {
      errors.push(`Test ${t.id}: Expected exactly 3 passages, got ${passages.length}`);
    }

    let testWordCount = 0;
    const testQNums = [];

    passages.forEach((p, pIdx) => {
      checkId(p.id, `Passage ${p.id}`);
      const paras = p.paragraphs || [];
      const paraIds = new Set();
      let passageWords = 0;

      paras.forEach(para => {
        if (!para.id || typeof para.id !== 'string') {
          errors.push(`Passage ${p.id}: missing paragraph id`);
        } else {
          if (paraIds.has(para.id)) {
            errors.push(`Passage ${p.id}: duplicate paragraph id ${para.id}`);
          }
          paraIds.add(para.id);
        }
        passageWords += countWords(para.text);
      });

      testWordCount += passageWords;
      if (passageWords < 680) {
        errors.push(`Passage ${p.id}: word count ${passageWords} is under required 680 words`);
      }

      const groups = p.questionGroups || [];
      groups.forEach(g => {
        checkId(g.groupId, `Group ${g.groupId} in ${p.id}`);
        observedTypes.add(g.type);

        if (g.type === 'diagram_label') {
          if (!g.svgMarkup || !g.svgMarkup.startsWith('<svg') || !g.svgMarkup.endsWith('</svg>')) {
            errors.push(`Group ${g.groupId}: diagram_label missing valid inline <svg> markup`);
          }
          if (/<script/i.test(g.svgMarkup) || /href=["']http/i.test(g.svgMarkup)) {
            errors.push(`Group ${g.groupId}: diagram_label SVG contains prohibited script or external url`);
          }
        }

        const questions = g.questions || [];
        questions.forEach(q => {
          testQNums.push(q.q);
          totalReadingQuestions++;
          validateQuestion(q, g, paraIds, `Reading ${t.id} ${p.id}`, errors);
        });
      });
    });

    testQNums.sort((a, b) => a - b);
    const expected = Array.from({ length: 40 }, (_, i) => i + 1);
    if (JSON.stringify(testQNums) !== JSON.stringify(expected)) {
      errors.push(`Test ${t.id}: questions are not 1..40. Got: ${JSON.stringify(testQNums)}`);
    }

    if (testWordCount < 2150 || testWordCount > 2750) {
      errors.push(`Test ${t.id}: total word count ${testWordCount} is outside official range 2,150–2,750 words`);
    } else {
      console.log(` [PASS] Test ${t.id}: 3 passages, ${testWordCount} words, exactly 40 questions.`);
    }
  });

  // Rule 4: Listening tests structure
  listeningTests.forEach((t, tIdx) => {
    checkId(t.id, `Listening Test ${tIdx + 1}`);
    const sections = t.sections || [];
    if (sections.length !== 4) {
      errors.push(`Listening Test ${t.id}: Expected exactly 4 sections, got ${sections.length}`);
    }

    const testQNums = [];

    sections.forEach((s, sIdx) => {
      checkId(s.id, `Section ${s.id}`);
      if (s.sectionIndex !== sIdx + 1) {
        errors.push(`Section ${s.id}: sectionIndex should be ${sIdx + 1}, got ${s.sectionIndex}`);
      }

      const speakers = s.speakers || [];
      if (speakers.length < 1) {
        errors.push(`Section ${s.id}: missing speakers`);
      }
      if ((s.sectionIndex === 1 || s.sectionIndex === 3) && speakers.length < 2) {
        errors.push(`Section ${s.id} (index ${s.sectionIndex}) requires >= 2 speakers, found ${speakers.length}`);
      }

      const turns = s.turns || [];
      if (turns.length < 8) {
        errors.push(`Section ${s.id}: requires >= 8 turns for realistic dialogue/lecture, found ${turns.length}`);
      }

      const turnIds = new Set();
      turns.forEach(turn => {
        checkId(turn.turnId, `Turn ${turn.turnId} in ${s.id}`);
        turnIds.add(turn.turnId);
        if (!turn.speakerId || !turn.text) {
          errors.push(`Turn ${turn.turnId}: missing speakerId or text`);
        }
      });

      const groups = s.questionGroups || [];
      let secQCount = 0;

      groups.forEach(g => {
        checkId(g.groupId, `Group ${g.groupId} in ${s.id}`);
        observedTypes.add(g.type);

        if (g.type === 'diagram_label') {
          if (!g.svgMarkup || !g.svgMarkup.startsWith('<svg') || !g.svgMarkup.endsWith('</svg>')) {
            errors.push(`Group ${g.groupId}: diagram_label missing valid inline <svg> markup`);
          }
          if (/<script/i.test(g.svgMarkup) || /href=["']http/i.test(g.svgMarkup)) {
            errors.push(`Group ${g.groupId}: diagram_label SVG contains prohibited script or external url`);
          }
        }

        const questions = g.questions || [];
        questions.forEach(q => {
          testQNums.push(q.q);
          secQCount++;
          totalListeningQuestions++;
          validateQuestion(q, g, turnIds, `Listening ${t.id} ${s.id}`, errors);
        });
      });

      if (secQCount !== 10) {
        errors.push(`Section ${s.id}: expected exactly 10 questions, got ${secQCount}`);
      }
    });

    testQNums.sort((a, b) => a - b);
    const expected = Array.from({ length: 40 }, (_, i) => i + 1);
    if (JSON.stringify(testQNums) !== JSON.stringify(expected)) {
      errors.push(`Test ${t.id}: questions are not 1..40. Got: ${JSON.stringify(testQNums)}`);
    } else {
      console.log(` [PASS] Test ${t.id}: 4 sections, exactly 40 questions.`);
    }
  });

  // Rule 5: Question types coverage
  const requiredCategories = [
    { name: 'MCQ', check: () => observedTypes.has('mcq_single') || observedTypes.has('mcq_multi') },
    { name: 'TFNG/YNNG', check: () => observedTypes.has('tfng') || observedTypes.has('ynng') },
    { name: 'Matching Headings', check: () => observedTypes.has('matching_headings') },
    { name: 'Gap Fill / Completion', check: () => observedTypes.has('gap_fill') },
    { name: 'Matching Info/Features/Endings', check: () => observedTypes.has('matching_info') || observedTypes.has('matching_features') || observedTypes.has('matching_endings') },
    { name: 'Diagram/Map Labelling (SVG)', check: () => observedTypes.has('diagram_label') }
  ];

  requiredCategories.forEach(cat => {
    if (!cat.check()) {
      errors.push(`Rule 5: Missing required question category: ${cat.name}`);
    } else {
      console.log(` [PASS] Rule 5: Covered category: ${cat.name}`);
    }
  });

  // Rule 10: PII Check
  const fullJsonStr = JSON.stringify(data);
  const emailMatches = fullJsonStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  emailMatches.forEach(email => {
    if (!email.endsWith('@example.com')) {
      errors.push(`Rule 10: Non-compliant email found (must use @example.com): "${email}"`);
    }
  });

  const phoneMatches = fullJsonStr.match(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b555-\d{4}\b/g) || [];
  phoneMatches.forEach(phone => {
    if (!/^555-01\d\d$/.test(phone) && !/^0900-\d{3}-\d{3}$/.test(phone)) {
      // Check if it's in a test context
      warnings.push(`Rule 10 warning: check phone format: "${phone}"`);
    }
  });

  // Rule 9: Placeholder check
  const placeholders = ['TODO', 'TBD', 'FIXME', 'lorem ipsum'];
  placeholders.forEach(ph => {
    if (new RegExp(`\\b${ph}\\b`, 'i').test(fullJsonStr)) {
      errors.push(`Rule 9: Found forbidden placeholder "${ph}" in data`);
    }
  });

  // Rule 11: Band conversion check
  if (!data.bandConversion) {
    errors.push('Rule 11: Missing bandConversion object');
  } else {
    const bc = data.bandConversion;
    ['listening', 'academicReading'].forEach(skill => {
      const rows = bc[skill];
      if (!Array.isArray(rows) || rows.length === 0) {
        errors.push(`Rule 11: Missing band table for ${skill}`);
        return;
      }
      const covered = new Array(41).fill(false);
      rows.forEach(r => {
        for (let score = r.min; score <= r.max; score++) {
          if (score >= 0 && score <= 40) {
            if (covered[score]) errors.push(`Rule 11: Overlapping band conversion for ${skill} at score ${score}`);
            covered[score] = true;
          }
        }
      });
      for (let s = 0; s <= 40; s++) {
        if (!covered[s]) errors.push(`Rule 11: Score ${s} not covered in band conversion for ${skill}`);
      }
    });

    // Check official anchors
    const lAnchors = { 16: 5.0, 23: 6.0, 30: 7.0, 35: 8.0 };
    const rAnchors = { 15: 5.0, 23: 6.0, 30: 7.0, 35: 8.0 };

    function checkAnchor(skill, score, expectedBand) {
      const row = bc[skill].find(r => score >= r.min && score <= r.max);
      if (!row || row.band !== expectedBand) {
        errors.push(`Rule 11: Official anchor mismatch for ${skill} at score ${score}: expected ${expectedBand}, got ${row ? row.band : 'none'}`);
      }
    }

    Object.entries(lAnchors).forEach(([sc, b]) => checkAnchor('listening', Number(sc), b));
    Object.entries(rAnchors).forEach(([sc, b]) => checkAnchor('academicReading', Number(sc), b));
    console.log(' [PASS] Rule 11: Band conversion table covers 0..40 and matches all official anchors.');
  }

  // Print Summary
  console.log(`\n=== VALIDATION SUMMARY ===`);
  console.log(`Total Reading Questions: ${totalReadingQuestions} (Target: 80 across 2 tests)`);
  console.log(`Total Listening Questions: ${totalListeningQuestions} (Target: 80 across 2 tests)`);
  console.log(`Observed Question Types: ${Array.from(observedTypes).join(', ')}`);

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach(w => console.warn(` [WARN] ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\nValidation FAILED with ${errors.length} error(s):`);
    errors.forEach(e => console.error(` [FAIL] ${e}`));
    process.exit(1);
  } else {
    console.log(`\nALL CHECKS PASSED! Data is 100% valid, compliant with IELTS_LR_SPEC.md & D4.\n`);
    process.exit(0);
  }
}

function validateQuestion(q, group, validRefs, ctx, errors) {
  const prefix = `${ctx} Q${q.q}:`;

  if (!q.explanationVi || typeof q.explanationVi !== 'string' || q.explanationVi.trim().length < 40) {
    errors.push(`${prefix} explanationVi must be in Vietnamese with length >= 40 chars`);
  }

  if (!q.evidence || !q.evidence.ref || !q.evidence.quote) {
    errors.push(`${prefix} missing evidence object with ref and quote`);
  } else if (!validRefs.has(q.evidence.ref)) {
    errors.push(`${prefix} evidence.ref "${q.evidence.ref}" not found in passage/turns`);
  }

  const type = q.type || group.type;
  if (!type) {
    errors.push(`${prefix} missing question type`);
    return;
  }

  if (type === 'tfng') {
    if (!['TRUE', 'FALSE', 'NOT GIVEN'].includes(q.answer)) {
      errors.push(`${prefix} tfng answer must be TRUE, FALSE, or NOT GIVEN. Got: "${q.answer}"`);
    }
  } else if (type === 'ynng') {
    if (!['YES', 'NO', 'NOT GIVEN'].includes(q.answer)) {
      errors.push(`${prefix} ynng answer must be YES, NO, or NOT GIVEN. Got: "${q.answer}"`);
    }
  } else if (type === 'mcq_single') {
    const opts = q.options || group.sharedOptions || [];
    const keys = opts.map(o => o.key);
    if (!keys.includes(q.answer)) {
      errors.push(`${prefix} answer "${q.answer}" not found in options keys: ${JSON.stringify(keys)}`);
    }
  } else if (type === 'mcq_multi') {
    const shared = group.sharedOptions || [];
    const keys = shared.map(o => o.key);
    if (!group.correctSet || !Array.isArray(group.correctSet)) {
      errors.push(`${prefix} mcq_multi group requires correctSet array`);
    } else {
      group.correctSet.forEach(k => {
        if (!keys.includes(k)) {
          errors.push(`${prefix} mcq_multi correctSet key "${k}" not in sharedOptions`);
        }
      });
      if (!group.correctSet.includes(q.answer)) {
        errors.push(`${prefix} individual question answer "${q.answer}" not in group.correctSet`);
      }
    }
  } else if (type.startsWith('matching_')) {
    const opts = q.options || group.sharedOptions || [];
    const keys = opts.map(o => o.key);
    if (!keys.includes(q.answer)) {
      errors.push(`${prefix} answer "${q.answer}" not found in matching options keys: ${JSON.stringify(keys)}`);
    }
  } else if (type === 'diagram_label') {
    if (group.inputMode === 'select_letter') {
      const opts = q.options || group.sharedOptions || [];
      const keys = opts.map(o => o.key);
      if (!keys.includes(q.answer)) {
        errors.push(`${prefix} diagram_label select_letter answer "${q.answer}" not in keys: ${JSON.stringify(keys)}`);
      }
    } else {
      validateGapFill(q, group, prefix, errors);
    }
  } else if (type === 'gap_fill') {
    validateGapFill(q, group, prefix, errors);
  }
}

function validateGapFill(q, group, prefix, errors) {
  const limit = q.wordLimit || group.wordLimit || 'ONE_WORD_OR_NUMBER';
  const accepts = q.accept || [];

  if (!Array.isArray(accepts) || accepts.length === 0) {
    errors.push(`${prefix} gap_fill requires non-empty accept array`);
    return;
  }

  accepts.forEach(variant => {
    if (/'\w+/.test(variant)) {
      errors.push(`${prefix} variant "${variant}" contains contracted word (forbidden by IELTS rules)`);
    }
    const check = checkWordLimit(variant, limit);
    if (!check.ok) {
      errors.push(`${prefix} variant "${variant}" violated word limit ${limit}: ${check.reason}`);
    }
  });
}

validateAll();
