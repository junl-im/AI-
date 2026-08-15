# 0.11.19 R1 · Voice Picker Accessibility Hotfix

- GitHub Actions run `31857547345` Web quality의 실제 실패는 `DubbingVoiceControls.test.tsx` 1건이었습니다.
- 원인: Voice Picker 내부의 적용 범위 안내와 대본 맞춤 추천이 모두 `role="status"`를 사용해 Testing Library의 단일 status 조회가 충돌했습니다.
- 수정: 적용 범위 안내는 `role="note" aria-label="목소리 적용 범위"`로 의미를 분리하고, 추천만 `role="status"`를 유지합니다.
- 테스트: 추천은 status로, 적용 범위는 이름 있는 note로 각각 검증합니다.

# SoriON AI 0.11.19 Verification Report

결과 버전: **0.11.19 · Voice Engine Fast Path + MY VOICE Runtime**  
기준: **0.11.18 · SoriON Voice Deck Visual Identity**  
검증일: **2026-08-15 KST**

## 이번 패스

- 일반 프리셋과 `MY VOICE`를 하나의 VoiceChoice 모델로 통합해 Voice Picker, Desktop Drawer, Timeline, Home 생성 경로가 같은 선택 상태를 사용합니다.
- `myvoice:<profileId>`는 일반 TTS preset fallback이 아니라 Voice Clone API job으로 직접 라우팅합니다.
- Voice Clone 진행 감시는 고정 750ms polling 대신 **SSE 우선 + 360ms→900ms adaptive polling fallback**으로 변경했습니다.
- 이미 완료된 clone job은 재시작하지 않고 즉시 재사용하며, 기존 job 복구 중 일시적인 네트워크 오류가 발생해도 새 job을 중복 생성하지 않습니다.
- 새 preview를 시작하면 이전 clone preview를 abort하고 서버 cancel까지 전달해 불필요한 Worker 사용을 줄입니다.
- Voice Clone capability는 ready 상태를 짧게 캐시하고 동시 요청을 병합합니다.
- API의 CosyVoice Worker readiness probe는 **3초 cache + asyncio lock 기반 동시 probe 병합**을 사용해 Timeline 여러 문장이 동시에 시작될 때 `/health` + `/ready` 왕복을 반복하지 않습니다.
- 저장된 내 목소리 프로필을 Voice Library와 Clone page에서 다시 선택해 바로 테스트할 수 있도록 연결했습니다.
- MY VOICE는 원본 샘플 특성을 보존하기 위해 일반 preset용 speed/pitch/emotion 보정을 적용하지 않습니다.

## 검증 결과

- Repository preflight: **47/47 PASS**
- Product version sync: **0.11.19 PASS**
- Project rules / MY VOICE runtime static contracts: **PASS**
- 변경 TS/TSX dependency-free transpile: **18/18 PASS**
- CSS brace balance: **25/25 PASS**
- API pytest: **220/220 PASS** (경고 1건: FastAPI deprecated status alias)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- CosyVoice Worker probe cache/coalescing 회귀 테스트 포함: **PASS**
- 기준점 GitHub Actions 0.11.18 run `31788209886`: **SUCCESS**

## 성능 강화 포인트

1. **MY VOICE 진행 피드백**: Worker가 내보내는 progress SSE를 우선 사용해 불필요한 고정 polling을 제거합니다.
2. **fallback 안정성**: SSE를 사용할 수 없을 때만 adaptive polling으로 전환하고, 장시간 job일수록 조회 간격을 완만하게 늘립니다.
3. **중복 생성 방지**: 기존 job 조회가 404/410으로 확실히 사라진 경우에만 replacement job을 시작합니다. 일시적인 통신 실패는 중복 POST를 만들지 않습니다.
4. **준비 상태 재사용**: 브라우저 capability cache와 API Worker readiness cache를 함께 사용해 연속 생성에서 setup 왕복을 줄입니다.
5. **취소 자원 회수**: preview 교체/취소 시 AbortSignal과 remote cancel을 연결합니다.

## 남은 실제 성능 증거

현재 전달 환경의 npm 설치가 완전하지 않아 전체 frontend Vitest / semantic TypeScript / Vite production build를 이 환경에서 다시 실행하지 못했습니다. Push 후 GitHub Web quality가 최종 판정입니다.

다음 성능 패스에서는 실제 Worker를 연결한 상태에서 `first_audio_ms`, 전체 completion latency, P50/P95, 취소 후 Worker 회수 시간, 20~50개 Timeline batch의 probe/cache hit를 soak evidence로 측정하는 것이 권장됩니다. 현재 SSE는 **진행 상태를 빠르게 전달**하지만 segment audio URL을 즉시 재생하는 progressive MY VOICE streaming은 아직 별도 단계입니다.
