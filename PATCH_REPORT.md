# PATCH REPORT v1.6.2

## 목표

정상 상태의 저장소 정보가 핵심 제작 흐름 위에 노출되지 않도록 페이지 최하단으로 이동하고, 실제 정리·복구가 필요할 때만 자동 안내합니다. 독립적으로 떠 있던 Local AI 영역은 프로젝트·카피·자막 흐름에 맞는 접이식 작업대로 재배치합니다.

## 사전 진단

- 저장소 상태 요약이 상단 제작 흐름에 남아 정상 상태에서도 시선을 차지했습니다.
- 상태가 문제가 될 때 사용자가 하단 영역을 직접 찾아야 했습니다.
- Local AI section은 명시적 grid area가 없어 데스크톱에서 다른 작업 카드와 분리돼 보였습니다.
- Local AI 전체 UI가 항상 큰 공간을 차지해 사용하지 않는 사용자에게도 작업실 밀도를 낮췄습니다.

## 구현

### 저장소 하단 지원 영역

- `.app-shell`의 마지막 자식으로 상태 패널을 배치합니다.
- 정상 상태는 낮은 대비와 작은 높이로 표시합니다.
- cleanup 또는 repair action이 새로 생길 때 한 번만 `scrollIntoView`, 포커스, attention 상태를 적용합니다.
- 동일 문제 반복 렌더, 고급 진단·확인 modal 활성 상태에서는 자동 이동을 억제합니다.

### Local AI 배치 통합

- `#localAIStudio`를 기본 닫힘 `<details>`로 전환했습니다.
- 데스크톱 workspace grid에 `ai` 전체 폭 행을 추가했습니다.
- 프로젝트·카피 유틸리티 다음, 핵심 제작 단계 앞에 배치했습니다.
- 미리보기·파형 집중 모드에서는 optional AI 영역을 숨깁니다.
- 모바일에서는 summary를 compact하게 하고 펼친 workbench를 단일 열로 정리했습니다.

### 성능·호환성

- 기존 ID와 이벤트 계약을 유지했습니다.
- Local AI staged loading과 초기 직접 실행 스크립트 예산을 유지했습니다.
- 저장소 상세 조회는 고급 진단 진입 전까지 실행하지 않습니다.
- 새 네트워크 요청과 데이터 마이그레이션은 없습니다.

## 검증

- 정적 smoke로 footer mount, actionable 1회 auto-navigation, Local AI `<details>`·grid area 계약 확인
- 전용 Chromium 감사로 데스크톱·모바일 접힘·펼침·배치·focus mode·overflow 검증
- 일반 4개 viewport 감사에서 런타임 오류·console error·가로 overflow 0
- CSS ownership, 서비스워커, GPU/media, 메모리, 구조 우선순위 검사
- 등록 자동 검사 **221개**

## 개인정보와 데이터 영향

- 저장소 상태는 기존 비식별 요약만 사용합니다.
- Local AI endpoint·모델·프롬프트 보안 계약은 변경하지 않습니다.
- 프로젝트 원본·편집 상태·캐시 스키마에 데이터 변경이 없습니다.

## 남은 제한

- 실제 모바일 Safari·Samsung Internet의 스크롤·포커스 조합은 실기기 확인이 필요합니다.
- Local AI workbench를 펼친 높이는 설치 모델 목록과 응답 내용에 따라 달라질 수 있습니다.
- headless Chromium의 메모리·GPU 수치는 물리 장치 성능을 보장하지 않습니다.
