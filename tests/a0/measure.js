"use strict";
// Static measurements only: no source is executed, and no network is used.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const baseline = require("../capture/baseline");

function tracked(root) {
  return cp.execFileSync("git", ["-C", root, "ls-files", "-z"], {encoding:"utf8"}).split("\0").filter(Boolean).sort();
}
function read(root, file) { return fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n"); }
function line(text, index) { return text.slice(0,index).split("\n").length; }
function hits(text, regex, file, map) {
  return Array.from(text.matchAll(regex), m => Object.assign({file, line:line(text,m.index)}, map ? map(m) : {}));
}
function run(root = baseline.defaultRoot(), options = {}) {
  root = path.resolve(root);
  const source = options.current ? {commit:cp.execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim(), pinned:false} : baseline.assertPinned(root);
  const files = tracked(root), js = files.filter(f => /^js\/.*\.js$/.test(f));
  const sizes = files.filter(f => /\.(js|css|html|md)$/.test(f)).map(file => {
    const t = read(root,file);
    return {file, lines:t ? t.split("\n").length - (t.endsWith("\n") ? 1 : 0) : 0, bytesLf:Buffer.byteLength(t)};
  });
  const supabase=[], storage=[], esc=[], globals=[], dependencies=[], appCalls=[];
  for (const file of js) {
    const t=read(root,file);
    supabase.push(...hits(t,/\.\s*(from|rpc|channel|removeChannel)\s*\(\s*(?:(["'])(.*?)\2)?/g,file,m=>({method:m[1], argument:m[3] === undefined ? "dynamic" : "literal", ...(m[3] === undefined ? {} : {name:m[3]})})));
    storage.push(...hits(t,/\blocalStorage\s*(?:\.\s*(getItem|setItem|removeItem|clear)\s*\(\s*(?:(["'])(.*?)\2|([A-Za-z_$][\w$]*))?|\[)/g,file,m=>({operation:m[1]||"indexed", ...(m[3] !== undefined ? {literalKey:m[3]} : m[4] ? {keyIdentifier:m[4]} : {key:"unresolved"})})));
    esc.push(...hits(t,/\b(?:function\s+esc\s*\(|esc\s*=\s*function\s*\()/g,file));
    globals.push(...hits(t,/\b(?:window|w)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g,file,m=>({name:m[1]})));
    dependencies.push(...hits(t,/\b(?:window|w)\.([A-Z][\w$]*)\b/g,file,m=>({target:m[1]})));
    appCalls.push(...hits(t,/\b(?:(?:window|w)\.)?App\.([A-Za-z_$][\w$]*)\s*\(/g,file,m=>({method:m[1]})));
  }
  const index=read(root,"index.html");
  const scripts=Array.from(index.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi),m=>m[1]).filter(s=>! /^(?:[a-z]+:|\/\/)/i.test(s)).map(s=>s.split(/[?#]/)[0]);
  const localKeys=[];
  for(const file of js) {
    const t=read(root,file);
    localKeys.push(...hits(t,/["'](tjwl_[A-Za-z0-9_:.-]+)["']/g,file,m=>({key:m[1]})));
  }
  return {source, methods:{counts:"Tracked files; LF-normalized UTF-8 bytes; nonempty final line counts once.", lexical:"Regex candidate inventory, includes comments/string bodies and non-Supabase .from calls. Not AST/call graph/runtime evidence. Variable aliases and computed properties may be missed.", storage:"localStorage operations plus tjwl_* literal candidates; identifiers/dynamic keys need runtime LS-01 capture.", dependencies:"window/w global references and lexical App method calls, not closure-variable sharing or complete module dependency graph.", browser:"Transfer/compressed bytes, interaction coverage, LCP and runtime memory require browser measurements."}, files:sizes, largestJs:sizes.filter(x=>/^js\/.*\.js$/.test(x.file)).sort((a,b)=>b.lines-a.lines).slice(0,10), supabaseCandidates:supabase, localStorage:{referenceFiles:js.filter(f=>/\blocalStorage\b/.test(read(root,f))),files:[...new Set(storage.map(x=>x.file))],operations:storage,keyLiteralCandidates:localKeys}, escDefinitions:esc, globalAssignments:globals, dependencyCandidates:dependencies, appReverseCalls:appCalls.filter(x=>x.file!=="js/app.js"), indexLocalScripts:{files:scripts, missing:scripts.filter(f=>!files.includes(f)), bytesLf:scripts.filter(f=>files.includes(f)).reduce((n,f)=>n+Buffer.byteLength(read(root,f)),0)}, pending:["Browser performance measurements", "Runtime localStorage key inventory", "Full closure-variable sharing graph before splitting game.js"]};
}
if(require.main===module) {
  try { process.stdout.write(JSON.stringify(run(process.argv[2] && process.argv[2]!=="--current" ? process.argv[2] : undefined,{current:process.argv.includes("--current")}),null,2)+"\n"); }
  catch(e) { process.stderr.write("Measurement refused: "+e.message+"\n"); process.exitCode=1; }
}
module.exports={run,tracked,read,line,hits};
