# QA REPORT — AI 쇼츠 스튜디오 v1.5.29

## 최종 결과

- 자동 검사: **213/213 통과**
- 실행 방식: 단일 실행이 환경 제한 전에 0~171까지 통과한 뒤 종료되어 0~171, 172~190, 191~212 세 구간으로 완주, 실패 **0건**
- 신규 회귀: stable option signature, 설정 변경 cache key 분리, 단일 옵션 스냅샷, signature별 선택 정리, 저장 비용 추세, 캐시된 유지보수 스냅샷 모두 통과
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 install·activate·이전 앱 셸 cache 정리·offline navigation 통과

## 기능·기술 결과

- 자동 컷 옵션 변경 시 메모리·영구 캐시 키가 분리되어 stale 결과가 적중하지 않음
- 객체 키 순서가 다른 동일 옵션은 같은 16자리 signature를 생성
- 키 생성과 분석 파이프라인이 동일한 단일 옵션 스냅샷을 사용
- 분석 캐시 계약 v3, 기존 v2는 이전 namespace로 보존
- signature별 항목 수·추정 바이트·마지막 사용 요약과 선택 삭제 통과
- 파일명·경로·원시 키·옵션 원문·분석 본문 비노출 통과

## 성능 결과

- 정책 갱신 한 번의 전체 읽기로 entries·namespace·signature snapshot 생성
- 후속 `maintenanceSnapshot({ refresh: false })` 호출에서 `readAllScans` 증가 0
- 저장소 진단 새로고침 전체 스캔 경로를 기존 최대 3회에서 1회로 감축
- namespace 저장 비용 추세 최대 48개, 동일 상태 중복 기록 방지, signature 삭제 뒤 감소 표본 기록 통과

## UI·CSS 결과

- signature 선택 정리와 namespace 저장 비용 추세 렌더링·상태 갱신 통과
- Chromium 4개 viewport에서 새 패널 포함 body/html scroll width가 viewport와 동일
- CSS ownership: 연결 CSS 46개, 전체 CSS 47개, `!important` 593개
- conflict·same-value duplicate·shadowed declaration: **0건**

## 런타임 감사

- browser audit: 4개 viewport 오류·거절·console error 0, horizontal overflow 0
- service worker lifecycle: `ai-shorts-studio-shell-v1.5.29-analysis-signature-storage-trend`, install·activate·offline navigation 통과
- GPU/media capability: acceleration-requested·software-forced 모두 1280×720 30fps H.264/AAC 62프레임, dropped frame 0
- interaction-state audit는 v1.5.29로 신규 실행
- process-memory·structure-priority·long-video 자료는 대상 소유 경로가 변경되지 않아 v1.5.28 근거를 명시적으로 상속

## 감사 제한

- IndexedDB 저장 비용은 직렬화 기반 추정치이며 실제 브라우저 디스크 사용량과 차이가 있을 수 있습니다.
- 추세와 유지보수 이력은 best-effort localStorage이므로 사이트 데이터 삭제·저장 차단·quota 오류에서 손실될 수 있습니다.
- 실제 모바일 Safari·Samsung Internet 다운로드 관리자와 물리 GPU 장시간 동작은 실기기 검증이 필요합니다.

---

# QA REPORT HISTORY — v1.5.28 source document

# QA REPORT — AI 쇼츠 스튜디오 v1.5.28

## 최종 결과

- 자동 검사: **212/212 통과**
- 실행 방식: 컨테이너 단일 명령 제한으로 검사 0~180의 181개와 181~211의 31개를 연속 두 구간으로 실행, 실패 **0건**
- 신규 회귀 검사: 이전 namespace 보존, 비식별 상태 요약, 다중 선택 정리, 현재 namespace 보호, bounded 유지보수 이력 모두 통과
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과

## 분석 namespace 결과

- 일반 상태 조회·새 캐시 쓰기·TTL/LRU 정리 후 이전 namespace 보존 통과
- 현재·이전 namespace 항목 수·바이트·마지막 접근·계약·앱 버전·tier 집계 통과
- 이전 namespace 16자리 비식별 토큰 표시와 원문 비노출 통과
- 여러 이전 namespace 선택 삭제, 현재 namespace 보호, 알 수 없는 토큰 무시 통과
- 항목 삭제·조건 무효화·namespace 삭제·clear·자동 정리 이력 최대 20개 순환 보관 통과
- 파일명·경로·원시 캐시 키·이전 namespace 원문 비노출 통과

