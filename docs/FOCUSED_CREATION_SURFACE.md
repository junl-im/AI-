# Focused Creation Surface

버전: `0.11.13`

## 목적

SoriON의 장문·다중 화자·타임라인·로컬 엔진 기능은 유지하면서, 첫 화면에서 사용자가 실제로 해야 하는 작업을 `목소리 선택 → 텍스트 입력 → 생성 및 재생` 세 단계로 압축합니다.

Fish Audio의 웹 제품에서 참고한 것은 특정 색상이나 레이아웃 복제가 아니라 다음 제품 원칙입니다.

- 핵심 입력 영역을 화면의 중심에 둡니다.
- 현재 목소리 선택은 한 곳에서 명확하게 보여 줍니다.
- 고급 설정은 기본 화면을 점유하지 않고 필요할 때 엽니다.
- 문자 수와 생성 상태처럼 즉시 필요한 정보만 가까이 둡니다.
- 1차 실행 버튼은 `Generate & play`처럼 결과 청취까지 한 행동으로 이해되게 만듭니다.
- Voice Library / Voice Cloning / History는 핵심 생성 흐름을 방해하지 않는 보조 동선으로 둡니다.

## 0.11.13 변경

- 중앙 Composer 제목을 `텍스트를 음성으로`로 단순화했습니다.
- 긴 설명과 기술 용어를 줄이고 입력 → 생성 → 재생 흐름을 우선합니다.
- 기본 CTA를 `생성 및 재생`으로 변경했습니다. 내부 동작은 기존 첫 음성 자동 재생과 동일합니다.
- 파일 불러오기, 대본 정리, 첫 문장 듣기, 빈 대사는 짧은 보조 동작으로 축소했습니다.
- 문자 수·대사 수·화자 수·예상 길이를 남기고 문단/파일 형식 정보는 모바일에서 숨깁니다.
- 프로젝트 제목과 상단 도구의 크기를 줄여 Composer가 첫 시선 영역을 차지하게 했습니다.
- 밝은 다중 그라디언트 CTA를 단색 포인트로 바꾸고 중첩 카드/그림자 강도를 낮췄습니다.
- PC 기본 프로 패널 접힘, Voice Picker/Settings Sheet, Multi-Speaker Assist, Timeline Editor, Engine routing은 변경하지 않았습니다.

## 다음 분리 대상

이번 패치는 시각적 복잡도만 낮춥니다. 다음 구조 패치에서는 아래 책임을 분리하는 것이 우선입니다.

1. `TimelineEditor.tsx`: 1,100줄 이상. selection/history/command bar/clip rendering 분리.
2. `useTimelineGeneration.ts`: 1,100줄 이상. orchestration/recovery/player sync 분리.
3. `HomePage.tsx`: 상태 조정과 UI composition 분리.
4. `dubbing-overlays.css`: sheet/player/modal 영역별 stylesheet 분리.
5. Quality Lab은 제품 기본 제작 흐름과 별도 운영자 surface로 더 명확히 구분.

## 기능 추가보다 먼저 볼 지표

- 새 사용자가 첫 음성 재생까지 클릭하는 횟수
- 입력 시작까지 걸리는 시간
- 생성 버튼 발견률
- 모바일 360/390/430px에서 첫 화면 overflow
- Voice Settings를 열지 않고 첫 생성까지 완료하는 비율
- 장문 2-way bounded parallel의 P95 / 실패율 / fallback 빈도
