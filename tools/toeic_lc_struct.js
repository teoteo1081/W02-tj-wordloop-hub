// Dựng câu hỏi Listening Part 3–4 (câu 32–100) từ OCR trang đề (tesseract, p-XX.txt + bản cắt cột c<trang>L/R.txt) bằng gpt-4o qua openai-proxy.
// Cách chạy: OCR=<thư mục> OUT=<file json> NODE_USE_ENV_PROXY=1 node tools/toeic_lc_struct.js   (KHÔNG commit chữ đề — bản quyền ETS)
const fs=require('fs'), path=require('path');
const K=fs.readFileSync(__dirname+'/../js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K};
const D=process.env.OCR, files=fs.readdirSync(D).filter(f=>/^p-\d+\.txt$/.test(f)).sort();
const pages=files.map(f=>({n:+f.match(/\d+/)[0],t:fs.readFileSync(path.join(D,f),'utf8')}));
const start=pages.findIndex(p=>/PART 3/.test(p.t)); const use=pages.slice(start);
const col=n=>['L','R'].map(s=>{const f=path.join(D,'c'+String(n).padStart(2,'0')+s+'.txt');return fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';}).join('\n');
async function ai(sys,user){for(let t=0;t<3;t++){try{const r=await fetch(SB+'/functions/v1/openai-proxy',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o',sys,user,temperature:0})});const j=await r.json();return JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g,'').trim());}catch(e){if(t==2)throw e;await new Promise(r=>setTimeout(r,3000));}}}
const SYS='OCR of a scanned TOEIC Listening test book, Parts 3-4: printed questions 32-100, each with four options (A)-(D). Two-column layout; a second column-split OCR of the same page follows "=== COLUMN OCR ===" — use both to recover every question and option exactly (fix obvious OCR errors only; keep quoted phrases in the stem). Ignore graphics/tables text except to note them. Reply JSON only {"q":[{"num":32,"stem":"","opts":["","","",""]}]} for ALL questions whose number appears on this page.';
(async()=>{
  const out={};
  for(const p of use){ const r=await ai(SYS,p.t+'\n\n=== COLUMN OCR ===\n'+col(p.n)); for(const q of r.q||[]) if(q.num>=32&&q.num<=100&&!out[q.num]) out[q.num]=q; }
  const miss=[],bad=[]; for(let n=32;n<=100;n++){const q=out[n]; if(!q) miss.push(n); else if((q.opts||[]).length!==4||q.opts.some(o=>!String(o).replace(/^\([A-D]\)\s*/,'').trim())) bad.push(n);}
  fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,1)); console.log('lc struct',Object.keys(out).length,'missing',miss,'bad',bad);
})();
