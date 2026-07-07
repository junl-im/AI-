# QA REPORT - AI 쇼츠 제작 스튜디오 v0.7.0

## Summary

- Version: 0.7.0
- Patch: 자동 컷 편집 패치
- Command: `npm run check`
- Result: PASS

```text
AI Shorts Studio QA summary
  Passed: 36/36
  Failed: 0/36
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
- Recommendation engine smoke
- Render capability smoke
- Caption/project service smoke
- Handoff/documentation smoke

## Notes

- 자동 컷 패널 ID와 앱 연결 토큰을 `qa/auto_cut_smoke.js`로 검수했습니다.
- 자동 컷은 기존 오디오 분석 프레임과 영상 모션 프레임을 재사용하며 외부 API나 서버 업로드를 사용하지 않습니다.
- 무음, 비트, 장면 전환 컷 후보는 추천 카드 점수 보정과 선택/전체 후보 자동 보정에 반영됩니다.
