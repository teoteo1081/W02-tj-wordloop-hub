// Thêm tiếng (zh, es) cho test_items: dịch câu, chủ điểm, lời giải, nghĩa từ vựng — OpenAI gpt-4o qua openai-proxy
const fs=require('fs'), REPO='/home/user/W02-tj-wordloop-hub';
const K=fs.readFileSync(REPO+'/js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K};
const LANGS=(process.argv[2]||'zh,es').split(','), NAME={zh:'Simplified Chinese',es:'Spanish'};
const F=process.env.ITEMS || __dirname+'/t1p5.json'   /* file JSON câu hỏi (KHÔNG để trong repo — bản quyền) */, rows=JSON.parse(fs.readFileSync(F));
async function ai(user){
  const sys=`You translate TOEIC study notes for learners. For each item return, for each target language (${LANGS.map(l=>l+'='+NAME[l]).join(', ')}): "stem" = natural translation of the full English sentence (with the blank filled by the correct answer), "tag" = grammar-topic label, "explain" = the explanation (translate the English explanation faithfully; EVERY English word or phrase that appears inside quotes or after → in the English explanation (e.g. 'until', 'will', 'by Ms. Jeon', has been approved) MUST be copied EXACTLY in English, never translated — the explanation is about English grammar), and "vocab" = short meaning of each vocab term in that language (same order). Reply JSON only: {"items":[{"id":"...","zh":{"stem":"","tag":"","explain":"","vocab":[""]},"es":{...}}]}`;
  for(let t=0;t<3;t++){try{const r=await fetch(SB+'/functions/v1/openai-proxy',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o',sys,user,temperature:0.2})});const j=await r.json();return JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g,'').trim());}catch(e){if(t==2)throw e;await new Promise(r=>setTimeout(r,2000));}}
}
(async()=>{
  const keys=r=>{const e=r.i18n.en.explain,out=[];e.replace(/'([^']+)'/g,(m,a)=>{out.push(a)});const arrow=e.split('→')[1];if(arrow)out.push(arrow.trim().replace(/\s*\(.*$/,'').replace(/[.]$/,''));return out.filter(k=>/[a-z]/i.test(k));};
  const bad=r=>LANGS.some(l=>{const x=(r.i18n||{})[l];return !x||keys(r).some(k=>x.explain.indexOf(k)<0);});
  const todo=rows.filter(bad); console.log('need redo',todo.map(r=>r.num).join(','));
  for(let i=0;i<todo.length;i+=5){
    const b=todo.slice(i,i+5);
    const user=JSON.stringify(b.map(r=>{const right=r.opts["ABCD".indexOf(r.answer)].replace(/^\([A-D]\)\s*/,'');return {id:r.id,sentence:r.stem.replace('_______',right),answer:right,tag_en:r.i18n.en.tag,explain_en:r.i18n.en.explain,vocab:r.vocab.map(v=>({t:v.t,en:v.en}))};}));
    const res=await ai(user);
    for(const it of res.items||[]){const r=b.find(x=>x.id===it.id);if(!r)continue;
      for(const l of LANGS){const x=it[l];if(!x||!x.explain||!x.stem)continue;
        r.i18n[l]={tag:x.tag,explain:x.explain,stem:x.stem};
        (x.vocab||[]).forEach((m,k)=>{if(r.vocab[k]&&m)r.vocab[k][l]=m;});}}
    console.log('done',Math.min(i+5,todo.length),'/',todo.length);
  }
  fs.writeFileSync(F,JSON.stringify(rows));
  const miss=rows.filter(r=>bad(r)||LANGS.some(l=>r.vocab.some(v=>!v[l]))).map(r=>r.num);
  console.log('missing',miss);
})();
