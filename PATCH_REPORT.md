# PATCH REPORT — AI 쇼츠 제작 스튜디오 v1.5.29

## 점검 결론

기능·기술·성능 점검에서 가장 큰 실제 결함은 자동 컷 설정이 분석 캐시 키에 포함되지 않았다는 점이었습니다. 동일 파일에서 장면 감도, 최소 클립 길이 같은 분석 옵션을 바꿔도 이전 `autoCuts` 결과가 캐시 적중으로 재사용될 수 있었습니다. 운영 측면에서는 옵션별 저장 비용을 구분할 수 없었고, 저장소 진단 화면 한 번을 갱신하는 과정에서 IndexedDB 전체 목록을 여러 번 읽는 구조였습니다.

이번 패치는 stale 결과 차단, signature별 선택 정리, namespace 저장 비용 추세, 진단 스캔 감축을 하나의 `v1.5.29` 업그레이드로 묶었습니다.

## 원인 분석

### 1. 분석 결과와 캐시 키의 계약 불일치

기존 키는 파일 지문, 분석 품질 프로필, namespace를 포함했지만 자동 컷 옵션은 포함하지 않았습니다. 파일과 품질 tier가 같으면 옵션을 변경해도 같은 키가 만들어질 수 있었습니다.

### 2. 옵션 읽기 시점 분산

캐시 키를 계산하는 경로와 실제 분석 파이프라인이 각자 설정을 읽으면, 사용자 변경이나 비동기 상태 전환 사이에 signature와 실제 결과가 달라질 여지가 있었습니다.

### 3. 중복 전체 스캔

정책 갱신, 캐시 항목 목록, namespace 상태가 각각 레코드 전체를 읽어 진단 패널 새로고침 하나가 최대 세 번의 IndexedDB 전체 스캔을 만들 수 있었습니다.

### 4. 저장 비용 가시성 부족

namespace 총량은 볼 수 있었지만 어떤 옵션 signature가 공간을 차지하는지, 용량이 시간에 따라 증가하는지 감소하는지는 확인할 수 없었습니다.

## 적용 내용

### 1. 안정적 option signature

- 객체 키 순서와 무관한 canonical serialization을 추가했습니다.
- 분석 옵션은 되돌릴 수 없는 16자리 비식별 signature로 변환합니다.
- signature를 메모리·영구 분석 캐시 키에 포함합니다.
- 옵션 한 값이 달라지면 다른 키를 사용하고, 의미상 같은 객체는 키 순서가 달라도 같은 signature를 사용합니다.
- 파일명·경로·원시 옵션 JSON은 UI·진단·이력에 노출하지 않습니다.

### 2. 키와 분석 결과의 단일 옵션 스냅샷

- 분석 시작 시 자동 컷 옵션을 한 번만 읽습니다.
- 같은 스냅샷으로 signature를 만들고 실제 분석 파이프라인에도 전달합니다.
- 이후 분석 결과에 영향을 주는 옵션을 추가할 때는 반드시 이 signature 입력에 함께 포함해야 합니다.

### 3. 분석 캐시 계약 v3

- `ANALYSIS_CACHE_CONTRACT_VERSION`을 `3`으로 갱신했습니다.
- 기존 v2 캐시는 현재 분석에 적중하지 않고 이전 namespace로 분리됩니다.
- 이전 namespace는 자동 삭제하지 않으며 v1.5.28의 선택 정리 흐름을 그대로 사용합니다.

### 4. signature별 상태와 선택 정리

- signature별 항목 수, 추정 바이트, 마지막 접근 시각을 집계합니다.
- 저장소 진단 화면에 signature 선택 목록과 `signature 캐시 정리` 작업을 추가했습니다.
- 선택한 signature 그룹만 삭제하며 다른 옵션 그룹과 현재 namespace 보호 계약은 유지합니다.

### 5. namespace 저장 비용 추세

- 현재·이전 namespace의 총 항목 수와 추정 바이트를 최대 48개 시점으로 보존합니다.
- 직전 표본과 저장 상태가 같으면 중복 기록하지 않습니다.
- 화면에는 현재 사용량, 직전 대비 증감, 최근 표본을 표시합니다.
- 추세 데이터에는 namespace 원문, 파일 정보, 캐시 키, 분석 결과가 포함되지 않습니다.

### 6. 진단 전체 스캔 감축

