// Tách LỜI THOẠI (transcript) Listening từ OCR sách lời giải ETS (tiếng Hàn + lời thoại tiếng Anh) bằng gpt-4o qua openai-proxy.
// Chạy: OCR=<thư mục p001.txt…> RANGES='1:1-31,2:32-60,…' OUT=<file json> NODE_USE_ENV_PROXY=1 node tools/toeic_script_struct.js
// Kết quả {"<test>":{"<num đầu nhóm>":{part,nums,lines:[{sp,t}],ev:{num:"câu chứa đáp án"}}}} — KHÔNG commit chữ đề (bản quyền ETS).
const fs=require('fs'), path=require('path');
const K=fs.readFileSync(__dirname+'/../js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K};
const D=process.env.OCR, OUT=process.env.OUT;
const pg=n=>{const f=path.join(D,'p'+String(n).padStart(3,'0')+'.txt');return fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';};
async function ai(sys,user){for(let t=0;t<3;t++){try{const r=await fetch(SB+'/functions/v1/openai-proxy',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o',sys,user,temperature:0})});const j=await r.json();return JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g,'').trim());}catch(e){if(t==2){console.error('ai fail',e.message);return {g:[]};}await new Promise(r=>setTimeout(r,4000));}}}
const SYS=`OCR of pages from a Korean TOEIC Listening answer book (ETS). Each page mixes the ENGLISH audio script with Korean translation/explanations (Korean OCR is garbage — ignore it).
Extract the English audio script for every question / question group whose script is on these pages:
- Part 1 (Q1-6): the four statements (A)-(D).
- Part 2 (Q7-31): the question line (speaker code like W-Am, M-Cn) + responses (A)-(C).
- Part 3/4 (Q32-100, groups of 3 like "32-34"): the full conversation/talk, one entry per speaker turn, speaker codes kept (W-Am, M-Au, M-Cn, W-Br …; Part 4 often one speaker).
Fix obvious OCR errors so the English reads naturally, but do NOT invent content. Drop stray superscript digits / marks.
For Part 3/4 also give "ev": for each question number, the exact sentence(s) from the script that contain the answer (explanations quote it in parentheses after Korean text, and the script marks it with a small superscript question number).
Reply JSON only: {"g":[{"part":3,"nums":[32,33,34],"lines":[{"sp":"W-Am","t":"..."}],"ev":{"32":"...","33":"...","34":"..."}}, {"part":2,"nums":[7],"lines":[{"sp":"W-Am","t":"Where is ...?"},{"sp":"M-Cn","t":"(A) ..."},{"sp":"","t":"(B) ..."},{"sp":"","t":"(C) ..."}]}]}
Include a group only if its script (not just its explanation) is on these pages; if a script is cut by the page end, include what is there.`;
(async()=>{
  const res=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):{};
  const R=process.env.RANGES.split(',').map(x=>{const [t,r]=x.split(':');const [a,b]=r.split('-').map(Number);return {t,a,b};});
  const jobs=[]; for(const {t,a,b} of R){ if(res[t]&&Object.keys(res[t]).length>=50) continue; res[t]=res[t]||{}; for(let s=a;s<=b;s+=2) jobs.push({t,s,e:Math.min(b,s+2)}); }
  let i=0; const work=async()=>{ while(i<jobs.length){ const j=jobs[i++]; let txt=''; for(let n=j.s;n<=j.e;n++) txt+=`\n=== PAGE ${n} ===\n`+pg(n);
      const r=await ai(SYS,txt);
      for(const g of r.g||[]){ if(!g.nums||!g.nums.length||!g.lines) continue; const k=String(g.nums[0]), old=res[j.t][k];
        const len=x=>x.lines.map(l=>l.t).join(' ').length; if(!old||len(g)>len(old)) res[j.t][k]={part:g.part,nums:g.nums,lines:g.lines,ev:Object.assign({},old&&old.ev,g.ev||{})}; else if(g.ev) old.ev=Object.assign({},g.ev,old.ev); }
      fs.writeFileSync(OUT,JSON.stringify(res)); process.stdout.write('.'); } };
  await Promise.all([work(),work(),work()]);
  for(const t in res){ const ks=Object.keys(res[t]).map(Number), nums=new Set(); ks.forEach(k=>res[t][k].nums.forEach(n=>nums.add(n))); const miss=[]; for(let n=1;n<=100;n++) if(!nums.has(n)) miss.push(n); console.log('\nT'+t,'groups',ks.length,'missing',miss.join(',')); }
})();
