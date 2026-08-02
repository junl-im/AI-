# START HERE

현재 버전: `0.9.3-beta.3 · Engine Heartbeat 5.1 · Web Quality Hotfix`

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
12. 설정의 Engine Doctor에서 API·TTS·Worker·GPU와 프리셋 3종 준비 상태를 한 번에 확인하고 연결 주소를 복구할 수 있습니다.
13. 실제 모델·실기기 수치를 준비하지 않았다면 성공 또는 성능을 가장하지 않습니다.

14. PC 1180px 이상에서는 프로젝트 목록·Chat Workspace·Voice Drawer 3단 편집 화면과 가로 타임라인을 사용합니다.
15. Engine Doctor의 `모바일 공개 HTTPS Bridge`는 현재 요청 Origin이 공개 HTTPS인지 진단하며 인증 수단은 아닙니다.
16. 프리셋 WAV는 1~30초, 16~48kHz, 모노·스테레오 PCM이어야 하며 과도한 무음·클리핑은 Worker 요청 전에 차단됩니다.
17. `첫 음성 준비`는 서버의 첫 사용 가능 파일 준비 시간입니다. 브라우저 실제 재생 시작 시간은 다음 패치에서 별도 측정합니다.
18. PC 3단 패널의 너비와 접기 상태는 브라우저 로컬 저장소에 보존됩니다.
