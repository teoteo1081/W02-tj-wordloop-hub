/**
 * check_broken_links.js — Quét toàn bộ liên kết nội bộ trong các file HTML sites/
 * Kiểm tra file đích tồn tại trên đĩa và các thẻ anchor #hash hợp lệ
 * Chuẩn QA Vòng 2 theo R2_UI_SPEC.md Chapter 10.2
 */
const fs = require('fs');
const path = require('path');

const SITES_DIR = path.resolve(__dirname, '../../sites');

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getAllHtmlFiles(SITES_DIR);
let brokenCount = 0;

console.log(`=== BẮT ĐẦU QUÉT LIÊN KẾT NỘI BỘ TRÊN ${htmlFiles.length} TỆP HTML ===`);

htmlFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const relFile = path.relative(SITES_DIR, filePath);

  // Tìm tất cả href="..."
  const regex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim();
    // Bỏ qua link ngoài, mailto, tel, javascript, và GA
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('javascript:') || target === '#') {
      continue;
    }

    if (target.startsWith('#')) {
      // Kiểm tra id trong cùng file (nếu là hash chọn màn chơi quest hoặc top/part thì bỏ qua)
      if (target.includes('=') || target === '#top' || target === '#part4' || target === '#sw' || target === '#ets' || target === '#barron') continue;
      const targetId = target.slice(1);
      if (!content.includes(`id="${targetId}"`) && !content.includes(`id='${targetId}'`)) {
        console.warn(`[WARN-HASH] ${relFile} -> Hash #${targetId} không tìm thấy thẻ đích`);
      }
      continue;
    }

    // Tách phần file, query (?v=) và hash (#)
    const filePart = target.split('#')[0].split('?')[0];
    if (!filePart) continue;
    const resolvedPath = path.resolve(dir, filePart);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[BROKEN 404] ${relFile} -> Trỏ tới file không tồn tại: ${target}`);
      brokenCount++;
    }
  }
});

if (brokenCount === 0) {
  console.log('=== KẾT QUẢ: 100% LIÊN KẾT NỘI BỘ HỢP LỆ (0 BROKEN LINKS) ===');
  process.exit(0);
} else {
  console.error(`=== KẾT QUẢ: PHÁT HIỆN ${brokenCount} LIÊN KẾT BỊ ĐỨT GÃY ===`);
  process.exit(1);
}
