# NEXT UPDATE

현재 기준: `0.11.24 R1 · Voice Pace Calibration`

## 목표 버전

`0.11.25 · Web Quality Evidence & Recovery Runtime Verification`

### 핵심 기능

1. 0.11.24 R1을 실제 GitHub 기준선에 반영한 뒤 GitHub Actions에서 Vitest, semantic typecheck, lint, Vite build를 모두 통과시키고 실패가 있으면 새 기능보다 CI 안정화를 우선합니다.
2. desktop 1024/1280/1440과 mobile 360/390/430 Chromium evidence에서 0.11.23의 Voice Drawer/Picker `재생=선택`, 상단 지정 보조 영역 디자인, 0.11.24의 multi stale recovery impact dialog와 command bar containment를 실제 화면으로 확인합니다.
3. 실제 MY VOICE Worker와 동의된 프로필을 사용할 수 있을 때만 stale profile을 대체한 뒤 `교체 후 재생성` 성공, first-audio latency, 실패/취소 복구를 운영 증거로 추가합니다.
4. Web quality가 녹색인 상태에서만 `TimelineEditor`의 남은 rendering/keyboard orchestration 책임을 추가 분리할지 판단합니다. 기능 추가와 대규모 분리를 한 번에 섞지 않습니다.

### 선행 조건

- 0.11.24 R1 Repository preflight **49/49 PASS** 상태를 유지합니다.
- 0.11.24 R1이 적용될 실제 GitHub 저장소/브랜치 기준을 확인해야 합니다.
- stale MY VOICE의 ready 음원은 명시적 교체 전 자동 삭제하지 않습니다.
- 다중 복구는 전체 선택이 아니라 unavailable MY VOICE subset만 변경합니다.
- Undo는 semantic Voice 배정을 복원하지만 폐기된 과거 audio 파일을 부활시키지 않습니다.
- 실제 soak evidence 없이 동시 생성 상한을 2보다 높이지 않습니다.
- 모델/동의/실제 Chromium 실행이 없는 synthetic/static 결과를 실운영 성공 증거로 표현하지 않습니다.

## 0.11.24에서 고정한 결정

- selection 책임은 `useTimelineEditorSelection.ts`, batch/recovery 책임은 `useTimelineEditorBatch.ts`가 소유합니다.
- `TimelineEditor.tsx`는 화면 composition, quick-draft 저장 경계, player-follow 연결에 집중합니다.
- multi stale recovery는 사용 불가 개수, 원래 Voice 구성, ready audio 폐기 영향을 별도 dialog에서 확인한 뒤 실행합니다.
- 일반 batch history와 stale recovery history는 의미 있는 label로 구분합니다.
- PATCH ZIP은 저장소 상대 경로 그대로 구성하며 0.11.23 루트에 직접 덮어쓸 수 있어야 합니다.
- FULL ZIP은 저장소 전체 프로젝트를 포함하고 `.git`, `node_modules`, `dist`, `.sorion`, 캐시, 비밀키는 제외합니다.

## 0.11.24 R1에서 추가로 고정한 결정

- UI `1.00×`는 자연스러운 한국어 기본 발화 기준이며 프리셋 캐릭터를 만들기 위해 0.90대 초반으로 상시 감속하지 않습니다.
- 기본 pace multiplier는 혜린 1.00 / 도윤 1.04 / 소리 0.98 / 준호 0.98 / 민준 1.08을 기준으로 검증합니다.
- MY VOICE pace는 preset multiplier가 아니라 실제 clone sample/runtime에서 별도로 검증합니다.
- 실제 청취/운영 evidence가 생기기 전에는 multiplier를 더 공격적으로 올리거나 내리지 않습니다.
