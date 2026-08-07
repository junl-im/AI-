# SoriON AI 0.11.2 Batch Recovery UX & Adaptive Engine Routing

기준 버전은 **0.11.1 Visual Regression & Safe Batch Voice Editing**입니다.

## 적용 내용

- 일괄 재생성 결과 성공·실패·건너뜀 요약
- 실패 클립 자동 선택 및 실패만 즉시 재시도
- 대사 전체 / 실패만 빠른 선택
- circuit open 전 최근 실패의 짧은 auto soft-degrade
- half-open 단일 probe를 우선하는 복구 순서 유지
- Engine Doctor / Quality Lab의 자동 선택 감점·우회 시간·사유 표시
- `SORION_ENGINE_SOFT_DEGRADE_SECONDS` 설정 및 dependency-free 회귀 계약

## 적용

기존 0.11.1 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

soft-degrade는 최근 실패에 대한 임시 auto 선택 신호이며 음질 benchmark나 영구 장애 판정이 아닙니다. 명시적 엔진 선택과 기존 circuit half-open 복구는 유지됩니다.
