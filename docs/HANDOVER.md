## 2026-08-27 KST · 0.11.35 R3 Chromium CI Runner Hotfix

1. **작업 일시(KST)**: 2026-08-27.
2. **대상/기준 버전**: `0.11.35 R3 · Chromium CI Runner Hotfix` / `0.11.35 R2 · Web Quality Syntax Hotfix`. 제품 semver는 `0.11.35` 유지.
3. **변경 내용**: visual layout runner의 고정 랜덤 remote-debugging port를 Chromium의 `--remote-debugging-port=0` + `DevToolsActivePort` 탐지 방식으로 교체했습니다. endpoint 준비 실패 시 15초 내 fail-fast하고, 종료 시 SIGTERM 뒤 미종료 Chromium을 SIGKILL해 CI job이 수십 분 매달리는 상황을 차단합니다. R2 전체 통파일에서 누락된 안전한 `.env.example`도 복구했습니다.
4. **변경 이유**: GitHub Actions에서 Chromium이 `127.0.0.1:9614/json/version` endpoint를 열지 못한 뒤 DBus 경고만 남기고 visual step이 약 22분 동안 종료되지 않아 job 전체가 취소되었습니다. DBus 메시지는 비치명적이며 핵심은 debug port discovery와 child-process cleanup의 취약성이었습니다.
5. **영향 범위**: `scripts/run-visual-layout-regression.mjs`, 정적 계약 checker, 릴리스 문서/패키징만 변경합니다. 제품 UI, 음성 엔진, Neural/MY VOICE, Listening QA runtime은 변경하지 않습니다.
6. **주요 변경 파일**: `scripts/run-visual-layout-regression.mjs`, `scripts/check-visual-layout-regression.mjs`, `.env.example`, `docs/{HANDOVER,CHANGELOG,NEXT_UPDATE}.md`, `docs/patches/0.11.35-r3-chromium-ci-runner-hotfix/*`.
7. **검증 결과**: Node syntax check PASS, Chromium visual-layout static contract PASS, Repository preflight **55/55 PASS**. 로컬 Chromium 144에서 DBus 경고가 존재하는 조건으로 DevToolsActivePort가 실제 생성되고 실패 fixture가 약 6초 안에 종료되는 것을 확인했습니다. 실제 production visual capture 전체 성공은 GitHub Actions final gate입니다.
8. **알려진 제한/주의**: DBus stderr 자체는 CI headless Chromium에서 발생 가능한 비치명 경고이므로 이를 실패 조건으로 사용하지 않습니다. GitHub runner의 실제 screenshot/baseline 결과는 재실행으로 확인해야 합니다.
9. **생성 산출물**: `SoriON-AI-0.11.35-r3-chromium-ci-runner-hotfix-full.zip`, `SoriON-AI-0.11.35-r2-to-0.11.35-r3-chromium-ci-runner-hotfix-patch.zip`, `SoriON-AI-0.11.35-r3-chromium-ci-runner-hotfix-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: GitHub Actions Web quality green 확인 후 `0.11.36 · Prosody Director & Long-form Naturalness`.

## 2026-08-27 KST · 0.11.35 R2 Web Quality Syntax Hotfix

1. **현재 기준선**: `0.11.35 R2 · Web Quality Syntax Hotfix` (제품 semver `0.11.35` 유지).
2. **원인**: `src/quality/releaseReadiness.test.ts`의 `voices.flatMap(...map(...))` fixture에서 `flatMap`을 닫는 괄호 하나가 누락되어 GitHub Actions ESLint가 line 104에서 `Parsing error: Argument expression expected`로 중단됐습니다.
3. **수정**: line 103의 `})),`를 `}))),`로 교정했습니다. 제품 runtime/Neural gate/성우 정책에는 변화가 없습니다.
4. **검증**: Release Readiness contract PASS, Repository preflight **55/55 PASS**, 해당 TypeScript 파일 parser-level syntax diagnostic **0건**. 전체 Web quality는 GitHub Actions final gate입니다.
5. **다음 목표**: 이 hotfix의 GitHub Actions green 확인 후 `0.11.36 · Prosody Director & Long-form Naturalness`.

## 2026-08-27 KST · 0.11.35 Voice Reference Intake & Listening QA

1. **현재 기준선**: `0.11.35 · Voice Reference Intake & Listening QA`.
2. **핵심 변경**: 5성우 × 5청취 시나리오 × 6평가축의 사람 청취 QA를 Quality Lab에 추가했습니다.
3. **출시 기준**: 5시나리오 완료, 평균 4.0+, 모든 항목 3+, 장문 낮은 피로도 4+일 때만 LISTENING READY입니다.
4. **데이터 정책**: 청취 기록은 브라우저 localStorage에 저장하고 사용자가 명시적으로 JSON 내보내기를 실행할 때만 파일로 나갑니다.
5. **Neural 정책**: 기존 consent/rights/SHA/model/reference fingerprint와 PC/mobile playing→ended fail-closed gate를 유지합니다.
6. **다음 목표**: `0.11.36 · Prosody Director & Long-form Naturalness`.

# HANDOVER

## 2026-08-27 KST · 0.11.34 Natural Voice Engine & Field Playback Gate

1. **작업 일시(KST)**: 2026-08-27.
2. **대상/기준 버전**: `0.11.34 · Natural Voice Engine & Field Playback Gate` / `0.11.33 R1 · Baseline Integrity Repair`.
3. **변경 내용**: 5개 기본 성우의 기본 속도를 현실적인 좁은 범위로 재보정하고 softness/articulation/pause identity를 추가했습니다. Browser/Melo/System TTS는 같은 natural speed clamp를 사용하며 CosyVoice는 FFmpeg가 있을 때 pitch를 보존하는 `atempo`로 최종 WAV tempo를 보정합니다. Release Readiness에는 5성우 PC/mobile `playing → ended` shared neural evidence 슬롯을 추가해 필수 7개 evidence로 확장했습니다.
4. **변경 이유**: 기존 +6~14% 중심 차별화는 일부 성우를 실제 사람보다 빠르게 들리게 만들 수 있고, Neural 경로는 UI speed가 실제 WAV에 충분히 반영되지 않았습니다. 성우 개성은 과속이 아니라 음색·호흡·명료도·종결 방식으로 분리하고 실제 재생 완료만 Neural 출시 인증으로 인정하기 위함입니다.
5. **영향 범위**: `src/tts/voicePresets.ts`, Browser Speech prosody, API voice preset 공통 정책, Melo/System/CosyVoice TTS, Release Readiness UI/verifier/tests/docs. 실제 rights-cleared reference/model 자산은 추가하지 않습니다.
6. **성우 정책**: 혜린 1.02×(0.96–1.08), 도윤 1.04×(0.98–1.10), 소리 0.99×(0.94–1.05), 준호 1.00×(0.95–1.06), 민준 1.07×(1.00–1.13). 각 preset은 서로 다른 softness/articulation/pauseStyle을 갖습니다.
7. **Neural gate**: 5개 preset 각각 desktop/mobile observed-runtime의 playbackStartedAt + playbackCompletedAt이 필요하고 cache/audio/model/reference fingerprint가 PC/mobile에서 동일해야 `neural-runtime READY`입니다.
8. **검증 결과**: targeted API voice/system/melo/cosy tests **32/32 PASS**, API pytest **238/238 PASS** (기존 FastAPI deprecated alias warning 1건), Worker pytest **16/16 PASS**, Repository preflight **55/55 PASS**, Live Voice/MY VOICE **51/51 PASS**, voice preset/neural runtime/release readiness contract **PASS**. `npm ci --ignore-scripts`는 120초 실행 제한 내 완료되지 않아 dependency 기반 lint/Vitest/typecheck/build는 로컬 미검증이며 GitHub Actions final gate를 유지합니다.
9. **알려진 제한**: FFmpeg가 없는 CosyVoice 환경은 reference cadence를 유지하고 speed 지원 READY를 주장하지 않습니다. 실제 rights-cleared 5성우 WAV/model과 PC/mobile observed playback이 없으면 Neural 5/5 CERTIFIED를 주장하지 않습니다.
10. **생성 산출물**: `SoriON-AI-0.11.34-natural-voice-engine-field-playback-gate-full.zip`, `SoriON-AI-0.11.33-r1-to-0.11.34-natural-voice-engine-field-playback-gate-patch.zip`, `SoriON-AI-0.11.34-natural-voice-engine-field-playback-gate-SHA256SUMS.txt`.
11. **다음 예상 업데이트**: `0.11.35 · Voice Reference Intake & Listening QA` — 실제 승인 reference가 제공될 때 성우별 청취 기준, loudness/발음/호흡 A/B QA와 장문 피로도 검증을 강화합니다.

## 2026-08-26 KST · 0.11.33 R1 Baseline Integrity Repair

1. **작업 일시(KST)**: 2026-08-26.
2. **대상/기준 버전**: `0.11.33 R1 · Baseline Integrity Repair` / 사용자 전달 `0.11.33 · Voice Engine Major Hardening`. 제품 semver는 `0.11.33` 유지.
3. **변경 내용**: 0.11.33 DELETE_LIST에 이미 퇴역 대상으로 선언됐지만 전달본에 잔존하던 Final Export Web/API/schema, 구형 Live Voice/MY VOICE apply 스크립트, payload snapshot을 실제 저장소에서 제거했습니다. 릴리스 산출물은 `.git`, `.sorion`, `node_modules`, `dist`, Python cache, 실제 `.env*`를 제외하는 전달 규칙으로 재패키징합니다.
4. **변경 이유**: 문서와 verifier는 Final Export/구형 payload 제거를 요구했지만 전달 ZIP에는 잔존해 기준선이 자기모순 상태였습니다. 0.11.34 기능 추가 전에 저장소·문서·검증 계약을 다시 일치시키기 위함입니다.
5. **영향 범위**: 퇴역/미등록 코드와 패치 잔재만 제거합니다. 현재 Timeline, Voice Picker, MY VOICE, Neural Preview, Quality Lab, API/Worker 활성 라우팅은 변경하지 않습니다.
6. **주요 변경 파일**: `docs/HANDOVER.md`, `docs/CHANGELOG.md`, `docs/NEXT_UPDATE.md`, `docs/BASELINE_INTEGRITY_REPAIR_0.11.33_R1.md`, `docs/patches/0.11.33-r1-baseline-integrity-repair/*` 및 0.11.33 DELETE_LIST 대상 잔존 파일 삭제.
7. **검증 결과**: Live Voice/MY VOICE hardening **51/51 PASS**, API pytest **237/237 PASS** (기존 FastAPI deprecated alias warning 1건), Worker pytest **16/16 PASS**. `npm ci --ignore-scripts`는 실행 환경 제한 시간 45초 안에 완료되지 않아 Web lint/Vitest/typecheck/build는 로컬 미검증이며 GitHub Actions final gate를 유지합니다.
8. **알려진 제한/주의**: 실제 rights-cleared neural 성우 WAV/model이 없어 5/5 Neural READY를 주장하지 않습니다. 실제 PC/Android/iOS playback evidence도 아직 필요합니다.
9. **생성 산출물**: `SoriON-AI-0.11.33-r1-baseline-integrity-repair-full.zip`, `SoriON-AI-0.11.33-to-0.11.33-r1-baseline-integrity-repair-patch.zip`, `SoriON-AI-0.11.33-r1-baseline-integrity-repair-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.34 · Neural Voice Field Playback & Release Gate`. 실제 neural/MY VOICE 재생의 `playing → ended` 증거와 release readiness gate를 닫습니다.

# SoriON AI MASTER HANDOVER
상태: **절대 필독 · 임시채팅 영구 메모리 원본**
Current baseline: **0.11.40 · Workspace Polish & Project Deletion**
기준 버전: **0.7.3 Handover Memory Baseline**
최종 갱신: **2026-10-12 KST**
제품 소유·디자인: **곰같은여우**
서비스명: **SoriON AI / 소리온 AI** · 내부 코드명: **SOA**
> 이 프로젝트는 임시채팅에서 개발 중이다. 대화 메모리를 신뢰하지 않는다.
> 다음 AI 또는 개발자는 작업 전에 이 파일과 루트 `DELIVERY_RULES.md`를 끝까지 읽는다.
> 이 파일은 목표, 사용자 결정, 구현 상태, 연결 현실, 금지 규칙과 다음 작업을 보존하는
> 단일 프로젝트 메모리 원본이다.

## 보존 이력

이전 상세 기록: [HANDOVER_HISTORY_0.11.35_AND_EARLIER.md](archive/HANDOVER_HISTORY_0.11.35_AND_EARLIER.md). 원문 전체를 이동해 보존했습니다.

## 1. 다음 세션 시작 절차
1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 끝까지 읽는다.
2. `package.json` 버전과 현재 로컬 버전을 확인한다.
3. 패치는 기준 버전이 정확히 일치할 때만 적용한다.
4. `.git`은 삭제하거나 ZIP으로 덮어쓰지 않는다.
5. `docs/NEXT_UPDATE.md`, `docs/CHANGELOG.md`, 관련 설계 문서를 읽는다.
6. GitHub Actions가 실패하면 새 기능보다 안정화 패치를 먼저 만든다.
7. Web, FastAPI, Worker의 실제 연결 상태를 확인한다.
8. 실제 모델이 없으면 AI 생성·복제 성공을 가장하지 않는다.
9. 완료 시 전체 ZIP, 패치 ZIP, SHA-256, HANDOVER, CHANGELOG,
   NEXT_UPDATE를 함께 갱신한다.
## 1. 최신 인수인계 · 0.11.16 Timeline Editor Split & Mobile Quick Creation

- 현재 제품 버전: **0.11.16**.
- `TimelineEditor.tsx`의 대사 clip rendering을 `TimelineVoiceBlockCard.tsx`로 분리해 hard limit 여유를 확보했습니다.
- 모바일/터치에서는 `＋ / ✓`로 임의 다중 선택하며, 선택된 실제 대사 수를 Voice Picker에 표시합니다.
- 선택된 Timeline 대사가 있으면 성우 탭이 해당 대사에 즉시 적용되고, pause는 적용 개수에서 제외합니다.
- 모바일 voice control과 생성 CTA는 긴 대본에서도 접근하기 쉽도록 sticky 동작합니다.
- 전달 규칙: FULL은 전체 프로젝트, PATCH는 저장소 경로 그대로 즉시 덮어쓰기 가능한 파일 세트입니다.
- 다음 목표: **0.11.17 · Generation Orchestrator Split & Mobile Evidence**.

## 2. 프로젝트의 궁극적 목표
SoriON AI는 단순한 웹 음성 변환기가 아니라 **한국인을 위한 차세대 AI Voice Platform**이다.
모바일에서 약 10초 안에 자연스러운 한국어 TTS, 적법한 목소리 복제, 음성 변환,
STT 편집을 시작하고 더빙·성우 마켓·팟캐스트·실시간 변환으로 확장한다.
제품 방향:
- Voicebox보다 쉬운 사용성.
- 외부 음성 서비스보다 한국어 발음·숫자·날짜·존댓말에 친화적.
- 초보자는 긴 내용과 제작 버튼에 집중하고 전문가는 타임라인에서 정밀 편집.
- 특정 모델이나 외부 API에 종속되지 않는 Engine Adapter.
- 모바일이 주 제품이며 PC는 편집·비교·운영 확장 화면.
- 핵심 작업은 세 번 이내의 터치로 시작.
- 슬로건: **목소리의 가능성을 켜다.**
## 3. 비목표와 금지 사항
- 단순한 브라우저 TTS 데모로 제품을 축소하지 않는다.
- 모델이 없는데 실제 AI 음성이라고 표시하지 않는다.
- API 실패를 조용히 Mock 결과로 숨기지 않는다.
- 초보자 첫 화면에 감정·피치·엔진 ID 같은 고급 설정을 노출하지 않는다.
- 타인 음성의 무단 복제, 사칭, 사기, 금융·공공기관 악용을 허용하지 않는다.
- 명시적 동의 없이 음성 원본을 외부에 업로드하지 않는다.
- Secret, 모델 가중치, 사용자 음성을 Git 저장소와 릴리스 ZIP에 포함하지 않는다.
- `.git`, `node_modules`, `dist`, 가상환경, 캐시를 릴리스 ZIP에 포함하지 않는다.
- 기능 테스트 없이 완료라고 보고하지 않는다.
## 4. 사용자가 확정한 UX·디자인
### 절대 제품 원칙
- 모바일 우선, 한국어 우선, PC 확장.
- 실제 기능 시작은 세 번 이내 터치.
- Advanced는 기본 흐름을 방해하지 않는다.
- Apple의 정돈된 밀도, Notion의 정보 구조, ChatGPT의 친근함을 결합한다.
- 편집 화면 내부는 CapCut처럼 문장과 쉼을 블록으로 다룬다.
- 실제 AI, System Voice, Mock, Browser Demo를 UI와 데이터에서 구분한다.
- 엔진은 교체 가능한 Adapter 뒤에 둔다.
- 연결 실패는 사용자가 작업 중인 화면에서 바로 해결한다.
- 진행 중 결과는 문장별로 먼저 공개하고 전체 완료를 기다리게 하지 않는다.
## 5. 0.8.6에서 확정된 제작 UX
### 핵심 개념
**장문 내용이 중심, 문장 타임라인이 편집 엔진**이다.
기본 흐름:
```text
긴 내용 붙여넣기
→ 목소리·읽기 옵션 선택
→ 문장·쉼 블록 자동 분할
→ 앞 블록부터 순차 생성
→ Dock에서 즉시 재생
```
### 초기 화면과 브랜드
- 첫 화면은 제품 설명과 `장문 음성 스튜디오 시작` 동선에 집중한다.
- 공식 SoriON 아이콘을 favicon, PWA, 첫 화면과 작업공간 상단에 통일한다.
- 첫 화면에는 Dock과 플레이어를 렌더링하지 않는다.
- 어느 작업 화면에서든 상단 아이콘·제품명을 누르면 첫 페이지로 이동한다.
- 첫 브라우저 뒤로가기는 커스텀 종료 확인창을 띄우고 두 번째 뒤로가기는 즉시 이탈한다.
### 장문 제작 화면
- 채팅형 composer와 대화 버블을 기본 제작 UI로 사용하지 않는다.
- 최대 20,000자 내용 편집기, 일반 Enter 줄바꿈, Ctrl/⌘+Enter 제작을 제공한다.
- 문자·문단·음성 블록 수와 예상 길이를 표시한다.
- 생성 뒤에도 내용을 유지하고 타임라인만 새 제작본으로 교체한다.
- 광고 톤, 밝은 톤, 느린 읽기와 숫자 발음 보정을 단순 옵션으로 제공한다.
- 서버가 늦게 연결되면 사용자가 이미 누른 제작 요청을 보존해 연결 복구 뒤 자동 재개한다.
### 목소리와 타임라인
- 목소리는 세로 라이브러리로 제공하고 프리뷰는 실제 API 준비 상태에서 생성한다.
- 문장 사이에 기본 0.5초 쉼 블록을 넣는다.
- 첫 ready 블록부터 Dock에 연결한다.
- 순서 변경, 쉼 추가, 문장 분할·수정과 실패 블록 재시도를 제공한다.
- 수정·분할 시 기존 음원은 무효화하고 block revision이 과거 결과 적용을 차단한다.
### 엔진 연결 UX
- API 주소 입력과 엔진 수동 선택 화면을 만들지 않는다.
- 공개 배포는 `SORION_PUBLIC_API_BASE_URLS` 복수 후보를 런타임 JSON과 build에 주입한다.
- `*.github.io`는 정적 호스트이므로 same-origin `/api/v1`과 `:8443`을 탐색하지 않는다.
- API·TTS·Worker·GPU 상태를 분리하고 `/connectivity`와 `/engines`는 같은 추천 엔진을 사용한다.
- 연결 실패 주소는 제외하고 다음 HTTPS API를 승계하며 online·복귀·backoff에서 재탐색한다.
### Dock
- 순서: `만들기 → 복제 → 품질 → 프로젝트`.
- 음성이 없으면 메뉴만, 첫 ready 음성이 생기면 플레이어를 메뉴 위에 표시한다.
- 큐, 이전·다음, 반복, 속도, 탐색과 다운로드를 유지한다.
- 설정은 Dock에 넣지 않는다.
## 5-1. 0.8.1 모바일 엔진·API 신뢰성 기준
- API 주소에 스킴이 없어도 LAN IP는 HTTP, 공개 도메인은 현재 페이지에 맞춰 정규화한다.
- 배포 주소, 마지막 성공 주소와 최근 자동 발견 주소를 분리 보관한다.
- 모바일 자동 탐색은 같은 Origin·배포 주소·성공 이력·현재 호스트 후보만 사용하며 전체 LAN을 스캔하지 않는다.
- HTTPS 페이지에서 HTTP LAN API가 차단되는 경우 생성 요청 전에 원인을 명확히 보여 준다.
- 휴대폰에서 localhost는 휴대폰 자신이므로 PC LAN IP 또는 공개 HTTPS 주소를 안내한다.
- API, 실제 TTS, Worker 프로세스, GPU·모델을 네 계층으로 분리해 표시한다.
- 온라인 복귀, Wi-Fi·셀룰러 전환, PWA 포그라운드 복귀 시 단일 실행으로 재점검한다.
- 재연결 간격은 5초, 12초, 30초, 60초로 늘리며 중복 점검을 만들지 않는다.
- GET은 일시적 timeout·429·502·503·504에 한해 재시도한다. POST 생성은 중복 음성을
  막기 위해 자동 재전송하지 않고 job ID로 결과를 복구한다.
- `/tts/jobs/{job_id}/result`는 모바일 응답 단절 후 완료 음원을 다시 가져오는 계약이다.
- 모든 Web 요청에 익명 client ID와 request ID를 보내고 API 응답 request ID를 진단에 표시한다.
- 개발 LAN 연결은 허용 Origin과 Private Network preflight가 모두 맞아야 한다.
- 모바일 입력은 16px 이상, 주요 터치 영역은 44px 이상, safe-area를 항상 반영한다.
## 6. 현재 아키텍처와 배포 현실
```text
GitHub Pages / Mobile PWA
React 19 + Vite 8 + TypeScript + Zustand
Longform Editor + Timeline + Linked Player
        │ HTTPS API
FastAPI Gateway · Python 3.10
CORS · TTS · Korean preprocessing · clone proxy
        │ private HMAC request
CosyVoice Worker · Python 3.10
health · readiness · GPU diagnostics · jobs · SSE · WAV
```
- GitHub Pages는 정적 웹만 실행하며 Python API와 GPU Worker를 포함하지 않는다.
- 공개 서비스는 별도 HTTPS FastAPI와 사설 GPU Worker가 필요하다.
- 모바일에서 `localhost`는 PC가 아니라 휴대폰 자신이다.
- 공개 HTTPS에서 로컬 HTTP API 호출은 브라우저 정책으로 차단될 수 있다.
- Repository: `junl-im/AI-`.
- Pages: `https://junl-im.github.io/AI-/`.
## 7. 현재 구현 상태
### Web/PWA
- 초기 랜딩과 편집 작업공간 분리.
- 최대 20,000자 장문 내용 편집기, 문단·문장 통계와 제작 전 분할 예상.
- 브라우저 지원 시 한국어 Web Speech 입력.
- 목소리 세로 라이브러리와 API 프리뷰.
- 문장별 Progressive TTS 생성.
- CapCut형 타임라인, 순서 변경, 자르기, 수정, 쉼, 재시도.
- 사용자 입력 없는 자동 API 탐색과 수동 조작 없는 계층 상태 표시.
- API·실제 TTS·Demo 상태를 구분하고 Worker·GPU 3단계 상태를 표시.
- 초기 랜딩에서는 숨고 작업공간 진입 뒤 나타나는 Linked Player Dock과 최대 20개 큐.
- 목소리 복제, 품질 연구소와 클릭 시 편집 상태를 복원하는 프로젝트 저장소.
- PC 1024px 이상 좌우 패널의 너비 조절·접기와 `sorion.desktop-studio-layout.v3` 로컬 저장. 새 프로젝트는 양쪽 접힘 집중 모드로 시작.
- Engine Doctor의 공개 HTTPS Bridge, 프리셋 WAV 세부 진단과 첫 음성 파일 준비 지표 표시.
### FastAPI Gateway
- Health, Setup, Connectivity, Engine Registry.
- Connectivity 응답에 `api_ready`, `public_https_ready`, `public_api_origin`, `tts_ready`,
  `voice_clone_ready`, `worker_configured` 포함.
- 숫자·날짜·시각·금액·퍼센트·단위·약어 정규화.
- PCM WAV 생성·병합, UUID 작업, timeout·cancel·동시 제한.
- 첫 사용 가능 서버 음성 파일 준비 시간 `first_audio_ms`와 전체 처리 시간을 분리.
- CosyVoice 프리셋 WAV의 포맷·길이·샘플레이트·채널·무음·클리핑 사전 검증.
- 복제 동의·샘플 검증과 Worker proxy.
- 공개 rate limit과 JSONL 감사 로그.
### CosyVoice Worker
- `/health`와 `/ready` 분리.
- 모델 경로·CUDA·GPU·VRAM·디스크 진단.
- 문장별 job, SSE revision, cancel, 실패 구간 retry.
- 서비스 토큰 + HMAC-SHA256 서명, rate limit, 감사 로그.
## 8. 엔진 전략과 실제 상태
기본 무료 전용순위:
1. CosyVoice 3 기준 음색: 준비된 로컬 Worker가 있을 때 주력 AI TTS.
2. MeloTTS: 설치된 경우 로컬 무료 AI 대체.
3. System Voice·Browser Speech: 운영체제·공개 Web 재생 안전망.
4. 외부 과금형 음성 공급자는 과거 선택 정책를 서버 운영자가 명시한 경우에만 후보가 된다.
5. GPT-SoVITS·Fish Audio는 라이선스·운영 검증 전 평가 후보이며 Kokoro는 주력에서 제외한다.
현재 진실:
- CosyVoice 일반 TTS와 Cloud Adapter 경계가 구현됐지만 기본 free-only에서는 과금형을 등록하지 않는다.
- 자격 증명·Worker·동의된 기준 음성이 준비된 엔진만 자동 후보가 된다.
- 릴리스 ZIP에는 모델 가중치, PyTorch, CUDA, CosyVoice 저장소가 없다.
- Worker는 매니페스트·라이선스 동의·SHA-256·하드웨어 검증 전 모델 adapter를 로딩하지 않는다.
- 모델 미설치 시 `/health`는 정상이어도 `/ready`는 not-ready다.
- 실제 한국어 자연스러움, 화자 유사도, 지연, VRAM 벤치마크는 미완료다.
- 현재 기본 제작 흐름은 사용자가 작성한 장문 내용을 정확히 음성화하는 데 집중한다.
- 자동 대본 작성 LLM은 핵심 제작 경로에 포함하지 않으며, 별도 검증 전까지 성공 상태로 노출하지 않는다.
## 9. 주요 API 계약
API prefix `/api/v1`:
```text
GET  /health
GET  /setup
GET  /connectivity
GET  /engines
GET  /engines/strategy
POST /tts/synthesize
GET  /tts/jobs/{job_id}
GET  /tts/jobs/{job_id}/events
GET  /tts/jobs/{job_id}/result
DELETE /tts/jobs/{job_id}
GET  /audio/{filename}
GET  /quality/diagnostics
POST /quality/preview
POST /quality/compare
GET  /voice-clones/capabilities
POST /voice-clones/profiles
DELETE /voice-clones/profiles/{profile_id}
POST /voice-clones/profiles/{profile_id}/jobs
GET  /voice-clones/jobs/{job_id}
GET  /voice-clones/jobs/{job_id}/events
POST /voice-clones/jobs/{job_id}/cancel
POST /voice-clones/jobs/{job_id}/retry
GET  /voice-clones/jobs/{job_id}/audio
```
Worker:
```text
GET  /health
GET  /ready
GET  /v1/diagnostics
POST /v1/jobs
GET  /v1/jobs/{job_id}
GET  /v1/jobs/{job_id}/events
POST /v1/jobs/{job_id}/cancel
POST /v1/jobs/{job_id}/retry
GET  /v1/jobs/{job_id}/audio
GET  /v1/jobs/{job_id}/segments/{index}/audio
```
## 10. API 주소와 자동 탐색
Web 내부 키:
- `sorion-api-last-good-url`: 마지막 성공 주소.
- `sorion-api-url-history`: 최근 정상 주소 최대 5개.

## Archived history

- 오래된 상세 이력은 `docs/archive/HANDOVER_HISTORY_PRE_0_9_3.md`로 분리했습니다.
- 최신 개발자는 이 문서 상단의 현재 기준선과 `docs/NEXT_UPDATE.md`를 우선합니다.

## 18. 알려진 제한과 위험
- GitHub Pages만으로 서버 AI 합성은 불가능하며 별도 HTTPS FastAPI가 필요하다.
- 공개 API가 없으면 Browser Speech만 재생되며 AI·WAV 다운로드·복제는 준비되지 않는다.
- CosyVoice는 모델·GPU·동의된 기준 음성이 별도 필요하고 free-only는 과금형 API를 호출하지 않는다.
- Web Speech 받아쓰기는 브라우저 지원과 권한에 따라 동작하지 않을 수 있다.
- 장문 TTS는 첫 구간 파일 준비 시간을 측정하지만 해당 구간을 Web에 즉시 전달·재생하는 partial-ready 경로는 아직 없다.
- `first_audio_ms`는 서버 파일 준비 시간이며 브라우저 decode·`playing`·실제 스피커 출력 시작을 포함하지 않는다.
- Browser Speech의 실제 `onstart` 지표는 아직 수집하지 않으며 `null`을 유지한다.
- 공개 Bridge 진단은 프록시 forwarded header를 사용하므로 신뢰 프록시 allowlist 강화가 필요하다.
- 자동 탐색은 보안상 전체 LAN을 스캔하지 않는다.
- 정식 npm·uv lock 생성은 패키지 저장소 가용성에 영향을 받지만 component별 실패 범위로 격리한다.
- Heartbeat 6.6부터 CI는 lock을 자동 커밋하지 않는다. `generate_lockfiles=true` 결과는 artifact로 검토한 뒤 사람이 커밋한다.
- 모든 API 프로세스는 같은 SQLite job 파일을 공유해야 한다.
- memory fallback은 앱 종료 뒤 영구 복원되지 않는다.
## 19. 절대 전달 규칙
최종 응답 순서:
1. 결과.
2. 전체 통파일 ZIP, 덮어쓰기 가능한 패치 ZIP, SHA-256.
3. 다음 예상 업데이트 내역.
모든 릴리스에서 갱신:
- `docs/HANDOVER.md`.
- `docs/CHANGELOG.md`.
- `docs/NEXT_UPDATE.md`.
- `FOUNDATION_REPORT.md`.
- `docs/patches/{version}`.
## 20. 검증 기준
필수:
```text
npm run quality:rules
npm run lint
npm run typecheck
npm run test
cd services/api && uv run --python 3.10 ruff check app tests
cd services/api && uv run --python 3.10 pytest tests -q
cd services/worker && uv run --python 3.10 ruff check app tests
cd services/worker && uv run --python 3.10 pytest tests -q
npm run build
```
네트워크 제한 시 실행하지 못한 항목과 이유를 결과 보고서에 정확히 기록한다.
CI Hotfix 4 테스트 규칙:
- 브라우저 이벤트로 React 상태를 바꾸는 테스트는 `act()` 또는 Testing Library `fireEvent`로 감싼다.
- placeholder 같은 변경 가능한 카피보다 maxlength, 접근성 이름, callback 같은 제품 계약을 검증한다.
- `scripts/check-web-test-contracts.mjs`가 두 규칙의 핵심 회귀를 CI 앞단에서 차단한다.
## 21. 다음 목표
다음 목표 버전: **0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery**.
우선순위:
1. 0.11.25 R1을 GitHub Actions에서 critical/full Vitest, semantic typecheck, lint, Vite build까지 녹색으로 고정하고 실제 카카오톡 Android/iOS에서 preset 미리듣기와 종료 확인 `계속 만들기`를 재검증한다.
2. desktop 1024/1280/1440과 mobile 360/390/430 Chromium evidence에서 workspace, Voice Picker/Drawer, multi stale recovery dialog를 scene별로 분리 확인한다.
3. 실제 MY VOICE Worker와 동의된 프로필이 있을 때만 stale profile 교체 후 재생성 성공과 first-audio latency를 측정한다.
4. Web quality와 모바일 WebView 검증이 녹색인 상태에서만 TimelineEditor의 남은 rendering/keyboard orchestration 책임 추가 분리를 판단한다.
5. 승인되지 않은 pixel baseline이나 실제 모델·실기기 증거가 없는 결과를 완료 증거로 승격하지 않는다.
금지: CI/모바일 failure 확인 상태에서 새 기능 진행, 측정 전 병렬도 자동 상향, 대규모 rewrite와 기능 추가 동시 진행, 동의·권리 없는 음성 포함, 모델 없는 성공 표시.
## 22. 변경 이력 보존 위치
- 0.7.3 이전 MASTER HANDOVER:
  `docs/archive/HANDOVER_MASTER_0.7.3.md`.
- 0.5.8~0.7.2 상세 기록:
  `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
- 전체 버전 요약:
  `docs/CHANGELOG.md`.
- 0.8.0~0.9.3 Heartbeat 6.8.0 상세 이력:
  `docs/archive/HANDOVER_HISTORY_0.8.0_TO_0.9.3_HEARTBEAT_6.8.0.md`.
## 23. 과거 상세 이력 archive

0.8.0~0.9.3 Heartbeat 6.8.0의 상세 릴리스 이력은 `docs/archive/HANDOVER_HISTORY_0.8.0_TO_0.9.3_HEARTBEAT_6.8.0.md`로 이동했습니다. 현재 목표·규칙·아키텍처·제한과 0.11.x 최신 이력은 이 본문을 기준으로 합니다.

0.11.4~0.11.9 상세 릴리스 이력은 `docs/archive/HANDOVER_HISTORY_0.11.4_TO_0.11.9.md`로 이동했습니다. 현재 목표·규칙·아키텍처·제한과 최근 릴리스 이력은 이 본문을 기준으로 합니다.

## 2026-10-10 KST · 0.11.35-r4-windows-npm

1. 작업 일시: 2026-10-10 KST.
2. 대상/기준: 0.11.35 R4 / 로컬 R3, Git b544e44. 제품 semver 0.11.35 유지.
3. 변경 내용: Windows npm 실행을 Node CLI 직접 실행으로 보정하고 POSIX shell 전용 lock fallback fixture를 플랫폼 독립 Node fixture로 교체했습니다. shell을 사용하지 않으며 공백과 &가 포함된 임시 경로에서도 fallback과 기존 lock 복원을 검증합니다.
4. 이유: Windows preflight가 selected-registry.txt ENOENT로 실패했고 spawnSync npm이 Windows cmd launcher를 직접 실행할 수 없었습니다.
5. 영향: npm 의존성 설치/lock bootstrap/정적 검사. 제품 음성 런타임 변경 없음.
6. 주요 파일: scripts/{lock-retry,refresh-npm-lock,check-lock-network-retry}.mjs, 인수인계/변경/다음 계획/패치 문서.
7. 검증: Repository preflight 55/55 PASS, 실제 Windows npm CLI 실행 PASS, npm ci --ignore-scripts 성공(557 packages), typecheck PASS, lint PASS, Vitest 75 files / 283 tests PASS, Vite build PASS, lock fallback/restoration fixture PASS. API/Worker, 실제 음성 모델, Android/iOS, 배포 화면 검증은 이번 개발 도구 수정 범위에서 미실행. build에 500kB chunk 권고가 남습니다. 로컬 Node 24.16.0/npm 11.13.0이며 CI 고정 런타임 재검증은 Push 후 필요합니다.
8. 제한: 공유 ChatGPT 링크 내용을 읽지 못했으며 실제 Pages 화면/서버 연결은 미검증. 검증된 로컬 코드를 GitHub Desktop Changes에서 검토한 뒤 사용자가 commit/push합니다.
9. 산출물: SoriON-AI-0.11.35-r4-windows-npm-full.zip, SoriON-AI-0.11.35-r3-to-0.11.35-r4-windows-npm-patch.zip, SHA256SUMS.txt. 저장 위치는 현재 Codex 작업공간의 SoriON-delivery/0.11.35-r4-windows-npm.
10. 다음: 0.11.36 Prosody Director & Long-form Naturalness. CI green과 승인된 실제 음성 자산이 선행 조건.

## 2026-10-11 KST · 0.11.36 Calm Studio & Research-led UX

1. 작업 일시: 2026-10-10~11 KST.
2. 대상/기준: 0.11.36 / 0.11.35 R4, Git bb7a05d. 이전 CI run 38059497704 success 확인.
3. 변경: 서비스 6곳·오픈소스 11개 공식 조사, 밝은 소개/차분한 편집 화면, 3단계 흐름, 빈 대본 예제 3종, 반응형 가독성·44px 주요 도구 버튼, reduced motion, sticky 헤더 스크롤 보정, 빈 재생 컨트롤 숨김.
4. 이유: 사용자 요청에 따라 장문·한국어·다화자 작업을 처음 사용하는 사람도 쉽게 시작하도록 개선했습니다.
5. 영향: React UI/CSS/진입 정렬과 버전 metadata. 엔진·동의·권리·동시성 경계 유지, 새 의존성 없음.
6. 주요 파일: LandingHome, LongformComposer, DubbingStudioHeader, LinkedPlayerDock, App, studioEntryNavigation, studio-calm.css, UIUX_RESEARCH_0.11.36.md, 변경·계획·패치 문서. 관련 동작 회귀 테스트 보강.
7. 검증: lint PASS, TypeScript+Vite production build PASS, 전체 Vitest 75 files/285 tests PASS, 마지막 도크 스타일 변경 뒤 관련 3 files/30 tests PASS. Repository preflight 55/55 PASS. 실제 Chrome 320/360/390/430/768/1024/1280/1440px 가로 넘침·예제 입력·대본 보존·빈 플레이어 PASS, pageerror 0. 화면 캡처 육안 확인. 최종 증거: docs/validation/0.11.36-responsive.json.
8. 제한: 실제 Neural 모델·API/Worker pytest·모바일 실기기 검증은 이번 UI 범위에서 미실행. AI 음질 성공으로 표시하지 않음. 기존 500kB 초과 초기 JS 경고 유지(약 568kB/gzip175kB). 유사 서비스는 공식 자료 조사이며 로그인 후 음질/속도 실측 아님. pixel baseline 임의 승인 없음.
9. 산출물: SoriON-AI-0.11.36-calm-studio-full.zip, SoriON-AI-0.11.35-r4-to-0.11.36-calm-studio-patch.zip, SHA256SUMS.txt. Codex 작업공간 SoriON-delivery/0.11.36-calm-studio. 삭제 파일 없음.
10. 다음: 0.11.37 Prosody Director & Listening Verification. 기존 자연스러움 계획 이월, 승인 실제 음성·CI green 선행. 파형/Radix/STT는 비교 후보이며 이번 버전에 도입하지 않음.

## 2026-10-12 KST · 0.11.37 Intelligent Studio & Prosody Director

1. **작업 일시(KST)**: 2026-10-12.
2. **대상/기준 버전**: 0.11.37 / 0.11.36(c1e32fa).
3. **변경 내용**: 라벤더 스튜디오·성우 비교·로컬 대본 도우미, 성우별 호흡 정책, 실제 WAV 파형, 키보드·지연 로딩 개선.
4. **변경 이유**: 대규모 UIUX 개편과 성우 개성·한국어 장문 자연스러움·엔진 안정성 강화 요청.
5. **영향 범위**: Web Studio/Listening QA, API 구간 생성·병합·취소·preview cache. Worker 모델 자체는 변경 없음.
6. **주요 파일**: prosody_director.py, tts_pipeline.py, wav_tools.py, cosyvoice_worker_tts.py, AudioWaveform.tsx, StudioDirector.tsx, studio-intelligent.css, docs/INTELLIGENT_STUDIO_0.11.37.md.
7. **검증**: 웹 292 tests, API 244 passed/1 skipped, Worker 16 passed; lint/typecheck/build, Ruff, preflight 55/55, Chrome 8폭 및 선택창/타임라인. 배포 최종 결과는 Actions 확인.
8. **제한**: 승인 5성우 WAV·모델 미제공. 실제 Neural 음질·장문 청취·실기기 인증 미실행. 파형 20MB/5분 이하 WAV, cache 정책 변경에 따라 재검증 필요. 기존 보안·동의·무료 경계 유지.
9. **산출물**: SoriON-AI-0.11.37-intelligent-studio-full.zip / SoriON-AI-0.11.36-to-0.11.37-intelligent-studio-patch.zip / SHA256SUMS.txt.
10. **다음 업데이트**: 0.11.38 승인 reference 기반 실제 성우 청취·실측, 큰 파일 파형·초기 로딩·실기기 점검.

## 2026-10-12 KST · 0.11.38 Streamed Waveform & Leaner Controls

1. **작업 일시(KST)**: 2026-10-12.
2. **대상/기준 버전**: 0.11.38 / 0.11.37(d31cf73).
3. **변경 내용**: 128MiB/60분 WAV 순차 파형·진행률·취소·시간 제한·재시도, 성우 선택/설정창 lazy loading.
4. **변경 이유**: 큰 파일 전체 디코딩 메모리와 대기·취소 UX를 개선하고 초기 청크를 축소합니다.
5. **영향 범위**: Web 파형·선택창, 버전 메타데이터. 실제 엔진 prosody 정책은 변경 없음.
6. **주요 파일**: streamWavPeaks.ts/test.ts, AudioWaveform.tsx/test.tsx, DubbingVoiceControls.tsx/test.tsx, HomePage.test.tsx, docs/STREAMED_WAVEFORM_0.11.38.md.
7. **검증 결과**: 웹 전체 301개·추가 waveform 회귀(총303개), API 244/1 skipped, Worker16, lint/typecheck/build·preflight55/55, Chrome8폭·키보드·10분 WAV. Actions/배포 최종 확인.
8. **제한**: 승인 WAV·모델 미제공으로 실제 음질·장문 청취 보류. 128MiB/60분·지원 PCM 제한, 데이터 다운로드 필요, 실기기 실측 미실행, main510.81kB 경고 잔존.
9. **산출물**: SoriON-AI-0.11.38-streamed-waveform-full.zip / SoriON-AI-0.11.37-to-0.11.38-streamed-waveform-patch.zip / SHA256SUMS.txt.
10. **다음 업데이트**: 0.11.39 실제 승인 자산 기반 청취·성우 조정, 큰 파일 실기기 성능·초기 청크 개선. 기존 동의·무료·업로드 경계 유지.

## 2026-10-12 KST · 0.11.39 Readable Colors
1. **작업 일시(KST)**: 2026-10-12.
2. **대상/기준 버전**: 0.11.39 / 0.11.38(ea75729).
3. **변경 내용**: 따뜻한 회색 배경·진한 본문·차분한 보라 강조, 설정/타임라인/보조 제목/프로 패널의 색상 쌍 수정.
4. **변경 이유**: 배경과 주요 글씨 색이 겹쳐 눈이 아프다는 사용자 피드백. 밝은 테마와 기존 dark 하위 규칙 충돌을 해소.
5. **영향 범위**: CSS·Quality 선택 설명 색상·버전 메타데이터. 생성/재생/동의/엔진 정책 변화 없음.
6. **주요 파일**: readable-colors.css, styles/index.css, QualityPage.tsx, docs/READABLE_COLORS_0.11.39.md, validation/0.11.39-contrast.json.
7. **검증 결과**: Chrome17화면 대비 기준 미달0건(측정 대상), 웹303 tests/API244·1skip/Worker16, lint/typecheck/build·preflight55/55·Actions 최종 확인.
8. **제한**: 단색 텍스트 측정·육안 검토이며 전체 WCAG/실기기 피로도 인증 아님. 실제 승인 음성·모델 청취 보류.
9. **산출물**: SoriON-AI-0.11.39-readable-colors-full.zip / SoriON-AI-0.11.38-to-0.11.39-readable-colors-patch.zip / SHA256SUMS.txt.
10. **다음 업데이트**: 0.11.40 상태별/실기기 가독성·큰 파형 성능, 승인 자산 기반 청취. 다음 인수인계는1200줄 상한을 고려해 역사 archive 유지 필요.

## 2026-10-12 KST · 0.11.40 Workspace Polish & Project Deletion

1. 작업 일시(KST): 2026-10-12.
2. 대상/기준 버전: 0.11.40 / 0.11.39 (0a5f24d).
3. 변경 내용: 접기 버튼 별도 행, 프로젝트 목록/사이드바 삭제와 확인·취소·실패 재시도, 최근 목록 읽기 실패 안내, 확인창과 접기 버튼 색 대비 개선. 과거 이력 원문 archive 이동.
4. 변경 이유: 새 작업/접기 버튼 겹침, 프로젝트 삭제 부재와 작은 조작·색상 불편 해결.
5. 영향 범위: Web UI/IndexedDB의 저장 프로젝트 항목. 현재 편집 내용·다운로드 파일·서버 음성은 유지.
6. 주요 파일: WorkspaceProjectRail, ProjectDeleteButton, ProjectsPage/tests, projectRepository, readable-colors.css, 버전·릴리스 문서.
7. 검증 결과: Web 79파일/305 PASS, API 244 PASS/1 skip, Worker 16 PASS, lint/typecheck/build PASS, preflight 55/55 PASS. 브라우저 5개 폭 삭제·보존·겹침 확인. 상세 WORKSPACE_POLISH_0.11.40.md.
8. 제한: 로컬 저장 프로젝트 삭제는 되돌릴 수 없음. 서버 음성/샘플 삭제와 별도이며 확인창에서 안내. 전체 접근성 인증 아님.
9. ZIP: SoriON-AI-0.11.40-workspace-polish-full.zip / SoriON-AI-0.11.39-to-0.11.40-workspace-polish-patch.zip.
10. 다음 예상 업데이트: 0.11.41 · 상태별 조작/가독성과 초기 로딩 개선, 실제 음질 검증은 승인 자산 필요.
