# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.9.1 Free-Only Local Runtime & Firebase Spark`

## 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
3. [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
4. [`docs/PROGRESSIVE_TTS_STREAMING.md`](docs/PROGRESSIVE_TTS_STREAMING.md)
5. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)

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

## 0.9.1 확인 목록

- `/engines/strategy`가 `free_only=true`를 반환하는지 확인
- `/engines`가 CosyVoice·Melo·System·Mock 허용 목록만 반환하는지 확인
- 응답에서 비용 정책 필드가 완전히 사라졌는지 확인
- Firebase 및 GitHub 정적 호스트 자체 `/api`를 반복 검사하지 않는지 확인
- 데스크톱 정적 Web이 `127.0.0.1:8000`을 자동 탐색하는지 확인
- 모바일 정적 Web이 localhost를 시도하지 않고 Browser Speech를 사용하는지 확인
- `npm run quality:free-only`가 통과하는지 확인

## 품질 검사

```bash
npm run quality:rules
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
