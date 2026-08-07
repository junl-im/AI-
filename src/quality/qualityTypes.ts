import type { EngineMode, VoiceEmotion } from '../ai/contracts'

export interface DiagnosticCheck {
  id: string
  label: string
  status: string
  detail: string
}

export interface EngineDiagnostic {
  engineId: string
  name: string
  mode: EngineMode
  ready: boolean
  provider: string
  qualityTier: 'basic' | 'standard' | 'premium' | 'reference'
  autoEligible: boolean
  koreanSpecialization: number
  longForm: boolean
  streaming: boolean
  modelLoaded: boolean | null
  recommended: boolean
  health: 'ready' | 'cooldown' | 'unavailable'
  successCount: number
  failureCount: number
  cooldownRemainingSeconds: number
  checks: DiagnosticCheck[]
}

export interface QualityDiagnostics {
  version: string
  pythonVersion: string
  platform: string
  processId: number
  memoryMb: number | null
  openFileDescriptors: number | null
  engines: EngineDiagnostic[]
}

export interface EvaluationSentence {
  id: string
  category: string
  text: string
  focus: string[]
}

export interface TextPreview {
  originalText: string
  normalizedText: string
  changes: string[]
  segments: string[]
  segmentCount: number
}

export interface QualityCompareRequest {
  text: string
  engineIds: string[]
  voiceId: string
  emotion: VoiceEmotion
  speed: number
  pitch: number
}

export interface QualityResult {
  engineId: string
  engineName: string
  engineMode: EngineMode
  status: string
  audioUrl: string | null
  message: string
  elapsedMs: number | null
  durationSeconds: number | null
  realtimeFactor: number | null
  fileSizeBytes: number | null
  segmentCount: number
}

export interface QualityComparison {
  normalizedText: string
  changes: string[]
  results: QualityResult[]
}

export interface DeviceBenchmarkCoverage {
  profile: 'cuda' | 'apple-silicon' | 'cpu' | 'android' | 'ios'
  sampleMinutes: number
  recorded: boolean
  latestStatus: 'ready' | 'warning' | 'failed' | null
  latestRealtimeFactor: number | null
}

export type DeviceCertificationScenario = 'baseline' | 'network-switch' | 'background-resume' | 'installed-pwa'

export interface DeviceSoakRecordInput {
  deviceProfile: 'android' | 'ios'
  deviceName: string
  engineId: string
  modelId: string
  modelVersion: string
  modelDigest: string
  acceleratorName: string
  gpuName: string
  presetId: string
  sampleMinutes: 10 | 30 | 60
  soakElapsedSeconds: number | null
  scenario: DeviceCertificationScenario
  browserVersion: string
  firstAudioMs: number | null
  processingSeconds: number
  audioDurationSeconds: number
  retryCount: number
  failureCount: number
  playbackCompleted: boolean
  sseReconnected: boolean | null
  audioFetchRecovered: boolean | null
  sseReconnectMs: number | null
  audioFetchRecoveryMs: number | null
  playbackInterruptionMs: number | null
  seamP95WaitedMs: number | null
  seamP95DecodeMs: number | null
  finalHandoffErrorMs: number | null
  succeeded: boolean
  notes: string
}

export interface DeviceSoakRecordResult extends DeviceSoakRecordInput {
  id: string
  recordedAt: string
  realtimeFactor: number
  status: 'ready' | 'warning' | 'failed'
}

export interface DeviceCertificationCoverage {
  profile: 'android' | 'ios'
  scenario: DeviceCertificationScenario
  sampleMinutes: number
  recorded: boolean
  latestStatus: 'ready' | 'warning' | 'failed' | null
}

export interface DeviceMetricAggregate {
  deviceProfile: DeviceBenchmarkCoverage['profile']
  engineId: string
  modelId: string
  modelVersion: string
  modelDigest: string
  acceleratorName: string
  gpuName: string
  presetId: string
  records: number
  readyRecords: number
  failureRate: number
  averageRealtimeFactor: number
  p50RealtimeFactor: number
  p95RealtimeFactor: number
  p50FirstAudioMs: number | null
  p95FirstAudioMs: number | null
  p95SseReconnectMs: number | null
  p95AudioFetchRecoveryMs: number | null
  p95PlaybackInterruptionMs: number | null
  p95SeamWaitedMs: number | null
  p95SeamDecodeMs: number | null
  p50FinalHandoffErrorMs: number | null
  p95FinalHandoffErrorMs: number | null
}