## UI·CSS 결과

- 저장소 패널 namespace 상태·다중 선택·최근 이력 렌더링 및 갱신 통과
- Chromium 4개 viewport에서 새 패널 포함 body/html scroll width가 viewport와 동일
- CSS ownership: 연결 CSS 46개, 전체 CSS 47개, `!important` 593개
- 실제 conflict·same-value duplicate·shadowed declaration: **0건**

## 런타임 감사

- browser audit: 4개 viewport 오류·거절·console error 0, horizontal overflow 0
- service worker lifecycle: 새 cache `ai-shorts-studio-shell-v1.5.28-analysis-namespace-maintenance-history`, install·activate·offline navigation 통과
- GPU/media capability: acceleration-requested·software-forced 모두 1280×720 30fps H.264/AAC 62프레임, dropped frame 0
- interaction-state·process-memory·structure-priority 자료는 대상 코드가 변경되지 않아 v1.5.27 근거를 명시적으로 상속
- 15→30→15분 장시간 MP4 자료는 v1.5.27 파일을 상속하며 실제 장시간 실행 근거는 v1.5.24

## 감사 제한

- structure priority probe는 v1.5.28 재실행이 환경 실행 제한을 넘겨 완료되지 않아, 변경하지 않은 4개 owner stylesheet의 v1.5.27 근거를 상속했습니다.
- 유지보수 이력은 best-effort localStorage이므로 사이트 데이터 삭제·저장 차단·quota 오류에서 손실될 수 있습니다.
- 이전 namespace는 사용자가 선택 정리하기 전까지 IndexedDB 사용량에 남습니다.
- 실제 모바일 Safari·Samsung Internet 다운로드 관리자와 물리 GPU 가속은 실기기 검증이 필요합니다.

---

# QA REPORT HISTORY — v1.5.27 source document

# QA REPORT — AI 쇼츠 스튜디오 v1.5.27

## 최종 결과

- 자동 검사: **208/208 통과**
- 신규 회귀 검사: quota 적응형 영구 캐시·항목별 삭제, 중요 백업·복원 미리보기, 서비스워커 감사 이력·백오프·진단 내보내기 모두 통과
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 install·activate·이전 캐시 보존/정리·offline navigation·전체/표본 콘텐츠 무결성·온라인 복귀 재개 통과

## 분석 캐시 결과

- 저장소 정상: 최대 8개·16MiB
- 저장소 경고: 기본 한도의 60%
- 저장소 위험: 최소 2개·4MiB
- quota 오류 정리·재시도와 선택 항목 삭제 통과
- 목록·진단에서 파일명·경로·원시 키·분석 본문 비노출 통과

## 세션 복구 결과

- 회전 정리되지 않는 중요 백업 생성·해제 통과
- 중요 백업 자동 복구 우선순위 통과
- 프로젝트 제목·추천·자막·선택 구간·압축 상태 미리보기 통과
- 중요 백업 복원 성공·실패 이력 기록 통과

## 서비스워커 감사 결과

- 감사 이력 최대 40개 순환 보관
- 반복 실패 자산 5분~6시간 지수 백오프
- 정상·복구 성공 자산 백오프 해제
- 온라인 복귀 후 감사 자동 재개
- 감사·복구·백오프·롤백 진단 JSON 내보내기 통과

## 런타임 감사

- Chromium 4개 viewport runtime error·Promise rejection·console error·horizontal overflow: **0건**
- process memory audit: runtime error **0건**, RSS slope **13.8827MiB/cycle**, JS heap slope **0.0049MiB/cycle**
- CSS ownership: 연결 CSS **47개**, `!important` **593개**, 실제 충돌·same-value duplicate·shadowed declaration **0건**
- 장시간 15→30→15분 미디어 계약은 미디어 소유 경로가 동일해 검증된 v1.5.24 근거를 명시적으로 상속

## 감사 제한

- 저장소 usage·quota는 브라우저 추정치이며 실제 IndexedDB 디스크 오버헤드와 차이가 있을 수 있습니다.
- 감사 이력·백오프는 앱 셸 캐시 삭제 시 함께 초기화됩니다.
- 실제 모바일 Safari·Samsung Internet 다운로드 관리자와 물리 GPU 가속은 실기기 검증이 필요합니다.

---

# QA REPORT HISTORY

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.13

## 최종 결과

