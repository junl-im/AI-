# SoriON AI 0.8.7 Web quality CI Hotfix 4

## 적용 기준

- 기준 전체본: `SoriON-AI-0.8.7-ci-hotfix-3-full.zip`
- 대상: `0.8.7 CI Hotfix 4`
- 저장소 루트에 패치 ZIP을 풀어 같은 경로의 파일을 덮어씁니다.
- 삭제 대상은 없습니다.

## 수정 내용

- 종료 확인 훅 테스트의 popstate 상태 갱신을 React `act()` 안에서 실행합니다.
- 첫 뒤로가기, 두 번째 뒤로가기, 종료 버튼 테스트가 같은 이벤트 helper를 사용합니다.
- HomePage 테스트가 변경 가능한 placeholder 문구에 결합되지 않도록 수정합니다.
- 장문 입력의 안정 계약인 `maxlength=20000`을 검증합니다.
- 별도 Web 테스트 계약 검사로 두 회귀가 다시 들어오면 Vitest 전에 차단합니다.

## 적용 후 확인

```bash
npm install
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
```
