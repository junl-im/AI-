# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.7.3 Handover Memory Baseline`

## 0. 가장 먼저 읽을 파일

이 프로젝트는 임시채팅에서 개발되므로 대화 기억에 의존하지 않습니다.

1. [`docs/HANDOVER.md`](docs/HANDOVER.md) 전체
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)

다음 개발은 위 세 파일을 읽기 전에는 시작하지 않습니다.

## 1. GitHub Desktop에 추가

기존 저장소를 유지할 때 `.git`은 그대로 두고 전체 파일 또는 패치 파일만
저장소 루트에 덮어씁니다.

권장 브랜치:

```text
docs/handover-memory-baseline
```

권장 커밋:

```text
docs: establish permanent handover memory
```

## 2. 기본 환경

```bash
cp .env.example .env
npm install
uv --version
```

요구 버전:

- Node.js 22 이상
- npm 10 이상
- Python 3.10 이상 3.13 미만
- uv

## 3. 실행

```bash
npm run dev:worker
npm run dev:api
npm run dev
```

기본 주소:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- Worker: `http://127.0.0.1:9000`

실제 CosyVoice에는 별도 PyTorch, CUDA, 모델 가중치 설치가 필요합니다.
모델이 없으면 Worker `/health`는 정상이어도 `/ready`는 not-ready입니다.

## 4. 0.7.3 첫 확인

- 상단 `BUILD v0.7.3`
- 설정의 전체 연결 검사
- `/api/v1/health`, `/setup`, `/engines`, `/voice-clones/capabilities`
- `/api/v1/connectivity`의 TTS·저장소·CORS·Worker 상태
- GitHub Pages에서 API 주소가 없을 때 `API 미설정`
- PC 로컬 API는 `http://127.0.0.1:8000`
- 휴대폰은 PC LAN IP 또는 공개 HTTPS API
- 500자 입력창, 발음 보정 토글, 목소리 가로 칩
- 입력 후 `WAV로 생성하기 (약 3초)`
- 생성 후 문장별 구간 리스트
- 음성 준비 전 메뉴 전용 Dock
- 음성 준비 후 메뉴 위 Linked Player
- Dock 메뉴 클릭 시 화면 상단 이동
- Worker 모델 미설치 상태를 준비 완료로 표시하지 않음

## 5. 품질 검사

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
```

API:

```bash
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

Worker:

```bash
cd services/worker
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

기준 테스트 수는 API 56개, Worker 9개입니다.

## 6. GitHub Pages

1. Pull Request를 `main`에 병합합니다.
2. `SoriON CI & Pages` 실행 하나만 생성되는지 확인합니다.
3. Web·API·Worker quality가 모두 성공해야 배포됩니다.
4. Pages Source는 `GitHub Actions`를 사용합니다.
5. 공개 주소에서 `BUILD v0.7.3`을 확인합니다.

GitHub Pages에는 Python API와 GPU Worker가 포함되지 않습니다.

## 7. 패치 적용

1. 현재 변경사항을 커밋하거나 백업합니다.
2. `package.json` 버전과 패치 기준을 비교합니다.
3. `.git`은 유지합니다.
4. 저장소 루트에 패치 ZIP을 풀어 덮어씁니다.
5. `PATCH_MANIFEST.txt`와 GitHub Desktop Changes를 비교합니다.
6. `DELETE_LIST.txt`가 있으면 지시대로 삭제합니다.
7. 품질 검사를 실행한 뒤 커밋합니다.

## 8. 핵심 문서

- 영구 인수인계 메모리: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- Worker: [`docs/COSYVOICE_WORKER.md`](docs/COSYVOICE_WORKER.md)
- 보안: [`docs/SECURITY.md`](docs/SECURITY.md)
- 목소리 복제: [`docs/VOICE_CLONE.md`](docs/VOICE_CLONE.md)
- Dock: [`docs/PLAYER_DOCK.md`](docs/PLAYER_DOCK.md)
- 다음 작업: [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
