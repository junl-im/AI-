import type { QualityReview } from './qualityReviewTypes'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function buildQualityReport(reviews: QualityReview[]) {
  return {
    app: '곰같은여우 SoriON AI',
    version: '0.9.3-alpha.1',
    exportedAt: new Date().toISOString(),
    reviews,
  }
}

export function exportQualityReviewsJson(reviews: QualityReview[]): void {
  downloadBlob(
    new Blob([JSON.stringify(buildQualityReport(reviews), null, 2)], { type: 'application/json;charset=utf-8' }),
    `SoriON-quality-${timestamp()}.json`,
  )
}

export function buildQualityCsv(reviews: QualityReview[]): string {
  const header = ['평가일시', '엔진ID', '엔진명', '모드', '별점', '문장', '메모', '생성ms', '음원초', 'RTF']
  const rows = reviews.map((review) => [
    review.updatedAt,
    review.engineId,
    review.engineName,
    review.engineMode,
    review.rating,
    review.sentence,
    review.note,
    review.elapsedMs,
    review.durationSeconds,
    review.realtimeFactor,
  ].map(csvCell).join(','))
  return `\ufeff${header.map(csvCell).join(',')}\n${rows.join('\n')}`
}

export function exportQualityReviewsCsv(reviews: QualityReview[]): void {
  downloadBlob(new Blob([buildQualityCsv(reviews)], { type: 'text/csv;charset=utf-8' }), `SoriON-quality-${timestamp()}.csv`)
}
