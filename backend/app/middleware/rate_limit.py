"""
In-memory rate limiter for auth endpoints.
For production, replace with Redis-backed rate limiting.
"""

import time
from collections import defaultdict

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

# Rate limit config: max requests per window
RATE_LIMIT = 10  # max attempts
WINDOW_SECONDS = 60  # per minute

# Paths to rate-limit
RATE_LIMITED_PATHS = {
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/forgot-password",
    "/api/auth/refresh",
}

# In-memory store: { ip_and_path: [(timestamp, ...)] }
_request_log: dict[str, list[float]] = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path in RATE_LIMITED_PATHS:
            client_ip = request.client.host if request.client else "unknown"
            key = f"{client_ip}:{request.url.path}"
            now = time.time()

            # Prune old entries
            _request_log[key] = [
                t for t in _request_log[key] if now - t < WINDOW_SECONDS
            ]

            if len(_request_log[key]) >= RATE_LIMIT:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please try again later.",
                )

            _request_log[key].append(now)

        return await call_next(request)
