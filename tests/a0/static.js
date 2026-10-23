"use strict";
// Only PO-reviewed cache exceptions may pass; --preview forbids deferred config caching debt.
const fs=require("node:fs"), path=require("node:path"), cp=require("node:child_process");
const baseline=require("../capture/baseline"), {tracked,read,line}=require("./measure");
const cachePolicy=require("./cache-policy");
function isNonReadingRule(file,selector,property) {
  // Reviewed UI roles: profile menu subtitle and admin invite-link code, not reading/vocabulary.
  return file==="css/app.css" && property==="word-break:break-all" && [".menu-sub",".admin-new-link code"].includes(selector);
}
function run(root=baseline.defaultRoot(),options={}) {
  root=path.resolve(root);
  const source=options.current ? {pinned:false} : baseline.assertPinned(root);
  const files=tracked(root), details=[];
  function result(id,issues,note) { details.push({id,status:issues.length ? "pending" : "passed",issues,note}); }
  const syntax=[];
  for(const file of files.filter(f=>f.endsWith(".js"))) {
    const p=cp.spawnSync(process.execPath,["--check",path.join(root,file)],{encoding:"utf8"});
    if(p.status!==0) syntax.push({file,reason:"node --check rejected syntax (source excerpt suppressed)"});
  }
  result("STA-01",syntax,"Every tracked .js checked, without execution.");
  const starter=JSON.parse(read(root,"data/starter.json")), version=JSON.parse(read(root,"data/starter.version.json"));
  result("STA-02",starter.version===version.version ? [] : [{file:"data/starter.json",reason:"version differs from starter.version.json"}],"Strict string equality.");
  const cache=[];
  for(const file of files.filter(f=>/^(?:index|game)\.html$|^learn\/[^/]+\/index\.html$/.test(f))) {
    const t=read(root,file);
    for(const m of t.matchAll(/<(script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
      const url=m[2];
      if(!/^(?:[a-z]+:|\/\/|#)/i.test(url) && !/[?&]v=[^&#]+/.test(url)) cache.push({file,line:line(t,m.index),resource:url,reason:"Local script/link has no ?v="});
    }
  }
  const game=read(root,"game.html").match(/\bsrc=["']js\/game\.js\?v=([^"'&]+)/), gv=JSON.parse(read(root,"game-version.json"));
  if(!game || String(gv.v)!==game[1]) cache.push({file:"game.html",reason:"game.js version differs from game-version.json"});
  const activeCachePolicy=cachePolicy.load();
  // Immutable source keeps its approved baseline exceptions as the control.
  // Current code uses the shrinking active policy, so fixing/removing config debt
  // cannot make an unrelated immutable baseline check start failing.
  const cacheReview=cachePolicy.classify(cache,options.current ? activeCachePolicy : cachePolicy.approvedBaseline(),!!options.preview);
  result("STA-03",cacheReview.blocked,"Approved baseline ratchet; until-preview config exception cannot pass --preview. GAME_VER derives from game.js query string.");
  details[details.length-1].accepted=cacheReview.accepted;
  if(options.preview && cacheReview.blocked.length) details[details.length-1].status="failed";
  const secrets=[], examples=[];
  for(const file of files.filter(f=>/^js\/|^supabase\/|^[^/]+\.html$|^tools\/.*\.js$/.test(f))) {
    const t=read(root,file);
    for(const m of t.matchAll(/GEMINI_API_KEY\s*=|sb_secret_|sbp_/g)) {
      const row=t.slice(t.lastIndexOf("\n",m.index)+1,t.indexOf("\n",m.index)<0?t.length:t.indexOf("\n",m.index));
      // The spec explicitly excludes clearly annotated examples. Accept only
      // comment lines whose assignment value is literally ... or <key thật>.
      if(/^\s*\/\//.test(row) && /^GEMINI_API_KEY\s*=\s*(?:\.\.\.|<key thật>)/.test(t.slice(m.index))) examples.push({file,line:line(t,m.index),reason:"Explicit deployment example in // comment; no credential value"});
      else secrets.push({file,line:line(t,m.index),reason:"Secret-like marker; review example/comment context privately; matched value suppressed"});
    }
  }
  result("STA-04",secrets,"Conservative scan; examples require explicit review, no source snippets emitted.");
  details[details.length-1].examples=examples;
  let anon=false;
  try {
    const key=read(root,"js/config.js").match(/SUPABASE_ANON_KEY\s*:\s*["']([^"']+)["']/)[1];
    anon=JSON.parse(Buffer.from(key.split(".")[1],"base64url").toString("utf8")).role==="anon";
  } catch(_) {}
  result("STA-05",anon ? [] : [{file:"js/config.js",reason:"Anon-key JWT payload absent/invalid or role differs from anon"}],"Decoded role only, no key printed; does not verify JWT signature.");
  result("STA-06",files.filter(f=>/\.(pdf|mp3)$/i.test(f)).map(file=>({file,reason:"Tracked PDF/MP3 requires explicit PO-approved permitted-file list"})),"No PDF/MP3 automatically allowed.");
  const css=[], nonReading=[];
  for(const file of files.filter(f=>/\.css$|\.html$/.test(f))) {
    const t=read(root,file);
    // CSS files and style blocks only; inline styles are scanned separately.
    const regions=file.endsWith(".css") ? [{text:t,offset:0}] : [...Array.from(t.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),m=>({text:m[1],offset:m.index+m[0].indexOf(m[1])})),...Array.from(t.matchAll(/\bstyle\s*=\s*(["'])(.*?)\1/gi),m=>({text:m[2],offset:m.index+m[0].indexOf(m[2])}))];
    for(const r of regions) for(const m of r.text.matchAll(/\b(?:hyphens\s*:\s*auto|overflow-wrap\s*:\s*anywhere|word-break\s*:\s*break-all)\b/gi)) {
      const open=r.text.lastIndexOf("{",m.index), prefix=r.text.slice(0,open), selector=open<0 ? "<inline-or-unknown>" : prefix.slice(Math.max(prefix.lastIndexOf("}"),prefix.lastIndexOf("{"))+1).replace(/\/\*[\s\S]*?\*\//g,"").trim();
      const issue={file,line:line(t,r.offset+m.index),selector,property:m[0].toLowerCase().replace(/\s+/g,""),reason:"Candidate forbidden wrapping rule; reading/vocabulary scope must be checked"};
      if(isNonReadingRule(file,selector,issue.property)) nonReading.push({...issue,reason:"Reviewed menu/admin rule outside reading/vocabulary scope, not a baseline violation exception"});
      else css.push(issue);
    }
  }
  result("STA-07",css,"Conservative wrapping scan; only two exact reviewed menu/admin selectors are out of scope, all other candidates remain pending.");
  details[details.length-1].outOfScope=nonReading;
  const sw=read(root,"sw.js"), assets=sw.match(/\b(?:var|let|const)\s+ASSETS\s*=\s*\[([\s\S]*?)\]/), missing=[];
  if(!assets) missing.push({file:"sw.js",reason:"ASSETS literal array not found"});
  else for(const m of assets[1].matchAll(/["']([^"']+)["']/g)) {
    const rel=m[1].split(/[?#]/)[0], resolved=path.resolve(root,rel);
    if(!resolved.startsWith(root+path.sep) && resolved!==root || !fs.existsSync(resolved)) missing.push({file:"sw.js",resource:rel,reason:"ASSETS path missing or outside source root"});
  }
  result("STA-08",missing,"Every quoted ASSETS member resolved on disk; no service-worker/network execution.");
  // On current code, distinguish newly introduced candidates from baseline findings.
  if(options.current) {
    const base=run(baseline.defaultRoot(),{preview:!!options.preview});
    for(const d of details) {
      const old=base.details.find(x=>x.id===d.id).issues;
      const key=x=>JSON.stringify(x);
      d.newIssues=d.issues.filter(x=>!old.some(y=>key(x)===key(y)));
      if(d.newIssues.length) d.status="failed";
    }
  }
  return {source,passed:details.filter(x=>x.status==="passed").length,failed:details.filter(x=>x.status==="failed").length,pending:details.filter(x=>x.status==="pending").length,details};
}
if(require.main===module) {
  try { const r=run(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : undefined,{current:process.argv.includes("--current"),preview:process.argv.includes("--preview")}); process.stdout.write(JSON.stringify(r,null,2)+"\n"); if(r.failed||r.pending)process.exitCode=1; }
  catch(e) {process.stderr.write("Static verification refused: "+e.message+"\n");process.exitCode=1;}
}
module.exports={run,isNonReadingRule};
