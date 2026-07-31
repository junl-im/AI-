from app.schemas.engine_strategy import EngineCandidate, EngineStrategyResponse


def current_engine_strategy(version: str) -> EngineStrategyResponse:
    return EngineStrategyResponse(
        version=version,
        primary_tts_engine="cosyvoice3",
        primary_clone_engine="cosyvoice3",
        local_fallback_engine="melo",
        candidates=[
            EngineCandidate(
                id="cosyvoice3",
                name="Fun-CosyVoice 3",
                role="primary",
                status="planned",
                languages=["ko-KR", "en-US", "ja-JP", "zh-CN"],
                capabilities=[
                    "tts",
                    "zero-shot-voice-clone",
                    "cross-lingual",
                    "streaming",
                    "emotion-instruction",
                    "speed-control",
                ],
                license_note=(
                    "코드는 Apache-2.0입니다. 실제 배포 전 선택 모델의 "
                    "모델 카드와 배포 조건을 다시 확인합니다."
                ),
                selection_reason=(
                    "한국어, 제로샷 복제, 감정 지시, 스트리밍을 한 엔진에서 "
                    "지원해 SoriON의 기본 엔진에 가장 가깝습니다."
                ),
            ),
            EngineCandidate(
                id="gpt-sovits",
                name="GPT-SoVITS",
                role="clone-specialist",
                status="planned",
                languages=["ko-KR", "en-US", "ja-JP", "zh-CN"],
                capabilities=[
                    "zero-shot-voice-clone",
                    "few-shot-finetune",
                    "cross-lingual",
                    "speed-control",
                ],
                license_note="코드는 MIT입니다. 모델별 조건은 배포 전에 확인합니다.",
                selection_reason=(
                    "짧은 샘플 복제와 소량 데이터 미세조정이 필요할 때 사용할 "
                    "전문가용 보조 엔진입니다."
                ),
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
                    "GPU가 없는 로컬 환경에서 한국어 생성을 검증하는 경량 "
                    "대체 엔진으로 유지합니다."
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
                selection_reason="AI 모델을 설치하지 않은 환경의 최종 안전망입니다.",
            ),
            EngineCandidate(
                id="fish-speech-s2",
                name="Fish Audio S2",
                role="evaluation-only",
                status="optional",
                languages=["ko-KR", "en-US", "ja-JP", "zh-CN"],
                capabilities=[
                    "tts",
                    "rapid-voice-clone",
                    "multi-speaker",
                    "streaming",
                ],
                license_note=(
                    "연구·비상업 평가는 가능하지만 상업 서비스에는 별도 "
                    "라이선스가 필요합니다."
                ),
                selection_reason=(
                    "음질 비교 후보로만 유지하며, 상업 기본 엔진으로 자동 "
                    "선택하지 않습니다."
                ),
            ),
        ],
    )
