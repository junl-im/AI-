# SoriON AI 0.9.5 Benchmark Baseline & Privacy-Safe Audit Bundle

기존 `0.9.4 Visible Version Sync` 기준 프로젝트에 덮어쓰는 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.9.5`인지 확인합니다.
5. Quality Lab에서 benchmark 기준선 상태와 `개인정보 제외 감사 JSON` 다운로드를 확인합니다.
6. GitHub Desktop에서 Commit·Push 후 GitHub Actions와 배포를 확인합니다.

## 주요 변경

- 총 10건 이상인 동일 실행 그룹에서 최초 5건과 최근 5건을 비중첩 비교합니다.
- 첫 음성 P95, RTF P95, 실패율, final handoff P95를 기준선과 비교합니다.
- 자동 결과는 `표본 부족`, `안정`, `주의`, `회귀`로 표시됩니다.
- 감사 JSON은 실제 음원, 비밀키, 서명값, 사람 식별자와 GPU 원문을 포함하지 않습니다.
- checksum은 변조 탐지용이며 전자서명 또는 법적 증거로 표현하지 않습니다.

## 삭제 파일

없습니다.
