# SoriON AI 0.8.7 Web quality CI Hotfix 2

## 적용 기준

- 기준 전체본: `SoriON-AI-0.8.7-ci-hotfix-full.zip`
- 대상: `0.8.7 CI Hotfix 2`
- 저장소 루트에 패치 ZIP을 풀어 같은 경로의 파일을 덮어씁니다.
- 삭제 대상은 없습니다.

## 수정 내용

- 현재 화자 선택 버튼과 미리듣기 버튼의 접근성 이름을 역할별로 분리합니다.
- 화자 선택·음성 설정 버튼에 dialog popup과 펼침 상태를 제공합니다.
- DubbingVoiceControls와 HomePage 테스트가 정확한 버튼 이름을 사용합니다.
- TimelineEditor의 앞선 접근성 핫픽스와 더빙 기능은 변경하지 않습니다.

## 적용 후 확인

```bash
npm install
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
```
