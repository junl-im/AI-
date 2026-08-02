# SoriON AI 0.9.3-beta.3 Verification Report

결과 버전: **0.9.3-beta.3 · Engine Heartbeat 3**

## Engine Heartbeat 3

- 설정에 Engine Doctor를 추가해 API·실제 TTS·CosyVoice Worker·GPU와 설치 단계를 한 번에 진단합니다.
- 음성 시스템 주소 저장·즉시 재진단·자동 연결 복구와 개인 음원·로컬 경로를 제외한 상태 복사를 제공합니다.
- `START_ENGINE.cmd` 실행 시 프로젝트의 `voice-presets` 폴더를 API에 자동 연결합니다.
- Setup API가 프리셋 WAV 3종의 준비 개수와 누락 파일을 명시적으로 반환합니다.
- 500줄 하드 제한을 폐기하고 800줄 분리 권고, 1,200줄 안전 상한으로 완화했습니다.

## Engine Heartbeat 2

- 카카오톡 인앱 브라우저를 User-Agent로 감지해 PC localhost 엔진 연결 불가를 즉시 안내하고 외부 브라우저 전환 버튼을 제공합니다.
- 프리셋·설정·타임라인·대기열의 재생 버튼은 선택값을 자동 적용한 뒤 생성 또는 선택된 트랙을 즉시 재생합니다.
- Browser Speech는 프리셋별 한국어 음성 후보, 속도와 높낮이를 적용하고 System·Melo도 같은 프리셋 운율을 사용합니다.
- CosyVoice는 `sori-warm.wav`, `on-clear.wav`, `dam-calm.wav`를 실제 Worker 기준 음성으로 라우팅하며 없는 경우 기본 기준 음성으로 폴백합니다.
- 기기에 한국어 음성이 하나뿐이면 Browser/System 프리셋 차이는 음색이 아니라 속도·높낮이 중심으로 제한됩니다.

## CI Hardening 6

- `sorion-logo.png`를 1254px RGBA 2.46MB에서 1024px RGB 약 1.01MB로 최적화해 Workbox 2MiB 제한 아래로 낮췄습니다.
- `.env.development`와 `.env.production`에 공개 Firebase Web 설정을 등록해 로컬 개발과 GitHub Pages production build에서 자동 로드합니다.
- `.firebaserc`를 `device-streaming-96b2272c`에 연결하고 Firestore·Storage는 deny-by-default 규칙으로 잠갔습니다.
- preflight와 Web build가 PWA asset budget 및 Firebase 설정 일관성을 검사합니다.

## CI Hardening 5

- Ruff 0.15.22 기준으로 verification route가 `app.services.stt_evaluation` 모듈을 한 번만 import하도록 정리했습니다.
- 누락되거나 manifest와 불일치한 package-lock은 CI가 cache 우선·제한 registry fallback으로 자동 bootstrap하고, 정상 lock은 verify-only로 처리합니다.
- npm Firebase SDK 의존성을 제거하고 고정 버전 공식 browser ESM을 로그인 시점에만 동적으로 로드합니다.
- lock 생성 실패 로그와 기존 lock 복원, 설치·전체 트리·SHA-256 proof 계약을 유지합니다.
- local `GENERATE_WEB_LOCK`은 필수 단계가 아니라 registry 장애 시 사용할 수 있는 복구 수단입니다.

## 완료

- 장문 WAV 병합을 청크 스트리밍으로 바꿔 구간 전체와 긴 쉼을 한 번에 메모리에 올리지 않습니다.
- WAV·SRT·VTT·MP3를 임시 파일로 완성한 뒤 최종 이름으로 교체하며 오류 시 부분 산출물을 삭제합니다.
- FFmpeg에 hard timeout을 추가하고 ffprobe로 실제 MP3 컨테이너 길이를 측정합니다.
- 10·30·60분 WAV·MP3 soak 6개 시나리오의 RTF, 메모리, 길이, 자막 드리프트를 JSONL로 기록합니다.
- 선택 재생성 후 두 번째 STT 검수에서 같은 문장 ID의 전후 CER·WER와 핵심 토큰 개선량을 자동 저장합니다.
- Quality Lab에서 STT 개선 기록과 Export soak 진행률을 표시하고, 장치 이름과 메모가 제거된 증거 JSON을 내려받습니다.
- 기존 CI failure-domain 분리, lock SHA-256 proof, 최소 권한과 누적 삭제 차단을 유지합니다.

## 검증

- API pytest 123개 통과
- Worker pytest 14개 통과
- Python compileall 통과
- TypeScript·TSX 152개 파일 parser 검사 통과
- Repository preflight 11개 통과
- 신규 Engine Doctor TypeScript 핵심 파일 strict semantic 검사 통과
- 802줄 fixture는 경고 후 통과, 1,202줄 fixture는 1,200줄 안전 상한으로 실패
- Setup API 프리셋 0/3·2/3·3/3 진단 테스트와 실제 3/3 응답 확인
- 프로젝트 규칙, 폐기 파일, Web manifest, free-only, engine blueprint, 모델 onboarding 검사 통과
- 합성 무음 10·30·60분 WAV·MP3 6개 시나리오 완료
- WAV 길이·자막 드리프트 0ms, MP3 ffprobe 길이와 자막 차이 192ms 이내

## 해석 제한

합성 무음 soak는 파일 병합, FFmpeg, 컨테이너 길이와 자막 타임코드 안정성만 검증합니다. 실제 한국어 음질, CosyVoice 처리 속도, CUDA·MPS·모바일 메모리 성능을 증명하지 않습니다. 실제 장치·모델 증거는 `.sorion/quality`에 별도로 기록해야 합니다.

현재 샌드박스의 기본 npm registry에는 고정된 `@eslint/js@9.22.0`이 없었고 공식 npm registry 직접 설치도 제한 시간 안에 끝나지 않아 전체 ESLint·Vitest·Vite build는 GitHub Actions에서 최종 확인해야 합니다. 신규 Engine Doctor 파일은 별도 strict TypeScript semantic 검사까지 통과했습니다.
