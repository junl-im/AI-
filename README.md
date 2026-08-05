# 곰같은여우 SoriON AI

**무료 로컬 실행을 기준으로 설계한 한국어 장문 Voice Studio**

SoriON AI는 대본·오디오북·강의·광고 내용을 문장별 음성 블록으로 편집하고 순차 제작하는
모바일과 PC 편집을 함께 지원하는 작업공간입니다. 엔진과 API는 시스템이 자동 연결하며 결제 계정이 필요한 음성
Adapter는 프로젝트에 포함하지 않습니다.

## 현재 상태

- 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 CosyVoice Adapter
- 장문 제작: 최대 20,000자 내용과 문장별 재생성
- 자동 순서: CosyVoice → MeloTTS → System Voice → Browser Speech
- 진행 상태: SSE 우선, polling 자동 대체
- 세션: IndexedDB 자동 저장과 SQLite 결과 복구
- 배포: GitHub Pages 또는 Firebase Hosting Spark 정적 Web
- CI: 커밋된 lock 검증, lint·typecheck·Vitest·build 단일 실행기와 로그·dist SHA-256 증거 보고서
- Firebase: `device-streaming-96b2272c` Web Auth 공개 설정 연결, Firestore·Storage 기본 전면 차단
- PWA: 1024px 최적화 로고와 1.5MiB 사전 캐시 예산 검사
- 모바일: 카카오톡 WebView를 감지해 로컬 PC 엔진 제한과 외부 브라우저 전환을 즉시 안내
- 재생 UX: 보이는 재생 버튼이 선택값을 자동 적용하고 생성·선택된 음성을 즉시 재생
- 프리셋: 여성 1종·남성 3종·중성 1종, 성별 불일치·동일 화자 중복 배정·CosyVoice 기본 WAV 대체를 차단
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
- 실기기 recorder: 10·30·60분 wall-clock 측정과 SSE·fetch·재생 중단 시간을 저장하고 기기·엔진·프리셋별 P95를 집계
- Export 보존: 서버 임시 만료 시각을 표시하고 사용자가 내려받은 음원·SRT·VTT만 보존본으로 취급
- CI 안정화: 복원 자동재생 차단, 부분→최종 음원 위치·상태 승계, visibility 시계와 SSE/WAV 테스트 fixture를 GitHub Actions 계약에 맞게 보강
- Stream 안정화: `ReadableStream.tee()` probe 취소를 재생 분기 소비 뒤 완료해 첫 구간 준비 교착을 차단하고, 최종 WAV 교체 테스트는 실제 DOM source 반영 순서를 따름
- Web 품질 증거: 동일한 7단계 실행 계획, 단계별 로그 SHA-256, package lock 입력 해시와 dist 파일 manifest를 CI artifact로 보존
- 필드 증거 manifest: 개인정보 최소 레코드별 SHA-256과 묶음 SHA-256을 만들고 다운로드 직전 서버에서 다시 검증
- 증거 Intake: field evidence v2와 Web quality run report를 5MiB 제한·서버 checksum 재검증·bundle/record 중복 차단 뒤 등록
- 로컬 Export ZIP: WAV·MP3·SRT·VTT·JSON 최대 20개/250MiB를 서버 업로드 없이 SHA-256 manifest, 진행률과 취소를 포함해 묶음
- Lock gate: repository preflight가 package-lock 존재와 package.json 직접 의존성 일치를 필수 검사하며 패치는 기존 검증 lock을 보존
- 음성 정합성: 전용 인물 WAV가 없으면 시스템 근사 음성임을 표시하고, 호환 후보가 없을 때 다른 성별이나 같은 음성을 성공으로 처리하지 않음
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
- 실기기 soak recorder: [`docs/DEVICE_SOAK_RECORDER.md`](docs/DEVICE_SOAK_RECORDER.md)
- 음원 보존 정책: [`docs/AUDIO_ARCHIVE_POLICY.md`](docs/AUDIO_ARCHIVE_POLICY.md)
- 음성 프리셋: [`docs/VOICE_PRESETS.md`](docs/VOICE_PRESETS.md)
- 프리셋 음성 정합성 계약: [`docs/VOICE_PRESET_FIDELITY.md`](docs/VOICE_PRESET_FIDELITY.md)
- 프리셋 동의·권리·checksum 증거: [`docs/VOICE_PRESET_EVIDENCE.md`](docs/VOICE_PRESET_EVIDENCE.md)
- 프리셋 검수 묶음·실제 화자 텔레메트리: [`docs/VOICE_REVIEW_SYNC.md`](docs/VOICE_REVIEW_SYNC.md)
- 프리셋 수동 승인·서명·롤백: [`docs/VOICE_REVIEW_APPROVAL.md`](docs/VOICE_REVIEW_APPROVAL.md)
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
