# SoriON AI 6.8.1 → 6.8.2 덮어쓰기 패치

기준 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.1 · Review Export Sync & Voice Selection Telemetry`
대상 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`

## GitHub Desktop 적용

1. 현재 변경사항을 먼저 Commit하거나 프로젝트 폴더를 백업합니다.
2. 패치 ZIP의 내용물을 저장소 최상위 폴더에 바로 압축 해제해 덮어씁니다.
3. `.git` 폴더는 건드리지 않습니다.
4. GitHub Desktop Changes에서 변경·추가 파일 52개, 삭제 0개를 확인합니다.
5. `npm run quality:preflight`, API·Worker 테스트를 실행하거나 Push 후 GitHub Actions 결과를 확인합니다.
6. 이상이 없으면 Commit·Push합니다.

## 핵심 변경

- 현재 WAV·manifest·검수 묶음 checksum을 재계산하는 수동 승인 diff preview와 stale apply 차단
- manifest v3 approval ID, 승인 payload digest, 선택적 HMAC-SHA256과 signing key ID
- 승인 전후 manifest snapshot 감사 기록과 현재 파일 변경 시 위험한 rollback 차단
- Engine Doctor·CosyVoice 실제 합성 경로의 승인·서명 검증
- CosyVoice Worker 모델 digest·GPU·first audio·RTF·handoff·실패 자동 telemetry
- 자동 Worker telemetry와 10·30·60분 실기기 soak를 분리한 모델·GPU·프리셋 P50/P95 대시보드
- signed review/benchmark 계약을 포함한 repository preflight 23개

## 환경변수

서명은 선택 사항입니다. 실제 secret은 저장소나 ZIP에 넣지 않고 운영 환경의 secret store에서 주입합니다.

```env
SORION_VOICE_REVIEW_APPROVAL_PATH=.sorion/quality/voice-review-approvals.jsonl
SORION_WORKER_TELEMETRY_PATH=.sorion/quality/worker-synthesis-telemetry.jsonl
SORION_VOICE_REVIEW_SIGNING_SECRET=
SORION_VOICE_REVIEW_SIGNING_KEY_ID=local-review-key
```

## 제한

실제 5명 WAV, 동의·권리 원본, HMAC secret, CosyVoice 모델 가중치와 실기기 benchmark 값은 포함하지 않습니다. checksum과 HMAC은 화자 신원·법적 권리·측정 진실성을 자동 증명하지 않습니다. 짧은 Worker 자동 telemetry는 장시간 실기기 soak 인증이 아닙니다.

전체 파일 목록은 `PATCH_MANIFEST.txt`, 삭제 목록은 `DELETE_LIST.txt`를 확인합니다.
