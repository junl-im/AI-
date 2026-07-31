import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const ignored = new Set(['.git', '.venv', 'node_modules', 'dist', 'coverage', '__pycache__'])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.py', '.css'])
const failures = []

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath)
      continue
    }

    const path = relative(root, fullPath)
    const extension = extname(entry.name).toLowerCase()
    if (extension === '.svg') failures.push(`${path}: SVG 파일은 프로젝트 원칙상 금지됩니다.`)
    if (!sourceExtensions.has(extension)) continue

    const content = await readFile(fullPath, 'utf8')
    const lineCount = content.split(/\r?\n/).length
    if (lineCount > 500) failures.push(`${path}: ${lineCount}줄로 500줄 제한을 초과했습니다.`)

    const secretPatterns = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /AIza[0-9A-Za-z_-]{30,}/,
      /sk-[A-Za-z0-9_-]{20,}/,
    ]
    if (secretPatterns.some((pattern) => pattern.test(content))) {
      failures.push(`${path}: 비밀키로 의심되는 문자열이 발견되었습니다.`)
    }
  }
}

await walk(root)

if (failures.length > 0) {
  console.error('프로젝트 규칙 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('프로젝트 규칙 검사 통과')
