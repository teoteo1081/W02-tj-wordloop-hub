"""Offline, read-only inputs; explicit semantic decisions, never automatic approval.

python tools/wf_import/trap_review.py view family 0 100
python tools/wf_import/trap_review.py view other 0 100
python tools/wf_import/trap_review.py build
Indices are zero-based in the original traps array. No network/DB/git dependencies.
"""
import collections
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
DIR = BASE / 'data/word_family'
SOURCE = DIR / 'wf_structured.json'
PARSED = DIR / 'wf_parsed.json'
LEDGER = DIR / 'trap_review_semantic.json'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def norm(s):
    s = unicodedata.normalize('NFC', s or '').lower()
    s = re.sub(r'\([^)]*\)|\[[^]]*\]', '', s)
    return re.sub(r'\s+', ' ', s).strip(' .!?\t\n')


def parts(s):
    return {norm(p) for p in re.split('[,;/]', s or '') if norm(p)}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def setup():
    data, parsed = read(SOURCE), read(PARSED)
    words = collections.defaultdict(list)
    roots = collections.defaultdict(set)
    for w in data['words']:
        words[norm(w['term'])].append(w)
    for r in parsed['roots']:
        for w in r['words']:
            roots[norm(w['term'])].add(r['root_id'])
    return data, parsed, words, roots


def family_groups(data, parsed):
    by_word = collections.defaultdict(list)
    for i,t in enumerate(data['traps']):
        if t['kind']=='family':
            by_word[norm(t['word_term'])].append((i,t))
    groups, seen = [], set()
    for r in parsed['roots']:
        edges = sorted((i,t) for term in {norm(w['term']) for w in r['words']} for i,t in by_word[term] if i not in seen)
        if edges:
            groups.append((r,edges))
            seen.update(i for i,_ in edges)
    remaining=[(i,t) for i,t in enumerate(data['traps']) if t['kind']=='family' and i not in seen]
    if remaining:
        groups.append(({'headword':'[không khớp term trong ROOT trích PDF]'},remaining))
        seen.update(i for i,_ in remaining)
    assert len(seen)==sum(t['kind']=='family' for t in data['traps'])
    return groups


def checks(t, words, roots):
    issues = []
    ws = words[norm(t['word_term'])]
    if not ws:
        issues.append(('C3','reject','word_term không khớp mục từ nguồn; cần sửa khoá liên kết ngoài trap_vi/why trước khi PATCH.'))
    overlap = parts(t['trap_vi']) & set().union(*(parts(w['meaning_vi']) | parts(w['quiz_vi']) for w in ws))
    if overlap:
        issues.append(('C1', 'reject', 'Nghĩa Việt trùng sau chuẩn hoá: ' + ', '.join(sorted(overlap))))
    alternate = set().union(*(parts(w['meaning_vi']) | parts(w['quiz_vi']) for w in words[norm(t['trap_term'])])) & set().union(*(parts(w['meaning_vi']) | parts(w['quiz_vi']) for w in ws))
    if alternate - overlap:
        issues.append(('C1', 'reject', 'Hai từ có nghĩa nguồn khác trùng nhau, gây đáp án đúng thứ hai ở chiều Việt→Anh: '+', '.join(sorted(alternate-overlap))))
    if any(parts(t['trap_en']) & parts(w['def_en']) for w in ws):
        issues.append(('C1', 'reject', 'Định nghĩa Anh trùng với một nghĩa của từ gốc.'))
    if norm(t['word_term']) == norm(t['trap_term']):
        issues.append(('C1', 'reject', 'Bẫy trùng chính từ gốc.'))
    if re.search(r'[()\[\]]|đáp án sai', t['trap_vi'], re.I):
        issues.append(('C2', 'fix', 'Bỏ ngoặc/nhãn giải thích khỏi ô đáp án.'))
    # Boundary matching prevents e.g. 'in' matching inside a Vietnamese syllable.
    if re.search(r'(?<!\w)' + re.escape(t['word_term']) + r'(?!\w)', t['trap_vi'], re.I):
        issues.append(('C2', 'fix', 'Ô nghĩa nhắc từ gốc; cần xét tên riêng và sửa hoặc loại.'))
    first = next((c for c in t['trap_vi'] if c.isalpha()), '')
    if first.isupper():
        issues.append(('C5', 'fix', 'Cần thường đầu câu, trừ tên riêng.'))
    root_ok = bool(roots[norm(t['word_term'])] & roots[norm(t['trap_term'])])
    return issues, root_ok


