# HANDOFF v1.6.15 Preview Ownership & Model Cache Diagnostics

- 앱 버전: `1.6.15`
- build key: `1.6.15-preview-cache-diagnostics`
- 기준 릴리스: `v1.6.14`
- 필수 결과 형식: `DELIVERY_RULES.md`
- 최종 QA: **259/259 통과**

## 구현 내용

### Update Sentinel

Update Sentinel은 서비스워커 업데이트 감시, 이전 앱 셸 캐시 정리, 버전·캐시·엔진 진단 복사를 계속 담당합니다. v1.6.15 build key 변경으로 v1.6.14 앱 셸과 새 셸을 분리하며, 모델 팩 전용 캐시는 앱 셸 정리 대상에서 제외합니다.

### Preview Controller 분리

`src/app/preview-controller.js`가 정지 화면 RAF, 재생 RAF, 종료 감시 interval, preview operation token을 소유합니다. `src/app.js`에는 `renderPreviewStillNow`, `renderPreviewStill`, `stopPreview`, `previewSelectedRange` 호환 브리지만 남아 기존 모듈 계약을 유지합니다.

### 미리보기 정리 계약

- 새 미리보기 시작 전 이전 RAF·interval·작업 토큰 정리
- 재생 거절 시 진단 기록 후 stopped 상태 복구
- 새 원본 또는 작업 세대 변경 시 stale playback 중단
- 페이지 종료 시 import controller와 preview controller를 함께 dispose
- dispose 후 새 RAF 예약 차단

### 모델 캐시 dry-run 진단

`inspectOrphanedCache()`는 모델 팩 전용 Cache Storage를 설치 메타데이터와 대조해 등록 파일과 고아 파일을 분리합니다. 삭제 없이 고아 개수와 `Content-Length` 기반 추정 용량을 반환합니다.

### 저장 공간 UI와 수동 정리

비전 모델 팩 패널에서 다음 정보를 표시합니다.

- origin 사용량·quota·가용 용량
- 설치된 모델 팩 수와 메타데이터 합산 용량
- 고아 모델 캐시 개수와 추정 용량

`모델 캐시 다시 검사` 또는 `고아 캐시 N개 정리` 버튼은 사용자 명시 동작에서만 `cleanupOrphanedCache()`를 실행합니다. 등록된 팩과 활성 팩은 삭제하지 않습니다.

### 시작 성능과 shell hydration

- Preview Controller는 앱 동작 전에 필요한 직접 모듈로 유지합니다.
- feedback UX는 staged loader의 shell 단계 첫 모듈로 이동했습니다.
- 직접 시작 스크립트는 49개이며 shell 진입·idle warmup에서 feedback UX를 적재합니다.

## 주요 소유권

- `src/app/preview-controller.js`: preview RAF·interval·operation token·dispose
- `src/app.js`: preview controller 생성과 기존 함수 브리지
- `src/vision/vision-model-pack-manager.js`: dry-run cache inspection, cleanup, storage diagnostics
- `src/ui/vision-model-pack-panel.js`: 저장소 요약, 고아 캐시 표시, 수동 정리
- `src/boot/staged-ui-loader.js`: feedback UX shell hydration과 편집·내보내기·Local AI 단계 적재
- `qa/preview_controller_smoke.js`: RAF batching, play/stop, rejection cleanup, dispose
- `qa/vision_model_pack_storage_policy_smoke.js`: dry-run 비삭제, 고아 용량, 진단 결합, quota 회귀

## 검수 결과

1. 신규 preview controller·model cache 회귀 통과
2. 기존 모델 설치·벤치마크·롤백 회귀 통과
3. 서비스워커 앱 셸·변조 탐지·수동 복구·known-good 보존 통과
4. 결정적 4개 샤드: 65/65, 65/65, 65/65, 64/64
5. Chromium 4개 화면 오류·overflow 0
6. 5회 실미디어 heap·Object URL 감사 통과
7. 20초 스마트 리프레임과 30분 1080p crop 감사 통과

## 패키징 검수 순서

1. 최종 `asset-integrity.json` 재생성
2. 통파일과 v1.6.14 덮어쓰기 패치 생성
3. ZIP 압축 무결성 검사
4. 패치 적용본과 통파일의 전체 경로·SHA-256 비교
5. 패키지 내부 핵심 신규 회귀 재실행

## 알려진 제한

- 고아 캐시 용량은 응답 `Content-Length`가 없는 항목에서 0으로 표시될 수 있습니다.
- Storage Estimate 값은 origin 전체 기준입니다.
- 실제 모델/WASM 바이너리는 배포 ZIP에 포함하지 않습니다.
- 프로세스 RSS는 Chromium 워밍업·GPU/utility 캐시를 포함하는 보조 지표입니다.
- 15→30→15분 전체 실측은 변경되지 않은 경로에 한해 기존 증빙을 승계했습니다.
- 실제 모바일 Safari와 Samsung Internet은 실기기 추가 검증 대상입니다.

## 다음 작업

- `src/app.js` 분석 오케스트레이션 추가 분리
- 모델 CPU/GPU 벤치마크 이력 그래프
- 복수 화자·동시 발화 안정화
- 화자 타임라인 직접 편집
- 모바일 Safari·Samsung Internet 실기기 회귀
