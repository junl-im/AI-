# CHANGELOG

## v1.6.40

- 제공자별 named Local AI endpoint profile 저장·전환·삭제 API 추가
- 기존 endpoint-only settings를 provider별 deterministic default profile로 자동 migration
- profile별 endpoint·선호 모델·최근 probe·bounded model cache 독립 보존
- profile 전환 시 endpoint-bound runtime trust를 초기화하고 새 probe 전 generation 차단
- profile 삭제 시 해당 endpoint digest pin 정리, duplicate endpoint와 final profile 삭제 차단
- desktop/mobile Local AI 패널에 profile 선택·이름·저장·삭제·상태 요약 UI 추가
- diagnostics snapshot은 profile count와 active token만 노출하고 endpoint/profile 원문 비공개
- 정적 body build marker를 v1.6.40으로 동기화
- 신규 `local_ai_endpoint_profiles_smoke.js` 등록, 전체 QA 318/318 통과
- 현재 버전 4-viewport·5-cycle heap·8-cycle process-memory·30분 Smart Reframe·speaker browser 감사 갱신
- 서비스워커 135개 자산 v1.6.40 무결성 갱신
- 최종 전달 3단 구성과 통파일/패치 ZIP 동시 제공 규칙 유지

## v1.6.39

- Local AI 모델 digest pin을 provider·endpoint token·model id 범위로 분리
- 같은 모델명을 사용하는 여러 localhost endpoint의 pin 충돌과 덮어쓰기 제거
- 기존 `provider:model` pin을 저장된 현재 endpoint 범위로 자동 이관
- 다른 endpoint pin이 존재하면 새 endpoint probe 전 generation을 stale 상태로 차단
- generation·transcription 실패를 prompt·endpoint 비보존 bounded provider history에 기록
- `NaN`, `Infinity`, 음수 file size 전사 입력을 transport 전에 거부
- 신규 `local_ai_endpoint_pin_history_smoke.js` 등록, endpoint integrity 회귀 갱신
- 전체 QA 317/317 통과, 현재 버전 4-viewport·heap·process-memory·30분 Smart Reframe·speaker browser 감사 갱신
- 서비스워커 135개 자산 v1.6.39 무결성 갱신
- 최종 전달 3단 구성과 통파일/패치 ZIP 동시 제공 규칙 유지

## v1.6.38

- provider별 active probe controller를 추가해 새 연결 확인·endpoint 변경 시 이전 실제 HTTP transport 즉시 abort
- 교체된 probe 호출자가 stale 성공값을 받지 않고 `LOCAL_AI_PROBE_SUPERSEDED`로 종료되도록 계약 강화
- external abort reason의 name·code·recovery·status metadata 보존
- Local AI UI capability별 sequence와 endpoint/provider 변경 invalidation으로 늦은 결과 렌더 차단
- structured-output strict 요청과 fallback이 하나의 absolute timeout budget을 공유하도록 수정
- whisper.cpp `/inference`와 OpenAI 호환 transcription fallback의 전체 deadline 공유
- 신규 `local_ai_operation_deadline_smoke.js` 등록, race·실제 loopback transport·UI 회귀 강화
- 전체 QA 316/316 통과 — 등록 순서 shard와 독립 retry 기준, 단일 연속 실행 제한은 문서화
- 현재 버전 4-viewport, process-memory, GPU/media, 30분 Smart Reframe, speaker timing/live preview/paging 감사 갱신
- 서비스워커 135개 자산 v1.6.38 무결성 갱신 및 최종 전달 3단 구성·두 ZIP 규칙 유지

## v1.6.37

- `modelPins` 명시 설정을 merge가 아닌 map 교체로 처리해 unpin 성공 후 삭제된 pin이 되살아나던 버그 수정
- provider별 probe sequence를 추가해 늦게 완료된 이전 endpoint 응답이 최신 상태를 덮어쓰지 못하도록 보강
- endpoint 변경 시 진행 중 probe commit 권한과 기존 ready 상태를 즉시 무효화
- running 상태 알림 구독자가 동기 취소한 job의 executor가 microtask에서 호출되던 재진입 예외 수정
- abort·timeout 원인 생성을 `signalError()`로 통합하고 executor 예약 전·호출 직전 이중 abort 검사 적용
- 신규 `local_ai_state_race_smoke.js`, `ai_job_reentrant_cancel_smoke.js` 등록, 전체 QA 315/315 통과
- heap 감사 harness를 실제 200ms·8kHz mono WAV와 180×320 감사 전용 렌더로 조정해 5회 소유권 감사를 재현 가능하게 개선
- 현재 버전 4-viewport, process-memory, GPU/media, 30분 Smart Reframe, speaker timing/live preview/paging 감사 갱신
- 서비스워커 135개 자산 v1.6.37 무결성 갱신 및 최종 전달 3단 구성·두 ZIP 규칙 유지

