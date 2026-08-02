# SoriON AI 0.9.3-beta.3 Engine Heartbeat 5.1 Web Quality Hotfix

기준: `0.9.3-beta.3 · Engine Heartbeat 5`

이 Hotfix는 GitHub Actions Web quality에서 발생한 `HomePage.test.tsx` Testing Library
중복 요소 실패를 수정합니다. 데스크톱 Voice Drawer와 모바일 Voice Settings Sheet가 함께
DOM에 존재하므로, `밝게` 버튼 검증을 전역 화면이 아니라 실제 대상인 `음성 설정` dialog
내부로 제한합니다.

## 적용

1. Engine Heartbeat 5 저장소의 미커밋 변경을 백업하거나 커밋합니다.
2. Hotfix ZIP을 저장소 루트에 바로 압축 해제해 덮어씁니다.
3. Windows는 `APPLY_PATCH.cmd`, macOS·Linux는 `./APPLY_PATCH.sh`를 실행합니다.
4. GitHub Desktop에서 변경 파일을 확인하고 Commit·Push합니다.
5. GitHub Actions의 `Web quality`가 녹색인지 확인합니다.

## 검증

- Repository preflight 11/11 통과
- 강화된 Web 테스트 계약 통과
- 런타임 제품 코드 변경 없음

샌드박스에서는 내부 npm registry 미러 누락(404)과 외부 registry DNS timeout으로 Vitest
전체 실행이 불가능했습니다. 최종 Vitest·lint·typecheck·build 판정은 GitHub Actions에서 수행합니다.
