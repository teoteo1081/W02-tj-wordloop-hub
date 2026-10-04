// Ghi lời thoại (OUT của toeic_script_struct.js) vào test_items.i18n.scr của MỌI câu trong nhóm. Chạy: IN=<json> TESTS=1,2 NODE_USE_ENV_PROXY=1 node tools/toeic_script_upload.js
const fs=require('fs');
const K=fs.readFileSync(__dirname+'/../js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const D=JSON.parse(fs.readFileSync(process.env.IN,'utf8'));
(async()=>{
  for(const t of process.env.TESTS.split(',')){
    const G=D[t]||{}; const r=await fetch(`${SB}/rest/v1/test_items?exam=eq.toeic&test=eq.${t}&part=lte.4&select=id,num,i18n`,{headers:H}); const items=await r.json();
    let ok=0,miss=[];
    for(const it of items){
      const g=Object.values(G).find(x=>x.nums.includes(it.num)); if(!g){miss.push(it.num);continue;}
      const i18n=Object.assign({},it.i18n||{},{scr:{lines:g.lines,ev:g.ev||{}}});
      const p=await fetch(`${SB}/rest/v1/test_items?id=eq.${encodeURIComponent(it.id)}`,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({i18n})});
      if(p.ok) ok++; else console.log('fail',it.id,p.status,await p.text());
    }
    console.log('T'+t,'items',items.length,'updated',ok,'no script',miss.join(','));
  }
})();
