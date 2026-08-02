# CODING RULE

## 파일과 함수

- 소스 파일은 800줄부터 책임 분리를 권고하고 1,200줄을 안전 상한으로 사용
- 함수는 한 가지 책임만 가짐
- UI, 데이터 접근, AI 엔진 호출을 한 함수에 섞지 않음
- 동일 로직이 두 번 나타나면 공통화 검토

## TypeScript

- `strict` 유지
- `any` 사용 금지, 불가피하면 이유 주석
- API 타입과 화면 상태 타입 분리
- 사용자에게 보이는 오류는 한국어

## Python

- 타입 힌트 필수
- Pydantic으로 외부 입력 검증
- 엔진 구현은 `TtsEngine`과 같은 공통 계약을 구현
- 라우터에서 모델 라이브러리를 직접 호출하지 않음

## 금지

- 비밀키 하드코딩
- SVG 파일
- 모델과 음성 바이너리 Git 커밋
- 테스트 없는 기능 병합
- `main` 직접 커밋
- Deprecated API 신규 사용

## 자동 검사

```bash
npm run quality:rules
```

이 검사는 800줄 분리 권고·1,200줄 안전 상한, SVG, 대표적인 비밀키 패턴을 검사한다. 800~1,200줄은 경고만 표시하며 CI를 실패시키지 않는다.

## 전달과 인수인계

- 코드 변경 결과에는 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP을 함께 만든다.
- `docs/HANDOVER.md`에는 작업 일시, 이유, 영향, 검증, 제한, 산출물, 다음 계획을 기록한다.
- `docs/CHANGELOG.md`와 `docs/NEXT_UPDATE.md`를 같은 작업에서 갱신한다.
- 전달 규칙을 생략한 업데이트는 완료로 보지 않는다.
- 세부 형식은 루트의 `DELIVERY_RULES.md`를 따른다.

## 음성 결과 상태

- Mock, 브라우저 Demo, 실제 AI 음원을 타입과 UI에서 분리한다.
- API가 음원을 반환하지 않았는데 실제 생성 완료로 표현하지 않는다.
- Object URL은 새 결과 생성, 닫기, 화면 종료 시 해제한다.
- 오디오 자동 재생을 기본값으로 사용하지 않는다.
- 다운로드 파일명은 운영체제 금지 문자를 제거한다.

## Web 도구체인 규칙

- 직접 npm 의존성은 정확한 버전으로 고정하고 caret·tilde 범위를 사용하지 않는다.
- 직접 import하는 패키지는 transitive dependency에 기대지 않고 `package.json`에 선언한다.
- Vite, Vitest, Tailwind Vite plugin, TypeScript, typescript-eslint의 peer 범위를 함께 확인한다.
- CI는 설치 전 manifest와 설치 후 실제 패키지 버전·dependency tree를 모두 검사한다.
- 네트워크 가능한 환경에서 `package-lock.json`을 생성하면 이후 설치는 `npm ci`로 전환한다.

## 최소 런타임 호환성

- API의 지원 최소 버전은 Python 3.10이다.
- 표준 라이브러리 기능은 `requires-python` 하한에서 실제 import 가능한지 확인한다.
- UTC 시간대는 Python 3.10과 호환되는 `datetime.timezone.utc`를 사용한다.
- Vitest는 전역 API 사용 여부와 무관하게 `afterEach(cleanup)`으로 DOM을 정리한다.

## 음성 복제 코드 규칙

- 브라우저 품질 결과만 믿고 서버 검증을 생략하지 않는다.
- 동의 검증과 파일 저장은 같은 API 요청 경계에서 처리한다.
- 사용자 파일명을 서버 저장 경로로 사용하지 않는다.
- 모델 패키지는 FastAPI 게이트웨이에 직접 import하지 않고 Worker 어댑터 뒤에 둔다.
- Worker가 준비되지 않았을 때 성공 상태를 반환하지 않는다.
- Object URL은 명시적인 소유 컴포넌트 또는 store가 한 번만 해제한다.
