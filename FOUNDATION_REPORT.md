# 곰같은여우 SoriON AI 0.4.0 구현 보고서

작성: 2026-07-31 13:22 KST  
버전: 0.4.0  
단계: Korean Voice Quality Lab

## 완료 범위

- 한국어 숫자·날짜·시각·금액·퍼센트·단위·영문 약어 전처리
- 긴 문장 자동 분할과 PCM WAV 병합
- 처리 시간·음원 길이·파일 크기·RTF 측정
- 엔진별 감정·속도·피치 지원 계약
- 모바일 품질 연구소 화면
- 엔진 사전 진단, 평가 문장, 전처리 미리보기, A/B 비교 API
- 평가 문장 14종
- 인수인계, 변경 이력, 다음 계획 갱신

## 검증

- FastAPI 테스트 23개 통과
- Linux eSpeak 실엔진으로 장문 2구간 생성·WAV 병합 확인
- Python compileall 통과
- WAV 병합 결과 RIFF/WAVE 유효성 확인
- 장문 병합 후 자식 임시 파일 정리 확인
- 프로젝트 500줄·SVG·비밀키 규칙 검사 통과
- 내부 TypeScript strict 검사와 TS/TSX 파서 검사 통과
- 최종 프로젝트 파일 167개

## 제한

현재 환경의 내부 npm 저장소에 `@tailwindcss/vite`가 없어 `npm install`, Vitest, ESLint, Vite production build는 실행하지 못했다. 일반 개발 PC 또는 GitHub Actions에서 웹 검사를 완료해야 한다.

## 산출물

- `SoriON-AI-0.4.0-full.zip`
- `SoriON-AI-0.3.0-to-0.4.0-patch.zip`
- `SoriON-AI-0.4.0-artifacts.sha256`
