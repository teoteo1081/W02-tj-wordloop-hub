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
    # First horizontal cell boundary closes the reading, before vocabulary notes.
    boundaries = [d["rect"].y0 for d in page.get_drawings()
                  if d["rect"].width > 250 and d["rect"].height < 2
                  and 60 < d["rect"].y0 < 740]
    bottom = min(boundaries, default=740)
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
                    # Preserve source word inflections split at a font change.
                    text += " "
                text += part
            text = text.strip()
            x, y, x1, _ = line["bbox"]
            if text and left <= x < right and y < bottom:
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


def build(pdf, heads, keys, edits=None):
    edits = edits or {}
    if sorted(h["lesson"] for h in heads) != list(range(1, 51)):
        raise ValueError("Exactly one header for each Lesson 1–50 is required")
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
        key = keys.get(str(n), {})
        if not key.get("key_visually_checked") or not 333 <= key.get("key_pdf_page", 0) <= 336:
            errors.append("official answer key needs visual verification and PDF page")
        raw = key.get("wic") or ""
        variants = key.get("words") or [s.strip().rstrip(".") for s in re.split(r"\b\d+[.,]\s*", raw)[1:]]
        applied = []
        for edit in edits.get(str(n), []):
            field = edit.get("language", "en")
            column = en if field == "en" else vi
            before, after = edit["before"], edit["after"]
            count = sum(p.count(before) for p in column)
            if count != edit.get("count", 1):
                errors.append("editorial correction count mismatch")
                continue
            column[:] = [p.replace(before, after) for p in column]
            applied.append({"language": field, "before": before, "after": after,
                            "reason": edit.get("reason", "source typo; checked against official key")})
        # Occurrence overrides refer to visually verified underlining in the supplied PDF.
        # A repeated ordinary word earlier in the passage must not become the cloze target.
        passage = "\n\n".join(en)
        bank, matches, cursor = [], [], 0
        occurrences = key.get("target_occurrences", {})
        for index, candidates in enumerate(variants, 1):
            options = []
            for candidate in candidates.split("/"):
                candidate = candidate.strip()
                found = list(re.finditer(r"(?<!\w)" + re.escape(candidate) + r"(?!\w)", passage, re.I))
                if str(index) in occurrences:
                    occurrence = occurrences[str(index)]
                    found = found[occurrence:occurrence + 1] if isinstance(occurrence, int) and occurrence >= 0 else []
                options.extend(m for m in found if m.start() >= cursor)
            if not options:
                errors.append(f"answer not found in source order at position {index}")
                break
            match = min(options, key=lambda m: m.start())
            bank.append(match.group())
            matches.append((match.start(), match.end()))
            cursor = match.end()
        if len(bank) != 12 or len({word.lower() for word in bank}) != 12:
            errors.append("answer bank must contain 12 distinct answers")
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
                "lesson_title": head.get("title", ""),
                "source": {"translation_pdf_page": page_num, "key_pdf_page": key["key_pdf_page"],
                           "key_visually_checked": True, "editorial_corrections": applied, "target_occurrences": occurrences},
                "exam": "barron600", "test": str(n), "part": 8, "num": i + 1,
                "stem": f"({i + 1}) _______", "opts": [f"({c}) {w}" for c, w in zip("ABCD", choices)],
                "answer": answer, "answer_src": "key", "tag": "Words in Context",
                "passage": cloze,
                "i18n": {"vi": {"passage_pairs": pairs}},
            })
        reconstructed = re.sub(r"-------\((\d+)\)", lambda m: bank[int(m[1]) - 1], cloze)
        if reconstructed != passage:
            raise ValueError(f"Lesson {n}: reconstruction mismatch")
        report.append({"lesson": n, "pdf_page": page_num, "pairs": len(pairs), "items": 12,
                       "key_pdf_page": key["key_pdf_page"], "editorial_corrections": len(applied),
                       "target_occurrences": occurrences, "errors": []})
    return rows, report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    for arg in ("pdf", "heads", "keys", "out"):
        parser.add_argument("--" + arg, required=True)
    parser.add_argument("--edits", help="Private JSON of explicitly reviewed source corrections")
    args = parser.parse_args()
    out = pathlib.Path(args.out).resolve()
    checkout = pathlib.Path(__file__).resolve().parents[2]
    if out.is_relative_to(checkout):
        parser.error("Book content must be written outside the public checkout")
    rows, report = build(args.pdf, json.loads(pathlib.Path(args.heads).read_text(encoding="utf-8-sig")),
                         json.loads(pathlib.Path(args.keys).read_text(encoding="utf-8-sig")),
                         json.loads(pathlib.Path(args.edits).read_text(encoding="utf-8-sig")) if args.edits else None)
    out.mkdir(parents=True, exist_ok=True)
    summary = {"items": len(rows), "lessons": len(rows) // 12,
               "blocked": [r for r in report if r["errors"]]}
    print(json.dumps(summary, ensure_ascii=False))
    if len(rows) != 600 or summary["blocked"]:
        (out / "bilingual_incomplete_report.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
        raise SystemExit("INCOMPLETE: previous complete output preserved; do not import this run")
    for name, data in [("bilingual_items.json", rows), ("bilingual_report.json", report)]:
        temporary = out / (name + ".tmp")
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        temporary.replace(out / name)
