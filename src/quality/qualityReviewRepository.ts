import { completeTransaction, openSoriOnDatabase, QUALITY_REVIEW_STORE } from '../storage/database'
import type { QualityReview, QualityReviewInput } from './qualityReviewTypes'

function reviewId(sentence: string, engineId: string, voiceId: string): string {
  let hash = 2166136261
  const value = `${engineId}\u0000${voiceId}\u0000${sentence}`
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${engineId}-${voiceId}-${(hash >>> 0).toString(16)}`
}

export async function saveQualityReview(input: QualityReviewInput): Promise<QualityReview> {
  const id = reviewId(input.sentence, input.engineId, input.voiceId)
  const existing = await getQualityReview(input.sentence, input.engineId, input.voiceId)
  const now = new Date().toISOString()
  const review: QualityReview = {
    ...input,
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  const database = await openSoriOnDatabase()
  const transaction = database.transaction(QUALITY_REVIEW_STORE, 'readwrite')
  transaction.objectStore(QUALITY_REVIEW_STORE).put(review)
  await completeTransaction(transaction)
  database.close()
  return review
}

export async function getQualityReview(
  sentence: string,
  engineId: string,
  voiceId: string,
): Promise<QualityReview | null> {
  const database = await openSoriOnDatabase()
  const review = await new Promise<QualityReview | null>((resolve, reject) => {
    const request = database.transaction(QUALITY_REVIEW_STORE, 'readonly')
      .objectStore(QUALITY_REVIEW_STORE)
      .get(reviewId(sentence, engineId, voiceId))
    request.onsuccess = () => resolve((request.result as QualityReview | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
  database.close()
  return review
}

export async function listQualityReviews(): Promise<QualityReview[]> {
  const database = await openSoriOnDatabase()
  const reviews = await new Promise<QualityReview[]>((resolve, reject) => {
    const request = database.transaction(QUALITY_REVIEW_STORE, 'readonly')
      .objectStore(QUALITY_REVIEW_STORE)
      .getAll()
    request.onsuccess = () => resolve(request.result as QualityReview[])
    request.onerror = () => reject(request.error)
  })
  database.close()
  return reviews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function importQualityReviews(inputs: QualityReviewInput[]): Promise<number> {
  let imported = 0
  for (const input of inputs) {
    await saveQualityReview(input)
    imported += 1
  }
  return imported
}
