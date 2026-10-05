# -*- coding: utf-8 -*-
import json, re, sys
d = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'dm_items.json'))
strip = lambda o: re.sub(r'^\([A-D]\)\s*', '', o)
for p in (3, 4, 5):
    its = [o for o in d if o['part'] == p]
    okl, badl, longest = [], [], 0
    for o in its:
        L = [len(strip(x)) for x in o['opts']]
        a = 'ABCD'.index(o['answer'])
        okl.append(L[a]); badl += [l for i, l in enumerate(L) if i != a]
        if L[a] == max(L) and L.count(max(L)) == 1: longest += 1
    ok = sum(okl) / len(okl); bad = sum(badl) / len(badl)
    print(f"P{p}: n={len(its)} dai_nhat={longest}/{len(its)} ({100*longest//len(its)}%) TB dung={ok:.0f} TB sai={bad:.0f} ti le={ok/bad:.2f}")
