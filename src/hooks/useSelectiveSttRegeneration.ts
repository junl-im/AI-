import { useCallback, useState } from 'react'
import { verifyTimelineSegments } from '../stt/verificationApi'
import type { WorkspaceMessage } from '../workspace/workspaceTypes'
import type { useTimelineGeneration } from './useTimelineGeneration'

type TimelineController = ReturnType<typeof useTimelineGeneration>

interface SelectiveSttOptions {
  timeline: TimelineController
  appendMessage: (message: Omit<WorkspaceMessage, 'id'>) => void
  showNotice: (message: string) => void
}

export function useSelectiveSttRegeneration({
  timeline,
  appendMessage,
  showNotice,
}: SelectiveSttOptions) {
  const [busy, setBusy] = useState(false)

  const run = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const report = await verifyTimelineSegments(timeline.blocks)
      timeline.applySttVerification(report.results)
      if (!report.regenerationSegmentIds.length) {
        appendMessage({
          role: 'assistant',
          badge: report.blockedSegmentIds.length ? 'STT 한도 확인' : 'STT 검수 통과',
          text: report.blockedSegmentIds.length
            ? `${report.blockedSegmentIds.length}개 문장이 재생성 한도에 도달했습니다.`
            : `${report.results.length}개 문장이 STT 기준을 통과했습니다.`,
        })
        return
      }
      const regenerated = await timeline.regenerateBlocks(report.regenerationSegmentIds)
      appendMessage({
        role: 'assistant',
        badge: '선택 재생성',
        text: `${report.regenerationSegmentIds.length}개 실패 문장 중 ${regenerated.length}개를 다시 생성했습니다. 다시 STT 검수하면 개선 여부를 확인합니다.`,
      })
    } catch (caught) {
      showNotice(caught instanceof Error ? caught.message : 'STT 검수에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }, [appendMessage, busy, showNotice, timeline])

  return { busy, run }
}
