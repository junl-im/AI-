import re

_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?。！？])\s+")


def _split_oversized(text: str, max_chars: int) -> list[str]:
    output: list[str] = []
    remaining = text.strip()
    while len(remaining) > max_chars:
        window = remaining[: max_chars + 1]
        split_at = max(window.rfind(", "), window.rfind("; "), window.rfind(" "))
        if split_at < max_chars // 2:
            split_at = max_chars
        output.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].strip()
    if remaining:
        output.append(remaining)
    return output


def split_korean_text(text: str, max_chars: int = 180) -> list[str]:
    if max_chars < 40:
        raise ValueError("문장 분할 길이는 40자 이상이어야 합니다.")
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    sentences = _SENTENCE_BOUNDARY.split(cleaned)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        candidates = _split_oversized(sentence, max_chars)
        for candidate in candidates:
            combined = f"{current} {candidate}".strip()
            if current and len(combined) > max_chars:
                chunks.append(current)
                current = candidate
            else:
                current = combined
    if current:
        chunks.append(current)
    return chunks
