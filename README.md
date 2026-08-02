# 곰같은여우 SoriON AI

**무료 로컬 실행을 기준으로 설계한 한국어 장문 Voice Studio**

SoriON AI는 대본·오디오북·강의·광고 원고를 문장별 음성 블록으로 편집하고 순차 제작하는
모바일 우선 작업공간입니다. 엔진과 API는 시스템이 자동 연결하며 결제 계정이 필요한 음성
Adapter는 프로젝트에 포함하지 않습니다.

## 현재 상태

- 버전: `0.9.3-beta.1 CI Hotfix 2 · CI Quality Findings Fix`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 CosyVoice Adapter
- 장문 제작: 최대 20,000자 원고와 문장별 재생성
- 자동 순서: CosyVoice → MeloTTS → System Voice → Browser Speech
- 진행 상태: SSE 우선, polling 자동 대체
- 세션: IndexedDB 자동 저장과 SQLite 결과 복구
- 배포: GitHub Pages 또는 Firebase Hosting Spark 정적 Web

## 무료 실행

```bash
cp .env.example .env
npm install
npm run dev:free
```

Windows에서는 `start-sorion-free.cmd`를 사용할 수 있습니다. CosyVoice 모델을 준비한 경우
`npm run dev:free -- --worker`로 Worker까지 실행합니다. 모델 가중치와 GPU 런타임은 저장소와
릴리스 ZIP에 포함하지 않습니다.

## 정적 배포 동작

Firebase Hosting Spark와 GitHub Pages는 Web/PWA만 제공합니다. 데스크톱 정적 Web은 사용자 PC의
`127.0.0.1:8000` 무료 API를 자동 탐색하고, 모바일은 기기 내장 Browser Speech를 자동 사용합니다.
사용자에게 API 주소나 엔진 선택 화면을 보여주지 않습니다.

## 주요 문서

- 시작: [`START_HERE.md`](START_HERE.md)
- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 무료 전용 엔진: [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
- Firebase Spark: [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- 오케스트레이터 설계: [`docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md`](docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md)
- AI Director: [`docs/AI_DIRECTOR.md`](docs/AI_DIRECTOR.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- lock 생성·검증: [`docs/LOCKFILE_BOOTSTRAP.md`](docs/LOCKFILE_BOOTSTRAP.md)

## 개발 원칙

- 장문 원고와 문장 블록 편집을 기본 흐름으로 유지합니다.
- 모바일·한국어를 먼저 완성합니다.
- 실제 AI, Local/System, Browser Voice, Mock을 명확히 구분합니다.
- 결제 수단과 외부 음성 공급자 Secret을 요구하지 않습니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 엔진과 API 선택은 사용자 설정이 아니라 자동 운영 계층에서 처리합니다.
- 코드와 모델 checkpoint의 라이선스를 분리해 기록하고 비상업 모델은 자동 경로에서 제외합니다.


## 삭제 파일 재발 방지

```bash
npm run cleanup:stale-brand
npm run quality:stale-files
npm run hooks:install
```

`public/sorion-icon.svg`는 영구 폐기 파일이며 Git 인덱스에서도 제거해야 합니다. 패치 ZIP은
동봉된 `APPLY_PATCH` 스크립트로 적용합니다.

## 실기기·STT·Export

실기기 측정 기록, Faster Whisper CER·WER 측정과 최종 WAV·MP3·SRT·VTT Export를 제공합니다.
세부 계약과 제한은 [`docs/REAL_DEVICE_STT_EXPORT.md`](docs/REAL_DEVICE_STT_EXPORT.md)를 따릅니다.

## 재현 가능한 CI 전환

0.9.3-alpha.3은 Node 22.18.0과 npm 10.9.3을 `.nvmrc`, `.node-version`, `packageManager`,
Volta에 동일하게 고정합니다. `vite-plugin-pwa 1.3.0`의 Vite 8 peer 선언과 전체 npm 트리를
검사하며, 일반 CI는 검증된 lock이 있어야 `npm ci`와 `uv sync --locked`로 진행합니다.

세 lock이 없으면 GitHub Actions가 첫 push에서 자동 bootstrap하여 같은 실행의 Web·API·Worker에
전달합니다. 성공한 실행의 `sorion-verified-lockfiles` artifact에서 `package-lock.json`과 두
`uv.lock`을 내려받아 커밋하면 이후 실행은 검증 전용 `npm ci`·`uv sync --locked` 경로를 사용합니다.
의도적인 의존성 갱신은 수동 `generate_lockfiles=true`로 강제할 수 있습니다. 자세한 절차는
`docs/LOCKFILE_BOOTSTRAP.md`를 따릅니다.

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
