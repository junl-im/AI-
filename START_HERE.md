# 곰같은여우 SoriON AI 시작 안내

## 1. GitHub Desktop에 추가

기존 저장소를 유지하는 경우 `.git`은 그대로 두고 전체 파일 또는 패치 파일만 저장소 루트에 덮어씁니다.

권장 작업 브랜치:

```text
feature/premium-creation-ux
```

권장 커밋 메시지:

```text
feat: refine premium creation experience
```

## 2. 기본 환경 설정

```bash
cp .env.example .env
npm install
uv --version
```

## 3. 실행

웹:

```bash
npm run dev
```

API:

```bash
npm run dev:api
```

## 4. 0.6.4 첫 확인

- 설정에서 `전체 연결 검사`를 실행합니다.
- `/api/v1/health`, `/setup`, `/engines`, `/voice-clones/capabilities`가 각각 정상인지 확인합니다.
- `/api/v1/connectivity`에 실제 TTS, 저장소, CORS, Worker 상태가 표시되는지 확인합니다.
- GitHub Pages에서는 API 주소가 없을 때 `API 미설정`이 표시되는지 확인합니다.
- 같은 PC의 API는 `http://127.0.0.1:8000`으로 연결합니다.
- 휴대폰에서는 localhost가 아닌 PC LAN IP 또는 공개 HTTPS API를 사용합니다.
- Python 3.10이 Setup 진단에서 지원 상태로 표시되는지 확인합니다.
- CosyVoice Worker URL만 입력하고 Worker가 꺼져 있으면 준비 완료로 표시되지 않는지 확인합니다.
- 실제 API 음원 URL이 설정한 API Origin으로 해석되는지 확인합니다.
- 상단에 `BUILD v0.6.4`가 표시되는지 확인합니다.
- 첫 화면 입력창이 잘리지 않고 `0 / 500`으로 표시되는지 확인합니다.
- 숫자·날짜 자동 변환 토글과 예시 발음이 보이는지 확인합니다.
- 문장 입력 후 CTA가 `WAV로 생성하기 (약 3초)`로 바뀌는지 확인합니다.
- 생성 후 문장별 생성 구간 리스트가 표시되는지 확인합니다.
- Dock 메뉴 클릭 시 어느 위치에서든 화면 상단으로 이동하는지 확인합니다.
- API quality에서 pytest 50개 이상이 통과하는지 확인합니다.

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
3. 공개 주소에서 `BUILD v0.6.4`을 확인합니다.
4. 공개 Pages에는 Python TTS 엔진이 포함되지 않으므로 API 주소를 별도 설정하지 않으면 Demo WAV가 사용됩니다.


## 0.6.4 프리미엄 생성 UX·적응형 Dock

연결 원인과 실행 방식은 `docs/API_CONNECTIVITY.md`를 먼저 확인합니다. 목소리 복제 원칙은 `docs/VOICE_CLONE.md`, Dock 구조는 `docs/PLAYER_DOCK.md`를 확인합니다.
