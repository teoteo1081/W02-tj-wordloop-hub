/**
 * lesson-runtime.js — Runtime UI/UX companion for standalone EA lessons
 * Handles: Reading Progress Bar, Instructor/Student Mode Switch, Text Size Adjuster, Print listener, Table responsiveness
 */
(function() {
  "use strict";

  // 1. Reading Progress Bar (RUBRIC B.1 / R2_UI_SPEC Chapter 5.3)
  var progressBar = document.createElement("div");
  progressBar.id = "readProgressBar";
  progressBar.className = "reading-progress-bar";
  progressBar.style.cssText = "position:fixed;top:0;left:0;height:3px;width:0%;background:#1d4ed8;z-index:9999;transition:width 0.1s linear;";
  if (document.body) {
    document.body.prepend(progressBar);
  } else {
    document.addEventListener("DOMContentLoaded", function() {
      document.body.prepend(progressBar);
    });
  }

  function updateScroll() {
    var winScroll = window.scrollY || document.documentElement.scrollTop;
    var height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    var scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + "%";
  }
  window.addEventListener("scroll", updateScroll, { passive: true });

  // 2. Mode Switch & Text Size Control Bar (RUBRIC B.2, B.6 / R2_UI_SPEC Chapter 3.4, 5.5)
  function initControls() {
    var nav = document.querySelector(".lesson-nav");
    if (!nav) return;
    if (document.getElementById("modeControlBar")) return;

    var controlBar = document.createElement("div");
    controlBar.id = "modeControlBar";
    controlBar.className = "mode-switch-bar";
    controlBar.style.cssText = "display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:8px 12px;background:rgba(2,132,199,0.06);border:1px solid #cbd5e1;border-radius:10px;margin:12px 0 20px;";

    var curMode = localStorage.getItem("tj_ea_user_mode") || "instructor";
    var curScale = localStorage.getItem("tj_ea_font_scale") || "100";

    controlBar.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:6px;">
        <span style="font-size:13px;font-weight:700;color:var(--ink, #0f172a);">Chế độ:</span>
        <div class="mode-segmented-control" style="display:inline-flex;background:#e2e8f0;border-radius:999px;padding:2px;">
          <button type="button" id="btnModeInst" class="mode-btn" style="min-height:36px;padding:4px 12px;border:none;border-radius:999px;cursor:pointer;font-weight:700;font-size:13px;background:${curMode === 'instructor' ? '#1d4ed8' : 'transparent'};color:${curMode === 'instructor' ? '#ffffff' : '#334155'};">🎓 Giảng viên</button>
          <button type="button" id="btnModeStud" class="mode-btn" style="min-height:36px;padding:4px 12px;border:none;border-radius:999px;cursor:pointer;font-weight:700;font-size:13px;background:${curMode === 'student' ? '#1d4ed8' : 'transparent'};color:${curMode === 'student' ? '#ffffff' : '#334155'};">🎒 Học viên</button>
        </div>
      </div>
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <div role="group" aria-label="Điều chỉnh cỡ chữ văn bản" style="display:inline-flex;align-items:center;background:#e2e8f0;border-radius:8px;padding:2px;gap:2px;">
          <button type="button" data-scale="100" class="btn-scale" title="Cỡ chữ chuẩn 100%" style="min-width:36px;min-height:36px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;background:${curScale === '100' ? '#ffffff' : 'transparent'};color:#0f172a;">Aa</button>
          <button type="button" data-scale="115" class="btn-scale" title="Cỡ chữ vừa 115%" style="min-width:36px;min-height:36px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;background:${curScale === '115' ? '#ffffff' : 'transparent'};color:#0f172a;">Aa+</button>
          <button type="button" data-scale="130" class="btn-scale" title="Cỡ chữ lớn 130%" style="min-width:36px;min-height:36px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;background:${curScale === '130' ? '#ffffff' : 'transparent'};color:#0f172a;">Aa++</button>
        </div>
        <button type="button" id="btnQuickPrint" style="min-height:36px;padding:6px 12px;border:1px solid #1d4ed8;border-radius:8px;background:#ffffff;color:#1d4ed8;font-weight:700;font-size:13px;cursor:pointer;">🖨️ In A4</button>
      </div>
    `;

    nav.insertAdjacentElement("afterend", controlBar);

    function applyMode(mode) {
      curMode = mode;
      localStorage.setItem("tj_ea_user_mode", mode);
      var bInst = document.getElementById("btnModeInst");
      var bStud = document.getElementById("btnModeStud");
      if (bInst && bStud) {
        bInst.style.background = mode === "instructor" ? "#1d4ed8" : "transparent";
        bInst.style.color = mode === "instructor" ? "#ffffff" : "#334155";
        bStud.style.background = mode === "student" ? "#1d4ed8" : "transparent";
        bStud.style.color = mode === "student" ? "#ffffff" : "#334155";
      }
      var corners = document.querySelectorAll("details.instructor-corner");
      corners.forEach(function(el) {
        if (mode === "instructor") {
          el.setAttribute("open", "");
        } else {
          el.removeAttribute("open");
        }
      });
    }

    function applyScale(scale) {
      curScale = scale;
      localStorage.setItem("tj_ea_font_scale", scale);
      document.querySelectorAll(".btn-scale").forEach(function(btn) {
        var active = btn.getAttribute("data-scale") === scale;
        btn.style.background = active ? "#ffffff" : "transparent";
      });
      var shell = document.querySelector(".lesson-shell") || document.body;
      if (scale === "115") {
        shell.style.fontSize = "18.4px";
      } else if (scale === "130") {
        shell.style.fontSize = "20.8px";
      } else {
        shell.style.fontSize = "16px";
      }
    }

    var btnI = document.getElementById("btnModeInst");
    var btnS = document.getElementById("btnModeStud");
    var btnP = document.getElementById("btnQuickPrint");
    if (btnI) btnI.onclick = function() { applyMode("instructor"); };
    if (btnS) btnS.onclick = function() { applyMode("student"); };
    document.querySelectorAll(".btn-scale").forEach(function(btn) {
      btn.onclick = function() { applyScale(btn.getAttribute("data-scale")); };
    });
    if (btnP) btnP.onclick = function() { window.print(); };

    applyMode(curMode);
    applyScale(curScale);
  }

  // 3. Beforeprint hook to always open instructor corner (P2 finding in review)
  window.addEventListener("beforeprint", function() {
    document.querySelectorAll("details.instructor-corner").forEach(function(el) {
      el.setAttribute("open", "");
    });
    document.querySelectorAll("details.qc-ans-details").forEach(function(el) {
      el.setAttribute("open", "");
    });
  });

  // 4. Wrap unwrapped tables to prevent overflow on mobile 390px
  function wrapTables() {
    document.querySelectorAll("table").forEach(function(table) {
      if (!table.parentElement.classList.contains("table-scroll")) {
        var wrapper = document.createElement("div");
        wrapper.className = "table-scroll";
        wrapper.style.cssText = "width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:12px 0;";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      initControls();
      wrapTables();
    });
  } else {
    initControls();
    wrapTables();
  }
})();
