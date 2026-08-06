# SoriON AI 0.10.1 Approval Modularization & Operator Baselines

기존 `0.10.0 Always-on Preset Runtime & PC Three-Pane` 프로젝트에 덮어쓰는 구조·성능 기준선 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.10.1`인지 확인합니다.
5. Quality Lab에서 자동 기준선과 운영자 확정 기준선이 별도로 표시되는지 확인합니다.
6. Commit·Push 후 GitHub Actions의 API quality와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- 승인 서비스를 canonical hash·diff, 원자 저장·history, 증거 갱신 대기열 모듈로 분리합니다.
- 기존 thread lock, SQLite lease·fencing, OS file lock, 적용 직전 재검증과 원자 교체 순서를 유지합니다.
- 동일 엔진·모델 digest·장치·프리셋의 최근 5건을 운영자 확정 기준선으로 저장합니다.
- 자동 최초5/최근5 기준선과 운영자 기준선을 별도로 평가합니다.
- 운영자 기준선 확정·교체·폐기 이력을 JSONL로 보존합니다.

## 삭제 파일

없습니다.
