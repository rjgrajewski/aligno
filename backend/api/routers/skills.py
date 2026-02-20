from fastapi import APIRouter, Depends
from backend.database import get_db_pool
from backend.api.repository.skills_repo import SkillsRepository

router = APIRouter(prefix="/api/skills", tags=["skills"])

def get_skills_repo() -> SkillsRepository:
    pool = get_db_pool()
    return SkillsRepository(pool)

@router.get("")
async def get_skills(repo: SkillsRepository = Depends(get_skills_repo)):
    return await repo.get_all_skills()
