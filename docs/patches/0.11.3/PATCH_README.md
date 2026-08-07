# SoriON AI 0.11.3 Failure-Guided Editing & Adaptive Performance Routing

기준 버전은 **0.11.2 Batch Recovery UX & Adaptive Engine Routing**입니다.

## 적용 내용

- 일괄 실패를 엔진·프리셋·연결·취소·기타로 분류
- 실패 원인 그룹별 선택 재시도와 빠른 재시도 3회 상한
- 최근 표본 EWMA 안정도·지연을 이용한 auto 엔진 성능 감점
- 최소 4개 표본, 기본 120초 TTL 관찰창
- explicit engine과 circuit cooldown/half-open 복구 우선순위 유지
- Engine Doctor / Quality Diagnostics의 soft-degrade와 성능 감점 표시 분리

## 적용

기존 0.11.2 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

성능 감점은 음질 점수나 영구 장애 판정이 아니라 현재 프로세스의 auto 선택 보조 신호이며 관찰창이 지나면 자동 소멸합니다.
