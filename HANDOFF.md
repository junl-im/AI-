# HANDOFF v1.6.13 Transactional Model Pack Safety

- 앱 버전: `1.6.13`
- build key: `1.6.13-transactional-model-pack-qa-controls`
- 기준 릴리스: `v1.6.12`
- 필수 결과 형식: `DELIVERY_RULES.md`

## 구현 내용

### Update Sentinel

Update Sentinel은 서비스워커 업데이트 감시, 이전 앱 셸 캐시 정리, 버전·캐시·엔진 진단 복사를 계속 담당합니다. v1.6.13 build key 변경으로 기존 v1.6.12 셸과 새 셸을 명확히 분리합니다.

### 모델 팩 설치 트랜잭션

기존 구현은 최대 팩 수에 도달하면 신규 팩 저장 전에 오래된 비활성 팩을 제거했습니다. Cache Storage 쓰기 또는 브라우저 quota 오류가 중간에 발생하면 기존 팩이 먼저 사라지고 신규 팩은 불완전하게 남을 수 있었습니다.

v1.6.13은 다음 순서로 변경했습니다.

1. 설치 파일 allowlist, 크기, SHA-256을 먼저 확인합니다.
2. 신규 팩 파일을 Cache Storage에 모두 저장합니다.
3. 저장 실패 시 이번 시도에서 기록한 신규 파일만 정리합니다.
4. 모델 팩 메타데이터가 실제로 localStorage에 남았는지 재확인합니다.
5. 신규 팩이 완전히 커밋된 뒤에만 오래된 비활성 팩 캐시를 정리합니다.

### 마지막 정상 backend 복구

같은 모델에서 GPU→CPU 또는 CPU→GPU로 전환할 때 새 backend가 실패하면, 현재 모델과 실제 실행 중 backend를 임시 복구 후보로 사용합니다. 이전 모델 롤백 슬롯은 덮어쓰지 않으므로 수동 모델 롤백 기능도 유지됩니다.

### 다운로드 Object URL 수명주기

실미디어 반복 내보내기 감사에서 JS 힙은 안정적이었지만 export Object URL이 회차별로 누적되는 경로를 확인했습니다. v1.6.13은 새 내보내기 직전에 이전 다운로드 URL을 해제해 활성 export URL을 1개로 제한하고, 예약 해제와 `pagehide`·`beforeunload` 최종 정리를 동일한 소유권 맵에서 처리합니다.

### QA 실행 제어

`qa/run_all_checks.js`는 다음 옵션을 지원합니다.

- `--from`, `--to`: 검사 인덱스 범위
- `--match`: 명령 문자열 검색
- `--shard part/total`: 결정적 분할 실행
- `--timeout-ms`: 검사별 최대 실행 시간
- `--fail-fast`: 첫 실패에서 중단
- `--report`: JSON 결과 보고서 저장
- `--list`: 실행 대상만 출력

## 검수 순서

1. `node qa/qa_runner_controls_smoke.js`
2. `node qa/vision_model_pack_transaction_smoke.js`
3. `node qa/vision_model_pack_performance_rollback_smoke.js`
4. `node qa/download_object_url_lifecycle_smoke.js`
5. `python3 qa/run_heap_stability.py --cycles 5` 후 `node qa/heap_stability_smoke.js`
6. 전체 QA를 4개 샤드로 실행
7. Chromium 화면·비전 모델·서비스워커·GPU/media·메모리 감사 확인
8. 앱 셸 `asset-integrity.json` 재생성 및 검사
9. 통파일 ZIP 생성
10. v1.6.12 기준 덮어쓰기 패치 ZIP 생성
11. 패치 적용본과 통파일의 포함 파일 SHA-256 비교

## 알려진 제한

- 성능 수치는 브라우저·GPU 드라이버·전원 상태에 따라 달라질 수 있습니다.
- 실제 모델/WASM 바이너리는 배포 ZIP에 포함하지 않습니다.
- Cache Storage 자체가 완전히 사용할 수 없는 브라우저에서는 모델 팩 설치를 지원하지 않습니다.
- localStorage가 차단되면 신규 팩 파일을 저장했더라도 설치 메타데이터 확인 단계에서 실패로 처리합니다.
- 실제 모바일 Safari와 Samsung Internet은 실기기 추가 검증 대상입니다.
- Chromium 자동화 도구에서 Node `url.parse()` deprecation 경고가 보일 수 있으나 앱 런타임 코드 경고는 아닙니다.
- 현재 릴리스의 실미디어 힙 감사는 5회 완주 결과를 배포 게이트로 사용합니다. 20회 재실행은 명령 제한 5분 안에 10회까지 오류 없이 진행됐지만 완주 아티팩트로 채택하지 않았습니다.

## 다음 작업

- 모델 팩 저장 공간 사전 추정과 quota 부족 안내
- 모델 벤치마크 장기 추세 및 자동 재측정 정책
- 복수 화자·동시 발화 안정화
- 화자 타임라인 직접 편집
- 모바일 Safari·Samsung Internet 실기기 회귀
