# SoriON AI 0.9.7 Natural Playback Controls

기존 `0.9.6 Long-Run Reliability & Writer Safety` 프로젝트에 덮어쓰는 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.9.7`인지 확인합니다.
5. 준비된 음성의 `재생`을 누르면 버튼이 즉시 `일시정지`로 바뀌는지 확인합니다.
6. 다시 누르면 음성이 멈추고 버튼이 `재생`으로 돌아오는지 확인합니다.
7. Commit·Push 후 GitHub Actions와 배포를 확인합니다.

## 주요 변경

- 파일 음원과 Browser Speech의 재생 버튼을 실제 시작 이벤트보다 먼저 전환합니다.
- 준비 중 일시정지로 pending 재생을 취소합니다.
- 취소된 Browser Speech callback이 최신 버튼 상태를 덮지 못하게 run ID를 적용합니다.
- `aria-pressed`와 동적 접근성 이름을 추가합니다.
- 재생 중 버튼의 시각 상태와 회귀 테스트·preflight 계약을 추가합니다.

## 삭제 파일

없습니다.
