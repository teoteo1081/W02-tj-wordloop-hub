"""Processing adapters. All paths and page maps come from the selected profile.

Normalized JSON sources are supported for reviewed/manual extraction. When those
are absent, OCR/book structuring requires an explicitly enabled AI provider.
"""
from copy import deepcopy
import difflib
import json
from pathlib import Path
import re
import subprocess
from .common import IngestError, digest, file_hash, read_json, require, write_json
from .sources import audio_duration
from . import validate as checks


def _file(path):
    path = Path(path).resolve()
    return {"path": str(path), "sha256": file_hash(path), "bytes": path.stat().st_size}


def _command(args, timeout=600):
    try:
        result = subprocess.run([str(a) for a in args], capture_output=True, text=True,
                                encoding="utf-8", errors="replace", timeout=timeout)
        require(result.returncode == 0, "PROCESS_FAILED", f"Tool failed: {Path(args[0]).name}")
        return result
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise IngestError("PROCESS_FAILED", f"Tool unavailable/timed out: {Path(args[0]).name}") from exc


def keys(ctx):
    primary = checks.answer_keys(ctx.scoped_json("answer_key"))
    reference = checks.answer_keys(ctx.scoped_json("reference_key"))
    require(primary == reference, "KEY_MISMATCH", "Official/reference keys disagree; resolve against source")
    return {"answers": primary, "source_roles": ["answer_key", "reference_key"]}


def audio(ctx):
    tools = ctx.profile.data.get("tools", {})
    source = ctx.source("audio")
    duration = audio_duration(source, tools.get("ffprobe", "ffprobe"))
    path = ctx.directory / ctx.profile.identity(ctx.number).audio_name
    _command([tools.get("ffmpeg", "ffmpeg"), "-nostdin", "-y", "-v", "error", "-i", source,
              "-ac", "1", "-ar", "22050", "-b:a", "56k", path])
    compressed = audio_duration(path, tools.get("ffprobe", "ffprobe"))
    require(abs(duration - compressed) <= max(0.5, duration * 0.001), "AUDIO_TRUNCATED", "Compressed duration changed")
    silence = _command([tools.get("ffmpeg", "ffmpeg"), "-nostdin", "-i", path,
                        "-af", "silencedetect=noise=-33dB:d=0.35", "-f", "null", "-"], timeout=1800)
    spans, start = [], None
    for line in silence.stderr.splitlines():
        match = re.search(r"silence_start: ([\d.]+)", line)
        if match:
            start = float(match[1])
        match = re.search(r"silence_end: ([\d.]+)", line)
        if match and start is not None:
            spans.append([start, float(match[1])])
            start = None
    words = []
    if "whisper" in ctx.spec["sources"]:
        words = ctx.scoped_json("whisper").get("words", [])
    elif tools.get("whisper_model") or "cues" not in ctx.spec["sources"]:
        model_path = tools.get("whisper_model")
        require(bool(model_path) and Path(model_path).is_dir(), "BLOCKED_MODEL", "Local Whisper model directory required; no downloads")
        from faster_whisper import WhisperModel
        model = WhisperModel(str(Path(model_path).resolve()), device="cpu", compute_type="int8",
                             local_files_only=True)
        segments, _ = model.transcribe(str(path), word_timestamps=True, vad_filter=False)
        words = [{"a": w.start, "b": w.end, "t": w.word.strip()} for segment in segments for w in segment.words or []]
    return {"duration": compressed, "silences": spans, "words": words, "files": [_file(path)]}


