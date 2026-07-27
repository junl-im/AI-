# AI Shorts Studio v1.6.15 정밀 분석 보고서

## 1. 시스템

- 설치형 서버 없이 동작하는 정적 PWA입니다.
- 서비스워커가 앱 셸 캐시, 버전 전환, SHA-256 무결성 감사·복구를 담당합니다.
- 모델 팩은 앱 셸과 분리된 전용 Cache Storage를 사용합니다.
- `src/app.js`의 미리보기 자원 소유권을 `src/app/preview-controller.js`로 분리했습니다.
- feedback UX는 staged loader의 shell 단계로 이동해 직접 시작 스크립트를 49개로 유지했습니다.

판정: 가져오기·설정·렌더에 이어 미리보기 오케스트레이션 경계가 분리됐고, 시작 성능 예산도 보존됐습니다. 분석 오케스트레이션은 다음 분리 대상입니다.

## 2. 성능

- 정지 화면 렌더는 controller 내부 RAF 하나로 batching합니다.
- 재생 RAF와 종료 감시 interval은 stop/dispose에서 함께 해제합니다.
- 실미디어 5회에서 JS heap은 4.927→5.475MiB였고 dispose 후 Object URL은 0개였습니다.
- 모델 캐시 dry-run은 응답 본문을 강제로 메모리에 읽지 않고 `Content-Length` 기반 추정만 수행합니다.
- 고아 캐시 정리 후 origin estimate를 다시 측정합니다.
- Chromium 프로세스 RSS는 772.680→871.439MiB였으나 워밍업·GPU/renderer/utility 캐시가 합산된 보조 지표이며 runtime error와 JS heap 잔류는 없었습니다.

판정: 반복 미리보기의 비동기 자원 경계와 모델 저장소 가시성이 강화됐습니다. 프로세스 RSS 장기 추세는 별도의 장시간 실기기 관찰이 필요합니다.

## 3. 기술

- Vanilla JavaScript, Cache Storage, IndexedDB, localStorage, Web Worker, MediaRecorder/captureStream 기반입니다.
- Preview Controller는 dependency injection factory로 생성되며 상태·DOM·렌더러·operation coordinator를 명시적으로 전달받습니다.
- 모델 캐시 검사는 전용 cache name과 same-origin synthetic prefix에 제한됩니다.
- 서비스워커 무결성 매니페스트는 최종 소스 기준 133개 자산으로 다시 생성했습니다.

## 4. 기능

확인 범위:

- 미디어 가져오기와 장시간 decode 메모리 사전 점검
- 오디오·모션 분석, 자동 컷, 추천
- 자막·스마트 리프레임·직접 크롭·키프레임
- 미리보기 재생·중단·오류 복구
- 프로젝트·세션 저장과 복구
- 렌더 큐 cancel/retry와 Object URL 정리
- 모델 설치·검증·quota·벤치마크·롤백·저장소 진단
- 서비스워커 업데이트·오프라인 셸·변조 복구

최종 결과: **259/259 통과, 실패 0건**. 세부 증빙은 `qa/QA_REPORT.md`에 기록했습니다.

## 5. 발견 문제와 조치

### 수정 완료: preview RAF·timer 소유권 혼재

- 위험: 재생 실패나 페이지 종료 시 비동기 작업 정리 누락 가능
- 조치: 별도 controller, 단일 teardown 경로, dispose 후 재예약 차단

### 수정 완료: 모델 고아 캐시 사전 확인 불가

- 위험: 자동 정리 시점 전에는 사용자가 정리 가능 항목과 용량을 알 수 없음
- 조치: dry-run inspection, storage diagnostics, 사용자 명시 수동 정리 UI

### 수정 완료: 신규 모듈로 시작 스크립트 예산 1개 초과

- 위험: 직접 시작 스크립트 49개 계약이 50개로 증가
- 조치: feedback UX를 shell 단계 지연 적재로 이동해 직접 시작 스크립트 49개 복구

### 수정 완료: 최종 변경 후 무결성 매니페스트 해시 불일치

- 위험: 서비스워커 설치·수동 복구에서 정상 파일을 손상으로 오인
- 조치: 최종 소스 기준 `asset-integrity.json`과 서비스워커 manifest hash 재생성, 변조 복구 회귀 통과

## 6. 예외·제한

- `Content-Length`가 없는 고아 캐시는 개수는 정확하지만 추정 용량이 0 또는 실제보다 작을 수 있습니다.
- Storage Estimate는 origin 전체 기준이며 모델 캐시 외 저장소도 포함합니다.
- headless Chromium은 물리 GPU 가속 여부와 모바일 브라우저 고유 동작을 확정하지 못합니다.
- 15→30→15분 전체 실미디어 증빙은 변경되지 않은 경로에 한해 기존 측정을 승계했습니다.

## 7. 남은 개선점

- `src/app.js` 분석 오케스트레이션 분리
- 모델 벤치마크 이력 그래프와 전원·발열 주석
- 화자 타임라인 직접 편집과 동시 발화 안정화
- 모바일 Safari·Samsung Internet 실기기 회귀
