# SoriON AI 0.9.8 Quality Gate Compatibility

기존 `0.9.7 Natural Playback Controls` 프로젝트에 덮어쓰는 품질 게이트 복구 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
4. 첫 화면 버전이 `v0.9.8`인지 확인합니다.
5. Commit·Push 후 GitHub Actions의 Ruff와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- Python collection protocol import를 `collections.abc`로 이동합니다.
- quoted future annotation을 제거하고 lock timeout 예외 원인을 보존합니다.
- 모바일 음성 설정에 현재 선택 엔진 capability를 전달합니다.
- 의도적인 부분 TypeScript fixture는 `unknown`을 경유해 변환합니다.
- 같은 오류의 재유입을 dependency-free preflight로 차단합니다.

## 삭제 파일

없습니다.
