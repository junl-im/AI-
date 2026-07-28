# HANDOFF v1.6.24

## 완료
- 서로 다른 얼굴에 연결된 겹침 발화 cue를 상·하 2분할 화면으로 동시에 유지
- cue별 `primary`·`secondary`·`auto` 화자 역할과 화면 순서 정책 추가
- 현재 cue와 같은 화자 라벨의 모든 구간에 얼굴·고정·역할을 일괄 적용
- cue별 연결 신뢰도 이력을 최대 12건까지 보존하고 편집 UI에 최근 6건 표시
- 같은 시간 범위에 보조 화자를 추가하는 직접 편집 기능 추가
- 프로젝트 저장·복원에서 역할과 신뢰도 이력 allowlist 보존
- v1.6.24 build/cache/integrity 동기화

## 핵심 소유권
- 화자·얼굴 자동 연결: `src/vision/speaker-face-linker.js`
- 겹침 cue 선택·역할·이력·dual focus: `src/vision/smart-reframe-engine.js`
- 상·하 2분할 렌더: `src/render/vertical-renderer.js`
- 편집 UI·일괄 교정: `src/app.js`, `index.html`, `assets/css/smart-reframe.css`
- 프로젝트 보존: `src/project/project-service.js`

## 필수 전달 형식
1. 작업한 내역
2. 다운로드 가능한 통파일 ZIP, 붙여넣기 패치 ZIP
3. 다음 예정 내역

## 다음 우선순위
- 3명 이상 동시 발화의 레이아웃 선택 정책
- dual 화면의 좌우·상하 사용자 선택과 pane 비율 조절
- 화자 timeline 다중 선택·시간 이동·undo/redo
- 추천·편집 UI Controller 분리
- 모바일 Safari·Samsung Internet 실기기 회귀

## Update Sentinel
앱 셸 업데이트는 `src/boot/update-sentinel.js`가 감시합니다. 이전 shell cache 정리, 서비스워커 업데이트 상태 표시, 업데이트 진단 복사를 유지합니다.

## 검수 순서
1. `node qa/speaker_overlap_composition_smoke.js`
2. `node qa/speaker_dual_render_smoke.js`
3. `node qa/speaker_face_bulk_history_smoke.js`
4. `python3 qa/run_smart_reframe_browser_audit.py`
5. `python3 qa/run_heap_stability.py --cycles 5`
6. 서비스워커 무결성과 전체 QA 실행

## 알려진 제한
- 동시에 연결된 얼굴이 3명 이상이면 역할·신뢰도 순으로 상위 두 얼굴만 dual 화면에 사용합니다.
- dual 화면은 현재 상·하 50:50 고정이며 좌우 배치와 pane 비율 편집은 지원하지 않습니다.
- 모바일 Safari와 Samsung Internet 실기기 회귀가 남아 있습니다.