- 자동 검사: **172/172 통과**
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과
- Chromium process memory audit 16회, runtime error 0, active operation·render queue 0
- GPU/media comparison 두 모드 디코딩 성공, GPU·media utility process 관측
- 미디어 실행 경로 미변경으로 v1.5.9 장시간 MP4 감사 결과 상속

## UI·CSS 결과

- 실제 selector-property 충돌: **48 → 0**
- medium/high-risk 충돌: **0 → 0**
- shadowed declaration: **51 → 0**
- 활성 `!important`: **833 유지**
- source declaration 47개 제거, selector group 2개 안전 분리
- 4개 viewport 전체 DOM targeted computed style과 결정적 screenshot은 v1.5.12 대비 변화 0건

## 감사 제한

- same-value duplicate CSS 57건은 conflict가 아니며 stylesheet fallback 검토 후 별도 정리합니다.
- headless process RSS/GPU 분류는 실제 hardware-accelerated browser의 개별 native decoder buffer를 직접 측정하지 않습니다.
- 30fps 고비트레이트 원본과 모바일 실기기 검증은 별도 환경이 필요합니다.

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.12

## 최종 결과

- 자동 검사: **171/171 통과**
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과
- Chromium process memory audit 16회, runtime error 0, active operation·render queue 0
- GPU/media comparison 두 모드 디코딩 성공, GPU·media utility process 관측
- 미디어 실행 경로 미변경으로 v1.5.9 장시간 MP4 감사 결과 상속

## UI·CSS 결과

- 실제 selector-property 충돌: **197 → 48**
- medium/high-risk 충돌: **149 → 0**
- shadowed declaration: **212 → 51**
- 활성 `!important`: **841 → 833**
- field·disabled state·ambient overlay·surface·recommendation action·status dot 단일 소유권 smoke 통과
- 4개 viewport targeted computed style은 v1.5.11과 동일

## 감사 제한

- 남은 48건은 low-risk geometry·token·fallback 충돌입니다.
- headless process RSS/GPU 분류는 실제 hardware-accelerated browser의 개별 native decoder buffer를 직접 측정하지 않습니다.
- 30fps 고비트레이트 원본과 모바일 실기기 검증은 별도 환경이 필요합니다.

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.11

- 자동 검사 **171/171 통과**
- CSS conflicts 214→197, high-risk 11→0, `!important` 853→841, shadowed 239→212
- 4개 viewport 오류·가로 overflow 0건
- process memory·GPU/media·service worker 감사 통과

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.10

- 자동 검사 **168/168 통과**
- CSS conflicts 271→214, high-risk 50→11, `!important` 875→853, shadowed 314→239
- 4개 viewport 오류·가로 overflow 0건

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.9

## 최종 결과

- 자동 검사: **167/167 통과**
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과
- Chromium process memory audit 16회, runtime error 0, active operation·render queue 0
- 실제 15분→30분→15분 1920×1080 MP4 교체·분석·추천·2초 출력·정리 통과
- 장시간 감사 종료 후 활성 Object URL: **0개**

## UI·CSS 결과

- 실제 selector-property 충돌: **304 → 271**
- 고위험 충돌: **69 → 50**
- shadowed declaration: **372 → 314**
- 활성 `!important`: **879 → 875**
- brand panel·version badge·brand signature·bottom dock·primary/secondary button skin 단일 소유권 smoke 통과

## Long video 결과

- 15분 최초 분석: **13.042초**, 2초 출력: **3.661초**
- 30분 분석: **23.596초**, 2초 출력: **2.863초**
- 15분 재교체 캐시 분석: **0.288초**, 2초 출력: **2.863초**
- 전 구간 `sequential-safe`, decoded audio/channel buffer 비보존, operation·queue 해제 통과
- 각 반복 source Object URL 1개·export URL 0개, dispose 뒤 active URL 0개

## 감사 제한

- 장시간 소스는 지속시간과 안정성을 위한 1fps all-keyframe 합성 1080p MP4이며 고프레임·고비트레이트 카메라 원본을 대체하지 않습니다.
- headless process RSS/GPU 분류는 개별 native decoder buffer를 직접 측정하지 않습니다.

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.8


## 최종 결과

- 자동 검사: **166/166 통과**
- 데스크톱·소형 노트북·태블릿·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- v1.5.7 대비 hero·stage·first panel·dock 계산 geometry 변화: **0px**
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과
- Chromium process memory audit 16회, runtime error 0, active operation·render queue 0

