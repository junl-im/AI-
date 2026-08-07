# 곰같은여우 SoriON AI

**무료 로컬 실행을 기준으로 설계한 한국어 장문 Voice Studio**

SoriON AI는 대본·오디오북·강의·광고 내용을 문장별 음성 블록으로 편집하고 순차 제작하는
모바일과 PC 편집을 함께 지원하는 작업공간입니다. 엔진과 API는 시스템이 자동 연결하며 결제 계정이 필요한 음성
Adapter는 프로젝트에 포함하지 않습니다.

## 현재 상태

- 버전: `0.10.7 · Recovery Evidence & Voice Inventory Diagnostics`
- 성능 보호: 같은 모델·장치·프리셋의 최초 5건과 최근 5건을 분리 비교해 회귀를 표시합니다.
- 운영자 기준선: 최근 5건을 SHA-256 snapshot으로 확정하고 자동 기준선과 별도로 교체·폐기 이력을 관리합니다.
- 기준선 복구: append-only history에서 과거 기준선을 비교 미리보기한 뒤 `restored` 이벤트로 되살리며 기존 기록은 삭제하지 않습니다.
- 다중 클립 편집: `Ctrl/Cmd` 다중 선택과 `Shift` 범위 선택 뒤 선택 클립을 일괄 이동·삭제하고, 단일 선택은 빠른 편집기를 유지합니다.
- 복구 검증: 장시간 검사 중 Worker를 실제 재시작하고 45초 이내 자동 복구와 이전 실행 대비 회귀를 기록합니다.
- soak 비교 UI: `runtime-soak/2` 이전·현재 JSON을 Quality Lab에서 직접 열어 응답·성공률·누수·복구 회귀를 비교합니다.
- 복귀 경로 주입: 실제 네트워크를 끊지 않고 online·pageshow/focus·Network Information change 처리 경로를 안전하게 재실행합니다.
- 음성 inventory: Web Speech API 음성 목록 fingerprint 변화를 감지하고 프리셋 배정·엔진 카탈로그를 즉시 다시 평가합니다.
- 잠금 확장: 승인 writer는 `WriterLeaseCoordinator` 인터페이스를 사용하며 SQLite fencing을 기본 backend로 유지합니다.
- PC 폭 계약: 1024·1280·1440px의 3분할 중앙 작업 폭을 자동 회귀 검사합니다.
- 승인 구조: 해시·diff, 원자 저장·history, 증거 갱신 대기열을 독립 모듈로 분리했습니다.
- 감사 내보내기: 실제 WAV·사용자 식별자·GPU 원문·비밀키를 제외한 검증 가능 ZIP을 제공합니다.
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 CosyVoice Adapter
- 장문 제작: 최대 20,000자 내용과 문장별 재생성
- 자동 순서: CosyVoice → MeloTTS → System Voice → Browser Speech
- 프리셋 복구: 서버 엔진이 특정 프리셋만 표현하지 못하면 `SOA-4022`로 구분하고 auto 요청은 호환 Browser Speech까지 계속 시도
- 로컬 이중화: Windows/macOS System Voice가 프리셋과 맞지 않으면 설치된 eSpeak 한국어 백엔드를 보조 경로로 시도
- 진행 상태: SSE 우선, polling 자동 대체
- 세션: IndexedDB 자동 저장과 SQLite 결과 복구
- 배포: GitHub Pages 또는 Firebase Hosting Spark 정적 Web
- CI: 커밋된 lock 검증, lint·typecheck·Vitest·build 단일 실행기와 로그·dist SHA-256 증거 보고서
- Firebase: `device-streaming-96b2272c` Web Auth 공개 설정 연결, Firestore·Storage 기본 전면 차단
- PWA: 1024px 최적화 로고와 1.5MiB 사전 캐시 예산 검사
- 모바일: 인앱 브라우저에서도 연결 기술 상태를 노출하지 않고 가능한 음성 경로를 자동 선택
- 재생 UX: 재생을 누르는 즉시 일시정지 버튼으로 바뀌고, 다시 누르면 재생 버튼으로 돌아오는 순차 제어
- 프리셋: 여성 1종·남성 3종·중성 1종, 반대 성별과 CosyVoice 기본 WAV 대체는 차단하고 제한된 시스템 음성은 같은 성별 안에서 프리셋 운율로 구분
- 고급 진단: 설정의 접힌 개발자 영역에서만 API·TTS·Worker·GPU·프리셋 상태와 개인정보 제외 진단을 확인
- PC 편집: 1024px부터 3단 분할, 재생 버튼 바로 옆 진행바를 둔 한 줄 Compact Dock, 클릭 seek·확대·단축키와 선택 클립 빠른 편집기를 갖춘 가로 타임라인
- 자동 음성 준비: 일반 화면에는 기술 연결 상태를 숨기고 가장 빠른 경로를 병렬 탐색·자동 재연결·heartbeat로 유지
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
- 실기기 recorder: 10·30·60분 wall-clock 측정과 SSE·fetch·재생 중단 시간을 저장하고 기기·엔진·프리셋별 P95를 집계
- Export 보존: 서버 임시 만료 시각을 표시하고 사용자가 내려받은 음원·SRT·VTT만 보존본으로 취급
- CI 안정화: 복원 자동재생 차단, 부분→최종 음원 위치·상태 승계, visibility 시계와 SSE/WAV 테스트 fixture를 GitHub Actions 계약에 맞게 보강
- Stream 안정화: `ReadableStream.tee()` probe 취소를 재생 분기 소비 뒤 완료해 첫 구간 준비 교착을 차단하고, 최종 WAV 교체 테스트는 실제 DOM source 반영 순서를 따름
- Web 품질 증거: 동일한 7단계 실행 계획, 단계별 로그 SHA-256, package lock 입력 해시와 dist 파일 manifest를 CI artifact로 보존
- 필드 증거 manifest: 개인정보 최소 레코드별 SHA-256과 묶음 SHA-256을 만들고 다운로드 직전 서버에서 다시 검증
- 증거 Intake: field evidence v2와 Web quality run report를 5MiB 제한·서버 checksum 재검증·bundle/record 중복 차단 뒤 등록
- 로컬 Export ZIP: WAV·MP3·SRT·VTT·JSON 최대 20개/250MiB를 서버 업로드 없이 SHA-256 manifest, 진행률과 취소를 포함해 묶음
- Lock gate: repository preflight가 package-lock 존재와 package.json 직접 의존성 일치를 필수 검사하며 패치는 기존 검증 lock을 보존
- 음성 정합성: 전용 인물 WAV가 없으면 시스템 근사 음성으로 처리하며 같은 성별 후보는 프리셋 운율로 재사용하고 반대 성별은 차단
- 프리셋 증거: 전용 WAV는 동일 ID manifest의 동의·권리·사람 검수·SHA-256과 실제 파일 일치가 모두 확인돼야 사용
- 중복 차단: 같은 WAV SHA-256을 여러 인물 프리셋에 등록하면 진단과 실제 CosyVoice 합성 모두 차단
- A/B 검수: Quality Lab에서 5개 프리셋을 선택해 같은 문장·같은 엔진으로 비교하고 프리셋 메타데이터와 판정을 저장
- 브라우저 증거: Engine Doctor가 현재 기기의 실제 Web Speech 음성명·URI·성별 판정 근거·후보 부족 사유를 표시
- 검수 동기화: Quality Lab 평가를 SHA-256 검증 JSON 묶음으로 내보내고 다시 가져오되 manifest 승인을 자동 변경하지 않음
- 검수 무효화: 승인 시점 WAV SHA-256과 현재 파일이 다르면 `stale`로 차단하고 재청취를 요구
- 만료 경고: 동의·권리 만료 30일 전부터 Engine Doctor에 남은 일수와 경고를 표시
- 실제 화자 텔레메트리: Windows System.Speech와 MeloTTS의 선택 화자·speaker ID·성별 판정·선택 근거를 표시
- benchmark 분리: 모델 ID·버전·digest·가속 장치·GPU·프리셋별 first audio·RTF·실패율·handoff P95 집계
- 수동 승인: 현재 WAV·manifest·검수 묶음 checksum을 다시 계산한 diff 미리보기 뒤에만 manifest v3 승인을 적용
- 승인 감사·롤백: 승인 전후 manifest snapshot과 연결 ID를 JSONL로 보존하고 현재 manifest가 달라진 경우 롤백 거부
- 선택적 신뢰 서명: 로컬 HMAC 키가 설정된 경우 승인 payload를 서명·검증하며 키가 없으면 명시적으로 unsigned 처리
- Worker 자동 텔레메트리: 짧은 합성의 모델 digest·GPU·first audio·RTF·handoff를 실기기 soak와 별도 저장
- benchmark 대시보드: Worker 자동 측정과 10·30·60분 soak를 분리하고 모델·GPU·프리셋별 P50/P95 표시
- 승인 접근 제어: loopback은 기존처럼 토큰 없이 사용하고 LAN·외부는 32자 이상 운영자 토큰을 요구
- 승인 경합 차단: apply·rollback의 상태 재검사와 manifest·WAV 쓰기를 같은 잠금 안에서 수행
- CI 품질 복구: Ruff 최신 규칙과 Web 타입 계약을 맞추고 재유입 preflight를 추가
- CI Hotfix: 승인 서비스 import 순서를 Ruff isort 기준으로 고정하고 플레이어 테스트의 초기 media pause와 사용자 pause를 분리
- 상시 연결: API 후보 병렬 탐색, 12초/45초 heartbeat, 60초 전체 갱신, 포커스·페이지 복귀 자동 재연결과 API↔Worker keep-alive
- 신뢰 키 교체: 새 승인·재서명은 active HMAC 키만 사용하고 previous key는 grace 기간 검증 전용으로 유지
- 증거 갱신 대기열: 동의·권리 만료, WAV 결박 불일치, unsigned·이전 키 상태를 자동 분류하되 만료일은 자동 연장하지 않음
- 승인 파일 보호: apply·재서명·rollback을 같은 호스트의 API 프로세스 간 파일 잠금과 원자 쓰기로 직렬화
- writer fencing: SQLite lease의 증가 토큰을 실제 쓰기 직전에 재검증해 만료된 writer 반영을 차단
- 장시간 안정성: 수동 5·30·60분 및 주간 30분 API·Worker soak로 성공률·복구·메모리·열린 연결 증가를 기록
- 감사 ZIP: redacted JSON, 파일별 SHA-256 manifest와 포함 범위 README만 묶어 다운로드

