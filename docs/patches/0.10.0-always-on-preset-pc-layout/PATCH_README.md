# SoriON AI 0.10.0 Always-on Preset Runtime & PC Three-Pane

기존 `0.9.9 CI Quality Hotfix` 프로젝트에 덮어쓰는 기능·안정성 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.10.0`인지 확인합니다.
5. 1024px 이상 화면에서 프로젝트 / 중앙 작업공간 / 프리셋 음성의 3분할이 보이는지 확인합니다.
6. Commit·Push 후 GitHub Actions의 API quality와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- 프리셋 미리듣기를 엔진 준비 전에도 내부 대기열에 유지하고 자동 재연결 뒤 재생합니다.
- 연결 실패는 1~15초 점진 재시도하며 새 프리셋 선택 시 이전 요청과 늦은 결과를 무효화합니다.
- 일반 작업 화면에서 API·Worker·GPU·엔진 주소·연결 여부와 인앱 엔진 안내를 숨깁니다.
- 활성 12초·백그라운드 45초 heartbeat, 60초 전체 점검과 focus·pageshow 자동 재검사를 적용합니다.
- PC 3분할 기준을 1024px로 낮추고 레이아웃 저장 키를 v2로 갱신해 좌우 패널을 기본 펼침으로 복구합니다.

## 삭제 파일

없습니다.
