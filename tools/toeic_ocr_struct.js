// Dựng câu hỏi Reading (Part 5/6/7) từ chữ OCR (tesseract --psm 3, mỗi trang 1 file p-XX.txt) bằng gpt-4o qua openai-proxy.
// Cách chạy: OCR=<thư mục p-*.txt> TEST=<số đề> KEYS=<keys.json {rc:{<đề>:{<câu>:"A"}}}> OUT=<file json> NODE_USE_ENV_PROXY=1 node tools/toeic_ocr_struct.js
// Ra đúng định dạng test_items (answer = đáp án chính thức, answer_src='key'). Tự kiểm: đủ 30/16/54 câu, mỗi câu 4 lựa chọn.
// KHÔNG commit chữ đề vào repo (bản quyền ETS) — OUT để ở scratchpad.
const fs=require('fs'), path=require('path'), REPO=__dirname+'/..';
const K=fs.readFileSync(REPO+'/js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K};
const T=process.env.TEST, KEY=JSON.parse(fs.readFileSync(process.env.KEYS)).rc[T];
const pages=fs.readdirSync(process.env.OCR).filter(f=>/^p-\d+\.txt$/.test(f)).sort().map(f=>fs.readFileSync(path.join(process.env.OCR,f),'utf8'));
const all=pages.join('\n\n=== PAGE ===\n\n').replace(/GO ON TO THE NEXT PAGE/g,'');
/* bản OCR CẮT CỘT từng trang (c<trang>L/R.txt, tools: colhalves.py) — dùng để cứu nhóm câu bị thiếu lựa chọn do 2 cột */
const colTxt=n=>['L','R'].map(sd=>{const f=path.join(process.env.OCR,'c'+String(n).padStart(2,'0')+sd+'.txt');return fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';}).join('\n');
const okOpts=qs=>(qs||[]).length&&qs.every(q=>(q.opts||[]).length===4&&q.opts.every(o=>String(o).replace(/^\([A-D]\)\s*/,'').trim().length>0));
async function ai(sys,user){for(let t=0;t<3;t++){try{const r=await fetch(SB+'/functions/v1/openai-proxy',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o',sys,user,temperature:0})});const j=await r.json();return JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g,'').trim());}catch(e){if(t==2)throw e;await new Promise(r=>setTimeout(r,3000));}}}
const L='ABCD', opts=o=>o.map((x,i)=>'('+L[i]+') '+String(x).replace(/^\([A-D]\)\s*/,'').trim());
const FIX='The text is OCR of a scanned TOEIC test (two-column layout: question numbers may be listed before their texts; fix obvious OCR errors like "l"/"1", broken hyphenation, stray characters, but NEVER change wording otherwise). Blanks are shown as "-------".';
(async()=>{
  const items=[];
  // Part 5
  /* Part 5 in 2 cột: ưu tiên bản OCR CẮT ĐÔI trang (h<trang>L/R.txt, tools: p5halves.py) — OCR cả trang hay lẫn đáp án giữa 2 cột */
  const hv=fs.readdirSync(process.env.OCR).filter(f=>/^h\d+[LR]\.txt$/.test(f)).sort();
  const p5=hv.length ? hv.map(f=>fs.readFileSync(path.join(process.env.OCR,f),'utf8')).join('\n') : all.slice(all.indexOf('PART 5'), all.indexOf('PART 6'));
  const r5=await ai(FIX+' Extract Part 5 questions 101-130. Reply JSON only {"q":[{"num":101,"stem":"... _______ ...","opts":["","","",""]}]} — replace the blank in the stem with exactly 7 underscores "_______".',p5);
  for(const q of r5.q||[]) items.push({id:`ets_t${T}_p5_${q.num}`,exam:'toeic',test:T,part:5,num:q.num,stem:q.stem,opts:opts(q.opts),answer:KEY[q.num],passage:null,src:`TEST_${T}_RC.pdf`,answer_src:'key'});
  // Part 6 + 7: tách theo "Questions X-Y refer to"
  const body=all.slice(all.indexOf('PART 6'));
  const re=/Questions?\s+(\d{3})\s*[-–~]\s*(\d{3})\s+refer\s+to\s+the\s+following\s+([^.\n]*)/g; let m, hs=[];
  while((m=re.exec(body))) hs.push({a:+m[1],b:+m[2],kind:m[3].trim(),at:m.index});
  for(let i=0;i<hs.length;i++){
    const h=hs[i], chunk=body.slice(h.at, i+1<hs.length?hs[i+1].at:undefined), part=h.a<=146?6:7;
    const sys=FIX+(part==6
      ? ` Extract the Part 6 text and questions ${h.a}-${h.b}. In the passage mark each blank as -------(N) with its question number. Each question has 4 options (some are full sentences). Reply JSON only {"passage":"[${h.kind}]\\n<full text with line breaks>","qs":[{"num":${h.a},"opts":["","","",""]}]}`
      : ` Extract the Part 7 text(s) and questions ${h.a}-${h.b}. If there are several texts (e.g. e-mail + form), put each under its own heading line in square brackets like [E-mail], [Form]. Keep tables as readable lines. Keep markers like — [1] — exactly. Reply JSON only {"passage":"[Heading]\\n<text>","qs":[{"num":${h.a},"stem":"question text (keep quoted sentence on a new line)","opts":["","","",""]}]}`);
    let r=await ai(sys,chunk);
    if(!okOpts(r.qs)||(r.qs||[]).length!==h.b-h.a+1){   /* thiếu lựa chọn / thiếu câu -> đọc lại kèm bản cắt cột của các trang chứa nhóm này */
      const p0=(body.slice(0,h.at).match(/=== PAGE ===/g)||[]).length, p1=p0+(chunk.match(/=== PAGE ===/g)||[]).length, startPage=all.slice(0,all.indexOf('PART 6')).split('=== PAGE ===').length;
      let cols=''; for(let k=startPage+p0;k<=startPage+p1;k++) cols+='\n--- page '+k+' (column-split OCR) ---\n'+colTxt(k);
      const r2=await ai(sys+' A second OCR of the same pages, split by column, is appended after "=== COLUMN OCR ===" — use it to recover options or questions missing from the first OCR.',chunk+'\n\n=== COLUMN OCR ===\n'+cols);
      if(okOpts(r2.qs)) r=r2; console.log('retry',h.a,okOpts(r2.qs));
    }
    for(const q of r.qs||[]) items.push({id:`ets_t${T}_p${part}_${q.num}`,exam:'toeic',test:T,part,num:q.num,stem:part==6?`Choose the best answer for blank (${q.num}).`:q.stem,opts:opts(q.opts),answer:KEY[q.num],passage:r.passage,src:`TEST_${T}_RC.pdf`,answer_src:'key',group:h.a+'-'+h.b,kind:h.kind});
    console.log('group',h.a,h.b,(r.qs||[]).length);
  }
  items.sort((a,b)=>a.num-b.num);
  const nums=items.map(x=>x.num), miss=[]; for(let n=101;n<=200;n++) if(!nums.includes(n)) miss.push(n);
  const bad=items.filter(x=>x.opts.length!==4||x.opts.some(o=>o.replace(/^\([A-D]\)\s*/,'').trim().length<1)||!x.answer||!String(x.stem||'').trim()||(x.part===5&&x.stem.indexOf('_______')<0)).map(x=>x.num);
  fs.writeFileSync(process.env.OUT,JSON.stringify(items,null,1));
  console.log('test',T,'items',items.length,'missing',miss,'bad',bad);
})();
