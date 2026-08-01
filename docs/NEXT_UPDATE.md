# NEXT UPDATE

현재 기준: `0.9.1 Free-Only Local Runtime & Firebase Spark`

## 목표 버전

`0.9.2 Free Local Model Onboarding & Korean Benchmark`

## 방향

무료 사용자가 별도 유료 API 없이도 실제 한국어 AI 음질을 얻을 수 있도록 로컬 모델 준비 과정을
단순화하고, 유료급이라는 표현 대신 동일 원고의 측정 가능한 블라인드 평가로 품질을 증명한다.

## 1. 무료 로컬 모델 온보딩

- CosyVoice Worker 모델 존재·체크섬·라이선스 동의 검사
- GPU·CPU 환경별 자동 프로필과 메모리 요구량 안내
- 모델 다운로드는 명시적 사용자 실행으로만 시작하고 중단·재개 지원
- Worker readiness 실패 원인을 한 화면에서 자동 진단
- 모델·가중치·사용자 음성을 Git 저장소와 릴리스 ZIP에서 계속 제외

## 2. 한국어 품질 벤치마크

- 숫자·날짜·금액·단위·영문·고유명사·존댓말 평가 세트 확장
- 자연스러움·발음 정확도·문단 호흡·첫 음성 지연·실시간 배율 측정
- CosyVoice·Melo·System·Browser 결과의 익명 블라인드 비교
- 무료 엔진만으로 통과해야 하는 품질 게이트 정의

## 3. 결과물 완성

- 전체 프로젝트 WAV 병합과 다운로드
- 실패한 문장만 재생성하고 기존 완료 블록 재사용
- SSE 재연결의 Last-Event-ID와 장시간 작업 안정성 강화
- 모바일 화면 잠금·복귀 뒤 진행 상태와 재생 Queue 복원

## 4. 실기기 검증

- Android Chrome·iOS Safari·설치형 PWA
- Windows·macOS·Linux 무료 System Voice 차이 기록
- CPU 전용과 NVIDIA GPU 환경별 로컬 Worker 준비 시간 측정
