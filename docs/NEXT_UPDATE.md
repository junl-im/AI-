# NEXT UPDATE

현재 기준 버전: `0.7.0`

## 목표 버전

v0.7.1 Production CosyVoice Adapter & API Security

## 다음 예상 업데이트

- 실제 GPU 서버 설치 자동 진단과 CosyVoice 의존성 설치 가이드
- Worker 모델 다운로드·체크섬·로딩 진행률
- API↔Worker 서비스 토큰과 요청 서명
- 사용자별 요청 제한, 동시 작업 제한, 감사 이벤트
- SSE 자동 재연결과 마지막 이벤트 ID 복구
- 완료된 문장 구간부터 Dock에 순차 재생하는 progressive playback
- MP3·M4A·WEBM·OGG 서버 디코딩과 2차 품질 검사
- speaker prompt 캐시와 동의 철회 시 즉시 폐기
- Worker 재시작 뒤 작업 상태 복구
- 실제 GPU 환경의 한국어 음질·지연·VRAM 벤치마크

## 0.7.0에서 넘기는 결정

- `/health`와 `/ready`를 반드시 분리한다.
- adapter 또는 모델이 없으면 작업 생성은 503이며 성공으로 표시하지 않는다.
- FastAPI 게이트웨이는 torch와 CosyVoice를 직접 import하지 않는다.
- 원본 음성은 공개 조회 API로 제공하지 않는다.
- 작업은 문장별로 생성하고 실패·취소 구간만 재시도한다.
- 최종 음성은 완료 후 Linked Player Dock에 자동 연결한다.
- 모델 가중치와 대형 AI 의존성은 일반 웹 릴리스 ZIP에 포함하지 않는다.

## 선행 조건

- Web, API, Worker quality가 모두 성공해야 한다.
- 실제 GPU 서버에서 `/ready`가 `ready`여야 한다.
- 공개 배포 전에 API와 Worker 사이 인증을 적용해야 한다.
- 한국어 샘플과 생성 결과의 사용 권한·고지 정책을 검토해야 한다.
