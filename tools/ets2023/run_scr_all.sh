#!/bin/bash
cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
for N in 1 2 3 4 5 6 7 8 9 10; do python build_scr.py $N > rcp/log_scr_$N.txt 2>&1; echo "scr $N" >> rcp/scr_done.txt; done
