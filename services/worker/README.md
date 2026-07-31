# SoriON CosyVoice Worker

FastAPI 게이트웨이와 대형 음성 모델을 분리하는 실행 서비스입니다.

## 상태 구분

- `GET /health`: 프로세스가 살아 있는지 확인합니다.
- `GET /ready`: 모델 adapter와 모델 경로가 실제로 준비됐는지 확인합니다.
- `GET /v1/diagnostics`: GPU, CUDA, VRAM, 모델 경로, adapter 상태를 반환합니다.

Worker는 adapter가 준비되지 않았을 때 작업을 성공으로 위장하지 않고 HTTP 503을 반환합니다.

## 실행

```bash
uv run --project services/worker uvicorn app.main:app --app-dir services/worker --port 9000
```

필수 환경 변수:

```text
SORION_WORKER_ADAPTER_MODULE=your_company.cosyvoice_adapter
SORION_WORKER_MODEL_PATH=/models/cosyvoice3
SORION_WORKER_DEVICE=cuda:0
```

adapter 모듈은 `create_runtime(model_path, device)` 함수를 제공해야 하며, 반환 객체는 비동기
`generate(sample_path, text, output_path, on_progress, cancel_event)` 메서드를 구현해야 합니다.
