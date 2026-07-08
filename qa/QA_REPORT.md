# QA Report - AI Shorts Studio v1.0.0

## Summary

- Passed: 67/67
- Failed: 0/67

## Focus

- Manual Dock tab clicks must not jump to the top.
- Recommendation generation must connect to the candidate tab.
- Candidate selection must connect to preview.
- Candidate empty state must be understandable.
- Header must stay simple and user-facing.
- Action buttons must remain compact.
- Flow Doctor CSS/JS must be loaded and cached.

## Added check

- `qa/flow_doctor_smoke.js`

Run:

```bash
npm run check
```
