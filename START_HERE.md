# START HERE

현재 버전: `0.9.3-beta.3 · Verified Evidence & Long-form Export Soak + CI Hardening 2`

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 먼저 읽습니다.
2. 누적 패치는 ZIP을 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.
3. `public/sorion-icon.svg`가 남아 있으면 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`가 삭제합니다.
4. npm·API uv·Worker lock은 독립 생성되며 성공한 구성요소는 다른 lock 실패와 무관하게 보존됩니다.
5. npm은 cache-only 후 공식 `.org`·`.com` endpoint를 순차 사용하고, preflight는 모든 실패를 보고서로 남깁니다.
6. Quality 화면은 실기기 15개 시나리오의 측정 진행률을 표시합니다.
7. 타임라인의 `STT 검수 · 실패만 재생성`은 서버 WAV만 검수하고 실패 문장만 최대 2회 다시 생성합니다.
8. `npm run quality:export-soak`는 합성 무음으로 Export 구조만 검증하며 실제 음질·장치 성능으로 해석하지 않습니다.
9. 실제 모델·실기기 수치를 준비하지 않았다면 성공 또는 성능을 가장하지 않습니다.
