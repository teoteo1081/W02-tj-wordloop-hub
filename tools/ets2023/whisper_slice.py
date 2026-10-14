# Chạy lại Whisper cho 1 đoạn (không VAD) và ghép vào t{N}_whisper(.json|_w.json). py whisper_slice.py N t0 t1
import sys, json, subprocess, glob, os, numpy as np
from faster_whisper import WhisperModel
N, t0, t1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
FF = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\**\ffmpeg.exe"), recursive=True)[0]
mp3 = 'audio/TEST_2023_%02d_LC.mp3' % int(N)
raw = subprocess.run([FF, '-loglevel', 'error', '-ss', str(t0), '-t', str(t1 - t0), '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
audio = np.frombuffer(raw, dtype=np.float32)
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe(audio, language='en', vad_filter=False, beam_size=5, word_timestamps=True, condition_on_previous_text=False)
new = [{'s': round(s.start + t0, 2), 'e': round(s.end + t0, 2), 't': s.text.strip(), 'w': [[round(w.start + t0, 2), round(w.end + t0, 2), w.word.strip()] for w in (s.words or [])]} for s in segs]
for fn in ('audio/t%s_whisper.json' % N, 'audio/t%s_whisper_w.json' % N):
    d = json.load(open(fn, encoding='utf-8'))
    d['segs'] = [s for s in d['segs'] if not (t0 + 1 <= s['s'] <= t1 - 1)] + new
    d['segs'].sort(key=lambda s: s['s']); json.dump(d, open(fn, 'w', encoding='utf-8'), ensure_ascii=False)
print('đã ghép', len(new), 'đoạn'); [print(round(s['s'], 1), s['t'][:100]) for s in new]
