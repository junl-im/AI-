# QA REPORT - AI 쇼츠 제작 스튜디오 v0.8.1

## Summary

- Version: 0.8.1
- Patch: Lean Dock UI/UX 성능 패치
- Command: `npm run check`
- Result: PASS

```text
AI Shorts Studio QA summary
  Passed: 39/39
  Failed: 0/39
```

## Covered

- JavaScript syntax check
- HTML anchor check
- External dependency smoke check
- Lean two-button bottom dock anchors
- Dock polling removal and RAF sync guardrails
- Preview still RAF batching guardrail
- CSS containment/content-visibility guardrail
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

- 하단 Dock은 📂 파일 열기와 ⚡ 분석하기 두 개만 표시됩니다.
- 두 Dock 버튼은 50:50 반반 배치로 크게 표시됩니다.
- 기존 추천/편집/미리보기/썸네일/내보내기 Dock 바로가기는 제거하고 화면 내부 버튼으로 유지했습니다.
- `bottom-dock.js`의 polling `setInterval`을 제거했습니다.
- Dock 동기화와 미리보기 정지 프레임 렌더링은 `requestAnimationFrame`으로 배치합니다.
- CSS containment 규칙을 추가해 파일 로드 후 레이아웃 재계산 부담을 줄였습니다.
