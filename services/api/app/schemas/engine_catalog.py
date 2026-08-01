from typing import Literal

from pydantic import BaseModel, Field

EngineCatalogCategory = Literal[
    "tts",
    "voice-clone",
    "voice-conversion",
    "stt",
    "alignment",
    "noise-reduction",
    "enhancement",
    "source-separation",
    "subtitle",
    "translation",
    "ai-director",
]
EngineCatalogDecision = Literal[
    "adopted",
    "optional",
    "benchmark",
    "external-plugin",
    "research-only",
    "excluded",
]
EngineLicensePolicy = Literal[
    "permissive",
    "copyleft-plugin",
    "non-commercial-model",
    "model-review-required",
]


class EngineCatalogItem(BaseModel):
    id: str
    name: str
    category: EngineCatalogCategory
    decision: EngineCatalogDecision
    auto_eligible: bool
    korean_fit: int = Field(ge=0, le=100)
    runtime: str
    license_name: str
    license_policy: EngineLicensePolicy
    reason: str
    requirements: list[str] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)


class PipelineStage(BaseModel):
    id: str
    name: str
    required: bool
    default_engine_ids: list[str]
    fallback_engine_ids: list[str] = Field(default_factory=list)


class EngineCatalogResponse(BaseModel):
    version: str
    free_only: Literal[True]
    product_identity: Literal["engine-orchestrator"]
    principles: list[str]
    pipeline: list[PipelineStage]
    items: list[EngineCatalogItem]
