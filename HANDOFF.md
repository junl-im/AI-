# HANDOFF v1.6.30

## 인수인계 요약

v1.6.29의 cue별 crop·3인 layout·5명 이상 paging 위에 다음 기능을 추가했습니다.

1. 오디오 RMS 기반 화자 paging 즉시 전환
2. 주 화자 고정과 에너지 순 보조 화자 선별
3. subject ID 기반 수동 페이지 구성
4. fade·slide·없음 페이지 전환
5. 120~1200ms 전환 시간 설정
6. 선택 cue의 grid crop 일괄 적용과 변경 미리보기

## 시스템·기술 구조

- cue 에너지·page 선택·transition 상태: `src/vision/smart-reframe-engine.js`
- 전사 segment 에너지 정규화: `src/vision/speaker-face-linker.js`
- fade·slide 캔버스 합성: `src/render/vertical-renderer.js`
- 편집 UI·preview 상태·bulk patch: `src/app.js`, `index.html`
- 프로젝트 allowlist: `src/project/project-service.js`
- 상태 기본값: `src/state/app-state.js`
- 스타일: `assets/css/smart-reframe.css`
- Update Sentinel·앱 셸 복구: `src/boot/update-sentinel.js`, `sw.js`

## 주요 계약

- `speakerCue.energy`: 0~1
- `speakerLayout.gridPaging`: `rotate|priority|energy|manual`
- `speakerLayout.gridTransition`: `none|fade|slide`
- `speakerLayout.gridTransitionMs`: 120~1200ms
- `speakerLayout.gridManualPages`: 최대 12개 페이지, 페이지당 최대 4개 안전한 subject ID
- `focus.gridPreviousSubjects`, `gridTransitionProgress`, `gridPageTrigger`로 renderer와 preview에 전환 상태 전달
- 에너지 정책은 명시적인 주 화자를 고정하고 보조 화자를 에너지 순으로 즉시 선택
- 수동 페이지가 현재 활성 subject와 맞지 않으면 안전하게 rotate 정책으로 fallback
- 일괄 grid crop은 기존 bounded X/Y/zoom 정규화를 재사용
- 직접 crop keyframe과 전역 피사체 고정은 화자 grid보다 우선

## 검수 순서

1. `node qa/speaker_energy_paging_smoke.js`
2. `node qa/speaker_grid_manual_pages_smoke.js`
3. `node qa/speaker_grid_transition_render_smoke.js`
4. `node qa/speaker_grid_bulk_crop_smoke.js`
5. `python3 qa/run_speaker_paging_v1630_audit.py`
6. `python3 qa/run_smart_reframe_browser_audit.py`
7. `python3 qa/run_heap_stability.py --cycles 5`
8. `node qa/run_all_checks.js --shard 1/6`부터 `6/6`까지
9. `node qa/service_worker_content_integrity_smoke.js`

## 알려진 제한

- 한 프레임에 렌더하는 화자는 최대 4명입니다.
- 에너지 값은 로컬 오디오 분석의 RMS 평균이며 화자 의미·감정·대화 우선순위를 판단하지 않습니다.
- 수동 페이지는 subject ID 기반이므로 얼굴 추적 ID가 새 분석에서 달라지면 다시 구성해야 할 수 있습니다.
- 에너지·priority 정책은 즉시 전환을 우선해 fade·slide 대기 전환을 적용하지 않습니다.
- 15→30→15분 전체 감사 harness는 현재 환경에서 첫 회차 완료 후 두 번째 교체 정리 경계가 멈춰, 변경되지 않은 미디어 교체·렌더 큐·Object URL 완주 증빙을 승계했습니다. 변경된 smart-reframe 렌더 경로는 현재 버전의 실제 30분 1080p 집중 감사와 renderer·Chromium paging 감사로 새로 검증했습니다.
- 모바일 Safari·Samsung Internet 실기기 검증은 남아 있습니다.

## Update Sentinel

Update Sentinel은 새 서비스워커 발견, 이전 앱 셸 캐시 정리, 업데이트 진단 복사를 담당합니다. 모델 팩 캐시와 앱 셸 캐시는 분리되어 있으며 복구 실패 시 이전 known-good 앱 셸을 보존합니다.