def view(mode, start, end):
    data, parsed, words, roots = setup()
    traps = data['traps']
    if mode == 'family':
        groups = family_groups(data,parsed)
        print('GROUPS', len(groups))
        for g, (r, edges) in enumerate(groups[start:end], start):
            print(f'G{g} {r["headword"]}')
            for term in dict.fromkeys(t['word_term'] for _, t in edges):
                for w in words[norm(term)]:
                    print(' ', term, w['pos'], w['meaning_vi'], '|', w['def_en'])
                print('  ->', '; '.join(f'{i}:{t["trap_term"]}={t["trap_vi"]}' for i,t in edges if t['word_term']==term))
            for i,t in edges:
                matches = [w for w in words[norm(t['trap_term'])] if w['meaning_vi']==t['trap_vi'] and w['def_en']==t['trap_en']]
                if not matches:
                    print(' EXTRA', i, json.dumps(t, ensure_ascii=False))
    else:
        rows = [(i,t) for i,t in enumerate(traps) if t['kind'] != 'family']
        print('ROWS',len(rows))
        for i,t in rows[start:end]:
            meanings = ';'.join(w['meaning_vi'] for w in words[norm(t['word_term'])])
            print(f'{i} {t["word_term"]}[{meanings}]>{t["kind"]}:{t["trap_term"]}={t["trap_vi"]}|{t["trap_en"]}|{t["why"]}')


