# NEXT UPDATE

Current baseline: 0.11.37 · Intelligent Studio & Prosody Director

## 목표 버전
0.11.38 · Verified Long-form Voices

1. 승인된 5성우 reference WAV와 사용 권리·CosyVoice 모델을 확보한 뒤 동일 한국어 대본으로 실제 생성하고 장문 호흡·숫자·영문·종결을 청취 비교합니다. 낮은 점수는 READY로 올리지 않습니다.
2. 성우별 분할·속도·여백은 실측 결과로 조정합니다. 새 정책의 cache 무효화와 재청취를 유지합니다.
3. 큰 파일은 서버 peaks 또는 점진 파형으로 메모리·대기 시간을 줄이고 기존 STT 원문 대조를 검토합니다.
4. 초기 main JS 추가 분할과 모바일 실기기·키보드 사용성을 점검합니다.

예상 영역: prosody_director, voice preset/reference·Listening QA, waveform/LinkedPlayerDock, 페이지·Vite 청크.
선행 조건: 승인된 실제 음성 자산·사용 권리, 모델·실행 환경, 현재 CI green. 실제 음질을 합성 테스트 톤이나 자동 점수만으로 인증하지 않습니다.
유지 결정: 대본 기반 제안은 로컬 규칙이며 자동 생성·성우 변경 없음. 기본 편집/프로 패널 분리, reduced motion, 유료 API 자동 연결 없음, 자동 음성 업로드 없음, 측정 전 동시성 확대 없음.
