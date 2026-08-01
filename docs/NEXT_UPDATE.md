# NEXT UPDATE

현재 기준 버전: `0.7.2`

## 목표 버전

`0.7.3 GPU Deployment & Progressive Playback`

## 목표

- 실제 GPU 서버 배포 템플릿과 Secret 주입 예시
- CosyVoice 모델 설치·체크섬·로딩 진행률
- 첫 완성 문장부터 Dock에 조기 재생
- 나머지 문장을 생성하면서 순차 연결
- SSE 재연결 후 누락 segment 재조회
- 작업 상태 디스크 스냅샷과 Worker 재시작 복구
- prompt 캐시 생성·재사용·동의 철회 시 즉시 폐기
- MP3·M4A·WEBM·OGG 서버 디코딩과 2차 품질 검사
- 실제 GPU 한국어 자연스러움·유사도·지연 시간 벤치마크

## 완료 기준

1. Web·API·Worker CI가 오류와 경고 없이 통과한다.
2. Worker 재시작 뒤 진행 중 작업을 안전하게 실패 또는 복구 처리한다.
3. 첫 문장 완성 시 전체 작업 종료 전에도 Dock에서 재생할 수 있다.
4. 동의 철회 시 샘플·prompt cache·생성 작업 복사본이 함께 삭제된다.
5. 실제 GPU 환경의 음질·지연·VRAM 측정값을 문서화한다.
