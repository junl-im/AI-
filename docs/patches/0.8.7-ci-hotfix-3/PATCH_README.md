# SoriON AI 0.8.7 Web quality CI Hotfix 3

## 적용 기준

- 기준 전체본: `SoriON-AI-0.8.7-ci-hotfix-2-full.zip`
- 대상: `0.8.7 CI Hotfix 3`
- 저장소 루트에 패치 ZIP을 풀어 같은 경로의 파일을 덮어씁니다.
- 삭제 대상은 없습니다.

## 수정 내용

- 프로젝트 상단 메뉴의 네이티브 `details/summary` 의존을 제거합니다.
- 명시적 React 상태, button, `aria-expanded`로 메뉴 열림 상태를 관리합니다.
- 같은 잠재 문제가 있던 대사 블록 메뉴도 동일 구조로 교체합니다.
- 메뉴 항목 선택 뒤 팝업을 닫고 정확한 callback을 실행합니다.
- 프로젝트 규칙에서 제작 화면의 `details/summary` 재도입을 차단합니다.

## 적용 후 확인

```bash
npm install
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
```