## UI·CSS 결과

- 실제 selector-property 충돌: **334 → 304**
- 고위험 충돌: **81 → 69**
- shadowed declaration: **414 → 372**
- 활성 `!important`: **904 → 879**
- header topline, desktop shell, mobile title 단일 소유권 smoke 통과

## Memory audit 범위

- 직접 측정: Chromium process tree RSS/USS, renderer JS heap, DOM/layout/style counter
- 보조 분류: GPU process와 media-capable utility process RSS
- 제한: shared RSS 중복 가능성, decoder buffer 직접 귀속 불가, headless와 hardware GPU 차이

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.6

## 최종 결과

- 자동 검사: **163/163 통과**
- PC·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 가로 overflow: **0px**
- 데스크톱 workspace resize·preview/waveform 집중 모드 통과
- 모바일 compact/expanded menu와 데스크톱 전용 control 비노출 통과
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과

## UI·CSS 결과

- 활성 `!important`: **866 → 863**
- 실제 selector-property 충돌: **342 → 338**
- 고위험 충돌: **89 → 85**
- shadowed declaration: **431 → 422**
- compact hero, mobile start guide, panel hierarchy, header metadata ownership smoke 통과

---

# QA REPORT HISTORY — AI 쇼츠 스튜디오 v1.5.5

## 최종 결과

- 자동 검사: **162/162 통과**
- PC·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 가로 overflow: **0px**
- 모바일 compact/expanded dock와 toast 위치, desktop 8-tab dock 계산 스타일 유지
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과

## CSS ownership 감사

- 활성 `!important`: **898 → 866**
- 실제 selector-property 충돌: **511 → 342**
- 고위험 충돌: **198 → 89**
- shadowed declaration: **675 → 431**
- toast, dock geometry, transport/export 버튼, start command panel 단일 소유권 smoke 통과

---

# QA REPORT — AI 쇼츠 스튜디오 v1.5.4

## 최종 결과

- 자동 검사: **162/162 통과**
- PC·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 가로 overflow: **0px**
- 데스크톱 workspace toolbar·두 column resizer·키보드 resize·preview/waveform focus 통과
- 모바일에서 데스크톱 toolbar·resizer 비노출, 핵심 메뉴 4개·전체 메뉴 8개 통과
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과

## CSS ownership 감사

- 디스크 CSS: 46개, 활성 CSS: 45개, 보관 CSS: `cinematic-hero.css` 1개
- 활성 `!important`: **911 → 898**
- 실제 selector-property 충돌: **526 → 511**
- 고위험 충돌: **206 → 198**
- shadowed declaration: **701 → 675**
- 최종 분류: layout 194, skin 196, typography 70, interaction 8, token 9, other 34
- 추천 카드·모바일 시네마틱 헤더·데스크톱 studio grid의 단일 소유권 smoke 통과

## 감사 파일

- `qa/runtime-css-ownership-v1.5.4.json`
- `qa/runtime-browser-audit-v1.5.4.json`
- `qa/runtime-service-worker-lifecycle-v1.5.4.json`
- 실미디어·20회 힙 경로는 CSS-only 변경으로 v1.5.3 검증 산출물을 상속

---

# QA REPORT — AI 쇼츠 스튜디오 v1.5.3

## 최종 결과

- 자동 검사: **162/162 통과**
- PC·모바일 JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 가로 overflow: **0px**
- MP3·MP4 분석→추천→렌더·다운로드 통과
- 렌더 취소, 실패 주입 후 재시도, 10분 MP3 장시간 흐름 통과
- 설정 컨트롤러 정규화·프리셋·UI 동기화 검사 통과
- 20회 operation 반복 감사: 각 주기 잔류 작업 **0건**
- 서비스워커 설치·활성·캐시 정리·오프라인 복구 통과

## v1.5.3 신규 검사

- `settings_controller_smoke.js`: 자막 경계값, 품질 UI 값, 컷 민감도, 프리셋 상태 검증
- `repeated_operation_cleanup_smoke.js`: 20회 미디어 세션·분석·미리보기·렌더 소유권 정리 검증

---

# QA REPORT — AI 쇼츠 스튜디오 v1.5.0

## 결과

- 자동 검사: **149/149 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- PC 메뉴 8/8, 모바일 핵심 메뉴 4/4, 전체 메뉴 8/8
- workspace-first 축소 헤더, 진행률, 다음 행동, 분석 취소·재시도 계약 통과