def ocr(ctx):
    import pymupdf
    tools = ctx.profile.data.get("tools", {})
    pages, files = {}, []
    for role in ("lc_pdf", "rc_pdf"):
        source = ctx.source(role)
        pages[role] = []
        with pymupdf.open(source) as doc:
            for page_number in ctx.spec["sources"][role]["pages"]:
                page = doc[page_number - 1]
                text = page.get_text(sort=True).strip()
                mode = "text"
                if not text:
                    mode = "ocr"
                    image = ctx.directory / f"{role}-p{page_number}.png"
                    page.get_pixmap(dpi=220).save(image)
                    from PIL import Image
                    with Image.open(image) as im:
                        texts = []
                        for side, box in (("L", (0, 0, im.width // 2, im.height)),
                                          ("R", (im.width // 2, 0, im.width, im.height))):
                            cropped = ctx.directory / f"{role}-p{page_number}-{side}.png"
                            im.crop(box).save(cropped)
                            result = _command([tools.get("tesseract", "tesseract"), cropped, "stdout", "--psm", "6"])
                            texts.append(result.stdout.strip())
                            files.append(_file(cropped))
                        text = "\n".join(texts).strip()
                    files.append(_file(image))
                require(bool(text), "EMPTY_OCR", f"No text: {role} page {page_number}")
                pages[role].append({"page": page_number, "mode": mode, "text": text,
                                    "source_sha256": file_hash(source)})
    return {"pages": pages, "files": files}


def structure(ctx):
    if "structured" in ctx.spec["sources"]:
        data = ctx.scoped_json("structured")
    else:
        items, flags = [], []
        source = ctx.outputs["ocr"]["pages"]
        for part, start, end in ((3, 32, 70), (4, 71, 100), (5, 101, 130), (6, 131, 146), (7, 147, 200)):
            role = "lc_pdf" if part <= 4 else "rc_pdf"
            prompt = (f"Digitize only questions {start}..{end}, Part {part}. "
                      "Return {items:[{num,part,stem,opts:[four labelled strings],passage,group:[first,last]}],flags:[]}. "
                      "For Part 6 include every numbered blank (131), etc.; use a generic instruction as stem. "
                      "Reading groups must include complete source passage; preserve layout/newlines. "
                      "Do not provide or change an answer key. Mark unreadable/missing source in flags.\n" +
                      json.dumps(source[role], ensure_ascii=False))
            result = ctx.provider.structured("Transcribe supplied TOEIC OCR only. Never invent missing text. Return JSON only.", prompt)
            items.extend(result.get("items", []))
            flags.extend(result.get("flags", []))
        data = {"items": items, "flags": flags}
    require(not data.get("flags"), "REVIEW_REQUIRED", "Structured source has unresolved flags")
    checks.structured_items(data.get("items"))
    return {"items": data["items"]}


def crop(ctx):
    import pymupdf
    from PIL import Image
    images, files, seen = {}, [], set()
    for spec in ctx.spec.get("graphics", []):
        require(isinstance(spec, dict) and spec.get("role") in {"lc_pdf", "rc_pdf"}, "INVALID_CROP", "Crop source role required")
        role, page, box = spec["role"], spec.get("page"), spec.get("box")
        require(page in ctx.spec["sources"][role].get("pages", []), "INVALID_CROP", "Crop page outside source map")
        require(isinstance(box, list) and len(box) == 4 and all(type(x) in (int, float) for x in box) and
                0 <= box[0] < box[2] <= 1 and 0 <= box[1] < box[3] <= 1,
                "INVALID_CROP", "Crop uses normalized x0,y0,x1,y1 coordinates")
        number = spec.get("num")
        group = spec.get("group")
        require((type(number) is int and 1 <= number <= 6 and group is None) or
                (type(group) is int and group in range(32, 101, 3) and number is None),
                "INVALID_CROP", "Crop must identify a Part 1 question or Listening group")
        name = f"T{ctx.profile.year}-{ctx.number}_" + (f"q{number}" if number else f"g{group}") + ".jpg"
        key = f"q{number}" if number else f"g{group}"
        require(key not in seen, "INVALID_CROP", "Duplicate image binding")
        seen.add(key)
        path = ctx.directory / name
        with pymupdf.open(ctx.source(role)) as doc:
            pix = doc[page - 1].get_pixmap(dpi=220, colorspace=pymupdf.csRGB, alpha=False)
            im = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            im.crop(tuple(round(v * (im.width if i % 2 == 0 else im.height)) for i, v in enumerate(box))).save(path, quality=90)
        info = _file(path)
        images[key] = info
        files.append(info)
    require(all(f"q{n}" in images for n in range(1, 7)), "MISSING_IMAGE", "All six Part 1 images required")
    for item in ctx.outputs["structure"]["items"]:
        if item["num"] <= 100 and "look at the graphic" in item["stem"].lower():
            group = 32 + (item["num"] - 32) // 3 * 3
            require(f"g{group}" in images, "MISSING_IMAGE", f"Missing graphic for group {group}")
    return {"images": images, "files": files}


def _word_number(value):
    value = re.sub(r"[^a-z0-9-]", "", value.lower())
    ones = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
    tens = dict(zip("twenty thirty forty fifty sixty seventy eighty ninety".split(), range(20, 100, 10)))
    if value.isdigit():
        return int(value)
    if value in ones:
        return ones.index(value)
    if value == "hundred":
        return 100
    pieces = value.split("-")
    return tens[pieces[0]] + (ones.index(pieces[1]) if len(pieces) == 2 and pieces[1] in ones else 0) if pieces[0] in tens else None


def cues(ctx):
    duration = ctx.outputs["audio"]["duration"]
    if "cues" in ctx.spec["sources"]:
        source = ctx.scoped_json("cues")
        require(not source.get("flags"), "REVIEW_REQUIRED", "Cue source has unresolved flags")
        data = source["items"]
    else:
        words = ctx.outputs["audio"]["words"]
        annotations, groups, boundaries = {}, {}, {}
        for i, word in enumerate(words[:-1]):
            text = re.sub(r"\W", "", word["t"].lower())
            n = _word_number(words[i + 1]["t"])
            if text in {"number", "no"} and n in range(1, 101):
                annotations.setdefault(n, word["a"])
            if text in {"question", "questions"} and n in range(32, 101, 3):
                groups.setdefault(n, word["a"])
            if text == "part" and n in (2, 3, 4):
                boundaries[n] = word["a"]
        require(set(annotations) == set(range(1, 101)), "REVIEW_REQUIRED", "Whisper announcements incomplete; supply reviewed cues")
        data = {}
        silences = ctx.outputs["audio"]["silences"]
        for n in range(1, 101):
            start = annotations[n]
            end = annotations.get(n + 1, duration)
            if n in (6, 31, 70):
                require((part := {6: 2, 31: 3, 70: 4}[n]) in boundaries, "REVIEW_REQUIRED", "Missing Part boundary")
                end = boundaries[part]
            if n >= 32:
                following = [s[0] for s in silences if s[0] > start and s[1] - s[0] >= 2.3 and s[0] < end]
                require(bool(following), "REVIEW_REQUIRED", f"No reliable silence after question {n}")
                end = min(following)
            data[str(n)] = {"q": [start, end]}
            if n >= 32:
                group = 32 + (n - 32) // 3 * 3
                require(group in groups, "REVIEW_REQUIRED", f"Missing group {group}")
                data[str(n)]["g"] = [groups[group], annotations[group]]
    checks.cues(data, duration)
    return {"items": data, "duration": duration}


def build(ctx):
    from . import __version__
    from .runner import package_hash
    target = ctx.profile.data.get("target", {})
    image_base = target.get("image_base", "")
    require(image_base.startswith("https://") and image_base.endswith("/"), "INVALID_TARGET", "Explicit HTTPS image_base ending in / required")
    data = {item["num"]: item for item in ctx.outputs["structure"]["items"]}
    answers = ctx.outputs["keys"]["answers"]
    images = ctx.outputs["crop"]["images"]
    all_cues = ctx.outputs["cues"]["items"]
    items = []
    for num in range(1, 201):
        part = checks.part_of(num)
        ident = ctx.profile.identity(ctx.number, part, num)
        row = {"id": ident.question_id, "exam": "toeic", "test": ident.test, "part": part, "num": num,
               "answer": answers[str(num)], "answer_src": "key", "tag": None,
               "src": f"ETS{ctx.profile.year}_T{ctx.number}_{'LC' if part <= 4 else 'RC'}.pdf"}
        original = data.get(num)
        if part <= 2:
            row.update(stem="Look at the picture. Choose the best statement." if part == 1 else "Listen and choose the best response.",
                       opts=[f"({a})" for a in ("ABC" if part == 2 else "ABCD")])
        else:
            row.update(stem=original["stem"], opts=[f"({letter}) " + re.sub(r"^\([A-D]\)\s*", "", text)
                                                 for letter, text in zip("ABCD", original["opts"])])
        passages = []
        if part <= 4:
            image_key = f"q{num}" if part == 1 else f"g{32 + (num - 32) // 3 * 3}"
            if image_key in images:
                passages.append("[img] " + image_base + Path(images[image_key]["path"]).name)
            cue = all_cues[str(num)]
            marker = "[aud] q=%.2f-%.2f" % tuple(cue["q"])
            if "g" in cue:
                marker += " g=%.2f-%.2f" % tuple(cue["g"])
            passages.append(marker)
        else:
            passages.append(original.get("passage", ""))
        row["passage"] = "\n".join(passages)
        items.append(row)
    checks.rows(items, ctx.profile, ctx.number, answers)
    media = [{**f, "kind": "image", "object": "listening/img/" + Path(f["path"]).name}
             for f in ctx.outputs["crop"]["files"]]
    media += [{**f, "kind": "audio", "object": "listening/" + Path(f["path"]).name}
              for f in ctx.outputs["audio"]["files"]]
    return {"year": ctx.profile.year, "test_number": ctx.number, "items": items, "media": media,
            "pipeline_version": __version__, "code_hash": package_hash(),
            "files": media, "answers": answers, "duration": ctx.outputs["audio"]["duration"],
            "cues": all_cues, "provenance": ctx.manifest, "profile_hash": ctx.profile.fingerprint}


def _book_records(ctx):
    import pymupdf
    texts = []
    for role in ("lc_book", "rc_book"):
        require(role in ctx.spec["sources"], "BLOCKED_ENRICHMENT", "Provide enrichment JSON or both mapped explanation books")
        with pymupdf.open(ctx.source(role)) as doc:
            for n in ctx.spec["sources"][role]["pages"]:
                page = doc[n - 1]
                tables = [table.extract() for table in page.find_tables().tables]
                text = page.get_text(sort=True).strip()
                require(bool(text or tables), "BLOCKED_ENRICHMENT", "Explanation book needs reviewed OCR; text extraction is empty")
                texts.append({"role": role, "page": n, "text": text, "tables": tables})
    records = []
    for first, last in ((1, 31), (32, 70), (71, 100), (101, 130), (131, 146), (147, 200)):
        data = ctx.provider.structured("Transcribe explanation book only, including original text and supplied Vietnamese. Never invent an explanation/translation.",
                  f"Return {{items:[{{num,answer,explain,stem_vi,vocab:[{{t,vi}}],scr:{{lines:[{{sp,t,vi,a,b}}],ev:{{}}}}}}],flags:[]}} for {first}..{last}. "
                  "Copy book wording; leave a,b null if not explicitly in source. Mark missing content in flags.\n" + json.dumps(texts, ensure_ascii=False))
        require(not data.get("flags"), "REVIEW_REQUIRED", "Explanation extraction has flags")
        records.extend(data.get("items", []))
    return records


def _align_lines(lines, words, span):
    tokens = [(w["a"], w["b"], re.sub(r"\W", "", w["t"].lower()))
              for w in words if span[0] <= w["a"] < w["b"] <= span[1]]
    require(bool(tokens), "REVIEW_REQUIRED", "No Whisper words in transcript span")
    cursor = 0
    for line in lines:
        expected = re.findall(r"\w+", line.get("t", "").lower())
        matcher = difflib.SequenceMatcher(None, expected, [w[2] for w in tokens[cursor:]], autojunk=False)
        pairs = [(a + j, b + j + cursor) for a, b, size in matcher.get_matching_blocks() for j in range(size)]
        require(expected and len(pairs) / len(expected) >= 0.85, "REVIEW_REQUIRED", "Transcript alignment coverage below 85%")
        lo, hi = pairs[0][1], pairs[-1][1]
        line["a"], line["b"] = tokens[lo][0], tokens[hi][1]
        cursor = hi + 1


def enrich(ctx):
    bundle = deepcopy(ctx.outputs["build"])
    if "enrichment" in ctx.spec["sources"]:
        normalized = ctx.scoped_json("enrichment")
        require(not normalized.get("flags"), "REVIEW_REQUIRED", "Enrichment source has unresolved flags")
        records = normalized.get("items", [])
    else:
        records = _book_records(ctx)
    require(sorted(r.get("num", 0) for r in records) == list(range(1, 201)), "BLOCKED_ENRICHMENT", "Require enrichment for all 200 questions")
    transcripts = {}
    if "transcript" in ctx.spec["sources"]:
        normalized = ctx.scoped_json("transcript")
        require(not normalized.get("flags"), "REVIEW_REQUIRED", "Transcript source has unresolved flags")
        data = normalized.get("items", [])
        require(len({r.get("num") for r in data}) == len(data), "INVALID_TRANSCRIPT", "Duplicate transcript question")
        transcripts = {r["num"]: r["scr"] for r in data}
    by_num = {r["num"]: r for r in records}
    for row in bundle["items"]:
        n = row["num"]
        rec = by_num[n]
        require(rec.get("answer") == row["answer"], "KEY_MISMATCH", f"Explanation source key disagrees at {n}")
        require(isinstance(rec.get("explain"), str) and rec["explain"].strip(), "BLOCKED_ENRICHMENT", f"Missing explanation: {n}")
        vocab = rec.get("vocab", [])
        require(isinstance(vocab, list) and all(isinstance(v, dict) and v.get("t") and v.get("vi") for v in vocab),
                "INVALID_VOCAB", f"Invalid vocab: {n}")
        row.update(explain=rec["explain"], stem_vi=rec.get("stem_vi"), vocab=vocab,
                   i18n={"vi": {"explain": rec["explain"]}})
        if n <= 100:
            scr = deepcopy(transcripts.get(n, rec.get("scr")))
            require(isinstance(scr, dict) and isinstance(scr.get("lines"), list) and scr["lines"],
                    "BLOCKED_TRANSCRIPT", f"Missing transcript: {n}")
            cue = ctx.outputs["cues"]["items"][str(n)]
            span = cue["q"] if n <= 31 else [cue["g"][0], cue["q"][1]]
            if any(line.get("a") is None or line.get("b") is None for line in scr["lines"]):
                _align_lines(scr["lines"], ctx.outputs["audio"]["words"], span)
            previous = -1
            for line in scr["lines"]:
                checks.interval([line.get("a"), line.get("b")], bundle["duration"], f"transcript {n}")
                require(span[0] <= line["a"] and line["b"] <= span[1] and line["a"] >= previous,
                        "INVALID_TRANSCRIPT", f"Transcript outside group/sequence: {n}")
                require(isinstance(line.get("t"), str) and line["t"].strip() and
                        isinstance(line.get("vi"), str) and line["vi"].strip(),
                        "INVALID_TRANSCRIPT", f"Missing original/translation: {n}")
                previous = line["b"]
            require(isinstance(scr.get("ev", {}), dict), "INVALID_TRANSCRIPT", "ev must map question numbers to source excerpts")
            row["i18n"]["scr"] = scr
    checks.rows(bundle["items"], ctx.profile, ctx.number, bundle["answers"])
    checks.enrichment_rows(bundle["items"], bundle["cues"], bundle["duration"])
    return bundle


def review(ctx):
    bundle = deepcopy(ctx.outputs["enrich"])
    bundle["review"] = {"status": "PENDING_HUMAN_REVIEW", "approved": False,
                        "reviewer": None, "required_checks": ["Part 1 images", "graphics", "audio boundaries",
                                                              "official keys", "transcript and explanation samples"]}
    bundle["content_hash"] = digest({k: v for k, v in bundle.items() if k not in {"review", "content_hash"}})
    return bundle
