from starlette.datastructures import Headers
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import PlainTextResponse, Response


_PRIVATE_NETWORK_REQUEST_HEADER = "Access-Control-Request-Private-Network"
_PRIVATE_NETWORK_REQUEST_HEADER_BYTES = _PRIVATE_NETWORK_REQUEST_HEADER.lower().encode()
_PRIVATE_NETWORK_ALLOW_HEADER = "Access-Control-Allow-Private-Network"


class PrivateNetworkCORSMiddleware(CORSMiddleware):
    """CORS middleware with explicit Private Network Access preflight support.

    Some Starlette releases reject the Private Network Access extension header
    before application middleware can append the matching allow header. Filter
    only that extension header for the standard CORS validation, then restore
    the PNA decision without weakening origin, method, or requested-header checks.
    """

    def __init__(self, app, *, allow_private_network: bool = False, **kwargs):
        super().__init__(app, **kwargs)
        self.allow_private_network = allow_private_network

    def preflight_response(self, request_headers: Headers) -> Response:
        private_network_requested = (
            request_headers.get(_PRIVATE_NETWORK_REQUEST_HEADER, "").lower()
            == "true"
        )
        cors_headers = request_headers
        if private_network_requested:
            cors_headers = Headers(
                raw=[
                    (name, value)
                    for name, value in request_headers.raw
                    if name.lower() != _PRIVATE_NETWORK_REQUEST_HEADER_BYTES
                ]
            )

        response = super().preflight_response(request_headers=cors_headers)
        if not private_network_requested:
            return response

        if not self.allow_private_network:
            headers = dict(response.headers)
            headers.pop(_PRIVATE_NETWORK_ALLOW_HEADER.lower(), None)
            return PlainTextResponse(
                "Disallowed CORS private-network",
                status_code=400,
                headers=headers,
            )

        if response.status_code < 400:
            response.headers[_PRIVATE_NETWORK_ALLOW_HEADER] = "true"
        return response
