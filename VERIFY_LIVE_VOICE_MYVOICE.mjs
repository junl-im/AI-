import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const checks = [
  ['Live Voice store', 'src/store/useAppStore.ts', 'setLiveVoice: (snapshot: LiveVoiceSnapshot)'],
  ['Live Voice UI', 'src/components/layout/BrandMasthead.tsx', 'LIVE VOICE'],
  ['Live Voice selected voice', 'src/components/layout/BrandMasthead.tsx', 'liveVoice.voiceName'],
  ['Live Voice engine', 'src/components/layout/BrandMasthead.tsx', 'liveVoice.engineName'],
  ['Live Voice CTA', 'src/components/layout/BrandMasthead.tsx', '텍스트를 음성으로'],
  ['MY VOICE identity', 'src/voiceclone/voiceIdentity.ts', "MY_VOICE_PREFIX = 'myvoice:'"],
  ['MY VOICE profile bridge', 'src/hooks/useMyVoiceProfiles.ts', 'MY_VOICE_PROFILES_CHANGED_EVENT'],
  ['Unified voice choices', 'src/voice/voiceChoices.ts', 'buildVoiceChoices'],
  ['MY VOICE clone synthesis', 'src/voiceclone/voiceCloneSynthesis.ts', 'synthesizeVoiceCloneProfile'],
  ['Profile live refresh', 'src/voiceclone/profileRepository.ts', 'notifyProfilesChanged()'],
  ['Voice library MY VOICE section', 'src/components/workspace/VoiceLibrary.tsx', '<strong>MY VOICE</strong>'],
  ['Voice picker MY VOICE section', 'src/components/workspace/VoicePickerSheet.tsx', 'soa-voice-sheet-myvoices'],
  ['Desktop drawer MY VOICE section', 'src/components/workspace/DesktopVoiceDrawer.tsx', 'soa-voice-drawer__myvoices'],
  ['Timeline unified voice selector', 'src/components/workspace/TimelineEditor.tsx', 'TimelineVoiceSelect'],
  ['Timeline voice options', 'src/components/workspace/TimelineEditor.tsx', 'voiceOptions?: TimelineVoiceOption[]'],
  ['Timeline selection linkage', 'src/components/workspace/TimelineEditor.tsx', 'onSelectionChange?: (voiceBlockIds: string[]) => void'],
  ['Timeline custom generation routing', 'src/hooks/useTimelineGeneration.ts', 'getMyVoiceProfileId(block.voiceId)'],
  ['Timeline clone synthesis routing', 'src/hooks/useTimelineGeneration.ts', 'synthesizeVoiceCloneProfile({'],
  ['Home MY VOICE profiles', 'src/pages/HomePage.tsx', 'useMyVoiceProfiles()'],
  ['Home unified selected voice', 'src/pages/HomePage.tsx', 'resolveVoiceChoice(myVoiceProfiles, voiceId)'],
  ['Home Live Voice sync', 'src/pages/HomePage.tsx', 'setLiveVoice({'],
  ['Home clone preview path', 'src/pages/HomePage.tsx', 'await synthesizeVoiceCloneProfile({ profileId: myVoiceProfileId, text })'],
  ['Home timeline voice options', 'src/pages/HomePage.tsx', 'voiceOptions={timelineVoiceOptions}'],
  ['Timeline-to-library bidirectional sync', 'src/pages/HomePage.tsx', 'timelineSelectionIdsRef.current = ids\n                selectVoice(nextVoiceId)'],
  ['Home voice library profiles', 'src/pages/HomePage.tsx', 'myVoiceProfiles={myVoiceProfiles}'],
  ['My Voice Lab library', 'src/components/clone/MyVoiceLibrary.tsx', 'MY VOICE'],
  ['My Voice quality guide', 'src/voiceclone/sampleQualityScore.ts', 'calculateVoiceSampleScore'],
  ['My Voice real test lab', 'src/components/clone/CloneExecutionCard.tsx', 'VOICE TEST LAB'],
  ['My Voice navigation', 'src/navigation/navigationItems.ts', "label: '내 목소리'"],
  ['Text-to-speech navigation', 'src/navigation/navigationItems.ts', "home: '텍스트를 음성으로'"],
  ['Live Voice styles', 'src/styles/index.css', '@import "./live-voice-bar.css";'],
  ['MY VOICE bridge styles', 'src/styles/index.css', '@import "./my-voice-library-bridge.css";'],
]

const preservationChecks = [
  ['0.11.15 export flow preserved', 'src/pages/HomePage.tsx', 'FinalExportDialog'],
  ['0.11.15 linked player preserved', 'src/components/workspace/TimelineEditor.tsx', 'TimelineLinkedPlayer'],
  ['0.11.15 desktop collapsed toggle preserved', 'src/components/workspace/DesktopVoiceDrawer.tsx', 'soa-studio-panel-toggle is-collapsed'],
]

let failed = 0
for (const [name, relative, marker] of checks) {
  const file = path.join(root, relative)
  const okay = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(marker)
  console.log(`${okay ? 'PASS' : 'FAIL'} ${name}`)
  if (!okay) failed += 1
}

let preservationWarnings = 0
for (const [name, relative, marker] of preservationChecks) {
  const file = path.join(root, relative)
  const okay = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(marker)
  console.log(`${okay ? 'PASS' : 'WARN'} ${name}`)
  if (!okay) preservationWarnings += 1
}

console.log(`\nCore: ${checks.length - failed}/${checks.length} PASS`)
if (preservationWarnings > 0) {
  console.log(`Preservation warnings: ${preservationWarnings}. 현재 GitHub main 0.11.15가 아닌 오래된 기준점에서 검증 중일 수 있습니다.`)
}
if (failed > 0) process.exit(1)
