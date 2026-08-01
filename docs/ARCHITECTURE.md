# ARCHITECTURE

## 전체 구조

```text
Mobile PWA
  → Voice Workspace
    → engine capability UI
    → request UUID + AbortController
    → FastAPI / Browser Demo fallback
  → Korean Voice Quality Lab
    → diagnostics
    → normalization preview
    → A/B comparison

FastAPI
  → Engine Registry
    → MeloTTS Adapter
    → System TTS Adapter
    → Mock Engine
  → TTS Pipeline
    → Korean normalization
    → sentence segmentation
    → engine synthesis
    → PCM WAV merge
    → generation metrics
  → Job Manager
    → timeout / concurrency / cancel
  → Audio Store
    → UUID filename / TTL cleanup / no-store delivery
```

## 엔진 선택과 기능 표시

`auto`는 준비된 비 Mock 엔진을 등록 순서대로 선택합니다. 현재 순서는 MeloTTS, Local TTS, Mock입니다. `EngineInfo`는 감정, 속도, 피치 지원 여부를 공개하고 웹은 지원하지 않는 설정을 비활성화합니다.

## 한국어 전처리

`TtsPipeline`은 원문을 숫자·날짜·시각·금액·퍼센트·단위·영문 약어 규칙으로 정규화합니다. 전처리는 원문을 삭제하지 않으며 응답의 `normalized_text`에 실제 읽은 문장을 남깁니다.

## 긴 문장 처리

정규화된 문장은 기본 180자 이하 구간으로 나뉩니다. 각 구간을 같은 엔진으로 생성한 뒤 채널 수, 샘플 폭, 샘플레이트가 동일한 비압축 PCM WAV만 병합합니다. 병합 후 자식 임시 파일은 즉시 삭제합니다.

## 품질 측정

생성 경로는 처리 시간, 음원 길이, 파일 크기, 구간 수와 RTF를 계산합니다. 품질 연구소는 최대 두 엔진을 같은 문장과 설정으로 순차 실행하며 한 결과의 실패가 전체 비교를 중단하지 않도록 합니다.

## MeloTTS 경계

모델은 첫 요청에서 지연 로딩합니다. 모델 파일과 대형 Python 의존성은 저장소와 Pages 산출물에 넣지 않습니다. 진단 API는 패키지 탐지와 모델 메모리 로딩 여부만 공개합니다.

## 작업 제어

웹이 UUID를 만들고 API 요청에 전달합니다. `JobManager`는 동일 ID 중복을 막고, 세마포어로 동시 생성 수를 제한하며, 제한 시간 초과와 취소 시 Task를 종료합니다.

## 임시 음원

음원 파일명은 UUID만 사용합니다. API는 `.sorion/audio`에 저장하고 기본 30분 뒤 삭제합니다. 파일 제공 라우트는 basename만 허용하며 캐시 저장을 금지합니다.

## 향후 확장

- MeloTTS 모델 전용 worker 프로세스
- SSE 또는 WebSocket 진행률
- 품질 보고서 IndexedDB 저장과 내보내기
- FFmpeg 기반 샘플레이트 변환 계층
- 사용자 인증이 적용된 음원 URL

## 0.5.0 작업 상태 계층

`JobManager`는 실행 중 Task와 사용자에게 공개할 상태 스냅샷을 분리한다. Task는 완료 후 제거하지만 최근 스냅샷은 제한된 개수만 유지한다. `TtsPipeline`은 엔진을 직접 알리지 않고 진행 콜백을 통해 정규화, 구간 생성, 병합 상태를 보고한다.

웹은 합성 POST를 유지하면서 같은 작업 ID를 별도 GET으로 polling한다. 진행률 조회가 일시적으로 실패해도 합성 자체를 취소하지 않는다.

## 0.5.0 브라우저 저장 계층

공통 `src/storage/database.ts`가 IndexedDB 스키마 생성과 업그레이드를 담당한다. 기능별 repository가 데이터베이스 버전을 각자 관리하지 않는다.

- `projects`: 음성 프로젝트 메타데이터
- `qualityReviews`: 문장·엔진별 품질 평가


## 0.6.0 음성 복제 경계

```text
Voice Clone Page
  → MediaRecorder 또는 파일 선택
  → Web Audio 품질 검사
  → 권한·AI 고지·금지 용도 동의
  → IndexedDB voiceProfiles
  → FastAPI voice-clones profile preparation
  → separate CosyVoice Worker boundary
```

FastAPI 게이트웨이는 CosyVoice와 PyTorch를 직접 import하지 않는다. `CosyVoiceCloneEngine`은 Worker 주소와 기능 상태만 공개한다. 모델 로딩, CUDA 초기화, speaker prompt 생성, 실제 제로샷 추론은 별도 서비스가 맡는다.

## 0.6.0 연계형 플레이어

`usePlayerStore`는 최대 20개 `PlayerTrack`을 관리한다. Dock의 단일 `audio` 요소가 TTS 결과와 복제 원본 샘플을 재생한다. 브라우저 Object URL은 트랙 소유권 플래그가 있는 경우에만 제거하며 일반 API URL은 해제하지 않는다.

