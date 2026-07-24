# PATCH REPORT — AI 쇼츠 제작 스튜디오 v1.5.28

## 목표

v1.5.27에서 영구 분석 캐시의 이전 namespace가 일반 상태 조회·새 기록·정리 과정에서 자동 삭제되어, 사용자가 용량과 계약 정보를 확인하거나 필요한 namespace만 선택 정리할 수 없던 문제를 해결했습니다.

## 원인 분석

`src/engine/analysis-cache.js`의 영구 캐시 정리 경로가 현재 namespace TTL/LRU 정리와 이전 namespace 제거를 한 동작으로 처리했습니다. 이 함수가 초기 상태 갱신과 새 캐시 쓰기에도 호출되어, 진단 UI가 이전 namespace 정보를 읽기 전에 레코드가 사라졌습니다. 또한 namespace 단위 상태·삭제 API와 유지보수 이력 모델이 없어 사용자 선택을 연결할 수 없었습니다.

## 적용 내용

### 1. 이전 namespace 보존

- 일반 정리에서는 현재 namespace의 만료·LRU·바이트 한도만 처리합니다.
- 이전 namespace 전체 제거는 명시적 `cleanupLegacyNamespaces` 경로에만 남겼습니다.
- 새 캐시 기록과 상태 갱신이 이전 namespace를 자동 파괴하지 않습니다.

### 2. 개인정보 비노출 namespace 상태

- 현재·이전 namespace별 항목 수, 추정 바이트, 마지막 접근 시각, 계약·앱 버전, 분석 tier를 집계합니다.
- 현재 namespace만 원문을 반환하고 이전 namespace는 이중 FNV 기반 16자리 토큰으로만 식별합니다.
- 파일명·경로·원시 캐시 키·분석 결과·이전 namespace 원문은 UI와 이력에 포함하지 않습니다.

### 3. 선택 namespace 정리

- 여러 이전 namespace 토큰을 한 번에 전달해 해당 레코드만 삭제합니다.
- 현재 namespace 토큰, 알 수 없는 토큰, 중복 토큰은 안전하게 제외합니다.
- 삭제된 namespace·항목 수·추정 바이트를 결과와 통계에 반영합니다.

### 4. 유지보수 이력

- 단일/다중 항목 삭제, 조건별 무효화, 선택 namespace 삭제, 현재 캐시 비우기, 자동 TTL/LRU/quota 정리를 기록합니다.
- 데이터베이스별 localStorage 키에 최대 20개를 최신순으로 보존합니다.
- 저장소 오류는 best-effort로 처리해 분석 캐시 본 기능을 중단하지 않습니다.

### 5. 저장소 진단 화면

- 현재 namespace 보호 상태와 이전 namespace 목록을 카드로 표시합니다.
- 이전 namespace 다중 선택과 `선택 namespace 정리` 작업을 추가했습니다.
- 최근 정리 이력을 작업 유형·시각·삭제량 중심으로 표시합니다.
- 정리 후 기존 캐시 통계·namespace 상태·이력을 동시에 새로고침합니다.

## 주요 변경 파일

- `src/engine/analysis-cache.js`
- `src/engine/engine-kernel.js`
- `src/config/app-runtime-config.js`
- `src/ui/storage-health-panel.js`
- `assets/css/storage-health-panel.css`
- `qa/analysis_cache_namespace_history_smoke.js`
- `qa/storage_health_panel_smoke.js`
- `package.json`, `index.html`, `sw.js`, `asset-integrity.json`

## 검증 결과

- 자동 QA: **212/212 통과**
  - 검사 0~180: 181개 연속 통과
  - 검사 181~211: 31개 연속 통과
  - 실패: 0개
- 신규 namespace/history 회귀 검사 통과
- 기존 선택 무효화·quota·항목 삭제 회귀 검사 통과
- 저장소 진단 패널 DOM·상호작용 회귀 검사 통과
- Chromium 4개 viewport: JavaScript 오류·Promise 거절·콘솔 오류 **0건**, 가로 overflow **0px**
- CSS ownership: conflict 0, same-value duplicate 0, shadowed declaration 0, `!important` 593
- 서비스워커 install·activate·이전 캐시 정리·offline navigation 통과
- GPU/media 두 모드 1280×720 H.264/AAC 디코딩, 62프레임·drop 0 통과

## 감사 자료

### v1.5.28 신규 실행

- `qa/runtime-browser-audit-v1.5.28.json`
- `qa/runtime-css-ownership-v1.5.28.json`
- `qa/runtime-service-worker-lifecycle-v1.5.28.json`
- `qa/runtime-gpu-media-capability-v1.5.28.json`

### 변경 범위 밖이라 명시적으로 상속

- `qa/runtime-interaction-state-v1.5.28.json` ← v1.5.27
- `qa/runtime-process-memory-v1.5.28.json` ← v1.5.27
- `qa/runtime-structure-priority-v1.5.28.json` ← v1.5.27
- `qa/runtime-structure-priority-probe-v1.5.28.json` ← v1.5.27
- `qa/runtime-long-video-stability-v1.5.28.json` ← v1.5.27, 실제 장시간 실행 근거 v1.5.24

상속 자료에는 `inheritedArtifactFrom`과 이유를 기록했습니다. structure priority probe는 현재 환경에서 재실행을 시도했으나 실행 제한을 넘겨 완료되지 않았고, 이번 패치가 해당 4개 구조 owner stylesheet를 변경하지 않아 기존 근거를 사용했습니다.

## 알려진 제한

- 이전 namespace는 사용자가 정리하기 전까지 IndexedDB 공간을 차지합니다.
- localStorage 유지보수 이력은 사이트 데이터 삭제·저장 차단·quota 상황에서 보존되지 않을 수 있습니다.
- namespace 토큰은 표시·선택용 비식별 값이며 원문 복구 기능이 아닙니다.
- headless Chromium은 실제 모바일 브라우저 다운로드 관리자와 물리 GPU 가속을 완전히 대체하지 않습니다.

## 다음 패치 제안

1. 옵션 signature별 캐시 필터와 namespace 저장 비용 추세
2. 서비스워커 실패 자산별 상세 원인·수동 롤백
3. 중요 백업 보존 개수와 복구 이력 편집
4. 모바일 Safari·Samsung Internet·물리 GPU 장시간 반복 검증
