/**
 * IELTS Academic Listening & Reading — Interactive Runner & Grader
 * Path: learn/ielts/ielts-lr.js
 * 100% Offline & file:// compatible, auto-grading, Web Speech API player,
 * evidence navigation, and official band calculation.
 */

(function () {
  'use strict';

  // --- Official Band Conversion Tables (ielts.org reference) ---
  const BAND_TABLE_READING = [
    { min: 39, max: 40, band: 9.0 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8.0 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7.0 },
    { min: 27, max: 29, band: 6.5 },
    { min: 23, max: 26, band: 6.0 },
    { min: 19, max: 22, band: 5.5 },
    { min: 15, max: 18, band: 5.0 },
    { min: 13, max: 14, band: 4.5 },
    { min: 10, max: 12, band: 4.0 },
    { min: 8,  max: 9,  band: 3.5 },
    { min: 6,  max: 7,  band: 3.0 },
    { min: 4,  max: 5,  band: 2.5 },
    { min: 2,  max: 3,  band: 2.0 },
    { min: 1,  max: 1,  band: 1.0 },
    { min: 0,  max: 0,  band: 0.0 }
  ];

  const BAND_TABLE_LISTENING = [
    { min: 39, max: 40, band: 9.0 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8.0 },
    { min: 32, max: 34, band: 7.5 },
    { min: 30, max: 31, band: 7.0 },
    { min: 26, max: 29, band: 6.5 },
    { min: 23, max: 25, band: 6.0 },
    { min: 18, max: 22, band: 5.5 },
    { min: 16, max: 17, band: 5.0 },
    { min: 13, max: 15, band: 4.5 },
    { min: 10, max: 12, band: 4.0 },
    { min: 8,  max: 9,  band: 3.5 },
    { min: 6,  max: 7,  band: 3.0 },
    { min: 4,  max: 5,  band: 2.5 },
    { min: 2,  max: 3,  band: 2.0 },
    { min: 1,  max: 1,  band: 1.0 },
    { min: 0,  max: 0,  band: 0.0 }
  ];

  // --- Normalization Utilities ---
  function normalizeIeltsText(raw) {
    if (!raw && raw !== 0) return '';
    let s = String(raw).normalize('NFC');
    s = s.replace(/[\u2018\u2019]/g, "'");
    s = s.replace(/[\u2013\u2014]/g, '-');
    s = s.trim().replace(/\s+/g, ' ');
    // Remove trailing period/comma unless part of decimal
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
        return { ok: false, reason: `Tối đa 1 từ (bạn đã nhập ${wordCount} từ, ${numCount} số)` };
      case 'ONE_WORD_OR_NUMBER':
        if (wordCount <= 1 && numCount <= 1 && (wordCount + numCount >= 1)) return { ok: true };
        return { ok: false, reason: `Vượt quá 1 từ và/hoặc 1 con số` };
      case 'TWO_WORDS_ONLY':
        if (wordCount <= 2 && numCount === 0) return { ok: true };
        return { ok: false, reason: `Tối đa 2 từ (bạn đã nhập ${wordCount} từ, ${numCount} số)` };
      case 'TWO_WORDS_OR_NUMBER':
        if (wordCount <= 2 && numCount <= 1) return { ok: true };
        return { ok: false, reason: `Vượt quá 2 từ và/hoặc 1 con số` };
      case 'THREE_WORDS_ONLY':
        if (wordCount <= 3 && numCount === 0) return { ok: true };
        return { ok: false, reason: `Tối đa 3 từ` };
      case 'THREE_WORDS_OR_NUMBER':
        if (wordCount <= 3 && numCount <= 1) return { ok: true };
        return { ok: false, reason: `Vượt quá 3 từ và/hoặc 1 con số` };
      default:
        return { ok: true };
    }
  }

  function getBand(score, isReading) {
    const table = isReading ? BAND_TABLE_READING : BAND_TABLE_LISTENING;
    for (const row of table) {
      if (score >= row.min && score <= row.max) {
        return row.band.toFixed(1);
      }
    }
    return '0.0';
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- State ---
  const state = {
    tests: {},
    currentTestId: 'ie-ac-rd-01',
    currentPartIndex: 0,
    currentMode: 'practice', // 'practice' or 'exam'
    userAnswers: {}, // { [qNum]: string | array }
    isGraded: false,
    gradeResults: {}, // { [qNum]: { isCorrect, userAns, correctAns, explanationVi, evidence } }
    timerSec: 0,
    timerRunning: false,
    timerInterval: null,
    tts: {
      isPlaying: false,
      currentTurnIndex: 0,
      turnsList: [],
      synth: window.speechSynthesis || null,
      voices: [],
      currentUtterance: null,
      speedRate: 1.0,
      watchdogInterval: null
    }
  };

  // --- Initialization & Data Discovery ---
  function initData() {
    state.tests = {};

    // 1. Reading
    if (window.IELTS_READING && Array.isArray(window.IELTS_READING)) {
      for (const t of window.IELTS_READING) {
        state.tests[t.id] = { ...t, type: 'reading' };
      }
    }

    // 2. Listening
    if (window.IELTS_LISTENING && Array.isArray(window.IELTS_LISTENING)) {
      for (const t of window.IELTS_LISTENING) {
        state.tests[t.id] = { ...t, type: 'listening' };
      }
    }

    // Fallback: Check if window.IELTS_DATA was exposed
    if (window.IELTS_DATA) {
      if (window.IELTS_DATA.reading) {
        for (const t of window.IELTS_DATA.reading) {
          state.tests[t.id] = { ...t, type: 'reading' };
        }
      }
      if (window.IELTS_DATA.listening) {
        for (const t of window.IELTS_DATA.listening) {
          state.tests[t.id] = { ...t, type: 'listening' };
        }
      }
    }

    // If still empty, attempt async fetch if on http
    const testKeys = Object.keys(state.tests);
    if (testKeys.length === 0 && location.protocol !== 'file:') {
      fetch('data/ielts-lr.json')
        .then(res => res.json())
        .then(data => {
          if (data.reading) data.reading.forEach(t => { state.tests[t.id] = { ...t, type: 'reading' }; });
          if (data.listening) data.listening.forEach(t => { state.tests[t.id] = { ...t, type: 'listening' }; });
          populateTestDropdown();
          loadTest(state.currentTestId);
        })
        .catch(err => {
          console.warn('Could not fetch ielts-lr.json:', err);
        });
    }

    populateTestDropdown();
    initSpeechVoices();
  }

  function populateTestDropdown() {
    const sel = document.getElementById('testSelect');
    if (!sel) return;
    sel.innerHTML = '';

    const testKeys = Object.keys(state.tests);
    if (testKeys.length === 0) {
      const opt = document.createElement('option');
      opt.text = 'Không tìm thấy dữ liệu đề thi';
      sel.appendChild(opt);
      return;
    }

    testKeys.forEach(id => {
      const t = state.tests[id];
      const opt = document.createElement('option');
      opt.value = id;
      const typeLabel = t.type === 'reading' ? '📖 Reading' : '🎧 Listening';
      opt.text = `${typeLabel}: ${t.title}`;
      sel.appendChild(opt);
    });

    sel.value = state.currentTestId;
  }

  // --- Speech Synthesis Engine ---
  function initSpeechVoices() {
    if (!state.tts.synth) {
      const statusEl = document.getElementById('voiceStatus');
      if (statusEl) statusEl.textContent = 'Trình duyệt không hỗ trợ Web Speech API';
      return;
    }

    function updateVoiceList() {
      state.tts.voices = state.tts.synth.getVoices();
      const statusEl = document.getElementById('voiceStatus');
      if (statusEl) {
        const enVoices = state.tts.voices.filter(v => v.lang.startsWith('en'));
        statusEl.textContent = `Sẵn sàng (${enVoices.length} giọng tiếng Anh)`;
      }
    }

    updateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoiceList;
    }
  }

  function getBestVoiceForSpeaker(speakerObj) {
    if (!state.tts.voices || state.tts.voices.length === 0) return null;
    const lang = (speakerObj && speakerObj.accent) || 'en-GB';
    const isFemale = speakerObj && speakerObj.gender === 'female';

    // 1. Exact language match e.g. en-GB
    let matches = state.tts.voices.filter(v => v.lang.toLowerCase() === lang.toLowerCase());
    if (matches.length === 0) {
      // 2. Prefix match e.g. en-
      matches = state.tts.voices.filter(v => v.lang.toLowerCase().startsWith('en-'));
    }
    if (matches.length === 0) return state.tts.voices[0];

    // Filter by gender name hint if available
    const genderMatch = matches.find(v => {
      const n = v.name.toLowerCase();
      if (isFemale) return n.includes('female') || n.includes('samantha') || n.includes('victoria') || n.includes('zira') || n.includes('karen');
      return n.includes('male') || n.includes('george') || n.includes('daniel') || n.includes('david') || n.includes('oliver');
    });

    return genderMatch || matches[0];
  }

  function startWatchdog() {
    stopWatchdog();
    // Chrome freeze bug workaround: pause and resume every 10 seconds
    state.tts.watchdogInterval = setInterval(() => {
      if (state.tts.isPlaying && state.tts.synth && state.tts.synth.speaking) {
        state.tts.synth.pause();
        state.tts.synth.resume();
      }
    }, 10000);
  }

  function stopWatchdog() {
    if (state.tts.watchdogInterval) {
      clearInterval(state.tts.watchdogInterval);
      state.tts.watchdogInterval = null;
    }
  }

  function playTurn(index) {
    if (!state.tts.synth) return;
    if (index < 0 || index >= state.tts.turnsList.length) {
      stopAudio();
      return;
    }

    state.tts.synth.cancel();
    state.tts.currentTurnIndex = index;
    state.tts.isPlaying = true;

    const turn = state.tts.turnsList[index];
    const test = state.tests[state.currentTestId];
    const currentPart = test.sections ? test.sections[state.currentPartIndex] : null;
    const speakerObj = currentPart && currentPart.speakers ? currentPart.speakers.find(s => s.id === turn.speaker || s.name === turn.speaker) : null;

    // Highlight turn block in UI
    highlightActiveTurn(turn.id);
    updatePlayerStatus(turn.speaker, index + 1, state.tts.turnsList.length);

    const utterance = new SpeechSynthesisUtterance(turn.text);
    utterance.rate = state.tts.speedRate;
    utterance.lang = (speakerObj && speakerObj.accent) || 'en-GB';

    const voice = getBestVoiceForSpeaker(speakerObj);
    if (voice) utterance.voice = voice;

    if (speakerObj && speakerObj.gender === 'female') {
      utterance.pitch = 1.1;
    } else {
      utterance.pitch = 0.95;
    }

    utterance.onend = () => {
      if (state.tts.isPlaying) {
        // Automatically play next turn
        if (index + 1 < state.tts.turnsList.length) {
          playTurn(index + 1);
        } else {
          stopAudio();
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
      if (state.tts.isPlaying && index + 1 < state.tts.turnsList.length) {
        playTurn(index + 1);
      } else {
        stopAudio();
      }
    };

    state.tts.currentUtterance = utterance;
    startWatchdog();
    state.tts.synth.speak(utterance);
    updatePlayButton(true);
  }

  function toggleAudio() {
    if (!state.tts.synth) return;
    if (state.tts.isPlaying) {
      pauseAudio();
    } else {
      resumeOrStartAudio();
    }
  }

  function resumeOrStartAudio() {
    if (!state.tts.synth) return;
    if (state.tts.synth.paused) {
      state.tts.synth.resume();
      state.tts.isPlaying = true;
      updatePlayButton(true);
      startWatchdog();
    } else {
      playTurn(state.tts.currentTurnIndex || 0);
    }
  }

  function pauseAudio() {
    if (!state.tts.synth) return;
    state.tts.synth.pause();
    state.tts.isPlaying = false;
    updatePlayButton(false);
    stopWatchdog();
  }

  function stopAudio() {
    if (state.tts.synth) {
      state.tts.synth.cancel();
    }
    state.tts.isPlaying = false;
    state.tts.currentTurnIndex = 0;
    updatePlayButton(false);
    stopWatchdog();
    clearActiveTurnHighlights();
  }

  function stepTurn(delta) {
    const nextIdx = state.tts.currentTurnIndex + delta;
    if (nextIdx >= 0 && nextIdx < state.tts.turnsList.length) {
      playTurn(nextIdx);
    }
  }

  function updatePlayButton(isPlaying) {
    const btn = document.getElementById('btnAudioPlay');
    if (!btn) return;
    if (isPlaying) {
      btn.innerHTML = '⏸ Tạm dừng';
      btn.classList.add('btn-primary');
    } else {
      btn.innerHTML = '▶ Phát Audio';
      btn.classList.remove('btn-primary');
    }
  }

  function updatePlayerStatus(speaker, current, total) {
    const badge = document.getElementById('currentSpeakerBadge');
    if (badge) {
      badge.textContent = `🗣 ${speaker || 'Người nói'}`;
    }
    const info = document.getElementById('audioTurnInfo');
    if (info) {
      info.textContent = `Turn ${current}/${total}`;
    }
  }

  function highlightActiveTurn(turnId) {
    clearActiveTurnHighlights();
    const el = document.getElementById(`turn-${turnId}`);
    if (el) {
      el.classList.add('turn-active');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearActiveTurnHighlights() {
    const turns = document.querySelectorAll('.turn-block');
    turns.forEach(t => t.classList.remove('turn-active'));
  }

  // --- Timer Engine ---
  function startTimer() {
    stopTimer();
    state.timerRunning = true;
    state.timerInterval = setInterval(() => {
      if (state.currentMode === 'exam') {
        state.timerSec--;
        if (state.timerSec <= 0) {
          state.timerSec = 0;
          stopTimer();
          updateTimerDisplay();
          alert('⏰ Hết thời gian làm bài thi! Hệ thống sẽ tự động nộp bài và chấm điểm.');
          gradeTest();
          return;
        }
      } else {
        state.timerSec++;
      }
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    state.timerRunning = false;
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function resetTimer() {
    stopTimer();
    const test = state.tests[state.currentTestId];
    if (state.currentMode === 'exam') {
      state.timerSec = (test && test.type === 'reading') ? 3600 : 1800;
    } else {
      state.timerSec = 0;
    }
    updateTimerDisplay();
    startTimer();
  }

  function updateTimerDisplay() {
    const el = document.getElementById('timerText');
    if (!el) return;
    const m = Math.floor(state.timerSec / 60);
    const s = state.timerSec % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // --- Persistence ---
  function getStorageKey(testId) {
    return `ielts-lr-v1-${testId}`;
  }

  function saveUserAnswers() {
    try {
      localStorage.setItem(getStorageKey(state.currentTestId), JSON.stringify(state.userAnswers));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadSavedAnswers() {
    try {
      const raw = localStorage.getItem(getStorageKey(state.currentTestId));
      if (raw) {
        state.userAnswers = JSON.parse(raw);
      } else {
        state.userAnswers = {};
      }
    } catch (e) {
      state.userAnswers = {};
    }
  }

  function clearCurrentAnswers() {
    if (confirm('Bạn có chắc chắn muốn xoá toàn bộ bài làm để làm lại từ đầu không?')) {
      state.userAnswers = {};
      state.isGraded = false;
      state.gradeResults = {};
      try {
        localStorage.removeItem(getStorageKey(state.currentTestId));
      } catch (e) {}
      resetTimer();
      renderCurrentTest();
    }
  }

  // --- Rendering UI ---
  function loadTest(testId) {
    if (!state.tests[testId]) return;
    stopAudio();
    state.currentTestId = testId;
    state.currentPartIndex = 0;
    state.isGraded = false;
    state.gradeResults = {};
    loadSavedAnswers();
    resetTimer();

    // Toggle Audio player bar visibility based on test type
    const test = state.tests[testId];
    const audioBar = document.getElementById('audioPlayerBar');
    if (audioBar) {
      audioBar.style.display = test.type === 'listening' ? 'flex' : 'none';
    }

    renderPartNavigation();
    renderCurrentTest();
  }

  function renderPartNavigation() {
    const nav = document.getElementById('partNavContainer');
    if (!nav) return;
    nav.innerHTML = '';

    const test = state.tests[state.currentTestId];
    const parts = test.type === 'reading' ? test.passages : test.sections;
    if (!parts) return;

    parts.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-ctrl ${idx === state.currentPartIndex ? 'btn-primary' : ''}`;
      const prefix = test.type === 'reading' ? 'Passage' : 'Section';
      const qRangeStr = p.qRange ? `(Q${p.qRange[0]}–${p.qRange[1]})` : '';
      btn.textContent = `${prefix} ${idx + 1} ${qRangeStr}`;
      btn.onclick = () => {
        state.currentPartIndex = idx;
        renderPartNavigation();
        renderCurrentTest();
      };
      nav.appendChild(btn);
    });
  }

  function renderCurrentTest() {
    const test = state.tests[state.currentTestId];
    if (!test) return;

    const parts = test.type === 'reading' ? test.passages : test.sections;
    const currentPart = parts ? parts[state.currentPartIndex] : null;

    if (test.type === 'reading') {
      renderReadingLeftPane(currentPart);
    } else {
      renderListeningLeftPane(currentPart);
    }

    renderRightPaneQuestions(currentPart);
    renderQuestionStrip();
    updateProgressIndicator();
  }

  // Render Left Pane for Reading
  function renderReadingLeftPane(passage) {
    const pane = document.getElementById('paneLeft');
    if (!pane || !passage) return;

    let html = `
      <div class="passage-header">
        <span class="passage-tag">READING PASSAGE ${passage.passageIndex || (state.currentPartIndex + 1)}</span>
        <h1 class="passage-title">${escapeHtml(passage.title)}</h1>
        ${passage.subtitle ? `<div class="passage-subtitle">${escapeHtml(passage.subtitle)}</div>` : ''}
        <div class="passage-meta">
          <span>Độ dài: <strong>${passage.wordCount || 0} từ</strong></span>
          <span>Phạm vi: <strong>Câu ${passage.qRange ? passage.qRange[0] + '–' + passage.qRange[1] : ''}</strong></span>
          ${passage.targetBand ? `<span>Mục tiêu: <strong>Band ${escapeHtml(passage.targetBand)}</strong></span>` : ''}
        </div>
      </div>
      <div class="passage-body">
    `;

    if (passage.paragraphs && Array.isArray(passage.paragraphs)) {
      passage.paragraphs.forEach(para => {
        html += `
          <div class="para-block" id="para-${escapeHtml(para.label)}">
            <span class="para-label">${escapeHtml(para.label)}</span>
            <div class="para-text" id="para-text-${escapeHtml(para.label)}">${escapeHtml(para.text)}</div>
          </div>
        `;
      });
    }

    if (passage.glossary && Array.isArray(passage.glossary) && passage.glossary.length > 0) {
      html += `
        <div style="margin-top: 24px; padding: 14px; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="font-weight: 700; margin-bottom: 6px; font-size: 14px;">Chú thích từ vựng (Glossary):</div>
          <ul style="padding-left: 20px; font-size: 13.5px; color: var(--text-secondary);">
            ${passage.glossary.map(g => `<li><strong>${escapeHtml(g.term)}</strong>: ${escapeHtml(g.definition)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    html += `</div>`;
    pane.innerHTML = html;
  }

  // Render Left Pane for Listening (Transcript & Turns)
  function renderListeningLeftPane(section) {
    const pane = document.getElementById('paneLeft');
    if (!pane || !section) return;

    // Update TTS state turns
    state.tts.turnsList = section.turns || [];
    state.tts.currentTurnIndex = 0;

    let html = `
      <div class="passage-header">
        <span class="passage-tag">LISTENING SECTION ${section.sectionIndex || (state.currentPartIndex + 1)}</span>
        <h1 class="passage-title">${escapeHtml(section.title)}</h1>
        <div class="passage-meta">
          <span>Chủ đề: <strong>${escapeHtml(section.topic || '')}</strong></span>
          <span>Phạm vi: <strong>Câu ${section.qRange ? section.qRange[0] + '–' + section.qRange[1] : ''}</strong></span>
          ${section.targetBand ? `<span>Mục tiêu: <strong>Band ${escapeHtml(section.targetBand)}</strong></span>` : ''}
        </div>
      </div>
      <div style="margin-bottom: 16px; font-size: 14px; color: var(--text-muted); font-style: italic;">
        Nhấn vào từng lượt nói để nghe riêng lượt đó, hoặc dùng thanh phát phía trên để nghe toàn bộ Section.
      </div>
      <div class="transcript-body">
    `;

    if (section.turns && Array.isArray(section.turns)) {
      section.turns.forEach((turn, idx) => {
        html += `
          <div class="turn-block" id="turn-${escapeHtml(turn.id)}" data-turn-index="${idx}" onclick="window.IeltsRunner.playSpecificTurn(${idx})">
            <div class="turn-speaker" style="display:flex; justify-content:space-between; align-items:center;">
              <span>🗣 ${escapeHtml(turn.speaker)}</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">#${escapeHtml(turn.id)}</span>
            </div>
            <div class="turn-text">${escapeHtml(turn.text)}</div>
          </div>
        `;
      });
    }

    html += `</div>`;
    pane.innerHTML = html;
  }

  // Render Right Pane Questions
  function renderRightPaneQuestions(part) {
    const pane = document.getElementById('paneRight');
    if (!pane || !part) return;

    let html = '';
    const groups = part.questionGroups || [];

    groups.forEach(group => {
      html += `
        <div class="q-group-card" id="group-${escapeHtml(group.groupId)}">
          <div class="group-instruction-en">${escapeHtml(group.instructionEn)}</div>
          <div class="group-instruction-vi">${escapeHtml(group.instructionVi)}</div>
          ${group.wordLimitLabel ? `<span class="word-limit-badge">${escapeHtml(group.wordLimitLabel)}</span>` : ''}
          ${group.svgMarkup ? `<div class="diagram-svg-wrap" style="margin: 14px 0; text-align: center; overflow-x: auto; background:#fff; padding:12px; border-radius:6px; border:1px solid var(--border-color);">${group.svgMarkup}</div>` : ''}
          <div class="group-questions">
      `;

      // Render questions within group
      if (group.type === 'mcq_multi') {
        html += renderMcqMultiGroup(group);
      } else {
        group.questions.forEach(q => {
          html += renderSingleQuestion(q, group);
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    pane.innerHTML = html;
    attachInputListeners();
  }

  function renderSingleQuestion(q, group) {
    const qNum = q.q;
    const currentVal = state.userAnswers[qNum] || '';
    const result = state.gradeResults[qNum];

    let inputHtml = '';

    // Question stem formatting
    let stemHtml = escapeHtml(q.stem || '');
    if (stemHtml.includes('{{gap}}')) {
      stemHtml = stemHtml.replace('{{gap}}', '<span style="display:inline-block; width: 60px; border-bottom: 2px solid var(--brand-primary); margin: 0 4px;"></span>');
    }

    // Determine input type
    if (q.type === 'tfng' || q.type === 'ynng' || q.type === 'mcq_single') {
      const opts = q.options || [];
      inputHtml = `<div class="options-grid">`;
      opts.forEach(opt => {
        const isChecked = currentVal === opt.key;
        inputHtml += `
          <label class="opt-label ${isChecked ? 'selected' : ''}">
            <input type="radio" name="q_${qNum}" value="${escapeHtml(opt.key)}" class="opt-input" ${isChecked ? 'checked' : ''} onchange="window.IeltsRunner.onAnswerChange(${qNum}, this.value)">
            <span class="opt-key">${escapeHtml(opt.key)}.</span>
            <span class="opt-text">${escapeHtml(opt.text)}</span>
          </label>
        `;
      });
      inputHtml += `</div>`;
    } else if (q.type === 'matching_headings' || q.type === 'matching_features' || q.type === 'matching_endings' || q.type === 'matching_info' || (q.type === 'diagram_label' && group.sharedOptions)) {
      const opts = group.sharedOptions || [];
      inputHtml = `
        <select class="select-dropdown" id="select_q_${qNum}" onchange="window.IeltsRunner.onAnswerChange(${qNum}, this.value)">
          <option value="">-- Chọn đáp án cho câu ${qNum} --</option>
          ${opts.map(o => `
            <option value="${escapeHtml(o.key)}" ${currentVal === o.key ? 'selected' : ''}>
              ${escapeHtml(o.key)}: ${escapeHtml(o.text)}
            </option>
          `).join('')}
        </select>
      `;
    } else {
      // gap_fill or diagram_label without sharedOptions
      const placeholder = group.wordLimitLabel ? `Nhập đáp án (${group.wordLimitLabel})` : 'Nhập đáp án...';
      inputHtml = `
        <input type="text" 
          class="text-gap-input" 
          id="input_q_${qNum}" 
          value="${escapeHtml(currentVal)}" 
          placeholder="${escapeHtml(placeholder)}" 
          autocomplete="off" 
          spellcheck="false"
          oninput="window.IeltsRunner.onAnswerChange(${qNum}, this.value)">
      `;
    }

    // Evaluation box if graded
    let evalHtml = '';
    if (state.isGraded && result) {
      const isOk = result.isCorrect;
      const statusClass = isOk ? 'correct' : 'incorrect';
      const statusLabel = isOk ? '✅ CHÍNH XÁC' : '❌ CHƯA ĐÚNG';
      evalHtml = `
        <div class="eval-box ${statusClass}">
          <div class="eval-ans-row">
            <span>${statusLabel}</span> — Đáp án đúng: <strong>${escapeHtml(result.correctAns)}</strong>
            ${!isOk && result.userAns ? ` | Bạn trả lời: <span style="text-decoration:line-through;">${escapeHtml(result.userAns)}</span>` : ''}
          </div>
          <div class="eval-explanation">
            <strong>Giải thích:</strong> ${escapeHtml(result.explanationVi)}
          </div>
          ${result.evidence ? `
            <div class="eval-actions">
              <button type="button" class="btn-evidence" onclick="window.IeltsRunner.jumpToEvidence('${escapeHtml(result.evidence.ref)}', '${escapeHtml(result.evidence.quote || '')}')">
                🔍 Xem dẫn chứng trong bài
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="q-item" id="q-card-${qNum}">
        <div class="q-stem">
          <span class="q-num">${qNum}</span>
          ${q.targetParagraph ? `<strong style="color:var(--brand-primary); margin-right:6px;">Đoạn ${escapeHtml(q.targetParagraph)}:</strong>` : ''}
          ${stemHtml}
        </div>
        <div class="q-input-wrap">
          ${inputHtml}
        </div>
        ${evalHtml}
      </div>
    `;
  }

  function renderMcqMultiGroup(group) {
    const qList = group.questions || [];
    const shared = group.sharedOptions || [];
    let html = `
      <div style="margin-bottom: 14px; font-weight: 600; font-size: 15px;">
        Chọn ${group.pickCount || 2} phương án bên dưới:
      </div>
      <div class="options-grid">
    `;

    // Group answers for multi-mcq are mapped across questions
    const selectedKeys = [];
    qList.forEach(q => {
      if (state.userAnswers[q.q]) selectedKeys.push(state.userAnswers[q.q]);
    });

    shared.forEach(opt => {
      const isChecked = selectedKeys.includes(opt.key);
      html += `
        <label class="opt-label ${isChecked ? 'selected' : ''}">
          <input type="checkbox" value="${escapeHtml(opt.key)}" class="opt-input" ${isChecked ? 'checked' : ''} onchange="window.IeltsRunner.onMcqMultiToggle('${escapeHtml(group.groupId)}', this.value, this.checked)">
          <span class="opt-key">${escapeHtml(opt.key)}.</span>
          <span class="opt-text">${escapeHtml(opt.text)}</span>
        </label>
      `;
    });

    html += `</div>`;

    // Render eval boxes for each question in this multi group
    if (state.isGraded) {
      qList.forEach(q => {
        const result = state.gradeResults[q.q];
        if (result) {
          const isOk = result.isCorrect;
          html += `
            <div class="eval-box ${isOk ? 'correct' : 'incorrect'}" style="margin-top: 10px;">
              <div class="eval-ans-row">
                <strong>Câu ${q.q}:</strong> ${isOk ? '✅ CHÍNH XÁC' : '❌ CHƯA ĐÚNG'} — Đáp án đúng: <strong>${escapeHtml(result.correctAns)}</strong>
              </div>
              <div class="eval-explanation">${escapeHtml(result.explanationVi)}</div>
              ${result.evidence ? `
                <div class="eval-actions">
                  <button type="button" class="btn-evidence" onclick="window.IeltsRunner.jumpToEvidence('${escapeHtml(result.evidence.ref)}', '${escapeHtml(result.evidence.quote || '')}')">
                    🔍 Xem dẫn chứng Câu ${q.q}
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }
      });
    }

    return html;
  }

  function attachInputListeners() {
    // Already using inline onclick/onchange/oninput with window.IeltsRunner
  }

  // --- Answer Event Handlers ---
  function onAnswerChange(qNum, value) {
    state.userAnswers[qNum] = value.trim();
    saveUserAnswers();
    updateQuestionDot(qNum);
    updateProgressIndicator();
  }

  function onMcqMultiToggle(groupId, key, isChecked) {
    const test = state.tests[state.currentTestId];
    const parts = test.type === 'reading' ? test.passages : test.sections;
    const currentPart = parts[state.currentPartIndex];
    const group = currentPart.questionGroups.find(g => g.groupId === groupId);
    if (!group) return;

    const qList = group.questions;
    let selected = [];
    qList.forEach(q => {
      if (state.userAnswers[q.q]) selected.push(state.userAnswers[q.q]);
    });

    if (isChecked) {
      if (!selected.includes(key)) selected.push(key);
      if (selected.length > (group.pickCount || 2)) {
        selected.shift(); // keep max pickCount
      }
    } else {
      selected = selected.filter(k => k !== key);
    }

    // Assign to questions in group
    qList.forEach((q, idx) => {
      state.userAnswers[q.q] = selected[idx] || '';
      updateQuestionDot(q.q);
    });

    saveUserAnswers();
    updateProgressIndicator();
    renderRightPaneQuestions(currentPart);
  }

  // --- Bottom Question Navigation Strip ---
  function renderQuestionStrip() {
    const grid = document.getElementById('qGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let q = 1; q <= 40; q++) {
      const dot = document.createElement('div');
      dot.className = 'q-dot';
      dot.id = `q-dot-${q}`;
      dot.textContent = q;
      dot.onclick = () => jumpToQuestion(q);
      grid.appendChild(dot);
      updateQuestionDot(q);
    }
  }

  function updateQuestionDot(q) {
    const dot = document.getElementById(`q-dot-${q}`);
    if (!dot) return;

    dot.classList.remove('answered', 'correct', 'incorrect');

    if (state.isGraded) {
      const res = state.gradeResults[q];
      if (res && res.isCorrect) {
        dot.classList.add('correct');
      } else {
        dot.classList.add('incorrect');
      }
    } else {
      const val = state.userAnswers[q];
      if (val && String(val).trim() !== '') {
        dot.classList.add('answered');
      }
    }
  }

  function jumpToQuestion(qNum) {
    const test = state.tests[state.currentTestId];
    const parts = test.type === 'reading' ? test.passages : test.sections;

    // Find which passage/section has this question
    let targetPartIdx = -1;
    parts.forEach((p, idx) => {
      if (p.qRange && qNum >= p.qRange[0] && qNum <= p.qRange[1]) {
        targetPartIdx = idx;
      }
    });

    if (targetPartIdx !== -1 && targetPartIdx !== state.currentPartIndex) {
      state.currentPartIndex = targetPartIdx;
      renderPartNavigation();
      renderCurrentTest();
    }

    // Scroll right pane to question card
    setTimeout(() => {
      const card = document.getElementById(`q-card-${qNum}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.outline = '2px solid var(--brand-primary)';
        setTimeout(() => { card.style.outline = 'none'; }, 1500);
      }
    }, 100);
  }

  function updateProgressIndicator() {
    const el = document.getElementById('progressText');
    if (!el) return;
    let count = 0;
    for (let q = 1; q <= 40; q++) {
      if (state.userAnswers[q] && String(state.userAnswers[q]).trim() !== '') {
        count++;
      }
    }
    el.textContent = `Đã làm: ${count}/40`;
  }

  // --- Evidence Jumping Engine ---
  function jumpToEvidence(ref, quote) {
    const test = state.tests[state.currentTestId];
    if (test.type === 'reading') {
      // In reading, ref is paragraph label like 'A', 'B', 'C'
      const paraEl = document.getElementById(`para-${ref}`);
      if (paraEl) {
        paraEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        paraEl.style.backgroundColor = 'rgba(254, 240, 138, 0.4)';
        setTimeout(() => {
          paraEl.style.backgroundColor = 'transparent';
        }, 2500);
      }
    } else {
      // In listening, ref is turn id like 'L1-S1-T04'
      const turnEl = document.getElementById(`turn-${ref}`);
      if (turnEl) {
        turnEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        turnEl.classList.add('turn-active');
        const idx = parseInt(turnEl.getAttribute('data-turn-index'), 10);
        if (!isNaN(idx)) {
          playTurn(idx);
        }
      }
    }
  }

  // --- Auto-Grading Engine ---
  function gradeTest() {
    const test = state.tests[state.currentTestId];
    if (!test) return;

    let totalScore = 0;
    state.gradeResults = {};

    const parts = test.type === 'reading' ? test.passages : test.sections;

    parts.forEach(part => {
      const groups = part.questionGroups || [];
      groups.forEach(group => {
        if (group.type === 'mcq_multi') {
          // Handle mcq_multi: correctSet vs picked answers
          const qList = group.questions;
          const correctSet = group.correctSet || qList.map(q => q.answer);
          const userPicked = qList.map(q => state.userAnswers[q.q]).filter(Boolean);

          qList.forEach(q => {
            const userAns = state.userAnswers[q.q] || '';
            const isMatch = correctSet.includes(userAns) && (
              // Ensure uniqueness among user answers for the group
              userPicked.filter(u => u === userAns).length <= correctSet.filter(c => c === userAns).length
            );

            if (isMatch) {
              totalScore++;
              state.gradeResults[q.q] = {
                isCorrect: true,
                userAns: userAns,
                correctAns: correctSet.join(', '),
                explanationVi: q.explanationVi,
                evidence: q.evidence
              };
            } else {
              state.gradeResults[q.q] = {
                isCorrect: false,
                userAns: userAns,
                correctAns: correctSet.join(', '),
                explanationVi: q.explanationVi,
                evidence: q.evidence
              };
            }
          });
        } else {
          group.questions.forEach(q => {
            const userAns = state.userAnswers[q.q] || '';
            const normUser = normalizeIeltsText(userAns);
            let isCorrect = false;

            if (q.type === 'gap_fill' || (q.type === 'diagram_label' && !group.sharedOptions)) {
              // Gap fill check with wordLimit and accepted answers
              if (normUser) {
                const limitCheck = checkWordLimit(userAns, q.wordLimit || group.wordLimit);
                if (limitCheck.ok) {
                  const accepts = (q.accept || [q.answer]).map(normalizeIeltsText);
                  isCorrect = accepts.includes(normUser);
                }
              }
            } else {
              // MCQ, TFNG, YNNG, Matching
              const accepts = (q.accept || [q.answer]).map(normalizeIeltsText);
              isCorrect = accepts.includes(normUser);
            }

            if (isCorrect) {
              totalScore++;
              state.gradeResults[q.q] = {
                isCorrect: true,
                userAns: userAns,
                correctAns: q.answer,
                explanationVi: q.explanationVi,
                evidence: q.evidence
              };
            } else {
              state.gradeResults[q.q] = {
                isCorrect: false,
                userAns: userAns,
                correctAns: q.answer,
                explanationVi: q.explanationVi,
                evidence: q.evidence
              };
            }
          });
        }
      });
    });

    state.isGraded = true;
    stopTimer();

    // Calculate band
    const bandScore = getBand(totalScore, test.type === 'reading');

    // Re-render UI with grading feedback
    renderCurrentTest();

    // Show Results Modal
    showResultsModal(totalScore, bandScore, test);
  }

  function showResultsModal(rawScore, band, test) {
    const modal = document.getElementById('resultsModal');
    if (!modal) return;

    const rawEl = document.getElementById('modalRawScore');
    const bandEl = document.getElementById('modalBandScore');
    const summaryEl = document.getElementById('modalBreakdown');

    if (rawEl) rawEl.textContent = `${rawScore} / 40`;
    if (bandEl) bandEl.textContent = `Band ${band}`;

    if (summaryEl) {
      const parts = test.type === 'reading' ? test.passages : test.sections;
      let breakdownHtml = '<div style="margin-top: 14px; text-align: left;">';
      parts.forEach((p, idx) => {
        let pScore = 0;
        let pTotal = 0;
        p.questionGroups.forEach(g => {
          g.questions.forEach(q => {
            pTotal++;
            if (state.gradeResults[q.q] && state.gradeResults[q.q].isCorrect) {
              pScore++;
            }
          });
        });
        const label = test.type === 'reading' ? `Passage ${idx + 1}` : `Section ${idx + 1}`;
        breakdownHtml += `
          <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color); font-size: 14.5px;">
            <span><strong>${label}:</strong> ${escapeHtml(p.title)}</span>
            <span><strong>${pScore}/${pTotal}</strong></span>
          </div>
        `;
      });
      breakdownHtml += '</div>';
      summaryEl.innerHTML = breakdownHtml;
    }

    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('resultsModal');
    if (modal) modal.style.display = 'none';
  }

  // --- Theme Engine ---
  function initTheme() {
    const saved = localStorage.getItem('ielts-lr-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ielts-lr-theme', next);
  }

  // --- Mobile Tab Switching ---
  function switchMobileTab(tab) {
    const left = document.getElementById('paneLeft');
    const right = document.getElementById('paneRight');
    const tabL = document.getElementById('tabLeft');
    const tabR = document.getElementById('tabRight');

    if (tab === 'left') {
      left.classList.remove('hidden-mobile');
      right.classList.add('hidden-mobile');
      tabL.classList.add('active');
      tabR.classList.remove('active');
    } else {
      right.classList.remove('hidden-mobile');
      left.classList.add('hidden-mobile');
      tabR.classList.add('active');
      tabL.classList.remove('active');
    }
  }

  // --- Mode Switching ---
  function setMode(mode) {
    state.currentMode = mode;
    const btnPrac = document.getElementById('btnModePractice');
    const btnExam = document.getElementById('btnModeExam');
    if (btnPrac && btnExam) {
      if (mode === 'practice') {
        btnPrac.classList.add('active');
        btnExam.classList.remove('active');
      } else {
        btnExam.classList.add('active');
        btnPrac.classList.remove('active');
      }
    }
    resetTimer();
  }

  // --- Public Runner API ---
  window.IeltsRunner = {
    init: function () {
      initTheme();
      initData();
      loadTest(state.currentTestId);

      // DOM event bindings
      const testSel = document.getElementById('testSelect');
      if (testSel) testSel.onchange = (e) => loadTest(e.target.value);

      const btnGrade = document.getElementById('btnGrade');
      if (btnGrade) btnGrade.onclick = gradeTest;

      const btnReset = document.getElementById('btnReset');
      if (btnReset) btnReset.onclick = clearCurrentAnswers;

      const btnPlay = document.getElementById('btnAudioPlay');
      if (btnPlay) btnPlay.onclick = toggleAudio;

      const btnStop = document.getElementById('btnAudioStop');
      if (btnStop) btnStop.onclick = stopAudio;

      const btnPrev = document.getElementById('btnTurnPrev');
      if (btnPrev) btnPrev.onclick = () => stepTurn(-1);

      const btnNext = document.getElementById('btnTurnNext');
      if (btnNext) btnNext.onclick = () => stepTurn(1);

      const speedSel = document.getElementById('audioSpeedSelect');
      if (speedSel) {
        speedSel.onchange = (e) => {
          state.tts.speedRate = parseFloat(e.target.value) || 1.0;
        };
      }

      const btnTheme = document.getElementById('btnTheme');
      if (btnTheme) btnTheme.onclick = toggleTheme;

      const btnCloseModal = document.getElementById('btnCloseModal');
      if (btnCloseModal) btnCloseModal.onclick = closeModal;

      const btnRetake = document.getElementById('btnModalRetake');
      if (btnRetake) {
        btnRetake.onclick = () => {
          closeModal();
          clearCurrentAnswers();
        };
      }

      const btnModePrac = document.getElementById('btnModePractice');
      if (btnModePrac) btnModePrac.onclick = () => setMode('practice');

      const btnModeEx = document.getElementById('btnModeExam');
      if (btnModeEx) btnModeEx.onclick = () => setMode('exam');

      const tabLeft = document.getElementById('tabLeft');
      if (tabLeft) tabLeft.onclick = () => switchMobileTab('left');

      const tabRight = document.getElementById('tabRight');
      if (tabRight) tabRight.onclick = () => switchMobileTab('right');
    },
    onAnswerChange: onAnswerChange,
    onMcqMultiToggle: onMcqMultiToggle,
    jumpToEvidence: jumpToEvidence,
    playSpecificTurn: function (idx) {
      playTurn(idx);
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.IeltsRunner.init);
  } else {
    window.IeltsRunner.init();
  }

})();
