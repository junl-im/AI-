import pytest

from app.services.voice_review_trust import (
    VoiceReviewTrustConfigurationError,
    VoiceReviewTrustStore,
    parse_trusted_keys_json,
)


def test_trusted_key_json_and_active_key_override():
    values = parse_trusted_keys_json('{"old-key":"old-secret","active-key":"stale"}')
    store = VoiceReviewTrustStore.build(
        active_secret="active-secret",
        active_key_id="active-key",
        trusted_keys=values,
    )

    assert store.trusted_key_ids == ("active-key", "old-key")
    assert store.role_for("active-key") == "active"
    assert store.role_for("old-key") == "previous"
    assert store.secret_for("active-key") == b"active-secret"


def test_trusted_key_json_rejects_non_object_and_empty_secret():
    with pytest.raises(VoiceReviewTrustConfigurationError, match="최상위 값"):
        parse_trusted_keys_json('["not-an-object"]')
    with pytest.raises(VoiceReviewTrustConfigurationError, match="secret"):
        parse_trusted_keys_json('{"old-key":""}')

def test_trusted_key_parser_rejects_ids_that_collide_after_trim() -> None:
    with pytest.raises(VoiceReviewTrustConfigurationError, match="중복"):
        parse_trusted_keys_json('{"old-key":"first"," old-key ":"second"}')


def test_trust_store_normalizes_role_lookup() -> None:
    store = VoiceReviewTrustStore.build(
        active_secret="active-secret",
        active_key_id="active-key",
        trusted_keys={"old-key": "old-secret"},
    )
    assert store.role_for(" old-key ") == "previous"
    assert store.role_for(" active-key ") == "active"

