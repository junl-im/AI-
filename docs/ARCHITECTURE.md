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
