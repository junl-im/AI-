# SoriON AI 0.11.8 Fast One-Flow & Safe Parallel Generation

직전 GitHub Actions `Web quality`를 통과한 **0.11.7 One-Flow Dubbing UX + Web quality hotfix** 프로젝트에 덮어쓰는 정식 업데이트입니다.

## 적용

1. 저장소 루트에 패치 ZIP을 압축 해제하고 파일 덮어쓰기를 허용합니다.
2. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
3. dependency-free preflight가 `v0.11.8`과 One-Flow/engine/recovery 계약을 모두 통과하는지 확인합니다.
4. Commit·Push 후 GitHub Actions의 API quality와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- 첫 대사를 우선 생성·자동 재생하고 이후 대사를 최대 2개 bounded parallel로 생성합니다.
- 병렬 완료 순서와 실제 재생 순서를 분리해 원문 timeline 순서를 자동 복원합니다.
- 진행률·생성 중·대기·실패 수와 `생성 중지`를 One-Flow 카드에서 바로 확인합니다.
- SRT/VTT clipboard 자동 정리, `말하기 좋게 정리`, 현재 대본 `첫 문장 미리듣기`를 추가합니다.
- 생성 중지와 전체 비우기는 batch run token을 무효화하고 active 요청을 abort합니다.
- 제품 버전 승격 도구가 API version fixture까지 함께 갱신·검사합니다.

## 삭제 파일

없습니다.
