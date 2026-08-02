# SoriON AI 0.8.6 Longform Voice Studio & Session Persistence

## 적용 기준

- 기준본: `SoriON-AI-0.8.5-ci-hotfix-full.zip`
- `package.json` 버전이 `0.8.5`인지 확인합니다.

## 적용 방법

1. 저장소 루트에 패치 ZIP을 압축 해제해 같은 경로의 파일을 덮어씁니다.
2. `DELETE_LIST.txt`에 적힌 기존 채팅형 제작 파일 6개를 삭제합니다.
3. `npm install` 후 `npm run quality:rules`, `npm run lint`, `npm run typecheck`,
   `npm run test:ci`, `npm run build`를 실행합니다.
4. API와 Worker의 Python 3.10 Ruff·pytest를 실행합니다.
5. 공개 Pages에서 음성을 만들려면 Repository Variable `SORION_PUBLIC_API_BASE_URL`에
   별도 배포한 HTTPS FastAPI Origin을 설정합니다. 사용자 입력 UI는 없습니다.

## 핵심 변경

- 최대 20,000자 장문 내용 편집기와 문장별 순차 음성 제작
- 공식 SoriON 아이콘을 favicon·PWA·랜딩·작업공간 상단에 통일
- 모든 상단 브랜드 클릭 시 첫 페이지 이동
- 첫 뒤로가기 커스텀 확인, 확인 중 두 번째 뒤로가기 즉시 이탈
- IndexedDB 세션 저장과 revision 기반 오래된 결과 덮어쓰기 방지
- GitHub Pages same-origin·`:8443` Voice API 오탐 차단
- 연결 복구 후 대기 중이던 장문 제작 자동 재개
- `/connectivity`와 `/engines` 추천 엔진 상태 일치

## 엔진 주의

로컬 System Voice는 실제 WAV를 만들지만 AI 모델 음성이 아닙니다. 공개 Pages에서 실제 음성을
생성하려면 HTTPS FastAPI가 별도로 실행 중이어야 하며, CosyVoice AI 품질은 모델·GPU Worker
설치 후 0.8.7에서 본격 검증합니다.
