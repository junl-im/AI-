# NEXT UPDATE

현재 기준 버전: `0.6.4`

## 목표 버전

v0.7.0 CosyVoice Worker Streaming & Clone Execution

## 다음 예상 업데이트

- 별도 CosyVoice Worker 서비스와 health·readiness 계약
- GPU, CUDA, VRAM, 모델 경로와 모델 로딩 상태 진단
- 동의된 음성 프로필의 zero-shot speaker prompt 생성
- 실제 한국어 제로샷 목소리 복제 실행
- text-in·audio-out 스트리밍 조각 전달
- 첫 음성 지연 시간과 실시간 배율 측정
- Worker 작업 취소, 재연결, 장애 복구
- 실패한 문장 구간만 재시도
- 문장별 생성 리스트와 Worker 구간 진행률 연결
- 생성 완료 시 적응형 Linked Player Dock 자동 표시
- 공개 HTTPS FastAPI 배포 프로필과 인증 경계

## 0.6.4에서 넘기는 결정

- 생성 화면의 첫 훅은 #111·800, 보조 문장은 #7A7A7A·600으로 유지한다.
- 입력 카드는 생성 헤더에 32px 겹치고 보라·파랑 radial glow를 유지한다.
- 기본 입력 제한은 500자이며 빈 입력에서는 생성 CTA를 비활성화한다.
- 한국어 발음 보정 토글은 API `normalize_text`와 실제로 연결한다.
- 긴 문장 생성 결과는 문장별 리스트와 하나의 최종 WAV를 함께 제공한다.
- Dock 메뉴는 모든 스크롤 위치에서 페이지 상단으로 이동해야 한다.
- 음성이 없으면 플레이어를 숨기고, 준비되면 메뉴 위에 표시한다.
- 실제 모델이 없을 때 Demo 또는 샘플 준비를 복제 성공으로 표시하지 않는다.

## 선행 조건

- Web quality, API quality, Pages 배포가 모두 성공해야 한다.
- `/api/v1/connectivity`에서 API·저장소·CORS가 정상이어야 한다.
- 실제 모델과 코드·가중치 라이선스를 배포 전에 다시 확인한다.
- 원본 음성 샘플을 공개 URL로 노출하지 않는다.
- 공개 Worker에는 인증, 요청 제한, 감사 로그를 적용한다.
