# NEXT UPDATE

현재 기준: `0.9.3-beta.2 · Resilient Lock Bootstrap & Selective STT Regeneration`

## 목표 버전

`0.9.3-beta.3 Real Device Runs & Export Soak`

## 핵심 기능

1. Windows CUDA, Apple Silicon, CPU, Android Chrome, iOS Safari에서 10·30·60분 측정표를 실제 값으로 채운다.
2. Faster Whisper 선택 재생성 전후 CER·WER와 핵심 토큰 개선율을 같은 문장 ID로 비교한다.
3. 30·60분 WAV·MP3·SRT·VTT Export의 메모리, 처리 시간, 자막 싱크를 soak test로 기록한다.
4. CosyVoice 신규 모델은 병행 설치, 동일 평가, canary, 한 릴리스 rollback 절차로만 전환한다.
5. main에서 자동 커밋된 npm·uv lock을 확인하고 이후 verify-only 경로를 고정한다.

## 선행 조건과 위험

- beta.2의 lock bootstrap은 registry 일시 장애를 재시도하고 부분 npm cache를 보존하지만, 장시간 외부 장애 자체를 숨기지는 않는다.
- 실제 Faster Whisper와 CosyVoice 모델, FFmpeg, CUDA 또는 MPS 장치가 필요하다.
- 실측값, 모델 파일, 사용자 음성, 개인 식별 정보는 검토 없이 저장소나 릴리스 ZIP에 넣지 않는다.
