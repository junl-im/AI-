import type { FinalExportResult } from './finalExportApi'

export interface ExportArchiveReceipt {
  id: string
  recordedAt: string
  serverExpiresAt: string
  outputFormat: 'wav' | 'mp3'
  durationSeconds: number
  filenames: string[]
}

const STORAGE_KEY = 'sorion.export-archive-receipts.v1'
const MAX_RECEIPTS = 20

function filenameFromUrl(url: string): string {
  try {
    return new URL(url, window.location.href).pathname.split('/').filter(Boolean).at(-1) ?? 'sorion-export'
  } catch {
    return 'sorion-export'
  }
}

export function loadExportArchiveReceipts(): ExportArchiveReceipt[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.filter((item): item is ExportArchiveReceipt => (
      item && typeof item === 'object'
      && typeof item.id === 'string'
      && typeof item.recordedAt === 'string'
      && typeof item.serverExpiresAt === 'string'
      && Array.isArray(item.filenames)
    )).slice(0, MAX_RECEIPTS)
  } catch {
    return []
  }
}

function saveReceipts(receipts: ExportArchiveReceipt[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts.slice(0, MAX_RECEIPTS)))
  } catch {
    // Download must not fail because local metadata storage is unavailable.
  }
}

export function recordExportArchiveReceipt(result: FinalExportResult): ExportArchiveReceipt {
  const receipt: ExportArchiveReceipt = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    recordedAt: new Date().toISOString(),
    serverExpiresAt: result.serverExpiresAt,
    outputFormat: result.outputFormat,
    durationSeconds: result.durationSeconds,
    filenames: [result.audioUrl, result.srtUrl, result.vttUrl].map(filenameFromUrl),
  }
  saveReceipts([receipt, ...loadExportArchiveReceipts()])
  return receipt
}

export function removeExportArchiveReceipt(id: string): ExportArchiveReceipt[] {
  const next = loadExportArchiveReceipts().filter((item) => item.id !== id)
  saveReceipts(next)
  return next
}

function triggerDownload(url: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filenameFromUrl(url)
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export function preserveExportByDownload(result: FinalExportResult): ExportArchiveReceipt {
  triggerDownload(result.audioUrl)
  window.setTimeout(() => triggerDownload(result.srtUrl), 100)
  window.setTimeout(() => triggerDownload(result.vttUrl), 200)
  return recordExportArchiveReceipt(result)
}
