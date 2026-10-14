#!/bin/bash
cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
for N in "$@"; do
  python prep_rc.py $N > rcp/log_prep_$N.txt 2>&1
  ./run_rc.sh $N
  [ -f lc34_$N.json ] || python gemini_lc34.py $N > rcp/log_lc34_$N.txt 2>&1
  echo "net done $N" >> rcp/net_prep.done
done
