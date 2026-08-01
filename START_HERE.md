# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.8.5 Unified Workspace UX & Engine Orchestration`

## 0. 가장 먼저 읽을 파일

이 프로젝트는 임시채팅에서 개발되므로 대화 기억에 의존하지 않습니다.

1. [`docs/HANDOVER.md`](docs/HANDOVER.md) 전체
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
4. [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
5. [`docs/MOBILE_ENGINE_RELIABILITY.md`](docs/MOBILE_ENGINE_RELIABILITY.md)

## 1. 패치 적용 원칙

- 패치는 `package.json` 버전이 정확히 `0.8.4`일 때만 적용합니다.
- 기존 `.git` 폴더는 유지합니다.
- 저장소 루트에 패치 ZIP을 풀고 같은 이름의 파일을 덮어씁니다.
- `DELETE_LIST.txt`에 경로가 있을 때만 해당 파일을 삭제합니다.

권장 브랜치와 커밋:

```text
feat/unified-workspace-engine-orchestration
feat: unify workspace UX and add engine orchestration
```

## 2. 기본 환경과 실행

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
npm run dev
```

요구 버전은 Node.js 22 이상, npm 10 이상, Python 3.10 이상 3.13 미만과 uv입니다.

기본 주소:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- Worker: `http://127.0.0.1:9000`

실제 CosyVoice에는 별도 PyTorch, CUDA와 모델 가중치가 필요합니다. Worker `/health`가
정상이더라도 모델·GPU 조건이 충족되지 않으면 `/ready`는 준비 안 됨이어야 합니다.

## 3. 자동 연결과 엔진 운영

사용자는 API 주소나 엔진을 입력하지 않습니다. 앱은 같은 Origin, `VITE_API_BASE_URL`, 마지막
성공 주소와 안전한 로컬 후보를 자동 확인합니다. 일반 합성은 항상 `engine_id=auto`로 요청하고
서버가 준비 상태와 운영 우선순위를 기준으로 실행 엔진을 선택합니다.

```env
SORION_DEFAULT_TTS_ENGINE=auto
SORION_TTS_ENGINE_ORDER=cosyvoice3,melo,system,mock
SORION_ENGINE_FAILURE_THRESHOLD=2
SORION_ENGINE_COOLDOWN_SECONDS=30
```

주 엔진이 실패하면 서버가 다음 준비 엔진을 시도합니다. 반복 실패 엔진은 cooldown 동안 자동
제외되며 품질 연구소에서 우선 엔진, 성공·실패 횟수와 격리 상태를 확인할 수 있습니다.

## 4. 0.8.5 첫 확인

- 상단 `BUILD v0.8.5`
- 초기 랜딩에는 Dock·메뉴가 없고 작업공간 진입 뒤에만 표시
- 만들기에서 다른 메뉴로 이동한 뒤 돌아와도 입력·채팅·타임라인 유지
- 품질·프로젝트·설정 화면의 헤더, 배경, 제목 계층과 뒤로가기 동작 일관성
- 상단 설정 버튼으로 설정 화면 직접 접근
- 프로젝트 목록의 로딩·실패·빈 상태와 재시도 동작
- 일반 생성 요청의 `requested_engine_id=auto`
- 주 엔진 실패 시 `attempted_engine_ids`와 `fallback_used=true`
- 반복 실패 엔진의 `health=cooldown`과 cooldown 종료 후 재평가
- 실제 모델 미설치 상태를 AI 성공으로 표시하지 않음
- API 재시작 뒤에도 같은 job ID 결과 복구

## 5. 품질 검사

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
```

API와 Worker:

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

현재 기준 테스트 수는 API 89개, Worker 9개입니다.

## 6. 실제 연결 확인

```text
GET /api/v1/health
GET /api/v1/connectivity
GET /api/v1/engines
GET /api/v1/quality/diagnostics
POST /api/v1/tts/synthesize
GET /api/v1/tts/jobs/{job_id}/result
```

GitHub Pages에는 Python API와 GPU Worker가 포함되지 않습니다. 공개 배포는 같은 Origin reverse
proxy 또는 빌드 시 주입한 공개 HTTPS API가 필요합니다.
