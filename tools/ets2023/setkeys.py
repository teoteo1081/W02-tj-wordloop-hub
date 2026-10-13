import json,sys,os
t=sys.argv[1]; LC=sys.argv[2].replace(' ',''); RC=sys.argv[3].replace(' ','')
assert len(LC)==100 and len(RC)==100,(len(LC),len(RC))
raw=json.load(open('book/rc_raw.json'))
bad=[(101+i,RC[i],raw[t][str(101+i)]['ans']) for i in range(100) if raw[t][str(101+i)]['ans']!=RC[i]]
print('test',t,'RC mismatches vs book:',bad)
os.makedirs(f't{int(t):02d}',exist_ok=True)
json.dump({'lc':{t:{str(i+1):c for i,c in enumerate(LC)}},'rc':{t:{str(101+i):c for i,c in enumerate(RC)}}},open(f't{int(t):02d}/keys.json','w'))
