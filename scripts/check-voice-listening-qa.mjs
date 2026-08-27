import { readFile } from 'node:fs/promises'
const required = new Map([
  ['src/quality/voiceListeningQa.ts', ['voiceListeningScenarios', 'longformFatigueScore', 'naturalPace', 'lowFatigue']],
  ['src/components/evaluation/VoiceListeningQaCard.tsx', ['VOICE LISTENING QA', '현실 속도·피로도 인증', 'QA JSON 내보내기']],
  ['src/pages/QualityPage.tsx', ['VoiceListeningQaCard']],
])
const failures = []
for (const [file, fragments] of required) {
  const text = await readFile(file, 'utf8')
  for (const fragment of fragments) if (!text.includes(fragment)) failures.push(`${file}: ${fragment} 누락`)
}
if (failures.length) { failures.forEach((item) => console.error(`- ${item}`)); process.exit(1) }
console.log('Voice listening QA 계약 통과')
