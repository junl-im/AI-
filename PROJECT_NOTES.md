# PROJECT NOTES - AI Shorts Studio v0.1.0

## 제작 방향

기존 FoxBear AI Mastering Studio의 장점인 “정적 웹앱 + 로컬 분석 + 추천 설명 + 다운로드 진단 + QA 문서화” 구조를 쇼츠 제작 흐름으로 재해석했다.

## 핵심 원칙

1. 무료 기능만 사용한다.
2. 사용자의 원본 파일은 서버로 업로드하지 않는다.
3. 브라우저가 지원하는 범위 안에서 최대한 상용 앱처럼 보이게 만든다.
4. 분석 결과는 점수만 보여주지 않고 이유를 설명한다.
5. 모바일/인앱 브라우저 다운로드 실패를 추측하지 않도록 진단 복사를 둔다.

## v0.1.0에서 일부러 제외한 것

- 유료 AI API 연동
- 클라우드 렌더링
- 완전 자동 음성 인식
- 얼굴 추적 자동 크롭
- ffmpeg.wasm 번들 포함
- 서버 업로드/회원 기능

## 다음 버전 후보

### v0.2.0

- SRT/VTT 자막 업로드
- 텍스트 자막 스타일러
- 추천 구간 수동 미세 조정 핸들
- 영상 썸네일 캡처
- WebCodecs 지원 브라우저 최적화

### v0.3.0

- MediaPipe 기반 얼굴/인물 중심 크롭 선택 기능
- Whisper.cpp 또는 Transformers.js 기반 선택형 로컬 음성 인식 실험
- 여러 후보 일괄 내보내기
- CapCut 느낌의 템플릿 프리셋

## 기술 메모

- `src/workers/highlight-analysis.worker.js`는 오디오 채널 데이터를 받아 창 단위 RMS/Peak/Transient/ZCR를 계산한다.
- `src/recommendation/shorts-recommendation-engine.js`는 분석 프레임과 선택 길이를 기반으로 후보를 만든다.
- `src/analysis/video-motion-analyzer.js`는 비디오 파일일 때 canvas 샘플링으로 움직임 점수를 계산한다.
- `src/render/vertical-renderer.js`는 preview/export canvas 렌더링을 담당한다.
- `src/download/download-service.js`는 저장, 공유, 진단 스냅샷을 담당한다.
