# COSYVOICE WORKER

## 목적

대형 음성 모델을 웹 API 프로세스와 분리해 GPU 초기화, 모델 장애, 긴 추론이
FastAPI 게이트웨이 전체를 멈추지 않도록 한다.

```text
React PWA
→ FastAPI Gateway :8000
→ CosyVoice Worker :9000
→ Fun-CosyVoice 3 model
```

## 상태 계약

- `GET /health`: Worker 프로세스 생존 여부만 확인한다.
- `GET /ready`: adapter, 모델 경로, 모델 로딩 상태를 확인한다.
- `GET /v1/diagnostics`: torch, CUDA, GPU, VRAM, adapter, 모델 경로를 반환한다.

프로세스가 살아 있어도 모델이 준비되지 않았다면 `not-ready`다. 이 상태에서는
작업 생성 API가 HTTP 503을 반환하며 성공으로 위장하지 않는다.

## 기본 adapter

`app.adapters.cosyvoice3`는 설치된 CosyVoice 저장소의 `AutoModel`을 사용한다.
참조 음성과 대상 문장을 `inference_cross_lingual(..., stream=True)`에 전달하고,
반환되는 음성 조각을 모아 문장 구간 WAV로 저장한다.

모델 가중치와 CosyVoice 대형 의존성은 릴리스 ZIP에 포함하지 않는다.

```text
SORION_WORKER_MODEL_PATH=/models/Fun-CosyVoice3-0.5B
SORION_WORKER_ADAPTER_MODULE=app.adapters.cosyvoice3
SORION_WORKER_DEVICE=cuda:0
```

## 작업 API

- `POST /v1/jobs`: 동의된 샘플과 최대 500자 문장으로 작업 생성
- `GET /v1/jobs/{id}`: 전체·문장별 진행률 조회
- `GET /v1/jobs/{id}/events`: SSE 진행 이벤트
- `POST /v1/jobs/{id}/cancel`: 취소
- `POST /v1/jobs/{id}/retry`: 완료되지 않은 구간만 재시도
- `GET /v1/jobs/{id}/audio`: 최종 WAV
- `GET /v1/jobs/{id}/segments/{index}/audio`: 완료된 문장 구간 WAV

## 문장별 실행

입력을 문장 단위로 분할하고 각 구간을 독립적으로 생성한다. 완료된 구간은 유지하고
실패하거나 취소된 구간만 다시 실행한다. 모든 구간의 PCM 형식이 같을 때만 최종 WAV로
병합한다.

## 실행

```bash
npm run dev:worker
npm run dev:api
npm run dev
```

API 환경 변수:

```text
SORION_COSYVOICE_WORKER_URL=http://127.0.0.1:9000
```

## 운영 전 필수

- Worker를 공개 인터넷에 직접 노출하지 않는다.
- API와 Worker 사이 인증 또는 사설 네트워크를 적용한다.
- 동시 작업 수와 파일 크기를 제한한다.
- 모델·코드 라이선스와 배포 조건을 별도로 확인한다.
- 원본 음성, 생성 문장, 동의 정보는 일반 로그에 남기지 않는다.


## 0.7.2 운영 보안과 복구

- `/health` 외 경로는 서비스 토큰과 HMAC-SHA256 요청 서명을 검증한다.
- SSE는 `id`와 `Last-Event-ID`를 지원해 끊긴 위치 다음 revision부터 재개한다.
- 종료된 작업과 입력 샘플은 `job_ttl_minutes` 이후 정리한다.
- production 환경에서는 토큰과 서명 비밀키가 모두 없으면 readiness를 차단한다.
- 모델 필수 파일, 디스크 여유 공간, CUDA, VRAM, CPU 저속 모드 정책을 진단한다.

## 0.9.3-alpha.1 검증된 모델 온보딩

Worker는 adapter를 import하고 모델을 메모리에 올리기 전에 다음 순서로 검사한다.

1. `SORION_WORKER_MODEL_PATH`가 실제 디렉터리인지 확인한다.
2. `SORION_WORKER_MODEL_MANIFEST_PATH`의 JSON schema와 안전한 상대 경로를 확인한다.
3. 매니페스트가 요구하면 `SORION_WORKER_MODEL_LICENSE_ACCEPTED=true`인지 확인한다.
4. 선언된 파일 크기와 SHA-256을 검증한다.
5. CUDA·Apple Silicon MPS·명시적 CPU 저속 모드와 최소 VRAM을 진단한다.
6. Worker 출력 경로의 최소 디스크 여유를 확인한 뒤 adapter를 한 번만 로딩한다.

기본값은 `SORION_WORKER_REQUIRE_MODEL_MANIFEST=true`다. 이전처럼 모델 경로만 지정한 상태는
`manifest-required`이며 ready로 표시하지 않는다.

### 매니페스트 생성

실제 모델 출처, 버전과 라이선스를 사용자가 확인한 뒤 Worker 디렉터리에서 실행한다.

```bash
python scripts/model_manifest.py create \
  --model-path /models/Fun-CosyVoice3-0.5B \
  --output /models/Fun-CosyVoice3-0.5B/sorion-model-manifest.json \
  --model-id Fun-CosyVoice3-0.5B \
  --model-version <확인한-버전> \
  --license-name <확인한-라이선스> \
  --license-url <확인한-라이선스-주소>
```

전체 폴더 대신 핵심 파일만 고정하려면 `--file`을 여러 번 지정한다. 생성 도구는 실제 로컬
파일을 읽어 크기와 SHA-256을 기록하며 모델을 다운로드하지 않는다.

### 검증

```bash
python scripts/model_manifest.py verify \
  --model-path /models/Fun-CosyVoice3-0.5B \
  --manifest /models/Fun-CosyVoice3-0.5B/sorion-model-manifest.json \
  --accept-license
```

환경 변수:

```text
SORION_WORKER_MODEL_PATH=/models/Fun-CosyVoice3-0.5B
SORION_WORKER_MODEL_MANIFEST_PATH=/models/Fun-CosyVoice3-0.5B/sorion-model-manifest.json
SORION_WORKER_REQUIRE_MODEL_MANIFEST=true
SORION_WORKER_MODEL_LICENSE_ACCEPTED=true
SORION_WORKER_DEVICE=auto
SORION_WORKER_ALLOW_CPU=false
SORION_WORKER_MIN_VRAM_MB=8192
SORION_WORKER_MIN_DISK_FREE_MB=1024
```

`/ready`와 `/v1/diagnostics`는 `model_install_state`, 모델 ID·버전, 라이선스,
`model_checksum_verified`, 실패 파일, `hardware_profile`을 반환한다. 매니페스트나 실제 모델
파일은 신뢰 가능한 출처의 값으로만 생성하며 이 저장소는 특정 가중치의 라이선스를 대신
판단하거나 체크섬을 제공하지 않는다.
