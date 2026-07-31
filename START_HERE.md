# 곰같은여우 SoriON AI 시작 안내

## 1. GitHub Desktop에 추가

기존 저장소를 유지하는 경우 `.git`은 그대로 두고 전체 파일 또는 패치 파일만 저장소 루트에 덮어씁니다.

권장 작업 브랜치:

```text
fix/api-lint-engine-strategy
```

권장 커밋 메시지:

```text
fix: pass API lint and define engine strategy
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

## 4. 0.5.5 첫 확인

- `.github/workflows`에 `ci.yml` 하나만 남았는지 확인합니다.
- Web quality에서 Mock WAV와 HomePage 테스트가 통과하는지 확인합니다.
- API quality에서 Ruff와 pytest가 Python 3.10으로 통과하는지 확인합니다.
- `/api/v1/engines/strategy`가 CosyVoice 3를 주력 엔진으로 반환하는지 확인합니다.
- GitHub Pages Source가 `GitHub Actions`인지 확인합니다.
- `main` Push 한 번에 `SoriON CI & Pages` 실행 하나만 생성되는지 확인합니다.
- Web quality, API quality · Python 3.10, Deploy GitHub Pages가 같은 실행 안에 표시되는지 확인합니다.
- 상단에 `BUILD v0.5.5`이 표시되는지 확인합니다.
- 상단 배너 높이가 이전 버전보다 줄었는지 확인합니다.
- `곰같은여우 SoriON AI`와 세 개의 한국어 문장이 순서대로 페이드되는지 확인합니다.
- `AI`의 `I`가 마이크 형태인지 확인합니다.
- PC 폭에서 Voice Core에 스튜디오 마이크가 표시되는지 확인합니다.
- 운영체제의 모션 감소 설정에서는 브랜드 제목이 정지 상태로 표시되는지 확인합니다.
- 하단 메뉴에 `품질` 탭이 추가됐는지 확인합니다.
- 생성 결과에 생성 시간, RTF, 파일 크기, 구간 수가 표시되는지 확인합니다.
- `38,500원`, `2026-08-03`, `AI`, `95%`가 한국어 읽기 형태로 전처리되는지 확인합니다.
- 180자를 넘는 문장이 여러 구간으로 생성되고 WAV 하나로 재생되는지 확인합니다.
- 품질 탭에서 Python, 메모리, MeloTTS, 시스템 음성 상태가 표시되는지 확인합니다.
- 실제 엔진이 두 개 준비되면 A/B 비교 음원 두 개가 생성되는지 확인합니다.

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
3. 공개 주소에서 `BUILD v0.5.5`을 확인합니다.
4. 공개 Pages에는 Python TTS 엔진이 포함되지 않으므로 API 주소를 별도 설정하지 않으면 Demo WAV가 사용됩니다.


## 0.5.5 운영 연결

설정 화면에서 Voice API 주소를 입력하고 연결 검사를 실행합니다. 자세한 흐름은 `docs/PRODUCTION_READINESS.md`를 확인합니다.
