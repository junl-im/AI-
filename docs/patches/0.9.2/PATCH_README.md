# SoriON AI 0.9.2 덮어쓰기 패치

기준 버전: `0.9.1`
대상 버전: `0.9.2 Korean Voice Orchestrator Blueprint & Rule Director`

## 적용

1. 현재 저장소가 정확히 0.9.1인지 확인합니다.
2. `.git`, `.env`, 모델, 실행 DB와 사용자 음성을 백업합니다.
3. 패치 ZIP을 저장소 루트에 풀어 같은 파일을 덮어씁니다.
4. 이번 패치에서 삭제할 파일은 없습니다.
5. `npm run quality:rules`, `npm run quality:free-only`,
   `npm run quality:engine-blueprint`를 실행합니다.
6. GitHub Actions의 Web·API·Worker quality가 모두 통과한 뒤 배포합니다.

## 핵심 변경

- 목적에 따라 무료 엔진을 조합하는 한국어 음성 오케스트레이터 청사진
- 채택·선택·벤치마크·외부 플러그인·연구·제외 엔진 카탈로그 API
- F5-TTS pretrained model의 비상업 조건과 Kokoro 한국어 경계 명시
- OpenVoice V2 선택 Adapter, Seed-VC 독립 프로세스 플러그인 결정
- Faster Whisper·DeepFilterNet3·Rule Director 코어 채택
- 원고 용도·발음·호흡·속도·감정·엔진 요구를 계산하는 Rule Director API
- 설정 화면의 읽기 전용 오케스트레이터 설계 카드
- 연구 엔진이 무료 자동 경로로 들어오는 것을 차단하는 CI 검사

모델 가중치, Secret, 사용자 음성, `.git`, `node_modules`, 실행 DB와 캐시는 포함하지 않습니다.