## UI·UX 신규 검사

- 소개/작업실 토글과 상태별 `data-studio-focus` 전환
- 접근 가능한 journey progressbar와 다음 행동 버튼
- 작업 모드에서 소개 영역 높이 축소 및 장식 요소 제거
- 분석 실행 중 취소 버튼 노출, 취소 후 재시도 연결
- controller의 shell 단계 지연 로딩과 직접 부트 스크립트 예산 유지
- 모바일 중복 파일 CTA 방지와 현재/다음 메뉴 유지

## 엔진 신규 검사

- 성능 예산의 병렬 분석 조건과 안전 순차 fallback
- 70ms 오디오·70ms 움직임 모의 작업에서 병렬 경로의 wall-time 단축
- 움직임 분석 실패 시 오디오 결과 유지와 경고 발생
- 분석 전략·단계별 timing 메타데이터
- cache set/get 스냅샷 격리와 typed-array 복제
- 30분 TTL, LRU 상한, 품질 설정·namespace 기반 cache key
- 런타임 annotation 이전 결과 캐싱

## 실미디어 E2E

- 20초 MP3: 출력 작업 2.131초, MP4 397,377바이트, ffprobe 통과
- 20초 MP4: 출력 작업 2.257초, MP4 133,975바이트, ffprobe 통과
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 의도적 재생 실패 후 재시도: attempts 2, 출력 작업 2.195초, MP4 389,921바이트
- 10분 MP3 분석: **5.423초**
- 장시간 분석: 8kHz, 분석 트랙 약 18.3MB, 예상 decode 메모리 약 219.7MB
- 분석 뒤 decoded AudioBuffer·channelData 미보유
- 6초 출력 작업: **6.190초**, MP4 **1,908,764바이트**, ffprobe 통과
- 모든 시나리오 런타임 오류 0, 완료 뒤 활성 operation 0

## 서비스워커 감사

- install, shell cache, skipWaiting 통과
- activate, 이전 앱 cache 정리, clients.claim 통과
- 캐시된 offline navigation fallback HTTP 200 통과
- localhost 실브라우저 제어 E2E는 실행 환경의 포트 제한으로 미실행

## 감사 파일

- `qa/runtime-browser-audit-v1.5.0.json`
- `qa/runtime-media-e2e-v1.5.0.json`
- `qa/runtime-service-worker-lifecycle-v1.5.0.json`

## 배포 대상

- 유효 파일 267개
- v1.4.1 기준 변경·신규 파일 101개
- 삭제 파일 0개
- 임시 화면 PNG, Python cache, Git metadata, node_modules, 중첩 ZIP 제외

## 알려진 제한

- 실미디어 Chromium 환경은 deviceMemory 4GB로 병렬 조건에 해당하지 않았습니다. 병렬 경로는 실제 파이프라인 모의 시간·부분 실패 검사로 검증했습니다.
- 8코어·8GB 이상 실기기, 모바일 Safari·Samsung Internet, 15분·30분 고해상도 MP4와 반복 자원 누수 감사를 추가해야 합니다.

---

# QA REPORT — AI 쇼츠 스튜디오 v1.4.1

- 자동 QA: **145/145**
- 격리 서비스워커 생명주기 감사 통과
- 브라우저 감사 오류 0
- MP3·MP4·취소·재시도·10분 미디어 E2E 통과
- localhost 실서비스워커 E2E는 실행 환경의 포트 바인딩 제한으로 미실행

---

# QA REPORT — AI 쇼츠 스튜디오 v1.4.0

## 결과

- 자동 검사: **143/143 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- PC 메뉴바 8/8, 모바일 간단 메뉴 4/4, 모바일 전체 메뉴 8/8 표시
- 단계 네온 랜딩, 지속 라인, PC 작업실 조절 정상

## v1.4.0 신규 구조·예외 검사

- 렌더 워크플로 컨트롤러 factory 공개 및 메인 앱보다 선행 로딩
- 컨트롤러의 서비스워커 셸 캐시 포함
- 렌더 큐 행에서 `innerHTML` 미사용
- HTML 태그 형태의 제목·오류가 literal text로 표시되는 동작
- 렌더 완료 출력 저장 1회
- render operation 종료 정확히 1회
- 렌더 후 원래 후보와 수동 범위 복원
- 실패 항목 재시도가 새 렌더 작업으로 연결되는 계약
- bitrate·FPS·ETA·접근성 진행률 전달 위치 갱신
- 핵심 직접 스크립트 예산 45개