## v1.6.36

- model digest 검증을 마지막 probe endpoint에 결속해 endpoint 변경 후 이전 검증 상태가 재사용되는 무결성 버그 수정
- endpoint 변경 시 pin 상태를 `stale`로 전환하고 새 probe 전 generation을 fetch 이전에 차단
- provider capabilities와 model 목록을 deep freeze해 외부 변조로 검증·진단 상태가 변경되지 않도록 보강
- 비정상 model size·latency를 finite bounded 값으로 정규화
- redirect·unreachable·HTTP 오류 code와 사용자 recovery guidance 추가
- Local AI UI에 stale·unchecked·mismatch 상태와 endpoint 재확인 안내 추가
- 실제 loopback HTTP 서버 기반 redirect target 미접촉·timeout·external abort·HTTP 503 통합 회귀 추가
- endpoint integrity 회귀와 transport integration 회귀를 등록해 전체 QA 313/313 통과
- 실미디어 heap harness를 실제 1초 WAV import/analysis와 0.05초 render 5회 소유권 감사로 조정
- 현재 버전 4-viewport, process-memory, GPU/media, 30분 Smart Reframe, speaker timing/live preview/paging 감사 갱신
- 서비스워커 135개 자산 v1.6.36 무결성 갱신 및 최종 전달 3단 구성·두 ZIP 규칙 유지

## v1.6.35

- localhost 전용 로컬 AI 전송 계층에서 HTTP redirect를 차단해 prompt·schema·미디어가 외부 주소로 우회되지 않도록 보강
- caller fetch 옵션보다 보안 옵션을 마지막에 적용해 `credentials: omit`, `referrerPolicy: no-referrer`, own abort signal을 강제
- request timeout, response size, prompt/schema, transcription size, caption cue/text, history 설정을 finite bounded 기본값으로 중앙 정규화
- 잘못된 설정값이 `NaN`이 되어 제한이 풀리거나 즉시 timeout되던 경계 조건 수정
- oversized `Content-Length` 응답은 body를 best-effort cancel한 뒤 거부하도록 transport 해제 보강
- 순환 참조 JSON schema를 통제된 검증 오류로 변환
- 전사 segment의 명시적 `start: 0`을 offset으로 덮어쓰던 timestamp 정규화 버그 수정
- 신규 `local_ai_provider_resilience_smoke.js` 등록, 전체 QA 311/311 통과
- 5회 실미디어 heap, 4회 Chromium process-memory, 실제 30분 1080p Smart Reframe, 4-viewport·GPU/media 감사 갱신
- 서비스워커 135개 자산 v1.6.35 무결성 갱신 및 최종 전달 3단 구성·두 ZIP 규칙 유지

## v1.6.34

- abort를 무시하는 로컬 AI executor도 coordinator에서 취소·timeout 종료 보장
- 강제 종료 후 active job 해제와 후속 serial queue 진행 보장
- 작업 history를 detached public record로 변경해 executor·controller·Promise callback 보존 제거
- invalid queue/history/timeout config를 finite bounded 기본값으로 복구
- 중복 subject set 수동 페이지에 exact-order 우선·set fallback duration identity 추가
- 수동 duration 입력 0은 1초 clamp, invalid 값은 전역 page duration fallback으로 통일
- duration alignment UI의 범위 밖 `engine` 참조를 명시적 엔진 조회로 수정해 화자 레이아웃 런타임 예외 제거
- 신규 page identity 회귀와 강화된 local AI coordinator 회귀 등록
- 전체 QA 310/310, 화자 Chromium 감사 runtime error 0건, 5회 heap/process-memory 및 30분 Smart Reframe 감사 통과
- 서비스워커 135개 자산 v1.6.34 무결성 갱신
- 최종 전달 3단 구성과 통파일/패치 ZIP 동시 제공 규칙 유지

## v1.6.33

- invalid·empty·non-finite 수동 페이지 시간을 전역 `gridPageSeconds`로 복구
- transition window를 현재 페이지 시간의 절반 이하로 제한해 짧은 페이지에서도 완료 보장
- energy diagnostics row signature와 `DocumentFragment`로 프레임별 전체 DOM 재생성 제거
- 수동 페이지 subject identity 기반 duration 정렬로 raw reorder 소유권 보존
- 입력·버튼·라벨에서 page drag 시작 방지와 재정렬 ARIA 이름 추가
- duration·transition 경계 및 energy UI·drag safety 회귀 2건 추가
- 현재 speaker page timing/live preview/paging, 30분 smart reframe, heap/process-memory 증빙 갱신
- 전체 QA 309/309, 서비스워커 135개 자산과 v1.6.33 build key 무결성 갱신
- 최종 전달 3단 구성과 통파일/패치 ZIP 동시 제공 규칙을 영구 계약으로 명시

## v1.6.32

