# 곰같은여우 SoriON AI 시작 안내

## 1. GitHub Desktop에 추가

1. 이 폴더를 원하는 개발 위치에 압축 해제합니다.
2. GitHub Desktop에서 **File → Add local repository**를 선택합니다.
3. 저장소가 아니라는 안내가 나오면 **Create a repository**를 선택합니다.
4. 기본 브랜치를 `main`으로 생성한 뒤 첫 커밋을 만듭니다.
5. `develop` 브랜치를 만들고 이후 작업은 `develop`에서 분기합니다.

첫 커밋 권장 메시지:

```text
chore: initialize SoriON AI foundation
```

## 2. 환경 설정

```bash
cp .env.example .env
npm install
cd services/api
uv sync --dev
```

Windows에서는 `.env.example`을 복사해 파일명을 `.env`로 변경해도 됩니다.

## 3. 실행

웹:

```bash
npm run dev
```

API:

```bash
cd services/api
uv run uvicorn app.main:app --reload
```

## 4. 첫 확인

- 모바일 폭에서 하단 탭이 정상 표시되는지 확인합니다.
- 설정 화면에서 API 상태가 `정상`인지 확인합니다.
- 홈에서 문장을 입력하고 개발용 생성 요청을 보냅니다.
- 프로젝트 화면에 로컬 기록이 남는지 확인합니다.

## 5. 다음 기능 브랜치

```text
feature/firebase-auth
feature/tts-engine-kokoro
feature/audio-player
feature/voice-upload
```

첫 실제 AI 연결은 `feature/tts-engine-kokoro`에서 시작합니다.

## 6. 업데이트 패치 적용

패치 ZIP은 기준 버전이 현재 프로젝트와 일치할 때 저장소 루트에 바로 압축 해제해 덮어씁니다.

적용 전 순서:

1. GitHub Desktop에서 작업 중인 변경사항을 커밋하거나 백업합니다.
2. `.git` 폴더는 유지합니다.
3. 패치 ZIP의 `PATCH_README.md`에서 기준 버전을 확인합니다.
4. 저장소 루트에 압축을 해제합니다.
5. GitHub Desktop의 Changes와 `PATCH_MANIFEST.txt`를 비교합니다.
6. `npm run quality:rules`와 관련 테스트를 실행합니다.

영구 전달 기준은 [`DELIVERY_RULES.md`](DELIVERY_RULES.md)를 참고합니다.

## 7. GitHub Pages 배포

1. GitHub 저장소의 `Settings → Pages`를 연다.
2. `Build and deployment → Source`를 **GitHub Actions**로 선택한다.
3. `main` 브랜치에 Push한다.
4. Actions에서 `Deploy SoriON to GitHub Pages` 성공을 확인한다.
5. `https://junl-im.github.io/AI-/`를 연다.

기존 사이트가 한 기기에서만 남으면 서비스워커와 사이트 데이터를 한 번 지운다. 자세한 내용은 [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md)를 참고한다.
