# START HERE

현재 버전: `0.9.3-beta.2 · CI Failure-Domain Hardening & Selective STT Regeneration`

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 먼저 읽습니다.
2. 누적 패치는 ZIP을 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.
3. `public/sorion-icon.svg`가 남아 있으면 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`가 삭제합니다.
4. npm·API uv·Worker uv lock은 독립 생성되며 각 명령은 제한 재시도와 hard timeout을 사용합니다.
5. 검증된 lock은 SHA-256 증명 후 main 전용 작업이 자동 커밋하며 실패 시 component artifact를 유지합니다.
6. Quality 화면은 실기기 15개 시나리오의 측정 진행률을 표시합니다.
7. 타임라인의 `STT 검수 · 실패만 재생성`은 서버 WAV만 검수하고 실패 문장만 최대 2회 다시 생성합니다.
8. 실제 모델·실기기 수치를 준비하지 않았다면 성공 또는 성능을 가장하지 않습니다.
