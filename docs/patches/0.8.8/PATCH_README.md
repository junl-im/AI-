# SoriON AI 0.8.8 Header Restore & Browser Voice Fallback

- 기준 전체본: `SoriON-AI-0.8.7-ci-hotfix-4-full.zip`
- 대상 버전: `0.8.8`
- 적용 방식: 저장소 루트에 패치 ZIP을 덮어쓴 뒤 `DELETE_LIST.txt`의 파일을 삭제합니다.

## 핵심 변경

1. 0.8.6 계열의 공통 상단 배너를 내부 모든 페이지에 복원했습니다.
2. 모든 내부 페이지에서 작은 `SoriON` 프로그램명을 표시하고, 브랜드 영역을 누르면 첫 페이지로 이동합니다.
3. 사용자 제공 1254×1254 PNG를 변형 없는 공식 원본 `public/sorion-logo.png`으로 사용합니다.
4. 공개 Voice API가 아직 배포되지 않은 환경에서도 Web Speech API가 지원되면 한국어 음성을 즉시 재생합니다.
5. 실제 HTTPS Voice API가 연결되면 브라우저 음성보다 서버 AI 엔진을 우선합니다.

## 중요한 한계

브라우저 음성은 재생 기능을 살리는 안전한 fallback입니다. AI 음색, WAV 다운로드, 음성 복제와 고품질 서버 합성은 별도의 공개 HTTPS FastAPI/Worker 배포가 있어야 동작합니다.
