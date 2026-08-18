# START HERE

현재 버전: `0.11.25 · Web Quality CI Stabilization & Critical Recovery Gate`

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 먼저 읽습니다.
1-1. 0.11.25는 GitHub Actions Web quality의 stale Browser Speech pace test를 수정하고, 핵심 Voice/recovery 테스트를 별도 `critical-regression` phase로 먼저 실행합니다. 기본 Voice 속도는 혜린 1.00 / 도윤 1.04 / 소리 0.98 / 준호 0.98 / 민준 1.08을 유지합니다.
2. 누적 패치는 ZIP을 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.
3. `public/sorion-icon.svg`가 남아 있으면 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`가 삭제합니다.
4. 일반 Push·PR은 커밋된 `package-lock.json`만 검증합니다. 누락·stale lock은 실패하며 CI가 소스를 자동 수정하지 않습니다.
5. lock 갱신은 `generate_lockfiles=true` 수동 실행 또는 로컬 스크립트로 만든 뒤 사람이 변경과 lock 증명을 검토해 커밋합니다.
6. Quality 화면은 실기기 15개 시나리오의 측정 진행률을 표시합니다.
7. 타임라인의 `STT 검수 · 실패만 재생성`은 서버 WAV만 검수하고 실패 문장만 최대 2회 다시 생성합니다.
8. `npm run quality:export-soak`는 합성 무음으로 Export 구조만 검증하며 실제 음질·장치 성능으로 해석하지 않습니다.
9. Firebase Web 공개 설정은 `.env.development`·`.env.production`에서 자동 로드되며 Firestore·Storage는 기본 차단 상태입니다.
10. 카카오톡에서 연 모바일 링크는 PC localhost 엔진을 사용하지 않으며 외부 브라우저 또는 공개 HTTPS API가 필요합니다.
11. 모든 재생 버튼은 클릭 즉시 일시정지 버튼으로 전환되고, 일시정지하면 다시 재생 버튼으로 돌아옵니다. 선택한 목소리·설정을 먼저 적용하며 CosyVoice 프리셋 음원은 `voice-presets` 안내를 따릅니다.
12. 음성 연결은 자동으로 유지됩니다. 상세 API·Worker·GPU 진단은 설정의 `고급 진단 및 개발자 정보`를 열었을 때만 표시됩니다.
13. 실제 모델·실기기 수치를 준비하지 않았다면 성공 또는 성능을 가장하지 않습니다.
14. Quality Lab의 운영자 기준선은 같은 조건의 최근 5건이 있어야 확정할 수 있으며 자동 기준선과 별도로 유지됩니다.
15. 승인 서비스의 원자 쓰기·history·갱신 대기열은 분리 모듈이지만 잠금과 적용 직전 재검증 순서는 변경하지 않습니다.
16. 수동·주간 runtime soak는 Worker를 실제 재시작하고 복구 시간을 기록하며 이전 실행과 응답·누수 지표를 비교합니다.
17. writer lease backend는 현재 `sqlite`만 허용합니다. 미지원 backend는 자동 우회하지 않고 API 시작 단계에서 거부합니다.
18. PC 1024·1280·1440px는 3분할 구조를 유지하되 새 작업은 좌우 패널을 접은 집중 모드로 시작합니다. 헤더의 `프로 패널`로 두 패널을 한 번에 펼칠 수 있습니다.
19. PC 플레이어는 `재생/일시정지 → 진행바`를 한 줄 맨 앞에 두는 Compact Dock을 사용합니다. PC와 모바일 타임라인 모두 ruler·클립·플레이헤드가 같은 좌→우 시간축을 사용하며, 모바일은 트랙 라벨 공간을 줄이고 1.25배 기본 zoom으로 가용 폭을 적극 사용합니다.
20. 타임라인 카드는 대사 미리보기에 집중하고 실제 텍스트 수정·저장·미리듣기·재생성·분할·삭제는 선택 클립 빠른 편집기에서 수행합니다. 프리셋 미리듣기 버튼은 준비 취소·일시정지·계속 재생 상태를 현재 플레이어와 동기화합니다.
21. `auto` 생성에서 서버가 `SOA-4022` 프리셋 호환 불가를 반환하면 호환 가능한 Browser Speech까지 자동으로 이어서 시도합니다.
22. System TTS는 Windows/macOS 기본 백엔드가 해당 프리셋을 거부하거나 실행 실패할 때 설치된 eSpeak 한국어 백엔드를 보조 경로로 시도합니다. eSpeak가 설치되지 않았거나 호환 한국어 음성이 없으면 이 보조 경로는 사용할 수 없습니다.
23. Quality Lab의 운영자 benchmark 기준선은 전체 append-only history를 조회할 수 있고, 과거 기준선은 현재 기준선과 비교 미리보기를 거친 뒤 복원합니다. 복원은 기존 기록을 덮어쓰지 않고 `restored` 이벤트를 추가합니다.
24. 타임라인은 `Ctrl/Cmd`로 개별 다중 선택, `Shift`로 범위 선택합니다. 2개 이상 선택하면 일괄 이동·삭제를 사용하고, 1개 선택은 기존 빠른 편집기로 수정합니다.
25. Quality Lab의 Runtime Soak Compare는 `runtime-soak/2` 이전·현재 JSON을 브라우저 메모리에서만 읽고 API와 같은 회귀 임계치로 비교합니다.
26. Recovery Path Injection은 실제 Wi-Fi나 절전을 조작하지 않습니다. online·pageshow/focus·Network Information change와 `sorion-engine-refresh` 처리 경로만 주입하므로 실기기 장애 인증과 구분합니다.
27. Engine Doctor는 브라우저 음성 inventory fingerprint 변화를 감지합니다. `voiceschanged` 발생 시 프리셋 배정과 엔진 카탈로그를 다시 계산하며 fingerprint는 보안 서명이 아닌 변화 감지용입니다.
28. Worker benchmark History는 운영자 기준선이 아직 없어도 API의 `group_key`를 사용해 같은 조건 그룹을 조회합니다.
29. 엔진 circuit이 열리면 cooldown 동안 해당 엔진을 자동 선택하지 않습니다. cooldown 종료 뒤에는 단 하나의 half-open probe만 허용하고 동시 요청은 backup 엔진으로 우회합니다.
30. `POST /api/v1/engines/{engine_id}/runtime/reset`은 엔진별 재탐지를 먼저 수행합니다. probe 중이거나 재탐지가 실패하면 상태를 억지로 초기화하지 않습니다.
31. Quality Lab과 Engine Doctor의 성공률·평균 지연·누적 격리·cooldown·probe 상태는 런타임 보호 진단이며 실제 음질·성능 benchmark를 대신하지 않습니다.

32. 다중 선택에서 목소리를 바꿀 때는 `변경 미리보기`로 영향 범위를 확인합니다. 적용 시 기존 완성 음원·track·job은 폐기되고 새 revision으로 queued 처리됩니다.
33. `선택 재생성`은 선택 대사 전체를, `실패만 재시도`는 실패한 선택 대사만 다시 생성합니다.
34. Web quality가 production build까지 통과하면 Chromium 1024·1280·1440px 레이아웃 검사를 별도 실행하고 PNG와 SHA-256 manifest를 artifact로 보존합니다.
35. Engine Doctor의 voice inventory 변경 경고는 프리셋별 이전 배정과 현재 배정 diff를 함께 보여줍니다.

36. 일괄 재생성 실패는 엔진·프리셋·연결·취소·기타로 분류합니다. 원인 그룹별 빠른 재시도는 3회까지만 제공하며 이후에는 오류를 확인하고 명시적인 선택 재생성을 사용합니다.
37. auto 엔진 선택은 최소 4개 최근 표본이 있을 때 EWMA 안정도와 지연을 120초 동안 보조 신호로 사용합니다. 사용자가 엔진을 직접 선택하는 요청에는 이 성능 감점을 강제하지 않습니다.
38. 다중 선택 상태에서 `Ctrl/Cmd+A` 전체 선택, `R` 재생성, `Shift+R` 실패만 재시도, `Alt+←/→` 이동, `Delete` 삭제, `Esc` 선택 해제, `?` 도움말을 사용할 수 있습니다. 입력창·버튼 등 폼 요소에는 이 전역 명령을 가로채지 않습니다.
39. Timeline Editor는 최근 20단계 bounded Undo/Redo를 사용합니다. 이동·재정렬·대사 수정·분할·쉼·삭제·일괄 목소리 변경을 되돌릴 수 있으며 내용/voice가 달라진 복원 clip은 stale 음원을 재사용하지 않고 queued로 돌아갑니다.
40. auto 엔진 선택은 현재 실행 중 요청 1건당 일시 부하 감점을 적용해 준비된 엔진 사이에서 병렬 요청을 분산합니다. 이 값은 용량 benchmark가 아니며 명시적 엔진 선택을 막지 않습니다.
41. Engine Doctor의 performance observation 상태는 `warming/active/expired`와 표본 수·남은 관찰창을 표시합니다. 만료 뒤 첫 새 표본은 이전 EWMA와 섞지 않고 새 관찰 세션을 시작합니다.
42. 복구 증거는 `observed-device`·`synthetic-injection`·`not-applicable`로 구분합니다. Recovery Path Injection의 성공 결과는 synthetic 진단일 뿐 Android/iOS 실기기 READY 인증을 충족하지 않습니다.
43. batch 재시도 세션 snapshot은 최근 6건과 재시도 횟수 최대 3회, 성공·실패·건너뜀·실패 분류 집계만 저장합니다. 클립 ID·원문·음원·상세 오류 문자열은 저장하지 않습니다.
44. evidence bundle 신규 export는 schema v3를 사용하고 importer/verifier는 기존 schema v2를 계속 검증합니다. 승인 Chromium baseline PNG가 저장소에 들어오기 전에는 baseline-required CI를 강제하지 않습니다.
45. 새 프로젝트의 기본 제작 동선은 `목소리 선택 → 대본 입력/불러오기 → 바로 더빙 만들기 → 첫 음성 듣기`입니다. 빈 상태에서는 타임라인을 숨기며 `빈 대사부터 직접 편집`을 누르면 기존 타임라인 편집을 즉시 시작합니다.
46. TXT·MD·SRT·VTT는 파일 선택 또는 드래그앤드롭으로 불러옵니다. SRT/VTT cue 번호·타임코드는 편집 대본에 남기지 않으며 가져온 원본 파일 자체는 프로젝트 세션에 저장하지 않습니다.
47. 중앙 원플로우에는 현재 목소리 1개만 표시합니다. 누르면 `목소리 선택` Sheet에서 전체 프리셋의 잘 맞는 상황·장점·주의점과 미리듣기를 비교하며, 미리듣기만으로 현재 선택을 변경하지 않습니다.
48. 원플로우 전체 생성은 첫 준비 결과를 자동 재생하지만 새로고침/세션 복원 자동재생 금지 정책은 그대로 유지합니다.
49. 장문 생성은 첫 대사를 우선 재생한 뒤 나머지를 최대 2개씩 병렬 처리합니다. 엔진 circuit/soft-degrade/active-request 감점 계약은 그대로 적용합니다.
50. 병렬 완료 순서는 사용자 재생 순서가 아닙니다. 생성 종료 시 track ID를 원문 timeline 순서로 정렬해 플레이어 순서를 복원합니다.
51. SRT/VTT 붙여넣기는 자막 cue를 자동 정리하고 `말하기 좋게 정리`는 Markdown 장식만 제거합니다. 의미를 바꾸는 AI 재작성은 자동 실행하지 않습니다.
52. `생성 중지`는 현재 batch token을 무효화하고 실행 중 요청을 abort합니다. 완료 음원은 보존하고 미시작 대사는 queued로 남깁니다.
53. `화자: 대사` 형식은 모든 비어 있지 않은 줄이 명시적 화자 표기를 만족하고 2명 이상이 감지될 때만 Multi-Speaker Assist를 엽니다. 혼합 형식은 자동 배정하지 않습니다.
54. 화자별 목소리는 자동 제안일 뿐이며 `이 화자 배정으로 만들기`를 누르기 전에는 생성 버튼과 Ctrl/Cmd+Enter가 해당 배정을 사용하지 않습니다.
55. 다중 화자 생성 프로젝트는 timeline clip별 text·voiceId·voiceName과 job 순서를 저장하고 재오픈 시 같은 배정을 복원합니다.
56. 생성 중지 뒤 `남은 대사 이어서 만들기`는 queued 블록만 재실행합니다. 이전 ready 블록은 재생성하거나 삭제하지 않습니다.

- Heartbeat 6.8.4는 새 승인·재서명에 active 신뢰 키만 사용하고 previous key는 grace 기간 검증 전용으로 유지합니다. `SORION_VOICE_REVIEW_TRUSTED_KEYS_JSON`에는 이전 key만 넣고 secret은 Git·ZIP·진단 응답에 포함하지 않습니다.
- 승인 apply·재서명·rollback은 같은 로컬 파일시스템을 공유하는 API 프로세스 사이에서도 파일 잠금으로 직렬화됩니다. 여러 서버·네트워크 파일시스템은 단일 writer 또는 분산 잠금이 필요합니다.

- 0.9.6 승인 쓰기는 SQLite writer lease·fencing token·OS file lock을 함께 사용합니다. SQLite 파일을 안전하게 공유하지 않는 다중 노드에서는 별도 분산 lock이 필요합니다.
- GitHub Actions 수동 실행의 `runtime_soak_minutes`에서 5·30·60분을 선택할 수 있으며 주간 예약은 30분입니다.
- Quality Lab의 개인정보 제외 감사 자료는 JSON이 아니라 내부 manifest를 포함한 ZIP으로 내려받습니다.

14. PC 1024px 이상에서는 프로젝트 목록·Chat Workspace·Voice Drawer 3단 편집 화면과 가로 타임라인을 사용합니다.
15. Engine Doctor의 `모바일 공개 HTTPS Bridge`는 현재 요청 Origin이 공개 HTTPS인지 진단하며 인증 수단은 아닙니다.
16. 프리셋 WAV는 1~30초, 16~48kHz, 모노·스테레오 PCM이어야 하며 과도한 무음·클리핑은 Worker 요청 전에 차단됩니다.
17. 장문 첫 WAV 구간은 `segment-ready` 이벤트로 최종 병합 전에 플레이어에 연결됩니다. 이는 파일 단위 부분 전달이며 진짜 스트리밍 코덱은 아닙니다.
18. PC 3단 패널은 v3 레이아웃에서 기본 접힘 집중 모드로 시작하며, `프로 패널`로 펼친 뒤 너비와 접기 상태를 브라우저 로컬 저장소에 보존합니다.
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

50. Heartbeat 6.7.1은 알 수 없는 프리셋을 혜린으로 바꾸거나 남성 프리셋을 여성 음성으로 재생하는 묵시적 폴백을 차단합니다.
51. 도윤·준호·민준에 필요한 남성 후보가 하나뿐이어도 같은 성별 안에서 속도·높낮이 운율을 달리해 재사용합니다. 반대 성별은 계속 차단합니다.
52. 알려진 5개 CosyVoice 프리셋은 동일 ID의 전용 WAV만 사용합니다. 기본 기준 WAV와 다른 인물 WAV는 대체재가 아닙니다.
53. Browser/System 음성은 기기별 근사 음성입니다. 정확한 인물별 음색은 동의받은 5개 전용 WAV와 실제 청취 검토가 필요합니다.

54. Heartbeat 6.8.0은 전용 WAV만으로 준비 완료 처리하지 않습니다. 동일 ID manifest의 동의 확인, `tts-inference` 권리, 사람 청취 승인, 실제 파일 SHA-256 일치가 모두 필요합니다.
55. 같은 WAV SHA-256을 두 개 이상의 인물 프리셋에 등록하면 모든 관련 프리셋을 차단합니다. 파일명만 복사하거나 이름만 바꾸는 방식은 통과하지 않습니다.
56. Quality Lab은 5개 프리셋을 직접 선택해 같은 문장·같은 엔진으로 A/B 비교하며, 로컬 검수 기록과 CSV에 프리셋 ID·표시 이름·선언 성별을 함께 저장합니다.
57. Engine Doctor 진단 복사본에는 WAV·로컬 경로·원문을 넣지 않고 프리셋별 인증 상태, checksum 일치 여부와 중복 ID만 포함합니다.
58. 전달 ZIP의 5개 manifest는 안전한 `pending` 템플릿입니다. 실제 동의·권리·검수 증거와 WAV가 없으므로 기본 상태는 사용 불가가 정상입니다.


## Heartbeat 6.8.3 필수 확인

- GitHub Actions가 표시한 Ruff 3건과 Web quality 4건을 수정했으며 같은 패턴의 재유입은 repository preflight에서 차단한다.
- 로컬 PC의 `127.0.0.1`·`::1` 승인 작업은 기존처럼 운영자 토큰 없이 사용할 수 있다.
- LAN·외부 브라우저에서 승인 이력·미리보기·적용·롤백을 사용하려면 API `.env`에 32자 이상 `SORION_VOICE_REVIEW_OPERATOR_TOKEN`을 설정하고 Quality Lab의 원격 운영자 토큰에 같은 값을 입력한다.
- 운영자 토큰은 Git·ZIP·manifest·감사 로그에 넣지 않는다. 브라우저에서는 현재 탭의 sessionStorage에만 저장한다.
- `X-SoriON-User-ID`나 client ID는 인증 수단이 아니며 actor 보조 표시에만 사용한다.
- apply와 rollback은 같은 잠금 안에서 WAV·manifest를 재검사한다. 파일이 바뀌었으면 미리보기나 과거 승인을 재사용하지 않는다.
- 현재 manifest와 WAV가 승인 기록과 다르면 자동 rollback하지 않는다.


## Heartbeat 6.8.2 필수 확인

- Quality Lab의 검수 JSON은 승인 근거 후보이며 가져오기만으로 manifest를 자동 승인하지 않는다.
- 프리셋 승인은 현재 WAV SHA-256, 현재 manifest digest, 검수 묶음 checksum, 동의·권리·중복 상태를 다시 계산한 diff 미리보기 뒤에만 적용한다.
- 미리보기 뒤 WAV나 manifest가 달라지면 승인 적용을 거부한다. 승인 전후 snapshot은 감사 JSONL에 남고, 현재 manifest가 승인 후 상태와 다르면 자동 롤백하지 않는다.
- `SORION_VOICE_REVIEW_SIGNING_SECRET`이 비어 있으면 승인은 명시적으로 unsigned이다. 키를 설정한 환경만 HMAC-SHA256을 만들고 같은 신뢰 키로 검증한다.
- HMAC은 로컬 키 보유 확인 수단이며 화자 신원·동의·법적 권리를 대신 증명하지 않는다. 비밀키는 저장소·ZIP·진단 복사본에 넣지 않는다.
- CosyVoice Worker의 짧은 자동 합성 telemetry는 10·30·60분 실기기 soak와 별도 JSONL·별도 표로 유지한다.
- benchmark는 모델 digest·GPU·프리셋별 표본 수와 first audio·RTF·handoff P50/P95를 표시하되 표본이 없으면 수치를 만들지 않는다.
- 동의·권리 만료 경고, WAV 교체 시 `stale`, 반대 성별·중복 화자 폴백 차단은 계속 유지한다.
34. 일괄 재생성 결과는 성공·실패·건너뜀으로 요약합니다. 실패가 남으면 해당 클립만 자동 선택되며 사용자는 즉시 `실패만 재시도`를 실행할 수 있습니다.
35. 자동 엔진 선택은 circuit이 열리기 전의 최근 1차 실패에도 짧은 soft-degrade 감점을 적용합니다. 명시적 엔진 선택과 기존 half-open 복구 probe는 이 감점에 의해 차단되지 않습니다.
36. `SORION_ENGINE_SOFT_DEGRADE_SECONDS`는 최근 실패 뒤 auto 선택 감점 시간이며 기본 15초입니다. 0으로 설정하면 soft-degrade만 비활성화되고 circuit breaker는 유지됩니다.


57. 모바일 홈에서도 생성 플레이어 아래 주요 Dock을 함께 표시합니다. 대본 입력에 focus하거나 모바일 키보드 viewport가 변하면 현재 편집 칸을 상단 작업 위치로 재정렬합니다.
58. 대본 맞춤 목소리 추천은 선택 보조일 뿐 자동 적용하지 않으며, 프리셋 전환 시 speed/pitch는 해당 목소리의 권장 자연 범위로 보정합니다.
59. 생성 음성의 store 재생 요청은 플레이어 버튼 상태를 즉시 연결하고 실제 media play가 실패하면 재생 상태를 원복해 오류를 표시합니다.

47. 화자 배정 기억은 화자 원문 대신 정규화 hash key와 voiceId만 최대 24건 로컬 저장하고, 다음 동일 화자 대본에서 제안만 합니다.
48. 장문 제작 완료 메시지의 엔진 기록은 실제 engineId 사용 횟수·전환·fallback을 요약한 routing trace이며 음질 benchmark나 용량 보장을 의미하지 않습니다.
