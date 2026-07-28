# PROJECT NOTES v1.6.30

- `speakerCue.energy`는 cue 시간 범위의 로컬 `audioAnalysis.frames[].rmsNorm` 평균입니다.
- `speakerLayout.gridPaging`은 `rotate`, `priority`, `energy`, `manual`입니다.
- energy 정책은 주 화자를 고정하고 보조 화자를 에너지 순으로 즉시 선택합니다.
- manual 정책은 최대 12개 페이지, 페이지당 최대 4개 subject ID를 저장합니다.
- `gridTransition`은 `none`, `fade`, `slide`이며 `gridTransitionMs`는 120~1200ms입니다.
- rotate/manual 전환은 이전 page와 진행률을 focus에 포함합니다.
- energy/priority는 즉시 결정을 우선하며 지연 전환을 적용하지 않습니다.
- 선택 cue의 현재 grid crop은 bounded bulk patch로 일괄 적용할 수 있습니다.
- renderer는 신규 timer 없이 media timestamp로 transition을 계산합니다.
- 직접 crop keyframe과 전역 피사체 고정은 grid보다 우선합니다.
- 전체 QA 300/300, 배포 파일 1173개, v1.6.29 대비 변경·추가 49개입니다.
