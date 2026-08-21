from fastapi import APIRouter, Depends, HTTPException
from app.utils.security import verify_firebase_token
from app.services.mongodb_service import MongoDBService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
async def get_my_profile(decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="UID missing from authentication token.")

    # Try to find user profile in MongoDB
    profile = MongoDBService.get_user_profile(uid)
    
    # If it doesn't exist, auto-create it with default credentials from Firebase
    if not profile:
        email = decoded_token.get("email", "farmer@terrapulse.org")
        name = decoded_token.get("name", "Farmer")
        profile = MongoDBService.create_user_profile(uid, email, name)

    return profile

@router.put("/me")
async def update_my_profile(
    profile_data: dict, 
    decoded_token: dict = Depends(verify_firebase_token)
):
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="UID missing from authentication token.")

    updated_profile = MongoDBService.update_user_profile(uid, profile_data)
    return updated_profile
