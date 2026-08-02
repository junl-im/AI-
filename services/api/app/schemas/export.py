from typing import Literal

from pydantic import BaseModel, Field, model_validator


class FinalExportSegment(BaseModel):
    kind: Literal["voice", "pause"]
    text: str = Field(default="", max_length=5000)
    audio_filename: str | None = Field(default=None, max_length=255)
    status: Literal["ready", "failed", "cancelled", "queued"] = "ready"
    duration_ms: int = Field(default=0, ge=0, le=600000)

    @model_validator(mode="after")
    def validate_voice(self):
        if self.kind == "voice" and self.status == "ready" and not self.audio_filename:
            raise ValueError("완료 음성 구간에는 audio_filename이 필요합니다.")
        return self


class FinalExportRequest(BaseModel):
    segments: list[FinalExportSegment] = Field(min_length=1, max_length=5000)
    output_format: Literal["wav", "mp3"] = "wav"
    allow_incomplete: bool = False


class FinalExportResponse(BaseModel):
    audio_url: str
    srt_url: str
    vtt_url: str
    output_format: Literal["wav", "mp3"]
    duration_seconds: float
    ffmpeg_used: bool
    skipped_segments: int
    message: str
