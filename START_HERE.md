# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.9.3-alpha.2 Web Quality Toolchain Stabilization`

## 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
3. [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
4. [`docs/PROGRESSIVE_TTS_STREAMING.md`](docs/PROGRESSIVE_TTS_STREAMING.md)
5. [`docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md`](docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md)
6. [`docs/AI_DIRECTOR.md`](docs/AI_DIRECTOR.md)
7. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)

## 무료 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev:free
```

Windows에서는 저장소 루트의 `start-sorion-free.cmd`를 실행합니다. CosyVoice 모델이 준비된 경우
`--worker` 옵션을 추가합니다. Worker가 없으면 MeloTTS·System Voice·Browser Speech 중 가능한
엔진을 자동 사용합니다.

## Firebase Hosting Spark

```bash
npm run build
firebase deploy --only hosting
```

정적 호스팅에는 Python API나 모델을 올리지 않습니다. 데스크톱에서는 로컬 API를 자동 탐색하고,
모바일에서는 Browser Speech가 자동 안전망이 됩니다.

## 0.9.3-alpha.2 확인 목록

- `npm run quality:web-manifest`가 정확한 직접 버전과 Vite 8 호환 조합을 검사하는지 확인
- `npm install`이 strict peer dependency 모드에서 성공하는지 확인
- 설치 뒤 `npm run quality:web-toolchain`과 `npm ls vite vitest typescript typescript-eslint --all`이 통과하는지 확인
- Vitest 4.1.10, Tailwind 4.3.3, typescript-eslint 8.65.0이 정확히 설치되는지 확인
- `@testing-library/dom`이 직접 설치되고 React 19 테스트가 유지되는지 확인
- 기존 모델 온보딩, API 100개와 Worker 14개 회귀 검사가 유지되는지 확인

## 품질 검사

```bash
npm run quality:web-manifest
npm install --no-audit --no-fund
npm run quality:web-toolchain
npm ls vite vitest typescript typescript-eslint --all
npm run quality:rules
npm run quality:free-only
npm run quality:engine-blueprint
npm run quality:model-onboarding
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

```bash
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q

cd ../worker
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```