## 기존 회귀 유지

- 클립보드 권한 실패 fallback과 실제 성공 결과 확인
- 유효·손상 자동저장 원문 내보내기
- 손상·과대 localStorage 세션 삭제 가능 상태
- 프로젝트 스키마 v3와 입력 상한
- 렌더 원본 미디어 상태·스트림·트랙 cleanup
- 분석 워커 무응답 watchdog과 호환 분석 fallback
- 서비스워커 단일 등록 소유와 앱 cache namespace 범위
- 분석·미리보기·렌더 operation 취소·정리
- `PATCH_MANIFEST.txt` 미생성·미포함 계약

## 실미디어 E2E

- 20초 MP3: 분석 → 추천 → 선택 → MP4 다운로드, 2.264초, 418,961바이트
- 20초 MP4: 오디오·움직임 분석 → 추천 → 선택 → MP4 다운로드, 2.240초, 194,560바이트
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 새 작업 attempts 2, done 1
- 재시도 출력: 2.212초, 382,921바이트, ffprobe 통과
- 10분 MP3 분석: 약 **6.164초**
- 장시간 균형 모드, 8kHz 분석 트랙, 예상 분석 메모리 약 **18.3MB**
- 예상 디코딩 메모리 약 **219.7MB**, 위험도 medium
- decoded AudioBuffer·channelData 분석 후 유지 없음
- 렌더 중 ETA 약 3초 노출
- 6초 렌더 출력: 약 **6.346초**, **1,670,118바이트**, ffprobe 통과
- 모든 실미디어 시나리오에서 런타임 오류 0, 완료 후 활성 operation 0

## 감사 파일

- `qa/runtime-browser-audit-v1.4.0.json`
- `qa/runtime-media-e2e-v1.4.0.json`

## 배포 무결성

- 전체 설치본 유효 파일 254개, ZIP 항목 278개
- v1.3.9 기준 덮어쓰기 패치 91개 파일
- 전체·패치 ZIP `unzip -t` 통과
- `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 중첩 `dist`, 중첩 ZIP: 0개
- v1.3.9 전체 설치본 + 패치 결과가 v1.4.0 전체 설치본과 파일명·SHA-256 기준 완전 일치
- 전체 설치본을 별도 디렉터리에 풀어 `npm test` **143/143 재통과**

## 알려진 제한

- Chromium 감사 하네스는 비보안 인라인 환경이므로 실제 서비스워커 설치→대기→활성화 전환과 localStorage 지속성은 별도 감사가 필요합니다.
- 매우 긴 무압축 오디오의 순간 디코딩 메모리는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.


## v1.5.3 신규 검사
- media import controller and Object URL ownership
- bounded render-frame gradient and text-measure caches
- architecture-aware media import and operation ownership contracts
- total automated checks: 161/161
- fresh responsive Chromium audit generated
- full media rerun limitation documented in HANDOFF.md

## v1.5.3 실제 미디어 20회 힙 안정성 감사

- 동일 Chromium 페이지에서 16초 MP3 파일 교체 → 자동 분석 → 추천 생성 → 1초 렌더 → 다운로드를 20회 반복합니다.
- 각 주기 뒤 active operation 0건, 렌더 큐 비실행·빈 목록을 확인합니다.
- 원본 Object URL은 작업 중 1개, 임시 출력 URL은 비누적, disposal 뒤 전체 0개를 확인합니다.
- 강제 GC 뒤 V8 JS 힙의 워밍업 구간 중앙값, 마지막 구간 중앙값, 회귀 기울기를 기록합니다.
- 빠른 `heap_stability_smoke.js`를 일반 자동 QA에 추가해 실브라우저 감사 산출물의 20회 완료와 모든 판정 통과를 보장합니다.
- 측정 결과: 워밍업 중앙값 **3.812 MiB**, 마지막 5회 중앙값 **4.193 MiB**, 증가 **0.381 MiB(10.0%)**, 기울기 **-0.011 MiB/회**입니다.
- Object URL은 생성 40개·해제 40개이며 disposal 뒤 활성 0개입니다.
- 전체 자동 QA는 신규 smoke를 포함해 **162/162 통과**했습니다.
- 제한: GPU·전체 Chromium RSS·OS 미디어 디코더 네이티브 메모리는 이번 판정의 직접 범위가 아닙니다.
