# NEXT UPDATE

현재 기준: `0.10.8 · CI Test Contract Stability Hotfix`

## 목표 버전

`0.10.9 · Visual Regression & Safe Batch Voice Editing`

## 최우선 구현

- 실제 Chromium 환경의 1024·1280·1440px Compact Dock·3분할 screenshot 기준선과 시각 회귀
- 다중 선택 클립의 일괄 재생성·voice 변경·실행 전 영향 preview
- 실제 OS 절전·Wi-Fi 전환 실기기 증거를 Recovery Path Injection 결과와 분리해서 함께 표시
- runtime soak 비교 결과의 파일명·SHA-256·비교 시각 내보내기
- 브라우저 음성 inventory 변경 뒤 프리셋별 이전/현재 배정 diff 표시
- 누적 HANDOVER 과거 기록을 `docs/archive`로 분리하되 현재 필수 결정은 원본에 유지

## 0.10.8에서 넘기는 결정

- Web CI 안정화가 완료되기 전에는 새 기능을 섞지 않고, Vitest 구조·편집 UI 테스트 계약을 먼저 고정합니다.
- 카드별 textarea는 다시 도입하지 않으며 단일 선택 빠른 편집기 + 타임라인 카드 텍스트 구조를 유지합니다.

- 운영자 기준선 복원은 append-only history를 유지하며 과거 이벤트를 삭제하거나 rewrite하지 않습니다.
- 과거 기준선 복원은 현재 기준선과 target 기준선을 preview한 뒤에만 실행합니다.
- 타임라인은 1개 선택일 때 빠른 편집기를 유지하고 2개 이상일 때만 일괄 작업 패널을 사용합니다.
- 재생 중 자동 선택은 다중 선택을 임의로 해제하지 않습니다.
- Dock의 핵심 순서는 `재생/일시정지 → 진행바 → 시간/제목 → 보조 제어`를 유지합니다.
- 0.10.4의 `SOA-4022`, auto Browser Speech 폴백, System TTS의 eSpeak 보조 경로와 반대 성별 강제 대체 금지는 그대로 유지합니다.
