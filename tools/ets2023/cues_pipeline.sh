#!/bin/bash
# Chuỗi dựng mốc audio sạch cho đề N: build_cues -> fix_cues_gen -> pad_cues_2 -> check_q_cues --fix. ./cues_pipeline.sh N
N=$1; cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
python build_cues.py audio/t${N}_whisper_w.json lc_${N}.json cues_${N}.json audio/t${N}_whisper.json 2>&1 | tail -1
python fix_cues_gen.py $N 2>&1 | grep -v "^   (" | tail -3
python pad_cues_2.py $N > /dev/null
python check_q_cues.py $N --fix | head -1
[ -f audio/sil_$N.txt ] && python snap_cues.py $N | cut -c1-200
python - <<PY
import json
c=json.load(open('cues_$N.json'));print('thiếu/xấu:',[n for n in range(1,101) if str(n) not in c or c[str(n)]['q'][1] is None or c[str(n)]['q'][1]<=c[str(n)]['q'][0]])
PY