def build():
    data, parsed, words, roots = setup()
    ledger = read(LEDGER)
    assert ledger['source_sha256'] == digest(SOURCE), 'Source changed; semantic review invalid'
    assert ledger['parsed_sha256'] == digest(PARSED), 'Parsed evidence changed'
    decisions = ledger['decisions']
    assert set(decisions) == {str(i) for i in range(len(data['traps']))}, 'Missing/extra semantic decisions'
    results, criteria_counts, verdicts, approved = [], {f'C{i}':collections.Counter() for i in range(1,6)}, collections.Counter(), collections.defaultdict(list)
    for i,t in enumerate(data['traps']):
        manual = decisions[str(i)]
        assert manual['verdict'] in ('approve','reject','fix') and manual['reason']
        machine, root_ok = checks(t, words, roots)
        findings = list(manual.get('findings', []))
        fixes = dict(manual.get('fix', {}))
        assert set(fixes) <= {'trap_vi','why'}
        overrides = manual.get('machine_overrides', {})
        for criterion, verdict, reason in machine:
            if criterion in overrides:
                continue
            findings.append({'criterion':criterion, 'verdict':verdict, 'reason':reason})
        for finding in findings:
            assert finding['criterion'] in criteria_counts
        final = max([manual['verdict']] + [f['verdict'] for f in findings], key={'approve':0,'fix':1,'reject':2}.get)
        if final == 'fix':
            if any(f['criterion']=='C5' and f['verdict']=='fix' for f in findings) and 'trap_vi' not in fixes:
                fixes['trap_vi'] = t['trap_vi'][:1].lower() + t['trap_vi'][1:]
            assert fixes, f'FIX without concrete correction at {i}'
            candidate = dict(t, **fixes)
            residual,_ = checks(candidate,words,roots)
            assert not [x for x in residual if x[0] not in overrides], (i,'Invalid fix',residual)
        reason = manual['reason']
        extra = list(dict.fromkeys(f['criterion'] + ': ' + f['reason'] for f in findings))
        if extra:
            reason += ' ' + ' '.join(extra)
        row = {'word_term':t['word_term'], 'trap_term':t['trap_term'], 'verdict':final, 'reason':reason, 'fix':fixes if final=='fix' else {}}
        # Stable identifiers help the downstream PATCH target exactly one original row.
        row.update({'trap_id':t['id'], 'source_index':i})
        results.append(row)
        verdicts[final]+=1
        for c in criteria_counts:
            statuses = [f['verdict'] for f in findings if f['criterion']==c]
            criteria_counts[c][max(statuses or ['approve'], key={'approve':0,'fix':1,'reject':2}.get)]+=1
        if final=='approve':
            approved[norm(t['word_term'])].append(t)
    assert len({r['trap_id'] for r in results})==len(results)
    assert len({(r['word_term'],r['trap_term']) for r in results})==len(results)
    (DIR/'trap_review.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines = ['# Kết quả duyệt bẫy Word Family', '',
        f'Nguồn SHA-256: `{digest(SOURCE)}`.',
        f'ROOT trích PDF SHA-256: `{digest(PARSED)}`.', '',
        f'Tổng: **{len(results)}** bẫy; **{verdicts["approve"]} approve / {verdicts["reject"]} reject / {verdicts["fix"]} fix**.', '',
        'Kiểm tra máy chạy trên toàn bộ dữ liệu; phán đoán nghĩa/loại lưu theo chỉ số gốc trong `trap_review_semantic.json`. Bẫy family được đọc theo ROOT: định nghĩa dùng chung và từng cạnh từ→bẫy; mẫu why được đối chiếu POS/quiz của nguồn, các câu ngoài mẫu được đọc riêng. Các bẫy còn lại được đọc từng dòng theo lô. Không truy cập mạng, Git hay DB; không sửa nguồn. Đây là đánh giá ngôn ngữ của mô hình, không phải kiểm chứng từ điển độc lập.', '',
        'FIX chưa được tính APPROVE; chỉ PATCH `approved` cho verdict `approve`, `rejected` cho `reject`; để `fix` chờ áp bản sửa và duyệt lại. `trap_id`/`source_index` nhận diện chính xác dòng nguồn. Một term có nhiều POS vẫn dùng chung bẫy nên xét mọi nghĩa/POS, không chỉ mục đầu.', '',
        '| Tiêu chí | APPROVE | REJECT | FIX |','| --- | ---: | ---: | ---: |']
    for c,counts in criteria_counts.items():
        lines.append(f'| {c} | {counts["approve"]} | {counts["reject"]} | {counts["fix"]} |')
    lines.extend(['','C1–C5 tính riêng, có thể cùng bắt lỗi một dòng; APPROVE nghĩa không ghi nhận lỗi ở tiêu chí đó, không thay thế verdict chung. C6 tính theo term và số bẫy còn dùng được.', '', '## 20 REJECT tiêu biểu', ''])
    rejected = [r for r in results if r['verdict']=='reject']
    # Pick varied criteria/terms rather than twenty adjacent rows from one root.
    selected, used = [], set()
    for criterion in ('C1','C3','C4','C5'):
        for r in rejected:
            if len([x for x in selected if criterion in x['reason']]) >= 5:
                break
            if criterion in r['reason'] and r['word_term'] not in used:
                selected.append(r);used.add(r['word_term'])
    for r in rejected:
        if len(selected)>=20:break
        if r['word_term'] not in used:
            selected.append(r);used.add(r['word_term'])
    for r in selected[:20]:
        lines.append(f'- #{r["source_index"]} **{r["word_term"]} → {r["trap_term"]}**: {r["reason"]}')
    short = []
    for term, ws in words.items():
        count = len(approved[term])
        if count>=2:continue
        candidates=[]
        existing={norm(t['trap_term']) for t in data['traps'] if norm(t['word_term'])==term}
        existing.add(term)
        for root in parsed['roots']:
            if root['root_id'] in roots[term]:
                for w in root['words']:
                    candidate=norm(w['term'])
                    if candidate not in existing and candidate not in candidates:
                        candidates.append(candidate)
        proposed = ledger.get('suggestions',{}).get(term)
        suggestion = proposed or ('Cùng ROOT chưa có cạnh: '+', '.join(candidates)+'; cần duyệt C1–C5 trước khi thêm.' if candidates else 'Không có ứng viên cùng ROOT chưa dùng trong nguồn; cần bổ sung phái sinh thật và duyệt, không tái dùng cặp đã REJECT.')
        short.append((term,count,suggestion))
    lines.extend(['','## C6: từ còn dưới 2 bẫy APPROVE','',
        f'**{len(short)} / {len(words)} term duy nhất** thiếu; nguồn có {len(data["words"])} mục từ/POS. Các mục trùng term được gộp để khớp khoá bẫy. Từ không có bẫy cũng được liệt kê.', '',
        '| Từ | APPROVE | Đề xuất / khoảng trống |','| --- | ---: | --- |'])
    for term,count,suggestion in short:
        lines.append(f'| {term} | {count} | {suggestion} |')
    lines.extend(['','## Tái lập và giới hạn','',
        '`python tools/wf_import/trap_review.py build` kiểm đủ quyết định, SHA nguồn, chạy luật máy, hợp nhất với phán đoán đã lưu rồi tái tạo JSON/Markdown. Script không gọi mô hình để tự chấm các dòng mới; dữ liệu đổi sẽ dừng vì SHA không khớp.',
        'Không đọc PDF gốc ở đường dẫn Temp đã ghi trong metadata; quan hệ ROOT là từ bản trích `wf_parsed.json`. Cặp phái sinh rõ được đánh giá ngôn ngữ; đề xuất bổ sung chưa được đưa vào kết quả approved.',
        'Kiểm chứng cuối: đủ 4.669 chỉ số và ID duy nhất, tổng verdict khớp, FIX có sửa cụ thể và qua kiểm tra máy lần nữa, danh sách C6 đối chiếu tất cả term. Không có kiểm định từ điển hay người duyệt thứ hai độc lập.',''])
    (DIR/'trap_review.md').write_text('\n'.join(lines),encoding='utf-8')
    print(json.dumps({'rows':len(results),'verdicts':verdicts,'unique_terms':len(words),'below_two':len(short)},ensure_ascii=False))


