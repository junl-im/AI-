import json

from pydantic import BaseModel

from app.schemas.tts import TtsSynthesisResponse


def encode_result(result: object) -> tuple[str, str]:
    if isinstance(result, TtsSynthesisResponse):
        return "tts-synthesis-response-v1", result.model_dump_json()
    if isinstance(result, BaseModel):
        raise TypeError(
            f"지원하지 않는 영속 작업 결과입니다: {type(result).__name__}"
        )
    return "json-v1", json.dumps(
        result,
        ensure_ascii=False,
        separators=(",", ":"),
    )


def decode_result(result_type: str | None, payload: str) -> object:
    if result_type == "tts-synthesis-response-v1":
        return TtsSynthesisResponse.model_validate_json(payload)
    if result_type == "json-v1":
        return json.loads(payload)
    raise ValueError(f"알 수 없는 작업 결과 형식입니다: {result_type}")
