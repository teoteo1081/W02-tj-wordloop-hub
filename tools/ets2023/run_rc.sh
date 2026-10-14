#!/bin/bash
N=$1; cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
python gemini_p5.py rcp/t$N $N rcp/keys.json rcp/p5_${N}g.json > rcp/log_p5_$N.txt 2>&1
python gemini_p67.py rcp/t$N $N rcp/keys.json rcp/p67_$N.json > rcp/log_p67_$N.txt 2>&1
python gemini_kinds.py rcp/p67_$N.json rcp/p67_${N}k.json > rcp/log_k_$N.txt 2>&1
echo done > rcp/done_$N.txt
