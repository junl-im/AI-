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


## 0.7.1 운영 보안과 복구

- `/health` 외 경로는 서비스 토큰과 HMAC-SHA256 요청 서명을 검증한다.
- SSE는 `id`와 `Last-Event-ID`를 지원해 끊긴 위치 다음 revision부터 재개한다.
- 종료된 작업과 입력 샘플은 `job_ttl_minutes` 이후 정리한다.
- production 환경에서는 토큰과 서명 비밀키가 모두 없으면 readiness를 차단한다.
- 모델 필수 파일, 디스크 여유 공간, CUDA, VRAM, CPU 저속 모드 정책을 진단한다.
