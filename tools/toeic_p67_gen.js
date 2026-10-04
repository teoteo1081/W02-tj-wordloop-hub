// Soạn lời giải Part 6/7 (đề TOEIC) bằng OpenAI gpt-4o qua openai-proxy: chủ điểm (bộ nhãn cố định), lời giải + dịch câu hỏi
// + bẫy từng đáp án sai (vi/en/zh/es), từ vựng (vi/en/zh/es), dịch cả bài đọc (vi/zh/es, mỗi nhóm câu 1 lần).
// Cách chạy: ITEMS=<file json câu hỏi, KHÔNG để trong repo — bản quyền> NODE_USE_ENV_PROXY=1 node tools/toeic_p67_gen.js
// Ghi đè lại vào chính file ITEMS; chạy lại được (chỉ làm câu/nhóm còn thiếu).
const fs=require('fs'), REPO=__dirname+'/..';
const K=fs.readFileSync(REPO+'/js/config.js','utf8').match(/eyJ[^"]*/)[0], SB='https://pqarpszsipbdugrumhfy.supabase.co', H={apikey:K,Authorization:'Bearer '+K};
const F=process.env.ITEMS, rows=JSON.parse(fs.readFileSync(F)), LANGS=['vi','en','zh','es'], NAME={vi:'Vietnamese',en:'English',zh:'Simplified Chinese',es:'Spanish'};
const TAGS={
  word_form:['Từ loại','Word form','词性','Forma de la palabra'], verb_form:['Thì & dạng động từ','Verb tense & form','动词时态与形式','Tiempo y forma verbal'],
  connector:['Từ nối','Connector','连接词','Conector'], pronoun:['Đại từ','Pronoun','代词','Pronombre'], vocabulary:['Từ vựng','Vocabulary','词汇','Vocabulario'],
  inversion:['Đảo ngữ điều kiện','Conditional inversion','条件倒装','Inversión condicional'], sentence:['Chọn câu điền vào đoạn','Sentence insertion','选句填空','Inserción de oración'],
  purpose:['Mục đích bài','Purpose','文章目的','Propósito'], detail:['Chi tiết','Detail','细节题','Detalle'], inference:['Suy luận','Inference','推断题','Inferencia'],
  synonym:['Từ đồng nghĩa','Synonym','同义词','Sinónimo'], position:['Vị trí câu [1]–[4]','Sentence position','句子位置','Posición de la oración'],
  not_true:['Câu hỏi NOT','NOT question','NOT题','Pregunta NOT'], intent:['Ý người viết','Writer\'s intent','作者意图','Intención del autor'],
  audience:['Đối tượng / nơi đăng','Audience & location','对象与出处','Destinatario y lugar'], multi:['Liên kết nhiều bài','Cross-reference','多篇关联','Referencia cruzada'],
  preposition:['Giới từ','Preposition','介词','Preposición'], relative:['Đại từ quan hệ','Relative pronoun','关系代词','Pronombre relativo'],
  comparison:['So sánh','Comparison','比较级','Comparación'], participle:['Phân từ (V-ing / V-ed)','Participle','分词','Participio'],
  conjunction:['Liên từ','Conjunction','连词','Conjunción'], collocation:['Cụm từ cố định','Collocation','固定搭配','Colocación']};
async function ai(sys,user,tries=3){
  for(let t=0;t<tries;t++){try{const r=await fetch(SB+'/functions/v1/openai-proxy',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o',sys,user,temperature:0.2})});
    const j=await r.json();return JSON.parse(j.choices[0].message.content.replace(/^```(json)?|```$/g,'').trim());}catch(e){if(t==tries-1)throw e;await new Promise(r=>setTimeout(r,2500));}}
}
const SYS_Q=`You are a TOEIC Reading teacher writing answer notes for learners worldwide. You get a passage, ONE question (Part 6 = blank in the passage, Part 7 = reading question), its 4 options and the correct letter (trust it).
Return JSON only:
{"tag":"<one key from: ${Object.keys(TAGS).join(', ')}>",
 "vi":{"stem":"","explain":"","traps":{"<wrong letter>":""},"trap_type":""}, "en":{...}, "zh":{...}, "es":{...},
 "vocab":[{"t":"","pos":"n|v|adj|adv|phr","vi":"","en":"","zh":"","es":""}]}
Rules:
- "stem": Part 5 = natural translation of the full sentence with the blank filled by the correct answer; Part 6 = natural translation of the passage sentence containing the blank, with the correct answer filled in; Part 7 = translation of the question together with the correct answer (e.g. "Thông báo dành cho ai? → Nông dân"). For "en", stem is the English sentence/question+answer itself.
- "explain": 1–3 short sentences, simple words (learners are beginners). Point to the EVIDENCE in the passage by quoting the exact English words in single quotes; every English word/phrase in quotes or after → MUST stay in English, never translated.
- "traps": for EACH of the 3 wrong letters, one short sentence why it is tempting but wrong (quote English words in single quotes, keep them English). "trap_type": a 2–5 word label of the trap kind.
- "vocab": 3–4 useful words/phrases from the passage that this question depends on (base form), with short meanings; "en" = short English definition.
- vi/zh/es must be faithful translations of the same content.`;
const SYS_P=l=>`Translate the TOEIC reading passage into natural ${NAME[l]} for learners. Keep the layout (headings in [brackets], line breaks, names, e-mail addresses, URLs, numbers). Keep blank markers like -------(131) exactly as they are. Reply JSON only: {"text":"..."}`;
(async()=>{
  const save=()=>fs.writeFileSync(F,JSON.stringify(rows,null,1));
  const groups={}; rows.forEach(r=>(groups[r.group]=groups[r.group]||[]).push(r));
  for(const g of Object.keys(groups)){ const rs=groups[g], src=rs[0]; if(!src.passage) continue;   /* Part 5: không có bài đọc */
    for(const l of ['vi','zh','es']){ if(src.ptr&&src.ptr[l])continue;
      const res=await ai(SYS_P(l),src.passage); if(!res.text)throw new Error('no text '+g+l);
      rs.forEach(r=>{r.ptr=r.ptr||{};r.ptr[l]=res.text;}); save(); console.log('passage',g,l);}
  }
  for(const r of rows){ if(r.i18n&&r.i18n.es&&r.vocab)continue;
    const user=JSON.stringify({part:r.part,question_number:r.num,passage:r.passage,question:r.stem,options:r.opts,correct:r.answer});
    let res; for(let t=0;t<3;t++){res=await ai(SYS_Q,user); const wrong="ABCD".split('').filter(x=>x!==r.answer);
      if(TAGS[res.tag]&&LANGS.every(l=>res[l]&&res[l].explain&&res[l].stem&&wrong.every(w=>res[l].traps&&res[l].traps[w]))&&(res.vocab||[]).length)break; res=null;}
    if(!res){console.log('FAIL',r.num);continue;}
    r.tag=TAGS[res.tag][0]; r.tagkey=res.tag; r.i18n={};
    LANGS.forEach((l,i)=>{const x=res[l];r.i18n[l]={tag:TAGS[res.tag][i],explain:x.explain,stem:x.stem,traps:x.traps,trap_type:x.trap_type};if(l!=='en'&&r.ptr&&r.ptr[l])r.i18n[l].passage=r.ptr[l];});
    r.explain=r.i18n.vi.explain; r.stem_vi=r.i18n.vi.stem; r.vocab=res.vocab; save(); console.log('q',r.num,res.tag);
  }
  console.log('missing',rows.filter(r=>!r.i18n||!r.i18n.es).map(r=>r.num));
})();
