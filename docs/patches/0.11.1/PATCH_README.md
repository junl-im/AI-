# SoriON AI 0.11.1 Visual Regression & Safe Batch Voice Editing

기준 버전은 **0.11.0 Adaptive Engine Resilience & Recovery**입니다.

## 적용 내용

- 다중 선택 voice 변경 전 영향 미리보기
- 목소리만 적용 / 적용 후 순차 재생성 / 실패만 재시도
- voice 변경 시 기존 audio·track·job 폐기와 revision 증가
- Browser voice inventory v2의 프리셋별 이전→현재 배정 diff
- Web production build 뒤 Chromium 1024·1280·1440px layout 검사
- viewport별 PNG·SHA-256·DOM 실측 manifest를 Web quality artifact로 보존

## 적용

기존 0.11.0 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

현재 전달 환경의 관리형 Chromium은 loopback URL을 정책 차단하므로 실제 production screenshot 최종 판정은 GitHub Actions에서 수행합니다.
