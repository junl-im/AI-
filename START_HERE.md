# 곰같은여우 SoriON AI 시작 안내

현재 버전: `0.8.7 Dubbing Studio Workspace`

## 0. 가장 먼저 읽을 파일

1. [`docs/HANDOVER.md`](docs/HANDOVER.md)
2. [`DELIVERY_RULES.md`](DELIVERY_RULES.md)
3. [`docs/NEXT_UPDATE.md`](docs/NEXT_UPDATE.md)
4. [`docs/DUBBING_STUDIO_UX.md`](docs/DUBBING_STUDIO_UX.md)
5. [`docs/LONGFORM_VOICE_WORKSPACE.md`](docs/LONGFORM_VOICE_WORKSPACE.md)

## 1. 패치 적용 원칙

- 기준본은 `SoriON-AI-0.8.6-full.zip`입니다.
- 저장소 루트에 패치 ZIP을 풀어 같은 파일을 덮어씁니다.
- `docs/patches/0.8.7/DELETE_LIST.txt`를 확인합니다.
- `.git`, `.env`, 모델, 실행 DB와 사용자 음원은 유지합니다.

권장 브랜치와 커밋:

```text
feat/dubbing-studio-workspace
feat: redesign creation as a mobile dubbing studio
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
공개 HTTPS FastAPI Origin을 설정합니다.

```text
Variable name: SORION_PUBLIC_API_BASE_URL
Value: https://voice-api.example.com
```

## 4. 0.8.7 확인 목록

- 상단에 프로젝트 제목·자동 저장 시각·음성 시스템 상태가 표시되는지 확인
- 상단 브랜드를 누르면 첫 페이지로 이동하는지 확인
- 화자 행에서 목소리 선택·프리뷰·읽기 설정 Sheet가 열리는지 확인
- 장문 원고를 전체 문장 블록으로 변환할 수 있는지 확인
- 각 대사 블록의 수정·생성·재생·분할·이동·삭제가 동작하는지 확인
- 새 대사·쉼 블록 추가가 세션 저장과 연결되는지 확인
- 하단 고정 플레이어의 이전·재생·다음·진행률이 현재 Queue와 일치하는지 확인
- 작업 비우기 전에 앱 내부 확인창이 표시되는지 확인
- 새로고침 뒤 프로젝트 제목·원고·설정·블록·job ID가 복원되는지 확인
- 첫 페이지에는 Dock이 없고 작업공간에만 표시되는지 확인
- 모바일 safe-area와 키보드가 하단 플레이어·편집 블록을 가리지 않는지 확인

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
