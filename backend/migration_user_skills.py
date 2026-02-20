import asyncio
import os
import sys

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_pool, init_db_pool, close_db_pool

async def migrate():
    await init_db_pool()
    pool = get_db_pool()
    async with pool.acquire() as conn:
        # Drop the old table and any dependencies
        print("Dropping old user_skills table...")
        await conn.execute("DROP TABLE IF EXISTS user_skills;")
        
        # Recreate the table with UUID type for skill_id
        print("Creating new user_skills table...")
        await conn.execute("""
            CREATE TABLE user_skills (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                skill_id UUID REFERENCES skills(uuid) ON DELETE CASCADE,
                skill_type TEXT NOT NULL, -- 'HAS', 'WANTS', 'AVOIDS'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, skill_id, skill_type)
            );
        """)
        
        print("Creating index on user_id...")
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
        """)
        
        print("Migration complete!")
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(migrate())
