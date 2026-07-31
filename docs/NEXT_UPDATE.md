# NEXT UPDATE

현재 기준 버전: `0.6.3`

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
- 생성 완료 시 적응형 Linked Player Dock 자동 표시
- 공개 HTTPS FastAPI 배포 프로필과 인증 경계

## 0.6.3에서 넘기는 결정

- Dock은 기존 앱의 어두운 배경 톤을 유지한다.
- 음성이 없으면 메뉴 Dock만 표시한다.
- 음성이 준비되면 플레이어를 메뉴 위에 표시한다.
- 모바일과 PC 모두 플레이어와 메뉴의 세로 순서를 동일하게 유지한다.
- 플레이어 유무에 따라 본문 하단 안전 여백을 자동 조절한다.
- 실제 모델이 없을 때 Demo 또는 샘플 준비를 복제 성공으로 표시하지 않는다.

## 선행 조건

- Web quality, API quality, Pages 배포가 모두 성공해야 한다.
- `/api/v1/connectivity`에서 API·저장소·CORS가 정상이어야 한다.
- 실제 모델과 코드·가중치 라이선스를 배포 전에 다시 확인한다.
- 원본 음성 샘플을 공개 URL로 노출하지 않는다.
- 공개 Worker에는 인증, 요청 제한, 감사 로그를 적용한다.
