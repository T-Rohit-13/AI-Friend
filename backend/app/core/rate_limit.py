import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class InMemoryRateLimiter:
    """
    Sliding window rate limiter tracking request timestamps per client IP.
    Zero external dependencies needed (redis-free local execution).
    """

    def __init__(self, requests_per_minute: int = 120):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        # Map client_key -> list of timestamp floats
        self.clients: Dict[str, list[float]] = {}

    def is_allowed(self, client_key: str, max_requests: int) -> Tuple[bool, int]:
        now = time.time()
        cutoff = now - self.window_seconds

        # Clean old timestamps
        timestamps = self.clients.get(client_key, [])
        valid_timestamps = [ts for ts in timestamps if ts > cutoff]

        if len(valid_timestamps) >= max_requests:
            retry_after = int(valid_timestamps[0] + self.window_seconds - now) + 1
            self.clients[client_key] = valid_timestamps
            return False, max(retry_after, 1)

        valid_timestamps.append(now)
        self.clients[client_key] = valid_timestamps
        return True, 0


rate_limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract client identifier (IP or Authorization header)
        client_ip = request.client.host if request.client else "127.0.0.1"
        auth_header = request.headers.get("Authorization", "")
        client_key = f"{client_ip}:{auth_header[:25]}" if auth_header else client_ip

        path = request.url.path

        # Stricter limit on auth routes, generous on regular routes
        if path.startswith("/api/v1/auth/login") or path.startswith("/api/v1/auth/register"):
            max_limit = 20  # 20 per minute
        else:
            max_limit = 120 # 120 per minute

        allowed, retry_after = rate_limiter.is_allowed(client_key, max_limit)

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please slow down.",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
