// Listening (Part 1–4): lời giải + dịch lời thoại + từ vựng cho NGƯỜI VIỆT trước (TJ 2026-10-06: "tập trung cho người Việt học trước") — OpenAI gpt-4o qua openai-proxy.
// Chạy mẫu (chỉ đọc DB, ghi file ra OUT):  TEST=1 NUMS=1,2,7,8,32,33,34,71,72,73 OUT=<file.json> NODE_USE_ENV_PROXY=1 node tools/toeic_lc_vi.js
// Mỗi NHÓM câu (Part 3/4 = 3 câu chung 1 đoạn) gọi AI 1 lần: ngữ liệu = lời thoại tiếng Anh sẵn có (i18n.scr.lines) + đáp án SÁCH (answer_src='key'), AI KHÔNG tự đoán đáp án.
// Kết quả mỗi câu: i18n.vi={tag,explain} + i18n.en={tag,explain} + vocab[{t,vi,en}] ; mỗi dòng lời thoại: lines[i].vi.  Khoá i18n.scr cũ phải GIỮ NGUYÊN (merge, không ghi đè).
const fs = require('fs');
const K = fs.readFileSync(__dirname + '/../js/config.js', 'utf8').match(/eyJ[^"]*/)[0], SB = 'https://pqarpszsipbdugrumhfy.supabase.co', H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const SYS = `You are an expert TOEIC Listening teacher writing study notes for VIETNAMESE learners (TOEIC 450-750). The official answer key is GIVEN — never change it. For each question write:
- "tag": chủ điểm ngắn bằng tiếng Việt (vd "Hỏi mục đích cuộc gọi", "Câu hỏi Wh- (Khi nào)").
- "explain_vi": 2-4 câu tiếng Việt DỄ HIỂU, ít thuật ngữ: nói người nói đã nói gì (trích/dịch câu chứa đáp án, giữ tiếng Anh trong ngoặc), vì sao đáp án sách đúng, và 1 lý do các lựa chọn khác dễ nhầm/sai (bẫy). Part 1: AI KHÔNG nhìn thấy tranh -> chỉ nói câu đúng (theo đáp án sách) mô tả điều gì, dặn người học đối chiếu với tranh; TUYỆT ĐỐI không đoán tranh có/không có gì, không nói vì sao các câu kia sai theo tranh (chỉ dịch/nêu từ khoá của chúng nếu cần). Part 2: nghĩa câu hỏi + vì sao câu trả lời hợp lý + nếu có câu bẫy (lặp từ/đồng âm với câu hỏi) thì chỉ ra. Part 3/4: với lựa chọn sai, nêu ÍT NHẤT 1 lựa chọn cụ thể và lý do nó sai hoặc bẫy (vd người nói nhắc từ đó nhưng ý khác); không viết chung chung "các lựa chọn khác không được nhắc đến".
- "explain_en": the same in 1-2 short English sentences.
- "vocab": 2-4 từ/cụm hữu ích trong đoạn (B1-C1): {"t":"English","vi":"nghĩa tiếng Việt ngắn","en":"short English gloss"}. Không lấy từ quá dễ.
Also return "lines_vi": natural Vietnamese translation of EACH transcript line, same count and order as given (keep names; keep numbers as digits).
Return JSON only: {"questions":[{"num":<int>,"tag":"","explain_vi":"","explain_en":"","vocab":[...]}],"lines_vi":["..."]}`;
async function ai(user) { for (let t = 0; t < 3; t++) { try { const r = await fetch(SB + '/functions/v1/openai-proxy', { method: 'POST', headers: H, body: JSON.stringify({ model: process.env.MODEL || 'gpt-4o', sys: SYS, user, temperature: 0.2 }) }); const j = await r.json(); return { o: JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g, '').trim()), usage: j.usage || {} }; } catch (e) { if (t === 2) throw e; await new Promise(r => setTimeout(r, 3000)); } } }
(async () => {
  const nums = (process.env.NUMS || '').split(',').filter(Boolean).join(','), q = 'select=id,test,part,num,stem,opts,answer,answer_src,i18n&test=eq.' + process.env.TEST + '&part=lte.4' + (nums ? '&num=in.(' + nums + ')' : '') + '&order=num&limit=1000';
  const rows = await (await fetch(SB + '/rest/v1/test_items?' + q, { headers: H })).json();
  // nhóm = các câu dùng CÙNG bộ lời thoại (lines giống nhau) -> 1 lần gọi
  const groups = []; rows.forEach(r => { const s = r.i18n && r.i18n.scr, sig = s && s.lines ? JSON.stringify(s.lines.map(l => l.t)) : 'x' + r.num; let g = groups.find(x => x.sig === sig && r.part >= 3); if (!g) groups.push(g = { sig, rows: [], lines: s && s.lines || [] }); g.rows.push(r); });
  const out = {}, tot = { p: 0, c: 0 }; let gi = 0;
  async function worker() { while (gi < groups.length) { const g = groups[gi++]; if (!g.lines.length) continue;
    const user = JSON.stringify({ transcript: g.lines.map((l, i) => ({ i, speaker: l.sp, text: l.t })), questions: g.rows.map(r => ({ num: r.num, part: r.part, question: r.stem, options: r.opts, correct: r.answer, evidence: (r.i18n.scr.ev || {})[r.num] || '' })) });
    try { const { o, usage } = await ai(user); tot.p += usage.prompt_tokens || 0; tot.c += usage.completion_tokens || 0;
      const ok = (o.lines_vi || []).length === g.lines.length; g.rows.forEach(r => { const x = (o.questions || []).find(z => +z.num === r.num); if (x) out[r.id] = { num: r.num, part: r.part, tag: x.tag, explain_vi: x.explain_vi, explain_en: x.explain_en, vocab: x.vocab, lines_vi: ok ? o.lines_vi : null, lines_en: g.lines.map(l => l.t) }; });
    } catch (e) { console.log('nhóm lỗi', g.rows.map(r => r.num).join(','), e.message); } } }
  await Promise.all([worker(), worker(), worker()]);
  fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  console.log('nhóm', groups.length, '· câu có kết quả', Object.keys(out).length + '/' + rows.length, '· token', tot, '· ≈USD', (tot.p * 2.5e-6 + tot.c * 10e-6).toFixed(3));
})().catch(e => { console.error(e); process.exit(1); });
