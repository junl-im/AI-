# Live Voice + MY VOICE 통합 설계 보고서

## 목표

VOICE CORE를 장식용 배너에서 실제 상태를 보여 주는 **Live Voice Bar**로 전환하고, `내 목소리`에서 만든 프로필을 TTS/Timeline의 일반 목소리 선택 흐름으로 편입한다.

## Live Voice Bar

표시 데이터:

- Voice: 현재 기본/선택 목소리 이름
- Kind: `MY VOICE` 또는 `SoriON VOICE`
- Engine: 실제 선택 engine / MY VOICE profile engine
- Status: `CHECKING`, `READY`, `LIMITED`, `OFFLINE`, 생성 중에는 `LIVE`
- Detail: 프리셋 특성 또는 MY VOICE 연결 상태
- CTA: `텍스트를 음성으로 →`

디자인은 기존 큰 흰색 waveform 박스를 제거하고, 낮은 다크 control surface 안에서 avatar + voice + waveform + engine + status + CTA가 한 줄 정보 계층을 만들도록 구성한다.

## MY VOICE Library Bridge

저장된 `VoiceCloneProfile`은 `myvoice:<profileId>`라는 충돌 없는 ID를 사용한다. 같은 `VoiceChoice` 계약으로 MY VOICE와 기본 preset을 한 selector에서 다룬다.

노출 위치:

1. 좌측/일반 Voice Library
2. PC Desktop Voice Drawer
3. Voice Picker Sheet
4. Timeline clip/batch voice selector

MY VOICE는 기본 preset보다 먼저 별도 `MY VOICE` 그룹으로 보인다. 프로필 품질 guide 점수와 준비 상태도 함께 표시한다.

## 양방향 연계

- Library → Timeline: 현재 선택한 clip이 있으면 `updateVoiceMany`로 즉시 voiceId/name을 교체하고 기존 완성 음원은 안전하게 해제한 뒤 queued로 돌린다.
- Timeline → Library: Timeline selector에서 voice를 바꿀 때 선택 ID를 공용 ref에 맞춘 뒤 같은 `selectVoice()` 경로를 사용한다. 따라서 전역 현재 목소리와 Library 표시가 같이 바뀐다.
- 선택 clip이 없을 때 MY VOICE를 고르면 다음 생성의 기본 voice가 된다.

## 실제 생성 라우팅

`myvoice:<profileId>`는 generic TTS engine에 전달하지 않는다. `synthesizeVoiceCloneProfile()` adapter가 기존 Voice Clone API의 start / recover / poll / cancel 흐름을 `TtsSynthesisResult`로 변환한다.

이 덕분에 Timeline과 Player는 preset 음성과 같은 최종 오디오 계약을 받으면서도 MY VOICE는 실제 clone profile job으로 생성된다.

안전성:

- 기존 job ID가 있으면 복구 우선
- 취소 signal은 remote cancel까지 전달
- 완료되지 않은 job은 최종 audio로 취급하지 않음
- MY VOICE final audio에는 generic TTS rehydration metadata를 붙이지 않음
- profile이 engine-ready가 아니면 생성 전에 안내하고 Timeline을 파괴적으로 초기화하지 않음

## 내 목소리 Lab

이 통합 패치에는 이전 후보의 My Voice Lab 개선도 포함한다.

- 저장된 내 목소리 여러 개 관리
- 품질 guide score
- 가이드 녹음 문장
- 원본 sample 미리듣기
- consent-first 준비 단계
- 실제 Voice Test Lab
- profile 저장/삭제 즉시 Library refresh

## 보존 전략

현재 main의 최신 UX를 오래된 후보 파일로 덮지 않기 위해 다음 파일은 direct overwrite하지 않고 문맥 패치한다.

- `HomePage.tsx`
- `TimelineEditor.tsx`
- `DesktopVoiceDrawer.tsx`
- `VoicePickerSheet.tsx`
- `useTimelineGeneration.ts`

적용 전에는 `FinalExportDialog`, `TimelineLinkedPlayer`, 최신 collapsed voice drawer marker를 확인한다.

## 다음 후보

통과 후 다음 단계는 MY VOICE 프로필의 engine-ready 상태를 capability 변화에 따라 자동 재검증하는 것과, 동일 문장 A/B 테스트/즐겨찾기/대표 voice 지정 UX를 추가하는 것이다.
