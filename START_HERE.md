# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.9.3-alpha.3 Reproducible CI Lock Evidence Gate`

## 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
3. [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
4. [`docs/PROGRESSIVE_TTS_STREAMING.md`](docs/PROGRESSIVE_TTS_STREAMING.md)
5. [`docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md`](docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md)
6. [`docs/AI_DIRECTOR.md`](docs/AI_DIRECTOR.md)
7. [`docs/LOCKFILE_BOOTSTRAP.md`](docs/LOCKFILE_BOOTSTRAP.md)
8. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)

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

## 0.9.3-alpha.3 확인 목록

- `.nvmrc`, `.node-version`, packageManager와 CI Node가 `22.18.0`/npm `10.9.3`으로 일치하는지 확인
- Actions 수동 실행에서 `generate_lockfiles=true`로 검증된 lock artifact 생성
- npm 설치 로그의 모든 warning과 전체 `npm ls --all` 트리에 peer·missing·invalid 문제가 없는지 확인
- `vite-plugin-pwa 1.3.0`이 Vite 8 peer 범위를 실제 설치 package에서 선언하는지 확인
- `package-lock.json`, `services/api/uv.lock`, `services/worker/uv.lock`을 커밋
- 일반 CI가 `npm ci`, `uv sync --locked`만 사용해 Web·API·Worker를 통과하는지 확인

## 품질 검사

lock 생성 전에는 `docs/LOCKFILE_BOOTSTRAP.md`의 GitHub Actions 절차를 먼저 수행합니다.
lock을 커밋한 뒤 다음 명령을 사용합니다.

```bash
npm run locks:check
npm ci --no-audit --no-fund
npm run quality:web-toolchain
npm run quality:dependency-tree
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
uv sync --locked --dev --python 3.10
uv run --locked --python 3.10 ruff check app tests --output-format=github
uv run --locked --python 3.10 pytest tests -q

cd ../worker
uv sync --locked --dev --python 3.10
uv run --locked --python 3.10 ruff check app tests --output-format=github
uv run --locked --python 3.10 pytest tests -q
```
