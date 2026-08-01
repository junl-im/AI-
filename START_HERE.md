# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.9.0 Free-First Korean Progressive Voice`

## 0. 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/FREE_FIRST_ENGINE_POLICY.md`](docs/FREE_FIRST_ENGINE_POLICY.md)
4. [`docs/PROGRESSIVE_TTS_STREAMING.md`](docs/PROGRESSIVE_TTS_STREAMING.md)
5. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)

## 1. 패치 적용 원칙

- 기준본은 `SoriON-AI-0.8.9-full.zip`입니다.
- 저장소 루트에 패치 ZIP을 풀어 같은 파일을 덮어씁니다.
- 이번 패치의 삭제 대상은 없습니다.
- `.git`, `.env`, 모델, 실행 DB와 사용자 음원은 유지합니다.

권장 커밋:

```text
feat: add free-first engine policy and progressive TTS events
```

## 2. 무료 기본 실행

```bash
cp .env.example .env
npm install
npm run dev:api
npm run dev
```

기본 정책은 `SORION_ENGINE_COST_POLICY=free-only`입니다. 유료 공급자 키는 필요하지 않으며,
설정돼 있어도 이 정책에서는 유료 Adapter를 등록·호출하지 않습니다.

무료 AI 엔진을 로컬에서 사용하려면 선택적으로 Worker를 실행합니다.

```bash
npm run dev:worker
```

모델 가중치와 GPU 런타임은 별도 준비 대상이며 ZIP에 포함되지 않습니다. Worker가 없으면
MeloTTS·System Voice·브라우저 음성 순으로 가능한 무료 엔진을 자동 사용합니다.

## 3. 공개 페이지 음성 동작

1. 공개 Voice API가 연결되면 서버의 무료 준비 엔진을 자동 선택합니다.
2. API가 없거나 네트워크가 실패하면 Web Speech API 한국어 음성을 자동 사용합니다.
3. 브라우저 음성은 재생 가능하지만 WAV 다운로드와 음성 복제는 지원하지 않습니다.
4. 연결 중인 작업은 SSE 진행률을 우선 사용하고 실패 시 polling으로 전환합니다.
5. 사용자는 API 주소나 엔진을 직접 선택하지 않습니다.

## 4. 0.9.0 확인 목록

- `/engines/strategy`의 `cost_policy`가 기본 `free-only`인지 확인
- NAVER·Google·Azure·ElevenLabs가 기본 `/engines` 목록에 등록되지 않는지 확인
- CosyVoice·Melo·System 중 준비된 무료 엔진이 자동 선택되는지 확인
- `GET /tts/jobs/{job_id}/events`가 진행 상태와 종료 상태를 SSE로 전송하는지 확인
- SSE 실패 시 Web이 polling으로 계속 완료 결과를 복구하는지 확인
- 뒤에서 블록이 완성돼도 현재 플레이어 트랙이 임의로 바뀌지 않는지 확인
- 설정 화면에 `무료 우선 자동`이 읽기 전용으로 표시되는지 확인

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
