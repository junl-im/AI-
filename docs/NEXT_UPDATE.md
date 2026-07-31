# NEXT UPDATE

## 목표 버전

`0.2.0 Mobile Voice Workspace`

## 목표

모바일에서 10초 안에 텍스트 음성 생성 작업을 시작할 수 있는 첫 실사용 워크스페이스를 완성한다.

## 예상 구현

- 모바일 한 화면 중심의 텍스트 입력 영역
- 한국어 음성 프리셋 카드
- 기본 설정과 Advanced 설정 분리
- 생성 상태, 실패, 재시도 UI
- 생성 결과 오디오 플레이어 셸
- WAV 다운로드 버튼과 파일명 규칙
- Mock 엔진과 실제 엔진의 상태 표시 분리
- 360px, 390px, 430px 모바일 폭 테스트

## 예상 변경 영역

- `src/pages/HomePage.tsx`
- `src/components/voice/`
- `src/tts/`
- `src/styles/`
- `services/api/app/engines/tts/`
- `docs/UI_GUIDE.md`
- `docs/API.md`
- 테스트 파일

## 선행 조건

- GitHub Pages `Deploy SoriON to GitHub Pages` 워크플로 성공 확인
- 실제 서비스 주소에서 `BUILD v0.1.5` 표시 확인
- 개발 PC에서 `npm install` 성공 확인
- 현재 CI와 Pages 배포의 웹 품질 검사 정상 실행 확인
- 첫 실제 한국어 TTS 엔진의 라이선스와 실행 환경 결정

## 위험 요소

- 무료 호스팅 환경에서는 GPU 모델을 직접 실행하기 어렵다.
- 모바일 브라우저의 자동 재생 제한을 고려해야 한다.
- 실제 음성 복제는 동의와 악용 방지 정책이 준비되기 전까지 연결하지 않는다.

## 이번 버전에서 넘기는 결정

- 결과 전달은 전체 ZIP과 덮어쓰기용 패치 ZIP을 항상 함께 제공한다.
- 모든 업데이트는 `HANDOVER.md`, `CHANGELOG.md`, 이 문서를 동시에 갱신한다.
- 프로젝트의 공식 대문 표기는 `곰같은여우 SoriON AI`를 유지한다.

- GitHub Pages는 소스 루트가 아니라 `/AI-/` base로 빌드한 `dist/`만 배포한다.
