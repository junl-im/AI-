from starlette.requests import Request

from app.services.proxy_headers import client_address, effective_origin
from app.services.segment_audio import SegmentAudioSigner


def make_request(client_host: str, headers: list[tuple[bytes, bytes]]) -> Request:
    return Request(
        {
            "type": "http",
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/api/v1/connectivity",
            "raw_path": b"/api/v1/connectivity",
            "query_string": b"",
            "headers": headers,
            "client": (client_host, 50000),
            "server": ("api.internal", 8000),
        }
    )


def test_segment_audio_signer_binds_job_index_filename_and_expiry():
    signer = SegmentAudioSigner("test-secret", ttl_seconds=300)
    url = signer.issue("job-1", 1, "segment.wav")
    query = dict(
        item.split("=", 1)
        for item in url.split("?", 1)[1].split("&")
    )

    assert signer.verify(
        "job-1",
        1,
        query["file"],
        int(query["expires"]),
        query["signature"],
    )
    assert not signer.verify(
        "job-2",
        1,
        query["file"],
        int(query["expires"]),
        query["signature"],
    )
    assert not signer.verify(
        "job-1",
        2,
        query["file"],
        int(query["expires"]),
        query["signature"],
    )


def test_untrusted_proxy_headers_are_ignored():
    request = make_request(
        "203.0.113.20",
        [
            (b"host", b"api.internal:8000"),
            (b"x-forwarded-proto", b"https"),
            (b"x-forwarded-host", b"voice.example.com"),
            (b"x-forwarded-for", b"198.51.100.8"),
        ],
    )

    origin = effective_origin(request, ["127.0.0.1/32"])

    assert origin.origin == "http://api.internal:8000"
    assert origin.forwarded_headers_trusted is False
    assert client_address(request, ["127.0.0.1/32"]) == "203.0.113.20"


def test_trusted_proxy_headers_are_normalized():
    request = make_request(
        "10.0.0.5",
        [
            (b"host", b"api.internal:8000"),
            (b"x-forwarded-proto", b"https, http"),
            (b"x-forwarded-host", b"voice.example.com, proxy.internal"),
            (b"x-forwarded-for", b"198.51.100.8, 10.0.0.5"),
        ],
    )

    origin = effective_origin(request, ["10.0.0.0/24"])

    assert origin.origin == "https://voice.example.com"
    assert origin.forwarded_headers_trusted is True
    assert client_address(request, ["10.0.0.0/24"]) == "198.51.100.8"


def test_final_audio_signer_uses_a_separate_signature_domain():
    signer = SegmentAudioSigner("test-secret", ttl_seconds=300)
    url = signer.issue_final("job-1", "final.wav")
    query = dict(
        item.split("=", 1)
        for item in url.split("?", 1)[1].split("&")
    )

    assert signer.verify_final(
        "job-1",
        query["file"],
        int(query["expires"]),
        query["signature"],
    )
    assert not signer.verify_final(
        "job-2",
        query["file"],
        int(query["expires"]),
        query["signature"],
    )
    assert not signer.verify(
        "job-1",
        1,
        query["file"],
        int(query["expires"]),
        query["signature"],
    )
