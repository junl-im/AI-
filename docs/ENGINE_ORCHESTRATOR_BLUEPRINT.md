# ENGINE ORCHESTRATOR BLUEPRINT

현재 기준 버전: `0.9.2`

## 1. 제품 정체성

SoriON은 엔진 모음이 아니라 한국어 음성 제작 오케스트레이터다.

사용자는 엔진 이름을 고르지 않는다. 내용과 제작 목적만 입력하고 시스템이 다음 조건을 함께 평가한다.

- 한국어 지원과 실제 발음 품질
- 장문 안정성, 첫 음성 지연, 실시간 배율
- CPU·GPU·메모리와 모델 설치 상태
- 라이선스와 checkpoint 사용 조건
- 감정·속도·피치·복제 요구
- 최근 성공·실패와 circuit breaker 상태

## 2. 코어 자동 경로

기본 자동 경로는 다음 네 단계만 사용한다.

1. `cosyvoice3`: 고품질 한국어·장문·zero-shot 음색 복제
2. `melo`: CPU 한국어 AI 음성
3. `system`: 운영체제 WAV fallback
4. `browser-speech`: 정적 Web과 모바일 fallback

`mock`은 계약 테스트 전용이며 실제 사용자 음성으로 취급하지 않는다.

## 3. 엔진 채택 결정

### 즉시 채택

- Fun-CosyVoice 3
- MeloTTS Korean
- Faster Whisper
- DeepFilterNet3
- SoriON Rule Director

### 선택적 Adapter

- OpenVoice V2: 동의 기반 음색 변환
- WhisperX: 단어 타임스탬프와 자막 정렬
- Resemble Enhance: 고품질 오프라인 후처리
- Demucs: 배경음악·보컬 분리
- Local LLM Director: 공식 로컬 런타임이 있을 때만 보강

### 벤치마크 후 판단

- SenseVoice
- GPT-SoVITS
- Parler-TTS
- Spark-TTS
- IndexTTS
- Orpheus TTS

### 코어 자동 경로에서 제외

- F5-TTS 공식 pretrained checkpoint: 코드와 모델 라이선스가 다르며 공식 checkpoint가 비상업 조건이다.
- Kokoro: 현재 공식 기본 음성 목록에서 한국어 경로를 확인할 수 없다.
- Seed-VC: GPL-3.0과 독립 배포 조건 때문에 코어 번들이 아니라 외부 프로세스 플러그인으로만 허용한다.

## 4. 목표 파이프라인

```text
사용자 내용
  -> AI Director
  -> 한국어 정규화·발음 사전
  -> 장면·문장·호흡 분할
  -> 무료 TTS 자동 선택
  -> 선택적 음색 변환
  -> 선택적 노이즈 제거·음질 향상
  -> Faster Whisper 발음 검수
  -> WAV/MP3 병합·자막
```

## 5. AI Director

0.9.2의 기본 Director는 외부 LLM 없이 동작한다.

- 내용 용도 자동 추정
- 권장 속도·피치·감정
- 문장별 호흡 길이
- AI, GPU, API, OpenAI 등 영문 발음 힌트
- 장문·스트리밍·감정 제어 요구 계산
- 무료 엔진 순서 제안

원문 보존이 기본이다. 문장 재작성은 별도 동의와 로컬 LLM이 있을 때만 수행한다.

## 6. 라이선스 게이트

코드 라이선스와 모델 checkpoint 라이선스를 별개로 기록한다.

- permissive: 코어 Adapter 후보
- model-review-required: 모델 카드 검토 후 설치
- non-commercial-model: 자동 경로 금지
- copyleft-plugin: 독립 프로세스와 고지 조건으로만 연결

새 엔진을 추가하려면 `/api/v1/engines/catalog`에 결정과 근거를 먼저 등록하고, 한국어 벤치마크를 통과해야 한다.

## 7. 공식 참고 자료

- CosyVoice: https://github.com/FunAudioLLM/CosyVoice
- F5-TTS: https://github.com/SWivid/F5-TTS
- MeloTTS: https://github.com/myshell-ai/MeloTTS
- OpenVoice V2: https://github.com/myshell-ai/OpenVoice
- Seed-VC: https://github.com/Plachtaa/seed-vc
- Faster Whisper: https://github.com/SYSTRAN/faster-whisper
- WhisperX: https://github.com/m-bain/whisperX
- SenseVoice: https://github.com/FunAudioLLM/SenseVoice
- DeepFilterNet: https://github.com/Rikorose/DeepFilterNet
- Resemble Enhance: https://github.com/resemble-ai/resemble-enhance
- Demucs: https://github.com/facebookresearch/demucs
