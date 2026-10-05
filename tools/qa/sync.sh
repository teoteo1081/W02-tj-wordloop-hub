R=/home/user/W02-tj-wordloop-hub
cp $R/js/game.js qa/js/game.js; cp $R/js/board.js qa/js/board.js; cp $R/css/game.css qa/css/game.css; cp $R/game.html qa/game.html; cp $R/game-version.json qa/game-version.json
sed -i 's/var DEFAULT_ROOM = "TJ"/var DEFAULT_ROOM = "ZZ_QA_AP"/' qa/js/game.js
grep -c ZZ_QA_AP qa/js/game.js
python3 - <<'PY'
p="qa/js/game.js"; s=open(p).read(); a='  $("#l-start").addEventListener("click", async function () {'
assert s.count(a)==1; s=s.replace(a,'  window.__t = { G: G, distractors: distractors, setTraps: function (m) { TRAPS = m; }, loadTraps: loadTraps, loadTree: loadTree, paintTree: paintTree, paintSide: paintSide, dotMenu: dotMenu, getTraps: function () { return TRAPS; }, last: function () { return lastTraps; } };\n'+a); open(p,"w").write(s)
PY
