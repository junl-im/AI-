# SoriON AI 0.8.3 → 0.8.4 패치

## 목적

음성 엔진과 FastAPI 연결을 사용자 수동 설정에서 시스템 자동 bootstrap으로 전환한다.
첫 브랜드 랜딩에서는 Dock을 숨기고, 프로젝트 목록의 저장 작업을 실제 편집 작업공간으로
불러오며 저장 job 결과를 새 합성 없이 먼저 복구한다.

## 적용 조건

현재 저장소의 `package.json` 버전이 정확히 `0.8.3`일 때만 적용한다. 작업 중 변경사항을
먼저 커밋하거나 백업하고 `.git` 폴더는 유지한다.

## 적용 방법

1. 패치 ZIP을 저장소 최상위에 압축 해제해 같은 경로의 파일을 덮어쓴다.
2. `docs/patches/0.8.4/DELETE_LIST.txt`의 네 파일을 삭제한다.
3. 정적 배포는 `VITE_API_BASE_URL`에 공개 HTTPS FastAPI 주소를 빌드 시 주입한다.
4. `package.json` 버전이 `0.8.4`인지 확인한다.
5. 아래 품질 검사를 실행하고 GitHub Actions가 모두 성공한 뒤 병합한다.

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
cd ../worker
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

## 핵심 확인

- 첫 로드에서 API 주소 입력창과 엔진 수동 연결 화면이 나타나지 않는다.
- 앱이 same-origin, 환경변수, 성공 이력과 안전 로컬 후보를 자동 탐색한다.
- 첫 브랜드 랜딩에는 Dock과 메뉴가 보이지 않는다.
- 만들기 또는 프로젝트 불러오기 뒤에만 작업공간 Dock이 나타난다.
- 프로젝트 클릭 시 채팅·보이스·타임라인이 복원된다.
- 저장 job ID가 있으면 새 POST 없이 `/jobs/{id}`와 `/result`를 먼저 조회한다.
- 만료 결과는 자동 재합성하지 않고 블록별 재생성 안내를 표시한다.

## 삭제 파일

- `src/components/settings/ApiSetupWizard.tsx`
- `src/components/settings/ConnectionBottomSheet.tsx`
- `src/components/voice/EngineStatusCard.tsx`
- `src/styles/connection-sheet.css`

## 알려진 제한

GitHub Pages는 정적 Web만 제공하므로 별도 HTTPS FastAPI 또는 same-origin reverse proxy가
필요하다. 실제 CosyVoice 모델·CUDA·GPU는 포함되지 않는다. 마지막 열린 작업공간의 자동
저장과 자동 복원은 0.8.5 범위다.

## 권장 브랜치와 커밋

```text
fix/automatic-engine-project-restore
```

```text
fix: auto-connect engines and restore projects
```
