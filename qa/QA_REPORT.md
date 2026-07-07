# QA REPORT - AI Shorts Studio v0.1.0

## 자동 QA

실행 명령:

```bash
npm run check
```

검수 항목:

- JS syntax check
- DOM anchor check
- 외부 CDN 의존성 없음 확인
- 추천 엔진 smoke test
- 렌더러 핵심 기능 토큰 확인
- 문서/HANDOFF 구성 확인

## 수동 QA 매트릭스

| 환경 | 업로드 | 분석 | 추천 카드 | 미리보기 | 내보내기 | 진단 복사 |
| --- | --- | --- | --- | --- | --- | --- |
| Chrome Desktop | 대기 | 대기 | 대기 | 대기 | 대기 | 대기 |
| Edge Desktop | 대기 | 대기 | 대기 | 대기 | 대기 | 대기 |
| Android Chrome | 대기 | 대기 | 대기 | 대기 | 대기 | 대기 |
| iOS Safari | 제한 가능 | 제한 가능 | 대기 | 제한 가능 | 제한 가능 | 대기 |
| Kakao/Instagram in-app | 제한 가능 | 제한 가능 | 대기 | 제한 가능 | 제한 가능 | 대기 |

## 핵심 확인 포인트

1. 파일 선택 후 파일명/용량 표시
2. 분석 완료 후 3개 이상의 후보 카드 표시
3. 후보 카드 선택 시 파형 하이라이트와 제목/해시태그 갱신
4. 영상 파일에서 중앙/상단/하단/블러 맞춤 프레임 변화 확인
5. 내보내기 실패 시 진단 JSON 복사 가능

## 알려진 제한

- 브라우저 코덱 지원에 따라 MP4 저장이 안 되고 WebM으로 저장될 수 있다.
- Safari/iOS는 MediaRecorder 및 captureStream 제한이 있을 수 있다.
- 비디오 오디오 디코딩 실패 시 fallback 분석으로 움직임/가상 에너지 기반 추천을 만든다.
