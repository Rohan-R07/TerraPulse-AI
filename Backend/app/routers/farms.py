from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.farm import FarmCreate, FarmResponse
from app.services.firestore_service import FirestoreService

router = APIRouter(prefix="/farms", tags=["Farms"])

@router.get("", response_model=List[FarmResponse])
async def list_farms():
    return FirestoreService.get_farms()

@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: str):
    farm = FirestoreService.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

@router.post("", response_model=FarmResponse)
async def create_farm(farm: FarmCreate):
    return FirestoreService.create_farm(farm.dict())
