from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlsplit

from fastapi import Request

_HOST_PATTERN = re.compile(r"^[A-Za-z0-9.\-:\[\]]+$")


@dataclass(frozen=True)
class EffectiveRequestOrigin:
    origin: str
    forwarded_headers_trusted: bool


Network = ipaddress.IPv4Network | ipaddress.IPv6Network


def trusted_proxy_networks(values: list[str]) -> list[Network]:
    networks: list[Network] = []
    for value in values:
        try:
            networks.append(ipaddress.ip_network(value, strict=False))
        except ValueError:
            continue
    return networks


def is_trusted_proxy(request: Request, configured_cidrs: list[str]) -> bool:
    client_host = request.client.host if request.client else ""
    try:
        address = ipaddress.ip_address(client_host)
    except ValueError:
        return False
    return any(address in network for network in trusted_proxy_networks(configured_cidrs))


def client_address(request: Request, configured_cidrs: list[str]) -> str:
    if is_trusted_proxy(request, configured_cidrs):
        forwarded = request.headers.get("x-forwarded-for", "")
        candidate = forwarded.split(",", 1)[0].strip()
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            pass
    return request.client.host if request.client else "unknown"


def effective_origin(
    request: Request,
    configured_cidrs: list[str],
) -> EffectiveRequestOrigin:
    trusted = is_trusted_proxy(request, configured_cidrs)
    scheme = request.url.scheme
    host = request.headers.get("host", "")
    if trusted:
        forwarded_proto = request.headers.get("x-forwarded-proto", "")
        forwarded_host = request.headers.get("x-forwarded-host", "")
        normalized_proto = forwarded_proto.split(",", 1)[0].strip().lower()
        normalized_host = forwarded_host.split(",", 1)[0].strip()
        if normalized_proto in {"http", "https"}:
            scheme = normalized_proto
        if _valid_host(normalized_host):
            host = normalized_host
    if not _valid_host(host):
        return EffectiveRequestOrigin(
            origin=str(request.base_url).rstrip("/"),
            forwarded_headers_trusted=trusted,
        )
    origin = f"{scheme}://{host}"
    parsed = urlsplit(origin)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        origin = str(request.base_url).rstrip("/")
    return EffectiveRequestOrigin(
        origin=origin,
        forwarded_headers_trusted=trusted,
    )


def _valid_host(value: str) -> bool:
    return bool(value and len(value) <= 255 and _HOST_PATTERN.fullmatch(value))
