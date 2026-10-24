"""Extract user-supplied two-column PDF into private Barron game rows.

No network. Output must stay outside the public checkout. Paragraphs are aligned
by indentation in the source, never by guessed sentence boundaries.
"""
import argparse
import json
import pathlib
import re
import pymupdf


def paragraphs(page, left, right):
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = ""
            for span in line["spans"]:
                part = span["text"]
                # The PDF loses spaces at font changes (e.g. individual|characteristics).
                # Keep genuinely attached inflection spans such as fail|s.
                if (text and part and text[-1].isalpha() and part[0].isalpha()
                        and part.strip() not in ("s", "es", "ed", "ing", "ly")):
                    text += " "
                text += part
            text = text.strip()
            x, y, x1, _ = line["bbox"]
            if text and left <= x < right and y < 740:
                lines.append((y, x, text))
    lines.sort()
    merged = []
    for y, x, text in lines:
        if merged and abs(y - merged[-1][0]) < 2:
            merged[-1][2] += " " + text
        else:
            merged.append([y, x, text])
    out = []
    for y, x, text in merged:
        if re.match(r"^[-–•]\s*\w", text):
            break  # vocabulary annotations below the bilingual reading
        # 36pt first-line indent distinguishes source paragraphs from wrapping.
        if not out or x >= left + 25:
            out.append(text)
        else:
            out[-1] += " " + text
    return [re.sub(r"\s+", " ", p).strip() for p in out]


def build(pdf, heads, keys):
    doc = pymupdf.open(pdf)
    rows, report = [], []
    for head in heads:
        n = head["lesson"]
        page_num = 2 * n + 3  # physical PDF page: Lesson 1 bilingual page = 5
        page = doc[page_num - 1]
        en, vi = paragraphs(page, 72, 334), paragraphs(page, 338, 612)
        errors = []
        if not en or len(en) != len(vi):
            errors.append(f"paragraph alignment {len(en)}/{len(vi)}")
        raw = keys.get(str(n), {}).get("wic") or ""
        bank = [s.strip().rstrip(".") for s in re.split(r"\b\d+[.,]\s*", raw)[1:]]
        if len(bank) != 12 or len({s.lower() for s in bank}) != 12:
            errors.append(f"answer bank {len(bank)}/12 or duplicate")
        passage = "\n\n".join(en)
        cursor, matches = 0, []
        for word in bank:
            match = re.search(r"(?<!\w)" + re.escape(word) + r"(?!\w)", passage[cursor:], re.I)
            if not match:
                errors.append(f"answer not found in source order: {word}")
                break
            start, end = cursor + match.start(), cursor + match.end()
            matches.append((start, end))
            cursor = end
        if errors:
            report.append({"lesson": n, "pdf_page": page_num, "errors": errors})
            continue
        cloze = passage
        for i in range(11, -1, -1):
            a, b = matches[i]
            cloze = cloze[:a] + f"-------({i + 1})" + cloze[b:]
        pairs = [{"en": a, "vi": b} for a, b in zip(en, vi)]
        for i, word in enumerate(bank):
            # Four alternatives from the same book word bank; stable order.
            choices = [bank[(i + j) % 12] for j in range(4)]
            shift = i % 4
            choices = choices[shift:] + choices[:shift]
            answer = "ABCD"[choices.index(word)]
            rows.append({
                "id": f"barron600_l{n:02d}_wic_{i + 1:02d}",
                "exam": "barron600", "test": str(n), "part": 8, "num": i + 1,
                "stem": f"({i + 1}) _______", "opts": [f"({c}) {w}" for c, w in zip("ABCD", choices)],
                "answer": answer, "answer_src": "key", "tag": "Words in Context",
                "passage": cloze,
                "i18n": {"vi": {"passage_pairs": pairs}},
            })
        report.append({"lesson": n, "pdf_page": page_num, "pairs": len(pairs), "items": 12, "errors": []})
    return rows, report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    for arg in ("pdf", "heads", "keys", "out"):
        parser.add_argument("--" + arg, required=True)
    args = parser.parse_args()
    out = pathlib.Path(args.out).resolve()
    checkout = pathlib.Path(__file__).resolve().parents[2]
    if out.is_relative_to(checkout):
        parser.error("Book content must be written outside the public checkout")
    rows, report = build(args.pdf, json.loads(pathlib.Path(args.heads).read_text(encoding="utf-8-sig")),
                         json.loads(pathlib.Path(args.keys).read_text(encoding="utf-8-sig")))
    out.mkdir(parents=True, exist_ok=True)
    (out / "bilingual_items.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "bilingual_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"items": len(rows), "lessons": len(rows) // 12,
                      "blocked": [r for r in report if r["errors"]]}, ensure_ascii=False))
