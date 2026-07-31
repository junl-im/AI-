from app.services.text_normalizer import integer_to_korean, normalize_korean_text
from app.services.text_segmenter import split_korean_text


def test_korean_number_reader_handles_large_values():
    assert integer_to_korean(38500) == "삼만 팔천오백"
    assert integer_to_korean(2026) == "이천이십육"


def test_normalizer_expands_date_money_percent_and_acronym():
    result = normalize_korean_text("2026-08-03 결제는 38,500원, AI 정확도는 95%입니다.")

    assert "이천이십육년 팔월 삼일" in result.normalized
    assert "삼만 팔천오백 원" in result.normalized
    assert "에이 아이" in result.normalized
    assert "구십오 퍼센트" in result.normalized
    assert {"날짜 표기", "금액 표기", "퍼센트 표기", "영문 약어"}.issubset(result.changes)


def test_segmenter_preserves_all_text_and_limits_chunks():
    text = "첫 번째 문장입니다. " + "아주 긴 설명을 자연스럽게 나눕니다, " * 8 + "마지막입니다."
    chunks = split_korean_text(text, max_chars=80)

    assert len(chunks) > 1
    assert all(1 <= len(chunk) <= 80 for chunk in chunks)
    assert "첫 번째 문장입니다." in chunks[0]
    assert chunks[-1].endswith("마지막입니다.")
