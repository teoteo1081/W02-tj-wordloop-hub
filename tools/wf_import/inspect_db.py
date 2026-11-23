import urllib.request
import json

url = 'https://pqarpszsipbdugrumhfy.supabase.co/rest/v1'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxYXJwc3pzaXBiZHVncnVtaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDc0NTcsImV4cCI6MjEwNDI4MzQ1N30.zB6uvPPt-vQ78TVwPUTMmfulbFVz-lNz9F5RJF9owwc'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

def get(path):
    req = urllib.request.Request(f'{url}/{path}', headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

nb_id = 'a2571e0c-d952-41ad-98ca-b12fa173e98a'
sec_id = '0f1fd8e3-bce9-4edf-8677-13493e553479'

nb = get(f'notebooks?id=eq.{nb_id}')
print('Notebook:', nb)

secs = get(f'sections?notebook_id=eq.{nb_id}')
print(f'Sections in notebook: {len(secs)}')
for s in secs:
    sid = s['id']
    sname = s['name']
    pages = get(f'pages?section_id=eq.{sid}')
    print(f' - Section: {sid} ({sname}) -> {len(pages)} pages')

# Specifically inspect section 0f1fd8e3-bce9-4edf-8677-13493e553479
sec_pages = get(f'pages?section_id=eq.{sec_id}')
print(f'\nTarget section {sec_id} has {len(sec_pages)} pages.')

# Check global_index in notebook across all sections
all_blocks = []
for s in secs:
    pages = get(f'pages?section_id=eq.{s["id"]}')
    for p in pages:
        batches = get(f'batches?page_id=eq.{p["id"]}')
        for b in batches:
            blocks = get(f'blocks?batch_id=eq.{b["id"]}')
            all_blocks.extend(blocks)

print(f'Total blocks in entire notebook: {len(all_blocks)}')
if all_blocks:
    g_indices = [b.get('global_index') for b in all_blocks if b.get('global_index') is not None]
    print(f'Existing global_index count: {len(g_indices)}, max: {max(g_indices) if g_indices else None}')
else:
    print('No blocks in this notebook yet. global_index will start from 1.')
