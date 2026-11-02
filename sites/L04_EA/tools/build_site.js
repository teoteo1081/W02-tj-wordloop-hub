/**
 * build_site.js — Đồng bộ tự động 1 chiều dữ liệu và bài học từ learn/ea sang sites/L04_EA
 * Tuân thủ D5 (Single Source of Truth, không sao chép tay)
 * Bổ sung lesson-runtime.js, viewport, và giải quyết P2 review finding #3
 */
const fs = require('fs');
const path = require('path');

// Hỗ trợ nguồn ưu tiên từ worktree WL2026 hoặc fallback nội bộ UX2026 (P2-3)
const candidateDataDirs = [
  path.resolve(__dirname, '../../../../W02_TJHUB_WL2026/learn/ea/data'),
  path.resolve(__dirname, '../../../learn/ea/data')
];
const candidateLessonsDirs = [
  path.resolve(__dirname, '../../../../W02_TJHUB_WL2026/learn/ea/lessons'),
  path.resolve(__dirname, '../../../learn/ea/lessons')
];

const srcDataDir = candidateDataDirs.find(d => fs.existsSync(d)) || candidateDataDirs[1];
const srcLessonsDir = candidateLessonsDirs.find(d => fs.existsSync(d)) || candidateLessonsDirs[1];

const destDataDir = path.resolve(__dirname, '../data');
const destLessonsDir = path.resolve(__dirname, '../lessons');

if (!fs.existsSync(destDataDir)) fs.mkdirSync(destDataDir, { recursive: true });
if (!fs.existsSync(destLessonsDir)) fs.mkdirSync(destLessonsDir, { recursive: true });

// 1. Sao chép các file dữ liệu JS
const dataFiles = ['lessons-data.js', 'cases.js', 'research.js'];
dataFiles.forEach(file => {
  const src = path.join(srcDataDir, file);
  const dest = path.join(destDataDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[OK] Synced data: ${file}`);
  } else {
    console.warn(`[WARN] Missing src data: ${src}`);
  }
});

// 2. Sao chép và đệ quy thư mục bài học HTML kèm runtime helper
function copyDirRecursive(srcDir, destDir, baseDestDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, baseDestDir);
    } else if (entry.isFile()) {
      let content = fs.readFileSync(srcPath, 'utf8');

      if (entry.name.endsWith('.html')) {
        // Đảm bảo có viewport cho mobile 390px
        if (!content.includes('viewport')) {
          content = content.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">');
        }

        // Tự động gắn script lesson-runtime.js nếu chưa có
        if (!content.includes('lesson-runtime.js')) {
          const relToLessons = path.relative(path.dirname(destPath), baseDestDir).replace(/\\/g, '/');
          const scriptSrc = relToLessons ? `${relToLessons}/lesson-runtime.js` : 'lesson-runtime.js';
          content = content.replace('</body>', `<script src="${scriptSrc}"></script>\n</body>`);
        }
      }

      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}

if (fs.existsSync(srcLessonsDir)) {
  copyDirRecursive(srcLessonsDir, destLessonsDir, destLessonsDir);
  console.log('[OK] Synced lessons directory');
}

console.log('Build site L04_EA completed successfully.');
