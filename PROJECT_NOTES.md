# PROJECT NOTES - AI Shorts Studio v0.2.0

## 제작 방향

기존 FoxBear AI Mastering Studio의 장점인 “정적 웹앱 + 로컬 분석 + 추천 설명 + 다운로드 진단 + QA 문서화” 구조를 쇼츠 제작 흐름으로 재해석했다.

v0.2.0에서는 추천 결과를 단순히 고르는 수준에서 끝내지 않고, 사용자가 실제 쇼츠 제작 과정에서 꼭 만지는 항목인 구간 조절, 자막, 썸네일, 프로젝트 저장을 추가했다.

## 핵심 원칙

1. 무료 기능만 사용한다.
2. 사용자의 원본 파일은 서버로 업로드하지 않는다.
3. 브라우저가 지원하는 범위 안에서 최대한 상용 앱처럼 보이게 만든다.
4. 분석 결과는 점수만 보여주지 않고 이유를 설명한다.
5. 모바일/인앱 브라우저 다운로드 실패를 추측하지 않도록 진단 복사를 둔다.
6. 프로젝트 저장은 원본 미디어를 포함하지 않는 안전한 JSON 방식으로 둔다.

## v0.2.0에서 추가한 것

- 추천 구간 수동 미세 조정
- SRT/VTT 자막 파서
- 자막 직접 붙여넣기
- 타임코드 없는 텍스트의 빠른 자막 분할 fallback
- 자막 스타일 3종
- 자막 싱크 보정
- 썸네일 PNG 저장
- 프로젝트 JSON 저장/불러오기

## v0.2.0에서 일부러 제외한 것

- 유료 AI API 연동
- 클라우드 렌더링
- 완전 자동 음성 인식
- 얼굴 추적 자동 크롭
- ffmpeg.wasm 번들 포함
- 서버 업로드/회원 기능

## 다음 버전 후보

### v0.3.0

- 추천 구간 드래그 핸들 UI
- 후보 여러 개 일괄 내보내기
- 자막 스타일 상세 편집
- 썸네일 템플릿 프리셋
- 모바일 Safari 다운로드 우회 플로우

### v0.4.0

- MediaPipe 기반 얼굴/인물 중심 크롭 선택 기능
- Whisper.cpp 또는 Transformers.js 기반 선택형 로컬 음성 인식 실험
- WebCodecs 지원 브라우저 최적화
- ffmpeg.wasm 선택형 고급 내보내기 모듈
- CapCut 느낌의 템플릿 프리셋

## 기술 메모

- `src/workers/highlight-analysis.worker.js`는 오디오 채널 데이터를 받아 창 단위 RMS/Peak/Transient/ZCR를 계산한다.
- `src/recommendation/shorts-recommendation-engine.js`는 분석 프레임과 선택 길이를 기반으로 후보를 만든다.
- `src/analysis/video-motion-analyzer.js`는 비디오 파일일 때 canvas 샘플링으로 움직임 점수를 계산한다.
- `src/caption/caption-service.js`는 SRT/VTT 파싱, 빠른 자막 분할, 활성 자막 탐색을 담당한다.
- `src/project/project-service.js`는 프로젝트 JSON 저장/복원을 담당한다.
- `src/render/vertical-renderer.js`는 preview/export canvas 렌더링과 자막 오버레이를 담당한다.
- `src/download/download-service.js`는 저장, 공유, 진단 스냅샷을 담당한다.
