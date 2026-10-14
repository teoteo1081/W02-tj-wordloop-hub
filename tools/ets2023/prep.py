# Chuẩn bị 1 đề ETS 2023: nén audio, OCR đề, Whisper (2 lượt). py prep.py <N>   (chạy lại được, bỏ qua bước đã xong)
import sys, os, glob, subprocess, re
N = int(sys.argv[1])
W = os.path.dirname(os.path.abspath(__file__))
SRC = r"C:\Users\User\Desktop\TJ\_staging\ETS 2023\TEST %d" % N
FF = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\**\ffmpeg.exe"), recursive=True)[0]
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"


def log(*a):
    print(*a, flush=True)


mp3s = glob.glob(os.path.join(SRC, "*.mp3"))
pdfs = [p for p in glob.glob(os.path.join(SRC, "*.pdf")) if "ranscript" not in p and "transcript" not in p]
log("TEST", N, "mp3:", [os.path.basename(x) for x in mp3s], "pdf:", [os.path.basename(x) for x in pdfs])
out = os.path.join(W, "audio", "TEST_2023_%02d_LC.mp3" % N)
if not os.path.exists(out):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", mp3s[0], "-ac", "1", "-ar", "22050", "-b:a", "56k", out], check=True)
log("audio nén:", round(os.path.getsize(out) / 1048576, 1), "MB")
od = os.path.join(W, "ocr", "t%d" % N)
if not os.path.exists(os.path.join(od, "done.flag")):
    subprocess.run([sys.executable, os.path.join(W, "ocr_pdf.py"), pdfs[0], od, "220"], check=True, stdout=subprocess.DEVNULL)
    open(os.path.join(od, "done.flag"), "w").write("ok")
log("OCR xong")
for tag, extra in (("whisper", False), ("whisper_w", True)):
    j = os.path.join(W, "audio", "t%d_%s.json" % (N, tag))
    if not os.path.exists(j):
        code = open(os.path.join(W, "whisper_t.py"), encoding="utf-8").read()
        if not extra:
            code = code.replace("word_timestamps=True,", "")
        tmp = os.path.join(W, "_whisper_tmp_%d.py" % N)
        open(tmp, "w", encoding="utf-8").write(code)
        subprocess.run([sys.executable, tmp, out, j], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.remove(tmp)
    log(tag, "xong")
log("PREP XONG test", N)
