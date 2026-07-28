# CHANGELOG

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
