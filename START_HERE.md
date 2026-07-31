# SoriON AI 시작 안내

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
