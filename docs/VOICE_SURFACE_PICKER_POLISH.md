# 0.11.23 · Focused Voice Surface & Picker Polish

## 사용자 결정

PC 메인 상단 전체를 비우지 않는다. 사용자가 지정한 오른쪽 보조 Live Voice 영역만 기존 구성을 걷어내고 새 디자인으로 대체한다. 브랜드, 버전, 제작자, 제품명, 소개 문구, 설정 진입은 유지한다.

## 상단 지정 영역

- 기존 Voice Deck의 큰 파형/신호 중심 표현은 제거합니다.
- 현재 Voice identity, readiness, engine, `텍스트를 음성으로` 진입은 유지합니다.
- 새 카드는 더 낮은 정보 밀도와 짧은 시선 이동을 우선합니다.
- 모바일에서는 기존처럼 해당 PC 보조 카드를 핵심 작업 흐름보다 우선 노출하지 않습니다.

## 재생과 선택

- Desktop Voice Drawer와 Voice Picker에서 다른 성우의 ▶를 누르면 `선택 -> 미리듣기` 순서로 실행합니다.
- Timeline 대사가 선택된 상태라면 이름을 직접 선택했을 때와 같은 기존 `selectVoice` 경로를 통해 해당 대사들에도 적용됩니다.
- 이미 선택된 성우의 재생/일시정지는 Voice를 다시 적용하지 않고 preview 상태만 토글합니다.
- Voice Picker는 ▶ 미리듣기로 선택이 바뀌어도 modal을 닫지 않아 연속 비교를 허용합니다.

## Voice Picker modal

- 외곽 modal이 border-radius와 clipping을 소유합니다.
- 스크롤은 내부 `.soa-voice-picker-scroll`에서만 발생합니다.
- PC에서는 중앙 modal, 고정 header, 내부 목록 scroll, 안정적인 scrollbar gutter를 사용합니다.
- 닫기/내 목소리 버튼과 목록 card의 여백·모서리를 통일합니다.

## Final Export

- 사용자 화면의 `최종 WAV + 자막` action은 제거합니다.
- `최종 MP3 + 자막` 완료 내보내기는 유지합니다.
- 내부 WAV API/테스트용 포맷/soak 기능은 삭제하지 않습니다. 이 변경은 노출 UI 범위입니다.
