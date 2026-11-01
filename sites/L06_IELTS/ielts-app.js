/**
 * ielts-app.js — Bộ điều khiển tương tác độc lập cho khoá học IELTS Academic 4 Kỹ Năng 2026
 * Chuẩn hoá theo ielts.org, hỗ trợ 1-tap test entry, Web Speech API audio runner & bộ tính điểm Band.
 */
(function(w) {
  "use strict";

  const BAND_TABLE = {
    academicReading: [
      { min: 39, max: 40, band: 9.0, desc: "Thông thạo xuất sắc (Expert User)" },
      { min: 37, max: 38, band: 8.5, desc: "Rất tốt, hiếm khi mắc lỗi (Very Good User)" },
      { min: 35, max: 36, band: 8.0, desc: "Rất tốt, xử lý lập luận phức tạp tốt" },
      { min: 33, max: 34, band: 7.5, desc: "Tốt, vận dụng ngôn ngữ linh hoạt (Good User)" },
      { min: 30, max: 32, band: 7.0, desc: "Tốt, đáp ứng chuẩn đầu vào đại học TOP đầu" },
      { min: 27, max: 29, band: 6.5, desc: "Khá, xử lý ngôn ngữ học thuật chủ động" },
      { min: 23, max: 26, band: 6.0, desc: "Đạt chuẩn năng lực (Competent User)" },
      { min: 19, max: 22, band: 5.5, desc: "Trung bình khá (Modest User)" },
      { min: 15, max: 18, band: 5.0, desc: "Mức cơ bản học thuật (Modest User)" },
      { min: 13, max: 14, band: 4.5, desc: "Hạn chế trong ngữ cảnh phức tạp" },
      { min: 10, max: 12, band: 4.0, desc: "Hạn chế (Limited User)" },
      { min: 0, max: 9, band: 3.5, desc: "Cần tích luỹ nền tảng từ vựng cơ bản" }
    ],
    listening: [
      { min: 39, max: 40, band: 9.0, desc: "Thông thạo xuất sắc (Expert User)" },
      { min: 37, max: 38, band: 8.5, desc: "Rất tốt, nghe hiểu trọn vẹn ngữ điệu & hàm ý" },
      { min: 35, max: 36, band: 8.0, desc: "Rất tốt, nắm bắt bẫy và chi tiết nhỏ tốt" },
      { min: 32, max: 34, band: 7.5, desc: "Tốt, phân biệt rõ các giọng UK, AU, US" },
      { min: 30, max: 31, band: 7.0, desc: "Tốt, phản xạ nghe học thuật vững vàng" },
      { min: 26, max: 29, band: 6.5, desc: "Khá, bắt kịp nhịp độ bài giảng học thuật" },
      { min: 23, max: 25, band: 6.0, desc: "Đạt chuẩn năng lực nghe (Competent User)" },
      { min: 18, max: 22, band: 5.5, desc: "Trung bình khá, đôi khi nhầm lẫn bẫy số/tên" },
      { min: 16, max: 17, band: 5.0, desc: "Mức cơ bản, hiểu các đoạn đối thoại thường ngày" },
      { min: 13, max: 15, band: 4.5, desc: "Hạn chế khi gặp đoạn độc thoại học thuật dài" },
      { min: 10, max: 12, band: 4.0, desc: "Hạn chế (Limited User)" },
      { min: 0, max: 9, band: 3.5, desc: "Cần luyện phản xạ âm và bảng phiên âm IPA" }
    ]
  };

  function calcBand(type, rawScore) {
    const list = BAND_TABLE[type] || BAND_TABLE.academicReading;
    const score = Math.max(0, Math.min(40, parseInt(rawScore, 10) || 0));
    for (let i = 0; i < list.length; i++) {
      if (score >= list[i].min && score <= list[i].max) {
        return list[i];
      }
    }
    return { band: 0, desc: "Chưa ghi nhận điểm" };
  }

  function openReading(testNum) {
    const testId = testNum === 2 ? "ie-ac-rd-02" : "ie-ac-rd-01";
    window.location.href = `../../learn/ielts/index.html?test=${encodeURIComponent(testId)}`;
  }

  function openListening(testNum) {
    const testId = testNum === 2 ? "ie-ac-ls-02" : "ie-ac-ls-01";
    window.location.href = `../../learn/ielts/index.html?test=${encodeURIComponent(testId)}`;
  }

  function openSpeaking() {
    window.location.href = `../../learn/sw/index.html?exam=ielts&kind=speaking&solo=1&play=1`;
  }

  function openWriting() {
    window.location.href = `../../learn/sw/index.html?exam=ielts&kind=writing&solo=1&play=1`;
  }

  // Audio Speech Preview
  let currentUtterance = null;
  function speakSample(text, accentCode, onEnd) {
    if (!('speechSynthesis' in window)) {
      alert("Trình duyệt không hỗ trợ Web Speech API.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const pref = accentCode || "en-GB";
    const voice = voices.find(v => v.lang.startsWith(pref)) || voices.find(v => v.lang.startsWith("en"));
    if (voice) u.voice = voice;

    u.onend = () => { if (onEnd) onEnd(); };
    u.onerror = () => { if (onEnd) onEnd(); };
    currentUtterance = u;
    window.speechSynthesis.speak(u);
  }

  function stopSample() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function initBandCalculator() {
    const rawSlider = document.getElementById("rawScoreInput");
    const rawLabel = document.getElementById("rawScoreDisplay");
    const bandLabel = document.getElementById("bandScoreResult");
    const bandDesc = document.getElementById("bandScoreDesc");
    const radioRd = document.getElementById("calcTypeReading");
    const radioLs = document.getElementById("calcTypeListening");

    function update() {
      if (!rawSlider) return;
      const val = parseInt(rawSlider.value, 10) || 0;
      if (rawLabel) rawLabel.textContent = val + " / 40 câu";
      const type = (radioLs && radioLs.checked) ? "listening" : "academicReading";
      const res = calcBand(type, val);
      if (bandLabel) bandLabel.textContent = "Band " + res.band.toFixed(1);
      if (bandDesc) bandDesc.textContent = res.desc;
    }

    if (rawSlider) {
      rawSlider.addEventListener("input", update);
      rawSlider.addEventListener("change", update);
    }
    if (radioRd) radioRd.addEventListener("change", update);
    if (radioLs) radioLs.addEventListener("change", update);
    update();
  }

  function updateIeltsStats() {
    try {
      const swRaw = localStorage.getItem("sw-quest-v1");
      const sw = swRaw ? JSON.parse(swRaw) : { hist: [] };
      const spCount = (sw.hist || []).filter(h => h.exam === "ielts" && h.kind === "speaking").length;
      const wrCount = (sw.hist || []).filter(h => h.exam === "ielts" && h.kind === "writing").length;

      const elSp = document.getElementById("statIeltsSpCount");
      if (elSp) elSp.textContent = spCount + " bài";
      const elWr = document.getElementById("statIeltsWrCount");
      if (elWr) elWr.textContent = wrCount + " bài";

      const lrRaw = localStorage.getItem("ielts_lr_state");
      const lr = lrRaw ? JSON.parse(lrRaw) : null;
      const elLr = document.getElementById("statIeltsLrState");
      if (elLr && lr && lr.testId) {
        elLr.textContent = "Đang dở: " + lr.testId;
      }
    } catch(e) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBandCalculator();
    updateIeltsStats();

    const bRd1 = document.getElementById("btnReading1Tap1");
    if (bRd1) bRd1.onclick = () => openReading(1);
    const bRd2 = document.getElementById("btnReading1Tap2");
    if (bRd2) bRd2.onclick = () => openReading(2);

    const bLs1 = document.getElementById("btnListening1Tap1");
    if (bLs1) bLs1.onclick = () => openListening(1);
    const bLs2 = document.getElementById("btnListening1Tap2");
    if (bLs2) bLs2.onclick = () => openListening(2);

    const bSp = document.getElementById("btnSpeaking1Tap");
    if (bSp) bSp.onclick = openSpeaking;
    const bWr = document.getElementById("btnWriting1Tap");
    if (bWr) bWr.onclick = openWriting;

    const bSamplePlay = document.getElementById("btnAudioSamplePlay");
    if (bSamplePlay) {
      bSamplePlay.onclick = () => {
        const text = "Good morning, Harbourview Craft Cooperative. Claire speaking. How can I help you today?";
        speakSample(text, "en-GB", () => {
          bSamplePlay.textContent = "▶ Nghe câu mẫu (Giọng UK)";
        });
        bSamplePlay.textContent = "🔊 Đang phát...";
      };
    }
  });

  w.IeltsApp = {
    BAND_TABLE,
    calcBand,
    openReading,
    openListening,
    openSpeaking,
    openWriting,
    speakSample,
    stopSample,
    updateIeltsStats
  };
})(window);
