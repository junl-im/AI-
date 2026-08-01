from app.schemas.engine_strategy import EngineCandidate, EngineStrategyResponse


def current_engine_strategy(version: str) -> EngineStrategyResponse:
    return EngineStrategyResponse(
        version=version,
        primary_tts_engine="auto",
        primary_clone_engine="cosyvoice3",
        local_fallback_engine="melo",
        candidates=[
            EngineCandidate(
                id="cosyvoice3",
                name="SoriON CosyVoice Korean",
                role="primary",
                status="integrated",
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
                    "동의받은 한국어 기준 음색과 자체 Worker를 사용해 개인정보와 "
                    "일관된 브랜드 음색을 직접 통제합니다."
                ),
            ),
            EngineCandidate(
                id="naver-clova",
                name="NAVER CLOVA Voice Premium",
                role="fallback",
                status="integrated",
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
                    "한국어 발음과 감정·속도·피치 제어가 필요한 제작을 "
                    "우선 처리합니다."
                ),
            ),
            EngineCandidate(
                id="google-chirp3-hd",
                name="Google Chirp 3 HD Korean",
                role="fallback",
                status="integrated",
                languages=["ko-KR"],
                capabilities=["tts", "generative-voice", "long-form", "streaming"],
                license_note="Google Cloud Text-to-Speech 약관과 과금 정책을 따릅니다.",
                selection_reason=(
                    "고자연도 생성형 음성과 글로벌 운영 안정성이 필요한 "
                    "작업의 대안입니다."
                ),
            ),
            EngineCandidate(
                id="azure-speech",
                name="Azure Korean Neural Voice",
                role="fallback",
                status="integrated",
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "ssml",
                    "speed-control",
                    "pitch-control",
                    "long-form",
                ],
                license_note="Microsoft Azure Speech 약관과 과금 정책을 따릅니다.",
                selection_reason=(
                    "SSML 제어와 엔터프라이즈 배포 지역 선택이 필요한 경우 "
                    "사용합니다."
                ),
            ),
            EngineCandidate(
                id="elevenlabs-v3",
                name="ElevenLabs Korean Premium",
                role="fallback",
                status="integrated",
                languages=["ko-KR"],
                capabilities=[
                    "tts",
                    "emotion",
                    "voice-clone",
                    "long-form",
                    "streaming",
                ],
                license_note="ElevenLabs 이용 약관, 음성 권리, 과금 정책을 따릅니다.",
                selection_reason="강한 감정 연기와 다국어 콘텐츠의 표현력 비교 후보입니다.",
            ),
            EngineCandidate(
                id="melo",
                name="MeloTTS Korean",
                role="fallback",
                status="integrated",
                languages=["ko-KR"],
                capabilities=["tts", "speed-control", "cpu-inference"],
                license_note="MIT 기반 선택 설치 엔진입니다.",
                selection_reason=(
                    "클라우드 인증이 없거나 오프라인일 때의 로컬 AI "
                    "대체 엔진입니다."
                ),
            ),
            EngineCandidate(
                id="system",
                name="Operating System Voice",
                role="fallback",
                status="integrated",
                languages=["ko-KR"],
                capabilities=["tts", "cpu-inference"],
                license_note="운영체제와 설치 음성의 사용 조건을 따릅니다.",
                selection_reason=(
                    "AI 모델을 설치하지 않은 환경에서도 음성 기능을 "
                    "완전히 멈추지 않습니다."
                ),
            ),
        ],
    )
