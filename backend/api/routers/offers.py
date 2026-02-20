from fastapi import APIRouter, Depends
from backend.database import get_db_pool
from backend.api.repository.offers_repo import OffersRepository

router = APIRouter(prefix="/api/offers", tags=["offers"])

def get_offers_repo() -> OffersRepository:
    pool = get_db_pool()
    return OffersRepository(pool)

@router.get("")
async def get_offers(repo: OffersRepository = Depends(get_offers_repo)):
    return await repo.get_all_offers()
