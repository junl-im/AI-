# PROJECT NOTES - AI Shorts Studio v0.4.0

## 제작 방향

기존 FoxBear AI Mastering Studio의 장점인 “정적 웹앱 + 로컬 분석 + 추천 설명 + 다운로드 진단 + QA 문서화” 구조를 쇼츠 제작 흐름으로 재해석했다.

v0.4.0에서는 편집 UX를 한 단계 올렸다. v0.3.0에서 버튼 동선과 모바일 액션바를 정리했다면, 이번 버전은 사용자가 추천 구간을 실제 편집하는 순간에 필요한 드래그 핸들, 템플릿, 일괄 저장을 추가했다.

## 핵심 원칙

1. 무료 기능만 사용한다.
2. 사용자의 원본 파일은 서버로 업로드하지 않는다.
3. 브라우저가 지원하는 범위 안에서 최대한 상용 앱처럼 보이게 만든다.
4. 분석 결과는 점수만 보여주지 않고 이유를 설명한다.
5. 모바일/인앱 브라우저 다운로드 실패를 추측하지 않도록 진단 복사를 둔다.
6. 프로젝트 저장은 원본 미디어를 포함하지 않는 안전한 JSON 방식으로 둔다.
7. 반복 클릭이 필요한 버튼은 한 화면 안에서 다시 찾지 않아도 되게 한다.
8. 편집은 숫자 입력, 버튼, 드래그를 모두 지원해 사용자 숙련도에 따라 선택하게 한다.

## v0.4.0에서 추가한 것

- `assets/css/advanced-editor.css`: 드래그 선택 구간, 핸들, 배치 내보내기 UI 스타일
- `src/ui/range-drag-controls.js`: 파형 위 드래그 핸들, 현재 재생 위치 맞춤
- `qa/advanced_editor_smoke.js`: 고급 편집 앵커/렌더러 훅 검수
- 파형 위 선택 구간 전체 이동
- 시작/끝 드래그 핸들
- 썸네일 템플릿 4종
- 선택 템플릿을 preview/export/thumbnail에 반영
- 추천 후보 일괄 내보내기
- 일괄 내보내기 파일명 규칙

## v0.4.0에서 유지한 것

- 로컬 오디오/영상 분석
- 추천 점수와 이유 카드
- 파형 및 타임라인 표시
- 세로 미리보기 캔버스
- 수동 구간 조절
- 1초 미세 조절 버튼
- 자막 파서/붙여넣기/fallback 분할
- 썸네일 PNG 저장
- 프로젝트 JSON 저장/불러오기
- MediaRecorder 기반 내보내기
- 히어로 빠른 시작/작업 도크/모바일 액션바

## v0.4.0에서 일부러 제외한 것

- 유료 AI API 연동
- 클라우드 렌더링
- 완전 자동 음성 인식
- 얼굴 추적 자동 크롭
- ffmpeg.wasm 번들 포함
- 서버 업로드/회원 기능
- ZIP으로 일괄 내보내기 묶기

## 다음 버전 후보

### v0.5.0

- 자막 폰트 크기/위치/색상 상세 프리셋
- 자동 썸네일 후보 여러 장 추천
- 쇼츠 제목/해시태그 룰 엔진 강화
- 모바일 Safari 다운로드 우회 플로우
- 프로젝트 히스토리/되돌리기

### v0.6.0

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
- `src/render/vertical-renderer.js`는 preview/export canvas 렌더링, 자막 오버레이, 썸네일 템플릿 크롬을 담당한다.
- `src/ui/ux-controls.js`는 기존 버튼을 직접 대체하지 않고 미러링해 기존 안정성을 유지한다.
- `src/ui/range-drag-controls.js`는 앱 내부 함수를 직접 재작성하지 않고 입력값과 적용 버튼을 통해 구간 변경을 전달한다.
- `src/download/download-service.js`는 저장, 공유, 진단 스냅샷을 담당한다.
