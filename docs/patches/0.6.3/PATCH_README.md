# SoriON AI 0.6.2 → 0.6.3 패치 안내

## 적용 조건

현재 프로젝트의 `package.json` 버전이 정확히 `0.6.2`일 때 사용한다.

## 적용 방법

1. 현재 변경사항을 커밋하거나 별도 백업한다.
2. 저장소의 `.git` 폴더는 유지한다.
3. 패치 ZIP을 저장소 최상위에 압축 해제한다.
4. 같은 이름의 파일은 모두 덮어쓴다.
5. 이번 패치에는 삭제 파일이 없으므로 별도 삭제 명령은 필요하지 않다.
6. `npm run quality:rules`를 실행한다.
7. GitHub에 Push한 뒤 Web quality, API quality, Pages 배포를 확인한다.

## 핵심 확인

- 음성이 없을 때는 하단 주요 메뉴만 보여야 한다.
- TTS 또는 복제 음원이 준비되면 플레이어가 나타나야 한다.
- 플레이어는 모바일과 PC 모두 주요 메뉴보다 위에 있어야 한다.
- Dock은 기존의 어두운 배경색 톤을 유지해야 한다.
- 플레이어 유무에 따라 본문 하단 여백이 자연스럽게 바뀌어야 한다.
- 상단 BUILD 표시는 `v0.6.3`이어야 한다.

## 권장 Git 작업

- 브랜치: `fix/adaptive-dock-player`
- 커밋: `fix: show linked player only when audio is ready`
