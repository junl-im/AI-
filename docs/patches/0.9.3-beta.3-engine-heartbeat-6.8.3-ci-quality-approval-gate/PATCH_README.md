# SoriON AI 6.8.2 → 6.8.3 덮어쓰기 패치

대상 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`
결과 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.3 · CI Quality Unblock & Approval Operator Gate`

## GitHub Desktop 적용

1. 현재 변경사항을 먼저 Commit하거나 프로젝트 폴더를 백업합니다.
2. 패치 ZIP 내용물을 저장소 최상위 폴더에 그대로 덮어씁니다.
3. GitHub Desktop의 Changes에서 이 문서의 manifest와 동일한 변경·추가 파일 수, 삭제 0개를 확인합니다.
4. Commit 후 Push하고 GitHub Actions의 API quality와 Web quality를 재실행합니다.

## 운영자 승인 API 설정

로컬 `127.0.0.1`·`::1` 사용은 기본 설정에서 토큰 없이 동작합니다. LAN·외부 브라우저에서 승인 이력·미리보기·적용·롤백을 사용하려면 API `.env`에 다음 값을 설정합니다.

```env
SORION_VOICE_REVIEW_OPERATOR_TOKEN=32자-이상의-충분히-긴-임의-토큰
```

Quality Lab의 `원격 운영자 토큰` 입력란에는 같은 값을 입력합니다. 토큰은 Git, ZIP, manifest, 감사 로그에 넣지 않습니다. 로컬 환경까지 토큰을 강제하려면 다음 값을 추가합니다.

```env
SORION_VOICE_REVIEW_ALLOW_LOOPBACK_WITHOUT_TOKEN=false
```

## 주의

- `X-SoriON-User-ID`와 `X-SoriON-Client-ID`는 인증 수단이 아닙니다.
- 현재 동시 승인 잠금은 단일 API 프로세스 내부에서만 보장됩니다. 다중 worker·다중 노드 운영은 6.8.4의 프로세스 간 잠금 전까지 단일 writer 구성을 사용합니다.
- 실제 WAV, 동의·권리 원본, 운영자 토큰, HMAC secret과 모델 가중치는 포함하지 않습니다.
