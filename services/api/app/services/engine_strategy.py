from app.schemas.engine_strategy import EngineCandidate, EngineStrategyResponse

_FREE_ORDER = ["cosyvoice3", "melo", "system", "mock"]


def current_engine_strategy(version: str) -> EngineStrategyResponse:
    return EngineStrategyResponse(
        version=version,
        free_only=True,
        deployment_profile="firebase-static-plus-local-runtime",
        primary_tts_engine="auto",
        primary_clone_engine="cosyvoice3",
        local_fallback_engine="melo",
        browser_fallback_engine="browser-speech",
        auto_order=_FREE_ORDER,
        candidates=[
            EngineCandidate(
                id="cosyvoice3",
                name="SoriON CosyVoice Korean",
                role="primary",
                status="integrated",
                runtime="local-worker",
                enabled_by_default=True,
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "zero-shot-voice-clone",
                    "streaming",
                    "long-form",
                ],
                license_note=(
                    "Worker 코드, 선택 모델 라이선스와 기준 음성의 명시적 동의를 "
                    "배포 전에 각각 확인합니다."
                ),
                selection_reason=(
                    "사용자 PC의 무료 로컬 Worker에서 실행해 결제 계정과 외부 음성 "
                    "전송 없이 가장 높은 한국어 품질을 목표로 합니다."
                ),
            ),
            EngineCandidate(
                id="melo",
                name="MeloTTS Korean",
                role="fallback",
                status="optional",
                runtime="local-process",
                enabled_by_default=True,
                languages=["ko-KR"],
                capabilities=["tts", "speed-control", "cpu-inference"],
                license_note="MIT 기반 선택 설치 엔진입니다.",
                selection_reason=(
                    "GPU Worker가 없을 때 사용자 PC의 CPU에서 실행하는 무료 AI "
                    "대체 엔진입니다."
                ),
            ),
            EngineCandidate(
                id="system",
                name="Operating System Voice",
                role="fallback",
                status="integrated",
                runtime="device",
                enabled_by_default=True,
                languages=["ko-KR"],
                capabilities=["tts", "cpu-inference", "wav-output"],
                license_note="운영체제와 설치 음성의 사용 조건을 따릅니다.",
                selection_reason=(
                    "AI 모델을 설치하지 않은 PC에서도 무료 WAV 생성을 유지합니다."
                ),
            ),
            EngineCandidate(
                id="mock",
                name="Contract Test Voice",
                role="test-only",
                status="test-only",
                runtime="test",
                enabled_by_default=False,
                languages=["ko-KR"],
                capabilities=["contract-test"],
                license_note="개발 테스트 전용이며 실제 사용자 음성으로 취급하지 않습니다.",
                selection_reason="API와 작업 복구 계약을 검증하는 테스트 전용 엔진입니다.",
            ),
        ],
    )
