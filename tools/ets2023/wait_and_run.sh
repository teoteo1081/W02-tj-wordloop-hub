#!/bin/bash
# Chờ qua 00:02 giờ Thái Bình Dương (Gemini free reset) rồi dựng Reading Test 9, 10.
cd /c/Users/User/Desktop/TJ/_work/ets2023; export PYTHONUTF8=1
until [ "$(date +%H)" = "00" ] && [ "$(date +%M)" -ge 2 ]; do sleep 45; done
rm -f rcp/done_9.txt rcp/done_10.txt
for N in 9 10; do ./run_rc.sh $N; echo "after-reset rc $N $(date)" >> rcp/net_prep.done; done
