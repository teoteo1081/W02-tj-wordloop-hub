"""Vẽ biểu đồ IELTS Writing Task 1 bằng Pillow (dữ liệu minh hoạ do AI tạo, không phải đề thật)."""
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 960, 600
COL = [(31, 119, 180), (214, 39, 40), (44, 160, 44), (255, 127, 14), (148, 103, 189)]


def font(sz, bold=False):
    for f in (['C:/Windows/Fonts/arialbd.ttf'] if bold else []) + ['C:/Windows/Fonts/arial.ttf']:
        try:
            return ImageFont.truetype(f, sz)
        except Exception:
            pass
    return ImageFont.load_default()


F, FB, FT = font(18), font(20, True), font(24, True)


def base(title, sub=''):
    im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
    d.text((W // 2, 26), title, fill=(30, 30, 30), font=FT, anchor='mm')
    if sub: d.text((W // 2, 56), sub, fill=(90, 90, 90), font=F, anchor='mm')
    return im, d


def legend(d, names, x=None, y=H - 34):
    tw = [d.textlength(n, font=F) + 46 for n in names]; x = (W - sum(tw)) // 2 if x is None else x
    for i, n in enumerate(names):
        d.rectangle([x, y - 8, x + 20, y + 8], fill=COL[i % 5]); d.text((x + 28, y), n, fill=(30, 30, 30), font=F, anchor='lm'); x += tw[i]


def axes(d, ymin, ymax, step, ylabel, L=90, R=W - 40, T=90, B=H - 90):
    d.line([L, T, L, B], fill=(60, 60, 60), width=2); d.line([L, B, R, B], fill=(60, 60, 60), width=2)
    v = ymin
    while v <= ymax + 1e-9:
        y = B - (v - ymin) / (ymax - ymin) * (B - T)
        d.line([L, y, R, y], fill=(225, 225, 225)); d.text((L - 10, y), ('%g' % v), fill=(60, 60, 60), font=F, anchor='rm'); v += step
    d.text((L, T - 22), ylabel, fill=(60, 60, 60), font=F, anchor='lm')
    return L, R, T, B


def line_chart(title, years, series, ymin, ymax, step, ylabel, sub=''):
    im, d = base(title, sub); L, R, T, B = axes(d, ymin, ymax, step, ylabel)
    n = len(years); xs = [L + 30 + i * (R - L - 60) / (n - 1) for i in range(n)]
    for i, x in enumerate(xs): d.text((x, B + 18), str(years[i]), fill=(60, 60, 60), font=F, anchor='mm')
    for k, (name, vals) in enumerate(series):
        pts = [(xs[i], B - (v - ymin) / (ymax - ymin) * (B - T)) for i, v in enumerate(vals)]
        d.line(pts, fill=COL[k % 5], width=4)
        for p in pts: d.ellipse([p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5], fill=COL[k % 5])
    legend(d, [s[0] for s in series]); return im


def bar_chart(title, cats, series, ymin, ymax, step, ylabel, sub='', stacked=False):
    im, d = base(title, sub); L, R, T, B = axes(d, ymin, ymax, step, ylabel)
    n = len(cats); gw = (R - L) / n; ns = 1 if stacked else len(series); bw = gw * 0.7 / ns
    for i, c in enumerate(cats):
        x0 = L + i * gw + gw * 0.15; d.text((L + i * gw + gw / 2, B + 18), str(c), fill=(60, 60, 60), font=F, anchor='mm'); acc = 0
        for k, (name, vals) in enumerate(series):
            v = vals[i]
            if stacked:
                y1 = B - (acc - ymin) / (ymax - ymin) * (B - T); y2 = B - (acc + v - ymin) / (ymax - ymin) * (B - T); d.rectangle([x0, y2, x0 + gw * 0.7, y1], fill=COL[k % 5]); acc += v
            else:
                y2 = B - (v - ymin) / (ymax - ymin) * (B - T); d.rectangle([x0 + k * bw, y2, x0 + (k + 1) * bw - 2, B], fill=COL[k % 5]); d.text((x0 + k * bw + bw / 2, y2 - 10), '%g' % v, fill=(60, 60, 60), font=font(14), anchor='mm')
    legend(d, [s[0] for s in series]); return im


def mixed(title, cats, vals, unit, pie_title, pie):
    im, d = base(title)
    L, R, T, B = 90, 520, 100, H - 90; ymax = math.ceil(max(vals) / 20) * 20
    d.line([L, T, L, B], fill=(60, 60, 60), width=2); d.line([L, B, R, B], fill=(60, 60, 60), width=2)
    for v in range(0, ymax + 1, 20):
        y = B - v / ymax * (B - T); d.line([L, y, R, y], fill=(225, 225, 225)); d.text((L - 10, y), str(v), fill=(60, 60, 60), font=F, anchor='rm')
    d.text((L, T - 22), unit, fill=(60, 60, 60), font=F, anchor='lm'); gw = (R - L) / len(cats)
    for i, (c, v) in enumerate(zip(cats, vals)):
        x0 = L + i * gw + gw * 0.2; y = B - v / ymax * (B - T); d.rectangle([x0, y, x0 + gw * 0.6, B], fill=COL[i % 5]); d.text((x0 + gw * 0.3, y - 12), str(v), fill=(60, 60, 60), font=F, anchor='mm'); d.text((L + i * gw + gw / 2, B + 18), c, fill=(60, 60, 60), font=font(16), anchor='mm')
    cx, cy, r = 740, 300, 120; d.text((cx, 120), pie_title, fill=(30, 30, 30), font=FB, anchor='mm'); a = -90
    for i, (n, p) in enumerate(pie):
        d.pieslice([cx - r, cy - r, cx + r, cy + r], a, a + p * 3.6, fill=COL[i % 5], outline='white'); mid = math.radians(a + p * 1.8)
        d.text((cx + (r + 34) * math.cos(mid), cy + (r + 34) * math.sin(mid)), '%s %d%%' % (n, p), fill=(40, 40, 40), font=font(15), anchor='mm'); a += p * 3.6
    return im


def cycle(title, stages):
    im, d = base(title); cx, cy = W // 2, 330; pos = [(cx, 150), (cx + 280, cy), (cx, 500), (cx - 280, cy)]
    for i, ((name, note), (x, y)) in enumerate(zip(stages, pos)):
        d.rounded_rectangle([x - 130, y - 45, x + 130, y + 45], 18, fill=(235, 244, 252), outline=COL[i], width=4)
        d.text((x, y - 12), name, fill=(30, 30, 30), font=FB, anchor='mm'); d.text((x, y + 18), note, fill=(80, 80, 80), font=F, anchor='mm')
    for i in range(4):
        (x1, y1), (x2, y2) = pos[i], pos[(i + 1) % 4]; sx, sy = x1 + (x2 - x1) * 0.38, y1 + (y2 - y1) * 0.38; ex, ey = x1 + (x2 - x1) * 0.62, y1 + (y2 - y1) * 0.62
        d.line([sx, sy, ex, ey], fill=(70, 70, 70), width=4); ang = math.atan2(ey - sy, ex - sx)
        d.polygon([(ex, ey), (ex - 16 * math.cos(ang - 0.4), ey - 16 * math.sin(ang - 0.4)), (ex - 16 * math.cos(ang + 0.4), ey - 16 * math.sin(ang + 0.4))], fill=(70, 70, 70))
    return im
