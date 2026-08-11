import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function source(relativePath) {
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

const analysis = await source('src/workspace/multiSpeaker.ts')
requireTokens('src/workspace/multiSpeaker.ts', analysis, [
  'speakers.length >= 2',
  'unmatchedLines.length === 0',
  'suggestSpeakerVoiceAssignments',
  'buildMultiSpeakerTimelineSegments',
])

const assignment = await source('src/components/workspace/SpeakerVoiceAssignment.tsx')
requireTokens('src/components/workspace/SpeakerVoiceAssignment.tsx', assignment, [
  '목소리는 제안만 합니다.',
  '이 화자 배정으로 만들기',
  'confirmed',
  'onAssignmentChange',
])

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'speakerAssignmentsConfirmed',
  'submitBlockedReason={multiSpeakerAnalysis.eligible && !speakerAssignmentsConfirmed',
  'timeline.stageSegments(',
  'setResumeGeneration(queuedIds.length > 0',
  'getQueuedVoiceBlockIds(pending.allBlockIds)',
  'allBlockIds',
  'timelineClips',
  'onResumeGeneration={() => void resumeLongformGeneration()}',
])

const timeline = await source('src/hooks/useTimelineGeneration.ts')
requireTokens('src/hooks/useTimelineGeneration.ts', timeline, [
  'stageSegments',
  'timelineBlocksFromSegments',
  'getQueuedVoiceBlockIds',
  'getVoiceBlockSnapshots',
  'project.timelineClips?.length',
])

const projectTypes = await source('src/projects/projectTypes.ts')
requireTokens('src/projects/projectTypes.ts', projectTypes, [
  'timelineClips?: Array<{',
  'voiceId: string',
  'voiceName: string',
])

const composer = await source('src/components/workspace/LongformComposer.tsx')
requireTokens('src/components/workspace/LongformComposer.tsx', composer, [
  'resumeCount?: number',
  'submitBlockedReason?: string | null',
  '남은 {resumeCount}개 이어서 만들기',
])

const tests = await source('src/workspace/multiSpeaker.test.ts')
requireTokens('src/workspace/multiSpeaker.test.ts', tests, [
  '명시적인 화자: 대사 형식만 자동 배정 대상으로 인정한다',
  '첫 화자는 현재 목소리를 유지하고 나머지는 제안만 만든다',
])

if (failures.length) {
  console.error('Multi-speaker assist / resume generation 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Multi-speaker assist / resume generation 계약 검사 통과')
