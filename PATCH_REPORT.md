# Patch Report v1.6.24

## 변경
- 겹치는 두 화자의 얼굴을 상·하 2분할로 동시에 유지하는 `speaker-dual-face` 구성 추가
- 주 화자·보조 화자 역할과 자동 우선순위 정렬 추가
- 같은 시간 범위의 보조 화자 cue 직접 추가 기능
- 동일 화자 라벨의 얼굴 연결·고정·역할 일괄 교정
- cue별 연결 신뢰도 이력 최대 12건 보존 및 최근 이력 UI 표시
- 프로젝트 import/export allowlist에 `priority`, `confidenceHistory` 추가
- 수동 keyframe과 전역 주 피사체 고정은 dual 화자 화면보다 계속 우선

## 검증
- 신규 overlap composition·dual renderer·bulk history 회귀 통과
- 실제 Chromium 20초 영상에서 dual face, 역할 순서, 연결 이력 통과
- 실제 30분 1080p 스마트 리프레임 집중 감사 통과
- 현재 버전 5회 실미디어 heap/Object URL 감사 통과
- Chromium browser/renderer/GPU 프로세스 메모리 감사 통과
- 서비스워커 135개 자산 무결성 검사 통과
- 전체 등록 회귀 **281/281 통과, 실패 0건**
- v1.6.23 대비 변경·추가 **88개**, 삭제 0개
- 최종 배포 프로젝트 **1035개 파일**
