# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.9.2 Korean Voice Orchestrator Blueprint & Rule Director`

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

## 0.9.2 확인 목록

- `/engines/catalog`가 채택·선택·벤치마크·연구·제외 결정을 반환하는지 확인
- F5-TTS, Kokoro, Seed-VC가 자동 TTS 순서에 포함되지 않는지 확인
- `/director/plan`이 원고 용도·속도·감정·호흡·발음 힌트를 반환하는지 확인
- 설정 화면에서 무료 엔진 파이프라인을 읽기 전용으로 확인할 수 있는지 확인
- `npm run quality:engine-blueprint`와 `npm run quality:free-only`가 통과하는지 확인
- 기존 CosyVoice → MeloTTS → System Voice → Browser Speech 자동 fallback이 유지되는지 확인

## 품질 검사

```bash
npm run quality:rules
npm run quality:free-only
npm run quality:engine-blueprint
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
