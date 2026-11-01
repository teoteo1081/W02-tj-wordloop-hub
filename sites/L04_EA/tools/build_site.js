/**
 * build_site.js — Đồng bộ tự động 1 chiều dữ liệu và bài học từ learn/ea sang sites/L04_EA
 * Tuân thủ D5 (Single Source of Truth, không sao chép tay)
 */
const fs = require('fs');
const path = require('path');

const srcDataDir = path.resolve(__dirname, '../../../learn/ea/data');
const srcLessonsDir = path.resolve(__dirname, '../../../learn/ea/lessons');

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

// 2. Sao chép và đệ quy thư mục bài học HTML
function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      let content = fs.readFileSync(srcPath, 'utf8');
      // Đảm bảo có viewport cho mobile 390px
      if (entry.name.endsWith('.html') && !content.includes('viewport')) {
        content = content.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">');
      }
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}

if (fs.existsSync(srcLessonsDir)) {
  copyDirRecursive(srcLessonsDir, destLessonsDir);
  console.log('[OK] Synced lessons directory');
}

console.log('Build site L04_EA completed successfully.');
