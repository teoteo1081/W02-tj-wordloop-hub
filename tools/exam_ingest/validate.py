"""Pure validators for answer keys, questions, source scope and timings."""
import math
import re
from .common import require
from .config import PARTS
from .ids import parse_id


def part_of(num):
    require(type(num) is int, "INVALID_QUESTION", "Question number must be an integer")
    for p, (lo, hi) in PARTS.items():
        if lo <= num <= hi:
            return int(p)
    require(False, "INVALID_QUESTION", "Question number is outside 1..200")


def check_scope(data, profile, number):
    require(isinstance(data, dict) and data.get("year") == profile.year and
            data.get("test_number") == number, "SOURCE_IDENTITY", "Artifact year/Test mismatch")
    return data


def answer_keys(data):
    require(not data.get("flags"), "REVIEW_REQUIRED", "Answer key has unresolved source flags")
    result = {}
    for role, start in (("LC", 1), ("RC", 101)):
        values = data.get(role)
        if isinstance(values, str):
            values = values.split()
        require(isinstance(values, list) and len(values) == 100,
                "INVALID_KEYS", f"{role} requires exactly 100 letters")
        for i, answer in enumerate(values, start):
            choices = "ABC" if part_of(i) == 2 else "ABCD"
            require(isinstance(answer, str) and len(answer) == 1 and answer in choices,
                    "INVALID_KEYS", f"Invalid official key for question {i}")
            result[str(i)] = answer
    return result


def interval(value, duration, label):
    require(isinstance(value, list) and len(value) == 2 and
            all(type(x) in (float, int) and math.isfinite(x) for x in value) and
            0 <= value[0] < value[1] <= duration,
            "INVALID_CUE", f"Invalid/out-of-duration interval: {label}")


def cues(data, duration):
    require(type(duration) in (int, float) and math.isfinite(duration) and duration > 0,
            "INVALID_AUDIO", "Audio duration required")
    require(isinstance(data, dict) and set(data) == {str(n) for n in range(1, 101)},
            "MISSING_CUES", "Require cues for every Listening question")
    last = -1
    last_end = -1
    groups = {}
    for num in range(1, 101):
        cue = data[str(num)]
        interval(cue.get("q"), duration, str(num))
        require(cue["q"][0] > last, "INVALID_CUE", "Question cues must increase")
        require(cue["q"][0] >= last_end, "INVALID_CUE", "Question intervals must not overlap")
        last = cue["q"][0]
        last_end = cue["q"][1]
        if num >= 32:
            interval(cue.get("g"), duration, f"group {num}")
            group = 32 + (num - 32) // 3 * 3
            require(group not in groups or groups[group] == cue["g"],
                    "INVALID_CUE", "Questions in the same group must share conversation timing")
            require(cue["g"][1] <= cue["q"][0], "INVALID_CUE", "Conversation must precede question")
            groups[group] = cue["g"]


def structured_items(items):
    require(isinstance(items, list), "INVALID_ITEMS", "items must be an array")
    nums = [item.get("num") for item in items]
    require(all(type(n) is int for n in nums) and sorted(nums) == list(range(32, 201)),
            "INVALID_ITEMS", "Structured input must contain exactly questions 32..200")
    for item in items:
        num = item["num"]
        require(item.get("part") == part_of(num), "INVALID_ITEMS", f"Wrong Part: {num}")
        require(isinstance(item.get("stem"), str) and item["stem"].strip(), "INVALID_ITEMS", f"Missing stem: {num}")
        opts = item.get("opts")
        require(isinstance(opts, list) and len(opts) == 4 and all(isinstance(o, str) and o.strip() for o in opts),
                "INVALID_ITEMS", f"Missing options: {num}")
        require(len(set(opts)) == 4, "INVALID_ITEMS", f"Duplicate options: {num}")
        if num >= 131:
            require(isinstance(item.get("passage"), str) and item["passage"].strip(),
                    "INVALID_ITEMS", f"Missing Reading passage: {num}")
            group = item.get("group")
            require(isinstance(group, list) and len(group) == 2 and
                    all(type(n) is int for n in group) and group[0] <= num <= group[1] and
                    (group[1] - group[0] == 3 if num <= 146 else 0 <= group[1] - group[0] <= 4) and
                    part_of(group[0]) == part_of(group[1]) == part_of(num),
                    "INVALID_ITEMS", f"Invalid passage group: {num}")
            if num <= 146:
                require(f"({num})" in item["passage"], "INVALID_ITEMS", f"Missing Part 6 blank: {num}")
    by_num = {i["num"]: i for i in items}
    for item in items:
        if item["num"] >= 131:
            for n in range(item["group"][0], item["group"][1] + 1):
                other = by_num.get(n, {})
                require(other.get("group") == item["group"] and other.get("passage") == item["passage"],
                        "INVALID_ITEMS", "Inconsistent Reading group/passage")


