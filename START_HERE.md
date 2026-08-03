# START HERE

현재 버전: `0.9.3-beta.3 · Engine Heartbeat 6.7 · Field Evidence Intake & Local Export Bundle`

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 먼저 읽습니다.
2. 누적 패치는 ZIP을 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.
3. `public/sorion-icon.svg`가 남아 있으면 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`가 삭제합니다.
4. 일반 Push·PR은 커밋된 `package-lock.json`만 검증합니다. 누락·stale lock은 실패하며 CI가 소스를 자동 수정하지 않습니다.
5. lock 갱신은 `generate_lockfiles=true` 수동 실행 또는 로컬 스크립트로 만든 뒤 사람이 변경과 lock 증명을 검토해 커밋합니다.
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
38. Quality Lab의 실기기 recorder는 10·30·60분 wall-clock을 직접 측정하고 SSE 재연결, 음원 fetch 복구, 재생 중단 시간을 별도 저장합니다.
39. 복구 시나리오는 boolean 성공과 세 가지 복구 시간이 모두 있어야 READY 후보가 되며 목표 시간의 98% 미만 기록은 warning입니다.
40. 최종 Export는 서버에 기본 30분만 임시 보관됩니다. 장기 보존은 음원·SRT·VTT를 사용자 기기로 내려받는 방식만 지원합니다.
41. 로컬 보존 기록은 파일명·형식·기록 시각만 저장하며 음성 바이트, 원문, 전체 URL을 저장하지 않습니다.

42. Heartbeat 6.5.1은 복원 음원의 자동재생을 차단하고 부분→최종 WAV 교체 위치·상태 및 CI Web fixture를 안정화한 Hotfix입니다.

43. Heartbeat 6.5.2는 Web Streams tee 분기의 cancel 교착을 제거하고, 최종 WAV source 교체 테스트가 DOM 반영 뒤 metadata를 검증하도록 동기화한 Hotfix입니다. 제품 버전은 `0.9.3-beta.3`으로 유지됩니다.

44. Heartbeat 6.6은 lint·typecheck·Vitest·build를 동일한 7단계 Web 품질 실행기로 묶고 단계별 로그, package lock과 dist 파일의 SHA-256을 artifact로 남깁니다.
45. Web 품질 report 검증은 JSON 자체뿐 아니라 실제 로그 파일, 현재 package.json·package-lock.json과 dist 산출물 manifest까지 대조합니다.
46. 필드 증거 JSON은 장치 별칭·브라우저 상세 버전·메모를 기본 제거하고 레코드별·전체 묶음 SHA-256을 포함합니다. 이 checksum은 변조 감지용이며 발행자 전자서명은 아닙니다.

47. Heartbeat 6.7은 field evidence v2와 완료된 Web quality run report를 preview 후 등록하며 bundle·record/evidence SHA-256 중복을 차단합니다.
48. Quality Lab의 로컬 ZIP은 WAV·MP3·SRT·VTT·JSON 최대 20개, 250MiB 이하만 브라우저에서 묶고 파일별 SHA-256 manifest, 진행률과 취소를 제공합니다.
49. Repository preflight는 npm lock을 필수 검사합니다. 덮어쓰기 패치는 저장소의 기존 검증 `package-lock.json`을 보존하며 lock이 없는 독립 ZIP은 검증 lock을 먼저 추가해야 합니다.
