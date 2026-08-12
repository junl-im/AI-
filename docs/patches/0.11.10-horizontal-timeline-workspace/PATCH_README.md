# SoriON AI 0.11.10 Horizontal Timeline Workspace

직전 GitHub Actions `Web quality`를 통과한 **0.11.9 Multi-Speaker Assist & Resume Generation + Type/Visual Fixture hotfix** 프로젝트에 덮어쓰는 정식 업데이트입니다.

## 적용

1. 저장소 루트에 패치 ZIP을 압축 해제하고 파일 덮어쓰기를 허용합니다.
2. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
3. dependency-free preflight가 `v0.11.10`, PC horizontal timeline, 기존 Multi-Speaker/Resume/engine/recovery 계약을 모두 통과하는지 확인합니다.
4. Commit·Push 후 GitHub Actions의 API quality와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- PC 타임라인의 ruler·clip·playhead를 같은 좌→우 time-to-pixel geometry에 배치합니다.
- 클립 폭은 실제 재생 길이에 비례하고 zoom은 초당 픽셀 값에 직접 반영됩니다.
- 트랙 안의 클립을 얇은 horizontal strip으로 바꾸고 상세 대사 수정은 선택 클립 빠른 편집기에 집중합니다.
- 트랙 배경/눈금은 click·drag seek, 클립 click/drag는 selection·reorder를 담당합니다.
- 모바일/좁은 화면의 기존 세로형 편집은 유지합니다.

## 삭제 파일

없습니다.
