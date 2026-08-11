# SoriON AI 0.11.9 Multi-Speaker Assist & Resume Generation

직전 GitHub Actions `Web quality`를 통과한 **0.11.8 Fast One-Flow & Safe Parallel Generation** 프로젝트에 덮어쓰는 정식 업데이트입니다.

## 적용

1. 저장소 루트에 패치 ZIP을 압축 해제하고 파일 덮어쓰기를 허용합니다.
2. Windows에서는 `APPLY_PATCH.cmd`, macOS·Linux에서는 `./APPLY_PATCH.sh`를 실행합니다.
3. dependency-free preflight가 `v0.11.9`와 Multi-Speaker/Resume/기존 engine·recovery 계약을 모두 통과하는지 확인합니다.
4. Commit·Push 후 GitHub Actions의 API quality와 Web quality가 녹색인지 확인합니다.

## 주요 변경

- 명확한 `화자: 대사` 전체 라인 형식에서 2명 이상 화자를 감지하고 화자별 voice mapping UI를 표시합니다.
- voice mapping은 자동 제안일 뿐이며 사용자가 확인 버튼을 누르기 전에는 실제 생성에 사용하지 않습니다.
- 화자별 대사를 clip별 generation option으로 변환해 기존 첫 음성 우선 + 최대 2-way bounded parallel로 생성합니다.
- 프로젝트 저장에 clip별 text·voiceId·voiceName을 보존해 다시 열어도 다중 화자 voice가 유지됩니다.
- 생성 중지 뒤 ready 음원을 보존하고 queued 대사만 `남은 대사 이어서 만들기`로 재개합니다.
- Multi-Speaker/Resume 전용 repository preflight 계약을 추가합니다.

## 삭제 파일

없습니다.
