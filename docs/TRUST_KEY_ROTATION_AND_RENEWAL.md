# Trust Key Rotation & Evidence Renewal Queue

Engine Heartbeat 6.8.4는 프리셋 사람 검수 서명을 단일 HMAC 키에서 active key와 previous key를 함께 신뢰하는 key ring으로 확장한다. 새 승인과 재서명은 active key만 사용하고, 이전 key로 올바르게 서명된 manifest는 grace 기간 동안 계속 검증된다.

## 환경 변수

```dotenv
SORION_VOICE_REVIEW_SIGNING_KEY_ID=review-key-2026-08
SORION_VOICE_REVIEW_SIGNING_SECRET=secret-store에서-주입
SORION_VOICE_REVIEW_TRUSTED_KEYS_JSON={"review-key-2026-05":"이전-secret"}
SORION_VOICE_REVIEW_LOCK_TIMEOUT_SECONDS=10
```

- `SIGNING_KEY_ID`와 `SIGNING_SECRET`은 현재 active key다.
- `TRUSTED_KEYS_JSON`은 검증만 허용할 previous key 목록이다. JSON 객체의 key는 key ID, value는 secret이다.
- 같은 key ID가 두 설정에 모두 있으면 active secret이 우선한다.
- 실제 secret은 `.env.example`, Git, 진단 복사본, 감사 묶음, 배포 ZIP에 넣지 않는다.

## 무중단 교체 순서

1. 새 active key ID와 secret을 secret store에 추가한다.
2. 기존 active key를 `TRUSTED_KEYS_JSON`의 previous key로 옮긴다.
3. API를 재시작한다. 기존 manifest는 previous key로 계속 검증된다.
4. Quality Lab의 **증거 갱신·신뢰 키 교체 대기열**에서 재서명 대상만 확인한다.
5. `현재 키 재서명 diff`로 변경 필드가 approval 서명 영역뿐인지 확인한다.
6. `재서명 적용` 후 현재 WAV, 사람 검수, review bundle SHA-256가 유지되는지 확인한다.
7. 모든 대상이 active key로 전환되고 grace 기간이 끝난 뒤 previous key를 제거한다.

알 수 없는 key ID나 잘못된 HMAC은 재서명으로 자동 덮어쓰지 않는다. 먼저 원래 서명의 출처와 secret을 확인해야 한다.

## 증거 갱신 대기열

대기열은 다음 상태를 한 화면에 모은다.

- 동의가 confirmed가 아니거나 만료된 상태
- 동의 또는 사용 권리가 설정한 기간 안에 만료되는 상태
- `tts-inference` 권리가 없는 상태
- WAV와 manifest integrity 또는 사람 검수 SHA-256가 다른 상태
- unsigned 승인 또는 previous key 서명으로 active key 전환이 가능한 상태

대기열은 실제 동의 문서나 권리를 자동 갱신하지 않는다. 만료일을 자동 연장하지 않습니다. 운영자가 원문을 확인하고 manifest를 수정한 뒤 기존 승인 절차를 다시 수행해야 한다.

## 프로세스 간 파일 잠금

승인 apply, active key 재서명, rollback은 history 파일 옆의 lock 파일을 사용해 프로세스 간 파일 잠금을 획득한 뒤 실행한다.

- Linux/macOS는 `flock`, Windows는 `msvcrt.locking`을 사용한다.
- 잠금 시간 초과 시 최신 파일을 덮어쓰지 않고 충돌 오류를 반환한다.
- 이 잠금은 같은 로컬 파일시스템을 공유하는 API 프로세스를 대상으로 한다.
- 여러 서버나 네트워크 파일시스템 배포에서는 단일 writer 또는 별도 분산 잠금이 필요하다.

## 안전 경계

- HMAC은 설정된 secret 보유 여부와 payload 무결성을 확인할 뿐 화자 신원이나 법적 권리를 증명하지 않는다.
- checksum은 파일 변경을 탐지할 뿐 사람이 실제로 청취했는지 증명하지 않는다.
- previous key를 신뢰 목록에서 제거하면 그 key로만 서명된 manifest는 즉시 blocked가 된다.
- 재서명은 기존 사람 검수와 WAV SHA-256가 현재 파일과 일치하고 기존 서명이 신뢰되는 경우에만 허용한다.
