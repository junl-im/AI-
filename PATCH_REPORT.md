# PATCH REPORT v1.6.40

## 기준과 적용 방식

- 기준 릴리스: v1.6.39
- 패치 ZIP은 기존 v1.6.39 폴더 위에 그대로 덮어씁니다.
- 삭제 파일: **0개**
- clean install은 통파일 ZIP을 사용합니다.

## 핵심 수정 파일

- `src/ai/local-ai-provider-registry.js`: profile schema/migration, CRUD, active profile, probe/model cache, pin cleanup, privacy-safe snapshot
- `src/ui/local-ai-studio.js`: profile 선택·저장·삭제·전환, 상태 요약, 재연결 안내
- `assets/css/local-ai-studio.css`, `index.html`: responsive profile manager UI와 v1.6.40 build marker
- `qa/local_ai_endpoint_profiles_smoke.js`: profile migration·격리·전환·삭제·privacy 신규 회귀
- `qa/local_ai_studio_smoke.js`: profile UI와 API 정적 계약 강화
- `package.json`, runtime config, staged loader, `sw.js`, `asset-integrity.json`: v1.6.40 버전·build key·앱 셸 무결성 동기화

## 변경 범위

- 신규 파일: **24개**
- 수정 파일: **19개**
- 삭제 파일: **0개**
- 변경·추가 합계: **43개**
- 전체 프로젝트 파일: **1,424개**

## 최종 검증

- 등록 QA: **318/318 통과**, 실패 0개
- 서비스워커 무결성: 135개 자산 통과
- asset manifest SHA-256: `0edcb298f0484ab806af510f28326cbfc7e94cd1159f77418dcc759e0e0569a7`
- clean v1.6.39에 패치를 실제 덮어쓴 뒤 full release와 비교했습니다.
  - 적용본 1,424개
  - 통파일 1,424개
  - 누락 0개
  - 추가 불일치 0개
  - SHA-256 불일치 0개
