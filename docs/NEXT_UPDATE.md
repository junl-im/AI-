# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Verified Evidence & Long-form Export Soak + CI Hardening 5`

## 목표 버전

`0.9.3-rc.1 Production Evidence Gate`

## 핵심 기능

1. Windows CUDA, Apple Silicon, CPU, Android Chrome, iOS Safari의 10·30·60분 실제 측정값을 증거 묶음에 채운다.
2. 실제 Faster Whisper 모델로 선택 재생성 전후 CER·WER와 핵심 토큰 개선율을 기록한다.
3. `npm run quality:export-soak`로 10·30·60분 WAV·MP3·SRT·VTT를 실행하고 6개 시나리오를 모두 통과시킨다.
4. CI bootstrap 또는 선택적 로컬 복구로 생성·검증한 package-lock과 API·Worker uv lock을 저장소에 고정한다.
5. CosyVoice 모델은 병행 설치, 동일 평가 세트, canary, 한 릴리스 rollback 조건을 충족한 경우에만 기본값을 바꾼다.

## 출시 차단 조건

- 실기기 15개 시나리오 또는 Export soak 6개 시나리오가 비어 있으면 RC 승격을 차단한다.
- STT 재생성 후 품질이 개선되지 않거나 핵심 토큰 오류가 남으면 자동 반복하지 않고 수동 검토로 보낸다.
- 실제 음원, 개인 장치 이름, 로컬 경로, 모델 파일은 저장소와 릴리스 ZIP에 포함하지 않는다.
