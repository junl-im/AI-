# QA REPORT - AI 쇼츠 제작 스튜디오 v0.6.0

## Summary

- Version: 0.6.0
- Patch: 결과물 품질 패치
- Command: `npm run check`
- Result: PASS

```text
AI Shorts Studio QA summary
  Passed: 34/34
  Failed: 0/34
```

## Covered

- JavaScript syntax check
- HTML anchor check
- External dependency smoke check
- UI/UX and bottom dock anchors
- Advanced editor anchors
- Caption pro anchors
- Output quality anchors
- Recommendation engine smoke
- Render capability smoke
- Caption/project service smoke
- Handoff/documentation smoke

## Notes

- 품질 패널 ID와 렌더러 토큰을 `qa/output_quality_smoke.js`로 검수했습니다.
- 안전영역 가이드는 미리보기 중심이며, 썸네일/내보내기에는 기본적으로 포함하지 않도록 앱에서 옵션을 분리했습니다.
