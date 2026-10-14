#!/bin/bash
# Nền: nén audio (nếu chưa) + Whisper 2 lượt cho các đề. ./listen_prep.sh 8 9 10
cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
FF=$(ls /c/Users/User/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg*/bin/ffmpeg.exe | head -1)
for N in "$@"; do
  NN=$(printf %02d $N); OUT=audio/TEST_2023_${NN}_LC.mp3
  SRC=$(ls "/c/Users/User/Desktop/TJ/_staging/ETS 2023/TEST $N/"*.mp3 | head -1)
  [ -f $OUT ] || "$FF" -loglevel error -y -i "$SRC" -ac 1 -b:a 56k "$OUT"
  [ -f audio/t${N}_whisper_w.json ] || python whisper_t.py $OUT audio/t${N}_whisper_w.json > audio/t${N}_whisper_w.log 2>&1
  [ -f audio/t${N}_whisper.json ] || python whisper_nw.py $OUT audio/t${N}_whisper.json > audio/t${N}_whisper.log 2>&1
  echo "done $N" >> audio/listen_prep.done
done