def rows(items, profile, number, keys):
    require(isinstance(items, list) and all(type(i.get("num")) is int for i in items) and
            sorted(i.get("num", 0) for i in items) == list(range(1, 201)),
            "INVALID_ROWS", "Require all 200 distinct question numbers, including Test 9")
    seen = set()
    for item in items:
        n = item["num"]
        identity = profile.identity(number, part_of(n), n)
        require(item.get("id") == identity.question_id and item.get("test") == identity.test and
                item.get("exam") == "toeic" and item.get("part") == identity.part,
                "INVALID_ROWS", f"Wrong identity: {n}")
        require(parse_id(item["id"]) == identity and item["id"] not in seen,
                "INVALID_ROWS", "Duplicate or noncanonical ID")
        seen.add(item["id"])
        require(item.get("answer") == keys[str(n)] and item.get("answer_src") == "key",
                "INVALID_ROWS", f"Official answer mismatch: {n}")
        opts = item.get("opts")
        require(isinstance(opts, list) and len(opts) == (3 if identity.part == 2 else 4),
                "INVALID_ROWS", f"Wrong option count: {n}")
        require(all(isinstance(o, str) and o.strip() for o in opts), "INVALID_ROWS", f"Empty option: {n}")
        require(isinstance(item.get("stem"), str) and item["stem"].strip() and bool(item.get("src")),
                "INVALID_ROWS", f"Missing stem/provenance: {n}")
        require(item["answer"] in "ABC" if identity.part == 2 else item["answer"] in "ABCD",
                "INVALID_ROWS", f"Answer outside options: {n}")
        if identity.part <= 4:
            require(bool(re.search(r"\[aud\] q=\d", item.get("passage", ""))),
                    "INVALID_ROWS", f"Missing audio marker: {n}")
            if identity.part == 1 or "look at the graphic" in item["stem"].lower():
                require("[img] " in item.get("passage", ""), "MISSING_IMAGE", f"Missing question image: {n}")


I18N_REQUIRED = ("vi", "en", "zh", "es")


def i18n_missing(items):
    """Languages (of vi/en/zh/es) still lacking an explanation, or vocab glosses for zh/es, on any row."""
    missing = set()
    for row in items:
        data = row.get("i18n") or {}
        for lang in I18N_REQUIRED:
            block = data.get(lang)
            if not (isinstance(block, dict) and isinstance(block.get("explain"), str) and block["explain"].strip()):
                missing.add(lang)
            elif lang in ("zh", "es") and not all(isinstance(v, dict) and v.get(lang) for v in row.get("vocab", [])):
                missing.add(lang)
    return [lang for lang in I18N_REQUIRED if lang in missing]


def enrichment_rows(items, cue_map, duration):
    for row in items:
        n = row["num"]
        require(isinstance(row.get("explain"), str) and row["explain"].strip(), "BLOCKED_ENRICHMENT", f"Missing explanation: {n}")
        require(row.get("i18n", {}).get("vi", {}).get("explain") == row["explain"],
                "BLOCKED_ENRICHMENT", f"Vietnamese explanation mismatch: {n}")
        require(isinstance(row.get("vocab"), list) and all(isinstance(v, dict) and v.get("t") and v.get("vi") for v in row["vocab"]),
                "INVALID_VOCAB", f"Invalid vocab: {n}")
        for lang, block in row["i18n"].items():
            if lang != "scr":
                require(isinstance(block, dict) and all(isinstance(x, str) for x in block.values()),
                        "INVALID_I18N", f"i18n.{lang} must map fields to strings: {n}")
        if n > 100:
            continue
        scr = row.get("i18n", {}).get("scr", {})
        require(isinstance(scr.get("lines"), list) and bool(scr["lines"]), "BLOCKED_TRANSCRIPT", f"Missing transcript: {n}")
        cue = cue_map[str(n)]
        span = cue["q"] if n <= 31 else [cue["g"][0], cue["q"][1]]
        previous = span[0]
        for line in scr["lines"]:
            interval([line.get("a"), line.get("b")], duration, f"transcript {n}")
            require(previous <= line["a"] < line["b"] <= span[1], "INVALID_TRANSCRIPT", "Transcript outside cue span/order")
            require(all(isinstance(line.get(k), str) and line[k].strip() for k in ("t", "vi")),
                    "INVALID_TRANSCRIPT", "Transcript original/translation missing")
            previous = line["b"]
        require(isinstance(scr.get("ev", {}), dict), "INVALID_TRANSCRIPT", "Evidence must be an object")
