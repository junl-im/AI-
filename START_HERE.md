# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.9.3-beta.1 CI Hotfix 2 · CI Quality Findings Fix`

## 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
3. [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
4. [`docs/PROGRESSIVE_TTS_STREAMING.md`](docs/PROGRESSIVE_TTS_STREAMING.md)
5. [`docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md`](docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md)
6. [`docs/AI_DIRECTOR.md`](docs/AI_DIRECTOR.md)
7. [`docs/LOCKFILE_BOOTSTRAP.md`](docs/LOCKFILE_BOOTSTRAP.md)
8. [`docs/REAL_DEVICE_STT_EXPORT.md`](docs/REAL_DEVICE_STT_EXPORT.md)
9. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)

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

## 0.9.3-beta.1 확인 목록

- `npm run cleanup:stale-brand` 후 Git 변경에 `public/sorion-icon.svg` 삭제가 있는지 확인
- `npm run quality:stale-files`와 `npm run hooks:install` 실행
- 실제 장치 측정값만 `/quality/device-benchmarks`에 기록
- Faster Whisper가 없을 때 `/quality/stt/probe`가 준비되지 않음으로 정확히 표시되는지 확인
- 완료 API WAV만으로 최종 WAV·SRT·VTT를 생성하고 미완료 블록은 차단되는지 확인
- MP3는 FFmpeg가 준비된 장치에서만 검증

## 품질 검사

세 lock이 아직 없으면 첫 GitHub Actions 실행이 자동 bootstrap하고 검증 artifact를 만듭니다.
artifact의 lock을 커밋한 뒤 로컬과 CI에서 다음 명령을 사용합니다.

```bash
npm run locks:check
npm ci --no-audit --no-fund
npm run quality:web-toolchain
npm run quality:dependency-tree
npm run quality:stale-files
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
