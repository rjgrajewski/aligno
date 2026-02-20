from asyncpg import Pool
from passlib.hash import bcrypt

class AuthRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def create_user(self, email: str, name: str, password: str) -> dict:
        password_hash = bcrypt.hash(password)
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO users (email, full_name, provider, provider_id, password_hash)
                VALUES ($1, $2, 'email', $1, $3)
                """,
                email.strip().lower(),
                (name or "").strip() or None,
                password_hash,
            )
            row = await conn.fetchrow(
                "SELECT id, email, full_name FROM users WHERE email = $1",
                email.strip().lower(),
            )
            return {
                "id": row["id"],
                "email": row["email"],
                "name": row["full_name"] or row["email"].split("@")[0],
            }

    async def authenticate_user(self, email: str, password: str) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, email, full_name, password_hash FROM users WHERE email = $1 AND provider = 'email'",
                email.strip().lower(),
            )
            if not row or not row["password_hash"]:
                return None
            if not bcrypt.verify(password, row["password_hash"]):
                return None
            return {
                "id": row["id"],
                "email": row["email"],
                "name": row["full_name"] or row["email"].split("@")[0],
            }
