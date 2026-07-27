# AI Shorts Studio v1.6.13 정밀 분석 보고서

## 1. 시스템

- 설치형 서버 없이 동작하는 정적 PWA입니다.
- 서비스워커가 앱 셸 캐시, 버전 전환, 무결성 복구를 담당합니다.
- 미디어 원본·프로젝트·모델 팩은 브라우저 로컬 경로에서 처리합니다.
- 기능 모듈은 초기 셸, 편집, 내보내기, Local AI 단계로 지연 적재됩니다.

판정: 구조 분리는 양호합니다. `src/app.js`가 약 125KB로 커서 장기적으로 오케스트레이션 분할이 필요합니다.

## 2. 성능

- 오디오 분석은 Worker 우선, stall·malformed message 시 메인 스레드 fallback을 사용합니다.
- 분석 캐시는 메모리와 IndexedDB 계층, TTL/LRU, quota 적응 정책을 사용합니다.
- Local AI 작업은 동시 실행 1개로 제한해 영상 분석·렌더와의 메모리 경쟁을 줄입니다.
- CSS ownership 감사 기준 selector-property 충돌 0, 동일값 중복 0, shadow 0을 유지합니다.
- 전체 QA는 255개로 한 번에 실행하면 환경에 따라 5분을 넘을 수 있어 샤드 실행을 추가했습니다.

판정: 런타임 성능 보호 장치는 충분합니다. QA 총 실행시간은 기능 오류가 아니라 운영 병목이었으며 v1.6.13에서 제어 가능해졌습니다.

실미디어 반복 감사에서는 5회 완주 기준 JS heap 4.94→5.48MiB, 회차별 원본+export URL 2개, 종료 후 활성 URL 0개를 확인했습니다. 20회 확장 감사는 도구의 5분 실행 한도에서 10회까지 동일 상한을 유지했으나 완주 결과가 아니므로 배포 증빙에는 포함하지 않습니다.

## 3. 기술

- Vanilla JavaScript, Cache Storage, IndexedDB, localStorage, Web Worker, MediaRecorder/captureStream 기반입니다.
- CSP는 same-origin과 loopback 연결만 허용합니다.
- 원격 CDN 런타임 의존 없이 배포되며 MediaPipe 모델 팩은 사용자가 로컬 설치합니다.
- 앱 소스에서 `eval`, `new Function`, `document.write` 사용은 확인되지 않았습니다.

판정: 로컬 우선·의존성 최소화 방향이 일관적입니다.

## 4. 기능

확인 범위:

- 미디어 가져오기와 메모리 사전 점검
- 오디오·모션 분석, 자동 컷, 추천
- 자막 파싱·적용
- 얼굴·화자 연결, 스마트 9:16 크롭, 직접 크롭, 키프레임
- 프로젝트 저장·가져오기, 세션 백업·복구
- 렌더 큐, 취소·재시도, 리소스 정리
- 서비스워커 업데이트·무결성·캐시 복구
- localhost Local AI provider와 직렬 작업 큐
- 비전 모델 팩 설치·검증·벤치마크·활성화·롤백

판정: 주요 사용자 흐름별 smoke와 브라우저 감사가 존재합니다. 전체 결정적 4개 샤드 기준 255/255 검사가 통과했습니다.

## 5. 엔진

- `operation-coordinator`: 장시간 작업의 소유권·취소
- `analysis-pipeline`: 오디오·모션 병렬 분석과 fallback
- `analysis-cache`: clone-safe 메모리/영구 캐시
- `performance-budget`: 장치별 분석·렌더 예산
- `render-queue`: bounded queue와 retry
- `vision-model-pack-manager`: 모델 저장·검증·runtime provider 관리

판정: 엔진 계약은 명시적입니다. 이번 수정은 비전 모델 저장 트랜잭션과 rollback 후보 소유권을 강화했습니다.

## 6. 발견 문제와 조치

### 수정 완료: 비트랜잭션 모델 설치

- 위험: 신규 저장 실패 전에 기존 비활성 팩이 삭제됨
- 영향: quota·Cache Storage 오류 시 데이터 손실과 부분 캐시
- 조치: 신규 완전 저장 후 기존 정리, 실패 시 staged 파일 rollback

### 수정 완료: backend 전환의 stale rollback

- 위험: 같은 모델의 backend 전환 실패가 과거 모델 롤백으로 연결
- 영향: 사용자가 의도하지 않은 모델 변경
- 조치: 현재 팩/실제 backend를 임시 last-known-good 후보로 사용

### 수정 완료: 반복 내보내기 Object URL 누적

- 위험: 지연 해제 시간 안에 렌더·다운로드를 반복하면 export URL이 회차마다 증가하고 종료 시 일부가 남음
- 영향: 장시간 편집 세션의 Blob 참조 유지와 메모리 회수 지연
- 조치: 새 export 전에 이전 URL을 해제하고 활성 URL을 1개로 제한, `pagehide`·`beforeunload`에서 전량 정리

### 수정 완료: QA 무제한 단일 실행

- 위험: 전체 시간이 길고 개별 command hang을 구분하기 어려움
- 영향: CI·인수인계에서 timeout 원인 추적 저하
- 조치: command timeout, range, match, shard, fail-fast, JSON report

## 7. 에러·버그·예외 처리

- Cache Storage 쓰기 예외: 부분 신규 파일 정리 후 명확한 오류
- localStorage 메타데이터 보존 실패: 설치 성공으로 가장하지 않고 오류
- 모델 활성화 실패: 검증된 이전 모델 또는 현재 모델의 정상 backend 복구
- 이전 모델도 손상: 자동 복구를 가장하지 않고 최종 오류
- Worker stall·malformed message: 종료 후 fallback
- 렌더 실패·취소: 단일 finish 경로에서 media state와 track 정리
- 반복 다운로드: 이전 export URL 교체 해제, 예약 해제, pagehide/beforeunload 최종 정리

## 8. 남은 개선점

- `src/app.js`를 import/analysis/preview orchestration 단위로 추가 분리
- 모델 팩 저장 전 `navigator.storage.estimate()` 기반 여유 공간 안내
- Cache Storage 고아 자산 주기 정리
- 실제 모바일 Safari·Samsung Internet 검증
- 복수 화자 동시 발화와 화자 타임라인 직접 편집
- 장기 benchmark 추세와 자동 재측정 정책
