from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from auth import create_token, verify_credentials

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if not verify_credentials(body.username, body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
        )
    return LoginResponse(access_token=create_token(body.username))
