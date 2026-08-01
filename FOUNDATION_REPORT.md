# SoriON AI 0.9.1 Result Report

작업 일시: 2026-08-02 KST

결과 버전: **0.9.1 Free-Only Local Runtime & Firebase Spark**

## 결과

- 결제 계정이 필요한 음성 Adapter와 관련 설정·테스트·문서를 현재 제품에서 제거했다.
- 서버 일반 TTS 허용 목록을 CosyVoice, MeloTTS, System Voice, Mock으로 고정했다.
- 비용 정책 전환 코드와 공개 API 비용 등급 필드를 제거했다.
- Firebase Hosting Spark와 GitHub Pages를 정적 Web 전용으로 명시했다.
- 데스크톱 정적 Web이 사용자 PC의 무료 로컬 API를 자동 탐색하도록 보강했다.
- 모바일 정적 Web은 접근 불가능한 localhost를 검사하지 않고 Browser Speech를 사용한다.
- CI에 무료 전용 경계 검사를 추가해 허용 목록 밖 Adapter와 서버형 Firebase 설정을 차단한다.
- Windows 한 번 실행 파일과 `npm run dev:free` 로컬 런타임을 추가했다.

## 다음 목표

무료 CosyVoice 모델 온보딩, 한국어 발음 벤치마크, 프로젝트 WAV 병합과 실패 문장 재생성을 진행한다.
