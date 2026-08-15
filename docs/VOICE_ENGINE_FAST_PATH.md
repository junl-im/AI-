# Voice Engine Fast Path · 0.11.19

## 목표

SoriON의 기본 성우와 `MY VOICE`를 같은 UX에서 고르되, 실제 생성 경로는 각 엔진 특성에 맞게 분리합니다. 화면에만 MY VOICE를 노출하는 것이 아니라 선택 → Timeline → 생성 → 플레이어까지 실제 Voice Clone job으로 이어지는 것이 기준입니다.

## MY VOICE routing

저장 프로필은 `myvoice:<profileId>` ID를 사용합니다. `voiceChoices`가 MY VOICE와 SoriON preset을 하나의 선택 목록으로 만들고, `HomePage`와 `generationRuntime`이 ID 종류를 보고 실행 엔진을 결정합니다.

- preset: 기존 TTS auto routing / progressive segment / browser fallback 유지
- MY VOICE: Voice Clone profile job 직접 실행
- MY VOICE 최종 음원: TTS signed-final rehydration 미사용
- engine-ready가 아닌 MY VOICE: 목록에는 표시하지만 생성 선택은 비활성

## 성능 강화

Voice Clone job 상태는 `/events` SSE를 먼저 사용합니다. Worker는 revision이 바뀔 때 진행 이벤트를 내보내므로 고정 750ms polling보다 상태 반영이 빠르고 요청 수가 적습니다. SSE를 사용할 수 없는 환경에서는 360ms부터 시작해 최대 900ms까지 늘어나는 adaptive polling으로 자동 복구합니다.

Capability는 준비 상태일 때 최대 30초, 미준비 상태일 때 최대 3초만 메모리 캐시하며 동일 시점의 중복 요청을 합칩니다. API의 CosyVoice Clone 엔진도 최근 3초 readiness probe를 재사용하고 동시 probe를 하나로 직렬화해 Timeline 여러 문장이 한꺼번에 시작될 때 `/health`와 `/ready` 요청이 폭증하지 않도록 합니다. 새 프리뷰가 시작되면 이전 요청은 AbortSignal로 취소하고 이미 clone job이 생성된 경우 원격 cancel도 전송합니다. 완료된 기존 job은 GET 복구 후 새 POST 없이 바로 재사용합니다.

## 안전 경계

MY VOICE는 저장된 동의 프로필만 사용합니다. 샘플의 로컬 점수는 녹음 가이드일 뿐 모델 품질 보장이 아닙니다. 실제 합성 속도와 음질은 Worker/GPU/모델 상태에 따라 달라질 수 있으므로 UI는 엔진 준비 상태를 별도로 표시합니다.

## 후속 측정

다음 성능 측정에서는 `firstAudioMs`, 전체 생성 시간, SSE fallback 비율, cancel 후 worker 정리 시간, 10/50/100 문장 Timeline P50/P95를 실제 Worker 연결 상태에서 기록합니다.
