#!/bin/bash
cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
for N in "$@"; do ./run_rc.sh $N; echo "rc rerun $N" >> rcp/net_prep.done; done
