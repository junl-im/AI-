import fs from 'node:fs'

const checks = [
  ['src/navigation/navigationItems.ts', "{ page: 'clone', label: '내 목소리'"],
  ['src/navigation/navigationItems.ts', "home: '텍스트를 음성으로'"],
  ['src/navigation/navigationItems.ts', "clone: '내 목소리'"],
  ['src/pages/HomePage.tsx', 'timelineSelectionIdsRef'],
  ['src/pages/HomePage.tsx', 'timeline.updateVoiceMany(selectedTimelineIds, voice.id, voice.name)'],
  ['src/components/workspace/TimelineEditor.tsx', 'onSelectionChange?: (voiceBlockIds: string[]) => void'],
  ['src/components/workspace/TimelineEditor.tsx', 'aria-label="선택 클립 목소리"'],
  ['src/components/workspace/TimelineEditor.tsx', "'라이브러리 연결'"],
  ['src/components/workspace/VoiceLibrary.tsx', '선택한 타임라인 대사가 있으면 즉시 연결'],
  ['src/pages/VoiceClonePage.tsx', 'MY VOICE · CONSENT FIRST'],
  ['src/pages/VoiceClonePage.tsx', '<MyVoiceLibrary'],
  ['src/components/clone/MyVoiceLibrary.tsx', 'MY VOICE LIBRARY'],
  ['src/components/clone/CloneExecutionCard.tsx', 'VOICE TEST LAB'],
  ['src/styles/index.css', '@import "./my-voice-lab.css";'],
]

let failed = false
for (const [file, marker] of checks) {
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const ok = source.includes(marker)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${file} :: ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log(`\n${checks.length}/${checks.length} linkage + My Voice contract checks passed.`)
