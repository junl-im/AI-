# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.8.6 Longform Voice Studio & Session Persistence`

## 0. 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
4. [`docs/LONGFORM_VOICE_WORKSPACE.md`](docs/LONGFORM_VOICE_WORKSPACE.md)
5. [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)

## 1. 패치 적용 원칙

- 기준본은 `SoriON-AI-0.8.5-ci-hotfix-full.zip`입니다.
- 저장소 루트에 패치 ZIP을 풀어 같은 파일을 덮어씁니다.
- `docs/patches/0.8.6/DELETE_LIST.txt`의 파일을 삭제합니다.
- `.git`, `.env`, 모델, 실행 DB와 사용자 음원은 유지합니다.

권장 브랜치와 커밋:

```text
feat/longform-voice-studio
feat: redesign creation for longform voice production
```

## 2. 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
npm run dev
```

Node.js 22+, npm 10+, Python 3.10~3.12와 uv를 사용합니다.

## 3. 공개 Voice API 자동 연결

사용자는 API 주소나 엔진을 입력하지 않습니다. GitHub Pages 배포 관리자가 저장소 Actions 변수에
공개 HTTPS FastAPI Origin을 한 번 설정합니다.

```text
Variable name: SORION_PUBLIC_API_BASE_URL
Value: https://voice-api.example.com
```

CI가 이를 `VITE_API_BASE_URL`로 주입합니다. GitHub Pages 자체는 Voice API 후보가 아니며
`https://junl-im.github.io/api/v1`과 `:8443`을 탐색하지 않습니다.

## 4. 0.8.6 확인 목록

- 첫 화면과 PWA 아이콘이 공식 SoriON 아이콘인지 확인
- 작업공간 상단 아이콘·이름 클릭 시 첫 페이지 이동
- 첫 뒤로가기에서 커스텀 종료 확인창 표시
- 확인창 상태에서 두 번째 뒤로가기 시 즉시 이탈
- 첫 페이지에는 Dock이 없고 작업공간에만 표시
- 20,000자 장문 원고 입력, 일반 Enter 줄바꿈, Ctrl/⌘+Enter 제작
- 생성 후 원고가 편집기에 유지되는지 확인
- 문자·문단·블록·예상 길이 통계 확인
- 서버 미연결 상태에서 제작 후 연결 복구 시 자동 생성 재개
- Pages 환경에서 same-origin과 `:8443` 오탐 후보가 없는지 확인
- `/connectivity`와 `/engines`의 추천 엔진 ID 일치
- 새로고침 뒤 원고·옵션·타임라인과 job ID 복원
- 수정한 블록에 오래된 생성 결과가 적용되지 않는지 확인

## 5. 품질 검사

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

```bash
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q

cd ../worker
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

현재 API 테스트 기준은 90개, Worker는 9개입니다.
