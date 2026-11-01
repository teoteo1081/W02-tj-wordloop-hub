/**
 * build_site.js — Đồng bộ tự động 1 chiều dữ liệu IELTS từ learn/ielts sang sites/L06_IELTS
 * Tuân thủ D4 & D5
 */
const fs = require('fs');
const path = require('path');

const srcDataDir = path.resolve(__dirname, '../../../learn/ielts/data');
const destDataDir = path.resolve(__dirname, '../data');

if (!fs.existsSync(destDataDir)) fs.mkdirSync(destDataDir, { recursive: true });

const files = ['listening.js', 'reading.js', 'ielts-lr.json'];
files.forEach(file => {
  const src = path.join(srcDataDir, file);
  const dest = path.join(destDataDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[OK] Synced IELTS data: ${file}`);
  } else {
    console.warn(`[WARN] Missing src IELTS data: ${src}`);
  }
});

console.log('Build site L06_IELTS completed successfully.');
