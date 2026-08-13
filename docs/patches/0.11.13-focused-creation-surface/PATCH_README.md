# 0.11.13 Focused Creation Surface Patch

기준: **SoriON AI 0.11.12 · Editing History, Speaker Memory & Engine Routing Trace**

프로젝트 루트에 ZIP 내용을 덮어쓴 뒤 Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.

이번 패치는 기능을 줄이지 않고 기본 제작 화면의 정보 밀도를 낮춥니다.

- 중심 흐름: `목소리 선택 → 텍스트 입력 → 생성 및 재생`
- 프로젝트 제목과 상단 chrome 축소
- Composer 중첩 카드·그라디언트·그림자 축소
- 파일/정리/미리듣기/빈 대사를 보조 action으로 축소
- 모바일의 2차 통계 숨김 및 action 한 줄 유지
- 기존 장문 자동 분할, 첫 음성 재생, 최대 2-way bounded parallel, 다중 화자, Timeline, Engine routing 유지

Fish Audio는 `Generate & play`, 단일 입력 surface, voice/advanced settings 분리라는 정보 구조 원칙만 참고했습니다. 외부 Fish Audio API, 결제 계정, Secret 의존성은 추가하지 않습니다.
