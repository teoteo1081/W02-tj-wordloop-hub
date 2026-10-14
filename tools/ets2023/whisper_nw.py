# Whisper local: py whisper_t.py <mp3> <out.json> [model]  -> các đoạn lời thoại có mốc giây (để canh mốc từng câu Listening)
import sys, json
from faster_whisper import WhisperModel
mp3, out = sys.argv[1], sys.argv[2]
model = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else "small.en", device="cpu", compute_type="int8")
import subprocess, glob, os, numpy as np
FF = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\**\ffmpeg.exe"), recursive=True)[0]
raw = subprocess.run([FF, "-loglevel", "error", "-i", mp3, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
audio = np.frombuffer(raw, dtype=np.float32)
segs, info = model.transcribe(audio, language="en", vad_filter=True, beam_size=1, word_timestamps=False, condition_on_previous_text=False)
res = []
for s in segs:
    res.append({"s": round(s.start, 2), "e": round(s.end, 2), "t": s.text.strip(), "w": []})
    if len(res) % 50 == 0:
        print(len(res), s.end, flush=True)
json.dump({"dur": info.duration, "segs": res}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print("done", len(res), info.duration)

