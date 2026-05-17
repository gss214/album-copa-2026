from __future__ import annotations

import time
from collections import defaultdict

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Request, status

from auth import create_token, verify_credentials

router = APIRouter()

# {ip: [timestamp, ...]} — sliding window rate limiter
_attempts: dict[str, list[float]] = defaultdict(list)
_WINDOW = 60   # seconds
_MAX = 10      # attempts per window


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    window = _attempts[ip] = [t for t in _attempts[ip] if now - t < _WINDOW]
    if len(window) >= _MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Tente novamente mais tarde.",
        )
    window.append(now)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(request: Request, body: LoginRequest):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)
    if not verify_credentials(body.username, body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
        )
    return LoginResponse(access_token=create_token(body.username))
