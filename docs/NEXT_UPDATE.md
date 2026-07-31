# NEXT UPDATE

현재 기준 버전: `0.6.1`

## 목표 버전

v0.7.0 CosyVoice Worker Streaming & Clone Execution

## 다음 예상 업데이트

- 별도 CosyVoice Worker 서비스와 health 계약
- 모델 경로, GPU, CUDA, VRAM 사전 진단
- 동의된 프로필의 제로샷 speaker prompt 준비
- TTS와 복제 작업의 스트리밍 음성 조각 전달
- 첫 음성 지연 시간과 실시간 배율 측정
- Worker 작업 취소와 장애 복구
- 실패 구간만 재시도
- 복제 결과에 AI 합성 표시와 프로필 출처 연결
- MP3, M4A, WEBM, OGG 서버 재분석
- Dock 큐의 프로젝트 세션 저장과 복구

## 0.6.1에서 넘기는 결정

- 배너 카피 테스트는 현재 화면 문구와 함께 변경해야 한다.
- Blob 기반 WAV 테스트는 JSDOM 메서드 존재 여부에 의존하지 않는다.
- Web quality가 다시 초록색이 되기 전에는 0.7.0 기능을 병합하지 않는다.

## 선행 조건

- Web quality, API quality, Pages 배포가 모두 성공해야 한다.
- 실제 모델과 코드의 라이선스 문서를 배포 전에 다시 확인한다.
- GPU가 없는 개발 환경에서는 Worker mock과 계약 테스트만 실행한다.
- 원본 샘플을 공개 URL로 노출하지 않는다.
