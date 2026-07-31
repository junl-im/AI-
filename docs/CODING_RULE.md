# CODING RULE

## 파일과 함수

- 소스 파일은 500줄 이하
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

이 검사는 500줄 제한, SVG, 대표적인 비밀키 패턴을 검사한다.

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

## 최소 런타임 호환성

- API의 지원 최소 버전은 Python 3.10이다.
- 표준 라이브러리 기능은 `requires-python` 하한에서 실제 import 가능한지 확인한다.
- UTC 시간대는 Python 3.10과 호환되는 `datetime.timezone.utc`를 사용한다.
- Vitest는 전역 API 사용 여부와 무관하게 `afterEach(cleanup)`으로 DOM을 정리한다.
