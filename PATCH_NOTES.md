# SoriON AI 0.11.33 · Voice Engine Major Hardening

- MY VOICE 서버 실제 파형 검증 + 16 kHz mono 정규화
- 20~30초 권장, 30초 상한, 29.5초 recorder hard stop
- idempotent profile 등록, local/remote 상태 분리, Worker 복구 재동기화
- CosyVoice `stream=True` 호출 교정과 reference 계약 강화
- 5개 성우 preset의 RMS/무음/clipping/16 kHz mono 품질 게이트
- 사용자용 Final Export UI/API 제거
- 오래된 0.11.15 Live Voice/MY VOICE apply payload 제거 및 재유입 차단

실제 성우 WAV/model/동의 문서는 저장소와 전달 ZIP에 포함하지 않습니다.
