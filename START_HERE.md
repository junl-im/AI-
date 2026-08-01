# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.8.4 Automatic Engine Bootstrap & Project Restore`

## 0. 가장 먼저 읽을 파일

이 프로젝트는 임시채팅에서 개발되므로 대화 기억에 의존하지 않습니다.

1. [`docs/HANDOVER.md`](docs/HANDOVER.md) 전체
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
4. [`docs/MOBILE_ENGINE_RELIABILITY.md`](docs/MOBILE_ENGINE_RELIABILITY.md)

## 1. 패치 적용 원칙

- 패치는 `package.json` 버전이 정확히 `0.8.3`일 때만 적용합니다.
- 기존 `.git` 폴더는 유지합니다.
- 저장소 루트에 패치 ZIP을 풀고 같은 이름의 파일을 덮어씁니다.
- `DELETE_LIST.txt`가 있으면 명시된 파일만 삭제합니다.

권장 브랜치:

```text
fix/automatic-engine-project-restore
```

권장 커밋:

```text
fix: auto-connect engines and restore projects
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

## 3. 로컬 실행

```bash
npm run dev:worker
npm run dev:api
npm run dev
```

기본 주소:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- Worker: `http://127.0.0.1:9000`

실제 CosyVoice에는 별도 PyTorch, CUDA, 모델 가중치가 필요합니다. 모델이 없으면
Worker `/health`는 정상이어도 `/ready`는 not-ready입니다.

## 4. 휴대폰 연결

1. PC와 휴대폰을 같은 Wi-Fi에 연결합니다.
2. PC 방화벽에서 API 포트 8000을 허용합니다.
3. 로컬 HTTP 개발은 현재 PC 호스트의 8000 포트를 앱이 자동 탐색합니다.
4. 공개 배포는 빌드 시 `VITE_API_BASE_URL`에 공개 HTTPS API를 설정합니다.

주의:

- 사용자는 앱 화면에서 API 주소를 입력하지 않습니다.
- 휴대폰의 `localhost`와 `127.0.0.1`은 휴대폰 자신입니다.
- HTTPS Web에서 HTTP LAN API는 브라우저가 차단할 수 있습니다.
- 전체 `192.168.x.x` 대역을 자동 스캔하지 않습니다.

## 5. 0.8.4 첫 확인

- 상단 `BUILD v0.8.4`
- 초기 브랜드 랜딩에 Dock과 메뉴가 표시되지 않음
- `AI 음성 스튜디오 시작` 뒤에만 작업공간 Dock 표시
- API 주소 입력창이나 엔진 수동 연결 화면이 없음
- 앱 시작·온라인 복귀·앱 복귀 시 음성 시스템 자동 탐색
- 준비된 실제 엔진 자동 선택과 기존 job 결과 recover-first
- 프로젝트 목록의 각 항목에 `불러오기 →` 표시
- 프로젝트 클릭 시 채팅·보이스·타임라인 복원
- 저장된 음원이 유효하면 Dock에 복구하고 만료 시 재생성을 안내
- 여러 문장 중 실패가 있어도 job ID 위치가 뒤섞이지 않음
- API 재시작 뒤에도 같은 job ID의 완료 결과 복구
- 여러 API 프로세스에서 같은 job ID·payload를 한 번만 실행
- 같은 job ID·다른 payload는 `SOA-4009`로 차단
- Worker 모델 미설치를 성공으로 표시하지 않음

## 6. 품질 검사

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

현재 기준 테스트 수:

- API: 77개
- Worker: 9개

## 7. 실제 연결 확인

```text
GET /api/v1/health
GET /api/v1/connectivity
GET /api/v1/engines
POST /api/v1/tts/synthesize
GET /api/v1/tts/jobs/{job_id}
GET /api/v1/tts/jobs/{job_id}/result
```

개발 LAN에서는 Origin CORS와 Private Network preflight가 모두 허용되어야 합니다.

## 8. GitHub Pages

1. 기능 브랜치를 Push합니다.
2. Pull Request에서 Web·API·Worker quality를 확인합니다.
3. 모두 성공한 뒤 `main`에 병합합니다.
4. Pages Source는 `GitHub Actions`를 사용합니다.
5. 공개 주소에서 `BUILD v0.8.4`를 확인합니다.

GitHub Pages에는 Python API와 GPU Worker가 포함되지 않습니다.
