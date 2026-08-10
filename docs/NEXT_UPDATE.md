# NEXT UPDATE

현재 기준: `0.11.7 · One-Flow Dubbing UX`

## 목표 버전

`0.11.8 · Approved Visual Baseline & Engine Soak Provenance`

## 최우선 구현

- 사람이 승인한 Chromium 1024·1280·1440 baseline PNG와 SHA manifest가 저장소에 들어온 경우에만 `SORION_VISUAL_BASELINE_REQUIRED=1`을 CI 필수 gate로 전환
- baseline 승인·교체 절차와 pixel diff 허용 오차를 provenance로 기록해 임의 snapshot 갱신이 회귀를 숨기지 못하게 함
- `active_request_count` 기반 병렬 엔진 분산과 performance observation을 장시간 soak에서 측정해 엔진 전환 횟수·성공률·지연 회귀를 함께 기록
- recovery evidence intake/summary에서 observed와 synthetic 건수를 빠르게 구분할 수 있는 운영자 필터·요약 검토
- one-flow 사용성에서 실제 첫 작업 클릭 수·키보드 경로를 regression fixture로 고정하고, 고급 패널을 펼친 상태에서도 1024px overflow가 없는지 계속 검증
- keyboard command 이동 Undo를 구조 변경에도 안전한 snapshot/history 방식으로 확장할지 메모리·세션 크기·충돌 규칙을 검증

## 0.11.7에서 고정한 결정

- 패치 전달은 직전 버전 전제만 문서화하는 것으로 끝내지 않고, 실제 GitHub 기준선과 누적 파일 일치 여부를 검증한다. 기준선이 건너뛰어진 경우 hotfix는 필요한 누적 파일을 self-contained 형태로 포함한다.
- 새 프로젝트는 중앙 원플로우에 집중하고 좌우 프로 패널은 기본 접힘으로 시작한다. 고급 기능은 제거하지 않고 한 번에 다시 펼칠 수 있다.
- 기본 제작 경로는 `목소리 → 대본 → 바로 더빙 → 첫 결과 듣기`이며 첫 결과 자동 재생은 사용자가 현재 세션에서 생성 버튼을 직접 실행한 경우에만 적용한다.
- TXT·MD·SRT·VTT는 서버 업로드 없이 브라우저에서 텍스트로 읽고 SRT/VTT 타임코드를 정리한 뒤 기존 장문 분할 계약으로 보낸다.
- 기본 5개 프리셋은 중앙에서 즉시 선택하고 전체 목록·속도·높낮이·말투는 필요할 때만 펼친다.
- 빈 프로젝트에서는 타임라인을 숨기지만 직접 편집 버튼으로 기존 block/timeline 편집에 즉시 진입할 수 있다.
- 0.11.6의 recovery evidence provenance와 session privacy 경계는 변경하지 않는다.
