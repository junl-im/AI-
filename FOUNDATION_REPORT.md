# SoriON AI 0.5.3 CI Test Compatibility Report

## 목적

0.5.2 배포 뒤 GitHub Actions에서 확인된 Web 테스트 2건, API 품질 검사 실패, Node.js 20 액션 경고를 동시에 수정한다. 새 기능보다 자동 검사 신뢰성을 우선해 다음 `0.6.0 Mobile Voice Clone Foundation` 작업의 안전한 기준점을 만든다.

## 확인된 원인

### Mock WAV 테스트

JSDOM이 제공하는 `Blob` 구현에는 브라우저의 `Blob.arrayBuffer()`가 없을 수 있다. 생성 코드가 아니라 테스트 런타임 차이 때문에 WAV 헤더 검사 시작 전에 `TypeError`가 발생했다.

### HomePage 테스트

`읽을 문장`이라는 접근성 이름을 가진 요소가 두 개였다.

- `aria-labelledby`를 가진 작성 영역 `section`
- 실제 입력 요소 `textarea`

전역 `getByLabelText`는 두 요소를 모두 일치시켰다. 테스트가 확인해야 하는 대상은 입력 컨트롤이므로 `textbox` 역할과 현재 렌더 컨테이너 범위로 쿼리를 좁혔다.

### API quality

Python 3.10 호환을 위해 `timezone.utc`를 사용하지만 Ruff의 `UP017` 규칙은 이를 `datetime.UTC`로 바꾸도록 요구한다. `datetime.UTC`는 Python 3.11 이상 기능이므로 지원 최소 버전과 린트 규칙이 충돌했다. 또한 CI 명령이 저장소 루트와 API 디렉터리를 혼용해 설정 탐색이 불명확했다.

### Node.js 경고

`actions/checkout@v4`, `actions/setup-node@v4`, `astral-sh/setup-uv@v6`는 Node.js 20 기반 세대였다. GitHub runner의 Node.js 24 전환에 맞춰 현재 major로 갱신했다.

## 수정 내용

- `src/test/setup.ts`에 `FileReader` 기반 `Blob.arrayBuffer` 폴리필 추가
- 테스트 종료마다 `cleanup()`과 `document.body.replaceChildren()` 실행
- `HomePage.test.tsx`를 `within(renderResult.container)`와 `getByRole('textbox')` 기준으로 변경
- Ruff `target-version = "py310"` 유지 및 `UP017`만 제외
- Python 3.10 호환 설정 회귀 테스트 추가
- API Job 기본 작업 디렉터리를 `services/api`로 고정
- `setup-uv@v8`의 `python-version`과 `working-directory` 입력 사용
- `checkout@v6`, `setup-node@v6`, `setup-python@v6`, Node.js 24 적용
- Pages 액션을 `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`로 갱신
- 구형 액션과 호환성 누락을 프로젝트 규칙 검사에서 차단

## 검증 결과

- 프로젝트 규칙 검사: 통과
- FastAPI 테스트: 31개 통과
- Python 전체 문법 컴파일: 통과
- YAML 파싱 및 필수 CI 단계 검사: 통과
- 모든 소스 파일 500줄 이하: 통과
- SVG·비밀키·런타임 산출물 검사: 통과
- `0.5.2`에 패치를 적용한 결과와 전체 `0.5.3` 파일 동등성: 통과
- 전체 ZIP과 패치 ZIP 무결성: 통과

## 현재 환경에서 실행하지 못한 검사

현재 작업 환경은 외부 npm 및 Python 배포 서버의 DNS 접근이 제한되어 다음 검사를 정식 의존성 환경에서 실행하지 못했다.

- Vitest 전체 실행
- ESLint
- Vite production build
- uv가 내려받은 CPython 3.10에서의 pytest·Ruff

따라서 GitHub Actions에서 다음 세 Job이 모두 성공하는 것을 최종 완료 기준으로 한다.

```text
Web quality
API quality · Python 3.10
Deploy GitHub Pages
```

## 적용 후 확인

- All workflows에 `SoriON CI & Pages` 실행 하나만 생성되는지 확인
- Web quality에서 Mock WAV와 HomePage 테스트가 통과하는지 확인
- API quality에서 Ruff와 pytest가 Python 3.10으로 통과하는지 확인
- Node.js 20 경고에서 checkout·setup-node·setup-python·setup-uv·Pages 액션 항목이 사라졌는지 확인
- 공개 사이트 상단에 `BUILD v0.5.3`이 표시되는지 확인
