/**
 * build_site.js — Đồng bộ tự động 1 chiều dữ liệu và bài học từ learn/dm sang sites/L02_DM
 * Tuân thủ D5 (Single Source of Truth)
 */
const fs = require('fs');
const path = require('path');

const srcDataDir = path.resolve(__dirname, '../../../learn/dm/data');
const srcLessonsDir = path.resolve(__dirname, '../../../learn/dm/lessons');

const destDataDir = path.resolve(__dirname, '../data');
const destLessonsDir = path.resolve(__dirname, '../lessons');

if (!fs.existsSync(destDataDir)) fs.mkdirSync(destDataDir, { recursive: true });
if (!fs.existsSync(destLessonsDir)) fs.mkdirSync(destLessonsDir, { recursive: true });

// 1. Sao chép dữ liệu JS
const dataFiles = ['lessons-data.js', 'cases.js', 'research.js'];
dataFiles.forEach(file => {
  const src = path.join(srcDataDir, file);
  const dest = path.join(destDataDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[OK] Synced DM data: ${file}`);
  } else {
    console.warn(`[WARN] Missing src data: ${src}`);
  }
});

// 2. Sao chép bài học HTML và CSS
if (fs.existsSync(srcLessonsDir)) {
  const entries = fs.readdirSync(srcLessonsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const srcPath = path.join(srcLessonsDir, entry.name);
      const destPath = path.join(destLessonsDir, entry.name);
      let content = fs.readFileSync(srcPath, 'utf8');
      if (entry.name.endsWith('.html') && !content.includes('viewport')) {
        content = content.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">');
      }
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
  console.log('[OK] Synced DM lessons directory');
}

console.log('Build site L02_DM completed successfully.');
