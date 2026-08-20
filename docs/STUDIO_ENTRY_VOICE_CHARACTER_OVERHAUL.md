# Studio Entry & Voice Character Overhaul

Version: `0.11.31`

## 목적

0.11.31은 장문 스튜디오 첫 진입 동선과 5개 기본 성우의 Browser/System TTS 체감을 함께 재설계합니다. 사용자가 `장문 음성 스튜디오 시작`을 누르면 이전 스크롤 위치를 이어받아 타임라인 중간으로 진입하지 않고, sticky compact header 바로 아래에 `TEXT TO SPEECH / 텍스트를 음성으로` 섹션이 오도록 정렬합니다.

첫 화면 오른쪽은 기능 카드가 아니라 SoriON의 Voice / Emotion / Rhythm을 표현하는 graphics-only Signature Visual로 바꿉니다. 이 영역에는 현재 성우, 엔진 상태, 실행 버튼을 두지 않습니다.

## Studio entry 계약

- Landing에서 `장문 음성 스튜디오 시작`을 누른 최초 진입에만 정렬을 예약합니다.
- target anchor는 `#text-to-speech-studio`입니다.
- `.soa-compact-header` 실제 높이를 읽어 sticky header 아래 8px에 target을 배치합니다.
- workspace 렌더가 한 프레임 늦어도 최대 8 frame까지 anchor를 재탐색합니다.
- 작업 중 선택/편집/프로젝트 전환에는 강제 scroll reset을 적용하지 않습니다.

## Built-in Voice Character

| 성우 | Persona | 기본 pace | Cadence | 목적 |
|---|---|---:|---|---|
| 혜린 | 따뜻한 대화 | +6% | conversation | 짧은 호흡, 부드러운 종결, 일상 대화 |
| 도윤 | 또렷한 설명 | +11% | explainer | 짧은 쉼, 명료한 정보 전달 |
| 소리 | 편안한 장문 | +4% | narrative | 답답하지 않은 장문 호흡 |
| 준호 | 묵직한 다큐 | +5% | documentary | 낮고 단단하지만 늘어지지 않는 전개 |
| 민준 | 빠른 숏폼 | +14% | shortform | 최소 쉼, 빠른 전개, CTA형 |

`차분함 = 느리게`, `저음 = 느리게`로 처리하지 않습니다. 모든 기본 preset의 effective pace를 1.00보다 높게 두고, character 차이는 과한 pitch 변조보다 pace, compatible voice identity, 문장/줄바꿈 cadence로 만듭니다.

## Browser Speech 자연화

- 사용자 pitch 반영 비율: `0.30`
- 최종 Web Speech pitch clamp: `0.92~1.08`
- 줄바꿈/연속 공백/과한 말줄임표를 Browser Speech용으로 정리합니다.
- conversation / explainer / narrative / documentary / shortform에 따라 줄 경계의 쉼표·문장 종결 cadence를 달리합니다.
- 텍스트의 의미나 단어를 AI로 재작성하지 않습니다.
- 동일 기기에 compatible 한국어 음성이 하나뿐이면 timbre 자체는 같을 수 있습니다. 이 경우 persona 차이는 pace/cadence/prosody에 한정되며 실제 완전한 성우 음색 분리는 rights-cleared neural reference/model이 필요합니다.

## Windows System TTS

Windows `System.Speech`의 integer Rate 변환은 `(effective_speed - 1) * 16`으로 민감도를 높입니다. 이전 x8에서는 +4~6% pace가 `0`으로 반올림되어 성우 차이가 사라질 수 있었습니다. 기본 speed 1.00에서 이번 preset은 혜린/소리/준호 `Rate 1`, 도윤/민준 `Rate 2`가 됩니다.

## Voice UI

Desktop Voice Drawer와 mobile/desktop Voice Picker는 이름·성별만 보여주지 않고 다음을 함께 표시합니다.

- Persona label
- Persona summary
- pace label
- cadence rhythm micrograph
- 잘 맞는 콘텐츠
- 장점
- rhythm tags
- 주의점

따라서 사용자는 재생 전에도 5개 성우의 역할 차이를 확인할 수 있습니다.

## Landing Signature Visual

상단 오른쪽은 `CURRENT VOICE`, engine 상태, CTA를 제거하고 다음 정적 그래픽으로 구성합니다.

- dark navy glass surface
- cyan / violet aurora glow
- orbit + luminous core
- SoriON signature waveform
- `목소리에 감정을 입히다.` copy

`prefers-reduced-motion`에서는 waveform animation을 중지합니다. 해당 visual 내부에는 button이 없습니다.

## 한계와 안전 경계

- Browser/System TTS는 운영체제에 설치된 음성 inventory에 종속됩니다.
- 이 릴리스는 Browser/System fallback의 속도·cadence·UI character를 크게 개선하지만 neural 음질 완성을 주장하지 않습니다.
- 실제 reference WAV/model/동의 문서는 Git 및 전달 ZIP에 포함하지 않습니다.
- v4 neural preview READY가 존재하면 기존 0.11.30의 verified neural 우선 경로를 유지합니다.
- 카카오 WebView가 Speech Synthesis 시작 자체를 차단하면 기존 direct user-gesture, 1.8초 watchdog, 외부 브라우저 fallback이 안전망입니다.
