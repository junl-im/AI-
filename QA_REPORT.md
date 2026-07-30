# QA REPORT v1.6.40

## 최종 결과

- 전체 등록 검사: **318개**
- 통과: **318/318**
- 실패: **0개**
- 합산 실행 시간: **80.814초**
- 원본: `qa/qa-run-v1.6.40-final.json`
- 요약: `qa/qa-run-final-summary.json`

등록 순서 분할 실행과 현재 버전 감사 산출물 생성 후 순서 의존 검사를 재실행했습니다. 모든 `package.json` 등록 명령에 최종 파일 상태 기준 성공 기록이 있으며 최종 원본에 318개를 통합했습니다.

## 신규·강화 회귀

- 신규 `qa/local_ai_endpoint_profiles_smoke.js`
- 강화 `qa/local_ai_studio_smoke.js`
- legacy endpoint 설정의 default profile migration
- endpoint·선호 모델·최근 probe·model cache 격리
- profile activation 후 reconnect-before-generation gate
- duplicate/final-profile deletion 방어와 endpoint pin cleanup
- diagnostics snapshot의 endpoint/profile 원문 비노출

## 현재 버전 감사

- 4개 viewport 브라우저 감사: 런타임·console·page·unhandled 오류와 수평 overflow 0건
- 실미디어 heap 5회: dispose 후 active URL 0, operation/queue 잔류 0
- process-memory 8회: runtime error 0, JS heap slope 0.0089 MiB/cycle
- 실제 30분 1080p Smart Reframe: 24 sample, 5.234초, caption-safe 9:16 crop 통과
- speaker page timing·live preview·paging Chromium 감사 통과
- 서비스워커 135개 앱 셸 SHA-256 무결성 통과
- CSS conflict·duplicate·shadow 0건, `!important` 593개

## 제한

- 실제 Ollama·llama.cpp·whisper.cpp 바이너리 추론, 물리 GPU, 모바일 실기기 검증은 별도입니다.
- RSS 증가는 Chromium native cache·GPU·utility 프로세스 장기 추적 대상으로 유지합니다.
