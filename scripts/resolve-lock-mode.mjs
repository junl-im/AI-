// SoriON legacy compatibility shim.
// Kept so cumulative ZIP overlays overwrite an old tracked selector instead of requiring deletion.
import { appendFile } from 'node:fs/promises'

const outputIndex = process.argv.indexOf('--github-output')
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : process.env.GITHUB_OUTPUT
if (outputPath) {
  await appendFile(outputPath, 'mode=componentized\nreason=legacy-compatibility-shim\n', 'utf8')
}
console.log('Lock mode: componentized · npm, API, Worker lock jobs resolve independently.')
