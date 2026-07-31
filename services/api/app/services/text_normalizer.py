import re
from dataclasses import dataclass

_DIGITS = "영일이삼사오육칠팔구"
_SMALL_UNITS = ("", "십", "백", "천")
_LARGE_UNITS = ("", "만", "억", "조")
_LETTER_NAMES = {
    "A": "에이", "B": "비", "C": "씨", "D": "디", "E": "이", "F": "에프",
    "G": "지", "H": "에이치", "I": "아이", "J": "제이", "K": "케이", "L": "엘",
    "M": "엠", "N": "엔", "O": "오", "P": "피", "Q": "큐", "R": "알",
    "S": "에스", "T": "티", "U": "유", "V": "브이", "W": "더블유",
    "X": "엑스", "Y": "와이", "Z": "지",
}
_UNIT_NAMES = {
    "km": "킬로미터", "kg": "킬로그램", "cm": "센티미터", "mm": "밀리미터",
    "mb": "메가바이트", "gb": "기가바이트", "ml": "밀리리터", "hz": "헤르츠",
}


@dataclass(frozen=True)
class NormalizationResult:
    original: str
    normalized: str
    changes: list[str]


def _read_group(value: int) -> str:
    if value == 0:
        return ""
    output: list[str] = []
    digits = f"{value:04d}"
    for index, character in enumerate(digits):
        digit = int(character)
        if digit == 0:
            continue
        unit_index = 3 - index
        prefix = "" if digit == 1 and unit_index > 0 else _DIGITS[digit]
        output.append(f"{prefix}{_SMALL_UNITS[unit_index]}")
    return "".join(output)


def integer_to_korean(value: int) -> str:
    if value == 0:
        return _DIGITS[0]
    if value < 0:
        return f"마이너스 {integer_to_korean(abs(value))}"

    groups: list[str] = []
    group_index = 0
    remaining = value
    while remaining > 0:
        part = remaining % 10000
        if part:
            groups.append(f"{_read_group(part)}{_LARGE_UNITS[group_index]}")
        remaining //= 10000
        group_index += 1
        if group_index >= len(_LARGE_UNITS) and remaining:
            return " ".join(_DIGITS[int(digit)] for digit in str(value))
    return " ".join(reversed(groups))


def number_to_korean(raw: str) -> str:
    compact = raw.replace(",", "").strip()
    if "." not in compact:
        return integer_to_korean(int(compact))
    whole, fraction = compact.split(".", 1)
    fraction_text = " ".join(_DIGITS[int(digit)] for digit in fraction if digit.isdigit())
    return f"{integer_to_korean(int(whole or '0'))} 점 {fraction_text}".strip()


def normalize_korean_text(text: str) -> NormalizationResult:
    original = text
    normalized = re.sub(r"\s+", " ", text).strip()
    changes: list[str] = []

    def apply(pattern: str, replacement, label: str, flags: int = 0) -> None:
        nonlocal normalized
        updated, count = re.subn(pattern, replacement, normalized, flags=flags)
        if count:
            normalized = updated
            changes.append(label)

    apply(
        r"(?<!\d)(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?!\d)",
        lambda match: (
            f"{number_to_korean(match.group(1))}년 "
            f"{number_to_korean(match.group(2))}월 {number_to_korean(match.group(3))}일"
        ),
        "날짜 표기",
    )
    apply(
        r"(?<!\d)(\d{1,2}):(\d{2})(?!\d)",
        lambda match: f"{number_to_korean(match.group(1))}시 {number_to_korean(match.group(2))}분",
        "시각 표기",
    )
    apply(
        r"₩\s*([\d,]+)|([\d,]+)\s*원",
        lambda match: f"{number_to_korean(match.group(1) or match.group(2))} 원",
        "금액 표기",
    )
    apply(
        r"\b(\d+(?:\.\d+)?)\s*%",
        lambda match: f"{number_to_korean(match.group(1))} 퍼센트",
        "퍼센트 표기",
    )
    apply(
        r"\b(\d+(?:\.\d+)?)\s*(km|kg|cm|mm|mb|gb|ml|hz)\b",
        lambda match: f"{number_to_korean(match.group(1))} {_UNIT_NAMES[match.group(2).lower()]}",
        "단위 표기",
        flags=re.IGNORECASE,
    )
    apply(
        r"\b[A-Z]{2,6}\b",
        lambda match: " ".join(_LETTER_NAMES[letter] for letter in match.group(0)),
        "영문 약어",
    )
    apply(
        r"(?<![A-Za-z가-힣\d])\d[\d,]*(?:\.\d+)?(?![A-Za-z가-힣\d])",
        lambda match: number_to_korean(match.group(0)),
        "숫자 읽기",
    )

    normalized = re.sub(r"\s+([,.;:!?])", r"\1", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if normalized != original.strip() and not changes:
        changes.append("공백 정리")
    return NormalizationResult(original=original, normalized=normalized, changes=changes)