### 버전 올리기

```bash
npm run version:set -- 0.10.6
npm run quality:version-sync
```

첫 화면에는 제품 버전만 표시하며 Engine Heartbeat와 배포 revision은 설정의 고급 빌드 정보에서만 확인합니다.

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
- 자동 연결 Runtime: [`docs/SEAMLESS_ENGINE_RUNTIME.md`](docs/SEAMLESS_ENGINE_RUNTIME.md)
- 공개 HTTPS Bridge: [`docs/SECURE_MOBILE_BRIDGE.md`](docs/SECURE_MOBILE_BRIDGE.md)
- 첫 음성 준비 지연: [`docs/FIRST_AUDIO_LATENCY.md`](docs/FIRST_AUDIO_LATENCY.md)
- 부분 음원 전달: [`docs/PARTIAL_AUDIO_DELIVERY.md`](docs/PARTIAL_AUDIO_DELIVERY.md)
- 순차 구간 재생: [`docs/ORDERED_SEGMENT_PLAYBACK.md`](docs/ORDERED_SEGMENT_PLAYBACK.md)
- 브라우저 기기 증거: [`docs/BROWSER_DEVICE_EVIDENCE.md`](docs/BROWSER_DEVICE_EVIDENCE.md)
- seam·재생 복원: [`docs/SEAM_METRICS_AND_SESSION_RESTORE.md`](docs/SEAM_METRICS_AND_SESSION_RESTORE.md)
- 서명 음원 재발급: [`docs/SIGNED_AUDIO_REHYDRATION.md`](docs/SIGNED_AUDIO_REHYDRATION.md)
- 실기기 인증 계약: [`docs/REAL_DEVICE_CERTIFICATION.md`](docs/REAL_DEVICE_CERTIFICATION.md)
- 실기기 soak recorder: [`docs/DEVICE_SOAK_RECORDER.md`](docs/DEVICE_SOAK_RECORDER.md)
- recovery evidence·음성 inventory: [`docs/RECOVERY_EVIDENCE_AND_VOICE_INVENTORY.md`](docs/RECOVERY_EVIDENCE_AND_VOICE_INVENTORY.md)
- 음원 보존 정책: [`docs/AUDIO_ARCHIVE_POLICY.md`](docs/AUDIO_ARCHIVE_POLICY.md)
- 음성 프리셋: [`docs/VOICE_PRESETS.md`](docs/VOICE_PRESETS.md)
- 프리셋 음성 정합성 계약: [`docs/VOICE_PRESET_FIDELITY.md`](docs/VOICE_PRESET_FIDELITY.md)
- 프리셋 동의·권리·checksum 증거: [`docs/VOICE_PRESET_EVIDENCE.md`](docs/VOICE_PRESET_EVIDENCE.md)
- 프리셋 검수 묶음·실제 화자 텔레메트리: [`docs/VOICE_REVIEW_SYNC.md`](docs/VOICE_REVIEW_SYNC.md)
- 프리셋 수동 승인·서명·롤백: [`docs/VOICE_REVIEW_APPROVAL.md`](docs/VOICE_REVIEW_APPROVAL.md)
- 신뢰 키 교체·증거 갱신 대기열: [`docs/TRUST_KEY_ROTATION_AND_RENEWAL.md`](docs/TRUST_KEY_ROTATION_AND_RENEWAL.md)
- Worker 자동 텔레메트리·benchmark 대시보드: [`docs/BENCHMARK_DASHBOARD.md`](docs/BENCHMARK_DASHBOARD.md)
- UI/UX 점검: [`docs/UI_UX_AUDIT_HEARTBEAT_5_2.md`](docs/UI_UX_AUDIT_HEARTBEAT_5_2.md)
- lock 생성·검증: [`docs/LOCKFILE_BOOTSTRAP.md`](docs/LOCKFILE_BOOTSTRAP.md)
- 재현 가능한 Web 품질: [`docs/REPRODUCIBLE_WEB_QUALITY.md`](docs/REPRODUCIBLE_WEB_QUALITY.md)
- 필드 증거 manifest: [`docs/FIELD_EVIDENCE_MANIFEST.md`](docs/FIELD_EVIDENCE_MANIFEST.md)
- 증거 가져오기·로컬 ZIP: [`docs/EVIDENCE_INTAKE_AND_LOCAL_BUNDLE.md`](docs/EVIDENCE_INTAKE_AND_LOCAL_BUNDLE.md)

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

일반 push·PR은 커밋된 `package-lock.json`이 manifest와 일치할 때만 `npm ci`로 검증합니다. lock이 없거나 stale이면
즉시 실패하며 CI는 source branch를 수정하거나 자동 커밋하지 않습니다. 공식
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
