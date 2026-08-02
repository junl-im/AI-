# SoriON AI 0.9.2 CI Hotfix 2 Result Report

작업 일시: 2026-08-02 KST

결과 버전: **0.9.2 CI Hotfix 2 · Stale Brand Asset Cleanup**

## 결과

- 이전 패치에서 삭제 지시만 남고 저장소에 잔존한 `public/sorion-icon.svg`를 실제 삭제 대상으로 고정했다.
- Windows·macOS·Linux에서 삭제와 규칙 검사를 함께 실행하는 적용 스크립트를 추가했다.
- 프로젝트 규칙 오류 메시지에 정확한 정리 명령을 표시해 같은 CI 실패의 재발을 막았다.
- SoriON을 엔진 모음이 아닌 한국어 음성 제작 오케스트레이터로 명문화했다.
- `/engines/catalog`에 TTS·복제·변환·STT·노이즈 제거·향상·Director의 채택 결정을 추가했다.
- CosyVoice 3·MeloTTS·Faster Whisper·DeepFilterNet3를 코어 후보로 고정했다.
- F5-TTS 공식 pretrained checkpoint는 비상업 조건 때문에 연구 전용으로 분류했다.
- Kokoro는 공식 한국어 기본 음성 부재로 자동 경로에서 제외했다.
- OpenVoice V2는 선택적 한국어 음색 변환, Seed-VC는 GPL 외부 플러그인으로 분리했다.
- 외부 LLM 없이 원고 용도·호흡·발음·속도·감정·엔진 요구를 계산하는 Rule Director를 추가했다.
- 설정 화면에서 무료 파이프라인과 채택 엔진을 읽기 전용으로 확인할 수 있게 했다.
- 엔진 blueprint 회귀 검사와 API 테스트를 추가했다.

## 다음 목표

무료 모델 온보딩, OpenVoice V2·Faster Whisper·DeepFilterNet3 Adapter, 한국어 자동 품질 검수와 전체 WAV 병합을 진행한다.
