from app.services.stt_metrics import (
    character_error,
    critical_token_errors,
    word_error,
)


def test_stt_metrics_are_zero_for_equivalent_text():
    reference = "2026년 8월 2일 결제 금액은 38,500원입니다."
    hypothesis = "2026년 8월 2일 결제 금액은 38,500원입니다"

    assert character_error(reference, hypothesis).rate == 0
    assert word_error(reference, hypothesis).rate == 0
    assert critical_token_errors(reference, hypothesis)["money"]["error_count"] == 0


def test_stt_metrics_detect_critical_number_error():
    reference = "결제 금액은 38,500원이고 성공률은 98%입니다."
    hypothesis = "결제 금액은 35,800원이고 성공률은 88%입니다."

    critical = critical_token_errors(reference, hypothesis)

    assert character_error(reference, hypothesis).distance > 0
    assert critical["money"]["error_count"] == 1
    assert critical["percent"]["error_count"] == 1
