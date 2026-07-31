# SoriON AI 0.5.8 → 0.6.0 패치 안내

## 적용 대상

현재 저장소 루트의 `package.json` 버전이 정확히 `0.5.8`인 경우에만 사용한다.
버전이 다르거나 로컬 파일 상태가 불확실하면 `SoriON-AI-0.6.0-full.zip`을 사용한다.

## 적용 순서

1. GitHub Desktop에서 작업 중인 변경사항을 먼저 커밋하거나 별도 백업한다.
2. 기존 `.git` 폴더는 삭제하거나 덮어쓰지 않는다.
3. 패치 ZIP의 파일과 폴더를 저장소 루트에 압축 해제한다.
4. 동일한 이름의 파일은 모두 덮어쓴다.
5. 이번 패치에는 삭제할 기존 파일이 없다.
6. GitHub Desktop의 Changes와 `PATCH_MANIFEST.txt`를 비교한다.
7. 아래 검사를 실행한 뒤 Push한다.

```bash
npm install
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build

cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

## 주요 변경

- 모바일 3단계 목소리 복제 샘플 준비
- 마이크 녹음과 음성 파일 업로드
- 길이·무음·클리핑·음량의 로컬 품질 검사
- 명시적 권리·AI 고지·금지 용도 동의
- IndexedDB 로컬 우선 음성 프로필
- FastAPI 음성 복제 준비·삭제 API
- CosyVoice Worker 분리 경계
- Dock 재생 대기열, 이전·다음, 반복, 속도, 다운로드

## 삭제 목록

`DELETE_LIST.txt` 기준 삭제 파일 없음.

## 권장 Git 정보

브랜치:

```text
feature/voice-clone-player-queue
```

커밋:

```text
feat: add voice clone foundation and player queue
```
