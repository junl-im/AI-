# API

기본 경로: `/api/v1`

## GET /health

```json
{
  "status": "ok",
  "service": "sorion-api",
  "version": "0.9.2",
  "default_engine": "auto"
}
```

## GET /engines

현재 프로세스에 등록된 무료 로컬 엔진의 준비 상태와 실행 통계를 반환합니다.

```json
[
  {
    "id": "system",
    "name": "System Voice",
    "kind": "tts",
    "mode": "local",
    "provider": "Operating System",
    "languages": ["ko-KR"],
    "output_formats": ["wav"],
    "supports_emotion": false,
    "supports_speed": true,
    "supports_pitch": false,
    "supports_voice_clone": false,
    "ready": true,
    "recommended": true,
    "health": "ready",
    "success_count": 0,
    "failure_count": 0
  }
]
```

비용 정책 필드는 제공하지 않습니다. 제품에 등록 가능한 일반 TTS가 모두 무료 로컬 실행이기 때문입니다.

## GET /engines/strategy

```json
{
  "version": "0.9.2",
  "free_only": true,
  "deployment_profile": "firebase-static-plus-local-runtime",
  "primary_tts_engine": "auto",
  "primary_clone_engine": "cosyvoice3",
  "local_fallback_engine": "melo",
  "browser_fallback_engine": "browser-speech",
  "auto_order": ["cosyvoice3", "melo", "system", "mock"]
}
```

## POST /tts/synthesize

```json
{
  "text": "회의는 2026-08-03 09:30에 시작합니다.",
  "voice_id": "sori-warm",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 0,
  "output_format": "wav",
  "engine_id": "auto",
  "normalize_text": true,
  "job_id": "client-generated-uuid"
}
```

자동 모드는 CosyVoice·MeloTTS·System Voice 중 준비된 후보를 순서대로 시도합니다. 명시 엔진 요청은
해당 엔진만 사용합니다. 180자를 넘는 문장은 구간으로 나누고 같은 형식의 WAV로 병합합니다.

## GET /tts/jobs/{job_id}/events

작업 상태를 SSE로 전송합니다. Web은 SSE 연결 실패 시 polling으로 자동 전환합니다.

## GET /tts/jobs/{job_id}/result

완료 결과를 SQLite JobStore에서 복구합니다. 결과 TTL이 끝난 작업은 410을 반환합니다.

## DELETE /tts/jobs/{job_id}

진행 중인 작업에 취소를 요청합니다.

## GET /audio/{filename}

임시 WAV를 제공합니다. 기본 보관 시간은 30분이며 경로 이동 문자열을 거부합니다.

## 품질 API

- `GET /quality/diagnostics`: Python·운영체제·엔진 준비 상태
- `GET /quality/sentences`: 한국어 평가 문장
- `POST /quality/text-preview`: 숫자·날짜 정규화와 문장 분할 미리보기
- `POST /quality/compare`: 최대 두 무료 엔진의 생성 시간·RTF·파일 크기 비교


## GET /engines/catalog

무료 한국어 음성 오케스트레이터의 채택 결정을 반환합니다. 실제 자동 엔진과 선택 Adapter, 벤치마크 후보, 연구 전용, 제외 항목을 분리합니다.

주요 필드:

- `decision`: adopted, optional, benchmark, external-plugin, research-only, excluded
- `auto_eligible`: 자동 실행 경로 포함 여부
- `korean_fit`: 한국어 제품 적합도
- `license_policy`: 코드와 checkpoint의 배포 정책
- `pipeline`: Director부터 검수까지의 단계별 기본 엔진

## POST /director/plan

외부 LLM 없이 한국어 내용 제작 계획을 생성합니다.

```json
{
  "text": "제1장. AI 기술은 빠르게 발전하고 있습니다.",
  "use_case": "auto",
  "voice_id": "sori-warm",
  "preserve_wording": true
}
```

응답에는 감지된 용도, 생성 구간, 발음 힌트, 문장별 쉼, 권장 속도·피치·감정, 무료 엔진 순서와 후처리 계획이 포함됩니다.

## 0.9.3-alpha.1 Worker 모델 진단

Worker `GET /ready`와 `GET /v1/diagnostics`는 기존 필드에 다음 정보를 추가한다.

- `model_install_state`: 경로·매니페스트·라이선스·체크섬·장치·adapter 단계 상태
- `model_id`, `model_version`, `model_license_name`, `model_license_url`
- `model_checksum_verified`, `model_checksum_failures`
- `model_declared_file_count`, `model_verified_file_count`, `model_size_mb`
- `hardware_profile`, `hardware_supported`, `hardware_reason`, `mps_available`

API `GET /api/v1/connectivity`는 `worker-model-integrity` 검사로 이 상태를 전달한다.

## 0.9.3-beta.1 검증·STT·Export

- `POST /api/v1/quality/device-benchmarks`: 실기기 지연·RTF·메모리·VRAM 기록
- `GET /api/v1/quality/device-benchmarks`: 최근 실기기 기록 조회
- `GET /api/v1/quality/stt/probe`: Faster Whisper 선택 설치 상태
- `POST /api/v1/quality/stt/measure`: 원문·전사문의 CER·WER·핵심 토큰 오류 측정
- `POST /api/v1/quality/stt/transcribe`: 로컬 음원 전사와 측정
- `POST /api/v1/exports`: 완료 WAV·쉼 병합, SRT·VTT, 선택적 MP3 생성

## 0.9.3-beta.2 실기기 summary와 선택 STT 재생성

```text
GET  /api/v1/quality/device-benchmarks/summary
POST /api/v1/quality/stt/verify-segments
```

`device-benchmarks/summary`는 CUDA, Apple Silicon, CPU, Android, iOS와 10·30·60분 조합의 기록 여부와 최신 상태를 반환한다. `stt/verify-segments`는 서버 audio store의 완료 음원을 Faster Whisper로 전사하고 CER·WER·핵심 토큰 오류를 계산해 `regeneration_segment_ids`와 한도 도달 `blocked_segment_ids`를 반환한다.
