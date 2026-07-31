# 곰같은여우 SoriON AI 시작 안내

## 1. GitHub Desktop에 추가

기존 저장소를 유지하는 경우 `.git`은 그대로 두고 전체 파일 또는 패치 파일만 저장소 루트에 덮어씁니다.

권장 작업 브랜치:

```text
feature/voice-clone-player-queue
```

권장 커밋 메시지:

```text
feat: add voice clone foundation and player queue
```

## 2. 기본 환경 설정

```bash
cp .env.example .env
npm install
cd services/api
uv sync --dev
```

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

## 4. 0.6.1 첫 확인

- `.github/workflows`에 `ci.yml` 하나만 남았는지 확인합니다.
- Web quality에서 TypeScript, Vitest, ESLint, Vite build가 통과하는지 확인합니다.
- API quality에서 Ruff와 pytest 44개 이상이 Python 3.10으로 통과하는지 확인합니다.
- 상단에 `BUILD v0.6.1`이 표시되는지 확인합니다.
- Dock 메뉴에 `복제`가 추가됐는지 확인합니다.
- 복제 화면에서 마이크 녹음과 파일 선택이 가능한지 확인합니다.
- 10초 가이드와 길이·무음·클리핑·음량 결과가 표시되는지 확인합니다.
- 세 가지 동의 항목을 모두 선택하기 전에는 샘플 준비 버튼이 비활성인지 확인합니다.
- API가 없을 때 실제 복제 성공이 아닌 로컬 샘플 준비로 표시되는지 확인합니다.
- Dock에서 대기열, 이전·다음, 반복, 속도, 다운로드가 동작하는지 확인합니다.
- 음성 생성 결과와 복제 원본 샘플이 같은 Dock에 연결되는지 확인합니다.
- 동의 철회 버튼이 IndexedDB와 API 임시 샘플 삭제를 요청하는지 확인합니다.
- `/api/v1/voice-clones/capabilities`가 Worker 준비 상태를 반환하는지 확인합니다.
- 유효한 WAV는 프로필 준비가 되고 5초 미만 WAV와 동의 누락 요청은 거부되는지 확인합니다.

## 5. 엔진 설치와 품질 평가

MeloTTS는 별도 모델과 PyTorch 계열 의존성이 필요하므로 기본 API 설치에 강제하지 않습니다.

- 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- 설치: [`docs/ENGINE_PILOT.md`](docs/ENGINE_PILOT.md)
- 진단·A/B 비교: [`docs/QUALITY_LAB.md`](docs/QUALITY_LAB.md)
- 평가 문장: `docs/evaluation/KOREAN_TTS_SENTENCES.json`

## 6. 업데이트 패치 적용

1. GitHub Desktop에서 작업 중인 변경사항을 커밋하거나 백업합니다.
2. `.git` 폴더는 유지합니다.
3. 패치 ZIP의 `PATCH_README.md`에서 기준 버전을 확인합니다.
4. 저장소 루트에 압축을 해제해 덮어씁니다.
5. 삭제 목록이 있으면 정리 스크립트를 실행합니다.
6. GitHub Desktop의 Changes와 `PATCH_MANIFEST.txt`를 비교합니다.
7. 프로젝트 규칙, 웹 검사, API 테스트를 실행합니다.

## 7. GitHub Pages 배포

1. Pull Request를 `main`에 병합합니다.
2. Actions에서 `SoriON CI & Pages` 실행 하나가 성공하는지 확인합니다.
3. 공개 주소에서 `BUILD v0.6.1`을 확인합니다.
4. 공개 Pages에는 Python TTS 엔진이 포함되지 않으므로 API 주소를 별도 설정하지 않으면 Demo WAV가 사용됩니다.


## 0.6.1 운영 연결과 복제

설정 화면에서 Voice API 주소를 입력하고 연결 검사를 실행합니다. 목소리 복제 원칙은 `docs/VOICE_CLONE.md`, Dock 구조는 `docs/PLAYER_DOCK.md`를 확인합니다.
