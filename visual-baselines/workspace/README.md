# Workspace visual baseline

`npm run quality:visual-layout:approve`를 신뢰할 수 있는 동일 Chromium runner에서 실행하면
1024x900, 1280x900, 1440x900 승인 PNG와 `manifest.json`이 이 폴더에 생성됩니다.

일반 `npm run quality:visual-layout`은 승인 PNG가 있으면 픽셀 비교를 수행합니다.
기본 허용치는 픽셀당 채널 차이 24 초과인 픽셀이 전체의 0.5% 이하이며,
`SORION_VISUAL_MAX_DIFF_RATIO`, `SORION_VISUAL_CHANNEL_THRESHOLD`로 조정할 수 있습니다.

승인 PNG가 아직 없을 때는 DOM 레이아웃 회귀 검사와 후보 PNG 생성을 계속 수행합니다.
`--require-baseline` 또는 `SORION_VISUAL_BASELINE_REQUIRED=1`을 사용하면 기준선 누락도 실패로 처리합니다.
