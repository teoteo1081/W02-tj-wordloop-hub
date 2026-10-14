import json,urllib.request
import os
PAT=os.environ['SUPABASE_PAT']; REF='pqarpszsipbdugrumhfy'   # export SUPABASE_PAT=sbp_... (KHÔNG ghi vào file)
def sql(q):
    r=urllib.request.Request(f'https://api.supabase.com/v1/projects/{REF}/database/query',json.dumps({'query':q}).encode(),{'Authorization':'Bearer '+PAT,'Content-Type':'application/json'})
    return json.load(urllib.request.urlopen(r,timeout=180))
