import re

from app.schemas.director import (
    DirectorPlanResponse,
    DirectorRequest,
    DirectorUseCase,
    PauseHint,
    PronunciationHint,
)
from app.services.text_normalizer import normalize_korean_text
from app.services.text_segmenter import split_korean_text

_PRONUNCIATIONS = {
    "AI": "에이아이",
    "API": "에이피아이",
    "CPU": "씨피유",
    "GPU": "지피유",
    "GPT": "지피티",
    "ChatGPT": "챗지피티",
    "OpenAI": "오픈에이아이",
    "URL": "유알엘",
    "UI": "유아이",
    "UX": "유엑스",
    "WAV": "웨이브",
    "MP3": "엠피쓰리",
}


def _detect_use_case(text: str, requested: DirectorUseCase) -> DirectorUseCase:
    if requested != "auto":
        return requested
    lowered = text.lower()
    if any(token in lowered for token in ("구독", "좋아요", "영상", "유튜브")):
        return "youtube-narration"
    audiobook_tokens = ("제1장", "제 1장", "장면", "소설", "그는", "그녀는")
    if any(token in text for token in audiobook_tokens):
        return "audiobook"
    if any(token in text for token in ("광고", "지금 바로", "특별한", "혜택")):
        return "commercial"
    announcement_tokens = ("안내드립니다", "알려드립니다", "공지", "주의")
    if any(token in text for token in announcement_tokens):
        return "announcement"
    if re.search(r"[\"“”'].+?[\"“”']", text, flags=re.DOTALL):
        return "dialogue"
    return "audiobook" if len(text) >= 700 else "youtube-narration"


def _recommendations(use_case: DirectorUseCase) -> tuple[float, float, str]:
    table: dict[DirectorUseCase, tuple[float, float, str]] = {
        "auto": (1.0, 0.0, "neutral"),
        "youtube-narration": (1.03, 0.0, "happy"),
        "audiobook": (0.94, -0.5, "neutral"),
        "commercial": (1.02, 0.5, "commercial"),
        "announcement": (0.97, 0.0, "neutral"),
        "dialogue": (0.98, 0.0, "neutral"),
    }
    return table[use_case]


def _pause_hints(segments: list[str], use_case: DirectorUseCase) -> list[PauseHint]:
    hints: list[PauseHint] = []
    base = 650 if use_case == "audiobook" else 450
    for index, segment in enumerate(segments[:-1], start=1):
        milliseconds = base
        reason = "문장 경계 호흡"
        if segment.rstrip().endswith(("?", "？")):
            milliseconds = max(base, 600)
            reason = "질문 뒤 의미 전환"
        elif segment.rstrip().endswith(("!", "！")):
            milliseconds = max(350, base - 100)
            reason = "강조 뒤 짧은 호흡"
        elif len(segment) >= 120:
            milliseconds = min(1000, base + 200)
            reason = "긴 문장 뒤 호흡 회복"
        hints.append(
            PauseHint(
                after_segment=index,
                milliseconds=milliseconds,
                reason=reason,
            )
        )
    return hints


def _pronunciation_hints(text: str) -> list[PronunciationHint]:
    hints: list[PronunciationHint] = []
    for source, spoken in _PRONUNCIATIONS.items():
        if re.search(rf"(?<![A-Za-z]){re.escape(source)}(?![A-Za-z])", text, re.IGNORECASE):
            hints.append(PronunciationHint(source=source, spoken=spoken))
    return hints


def build_director_plan(request: DirectorRequest, version: str) -> DirectorPlanResponse:
    use_case = _detect_use_case(request.text, request.use_case)
    normalization = normalize_korean_text(request.text)
    normalized_text = normalization.normalized
    segments = split_korean_text(normalized_text, 180)
    speed, pitch, emotion = _recommendations(use_case)
    required_capabilities = ["korean-tts", "long-form"]
    if use_case in {"commercial", "dialogue", "youtube-narration"}:
        required_capabilities.append("emotion-instruction")
    if len(segments) >= 4:
        required_capabilities.append("streaming")

    engine_order = ["cosyvoice3", "melo", "system"]
    warnings: list[str] = []
    if use_case in {"commercial", "dialogue"}:
        warnings.append(
            "MeloTTS와 System Voice는 세밀한 감정 지시를 지원하지 않을 수 있어 "
            "CosyVoice 준비 상태를 우선 확인합니다."
        )
    if len(request.text) >= 10_000:
        warnings.append(
            "매우 긴 내용입니다. 장면 또는 문단 단위 프로젝트 분리를 "
            "권장합니다."
        )
    if request.preserve_wording:
        warnings.append(
            "원문 보존 모드이므로 Director는 문장을 다시 쓰지 않고 "
            "생성 계획만 제안합니다."
        )

    post_processing = ["peak-normalization"]
    if use_case in {"audiobook", "announcement"}:
        post_processing.append("optional-deepfilternet3")
    if use_case in {"commercial", "youtube-narration"}:
        post_processing.append("optional-resemble-enhance")

    return DirectorPlanResponse(
        version=version,
        use_case=use_case,
        normalized_text=normalized_text,
        segments=segments,
        pronunciation_hints=_pronunciation_hints(request.text),
        pause_hints=_pause_hints(segments, use_case),
        recommended_speed=speed,
        recommended_pitch=pitch,
        recommended_emotion=emotion,
        engine_order=engine_order,
        required_capabilities=required_capabilities,
        post_processing=post_processing,
        warnings=warnings,
        summary=(
            f"{use_case} 용도로 {len(segments)}개 음성 구간을 계획했습니다. "
            "무료 로컬 엔진을 자동 평가해 가장 적합한 경로를 선택합니다."
        ),
    )
