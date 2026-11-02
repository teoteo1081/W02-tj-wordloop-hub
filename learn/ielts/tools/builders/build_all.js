/**
 * IELTS Academic L/R Master Data Builder
 * Path: learn/ielts/tools/builders/build_all.js
 * Generates ielts-lr.json, reading.js, and listening.js, then triggers validate.js.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testRd1 = require('./reading1.js');
const testRd2 = require('./reading2.js');
const testLs1 = require('./listening1.js');
const testLs2 = require('./listening2.js');

const DATA_DIR = path.resolve(__dirname, '../../data');
const JSON_OUT = path.join(DATA_DIR, 'ielts-lr.json');
const RD_JS_OUT = path.join(DATA_DIR, 'reading.js');
const LS_JS_OUT = path.join(DATA_DIR, 'listening.js');

const bandConversion = {
  sourceUrl: "https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail",
  verifiedDate: "2026-11-01",
  isEstimate: true,
  labelVi: "Ước tính tham khảo theo mốc chuẩn ielts.org (±0.5 band tuỳ đề)",
  officialAnchors: {
    listening: { "16": 5.0, "23": 6.0, "30": 7.0, "35": 8.0 },
    academicReading: { "15": 5.0, "23": 6.0, "30": 7.0, "35": 8.0 }
  },
  academicReading: [
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
  ],
  listening: [
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
  ]
};

const masterData = {
  version: 1,
  exam: "ielts",
  module: "academic",
  fmt: 3,
  assumption: "Mặc định: IELTS Academic (IELTS General Training: Sắp có)",
  note: "Bộ đề IELTS Academic Listening & Reading 100% ORIGINAL do dự án TJ WordLoop tự biên soạn theo định dạng công bố chính thức trên ielts.org. Không sao chép đề thi thật hoặc tài liệu của Cambridge/IDP/British Council.",
  disclaimerVi: "Tài liệu luyện tập độc lập; điểm Band quy đổi là mức ước tính tham khảo dựa trên mốc công bố của ielts.org (độ khó từng đề thi thật có thể xê dịch ±0.5 band).",
  bandConversion: bandConversion,
  reading: [testRd1, testRd2],
  listening: [testLs1, testLs2]
};

console.log('Writing ielts-lr.json...');
fs.writeFileSync(JSON_OUT, JSON.stringify(masterData, null, 2), 'utf8');

console.log('Writing reading.js...');
const rdJsContent = `// Auto-generated from ielts-lr.json for offline and file:// compatibility
(function() {
  window.IELTS_READING = ${JSON.stringify(masterData.reading, null, 2)};
})();
`;
fs.writeFileSync(RD_JS_OUT, rdJsContent, 'utf8');

console.log('Writing listening.js...');
const lsJsContent = `// Auto-generated from ielts-lr.json for offline and file:// compatibility
(function() {
  window.IELTS_LISTENING = ${JSON.stringify(masterData.listening, null, 2)};
})();
`;
fs.writeFileSync(LS_JS_OUT, lsJsContent, 'utf8');

console.log('Master data written successfully!');
console.log('Running validator now...');
try {
  execSync(`node "${path.resolve(__dirname, '../validate.js')}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('Validation failed!');
  process.exit(1);
}