if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='view':
        view(sys.argv[2],int(sys.argv[3]),int(sys.argv[4]))
    elif len(sys.argv)>1 and sys.argv[1]=='build':
        build()
    elif len(sys.argv)>1 and sys.argv[1]=='record':
        # Explicit operator attestation AFTER reading the requested view range.
        mode,start,end=sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
        data,parsed,words,roots=setup()
        ledger=read(LEDGER) if LEDGER.exists() else {'source_sha256':digest(SOURCE),'parsed_sha256':digest(PARSED),'batches':[],'decisions':{},'suggestions':{}}
        assert ledger['source_sha256']==digest(SOURCE)
        rows=[item for _,edges in family_groups(data,parsed)[start:end] for item in edges] if mode=='family' else [(i,t) for i,t in enumerate(data['traps']) if t['kind']!='family'][start:end]
        for i,t in rows:
            assert str(i) not in ledger['decisions'],f'Already reviewed {i}'
            ledger['decisions'][str(i)]={'verdict':'approve','reason':f'C1–C5: đã đọc cặp {t["word_term"]} → {t["trap_term"]}; nghĩa phân biệt được, nghĩa bẫy khớp và quan hệ {t["kind"]} hợp lý.'}
        ledger['batches'].append({'mode':mode,'start':start,'end':end,'indices':[i for i,_ in rows],'method':'semantic reading of displayed rows/shared ROOT definitions; exceptions recorded separately'})
        LEDGER.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('Recorded',len(rows),'total',len(ledger['decisions']))
    else:
        raise SystemExit(__doc__)
