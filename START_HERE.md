# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.8.2 Mobile Job Recovery/API Idempotency`

## 0. 가장 먼저 읽을 파일

이 프로젝트는 임시채팅에서 개발되므로 대화 기억에 의존하지 않습니다.

1. [`docs/HANDOVER.md`](docs/HANDOVER.md) 전체
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
4. [`docs/MOBILE_ENGINE_RELIABILITY.md`](docs/MOBILE_ENGINE_RELIABILITY.md)

## 1. 패치 적용 원칙

- 패치는 `package.json` 버전이 정확히 `0.8.1`일 때만 적용합니다.
- 기존 `.git` 폴더는 유지합니다.
- 저장소 루트에 패치 ZIP을 풀고 같은 이름의 파일을 덮어씁니다.
- `DELETE_LIST.txt`가 있으면 명시된 파일만 삭제합니다.

권장 브랜치:

```text
fix/mobile-job-recovery-idempotency
```

권장 커밋:

```text
fix: make mobile TTS jobs idempotent and recoverable
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
3. 휴대폰의 SoriON 연결 바텀시트에 `http://PC-LAN-IP:8000`을 입력합니다.
4. API·TTS·Worker·GPU 네 상태를 확인합니다.

주의:

- 휴대폰의 `localhost`와 `127.0.0.1`은 휴대폰 자신입니다.
- HTTPS Web에서 HTTP LAN API는 브라우저가 차단할 수 있습니다.
- 공개 서비스는 HTTPS FastAPI와 사설 Worker 구성이 필요합니다.
- 전체 `192.168.x.x` 대역을 자동 스캔하지 않습니다.

## 5. 0.8.2 첫 확인

- 상단 `BUILD v0.8.2`
- 초기 브랜드 랜딩 유지
- Dock 진입 후 Chat-to-Timeline 작업공간
- 연결 바텀시트의 API·TTS·Worker·GPU 네 상태
- 최근 성공 API 주소와 최근 주소 칩
- 온라인 복귀·네트워크 전환·앱 복귀 후 자동 재검사
- API request ID와 지연 시간 표시
- TTS 생성 중 연결이 끊겨도 동일 job 결과 복구
- 같은 job ID·같은 payload는 중복 합성 없이 결과 재사용
- 같은 job ID·다른 payload는 `SOA-4009`로 차단
- 타임라인 실패 블록 재시도 시 기존 job을 먼저 복구
- iOS private mode·저장공간 오류에서도 API 주소를 세션 동안 유지
- `randomUUID` 미지원 브라우저에서도 작업 ID 생성
- 음성 완성 후 플레이어가 메뉴 위에 표시
- 44px 터치 영역, 16px 입력, 하단 safe-area
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

- API: 65개
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
5. 공개 주소에서 `BUILD v0.8.2`을 확인합니다.

GitHub Pages에는 Python API와 GPU Worker가 포함되지 않습니다.
