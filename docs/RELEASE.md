# RELEASE

## 브랜치

- `main`: 운영 배포 가능
- `develop`: 다음 배포 통합
- `feature/*`: 기능
- `fix/*`: 수정
- `docs/*`: 문서

## 배포 조건

- Pull Request 승인
- 웹 lint, typecheck, test, build 통과
- API test와 lint 통과
- 모바일 핵심 폭 수동 확인
- HANDOVER와 CHANGELOG 갱신
- 보안·개인정보 영향 검토

## 버전

Semantic Versioning을 사용한다.

- Patch: 호환되는 수정
- Minor: 호환되는 기능 추가
- Major: API나 데이터 계약의 파괴적 변경

## Firebase Hosting

오직 `dist`만 배포한다. `index.html`, Service Worker, Manifest에는 장기 immutable 캐시를 적용하지 않는다.

## 롤백

- 이전 Hosting 릴리스 보존
- 데이터 스키마 변경 전 복구 방법 작성
- AI 엔진은 설정으로 이전 어댑터를 다시 선택할 수 있게 유지