- 수동 화자 페이지별 표시 시간 1~10초 설정과 cumulative cycle 계산 추가
- 페이지 재정렬 시 페이지별 표시 시간이 같은 페이지와 함께 이동하도록 동기화
- 수동 페이지 내부 화자 drag-and-drop 및 좌·우 이동 버튼 추가
- 현재 활성 화자 에너지 막대, grid 선택 상태, threshold와 hold 남은 시간 시각화 추가
- `gridManualPageSeconds` 프로젝트 allowlist·track identity·undo/redo 깊은 복사 경로 확장
- 수동 페이지 시간·내부 화자 순서·에너지 상태 Chromium 감사와 신규 회귀 4건 추가
- 기존 speaker paging 감사가 페이지 카드 내부 버튼을 잘못 해석하던 위치 기반 가정을 명시적 selector 계약으로 수정
- 정적 `data-build` 마커와 v1.6.32 build key·서비스워커 앱 셸 무결성 manifest 갱신

## v1.6.31

- energy paging 임계값 0~1 설정 추가
- 기존 화자 유지 hysteresis 0~0.3 설정 추가
- 신규 고에너지 화자 최소 유지시간 0~5초 설정 추가
- hidden mutable state 없는 결정적 과거 cue snapshot 안정화 로직 추가
- 기존 `gridPageTrigger: energy` 호환 계약 유지
- 수동 페이지 drag-and-drop 재정렬과 위·아래 버튼 추가
- transition easing `linear`, `ease-in`, `ease-out`, `ease-in-out` 추가
- slide 방향 `auto`, `left`, `right`, `up`, `down` 추가
- 프로젝트 allowlist·track cache identity·preview overlay·final renderer 동기화
- energy stability·transition direction·manual reorder 회귀와 v1.6.31 Chromium 감사 추가
- v1.6.31 build key와 서비스워커 앱 셸 무결성 manifest 갱신

## v1.6.30

- 오디오 `rmsNorm` 기반 발화 에너지 paging 즉시 전환 추가
- 주 화자를 고정하고 에너지 상위 보조 화자를 상위 grid에 배치
- subject ID 기반 최대 12개 수동 페이지 구성 추가
- 페이지 전환 `none`, `fade`, `slide` 및 120~1200ms 설정 추가
- preview와 최종 canvas renderer에 동일한 이전/현재 페이지 진행률 적용
- 선택 화자 cue의 grid crop X/Y/확대 일괄 편집·미리보기 추가
- cue energy·manual pages·transition 프로젝트 저장 allowlist 확장
- energy/manual/transition/bulk crop 단위 회귀와 Chromium paging 감사 추가
- v1.6.30 build key와 서비스워커 앱 셸 무결성 manifest 갱신

## v1.6.29

- 화자 cue별 grid cell crop X/Y/확대 조절 추가
- 3인 grid 주 화자 크기 45~65%와 상·하·좌·우 위치 설정 추가
- 5명 이상 동시 화자에서 주 화자 고정·보조 화자 페이지 교대 추가
- `rotate`와 상위 4인 고정 `priority` paging 정책 추가
- 페이지 간격 1~10초 설정과 preview page 상태 표시 추가
- 프로젝트 저장 allowlist와 renderer를 신규 grid 필드에 맞게 확장
- 6인 paging·3인 layout·cell crop Chromium 감사 및 신규 회귀 3건 추가
- divider Chromium 감사가 viewport 밖에서 입력을 놓치지 않도록 scroll 경계 보강
- v1.6.29 build key와 서비스워커 무결성 manifest 갱신

## v1.6.28

- 실제 9:16 preview 위 화자 divider와 실시간 pane/crop 가이드 추가
- preview controller 렌더 완료 callback으로 overlay 프레임 동기화
- 3명 동시 발화 주 화자 중심 grid 추가
- 4명 동시 발화 2×2 grid와 최대 4인 bounded 렌더 추가
- 2인 dual과 3~4인 grid 자동 전환 및 기존 상위 2인 호환 데이터 유지
- 실제 Chromium grid→dual 전환, live divider pointer/keyboard 접근성 감사 추가
- v1.6.28 build key와 서비스워커 앱 셸 무결성 manifest 갱신

## v1.6.27

- 화자 dual pane 미리보기에서 divider 직접 포인터·터치 드래그 추가
- divider `role="separator"`, ARIA 값, 방향키·Shift 가속·Home/End 접근성 추가
- cue checkbox 드래그를 pointer capture와 좌표 hit-test 방식으로 보강
- 모바일 터치 범위 선택 중 DOM 갱신으로 제스처가 끊기지 않도록 선택 상태만 부분 동기화
- 일괄 편집 patch를 단일 함수로 통합하고 적용 전 변경 요약 미리보기 추가
- 실제 20초 Chromium 시나리오에 divider drag/keyboard와 bulk preview 검증 추가
- 서비스워커 build key 및 135개 앱 셸 무결성 manifest 갱신
