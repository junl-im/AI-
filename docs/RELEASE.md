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

## GitHub Pages

- 게시 소스는 **GitHub Actions**를 사용한다.
- `.github/workflows/ci.yml` 하나가 품질 검사와 `main` Pages 배포를 함께 관리한다.
- 저장소 경로 `/AI-/`를 Vite base와 PWA scope에 적용한다.
- 소스 루트가 아니라 빌드 결과 `dist/`만 배포한다.
- 배포 성공 전에는 이전 Pages 릴리스가 계속 서비스될 수 있다.

## Firebase Hosting

오직 `dist`만 배포한다. `index.html`, Service Worker, Manifest에는 장기 immutable 캐시를 적용하지 않는다.

## 롤백

- 이전 Hosting 릴리스 보존
- 데이터 스키마 변경 전 복구 방법 작성
- AI 엔진은 설정으로 이전 어댑터를 다시 선택할 수 있게 유지

## 필수 전달 산출물

모든 코드 업데이트는 다음을 한 묶음으로 전달한다.

- `1. 결과` 설명
- 현재 버전 **전체 통파일 ZIP**
- 직전 기준 버전용 **덮어쓰기용 패치 ZIP**
- 두 ZIP의 SHA-256 체크섬
- 갱신된 `docs/HANDOVER.md`
- 갱신된 `docs/CHANGELOG.md`
- 갱신된 `docs/NEXT_UPDATE.md`
- `3. 다음 예상 업데이트 내역` 설명

패치 ZIP은 저장소 루트 기준 경로를 사용하며 `.git`을 포함하지 않는다. 세부 기준은 루트의 `DELIVERY_RULES.md`를 따른다.

## 음성 결과 릴리스 조건

- 브라우저 Demo를 실제 AI 음성으로 표현하지 않는다.
- 결과 카드에 `DEMO WAV`, `MOCK`, `AI AUDIO` 출처가 명확해야 한다.
- 오디오 자동 재생을 사용하지 않는다.
- 다운로드 파일명에 운영체제 금지 문자가 없어야 한다.
- Blob Object URL은 화면 생명주기에 맞춰 해제해야 한다.
