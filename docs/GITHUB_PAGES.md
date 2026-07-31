# GitHub Pages 배포

## 현재 저장소 주소

- 저장소: `junl-im/AI-`
- 서비스 경로: `https://junl-im.github.io/AI-/`
- Vite 배포 기준 경로: `/AI-/`

## 왜 기존 사이트가 계속 보였나

새 SoriON 소스는 `main`에 올라갔지만 새 Vite 빌드 결과인 `dist/`를 Pages에 올리는 배포 워크플로가 없었다. GitHub Pages는 마지막 성공 배포본을 계속 제공하므로 이전 AI 쇼츠 스튜디오가 유지됐다.

`.git` 폴더는 원인이 아니다. `.git`은 로컬 변경 이력과 원격 저장소 연결을 보존한다.

## 최초 1회 GitHub 설정

1. GitHub 저장소에서 `Settings`를 연다.
2. 왼쪽 `Pages`를 연다.
3. `Build and deployment`의 `Source`를 **GitHub Actions**로 선택한다.
4. 저장소의 `main` 브랜치에 배포 패치를 Push한다.
5. `Actions`에서 **Deploy SoriON to GitHub Pages**가 성공하는지 확인한다.

## 자동 배포

`.github/workflows/deploy-pages.yml`은 다음 때 실행된다.

- `main` 브랜치 Push
- Actions 화면의 수동 실행

워크플로는 품질 검사 후 `VITE_BASE_PATH=/AI-/`로 빌드하고 `dist/`만 Pages에 배포한다.

## 기존 화면이 브라우저에 남는 경우

배포 성공 후에도 한 기기에서만 이전 화면이 보이면 기존 PWA 서비스워커 캐시일 수 있다.

1. 먼저 강력 새로고침을 실행한다.
2. 그래도 남으면 브라우저 개발자 도구의 `Application → Service Workers`에서 기존 워커를 해제한다.
3. `Application → Storage → Clear site data`를 실행한다.
4. 설치형 PWA가 있다면 제거한 뒤 사이트를 다시 연다.

새 서비스워커는 오래된 캐시를 정리하고 즉시 활성화하도록 설정돼 있다.

## 저장소 이름을 바꿀 때

저장소 이름이 바뀌면 워크플로의 다음 값을 함께 바꾼다.

```yaml
VITE_BASE_PATH: /새-저장소-이름/
```

## 0.3.0 배포 확인

- 공개 화면 상단에 `BUILD v0.3.0`이 표시되는지 확인한다.
- 문장 입력과 음성 프리셋 선택이 동작하는지 확인한다.
- GitHub Pages에는 FastAPI가 없으므로 생성 결과가 `DEMO WAV`로 표시되는 것이 정상이다.
- WAV 재생과 다운로드가 가능해야 한다.

## 0.4.0 배포 확인

- 공개 화면 상단에 `BUILD v0.4.0`이 표시되는지 확인한다.
- 하단의 `품질` 탭이 렌더링되는지 확인한다.
- Pages에는 Python API가 없으므로 품질 탭이 `API 필요` 상태를 정확히 표시해야 한다.
