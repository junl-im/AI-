from typing import Literal

from pydantic import BaseModel, Field

DirectorUseCase = Literal[
    "auto",
    "youtube-narration",
    "audiobook",
    "commercial",
    "announcement",
    "dialogue",
]
DirectorEmotion = Literal["neutral", "happy", "sad", "angry", "commercial"]


class DirectorRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    use_case: DirectorUseCase = "auto"
    voice_id: str = "sori-warm"
    preserve_wording: bool = True


class PronunciationHint(BaseModel):
    source: str
    spoken: str


class PauseHint(BaseModel):
    after_segment: int
    milliseconds: int = Field(ge=100, le=3000)
    reason: str


class DirectorPlanResponse(BaseModel):
    version: str
    use_case: DirectorUseCase
    normalized_text: str
    segments: list[str]
    pronunciation_hints: list[PronunciationHint]
    pause_hints: list[PauseHint]
    recommended_speed: float = Field(ge=0.5, le=2.0)
    recommended_pitch: float = Field(ge=-12, le=12)
    recommended_emotion: DirectorEmotion
    engine_order: list[str]
    required_capabilities: list[str]
    post_processing: list[str]
    warnings: list[str]
    summary: str
