# NEXT UPDATE

현재 기준: `0.10.5 · Compact Dock & Practical Clip Editor`

## 목표 버전

`0.10.6 · Baseline History & Recovery Dashboard`

## 최우선 구현

- 운영자 기준선 전체 history 조회와 복원 preview
- 이전 soak 결과를 Quality Lab에서 비교하는 운영 화면
- 브라우저 절전·온라인 복귀·네트워크 종류 변경 E2E 장애 주입
- 실제 1024·1280·1440px 화면 이미지 비교
- 0.10.5 빠른 편집 흐름을 바탕으로 타임라인 다중 선택과 일괄 이동·삭제 검토
- 프리셋별 실제 기기 음성 inventory 변화 감지와 진단 캐시 무효화 검토
- 누적 HANDOVER 과거 기록을 `docs/archive`로 분리하는 방안 검토

## 0.10.5에서 넘기는 결정

- Dock의 핵심 순서는 `재생/일시정지 → 진행바 → 시간/제목 → 보조 제어`이며, PC에서 보조 기능 때문에 진행바가 별도 줄로 밀리지 않게 유지합니다.
- 타임라인 카드는 선택·상태·대사 미리보기 역할에 집중하고, 텍스트 변경은 선택 클립 빠른 편집기를 기본 편집 표면으로 유지합니다.
- Enter는 선택 클립 편집기로 이동하고 `Ctrl/Cmd+Enter`는 저장 후 재생성을 수행합니다.
- 0.10.4의 `SOA-4022`, auto Browser Speech 폴백, System TTS의 eSpeak 보조 경로와 반대 성별 강제 대체 금지는 그대로 유지합니다.
- 원래 0.10.5로 예정됐던 Baseline History & Recovery Dashboard는 사용자 편집 UX 우선순위에 따라 0.10.6으로 이동합니다.
