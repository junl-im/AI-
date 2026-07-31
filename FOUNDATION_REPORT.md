# SoriON AI 0.5.5 API Lint & Engine Strategy Report

## 결과

GitHub Actions의 Python 3.10 Ruff 단계에서 발견된 E501 긴 줄 22건과 I001 import 정렬 2건을 수정했다. API 코드의 동작 계약은 유지하면서 줄바꿈과 import 순서만 정리했다.

SoriON의 엔진 방향도 공식 문서 기준으로 재정의했다. 주력 TTS와 제로샷 복제 후보는 Fun-CosyVoice 3, 복제 전문가용 보조 엔진은 GPT-SoVITS, 로컬 대체는 MeloTTS와 운영체제 음성으로 결정했다. Fish Audio S2는 상업 라이선스가 별도로 필요해 평가 전용으로 분류했다.

## 주요 변경

- Python 소스와 테스트의 100자 초과 줄 제거
- `app/main.py`와 Python 호환성 테스트의 import 블록 정렬
- 프로젝트 규칙 검사에 Python 100자 제한 추가
- `/api/v1/engines/strategy` 엔진 전략 API 추가
- `docs/ENGINE_STRATEGY.md` 추가
- CosyVoice 3를 차기 주력 엔진으로 결정
- GPT-SoVITS를 복제 전문가용 보조 엔진으로 결정
- MeloTTS를 주력 엔진이 아닌 로컬 대체 엔진으로 재분류
- Fish Audio S2를 라이선스 계약 전 평가 전용으로 분류

## 검증

- Python 전체 문법 컴파일 통과
- FastAPI 테스트 32개 통과
- Python 앱·테스트의 100자 초과 줄 0개
- 엔진 전략 API 회귀 테스트 통과
- 프로젝트 절대 규칙 검사 통과
- 모든 소스 파일 500줄 이하
- SVG, 비밀키, 런타임 음원, 캐시 미포함

## 제한

현재 작업 환경에는 Ruff 실행 파일과 외부 패키지 레지스트리 접근이 없어 공식 Ruff 바이너리 자체는 실행하지 못했다. GitHub Actions에서 Ruff와 Python 3.10 pytest를 최종 확인해야 한다.
