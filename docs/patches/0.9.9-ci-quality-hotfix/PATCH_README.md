# SoriON AI 0.9.9 CI Quality Hotfix

기존 `0.9.8 Quality Gate Compatibility` 프로젝트에 덮어쓰는 CI 품질 복구 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.9.9`인지 확인합니다.
5. Commit·Push 후 GitHub Actions의 API quality와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- 승인 서비스의 first-party import를 Ruff isort 순서로 재정렬합니다.
- 플레이어 테스트에서 렌더 초기 `pause()` 호출과 사용자 일시정지 호출을 분리합니다.
- compatibility·playback preflight가 같은 회귀를 다시 차단합니다.
- 실제 플레이어의 source 초기화·재생·일시정지 로직은 변경하지 않습니다.

## 삭제 파일

없습니다.
