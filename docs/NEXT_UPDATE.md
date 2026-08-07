# NEXT UPDATE

현재 기준: `0.10.6 · Baseline Recovery & Multi-Clip Editing`

## 목표 버전

`0.10.7 · Recovery Evidence & Voice Inventory Diagnostics`

## 최우선 구현

- 이전 runtime soak 결과를 Quality Lab에서 직접 비교하는 운영 화면
- 브라우저 절전·온라인 복귀·네트워크 종류 변경 E2E 장애 주입
- 실제 1024·1280·1440px 화면 이미지 비교와 Compact Dock 시각 회귀
- 프리셋별 실제 기기 음성 inventory 변화 감지와 진단 캐시 무효화
- 다중 선택 상태에서 일괄 재생성·voice 변경 등 안전한 batch 작업 검토
- 누적 HANDOVER 과거 기록을 `docs/archive`로 분리하는 방안 검토

## 0.10.6에서 넘기는 결정

- 운영자 기준선 복원은 append-only history를 유지하며 과거 이벤트를 삭제하거나 rewrite하지 않습니다.
- 과거 기준선 복원은 현재 기준선과 target 기준선을 preview한 뒤에만 실행합니다.
- 타임라인은 1개 선택일 때 빠른 편집기를 유지하고 2개 이상일 때만 일괄 작업 패널을 사용합니다.
- 재생 중 자동 선택은 다중 선택을 임의로 해제하지 않습니다.
- Dock의 핵심 순서는 `재생/일시정지 → 진행바 → 시간/제목 → 보조 제어`를 유지합니다.
- 0.10.4의 `SOA-4022`, auto Browser Speech 폴백, System TTS의 eSpeak 보조 경로와 반대 성별 강제 대체 금지는 그대로 유지합니다.
