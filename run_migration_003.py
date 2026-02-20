#!/usr/bin/env python3
"""Run migration 003_email_password_auth.sql using .env credentials."""
import asyncio
import os
import sys
from pathlib import Path

# load .env from repo root
repo_root = Path(__file__).resolve().parent
sys.path.insert(0, str(repo_root))
os.chdir(repo_root)

from dotenv import load_dotenv
load_dotenv()

async def main():
    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    if not all([user, password, host, dbname]):
        url = os.getenv("DATABASE_URL")
        if not url:
            print("Missing DB credentials: set AWS_DB_* or DATABASE_URL in .env", file=sys.stderr)
            sys.exit(1)
        dsn = url
    else:
        dsn = f"postgres://{user}:{password}@{host}:5432/{dbname}"

    sql = (repo_root / "src/sql/migrations/003_email_password_auth.sql").read_text()
    import asyncpg
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(sql)
        print("Migration 003 applied: password_hash column added to users.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
