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

## 0.9.3-beta.3 Engine Heartbeat 5 연결·프리셋·지연 계약

`GET /connectivity` 추가 필드:

```json
{
  "public_https_ready": true,
  "public_api_origin": "https://voice.example.com"
}
```

`GET /setup`의 `voice_preset_diagnostics`는 프리셋별 `status`, `usable`, 길이, 샘플레이트,
채널, 비트 깊이, 무음·클리핑 비율과 조치 사유를 반환합니다. 1~30초, 16~48kHz, 모노·스테레오
8·16·24·32비트 PCM WAV가 기본 허용 범위입니다.

TTS 완료 응답의 `first_audio_ms`는 첫 사용 가능 서버 음성 파일 준비 시간입니다. 여러 구간은 첫
구간 준비, 한 구간은 최종 파일 준비 시점이며 실제 브라우저 재생 시작을 의미하지 않습니다.

## 0.9.3-beta.3 Engine Heartbeat 6 부분 음원 계약

```text
GET /api/v1/tts/jobs/{job_id}
GET /api/v1/tts/jobs/{job_id}/events
GET /api/v1/tts/jobs/{job_id}/segments/{index}/audio?file=...&expires=...&signature=...
```

작업 상태의 `ready_segments`와 SSE `segment-ready`는 구간 번호, 전체 구간 수, 엔진, 길이,
크기, 서버 준비 시간과 단기 서명 URL을 반환합니다. URL은 작업 ID·구간 번호·실제 파일명·만료
시각에 결합되며 같은 파일이 해당 작업 스냅샷에 등록돼 있어야 합니다. 구간 응답은
`Cache-Control: private, no-store`이고 만료 뒤 작업 상태를 다시 조회하면 새 URL이 발급됩니다.


## Engine Heartbeat 6.4 서명 최종 음원과 실기기 인증

- `POST /tts/synthesize`와 `GET /tts/jobs/{job_id}/result`의 최종 `audio_url`은 `/tts/jobs/{job_id}/audio?file=...&expires=...&signature=...` 형식입니다.
- `GET /tts/jobs/{job_id}/audio`는 작업 결과의 실제 파일명, 만료 시각과 HMAC 서명을 모두 확인하고 `private, no-store`로 반환합니다.
- URL 만료 시 완료 결과 TTL 안에서 `GET /tts/jobs/{job_id}/result`를 다시 호출하면 새 URL을 받습니다. 실제 파일이나 결과가 만료되면 410입니다.
- `POST /quality/device-benchmarks`는 `scenario`, `playback_completed`, `sse_reconnected`, `audio_fetch_recovered`, `seam_p95_ms`, `final_handoff_error_ms`를 추가로 받습니다.
- summary는 기존 `coverage` 외에 Android/iOS 4개 시나리오 × 10·30·60분의 `certification_coverage`와 `missing_certifications`를 반환합니다.

## POST /quality/device-benchmarks · Heartbeat 6.5

실기기 recorder는 기존 benchmark 필드에 다음 값을 추가합니다.

```json
{
  "device_profile": "android",
  "preset_id": "on-clear",
  "sample_minutes": 10,
  "soak_elapsed_seconds": 603,
  "scenario": "network-switch",
  "sse_reconnected": true,
  "audio_fetch_recovered": true,
  "sse_reconnect_ms": 900,
  "audio_fetch_recovery_ms": 1200,
  "playback_interruption_ms": 650,
  "seam_p95_waited_ms": 850,
  "seam_p95_decode_ms": 140
}
```

`GET /quality/device-benchmarks/summary`의 `metric_groups`는 device profile·engine ID·preset ID별 P95, 평균 RTF와 실패율을 반환합니다.

## POST /exports · archive policy

응답에는 `server_expires_at`, `server_retention_minutes`, `preservation_mode: download-only`가 포함됩니다. 서버 파일은 임시 보관만 하며 사용자 보존은 음원·SRT·VTT 다운로드로 수행합니다.

## Heartbeat 6.7 Evidence Intake

- `POST /api/v1/quality/evidence-intake/preview`: 최대 5MiB의 field evidence v2 또는 Web quality run report를 검증하고 중복 bundle·record 수를 반환한다.
- `POST /api/v1/quality/evidence-intake/import`: preview와 같은 검증을 다시 수행한 뒤 checksum 원본과 출처 metadata를 등록한다.
- `GET /api/v1/quality/evidence-intake`: 최근 등록된 evidence bundle 목록을 반환한다.

Web quality report JSON 가져오기는 report 내부 SHA와 7개 phase 계약을 검증한다. 실제 log·dist 파일 자체의 검증은 원 artifact에서 `npm run quality:web-report:verify`를 실행해야 한다.

## 프리셋 승인·신뢰 키 교체 API

모든 endpoint는 loopback 또는 32자 이상 운영자 토큰 인증을 요구합니다. 재서명과 갱신 대기열은 일반 사용자 화면에 노출하지 않고 Quality Lab의 운영자 카드에서만 사용합니다.

- `POST /api/v1/quality/voice-preset-approvals/preview`
- `POST /api/v1/quality/voice-preset-approvals/apply`
- `GET /api/v1/quality/voice-preset-approvals/history`
- `POST /api/v1/quality/voice-preset-approvals/{approval_id}/rollback`
- `GET /api/v1/quality/voice-preset-approvals/renewals?days=60`
- `POST /api/v1/quality/voice-preset-approvals/resign/preview`
- `POST /api/v1/quality/voice-preset-approvals/resign/apply`

새 승인과 재서명은 active key만 사용합니다. previous key는 검증 전용이며 unknown key·invalid HMAC은 자동 덮어쓰지 않습니다. 승인 apply·재서명·rollback은 같은 로컬 파일시스템의 API 프로세스 간 파일 잠금을 획득합니다.


## 0.9.5 benchmark 회귀와 개인정보 제외 감사 API

`GET /api/v1/quality/worker-telemetry/summary`의 각 `metric_groups[]`에는 `regression`이 추가됩니다.

- `status`: `insufficient`, `stable`, `warning`, `regressed`
- `minimum_records`: 현재 10
- `available_records`
- 최초 5건 기준 구간과 최근 5건 현재 구간
- 실패율, first audio P95, RTF P95, final handoff P95
- 사람이 읽을 수 있는 `reasons`

모델 ID·버전·digest, 장치 profile, 가속기, GPU와 프리셋이 다르면 별도 그룹입니다.

- `GET /api/v1/quality/privacy-audit-bundle`: 개인정보 제외 감사 JSON 생성
- `POST /api/v1/quality/privacy-audit-bundle/verify`: 레코드와 전체 SHA-256 재검증

감사 JSON에는 actor·reviewer·IP·GPU 원문·signature·실제 WAV·동의 원문·비밀키가 포함되지 않습니다.
