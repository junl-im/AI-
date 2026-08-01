from app.schemas.engine_catalog import (
    EngineCatalogItem,
    EngineCatalogResponse,
    PipelineStage,
)


def current_engine_catalog(version: str) -> EngineCatalogResponse:
    items = [
        EngineCatalogItem(
            id="cosyvoice3",
            name="Fun-CosyVoice 3",
            category="tts",
            decision="adopted",
            auto_eligible=True,
            korean_fit=96,
            runtime="local-worker",
            license_name="Apache-2.0 code; model card review required",
            license_policy="model-review-required",
            reason=(
                "한국어, 장문, 양방향 스트리밍과 zero-shot 음색 복제를 "
                "한 Worker에서 "
                "처리할 수 있어 주력 무료 엔진으로 유지합니다."
            ),
            requirements=["Python 3.10", "local model weights", "CPU or CUDA"],
            capabilities=[
                "korean-tts",
                "zero-shot-voice-clone",
                "streaming",
                "long-form",
                "emotion-instruction",
            ],
        ),
        EngineCatalogItem(
            id="melo",
            name="MeloTTS Korean",
            category="tts",
            decision="adopted",
            auto_eligible=True,
            korean_fit=82,
            runtime="local-process",
            license_name="MIT",
            license_policy="permissive",
            reason=(
                "CPU에서도 빠르게 동작하는 한국어 무료 기본 음성으로 "
                "유지합니다."
            ),
            requirements=["Python 3.10", "MeloTTS Korean model"],
            capabilities=["korean-tts", "speed-control", "cpu-inference"],
        ),
        EngineCatalogItem(
            id="f5-tts",
            name="F5-TTS",
            category="tts",
            decision="research-only",
            auto_eligible=False,
            korean_fit=55,
            runtime="local-worker",
            license_name="MIT code / CC-BY-NC official pretrained models",
            license_policy="non-commercial-model",
            reason=(
                "구조는 우수하지만 공식 pretrained model의 비상업 조건과 "
                "한국어 전용 "
                "운영 checkpoint 부재 때문에 자동 경로에 넣지 않습니다."
            ),
            requirements=["separately licensed Korean checkpoint", "GPU recommended"],
            capabilities=["zero-shot-tts", "voice-clone", "speed-control"],
        ),
        EngineCatalogItem(
            id="kokoro",
            name="Kokoro",
            category="tts",
            decision="excluded",
            auto_eligible=False,
            korean_fit=20,
            runtime="local-process",
            license_name="model-specific",
            license_policy="model-review-required",
            reason=(
                "공식 기본 음성 목록에 한국어가 없어 SoriON 한국어 자동 "
                "경로에서는 제외합니다."
            ),
            requirements=["official Korean voice release"],
            capabilities=["lightweight-tts"],
        ),
        EngineCatalogItem(
            id="parler-tts",
            name="Parler-TTS",
            category="tts",
            decision="benchmark",
            auto_eligible=False,
            korean_fit=35,
            runtime="local-worker",
            license_name="model-specific",
            license_policy="model-review-required",
            reason=(
                "한국어 checkpoint와 장문 안정성이 검증될 때까지 연구소 "
                "비교 후보로만 둡니다."
            ),
            requirements=["Korean checkpoint", "benchmark pass"],
            capabilities=["style-prompt-tts"],
        ),
        EngineCatalogItem(
            id="spark-tts",
            name="Spark-TTS",
            category="tts",
            decision="benchmark",
            auto_eligible=False,
            korean_fit=35,
            runtime="local-worker",
            license_name="model-specific",
            license_policy="model-review-required",
            reason=(
                "한국어 지원과 배포 라이선스를 별도 검증한 뒤에만 "
                "Adapter 후보로 승격합니다."
            ),
            requirements=["Korean benchmark", "license audit"],
            capabilities=["voice-clone", "expressive-tts"],
        ),
        EngineCatalogItem(
            id="indextts",
            name="IndexTTS",
            category="tts",
            decision="benchmark",
            auto_eligible=False,
            korean_fit=35,
            runtime="local-worker",
            license_name="model-specific",
            license_policy="model-review-required",
            reason=(
                "한국어 발음과 checkpoint 조건을 통과하기 전에는 자동 "
                "선택하지 않습니다."
            ),
            requirements=["Korean benchmark", "license audit"],
            capabilities=["zero-shot-tts", "voice-clone"],
        ),
        EngineCatalogItem(
            id="orpheus-tts",
            name="Orpheus TTS",
            category="tts",
            decision="benchmark",
            auto_eligible=False,
            korean_fit=25,
            runtime="local-worker",
            license_name="model-specific",
            license_policy="model-review-required",
            reason=(
                "한국어 공식 모델과 저사양 실행 프로필이 확인될 때까지 "
                "연구 후보로 둡니다."
            ),
            requirements=["official Korean model", "resource benchmark"],
            capabilities=["expressive-tts"],
        ),
        EngineCatalogItem(
            id="openvoice-v2",
            name="OpenVoice V2",
            category="voice-conversion",
            decision="optional",
            auto_eligible=False,
            korean_fit=86,
            runtime="local-worker",
            license_name="MIT",
            license_policy="permissive",
            reason=(
                "한국어를 공식 지원하고 permissive license이므로 동의 기반 "
                "음색 변환과 "
                "후처리용 무료 Adapter로 채택합니다."
            ),
            requirements=["local model weights", "voice ownership consent"],
            capabilities=["korean", "voice-clone", "style-control", "cross-lingual"],
        ),
        EngineCatalogItem(
            id="gpt-sovits",
            name="GPT-SoVITS",
            category="voice-clone",
            decision="benchmark",
            auto_eligible=False,
            korean_fit=72,
            runtime="external-plugin",
            license_name="MIT code; checkpoint review required",
            license_policy="model-review-required",
            reason=(
                "코드와 사용자 checkpoint의 조건을 분리해 검토한 뒤 "
                "외부 플러그인으로만 평가합니다."
            ),
            requirements=["checkpoint license audit", "consent record", "GPU recommended"],
            capabilities=["few-shot-voice-clone", "tts"],
        ),
        EngineCatalogItem(
            id="seed-vc",
            name="Seed-VC",
            category="voice-conversion",
            decision="external-plugin",
            auto_eligible=False,
            korean_fit=80,
            runtime="external-plugin",
            license_name="GPL-3.0",
            license_policy="copyleft-plugin",
            reason=(
                "품질은 유망하지만 GPL-3.0과 보관 상태를 고려해 코어에 "
                "번들하지 않고 "
                "독립 프로세스 플러그인으로만 연결합니다."
            ),
            requirements=["separate process", "GPL notice", "voice ownership consent"],
            capabilities=["zero-shot-voice-conversion", "real-time-vc", "singing-vc"],
        ),
        EngineCatalogItem(
            id="faster-whisper",
            name="Faster Whisper",
            category="stt",
            decision="adopted",
            auto_eligible=True,
            korean_fit=91,
            runtime="local-process",
            license_name="MIT",
            license_policy="permissive",
            reason=(
                "로컬 한국어 전사, 검수와 자막 생성의 기본 STT로 "
                "채택합니다."
            ),
            requirements=["CTranslate2 model", "ffmpeg"],
            capabilities=["korean-stt", "cpu-quantization", "vad"],
        ),
        EngineCatalogItem(
            id="whisperx",
            name="WhisperX",
            category="alignment",
            decision="optional",
            auto_eligible=False,
            korean_fit=82,
            runtime="local-process",
            license_name="BSD-2-Clause code; alignment models vary",
            license_policy="model-review-required",
            reason=(
                "단어 단위 타임스탬프와 자막 정렬이 필요한 프로젝트에서만 "
                "선택적으로 사용합니다."
            ),
            requirements=["faster-whisper", "Korean alignment model review"],
            capabilities=["word-timestamps", "alignment", "diarization"],
        ),
        EngineCatalogItem(
            id="sensevoice",
            name="SenseVoice",
            category="stt",
            decision="benchmark",
            auto_eligible=False,
            korean_fit=88,
            runtime="local-process",
            license_name="FunASR model license",
            license_policy="model-review-required",
            reason=(
                "한국어 정확도와 CPU 속도를 Faster Whisper와 동일 원고로 "
                "비교한 뒤 승격합니다."
            ),
            requirements=["model attribution", "Korean WER benchmark"],
            capabilities=["multilingual-stt", "emotion-recognition", "audio-events"],
        ),
        EngineCatalogItem(
            id="deepfilternet3",
            name="DeepFilterNet3",
            category="noise-reduction",
            decision="adopted",
            auto_eligible=True,
            korean_fit=100,
            runtime="local-process",
            license_name="MIT or Apache-2.0",
            license_policy="permissive",
            reason=(
                "언어와 무관한 실시간 노이즈 억제 기본 단계로 "
                "채택합니다."
            ),
            requirements=["optional local package"],
            capabilities=["denoise", "full-band", "real-time"],
        ),
        EngineCatalogItem(
            id="resemble-enhance",
            name="Resemble Enhance",
            category="enhancement",
            decision="optional",
            auto_eligible=False,
            korean_fit=100,
            runtime="local-worker",
            license_name="MIT",
            license_policy="permissive",
            reason=(
                "고품질 최종 출력에서만 실행하는 선택적 음질 향상 단계로 "
                "채택합니다."
            ),
            requirements=["GPU recommended", "offline post-processing"],
            capabilities=["denoise", "bandwidth-extension", "speech-restoration"],
        ),
        EngineCatalogItem(
            id="demucs",
            name="Demucs",
            category="source-separation",
            decision="optional",
            auto_eligible=False,
            korean_fit=100,
            runtime="local-worker",
            license_name="MIT code; model review required",
            license_policy="model-review-required",
            reason=(
                "업로드 음원에서 배경음악과 보컬 분리가 필요할 때만 "
                "실행합니다."
            ),
            requirements=["ffmpeg", "model license review", "GPU recommended"],
            capabilities=["music-separation", "vocal-isolation"],
        ),
        EngineCatalogItem(
            id="rule-director",
            name="SoriON Korean Rule Director",
            category="ai-director",
            decision="adopted",
            auto_eligible=True,
            korean_fit=100,
            runtime="local-process",
            license_name="Project code",
            license_policy="permissive",
            reason=(
                "LLM 없이도 발음·호흡·속도·엔진 요구조건을 계산하는 "
                "항상 사용 가능한 기본 Director입니다."
            ),
            requirements=[],
            capabilities=["pronunciation", "pause-plan", "speed-plan", "engine-routing"],
        ),
        EngineCatalogItem(
            id="local-llm-director",
            name="Local LLM Director",
            category="ai-director",
            decision="optional",
            auto_eligible=False,
            korean_fit=90,
            runtime="external-plugin",
            license_name="selected local model license",
            license_policy="model-review-required",
            reason=(
                "Ollama 등 공식 로컬 런타임이 있을 때만 문장 수정과 "
                "감정 제안을 보강합니다."
            ),
            requirements=["local LLM runtime", "model license review"],
            capabilities=["script-rewrite", "emotion-plan", "style-plan"],
        ),
    ]
    return EngineCatalogResponse(
        version=version,
        free_only=True,
        product_identity="engine-orchestrator",
        principles=[
            "사용자는 엔진 이름을 선택하지 않고 목적과 원고만 "
            "입력합니다.",
            "한국어 품질, 라이선스, 하드웨어, 최근 실패 상태로 자동 "
            "경로를 결정합니다.",
            "비상업 checkpoint와 copyleft 엔진은 코어 자동 경로에 "
            "포함하지 않습니다.",
            "모델이 없어도 System Voice와 Browser Speech로 기능을 유지합니다.",
        ],
        pipeline=[
            PipelineStage(
                id="director",
                name="AI Director",
                required=True,
                default_engine_ids=["rule-director"],
                fallback_engine_ids=["local-llm-director"],
            ),
            PipelineStage(
                id="pronunciation",
                name="한국어 발음·텍스트 정규화",
                required=True,
                default_engine_ids=["rule-director"],
            ),
            PipelineStage(
                id="tts",
                name="음성 생성",
                required=True,
                default_engine_ids=["cosyvoice3", "melo", "system"],
            ),
            PipelineStage(
                id="voice-conversion",
                name="동의 기반 음색 변환",
                required=False,
                default_engine_ids=["openvoice-v2"],
                fallback_engine_ids=["seed-vc"],
            ),
            PipelineStage(
                id="noise-reduction",
                name="노이즈 제거",
                required=False,
                default_engine_ids=["deepfilternet3"],
            ),
            PipelineStage(
                id="enhancement",
                name="음질 향상",
                required=False,
                default_engine_ids=["resemble-enhance"],
            ),
            PipelineStage(
                id="verification",
                name="STT 발음 검수",
                required=False,
                default_engine_ids=["faster-whisper"],
                fallback_engine_ids=["sensevoice", "whisperx"],
            ),
        ],
        items=items,
    )
