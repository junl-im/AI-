# START HERE

현재 버전: `0.9.3-beta.3 · Engine Heartbeat 6.4 · Signed Audio Rehydration & Device Certification`

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 먼저 읽습니다.
2. 누적 패치는 ZIP을 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.
3. `public/sorion-icon.svg`가 남아 있으면 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`가 삭제합니다.
4. `package-lock.json`이 없으면 CI가 검증된 bootstrap을 수행하며, 로컬 `GENERATE_WEB_LOCK.cmd`는 네트워크 장애 시 선택적으로 사용합니다.
5. 생성·설치·트리 검증을 통과한 npm lock만 main에 반영되고 API·Worker lock은 독립적으로 보존됩니다.
6. Quality 화면은 실기기 15개 시나리오의 측정 진행률을 표시합니다.
7. 타임라인의 `STT 검수 · 실패만 재생성`은 서버 WAV만 검수하고 실패 문장만 최대 2회 다시 생성합니다.
8. `npm run quality:export-soak`는 합성 무음으로 Export 구조만 검증하며 실제 음질·장치 성능으로 해석하지 않습니다.
9. Firebase Web 공개 설정은 `.env.development`·`.env.production`에서 자동 로드되며 Firestore·Storage는 기본 차단 상태입니다.
10. 카카오톡에서 연 모바일 링크는 PC localhost 엔진을 사용하지 않으며 외부 브라우저 또는 공개 HTTPS API가 필요합니다.
11. 모든 재생 버튼은 선택한 목소리·설정을 먼저 적용하고 즉시 재생하며, CosyVoice 프리셋 음원은 `voice-presets` 안내를 따릅니다.
12. 설정의 Engine Doctor에서 API·TTS·Worker·GPU와 프리셋 5종 준비 상태를 한 번에 확인하고 연결 주소를 복구할 수 있습니다.
13. 실제 모델·실기기 수치를 준비하지 않았다면 성공 또는 성능을 가장하지 않습니다.

14. PC 1180px 이상에서는 프로젝트 목록·Chat Workspace·Voice Drawer 3단 편집 화면과 가로 타임라인을 사용합니다.
15. Engine Doctor의 `모바일 공개 HTTPS Bridge`는 현재 요청 Origin이 공개 HTTPS인지 진단하며 인증 수단은 아닙니다.
16. 프리셋 WAV는 1~30초, 16~48kHz, 모노·스테레오 PCM이어야 하며 과도한 무음·클리핑은 Worker 요청 전에 차단됩니다.
17. 장문 첫 WAV 구간은 `segment-ready` 이벤트로 최종 병합 전에 플레이어에 연결됩니다. 이는 파일 단위 부분 전달이며 진짜 스트리밍 코덱은 아닙니다.
18. PC 3단 패널의 너비와 접기 상태는 브라우저 로컬 저장소에 보존됩니다.
19. PC·모바일 음성 설정은 같은 속도·높낮이 범위와 말투 6종을 사용하며, 과거 저장값은 안전 범위로 보정됩니다.
20. Sheet·확인창은 키보드 초점 순환, Escape 닫기, 닫힌 뒤 초점 복귀와 배경 스크롤 잠금을 제공합니다.
21. 전체 Web lint·Vitest·semantic typecheck·production build는 검증된 npm lock이 있는 GitHub Actions에서 최종 확인합니다.

22. 확인창은 명시된 실행 버튼을 이전 활성 요소보다 우선해 초점을 복귀하며, effect cleanup에서 mutable ref를 직접 읽지 않습니다.
23. 운영 환경은 `SORION_SEGMENT_URL_SIGNING_SECRET`을 고정하고 `SORION_TRUSTED_PROXY_CIDRS`에 FastAPI가 직접 보는 proxy egress만 등록합니다.
24. 전달 헤더는 신뢰 CIDR의 직접 peer에서만 사용하며 proxy는 외부 `X-Forwarded-*` 값을 제거한 뒤 다시 설정해야 합니다.
25. 플레이어 지연은 서버 첫 구간, 첫 바이트, 실제 `playing`, Browser Speech `onstart`를 분리해 표시합니다.

26. 기본 프리셋은 혜린·도윤·소리·준호·민준 5종이며 남성 프리셋은 도윤·준호·민준 3종입니다. 실제 CosyVoice 음색은 동의받은 동일 ID WAV가 있을 때만 적용됩니다.
27. 첫 구간 서명 URL이 만료되면 작업 상태에서 새 URL을 한 번 받아 복구하고, 최종 WAV 교체 시 같은 트랙의 현재 재생 위치와 재생 상태를 이어갑니다.

28. 두 번째 이후 준비 구간은 번호순으로 같은 트랙에 누적되며, 다음 구간이 늦으면 대기 후 도착 즉시 이어 재생합니다.
29. 부분 구간 재생은 WAV source 교체 방식이며 실기기 seam 측정 전에는 gapless로 표현하지 않습니다.
30. Quality 화면의 현재 기기 재생 점검은 자동 기능 감지, 사용자 제스처 재생, 탭 숨김·복귀와 네트워크 전환 횟수를 분리 기록합니다.
31. 구간 seam은 이전 WAV ended부터 다음 WAV playing까지 측정하며 생성 대기 포함 여부를 따로 표시합니다.
32. 플레이어 복원은 25분 이내 최종 원격 음원과 Browser Speech만 대상으로 하고 부분 음원·Blob·서명 URL은 저장하지 않습니다.
33. 새로고침 복원 뒤에는 저장 위치만 적용하고 모바일 autoplay 정책 때문에 자동 재생하지 않습니다.

34. 최종 API 음원은 작업 ID와 파일명·만료 시각을 묶은 HMAC URL로 제공되며, 새로고침과 media error에서 작업 결과를 다시 조회해 한 번 재발급합니다.
35. 최종 음원 파일과 작업 결과의 기본 보관 시간은 30분입니다. 파일 자체가 삭제된 뒤에는 URL만 재발급할 수 없으며 다시 생성해야 합니다.
36. Quality의 seam P95와 최종 WAV 교체 오차는 브라우저 이벤트 기반 측정값이며 실제 무음 파형 분석이나 gapless 인증을 대신하지 않습니다.
37. 모바일 인증표는 Android Chrome·iOS Safari에서 기본 재생, 네트워크 전환, 백그라운드 복귀, 설치형 PWA의 10·30·60분 READY 기록을 모두 분리합니다.
