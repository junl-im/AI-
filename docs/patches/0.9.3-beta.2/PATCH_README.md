# SoriON AI 0.9.3-beta.2 Patch

기준: `0.9.3-beta.1 CI Hotfix 2`
목표: `0.9.3-beta.2 Resilient Lock Bootstrap & Selective STT Regeneration`

## 적용

1. 패치 ZIP의 내용을 기존 프로젝트 폴더에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS·Linux는 `APPLY_PATCH.sh`를 실행합니다.
3. GitHub Desktop에서 변경사항 전체를 Commit하고 Push합니다.
4. lock 생성이 registry timeout으로 실패하면 같은 Actions 실행에서 `Re-run failed jobs`를 실행합니다. 앞선 npm cache가 복원됩니다.
5. 성공한 `sorion-verified-lockfiles` artifact의 세 lock을 저장소에 복사해 커밋합니다.

패치 적용 스크립트는 누적 저장소에 남은 `public/sorion-icon.svg`도 다시 제거합니다.
