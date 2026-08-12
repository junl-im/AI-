# NEXT UPDATE

현재 기준: `0.11.11 · Mobile Studio Flow & Natural Voice Playback`

## 목표 버전

`0.11.12 · Editing History & Engine Soak Polish`

### 우선순위

1. Timeline 이동 1회 Undo를 text/voice/split/delete까지 포함하는 bounded Undo/Redo history로 확장합니다.
2. 화자 mapping을 다시 열고 자주 쓰는 화자-목소리 조합을 프로젝트 단위로 재사용하는 흐름을 검토합니다.
3. 긴 다중 화자 대본에서 2-way parallel, engine switching, 취소/재개를 장시간 soak해 성공률·P95 지연·switching 빈도를 기록합니다.
4. 모바일 360/390/430px와 PC 1024/1280/1440px에서 Dock/Player, voice sheet, composer keyboard, horizontal timeline의 실제 Chromium layout을 확인합니다.
5. 실제 승인 음성 자료가 준비되면 preset별 상황 적합도와 권장 speed/pitch 범위를 사람 청취 evidence로 조정합니다.
6. 승인 Chromium baseline PNG와 SHA manifest가 확보된 경우에만 pixel baseline을 CI 필수 gate로 승격합니다.

## 0.11.11에서 고정한 결정

- 홈과 설정/품질 화면의 주요 Dock 접근 경로를 모바일에서 일관되게 유지합니다.
- One-Flow에는 현재 목소리 하나만 표시하고 전체 목록은 Sheet에서 비교합니다.
- 미리듣기는 선택을 변경하지 않으며 대본 추천도 자동 적용하지 않습니다.
- 모바일 타임라인은 세로 카드 스택으로 되돌리지 않고 실제 좌→우 시간축을 유지합니다.
- 생성 음성의 재생 요청과 플레이어 버튼 상태는 같은 store state를 사용합니다.
