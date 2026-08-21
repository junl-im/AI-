import asyncio
import wave
from pathlib import Path

import pytest

from app.adapters.cosyvoice3 import OfficialCosyVoice3Adapter


class FakeSpeech:
    def detach(self):
        return self

    def cpu(self):
        return self


class FakeModel:
    sample_rate = 24_000

    def __init__(self):
        self.call = None

    def inference_cross_lingual(
        self,
        text,
        prompt_wav,
        zero_shot_spk_id="",
        stream=False,
        speed=1.0,
        text_frontend=True,
    ):
        self.call = {
            "text": text,
            "prompt_wav": prompt_wav,
            "zero_shot_spk_id": zero_shot_spk_id,
            "stream": stream,
            "speed": speed,
            "text_frontend": text_frontend,
        }
        yield {"tts_speech": FakeSpeech()}


class FakeTorch:
    @staticmethod
    def cat(chunks, dim=1):
        assert chunks
        assert dim == 1
        return chunks[0]


class FakeAudio:
    def __init__(self):
        self.saved = None

    def save(self, path, waveform, sample_rate):
        self.saved = (path, waveform, sample_rate)


@pytest.mark.asyncio
async def test_cross_lingual_call_uses_keyword_stream_without_corrupting_speaker_id(tmp_path: Path):
    adapter = OfficialCosyVoice3Adapter.__new__(OfficialCosyVoice3Adapter)
    adapter.model = FakeModel()
    adapter.torch = FakeTorch()
    adapter.torchaudio = FakeAudio()
    progress = []

    async def on_progress(value, message):
        progress.append((value, message))

    sample = tmp_path / "sample.wav"
    with wave.open(str(sample), "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(16_000)
        writer.writeframes(b"\x01\x00" * (16_000 * 5))
    output = tmp_path / "output.wav"
    await adapter.generate(sample, "  테스트 문장입니다.  ", output, on_progress, asyncio.Event())

    assert adapter.model.call["text"] == "테스트 문장입니다."
    assert adapter.model.call["prompt_wav"] == str(sample)
    assert adapter.model.call["zero_shot_spk_id"] == ""
    assert adapter.model.call["stream"] is True
    assert adapter.torchaudio.saved[0] == str(output)
    assert adapter.torchaudio.saved[2] == 24_000
    assert progress[-1][0] == 100


def test_reference_validation_rejects_over_30_seconds(tmp_path: Path):
    sample = tmp_path / "too-long.wav"
    with wave.open(str(sample), "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(16_000)
        writer.writeframes(b"\x01\x00" * (16_000 * 31))
    with pytest.raises(ValueError, match="30초"):
        OfficialCosyVoice3Adapter._validate_reference(sample)
