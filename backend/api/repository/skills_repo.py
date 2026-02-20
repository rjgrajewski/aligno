from asyncpg import Pool
from typing import List

class SkillsRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_all_skills(self) -> List[dict]:
        query = """
            SELECT 
                MAX(s.uuid::text) as id, 
                COALESCE(s.canonical_skill_name, s.original_skill_name) as name, 
                MAX(s.category) as category,
                COUNT(os.job_url) as frequency
            FROM skills s
            LEFT JOIN offer_skills os ON s.uuid = os.skill_id
            GROUP BY COALESCE(s.canonical_skill_name, s.original_skill_name)
            ORDER BY frequency DESC, name ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                {
                    "id": str(row["id"]), 
                    "name": row["name"], 
                    "category": row["category"],
                    "frequency": row["frequency"]
                }
                for row in rows
            ]
