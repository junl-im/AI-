# PATCH REPORT v1.6.39

## 기준과 적용 방식

- 기준 릴리스: v1.6.38
- 패치 ZIP은 기존 v1.6.38 폴더 위에 그대로 덮어씁니다.
- 삭제 파일: **0개**
- clean install은 통파일 ZIP을 사용합니다.

## 핵심 수정 파일

- `src/ai/local-ai-provider-registry.js`: endpoint-scoped pin, legacy migration, stale guard, generation/transcription failure history, finite file-size guard
- `src/ui/local-ai-studio.js`: pin·unpin에 현재 endpoint 명시
- `qa/local_ai_endpoint_pin_history_smoke.js`: endpoint별 pin과 privacy-safe failure history 신규 회귀
- `qa/local_ai_endpoint_integrity_smoke.js`: 독립 endpoint trust 상태 계약 갱신
- `qa/local_ai_studio_smoke.js`: UI endpoint-aware pin 호출 정적 검증
- `package.json`, `index.html`, runtime config, staged loader, `sw.js`, `asset-integrity.json`: v1.6.39 버전·build key·앱 셸 무결성 동기화

## 변경 범위

- 신규 파일: **24개**
- 수정 파일: **20개**
- 삭제 파일: **0개**
- 변경·추가 합계: **44개**
- 전체 프로젝트 파일: **1,400개**

## 최종 검증

- 등록 QA: **317/317 통과**, 실패 0개
- 서비스워커 무결성: 135개 자산 통과
- asset manifest SHA-256: `9bbb075f71d8ab75bd67fdcc161e34320d510ebc53ee7f1361725c42e7232d44`
- clean v1.6.38에 패치를 실제 덮어쓴 뒤 full release와 비교했습니다.
  - 적용본 1,400개
  - 통파일 1,400개
  - 누락 0개
  - 추가 불일치 0개
  - SHA-256 불일치 0개
