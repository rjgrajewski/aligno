import os
import secrets
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

CSRF_COOKIE_NAME = "flowjob_csrf"
CSRF_HEADER_NAME = "x-csrf-token"
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"
SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Double-submit cookie CSRF protection.

    On every response, a non-HttpOnly CSRF token cookie is set so JS can read it.
    On state-changing requests (POST/PUT/DELETE/PATCH), the middleware verifies
    that the X-CSRF-Token header matches the cookie value.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)

        if request.method not in SAFE_METHODS:
            csrf_header = request.headers.get(CSRF_HEADER_NAME)
            if not csrf_cookie or not csrf_header or \
                    not secrets.compare_digest(csrf_header, csrf_cookie):
                raise HTTPException(status_code=403, detail="CSRF validation failed")

        response = await call_next(request)

        if not csrf_cookie:
            token = secrets.token_urlsafe(32)
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=token,
                httponly=False,
                secure=IS_PRODUCTION,
                samesite="strict",
                path="/",
                max_age=72 * 3600,
            )

        return response
