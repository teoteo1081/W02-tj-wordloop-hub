"""One codec for database test labels and question IDs; legacy 2024 is explicit."""
from dataclasses import dataclass
import re
from .common import require

PART_RANGES = ((1, 6), (7, 31), (32, 70), (71, 100), (101, 130), (131, 146), (147, 200))


@dataclass(frozen=True)
class Identity:
    year: int
    test_number: int
    part: int | None = None
    num: int | None = None
    legacy: bool = False

    def __post_init__(self):
        require(type(self.year) is int and 2000 <= self.year <= 2099,
                "INVALID_ID", "Year must be an integer in 2000..2099")
        require(type(self.test_number) is int and self.test_number > 0,
                "INVALID_ID", "Test number must be a positive integer")
        require(not self.legacy or self.year == 2024, "INVALID_ID", "Legacy IDs belong to 2024")
        require(self.year != 2024 or self.legacy, "INVALID_ID", "2024 uses only the legacy codec")
        if self.part is not None:
            require(type(self.part) is int and 1 <= self.part <= 7,
                    "INVALID_ID", "Part must be 1..7")
        if self.num is not None:
            require(type(self.num) is int and 1 <= self.num <= 200,
                    "INVALID_ID", "Question must be 1..200")
        if self.part is not None and self.num is not None:
            lo, hi = PART_RANGES[self.part - 1]
            require(lo <= self.num <= hi, "INVALID_ID", "Question number does not belong to this Part")

    @property
    def test(self):
        return str(self.test_number) if self.legacy else f"{self.year}-{self.test_number}"

    @property
    def question_id(self):
        require(self.part is not None and self.num is not None, "INVALID_ID", "Part/num required")
        prefix = "ets" if self.legacy else f"ets{self.year % 100:02d}"
        return f"{prefix}_t{self.test_number}_p{self.part}_{self.num}"

    @property
    def audio_name(self):
        return f"TEST_{self.test}_LC.mp3"


def parse_test(value):
    value = str(value)
    if re.fullmatch(r"[1-9]\d*", value):
        return Identity(2024, int(value), legacy=True)
    match = re.fullmatch(r"(20\d{2})-([1-9]\d*)", value)
    require(match is not None, "INVALID_ID", "Invalid test label")
    return Identity(int(match[1]), int(match[2]))


def parse_id(value):
    match = re.fullmatch(r"ets(?:(\d{2}))?_t([1-9]\d*)_p([1-7])_([1-9]\d*)", str(value))
    require(match is not None, "INVALID_ID", "Invalid question ID")
    return Identity(2000 + int(match[1]) if match[1] else 2024,
                    int(match[2]), int(match[3]), int(match[4]), match[1] is None)
