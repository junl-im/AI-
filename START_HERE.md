# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.8.9 Unified Product Shell & Korean Neural Engine Mesh`

## 0. 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
4. [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
5. [`docs/DUBBING_STUDIO_UX.md`](docs/DUBBING_STUDIO_UX.md)

## 1. 패치 적용 원칙

- 기준본은 `SoriON-AI-0.8.8-full.zip`입니다.
- 저장소 루트에 패치 ZIP을 풀어 같은 파일을 덮어씁니다.
- 이번 패치의 삭제 대상은 없습니다.
- `.git`, `.env`, 모델, 실행 DB와 사용자 음원은 유지합니다.

권장 커밋:

```text
feat: unify product shell and add Korean neural engine mesh
```

## 2. 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
npm run dev
```

Node.js 22+, npm 10+, Python 3.10~3.12와 uv를 사용합니다.

## 3. 공개 페이지 음성 동작

1. Voice API가 연결되면 서버의 실제 AI·로컬 엔진을 자동 선택합니다.
2. API가 없거나 네트워크 연결에 실패하면 Web Speech API의 한국어 음성을 자동 사용합니다.
3. 브라우저 음성은 플레이어에서 바로 재생하지만 WAV 다운로드와 음성 복제는 지원하지 않습니다.
4. API 재연결은 5초 → 12초 → 30초 → 60초 backoff로 계속 시도합니다.
5. 사용자는 API 주소나 엔진을 직접 선택하지 않습니다.

AI 기능을 공개 배포하려면 Actions Variable을 설정합니다.

```text
SORION_PUBLIC_API_BASE_URLS=https://voice-a.example.com,https://voice-b.example.com
```

## 4. 0.8.9 확인 목록

- 만들기 포함 모든 내부 페이지에 공통 상단 배너가 표시되는지 확인
- 작은 SoriON 프로그램명과 공식 PNG 로고가 표시되는지 확인
- 상단 로고·이름을 누르면 첫 페이지로 이동하는지 확인
- 프로젝트·품질·복제·설정 화면의 헤더·간격·카드가 같은 제품 셸을 사용하는지 확인
- `SORION_PUBLIC_API_BASE_URLS`의 첫 API 실패 시 다음 후보로 자동 전환되는지 확인
- 인증된 Premium 엔진과 CosyVoice Worker가 ready일 때만 자동 후보가 되는지 확인
- 첫 페이지에는 Dock이 없고 작업공간에만 표시되는지 확인
- 새로고침 뒤 원고·프로젝트·타임라인이 복원되는지 확인

## 5. 품질 검사

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
