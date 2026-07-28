# AI Shorts Studio v1.6.24 정밀 분석 보고서

## 1. 시스템
정적 PWA·서비스워커·IndexedDB 분석 캐시·localStorage 진단 구조를 유지합니다. 이번 변경은 speaker-directed smart-reframe의 겹침 cue 선택과 렌더 구성에 집중했습니다.

## 2. 기능
- 완전 겹침 발화에 보조 화자 cue 추가
- cue별 주 화자·보조 화자 역할 지정
- 서로 다른 두 얼굴을 상·하 pane에 동시에 유지
- 동일 화자 라벨 구간 일괄 얼굴 교정
- 최근 연결 신뢰도 변화 표시
- 기존 시간·라벨·삭제·수동 고정 편집 유지

## 3. 엔진
`smart-reframe-engine.js`는 현재 시각에 활성인 모든 cue를 역할과 신뢰도로 정렬합니다. 서로 다른 subject가 두 명 이상이면 `speaker-dual-face` focus와 두 subject point를 반환합니다. 수동 crop keyframe과 전역 주 피사체 pin은 기존처럼 가장 높은 우선순위를 유지합니다.

## 4. 렌더
`vertical-renderer.js`는 dual focus에서 흐린 배경 위에 주 화자를 위 pane, 보조 화자를 아래 pane에 각각 독립 crop합니다. 단일 화자와 모션 fallback은 기존 crop 경로를 그대로 사용합니다.

## 5. 문제와 개선
- 기존 단일 crop은 화면 양쪽의 동시 화자 중 한 명을 잃을 수 있었습니다.
- cue별 역할이 없어 자동 신뢰도만으로 화면 순서가 바뀔 수 있었습니다.
- 수동 얼굴 교정을 동일 화자의 모든 구간에 반복 적용해야 했습니다.
- 연결 신뢰도 변화가 마지막 값 하나로만 표시됐습니다.

이를 dual pane, 역할 metadata, 일괄 교정, bounded confidence history로 개선했습니다.

## 6. 성능·수명주기
직접 시작 스크립트는 49개를 유지합니다. dual pane은 겹침 cue가 실제로 두 얼굴에 연결된 프레임에서만 활성화됩니다. 별도 timer·RAF·Object URL을 만들지 않으며 기존 Preview Controller와 Render Queue 소유권을 유지합니다.

## 7. 검증
- 전체 QA 281/281 통과, 실패 0건
- 실제 Chromium dual speaker flow 통과
- 5회 heap `5.103 → 5.618MiB`
- process RSS `769.519 → 846.660MiB`, JS heap slope `0.0052MiB/cycle`
- 30분 1080p 집중 감사 통과
- 서비스워커 135개 자산 무결성 통과
- v1.6.23 대비 변경·추가 88개, 삭제 0개
- 최종 배포 파일 1035개

## 8. 남은 제한
- 3명 이상 동시 화자는 상위 두 얼굴만 표시합니다.
- dual pane은 상·하 50:50 고정입니다.
- 실제 Safari·Samsung Internet 모바일 기기 검증이 남아 있습니다.
