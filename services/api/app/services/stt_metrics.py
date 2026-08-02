import re
import unicodedata
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass

_SPACE_RE = re.compile(r"\s+")
_PUNCT_RE = re.compile(r"[^0-9a-zA-Z가-힣%₩$€¥.]+")
_NON_DECIMAL_DOT_RE = re.compile(r"(?<!\d)\.|\.(?!\d)")
_TOKEN_PATTERNS = {
    "date": re.compile(
        r"(?:\d{4}\s*[년./-]\s*\d{1,2}\s*[월./-]\s*\d{1,2}\s*일?)"
    ),
    "money": re.compile(
        r"(?:[₩$€¥]\s*\d[\d,.]*|\d[\d,.]*\s*(?:원|달러|엔|유로))",
        re.IGNORECASE,
    ),
    "percent": re.compile(r"(?:\d+(?:\.\d+)?\s*(?:%|퍼센트))"),
    "number_unit": re.compile(
        r"(?:\d+(?:\.\d+)?\s*(?:kg|g|km|m|cm|mm|초|분|시간|개|명|회))",
        re.IGNORECASE,
    ),
    "english": re.compile(r"\b[A-Za-z][A-Za-z0-9_-]*\b"),
}


@dataclass(frozen=True)
class ErrorMetric:
    distance: int
    reference_length: int

    @property
    def rate(self) -> float:
        if self.reference_length == 0:
            return 0.0 if self.distance == 0 else 1.0
        return self.distance / self.reference_length


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).lower()
    normalized = _NON_DECIMAL_DOT_RE.sub(" ", normalized)
    normalized = _PUNCT_RE.sub(" ", normalized)
    return _SPACE_RE.sub(" ", normalized).strip()


def _levenshtein(reference: Sequence[str], hypothesis: Sequence[str]) -> int:
    if len(reference) < len(hypothesis):
        reference, hypothesis = hypothesis, reference
    previous = list(range(len(hypothesis) + 1))
    for index, reference_item in enumerate(reference, start=1):
        current = [index]
        for offset, hypothesis_item in enumerate(hypothesis, start=1):
            insertion = current[offset - 1] + 1
            deletion = previous[offset] + 1
            substitution = previous[offset - 1] + (reference_item != hypothesis_item)
            current.append(min(insertion, deletion, substitution))
        previous = current
    return previous[-1]


def character_error(reference: str, hypothesis: str) -> ErrorMetric:
    reference_chars = list(normalize_text(reference).replace(" ", ""))
    hypothesis_chars = list(normalize_text(hypothesis).replace(" ", ""))
    return ErrorMetric(_levenshtein(reference_chars, hypothesis_chars), len(reference_chars))


def word_error(reference: str, hypothesis: str) -> ErrorMetric:
    reference_words = normalize_text(reference).split()
    hypothesis_words = normalize_text(hypothesis).split()
    return ErrorMetric(_levenshtein(reference_words, hypothesis_words), len(reference_words))


def critical_token_errors(reference: str, hypothesis: str) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for category, pattern in _TOKEN_PATTERNS.items():
        reference_tokens = [normalize_text(item) for item in pattern.findall(reference)]
        hypothesis_tokens = [normalize_text(item) for item in pattern.findall(hypothesis)]
        missing = list((Counter(reference_tokens) - Counter(hypothesis_tokens)).elements())
        unexpected = list((Counter(hypothesis_tokens) - Counter(reference_tokens)).elements())
        error_count = max(len(missing), len(unexpected))
        reference_count = len(reference_tokens)
        error_rate = error_count / reference_count if reference_count else float(bool(unexpected))
        result[category] = {
            "reference_count": reference_count,
            "error_count": error_count,
            "error_rate": error_rate,
            "missing": missing,
            "unexpected": unexpected,
        }
    return result
