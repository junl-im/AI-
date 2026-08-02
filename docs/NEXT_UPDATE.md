# NEXT UPDATE

현재 기준: `0.9.3-beta.1 CI Hotfix 2 · CI Quality Findings Fix`

## 목표 버전

`0.9.3-beta.2 Real Device Evidence & Selective STT Regeneration`

## 핵심 기능

1. Windows CUDA, Apple Silicon, CPU, Android Chrome, iOS Safari에서 실제 측정표를 채운다.
2. 10분·30분·60분 원고의 첫 음성 지연, RTF, RAM·VRAM, 재시도·실패율을 비교한다.
3. Faster Whisper 실제 전사를 연결하고 실패 문장만 최대 제한 횟수로 재생성한다.
4. Export의 대형 장문 메모리 사용, FFmpeg MP3와 자막 싱크를 실기기에서 확인한다.
5. CosyVoice 모델 롤오버는 병행 설치, 동일 평가, canary, 한 릴리스 rollback을 지킨다.

## 예상 변경 영역

- `services/api/app/engines/stt`, `services/api/app/services/stt_metrics.py`
- 문장 재생성 오케스트레이션과 품질 기록 저장소
- Web 품질 화면의 장치 측정표·STT 비교 UI
- Windows·macOS·모바일 실기기 체크리스트와 결과 fixture

## 선행 조건과 위험

- CI Hotfix 2 적용 후 Web·API·Worker를 모두 녹색으로 만들고, 자동 생성한 npm·uv lock artifact를 검토·커밋해 verify-only 경로를 확인한다.
- 실제 CosyVoice와 Faster Whisper 모델, FFmpeg, CUDA 또는 MPS 장치가 필요하다.
- 모델·사용자 음성·실기기 개인 식별 정보는 저장소와 ZIP에 포함하지 않는다.
- beta.1은 측정·Export 기능을 제공하지만 실제 장치 성능 수치를 보증하지 않는다.
