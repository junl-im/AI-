export type EngineCatalogDecision =
  | 'adopted'
  | 'optional'
  | 'benchmark'
  | 'external-plugin'
  | 'research-only'
  | 'excluded'

export interface EngineCatalogItem {
  id: string
  name: string
  category: string
  decision: EngineCatalogDecision
  autoEligible: boolean
  koreanFit: number
  runtime: string
  licenseName: string
  licensePolicy: string
  reason: string
  requirements: string[]
  capabilities: string[]
}

export interface EnginePipelineStage {
  id: string
  name: string
  required: boolean
  defaultEngineIds: string[]
  fallbackEngineIds: string[]
}

export interface EngineBlueprint {
  version: string
  freeOnly: true
  productIdentity: 'engine-orchestrator'
  principles: string[]
  pipeline: EnginePipelineStage[]
  items: EngineCatalogItem[]
}
