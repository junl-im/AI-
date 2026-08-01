import { apiRequest } from '../api/httpClient'
import type {
  EngineBlueprint,
  EngineCatalogDecision,
  EngineCatalogItem,
  EnginePipelineStage,
} from './catalogTypes'

interface ApiCatalogItem {
  id: string
  name: string
  category: string
  decision: EngineCatalogDecision
  auto_eligible: boolean
  korean_fit: number
  runtime: string
  license_name: string
  license_policy: string
  reason: string
  requirements: string[]
  capabilities: string[]
}

interface ApiPipelineStage {
  id: string
  name: string
  required: boolean
  default_engine_ids: string[]
  fallback_engine_ids: string[]
}

interface ApiEngineBlueprint {
  version: string
  free_only: true
  product_identity: 'engine-orchestrator'
  principles: string[]
  pipeline: ApiPipelineStage[]
  items: ApiCatalogItem[]
}

function mapItem(item: ApiCatalogItem): EngineCatalogItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    decision: item.decision,
    autoEligible: item.auto_eligible,
    koreanFit: item.korean_fit,
    runtime: item.runtime,
    licenseName: item.license_name,
    licensePolicy: item.license_policy,
    reason: item.reason,
    requirements: item.requirements,
    capabilities: item.capabilities,
  }
}

function mapStage(stage: ApiPipelineStage): EnginePipelineStage {
  return {
    id: stage.id,
    name: stage.name,
    required: stage.required,
    defaultEngineIds: stage.default_engine_ids,
    fallbackEngineIds: stage.fallback_engine_ids,
  }
}

export async function getEngineBlueprint(): Promise<EngineBlueprint> {
  const response = await apiRequest<ApiEngineBlueprint>('/engines/catalog')
  return {
    version: response.version,
    freeOnly: response.free_only,
    productIdentity: response.product_identity,
    principles: response.principles,
    pipeline: response.pipeline.map(mapStage),
    items: response.items.map(mapItem),
  }
}
