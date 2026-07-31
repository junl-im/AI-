# SoriON AI 0.5.4 setup-uv Action Pin Report

## 목적

GitHub Actions의 API quality Job이 테스트 실행 전 `astral-sh/setup-uv@v8`을 찾지 못해 종료되는 문제를 수정한다. 다음 기능 개발 전에 CI 준비 단계의 재현성과 신뢰성을 확보한다.

## 확인된 원인

`astral-sh/setup-uv` 저장소에는 실행 시점에 해석 가능한 `v8` 메이저 태그가 없었다. GitHub Actions는 workflow를 준비하면서 Action ref를 먼저 다운로드하므로, Ruff·pytest·Python 코드와 무관하게 Job이 3초 만에 실패했다.

## 수정 내용

- `astral-sh/setup-uv@v8` 제거
- 공식 setup-uv v8.1.0 불변 커밋 SHA로 고정
  - `08807647e7069bb48b6ef5acd8ec9567f424441b`
- 설치할 uv 실행 파일을 `0.11.32`로 고정
- Python 3.10 설치는 `actions/setup-python@v6`에 유지
- setup-uv는 uv 설치, API 작업 디렉터리 탐색, 캐시만 담당
- 프로젝트 규칙에 부동 setup-uv 태그 금지 검사 추가

## 검증 결과

- 프로젝트 규칙 검사: 통과
- setup-uv 공식 SHA 존재 검사: 통과
- uv 0.11.32 고정 검사: 통과
- `setup-uv@v8` 잔존 검사: 통과
- Python 전체 문법 컴파일: 통과
- FastAPI 테스트: 31개 통과 (현재 제공 Python 런타임)
- 모든 소스 파일 500줄 이하: 통과
- SVG·비밀키·런타임 산출물 검사: 통과
- 패치 적용본과 전체본 파일 동등성: 통과
- 전체 프로젝트 파일: 198개
- 패치 변경·추가 파일: 26개
- ZIP 무결성: 통과

## 적용 후 확인

```text
SoriON CI & Pages
├─ Web quality
├─ API quality · Python 3.10
└─ Deploy GitHub Pages
```

API 로그의 `Set up uv` 단계가 정상 완료되고 다음 단계인 Python 버전 확인, 의존성 동기화, Ruff, pytest가 순서대로 실행돼야 한다.

## 현재 환경 제한

현재 컨테이너는 CPython 3.10 다운로드 주소를 DNS로 조회하지 못해 `uv run --python 3.10` 실기동은 실행하지 못했다. 실제 GitHub runner에서 Action 다운로드와 Python 3.10 테스트 성공을 최종 확인해야 한다.

## 다음 단계

CI 전체 성공을 확인한 뒤 `0.6.0 Mobile Voice Clone Foundation`으로 진행한다.
