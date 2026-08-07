# SoriON AI 0.10.2 Recovery Soak & Managed Lock Interface

기존 `0.10.1 Approval Modularization & Operator Baselines` 프로젝트에 덮어쓰는 안정성 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.10.2`인지 확인합니다.
5. Commit·Push 후 GitHub Actions의 API quality, Worker quality와 Web quality가 녹색인지 확인합니다.
6. Actions 수동 실행에서 `runtime_soak_minutes=5`를 선택해 Worker 재시작 복구 증거를 확인합니다.

## 주요 변경

- API·Worker soak 결과를 이전 실행과 비교해 응답 P95, 성공률, 복구, 메모리와 열린 연결 회귀를 표시합니다.
- 검사 중 Worker를 실제로 종료·재기동하고 45초 안에 복구되는지 확인합니다.
- 계획된 재시작 구간의 실패 표본은 일반 장애와 분리해 중복 실패 판정을 막습니다.
- 승인 writer lease를 `WriterLeaseCoordinator` Protocol과 backend factory 뒤로 분리합니다.
- 1024·1280·1440px PC 3분할의 기본 폭을 회귀 테스트로 고정합니다.

## 삭제 파일

없습니다.
