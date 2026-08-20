from fastapi import HTTPException, UploadFile, Header

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def validate_uploaded_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Only JPEG, PNG, and WEBP are allowed."
        )

async def verify_firebase_token(authorization: str = Header(None)):
    if not authorization:
        # For now, allow requests to fall back to demo mode or fail if credentials are required.
        return None
    token = authorization.replace("Bearer ", "")
    # Placeholder: In the future, call firebase_admin.auth.verify_id_token(token)
    return {"uid": "placeholder_farmer_id", "email": "farmer@terrapulse.org"}
