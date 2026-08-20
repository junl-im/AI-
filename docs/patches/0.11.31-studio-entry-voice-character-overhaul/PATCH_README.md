# 0.11.31 · Studio Entry & Voice Character Overhaul PATCH

## 기준

- Base: `0.11.30 R1 · Web Lint Type-Only Import Stabilization`
- Target: `0.11.31 · Studio Entry & Voice Character Overhaul`
- 적용: PATCH ZIP의 내용을 저장소 루트에 그대로 덮어씁니다.
- 삭제 파일: 없음.

## 핵심 변경

1. Landing `장문 음성 스튜디오 시작` 후 `텍스트를 음성으로`를 sticky compact header 아래 첫 작업 위치로 자동 정렬합니다.
2. Masthead 오른쪽 Current Voice/Engine/CTA 기능 카드를 graphics-only SoriON Signature Visual로 교체합니다.
3. 5개 기본 성우를 `따뜻한 대화 / 또렷한 설명 / 편안한 장문 / 묵직한 다큐 / 빠른 숏폼` persona로 분리하고 기본 pace를 `1.06 / 1.11 / 1.04 / 1.05 / 1.14`로 상향합니다.
4. Browser Speech에 성우별 cadence text normalization을 추가하고 pitch 변조를 user scale 0.30, final clamp 0.92~1.08로 제한합니다.
5. Windows System TTS Rate quantization을 x16으로 높여 작은 pace 차이도 기본속도에서 관측되게 합니다.
6. Desktop Voice Drawer와 Voice Picker에 persona summary, pace, rhythm micrograph, 잘 맞는 콘텐츠, 장점/주의를 표시합니다.
7. 0.11.30 verified neural v4 promotion/fallback, MY VOICE, Timeline recovery, Kakao watchdog/exit guard를 유지합니다.

## 검증

- Product version sync: 0.11.31 PASS
- Repository preflight: 54/54 PASS
- Studio/Voice static contract: PASS
- Voice preset contract: PASS
- Mobile studio/reproducible Web contracts: PASS
- Targeted API System/preset tests: 16/16 PASS
- API pytest: 228/228 PASS (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- All TS/TSX dependency-free syntax: 257/257 PASS
- Local dependency-based ESLint/Vitest/typecheck/build/Chromium: `node_modules`가 없어 미실행, GitHub Actions final gate

## 품질 경계

- OS에 compatible 한국어 음성이 하나뿐이면 Browser/System fallback의 timbre를 5개로 완전 분리하지 못합니다.
- 이번 패치는 pace/cadence/prosody/UI distinction을 강화하지만 neural 음질 완성을 주장하지 않습니다.
- 실제 rights-cleared reference WAV/model/동의 문서는 Git 또는 전달 ZIP에 포함하지 않습니다.
- 카카오 WebView가 Speech Synthesis 자체를 차단하면 기존 direct user-gesture + 1.8초 watchdog + 외부 브라우저 fallback까지만 보장합니다.
