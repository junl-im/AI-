# QA REPORT v1.6.39

## 최종 결과

- 전체 등록 검사: **317개**
- 통과: **317/317**
- 실패: **0개**
- 합산 실행 시간: **88.495초**
- 원본: `qa/qa-run-v1.6.39-final.json`
- 요약: `qa/qa-run-final-summary.json`

단일 장시간 프로세스 대신 등록 순서 분할 실행과 현재 버전 감사 산출물 생성 후 순서 의존 검사를 독립 재실행했습니다. 모든 package.json 등록 명령에 하나 이상의 성공 기록이 존재하며 최종 원본에 317개를 통합했습니다.

## 신규·강화 회귀

- 신규 `qa/local_ai_endpoint_pin_history_smoke.js`
- 갱신 `qa/local_ai_endpoint_integrity_smoke.js`
- 강화 `qa/local_ai_studio_smoke.js`
- endpoint별 독립 pin·legacy migration·stale pre-probe 차단
- generation HTTP 503·transcription HTTP 500 실패 이력
- prompt·schema·endpoint·파일 내용 비보존
- 비정상 transcription file size 차단

## 현재 버전 감사

- 4개 viewport 브라우저 감사: 런타임·console·page·unhandled 오류와 수평 overflow 0건
- 실미디어 heap 5회: URL 10/10 해제, dispose 후 active 0, operation/queue 잔류 0
- process-memory 8회: runtime error 0, JS heap slope 0.009 MiB/cycle
- 실제 30분 1080p Smart Reframe: 24 sample, 2.977초, caption-safe 9:16 crop 통과
- speaker page timing·live preview·paging Chromium 감사 통과
- 서비스워커 135개 앱 셸 SHA-256 무결성 통과
- CSS conflict·duplicate·shadow 0건, `!important` 593개

## 제한

- 실제 Ollama·llama.cpp·whisper.cpp 바이너리 추론, 물리 GPU, 모바일 실기기 검증은 별도입니다.
- RSS 증가는 Chromium native cache·GPU·utility 프로세스 장기 추적 대상으로 유지합니다.
