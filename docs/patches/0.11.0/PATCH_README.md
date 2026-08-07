# SoriON AI 0.11.0 Adaptive Engine Resilience & Recovery

기준 버전은 **0.10.8 CI Test Contract Stability Hotfix**입니다.

## 적용 내용

- 장애 엔진 circuit breaker의 cooldown 뒤 **half-open 단일 probe**
- 반복 복구 실패의 bounded exponential cooldown과 성공 시 backoff reset
- 명시적 엔진 선택에도 circuit 보호 적용
- 프리셋 호환 불가와 runtime engine failure 분리
- System TTS·MeloTTS·CosyVoice Worker runtime 재탐지/refresh
- 운영자 runtime reset API와 Quality Lab·Engine Doctor 보호 상태 진단
- Web의 cooldown/probing 엔진 자동 선택 제외와 복구 시점 카탈로그 재조회
- 엔진 회복력 dependency-free 계약 및 API 회귀 테스트 강화

## 적용

기존 0.10.8 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 운영체제에 맞게 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

실제 CosyVoice 전용 프리셋 WAV·화자 동의/권리 자료·모델 가중치는 이 패치에 포함하지 않습니다.
