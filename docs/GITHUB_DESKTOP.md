# GitHub Desktop 규칙

## 작업 시작

1. `develop` 선택
2. Fetch origin
3. 변경이 있으면 Pull origin
4. `feature/기능명` 브랜치 생성

## 커밋

- 한 커밋은 한 목적
- 커밋 전 Changes 목록을 직접 확인
- `.env`, 음성 파일, 모델 파일 제외
- 예: `feat: add Kokoro engine adapter`

## 병합

- 기능 브랜치를 Push
- Pull Request 대상을 `develop`으로 지정
- CI와 리뷰 통과 후 병합
- 릴리스 시 `develop`에서 `main`으로 Pull Request
- `main` 직접 커밋과 Force Push 금지

## 충돌

충돌 해결 전 현재 변경을 커밋하거나 Stash한다. AI 엔진 설정과 문서 충돌은 양쪽 내용을 무조건 합치지 말고 최신 설계 결정을 확인한다.
