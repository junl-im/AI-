# NEXT UPDATE

현재 기준: `0.8.9 Unified Product Shell & Korean Neural Engine Mesh`

## 목표 버전

`0.9.0 Progressive Korean Voice Streaming`

## 방향

브라우저 대체 음성으로 공개 Web의 기본 재생은 보장했지만, 제품 목표는 자연스러운 한국어 AI
음성과 다운로드 가능한 결과입니다. 다음 패치는 실제 공개 HTTPS API와 AI Worker를 배포 가능한
형태로 완성하고 첫 문장부터 재생하는 스트리밍 체감을 강화합니다.

## 1. 실제 공개 AI 엔진

- 공개 HTTPS FastAPI 다중 리전 배포 템플릿과 health-based routing
- CosyVoice·Premium Cloud Adapter의 실제 운영 자격 증명과 비용·quota 모니터링
- GPU Worker 모델·CUDA·VRAM readiness
- 브라우저 음성과 AI 엔진의 UI·데이터 구분 유지
- API URL 누락을 배포 전에 명확히 차단

## 2. 한국어 장문 품질

- 숫자·날짜·단위·영문 혼용·고유명사 평가 세트
- 문단 호흡과 문장 끝 억양 평가
- 실패한 문장 구간만 재생성
- System, Browser, CosyVoice 결과 블라인드 비교

## 3. 스트리밍과 결과물

- SSE 문장별 진행률
- 첫 문장 완성 즉시 Progressive Playback
- 전체 프로젝트 WAV 병합·다운로드
- 생성 순서와 재생 Queue 순서 동기화

## 4. 실기기 검증

- Android Chrome Web Speech 재생
- iOS Safari·설치형 PWA 재생과 백그라운드 복귀
- API 전환 중 브라우저 음성 Queue 안전성
