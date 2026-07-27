# QA Report v1.6.13

## 등록 품질 게이트

- 총 검사: 255개
- 신규 검사: QA runner controls, 모델 팩 transactional install
- 현재 릴리스 실미디어 감사: 반복 렌더·다운로드 Object URL/힙 안정성
- 실행 방식: 결정적 4개 샤드
- 검사별 기본 timeout: 180초

## 신규 회귀 범위

- Cache Storage 중간 실패 시 기존 모델 팩 3개 inventory 유지
- 부분 저장 신규 캐시 파일 제거
- 활성 모델 선택 유지
- 동일 모델 backend 전환 실패 시 마지막 정상 backend 복구
- backend 복구 후 이전 모델 롤백 대상 유지
- QA range/match/shard/list/report/timeout 제어
- 반복 내보내기 중 활성 export Object URL 1개 이하
- pagehide/beforeunload dispose 후 Object URL 0개
- 현재 릴리스 실미디어 5회 완주: 생성 URL 10개/해제 10개, dispose 활성 0개
- 20회 확장 시도: 5분 실행 한도에서 10회까지 오류·누적 없이 진행, 완주 아티팩트에는 미사용

## 전체 시스템 기준

- Chromium 데스크톱·소형 노트북·태블릿·모바일 런타임 오류: 0 목표
- 콘솔 오류: 0 목표
- 가로 overflow: 0 목표
- CSS selector-property 충돌: 0
- 동일값 중복: 0
- shadow 선언: 0
- `!important`: 593 ceiling 유지

전체 결정적 4개 샤드 결과는 **255/255 통과, 실패 0건**입니다. 상세 결과는 `qa/qa-run-final-summary.json`과 `qa/qa-run-shard-1.json`~`4.json`에 기록했습니다. 패키지 SHA-256은 최종 전달 내역에서 제공합니다.
