# QA REPORT - AI Shorts Studio v0.9.5

## Summary

- Version: v0.9.5
- Patch theme: HyperConnect flow cleanup, duplicate recommendation button removal, smoother selection-to-preview workflow
- Result: Passed 59/59
- Failed: 0/59

## Verified

- Top duplicate `flowRecommendBtn` is removed from the UI.
- Only one visible recommendation generation button remains in the recommendation tab.
- File open still triggers automatic analysis.
- Analysis completion leads the user to the recommendation step.
- Recommendation cards include a clear `선택해서 미리보기` CTA.
- Candidate selection activates the preview flow.
- Header uses left version / right `Design by 곰같은여우` layout.
- Bottom 8-tab Dock remains available for quick navigation.
- Modular engine, render queue, caption, cut marker, and project service checks pass.

## Command

```bash
npm run check
```

## Result

```text
AI Shorts Studio QA summary
  Passed: 59/59
  Failed: 0/59
```
