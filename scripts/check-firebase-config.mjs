import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]
const expectedProjectId = 'device-streaming-96b2272c'
const failures = []

function parseEnv(content) {
  return Object.fromEntries(content.split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=')
      return [line.slice(0, index), line.slice(index + 1)]
    }))
}

for (const filename of ['.env.development', '.env.production']) {
  const values = parseEnv(await readFile(resolve(root, filename), 'utf8'))
  for (const name of required) {
    if (!values[name]?.trim()) failures.push(`${filename}: ${name} is missing`)
  }
  if (values.VITE_FIREBASE_PROJECT_ID !== expectedProjectId) {
    failures.push(`${filename}: unexpected Firebase project id`)
  }
  if (values.VITE_FIREBASE_AUTH_DOMAIN !== `${expectedProjectId}.firebaseapp.com`) {
    failures.push(`${filename}: auth domain does not match project id`)
  }
  if (values.VITE_FIREBASE_STORAGE_BUCKET !== `${expectedProjectId}.firebasestorage.app`) {
    failures.push(`${filename}: storage bucket does not match project id`)
  }
}

const firebaseRc = JSON.parse(await readFile(resolve(root, '.firebaserc'), 'utf8'))
if (firebaseRc.projects?.default !== expectedProjectId) {
  failures.push('.firebaserc: default Firebase project is not linked')
}
const firebaseJson = JSON.parse(await readFile(resolve(root, 'firebase.json'), 'utf8'))
if (Object.keys(firebaseJson).join(',') !== 'hosting') failures.push('firebase.json: Spark deployment must remain hosting-only')

for (const [filename, marker] of [
  ['firestore.rules', 'allow read, write: if false;'],
  ['storage.rules', 'allow read, write: if false;'],
]) {
  const content = await readFile(resolve(root, filename), 'utf8')
  if (!content.includes(marker)) failures.push(`${filename}: deny-by-default rule is missing`)
}

const client = await readFile(resolve(root, 'src/firebase/firebaseClient.ts'), 'utf8')
for (const name of required) {
  if (!client.includes(`import.meta.env.${name}`)) failures.push(`firebaseClient.ts: ${name} is not wired`)
}

if (failures.length) {
  console.error('Firebase Web 설정 검사 실패')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`Firebase Web 설정 검사 통과 · ${expectedProjectId}`)
