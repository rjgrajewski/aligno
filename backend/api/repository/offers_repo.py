from asyncpg import Pool
from typing import List

class OffersRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_all_offers(self) -> List[dict]:
        query = """
            SELECT 
                o.job_url, o.job_title, o.company, o.description,
                array_agg(COALESCE(s.canonical_skill_name, s.original_skill_name)) as skills
            FROM offers o
            LEFT JOIN offer_skills os ON o.job_url = os.job_url
            LEFT JOIN skills s ON os.skill_id = s.uuid
            GROUP BY o.job_url, o.job_title, o.company, o.description
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            
            results = []
            for row in rows:
                # Filter out None values from skills array if any
                skills_list = [s for s in row["skills"] if s] if row["skills"] else []
                results.append({
                    "id": row["job_url"], # Using URL as ID for frontend
                    "title": row["job_title"],
                    "company": row["company"],
                    "requiredSkills": skills_list,
                    "description": row["description"]
                })
            return results
