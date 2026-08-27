# 0.11.35 R2 → R3 Chromium CI Runner Hotfix

기준: `0.11.35 R2 · Web Quality Syntax Hotfix`
대상: `0.11.35 R3 · Chromium CI Runner Hotfix`

저장소 루트에 덮어쓴 뒤 GitHub Actions Web quality를 재실행합니다. 삭제 대상 파일은 없습니다.

핵심 변경은 visual Chromium bootstrap을 `--remote-debugging-port=0` + `DevToolsActivePort` 방식으로 바꾸고, 실패 시 child process를 강제 정리하는 것입니다.
