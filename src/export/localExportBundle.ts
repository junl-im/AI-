const MAX_FILES = 20
export const MAX_LOCAL_BUNDLE_BYTES = 250 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['wav', 'mp3', 'srt', 'vtt', 'json'])

type ArrayBufferBytes = Uint8Array<ArrayBuffer>

export interface LocalBundleEntry {
  name: string
  size: number
  sha256: string
  mediaType: string
}

export interface LocalBundleBuildProgress {
  processedFiles: number
  totalFiles: number
  processedBytes: number
  totalBytes: number
  currentFile: string | null
}

export interface LocalBundleBuildOptions {
  signal?: AbortSignal
  onProgress?: (progress: LocalBundleBuildProgress) => void
}

export interface LocalBundleManifest {
  schemaVersion: '1'
  appVersion: '0.9.3-beta.3'
  generatedAt: string
  files: LocalBundleEntry[]
}

function extension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function safeName(name: string): string {
  const base = name.replaceAll('\\', '/').split('/').pop() ?? 'file'
  const sanitized = Array.from(base, (character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1f || '<>:"|?*'.includes(character) ? '_' : character
  }).join('')
  return sanitized.slice(0, 180) || 'file'
}

function u16(value: number): ArrayBufferBytes {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff)
}

function u32(value: number): ArrayBufferBytes {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

function concat(parts: readonly ArrayBufferBytes[]): ArrayBufferBytes {
  const total = parts.reduce((sum, item) => sum + item.length, 0)
  const output = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[index] = value >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

async function sha256(bytes: ArrayBufferBytes): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}

interface PreparedFile {
  name: string
  bytes: ArrayBufferBytes
  mediaType: string
  sha256: string
}

function zipStored(files: PreparedFile[]): ArrayBufferBytes {
  const locals: ArrayBufferBytes[] = []
  const centrals: ArrayBufferBytes[] = []
  let offset = 0
  for (const file of files) {
    const name = new TextEncoder().encode(file.name)
    const crc = crc32(file.bytes)
    const local = concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), name, file.bytes,
    ])
    const central = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ])
    locals.push(local)
    centrals.push(central)
    offset += local.length
  }
  const centralDirectory = concat(centrals)
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralDirectory.length), u32(offset), u16(0),
  ])
  return concat([...locals, centralDirectory, end])
}

export function validateLocalBundleFiles(files: File[]): void {
  if (!files.length) throw new Error('묶을 파일을 선택해 주세요.')
  if (files.length > MAX_FILES) throw new Error(`파일은 최대 ${MAX_FILES}개까지 묶을 수 있습니다.`)
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (total > MAX_LOCAL_BUNDLE_BYTES) throw new Error('로컬 ZIP 총용량은 250MiB 이하여야 합니다.')
  const unsupported = files.find((file) => !ALLOWED_EXTENSIONS.has(extension(file.name)))
  if (unsupported) throw new Error(`지원하지 않는 파일 형식입니다: ${unsupported.name}`)
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('ZIP 생성을 취소했습니다.', 'AbortError')
}

export async function buildLocalExportBundle(
  files: File[],
  options: LocalBundleBuildOptions = {},
): Promise<{ blob: Blob; manifest: LocalBundleManifest }> {
  validateLocalBundleFiles(files)
  throwIfAborted(options.signal)
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  let processedBytes = 0
  options.onProgress?.({ processedFiles: 0, totalFiles: files.length, processedBytes, totalBytes, currentFile: null })
  const uniqueNames = new Set<string>()
  const prepared: PreparedFile[] = []
  const manifestEntries: LocalBundleEntry[] = []
  for (const [fileIndex, file] of files.entries()) {
    throwIfAborted(options.signal)
    options.onProgress?.({ processedFiles: fileIndex, totalFiles: files.length, processedBytes, totalBytes, currentFile: file.name })
    let name = safeName(file.name)
    let suffix = 2
    const dot = name.lastIndexOf('.')
    const stem = dot >= 0 ? name.slice(0, dot) : name
    const ext = dot >= 0 ? name.slice(dot) : ''
    while (uniqueNames.has(name)) name = `${stem}-${suffix++}${ext}`
    uniqueNames.add(name)
    const bytes = new Uint8Array(await file.arrayBuffer())
    throwIfAborted(options.signal)
    const digest = await sha256(bytes)
    throwIfAborted(options.signal)
    prepared.push({ name, bytes, mediaType: file.type || 'application/octet-stream', sha256: digest })
    manifestEntries.push({ name, size: bytes.length, sha256: digest, mediaType: file.type || 'application/octet-stream' })
    processedBytes += file.size
    options.onProgress?.({ processedFiles: fileIndex + 1, totalFiles: files.length, processedBytes, totalBytes, currentFile: null })
  }
  const manifest: LocalBundleManifest = {
    schemaVersion: '1',
    appVersion: '0.9.3-beta.3',
    generatedAt: new Date().toISOString(),
    files: manifestEntries,
  }
  const manifestBytes = new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`)
  prepared.unshift({
    name: 'sorion-bundle-manifest.json',
    bytes: manifestBytes,
    mediaType: 'application/json',
    sha256: await sha256(manifestBytes),
  })
  throwIfAborted(options.signal)
  const archive = zipStored(prepared)
  throwIfAborted(options.signal)
  return { blob: new Blob([archive], { type: 'application/zip' }), manifest }
}

export function downloadLocalExportBundle(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `SoriON-local-export-${new Date().toISOString().slice(0, 10)}.zip`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
