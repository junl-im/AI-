# QA REPORT - AI 쇼츠 제작 스튜디오 v0.8.0

## Summary

- Version: 0.8.0
- Patch: 파형 컷 마커 편집 패치
- Command: `npm run check`
- Result: PASS

```text
AI Shorts Studio QA summary
  Passed: 38/38
  Failed: 0/38
```

## Covered

- JavaScript syntax check
- HTML anchor check
- External dependency smoke check
- UI/UX and bottom dock anchors
- Advanced editor anchors
- Caption pro anchors
- Output quality anchors
- Auto cut detector smoke
- Cut marker overlay smoke
- Recommendation engine smoke
- Render capability smoke
- Caption/project service smoke
- Handoff/documentation smoke

## Notes

- `qa/cut_marker_smoke.js`로 파형 컷 마커 레이어, 시작/끝 컷 맞춤 버튼, 서비스 워커 캐시 등록을 검수했습니다.
- 컷 마커는 기존 `state.autoCuts.timeline`과 `state.autoCuts.silenceSegments`를 재사용합니다.
- 비트, 장면 전환, 무음 종료 마커는 파형 위 별도 오버레이로 표시됩니다.
- 마커 클릭은 재생 위치 이동을 기본으로 하며, 선택 구간 밖의 마커는 가까운 경계를 보정합니다.
- v0.7.0의 자막 적용/초기화 런타임 참조 문제도 현재 선택 추천 구간 기준으로 보정했습니다.
