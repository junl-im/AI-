# SoriON AI 0.9.1 덮어쓰기 패치

기준 버전: `0.9.0`
대상 버전: `0.9.1 Free-Only Local Runtime & Firebase Spark`

## 적용

1. 현재 저장소가 정확히 0.9.0인지 확인합니다.
2. `.git`, `.env`, 모델, 실행 DB와 사용자 음성을 백업합니다.
3. 패치 ZIP을 저장소 루트에 풀어 같은 파일을 덮어씁니다.
4. `docs/patches/0.9.1/DELETE_LIST.txt`의 7개 파일을 삭제합니다.
5. `npm run quality:rules`와 `npm run quality:free-only`를 실행합니다.
6. GitHub Actions의 Web·API·Worker quality가 모두 통과한 뒤 배포합니다.

## 핵심 변경

- 결제 계정이 필요한 일반 TTS Adapter와 Secret 설정 완전 제거
- CosyVoice·MeloTTS·System Voice·Browser Speech 무료 전용 구조
- Firebase Hosting Spark와 GitHub Pages의 정적 Web 경계
- 데스크톱 정적 Web에서 localhost 무료 API 자동 탐색
- 모바일 정적 Web의 Browser Speech 자동 안전망
- 허용 목록 밖 Adapter와 서버형 Firebase 설정을 차단하는 CI 검사
- `npm run dev:free`와 Windows 한 번 실행 스크립트

모델 가중치, Secret, 사용자 음성, `.git`, `node_modules`, 실행 DB와 캐시는 포함하지 않습니다.
