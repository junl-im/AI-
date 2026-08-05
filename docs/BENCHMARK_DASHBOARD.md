# Worker Telemetry & Benchmark Dashboard

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.8.3 · CI Quality Unblock & Approval Operator Gate`

## 목적

CosyVoice Worker의 실제 합성 호출에서 나온 짧은 자동 측정과 Android·iOS 10·30·60분 실기기 soak를 분리한다. 모델 digest·장치·GPU·프리셋이 다른 표본을 하나의 성능 수치로 합치지 않는다.

## Worker 자동 telemetry

기본 경로는 `.sorion/quality/worker-synthesis-telemetry.jsonl`이다. 성공·실패마다 다음을 기록한다.

- Worker job ID와 기록 시각
- engine·프리셋 ID
- 모델 ID·버전·model manifest SHA-256 digest
- device profile·accelerator·GPU 이름
- first audio, processing time, 생성 음원 길이와 RTF
- Worker 보고 길이와 API 결과 길이의 final handoff 오차
- 성공 여부와 실패 이유

원문, 실제 WAV 바이트, 프롬프트 음성, secret과 전체 로컬 경로는 저장하지 않는다.

## 대시보드 집계

Worker 자동 자료는 모델 digest·장치·GPU·프리셋별로 표본 수, 성공 수, 실패율과 first audio·RTF·handoff P50/P95를 계산한다. 값이 없으면 `-`로 표시하고 표본을 만들어 내지 않는다.

실기기 soak는 기존 Device Evidence 기록에서 별도로 집계한다. 자동 합성 한 건은 10분 soak, 장시간 안정성, 모바일 인증 또는 gapless 증거가 아니다.

## model digest

Worker diagnostics의 `model_digest`는 모델 가중치 전체 hash가 아니라 검증된 `sorion-model-manifest.json` 파일의 SHA-256이다. manifest가 바뀌면 다른 그룹으로 분리된다. 모델 파일 무결성은 manifest 내부 파일 checksum 검증을 계속 사용한다.

## 해석 주의

- 표본 수가 적은 P95는 안정된 성능 보증이 아니다.
- 장치·GPU driver·전원 상태·문장 길이·프리셋 WAV가 달라지면 직접 비교하지 않는다.
- 실패율 0%는 기록된 표본 범위만 의미한다.
- 실제 성능 기준선과 회귀 경고는 충분한 운영 표본을 사람이 승인한 뒤 추가한다.
