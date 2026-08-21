import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredChecks = [
  ['Live Voice store', 'src/store/useAppStore.ts', 'setLiveVoice'],
  ['MY VOICE identity', 'src/voiceclone/voiceIdentity.ts', "MY_VOICE_PREFIX = 'myvoice:'"],
  ['MY VOICE remote reconciliation', 'src/hooks/useMyVoiceProfiles.ts', 'getRemoteVoiceCloneProfile'],
  ['MY VOICE profile refresh event', 'src/hooks/useMyVoiceProfiles.ts', 'MY_VOICE_PROFILES_CHANGED_EVENT'],
  ['MY VOICE notification bridge', 'src/voiceclone/profileRepository.ts', 'notifyVoiceProfilesChanged'],
  ['Unified voice choices', 'src/voice/voiceChoices.ts', 'buildVoiceChoices'],
  ['MY VOICE uncertain sync block', 'src/voice/voiceChoices.ts', 'remoteSynced !== null'],
  ['MY VOICE clone synthesis', 'src/voiceclone/voiceCloneSynthesis.ts', 'synthesizeVoiceCloneProfile'],
  ['MY VOICE idempotent prepare', 'src/voiceclone/voiceCloneApi.ts', 'client_profile_id'],
  ['MY VOICE remote profile GET', 'src/voiceclone/voiceCloneApi.ts', 'getRemoteVoiceCloneProfile'],
  ['Recorder hard stop', 'src/hooks/useVoiceRecorder.ts', 'MAX_RECORDING_MS = 29_500'],
  ['Recorder reset race guard', 'src/hooks/useVoiceRecorder.ts', 'discardNextStopRef'],
  ['Browser 30 second block', 'src/voiceclone/audioAnalysis.ts', 'durationSeconds > 30'],
  ['Browser silence block', 'src/voiceclone/audioAnalysis.ts', 'silenceRatio > 0.85'],
  ['Browser RMS block', 'src/voiceclone/audioAnalysis.ts', 'rmsDb < -50'],
  ['20~30 second capture guide', 'src/components/clone/VoiceSampleCapture.tsx', '20~30초'],
  ['30 second capture maximum', 'src/components/clone/VoiceSampleCapture.tsx', '30초 최대'],
  ['Voice picker MY VOICE section', 'src/components/workspace/VoicePickerSheet.tsx', 'soa-voice-sheet-myvoices'],
  ['Desktop drawer MY VOICE section', 'src/components/workspace/DesktopVoiceDrawer.tsx', 'MY VOICE'],
  ['Timeline voice choices', 'src/components/workspace/TimelineEditor.tsx', 'voiceChoices?: VoiceChoice[]'],
  ['Timeline selection linkage', 'src/components/workspace/TimelineEditor.tsx', 'onSelectionChange?: (ids: string[]) => void'],
  ['Home MY VOICE profiles', 'src/pages/HomePage.tsx', 'useMyVoiceProfiles()'],
  ['Home unified voice choices', 'src/pages/HomePage.tsx', 'buildVoiceChoices'],
  ['Home clone synthesis', 'src/pages/HomePage.tsx', 'synthesizeVoiceCloneProfile'],
  ['Server actual audio rejection', 'services/api/app/api/routes/voice_clones.py', '_reject_server_analysis'],
  ['Server idempotent profile id', 'services/api/app/api/routes/voice_clones.py', 'client_profile_id'],
  ['Server profile recovery GET', 'services/api/app/api/routes/voice_clones.py', 'async def get_profile'],
  ['Server FFmpeg inspection', 'services/api/app/storage/voice_clone_store.py', '_inspect_with_ffmpeg'],
  ['Server canonical normalization', 'services/api/app/storage/voice_clone_store.py', 'normalize_for_engine'],
  ['Server 30 second maximum', 'services/api/app/storage/voice_clone_store.py', '_MAX_PROMPT_SECONDS = 30.0'],
  ['Preset 16 kHz contract', 'services/api/app/services/voice_preset_validation.py', 'REQUIRED_SAMPLE_RATE = 16_000'],
  ['Preset RMS gate', 'services/api/app/services/voice_preset_validation.py', 'RMS_BLOCK_DB = -50.0'],
  ['CosyVoice canonical stream call', 'services/worker/app/adapters/cosyvoice3.py', 'stream=True'],
  ['CosyVoice 16 kHz mono guard', 'services/worker/app/adapters/cosyvoice3.py', 'frame_rate != 16_000 or channels != 1'],
]

const forbiddenFiles = [
  'APPLY_LIVE_VOICE_EXPORT_HOTFIX.mjs',
  'VERIFY_LIVE_VOICE_EXPORT_HOTFIX.mjs',
  'APPLY_LIVE_VOICE_MYVOICE.mjs',
  'apply-live-voice-myvoice.mjs',
  'apply-sorion-linkage-myvoice.mjs',
  'verify-sorion-linkage-myvoice.mjs',
  'PATCH_FILE_LIST.txt',
  'payload',
  'src/components/workspace/FinalExportControls.tsx',
  'src/components/workspace/FinalExportDialog.tsx',
  'src/export/finalExportApi.ts',
  'src/export/exportArchive.ts',
  'services/api/app/api/routes/exports.py',
  'services/api/app/schemas/export.py',
]

const forbiddenMarkers = [
  ['Public export route', 'services/api/app/api/router.py', '/exports'],
  ['Final export controls import', 'src/components/workspace/TimelineEditor.tsx', 'FinalExportControls'],
  ['Final export dialog import', 'src/components/workspace/TimelineEditor.tsx', 'FinalExportDialog'],
]

let failed = 0

for (const [name, relative, marker] of requiredChecks) {
  const file = path.join(root, relative)
  const okay = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(marker)
  console.log(`${okay ? 'PASS' : 'FAIL'} required · ${name}`)
  if (!okay) failed += 1
}

for (const relative of forbiddenFiles) {
  const file = path.join(root, relative)
  const okay = !fs.existsSync(file)
  console.log(`${okay ? 'PASS' : 'FAIL'} retired · ${relative}`)
  if (!okay) failed += 1
}

for (const [name, relative, marker] of forbiddenMarkers) {
  const file = path.join(root, relative)
  const okay = fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes(marker)
  console.log(`${okay ? 'PASS' : 'FAIL'} forbidden marker · ${name}`)
  if (!okay) failed += 1
}

const total = requiredChecks.length + forbiddenFiles.length + forbiddenMarkers.length
console.log(`\nLive Voice / MY VOICE hardening: ${total - failed}/${total} PASS`)
if (failed > 0) process.exit(1)
