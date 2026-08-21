# Live Voice / MY VOICE hardening verification

현재 소스는 과거 `0.11.15` Live Voice/MY VOICE payload를 덮어쓰는 방식이 아니라 전체 프로젝트 자체가 최신 구현입니다.
따라서 예전 `APPLY_LIVE_VOICE_MYVOICE.mjs`, phase payload, Final Export hotfix는 **폐기되어 저장소에서 제거**되었습니다. 다시 가져오거나 실행하면 안 됩니다.

## 현재 검증

```bash
node VERIFY_LIVE_VOICE_MYVOICE.mjs
node scripts/run-preflight.mjs
```

`VERIFY_LIVE_VOICE_MYVOICE.mjs`는 다음을 함께 검사합니다.

- MY VOICE 20~30초 권장 / 30초 상한
- 브라우저 + 서버 실제 파형 품질 차단
- 서버의 16 kHz mono reference 정규화
- 프로필 idempotent 등록과 Worker 복구 상태 재동기화
- CosyVoice Worker의 canonical reference 계약과 `stream=True` 호출
- 성우 preset의 16 kHz mono / RMS / 무음 / clipping 품질 게이트
- 폐기된 `최종 MP3+자막` 공개 UI/API와 오래된 apply payload의 재유입 차단

사용자 음성 원본, 실제 성우 reference WAV, 모델 가중치, 동의 문서는 전달 ZIP에 포함하지 않습니다.
