# SoriON AI 0.11.33 Voice Engine Major Hardening

기준: `0.11.32 R2 · CI Static Contract Completion`

전체 프로젝트 ZIP은 새 폴더에 풀어 사용합니다. 덮어쓰기 patch ZIP은 기존 0.11.32 R2 저장소 루트에 압축 해제한 뒤 Windows에서는 `APPLY_PATCH.cmd`, macOS/Linux에서는 `./APPLY_PATCH.sh`를 실행합니다. 적용 스크립트가 0.11.33 `DELETE_LIST.txt`를 처리하고 hardening verifier/preflight를 실행합니다.

검증:

```bash
node VERIFY_LIVE_VOICE_MYVOICE.mjs
node scripts/run-preflight.mjs
python -m pytest services/api/tests
python -m pytest services/worker/tests
```

실제 rights-cleared 성우 WAV와 모델 자산은 포함하지 않으며, 없는 자산을 임의 음성으로 대체하지 않습니다.
