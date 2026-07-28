# HANDOFF v1.6.32

## 인수인계 요약

v1.6.31의 energy 안정화와 수동 페이지 순서 편집 위에 다음 기능을 추가했습니다.

1. 수동 페이지별 독립 표시 시간
2. 페이지 내부 화자 drag-and-drop·좌우 이동
3. 실시간 화자 에너지 막대
4. 현재 grid 선택 화자 표시
5. 신규 화자 hold 남은 시간 표시

## 시스템·기술 구조

- 페이지 시간·누적 cycle·focus 상태: `src/vision/smart-reframe-engine.js`
- 페이지/화자 편집·에너지 상태 UI: `src/app.js`, `index.html`
- 프로젝트 allowlist·bounded 복구: `src/project/project-service.js`
- speaker layout 기본값: `src/state/app-state.js`
- UI ownership: `assets/css/smart-reframe.css`
- 현재 Chromium 감사: `qa/run_speaker_page_timing_audit.py`
- 최종 QA 집계: `qa/qa-run-final-summary.json`

## 주요 계약

- `gridManualPageSeconds`: 수동 페이지와 index 정렬된 1~10초 배열
- 페이지 재정렬 시 `gridManualPages`와 `gridManualPageSeconds`를 함께 이동
- 페이지 내부 subject ID는 최대 4개이며 중복·빈 값은 제거
- 수동 페이지 cycle은 페이지별 시간의 누적 합으로 결정
- focus에 현재 페이지 `gridPageDuration`과 `gridPageElapsed`를 제공
- 에너지 상태 UI는 preview 렌더 완료 경로에서 갱신하며 신규 timer를 만들지 않음
- 기존 `gridPageTrigger: energy`, threshold·hysteresis·hold 계약 유지
- 직접 crop keyframe과 전역 피사체 고정은 화자 grid보다 우선

## 검수 순서

1. `node qa/speaker_manual_page_duration_smoke.js`
2. `node qa/speaker_manual_page_editor_smoke.js`
3. `python3 qa/run_speaker_page_timing_audit.py`
4. `node qa/speaker_page_timing_browser_smoke.js`
5. `node qa/speaker_face_project_smoke.js`
6. `python3 qa/run_smart_reframe_browser_audit.py`
7. `python3 qa/run_heap_stability.py --cycles 5`
8. `node qa/run_all_checks.js --report qa/latest-qa-run.json`
9. `node qa/service_worker_content_integrity_smoke.js`

## 알려진 제한

- 에너지는 로컬 오디오 RMS의 상대값이며 의미·감정·대화 중요도를 판단하지 않습니다.
- native HTML drag-and-drop의 모바일 Safari·Samsung Internet 실기기 동작은 아직 검증하지 않았습니다. 좌·우 버튼이 대체 경로입니다.
- 페이지별 시간은 1초 미만의 빠른 교대를 허용하지 않습니다.
- 한 프레임 최대 화자 수는 4명입니다.
- 20회 힙 감사는 10회까지 정상 진행된 뒤 실행 제한으로 종료되어 배포 판정에서 제외했습니다. 완주한 5회 감사만 사용합니다.
- 15→30→15분 전체 decode·Render Queue·Object URL 소유권은 변경되지 않아 v1.6.31 완주 증빙을 승계했습니다. 변경된 페이지 시간·화자 순서·에너지 상태는 현재 Chromium과 실제 30분 1080p 집중 감사로 검증했습니다.

## Update Sentinel

Update Sentinel은 새 서비스워커 발견, 이전 앱 셸 캐시 정리, 업데이트 진단 복사를 담당합니다. 모델 팩 캐시와 앱 셸 캐시는 분리되며 복구 실패 시 이전 known-good 앱 셸을 보존합니다.
