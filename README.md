# 곰같은여우 SoriON AI

**무료 로컬 실행을 기준으로 설계한 한국어 장문 Voice Studio**

SoriON AI는 대본·오디오북·강의·광고 내용을 문장별 음성 블록으로 편집하고 순차 제작하는
모바일과 PC 편집을 함께 지원하는 작업공간입니다. 엔진과 API는 시스템이 자동 연결하며 결제 계정이 필요한 음성
Adapter는 프로젝트에 포함하지 않습니다.

## 현재 상태

- 버전: `0.9.3-beta.3 · Engine Heartbeat 6.4 · Signed Audio Rehydration & Device Certification`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 CosyVoice Adapter
- 장문 제작: 최대 20,000자 내용과 문장별 재생성
- 자동 순서: CosyVoice → MeloTTS → System Voice → Browser Speech
- 진행 상태: SSE 우선, polling 자동 대체
- 세션: IndexedDB 자동 저장과 SQLite 결과 복구
- 배포: GitHub Pages 또는 Firebase Hosting Spark 정적 Web
- CI: preflight 전체 진단, 구성요소별 lock 보존, 누락 npm lock의 검증된 자동 bootstrap
- Firebase: `device-streaming-96b2272c` Web Auth 공개 설정 연결, Firestore·Storage 기본 전면 차단
- PWA: 1024px 최적화 로고와 1.5MiB 사전 캐시 예산 검사
- 모바일: 카카오톡 WebView를 감지해 로컬 PC 엔진 제한과 외부 브라우저 전환을 즉시 안내
- 재생 UX: 보이는 재생 버튼이 선택값을 자동 적용하고 생성·선택된 음성을 즉시 재생
- 프리셋: 여성 1종·남성 3종·중성 1종의 Browser/System/Melo 운율 프로필과 CosyVoice 기준 음원 라우팅
- Engine Doctor: API·TTS·Worker·GPU·프리셋 5종 상태 진단, 주소 저장, 자동 연결 복구와 개인정보 제외 진단 복사
- PC 편집: 프로젝트 히스토리 / Chat Workspace / Voice Drawer 3단 분할과 CapCut형 가로 타임라인
- 엔진 표시: 우측 상단 API·Worker·GPU 3점 상태와 실패 시 작업 메시지 자동 알림
- 모바일 Bridge: 공개 HTTPS Origin을 `/connectivity`와 Engine Doctor에서 별도 진단
- 프리셋 안전성: WAV 포맷·길이·샘플레이트·무음·클리핑을 Worker 요청 전에 검사
- 지연 지표: 서버 첫 음성 파일 준비 시간과 전체 생성 시간을 분리 표시
- PC 레이아웃: 좌우 패널 드래그·키보드 조절, 접기와 로컬 상태 저장
- 설정 일관성: PC·모바일이 속도·높낮이·말투 6종을 같은 계약으로 사용
- 접근성: Sheet·확인창 초점 이동·Tab 순환·Escape 닫기·명시적 실행 버튼 복귀와 배경 스크롤 잠금
- 부분 음원: 준비된 WAV 구간을 번호순으로 이어 재생하고 대기·URL 재발급·최종 WAV 위치 승계를 처리
- 재생 지연: 서버 첫 구간·브라우저 첫 바이트·실제 재생·Browser Speech 시작을 분리 기록
- 기기 증거: HTTPS·EventSource·PWA·사용자 제스처 재생과 탭·네트워크 전환을 개인정보 최소 JSON으로 저장
- seam 실측: 이전 구간 ended부터 다음 구간 playing까지 평균·P95·최대·대기 포함을 기록하고 최종 WAV 위치 교체 오차를 분리
- 재생 복원: 작업 ID로 만료된 최종 HMAC URL을 재발급하고 대기열·위치를 새로고침 또는 재생 오류 뒤 복원
- Bridge 보안: 신뢰 CIDR의 직접 proxy만 전달 헤더를 사용하고 공개 rate-limit은 실제 client IP로 고정
- 실기기 인증: 단순 기록과 Android/iOS의 기본 재생·네트워크 전환·백그라운드 복귀·설치형 PWA 시나리오 READY를 분리

## 무료 실행

```bash
cp .env.example .env
npm install
npm run dev:free
```

배포된 웹에서 로컬 음성 엔진만 빠르게 연결하려면 Windows에서 `START_ENGINE.cmd`를 더블클릭합니다.
개발용 전체 Web·API 실행은 `start-sorion-free.cmd`를 사용할 수 있습니다. CosyVoice 모델을 준비한 경우
`npm run dev:free -- --worker`로 Worker까지 실행합니다. 모델 가중치와 GPU 런타임은 저장소와
릴리스 ZIP에 포함하지 않습니다.

## 정적 배포 동작

Firebase Hosting Spark와 GitHub Pages는 Web/PWA만 제공합니다. 데스크톱 정적 Web은 사용자 PC의
`127.0.0.1:8000` 무료 API를 자동 탐색하고, 모바일은 기기 내장 Browser Speech를 자동 사용합니다.
카카오톡 인앱 브라우저에서 연 링크는 휴대폰 자체 WebView이므로 PC의 localhost 엔진에 연결하지 않고,
브라우저 음성을 즉시 사용하면서 외부 브라우저 전환과 공개 HTTPS Voice API 사용을 안내합니다.
기본 흐름에서는 주소 입력을 요구하지 않으며, 설정의 Engine Doctor에서만 고급 진단·복구용 API 주소를 제공합니다.

## 주요 문서

