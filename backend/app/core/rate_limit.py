"""Rate limiting module using slowapi.
Enforces per-IP request limits to protect against brute-force attacks and DDoS.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_client_ip(request: Request) -> str:
    """Extract client IP address, respecting X-Forwarded-For if behind a reverse proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Use first proxy client IP
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return get_remote_address(request) or "127.0.0.1"


# Initialize centralized Limiter instance
limiter = Limiter(
    key_func=get_client_ip,
    default_limits=["120/minute"],
    headers_enabled=False,
    storage_uri="memory://",
)
