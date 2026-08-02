# Engine Heartbeat 5.2.1 Focus Return Hotfix

기준본은 `0.9.3-beta.3 · Engine Heartbeat 5.2 · UI/UX Polish`입니다.

1. 패치 ZIP 내용을 저장소 루트에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.
3. Commit·Push 후 GitHub Actions의 `Web quality`를 재실행합니다.
4. `DubbingStudioHeader` 테스트와 `useModalDialog.ts` annotation이 사라졌는지 확인합니다.

이 패치는 런타임 UI 모양이나 데이터 계약을 바꾸지 않고 확인창 닫힘 뒤 초점 복귀와 Hooks 경고만 수정합니다.
