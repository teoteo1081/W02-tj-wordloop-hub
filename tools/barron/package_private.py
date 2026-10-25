"""Package all 50 lessons into one private, network-disabled HTML file.

The generic player is safe for public Git. Its book data and the packaged HTML
must stay outside the checkout. No database or third-party service is contacted.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]


def package(data, output):
    data, output = Path(data).resolve(), Path(output).resolve()
    if data.is_relative_to(ROOT) or output.is_relative_to(ROOT):
        raise ValueError("Keep book input and packaged output outside the public checkout")
    validation = """const fs=require('fs'), p=require(process.argv[1]);
const rows=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const lessons=p.validateRows(rows);
console.log(JSON.stringify({lessons:lessons.length,items:rows.length}));"""
    verified = subprocess.run(
        ["node", "-e", validation, str(ROOT / "learn/barron/player.js"), str(data)],
        check=True, text=True, capture_output=True)
    counts = json.loads(verified.stdout)
    if counts != {"lessons": 50, "items": 600}:
        raise ValueError("Incomplete dataset")
    html = (ROOT / "learn/barron/index.html").read_text(encoding="utf-8")
    css = (ROOT / "learn/barron/style.css").read_text(encoding="utf-8")
    js = (ROOT / "learn/barron/player.js").read_text(encoding="utf-8")
    rows = json.loads(data.read_text(encoding="utf-8"))
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    html = html.replace('<link rel="stylesheet" href="style.css?v=1">', '<style>' + css + '</style>')
    html = html.replace('<script src="player.js?v=1"></script>',
                        '<script id="barron-data" type="application/json">' + payload + '</script>\n<script>' + js + '</script>')
    if '<script src=' in html or '<link rel="stylesheet"' in html:
        raise ValueError("Bundle contains unexpected external dependencies")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")
    summary = {**counts, "bytes": output.stat().st_size,
               "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
               "network": "disabled by CSP; no external dependencies"}
    output.with_suffix('.audit.json').write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    print(json.dumps(package(args.data, args.out)))
