# GitHub Pages 배포

## 현재 저장소 주소

- 저장소: `junl-im/AI-`
- 서비스 경로: `https://junl-im.github.io/AI-/`
- Vite 배포 기준 경로: `/AI-/`

## 0.5.7 배포 구조

`.github/workflows/ci.yml` 하나가 다음 작업을 관리한다.

1. Web quality
2. API quality · Python 3.10
3. 두 품질 작업 성공 후 GitHub Pages 배포

`main` Push는 하나의 `SoriON CI & Pages` 실행으로 검사와 배포가 이어진다. `develop`과 기능 브랜치는 `main` 또는 `develop` 대상 Pull Request에서 검사한다.

별도 `.github/workflows/deploy-pages.yml`은 삭제했다. 품질 검사와 배포 워크플로를 각각 Push에 연결하면 같은 커밋이 All workflows에 두 번 나타날 수 있기 때문이다.

## 최초 1회 GitHub 설정

1. GitHub 저장소에서 `Settings`를 연다.
2. 왼쪽 `Pages`를 연다.
3. `Build and deployment`의 `Source`를 **GitHub Actions**로 선택한다.
4. `Deploy from a branch`를 사용하지 않는다.
5. `main`에 패치를 병합한다.
6. Actions에서 `SoriON CI & Pages` 실행 하나가 생성되는지 확인한다.

Pages Source가 브랜치 배포로 남아 있으면 GitHub가 관리하는 `pages-build-deployment`가 별도로 생성된다. 이것은 `.git` 폴더 문제가 아니라 저장소 Pages 설정 문제다.

## 정상 실행 형태

`main` Push 한 번에 All workflows에는 프로젝트 실행 하나가 추가되고, 그 안에서 다음 작업이 보인다.

```text
Web quality
API quality · Python 3.10
Deploy GitHub Pages
```

Pull Request가 열린 `develop` 또는 기능 브랜치에 새 커밋을 Push해도 PR 이벤트 하나만 실행된다. 이 브랜치들을 Push 자동 트리거에서 제외해 같은 커밋의 Push·PR 중복 실행을 막는다.

## 배포 경로

워크플로는 저장소 이름을 사용해 Vite base를 자동 설정한다.

```text
/${{ github.event.repository.name }}/
```

현재 저장소에서는 `/AI-/`가 된다. `dist/`만 Pages 아티팩트로 업로드한다.

## 이전 화면이 남는 경우

배포 성공 후에도 한 기기에서만 이전 화면이 보이면 기존 PWA 서비스워커 캐시일 수 있다.

1. 강력 새로고침을 실행한다.
2. 개발자 도구 `Application → Service Workers`에서 기존 워커를 해제한다.
3. `Application → Storage → Clear site data`를 실행한다.
4. 설치형 PWA가 있다면 제거한 뒤 다시 접속한다.

## 0.5.7 확인

- 공개 화면 상단에 `BUILD v0.5.7` 표시
- 브랜드 문구와 마이크 배너 정상 표시
- GitHub Pages에서는 API 미연결 시 `DEMO WAV` 표시
- 로컬 Voice API를 연결하면 실제 엔진 상태와 진행률 표시

## 0.5.7 Action 런타임 호환성

Web·API 품질 Job의 JavaScript Action을 Node.js 24 기반 버전으로 올렸다.

```text
actions/checkout@v6
actions/setup-node@v6
astral-sh/setup-uv@08807647e7069bb48b6ef5acd8ec9567f424441b # v8.1.0
```

Pages 액션도 Node.js 24 대응 stable major로 갱신했다.

```text
actions/configure-pages@v6
actions/upload-pages-artifact@v5
actions/deploy-pages@v5
```

`setup-uv`는 메이저 태그가 아니라 Astral 공식 문서가 제시한 불변 커밋 SHA로 고정한다. 액션 내부에서 설치할 uv도 `0.11.32`로 고정한다. 워크플로에는 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`를 방어적으로 유지한다.