- 영구 캐시 전체 읽기 결과에서 entries, namespace, signature 그룹을 한 번에 만듭니다.
- `maintenanceSnapshot()`이 항목·namespace·signature·추세·유지보수 이력·통계를 결합해 반환합니다.
- 정책 정리 뒤 UI는 추가 전체 스캔 없이 캐시된 스냅샷을 재사용합니다.
- 이전 새로고침 경로의 최대 3회 전체 스캔을 1회로 줄였으며, 회귀 검사는 스냅샷 재조회 시 `readAllScans`가 증가하지 않는 것을 확인합니다.

## 주요 변경 파일

- `src/engine/analysis-cache.js`
- `src/engine/engine-kernel.js`
- `src/config/app-runtime-config.js`
- `src/ui/storage-health-panel.js`
- `assets/css/storage-health-panel.css`
- `qa/analysis_cache_signature_trend_smoke.js`
- `qa/storage_health_panel_smoke.js`
- `package.json`, `index.html`, `sw.js`, `asset-integrity.json`

## 검증 결과

- 자동 QA: **213/213 통과**
  - 검사 0~171: 172개 통과
  - 검사 172~190: 19개 통과
  - 검사 191~212: 22개 통과
  - 실패: 0개
- 신규 회귀: stable signature, 옵션 변경 키 분리, 단일 옵션 스냅샷, signature 그룹 선택 정리, 저장 비용 추세, 캐시된 진단 스냅샷 통과
- Chromium 4개 viewport: JavaScript 오류·Promise 거절·콘솔 오류 **0건**, 가로 overflow **0px**
- CSS ownership: 연결 CSS 46개, 전체 CSS 47개, conflict 0, same-value duplicate 0, shadowed declaration 0, `!important` 593
- 서비스워커 install·activate·이전 앱 셸 캐시 정리·offline navigation 통과
- GPU/media: acceleration-requested·software-forced 모두 1280×720 30fps H.264/AAC 62프레임 디코딩, dropped frame 0
- 앱 셸 무결성: 자산 119개, manifest와 서비스워커 내장 해시 일치

단일 `npm test` 실행은 환경의 출력·실행 제한 전에 171번 검사까지 통과한 뒤 종료되어, 전체 목록을 세 구간으로 나눠 동일 명령을 실행했습니다. 모든 213개 검사가 빠짐없이 통과했습니다.

## 감사 자료

### v1.5.29 신규 실행

- `qa/runtime-browser-audit-v1.5.29.json`
- `qa/runtime-css-ownership-v1.5.29.json`
- `qa/runtime-interaction-state-v1.5.29.json`
- `qa/runtime-service-worker-lifecycle-v1.5.29.json`
- `qa/runtime-gpu-media-capability-v1.5.29.json`

### 변경 범위 밖이라 명시적으로 상속

- `qa/runtime-process-memory-v1.5.29.json` ← v1.5.28
- `qa/runtime-structure-priority-v1.5.29.json` ← v1.5.28
- `qa/runtime-structure-priority-probe-v1.5.29.json` ← v1.5.28
- `qa/runtime-long-video-stability-v1.5.29.json` ← v1.5.28, 실제 장시간 실행 근거 v1.5.24

상속 JSON에는 원본 파일과 사유를 기록했습니다. 이번 변경은 분석 캐시·저장소 진단 경로이며 장시간 렌더, 프로세스 메모리 소유 경로, 구조 우선순위 대상 4개 스타일시트를 변경하지 않았습니다.

## 알려진 제한

- 저장 비용은 레코드 직렬화 기반 추정치이며 브라우저 IndexedDB의 실제 디스크 오버헤드와 다를 수 있습니다.
- 추세와 유지보수 이력은 best-effort localStorage이므로 사이트 데이터 삭제·저장 차단·quota 오류에서 손실될 수 있습니다.
- 옵션 signature는 비교·선택용 비식별 값이며 옵션 원문을 복원할 수 없습니다.
- 향후 분석 결과에 영향을 주는 새 옵션이 추가되면 signature 입력 계약도 반드시 갱신해야 합니다.
- 실제 모바일 Safari·Samsung Internet 다운로드 관리자와 물리 GPU 장시간 동작은 실기기 검증이 필요합니다.

## 다음 패치 제안

1. 서비스워커 실패 자산별 상세 원인과 수동 롤백
2. 중요 백업 보존 개수 설정과 복구 이력 편집
3. 현재 namespace 저장 비용 예측과 자동 경고 임계값
4. 모바일 Safari·Samsung Internet·물리 GPU 장시간 반복 검증
