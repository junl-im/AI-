# Voice Preset Review Approval, Signature & Rollback

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`

## 목적

검수 묶음의 로컬 판정을 실제 프리셋 승인으로 자동 승격하지 않고, 운영자가 현재 WAV·manifest·동의·권리·중복 상태를 다시 확인한 뒤에만 승인한다. 승인 이후 파일 변경과 롤백을 추적하며 선택적으로 로컬 신뢰 키의 HMAC을 연결한다.

## 승인 순서

1. Quality Lab에서 동일 문장·동일 엔진으로 프리셋을 청취하고 검수 묶음 SHA-256을 준비한다.
2. 수동 승인 카드에서 프리셋, 실제 검수자, 검수 문장과 묶음 SHA-256을 입력한다.
3. 서버가 현재 WAV SHA-256, 현재 manifest digest, 동의·권리·만료·중복 상태를 다시 계산한다.
4. 변경 diff와 차단·경고를 사람이 확인한다.
5. `현재 WAV 승인` 확인을 포함한 apply 요청에서 서버가 preview를 다시 계산한다. 파일이 달라졌으면 적용하지 않는다.
6. 성공 시 manifest v3와 승인 전후 snapshot을 원자 저장하고 approval JSONL에 append한다.
7. 롤백은 현재 manifest가 해당 승인 직후 digest와 같은 경우에만 허용한다.

## 서명 설정

```env
SORION_VOICE_REVIEW_SIGNING_SECRET=운영환경-secret-store에서-주입
SORION_VOICE_REVIEW_SIGNING_KEY_ID=local-review-key-2026-01
```

- secret을 비워 두면 승인은 `unsigned`이다. 이는 실패가 아니라 기본 안전 상태다.
- secret과 key ID를 설정하면 canonical approval payload에 HMAC-SHA256을 기록한다.
- 같은 key ID·secret을 가진 API만 signature를 verified로 판단한다.
- secret은 Git, 릴리스 ZIP, manifest, UI, 진단 복사본, 감사 JSONL에 저장하지 않는다.
- 단일 HMAC key는 중앙 공개키 전자서명이 아니다. 여러 운영자 신원 분리와 key rotation은 다음 단계다.

## 감사 기록

기본 경로는 `.sorion/quality/voice-review-approvals.jsonl`이다. approval·rollback event, actor, reviewer, 시각, WAV checksum, 전후 manifest digest, 검수 묶음 checksum, 서명 metadata와 전후 manifest snapshot을 보존한다. 실제 WAV, 동의 문서 원문, 전체 로컬 경로와 secret은 기록하지 않는다.

## 실패가 정상인 경우

- WAV 없음·품질 검사 실패·다른 프리셋과 checksum 중복
- 동의 미확인·권리 범위 부족·증거 만료
- manifest ID·이름·성별·파일명·checksum 불일치
- preview 뒤 WAV 또는 manifest 변경
- signed manifest인데 현재 API에 대응하는 신뢰 키가 없음
- 승인 뒤 manifest가 수동 수정되어 안전한 자동 rollback을 할 수 없음

## 보안 경계

SHA-256은 파일 변경 탐지이고 HMAC은 공유 secret 보유 확인이다. 이 기능은 화자 신원, 동의 문서의 법적 효력, 권리 보유자 또는 청취 품질을 자동 증명하지 않는다. 실제 원본과 사람 검토를 별도로 보존한다.
