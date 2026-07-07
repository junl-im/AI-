# HANDOFF - AI Shorts Studio v0.1.0

## 현재 상태

- 정적 웹앱으로 실행 가능
- 외부 CDN 의존성 없음
- 오디오/비디오 파일 로컬 분석 가능
- 추천 카드 및 파형 표시 가능
- 9:16 canvas preview 가능
- MediaRecorder 기반 export 가능
- QA smoke test 통과 기준 구성 완료

## 시작 방법

```bash
npm run serve
```

브라우저에서 `http://localhost:8080` 접속.

## 검수 순서

1. MP3 또는 WAV 파일 업로드
2. `분석하고 추천받기` 클릭
3. 추천 카드 3개 이상 표시 확인
4. 카드 클릭 시 파형 하이라이트 변경 확인
5. `선택 구간 미리보기` 클릭
6. 오디오/비디오 재생 종료가 선택 구간 끝에서 멈추는지 확인
7. `세로 쇼츠 내보내기` 클릭
8. 다운로드 파일 생성 확인
9. `진단 복사` 버튼으로 JSON 복사 확인

## 알려진 제한

- 브라우저에 따라 MP4 대신 WebM으로 저장된다.
- iOS Safari에서는 MediaRecorder와 captureStream 지원이 제한될 수 있다.
- 매우 긴 4K 영상은 브라우저 메모리 한계로 분석/내보내기가 느릴 수 있다.
- 비디오의 오디오 트랙 디코딩은 브라우저 코덱 지원에 따라 실패할 수 있다. 실패 시 비디오 움직임 분석 중심으로 추천한다.

## 배포 메모

- GitHub Pages에 그대로 올릴 수 있다.
- Firebase Hosting에도 정적 파일로 배포 가능하다.
- `.nojekyll` 포함.
- Service Worker 캐시 버전은 `sw.js`와 README의 cache key를 같이 갱신한다.

## 다음 작업 우선순위

1. 추천 구간 드래그 조절 UI
2. SRT/VTT 자막 업로드
3. 썸네일 저장
4. 모바일 Safari 다운로드 우회 플로우 보강
5. ffmpeg.wasm 선택형 고급 내보내기 모듈 추가
