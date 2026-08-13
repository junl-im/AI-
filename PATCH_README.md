# SoriON 0.11.14 Web quality test hotfix

Fixes the failing TimelineEditor command-bar regression test seen in GitHub Actions run 31658930448.

Changed file:
- src/components/workspace/TimelineEditor.test.tsx

The test now supplies the history capability and labels required by the current TimelineEditor contract:
- canUndo
- canRedo
- undoLabel="선택 클립 이동"
- redoLabel="대사 수정"

No production runtime code or workflow behavior is changed.
