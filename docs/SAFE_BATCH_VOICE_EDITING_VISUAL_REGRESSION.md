# Safe Batch Voice Editing & Chromium Layout Regression

SoriON AI 0.11.1은 다중 선택을 단순 이동·삭제에서 실제 음성 편집 흐름으로 확장한다.

## 다중 음성 편집

- Ctrl/Cmd 또는 Shift로 여러 클립을 선택한다.
- 선택 대사에 적용할 프리셋을 고른 뒤 `변경 미리보기`에서 영향 범위를 먼저 확인한다.
- 쉼 블록은 음성 변경 대상에서 제외된다.
- 기존 완성 음원이 있는 클립은 프리셋 변경 시 audio, track, job 연결을 폐기하고 revision을 증가시킨다.
- `목소리만 적용`은 queued 상태까지만 만들며, `적용 후 재생성`은 선택 대사를 순서대로 다시 생성한다.
- 실패 항목이 있으면 `실패만 재시도`로 실패한 선택 대사만 재생성한다.
- 일괄 실행은 requested/succeeded/failed/skipped ID를 결과로 남기고 `성공 · 실패 · 건너뜀` 요약을 표시한다.
- 실패가 남으면 실패한 클립만 자동 선택한다. 선택이 1개로 줄어 빠른 편집기로 전환돼도 최근 batch 결과는 유지한다.
- `대사 전체`, `실패만` 빠른 선택으로 긴 대본에서 재선택 클릭을 줄인다.
- 생성 중인 선택 항목이 있으면 일괄 변경 UI를 잠가 합성 중 revision 교체와 충돌하지 않게 한다.

## 브라우저 음성 inventory diff

inventory snapshot v2는 전체 fingerprint뿐 아니라 5개 프리셋의 실제 배정을 함께 저장한다. 목록이 바뀌면
Engine Doctor가 `이전 음성 -> 현재 음성` diff를 표시한다. v1 저장 키는 migration 읽기용으로 유지한다.

## Chromium 레이아웃 회귀

Web quality build가 성공하면 GitHub Actions가 별도 Chromium 단계에서 1024, 1280, 1440px 작업공간을 연다.
검사기는 실제 장문 입력과 다중 선택을 구성한 뒤 다음을 검사한다.

- 페이지 가로 overflow 없음
- Compact Dock 높이 상한
- 재생 버튼이 진행바보다 앞에 배치
- PC 프로젝트 rail / 중앙 workspace / Voice Drawer가 모두 표시
- 다중 선택 편집 패널과 controls가 컨테이너 밖으로 넘치지 않음

각 viewport PNG와 SHA-256, DOM 실측값은 `.sorion/web-quality/visual-layout/manifest.json`에 기록한다.
픽셀 baseline 승인 체계는 아직 강제하지 않는다. 브라우저/폰트 렌더러 차이를 해시 동일성으로 오판하지 않기 위해서다.
