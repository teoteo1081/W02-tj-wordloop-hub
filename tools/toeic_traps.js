// 🪤 Bẫy từng đáp án sai (TOEIC) — OpenAI gpt-4o, 4 thứ tiếng; giữ nguyên từ tiếng Anh trong ngoặc
const fs=require('fs'), REPO='/home/user/W02-tj-wordloop-hub';
const K=fs.readFileSync(REPO+'/js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K};
const F=process.env.ITEMS||__dirname+'/t1p5.json'   /* file JSON câu hỏi — KHÔNG để trong repo (bản quyền) */, rows=JSON.parse(fs.readFileSync(F)), LANGS=['vi','en','zh','es'];
const sys=`You are an expert TOEIC teacher. For each question, explain the TRAP of every WRONG option in ONE short sentence (max ~25 words): first what makes it tempting (looks similar, same root word, common collocation, fits part of the sentence…), then the PRECISE grammatical or meaning reason it fails in THIS sentence (e.g. 'active voice, but the subject \'it\' receives the action → needs passive'; 'adjective, but the blank modifies the verb → needs an adverb'; 'means X, which contradicts Y'). Be accurate and specific to the sentence; do NOT write generic phrases like 'Test-takers might confuse' or 'not suitable here'. Also give "trap_type": a short label of the trap category for the whole question (e.g. "Word form", "Similar meaning", "Collocation", "Tense", "Preposition pair"). Write in 4 languages: vi (Vietnamese), en (English), zh (Simplified Chinese), es (Spanish). In vi/zh/es, keep every English word, option or grammar keyword EXACTLY in English inside quotes (e.g. 'him', 'until', 'will'). Reply JSON only: {"items":[{"id":"...","vi":{"type":"","traps":{"A":"","C":""}},"en":{...},"zh":{...},"es":{...}}]} — traps keyed by the letters of the WRONG options only.`;
async function ai(user){for(let t=0;t<3;t++){try{const r=await fetch(SB+'/functions/v1/openai-proxy',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o',sys,user,temperature:0.2})});const j=await r.json();return JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g,'').trim());}catch(e){if(t==2)throw e;await new Promise(r=>setTimeout(r,2000));}}}
(async()=>{
  const ok=r=>LANGS.every(l=>{const x=r.i18n&&r.i18n[l];if(!x||!x.traps)return false;const wrong="ABCD".split('').filter(k=>k!==r.answer);return wrong.every(k=>x.traps[k]&&x.traps[k].length>5);});
  const todo=rows.filter(r=>!ok(r)); console.log('todo',todo.length);
  for(let i=0;i<todo.length;i+=5){const b=todo.slice(i,i+5);
    const user=JSON.stringify(b.map(r=>({id:r.id,sentence:r.stem,options:r.opts,correct:r.answer,explanation:r.i18n.en.explain})));
    const res=await ai(user);
    for(const it of res.items||[]){const r=b.find(x=>x.id===it.id);if(!r)continue;for(const l of LANGS){const x=it[l];if(!x||!x.traps)continue;r.i18n[l]=r.i18n[l]||{};r.i18n[l].traps=x.traps;r.i18n[l].trap_type=x.type;}}
    console.log('done',Math.min(i+5,todo.length));}
  fs.writeFileSync(F,JSON.stringify(rows)); console.log('still missing',rows.filter(r=>!ok(r)).map(r=>r.num));
})();
