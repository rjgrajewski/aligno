import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

_db_pool: asyncpg.Pool = None

async def init_db_pool():
    global _db_pool
    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    
    if not all([user, password, host, dbname]):
        raise ValueError("Database credentials missing in .env file")
        
    dsn = f"postgres://{user}:{password}@{host}:5432/{dbname}"
    
    _db_pool = await asyncpg.create_pool(dsn, min_size=1, max_size=10)

async def close_db_pool():
    global _db_pool
    if _db_pool:
        await _db_pool.close()

def get_db_pool() -> asyncpg.Pool:
    if not _db_pool:
        raise Exception("Database pool is not initialized")
    return _db_pool
