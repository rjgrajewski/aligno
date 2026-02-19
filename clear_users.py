#!/usr/bin/env python3
"""One-off script: clear the users table (and user_skills via CASCADE)."""
import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from urllib.parse import quote_plus

load_dotenv()


def get_dsn() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    if not all([user, password, host, dbname]):
        raise ValueError("Set DATABASE_URL or AWS_DB_USERNAME, AWS_DB_PASSWORD, AWS_DB_ENDPOINT, AWS_DB_NAME in .env")
    user_enc = quote_plus(user)
    pass_enc = quote_plus(password)
    return f"postgresql://{user_enc}:{pass_enc}@{host}:5432/{dbname}"


async def main():
    dsn = get_dsn()
    print("Connecting to database...")
    conn = await asyncpg.connect(dsn)
    try:
        count_before = await conn.fetchval("SELECT COUNT(*) FROM users")
        await conn.execute("TRUNCATE users CASCADE")
        print(f"Cleared table 'users' (removed {count_before} row(s)). user_skills cleared via CASCADE.")
    finally:
        await conn.close()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
