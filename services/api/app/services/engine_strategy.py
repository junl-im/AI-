from app.schemas.engine_strategy import (
    EngineCandidate,
    EngineCostPolicy,
    EngineStrategyResponse,
)

_FREE_ORDER = ["cosyvoice3", "melo", "system", "mock"]
_METERED_ORDER = [
    "naver-clova",
    "google-chirp3-hd",
    "azure-speech",
    "elevenlabs-v3",
]


def current_engine_strategy(
    version: str,
    cost_policy: EngineCostPolicy = "free-only",
) -> EngineStrategyResponse:
    metered_enabled = cost_policy == "balanced"
    auto_order = [*_FREE_ORDER[:-1]]
    if metered_enabled:
        auto_order.extend(_METERED_ORDER)
    auto_order.append("mock")
    return EngineStrategyResponse(
        version=version,
        cost_policy=cost_policy,
        metered_engines_enabled=metered_enabled,
        primary_tts_engine="auto",
        primary_clone_engine="cosyvoice3",
        local_fallback_engine="melo",
        auto_order=auto_order,
        candidates=[
            EngineCandidate(
                id="cosyvoice3",
                name="SoriON CosyVoice Korean",
                role="primary",
                status="integrated",
                cost_tier="free",
                enabled_by_default=True,
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "zero-shot-voice-clone",
                    "streaming",
                    "long-form",
                ],
                license_note=(
                    "Worker 코드와 선택 모델의 라이선스, 기준 음성의 명시적 동의를 "
                    "배포 전에 각각 확인합니다."
                ),
                selection_reason=(
                    "무료 로컬 Worker와 동의받은 한국어 기준 음색을 사용해 비용과 "
                    "개인정보를 직접 통제합니다."
                ),
            ),
            EngineCandidate(
                id="melo",
                name="MeloTTS Korean",
                role="fallback",
                status="integrated",
                cost_tier="free",
                enabled_by_default=True,
                languages=["ko-KR"],
                capabilities=["tts", "speed-control", "cpu-inference"],
                license_note="MIT 기반 선택 설치 엔진입니다.",
                selection_reason=(
                    "GPU Worker가 없을 때 무료 CPU 환경에서 사용하는 로컬 AI "
                    "대체 엔진입니다."
                ),
            ),
            EngineCandidate(
                id="system",
                name="Operating System Voice",
                role="fallback",
                status="integrated",
                cost_tier="free",
                enabled_by_default=True,
                languages=["ko-KR"],
                capabilities=["tts", "cpu-inference"],
                license_note="운영체제와 설치 음성의 사용 조건을 따릅니다.",
                selection_reason=(
                    "AI 모델을 설치하지 않은 환경에서도 무료로 음성 기능을 "
                    "완전히 멈추지 않습니다."
                ),
            ),
            EngineCandidate(
                id="naver-clova",
                name="NAVER CLOVA Voice Premium",
                role="fallback",
                status="optional",
                cost_tier="metered",
                enabled_by_default=False,
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "emotion",
                    "speed-control",
                    "pitch-control",
                    "long-form",
                ],
                license_note="NAVER Cloud 이용 약관과 과금 정책을 따릅니다.",
                selection_reason=(
                    "운영자가 balanced 정책과 인증 정보를 명시적으로 설정한 "
                    "경우에만 사용하는 선택형 상용 엔진입니다."
                ),
            ),
            EngineCandidate(
                id="google-chirp3-hd",
                name="Google Chirp 3 HD Korean",
                role="fallback",
                status="optional",
                cost_tier="metered",
                enabled_by_default=False,
                languages=["ko-KR"],
                capabilities=["tts", "generative-voice", "long-form", "streaming"],
                license_note="Google Cloud Text-to-Speech 약관과 과금 정책을 따릅니다.",
                selection_reason="무료 우선 모드에서는 등록하지 않는 선택형 비교 엔진입니다.",
            ),
            EngineCandidate(
                id="azure-speech",
                name="Azure Korean Neural Voice",
                role="fallback",
                status="optional",
                cost_tier="metered",
                enabled_by_default=False,
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "ssml",
                    "speed-control",
                    "pitch-control",
                    "long-form",
                ],
                license_note="Microsoft Azure Speech 약관과 과금 정책을 따릅니다.",
                selection_reason="무료 우선 모드에서는 등록하지 않는 선택형 비교 엔진입니다.",
            ),
            EngineCandidate(
                id="elevenlabs-v3",
                name="ElevenLabs Korean Premium",
                role="fallback",
                status="optional",
                cost_tier="metered",
                enabled_by_default=False,
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "emotion",
                    "voice-clone",
                    "long-form",
                    "streaming",
                ],
                license_note="ElevenLabs 이용 약관, 음성 권리, 과금 정책을 따릅니다.",
                selection_reason="무료 우선 모드에서는 등록하지 않는 선택형 비교 엔진입니다.",
            ),
        ],
    )
