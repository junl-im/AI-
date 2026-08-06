# SoriON AI 0.9.6 Long-Run Reliability & Writer Safety

기존 `0.9.5 Benchmark Baseline & Privacy-Safe Audit Bundle` 프로젝트에 덮어쓰는 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.9.6`인지 확인합니다.
5. Quality Lab에서 `개인정보 제외 감사 ZIP` 다운로드를 확인합니다.
6. GitHub Actions 수동 실행에서 `runtime_soak_minutes`를 5·30·60분 중 선택할 수 있습니다.
7. Commit·Push 후 일반 CI와 배포를 확인합니다.

## 주요 변경

- 승인·재서명·롤백에 SQLite writer lease와 증가하는 fencing token을 추가했습니다.
- 만료된 writer는 실제 manifest 쓰기 직전에 차단됩니다.
- API·Worker soak가 성공률, 지연 P95, 중단·복구, 메모리와 열린 파일·연결 증가를 기록합니다.
- 개인정보 제외 감사 자료를 JSON, 파일별 SHA-256 manifest와 README가 포함된 ZIP으로 제공합니다.

## 운영 경계

SQLite lease는 같은 DB 파일을 안전하게 공유하는 프로세스 범위입니다. 일반 네트워크 파일시스템이나 독립 서버의 진정한 분산 lock으로 간주하지 않습니다.

## 삭제 파일

없습니다.