- 시작: [`START_HERE.md`](START_HERE.md)
- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 무료 전용 엔진: [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
- Firebase Spark: [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- 오케스트레이터 설계: [`docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md`](docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md)
- AI Director: [`docs/AI_DIRECTOR.md`](docs/AI_DIRECTOR.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- 공개 HTTPS Bridge: [`docs/SECURE_MOBILE_BRIDGE.md`](docs/SECURE_MOBILE_BRIDGE.md)
- 첫 음성 준비 지연: [`docs/FIRST_AUDIO_LATENCY.md`](docs/FIRST_AUDIO_LATENCY.md)
- 부분 음원 전달: [`docs/PARTIAL_AUDIO_DELIVERY.md`](docs/PARTIAL_AUDIO_DELIVERY.md)
- 순차 구간 재생: [`docs/ORDERED_SEGMENT_PLAYBACK.md`](docs/ORDERED_SEGMENT_PLAYBACK.md)
- 브라우저 기기 증거: [`docs/BROWSER_DEVICE_EVIDENCE.md`](docs/BROWSER_DEVICE_EVIDENCE.md)
- seam·재생 복원: [`docs/SEAM_METRICS_AND_SESSION_RESTORE.md`](docs/SEAM_METRICS_AND_SESSION_RESTORE.md)
- 서명 음원 재발급: [`docs/SIGNED_AUDIO_REHYDRATION.md`](docs/SIGNED_AUDIO_REHYDRATION.md)
- 실기기 인증 계약: [`docs/REAL_DEVICE_CERTIFICATION.md`](docs/REAL_DEVICE_CERTIFICATION.md)
- 음성 프리셋: [`docs/VOICE_PRESETS.md`](docs/VOICE_PRESETS.md)
- UI/UX 점검: [`docs/UI_UX_AUDIT_HEARTBEAT_5_2.md`](docs/UI_UX_AUDIT_HEARTBEAT_5_2.md)
- lock 생성·검증: [`docs/LOCKFILE_BOOTSTRAP.md`](docs/LOCKFILE_BOOTSTRAP.md)

## 개발 원칙

- 장문 내용과 문장 블록 편집을 기본 흐름으로 유지합니다.
- 모바일·한국어를 먼저 완성합니다.
- 실제 AI, Local/System, Browser Voice, Mock을 명확히 구분합니다.
- 결제 수단과 외부 음성 공급자 Secret을 요구하지 않습니다.
- 소스 파일은 800줄부터 분리 권고를 표시하고 1,200줄 안전 상한만 배포를 차단합니다.
- 엔진과 API 선택은 사용자 설정이 아니라 자동 운영 계층에서 처리합니다.
- 코드와 모델 checkpoint의 라이선스를 분리해 기록하고 비상업 모델은 자동 경로에서 제외합니다.


## 삭제 파일 재발 방지

```bash
npm run cleanup:stale-brand
npm run quality:stale-files
npm run hooks:install
```

`public/sorion-icon.svg`는 영구 폐기 파일이며 Git 인덱스에서도 제거해야 합니다. 구형 lock selector는
삭제 대신 최신 호환 shim으로 덮어써 GitHub Desktop 복사 방식에서도 재발을 막습니다.

## 실기기·STT·Export

실기기 측정 기록, Faster Whisper 재생성 전후 CER·WER 증거와 10·30·60분 WAV·MP3·SRT·VTT soak 검증을 제공합니다.
세부 계약과 제한은 [`docs/REAL_DEVICE_STT_EXPORT.md`](docs/REAL_DEVICE_STT_EXPORT.md)를 따릅니다.

## 재현 가능한 CI 전환

0.9.3-alpha.3은 Node 22.18.0과 npm 10.9.3을 `.nvmrc`, `.node-version`, `packageManager`,
Volta에 동일하게 고정합니다. `vite-plugin-pwa 1.3.0`의 Vite 8 peer 선언과 전체 npm 트리를
검사하며, 일반 CI는 검증된 lock이 있어야 `npm ci`와 `uv sync --locked`로 진행합니다.

일반 push·PR은 `package-lock.json`이 manifest와 일치하면 `npm ci`로만 검증하고, 없거나 stale이면 CI가 cache 우선·제한
registry fallback으로 한 번 bootstrap해 설치·트리 검증을 통과한 lock만 main에 반영합니다. 공식
Firebase 브라우저 ESM은 고정 버전 URL로 런타임 로드해 npm의 대형 Firebase 의존성 그래프를 제거했습니다.
로컬 `GENERATE_WEB_LOCK` 스크립트는 선택적 복구 수단이며 API·Worker uv lock은 독립 작업을 유지합니다.

## 검증된 로컬 모델 준비

0.9.3-alpha.1부터 Worker는 모델 로딩 전에 매니페스트, 라이선스 동의와 SHA-256을 확인합니다.
실제 모델 파일과 라이선스를 확인한 뒤 Worker 루트에서 다음 명령으로 매니페스트를 만듭니다.

```bash
python scripts/model_manifest.py create \
  --model-path /models/Fun-CosyVoice3-0.5B \
  --output /models/Fun-CosyVoice3-0.5B/sorion-model-manifest.json \
  --model-id Fun-CosyVoice3-0.5B \
  --model-version <확인한-버전> \
  --license-name <확인한-라이선스>
```

`.env`에는 `SORION_WORKER_MODEL_MANIFEST_PATH`와 사용자가 직접 확인한
`SORION_WORKER_MODEL_LICENSE_ACCEPTED=true`를 설정합니다. 모델 체크섬과 동의값을 임의로
채우거나 저장소에 모델 가중치를 포함하지 않습니다.
