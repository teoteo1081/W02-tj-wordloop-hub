/**
 * toeic-app.js — Bộ điều phối và liên kết an toàn cho khoá học TOEIC 4 Kỹ Năng
 * Tuân thủ D2 (an toàn phòng TJ) và RUBRIC B.1 (1 chạm vào câu hỏi)
 */
(function(w) {
  "use strict";

  function getSoloRoom() {
    let room = localStorage.getItem("tj_toeic_solo_room");
    if (!room) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      room = "SOLO_TOEIC_" + rand;
      localStorage.setItem("tj_toeic_solo_room", room);
    }
    return room;
  }

  function openEtsSolo() {
    const room = getSoloRoom();
    // Tuyệt đối không bao giờ gọi game.html trần! Luôn truyền room ngẫu nhiên riêng tư
    const url = `../../game.html?room=${encodeURIComponent(room)}&standalone=1`;
    window.location.href = url;
  }

  function startSpeaking() {
    window.location.href = `../../learn/sw/index.html?exam=toeic&kind=speaking&solo=1&play=1`;
  }

  function startWriting() {
    window.location.href = `../../learn/sw/index.html?exam=toeic&kind=writing&solo=1&play=1`;
  }

  function updateToeicStats() {
    try {
      const raw = localStorage.getItem("sw-quest-v1");
      const s = raw ? JSON.parse(raw) : { hist: [] };
      const spCount = (s.hist || []).filter(h => h.kind === "speaking").length;
      const wrCount = (s.hist || []).filter(h => h.kind === "writing").length;

      const elSp = document.getElementById("statSpeakingCount");
      if (elSp) elSp.textContent = spCount + " bài";
      const elWr = document.getElementById("statWritingCount");
      if (elWr) elWr.textContent = wrCount + " bài";
    } catch(e) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateToeicStats();
    const btnEts = document.getElementById("btnEtsSolo");
    if (btnEts) btnEts.onclick = openEtsSolo;
    const btnSp = document.getElementById("btnSpeaking1Tap");
    if (btnSp) btnSp.onclick = startSpeaking;
    const btnWr = document.getElementById("btnWriting1Tap");
    if (btnWr) btnWr.onclick = startWriting;
  });

  w.ToeicApp = {
    getSoloRoom,
    openEtsSolo,
    startSpeaking,
    startWriting,
    updateToeicStats
  };
})(window);
