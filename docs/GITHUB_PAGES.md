# GitHub Pages 무료 배포

GitHub Pages에는 `dist` 정적 Web/PWA만 배포합니다. Python FastAPI와 모델 Worker는 Pages에서
실행하지 않습니다.

## 동작

- 데스크톱: 사용자 PC의 `127.0.0.1:8000` 무료 API 자동 탐색
- 모바일: Browser Speech 자동 사용
- Pages 자체 `/api` 또는 `:8443`은 검사하지 않음
- 사용자에게 연결 주소 입력 UI를 제공하지 않음

## 최초 설정

1. 저장소 `Settings → Pages`에서 Source를 `GitHub Actions`로 선택합니다.
2. `main`에 push합니다.
3. Web quality와 Pages deploy가 모두 성공했는지 확인합니다.

별도 공개 API 변수가 없어도 브라우저 음성으로 기본 재생이 가능합니다. 고품질 AI와 WAV 다운로드는
사용자 PC의 무료 로컬 런타임을 실행한 데스크톱에서 제공합니다.