## IndexedDB v3

- `projects`: TTS 프로젝트 메타데이터
- `qualityReviews`: 문장·엔진 품질 평가
- `voiceProfiles`: 동의된 음성 샘플 Blob, 품질 분석, 동의 기록

## 0.6.2 정적 웹과 엔진 서버 경계

```text
GitHub Pages · static HTTPS
  → React PWA only
  → configured API URL required

FastAPI Gateway
  → health / setup / connectivity
  → TTS registry and audio delivery
  → voice-clone consent and sample preparation

CosyVoice Worker
  → separate health endpoint
  → model, GPU and zero-shot inference in 0.7.0
```

공개 정적 웹은 같은 Origin에 Python API가 있다고 가정하지 않는다. 로컬 Vite에서만
`/api` 프록시를 기본으로 사용하고, 그 외 배포에서는 저장된 주소 또는
`VITE_API_BASE_URL`이 없으면 API 미설정 상태가 된다. 상대 음원 URL은 현재 연결된
API Origin으로 해석한다.


## 0.8.0 Chat-to-Timeline 작업공간

```text
Brand Landing
  → Compact Workspace Header
  → Voice Library + Chat Composer
  → sentence/pause Timeline Blocks
  → Progressive Linked Player Dock
```

초기 랜딩은 브랜드 설명을 유지하고 Dock 진입 후에만 편집기 화면으로 전환한다. 메시지는
문장별 음성 블록과 쉼 블록으로 변환되며 각 블록이 생성 당시 보이스·속도·감정·정규화
옵션을 소유한다. 첫 ready 블록부터 Dock 대기열에 추가한다.

## 0.8.1 모바일 연결·복구 계층

```text
Mobile Web
  → normalized API URL + last-good/history
  → adaptive timeout + GET retry
  → request/client IDs
  → FastAPI connectivity
      → TTS registry
      → Worker health/readiness
      → GPU/model diagnostics
```

API, 실제 TTS, Worker 프로세스, GPU·모델 상태를 분리한다. 온라인 복귀, NetworkInformation
변경, PWA 포그라운드 복귀에서 단일 연결 점검을 실행한다. 생성 POST는 재전송하지 않고
UUID job의 상태와 완료 결과를 조회해 모바일 응답 단절을 복구한다. FastAPI는 완료 결과와
진행 스냅샷을 SQLite JobStore에 보관하며 결과 TTL과 이력 TTL을 분리해 정리한다.

## 0.8.2 TTS job 멱등성 계층

```text
Timeline block(jobId)
  → recover status/result first
  → POST only when job is absent/expired/terminal
  → FastAPI request fingerprint
      → same job + same request: join/reuse
      → same job + different request: 409 SOA-4009
  → shielded generation Task
      → caller disconnect does not cancel
      → explicit DELETE cancels
```

## 0.8.3 SQLite JobStore와 원자적 claim

```text
POST same job ID
  → SQLite BEGIN IMMEDIATE
  → request fingerprint 확인
  → 완료 결과가 있으면 즉시 반환
  → 유효한 claim이 있으면 해당 작업 완료를 polling
  → claim이 없거나 만료됐으면 현재 프로세스가 원자적으로 획득
  → snapshot/result/TTL을 SQLite에 기록
```

실행 Task 자체는 프로세스 메모리에 남지만 job ID, fingerprint, 상태와 완료 결과는
`SORION_JOB_STORE_PATH`의 SQLite 파일에 저장된다. claim TTL은 생성 timeout보다 길게
보정되며 프로세스 종료 뒤 만료된 claim은 다른 API 프로세스가 재획득한다. 완료 결과가
만료돼도 이력 TTL 동안 tombstone을 유지해 같은 job ID의 POST와 `/result`가 410을 반환한다.
취소 요청은 SQLite에 기록하고 owner 프로세스의 watcher가 실제 Task를 취소한다.


## 0.8.4 Automatic Bootstrap과 Project Restore

```text
Web bootstrap
  → same-origin /api/v1
  → VITE_API_BASE_URL
  → last-good/history
  → safe local candidates
  → connectivity + engine catalog
  → ready real engine auto-selection

Project list click
  → activeProject in Zustand
  → Home workspace entry
  → messages/voice/timeline reconstruction
  → persisted job IDs recover-first
  → ready audio enqueue to Linked Player
```

API 주소 입력, 엔진 수동 선택과 연결 Bottom Sheet는 아키텍처에서 제거했다. 첫 브랜드
랜딩에서는 Dock을 렌더링하지 않으며 작업공간 진입 뒤에만 메뉴와 Player를 구성한다.
프로젝트 편집 상태는 IndexedDB가 담당하고 음성 작업 상태·완료 결과는 SQLite JobStore가
담당한다. 브라우저는 전체 LAN을 스캔하지 않으며 정적 운영 배포는 HTTPS API 환경변수나
same-origin reverse proxy가 선행 조건이다.
