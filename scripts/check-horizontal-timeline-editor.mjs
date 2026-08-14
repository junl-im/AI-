import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function read(relativePath) {
  try {
    return await readFile(join(root, relativePath), 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    return ''
  }
}

function requireTokens(relativePath, content, tokens) {
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${relativePath}: 계약 누락 ${token}`)
  }
}

const timeline = await read('src/components/workspace/TimelineEditor.tsx')
requireTokens('src/components/workspace/TimelineEditor.tsx', timeline, [
  'buildTimelineMetrics(blocks, zoom)',
  'buildTimelineRulerTicks(totalDuration, timelineContentWidth)',
  ': TIMELINE_INSET_PX',
  'data-timeline-axis="horizontal"',
  'className="soa-timeline-clip-slot"',
  "'--soa-clip-offset': `${metric.offset}px`",
  "'--soa-clip-width': `${metric.width}px`",
  '가로 타임라인을 클릭하거나 드래그해 재생 위치 이동',
  'startTimelineScrub',
  'continueTimelineScrub',
  'stopTimelineScrub',
  'TimelineVoiceBlockCard',
])

const timelineBlockCard = await read('src/components/workspace/TimelineVoiceBlockCard.tsx')
requireTokens('src/components/workspace/TimelineVoiceBlockCard.tsx', timelineBlockCard, [
  'onDoubleClick={(event) => {',
  "'--soa-clip-width': `${width}px`",
])


const geometry = await read('src/timeline/timelineGeometry.ts')
requireTokens('src/timeline/timelineGeometry.ts', geometry, [
  'export const TIMELINE_PIXELS_PER_SECOND = 72',
  'export const TIMELINE_INSET_PX = 16',
  'export function buildTimelineMetrics',
  'export function buildTimelineRulerTicks',
  'export function getTimelineCanvasWidth',
  'left: TIMELINE_INSET_PX + contentWidth * ratio',
])

const cssIndex = await read('src/styles/index.css')
requireTokens('src/styles/index.css', cssIndex, [
  '@import "./timeline-horizontal-pc.css";',
])

const css = await read('src/styles/timeline-horizontal-pc.css')
requireTokens('src/styles/timeline-horizontal-pc.css', css, [
  '@media (min-width: 1024px)',
  '.soa-capcut-timeline[data-timeline-axis="horizontal"]',
  'left: var(--soa-clip-offset, 0px);',
  'width: var(--soa-clip-width, 1px);',
  '.soa-dubbing-block__direct-tool',
  'container-type: inline-size;',
  '@container (max-width: 105px)',
])

const tests = await read('src/components/workspace/TimelineEditor.test.tsx')
requireTokens('src/components/workspace/TimelineEditor.test.tsx', tests, [
  'PC 가로 타임라인은 시간축과 클립 폭을 같은 좌표계로 유지한다',
  "toBe('216px')",
  "toBe('232px')",
  "toBe('268px')",
])

if (failures.length) {
  console.error('PC horizontal timeline 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('PC horizontal timeline 계약 검사 통과 · ruler / clips / playhead share one X axis')
