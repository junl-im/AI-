# SoriON AI 0.8.7 Web quality CI Hotfix

## 적용 기준

- 기준 전체본: `SoriON-AI-0.8.7-full.zip`
- 대상: `0.8.7 CI Hotfix`
- 저장소 루트에 패치 ZIP을 풀어 같은 경로의 파일을 덮어씁니다.
- 삭제 대상은 없습니다.

## 수정 내용

- 대사 생성·재생 버튼의 접근성 이름을 대사 번호와 상태별로 고유하게 만듭니다.
- 실패 블록 재시도 테스트가 정확히 2번 대사 버튼을 선택합니다.
- 타임라인 데이터, 음성 요청, 엔진과 화면 배치는 변경하지 않습니다.

## 적용 후 확인

```bash
npm install
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
```
