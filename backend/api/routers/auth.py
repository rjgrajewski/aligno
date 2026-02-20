from fastapi import APIRouter, Depends, HTTPException
from backend.database import get_db_pool
from backend.api.repository.auth_repo import AuthRepository
from backend.models import RegisterRequest, LoginRequest
import asyncpg

router = APIRouter(prefix="/api", tags=["auth"])

def get_auth_repo() -> AuthRepository:
    pool = get_db_pool()
    return AuthRepository(pool)

@router.post("/register")
async def register(body: RegisterRequest, repo: AuthRepository = Depends(get_auth_repo)):
    try:
        user_info = await repo.create_user(body.email, body.name, body.password)
        return user_info
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Ten adres e-mail jest już zarejestrowany.")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Błąd zapisu użytkownika. Sprawdź, czy migracja 003 została wykonana (kolumna password_hash).",
        )

@router.post("/login")
async def login(body: LoginRequest, repo: AuthRepository = Depends(get_auth_repo)):
    user_info = await repo.authenticate_user(body.email, body.password)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user_info
