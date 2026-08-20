from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.farm import FieldCreate, FieldUpdate, FieldResponse
from app.services.firestore_service import FirestoreService

router = APIRouter(prefix="/fields", tags=["Fields"])

@router.get("", response_model=List[FieldResponse])
async def list_fields():
    return FirestoreService.get_fields()

@router.get("/{field_id}", response_model=FieldResponse)
async def get_field(field_id: str):
    field = FirestoreService.get_field(field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field

@router.post("", response_model=FieldResponse)
async def create_field(field: FieldCreate):
    # Default to farm-1 if not provided
    data = field.dict()
    data["farm_id"] = "farm-1"
    return FirestoreService.create_field(data)

@router.put("/{field_id}", response_model=FieldResponse)
async def update_field(field_id: str, field: FieldUpdate):
    updated = FirestoreService.update_field(field_id, field.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Field not found")
    return updated
