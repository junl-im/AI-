# HANDOFF v1.6.5 Smart Reframe

## 현재 상태

- 앱 버전: `1.6.5`
- build key: `1.6.5-smart-reframe-caption-safe`
- 서비스워커 셸 캐시: `ai-shorts-studio-shell-v1.6.5-smart-reframe-caption-safe`
- 분석 캐시 계약: `v3`
- 기준 릴리스: v1.6.4 `823d608`
- 등록 자동 검사: `228개`

## 이번 패치의 핵심

### 스마트 피사체 추적

- 세로 프레임 설정에 `스마트 피사체 추적`을 추가했습니다.
- 기존 영상 움직임 분석에서 공간 중심·확산도·신뢰도를 계산해 기본 추적선을 만듭니다.
- 브라우저 `FaceDetector` 또는 등록된 MediaPipe Face Detector를 사용할 수 있으면 얼굴 중심 추적으로 승격합니다.
- 감지기를 사용할 수 없거나 일부 프레임 감지에 실패하면 모션 추적으로 자동 대체합니다.
- 추적점은 시간 보간·dead zone·최대 이동량 제한으로 부드럽게 유지합니다.

### 자막 안전 크롭

- 하단·중앙·상단 자막 위치에 따라 피사체의 목표 세로 위치를 조정합니다.
- 미리보기, 재생, 썸네일, 최종 렌더가 동일한 추적 타임라인과 크롭 계산을 사용합니다.
- 추적 모듈이 아직 적재되지 않았거나 결과가 없으면 기존 중앙 크롭으로 안전하게 복귀합니다.

### 성능과 작업 소유권

- 스마트 리프레임 엔진은 편집 단계에서만 지연 적재합니다.
- 초기 직접 실행 스크립트 예산은 `49개`를 유지합니다.
- 원본 미디어 교체 시 진행 중인 `smart-reframe` 작업도 분석·미리보기·렌더와 함께 취소합니다.
- 장시간 영상은 기존 전체 교체·렌더 근거를 상속하고, 변경된 공간 모션·크롭 경로는 실제 30분 1080p 영상에서 24개 제한 표본으로 새로 검증했습니다.

## 운영 계약

- `Update Sentinel`이 서비스워커 업데이트와 이전 셸 캐시 정리를 감시합니다.
- 기존 모듈형 엔진의 분석·추천·렌더 소유권은 유지합니다.
- 외부 CDN이나 원격 비전 API를 자동 호출하지 않습니다.
- MediaPipe 연계는 로컬에서 detector 인스턴스를 명시적으로 등록하는 adapter 방식입니다.
- 얼굴 추적 결과가 없어도 분석·편집·렌더는 계속 동작합니다.
- 프로젝트 파일에는 안전한 스마트 옵션만 저장하고 추적 프레임 원문이나 얼굴 이미지는 저장하지 않습니다.
- 현재 추적 결과는 원본 미디어 세션에 종속되며 원본 교체 시 폐기됩니다.

## 검수 순서

1. `node tools/generate-integrity-manifest.js`
2. `node qa/smart_reframe_engine_smoke.js`
3. `node qa/smart_reframe_render_smoke.js`
4. `node qa/smart_reframe_ui_smoke.js`
5. `python3 qa/run_smart_reframe_browser_audit.py --media <video.mp4>`
6. `python3 qa/run_smart_reframe_long_media_audit.py --media <30m-1080p.mp4>`
7. `python3 qa/run_browser_audit.py`
8. `node qa/run_css_ownership_audit.js`
9. `node qa/run_service_worker_lifecycle.js`
10. `python3 qa/run_gpu_media_capability_audit.py`
11. 전체 `228개` qaChecks
12. `git diff --check`
13. 전체·패치 ZIP `unzip -t` 및 패치 적용 SHA-256 비교

## QA 근거

- 등록 자동 검사: **228/228 통과**
- 앱 셸 SHA-256 무결성 자산: **126개**
- 스마트 리프레임 엔진·렌더·UI 전용 회귀 통과
- 실제 20초 MP4에서 모션 fallback 표시, 로컬 얼굴 detector 승격, 작업 소유권 해제 통과
- 실제 30분 1920×1080 영상의 공간 모션 24표본·추적선·자막 안전 9:16 크롭 통과
- 4개 viewport 브라우저 감사: 오류·Promise 거절·console error·가로 overflow 0
- CSS ownership: 50개 파일, 충돌·동일값 중복·shadow 0, `!important` 593
- 15→30→15분 교체·분석·2초 렌더·정리 전체 감사는 변경되지 않은 미디어 수명주기 근거를 v1.6.4에서 상속합니다.

## 알려진 제한

- 배포본에는 MediaPipe 모델과 WASM 파일을 포함하지 않습니다.
- 브라우저 얼굴 감지를 지원하지 않는 환경에서는 모션 중심 추적이 사용됩니다.
- 빠른 카메라 팬, 화면 전체 전환, 얼굴이 매우 작은 장면은 추적 신뢰도가 낮을 수 있습니다.
- 여러 인물 중 주 화자는 얼굴 크기·신뢰도·이전 위치 연속성으로 선택하며 음성 화자 분리는 아직 적용하지 않습니다.
- 실제 모바일 Safari·Samsung Internet과 물리 GPU/NPU는 별도 실기기 검증이 필요합니다.

## 다음 우선순위

고급 캐시 정리 영향 미리보기, 브라우저 WASM/WebGPU 모델 팩, 음성 화자와 얼굴 추적을 결합한 주 화자 선택이 다음 독립 패치 후보입니다.