export interface DeviceBenchmarkSummary {
  totalRecords: number
  readyRecords: number
  warningRecords: number
  failedRecords: number
  coverage: DeviceBenchmarkCoverage[]
  missingScenarios: string[]
  certificationCoverage: DeviceCertificationCoverage[]
  missingCertifications: string[]
  metricGroups: DeviceMetricAggregate[]
}


export interface BenchmarkMetricWindow {
  records: number
  failureRate: number
  p95FirstAudioMs: number | null
  p95RealtimeFactor: number | null
  p95FinalHandoffErrorMs: number | null
}

export interface BenchmarkRegressionAssessment {
  status: 'insufficient' | 'stable' | 'warning' | 'regressed'
  minimumRecords: number
  availableRecords: number
  baseline: BenchmarkMetricWindow | null
  current: BenchmarkMetricWindow | null
  reasons: string[]
}

export interface OperatorBenchmarkBaseline {
  baselineId: string
  groupKey: string
  engineId: string
  presetId: string
  modelId: string
  modelVersion: string
  modelDigest: string
  deviceProfile: string
  acceleratorName: string
  gpuName: string
  sourceRecords: number
  sourceRecordsSha256: string
  metrics: BenchmarkMetricWindow
  createdAt: string
  actor: string
  note: string
}

export interface OperatorBaselineHistoryEntry {
  baseline: OperatorBenchmarkBaseline
  status: 'active' | 'retired'
  retiredAt: string | null
  retiredBy: string
  retiredReason: string
  replacementBaselineId: string
  lastRestoredAt: string | null
  lastRestoredBy: string
  lastRestoreReason: string
}

export interface OperatorBaselineRestorePreview {
  target: OperatorBenchmarkBaseline
  currentActive: OperatorBenchmarkBaseline | null
  willReplaceActive: boolean
  summary: string[]
}

export interface OperatorBenchmarkRegressionAssessment {
  baselineId: string
  status: 'insufficient' | 'stable' | 'warning' | 'regressed'
  availableRecords: number
  current: BenchmarkMetricWindow | null
  reasons: string[]
}

export interface WorkerTelemetryAggregate {
  groupKey: string
  engineId: string
  presetId: string
  modelId: string
  modelVersion: string
  modelDigest: string
  deviceProfile: string
  acceleratorName: string
  gpuName: string
  records: number
  successRecords: number
  failureRate: number
  p50FirstAudioMs: number | null
  p95FirstAudioMs: number | null
  p50RealtimeFactor: number | null
  p95RealtimeFactor: number | null
  p50FinalHandoffErrorMs: number | null
  p95FinalHandoffErrorMs: number | null
  regression: BenchmarkRegressionAssessment
  operatorBaseline: OperatorBenchmarkBaseline | null
  operatorRegression: OperatorBenchmarkRegressionAssessment | null
}

export interface WorkerTelemetrySummary {
  totalRecords: number
  successRecords: number
  failedRecords: number
  metricGroups: WorkerTelemetryAggregate[]
}


export interface SttComparisonSummary {
  totalRecords: number
  improvedRecords: number
  passedAfterRecords: number
  averageCharacterErrorImprovement: number
  averageWordErrorImprovement: number
}

export interface ExportSoakCoverage {
  sampleMinutes: number
  outputFormat: 'wav' | 'mp3'
  recorded: boolean
  latestStatus: 'ready' | 'warning' | 'failed' | null
  latestRealtimeFactor: number | null
  latestSubtitleDriftMs: number | null
}

export interface ExportSoakSummary {
  totalRecords: number
  readyRecords: number
  warningRecords: number
  failedRecords: number
  coverage: ExportSoakCoverage[]
  missingScenarios: string[]
}

export interface QualityEvidenceRecordDigest {
  category: string
  id: string
  sha256: string
}

export interface QualityEvidenceManifest {
  schemaVersion: string
  recordCount: number
  categoryCounts: Record<string, number>
  recordsSha256: string
  records: QualityEvidenceRecordDigest[]
  bundleSha256: string
}

export interface QualityEvidenceSummary {
  stt: SttComparisonSummary
  exportSoak: ExportSoakSummary
  manifest: QualityEvidenceManifest | null
}
