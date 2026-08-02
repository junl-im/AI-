# START HERE

현재 버전: `0.9.3-beta.2 · Resilient Lock Bootstrap & Selective STT Regeneration`

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 먼저 읽습니다.
2. 누적 패치는 ZIP을 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.
3. `public/sorion-icon.svg`가 남아 있으면 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`가 삭제합니다.
4. 첫 Actions 실행은 lock이 없으면 자동 생성합니다. registry 타임아웃은 최대 4회 재시도하고 npm cache와 로그를 보존합니다.
5. 성공한 `sorion-verified-lockfiles` artifact의 세 lock을 저장소에 커밋하면 이후 `verify`와 `npm ci`만 사용합니다.
6. Quality 화면은 실기기 15개 시나리오의 측정 진행률을 표시합니다.
7. 타임라인의 `STT 검수 · 실패만 재생성`은 서버 WAV만 검수하고 실패 문장만 최대 2회 다시 생성합니다.
8. 실제 모델·실기기 수치를 준비하지 않았다면 성공 또는 성능을 가장하지 않습니다.
