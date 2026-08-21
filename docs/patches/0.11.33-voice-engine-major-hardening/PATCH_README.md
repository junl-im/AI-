# SoriON AI 0.11.33 · Voice Engine Major Hardening Patch

기준 버전은 `0.11.32 R2 · CI Static Contract Completion`입니다.

## 적용

1. 현재 작업을 커밋하거나 백업합니다.
2. patch ZIP을 기존 저장소 루트에 압축 해제해 덮어씁니다.
3. Windows에서는 `APPLY_PATCH.cmd`, macOS/Linux에서는 `./APPLY_PATCH.sh`를 실행합니다. 스크립트가 현재 `DELETE_LIST.txt`를 적용하고 hardening verifier/preflight를 실행합니다.
4. API/Worker 테스트를 실행합니다.
5. GitHub Desktop Changes에서 삭제/추가/수정을 검토한 뒤 Commit·Push합니다.

## 핵심 변경

- MY VOICE 실제 서버 파형 검증, 16 kHz mono 정규화, 20~30초 권장/30초 상한
- recorder 29.5초 hard stop, zero-byte 및 stop/reset race 차단
- idempotent profile 등록과 Worker 복구 readiness 재동기화
- CosyVoice Worker canonical reference 검증과 `stream=True` 호출 교정
- 5개 성우 preset RMS/무음/clipping/16 kHz mono gate
- 공개 Final Export UI/API 완전 퇴역
- 오래된 Live Voice/MY VOICE payload applier 퇴역 및 재유입 차단

## 자산 경계

실제 사용자 음성, 성우 reference WAV, 모델 가중치, 동의/계약 문서는 patch와 full ZIP에 포함하지 않습니다.
