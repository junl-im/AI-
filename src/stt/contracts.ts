export interface TranscriptionRequest {
  language: 'ko' | 'auto'
  timestamps: boolean
}

export interface TranscriptionSegment {
  startSeconds: number
  endSeconds: number
  text: string
}
